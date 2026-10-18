---
title: "前端 高频问题整理"
permalink: "developer/frontend.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "frontend"
---
## React 是什么？常见组件有哪些？ {#react-basics}

### 面试快答

React 用组件和状态描述 UI，状态变化驱动重新渲染。后端工程师应能理解组件、Props、State、Effect 与接口交互，重点是数据流与异步状态一致性。

### 详细解析

组件渲染保持纯净，Effect 用于与外部系统同步并正确清理；列表使用稳定 key。请求要处理取消、过期响应覆盖和错误反馈，不能只展示加载成功路径。

#### 核心特点

-   **组件化**：UI 拆成独立、可复用的组件，每个组件管理自己的状态和视图。
-   **声明式**：描述「UI 应该是什么样」，React 负责更新 DOM，而非手动操作节点。
-   **Virtual DOM**：内存中维护虚拟树，状态变化时 Diff 后最小化真实 DOM 更新。
-   **单向数据流**：数据从父组件经 props 流向子组件，状态变更可预测。

```javascript
// 函数组件 + Hooks（现代写法）
function Welcome({ name }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Hello, {name}</h1>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
}
```

#### 常见组件类型

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| 函数组件 | 用函数定义，配合 Hooks 管理状态与副作用 | `function App() { ... }` |
| 类组件 | 旧写法，`class + render()`，现多用于维护老项目 | `class App extends Component` |
| 展示组件 | 只接收 props 渲染 UI，无业务状态 | Button、Card、Table |
| 容器组件 | 负责数据获取、状态管理，传给展示组件 | UserListContainer |
| 高阶组件 HOC | 函数接收组件返回增强组件，复用逻辑 | `withAuth(Component)` |
| 复合组件 | 多个子组件组合成完整 UI 模式 | Modal + Modal.Header + Modal.Body |

#### 常用内置 / 生态组件与 Hooks

| 名称 | 作用 |
| --- | --- |
| `useState` | 组件内部状态 |
| `useEffect` | 副作用：请求、订阅、DOM 操作 |
| `useContext` | 跨层级共享数据，避免 props 层层传递 |
| `React Router` | 单页应用路由：`Route`、`Link`、`Navigate` |
| Form 组件 | 受控组件 `input value + onChange`，或 React Hook Form |
| List 组件 | `map` 渲染列表，`key` 必须唯一稳定 |
