/* ═══════════════════════════════════════════════════════════════
 * 看板娘资源本地缓存 · live2d-sw.js
 * ───────────────────────────────────────────────────────────────
 * 作用：把 /tools/live2d/ 下的模型、贴图、脚本缓存到本地。
 *       首次进工具页正常下载（约 1 MB），之后每次进来零网络请求，
 *       换过的衣服、切过的模型也会一并留下。
 *
 * 为什么需要它：GitHub Pages 只给静态文件 10 分钟的 max-age，
 *       超时后虽然靠 ETag 返回 304、不会重下正文，但仍要发十来个
 *       验证请求，弱网下就是明显的等待。缓存优先能彻底省掉这一步。
 *
 * 放置：source/tools/live2d-sw.js
 *       必须放在 /tools/ 下 —— Service Worker 的控制范围不能超出
 *       自身所在目录。
 *
 * 更新模型或改了 kit.js 之后：把下面的版本号 +1，旧缓存会自动清掉。
 * ═══════════════════════════════════════════════════════════════ */

const VERSION = 'v2';
const CACHE   = 'tk-live2d-' + VERSION;
const SCOPE   = '/tools/live2d/';

self.addEventListener('install', function (e) {
  self.skipWaiting();                       // 新版本立即接管，不等旧页面关闭
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        // 只清自己的旧版本，不动别人的缓存
        if (k.indexOf('tk-live2d-') === 0 && k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 只管同源的 /tools/live2d/ —— 工具页本身、ffmpeg 等一律放行
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf(SCOPE) !== 0) return;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        if (hit) return hit;               // 命中即返回，完全不碰网络
        return fetch(req).then(function (res) {
          // 只缓存成功的完整响应；206 之类的部分响应不能进缓存
          if (res && res.status === 200 && res.type !== 'opaque') {
            cache.put(req, res.clone());
          }
          return res;
        });
      });
    }).catch(function () { return fetch(req); })   // 缓存出问题就走网络
  );
});
