(function (root, factory) {
  const topics = factory();
  if (typeof module === "object" && module.exports) module.exports = topics;
  else root.StudyTopics = topics;
})(typeof window === "undefined" ? globalThis : window, function () {
  return [
  {
    "id": "python",
    "label": "Python",
    "file": "python.html",
    "path": "developer/python.html",
    "description": "GIL、协程、GC、装饰器、Pydantic、WSGI/ASGI",
    "tone": "tone-sky"
  },
  {
    "id": "java",
    "label": "Java / JVM",
    "file": "java.html",
    "path": "developer/java.html",
    "description": "Java 基础、集合、并发、JVM、IO/NIO",
    "tone": "tone-amber"
  },
  {
    "id": "spring",
    "label": "Spring Boot",
    "file": "spring.html",
    "path": "developer/spring.html",
    "description": "事务与代理、自动配置、Bean 生命周期、Web 与远程调用",
    "tone": "tone-green"
  },
  {
    "id": "mysql",
    "label": "MySQL",
    "file": "mysql.html",
    "path": "developer/mysql.html",
    "description": "索引、事务、锁、MVCC、慢查询、InnoDB",
    "tone": "tone-blue"
  },
  {
    "id": "redis",
    "label": "Redis",
    "file": "redis.html",
    "path": "developer/redis.html",
    "description": "持久化、缓存问题、分布式锁、限流、内存淘汰",
    "tone": "tone-red"
  },
  {
    "id": "rocketmq",
    "label": "RocketMQ",
    "file": "rocketmq.html",
    "path": "developer/rocketmq.html",
    "description": "核心组件、消息可靠性、顺序消息、事务消息",
    "tone": "tone-purple"
  },
  {
    "id": "docker-k8s",
    "label": "Docker / K8S",
    "file": "docker-k8s.html",
    "path": "developer/docker-k8s.html",
    "description": "镜像、容器、Pod、Service、Deployment",
    "tone": "tone-cyan"
  },
  {
    "id": "ai",
    "label": "AI应用",
    "file": "ai.html",
    "path": "developer/ai.html",
    "description": "Agent、MCP、Prompt、评测与生产落地",
    "tone": "tone-indigo"
  },
  {
    "id": "rag-vector",
    "label": "RAG 向量检索",
    "file": "rag-vector.html",
    "path": "developer/rag-vector.html",
    "description": "Chunk、Embedding、向量库、Hybrid、Rerank、数据清洗",
    "tone": "tone-teal"
  },
  {
    "id": "langchain",
    "label": "LangChain / LangGraph",
    "file": "langchain.html",
    "path": "developer/langchain.html",
    "description": "组件组合、状态图、节点路由、持久化恢复、人工介入",
    "tone": "tone-violet"
  },
  {
    "id": "llm",
    "label": "大模型 / 推理与微调",
    "file": "llm.html",
    "path": "developer/llm.html",
    "description": "推理加速、KV Cache、量化、SFT、LoRA",
    "tone": "tone-pink"
  },
  {
    "id": "architecture",
    "label": "网关 / 架构",
    "file": "architecture.html",
    "path": "developer/architecture.html",
    "description": "网关、高可用、限流、幂等、分布式与系统设计",
    "tone": "tone-slate"
  },
  {
    "id": "observability",
    "label": "可观测性",
    "file": "observability.html",
    "path": "developer/observability.html",
    "description": "日志、指标、链路追踪、告警、排障",
    "tone": "tone-emerald"
  },
  {
    "id": "security",
    "label": "安全 / 鉴权",
    "file": "security.html",
    "path": "developer/security.html",
    "description": "认证授权、JWT、OAuth2、SQL 注入、XSS/CSRF",
    "tone": "tone-rose"
  },
  {
    "id": "frontend",
    "label": "前端",
    "file": "frontend.html",
    "path": "developer/frontend.html",
    "description": "React、组件化、Hooks、常见 UI 模式",
    "tone": "tone-sky"
  },
  {
    "id": "bigdata",
    "label": "大数据",
    "file": "bigdata.html",
    "path": "developer/bigdata.html",
    "description": "Elasticsearch、采集存储计算、ELK 链路",
    "tone": "tone-orange"
  },
  {
    "id": "leetcode",
    "label": "算法 LeetCode",
    "file": "leetcode.html",
    "path": "developer/leetcode.html",
    "description": "经典题目整理，链接直达力扣",
    "tone": "tone-yellow"
  }
];
});
