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
     enable  整体开关
     进入工具页即加载；资源经 Service Worker 缓存，只在首次真正下载。
     点她的关闭键可让她下班，左下角随即出现召回标签。 */
  var WAIFU  = { enable: true, base: '/tools/live2d/' };
  /* AI 对话：填你的 Worker 地址（末尾不要斜杠）。留空则不显示对话按钮。
     weather:true 会让她拿到访客所在地天气，可以自然带进闲聊。 */
  var AI = {
    url: 'https://weather.icome.world/chat',
    weather: true
  };
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
    '}',

    /* ── AI 对话条 ──────────────────────────────────────
       贴在她右侧的胶囊输入框：输入 + 发送 + 关闭。
       回复显示在自建气泡里（不抢 widget 自己的 #waifu-tips，
       免得她的闲聊定时器把 AI 的答复冲掉）。 */
    '.tk-chat{position:fixed;left:184px;bottom:26px;z-index:99;',
    '  display:none;align-items:center;gap:8px;',
    '  padding:7px 8px 7px 7px;border-radius:999px;',
    '  background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.09));',
    '  box-shadow:0 4px 18px rgba(0,0,0,.10)}',
    '.tk-chat.on{display:flex}',
    '.tk-chat input{width:min(300px,52vw);height:34px;padding:0 14px;',
    '  border:1px solid var(--line2,rgba(0,0,0,.15));border-radius:999px;',
    '  background:var(--bg,#f5f5f7);color:var(--ink,#1d1d1f);',
    '  font:inherit;font-size:13.5px;outline:none;',
    '  transition:border-color .2s ease}',
    '.tk-chat input:focus{border-color:var(--blue,#0071e3)}',
    '.tk-chat input::placeholder{color:var(--ink3,#aeaeb2)}',
    '.tk-chat button{width:32px;height:32px;flex:none;padding:0;border:none;',
    '  border-radius:50%;background:var(--fill,#f0f0f2);color:var(--ink2,#6e6e73);',
    '  cursor:pointer;display:flex;align-items:center;justify-content:center;',
    '  transition:background .2s ease,color .2s ease,transform .15s ease}',
    '.tk-chat button:hover{background:var(--blue,#0071e3);color:#fff}',
    '.tk-chat button:active{transform:scale(.92)}',
    '.tk-chat button.tk-x{background:transparent}',
    '.tk-chat button.tk-x:hover{background:transparent;color:var(--ink,#1d1d1f)}',
    '.tk-chat svg{width:15px;height:15px}',
    '.tk-chat.busy input{opacity:.6;pointer-events:none}',
    /* 注入的对话按钮：沿用 widget 工具栏的观感 */
    '#waifu-tool .tk-chat-btn{cursor:pointer;align-items:center;',
    '  justify-content:center;display:flex}',
    '#waifu-tool .tk-chat-btn svg{width:25px;height:25px;fill:#7b8c9d;',
    '  transition:fill .3s}',
    '#waifu-tool .tk-chat-btn:hover svg{fill:#0684bd}',

    /* 她的回复气泡（自建，浮在输入条上方） */
    '.tk-say{position:fixed;left:184px;bottom:74px;z-index:99;display:none;',
    '  max-width:min(320px,60vw);padding:11px 15px;border-radius:14px;',
    '  background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.09));',
    '  box-shadow:0 4px 18px rgba(0,0,0,.10);',
    '  font-size:13.5px;line-height:1.65;color:var(--ink,#1d1d1f);',
    '  white-space:pre-wrap;word-break:break-word}',
    '.tk-say.on{display:block}',
    '.tk-say.dim{color:var(--ink3,#aeaeb2)}',

    '@media (max-width:640px){',
    '  .tk-chat{left:8px;right:8px;bottom:14px;',
    '    padding:6px 7px 6px 6px}',
    '  .tk-chat input{width:auto;flex:1;height:32px;font-size:13px}',
    '  .tk-say{left:8px;right:8px;bottom:62px;max-width:none}',
    '}',

    '#waifu{z-index:98}',

    /* ── 手机端 ────────────────────────────────────────
       全部加 body 前缀提权：本样式在文档里排在 waifu.css 之前，
       同权重会输给它（原版竖排 / 25px 图标就是这么盖回来的）。

       #waifu 自带 transform:translateY(25px)，作用是把模型底部的透明留白
       推出屏幕、让她看起来紧贴底边；但它同时把工具栏也一起压下去、导致
       末尾按钮被裁。故把这个位移从容器移到画布上：容器归位（工具栏完整
       可见），只让 canvas 下沉，贴底效果保留。
       下沉量 14px = 原版 25px 按 160/300 的缩放折算。

       工具栏保持原版竖排。注意：画布 160px，但模型在画布里留了头顶余量，
       实际画出来的人物只占约 132px —— 按画布高算列高就会高出一截。
       故锚定底部，列高取「画布下沉后仍可见的人物高度」＝ 118px，
       再用 space-between 让按钮自动均分，改图标尺寸也不用重算间距。 */
    '@media (max-width:640px){',
    '  body #waifu{transform:none!important}',
    '  body #waifu.waifu-active{bottom:0!important}',
    '  body #waifu #live2d{width:160px!important;height:160px!important;',
    'transform:translateY(14px)}',
    '  body #waifu-tips{width:min(180px,48vw)!important;font-size:12.5px;',
    '    line-height:19px;min-height:48px;margin:-14px 10px!important}',
    /* 触屏没有 hover，原版工具栏（含关闭键）默认 opacity:0，
       不常驻等于关不掉她 */
    '  body #waifu-tool{opacity:1!important;position:absolute;',
    '    flex-direction:column;justify-content:space-between;gap:0;',
    '    top:auto;bottom:0;right:-6px;left:auto;height:118px}',
    '  body #waifu-tool span,body #waifu-tool .tk-chat-btn{',
    'width:21px;height:21px;display:flex;flex:none;',
    '    align-items:center;justify-content:center;border-radius:50%;',
    '    background:var(--surface,#fff);',
    '    box-shadow:0 1px 4px rgba(0,0,0,.15)}',
    /* 图标 viewBox 非方形（320×512 / 640×512 等），只锁高、宽自适应，
       否则强行等宽等高会把图标压扁 */
    '  body #waifu-tool svg{height:11px!important;width:auto;max-width:13px}',
    '}',

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
    /* ── 召唤 / 召回：贴左缘的竖排标签 ──────────────────
       选择器一律加 body 前缀提权：本样式在文档里排在 waifu.css
       之前，同权重会输给它的默认橙色块，加前缀才稳。
       另必须显式 top:auto —— 原版设了 bottom:66px，若上下同时被钉住，
       固定定位元素会被拉成长条。
       无动画：出现即到位。 */
    'body #waifu-toggle,body .tk-summon{position:fixed;left:0;',
    '  bottom:calc(24px + env(safe-area-inset-bottom,0px));',
    '  top:auto;right:auto;z-index:99;',
    '  display:flex;flex-direction:column;align-items:center;gap:5px;',
    '  width:auto;height:auto;margin:0;padding:9px 5px 8px;',
    '  background:var(--surface,#fff);border:1px solid var(--line,rgba(0,0,0,.09));',
    '  border-left:none;border-radius:0 8px 8px 0;',
    '  box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer;',
    '  font:inherit;color:var(--ink2,#6e6e73);',
    '  -webkit-tap-highlight-color:transparent;',
    '  opacity:0;visibility:hidden;pointer-events:none;',
    '  transform:none;transition:none}',
    'body #waifu-toggle .tk-vt,body .tk-summon .tk-vt{writing-mode:vertical-rl;',
    '  font-size:11.5px;line-height:1;letter-spacing:.08em;white-space:nowrap}',
    'body #waifu-toggle .tk-arrow,body .tk-summon .tk-arrow{width:10px;height:10px;',
    '  flex:none;fill:none;stroke:currentColor;color:var(--ink3,#aeaeb2)}',
    'body #waifu-toggle.waifu-toggle-active,body .tk-summon.on{opacity:1;',
    '  visibility:visible;pointer-events:auto;margin-left:0}',
    'body #waifu-toggle.waifu-toggle-active:hover,body .tk-summon.on:hover{',
    '  margin-left:0;color:var(--ink,#1d1d1f);',
    '  border-color:var(--line2,rgba(0,0,0,.18))}',

    /* ── 暗色：消息框 + 召回按钮 ── */
    ':root[data-theme="dark"] #waifu-tips{background:rgba(44,44,46,.92);',
    '  border-color:rgba(255,255,255,.14);color:#e8e8ea;',
    '  box-shadow:0 3px 15px rgba(0,0,0,.45)}',
    'body:root[data-theme="dark"] #waifu-toggle,',
    ':root[data-theme="dark"] body .tk-summon{background:#2c2c2e;',
    '  border-color:rgba(255,255,255,.14);color:#98989d}',
    ':root[data-theme="dark"] body .tk-arrow{color:#636366}',
    '@media (max-width:640px){',
    ':root[data-theme="dark"] body #waifu-tool span{background:#2c2c2e;',
    '  box-shadow:0 1px 5px rgba(0,0,0,.5)}',
    '}',
    '@media (prefers-color-scheme:dark){',
    ':root:not([data-theme="light"]) #waifu-tips{background:rgba(44,44,46,.92);',
    '  border-color:rgba(255,255,255,.14);color:#e8e8ea;',
    '  box-shadow:0 3px 15px rgba(0,0,0,.45)}',
    ':root:not([data-theme="light"]) body #waifu-toggle,',
    ':root:not([data-theme="light"]) body .tk-summon{background:#2c2c2e;',
    '  border-color:rgba(255,255,255,.14);color:#98989d}',
    ':root:not([data-theme="light"]) body .tk-arrow{color:#636366}',
    '@media (max-width:640px){',
    ':root:not([data-theme="light"]) body #waifu-tool span{background:#2c2c2e;',
    '  box-shadow:0 1px 5px rgba(0,0,0,.5)}',
    '}',
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
  var ARROWICON = '<svg class="tk-arrow" viewBox="0 0 24 24" fill="none"'
                + ' stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'
                + ' stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';
  var TAB_HTML = '<span class="tk-vt">这里有看板娘</span>' + ARROWICON;
  var HOMEICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"'
               + ' stroke-linecap="round" stroke-linejoin="round">'
               + '<path d="M3.2 10.4 12 3.4l8.8 7"/><path d="M5.7 9.2v11.4h12.6V9.2"/></svg>';

  function small() {
    return window.innerWidth < 640 || screen.width < 640;
  }

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


  /* ═══ AI 对话 ═══════════════════════════════════════
     交互：她的工具栏里注入一个「对话」按钮 → 展开输入条 →
     回车或点纸飞机发送 → 回复显示在输入条上方的气泡里。
     发送时会把当前页面状态一并带上，她才知道你在干什么。 */

  var chatHistory = [];

  function pageContext() {
    var q = function (sel) { var e = document.querySelector(sel); return e ? e : null; };
    var txt = function (sel) { var e = q(sel); return e ? (e.textContent || '').trim() : ''; };
    var ctx = {};
    var tab = q('.tab.active');
    if (tab) ctx.tab = (tab.textContent || '').trim();
    var fn = txt('#oFn');
    if (fn) ctx.fileName = fn;
    var fi = q('#oFi');
    if (fi && fi.style.display !== 'none') {
      var m = (fi.textContent || '').match(/[\d.]+\s*(GB|MB|KB)/i);
      if (m) ctx.fileSize = m[0];
    }
    var fmt = q('#oFmt');
    if (fmt && fmt.selectedIndex >= 0 && fmt.options[fmt.selectedIndex]) {
      ctx.format = fmt.options[fmt.selectedIndex].text;
    }
    var st = txt('#oSt');
    if (st) ctx.status = st;
    return ctx;
  }

  function say(text, dim) {
    var b = document.querySelector('.tk-say');
    if (!b) return;
    b.textContent = text;
    b.classList.toggle('dim', !!dim);
    b.classList.add('on');
  }

  function buildChat() {
    if (!AI.url || AI.url.indexOf('你的worker') !== -1) return null;
    if (document.querySelector('.tk-chat')) return null;

    var bubble = document.createElement('div');
    bubble.className = 'tk-say';
    document.body.appendChild(bubble);

    var bar = document.createElement('div');
    bar.className = 'tk-chat';
    bar.innerHTML =
      '<input type="text" maxlength="200" placeholder="和看板娘说点什么…">'
      + '<button class="tk-send" title="发送" aria-label="发送">'
      +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'
      +   ' stroke-linecap="round" stroke-linejoin="round">'
      +   '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8z"/></svg></button>'
      + '<button class="tk-x" title="收起" aria-label="收起">'
      +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'
      +   ' stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
    document.body.appendChild(bar);

    var input = bar.querySelector('input');

    function close() {
      bar.classList.remove('on');
      bubble.classList.remove('on');
    }

    async function send() {
      var text = input.value.trim();
      if (!text || bar.classList.contains('busy')) return;
      input.value = '';
      bar.classList.add('busy');
      say('……', true);

      chatHistory.push({ role: 'user', content: text });
      if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);

      try {
        var res = await fetch(AI.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatHistory,
            context: pageContext(),
            weather: !!AI.weather
          })
        });
        var data = await res.json();
        if (data.reply) {
          chatHistory.push({ role: 'assistant', content: data.reply });
          say(data.reply);
        } else if (data.error === 'rate-limited') {
          say('问得太急了，等 ' + (data.retryAfterMin || 1) + ' 分钟再来。', true);
        } else if (data.error === 'ai-quota') {
          say('今天的脑子用完了，明天再聊。', true);   // Worker 的免费额度用尽
        } else {
          say('线路不太通，等会儿再试。', true);
        }
      } catch (e) {
        say('连不上，检查下网络。', true);
      }
      bar.classList.remove('busy');
      input.focus();
    }

    bar.querySelector('.tk-send').addEventListener('click', send);
    bar.querySelector('.tk-x').addEventListener('click', close);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
      if (e.key === 'Escape') close();
    });

    return {
      toggle: function () {
        var on = bar.classList.toggle('on');
        if (on) { input.focus(); }
        else { bubble.classList.remove('on'); }
      }
    };
  }

  /* 把「对话」按钮注入她自己的工具栏，样式与其它按钮一致 */
  function injectChatButton(chat) {
    if (!chat) return;
    var tool = document.getElementById('waifu-tool');
    if (!tool || tool.querySelector('.tk-chat-btn')) return;
    var b = document.createElement('span');
    b.className = 'tk-chat-btn';
    b.title = '和她聊聊';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor">'
      + '<path d="M12 3C6.9 3 3 6.4 3 10.5c0 2.3 1.2 4.3 3.2 5.7l-.8 3.6 3.9-2a11 11 0 0 0 2.7.3'
      + 'c5.1 0 9-3.4 9-7.6S17.1 3 12 3z"/></svg>';
    b.addEventListener('click', chat.toggle);
    tool.insertBefore(b, tool.firstChild);
  }

  /* 注册 Service Worker：把 /tools/live2d/ 下的资源缓存到本地，
     之后进页面零网络请求。HTTP 缓存在 GitHub Pages 上只有 10 分钟，
     光靠它每次还要发十来个 304 验证请求。 */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      navigator.serviceWorker.register(WAIFU.base.replace(/live2d\/$/, '') + 'live2d-sw.js',
        { scope: '/tools/' }).catch(function () {});
    } catch (e) {}
  }

  /* ── 看板娘装载 ───────────────────────────────────── */
  function mountWaifu() {
    if (!WAIFU.enable) return;
    if (document.getElementById('waifu')) return;

    var base = WAIFU.base;

    /* 看板娘样式 + 本站适配（消息框暗色、层级让位给右上按钮组） */
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'dist/waifu.css';
    document.head.appendChild(link);

    /* widget 自建的召回按钮内容替换成与手机端同一套（图标+文字+箭头） */
    var chat = buildChat();
    var dress = setInterval(function () {
      var t = document.getElementById('waifu-toggle');
      injectChatButton(chat);
      if (!t) return;
      clearInterval(dress);
      t.innerHTML = TAB_HTML;
      t.title = '召回看板娘';
    }, 60);
    setTimeout(function () { clearInterval(dress); }, 20000);

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
      /* 立刻亮出召回标签：原版写死「离场 3 秒后才显示」，
         我之前又为等退场动画留了 560ms —— 都去掉，点完即出现。 */
      var t0 = document.getElementById('waifu-toggle');
      if (t0) t0.classList.add('waifu-toggle-active');
      setTimeout(function () {              /* 她本人等退场动画走完再藏 */
        var wf = document.getElementById('waifu');
        if (wf) wf.classList.add('waifu-hidden');
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
        /* 桌面留全部六个；手机上竖排工具栏要塞进她 118px 的可见高度，
           砍掉「一言」（要拉外部 API）和「信息」（跳项目主页），
           留换人/换装/拍照/关闭四个。「对话」按钮由本文件下方自行注入。 */
        tools: small()
          ? ['switch-model', 'switch-texture', 'photo', 'quit']
          : ['hitokoto', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
        logLevel: 'error',
        drag: false
      });
    };
    document.head.appendChild(sc);
  }

  function scheduleWaifu() {
    /* 进页面即加载。资源由 Service Worker 缓存，第二次起直接走本地缓存。 */
    registerSW();
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
