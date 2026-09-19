---
id: HIST-event-transport
kind: history
title: 连接承载修正、接入复验与真实布局检查
date: '2026-09-19'
status: current
applicability: 0.7.0-isolated.2 与当前 RC2 副本
summary: 连接承载真实加载通过；通过正式接入复验解除启动阻塞，继续修正分窗弹窗与侧栏布局。
outcome: isolated.3 已安装启动，真实双窗与布局复验通过；完整引用和贴纸写入未验收
modules: [连接承载, 部署验证]
coverage_note: 主任务整理本次继续请求及公开工具证据的范围索引，未复制原始载荷。
history:
  path: history/event-transport-installed3-20260919
  sha256: 2a248fc68b0277d678a7d136fbc2de6e4786e46414cef289bbfa96a0566a60c3
  capture_sha256: 9f27d1f6194cb28a44332ca02a54089a167ede55957b643aaccc42a3b4515fa1
related_records: [MOD-event-transport, IMP-isolated, VER-isolated]
---

# 连接承载修正

为解决完整子页长连接耗尽 HTTP 槽位，在分窗插件自己的宿主与启动注入中实现每条 EventSource 独立的 WebSocket 承载。其他插件业务代码、服务状态和普通 fetch 不修改；没有合并不同窗口的订阅。7 项合成浏览器检查、类型检查、构建及 6 项隔离单元检查通过。

读取正常 closed 停止回执后，备份、安装 isolated.2 并通过 Launcher 正式 Start 尝试启动。生命周期 trace 显示 recoverBeforeStart 成功，而 prepare exit=1 invalid-json；无新运行身份，Start 等待超时。此时 DSH 尚未启动，不能据此判断修正版真实连接行为。未绕过生命周期启动，未修改 Maintenance，已移除本插件临时启用块。保留安装包和备份，记录实际状态为停止、插件停用、真实验收阻塞。


## 继续后的结果

只读 integrations 目录显示目标接入指纹过期；与其他实例能力回执错误区分。验证 19 个 pin、备份后走正式 repair，保留其他绑定及配置，Launcher 正式 Start 完成 running。isolated.2 真实浏览器双窗 ready、草稿独立、选中窗切换和左右对话/思维图通过。

发现原生全屏弹窗被裁切、思维图遮挡 BetterSidebar 入口。只在 split 的 layout/child 中增加通用 dialog 和 fixed iframe 布局范围，以及侧栏层级与入口位置。isolated.3 bundle 在专用浏览器精确替换本插件客户端后验证弹窗完整、思维图右侧栏可打开；没有替换其他插件响应或运行文件。类型检查、构建与 6 项隔离单元通过，已打包但未安装。

真实历史查询返回 GRAPH_SESSION_NOT_FOUND / STICKER_MIGRATION_REQUIRED，未做数据迁移或引用/贴纸保存。实例保持运行；按项目生命周期约定需用户在 Launcher 正常停止后再安装 .3。本次扩展来源索引覆盖先前阻塞与后续验证，旧范围索引保留。


## isolated.3 正式安装完成

用户再次正常停止，旧 run closed。备份并校验 tarball 后安装 .3，非分窗依赖和构件保持，正式接入复验及 Start 成功。未做响应替换的实际安装包浏览器检查通过：两窗 ready、草稿互不影响、选中窗切换、调整分隔线、对话与思维图并列、弹窗完整和地图侧栏可展开。实例保持运行。详细证据与边界见 [[VER-isolated]]。来源范围扩展保留前次快照。
