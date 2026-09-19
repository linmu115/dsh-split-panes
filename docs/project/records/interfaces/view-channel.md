---
id: IF-view-channel
kind: interface
title: 本插件的窗口通道
status: current
---

# 本插件的窗口通道

外层和子页只交换“哪个窗口、打开哪个会话、布局尺寸是多少”，让共享左栏和独立页面配合。例：选中右窗后点左栏 B，外层只给右窗 navigate(B)，右窗仍调用自己的原会话服务。

提供方与消费者均属于本插件。技术入口 `isolated/protocol.ts`，频道 `dsh-independent-main-view/v1`。

| 方向 | 消息 | 作用 |
|---|---|---|
| 外层 → 子页 | navigate(revision, sessionId) | 切换或清空该窗会话 |
| 外层 → 子页 | geometry、views | 主窗/侧栏尺寸和管理列表 |
| 子页 → 外层 | ready、focus、selection | 就绪、操作目标、会话变化 |
| 子页 → 外层 | sidebar、manage、error | 宽度、增删选窗、可见错误 |

校验 origin、event.source、id、nonce。导航另外校验 revision；消息不是跨来源的安全沙箱，同源页面本来共享认证环境。构造子页 URL 只取 origin/pathname，不复制登录 token 参数或 fragment。

加载慢显示重试；打开会话失败给出提示。此接口不承载引用、高亮、贴纸内容或思维图图数据；未来添加这些字段会改变已确认的隔离边界，应先重新确认。
