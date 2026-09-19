---
id: MOD-event-transport
kind: module
title: 独立事件流的连接承载
status: current
progress: implemented
gap: 真实连接已验证，引用与贴纸完整业务仍未验收
---

# 独立事件流的连接承载

0.7.0-isolated.2 为解决完整子页面复制带来的长连接额度阻塞，新增本插件宿主端 src/transport/server.ts 与提前启动脚本 browser.js。

子窗口启动前以同源 WebSocket 承载原 EventSource 接口。每一个 EventSource 仍对应一个独立的原服务端 GET；没有按 URL 合并订阅，没有解析或转发引用/贴纸业务模型。外层 EventSource 保持原状。

这确实增加了浏览器标准 EventSource 的子页面内替代实现，是连接层适配，并非绝对零影响。命名事件、事件编号、重试、Last-Event-ID、withCredentials 属性、关闭清理均需保持；仅同源 URL 走承载，跨源交由原浏览器实现。普通 fetch 与会话服务不改。

宿主通过正式 webServer.registerUpgrade 和 webserver/index-inject 注册。本插件代理仅向固定当前 loopback 端口 GET，携带原请求认证，原接口继续鉴权；校验同源 Origin、不跟随重定向、只接受 text/event-stream，限制请求与排队大小，心跳与关闭清理断开的请求。WS 8.21.3 随本插件打包并保留许可。

本地 Chromium 已验证外层与两子页共 9 条独立流不堵普通请求、不同上游连接身份、缺少认证被拒、重连编号及关闭释放。真实实例结果见 [[VER-isolated]]。
