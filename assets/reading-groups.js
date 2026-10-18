(function () {
  const groups = {
    java: [["JVM 与类加载", /jvm|gc|class-load|classloaders|parent-delegation|stop-the-world|g1-region|java-bytecode|jit|aot/], ["集合与容器", /hash|arraylist|linkedlist|treemap|collection|list-set-queue/], ["并发与线程", /thread|lock|volatile|synchronized|aqs|atomic|executors|sleep|wait|notify|runnable|callable/], ["IO 与网络", /nio|bio|aio|netty|sync-async-block/]],
    python: [["并发与异步", /gil|concurrency|multiprocessing|async|coroutine/], ["Web 与工程实践", /fastapi|flask|pydantic|validator|wsgi|dependency|memory-leak/]],
    spring: [["事务与数据访问", /tx|transaction|mybatis|mapper/], ["自动配置与工程", /config|boot|starter|tomcat|actuator|graceful|javax|jakarta/]],
    mysql: [["索引与查询优化", /index|bplus|explain|slow|covering|pagination|order-by/], ["事务与并发控制", /transaction|mvcc|lock|isolation|read|undo|redo|binlog|two-phase/], ["存储与架构", /engine|innodb|shard|partition|replica|capacity|charset/]],
    redis: [["数据结构与应用", /structure|sds|skiplist|string|hash|zset|bitmap|hyperlog|geo|leaderboard|cart/], ["缓存与性能", /cache|hot-key|big-key|memory|eviction|maxmemory|pipeline/], ["持久化与分布式", /rdb|aof|replic|cluster|slot|split-brain|lock|rate-limit/]],
    rocketmq: [["消息可靠性", /loss|duplicate|retry|dlq|transaction|ha|sync-async/], ["生产与消费", /producer|consumer|consume|offset|filter|tag|send|broadcast/]],
    "docker-k8s": [["容器与镜像", /docker|image|cmd|entrypoint|container/], ["Kubernetes 与运维", /k8s|pod|service|deployment|configmap|secret|probe|ingress/]],
    ai: [["Agent 与工具调用", /agent|mcp|tool|workflow|memory/], ["Prompt 与评测", /prompt|eval|ab-test|hallucination|observability/]],
    "rag-vector": [["文档与索引", /chunk|metadata|clean|pdf|image|increment|version/], ["Embedding 与向量库", /embedding|dimension|similarity|vector-db|hnsw|dense|sparse/], ["检索与排序", /retriev|recall|topk|rerank|bm25|hybrid|query|hyde|encoder/]],
    langchain: [["LangChain 基础", /langchain|chain|lcel/], ["LangGraph 与状态", /langgraph|state|checkpoint|hitl|loop|persistence/]],
    llm: [["推理原理", /inference-flow|attention|token|qwen|inference-vs/], ["推理性能与服务", /cache|vllm|prefill|acceleration/], ["训练与微调", /finetun|rlhf|lora/]],
    architecture: [["分布式基础", /cap|base|2pc|tcc|saga|consisten|idempot|global-id/], ["流量与高可用", /gateway|rate|circuit|load|spof|cache|degrade|retry|hpa|vpa/]],
    observability: [["日志、指标与追踪", /log|metric|trace|observability/], ["告警与故障排查", /alert|postmortem|capacity|load-test|qps/]],
    security: [["身份与权限", /auth|jwt|oauth|sso|rbac|abac|permission|token|api-key/], ["应用安全", /injection|xss|csrf|sql|ssrf|upload|xxe|password|encrypt|hash/], ["AI 与数据安全", /rag|prompt|tenant|ai-|tool/]],
    bigdata: [["搜索与 Elasticsearch", /elastic|es-/], ["数据处理与存储", /hive|hadoop|spark|kafka|etl/]]
  };
  window.StudyReadingGroups = {
    label(category, id) {
      if (category === "java" && /nio|bio|aio|netty|sync-async-block/.test(id)) return "IO 与网络";
      return (groups[category] || []).find(([, pattern]) => pattern.test(id))?.[0] || "基础与实践";
    }
  };
})();
