/**
 * 页脚诗句点击播放视频（自适应比例，无黑边版）
 * for Hexo Fluid
 *
 * 用法：
 *   1. 把诗句 <span> 加上 id="footer-poem"
 *   2. 本文件放到 source/js/footer-video.js
 *   3. _config.fluid.yml 里 custom_js 追加 - /js/footer-video.js
 */
(function () {
  'use strict';

  // ============ 配置区 ============
  // 本地 mp4：放 source/videos/ 下，写成 '/videos/xxx.mp4'
  // B站/YouTube：清空 VIDEO_SRC，填 IFRAME_SRC
  const VIDEO_SRC  = '/videos/鹧鸪天·桂花.mp4';
  const IFRAME_SRC = ''; // 例：'//player.bilibili.com/player.html?bvid=BVxxxx&autoplay=1&high_quality=1&danmaku=0'
  const POEM_SEL   = '#footer-poem';
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
      /* 盒子不写死比例，用 fit-content 裹住视频真实尺寸 —— 无黑边 */
      #poem-box{
        position:relative;
        background:#000;
        border-radius:14px;overflow:hidden;
        box-shadow:0 24px 64px rgba(0,0,0,.45);
        transform:scale(.96);
        transition:transform .35s cubic-bezier(.22,1,.36,1);
        line-height:0;font-size:0;
      }
      #poem-mask.show #poem-box{transform:scale(1);}
      /* video 按自身比例缩放，宽高各受屏幕约束 */
      #poem-box video{
        display:block;
        width:auto;height:auto;
        max-width:min(88vw,440px);
        max-height:88vh;
      }
      /* iframe 无固有尺寸，仍给一个 9:16 框 */
      #poem-box iframe{
        display:block;border:0;
        width:min(88vw,440px);
        aspect-ratio:9/16;
        max-height:88vh;
      }
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
    const inner = IFRAME_SRC
      ? `<iframe src="${IFRAME_SRC}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
      : `<video src="${VIDEO_SRC}" controls autoplay playsinline></video>`;
    mask.innerHTML = `<div id="poem-box"><button id="poem-close" aria-label="关闭">✕</button>${inner}</div>`;
    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => mask.classList.add('show'));

    mask.addEventListener('click', function (e) {
      if (e.target === mask || e.target.id === 'poem-close') close();
    });
  }

  function close() {
    if (!mask) return;
    const m = mask;
    mask = null;
    m.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { m.remove(); }, 350); // 移除即停止播放
  }

  // 事件委托到 document，绑一次即可，Fluid 的 pjax 换页也不失效
  document.addEventListener('click', function (e) {
    if (e.target.closest(POEM_SEL)) open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
