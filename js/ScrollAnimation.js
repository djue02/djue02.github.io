/* ============================================================
   ScrollAnimation.js · 文章卡片滚动进场 · 兜底脚本
   ------------------------------------------------------------
   支持 view() 时间线的浏览器由 CSS 全权驱动，本脚本直接退出；
   仅在旧浏览器里用 IntersectionObserver 切换 .sa-in。
   没有 scroll 监听、没有节流定时器、没有逐帧测量，
   窗口缩放 / 转屏由观察器自动适应。
   ============================================================ */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) return;

  var cards = document.querySelectorAll('.index-card');
  if (!cards.length) return;

  /* 首帧同步标记已在触发线之上的卡片，再挂总开关，避免任何闪烁 */
  var line = window.innerHeight * 0.88;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getBoundingClientRect().top < line) {
      cards[i].classList.add('sa-in');
    }
  }
  document.documentElement.classList.add('sa-io');

  /* 触发线：视口底边往上 12%；顶部外扩 600px，
     让正在阅读、刚滚出顶部的卡片始终保持可见 */
  var io = new IntersectionObserver(function (entries) {
    for (var j = 0; j < entries.length; j++) {
      entries[j].target.classList.toggle('sa-in', entries[j].isIntersecting);
    }
  }, { rootMargin: '600px 0px -12% 0px' });

  for (var k = 0; k < cards.length; k++) {
    io.observe(cards[k]);
  }
})();
