/* ============================================================
   weather.js — 和风富数据组件 · 侧边栏行内版
   挂载到侧边栏底部插槽；点击头部行内展开详情（不再悬浮面板）
   ============================================================ */
(function () {
  'use strict';

  /* ===================== 配置区 ===================== */
  var CONFIG = {
    endpoint: 'https://weather.goodblog.org/',
    slot:     '#sidebar-weather-slot',   // 侧边栏插槽
    cacheMin: 20,
    defaultLoc: { lat: '29.21007', lon: '119.46052', city: '兰溪' }
  };
  /* ================================================== */

  var EL_ID   = 'mw-weather';
  var WX_KEY  = 'mw-qw-cache-lanxi';
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

  /* --------------------- 城市搜索 --------------------- */

  var cleanupSearch = null;

  function buildFixRow() {
    if (cleanupSearch) cleanupSearch();
    var manual = readManualLoc();
    var wrap = el('div', 'mw-fixrow');

    var box = el('div', 'mw-searchbox');
    var field = el('div', 'mw-searchfield');
    var icon = el('span', 'mw-search-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.1 15.1 5.4 5.4"/></svg>';
    var input = el('input', 'mw-input');
    input.type = 'text';
    input.placeholder = '你那儿的天气怎么样？';
    input.setAttribute('aria-label', '搜索城市');
    var results = el('div', 'mw-results');
    results.hidden = true;
    results.setAttribute('aria-label', '城市搜索结果');
    var matches = el('div', 'mw-matches');
    document.body.appendChild(results);
    field.appendChild(icon);
    field.appendChild(input);
    box.appendChild(field);

    wrap.appendChild(box);

    if (manual) {
      var reset = el('button', 'mw-result mw-default-city', '青青子衿，悠悠我心');
      reset.setAttribute('aria-label', '回到兰溪');
      reset.title = '回到兰溪';
      reset.type = 'button';
      reset.addEventListener('click', function (e) {
        e.stopPropagation();
        closeResults();
        clearManualLoc();
        clearWxCache();
        update();
      });
      results.appendChild(reset);
    }

    results.appendChild(matches);

    var timer = null;
    var requestVersion = 0;
    function closeResults() {
      results.hidden = true;
      requestVersion++;
      clearTimeout(timer);
    }
    function placeResults() {
      var rect = field.getBoundingClientRect();
      results.style.width = rect.width + 'px';
      results.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)) + 'px';
      results.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      results.style.maxHeight = Math.max(48, Math.min(220, rect.top - 16)) + 'px';
    }
    function search() {
      var q = input.value.trim();
      closeResults();
      matches.textContent = '';
      if (!q) {
        if (manual) {
          placeResults();
          results.hidden = false;
        }
        return;
      }
      var version = requestVersion;
      timer = setTimeout(function () {
        placeResults();
        results.hidden = false;
        doSearch(q, matches, function () { return version === requestVersion && field.isConnected; });
      }, 350);
    }
    function outsideClick(e) {
      if (!box.contains(e.target) && !results.contains(e.target)) closeResults();
    }
    function scrollOutside(e) {
      if (!results.contains(e.target)) closeResults();
    }
    function escape(e) { if (e.key === 'Escape') closeResults(); }
    var sidebar = document.getElementById('sidebar');
    var observer = new MutationObserver(function () {
      var root = document.getElementById(EL_ID);
      if (sidebar && sidebar.classList.contains('sidebar-hidden')) {
        closeResults();
        input.value = '';
        matches.textContent = '';
        if (document.activeElement === input) input.blur();
        if (root && root.classList.contains('mw-open')) {
          root.classList.remove('mw-open');
          var head = root.querySelector('.mw-head');
          if (head) head.setAttribute('aria-expanded', 'false');
        }
      } else if (!root || !root.classList.contains('mw-open')) {
        closeResults();
      }
    });
    if (sidebar) observer.observe(sidebar, { attributes: true, subtree: true, attributeFilter: ['class'] });
    input.addEventListener('input', search);
    input.addEventListener('focus', search);
    input.addEventListener('click', function () { if (results.hidden) search(); });
    document.addEventListener('pointerdown', outsideClick);
    document.addEventListener('scroll', scrollOutside, true);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', closeResults);
    cleanupSearch = function () {
      closeResults();
      observer.disconnect();
      results.remove();
      document.removeEventListener('pointerdown', outsideClick);
      document.removeEventListener('scroll', scrollOutside, true);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', closeResults);
    };

    return wrap;
  }

  function doSearch(q, results, isCurrent) {
    results.textContent = '';
    results.appendChild(el('div', 'mw-hint', '搜索中…'));
    fetch(CONFIG.endpoint.replace(/\/$/, '') + '/search?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!isCurrent()) return;
        results.textContent = '';
        var items = (d && d.items) || [];
        if (!items.length) {
          results.appendChild(el('div', 'mw-hint', '没找到，换个词试试'));
          return;
        }
        items.forEach(function (it) {
          var r = el('button', 'mw-result', it.label || it.name);
          r.type = 'button';
          r.addEventListener('click', function (e) {
            e.stopPropagation();
            results.closest('.mw-results').hidden = true;
            writeManualLoc({ lat: it.lat, lon: it.lon, city: it.name });
            clearWxCache();
            update();
          });
          results.appendChild(r);
        });
      })
      .catch(function () {
        if (!isCurrent()) return;
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
    requestAnimationFrame(sizeWeatherSearch);

    head.addEventListener('click', function () {
      var open = root.classList.toggle('mw-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function sizeWeatherSearch() {
    var root = document.getElementById(EL_ID);
    var sidebar = document.getElementById('sidebar');
    var toggle = document.getElementById('sidebar-toggle');
    if (!root) return;
    var width = 0;
    root.querySelectorAll('.mw-head, .mw-line').forEach(function (line) {
      var range = document.createRange();
      range.selectNodeContents(line);
      width = Math.max(width, range.getBoundingClientRect().width);
    });
    var box = root.querySelector('.mw-searchbox');
    var field = root.querySelector('.mw-searchfield');
    if (box && width) {
      var searchWidth = Math.max(Math.ceil(width) + 20, 179);
      box.style.width = searchWidth + 'px';
      box.style.setProperty('--mw-placeholder-size', '12.5px');
    }
    if (sidebar && toggle && field) {
      var bottom = parseFloat(getComputedStyle(toggle).bottom) || 32;
      var fieldRect = field.getBoundingClientRect();
      var trailing = field.closest('.mw-fixrow').getBoundingClientRect().bottom - fieldRect.bottom;
      var padding = bottom + toggle.getBoundingClientRect().height / 2 - fieldRect.height / 2 - trailing;
      sidebar.style.setProperty('--mw-bottom-space', Math.max(0, padding) + 'px');
      var head = root.querySelector('.mw-head');
      if (head) {
        var collapsedPadding = bottom + toggle.getBoundingClientRect().height / 2 - head.getBoundingClientRect().height / 2 - 2;
        sidebar.style.setProperty('--mw-collapsed-bottom-space', Math.max(0, collapsedPadding) + 'px');
      }
    }
  }
  window.addEventListener('resize', sizeWeatherSearch);
  if (document.fonts) document.fonts.ready.then(sizeWeatherSearch);

  function buildQuery() {
    var manual = readManualLoc();
    var loc = manual && manual.lat && manual.lon ? manual : CONFIG.defaultLoc;
    return '?lat=' + encodeURIComponent(loc.lat) + '&lon=' + encodeURIComponent(loc.lon) +
      '&city=' + encodeURIComponent(loc.city || '');
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
