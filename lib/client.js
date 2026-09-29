window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-split-panes",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom_client = require("react-dom/client");
		//#region src/client/isolated/navigation.ts
		/** Adapt the 0.2 catalog + public UI navigation to the view coordinator. */
		function adaptSessions(ctx) {
			const catalog = ctx.get("sessions");
			const navigation = ctx.get("uiWorkspace");
			return {
				list: {
					getSnapshot() {
						const snapshot = catalog.list.getSnapshot();
						const current = Object.entries(snapshot.byId ?? {}).find(([, row]) => (row.retainedBy?.mainView ?? 0) > 0)?.[0];
						return {
							...snapshot,
							...current === void 0 ? {} : { current }
						};
					},
					subscribe: (fn) => catalog.list.subscribe(fn)
				},
				open: (id) => navigation.openSession(id),
				clear: () => {},
				refresh: () => catalog.refresh()
			};
		}
		//#endregion
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
		function clipRegions(left, width, height, total, sidebar, bottom = 0) {
			const rect = (x, w, y = 0, h = height - bottom) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
			return `path("${rect(left, width)}${sidebar > 0 ? rect(total - sidebar, sidebar, 0, height) : ""}${bottom > 0 ? rect(0, total - sidebar, height - bottom, bottom) : ""}")`;
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
		const css = ".qen7la_workspace{flex:1;min-width:0;height:100%;min-height:0;position:relative;overflow:hidden}.qen7la_frame{background:var(--dsw-alias-bg-base);border:0;width:100%;height:100%;position:absolute;inset:0}.qen7la_focus{box-sizing:border-box;pointer-events:none;z-index:4;border:1px solid #111;position:absolute;top:0;bottom:0}.qen7la_divider{cursor:col-resize;touch-action:none;z-index:6;width:5px;position:absolute;top:0;bottom:0}.qen7la_divider:after{content:\"\";background:var(--dsw-alias-border-l2);width:1px;position:absolute;top:0;bottom:0;left:2px}.qen7la_divider:focus-visible{outline:1px solid var(--dsw-alias-label-primary)}.qen7la_dragShield{z-index:5;cursor:col-resize;position:absolute;inset:0}.qen7la_loading{color:var(--dsw-alias-label-secondary);z-index:3;background:var(--dsw-alias-bg-base);place-items:center;display:grid;position:absolute;top:0;bottom:0}.qen7la_error{box-sizing:border-box;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);z-index:7;padding:12px;position:absolute;bottom:12px}.qen7la_blankControl{z-index:7;cursor:pointer;background:var(--dsw-alias-bg-base);width:28px;height:28px;color:var(--dsw-alias-label-primary);border:0;border-radius:50%;font-size:20px;position:absolute;top:12px}.qen7la_controls{padding:16px}.qen7la_controlRow{justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;display:flex}.qen7la_circle{background:var(--dsw-alias-bg-l2,#f3f3f3);width:28px;height:28px;color:inherit;cursor:pointer;border:0;border-radius:50%;padding:0;font-size:20px}.qen7la_circle:hover:not(:disabled){background:#e6e6e6}.qen7la_circle:disabled{opacity:.35;cursor:default}.qen7la_viewChoice{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:8px 10px}.qen7la_viewChoice[aria-pressed=true]{background:var(--dsw-alias-bg-l2,#f0f0f0)}.qen7la_canvas{position:absolute;inset:38px 0 0;overflow:hidden}.qen7la_chromeToolbar{border-bottom:1px solid var(--dsw-alias-border-main,#eee);background:var(--dsw-alias-bg-base,#fff);box-sizing:border-box;z-index:9;justify-content:flex-end;align-items:center;gap:4px;height:38px;padding:0 10px;display:flex;position:absolute;top:0;left:0;right:0}.qen7la_chromeToolbar button{width:28px;height:28px;color:var(--dsw-alias-label-secondary,#666);cursor:pointer;background:0 0;border:0;border-radius:6px;place-items:center;padding:0;display:grid}.qen7la_chromeToolbar button:hover,.qen7la_chromeToolbar button[aria-pressed=true]{background:var(--dsw-alias-bg-l2,#eee);color:var(--dsw-alias-label-primary,#111)}.qen7la_chromeToolbar button:focus-visible{outline-offset:1px;outline:2px solid}.qen7la_sidebarResize{z-index:8;cursor:col-resize;touch-action:none;width:6px;position:absolute;top:0;bottom:0}.qen7la_bottomResize{z-index:8;cursor:row-resize;touch-action:none;height:6px;position:absolute;left:0}.qen7la_sidebarResize:hover,.qen7la_bottomResize:hover{background:var(--dsw-alias-border-l2,#ccc)}.qen7la_sidebarResize:focus-visible,.qen7la_bottomResize:focus-visible{outline:1px solid}.qen7la_emptySidebar{z-index:3;background:var(--dsw-alias-bg-base,#fff);border-left:1px solid var(--dsw-alias-border-l2,#ddd);box-sizing:border-box;position:absolute;top:0;bottom:0;right:0}.qen7la_emptyBottom{z-index:3;background:var(--dsw-alias-bg-base,#fff);border-top:1px solid var(--dsw-alias-border-l2,#ddd);box-sizing:border-box;position:absolute;bottom:0;left:0}.qen7la_emptyHint{color:var(--dsw-alias-label-secondary,#666);margin:0;padding:16px;font-size:13px}";
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
			"bottomResize": "qen7la_bottomResize",
			"canvas": "qen7la_canvas",
			"chromeToolbar": "qen7la_chromeToolbar",
			"circle": "qen7la_circle",
			"controlRow": "qen7la_controlRow",
			"controls": "qen7la_controls",
			"divider": "qen7la_divider",
			"dragShield": "qen7la_dragShield",
			"emptyBottom": "qen7la_emptyBottom",
			"emptyHint": "qen7la_emptyHint",
			"emptySidebar": "qen7la_emptySidebar",
			"error": "qen7la_error",
			"focus": "qen7la_focus",
			"frame": "qen7la_frame",
			"loading": "qen7la_loading",
			"sidebarResize": "qen7la_sidebarResize",
			"viewChoice": "qen7la_viewChoice",
			"workspace": "qen7la_workspace"
		};
		//#endregion
		//#region src/client/isolated/sidebar-chrome.ts
		/** Visibility adapter only: original button callbacks own the sidebar store and all tab content. */
		function bindSidebarChrome(sidebar, report, doc = document, schedule = requestAnimationFrame, cancel = cancelAnimationFrame, native) {
			let desired = null, revision = -1, active = false, disposed = false, pending = 0;
			let baseline = null, session;
			let nativeClick = false, awaitingControls = true, focusPending = false;
			let userIntent = null;
			const read = () => {
				const snapshot = sidebar.getSnapshot(), state = snapshot.state;
				return state ? {
					sessionId: native?.mounted.getSnapshot() ?? snapshot.sessionId ?? null,
					value: {
						panelOpen: native?.isExpanded() ?? state.panelOpen === true,
						bottomOpen: state.bottomOpen === true,
						width: state.width ?? 460,
						bottomHeight: state.bottomHeight ?? 280
					}
				} : null;
			};
			const enqueue = () => {
				if (!disposed && !pending) pending = schedule(reconcile);
			};
			const reconcile = () => {
				pending = 0;
				if (disposed || !desired || focusPending) return;
				const current = read();
				if (!current) {
					baseline = null;
					session = void 0;
					return;
				}
				session = current.sessionId;
				baseline = current.value;
				const buttons = [...doc.querySelectorAll("[data-dsh-toggle-cluster] button")];
				const rightMismatch = current.value.panelOpen !== desired.panelOpen;
				const bottomMismatch = current.value.bottomOpen !== desired.bottomOpen;
				awaitingControls = rightMismatch || bottomMismatch;
				if (!awaitingControls) return;
				if (rightMismatch && native && native.mounted.getSnapshot()) {
					nativeClick = true;
					try {
						native.toggleExpanded();
					} finally {
						nativeClick = false;
					}
					enqueue();
					return;
				}
				const button = native ? doc.querySelector("[data-dsh-bottom-toggle]") : rightMismatch ? buttons.at(-1) : buttons.length > 1 ? buttons[0] : void 0;
				if (button && button.getAttribute("aria-disabled") !== "true") {
					nativeClick = true;
					try {
						button.click();
					} finally {
						nativeClick = false;
					}
					enqueue();
				}
			};
			const changed = () => {
				const current = read();
				if (!current || !desired) {
					baseline = null;
					session = void 0;
					return;
				}
				const previous = baseline, changedSession = current.sessionId !== session;
				baseline = current.value;
				session = current.sessionId;
				if (nativeClick) return;
				if (changedSession || !previous) {
					enqueue();
					return;
				}
				const change = {};
				if (current.value.panelOpen !== previous.panelOpen) change.panelOpen = current.value.panelOpen;
				if (current.value.bottomOpen !== previous.bottomOpen) change.bottomOpen = current.value.bottomOpen;
				if (focusPending) {
					if (Object.keys(change).length) userIntent = {
						...userIntent,
						...change
					};
					return;
				}
				if (!active) {
					enqueue();
					return;
				}
				const next = {
					...desired,
					...change
				};
				if (JSON.stringify(next) !== JSON.stringify(desired)) {
					desired = next;
					report(next, revision, current.sessionId);
				}
			};
			const unlisten = sidebar.subscribeState(changed);
			const unmount = native?.mounted.subscribe(changed);
			const observer = new MutationObserver(() => {
				changed();
				if (awaitingControls) enqueue();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-rightbar-collapsed"]
			});
			return {
				focus() {
					if (active || focusPending) return;
					focusPending = true;
					const current = read();
					baseline = current?.value ?? null;
					session = current?.sessionId;
				},
				apply(value, nextRevision, selected) {
					if (nextRevision < revision) return;
					const same = nextRevision === revision && selected === active && JSON.stringify(value) === JSON.stringify(desired);
					desired = { ...value };
					revision = nextRevision;
					active = selected;
					if (selected && focusPending) {
						focusPending = false;
						if (userIntent) {
							const next = {
								...desired,
								...userIntent
							};
							userIntent = null;
							desired = next;
							report(next, revision, read()?.sessionId ?? null);
						}
					}
					if (!same) enqueue();
				},
				dispose() {
					disposed = true;
					unlisten();
					unmount?.();
					observer.disconnect();
					cancel(pending);
				}
			};
		}
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
    body[data-mv-mode="child"] [data-side="sidebar"],
    body[data-mv-mode="child"] [data-side="rightbar"] { display:none!important }
    body[data-mv-mode="child"] [data-mv-frame] { display:block!important }
    body[data-mv-mode="child"] [data-mv-center] {
      position:fixed!important; top:0!important; bottom:var(--mv-bottom,0px)!important;
      left:var(--mv-left,0px)!important; width:var(--mv-width,100%)!important;
      margin:0!important; min-height:0!important; overflow:hidden!important;
    }
    body[data-mv-mode="child"] [data-rightbar-col] { position:fixed!important;right:0!important;top:0!important;bottom:0!important;width:var(--mv-sidebar,0px)!important;z-index:110!important;overflow:hidden!important }
    body[data-mv-mode="child"][data-mv-inactive] [data-rightbar-col] { visibility:hidden!important;pointer-events:none!important }
    body[data-mv-mode="child"] [data-dsh-bottom-toggle] { display:none!important }
    [data-mv-blank-prompt] {display:none}
    body[data-mv-blank] [data-mv-center] {visibility:hidden!important}
    body[data-mv-blank] [data-mv-blank-prompt] {position:fixed;left:var(--mv-left,0px);width:var(--mv-width,100%);top:40%;display:grid;justify-content:center}
    body[data-mv-mode="child"] [data-dsh-panel]:not([data-dsh-bottom-panel]) { width:var(--mv-sidebar,0px)!important; max-width:var(--mv-sidebar,0px)!important; bottom:0!important; }
    body[data-mv-mode="child"] [data-dsh-bottom-panel] { left:0!important; width:calc(100% - var(--mv-sidebar,0px))!important; height:var(--mv-bottom,0px)!important; max-height:var(--mv-bottom,0px)!important; }
    body[data-mv-mode="child"] [data-dsh-toggle-cluster] { display:none!important }
    body[data-mv-mode="child"] [data-dsh-panel-host] { z-index:110!important }
    body[data-mv-mode="child"] [data-mv-external-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] { left:var(--mv-left,0px)!important; right:auto!important; width:var(--mv-width,100%)!important; box-sizing:border-box!important }
    body[data-mv-mode="child"] [data-mv-dialog-layer] [role="dialog"] { max-width:calc(100% - 24px)!important; box-sizing:border-box!important }
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
				delete body.dataset.mvBlank;
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
					"--mv-bottom",
					"--mv-toggle-right"
				]) body.style.removeProperty(name);
			};
		}
		//#endregion
		//#region src/client/isolated/child.tsx
		function installChild(ctx, identity) {
			const sessions = adaptSessions(ctx);
			const origin = window.location.origin;
			const notify = (body) => window.parent.postMessage(envelope(identity, body), origin);
			let chromeBinding;
			let chromeCommand;
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
				if (body.type === "sidebar-chrome") {
					if (!Number.isSafeInteger(body.revision) || !body.value || typeof body.value.panelOpen !== "boolean" || typeof body.value.bottomOpen !== "boolean" || ![body.value.width, body.value.bottomHeight].every(Number.isFinite)) return;
					chromeCommand = body;
					chromeBinding?.apply(body.value, body.revision, body.active);
				} else if (body.type === "geometry") {
					const { left, width, sidebar, bottom = 0, active } = body.value;
					if (![
						left,
						width,
						sidebar,
						bottom
					].every((n) => Number.isFinite(n) && n >= 0)) return;
					const style = document.body.style;
					style.setProperty("--mv-left", `${left}px`);
					style.setProperty("--mv-width", `${width}px`);
					style.setProperty("--mv-sidebar", `${sidebar}px`);
					style.setProperty("--mv-bottom", `${bottom}px`);
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
						document.body.toggleAttribute("data-mv-blank", body.sessionId === null);
						if (body.sessionId !== null) sessions.open(body.sessionId);
						revision = body.revision;
						initialized = body.sessionId !== null;
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
				const focus = () => {
					chromeBinding?.focus();
					notify({ type: "focus" });
				};
				window.addEventListener("message", receive);
				const unwatchFocus = observeViewFocus(document, focus);
				const blank = document.createElement("div");
				blank.dataset.mvBlankPrompt = "";
				const hint = document.createElement("p");
				hint.textContent = "从左侧选择会话，或新建会话。";
				const start = document.createElement("button");
				start.textContent = "新建会话";
				start.onclick = () => {
					initialized = true;
					previous = sessions.list.getSnapshot().current ?? null;
					document.body.removeAttribute("data-mv-blank");
					ctx.get("uiWorkspace").startSession();
				};
				blank.append(hint, start);
				document.body.append(blank);
				const unsubscribe = sessions.list.subscribe(publish);
				notify({ type: "ready" });
				return () => {
					blank.remove();
					disposed = true;
					unsubscribe();
					window.removeEventListener("message", receive);
					unwatchFocus();
				};
			}, "independent-views: child channel");
			ctx.inject(["betterSidebar", "sidebarRight"], (childCtx) => {
				const sidebar = childCtx.get("betterSidebar");
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
					chromeBinding = bindSidebarChrome(sidebar, (value, revision, sessionId) => notify({
						type: "sidebar",
						value,
						revision,
						sessionId
					}), document, requestAnimationFrame, cancelAnimationFrame, childCtx.get("sidebarRight"));
					if (chromeCommand) chromeBinding.apply(chromeCommand.value, chromeCommand.revision, chromeCommand.active);
					const unregister = sidebar.registerTab({
						id: "independent-main-views",
						title: "主窗口",
						single: true,
						order: 15,
						component: ViewControls
					});
					return () => {
						chromeBinding?.dispose();
						chromeBinding = void 0;
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
				ready: false,
				error: null
			});
			const first = make(initial);
			let state = {
				views: [first],
				active: first.id,
				ratio: .5,
				chrome: {
					panelOpen: false,
					bottomOpen: false,
					width: 460,
					bottomHeight: 280
				},
				chromeRevision: 0
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
						active: view.id,
						chromeRevision: state.chromeRevision + 1
					});
				},
				close(id) {
					if (state.views.length === 1 || !state.views.some((v) => v.id === id)) return;
					const views = state.views.filter((v) => v.id !== id);
					update({
						...state,
						views,
						active: state.active === id ? views[0].id : state.active,
						chromeRevision: state.chromeRevision + 1
					});
				},
				focus(id) {
					if (state.active !== id && state.views.some((v) => v.id === id)) update({
						...state,
						active: id,
						chromeRevision: state.chromeRevision + 1
					});
				},
				chrome(value) {
					const chrome = {
						...state.chrome,
						...value
					};
					if (JSON.stringify(chrome) !== JSON.stringify(state.chrome)) update({
						...state,
						chrome,
						chromeRevision: state.chromeRevision + 1
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
					update({
						...state,
						chromeRevision: state.chromeRevision + 1,
						views: state.views.map((view) => view.id === active.id ? {
							...view,
							sessionId,
							revision: view.revision + 1,
							error: null
						} : view)
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
					lastSelection = selected ?? sessions.list.getSnapshot().current ?? null;
					mirroring = true;
					try {
						if (selected !== null && sessions.list.getSnapshot().current !== selected) sessions.open(selected);
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
						type: "sidebar-chrome",
						value: state.chrome,
						revision: state.chromeRevision,
						active: view.id === state.active
					}), host.location.origin);
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
					case "sidebar": {
						const state = model.getSnapshot(), value = body.value;
						if (view.id !== state.active || body.revision !== state.chromeRevision || body.sessionId !== view.sessionId) break;
						if (!value || typeof value.panelOpen !== "boolean" || typeof value.bottomOpen !== "boolean" || !Number.isFinite(value.width) || !Number.isFinite(value.bottomHeight) || value.width < 0 || value.bottomHeight < 0) break;
						model.chrome({
							...value,
							width: Math.max(240, Math.min(1600, value.width)),
							bottomHeight: Math.max(120, Math.min(1e3, value.bottomHeight))
						});
						break;
					}
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
				toggleSidebar(kind) {
					const value = model.getSnapshot().chrome;
					model.chrome(kind === "right" ? { panelOpen: !value.panelOpen } : { bottomOpen: !value.bottomOpen });
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
		function Frame({ view, shell, left, width, total, height, sidebar, bottom, active }) {
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
					bottom,
					active
				});
			}, [
				shell,
				view.id,
				view.ready,
				left,
				width,
				sidebar,
				bottom,
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
						clipPath: clipRegions(left, width, height, total, active ? sidebar : 0, active ? bottom : 0),
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
			const [chromeDrag, setChromeDrag] = (0, react.useState)(null);
			const active = state.views.find((v) => v.id === state.active);
			const geometry = viewGeometry(size.width, state.chrome.panelOpen ? state.chrome.width : 0, state.views.length, state.ratio);
			const bottom = state.chrome.bottomOpen ? Math.min(state.chrome.bottomHeight, size.height * .55) : 0;
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
				"data-dsh-isolated-workspace": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: workspace_module_css_default.chromeToolbar,
					"data-main-view-sidebar-controls": "",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": state.chrome.bottomOpen ? "收起底部栏" : "展开底部栏",
						"aria-pressed": state.chrome.bottomOpen,
						title: state.chrome.bottomOpen ? "收起底部栏" : "展开底部栏",
						onClick: () => shell.toggleSidebar("bottom"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							width: "18",
							height: "18",
							viewBox: "0 0 18 18",
							fill: "none",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
								x: "2.25",
								y: "2.25",
								width: "13.5",
								height: "13.5",
								rx: "2",
								stroke: "currentColor",
								strokeWidth: "1.4"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M3 11.5h12",
								stroke: "currentColor",
								strokeWidth: "1.4"
							})]
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": state.chrome.panelOpen ? "收起右侧栏" : "展开右侧栏",
						"aria-pressed": state.chrome.panelOpen,
						title: state.chrome.panelOpen ? "收起右侧栏" : "展开右侧栏",
						onClick: () => shell.toggleSidebar("right"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							width: "18",
							height: "18",
							viewBox: "0 0 18 18",
							fill: "none",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
								x: "2.25",
								y: "2.25",
								width: "13.5",
								height: "13.5",
								rx: "2",
								stroke: "currentColor",
								strokeWidth: "1.4"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M11.5 3v12",
								stroke: "currentColor",
								strokeWidth: "1.4"
							})]
						})
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: workspace_module_css_default.canvas,
					ref,
					children: [
						state.views.map((view, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Frame, {
							view,
							shell,
							left: index === 0 ? 0 : geometry.secondLeft,
							width: index === 0 ? geometry.first : geometry.second,
							total: size.width,
							height: size.height,
							sidebar: geometry.sidebar,
							bottom,
							active: view.id === state.active
						}, view.id)),
						split && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: workspace_module_css_default.focus,
							style: {
								left: state.views[0].id === state.active ? 0 : geometry.secondLeft,
								width: state.views[0].id === state.active ? geometry.first : geometry.second,
								bottom
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
							style: {
								left: geometry.first,
								bottom
							},
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
						geometry.sidebar > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							role: "separator",
							"aria-label": "调整右侧栏宽度",
							"aria-orientation": "vertical",
							tabIndex: 0,
							"aria-valuenow": Math.round(geometry.sidebar),
							className: workspace_module_css_default.sidebarResize,
							style: { right: geometry.sidebar - 3 },
							onKeyDown: (e) => {
								if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
									e.preventDefault();
									model.chrome({ width: Math.max(240, geometry.sidebar + (e.key === "ArrowLeft" ? 20 : -20)) });
								}
							},
							onPointerDown: (e) => {
								e.preventDefault();
								e.currentTarget.setPointerCapture(e.pointerId);
								setChromeDrag("right");
							},
							onPointerMove: (e) => {
								if (chromeDrag === "right") {
									const r = ref.current.getBoundingClientRect();
									model.chrome({ width: Math.max(240, Math.min(r.width * .45, r.right - e.clientX)) });
								}
							},
							onPointerUp: (e) => {
								setChromeDrag(null);
								e.currentTarget.releasePointerCapture(e.pointerId);
							},
							onPointerCancel: () => setChromeDrag(null),
							onLostPointerCapture: () => setChromeDrag(null)
						}),
						bottom > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							role: "separator",
							"aria-label": "调整底部栏高度",
							"aria-orientation": "horizontal",
							tabIndex: 0,
							"aria-valuenow": Math.round(bottom),
							className: workspace_module_css_default.bottomResize,
							style: {
								bottom: bottom - 3,
								right: geometry.sidebar
							},
							onKeyDown: (e) => {
								if (["ArrowUp", "ArrowDown"].includes(e.key)) {
									e.preventDefault();
									model.chrome({ bottomHeight: Math.max(120, bottom + (e.key === "ArrowUp" ? 20 : -20)) });
								}
							},
							onPointerDown: (e) => {
								e.preventDefault();
								e.currentTarget.setPointerCapture(e.pointerId);
								setChromeDrag("bottom");
							},
							onPointerMove: (e) => {
								if (chromeDrag === "bottom") {
									const r = ref.current.getBoundingClientRect();
									model.chrome({ bottomHeight: Math.max(120, Math.min(r.height * .55, r.bottom - e.clientY)) });
								}
							},
							onPointerUp: (e) => {
								setChromeDrag(null);
								e.currentTarget.releasePointerCapture(e.pointerId);
							},
							onPointerCancel: () => setChromeDrag(null),
							onLostPointerCapture: () => setChromeDrag(null)
						}),
						(dragging || chromeDrag) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: workspace_module_css_default.dragShield,
							style: { cursor: chromeDrag === "bottom" ? "row-resize" : "col-resize" }
						}),
						active.sessionId === null && geometry.sidebar > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
							className: workspace_module_css_default.emptySidebar,
							style: { width: geometry.sidebar },
							"aria-label": "空白会话侧栏",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: workspace_module_css_default.emptyHint,
								children: "选择会话后显示侧栏内容"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: workspace_module_css_default.controls,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: workspace_module_css_default.controlRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "主窗口" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: workspace_module_css_default.circle,
										type: "button",
										"aria-label": "添加主窗口",
										disabled: split,
										onClick: () => shell.add(),
										children: "＋"
									})]
								}), state.views.map((view, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: workspace_module_css_default.controlRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										className: workspace_module_css_default.viewChoice,
										"aria-pressed": view.id === state.active,
										onClick: () => shell.focus(view.id),
										children: [
											"窗口 ",
											i + 1,
											view.sessionId === null ? " · 新会话" : ""
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: workspace_module_css_default.circle,
										"aria-label": `关闭窗口 ${i + 1}`,
										disabled: !split,
										onClick: () => shell.close(view.id),
										children: "×"
									})]
								}, view.id))]
							})]
						}),
						active.sessionId === null && bottom > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("aside", {
							className: workspace_module_css_default.emptyBottom,
							style: {
								height: bottom,
								right: geometry.sidebar
							},
							"aria-label": "空白会话底部栏",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: workspace_module_css_default.emptyHint,
								children: "选择会话后显示底部栏内容"
							})
						}),
						active.sessionId === null && !state.chrome.panelOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: workspace_module_css_default.blankControl,
							type: "button",
							style: { left: (state.views[0].id === active.id ? geometry.first : geometry.secondLeft + geometry.second) - 40 },
							"aria-label": split ? "关闭空白主窗口" : "添加主窗口",
							title: split ? "关闭空白主窗口" : "添加主窗口",
							onClick: () => split ? shell.close(active.id) : shell.add(),
							children: split ? "×" : "＋"
						})
					]
				})]
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
		const inject = [
			"slots",
			"sessions",
			"uiWorkspace"
		];
		/** Each child loads the ordinary application in its own JS realm and document. */
		function apply(ctx) {
			const identity = childIdentity(new URL(window.location.href));
			if (window.parent !== window) {
				if (identity) installChild(ctx, identity);
				return;
			}
			const sessions = adaptSessions(ctx);
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
