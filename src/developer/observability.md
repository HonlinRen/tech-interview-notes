---
title: "可观测性 高频问题整理"
permalink: "developer/observability.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "observability"
---
## OpenTelemetry 是什么？ {#otel-intro}

### 面试快答

OpenTelemetry 提供采集和关联遥测数据的规范、SDK 与 Collector 等组件。Trace 表示一次分布式执行，Span 表示其中有时间边界的操作，分析存储由后端承担。

### 详细解析

统一资源标签、服务版本和语义约定，避免每个团队各自定义相同指标。采样与脱敏在入口设计，遥测故障不应拖垮业务请求。

| 组件 | 作用 |
| --- | --- |
| SDK | 应用内埋点：创建 Span、记录指标、注入 TraceContext |
| Auto-Instrumentation | 无侵入增强：自动为 HTTP、DB、MQ 等框架加 Trace |
| Collector | 接收、处理、转发遥测数据到 Jaeger、Prometheus、Loki 等后端 |
| OTLP | 统一的 gRPC/HTTP 导出协议，替代各厂商私有 Agent 格式 |

核心价值：**统一埋点标准、降低厂商绑定、跨语言跨服务链路一致**。OTel 做"采集层标准化"，后端存储分析可自由选型。

```text
App (OTel SDK) --OTLP--> Collector --> Jaeger (Trace)
                                      --> Prometheus (Metric)
                                      --> Loki / ES (Log)
```

## 如何用 Trace 定位接口慢？ {#trace-slow-locate}

### 面试快答

先从慢请求 Trace 找关键路径，区分排队、应用计算、数据库和远程依赖，再用日志、指标与剖析交叉验证。最长 Span 不一定是根因，也可能在等待别的资源。

### 详细解析

并行分支的耗时不能简单相加，父 Span 也可能包含子调用。对照正常请求和多次样本，检查连接池等待、重试和跨机时钟误差。

1.  在 APM/Jaeger 中按接口路径或服务名筛选慢 Trace（如 P99 > 2s）。
2.  打开 Waterfall 视图，找**最宽/最长的 Span**（Critical Path）。
3.  区分"自身耗时"与"等待子 Span"：Span 自身耗时 = 总耗时 − 所有子 Span 耗时之和。
4.  检查 Span 的 status、error message、attributes（SQL 语句、HTTP URL、模型名）。
5.  对比正常 Trace 与慢 Trace，看是偶发还是系统性（如连接池满、索引缺失）。

| 慢 Span 位置 | 常见原因 | 下一步 |
| --- | --- | --- |
| 网关 | 限流排队、TLS 握手、路由查找 | 看网关 QPS、连接数 |
| DB Span | 慢 SQL、锁等待、连接池耗尽 | 查慢查询日志、EXPLAIN |
| Redis Span | 大 Key、热 Key、网络延迟 | 查 slowlog、key 大小 |
| 外部 API / LLM | 下游超时、Token 过长、重试 | 看超时配置、Prompt 长度 |
| MQ 消费 | 积压、消费逻辑慢 | 看 consumer lag |

面试举例：接口 P99 从 200ms 升到 3s → Trace 显示 `vector.search` Span 从 50ms 变成 2.8s → 排查发现向量库节点 CPU 100%，扩容后恢复。

## Prometheus 是什么？ {#prometheus-intro}

### 面试快答

Prometheus 采集带标签的时间序列，并通过 PromQL 查询、规则与告警集成用于系统监控。指标适合统计趋势，不适合存储每个请求的完整明细。

### 详细解析

避免用户 ID、订单号等高基数字段成为标签。监控自身也要考虑存储、保留时间与可用性，抓取成功不等于业务成功。

| 特性 | 说明 |
| --- | --- |
| Pull 采集 | Prometheus Server 主动拉取，也可 Pushgateway 处理短生命周期任务 |
| 多维标签 | 指标名 + Label 组合，如 `http_requests_total{method="POST",status="500"}` |
| PromQL | 支持 rate、histogram\_quantile、聚合等查询语言 |
| Alertmanager | 告警路由、分组、抑制、静默 |
| Grafana | 常用可视化前端，非 Prometheus 内置 |

典型监控指标：QPS、错误率、P95/P99 延迟、CPU/内存、JVM GC、MQ 积压、连接池使用率。与 Trace（Jaeger/Tempo）和 Log（Loki/ELK）组成完整可观测性栈。

## Counter、Gauge、Histogram 区别？ {#prometheus-metric-types}

### 面试快答

Counter 表示累积事件，Gauge 表示可升可降的当前值，Histogram 按桶统计分布并可聚合。选择应匹配被测量的语义，而不是所有数值都用 Gauge。

### 详细解析

Counter 需用 rate/increase 等处理重置，Histogram 分位数依赖桶设计。不要直接平均各实例 P99；延迟桶应覆盖业务 SLO 并注意单位一致。

| 类型 | 行为 | 典型场景 | PromQL 示例 |
| --- | --- | --- | --- |
| Counter | 只增不减（重启归零） | 请求总数、错误总数、Token 消耗累计 | `rate(http_requests_total[5m])` |
| Gauge | 可增可减的瞬时值 | 内存用量、队列深度、连接池活跃数、温度 | `jvm_memory_used_bytes` |
| Histogram | 分桶累计计数 + sum/count | 请求延迟分布、响应大小分布 | `histogram_quantile(0.99, rate(http_duration_bucket[5m]))` |
| Summary | 客户端预计算分位数 | 类似 Histogram，但不灵活（桶固定于客户端） | 较少在新项目中使用 |

```text
# Counter 示例
http_requests_total{method="GET", status="200"} 152340

# Gauge 示例
db_connection_pool_active 18
db_connection_pool_max    20

# Histogram 示例（桶: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10）
http_request_duration_seconds_bucket{le="0.1"} 98000
http_request_duration_seconds_bucket{le="0.5"} 99500
http_request_duration_seconds_sum  8234.5
http_request_duration_seconds_count 100000
```

选类型原则：累计计数用 Counter，当前状态用 Gauge，需要算分位数用 Histogram（服务端聚合，桶可统一配置）。

## Prometheus 指标如何用于告警？ {#prometheus-alerting}

### 面试快答

告警优先基于用户可感知的错误、延迟和 SLO 消耗，再辅以容量与依赖征兆。规则需有持续时间、分组、抑制、责任人和可执行处理步骤。

### 详细解析

静态阈值应结合流量避免低量噪声，依赖故障时控制告警风暴。每次故障复盘检查漏报、误报与恢复通知，告警数量不是监控质量指标。

```text
# alerting rule 示例
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "5xx 错误率超过 5% 持续 5 分钟"

      - alert: HighP99Latency
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 3m
        labels:
          severity: warning
```

| 告警设计要点 | 说明 |
| --- | --- |
| for 持续时间 | 避免瞬时抖动误报，如 `for: 5m` |
| 阈值基于 SLO | 错误率、P99 应与 SLO 对齐，而非拍脑袋 |
| 分组与抑制 | 同一根因的多条告警合并，下游抑制上游 |
| Runbook 链接 | annotations 中附排查手册，降低 On-Call 成本 |

## RAG / Agent 需要监控哪些指标？ {#rag-agent-metrics}

### 面试快答

RAG/Agent 除错误和延迟，还要跟踪检索命中、证据支持、工具成功、完成率、Token 成本和安全拒绝。技术成功与业务成功应分开定义。

### 详细解析

按模型、Prompt、索引版本与请求类别切片，并通过离线样本评估无法实时标注的质量。不要把“返回了文字”当作成功，也不要把用户敏感输入直接做指标标签。

| 维度 | 关键指标 | 说明 |
| --- | --- | --- |
| 端到端 | 总耗时 P50/P95/P99、成功率、超时率 | 用户感知的整体体验 |
| 检索 | 召回数、Top-K 分数分布、空召回率、检索耗时 | 召回为空或分数过低需拒答 |
| 重排 | 重排耗时、重排前后分数变化 | 重排是常见瓶颈 |
| 生成 | TTFT（首 Token 时间）、生成耗时、输出 Token 数 | 流式场景 TTFT 比总耗时更重要 |
| 工具调用 | 调用次数、成功率、超时率、各工具耗时 | Agent 场景核心可观测点 |
| 质量 | 低分拒答比例、用户点赞/点踩、幻觉反馈 | 业务质量信号 |
| 成本 | 输入/输出 Token、缓存命中率、单次请求费用 | FinOps 与容量规划 |

```text
# 示例指标命名
rag_retrieval_duration_seconds{stage="vector_search"}
rag_retrieval_hit_count
rag_rerank_duration_seconds
llm_tokens_total{direction="input|output", model="gpt-4o"}
agent_tool_call_total{tool="search_db", status="success|error"}
rag_refusal_total{reason="low_score|no_context"}
```

## 日志、指标、链路追踪如何关联？ {#logs-metrics-trace-correlation}

### 面试快答

通过统一服务标签、TraceId、SpanId 和请求/业务标识关联日志、指标与链路。跨服务传播遵循标准上下文，并在异步任务和 MQ 中显式延续或建立链接。

### 详细解析

外部传入的上下文不能作为授权依据，也不能无限信任其采样标记。错误日志与 Trace 对齐，指标用 exemplar 等能力辅助定位，但不把每个 TraceId 都做指标标签。

| 信号 | 回答的问题 | 关联键 |
| --- | --- | --- |
| Metrics | 系统整体是否健康？趋势如何？ | service、endpoint 标签 |
| Traces | 某次慢请求经过了哪些服务？ | trace\_id、span\_id |
| Logs | 某个 Span 里发生了什么？参数/错误栈？ | trace\_id、span\_id 写入日志 MDC |

```text
// 日志中注入 Trace 上下文（Java MDC / Python contextvars）
MDC.put("trace_id", span.getSpanContext().getTraceId());
MDC.put("span_id",  span.getSpanContext().getSpanId());
log.info("order created, orderId={}", orderId);

// 日志输出
{"trace_id":"abc123","span_id":"def456","msg":"order created","orderId":"O001"}

// Grafana 中：从 Prometheus 告警 → 跳转 Tempo Trace → 关联 Loki 日志
```

工程落地：统一 TraceId 从网关生成并透传；所有服务日志格式 JSON 化并含 trace\_id；Grafana/Jaeger 配置 Exemplar 从 Metric 跳 Trace。

## 如何做容量评估？ {#capacity-planning}

### 面试快答

容量评估从峰值业务量、请求结构、耗时分布和资源上限出发，用压测确认可持续吞吐并预留故障与增长余量。平均 QPS 不足以描述突发和长任务。

### 详细解析

用并发≈到达率×平均逗留时间作粗估，再通过排队和尾延迟验证。预算覆盖数据库连接、线程、缓存、网络与消息积压，不仅计算应用 CPU。

1.  **明确目标**：峰值 QPS、数据增量、P99 延迟目标、可用性 SLO。
2.  **基准测试**：单实例压测得到 QPS-CPU 曲线和拐点。
3.  **计算冗余**：峰值 QPS / 单实例 QPS × 安全系数（通常 1.5~2x）。
4.  **依赖组件**：DB 连接数、Redis 内存、MQ 吞吐、带宽分别估算。
5.  **验证**：全链路压测验证，留 30% 以上 headroom。

```text
示例：
  目标峰值 QPS = 5000
  单 Pod 压测 QPS = 800（CPU 70% 时）
  需要 Pod 数 = 5000 / 800 × 1.5 = 10（向上取整）
  + HPA max = 15（应对突发）

  DB 连接：10 Pod × 20 连接 = 200 < max_connections(500) ✓
  Redis 内存：100万 Key × 2KB ≈ 2GB，设 4GB ✓
```

持续容量管理：监控资源利用率趋势，提前 2~4 周预警；大促前专项压测和扩容。

## 如何做压测？ {#load-test}

### 面试快答

压测应重现真实请求比例、数据规模、热点和依赖延迟，逐步升压并观察吞吐、错误率和 P95/P99。目标是找到满足 SLO 的可持续容量和瓶颈。

### 详细解析

记录环境、版本、预热、负载模型和客户端饱和度，避免压测机先成为瓶颈。测试包括突发、持续运行与故障恢复，不用单次峰值替代稳定容量结论。

| 阶段 | 内容 |
| --- | --- |
| 目标定义 | 验证 5000 QPS 下 P99 < 200ms，错误率 < 0.1% |
| 场景设计 | 按真实流量比例混合读写、核心接口权重高 |
| 数据准备 | 生产级数据量（至少 50%），避免空库假象 |
| 环境隔离 | 独立压测环境或生产灰度，禁止直接打生产 |
| 逐步加压 | 阶梯升压（500→1000→2000→5000），每阶段稳定 10min |
| 全链路观测 | 同步看 RED 指标、CPU/内存、DB 慢查询、GC |
| 报告输出 | 拐点 QPS、瓶颈组件、优化建议和容量结论 |

常用工具：JMeter、Gatling、k6、wrk（HTTP）；全链路压测平台（如阿里 ForceBot、腾讯 WeStress）。

注意：压测需覆盖**冷启动**（缓存空）、**限流触发**、**依赖降级**等边界场景。
