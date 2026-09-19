---
id: HIST-publish-isolated3
kind: history
title: isolated.3 版本归档与地图同步
date: '2026-09-19'
status: current
summary: 按用户要求整理本次代码与地图，修正过时状态，排除本机部署诊断和生成阅读页。
outcome: 提交候选已整理，远程同步以 Git 分支状态为准
applicability: codex/independent-main-views 的 0.7.0-isolated.3
modules: [项目地图, 版本管理]
coverage_note: 本次提交请求及地图整理阶段的公开来源索引；不包含后续 Git 推送回执。
history:
  path: history/publish-isolated3-20260919
  sha256: 24986976e9820370a552d94461ed37a6b833139243938f5720861f82566724b3
  capture_sha256: 4236ace16ca0ec3565bd8128334aa8f181c136df180bf5ea1306dc32416888f5
related_records: [IMP-isolated, VER-isolated, DIFF-files, MOD-event-transport]
---

# 版本与地图归档

用户要求提交推送本次改动并更新地图。将当前代码、构建产物、测试与项目地图保存到 fork 的独立主窗口分支；保留上游来源和旧路线诊断，明确旧代码不进入当前入口。

修正 README、LOCAL-FORK、实现状态与架构图中过时的未安装结论，补充连接承载节点和 .3 文件快照。旧阶段记录保留为历史，不替代当前验收边界。本机部署/登录诊断脚本、实例查询结果、截图和生成阅读页不发布。历史只保留来源定位与指纹，不包含原会话正文；异机读取来源不可用时应明确提示。
