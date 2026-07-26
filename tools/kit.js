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
     quietCopy 复制时不让她说话（工具页要频繁复制命令，每次点评太吵）
     进入工具页会预下载她的资源并缓存，但默认【不显示】；
     点左下角「这里有看板娘」标签才现身（资源已就位，秒开）。
     她被关闭后，widget 会自建一个外观一致的召回标签。 */
  var WAIFU  = { enable: true, base: '/tools/live2d/', quietCopy: true };
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
    '  body #waifu-tool span{',
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



  /* ── 预下载 ───────────────────────────────────────────
     进页面即把她的资源拉进缓存（Service Worker 会存下来），
     但不初始化 widget —— 所以她不显示，点标签召唤时是秒开。
     用最低优先级、且等浏览器空闲后才开始，不跟工具本体抢带宽。 */
  var PRELOAD = [
    'dist/waifu-tips.js', 'dist/chunk/index.js', 'dist/chunk/index2.js',
    'dist/live2d.min.js', 'dist/waifu.css', 'waifu-tips.json',
    'api/model_list.json',
    'api/model/Potion-Maker/Pio/index.json',
    'api/model/Potion-Maker/Pio/model.moc',
    'api/model/Potion-Maker/Pio/textures/default-costume.png'
  ];

  var preloaded = false;
  function preloadWaifu() {
    if (!WAIFU.enable) return;
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;

    var go = function () {
      if (preloaded) return;          /* 幂等：load 事件可能触发多次 */
      preloaded = true;
      PRELOAD.forEach(function (path) {
        /* 读完 body 才算真正落进缓存，故用 .blob() 排空 */
        fetch(WAIFU.base + path, { priority: 'low', credentials: 'same-origin' })
          .then(function (r) { return r.blob(); })
          .catch(function () {});
      });
    };
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1200); };
    if (document.readyState === 'complete') idle(go, { timeout: 4000 });
    else window.addEventListener('load', function () { idle(go, { timeout: 4000 }); });
  }

  /* ── 召唤标签 ─────────────────────────────────────────
     与她被关闭后 widget 自建的 #waifu-toggle 共用一套样式，
     所以两者外观完全一致。 */
  function buildSummonTab() {
    if (!WAIFU.enable) return;
    if (document.querySelector('.tk-summon')) return;

    var tab = document.createElement('button');
    tab.className = 'tk-summon';
    tab.type = 'button';
    tab.title = '召唤看板娘';
    tab.innerHTML = TAB_HTML;
    tab.addEventListener('click', function () {
      tab.remove();          /* 之后由 widget 自建的召回标签接手 */
      mountWaifu();
    });
    tab.classList.add('on');   /* 无动画，直接到位 */
    document.body.appendChild(tab);
  }


  /* ═══ 双人格台词 ═══════════════════════════════════════
     widget 的台词表是全局的，两个模型共用一套 —— 那样 Pio 和 Tia
     说话就一模一样。这里在【捕获阶段】截下点击/悬停事件（捕获先于冒泡，
     widget 的监听器挂在冒泡阶段，因此收不到），按当前模型挑自己的词，
     再直接写进气泡。闲聊也用同样的办法定期替换。

     modelId 由 widget 存在 localStorage：0 = Pio，1 = Tia。

     优先级说明：widget 的欢迎语用 11、持续 7 秒，会压住一切。
     点击是明确的主动操作，故用 12 —— 开场问候期间点她也立刻有回应。
     悬停仍用 8 且不覆盖同级，既不打断问候，也不会随鼠标闪烁。

     人设：
       Pio  药水店主，被借调来看工具。倦怠、话少、毒舌里带真本事，
            爱拿熬药类比转码。
       Tia  王宫派来的助手。话密、热心、爱管事，报数字给建议催进度，
            偶尔炫耀自己比 Pio 勤快。
     改词直接改下面的数组即可。 */
  var PERSONA = {
      "0": {
          "tapBody": [
              "……手。",
              "别戳，药会洒。",
              "我在看火候，你在看什么。",
              "这一下扣你半分钟。",
              "熬药的手，不是给你戳着玩的。",
              "行吧，戳完了说正事。",
              "再来一下我就装睡。",
              "你很闲？那正好，文件拖进来。",
              "力气用在这儿，不如去点「开始处理」。",
              "我记账的，戳一次记一笔。",
              "唔……刚才那锅差点糊了。",
              "别闹，围裙要皱。",
              "第八次了。我数着的。",
              "哼。",
              "怕、怕痒……把手拿开。",
              "……不是说了别戳吗。你还挺开心的样子。",
              "唔，戳吧戳吧。反正我也没打算走。",
              "你要是真的无聊，我陪你待会儿也不是不行。",
              "再戳我就把苦的那锅端给你。",
              "别以为我没听见你在笑。"
          ],
          "hoverBody": [
              "嗯。",
              "有事说事。",
              "手悬在那儿做什么，等它自己转好吗。",
              "我醒着，别试探了。",
              "看火比看我有意思。",
              "凉。",
              "这只手挺闲的样子。",
              "再靠近一点就要收学费了。",
              "看什么，我脸上有配方？",
              "药味重，退后点。",
              "……别一直盯着我。",
              "唔，痒。",
              "你就这么喜欢晃来晃去吗。",
              "手拿开，我会分心的。"
          ],
          "idle": [
              "转码和熬药一个道理，急了就废。",
              "无损进无损出，一分不差，这点我担保。",
              "有损的源转成无损，只是把水装进更大的瓶子。",
              "文件拖进来，别在那儿犹豫。",
              "浏览器里熬，不出锅、不外传。",
              "一点五个 G 往上，换「大文件命令」那口锅。",
              "第一次要等引擎下来，二十来兆，只这一回。",
              "Tia 又要来抢班了，随她去。",
              "工具做得好的标志，是你想不起它。",
              "锅开了会响，进度条到头会停，都一样。",
              "急也没用，火候到了自然好。",
              "有些事拖着拖着就凉了，比如这锅，比如你那个文件。",
              "格式这种东西，选对一次，往后都省事。",
              "……安静挺好的。你继续，我不吵你。",
              "站久了会困。你别学我。",
              "唔……刚才是不是打了个盹。没有，我没有。",
              "衣柜里十二套，你要是无聊，挑一套给我换换也行。",
              "我不催你。反正等的是你自己。",
              "偶尔也想被人问一句累不累。……当我没说。"
          ]
      },
      "1": {
          "tapBody": [
              "诶？找我有事吗！",
              "在的在的，说吧。",
              "戳一下就来了，服务到位吧。",
              "别急别急，一件一件来。",
              "你今天第三次戳我了，我记着呢。",
              "有什么要帮忙的，直接讲。",
              "我可比某人勤快多了，你说是不是。",
              "需要我从头讲一遍流程吗，真的不要钱。",
              "戳我不如戳「开始处理」，那个才管用。",
              "是不是又卡住了？说出来我帮你看。",
              "有事按流程来，没事也可以聊两句。",
              "王宫那边可没人敢这么戳我。",
              "呜哇——吓我一跳！",
              "戳戳戳……好啦好啦，我理你还不行吗～",
              "喔，是想让我夸你吗？那我夸咯。",
              "唔哇，痒痒痒！停一下停一下～",
              "又是你！……嗯，也不是不高兴啦。",
              "夸我一句嘛，就一句，我今天很努力的。",
              "手感不错？那也要适可而止哦。",
              "再戳……好吧其实我不介意。"
          ],
          "hoverBody": [
              "在呢在呢。",
              "要点什么？我给你找。",
              "犹豫的话，我建议先选文件。",
              "这里这里，说吧。",
              "你是不是又不知道点哪个了。",
              "需要我念一遍步骤吗，不要钱的。",
              "别光看着呀。",
              "我这边随时待命。",
              "有问题现在问最合适。",
              "嗯？嗯？怎么啦～",
              "痒的痒的，别挠了！",
              "看我做什么，工具在右边呀。",
              "手停在这儿……是要摸摸头吗？",
              "被你看得有点不好意思了。"
          ],
          "idle": [
              "选无损的话 WAV 和 FLAC 都行，FLAC 体积小一半。",
              "视频也能直接提音频，不用先转一遍。",
              "起始和结束留空就是整段，不填也没关系。",
              "全都在你自己电脑上跑，一个字节都不上传，放心。",
              "大文件别硬来，去「大文件命令」抄一条更快。",
              "音频分割是无损的，切完音质一点不掉。",
              "引擎下过一次就有缓存了，之后秒开。",
              "卡住的话先刷新，八成就好了。",
              "衣柜里整整十二套，今天想看我穿哪件？",
              "Pio 又在打盹了，这班我先替她上着。",
              "有问题就戳我，别自己在那儿猜。",
              "今天也要把「待会儿再弄」变成「已经弄完」哦。",
              "时间写成 1:23 我也认，不用换算成秒。",
              "转完记得听一遍再关，别白忙一场。",
              "唔……好安静。你还在吗？",
              "我一个人待着也是会无聊的呀。",
              "偷偷说，我今天的发型很不错吧。",
              "做完一件划掉一件，这样才有成就感嘛。",
              "我在这儿盯着，你放心弄你的。",
              "要是我帮上忙了，记得夸我一下哦。"
          ]
      }
  };

  function whoAmI() {
    var id;
    try { id = localStorage.getItem('modelId'); } catch (e) {}
    return PERSONA[id === '1' ? '1' : '0'];      /* 缺省算 Pio */
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* 复刻 widget 的 showMessage：同样用 sessionStorage 做优先级，
     免得和它自己的消息互相打架。
     override=false 时，同优先级的消息不会打断正在显示的那条 ——
     悬停必须用这个语义：鼠标每移动一像素都会派发一次 hoverbody，
     若同级也能覆盖，文字就会随鼠标疯狂重刷（闪烁）。 */
  function tell(text, timeout, priority, override) {
    var tips = document.getElementById('waifu-tips');
    if (!tips) return;
    var cur = parseInt(sessionStorage.getItem('waifu-message-priority'), 10);
    if (isNaN(cur)) cur = 0;
    if (override === false ? cur >= priority : cur > priority) return;
    if (tell._t) { clearTimeout(tell._t); tell._t = null; }
    try { sessionStorage.setItem('waifu-message-priority', String(priority)); } catch (e) {}
    tips.innerHTML = text;
    tips.classList.add('waifu-tips-active');
    tell._t = setTimeout(function () {
      try { sessionStorage.removeItem('waifu-message-priority'); } catch (e) {}
      tips.classList.remove('waifu-tips-active');
    }, timeout);
  }

  function personaTalk() {
    /* 点身体 / 悬停：截下 widget 的通用词，换成本人格的 */
    window.addEventListener('live2d:tapbody', function (e) {
      e.stopImmediatePropagation();
      tell(pick(whoAmI().tapBody), 4000, 12);   /* 12 > 欢迎语的 11：点了必有回应 */
    }, true);
    window.addEventListener('live2d:hoverbody', function (e) {
      e.stopImmediatePropagation();
      tell(pick(whoAmI().hoverBody), 4000, 8, false);   /* 同级不打断，防闪烁 */
    }, true);

    /* 闲聊：只在访客静止一段时间后才开口 —— 正在操作时插话很打扰。
       与 widget 自带的通用闲聊同级（9），两者自然轮替：
       通用词讲工具事实，人格词讲她自己的话。 */
    var lastAct = Date.now();
    ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, function () { lastAct = Date.now(); },
        { passive: true });
    });
    setInterval(function () {
      if (document.hidden) return;
      if (Date.now() - lastAct < 12000) return;   /* 静止满 12 秒才开口 */
      var w = document.getElementById('waifu');
      if (!w || w.classList.contains('waifu-hidden')) return;
      var cur = parseInt(sessionStorage.getItem('waifu-message-priority'), 10);
      if (!isNaN(cur) && cur > 9) return;          /* 只让位给更要紧的话 */
      tell(pick(whoAmI().idle), 6000, 9);
    }, 25000);
  }

  /* 复制静音：widget 在 window 上监听 copy 事件、每次复制都要说一句。
     工具页本身用的是 clipboard API（不触发该事件），所以触发者只会是
     访客手动 Ctrl+C —— 而这页正是用来复制 ffmpeg 命令的，次次点评太吵。
     这里在【捕获阶段】拦下事件：捕获先于冒泡，widget 的监听器挂在冒泡阶段，
     于是收不到；浏览器自身的复制动作不受影响（没有 preventDefault）。
     想让她恢复点评，把 WAIFU.quietCopy 改成 false。 */
  function silenceCopy() {
    if (!WAIFU.quietCopy) return;
    window.addEventListener('copy', function (e) {
      e.stopImmediatePropagation();
    }, true);
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
    var dress = setInterval(function () {
      var t = document.getElementById('waifu-toggle');
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
        /* 五个：换人 / 换装 / 拍照 / 介绍 / 关闭。
           「一言」要拉外部 API、工具页用不上，去掉。
           桌面与手机一致 —— 5×21px 正好落在她 118px 的可见高度内。 */
        tools: ['switch-model', 'switch-texture', 'photo', 'info', 'quit'],
        logLevel: 'error',
        drag: false
      });
    };
    document.head.appendChild(sc);
  }

  function bootWaifu() {
    /* 进页面做三件事：注册缓存、预下载资源、放出召唤标签。
       注意这里【不】初始化 widget —— 她默认不显示。 */
    registerSW();
    silenceCopy();
    personaTalk();
    preloadWaifu();      /* 资源照常下载并进缓存，但她不出现 */
    buildSummonTab();    /* 左下角标签，点了才现身（此时秒开） */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mount();
      bootWaifu();
    });
  } else {
    mount();
    bootWaifu();
  }
})();
