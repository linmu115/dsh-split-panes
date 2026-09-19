---
id: MOD-sidebar-chrome
kind: module
title: 共用侧栏开关与尺寸
status: current
relations:
- relation: implements
  to:
    record_id: REQ-mainviews
- relation: consumes
  to:
    record_id: IF-sidebar-use
---

# 共用侧栏开关与尺寸

用户看到始终固定的一组按钮和侧栏区域。选择左窗或右窗时，只替换这个区域里的各窗原有内容；开启/关闭与占用空间保持。空内容显示原默认页，无会话状态时显示空白提示。

外层 Workspace / model 保存开关与尺寸；子页 sidebar-chrome.ts 对齐各窗原开关，外层裁切只展示选中窗的内容。通过原按钮回调及公开快照订阅协作，不替换 BetterSidebar 工厂，也不复制或重建标签与编辑页。

仅切换焦点不视为用户改变公共开关。用户主动点击贴纸等入口导致原 Sidebar 展开仍保留；跨越焦点确认的动作先暂存，再按新 revision 回报。非选中窗后台变化不控制外层。宽高使用外层拖动条，避免各会话保存的旧宽高在切换时造成跳变。

验证包括 9 项新增单元回归，真实 15 项页面检查及合成 25 项交互检查。真实贴纸保存未执行。源码只改本插件，未改外部业务插件。更完整证据见 [[VER-isolated]]。
