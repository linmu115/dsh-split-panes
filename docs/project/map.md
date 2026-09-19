# dsh-split-panes 项目地图

这个本地 fork 把 DSH 中间区域变为可独立操作的会话窗口，同时保留共享左侧会话列表和最右侧的 BetterSidebar。0.7.0-isolated.3 已安装并启用到 RC2 副本。正式 Launcher 启动完成；未替换网络响应的真实浏览器验证两窗加载、输入草稿独立、选中窗导航、分隔线调宽、对话/思维图并列、弹窗完整及思维图右侧栏展开。引用和贴纸真实保存与完整跳转仍未验收。

从这里阅读：

- [[REQ-mainviews|用户确认的功能与约束]]：什么必须保留、什么不应再做。
- [[DIFF-upstream|与上游的区别]]、[[DIFF-files|逐文件变更]]：固定 0.6.5 基线，不混同远程最新状态。
- [[OBJ-view|窗口与会话对象]]、[[MOD-shell|外层控制]]、[[MOD-surface|布局承载]]、[[MOD-child|独立子页]]：当前有效结构。
- [[IF-view-channel|本插件消息协议]]、[[IF-sidebar-use|外部能力接入]]：哪些协作存在、业务代码为何不改。
- [[DEC-isolation|路线选择]]、[[EXP-same-document|停用原型]]：旧代码为何保留但不运行。
- [[MOD-event-transport|连接承载修正]]：只在本插件内承载各窗独立事件流。
- [[IMP-isolated|做到哪]]、[[VER-isolated|验证与缺口]]：候选构建与实际安装分开。

基线：ccbbf06d414df233744fb1f776f54fb47465ac17；本地分支 codex/independent-main-views；本分支保存已安装版本与验证范围。地图属于这一项目，不管理其他插件的内部实现。
