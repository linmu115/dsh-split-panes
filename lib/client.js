window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-split-panes",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		//#region src/client/isolated/protocol.ts
		/** Only view navigation and geometry cross the boundary; no plugin business payloads. */
		const CHANNEL = "dsh-independent-main-view/v1";
		function envelope(identity, body) {
			return {
				...identity,
				channel: CHANNEL,
				body
			};
		}
		function accepts(event, origin, source, identity) {
			const data = event.data;
			return event.origin === origin && event.source === source && !!data && data.channel === "dsh-independent-main-view/v1" && data.id === identity.id && data.nonce === identity.nonce && typeof data.body === "object" && data.body !== null;
		}
		function childIdentity(url) {
			const id = url.searchParams.get("dshMainView"), nonce = url.searchParams.get("dshViewChannel");
			return id && nonce && /^[\w-]{1,80}$/.test(id) && /^[\w-]{1,80}$/.test(nonce) ? {
				id,
				nonce
			} : null;
		}
		function frameUrl(location, identity) {
			const url = new URL(location.pathname, location.origin);
			url.searchParams.set("dshMainView", identity.id);
			url.searchParams.set("dshViewChannel", identity.nonce);
			return url.href;
		}
		function viewGeometry(totalWidth, requestedSidebar, count, ratio) {
			const sidebar = Math.max(0, Math.min(requestedSidebar, totalWidth * .45));
			const center = Math.max(0, totalWidth - sidebar);
			const first = count > 1 ? Math.max(0, (center - 5) * Math.max(.2, Math.min(.8, ratio))) : center;
			return {
				sidebar,
				center,
				first,
				secondLeft: first + 5,
				second: Math.max(0, center - first - 5)
			};
		}
		function clipRegions(left, width, height, total, sidebar) {
			const rect = (x, w) => `M${x} 0H${x + w}V${height}H${x}Z`;
			return `path("${rect(left, width)}${sidebar > 0 ? rect(total - sidebar, sidebar) : ""}")`;
		}
		//#endregion
		//#region src/client/isolated/focus.ts
		/** Observe focus within this view, including same-origin embedded app documents.
		* Event listeners only: no embedded plugin code or business services are changed.
		*/
		function observeViewFocus(doc, focus) {
			const frames = /* @__PURE__ */ new Map();
			doc.addEventListener("pointerdown", focus, true);
			doc.addEventListener("focusin", focus, true);
			const scan = () => {
				for (const [frame, dispose] of frames) if (!doc.contains(frame)) {
					dispose();
					frames.delete(frame);
				}
				for (const frame of doc.querySelectorAll("iframe")) {
					if (frames.has(frame)) continue;
					let child = null, cleanup;
					const attach = () => {
						let next = null;
						try {
							next = frame.contentDocument;
						} catch {}
						if (next === child) return;
						cleanup?.();
						child = next;
						cleanup = next ? observeViewFocus(next, focus) : void 0;
					};
					frame.addEventListener("load", attach);
					frames.set(frame, () => {
						frame.removeEventListener("load", attach);
						cleanup?.();
					});
					attach();
				}
			};
			const observer = new MutationObserver(scan);
			observer.observe(doc, {
				subtree: true,
				childList: true
			});
			scan();
			return () => {
				observer.disconnect();
				doc.removeEventListener("pointerdown", focus, true);
				doc.removeEventListener("focusin", focus, true);
				for (const dispose of frames.values()) dispose();
				frames.clear();
			};
		}
		//#endregion
		//#region \0dsh-css:src/client/isolated/workspace.module.css.mjs
		const css = ".qen7la_workspace{flex:1;min-width:0;height:100%;min-height:0;position:relative;overflow:hidden}.qen7la_frame{background:var(--dsw-alias-bg-base);border:0;width:100%;height:100%;position:absolute;inset:0}.qen7la_focus{box-sizing:border-box;pointer-events:none;z-index:4;border:1px solid #111;position:absolute;top:0;bottom:0}.qen7la_divider{cursor:col-resize;touch-action:none;z-index:6;width:5px;position:absolute;top:0;bottom:0}.qen7la_divider:after{content:\"\";background:var(--dsw-alias-border-l2);width:1px;position:absolute;top:0;bottom:0;left:2px}.qen7la_divider:focus-visible{outline:1px solid var(--dsw-alias-label-primary)}.qen7la_dragShield{z-index:5;cursor:col-resize;position:absolute;inset:0}.qen7la_loading{color:var(--dsw-alias-label-secondary);z-index:3;background:var(--dsw-alias-bg-base);place-items:center;display:grid;position:absolute;top:0;bottom:0}.qen7la_error{box-sizing:border-box;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);z-index:7;padding:12px;position:absolute;bottom:12px}.qen7la_blankControl{z-index:7;cursor:pointer;background:var(--dsw-alias-bg-base);width:28px;height:28px;color:var(--dsw-alias-label-primary);border:0;border-radius:50%;font-size:20px;position:absolute;top:12px}.qen7la_controls{padding:16px}.qen7la_controlRow{justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;display:flex}.qen7la_circle{background:var(--dsw-alias-bg-l2,#f3f3f3);width:28px;height:28px;color:inherit;cursor:pointer;border:0;border-radius:50%;padding:0;font-size:20px}.qen7la_circle:hover:not(:disabled){background:#e6e6e6}.qen7la_circle:disabled{opacity:.35;cursor:default}.qen7la_viewChoice{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:8px 10px}.qen7la_viewChoice[aria-pressed=true]{background:var(--dsw-alias-bg-l2,#f0f0f0)}";
		const tagId = "@dsh-external/dsh-split-panes/workspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var workspace_module_css_default = {
			"blankControl": "qen7la_blankControl",
			"circle": "qen7la_circle",
			"controlRow": "qen7la_controlRow",
			"controls": "qen7la_controls",
			"divider": "qen7la_divider",
			"dragShield": "qen7la_dragShield",
			"error": "qen7la_error",
			"focus": "qen7la_focus",
			"frame": "qen7la_frame",
			"loading": "qen7la_loading",
			"viewChoice": "qen7la_viewChoice",
			"workspace": "qen7la_workspace"
		};
		//#endregion
		//#region src/client/isolated/layout.ts
		/** CSS/DOM presentation owned by this plugin. No factory or service is replaced. */
		function installLayout(mode) {
			const body = document.body;
			body.dataset.mvMode = mode;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-independent-main-views-layout";
			tag.textContent = `
    body[data-mv-mode="child"]:not([data-mv-ready]) #root,
    body[data-mv-mode="child"]:not([data-mv-ready]) [data-dsh-panel-host] { visibility:hidden!important }
    [data-mv-frame] { padding-right:0!important; transition:none!important }
    body[data-mv-mode="shell"] [data-mv-frame] { grid-template-columns:var(--mv-outer-sidebar,240px) minmax(0,1fr) 0px!important }
    body[data-mv-mode="shell"] [data-dsh-panel-host],
    body[data-mv-mode="shell"] [data-rightbar-col],
    body[data-mv-mode="shell"] [data-side="rightbar"] { display:none!important }
    body[data-mv-mode="shell"] [data-mv-center] { margin-bottom:0!important }
    body[data-mv-mode="child"] [data-mv-left],
    body[data-mv-mode="child"] [data-rightbar-col],
    body[data-mv-mode="child"] [data-side="sidebar"],
    body[data-mv-mode="child"] [data-side="rightbar"] { display:none!important }
    body[data-mv-mode="child"] [data-mv-frame] { display:block!important }
    body[data-mv-mode="child"] [data-mv-center] {
      position:fixed!important; top:0!important; bottom:var(--dsh-sidebar-height,0px)!important;
      left:var(--mv-left,0px)!important; width:var(--mv-width,100%)!important;
      margin:0!important; min-height:0!important; overflow:hidden!important;
    }
    body[data-mv-mode="child"] [data-dsh-panel]:not([data-dsh-bottom-panel]) { max-width:var(--mv-sidebar,100vw)!important }
    body[data-mv-mode="child"] [data-dsh-panel-host] { z-index:110!important }
    body[data-mv-mode="child"][data-mv-external-view]:not([data-mv-sidebar-open]) [data-dsh-toggle-cluster] { top:56px!important }
    body[data-mv-mode="child"] [data-mv-external-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] [role="dialog"] { max-width:calc(100% - 24px)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-dsh-toggle-cluster] { right:var(--mv-toggle-right,10px)!important }
    body[data-mv-mode="child"][data-mv-inactive] [data-dsh-panel-host] { visibility:hidden!important; pointer-events:none!important }
    body[data-mv-mode="child"] [data-slot="conversation.session.header.corner"] { display:none!important }
  `;
			document.head.append(tag);
			const marked = /* @__PURE__ */ new Set();
			const mark = (node, name) => {
				if (!node) return;
				if (!node.hasAttribute(name)) node.setAttribute(name, "");
				marked.add(node);
			};
			const column = (slot) => {
				let node = slot?.parentElement ?? null;
				while (node && getComputedStyle(node).display === "contents") node = node.parentElement;
				return node;
			};
			const syncPortals = () => {
				if (mode !== "child") return;
				for (const dialog of document.querySelectorAll("[role=\"dialog\"]")) for (let layer = dialog; layer && layer !== body; layer = layer.parentElement) {
					const style = getComputedStyle(layer), box = layer.getBoundingClientRect();
					if (style.position === "fixed" && (layer.hasAttribute("data-mv-dialog-layer") || box.width >= innerWidth * .9 && box.height >= innerHeight * .9)) {
						mark(layer, "data-mv-dialog-layer");
						break;
					}
				}
				const externalView = [...document.querySelectorAll("iframe")].some((frame) => {
					for (let layer = frame.parentElement; layer && layer !== body; layer = layer.parentElement) {
						if (layer.hasAttribute("data-dsh-panel-host")) return false;
						const style = getComputedStyle(layer), box = layer.getBoundingClientRect();
						if (style.position === "fixed" && Number(style.zIndex) >= 100 && box.height > innerHeight * .7 && style.visibility !== "hidden" && style.display !== "none") {
							mark(layer, "data-mv-external-layer");
							return true;
						}
					}
					return false;
				});
				body.toggleAttribute("data-mv-external-view", externalView);
			};
			const sync = () => {
				const main = column(document.querySelector("#root [data-slot=\"main\"]"));
				const frame = main?.parentElement ?? null;
				syncPortals();
				mark(main, "data-mv-center");
				mark(frame, "data-mv-frame");
				mark(column(document.querySelector("#root [data-slot=\"sidebar\"]")), "data-mv-left");
				if (frame && mode === "shell") {
					const first = frame.style.gridTemplateColumns.match(/^([\d.]+px)/)?.[1];
					if (first && body.style.getPropertyValue("--mv-outer-sidebar") !== first) body.style.setProperty("--mv-outer-sidebar", first);
				}
			};
			let scheduled = 0;
			const observer = new MutationObserver(() => {
				if (!scheduled) scheduled = requestAnimationFrame(() => {
					scheduled = 0;
					sync();
				});
			});
			observer.observe(body, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ["style", "class"]
			});
			sync();
			return () => {
				observer.disconnect();
				cancelAnimationFrame(scheduled);
				tag.remove();
				for (const node of marked) for (const name of [
					"data-mv-center",
					"data-mv-frame",
					"data-mv-left",
					"data-mv-dialog-layer",
					"data-mv-external-layer"
				]) node.removeAttribute(name);
				delete body.dataset.mvSidebarOpen;
				delete body.dataset.mvExternalView;
				delete body.dataset.mvMode;
				delete body.dataset.mvReady;
				delete body.dataset.mvInactive;
				for (const name of [
					"--mv-outer-sidebar",
					"--mv-left",
					"--mv-width",
					"--mv-sidebar",
					"--mv-toggle-right"
				]) body.style.removeProperty(name);
			};
		}
		//#endregion
		//#region src/client/isolated/child.tsx
		function installChild(ctx, identity) {
			const sessions = ctx.get("sessions");
			const origin = window.location.origin;
			const notify = (body) => window.parent.postMessage(envelope(identity, body), origin);
			let revision = -1, requestedRevision = -1, applying = false, initialized = false, disposed = false;
			let previous;
			let items = [];
			const listeners = /* @__PURE__ */ new Set();
			const publish = () => {
				if (!initialized || applying || disposed) return;
				const sessionId = sessions.list.getSnapshot().current ?? null;
				if (sessionId === previous) return;
				previous = sessionId;
				notify({
					type: "selection",
					revision,
					sessionId
				});
			};
			const receive = async (event) => {
				if (!accepts(event, origin, window.parent, identity)) return;
				const body = event.data.body;
				if (body.type === "geometry") {
					const { left, width, sidebar, active } = body.value;
					if (![
						left,
						width,
						sidebar
					].every((n) => Number.isFinite(n) && n >= 0)) return;
					const style = document.body.style;
					style.setProperty("--mv-left", `${left}px`);
					style.setProperty("--mv-width", `${width}px`);
					style.setProperty("--mv-sidebar", `${sidebar}px`);
					style.setProperty("--mv-toggle-right", sidebar > 0 ? "10px" : `${Math.max(10, window.innerWidth - left - width + 10)}px`);
					document.body.toggleAttribute("data-mv-inactive", !active);
					document.body.toggleAttribute("data-mv-sidebar-open", sidebar > 0);
				} else if (body.type === "views" && Array.isArray(body.items)) {
					items = body.items;
					for (const fn of listeners) fn();
				} else if (body.type === "navigate") {
					if (!Number.isSafeInteger(body.revision) || body.revision < requestedRevision || body.sessionId !== null && typeof body.sessionId !== "string") return;
					requestedRevision = body.revision;
					applying = true;
					try {
						const snapshot = sessions.list.getSnapshot();
						if (snapshot.phase === "pending" || body.sessionId && snapshot.byId && !snapshot.byId[body.sessionId]) await sessions.refresh();
						if (disposed || requestedRevision !== body.revision) return;
						if (body.sessionId === null) sessions.clear();
						else sessions.open(body.sessionId);
						revision = body.revision;
						initialized = true;
						previous = void 0;
						document.body.dataset.mvReady = "";
					} catch {
						notify({
							type: "error",
							message: "会话未能打开，可在左侧重新选择。"
						});
					} finally {
						if (requestedRevision === body.revision) {
							applying = false;
							publish();
						}
					}
				}
			};
			ctx.effect(() => installLayout("child"), "independent-views: child presentation");
			ctx.effect(() => {
				const focus = () => notify({ type: "focus" });
				window.addEventListener("message", receive);
				const unwatchFocus = observeViewFocus(document, focus);
				const unsubscribe = sessions.list.subscribe(publish);
				notify({ type: "ready" });
				return () => {
					disposed = true;
					unsubscribe();
					window.removeEventListener("message", receive);
					unwatchFocus();
				};
			}, "independent-views: child channel");
			ctx.inject(["betterSidebar"], (childCtx) => {
				const sidebar = childCtx.get("betterSidebar");
				let lastWidth = -1;
				const measure = () => {
					const state = sidebar.getSnapshot().state;
					const width = state?.panelOpen ? Math.max(0, state.width) : 0;
					if (width !== lastWidth) {
						lastWidth = width;
						notify({
							type: "sidebar",
							width
						});
					}
				};
				const ViewControls = () => {
					const views = (0, react.useSyncExternalStore)((fn) => {
						listeners.add(fn);
						return () => {
							listeners.delete(fn);
						};
					}, () => items);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: workspace_module_css_default.controls,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: workspace_module_css_default.controlRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "主窗口" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: workspace_module_css_default.circle,
								type: "button",
								"aria-label": "添加主窗口",
								title: "添加主窗口",
								disabled: views.length >= 2,
								onClick: () => notify({
									type: "manage",
									action: "add"
								}),
								children: "＋"
							})]
						}), views.map((view, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: workspace_module_css_default.controlRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								className: workspace_module_css_default.viewChoice,
								type: "button",
								"aria-pressed": view.active,
								onClick: () => notify({
									type: "manage",
									action: "focus",
									id: view.id
								}),
								children: [
									"窗口 ",
									i + 1,
									view.sessionId === null ? " · 新会话" : ""
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: workspace_module_css_default.circle,
								type: "button",
								"aria-label": `关闭窗口 ${i + 1}`,
								disabled: views.length === 1,
								onClick: () => notify({
									type: "manage",
									action: "close",
									id: view.id
								}),
								children: "×"
							})]
						}, view.id))]
					});
				};
				childCtx.effect(() => {
					const unlisten = sidebar.subscribeState(measure);
					const unregister = sidebar.registerTab({
						id: "independent-main-views",
						title: "主窗口",
						single: true,
						order: 15,
						component: ViewControls
					});
					measure();
					return () => {
						unlisten();
						unregister();
					};
				}, "independent-views: sidebar controls");
			});
		}
		//#endregion
		//#region src/client/isolated/model.ts
		function createViewModel(initial, uuid = () => crypto.randomUUID()) {
			const make = (sessionId) => ({
				id: uuid(),
				nonce: uuid(),
				sessionId,
				revision: 0,
				sidebar: 0,
				ready: false,
				error: null
			});
			const first = make(initial);
			let state = {
				views: [first],
				active: first.id,
				ratio: .5
			};
			const listeners = /* @__PURE__ */ new Set();
			const update = (next) => {
				state = next;
				for (const fn of listeners) fn();
			};
			const patch = (id, value) => {
				if (!state.views.some((v) => v.id === id)) return;
				update({
					...state,
					views: state.views.map((v) => v.id === id ? {
						...v,
						...value
					} : v)
				});
			};
			return {
				getSnapshot: () => state,
				subscribe: (fn) => {
					listeners.add(fn);
					return () => {
						listeners.delete(fn);
					};
				},
				patch,
				add() {
					if (state.views.length >= 2) return;
					const view = make(null);
					update({
						...state,
						views: [...state.views, view],
						active: view.id
					});
				},
				close(id) {
					if (state.views.length === 1 || !state.views.some((v) => v.id === id)) return;
					const views = state.views.filter((v) => v.id !== id);
					update({
						...state,
						views,
						active: state.active === id ? views[0].id : state.active
					});
				},
				focus(id) {
					if (state.active !== id && state.views.some((v) => v.id === id)) update({
						...state,
						active: id
					});
				},
				ratio(value) {
					if (Number.isFinite(value)) update({
						...state,
						ratio: Math.max(.2, Math.min(.8, value))
					});
				},
				navigate(sessionId) {
					const active = state.views.find((v) => v.id === state.active);
					patch(active.id, {
						sessionId,
						revision: active.revision + 1,
						error: null
					});
				}
			};
		}
		//#endregion
		//#region src/client/isolated/shell.ts
		/** Parent controls views; children keep their own complete plugin runtime. */
		function createShell(sessions, model, host = window) {
			const frames = /* @__PURE__ */ new Map();
			const sent = /* @__PURE__ */ new Map();
			let mirroring = false, lastSelection = sessions.list.getSnapshot().current ?? null;
			let mirrorGeneration = 0, disposed = false;
			const mirror = () => {
				const generation = ++mirrorGeneration;
				const state = model.getSnapshot(), active = state.views.find((v) => v.id === state.active);
				const selected = active.sessionId;
				const apply = () => {
					if (disposed || generation !== mirrorGeneration) return;
					lastSelection = selected;
					mirroring = true;
					try {
						if (selected === null) sessions.clear();
						else if (sessions.list.getSnapshot().current !== selected) sessions.open(selected);
					} finally {
						mirroring = false;
					}
				};
				const snapshot = sessions.list.getSnapshot();
				if (selected && snapshot.byId && !snapshot.byId[selected]) sessions.refresh().then(apply).catch(() => {
					if (!disposed && generation === mirrorGeneration) model.patch(active.id, { error: "外层会话列表暂未同步，可稍后重新选择此窗口。" });
				});
				else apply();
			};
			const focus = (id) => {
				model.focus(id);
				mirror();
			};
			const synchronize = () => {
				const state = model.getSnapshot();
				for (const view of state.views) {
					const child = frames.get(view.id);
					if (!child || !view.ready) continue;
					child.postMessage(envelope(view, {
						type: "views",
						items: state.views.map((v) => ({
							id: v.id,
							sessionId: v.sessionId,
							active: v.id === state.active
						}))
					}), host.location.origin);
					if (sent.get(view.id) === view.revision) continue;
					sent.set(view.id, view.revision);
					child.postMessage(envelope(view, {
						type: "navigate",
						revision: view.revision,
						sessionId: view.sessionId
					}), host.location.origin);
				}
			};
			const receive = (event) => {
				const view = model.getSnapshot().views.find((v) => {
					const frame = frames.get(v.id);
					return frame && accepts(event, host.location.origin, frame, v);
				});
				if (!view) return;
				const body = event.data.body;
				switch (body.type) {
					case "ready":
						sent.delete(view.id);
						model.patch(view.id, {
							ready: true,
							error: null
						});
						break;
					case "focus":
						focus(view.id);
						break;
					case "selection":
						if (body.revision !== view.revision || body.sessionId !== null && typeof body.sessionId !== "string") return;
						if (body.sessionId !== view.sessionId) model.patch(view.id, { sessionId: body.sessionId });
						if (model.getSnapshot().active === view.id) mirror();
						break;
					case "sidebar":
						if (Number.isFinite(body.width) && body.width >= 0 && body.width !== view.sidebar) model.patch(view.id, { sidebar: body.width });
						break;
					case "manage":
						if (view.id !== model.getSnapshot().active) return;
						if (body.action === "add") model.add();
						if (body.action === "close") model.close(body.id ?? view.id);
						if (body.action === "focus" && body.id) model.focus(body.id);
						mirror();
						break;
					case "error": model.patch(view.id, { error: "这个窗口暂时未就绪，请重新选择会话。" });
				}
			};
			const unselect = sessions.list.subscribe(() => {
				const selected = sessions.list.getSnapshot().current ?? null;
				if (mirroring || selected === lastSelection) return;
				++mirrorGeneration;
				lastSelection = selected;
				model.navigate(selected);
			});
			const unsubscribe = model.subscribe(synchronize);
			host.addEventListener("message", receive);
			return {
				attach(id, child) {
					if (child) frames.set(id, child);
					else {
						frames.delete(id);
						sent.delete(id);
					}
					synchronize();
				},
				geometry(id, value) {
					const view = model.getSnapshot().views.find((v) => v.id === id), child = frames.get(id);
					if (view && child) child.postMessage(envelope(view, {
						type: "geometry",
						value
					}), host.location.origin);
				},
				add() {
					model.add();
					mirror();
				},
				close(id) {
					model.close(id);
					mirror();
				},
				focus,
				dispose() {
					disposed = true;
					++mirrorGeneration;
					unselect();
					unsubscribe();
					host.removeEventListener("message", receive);
					frames.clear();
					sent.clear();
				}
			};
		}
		//#endregion
		//#region src/client/isolated/Workspace.tsx
		function Frame({ view, shell, left, width, total, height, sidebar, active }) {
			const nodeRef = (0, react.useRef)(null);
			const [slow, setSlow] = (0, react.useState)(false);
			const [attempt, setAttempt] = (0, react.useState)(0);
			const ref = (0, react.useCallback)((node) => {
				nodeRef.current = node;
				shell.attach(view.id, node?.contentWindow ?? null);
			}, [shell, view.id]);
			(0, react.useEffect)(() => {
				shell.geometry(view.id, {
					left,
					width,
					sidebar,
					active
				});
			}, [
				shell,
				view.id,
				view.ready,
				left,
				width,
				sidebar,
				active
			]);
			(0, react.useEffect)(() => {
				if (view.ready) return;
				const timer = setTimeout(() => {
					setSlow(true);
				}, 2e4);
				return () => clearTimeout(timer);
			}, [
				view.id,
				view.ready,
				attempt
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
					ref,
					className: workspace_module_css_default.frame,
					title: "独立会话窗口",
					"data-main-view": view.id,
					src: frameUrl(window.location, view),
					style: {
						clipPath: clipRegions(left, width, height, total, active ? sidebar : 0),
						zIndex: active ? 2 : 1
					}
				}),
				!view.ready && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: workspace_module_css_default.loading,
					style: {
						left,
						width
					},
					children: slow ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: ["窗口未能完成加载。", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setSlow(false);
							setAttempt((v) => v + 1);
							nodeRef.current?.contentWindow?.location.reload();
						},
						children: "重试"
					})] }) : "正在打开会话窗口…"
				}),
				view.error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: workspace_module_css_default.error,
					role: "alert",
					style: {
						left,
						width
					},
					children: view.error
				})
			] });
		}
		function Workspace({ model, shell }) {
			const state = (0, react.useSyncExternalStore)(model.subscribe, model.getSnapshot);
			const ref = (0, react.useRef)(null);
			const [size, setSize] = (0, react.useState)({
				width: 0,
				height: 0
			});
			const [dragging, setDragging] = (0, react.useState)(false);
			const active = state.views.find((v) => v.id === state.active);
			const geometry = viewGeometry(size.width, active.sidebar, state.views.length, state.ratio);
			(0, react.useEffect)(() => {
				const node = ref.current;
				const observer = new ResizeObserver(() => {
					const rect = node.getBoundingClientRect();
					setSize({
						width: rect.width,
						height: rect.height
					});
				});
				observer.observe(node);
				return () => observer.disconnect();
			}, []);
			const split = state.views.length > 1;
			const changeRatio = (clientX) => {
				const rect = ref.current?.getBoundingClientRect();
				if (rect && geometry.center > 5) model.ratio((clientX - rect.left) / (geometry.center - 5));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: workspace_module_css_default.workspace,
				ref,
				"data-dsh-isolated-workspace": "",
				children: [
					state.views.map((view, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Frame, {
						view,
						shell,
						left: index === 0 ? 0 : geometry.secondLeft,
						width: index === 0 ? geometry.first : geometry.second,
						total: size.width,
						height: size.height,
						sidebar: geometry.sidebar,
						active: view.id === state.active
					}, view.id)),
					split && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: workspace_module_css_default.focus,
						style: {
							left: state.views[0].id === state.active ? 0 : geometry.secondLeft,
							width: state.views[0].id === state.active ? geometry.first : geometry.second
						}
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						role: "separator",
						"aria-label": "调整主窗口宽度",
						"aria-orientation": "vertical",
						"aria-valuenow": Math.round(state.ratio * 100),
						"aria-valuemin": 20,
						"aria-valuemax": 80,
						tabIndex: 0,
						className: workspace_module_css_default.divider,
						style: { left: geometry.first },
						onKeyDown: (event) => {
							if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
								event.preventDefault();
								model.ratio(state.ratio + (event.key === "ArrowLeft" ? -.05 : .05));
							}
						},
						onPointerDown: (event) => {
							event.preventDefault();
							event.currentTarget.setPointerCapture(event.pointerId);
							setDragging(true);
						},
						onPointerMove: (event) => {
							if (dragging) changeRatio(event.clientX);
						},
						onPointerUp: (event) => {
							if (dragging) changeRatio(event.clientX);
							setDragging(false);
							event.currentTarget.releasePointerCapture(event.pointerId);
						},
						onPointerCancel: () => setDragging(false),
						onLostPointerCapture: () => setDragging(false)
					})] }),
					dragging && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: workspace_module_css_default.dragShield }),
					active.sessionId === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: workspace_module_css_default.blankControl,
						type: "button",
						style: { left: (state.views[0].id === active.id ? geometry.first : geometry.secondLeft + geometry.second) - 40 },
						"aria-label": split ? "关闭空白主窗口" : "添加主窗口",
						title: split ? "关闭空白主窗口" : "添加主窗口",
						onClick: () => split ? shell.close(active.id) : shell.add(),
						children: split ? "×" : "＋"
					})
				]
			});
		}
		//#endregion
		//#region src/client/isolated/surface.tsx
		/** Retain frame documents even while the shell temporarily shows another panel. */
		function installSurface(ctx, model, shell) {
			const surface = document.createElement("div");
			surface.dataset.dshMainViewSurface = "";
			Object.assign(surface.style, {
				position: "fixed",
				display: "none",
				zIndex: "2"
			});
			document.body.append(surface);
			const root = (0, react_dom_client.createRoot)(surface);
			root.render(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Workspace, {
				model,
				shell
			}));
			ctx.effect(() => () => {
				root.unmount();
				surface.remove();
			}, "independent-views: persistent frame documents");
			function Anchor() {
				const ref = (0, react.useRef)(null);
				(0, react.useLayoutEffect)(() => {
					const node = ref.current;
					let frame = 0;
					const measure = () => {
						frame = 0;
						const rect = node.getBoundingClientRect();
						Object.assign(surface.style, {
							display: "block",
							left: `${rect.left}px`,
							top: `${rect.top}px`,
							width: `${rect.width}px`,
							height: `${rect.height}px`
						});
					};
					const schedule = () => {
						if (!frame) frame = requestAnimationFrame(measure);
					};
					const observer = new ResizeObserver(schedule);
					observer.observe(node);
					window.addEventListener("resize", schedule);
					window.addEventListener("scroll", schedule, true);
					measure();
					return () => {
						observer.disconnect();
						cancelAnimationFrame(frame);
						window.removeEventListener("resize", schedule);
						window.removeEventListener("scroll", schedule, true);
						surface.style.display = "none";
					};
				}, []);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref,
					style: {
						flex: 1,
						minWidth: 0,
						minHeight: 0,
						height: "100%"
					},
					"data-dsh-main-view-anchor": ""
				});
			}
			ctx.slots.register({
				name: "main",
				key: "conversation",
				priority: -1
			}, Anchor);
		}
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots", "sessions"];
		/** Each child loads the ordinary application in its own JS realm and document. */
		function apply(ctx) {
			const identity = childIdentity(new URL(window.location.href));
			if (window.parent !== window) {
				if (identity) installChild(ctx, identity);
				return;
			}
			const sessions = ctx.get("sessions");
			const model = createViewModel(sessions.list.getSnapshot().current ?? null);
			const shell = createShell(sessions, model);
			ctx.effect(() => () => shell.dispose(), "independent-views: shell channel");
			ctx.effect(() => installLayout("shell"), "independent-views: outer layout");
			installSurface(ctx, model, shell);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
