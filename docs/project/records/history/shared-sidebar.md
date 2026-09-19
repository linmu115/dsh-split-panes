---
id: HIST-shared-sidebar
kind: history
title: 将侧栏开关从各窗状态中分离
date: 2026-09-19
status: current
modules: [外层导航, 独立子页, 共用侧栏]
outcome: isolated.5 已安装运行，真实侧栏页面检查通过
summary: 用户纠正侧栏应固定拥有展开状态，切换主窗只换内容；本插件内实现并补上贴纸点击的焦点竞态回归。
applicability: DSH 0.1.5-rc.2 副本及本地 BetterSidebar；仅分窗插件代码
coverage_note: Codex 依据本任务公开对话与工具结果整理；来源范围 1948 至 2450，末尾一条工具调用无配对结果，二进制截图不入索引。
history:
  path: history/shared-sidebar-20260919
  sha256: 7daf63f5f7e45ce3ac771a2cddfbb26221f41867bd84ce067e90e86c4a6d4515
  capture_sha256: 61d52f9ed089f1c7c1277ef7d9006cb9f1ca1a9cadf6c5385527a5f38c3f2d7f
related_records: [REQ-mainviews, MOD-sidebar-chrome, IF-sidebar-use, VER-isolated, IMP-isolated]
---

# 将侧栏开关从各窗状态中分离

用户反馈 .3 的各窗独立展开状态会导致切窗时右侧栏收起，两个按钮又归入各窗。确认修订：外层唯一一组按钮与开关/尺寸，各窗只保持自己的内容；空页显示默认内容。

只在分窗 fork 增加公共 chrome 状态、外层按钮/调节条，以及通过原 BetterSidebar 按钮回调对齐开关的适配器。没有公共 setter，选择现有 DOM 控件和快照订阅，未调用私有 store、没有重写标签内容，也未动引用/贴纸/思维图代码。

初步 24 项合成检查通过后，补测发现“侧栏关闭时直接点非选中窗贴纸”会丢失展开请求。原因是原开关状态和焦点确认的先后顺序。修正为同步各窗开关，并暂存焦点确认前发生的用户可见性意图。最终 15 项单元、25 项合成检查通过；保留这一失败案例的回归。

备份、校验 closed 回执后安装 .4，正式启动在 Maintenance prepare 失败；完成补测修正后安装 .5。两次均通过正式 repair 更新安装接入指纹。最终 Launcher 启动成功，但超过控制脚本等待时间，随后只读 Status 验证运行身份与 run running。没有将指令超时当作运行成功，也没有修改其他插件或强行终止实例。

最终在未替换 bundle 的真实页面完成 15 项检查：固定外层按钮、切窗保持展开/关闭及尺寸、各窗页面保留、默认文件页、底栏与思维图模式下的按钮；0 个页面异常。引用/贴纸真实保存与模型发送未执行，不扩大验收结论。
