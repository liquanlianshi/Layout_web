/* ============================================================
   site.js — 每页共享的交互：顶栏当前项、章节导航高亮、
   阅读进度、Tab 切换、键盘快捷键
   零依赖 / zero dependencies
   ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    /* ---------- 1. 顶栏当前章节高亮 ---------- */
    var bar = document.querySelector('.course-topbar');
    if (bar) {
      var cur = bar.getAttribute('data-current');
      if (cur) {
        var links = bar.querySelectorAll('.tabs a');
        for (var i = 0; i < links.length; i++) {
          if (links[i].getAttribute('data-ch') === cur) { links[i].classList.add('current'); break; }
        }
      }
    }

    /* ---------- 2. 阅读进度条 ---------- */
    var prog = document.createElement('div');
    prog.className = 'read-progress';
    document.body.appendChild(prog);
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      prog.style.width = Math.max(0, Math.min(100, p)) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- 3. Tab 切换 ---------- */
    document.querySelectorAll('.tabs[data-tabs]').forEach(function (group) {
      var btns = group.querySelectorAll('.tab-btn');
      var wrap = group.parentElement.querySelector('.tab-panels');
      if (!wrap) return;
      var panels = wrap.querySelectorAll(':scope > .tab-panel');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          panels.forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-panel') === name);
          });
          /* 演示面板第一次显示时才初始化（省性能） */
          if (name === 'demo') {
            var mount = wrap.querySelector('.tab-panel[data-panel="demo"] .demo-mount');
            if (mount && window.LAYOUT_DEMOS && !mount.dataset.booted) {
              window.LAYOUT_DEMOS.mount(mount);
            }
          }
        });
      });
    });

    /* 触屏 / 窄屏不启用键盘跳转 */
    var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.chapter-nav a[data-chapter]'));

    /* ---------- 4. 章节导航滚动高亮（scroll spy） ---------- */
    if (chapters.length && navLinks.length && 'IntersectionObserver' in window) {
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
        /* 取当前视口中最靠上的可见章节 */
        for (var i = 0; i < chapters.length; i++) {
          var id = chapters[i].id;
          if (visible[id]) {
            navLinks.forEach(function (a) {
              a.classList.toggle('active', a.getAttribute('data-chapter') === id);
            });
            break;
          }
        }
      }, { rootMargin: '-96px 0px -62% 0px', threshold: 0 });
      chapters.forEach(function (c) { io.observe(c); });
    }

    /* ---------- 5. 键盘快捷键 ----------
       Tab   : 章节内三个 tab 轮换
       ← →   : 上一章 / 下一章
       1/2/3 : 直接跳到 讲解 / 代码 / 演示
       L     : 中英切换
    -------------------------------------------------------- */
    var NUMKEY = { '1': 'explain', '2': 'code', '3': 'demo' };

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      /* 当前可见章节 = 拥有 .active 演示面板的那个，否则第一个 */
      var host = document.querySelector('.chapter:target') ||
                 currentChapter() ||
                 chapters[0];
      if (!host) return;

      if (e.key === 'Tab') {
        var btns = host.querySelectorAll('.tab-btn');
        if (!btns.length) return;
        e.preventDefault();
        var idx = 0;
        btns.forEach(function (b, i) { if (b.classList.contains('active')) idx = i; });
        btns[(idx + 1) % btns.length].click();
        host.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }
      if (NUMKEY[e.key] && host.querySelector('.tab-btn[data-tab="' + NUMKEY[e.key] + '"]')) {
        e.preventDefault();
        host.querySelector('.tab-btn[data-tab="' + NUMKEY[e.key] + '"]').click();
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        var other = (window.I18N && window.I18N.lang === 'zh-CN') ? 'en-US' : 'zh-CN';
        window.I18N && window.I18N.apply(other);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var a = document.querySelector(e.key === 'ArrowRight'
          ? '.chapter-pager .pager-next[href]' : '.chapter-pager .pager-prev[href]');
        if (a && a.getAttribute('href')) { window.location.href = a.getAttribute('href'); }
      }
    });

    function currentChapter() {
      var best = null, bestTop = -Infinity;
      chapters.forEach(function (c) {
        var top = c.getBoundingClientRect().top - 120;
        if (top <= 0 && top > bestTop) { bestTop = top; best = c; }
      });
      return best;
    }

    /* ---------- 6. 数字本地化：不处理，保持阿拉伯数字 ---------- */

    /* ---------- 7. 首次进入提示（仅门户页） ---------- */
    var hint = document.querySelector('[data-first-hint]');
    if (hint) {
      var seen = null;
      try { seen = localStorage.getItem('layout-course-seen'); } catch (e) {}
      if (seen) hint.hidden = true;
      else {
        hint.hidden = false;
        var close = hint.querySelector('button');
        if (close) close.addEventListener('click', function () {
          hint.hidden = true;
          try { localStorage.setItem('layout-course-seen', '1'); } catch (e) {}
        });
      }
    }
  });
})();
