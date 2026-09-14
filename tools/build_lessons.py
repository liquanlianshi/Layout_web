#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/build_lessons.py — 从双语词库生成七章教学页面

页面结构（与样例一致）：
  顶栏 → 章节头 → 左目录 + 章节卡片（每张卡片一套「讲解 / 关键代码 / 演示」三 tab）→ 翻页 → 页脚

每章 3 张卡片，每张卡片正好对应本章的一个小节：
  讲解 = 该小节的理论
  关键代码 = 该小节对应的实现
  演示 = 该小节对应的可交互演示

运行： python3 tools/build_lessons.py
"""
import os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 注意：链接必须指向具体的 index.html。
# 在 file:// 协议下浏览器不会把目录解析成 index.html，而是列出目录内容。
NAV = [('1', '../lesson-01/index.html', 'nav.ch1'),
       ('2', '../lesson-02/index.html', 'nav.ch2'),
       ('3', '../lesson-03/index.html', 'nav.ch3'),
       ('4', '../lesson-04/index.html', 'nav.ch4'),
       ('5', '../lesson-05/index.html', 'nav.ch5'),
       ('6', '../lesson-06/index.html', 'nav.ch6'),
       ('7', '../lesson-07/index.html', 'nav.ch7')]

PAGER = {
    1: (None, ('第 2 章 盒模型与文档流', 'Chapter 2 \\u00b7 Box Model & Normal Flow', '../lesson-02/index.html')),
    2: (('../lesson-01/index.html',), ('第 3 章 Flexbox 一维布局', 'Chapter 3 \\u00b7 Flexbox', '../lesson-03/index.html')),
    3: (('../lesson-02/index.html',), ('第 4 章 Grid 二维布局', 'Chapter 4 \\u00b7 Grid', '../lesson-04/index.html')),
    4: (('../lesson-03/index.html',), ('第 5 章 定位、层叠与溢出', 'Chapter 5 \\u00b7 Positioning & Stacking', '../lesson-05/index.html')),
    5: (('../lesson-04/index.html',), ('第 6 章 响应式与流式思维', 'Chapter 6 \\u00b7 Responsive & Fluid', '../lesson-06/index.html')),
    6: (('../lesson-05/index.html',), ('第 7 章 综合实战：交付级布局', 'Chapter 7 \\u00b7 Capstone', '../lesson-07/index.html')),
    7: (('../lesson-06/index.html',), None),
}

# ============================================================
# 关键代码：每章 3 段，与三个小节一一对应
# 代码本体语言无关；注释用中文，英文讲解放在 key-point 中
# ============================================================
CODE = {
1: [
("L1.code1.t", "L1.code1.p", "L1.code1.k",
"""// 把“难看”翻译成四个可测量的数字
function auditLayout(root = document) {
  const box = (el) => el.getBoundingClientRect();

  // ① 横向溢出：> 0 说明有东西顶破了容器
  const de = root.documentElement;
  const overflowX = de.scrollWidth - de.clientWidth;

  // ② 层级比：标题字号 ÷ 正文字号，建议 >= 2
  const h1 = root.querySelector('h1');
  const p  = root.querySelector('p');
  const ratio = parseFloat(getComputedStyle(h1).fontSize)
              / parseFloat(getComputedStyle(p).fontSize);

  // ③ 对齐质量：左边缘有几种不同的 x 值
  const lefts = [...root.querySelectorAll('h1, p, .card')]
    .map(el => Math.round(box(el).left));
  const edges = new Set(lefts).size;

  // ④ 组内 vs 组间间距：比例低于 2.5 就会分组错乱
  const cards = [...root.querySelectorAll('.card')];
  const outer = cards.length > 1
    ? box(cards[1]).top - box(cards[0]).bottom : 0;
  const inner = box(cards[0].querySelector('p')).top
              - box(cards[0].querySelector('h3')).bottom;

  return { overflowX, ratio: +ratio.toFixed(2), edges,
           spacingRatio: inner > 0 ? +(outer / inner).toFixed(2) : null };
}

// 在控制台里随时调用：auditLayout()
// → { overflowX: 0, ratio: 2.13, edges: 3, spacingRatio: 3.25 }"""),

("L1.code2.t", "L1.code2.p", "L1.code2.k",
"""/* 间距阶梯：4px 基准 × 约 1.5 比例
   只用这几个值，且“组内”永远取比“组间”小的档位 */
:root {
  --sp-1: 4px;    /* 图标与文字之间 */
  --sp-2: 8px;
  --sp-3: 12px;   /* 组内：标题 ↔ 正文 */
  --sp-4: 20px;   /* 组间最小值 */
  --sp-5: 32px;   /* 区块之间 */
  --sp-6: 48px;   /* 章节之间 */
}

/* ✅ 正确的分组：组内 12px < 组间 32px，比例 2.7 */
.section { display: grid; gap: var(--sp-5); }
.card h3 { margin: 0 0 var(--sp-3); }
.card p  { margin: 0; }

/* ❌ 错误示范：组内比组间还大，标题会被读成“下一段的一部分” */
.card--bad h3 { margin-bottom: 28px; }
.card--bad    { margin-bottom: 16px; }"""),

("L1.code3.t", "L1.code3.p", "L1.code3.k",
"""/* 字号阶梯：比例 1.25（大三度）
   相邻层级差异 >= 1.25 倍才可感知；
   标题与正文建议 >= 2 倍，用 clamp() 让比值保持不变 */
:root {
  --fs-base: clamp(15px, 0.9rem + 0.25vw, 17px);
}

h1 { font-size: clamp(30px, 4.4vw, 44px); }  /* ≈ 2.6 × base */
h2 { font-size: clamp(22px, 2.6vw, 30px); }  /* ≈ 1.8 × base */
h3 { font-size: clamp(17px, 1.6vw, 20px); }  /* ≈ 1.2 × base */
p  { font-size: var(--fs-base); line-height: 1.65; }

/* 验证：把窗口从 320px 拖到 1440px，
   字号在变，但 h1 : p 的比值始终 ≈ 2.6 —— 层级不会因屏幕而瓦解 */"""),
],
2: [
("L2.code1.t", "L2.code1.p", "L2.code1.k",
"""/* ① 全局 border-box：让“宽度怎么分”变成可推理的算术题 */
*, *::before, *::after { box-sizing: border-box; }

/* ② 主区 + 侧栏：容器 960px、间距 24px
   ❌ 错误：.main{width:640px} + .side{width:320px} + padding:20px
            → 实际占用 (640+40) + (320+40) = 1040px，侧栏被挤下去
   ✅ 正确：只描述“怎么分”，不描述“各占多少像素” */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;  /* 主区吸收剩余空间 */
  gap: 24px;
  max-width: 960px;
  margin-inline: auto;
}

/* ③ 需要固定宽度的元素，用 flex-basis 而不是 width */
.side { flex: 0 0 320px; }"""),

("L2.code2.t", "L2.code2.p", "L2.code2.k",
"""/* 现象：两个块的外边距“消失了”
   A: margin-bottom: 20px
   B: margin-top:    30px
   实测间隙 = 30px，而不是 50px —— 相邻外边距发生了塌陷 */

/* ❌ 反面写法：overflow:hidden 会裁剪内容、破坏内部 sticky */
.parent--bad  { overflow: hidden; }

/* △ 能用但有副作用：加 padding / border 会改变视觉尺寸 */
.parent--ok   { padding-block: 1px; }

/* ✅ 推荐：flow-root 建立 BFC，且不改变元素的外部表现 */
.parent--good { display: flow-root; }

/* 同样的思路也用于“父元素包住浮动子元素” */
.clearfix-self { display: flow-root; }

/* 更彻底的办法：用 gap 管理间距，从根上避开塌陷 */
.stack { display: flex; flex-direction: column; gap: 30px; }"""),

("L2.code3.t", "L2.code3.p", "L2.code3.k",
"""/* 三种显示类型的边界：inline 不接受宽高 */
.tag   { display: inline-block; padding: 2px 10px; }  /* 可设宽高，且能并排 */

.label { display: inline; }        /* width / height 被忽略 */
.label { padding: 12px 0; }        /* 垂直 padding 溢出到相邻行，但不撑开行高 */

/* 长内容兜底：横向滚动条最常见的来源 */
.prose {
  overflow-wrap: anywhere;   /* ✅ 必要时才断行 */
  /* word-break: break-all;  ❌ 会无差别切断所有单词 */
}

/* 表格 / 代码块等真正需要横向滚动的元素：
   把滚动限制在元素内部，而不是让整页滚动 */
.table-scroll {
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}"""),
],
3: [
("L3.code1.t", "L3.code1.p", "L3.code1.k",
"""/* 导航条：两端对齐 + 垂直居中，各一行 */
.nav {
  display: flex;
  align-items: center;            /* 交叉轴：中线对齐 */
  justify-content: space-between; /* 主轴：首尾贴边 */
  gap: 16px;
  padding: 12px 20px;
}

/* 左右字号不同时，基线对齐往往比中线对齐更“正” */
.nav--baseline { align-items: baseline; }

/* 按钮组内部的间距用 gap，而不是给每个按钮加 margin */
.nav__links { display: flex; align-items: center; gap: 18px; }

/* 不要用 space-between 做“均匀分布”：
   它描述的是端点与容器的关系，gap 描述的才是元素之间的关系 */
.toolbar     { display: flex; gap: 8px; }                       /* ✅ */
.toolbar--bad{ display: flex; justify-content: space-around; }  /* △ 语义含糊 */"""),

("L3.code2.t", "L3.code2.p", "L3.code2.k",
"""/* 卡片底部对齐：让“查看案例”链接永远贴底 */
.card {
  display: flex;
  flex-direction: column;   /* 主轴变成纵向 */
  gap: 8px;
  padding: 16px;
}

.card__thumb { aspect-ratio: 16 / 10; border-radius: 10px; }

/* margin-top:auto 会吃掉所有剩余空间，把链接推到底部 ——
   这是 flex 容器里 margin:auto 的特殊语义 */
.card__cta { margin-top: auto; }

/* 同一个技巧也用于水平居中 */
.center-x { margin-inline: auto; }

/* ⚠️ 只在 flex / grid 容器里有效；
   普通块布局中 margin:auto 不会吸收剩余空间 */"""),

("L3.code3.t", "L3.code3.p", "L3.code3.k",
"""/* flex: 1    = 1 1 0%   → 严格等宽（忽略内容多少）
   flex: auto = 1 1 auto → 按内容比例分配（内容多的更宽） */

/* ✅ 等宽三栏 */
.grid-3 > * { flex: 1; }

/* ✅ 侧栏固定 + 主区自适应 */
.layout { display: flex; gap: 24px; }
.layout__side { flex: 0 0 280px; }        /* 不伸不缩，固定 280px */
.layout__main { flex: 1; min-width: 0; }  /* 吸收剩余；min-width 必须显式写 0 */

/* ✅ 2 : 1 比例 */
.split > :first-child { flex: 2; }
.split > :last-child  { flex: 1; }

/* 分配公式：
   最终宽度 = flex-basis + 剩余空间 × (自己的 grow ÷ Σgrow)
   剩余为负时，按 flex-shrink × flex-basis 加权吸收

   ⚠️ flex 项目的默认最小尺寸是 auto（不小于内容宽度），
      长内容会把它顶宽并产生横向滚动条 */"""),
],
4: [
("L4.code1.t", "L4.code1.p", "L4.code1.k",
"""/* 用“画图”的方式写整页骨架：代码可读性 = 视觉结构 */
.page {
  display: grid;
  grid-template-areas:
    "header header header"
    "side   main   main"
    "footer footer footer";
  grid-template-columns: 220px minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  min-height: 100dvh;
}

.header { grid-area: header; }
.side   { grid-area: side;   }
.main   { grid-area: main;   }
.footer { grid-area: footer; }

/* 相邻格子写同一个名字 = 自动合并成一个跨列区域；
   用 . 表示空格子；不需要为每个元素算线号 */

/* 响应式：只改这张“图”，其他规则一行都不用动 */
@media (max-width: 640px) {
  .page {
    grid-template-areas: "header" "main" "side" "footer";
    grid-template-columns: minmax(0, 1fr);
  }
}"""),

("L4.code2.t", "L4.code2.p", "L4.code2.k",
"""/* 一行 CSS 取代三到四个断点：不写媒体查询的响应式卡片区 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

/* minmax 的最小值由“内容”决定，而不是由设备型号决定：
   240px = 卡片里最长那行文字不换行所需的宽度 */

/* auto-fit vs auto-fill：差别只在空轨道是否被折叠 */
.cards--fit  { grid-template-columns: repeat(auto-fit,  minmax(240px, 1fr)); }
/* auto-fit  ：空轨道折叠，剩余卡片拉伸填满整行
   auto-fill ：空轨道保留，卡片保持最小宽度，右侧留白 */

/* 传统写法（对比用）：三个断点 + 手算百分比宽度 */
@media (min-width: 768px)  { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .cards { grid-template-columns: repeat(3, 1fr); } }
/* 问题：768–1100px 之间是死区；组件放进窄侧栏时完全不适用 */"""),

("L4.code3.t", "L4.code3.p", "L4.code3.k",
"""/* 1fr 的最小值是 auto，不保证收缩。
   含长 URL / <pre> / 宽表格的网格项目会把轨道顶宽 */

/* ❌ 长内容会把轨道顶宽，出现横向滚动条 */
.grid--bad  { grid-template-columns: 200px 1fr; }

/* ✅ 显式允许缩到 0 */
.grid--good { grid-template-columns: 200px minmax(0, 1fr); }

/* 同样的规则适用于 flex 项目 */
.flex--good > * { min-width: 0; }

/* 再把不可避免的滚动限制在元素内部 */
.grid--good > * { overflow-x: auto; }

/* 完整的三件套：
   ① minmax(0, 1fr)  允许轨道收缩
   ② min-width: 0    允许 flex 项目收缩
   ③ overflow-x: auto 把滚动限制在元素内部
   缺任何一件，横向滚动条都会跑到整页上 */"""),
],
5: [
("L5.code1.t", "L5.code1.p", "L5.code1.k",
"""/* 可用的吸顶导航：三件事缺一不可 */
.nav {
  position: sticky;
  top: 0;                             /* ① 必须有阈值，否则等于没写 */
  z-index: var(--z-sticky);           /* ② 必须抬高层级 */
  background: rgba(255,255,255,.86);  /* ③ 必须有背景，否则内容会透出来 */
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
}

/* ⚠️ sticky 失效的三大原因
   ① 没写 top / bottom                → 没有粘附点
   ② 祖先有 overflow: hidden/auto/scroll → 被限制在那个容器内
   ③ 父元素高度 = 自身高度             → 没有可粘的距离 */

/* 用脚本一次性找出“吃掉 sticky”的祖先 */
[...document.querySelectorAll('.nav')].forEach(el => {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const ov = getComputedStyle(p).overflow;
    if (ov !== 'visible') console.warn('sticky 被限制在：', p, ov);
  }
});"""),

("L5.code2.t", "L5.code2.p", "L5.code2.k",
"""/* 卡片角标：relative 最重要的用途是“给子元素提供包含块” */
.card {
  position: relative;   /* 本身不移动，只是定义坐标系 */
  /* ⚠️ 不要顺手加 z-index！那会建立层叠上下文，
        把角标的 z-index 关进这一层里 */
}

.card__badge {
  position: absolute;
  top: 12px;
  right: 12px;          /* 参照最近的“已定位”祖先 = .card */
  padding: 2px 8px;
  border-radius: 999px;
  background: #f43f5e;
  color: #fff;
  font-size: 11px;
}

/* ❌ 反例：父元素没有 position，角标会跑到“初始包含块”（页面左上角） */
.card--bad { position: static; }

/* ⚠️ 祖先有 transform / filter / will-change 时，fixed 元素
      也会以它为包含块 —— “fixed 不固定在视口”的头号原因 */"""),

("L5.code3.t", "L5.code3.p", "L5.code3.k",
"""/* ❌ 不要靠“把数字写大”解决层叠问题 */
.popover--bad { z-index: 99999; }   /* 下一个开发者会写 999999 */

/* ✅ 正确做法：给页面划分有限的几层，写进设计令牌 */
:root {
  --z-base:     0;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  300;
  --z-modal:    400;
  --z-toast:    500;
}

.nav      { position: sticky; top: 0;  z-index: var(--z-sticky); }
.dropdown { position: absolute;        z-index: var(--z-dropdown); }
.modal    { position: fixed; inset: 0; z-index: var(--z-modal); }

/* 关键：模态框最好渲染在 <body> 的直接子级，
   这样它不会落进任何祖先的层叠上下文
   （UI 库把弹层挂到 body 就是这个原因）
   z-index 只在同一个层叠上下文内部比较，它不是全局优先级 */

/* 需要主动建立层叠上下文时，用无副作用的 isolation */
.card--isolated { isolation: isolate; }"""),
],
6: [
("L6.code1.t", "L6.code1.p", "L6.code1.k",
"""/* 流式字号：把设计语言直接翻译成一个表达式
   “360px 宽时 20px，1100px 宽时 44px，两端截断” */
h1 {
  font-size: clamp(20px, 0.9rem + 3.2vw, 44px);
}

/* 展开成等价的可读形式：
   clamp(min, preferred, max)
   preferred = min + (max − min) × (100vw − vwMin) / (vwMax − vwMin) */

/* 对比：媒体查询产生阶梯函数，断点之间是死区 */
h1 { font-size: 20px; }
@media (min-width: 1100px) { h1 { font-size: 44px; } }
/* 问题：760px 时仍然是 20px —— 半大不小的尴尬尺寸 */

/* ⚠️ 千万不要只写 vw：小屏上会小到无法阅读 */
h1 { font-size: 4vw; }        /* ❌ 320px 时只有 12.8px */

/* clamp 不影响浏览器缩放；但正文最小不要低于 15–16px */"""),

("L6.code2.t", "L6.code2.p", "L6.code2.k",
"""/* 容器查询：让组件看“自己的宽度”，而不是视口宽度 */

/* ① 在父元素上声明查询容器 */
.sidebar, .main-column {
  container-type: inline-size;   /* 行内方向成为查询容器 */
  container-name: card-host;     /* 可选：命名，便于精确查询 */
}

/* ② 在子元素上按容器宽度改变内部布局 */
.card { display: flex; flex-direction: column; gap: 8px; }

@container card-host (min-width: 420px) {
  .card { flex-direction: row; align-items: center; }
  .card__thumb { width: 72px; height: 72px; }
  .card h4 { font-size: 1.05rem; }
}

/* 效果：同一个卡片组件，在宽主区里横排、在窄侧栏里竖排，
   两种形态可以在同一屏内同时存在 */

/* 代价：container-type: inline-size 会让该元素在行内方向上的
   尺寸不再由内容决定（width:auto 变为占满可用宽度） */

/* 三者不互斥：整页骨架用媒体查询 / auto-fit，组件内部用容器查询 */"""),

("L6.code3.t", "L6.code3.p", "L6.code3.k",
"""/* 移动端视口单位：vh 的四个兄弟 */
.hero {
  height: 100vh;    /* ❌ 最大视口：地址栏显示时底部被遮住 */
  height: 100svh;   /* 小视口：地址栏展开时的可视高度 */
  height: 100lvh;   /* 大视口：地址栏收起时的可视高度 */
  height: 100dvh;   /* ✅ 动态视口：随浏览器 UI 实时变化，首选 */
}

/* 安全区：避开 iPhone 底部横条与刘海 */
.bottom-bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.fab {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
}

/* 触控目标最小 44 × 44px —— 低于这个尺寸误触率显著上升 */
.tap-target { min-height: 44px; min-width: 44px; }"""),
],
7: [
("L7.code1.t", "L7.code1.p", "L7.code1.k",
"""/* 用设计令牌驱动密度切换：把设计决策变量化 */
:root {
  --pad: 16px;   /* 组件内边距 */
  --gap: 20px;   /* 组件之间 */
  --fs:  15px;   /* 正文字号 */
  --lh:  1.65;   /* 行高 */
  --hero: 44px;  /* 标题上限 */
}
[data-density="compact"] { --pad: 10px; --gap: 12px; --fs: 13px;   --lh: 1.5; --hero: 34px; }
[data-density="comfy"]   { --pad: 24px; --gap: 30px; --fs: 16.5px; --lh: 1.8; --hero: 52px; }

/* 所有组件只引用变量，不写死数值 */
body     { font-size: var(--fs); line-height: var(--lh); }
.cards   { display: grid; gap: var(--gap); }
.card    { padding: var(--pad); border-radius: 14px; }
.hero h1 { font-size: clamp(calc(var(--hero) * .62), 4.4vw, var(--hero)); }

/* ✅ 切换密度只改变量 → 比例关系保持不变，变的是尺度
   ❌ 若组件里写死 padding:16px，一次全局调整要改几十处 */

/* 主题同理：换的是令牌，不是布局规则 */
[data-theme="dark"] { --bg: #14100c; --tx: #f4ece0; --line: #3a2e24; }"""),

("L7.code2.t", "L7.code2.p", "L7.code2.k",
"""/* ===== 交付级布局骨架：六章知识的合成 ===== */
*, *::before, *::after { box-sizing: border-box; }        /* 第 2 章 */

body {
  margin: 0;
  font-size: clamp(15px, 0.9rem + 0.25vw, 17px);          /* 第 6 章 */
  line-height: 1.65;
  overflow-wrap: anywhere;                                 /* 第 2 章 */
}

.nav {
  position: sticky; top: 0; z-index: var(--z-sticky);      /* 第 5 章 */
  display: flex; align-items: center;
  justify-content: space-between; gap: var(--gap);         /* 第 3 章 */
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(12px);
}

.page {
  display: grid;
  grid-template-areas: "header header" "side main" "footer footer";
  grid-template-columns: 220px minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: var(--gap);                                          /* 第 4 章 */
  max-width: 1040px; margin-inline: auto;
  min-height: 100dvh;                                       /* 第 6 章 */
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--gap);
}

.card {
  display: flex; flex-direction: column;                    /* 第 3 章 */
  padding: var(--pad);                                      /* 第 7 章 */
  min-width: 0;                                             /* 第 4 章 */
}
.card__cta { margin-top: auto; }                            /* 第 3 章 */

img { max-width: 100%; height: auto; aspect-ratio: 16 / 10; } /* 第 7 章 */

@media (max-width: 700px) {
  .page {
    grid-template-areas: "header" "main" "side" "footer";
    grid-template-columns: minmax(0, 1fr);
  }
}"""),

("L7.code3.t", "L7.code3.p", "L7.code3.k",
"""/* 可复用的一次性体检：直接粘进 DevTools Console 运行 */
function preflight() {
  const de = document.documentElement;
  const issues = [];

  // ① 横向溢出
  const over = de.scrollWidth - de.clientWidth;
  if (over > 1) issues.push(`横向溢出 ${over}px，检查 min-width:0 / max-width:100%`);

  // ② 触控目标
  document.querySelectorAll('a, button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && (r.height < 44 || r.width < 44))
      issues.push(`触控目标过小 ${Math.round(r.width)}×${Math.round(r.height)}:`, el);
  });

  // ③ 层级比
  const h1 = document.querySelector('h1'), p = document.querySelector('p');
  if (h1 && p) {
    const ratio = parseFloat(getComputedStyle(h1).fontSize)
                / parseFloat(getComputedStyle(p).fontSize);
    if (ratio < 2) issues.push(`标题层级不足：h1/p = ${ratio.toFixed(2)}×，建议 ≥ 2`);
  }

  // ④ 图片缺少尺寸约束
  document.querySelectorAll('img').forEach(img => {
    if (getComputedStyle(img).maxWidth !== '100%')
      issues.push('图片缺少 max-width:100%：', img);
  });

  // ⑤ 祖先 overflow 是否吃掉了 sticky
  document.querySelectorAll('.sticky').forEach(el => {
    for (let q = el.parentElement; q; q = q.parentElement) {
      if (getComputedStyle(q).overflow !== 'visible') {
        issues.push('sticky 被祖先 overflow 限制：', q); break;
      }
    }
  });

  console.table(issues);
  return issues.length ? issues : '✓ 全部通过';
}"""),
],
}

# ============================================================
# 各章三个小节的讲解块 + 三张卡片的演示
# ============================================================
LESSONS = {
1: dict(
  intro='L1.intro.p',
  secs=[
    dict(h='L1.sec1.h', blocks=[('p', 'L1.sec1.p1'), ('p', 'L1.sec1.p2'), ('note', 'L1.sec1.note')]),
    dict(h='L1.sec2.h', blocks=[
        ('p', 'L1.sec2.p1'),
        ('table', dict(caption='L1.sec2.table',
                       head=['L1.sec2.th1', 'L1.sec2.th2', 'L1.sec2.th3'],
                       rows=[['L1.sec2.r%da' % i, 'L1.sec2.r%db' % i, 'L1.sec2.r%dc' % i] for i in range(1, 5)])),
        ('p', 'L1.sec2.p2')]),
    dict(h='L1.sec3.h', blocks=[('p', 'L1.sec3.p1'),
        ('ul', ['L1.sec3.ul1', 'L1.sec3.ul2', 'L1.sec3.ul3']),
        ('p', 'L1.sec3.p2'), ('note', 'L1.sec3.note')]),
  ],
  demos=[('d1-case', 'L1.demo1.hint'), ('d1-gestalt', 'L1.demo2.hint'), ('d1-align', 'L1.demo3.hint')],
),
2: dict(
  intro='L2.intro.p',
  secs=[
    dict(h='L2.sec1.h', blocks=[('p', 'L2.sec1.p1'),
        ('table', dict(caption='L2.sec1.table',
                       head=['L2.sec1.th1', 'L2.sec1.th2', 'L2.sec1.th3', 'L2.sec1.th4'],
                       rows=[['L2.sec1.r%da' % i, 'L2.sec1.r%db' % i, 'L2.sec1.r%dc' % i, 'L2.sec1.r%dd' % i] for i in (1, 2)])),
        ('note', 'L2.sec1.note')]),
    dict(h='L2.sec2.h', blocks=[('p', 'L2.sec2.p1'),
        ('ul', ['L2.sec2.ul1', 'L2.sec2.ul2', 'L2.sec2.ul3']), ('p', 'L2.sec2.p2')]),
    dict(h='L2.sec3.h', blocks=[
        ('table', dict(caption='L2.sec3.table',
                       head=['L2.sec3.th1', 'L2.sec3.th2', 'L2.sec3.th3', 'L2.sec3.th4', 'L2.sec3.th5'],
                       rows=[['L2.sec3.r%da' % i, 'L2.sec3.r%db' % i, 'L2.sec3.r%dc' % i,
                              'L2.sec3.r%dd' % i, 'L2.sec3.r%de' % i] for i in (1, 2, 3)])),
        ('p', 'L2.sec3.p1'), ('note', 'L2.sec3.note')]),
  ],
  demos=[('d2-boxmodel', 'L2.demo1.hint'), ('d2-collapse', 'L2.demo2.hint'), ('d2-display', 'L2.demo3.hint')],
),
3: dict(
  intro='L3.intro.p',
  secs=[
    dict(h='L3.sec1.h', blocks=[('p', 'L3.sec1.p1'), ('p', 'L3.sec1.p2'),
        ('table', dict(caption='L3.sec1.table',
                       head=['L3.sec1.th1', 'L3.sec1.th2', 'L3.sec1.th3'],
                       rows=[['L3.sec1.r%da' % i, 'L3.sec1.r%db' % i, 'L3.sec1.r%dc' % i] for i in range(1, 7)])),
        ('note', 'L3.sec1.note')]),
    dict(h='L3.sec2.h', blocks=[('p', 'L3.sec2.p1'),
        ('table', dict(caption='L3.sec2.table',
                       head=['L3.sec2.th1', 'L3.sec2.th2', 'L3.sec2.th3'],
                       rows=[['L3.sec2.r%da' % i, 'L3.sec2.r%db' % i, 'L3.sec2.r%dc' % i] for i in range(1, 5)])),
        ('p', 'L3.sec2.p2')]),
    dict(h='L3.sec3.h', blocks=[('p', 'L3.sec3.p1'),
        ('ul', ['L3.sec3.ul1', 'L3.sec3.ul2', 'L3.sec3.ul3']), ('note', 'L3.sec3.note')]),
  ],
  demos=[('d3-axis', 'L3.demo1.hint'), ('d3-grow', 'L3.demo2.hint'), ('d3-navbar', 'L3.demo3.hint')],
),
4: dict(
  intro='L4.intro.p',
  secs=[
    dict(h='L4.sec1.h', blocks=[('p', 'L4.sec1.p1'),
        ('table', dict(caption='L4.sec1.table',
                       head=['L4.sec1.th1', 'L4.sec1.th2', 'L4.sec1.th3'],
                       rows=[['L4.sec1.r%da' % i, 'L4.sec1.r%db' % i, 'L4.sec1.r%dc' % i] for i in range(1, 4)])),
        ('p', 'L4.sec1.p2')]),
    dict(h='L4.sec2.h', blocks=[('p', 'L4.sec2.p1'),
        ('table', dict(caption='L4.sec2.table',
                       head=['L4.sec2.th1', 'L4.sec2.th2', 'L4.sec2.th3'],
                       rows=[['L4.sec2.r%da' % i, 'L4.sec2.r%db' % i, 'L4.sec2.r%dc' % i] for i in (1, 2)])),
        ('p', 'L4.sec2.p2')]),
    dict(h='L4.sec3.h', blocks=[('p', 'L4.sec3.p1'),
        ('table', dict(caption='L4.sec3.table',
                       head=['L4.sec3.th1', 'L4.sec3.th2', 'L4.sec3.th3', 'L4.sec3.th4'],
                       rows=[['L4.sec3.r%da' % i, 'L4.sec3.r%db' % i, 'L4.sec3.r%dc' % i, 'L4.sec3.r%dd' % i] for i in (1, 2)])),
        ('note', 'L4.sec3.note')]),
  ],
  demos=[('d4-grid', 'L4.demo1.hint'), ('d4-autofit', 'L4.demo2.hint'), ('d4-areas', 'L4.demo3.hint')],
),
5: dict(
  intro='L5.intro.p',
  secs=[
    dict(h='L5.sec1.h', blocks=[
        ('table', dict(caption='L5.sec1.table',
                       head=['L5.sec1.th1', 'L5.sec1.th2', 'L5.sec1.th3', 'L5.sec1.th4'],
                       rows=[['L5.sec1.r%da' % i, 'L5.sec1.r%db' % i, 'L5.sec1.r%dc' % i, 'L5.sec1.r%dd' % i] for i in range(1, 6)])),
        ('note', 'L5.sec1.note')]),
    dict(h='L5.sec2.h', blocks=[('p', 'L5.sec2.p1'),
        ('ul', ['L5.sec2.ul1', 'L5.sec2.ul2', 'L5.sec2.ul3']), ('note', 'L5.sec2.note')]),
    dict(h='L5.sec3.h', blocks=[('p', 'L5.sec3.p1'), ('p', 'L5.sec3.p2'),
        ('table', dict(caption='L5.sec3.table',
                       head=['L5.sec3.th1', 'L5.sec3.th2'],
                       rows=[['L5.sec3.r%da' % i, 'L5.sec3.r%db' % i] for i in range(1, 6)]))]),
  ],
  demos=[('d5-position', 'L5.demo1.hint'), ('d5-stack', 'L5.demo2.hint'), ('d5-overflow', 'L5.demo3.hint')],
),
6: dict(
  intro='L6.intro.p',
  secs=[
    dict(h='L6.sec1.h', blocks=[('p', 'L6.sec1.p1'), ('p', 'L6.sec1.p2'), ('note', 'L6.sec1.note')]),
    dict(h='L6.sec2.h', blocks=[('p', 'L6.sec2.p1'),
        ('table', dict(caption='L6.sec2.table',
                       head=['L6.sec2.th1', 'L6.sec2.th2', 'L6.sec2.th3'],
                       rows=[['L6.sec2.r%da' % i, 'L6.sec2.r%db' % i, 'L6.sec2.r%dc' % i] for i in range(1, 5)])),
        ('p', 'L6.sec2.p2')]),
    dict(h='L6.sec3.h', blocks=[('p', 'L6.sec3.p1'),
        ('table', dict(caption='L6.sec3.table',
                       head=['L6.sec3.th1', 'L6.sec3.th2', 'L6.sec3.th3'],
                       rows=[['L6.sec3.r%da' % i, 'L6.sec3.r%db' % i, 'L6.sec3.r%dc' % i] for i in (1, 2, 3)])),
        ('note', 'L6.sec3.note')]),
  ],
  demos=[('d6-breakpoint', 'L6.demo1.hint'), ('d6-clamp', 'L6.demo2.hint'), ('d6-container', 'L6.demo3.hint')],
),
7: dict(
  intro='L7.intro.p',
  secs=[
    dict(h='L7.sec1.h', blocks=[('p', 'L7.sec1.p1'),
        ('table', dict(caption='L7.sec1.table',
                       head=['L7.sec1.th1', 'L7.sec1.th2', 'L7.sec1.th3', 'L7.sec1.th4'],
                       rows=[['L7.sec1.r%d%s' % (i, c) for c in 'abcd'] for i in range(1, 11)]))]),
    dict(h='L7.sec2.h', blocks=[('p', 'L7.sec2.p1'),
        ('ol', ['L7.sec2.ol%d' % i for i in range(1, 9)])]),
    dict(h='L7.sec3.h', blocks=[('p', 'L7.sec3.p1'), ('note', 'L7.sec3.note')]),
  ],
  demos=[('d7-pitfalls', 'L7.demo1.hint'), ('d7-checklist', 'L7.demo2.hint'), ('d7-final', 'L7.demo3.hint')],
),
}


def esc(src):
    return html.escape(src, quote=False)


def render_blocks(blocks):
    out = []
    for kind, val in blocks:
        if kind == 'p':
            out.append(f'<p data-i18n-html="{val}"></p>')
        elif kind == 'note':
            out.append(f'<p class="note" data-i18n-html="{val}"></p>')
        elif kind == 'ul':
            out.append('<ul>' + ''.join(f'<li data-i18n-html="{k}"></li>' for k in val) + '</ul>')
        elif kind == 'ol':
            out.append('<ol>' + ''.join(f'<li data-i18n-html="{k}"></li>' for k in val) + '</ol>')
        elif kind == 'table':
            head = ''.join(f'<th data-i18n="{k}"></th>' for k in val['head'])
            rows = ''.join('<tr>' + ''.join(f'<td data-i18n-html="{k}"></td>' for k in r) + '</tr>'
                           for r in val['rows'])
            cap = f'<h4 data-i18n="{val["caption"]}"></h4>' if val.get('caption') else ''
            out.append(cap + '<table class="theory-table"><thead><tr>' + head +
                       '</tr></thead><tbody>' + rows + '</tbody></table>')
    return '\n              '.join(out)


def build_page(n):
    lesson = LESSONS[n]
    meta = PAGER[n]
    title_key = f'L{n}.title'
    sub_key = f'L{n}.subtitle'
    cid = f'ch-{n}'

    tabs_html = '\n'.join(
        f'    <li><a href="{href}" data-ch="{ch}" data-i18n="{label}"></a></li>'
        for ch, href, label in NAV)

    toc_html = '\n'.join(
        f'        <li><a href="#{cid}-{i+1}" data-chapter="{cid}-{i+1}"'
        f'{" class=\"active\"" if i == 0 else ""} data-i18n="{s["h"]}"></a></li>'
        for i, s in enumerate(lesson['secs']))

    articles = []
    for i, s in enumerate(lesson['secs']):
        t, p, k, src = CODE[n][i]
        did, hint = lesson['demos'][i]
        head_blocks = ([('p', lesson['intro'])] if i == 0 else []) + s['blocks']
        articles.append(f"""
      <!-- ============= {meta and ''}{n}.{i+1} ============= -->
      <article class="chapter{' active' if i == 0 else ''}" id="{cid}-{i+1}"
               data-plate="Plate {n}.{i+1}">
        <h2><span class="num" data-i18n="L{n}.sec{i+1}.num"></span><span class="ttl" data-i18n="L{n}.sec{i+1}.h"></span></h2>
        <p class="chapter-subtitle" data-i18n="{sub_key}"></p>

        <div class="tabs" data-tabs>
          <button class="tab-btn active" data-tab="explain" data-i18n="tab.explain"></button>
          <button class="tab-btn" data-tab="code" data-i18n="tab.code"></button>
          <button class="tab-btn" data-tab="demo" data-i18n="tab.demo"></button>
        </div>

        <div class="tab-panels">
          <!-- 讲解 -->
          <div class="tab-panel active" data-panel="explain">
              {render_blocks(head_blocks)}
          </div>

          <!-- 关键代码 -->
          <div class="tab-panel" data-panel="code">
            <h3 data-i18n="{t}"></h3>
            <p class="code-purpose" data-i18n-html="{p}"></p>
            <pre><code class="lang-css">{esc(src)}</code></pre>
            <p class="key-point" data-i18n-html="{k}"></p>
          </div>

          <!-- 演示 -->
          <div class="tab-panel" data-panel="demo">
            <p class="demo-hint" data-i18n="{hint}"></p>
            <div class="demo-mount" data-demo="{did}"></div>
          </div>
        </div>
      </article>""")

    prev, nxt = meta
    pager_prev = (f'<a class="pager-prev" href="{prev[0]}">'
                  f'<span class="pager-dir" data-i18n="common.prev"></span>'
                  f'<span class="pager-title" data-i18n="nav.ch{n-1}"></span></a>') if prev else \
                 '<span class="pager-prev empty"></span>'
    pager_next = (f'<a class="pager-next" href="{nxt[2]}">'
                  f'<span class="pager-dir" data-i18n="common.next"></span>'
                  f'<span class="pager-title" data-i18n="nav.ch{n+1}"></span></a>') if nxt else \
                 '<span class="pager-next empty"></span>'

    tone = (n - 1) % 3 + 1
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>第 {n} 章 · 页面布局 / Chapter {n} · Page Layout</title>
<script>
/* 标题跟随语言：
   ① 首屏从 URL 的 ?lang= 读取（localStorage 在 file:// 下不跨页面持久化）
   ② 之后由 langchange 事件驱动，按 L 键或点语言开关也会同步更新 */
(function () {{
  var CH = {n};
  function setTitle(lang) {{
    document.title = (lang === 'en-US' || lang === 'en')
      ? 'Chapter ' + CH + ' · Page Layout'
      : '第 ' + CH + ' 章 · 页面布局';
  }}
  try {{
    var m = /[?&]lang=([^&#]+)/.exec(location.search);
    var v = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    if (v) setTitle(v.indexOf('en') === 0 ? 'en-US' : 'zh-CN');
  }} catch (e) {{}}
  document.addEventListener('langchange', function (ev) {{
    setTitle(ev.detail && ev.detail.lang);
  }});
}})();
</script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f7f4ed'/%3E%3Ctext x='32' y='45' font-family='Songti SC,Georgia,serif' font-size='44' font-weight='600' fill='%23bc4a24' text-anchor='middle'%3EL%3C/text%3E%3C/svg%3E" />
<link rel="stylesheet" href="../styles.css" />
</head>
<body>
<div class="edge-band" data-tone="{tone}" aria-hidden="true"></div>
<span class="edge-label" aria-hidden="true">第 {n} 章 · 页面布局</span>
<div class="bg-field bg-field--a" aria-hidden="true"></div>
<div class="bg-field bg-field--b" aria-hidden="true"></div>
<div class="bg-field bg-field--c" aria-hidden="true"></div>
<div class="regmark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
<span class="margin-mark margin-mark--right" aria-hidden="true">SEVEN CHAPTERS · PAGE LAYOUT</span>

<!-- ============ 顶栏 ============ -->
<nav class="course-topbar" data-current="{n}">
  <a class="brand" href="../index.html">
    <span class="back">←</span><span class="logo-dot">L</span>
    <span data-i18n="nav.home"></span>
  </a>
  <ul class="tabs">
{tabs_html}
  </ul>
  <div class="lang-switch">
    <button data-set-lang="zh-CN" class="active">中文</button>
    <button data-set-lang="en-US">EN</button>
  </div>
</nav>

<!-- ============ 章节头 ============ -->
<header class="lesson-header" data-folio="Chapter {n} / 07 — Plate 01–03">
  <div>
    <h1><span class="chip">CH {n:02d}</span><span data-i18n="{title_key}"></span></h1>
    <p class="subtitle" data-i18n="{sub_key}"></p>
  </div>
  <div class="header-tip">
    <span class="kbd">Tab</span> <span data-i18n="tip.tab"></span> ·
    <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span>
    <span data-i18n="tip.tabs"></span> ·
    <span class="kbd">L</span> <span data-i18n="tip.lang"></span>
  </div>
</header>

<main class="lesson-main">
  <!-- 左侧章节目录 -->
  <aside class="chapter-nav">
    <h3 data-i18n="common.chapter"></h3>
    <ul>
{toc_html}
    </ul>
    <div class="nav-tip">
      <a href="../index.html">↗ <span data-i18n="common.portal"></span></a><br>
      <a href="../index.html#live">↗ <span data-i18n="common.demo"></span></a>
    </div>
  </aside>

  <!-- 章节内容 -->
  <section class="chapter-content">
{''.join(articles)}
  </section>
</main>

<footer class="lesson-footer">
  <p data-i18n="footer.case"></p>
  <p data-i18n="footer.note"></p>
</footer>

<nav class="chapter-pager">
  {pager_prev}
  <a class="pager-portal" href="../index.html" data-i18n="common.portal"></a>
  {pager_next}
</nav>

<script src="../i18n.js"></script>
<script src="../lesson-content.js"></script>
<script src="../site.js"></script>
<script src="../demos.js"></script>
</body>
</html>
"""


if __name__ == '__main__':
    for n in range(1, 8):
        d = os.path.join(ROOT, 'lesson-%02d' % n)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(build_page(n))
        print('built lesson-%02d/index.html' % n)
