/**
 * SubtitleSeal.js —— 印章色点睛
 * 整句月白,只把每条 subtitle 里"最暖的那个词"染成博客的强调色 #c45c5c,
 * 像水墨上盖的一方朱印。自动适配三条(或更多)轮换的 subtitle。
 *
 * 用法:
 *   1. 放到 source/js/SubtitleSeal.js
 *   2. _config.fluid.yml 的 custom_js 里加:  - /js/SubtitleSeal.js
 *   3. 不需要额外 CSS,样式已在脚本里注入
 *
 * 每条 subtitle 染哪个词,在下面 RULES 里配:
 *   when = 用来识别"当前是哪条 subtitle"的特征片段
 *   mark = 要染色的词(只染第一次出现)
 */
(function () {
  var ACCENT = '#c45c5c'; // 博客强调色 / 木屋红

  var RULES = [
    { when: '肚饿',          mark: '面' },          // 灰湖冷雾里,唯一的热处是那碗面
    { when: "don't see you", mark: 'good night' },  // Truman 的告别,落点在最后一声晚安
    { when: '再祝',          mark: '再祝' }          // 今天的祝福说完,暖在"明天再祝"
  ];

  /* ---- 样式注入:静止的一点红。想要极慢的呼吸,把下面注释块打开 ---- */
  var css =
    '#subtitle .accent-char{color:' + ACCENT + ';}';
    /* 可选·呼吸版(9s 一次,幅度很小):
    '#subtitle .accent-char{color:' + ACCENT + ';animation:seal-breath 9s ease-in-out infinite;}' +
    '@keyframes seal-breath{0%,100%{opacity:1}50%{opacity:.82}}';
    */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- 核心:识别当前 subtitle,染对应的词 ---- */
  function seal() {
    var el = document.getElementById('subtitle');
    if (!el) return;

    var text = el.textContent;
    if (el.dataset.sealText === text) return; // 这条已处理过,跳过

    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i];
      if (text.indexOf(r.when) === -1) continue;

      var html = el.innerHTML;
      var pos = html.indexOf(r.mark);
      if (pos === -1) break; // 特征命中但词不在(理论上不会),放弃

      el.innerHTML =
        html.slice(0, pos) +
        '<span class="accent-char">' + r.mark + '</span>' +
        html.slice(pos + r.mark.length);
      break;
    }
    el.dataset.sealText = el.textContent; // 记录,防止 observer 自触发死循环
  }

  /* ---- 时机:首屏 + pjax 换页 + subtitle 内容任何变动(轮换/异步渲染都能接住) ---- */
  function watch() {
    seal();
    var el = document.getElementById('subtitle');
    if (!el || el.dataset.sealWatched) return;
    el.dataset.sealWatched = '1';
    new MutationObserver(seal).observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  document.readyState !== 'loading'
    ? watch()
    : document.addEventListener('DOMContentLoaded', watch);
  document.addEventListener('pjax:complete', watch);
})();
