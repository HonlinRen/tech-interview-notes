---
title: "Spring Boot 高频问题整理"
permalink: "developer/spring.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "spring"
---
## Spring AOP 原理 {#spring-aop}

### 面试快答

Spring AOP 通常借助代理在方法调用前后执行横切逻辑，适合日志、审计和事务。能否增强取决于代理类型、方法可覆盖性以及调用是否经过代理。

### 详细解析

同类内部直接调用通常绕过代理；不要通过把所有方法改成 public 来掩盖调用边界问题。设计切面时明确顺序、异常传播和与事务拦截器的交互。

当一个 Bean 需要被切面增强时，Spring 容器里实际暴露的通常不是原始对象，而是代理对象。

调用方调用的是代理方法，执行时会先经过切面逻辑，再进入目标方法。

```java
调用方
-> 调用代理对象方法
-> 执行切面前置逻辑
-> 调用目标方法
-> 执行切面后置 / 异常 / 返回逻辑
-> 返回结果
```

#### 核心概念

| 概念 | 含义 |
| --- | --- |
| Join Point 连接点 | 方法执行中可以插入切面的点，在 Spring AOP 里通常指方法执行 |
| Pointcut 切点 | 匹配哪些连接点需要增强，例如 `execution(...)`、`@annotation(...)` |
| Advice 通知 | 在连接点上执行的具体逻辑，例如前置、后置、环绕 |
| Aspect 切面 | 切点 + 通知的组合 |
| Target 目标对象 | 被增强的原始 Bean |
| Proxy 代理对象 | 容器最终暴露给调用方的对象 |

#### 常见通知类型

-   `@Before`：前置通知，在目标方法执行之前执行，常用于参数校验、日志记录、权限校验。
-   `@After`：后置通知，在目标方法执行完成后执行，无论是否抛出异常都会执行，类似 `finally`。
-   `@AfterReturning`：返回通知，在目标方法正常返回后执行，可获取返回值。
-   `@AfterThrowing`：异常通知，在目标方法抛出异常时执行，常用于异常日志和监控。
-   `@Around`：环绕通知，可控制目标方法是否执行，是功能最强的一种通知。

```java
@Aspect
@Component
public class LogAspect {

    @Around("execution(* com.example.service.*.*(..))")
    public Object log(ProceedingJoinPoint joinPoint) throws Throwable {
        System.out.println("before");
        Object result = joinPoint.proceed();
        System.out.println("after");
        return result;
    }
}
```

#### JDK 动态代理 vs CGLIB

| 对比项 | JDK 动态代理 | CGLIB |
| --- | --- | --- |
| 前提 | 目标类实现了接口 | 通过继承生成子类代理 |
| 实现方式 | 基于接口方法拦截 | 基于字节码生成子类 |
| 限制 | 只能代理接口方法 | `final` 类或方法无法代理 |
| 默认策略 | 有接口时优先使用 | 无接口时使用 |

可通过 `spring.aop.proxy-target-class=true` 强制使用 CGLIB。Spring Boot 2.x 以后默认更倾向于类代理。

面试可补充：事务、缓存、异步、`@Transactional` 本质上都依赖代理 AOP 完成。自调用不经过代理，会影响这些增强生效。

## Spring 事务管理方式 {#spring-tx}

### 面试快答

Spring 用统一事务抽象管理数据库等资源，声明式事务常由代理拦截方法并负责开启、提交和回滚。事务边界应覆盖最小完整业务单元，避免包住慢远程调用。

### 详细解析

默认回滚规则、隔离级别和传播行为都应显式核对。数据库事务不能自动回滚 HTTP、MQ 或文件副作用，跨系统一致性需要可靠消息、补偿或业务状态机。

| 方式 | 特点 | 适用场景 |
| --- | --- | --- |
| 编程式事务 | 代码显式控制提交和回滚 | 局部事务、复杂分支控制 |
| 声明式事务 | 通过注解或 AOP 自动织入 | 常规业务方法，最常用 |

#### 编程式事务

通过 `TransactionTemplate` 或 `PlatformTransactionManager` 手动控制提交和回滚。

优点是**控制精细**，缺点是代码侵入性强、可读性较差。

```java
@Autowired
private TransactionTemplate transactionTemplate;

public void createOrder() {
    transactionTemplate.execute(status -> {
        orderMapper.insert(order);
        inventoryMapper.deduct(skuId, count);
        return null;
    });
}
```

#### 声明式事务

使用 `@Transactional` 标注类或方法，底层依赖 Spring AOP + 动态代理 + `TransactionInterceptor`。方法执行前开启事务，正常结束提交，异常时根据配置回滚。

```java
@Transactional(rollbackFor = Exception.class)
public void createOrder() {
    orderMapper.insert(order);
    inventoryMapper.deduct(skuId, count);
}
```

声明式事务是项目中最常见的方式，因为它把事务边界和具体业务逻辑解耦。

需要注意：方法必须是 public、避免自调用、异常被吞掉等情况可能导致事务不按预期生效。

## @Transactional 失效场景 {#transactional}

### 面试快答

@Transactional 失效常见于调用绕过代理、异常被吞、回滚规则不匹配、异步线程切换或对象不由容器管理。排查应沿实际调用链验证事务是否开启及连接是否加入。

### 详细解析

不能笼统说非 public 一定无效，方法可见性支持取决于代理方式与 Spring 版本。自调用、final 方法与 JDK 接口代理的限制需结合项目实现判断。

#### 从实际代理调用排查

1. 确认对象由 Spring 管理，调用者持有的是代理。
2. 同类内部通过 this 调用通常绕过代理；把事务边界放到另一个服务或使用明确的编程式事务。
3. JDK 接口代理通常要求公共接口方法。Spring 6 的类代理默认也可支持 protected 或包可见方法；private、final 等限制需区分代理方式，不能一概只背 public。
4. 检查异常是否被捕获、是否匹配回滚规则，以及事务是否已被内层标为 rollback-only。
5. 检查数据库与事务管理器、数据源是否匹配；异步线程不会自动继承线程绑定事务。

#### 验证效果

构造一个会在写入后失败的场景，通过外部调用入口验证最终数据库状态。只看到注解、日志中有方法调用或测试本身开了事务，都不足以证明生产调用路径有效。

远程请求与消息副作用不随本地数据库自动回滚；缩短事务并设计可靠消息与补偿。

#### 参考资料

[Spring 事务注解与代理限制](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)（2026-10-18 核验，注意目标部署版本。）

## Spring Boot 启动流程介绍？ {#boot-startup-flow}

### 面试快答

Spring Boot 启动会准备环境与上下文、加载配置和 Bean 定义、刷新容器并启动 Web 服务，最后执行应用启动回调。核心是自动配置与容器生命周期的配合。

### 详细解析

定位启动慢按阶段看配置中心、类扫描、数据库连接和外部初始化；不要在 Bean 初始化阶段做无限等待。内嵌服务器生命周期也由应用上下文管理。

#### 主要阶段

SpringApplication 准备启动环境与上下文，加载应用配置和自动配置，刷新上下文以实例化、注入和初始化 Bean，完成相应 Web 服务器生命周期，再执行 Runner 等启动回调。具体事件和子步骤顺序随版本及应用类型不同，应在目标代码或启动记录中确认。

#### 排查启动问题

按阶段查看配置导入、扫描范围、条件装配、Bean 循环依赖、数据库连接及外部初始化。服务器开始监听与应用业务准备就绪可能不是同一时刻，需要 readiness 明确控制流量。

#### 工程要求

启动过程不要执行无超时的外部请求，重要初始化要幂等且可观测。通过条件报告、启动分析和最小配置复现缩小范围，再判断是框架装配还是业务初始化失败。

## Spring Boot 自动配置原理？ {#auto-config}

### 面试快答

Spring Boot 根据类路径、配置和已有 Bean 等条件装配默认能力，Starter 聚合相关依赖。用户配置通常可以让默认配置退让，具体依赖条件注解和自动配置导入机制。

### 详细解析

Boot 2 旧版本常见 spring.factories，现代 Boot 使用 AutoConfiguration.imports，迁移时以目标版本为准。查看条件评估报告比仅搜索注解更容易解释装配结果。

#### 入口注解

`@SpringBootApplication` 是一个组合注解，核心包括：

-   `@SpringBootConfiguration`：Spring的配置类 @Configuration
-   `@EnableAutoConfiguration`：开启自动配置 根据引入的依赖和配置文件，自动创建Bean（Redis、JDBC）
-   `@ComponentScan`：扫描自己写的业务组件 常见：@Controller @Component @Service

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## Spring Bean 生命周期是什么？ {#bean-lifecycle}

### 面试快答

Bean 通常经历实例化、依赖注入、初始化前处理、初始化及初始化后处理，销毁回调由作用域和容器管理。AOP 代理往往由后处理器在生命周期中生成。

### 详细解析

单例表示容器内共享实例，不代表线程安全；prototype 的销毁通常不由容器自动完整管理。避免在初始化时依赖尚未完成代理或业务初始化的其他对象。

#### 核心流程

```java
实例化 Bean
-> 属性填充（依赖注入）
-> Aware 回调（BeanNameAware、ApplicationContextAware 等）
-> BeanPostProcessor 前置处理
-> 初始化方法（@PostConstruct / InitializingBean / init-method）
-> BeanPostProcessor 后置处理（AOP 代理常在此阶段完成）
-> Bean 可使用
-> 容器关闭时执行销毁（@PreDestroy / DisposableBean / destroy-method）
```

## Spring MVC 请求处理流程？ {#spring-mvc-flow}

### 面试快答

请求由 DispatcherServlet 分发，经 HandlerMapping 找到处理器、HandlerAdapter 调用，完成参数绑定、校验和返回值处理。拦截器、过滤器和异常解析各处于不同层级。

### 详细解析

排查 404、参数错误和响应异常时先确定失败阶段。线程上下文必须在 finally 或完成回调清理，异步请求还要考虑线程切换与超时。

```java
请求进入 DispatcherServlet
-> HandlerMapping 找到处理器
-> HandlerAdapter 适配并调用目标方法
-> 参数解析、类型转换、参数校验
-> 执行业务逻辑
-> 返回 ModelAndView 或响应体
-> ViewResolver 渲染视图，或 HttpMessageConverter 写出 JSON
```

#### 核心组件

| 组件 | 职责 |
| --- | --- |
| `DispatcherServlet` | 前端控制器，统一调度请求 |
| `HandlerMapping` | 根据 URL 和注解映射到处理器 |
| `HandlerAdapter` | 调用具体 Controller 方法 |
| `HandlerMethodArgumentResolver` | 解析方法参数 |
| `HttpMessageConverter` | 读写 JSON、XML 等消息体 |
| `ViewResolver` | 解析视图并渲染页面 |

REST API 场景下，常见写法是 `@RestController`，返回值由 `HttpMessageConverter` 直接序列化为 JSON，不再走传统视图解析。

## WebFlux是什么？ {#spring-webflux}

### 面试快答

WebFlux 基于响应式流处理请求，适合端到端非阻塞和流式 I/O。收益来自并发等待管理与背压，不能把阻塞 JDBC 放进事件线程后仍宣称全链路非阻塞。

### 详细解析

引入 Reactor 会增加调试和上下文传播成本。选择 MVC、虚拟线程或 WebFlux 应结合依赖生态与负载验证，不因“异步”标签默认换框架。

#### Spring MVC 和 WebFlux 的区别

| 对比项 | Spring MVC | Spring WebFlux |
| --- | --- | --- |
| 底层模型 | Servlet 阻塞式 I/O，一个请求通常占用一个线程 | Reactive Streams + 非阻塞 I/O，少量线程处理大量并发连接 |
| 运行容器 | 主要运行在 Servlet 容器，如 Tomcat、Jetty | 可运行在 Netty，也可运行在支持 Servlet 3.1+ 的容器 |
| 返回类型 | 普通对象、`ModelAndView`、`ResponseEntity` 等 | 常用 `Mono` 表示 0/1 个结果，`Flux` 表示 0/N 个结果 |
| 适用场景 | 传统 CRUD、同步数据库访问、常规 REST 服务 | 高并发长连接、流式响应、网关、聚合多个异步下游服务 |
| 开发心智 | 命令式同步代码，调试和排查相对直接 | 响应式链式编程，需要理解背压、异步边界和非阻塞约束 |
| 生态依赖 | 适合搭配 JDBC、MyBatis、JPA 等阻塞式技术 | 需要尽量搭配 R2DBC、Reactive Redis、Reactive MongoDB 等响应式驱动 |

#### WebFlux 的核心思想

-   **非阻塞 I/O：**线程不在等待网络或下游响应时被挂住，而是把等待交给事件循环。
-   **响应式流：**通过 `Publisher`、`Subscriber`、`Subscription` 等规范处理异步数据流。
-   **背压机制：**消费端可以告诉生产端自己能处理多少数据，避免上游把下游压垮。
-   **少量线程承载高并发：**通过事件驱动模型提升连接并发能力，但要求业务链路中不能混入大量阻塞调用。
-   **端到端响应式：**只有 Controller、Service、数据库驱动、远程调用都尽量非阻塞，WebFlux 的优势才明显。

面试里可以这样总结：Spring MVC 更适合大多数同步业务系统，WebFlux 更适合 I/O 密集、高并发、流式或异步聚合场景。WebFlux 不是简单地让接口变快，而是用响应式编程模型减少线程等待，提高资源利用率。

## Spring Boot 配置文件优先级怎么理解？ {#config-priority}

### 面试快答

Spring Boot 从多种 PropertySource 读取配置，后续高优先级来源可覆盖已有值。命令行、环境变量、外部文件和 Profile 的具体顺序应以目标版本及加载方式验证。

### 详细解析

同时审查配置导入、Profile 激活和配置中心扩展，避免以为修改文件就一定生效。敏感配置使用受控密钥服务，并记录可追踪的配置版本与发布范围。

#### 常见配置来源

-   命令行参数
-   Java 系统属性 `System.getProperties()`
-   操作系统环境变量
-   `application-{profile}.yml`
-   `application.yml`
-   默认属性

#### 工程实践

-   默认配置放在 `application.yml`。
-   环境差异放在 `application-dev.yml`、`application-prod.yml`。
-   敏感信息通过环境变量、密钥系统或配置中心注入。
-   部署环境可通过环境变量覆盖数据库地址、Redis 地址等。

```yaml
spring:
  profiles:
    active: dev

---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 8080
```

面试可补充：Spring Boot 2.4 之后推荐用 `spring.config.import` 引入外部配置，而不是过度依赖复杂的加载顺序记忆。

## Spring Boot 2 升级到 3 有哪些变化？ {#boot2-to-boot3}

### 面试快答

从 Boot 2 升级到 3，要检查最低 JDK、javax 到 jakarta 的命名迁移，以及依赖、配置和安全框架兼容性。应先升级到适合迁移的旧版本，再分批处理破坏性变更。

### 详细解析

迁移不等于只改包名，还需检查 ORM、容器、监控和第三方 Starter。此题讨论 2→3 迁移经验，不把 Boot 3 视为所有项目的当前最新版本。

#### 核心变化

| 变化点 | 说明 |
| --- | --- |
| 最低 JDK | 要求 JDK 17 及以上 |
| 基础框架 | 依赖 Spring Framework 6 |
| 命名空间 | `javax.*` 迁移到 `jakarta.*` |
| 自动配置注册 | 推荐 `AutoConfiguration.imports` 替代 `spring.factories` |
| 可观测性 | 增强 Micrometer、Tracing 支持 |
| Native 支持 | 增强 GraalVM Native Image 能力 |

#### 升级检查清单

-   确认 JDK 版本满足要求。
-   检查第三方依赖是否支持 Spring Boot 3 / Jakarta EE。
-   替换代码中的 `javax.servlet`、`javax.persistence` 等包引用。
-   检查自定义 starter 和自动配置注册方式。
-   回归 Web、参数校验、安全框架等关键链路。

## Spring 事务传播机制是什么？ {#tx-propagation}

### 面试快答

事务传播决定方法遇到已有事务时如何参与：REQUIRED 常加入当前事务，REQUIRES_NEW 使用独立事务，NESTED 通常依赖保存点。业务隔离和资源成本要一起考虑。

### 详细解析

REQUIRES_NEW 可能额外占用连接，池太小时会等待耗尽。内层标记 rollback-only 后，外层即使吞掉异常也可能在提交时收到 UnexpectedRollbackException。

```java
@Service
public class OrderService {

    @Transactional
    public void createOrder() {
        // 1. 创建订单
        orderMapper.insert();

        // 2. 扣减库存
        stockService.deductStock();
    }
}
```

```java
@Service
public class StockService {

    @Transactional
    public void deductStock() {
        stockMapper.update();
    }
}
```

| 传播行为 | 含义 | 典型场景 |
| --- | --- | --- |
| `REQUIRED` | 有事务就加入，没有就新建 | 默认，最常用 |
| `REQUIRES_NEW` | 挂起当前事务并新建独立事务 | 审计日志、独立保存 |
| `MANDATORY` | 必须在事务中运行，否则异常 | 强制依赖外层事务 |
| `NEVER` | 不能在事务中运行，否则异常 | 明确禁止事务 |

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void writeAuditLog() {
    auditMapper.insert(log);
}
```

## DI 依赖注入有哪些方式？ {#spring-di}

### 面试快答

依赖注入把对象装配交给容器，构造器注入适合表达必要依赖和不可变性。按类型或名称选择对象时应明确限定符，避免依赖隐含命名或反射顺序。

### 详细解析

@Autowired 与 @Resource 的解析规则不同，迁移还涉及 jakarta.annotation 包。循环依赖通常暴露职责问题，优先拆分协作边界，不把提前暴露对象当成常规设计。

**DI（Dependency Injection，依赖注入）** 是 IoC 的具体实现方式，本质是把对象所依赖的其他对象，在对象创建时注入进来。

#### 三种常见注入方式

| 方式 | 写法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 构造器注入 | 构造函数参数 | 依赖关系明确 | 依赖多时构造函数较长 |
| Setter 注入 | `setXxx()` | 可选依赖灵活 | 对象可能存在不完整状态 |
| 字段注入 | `@Autowired` 直接注字段 | 写法简单 | 不利于测试，隐藏依赖 |

```java
// 构造器注入
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

```java
//set注入
@Service
public class OrderService {

    private PayService payService;

    @Autowired
    public void setPayService(PayService payService) {
        this.payService = payService;
    }
}
```

```java
//字段注入
@Service
public class OrderService {

    @Autowired
    private PayService payService;
}
```

Spring 官方更推荐构造器注入，因为依赖在对象创建时就确定，且方便写单元测试。Setter 注入适合可选依赖，字段注入虽然常见，但工程上更偏向构造器注入。

## @Component、@Service、@Repository、@Controller 有什么区别？ {#stereotype-annotations}

### 面试快答

@Component 是通用组件标记，@Service、@Repository、@Controller 表达分层职责。职责注解除了便于理解，也可能参与异常转换或 Web 返回值处理等框架能力。

### 详细解析

注解本身不替代模块边界或业务约束。@RestController 与响应体处理有关，异常统一输出应由明确的异常处理链实现，避免控制层到处手动拼错误体。

| 注解 | 语义 | 说明 |
| --- | --- | --- |
| `@Component` | 通用组件 | 最基础的组件注解 |
| `@Service` | 业务服务 | 语义上表示业务逻辑层 |
| `@Repository` | 数据访问层 | 会转换持久化异常为 Spring 的 `DataAccessException` |
| `@Controller` | 控制层 | 标识 Spring MVC 控制器 |

从功能上看，它们都会让类被扫描成 Bean；从工程规范看，用不同注解是为了保持分层职责清晰。REST 项目里常见的是 `@RestController`，它等于 `@Controller + @ResponseBody`。

## Spring 事件机制是什么？ {#spring-events}

### 面试快答

Spring 事件用于解耦同一应用内的通知，默认发布通常同步执行，监听器会影响调用耗时和异常。异步事件与事务事件需要单独配置和定义失败策略。

### 详细解析

进程内事件不具备可靠 MQ 的持久化和重放保证。事务提交后触发通知仍可能遇到进程退出；关键业务使用 Outbox 或持久化任务补偿。

#### 核心组件

-   `ApplicationEvent`：事件对象。
-   `ApplicationListener` 或 `@EventListener`：事件监听器。
-   `ApplicationEventPublisher`：事件发布器。

```java
public class OrderCreatedEvent extends ApplicationEvent {
    public OrderCreatedEvent(Object source) {
        super(source);
    }
}

@Component
public class SmsListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // 发送通知
    }
}
```

默认事件是同步执行的，如果希望解耦主流程，可以配合 `@Async` 异步处理。Spring Boot 也支持更轻量的业务事件模型，但核心思想都是“发布事件，让监听者自行处理”。

## Spring 中 FactoryBean 和普通 Bean 有什么区别？ {#factory-bean}

### 面试快答

普通 Bean 是容器管理的对象；FactoryBean 是由容器管理、用于生产另一个对象的工厂扩展点。按普通名称通常获取其产品，使用 & 前缀获取工厂本身。

### 详细解析

不要把 FactoryBean 与 BeanFactory 混为一谈。框架用它集成代理或复杂客户端时，要明确产品的单例语义、类型预测与销毁生命周期。

#### 区别

| 对比项 | 普通 Bean | FactoryBean |
| --- | --- | --- |
| 容器中的对象 | 就是业务对象本身 | 是工厂对象 |
| 获取结果 | 直接注入使用 | 通过 `getObject()` 得到目标对象 |
| 典型场景 | Service、Repository | 复杂对象创建，如 MyBatis 的 `SqlSessionFactoryBean` |

```java
public class DemoFactoryBean implements FactoryBean<Connection> {
    @Override
    public Connection getObject() {
        return createConnection();
    }

    @Override
    public Class<?> getObjectType() {
        return Connection.class;
    }
}
```

注意：如果想从容器拿到 FactoryBean 工厂对象本身，而不是它生产的对象，需要在 Bean 名前加 `&`，例如 `&demoFactoryBean`。

## Spring Boot Actuator 常用于哪些监控场景？ {#actuator}

### 面试快答

Actuator 暴露健康、指标和诊断等运维端点，可接入监控体系。部署时要区分存活与就绪检查，控制管理端口、认证与敏感端点的暴露。

### 详细解析

健康检查不应依赖所有下游都成功，否则容易放大级联故障。将请求延迟、错误、连接池与线程池指标和业务告警关联，避免只监控进程是否还活着。

#### 常见端点

| 端点 | 作用 |
| --- | --- |
| `/actuator/health` | 健康检查，K8S 探针常用 |
| `/actuator/metrics` | 查看 JVM、HTTP、线程池等指标 |
| `/actuator/info` | 应用版本、构建信息 |
| `/actuator/env` | 查看环境变量和配置 |
| `/actuator/loggers` | 动态调整日志级别 |

生产环境通常只暴露必要端点，并配合 Spring Security、鉴权、Prometheus、Grafana 使用。不要把敏感端点直接无保护暴露到公网。

## Feign 底层是什么？ {#feign-underlying}

### 面试快答

Feign 把接口方法通过代理转成 HTTP 请求，负责参数编码、请求发送、响应解码及错误处理。它是一类声明式远程调用工具，RPC 是更广泛的调用抽象。

### 详细解析

配置连接与读超时、连接池、重试和鉴权传播，关注服务发现与负载均衡所在层。写请求超时后不能直接无脑重试，需结合幂等键与结果确认。

**一个声明式 HTTP 客户端框架**

在 Spring Cloud 里，常见链路是：

```text
你调用 Feign 接口方法
        ↓
JDK 动态代理拦截
        ↓
解析接口方法上的注解
        ↓
构造 HTTP 请求
        ↓
经过负载均衡器选择服务实例（去注册中心获取 user-service 实例列表）
        ↓
底层 HTTP Client 发请求
        ↓
拿到响应
        ↓
Decoder 反序列化成 Java 对象
```
