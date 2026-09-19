---
id: VER-isolated
kind: verification
title: 已有验证证据与未覆盖范围
status: current
relations:
- relation: verifies
  to:
    record_id: IMP-isolated
- relation: verifies
  to:
    record_id: REQ-mainviews
---

# 已有验证证据与未覆盖范围

证据来自上一轮实际执行的类型检查、构建、单元与浏览器测试，当前建图只复核文件，不重新运行业务测试。

- `tests/isolated.spec.ts`：6 项，消息身份/来源、URL 不复制认证参数、几何约束、增删窗、焦点导航与过期消息、新建会话目录同步的竞态。
- `.dev/isolated-browser.mjs`：实际构建 bundle 在 Chromium 合成环境运行，`.dev/isolated-browser-result.json` 记录 17 项检查、0 个页面异常。
- 引用跳转使用实际原方法，普通贴纸使用实际 openStickerInSidebar，思维图使用实际原 shim；均只读读取，不修改源插件。
- DSH sessions、BetterSidebar 服务实现、编辑页正文与画布为合成 fixture。真实保存、模型发送、图数据编辑、完整 UI 未验收。
- `tsconfig.isolated.json` 严格类型检查通过；构建和 `check-bundle-portability.mjs` 通过。
- 旧 native diagnostic 不属于当前通过门，其已知上游类型图问题不冒称为通过。

真实实例还须核验认证/加载、实际 service 生命周期、引用创建发送与定位、贴纸持久化、左右思维图独立编辑、侧栏布局、内存开销。地图格式校验与阅读页渲染成功也不能代替这些检查。

## 真实实例验证：未通过

2026-09-19 在 i-7ecb6c19-80a5-4c2e-97e6-484bbfc0e926 / web 试装并启动。插件入口加载，无 JS 页面异常，但子页 sessions.phase 一直 pending。父子页各有 /plugins/events、/dsh-perf/events、/plugins/dsh-sidechat/model-route/events 三条 EventSource；会话目录和其他普通 fetch 排队。

因果诊断仅在独立测试浏览器进行：释放外层 EventSource 后，子页会话列表 ready、内容可见。完整页面复制引入的连接压力未被合成 fixture 覆盖。没有把关闭其他插件长连接做成正式实现。测试期间另有 maintenance-knowledge 409 响应，未证明其根因与分窗相关。

随后通过正式 live patch 撤下本插件启用项，恢复单窗：分窗 surface=0、发送按钮可见、BetterSidebar toggle=1、页面异常=0。贴纸/引用真实保存未执行。包仍在安装目录但停用。部署证据：D:/AI/DeepSeekHarness-Plugin/artifacts/independent-mainviews-isolated-20260919/deployment-status.json。


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

## 2026-09-19 isolated.5 共享侧栏

15 项单元测试通过（含 9 项新增侧栏回归），严格客户端类型检查、构建与路径可移植性检查通过。25 项合成 Chromium 检查通过，包含原贴纸入口和引用跳转方法；新增“直接点击非焦点窗贴纸时展开意图不能丢失”的回归。合成服务/页面不代表真实业务保存。

正式安装后的真实浏览器 15 项检查通过，未拦截替换任何 bundle：外层仅一组按钮、子页原按钮不可见、打开及关闭后切窗保持、每窗原页面保留、空白草稿显示默认文件页、底栏开关保持、高度、宽度共享、思维图下公共开关可用；页面异常 0。证据 evidence/shared-sidebar-installed.json 与 evidence/shared-sidebar-synthetic.json。

安装前核验最新 run closed / handle finalized，备份原包、profile 和接入配置；其他 46 个插件入口/清单文件、19 个构件 pin 校验保持。正式 repair 后 connected，最终 Status 为 running。期间 .4 第一次 prepare 失败，.5 启动较慢，控制命令超时后再次只读检查确认运行；未把失败日志当成功，也未修改 Maintenance 代码或强制停止。

真实引用/贴纸保存、模型发送和图数据编辑未执行。此次真实页面验收证明侧栏行为，不能扩大为所有插件业务已通过。
