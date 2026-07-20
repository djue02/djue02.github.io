/**
 * nav-pill.js — 导航栏滑块高亮(悬停跟随)
 *
 * 交互语义与右键菜单的 highlight pill 一致:
 *   首次进入 → 原地淡入(不从旧位置飞入)
 *   条目之间 → 平滑滑动(transform 过渡)
 *   离开导航 → 原地淡出(保留最后坐标)
 *
 * 依赖 nav-pill.css;事件全部委托到 document,天然兼容 pjax。
 */
(function () {
  'use strict';

  if (window.__navPillBound) return; // pjax 下脚本可能被重复执行,只绑定一次
  window.__navPillBound = true;

  var CFG = {
    NAV: '#navbar .navbar-nav',
    LINK: '#navbar .navbar-nav > .nav-item > .nav-link',
    INSET_X: 4,            // 滑块相对链接盒的横向内缩(px)
    INSET_Y: 6,            // 纵向内缩
    MIN_WIDTH: 992,        // 小于该宽度(移动端折叠菜单)时不启用
    REST_ON_ACTIVE: false  // true:鼠标离开后滑块停靠在当前页对应菜单项,而非淡出
  };

  var current = null;

  function enabled() {
    return window.innerWidth >= CFG.MIN_WIDTH;
  }

  function getNav() {
    return document.querySelector(CFG.NAV);
  }

  function getPill(nav) {
    var pill = nav.querySelector(':scope > .nav-pill');
    if (!pill) { // 初次运行或 pjax 替换 DOM 后,惰性重建
      pill = document.createElement('span');
      pill.className = 'nav-pill';
      pill.setAttribute('aria-hidden', 'true');
      nav.prepend(pill);
      current = null;
    }
    return pill;
  }

  function moveTo(link) {
    var nav = getNav();
    if (!nav || !nav.contains(link)) return;

    var pill = getPill(nav);
    var navBox = nav.getBoundingClientRect();
    var box = link.getBoundingClientRect();

    var x = box.left - navBox.left + CFG.INSET_X;
    var y = box.top - navBox.top + CFG.INSET_Y;
    var w = Math.max(0, box.width - CFG.INSET_X * 2);
    var h = Math.max(0, box.height - CFG.INSET_Y * 2);

    var firstShow = !pill.classList.contains('nav-pill--visible');
    if (firstShow) pill.classList.add('nav-pill--instant');

    pill.style.width = w + 'px';
    pill.style.height = h + 'px';
    pill.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    if (firstShow) {
      void pill.offsetWidth; // 强制回流:先落位,再恢复位移过渡
      pill.classList.remove('nav-pill--instant');
    }
    pill.classList.add('nav-pill--visible');
    current = link;
  }

  function hide() {
    var nav = getNav();
    if (!nav) return;

    if (CFG.REST_ON_ACTIVE) {
      var active = getActiveLink();
      if (active) { moveTo(active); return; }
    }

    var pill = nav.querySelector(':scope > .nav-pill');
    if (pill) pill.classList.remove('nav-pill--visible'); // 坐标保留,原地淡出
    current = null;
  }

  function getActiveLink() {
    var here = location.pathname.replace(/\/+$/, '') || '/';
    var links = document.querySelectorAll(CFG.LINK);
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.lastIndexOf('javascript:', 0) === 0) continue;
      var path;
      try {
        path = new URL(href, location.origin).pathname.replace(/\/+$/, '') || '/';
      } catch (err) {
        continue;
      }
      if (path === here) return links[i];
    }
    return null;
  }

  /* ---------- 事件绑定 ---------- */

  document.addEventListener('mouseover', function (e) {
    if (!enabled() || !(e.target instanceof Element)) return;
    var link = e.target.closest(CFG.LINK);
    if (link && link !== current) moveTo(link);
  });

  document.addEventListener('mouseout', function (e) {
    if (!enabled() || !(e.target instanceof Element)) return;
    var nav = getNav();
    if (!nav || !nav.contains(e.target)) return;
    var to = e.relatedTarget;
    if (!to || !nav.contains(to)) hide(); // 真正离开导航区域才收起,条目间移动不触发
  });

  // 键盘可达性:Tab 聚焦时同样跟随
  document.addEventListener('focusin', function (e) {
    if (!enabled() || !(e.target instanceof Element)) return;
    var link = e.target.closest(CFG.LINK);
    if (link && link !== current) moveTo(link);
  });

  document.addEventListener('focusout', function (e) {
    if (!enabled() || !(e.target instanceof Element)) return;
    var nav = getNav();
    if (!nav || !(e.target instanceof Element) || !e.target.closest(CFG.LINK)) return;
    var to = e.relatedTarget;
    if (!to || !nav.contains(to)) hide();
  });

  // 视口变化后旧坐标失效,直接收起,等待下一次悬停重新测量
  window.addEventListener('resize', hide, { passive: true });

  // pjax 完成后复位;若导航 DOM 被替换,getPill 会在下次悬停时惰性重建滑块
  document.addEventListener('pjax:complete', hide);
})();
