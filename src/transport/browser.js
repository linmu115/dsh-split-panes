/** Self-contained classic bootstrap; injected before the child's application scripts. */
export function browserBootstrap() {
  const params = new URL(location.href).searchParams;
  if (parent === window || !params.get('dshMainView') || !params.get('dshViewChannel')) return;
  const Native = window.EventSource;
  class ViewEventSource extends EventTarget {
    static CONNECTING = 0; static OPEN = 1; static CLOSED = 2;
    CONNECTING = 0; OPEN = 1; CLOSED = 2;
    onopen = null; onmessage = null; onerror = null;
    #url; #credentials; #state = 0; #socket; #timer; #closed = false;
    #firstChunk = true; #eventSize = 0;
    #retry = 3000; #lastId = ''; #buffer = ''; #data = []; #event = '';
    constructor(input, options = {}) {
      super();
      const url = new URL(input, location.href);
      if (url.origin !== location.origin) return new Native(input, options);
      this.#url = url.href; this.#credentials = Boolean(options.withCredentials);
      this.#connect();
    }
    get url() { return this.#url; }
    get withCredentials() { return this.#credentials; }
    get readyState() { return this.#state; }
    #emit(event) {
      this.dispatchEvent(event);
      const handler = this['on' + event.type];
      if (typeof handler === 'function') {
        try { handler.call(this, event); } catch (error) { setTimeout(() => { throw error; }); }
      }
    }
    #connect() {
      if (this.#closed) return;
      this.#buffer = ''; this.#data = []; this.#event = ''; this.#firstChunk = true; this.#eventSize = 0;
      const endpoint = new URL('/dsh-split-panes/event-transport', location.origin);
      endpoint.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = this.#socket = new WebSocket(endpoint);
      socket.onopen = () => {
        const url = new URL(this.#url);
        socket.send(JSON.stringify({path: url.pathname + url.search, lastEventId: this.#lastId}));
      };
      socket.onmessage = event => {
        if (this.#closed || socket !== this.#socket) return;
        const frame = JSON.parse(event.data);
        if (frame.type === 'open') { this.#state = 1; this.#emit(new Event('open')); }
        if (frame.type === 'chunk') this.#parse(frame.text);
        if (frame.type === 'fatal') { this.close(); this.#emit(new Event('error')); }
      };
      socket.onerror = () => {}; // close owns one error notification and retry.
      socket.onclose = () => {
        if (this.#closed || socket !== this.#socket) return;
        this.#state = 0; this.#emit(new Event('error'));
        if (!this.#closed) this.#timer = setTimeout(() => this.#connect(), this.#retry);
      };
    }
    #parse(text) {
      if (this.#firstChunk && text.length) { this.#firstChunk = false; text = text.replace(/^\uFEFF/, ''); }
      this.#buffer += text;
      if (this.#buffer.length > 4 * 1024 * 1024) { this.close(); this.#emit(new Event('error')); return; }
      while (!this.#closed) {
        const end = this.#buffer.search(/[\r\n]/);
        if (end < 0 || (this.#buffer[end] === '\r' && end === this.#buffer.length - 1)) break;
        const line = this.#buffer.slice(0, end);
        const skip = this.#buffer[end] === '\r' && this.#buffer[end + 1] === '\n' ? 2 : 1;
        this.#buffer = this.#buffer.slice(end + skip);
        if (line === '') {
          if (this.#data.length) this.#emit(new MessageEvent(this.#event || 'message', {data:this.#data.join('\n'), lastEventId:this.#lastId, origin:new URL(this.#url).origin}));
          this.#data = []; this.#event = ''; this.#eventSize = 0; continue;
        }
        if (line[0] === ':') continue;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        let value = colon < 0 ? '' : line.slice(colon + 1);
        if (value[0] === ' ') value = value.slice(1);
        if (field === 'data') {
          this.#eventSize += value.length;
          if (this.#eventSize > 4 * 1024 * 1024) { this.close(); this.#emit(new Event('error')); return; }
          this.#data.push(value);
        }
        if (field === 'event') this.#event = value;
        if (field === 'id' && !value.includes('\0')) this.#lastId = value;
        if (field === 'retry' && /^\d+$/.test(value)) this.#retry = Math.min(Number(value), 2147483647);
      }
    }
    close() { this.#closed = true; this.#state = 2; clearTimeout(this.#timer); this.#socket?.close(); }
  }
  window.EventSource = ViewEventSource;
}
