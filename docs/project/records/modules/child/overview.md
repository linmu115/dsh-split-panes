---
id: MOD-child
kind: module
title: 子页面运行与嵌套焦点
status: current
relations:
- relation: implements
  to:
    record_id: REQ-mainviews
- relation: consumes
  to:
    record_id: IF-view-channel
- relation: consumes
  to:
    record_id: IF-sidebar-use
---

# 子页面运行与嵌套焦点

`isolated/child.tsx` 使用该页面自身的 sessions 和 BetterSidebar 服务。收到 navigate 后刷新必要目录、切换会话，回报 selection；通过 revision 忽略过期结果。几何消息只更新本插件 CSS 变量。

`isolated/focus.ts` 监听当前文档及同源嵌套 iframe 内的 pointerdown/focusin，随 iframe load 重新绑定、移除时清理。这样思维图嵌套画布也能选中所属主窗；并不修改 ThoughtDAG 代码。跨域 iframe 内部无法观察，未支持。

通过 BetterSidebar 的现有 registerTab 注册“主窗口”页，提供添加、关闭、选择；调用 sidebar-chrome 可见性适配器。引用与贴纸正文、保存或跳转数据不会通过本插件通道转发。

焦点事件先记录本地即将选中，再通知外层。若用户在切窗确认前点击贴纸触发原侧栏展开，暂存可见性意图，在外层确认该窗后按新 revision 回报；不截获贴纸业务或正文。
