/* ============================================================
   Fluid Search · Apple Style —— 交互逻辑
   1. 大字占位（重置 placeholder）
   2. 注入「快速链接」（输入为空时显示，一打字切到结果）
   3. 弹窗落下时的错峰入场动画
   4. ↑/↓ 在输入框与快速链接之间移动
   与 fluid-search-apple.css 配套。不依赖 jQuery。
   ============================================================ */
(function () {
    'use strict';

    /* ── 可改配置 ─────────────────────────────────────────────
       QUICK_LINKS：请对照你导航里的真实页面改 href，避免死链
       （Fluid 常见：/ 、/categories/ 、/archives/ 、/tags/ 、/about/）
       ──────────────────────────────────────────────────────── */
    var QUICK_LINKS = [
        { text: '兔子窝', href: '/' },
        { text: '分类',   href: '/categories/' },
        { text: '归档',   href: '/archives/' },
        { text: '标签',   href: '/tags/' },
        { text: '介绍',   href: '/about/' }
    ];
    var PLACEHOLDER = '搜索兔子窝';
    var QUICK_TITLE = '快速链接';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var modal = document.getElementById('modalSearch');
        if (!modal) return;

        var body = modal.querySelector('.modal-body');
        var input = modal.querySelector('#local-search-input');
        var result = modal.querySelector('#local-search-result');
        if (!body || !input) return;

        // 1. 大字占位
        input.setAttribute('placeholder', PLACEHOLDER);

        // 2. 注入快速链接
        var ql = document.createElement('div');
        ql.className = 'apple-quick-links';

        var title = document.createElement('div');
        title.className = 'aql-title';
        title.textContent = QUICK_TITLE;
        ql.appendChild(title);

        QUICK_LINKS.forEach(function (item, i) {
            var a = document.createElement('a');
            a.className = 'aql-item';
            a.href = item.href;
            a.textContent = item.text;
            a.style.setProperty('--d', (0.05 + i * 0.04).toFixed(2) + 's');
            ql.appendChild(a);
        });

        if (result && result.parentNode === body) {
            body.insertBefore(ql, result);
        } else {
            body.appendChild(ql);
        }

        // 输入为空 → 显示快速链接；一打字 → 交给 Fluid 结果
        function sync() {
            ql.style.display = input.value.trim().length ? 'none' : '';
        }
        input.addEventListener('input', sync);
        sync();

        // 结果异步变化时兜底同步（防止某些主题版本不触发 input）
        if (result) {
            new MutationObserver(sync).observe(result, { childList: true });
        }

        // 3. 侦测弹窗开合（监听 class，不依赖 Bootstrap 事件/jQuery）
        var wasOpen = false;
        new MutationObserver(function () {
            var open = modal.classList.contains('show');
            if (open && !wasOpen) onOpen();
            wasOpen = open;
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });

        function onOpen() {
            sync();
            // 重放入场动画
            ql.classList.remove('aql-in');
            void ql.offsetWidth; // 强制重排
            ql.classList.add('aql-in');
            // 聚焦兜底（Fluid 一般已聚焦）
            setTimeout(function () {
                try { input.focus(); } catch (e) {}
            }, 60);
        }

        // 4. ↑/↓ 在输入框与快速链接之间移动
        modal.addEventListener('keydown', function (e) {
            if (ql.style.display === 'none') return; // 有结果时不接管
            var items = Array.prototype.slice.call(ql.querySelectorAll('.aql-item'));
            if (!items.length) return;
            var idx = items.indexOf(document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[idx < 0 ? 0 : Math.min(idx + 1, items.length - 1)].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx <= 0) input.focus();
                else items[idx - 1].focus();
            }
        });
    });
})();
