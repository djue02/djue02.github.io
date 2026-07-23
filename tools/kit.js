/* ═══════════════════════════════════════════════════════════════
 * 工具页共享套件 · kit.js
 * ───────────────────────────────────────────────────────────────
 * 提供：① 深浅色模式（默认跟随系统，可手动切换，选择记在本机）
 *       ② 返回首页按钮（两者同在右上角）
 *
 * 图标语义：常态 = 当前模式；悬浮 = 点下去会变成的模式。
 *   白天 → 常态太阳，悬浮变月亮
 *   夜间 → 常态月亮，悬浮变太阳
 *
 * 用法：在工具 html 的 </head> 之前加一行（放 head 末尾、不要加
 *      defer，这样能在首屏绘制前定好主题，避免闪白）：
 *
 *      <script src="/tools/kit.js"></script>
 *
 * 前提：工具的配色用下面这套 CSS 变量名（音频工具箱已是这套）。
 *      沿用同一套变量，新工具就能自动获得暗色模式。
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ┌── 配置：以后改这里 ──────────────────────────────┐ */
  var HOME = { url: '/', label: '兔子窝' };
  var KEY  = 'tk_theme';
  /* 看板娘：Potion Maker 的 Pio & Tia（自托管于 /tools/live2d/）
     enable 设为 false 可整体关闭；minWidth 以下的屏幕不加载 */
  var WAIFU = { enable: true, base: '/tools/live2d/', minWidth: 768 };
  /* └────────────────────────────────────────────────┘ */

  /* ── 暗色调色板（与浅色变量一一对应）────────────────── */
  var DARK = [
    '--bg:#1c1c1e;--surface:#2c2c2e;--ink:#f5f5f7;--ink2:#98989d;--ink3:#636366;',
    '--line:rgba(255,255,255,.10);--line2:rgba(255,255,255,.22);--fill:#3a3a3c;',
    '--blue:#0a84ff;--blue-h:#409cff;--green:#2f9e6e;--green-bg:#1f3329;',
    '--red:#e5636f;--red-bg:#3a2328;--amber:#e0aa4f;--amber-bg:#3a2f1d;',
    '--code:#161618;--code-ink:#e8e8ea;'
  ].join('');

  /* 暗色下：变量覆盖不到的硬编码色 + 日月对调
     （选择器不存在的工具会自动忽略前面几条） */
  var FIX = [
    '.tabs{background:rgba(255,255,255,.08)}',
    '.tab.active{box-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.drop:hover,.drop.over{background:#12283d}',
    '.fico,.chip:hover,.vacts button:hover{color:#1c1c1e}',
    '.tk-sun{opacity:0}',
    '.tk-moon{opacity:1}',
    '.tk-theme:hover .tk-sun{opacity:1}',
    '.tk-theme:hover .tk-moon{opacity:0}'
  ].join('');

  function prefix(p, rules) {
    return rules.replace(/(^|\})\s*([^{}]+)\{/g, function (_, brace, sel) {
      var out = sel.split(',').map(function (s) { return p + ' ' + s.trim(); }).join(',');
      return brace + out + '{';
    });
  }

  var css = [
    ':root[data-theme="dark"]{' + DARK + '}',
    prefix(':root[data-theme="dark"]', FIX),
    '@media (prefers-color-scheme:dark){',
    ':root:not([data-theme="light"]){' + DARK + '}',
    prefix(':root:not([data-theme="light"])', FIX),
    '}',

    /* ── 按钮组：右上角横向并排 ─────────────────────── */
    '.tk-bar{position:fixed;top:16px;right:16px;z-index:99;',
    '  display:flex;align-items:center;gap:8px}',
    '.tk-home,.tk-theme{background:var(--surface,#fff);',
    '  border:1px solid var(--line,rgba(0,0,0,.09));',
    '  color:var(--ink2,#6e6e73);border-radius:999px;cursor:pointer;',
    '  display:inline-flex;align-items:center;justify-content:center;',
    '  font:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent;',
    '  box-shadow:0 2px 10px rgba(0,0,0,.06);',
    '  transition:color .2s ease,border-color .2s ease,transform .15s ease}',
    '.tk-home{height:34px;gap:7px;padding:0 14px 0 11px;font-size:13.5px}',
    '.tk-theme{width:34px;height:34px;padding:0;position:relative}',
    '.tk-home:hover,.tk-theme:hover{color:var(--ink,#1d1d1f);',
    '  border-color:var(--line2,rgba(0,0,0,.18))}',
    '.tk-home:active,.tk-theme:active{transform:scale(.94)}',
    '.tk-home svg{width:15px;height:15px;flex:none}',

    /* ── 悬浮反馈：常态=当前模式，悬浮=切换后的模式 ──── */
    '.tk-ico{position:absolute;inset:0;display:flex;align-items:center;',
    '  justify-content:center;transition:opacity .18s ease}',
    '.tk-ico svg{width:15px;height:15px}',
    '.tk-sun{opacity:1}',
    '.tk-moon{opacity:0}',
    '.tk-theme:hover .tk-sun{opacity:0}',
    '.tk-theme:hover .tk-moon{opacity:1}',

    /* 切换瞬间给主要元素一点颜色渐变，避免硬跳；
       不想要就删掉下面这四行 */
    '.tk-animating body,.tk-animating .card,.tk-animating .tabs,.tk-animating .drop,',
    '.tk-animating .note,.tk-animating .hint,.tk-animating input,.tk-animating select,',
    '.tk-animating textarea,.tk-animating button:not(.tk-theme),.tk-animating pre{',
    '  transition:background-color .25s ease,color .25s ease,border-color .25s ease}',

    '@media (max-width:640px){',
    '  .tk-bar{top:12px;right:12px;gap:6px}',
    '  body{padding-top:62px}',
    '}'
  ].join('');

  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* 主题：首屏绘制前定好，避免闪白 */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"'
          + ' stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.7v2.1'
          + 'M12 19.2v2.1M2.7 12h2.1M19.2 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7'
          + 'M7 17l-1.5 1.5"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"'
           + ' stroke-linecap="round" stroke-linejoin="round">'
           + '<path d="M20.5 14.3A8.5 8.5 0 1 1 9.8 3.6a6.8 6.8 0 0 0 10.7 10.7z"/></svg>';
  var HOMEICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"'
               + ' stroke-linecap="round" stroke-linejoin="round">'
               + '<path d="M3.2 10.4 12 3.4l8.8 7"/><path d="M5.7 9.2v11.4h12.6V9.2"/></svg>';

  function isDark() {
    var v = root.getAttribute('data-theme');
    if (v) return v === 'dark';
    return !!(window.matchMedia
      && window.matchMedia('(prefers-color-scheme:dark)').matches);
  }

  function mount() {
    if (document.querySelector('.tk-bar')) return;

    var home = document.createElement('a');
    home.className = 'tk-home';
    home.href = HOME.url;
    home.title = '返回' + HOME.label;
    home.innerHTML = HOMEICON + '<span>' + HOME.label + '</span>';

    var btn = document.createElement('button');
    btn.className = 'tk-theme';
    btn.type = 'button';
    btn.title = '切换深浅色';
    btn.setAttribute('aria-label', '切换深浅色');
    /* 两个图标常驻，由 CSS 按当前模式 + 悬浮状态决定谁露面 */
    btn.innerHTML = '<span class="tk-ico tk-sun">' + SUN + '</span>'
                  + '<span class="tk-ico tk-moon">' + MOON + '</span>';

    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.classList.add('tk-animating');
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      setTimeout(function () { root.classList.remove('tk-animating'); }, 300);
    });

    var bar = document.createElement('div');
    bar.className = 'tk-bar';
    bar.appendChild(home);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  /* ── 看板娘装载 ─────────────────────────────────────
     页面主体加载完后再上岗（不抢 ffmpeg 工具的启动带宽）；
     小屏不加载；样式含暗色适配。 */
  function mountWaifu() {
    if (!WAIFU.enable) return;
    if (screen.width < WAIFU.minWidth || innerWidth < WAIFU.minWidth) return;
    if (document.getElementById('waifu')) return;

    var base = WAIFU.base;

    /* 预取模型核心文件，与脚本并行下载，缩短她出现前的空白 */
    [base + 'api/model/Potion-Maker/Pio/model.moc',
     base + 'api/model/Potion-Maker/Pio/textures/default-costume.png'
    ].forEach(function (href) {
      var pl = document.createElement('link');
      pl.rel = 'prefetch';
      pl.href = href;
      document.head.appendChild(pl);
    });

    /* 看板娘样式 + 本站适配（消息框暗色、层级让位给右上按钮组） */
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'dist/waifu.css';
    document.head.appendChild(link);

    var st = document.createElement('style');
    st.textContent = [
      '#waifu{z-index:98}',

      /* ── 首次呈现不做任何动画（进页面她就该已经在那儿）──
         ready 类由脚本在首帧稳定后补上，之后的关闭/召回才有过渡 */
      'html:not(.tk-l2d-ready) #waifu,',
      'html:not(.tk-l2d-ready) #waifu-toggle{transition:none!important}',

      /* ── 之后：退场快落 .5s，召回上浮 .9s，各用各的节奏 ── */
      '#waifu{opacity:0;transition:transform .3s ease-in-out,',
      '  bottom .5s cubic-bezier(.55,0,.8,.4),opacity .4s ease}',
      '#waifu.waifu-active{opacity:1;transition:transform .3s ease-in-out,',
      '  bottom .9s cubic-bezier(.22,1,.36,1),opacity .65s ease .05s}',
      '@media (prefers-reduced-motion:reduce){',
      '  #waifu,#waifu.waifu-active{transition:none!important;opacity:1}}',

      /* ── 召回按钮：左下角独立圆钮，就在她原本站的位置 ──
         原版是贴左缘滑出的橙色方块，这里改成定点浮现的圆形卡片 */
      '#waifu-toggle{position:fixed;display:flex;left:22px;bottom:22px;margin-left:0;',
      '  width:44px;height:44px;padding:0;overflow:hidden;',
      '  justify-content:flex-start;align-items:center;border-radius:999px;',
      '  background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.09));',
      '  box-shadow:0 2px 12px rgba(0,0,0,.08);color:var(--ink2,#6e6e73);',
      '  opacity:0;visibility:hidden;transform:scale(.7);pointer-events:none;',
      '  transition:opacity .3s ease,transform .35s cubic-bezier(.22,1,.36,1),',
      '    width .32s cubic-bezier(.22,1,.36,1),color .2s ease,border-color .2s ease}',
      '#waifu-toggle svg{width:17px;height:20px;flex:none;margin-left:12px;',
      '  display:block;fill:currentColor}',
      /* 文字标签用伪元素补，静息时被 overflow 裁掉 */
      '#waifu-toggle::after{content:"看板娘";white-space:nowrap;font-size:13.5px;',
      '  margin:0 16px 0 8px;opacity:0;transition:opacity .18s ease}',
      '#waifu-toggle.waifu-toggle-active{opacity:1;visibility:visible;',
      '  transform:scale(1);pointer-events:auto;margin-left:0}',
      /* 关键：原版有 :hover{margin-left:-30px}，权重比普通类高，
         不显式盖掉会导致按钮悬浮时左窜→脱离光标→抖动闪烁 */
      '#waifu-toggle.waifu-toggle-active:hover{margin-left:0;width:118px;',
      '  color:var(--ink,#1d1d1f);border-color:var(--line2,rgba(0,0,0,.18))}',
      '#waifu-toggle.waifu-toggle-active:hover::after{opacity:1;transition-delay:.08s}',
      '#waifu-toggle.waifu-toggle-active:active{transform:scale(.96)}',
      '@media (prefers-reduced-motion:reduce){#waifu-toggle{transition:none}}',

      /* ── 暗色：消息框 + 召回按钮 ── */
      ':root[data-theme="dark"] #waifu-tips{background:rgba(44,44,46,.92);',
      '  border-color:rgba(255,255,255,.14);color:#e8e8ea;',
      '  box-shadow:0 3px 15px rgba(0,0,0,.45)}',
      ':root[data-theme="dark"] #waifu-toggle{background:#2c2c2e;',
      '  border-color:rgba(255,255,255,.14);color:#98989d}',
      ':root[data-theme="dark"] #waifu-toggle.waifu-toggle-active:hover{color:#f5f5f7}',
      '@media (prefers-color-scheme:dark){',
      ':root:not([data-theme="light"]) #waifu-tips{background:rgba(44,44,46,.92);',
      '  border-color:rgba(255,255,255,.14);color:#e8e8ea;',
      '  box-shadow:0 3px 15px rgba(0,0,0,.45)}',
      ':root:not([data-theme="light"]) #waifu-toggle{background:#2c2c2e;',
      '  border-color:rgba(255,255,255,.14);color:#98989d}',
      ':root:not([data-theme="light"]) #waifu-toggle.waifu-toggle-active:hover{color:#f5f5f7}',
      '}'
    ].join('');
    document.head.appendChild(st);

    /* 首帧稳定后再开过渡总闸：此前不论她登场还是按钮浮现，
       都是「本来就在那儿」，没有任何动画 */
    var gate = setInterval(function () {
      var wf = document.getElementById('waifu');
      var tg = document.getElementById('waifu-toggle');
      var shown = (wf && wf.classList.contains('waifu-active'))
               || (tg && tg.classList.contains('waifu-toggle-active'));
      if (!shown) return;
      clearInterval(gate);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.classList.add('tk-l2d-ready');
        });
      });
    }, 80);
    setTimeout(function () { clearInterval(gate); }, 30000);

    /* 原版 JS 写死「离场 3 秒后才显示召回按钮」，与我们 0.5s 的退场
       节奏对不上，会空出两秒多的尬等。这里代理关闭按钮的点击，
       退场一结束就把状态类补上（幂等，原版稍后再执行也无副作用）。 */
    document.addEventListener('click', function (e) {
      var q = e.target && e.target.closest && e.target.closest('#waifu-tool-quit');
      if (!q) return;
      setTimeout(function () {
        var w = document.getElementById('waifu');
        var t = document.getElementById('waifu-toggle');
        if (w) w.classList.add('waifu-hidden');
        if (t) t.classList.add('waifu-toggle-active');
      }, 560);
    });

    /* 加载器为 ES Module，onload 后 initWidget 挂到 window */
    var sc = document.createElement('script');
    sc.type = 'module';
    sc.src = base + 'dist/waifu-tips.js';
    sc.onload = function () {
      if (typeof window.initWidget !== 'function') return;
      window.initWidget({
        waifuPath:   base + 'waifu-tips.json',
        cdnPath:     base + 'api/',
        cubism2Path: base + 'dist/live2d.min.js',
        tools: ['hitokoto', 'switch-model', 'switch-texture',
                'photo', 'info', 'quit'],
        logLevel: 'error',
        drag: false
      });
    };
    document.head.appendChild(sc);
  }

  function scheduleWaifu() {
    /* DOM 就绪即装载。工具的 ffmpeg 是点击后才下载的，此刻没有带宽竞争，
       再等 window.load + 延迟只会白白留出一段空白期。 */
    mountWaifu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mount();
      scheduleWaifu();
    });
  } else {
    mount();
    scheduleWaifu();
  }
})();
