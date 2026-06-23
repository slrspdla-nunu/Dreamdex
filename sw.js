/* Dreamdex 서비스워커 — 앱 셸 캐시 + 오프라인
 * 전략: same-origin GET은 network-first(→ 실패 시 cache). 버전 쿼리(?v=)가 붙으므로
 *       온라인이면 항상 최신을 받고, 오프라인이면 마지막 캐시를 제공한다.
 *       내비게이션 실패 시 캐시된 index.html 로 폴백(해시 라우팅 SPA).
 *       Chart.js(교차출처 CDN)는 캐시하지 않음 → 오프라인 시 charts.js 폴백 막대그래프 동작.
 */
var CACHE = 'dreamdex-v1';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './image/logo.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 핵심 셸만 best-effort 프리캐시 (실패해도 설치 진행)
      return Promise.all(CORE.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 교차출처(CDN 등)는 패스

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        // 내비게이션 요청이면 셸로 폴백
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
