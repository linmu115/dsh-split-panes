---
id: MOD-shell
kind: module
title: 外层导航与窗口状态
status: current
relations:
- relation: implements
  to:
    record_id: REQ-mainviews
- relation: consumes
  to:
    record_id: IF-view-channel
---

# 外层导航与窗口状态

入口 `src/client/index.ts` 在顶层启动 shell，在带有合法本插件身份参数的子页面启动 child；未知嵌套环境不再建立 shell。

`isolated/model.ts` 保存视图数组、当前焦点、比例和会话选择；`isolated/shell.ts` 连接外层 sessions 与各子页面。外层选会话发送给 active，子页面选择变化回报外层。新建会话尚未进入外层目录时先 refresh；generation 防止刷新完成后覆盖用户较新的选择。

当前 max=2 是代码硬限制，不是已经可用的任意多窗功能。模型可容纳扩展思路，几何和 UI 仍须改造。
