---
id: IMP-isolated
kind: implementation
title: 当前实现及交付状态
status: current
progress: implemented
gap: 引用和贴纸完整保存与跳转仍未验收
relations:
- relation: implements
  to:
    record_id: REQ-mainviews
---

# 当前实现及交付状态

0.7.0-isolated.5 已安装启用到 RC2 副本；当前运行身份与 Maintenance run 均已核验。共享侧栏 15 项真实页面检查通过、页面异常 0；15 项单元和 25 项合成浏览器检查通过。引用和贴纸真实保存仍未验收。 共享侧栏见 [[MOD-sidebar-chrome]]，验收边界见 [[VER-isolated]]。

## 历史阶段记录

以下按发生时间保留，当前状态以上述结论和末尾 isolated.3 验收为准。

当前候选版 0.7.0-isolated.1 已构建，主入口仅使用 isolated 目录。具体职责见 [[MOD-shell]]、[[MOD-surface]]、[[MOD-child]]；原理与差异见 [[DIFF-upstream]]。

默认一窗，从侧栏新增空白第二窗；选择窗口后左栏操作该窗。窗口布局和未提交草稿未增加整页重载持久化。相同后端会话的数据并发仍遵循原插件。

本轮地图构建不改业务代码、不重新安装、不启动实例。上一轮核验目标实例 stopped，最新 run 为 recovered，候选包未安装；这条是已记录的部署快照，不代替之后的实时 Status。安装等待对当前 recovered 回执的例外确认，用户本轮先要求建地图。

产物：D:/AI/DeepSeekHarness-Plugin/artifacts/independent-mainviews-isolated-20260919/dsh-external-dsh-split-panes-0.7.0-isolated.1.tgz。
SHA-256：F9190A5D43DBEC40E22D82E7DFF459AB1F33646B1DBE9836B6A82CB11F4EBB18。

地图是候选代码的说明，不代表已启用或完成真实业务验收。

## 2026-09-19 实例试装后的状态

本条替代上方“尚未安装”的历史状态：候选包已安装到 RC2 副本，曾通过 profile live patch 启用。真实页面出现子窗空白，定位到外层与子页共 6 条长连接占用连接额度，session/list 等请求排队。仅在专用测试浏览器关闭外层长连接后子页立即 ready，未将这种诊断操作作为修复。

已移除分窗启用项，包保留但停用；实例仍运行，原单窗输入区与 BetterSidebar 入口已重新检查可见，页面异常 0。未修改其他插件源码。当前候选不具备真实交付条件；需要进一步验证连接层方案，不能以原合成测试宣称可用。详见 [[VER-isolated]]。


## 2026-09-19 连接承载修正版

0.7.0-isolated.2 已备份试装；连接承载的 7 项合成浏览器检查通过。正式 Start 在 Maintenance prepare 阶段 exit=1，尚未启动 DSH，具体错误未保存在可读 trace 中。撤下本次启用项；实例停止，真实页面与业务未验收。

新增连接层详见 [[MOD-event-transport]]。严格类型检查、构建、6 项隔离单元测试通过；7 项 Chromium 检查覆盖九条独立事件流、普通请求、连接身份、认证拒绝、Last-Event-ID 重连及关闭释放。没有用此前 17 项合成 UI 检查替代本版真实验收。其他插件直接依赖规格及原锁文件包完整性值保持。


## 2026-09-19 正式启动恢复与真实检查

isolated.2 已在 RC2 副本启用运行，真实单窗与双窗连接加载通过。isolated.3 为待安装候选，修正弹窗裁切与思维图覆盖右侧栏入口；候选前端 bundle 在专用浏览器替换本插件响应后通过检查，未修改已安装文件。

启动原因已查明：安装配置变更使 Maintenance 接入指纹失效。备份后核对 19 个构件哈希，通过正式 repair 更新当前目标接入指纹，其他绑定、profile 配置及同步名单未改变。随后正式 Start 成功，run 为 running。

真实浏览器验证：两窗 ready、各自输入草稿独立（测试后清空，未发送）、左侧选择只改变选中窗、分隔线调宽、左窗对话与右窗思维图并存。页面异常为 0。原 .2 发现弹窗裁切和右侧栏被画布覆盖；.3 仅在分窗布局中按通用 dialog/fixed iframe 容器限宽和调整侧栏层级，在专用浏览器精确替换本插件 bundle 后验证弹窗完整及地图侧栏展开。

仍未验证引用、普通贴纸及会话贴纸的真实保存和完整跳转。历史查询返回 GRAPH_SESSION_NOT_FOUND / STICKER_MIGRATION_REQUIRED，未迁移用户数据。不能据此宣称所有插件业务已通过。


## 2026-09-19 isolated.3 安装验收

0.7.0-isolated.3 已安装并启用到 RC2 副本。正式 Launcher 启动完成；未替换网络响应的真实浏览器验证两窗加载、输入草稿独立、选中窗导航、分隔线调宽、对话/思维图并列、弹窗完整及思维图右侧栏展开。引用和贴纸真实保存与完整跳转仍未验收。

用户正常停止后核对旧 run closed。备份 profile、接入绑定及能力回执，校验包 SHA256，安装后核验其他插件依赖规格、锁文件 resolution、19 个构件 pin 均保持。通过正式 repair 刷新接入指纹，其他绑定/配置/同步名单保持。实际包与构建产物哈希一致。

证据：.dev/installed-layout3-result.json 与 .dev/installed-layout3-output.log；真实浏览器未拦截或替换插件脚本。页面异常 0，历史查询仍有 GRAPH_SESSION_NOT_FOUND / STICKER_MIGRATION_REQUIRED，未迁移数据、未发送模型请求。实例保持运行供用户验收。

## 2026-09-19 shared sidebar 交付

0.7.0-isolated.5 已安装启用到 RC2 副本；当前运行身份与 Maintenance run 均已核验。共享侧栏 15 项真实页面检查通过、页面异常 0；15 项单元和 25 项合成浏览器检查通过。引用和贴纸真实保存仍未验收。

本次代码只修改分窗 fork。安装前确认旧 run closed / handle finalized，备份后核验其他 46 个插件入口/清单文件、19 个构件 pin、其他直接依赖规格均不变。正式 repair 更新本实例安装指纹。曾在 prepare 阶段失败；最终正式启动完成，Status 核验 running。没有修改 Maintenance 或其他插件源码。
