# 面试知识点整理

技术面试静态知识库：17 个专题、233 道题目，另有 6 篇 LLM Infra Lab 实验笔记和项目实战指南。题库以五年 Java 后端社招为主线，AI、Python 等作为扩展方向；每题分为“面试快答”和“详细解析”。使用 Markdown + Eleventy + Nunjucks 构建普通 HTML、CSS、原生 JavaScript；线上无需 Node.js 服务。筛选依据与删除合并清单见 [整改记录](docs/interview-curation-20261018.md)。

## 本地运行

需要 Node.js 24 或更新版本。

```sh
npm ci
npm run dev
```

打开 http://localhost:3000。开发服务启动时构建站点，仅监听 `127.0.0.1`；请通过该服务进入编辑模式。刷新即可预览正文、公共模板和样式修改；修改专题配置后重启服务。

```sh
npm run build   # 从 src/ 生成 _site/ 中的完整静态站点及搜索索引
npm run check   # 检查页面链接、锚点、ID、导航、内容结构和索引一致性
npm test        # 内容往返、进度迁移、草稿恢复、保存冲突等回归测试
```

## 学习功能

- 首页全站搜索，标题匹配优先；展示各专题进度，支持继续上次学习。
- 专题内搜索支持方向键选择、Enter 跳转、Escape 退出。
- 每题可设为“未学 / 待复习 / 已掌握”，顶部可按状态筛选。
- 自测模式先隐藏答案，逐题点击“显示答案”。
- 题目提供固定链接和复制入口，URL 锚点优先于上次学习位置。
- 手机宽度下目录默认收起，通过下拉框切换专题。
- 支持核心速览、深色模式和代码高亮。

## 编辑与恢复

开发模式点击“编辑 Markdown”直接编辑当前专题正文，支持预览、下载、保存和取消。没有富文本颜色、高亮、表格行操作或独立代码弹窗；标题、强调、列表、表格和代码都用 Markdown 语法表达。

- 编辑后延时保存本地草稿，离开页面会提示未保存的修改。
- 页面顶部可恢复、下载或删除草稿；多个标签页的草稿独立保存。取消编辑会确认后丢弃当前页面草稿。
- 未预览的输入同样会保存为草稿；旧 HTML 草稿保留下载入口，可手动迁入 Markdown。
- 保存携带页面版本。其他标签页或外部编辑器已修改同一文件时，服务拒绝覆盖。
- 冲突后先下载草稿，刷新查看最新文件，再合并所需内容。恢复旧版本草稿仍会保留冲突保护。
- 服务端校验题目结构、重复或保留 ID 及活动内容，然后通过临时文件原子替换。
- 保存写入 `src/developer/<专题文件>.md`，保留页面元数据，并更新 `_site/` 中的 HTML 页面与索引。不要直接编辑生成文件。
- `.local-backups/<专题文件>.bak` 保留最近一次保存前的完整源文件；不进入 Git，也不会被开发服务公开。
- Markdown 原始 HTML 作为文本转义；支持标准围栏代码块、链接、图片、换行、强调和 GFM 表格。HTML 合并单元格不属于 Markdown 表格能力。

草稿和学习进度属于浏览器本地数据；浏览器存储不可用时使用当前页面内存并提示备份。

## 学习进度与备份

进度按题目分别保存在 `study-progress-v3:<分类>:<题目ID>`，值含 `status` 和 `updatedAt`。不同标签页修改不同题目时不会覆盖整份进度；同一题目以最后一次写入为准。

统一模块读取 `study-learned-questions`、`study-learned-v2` 及历史题目映射。旧数据保留，v3 的明确状态优先，取消已掌握不会因旧记录仍存在而复活。

“备份进度”导出 version 3 JSON；“导入进度”完整校验后替换同名题目，保留备份之外的题目。换设备前先导出备份。不同端口、域名或浏览器的存储互不共享。

## 目录

```text
eleventy.config.cjs              静态生成配置，HTML 正文关闭模板解析
src/
  index.njk                      首页正文、项目入口
  developer/*.md                 专题元数据与 Markdown 题目正文
  developer/llm-infra-lab/*.html   实验笔记元数据与正文
  reading/index.njk               独立读书目录
  reading/growth-handbook/        成长行动手册，保留独立页面与浏览器本地记录
  _includes/layouts/             base、home、topic、lab 公共布局
  _includes/components/          侧栏、工具栏、专题卡片、章节导航、脚本引用
assets/
  topics.js                      专题 ID、名称、路径和顺序的唯一配置
  progress-store.js              状态读取、迁移、同步、导入导出
  progress-migrations.js          旧题目 ID 和合并规则
  study-legacy-map.js             历史数字题目 ID 映射
  home.js                        首页搜索与进度
  study.js / study-extras.js      专题学习交互
  markdown.js                    构建、预览共用的 Markdown 渲染和题目校验
  question-redirects.js           合并与删除题目的旧链接处理
  save-client.js                  版本化保存
  content-editor.js               Markdown 编辑、预览与草稿恢复
  styles.css / editor.css         样式
  labs/*.css                     实验笔记原有专属排版与图示样式
_site/                           自动生成、Git 忽略；部署整个目录
  index.html / developer/         地址与迁移前一致
  assets/                        静态资源与生成的两份搜索索引
scripts/
  build.js / check.js             生成与结构检查
  content.js                     内容解析、校验和原子写入
  templates.js                   模板环境与开发预览，和 Eleventy 共用
  dev-server.js                  本地编辑服务
  archive/                       一次性历史迁移，禁止直接重复运行
tests/                           Node 测试与 DOM / HTTP 回归
```

## 维护内容

1. 在对应 `src/developer/*.md` 的元数据后用 `## 题目标题 {#固定ID}` 开始一道题，再依次写 `### 面试快答`、`### 详细解析`。内部小节用四级及以下标题。编辑器中添加或删除整个题目段落即可增删题。
2. ID 发布后保持稳定；迁移或合并题目时更新 `assets/progress-migrations.js` 的映射，跨专题使用 `分类:ID`。
3. 新增专题时，在 `assets/topics.js` 中填写 ID、名称、HTML 输出路径、卡片描述和配色，复制一份 `src/developer/*.md`，修改元数据中的 `title`、`category`、`permalink` 并填写正文。运行构建即可生成导航和索引，无需在服务端另加白名单。
4. 修改完成运行 `npm run build`、`npm run check`、`npm test`。

快答适合面试口述，详解解释原理、步骤、取舍和工程注意点。涉及具体版本、性能数字或产品行为时，附上适用版本、验证时间和官方来源，避免把场景结论写成通用定律。

专题源文件示例：

```markdown
---
title: "Java / JVM 高频问题整理"
permalink: "developer/java.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "java"
---
## JVM 运行时内存结构 {#jvm-memory}

### 面试快答

用几句话说明核心结论。

### 详细解析

解释原理、适用边界和项目排障方法。
```

Markdown 正文不执行 Nunjucks；代码中的 `{{ ... }}`、`{% ... %}` 和 `{# ... #}` 会保留。代码使用围栏，不需要自行做 HTML 转义。公共组件在 `_includes/**/*.njk` 中使用 Nunjucks 语法，首页 `src/index.njk` 也使用模板语法。题目 ID 后缀只在二级标题中解释，不影响代码中的相同文本。

## 阅读展示

全站视觉以成长行动手册为基准：灰绿底色、纸色卡片、松针绿与朱砂红强调、衬线标题和舒展留白。`assets/theme.css` 集中管理配色、字体、导航、首页卡片、专题阅读、实验笔记、深色模式与编辑弹窗；`assets/site-theme.js` 负责主题开关同步和导航高度。调整全站风格优先修改这两个文件，不必逐页修改正文。

首页、专题、实验笔记和读书目录共用站点导航、正文跳转与页脚；成长行动手册保留自身的四阶段训练界面。主题开关沿用 `study-dark` 设置，与原有页面开关和其他标签页同步。字体使用系统字体回退，无需远程字体服务。

首页“读书学习”专栏链接到 `reading/index.html`，已收录“成长行动手册”和“投资书单四层递进路径”。投资书单提供三本起步方案、四层能力路径、补充书单、投资检查清单与判断日志模板。手册文件复制进仓库，不依赖原电脑上的文档路径；部署时随 `_site/reading/` 一起发布。后续读书页面放入 `src/reading/`，在目录和首页组件 `src/_includes/components/home-reading.njk` 增加入口，并在 `scripts/dev-server.js` 添加对应预览路由。

专题页使用标题与简介、专题下拉框和分组目录；目录会标记当前阅读位置。学习状态与复制链接保留在题目旁，Markdown 编辑先进入草稿。备份、深色模式和核心速览收进“更多”菜单。

六篇实验笔记共用阅读样式，提供返回首页、章节目录、深色模式和图示放大。表格、代码与图示局部滚动，长行内命令自动换行，适配手机阅读。运行 `npm run build` 会同步生成实验笔记导航。

## 静态部署

运行 `npm run build` 后，部署 `_site/` 里的全部内容到任意静态 HTTP 托管。目录内包含 `.nojekyll`，全部链接保留相对路径，支持 GitHub 项目子目录。不要将 `src/` 或仓库根目录当作发布目录。首页统计和搜索只读取生成的索引，不需要后端。

GitHub Pages：在仓库 Settings → Pages 中将 Source 设为 GitHub Actions，再手动运行仓库的 `Deploy static site` 工作流。工作流构建并发布 `_site/`，不需要在线运行动态前端。普通检查工作流还会生成 `static-site` 构建附件。当前改动只提供工作流配置，尚未执行远程部署。

使用 `file://` 直接打开 HTML 时，浏览器可能限制索引请求；请使用 HTTP 服务预览。静态托管提供学习功能，写回本地 Markdown 需要 `npm run dev`。

## 本地接口

- `GET /api/editor-health`：编辑服务就绪状态。
- `GET /api/stats`：当前题目列表及总数。
- `GET /assets/questions-index.json`：开发模式实时元数据索引；静态模式使用生成文件。
- `GET /assets/search-index.json`：首次使用全站搜索时加载全文，避免首页统计下载所有正文。
- `POST /api/save`：`{ file, markdown, version }`，`file` 使用原 HTML 文件名，如 `java.html`；成功返回 `{ ok, file, version }`。正文输入由旧 HTML `sections` 改为 `markdown`；缺少版本为 428，版本冲突为 409，无效内容为 400，来源不符为 403，内容过大为 413。

保存成功时会更新对应静态页面及索引；若生成文件写入失败，响应明确提示源文件已保存，并要求运行 `npm run build`。页面版本对应源文件内容，模板渲染失败时不会覆盖源文件。

## License

ISC（见 package.json）。
