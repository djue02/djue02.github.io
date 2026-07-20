/* ============================================================
   weather.js — 和风富数据组件 for Hexo Fluid · 面板精修版
   头部：图标 · 城市 · 天气 · 温度
   面板：体感/湿度/风 ｜ 空气 ｜ 穿衣/洗车/感冒（标签+值 网格）
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://weather.icome.world/',  // Worker 地址（绑自定义域后改这里）
    mount:    'footer',    // 'footer' 页脚 ｜ 'fixed' 左下角悬浮
    cacheMin: 20           // 前端缓存分钟数
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

  // 一个「标签+值」格子
  function item(label, value, title) {
    var w = el('div', 'mw-item');
    w.appendChild(el('span', 'mw-k', label));
    var v = el('span', 'mw-v', value);
    if (title) { v.title = title; w.title = title; }
    w.appendChild(v);
    return w;
  }

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

    /* —— 面板 —— */
    var panel = el('div', 'mw-panel');

    // 块 1：体感 / 湿度 / 风（三列网格）
    var g1 = el('div', 'mw-grid');
    if (d.now.feelsLike != null) g1.appendChild(item('体感', Math.round(+d.now.feelsLike) + '°'));
    if (d.now.humidity  != null) g1.appendChild(item('湿度', d.now.humidity + '%'));
    if (d.now.windDir)           g1.appendChild(item(d.now.windDir, (d.now.windScale || '—') + ' 级'));
    if (g1.childNodes.length) {
      var b1 = el('div', 'mw-block');
      b1.appendChild(g1);
      panel.appendChild(b1);
    }

    // 块 2：空气（圆点 + 数值 · 等级）
    if (d.aqi && d.aqi.value) {
      var b2 = el('div', 'mw-block');
      var w = el('div', 'mw-item');
      w.appendChild(el('span', 'mw-k', '空气质量'));
      var v = el('span', 'mw-v');
      if (d.aqi.color && d.aqi.color.length === 3) {
        var dot = el('span', 'mw-dot');
        dot.style.background = 'rgb(' + d.aqi.color.join(',') + ')';
        v.appendChild(dot);
      }
      v.appendChild(document.createTextNode(
        d.aqi.value + (d.aqi.category ? ' · ' + d.aqi.category : '')
      ));
      if (d.aqi.primary) { v.title = '主要污染物 ' + d.aqi.primary; }
      w.appendChild(v);
      b2.appendChild(w);
      panel.appendChild(b2);
    }

    // 块 3：生活指数（穿衣 / 洗车 / 感冒，悬停看全文）
    if (d.indices && d.indices.length) {
      var g3 = el('div', 'mw-grid');
      d.indices.forEach(function (it) {
        g3.appendChild(item(it.name.replace('指数', ''), it.category || '—', it.text || ''));
      });
      var b3 = el('div', 'mw-block');
      b3.appendChild(g3);
      panel.appendChild(b3);
    }

    root.appendChild(panel);
    root.classList.add('mw-ready');

    // 触屏：点按切换；点外部收起
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
      if (window.console) console.warn('[weather]', (e && e.message) || e);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

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
