---
id: DIFF-files
kind: implementation
title: 逐文件变更台账
status: current
---

# 逐文件变更台账

当前 .3 补充快照见 `evidence/isolated3-delta.json`，包含连接承载与布局修正；以下表格保留首次建图时的历史快照。M=修改、D=删除、A (untracked)=新增未跟踪。包含构建产物与旧原型；不把全部差异都称为当前入口。地图文件本身不计入业务改动。

| 文件 | 相对基线 | 归属 | 当前 SHA-256（前12位） |
|---|---|---|---|
| `.dev/isolated-browser-result.json` | A (untracked) | 构建/验证与诊断 | f3582de41259 |
| `.dev/isolated-browser.mjs` | A (untracked) | 构建/验证与诊断 | 4f33a369d51e |
| `.gitignore` | M | 清单/说明 | 4143e6059882 |
| `README.md` | M | 清单/说明 | ad15b5c25ac3 |
| `docs/LOCAL-FORK.md` | A (untracked) | 清单/说明 | 27378a87865a |
| `dsh.plugin.json` | M | 清单/说明 | c06ac9f118b1 |
| `lib/client.js` | M | 当前发行产物 | e009cf3df2c1 |
| `package.json` | M | 清单/说明 | 34fb83562bb7 |
| `scripts/sync-renderer-vendor.mjs` | M | 构建/验证与诊断 | fc789f715121 |
| `scripts/typecheck-local.mjs` | A (untracked) | 构建/验证与诊断 | 396a20a8dbca |
| `src/client/ClosePaneButton.tsx` | D | 旧同文档路线/遗留资产 | 已删除 |
| `src/client/FullscreenPaneButton.tsx` | D | 旧同文档路线/遗留资产 | 已删除 |
| `src/client/PaneConversation.tsx` | M | 旧同文档路线/遗留资产 | ee3414b39760 |
| `src/client/PaneWorkspace.module.css` | M | 旧同文档路线/遗留资产 | 8958bd21a110 |
| `src/client/PaneWorkspace.tsx` | M | 旧同文档路线/遗留资产 | 0d094e20a552 |
| `src/client/SplitContainer.module.css` | M | 旧同文档路线/遗留资产 | 30ff0d541d12 |
| `src/client/SplitPaneButton.tsx` | D | 旧同文档路线/遗留资产 | 已删除 |
| `src/client/SplitVerticalButton.tsx` | D | 旧同文档路线/遗留资产 | 已删除 |
| `src/client/ViewManager.module.css` | A (untracked) | 旧同文档路线/遗留资产 | 6390a4fd91f8 |
| `src/client/ViewManager.tsx` | A (untracked) | 旧同文档路线/遗留资产 | 369a347e1a57 |
| `src/client/index.ts` | M | 当前隔离入口 | aa55384cfb71 |
| `src/client/isolated/Workspace.tsx` | A (untracked) | 当前隔离入口 | 526aaa8a889f |
| `src/client/isolated/child.tsx` | A (untracked) | 当前隔离入口 | 348688b52676 |
| `src/client/isolated/contracts.ts` | A (untracked) | 当前隔离入口 | 0d628d4c014e |
| `src/client/isolated/focus.ts` | A (untracked) | 当前隔离入口 | 318a6e00608d |
| `src/client/isolated/layout.ts` | A (untracked) | 当前隔离入口 | 40399bfc07d2 |
| `src/client/isolated/model.ts` | A (untracked) | 当前隔离入口 | 00804ec38f6e |
| `src/client/isolated/protocol.ts` | A (untracked) | 当前隔离入口 | 6454b2a83444 |
| `src/client/isolated/shell.ts` | A (untracked) | 当前隔离入口 | 8fb1148fe8f3 |
| `src/client/isolated/surface.tsx` | A (untracked) | 当前隔离入口 | cf07a0653edf |
| `src/client/isolated/workspace.module.css` | A (untracked) | 当前隔离入口 | 8c9af876560e |
| `src/client/native-prototype.ts` | A (untracked) | 旧同文档路线/遗留资产 | 4d8eaaa40e69 |
| `src/client/pane-host.ts` | M | 旧同文档路线/遗留资产 | da18433b747a |
| `src/client/pane-store.ts` | D | 旧同文档路线/遗留资产 | 已删除 |
| `src/client/scoped-pane-stores.ts` | A (untracked) | 旧同文档路线/遗留资产 | 15790e5480b7 |
| `src/client/view-controller.ts` | A (untracked) | 旧同文档路线/遗留资产 | f972d31c6405 |
| `tests/apply.spec.tsx` | M | 构建/验证与诊断 | 4ca8b88f2ee2 |
| `tests/isolated.spec.ts` | A (untracked) | 构建/验证与诊断 | bc78a3a578b3 |
| `tests/pane-chrome.spec.ts` | D | 构建/验证与诊断 | 已删除 |
| `tests/pane-render.spec.tsx` | M | 构建/验证与诊断 | 4e92bf427871 |
| `tests/pane-store.spec.ts` | D | 构建/验证与诊断 | 已删除 |
| `tests/pane-workspace.spec.tsx` | M | 构建/验证与诊断 | 6c0323a79ab8 |
| `tests/reference-compatibility.spec.tsx` | A (untracked) | 构建/验证与诊断 | ec27216a61d5 |
| `tests/renderer-vendor.spec.ts` | M | 构建/验证与诊断 | d92df73e4a7f |
| `tests/scoped-pane-stores.spec.ts` | A (untracked) | 构建/验证与诊断 | 701bded5767f |
| `tests/split-pane-button.spec.tsx` | D | 构建/验证与诊断 | 已删除 |
| `tests/view-controller.spec.ts` | A (untracked) | 构建/验证与诊断 | 585feb2b34ba |
| `tsconfig.isolated.json` | A (untracked) | 构建/验证与诊断 | d4cd63550abb |
| `vitest.config.ts` | M | 构建/验证与诊断 | a0edaf2787a4 |
| `vitest.isolated.config.ts` | A (untracked) | 构建/验证与诊断 | db495236c09b |

未变化的上游文件（例如 vendor renderer、pane-layout-store、root-binding）仍可在仓库找到，但当前入口不使用旧会话渲染链。机器可读全指纹见 evidence/upstream-delta.json。
