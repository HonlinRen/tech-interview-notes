# 面试知识点整理

面向技术面试的**静态知识库站点**：按主题拆分高频面试题，支持搜索、学习进度标记、深色模式与在线编辑。首页另含 **项目实战指南**（如 [agent-platform](https://github.com/HonlinRen/agent-platform)）供面试时结合项目经历讲解。

## 功能特性

- **分主题浏览**：Python、Java、Spring、MySQL、Redis、AI / RAG、LangChain、大模型等 17+ 专题
- **学习进度**：浏览器 `localStorage` 标记「已学习」，首页展示总计 / 已学题数
- **主题内工具**：关键词搜索、侧边目录、核心速览 / 详细模式、深色模式
- **代码高亮**：基于 [highlight.js](https://highlightjs.org/)
- **内容编辑**（开发模式）：本地 dev server 提供 `/api/save`，可在页面内增删改题目并写回 HTML
- **Legacy 映射**：`study-legacy-map.js` / `study.js` 内 `LEGACY_STORAGE_KEY_REMAP` 保证题目拆分或合并后学习进度不丢

## 技术栈

| 层级 | 技术 |
|------|------|
| 页面 | 纯 HTML + CSS，无前端构建 |
| 交互 | 原生 JavaScript（`assets/study.js`、`assets/home.js`） |
| 开发服务 | Express（`scripts/dev-server.js`） |
| 依赖 | highlight.js、express（dev） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动本地服务（默认 http://localhost:3000）
npm run dev
```

浏览器打开 `http://localhost:3000` 进入首页；各专题从首页卡片或对应 `*.html` 进入。

> 仅静态预览也可直接打开 `index.html`，但**首页统计**与**内容编辑器保存**依赖 dev server 的 `/api/stats`、`/api/save` 接口。

## 项目结构

```
Interview/
├── index.html              # 首页：主题入口 + 项目实战指南
├── *.html                  # 各专题页面（一主题一文件）
├── assets/
│   ├── study.js            # 题目目录、搜索、已学习状态、主题切换
│   ├── home.js             # 首页题目统计
│   ├── content-editor.js   # 在线编辑（需 dev server）
│   ├── study-legacy-map.js # 旧题目 id → 新存储 key 映射
│   ├── styles.css          # 全局样式
│   └── ...
├── scripts/
│   ├── dev-server.js       # 静态资源 + 保存 / 统计 API
│   ├── split-langchain.js  # 从 ai.html 拆分 LangChain 专题（维护脚本）
│   ├── split-rag-vector.js
│   └── update-*-config.js  # 批量更新 filter 栏等配置
└── package.json
```

## 专题一览

| 主题 | 文件 | 说明 |
|------|------|------|
| Python | `python.html` | GIL、协程、装饰器、FastAPI 等 |
| Java / JVM | `java.html` | 集合、并发、JVM、IO/NIO |
| Spring Boot | `spring.html` | AOP、事务、自动配置、MyBatis |
| MySQL | `mysql.html` | 索引、事务、MVCC、慢查询 |
| Redis | `redis.html` | 持久化、缓存、分布式锁 |
| RocketMQ | `rocketmq.html` | 消息可靠性、顺序与事务消息 |
| Docker / K8S | `docker-k8s.html` | 镜像、Pod、Service |
| AI应用 | `ai.html` | Agent、MCP、Prompt、评测 |
| RAG 向量检索 | `rag-vector.html` | Chunk、Embedding、Hybrid、Milvus |
| LangChain / LangGraph | `langchain.html` | Chain、State、Checkpointer |
| 大模型 / 推理与微调 | `llm.html` | Prefill/Decode、KV Cache、SFT |
| 网关 / 架构 | `architecture.html` | 高可用、限流、分布式设计 |
| 可观测性 | `observability.html` | 日志、指标、链路追踪 |
| 安全 / 鉴权 | `security.html` | JWT、OAuth2、注入与 XSS |
| 前端 | `frontend.html` | React、Hooks |
| 大数据 | `bigdata.html` | Elasticsearch、Hive 等 |
| 算法 LeetCode | `leetcode.html` | 经典题整理 |

## 新增题目

1. 在对应 `*.html` 的 `<main>` 内增加 `<section id="唯一-id">`，标题用 `<h2>`
2. 在 `assets/study.js` 的 `categoryBySection` 中注册：`"section-id": "category"`
3. 若由其他专题迁移或合并题目，在 `LEGACY_STORAGE_KEY_REMAP` 增加旧 key → 新 key 映射
4. 新专题需同步：新建 `xxx.html`、更新各页 `filterBar`、`index.html` 首页卡片、`study.js` 中 `categoryPages` / `categoryLabels` / `categoryOrder`，以及 `scripts/dev-server.js` 的 `ALLOWED_FILES`

题目 `section id` 一经发布**不要随意修改**，否则已学习标记会失效（除非配置 legacy 映射）。

## 学习状态存储

- 当前版本 key：`study-learned-v2`
- 单题格式：`分类:题目id`（如 `java:hashmap-principle`）
- 数据仅存浏览器本地，换设备或清缓存会丢失

## 维护脚本

| 脚本 | 用途 |
|------|------|
| `scripts/dev-server.js` | 本地开发服务器 |
| `scripts/split-langchain.js` | 从 `ai.html` 拆分 LangChain 专题 |
| `scripts/split-rag-vector.js` | 从 `ai.html` 拆分 RAG 向量专题 |
| `scripts/update-langchain-config.js` | 更新全站 LangChain 相关导航配置 |
| `scripts/update-rag-vector-config.js` | 更新全站 RAG 向量相关导航配置 |

## License

ISC（见 `package.json`）
