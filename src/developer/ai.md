---
title: "AI应用 高频问题整理"
permalink: "developer/ai.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "ai"
---
## 企业知识库 RAG 链路是什么？ {#rag-pipeline}

### 面试快答

RAG 先从受控知识源检索证据，再把问题与证据交给模型生成答案。企业链路还要覆盖解析、切块、索引、权限、重排、引用、评测和增量更新。

### 详细解析

检索得到文本不代表回答可靠，需分别验证召回与生成。设计时先明确知识时效、访问控制和不可回答问题的处理，再选择框架和数据库。

#### 离线链路

1.  文档采集：Wiki、PDF、工单、数据库导出。
2.  解析清洗：去噪、OCR、表格/标题结构提取。
3.  切片（Chunking）：按语义或结构切分，保留 overlap 和元数据。
4.  Embedding：文本转向量，写入向量库。

#### 在线链路

1.  Query Rewrite：多轮指代消解、关键词补全。
2.  检索：向量 + BM25 混合召回，权限/租户过滤。
3.  Rerank：Cross-Encoder 精排 TopN。
4.  上下文组装 + 生成 + 引用 + 日志/评测。

#### 生产必备

增量更新、软删除、版本管理、权限隔离、质量评估、可观测性。

## MCP 与 Tool Calling 有什么区别？ {#mcp-and-tool-calling}

### 面试快答

Tool Calling 是模型提出结构化工具调用的能力，MCP 是应用连接工具与资源的协议。模型不会自行安全执行调用，宿主负责校验、授权、执行和回传结果。

### 详细解析

一个 MCP 服务可以暴露多个工具，模型厂商的工具协议也可由宿主适配。不要把协议握手成功视为业务授权通过，租户与用户权限应在服务端重新验证。

#### MCP 是什么

```text
AI 应用 / Agent
  └── MCP Client
          ↓
      MCP Server
          ├── Tool：执行动作
          ├── Resource：读取资源
          └── Prompt：提供提示词模板
```

Client 通过 MCP 协议连接 Server，发现可用工具并调用；Server 负责把业务能力（查库、读文件、调 API）以统一格式暴露出来。

注册一个 MCP 服务通常需提供：

| 类型 | 内容 |
| --- | --- |
| 连接信息 | 服务地址、启动命令、传输方式、环境变量 |
| 能力清单 | tools、resources、prompts |
| 参数规范 | 每个 tool 的入参 schema、出参格式 |
| 权限信息 | 鉴权方式、工具权限、读写范围 |

#### 与 Tool Calling 的区别

| 对比项 | Tool Calling | MCP |
| --- | --- | --- |
| 定位 | LLM 选择并调用工具的能力 | 工具/数据源的标准化暴露协议 |
| 层次 | 模型 API 层 | 应用基础设施层 |
| 关注点 | 模型如何决策调用哪个工具、填什么参数 | 工具如何注册、鉴权、治理、跨应用复用 |
| 类比 | 「模型会调工具」 | 「工具以统一协议对外服务」 |

```text
典型协作链路：
用户提问 → LLM Tool Calling 决策（选 search_docs）
         → MCP Client 转发 tools/call
         → MCP Server 执行真实查询
         → 结果回传 LLM → 生成答案
```

## MCP 如何通信与工具 Schema 定义？ {#mcp-implementation}

### 面试快答

MCP 以 JSON-RPC 消息表达初始化、能力协商和工具调用等交互，常见传输包括本地 stdio 与面向远程的 Streamable HTTP。工具 Schema 描述参数结构，结果由宿主反馈给模型。

### 详细解析

实现时以目标协议版本为准，处理超时、取消、会话和认证。Schema 只校验结构，工具端还需校验业务范围、访问权限和输入大小，避免把用户凭证混入模型上下文。

#### 1\. Server 注册与鉴权

MCP 没有中心注册表，由 **Client 在本地配置中声明** Server，启动时拉起或连接，握手后纳入可用工具池。

| 部署形态 | 配置要点 | 典型场景 |
| --- | --- | --- |
| 本地 stdio | `command` + `args` + `env` | Cursor / Claude Desktop 拉起子进程 |
| 远程 HTTP | `url` + 鉴权头 / OAuth | 团队共享、企业级工具服务 |

```json
// .cursor/mcp.json 示例
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"],
      "env": { "API_KEY": "xxx" }
    },
    "remote-api": {
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

-   **本地 stdio**：依赖 OS 进程隔离；敏感凭据放 `env`。
-   **远程**：Bearer Token / API Key / OAuth 2.0（授权码 + PKCE）。
-   **权限治理**：Client 控制启用哪些 Server；Server 按 scope 限制可调工具。

连接后 Client 发 `initialize` 交换 capabilities，再 `tools/list` 发现工具，完成「注册」。

#### 2\. Client 与 Server 通信

消息层统一 **JSON-RPC 2.0**（说什么），传输层选 **Transport**（怎么传）。

| Transport | 方式 | 场景 |
| --- | --- | --- |
| **stdio** | 子进程 `stdin`/`stdout`，一行一条 JSON | 本地 IDE 最常见 |
| **Streamable HTTP** | HTTP POST，响应 JSON 或 SSE 流 | 远程共享，支持 Bearer / OAuth |

```text
典型流程：
initialize → initialized → tools/list → tools/call → 结果回传

// tools/call 请求示例
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_docs",
    "arguments": { "query": "MCP 鉴权", "top_k": 5 }
  }
}
```

#### 3\. 工具 Schema 定义

Server 声明 `name`、`description`、`inputSchema`；`inputSchema` 为标准 **JSON Schema**，经 `tools/list` 暴露，Client 转成模型 Tool 定义。

```json
{
  "name": "search_docs",
  "description": "搜索企业知识库文档",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "搜索关键词" },
      "top_k": { "type": "integer", "minimum": 1, "maximum": 20, "default": 5 },
      "category": { "type": "string", "enum": ["tech", "hr", "finance"] }
    },
    "required": ["query"]
  }
}
```

| MCP 字段 | 模型 Tool 字段 |
| --- | --- |
| `name` | `name` |
| `description` | `description` |
| `inputSchema` | `parameters` |

写好 schema：`description` 写清语义；`required` 标必填；`enum` / `minimum` 约束取值；Server 执行前再做 schema 校验，防模型幻觉参数。

## 如何减少大模型幻觉？ {#reduce-hallucination}

### 面试快答

降低幻觉要让模型在可验证证据上作答，并允许明确拒答或表达不确定。检索质量、上下文筛选、结构约束、工具校验和离线评测需要配合。

### 详细解析

低温度不能保证事实正确，引用也可能被编造。引用应绑定真实证据 ID，生成后检查数字、实体和结论是否有依据，对高风险输出保留人工复核。

#### RAG 层面

-   **提供可靠上下文**：检索质量是上限；Chunk 合理、Hybrid + Rerank、过滤低相关文档。
-   **Prompt 约束**：明确要求「仅基于以下资料回答，资料未提及则说不知道」。
-   **强制引用**：输出必须带 `doc_id` / 页码 / 原文片段，便于校验与溯源。
-   **拒答机制**：检索分数低于阈值、Context 为空时，走固定拒答话术，不让模型硬编。
-   **忠实度评测**：用 RAGAS Faithfulness、人工抽检 bad case，持续迭代检索与 Prompt。

#### 生成层面

-   **降低 temperature**：事实类问答用 0–0.3，减少随机「发挥」。
-   **Structured Output**：JSON Schema / Function Calling 约束字段，减少自由文本胡编。
-   **分步生成**：先抽取事实，再组织答案（Extract-then-Generate），比一步到位更稳。
-   **Self-RAG / CRAG**：生成后自检是否与 Context 一致，不一致则重写或拒答。
-   **避免误导性 Prompt**：不要暗示「一定有答案」；少问开放臆测题（「你觉得 CEO 怎么想」）。

#### 工具与 Agent 层面

-   **能查就不猜**：数值、状态、实时信息走 API / SQL / 搜索工具，不让模型凭记忆回答。
-   **工具结果优先**：Prompt 规定「工具返回为准，不得覆盖或篡改」。
-   **参数校验**：Function Calling 的 schema 加 `enum`、`required`，Server 端二次校验再执行。

#### 工程与治理层面

-   **规则后处理**：金额、日期、身份证号等关键字段用正则 / 规则引擎校验。
-   **HITL 人工审核**：高风险场景（医疗、法务、金融）低置信度转人工。
-   **LLM-as-Judge**：用独立模型或 RAGAS 对 Faithfulness 打分，低分拦截。
-   **监控与回归**：记录幻觉反馈、低分 case，纳入评测集持续回归。
-   **权限与数据隔离**：metadata 过滤，避免模型把 A 部门文档内容答给 B 部门用户。

```python
System: 你是企业知识库助手。严格遵守：
1. 仅根据【检索资料】回答，不得使用外部知识。
2. 每条结论必须标注来源 [doc_id]。
3. 资料不足以回答时，回复：「根据现有资料无法确认，建议联系人工客服。」
4. 禁止编造政策条款、数值、日期、人名。

【检索资料】
{context}

【用户问题】
{question}
```

| 手段 | 解决哪类幻觉 | 典型场景 |
| --- | --- | --- |
| RAG + 引用 | 事实性胡编 | 制度问答、产品手册 |
| 工具调用 | 实时数据编造 | 订单状态、库存查询 |
| Structured Output | 格式/字段乱填 | 工单分类、参数抽取 |
| 拒答 + 阈值 | 无依据硬答 | 检索 miss 时 |
| Faithfulness 评测 | 上线后漂移 | Prompt / Rerank 迭代 |

## Text-to-SQL 在 AI 应用中如何落地？ {#text-to-sql}

### 面试快答

Text-to-SQL 把自然语言转换为受控数据库查询，落地关键是语义口径、Schema 上下文、权限和执行防护。生成 SQL 应经过解析、白名单和限额检查后再执行。

### 详细解析

采用只读账号、租户过滤、超时、扫描量限制和审计；解析器校验比字符串检查更可靠。结构化查询适合走数据库聚合，不能把所有表简单嵌入向量库后期待精确统计。

#### 落地链路

1.  Schema 注入：表结构、字段注释、样例行写入 Prompt。
2.  SQL 生成：LLM 输出 SQL，限 SELECT、禁止 DDL/DML。
3.  校验执行：语法检查、权限过滤、超时限制、结果行数上限。
4.  结果解释：将查询结果转为自然语言。

#### 风险管控

-   只读账号、行级权限、SQL 注入防护。
-   错误 SQL 重试 + 人工兜底。

## 如何构造 RAG 离线评测集？ {#eval-dataset}

### 面试快答

RAG 评测应把检索是否找到证据、回答是否符合证据、答案是否满足问题分开评估。测试集覆盖真实问题、拒答、权限、时效和难例，并与调参数据隔离。

### 详细解析

人工标注与 LLM-as-a-Judge 可结合，但后者存在位置、长度和模型偏好，需要人工校准。RAGAS 等工具的指标定义和接口会变，报告必须写清版本、样本、基线和误差来源。

#### 构造步骤

1.  从真实用户日志采样高频问题。
2.  人工标注期望答案 + 相关 doc\_id（ground truth）。
3.  覆盖边界：多轮指代、无答案、权限受限、复合问题。
4.  定期补充 bad case 回归。

样本量由问题类别、风险和期望误差决定，可先从经过人工检查的小集开始，但不能把固定条数当成充分覆盖。每次改 Chunk、Embedding、重排或生成策略后，在同一未泄漏测试集上比较。

#### 指标分别回答什么

| 层级 | 主要问题 | 可记录的信号 |
| --- | --- | --- |
| 检索 | 必要证据是否进入候选集 | recall@K、证据覆盖、排序与权限过滤情况 |
| 生成 | 主张是否得到提供证据支持 | 忠实度、引用对应、事实与数字校验 |
| 任务 | 是否正确完整地回答用户问题 | 正确性、相关性、拒答与任务完成率 |
| 运行 | 是否达到交付预算 | 首次响应、总延迟、Token 与工具成本 |

RAGAS 等框架可以辅助计算部分指标，但需要按具体版本核对指标所需字段和定义。有些依赖参考答案或标注证据，有些借助裁判模型；指标值并非绝对真值。

#### 模型裁判的校准

为裁判提供明确评分量表，用人工复核样本检验一致性，避免只因答案长或语气自信而得高分。比较方案时可打乱答案位置，并保留逐题评分与失败原因。单次总分提升应同时检查类别退化、随机性、成本与线上反馈。

## 如何做 Prompt 版本管理？ {#prompt-versioning}

### 面试快答

把 Prompt 当可发布配置管理，记录模板、变量、模型参数、工具版本与评测结果。上线通过版本号和灰度验证，异常能回滚到已知有效组合。

### 详细解析

Few-shot 示例应覆盖格式和边界，而非塞入大量相似样例。评测日志避免存放敏感原文，模型升级后重新验证输出格式、任务完成率和成本。

#### 实践

-   Prompt 存配置中心，带 `version`、`author`、`changelog`。
-   Git 管理 Prompt 模板，PR Review 变更。
-   请求日志记录 `prompt_version`，便于回溯。
-   灰度发布：10% 流量走新版本，对比评测指标。

```python
prompts/
  system_v1.2.txt
  rag_generate_v2.0.txt
```

## Skills 具体是怎么工作的？ {#skills-how-it-works}

### 面试快答

Skill 通常把某类任务的指令、参考材料与可选脚本组织成可复用工作流。工具调用提供执行能力，Skill 指导何时及如何组合这些能力，具体加载机制由宿主决定。

### 详细解析

Skill 里的文字不能越过用户授权或工具权限。来自外部文件的指令仍应按信任边界处理，不能因为被打包成 Skill 就允许读取秘密或发送消息。

```text
Agent 启动：只加载 Skills 清单（名称 + 简短描述），不占大量 Token
用户任务进来：Agent 判断任务类型 → 匹配相关 Skill → 读取完整 SKILL.md → 按 Skill 指引执行
执行完毕：Skill 内容可不常驻上下文，下次需要再加载
```

#### 核心机制：渐进式披露（Progressive Disclosure）

-   **第一层**：Skills 目录/元数据（name + description），Agent 知道「有哪些能力可选」。
-   **第二层**：任务匹配后，Agent 主动 Read 完整 Skill 文件，获取详细 workflow。
-   **第三层**：Skill 内引用的脚本、模板、示例文件，执行时再按需加载。

好处：100 个 Skill 不会一次性塞爆 Context Window，只有相关的才加载。

#### Skill 文件里通常有什么？

| 组成部分 | 内容 |
| --- | --- |
| 触发条件 | 什么任务场景应该启用此 Skill（description 字段） |
| Workflow | 分步骤操作指南（先查什么、再改什么、如何验证） |
| 规范约束 | 命名约定、代码风格、项目特有规则 |
| 工具指引 | 该场景下优先用哪些 MCP Tool / 脚本 / API |
| 示例 | 输入输出样例、常见错误处理 |

#### 工作流程示例（Cursor Agent）

1.  用户在项目里配置了 `.cursor/skills/` 目录，每个子目录一个 Skill。
2.  Agent 收到任务「帮我创建 PR」，扫描 Skills 清单，匹配到 `create-pull-request` Skill。
3.  Agent 调用 Read 工具加载 `SKILL.md`，获取 PR 创建的标准流程（git status → diff → push → gh pr create）。
4.  Agent 按 Skill 步骤依次执行 Shell / gh 命令，而非凭空猜测流程。

#### 与 System Prompt / Rules 的区别

-   **System Prompt**：全局、常驻、通用行为约束。
-   **Rules**：项目级持久规则（编码规范、提交规范），始终生效。
-   **Skills**：任务级、按需加载、专精某个 workflow（如「拆 PR」「写 Canvas」「调 CI」）。

#### 设计 Skill 的最佳实践

-   description 写清楚**何时触发**，Agent 靠它做 Skill 路由。
-   步骤要可执行、可验证，避免模糊描述（「适当优化」→ 改为具体检查项）。
-   单 Skill 聚焦一个场景，不要把所有知识塞进一个文件。
-   配合 MCP Tool 使用：Skill 定义流程，Tool 提供能力。

## Agent 工具调用失败如何降级？ {#tool-fallback}

### 面试快答

工具失败先分类为参数错误、暂时故障、权限拒绝或业务失败，再选择纠正输入、有限重试、替代路径或请求人工处理。对用户说明当前结果是否完整。

### 详细解析

副作用调用不能盲目重试，应提供幂等键、结果查询或补偿。给 Agent 设置总时限、步数和成本预算，避免多个工具之间循环降级。

#### 降级策略

1.  重试：指数退避，最多 3 次。
2.  降级：备用工具主 API 失败切缓存或降级 API。
3.  跳过：告知模型工具不可用，请基于已有信息回答。
4.  人工兜底：HITL 介入或返回友好错误。

```python
try: result = call_tool(params)
except Timeout: result = {"error": "timeout", "fallback": cached_data}
except Exception: result = {"error": "unavailable"}
```

## Agent 如何做长期记忆和短期记忆？ {#agent-memory}

### 面试快答

短期记忆保存当前任务上下文，长期记忆保存经过筛选的可复用事实与偏好。长期记忆需要来源、权限、时间、更新和删除机制，不能把全部对话永久堆进去。

### 详细解析

将用户明确偏好与模型推断分开，敏感信息按最小必要保存。检索记忆前做租户隔离和版本判断，防止错误记忆在后续任务中持续放大。

| 类型 | 存储 | 用途 |
| --- | --- | --- |
| 短期记忆 | 对话 messages、滑动窗口 | 当前会话上下文 |
| 工作记忆 | State 字段、Scratchpad | 当前任务中间结果 |
| 长期记忆 | 向量库、MySQL | 跨会话用户偏好、历史摘要 |

短期记忆超窗口时做摘要压缩；长期记忆通过 RAG 检索注入，避免全量塞入 Prompt。

```python
长期记忆存储
├── 向量库 Vector DB
│   └── 存非结构化记忆：历史摘要、聊天片段、项目经历、知识片段
│
└── 关系数据库Mysql
    └── 存结构化画像：偏好、标签、配置、明确事实
```

## 多 Agent 协作如何分工？ {#multi-agent}

### 面试快答

多 Agent 适合能拆成明确输入输出、可独立验证的子任务，但会增加上下文、协调和结果冲突成本。先证明单 Agent 瓶颈，再决定是否分工。

### 详细解析

明确每个角色的产物、验收标准、预算和最终决策者。共享文件或外部写操作要避免竞争，并把并行产物集中验证，不能仅靠多个回答投票证明正确。

#### 常见模式

| 模式 | 说明 |
| --- | --- |
| Supervisor | 主管 Agent 分配任务给专家 Agent |
| Pipeline | Researcher -> Writer -> Reviewer 串行 |
| Debate | 多 Agent 辩论后综合 |

分工原则：职责单一、接口清晰（共享 State 或 Message Bus）、避免循环依赖。

## 如何控制 LLM 应用的 Token 成本？ {#token-cost}

### 面试快答

控制 Token 成本可从缩短无效上下文、检索筛选、摘要、缓存和模型路由入手。优化要同时跟踪质量、延迟和任务成功率，不能只看单次调用价格。

### 详细解析

上下文窗口是容量上限，不等于所有位置都被同样可靠地利用。避免无限拼接工具输出，缓存要绑定模型、权限和数据版本，并确认用户数据隔离。

#### 优化手段

-   检索 TopK 控制：减少进 Prompt 的 Chunk 数。
-   历史摘要压缩：长对话不塞全量 messages。
-   小模型路由：简单任务用小模型，复杂才用大模型。
-   缓存：相同 query 命中 Semantic Cache。
-   Prompt 精简：去除冗余 System Prompt。

按 tenant/user 设 Token 配额，超限降级或拒服；监控 input/output Token 分布。

## ReAct 是什么？ {#react}

### 面试快答

ReAct 将规划、调用工具和观察结果组成迭代过程，使 Agent 能根据外部反馈推进任务。工程上应约束可用工具、步骤上限、失败处理和最终验收。

### 详细解析

不依赖暴露模型的内部推理来审计执行，应记录工具参数、结果、状态转换与可见的简要理由。对有副作用的工具增加确定的授权与幂等边界。

```python
Thought: 需要查员工手册中的年假规定
Action: search_docs("年假天数")
Observation: [1] 年假为15天...
Thought: 已有足够信息
Action: FINISH
Answer: 年假为15天
```

比纯 CoT 能获取外部信息；比纯 Tool Calling 有显式推理链。

## Agent 如何做可观测性和调试？ {#agent-observability}

### 面试快答

Agent 观测应串起请求、模型调用、检索、工具、重试和最终结果，并记录延迟、成本和任务成功。关键是能复现失败路径且保护敏感数据。

### 详细解析

关联 trace、任务 ID、Prompt/模型/工具版本和证据来源，区分模型错误与依赖错误。采样不能让低频高风险失败完全消失，必要时对失败做全量元数据记录。

-   **Trace**：每步 Thought/Action/Observation 记录 span。
-   **LangSmith / Langfuse**：Agent 专用追踪平台。
-   **日志**：tool 入参、出参、Token 用量、延迟。
-   **指标**：成功率、平均步数、Tool 失败率。

Debug 时回放完整 Agent 轨迹，定位是哪一步决策错误。
