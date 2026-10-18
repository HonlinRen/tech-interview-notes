// Editorial decisions for the 2026-10-18 migration. Archived; never run automatically.
module.exports = {
  merges: {
    python: { multiprocessing:'concurrency', coroutine:'async-await', nonlocal:'closure', 'is-vs-equals':'mutable-immutable', 'parameter-passing':'mutable-immutable', 'property-decorator':'decorator', 'magic-methods':'context-manager', 'what-is-FastAPI':'fastapi-di', 'fastapi-vs-flask-django':'wsgi-asgi', 'async-vs-sync-database':'fastapi-sync-async', 'new-vs-init':'dataclass' },
    java: { 'jvm-heap':'jvm-memory', 'static-vs-dynamic-proxy':'proxy', 'thread-pool-flow':'thread-pool-params', classloaders:'class-loading', 'parent-delegation':'class-loading', 'gc-roots':'minor-vs-full-gc', 'aot-pros-cons':'jit-vs-aot', 'wrapper-cache':'autoboxing', 'list-set-queue-map':'collection-framework', 'arraylist-expansion':'collection-framework', 'arraylist-unsafe':'collection-framework', 'linkedlist-insert':'collection-framework', 'hashset-hashmap':'hashmap-principle', 'treemap-vs-hashmap':'collection-framework', 'notify-vs-notifyall':'sleep-vs-wait', 'create-thread':'runnable-callable', 'executors-why-not':'thread-pool-params', 'stop-the-world':'minor-vs-full-gc', 'jvm-tools':'jvm-params', 'sync-async-block-nonblock':'bio-nio-aio' },
    spring: { 'boot-vs-spring':'auto-config', starter:'auto-config', 'bean-scope':'bean-lifecycle', 'spring-ioc':'spring-di', 'spring-annotations':'stereotype-annotations', 'autowired-vs-resource':'spring-di', 'spring-design-patterns':'spring-aop', 'external-config':'config-priority', 'conditional-assembly':'auto-config', 'embedded-tomcat':'boot-startup-flow', 'feign-vs-rpc':'feign-underlying' },
    mysql: { 'isolation-lock-relation':'isolation', 'current-read-snapshot':'mvcc', 'innodb-engine':'mysql-layer-and-logs', 'sql-execution-flow':'mysql-layer-and-logs', 'sql-optimization':'slow-query', 'replication-lag':'read-write-split', 'bplus-vs-btree':'index-speed', 'why-bplus-tree':'index-speed', 'connection-pool-full':'connection-pool', 'explain-fields-to-check':'slow-query' },
    redis: { maxmemory:'eviction-policy', 'redis-use-cases':'data-structures', 'string-scenarios':'data-structures', 'zset-structure':'data-structures', 'big-key-governance':'big-hot-key', 'hot-key-governance':'big-hot-key', 'hash-slot':'replication-modes', 'redis-coroutine-connection':'redis-pool-management' },
    rocketmq: { 'rocketmq-order-vs-normal':'rocketmq-ordered-message', 'rocketmq-nameserver':'rocketmq-components', 'rocketmq-producer-modes':'rocketmq-send-modes', 'rocketmq-dlq':'rocketmq-retry', 'consumer-retry-on-error':'rocketmq-retry', 'rocketmq-broadcast':'rocketmq-consumer-group', 'rocketmq-cluster-consume':'rocketmq-consumer-group', 'rocketmq-sync-async-replication':'rocketmq-broker-ha', 'rocketmq-horizontal-scaling':'rocketmq-message-backlog' },
    'docker-k8s': { 'docker-compose':'container-networking', 'image-optimization':'dockerfile', 'k8s-intro':'pod', 'pod-vs-container':'pod', 'K8S-Node-Pod':'pod' },
    ai: { 'rag-basics':'rag-pipeline', 'structured-data-rag':'text-to-sql', 'faithfulness-eval':'eval-dataset', 'llm-as-judge':'eval-dataset', ragas:'eval-dataset', 'ragas-code-eval':'eval-dataset', 'few-shot':'prompt-versioning', 'skills-vs-function-calling':'skills-how-it-works', 'context-window':'token-cost' },
    'rag-vector': { 'chunk-overlap':'chunk-design', 'bm25-vs-keyword':'vector-vs-bm25', 'rag-image-handling':'pdf-table-rag', 'image-text-vector-same-db':'pdf-table-rag', 'version-conflict':'incremental-update', 'milvus-vs-chroma':'vector-db-selection', 'chroma-milvus-ha':'vector-db-selection' },
    langchain: { 'langchain-build-flow':'langchain-structure', 'langgraph-edge':'langgraph-node', 'langgraph-builder':'langchain-vs-langgraph', 'langgraph-state':'state-persistence' },
    llm: { 'inference-flow':'inference-vs-training', 'token-by-token':'prefill-decode', 'attention-on2':'attention-mechanism', 'kv-cache-memory':'kv-cache', 'llm-finetuning':'sft-finetuning' },
    architecture: { 'k8s-service':'docker-k8s:service', 'arch-hpa-vs-vpa':'docker-k8s:hpa-vs-vpa', 'circuit-breaker-half-open':'rate-limit-circuit-degrade', 'degrade-strategy':'rate-limit-circuit-degrade', 'retry-with-idempotency':'retry-risks', 'service-load-balance-strategy':'load-balance-algorithms' },
    observability: { 'trace-span':'otel-intro', 'trace-id-propagation':'logs-metrics-trace-correlation' },
    security: { 'JWT-auth':'jwt-basics', 'orm-sql-injection':'prevent-sql-injection', 'frontend-backend-validation':'request-security-checks', 'button-data-permission':'permission-system', 'replay-attack':'api-signing' },
    bigdata: { 'hadoop-intro':'bigdata-common-flow', 'hive-intro':'bigdata-common-flow', 'hive-cold-hot-storage':'bigdata-common-flow', 'spark-flink-intro':'bigdata-common-flow' }
  },
  removals: {
    python: ['python-singleton', 'mro'],
    java: ['break-parent-delegation', 'pattern-matching', 'jvm-jdk-jre', 'java-bytecode', 'compile-and-interpret'],
    'docker-k8s': ['Slurm'],
    ai: ['rag-open-source-frameworks', 'what-is-dify'],
    'rag-vector': ['text-embedding-v3-spec', 'ragflow-intro'],
    llm: ['qwen-model-intro']
  }
};
