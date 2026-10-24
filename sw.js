/* 「坚持」Service Worker —— 改代码后把版本号 +1，已安装用户下次联网即自动更新 */
const CACHE = 'jianchi-v13';
/* 预缓存：应用外壳 + 字体规则 + 界面实际用到的字体分片（首次安装即可离线用） */
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/lxgwwenkai-light.css',
  './fonts/files/lxgwwenkai-light-subset-101.woff2',
  './fonts/files/lxgwwenkai-light-subset-106.woff2',
  './fonts/files/lxgwwenkai-light-subset-107.woff2',
  './fonts/files/lxgwwenkai-light-subset-109.woff2',
  './fonts/files/lxgwwenkai-light-subset-111.woff2',
  './fonts/files/lxgwwenkai-light-subset-113.woff2',
  './fonts/files/lxgwwenkai-light-subset-114.woff2',
  './fonts/files/lxgwwenkai-light-subset-115.woff2',
  './fonts/files/lxgwwenkai-light-subset-116.woff2',
  './fonts/files/lxgwwenkai-light-subset-117.woff2',
  './fonts/files/lxgwwenkai-light-subset-118.woff2',
  './fonts/files/lxgwwenkai-light-subset-119.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () { /* 单个资源失败不阻断安装 */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // 页面导航：优先网络，失败回落缓存（保证离线可开）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  // 其他资源：缓存优先（字体、图标等），后台更新
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) {
        fetch(req).then(function (res) {
          if (res && res.status === 200) {
            caches.open(CACHE).then(function (c) { c.put(req, res); });
          }
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
    })
  );
});
