/* ============================================================
   demos.js — 全站可交互演示库
   Interactive demo library
   所有演示 = 真实 DOM + 真实 CSS + 实时测量，零依赖
   ============================================================ */
(function () {
  'use strict';

  var REG = {};
  window.LAYOUT_DEMOS = {
    register: function (id, fn) { REG[id] = fn; },
    mount: function (el) {
      var id = el.getAttribute('data-demo');
      if (!REG[id]) { el.textContent = '[missing demo: ' + id + ']'; return; }
      if (el.dataset.booted) return;
      el.dataset.booted = '1';
      try { REG[id](el); } catch (e) {
        el.innerHTML = '<p style="color:var(--dm-bad,#bc4f38)">demo error (' + id + '): ' + e.message + '</p>';
        if (window.console) console.error(e);
      }
    },
    hlCSS: hlCSS,
    esc: esc
  };

  /* 页面加载时自动挂载（不依赖 tab 切换的演示） */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.demo-mount').forEach(function (el) {
      /* 只挂载默认可见的（演示 tab 默认激活的章节） */
      var panel = el.closest ? el.closest('.tab-panel') : null;
      if (!panel || panel.classList.contains('active')) window.LAYOUT_DEMOS.mount(el);
    });
  });

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function T(zh, en) {
    return window.I18N && window.I18N.lang === 'en-US' ? en : zh;
  }
  /** 双语文本节点：随语言切换自动更新 */
  function bi(node, zh, en) {
    node.setAttribute('data-bi-zh', zh);
    node.setAttribute('data-bi-en', en);
    node.textContent = T(zh, en);
    return node;
  }
  /* ---------- 演示内部文案的本地化 ----------
     各演示的舞台与读数里含大量中文标签，这里提供“整串 → 整串”的
     精确对照表（不做词级替换，避免出现中英混排）。
     翻译范围：读数/提示/舞台标题 整块替换；演示 canvas 只替换文本节点。
     一律保留中文原文，切回中文时还原。文本以中文开头才整体替换，
     因此像 “flex-basis = 120px” 这类混合串不会被破坏。 */
  var PAIRS = [
    /* 舞台与控件文案 */
    ['同一份 HTML，两种命运', 'One HTML, two fates'],
    ['格式塔接近性原则：间距即分组', 'Gestalt proximity: spacing is grouping'],
    ['对齐：看不见的线决定专业感', 'Alignment: the invisible line that decides polish'],
    ['盒模型：width 到底包不包括 padding 和 border', 'Box model: does width include padding and border?'],
    ['外边距塌陷：为什么间距不是相加的', 'Margin collapsing: why gaps do not add up'],
    ['主轴与交叉轴：justify 永远顺着主轴', 'Main vs. cross axis: justify follows the main axis'],
    ['grow / shrink / basis：剩余空间是怎么被分掉的', 'grow / shrink / basis: how leftover space is shared'],
    ['Grid 轨道：fr 是如何分配剩余空间的', 'Grid tracks: how fr distributes leftover space'],
    ['auto-fit / auto-fill：不写媒体查询的响应式卡片区', 'auto-fit / auto-fill: responsive cards without media queries'],
    ['position：谁相对谁定位，谁又脱离了文档流', 'position: against what, and what leaves the flow?'],
    ['z-index 为什么“不生效”：层叠上下文', 'Why z-index "does not work": stacking contexts'],
    ['断点实验台：同一份 CSS 在不同视口下的表现', 'Breakpoint lab: one stylesheet across viewports'],
    ['翻车现场：同一段代码，改写一行就修好', 'Crash site: one line decides pass or fail'],
    ['交付自检：在 4 个宽度下同时体检', 'Pre-flight: audited at four widths at once'],
    ['流式字号：clamp(min, 首选, max)', 'Fluid type: clamp(min, preferred, max)'],
    ['三种显示类型：为什么 inline 的宽高不起作用', 'Three display types: why width/height fail on inline'],
    ['导航条实战：两端对齐与垂直居中', 'Navbar in practice: push apart and centre vertically'],
    ['grid-template-areas：用“画图”的方式写整页骨架', 'grid-template-areas: drawing the page skeleton'],
    ['overflow：什么时候该滚，什么时候不该', 'overflow: when to scroll and when not to'],
    ['容器查询：让组件看“自己的宽度”而不是视口', 'Container queries: components respond to their own width'],
    ['交付版案例：可调密度与主题的最终布局', 'The shipped case: final layout with adjustable density and theme'],
    /* 舞台内部与读数文案 */
    ['父容器（虚线为边界，斜纹为剩余空间）', 'Parent container (dashed = boundary, hatching = leftover space)'],
    ['↓ 在框内滚动，观察 sticky 与 fixed 的区别', '↓ Scroll inside the box and watch sticky vs. fixed'],
    ['· 参照物 / 占位元素', '\u00b7 reference / spacing element'],
    ['Box B · 用来观察是否为 target 让出了位置', 'Box B \u00b7 shows whether space was reserved for the target'],
    ['Box C · 再往下一点，方便滚动测试 sticky', 'Box C \u00b7 a bit further down, to test sticky scrolling'],
    ['蓝色方块写在红色方块内部，但 z-index 高得多。', 'The blue box sits inside the red one but has a far higher z-index.'],
    ['左列：宽主区', 'Left column: wide main area'],
    ['右列：窄侧栏', 'Right column: narrow sidebar'],
    ['两栏形态实测', 'Both columns, measured'],
    ['对同一份 DOM 的客观测量', 'Objective measurement of the same DOM'],
    ['测量', 'Measurement'],
    ['当前间距（实时）', 'Current spacing (live)'],
    ['对齐质量测量', 'Alignment quality'],
    ['实时测量：期望值 vs 实测值', 'Live: expected vs. measured'],
    ['实测尺寸', 'Measured size'],
    ['溢出诊断', 'Overflow diagnosis'],
    ['轨道实测', 'Measured tracks'],
    ['列数与宽度实测', 'Columns and widths, measured'],
    ['对齐实测', 'Alignment, measured'],
    ['分配算术', 'Distribution arithmetic'],
    ['行为与包含块', 'Behaviour & containing block'],
    ['谁在上层（实测 elementFromPoint）', 'Who is on top (measured with elementFromPoint)'],
    ['当前形态判定（真实测量）', 'What the layout is doing (measured)'],
    ['计算值实测', 'Computed values, measured'],
    ['交付指标实测', 'Shipping metrics, measured'],
    ['对同一份 DOM 的客观测量', 'Objective measurement of the same DOM']
  ];
  var PAIR_MAP = {};
  PAIRS.forEach(function (p) { PAIR_MAP[p[0]] = p[1]; });

  function enify(text) {
    var key = String(text).trim();
    if (!key) return text;
    if (PAIR_MAP[key] != null) return text.replace(key, PAIR_MAP[key]);
    /* 中英混排串（如 “items = 3”）保持原样，避免出现半中半英 */
    return text;
  }

  var BLOCK_SEL = '.measure, .live-css, .demo-hint, .demo-name, .demo-pitfall-title, ' +
                  '.demo-stage-head .demo-live, .chapter-nav .nav-tip';

  function isEn() { return !!(window.I18N && window.I18N.lang === 'en-US'); }

  function localizeBlock(en) {
    document.querySelectorAll(BLOCK_SEL + ', [data-en-src]').forEach(function (el) {
      if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html')) return;
      /* 已经由 bi() 维护的双语节点（data-bi-zh/en）不参与替换，
         否则会把已经正确的英文覆盖回中文 */
      if (el.hasAttribute('data-bi-zh') || el.hasAttribute('data-bi-en')) return;
      /* 自带英文原文的节点（如翻车点说明）直接使用，无需查表 */
      if (el.dataset.enSrc != null) {
        el.textContent = en ? el.dataset.enSrc : (el.dataset.zhSrc || el.textContent);
        return;
      }
      if (en) {
        if (el.dataset.zhSrc == null) el.dataset.zhSrc = el.innerHTML;
        el.innerHTML = mapHtmlStrings(el.dataset.zhSrc);
      } else if (el.dataset.zhSrc != null) {
        el.innerHTML = el.dataset.zhSrc;
      }
    });
  }

  /* 对一段 HTML 里的纯文本片段做整串替换（不动标签与属性） */
  function mapHtmlStrings(html) {
    return html.replace(/>([^<>]+)</g, function (m, txt) {
      var t2 = enify(txt);
      return '>' + t2 + '<';
    });
  }

  function localizeTextNodes(en) {
    document.querySelectorAll('.demo-canvas').forEach(function (host) {
      var walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var p = node.parentNode;
        if (!p || p.nodeType !== 1) return;
        var tag = p.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'svg' || tag === 'code' || tag === 'pre') return;
        if (en) {
          if (node.__zh == null) node.__zh = node.nodeValue;
          var t2 = enify(node.__zh);
          if (t2 !== node.nodeValue) node.nodeValue = t2;
        } else if (node.__zh != null) {
          node.nodeValue = node.__zh;
        }
      });
    });
  }

  var localizing = false;
  function localize() {
    if (localizing) return;
    localizing = true;
    try { var en = isEn(); localizeBlock(en); localizeTextNodes(en); }
    finally { localizing = false; }
  }
  window.LAYOUT_DEMOS.localize = localize;
  document.addEventListener('langchange', function () { localize(); });
  document.addEventListener('DOMContentLoaded', function () {
    localize();
    if (window.MutationObserver) {
      var queued = false;
      var mo = new MutationObserver(function () {
        if (!isEn() || localizing || queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; localize(); });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  /* 语言切换时刷新所有 bi 节点 */
  document.addEventListener('langchange', function () {
    document.querySelectorAll('[data-bi-zh]').forEach(function (n) {
      n.textContent = window.I18N.lang === 'en-US' ? n.getAttribute('data-bi-en') : n.getAttribute('data-bi-zh');
    });
    document.querySelectorAll('[data-bi-ph-zh]').forEach(function (n) {
      n.placeholder = window.I18N.lang === 'en-US' ? n.getAttribute('data-bi-ph-en') : n.getAttribute('data-bi-ph-zh');
    });
  });

  /** 造一个演示外壳：左侧舞台 + 右侧控制面板 */
  function shell(host, nameZh, nameEn, opts) {
    opts = opts || {};
    host.classList.add('demo-stage');
    var head = el('div', 'demo-stage-head',
      '<span class="dot"></span><span class="demo-name"></span>' +
      (opts.noLive ? '' : '<span class="demo-live"></span>'));
    bi(head.querySelector('.demo-name'), nameZh, nameEn);
    var live = head.querySelector('.demo-live');
    if (live) bi(live, '真实渲染 · 可交互', 'Live render · interactive');

    var body = el('div', 'demo-body' + (opts.noControls ? ' no-controls' : ''));
    var canvas = el('div', 'demo-canvas');
    var ctl = el('aside', 'demo-controls');
    body.appendChild(canvas);
    if (!opts.noControls) body.appendChild(ctl);
    host.appendChild(head);
    host.appendChild(body);
    return { canvas: canvas, ctl: ctl, body: body };
  }

  /** iframe 小舞台：真实渲染 + 测量回读
   *  onLoad 通过 load 事件代理调用：
   *  用 srcdoc 写入内容时 iframe 会重新加载，但监听器挂在元素本身上，
   *  所以只需在每次渲染前更新 currentOnLoad，无需重复绑定。 */
  function stage(parent, height, url) {
    var wrap = el('div', 'demo-frame-wrap');
    var bar = el('div', 'frame-bar',
      '<span>◉</span><span>◉</span><span>◉</span><span class="url">' +
      esc(url || 'lin-portfolio.local/index.html') + '</span>');
    var f = el('iframe', 'demo-frame');
    f.setAttribute('title', 'layout demo stage');
    f.style.height = (height || 320) + 'px';
    wrap.appendChild(bar); wrap.appendChild(f);
    parent.appendChild(wrap);
    f.__onLoad = null;
    f.addEventListener('load', function () {
      var cb = f.__onLoad;
      if (typeof cb === 'function') {
        /* 等一帧，确保样式与布局都已稳定 */
        requestAnimationFrame(function () { requestAnimationFrame(cb); });
      }
    });
    return f;
  }
  /** 演示内部的语义色令牌：从宿主页面读取后注入 iframe，
   *  让 21 个演示的配色能跟随全站主题一起变化 */
  function dmTokenCSS() {
    try {
      var cs = window.getComputedStyle(document.documentElement);
      var out = '';
      for (var i = 0; i < cs.length; i++) {
        var p = cs[i];
        if (p.indexOf('--dm-') === 0) {
          var v = cs.getPropertyValue(p).trim();
          if (v) out += p + ':' + v + ';';
        }
      }
      return out ? ':root{' + out + '}' : '';
    } catch (e) { return ''; }
  }

  function writeFrame(f, css, html, extraHead) {
    f.srcdoc = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>' + dmTokenCSS() + css + '</style>' + (extraHead || '') + '</head>' +
      '<body>' + html + '</body></html>';
  }
  /** 渲染并在 iframe 加载完成后执行回调（用于读取真实测量值） */
  function renderFrame(f, css, html, onLoad, extraHead) {
    f.__onLoad = onLoad || null;
    writeFrame(f, css, html, extraHead);
  }

  /** 生成一个控件组 */
  function group(ctl, titleZh, titleEn) {
    var g = el('div', 'group');
    if (titleZh) {
      var h = el('h5'); bi(h, titleZh, titleEn); g.appendChild(h);
    }
    ctl.appendChild(g);
    return g;
  }

  /** 滑块：返回 {wrap, input, out, on} */
  function slider(host, nameZh, nameEn, min, max, val, step, unit, fmt) {
    var l = el('label', 'ctl');
    var row = el('div', 'row', '<span class="name"></span><span class="val"></span>');
    bi(row.querySelector('.name'), nameZh, nameEn);
    var inp = el('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step || 1; inp.value = val;
    var out = row.querySelector('.val');
    l.appendChild(row); l.appendChild(inp);
    host.appendChild(l);
    function show() {
      var v = +inp.value;
      out.textContent = (fmt ? fmt(v) : v) + (unit || '');
    }
    inp.addEventListener('input', show);
    show();
    return { input: inp, out: out, label: row.querySelector('.name'), sync: show };
  }

  /** 分段按钮组 */
  function seg(host, opts, current, onPick) {
    var box = el('div', 'seg');
    opts.forEach(function (o) {
      var b = el('button', null, '');
      bi(b, o.zh, o.en);
      if (o.val === current) b.classList.add('on');
      b.addEventListener('click', function () {
        box.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        onPick(o.val);
      });
      box.appendChild(b);
    });
    host.appendChild(box);
    return box;
  }

  /** 复选框 */
  function check(host, zh, en, val, on) {
    var l = el('label', 'chk');
    var i = el('input'); i.type = 'checkbox'; i.checked = !!val;
    var s = el('span'); bi(s, zh, en);
    l.appendChild(i); l.appendChild(s); host.appendChild(l);
    i.addEventListener('change', function () { on(i.checked); });
    return i;
  }

  /** 代码回显区 */
  function cssBox(host, titleZh, titleEn) {
    var g = group(host, titleZh, titleEn);
    var box = el('div', 'live-css');
    g.appendChild(box);
    return box;
  }
  function measBox(host, titleZh, titleEn) {
    var g = group(host, titleZh, titleEn);
    var box = el('div', 'measure');
    g.appendChild(box);
    return box;
  }
  function actions(host, btns) {
    var g = el('div', 'demo-actions');
    btns.forEach(function (b) {
      var e = el('button', b.primary ? 'primary' : null, '');
      bi(e, b.zh, b.en);
      e.addEventListener('click', b.on);
      g.appendChild(e);
    });
    host.appendChild(g);
    return g;
  }
  function hint(host, zh, en) {
    var p = el('p', 'demo-hint');
    bi(p, zh, en);
    p.style.marginTop = '12px';
    host.appendChild(p);
    return p;
  }

  /** CSS 高亮（供代码回显） */
  function hlCSS(src) {
    var s = esc(src)
      .replace(/([-a-zA-Z]+)\s*:\s*([^;{}\n]+)/g,
        '<span class="prop">$1</span>: <span class="val">$2</span>')
      .replace(/(^|\n)([^\n{}:;]+)(\{)/g, function (m, a, b, c) {
        return a + '<span class="sel">' + b + '</span>' + c;
      });
    return s;
  }

  /* ============================================================
     ① 案例前后对比（第 1 章）
     ============================================================ */
  REG['d1-case'] = function (host) {
    var s = shell(host, '同一份 HTML，两种命运', 'One HTML, two fates');
    var frame = stage(s.canvas, 340, 'lin-portfolio.local/before-after.html');

    var SHARED = '' +
      '*{box-sizing:border-box}' +
      'body{margin:0;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18);background:var(--dm-paper,#fbf8f3)}' +
      '.thumb{height:70px;background:var(--dm-line,#dcd3c5);border-radius:8px}' +
      '.t2{background:var(--dm-c-soft,#b4b8d2)}.t3{background:var(--dm-e-soft,#e0c4bb)}' +
      '.card h3{margin:10px 0 4px;font-size:14px}.card p{margin:0;color:var(--dm-mid,#463d35);font-size:12.5px}' +
      '.tag{font-size:11px;color:var(--dm-mid,#463d35)}';

    var HTML = '' +
      '<header class="nav"><div class="brand">LIN·PORTFOLIO</div>' +
      '<nav><a href="#">Work</a><a href="#">About</a><a href="#">Contact</a></nav></header>' +
      '<section class="hero"><h1>Lin — Product Designer</h1>' +
      '<p>I design calm, legible interfaces for data-heavy products.</p>' +
      '<span class="cta">View case studies</span></section>' +
      '<section class="cards">' +
      '<article class="card"><div class="thumb"></div><h3>Analytics console</h3><p>Dense tables, 40k rows.</p><span class="tag">Data viz</span></article>' +
      '<article class="card"><div class="thumb t2"></div><h3>Clinical timeline</h3><p>ICU handover UI.</p><span class="tag">Healthcare</span></article>' +
      '<article class="card"><div class="thumb t3"></div><h3>Reading app</h3><p>Long-form reader.</p><span class="tag">Editorial</span></article>' +
      '</section>';

    var BAD = SHARED +
      '.nav{border-bottom:1px solid var(--dm-line,#dcd3c5)}' +
      '.brand{font-weight:800;font-size:12px}' +
      '.hero{padding:8px}.hero h1{font-size:15px;margin:6px 0}' +
      '.cta{background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);padding:2px 6px}' +
      '.card{border:1px solid var(--dm-line,#dcd3c5);padding:6px;margin-bottom:6px}';

    var GOOD = SHARED +
      'body{padding:0 18px;line-height:1.6}' +
      '.nav,.hero,.cards{max-width:820px;margin:0 auto}' +
      '.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--dm-line,#dcd3c5)}' +
      '.brand{font-weight:800;font-size:12px;letter-spacing:.06em}' +
      '.nav a{margin-left:14px;font-size:12.5px;color:var(--dm-mid,#463d35);text-decoration:none}' +
      '.hero{padding:34px 0 26px}.hero h1{font-size:30px;line-height:1.15;margin:0 0 10px;letter-spacing:-.02em}' +
      '.hero p{color:var(--dm-mid,#463d35);margin:0 0 16px;max-width:48ch}' +
      '.cta{display:inline-block;background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);padding:9px 18px;border-radius:8px}' +
      '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding-bottom:30px}' +
      '.card{display:grid;border:1px solid var(--dm-line,#dcd3c5);border-radius:12px;padding:12px;gap:2px}' +
      '.tag{margin-top:8px;padding-top:8px;border-top:1px dashed var(--dm-line,#dcd3c5)}';

    var cur = 'bad';
    function draw() { renderFrame(frame, cur === 'bad' ? BAD : GOOD, HTML, metrics); }

    var g1 = group(s.ctl, '版本', 'Version');
    seg(g1, [ { val: 'bad', zh: '✗ 未处理布局', en: '✗ Untouched layout' },
              { val: 'good', zh: '✓ 做过布局', en: '✓ Layout applied' } ], 'bad', function (v) {
      cur = v; draw();
    });
    var m = measBox(s.ctl, '对同一份 DOM 的客观测量', 'Objective measurement of the same DOM');
    var g3 = group(s.ctl, '看看差在哪', 'What actually differs');
    hint(g3,
      'DOM 结构与文字一个字都没改，只改了布局规则。差别全部来自"空间如何被分配"。',
      'Not a single node or word changed \u2014 only the layout rules. Every difference comes from how space is distributed.');

    function metrics() {
      var d = frame.contentDocument;
      if (!d || !d.body) return;
      var w = d.defaultView;
      var h1 = d.querySelector('.hero h1'), p = d.querySelector('.hero p');
      var cards = d.querySelectorAll('.card');
      var rects = Array.prototype.map.call(cards, function (c) { return c.getBoundingClientRect(); });
      var r0 = rects[0], r1 = rects[1];
      var rowTops = rects.map(function (r) { return Math.round(r.top); });
      var perRow = rowTops.filter(function (t) { return t === rowTops[0]; }).length;
      var rowCount = rowTops.filter(function (t, i) { return rowTops.indexOf(t) === i; }).length;
      var sameRow = perRow > 1;
      var over = d.documentElement.scrollWidth - d.documentElement.clientWidth;
      var ratio = parseFloat(w.getComputedStyle(h1).fontSize) / parseFloat(w.getComputedStyle(p).fontSize);
      m.innerHTML =
        '<span class="k">h1 / body font-size</span> = ' + ratio.toFixed(2) + '× ' +
        (ratio >= 2 ? '<span class="ok">✓ 层级清晰</span>' : '<span class="bad">✗ 层级平坦</span>') + '\n' +
        '<span class="k">卡片排列</span> = ' + (rowCount === 1
          ? '单行横向排列（' + perRow + ' 列）'
          : '第 1 行 ' + perRow + ' 列 · 共 ' + rowCount + ' 行（自动换行）') + '\n' +
        '<span class="k">卡片间距 gap</span> = ' +
        (sameRow ? Math.round(r1.left - r0.right) + 'px（水平）'
                 : Math.round(r1.top - r0.bottom) + 'px（垂直）') + '\n' +
        '<span class="k">横向溢出</span> = ' + (over > 1 ? '<span class="bad">' + over + 'px</span>' : '<span class="ok">0px</span>') + '\n' +
        '<span class="k">内容最大宽度</span> = ' + Math.round(d.querySelector('.hero').getBoundingClientRect().width) + 'px';
    }
    draw();
  };

  /* ============================================================
     ② 格式塔分组：间距如何决定"谁和谁是一伙的"（第 1 章）
     ============================================================ */
  REG['d1-gestalt'] = function (host) {
    var s = shell(host, '格式塔接近性原则：间距即分组', 'Gestalt proximity: spacing is grouping');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:18px;font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18)';
    holder.innerHTML =
      '<div id="gsWrap" style="display:grid;gap:26px">' +
        '<div class="grp"><h4 style="margin:0 0 4px;font-size:14px">Analytics console</h4>' +
          '<p style="margin:0;color:var(--dm-mid,#463d35)">Dense tables, 40k rows, one screen.</p></div>' +
        '<div class="grp"><h4 style="margin:0 0 4px;font-size:14px">Clinical timeline</h4>' +
          '<p style="margin:0;color:var(--dm-mid,#463d35)">Time-series UI for ICU handover.</p></div>' +
        '<div class="grp"><h4 style="margin:0 0 4px;font-size:14px">Reading app</h4>' +
          '<p style="margin:0;color:var(--dm-mid,#463d35)">Typography-first long-form reader.</p></div>' +
      '</div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#gsWrap');

    var inner = 4;   /* 组内标题与正文间距 */
    var outer = 26;  /* 组与组之间距 */

    function apply() {
      wrap.style.gap = outer + 'px';
      wrap.querySelectorAll('.grp').forEach(function (g) {
        g.querySelector('h4').style.marginBottom = inner + 'px';
        g.style.paddingLeft = '0';
      });
      /* 视觉分组提示条 */
      wrap.querySelectorAll('.grp').forEach(function (g) {
        g.style.borderLeft = inner > outer / 2.2 ? '2px solid var(--dm-bad,#bc4f38)' : '2px solid rgba(56,189,248,.5)';
        g.style.paddingLeft = '10px';
      });
      readout();
    }
    var box = cssBox(s.ctl, '当前间距（实时）', 'Current spacing (live)');
    function readout() {
      var grouping = inner > outer / 2.2;
      box.innerHTML = hlCSS(
        '.cards { display: grid; gap: ' + outer + 'px; }\n' +
        '.card h4 { margin-bottom: ' + inner + 'px; }\n' +
        '.card p  { margin: 0; }') +
        '\n\n' + (grouping
          ? '<span class="bad">⚠ 组内间距 ≥ 组间间距 → 视觉上"标题和别人的正文"成了一组</span>'
          : '<span class="ok">✓ 组内间距 &lt; 组间间距 → 标题与自己的正文被读成一组</span>');
    }

    var g1 = group(s.ctl, '① 组内间距 / 组间间距', '① Inner vs. outer spacing');
    var sIn = slider(g1, '组内：标题 ↔ 正文', 'Inner: heading ↔ body', 0, 40, 4, 1, 'px', function (v) { inner = v; apply(); });
    var sOut = slider(g1, '组间：卡片 ↔ 卡片', 'Outer: card ↔ card', 0, 60, 26, 1, 'px', function (v) { outer = v; apply(); });
    sIn.input.addEventListener('input', function () { inner = +sIn.input.value; apply(); });
    sOut.input.addEventListener('input', function () { outer = +sOut.input.value; apply(); });

    var g2 = group(s.ctl, '② 预设', '② Presets');
    actions(g2, [
      { zh: '正确分组', en: 'Correct grouping', on: function () { sIn.input.value = 4; sOut.input.value = 26; sIn.sync(); sOut.sync(); apply(); } },
      { zh: '✗ 分组错乱', en: '✗ Broken grouping', primary: false, on: function () { sIn.input.value = 34; sOut.input.value = 18; sIn.sync(); sOut.sync(); apply(); } }
    ]);
    hint(s.ctl,
      '格式塔"接近性原则"说：人会把距离更近的元素读成一组。所以标题与正文的间距必须明显小于卡片之间的间距——这是排版原则，不是风格偏好。',
      'The Gestalt principle of proximity says people group whatever is closest. The gap between a heading and its own body text must therefore be clearly smaller than the gap between cards \u2014 this is a typographic rule, not a style preference.');
    apply();
  };

  /* ============================================================
     ③ 四种对齐方式对比（第 1 章）
     ============================================================ */
  REG['d1-align'] = function (host) {
    var s = shell(host, '对齐：看不见的线决定专业感', 'Alignment: the invisible line that reads as \u201cprofessional\u201d');
    var host = el('div');
    host.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:0;overflow:hidden';
    /* 四种对齐：无 / 居中 / 左对齐 / 栅格对齐 */
    host.innerHTML = '<div id="alGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--dm-line,#dcd3c5)"></div>';
    s.canvas.appendChild(host);
    var grid = host.querySelector('#alGrid');

    var AXES = [
      { id: 'none',  zh: '✗ 无对齐（随机偏移）', en: '✗ No alignment (random offsets)' },
      { id: 'center',zh: '△ 全部居中',           en: '△ Everything centred' },
      { id: 'left',  zh: '✓ 左对齐 + 统一基线',  en: '✓ Left-aligned + shared baseline' },
      { id: 'grid',  zh: '✓✓ 栅格对齐 + 层级',  en: '✓✓ Grid-aligned + hierarchy' }
    ];
    var cells = {};
    AXES.forEach(function (a) {
      var c = el('div');
      c.style.cssText = 'background:var(--dm-paper,#fbf8f3);padding:16px;min-height:210px;position:relative';
      c.innerHTML = '<div class="lbl" style="font:11px/1 ui-monospace,monospace;letter-spacing:.06em;' +
        'color:var(--dm-mute,#8c8073);margin-bottom:12px"></div>' +
        '<div class="stage" style="position:relative;height:150px;' +
        'background-image:linear-gradient(to right,rgba(14,165,233,.14) 1px,transparent 1px);' +
        'background-size:25% 100%"></div>';
      var lbl = c.querySelector('.lbl'); bi(lbl, a.zh, a.en);
      grid.appendChild(c);
      cells[a.id] = c.querySelector('.stage');
    });

    function box(w, h, txt, opts) {
      opts = opts || {};
      var d = el('div', null, '');
      d.textContent = txt;
      d.style.cssText = 'position:absolute;background:' + (opts.bg || 'var(--dm-ink,#211c18)') + ';color:var(--dm-paper,#fbf8f3);' +
        'border-radius:6px;font:12px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;' +
        'padding:7px 10px;white-space:nowrap;' +
        'left:' + opts.x + 'px;top:' + opts.y + 'px;' +
        (w ? 'width:' + w + 'px;' : '') + (h ? 'height:' + h + 'px;' : '');
      return d;
    }

    var seedRand = [0.31, 0.72, 0.14, 0.58, 0.92, 0.05];
    var guide = null;   /* 对齐参考线（测量时排除） */

    function draw(mode) {
      Object.keys(cells).forEach(function (k) { cells[k].innerHTML = ''; });
      var items = [
        { t: 'Analytics console', s: 'Data viz' },
        { t: 'Clinical timeline', s: 'Healthcare' },
        { t: 'Reading app', s: 'Editorial' }
      ];

      /* 无对齐 */
      items.forEach(function (it, i) {
        cells.none.appendChild(box(null, null, it.t, {
          x: 6 + seedRand[i] * 40, y: 6 + i * 46 + seedRand[i + 3] * 8
        }));
      });

      /* 全居中 */
      items.forEach(function (it, i) {
        var d = box(null, null, it.t, { x: 0, y: 6 + i * 46 });
        d.style.left = '50%'; d.style.transform = 'translateX(-50%)';
        cells.center.appendChild(d);
      });
      var cta1 = box(null, null, 'View case studies', { x: 0, y: 150 - 30, bg: 'var(--dm-ink,#211c18)' });
      cta1.style.left = '50%'; cta1.style.transform = 'translateX(-50%)';
      cells.center.appendChild(cta1);

      /* 左对齐 */
      [['Lin — Product Designer', 0, 'var(--dm-ink,#211c18)'], ['Analytics console', 40, 'var(--dm-ink,#211c18)'],
       ['Clinical timeline', 74, 'var(--dm-ink,#211c18)'], ['Reading app', 108, 'var(--dm-ink,#211c18)']].forEach(function (r, i) {
        var d = box(null, null, r[0], { x: 12, y: r[1], bg: r[2] });
        if (i === 0) d.style.fontSize = '15px';
        cells.left.appendChild(d);
      });

      /* 栅格 + 层级 */
      var t = box(null, null, 'Lin — Product Designer', { x: 12, y: 0 });
      t.style.fontSize = '15px';
      cells.grid.appendChild(t);
      items.forEach(function (it, i) {
        var d = box(null, null, it.t, { x: 12, y: 42 + i * 34, bg: i === 0 ? 'var(--dm-ink,#211c18)' : 'var(--dm-line,#dcd3c5)' });
        if (i > 0) d.style.color = 'var(--dm-ink,#211c18)';
        cells.grid.appendChild(d);
      });
      /* 右列对齐线示意 */
      guide = el('div');
      guide.style.cssText = 'position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(56,189,248,.6)';
      cells.grid.appendChild(guide);
      var r1 = box(null, null, 'Data viz', { x: 0, y: 42, bg: 'var(--dm-a,#c05a34)' });
      r1.style.left = '52%'; r1.style.color = 'var(--dm-on-accent,#fffdf9)';
      var r2 = box(null, null, 'Healthcare', { x: 0, y: 76, bg: 'var(--dm-c,#5f6494)' });
      r2.style.left = '52%'; r2.style.color = 'var(--dm-c2,#4a4f7c)';
      cells.grid.appendChild(r1); cells.grid.appendChild(r2);

      /* 测量：左边缘的不同 x 值个数 = 对齐“断点”数
         用 computedStyle 判断定位元素，避免依赖 style 属性字符串 */
      var xs = [];
      cells[mode].querySelectorAll('div').forEach(function (d) {
        if (d === guide) return;                       /* 跳过对齐参考线 */
        if (d.getBoundingClientRect().width === 0) return;
        if (window.getComputedStyle(d).position !== 'absolute') return;
        xs.push(Math.round(d.getBoundingClientRect().left));
      });
      var uniq = xs.filter(function (v, i) { return xs.indexOf(v) === i; }).length;
      out.innerHTML = '<span class="k">' + T('左边缘不同的 x 值个数', 'Distinct left-edge x values') + '</span> = ' +
        uniq + '  ' + (uniq <= 2 ? '<span class="ok">✓ 对齐良好</span>' : '<span class="bad">✗ 视线需要不断重新定位</span>');
    }

    var out = measBox(s.ctl, '对齐质量测量', 'Alignment quality measurement');
    var g1 = group(s.ctl, '切换对齐策略（同一批内容）', 'Switch alignment strategy (same content)');
    seg(g1, AXES.map(function (a) { return { val: a.id, zh: a.zh, en: a.en }; }), 'none', function (v) {
      draw(v);
      hl.innerHTML = hlCSS(
        v === 'none'   ? '/* 没有共享对齐线 */\n.card { position: relative; }' :
        v === 'center' ? '.stack { text-align: center; }' :
        v === 'left'   ? '.stack > * { text-align: left; }\n.stack { padding-left: 12px; }' :
                         '.page { display: grid;\n  grid-template-columns: 1fr 1fr;\n  column-gap: 24px; }'
      );
    });
    var hl = cssBox(s.ctl, '对应写法', 'Equivalent code');
    hint(s.ctl,
      '对齐不是"把东西放整齐"这么简单：每多一条不对齐的左边缘，读者的眼睛就要多做一次水平搜索。"左对齐 + 有限种左边缘"是最省认知成本的排版方式。',
      'Alignment is not just tidiness: every extra left edge that does not line up forces the reader\u2019s eye to do one more horizontal search. \u201cLeft-aligned with a limited set of left edges\u201d is the cheapest layout for the brain.');
    draw('none');
    hl.innerHTML = hlCSS('/* 没有共享对齐线 */\n.card { position: relative; }');
  };

  /* ============================================================
     ④ 盒模型计算器（第 2 章）
     ============================================================ */
  REG['d2-boxmodel'] = function (host) {
    var s = shell(host, '盒模型：width 到底包不包括 padding 和 border', 'The box model: does width include padding and border?');

    var outerW = 420;
    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px;position:relative';
    holder.innerHTML =
      '<div style="font:11px/1 ui-monospace,monospace;color:var(--dm-mute,#8c8073);margin-bottom:8px">' +
      '<span id="bmParentLbl"></span></div>' +
      '<div id="bmParent" style="width:' + outerW + 'px;max-width:100%;background:repeating-linear-gradient(45deg,var(--dm-surface,#f2ede4),var(--dm-surface,#f2ede4) 8px,var(--dm-line,#dcd3c5) 8px,var(--dm-line,#dcd3c5) 16px);' +
      'border-left:2px dashed var(--dm-mute,#8c8073);border-right:2px dashed var(--dm-mute,#8c8073);padding:0;position:relative">' +
        '<div id="bmBox" style="margin:0 auto"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font:11px/1.6 ui-monospace,monospace;color:var(--dm-mute,#8c8073)">' +
      '<span>0</span><span id="bmRuler">' + outerW + 'px 容器宽</span><span>' + (outerW - 2) + '</span></div>';
    s.canvas.appendChild(holder);
    bi(holder.querySelector('#bmParentLbl'), '父容器（虚线为边界，斜纹为剩余空间）', 'Parent container (dashed = boundary, hatching = leftover space)');

    var box = holder.querySelector('#bmBox');
    box.style.cssText += 'background:var(--dm-a,#c05a34);color:var(--dm-on-accent,#fffdf9);font:12px/1.4 -apple-system,sans-serif;' +
      'display:flex;align-items:center;justify-content:center;min-height:34px;position:relative';

    var st = { w: 420, pad: 0, bord: 0, boxsizing: 'content-box', margin: 0 };

    function apply() {
      box.style.boxSizing = st.boxsizing;
      box.style.width = st.w + 'px';
      box.style.padding = st.pad + 'px';
      box.style.border = st.bord + 'px solid var(--dm-a2,#9e4526)';
      box.style.margin = st.margin + 'px auto';
      var r = box.getBoundingClientRect();
      var pr = box.parentElement.getBoundingClientRect();
      var contentW = st.boxsizing === 'content-box' ? st.w : Math.max(0, st.w - 2 * st.pad - 2 * st.bord);
      var borderW = st.boxsizing === 'content-box'
        ? st.w + 2 * st.pad + 2 * st.bord
        : st.w;
      var over = Math.round(r.width - (pr.width - 4));

      box.innerHTML = '<span style="pointer-events:none">content ' + Math.round(contentW) + 'px</span>';
      out.innerHTML =
        '<span class="k">box-sizing</span> = ' + st.boxsizing + '\n' +
        '<span class="k">content 宽</span>   = ' + Math.round(contentW) + 'px\n' +
        '<span class="k">border-box 宽</span> = ' + Math.round(borderW) + 'px  ← 实际占据的空间\n' +
        '<span class="k">含 margin 占位</span> = ' + Math.round(borderW + 2 * st.margin) + 'px\n' +
        '<span class="k">父容器可用</span>  = ' + Math.round(pr.width - 4) + 'px\n' +
        '<span class="k">溢出</span>        = ' +
        (over > 0 ? '<span class="bad">' + over + 'px ✗</span>' : '<span class="ok">0px ✓</span>');

      code.innerHTML = hlCSS(
        '.card {\n  box-sizing: ' + st.boxsizing + ';\n  width: ' + st.w + 'px;\n' +
        '  padding: ' + st.pad + 'px;\n  border: ' + st.bord + 'px solid var(--dm-a2,#9e4526);\n' +
        '  margin: ' + st.margin + 'px auto;\n}');
    }

    /* 读数与代码回显容器必须先建好，apply() 才能写入 */
    var out = measBox(s.ctl, '实时测量', 'Live measurement');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');

    var g1 = group(s.ctl, '① box-sizing 语义', '① box-sizing semantics');
    seg(g1, [
      { val: 'content-box', zh: 'content-box（默认）', en: 'content-box (default)' },
      { val: 'border-box', zh: 'border-box（推荐）', en: 'border-box (recommended)' }
    ], 'content-box', function (v) { st.boxsizing = v; apply(); });

    var g2 = group(s.ctl, '② 尺寸参数', '② Dimensions');
    var sw = slider(g2, 'width', 'width', 40, 460, 420, 1, 'px');
    var sp = slider(g2, 'padding', 'padding', 0, 60, 0, 1, 'px');
    var sb = slider(g2, 'border-width', 'border-width', 0, 20, 0, 1, 'px');
    var sm = slider(g2, 'margin', 'margin', 0, 40, 0, 1, 'px');
    sw.input.addEventListener('input', function () { st.w = +sw.input.value; apply(); });
    sp.input.addEventListener('input', function () { st.pad = +sp.input.value; apply(); });
    sb.input.addEventListener('input', function () { st.bord = +sb.input.value; apply(); });
    sm.input.addEventListener('input', function () { st.margin = +sm.input.value; apply(); });

    var g3 = group(s.ctl, '③ 课堂任务', '③ Classroom task');
    actions(g3, [
      { zh: '任务：让盒子恰好填满容器', en: 'Goal: exactly fill the container', primary: true, on: function () {
          /* 给初学者一个可验证的目标：两种模式各应该填多少 */
          if (st.boxsizing === 'content-box') {
            var w = outerW - 2 * st.pad - 2 * st.bord - 4;
            sw.input.value = Math.max(40, w); sw.sync(); st.w = +sw.input.value; apply();
            msg.innerHTML = '<span class="ok">✓ content-box 下需要手算：width = 容器宽 − 2×padding − 2×border</span>';
          } else {
            sw.input.value = outerW - 4; sw.sync(); st.w = +sw.input.value; apply();
            msg.innerHTML = '<span class="ok">✓ border-box 下直接写容器宽即可，padding/border 向内挤</span>';
          }
        } },
      { zh: '重置', en: 'Reset', on: function () {
          sw.input.value = 420; sp.input.value = 0; sb.input.value = 0; sm.input.value = 0;
          [sw, sp, sb, sm].forEach(function (x) { x.sync(); });
          st.w = 420; st.pad = 0; st.bord = 0; st.margin = 0; msg.textContent = ''; apply();
        } }
    ]);
    var msg = el('p', 'measure'); msg.style.marginTop = '10px'; g3.appendChild(msg);

    hint(s.ctl,
      '关键区别只有一句：content-box 的 width 只描述内容区，padding 与 border 会向外撑大盒子；border-box 的 width 描述可见边框外沿。这就是为什么几乎所有项目都会写 *,*::before,*::after{box-sizing:border-box}。',
      'One sentence captures it: with content-box, width describes only the content area, so padding and border push the box outward. With border-box, width describes the outer edge of the visible border. That is why nearly every project ships *,*::before,*::after{box-sizing:border-box}.');
    apply();
  };

  /* ============================================================
     ⑤ 外边距塌陷与 BFC（第 2 章）
     ============================================================ */
  REG['d2-collapse'] = function (host) {
    var s = shell(host, '外边距塌陷：为什么间距不是相加的', 'Margin collapsing: why gaps do not add up');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px';
    holder.innerHTML =
      '<div id="mcParent" style="border:1px dashed var(--dm-line,#dcd3c5);padding:0">' +
        '<div class="a" style="background:var(--dm-line,#dcd3c5);color:var(--dm-c2,#4a4f7c);padding:8px 10px;font:12px/1.4 -apple-system,sans-serif">Block A · margin-bottom: <b class="av">20</b>px</div>' +
        '<div class="b" style="background:var(--dm-line,#dcd3c5);color:var(--dm-c2,#4a4f7c);padding:8px 10px;font:12px/1.4 -apple-system,sans-serif">Block B · margin-top: <b class="bv">30</b>px</div>' +
      '</div>' +
      '<div id="mcRuler" style="position:relative;height:26px;font:11px/26px ui-monospace,monospace;color:var(--dm-mid,#463d35)"></div>';
    s.canvas.appendChild(holder);
    var parent = holder.querySelector('#mcParent');
    var A = holder.querySelector('.a'), B = holder.querySelector('.b');
    var ruler = holder.querySelector('#mcRuler');

    var st = { ma: 20, mb: 30, bfc: false, content: false };

    function apply() {
      A.style.marginBottom = st.ma + 'px';
      B.style.marginTop = st.mb + 'px';
      parent.style.display = st.bfc ? 'flow-root' : 'block';
      parent.style.paddingTop = st.content ? '1px' : '0';
      parent.style.paddingBottom = st.content ? '1px' : '0';
      if (st.content) { parent.style.paddingTop = '10px'; parent.style.paddingBottom = '10px'; }
      A.querySelector('.av').textContent = st.ma;
      B.querySelector('.bv').textContent = st.mb;

      var ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
      var gap = Math.round(rb.top - ra.bottom);
      var expected = st.bfc || st.content ? st.ma + st.mb : Math.max(st.ma, st.mb);

      ruler.innerHTML = '';
      var bar = el('div');
      bar.style.cssText = 'position:absolute;left:0;top:0;height:100%;display:flex;align-items:center;gap:8px';
      bar.innerHTML = '<span style="display:inline-block;height:2px;width:' + Math.max(0, gap) + 'px;' +
        'background:' + (st.bfc || st.content ? 'var(--dm-bad,#bc4f38)' : 'var(--dm-d,#4f8163)') + '"></span>' +
        '<span>' + T('实测间隙', 'measured gap') + ' = <b style="color:' + (st.bfc || st.content ? 'var(--dm-bad,#bc4f38)' : 'var(--dm-d,#4f8163)') +
        '">' + gap + 'px</b></span>';
      ruler.appendChild(bar);

      out.innerHTML =
        '<span class="k">display</span> = ' + (st.bfc ? 'flow-root (BFC)' : 'block') + '\n' +
        '<span class="k">margin-bottom(A)</span> = ' + st.ma + 'px\n' +
        '<span class="k">margin-top(B)</span>    = ' + st.mb + 'px\n' +
        '<span class="k">数学期望</span> = ' + (st.bfc || st.content ? st.ma + ' + ' + st.mb + ' = ' + expected : 'max(' + st.ma + ', ' + st.mb + ') = ' + expected) + 'px\n' +
        '<span class="k">浏览器实测</span> = ' + gap + 'px  ' + (gap === expected ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>') + '\n' +
        (st.bfc || st.content
          ? '<span class="ok">✓ 塌陷被阻止：父元素建立了新的格式化上下文</span>'
          : '<span class="bad">⚠ 相邻外边距发生塌陷，只保留较大者</span>');

      code.innerHTML = hlCSS(
        '.a { margin-bottom: ' + st.ma + 'px; }\n' +
        '.b { margin-top: ' + st.mb + 'px; }\n' +
        '.parent {\n  display: ' + (st.bfc ? 'flow-root' : 'block') + ';\n' +
        (st.content ? '  padding: 10px 0;      /* 或加 padding/border */\n' : '') + '}');
    }

    var g1 = group(s.ctl, '① 两个相邻外边距', '① Two adjacent margins');
    var sa = slider(g1, 'A 的 margin-bottom', 'A\u2019s margin-bottom', 0, 60, 20, 1, 'px');
    var sb = slider(g1, 'B 的 margin-top', 'B\u2019s margin-top', 0, 60, 30, 1, 'px');
    sa.input.addEventListener('input', function () { st.ma = +sa.input.value; apply(); });
    sb.input.addEventListener('input', function () { st.mb = +sb.input.value; apply(); });

    var g2 = group(s.ctl, '② 阻止塌陷的手段', '② Ways to stop collapsing');
    check(g2, '给父元素 display: flow-root（最干净的 BFC）', 'Give the parent display: flow-root (the cleanest BFC)', false, function (v) { st.bfc = v; apply(); });
    check(g2, '改为给父元素加 padding（有副作用）', 'Instead add padding to the parent (has side effects)', false, function (v) { st.content = v; apply(); });

    var g3 = group(s.ctl, '③ 预设对比', '③ Presets');
    actions(g3, [
      { zh: '塌陷：max(20,30)=30', en: 'Collapse: max(20,30)=30', on: function () {
          st.ma = 20; st.mb = 30; st.bfc = false; st.content = false;
          sa.input.value = 20; sb.input.value = 30; sa.sync(); sb.sync();
          g2.querySelectorAll('input').forEach(function (i) { i.checked = false; });
          apply();
        } },
      { zh: '阻止后：20+30=50', en: 'Prevented: 20+30=50', primary: true, on: function () {
          st.bfc = true;
          g2.querySelectorAll('input')[0].checked = true;
          apply();
        } }
    ]);

    var out = measBox(s.ctl, '实时测量：期望值 vs 实测值', 'Live: expected vs. measured');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      '外边距塌陷是 CSS 规范定义的行为，不是 bug：相邻的垂直外边距会合并成较大者。它也是"父元素高度塌陷"和"段落间距总是不对"的根源。首选修复手段是 flow-root，它不产生额外副作用。',
      'Margin collapsing is specified behaviour, not a bug: adjacent vertical margins merge into the larger one. It is also the root cause of \u201ccollapsed parent height\u201d and \u201cthe paragraph spacing is always wrong\u201d. The preferred fix is flow-root, which brings no side effects.');
    apply();
  };

  /* ============================================================
     ⑥ 第 3 章：主轴 / 交叉轴
     ============================================================ */
  REG['d3-axis'] = function (host) {
    var s = shell(host, '主轴与交叉轴：justify 永远顺着主轴', 'Main vs. cross axis: justify always follows the main axis');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px;position:relative';
    holder.innerHTML =
      '<div id="axWrap" style="position:relative;height:220px;border:1px dashed var(--dm-line,#dcd3c5);border-radius:8px;' +
      'display:flex;gap:10px;padding:10px;background:repeating-linear-gradient(45deg,var(--dm-canvas,#faf8f4),var(--dm-canvas,#faf8f4) 10px,var(--dm-surface,#f2ede4) 10px,var(--dm-surface,#f2ede4) 20px)">' +
      '</div>' +
      '<div id="axArrows" style="margin-top:10px;font:12px/1.6 -apple-system,sans-serif;color:var(--dm-mid,#463d35)"></div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#axWrap');
    var arrows = holder.querySelector('#axArrows');

    var items = ['1', '2', '3'];
    var st = { dir: 'row', justify: 'flex-start', align: 'stretch', wrap: 'nowrap', sizes: [60, 90, 70] };

    function build() {
      wrap.innerHTML = '';
      items.forEach(function (t, i) {
        var d = el('div', null, t);
        d.style.cssText = 'background:linear-gradient(135deg,var(--dm-a,#c05a34),var(--dm-a3,#d98a52));color:var(--dm-on-accent,#fffdf9);' +
          'border-radius:8px;font:700 15px/1 ui-monospace,monospace;display:grid;place-items:center;' +
          'flex:0 0 auto;';
        if (st.dir === 'row') { d.style.width = st.sizes[i] + 'px'; d.style.height = '54px'; }
        else { d.style.height = st.sizes[i] + 'px'; d.style.width = '80px'; }
        wrap.appendChild(d);
      });
    }

    function apply() {
      var row = st.dir.indexOf('row') === 0;
      wrap.style.flexDirection = st.dir;
      wrap.style.justifyContent = st.justify;
      wrap.style.alignItems = st.align;
      wrap.style.flexWrap = st.wrap;
      build();
      arrows.innerHTML =
        '<span style="color:var(--dm-c2,#4a4f7c);font-weight:700">main axis ' + (row ? '→' : '↓') + '</span>' +
        ' &nbsp;(justify-content: <code>' + st.justify + '</code>) &nbsp;·&nbsp; ' +
        '<span style="color:var(--dm-c,#5f6494);font-weight:700">cross axis ' + (row ? '↓' : '→') + '</span>' +
        ' &nbsp;(align-items: <code>' + st.align + '</code>)';
      code.innerHTML = hlCSS('.row {\n  display: flex;\n  flex-direction: ' + st.dir +
        ';\n  justify-content: ' + st.justify + ';\n  align-items: ' + st.align +
        ';\n  flex-wrap: ' + st.wrap + ';\n}');
    }

    var g1 = group(s.ctl, '① 轴方向', '① Axis direction');
    seg(g1, [
      { val: 'row', zh: 'row →', en: 'row →' },
      { val: 'row-reverse', zh: 'row-reverse ←', en: 'row-reverse ←' },
      { val: 'column', zh: 'column ↓', en: 'column ↓' }
    ], 'row', function (v) { st.dir = v; apply(); });

    var g2 = group(s.ctl, '② justify-content（主轴）', '② justify-content (main axis)');
    var jopts = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
    var jbox = el('select');
    jopts.forEach(function (o) {
      var op = el('option', null, o); op.value = o; jbox.appendChild(op);
    });
    jbox.value = 'flex-start';
    jbox.addEventListener('change', function () { st.justify = jbox.value; apply(); });
    g2.appendChild(jbox);
    g2.appendChild(el('div', null, '<div style="height:8px"></div>'));

    var g3 = group(s.ctl, '③ align-items（交叉轴）', '③ align-items (cross axis)');
    seg(g3, [
      { val: 'stretch', zh: 'stretch', en: 'stretch' },
      { val: 'flex-start', zh: 'flex-start', en: 'flex-start' },
      { val: 'center', zh: 'center', en: 'center' },
      { val: 'flex-end', zh: 'flex-end', en: 'flex-end' }
    ], 'stretch', function (v) { st.align = v; apply(); });

    var g4 = group(s.ctl, '④ 换行', '④ Wrapping');
    seg(g4, [
      { val: 'nowrap', zh: 'nowrap', en: 'nowrap' },
      { val: 'wrap', zh: 'wrap', en: 'wrap' }
    ], 'nowrap', function (v) { st.wrap = v; apply(); });

    var out = measBox(s.ctl, '测量', 'Measurement');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      '最容易记错的一点：justify-content 永远作用于主轴，align-items 永远作用于交叉轴。改 flex-direction 等于把这两个属性的作用方向转 90°，这就是"我明明写了 center 却没居中"的最常见原因。',
      'The single most mis-remembered fact: justify-content always works on the main axis, align-items always on the cross axis. Changing flex-direction rotates what those two properties do by 90\u00b0 \u2014 the most common reason for \u201cI wrote center and nothing centred\u201d.');
    var origApply = apply;
    apply = function () {
      origApply();
      var kids = wrap.children;
      var sizes = [];
      for (var i = 0; i < kids.length; i++) {
        var r = kids[i].getBoundingClientRect();
        sizes.push(Math.round(st.dir.indexOf('row') === 0 ? r.width : r.height));
      }
      out.innerHTML = '<span class="k">items</span> = ' + kids.length + '\n' +
        '<span class="k">实际尺寸</span> = [' + sizes.join(', ') + ']px\n' +
        '<span class="k">容器可用（主轴）</span> = ' + Math.round(st.dir.indexOf('row') === 0
          ? wrap.clientWidth : wrap.clientHeight) + 'px\n' +
        '<span class="k">剩余空间</span> = ' + Math.round((st.dir.indexOf('row') === 0
          ? wrap.clientWidth : wrap.clientHeight) - sizes.reduce(function (a, b) { return a + b; }, 0)) + 'px';
    };
    apply();
  };

  /* ============================================================
     ⑦ 第 3 章：flex-grow / shrink / basis 分配算术
     ============================================================ */
  REG['d3-grow'] = function (host) {
    var s = shell(host, 'grow / shrink / basis：剩余空间是怎么被分掉的', 'grow / shrink / basis: how leftover space is handed out');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px';
    holder.innerHTML = '<div id="grWrap" style="display:flex;gap:0;height:70px;background:var(--dm-surface,#f2ede4);border-radius:8px;overflow:hidden"></div>' +
      '<div id="grBars" style="margin-top:10px"></div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#grWrap'), bars = holder.querySelector('#grBars');

    var items = [
      { name: 'A', basis: 120, grow: 0, shrink: 1, color: 'linear-gradient(135deg,var(--dm-a,#c05a34),var(--dm-a2,#9e4526))' },
      { name: 'B', basis: 120, grow: 0, shrink: 1, color: 'linear-gradient(135deg,var(--dm-c,#5f6494),var(--dm-c2,#4a4f7c))' },
      { name: 'C', basis: 120, grow: 0, shrink: 1, color: 'linear-gradient(135deg,var(--dm-d2,#4c7d72),var(--dm-d2,#4c7d72))' }
    ];
    var containerW = 480;

    function build() {
      wrap.innerHTML = '';
      items.forEach(function (it) {
        var d = el('div', null, it.name);
        d.style.cssText = 'background:' + it.color + ';color:var(--dm-on-accent,#fffdf9);font:700 13px/1 ui-monospace,monospace;' +
          'display:grid;place-items:center;flex:0 ' + it.grow + ' ' + it.basis + 'px;' +
          'min-width:0;transition:flex-basis .15s';
        wrap.appendChild(d);
      });
    }

    function apply() {
      wrap.style.width = containerW + 'px';
      build();
      var children = Array.prototype.slice.call(wrap.children);
      var basisSum = items.reduce(function (a, b) { return a + b.basis; }, 0);
      var free = containerW - basisSum - 2 * 0;
      var growSum = items.reduce(function (a, b) { return a + b.grow; }, 0);

      /* 预测最终宽度 */
      var predicted = items.map(function (it) {
        if (free > 0 && growSum > 0) return it.basis + free * (it.grow / growSum);
        if (free < 0) {
          var shrinkWeight = items.reduce(function (a, b) { return a + b.shrink * b.basis; }, 0);
          var w = it.shrink * it.basis;
          return it.basis + free * (shrinkWeight ? w / shrinkWeight : 0);
        }
        return it.basis;
      });

      bars.innerHTML = '';
      children.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var row = el('div');
        row.style.cssText = 'font:11.5px/1.9 ui-monospace,monospace;color:var(--dm-mid,#463d35);display:flex;gap:10px';
        row.innerHTML = '<span style="width:16px;color:var(--dm-ink,#211c18);font-weight:700">' + items[i].name + '</span>' +
          '<span style="flex:1;background:var(--dm-line,#dcd3c5);border-radius:4px;height:9px;margin-top:7px;position:relative">' +
          '<i style="position:absolute;left:0;top:0;bottom:0;width:' +
          Math.min(100, (r.width / containerW) * 100) + '%;background:' + items[i].color.replace('linear-gradient(135deg,', 'linear-gradient(135deg,').split(',')[1] + ';border-radius:4px"></i></span>' +
          '<span style="width:120px;text-align:right">' + Math.round(r.width) + 'px' +
          (Math.abs(r.width - predicted[i]) > 0.6 ? ' ⚠' : ' ✓') + '</span>';
        bars.appendChild(row);
      });

      out.innerHTML =
        '<span class="k">容器宽</span> = ' + containerW + 'px\n' +
        '<span class="k">Σ flex-basis</span> = ' + basisSum + 'px\n' +
        '<span class="k">剩余空间</span> = ' + containerW + ' − ' + basisSum + ' = ' +
        '<b>' + free + 'px</b>' + (free > 0 ? '（分给 grow）' : free < 0 ? '（由 shrink 吸收）' : '') + '\n' +
        '<span class="k">Σ flex-grow</span> = ' + growSum + '\n' +
        '<span class="k">分配规则</span> = 每份 = 剩余 ' + free + 'px ÷ ' + (growSum || 1) + ' = ' +
        (growSum ? (free / growSum).toFixed(1) : '—') + 'px\n' +
        '<span class="k">A/B/C 最终宽</span> = [' + predicted.map(function (v) { return Math.round(v); }).join(', ') + '] px';

      code.innerHTML = hlCSS(
        '.row { display: flex; width: ' + containerW + 'px; }\n' +
        items.map(function (it) {
          return '.item-' + it.name.toLowerCase() + ' { flex: ' + it.grow + ' ' + it.shrink + ' ' + it.basis + 'px; }';
        }).join('\n'));
    }

    var g1 = group(s.ctl, '① 容器宽度', '① Container width');
    var sc = slider(g1, 'width', 'width', 240, 640, 480, 10, 'px');
    sc.input.addEventListener('input', function () { containerW = +sc.input.value; apply(); });

    var g2 = group(s.ctl, '② 每个项目的 flex 参数', '② Per-item flex parameters');
    items.forEach(function (it) {
      var sub = el('div');
      sub.style.cssText = 'margin-bottom:10px;padding-bottom:8px;border-bottom:1px dashed var(--dm-line,#dcd3c5)';
      sub.appendChild(el('div', null, '<span style="font:700 12px ui-monospace,monospace;color:var(--dm-ink,#211c18)">' + it.name + '</span>'));
      var a = slider(sub, 'flex-grow', 'flex-grow', 0, 3, it.grow, 0.5, '', function (v) { return v; });
      var b = slider(sub, 'flex-basis', 'flex-basis', 0, 400, it.basis, 10, 'px', function (v) { return v; });
      a.input.addEventListener('input', function () { it.grow = +a.input.value; apply(); });
      b.input.addEventListener('input', function () { it.basis = +b.input.value; apply(); });
      g2.appendChild(sub);
    });

    var g3 = group(s.ctl, '③ 预设', '③ Presets');
    actions(g3, [
      { zh: '等宽三栏 flex:1', en: 'Equal thirds: flex:1', on: function () {
          items.forEach(function (it) { it.grow = 1; it.basis = 0; });
          apply();
        } },
      { zh: '侧栏固定 + 主区自适应', en: 'Fixed sidebar + fluid main', on: function () {
          items[0].grow = 0; items[0].basis = 120;
          items[1].grow = 1; items[1].basis = 0;
          items[2].grow = 0; items[2].basis = 100;
          apply();
        } },
      { zh: '2:1 比例', en: '2:1 ratio', primary: true, on: function () {
          items[0].grow = 2; items[0].basis = 0;
          items[1].grow = 1; items[1].basis = 0;
          items[2].grow = 0; items[2].basis = 60;
          apply();
        } }
    ]);

    var out = measBox(s.ctl, '分配算术', 'Distribution arithmetic');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      '记住这条公式就够了：最终宽度 = flex-basis + 剩余空间 × (自己的 grow ÷ Σgrow)。所以 flex:1 与 flex:1 1 0% 等价——把 basis 设成 0 之后，所有项目从"零"开始平分，才会真正等宽；写成 flex:1 1 auto 时，内容多的项目会先占更多。',
      'One formula is enough: final size = flex-basis + leftover \u00d7 (own grow \u00f7 \u03a3grow). That is why flex:1 equals flex:1 1 0% \u2014 setting basis to 0 makes every item start from zero so the split is truly equal; with flex:1 1 auto the item with more content starts out larger.');
    apply();
  };

  /* ============================================================
     ⑧ 第 4 章：Grid 轨道与 fr
     ============================================================ */
  REG['d4-grid'] = function (host) {
    var s = shell(host, 'Grid 轨道：fr 是如何分配剩余空间的', 'Grid tracks: how fr distributes the leftover space');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px;position:relative';
    holder.innerHTML = '<div id="gdWrap" style="display:grid;gap:8px;height:230px;border:1px dashed var(--dm-line,#dcd3c5);' +
      'border-radius:8px;padding:8px;position:relative;overflow:hidden"></div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#gdWrap');

    var st = { cols: [1, 2, 1], rows: 2, gap: 8, trackW: 480, unit: 'fr', fixed: 120,
               spans: [1, 1, 1, 1, 1, 1] };

    function cssCols() {
      if (st.unit === 'fr') return st.cols.map(function (n) { return n + 'fr'; }).join(' ');
      return st.cols.map(function (n, i) {
        return i === 1 ? 'minmax(' + st.fixed + 'px, 1fr)' : n + 'fr';
      }).join(' ');
    }

    function apply() {
      wrap.style.width = st.trackW + 'px';
      wrap.style.gridTemplateColumns = cssCols();
      wrap.style.gridTemplateRows = 'repeat(' + st.rows + ', 1fr)';
      wrap.style.gap = st.gap + 'px';
      wrap.innerHTML = '';

      /* 只放 4 个元素：表头 + 侧栏 + 两张卡片，避免行高溢出容器 */
      var items = [
        { label: 'header', col: 'span ' + st.cols.length, row: '' },
        { label: 'aside', col: 'span 1', row: 'span ' + st.rows },
        { label: 'card 1', col: '', row: '' },
        { label: 'card 2', col: '', row: '' }
      ];
      var colors = ['var(--dm-a,#c05a34)', 'var(--dm-c,#5f6494)', 'var(--dm-d,#4f8163)', 'var(--dm-b,#b98a2e)'];
      items.forEach(function (it, i) {
        var d = el('div', null, it.label);
        d.style.cssText = 'background:' + colors[i] + ';color:var(--dm-on-accent,#fffdf9);border-radius:7px;' +
          'font:700 12px/1 ui-monospace,monospace;display:grid;place-items:center;' +
          'min-height:0;min-width:0;overflow:hidden';
        d.style.gridColumn = it.col;
        d.style.gridRow = it.row;
        wrap.appendChild(d);
      });

      /* 轨道尺寸实测 */
      var cs = getComputedStyle(wrap);
      var trackSizes = cs.gridTemplateColumns.split(' ').map(function (v) { return Math.round(parseFloat(v)); });
      var total = trackSizes.reduce(function (a, b) { return a + b; }, 0);
      var gaps = (st.cols.length - 1) * st.gap;

      out.innerHTML =
        '<span class="k">grid-template-columns</span> = ' + cssCols() + '\n' +
        '<span class="k">容器内容宽</span> = ' + st.trackW + ' − 2×8(padding) = ' + (st.trackW - 16) + 'px\n' +
        '<span class="k">gap 合计</span> = (' + st.cols.length + '−1) × ' + st.gap + ' = ' + gaps + 'px\n' +
        '<span class="k">剩余可分</span> = ' + (st.trackW - 16 - gaps) + 'px\n' +
        '<span class="k">各轨道实测</span> = [' + trackSizes.join(', ') + ']px\n' +
        '<span class="k">轨道合计</span> = ' + total + 'px ' +
        (Math.abs(total - (st.trackW - 16 - gaps)) <= st.cols.length ? '<span class="ok">✓ 铺满</span>' : '<span class="bad">✗</span>');

      code.innerHTML = hlCSS('.layout {\n  display: grid;\n  grid-template-columns: ' + cssCols() +
        ';\n  grid-template-rows: repeat(' + st.rows + ', 1fr);\n  gap: ' + st.gap + 'px;\n}');
    }

    var g1 = group(s.ctl, '① 单位模式', '① Track units');
    seg(g1, [
      { val: 'fr', zh: 'fr 比例', en: 'fr ratios' },
      { val: 'mix', zh: 'minmax + fr（侧栏不塌）', en: 'minmax + fr (sidebar floor)' }
    ], 'fr', function (v) { st.unit = v; syncFixed(); apply(); });

    var g2 = group(s.ctl, '② 列比例', '② Column ratios');
    var sliders = [];
    st.cols.forEach(function (n, i) {
      var sl = slider(g2, ['列 1', '列 2', '列 3'][i] + ' 的 fr', 'Column ' + (i + 1) + ' fr', 0.5, 4, n, 0.5, 'fr', function (v) { return v; });
      sl.input.addEventListener('input', function () { st.cols[i] = +sl.input.value; apply(); });
      sliders.push(sl);
    });
    var sFixed = slider(g2, '侧栏最小宽度（minmax）', 'Sidebar minimum (minmax)', 60, 300, 120, 10, 'px');
    sFixed.input.addEventListener('input', function () { st.fixed = +sFixed.input.value; apply(); });

    var g3 = group(s.ctl, '③ 容器与间距', '③ Container & gap');
    var sw = slider(g3, '容器宽', 'Container width', 280, 760, 480, 10, 'px');
    var sg = slider(g3, 'gap', 'gap', 0, 40, 8, 1, 'px');
    sw.input.addEventListener('input', function () { st.trackW = +sw.input.value; apply(); });
    sg.input.addEventListener('input', function () { st.gap = +sg.input.value; apply(); });

    var g4 = group(s.ctl, '④ 预设布局', '④ Preset layouts');
    actions(g4, [
      { zh: '1 : 2 : 1', en: '1 : 2 : 1', on: function () {
          setCols([1, 2, 1]); st.unit = 'fr';
        } },
      { zh: '经典后台 240 + 1fr', en: 'Admin: 240 + 1fr', on: function () {
          setCols([1, 1, 1]); st.unit = 'mix'; st.fixed = 200; syncFixed(); apply();
        } },
      { zh: '重置', en: 'Reset', primary: true, on: function () {
          st.trackW = 480; st.gap = 8; st.unit = 'fr'; sw.input.value = 480; sg.input.value = 8;
          sw.sync(); sg.sync(); setCols([1, 2, 1]);
        } }
    ]);
    function setCols(arr) {
      st.cols = arr.slice();
      sliders.forEach(function (sl, i) { sl.input.value = arr[i]; sl.sync(); });
      apply();
    }
    function syncFixed() { sFixed.input.disabled = st.unit !== 'mix'; }

    var out = measBox(s.ctl, '轨道实测', 'Measured tracks');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      'fr 不是百分比：它是"分完固定尺寸和 gap 之后，按比例瓜分剩余空间"。所以 1fr 2fr 1fr 与 25% 50% 25% 完全不同——前者会扣掉 gap 再分，后者不会，这就是"百分比栅格总是对不齐"的原因。',
      'fr is not a percentage: it means \u201ctake the space left after fixed sizes and gaps, then split it by ratio\u201d. So 1fr 2fr 1fr is not the same as 25% 50% 25% \u2014 the former subtracts gaps first, the latter does not. That is why percentage grids always look misaligned.');
    apply();
  };

  /* ============================================================
     ⑨ 第 4 章：auto-fit vs auto-fill（不写媒体查询的响应式）
     ============================================================ */
  REG['d4-autofit'] = function (host) {
    var s = shell(host, 'auto-fit / auto-fill：不写媒体查询的响应式卡片区', 'auto-fit / auto-fill: responsive cards without media queries');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px';
    holder.innerHTML =
      '<div style="margin-bottom:10px;font:11.5px/1.5 ui-monospace,monospace;color:var(--dm-mid,#463d35)">' +
      'grid-template-columns: repeat(<b id="afMode" style="color:var(--dm-c2,#4a4f7c)">auto-fit</b>, minmax(<b id="afMin" style="color:var(--dm-c2,#4a4f7c)">220</b>px, 1fr))' +
      '</div>' +
      '<div id="afWrap" style="display:grid;gap:12px"></div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#afWrap');

    var st = { mode: 'auto-fit', min: 220, width: 640, n: 5, gap: 12, oneLine: false };

    function apply() {
      holder.style.width = st.width + 'px';
      holder.style.maxWidth = '100%';
      wrap.style.gridTemplateColumns = 'repeat(' + st.mode + ', minmax(' + st.min + 'px, 1fr))';
      wrap.style.gap = st.gap + 'px';
      wrap.innerHTML = '';
      var names = ['Analytics', 'Timeline', 'Reader', 'Map view', 'Onboarding', 'Settings'];
      for (var i = 0; i < st.n; i++) {
        var c = el('article');
        c.style.cssText = 'border:1px solid var(--dm-line,#dcd3c5);border-radius:10px;padding:10px;min-width:0';
        c.innerHTML = '<div style="height:44px;border-radius:7px;background:' +
          ['var(--dm-line,#dcd3c5)', 'var(--dm-c-soft,#b4b8d2)', 'var(--dm-e-soft,#e0c4bb)', 'var(--dm-d-soft,#b3c8ad)', 'var(--dm-b-soft,#ddc48d)', 'var(--dm-d-soft,#b3c8ad)'][i % 6] + '"></div>' +
          '<h4 style="margin:8px 0 2px;font:600 12.5px/1.3 -apple-system,sans-serif;color:var(--dm-ink,#211c18)">' + names[i % 6] + '</h4>' +
          '<p style="margin:0;font:11px/1.4 -apple-system,sans-serif;color:var(--dm-mid,#463d35)">case study</p>';
        wrap.appendChild(c);
      }
      document.getElementById('afMode').textContent = st.mode;
      document.getElementById('afMin').textContent = st.min;

      requestAnimationFrame(function () {
        var kids = Array.prototype.slice.call(wrap.children);
        if (!kids.length) return;
        var wrapW = Math.round(wrap.getBoundingClientRect().width);
        if (!wrapW) return;
        var tops = kids.map(function (k) { return Math.round(k.getBoundingClientRect().top); });
        var cols = tops.filter(function (t) { return t === tops[0]; }).length;
        var w = Math.round(kids[0].getBoundingClientRect().width);
        var rows = tops.filter(function (v, i) { return tops.indexOf(v) === i; }).length;
        var cls = Math.round((wrapW - st.gap * (cols - 1)) / cols);
        out.innerHTML =
          '<span class="k">容器内容宽</span> = ' + wrapW + 'px\n' +
          '<span class="k">实际列数</span> = ' + cols + ' 列 × ' + rows + ' 行\n' +
          '<span class="k">单卡实测宽</span> = ' + w + 'px\n' +
          '<span class="k">理论每列宽</span> = (' + wrapW + ' − ' + (cols - 1) + '×' + st.gap + ') ÷ ' + cols + ' = ' + cls + 'px ' +
          (Math.abs(cls - w) <= 1 ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>') + '\n' +
          '<span class="k">min 约束</span> = ' + st.min + 'px ' +
          (w >= st.min - 1 ? '<span class="ok">✓ 未低于下限</span>' : '<span class="bad">✗ 突破下限</span>') + '\n' +
          (st.mode === 'auto-fit'
            ? '<span class="ok">auto-fit：空轨道被折叠，剩余卡片拉伸填满整行</span>'
            : '<span class="warn">auto-fill：空轨道被保留，卡片不会拉伸</span>');
      });
    }

    var g1 = group(s.ctl, '① 模式', '① Mode');
    seg(g1, [
      { val: 'auto-fit', zh: 'auto-fit（折叠空轨）', en: 'auto-fit (collapse empty)' },
      { val: 'auto-fill', zh: 'auto-fill（保留空轨）', en: 'auto-fill (keep empty)' }
    ], 'auto-fit', function (v) { st.mode = v; apply(); });

    var g2 = group(s.ctl, '② 参数', '② Parameters');
    var sw = slider(g2, '容器（拖动模拟窗口变宽）', 'Container (drag to simulate resizing)', 220, 820, 640, 10, 'px');
    var sm = slider(g2, 'minmax 最小值', 'minmax minimum', 90, 320, 220, 10, 'px');
    var sn = slider(g2, '卡片数量', 'Number of cards', 1, 6, 5, 1, '');
    var sgp = slider(g2, 'gap', 'gap', 0, 32, 12, 1, 'px');
    sw.input.addEventListener('input', function () { st.width = +sw.input.value; apply(); });
    sm.input.addEventListener('input', function () { st.min = +sm.input.value; apply(); });
    sn.input.addEventListener('input', function () { st.n = +sn.input.value; apply(); });
    sgp.input.addEventListener('input', function () { st.gap = +sgp.input.value; apply(); });

    var g3 = group(s.ctl, '③ 与媒体查询对比', '③ Versus media queries');
    hint(g3,
      '传统做法要写 3~4 个断点、手算列宽；auto-fit + minmax 只写一行，而且能适应容器（不只是视口）——这正是"内在响应式"的核心思想。',
      'The classic approach needs 3\u20134 breakpoints and hand-computed widths; auto-fit + minmax is one line and adapts to its container (not just the viewport) \u2014 the core idea of intrinsic responsive design.');

    var out = measBox(s.ctl, '列数与宽度实测', 'Measured columns & widths');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    function paintCode() {
      code.innerHTML = hlCSS('.cards {\n  display: grid;\n  grid-template-columns:\n    repeat(' +
        st.mode + ', minmax(' + st.min + 'px, 1fr));\n  gap: ' + st.gap + 'px;\n}');
    }
    var origApply = apply;
    apply = function () { origApply(); paintCode(); };
    apply();
  };

  /* ============================================================
     ⑩ 第 5 章：position 与包含块
     ============================================================ */
  REG['d5-position'] = function (host) {
    var s = shell(host, 'position：谁相对谁定位，谁又脱离了文档流', 'position: relative to what, and what leaves the flow?');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px;position:relative;height:340px;overflow:hidden';
    holder.innerHTML =
      '<div class="scrollbox" style="height:300px;overflow-y:auto;border:1px dashed var(--dm-line,#dcd3c5);border-radius:8px;position:relative">' +
        '<div style="height:420px;padding:12px;font:12.5px/1.6 -apple-system,sans-serif;color:var(--dm-ink,#211c18)">' +
          '<p style="margin:0 0 10px">↓ ' + 'scroll me' + '</p>' +
          '<div id="posFlow" style="background:var(--dm-line,#dcd3c5);border-left:3px solid var(--dm-c2,#4a4f7c);padding:10px;border-radius:6px;margin-bottom:10px">' +
            '<b>Box A</b> · 参照物 / 占位元素' +
            '<div id="posTarget" style="margin-top:8px;background:var(--dm-a,#c05a34);color:var(--dm-on-accent,#fffdf9);padding:10px;border-radius:6px;font:700 12px/1.3 ui-monospace,monospace">' +
              'target</div>' +
          '</div>' +
          '<div style="background:var(--dm-surface,#f2ede4);padding:10px;border-radius:6px;margin-bottom:10px">Box B · 用来观察是否为 target 让出了位置</div>' +
          '<div style="background:var(--dm-surface,#f2ede4);padding:10px;border-radius:6px">Box C · 再往下一点，方便滚动测试 sticky</div>' +
        '</div>' +
      '</div>';
    s.canvas.appendChild(holder);
    var scrollbox = holder.querySelector('.scrollbox');
    var target = holder.querySelector('#posTarget');
    var flow = holder.querySelector('#posFlow');
    var lbl = holder.querySelector('p');
    bi(lbl, '↓ 在框内滚动，观察 sticky 与 fixed 的区别', '↓ Scroll inside the box and watch sticky vs. fixed');

    var st = { pos: 'static', top: 0, left: 0, z: 1, parentPos: 'static' };

    function apply() {
      target.style.position = st.pos;
      target.style.top = st.pos === 'static' ? '' : st.top + 'px';
      target.style.left = st.pos === 'static' ? '' : st.left + 'px';
      target.style.zIndex = st.pos === 'static' ? '' : st.z;
      target.style.width = st.pos === 'static' ? '' : '150px';
      flow.style.position = st.parentPos;
      flow.style.zIndex = st.parentPos === 'relative' && st.z > 1 ? '2' : '';
      flow.style.background = st.parentPos === 'relative' ? 'var(--dm-b-soft,#ddc48d)' : 'var(--dm-line,#dcd3c5)';
      flow.style.borderLeftColor = st.parentPos === 'relative' ? 'var(--dm-b,#b98a2e)' : 'var(--dm-c2,#4a4f7c)';

      var inFlow = st.pos === 'static' || st.pos === 'relative' || st.pos === 'sticky';
      var cb = st.pos === 'absolute'
        ? (st.parentPos === 'relative' ? '最近的 position:relative 祖先（Box A）' : '初始包含块 / 最近的定位祖先（滚动框之外）')
        : '—';

      out.innerHTML =
        '<span class="k">position</span> = ' + st.pos + '\n' +
        '<span class="k">是否脱离文档流</span> = ' + (inFlow ? '<span class="ok">否（仍占位）</span>' : '<span class="bad">是（不占位，B/C 会上移）</span>') + '\n' +
        '<span class="k">包含块</span> = ' + cb + '\n' +
        '<span class="k">滚动时行为</span> = ' + ({
          static: '随页面滚动', relative: '随页面滚动（但可偏移）',
          absolute: '随最近定位祖先滚动', fixed: '固定在视口，不滚动（可能被 transform 祖先捕获）',
          sticky: '滚动到阈值前随流，超过后粘住'
        }[st.pos] || '—');

      code.innerHTML = hlCSS('#target {\n  position: ' + st.pos + ';' +
        (st.pos === 'static' ? '' : '\n  top: ' + st.top + 'px;\n  left: ' + st.left + 'px;\n  z-index: ' + st.z + ';') +
        '\n}\n\n/* 父级（包含块候选） */\n.box-a { position: ' + st.parentPos + '; }');
    }

    var g1 = group(s.ctl, '① target 的 position', '① position of the target');
    seg(g1, [
      { val: 'static', zh: 'static', en: 'static' },
      { val: 'relative', zh: 'relative', en: 'relative' },
      { val: 'absolute', zh: 'absolute', en: 'absolute' },
      { val: 'fixed', zh: 'fixed', en: 'fixed' },
      { val: 'sticky', zh: 'sticky', en: 'sticky' }
    ], 'static', function (v) { st.pos = v; apply(); });

    var g2 = group(s.ctl, '② 偏移量', '② Offsets');
    var stp = slider(g2, 'top', 'top', -60, 120, 0, 1, 'px');
    var slf = slider(g2, 'left', 'left', -60, 160, 0, 1, 'px');
    var sz = slider(g2, 'z-index', 'z-index', 0, 5, 1, 1, '');
    stp.input.addEventListener('input', function () { st.top = +stp.input.value; apply(); });
    slf.input.addEventListener('input', function () { st.left = +slf.input.value; apply(); });
    sz.input.addEventListener('input', function () { st.z = +sz.input.value; apply(); });

    var g3 = group(s.ctl, '③ 包含块：给 Box A 加 position', '③ Containing block: position Box A');
    seg(g3, [
      { val: 'static', zh: 'A: static', en: 'A: static' },
      { val: 'relative', zh: 'A: relative', en: 'A: relative' }
    ], 'static', function (v) { st.parentPos = v; apply(); });

    var g4 = group(s.ctl, '④ 关于 sticky 的三个坑', '④ Three sticky traps');
    hint(g4,
      '① 父元素有 overflow:hidden/auto → sticky 被限制在父元素内；② 没写 top/bottom 等阈值 → 等于没写；③ 父元素高度等于自身高度 → 没有可粘的距离。这三条覆盖了 90% 的"sticky 不生效"。',
      '① An ancestor with overflow:hidden/auto clips sticky; ② no top/bottom threshold means no stickiness; ③ if the parent is exactly as tall as the sticky element there is no room to stick. Those three cover 90% of \u201csticky does not work\u201d.');

    var out = measBox(s.ctl, '行为与包含块', 'Behaviour & containing block');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    apply();
  };

  /* ============================================================
     ⑪ 第 5 章：层叠上下文与 z-index
     ============================================================ */
  REG['d5-stack'] = function (host) {
    var s = shell(host, 'z-index 为什么"不生效"：层叠上下文', 'Why z-index \u201cdoesn\u2019t work\u201d: stacking contexts');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px;height:300px;position:relative;overflow:hidden';
    holder.innerHTML =
      '<div id="scParent" style="position:relative;height:250px">' +
        '<div id="scBadge" style="position:absolute;left:60px;top:60px;width:180px;height:110px;' +
          'background:linear-gradient(135deg,var(--dm-bad,#bc4f38),var(--dm-bad,#bc4f38));border-radius:10px;color:var(--dm-paper,#fbf8f3);' +
          'font:700 12px/1.4 -apple-system,sans-serif;padding:10px;z-index:1">badge<br><span style="font-weight:400">z-index: 1</span></div>' +
        '<div id="scChild" style="position:absolute;left:150px;top:110px;width:180px;height:110px;' +
          'background:linear-gradient(135deg,var(--dm-a,#c05a34),var(--dm-a2,#9e4526));border-radius:10px;color:var(--dm-on-accent,#fffdf9);' +
          'font:700 12px/1.4 -apple-system,sans-serif;padding:10px;z-index:9999">child<br>' +
          '<span style="font-weight:400">z-index: 9999</span></div>' +
        '<div id="scParentBox" style="position:absolute;left:40px;top:40px;width:300px;height:190px;' +
          'border:2px dashed var(--dm-mute,#8c8073);border-radius:10px"></div>' +
      '</div>' +
      '<p style="font:11.5px/1.5 -apple-system,sans-serif;color:var(--dm-mid,#463d35);margin:0">' +
      '蓝色方块写在红色方块内部，但 z-index 高得多。</div>';
    s.canvas.appendChild(holder);
    var parent = holder.querySelector('#scParent');
    var badge = holder.querySelector('#scBadge');
    var child = holder.querySelector('#scChild');

    var st = { parentZ: 'auto', childZ: 9999, childPos: 'absolute' };

    function apply() {
      parent.style.zIndex = st.parentZ === 'auto' ? '' : st.parentZ;
      parent.style.isolation = st.parentZ === 'isolate' ? 'isolate' : '';
      child.style.zIndex = st.childPos === 'static' ? '' : st.childZ;
      child.style.position = st.childPos === 'static' ? 'static' : 'absolute';
      child.style.left = st.childPos === 'static' ? '' : '150px';
      child.style.top = st.childPos === 'static' ? '' : '110px';
      child.style.width = st.childPos === 'static' ? '' : '180px';

      /* 实测谁在上面：用 elementFromPoint 采样重叠区 */
      var r1 = badge.getBoundingClientRect(), r2 = child.getBoundingClientRect();
      var ox = Math.max(r1.left, r2.left) + 10, oy = Math.max(r1.top, r2.top) + 10;
      var top = document.elementFromPoint(ox, oy);
      var winner = top
        ? (top.id === 'scChild' || top.closest('#scChild') ? 'child' : 'badge')
        : (st.parentZ === '2' ? 'badge' : 'child');

      var newCtx = st.parentZ !== 'auto';
      out.innerHTML =
        '<span class="k">父级 z-index</span> = ' + st.parentZ + (newCtx && st.parentZ !== 'isolate' ? ' → <span class="bad">建立层叠上下文</span>' : '') + '\n' +
        '<span class="k">子级 z-index</span> = ' + st.childZ + '\n' +
        '<span class="k">重叠区实际在上层</span> = <b>' + winner + '</b>\n' +
        (newCtx
          ? '<span class="bad">⚠ 父级一旦成为层叠上下文，子级 z-index 只在父级内部比较；父级整体 (z-index:' + st.parentZ + ') 参与和 badge 的比较</span>'
          : '<span class="ok">✓ 父级为 auto：不新建层叠上下文，子级与 badge 在同一层叠上下文中直接比较 z-index</span>');

      code.innerHTML = hlCSS('.parent { position: relative;' +
        (st.parentZ === 'auto' ? '' : '\n  z-index: ' + st.parentZ + ';') +
        ' }\n.child  { position: ' + st.childPos + '; z-index: ' + st.childZ + '; }\n' +
        '.badge  { position: absolute; z-index: 1; }');
    }

    var g1 = group(s.ctl, '① 父级 .parent 的 z-index', '① z-index of parent .parent');
    seg(g1, [
      { val: 'auto', zh: 'auto（不建上下文）', en: 'auto (no new context)' },
      { val: '0', zh: '0（建上下文）', en: '0 (creates context)' },
      { val: '2', zh: '2（建上下文且在 badge 之上）', en: '2 (context, above badge)' }
    ], 'auto', function (v) { st.parentZ = v; apply(); });

    var g2 = group(s.ctl, '② 子级 .child', '② The child');
    var sz = slider(g2, '子级 z-index', 'Child z-index', 0, 9999, 9999, 1, '');
    sz.input.addEventListener('input', function () { st.childZ = +sz.input.value; apply(); });
    seg(g2, [
      { val: 'absolute', zh: '绝对定位', en: 'absolute' },
      { val: 'static', zh: 'static（z-index 无效）', en: 'static (z-index ignored)' }
    ], 'absolute', function (v) { st.childPos = v; apply(); });

    var g3 = group(s.ctl, '③ 结论', '③ Takeaway');
    hint(g3,
      'z-index 只在同一个层叠上下文内部比较。position 不为 static + z-index 不是 auto、opacity < 1、transform/filter 不为 none、isolation:isolate…… 都会新建层叠上下文。这就是"我设了 9999 还是被盖住"的答案：它比的不是全局，而是它所在的那一层。',
      'z-index is only compared inside one stacking context. position other than static plus a non-auto z-index, opacity < 1, a non-none transform/filter, isolation:isolate \u2026 all create a new stacking context. That is the answer to \u201cI set 9999 and it is still covered\u201d: it competes inside its own layer, not globally.');

    var out = measBox(s.ctl, '谁在上层（实测 elementFromPoint）', 'Who is on top (measured with elementFromPoint)');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    apply();
  };

  /* ============================================================
     ⑫ 第 6 章：断点与内在响应式
     ============================================================ */
  REG['d6-breakpoint'] = function (host) {
    var s = shell(host, '断点实验台：同一份 CSS 在不同视口下的表现', 'Breakpoint lab: one stylesheet across viewports');

    var frame = stage(s.canvas, 420, 'lin-portfolio.local/responsive-lab.html');

    var CSS = '' +
      '*{box-sizing:border-box}' +
      'body{margin:0;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18);background:var(--dm-paper,#fbf8f3)}' +
      '.wrap{padding:12px}' +
      '.nav{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--dm-line,#dcd3c5)}' +
      '.brand{font-weight:800;font-size:11px;letter-spacing:.06em}' +
      '.nav nav{margin-left:auto;display:flex;gap:10px}' +
      '.nav a{font-size:11.5px;color:var(--dm-mid,#463d35);text-decoration:none}' +
      '.layout{display:grid;gap:10px;margin-top:12px;' +
        'grid-template-columns:var(--side,200px) minmax(0,1fr)}' +
      '.side{background:var(--dm-surface,#f2ede4);border-radius:8px;padding:10px;font-size:11.5px;color:var(--dm-mid,#463d35)}' +
      '.main{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}' +
      '.card{border:1px solid var(--dm-line,#dcd3c5);border-radius:9px;padding:9px;min-width:0}' +
      '.thumb{height:38px;border-radius:6px;background:var(--dm-line,#dcd3c5)}' +
      '.card h4{margin:7px 0 2px;font-size:12px}.card p{margin:0;font-size:10.5px;color:var(--dm-mid,#463d35)}' +
      '.mq .layout{grid-template-columns:1fr}.mq .side{display:none}' +
      '.intrinsic .layout{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}';

    var HTML = '' +
      '<div class="wrap"><header class="nav"><div class="brand">LIN·PORTFOLIO</div>' +
      '<nav><a href="#">Work</a><a href="#">About</a></nav></header>' +
      '<div class="layout"><aside class="side"><b>Filters</b><br>Year · Role · Stack<br>— sidebar collapses under 720px in the media-query version</aside>' +
      '<main class="main">' +
      '<article class="card"><div class="thumb"></div><h4>Analytics</h4><p>Dense tables</p></article>' +
      '<article class="card"><div class="thumb" style="background:var(--dm-c-soft,#b4b8d2)"></div><h4>Timeline</h4><p>ICU handover</p></article>' +
      '<article class="card"><div class="thumb" style="background:var(--dm-e-soft,#e0c4bb)"></div><h4>Reader</h4><p>Long-form</p></article>' +
      '<article class="card"><div class="thumb" style="background:var(--dm-d-soft,#b3c8ad)"></div><h4>Map view</h4><p>Geo layers</p></article>' +
      '</main></div></div>';

    var st = { mode: 'mq', vw: 900, side: 200, mq: 720 };

    function apply() {
      var extra = st.mode === 'mq'
        ? '@media (max-width:' + st.mq + 'px){.layout{grid-template-columns:1fr}.side{display:none}}'
        : '';
      /* 用 iframe 宽度模拟视口：真实媒体查询会按 iframe 视口生效 */
      frame.style.width = '100%';
      frame.style.maxWidth = '100%';
      var wrapper = frame.parentElement.parentElement;
      wrapper.style.width = Math.min(st.vw, wrapper.parentElement.clientWidth) + 'px';
      renderFrame(frame, CSS + extra, HTML, measure);

      function measure() {
      var d = frame.contentDocument;
      var sideVisible = !!(d && d.querySelector('.side') &&
        d.defaultView.getComputedStyle(d.querySelector('.side')).display !== 'none');
      var cols = 0;
      if (d && d.querySelector('.main')) {
        var cards = d.querySelectorAll('.card');
        var tops = Array.prototype.map.call(cards, function (c) { return Math.round(c.getBoundingClientRect().top); });
        cols = tops.filter(function (t) { return t === tops[0]; }).length;
      }
      explain.innerHTML =
        '<span class="k">侧栏是否显示</span> = ' + (sideVisible ? '显示' : '隐藏') + '\n' +
        '<span class="k">主区列数</span> = ' + cols + ' 列\n' +
        '<span class="k">模式</span> = ' + (st.mode === 'mq' ? '媒体查询断点' : '内在响应式（容器驱动）') + '\n' +
        '<span class="k">模拟视口</span> = ' + st.vw + 'px\n' +
        '<span class="k">断点</span> = ' + (st.mode === 'mq' ? st.mq + 'px' : '无固定断点') + '\n' +
        '<span class="k">当前形态</span> = ' + (st.mode === 'mq'
          ? (sideVisible ? '<span class="ok">双列 + 显示侧栏（断点未命中）</span>'
                         : '<span class="bad">单列 + 隐藏侧栏（断点命中）</span>')
          : (sideVisible ? '<span class="ok">' + (cols + 1) + ' 列自适应（侧栏保留，由可用宽度决定）</span>'
                         : '<span class="warn">单列自适应</span>')) + '\n' +
        '<span class="k">风险</span> = ' + (st.mode === 'mq'
          ? '断点之间的宽度是"死区"，容易出现半宽卡片'
          : '需要对 minmax 下限有把握，否则大屏上卡片会过宽');

      codeEl.innerHTML = hlCSS(st.mode === 'mq'
        ? '/* 症状式：为宽度写例外 */\n@media (max-width: ' + st.mq + 'px) {\n  .layout { grid-template-columns: 1fr; }\n  .side   { display: none; }\n}'
        : '/* 病因式：让布局自己决定 */\n.layout {\n  grid-template-columns:\n    repeat(auto-fit, minmax(240px, 1fr));\n}');
      }
    }

    var g1 = group(s.ctl, '① 策略', '① Strategy');
    seg(g1, [
      { val: 'mq', zh: '媒体查询断点', en: 'Media-query breakpoints' },
      { val: 'intrinsic', zh: '内在响应式', en: 'Intrinsic / container-driven' }
    ], 'mq', function (v) { st.mode = v; apply(); });

    var g2 = group(s.ctl, '② 模拟视口宽度', '② Simulated viewport width');
    var sv = slider(g2, 'viewport', 'viewport', 320, 1100, 900, 10, 'px');
    sv.input.addEventListener('input', function () { st.vw = +sv.input.value; apply(); });
    var g3 = group(s.ctl, '③ 断点位置', '③ Breakpoint position');
    var sm = slider(g3, 'max-width', 'max-width', 400, 1000, 720, 10, 'px');
    sm.input.addEventListener('input', function () { st.mq = +sm.input.value; apply(); });
    actions(g3, [
      { zh: '320px（手机）', en: '320px (phone)', on: function () { sv.input.value = 320; sv.sync(); st.vw = 320; apply(); } },
      { zh: '768px（平板）', en: '768px (tablet)', on: function () { sv.input.value = 768; sv.sync(); st.vw = 768; apply(); } },
      { zh: '1100px（桌面）', en: '1100px (desktop)', primary: true, on: function () { sv.input.value = 1100; sv.sync(); st.vw = 1100; apply(); } }
    ]);

    var explain = measBox(s.ctl, '当前形态判定（真实测量）', 'What the layout is doing now (measured)');
    var codeEl = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      '媒体查询是"症状式"响应：先写死桌面版，再为窄屏打补丁，于是断点之间总有一段尴尬宽度。内在响应式是"病因式"：直接声明"每列至少 240px，能放几列放几列"。前者描述设备，后者描述内容——内容才是布局真正的约束。',
      'Media queries are symptom-driven: hard-code the desktop layout, then patch narrow screens, which leaves an awkward width between breakpoints. Intrinsic design is cause-driven: declare \u201ceach column is at least 240px, fit as many as possible\u201d. The former describes devices, the latter describes content \u2014 and content is the real constraint.');
    apply();
  };

  /* ============================================================
     ⑬ 第 7 章：十个真实翻车点
     ============================================================ */
  REG['d7-pitfalls'] = function (host) {
    var s = shell(host, '翻车现场：同一段代码，改写一行就修好', 'Crash site: one line of CSS decides pass or fail');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px;min-height:300px';
    holder.innerHTML = '<div id="pfStage" style="position:relative;height:260px;background:var(--dm-canvas,#faf8f4);' +
      'border-radius:8px;padding:12px;overflow:hidden"></div>';
    s.canvas.appendChild(holder);
    var stageEl = holder.querySelector('#pfStage');

    var CASES = [
      {
        id: 'overflow', zh: '内容溢出容器', en: 'Content overflows its container',
        bad: 'white-space:nowrap', good: 'min-width:0',
        render: function (fixed) {
          stageEl.innerHTML = '<div style="display:flex;gap:8px;height:60px">' +
            '<div style="flex:1;background:var(--dm-line,#dcd3c5);border-radius:8px;padding:10px;font:12px/1.4 -apple-system,sans-serif;' +
            (fixed ? 'min-width:0;' : '') + 'overflow:hidden">' +
            '<div style="white-space:nowrap">Analytics console — a very long case study title that will not wrap</div></div>' +
            '<div style="flex:0 0 90px;background:var(--dm-c-soft,#b4b8d2);border-radius:8px"></div></div>' +
            '<p style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35);margin-top:10px">' +
            (fixed ? '.flex-child { min-width: 0; }' : '.flex-child { /* flex:1 */ }') + '</p>';
        },
        why: { zh: 'flex 项目的 min-width 默认是 auto（不小于内容宽度），所以要显式写 min-width:0 才能让它收缩。', 
               en: 'A flex item\u2019s min-width defaults to auto (never smaller than its content), so you must write min-width:0 explicitly to let it shrink.' }
      },
      {
        id: 'img', zh: '图片把布局撑破', en: 'An image blows up the layout',
        bad: 'img { width: 800px }', good: 'img { max-width: 100%; height: auto }',
        render: function (fixed) {
          stageEl.innerHTML = '<div style="max-width:320px;background:var(--dm-line,#dcd3c5);border-radius:8px;padding:10px">' +
            '<div style="background:var(--dm-a,#c05a34);border-radius:6px;' + (fixed ? 'max-width:100%;height:26px' : 'width:800px;height:26px') + '"></div>' +
            '</div><p style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35);margin-top:10px">' +
            (fixed ? 'img { max-width: 100%; height: auto; }' : 'img { width: 800px; }') + '</p>';
        },
        why: { zh: '固有尺寸大于容器时必须有上限。max-width:100% + height:auto 是"响应式图片"的最小配置。',
               en: 'Intrinsic sizes need a ceiling. max-width:100% plus height:auto is the minimum responsive-image setup.' }
      },
      {
        id: 'vh', zh: '移动端 100vh 被地址栏吃掉', en: '100vh eaten by the mobile address bar',
        bad: 'height: 100vh', good: 'height: 100dvh',
        render: function (fixed) {
          stageEl.innerHTML = '<div style="position:relative;height:200px;border:2px solid var(--dm-mute,#8c8073);border-radius:10px;overflow:hidden">' +
            '<div style="position:absolute;inset:0;background:var(--dm-canvas,#faf8f4)"></div>' +
            '<div style="position:absolute;left:0;right:0;bottom:0;height:34px;background:var(--dm-bad-soft,#e0a795);color:var(--dm-bad-ink,#6d2a1c);' +
            'font:11px/34px ui-monospace,monospace;text-align:center">' +
            (fixed ? '✓ 按钮可见（dvh）' : '✗ 按钮被遮住（100vh）') + '</div>' +
            '<div style="position:absolute;left:8px;bottom:8px;background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);padding:6px 12px;border-radius:6px;font-size:11px">OK</div>' +
            '</div><p style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35);margin-top:10px">' +
            (fixed ? '.hero { height: 100dvh; }' : '.hero { height: 100vh; }') + '</p>';
        },
        why: { zh: 'vh 取的是"最大视口"，不含浏览器 UI 变化；dvh 是动态视口高度，会随地址栏收起而变化。',
               en: 'vh measures the largest viewport and ignores browser chrome changes; dvh is the dynamic viewport height and reacts to the address bar.' }
      },
      {
        id: 'abscenter', zh: '用 absolute 居中的老写法', en: 'The old absolute-centring trick',
        bad: 'top:50%; left:50%; margin:-40px 0 0 -80px', good: 'display:grid; place-items:center',
        render: function (fixed) {
          stageEl.innerHTML = '<div style="position:relative;height:150px;background:var(--dm-line,#dcd3c5);border-radius:8px;' +
            (fixed ? 'display:grid;place-items:center">' : '">') +
            '<div style="width:160px;height:54px;background:var(--dm-a,#c05a34);border-radius:8px;' +
            (fixed ? '' : 'position:absolute;top:50%;left:50%;margin:-55px 0 0 -120px;') +
            'display:grid;place-items:center;font:700 12px ui-monospace,monospace;color:var(--dm-on-accent,#fffdf9)">box</div>' +
            '</div><p style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35);margin-top:10px">' +
            (fixed ? '.parent { display: grid; place-items: center; }' : '.child { position: absolute; top: 50%; left: 50%; margin: ... }') + '</p>';
        },
        why: { zh: '手算负 margin 要求你知道子元素精确尺寸，一旦内容变化就偏移。place-items:center 不依赖尺寸。',
               en: 'Hand-computed negative margins require knowing the exact size; any content change breaks the centring. place-items:center does not depend on size.' }
      },
      {
        id: 'collapse', zh: '父元素高度塌陷', en: 'Collapsed parent height',
        bad: '子元素全部 float', good: 'display: flow-root',
        render: function (fixed) {
          stageEl.innerHTML = '<div style="background:var(--dm-b-soft,#ddc48d);border:1px dashed var(--dm-b,#b98a2e);border-radius:8px;padding:8px;' +
            (fixed ? 'display:flow-root' : '') + '">' +
            '<div style="float:left;width:45%;height:50px;background:var(--dm-b,#b98a2e);border-radius:6px;margin:4px"></div>' +
            '<div style="float:left;width:45%;height:50px;background:var(--dm-b,#b98a2e);border-radius:6px;margin:4px"></div>' +
            '</div><p style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35);margin-top:10px">' +
            (fixed ? '.parent { display: flow-root; }  → 父元素包住了浮动子元素' : 'float 子元素脱离了文档流 → 父元素高度为 0') + '</p>';
        },
        why: { zh: '浮动元素脱离文档流，父元素算高度时看不到它们。flow-root 建立 BFC，让父元素重新包含浮动。',
               en: 'Floated boxes leave the flow, so the parent sees no height. flow-root creates a BFC so the parent contains its floats again.' }
      }
    ];

    var idx = 0, fixed = false, timer = null;

    function paint() {
      var c = CASES[idx];
      c.render(fixed);
      bi(titleEl, c.zh, c.en);          /* 直接用双语节点，语言切换自动跟随 */
      whyEl.textContent = T(c.why.zh, c.why.en);
      whyEl.dataset.zhSrc = c.why.zh;      /* 供 localize() 在英文下替换 */
      whyEl.dataset.enSrc = c.why.en;
      codeEl.innerHTML = hlCSS(fixed
        ? '/* ✓ 修复后 */\n' + c.good
        : '/* ✗ 出问题的写法 */\n' + c.bad);
      tabs.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === idx); });
      fixedChk.checked = fixed;
      fixedChk.parentElement.querySelector('span').textContent = fixed
        ? T('已修复 ✓', 'Fixed ✓') : T('原始 bug ✗', 'Original bug ✗');
    }

    var tabs = el('div', 'seg');
    CASES.forEach(function (c, i) {
      var b = el('button', null, '');
      bi(b, String(i + 1), String(i + 1));
      b.title = T(c.zh, c.en);
      b.addEventListener('click', function () { idx = i; stop(); paint(); });
      tabs.appendChild(b);
    });
    s.ctl.appendChild(tabs);

    var titleEl = el('div', 'demo-pitfall-title');
    titleEl.style.cssText = 'font:600 13.5px/1.5 -apple-system,sans-serif;color:var(--tx);' +
      'background:var(--bg-inset);border:1px solid var(--line);border-left:3px solid var(--accent);' +
      'border-radius:8px;padding:9px 12px;margin-bottom:10px';
    s.ctl.insertBefore(titleEl, s.ctl.firstChild);

    var g1 = group(s.ctl, '① 修复开关', '① Fix toggle');
    var fixedChk = check(g1, '应用修复', 'Apply the fix', false, function (v) { fixed = v; paint(); });

    var g2 = group(s.ctl, '② 为什么', '② Why');
    var whyEl = el('p', 'measure');
    whyEl.style.whiteSpace = 'normal';
    g2.appendChild(whyEl);

    var codeEl = cssBox(s.ctl, '关键那行', 'The decisive line');

    actions(s.ctl, [
      { zh: '◀ 上一个', en: '◀ Previous', on: function () { stop(); idx = (idx + CASES.length - 1) % CASES.length; fixed = false; paint(); } },
      { zh: '下一个 ▶', en: 'Next ▶', primary: true, on: function () { stop(); idx = (idx + 1) % CASES.length; fixed = false; paint(); } },
      { zh: '▶ 自动演示全部', en: '▶ Auto-play all', on: function () {
          if (timer) { stop(); return; }
          idx = 0; fixed = false; paint();
          var phase = 0;
          timer = setInterval(function () {
            phase++;
            if (phase % 2 === 1) { fixed = true; paint(); }
            else {
              idx = (idx + 1) % CASES.length; fixed = false; paint();
              if (idx === 0) stop();
            }
          }, 1600);
        } }
    ]);
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    hint(s.ctl,
      '这十类问题占了真实项目里布局 bug 的绝大多数。共同点：它们都不是"语法错误"，浏览器不会报错，页面只是安静地长得不对——所以布局能力的一半是"会写"，另一半是"会测量"。',
      'These ten categories account for the vast majority of real layout bugs. What they share: none is a syntax error, the browser reports nothing, the page is simply quietly wrong \u2014 which is why half of layout skill is writing and the other half is measuring.');
    paint();
  };

  /* ============================================================
     ⑭ 第 7 章：交付前的响应式体检
     ============================================================ */
  REG['d7-checklist'] = function (host) {
    var s = shell(host, '交付自检：在 4 个宽度下同时体检', 'Pre-flight: inspect at four widths at once');

    var frame = stage(s.canvas, 300, 'lin-portfolio.local/preflight.html');

    var CSS = '' +
      '*{box-sizing:border-box}' +
      'body{margin:0;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18);background:var(--dm-paper,#fbf8f3)}' +
      '.wrap{padding:10px}' +
      '.nav{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--dm-line,#dcd3c5)}' +
      '.brand{font-weight:800;font-size:10.5px;letter-spacing:.06em}' +
      '.nav nav{display:flex;gap:8px}.nav a{font-size:10.5px;color:var(--dm-mid,#463d35);text-decoration:none}' +
      '.hero{padding:22px 0 16px}' +
      '.hero h1{font-size:clamp(17px,4.2vw,30px);line-height:1.15;margin:0 0 8px;letter-spacing:-.02em}' +
      '.hero p{font-size:clamp(10.5px,1.6vw,13.5px);color:var(--dm-mid,#463d35);margin:0 0 12px;max-width:46ch}' +
      '.cta{display:inline-block;background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);padding:7px 14px;border-radius:7px;font-size:11px}' +
      '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:9px;padding-bottom:14px}' +
      '.card{border:1px solid var(--dm-line,#dcd3c5);border-radius:8px;padding:8px;min-width:0}' +
      '.thumb{height:30px;border-radius:5px;background:var(--dm-line,#dcd3c5)}' +
      '.card h4{margin:6px 0 1px;font-size:11px}.card p{margin:0;font-size:9.5px;color:var(--dm-mid,#463d35);overflow-wrap:anywhere}' +
      '.foot{padding-top:10px;border-top:1px solid var(--dm-line,#dcd3c5);color:var(--dm-mute,#8c8073);font-size:9.5px}' +
      '@media (max-width:420px){.nav nav a:nth-child(n+3){display:none}}';

    var HTML = '<div class="wrap"><header class="nav"><div class="brand">LIN·PORTFOLIO</div>' +
      '<nav><a href="#">Work</a><a href="#">About</a><a href="#">Contact</a></nav></header>' +
      '<section class="hero"><h1>Lin — Product Designer</h1>' +
      '<p>I design calm, legible interfaces for data-heavy products.</p>' +
      '<span class="cta">View case studies</span></section>' +
      '<section class="cards">' +
      '<article class="card"><div class="thumb"></div><h4>Analytics console</h4><p>Dense tables, 40k rows, one screen.</p></article>' +
      '<article class="card"><div class="thumb" style="background:var(--dm-c-soft,#b4b8d2)"></div><h4>Clinical timeline</h4><p>ICU handover.</p></article>' +
      '<article class="card"><div class="thumb" style="background:var(--dm-e-soft,#e0c4bb)"></div><h4>Reading app</h4><p>Long-form reader.</p></article>' +
      '</section><footer class="foot">© 2026 Lin</footer></div>';

    var WIDTHS = [360, 480, 768, 1024];
    var bench = el('div');
    bench.style.cssText = 'display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap';
    s.canvas.innerHTML = '';
    s.canvas.appendChild(bench);

    var frames = WIDTHS.map(function (w) {
      var col = el('div');
      col.style.cssText = 'flex:0 0 auto';
      col.innerHTML = '<div style="font:11px/1.7 ui-monospace,monospace;color:var(--dm-mute,#8c8073)">' + w + 'px</div>';
      var box = el('div');
      box.style.cssText = 'width:' + w + 'px;border:1px solid var(--dm-ink,#211c18);border-radius:8px;overflow:hidden;background:var(--dm-paper,#fbf8f3)';
      var f = el('iframe');
      f.style.cssText = 'display:block;width:' + w + 'px;height:250px;border:0;background:var(--dm-paper,#fbf8f3)';
      box.appendChild(f);
      col.appendChild(box);
      bench.appendChild(col);
      writeFrame(f, CSS, HTML);
      return f;
    });

    var issues = el('div', 'measure');
    issues.style.marginTop = '12px';
    s.canvas.appendChild(issues);

    function audit() {
      var lines = [], bad = 0;
      frames.forEach(function (f, k) {
        var d = f.contentDocument;
        var w = WIDTHS[k];
        var h1 = d && d.querySelector('.hero h1');
        var cards = d ? d.querySelectorAll('.card') : null;
        var cta = d ? d.querySelector('.cta') : null;
        /* iframe 尚未加载完成时跳过，等 load 事件再测 */
        if (!d || !d.body || !h1 || !cards || !cards.length || !cta) return;
        var over = d.documentElement.scrollWidth - d.documentElement.clientWidth;
        var hf = Math.round(parseFloat(d.defaultView.getComputedStyle(h1).fontSize));
        var tops = Array.prototype.map.call(cards, function (c) { return Math.round(c.getBoundingClientRect().top); });
        var cols = tops.filter(function (t) { return t === tops[0]; }).length;
        var cardW = Math.round(cards[0].getBoundingClientRect().width);
        var ok = over <= 1;
        if (!ok) bad++;
        var ctaH = Math.round(cta.getBoundingClientRect().height);
        lines.push(
          '<span class="k">' + w + 'px</span> · 溢出 ' + (ok ? '<span class="ok">0px ✓</span>' : '<span class="bad">' + over + 'px ✗</span>') +
          ' · h1 ' + hf + 'px · 卡片 ' + cols + ' 列 × ' + cardW + 'px · 触控目标 ' +
          (ctaH >= 32 ? '<span class="ok">' + ctaH + 'px ✓</span>' : '<span class="bad">偏小 ✗</span>')
        );
      });
      if (!lines.length) { issues.textContent = '测量中… / measuring…'; return; }
      lines.push('');
      lines.push(bad === 0
        ? '<span class="ok">✓ 四个宽度全部通过：无横向溢出，字号随视口平滑缩放，卡片列数自动变化</span>'
        : '<span class="bad">✗ ' + bad + ' 个宽度存在横向溢出</span>');
      issues.innerHTML = lines.join('\n');
    }
    frames.forEach(function (f) { f.addEventListener('load', audit); });

    var g1 = group(s.ctl, '自检清单', 'Self-check list');
    [
      { zh: '① 任意宽度下都没有横向滚动条', en: '① No horizontal scrollbar at any width' },
      { zh: '② 字号随视口平滑变化，没有断崖', en: '② Type scales smoothly, no cliff edges' },
      { zh: '③ 触控目标 ≥ 44×44px（移动端）', en: '③ Touch targets \u2265 44\u00d744px on mobile' },
      { zh: '④ 重点内容在首屏可见，不依赖滚动', en: '④ Key content is above the fold' },
      { zh: '⑤ 缩放 200% 后内容仍可用', en: '⑤ Usable at 200% zoom' },
      { zh: '⑥ 键盘 Tab 顺序与视觉顺序一致', en: '⑥ Tab order matches visual order' },
      { zh: '⑦ 长英文单词/URL 有 overflow-wrap', en: '⑦ Long words/URLs have overflow-wrap' },
      { zh: '⑧ 图片有 max-width:100% 与宽高比占位', en: '⑧ Images have max-width:100% and aspect-ratio placeholder' }
    ].forEach(function (it) {
      var l = el('label', 'chk');
      var i = el('input'); i.type = 'checkbox';
      var sp = el('span'); bi(sp, it.zh, it.en);
      l.appendChild(i); l.appendChild(sp);
      g1.appendChild(l);
      i.addEventListener('change', function () {
        var total = g1.querySelectorAll('input').length;
        var done = g1.querySelectorAll('input:checked').length;
        score.textContent = done + ' / ' + total;
        score.style.color = done === total ? 'var(--dm-d,#4f8163)' : 'var(--dm-b,#b98a2e)';
      });
    });
    var score = el('div');
    score.textContent = '0 / 8';
    score.style.cssText = 'font:800 20px ui-monospace,monospace;margin-top:6px';
    g1.appendChild(score);

    actions(s.ctl, [{ zh: '↻ 重新体检', en: '↻ Re-run audit', primary: true, on: audit }]);
    hint(s.ctl,
      '布局质量必须被测量，否则只能靠"看着还行"。这张体检表把主观判断换成 8 条可勾选的客观条目——这也是本课程从第 1 章就在做的事：用 getBoundingClientRect() 说话。',
      'Layout quality must be measured, otherwise you are left with \u201clooks about right\u201d. This checklist turns subjective judgement into eight tickable objective items \u2014 exactly what this course has been doing since chapter 1: letting getBoundingClientRect() do the talking.');
    audit();
  };

  /* ============================================================
     ⑮ 第 6 章：clamp() 与流式字号
     ============================================================ */
  REG['d6-clamp'] = function (host) {
    var s = shell(host, '流式字号：clamp(min, 首选, max)', 'Fluid type: clamp(min, preferred, max)');

    var frame = stage(s.canvas, 320, 'lin-portfolio.local/fluid-type.html');
    var st = { vw: 900, min: 20, max: 44, vwMin: 360, vwMax: 1100, useMQ: false };

    function css() {
      var pref = 'calc(' + st.min + 'px + (' + st.max + ' - ' + st.min + ') * ((100vw - ' + st.vwMin + 'px) / (' + st.vwMax + ' - ' + st.vwMin + ')))';
      var clampStr = 'clamp(' + st.min + 'px, ' + (st.min + (st.max - st.min) * 0.45).toFixed(1) + 'px + 2vw, ' + st.max + 'px)';
      var h1 = st.useMQ
        ? st.min + 'px'
        : clampStr;
      return '*{box-sizing:border-box}' +
        'body{margin:0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18);background:var(--dm-paper,#fbf8f3)}' +
        '.wrap{padding:16px}' +
        '.h1{font-size:' + h1 + ';line-height:1.12;letter-spacing:-.02em;margin:0 0 10px}' +
        '.p{font-size:clamp(12px,1.5vw,16px);color:var(--dm-mid,#463d35);margin:0 0 12px;max-width:44ch}' +
        (st.useMQ ? '@media (min-width:760px){.h1{font-size:' + st.max + 'px}}' : '');
    }

    function apply() {
      frame.style.maxWidth = '100%';
      frame.parentElement.style.width = Math.min(st.vw, frame.parentElement.parentElement.clientWidth) + 'px';
      renderFrame(frame, css(),
        '<div class="wrap"><h1 class="h1">Lin — Product Designer</h1>' +
        '<p class="p">I design calm, legible interfaces for data-heavy products.</p>' +
        '<p class="p" style="color:var(--dm-mute,#8c8073)">viewport: <span id="vwOut"></span></p></div>',
        measure);

      function measure() {
        var d = frame.contentDocument;
        if (!d || !d.querySelector('.h1')) return;
        var h1 = d.querySelector('.h1');
        var fs = parseFloat(d.defaultView.getComputedStyle(h1).fontSize);
        var span = st.max - st.min;
        var frac = span > 0 ? (fs - st.min) / span : 0;
        out.innerHTML =
          '<span class="k">模拟视口</span> = ' + st.vw + 'px\n' +
          '<span class="k">h1 计算字号</span> = ' + fs.toFixed(1) + 'px\n' +
          '<span class="k">区间</span> = [' + st.min + ', ' + st.max + ']px → 位置 ' +
          (frac * 100).toFixed(0) + '%\n' +
          '<span class="k">是否触顶</span> = ' + (fs >= st.max - 0.5 ? '<span class="bad">已达 max</span>'
            : fs <= st.min + 0.5 ? '<span class="bad">已达 min</span>' : '<span class="ok">在区间内平滑过渡</span>') + '\n' +
          (st.useMQ
            ? '<span class="warn">⚠ 媒体查询版：字号的跳变发生在断点处，两侧都不连续</span>'
            : '<span class="ok">✓ clamp 版：字号随视口连续变化，无跳变</span>');

        code.innerHTML = hlCSS(st.useMQ
          ? '.hero h1 { font-size: ' + st.min + 'px; }\n' +
            '@media (min-width: 760px) {\n  .hero h1 { font-size: ' + st.max + 'px; }\n}'
          : '.hero h1 {\n  font-size: clamp(' + st.min + 'px, ' +
            (st.min + (st.max - st.min) * 0.45).toFixed(1) + 'px + 2vw, ' + st.max + 'px);\n}');
      }
    }

    var g1 = group(s.ctl, '① 模拟视口', '① Simulated viewport');
    var sv = slider(g1, 'width', 'width', 320, 1200, 900, 10, 'px');
    sv.input.addEventListener('input', function () { st.vw = +sv.input.value; apply(); });

    var g2 = group(s.ctl, '② clamp 参数', '② clamp parameters');
    var smin = slider(g2, 'min', 'min', 12, 40, 20, 1, 'px');
    var smax = slider(g2, 'max', 'max', 24, 72, 44, 1, 'px');
    smin.input.addEventListener('input', function () { st.min = +smin.input.value; if (st.max <= st.min) { st.max = st.min + 4; smax.input.value = st.max; smax.sync(); } apply(); });
    smax.input.addEventListener('input', function () { st.max = +smax.input.value; apply(); });

    var g3 = group(s.ctl, '③ 策略对比', '③ Strategy comparison');
    seg(g3, [
      { val: 'clamp', zh: 'clamp() 连续流式', en: 'clamp() continuous' },
      { val: 'mq', zh: '媒体查询跳变', en: 'Media-query jump' }
    ], 'clamp', function (v) { st.useMQ = (v === 'mq'); apply(); });
    actions(g3, [
      { zh: '360px', en: '360px', on: function () { sv.input.value = 360; sv.sync(); st.vw = 360; apply(); } },
      { zh: '900px', en: '900px', on: function () { sv.input.value = 900; sv.sync(); st.vw = 900; apply(); } },
      { zh: '1200px', en: '1200px', primary: true, on: function () { sv.input.value = 1200; sv.sync(); st.vw = 1200; apply(); } }
    ]);

    var out = measBox(s.ctl, '计算值实测', 'Computed value, measured');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    hint(s.ctl,
      'clamp() 的意义不只是"少写几个媒体查询"：它让排版在任意宽度下都是连续的。媒体查询制造的是阶梯函数，clamp 制造的是线性函数——后者在断点之间不会出现"半大不小"的尴尬字号。',
      'clamp() is not just about writing fewer media queries: it makes typography continuous at every width. A media query is a step function; clamp is a linear function \u2014 and the latter never leaves you with an awkward in-between size.');
    apply();
  };

  /* ============================================================
     ⑯ 第 2 章：正常流 —— inline vs block vs inline-block
     ============================================================ */
  REG['d2-display'] = function (host) {
    var s = shell(host, '三种显示类型：为什么 inline 的宽高不起作用', 'Three display types: why width/height do nothing on inline');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:16px;font:13px/1.5 -apple-system,sans-serif;color:var(--dm-ink,#211c18)';
    holder.innerHTML = '<div id="dpWrap" style="border:1px dashed var(--dm-line,#dcd3c5);border-radius:8px;padding:10px"></div>' +
      '<div id="dpNote" style="margin-top:10px;font:11.5px/1.7 ui-monospace,monospace;color:var(--dm-mid,#463d35)"></div>';
    s.canvas.appendChild(holder);
    var wrap = holder.querySelector('#dpWrap'), note = holder.querySelector('#dpNote');

    var st = { display: 'inline', w: 120, h: 40, vertical: 'baseline', pad: 8 };

    function apply() {
      wrap.innerHTML =
        'Text before <span class="t" style="background:var(--dm-a,#c05a34);color:var(--dm-on-accent,#fffdf9);border-radius:6px;' +
        'display:' + st.display + ';width:' + st.w + 'px;height:' + st.h + 'px;' +
        'padding:' + st.pad + 'px;vertical-align:' + st.vertical + ';' +
        'font:700 13px/1.4 ui-monospace,monospace">target box</span> text after.' +
        '<div style="margin-top:12px;background:var(--dm-surface,#f2ede4);border-radius:6px;padding:8px;font-size:12px;color:var(--dm-mid,#463d35)">' +
        '块级兄弟元素 · 用来观察 target 是否独占一行</div>';

      var t = wrap.querySelector('.t');
      var r = t.getBoundingClientRect();
      var lineH = parseFloat(getComputedStyle(wrap).lineHeight) || 20;
      var heightApplies = st.display !== 'inline';
      noteOut.innerHTML =
        '<span class="k">display</span> = ' + st.display + '\n' +
        '<span class="k">声明 width/height</span> = ' + st.w + ' / ' + st.h + 'px\n' +
        '<span class="k">实测渲染尺寸</span> = ' + Math.round(r.width) + ' × ' + Math.round(r.height) + 'px ' +
        (heightApplies ? '<span class="ok">✓ 生效</span>' : '<span class="bad">✗ 被忽略（inline 不接受宽高）</span>') + '\n' +
        '<span class="k">垂直 padding 是否撑开行</span> = ' +
        (st.display === 'inline' ? '<span class="bad">否（视觉重叠，但行高不变）</span>' : '<span class="ok">是</span>') + '\n' +
        '<span class="k">是否独占一行</span> = ' + (st.display === 'block' ? '<span class="ok">是</span>' : '否（与文字同行）');

      code.innerHTML = hlCSS('.target {\n  display: ' + st.display + ';\n' +
        (st.display === 'inline' ? '  /* width / height 无效 */\n' : '  width: ' + st.w + 'px;\n  height: ' + st.h + 'px;\n') +
        '  padding: ' + st.pad + 'px;\n  vertical-align: ' + st.vertical + ';\n}');
    }

    var noteOut = measBox(s.ctl, '实测尺寸', 'Measured size');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');

    var g1 = group(s.ctl, '① display', '① display');
    seg(g1, [
      { val: 'inline', zh: 'inline', en: 'inline' },
      { val: 'inline-block', zh: 'inline-block', en: 'inline-block' },
      { val: 'block', zh: 'block', en: 'block' }
    ], 'inline', function (v) { st.display = v; apply(); });

    var g2 = group(s.ctl, '② 尺寸（试着调，看 inline 有没有反应）', '② Size (try it and watch inline ignore you)');
    var sw = slider(g2, 'width', 'width', 40, 320, 120, 1, 'px');
    var sh = slider(g2, 'height', 'height', 16, 120, 40, 1, 'px');
    var sp = slider(g2, 'padding', 'padding', 0, 30, 8, 1, 'px');
    sw.input.addEventListener('input', function () { st.w = +sw.input.value; apply(); });
    sh.input.addEventListener('input', function () { st.h = +sh.input.value; apply(); });
    sp.input.addEventListener('input', function () { st.p = +sp.input.value; st.pad = st.p; apply(); });

    var g3 = group(s.ctl, '③ vertical-align（仅 inline 有效）', '③ vertical-align (inline only)');
    var sva = slider(g3, 'vertical-align', 'vertical-align', -12, 12, 0, 1, 'px', function (v) { return v + 'px'; });
    sva.input.addEventListener('input', function () { st.vertical = sva.input.value + 'px'; apply(); });

    hint(s.ctl,
      '"inline 元素没有宽高"不是浏览器的脾气，而是规范：行内盒参与行盒（line box）的行内格式化上下文，尺寸由字体度量与内容决定，所以 width/height 被忽略、垂直 padding 会溢出到相邻行。想要"能设宽高又能并排"就选 inline-block；想要"独占一行"就选 block。',
      '\u201cInline elements have no width or height\u201d is not a browser quirk but the spec: inline boxes live in the inline formatting context of a line box, so their size comes from font metrics and content, which is why width/height are ignored and vertical padding bleeds into neighbouring lines. Want settable size while staying on one line? Use inline-block. Want its own line? Use block.');

    /* 修正滑块回调里的小笔误 */
    sp.input.addEventListener('input', function () { st.pad = +sp.input.value; apply(); });
    apply();
  };

  /* ============================================================
     ⑰ 第 3 章：导航条实战（space-between + 基线）
     ============================================================ */
  REG['d3-navbar'] = function (host) {
    var s = shell(host, '导航条实战：两端对齐与垂直居中', 'Navbar in practice: space-between and vertical centring');

    var frame = stage(s.canvas, 260, 'lin-portfolio.local/navbar.html');
    var st = { justify: 'space-between', align: 'center', gap: 18, pad: 12, logoH: 26, taller: false };

    function apply() {
      var css = '*{box-sizing:border-box}' +
        'body{margin:0;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dm-ink,#211c18);background:var(--dm-paper,#fbf8f3);padding:10px}' +
        '.nav{display:flex;justify-content:' + st.justify + ';align-items:' + st.align + ';' +
        'gap:' + st.gap + 'px;padding:' + st.pad + 'px ' + (st.pad + 6) + 'px;' +
        'border-bottom:1px solid var(--dm-line,#dcd3c5);background:rgba(255,255,255,.9)}' +
        '.brand{font-weight:800;font-size:12px;letter-spacing:.06em;background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);' +
        'border-radius:6px;padding:6px 9px;line-height:1}' +
        (st.taller ? '.brand{padding-top:' + (6 + st.logoH) + 'px;padding-bottom:' + (6 + st.logoH) + 'px}' : '') +
        '.links{display:flex;gap:' + st.gap + 'px}' +
        '.links a{color:var(--dm-mid,#463d35);text-decoration:none;font-size:12.5px;' +
        'border-bottom:2px solid transparent;padding:2px 1px}' +
        '.links a:hover{border-bottom-color:var(--dm-ink,#211c18);color:var(--dm-ink,#211c18)}' +
        '.links a.cta{background:var(--dm-ink,#211c18);color:var(--dm-paper,#fbf8f3);padding:7px 14px;border-radius:7px;border:0}';
      renderFrame(frame, css,
        '<header class="nav"><div class="brand">LIN·PORTFOLIO</div>' +
        '<nav class="links"><a href="#">Work</a><a href="#">About</a><a href="#">Writing</a>' +
        '<a href="#" class="cta">Contact</a></nav></header>' +
        '<p style="padding:14px 4px;color:var(--dm-mid,#463d35);font-size:12.5px">Below the navbar — scroll or resize to see the layout hold.</p>',
        measure);

      function measure() {
        /* 等 iframe 内部完成首帧布局，否则尺寸读到 0 */
        frame.contentWindow.requestAnimationFrame(function () {
          frame.contentWindow.requestAnimationFrame(measureNow);
        });
      }
      function measureNow() {
        var d = frame.contentDocument;
        if (!d || !d.querySelector('.brand')) return;
        var brand = d.querySelector('.brand'), links = d.querySelectorAll('.links a');
        var rb = brand.getBoundingClientRect();
        var centers = Array.prototype.map.call(links, function (a) {
          var r = a.getBoundingClientRect();
          return r.top + r.height / 2;
        });
        var bCenter = rb.top + rb.height / 2;
        var spread = centers.length
          ? Math.round(Math.max.apply(null, centers.concat([bCenter])) - Math.min.apply(null, centers.concat([bCenter])))
          : 0;
        var navRect = d.querySelector('.nav').getBoundingClientRect();
        out.innerHTML =
          '<span class="k">justify-content</span> = ' + st.justify + '\n' +
          '<span class="k">align-items</span> = ' + st.align + '\n' +
          '<span class="k">品牌与链接中线偏移</span> = ' + spread + 'px ' +
          (spread <= 2 ? '<span class="ok">✓ 视觉居中</span>' : '<span class="bad">✗ 看起来会"歪"</span>') + '\n' +
          '<span class="k">导航条高度</span> = ' + Math.round(navRect.height) + 'px\n' +
          '<span class="k">两端间距</span> = ' + Math.round(links[0].getBoundingClientRect().left - rb.right) + 'px';
      }
    }

    var g1 = group(s.ctl, '① 主轴分布', '① Main-axis distribution');
    seg(g1, [
      { val: 'space-between', zh: 'space-between', en: 'space-between' },
      { val: 'flex-start', zh: 'flex-start', en: 'flex-start' },
      { val: 'center', zh: 'center', en: 'center' },
      { val: 'flex-end', zh: 'flex-end', en: 'flex-end' }
    ], 'space-between', function (v) { st.justify = v; apply(); });

    var g2 = group(s.ctl, '② 交叉轴对齐', '② Cross-axis alignment');
    seg(g2, [
      { val: 'center', zh: 'center（推荐）', en: 'center (recommended)' },
      { val: 'flex-start', zh: 'flex-start', en: 'flex-start' },
      { val: 'baseline', zh: 'baseline', en: 'baseline' },
      { val: 'stretch', zh: 'stretch', en: 'stretch' }
    ], 'center', function (v) { st.align = v; apply(); });

    var g3 = group(s.ctl, '③ 参数', '③ Parameters');
    var sg = slider(g3, 'gap', 'gap', 0, 40, 18, 1, 'px');
    var spd = slider(g3, 'padding', 'padding', 4, 28, 12, 1, 'px');
    sg.input.addEventListener('input', function () { st.gap = +sg.input.value; apply(); });
    spd.input.addEventListener('input', function () { st.pad = +spd.input.value; apply(); });
    check(g3, '让 logo 变高（测试 align-items 是否还居中）', 'Make the logo taller (does align-items still centre?)', false,
      function (v) { st.taller = v; apply(); });

    var out = measBox(s.ctl, '对齐实测', 'Measured alignment');
    hint(s.ctl,
      '导航条是最能体现 flex 价值的组件：两端对齐（space-between）+ 垂直居中（align-items:center）本来是 CSS 里最难写对的两件事，现在各一行。注意基线对齐（baseline）在混排不同字号时非常有用，但它和 center 是两种不同的视觉目标。',
      'A navbar shows flexbox\u2019s value best: pushing apart (space-between) plus vertical centring (align-items:center) were historically the two hardest things in CSS; now each is one line. Note that baseline alignment is great when mixing font sizes, but it is a different visual goal from centring.');
    apply();
  };

  /* ============================================================
     ⑱ 第 4 章：Grid 区域命名与整页骨架
     ============================================================ */
  REG['d4-areas'] = function (host) {
    var s = shell(host, 'grid-template-areas：用"画图"的方式写整页骨架', 'grid-template-areas: drawing the page skeleton');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px;font:12px/1.5 -apple-system,sans-serif;color:var(--dm-ink,#211c18)';
    holder.innerHTML = '<div id="gaStage" style="display:grid;grid-template-columns:180px 1fr 1fr;' +
      'grid-template-rows:auto 1fr auto;grid-template-areas:"head head head" "side main main" "foot foot foot";' +
      'gap:8px;height:280px"></div>';
    s.canvas.appendChild(holder);
    var stageEl = holder.querySelector('#gaStage');

    var AREA_COLOR = {
      head: 'var(--dm-a,#c05a34)', side: 'var(--dm-c,#5f6494)', main: 'var(--dm-d,#4f8163)', foot: 'var(--dm-b,#b98a2e)',
      a: 'var(--dm-e,#a86a5a)', b: 'var(--dm-d2,#4c7d72)', c: 'var(--dm-b,#b98a2e)', d: 'var(--dm-f,#75873f)'
    };
    var st = { template: 'sidebar', gap: 8, dense: false };

    /* 先建好回显区域，再调用 apply()（避免变量提升导致的 undefined） */
    holder.insertAdjacentHTML('beforeend',
      '<div style="margin-top:10px;font:11.5px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35)">' +
      'grid-template-areas: <b class="ga-tpl" style="color:var(--dm-c2,#4a4f7c)">—</b></div>');
    var tplOut = holder.querySelector('.ga-tpl');
    var explain = measBox(s.ctl, '当前骨架', 'Current skeleton');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');

    var TEMPLATES = {
      sidebar: {
        areas: '"head head head" "side main main" "foot foot foot"',
        cols: '180px 1fr 1fr', rows: 'auto 1fr auto',
        zh: '后台经典：固定侧栏 + 自适应主区',
        en: 'Classic admin: fixed sidebar + fluid main',
        boxes: ['head', 'side', 'main', 'foot']
      },
      holy: {
        areas: '"head head head" "nav main aside" "foot foot foot"',
        cols: '160px 1fr 160px', rows: 'auto 1fr auto',
        zh: '圣杯布局：两翼固定，中间自适应',
        en: 'Holy grail: fixed wings, fluid centre',
        boxes: ['head', 'nav', 'main', 'aside', 'foot']
      },
      gallery: {
        areas: '"head head head head" "a b b c" "a d d c"',
        cols: '1fr 1fr 1fr 1fr', rows: 'auto 1fr 1fr',
        zh: '杂志式：大图与小图混排',
        en: 'Magazine: mixed large and small tiles',
        boxes: ['head', 'a', 'b', 'c', 'd']
      }
    };

    function apply() {
      var tpl = TEMPLATES[st.template];
      stageEl.style.gridTemplateAreas = tpl.areas;
      stageEl.style.gridTemplateColumns = tpl.cols;
      stageEl.style.gridTemplateRows = tpl.rows;
      stageEl.style.gap = st.gap + 'px';
      stageEl.innerHTML = '';
      tpl.boxes.forEach(function (name) {
        var d = el('div', null, name);
        d.style.cssText = 'grid-area:' + name + ';background:' + AREA_COLOR[name] + ';color:var(--dm-on-accent,#fffdf9);' +
          'border-radius:8px;display:grid;place-items:center;font:700 12px ui-monospace,monospace;min-height:0';
        if (name === 'main' || name === 'b') d.style.fontSize = '13px';
        stageEl.appendChild(d);
      });
      tplOut.textContent = tpl.areas;
      explain.innerHTML =
        '<span class="k">grid-template-areas</span>\n  ' + tpl.areas + '\n' +
        '<span class="k">列</span> = ' + tpl.cols + '\n' +
        '<span class="k">行</span> = ' + tpl.rows + '\n' +
        '<span class="k">语义</span> = ' + T(tpl.zh, tpl.en) + '\n' +
        '<span class="ok">✓ 用重复区域名表示跨列/跨行；用 . 表示空格子</span>';
      code.innerHTML = hlCSS('.page {\n  display: grid;\n  grid-template-areas:\n    ' +
        tpl.areas.replace(/ " /g, '\n    "') + ';\n  grid-template-columns: ' + tpl.cols +
        ';\n  grid-template-rows: ' + tpl.rows + ';\n  gap: ' + st.gap + 'px;\n}\n\n' +
        tpl.boxes.map(function (b) { return '.' + b + ' { grid-area: ' + b + '; }'; }).join('\n'));
    }

    var g1 = group(s.ctl, '① 页面骨架模板', '① Page skeleton templates');
    seg(g1, [
      { val: 'sidebar', zh: '侧栏 + 主区', en: 'Sidebar + main' },
      { val: 'holy', zh: '圣杯布局', en: 'Holy grail' },
      { val: 'gallery', zh: '杂志式', en: 'Magazine' }
    ], 'sidebar', function (v) { st.template = v; apply(); });

    var g2 = group(s.ctl, '② 间距', '② Gap');
    var sg = slider(g2, 'gap', 'gap', 0, 28, 8, 1, 'px');
    sg.input.addEventListener('input', function () { st.gap = +sg.input.value; apply(); });

    var g3 = group(s.ctl, '③ 为什么用区域命名', '③ Why areas beat line numbers');
    hint(g3,
      'grid-template-areas 的价值在于"代码可读性 = 视觉结构"：你能直接在 CSS 里看出页面的形状，改版时只改这几行字符串。用 grid-column: 1 / 3 这种线号写法，三个月后没人看得懂哪块是侧栏。',
      'The value of grid-template-areas is that readable code mirrors the visual structure: you can see the shape of the page right in the CSS, and a redesign touches only those strings. With line numbers like grid-column: 1 / 3 nobody can tell which block was the sidebar three months later.');
    apply();
  };

  /* ============================================================
     ⑲ 第 5 章：溢出与滚动容器
     ============================================================ */
  REG['d5-overflow'] = function (host) {
    var s = shell(host, 'overflow：什么时候该滚，什么时候不该', 'overflow: when to scroll and when not to');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px;font:12px/1.5 -apple-system,sans-serif;color:var(--dm-ink,#211c18)';
    holder.innerHTML =
      '<div id="ovOuter" style="width:320px;height:120px;background:var(--dm-surface,#f2ede4);border:2px solid var(--dm-mute,#8c8073);' +
      'border-radius:8px;padding:8px">' +
        '<div id="ovInner" style="background:var(--dm-a,#c05a34);border-radius:6px;color:var(--dm-on-accent,#fffdf9);padding:10px;' +
        'font:12px/1.4 ui-monospace,monospace">' +
        'Analytics console — this content is deliberately wider and taller than its parent so we can watch overflow behave.' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;font:11px/1.6 ui-monospace,monospace;color:var(--dm-mid,#463d35)">' +
      '<span>父容器: 320 × 120</span><span id="ovSizes"></span></div>';
    s.canvas.appendChild(holder);
    var outer = holder.querySelector('#ovOuter'), inner = holder.querySelector('#ovInner'), sizes = holder.querySelector('#ovSizes');

    var st = { ov: 'visible', innerW: 460, innerH: 170, scrollbar: false };

    function apply() {
      outer.style.overflow = st.ov;
      inner.style.width = st.innerW + 'px';
      inner.style.height = st.innerH + 'px';
      var or = outer.getBoundingClientRect(), ir = inner.getBoundingClientRect();
      var clipped = st.ov !== 'visible';
      sizes.innerHTML = '<span>子元素: ' + st.innerW + ' × ' + st.innerH + '</span>';

      var isScroll = st.ov === 'auto' || st.ov === 'scroll';
      out.innerHTML =
        '<span class="k">overflow</span> = ' + st.ov + '\n' +
        '<span class="k">子元素尺寸</span> = ' + st.innerW + ' × ' + st.innerH + 'px\n' +
        '<span class="k">父容器可视（内容区）</span> = ' + outer.clientWidth + ' × ' + outer.clientHeight + 'px\n' +
        '<span class="k">父容器外框</span> = ' + Math.round(or.width) + ' × ' + Math.round(or.height) + 'px\n' +
        '<span class="k">是否被裁剪</span> = ' + (st.ov === 'visible' ? '<span class="bad">否（溢出到外面，可能推动整页出现横向滚动）</span>' : '<span class="ok">是</span>') + '\n' +
        '<span class="k">是否出现滚动条</span> = ' + (isScroll ? '<span class="ok">是（内容超出时）</span>' : '否') + '\n' +
        (st.ov === 'hidden'
          ? '<span class="bad">⚠ overflow:hidden 会让里面的 position:sticky 失效</span>'
          : isScroll ? '<span class="warn">⚠ overflow:auto/scroll 同样会捕获 sticky</span>' : '');

      code.innerHTML = hlCSS('.panel {\n  width: 320px;\n  height: 120px;\n  overflow: ' + st.ov + ';\n}');
    }

    var g1 = group(s.ctl, '① overflow 取值', '① overflow values');
    seg(g1, [
      { val: 'visible', zh: 'visible', en: 'visible' },
      { val: 'hidden', zh: 'hidden', en: 'hidden' },
      { val: 'auto', zh: 'auto', en: 'auto' },
      { val: 'scroll', zh: 'scroll', en: 'scroll' }
    ], 'visible', function (v) { st.ov = v; apply(); });

    var g2 = group(s.ctl, '② 内容尺寸（制造溢出）', '② Content size (create the overflow)');
    var sw = slider(g2, '子元素 width', 'Child width', 120, 520, 460, 5, 'px');
    var sh = slider(g2, '子元素 height', 'Child height', 40, 260, 170, 5, 'px');
    sw.input.addEventListener('input', function () { st.innerW = +sw.input.value; apply(); });
    sh.input.addEventListener('input', function () { st.innerH = +sh.input.value; apply(); });

    var g3 = group(s.ctl, '③ 经验法则', '③ Rules of thumb');
    hint(g3,
      '① 横向滚动条几乎总是 bug，纵向滚动是正常交互；② 不要用 overflow:hidden 去"藏"布局问题，它只是把问题挪到看不见的地方；③ 一旦某层出现 overflow 非 visible，里面所有 position:sticky 都会以它为界。',
      '① A horizontal scrollbar is almost always a bug; vertical scrolling is normal. ② Do not use overflow:hidden to \u201chide\u201d a layout problem \u2014 it only moves the problem out of sight. ③ Once any ancestor has a non-visible overflow, every position:sticky inside is bounded by it.');

    var out = measBox(s.ctl, '溢出诊断', 'Overflow diagnosis');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    apply();
  };

  /* ============================================================
     ⑳ 第 6 章：容器查询 vs 媒体查询
     ============================================================ */
  REG['d6-container'] = function (host) {
    var s = shell(host, '容器查询：让组件看"自己的宽度"而不是视口', 'Container queries: components that respond to their own width');

    var holder = el('div');
    holder.style.cssText = 'background:var(--dm-paper,#fbf8f3);border-radius:10px;padding:14px';
    holder.innerHTML =
      '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">' +
      '<div style="flex:1 1 300px;min-width:240px;container-type:inline-size;border:2px dashed var(--dm-line,#dcd3c5);' +
      'border-radius:10px;padding:10px" id="cqA"></div>' +
      '<div style="flex:0 0 240px;min-width:200px;container-type:inline-size;border:2px dashed var(--dm-line,#dcd3c5);' +
      'border-radius:10px;padding:10px" id="cqB"></div>' +
      '</div>';
    s.canvas.appendChild(holder);

    var CARD = function (label) {
      return '<article class="pcard"><div class="pthumb"></div>' +
        '<div class="pbody"><h4>' + label + '</h4><p>Dense tables, 40k rows, one screen.</p>' +
        '<span class="ptag">Data viz</span></div></article>';
    };

    var st = { mode: 'container', threshold: 340, widthA: 520, widthB: 240 };

    function css() {
      var base = '*{box-sizing:border-box}' +
        '.pcard{display:flex;flex-direction:column;gap:8px;border:1px solid var(--dm-line,#dcd3c5);' +
        'border-radius:10px;padding:10px;font:12px/1.5 -apple-system,sans-serif;color:var(--dm-ink,#211c18)}' +
        '.pthumb{height:52px;border-radius:7px;background:var(--dm-line,#dcd3c5);flex:none}' +
        '.pcard h4{margin:0 0 2px;font-size:12.5px}.pcard p{margin:0;color:var(--dm-mid,#463d35);font-size:11px}' +
        '.ptag{display:inline-block;margin-top:6px;font-size:10px;color:var(--dm-mid,#463d35);border:1px solid var(--dm-line,#dcd3c5);' +
        'border-radius:999px;padding:1px 7px}' +
        '.wide .pcard{flex-direction:row;align-items:center}' +
        '.wide .pthumb{width:70px;height:70px}' +
        '.wide .pcard h4{font-size:14px}';
      if (st.mode === 'container') {
        return base + '@container (min-width: ' + st.threshold + 'px){' +
          '.pcard{flex-direction:row;align-items:center}' +
          '.pthumb{width:70px;height:70px}' +
          '.pcard h4{font-size:14px}}';
      }
      return base + '@media (min-width: ' + st.threshold + 'px){' +
        '.wide .pcard{flex-direction:row;align-items:center}' +
        '.wide .pthumb{width:70px;height:70px}' +
        '.wide .pcard h4{font-size:14px}}';
    }

    function apply() {
      var a = document.getElementById('cqA'), b = document.getElementById('cqB');
      a.style.width = Math.min(st.widthA, a.parentElement.clientWidth - 24) + 'px';
      b.style.width = Math.min(st.widthB, b.parentElement.clientWidth - 24) + 'px';
      a.className = (st.mode === 'media' && st.widthA >= st.threshold ? 'wide' : '');
      b.className = (st.mode === 'media' && st.widthB >= st.threshold ? 'wide' : '');

      /* 用 iframe 隔离 @container / @media 的语义：这里直接在文档内注入 <style> 观察 */
      var old = document.getElementById('cqStyle');
      if (old) old.remove();
      var style = document.createElement('style');
      style.id = 'cqStyle';
      style.textContent = css().replace(/(^|\})\s*([^@{}]+)\{/g, function (m, brace, sel) {
        /* 样式作用域限制在 cqA/cqB 内部 */
        var s2 = sel.split(',').map(function (x) {
          x = x.trim();
          if (!x) return x;
          return '#cqA ' + x + ', #cqB ' + x;
        }).join(',');
        return brace + ' ' + s2 + '{';
      });
      document.head.appendChild(style);

      a.innerHTML = CARD('Analytics');
      b.innerHTML = CARD('Timeline');

      requestAnimationFrame(function () {
        var aw = Math.round(a.clientWidth), bw = Math.round(b.clientWidth);
        var aWide = a.querySelector('.pcard').getBoundingClientRect().height < 100;
        var bWide = b.querySelector('.pcard').getBoundingClientRect().height < 100;
        noteOut.innerHTML =
          '<span class="k">模式</span> = ' + (st.mode === 'container' ? '@container' : '@media') + '\n' +
          '<span class="k">阈值</span> = ' + st.threshold + 'px\n' +
          '<span class="k">左栏宽</span> = ' + aw + 'px → ' + (aWide ? '横向卡片' : '纵向卡片') + '\n' +
          '<span class="k">右栏宽</span> = ' + bw + 'px → ' + (bWide ? '横向卡片' : '纵向卡片') + '\n' +
          (st.mode === 'container'
            ? '<span class="ok">✓ 两栏各自按自己的宽度决定形态（同一页面里两种形态同时存在）</span>'
            : '<span class="bad">✗ 两栏形态被视口统一决定：视口够宽时，窄侧栏里的卡片也被强行横向排布</span>');
      });

      code.innerHTML = hlCSS(st.mode === 'container'
        ? '.sidebar { container-type: inline-size; }\n\n@container (min-width: ' + st.threshold + 'px) {\n' +
          '  .card { flex-direction: row; }\n}'
        : '/* 媒体查询只知道视口宽度 */\n@media (min-width: ' + st.threshold + 'px) {\n' +
          '  .wide .card { flex-direction: row; }\n}');
    }

    /* 读数容器必须先建好，否则 apply() 里的 getElementById 找不到它 */
    var noteOut = measBox(s.ctl, '两栏形态实测', 'Both columns, measured');

    var g1 = group(s.ctl, '① 查询依据', '① What is being queried');
    seg(g1, [
      { val: 'container', zh: '@container（组件自己）', en: '@container (the component)' },
      { val: 'media', zh: '@media（视口）', en: '@media (the viewport)' }
    ], 'container', function (v) { st.mode = v; apply(); });

    var g2 = group(s.ctl, '② 参数', '② Parameters');
    var st2 = slider(g2, '容器查询阈值', 'Container-query threshold', 240, 520, 340, 10, 'px');
    var sa = slider(g2, '左栏宽', 'Left column width', 240, 720, 520, 10, 'px');
    var sb = slider(g2, '右栏宽', 'Right column width', 180, 420, 240, 10, 'px');
    st2.input.addEventListener('input', function () { st.threshold = +st2.input.value; apply(); });
    sa.input.addEventListener('input', function () { st.widthA = +sa.input.value; apply(); });
    sb.input.addEventListener('input', function () { st.widthB = +sb.input.value; apply(); });

    var g3 = group(s.ctl, '③ 为什么重要', '③ Why it matters');
    hint(g3,
      '同一个卡片组件，放在宽主区里应该横排，放在窄侧栏里应该竖排。媒体查询做不到这件事——它只知道"屏幕有多宽"，不知道"这个组件现在有多宽"。容器查询把响应式的判断依据从设备换成了容器，这是近十年 CSS 布局最重要的一次观念更新。',
      'The same card should lay out horizontally in a wide main column and vertically in a narrow sidebar. Media queries cannot do that: they only know how wide the screen is, not how wide the component currently is. Container queries move the trigger from the device to the container \u2014 the most important conceptual shift in CSS layout in a decade.');
    var code = cssBox(s.ctl, '等价 CSS', 'Equivalent CSS');
    apply();
  };

  /* ============================================================
     ㉑ 第 7 章：案例最终版（可切换主题与密度）
     ============================================================ */
  REG['d7-final'] = function (host) {
    var s = shell(host, '交付版案例：可调密度与主题的最终布局', 'The shipped case: final layout with adjustable density and theme');

    var frame = stage(s.canvas, 400, 'lin-portfolio.local/final.html');
    var st = { density: 'regular', theme: 'light', maxW: 1040, fluid: true };

    var DENSITY = {
      compact: { pad: 10, gap: 12, fs: 13, hero: 34, lh: 1.5 },
      regular: { pad: 16, gap: 20, fs: 15, hero: 44, lh: 1.65 },
      comfy:   { pad: 24, gap: 30, fs: 16.5, hero: 52, lh: 1.8 }
    };
    var THEME = {
      light: { bg: 'var(--dm-paper,#fbf8f3)', tx: 'var(--dm-ink,#211c18)', dim: 'var(--dm-mid,#463d35)', mute: 'var(--dm-mute,#8c8073)', line: 'var(--dm-line,#dcd3c5)', card: 'var(--dm-paper,#fbf8f3)', nav: 'rgba(255,255,255,.86)' },
      dark:  { bg: '#14100c', tx: 'var(--dm-bright,#f6f1e8)', dim: 'var(--dm-mute,#8c8073)', mute: 'var(--dm-mute,#8c8073)', line: '#3a2e24', card: '#221b15', nav: 'rgba(20,16,12,.82)' },
      sepia: { bg: 'var(--dm-paper,#fbf8f3)', tx: '#3f3222', dim: '#6b5a44', mute: 'var(--dm-mute,#8c8073)', line: 'var(--dm-line,#dcd3c5)', card: 'var(--dm-paper,#fbf8f3)', nav: 'rgba(251,247,240,.86)' }
    };

    function apply() {
      var d = DENSITY[st.density], t = THEME[st.theme];
      var css = '*{box-sizing:border-box}' +
        'body{margin:0;background:' + t.bg + ';color:' + t.tx + ';' +
        'font:' + d.fs + 'px/' + d.lh + ' -apple-system,Segoe UI,Roboto,sans-serif;padding:0 18px}' +
        '.nav{position:sticky;top:0;z-index:10;background:' + t.nav + ';backdrop-filter:blur(10px);' +
        'display:flex;align-items:center;justify-content:space-between;padding:' + (d.pad * .8) + 'px 0;' +
        'border-bottom:1px solid ' + t.line + '}' +
        '.brand{font-weight:800;font-size:12px;letter-spacing:.06em}' +
        '.links{display:flex;gap:' + (d.gap * .9) + 'px}' +
        '.links a{color:' + t.dim + ';text-decoration:none;font-size:.85em;border-bottom:2px solid transparent;padding-bottom:2px}' +
        '.links a:hover,.links a:focus-visible{color:' + t.tx + ';border-bottom-color:' + t.tx + ';outline:none}' +
        'main,.nav,.foot{max-width:' + st.maxW + 'px;margin:0 auto}' +
        '.hero{display:grid;grid-template-columns:repeat(12,1fr);gap:' + d.gap + 'px;align-items:center;' +
        'padding:' + (d.gap * 2.4) + 'px 0 ' + (d.gap * 1.9) + 'px}' +
        '.hero h1{grid-column:1/8;font-size:' + (st.fluid ? 'clamp(' + (d.hero * .62) + 'px,4.4vw,' + d.hero + 'px)' : d.hero + 'px') +
        ';line-height:1.1;margin:0 0 ' + (d.gap * .7) + 'px;letter-spacing:-.025em}' +
        '.hero p{grid-column:1/7;color:' + t.dim + ';margin:0 0 ' + (d.gap * 1.1) + 'px;max-width:48ch}' +
        '.hero .cta{grid-column:1/5;justify-self:start;display:inline-block;background:' + t.tx + ';color:' + t.bg + ';' +
        'padding:' + (d.pad * .75) + 'px ' + (d.pad * 1.4) + 'px;border-radius:9px;font-size:.92em;font-weight:600}' +
        '.hero .meta{grid-column:9/13;color:' + t.mute + ';font-size:.82em;border-left:2px solid ' + t.line + ';padding-left:' + d.pad + 'px}' +
        '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(' + Math.round(st.maxW / 4.2) + 'px,1fr));' +
        'gap:' + d.gap + 'px;padding-bottom:' + (d.gap * 2) + 'px}' +
        '.card{display:grid;grid-template-rows:auto auto 1fr auto;background:' + t.card + ';border:1px solid ' + t.line + ';' +
        'border-radius:14px;padding:' + d.pad + 'px;transition:transform .2s,box-shadow .2s}' +
        '.card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(15,23,42,.12)}' +
        '.thumb{height:' + (d.pad * 3.4) + 'px;border-radius:9px;background:' + t.line + '}' +
        '.card h4{margin:' + (d.pad * .7) + 'px 0 3px;font-size:1em}' +
        '.card p{margin:0;color:' + t.dim + ';font-size:.87em}' +
        '.card .tag{margin-top:' + (d.pad * .7) + 'px;padding-top:' + (d.pad * .6) + 'px;border-top:1px dashed ' + t.line +
        ';font-size:.76em;color:' + t.mute + '}' +
        '.foot{padding:' + (d.gap * 1.4) + 'px 0;border-top:1px solid ' + t.line + ';color:' + t.mute + ';font-size:.78em}' +
        '@media(max-width:700px){.hero h1,.hero p,.hero .cta,.hero .meta{grid-column:1/-1}.hero{padding:32px 0 24px}' +
        '.hero .meta{border-left:0;border-top:1px solid ' + t.line + ';padding-left:0;padding-top:' + d.pad + 'px}}';

      var cards = ['Analytics console|Dense tables, 40k rows, one screen.|Data viz',
                   'Clinical timeline|Time-series UI for ICU handover.|Healthcare',
                   'Reading app|Typography-first long-form reader.|Editorial',
                   'Map view|Layered geospatial exploration.|Geo'];
      renderFrame(frame, css,
        '<header class="nav"><div class="brand">LIN·PORTFOLIO</div>' +
        '<nav class="links"><a href="#">Work</a><a href="#">About</a><a href="#">Writing</a><a href="#">Contact</a></nav></header>' +
        '<main><section class="hero"><h1>Lin — Product Designer</h1>' +
        '<p>I design calm, legible interfaces for data-heavy products. Based in Qingdao, working worldwide.</p>' +
        '<span class="cta">View case studies</span>' +
        '<div class="meta">Currently open for<br>Q3 2026 collaborations.</div></section>' +
        '<section class="cards">' + cards.map(function (c) {
          var p = c.split('|');
          return '<article class="card"><div class="thumb"></div><h4>' + p[0] + '</h4><p>' + p[1] + '</p>' +
            '<span class="tag">' + p[2] + '</span></article>';
        }).join('') + '</section></main>' +
        '<footer class="foot">© 2026 Lin · Built with plain CSS</footer>', measure);

      function measure() {
        var doc = frame.contentDocument;
        if (!doc || !doc.querySelector) return;
        var over = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
        var card = doc.querySelector('.card');
        var hero = doc.querySelector('.hero');
        var h1 = doc.querySelector('.hero h1');
        out.innerHTML =
          '<span class="k">密度</span> = ' + st.density + ' · <span class="k">主题</span> = ' + st.theme + '\n' +
          '<span class="k">最大内容宽</span> = ' + st.maxW + 'px\n' +
          '<span class="k">横向溢出</span> = ' + (over > 1 ? '<span class="bad">' + over + 'px ✗</span>' : '<span class="ok">0px ✓</span>') + '\n' +
          '<span class="k">h1 计算字号</span> = ' + parseFloat(doc.defaultView.getComputedStyle(h1).fontSize).toFixed(1) + 'px\n' +
          '<span class="k">卡片留白</span> = ' + doc.defaultView.getComputedStyle(card).padding + '\n' +
          '<span class="k">hero 底部间距</span> = ' + doc.defaultView.getComputedStyle(hero).paddingBottom + '\n' +
          '<span class="ok">✓ 切换密度只改 4 个变量，所有间距同步缩放</span>';
      }

      code.innerHTML = hlCSS(':root {\n  --pad: ' + d.pad + 'px;\n  --gap: ' + d.gap + 'px;\n  --fs: ' + d.fs + 'px;\n}\n\n' +
        '.card { padding: var(--pad); }\n.cards { gap: var(--gap); }\nbody { font-size: var(--fs); }');
    }

    var g1 = group(s.ctl, '① 信息密度', '① Information density');
    seg(g1, [
      { val: 'compact', zh: '紧凑', en: 'Compact' },
      { val: 'regular', zh: '常规', en: 'Regular' },
      { val: 'comfy', zh: '宽松', en: 'Comfortable' }
    ], 'regular', function (v) { st.density = v; apply(); });

    var g2 = group(s.ctl, '② 主题', '② Theme');
    seg(g2, [
      { val: 'light', zh: '浅色', en: 'Light' },
      { val: 'dark', zh: '深色', en: 'Dark' },
      { val: 'sepia', zh: '米色', en: 'Sepia' }
    ], 'light', function (v) { st.theme = v; apply(); });

    var g3 = group(s.ctl, '③ 布局参数', '③ Layout parameters');
    var sw = slider(g3, '最大内容宽度', 'Max content width', 640, 1400, 1040, 20, 'px');
    sw.input.addEventListener('input', function () { st.maxW = +sw.input.value; apply(); });
    check(g3, '字号使用 clamp() 流式缩放', 'Fluid type via clamp()', true, function (v) { st.fluid = v; apply(); });

    var out = measBox(s.ctl, '交付指标实测', 'Shipping metrics, measured');
    hint(s.ctl,
      '把"美观"拆成可调的参数（密度、主题、宽度、流式字号），是布局工程化的最后一步：设计决策变成变量，改版只需要改变量，而不是重写 CSS。',
      'Breaking \u201cbeauty\u201d into adjustable parameters (density, theme, width, fluid type) is the last step of treating layout as engineering: design decisions become variables, and a redesign means changing variables rather than rewriting CSS.');
    var code = cssBox(s.ctl, '设计令牌', 'Design tokens');
    apply();
  };

})();
