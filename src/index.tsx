import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ─── 위치 공유 API ───────────────────────────────────────
// 위치 업데이트 (POST /api/location)
app.post('/api/location', async (c) => {
  const { roomId, userId, userName, lat, lng, timestamp } = await c.req.json()
  if (!roomId || !userId || !lat || !lng) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  const key = `location:${roomId}:${userId}`
  const data = { userId, userName: userName || '익명', lat, lng, timestamp: timestamp || Date.now() }
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 3600 })
  return c.json({ success: true })
})

// 방의 모든 위치 조회 (GET /api/location/:roomId)
app.get('/api/location/:roomId', async (c) => {
  const roomId = c.req.param('roomId')
  const prefix = `location:${roomId}:`
  const list = await c.env.KV.list({ prefix })
  const locations = []
  for (const key of list.keys) {
    const val = await c.env.KV.get(key.name)
    if (val) locations.push(JSON.parse(val))
  }
  return c.json({ locations })
})

// ─── 채팅 API ───────────────────────────────────────────
// 메시지 전송 (POST /api/chat)
app.post('/api/chat', async (c) => {
  const { roomId, userId, userName, message, type } = await c.req.json()
  if (!roomId || !userId || !message) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  const msgId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const key = `chat:${roomId}:${msgId}`
  const data = {
    msgId,
    userId,
    userName: userName || '익명',
    message,
    type: type || 'text', // text | sos | system | location
    timestamp: Date.now()
  }
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 86400 })
  return c.json({ success: true, msgId })
})

// 채팅 메시지 조회 (GET /api/chat/:roomId)
app.get('/api/chat/:roomId', async (c) => {
  const roomId = c.req.param('roomId')
  const since = Number(c.req.query('since') || '0')
  const prefix = `chat:${roomId}:`
  const list = await c.env.KV.list({ prefix })
  const messages = []
  for (const key of list.keys) {
    const val = await c.env.KV.get(key.name)
    if (val) {
      const msg = JSON.parse(val)
      if (msg.timestamp > since) messages.push(msg)
    }
  }
  messages.sort((a: any, b: any) => a.timestamp - b.timestamp)
  return c.json({ messages: messages.slice(-100) })
})

// ─── 방 관리 API ─────────────────────────────────────────
// 방 생성/참가 (POST /api/room/join)
app.post('/api/room/join', async (c) => {
  const { roomId, userId, userName } = await c.req.json()
  if (!roomId || !userId) return c.json({ error: 'Missing fields' }, 400)
  const key = `room:${roomId}:member:${userId}`
  const data = { userId, userName: userName || '익명', joinedAt: Date.now() }
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 86400 })

  // 시스템 메시지
  const msgId = `${Date.now()}_sys`
  await c.env.KV.put(`chat:${roomId}:${msgId}`, JSON.stringify({
    msgId, userId: 'system', userName: '시스템',
    message: `${userName || '익명'}님이 입장했습니다.`,
    type: 'system', timestamp: Date.now()
  }), { expirationTtl: 86400 })

  return c.json({ success: true, roomId })
})

// 방 멤버 조회 (GET /api/room/:roomId/members)
app.get('/api/room/:roomId/members', async (c) => {
  const roomId = c.req.param('roomId')
  const prefix = `room:${roomId}:member:`
  const list = await c.env.KV.list({ prefix })
  const members = []
  for (const key of list.keys) {
    const val = await c.env.KV.get(key.name)
    if (val) members.push(JSON.parse(val))
  }
  return c.json({ members })
})

// ─── 약속 장소 API ───────────────────────────────────────
// 약속 장소 지정 (POST /api/appointment)
app.post('/api/appointment', async (c) => {
  const { roomId, userId, userName, placeName, lat, lng } = await c.req.json()
  if (!roomId || !lat || !lng) return c.json({ error: 'Missing fields' }, 400)
  const key = `appointment:${roomId}`
  const data = { placeName: placeName || '약속장소', lat, lng, setBy: userName || '익명', setAt: Date.now() }
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 86400 })

  // 시스템 메시지
  const msgId = `${Date.now()}_apt`
  await c.env.KV.put(`chat:${roomId}:${msgId}`, JSON.stringify({
    msgId, userId: 'system', userName: '시스템',
    message: `${userName || '익명'}님이 약속장소를 "${placeName || '약속장소'}"(으)로 지정했습니다.`,
    type: 'system', timestamp: Date.now()
  }), { expirationTtl: 86400 })

  return c.json({ success: true })
})

// 약속 장소 조회 (GET /api/appointment/:roomId)
app.get('/api/appointment/:roomId', async (c) => {
  const roomId = c.req.param('roomId')
  const val = await c.env.KV.get(`appointment:${roomId}`)
  if (!val) return c.json({ appointment: null })
  return c.json({ appointment: JSON.parse(val) })
})

// ─── SOS API ─────────────────────────────────────────────
app.post('/api/sos', async (c) => {
  const { roomId, userId, userName, lat, lng } = await c.req.json()
  if (!roomId || !userId) return c.json({ error: 'Missing fields' }, 400)
  const msgId = `${Date.now()}_sos`
  const data = {
    msgId, userId, userName: userName || '익명',
    message: `🆘 SOS! ${userName || '익명'}님이 도움을 요청합니다! (위도: ${lat?.toFixed(5)}, 경도: ${lng?.toFixed(5)})`,
    type: 'sos', lat, lng, timestamp: Date.now()
  }
  await c.env.KV.put(`chat:${roomId}:${msgId}`, JSON.stringify(data), { expirationTtl: 86400 })
  return c.json({ success: true })
})

// ─── 대중교통 조회 API (ODsay 프록시) ────────────────────
app.get('/api/transit', async (c) => {
  const { sx, sy, ex, ey } = c.req.query()
  if (!sx || !sy || !ex || !ey) return c.json({ error: 'Missing coords' }, 400)

  // ODsay API Key는 환경변수에서 (없으면 데모 응답)
  const apiKey = (c.env as any).ODSAY_API_KEY
  if (!apiKey || apiKey === 'demo') {
    return c.json({
      demo: true,
      result: {
        path: [
          {
            pathType: 1,
            info: { totalTime: 45, payment: 1400, busTransitCount: 1, subwayTransitCount: 1 },
            subPath: [
              { trafficType: 2, sectionTime: 20, lane: [{ name: '2호선', subwayCode: 2, subwayCityCode: 1000 }], startName: '출발지', endName: '환승역' },
              { trafficType: 1, sectionTime: 25, lane: [{ busNo: '147', type: 1 }], startName: '환승역', endName: '목적지' }
            ]
          }
        ]
      }
    })
  }

  try {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${encodeURIComponent(apiKey)}`
    const res = await fetch(url)
    const data = await res.json()
    return c.json(data)
  } catch (e) {
    return c.json({ error: 'Transit API error' }, 500)
  }
})

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// SPA 라우팅 - 메인 HTML
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>모여봐 - 한국형 위치공유 앱</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { -webkit-tap-highlight-color: transparent; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; overscroll-behavior: none; }
    .tab-btn.active { color: #6366f1; border-top: 3px solid #6366f1; }
    .sos-btn { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); animation: pulse-red 2s infinite; }
    @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
    .msg-bubble { max-width: 70%; word-break: break-word; }
    .msg-sos { background: #fef2f2 !important; border: 2px solid #ef4444 !important; animation: flash-sos 0.5s infinite alternate; }
    @keyframes flash-sos { from{background:#fef2f2} to{background:#fee2e2} }
    .msg-system { text-align: center; font-size: 12px; color: #9ca3af; padding: 4px 0; }
    .slide-up { animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    .map-container { position: relative; width: 100%; }
    #kakaoMap { width: 100%; height: 100%; }
    .bottom-sheet { background: white; border-radius: 20px 20px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); }
    .member-marker { width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; overflow: hidden; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 600; color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .loading-spinner { border: 3px solid #e5e7eb; border-top: 3px solid #6366f1; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    input, textarea { font-size: 16px !important; }
    .transit-card { border-left: 4px solid #6366f1; }
    .transit-bus { color: #16a34a; }
    .transit-subway { color: #2563eb; }
  </style>
</head>
<body class="bg-gray-50 h-screen flex flex-col overflow-hidden">

<!-- 앱 래퍼 -->
<div id="app" class="flex flex-col h-full">

  <!-- ===== 로그인/방 화면 ===== -->
  <div id="screen-login" class="flex flex-col h-full bg-gradient-to-br from-indigo-500 to-purple-600 p-6 justify-center items-center">
    <div class="text-center mb-8">
      <div class="text-6xl mb-3">📍</div>
      <h1 class="text-3xl font-bold text-white">모여봐</h1>
      <p class="text-indigo-200 mt-2 text-sm">친구들과 위치 공유, 약속 조율</p>
    </div>
    <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <div class="mb-4">
        <label class="block text-xs font-semibold text-gray-500 mb-1">내 이름</label>
        <input id="input-username" type="text" placeholder="이름을 입력하세요" maxlength="10"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-400 text-gray-800" />
      </div>
      <div class="mb-4">
        <label class="block text-xs font-semibold text-gray-500 mb-1">방 코드</label>
        <input id="input-roomid" type="text" placeholder="방 코드 (예: friends123)" maxlength="20"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-400 text-gray-800 uppercase" />
      </div>
      <button onclick="joinRoom()" class="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl active:bg-indigo-700 transition-colors text-base">
        입장하기
      </button>
      <button onclick="createRandomRoom()" class="w-full mt-3 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl active:bg-gray-200 transition-colors text-sm">
        새 방 만들기
      </button>
    </div>
    <p class="text-indigo-200 text-xs mt-4 text-center">같은 방 코드로 입장하면 위치가 공유됩니다</p>
  </div>

  <!-- ===== 메인 앱 화면 ===== -->
  <div id="screen-main" class="hidden flex-col h-full">
    <!-- 상단 헤더 -->
    <div class="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between safe-area-top flex-shrink-0">
      <div>
        <p class="text-xs text-indigo-300">방 코드</p>
        <p id="header-roomid" class="font-bold text-lg leading-tight"></p>
      </div>
      <div class="flex items-center gap-3">
        <div id="member-count" class="bg-indigo-500 px-3 py-1 rounded-full text-xs font-semibold">👥 1명</div>
        <button onclick="showShareModal()" class="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-share-alt text-sm"></i>
        </button>
        <button onclick="leaveRoom()" class="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-sign-out-alt text-sm"></i>
        </button>
      </div>
    </div>

    <!-- 탭 콘텐츠 영역 -->
    <div class="flex-1 overflow-hidden relative">

      <!-- 🗺️ 지도 탭 -->
      <div id="tab-map" class="h-full flex flex-col">
        <div class="flex-1 relative map-container">
          <div id="kakaoMap" class="absolute inset-0"></div>
          <!-- 지도 위 플로팅 버튼들 -->
          <div class="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button onclick="centerMyLocation()" class="bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center active:bg-gray-100">
              <i class="fas fa-crosshairs text-indigo-500"></i>
            </button>
            <button onclick="centerAllMembers()" class="bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center active:bg-gray-100">
              <i class="fas fa-users text-indigo-500 text-sm"></i>
            </button>
          </div>
          <!-- SOS 버튼 -->
          <div class="absolute bottom-4 right-4 z-10">
            <button onclick="sendSOS()" class="sos-btn w-16 h-16 rounded-full text-white font-black text-lg shadow-xl flex flex-col items-center justify-center">
              <i class="fas fa-exclamation text-xl"></i>
              <span class="text-xs font-bold">SOS</span>
            </button>
          </div>
          <!-- 약속장소 배너 -->
          <div id="apt-banner" class="hidden absolute top-3 left-3 right-16 z-10 bg-white rounded-xl shadow-lg p-2 flex items-center gap-2">
            <span class="text-lg">📌</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-500">약속 장소</p>
              <p id="apt-banner-name" class="text-sm font-bold text-gray-800 truncate"></p>
            </div>
            <button onclick="goToAppointment()" class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-semibold flex-shrink-0">길찾기</button>
          </div>
        </div>
        <!-- 멤버 위치 목록 -->
        <div id="member-list-panel" class="bg-white border-t border-gray-100 px-4 py-2 flex gap-3 overflow-x-auto flex-shrink-0" style="min-height:70px">
          <div class="text-gray-400 text-xs flex items-center">위치 로딩 중...</div>
        </div>
      </div>

      <!-- 💬 채팅 탭 -->
      <div id="tab-chat" class="hidden h-full flex flex-col bg-gray-50">
        <div id="chat-messages" class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          <div class="msg-system">채팅방에 오신 걸 환영합니다 👋</div>
        </div>
        <div class="bg-white border-t border-gray-200 px-3 py-2 flex gap-2 flex-shrink-0">
          <button onclick="shareMyLocationInChat()" class="bg-indigo-100 text-indigo-600 px-3 py-2 rounded-xl text-sm font-semibold flex-shrink-0">
            <i class="fas fa-map-marker-alt"></i>
          </button>
          <input id="chat-input" type="text" placeholder="메시지를 입력하세요..." maxlength="200"
            class="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 bg-gray-50 text-sm" />
          <button onclick="sendChat()" class="bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold text-sm active:bg-indigo-700">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- 📌 약속 탭 -->
      <div id="tab-appt" class="hidden h-full flex flex-col bg-gray-50 overflow-y-auto">
        <div class="p-4">
          <!-- 현재 약속장소 -->
          <div id="current-appt-card" class="hidden bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-gray-800">📌 현재 약속장소</h3>
              <span id="appt-setby" class="text-xs text-gray-400"></span>
            </div>
            <p id="appt-place-name" class="text-lg font-bold text-indigo-600 mb-3"></p>
            <div class="flex gap-2">
              <button onclick="showTransitPanel()" class="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <i class="fas fa-subway"></i> 대중교통 조회
              </button>
              <button onclick="focusAppointmentOnMap()" class="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <i class="fas fa-map"></i> 지도보기
              </button>
            </div>
          </div>

          <!-- 약속장소 설정 -->
          <div class="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 class="font-bold text-gray-800 mb-3">📍 약속장소 지정</h3>
            <p class="text-xs text-gray-500 mb-3">지도에서 원하는 위치를 탭하거나, 장소명을 검색하세요</p>
            <div class="flex gap-2 mb-3">
              <input id="place-search-input" type="text" placeholder="장소 검색 (예: 강남역)" 
                class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <button onclick="searchPlace()" class="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">검색</button>
            </div>
            <div id="place-search-results" class="hidden mb-3 border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto"></div>
            <div id="selected-place-info" class="hidden bg-indigo-50 rounded-xl p-3 mb-3">
              <p class="text-xs text-indigo-400">선택된 장소</p>
              <p id="selected-place-name" class="font-bold text-indigo-700"></p>
              <p id="selected-place-addr" class="text-xs text-indigo-500"></p>
            </div>
            <button onclick="setAppointment()" class="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm active:bg-indigo-700">
              📌 이 장소로 약속 지정
            </button>
          </div>

          <!-- 중간 지점 찾기 -->
          <div class="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 class="font-bold text-gray-800 mb-2">🎯 중간 지점 찾기</h3>
            <p class="text-xs text-gray-500 mb-3">멤버들의 현재 위치 기반으로 중간 지점을 계산합니다</p>
            <button onclick="findMidpoint()" class="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm active:bg-green-700">
              🎯 중간 지점 계산하기
            </button>
            <div id="midpoint-result" class="hidden mt-3 bg-green-50 rounded-xl p-3">
              <p class="text-xs text-green-600 font-semibold">중간 지점</p>
              <p id="midpoint-name" class="font-bold text-green-800 mt-1"></p>
              <button onclick="setMidpointAsAppointment()" class="mt-2 w-full bg-green-500 text-white py-2 rounded-xl text-sm font-semibold">
                이 장소를 약속장소로 지정
              </button>
            </div>
          </div>
        </div>

        <!-- 대중교통 패널 -->
        <div id="transit-panel" class="hidden mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-800">🚇 대중교통 조회</h3>
            <button onclick="hideTransitPanel()" class="text-gray-400 text-sm">닫기</button>
          </div>
          <div id="transit-loading" class="hidden p-6 flex justify-center"><div class="loading-spinner"></div></div>
          <div id="transit-results" class="p-4"></div>
        </div>
      </div>

    </div>

    <!-- 하단 탭바 -->
    <div class="flex-shrink-0 bg-white border-t border-gray-200 flex safe-area-bottom">
      <button onclick="switchTab('map')" id="tabBtn-map" class="tab-btn active flex-1 py-3 flex flex-col items-center gap-1 text-gray-400">
        <i class="fas fa-map-marked-alt text-lg"></i>
        <span class="text-xs font-semibold">지도</span>
      </button>
      <button onclick="switchTab('chat')" id="tabBtn-chat" class="tab-btn flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 relative">
        <i class="fas fa-comment-dots text-lg"></i>
        <span class="text-xs font-semibold">채팅</span>
        <span id="chat-badge" class="hidden absolute top-2 right-4 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">!</span>
      </button>
      <button onclick="switchTab('appt')" id="tabBtn-appt" class="tab-btn flex-1 py-3 flex flex-col items-center gap-1 text-gray-400">
        <i class="fas fa-map-pin text-lg"></i>
        <span class="text-xs font-semibold">약속</span>
      </button>
    </div>
  </div>

</div><!-- /#app -->

<!-- 공유 모달 -->
<div id="share-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
  <div class="bottom-sheet w-full p-6 slide-up">
    <h3 class="font-bold text-gray-800 text-lg mb-1">친구 초대</h3>
    <p class="text-gray-500 text-sm mb-4">아래 코드를 친구에게 알려주세요</p>
    <div class="bg-indigo-50 rounded-xl p-4 flex items-center justify-between mb-4">
      <span id="share-code" class="text-2xl font-black text-indigo-600 tracking-wider"></span>
      <button onclick="copyRoomCode()" class="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">복사</button>
    </div>
    <button onclick="hideShareModal()" class="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold">닫기</button>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="toast hidden"></div>

<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_APP_KEY&libraries=services"></script>
<script>
// ════════════════════════════════════════════════════
//  전역 상태
// ════════════════════════════════════════════════════
let state = {
  roomId: null,
  userId: null,
  userName: null,
  currentLat: null,
  currentLng: null,
  map: null,
  markers: {},
  appointmentMarker: null,
  midpointData: null,
  lastChatTime: 0,
  selectedPlace: null,
  pollInterval: null,
  locationInterval: null,
  appointment: null,
  members: []
}

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']
const EMOJIS = ['😊','😎','🐻','🦊','🐱','🐶','🐸','🐧']

function getUserColor(uid) {
  let h = 0; for(let c of uid) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}
function getUserEmoji(uid) {
  let h = 0; for(let c of uid) h = (h * 31 + c.charCodeAt(0)) % EMOJIS.length
  return EMOJIS[h]
}

// ════════════════════════════════════════════════════
//  초기화
// ════════════════════════════════════════════════════
function initApp() {
  const saved = localStorage.getItem('meetup_session')
  if (saved) {
    try {
      const s = JSON.parse(saved)
      document.getElementById('input-username').value = s.userName || ''
      document.getElementById('input-roomid').value = s.roomId || ''
    } catch(e) {}
  }
}

function createRandomRoom() {
  const adjectives = ['신나는','즐거운','따뜻한','반가운','멋진','귀여운']
  const nouns = ['판다','여우','토끼','고양이','강아지','곰']
  const rand = adjectives[Math.floor(Math.random()*adjectives.length)] + nouns[Math.floor(Math.random()*nouns.length)]
  document.getElementById('input-roomid').value = rand
}

async function joinRoom() {
  const userName = document.getElementById('input-username').value.trim()
  const roomId = document.getElementById('input-roomid').value.trim().replace(/\\s/g,'')
  if (!userName) { showToast('이름을 입력해주세요', 'error'); return }
  if (!roomId) { showToast('방 코드를 입력해주세요', 'error'); return }
  if (roomId.length < 3) { showToast('방 코드는 3자 이상이어야 합니다', 'error'); return }

  state.roomId = roomId.toLowerCase()
  state.userId = 'user_' + Math.random().toString(36).substr(2, 8)
  state.userName = userName

  localStorage.setItem('meetup_session', JSON.stringify({ userName, roomId: state.roomId }))

  try {
    await fetch('/api/room/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: state.roomId, userId: state.userId, userName })
    })
  } catch(e) { console.warn('Join API failed (KV not configured)', e) }

  document.getElementById('screen-login').classList.add('hidden')
  document.getElementById('screen-main').classList.remove('hidden')
  document.getElementById('screen-main').classList.add('flex')
  document.getElementById('header-roomid').textContent = state.roomId.toUpperCase()
  document.getElementById('share-code').textContent = state.roomId.toUpperCase()

  initMap()
  startPolling()
  getCurrentLocation()
}

function leaveRoom() {
  if (!confirm('방에서 나가시겠습니까?')) return
  clearInterval(state.pollInterval)
  clearInterval(state.locationInterval)
  state = { ...state, roomId: null, userId: null, markers: {}, map: null }
  document.getElementById('screen-main').classList.add('hidden')
  document.getElementById('screen-main').classList.remove('flex')
  document.getElementById('screen-login').classList.remove('hidden')
}

// ════════════════════════════════════════════════════
//  카카오맵 초기화
// ════════════════════════════════════════════════════
function initMap() {
  if (typeof kakao === 'undefined' || !kakao.maps) {
    document.getElementById('kakaoMap').innerHTML = \`
      <div class="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center bg-indigo-50">
        <div class="text-5xl mb-3">🗺️</div>
        <p class="font-bold text-indigo-700 text-base">카카오맵 API 키 필요</p>
        <p class="text-xs text-gray-500 mt-2">카카오 개발자 콘솔에서 JavaScript 앱 키를 발급 받아<br/>index.tsx의 YOUR_KAKAO_APP_KEY를 교체해주세요</p>
        <div class="mt-4 bg-white rounded-xl p-3 text-left text-xs text-gray-600 w-full max-w-xs">
          <p class="font-semibold mb-1">✅ 나머지 기능은 모두 정상 작동합니다:</p>
          <p>• 💬 채팅</p><p>• 📌 약속장소 지정</p><p>• 🚇 대중교통 조회</p><p>• 🆘 SOS 알람</p>
        </div>
      </div>\`
    return
  }
  const center = new kakao.maps.LatLng(37.5665, 126.9780)
  state.map = new kakao.maps.Map(document.getElementById('kakaoMap'), { center, level: 5 })

  kakao.maps.event.addListener(state.map, 'click', (e) => {
    const latlng = e.latLng
    state.selectedPlace = { name: '지도에서 선택한 위치', lat: latlng.getLat(), lng: latlng.getLng(), address: '' }
    showSelectedPlace()
  })
}

function makeMarkerContent(userName, color, emoji) {
  return \`<div style="background:\${color};width:44px;height:44px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;">
    \${emoji}
    <div style="position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;font-size:10px;padding:2px 6px;border-radius:8px;white-space:nowrap;font-weight:600;">\${userName}</div>
  </div>\`
}

function updateMarker(userId, userName, lat, lng) {
  if (!state.map || typeof kakao === 'undefined') return
  const pos = new kakao.maps.LatLng(lat, lng)
  const color = getUserColor(userId)
  const emoji = getUserEmoji(userId)
  const content = makeMarkerContent(userName, color, emoji)
  if (state.markers[userId]) {
    state.markers[userId].setPosition(pos)
    state.markers[userId].setContent(document.createRange().createContextualFragment(content).firstChild)
  } else {
    const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 1.2 })
    overlay.setMap(state.map)
    state.markers[userId] = overlay
  }
}

function centerMyLocation() {
  if (!state.map || !state.currentLat) { showToast('현재 위치를 가져오는 중...', 'info'); return }
  state.map.setCenter(new kakao.maps.LatLng(state.currentLat, state.currentLng))
  state.map.setLevel(4)
}

function centerAllMembers() {
  if (!state.map || !state.currentLat) return
  const locs = Object.values(state.markers)
  if (!locs.length) { centerMyLocation(); return }
  const bounds = new kakao.maps.LatLngBounds()
  for (const key in state.markers) {
    const pos = state.markers[key].getPosition()
    bounds.extend(pos)
  }
  state.map.setBounds(bounds, 60, 60, 60, 60)
}

function focusAppointmentOnMap() {
  if (!state.appointment || !state.map) return
  state.map.setCenter(new kakao.maps.LatLng(state.appointment.lat, state.appointment.lng))
  state.map.setLevel(4)
  switchTab('map')
}

// ════════════════════════════════════════════════════
//  위치 서비스
// ════════════════════════════════════════════════════
function getCurrentLocation() {
  if (!navigator.geolocation) { showToast('위치 서비스를 지원하지 않는 브라우저입니다', 'error'); return }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.currentLat = pos.coords.latitude
      state.currentLng = pos.coords.longitude
      uploadLocation()
      if (state.map) state.map.setCenter(new kakao.maps.LatLng(state.currentLat, state.currentLng))
    },
    (err) => showToast('위치 권한을 허용해주세요', 'error'),
    { enableHighAccuracy: true, timeout: 10000 }
  )

  // 30초마다 위치 업데이트
  state.locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.currentLat = pos.coords.latitude
        state.currentLng = pos.coords.longitude
        uploadLocation()
      },
      () => {}, { enableHighAccuracy: false, timeout: 8000 }
    )
  }, 30000)
}

async function uploadLocation() {
  if (!state.currentLat || !state.roomId) return
  try {
    await fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: state.roomId, userId: state.userId,
        userName: state.userName, lat: state.currentLat, lng: state.currentLng
      })
    })
  } catch(e) {}
}

async function fetchLocations() {
  if (!state.roomId) return
  try {
    const res = await fetch(\`/api/location/\${state.roomId}\`)
    const { locations } = await res.json()
    updateMemberPanel(locations)
    for (const loc of locations) {
      updateMarker(loc.userId, loc.userName, loc.lat, loc.lng)
    }
  } catch(e) {}
}

function updateMemberPanel(locations) {
  const panel = document.getElementById('member-list-panel')
  const countEl = document.getElementById('member-count')
  if (!locations || !locations.length) {
    panel.innerHTML = '<div class="text-gray-400 text-xs flex items-center">위치 정보 없음</div>'
    return
  }
  countEl.textContent = \`👥 \${locations.length}명\`
  panel.innerHTML = locations.map(loc => {
    const color = getUserColor(loc.userId)
    const emoji = getUserEmoji(loc.userId)
    const isMe = loc.userId === state.userId
    return \`<div class="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer" onclick="focusMember('\${loc.userId}',\${loc.lat},\${loc.lng})">
      <div style="background:\${color}" class="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-white shadow">\${emoji}</div>
      <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">\${isMe ? '나' : loc.userName}</p>
    </div>\`
  }).join('')
}

function focusMember(userId, lat, lng) {
  if (!state.map || typeof kakao === 'undefined') return
  state.map.setCenter(new kakao.maps.LatLng(lat, lng))
  state.map.setLevel(4)
  switchTab('map')
}

// ════════════════════════════════════════════════════
//  채팅
// ════════════════════════════════════════════════════
async function fetchChat() {
  if (!state.roomId) return
  try {
    const res = await fetch(\`/api/chat/\${state.roomId}?since=\${state.lastChatTime}\`)
    const { messages } = await res.json()
    if (!messages || !messages.length) return
    const container = document.getElementById('chat-messages')
    let hasNew = false
    for (const msg of messages) {
      if (msg.timestamp > state.lastChatTime) {
        appendMessage(msg)
        state.lastChatTime = Math.max(state.lastChatTime, msg.timestamp)
        hasNew = true
        if (msg.type === 'sos' && msg.userId !== state.userId) {
          triggerSOSAlert(msg)
        }
      }
    }
    if (hasNew) {
      container.scrollTop = container.scrollHeight
      const activeTab = document.querySelector('.tab-btn.active')?.id
      if (activeTab !== 'tabBtn-chat') {
        document.getElementById('chat-badge').classList.remove('hidden')
      }
    }
  } catch(e) {}
}

function appendMessage(msg) {
  const container = document.getElementById('chat-messages')
  const isMe = msg.userId === state.userId
  const isSystem = msg.type === 'system'
  const isSOS = msg.type === 'sos'
  const color = getUserColor(msg.userId)
  const emoji = getUserEmoji(msg.userId)
  const timeStr = new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  if (isSystem) {
    container.insertAdjacentHTML('beforeend', \`<div class="msg-system">\${msg.message}</div>\`)
    return
  }
  if (isSOS) {
    container.insertAdjacentHTML('beforeend', \`
      <div class="msg-bubble mx-auto msg-sos rounded-2xl p-3 text-center">
        <p class="text-red-600 font-black text-base">🆘 SOS 긴급 알림!</p>
        <p class="text-red-700 text-sm mt-1">\${msg.message}</p>
        <p class="text-red-400 text-xs mt-1">\${timeStr}</p>
      </div>\`)
    return
  }
  if (isMe) {
    container.insertAdjacentHTML('beforeend', \`
      <div class="flex justify-end items-end gap-1">
        <span class="text-xs text-gray-400 mb-1">\${timeStr}</span>
        <div class="msg-bubble bg-indigo-500 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm">\${escapeHtml(msg.message)}</div>
      </div>\`)
  } else {
    container.insertAdjacentHTML('beforeend', \`
      <div class="flex items-end gap-2">
        <div style="background:\${color}" class="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1">\${emoji}</div>
        <div>
          <p class="text-xs text-gray-500 mb-1 ml-1">\${msg.userName}</p>
          <div class="flex items-end gap-1">
            <div class="msg-bubble bg-white text-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 text-sm shadow-sm">\${escapeHtml(msg.message)}</div>
            <span class="text-xs text-gray-400 mb-1">\${timeStr}</span>
          </div>
        </div>
      </div>\`)
  }
}

async function sendChat() {
  const input = document.getElementById('chat-input')
  const message = input.value.trim()
  if (!message) return
  input.value = ''
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: state.roomId, userId: state.userId, userName: state.userName, message })
    })
    setTimeout(fetchChat, 300)
  } catch(e) { showToast('메시지 전송 실패', 'error') }
}

async function shareMyLocationInChat() {
  if (!state.currentLat) { showToast('위치를 가져오는 중입니다', 'info'); return }
  const message = \`📍 내 현재 위치: https://map.kakao.com/link/map/\${state.userName},\${state.currentLat},\${state.currentLng}\`
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: state.roomId, userId: state.userId, userName: state.userName, message, type: 'location' })
    })
    setTimeout(fetchChat, 300)
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input')
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() }
    })
  }
})

// ════════════════════════════════════════════════════
//  SOS
// ════════════════════════════════════════════════════
async function sendSOS() {
  if (!confirm('🆘 SOS를 전송하시겠습니까?\\n\\n현재 위치와 함께 긴급 알림이 방의 모든 멤버에게 전송됩니다.')) return
  try {
    await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: state.roomId, userId: state.userId, userName: state.userName,
        lat: state.currentLat, lng: state.currentLng
      })
    })
    showToast('🆘 SOS 전송 완료!', 'sos')
    setTimeout(fetchChat, 300)
  } catch(e) { showToast('SOS 전송 실패', 'error') }
}

function triggerSOSAlert(msg) {
  // 진동
  if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500])
  // 알림
  showToast('🆘 ' + msg.userName + '님이 SOS를 보냈습니다!', 'sos')
  // 브라우저 알림
  if (Notification.permission === 'granted') {
    new Notification('🆘 SOS 긴급 알림', { body: msg.message, icon: '/favicon.ico' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification('🆘 SOS 긴급 알림', { body: msg.message })
    })
  }
}

// ════════════════════════════════════════════════════
//  약속 장소
// ════════════════════════════════════════════════════
async function searchPlace() {
  const keyword = document.getElementById('place-search-input').value.trim()
  if (!keyword) return
  if (typeof kakao === 'undefined' || !kakao.maps) {
    showToast('카카오맵 API 키 설정 후 이용 가능합니다', 'error')
    return
  }
  const ps = new kakao.maps.services.Places()
  ps.keywordSearch(keyword, (result, status) => {
    if (status !== kakao.maps.services.Status.OK) { showToast('검색 결과가 없습니다', 'info'); return }
    const container = document.getElementById('place-search-results')
    container.classList.remove('hidden')
    container.innerHTML = result.slice(0, 5).map((p, i) => \`
      <div class="p-3 border-b border-gray-50 last:border-0 active:bg-gray-50 cursor-pointer" onclick="selectPlace(\${i})">
        <p class="font-semibold text-gray-800 text-sm">\${p.place_name}</p>
        <p class="text-xs text-gray-400">\${p.address_name}</p>
      </div>\`).join('')
    window._searchResults = result
  }, { location: state.currentLat ? new kakao.maps.LatLng(state.currentLat, state.currentLng) : undefined })
}

function selectPlace(idx) {
  const place = window._searchResults[idx]
  state.selectedPlace = { name: place.place_name, lat: parseFloat(place.y), lng: parseFloat(place.x), address: place.address_name }
  document.getElementById('place-search-results').classList.add('hidden')
  showSelectedPlace()
}

function showSelectedPlace() {
  if (!state.selectedPlace) return
  const info = document.getElementById('selected-place-info')
  info.classList.remove('hidden')
  document.getElementById('selected-place-name').textContent = state.selectedPlace.name
  document.getElementById('selected-place-addr').textContent = state.selectedPlace.address || \`\${state.selectedPlace.lat.toFixed(5)}, \${state.selectedPlace.lng.toFixed(5)}\`
}

async function setAppointment() {
  if (!state.selectedPlace) { showToast('장소를 먼저 선택해주세요', 'error'); return }
  try {
    await fetch('/api/appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: state.roomId, userId: state.userId, userName: state.userName,
        placeName: state.selectedPlace.name, lat: state.selectedPlace.lat, lng: state.selectedPlace.lng
      })
    })
    showToast(\`📌 "\${state.selectedPlace.name}" 약속장소 지정!\\n\`, 'success')
    await fetchAppointment()
    setTimeout(fetchChat, 300)
  } catch(e) { showToast('약속 지정 실패', 'error') }
}

async function fetchAppointment() {
  if (!state.roomId) return
  try {
    const res = await fetch(\`/api/appointment/\${state.roomId}\`)
    const { appointment } = await res.json()
    state.appointment = appointment
    updateAppointmentUI(appointment)
  } catch(e) {}
}

function updateAppointmentUI(apt) {
  if (!apt) return
  // 지도 배너
  document.getElementById('apt-banner').classList.remove('hidden')
  document.getElementById('apt-banner-name').textContent = apt.placeName
  // 약속탭 카드
  document.getElementById('current-appt-card').classList.remove('hidden')
  document.getElementById('appt-place-name').textContent = apt.placeName
  document.getElementById('appt-setby').textContent = apt.setBy + '님이 지정'
  // 지도 마커
  if (state.map && typeof kakao !== 'undefined') {
    if (state.appointmentMarker) state.appointmentMarker.setMap(null)
    const content = \`<div style="background:#ef4444;color:white;padding:6px 10px;border-radius:12px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📌 \${apt.placeName}</div>\`
    state.appointmentMarker = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(apt.lat, apt.lng), content, yAnchor: 1.5 })
    state.appointmentMarker.setMap(state.map)
  }
}

function goToAppointment() {
  if (!state.appointment) return
  switchTab('appt')
  showTransitPanel()
}

// ════════════════════════════════════════════════════
//  중간 지점
// ════════════════════════════════════════════════════
async function findMidpoint() {
  try {
    const res = await fetch(\`/api/location/\${state.roomId}\`)
    const { locations } = await res.json()
    if (!locations || locations.length < 2) { showToast('최소 2명 이상이 위치를 공유해야 합니다', 'info'); return }
    const midLat = locations.reduce((s, l) => s + l.lat, 0) / locations.length
    const midLng = locations.reduce((s, l) => s + l.lng, 0) / locations.length
    state.midpointData = { lat: midLat, lng: midLng }

    let midName = \`중간 지점 (\${midLat.toFixed(4)}, \${midLng.toFixed(4)})\`
    if (typeof kakao !== 'undefined' && kakao.maps) {
      const geocoder = new kakao.maps.services.Geocoder()
      geocoder.coord2Address(midLng, midLat, (result, status) => {
        if (status === kakao.maps.services.Status.OK && result[0]) {
          midName = result[0].address.address_name || midName
        }
        showMidpointResult(midName, midLat, midLng)
      })
      state.map.setCenter(new kakao.maps.LatLng(midLat, midLng))
      state.map.setLevel(5)
    } else {
      showMidpointResult(midName, midLat, midLng)
    }
  } catch(e) { showToast('위치 정보를 가져오지 못했습니다', 'error') }
}

function showMidpointResult(name, lat, lng) {
  state.midpointData = { name, lat, lng }
  document.getElementById('midpoint-result').classList.remove('hidden')
  document.getElementById('midpoint-name').textContent = name
}

function setMidpointAsAppointment() {
  if (!state.midpointData) return
  state.selectedPlace = { name: state.midpointData.name || '중간 지점', lat: state.midpointData.lat, lng: state.midpointData.lng, address: '' }
  showSelectedPlace()
  setAppointment()
}

// ════════════════════════════════════════════════════
//  대중교통 조회
// ════════════════════════════════════════════════════
async function showTransitPanel() {
  if (!state.appointment) { showToast('약속장소를 먼저 지정해주세요', 'info'); return }
  if (!state.currentLat) { showToast('현재 위치를 가져오는 중입니다', 'info'); return }

  const panel = document.getElementById('transit-panel')
  const loading = document.getElementById('transit-loading')
  const results = document.getElementById('transit-results')
  panel.classList.remove('hidden')
  loading.classList.remove('hidden')
  results.innerHTML = ''

  try {
    const res = await fetch(\`/api/transit?sx=\${state.currentLng}&sy=\${state.currentLat}&ex=\${state.appointment.lng}&ey=\${state.appointment.lat}\`)
    const data = await res.json()
    loading.classList.add('hidden')
    renderTransitResults(data)
  } catch(e) {
    loading.classList.add('hidden')
    results.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">대중교통 정보를 가져오지 못했습니다</p>'
  }
}

function hideTransitPanel() {
  document.getElementById('transit-panel').classList.add('hidden')
}

function renderTransitResults(data) {
  const results = document.getElementById('transit-results')
  if (data.demo) {
    results.innerHTML = \`<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3 text-xs text-yellow-700">
      ⚠️ <strong>데모 데이터</strong> - ODsay API 키 설정 후 실제 데이터 조회 가능</div>\` + renderPaths(data.result)
    return
  }
  if (data.result && data.result.path) {
    results.innerHTML = renderPaths(data.result)
  } else {
    results.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">검색 결과가 없습니다</p>'
  }
}

function renderPaths(result) {
  if (!result || !result.path) return '<p class="text-gray-500 text-sm">경로 없음</p>'
  return result.path.slice(0, 3).map((path, i) => {
    const info = path.info
    const typeMap = { 1: '지하철', 2: '버스+지하철', 3: '버스' }
    const typeLabel = typeMap[path.pathType] || '대중교통'
    const subPaths = (path.subPath || []).filter(sp => sp.trafficType !== 3)
    return \`<div class="transit-card bg-white rounded-xl p-3 mb-3 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">경로 \${i+1} · \${typeLabel}</span>
        <span class="font-black text-gray-800 text-lg">\${info.totalTime}분</span>
      </div>
      <div class="flex items-center gap-1 flex-wrap mb-2">
        \${subPaths.map(sp => {
          const isSubway = sp.trafficType === 1
          const name = isSubway ? (sp.lane?.[0]?.name || '지하철') : (sp.lane?.[0]?.busNo || '버스')
          return \`<span class="text-xs font-bold px-2 py-1 rounded-lg \${isSubway ? 'bg-blue-100 text-blue-700 transit-subway' : 'bg-green-100 text-green-700 transit-bus'}">
            \${isSubway ? '🚇' : '🚌'} \${name}
          </span><span class="text-gray-300 text-xs">▸</span>\`
        }).join('')}
        <span class="text-xs text-gray-500">📍 \${state.appointment?.placeName || '목적지'}</span>
      </div>
      <div class="flex gap-3 text-xs text-gray-500">
        <span>💰 \${(info.payment || 0).toLocaleString()}원</span>
        <span>🚇 \${info.subwayTransitCount || 0}회 환승</span>
        <span>🚌 \${info.busTransitCount || 0}회 환승</span>
      </div>
    </div>\`
  }).join('')
}

// ════════════════════════════════════════════════════
//  폴링
// ════════════════════════════════════════════════════
function startPolling() {
  fetchLocations()
  fetchChat()
  fetchAppointment()
  state.pollInterval = setInterval(() => {
    fetchLocations()
    fetchChat()
  }, 5000)
  setTimeout(fetchAppointment, 2000)
}

// ════════════════════════════════════════════════════
//  UI 유틸리티
// ════════════════════════════════════════════════════
function switchTab(tab) {
  ['map','chat','appt'].forEach(t => {
    document.getElementById(\`tab-\${t}\`).classList.add('hidden')
    document.getElementById(\`tabBtn-\${t}\`).classList.remove('active')
  })
  document.getElementById(\`tab-\${tab}\`).classList.remove('hidden')
  document.getElementById(\`tabBtn-\${tab}\`).classList.add('active')
  if (tab === 'chat') {
    document.getElementById('chat-badge').classList.add('hidden')
    const container = document.getElementById('chat-messages')
    setTimeout(() => { container.scrollTop = container.scrollHeight }, 100)
  }
  if (tab === 'map' && state.map && typeof kakao !== 'undefined') {
    kakao.maps.event.trigger(state.map, 'resize')
  }
}

function showShareModal() {
  document.getElementById('share-modal').classList.remove('hidden')
}
function hideShareModal() {
  document.getElementById('share-modal').classList.add('hidden')
}

function copyRoomCode() {
  const code = state.roomId?.toUpperCase() || ''
  navigator.clipboard?.writeText(code).then(() => showToast('방 코드가 복사됐습니다!', 'success'))
    .catch(() => showToast(code, 'info'))
}

let toastTimeout = null
function showToast(message, type = 'info') {
  const el = document.getElementById('toast')
  const colorMap = { success: '#10b981', error: '#ef4444', info: '#6366f1', sos: '#dc2626' }
  el.style.background = colorMap[type] || '#6366f1'
  el.textContent = message
  el.classList.remove('hidden')
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 3000)
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ════════════════════════════════════════════════════
//  앱 시작
// ════════════════════════════════════════════════════
initApp()
</script>
</body>
</html>`)
})

export default app
