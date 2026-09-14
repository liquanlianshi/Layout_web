#!/usr/bin/env node
/* ============================================================
   tools/probe.mjs — 零依赖的无头 Chrome 验证脚本
   用 CDP + Node 内置 WebSocket 打开页面，收集 JS 错误、
   检查 iframe 可访问性、并对每个演示截图。
   用法: node tools/probe.mjs [pagePath...]
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = resolve(process.cwd());
const PORT = 9333 + Math.floor(Math.random() * 200);
const OUT = join(ROOT, 'tools', 'shots');
mkdirSync(OUT, { recursive: true });

const userDir = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDir}`,
  '--no-first-run', '--no-default-browser-check',
  '--no-sandbox', '--disable-dev-shm-usage',
  '--allow-file-access-from-files',
  '--hide-scrollbars',
  '--window-size=1440,1000',
  '--disable-gpu',
  'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeErr = '';
chrome.stderr.on('data', d => { chromeErr += d.toString(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* keep waiting */ }
    await sleep(200);
  }
  throw new Error('Chrome did not expose CDP.\n' + chromeErr.slice(-800));
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.waiting = new Map(); this.events = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.waiting.has(msg.id)) {
        const { res, rej } = this.waiting.get(msg.id);
        this.waiting.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.waiting.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
      setTimeout(() => {
        if (this.waiting.has(id)) { this.waiting.delete(id); rej(new Error('timeout: ' + method)); }
      }, 30000);
    });
  }
}

const pages = process.argv.slice(2).filter(a => !a.startsWith('--'));
const targets = pages.length ? pages : ['index.html'];

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
const cdp = new CDP(ws);

let failures = 0;
const report = [];

for (const rel of targets) {
  /* 支持直接传 http(s):// 地址，便于验证已部署的站点 */
  const url = /^https?:\/\//.test(rel) ? rel : 'file://' + join(ROOT, rel);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const consoleErrors = [];
  const send = (m, p) => cdp.send(m, p, sessionId);

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  // 收集 console / 异常
  const poll = setInterval(() => {
    while (cdp.events.length) {
      const e = cdp.events.shift();
      if (e.method === 'Runtime.exceptionThrown') {
        consoleErrors.push('EXCEPTION: ' + (e.params.exceptionDetails?.exception?.description
          || e.params.exceptionDetails?.text || '?').split('\n')[0]);
      } else if (e.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(e.params.type)) {
        consoleErrors.push(e.params.type.toUpperCase() + ': ' +
          e.params.args.map(a => a.value ?? a.description ?? a.type).join(' ').slice(0, 220));
      } else if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
        consoleErrors.push('LOG: ' + String(e.params.entry.text).slice(0, 220));
      }
    }
  }, 60);

  await send('Page.navigate', { url });
  await sleep(1800);

  const probe = await send('Runtime.evaluate', {
    expression: `(() => {
      const out = { lang: document.documentElement.lang, title: document.title };
      out.demoCount = document.querySelectorAll('.demo-mount').length;
      out.missingI18n = [...document.querySelectorAll('[data-i18n]')]
        .filter(e => !e.textContent.trim()).length;
      // 逐个激活章节的演示 tab 并检查挂载结果
      out.demos = [];
      const mounts = [...document.querySelectorAll('.demo-mount')];
      // iframe file:// contentDocument 可访问性测试
      try {
        const f = document.createElement('iframe');
        f.style.cssText='position:fixed;left:-9999px;width:300px;height:150px';
        f.srcdoc = '<!DOCTYPE html><html><head><style>body{background:rgb(1,2,3)}</style></head><body><p id="x">hi</p></body></html>';
        document.body.appendChild(f);
        out.iframeTest = 'pending';
      } catch (e) { out.iframeTest = 'throw:' + e.message; }
      return JSON.stringify(out);
    })()`,
    awaitPromise: false, returnByValue: true
  });

  await sleep(900);
  const iframeProbe = await send('Runtime.evaluate', {
    expression: `(() => {
      const f = [...document.querySelectorAll('iframe')].pop();
      if (!f) return 'no-iframe';
      try {
        const d = f.contentDocument;
        if (!d) return 'contentDocument=null';
        const bg = d.defaultView.getComputedStyle(d.body).backgroundColor;
        return 'ok bg=' + bg + ' hasP=' + !!d.querySelector('#x');
      } catch (e) { return 'throw:' + e.message; }
    })()`,
    returnByValue: true
  });

  const name = rel.replace(/[\/\\]/g, '_').replace(/\.html?$/, '') || 'index';
  // 逐个「像用户那样」切换到演示 tab，再挂载并测量
  const demoRun = await send('Runtime.evaluate', {
    expression: `(async () => {
      const res = [];
      const mounts = [...document.querySelectorAll('.demo-mount')];
      for (const m of mounts) {
        const id = m.getAttribute('data-demo');
        // 1. 切换所属章节到「演示」tab（用户真实操作路径）
        const panel = m.closest('.tab-panel');
        const group = panel && panel.closest('.tab-panels');
        const host = group && group.closest('.chapter');
        if (host) {
          const btn = host.querySelector('.tab-btn[data-tab="demo"]');
          if (btn) btn.click();
        }
        await new Promise(r => setTimeout(r, 700));   // 等动画与 iframe 加载
        // 2. 挂载（未挂载过则挂载；挂载过则触发一次重测）
        if (!m.dataset.booted) {
          try { window.LAYOUT_DEMOS.mount(m); } catch (e) { res.push({ id, ok:false, note:'THROW ' + e.message }); continue; }
        }
        await new Promise(r => setTimeout(r, 800));
        const err = m.querySelector('p[style*="f87171"]');
        const frames = m.querySelectorAll('iframe');
        const meas = m.querySelector('.measure');
        const cssOut = m.querySelector('.live-css');
        const ctls = m.querySelectorAll('.demo-controls input, .demo-controls select, .demo-controls button');
        const measText = meas ? meas.textContent.replace(/\\s+/g, ' ').trim() : '';
        let frameInfo = 'n/a';
        if (frames.length) {
          const f = frames[frames.length-1];
          try {
            const d = f.contentDocument;
            frameInfo = d && d.body ? ('body-children=' + d.body.children.length +
              (d.body.children.length ? '' : ' EMPTY!')) : 'no-doc';
          } catch(e) { frameInfo = 'CROSS-ORIGIN'; }
        }
        res.push({ id, ok: !err, note: err ? err.textContent.slice(0,150) : '',
                   frames: frames.length, frameInfo,
                   ctls: ctls.length,
                   measLen: measText.length,
                   measSnip: measText.slice(0, 130),
                   cssLen: cssOut ? cssOut.innerHTML.length : 0 });
      }
      return JSON.stringify(res);
    })()`,
    awaitPromise: true, returnByValue: true
  });

  // 可选：切到英文版，便于人工审阅双语一致性
  if (process.env.PROBE_LANG === 'en' || process.env.PROBE_LANG === 'zh') {
    /* 直接切换并确认，纯粹为了人工审阅截图 */
    const want = process.env.PROBE_LANG === 'en' ? 'en-US' : 'zh-CN';
    await send('Runtime.evaluate', { expression:
      `document.querySelector('.lang-switch button[data-set-lang="${want}"]').click()` });
    await sleep(600);
    const w = await send('Runtime.evaluate', { expression: `document.documentElement.lang` });
    console.log('  [lang] ' + w.result.value);
  }
  // 可选：切到演示 tab 并滚动到第一个演示，便于人工审阅
  if (process.env.PROBE_TAB === 'demo') {
    await send('Runtime.evaluate', { expression: `(() => {
      const m = document.querySelector('.demo-mount');
      if (!m) return;
      const host = m.closest('.chapter');
      const btn = host && host.querySelector('.tab-btn[data-tab="demo"]');
      if (btn) btn.click();
      /* 手动按吸顶栏高度偏移，scrollIntoView 不认 scroll-padding-top */
      if (host) {
        const y = host.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()` });
    await sleep(1400);
  }
  // 截图
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: process.env.PROBE_FULL === '1'
  });
  if (process.env.PROBE_FULL === '1') {
    const m = await send('Page.getLayoutMetrics');
    const h = Math.min(9000, Math.ceil(m.cssContentSize.height));
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(400);
    const shot2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(OUT, name + '-full.png'), Buffer.from(shot2.data, 'base64'));
    await send('Emulation.clearDeviceMetricsOverride');
  }
  writeFileSync(join(OUT, name + '.png'), Buffer.from(shot.data, 'base64'));

  clearInterval(poll);
  const demos = JSON.parse(demoRun.result.value || '[]');
  const bad = demos.filter(d => !d.ok);
  if (consoleErrors.length) failures++;
  if (bad.length) failures++;
  report.push({ page: rel, iframe: iframeProbe.result.value, demos, errors: consoleErrors, shot: name + '.png' });
  await cdp.send('Target.closeTarget', { targetId });
}

ws.close();
chrome.kill();
try { rmSync(userDir, { recursive: true, force: true }); } catch {}

console.log('\n================ VERIFICATION REPORT ================');
for (const r of report) {
  console.log('\n■ ' + r.page + '   [screenshot: tools/shots/' + r.shot + ']');
  console.log('  iframe access : ' + r.iframe);
  console.log('  demos         : ' + r.demos.length);
  for (const d of r.demos) {
    console.log('   ' + (d.ok ? '✓' : '✗') + ' ' + d.id.padEnd(14) +
      ' 控件=' + String(d.ctls).padStart(3) +
      ' 读数=' + String(d.measLen).padStart(4) + '字' +
      ' CSS回显=' + String(d.cssLen).padStart(4) +
      ' frames=' + d.frames + ' ' + d.frameInfo +
      (d.note ? '  → ' + d.note : ''));
    if (d.measSnip) console.log('       · ' + d.measSnip);
  }
  if (r.errors.length) {
    console.log('  JS ERRORS:');
    [...new Set(r.errors)].slice(0, 14).forEach(e => console.log('   ! ' + e));
  } else console.log('  JS errors     : none');
}
console.log('\n====================================================');
console.log(failures ? `RESULT: ${failures} problem group(s) found` : 'RESULT: all clean');
process.exit(0);
