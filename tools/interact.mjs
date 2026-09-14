#!/usr/bin/env node
/* ============================================================
   tools/interact.mjs — 交互回归测试
   ① 语言切换：中英两版都不能出现空文本，且语言块互斥显示
   ② 每个演示：切到演示 tab → 挂载 → 依次触发全部控件 → 检查无报错且读数有输出
   说明：每条 Runtime.evaluate 都保持较小的报文体积（本机 Chrome 会拒绝
         过大的单条报文），因此拆成多次小调用。
   用法: node tools/interact.mjs
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const PORT = 9700 + Math.floor(Math.random() * 120);

const dir = mkdtempSync(join(tmpdir(), 'cdp-i-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
  '--no-first-run', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--allow-file-access-from-files', '--hide-scrollbars', '--window-size=1440,1000', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ver = null;
for (let i = 0; i < 80; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch { await sleep(250); }
}
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

let id = 0; const pending = new Map(); const events = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  } else if (m.method) events.push(m);
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('timeout ' + method)); } }, 40000);
});

const pages = ['index.html'];
for (const d of readdirSync(ROOT).sort()) {
  if (/^lesson-\d+$/.test(d) && existsSync(join(ROOT, d, 'index.html'))) pages.push(d + '/index.html');
}

let problems = 0;
console.log('================ INTERACTION TEST ================\n');

for (const rel of pages) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  await sleep(450);
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  events.length = 0;
  await send('Page.navigate', { url: 'file://' + join(ROOT, rel) }, sessionId);
  await sleep(1700);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    return r.result.value;
  };

  /* ---------- 语言切换 ---------- */
  const lang = await ev(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const snap = () => {
      const empty = [...document.querySelectorAll('[data-i18n],[data-i18n-html]')]
        .filter(e => e.getClientRects().length && !e.textContent.trim())
        .map(e => e.getAttribute('data-i18n') || e.getAttribute('data-i18n-html'));
      let zh = 0, en = 0;
      document.querySelectorAll('[data-lang]').forEach(e => {
        const l = e.getAttribute('data-lang');
        if (l !== 'zh-CN' && l !== 'en-US') return;
        if (e.getClientRects().length) { l === 'zh-CN' ? zh++ : en++; }
      });
      const bi = [...document.querySelectorAll('[data-bi-zh]')];
      return { empty, zh, en, lang: document.documentElement.lang,
               bi: bi.length, biBad: bi.filter(e => !e.getAttribute('data-bi-en')).length };
    };
    const out = { zh: snap() };
    document.querySelector('.lang-switch button[data-set-lang="en-US"]').click();
    await wait(400); out.en = snap();
    document.querySelector('.lang-switch button[data-set-lang="zh-CN"]').click();
    await wait(400); out.back = snap();
    return JSON.stringify(out);
  })()`);
  const L = JSON.parse(lang);
  const langOk = !L.zh.empty.length && !L.en.empty.length &&
                 L.zh.lang === 'zh-CN' && L.en.lang === 'en' &&
                 L.zh.zh > 0 && L.zh.en === 0 && L.en.zh === 0 && L.en.en > 0;
  console.log('■ ' + rel);
  console.log('  语言切换 : ' + (langOk ? '✓' : '✗') +
    '   中文版可见 zh/en = ' + L.zh.zh + '/' + L.zh.en +
    '   英文版可见 zh/en = ' + L.en.zh + '/' + L.en.en +
    '   空文本 zh=' + L.zh.empty.length + ' en=' + L.en.empty.length +
    '   双语节点=' + L.zh.bi + (L.zh.biBad ? '(缺 en ' + L.zh.biBad + ')' : ''));
  if (!langOk) {
    problems++;
    if (L.zh.empty.length) console.log('     zh 空文本: ' + L.zh.empty.slice(0, 6).join(', '));
    if (L.en.empty.length) console.log('     en 空文本: ' + L.en.empty.slice(0, 6).join(', '));
  }

  /* ---------- 逐个演示 ---------- */
  const ids = JSON.parse(await ev(
    `JSON.stringify([...document.querySelectorAll('.demo-mount')].map(m => m.dataset.demo))`));
  const results = [];
  for (const did of ids) {
    const sel = '.demo-mount[data-demo=' + JSON.stringify(did) + ']';
    await ev(`(() => {
      const m = document.querySelector(${JSON.stringify(sel)});
      if (!m) return 0;
      const host = m.closest('.chapter');
      const b = host && host.querySelector('.tab-btn[data-tab="demo"]');
      if (b) b.click();
      return 1;
    })()`);
    await sleep(650);
    await ev(`(() => {
      const m = document.querySelector(${JSON.stringify(sel)});
      if (m && !m.dataset.booted) {
        try { window.LAYOUT_DEMOS.mount(m); } catch (e) { return 'M:' + e.message; }
      }
      return 'ok';
    })()`).catch(() => {});
    await sleep(500);

    /* 触发该演示的全部控件 */
    await ev(`(async () => {
      const m = document.querySelector(${JSON.stringify(sel)});
      const box = m && m.querySelector('.demo-controls');
      if (!box) return 0;
      const cs = [...box.querySelectorAll('input, select, button')];
      for (const c of cs) {
        const tag = c.tagName.toLowerCase(), type = (c.type || '').toLowerCase();
        if (tag === 'input' && type === 'range') {
          c.value = String(+c.min + (+c.max - +c.min) * 0.7);
          c.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (tag === 'input' && type === 'checkbox') {
          c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (tag === 'select') {
          c.selectedIndex = (c.selectedIndex + 1) % c.options.length;
          c.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (tag === 'button') { c.click(); }
        await new Promise(r => setTimeout(r, 40));
      }
      return cs.length;
    })()`);
    await sleep(700);

    const stat = JSON.parse(await ev(`(() => {
      const m = document.querySelector(${JSON.stringify(sel)});
      const err = m && m.querySelector('p[style*="f87171"]');
      const meas = m && m.querySelector('.measure');
      const css = m && m.querySelector('.live-css');
      const txt = meas ? meas.textContent.trim() : '';
      return JSON.stringify({
        err: err ? err.textContent.slice(0, 130) : null,
        meas: txt.length,
        css: css ? css.textContent.trim().length : 0,
        sample: txt.replace(/\\s+/g, ' ').slice(0, 74)
      });
    })()`));
    results.push({ did, ...stat, out: stat.meas > 0 || stat.css > 0 });
  }

  const bad = results.filter(r => r.err || !r.out);
  const errs = events.filter(e => e.method === 'Runtime.exceptionThrown')
    .map(e => (e.params.exceptionDetails?.exception?.description || '').split('\n')[0]);
  console.log('  演示交互 : ' + results.length + ' 个' + (bad.length ? '  ✗ ' + bad.length + ' 个异常' : '  ✓'));
  for (const r of results) {
    console.log('    ' + (r.err || !r.out ? '✗' : '✓') + ' ' + r.did.padEnd(14) +
      ' 读数=' + String(r.meas).padStart(4) + ' CSS=' + String(r.css).padStart(4) +
      (r.err ? '  → ' + r.err : r.sample ? '  · ' + r.sample : ''));
  }
  if (bad.length) problems++;
  if (errs.length) { console.log('  JS 异常  : ✗ ' + [...new Set(errs)][0]); problems++; }

  await send('Target.closeTarget', { targetId });
}

ws.close(); chrome.kill();
console.log('\n==================================================');
console.log(problems ? `结果: ${problems} 个页面存在问题` : '结果: 全部通过 ✓');
process.exit(0);
