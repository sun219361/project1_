import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  KV: KVNamespace
  KAKAO_MAP_KEY: string
  ODSAY_API_KEY: string
}
const app = new Hono<{ Bindings: Bindings }>()
app.use('/api/*', cors())

// ── 유틸 ──────────────────────────────────────────────────────
function hashPassword(pw: string): string {
  let h = 5381
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i)
  return (h >>> 0).toString(36)
}

async function getUser(c: any) {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const uid = await c.env.KV.get(`session:${token}`)
  if (!uid) return null
  const raw = await c.env.KV.get(`user:${uid}`)
  return raw ? JSON.parse(raw) : null
}

// ── 회원가입 ──────────────────────────────────────────────────
app.post('/api/auth/register', async (c) => {
  const { userId, password, displayName, avatar } = await c.req.json()
  if (!userId || !password || !displayName) return c.json({ error: '모든 항목을 입력해주세요' }, 400)
  if (userId.length < 3) return c.json({ error: '아이디는 3자 이상이어야 합니다' }, 400)
  if (password.length < 4) return c.json({ error: '비밀번호는 4자 이상이어야 합니다' }, 400)
  if (!/^[a-z0-9_]+$/i.test(userId)) return c.json({ error: '아이디는 영문/숫자/밑줄만 사용 가능합니다' }, 400)
  const existing = await c.env.KV.get(`user:${userId.toLowerCase()}`)
  if (existing) return c.json({ error: '이미 사용 중인 아이디입니다' }, 409)
  const userData = { userId: userId.toLowerCase(), displayName, avatar: avatar || '🐻', passwordHash: hashPassword(password), createdAt: Date.now() }
  await c.env.KV.put(`user:${userId.toLowerCase()}`, JSON.stringify(userData))
  const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
  await c.env.KV.put(`session:${token}`, userId.toLowerCase(), { expirationTtl: 86400 * 7 })
  return c.json({ success: true, token, userId: userData.userId, displayName, avatar: userData.avatar })
})

// ── 로그인 ────────────────────────────────────────────────────
app.post('/api/auth/login', async (c) => {
  const { userId, password } = await c.req.json()
  if (!userId || !password) return c.json({ error: '아이디와 비밀번호를 입력해주세요' }, 400)
  const raw = await c.env.KV.get(`user:${userId.toLowerCase()}`)
  if (!raw) return c.json({ error: '존재하지 않는 아이디입니다' }, 404)
  const user = JSON.parse(raw)
  if (user.passwordHash !== hashPassword(password)) return c.json({ error: '비밀번호가 틀렸습니다' }, 401)
  const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
  await c.env.KV.put(`session:${token}`, user.userId, { expirationTtl: 86400 * 7 })
  return c.json({ success: true, token, userId: user.userId, displayName: user.displayName, avatar: user.avatar })
})

app.get('/api/me', async (c) => {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ userId: user.userId, displayName: user.displayName, avatar: user.avatar })
})

// ── 친구 요청 ─────────────────────────────────────────────────
async function acceptFriendship(kv: KVNamespace, a: string, b: string) {
  const aRaw = await kv.get(`friends:${a}`); const aList = aRaw ? JSON.parse(aRaw) : []
  const bRaw = await kv.get(`friends:${b}`); const bList = bRaw ? JSON.parse(bRaw) : []
  if (!aList.includes(b)) aList.push(b)
  if (!bList.includes(a)) bList.push(a)
  await kv.put(`friends:${a}`, JSON.stringify(aList))
  await kv.put(`friends:${b}`, JSON.stringify(bList))
}

app.post('/api/friends/request', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { targetUserId } = await c.req.json()
  const tid = targetUserId?.toLowerCase()
  if (!tid || tid === me.userId) return c.json({ error: '잘못된 요청' }, 400)
  const targetRaw = await c.env.KV.get(`user:${tid}`)
  if (!targetRaw) return c.json({ error: '존재하지 않는 사용자입니다' }, 404)
  const friendsRaw = await c.env.KV.get(`friends:${me.userId}`)
  const myFriends = friendsRaw ? JSON.parse(friendsRaw) : []
  if (myFriends.includes(tid)) return c.json({ error: '이미 친구입니다' }, 409)
  const existing = await c.env.KV.get(`friend_req:${tid}:${me.userId}`)
  if (existing) return c.json({ error: '이미 친구 요청을 보냈습니다' }, 409)
  const reverseReq = await c.env.KV.get(`friend_req:${me.userId}:${tid}`)
  if (reverseReq) {
    await acceptFriendship(c.env.KV, me.userId, tid)
    await c.env.KV.delete(`friend_req:${me.userId}:${tid}`)
    return c.json({ success: true, auto_accepted: true })
  }
  await c.env.KV.put(`friend_req:${tid}:${me.userId}`, JSON.stringify({ from: me.userId, fromName: me.displayName, fromAvatar: me.avatar, sentAt: Date.now() }), { expirationTtl: 86400 * 7 })
  return c.json({ success: true })
})

app.post('/api/friends/accept', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { fromUserId } = await c.req.json()
  const fid = fromUserId?.toLowerCase()
  await acceptFriendship(c.env.KV, me.userId, fid)
  await c.env.KV.delete(`friend_req:${me.userId}:${fid}`)
  return c.json({ success: true })
})

app.post('/api/friends/reject', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { fromUserId } = await c.req.json()
  await c.env.KV.delete(`friend_req:${me.userId}:${fromUserId?.toLowerCase()}`)
  return c.json({ success: true })
})

app.get('/api/friends/requests', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const list = await c.env.KV.list({ prefix: `friend_req:${me.userId}:` })
  const requests = []
  for (const key of list.keys) {
    const val = await c.env.KV.get(key.name)
    if (val) requests.push(JSON.parse(val))
  }
  return c.json({ requests })
})

// ── 친구 목록 + 위치 + 권한 ───────────────────────────────────
app.get('/api/friends', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const raw = await c.env.KV.get(`friends:${me.userId}`)
  const friendIds: string[] = raw ? JSON.parse(raw) : []
  // 내 위치 공개 권한 설정
  const myPermRaw = await c.env.KV.get(`loc_perm:${me.userId}`)
  const myPerm: Record<string, boolean> = myPermRaw ? JSON.parse(myPermRaw) : {}
  // 내 위치 표시 숨기기 설정 (내가 친구를 볼 것인지)
  const myViewRaw = await c.env.KV.get(`view_perm:${me.userId}`)
  const myView: Record<string, boolean> = myViewRaw ? JSON.parse(myViewRaw) : {}
  const friends = []
  for (const fid of friendIds) {
    const ufRaw = await c.env.KV.get(`user:${fid}`)
    if (!ufRaw) continue
    const uf = JSON.parse(ufRaw)
    // 상대방 위치: 상대가 나에게 공개 허용했는지 확인
    const fPermRaw = await c.env.KV.get(`loc_perm:${fid}`)
    const fPerm: Record<string, boolean> = fPermRaw ? JSON.parse(fPermRaw) : {}
    // 기본값: 허용 (명시적 false만 차단)
    const friendAllowsMe = fPerm[me.userId] !== false
    // 내가 이 친구 위치를 보기로 했는지
    const iViewFriend = myView[fid] !== false
    let location = null
    if (friendAllowsMe && iViewFriend) {
      const locRaw = await c.env.KV.get(`loc:${fid}`)
      if (locRaw) location = JSON.parse(locRaw)
    }
    friends.push({
      userId: uf.userId, displayName: uf.displayName, avatar: uf.avatar,
      location,
      // 내가 이 친구에게 내 위치를 공개하는가
      iShareWithFriend: myPerm[fid] !== false,
      // 내가 이 친구 위치를 보는가
      iViewFriend: iViewFriend,
    })
  }
  return c.json({ friends })
})

// ── 위치 업로드 ────────────────────────────────────────────────
app.post('/api/location', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { lat, lng, accuracy } = await c.req.json()
  await c.env.KV.put(`loc:${me.userId}`, JSON.stringify({ lat, lng, accuracy, updatedAt: Date.now() }), { expirationTtl: 3600 })
  return c.json({ success: true })
})

// ── 위치 공개 권한 설정 (내가 특정 친구에게 내 위치를 보여줄지) ──
app.post('/api/location/permission', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { friendId, allow } = await c.req.json()
  const raw = await c.env.KV.get(`loc_perm:${me.userId}`)
  const perm: Record<string, boolean> = raw ? JSON.parse(raw) : {}
  perm[friendId.toLowerCase()] = !!allow
  await c.env.KV.put(`loc_perm:${me.userId}`, JSON.stringify(perm))
  return c.json({ success: true })
})

// ── 친구 위치 표시 설정 (내가 특정 친구 위치를 볼지) ─────────────
app.post('/api/location/view', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { friendId, show } = await c.req.json()
  const raw = await c.env.KV.get(`view_perm:${me.userId}`)
  const perm: Record<string, boolean> = raw ? JSON.parse(raw) : {}
  perm[friendId.toLowerCase()] = !!show
  await c.env.KV.put(`view_perm:${me.userId}`, JSON.stringify(perm))
  return c.json({ success: true })
})

// ── 채팅방 목록 조회 ──────────────────────────────────────────
app.get('/api/rooms', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const raw = await c.env.KV.get(`rooms:${me.userId}`)
  const roomIds: string[] = raw ? JSON.parse(raw) : []
  const rooms = []
  // 항상 everyone 포함
  rooms.push({ roomId: 'everyone', name: '🌍 전체 채팅', type: 'global', members: [] })
  for (const rid of roomIds) {
    const roomRaw = await c.env.KV.get(`room:${rid}`)
    if (roomRaw) rooms.push(JSON.parse(roomRaw))
  }
  return c.json({ rooms })
})

// ── 채팅방 생성 ───────────────────────────────────────────────
app.post('/api/rooms', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { name, memberIds } = await c.req.json()
  if (!name || !Array.isArray(memberIds)) return c.json({ error: 'name and memberIds required' }, 400)
  const allMembers = [...new Set([me.userId, ...memberIds.map((id: string) => id.toLowerCase())])]
  const roomId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const roomData = { roomId, name, type: 'group', members: allMembers, createdBy: me.userId, createdAt: Date.now() }
  await c.env.KV.put(`room:${roomId}`, JSON.stringify(roomData), { expirationTtl: 86400 * 30 })
  // 모든 멤버의 rooms 목록에 추가
  for (const uid of allMembers) {
    const rawR = await c.env.KV.get(`rooms:${uid}`)
    const rList: string[] = rawR ? JSON.parse(rawR) : []
    if (!rList.includes(roomId)) rList.push(roomId)
    await c.env.KV.put(`rooms:${uid}`, JSON.stringify(rList))
  }
  return c.json({ success: true, room: roomData })
})

// ── 채팅방 나가기 ─────────────────────────────────────────────
app.post('/api/rooms/:roomId/leave', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  const rawR = await c.env.KV.get(`rooms:${me.userId}`)
  const rList: string[] = rawR ? JSON.parse(rawR) : []
  await c.env.KV.put(`rooms:${me.userId}`, JSON.stringify(rList.filter(r => r !== roomId)))
  return c.json({ success: true })
})

// ── 채팅 메시지 전송 ──────────────────────────────────────────
app.post('/api/chat', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { roomId, message, type } = await c.req.json()
  if (!roomId || !message) return c.json({ error: 'missing' }, 400)
  const msgId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  await c.env.KV.put(`chat:${roomId}:${msgId}`, JSON.stringify({
    msgId, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message, type: type || 'text', timestamp: Date.now()
  }), { expirationTtl: 86400 })
  return c.json({ success: true, msgId })
})

// ── 채팅 메시지 조회 (since 기반으로 빠른 폴링) ───────────────
app.get('/api/chat/:roomId', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  const since = Number(c.req.query('since') || '0')
  const list = await c.env.KV.list({ prefix: `chat:${roomId}:` })
  const messages = []
  for (const key of list.keys) {
    // 키 이름에서 타임스탬프 추출해서 since 미만은 스킵 (불필요한 KV get 방지)
    const tsPart = key.name.split(':')[2]?.split('_')[0]
    if (tsPart && Number(tsPart) <= since) continue
    const val = await c.env.KV.get(key.name)
    if (val) { const m = JSON.parse(val); if (m.timestamp > since) messages.push(m) }
  }
  messages.sort((a: any, b: any) => a.timestamp - b.timestamp)
  return c.json({ messages: messages.slice(-80) })
})

// ── SOS 발송 ──────────────────────────────────────────────────
app.post('/api/sos', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { lat, lng } = await c.req.json()
  const raw = await c.env.KV.get(`friends:${me.userId}`)
  const friendIds: string[] = raw ? JSON.parse(raw) : []
  const msgId = `${Date.now()}_sos`
  const sosId = `sos_${me.userId}_${Date.now()}`
  await c.env.KV.put(`chat:everyone:${msgId}`, JSON.stringify({
    msgId, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message: `🆘 SOS! ${me.displayName}님이 긴급 도움을 요청합니다!\n위치: ${lat?.toFixed(5)}, ${lng?.toFixed(5)}`,
    type: 'sos', lat, lng, sosId, targets: [me.userId, ...friendIds], timestamp: Date.now()
  }), { expirationTtl: 3600 })
  // SOS 상태 저장 (확인/종료 추적용)
  await c.env.KV.put(`sos_active:${sosId}`, JSON.stringify({
    sosId, fromUserId: me.userId, fromName: me.displayName, lat, lng,
    active: true, timestamp: Date.now(), acknowledgedBy: []
  }), { expirationTtl: 3600 })
  return c.json({ success: true, sosId })
})

// ── SOS 확인 (acknowledge) ────────────────────────────────────
app.post('/api/sos/acknowledge', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { sosId } = await c.req.json()
  if (!sosId) return c.json({ error: 'sosId required' }, 400)
  const raw = await c.env.KV.get(`sos_active:${sosId}`)
  if (!raw) return c.json({ error: 'SOS not found' }, 404)
  const sos = JSON.parse(raw)
  if (!sos.acknowledgedBy.includes(me.userId)) sos.acknowledgedBy.push(me.userId)
  await c.env.KV.put(`sos_active:${sosId}`, JSON.stringify(sos), { expirationTtl: 3600 })
  // 채팅에 확인 메시지 전송
  const msgId = `${Date.now()}_ack`
  await c.env.KV.put(`chat:everyone:${msgId}`, JSON.stringify({
    msgId, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message: `✅ ${me.displayName}님이 SOS를 확인했습니다`, type: 'system', timestamp: Date.now()
  }), { expirationTtl: 3600 })
  return c.json({ success: true })
})

// ── SOS 종료 (발신자만 가능) ──────────────────────────────────
app.post('/api/sos/dismiss', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { sosId } = await c.req.json()
  if (!sosId) return c.json({ error: 'sosId required' }, 400)
  const raw = await c.env.KV.get(`sos_active:${sosId}`)
  if (!raw) return c.json({ error: 'SOS not found' }, 404)
  const sos = JSON.parse(raw)
  sos.active = false
  await c.env.KV.put(`sos_active:${sosId}`, JSON.stringify(sos), { expirationTtl: 300 })
  // 종료 메시지
  const msgId = `${Date.now()}_end`
  await c.env.KV.put(`chat:everyone:${msgId}`, JSON.stringify({
    msgId, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message: `🟢 ${me.displayName}님의 SOS가 종료되었습니다. 안전합니다!`, type: 'system', timestamp: Date.now()
  }), { expirationTtl: 3600 })
  return c.json({ success: true })
})

// ── SOS 확인 폴링 ─────────────────────────────────────────────
app.get('/api/sos/check', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const since = Number(c.req.query('since') || '0')
  const list = await c.env.KV.list({ prefix: `chat:everyone:` })
  const sos = []
  for (const key of list.keys) {
    const tsPart = key.name.split(':')[2]?.split('_')[0]
    if (tsPart && Number(tsPart) <= since) continue
    const val = await c.env.KV.get(key.name)
    if (val) {
      const m = JSON.parse(val)
      if (m.timestamp > since && m.type === 'sos' && Array.isArray(m.targets) && m.targets.includes(me.userId)) {
        // SOS 활성 상태 확인
        const sosActiveRaw = await c.env.KV.get(`sos_active:${m.sosId}`)
        const sosActive = sosActiveRaw ? JSON.parse(sosActiveRaw) : { active: true, acknowledgedBy: [] }
        sos.push({ ...m, active: sosActive.active !== false, acknowledgedBy: sosActive.acknowledgedBy || [] })
      }
    }
  }
  return c.json({ sos })
})

// ── 약속장소 ──────────────────────────────────────────────────
app.post('/api/appointment', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const { roomId, placeName, lat, lng } = await c.req.json()
  await c.env.KV.put(`apt:${roomId}`, JSON.stringify({ placeName, lat, lng, setBy: me.displayName, setAt: Date.now() }), { expirationTtl: 86400 })
  return c.json({ success: true })
})

app.get('/api/appointment/:roomId', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const val = await c.env.KV.get(`apt:${c.req.param('roomId')}`)
  return c.json({ appointment: val ? JSON.parse(val) : null })
})

// ── 대중교통 ──────────────────────────────────────────────────
app.get('/api/transit', async (c) => {
  const { sx, sy, ex, ey } = c.req.query()
  const apiKey = c.env.ODSAY_API_KEY
  if (!apiKey || apiKey === 'demo' || apiKey.startsWith('여기에')) {
    return c.json({ demo: true, result: { path: [
      { pathType: 1, info: { totalTime: 38, payment: 1400, busTransitCount: 0, subwayTransitCount: 1 },
        subPath: [{ trafficType: 1, sectionTime: 38, lane: [{ name: '2호선', subwayCode: 2 }], startName: '출발역', endName: '도착역' }] },
      { pathType: 3, info: { totalTime: 52, payment: 1400, busTransitCount: 2, subwayTransitCount: 0 },
        subPath: [{ trafficType: 2, sectionTime: 25, lane: [{ busNo: '147' }], startName: '정류장', endName: '환승' }, { trafficType: 2, sectionTime: 27, lane: [{ busNo: '3412' }], startName: '환승', endName: '목적지' }] }
    ]}})
  }
  try {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${apiKey}`
    const res = await fetch(url)
    return c.json(await res.json())
  } catch { return c.json({ error: 'API error' }, 500) }
})

// ── 메인 HTML ─────────────────────────────────────────────────
app.get('*', (c) => {
  const kakaoKey = c.env.KAKAO_MAP_KEY || ''
  return c.html(getHTML(kakaoKey))
})

function getHTML(kakaoKey: string): string {
const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>모여봐</title>
<link rel="manifest" href="/manifest.json"/>
<meta name="theme-color" content="#7c3aed"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
<style>
:root{
  --bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a26;
  --surface:#1e1e2e;--surface2:#252538;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --accent:#7c3aed;--accent2:#a855f7;--accent3:#c084fc;
  --pink:#ec4899;--green:#10b981;--red:#ef4444;--blue:#3b82f6;--yellow:#f59e0b;
  --text:#f1f1f5;--text2:#a0a0b8;--text3:#5a5a78;
  --radius:16px;--radius-sm:10px;--radius-xs:8px;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
html,body{height:100%;overflow:hidden;background:var(--bg)}
body{font-family:'Pretendard',sans-serif;color:var(--text)}
input,textarea,button{font-family:inherit}
input{font-size:16px!important}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:4px}

/* ── AUTH ──────────────────────────────── */
#screen-auth{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto;}
.auth-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%);pointer-events:none;}
.auth-logo{width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,var(--accent),var(--pink));display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;box-shadow:0 8px 32px rgba(124,58,237,0.4);}
.auth-title{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
.auth-sub{font-size:14px;color:var(--text2);margin-bottom:32px}
.auth-card{width:100%;max-width:380px;background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:28px;box-shadow:0 24px 64px rgba(0,0,0,0.5);}
.auth-tabs{display:flex;background:var(--bg2);border-radius:var(--radius-sm);padding:4px;margin-bottom:24px;gap:4px}
.auth-tab{flex:1;padding:9px;border:none;background:transparent;color:var(--text2);font-size:14px;font-weight:600;border-radius:8px;cursor:pointer;transition:all .2s}
.auth-tab.active{background:var(--accent);color:white;box-shadow:0 4px 12px rgba(124,58,237,0.4)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;letter-spacing:0.3px}
.field input{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius-xs);padding:12px 14px;color:var(--text);font-size:15px;outline:none;transition:border-color .2s;}
.field input:focus{border-color:var(--accent)}
.field input::placeholder{color:var(--text3)}
.avatar-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:8px}
.avatar-btn{aspect-ratio:1;background:var(--bg2);border:2px solid transparent;border-radius:10px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.avatar-btn.selected{border-color:var(--accent);background:rgba(124,58,237,0.15)}
.btn-primary{width:100%;padding:14px;border:none;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 8px 24px rgba(124,58,237,0.35);margin-top:8px;}
.btn-primary:active{transform:scale(0.98)}
.auth-error{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-xs);padding:10px 14px;font-size:13px;color:#fca5a5;margin-bottom:12px;display:none;}

/* ── MAIN APP ─────────────────────────── */
#screen-main{position:fixed;inset:0;display:none;flex-direction:column;background:var(--bg);}
#screen-main.visible{display:flex}
.topbar{flex-shrink:0;padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-bottom:1px solid var(--border);z-index:10;}
.topbar-logo{display:flex;align-items:center;gap:8px}
.topbar-logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--pink));display:flex;align-items:center;justify-content:center;font-size:14px;}
.topbar-logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px}
.topbar-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:36px;height:36px;border-radius:10px;border:none;background:var(--surface);color:var(--text2);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all .15s;position:relative;}
.icon-btn:active{background:var(--surface2)}
.icon-btn .badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:var(--red);font-size:9px;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
.tab-content{flex:1;overflow:hidden;position:relative}
.tab-pane{position:absolute;inset:0;overflow:hidden;display:none;flex-direction:column}
.tab-pane.active{display:flex}
.tabbar{flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);background:var(--bg);border-top:1px solid var(--border);padding-bottom:env(safe-area-inset-bottom,0);}
.tab-btn{padding:10px 0 8px;border:none;background:transparent;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--text3);cursor:pointer;transition:color .2s;position:relative;}
.tab-btn i{font-size:20px;transition:transform .2s}
.tab-btn span{font-size:10px;font-weight:600;letter-spacing:0.3px}
.tab-btn.active{color:var(--accent2)}
.tab-btn.active i{transform:scale(1.1)}
.tab-btn .tbadge{position:absolute;top:8px;right:calc(50% - 18px);background:var(--red);color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;padding:0 3px;display:none;align-items:center;justify-content:center;border:2px solid var(--bg);}

/* ── 지도 탭 ─────────────────────────── */
#tab-map{background:var(--bg2)}
#kakaoMap{width:100%;height:100%}
.map-no-key{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--bg) 0%,var(--bg3) 100%);padding:24px;text-align:center;}
.map-no-key .icon{font-size:56px;margin-bottom:16px}
.map-no-key h3{font-size:18px;font-weight:700;color:var(--accent3);margin-bottom:8px}
.map-no-key p{font-size:13px;color:var(--text2);line-height:1.6;max-width:280px}
.map-no-key .guide{margin-top:16px;background:var(--surface);border-radius:var(--radius-sm);padding:14px;text-align:left;width:100%;max-width:300px;border:1px solid var(--border2);}
.map-no-key .guide p{font-size:12px;color:var(--text2);margin-bottom:4px}
.map-overlay{position:absolute;inset:0;pointer-events:none;z-index:5}
.map-overlay *{pointer-events:auto}
.map-fab-group{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:8px}
.map-fab{width:44px;height:44px;border-radius:14px;border:none;background:rgba(18,18,26,0.85);backdrop-filter:blur(12px);border:1px solid var(--border2);color:var(--text);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:all .15s;}
.map-fab:active{transform:scale(0.95)}
.map-fab.accent{background:rgba(124,58,237,0.85);color:white;border-color:rgba(124,58,237,0.5)}
.map-fab.toggled-off{background:rgba(80,80,100,0.85);color:var(--text3)}
.apt-chip{position:absolute;top:14px;left:14px;right:68px;background:rgba(18,18,26,0.9);backdrop-filter:blur(12px);border:1px solid var(--border2);border-radius:14px;padding:8px 12px;display:none;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);}
.apt-chip .label{font-size:11px;color:var(--text2)}
.apt-chip .name{font-size:13px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.apt-chip .chip-btn{flex-shrink:0;background:var(--accent);color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;border:none;cursor:pointer;}
.sos-fab{position:absolute;bottom:20px;right:14px;width:64px;height:64px;border-radius:20px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;box-shadow:0 0 0 0 rgba(239,68,68,0.5);animation:sos-pulse 2s infinite;}
.sos-fab i{font-size:22px}
.sos-fab span{font-size:9px;font-weight:800;letter-spacing:1px}
@keyframes sos-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4),0 8px 24px rgba(239,68,68,0.3)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0),0 8px 24px rgba(239,68,68,0.2)}}
.member-bar{flex-shrink:0;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:0;overflow-x:auto;padding:10px 14px;min-height:72px;align-items:center;}
.member-bar::-webkit-scrollbar{display:none}
.member-item{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:0 8px;}
.member-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid transparent;position:relative;}
.member-avatar.me{border-color:var(--accent)}
.member-avatar .online-dot{position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:var(--green);border:2px solid var(--bg);}
.member-name{font-size:10px;font-weight:600;color:var(--text2);max-width:52px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── SOS 알림 배너 ────────────────────── */
.sos-banner{
  position:fixed;top:0;left:0;right:0;z-index:9990;
  background:linear-gradient(135deg,#dc2626,#991b1b);
  padding:14px 16px;
  display:flex;flex-direction:column;gap:8px;
  box-shadow:0 4px 24px rgba(239,68,68,0.6);
  animation:sos-flash 0.8s infinite alternate;
  transform:translateY(-100%);
  transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  pointer-events:none;
}
.sos-banner.show{transform:translateY(0);pointer-events:auto}
.sos-banner-title{font-size:16px;font-weight:800;color:white;display:flex;align-items:center;gap:8px;}
.sos-banner-msg{font-size:13px;color:rgba(255,255,255,0.9)}
.sos-banner-btns{display:flex;gap:8px}
.sos-banner-btn{flex:1;padding:9px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
.sos-banner-btn.ack{background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);}
.sos-banner-btn.dismiss{background:white;color:#dc2626;}
@keyframes sos-flash{from{background:linear-gradient(135deg,#dc2626,#991b1b)}to{background:linear-gradient(135deg,#ef4444,#b91c1c)}}

/* ── 채팅 탭 ─────────────────────────── */
#tab-chat{background:var(--bg)}
.chat-header{flex-shrink:0;padding:10px 12px 8px;background:var(--bg);border-bottom:1px solid var(--border);}
.chat-rooms-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.chat-rooms-label{font-size:11px;font-weight:700;color:var(--text3);flex-shrink:0;}
.chat-room-select{display:flex;gap:6px;overflow-x:auto;flex:1;}
.chat-room-select::-webkit-scrollbar{display:none}
.room-chip{flex-shrink:0;padding:6px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--surface);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:4px;}
.room-chip.active{background:var(--accent);border-color:var(--accent);color:white}
.room-chip .chip-close{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:9px;margin-left:2px;}
.new-room-btn{flex-shrink:0;width:30px;height:30px;border-radius:50%;border:1px dashed var(--border2);background:transparent;color:var(--text3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.new-room-btn:active{background:var(--surface)}
.chat-room-name{font-size:14px;font-weight:700;color:var(--text);padding:0 2px;}
.chat-msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.msg-row{display:flex;align-items:flex-end;gap:6px}
.msg-row.me{flex-direction:row-reverse}
.msg-avatar{width:30px;height:30px;border-radius:50%;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--surface2)}
.msg-body{max-width:68%;display:flex;flex-direction:column;gap:2px}
.msg-row.me .msg-body{align-items:flex-end}
.msg-sender{font-size:11px;color:var(--text2);font-weight:500;padding:0 4px}
.msg-bubble{padding:9px 12px;border-radius:4px 16px 16px 16px;font-size:14px;line-height:1.5;word-break:break-word;background:var(--surface);color:var(--text);}
.msg-row.me .msg-bubble{background:var(--accent);color:white;border-radius:16px 4px 16px 16px}
.msg-time{font-size:10px;color:var(--text3);padding:0 4px}
.msg-system{text-align:center;font-size:11px;color:var(--text3);padding:4px 0}
.msg-sos .msg-bubble{background:rgba(239,68,68,0.15)!important;border:1px solid rgba(239,68,68,0.4)!important;color:#fca5a5!important;border-radius:12px!important;animation:sos-flash-msg 1s infinite alternate;}
@keyframes sos-flash-msg{from{background:rgba(239,68,68,0.12)}to{background:rgba(239,68,68,0.22)}}
.chat-input-bar{flex-shrink:0;padding:10px 12px;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;}
.chat-input-bar input{flex:1;background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:10px 16px;color:var(--text);outline:none;font-size:14px;transition:border-color .2s;}
.chat-input-bar input:focus{border-color:var(--accent)}
.chat-input-bar input::placeholder{color:var(--text3)}
.send-btn{width:40px;height:40px;border-radius:50%;border:none;background:var(--accent);color:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.send-btn:active{transform:scale(0.92)}
.loc-share-btn{width:36px;height:36px;border-radius:50%;border:none;background:var(--surface);color:var(--accent3);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}

/* ── 채팅방 만들기 모달 ─────────────── */
.create-room-panel{
  position:absolute;inset:0;background:var(--bg);z-index:20;display:none;flex-direction:column;
}
.create-room-panel.show{display:flex}
.create-room-header{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;}
.create-room-header h3{font-size:16px;font-weight:700;flex:1}
.create-room-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;}
.create-room-footer{padding:14px 16px;border-top:1px solid var(--border);}
.member-select-list{display:flex;flex-direction:column;gap:4px}
.member-select-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;background:var(--surface);border:1px solid transparent;transition:all .15s;}
.member-select-item.selected{border-color:var(--accent);background:rgba(124,58,237,0.1);}
.member-select-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .15s;}
.member-select-item.selected .member-select-check{background:var(--accent);border-color:var(--accent);color:white;}

/* ── 약속 탭 ─────────────────────────── */
#tab-appt{background:var(--bg);overflow-y:auto}
.appt-scroll{padding:16px;display:flex;flex-direction:column;gap:12px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;}
.card-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px;}
.card-title i{color:var(--accent3)}
.search-row{display:flex;gap:8px;margin-bottom:8px}
.search-input{flex:1;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius-xs);padding:10px 14px;color:var(--text);font-size:14px;outline:none;transition:border-color .2s;}
.search-input:focus{border-color:var(--accent)}
.search-input::placeholder{color:var(--text3)}
.search-btn{padding:10px 16px;border:none;border-radius:var(--radius-xs);background:var(--accent);color:white;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0;}
.place-results{display:none;border:1px solid var(--border);border-radius:var(--radius-xs);overflow:hidden;margin-bottom:8px}
.place-item{padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:var(--surface);transition:background .15s;}
.place-item:last-child{border-bottom:none}
.place-item:active{background:var(--surface2)}
.place-item .pname{font-size:14px;font-weight:600;color:var(--text)}
.place-item .paddr{font-size:12px;color:var(--text2);margin-top:1px}
.selected-place{background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:var(--radius-xs);padding:10px 14px;margin-bottom:10px;display:none;}
.selected-place .sp-label{font-size:11px;color:var(--accent3);font-weight:600}
.selected-place .sp-name{font-size:14px;font-weight:700;color:var(--text);margin-top:2px}
.selected-place .sp-addr{font-size:12px;color:var(--text2)}
.btn-accent{width:100%;padding:12px;border:none;border-radius:var(--radius-xs);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(124,58,237,0.3);transition:all .15s;}
.btn-accent:active{transform:scale(0.98)}
.btn-secondary{width:100%;padding:12px;border:1px solid var(--border2);border-radius:var(--radius-xs);background:var(--surface2);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;}
.current-apt-card{background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.1));border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:18px;display:none;}
.current-apt-label{font-size:11px;color:var(--accent3);font-weight:600;margin-bottom:4px}
.current-apt-name{font-size:20px;font-weight:800;color:var(--text);margin-bottom:12px}
.apt-btn-row{display:flex;gap:8px}
.apt-btn{flex:1;padding:10px;border:none;border-radius:var(--radius-xs);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;}
.apt-btn.primary{background:var(--accent);color:white}
.apt-btn.ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border2)}
.midpoint-result{display:none;margin-top:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-xs);padding:12px;}
.midpoint-result .mp-label{font-size:11px;color:#34d399;font-weight:600}
.midpoint-result .mp-name{font-size:14px;font-weight:700;color:var(--text);margin:4px 0 10px}
.transit-panel{display:none;margin-top:12px}
.transit-route{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;border-left:3px solid var(--accent);}
.transit-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.transit-time{font-size:22px;font-weight:800;color:var(--text)}
.transit-tag{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(124,58,237,0.15);color:var(--accent3);}
.transit-steps{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.step-chip{font-size:11px;font-weight:700;padding:3px 8px;border-radius:8px;display:flex;align-items:center;gap:3px;}
.step-chip.subway{background:rgba(59,130,246,0.15);color:#60a5fa}
.step-chip.bus{background:rgba(16,185,129,0.15);color:#34d399}
.transit-meta{font-size:11px;color:var(--text2);display:flex;gap:10px}
.transit-demo-note{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-xs);padding:10px;font-size:12px;color:#fbbf24;margin-bottom:10px;}
.spinner{width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:20px auto}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── 친구 탭 ─────────────────────────── */
#tab-friends{background:var(--bg);overflow-y:auto}
.friends-scroll{padding:16px;display:flex;flex-direction:column;gap:12px}
.add-friend-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;}
.friend-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.friend-item:last-child{border-bottom:none}
.friend-avatar{width:46px;height:46px;border-radius:50%;font-size:24px;display:flex;align-items:center;justify-content:center;background:var(--surface2);flex-shrink:0;}
.friend-info{flex:1;min-width:0}
.friend-name{font-size:15px;font-weight:700;color:var(--text)}
.friend-id{font-size:12px;color:var(--text2);margin-top:1px}
.friend-status{font-size:11px;margin-top:3px;display:flex;align-items:center;gap:4px}
.friend-status .dot{width:7px;height:7px;border-radius:50%;background:var(--text3)}
.friend-status .dot.online{background:var(--green)}
.friend-actions{display:flex;gap:6px;flex-shrink:0}
.f-btn{padding:7px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .15s;}
.f-btn.accept{background:var(--accent);color:white}
.f-btn.reject{background:var(--surface2);color:var(--text2);border:1px solid var(--border2)}
.f-btn.chat{background:var(--surface2);color:var(--accent3);border:1px solid rgba(124,58,237,0.3)}
.f-btn:active{transform:scale(0.95)}

/* 친구별 권한 토글 */
.perm-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12px;color:var(--text2);background:var(--bg2);border-radius:8px;margin-bottom:4px;}
.perm-label{display:flex;align-items:center;gap:6px;font-weight:500;}
.toggle-sw{width:44px;height:24px;border-radius:12px;background:var(--surface2);border:1px solid var(--border2);cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.toggle-sw.on{background:var(--accent);border-color:var(--accent);}
.toggle-sw::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,0.3);}
.toggle-sw.on::after{left:23px;}
.perm-expand{padding:8px 4px 4px;border-top:1px solid var(--border);margin-top:6px;display:none;}
.perm-expand.show{display:block;}

.req-badge{background:var(--red);color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px;}
.section-label{font-size:12px;font-weight:700;color:var(--text2);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px}
.empty-state{text-align:center;padding:32px 0;color:var(--text3)}
.empty-state .e-icon{font-size:36px;margin-bottom:8px}
.empty-state p{font-size:13px}

/* ── 토스트 ───────────────────────────── */
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:9999;background:var(--surface);color:var(--text);padding:11px 20px;border-radius:20px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid var(--border2);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;max-width:90vw;display:flex;align-items:center;gap:8px;}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast.success{border-color:rgba(16,185,129,0.4);color:#34d399}
.toast.error{border-color:rgba(239,68,68,0.4);color:#fca5a5}
.toast.sos{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.5);color:#fca5a5}

/* ── 모달 ────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:none;align-items:flex-end;backdrop-filter:blur(4px);}
.modal-overlay.show{display:flex}
.modal-sheet{width:100%;background:var(--surface);border-radius:24px 24px 0 0;padding:24px;border-top:1px solid var(--border2);animation:sheetUp .25s ease-out;}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes bubblePop{0%{transform:scale(0.4) translateY(8px);opacity:0}70%{transform:scale(1.08) translateY(-2px)}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes bubbleFadeOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.8) translateY(-6px)}}
.modal-handle{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 20px}
.modal-title{font-size:18px;font-weight:800;margin-bottom:6px}
.modal-sub{font-size:13px;color:var(--text2);margin-bottom:20px}

/* 지도 말풍선 */
.msg-bubble-map{position:relative;background:#7c3aed;color:white;padding:7px 11px;border-radius:14px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.45);max-width:180px;word-break:break-all;white-space:normal;line-height:1.4;animation:bubblePop .25s cubic-bezier(.34,1.56,.64,1);}
</style>
</head>
<body>

<!-- SOS 알림 배너 (화면 상단 고정) -->
<div class="sos-banner" id="sos-banner">
  <div class="sos-banner-title"><i class="fas fa-exclamation-triangle"></i><span id="sos-banner-title-text">SOS 긴급 알림</span></div>
  <div class="sos-banner-msg" id="sos-banner-msg"></div>
  <div class="sos-banner-btns">
    <button class="sos-banner-btn ack" id="sos-ack-btn">✅ 확인했어요</button>
    <button class="sos-banner-btn dismiss" id="sos-dismiss-btn" style="display:none">🟢 SOS 종료</button>
  </div>
</div>

<!-- ══ AUTH ══════════════════════════════════════════════ -->
<div id="screen-auth">
  <div class="auth-glow"></div>
  <div class="auth-logo">📍</div>
  <h1 class="auth-title">모여봐</h1>
  <p class="auth-sub">친구들과 실시간 위치 공유</p>
  <div class="auth-card">
    <div class="auth-tabs">
      <button class="auth-tab active" onclick="switchAuthTab('login')">로그인</button>
      <button class="auth-tab" onclick="switchAuthTab('register')">회원가입</button>
    </div>
    <div id="auth-error" class="auth-error"></div>
    <form id="form-login" onsubmit="doLogin();return false;">
      <div class="field"><label>아이디</label><input id="login-id" type="text" placeholder="아이디 입력" autocomplete="username"/></div>
      <div class="field"><label>비밀번호</label><input id="login-pw" type="password" placeholder="비밀번호 입력" autocomplete="current-password"/></div>
      <button type="submit" class="btn-primary">로그인</button>
    </form>
    <form id="form-register" style="display:none" onsubmit="doRegister();return false;">
      <div class="field"><label>아이디</label><input id="reg-id" type="text" placeholder="my_id123 (영문/숫자/밑줄, 3자↑)" autocomplete="username"/></div>
      <div class="field"><label>비밀번호</label><input id="reg-pw" type="password" placeholder="비밀번호 (4자 이상)" autocomplete="new-password"/></div>
      <div class="field"><label>닉네임</label><input id="reg-name" type="text" placeholder="친구들에게 보여질 이름" maxlength="10"/></div>
      <div class="field"><label>아바타</label><div class="avatar-grid" id="avatar-grid"></div></div>
      <button type="submit" class="btn-primary">가입하기</button>
    </form>
  </div>
</div>

<!-- ══ MAIN APP ══════════════════════════════════════════ -->
<div id="screen-main">
  <div class="topbar">
    <div class="topbar-logo">
      <div class="topbar-logo-icon">📍</div>
      <span class="topbar-logo-text">모여봐</span>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="loc-share-toggle" onclick="toggleMyLocShare()" title="내 위치 공유 켜기/끄기">
        <i class="fas fa-broadcast-tower"></i>
        <span class="badge" id="loc-share-badge" style="display:none;background:var(--green)">ON</span>
      </button>
      <button class="icon-btn" onclick="switchTab('friends')" id="friend-req-btn" title="친구 요청">
        <i class="fas fa-user-friends"></i>
        <span class="badge" id="req-badge" style="display:none"></span>
      </button>
      <button class="icon-btn" onclick="showProfileModal()" title="내 프로필">
        <span id="my-avatar-btn" style="font-size:18px">🐻</span>
      </button>
    </div>
  </div>

  <div class="tab-content">
    <!-- 🗺️ 지도 -->
    <div class="tab-pane active" id="tab-map">
      <div style="flex:1;position:relative">
        <div id="kakaoMap"></div>
        <div class="map-overlay">
          <div class="apt-chip" id="apt-chip">
            <span style="font-size:16px">📌</span>
            <div style="flex:1;min-width:0">
              <div class="label">약속장소</div>
              <div class="name" id="apt-chip-name"></div>
            </div>
            <button class="chip-btn" onclick="goToApptTab()">길찾기</button>
          </div>
          <div class="map-fab-group">
            <button class="map-fab" onclick="centerMe()" title="내 위치"><i class="fas fa-crosshairs"></i></button>
            <button class="map-fab" onclick="centerAll()" title="전체 보기"><i class="fas fa-expand-arrows-alt" style="font-size:14px"></i></button>
          </div>
          <button class="sos-fab" onclick="sendSOS()"><i class="fas fa-exclamation"></i><span>SOS</span></button>
        </div>
      </div>
      <div class="member-bar" id="member-bar">
        <div style="color:var(--text3);font-size:12px;width:100%;text-align:center">친구를 추가하면 여기에 표시됩니다</div>
      </div>
    </div>

    <!-- 💬 채팅 -->
    <div class="tab-pane" id="tab-chat">
      <!-- 채팅방 만들기 패널 -->
      <div class="create-room-panel" id="create-room-panel">
        <div class="create-room-header">
          <button onclick="closeCreateRoom()" style="background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:4px"><i class="fas fa-arrow-left"></i></button>
          <h3>채팅방 만들기</h3>
        </div>
        <div class="create-room-body">
          <div class="field"><label>채팅방 이름</label><input id="new-room-name" type="text" placeholder="예) 여름 여행 계획" maxlength="20"/></div>
          <div>
            <div class="section-label">참여할 친구 선택</div>
            <div class="member-select-list" id="member-select-list"></div>
          </div>
        </div>
        <div class="create-room-footer">
          <button class="btn-accent" onclick="createRoom()">채팅방 만들기</button>
        </div>
      </div>

      <div class="chat-header">
        <div class="chat-rooms-row">
          <span class="chat-rooms-label">채팅방</span>
          <div class="chat-room-select" id="chat-room-select">
            <div class="room-chip active" data-room="everyone">🌍 전체</div>
          </div>
          <button class="new-room-btn" onclick="openCreateRoom()" title="채팅방 만들기"><i class="fas fa-plus"></i></button>
        </div>
        <div class="chat-room-name" id="chat-room-name">🌍 전체 채팅</div>
      </div>
      <div class="chat-msgs" id="chat-msgs"></div>
      <div class="chat-input-bar">
        <button class="loc-share-btn" onclick="shareMyLocInChat()" title="위치 공유"><i class="fas fa-map-marker-alt"></i></button>
        <input id="chat-input" type="text" placeholder="메시지 입력..." maxlength="200"/>
        <button class="send-btn" onclick="sendChat()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>

    <!-- 📌 약속 -->
    <div class="tab-pane" id="tab-appt">
      <div class="appt-scroll">
        <div class="current-apt-card" id="cur-apt-card">
          <div class="current-apt-label">📌 현재 약속장소</div>
          <div class="current-apt-name" id="cur-apt-name"></div>
          <div class="apt-btn-row">
            <button class="apt-btn primary" onclick="openTransit()"><i class="fas fa-subway"></i> 길찾기</button>
            <button class="apt-btn ghost" onclick="focusApt()"><i class="fas fa-map"></i> 지도</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-map-pin"></i> 약속장소 지정</div>
          <div class="search-row">
            <input class="search-input" id="place-input" type="text" placeholder="장소 검색 (강남역, 홍대입구...)"/>
            <button class="search-btn" onclick="searchPlace()">검색</button>
          </div>
          <div class="place-results" id="place-results"></div>
          <div class="selected-place" id="selected-place">
            <div class="sp-label">선택된 장소</div>
            <div class="sp-name" id="sp-name"></div>
            <div class="sp-addr" id="sp-addr"></div>
          </div>
          <button class="btn-accent" onclick="setAppointment()">📌 약속장소로 지정</button>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-bullseye"></i> 중간 지점 찾기</div>
          <p style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.6">친구들 위치 기반 중간 지점을 계산합니다</p>
          <button class="btn-secondary" onclick="findMidpoint()">🎯 중간 지점 계산하기</button>
          <div class="midpoint-result" id="midpoint-result">
            <div class="mp-label">계산된 중간 지점</div>
            <div class="mp-name" id="mp-name"></div>
            <button class="btn-accent" onclick="setMidpointAsApt()" style="margin-top:4px">이 장소를 약속장소로 지정</button>
          </div>
        </div>
        <div class="card transit-panel" id="transit-panel">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div class="card-title" style="margin-bottom:0"><i class="fas fa-train"></i> 대중교통 길찾기</div>
            <button onclick="closeTransit()" style="background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer">닫기</button>
          </div>
          <div class="spinner" id="transit-spinner"></div>
          <div id="transit-results"></div>
        </div>
      </div>
    </div>

    <!-- 👥 친구 -->
    <div class="tab-pane" id="tab-friends">
      <div class="friends-scroll">
        <div class="add-friend-card">
          <div class="card-title"><i class="fas fa-user-plus"></i> 친구 추가</div>
          <div class="search-row">
            <input class="search-input" id="friend-id-input" type="text" placeholder="친구 아이디 입력"/>
            <button class="search-btn" onclick="sendFriendReq()">요청</button>
          </div>
        </div>
        <div id="req-section" style="display:none">
          <div class="section-label">받은 친구 요청 <span class="req-badge" id="req-count-badge"></span></div>
          <div class="card"><div id="req-list"></div></div>
        </div>
        <div>
          <div class="section-label">친구 목록</div>
          <div class="card">
            <div id="friend-list">
              <div class="empty-state"><div class="e-icon">👥</div><p>아직 친구가 없어요</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="tabbar">
    <button class="tab-btn active" id="tbtn-map" onclick="switchTab('map')"><i class="fas fa-map-marked-alt"></i><span>지도</span></button>
    <button class="tab-btn" id="tbtn-chat" onclick="switchTab('chat')"><i class="fas fa-comment-dots"></i><span>채팅</span><span class="tbadge" id="chat-tbadge">N</span></button>
    <button class="tab-btn" id="tbtn-appt" onclick="switchTab('appt')"><i class="fas fa-map-pin"></i><span>약속</span></button>
    <button class="tab-btn" id="tbtn-friends" onclick="switchTab('friends')"><i class="fas fa-user-friends"></i><span>친구</span><span class="tbadge" id="friends-tbadge"></span></button>
  </div>
</div>

<!-- 프로필 모달 -->
<div class="modal-overlay" id="profile-modal" onclick="closeProfileModal(event)">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div id="profile-avatar" style="font-size:44px;width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:50%"></div>
      <div>
        <div id="profile-name" style="font-size:20px;font-weight:800"></div>
        <div id="profile-id" style="font-size:13px;color:var(--text2);margin-top:2px"></div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:8px">내 위치 공유 전체 설정</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border-radius:10px;">
        <span style="font-size:14px;color:var(--text)"><i class="fas fa-broadcast-tower" style="color:var(--accent3);margin-right:8px"></i>위치 공유 중</span>
        <div class="toggle-sw" id="global-loc-toggle" onclick="toggleGlobalLoc()"></div>
      </div>
    </div>
    <button onclick="doLogout()" style="width:100%;padding:13px;border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:rgba(239,68,68,0.1);color:#fca5a5;font-size:14px;font-weight:700;cursor:pointer">로그아웃</button>
  </div>
</div>

<!-- 토스트 -->
<div class="toast" id="toast"></div>

<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services"></script>
<script>
// ════════════════════════════════════════════════════════════
//  SERVICE WORKER 등록 (백그라운드 위치 추적)
// ════════════════════════════════════════════════════════════
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{})
}

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
const S = {
  token: null, userId: null, displayName: null, avatar: null,
  lat: null, lng: null,
  map: null, myMarker: null, friendMarkers: {},
  chatBubbleOverlays: {}, chatBubbleTimers: {},
  aptMarker: null, appointment: null,
  friends: [], pendingReqs: [],
  rooms: [], // 채팅방 목록
  currentRoom: 'everyone', currentRoomName: '🌍 전체 채팅',
  lastChatTs: 0, lastSOSTs: 0,
  selectedPlace: null, midpointData: null,
  pollTimer: null, locTimer: null, bgLocTimer: null,
  unreadChat: 0,
  activeSOS: null, // { sosId, fromUserId, fromName, isMe }
  globalLocShare: true, // 전체 위치 공유 켜기/끄기
  MCOLORS: ['#7c3aed','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
}
const AVATARS = ['🐻','🦊','🐱','🐶','🐸','🐧','🐨','🦁','🐯','🐺','🦄','🐼']

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
function initAuth() {
  const saved = localStorage.getItem('meetup_auth')
  if (saved) {
    try {
      const d = JSON.parse(saved)
      S.token=d.token; S.userId=d.userId; S.displayName=d.displayName; S.avatar=d.avatar
      S.globalLocShare = localStorage.getItem('meetup_loc_share') !== 'false'
      startApp(); return
    } catch(e) { localStorage.removeItem('meetup_auth') }
  }
  renderAvatarGrid()
}
function renderAvatarGrid() {
  let sel = AVATARS[0]
  document.getElementById('avatar-grid').innerHTML = AVATARS.map((a,i) =>
    '<button class="avatar-btn'+(i===0?' selected':'')+'" onclick="selectAvatar(\''+a+'\',this)">'+a+'</button>'
  ).join('')
  window._selAvatar = sel
}
function selectAvatar(a, el) {
  window._selAvatar = a
  document.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('selected'))
  el.classList.add('selected')
}
function switchAuthTab(tab) {
  document.getElementById('form-login').style.display = tab==='login'?'block':'none'
  document.getElementById('form-register').style.display = tab==='register'?'block':'none'
  document.querySelectorAll('.auth-tab').forEach((b,i)=>b.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register')))
  document.getElementById('auth-error').style.display='none'
}
function showAuthError(msg) {
  const el=document.getElementById('auth-error'); el.textContent=msg; el.style.display='block'
}
async function doLogin() {
  const userId=document.getElementById('login-id').value.trim()
  const password=document.getElementById('login-pw').value
  if(!userId||!password){showAuthError('아이디와 비밀번호를 입력해주세요');return}
  try {
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password})})
    const d=await r.json()
    if(!r.ok){showAuthError(d.error||'로그인 실패');return}
    saveAuth(d); startApp()
  } catch(e){showAuthError('서버 연결 실패 - KV 스토리지를 설정해주세요')}
}
async function doRegister() {
  const userId=document.getElementById('reg-id').value.trim()
  const password=document.getElementById('reg-pw').value
  const displayName=document.getElementById('reg-name').value.trim()
  const avatar=window._selAvatar||AVATARS[0]
  if(!userId||!password||!displayName){showAuthError('모든 항목을 입력해주세요');return}
  try {
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password,displayName,avatar})})
    const d=await r.json()
    if(!r.ok){showAuthError(d.error||'회원가입 실패');return}
    saveAuth(d); startApp()
  } catch(e){showAuthError('서버 연결 실패 - KV 스토리지를 설정해주세요')}
}
function saveAuth(d) {
  S.token=d.token; S.userId=d.userId; S.displayName=d.displayName; S.avatar=d.avatar
  localStorage.setItem('meetup_auth',JSON.stringify({token:d.token,userId:d.userId,displayName:d.displayName,avatar:d.avatar}))
}
function doLogout() {
  if(!confirm('로그아웃 하시겠습니까?'))return
  clearInterval(S.pollTimer); clearInterval(S.locTimer); clearInterval(S.bgLocTimer)
  // SW에 로그아웃 알림 → 백그라운드 위치 전송 중지
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if(reg.active) reg.active.postMessage({ type: 'LOGOUT' })
    }).catch(()=>{})
  }
  S.token=null; S.userId=null
  localStorage.removeItem('meetup_auth')
  location.reload()
}
function api(path, opts={}) {
  return fetch(path, { ...opts, headers: { 'Authorization': 'Bearer '+S.token, 'Content-Type':'application/json', ...(opts.headers||{}) } })
}

// ════════════════════════════════════════════════════════════
//  앱 시작
// ════════════════════════════════════════════════════════════
function startApp() {
  document.getElementById('screen-auth').style.display='none'
  document.getElementById('screen-main').classList.add('visible')
  document.getElementById('my-avatar-btn').textContent=S.avatar||'🐻'
  document.getElementById('profile-avatar').textContent=S.avatar||'🐻'
  document.getElementById('profile-name').textContent=S.displayName
  document.getElementById('profile-id').textContent='@'+S.userId
  updateLocShareUI()
  initMap()
  getLocation()
  fetchFriends()
  fetchFriendRequests()
  fetchAppointment()
  fetchRooms()
  fetchChat()
  registerSWLocTracking()
  // 위치 업로드: 30초마다 (앱 포커스 시)
  S.locTimer = setInterval(()=>{ if(S.globalLocShare) { getLocation(); uploadLocation() } }, 30000)
  // 폴링: 3초 기본, 각 기능 분산
  let pollCycle = 0
  S.pollTimer = setInterval(()=>{
    pollCycle++
    fetchChat()                                           // 3초마다
    if(pollCycle % 3 === 0) fetchFriends()               // 9초마다
    if(pollCycle % 4 === 0) fetchSOSCheck()              // 12초마다
    if(pollCycle % 5 === 0) fetchFriendRequests()        // 15초마다
    if(pollCycle % 7 === 0) fetchRooms()                 // 21초마다
    if(pollCycle >= 1000) pollCycle = 0                  // 오버플로우 방지
  }, 3000)
}

// ── 전체/전송 위치 공유 토글 ──────────────────────────────────
function toggleGlobalLoc() {
  S.globalLocShare = !S.globalLocShare
  localStorage.setItem('meetup_loc_share', S.globalLocShare)
  updateLocShareUI()
  showToast(S.globalLocShare ? '📡 위치 공유 켜짐' : '🔕 위치 공유 꺼짐', S.globalLocShare?'success':'info')
}
function toggleMyLocShare() { toggleGlobalLoc() }
function updateLocShareUI() {
  const toggle = document.getElementById('global-loc-toggle')
  const badge = document.getElementById('loc-share-badge')
  if(toggle) toggle.classList.toggle('on', S.globalLocShare)
  if(badge) { badge.style.display = S.globalLocShare ? 'flex' : 'none' }
}

// ── Service Worker 백그라운드 위치 추적 등록 ─────────────────
function registerSWLocTracking() {
  if(!('serviceWorker' in navigator)) return
  // SW가 활성화될 때까지 대기 후 메시지 전송
  navigator.serviceWorker.ready.then(reg => {
    if(reg.active) {
      reg.active.postMessage({ type: 'INIT_LOC', token: S.token, userId: S.userId })
    }
  }).catch(()=>{})
}
function notifySWLocation(lat, lng, accuracy) {
  if(!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then(reg => {
    if(reg.active) reg.active.postMessage({ type: 'UPDATE_LOC', lat, lng, accuracy })
  }).catch(()=>{})
}

// ════════════════════════════════════════════════════════════
//  위치
// ════════════════════════════════════════════════════════════
function getLocation() {
  if(!navigator.geolocation)return
  navigator.geolocation.getCurrentPosition(pos=>{
    S.lat=pos.coords.latitude; S.lng=pos.coords.longitude
    updateMyMarker(S.lat, S.lng)
    uploadLocation()
  },{enableHighAccuracy:true,timeout:8000,maximumAge:15000})
}
async function uploadLocation() {
  if(!S.token||!S.lat||!S.globalLocShare)return
  try{
    await api('/api/location',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng,accuracy:20})})
    // SW에 위치 데이터 전달 (앱이 꺼진 상태에서의 재전송용 캐시)
    notifySWLocation(S.lat, S.lng, 20)
  }catch(e){}
}

// ════════════════════════════════════════════════════════════
//  지도
// ════════════════════════════════════════════════════════════
function initMap() {
  const el=document.getElementById('kakaoMap')
  if(typeof kakao==='undefined'||!kakao.maps){
    el.innerHTML='<div class="map-no-key"><div class="icon">🗺️</div><h3>카카오맵 API 키 필요</h3><p>카카오 개발자 콘솔에서 JavaScript 앱 키를 발급받아 Cloudflare 시크릿에 등록해주세요</p><div class="guide"><p style="font-size:13px;font-weight:700;color:var(--accent3);margin-bottom:8px">✅ 지도 외 모든 기능 정상 동작</p><p>💬 채팅 · 👥 친구 · 📌 약속 · 🆘 SOS</p></div></div>'
    return
  }
  const center=new kakao.maps.LatLng(37.5665,126.9780)
  S.map=new kakao.maps.Map(el,{center,level:6})
  kakao.maps.event.addListener(S.map,'click',e=>{
    const l=e.latLng
    S.selectedPlace={name:'지도에서 선택한 위치',lat:l.getLat(),lng:l.getLng(),address:''}
    showSelectedPlace()
  })
}

function getColor(uid) { let h=0; for(let i=0;i<uid.length;i++)h=(h*31+uid.charCodeAt(i))%S.MCOLORS.length; return S.MCOLORS[h] }

function makeOverlayContent(avatar, name, color, isMe) {
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer">'
    +'<div style="width:46px;height:46px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid '+(isMe?'#a855f7':'white')+';box-shadow:0 4px 14px rgba(0,0,0,0.5);">'+avatar+'</div>'
    +'<div style="background:rgba(10,10,15,0.85);color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;white-space:nowrap;backdrop-filter:blur(4px);">'+name+'</div>'
    +'</div>'
}
function makeOverlayEl(html) {
  const el=document.createElement('div'); el.innerHTML=html; return el
}
function updateMyMarker(lat, lng) {
  if(!S.map||typeof kakao==='undefined')return
  const pos=new kakao.maps.LatLng(lat,lng)
  if(S.myMarker){ S.myMarker.setPosition(pos) }
  else {
    const content=makeOverlayEl(makeOverlayContent(S.avatar||'🐻',S.displayName||'나','#7c3aed',true))
    S.myMarker=new kakao.maps.CustomOverlay({position:pos,content,yAnchor:1.3})
    S.myMarker.setMap(S.map)
  }
}
function updateFriendMarker(f) {
  if(!S.map||typeof kakao==='undefined')return
  if(!f.location || !f.iViewFriend) {
    if(S.friendMarkers[f.userId]) { S.friendMarkers[f.userId].setMap(null); delete S.friendMarkers[f.userId] }
    return
  }
  const pos=new kakao.maps.LatLng(f.location.lat,f.location.lng)
  const color=getColor(f.userId)
  if(S.friendMarkers[f.userId]){ S.friendMarkers[f.userId].setPosition(pos) }
  else {
    const content=makeOverlayEl(makeOverlayContent(f.avatar||'🐻',f.displayName,color,false))
    S.friendMarkers[f.userId]=new kakao.maps.CustomOverlay({position:pos,content,yAnchor:1.3})
    S.friendMarkers[f.userId].setMap(S.map)
  }
}
function showMapBubble(uid, text, lat, lng) {
  if(!S.map||typeof kakao==='undefined')return
  const maxLen=28; const display=text.length>maxLen?text.slice(0,maxLen)+'…':text
  const color=uid===S.userId?'#7c3aed':getColor(uid)
  const el=document.createElement('div')
  el.className='msg-bubble-map'; el.style.background=color; el.textContent=display
  if(S.chatBubbleOverlays[uid]){ S.chatBubbleOverlays[uid].setMap(null) }
  clearTimeout(S.chatBubbleTimers[uid])
  const overlay=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lat,lng),content:el,yAnchor:2.2,zIndex:10})
  overlay.setMap(S.map); S.chatBubbleOverlays[uid]=overlay
  S.chatBubbleTimers[uid]=setTimeout(()=>{ overlay.setMap(null); delete S.chatBubbleOverlays[uid] },5000)
}
function centerMe() { if(S.map&&S.lat)S.map.setCenter(new kakao.maps.LatLng(S.lat,S.lng)) }
function centerAll() {
  if(!S.map||typeof kakao==='undefined')return
  const bounds=new kakao.maps.LatLngBounds()
  if(S.lat)bounds.extend(new kakao.maps.LatLng(S.lat,S.lng))
  for(const k in S.friendMarkers){ const pos=S.friendMarkers[k].getPosition(); bounds.extend(pos) }
  try{ S.map.setBounds(bounds) }catch(e){}
}

// ════════════════════════════════════════════════════════════
//  멤버바 렌더
// ════════════════════════════════════════════════════════════
function renderMemberBar() {
  const bar=document.getElementById('member-bar')
  if(!S.friends.length){ bar.innerHTML='<div style="color:var(--text3);font-size:12px;width:100%;text-align:center">친구를 추가하면 여기에 표시됩니다</div>'; return }
  const items=['<div class="member-item" onclick="centerMe()"><div class="member-avatar me">'+esc(S.avatar||'🐻')+'<div class="online-dot"></div></div><div class="member-name">나</div></div>']
  for(const f of S.friends){
    const hasLoc=!!f.location; const ago=hasLoc?getAgo(f.location.updatedAt):null
    const isOnline=hasLoc&&ago<120000
    items.push('<div class="member-item" onclick="focusFriend(\''+esc(f.userId)+'\')" data-uid="'+esc(f.userId)+'"><div class="member-avatar" style="border-color:'+(isOnline?getColor(f.userId):'transparent')+'">'+esc(f.avatar||'🐻')+(isOnline?'<div class="online-dot"></div>':'')+'</div><div class="member-name">'+esc(f.displayName)+'</div></div>')
  }
  bar.innerHTML=items.join('')
}
function focusFriend(uid) {
  const f=S.friends.find(x=>x.userId===uid)
  if(f?.location&&S.map&&typeof kakao!=='undefined'){S.map.setCenter(new kakao.maps.LatLng(f.location.lat,f.location.lng));S.map.setLevel(4);switchTab('map')}
}

// ════════════════════════════════════════════════════════════
//  친구 관리
// ════════════════════════════════════════════════════════════
async function fetchFriends() {
  if(!S.token)return
  try {
    const r=await api('/api/friends'); const d=await r.json()
    S.friends=d.friends||[]
    for(const f of S.friends) updateFriendMarker(f)
    renderMemberBar()
    renderChatRooms()
    renderFriendList()
  } catch(e){}
}
async function fetchFriendRequests() {
  if(!S.token)return
  try {
    const r=await api('/api/friends/requests'); const d=await r.json()
    S.pendingReqs=d.requests||[]
    const cnt=S.pendingReqs.length
    const rb=document.getElementById('req-badge'); const tb=document.getElementById('friends-tbadge')
    rb.style.display=cnt?'flex':'none'; if(cnt)rb.textContent=cnt
    tb.style.display=cnt?'flex':'none'; tb.textContent=cnt
    document.getElementById('req-section').style.display=cnt?'block':'none'
    document.getElementById('req-count-badge').textContent=cnt
    document.getElementById('req-list').innerHTML=S.pendingReqs.map(req=>
      '<div class="friend-item"><div class="friend-avatar">'+esc(req.fromAvatar||'🐻')+'</div><div class="friend-info"><div class="friend-name">'+esc(req.fromName)+'</div><div class="friend-id">@'+esc(req.from)+'</div></div><div class="friend-actions"><button class="f-btn accept" onclick="acceptReq(\''+esc(req.from)+'\')">수락</button><button class="f-btn reject" onclick="rejectReq(\''+esc(req.from)+'\')">거절</button></div></div>'
    ).join('')
  } catch(e){}
}
function renderFriendList() {
  const el=document.getElementById('friend-list')
  if(!S.friends.length){ el.innerHTML='<div class="empty-state"><div class="e-icon">👥</div><p>아직 친구가 없어요<br/>친구 아이디로 요청을 보내보세요!</p></div>'; return }
  el.innerHTML=S.friends.map(f=>{
    const hasLoc=!!f.location; const ago=hasLoc?getAgo(f.location.updatedAt):null
    const isOnline=hasLoc&&ago<120000
    const locStr=isOnline?'🟢 위치 공유 중 ('+Math.floor(ago/60000)+'분 전)':'⚫ 위치 없음'
    const uid=f.userId
    return '<div class="friend-item" id="fi-'+uid+'"><div class="friend-avatar">'+esc(f.avatar||'🐻')+'</div>'
      +'<div class="friend-info">'
      +'<div class="friend-name">'+esc(f.displayName)+'</div>'
      +'<div class="friend-id">@'+esc(uid)+'</div>'
      +'<div class="friend-status"><span class="dot'+(isOnline?' online':'')+'"></span>'+locStr+'</div>'
      +'</div>'
      +'<div class="friend-actions">'
      +'<button class="f-btn chat" onclick="chatWithFriend(\''+uid+'\',\''+esc(f.displayName)+'\')">💬</button>'
      +'<button class="f-btn reject" onclick="togglePermExpand(\''+uid+'\')" title="권한 설정">⚙️</button>'
      +'</div></div>'
      // 권한 설정 패널
      +'<div class="perm-expand" id="perm-'+uid+'">'
      +'<div class="perm-row"><span class="perm-label">📡 이 친구에게 내 위치 공유</span>'
      +'<div class="toggle-sw '+(f.iShareWithFriend!==false?'on':'')+'" id="share-sw-'+uid+'" onclick="toggleSharePerm(\''+uid+'\')"></div></div>'
      +'<div class="perm-row"><span class="perm-label">👁️ 이 친구 위치 지도에 표시</span>'
      +'<div class="toggle-sw '+(f.iViewFriend!==false?'on':'')+'" id="view-sw-'+uid+'" onclick="toggleViewPerm(\''+uid+'\')"></div></div>'
      +'</div>'
  }).join('<div style="height:1px;background:var(--border);margin:0 0"></div>')
}
function togglePermExpand(uid) {
  const el=document.getElementById('perm-'+uid)
  if(el) el.classList.toggle('show')
}
async function toggleSharePerm(uid) {
  const sw=document.getElementById('share-sw-'+uid)
  const nowOn=sw.classList.contains('on')
  sw.classList.toggle('on')
  await api('/api/location/permission',{method:'POST',body:JSON.stringify({friendId:uid,allow:!nowOn})})
  showToast((!nowOn?'📡 ':'🔕 ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+'에게 위치 '+ (!nowOn?'공개':'비공개'), 'info')
}
async function toggleViewPerm(uid) {
  const sw=document.getElementById('view-sw-'+uid)
  const nowOn=sw.classList.contains('on')
  sw.classList.toggle('on')
  await api('/api/location/view',{method:'POST',body:JSON.stringify({friendId:uid,show:!nowOn})})
  // 즉시 마커 업데이트
  const f=S.friends.find(x=>x.userId===uid)
  if(f){ f.iViewFriend=!nowOn; updateFriendMarker(f) }
  showToast((!nowOn?'👁️ ':'🙈 ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+' 위치 '+ (!nowOn?'표시':'숨김'), 'info')
}
async function sendFriendReq() {
  const tid=document.getElementById('friend-id-input').value.trim().toLowerCase()
  if(!tid){showToast('아이디를 입력해주세요','error');return}
  try {
    const r=await api('/api/friends/request',{method:'POST',body:JSON.stringify({targetUserId:tid})})
    const d=await r.json()
    if(!r.ok){showToast(d.error||'요청 실패','error');return}
    document.getElementById('friend-id-input').value=''
    showToast(d.auto_accepted?'🎉 친구 추가 완료!':'📨 친구 요청 전송!','success')
    if(d.auto_accepted)fetchFriends()
  } catch(e){showToast('요청 실패','error')}
}
async function acceptReq(fromId) {
  try {
    await api('/api/friends/accept',{method:'POST',body:JSON.stringify({fromUserId:fromId})})
    showToast('🎉 친구 요청 수락!','success'); fetchFriends(); fetchFriendRequests()
  } catch(e){}
}
async function rejectReq(fromId) {
  try { await api('/api/friends/reject',{method:'POST',body:JSON.stringify({fromUserId:fromId})}); fetchFriendRequests() } catch(e){}
}

// ════════════════════════════════════════════════════════════
//  채팅방
// ════════════════════════════════════════════════════════════
async function fetchRooms() {
  if(!S.token)return
  try {
    const r=await api('/api/rooms'); const d=await r.json()
    S.rooms=d.rooms||[]
    renderChatRooms()
  } catch(e){}
}
function renderChatRooms() {
  const sel=document.getElementById('chat-room-select')
  // everyone + 1:1 친구방 + 그룹방
  const chips=['<div class="room-chip'+(S.currentRoom==='everyone'?' active':'')+'" data-room="everyone" data-name="🌍 전체 채팅">🌍 전체</div>']
  // 친구 1:1
  for(const f of S.friends){
    const roomId=[S.userId,f.userId].sort().join('_')
    chips.push('<div class="room-chip'+(S.currentRoom===roomId?' active':'')+'" data-room="'+roomId+'" data-name="'+esc(f.displayName)+'">'+(f.avatar||'🐻')+' '+esc(f.displayName)+'</div>')
  }
  // 그룹 채팅방
  for(const rm of S.rooms){
    if(rm.type==='group'){
      chips.push('<div class="room-chip'+(S.currentRoom===rm.roomId?' active':'')+'" data-room="'+rm.roomId+'" data-name="'+esc(rm.name)+'">👥 '+esc(rm.name)+'<span class="chip-close" onclick="leaveRoom(event,\''+rm.roomId+'\')">✕</span></div>')
    }
  }
  sel.innerHTML=chips.join('')
}

function selectRoom(roomId, roomName) {
  S.currentRoom=roomId; S.currentRoomName=roomName||roomId; S.lastChatTs=0
  document.querySelectorAll('.room-chip').forEach(c=>c.classList.toggle('active',c.dataset.room===roomId))
  document.getElementById('chat-room-name').textContent=S.currentRoomName
  document.getElementById('chat-msgs').innerHTML=''
  fetchChat()
}
function chatWithFriend(uid, name) {
  const roomId=[S.userId,uid].sort().join('_')
  switchTab('chat')
  setTimeout(()=>selectRoom(roomId,name),100)
}

function openCreateRoom() {
  // 친구 목록 렌더
  const list=document.getElementById('member-select-list')
  list.innerHTML=S.friends.map(f=>
    '<div class="member-select-item" data-uid="'+f.userId+'" onclick="toggleMemberSelect(this)">'
    +'<div class="member-select-check"></div>'
    +'<span style="font-size:20px">'+esc(f.avatar||'🐻')+'</span>'
    +'<div><div style="font-size:14px;font-weight:600">'+esc(f.displayName)+'</div><div style="font-size:12px;color:var(--text2)">@'+esc(f.userId)+'</div></div>'
    +'</div>'
  ).join('')
  document.getElementById('create-room-panel').classList.add('show')
}
function closeCreateRoom() { document.getElementById('create-room-panel').classList.remove('show') }
function toggleMemberSelect(el) { el.classList.toggle('selected') }

async function createRoom() {
  const name=document.getElementById('new-room-name').value.trim()
  if(!name){showToast('채팅방 이름을 입력해주세요','error');return}
  const selected=[...document.querySelectorAll('.member-select-item.selected')].map(el=>el.dataset.uid)
  if(!selected.length){showToast('친구를 1명 이상 선택해주세요','error');return}
  try{
    const r=await api('/api/rooms',{method:'POST',body:JSON.stringify({name,memberIds:selected})})
    const d=await r.json()
    if(!r.ok){showToast('채팅방 생성 실패','error');return}
    closeCreateRoom()
    document.getElementById('new-room-name').value=''
    showToast('💬 채팅방 "'+esc(name)+'" 생성!','success')
    await fetchRooms()
    setTimeout(()=>selectRoom(d.room.roomId,d.room.name),300)
  } catch(e){showToast('생성 실패','error')}
}

async function leaveRoom(e, roomId) {
  e.stopPropagation()
  if(!confirm('이 채팅방에서 나가시겠습니까?'))return
  await api('/api/rooms/'+roomId+'/leave',{method:'POST'})
  if(S.currentRoom===roomId) selectRoom('everyone','🌍 전체 채팅')
  fetchRooms(); showToast('채팅방에서 나갔습니다','info')
}

// ════════════════════════════════════════════════════════════
//  채팅
// ════════════════════════════════════════════════════════════
async function fetchChat() {
  if(!S.token)return
  const roomId=S.currentRoom
  try {
    const r=await api('/api/chat/'+roomId+'?since='+S.lastChatTs)
    const d=await r.json()
    const msgs=d.messages||[]
    if(!msgs.length)return
    const container=document.getElementById('chat-msgs')
    let hasNew=false
    for(const m of msgs){
      if(m.timestamp>S.lastChatTs){
        appendMsg(m); S.lastChatTs=Math.max(S.lastChatTs,m.timestamp); hasNew=true
      }
    }
    if(hasNew){
      container.scrollTop=container.scrollHeight
      const activeTab=document.querySelector('.tab-btn.active')?.id
      if(activeTab!=='tbtn-chat'){
        S.unreadChat++; const b=document.getElementById('chat-tbadge')
        b.style.display='flex'; b.textContent=S.unreadChat>9?'9+':S.unreadChat
      }
    }
  } catch(e){}
}

function appendMsg(m) {
  const c=document.getElementById('chat-msgs')
  const isMe=m.userId===S.userId
  const isSys=m.type==='system'
  const isSOS=m.type==='sos'
  const t=new Date(m.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})
  if(isSys){c.insertAdjacentHTML('beforeend','<div class="msg-system">'+esc(m.message)+'</div>');return}
  // 지도 말풍선
  if(!isSOS&&m.type!=='location'){
    if(isMe&&S.lat&&S.lng) showMapBubble(m.userId,m.message,S.lat,S.lng)
    else { const fr=S.friends.find(f=>f.userId===m.userId); if(fr?.location)showMapBubble(m.userId,m.message,fr.location.lat,fr.location.lng) }
  }
  const cls=isSOS?'msg-row msg-sos':isMe?'msg-row me':'msg-row'
  const avatarHtml=isMe?'':'<div class="msg-avatar">'+(m.avatar||'🐻')+'</div>'
  const senderHtml=isMe?'':'<div class="msg-sender">'+esc(m.userName)+'</div>'
  const flexDir=isMe?';flex-direction:row-reverse':''
  c.insertAdjacentHTML('beforeend',
    '<div class="'+cls+'">'+avatarHtml+'<div class="msg-body">'+senderHtml
    +'<div style="display:flex;align-items:flex-end;gap:4px'+flexDir+'">'
    +'<div class="msg-bubble">'+esc(m.message)+'</div>'
    +'<div class="msg-time">'+t+'</div>'
    +'</div></div></div>')
}

async function sendChat() {
  const input=document.getElementById('chat-input')
  const msg=input.value.trim(); if(!msg)return
  input.value=''
  try {
    await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg})})
    setTimeout(fetchChat,200)
  } catch(e){showToast('전송 실패','error')}
}
async function shareMyLocInChat() {
  if(!S.lat){showToast('위치를 가져오는 중...','info');return}
  const msg='📍 내 현재 위치 https://map.kakao.com/link/map/'+S.displayName+','+S.lat+','+S.lng
  try{await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg,type:'location'})});setTimeout(fetchChat,200)}catch(e){}
}

// ════════════════════════════════════════════════════════════
//  SOS
// ════════════════════════════════════════════════════════════
async function sendSOS() {
  if(!confirm('🆘 SOS를 모든 친구에게 보내시겠습니까?'))return
  try {
    const r=await api('/api/sos',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng})})
    const d=await r.json()
    showToast('🆘 SOS 전송 완료!','sos')
    // 내 SOS 알림도 바로 표시 (종료 버튼 보이도록)
    S.activeSOS={ sosId:d.sosId, fromUserId:S.userId, fromName:S.displayName, isMe:true }
    showSOSBanner(S.displayName+'님(나)의 SOS가 발신되었습니다', '내 SOS 활성 중', true)
    setTimeout(fetchChat,300)
  } catch(e){showToast('SOS 전송 실패','error')}
}

function showSOSBanner(msg, title, isMe) {
  const banner=document.getElementById('sos-banner')
  document.getElementById('sos-banner-title-text').textContent='🆘 '+(title||'SOS 긴급 알림')
  document.getElementById('sos-banner-msg').textContent=msg
  const ackBtn=document.getElementById('sos-ack-btn')
  const dismissBtn=document.getElementById('sos-dismiss-btn')
  ackBtn.style.display=isMe?'none':'flex'
  dismissBtn.style.display=isMe?'flex':'none'
  banner.classList.add('show')
  // 진동 (긴급)
  if(navigator.vibrate) navigator.vibrate([400,150,400,150,400,150,800])
  // 화면 상단 SOS 배너가 탑바를 가리므로 메인 화면 패딩 조정
  document.getElementById('screen-main').style.paddingTop='88px'
  // 데스크탑 알림
  if(Notification.permission==='granted'&&!isMe){
    new Notification('🆘 SOS 긴급 알림', {
      body: msg, icon: '/icon-192.png',
      tag: 'sos-'+(S.activeSOS?.sosId||''), requireInteraction: true
    })
  }
  // 탭 타이틀 깜빡임
  if(!isMe) startTitleBlink('🆘 SOS!')
}
function hideSOSBanner() {
  document.getElementById('sos-banner').classList.remove('show')
  document.getElementById('screen-main').style.paddingTop=''
  S.activeSOS=null
  stopTitleBlink()
}
let _titleBlinkTimer=null, _origTitle='모여봐'
function startTitleBlink(msg){
  stopTitleBlink()
  let on=true
  _titleBlinkTimer=setInterval(()=>{ document.title=on?msg:_origTitle; on=!on },800)
}
function stopTitleBlink(){
  if(_titleBlinkTimer){clearInterval(_titleBlinkTimer);_titleBlinkTimer=null}
  document.title=_origTitle
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sos-ack-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/acknowledge',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('✅ SOS 확인 완료','success')
    hideSOSBanner()
    setTimeout(fetchChat,300)
  })
  document.getElementById('sos-dismiss-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/dismiss',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('🟢 SOS 종료되었습니다','success')
    hideSOSBanner()
    setTimeout(fetchChat,300)
  })
})

async function fetchSOSCheck() {
  if(!S.token)return
  try {
    const r=await api('/api/sos/check?since='+S.lastSOSTs)
    const d=await r.json()
    for(const s of (d.sos||[])){
      if(s.timestamp>S.lastSOSTs){
        S.lastSOSTs=Math.max(S.lastSOSTs,s.timestamp)
        // 내가 보낸 SOS가 아닌 것만 알림 + 활성 상태인 것만
        if(s.userId!==S.userId&&s.active!==false){
          // 이미 표시 중인 SOS와 다른 경우만 갱신
          if(!S.activeSOS||S.activeSOS.sosId!==s.sosId){
            S.activeSOS={ sosId:s.sosId, fromUserId:s.userId, fromName:s.userName, isMe:false }
            showSOSBanner(s.message, s.userName+'님의 SOS!', false)
          }
        }
        // 이미 표시 중인 SOS가 종료됐으면 배너 닫기
        if(S.activeSOS&&S.activeSOS.sosId===s.sosId&&s.active===false){
          hideSOSBanner()
          showToast('🟢 SOS가 종료되었습니다','info')
        }
      }
    }
  } catch(e){}
}

// ════════════════════════════════════════════════════════════
//  약속장소
// ════════════════════════════════════════════════════════════
async function searchPlace() {
  const kw=document.getElementById('place-input').value.trim()
  if(!kw)return
  if(typeof kakao==='undefined'||!kakao.maps){showToast('카카오맵 API 키 필요','error');return}
  const ps=new kakao.maps.services.Places()
  ps.keywordSearch(kw,(result,status)=>{
    if(status!==kakao.maps.services.Status.OK){showToast('검색 결과 없음','info');return}
    window._plRes=result
    const el=document.getElementById('place-results'); el.style.display='block'
    el.innerHTML=result.slice(0,5).map((p,i)=>'<div class="place-item" onclick="selectPlace('+i+')"><div class="pname">'+esc(p.place_name)+'</div><div class="paddr">'+esc(p.address_name)+'</div></div>').join('')
  },{location:S.lat?new kakao.maps.LatLng(S.lat,S.lng):undefined})
}
function selectPlace(i) {
  const p=window._plRes[i]
  S.selectedPlace={name:p.place_name,lat:parseFloat(p.y),lng:parseFloat(p.x),address:p.address_name}
  document.getElementById('place-results').style.display='none'; showSelectedPlace()
}
function showSelectedPlace() {
  if(!S.selectedPlace)return
  const el=document.getElementById('selected-place'); el.style.display='block'
  document.getElementById('sp-name').textContent=S.selectedPlace.name
  document.getElementById('sp-addr').textContent=S.selectedPlace.address||S.selectedPlace.lat.toFixed(5)+', '+S.selectedPlace.lng.toFixed(5)
}
async function setAppointment() {
  if(!S.selectedPlace){showToast('장소를 먼저 선택해주세요','error');return}
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try {
    await api('/api/appointment',{method:'POST',body:JSON.stringify({roomId,placeName:S.selectedPlace.name,lat:S.selectedPlace.lat,lng:S.selectedPlace.lng})})
    showToast('📌 약속장소 지정 완료!','success'); await fetchAppointment()
    const aptMsg='📌 약속장소를 "'+S.selectedPlace.name+'"(으)로 지정했습니다'
    await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:aptMsg,type:'system'})})
  } catch(e){showToast('지정 실패','error')}
}
async function fetchAppointment() {
  if(!S.token)return
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try{const r=await api('/api/appointment/'+roomId);const d=await r.json();S.appointment=d.appointment;updateAptUI(d.appointment)}catch(e){}
}
function updateAptUI(apt) {
  if(!apt)return
  const chip=document.getElementById('apt-chip'); chip.style.display='flex'
  document.getElementById('apt-chip-name').textContent=apt.placeName
  const card=document.getElementById('cur-apt-card'); card.style.display='block'
  document.getElementById('cur-apt-name').textContent=apt.placeName
  if(S.map&&typeof kakao!=='undefined'){
    if(S.aptMarker)S.aptMarker.setMap(null)
    const content='<div style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;box-shadow:0 4px 16px rgba(239,68,68,0.5);">📌 '+esc(apt.placeName)+'</div>'
    S.aptMarker=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(apt.lat,apt.lng),content,yAnchor:1.6})
    S.aptMarker.setMap(S.map)
  }
}
function focusApt() {
  if(!S.appointment||!S.map||typeof kakao==='undefined')return
  S.map.setCenter(new kakao.maps.LatLng(S.appointment.lat,S.appointment.lng)); S.map.setLevel(4); switchTab('map')
}
function goToApptTab(){switchTab('appt');openTransit()}
async function findMidpoint() {
  if(!S.lat){showToast('내 위치를 먼저 가져와주세요','info');return}
  const locs=[{lat:S.lat,lng:S.lng},...S.friends.filter(f=>f.location).map(f=>f.location)]
  if(locs.length<2){showToast('친구의 위치 정보가 필요합니다','info');return}
  const midLat=locs.reduce((s,l)=>s+l.lat,0)/locs.length
  const midLng=locs.reduce((s,l)=>s+l.lng,0)/locs.length
  let name=midLat.toFixed(4)+', '+midLng.toFixed(4)
  if(typeof kakao!=='undefined'&&kakao.maps){
    const geo=new kakao.maps.services.Geocoder()
    geo.coord2Address(midLng,midLat,(res,st)=>{
      if(st===kakao.maps.services.Status.OK&&res[0])name=res[0].address.address_name
      S.midpointData={name,lat:midLat,lng:midLng}
      const el=document.getElementById('midpoint-result'); el.style.display='block'
      document.getElementById('mp-name').textContent=name
    })
  } else {
    S.midpointData={name,lat:midLat,lng:midLng}
    const el=document.getElementById('midpoint-result'); el.style.display='block'
    document.getElementById('mp-name').textContent=name
  }
}
function setMidpointAsApt(){ if(!S.midpointData)return; S.selectedPlace={name:S.midpointData.name,lat:S.midpointData.lat,lng:S.midpointData.lng,address:''}; showSelectedPlace(); setAppointment() }

// ════════════════════════════════════════════════════════════
//  대중교통
// ════════════════════════════════════════════════════════════
async function openTransit() {
  if(!S.appointment){showToast('약속장소를 먼저 지정해주세요','info');return}
  if(!S.lat){showToast('내 위치를 가져오는 중입니다','info');return}
  const panel=document.getElementById('transit-panel')
  panel.style.display='block'
  document.getElementById('transit-spinner').style.display='block'
  document.getElementById('transit-results').innerHTML=''
  try {
    const r=await api('/api/transit?sx='+S.lng+'&sy='+S.lat+'&ex='+S.appointment.lng+'&ey='+S.appointment.lat)
    const d=await r.json()
    document.getElementById('transit-spinner').style.display='none'
    renderTransit(d)
  } catch(e){
    document.getElementById('transit-spinner').style.display='none'
    document.getElementById('transit-results').innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">조회 실패</p>'
  }
}
function closeTransit(){document.getElementById('transit-panel').style.display='none'}
function renderTransit(data) {
  const el=document.getElementById('transit-results'); let html=''
  if(data.demo)html+='<div class="transit-demo-note">⚠️ 데모 데이터 — ODsay API 키 설정 시 실제 경로 조회</div>'
  const paths=(data.result?.path||[]).slice(0,3)
  if(!paths.length){el.innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">경로 없음</p>';return}
  const typeMap={1:'지하철',2:'버스+지하철',3:'버스'}
  html+=paths.map(p=>{
    const info=p.info
    const steps=(p.subPath||[]).filter(sp=>sp.trafficType!==3).map(sp=>{
      const isS=sp.trafficType===1
      const name=isS?(sp.lane?.[0]?.name||'지하철'):(sp.lane?.[0]?.busNo||'버스')
      return '<div class="step-chip '+(isS?'subway':'bus')+'">'+(isS?'🚇':'🚌')+' '+name+'</div>'
    }).join('<span style="color:var(--text3);font-size:11px">▸</span>')
    return '<div class="transit-route"><div class="transit-top"><div class="transit-time">'+info.totalTime+'<span style="font-size:13px;font-weight:500;color:var(--text2)">분</span></div><div class="transit-tag">'+(typeMap[p.pathType]||'대중교통')+'</div></div><div class="transit-steps">'+steps+'<span style="font-size:11px;color:var(--text3)">📍'+(S.appointment?.placeName||'목적지')+'</span></div><div class="transit-meta"><span>💰 '+((info.payment||0).toLocaleString())+'원</span><span>🚇 지하철 '+(info.subwayTransitCount||0)+'회</span><span>🚌 버스 '+(info.busTransitCount||0)+'회</span></div></div>'
  }).join('')
  el.innerHTML=html
}

// ════════════════════════════════════════════════════════════
//  UI 유틸
// ════════════════════════════════════════════════════════════
function switchTab(tab) {
  ['map','chat','appt','friends'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('active',t===tab)
    document.getElementById('tbtn-'+t).classList.toggle('active',t===tab)
  })
  if(tab==='chat'){
    S.unreadChat=0; const b=document.getElementById('chat-tbadge'); b.style.display='none'
    setTimeout(()=>{ const m=document.getElementById('chat-msgs'); m.scrollTop=m.scrollHeight },100)
  }
  if(tab==='map'&&S.map&&typeof kakao!=='undefined')kakao.maps.event.trigger(S.map,'resize')
  if(tab==='friends'){fetchFriends();fetchFriendRequests()}
}
let _toastTimer=null
function showToast(msg, type='info') {
  const el=document.getElementById('toast')
  el.className='toast show'+(type?' '+type:''); el.textContent=msg
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>{el.className='toast'},3000)
}
function showProfileModal(){document.getElementById('profile-modal').classList.add('show')}
function closeProfileModal(e){if(e.target===document.getElementById('profile-modal'))document.getElementById('profile-modal').classList.remove('show')}
function toggleGlobalLocFromModal(){toggleGlobalLoc();document.getElementById('profile-modal').classList.remove('show')}
function getAgo(ts){return Date.now()-ts}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// ════════════════════════════════════════════════════════════
//  DOM Ready
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('chat-input')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}
  })
  document.getElementById('place-input')?.addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace()})
  document.getElementById('friend-id-input')?.addEventListener('keydown',e=>{if(e.key==='Enter')sendFriendReq()})
  document.getElementById('chat-room-select')?.addEventListener('click',e=>{
    const chip=e.target.closest('.room-chip')
    if(chip&&chip.dataset.room) selectRoom(chip.dataset.room, chip.dataset.name||chip.dataset.room)
  })
  initAuth()
  if(Notification.permission==='default') Notification.requestPermission()
})
</script>
</body>
</html>`
  return HTML
}

export default app
