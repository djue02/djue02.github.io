/**
 * 右键菜单 · 优化版
 * ---------------------------------------------------------
 * 相对旧版的变更:
 *  - 移除首次右键的全屏提示 toast;改为菜单底部常驻小字提示
 *    (信息保留,零侵入;旧 #tooltip-rightmenu 元素已无人使用,
 *     可从 RightMenu.html 删除,留着也无害)
 *  - 修复定位测量 bug:旧代码在 display:none 时调用
 *    getBoundingClientRect() 恒为 0,屏幕边缘翻转逻辑从未生效;
 *    现改为"先显示、后测量、再定位",同一帧内完成,无闪烁
 *  - 打开/关闭均有过渡动画,菜单从光标所在角落生长
 *    (动态 transform-origin,配合 CSS 的 .show 状态)
 *  - 不再覆写 window.onclick / window.oncontextmenu,
 *    改用 addEventListener,避免与主题脚本互相踩踏
 *  - 新增 Esc / 滚动 / 窗口失焦 / 窗口缩放 时关闭
 * ---------------------------------------------------------
 */

/* ==================== 菜单开合与定位 ==================== */
(function () {
  var wrapper = document.getElementById('rightmenu-wrapper');
  var content = document.getElementById('rightmenu-content');
  if (!wrapper || !content) return;

  /* ---- 底部常驻提示:替代旧的首次右键全屏 toast ----
     结构自适应:#rightmenu-content 自己是 <ul>、或 <ul> 在其内部,
     class 是否为 list-v/rightmenu,均可匹配 */
  var menuList = null;
  if (content.matches && content.matches('ul')) {
    menuList = content;
  } else {
    menuList = content.querySelector('ul.list-v.rightmenu') ||
               content.querySelector('ul.rightmenu') ||
               content.querySelector('ul');
  }
  /* 提示文案:一句自然的话,而非快捷键标签。可按口味替换:
     '按住 Ctrl + 右键,唤出系统菜单'(默认)
     '系统菜单,藏在 Ctrl + 右键里'
     'Ctrl + 右键 → 系统菜单' */
  var RM_HINT_TEXT = '按住 Ctrl + 右键,唤出系统菜单';
  if (menuList && !menuList.querySelector('.rm-hint')) {
    var hint = document.createElement('li');
    hint.className = 'rm-hint';
    hint.textContent = RM_HINT_TEXT;
    menuList.appendChild(hint);
  } else if (!menuList) {
    console.warn('[RightMenu] 未找到菜单列表元素,底部提示未挂载——请把 RightMenu.html 结构发给开发者');
  }

  /* ---- 键盘与读屏礼仪:角色标注 ---- */
  wrapper.setAttribute('role', 'menu');
  content.querySelectorAll('a.vlts-menu, a.nav').forEach(function (a) {
    a.setAttribute('role', 'menuitem');
    if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '-1');
  });
  var toastEl = document.getElementById('tooltip-rightmenu-return');
  if (toastEl) toastEl.setAttribute('role', 'status'); /* 读屏器会播报"已复制"等反馈 */

  /* ---- 滑移高亮:整张菜单只有一枚高亮,在条目间滑行(鼠标与键盘共用) ---- */
  var pill = null;
  if (menuList) {
    pill = document.createElement('li');
    pill.className = 'rm-pill';
    menuList.insertBefore(pill, menuList.firstChild); /* 作首子元素,天然垫在条目之下 */
  }
  function movePill(el) {
    if (!pill || !el) return;
    var firstShow = !pill.classList.contains('on');
    if (firstShow) pill.style.transition = 'none'; /* 首现:原地浮现,不从别处飞来 */
    /* offset 几何与 transform 无关,免疫入场 scale(0.92) 的坐标污染 */
    pill.style.width = el.offsetWidth + 'px';
    pill.style.height = el.offsetHeight + 'px';
    pill.style.transform = 'translate(' + el.offsetLeft + 'px, ' + el.offsetTop + 'px)';
    if (firstShow) { void pill.offsetWidth; pill.style.transition = ''; }
    pill.classList.add('on');
  }
  function hidePill() { if (pill) pill.classList.remove('on'); }

  content.addEventListener('mouseover', function (e) {
    var item = e.target.closest('a.vlts-menu, a.nav');
    if (item) movePill(item);
  });
  content.addEventListener('mouseleave', hidePill);
  content.addEventListener('focusin', function (e) {
    var item = e.target.closest('a.vlts-menu, a.nav');
    if (item) movePill(item);
  });

  /* ---- 整页轻柔化(可选方案,当前关闭) ----
     真·局部玻璃启用期间,雾只在面板里,页面保持清澈。
     想切回"整页柔化"方案:USE_PAGE_SOFTEN 改为 true,
     并按 CSS 注释移除面板的 backdrop-filter */
  var USE_PAGE_SOFTEN = false;
  var SOFTEN_SELECTORS = ['#web_bg', '#banner', 'main', '.main', 'footer'];
  var softenEls = [];
  SOFTEN_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (softenEls.indexOf(el) === -1) {
        el.classList.add('rm-soften-target');
        softenEls.push(el);
      }
    });
  });
  function soften(on) {
    softenEls.forEach(function (el) { el.classList.toggle('rm-soften', !!on); });
  }

  function closeMenu() {
    wrapper.classList.remove('show');
    soften(false);
    hidePill(); /* 下次打开从"无高亮"起步 */
  }

  /* ---- 滚动策略:滚动不关闭菜单 ----
     页面自由滚动,菜单钉在原位(position:fixed 天然如此)。
     仅当指针悬在菜单上方时吞掉滚轮,避免瞄准菜单项时页面在身后晃动;
     监听器挂在 wrapper 自身,只在指针入内时触发,零全局开销 */
  wrapper.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

  document.addEventListener('contextmenu', function (e) {
    if (e.ctrlKey) return; /* Ctrl+右键:放行系统原生菜单 */
    e.preventDefault();
    if (wrapper.contains(e.target)) return; /* 在菜单自身上右键:保持现状 */

    /* ---- 按语境更新条目可见性 ---- */
    var copyItem = document.getElementById('copy-selected-text');
    var selectedText = window.getSelection().toString().trim();
    if (copyItem) copyItem.hidden = !selectedText;

    var downloadItem = document.getElementById('download-image');
    var img = e.target.closest('img') || e.target.closest('svg');
    if (downloadItem) {
      downloadItem.hidden = true;
      if (img) {
        var a = downloadItem.querySelector('a');
        if (img.tagName.toLowerCase() === 'img') {
          if (a) a.setAttribute('onclick', "downloadImage('" + img.src + "')");
          downloadItem.hidden = false;
        } else if (img.classList.contains('custom-gallery-svg')) {
          var m = (img.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
          if (m && m[1]) {
            if (a) a.setAttribute('onclick', "downloadImage('" + m[1] + "')");
            downloadItem.hidden = false;
          }
        }
      }
    }

    var topLine = document.getElementById('top-line');
    if (topLine) {
      topLine.hidden = (!copyItem || copyItem.hidden) && (!downloadItem || downloadItem.hidden);
    }

    /* ---- 定位:先显示后测量 ----
       用 offsetWidth/offsetHeight 而非 getBoundingClientRect():
       后者会被入场 transition 起点的 scale(0.92) 污染,
       测得尺寸偏小约 8%,边缘翻转阈值因此系统性失准;
       offset 尺寸是布局真值,与 transform 无关 */
    wrapper.classList.add('show');
    var mw = content.offsetWidth, mh = content.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    var flipX = e.clientX + mw > vw - pad;
    var flipY = e.clientY + mh > vh - pad;
    var left = flipX ? e.clientX - mw : e.clientX;
    var top = flipY ? e.clientY - mh : e.clientY;
    left = Math.max(pad, Math.min(left, vw - mw - pad));
    top = Math.max(pad, Math.min(top, vh - mh - pad));
    wrapper.style.left = left + 'px';
    wrapper.style.top = top + 'px';
    /* 从光标所在角落生长:翻转到哪边,原点就在哪个角 */
    wrapper.style.transformOrigin = (flipY ? 'bottom' : 'top') + ' ' + (flipX ? 'right' : 'left');

    soften(USE_PAGE_SOFTEN); /* 真玻璃模式下为 false,页面保持清澈 */
    hidePill(); /* 新一次会话:高亮清零,等待首次悬停原地浮现 */
  });

  document.addEventListener('click', function (e) {
    /* 点在菜单的空白衬边上不关闭(原生行为);点中条目(<a>)执行后正常关闭 */
    if (wrapper.contains(e.target) && !e.target.closest('a')) return;
    closeMenu();
  });
  /* ---- 键盘巡航:↑↓←→ 移动 / Home End 跳首尾 / Enter 触发 / Esc 关闭 ----
     ← = 上一项,→ = 下一项:在横排导航行里即字面的左右移动,
     在竖排菜单区自然等价于 ↑↓ */
  function visibleItems() {
    return Array.prototype.filter.call(
      content.querySelectorAll('a.vlts-menu, a.nav'),
      function (a) {
        var li = a.closest('li');
        return !(li && li.hidden) && a.offsetParent !== null;
      }
    );
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (!wrapper.classList.contains('show')) return;
    var items, i;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' ||
        e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      items = visibleItems();
      if (!items.length) return;
      i = items.indexOf(document.activeElement);
      var step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      var next = i === -1 ? (step > 0 ? 0 : items.length - 1)
                          : (i + step + items.length) % items.length;
      items[next].focus({ preventScroll: true });
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items = visibleItems();
      if (items.length) items[e.key === 'Home' ? 0 : items.length - 1].focus({ preventScroll: true });
    } else if (e.key === 'Enter') {
      if (document.activeElement && content.contains(document.activeElement)) {
        e.preventDefault();
        document.activeElement.click();
      }
    }
  });
  /* 滚动不关闭菜单(按站主偏好):页面滚动时,菜单钉在原位 */
  /* resize 只在宽度变化(真缩放/转屏)时关闭;
     纯高度变化是移动端地址栏伸缩,属于滚动的副产物,豁免 */
  var lastViewportW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastViewportW) {
      lastViewportW = window.innerWidth;
      closeMenu();
    }
  });
  window.addEventListener('blur', closeMenu);
})();

/* ==================== 反馈提示(操作结果 toast) ==================== */
function rmToast(text) {
  var tooltip = document.getElementById('tooltip-rightmenu-return');
  if (!tooltip) return;
  tooltip.textContent = text;
  tooltip.classList.add('show-tooltip');
  clearTimeout(rmToast._t);
  rmToast._t = setTimeout(function () {
    tooltip.classList.remove('show-tooltip');
  }, 1500);
}

/* ==================== 功能函数(供 RightMenu.html 的 onclick 调用) ==================== */

/* 平滑滚动到顶部 */
function scrollToTopSmooth() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* 平滑滚动到底部 */
function scrollToBottomSmooth() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

/* 复制选中文本 */
function copySelectedText() {
  var selectedText = window.getSelection().toString();
  if (selectedText) {
    navigator.clipboard.writeText(selectedText);
    rmToast('选中文本已复制到剪贴板');
  }
}

/* 下载图片 */
function downloadImage(imgsrc) {
  if (!imgsrc) return;
  var name = imgsrc.split('/').pop();
  fetch(imgsrc)
    .then(function (response) { return response.blob(); })
    .then(function (blob) {
      var a = document.createElement('a');
      var url = URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      rmToast('图片已下载');
    })
    .catch(function (error) { console.error('Error downloading image:', error); });
}

/* 复制当前页面链接 */
function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  rmToast('链接已复制到剪贴板');
}

/* 切换昼夜模式 */
function toggleColorMode() {
  var btn = document.getElementById('color-toggle-btn');
  if (btn) btn.click();
  var icon = document.getElementById('toggle-color-mode-icon');
  if (!icon) return;
  var scheme = document.documentElement.getAttribute('data-user-color-scheme');
  var dark = scheme === 'dark' ||
    (scheme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  icon.className = dark ? 'iconfont icon-dark' : 'iconfont icon-light';
}

/* 切换全屏背景 */
function toggleBackgroundMode() {
  var BackgroundMode = localStorage.getItem('BackgroundMode');
  if (BackgroundMode === 'false' || !BackgroundMode) {
    document.querySelector('#web_bg').style.backgroundImage =
      document.querySelector('.banner').style.background.split(' ')[0];
    document.querySelector('#banner').style.background = 'url()';
    document.querySelector('#banner .mask').style.backgroundColor = 'rgba(0,0,0,0)';
    document.getElementById('toggle-background-mode-icon').className = 'fa-solid fa-toggle-on';
    ['#toc', '.category-list'].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el) el.style.backgroundColor = 'var(--board-bg-color)';
    });
    localStorage.setItem('BackgroundMode', 'true');
  } else {
    document.querySelector('#banner').style.background =
      document.querySelector('#web_bg').style.backgroundImage + ' center center / cover no-repeat';
    document.querySelector('#web_bg').style.backgroundImage = 'url()';
    document.querySelector('#banner .mask').style.backgroundColor = 'rgba(0,0,0,0.3)';
    document.getElementById('toggle-background-mode-icon').className = 'fa-solid fa-toggle-off';
    ['#toc', '.category-list'].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el) el.style.removeProperty('background-color');
    });
    localStorage.setItem('BackgroundMode', 'false');
  }
}

/* ==================== 图标初始状态 ==================== */
(function () {
  var colorIcon = document.getElementById('toggle-color-mode-icon');
  if (colorIcon) {
    colorIcon.className = localStorage.getItem('DarkNightMode') === 'true'
      ? 'iconfont icon-light'
      : 'iconfont icon-dark';
  }
  var bgIcon = document.getElementById('toggle-background-mode-icon');
  if (bgIcon) {
    bgIcon.className = localStorage.getItem('BackgroundMode') === 'true'
      ? 'fa-solid fa-toggle-on'
      : 'fa-solid fa-toggle-off';
  }
})();
