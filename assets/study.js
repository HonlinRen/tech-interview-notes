(function () {
      const categoryBySection = {
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
        "bi-encoder-cross-encoder": "ai",
        "big-hot-key": "redis",
        "big-key-governance": "redis",
        bigdecimal: "java",
        "bio-nio-aio": "java",
        "bitmap-scenarios": "redis",
        "blocking-queue-compare": "java",
        "blue-green-rolling-canary": "architecture",
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
        "chunk-design": "ai",
        "chunk-overlap": "ai",
        "circuit-breaker-half-open": "architecture",
        citations: "ai",
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
        "dense-vs-sparse": "ai",
        "dependency-management": "python",
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
        "embedding-selection": "ai",
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
        "global-id": "mysql",
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
        hitl: "ai",
        "hnsw-vs-ivf": "ai",
        "horizontal-vertical-sharding": "mysql",
        "hot-cold-separation": "mysql",
        "hot-data-cache": "architecture",
        "hot-key-governance": "redis",
        "hot-key-protection": "architecture",
        "hpa-vs-vpa": "docker-k8s",
        "http-vs-rpc": "architecture",
        "hybrid-search": "ai",
        "hyperloglog-scenarios": "redis",
        "id-properties": "architecture",
        idempotency: "architecture",
        "identifier-vs-keyword": "java",
        "image-optimization": "docker-k8s",
        "image-vs-container": "docker-k8s",
        "implicit-conversion": "mysql",
        "incremental-update": "ai",
        "index-condition-pushdown": "mysql",
        "index-failure": "mysql",
        "index-speed": "mysql",
        "indirect-prompt-injection": "security",
        "infinite-loop": "ai",
        "innodb-engine": "mysql",
        "io-multiplexing": "java",
        "io-patterns": "java",
        iplusplus: "java",
        "is-vs-equals": "python",
        isempty: "java",
        isolation: "mysql",
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
        "langchain-vs-langgraph": "ai",
        "langgraph-node": "ai",
        "langgraph-state": "ai",
        leaderboard: "redis",
        "left-prefix": "mysql",
        "linkedhashmap-order": "java",
        "linkedlist-insert": "java",
        "list-set-queue-map": "java",
        "llm-as-judge": "ai",
        "llm-basics": "ai",
        "llm-output-filter": "security",
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
        metadata: "ai",
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
        "pdf-table-rag": "ai",
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
        proxy: "java",
        "pubsub-vs-stream": "redis",
        pydantic: "python",
        "python-bytecode": "python",
        "qps-tps-rt": "observability",
        quantization: "ai",
        "query-cache-removed": "mysql",
        "query-rewrite": "ai",
        raft: "architecture",
        "rag-agent-metrics": "observability",
        "rag-basics": "ai",
        "rag-pipeline": "ai",
        "rag-poisoning": "security",
        "rag-vs-finetuning": "ai",
        ragas: "ai",
        "rate-limit-algorithms": "architecture",
        "rate-limit-circuit-degrade": "architecture",
        "rbac-vs-abac": "security",
        "rdb-aof": "redis",
        react: "ai",
        "reactor-model": "java",
        "read-write-lock": "java",
        "read-write-split": "mysql",
        "recall-troubleshooting": "ai",
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
        rerank: "ai",
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
        "server-storage-layer": "mysql",
        service: "docker-k8s",
        "service-discovery": "architecture",
        "sft-rlhf-dpo": "ai",
        "sharding-pagination": "mysql",
        "sharding-when": "mysql",
        "short-url": "architecture",
        "similarity-metrics": "ai",
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
        "state-persistence": "ai",
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
        "three-logs": "mysql",
        "timeout-principles": "architecture",
        token: "ai",
        "token-blacklist": "security",
        "token-bucket-vs-leaky-bucket": "architecture",
        "token-cost": "ai",
        "token-monitoring": "observability",
        "tool-calling-auth": "security",
        "tool-calling-mcp": "ai",
        "tool-fallback": "ai",
        "tool-param-validation": "ai",
        "tool-timeout": "ai",
        "topk-recall": "ai",
        "trace-id-propagation": "observability",
        "trace-slow-locate": "observability",
        "trace-span": "observability",
        "transaction-message": "architecture",
        transactional: "spring",
        transformer: "ai",
        "treemap-vs-hashmap": "java",
        "two-phase-commit": "mysql",
        "tx-propagation": "spring",
        "unique-index-sharding": "architecture",
        "update-db-vs-delete-cache": "architecture",
        "utf8-vs-utf8mb4": "mysql",
        "uuid-db-snowflake": "architecture",
        "vector-db-selection": "ai",
        "vector-dimensions": "ai",
        "vector-retrieval": "ai",
        "version-conflict": "ai",
        "virtual-threads": "java",
        volatile: "java",
        "web-push": "architecture",
        "why-bplus-tree": "mysql",
        "wrapper-cache": "java",
        "wsgi-asgi": "python",
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

      const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "architecture", "observability", "security"];

            const categoryPages = {
        "python": "python.html",
        "java": "java.html",
        "spring": "spring.html",
        "mysql": "mysql.html",
        "redis": "redis.html",
        "rocketmq": "rocketmq.html",
        "docker-k8s": "docker-k8s.html",
        "ai": "ai.html",
        "architecture": "architecture.html",
        "observability": "observability.html",
        "security": "security.html"
      };

const categoryLabels = {
        python: "Python",
        java: "Java / JVM",
        spring: "Spring Boot",
        mysql: "MySQL",
        redis: "Redis",
        rocketmq: "RocketMQ",
        "docker-k8s": "Docker / K8S",
        ai: "AI Agent / RAG",
        architecture: "网关 / 架构",
        observability: "可观测性",
        security: "安全 / 鉴权"
      };

      // 学习状态 v2：按「分类:题目id」存储，避免跨专题串数据。
      // 新增题目请使用全新 section id，并在 categoryBySection 注册，勿改历史 id。
      const LEARNED_STORAGE_KEY = "study-learned-v2";
      const LEGACY_LEARNED_STORAGE_KEY = "study-learned-questions";
      const CROSS_PAGE_SECTION_IDS = ["capacity-planning"];
      const LEGACY_STORAGE_KEY_REMAP = {
        "observability:capacity-planning": "observability:obs-capacity-planning"
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
        heading.appendChild(createLearnedButton(question));
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

      function renderToc() {
        document.querySelectorAll(".toc-group").forEach(function (group) {
          const category = group.dataset.filter;
          Array.from(group.querySelectorAll("a")).forEach(function (link) {
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
              group.appendChild(link);
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

      restoreLastQuestion();
    })();
