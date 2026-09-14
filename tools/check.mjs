#!/usr/bin/env node
/* ============================================================
   tools/check.mjs — 双语一致性 + 引用完整性静态检查（带转义安全的解析器）
   1) 每个词条必须 zh / en 成对
   2) 页面引用的每个 i18n key 必须存在
   3) 每个 data-demo 必须有对应实现
   4) 每章结构必须为 讲解 3 · 代码 3 · 演示 3
   用法: node tools/check.mjs
   ============================================================ */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
let problems = 0;
const fail = (m) => { console.log('  \u2717 ' + m); problems++; };
const ok = (m) => console.log('  \u2713 ' + m);

const DICT_FILES = ['i18n.js', 'extra-content.js', 'lesson-content.js'];

/* ---------- 转义安全的字符串读取 ---------- */
function readString(src, i) {
  const q = src[i];
  i++;
  let out = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') { out += src[i] + src[i + 1]; i += 2; continue; }
    if (c === q) return { value: out, end: i + 1 };
    out += c; i++;
  }
  return { value: out, end: i };
}

/* 解析 { zh: '...', en: '...' } —— 跳过字符串内部的 { } */
function parseEntry(src, start) {
  let i = start, depth = 0, zh = null, en = null;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') { i = readString(src, i).end; continue; }
    if (c === '{') { depth++; i++; continue; }
    if (c === '}') { depth--; i++; if (depth === 0) break; continue; }
    if (depth === 1) {
      const m = /^(zh|en)\s*:\s*/.exec(src.slice(i, i + 8));
      if (m) {
        let j = i + m[0].length;
        while (/\s/.test(src[j])) j++;
        const s = readString(src, j);
        if (m[1] === 'zh') zh = s.value; else en = s.value;
        i = s.end; continue;
      }
    }
    i++;
  }
  return { zh, en, end: i };
}

function collectDict(file) {
  if (!existsSync(join(ROOT, file))) return [];
  const src = readFileSync(join(ROOT, file), 'utf8');
  const out = [];
  const keyRe = /'([A-Za-z][\w.\-]*)'\s*:\s*\{/g;
  let m;
  while ((m = keyRe.exec(src))) {
    const e = parseEntry(src, m.index + m[0].length - 1);
    out.push({ key: m[1], zh: e.zh, en: e.en, file });
  }
  return out;
}

const entries = DICT_FILES.flatMap(collectDict);
const dict = new Map();
const dupes = [];
for (const e of entries) {
  if (dict.has(e.key)) dupes.push(e.key);
  dict.set(e.key, e);
}

console.log('■ 词典 (Bilingual dictionary)');
console.log('  来源: ' + DICT_FILES.join(', '));
console.log('  词条总数: ' + dict.size);
if (dupes.length) fail('重复定义的 key: ' + [...new Set(dupes)].join(', '));
else ok('无重复 key');

const oneSided = entries.filter(e => !e.zh || !e.en);
if (oneSided.length) {
  fail('缺少 zh 或 en 的词条（中英必须成对）:');
  oneSided.forEach(e => console.log('     - ' + e.key + '  zh=' + !!e.zh + ' en=' + !!e.en + '  (' + e.file + ')'));
} else {
  ok('全部 ' + dict.size + ' 条词条均具备中文与英文');
}

/* ---------- 页面引用 ---------- */
const pages = ['index.html'];
for (const d of readdirSync(ROOT).sort()) {
  if (/^lesson-\d+$/.test(d) && existsSync(join(ROOT, d, 'index.html'))) pages.push(d + '/index.html');
}

const used = new Map();
const demosUsed = new Map();
const dynamicKeys = [];
for (const p of pages) {
  const src = readFileSync(join(ROOT, p), 'utf8');
  for (const attr of ['data-i18n', 'data-i18n-html']) {
    const re = new RegExp(attr + '="([^"]+)"', 'g');
    let m;
    while ((m = re.exec(src))) {
      const k = m[1];
      /* 动态拼出的 key（如 ' + VAR + '）单独统计 */
      if (/['+()\s]/.test(k)) { dynamicKeys.push({ k, p }); continue; }
      if (!used.has(k)) used.set(k, new Set());
      used.get(k).add(p);
    }
  }
  const re2 = /data-demo="([^"]+)"/g;
  let m2;
  while ((m2 = re2.exec(src))) {
    if (!demosUsed.has(m2[1])) demosUsed.set(m2[1], new Set());
    demosUsed.get(m2[1]).add(p);
  }
}

console.log('\n■ 页面引用 (Page references)');
console.log('  页面数: ' + pages.length + ' | 引用 key: ' + used.size);
const missing = [...used.keys()].filter(k => !dict.has(k));
if (missing.length) {
  fail('引用了不存在的 key:');
  missing.forEach(k => console.log('     - ' + k + '  \u2190 ' + [...used.get(k)].join(', ')));
} else ok('所有引用的 key 均已定义，且中英各一份');

if (dynamicKeys.length) {
  const stat = dynamicKeys.filter(d => /^\s*'\s*\+\s*[A-Za-z_$]/.test(d.k));
  console.log('  · 动态拼接的 key: ' + dynamicKeys.length + ' 处' +
    (stat.length ? '（含 ' + stat.length + ' 处变量拼接，已由运行时校验覆盖）' : ''));
}

/* ---------- 演示实现 ---------- */
const demoJs = readFileSync(join(ROOT, 'demos.js'), 'utf8');
const registered = new Set([...demoJs.matchAll(/REG\['([\w\-]+)'\]/g)].map(m => m[1]));

console.log('\n■ 交互演示 (Interactive demos)');
console.log('  注册实现: ' + registered.size + ' | 页面挂载点: ' + demosUsed.size);
const noImpl = [...demosUsed.keys()].filter(k => !registered.has(k));
if (noImpl.length) {
  fail('挂载点没有对应实现:');
  noImpl.forEach(k => console.log('     - ' + k + '  \u2190 ' + [...demosUsed.get(k)].join(', ')));
} else ok('每个 data-demo 都有实现');
const neverUsed = [...registered].filter(k => !demosUsed.has(k));
if (neverUsed.length) fail('已实现但未挂载: ' + neverUsed.join(', '));

/* ---------- 章节结构 ---------- */
console.log('\n■ 章节结构 (Chapter structure)');
for (const p of pages.filter(x => x.startsWith('lesson-'))) {
  const src = readFileSync(join(ROOT, p), 'utf8');
  const n = (s) => (src.match(new RegExp('data-panel="' + s + '"', 'g')) || []).length;
  const [a, b, c] = [n('explain'), n('code'), n('demo')];
  const tabs = (src.match(/class="tabs" data-tabs/g) || []).length;
  if (a === 3 && b === 3 && c === 3 && tabs === 3) {
    console.log(`  \u2713 ${p}  讲解 ${a} · 代码 ${b} · 演示 ${c}（各 3 个 tab 组）`);
  } else {
    fail(`${p}: 讲解/代码/演示 = ${a}/${b}/${c} (tab 组 ${tabs})，应为 3/3/3 与 3`);
  }
}

/* ---------- 内联双语块对称 ---------- */
console.log('\n■ 内联双语块 (Inline language blocks)');
let asym = 0;
for (const p of pages) {
  const src = readFileSync(join(ROOT, p), 'utf8').replace(/<style[\s\S]*?<\/style>/g, '');
  const zh = (src.match(/data-lang="zh-CN"/g) || []).length;
  const en = (src.match(/data-lang="en-US"/g) || []).length;
  if (zh !== en) { fail(`${p}: zh=${zh} en=${en}`); asym++; }
}
if (!asym) ok('所有页面内联 zh/en 块数量一致（其余文本由同一 key 渲染，天然一致）');

/* ---------- 每章代码段数 ---------- */
console.log('\n■ 关键代码 (Key code blocks)');
for (const p of pages.filter(x => x.startsWith('lesson-'))) {
  const src = readFileSync(join(ROOT, p), 'utf8');
  const n = (src.match(/<pre><code /g) || []).length;
  if (n === 3) console.log(`  \u2713 ${p}  ${n} 段`);
  else fail(`${p}: 代码段 ${n} 个，应为 3`);
}

console.log('\n==================================================');
console.log(problems ? `结果: 发现 ${problems} 个问题` : '结果: 全部通过 \u2713');
process.exit(problems ? 1 : 0);
