// Cliente mínimo del protocolo DevTools de Chrome, sin dependencias.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9347;

export class Page {
  private id = 0;
  private pending = new Map<number, (value: Record<string, unknown>) => void>();
  private socket: WebSocket;
  base = "http://127.0.0.1:4173/";
  private listener: ((method: string, params: unknown) => void) | null = null;
  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(String(event.data)) as { id?: number; result?: Record<string, unknown>; error?: unknown; method?: string; params?: unknown };
      if (data.id === undefined) {
        if (data.method !== undefined) this.listener?.(data.method, data.params);
        return;
      }
      if (data.error !== undefined) throw new Error(JSON.stringify(data.error));
      this.pending.get(data.id)?.(data.result ?? {});
    });
  }
  static async open(url: string): Promise<Page> {
    const socket = new WebSocket(url);
    await new Promise((resolve) => socket.addEventListener("open", resolve));
    return new Page(socket);
  }
  onEvent(listener: (method: string, params: unknown) => void) {
    this.listener = listener;
  }
  send(method: string, params: Record<string, unknown> = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise<Record<string, unknown>>((resolve) => this.pending.set(id, resolve));
  }
  async evaluate(expression: string): Promise<unknown> {
    const out = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    const details = out.exceptionDetails as { exception?: { description?: string } } | undefined;
    if (details !== undefined) throw new Error(details.exception?.description ?? "evaluate");
    return (out.result as { value?: unknown }).value;
  }
  async viewport(width: number, height: number, mobile: boolean) {
    await this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  }
  async go(hash: string) {
    await this.send("Page.navigate", { url: `${this.base}#/${hash}` });
    await this.wait(250);
    await this.send("Page.reload");
    await this.wait(1400);
  }
  wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export async function withChrome(run: (page: Page) => Promise<void>): Promise<void> {
  const profile = mkdtempSync(join(tmpdir(), "radar-chrome-"));
  const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--headless=new", "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  try {
    let target: { webSocketDebuggerUrl: string } | undefined;
    for (let i = 0; i < 40 && target === undefined; i++) {
      await new Promise((r) => setTimeout(r, 250));
      target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
        .then((r) => r.json() as Promise<{ webSocketDebuggerUrl: string }>)
        .catch(() => undefined);
    }
    if (target === undefined) throw new Error("Chrome no responde");
    const page = await Page.open(target.webSocketDebuggerUrl);
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await run(page);
  } finally {
    chrome.kill();
    await new Promise((r) => setTimeout(r, 400));
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
