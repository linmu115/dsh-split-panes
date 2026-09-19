---
id: DEC-isolation
kind: decision
title: 采用独立页面，停止同文档路线
status: current
relations:
- relation: supersedes
  to:
    record_id: EXP-same-document
---

# 采用独立页面，停止同文档路线

用户最后选择每窗独立前端运行环境，并要求只能改本插件。此前“如果目标已经在另一窗就切换过去”的跨窗转发建议未采用。

同文档原型失败场景：左 A、右 B，右窗点指向 A 的引用后右窗切 A，但原引用方法使用全局 document.querySelector，命中左窗原文并滚动左窗。导航正确不等于定位正确。没有通过修改引用插件、改写全局 querySelector 或限制同会话双开来绕过。

新方案让引用方法运行在所属 iframe 的 document 内。代价是每窗再次加载前端与建立连接，并需要本插件协调外层导航和布局。独立文档不是宿主提供的正式多视图 API；真实实例开销与兼容性仍待验证。
