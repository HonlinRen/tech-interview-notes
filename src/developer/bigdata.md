---
title: "大数据 高频问题整理"
permalink: "developer/bigdata.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "bigdata"
---
## Elasticsearch 是什么？ {#elasticsearch-intro}

### 面试快答

Elasticsearch 提供基于倒排索引的搜索与聚合，适合全文检索、日志和相关查询。它通常不是业务交易的唯一权威存储，需要明确与数据库同步及更新延迟。

### 详细解析

关注分词、字段映射、分片、查询模式和 refresh 延迟。批量写入、深分页与聚合可能消耗大量资源，选型前用真实索引与查询验证。

#### 核心概念

| 概念 | 说明 |
| --- | --- |
| Index | 逻辑索引，类似数据库 |
| Document | JSON 文档，类似一行记录 |
| Shard | 分片，数据水平拆分，支持扩展 |
| Replica | 副本，高可用与读扩展 |
| Inverted Index | 倒排索引，按词项快速定位文档 |

#### 特点与适用场景

-   **擅长**：日志检索（ELK）、商品/文档全文搜索、监控指标聚合、RAG 混合检索中的 BM25（经典关键词相关性打分算法）层。
-   **能力**：近实时 NRT（Near Real-Time，写入后秒级可搜）、分布式、REST API、聚合（Aggregation，类似 GROUP BY + 统计）能力强。
-   **不擅长**：强事务、复杂 JOIN、高频单行更新（偏分析检索，而非 OLTP 那种频繁改单行）。

#### 与同类组件

| 组件 | 差异 |
| --- | --- |
| MySQL | ES 倒排索引做搜索/聚合；MySQL B+ 树做点查与事务 |
| ClickHouse | ES 偏全文与灵活表结构（schema）；ClickHouse 偏列存 OLAP（联机分析处理） |
| Hive | ES 在线低延迟检索；Hive 离线批处理数仓（存 HDFS 上的历史明细） |

## 大数据常见流程是什么？ {#bigdata-common-flow}

### 面试快答

常见数据链路包括采集、消息传输、离线或流式处理、存储和服务查询。Hadoop、Hive、Spark、Flink 等承担不同职责，应按时效、规模和一致性要求组合。

### 详细解析

后端社招重点说清数据来源、幂等、乱序、迟到、回放与对账。冷热存储按访问与保留策略分层，具体执行引擎和表格式能力以部署版本为准。

```bash
数据源（业务库 / 日志 / 埋点 / IoT 物联网设备）
  ↓ 采集
Kafka / Flume（日志采集）/ Canal（MySQL 变更 CDC）/ Debezium（多数据库 CDC）
  ↓ 存储
Hive / HDFS / 对象存储 / Iceberg（数据湖表格式）
  ↓ 计算
Spark / Flink（批处理 + 流处理）
  ↓ 服务层
Elasticsearch / ClickHouse / MySQL / Redis
  ↓ 应用
BI 报表 / 搜索 / 推荐 / 监控告警
```

#### 各阶段说明

| 阶段 | 常见组件 | 作用 |
| --- | --- | --- |
| 采集 | Kafka、Flume、Logstash、Canal | 高吞吐接入、削峰、解耦；Canal 等做 CDC（同步数据库变更） |
| 存储 | Hive、HDFS、Iceberg、Hudi | 低成本存海量原始/明细数据（即「入湖」） |
| 计算 | Spark（批）、Flink（流） | ETL（清洗转换）、聚合、实时指标、宽表（多表拼成一张大表）构建 |
| 服务 | Elasticsearch、ClickHouse、Redis | 低延迟检索与分析查询 |
| 应用 | Kibana、Grafana、Superset、自研 API | 可视化、搜索、业务决策 |

#### 批流与架构模式

-   **离线批（T+1）**：Kafka/HDFS → Spark → Hive 汇总层（DWS）→ BI 报表，准确但延迟高。
-   **实时流**：Kafka → Flink → Redis/ClickHouse/ES，秒级指标与告警。
-   **Lambda**：批层 + 速层（实时层）并行，批结果修正流层误差。
-   **湖仓一体**：Kafka 入湖（写入 Iceberg/Hudi 等数据湖表）→ Spark/Flink 统一批流计算 → 多引擎查询。

#### ES 在链路中的位置

日志/业务数据经 Kafka 接入 → Flink/Spark 清洗聚合 → 写入 ES 供检索；原始明细仍可落 Hive/HDFS 做离线分析。**ES 负责在线查询，离线仓（Hive 等）负责全量历史。**

## Kafka 是什么？ {#kafka-intro}

### 面试快答

Kafka 以分区追加日志组织消息，消费组管理并行消费与位点，适合事件流和可重放数据链路。顺序通常限于分区内，业务去重与跨系统事务仍需设计。

### 详细解析

分区键决定顺序和热点，副本确认与提交配置决定故障窗口。消费者提交位点要与业务效果协调，不能仅开启幂等生产者就宣称全链路恰好一次。

#### 核心概念

| 概念 | 说明 |
| --- | --- |
| Topic | 逻辑主题，消息分类 |
| Partition | Topic 分片，并行与扩展单元；分区内有序 |
| Offset | 分区内消息位移（读到第几条），Consumer 按 offset 消费 |
| Consumer Group | 消费者组，组内分摊 Partition，实现负载均衡 |
| Broker | 存储节点，持久化 Partition 日志 |
| Replica | 副本，Leader 读写 + Follower 同步，保证高可用 |

数据写入后**持久化到磁盘**，Consumer 可重复消费、按 offset 回溯历史，适合「采集层 + 流计算输入 + 多下游订阅」。

#### 与 RocketMQ 对比（技术选型）

| 对比项 | Kafka | RocketMQ |
| --- | --- | --- |
| 定位 | 流数据平台 / 大数据管道 | 业务消息中间件 |
| 吞吐 | 极高（日志顺序写 + 零拷贝，减少内存拷贝次数） | 高，但极致吞吐通常 Kafka 更强 |
| 延迟 | 毫秒～秒级，偏吞吐 | 毫秒级，业务 MQ 体验更成熟 |
| 消费模型 | Pull + offset 自管，可回溯任意历史 | Push/Pull，Offset 由 Broker 管理为主 |
| 顺序消息 | 分区内有序 | Queue 级局部顺序，API 更贴近业务 |
| 事务消息 | 事务性 Producer（0.11+），偏流场景 | **原生事务消息**，半消息 + 回查，业务友好 |
| 延迟消息 | 无原生任意延迟（靠外部或 Tiered Storage 分层存储等） | **原生 delayLevel / 5.x 定时消息** |
| 过滤 | Consumer 端为主 | Broker 端 Tag / SQL92 过滤 |
| 生态 | Flink、Spark Streaming、ELK、数据湖入湖（写入 ODS 贴源层） | Java 业务解耦、订单/支付、阿里系中间件栈 |
| 运维 | KRaft 去 ZK（新版用内置共识，不再依赖 ZooKeeper），Partition 扩缩需规划 | NameServer 轻量，Broker 部署相对直观 |

#### 适用场景

| 更适合 Kafka | 更适合 RocketMQ |
| --- | --- |
| 日志 / 埋点 / 监控指标采集 | 订单、支付、库存等业务异步解耦 |
| Flink / Spark 流批一体数据管道 | 事务消息（本地事务 + MQ 一致性） |
| 多消费者重复读同一份历史数据 | 延迟消息、死信队列（多次失败转存）、精细消费重试 |
| 数据湖入湖（ODS 贴源层） | 强依赖 Java 生态的企业内部 MQ 标准 |
