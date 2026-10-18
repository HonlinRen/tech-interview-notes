---
title: "Docker / K8S 高频问题整理"
permalink: "developer/docker-k8s.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "docker-k8s"
---
## 镜像 Image 和容器 Container 有什么区别？ {#image-vs-container}

### 面试快答

镜像是用于创建容器的分层模板，容器是镜像加上运行状态、可写层和隔离配置形成的实例。容器共享宿主内核，隔离能力与虚拟机不同。

### 详细解析

不要把重要数据只写在容器可写层；镜像应不可变并通过摘要或明确版本发布。排障要分清镜像构建问题、运行配置问题和宿主资源问题。

```bash
镜像：静态模板，类似安装包。
容器：镜像运行后的实例，类似正在运行的进程。
```

镜像是静态的，容器是运行中的实例。一个镜像可以启动多个容器。

## Dockerfile 是什么？常见指令有哪些？ {#dockerfile}

### 面试快答

Dockerfile 声明镜像构建步骤，重点是可复现、依赖缓存、最小运行环境和非 root 运行。多阶段构建可把编译工具与运行产物分开。

### 详细解析

合理安排 COPY 与依赖安装顺序，使用 .dockerignore，避免密钥进入构建层。镜像越小不必然越安全，还需补丁、依赖来源和运行时最小权限。

```bash
FROM openjdk:17
WORKDIR /app
COPY target/demo.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

-   `FROM`：指定基础镜像
-   `WORKDIR`：工作目录
-   `COPY`：复制文件
-   `EXPOSE`：声明端口
-   `CMD`：启动命令

## Docker 容器之间如何通信？ {#container-networking}

### 面试快答

同一自定义网络中的容器通常可用服务名通信，对外访问通过明确端口映射或入口代理。Compose 能声明多容器应用、网络和卷，但不替代生产集群编排。

### 详细解析

容器内 localhost 指向当前网络命名空间，不能默认访问宿主或其他容器。排查按 DNS、监听地址、端口、网络策略和应用协议逐层验证。

```text
外部客户端
    │  localhost:8080（端口映射）
    ▼
宿主机 ── docker0 网桥 ──┬── 容器 A（172.18.0.2）
                        └── 容器 B（172.18.0.3）
                             同一自定义网络内可用容器名 / 服务名互访
```

#### 四种网络模式

| 模式 | 特点 | 典型场景 |
| --- | --- | --- |
| bridge（默认） | 容器接入虚拟网桥，彼此隔离；需自定义网络或端口映射才能互访 | 单机多容器，最常用 |
| host | 容器直接使用宿主机网络栈，无独立 IP | 追求极致网络性能、端口不冲突时 |
| none | 无网络，完全隔离 | 安全沙箱、离线计算 |
| container | 共享另一个容器的网络命名空间 | Sidecar、网络代理伴生容器 |

#### 容器间互访的三种做法

1.  **自定义 bridge 网络（推荐）**：同一网络内容器可通过**容器名 DNS** 互访，无需记 IP。
    
    ```bash
    docker network create app-net
    docker run -d --name redis --network app-net redis:7
    docker run -d --name api  --network app-net my-api
    # api 容器内直接访问 redis:6379
    ```
    
2.  **端口映射（-p）**：把容器端口暴露到宿主机，适合**容器 ↔ 宿主机 / 外部**访问，不是容器间首选。
    
    ```bash
    docker run -d -p 8080:8080 --name api my-api
    curl http://localhost:8080/health
    ```
    
3.  **Compose 服务名**：同一 `docker-compose.yml` 下的服务自动加入同一网络，用**服务名当主机名**。
    
    ```bash
    # compose 中 api 访问 mysql:3306、redis:6379
    DATABASE_URL=mysql://root:pwd@mysql:3306/demo
    ```
    

#### 面试要点

-   默认 bridge 下，不同 `docker run` 启动的容器**不能**直接用容器名解析，需加入同一 user-defined network。
-   容器访问宿主机服务：Linux 可用 `host.docker.internal`（Docker Desktop 内置）或宿主机网关 IP。
-   生产多机通信靠 K8s Service / Overlay 网络，单机 Compose 靠内置 DNS 即可。

## Docker 数据持久化怎么做？ {#data-persistence}

### 面试快答

容器数据持久化通过卷、绑定挂载或外部存储实现，生命周期应独立于容器实例。数据库不仅需要持久卷，还需要可靠备份、一致性恢复和故障演练。

### 详细解析

确认挂载权限、容量、访问模式和节点故障迁移能力。不要直接复制正在写入的数据目录当成一致备份，应用或存储层需要对应的快照策略。

```text
容器（临时可写层）  ← 删容器即丢
    │
    ├── Volume（Docker 管理，推荐）
    ├── Bind Mount（挂载宿主机目录）
    └── tmpfs（内存，重启即丢）
```

#### 三种挂载方式对比

| 方式 | 存储位置 | 优点 | 注意 |
| --- | --- | --- | --- |
| **Volume** | `/var/lib/docker/volumes/` | Docker 统一管理、易备份迁移、跨平台 | 生产数据库首选 |
| **Bind Mount** | 宿主机任意路径 | 开发时直接改本地文件、所见即所得 | 路径依赖宿主机、权限问题多 |
| **tmpfs** | 内存 | 极快、不落盘 | 仅适合临时缓存、密钥 |

#### 常用命令与示例

```bash
# 命名 Volume（推荐）
docker volume create mysql-data
docker run -d --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8

# Bind Mount（开发常用）
docker run -d -v /data/mysql:/var/lib/mysql mysql:8

# 查看 Volume
docker volume ls
docker volume inspect mysql-data
```

#### Compose 中声明持久化

```yaml
services:
  mysql:
    image: mysql:8
    volumes:
      - mysql-data:/var/lib/mysql   # 命名卷
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # 只读绑定
volumes:
  mysql-data:   # 顶层声明，Compose 自动创建
```

#### 最佳实践

-   生产用**命名 Volume**，不要把数据库文件直接 bind 到随机目录。
-   配置文件可用 bind mount 或 ConfigMap（K8s），**数据与配置分离**。
-   定期备份：`docker run --rm -v mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql.tgz /data`
-   注意文件权限：MySQL 容器内通常以 `mysql` 用户写数据，宿主机目录权限不对会导致启动失败。

**一句话：**无状态应用容器可随时重建；有状态服务的数据必须挂在 Volume / 外部存储，与容器生命周期解耦。

## Docker 容器如何查看日志和排查问题？ {#logs-debug}

### 面试快答

排查容器问题先看退出码、状态、事件和日志，再检查资源、配置、依赖与网络。日志应输出到标准流并由平台收集，避免仅保存在临时容器层。

### 详细解析

区分进程异常、OOM、健康检查失败和宿主故障。进入容器调试应有可审计方式，修复要回到镜像或配置，不能靠手动改容器维持运行。

```bash
docker ps
docker logs container_id
docker exec -it container_id /bin/bash
docker inspect container_id
docker stats
```

先看容器是否运行，再看日志，必要时进入容器检查环境变量、网络和进程。

## Pod 是什么？ {#pod}

### 面试快答

Pod 是 Kubernetes 的最小调度单元，内部容器共享网络与部分资源，运行在 Node 上。多个应用副本应由控制器创建多个 Pod，而不是在一个 Pod 塞入大量无关进程。

### 详细解析

Pod IP 和实例可随重建变化，通过 Service 等稳定入口访问。Sidecar 应服务同一生命周期需求，资源配额与探针需按容器分别设计。

Pod 是 K8s 最小调度单位，通常一个 Pod 运行一个业务容器。Pod 内容器共享网络和存储卷。

## Deployment 是什么？ {#deployment}

### 面试快答

Deployment 用声明式副本与滚动策略管理无状态工作负载，经 ReplicaSet 维持期望 Pod 数。它会重建失败实例，但不自动解决应用的数据一致性和兼容性。

### 详细解析

设置资源、探针、优雅终止和发布策略，保证新旧版本共存时协议兼容。持久身份或有状态存储需求应评估 StatefulSet 与外部数据服务。

```bash
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: demo-app
          image: demo-app:1.0
```

## Service 是什么？为什么需要 Service？ {#service}

### 面试快答

Service 为一组可变 Pod 提供稳定的服务发现和访问入口，通过选择器与 EndpointSlice 等关联后端。它主要解决寻址和转发，不等同于 API 网关。

### 详细解析

检查无后端、端口不匹配、就绪状态与网络策略。ClusterIP、NodePort、LoadBalancer 的访问范围不同，具体负载均衡行为还受集群数据面影响。

Pod IP 不稳定，Service 为一组 Pod 提供稳定访问入口和负载均衡，通过 selector 关联 Pod，集群内 DNS 访问。

## ConfigMap 和 Secret 有什么区别？ {#configmap-vs-secret}

### 面试快答

ConfigMap 保存一般配置，Secret 表达敏感数据，但 Base64 编码不是加密。敏感信息还需传输保护、静态加密、RBAC、轮换和访问审计。

### 详细解析

环境变量通常不会随对象更新自动刷新，挂载文件更新与应用重载也不同。避免把 Secret 打进镜像或日志，密钥高要求场景可使用外部密钥服务。

ConfigMap 存放普通配置；Secret 存放密码、Token、证书等敏感信息。两者都支持环境变量或 Volume 挂载注入容器。

## K8s 如何做滚动发布和回滚？ {#rolling-update-rollback}

### 面试快答

滚动发布逐步替换实例，配合就绪检查、最大不可用数与额外副本控制可用性。回滚主要恢复工作负载版本，不能自动撤销数据库迁移和外部副作用。

### 详细解析

发布前保证新旧版本兼容，采用可回退的扩展再收缩数据迁移。终止时先摘流量，再处理存量请求并在宽限期内退出，验证连接与队列任务不被直接截断。

```bash
kubectl rollout status deployment/demo-app
kubectl rollout undo deployment/demo-app
```

Deployment 逐步创建新 Pod、下线旧 Pod，异常时可快速回滚到上一版本。

## K8s 的 HPA 和 VPA 有什么区别？ {#hpa-vs-vpa}

### 面试快答

HPA 调整副本数量，VPA 调整单实例资源请求等配置，两者解决不同的容量问题。扩缩容受指标、稳定窗口、调度资源和应用启动时间限制。

### 详细解析

CPU 指标常与 requests 有关，必须合理配置基线。两种自动伸缩若同时控制相同资源信号可能相互影响，应明确职责并防止抖动。

| 类型 | 方向 | 场景 |
| --- | --- | --- |
| HPA | 水平：增减 Pod 数量 | 流量波动、无状态服务 |
| VPA | 垂直：调整单 Pod 资源 | 资源申请不合理 |

## Pod 一直启动失败，你会怎么排查？ {#pod-failure-troubleshooting}

### 面试快答

Pod 启动失败先看 describe 事件与状态，再检查镜像、调度、挂载、配置、探针和应用日志。CrashLoopBackOff 是重启退避现象，不是根因。

### 详细解析

Pending 常涉及调度或挂载，ImagePullBackOff 看镜像和凭证，OOMKilled 看实际内存与限额。查看 previous 日志捕获上一次退出前的信息，并与发布变更关联。

```bash
kubectl get pods
kubectl describe pod pod-name
kubectl logs pod-name
kubectl logs pod-name --previous
```

常见原因：ImagePullBackOff、CrashLoopBackOff、配置缺失、健康检查失败、资源不足、应用自身异常。
