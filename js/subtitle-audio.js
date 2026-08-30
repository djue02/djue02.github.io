/**
 * subtitle-audio.js
 * 点击 Hexo Fluid banner 副标题（#subtitle）播放对应音频
 * 放置位置：博客根目录 source/js/subtitle-audio.js
 */
(function () {
  'use strict';

  // 页面路径 -> 音频文件。路径请以斜杠结尾。
  var MAP = {
    '/':            '/audio/祝你今天愉快.m4a',
    '/categories/': '/audio/煮碗面给你吃.mp3',
    '/about/':      '/audio/祝你早安午安晚安.m4a'
  };

  var VOLUME = 0.8;

  function init() {
    var el = document.getElementById('subtitle');
    if (!el) return;

    // 统一补上结尾斜杠，兼容 /about 和 /about/ 两种写法
    var path = location.pathname.replace(/\/?$/, '/');
    var src = MAP[path];
    if (!src) return;

    // 中文文件名需要编码，否则部分服务器会 404
    src = encodeURI(src);

    var audio = null;

    el.classList.add('subtitle-audio');
    el.setAttribute('title', '点一下');

    el.addEventListener('click', function () {
      if (!audio) {
        audio = new Audio(src);
        audio.preload = 'none';
        audio.volume = VOLUME;
        audio.addEventListener('ended', function () {
          el.classList.remove('is-playing');
        });
        audio.addEventListener('error', function () {
          el.classList.remove('is-playing');
          console.warn('[subtitle-audio] 音频加载失败：' + src);
        });
      }

      if (audio.paused) {
        audio.play()
          .then(function () {
            el.classList.add('is-playing');
          })
          .catch(function (err) {
            console.warn('[subtitle-audio] 播放失败', err);
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
        el.classList.remove('is-playing');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
