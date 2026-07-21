/**
 * 页脚诗句点击播放视频（自适应比例 · 无黑边 · 无横屏闪烁）
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
      /* 盒子默认隐藏，等视频元数据就绪（拿到真实宽高）再露出 —— 杜绝 300x150 横框闪烁 */
      #poem-box{
        position:relative;
        background:#000;
        border-radius:14px;overflow:hidden;
        box-shadow:0 24px 64px rgba(0,0,0,.45);
        opacity:0;transform:scale(.96);
        transition:opacity .3s ease,transform .35s cubic-bezier(.22,1,.36,1);
        line-height:0;font-size:0;
      }
      #poem-box.ready{opacity:1;transform:scale(1);}
      /* video 按自身比例缩放，宽高各受屏幕约束 —— 无黑边 */
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

    // 遮罩立即淡入，点击有即时反馈（捕获局部引用，避免与 close 竞态）
    const m = mask;
    requestAnimationFrame(() => m.classList.add('show'));

    // 盒子等元数据就绪再出场
    const box = mask.querySelector('#poem-box');
    const video = mask.querySelector('video');
    const reveal = () => box && box.classList.add('ready');

    if (video) {
      if (video.readyState >= 1) {
        // 元数据已在缓存里，直接显示
        requestAnimationFrame(reveal);
      } else {
        video.addEventListener('loadedmetadata', reveal, { once: true });
        video.addEventListener('error', reveal, { once: true }); // 加载失败也别卡住界面
        setTimeout(reveal, 3000); // 兜底：3 秒还没元数据就先显示
      }
    } else {
      requestAnimationFrame(reveal); // iframe 没有元数据事件，直接显示
    }

    mask.addEventListener('click', function (e) {
      if (e.target === mask || e.target.id === 'poem-close') close();
    });
  }

  function close() {
    if (!mask) return;
    const m = mask;
    mask = null;
    const v = m.querySelector('video');
    if (v) v.pause(); // 立即静音停播，别让声音拖到淡出结束
    m.classList.remove('show');
    const box = m.querySelector('#poem-box');
    if (box) box.classList.remove('ready');
    document.body.style.overflow = '';
    setTimeout(function () { m.remove(); }, 350); // 动画播完再移除节点
  }

  // 事件委托到 document，绑一次即可，Fluid 的 pjax 换页也不失效
  document.addEventListener('click', function (e) {
    if (e.target.closest(POEM_SEL)) open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
