/* ============================================================
   i18n.js — 中英双语引擎 + 轻量语法高亮
   Bilingual engine + lightweight syntax highlighter
   零依赖 / zero dependencies
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     一、词典 Dictionary
     规则：中英文一一对应，键名必须成对出现（有 zh 必有 en）
     --------------------------------------------------------- */
  var DICT = {
    /* ---- 通用 common ---- */
    'common.portal':        { zh: '课程门户',            en: 'Course Portal' },
    'common.langName':      { zh: '中文',                en: 'EN' },
    'common.chapter':       { zh: '章节目录',            en: 'Chapters' },
    'common.next':          { zh: '下一章 →',            en: 'Next Chapter →' },
    'common.prev':          { zh: '← 上一章',            en: '← Previous Chapter' },
    'common.demo':          { zh: '演示',                en: 'Demo' },
    'common.tagline':       { zh: '页面布局 · 交互式教学网站',
                              en: 'Page Layout · An Interactive Teaching Site' },

    /* ---- 顶部导航 nav ---- */
    'nav.home':             { zh: '布局课程',            en: 'Layout Course' },
    'nav.ch1':              { zh: '第 1 章 · 案例起步',  en: 'Ch.1 · The Case' },
    'nav.ch2':              { zh: '第 2 章 · 盒模型与流', en: 'Ch.2 · Box & Flow' },
    'nav.ch3':              { zh: '第 3 章 · Flex',      en: 'Ch.3 · Flex' },
    'nav.ch4':              { zh: '第 4 章 · Grid',      en: 'Ch.4 · Grid' },
    'nav.ch5':              { zh: '第 5 章 · 定位层叠',  en: 'Ch.5 · Position' },
    'nav.ch6':              { zh: '第 6 章 · 响应式',    en: 'Ch.6 · Responsive' },
    'nav.ch7':              { zh: '第 7 章 · 综合实战',  en: 'Ch.7 · Capstone' },

    /* ---- 三个 tab tab ---- */
    'tab.explain':          { zh: '📖 讲解',             en: '📖 Concept' },
    'tab.code':             { zh: '⌨️ 关键代码',         en: '⌨️ Key Code' },
    'tab.demo':             { zh: '▶️ 演示',             en: '▶️ Live Demo' },

    /* ---- 门户首页 portal ---- */
    'portal.eyebrow':       { zh: '可视化导论 · 专题课程',
                              en: 'Intro to Visualization · Special Topic' },
    'portal.title1':        { zh: '把页面',              en: 'Making a page' },
    'portal.title2':        { zh: '排好',                en: 'make sense' },
    'portal.title3':        { zh: '，是一门可以学的学问',
                              en: ', is a skill you can learn' },
    'portal.lead': {
      zh: '本课程不讲孤立的 CSS 语法，而是跟着<b>同一个真实案例</b>走完全程：一位设计师的个人作品集主页。它会先生得很难看，然后在七章里被一次次测量、重构、打磨——每一章都同时给你<b>理论</b>（为什么）、<b>关键代码</b>（怎么做）和<b>可交互演示</b>（自己动手试）。',
      en: 'This course skips isolated CSS syntax and instead follows <b>one real case</b> from start to finish: a designer\u2019s portfolio homepage. It starts out ugly, then gets measured, refactored and polished across seven chapters \u2014 each one giving you <b>theory</b> (why), <b>key code</b> (how) and an <b>interactive demo</b> (try it yourself).'
    },
    'portal.cta.start':     { zh: '从第 1 章开始 →',     en: 'Start with Chapter 1 →' },
    'portal.cta.jump':      { zh: '直接看可交互演示',    en: 'Jump to a live demo' },
    'portal.stat1':         { zh: '章 · 递进式案例',      en: 'chapters \u00b7 progressive case' },
    'portal.stat2':         { zh: '个可交互演示',        en: 'interactive demos' },
    'portal.stat3':         { zh: '段关键代码',          en: 'code snippets' },
    'portal.stat4':         { zh: '个真实场景翻车点',    en: 'real-world pitfalls' },
    'portal.case.h':        { zh: '贯穿全站的案例',      en: 'The Running Case' },
    'portal.case.sub': {
      zh: '七章共用同一个页面、同一套数据、同一批组件。你会看着它从"能跑但难看"变成"能交付"。',
      en: 'All seven chapters share one page, one dataset, one set of components. You watch it go from \u201cit runs but looks wrong\u201d to \u201cshippable\u201d.'
    },
    'portal.map.h':         { zh: '课程地图',            en: 'Course Map' },
    'portal.map.sub': {
      zh: '每章 = 一个理论模型 + 一段关键代码 + 一个可交互演示。建议按顺序读。',
      en: 'Each chapter = one theory model + one code snippet + one interactive demo. Reading in order is recommended.'
    },
    'portal.theory.h':      { zh: '课程覆盖的布局理论',  en: 'Theory Covered' },
    'portal.theory.sub': {
      zh: '布局不是审美玄学，它有可以引用的模型、可以被验证的指标。',
      en: 'Layout is not aesthetic mysticism: it has citable models and verifiable metrics.'
    },
    'portal.footer': {
      zh: '页面布局 · 交互式教学网站 · 零依赖 · 原生 HTML / CSS / JavaScript · 可直接离线打开',
      en: 'Page Layout · Interactive Teaching Site · Zero dependencies · Vanilla HTML / CSS / JavaScript · Works offline'
    },

    'portal.l1.t':  { zh: '布局是空间的语言',    en: 'Layout Is the Language of Space' },
    'portal.l1.d':  { zh: '从"能跑但难看"的作品集首页出发，建立布局思维：分组、对齐、层级，以及"为什么会难看"。',
                      en: 'Start from an ugly-but-working portfolio page and build layout thinking: grouping, alignment, hierarchy — and why it looks wrong.' },
    'portal.l2.t':  { zh: '盒模型与文档流',      en: 'Box Model & Normal Flow' },
    'portal.l2.d':  { zh: '一切布局的地基：盒子怎么算大小、外边距为什么会塌陷、BFC 到底解决了什么。',
                      en: 'The foundation of everything: how boxes are sized, why margins collapse, and what a BFC actually fixes.' },
    'portal.l3.t':  { zh: 'Flexbox 一维布局',    en: 'Flexbox: One-Dimensional Layout' },
    'portal.l3.d':  { zh: '主轴与交叉轴的心智模型，flex 简写的真实语义，以及 grow/shrink/basis 的分配算术。',
                      en: 'A mental model for main vs. cross axis, the real semantics of the flex shorthand, and the arithmetic of grow/shrink/basis.' },
    'portal.l4.t':  { zh: 'Grid 二维布局',       en: 'Grid: Two-Dimensional Layout' },
    'portal.l4.d':  { zh: '轨道、线与区域；fr 单位的分配规则；auto-fit + minmax 实现"不写媒体查询的响应式"。',
                      en: 'Tracks, lines and areas; how fr distributes space; auto-fit + minmax for responsive layouts without media queries.' },
    'portal.l5.t':  { zh: '定位、层叠与溢出',    en: 'Positioning, Stacking & Overflow' },
    'portal.l5.d':  { zh: '包含块是谁、sticky 为什么失效、z-index 为什么"不生效"——三个最常被问的问题。',
                      en: 'Which ancestor is the containing block, why sticky fails, and why z-index \u201cdoesn\u2019t work\u201d — the three most-asked questions.' },
    'portal.l6.t':  { zh: '响应式与流式思维',    en: 'Responsive & Fluid Thinking' },
    'portal.l6.d':  { zh: '断点是症状而不是病因；用 clamp / minmax / 容器查询做内在响应式布局。',
                      en: 'Breakpoints are symptoms, not causes. Use clamp / minmax / container queries for intrinsic responsive layout.' },
    'portal.l7.t':  { zh: '综合实战：交付级布局', en: 'Capstone: A Shippable Layout' },
    'portal.l7.d':  { zh: '把案例重构到交付水准，并附上一份"布局自检清单"与十个真实翻车点。',
                      en: 'Refactor the case to shipping quality, plus a layout self-check checklist and ten real-world pitfalls.' },

    'portal.th1': { zh: '格式塔原则（接近 / 相似 / 共同区域）', en: 'Gestalt principles (proximity / similarity / common region)' },
    'portal.th2': { zh: '视觉层级与 F 型阅读路径',   en: 'Visual hierarchy and the F-shaped reading path' },
    'portal.th3': { zh: 'CSS 盒模型规范与外边距塌陷', en: 'CSS box model spec and margin collapsing' },
    'portal.th4': { zh: '块级格式化上下文（BFC）',    en: 'Block Formatting Context (BFC)' },
    'portal.th5': { zh: 'Flex 弹性分配算法',          en: 'The flex line resolution algorithm' },
    'portal.th6': { zh: 'CSS Grid 轨道与 fr 分配',    en: 'Grid tracks and fr distribution' },
    'portal.th7': { zh: '包含块与层叠上下文',         en: 'Containing blocks and stacking contexts' },
    'portal.th8': { zh: '内在响应式（intrinsic web design）', en: 'Intrinsic web design' },

    /* ---- 课程卡片标签 card tags ---- */
    'tag.gestalt':     { zh: '格式塔',       en: 'gestalt' },
    'tag.hierarchy':   { zh: '视觉层级',     en: 'hierarchy' },
    'tag.grid-system': { zh: '栅格系统',     en: 'grid system' },
    'tag.boxmodel':    { zh: '盒模型',       en: 'box model' },
    'tag.bfc':         { zh: 'BFC',          en: 'BFC' },
    'tag.margin':      { zh: '外边距塌陷',   en: 'margin collapse' },
    'tag.flex':        { zh: 'flex',         en: 'flex' },
    'tag.axis':        { zh: '主轴/交叉轴',  en: 'main/cross axis' },
    'tag.grow':        { zh: 'grow/shrink',  en: 'grow/shrink' },
    'tag.grid':        { zh: 'grid',         en: 'grid' },
    'tag.fr':          { zh: 'fr 单位',      en: 'fr unit' },
    'tag.autofit':     { zh: 'auto-fit',     en: 'auto-fit' },
    'tag.stack':       { zh: '层叠上下文',   en: 'stacking context' },
    'tag.sticky':      { zh: 'sticky',       en: 'sticky' },
    'tag.overflow':    { zh: '溢出',         en: 'overflow' },
    'tag.breakpoint':  { zh: '断点',         en: 'breakpoints' },
    'tag.clamp':       { zh: 'clamp()',      en: 'clamp()' },
    'tag.intrinsic':   { zh: '内在响应式',   en: 'intrinsic' },
    'tag.checklist':   { zh: '自检清单',     en: 'checklist' },
    'tag.refactor':    { zh: '重构',         en: 'refactor' },
    'tag.a11y':        { zh: '可访问性',     en: 'a11y' },

    /* ---- 章节头快捷键提示 header tips ---- */
    'tip.tab':      { zh: '切换小节',           en: 'next panel' },
    'tip.tabs':     { zh: '直达 讲解/代码/演示', en: 'jump to concept/code/demo' },
    'tip.lang':     { zh: '中英切换',           en: 'switch language' },

    /* ---- 浏览器标题 document title ---- */
    'doc.portal':   { zh: '页面布局 · 交互式教学网站',
                      en: 'Page Layout · An Interactive Course' },

    /* ---- 页脚 footer ---- */
    'footer.case': { zh: '贯穿案例：设计师个人作品集主页（Lin\u2019s Portfolio）',
                     en: 'Running case: a designer\u2019s portfolio homepage (Lin\u2019s Portfolio)' },
    'footer.note': { zh: '本页所有演示均为真实 DOM + 真实 CSS，可通过控制面板实时改写样式并观察结果。',
                     en: 'Every demo on this page is real DOM with real CSS: the control panel rewrites styles live and you watch the result.' }
  };

  /* ---------------------------------------------------------
     二、渲染 Render
     --------------------------------------------------------- */
  var doc = document;
  var STORE_KEY = 'layout-course-lang';
  var current = 'zh-CN';

  /* 语言代码归一化：词典的键是 zh / en 两个短码，
     而页面状态用的是 zh-CN / en-US，必须在这里统一 */
  function norm(lang) {
    return String(lang || current).toLowerCase().indexOf('en') === 0 ? 'en' : 'zh';
  }

  function t(key, lang) {
    var e = DICT[key];
    if (!e) return null;
    var v = e[norm(lang)];
    return v != null ? v : e.zh;
  }

  function apply(lang) {
    current = lang;
    doc.documentElement.setAttribute('lang', lang === 'en-US' ? 'en' : 'zh-CN');
    doc.documentElement.setAttribute('data-lang', lang);

    /* 1. 纯文本节点：data-i18n */
    doc.querySelectorAll('[data-i18n]').forEach(function (el) {
      var s = t(el.getAttribute('data-i18n'), lang);
      if (s != null) el.textContent = s;
    });

    /* 2. 富文本节点：data-i18n-html */
    doc.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var s = t(el.getAttribute('data-i18n-html'), lang);
      if (s != null) el.innerHTML = s;
    });

    /* 3. 属性翻译：data-i18n-attr="placeholder:key,title:key2" */
    doc.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var kv = pair.split(':');
        if (kv.length !== 2) return;
        var s = t(kv[1].trim(), lang);
        if (s != null) el.setAttribute(kv[0].trim(), s);
      });
    });

    /* 4. 语言块切换：[data-lang="zh-CN"] / [data-lang="en-US"] */
    doc.querySelectorAll('[data-lang]').forEach(function (el) {
      var l = el.getAttribute('data-lang');
      if (l !== 'zh-CN' && l !== 'en-US') return;
      el.hidden = (l !== lang);
    });

    /* 5. 语言开关按钮状态 */
    doc.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-set-lang') === lang);
    });

    /* 6. 语言偏好：
       ① 写 localStorage（http(s) 下有效；
          注意部分浏览器在 file:// 下不跨页面持久化，所以不能只依赖它）
       ② 把 ?lang= 同步到本文档内所有站内链接，
          这样在 file:// 下直接双击打开也能把语言带到下一页 */
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    syncLangToLinks(lang);

    doc.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* 给站内链接补上（或去掉）lang 查询参数 */
  function syncLangToLinks(lang) {
    var p = lang === 'en-US' ? 'en' : 'zh';
    var links = doc.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var raw = a.getAttribute('href');
      if (!raw) continue;
      /* 跳过：纯锚点、外部协议、新窗口链接 */
      if (raw.charAt(0) === '#') continue;
      if (/^(https?:|mailto:|tel:|javascript:)/i.test(raw)) continue;
      /* 拆出路径与锚点，只处理路径部分 */
      var hashAt = raw.indexOf('#');
      var hash = hashAt === -1 ? '' : raw.slice(hashAt);
      var path = hashAt === -1 ? raw : raw.slice(0, hashAt);
      var qAt = path.indexOf('?');
      var query = qAt === -1 ? '' : path.slice(qAt + 1);
      path = qAt === -1 ? path : path.slice(0, qAt);
      /* 移除已有的 lang 参数 */
      var kept = query.split('&').filter(function (kv) {
        return kv && kv.indexOf('lang=') !== 0;
      });
      kept.push('lang=' + p);
      a.setAttribute('href', path + '?' + kept.join('&') + hash);
    }
  }

  /* 读取 URL 上的语言偏好（优先级最高） */
  function fromQuery() {
    try {
      var m = /[?&]lang=([^&#]+)/.exec(window.location.search);
      if (!m) return null;
      var v = decodeURIComponent(m[1]).toLowerCase();
      if (v.indexOf('en') === 0) return 'en-US';
      if (v.indexOf('zh') === 0) return 'zh-CN';
    } catch (e) {}
    return null;
  }

  function detect() {
    var q = fromQuery();
    if (q) return q;
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (saved === 'zh-CN' || saved === 'en-US') return saved;
    return (navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh-CN' : 'zh-CN';
  }

  /* ---------------------------------------------------------
     三、语法高亮 Syntax highlighting（轻量、无依赖）
     支持 html / css / js
     --------------------------------------------------------- */
  var RE = {
    comment: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,
    string:  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g
  };

  var JS_KW = /\b(const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|from|await|async|try|catch|throw|typeof|instanceof|this|null|undefined|true|false|do|switch|case|break|continue|delete|default|static|get|set|yield)\b/g;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* 把字符串/注释先抽出来占位，避免被后续规则二次替换 */
  function tokenizeGuarded(src, inner) {
    var slots = [];
    var out = src.replace(RE.comment, function (m) {
      slots.push('<span class="tok-cmt">' + esc(m) + '</span>');
      return '\u0000' + (slots.length - 1) + '\u0000';
    });
    out = out.replace(RE.string, function (m) {
      slots.push('<span class="tok-str">' + esc(m) + '</span>');
      return '\u0001' + (slots.length - 1) + '\u0001';
    });
    out = inner(out);
    out = out.replace(/\u0000(\d+)\u0000/g, function (_, i) { return slots[+i]; });
    out = out.replace(/\u0001(\d+)\u0001/g, function (_, i) { return slots[+i]; });
    return out;
  }

  function hlJS(src) {
    var s = tokenizeGuarded(src, function (o) {
      return o
        .replace(JS_KW, '<span class="tok-kw">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?(?:px|em|rem|fr|%|s|ms|vh|vw|deg)?)\b/g, '<span class="tok-num">$1</span>')
        .replace(/([A-Za-z_$][\w$]*)\s*\(/g, '<span class="tok-fn">$1</span>(')
        .replace(/\b([A-Z][\w$]*)\b/g, '<span class="tok-op">$1</span>');
    });
    return s;
  }

  function hlCSS(src) {
    /* 注释先保护，再做 属性/值 与 选择器 的着色 */
    var slots = [];
    var out = src.replace(/\/\*[\s\S]*?\*\//g, function (m) {
      slots.push('<span class="tok-cmt">' + esc(m) + '</span>');
      return '\u0000' + (slots.length - 1) + '\u0000';
    });
    out = out.replace(/(^|[;{]\s*)([-a-zA-Z]+)\s*:\s*([^;{}\n]+)/g,
      function (_, pre, prop, val) {
        return pre + '<span class="tok-prop">' + esc(prop) + '</span>: ' +
               '<span class="tok-num">' + esc(val.trim()) + '</span>';
      });
    /* 选择器行：仅对位于 { 之前且不含 : 的整行做处理，安全 */
    out = out.replace(/^([ \t]*)([.#:@a-zA-Z*\[][^{}\n;]*?)(\s*\{)/gm, function (_, ind, sel, br) {
      if (sel.indexOf('<span') !== -1) return _;
      return ind + '<span class="tok-sel">' + esc(sel.trim()) + '</span>' + br;
    });
    out = out.replace(/\u0000(\d+)\u0000/g, function (_, i) { return slots[+i]; });
    return out;
  }

  function hlHTML(src) {
    var slots = [];
    var out = src.replace(/(&lt;!--[\s\S]*?--&gt;|\x3c!--[\s\S]*?--\x3e)/g, function (m) {
      slots.push('<span class="tok-cmt">' + esc(m) + '</span>');
      return '\u0000' + (slots.length - 1) + '\u0000';
    });
    out = out.replace(/(&lt;\/?)([a-zA-Z][\w-]*)|(\x3c\/?)([a-zA-Z][\w-]*)/g, function (m, a, b, c, d) {
      var pre = a || c, tag = b || d;
      return '<span class="tok-kw">' + esc(pre) + '</span><span class="tok-sel">' + esc(tag) + '</span>';
    });
    out = out.replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;|"[^"]*?")/g,
      '<span class="tok-prop">$1</span>=<span class="tok-str">$2</span>');
    out = out.replace(/\u0000(\d+)\u0000/g, function (_, i) { return slots[+i]; });
    return out;
  }

  function highlightAll(root) {
    (root || doc).querySelectorAll('pre > code').forEach(function (code) {
      if (code.dataset.hlDone === '1') return;
      var raw = code.textContent;
      var cls = code.className || '';
      var html;
      if (/\blang-html\b/.test(cls))      html = hlHTML(esc(raw));
      else if (/\blang-css\b/.test(cls))  html = hlCSS(esc(raw));
      else                                html = hlJS(esc(raw));
      /* 星标 ⭐ 特殊着色 */
      html = html.replace(/⭐/g, '<span class="tok-star">⭐</span>');
      code.innerHTML = html;
      code.dataset.hlDone = '1';
    });
  }

  /* ---------------------------------------------------------
     四、初始化 Boot
     --------------------------------------------------------- */
  function boot() {
    doc.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.getAttribute('data-set-lang'));
      });
    });
    apply(detect());
    highlightAll();
    /* 允许页面脚本把自己的词典并进来 */
    doc.dispatchEvent(new CustomEvent('i18nready', { detail: { api: API } }));
  }

  var API = {
    dict: DICT,
    /* 注意：ES5 规定对象字面量里的 t: t 会被 Object.prototype.toString 覆盖，
       短名会被吞掉，因此这里显式改名并用 defineProperty 暴露真正的翻译函数 */
    translate: t,
    apply: apply,
    highlight: highlightAll,
    get lang() { return current; },
    /* 页面可注册新词条再重绘 */
    register: function (extra) {
      Object.keys(extra).forEach(function (k) { DICT[k] = extra[k]; });
      apply(current);
    }
  };
  Object.defineProperty(API, 't', {
    value: t, writable: true, configurable: true, enumerable: false
  });
  window.I18N = API;

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
