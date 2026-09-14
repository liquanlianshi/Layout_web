/* ============================================================
   extra-content.js — 门户页「案例演化」演示的双语词库
   Bilingual word base for the portal evolution demo
   ============================================================ */
(function () {
  'use strict';
  if (!window.I18N) return;

  window.I18N.register({

    'evo.title':  { zh: '案例演化：同一个页面，四种布局', en: 'Case Evolution: one page, four layouts' },
    'evo.live':   { zh: '真实渲染 · 可交互', en: 'Live render · interactive' },
    'evo.ctl':    { zh: '控制 · Controls', en: 'Controls' },
    'evo.play':   { zh: '▶ 自动播放全部', en: '▶ Play all stages' },
    'evo.prev':   { zh: '← 上一阶段', en: '← Previous stage' },
    'evo.next':   { zh: '下一阶段 →', en: 'Next stage →' },
    'evo.why':    { zh: '为什么', en: 'Why' },
    'evo.css':    { zh: '当前生效的布局代码', en: 'Layout CSS in effect' },
    'evo.overlay':{ zh: '叠加 12 列网格参考线', en: 'Overlay 12-column grid guides' },
    'evo.spacing':{ zh: '显示间距 / 盒模型描边', en: 'Show spacing & box outlines' },
    'evo.m1':     { zh: '溢出 overflow', en: 'Overflow' },
    'evo.m2':     { zh: '对齐基线', en: 'Alignment' },
    'evo.m3':     { zh: '阅读层级', en: 'Hierarchy' },
    'evo.s0':     { zh: '阶段 0 · 原始', en: 'Stage 0 · Raw' },
    'evo.s1':     { zh: '阶段 1 · 文档流', en: 'Stage 1 · Normal flow' },
    'evo.s2':     { zh: '阶段 2 · Flexbox', en: 'Stage 2 · Flexbox' },
    'evo.s3':     { zh: '阶段 3 · Grid', en: 'Stage 3 · Grid' },
    'evo.s4':     { zh: '阶段 4 · 交付版', en: 'Stage 4 · Shipped' },
    'evo.st.over.ok':  { zh: '无横向滚动', en: 'no horizontal scroll' },
    'evo.st.over.bad': { zh: '出现横向滚动条', en: 'horizontal scrollbar appears' },
    'evo.st.al.ok':    { zh: '中线对齐', en: 'centres aligned' },
    'evo.st.al.bad':   { zh: '中线错位', en: 'centres misaligned' },
    'evo.st.hi.ok':    { zh: '层级 2× 以上', en: 'contrast 2× or better' },
    'evo.st.hi.mid':   { zh: '层级偏弱（1.6–2×）', en: 'weak contrast (1.6–2×)' },
    'evo.st.hi.bad':   { zh: '层级不足（<1.6×）', en: 'insufficient (<1.6×)' },
    'evo.w0': { zh: '所有元素都是默认 block：卡片竖着堆、导航竖着排、标签一个占一行，还出现了横向溢出。这是"能跑但难看"的起点。',
                en: 'Everything is a default block: cards stack vertically, nav links stack, tags each take a whole line, and content overflows horizontally. This is the "it runs but looks wrong" starting point.' },
    'evo.w1': { zh: '只加了 max-width 与 margin:auto 让内容居中，加上统一的 line-height 与间距阶梯。层级开始出现，但仍然没有真正的空间分配。',
                en: 'Add max-width plus margin:auto to centre the content, unify line-height and use a spacing scale. Hierarchy appears, but there is still no real space distribution.' },
    'evo.w2': { zh: '导航和卡片列表改用 display:flex。一维方向的"横向排列 + 两端对齐 + 自动换行"交给弹性布局，是最小改动最大收益的一步。',
                en: 'Nav and card list switch to display:flex. Horizontal arrangement, space-between and wrapping are delegated to flexbox — the biggest win for the smallest change.' },
    'evo.w3': { zh: '整页改成二维网格：12 列轨道 + auto-fit minmax 卡片区。列宽不再是写死的像素，而是按比例分配剩余空间。',
                en: 'The page becomes a two-dimensional grid: 12 column tracks plus an auto-fit minmax card area. Column widths are no longer hard-coded pixels but proportional shares of leftover space.' },
    'evo.w4': { zh: '最后补上定位与层叠（吸顶导航）、流式字号 clamp()、焦点可见性。此时页面才算"能交付"。',
                en: 'Finally positioning and stacking (sticky nav), fluid type with clamp() and visible focus states. Only now is the page shippable.' }
  });
})();
