/* ============================================================
   weather.js — 和风富数据组件 for Hexo Fluid · 静默清单版
   面板改为「标签左 · 数值右」逐行清单；穿衣指数映射为衣着建议
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://weather.icome.world/',
    mount:    'footer',
    cacheMin: 20
  };
  /* ================================================== */

  var EL_ID   = 'mw-weather';
  var WX_KEY  = 'mw-qw-cache';
  var LOC_KEY = 'mw-qw-manual-loc';

  // 穿衣指数：和风的 category 是天气形容（炎热/热/舒适…），映射成真正的衣着建议
  var DRESS = {
    '炎热': '宜短袖', '热': '宜轻薄', '舒适': '宜单衣', '较舒适': '宜薄外套',
    '较冷': '宜夹克', '冷': '宜棉服', '寒冷': '宜厚羽绒'
  };

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

  // 一行：标签左 · 数值右
  function row(label, value, title) {
    var r = el('div', 'mw-row');
    r.appendChild(el('span', 'mw-k', label));
    var v = el('span', 'mw-v', value);
    r.appendChild(v);
    if (title) r.title = title;
    return r;
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

  /* --------------------- 位置校正 --------------------- */

  function buildFixRow() {
    var manual = readManualLoc();
    var wrap = el('div', 'mw-block mw-fixrow');

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
    input.addEventListener('click', function (e) { e.stopPropagation(); });
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

    // 块 1：体感 / 湿度 / 风
    var b1 = el('div', 'mw-block');
    if (d.now.feelsLike != null) b1.appendChild(row('体感', Math.round(+d.now.feelsLike) + '°'));
    if (d.now.humidity  != null) b1.appendChild(row('湿度', d.now.humidity + '%'));
    if (d.now.windDir)           b1.appendChild(row('风', d.now.windDir + ' ' + (d.now.windScale || '—') + ' 级'));
    if (b1.childNodes.length) panel.appendChild(b1);

    // 块 2：空气（数值 + 等级，无彩色装饰）
    if (d.aqi && d.aqi.value) {
      var b2 = el('div', 'mw-block');
      b2.appendChild(row('空气', d.aqi.value + (d.aqi.category ? ' ' + d.aqi.category : ''),
        d.aqi.primary ? '主要污染物 ' + d.aqi.primary : ''));
      panel.appendChild(b2);
    }

    // 块 3：生活指数（穿衣映射为衣着建议）
    if (d.indices && d.indices.length) {
      var b3 = el('div', 'mw-block');
      d.indices.forEach(function (it) {
        var label = it.name.replace('指数', '');
        var value = it.category || '—';
        if (it.type === '3' && DRESS[value]) value = DRESS[value];
        b3.appendChild(row(label, value, it.text || ''));
      });
      panel.appendChild(b3);
    }

    panel.appendChild(buildFixRow());
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
