---
title: "Python 高频问题整理"
permalink: "developer/python.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "python"
---
## Python GIL 是什么？ {#gil}

### 面试快答

GIL 是 CPython 默认构建中的解释器锁，使一个进程内通常只有一个线程执行 Python 字节码。I/O 密集任务仍可用线程或协程并发，CPU 密集任务通常用进程、释放 GIL 的扩展或经过验证的自由线程构建。

### 详细解析

不要把 GIL 当成业务锁：读改写、多步状态变更仍需要同步。Python 3.13 起有可选的自由线程构建，是否启用及扩展兼容性要结合实际运行环境确认。

#### 解释器边界

默认带 GIL 的 CPython 构建要求线程在执行 Python 字节码及大部分对象操作时持有解释器锁。许多阻塞 I/O 和部分扩展计算会释放锁，因此 I/O 密集服务可以从线程并发中获益。

CPython 从 3.13 起提供可选的自由线程构建；启用状态、第三方扩展与性能都需要在实际环境验证。不能把“Python 语言”与某个 CPython 构建的实现约束画等号。

#### 选择方式

纯 Python CPU 计算可评估进程池，但要计入启动、序列化和复制成本；大量等待可用线程或异步 I/O。需要并行的原生库是否释放 GIL，应查对应库实现或测试。

GIL 不替代业务锁。共享余额的检查与扣减、多字段一致性，以及跨进程状态均需自己的同步机制。

#### 参考资料

[CPython 自由线程说明](https://docs.python.org/3/howto/free-threading-python.html)（2026-10-18 核验，注意目标部署版本。）

## Python 多线程、多进程、协程区别？ {#concurrency}

### 面试快答

线程共享内存、切换成本较低；进程隔离好且可利用多核；协程由事件循环协作调度，适合大量等待 I/O 的任务。选择时先看瓶颈，再看共享状态、故障隔离和部署成本。

### 详细解析

CPU 密集的纯 Python 任务优先评估进程池；HTTP 扇出适合异步，但必须限制并发。进程间传输需要序列化，大对象复制和子进程启动可能抵消并行收益。

| 模型 | 实现方式 | 是否绕过 GIL | 适用场景 | 成本 |
| --- | --- | --- | --- | --- |
| 多线程 | 多个线程共享进程内存 | 否 | IO 密集型 | 较低 |
| 多进程 | 多个独立进程 | 是 | CPU 密集型 | 较高 |
| 协程 | 单线程内协作式切换 | 不涉及 GIL 竞争 | 高并发 IO | 很低 |

#### 多线程

使用 `threading`，同一进程内多线程共享内存。适合网络请求、文件读写等 IO 场景，线程等待 IO 时会释放 GIL。

```python
import threading

def task():
    print("hello")

t = threading.Thread(target=task)
t.start()
t.join()
```

注意线程安全问题，共享可变状态需要锁或原子操作。

#### 多进程

使用 `multiprocessing`，每个进程有独立内存和 GIL，可真正并行利用多核 CPU。

```python
from multiprocessing import Process

def task():
    print("hello")

p = Process(target=task)
p.start()
p.join()
```

进程间通信成本更高，常用 Queue、Pipe 等方式。

#### 协程

使用 `asyncio` 和 `async / await`，在单线程事件循环中切换，遇到 `await` 时让出执行权。

```python
import asyncio

async def task():
    await asyncio.sleep(1)
    print("done")

asyncio.run(task())
```

协程切换成本低，但不适合长时间占用 CPU 的同步代码。

#### 三者对比

| 对比项 | 多进程 | 多线程 | 协程 |
| --- | --- | --- | --- |
| 调度 | 操作系统 | 操作系统 | 事件循环 / 应用层 |
| 内存 | 独立地址空间 | 共享进程内存 | 共享单线程资源 |
| 切换成本 | 高 | 中 | 低 |
| 并行度 | 支持多核 | 受 CPython GIL 限制 | 单线程并发 |
| 典型场景 | CPU 计算、科学计算 | 阻塞 IO、简单并发 | 高并发网络 IO、WebSocket |

口诀：CPU 密集优先多进程，阻塞 IO 可用多线程，高并发异步 IO 优先协程。

## async / await 原理与适用场景 {#async-await}

### 面试快答

async def 定义协程，await 在可等待操作尚未完成时把控制权交还事件循环。它提升 I/O 等待期间的资源利用率，不会自动让 CPU 计算并行。

### 详细解析

事件循环线程里调用阻塞 SDK 会拖慢所有请求。阻塞 I/O 可考虑 asyncio.to_thread，CPU 工作交给进程或独立服务，并设置并发上限与超时。

`async / await` 是 Python 协程语法糖，基于单线程事件循环，在 IO 等待时切换任务。

```text
事件循环 + 协程 + 非阻塞 IO + 主动让出执行权
```

执行到 `await some_io()` 时，若 IO 未完成，当前协程挂起，事件循环去执行其他任务。

```python
import asyncio

async def fetch():
    await asyncio.sleep(1)
    return "ok"

async def main():
    result = await fetch()
    print(result)

asyncio.run(main())
```

#### 执行流程

```python
async def 定义协程函数
-> 调用后得到协程对象
-> create_task / await 交给事件循环
-> await 遇到未完成 IO 时挂起当前协程
-> 事件循环调度其他协程
-> IO 完成后恢复原协程继续执行
```

#### 适用场景

-   高并发网络服务
-   异步 Web 框架（FastAPI、Starlette）
-   WebSocket、长连接
-   爬虫、消息队列消费
-   数据库异步访问

#### 注意点

-   协程链路中的库也要支持异步
-   不要在协程中直接执行长时间阻塞 CPU 代码
-   CPU 密集任务应使用多进程或线程池

## CPython GC 机制 {#cpython-gc}

### 面试快答

CPython 主要通过引用计数回收对象，循环垃圾由额外的循环垃圾收集器处理。引用归零常能及时释放，但存在引用环、终结器和解释器版本差异。

### 详细解析

排查时分清 Python 对象持续存活、分配器保留内存和原生扩展泄漏；RSS 不下降不等于对象没被回收。不要把其他 Python 实现的行为套到 CPython 上。

引用计数 为主， 分代回收 处理循环引用。

#### 引用计数

每个对象维护引用计数，计数为 0 时立即释放。无法单独处理循环引用。

```python
a = []
b = a
del a
```

#### 循环引用问题

引用计数无法回收互相引用的对象。

```python
a = []
b = []
a.append(b)
b.append(a)
```

#### 分代回收

```text
第 0 代 Young Generation：新创建对象
第 1 代 Middle Generation：经历过一次 GC 的对象
第 2 代 Old Generation：长期存活的对象
```

GC 通过扫描容器对象引用关系，找出无法到达的对象并回收循环引用。

## Python 深拷贝和浅拷贝区别？ {#deep-copy-shallow-copy}

### 面试快答

浅拷贝只复制外层容器，内层对象仍共享；深拷贝递归复制对象图并利用 memo 处理重复引用。是否需要深拷贝取决于数据所有权和后续修改方式。

### 详细解析

深拷贝不适合连接、锁和文件句柄，也可能复制大量无用数据。接口边界优先使用不可变对象或明确的 DTO，测试应覆盖嵌套容器被修改时的隔离效果。

| 对比项 | 浅拷贝 | 深拷贝 |
| --- | --- | --- |
| 复制范围 | 只复制外层容器 | 递归复制内部对象 |
| 嵌套可变对象 | 仍然共享 | 通常完全独立 |
| 性能成本 | 较低 | 较高，可能复制大量对象 |
| 适用场景 | 只需要复制外层结构 | 需要完全隔离修改影响 |

```python
import copy

a = [[1], [2]]
b = copy.copy(a)
c = copy.deepcopy(a)

a[0].append(99)
print(b)  # [[1, 99], [2]]
print(c)  # [[1], [2]]
```

不可变对象通常不需要深拷贝；修改嵌套结构且要隔离影响时使用 `deepcopy`。

## Python 装饰器是什么？ {#decorator}

### 面试快答

装饰器接收函数或类并返回包装后的对象，常用于日志、鉴权和缓存。包装函数应保留元数据，异步函数要用异步包装，避免把协程误当普通返回值。

### 详细解析

用 functools.wraps 保留名称与注解；多层装饰器自下向上应用。property 把方法调用封装成属性访问，适合轻量校验，不宜隐藏耗时 I/O。

#### 语法糖：@ 做了什么

```python
@log
def hello():
    print("hello")

# 完全等价于：
def hello():
    print("hello")
hello = log(hello)   # ① 先定义原函数  ② 立刻用装饰器包装并重新绑定名字
```

定义阶段（import / 模块加载时）就完成包装，**不是每次调用时才装饰**。

#### 基础装饰器：实现逻辑

```python
from functools import wraps

def log(func):                    # 1. 接收被装饰的原函数
    @wraps(func)                  # 4. 复制 __name__、__doc__ 等元信息
    def wrapper(*args, **kwargs): # 2. 定义新函数（闭包，持有 func）
        print("before")
        result = func(*args, **kwargs)  # 3. 调用原函数
        print("after")
        return result
    return wrapper                # 5. 返回 wrapper，外部 hello 实际指向它

@log
def hello():
    print("hello")

hello()  # 实际执行 wrapper() → 内部再调原 hello
```

调用链：`hello()` → `wrapper()` → 增强逻辑 → `func()` → 返回结果。wrapper 通过**闭包**记住创建时的 `func`。

#### 执行时序（以 @log 为例）

```text
# 定义时（只执行一次）
hello = log(hello)
  log 收到原 hello
  → 创建 wrapper（闭包绑定 func=原hello）
  → 返回 wrapper
  → 名字 hello 重新指向 wrapper

# 调用时（每次 hello() 都走 wrapper）
hello()
  → wrapper 打印 before
  → wrapper 调用 func() 即原 hello
  → wrapper 打印 after
```

#### 为什么要 functools.wraps

```python
# 不用 wraps：hello.__name__ 变成 "wrapper"，__doc__ 丢失
# 用 wraps：hello.__name__ 仍是 "hello"，便于调试、反射、FastAPI 路由注册
```

#### 带参数的装饰器：三层嵌套

装饰器本身需要配置项时，多一层工厂函数：**外层收参数 → 中层收 func → 内层 wrapper 收调用参数**。

```python
def repeat(n):              # 外层：装饰器参数
    def decorator(func):    # 中层：被装饰函数
        @wraps(func)
        def wrapper(*args, **kwargs):  # 内层：实际调用
            for _ in range(n):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def greet():
    print("hi")

# 等价于：greet = repeat(3)(greet)
```

#### 类装饰器

用类的 `__call__` 实现 callable，适合有状态的装饰器（如计数、限流）。

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"call #{self.count}")
        return self.func(*args, **kwargs)

@CountCalls
def work():
    return 42
```

#### 常见用途

-   `@staticmethod` / `@classmethod` / `@property`：内置描述符装饰器
-   Web：`@app.get("/users")`（FastAPI / Flask 路由注册）
-   缓存：`@lru_cache`；校验：`@login_required`

## Python 装饰器与 Java 动态代理 / Spring AOP 的区别？ {#decorator-vs-aop}

### 面试快答

Python 装饰器在定义或绑定时显式包装对象；Spring AOP 通常通过容器生成的代理在方法调用时织入横切逻辑。两者都可做日志与鉴权，但拦截范围和调用路径不同。

### 详细解析

比较时重点说清对象是否经过包装或代理、内部调用能否被拦截、异常如何传播。不能仅因为都有“切面效果”就认为它们拥有相同的运行机制。

| 对比项 | Python 装饰器 | Java 动态代理 / Spring AOP |
| --- | --- | --- |
| 实现方式 | 函数/类包装 | 运行时生成代理对象 |
| 作用对象 | 函数 / 类 | 类 / 方法 |
| 底层机制 | 闭包 + 高阶函数 | 代理 + 拦截器链 |
| 常见用途 | 日志、鉴权、缓存、重试 | 日志、事务、权限、监控 |

Python 装饰器更轻量；Spring AOP 基于容器和代理，适合企业级横切治理。

## 迭代器和生成器区别？ {#iterator-generator}

### 面试快答

迭代器通过 __iter__ 和 __next__ 按需产出元素；生成器是用 yield 快速构建迭代器的方式。惰性计算能节省中间结果内存，但通常只能消费一次。

### 详细解析

流式处理大量数据时要同时控制上游读取批次与下游缓存。提前退出迭代仍需释放文件和连接，可用上下文管理器管理生命周期。

#### 概念关系

| 概念 | 协议 / 特征 | 例子 |
| --- | --- | --- |
| 可迭代对象 Iterable | 实现 `__iter__()`，可 for 循环 | list、str、dict |
| 迭代器 Iterator | 实现 `__iter__()` + `__next__()` | `iter([1,2])`、文件对象 |
| 生成器 Generator | 含 `yield` 的函数或生成器表达式 | `def gen(): yield 1` |

#### 手写迭代器 vs 生成器

```python
# 迭代器：需自己实现 __iter__ 和 __next__
class Counter:
    def __init__(self, n):
        self.n = n
        self.i = 0
    def __iter__(self):
        return self
    def __next__(self):
        if self.i >= self.n:
            raise StopIteration
        self.i += 1
        return self.i

# 生成器：yield 自动封装为迭代器，代码更简洁
def counter(n):
    for i in range(1, n + 1):
        yield i

# 生成器表达式（惰性）
squares = (x * x for x in range(10))
```

#### 核心区别

| 对比项 | 迭代器 | 生成器 |
| --- | --- | --- |
| 创建方式 | 类实现协议，或 `iter()` 获得 | `yield` 函数 / 生成器表达式 |
| 状态保存 | 手动维护实例属性 | 函数局部变量自动挂起 |
| 内存 | 惰性，不一次性加载全部 | 同样惰性，适合大文件/流式处理 |
| 额外能力 | 标准 next | 支持 `send()`、`throw()` 协程式交互 |

生成器**一定是迭代器**，但迭代器不一定是生成器（如 `list_iterator` 是 C 实现的迭代器）。

## Python list、tuple、dict、set 的底层特点？ {#builtin-types}

### 面试快答

list 是可变序列，tuple 是不可变序列，dict 是键值映射，set 用于去重和成员判断。平均时间复杂度不能替代容量、哈希冲突、内存开销和迭代语义的考虑。

### 详细解析

哈希键必须满足相等对象哈希相同，并在存入期间保持哈希稳定；tuple 包含不可哈希元素时也不能作为字典键。不要依赖 set 的遍历顺序。

| 类型 | 特点 | 查找复杂度 |
| --- | --- | --- |
| list | 动态数组，可随机访问 | 索引 O(1)，中间插入/删除 O(n) |
| tuple | 不可变序列，可作为 dict key | 索引 O(1) |
| dict | 哈希表，按 key 查询 | 平均 O(1) |
| set | 哈希集合，适合去重和集合运算 | 平均 O(1) |

注意：dict 和 set 的元素必须可哈希；list 不能作为 dict key。

## Python 上下文管理器是什么？ {#context-manager}

### 面试快答

上下文管理器通过 with 把获取资源与释放资源配对，异常退出时也会执行清理。同步使用 __enter__/__exit__，异步资源使用 async with 对应协议。

### 详细解析

__exit__ 返回真值会抑制异常，必须有意识地设计。数据库事务、文件和锁都应明确所有权与退出路径，避免只在正常分支释放资源。

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("hello")
# 离开 with 块后文件自动 close，即使 write 抛异常也会 close
```

#### 协议：\_\_enter\_\_ 与 \_\_exit\_\_

```python
class MyLock:
    def __enter__(self):
        self.acquire()       # 进入 with 时调用，返回值赋给 as 变量
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()       # 退出 with 时调用（正常/异常都执行）
        return False           # 返回 False/None：异常继续传播；True：吞掉异常

with MyLock() as lock:
    do_work()
```

#### 执行流程

1.  计算 `with` 后的表达式，得到上下文管理器对象。
2.  调用 `__enter__()`，返回值绑定到 `as` 变量（可无 as）。
3.  执行 `with` 代码块。
4.  无论正常或异常，都调用 `__exit__(exc_type, exc_val, exc_tb)` 做清理。

#### 两种实现方式

| 方式 | 写法 | 适用 |
| --- | --- | --- |
| 类协议 | 实现 `__enter__` / `__exit__` | 复杂状态管理（锁、连接池） |
| 装饰器 | `@contextlib.contextmanager` + `yield` | 简单场景，yield 前 setup，yield 后 teardown |

```python
from contextlib import contextmanager

@contextmanager
def temp_file(path):
    f = open(path, "w")
    try:
        yield f          # with ... as f 拿到这个值
    finally:
        f.close()
```

#### 常见应用场景

-   **文件 I/O**：`open()` 是最典型的上下文管理器。
-   **锁**：`threading.Lock()`、`asyncio.Lock()` 支持 `with`。
-   **数据库连接**：确保 commit/rollback + close，如 SQLAlchemy Session。
-   **计时/日志**：进入记录开始时间，退出记录耗时。
-   **FastAPI DI**：`yield` 依赖本质是上下文管理器模式。

## Python 内存泄漏常见原因 {#memory-leak}

### 面试快答

先确认增长的是存活对象、缓存、任务还是原生内存，再通过分配快照和对象引用定位原因。全局容器、无界缓存、未结束任务及未关闭资源是常见入口。

### 详细解析

用 tracemalloc 比较同一负载前后的快照，再对照 RSS、连接数和队列长度。复现应覆盖多轮稳定负载，避免把一次预热误报为泄漏。

#### 常见原因

-   全局变量、单例对象、模块级 `list` / `dict` 持续增长
-   缓存没有设置容量上限或过期时间，例如无上限的本地缓存
-   闭包、装饰器、回调函数意外持有大对象
-   循环引用中包含复杂析构逻辑，例如不当使用 `__del__`
-   线程、协程、定时任务长期不结束，持续持有上下文对象
-   异常对象和 traceback 被长期保存，间接持有局部变量
-   文件、数据库连接、HTTP Client、Session 等资源没有及时关闭
-   C 扩展或第三方库内存未释放，例如 `numpy`、`pandas`、`torch`、`opencv`

#### 排查思路

```text
观察进程 RSS / Python heap / 对象数量是否持续增长
      -> 用 tracemalloc 对比内存快照
      -> 用 gc 查看不可达对象和引用关系
      -> 检查全局变量、缓存、闭包、回调、后台任务
      -> 检查异常日志、traceback 是否长期保存大对象
      -> 如果 Python 对象不多但 RSS 很高，重点关注 C 扩展和 native 内存
```

#### 常用工具

-   `tracemalloc`：定位 Python 内存分配来源
-   `gc`：查看对象回收和循环引用情况

## Python 闭包是什么？ {#closure}

### 面试快答

闭包让内部函数持有外部作用域变量的引用，外部函数返回后仍可使用。nonlocal 可重新绑定外层函数变量；循环里创建闭包要警惕晚绑定。

### 详细解析

用默认参数或工厂函数固定每轮值。闭包持有的大对象也会延长生命周期，在回调注册和长期任务中要确认是否应显式注销。

```python
闭包 = 函数 + 被函数捕获的外部变量
```

#### 保存状态示例

```python
def counter():
          count = 0
      
          def add():
              nonlocal count
              count += 1
              return count
      
          return add
      
      
      c = counter()
      
      print(c())  # 1
      print(c())  # 2
      print(c())  # 3
```

这里的 `count` 没有定义成全局变量， 但每次调用 `c()` 时都能记住上一次的值。 这说明闭包可以让函数保存自己的状态。

#### 常见使用场景

-   **装饰器**：在不修改原函数代码的情况下增强功能
-   回调函数：延迟执行时仍然保留上下文变量
-   封装状态：避免使用全局变量
-   函数工厂：根据不同参数生成不同行为的函数

#### 和 Go 闭包的关系

Python 闭包和 Go 闭包本质上是同一个概念， 都是函数捕获外部作用域中的变量，并在外部函数结束后继续使用这些变量。 区别主要在语法上：Python 修改外层变量需要使用 `nonlocal`， Go 的匿名函数可以直接修改外层变量。

#### 面试总结

Python 闭包是指内部函数引用外部函数的变量，并且内部函数被返回后仍然可以访问这些变量。 它的核心是函数能够记住创建它时的上下文，常用于装饰器、回调函数、状态封装和延迟执行等场景。

## Pydantic 适合解决什么问题？ {#pydantic}

### 面试快答

Pydantic 基于类型注解校验、解析和序列化数据，适合 API 输入、配置和模型工具参数。类型转换与严格校验是不同策略，必须按接口约定选择。

### 详细解析

数据格式合法不代表业务合法或调用者有权限。以 Pydantic v2 为例，应区分字段验证与跨字段验证，明确额外字段、空值、默认值和错误返回策略。

#### 常见使用场景

-   FastAPI 接口入参和响应体校验
-   配置文件或环境变量校验
-   嵌套 JSON 数据校验
-   AI应用 中校验大模型输出结构

#### 常用功能

##### 1\. BaseModel：定义数据模型

`BaseModel` 是 Pydantic 的核心，用来定义数据结构，并自动完成字段校验、类型转换和默认值处理。

```python
from pydantic import BaseModel
      
      class User(BaseModel):
          name: str
          age: int
          is_active: bool = True
      
      user = User(name="Tom", age="18")
      print(user.age)  # 18
```

##### 2\. Field：字段约束

`Field` 用于设置字段限制，例如长度、范围、默认值和描述信息。

```python
from pydantic import BaseModel, Field
      
      class Product(BaseModel):
          name: str = Field(min_length=2, max_length=50)
          price: float = Field(gt=0)
          stock: int = Field(default=0, ge=0)
```

##### 3\. Validator：自定义校验

Pydantic v2 常用 `field_validator` 和 `model_validator`， 分别用于单字段校验和多字段联合校验。

```python
from pydantic import BaseModel, field_validator
      
      class UserRegister(BaseModel):
          username: str
      
          @field_validator("username")
          @classmethod
          def check_username(cls, value):
              if " " in value:
                  raise ValueError("用户名不能包含空格")
              return value
```

#### AI 场景示例

在 AI应用 项目中，Pydantic 常用于校验大模型返回的 JSON 结构， 避免字段缺失、类型错误或格式不稳定导致后续流程异常。

```python
from pydantic import BaseModel
      from typing import List
      
      class LLMAnswer(BaseModel):
          answer: str
          confidence: float
          sources: List[str]
      
      result = LLMAnswer.model_validate_json(llm_output)
```

## Python 中可变类型和不可变类型有什么区别？ {#mutable-immutable}

### 面试快答

Python 参数传递的是对象引用的绑定：修改可变对象可能被调用方看到，重新绑定局部变量不会改变外部绑定。== 比较相等性，is 比较身份，判断 None 应使用 is None。

### 详细解析

函数默认参数只在定义时求值，避免使用可变默认值。不要利用小整数或字符串驻留判断值是否相等；共享可变对象应约定所有权。

-   常见可变类型：`list`、`dict`、`set`
-   常见不可变类型：`int`、`float`、`str`、`tuple`、`frozenset`
-   不可变类型通常可作为 `dict` 的 key

```python
nums = [1, 2]
nums.append(3)      # 原地修改

s = "ab"
s = s + "c"         # 绑定到新字符串对象
```

函数默认参数不要直接使用可变对象，避免共享同一默认实例。

## Python dataclass 适合什么场景？ {#dataclass}

### 面试快答

dataclass 为数据对象生成初始化、比较和表示方法，适合内部 DTO；它不等同于运行时输入校验。可变字段使用 default_factory，frozen 只限制字段重新赋值，并非深度不可变。

### 详细解析

__new__ 负责创建实例，__init__ 初始化已创建的实例；一般业务数据类不需要覆盖 __new__。跨信任边界的数据仍应独立验证。

`@dataclass`（Python 3.7+）用于定义**以数据承载为主**的类，根据类型注解自动生成 `__init__`、`__repr__`、`__eq__` 等样板代码，减少手写 DTO 的重复劳动。

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    age: int = 0
    tags: list[str] = field(default_factory=list)  # 可变默认值必须用 factory

u = User("Tom", 18)
print(u)           # User(name='Tom', age=18, tags=[])
print(u == User("Tom", 18))  # True（默认按字段值比较）
```

#### 适合的场景

-   **DTO / 值对象**：API 请求体、消息体、数据库查询结果行。
-   **配置对象**：应用配置、Feature Flag、Pipeline 中间结构。
-   **函数返回值聚合**：多个返回值打包成一个命名对象，比 tuple 可读。
-   **不可变数据**：`frozen=True` 禁止改字段，可哈希、可放 set/dict key。
-   **轻量领域模型**：字段多、逻辑少的数据载体（复杂校验交给 Pydantic）。

#### 不适合的场景

-   类有大量业务方法、复杂继承层次 → 普通 class 更合适。
-   需要运行时严格校验外部输入（HTTP / LLM JSON）→ 优先 **Pydantic**。
-   纯常量集合、不需要实例化 → `NamedTuple` 或 `TypedDict` 可能更轻。

#### 常用参数

| 参数 | 作用 |
| --- | --- |
| `frozen=True` | 实例不可变，可哈希 |
| `slots=True` | 固定属性槽，省内存（3.10+） |
| `order=True` | 生成 `__lt__` 等比较方法 |
| `repr=False` | 某字段不参与 `__repr__` |
| `field(default_factory=...)` | list/dict/set 等可变默认值 |

#### 与 Pydantic / NamedTuple 对比

| 方案 | 定位 |
| --- | --- |
| `dataclass` | 标准库、轻量数据类，基本类型注解 + 少样板代码 |
| `NamedTuple` | 不可变、可索引，适合固定字段元组 |
| `Pydantic BaseModel` | 运行时校验、类型转换、JSON 解析，适合接口边界 |

#### 常见坑

-   可变默认值（`tags=[]`）会被所有实例共享 → 必须用 `field(default_factory=list)`。
-   `frozen=True` 的对象不能改字段；要「改」只能 `dataclasses.replace(obj, age=20)` 生成新实例。
-   dataclass **不做运行时类型校验**，`User(age="abc")` 不会报错，除非自己加校验或换 Pydantic。

## Python 异常处理最佳实践？ {#exception-handling}

### 面试快答

只在能增加上下文、转换语义或恢复的位置捕获异常，保留异常链并在资源边界执行清理。业务错误、依赖错误和程序缺陷应有不同处理方式。

### 详细解析

不要大范围 except 后返回空值伪装成功，也不要在每层重复记录同一堆栈。日志要带请求标识并隐藏敏感数据，重试只对可恢复且幂等的操作使用。

-   `try/except` 捕获异常；`else` 在无异常时执行；`finally` 无论是否异常都执行
-   不要裸写 `except:`，应捕获具体异常类型
-   异常应作为错误信号，配合日志和可观测性

```python
try:
    result = 10 / x
except ZeroDivisionError:
    result = 0
else:
    print("success")
finally:
    print("cleanup")
```

## asyncio.gather 和 asyncio.create_task 有什么区别？ {#gather-vs-create-task}

### 面试快答

create_task 把协程调度成独立任务；gather 聚合多个可等待对象的结果，返回顺序按输入顺序。二者经常搭配使用，但异常和取消传播要单独设计。

### 详细解析

gather 默认传播首个异常时，其他任务不一定被自动取消。需要结构化并发可评估 TaskGroup，并在取消时执行 finally 清理。

```python
# create_task：立刻把协程丢进事件循环，返回 Task 对象
task = asyncio.create_task(fetch_user())
await do_other_work()          # Task 在后台并发跑
user = await task              # 需要结果时再 await

# gather：并发跑多个协程，等全部完成后一次性拿结果
a, b = await asyncio.gather(fetch_a(), fetch_b())
```

#### 核心区别

| 对比项 | create\_task | gather |
| --- | --- | --- |
| 作用 | 包装单个协程为 Task，立即调度 | 并发执行多个 awaitable，统一等待 |
| 返回值 | Task 对象，可稍后 await / cancel | 结果列表（顺序与入参一致） |
| 粒度 | 单任务生命周期管理 | 批量并发 + 结果聚合 |
| 异常 | await Task 时抛出该 Task 的异常 | 默认任一失败整体抛异常；`return_exceptions=True` 收集为结果 |

#### 使用场景

-   **create\_task**：需要「先启动、后等待」——启动 I/O 后去做别的事，再回来取结果；或需要单独 cancel 某个任务。
-   **gather**：多个独立 I/O 可以并行（调 3 个 API、查 3 张表），全部完成后统一处理。
-   gather 内部可直接传协程，会自动包装成 Task；也可先 create\_task 再 gather，便于中途 cancel 单个 Task。

#### 常见坑

-   只 create\_task 不 await → 任务可能被 GC 取消，产生 `Task was destroyed but pending` 警告。
-   gather 默认 fail-fast：一个子任务异常，其余仍在跑但 gather 立刻抛错；要部分失败用 `return_exceptions=True`。
-   gather 返回顺序固定按入参顺序，与完成先后无关。

## Python 协程如何做超时、取消和异常？ {#asyncio-timeout-cancel}

### 面试快答

给请求设置总超时和依赖超时，取消后清理连接、锁和子任务。取消通常在 await 处协作发生，不能把它理解成强制终止任意代码。

### 详细解析

不要吞掉 CancelledError 后继续无限执行。超时可能只表示调用方停止等待，远端操作仍可能成功，所以写操作重试必须有幂等键和结果查询。

```text
# 超时：wait_for（通用） / timeout 上下文管理器（3.11+）
try:
    result = await asyncio.wait_for(fetch(), timeout=3.0)
except asyncio.TimeoutError:
    result = None

async with asyncio.timeout(3.0):
    result = await fetch()

# 取消：Task.cancel() → 协程内捕获 CancelledError 做清理
task = asyncio.create_task(long_running())
task.cancel()
try:
    await task
except asyncio.CancelledError:
    pass  # 预期行为，清理在 finally 中
```

#### 三种机制对比

| 机制 | API | 场景 |
| --- | --- | --- |
| 超时 | `wait_for(coro, timeout=N)` | 限制单次 I/O 最大等待时间 |
| 超时（3.11+） | `async with asyncio.timeout(N)` | 多行代码块统一超时，写法更清晰 |
| 取消 | `task.cancel()` | 用户中断、服务关闭、上游超时联动取消 |

#### 取消的正确姿势

-   `cancel()` 不会立刻终止协程，而是在下一个 `await` 点抛 `CancelledError`。
-   协程内必须捕获 `CancelledError` 或在 `finally` 中释放资源（关连接、删临时文件）。
-   不要吞掉 `CancelledError` 后继续跑业务逻辑，应 re-raise 或确保任务真正结束。

#### 生产实践

-   HTTP / DB / LLM 调用**必须设超时**，推荐连接超时 + 读超时分开配置。
-   服务 graceful shutdown：取消所有未完成 Task，`await asyncio.gather(*tasks, return_exceptions=True)`。
-   部分失败场景：用 `return_exceptions=True` 收集异常，成功的结果仍可用。
-   FastAPI 中客户端断开连接会 cancel 请求 Task，长任务需处理 CancelledError。

## WSGI 和 ASGI 有什么区别？ {#wsgi-asgi}

### 面试快答

WSGI 面向同步请求调用，ASGI 支持异步事件、长连接和 WebSocket。选择 FastAPI、Flask 或 Django 时要结合协议、依赖库、团队生态及实际并发模型。

### 详细解析

框架支持异步不代表数据库驱动或业务代码都不阻塞。比较应在相同业务逻辑、连接池、工作进程与负载条件下进行。

```text
客户端 HTTP 请求
    ↓
Web 服务器（Nginx / Uvicorn / Gunicorn）
    ↓ 按 WSGI 或 ASGI 协议调用
Python 应用（Flask / Django / FastAPI）
    ↓
返回响应
```

#### 核心对比

| 对比项 | WSGI | ASGI |
| --- | --- | --- |
| 全称 | Web Server Gateway Interface | Asynchronous Server Gateway Interface |
| 出现时间 | PEP 333（2003），同步时代 | 2016+，为 async/await 设计 |
| 调用模型 | 同步 callable：`app(environ, start_response)` | 异步 callable：`await app(scope, receive, send)` |
| 并发方式 | 多进程 / 多线程处理并发连接 | 单线程事件循环 + 协程，IO 等待时不阻塞 |
| 协议支持 | 仅 HTTP（请求-响应） | HTTP、WebSocket、HTTP/2、长连接推送 |
| 典型服务器 | Gunicorn、uWSGI、mod\_wsgi | Uvicorn、Hypercorn、Daphne |
| 典型框架 | Flask、Django（传统模式） | FastAPI、Starlette、Django ASGI |

#### WSGI 工作方式

```python
# WSGI 应用签名（简化）
def application(environ, start_response):
    status = "200 OK"
    headers = [("Content-Type", "text/plain")]
    start_response(status, headers)
    return [b"Hello World"]   # 同步返回字节流

# 每个请求通常占用一个 worker 线程/进程
# 处理期间若阻塞 IO（DB、HTTP 调用），该 worker 无法服务其他请求
```

#### ASGI 工作方式

```python
# ASGI 应用签名（简化）
async def application(scope, receive, send):
  if scope["type"] == "http":
    await send({"type": "http.response.start", "status": 200, ...})
    await send({"type": "http.response.body", "body": b"Hello World"})
  elif scope["type"] == "websocket":
    ...  # WSGI 无法原生支持

# scope：连接元信息（path、headers、type）
# receive / send：异步消息通道，支持流式读写
```

#### 选型建议

-   **传统同步业务、管理后台**：WSGI + Gunicorn 成熟稳定，Flask/Django 够用。
-   **高并发 IO、API 服务、AI/RAG**：ASGI + Uvicorn，async 路由 + 异步 DB/HTTP 客户端，连接利用率更高。
-   **WebSocket / 流式输出**：必须 ASGI（LLM Streaming、实时推送）。
-   Django 3+ 同时支持 WSGI 和 ASGI，可按部署方式切换。

#### 常见误区

-   用了 FastAPI 但路由里全是同步阻塞代码 + 同步 DB 驱动 → 并没有 async 收益，还可能阻塞事件循环。
-   ASGI 不等于「一定更快」：CPU 密集任务仍需多进程；优势在 IO 密集高并发。
-   Gunicorn 可通过 `uvicorn.workers.UvicornWorker` 托管 ASGI 应用，生产常见组合。

## FastAPI 依赖注入机制是什么？ {#fastapi-di}

### 面试快答

FastAPI 的 Depends 声明依赖图，用于复用校验、认证和资源获取；yield 依赖可在请求生命周期结束时清理。依赖注入解决组合问题，业务授权仍需显式实现。

### 详细解析

依赖缓存通常作用于单次请求，不应误当全局单例。测试可替换依赖；连接与事务范围要与请求和流式响应的生命周期一致。

```python
from fastapi import Depends, FastAPI

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db          # yield 依赖：请求结束后执行 finally 逻辑
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    return verify_token(token)

@app.get("/profile")
def profile(user=Depends(get_current_user), db=Depends(get_db)):
    return db.query(User).filter_by(name=user.name).first()
```

#### 核心特性

| 特性 | 说明 |
| --- | --- |
| 声明式注入 | 参数标注 `Depends(func)`，框架自动调用 func 并传入结果 |
| 依赖嵌套 | 依赖函数自身可声明 Depends，框架自动解析依赖图（DAG） |
| yield 依赖 | 用 `yield` 替代 `return`，在 `finally` 中释放资源（DB/文件/锁） |
| 缓存 | 同一请求内相同依赖只执行一次（默认 `use_cache=True`） |
| 作用域 | 可定义全局依赖（`app.dependencies`）或路由级依赖 |

#### 常见用途

-   **鉴权**：从 Header/Cookie 解析 Token → 返回当前用户 → 无权限抛 HTTPException。
-   **DB Session**：每个请求创建 Session，请求结束自动 close（yield 模式）。
-   **分页参数**：统一解析 `page`、`size` 并校验范围。
-   **权限校验**：依赖链 `get_user → check_admin`，非 admin 直接 403。

#### 与 Spring DI 对比

思路类似（声明依赖、自动注入、生命周期管理），但 FastAPI DI 更轻量：无容器注册，靠函数签名 + Depends 声明；适合请求级短生命周期对象，不适合复杂 Singleton 管理。

## Python 项目依赖管理最佳实践？ {#dependency-management}

### 面试快答

隔离项目环境、固定解释器和依赖版本，并让 CI 使用锁文件复现安装。区分运行与开发依赖，升级时验证直接依赖和传递依赖的兼容性。

### 详细解析

不要只依靠本机 pip freeze 证明可复现。记录平台约束、私有源和构建方式，并在干净环境中执行安装与核心测试。

-   推荐 `venv` + `requirements.txt（ 管理**Python 项目依赖的第三方包及其版本**）`
-   锁文件应提交到版本库，CI/CD 使用相同版本安装
-   固定 Python 版本，避免“本地能跑、线上不行”

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

生产环境建议使用可复现安装方式，避免临时升级导致版本漂移。

## Python FastAPI 同步 / 异步底层区别是什么？ {#fastapi-sync-async}

### 面试快答

FastAPI 的 async def 通常在事件循环执行，同步 def 路由通常交给线程池。异步路由应调用异步依赖，阻塞驱动需要隔离，否则会阻塞整个事件循环。

### 详细解析

同步工具函数直接从 async def 调用时不会自动进入线程池。数据库连接池、线程池和进程数要一起预算，用超时、并发限制与取消避免积压。

同步请求：一个请求占用一个线程

```python
# 同步接口流程
请求进来
  ↓
Uvicorn 接收 HTTP 请求
  ↓
ASGI 应用 FastAPI 处理路由
  ↓
发现接口是 def 同步函数
  ↓
放入线程池执行
  ↓
线程阻塞等待结果
  ↓
返回响应
```

异步接口流程：

```text
# 异步接口流程
请求进来
  ↓
Uvicorn 接收 HTTP 请求
  ↓
FastAPI 调用 async def
  ↓
执行到 await
  ↓
当前协程挂起，把控制权还给事件循环
  ↓
事件循环处理其他请求
  ↓
I/O 完成后恢复当前协程
  ↓
返回响应
```

| 对比点 | 同步 def | 异步 async def |
| --- | --- | --- |
| 执行位置 | 线程池 | 事件循环 |
| 等待 I/O 时 | 阻塞线程 | 挂起协程，让出执行权 |
| 并发单位 | 线程 | 协程 |
| 适合场景 | CPU 计算、同步库 | 高并发 I/O |
| 错误风险 | 线程池打满 | 阻塞事件循环 |
| 常见库 | requests、pymysql、redis-py 同步 | httpx.AsyncClient、asyncpg、aioredis |

## 多协程读写如何隔离？ {#coroutine-read-write-isolation}

### 面试快答

协程共享进程内存，只要在 await 前后交错执行，就可能破坏多步更新。单事件循环可用 asyncio.Lock 保护临界区，请求上下文可用 ContextVar 隔离。

### 详细解析

asyncio.Lock 不能解决跨线程或跨进程竞争。跨实例一致性应依赖数据库约束、事务或合适的分布式协调，不能靠进程内锁保证。

#### 常见隔离手段

| 手段 | 适用场景 | 说明 |
| --- | --- | --- |
| `asyncio.Lock` | 写操作、临界区互斥 | 同一时刻只有一个协程进入，其他 await 等待 |
| `asyncio.Semaphore` | 限流、连接池上限 | 控制同时访问资源的协程数量 |
| `asyncio.Queue` | 生产者-消费者 | 协程间通过队列传递数据，避免直接共享可变状态 |
| `contextvars` | 请求级上下文 | 每个 Task 独立的 request\_id、user、db session，FastAPI 依赖注入常用 |
| 每协程独立连接 | 数据库 / Redis | 从连接池取连接，用完归还；不跨协程共享同一 connection |
| 不可变数据 | 配置、常量 | 只读共享无竞态；需要改时用 copy-on-write 或新对象 |

#### 代码示例

```python
import asyncio

counter = 0
lock = asyncio.Lock()

async def safe_increment():
    global counter
    async with lock:          # 互斥：防止多协程同时 += 1 丢更新
        counter += 1

# 请求级隔离：contextvars（FastAPI 内部类似机制）
from contextvars import ContextVar
current_user: ContextVar[str] = ContextVar("current_user")

async def handle(user_id: str):
    current_user.set(user_id)   # 本 Task 独立，不污染其他协程
    uid = current_user.get()

# 读写分离思路：多读单写可用 Semaphore 限制写并发
write_sem = asyncio.Semaphore(1)
read_sem = asyncio.Semaphore(10)
```

#### 读写隔离实践

-   **读多写少**：读操作无锁（只读共享数据）；写操作加 `Lock`，或写走独立 Queue 由单协程落库。
-   **缓存 + DB**：更新 DB 后删缓存要原子化（先锁再双删），避免协程 A 读旧缓存、协程 B 写 DB 交错。
-   **FastAPI**：每个请求一个 DB Session（`Depends` + yield），请求结束 close，天然隔离会话；不要全局单例 Session。
-   **CPU 密集**：放 `run_in_executor` 线程池，与事件循环隔离，避免阻塞其他协程。

#### 注意点

-   `threading.Lock` 不能替代 `asyncio.Lock` 在协程里 await——会阻塞整个事件循环。
-   协程里不要用 `time.sleep`、同步 `requests`，会阻塞所有协程的「隔离」失效。
-   锁粒度要小：锁内不做远程 IO，防止串行化整个服务。

## 如何让 LLM Agent 安全调用 Pandas 做数据分析？ {#llm-pandas-agent-tool}

### 面试快答

不要直接在业务进程执行模型生成的任意 Python。用受限工具接口或隔离执行环境处理 Pandas，限制数据范围、运行时间、内存、网络与输出。

### 详细解析

容器只是隔离的一层，还需禁用敏感挂载、限制系统调用和资源，并使用只读输入。统计结果要保留查询口径、行数和可复核记录，不能仅信任模型描述。

#### 推荐架构

```text
用户问题
  → LLM 生成 Python 代码（仅允许 pandas/numpy）
  → 沙箱执行（Docker / E2B / 本地 RestrictedPython）
  → 捕获 stdout / 返回 df 摘要 / 图表路径
  → LLM 根据执行结果生成自然语言回答
```

#### Tool 设计要点

| 要点 | 做法 |
| --- | --- |
| 白名单库 | 只允许 `pandas`、`numpy`，禁止 `os`、`subprocess`、`open` 任意路径 |
| 数据范围 | 预加载 df 注入沙箱，或限制只能读指定目录 / 临时文件 |
| 超时与内存 | 执行超时（如 30s）、限制行数 `df.head(1000)`、禁止无限循环 |
| 输出截断 | 返回结果 max 行数 / 字符数，超出只给统计摘要 |
| 错误回传 | 异常栈给 LLM 自我修正，但过滤敏感路径信息 |
| 多租户 | 每用户独立沙箱与数据目录，防止跨租户读文件 |

#### Function Calling 示例

```python
def run_pandas_analysis(code: str, dataset_id: str) -> str:
    df = load_dataset(dataset_id)   # 从对象存储加载，非 LLM 拼路径
    local_env = {"df": df, "pd": pd, "np": np}
    exec(validate_and_sanitize(code), local_env)  # 需 AST 校验 + 沙箱
    result = local_env.get("result", "")
    return truncate(str(result), max_chars=4000)
```

#### 常见风险

-   直接 `exec(llm_code)` 无沙箱 → 远程命令执行、读服务器文件。
-   大表全量 `to_markdown()` 进 Prompt → Token 爆炸、成本飙升。
-   同步 Pandas 在 async 路由阻塞 → 用 `asyncio.to_thread` 或独立 Worker 执行。
