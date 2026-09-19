---
id: IF-sidebar-use
kind: interface
title: 接入宿主和 BetterSidebar 的范围
status: current
---

# 接入宿主和 BetterSidebar 的范围

本页是本插件的消费说明，不替代外部项目的接口合同。

| 外部提供方 | 本插件使用内容 | 代码位置 | 影响 |
|---|---|---|---|
| DSH sessions | list snapshot/subscribe、open、clear、refresh | shell.ts、child.tsx、contracts.ts | 会话选择与新建后的目录同步 |
| DSH slots | 注册 main/conversation 占位，effect 生命周期 | index.ts、surface.tsx | 承载中央区域 |
| BetterSidebar | registerTab、getSnapshot、subscribeState | child.tsx、sidebar-chrome.ts、contracts.ts | 主窗口管理入口和可见性状态 |
| DSH/BetterSidebar DOM | data-slot、data-dsh-panel-host 等定位属性 | layout.ts | 展示层布局适配 |
| 浏览器同源页面 | iframe、postMessage、Cookie、Document 事件 | protocol.ts、focus.ts | 独立文档和焦点 |

引用、普通贴纸、思维图等随 DSH 在各子页面正常加载。本插件不直接调用其业务接口，不注入业务 adapter；它们与自己的原依赖仍然协作。测试读取这些插件源码不等于运行时依赖测试路径。

核对目标是 DSH RC2 和当前本地 BetterSidebar，外部项目未建立本地图子模块。独立地图 ID 未在本次任务核实，不编造跨项目 ID。

公共按钮与宽高由分窗插件自己维护。BetterSidebar 无公开开关 setter，因此仅通过原 data-dsh-toggle-cluster 内的按钮 click 回调设置可见性，按 getSnapshot/subscribeState 校验结果；不写 store，不 importLayout，不复制 tabs。DOM 顺序（桌面：底部、右侧）和挂点是明确的展示层兼容依赖。缺按钮时等待其挂载，不将失败伪装成完成。
