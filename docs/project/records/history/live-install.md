---
id: HIST-live-install
kind: history
title: 真实实例试装与连接容量阻塞
date: '2026-09-19'
status: current
applicability: 0.7.0-isolated.1 在当前 RC2 副本插件组合下
summary: 已安装试启用，发现长连接占满导致子页目录请求排队，停用分窗并恢复单窗。
outcome: 未通过真实验收，包已安装但停用
modules:
- 子页面运行
- 部署验证
coverage_note: 本次试装任务公开请求与工具证据；不保存原始载荷，按需读取来源。
history:
  path: history/live-install-20260919
  sha256: 1d2c29d7d4fdcbd08617a2f87089e79fdcfd890a640c3279bff3f2b2ea3267f1
  capture_sha256: cb999ba7ae09cf6b0555082f5ce20888c1018203a6837d2cddf2f603fe7bef9e
related_records:
- IMP-isolated
- VER-isolated
---

# 试装与恢复

用户授权安装并启动检查，确认停止后读到 closed 回执。安装包与原依赖校验值保持，实例正式启动。分窗启用后子页空白，排查握手发现导航消息已到达、会话列表仍 pending。浏览器显示父子页面各 3 条 SSE；仅在专用诊断浏览器释放外层连接后子页 ready，确认真实组合的连接压力是阻断条件。

未把诊断中关闭其他插件连接的方法写入产品。撤去分窗启用项，原配置恢复，实例保持运行；真实浏览器再次检查单窗输入与侧栏入口可见、页面异常 0。包保留停用。详见 [[VER-isolated]]，不能以此前合成测试覆盖本次负结果。
