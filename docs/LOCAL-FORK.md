# DSH 0.2 RC2 candidate: 0.7.0-dsh02.1

Target: exact official DSH 0.2.0-rc.2, BetterSidebar 0.24.1-dsh02.1. This candidate is not installed. UI and real browser interaction are not accepted yet.

The native DSH right sidebar now hosts BetterSidebar and third-party tabs. Child documents keep this native column visible and use its public `isExpanded` / `toggleExpanded` controls; the bottom workbench uses BetterSidebar's bottom toggle. The outer model still owns shared width, height, split ratio, and open states. Native tabs remain per-session and per-document; messages do not forward reference or sticker content.

Session selection uses catalog `retainedBy.mainView`; navigation uses public `uiWorkspace.openSession`. A newly added local empty view does not clear a host selection through a private API or create a host session. It shows a choose-session / new-session prompt; the explicit new-session action calls `uiWorkspace.startSession` and follows the host's workspace blank-session reuse policy. Existing window state is retained through focus, add, close and navigation within the loaded page; this plugin does not add refresh persistence.

Validation: 18 isolated protocol, native sidebar and navigation tests; isolated and transport type checks; build; bundle portability. Native layout, scrolling, actual blank-session workflow and combined sticker pagination require the coordinated temporary-host browser gate.

The text below is historical 0.1.5 evidence only, not acceptance of this candidate.

---

> 当前验收：0.7.0-isolated.5 已安装启用到 RC2 副本；当前运行身份与 Maintenance run 均已核验。共享侧栏 15 项真实页面检查通过、页面异常 0；15 项单元和 25 项合成浏览器检查通过。引用和贴纸真实保存仍未验收。

> 上一版安装验收：0.7.0-isolated.3 已安装并启用到 RC2 副本。正式 Launcher 启动完成；未替换网络响应的真实浏览器验证两窗加载、输入草稿独立、选中窗导航、分隔线调宽、对话/思维图并列、弹窗完整及思维图右侧栏展开。引用和贴纸真实保存与完整跳转仍未验收。

# 独立主窗口：本地隔离版

版本：0.7.0-isolated.5。开发分支 codex/independent-main-views。
本轮业务代码仅修改本 fork；已安装并启用到 RC2 副本，未改动其他插件与宿主代码。安装配置变更后通过正式 Maintenance repair 更新接入指纹。

## 来源与选择

- Fork：https://github.com/linmu115/dsh-split-panes
- 上游：https://github.com/lehhair/dsh-split-panes
- 起点：ccbbf06d414df233744fb1f776f54fb47465ac17（0.6.5）
- 核对宿主：DSH 0.1.5-rc.2。其他版本尚未验证。

用户选择每个主窗口拥有独立前端运行环境，放弃同 document 多组件路线。
不增加引用跨窗转发：在右窗点击引用，仅在右窗导航、查找原文和滚动，即使左窗也显示目标会话。

## 实现

入口 src/client/index.ts 仅导入 isolated 下的运行时代码。每个主窗口加载同源 DSH 页面，拥有独立 document、会话选择和插件前端实例。既有引用、贴纸和思维图代码在各自页面中原样运行。

外层保留共享会话列表。焦点窗口的选择与外层列表通过本插件通道同步，左侧操作只发给焦点窗口。通道校验 origin、source、窗口身份和随机 nonce，并以 revision 丢弃过期导航回复。通道只承载窗口管理、会话选择、尺寸及就绪状态，不传引用、贴纸或思维图业务数据。

每个页面仍有自己的 BetterSidebar 服务。只展示焦点窗口的侧栏，并固定在整个区域最右侧；非焦点窗侧栏不可见且不可操作。DOM/CSS 只调整布局，未修改 BetterSidebar 实现。本插件通过现有 registerTab 注册主窗口管理入口。空白会话尚无侧栏状态时提供小型添加/关闭入口。

默认一窗，主动添加空白第二窗。当前布局与入口最多两窗，左右并排，中间分隔线可拖动或用方向键调节。视图状态以数组建模，可后续扩展，但三个以上窗口的布局尚未实现。

选中窗显示黑色边框。焦点观察包括同源嵌套 iframe（例如思维图画布），使用事件监听，不修改嵌入应用代码。外层切换全局面板时保留子页面，避免销毁草稿。关闭窗口会销毁所关闭的前端视图，保留另一窗。

## 验证（2026-09-19）

- 当前隔离入口严格 TypeScript 检查：通过。
- 窗口协议、布局、焦点导航与共享侧栏：15 项单元测试通过。
- 发行入口构建与机器路径检查：通过。
- Chromium 合成浏览器验证：25 项通过，无页面异常。
- 浏览器测试只读提取既有引用 openDshSource/resolveDshAnchor 方法、普通贴纸 openStickerInSidebar 函数；思维图前端 shim 文件直接原样加载。没有修改这些来源文件。
- 已验证引用跳转只滚动本窗；普通贴纸调用能通过独立 Sidebar 服务打开对应会话编辑页；思维图模式独立；画布点击可使共享左栏路由到该窗；拖动分隔线、外层切换页面和关闭另一窗均保留剩余草稿。

**测试边界**：会话服务、Sidebar 服务、编辑页正文与思维图画布为合成 fixture。没有创建或读取用户历史正文，没有真实模型发送、贴纸持久化或思维图图数据编辑。浏览器截图是验证夹具，不是正式 UI 截图。真实实例的插件加载、最终布局、引用创建/发送、贴纸保存、思维图编辑仍未验收。

## 已知边界

- 独立的是前端运行环境，后端会话和已有插件持久化仍共享。不会复制用户数据库。相同会话在两个窗口编辑仍受原插件的并发保存语义约束。
- 每窗需要单独加载前端并建立连接，内存与网络开销高于同文档方案，尚未测量真实实例开销。
- 重载整个外层页面恢复默认单窗；布局与未提交草稿未另行持久化。
- 同源嵌套页面焦点已验证；跨域嵌入页面无法读取内部事件，未纳入本次支持。
- 当前适配核对了 RC2 的插槽 DOM 和 BetterSidebar 布局属性，宿主未来变更需要重新验证。上下分屏、底部停靠侧栏、浮层超出所属主窗等情况未验收。
- 原同文档 prototype 和对应诊断测试留作历史证据，不进入发行 bundle，也不作为当前通过门。

## 复查

当前通过门：npm run typecheck、npm test、npm run build、npm run bundle:portable。
浏览器测试：设置 DSH_ANNOTATION_SOURCE、DSH_STICKER_SOURCE、DSH_THOUGHTDAG_SOURCE 为各自只读源码根目录后执行 node .dev/isolated-browser.mjs。
测试结果：.dev/isolated-browser-result.json。
旧路线诊断分别保留在 typecheck:native-diagnostic 和 test:native-diagnostic，不代表当前隔离版检查。

本地 node_modules 是既有开发依赖目录的 junction，不向其安装或删除依赖。
发行包只包含本插件的 lib、清单、Cordis 补丁、许可证及本说明。Git 分支保存当前实现、旧路线诊断与项目地图。

## shared-sidebar 修改（isolated.5）

外层独占两个展开按钮、展开状态、侧栏宽度与底栏高度。切窗不恢复该会话旧的开关状态，只切换内容；各子页原有标签和编辑页不复制、不重建。空白会话没有 BetterSidebar 状态时，外层显示空白提示与主窗口管理入口，不创建虚假会话。

sidebar-chrome.ts 使用公开 getSnapshot/subscribeState 读取状态，通过现有 data-dsh-toggle-cluster 的原按钮回调对齐显示开关。没有私有 store 写入、没有 importLayout、没有调用贴纸/引用业务。用户通过原插件打开编辑页时仍可展开侧栏。窗口身份、会话和 revision 校验阻止非焦点及过期消息改变外层开关。宽高只由外层拖动条调整，避免不同会话保存宽高导致切窗跳变。

兼容边界：依赖已核验 BetterSidebar DOM 挂点和底部/右侧按钮顺序；提供方变更需要重新核验。既有业务持久化语义保持，未另行隔离同会话的后端保存。

切换焦点到另一窗时，将用户紧接着触发的原侧栏展开意图保留到外层确认该窗，再按新 revision 回报。避免打开贴纸的请求被焦点同步覆盖。全局开关也同步非焦点窗的原开关，非焦点内容仍隐藏；不复制标签与编辑内容。

实际安装页面检查覆盖外层唯一按钮、切窗保持展开/关闭、默认文件页、各窗页面保留、底部栏开关与高度、共享宽度、思维图下开关；不发送模型消息，不保存贴纸。
