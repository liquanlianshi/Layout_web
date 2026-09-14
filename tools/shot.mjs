#!/usr/bin/env node
/* ============================================================
   tools/shot.mjs — 全页截图（用于人工审阅排版）
   用法: node tools/shot.mjs <page> [width] [--tab=demo] [--lang=en]
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';

const ROOT = resolve(process.cwd());
const args = process.argv.slice(2);
const page = args.find(a => !a.startsWith('--')) || 'index.html';
const width = Number(args.find(a => /^\d+$/.test(a))) || 1440;
const tabDemo = args.includes('--tab=demo');
const langEn = args.includes('--lang=en');

const OUT = join(ROOT, 'tools', 'shots');
mkdirSync(OUT, { recursive: true });

const PORT = 9980 + Math.floor(Math.random() * 60);
const dir = mkdtempSync(join(tmpdir(), 'shot-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
  '--no-first-run', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files',
  '--hide-scrollbars', `--window-size=${width},1000`, 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver = null;
for (let i = 0; i < 80; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch { await sleep(250); }
}
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  }
});
const send = (method, params = {}, s) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params, ...(s ? { sessionId: s } : {}) }));
  setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('timeout ' + method)); } }, 40000);
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
await sleep(500);
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Runtime.enable', {}, sessionId);
await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 }, sessionId);
await send('Page.navigate', { url: 'file://' + join(ROOT, page) }, sessionId);
await sleep(1900);

if (langEn) {
  await send('Runtime.evaluate', { expression: `document.querySelector('.lang-switch button[data-set-lang="en-US"]').click()` }, sessionId);
  await sleep(500);
}
if (tabDemo) {
  await send('Runtime.evaluate', {
    expression: `(() => { const m = document.querySelector('.demo-mount'); if (!m) return;
      const h = m.closest('.chapter'); h.querySelector('.tab-btn[data-tab="demo"]').click();
      if (!m.dataset.booted) window.LAYOUT_DEMOS.mount(m);
      window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 70); })()`
  }, sessionId);
  await sleep(1600);
}

const met = await send('Page.getLayoutMetrics', {}, sessionId);
const full = Math.min(9000, Math.ceil(met.cssContentSize.height));
await send('Emulation.setDeviceMetricsOverride', { width, height: full, deviceScaleFactor: 1, mobile: width < 500 }, sessionId);
await sleep(600);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
const name = (basename(page).replace(/\.html?$/, '') || 'index') +
  (page.includes('/') ? '-' + page.split('/')[0] : '') +
  (tabDemo ? '-demo' : '') + (langEn ? '-en' : '') + (width !== 1440 ? '-' + width : '');
writeFileSync(join(OUT, 'full-' + name + '.png'), Buffer.from(shot.data, 'base64'));
console.log(`saved tools/shots/full-${name}.png  (${width}×${full})`);

ws.close(); chrome.kill();
process.exit(0);
