---
id: DIFF-upstream
kind: implementation
title: 相对上游的功能与架构差异
status: current
---

# 相对上游的功能与架构差异

比较基线固定为上游 0.6.5 提交 `ccbbf06d414df233744fb1f776f54fb47465ac17`。这是本地已取得的上游起点，不声称是远程最新版本。本分支在该基线上保存独立前端环境、连接承载和布局适配；提交前的旧文件快照另行保留。

| 方面 | 上游基线 | 本地当前入口 |
|---|---|---|
| 会话呈现 | vendor 原生 renderer + 每 pane host，同一 document | 每窗同源 iframe，独立完整前端环境 |
| 状态作用域 | pane host/session binding，加共享 store 处理 | 子页面自己的 sessions 与插件实例 |
| 全局 store 改写 | pane-store.ts 的 installStoreSharing | 已移除；当前入口不替换 store 工厂 |
| 分屏控制 | header 横/纵分屏、关闭、全屏；全局快捷键 | BetterSidebar 主窗口页；最多两窗水平排列 |
| 拖会话分屏 | 捕获 sidebar dragstart 并补充 session payload | 当前入口不提供此能力 |
| 空白新窗 | 上游原生 hero 新建占位 | 独立子页 clear 后空白入口 |
| 左侧列表 | 焦点 pane 跟随全局选择 | 外层选择通过本插件消息发往 active 子页 |
| 右侧栏 | 同文档与共享 store 协作 | 激活子页的侧栏显示于最右侧 |
| 引用兼容 | 上游机制本身不能保证第三方全局 document 查询归属 | 文档隔离解决已复现的错误滚动；全业务未验收 |
| vendor 代码 | 会话 renderer 运行时组成部分 | 保留作历史/诊断，当前不进入 bundle |
| 测试/构建 | 原仓库核心源码图与 vendor 检查链 | 隔离入口独立 typecheck/test，通过门与旧诊断分开 |
| 连接承载 | 浏览器原 EventSource | 子页同源 EventSource 由本插件独立 WebSocket 承载，原接口鉴权与每条订阅保留 |
| 弹窗和地图 | 同文档布局 | 通用弹窗与 fixed iframe 适配当前窗口范围，活动侧栏独立显露 |
| 版本与包 | 0.6.5 | 0.7.0-isolated.3；已试装，发行仅 lib、清单等 |

逐文件变更、状态及当前指纹见 [[DIFF-files]]。上游原设计文档 docs/ARCHITECTURE.md 的内容仍是原路线说明，不能视为隔离版设计。

## isolated.5 进一步差异

公共外层持有 BetterSidebar 的两个开关和尺寸，切窗只更换内容。新增 sidebar-chrome.ts，对齐原按钮而不导入其他插件业务代码；上下文独立 document 与原事件流承载路线不变。
