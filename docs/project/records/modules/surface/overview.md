---
id: MOD-surface
kind: module
title: 持续承载面与左右布局
status: current
relations:
- relation: implements
  to:
    record_id: REQ-mainviews
---

# 持续承载面与左右布局

`isolated/surface.tsx` 在 body 创建本插件 React root，以 main/conversation 注册的占位元素定位。临时离开主会话页只隐藏 surface，保留 iframe 实例和未提交草稿。

`Workspace.tsx` 创建稳定 key 的 iframe、加载提示、焦点边框、分隔线及空白窗退出入口。`protocol.ts` 的 viewGeometry / clipRegions 计算两窗和右侧栏的区域。每个 iframe 本身占完整中央区域，以裁切只显示自己的主窗，以及仅激活窗最右边的侧栏。

`layout.ts` 调整宿主 main/sidebar 标记及 BetterSidebar 的布局属性：外层保留左栏；子页面隐藏自己的左栏与官方右栏；选中窗的 BetterSidebar 可见，非选中窗隐藏。这里存在对 RC2 DOM 结构及 BetterSidebar 属性的**展示层适配依赖**，不能描述为绝对零依赖。

两窗之外的布局、大浮层超出所属窗、移动端还未验收。

共同顶栏独占两个开关；外层提供右侧栏/底栏的拖动和键盘调节，子页原开关隐藏。clipRegions 同时包含选中窗右侧栏和底部栏，两个主窗共用这部分占用空间。空白无会话状态时显示外层提示/窗口管理，有原生状态时显示原页。
