/* ============================================================
   weather.js — 和风富数据组件 · 侧边栏行内版
   挂载到侧边栏底部插槽；点击头部行内展开详情（不再悬浮面板）
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://weather.icome.world/',
    slot:     '#sidebar-weather-slot',   // 侧边栏插槽
    cacheMin: 20
  };
  /* ================================================== */

  var EL_ID   = 'mw-weather';
  var WX_KEY  = 'mw-qw-cache';
  var LOC_KEY = 'mw-qw-manual-loc';

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
  function sep() { return el('span', 'mw-sep', '\u00b7'); }
  function pair(label, value, title) {
    var s = el('span', 'mw-pair');
    s.appendChild(el('span', 'mw-k', label));
    s.appendChild(el('span', 'mw-v', value));
    if (title) s.title = title;
    return s;
  }
  function line(pairs) {
    var l = el('div', 'mw-line');
    pairs.forEach(function (p, i) {
      if (i) l.appendChild(el('span', 'mw-dot', '\u00b7'));
      l.appendChild(p);
    });
    return l;
  }

  /* --------------------- 位置校正 --------------------- */

  function buildFixRow() {
    var manual = readManualLoc();
    var wrap = el('div', 'mw-fixrow');

    var link = el('button', 'mw-fixlink', manual ? '位置：' + manual.city + '（重选）' : '位置不对？点此修正');
    link.type = 'button';
    wrap.appendChild(link);

    var box = el('div', 'mw-searchbox');
    box.style.display = 'none';
    var input = el('input', 'mw-input');
    input.type = 'text';
    input.placeholder = '输入城市名';
    var results = el('div', 'mw-results');
    box.appendChild(input);
    box.appendChild(results);
    wrap.appendChild(box);

    if (manual) {
      var reset = el('button', 'mw-fixlink mw-reset', '恢复自动定位');
      reset.type = 'button';
      reset.addEventListener('click', function (e) {
        e.stopPropagation();
        clearManualLoc();
        clearWxCache();
        update();
      });
      wrap.appendChild(reset);
    }

    link.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      if (!open) input.focus();
    });

    var timer = null;
    input.addEventListener('input', function () {
      var q = input.value.trim();
      results.textContent = '';
      if (timer) clearTimeout(timer);
      if (!q) return;
      timer = setTimeout(function () { doSearch(q, results); }, 350);
    });

    return wrap;
  }

  function doSearch(q, results) {
    results.textContent = '';
    results.appendChild(el('div', 'mw-hint', '搜索中…'));
    fetch(CONFIG.endpoint.replace(/\/$/, '') + '/search?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        results.textContent = '';
        var items = (d && d.items) || [];
        if (!items.length) {
          results.appendChild(el('div', 'mw-hint', '没找到，换个词试试'));
          return;
        }
        items.forEach(function (it) {
          var r = el('div', 'mw-result', it.label || it.name);
          r.addEventListener('click', function (e) {
            e.stopPropagation();
            writeManualLoc({ lat: it.lat, lon: it.lon, city: it.name });
            clearWxCache();
            update();
          });
          results.appendChild(r);
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
    var slot = document.querySelector(CONFIG.slot);
    if (!slot) return;

    var root = document.getElementById(EL_ID);
    var wasOpen = root && root.classList.contains('mw-open');
    if (!root) {
      root = el('div');
      root.id = EL_ID;
      slot.appendChild(root);
    }
    root.textContent = '';
    if (wasOpen) root.classList.add('mw-open');

    /* —— 头部 —— */
    var head = el('button', 'mw-head');
    head.type = 'button';
    head.setAttribute('aria-label', '展开天气详情');
    head.setAttribute('aria-expanded', wasOpen ? 'true' : 'false');
    if (d.now.icon) head.appendChild(el('i', 'mw-ico qi-' + d.now.icon));
    if (d.city) {
      head.appendChild(el('span', 'mw-city', d.city));
      head.appendChild(sep());
    }
    head.appendChild(el('span', 'mw-desc', d.now.text || '—'));
    head.appendChild(sep());
    head.appendChild(el('span', 'mw-temp', Math.round(+d.now.temp) + '°'));
    root.appendChild(head);

    /* —— 行内展开详情 —— */
    var detail = el('div', 'mw-detail');
    var inner = el('div', 'mw-detail-inner');

    var l1 = [];
    if (d.now.feelsLike != null) l1.push(pair('体感', Math.round(+d.now.feelsLike) + '°'));
    if (d.now.humidity  != null) l1.push(pair('湿度', d.now.humidity + '%'));
    if (l1.length) inner.appendChild(line(l1));

    var l2 = [];
    if (d.now.windDir) l2.push(pair(d.now.windDir, (d.now.windScale || '—') + ' 级'));
    if (d.aqi && d.aqi.value) {
      l2.push(pair('空气', d.aqi.value + (d.aqi.category ? ' ' + d.aqi.category : ''),
        d.aqi.primary ? '主要污染物 ' + d.aqi.primary : ''));
    }
    if (l2.length) inner.appendChild(line(l2));

    inner.appendChild(buildFixRow());
    detail.appendChild(inner);
    root.appendChild(detail);
    root.classList.add('mw-ready');

    head.addEventListener('click', function () {
      var open = root.classList.toggle('mw-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function buildQuery() {
    var manual = readManualLoc();
    if (manual && manual.lat && manual.lon) {
      return '?lat=' + manual.lat + '&lon=' + manual.lon + '&city=' + encodeURIComponent(manual.city || '');
    }
    return '';
  }

  function update(retries) {
    retries = retries || 0;
    // 侧边栏由 JS 注入，可能晚于本脚本就绪：轮询等插槽出现
    if (!document.querySelector(CONFIG.slot)) {
      if (retries < 20) setTimeout(function () { update(retries + 1); }, 200);
      return;
    }
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
    document.addEventListener('DOMContentLoaded', function () { update(); });
  } else {
    update();
  }

  // pjax：侧边栏常驻则无需动作；若被整页替换掉则重挂
  document.addEventListener('pjax:complete', function () {
    var n = document.getElementById(EL_ID);
    if (!n || !n.isConnected) {
      if (n) n.remove();
      update();
    }
  });
})();
