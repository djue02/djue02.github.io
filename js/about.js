/* ============================================================
 * 隐藏 about 页面的向下滚动箭头（独立脚本 about.js）
 * ------------------------------------------------------------
 * 仅在 /about 路径生效。原逻辑，未改动。
 * ============================================================ */
(function () {
  if (!window.location.pathname.includes('/about')) return;

  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  whenReady(function () {
    var arrow = document.querySelector('.scroll-down-bar');
    if (arrow) {
      arrow.style.display = 'none';
    }
  });
})();
