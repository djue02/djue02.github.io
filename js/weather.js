/* ============================================================
   weather.js — 和风富数据组件 for Hexo Fluid
   数据源：你的 Cloudflare Worker（已藏 key、按访客 IP 定位）
   头部常显：图标 · 城市 · 天气 · 温度
   悬停/点按展开：体感 湿度 风 ｜ 空气 ｜ 生活指数
   通过 custom_js 引入，不改主题源码；pjax 翻页自动重挂
   数据许可：QWeather Developers License
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://blog.djue02.workers.dev/',  // 你的 Worker 地址
    mount:    'footer',    // 'footer' 页脚 ｜ 'fixed' 左下角悬浮
    cacheMin: 20           // 前端缓存分钟数（Worker 端另有 15 分钟边缘缓存）
  };
  /* ================================================== */

  var EL_ID = 'mw-weather';
  var KEY   = 'mw-qw-cache';

  function readCache() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY));
      if (o && Date.now() - o.t <= CONFIG.cacheMin * 60000) return o.d;
    } catch (e) {}
    return null;
  }
  function writeCache(d) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function sep() { return el('span', 'mw-sep', '·'); }

  function mountNode() {
    var n = document.getElementById(EL_ID);
    if (n) return n;
    n = el('div');
    n.id = EL_ID;
    n.className = 'mw--' + CONFIG.mount;
    if (CONFIG.mount === 'fixed') {
      document.body.appendChild(n);
    } else {
      var footer = document.querySelector('.footer-inner');
      (footer || document.body).appendChild(n);
    }
    return n;
  }

  function render(d) {
    if (!d || !d.now || d.now.temp == null) return;
    var root = mountNode();
    root.textContent = '';

    /* —— 头部 —— */
    var head = el('button', 'mw-head');
    head.type = 'button';
    head.setAttribute('aria-label', '天气详情');
    if (d.now.icon) head.appendChild(el('i', 'mw-ico qi-' + d.now.icon));
    if (d.city) {
      head.appendChild(el('span', 'mw-city', d.city));
      head.appendChild(sep());
    }
    head.appendChild(el('span', 'mw-desc', d.now.text || '—'));
    head.appendChild(sep());
    head.appendChild(el('span', 'mw-temp', Math.round(+d.now.temp) + '°'));
    root.appendChild(head);

    /* —— 展开面板 —— */
    var panel = el('div', 'mw-panel');

    // 行 1：体感 / 湿度 / 风
    var r1 = el('div', 'mw-row');
    if (d.now.feelsLike != null) { var a = el('span', null, '体感 '); a.appendChild(el('b', null, Math.round(+d.now.feelsLike) + '°')); r1.appendChild(a); }
    if (d.now.humidity  != null) { var b = el('span', null, '湿度 '); b.appendChild(el('b', null, d.now.humidity + '%'));  r1.appendChild(b); }
    if (d.now.windDir) { var c = el('span', null, d.now.windDir + ' '); c.appendChild(el('b', null, d.now.windScale + '级')); r1.appendChild(c); }
    if (r1.childNodes.length) panel.appendChild(r1);

    // 行 2：空气质量（带 AQI 官方色小圆点）
    if (d.aqi && d.aqi.value) {
      var r2 = el('div', 'mw-row');
      var s = el('span', null, '');
      if (d.aqi.color && d.aqi.color.length === 3) {
        var dot = el('span', 'mw-dot');
        dot.style.background = 'rgb(' + d.aqi.color.join(',') + ')';
        s.appendChild(dot);
      }
      s.appendChild(document.createTextNode('空气 '));
      s.appendChild(el('b', null, d.aqi.value + (d.aqi.category ? ' · ' + d.aqi.category : '')));
      r2.appendChild(s);
      panel.appendChild(r2);
    }

    // 行 3：生活指数（穿衣 / 洗车 / 感冒，text 放 title 悬停可读全文）
    if (d.indices && d.indices.length) {
      var r3 = el('div', 'mw-row');
      d.indices.forEach(function (it) {
        var s = el('span', null, it.name.replace('指数', '') + ' ');
        s.appendChild(el('b', null, it.category || '—'));
        if (it.text) s.title = it.text;
        r3.appendChild(s);
      });
      panel.appendChild(r3);
    }

    root.appendChild(panel);
    root.classList.add('mw-ready');

    // 触屏：点按切换面板；点外部收起
    head.addEventListener('click', function (e) {
      e.stopPropagation();
      root.classList.toggle('mw-open');
    });
    document.addEventListener('click', function () {
      root.classList.remove('mw-open');
    });
  }

  function update() {
    var cached = readCache();
    if (cached) { render(cached); return; }
    fetch(CONFIG.endpoint).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) {
      if (d && d.error) throw new Error(d.error);
      writeCache(d);
      render(d);
    }).catch(function (e) {
      // 静默失败：不显示组件，不打扰阅读
      if (window.console) console.warn('[weather]', (e && e.message) || e);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  // pjax 兼容：翻页后组件若被换掉则重挂（读缓存，不重复请求）
  ['pjax:complete', 'pjax:success'].forEach(function (evt) {
    document.addEventListener(evt, function () {
      var n = document.getElementById(EL_ID);
      if (!n) { update(); return; }
      if (CONFIG.mount === 'footer' && !n.closest('.footer-inner')) {
        n.remove();
        update();
      }
    });
  });
})();
