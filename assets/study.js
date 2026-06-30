(function () {
      const categoryBySection = {
        "bm25-vs-keyword": "rag-vector",
        "vector-vs-bm25": "rag-vector",
        "2pc-tcc-saga-local-msg": "architecture",
        "ab-test": "ai",
        actuator: "spring",
        "agent-components": "ai",
        "agent-memory": "ai",
        "agent-observability": "ai",
        "agent-vs-workflow": "ai",
        "agentic-rag": "ai",
        "ai-least-privilege": "security",
        "ai-tool-audit": "security",
        "alert-levels": "observability",
        "alert-storm": "observability",
        "anti-abuse": "security",
        "aot-pros-cons": "java",
        "api-key-vs-oauth2": "security",
        "api-signing": "security",
        aqs: "java",
        "arch-hpa-vs-vpa": "architecture",
        "arraylist-expansion": "java",
        "arraylist-unsafe": "java",
        "async-await": "python",
        "async-task-system": "architecture",
        "asyncio-timeout-cancel": "python",
        "atomic-classes": "java",
        attention: "ai",
        "auth-vs-authorization": "security",
        "auto-config": "spring",
        "auto-config-imports": "spring",
        "auto-increment-gap": "mysql",
        autoboxing: "java",
        "autowired-vs-resource": "spring",
        "avoid-duplicate-scheduled": "architecture",
        "avoid-retry-storm": "architecture",
        "avoid-spof": "architecture",
        "base-theory": "architecture",
        "bean-lifecycle": "spring",
        "bean-scope": "spring",
        "bi-encoder-cross-encoder": "rag-vector",
        "big-hot-key": "redis",
        "big-key-governance": "redis",
        bigdecimal: "java",
        "bio-nio-aio": "java",
        "bitmap-scenarios": "redis",
        "blocking-queue-compare": "java",
        "blue-green-rolling-canary": "architecture",
        "boot-vs-spring": "spring",
        "boot2-to-boot3": "spring",
        "bplus-vs-btree": "mysql",
        "break-parent-delegation": "java",
        "builtin-types": "python",
        "button-data-permission": "security",
        "cache-avalanche-penetration-breakdown": "architecture",
        "cache-db-consistency": "architecture",
        "cache-degrade": "architecture",
        "cache-problems": "redis",
        "cache-warmup": "architecture",
        "cap-theory": "architecture",
        "capacity-planning": "mysql",
        "obs-capacity-planning": "observability",
        "cart-storage": "redis",
        cdn: "architecture",
        "charset-collation": "mysql",
        "chunk-design": "rag-vector",
        "chunk-overlap": "rag-vector",
        "chunk-parent-child": "rag-vector",
        "circuit-breaker-half-open": "architecture",
        citations: "rag-vector",
        "class-file-structure": "java",
        "class-loading": "java",
        classloaders: "java",
        "clock-rollback": "architecture",
        closure: "python",
        "clustered-index": "mysql",
        "cmd-vs-entrypoint": "docker-k8s",
        "collection-framework": "java",
        "collection-vs-collections": "java",
        "compile-and-interpret": "java",
        concurrency: "python",
        "concurrent-containers": "java",
        "conditional-assembly": "spring",
        "config-center": "ai",
        "config-priority": "spring",
        "config-push": "architecture",
        "configmap-vs-secret": "docker-k8s",
        "connection-pool": "mysql",
        "consistent-hash": "architecture",
        "container-networking": "docker-k8s",
        "context-manager": "python",
        "context-window": "ai",
        "copy-vs-add": "docker-k8s",
        coroutine: "python",
        "coroutine-advantages": "python",
        "cors-security": "security",
        "cost-budget": "ai",
        "cot-exposure": "ai",
        "covering-index": "mysql",
        "cpython-gc": "python",
        "crash-recovery": "mysql",
        "create-thread": "java",
        "cross-shard-join": "architecture",
        "cross-shard-tx": "architecture",
        "current-read-snapshot": "mysql",
        "custom-starter": "spring",
        "data-masking": "security",
        "data-persistence": "docker-k8s",
        "data-structures": "redis",
        dataclass: "python",
        "datetime-timestamp": "mysql",
        "db-rw-split-design": "architecture",
        "db-slow-query-pool": "observability",
        "deadlock-analysis": "java",
        "deadlock-troubleshoot": "mysql",
        decorator: "python",
        "decorator-vs-aop": "python",
        "deep-copy-shallow-copy": "python",
        "deep-pagination": "mysql",
        "degrade-strategy": "architecture",
        "delayed-double-delete": "architecture",
        "delayed-task": "redis",
        delayqueue: "java",
        "dense-vs-sparse": "rag-vector",
        "dependency-management": "python",
        "python3-major-versions": "python",
        deployment: "docker-k8s",
        deserialization: "security",
        "direct-memory-risk": "java",
        "disaster-recovery-vs-backup": "architecture",
        "distributed-config-center": "architecture",
        "distributed-id-why": "architecture",
        "distributed-lock": "redis",
        "distributed-lock-impl": "architecture",
        "distributed-tx-hard": "architecture",
        "docker-compose": "docker-k8s",
        "docker-intro": "docker-k8s",
        dockerfile: "docker-k8s",
        "dubbo-components": "architecture",
        "dubbo-expose-reference": "architecture",
        "embedded-tomcat": "spring",
        "elasticsearch-bigdata-flow": "bigdata",
        "embedding-selection": "rag-vector",
        "encryption-algorithms": "security",
        "enterprise-rag": "ai",
        "error-code-design": "observability",
        "eval-dataset": "ai",
        "eventual-consistency": "architecture",
        "eviction-policy": "redis",
        "exception-handling": "python",
        "executors-why-not": "java",
        "explain-fields": "mysql",
        "external-config": "spring",
        "factory-bean": "spring",
        "fail-fast-fail-safe": "java",
        "faithfulness-eval": "ai",
        "fastapi-di": "python",
        "fastapi-vs-flask-django": "python",
        "feedback-loop": "ai",
        "few-shot": "ai",
        "field-design": "mysql",
        "field-model-validator": "python",
        "file-upload": "architecture",
        "file-upload-risks": "security",
        "flash-sale-design": "architecture",
        "float-precision": "java",
        "for-update": "mysql",
        forkjoinpool: "java",
        "frequent-gc": "java",
        "frontend-backend-validation": "security",
        "function-calling-schema": "ai",
        "future-completablefuture": "java",
        "g1-region": "java",
        "gateway-auth": "architecture",
        "gateway-value": "architecture",
        "gather-vs-create-task": "python",
        "gc-collector-choice": "java",
        "gc-roots": "java",
        "gc-types": "java",
        "generics-erasure": "java",
        "geo-scenarios": "redis",
        gil: "python",
        sharding: "mysql",
        gossip: "architecture",
        "graceful-shutdown": "spring",
        "graph-rag": "ai",
        "gray-traffic-split": "architecture",
        "handler-mapping-adapter": "spring",
        "hash-encrypt-encode": "security",
        "hash-object": "redis",
        "hash-scenarios": "redis",
        "hash-slot": "redis",
        "hashmap-principle": "java",
        "hashmap-vs-concurrenthashmap": "java",
        "hashset-hashmap": "java",
        "high-concurrency-order": "architecture",
        "history-compression": "ai",
        hitl: "langchain",
        "hnsw-vs-ivf": "rag-vector",
        "hot-cold-separation": "mysql",
        "hot-data-cache": "architecture",
        "hot-key-governance": "redis",
        "hot-key-protection": "architecture",
        "hpa-vs-vpa": "docker-k8s",
        "http-vs-rpc": "architecture",
        "hybrid-search": "rag-vector",
        "rag-hyde": "rag-vector",
        "rag-image-handling": "rag-vector",
        "hyperloglog-scenarios": "redis",
        "id-properties": "architecture",
        idempotency: "architecture",
        "identifier-vs-keyword": "java",
        "image-text-vector-same-db": "rag-vector",
        "image-optimization": "docker-k8s",
        "image-vs-container": "docker-k8s",
        "implicit-conversion": "mysql",
        "incremental-update": "rag-vector",
        "child-thread-exception-main": "java",
        "consumer-retry-on-error": "rocketmq",
        "explain-fields-to-check": "mysql",
        "index-creation-evaluation": "mysql",
        "index-condition-pushdown": "mysql",
        "index-failure": "mysql",
        "index-speed": "mysql",
        "indirect-prompt-injection": "security",
        "infinite-loop": "langchain",
        "inference-acceleration": "llm",
        "innodb-engine": "mysql",
        "io-multiplexing": "java",
        "io-patterns": "java",
        iplusplus: "java",
        "is-vs-equals": "python",
        isempty: "java",
        isolation: "mysql",
        "isolation-lock-relation": "mysql",
        "iterator-generator": "python",
        "iterator-remove": "java",
        "java-bytecode": "java",
        "java-comments": "java",
        "java-features": "java",
        "java-spi": "java",
        "java-vs-cpp": "java",
        "javax-to-jakarta": "spring",
        "jit-vs-aot": "java",
        "jvm-heap": "java",
        "jvm-jdk-jre": "java",
        "jvm-memory": "java",
        "jvm-params": "java",
        "jvm-tools": "java",
        "jwt-basics": "security",
        "k8s-intro": "docker-k8s",
        "k8s-service": "architecture",
        "l4-vs-l7": "architecture",
        "langchain-structure": "langchain",
        "langchain-build-flow": "langchain",
        "langchain-vs-langgraph": "langchain",
        "what-is-dify": "ai",
        "langgraph-node": "langchain",
        "langgraph-builder": "langchain",
        "langgraph-edge": "langchain",
        "langgraph-state": "langchain",
        leaderboard: "redis",
        "left-prefix": "mysql",
        "linkedhashmap-order": "java",
        "linkedlist-insert": "java",
        "list-set-queue-map": "java",
        "llm-as-judge": "ai",
        "llm-basics": "ai",
        "llm-finetuning": "llm",
        "llm-output-filter": "security",
        "llm-rlhf": "llm",
        "llm-vs-ml": "ai",
        "load-balance-algorithms": "architecture",
        "load-test": "observability",
        locks: "java",
        "logs-debug": "docker-k8s",
        "logs-metrics-trace-correlation": "observability",
        "lora-qlora": "ai",
        "lost-in-middle": "ai",
        "lua-atomic": "redis",
        maxmemory: "redis",
        "memory-growth": "redis",
        "memory-leak": "python",
        metaclass: "python",
        metadata: "rag-vector",
        "metaspace-method-area": "java",
        "minor-vs-full-gc": "java",
        "model-gateway": "ai",
        "model-routing": "ai",
        moe: "ai",
        "mq-backlog-monitoring": "observability",
        "mq-peak-shaving": "architecture",
        mro: "python",
        "multi-agent": "ai",
        "multi-hop-rag": "ai",
        "multi-level-cache": "architecture",
        "multi-region-active-active": "architecture",
        "multi-tenant-llm": "ai",
        "multi-tenant-rag": "security",
        multimodal: "ai",
        multiprocessing: "python",
        "mutable-immutable": "python",
        mvcc: "mysql",
        "mybatis-cache": "spring",
        "mybatis-dynamic-sql": "spring",
        "mybatis-intro": "spring",
        "mybatis-lazy-loading": "spring",
        "mybatis-mapper-proxy": "spring",
        "mybatis-n-plus-one": "spring",
        "mybatis-placeholder": "spring",
        "mybatis-plugin": "spring",
        "mybatis-sql-injection": "spring",
        "mybatis-vs-hibernate": "spring",
        "netty-bytebuf": "java",
        "netty-eventloop": "java",
        "netty-performance": "java",
        "new-vs-init": "python",
        "next-key-lock": "mysql",
        "nginx-gateway-client-lb": "architecture",
        "nio-components": "java",
        nonlocal: "python",
        "notification-push": "architecture",
        "notify-vs-notifyall": "java",
        "oauth2-code-flow": "security",
        "off-heap-memory": "java",
        "online-eval": "ai",
        "optimistic-pessimistic-lock": "java",
        "oracle-vs-openjdk": "java",
        "orm-sql-injection": "security",
        "otel-intro": "observability",
        "p95-p99": "observability",
        "parameter-passing": "python",
        "parent-delegation": "java",
        "password-reset-only": "security",
        "password-storage": "security",
        "pattern-matching": "java",
        paxos: "architecture",
        "pdf-table-rag": "rag-vector",
        "permission-system": "security",
        "pii-masking": "ai",
        pipeline: "redis",
        "plan-and-execute": "ai",
        pod: "docker-k8s",
        "pod-failure-troubleshooting": "docker-k8s",
        "pod-vs-container": "docker-k8s",
        postmortem: "observability",
        "prevent-sql-injection": "security",
        "primitive-types": "java",
        priorityqueue: "java",
        "prometheus-alerting": "observability",
        "prometheus-intro": "observability",
        "prometheus-metric-types": "observability",
        "prompt-engineering": "ai",
        "prompt-injection": "security",
        "prompt-roles": "ai",
        "prompt-versioning": "ai",
        "property-decorator": "python",
        "static-vs-dynamic-proxy": "java",
        proxy: "java",
        "pubsub-vs-stream": "redis",
        pydantic: "python",
        "python-bytecode": "python",
        "qps-tps-rt": "observability",
        quantization: "ai",
        "query-cache-removed": "mysql",
        "query-rewrite": "rag-vector",
        raft: "architecture",
        "rag-agent-metrics": "observability",
        "rag-basics": "ai",
        "rag-pipeline": "ai",
        "rag-open-source-frameworks": "ai",
        "rag-poisoning": "security",
        "rag-vs-finetuning": "ai",
        ragas: "ai",
        "ragas-code-eval": "ai",
        "rate-limit-algorithms": "architecture",
        "rate-limit-circuit-degrade": "architecture",
        "rbac-vs-abac": "security",
        "rdb-aof": "redis",
        react: "ai",
        "reactor-model": "java",
        "read-write-lock": "java",
        "read-write-split": "mysql",
        "recall-troubleshooting": "rag-vector",
        "record-vs-bean": "java",
        "red-use": "observability",
        "redis-fast": "redis",
        "redis-hot-big-key": "observability",
        "redis-module": "redis",
        "redis-mq": "redis",
        "redis-tx-no-rollback": "redis",
        "redis-use-cases": "redis",
        "redis-vs-local-cache": "redis",
        "redis-vs-memcached": "redis",
        "redis-vs-zk-lock": "architecture",
        "reduce-hallucination": "ai",
        redundancy: "architecture",
        reflection: "java",
        "refresh-token-design": "security",
        "replay-attack": "security",
        "replication-lag": "mysql",
        "replication-modes": "redis",
        "replication-principle": "mysql",
        "replication-sync": "redis",
        "request-security-checks": "security",
        "request-timeout-cancel": "ai",
        "request-vs-limit": "docker-k8s",
        "react-basics": "frontend",
        rerank: "rag-vector",
        "response-cache": "ai",
        "retry-degrade-circuit": "ai",
        "retry-risks": "architecture",
        "retry-with-idempotency": "architecture",
        "rocketmq-broadcast": "rocketmq",
        "rocketmq-broker-ha": "rocketmq",
        "rocketmq-cluster-consume": "rocketmq",
        "rocketmq-commitlog-consumequeue": "rocketmq",
        "rocketmq-components": "rocketmq",
        "rocketmq-consumer-group": "rocketmq",
        "rocketmq-delay-message": "rocketmq",
        "rocketmq-dlq": "rocketmq",
        "rocketmq-duplicate-consumption": "rocketmq",
        "rocketmq-horizontal-scaling": "rocketmq",
        "rocketmq-message-backlog": "rocketmq",
        "rocketmq-message-filter": "rocketmq",
        "rocketmq-message-loss": "rocketmq",
        "rocketmq-nameserver": "rocketmq",
        "rocketmq-offset": "rocketmq",
        "rocketmq-ordered-message": "rocketmq",
        "rocketmq-producer-modes": "rocketmq",
        "rocketmq-retry": "rocketmq",
        "rocketmq-send-modes": "rocketmq",
        "rocketmq-sync-async-replication": "rocketmq",
        "rocketmq-tag-vs-key": "rocketmq",
        "rocketmq-transaction-message": "rocketmq",
        "rocketmq-vs-kafka": "rocketmq",
        "rolling-update-rollback": "docker-k8s",
        rpc: "architecture",
        "rto-rpo": "architecture",
        "runnable-callable": "java",
        "scheduled-task-single-vs-distributed": "architecture",
        sds: "redis",
        "self-rag": "ai",
        "sensitive-word-filter": "security",
        serialization: "java",
        "mysql-layer-and-logs": "mysql",
        service: "docker-k8s",
        "service-discovery": "architecture",
        "sft-finetuning": "llm",
        "sft-rlhf-dpo": "ai",
        "short-url": "architecture",
        "skills-how-it-works": "ai",
        "skills-vs-function-calling": "ai",
        "similarity-metrics": "rag-vector",
        "single-vs-distributed-rate-limit": "architecture",
        skiplist: "redis",
        "sleep-vs-wait": "java",
        "sli-slo-sla": "observability",
        "sliding-window-rate-limit": "redis",
        "slow-query": "mysql",
        "split-brain": "redis",
        "spring-annotations": "spring",
        "spring-aop": "spring",
        "spring-design-patterns": "spring",
        "spring-di": "spring",
        "spring-events": "spring",
        "spring-ioc": "spring",
        "spring-mvc-flow": "spring",
        "spring-tx": "spring",
        "sql-execution-flow": "mysql",
        "sql-injection": "security",
        "sql-optimization": "mysql",
        sso: "security",
        ssrf: "security",
        "stamped-lock": "java",
        starter: "spring",
        "state-persistence": "langchain",
        "stereotype-annotations": "spring",
        "stop-the-world": "java",
        stream: "redis",
        streaming: "ai",
        "string-scenarios": "redis",
        "structured-data-rag": "ai",
        "structured-output-prompt": "ai",
        "structured-output-validation": "ai",
        "symmetric-asymmetric": "security",
        "sync-async-block-nonblock": "java",
        "task-decomposition": "ai",
        "tenant-isolation": "security",
        "text-to-sql": "ai",
        "thread-lifecycle": "java",
        "thread-pool-flow": "java",
        "thread-pool-params": "java",
        "thread-pool-shutdown": "java",
        threadlocal: "java",
        "timeout-principles": "architecture",
        token: "ai",
        "token-blacklist": "security",
        "token-bucket-vs-leaky-bucket": "architecture",
        "token-cost": "ai",
        "token-monitoring": "observability",
        "tool-calling-auth": "security",
        "mcp-and-tool-calling": "ai",
        "mcp-implementation": "ai",
        "tool-fallback": "ai",
        "tool-param-validation": "ai",
        "tool-timeout": "ai",
        "text-embedding-v3-spec": "rag-vector",
        "qwen-embedding-spec": "rag-vector",
        "topk-recall": "rag-vector",
        "trace-id-propagation": "observability",
        "trace-slow-locate": "observability",
        "trace-span": "observability",
        "transaction-message": "architecture",
        transactional: "spring",
        transformer: "ai",
        "treemap-vs-hashmap": "java",
        "tx-propagation": "spring",
        "unique-index-sharding": "architecture",
        "update-db-vs-delete-cache": "architecture",
        "utf8-vs-utf8mb4": "mysql",
        "uuid-db-snowflake": "architecture",
        "vector-db-selection": "rag-vector",
        "vector-dimensions": "rag-vector",
        "vector-retrieval": "rag-vector",
        "version-conflict": "rag-vector",
        "virtual-threads": "java",
        volatile: "java",
        "web-push": "architecture",
        "why-bplus-tree": "mysql",
        "wrapper-cache": "java",
        "wsgi-asgi": "python",
        "llm-pandas-numpy-role": "python",
        "lc-15-3sum": "leetcode",
        "lc-134-gas-station": "leetcode",
        "lc-lcr127-jump-training": "leetcode",
        "lc-300-lis": "leetcode",
        "lc-226-invert-tree": "leetcode",
        "llm-pandas-agent-tool": "python",
        "llm-matplotlib-visualization": "python",
        "xss-csrf": "security",
        xxe: "security",
        zab: "architecture",
        "zero-copy": "java",
        "zero-shot-few-shot-cot": "ai",
        "zk-distributed-lock": "architecture",
        "znode-types": "architecture",
        "zookeeper-use": "architecture",
        "zset-skiplist": "redis",
        "zset-structure": "redis"
      };

      const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "rag-vector", "langchain", "llm", "architecture", "observability", "security", "frontend", "bigdata", "leetcode"];

            const categoryPages = {
        "python": "python.html",
        "java": "java.html",
        "spring": "spring.html",
        "mysql": "mysql.html",
        "redis": "redis.html",
        "rocketmq": "rocketmq.html",
        "docker-k8s": "docker-k8s.html",
        "ai": "ai.html",
        "rag-vector": "rag-vector.html",
        "langchain": "langchain.html",
        "llm": "llm.html",
        "architecture": "architecture.html",
        "observability": "observability.html",
        "security": "security.html",
        "frontend": "frontend.html",
        "bigdata": "bigdata.html",
        "leetcode": "leetcode.html"
      };

const categoryLabels = {
        python: "Python",
        java: "Java / JVM",
        spring: "Spring Boot",
        mysql: "MySQL",
        redis: "Redis",
        rocketmq: "RocketMQ",
        "docker-k8s": "Docker / K8S",
        ai: "AI应用",
        "rag-vector": "RAG 向量检索",
        langchain: "LangChain / LangGraph",
        llm: "大模型 / 推理与微调",
        architecture: "网关 / 架构",
        observability: "可观测性",
        security: "安全 / 鉴权",
        frontend: "前端",
        bigdata: "大数据",
        leetcode: "算法 LeetCode"
      };

      // 学习状态 v2：按「分类:题目id」存储，避免跨专题串数据。
      // 新增题目请使用全新 section id，并在 categoryBySection 注册，勿改历史 id。
      const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
      const LEARNED_STORAGE_KEY = "study-learned-v2";
      const LEGACY_LEARNED_STORAGE_KEY = "study-learned-questions";
      const CROSS_PAGE_SECTION_IDS = ["capacity-planning"];
      const LEGACY_STORAGE_KEY_REMAP = {
        "observability:capacity-planning": "observability:obs-capacity-planning",
        "ai:what-is-mcp": "ai:mcp-and-tool-calling",
        "ai:tool-calling-mcp": "ai:mcp-and-tool-calling",
        "ai:MCP-Registry": "ai:mcp-implementation",
        "ai:Model-Context-Protocol": "ai:mcp-implementation",
        "ai:MCP-schema": "ai:mcp-implementation",
        "mysql:server-storage-layer": "mysql:mysql-layer-and-logs",
        "mysql:three-logs": "mysql:mysql-layer-and-logs",
        "mysql:two-phase-commit": "mysql:mysql-layer-and-logs",
        "mysql:sharding-when": "mysql:sharding",
        "mysql:horizontal-vertical-sharding": "mysql:sharding",
        "mysql:global-id": "mysql:sharding",
        "mysql:sharding-pagination": "mysql:sharding",
        "ai:chunk-design": "rag-vector:chunk-design",
        "ai:metadata": "rag-vector:metadata",
        "ai:vector-retrieval": "rag-vector:vector-retrieval",
        "ai:topk-recall": "rag-vector:topk-recall",
        "ai:query-rewrite": "rag-vector:query-rewrite",
        "ai:rag-hyde": "rag-vector:rag-hyde",
        "ai:rerank": "rag-vector:rerank",
        "ai:embedding-selection": "rag-vector:embedding-selection",
        "ai:vector-dimensions": "rag-vector:vector-dimensions",
        "ai:similarity-metrics": "rag-vector:similarity-metrics",
        "ai:vector-vs-bm25": "rag-vector:vector-vs-bm25",
        "ai:bm25-vs-keyword": "rag-vector:bm25-vs-keyword",
        "ai:hybrid-search": "rag-vector:hybrid-search",
        "ai:pdf-table-rag": "rag-vector:pdf-table-rag",
        "ai:rag-image-handling": "rag-vector:rag-image-handling",
        "ai:image-text-vector-same-db": "rag-vector:image-text-vector-same-db",
        "ai:incremental-update": "rag-vector:incremental-update",
        "ai:version-conflict": "rag-vector:version-conflict",
        "ai:citations": "rag-vector:citations",
        "ai:recall-troubleshooting": "rag-vector:recall-troubleshooting",
        "ai:chunk-overlap": "rag-vector:chunk-overlap",
        "ai:chunk-parent-child": "rag-vector:chunk-parent-child",
        "ai:vector-db-selection": "rag-vector:vector-db-selection",
        "ai:hnsw-vs-ivf": "rag-vector:hnsw-vs-ivf",
        "ai:dense-vs-sparse": "rag-vector:dense-vs-sparse",
        "ai:bi-encoder-cross-encoder": "rag-vector:bi-encoder-cross-encoder",
        "ai:langchain-structure": "langchain:langchain-structure",
        "ai:langchain-build-flow": "langchain:langchain-build-flow",
        "ai:langchain-vs-langgraph": "langchain:langchain-vs-langgraph",
        "ai:langgraph-node": "langchain:langgraph-node",
        "ai:langgraph-edge": "langchain:langgraph-edge",
        "ai:langgraph-state": "langchain:langgraph-state",
        "ai:langgraph-builder": "langchain:langgraph-builder",
        "ai:infinite-loop": "langchain:infinite-loop",
        "ai:state-persistence": "langchain:state-persistence",
        "ai:hitl": "langchain:hitl"
      };

      function getLegacyQuestionMap() {
        return window.__STUDY_LEGACY_QUESTION_MAP || {};
      }

      function questionStorageKey(question) {
        const legacyMap = getLegacyQuestionMap();
        if (legacyMap[question.id]) {
          return legacyMap[question.id];
        }
        return question.category + ":" + question.id;
      }

      function isQuestionLearned(question) {
        return Boolean(state.learned[questionStorageKey(question)]);
      }

      function setQuestionLearned(question, learned) {
        const key = questionStorageKey(question);
        if (learned) {
          state.learned[key] = true;
        } else {
          delete state.learned[key];
        }
      }

      function normalizeLearnedStore(store) {
        if (!store || typeof store !== "object") {
          return {};
        }
        const out = {};
        Object.keys(store).forEach(function (key) {
          if (!store[key]) {
            return;
          }
          const mapped = LEGACY_STORAGE_KEY_REMAP[key] || key;
          if (mapped.indexOf(":") !== -1) {
            out[mapped] = true;
          }
        });
        return out;
      }

      function migrateLegacyLearnedState() {
        const migrated = {};
        const legacyMap = getLegacyQuestionMap();
        const raw = localStorage.getItem(LEGACY_LEARNED_STORAGE_KEY);

        if (raw) {
          let flat = {};
          try {
            flat = JSON.parse(raw);
          } catch (error) {
            flat = {};
          }
          localStorage.setItem(LEGACY_LEARNED_STORAGE_KEY + "-backup", raw);

          Object.keys(flat).forEach(function (key) {
            if (!flat[key]) {
              return;
            }
            if (legacyMap[key]) {
              migrated[legacyMap[key]] = true;
              return;
            }
            if (key.indexOf(":") !== -1) {
              const remapped = LEGACY_STORAGE_KEY_REMAP[key] || key;
              migrated[remapped] = true;
              return;
            }
            const cat = categoryBySection[key];
            if (cat && CROSS_PAGE_SECTION_IDS.indexOf(key) === -1) {
              migrated[cat + ":" + key] = true;
            }
          });
        }

        const existingV2 = localStorage.getItem(LEARNED_STORAGE_KEY);
        if (existingV2) {
          try {
            Object.assign(migrated, normalizeLearnedStore(JSON.parse(existingV2)));
          } catch (error) {
            /* ignore malformed v2 payload */
          }
        }

        localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      function loadLearnedState() {
        const saved = localStorage.getItem(LEARNED_STORAGE_KEY);
        if (saved) {
          try {
            return normalizeLearnedStore(JSON.parse(saved));
          } catch (error) {
            /* fall through to migration */
          }
        }
        return migrateLegacyLearnedState();
      }

      function applyPageScopedMigration() {
        const raw = localStorage.getItem(LEGACY_LEARNED_STORAGE_KEY);
        if (!raw) {
          return;
        }
        let flat = {};
        try {
          flat = JSON.parse(raw);
        } catch (error) {
          return;
        }

        let changed = false;
        state.questions.forEach(function (question) {
          const key = questionStorageKey(question);
          if (state.learned[key] || !flat[question.id]) {
            return;
          }
          state.learned[key] = true;
          changed = true;
        });

        if (changed) {
          saveLearnedState();
        }
      }

      const state = {
        filter: document.body.dataset.category || "python",
        query: "",
        questions: [],
        learned: loadLearnedState()
      };

      const searchInput = document.getElementById("searchInput");
      const searchSuggestions = document.getElementById("searchSuggestions");
      const emptyState = document.getElementById("emptyState");
      const studyStats = document.getElementById("studyStats");
      const categoryStats = document.getElementById("categoryStats");
      const compactBtn = document.getElementById("compactBtn");
      const darkBtn = document.getElementById("darkBtn");
      const currentCategory = document.body.dataset.category || state.filter;

      function normalize(text) {
        return text.toLowerCase().replace(/\s+/g, " ").trim();
      }

      function escapeHtml(text) {
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function stripNumber(title) {
        return title.replace(/^\d+(?:-\d+)?\.\s*/, "");
      }

      function saveLearnedState() {
        localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(state.learned));
      }

      function rememberQuestion(question) {
        if (!question) {
          return;
        }
        localStorage.setItem("study-current-question", questionStorageKey(question));
        localStorage.setItem("study-current-category", question.category);
      }

      function updateLearnedVisual(question) {
        const learned = isQuestionLearned(question);
        question.container.classList.toggle("learned", learned);
        if (question.learnedButton) {
          question.learnedButton.classList.toggle("learned", learned);
          question.learnedButton.setAttribute("aria-pressed", learned ? "true" : "false");
          question.learnedButton.title = learned ? "取消已学习" : "标记已学习";
        }
        if (question.tocLink) {
          question.tocLink.classList.toggle("learned", learned);
        }
      }

      function getCurrentPageFile() {
        const fromPath = window.location.pathname.split("/").filter(Boolean).pop() || "";
        if (Object.values(categoryPages).includes(fromPath)) {
          return fromPath;
        }
        if (currentCategory && categoryPages[currentCategory]) {
          return categoryPages[currentCategory];
        }
        return fromPath;
      }

      async function savePageSections() {
        if (!window.HtmlSerializer) {
          throw new Error("序列化模块未加载");
        }
        const pageFile = getCurrentPageFile();
        if (!pageFile || !Object.values(categoryPages).includes(pageFile)) {
          throw new Error("无法识别当前页面文件，请通过 http://localhost:3000/ 访问");
        }
        const sectionsHtml = window.HtmlSerializer.serializeMainSections();
        if (!sectionsHtml.trim()) {
          throw new Error("没有可保存的题目内容");
        }
        const response = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: pageFile,
            sections: sectionsHtml
          })
        });
        const rawBody = await response.text();
        let payload = {};
        try {
          payload = JSON.parse(rawBody);
        } catch (error) {
          /* ignore malformed response */
        }
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "保存失败（HTTP " + response.status + "）");
        }
      }

      function removeQuestionFromState(question) {
        const key = questionStorageKey(question);
        delete state.learned[key];
        saveLearnedState();
        const index = state.questions.indexOf(question);
        if (index !== -1) {
          state.questions.splice(index, 1);
        }
      }

      async function deleteQuestion(question) {
        const title = stripNumber(question.originalTitle);
        if (!confirm("确定要删除题目「" + title + "」吗？")) {
          return;
        }

        const section = question.container;
        const parent = section.parentNode;
        const nextSibling = section.nextSibling;
        section.remove();

        try {
          await savePageSections();
          removeQuestionFromState(question);
          renumberQuestions();
          renderToc();
          renderCategoryStats();
          applyFilter();
        } catch (error) {
          if (nextSibling) {
            parent.insertBefore(section, nextSibling);
          } else {
            parent.appendChild(section);
          }
          const message = error && error.message ? error.message : "删除失败";
          alert(
            message +
            "\n\n请确认已运行 npm run dev，并通过 http://localhost:3000/ 打开页面。"
          );
        }
      }

      const addQuestionDialogState = {
        anchorQuestion: null,
        panel: null,
        sectionIdInput: null,
        titleInput: null,
        errorEl: null,
        confirmBtn: null
      };

      function initAddQuestionDialog() {
        if (addQuestionDialogState.panel) {
          return;
        }

        const panel = document.createElement("div");
        panel.className = "add-question-panel";
        panel.hidden = true;
        panel.innerHTML =
          '<div class="add-question-dialog" role="dialog" aria-label="新增题目">' +
          '<div class="add-question-header"><strong>新增题目</strong></div>' +
          '<label class="add-question-label">sectionId<input class="add-question-input" type="text" autocomplete="off" placeholder="cpython-gc"></label>' +
          '<label class="add-question-label">题目<input class="add-question-input" type="text" autocomplete="off" placeholder="CPython GC 机制"></label>' +
          '<p class="add-question-error" aria-live="polite"></p>' +
          '<div class="add-question-actions">' +
          '<button type="button" class="tool-btn" data-action="cancel">取消</button>' +
          '<button type="button" class="tool-btn add-question-confirm" data-action="confirm">确认添加</button>' +
          "</div>" +
          "</div>";
        document.body.appendChild(panel);

        addQuestionDialogState.panel = panel;
        addQuestionDialogState.sectionIdInput = panel.querySelector(".add-question-input");
        addQuestionDialogState.titleInput = panel.querySelectorAll(".add-question-input")[1];
        addQuestionDialogState.errorEl = panel.querySelector(".add-question-error");
        addQuestionDialogState.confirmBtn = panel.querySelector('[data-action="confirm"]');

        panel.addEventListener("click", function (event) {
          if (event.target === panel) {
            closeAddQuestionDialog();
          }
        });

        panel.querySelector('[data-action="cancel"]').addEventListener("click", closeAddQuestionDialog);

        panel.querySelector('[data-action="confirm"]').addEventListener("click", function () {
          submitAddQuestion();
        });

        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape" && addQuestionDialogState.panel && !addQuestionDialogState.panel.hidden) {
            closeAddQuestionDialog();
          }
        });
      }

      function closeAddQuestionDialog() {
        if (!addQuestionDialogState.panel) {
          return;
        }
        addQuestionDialogState.panel.hidden = true;
        addQuestionDialogState.anchorQuestion = null;
        addQuestionDialogState.errorEl.textContent = "";
      }

      function openAddQuestionDialog(anchorQuestion) {
        initAddQuestionDialog();
        addQuestionDialogState.anchorQuestion = anchorQuestion;
        addQuestionDialogState.sectionIdInput.value = "";
        addQuestionDialogState.titleInput.value = "";
        addQuestionDialogState.errorEl.textContent = "";
        addQuestionDialogState.panel.hidden = false;
        addQuestionDialogState.sectionIdInput.focus();
      }

      function isSectionIdTaken(sectionId) {
        return Array.from(document.querySelectorAll("main > section")).some(function (section) {
          return section.id === sectionId;
        });
      }

      function validateAddQuestionInputs(sectionId, title) {
        if (!sectionId) {
          return "sectionId 不能为空";
        }
        if (!/^[a-zA-Z][\w-]*$/.test(sectionId)) {
          return "sectionId 格式不合法，需以字母开头，仅含字母、数字、下划线、连字符";
        }
        if (isSectionIdTaken(sectionId)) {
          return "sectionId「" + sectionId + "」在当前页已存在";
        }
        if (!title) {
          return "题目不能为空";
        }
        return "";
      }

      async function addQuestionAfter(anchorQuestion, sectionId, title) {
        const section = document.createElement("section");
        section.id = sectionId;
        section.innerHTML = "<h2>" + escapeHtml(title) + "</h2><p>待补充内容</p>";
        anchorQuestion.container.insertAdjacentElement("afterend", section);

        const newQuestion = enhanceQuestion(section);
        if (!newQuestion) {
          section.remove();
          throw new Error("新题目创建失败");
        }

        const anchorIndex = state.questions.indexOf(anchorQuestion);
        const insertIndex = anchorIndex === -1 ? state.questions.length : anchorIndex + 1;
        state.questions.splice(insertIndex, 0, newQuestion);
        categoryBySection[sectionId] = currentCategory;

        try {
          await savePageSections();
          renumberQuestions();
          renderToc();
          renderCategoryStats();
          applyFilter();
          closeAddQuestionDialog();
          requestAnimationFrame(function () {
            newQuestion.container.scrollIntoView({ behavior: "smooth", block: "start" });
            newQuestion.container.classList.add("search-hit");
            window.setTimeout(function () {
              newQuestion.container.classList.remove("search-hit");
            }, 1400);
          });
        } catch (error) {
          section.remove();
          state.questions.splice(insertIndex, 1);
          delete categoryBySection[sectionId];
          throw error;
        }
      }

      async function submitAddQuestion() {
        const anchorQuestion = addQuestionDialogState.anchorQuestion;
        if (!anchorQuestion) {
          return;
        }

        const sectionId = addQuestionDialogState.sectionIdInput.value.trim();
        const title = addQuestionDialogState.titleInput.value.trim();
        const error = validateAddQuestionInputs(sectionId, title);
        if (error) {
          addQuestionDialogState.errorEl.textContent = error;
          return;
        }

        addQuestionDialogState.errorEl.textContent = "";
        addQuestionDialogState.confirmBtn.disabled = true;

        try {
          await addQuestionAfter(anchorQuestion, sectionId, title);
        } catch (err) {
          const message = err && err.message ? err.message : "新增失败";
          addQuestionDialogState.errorEl.textContent =
            message + "。请确认已运行 npm run dev，并通过 http://localhost:3000/ 打开页面。";
        } finally {
          addQuestionDialogState.confirmBtn.disabled = false;
        }
      }

      function createLearnedButton(question) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "learned-btn";
        button.textContent = "\u2713";
        button.setAttribute("aria-label", "标记已学习");
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          rememberQuestion(question);
          setQuestionLearned(question, !isQuestionLearned(question));
          saveLearnedState();
          updateLearnedVisual(question);
          updateStats();
          renderCategoryStats();
        });
        question.learnedButton = button;
        return button;
      }

      function createDeleteButton(question) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "delete-btn";
        button.textContent = "\u00d7";
        button.title = "删除题目";
        button.setAttribute("aria-label", "删除题目");
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          if (button.disabled) {
            return;
          }
          button.disabled = true;
          deleteQuestion(question).finally(function () {
            button.disabled = false;
          });
        });
        return button;
      }

      function createAddButton(question) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "add-btn";
        button.textContent = "+";
        button.title = "在此题下方新增题目";
        button.setAttribute("aria-label", "新增题目");
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          openAddQuestionDialog(question);
        });
        return button;
      }

      function createQuestionActions(question) {
        const actions = document.createElement("div");
        actions.className = "question-actions";
        actions.appendChild(createLearnedButton(question));
        if (LOCAL_HOSTS.has(window.location.hostname)) {
          actions.appendChild(createDeleteButton(question));
          actions.appendChild(createAddButton(question));
        }
        return actions;
      }

      function enhanceQuestion(section) {
        const h2 = section.querySelector(":scope > .question-heading h2, :scope > h2");
        if (!h2) {
          return null;
        }
        const titleText = h2.textContent.trim();
        if (/^\d+-\d+\./.test(titleText)) {
          return null;
        }

        section.classList.add("question-card");
        const heading = document.createElement("div");
        heading.className = "question-heading";
        section.insertBefore(heading, h2);
        heading.appendChild(h2);

        const answer = document.createElement("div");
        answer.className = "answer";
        while (heading.nextSibling) {
          answer.appendChild(heading.nextSibling);
        }
        section.appendChild(answer);

        const question = {
          id: section.id,
          titleElement: h2,
          originalTitle: h2.textContent.trim(),
          category: currentCategory,
          container: section,
          parentSection: section,
          text: normalize(section.textContent)
        };
        heading.appendChild(createQuestionActions(question));
        section.addEventListener("click", function () {
          rememberQuestion(question);
        });
        updateLearnedVisual(question);
        return question;
      }

      function buildQuestions() {
        document.querySelectorAll("main > section").forEach(function (section) {
          if (section.id === "summary") {
            return;
          }
          const question = enhanceQuestion(section);
          if (question) {
            state.questions.push(question);
          }
        });
      }

      function renumberQuestions() {
        const counters = Object.fromEntries(categoryOrder.map(function (category) {
          return [category, 0];
        }));

        state.questions.forEach(function (question) {
          counters[question.category] += 1;
          const cleanTitle = stripNumber(question.originalTitle);
          question.displayNumber = counters[question.category];
          question.titleElement.textContent = question.displayNumber + ". " + cleanTitle;
        });
      }

      function getTocLinksContainer(group) {
        let container = group.querySelector(".toc-links");
        if (!container) {
          container = document.createElement("div");
          container.className = "toc-links";
          group.appendChild(container);
        }
        Array.from(group.querySelectorAll(":scope > a")).forEach(function (link) {
          container.appendChild(link);
        });
        return container;
      }

      function renderToc() {
        document.querySelectorAll(".toc-group").forEach(function (group) {
          const category = group.dataset.filter;
          const linksContainer = getTocLinksContainer(group);
          Array.from(linksContainer.querySelectorAll("a")).forEach(function (link) {
            link.remove();
          });
          state.questions
            .filter(function (question) {
              return question.category === category;
            })
            .forEach(function (question) {
              const link = document.createElement("a");
              link.href = "#" + question.id;
              link.textContent = question.titleElement.textContent;
              link.classList.toggle("learned", isQuestionLearned(question));
              question.tocLink = link;
              linksContainer.appendChild(link);
            });
        });
      }

      function applyFilter() {
        const query = normalize(state.query);
        let visible = 0;

        state.questions.forEach(function (question) {
          const categoryOk = query ? true : question.category === state.filter;
          const queryOk = !query || question.text.includes(query);
          const show = categoryOk && queryOk;
          question.container.style.display = show ? "" : "none";
          if (show) {
            visible += 1;
          }
        });

        document.querySelectorAll("main > section").forEach(function (section) {
          if (section.id === "summary") {
            section.style.display = "none";
            return;
          }
          const sectionQuestions = state.questions.filter(function (question) {
            return question.parentSection === section;
          });
          if (!sectionQuestions.length) {
            return;
          }
          const hasVisible = sectionQuestions.some(function (question) {
            return question.container.style.display !== "none";
          });
          section.style.display = hasVisible ? "" : "none";
        });

        emptyState.classList.toggle("show", visible === 0);
        updateStats(visible);
      }

      function updateStats(visibleCount) {
        if (studyStats) {
          studyStats.textContent = "";
        }
      }

      function getSearchMatches() {
        const query = normalize(state.query);
        if (!query) {
          return [];
        }
        return state.questions.filter(function (question) {
          return question.text.includes(query);
        });
      }

      function renderSearchSuggestions() {
        const matches = getSearchMatches().slice(0, 12);

        if (!state.query.trim()) {
          searchSuggestions.classList.remove("show");
          searchSuggestions.innerHTML = "";
          return;
        }

        if (!matches.length) {
          searchSuggestions.innerHTML = '<div class="search-suggestion-empty">没有匹配题目</div>';
          searchSuggestions.classList.add("show");
          return;
        }

        searchSuggestions.innerHTML = matches.map(function (question, index) {
          const title = escapeHtml(question.titleElement.textContent);
          const category = escapeHtml(categoryLabels[question.category] || question.category);
          return '<button class="search-suggestion" type="button" role="option" data-question-index="' + index + '">'
            + '<span class="suggestion-title">' + title + '</span>'
            + '<span class="suggestion-category">' + category + '</span>'
            + '</button>';
        }).join("");
        searchSuggestions._matches = matches;
        searchSuggestions.classList.add("show");
      }

      function jumpToQuestion(question) {
        rememberQuestion(question);
        state.query = "";
        searchInput.value = "";
        searchSuggestions.classList.remove("show");
        searchSuggestions.innerHTML = "";
        setFilter(question.category);
        requestAnimationFrame(function () {
          question.container.scrollIntoView({ behavior: "smooth", block: "start" });
          question.container.classList.add("search-hit");
          window.setTimeout(function () {
            question.container.classList.remove("search-hit");
          }, 1400);
        });
      }

      function restoreEditorScroll() {
        const raw = sessionStorage.getItem("editor-scroll-restore");
        if (!raw) {
          return false;
        }
        sessionStorage.removeItem("editor-scroll-restore");
        try {
          const data = JSON.parse(raw);
          requestAnimationFrame(function () {
            window.scrollTo(0, data.scrollY || 0);
          });
          return true;
        } catch (error) {
          return false;
        }
      }

      function restoreLastQuestion() {
        const savedKey = localStorage.getItem("study-current-question");
        const question = state.questions.find(function (item) {
          return questionStorageKey(item) === savedKey || item.id === savedKey;
        });

        if (!question) {
          setFilter(currentCategory);
          return;
        }

        setFilter(question.category);
        requestAnimationFrame(function () {
          question.container.scrollIntoView({ behavior: "auto", block: "start" });
          question.container.classList.add("search-hit");
          window.setTimeout(function () {
            question.container.classList.remove("search-hit");
          }, 1000);
        });
      }

      function renderCategoryStats() {
        const pageQuestions = state.questions.filter(function (question) {
          return question.category === currentCategory;
        });
        const total = pageQuestions.length;
        const learnedTotal = pageQuestions.filter(function (question) {
          return isQuestionLearned(question);
        }).length;
        const label = categoryLabels[currentCategory] || currentCategory;
        categoryStats.innerHTML = '<span class="category-stat"><span>' + label + '</span><strong>' + total + ' 题 / 已学习 ' + learnedTotal + ' 题</strong></span>';

        document.querySelectorAll(".toc-count").forEach(function (count) {
          count.remove();
        });
      }

      function setFilter(filter) {
        if (filter !== currentCategory && categoryPages[filter]) {
          window.location.href = categoryPages[filter];
          return;
        }
        state.filter = filter;
        document.querySelectorAll(".filter-btn").forEach(function (button) {
          button.classList.toggle("active", button.dataset.filter === filter);
        });
        document.querySelectorAll(".toc-group").forEach(function (group) {
          group.classList.toggle("active", group.dataset.filter === filter);
        });
        applyFilter();
      }

      buildQuestions();
      renumberQuestions();
      renderToc();
      renderCategoryStats();
      applyPageScopedMigration();

      searchInput.addEventListener("input", function () {
          state.query = searchInput.value;
          applyFilter();
          renderSearchSuggestions();
        });

        searchInput.addEventListener("focus", function () {
          renderSearchSuggestions();
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            const first = searchSuggestions._matches && searchSuggestions._matches[0];
            if (first) {
              event.preventDefault();
              jumpToQuestion(first);
            }
          }
          if (event.key === "Escape") {
            searchSuggestions.classList.remove("show");
          }
        });

        searchSuggestions.addEventListener("click", function (event) {
          const button = event.target.closest(".search-suggestion");
          if (!button) {
            return;
          }
          const index = Number(button.dataset.questionIndex);
          const question = searchSuggestions._matches && searchSuggestions._matches[index];
          if (question) {
            jumpToQuestion(question);
          }
        });

        document.addEventListener("click", function (event) {
          if (!event.target.closest(".search-wrap")) {
            searchSuggestions.classList.remove("show");
          }
        });

        document.getElementById("filterBar").addEventListener("click", function (event) {
          const button = event.target.closest(".filter-btn");
          if (button) {
            localStorage.setItem("study-current-category", button.dataset.filter);
            localStorage.removeItem("study-current-question");
            setFilter(button.dataset.filter);
          }
        });

        document.querySelector("aside").addEventListener("click", function (event) {
          const link = event.target.closest("a[href^='#']");
          if (link) {
            event.preventDefault();
            const id = link.getAttribute("href").slice(1);
            const question = state.questions.find(function (item) {
              return item.id === id || questionStorageKey(item) === id;
            });
            if (question) {
              jumpToQuestion(question);
            }
            return;
          }

          const group = event.target.closest(".toc-group");
          if (group && group.dataset.filter) {
            localStorage.setItem("study-current-category", group.dataset.filter);
            localStorage.removeItem("study-current-question");
            setFilter(group.dataset.filter);
          }
        });

        compactBtn.addEventListener("click", function () {
          document.body.classList.toggle("compact");
          const enabled = document.body.classList.contains("compact");
          localStorage.setItem("study-compact", enabled ? "1" : "0");
          compactBtn.textContent = enabled ? "\u8be6\u7ec6\u6a21\u5f0f" : "\u6838\u5fc3\u901f\u89c8";
        });

        darkBtn.addEventListener("click", function () {
          document.body.classList.toggle("dark");
          const enabled = document.body.classList.contains("dark");
          localStorage.setItem("study-dark", enabled ? "1" : "0");
          darkBtn.textContent = enabled ? "\u6d45\u8272\u6a21\u5f0f" : "\u6df1\u8272\u6a21\u5f0f";
        });

        if (localStorage.getItem("study-compact") === "1") {
          document.body.classList.add("compact");
          compactBtn.textContent = "\u8be6\u7ec6\u6a21\u5f0f";
        }

        if (localStorage.getItem("study-dark") === "1") {
          document.body.classList.add("dark");
          darkBtn.textContent = "\u6d45\u8272\u6a21\u5f0f";
        }

      if (!restoreEditorScroll()) {
        restoreLastQuestion();
      }
    })();
