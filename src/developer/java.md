---
title: "Java / JVM 高频问题整理"
permalink: "developer/java.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "java"
---
## JVM 运行时内存结构 {#jvm-memory}

### 面试快答

JVM 运行时内存包括堆、虚拟机栈、方法区等；线程栈与程序计数器按线程隔离，堆用于共享对象。排障还要关注元空间、直接内存和线程等堆外开销。

### 详细解析

年轻代、老年代的组织取决于收集器，不能把所有 JVM 都画成固定 Eden/Survivor 结构。容器 RSS 超限不一定是堆溢出，应对照堆、Native Memory Tracking、线程数和 cgroup 限额。

#### 运行时区域与实现

- 堆保存对象实例及数组，是垃圾收集的重要区域。
- 方法区是规范中的逻辑区域；HotSpot 的类元数据主要存于元空间，元空间使用本地内存。不能把所有静态字段和字符串对象都归入元空间。
- 每个线程有自己的虚拟机栈、程序计数器等状态。栈帧含局部变量表、操作数栈、动态链接和返回相关信息。

#### 分代与实际排障

常见分代收集器按对象年龄组织年轻代和老年代，新对象往往先进入年轻代，存活后可能晋升；G1 采用 Region 组织，其他收集器也有自己的布局。回答前说明收集器和 JDK，避免把某一种布局当成 JVM 规范。

堆溢出、元空间溢出、直接内存不足和无法创建线程是不同故障。容器内还要看进程 RSS、线程栈、原生库及内存限额，结合 GC 日志、jcmd/JFR 和必要的 NMT 数据定位。

## volatile 作用 {#volatile}

### 面试快答

volatile 保证可见性并建立特定的 happens-before 关系，但不保证 count++ 等复合操作原子性。它适合状态发布和开关，多变量不变量仍需锁或其他同步机制。

### 详细解析

准确表述是对同一 volatile 变量的写 happens-before 后续读，而不是简单理解成“每次都访问物理内存”。发布引用不等于引用指向的所有后续修改都自动线程安全。

#### 内存语义

对同一 volatile 变量的写 happens-before 后续读，配合程序顺序和传递性可实现安全发布。JVM 和处理器以相应的屏障与实现机制满足此语义，不应将它解释为每次直接访问物理内存。

#### 适用与边界

独立的停止开关适合 volatile；计数自增、先检查再更新和多个字段共同维持约束时，仍需要原子类或锁。发布一个不可变配置引用很合适，但引用指向可变集合时，后续集合修改不会自动变安全。

```java
private volatile boolean running = true;

public void stop() {
    running = false;
}
```

任务还需要正确处理中断和资源清理；停止开关不能唤醒永久阻塞的 I/O。双重检查单例则必须同时解决构造完成前引用被其他线程观察到的问题。

#### 参考资料

[Java 内存模型](https://docs.oracle.com/javase/specs/jls/se15/html/jls-17.html)（2026-10-18 核验，注意目标部署版本。）

## synchronized 和 ReentrantLock 区别 {#locks}

### 面试快答

synchronized 和 ReentrantLock 都支持可重入互斥；前者自动释放且语法简单，后者提供可中断、限时尝试、公平策略和多个 Condition。按协调需求选，不预设谁更快。

### 详细解析

显式锁必须在成功获取后用 finally 释放。公平锁会影响吞吐；synchronized 的实现与虚拟线程协作随 JDK 版本演进，性能结论必须基于目标版本和负载。

#### 能力对比

| 能力 | synchronized | ReentrantLock |
| --- | --- | --- |
| 释放方式 | 离开块或方法时自动释放监视器 | 由调用方在 finally 中 unlock |
| 重入 | 支持 | 支持 |
| 超时获取 | 无直接 API | tryLock 支持 |
| 可中断地获取 | 无直接 API | lockInterruptibly 支持 |
| 条件等待 | 对象监视器的 wait/notify 协议 | 可创建多个 Condition |

两者都可能排队与等待，不宜把区别写成“一个有队列，一个没有”。普通临界区优先保持简单，确需超时、中断或多条件等待时使用显式锁。

#### 释放示例

```java
lock.lock();
try {
    updateState();
} finally {
    lock.unlock();
}
```

如果使用 tryLock，只有返回成功才进入对应释放路径。公平策略会影响吞吐，性能优劣需要在目标 JDK 与竞争模式下测量。

## Java 动态代理是什么？ {#proxy}

### 面试快答

动态代理在运行时为调用添加统一逻辑，JDK 代理面向接口，基于子类的代理覆盖可重写方法。常用于 RPC、事务和切面，关键是实际调用是否经过代理对象。

### 详细解析

静态代理需要预先编写代理类；子类代理无法正常增强 final 方法。排查切面不生效时先检查对象来源、调用入口和方法可见性，再看配置。

| 代理类型 | 生成时机 | 特点 |
| --- | --- | --- |
| 静态代理 | 编码阶段 | 代理类手写，结构直观，但类数量膨胀。 |
| 动态代理 | 运行阶段 | 运行时生成代理类或子类，适合框架统一增强。 |

#### JDK 动态代理

JDK 动态代理要求目标类实现接口，底层通过 `Proxy` 和 `InvocationHandler` 拦截接口方法调用。

```java
interface UserService {
    void save();
}
```

```java
InvocationHandler handler = (proxy, method, args) -> {
    System.out.println("before");
    Object result = method.invoke(target, args);
    System.out.println("after");
    return result;
};
```

#### CGLIB 动态代理

通过生成目标类的子类实现代理。不要求接口，但不能代理 `final` 类和 `final` 方法。

| 类型 | 原理 | 是否需要接口 |
| --- | --- | --- |
| JDK 动态代理 | 基于接口生成代理类 | 是 |
| CGLIB | 生成目标类子类 | 否 |

面试里可以补一句：Spring AOP 默认有接口时倾向使用 JDK 动态代理，没有接口时通常使用 CGLIB。动态代理解决的是“统一横切增强”的问题，不适合把复杂业务逻辑藏进代理层。

## HashMap 原理是什么？ {#hashmap-principle}

### 面试快答

HashMap 用哈希定位桶，通过链表或树处理冲突，容量扩张时重新分配桶。键的 equals/hashCode 必须一致且稳定，普通 HashMap 不适合并发修改。

### 详细解析

JDK 8 常见实现中树化还受表容量约束，不应只背链表长度阈值。HashSet 借助映射键完成去重；复杂业务键最好使用不可变值对象。

`HashMap` 是基于数组、链表和红黑树实现的 key-value 容器。核心思路是先通过 key 的 `hashCode()` 计算哈希值，再定位到数组桶位；如果多个 key 落到同一个桶，就通过链表或红黑树解决哈希冲突。

```java
put 流程：
计算 key 的 hash
-> 定位数组下标
-> 桶为空：直接放入
-> 桶不为空：比较 hash 和 equals
-> key 已存在：覆盖 value
-> key 不存在：追加到链表或红黑树
-> 元素数量超过阈值：触发扩容
```

#### JDK 8 后的结构变化

JDK 8 之后，桶内元素较少时使用链表；当链表长度达到阈值且数组容量足够大时，会转成红黑树，把极端冲突下的查询复杂度从 O(n) 降到 O(log n)。

| 点 | 说明 |
| --- | --- |
| 默认容量 | 常见默认初始容量为 16，容量通常保持 2 的幂，方便用位运算定位桶位。 |
| 负载因子 | 默认 0.75，在空间占用和冲突概率之间做平衡。 |
| 扩容 | 元素数量超过容量乘负载因子后扩容，扩容会重新分布节点。 |
| null | 允许一个 null key，也允许 null value。 |

面试里要强调：自定义对象作为 key 时必须正确重写 `equals()` 和 `hashCode()`；`HashMap` 本身不是线程安全的，并发写入要使用外部锁或并发容器。

## HashMap 和 ConcurrentHashMap 区别？ {#hashmap-vs-concurrenthashmap}

### 面试快答

HashMap 不保证并发安全；ConcurrentHashMap 支持并发访问，并为部分复合操作提供原子接口。单次 get/put 安全不代表“先查再更新”的业务流程原子。

### 详细解析

优先使用 putIfAbsent、compute 或 merge 实现同一键的原子更新。回调应短小，跨多个键的一致性不能靠单键原子操作保证；遍历为弱一致性。

| 对比项 | HashMap | ConcurrentHashMap |
| --- | --- | --- |
| 线程安全 | 否 | 是 |
| null | 允许 null key / value | 不允许 null key / value |
| 并发控制 | 没有内置同步 | 通过 CAS、synchronized、volatile 等机制控制并发 |
| 读操作 | 并发修改时结果不可靠 | 读操作通常不加全局锁，弱一致但可用 |
| 适用场景 | 局部变量、单线程缓存、请求内临时 Map | 共享缓存、在线状态表、计数映射、高并发读写表 |

JDK 8 的 `ConcurrentHashMap` 不再使用分段锁 Segment，而是以数组桶为粒度进行并发控制。桶为空时常用 CAS 放入节点，桶不为空时对桶头节点加锁，降低全表锁竞争。

它不允许 null 的原因也常被问到：并发场景下 `map.get(key) == null` 无法区分“key 不存在”和“value 本身就是 null”，会造成语义歧义。

## Java 线程池核心参数有哪些？ {#thread-pool-params}

### 面试快答

线程池由核心线程数、最大线程数、队列、存活时间、线程工厂和拒绝策略决定行为。通常先创建核心线程，再入队，队列满后扩容至上限，最后拒绝。

### 详细解析

按任务耗时、阻塞比例和下游容量设置有界队列，监控排队时间与拒绝率。无界队列会积压并让 maximumPoolSize 难以发挥作用；不能只按 CPU 核数套公式。

#### 提交路径

1. 工作线程少于 corePoolSize 时尝试创建线程执行任务。
2. 否则尝试把任务加入工作队列，入队后还会复查执行器状态等条件。
3. 队列无法接受时尝试增加线程至 maximumPoolSize。
4. 无法创建线程或执行器不接受新任务时执行拒绝策略。

#### 参数取舍

有界队列限制积压，但队列长度应由可接受等待时间和任务耗时决定。无界队列可能导致最大线程数形同虚设；SynchronousQueue 不存储任务，其提交行为不同。使用明确的 ThreadPoolExecutor 配置比不加评估地使用 Executors 工厂默认值更容易控制风险。

AbortPolicy 暴露过载，CallerRunsPolicy 让提交者承担执行成本但可能阻塞请求或事件线程，丢弃策略只适用于允许损失的任务。线程命名便于排障，拒绝必须有可观测信号。

#### 验证方式

记录活跃线程、队列长度、排队时长、任务耗时、拒绝与失败；按数据库和外部服务并发上限预算容量。将关键任务持久化，并验证进程退出、队列满和下游变慢时的行为。

## ThreadLocal 原理和风险？ {#threadlocal}

### 面试快答

ThreadLocal 为线程提供独立变量绑定，常用于请求上下文。线程池复用会使未清理的数据串到后续任务，必须在 finally 中 remove，并显式处理异步传播。

### 详细解析

ThreadLocalMap 的弱键不意味着值会立即自动回收。不要将大对象长期放在线程本地变量中，也不要把 InheritableThreadLocal 当成线程池上下文传播方案。

`ThreadLocal` 的作用是让每个线程拥有一份独立变量副本，避免多个线程共享同一个变量。

常见场景包括用户上下文、链路追踪traceId、数据库连接等。

```java
Thread
-> ThreadLocalMap
-> Entry(ThreadLocal 弱引用, value 强引用)
```

它并不是把数据存在 `ThreadLocal` 对象里，而是存在当前线程的 `ThreadLocalMap` 中，`ThreadLocal` 只是访问这个 Map 的 key。

#### 主要风险

-   污染 线程池线程会被复用，如果请求结束不清理，旧上下文可能污染下一个请求。
-   泄漏 `ThreadLocalMap` 的 key 是弱引用，但 value 是强引用；key 被回收后 value 仍可能留在线程里，造成内存泄漏。
-   异步无法使用 异步执行或线程切换后，原线程的 ThreadLocal 值不会自动传递到新线程。

```java
try {
    context.set(userId);
    // business
} finally {
    context.remove();
}
```

所以使用原则很简单：谁设置，谁清理；线程池、Web 请求拦截器、异步任务尤其要放在 `finally` 中调用 `remove()`。

## Java 类加载过程是什么？ {#class-loading}

### 面试快答

类加载包括加载、链接与初始化，链接又包含验证、准备和解析。双亲委派用于复用基础类并降低重复加载风险，类的身份还包含定义它的类加载器。

### 详细解析

区分类加载和静态初始化触发时机；不同加载器的同名类可能无法互转。工程排障重点看依赖冲突、ClassNotFoundException、NoClassDefFoundError 及初始化失败，而非手写绕过委派。

```text
加载：读取 class 字节码
验证：校验字节码安全性
准备：为静态变量分配内存并设置默认值
解析：符号引用转直接引用
初始化：执行静态变量赋值和 static 代码块
```

| 阶段 | 重点 |
| --- | --- |
| 加载 | 通过类加载器读取字节码，生成 `java.lang.Class` 对象。 |
| 验证 | 检查文件格式、元数据、字节码和符号引用是否安全合法。 |
| 准备 | 为类变量分配内存并赋默认值，例如 `static int a = 1` 先得到默认值 0。 |
| 解析 | 把常量池中的符号引用转换成直接引用。 |
| 初始化 | 执行静态变量显式赋值和 `static` 代码块。 |

类加载就是：把 class 搬进 JVM，检查一下，准备静态变量，执行 static 初始化，然后就能用了

类初始化通常发生在首次主动使用时，例如 `new` 对象、访问静态字段、调用静态方法、反射调用等。

双亲委派模型 可以避免核心类被重复或恶意替换，例如应用自定义的 `java.lang.String` 不应该覆盖 JDK 自带类。

## Java 虚拟线程是什么？ {#virtual-threads}

### 面试快答

虚拟线程由 JVM 调度到载体线程，适合大量阻塞 I/O 的线程式代码，不能让 CPU 密集任务突破核心数限制。不要把虚拟线程池化，应控制真正稀缺的下游资源。

### 详细解析

在 JDK 21 与较新版本上，锁相关固定载体线程的行为有差异，升级后应重新验证。数据库连接数、外部接口并发和 ThreadLocal 内存仍然需要限制。

#### 线程与资源

虚拟线程保留 Java 线程式编程模型，由 JVM 调度到较少的载体线程。适合大量同时等待 I/O 的任务，CPU 密集计算仍受硬件并行度限制。JDK 21 将其作为正式特性提供；后续版本继续调整实现。

通常为每个任务创建虚拟线程，用信号量或池限制数据库、连接或远程服务等真正稀缺的资源。不要为追求并发而放开全部请求，否则只会把等待转移到下游。

#### 版本与验证

较早版本中的部分 synchronized 或原生调用可能固定载体线程；较新 JDK 已改善监视器相关限制，不能把旧版本建议机械套用。关注目标版本的诊断事件、线程栈、请求分布和库兼容性。

比较 MVC 平台线程、虚拟线程和异步方案时，保持连接池、数据与负载一致，检查吞吐、P99、内存及取消处理。

#### 参考资料

[JDK 虚拟线程说明](https://docs.oracle.com/en/java/javase/26/core/virtual-threads.html)（2026-10-18 核验，注意目标部署版本。）

## Minor GC 和 Full GC 区别？ {#minor-vs-full-gc}

### 面试快答

Minor GC 通常指年轻代回收，Full GC 通常涉及更广范围，但具体含义与日志事件取决于收集器。定位问题应看停顿、分配率、晋升、存活集和回收原因。

### 详细解析

可达性分析从 GC Roots 出发判断对象是否存活；STW 是应用线程暂停，不能直接等同于“整个 GC 阶段都暂停”。不要把 Major GC、Full GC 和并发周期机械画等号。

#### 术语与可达性

对象是否存活通过可达性分析判断，常见根包括活跃线程栈引用、静态引用及 JNI 等。年轻代回收、混合回收、老年代并发周期和 Full GC 的名称与含义依收集器而变化，先读实际日志。

STW 指应用线程在部分阶段暂停，并不表示所有 GC 工作都在暂停时执行。Full GC 也不宜简单归因于“老年代满了”，显式触发、分配失败等也可能涉及。

#### 排查步骤

结合分配率、晋升、回收后的占用、停顿分布和触发原因判断。频繁的短年轻代回收与持续增长的老年代基线，需要不同处理；后者可进一步查缓存、引用链与大对象。

先验证应用生命周期和容量，再调参数。任何堆转储或高开销诊断都应评估停顿、磁盘和敏感数据。

## JIT 和 AOT 有什么区别？ {#jit-vs-aot}

### 面试快答

JIT 在运行时根据热点与执行反馈编译，AOT 提前生成机器码以改善启动和部署特性。它们在启动、峰值性能、内存、反射和动态能力之间有不同取舍。

### 详细解析

区分 JVM 的提前编译机制与 Native Image 等原生镜像方案。是否收益要按冷启动、稳态吞吐和依赖兼容性测试，不能宣称 AOT 一定比 JIT 快。

| 对比项 | JIT | AOT |
| --- | --- | --- |
| 编译时机 | 程序运行过程中 | 程序运行前 |
| 优化依据 | 真实运行时 profiling 信息 | 静态分析和构建期信息 |
| 启动速度 | 需要解释执行和预热 | 启动更快 |
| 峰值性能 | 长期运行后动态优化能力强 | 运行时优化空间较少 |
| 典型场景 | 长期运行的后端服务 | Serverless、CLI、短生命周期任务 |

HotSpot 的常见执行路径可以理解为：先解释执行，发现热点代码后 JIT 编译成本地机器码，再根据运行时信息继续优化。

## 自动装箱和拆箱是什么？ {#autoboxing}

### 面试快答

自动装箱与拆箱在基本类型和包装类型之间转换，可能引入对象分配、空指针和比较陷阱。比较包装值通常使用 equals，数值计算注意拆箱和溢出。

### 详细解析

缓存会使部分对象身份相同，但不能依赖 == 比较业务数值。Integer 为 null 时参与计算会触发拆箱空指针，热点路径还应评估不必要的装箱成本。

-   `Integer i = 1` 会调用 `Integer.valueOf(1)`。
-   `int x = i` 会调用 `i.intValue()`。
-   包装类型为 null 时自动拆箱会抛出 `NullPointerException`。

```java
Integer count = null;
int total = count; // NullPointerException
```

工程中尤其要小心接口返回的包装类型、数据库字段映射和三元表达式中的隐式拆箱。

## Java 泛型是什么？类型擦除是什么？ {#generics-erasure}

### 面试快答

Java 泛型提供编译期类型检查，常见实现通过类型擦除保留兼容性。运行时通常不能直接区分 List<String> 和 List<Integer>，但声明上的泛型元数据可能仍可反射读取。

### 详细解析

不要把“擦除”理解成所有泛型信息彻底消失。涉及 JSON 反序列化时常需要 TypeToken 或显式类型参数，使用原始类型与不受控转换会把错误推迟到运行期。

类型擦除指大部分泛型信息在编译后被擦除为原始类型或边界类型。

-   `List<String>` 和 `List<Integer>` 运行时通常都是 `List`。
-   类型擦除导致不能直接 `new T()`，不能创建泛型数组，运行时也难以直接判断完整泛型实参。
-   框架需要泛型信息时常用 `ParameterizedType`、`TypeReference` 等方式保留类型描述。

```java
List<String> names = new ArrayList<>();
names.add("ren");

// 编译后主要保留为 List，泛型约束由编译器检查
```

泛型的价值主要在编译期类型安全。运行期如果需要完整泛型信息，通常要借助匿名子类、反射 Type 或框架提供的类型引用对象。

## Java 反射是什么？有哪些使用场景？ {#reflection}

### 面试快答

反射在运行时读取类型信息、访问成员和调用方法，是依赖注入、映射和序列化的基础能力。它带来访问控制、性能、模块边界和原生镜像配置方面的成本。

### 详细解析

先用明确接口和代码生成解决稳定协议，确需动态发现时再用反射。外部输入不应任意决定可加载类或可调用方法，模块开放也应保持最小范围。

```java
// 获取 Class 对象的三种方式
Class<?> clazz1 = Class.forName("com.example.User");
Class<?> clazz2 = User.class;
Class<?> clazz3 = user.getClass();

// 动态创建对象 + 调用方法
Object obj = clazz1.getDeclaredConstructor().newInstance();
Method method = clazz1.getDeclaredMethod("setName", String.class);
method.setAccessible(true);   // 突破 private 限制
method.invoke(obj, "Tom");
```

#### 核心 API

| API | 作用 |
| --- | --- |
| `Class.forName()` / `.class` | 获取 Class 对象 |
| `getDeclaredFields/Methods/Constructors` | 获取字段、方法、构造器（含 private） |
| `newInstance()` / `Constructor.newInstance()` | 动态创建对象 |
| `Method.invoke()` | 动态调用方法 |
| `Field.get/set()` | 动态读写属性 |
| `getAnnotation()` | 读取运行时注解 |

#### 典型使用场景

-   **框架底层**：Spring IoC 根据注解/配置创建 Bean、注入依赖；AOP 代理拦截方法。
-   **ORM / 序列化**：MyBatis 映射结果集到对象；Jackson 通过反射读写 JSON 字段。
-   **注解处理**：JUnit 扫描 `@Test`；JPA 解析 `@Entity`、`@Column`。
-   **插件/扩展**：SPI 加载实现类；动态加载外部 JAR 中的类。
-   **通用工具**：BeanUtils 属性拷贝、对象比较、调试打印。

#### 缺点与优化

-   **性能**：反射调用比直接调用慢，JVM 可通过 `setAccessible(true)` + 缓存 Method/Field 对象优化。
-   **封装破坏**：可访问 private 成员，破坏 OOP 封装边界。
-   **类型安全**：编译期无法检查，错误推迟到运行期。
-   框架通常用**字节码生成**（CGLIB、ASM）替代高频反射路径。

## Java SPI 机制是什么？ {#java-spi}

### 面试快答

SPI 通过约定的服务接口和提供者声明发现实现，ServiceLoader 是常见入口。它适合可插拔扩展，但不是完整的依赖注入或自动配置系统。

### 详细解析

关注实现加载所使用的类加载器、实例化方式和配置打包是否完整。多个实现时需要显式选择策略，不能依赖不稳定的发现顺序。

-   Java 原生 SPI 通过 `META-INF/services/接口全限定名` 文件声明实现类。
-   `ServiceLoader` 会扫描并加载这些实现，典型例子是 JDBC Driver。
-   SPI 适合插件化扩展，但原生 SPI 缺少按条件加载、依赖注入和优先级控制，复杂框架通常会增强这套机制。

## Java 序列化和反序列化是什么？ {#serialization}

### 面试快答

序列化把对象转换为可传输或持久化的数据，反序列化按协议重建数据。跨服务应优先选择版本可演进、字段明确的协议，并限制类型、大小与嵌套深度。

### 详细解析

不要接收不可信的 Java 原生序列化对象。兼容性涉及字段新增、缺失值和语义变更，serialVersionUID 不是协议演进的全部保障。

-   Java 原生序列化要求实现 `Serializable`，但性能、可读性和安全性都不适合很多现代服务场景。
-   服务接口常用 JSON，内部高性能通信可用 Protobuf、Thrift 等二进制协议。
-   反序列化不可信数据可能触发安全漏洞，应限制类型、升级依赖并避免反序列化任意对象。

## Java 集合框架整体结构是什么？ {#collection-framework}

### 面试快答

集合选型围绕有序性、唯一性、键值查找和并发需求：顺序访问常用 ArrayList，去重用 Set，映射用 Map，任务缓冲用 Queue。复杂度要结合内存局部性和实际访问模式。

### 详细解析

LinkedList 找到插入位置仍可能是 O(n)，ArrayList 中间插入需要搬移；不能笼统说链表插删更快。并发修改应选择合适容器或外部同步，视图和迭代器也有各自约束。

#### 按操作选择结构

| 需求 | 常见选择 | 主要边界 |
| --- | --- | --- |
| 顺序存储、按下标访问 | ArrayList | 中间插入和删除需搬移，扩容有复制成本 |
| 去重与成员判断 | HashSet | 依赖稳定的 equals/hashCode，默认不保证迭代顺序 |
| 键值查找 | HashMap | 并发修改需要额外保护 |
| 按键排序或范围操作 | TreeMap | 查找通常 O(log n)，排序关系应与相等语义协调 |
| FIFO 缓冲 | ArrayDeque 或阻塞队列 | 区分单线程、并发、容量与阻塞需求 |

#### 常见误区

LinkedList 的插删只在已经拿到对应节点位置时有局部优势，按下标查找仍需要遍历。ArrayList 具备更好的连续访问局部性，不能只凭“链表插删快”选型。

ArrayList 和 HashMap 不保证并发修改安全；同步包装器的遍历可能仍需外部同步。ConcurrentHashMap 适合并发映射，CopyOnWriteArrayList 适合读多写少且规模受控的场景，均有自己的代价。

#### 工程判断

根据访问频率、数据量、对象大小和线程模型测量，而非只背扩容倍率。接口返回集合还需说明是否可变、是否是原集合的视图，以及调用者是否拥有修改权。

## 线程的生命周期有哪些状态？ {#thread-lifecycle}

### 面试快答

Java 线程状态包括 NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING 和 TERMINATED。排障时用线程栈判断线程在等锁、等条件、睡眠还是执行，并结合 CPU 与请求指标。

### 详细解析

RUNNABLE 不代表持续占满 CPU，也可能涉及本地 I/O。单次线程快照只能提供瞬时证据，定位卡顿应多次采样并比较相同线程的栈变化。

```text
NEW → start() → RUNNABLE ⇄ BLOCKED / WAITING / TIMED_WAITING → run 结束 → TERMINATED
```

#### 六种状态详解

| 状态 | 含义 | 典型触发 |
| --- | --- | --- |
| NEW | Thread 对象已创建，尚未调用 start() | `new Thread(runnable)` |
| RUNNABLE | 可运行：正在执行或等待 CPU 时间片 | start() 之后、未被阻塞/等待时 |
| BLOCKED | 等待获取 synchronized 监视器锁 | 竞争已进入的 synchronized 块/方法 |
| WAITING | 无限期等待，不占用 CPU | Object.wait()、Thread.join()、LockSupport.park() |
| TIMED\_WAITING | 带超时的等待 | Thread.sleep()、wait(timeout)、join(timeout) |
| TERMINATED | run() 执行完毕或异常退出 | 正常结束、未捕获异常、被 interrupt 后退出 |

#### 常见状态转换

-   `start()` 只能调用一次，重复调用会抛 `IllegalThreadStateException`。
-   进入 BLOCKED：线程 A 持有锁，线程 B 在 synchronized 入口等待 → B 为 BLOCKED。
-   进入 WAITING：线程在 synchronized 内调用 `wait()` 会释放锁并进入 WAITING，需 notify 唤醒。
-   `sleep()` 不释放锁，线程进入 TIMED\_WAITING；`wait()` 释放锁，进入 WAITING/TIMED\_WAITING。
-   线程池中的 Worker 线程在取不到任务时会 park，表现为 WAITING/TIMED\_WAITING。

#### 排查工具

```text
// 查看当前线程状态
Thread.currentThread().getState();

// 线上排查：jstack <pid> 输出每个线程 STATE
// 大量 BLOCKED → 锁竞争；大量 WAITING → 线程池/条件等待；大量 RUNNABLE → CPU 密集或忙等
```

## sleep() 和 wait() 有什么区别？ {#sleep-vs-wait}

### 面试快答

sleep 暂停当前线程但不释放已持有的监视器；wait 必须在持有对应监视器时调用，并释放该监视器等待通知。等待条件必须放在 while 中检查。

### 详细解析

notify 随机唤醒一个等待线程，notifyAll 唤醒所有候选者后重新竞争锁，两者都不立即交出锁。条件队列复杂时可用 Condition 或更高层并发工具。

#### 语义差别

sleep 只让当前线程等待一段时间，不释放其已持有的监视器。wait 必须在持有对应对象监视器时调用，会释放这个监视器；被通知、中断、超时或虚假唤醒后，还需要重新获取监视器才能继续。

#### 正确协调

```java
// 等待方
synchronized (lock) {
    while (!condition) {
        lock.wait();
    }
    consume();
}

// 通知方也必须持有同一监视器
synchronized (lock) {
    condition = true;
    lock.notifyAll();
}
```

notify 选择一个等待线程，选择不保证公平；notifyAll 唤醒所有候选后重新竞争。检查条件用 while，不能假定醒来就代表条件满足。多数业务优先使用阻塞队列、信号量或其他更高层工具。

## Runnable 和 Callable 有什么区别？ {#runnable-callable}

### 面试快答

Runnable 不返回结果，Callable 可返回结果并抛出受检异常；通常把任务提交给执行器，通过 Future 获取结果和处理失败。应将业务任务与线程创建分开。

### 详细解析

Future.get 可能阻塞且会包装任务异常，必须设置适当超时。取消是协作机制，任务需要响应中断，不能只调用 cancel 就认定外部副作用已停止。

#### 提交与结果

Runnable 的 run 不返回值，也不能在签名声明任意受检异常；Callable 的 call 有泛型返回值并可声明异常。ExecutorService 的 execute 接收 Runnable，submit 支持两者并返回 Future。

```text
Future<User> future = executor.submit(() -> userDao.findById(1L));
try {
    User user = future.get(3, TimeUnit.SECONDS);
    use(user);
} catch (TimeoutException e) {
    future.cancel(true); // 尝试中断，不保证外部操作已停止
    throw e;
}
```

示例省略上下层对 InterruptedException 与 ExecutionException 的处理，实际业务需要保留中断或转换错误。execute 的异常可进入未捕获异常处理路径，submit 的异常通常存入 Future；不要写成“线程池总会吞异常”。

#### 工程选择

不关心结果也要监控失败与副作用，不能把 fire-and-forget 当作无需补偿。需要结果聚合、超时与取消时，应明确任务生命周期和执行资源上限。

## 乐观锁和悲观锁有什么区别？ {#optimistic-pessimistic-lock}

### 面试快答

悲观锁先排他地保护资源，乐观锁通过版本或条件更新检测冲突。低冲突可考虑乐观方案，高冲突或复杂不变量常适合短事务锁保护。

### 详细解析

数据库版本更新要检查受影响行数，失败后的重试必须有上限。CAS 不等于无成本，高竞争会带来自旋和重复计算，ABA 也需要结合数据模型处理。

悲观锁「先占坑再操作」，乐观锁「先操作再校验是否冲突」。

#### 核心对比

| 对比项 | 悲观锁 | 乐观锁 |
| --- | --- | --- |
| 冲突假设 | 冲突频繁，先加锁 | 冲突少，更新时再检测 |
| Java 实现 | synchronized、ReentrantLock、数据库 SELECT FOR UPDATE | CAS（Compare And Swap）版本号 UPDATE … WHERE version=? |
| 读是否阻塞写 | 是（互斥） | 读通常不加锁 |
| 适用场景 | 写多、强一致、库存扣减 | 读多写少、配置更新、计数器 |
| 典型代价 | 锁等待、死锁风险 | 自旋CPU、ABA问题 |

#### Java 层示例

```java
// 悲观锁
synchronized (this) {
    balance -= amount;
}

// 乐观锁：CAS
AtomicInteger counter = new AtomicInteger(0);
counter.compareAndSet(old, old + 1);  // 失败则重试或放弃

// 数据库乐观锁
// UPDATE account SET balance = ?, version = version + 1
// WHERE id = ? AND version = ?   -- 影响行数 0 表示冲突，业务重试
```

#### 选型与注意点

-   **写冲突高**（秒杀库存）：悲观锁或 Redis 分布式锁更稳妥；纯乐观锁大量重试反而更慢。
-   **读多写少**（文章点赞数）：AtomicLong / LongAdder 或 version 字段乐观更新。
-   CAS 的 **ABA 问题**：值从 A→B→A，CAS 误判未变；可用 AtomicStampedReference 带版本戳解决。
-   热点 key 下 CAS 自旋激烈 很多线程同时抢着修改同一个变量，大家都用 CAS 乐观更新，但因为竞争太激烈，大量线程不断失败、不断重试，导致 CPU 空转升高
-   乐观锁更新失败要有**重试上限或降级**，避免无限循环。

## Java 中 Atomic 原子类的原理是什么？ {#atomic-classes}

### 面试快答

Atomic 类通过原子操作和内存语义支持单变量并发更新，常见实现依赖 CAS。LongAdder 分散热点，适合高竞争统计，但 sum 不提供全局线性一致快照。

### 详细解析

多个原子变量各自安全不代表组合状态一致。余额、库存等业务约束不能只把 int 换成 AtomicInteger，还要明确事务边界和跨实例一致性。

-   CAS 比较内存旧值是否等于期望值，匹配则写入新值。
-   AtomicInteger、AtomicLong、AtomicReference 是常见原子类。
-   高并发计数热点下 AtomicLong 竞争严重时，可以考虑 LongAdder 分散竞争。

## AQS 的核心思想是什么？ {#aqs}

### 面试快答

AQS 用同步状态与等待队列构建锁和同步器，子类定义获取、释放和共享规则。ReentrantLock、Semaphore、CountDownLatch 等借助它实现阻塞与唤醒。

### 详细解析

理解独占、共享、取消和队列等待即可支撑常见排障，不必背源码逐行调用。阻塞等待和 Condition 等待是不同队列阶段，公平性由具体同步器决定。

```text
// AQS 核心字段（简化理解）
volatile int state;              // 同步状态：0=未占用，>0=已占用/计数
Node head, tail;                 // CLH 等待队列
// 获取：tryAcquire → 成功则返回；失败则入队 + park
// 释放：tryRelease → 唤醒后继节点
```

#### 三大核心机制

| 机制 | 作用 |
| --- | --- |
| state + CAS | 用 volatile state 表示锁/许可/计数，CAS 原子修改，避免重量级 synchronized |
| CLH 队列 | 获取资源失败的线程封装为 Node 入队，FIFO 排队，避免惊群 |
| park / unpark | 队列中线程挂起让出 CPU，释放资源时按序 unpark 唤醒后继 |

#### 两种资源共享模式

-   **独占模式（Exclusive）**：同一时刻只有一个线程成功，如 ReentrantLock、ReentrantReadWriteLock 写锁。
-   **共享模式（Shared）**：多个线程可同时获取，如 Semaphore 许可、CountDownLatch 倒计时、ReadWriteLock 读锁。

#### 基于 AQS 的实现

| 类 | state 含义 | 模式 |
| --- | --- | --- |
| ReentrantLock | 0=未锁，1=已锁，>1=重入次数 | 独占 |
| Semaphore | 剩余许可数 | 共享 |
| CountDownLatch | 剩余计数 | 共享 |
| ReentrantReadWriteLock | 高 16 位读计数，低 16 位写计数 | 读共享 / 写独占 |

#### 模板方法（子类实现）

-   独占：`tryAcquire` / `tryRelease`
-   共享：`tryAcquireShared` / `tryReleaseShared`
-   是否可被当前线程独占：`isHeldExclusively`
-   AQS 负责队列管理、阻塞、唤醒；子类只定义「什么条件下算获取/释放成功」。

## 线程池如何优雅关闭？ {#thread-pool-shutdown}

### 面试快答

先停止接收新任务，调用 shutdown 等待已有任务完成，超过截止时间后视情况 shutdownNow，并处理未执行任务。任务本身需要支持中断与资源清理。

### 详细解析

服务关闭还要停止入口流量和定时生产者，保证关键任务有持久化补偿。不要无限 awaitTermination，也不要吞掉 InterruptedException 后继续等待。

停止接收新任务 → 等待已在执行和队列中的任务完成 → 超时再强制中断 → 最后处理异常和恢复中断标记。

#### 关闭 API 对比

| 方法 | 行为 |
| --- | --- |
| `shutdown()` | 不再接受新任务，已提交任务（含队列中）继续执行 |
| `shutdownNow()` | 尝试中断所有线程，返回未开始执行的任务列表 |
| `awaitTermination(timeout, unit)` | 阻塞等待线程池完全终止，返回是否超时 |
| `isTerminated()` | 线程池是否已完全停止 |

#### 标准关闭流程

```java
ExecutorService pool = ...;
pool.shutdown();                          // 1. 停止接收新任务
try {
    if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {  // 2. 等待 60s
        List<Runnable> dropped = pool.shutdownNow();   // 3. 超时则中断
        if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
            log.error("线程池未能终止");
        }
    }
} catch (InterruptedException e) {
    pool.shutdownNow();                   // 4. 当前线程被中断，也触发强制关闭
    Thread.currentThread().interrupt();
}
```

#### Spring / 生产注意点

-   Spring Boot 中可在 `@PreDestroy` 或 `DisposableBean` 中执行上述逻辑。
-   Tomcat / 网关的 `graceful shutdown`：先摘流量，再关线程池，最后停 JVM。
-   任务代码必须**响应中断**：阻塞 IO、`Thread.sleep`、`Future.get` 会抛 InterruptedException，不能吞掉。
-   长循环任务应定期检查 `Thread.currentThread().isInterrupted()` 或 `InterruptedException`。
-   配合 `shutdownNow()` 返回的未执行任务，可持久化到 MQ/DB 以便重启后补偿。

## G1 的 Region 是什么？ {#g1-region}

### 面试快答

G1 将堆划分为多个 Region，按回收收益选择区域，在年轻代和混合回收中平衡吞吐与停顿。停顿目标是尽力达到的目标，不是实时性保证。

### 详细解析

关注 Humongous 对象、疏散失败、存活集和分配速率。先修复对象生命周期和大对象问题，再调整 Region、堆容量和停顿参数。

-   Region 可以扮演 Eden、Survivor、Old、Humongous 等角色。
-   G1 根据每个 Region 的垃圾比例和回收收益，优先回收价值最高的 Region。
-   这种结构让 G1 能在目标停顿时间内做增量式回收。

## JVM 常用参数有哪些？ {#jvm-params}

### 面试快答

JVM 参数应围绕内存预算、收集器、GC 日志和诊断能力设置。先收集证据，再调堆、线程栈和容器预算，避免直接复制一长串“最优参数”。

### 详细解析

优先使用 jcmd 查看线程、堆和运行参数，按需配合 JFR、GC 日志与 NMT。堆转储可能占用大量磁盘并产生停顿，生产采集应预估成本并保护敏感信息。

#### 先做预算

堆常用 -Xms/-Xmx，线程栈可用 -Xss，元空间可按需设上限。进程内存还包括直接内存、代码缓存、原生库和线程，容器不能把全部限额都给堆。

#### 再建立诊断能力

目标 JDK 支持时使用统一 GC 日志、JFR、jcmd；需要堆外分析可评估 NMT。生产 OOM 转储需设置可靠目录、空间预算与访问控制。

#### 参数不通用

G1 的 MaxGCPauseMillis 是目标而非硬保证，也不能把同一组收集器参数直接套给 ZGC。容器内存百分比、自适应参数与收集器默认值依 JDK 而变，用启动参数和实际生效值核验。

一次只改有证据支持的项，用相同负载比较延迟、吞吐和占用，保留回退配置。

## 如何分析线程死锁？ {#deadlock-analysis}

### 面试快答

先采集线程转储，找出锁持有与等待形成的环，再追溯业务加锁顺序。修复通常是统一锁顺序、缩小临界区或使用带超时的获取方式。

### 详细解析

连续采样区分死锁、慢锁和资源池耗尽。数据库锁和应用锁交叉等待时，单看 JVM 报告可能不足，需要串联 SQL、事务和请求链路。

典型四条件：互斥、占有且等待、不可抢占、循环等待。线上表现为接口超时、线程池耗尽、CPU 不高但吞吐为 0。

#### 排查步骤

1.  `jps -l` 找到 Java 进程 PID。
2.  `jstack -l <pid>` 导出线程栈（`-l` 显示锁持有者信息）。
3.  搜索输出末尾的 `Found one Java-level deadlock`，JVM 会自动列出参与死锁的线程和锁依赖链。
4.  若无自动提示，手动找大量 `BLOCKED` 线程，对比 `waiting to lock` 与 `locked` 是否形成环。

#### jstack 关键字段

```java
"pool-1-thread-2" #15 prio=5 os_prio=0 tid=0x... nid=0x1234 waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
   at com.example.ServiceB.methodB(ServiceB.java:20)
   - waiting to lock <0x000000076ab62208> (a java.lang.Object)   // 等这把锁
   - locked <0x000000076ab62218> (a java.lang.Object)             // 已持有这把锁
```

#### 常见死锁场景

| 场景 | 示例 |
| --- | --- |
| 锁顺序不一致 | 线程 A 先锁 account1 再锁 account2，线程 B 相反 |
| 嵌套锁 | synchronized 内再调外部 synchronized 方法，交叉调用 |
| 数据库 + 本地锁 | 持 DB 行锁等本地锁，另一线程持本地锁等 DB |
| 线程池 + 同步等待 | 主线程 submit 后 get() 阻塞，Worker 又等主线程释放锁 |

#### 修复与预防

-   **统一加锁顺序**：多资源加锁按固定 ID 排序，破坏循环等待。
-   **缩小临界区**：锁内不做 IO、RPC，减少持锁时间。
-   **tryLock 超时**：`ReentrantLock.tryLock(timeout)` 失败则回滚/重试，避免无限等。
-   减少锁嵌套；能用并发容器（ConcurrentHashMap）就不用 synchronized 包大段逻辑。
-   开发期用 `jconsole` / IDEA 线程分析 / 单元测试压测提前发现。

## 如何分析频繁 GC？ {#frequent-gc}

### 面试快答

先区分分配过快、晋升过快、堆太小和存活集持续增长，再看每次回收后占用与停顿。扩堆可能缓解频率，却不能修复泄漏或无界缓存。

### 详细解析

把 GC 日志与 QPS、批处理、发布和大对象分配关联，比较稳定负载下的老年代基线。只有基线持续上升且引用证据支持时，才进一步判断泄漏。

#### 按证据定位

1. 记录 JDK、收集器、堆配置与发布版本，打开适用的 GC 日志。
2. 区分年轻代回收、混合回收、并发周期和 Full GC，观察频率与停顿分布。
3. 对照分配率、晋升、回收后的存活占用和业务负载。
4. 存活集持续增长时，用受控转储或分配剖析追踪引用和分配来源。

短命对象多不一定是泄漏，堆大也不代表合理；长事务缓存、无界队列、线程上下文与大批次处理都应检查。老年代占用高不能直接归因为元空间不足，必须看对应区域与触发原因。

#### 修复和验证

先降低不必要分配、限制缓存与队列、缩短对象生命周期，再按目标收集器调整容量。不同收集器不共用所有分代参数，PretenureSizeThreshold 等参数不应通用于 G1。

保持相同请求与数据规模，对比 P99、GC CPU、停顿和回收后占用；诊断采集本身也可能产生停顿或占满磁盘。

## BIO、NIO、AIO 有什么区别？ {#bio-nio-aio}

### 面试快答

BIO 通常由调用线程阻塞等待，NIO 可结合非阻塞通道和选择器复用连接，AIO 以完成事件通知。同步/异步描述完成通知方式，阻塞/非阻塞描述调用等待方式。

### 详细解析

I/O 多路复用不意味着业务逻辑自动异步。事件线程不应执行慢数据库调用或大计算，选型时应评估连接规模、任务模型与运维复杂度。

#### 两个维度

阻塞/非阻塞描述调用在未就绪时是否等待；同步/异步描述完成结果如何交付。讨论时说明 API 语义与线程模型，不能把“异步”直接等同于“内核替应用做所有工作”。

| 常见模型 | 应用侧行为 | 主要成本 |
| --- | --- | --- |
| BIO | 在 read/write 等调用处等待 | 等待线程与连接资源 |
| NIO 多路复用 | Selector 观察就绪，再对非阻塞 Channel 读写 | 事件循环、缓冲区与协议状态管理 |
| 异步通道 | 提交操作，通过完成回调或 Future 接收结果 | 运行时调度、实现线程与回调管理 |

NIO 中部分 Channel 也可配置为阻塞模式，不能只凭包名断定非阻塞。异步通道底层可能由不同平台机制或线程协作实现，应以目标 JDK 为准。

#### 工程取舍

大量连接可用成熟网络框架管理事件循环、半包、背压与缓冲区；阻塞式业务也可结合受控线程或虚拟线程。事件线程不运行慢数据库操作，所有方案都要限制连接、请求大小与下游并发。

比较吞吐时同时看尾延迟、内存、取消和故障恢复，不以框架名字预设性能。

## Netty 为什么性能高？ {#netty-performance}

### 面试快答

Netty 通过事件循环、多路复用、缓冲区管理和成熟协议编解码支撑高并发网络服务。高性能依赖正确的线程模型与资源管理，不能只归因于“零拷贝”。

### 详细解析

EventLoop 上的阻塞操作会拖累同组连接；引用计数缓冲区要正确释放。排查时关注队列、写入背压、直接内存、编解码耗时和连接分布。

| 能力 | 为什么有帮助 |
| --- | --- |
| NIO 多路复用 | 少量线程管理大量连接，降低线程成本。 |
| Channel | 客户端和服务端建立了一个连接，Netty 里就是一个 Channel |
| EventLoop | Channel 绑定固定线程，减少锁竞争和线程切换。 |
| ByteBuf | 读写指针分离，支持池化、直接内存、切片和组合。 |
| Pipeline | 编解码、业务处理、异常处理可以拆成可组合 Handler。 |
| 零拷贝思想 | 减少不必要的数据复制，降低 CPU 和内存带宽消耗。 |

但 Netty 性能高不代表业务一定快。耗时业务、阻塞数据库调用、慢下游服务仍然要放到业务线程池或异步链路中处理，不能阻塞 EventLoop。

## 子线程异常会不会影响主线程？ {#child-thread-exception-main}

### 面试快答

普通子线程未捕获异常通常终止该线程，不会自动抛到主线程。线程池 submit 的异常封装在 Future 中，execute 的失败则可通过未捕获异常处理器等路径观察。

### 详细解析

获取 Future 结果、设置统一异常处理并监控失败率，必要时通过 afterExecute 汇总。任务失败可能已经产生部分副作用，补偿和重试策略需要业务层设计。

#### 区分提交方式

- 手工创建的线程若出现未捕获异常，会结束该线程，其他线程不因此直接收到异常。
- Thread.join 仅等待结束，不转交异常结果。
- execute 执行的 Runnable 失败可能结束工作线程，并进入未捕获异常处理路径，线程池可能按需补充线程。
- submit 通常把异常保存在 Future 中，调用 get 时通过 ExecutionException 观察；不取结果很容易漏报。

#### 工程处理

定义统一任务边界，记录任务 ID 与失败指标。可用 Future、CompletableFuture 的完成处理或适当的 afterExecute 汇总，注意 submit 包装的异常不一定直接出现在 afterExecute 的 Throwable 参数里。

工作线程失败不等于业务没有生效：部分数据库或远程操作可能已经完成。重试与补偿应以幂等键、业务状态和结果查询为依据。
