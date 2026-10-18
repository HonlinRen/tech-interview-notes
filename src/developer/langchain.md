---
title: "LangChain / LangGraph 高频问题整理"
permalink: "developer/langchain.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "langchain"
---
## LangChain 常见结构有哪些？ {#langchain-structure}

### 面试快答

LangChain 提供模型、消息、工具、检索与链式组合等抽象，典型流程是准备输入、调用模型或工具、解析输出并评测。抽象应服务业务边界，避免把全部逻辑塞进长链。

### 详细解析

接口随版本演进，明确锁定版本和最小集成层。业务授权、幂等、超时与日志由应用负责，不能依赖框架默认行为覆盖生产约束。

| 结构 | 典型类 / API | 作用 |
| --- | --- | --- |
| Model | `ChatOpenAI`、`OpenAIEmbeddings` | 封装 LLM 调用与向量化 |
| Prompt | `ChatPromptTemplate`、`FewShotPromptTemplate` | 模板化拼装 System / Human 消息 |
| Output Parser | `StrOutputParser`、`JsonOutputParser` | 把模型输出解析为字符串或结构化对象 |
| Document Loader | `PyPDFLoader`、`WebBaseLoader` | 加载原始文档 |
| Text Splitter | `RecursiveCharacterTextSplitter` | 切分 Chunk，控制检索粒度 |
| VectorStore | `Chroma`、`FAISS`、`PGVector` | 存储与检索向量 |
| Retriever | `as_retriever()`、`MultiQueryRetriever` | 按 query 召回相关文档 |
| Chain（LCEL） | `prompt | llm | parser` | 用管道符组合 Runnable，线性编排 |
| Tool | `@tool` 装饰函数 | 把业务能力暴露为可调用工具 |
| Agent | `create_react_agent`、`AgentExecutor` | 模型自主选工具、多步推理 |
| Memory | `ChatMessageHistory`、`RunnableWithMessageHistory` | 维护多轮对话上下文 |

现代 LangChain 推荐 **LCEL（LangChain Expression Language）**：各组件实现 `Runnable` 接口，支持 `invoke` / `stream` / `batch` 统一调用。

## LangChain 和 LangGraph 区别是什么？ {#langchain-vs-langgraph}

### 面试快答

LangChain 更偏组件集成与应用组合，LangGraph 更偏显式状态、节点与边组成的执行图，适合循环、分支、恢复和人工介入。两者可协作，并非互斥替代。

### 详细解析

Builder 用于声明图结构，编译后的图执行状态转换。选择时看是否需要持久化执行与检查点；简单固定链路无需为了“Agent 化”引入复杂状态图。

| 对比项 | LangChain | LangGraph |
| --- | --- | --- |
| 定位 | 组件与链式编排 | 有状态图工作流与 Agent 编排 |
| 流程形态 | 线性链路或简单 Agent | 分支、循环、路由、状态机 |
| 适用场景 | RAG 原型、工具调用 | 复杂 Agent、审批流、可恢复任务 |

简单 RAG 用 LangChain 足够；需要循环、人工介入、状态持久化时选 LangGraph。

## LangGraph 的 Node 怎么设计？ {#langgraph-node}

### 面试快答

Node 接收状态并返回状态更新，Edge 决定后续执行路径。节点应职责清晰，状态更新规则明确，条件路由要覆盖异常和终止分支。

### 详细解析

把不可重复的外部副作用和纯计算分开，重放节点时用业务幂等键。并行节点更新同一字段时需定义 reducer 与合并语义，避免覆盖或重复累积。

#### 设计原则

-   按能力拆分：`rewrite_query`、`retrieve`、`rerank`、`generate`、`call_tool`、`human_review`。
-   避免一个 Node 做太多事，便于观测、重试和替换。
-   只返回 State 增量更新，不覆盖整个状态。
-   条件分支、循环通过 conditional edge 表达。

```python
def retrieve_node(state):
    docs = retriever.search(state["rewritten_query"])
    return {"retrieved_docs": docs}
```

## Agent 如何避免无限循环？ {#infinite-loop}

### 面试快答

防止 Agent 无限循环要设置步骤、时间、Token 与工具调用预算，同时定义可验证的完成条件。重复调用或无进展时应停止、降级或转人工。

### 详细解析

框架递归限制只是最后一道防线，业务状态机应记录尝试次数、错误类型与进度。工具结果为空和模型输出结束都不必然表示任务成功。

#### 防护机制

-   `max_iterations`：最多 N 轮 think-act 循环。
-   `max_tool_calls`：单次请求工具调用上限。
-   重复检测：相同 action 连续出现则终止。
-   总 Token / 时间预算：超限强制结束。
-   终止条件：模型输出 `FINAL_ANSWER` 或达到目标状态。

LangGraph 用 conditional edge 检测 `step > MAX` 路由到 END 节点。

## Agent 状态如何持久化和恢复？ {#state-persistence}

### 面试快答

持久化保存执行状态、检查点和必要的事件信息，使任务能在失败后恢复。状态要有任务 ID、用户/租户、版本和清晰的字段更新语义。

### 详细解析

检查点不自动提供外部副作用的 exactly-once，恢复后仍可能重复执行节点。使用事务、幂等调用和补偿，并避免把密钥或无限增长的消息全文直接保存到状态。

#### 状态与检查点

状态应包含业务输入、已完成阶段、必要结果引用、版本和错误信息；避免保存无限增长的消息或密钥。持久化执行通过检查点和任务标识支持恢复，具体保存粒度与恢复 API 以所用 LangGraph 版本为准。

同一个 thread_id 的再次调用并不总等于“自动从任意失败节点继续”，还取决于上次执行状态、输入和恢复方式。多租户场景必须把线程标识与可信租户、用户绑定，防止读取其他会话。

#### 副作用

检查点提交与外部 HTTP/数据库写入通常不是同一个原子事务。恢复可能重放节点，所以副作用需要幂等键、执行记录或补偿。

#### 运维

选择持久化后端时验证并发更新、过期清理、备份和版本迁移；用进程中断测试确认实际恢复行为。

## Agent 如何做人工确认 HITL？ {#hitl}

### 面试快答

HITL 在关键步骤暂停，展示具体操作、目标、参数和风险后让人确认，再恢复执行。批准必须绑定当时的状态和拟执行动作，不能泛化为后续无限授权。

### 详细解析

恢复前检查内容是否变化、批准是否过期和操作者权限。拒绝、超时和重复点击都应有确定的状态转换，副作用执行后记录实际结果供审计。

#### 可审阅的暂停点

在具体写入或其他关键动作执行前，保存拟执行目标、参数、相关状态版本和请求者身份，向审批者展示其能理解的结果。批准、拒绝、超时和取消均需明确状态。

#### 恢复边界

LangGraph 提供中断与恢复能力，但 API 与行为随版本变化，应使用目标版本文档和测试。中断前代码可能在恢复时再次执行，不能把非幂等写入放在可能重放的位置。

批准只适用于当时展示的动作；目标或参数变化要重新判断授权。执行前再次核验资源权限、状态是否过期及幂等记录，防止重复点击或旧批准被复用。

#### 验证

覆盖进程重启、批准后失败、重复恢复、权限撤销和输入变化，并记录最终实际副作用。
