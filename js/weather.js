/* ============================================================
   weather.js — 和风富数据组件 for Hexo Fluid · 定位可手动修正版
   头部：图标 · 城市 · 天气 · 温度
   面板：体感/湿度/风 ｜ 空气 ｜ 穿衣/洗车/感冒 ｜ 位置校正
   定位优先级：本地手动选择 > Worker 自动定位（ip-api → Cloudflare 兜底）
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://weather.icome.world/',  // Worker 地址（末尾带 /）
    mount:    'footer',
    cacheMin: 20
  };
  /* ================================================== */

  var EL_ID    = 'mw-weather';
  var WX_KEY   = 'mw-qw-cache';
  var LOC_KEY  = 'mw-qw-manual-loc';   // 手动选定的位置，长期保留，不受 cacheMin 影响

  function readManualLoc() {
    try { return JSON.parse(localStorage.getItem(LOC_KEY)); } catch (e) { return null; }
  }
  function writeManualLoc(loc) {
    try { localStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch (e) {}
  }
  function clearManualLoc() {
    try { localStorage.removeItem(LOC_KEY); } catch (e) {}
  }

  function readWxCache() {
    try {
      var o = JSON.parse(sessionStorage.getItem(WX_KEY));
      if (o && Date.now() - o.t <= CONFIG.cacheMin * 60000) return o.d;
    } catch (e) {}
    return null;
  }
  function writeWxCache(d) {
    try { sessionStorage.setItem(WX_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
  }
  function clearWxCache() {
    try { sessionStorage.removeItem(WX_KEY); } catch (e) {}
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function sep() { return el('span', 'mw-sep', '·'); }
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

  /* --------------------- 位置校正 UI --------------------- */

  function buildFixRow(root) {
    var manual = readManualLoc();
    var row = el('div', 'mw-block mw-fixrow');

    var link = el('button', 'mw-fixlink', manual ? '位置：' + manual.city + '（点此重选）' : '位置不对？点此修正');
    link.type = 'button';
    row.appendChild(link);

    var box = el('div', 'mw-searchbox');
    box.style.display = 'none';
    var input = el('input', 'mw-input');
    input.type = 'text';
    input.placeholder = '输入城市名，如 兰溪';
    var results = el('div', 'mw-results');
    box.appendChild(input);
    box.appendChild(results);
    row.appendChild(box);

    if (manual) {
      var reset = el('button', 'mw-fixlink mw-reset', '恢复自动定位');
      reset.type = 'button';
      reset.addEventListener('click', function (e) {
        e.stopPropagation();
        clearManualLoc();
        clearWxCache();
        update();
      });
      row.appendChild(reset);
    }

    link.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      if (!open) input.focus();
    });

    var timer = null;
    input.addEventListener('click', function (e) { e.stopPropagation(); });
    input.addEventListener('input', function () {
      var q = input.value.trim();
      results.textContent = '';
      if (timer) clearTimeout(timer);
      if (!q) return;
      timer = setTimeout(function () { doSearch(q, results); }, 350);
    });

    return row;
  }

  function doSearch(q, results) {
    results.textContent = '';
    var loading = el('div', 'mw-hint', '搜索中…');
    results.appendChild(loading);
    fetch(CONFIG.endpoint.replace(/\/$/, '') + '/search?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        results.textContent = '';
        var items = (d && d.items) || [];
        if (!items.length) {
          results.appendChild(el('div', 'mw-hint', '没找到，换个关键词试试'));
          return;
        }
        items.forEach(function (it) {
          var row = el('div', 'mw-result', it.label || it.name);
          row.addEventListener('click', function (e) {
            e.stopPropagation();
            writeManualLoc({ lat: it.lat, lon: it.lon, city: it.name });
            clearWxCache();
            update();
          });
          results.appendChild(row);
        });
      })
      .catch(function () {
        results.textContent = '';
        results.appendChild(el('div', 'mw-hint', '搜索失败，稍后再试'));
      });
  }

  /* --------------------- 渲染 --------------------- */

  function render(d) {
    if (!d || !d.now || d.now.temp == null) return;
    var root = mountNode();
    root.textContent = '';

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

    var panel = el('div', 'mw-panel');

    var g1 = el('div', 'mw-grid');
    if (d.now.feelsLike != null) g1.appendChild(item('体感', Math.round(+d.now.feelsLike) + '°'));
    if (d.now.humidity  != null) g1.appendChild(item('湿度', d.now.humidity + '%'));
    if (d.now.windDir)           g1.appendChild(item(d.now.windDir, (d.now.windScale || '—') + ' 级'));
    if (g1.childNodes.length) {
      var b1 = el('div', 'mw-block'); b1.appendChild(g1); panel.appendChild(b1);
    }

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
      v.appendChild(document.createTextNode(d.aqi.value + (d.aqi.category ? ' · ' + d.aqi.category : '')));
      if (d.aqi.primary) v.title = '主要污染物 ' + d.aqi.primary;
      w.appendChild(v); b2.appendChild(w); panel.appendChild(b2);
    }

    if (d.indices && d.indices.length) {
      var g3 = el('div', 'mw-grid');
      d.indices.forEach(function (it) {
        g3.appendChild(item(it.name.replace('指数', ''), it.category || '—', it.text || ''));
      });
      var b3 = el('div', 'mw-block'); b3.appendChild(g3); panel.appendChild(b3);
    }

    panel.appendChild(buildFixRow(root));

    root.appendChild(panel);
    root.classList.add('mw-ready');

    head.addEventListener('click', function (e) {
      e.stopPropagation();
      root.classList.toggle('mw-open');
    });
    document.addEventListener('click', function () {
      root.classList.remove('mw-open');
      var box = root.querySelector('.mw-searchbox');
      if (box) box.style.display = 'none';
    });
  }

  function buildQuery() {
    var manual = readManualLoc();
    if (manual && manual.lat && manual.lon) {
      return '?lat=' + manual.lat + '&lon=' + manual.lon + '&city=' + encodeURIComponent(manual.city || '');
    }
    return '';
  }

  function update() {
    var cached = readWxCache();
    if (cached) { render(cached); return; }
    fetch(CONFIG.endpoint.replace(/\/$/, '') + '/' + buildQuery()).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) {
      if (d && d.error) throw new Error(d.error);
      writeWxCache(d);
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
