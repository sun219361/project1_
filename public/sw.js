// 모여봐 Service Worker v2.0
// 기능: 백그라운드 위치 추적, SOS 알림, 오프라인 지원

const SW_VERSION = 'v2.0';
const CACHE_NAME = 'meetup-cache-v2';
const LOC_CACHE = 'meetup-loc-v2';

let authToken = null;
let currentUserId = null;
let bgLocTimer = null;
let baseUrl = self.location.origin;

// ── 설치 ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/manifest.json', '/icon-192.png']).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ── 활성화 ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== LOC_CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── 메인 앱 → SW 메시지 ───────────────────────────────────────
self.addEventListener('message', (event) => {
  const data = event.data || {};

  switch (data.type) {
    case 'INIT_LOC':
      authToken = data.token;
      currentUserId = data.userId;
      startBgLoc();
      break;
    case 'UPDATE_LOC':
      // 앱이 포그라운드에서 직접 위치 보냄 → 캐시 저장
      if (data.lat && data.lng) {
        saveLocToCache(data.lat, data.lng, data.accuracy || 20);
      }
      break;
    case 'STOP_LOC':
      stopBgLoc();
      authToken = null;
      break;
    case 'LOGOUT':
      stopBgLoc();
      authToken = null;
      currentUserId = null;
      break;
  }
});

// ── 백그라운드 위치 전송 ──────────────────────────────────────
function startBgLoc() {
  stopBgLoc();
  // 앱 꺼진 상태: 60초마다 마지막 캐시된 위치 재전송
  bgLocTimer = setInterval(sendCachedLocation, 60000);
}

function stopBgLoc() {
  if (bgLocTimer) { clearInterval(bgLocTimer); bgLocTimer = null; }
}

async function saveLocToCache(lat, lng, accuracy) {
  try {
    const cache = await caches.open(LOC_CACHE);
    await cache.put('/last-location', new Response(
      JSON.stringify({ lat, lng, accuracy, savedAt: Date.now() }),
      { headers: { 'Content-Type': 'application/json' } }
    ));
  } catch (e) {}
}

async function getLocFromCache() {
  try {
    const cache = await caches.open(LOC_CACHE);
    const res = await cache.match('/last-location');
    if (!res) return null;
    const data = await res.json();
    // 10분 이내 캐시만 유효
    if (Date.now() - data.savedAt > 10 * 60 * 1000) return null;
    return data;
  } catch (e) { return null; }
}

async function sendCachedLocation() {
  if (!authToken) return;
  // 클라이언트가 활성 상태면 이미 앱에서 처리 중 → 스킵
  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  const hasActiveClient = clientList.some(c => c.visibilityState === 'visible');
  if (hasActiveClient) return;

  const loc = await getLocFromCache();
  if (!loc) return;

  try {
    await fetch(baseUrl + '/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy })
    });
  } catch (e) {
    // 네트워크 없으면 Background Sync 등록
    if ('SyncManager' in self) {
      try { await self.registration.sync.register('sync-location'); } catch (e2) {}
    }
  }
}

// ── Background Sync ────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(sendCachedLocation());
  }
});

// ── fetch 인터셉트 ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 위치 업로드 요청 → 위치 데이터 캐시에 저장
  if (url.pathname === '/api/location' && event.request.method === 'POST') {
    event.waitUntil(
      event.request.clone().json().then(body => {
        if (body.lat && body.lng) {
          saveLocToCache(body.lat, body.lng, body.accuracy || 20);
        }
      }).catch(() => {})
    );
    // 실제 요청은 그대로 통과
    return;
  }

  // 정적 자원 캐시 (manifest, icons)
  if (url.pathname.match(/\.(png|json|webmanifest)$/) && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => cached))
    );
  }
});

// ── 푸시 알림 (SOS) ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: '🆘 SOS', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || '🆘 SOS 긴급', {
      body: data.body || 'SOS 긴급 알림이 도착했습니다',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      tag: 'sos-' + (data.sosId || Date.now()),
      requireInteraction: true,
      data: { sosId: data.sosId, url: '/' },
      actions: [
        { action: 'open', title: '✅ 확인하기' },
        { action: 'dismiss', title: '닫기' }
      ]
    })
  );
});

// ── 알림 클릭 ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 이미 열려 있는 탭 찾기
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
