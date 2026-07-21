/**
 * 页脚诗句点击播放视频
 * 视频尺寸固定 1080x1920（9:16 竖屏），盒子写死比例，点开即正确
 * 无需 +faststart，无横框、无黑边
 * for Hexo Fluid
 *
 * 用法：
 *   1. 把诗句 <span> 加上 id="footer-poem"
 *   2. 本文件放到 source/js/footer-video.js
 *   3. _config.fluid.yml 里 custom_js 追加 - /js/footer-video.js
 *
 * 换了不同比例的视频？只改下面 ASPECT 一处即可（宽/高，如竖屏 '9/16'、横屏 '16/9'）
 */
(function () {
  'use strict';

  // ============ 配置区 ============
  const VIDEO_SRC = '/videos/鹧鸪天·桂花.mp4'; // 放 source/videos/ 下
  const ASPECT    = '9 / 16';             // 视频宽高比：你的是 1080x1920 = 9/16
  const MAX_W     = 440;                  // 竖屏时盒子最大宽度(px)，太宽会顶屏
  const POEM_SEL  = '#footer-poem';
  // ================================

  // ---- 样式（只注入一次，pjax 换页不受影响）----
  if (!document.getElementById('poem-video-style')) {
    const style = document.createElement('style');
    style.id = 'poem-video-style';
    style.textContent = `
      ${POEM_SEL}{cursor:pointer;transition:opacity .2s ease;}
      ${POEM_SEL}:hover{opacity:.6;}
      #poem-mask{
        position:fixed;inset:0;z-index:9999;display:flex;
        align-items:center;justify-content:center;
        background:rgba(24,20,18,.5);
        backdrop-filter:blur(10px) saturate(1.1);
        -webkit-backdrop-filter:blur(10px) saturate(1.1);
        opacity:0;transition:opacity .35s ease;
      }
      #poem-mask.show{opacity:1;}
      /* 比例写死，从第一帧起就是正确的竖屏尺寸 */
      #poem-box{
        position:relative;
        width:min(88vw, ${MAX_W}px);
        aspect-ratio:${ASPECT};
        max-height:88vh;
        background:#000;
        border-radius:14px;overflow:hidden;
        box-shadow:0 24px 64px rgba(0,0,0,.45);
        opacity:0;transform:scale(.96);
        transition:opacity .3s ease,transform .35s cubic-bezier(.22,1,.36,1);
        line-height:0;font-size:0;
      }
      #poem-mask.show #poem-box{opacity:1;transform:scale(1);}
      #poem-box video{display:block;width:100%;height:100%;object-fit:cover;}
      #poem-close{
        position:absolute;top:10px;right:10px;z-index:2;
        width:32px;height:32px;border:0;border-radius:50%;
        background:rgba(0,0,0,.4);color:#fff;font-size:18px;line-height:32px;
        cursor:pointer;transition:background .2s ease;
        backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
      }
      #poem-close:hover{background:rgba(0,0,0,.7);}
    `;
    document.head.appendChild(style);
  }

  // ---- 逻辑 ----
  let mask = null;

  function open() {
    if (mask) return;
    mask = document.createElement('div');
    mask.id = 'poem-mask';
    mask.innerHTML =
      `<div id="poem-box">` +
        `<button id="poem-close" aria-label="关闭">✕</button>` +
        `<video src="${VIDEO_SRC}" controls autoplay playsinline></video>` +
      `</div>`;
    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';

    const m = mask;
    requestAnimationFrame(() => m.classList.add('show')); // 盒子与遮罩一起淡入

    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.id === 'poem-close') close();
    });
  }

  function close() {
    if (!mask) return;
    const m = mask;
    mask = null;
    const v = m.querySelector('video');
    if (v) v.pause(); // 立即停播，声音不拖尾
    m.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { m.remove(); }, 350); // 动画播完再移除
  }

  // 事件委托到 document，绑一次即可，Fluid 的 pjax 换页也不失效
  document.addEventListener('click', function (e) {
    if (e.target.closest(POEM_SEL)) open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
