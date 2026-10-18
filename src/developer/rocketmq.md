---
title: "RocketMQ 高频问题整理"
permalink: "developer/rocketmq.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "rocketmq"
---
## RocketMQ 核心组件有哪些？ {#rocketmq-components}

### 面试快答

RocketMQ 通过生产者发送、Broker 存储、消费者处理，NameServer 提供路由发现。不同大版本还可能引入 Proxy、Controller 等组件，拓扑要按实际部署解释。

### 详细解析

理解消息写入、路由刷新和消费位点的路径，比背组件名更重要。排障先判断发送失败、Broker 存储问题还是消费端处理慢，并记录消息业务标识。

| 组件 | 职责 | 说明 |
| --- | --- | --- |
| NameServer | 路由注册与发现 | 无状态、轻量级，Broker 和客户端都向它注册/拉取路由信息 |
| Broker | 消息存储与转发 | 核心节点，负责接收、持久化、投递消息，支持主从部署 |
| Producer | 消息生产者 | 发送消息到指定 Topic，可选择队列、顺序键、事务消息等 |
| Consumer | 消息消费者 | 以 Push 或 Pull 方式消费，按 ConsumerGroup 分摊队列 |
| Topic | 消息主题 | 业务分类维度，例如 `order_topic`、`payment_topic` |
| MessageQueue | 主题下的队列 | 负载均衡和顺序消费的最小单位，一个 Topic 通常包含多个 Queue |
| ConsumerGroup | 消费者组 | 同组内分摊消费，不同组之间消费进度独立 |

#### 消息流转路径

```java
Producer
-> 从 NameServer 获取 Topic 路由
-> 选择 Broker / MessageQueue 发送消息
-> Broker 写入 CommitLog 并建立 ConsumeQueue 索引
-> Consumer 从 NameServer 获取路由
-> 拉取 / 推送消息并更新 Offset
```

#### 与 Kafka 的架构差异（简要）

-   RocketMQ 用 NameServer 做路由中心，Kafka 用 ZooKeeper / KRaft 管理元数据。
-   RocketMQ 的 Broker 同时承担存储和队列索引（CommitLog + ConsumeQueue），Kafka 以 Partition 日志为核心。
-   RocketMQ 原生支持事务消息、延迟消息、死信队列，更偏业务消息场景。

## RocketMQ 如何保证消息不丢？ {#rocketmq-message-loss}

### 面试快答

防丢要覆盖发送确认、Broker 持久化与复制、消费确认和业务落库全链路。任何环节都要定义故障窗口，并用幂等、对账和补偿兜底。

### 详细解析

发送超时不等于 Broker 未收到；消费应在业务状态可靠提交后确认。配置同步刷盘或复制也要说明故障模型与吞吐代价，不宣称绝对不丢。

#### 三阶段保障

| 阶段 | 丢失场景 | 保障手段 |
| --- | --- | --- |
| 生产端 | 发送超时、网络抖动、Broker 未确认 | 同步发送 + 检查 `SendResult`，失败重试，必要时落库补偿 |
| Broker | 机器宕机、磁盘损坏、主从未复制 | 同步刷盘 + 同步主从复制，多副本部署 |
| 消费端 | 业务未处理完就提交 Offset | 业务成功后再返回 `CONSUME_SUCCESS`，失败返回重试 |

#### 生产端

-   关键业务优先使用**同步发送**，确认 Broker 返回 `SEND_OK` 后再认为发送成功。
-   异步发送需实现回调，失败时记录日志并补偿重发。
-   对极高可靠场景，可配合本地消息表：先写 DB 再发 MQ，定时任务扫描未发送记录。

```java
SendResult result = producer.send(msg);
if (result.getSendStatus() != SendStatus.SEND_OK) {
    // 记录失败，触发重试或告警
}
```

#### Broker 端

| 配置项 | 选项 | 可靠性 | 性能 |
| --- | --- | --- | --- |
| 刷盘策略 flushDiskType | SYNC\_FLUSH / ASYNC\_FLUSH | 同步刷盘更高 | 异步刷盘更快 |
| 主从复制 brokerRole | SYNC\_MASTER / ASYNC\_MASTER | 同步复制更高 | 异步复制更快 |

最高可靠组合是**同步刷盘 + 同步主从复制**，但吞吐和延迟会明显下降，一般只在金融、支付等强一致场景使用。

#### 消费端

1.  业务逻辑处理成功后再返回消费成功，不要先提交 Offset 再执行业务。
2.  消费失败返回 `RECONSUME_LATER`，让 Broker 进入重试队列。
3.  必须做幂等，因为重试和网络抖动会导致重复消费。

## RocketMQ 顺序消息怎么实现？ {#rocketmq-ordered-message}

### 面试快答

顺序消息把同一业务分组按顺序发送并有序消费，通常只保证分组或队列内顺序。它牺牲部分并行度，失败重试可能阻塞同组后续消息。

### 详细解析

业务 key 要稳定，例如订单 ID；同一订单多线程发送仍需定义生产顺序。扩容和路由变化可能影响分组分配，版本不同对 MessageGroup 等接口支持也不同。

#### 实现原理

顺序消息的核心约束是：**同一业务键的消息进入同一个 MessageQueue，且该 Queue 只被一个 Consumer 线程顺序消费**。

```java
orderId = 10001
-> Producer 按 orderId 选择固定 MessageQueue
-> 该 Queue 内消息天然有序
-> Consumer 对该 Queue 单线程顺序拉取
```

#### 生产端：选择队列

```java
producer.send(msg, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        Long orderId = (Long) arg;
        int index = (int) (orderId % mqs.size());
        return mqs.get(index);
    }
}, orderId);
```

#### 消费端：顺序消费

-   使用 `MessageListenerOrderly`，RocketMQ 会对每个 Queue 加锁，保证同一时刻只有一个线程消费该 Queue。
-   消费失败会暂停当前 Queue 的消费，而不是立刻跳过，避免乱序。

```java
consumer.registerMessageListener(new MessageListenerOrderly() {
    @Override
    public ConsumeOrderlyStatus consumeMessage(
            List<MessageExt> msgs, ConsumeOrderlyContext context) {
        // 按 Queue 顺序处理
        return ConsumeOrderlyStatus.SUCCESS;
    }
});
```

#### 全局顺序 vs 局部顺序

| 类型 | 做法 | 吞吐 | 适用场景 |
| --- | --- | --- | --- |
| 全局顺序 | Topic 只设 1 个 Queue，单消费者 | 最低 | 极少使用，如全局流水账 |
| 局部顺序 | 按业务键哈希到固定 Queue | 较高 | 订单状态流转、账户流水 |

#### 注意点

-   Consumer 实例数不应超过 Queue 总数，否则部分实例空闲，且可能影响顺序分摊。
-   Broker 宕机、Queue 迁移时可能短暂影响顺序，需要业务侧容忍或补偿。
-   顺序消费失败会阻塞该 Queue，需快速处理异常，避免“一条 poison message 卡死整队列”。

## RocketMQ 事务消息原理？ {#rocketmq-transaction-message}

### 面试快答

事务消息用半消息、本地事务和回查协调消息可见性与本地操作结果，适合最终一致场景。回查必须能依据持久化业务状态判定，而非依赖进程内变量。

### 详细解析

它不提供跨服务数据库 ACID 事务，也不保证消费端恰好一次执行。长期未知状态、回查上限和人工补偿都要有监控及处理流程。

#### 完整流程

```java
1. Producer 发送 Half Message（半消息）到 Broker
2. Broker 存储半消息，但暂不投递给消费者
3. Producer 执行本地事务（如写订单表）
4. Producer 向 Broker 发送 Commit 或 Rollback
   - Commit：半消息变为正常消息，可被消费
   - Rollback：删除半消息，消费者永远看不到
5. 若 Producer 未响应（宕机/超时），Broker 定时回查 Producer 本地事务状态
6. Producer 实现 checkLocalTransaction 返回最终状态
```

#### 半消息的作用

半消息对消费者不可见，避免“本地事务还没提交，下游已经消费”的问题。只有本地事务成功后，消息才会真正投递。

#### 代码骨架

```java
TransactionListener listener = new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            orderService.createOrder(arg);
            return LocalTransactionState.COMMIT_MESSAGE;
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }

    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // Broker 回查：查 DB 订单是否存在
        return orderService.exists(msg.getKeys())
            ? LocalTransactionState.COMMIT_MESSAGE
            : LocalTransactionState.ROLLBACK_MESSAGE;
    }
};
```

#### 一致性级别

-   保证的是**最终一致性**，不是强一致。
-   回查机制解决 Producer 宕机导致状态未知的问题，但回查有延迟。
-   消费者仍需幂等，因为 Commit 后消息可能被重复投递。

#### 与本地消息表对比

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| RocketMQ 事务消息 | 框架原生支持，链路清晰 | 依赖 MQ 实现，回查逻辑需业务实现 |
| 本地消息表 | 不依赖 MQ 特性，通用 | 需要额外扫表任务，开发成本高 |

## ConsumerGroup 是什么？ {#rocketmq-consumer-group}

### 面试快答

ConsumerGroup 表示相同消费逻辑的一组实例，集群消费通常在组内分摊消息，不同组各自消费。广播模式让每个实例接收，但能力与故障处理需按版本确认。

### 详细解析

同一组实例应订阅一致的主题和过滤规则，避免行为难以预测。业务角色不同应分组，不能通过随机改组名解决堆积，否则可能重新消费或丢失原进度。

#### 核心规则

-   同一 ConsumerGroup 内的多个 Consumer 实例**分摊** Topic 下的 MessageQueue，每条消息只被组内一个实例消费。
-   不同 ConsumerGroup 之间消费进度**完全独立**，同一条消息可被多个组分别消费。
-   一个 Consumer 实例可以订阅多个 Topic，但同一 Group 内所有实例的订阅关系应一致。

#### 负载均衡示例

```text
Topic order_topic 有 4 个 Queue: Q0 Q1 Q2 Q3
ConsumerGroup G1 有 2 个实例: C1, C2

分配结果（Rebalance 后）:
C1 -> Q0, Q1
C2 -> Q2, Q3
```

#### 典型用法

| 场景 | ConsumerGroup 设计 |
| --- | --- |
| 订单服务消费下单消息 | `order-service-group` |
| 库存服务消费同一 Topic | `inventory-service-group`（独立进度） |
| 同一服务水平扩容 | 同 Group 加 Consumer 实例，自动 Rebalance |

#### Rebalance（重平衡）

当 Consumer 实例上下线、Topic Queue 数量变化时，Broker 协调 ConsumerGroup 重新分配 Queue。Rebalance 期间可能短暂停止消费，生产环境应尽量避免频繁扩缩容。

## RocketMQ Offset 是什么？ {#rocketmq-offset}

### 面试快答

Offset 表示消息在队列中的逻辑位置或消费者进度，不同队列的值不能直接比较。消费确认和位点提交决定故障恢复后从哪里继续。

### 详细解析

重置位点前评估重放范围、幂等和外部副作用，并保留审计。监控积压数量还要看最老消息年龄与业务截止时间，不能只看单个 offset 数值。

#### 存储维度

Offset 的粒度是 **ConsumerGroup + MessageQueue**，不是 Topic 级别。同一 Topic 的不同 Queue 各自维护独立 Offset。

```text
ConsumerGroup: order-group
MessageQueue: order_topic-Q0 -> Offset = 1523
MessageQueue: order_topic-Q1 -> Offset = 891
MessageQueue: order_topic-Q2 -> Offset = 2047
```

#### Offset 存储位置

| 模式 | 存储位置 | 说明 |
| --- | --- | --- |
| 集群消费（默认） | Broker 端 | Consumer 定期向 Broker 提交 Offset，重启后从 Broker 恢复 |
| 广播消费 | Consumer 本地 | 每个实例各自维护 Offset，存在本地文件 |

#### 提交时机与风险

| 提交时机 | 风险 |
| --- | --- |
| 业务处理前提交 | Consumer 宕机后消息丢失（消费了但未处理） |
| 业务处理后提交 | Consumer 宕机后可能重复消费（处理了但未提交） |

RocketMQ 默认在业务返回 `CONSUME_SUCCESS` 后提交 Offset，属于“至少一次投递”语义，因此消费端必须幂等。

#### 消费进度管理

-   可通过 RocketMQ Console 或 `mqadmin consumerProgress` 查看各 Group 的消费延迟。
-   重置 Offset 需谨慎，可能导致大量重复消费或跳过未消费消息。

## 如何处理重复消费？ {#rocketmq-duplicate-consumption}

### 面试快答

MQ 常提供至少一次投递，重复消费需要业务幂等：以稳定业务键建立唯一约束或状态机，并把去重标记与业务修改原子提交。

### 详细解析

先写缓存“已处理”再操作数据库会在失败时丢业务，反过来也可能重复。优先用同库事务保护处理记录与业务结果，跨系统则配合幂等接口和对账。

#### 重复消费来源

-   Producer 发送超时后重试，Broker 可能写入两条相同业务消息。
-   Consumer 业务处理成功但 Offset 提交前宕机，重启后重新消费。
-   Consumer 返回 `RECONSUME_LATER` 进入重试队列，再次投递。
-   Rebalance 导致消息被重新分配消费。

#### 幂等方案

| 方案 | 实现方式 | 适用场景 |
| --- | --- | --- |
| 数据库唯一索引 | 以业务 ID 做唯一键，重复插入失败 | 订单创建、支付流水 |
| 状态机 | 只允许特定状态流转，重复消息被忽略 | 订单状态变更 |
| Redis 去重 | `SETNX msgId 1 EX 86400` | 高频、允许短暂窗口 |
| 去重表 | 消费前查/插消费记录表 | 通用、可审计 |

#### 推荐做法

```java
public void onMessage(MessageExt msg) {
    String bizId = msg.getKeys(); // 或 msgId
    if (dedupService.exists(bizId)) {
        return; // 已处理，直接返回成功
    }
    try {
        businessService.process(msg);
        dedupService.markProcessed(bizId);
    } catch (Exception e) {
        throw e; // 触发重试
    }
}
```

#### 设计原则

1.  消费逻辑设计为幂等，不要依赖“只会执行一次”。
2.  优先使用业务唯一键（订单号、流水号），而非 MQ 的 msgId。
3.  去重标记的写入应与业务操作在同一事务内，避免“标记成功但业务失败”。

## 同步发送、异步发送、单向发送有什么区别？ {#rocketmq-send-modes}

### 面试快答

同步发送等待结果，异步发送通过回调或 Future 观察结果，单向发送通常不等待确认。选择依据可靠性、延迟和吞吐需求，异步不代表无需处理失败。

### 详细解析

回调线程应避免耗时任务，重试要考虑消息已被接收但响应丢失的情况。关键业务不宜仅靠单向发送，应保存待发送状态和可恢复记录。

| 对比项 | 同步发送 | 异步发送 | 单向发送 |
| --- | --- | --- | --- |
| 是否阻塞 | 阻塞等待响应 | 非阻塞，回调通知 | 发完即返回 |
| 可靠性 | 最高 | 较高（需处理回调失败） | 最低，可能丢失 |
| 吞吐 | 较低 | 最高 | 高 |
| 适用场景 | 支付、订单等关键业务 | 日志、通知等高频场景 | 监控埋点、可丢数据 |

#### 同步发送

```java
SendResult result = producer.send(msg);
// 阻塞直到 Broker 返回 SEND_OK 或异常
```

#### 异步发送

```java
producer.send(msg, new SendCallback() {
    @Override
    public void onSuccess(SendResult result) { /* 记录成功 */ }

    @Override
    public void onException(Throwable e) { /* 重试或告警 */ }
});
```

#### 单向发送

```java
producer.sendOneway(msg);
// 不等待任何响应，无法感知发送是否成功
```

#### 选择建议

-   涉及资金、状态变更：同步发送。
-   高并发、允许短暂延迟感知失败：异步发送 + 失败补偿。
-   日志采集、指标上报等可丢场景：单向发送。

## RocketMQ 如何做消息过滤？ {#rocketmq-message-filter}

### 面试快答

消息可按 Topic、Tag 或属性表达式等方式筛选，能力取决于客户端与服务端版本和配置。过滤减少无关传输，但不承担租户鉴权或数据安全边界。

### 详细解析

订阅规则应在同组保持一致，评估复杂过滤的 Broker 开销。变更过滤条件前确认是否要补历史消息，不能认为修改订阅会自动重放已跳过的数据。

#### Tag 过滤（Broker 端，最常用）

Producer 发送时设置 Tag，Consumer 订阅时指定 Tag 表达式（支持 `||` 逻辑或）。

```java
// Producer
msg.setTags("create || pay");

// Consumer 订阅
consumer.subscribe("order_topic", "create || pay");
```

Broker 在 ConsumeQueue 索引中存储 Tag hashcode，过滤效率高，适合 Tag 数量有限的场景。

#### SQL92 过滤（Broker 端）

基于消息 UserProperty 做 SQL 表达式过滤，例如 `age > 18 AND city = 'beijing'`。

-   需要在 Broker 开启 `enablePropertyFilter=true`。
-   灵活但性能低于 Tag 过滤，属性需设为 UserProperty。

#### Consumer 端过滤

Consumer 订阅全部消息（`*`），在 `MessageListener` 中自行判断，不符合则返回成功跳过。

-   优点：逻辑灵活，可依赖外部状态。
-   缺点：所有消息都传到 Consumer，浪费带宽和 CPU。

#### 对比

| 方式 | 过滤位置 | 性能 | 灵活性 |
| --- | --- | --- | --- |
| Tag 过滤 | Broker | 高 | 中（Tag 数量有限） |
| SQL92 过滤 | Broker | 中 | 高 |
| Consumer 过滤 | Consumer | 低 | 最高 |

## RocketMQ 延迟消息支持任意时间吗？ {#rocketmq-delay-message}

### 面试快答

延迟消息用于在未来投递提醒、检查和补偿，支持固定等级还是指定时间取决于 RocketMQ 版本与配置。到达投递时间不代表业务精确准时执行。

### 详细解析

消费者仍要校验当前业务状态与幂等，例如订单已支付就不应再关闭。关注可设置时间范围、积压、时钟偏差和失败重试，强实时调度应独立评估。

#### 先说版本

RocketMQ 4.x 常见延迟等级机制；5.x 的定时消息支持按投递时间戳表达。支持的时间范围、精度、Topic 配置和客户端接口以具体版本与部署配置为准，不能笼统说开源版不支持指定时间。

#### 业务语义

投递时间只是消息可被投递的时点，消费还可能因积压、重试和故障延后。到期关单要查询当前订单状态，已支付或已取消时不应重复处理。

#### 可靠处理

使用稳定业务键实现幂等，记录实际处理延迟与失败，必要时配合扫表补偿。强实时调度与一般业务到期检查有不同要求，不应只因为支持定时消息就承诺精确执行时刻。

#### 参考资料

[RocketMQ 定时消息](https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/)（2026-10-18 核验，注意目标部署版本。）

## RocketMQ 消费失败后重试流程是什么？ {#rocketmq-retry}

### 面试快答

消费失败应返回明确失败或抛出可识别异常，按策略延迟重试，超过上限进入死信或人工处置。业务提交成功后才能确认，重试全过程都要幂等。

### 详细解析

区分暂时故障、参数错误和永久业务拒绝；永久错误反复重试只会放大故障。死信需有告警、归因、修复和受控重放，不能只积存在队列里。

#### 重试流程

```text
1. Consumer 消费消息，业务处理失败
2. 返回 RECONSUME_LATER（或抛异常）
3. Broker 将消息写入重试 Topic: %RETRY%{ConsumerGroup}
4. 等待重试间隔（默认 16 级递增延迟）
5. 定时任务将消息重新投递到原 Topic Queue
6. Consumer 再次消费
7. 成功 -> 正常提交 Offset；失败 -> 重复步骤 3-6
8. 超过 maxReconsumeTimes（默认 16）-> 进入 DLQ
```

#### 默认重试间隔

与延迟消息共用 18 级：10s、30s、1min、2min、3min…最长 2h。第 N 次重试使用第 N 级间隔。

#### Consumer 端控制

```java
// 返回成功，提交 Offset
return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;

// 返回稍后重试
return ConsumeConcurrentlyStatus.RECONSUME_LATER;
```

#### 注意点

-   重试消息可能被不同 Consumer 实例消费，必须幂等。
-   顺序消费（Orderly）失败会阻塞当前 Queue，不会立即进入重试队列。
-   大量重试会导致消息堆积，需监控重试队列深度。
-   对于确定性失败（如参数校验不通过），应直接返回 SUCCESS 并记录，避免无意义重试。

## RocketMQ 如何保证 Broker 高可用？ {#rocketmq-broker-ha}

### 面试快答

Broker 高可用依赖副本、故障检测、主角色选举和客户端路由刷新。刷盘与副本确认策略决定故障下可能丢失的数据窗口，需要以部署模式验证。

### 详细解析

异步复制延迟低但存在未复制数据风险，同步复制增加确认成本也仍需定义选举和磁盘故障边界。用故障演练记录恢复时间与可用性，而非只看副本数。

#### 部署架构

```java
Master Broker（可读写）
    |
    | 同步/异步复制
    v
Slave Broker（只读，热备）

Producer / Consumer 通过 NameServer 发现 Master 地址
Master 宕机后，Slave 可手动或自动切换为 Master
```

#### 关键机制

| 机制 | 说明 |
| --- | --- |
| 主从复制 | Master 写入后复制到 Slave，Slave 可承担读请求 |
| 同步刷盘 | 消息落盘后才返回 Producer 确认 |
| 同步复制 | Master 和 Slave 都写入成功才返回确认 |
| DLedger 模式（4.x+） | 基于 Raft 的多副本自动选主，无需手动切换 |
| 多 Master 部署 | 多个 Master-Slave 组，单组故障不影响其他组 |

#### DLedger 高可用（推荐）

RocketMQ 4.5+ 引入 DLedger CommitLog，基于 Raft 协议实现多副本自动选主：

-   3 个或更多 Broker 组成一组，自动选举 Leader。
-   Leader 宕机后自动选出新 Leader，无需人工介入。
-   消息写入多数派副本后才确认，保证不丢。

#### 故障切换注意

-   传统 Master-Slave 模式下，Master 宕机需手动将 Slave 提升为 Master，或有外部工具（如 RocketMQ Controller）自动切换。
-   异步复制模式下，Master 宕机可能丢失未同步到 Slave 的消息。
-   Producer 应配置多个 NameServer 地址，Consumer 应能感知 Broker 变化。

## RocketMQ 如何处理消息堆积？ {#rocketmq-message-backlog}

### 面试快答

先比较生产速率和有效消费速率，再判断瓶颈在队列并行度、处理逻辑、下游容量还是异常重试。扩消费者只有在并行度和下游允许时才有效。

### 详细解析

按最老消息年龄、业务优先级和恢复预算治理积压；批量、隔离慢任务和降级需要同时保证幂等。顺序分组不能随意拆散，扩队列也不一定立即重分历史积压。

#### 排查步骤

1.  确认是全局堆积还是个别 Queue 堆积（可能是热点或顺序消费阻塞）。
2.  检查 Consumer 是否存活、是否有异常日志、是否消费过慢。
3.  检查 Producer 是否突发流量或重试风暴。
4.  查看 Broker 磁盘使用和消息保留策略。

#### 应急处理

| 手段 | 做法 | 注意 |
| --- | --- | --- |
| 扩容 Consumer | 增加同 Group 实例数（不超过 Queue 数） | 触发 Rebalance，短暂停消费 |
| 提升消费并行度 | 增加 `consumeThreadMin/Max` | 需保证幂等和 DB 连接池容量 |
| 临时 Consumer 快速消费 | 部署只落库不处理的临时消费者 | 后续异步补偿业务 |
| 跳过堆积消息 | 重置 Offset 到最新 | 会丢消息，仅极端场景 |
| 限流 Producer | 上游降级或限流 | 防止堆积加剧 |

#### 长期治理

-   消费逻辑异步化：Consumer 只做校验和落库，业务处理交给线程池或下游 MQ。
-   增加 Queue 数量并扩容 Broker，提升并行消费能力。
-   设置消息 TTL 和过期策略，避免无限堆积。
-   监控 Consumer Lag，堆积超过阈值自动告警和扩容。

## RocketMQ 和 Kafka 在设计目标上有什么区别？ {#rocketmq-vs-kafka}

### 面试快答

两者都支持持久化消息和高吞吐，但生态、分区/队列模型、消费协议和事务等能力不同。应从业务语义、延迟、重放、运维经验与版本实测选型。

### 详细解析

不要用“Kafka 只适合日志、RocketMQ 只适合交易”代替评估。准备统一负载、失败与恢复场景，比较端到端吞吐、P99、积压恢复和运营成本。

| 对比项 | RocketMQ | Kafka |
| --- | --- | --- |
| 设计目标 | 业务消息中间件，服务解耦、异步、事务 | 分布式流平台，日志采集、流处理、大数据 |
| 消息语义 | 丰富：事务消息、延迟消息、死信队列 | 相对简单，依赖外部组件补充 |
| 消费模型 | Push 为主，ConsumerGroup 分摊 | Pull 为主，Consumer Group 分摊 |
| 存储模型 | CommitLog + ConsumeQueue 索引 | Partition 顺序日志 |
| 路由中心 | NameServer（轻量无状态） | ZooKeeper / KRaft |
| 顺序消息 | 原生支持，Queue 级顺序 | Partition 内有序 |
| 延迟消息 | 原生支持（固定级别） | 不原生支持 |
| 事务消息 | 原生 Half Message 机制 | 0.11+ 支持事务，但使用较少 |
| 吞吐量 | 高（十万级 TPS） | 极高（百万级 TPS） |
| 消息回溯 | 支持，按 Offset 或时间 | 支持，按 Offset 或时间戳 |
| 生态 | 阿里系、国内业务场景广泛 | 流处理生态强（Kafka Streams、Flink） |

#### 选型建议

-   **选 RocketMQ**：电商订单、支付通知、事务消息、延迟消息、国内微服务解耦。
-   **选 Kafka**：日志采集、指标上报、大数据管道、流式计算、超高吞吐场景。
-   两者并非互斥，很多公司 Kafka 做数据采集，RocketMQ 做业务消息。

#### 取舍与验证

1.  RocketMQ 偏**业务消息**，功能丰富，开箱即用的事务/延迟/死信能力是其优势。
2.  Kafka 偏**流式数据平台**，吞吐更高，与大数据生态深度集成。
3.  具体选型看业务需求：可靠性功能 vs 吞吐和流处理能力。
