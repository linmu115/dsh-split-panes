---
id: EXP-same-document
kind: exploration
title: 保留但停用的同文档原型
status: superseded
outcome: not_adopted
---

# 保留但停用的同文档原型

保留入口 `src/client/native-prototype.ts`，配合 PaneConversation、PaneWorkspace、ViewManager、view-controller、scoped-pane-stores 等。它是本地第一轮适配，不是原封不动上游版本。

当时增加 BetterSidebar 入口、两窗限制、局部 store 管理，移除上游全局 store 工厂改写及分屏快捷入口，但不能解决引用的全局 document 定位。

`tests/reference-compatibility.spec.tsx` 在设置只读来源路径后用于复现该问题；该测试通过表示复现负结果，不能当成当前引用验收通过。

现在 src/client/index.ts 不导入它，发行 bundle 不使用这一路线。旧文件仍在仓库以便查证；源码存在不等于产品入口启用。
