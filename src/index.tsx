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
  // 'Bearer null' / 'Bearer undefined' 같은 잘못된 토큰 차단
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token || token === 'null' || token === 'undefined') return null
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
  if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401)
  return c.json({ success: true, userId: user.userId, displayName: user.displayName, avatar: user.avatar })
})

// ── 친구 ──────────────────────────────────────────────────────
async function acceptFriendship(kv: KVNamespace, a: string, b: string) {
  const [aRaw, bRaw] = await Promise.all([kv.get(`friends:${a}`), kv.get(`friends:${b}`)])
  const aList = aRaw ? JSON.parse(aRaw) : []
  const bList = bRaw ? JSON.parse(bRaw) : []
  if (!aList.includes(b)) aList.push(b)
  if (!bList.includes(a)) bList.push(a)
  await Promise.all([kv.put(`friends:${a}`, JSON.stringify(aList)), kv.put(`friends:${b}`, JSON.stringify(bList))])
}

app.post('/api/friends/request', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { targetUserId } = await c.req.json()
  const tid = targetUserId?.toLowerCase()
  if (!tid || tid === me.userId) return c.json({ error: '잘못된 요청' }, 400)
  const [targetRaw, friendsRaw, existing, reverseReq] = await Promise.all([
    c.env.KV.get(`user:${tid}`),
    c.env.KV.get(`friends:${me.userId}`),
    c.env.KV.get(`friend_req:${tid}:${me.userId}`),
    c.env.KV.get(`friend_req:${me.userId}:${tid}`)
  ])
  if (!targetRaw) return c.json({ error: '존재하지 않는 사용자입니다' }, 404)
  const myFriends = friendsRaw ? JSON.parse(friendsRaw) : []
  if (myFriends.includes(tid)) return c.json({ error: '이미 친구입니다' }, 409)
  if (existing) return c.json({ error: '이미 친구 요청을 보냈습니다' }, 409)
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
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { fromUserId } = await c.req.json()
  const fid = fromUserId?.toLowerCase()
  await Promise.all([
    acceptFriendship(c.env.KV, me.userId, fid),
    c.env.KV.delete(`friend_req:${me.userId}:${fid}`)
  ])
  return c.json({ success: true })
})

app.post('/api/friends/reject', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { fromUserId } = await c.req.json()
  await c.env.KV.delete(`friend_req:${me.userId}:${fromUserId?.toLowerCase()}`)
  return c.json({ success: true })
})

app.get('/api/friends/requests', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const list = await c.env.KV.list({ prefix: `friend_req:${me.userId}:` })
  const vals = await Promise.all(list.keys.map(k => c.env.KV.get(k.name)))
  const requests = vals.filter(Boolean).map(v => JSON.parse(v!))
  return c.json({ requests })
})

// ── 친구 목록 + 위치 (병렬 최적화) ───────────────────────────
app.get('/api/friends', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const [raw, myPermRaw, myViewRaw] = await Promise.all([
    c.env.KV.get(`friends:${me.userId}`),
    c.env.KV.get(`loc_perm:${me.userId}`),
    c.env.KV.get(`view_perm:${me.userId}`)
  ])
  const friendIds: string[] = raw ? JSON.parse(raw) : []
  const myPerm: Record<string, boolean> = myPermRaw ? JSON.parse(myPermRaw) : {}
  const myView: Record<string, boolean> = myViewRaw ? JSON.parse(myViewRaw) : {}
  if (!friendIds.length) return c.json({ friends: [] })
  const results = await Promise.all(friendIds.map(async fid => {
    const [ufRaw, fPermRaw, locRaw] = await Promise.all([
      c.env.KV.get(`user:${fid}`),
      c.env.KV.get(`loc_perm:${fid}`),
      myView[fid] !== false ? c.env.KV.get(`loc:${fid}`) : Promise.resolve(null)
    ])
    if (!ufRaw) return null
    const uf = JSON.parse(ufRaw)
    const fPerm: Record<string, boolean> = fPermRaw ? JSON.parse(fPermRaw) : {}
    const friendAllowsMe = fPerm[me.userId] !== false
    const iViewFriend = myView[fid] !== false
    const location = (friendAllowsMe && iViewFriend && locRaw) ? JSON.parse(locRaw) : null
    return { userId: uf.userId, displayName: uf.displayName, avatar: uf.avatar, location, iShareWithFriend: myPerm[fid] !== false, iViewFriend }
  }))
  return c.json({ friends: results.filter(Boolean) })
})

// ── 위치 업로드 ────────────────────────────────────────────────
app.post('/api/location', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { lat, lng, accuracy } = await c.req.json()
  if (!lat || !lng) return c.json({ error: 'lat/lng required' }, 400)
  await c.env.KV.put(`loc:${me.userId}`, JSON.stringify({ lat, lng, accuracy: accuracy || 20, updatedAt: Date.now() }), { expirationTtl: 3600 })
  return c.json({ success: true })
})

// ── 위치 공개 권한 설정 ────────────────────────────────────────
app.post('/api/location/permission', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { friendId, allow } = await c.req.json()
  const raw = await c.env.KV.get(`loc_perm:${me.userId}`)
  const perm: Record<string, boolean> = raw ? JSON.parse(raw) : {}
  perm[friendId.toLowerCase()] = !!allow
  await c.env.KV.put(`loc_perm:${me.userId}`, JSON.stringify(perm))
  return c.json({ success: true })
})

// ── 친구 위치 표시 설정 ────────────────────────────────────────
app.post('/api/location/view', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { friendId, show } = await c.req.json()
  const raw = await c.env.KV.get(`view_perm:${me.userId}`)
  const perm: Record<string, boolean> = raw ? JSON.parse(raw) : {}
  perm[friendId.toLowerCase()] = !!show
  await c.env.KV.put(`view_perm:${me.userId}`, JSON.stringify(perm))
  return c.json({ success: true })
})

// ── 채팅방 목록 조회 (everyone 제거) ──────────────────────────
app.get('/api/rooms', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const raw = await c.env.KV.get(`rooms:${me.userId}`)
  const roomIds: string[] = raw ? JSON.parse(raw) : []
  if (!roomIds.length) return c.json({ rooms: [] })
  const raws = await Promise.all(roomIds.map(rid => c.env.KV.get(`room:${rid}`)))
  const rooms = raws.filter(Boolean).map(r => JSON.parse(r!))
  return c.json({ rooms })
})

// ── 채팅방 생성 ───────────────────────────────────────────────
app.post('/api/rooms', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { name, memberIds } = await c.req.json()
  if (!name || !Array.isArray(memberIds)) return c.json({ error: 'name and memberIds required' }, 400)
  const allMembers = [...new Set([me.userId, ...memberIds.map((id: string) => id.toLowerCase())])]
  const roomId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const roomData = { roomId, name, type: 'group', members: allMembers, createdBy: me.userId, createdAt: Date.now(), locShare: false }
  await c.env.KV.put(`room:${roomId}`, JSON.stringify(roomData), { expirationTtl: 86400 * 30 })
  await Promise.all(allMembers.map(async uid => {
    const rawR = await c.env.KV.get(`rooms:${uid}`)
    const rList: string[] = rawR ? JSON.parse(rawR) : []
    if (!rList.includes(roomId)) rList.push(roomId)
    await c.env.KV.put(`rooms:${uid}`, JSON.stringify(rList))
  }))
  return c.json({ success: true, room: roomData })
})

// ── 채팅방 1:1 생성 or 기존 조회 ─────────────────────────────
app.post('/api/rooms/dm', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { targetUserId } = await c.req.json()
  const tid = targetUserId?.toLowerCase()
  if (!tid) return c.json({ error: 'targetUserId required' }, 400)
  const dmId = `dm_${[me.userId, tid].sort().join('_')}`
  const existing = await c.env.KV.get(`room:${dmId}`)
  if (existing) return c.json({ success: true, room: JSON.parse(existing) })
  const targetRaw = await c.env.KV.get(`user:${tid}`)
  if (!targetRaw) return c.json({ error: '존재하지 않는 사용자입니다' }, 404)
  const target = JSON.parse(targetRaw)
  const roomData = { roomId: dmId, name: target.displayName, type: 'dm', members: [me.userId, tid], createdBy: me.userId, createdAt: Date.now(), locShare: false }
  await c.env.KV.put(`room:${dmId}`, JSON.stringify(roomData), { expirationTtl: 86400 * 30 })
  await Promise.all([me.userId, tid].map(async uid => {
    const rawR = await c.env.KV.get(`rooms:${uid}`)
    const rList: string[] = rawR ? JSON.parse(rawR) : []
    if (!rList.includes(dmId)) rList.push(dmId)
    await c.env.KV.put(`rooms:${uid}`, JSON.stringify(rList))
  }))
  return c.json({ success: true, room: roomData })
})

// ── 채팅방 위치 공유 토글 ─────────────────────────────────────
app.post('/api/rooms/:roomId/locshare', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  const { enabled } = await c.req.json()
  const roomRaw = await c.env.KV.get(`room:${roomId}`)
  if (!roomRaw) return c.json({ error: 'Room not found' }, 404)
  const room = JSON.parse(roomRaw)
  if (!room.members.includes(me.userId)) return c.json({ error: 'Not a member' }, 403)
  room.locShare = !!enabled
  await c.env.KV.put(`room:${roomId}`, JSON.stringify(room), { expirationTtl: 86400 * 30 })
  return c.json({ success: true, locShare: room.locShare })
})

// ── 채팅방 멤버 위치 조회 ─────────────────────────────────────
app.get('/api/rooms/:roomId/locations', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  const roomRaw = await c.env.KV.get(`room:${roomId}`)
  if (!roomRaw) return c.json({ locations: [], locShare: false })
  const room = JSON.parse(roomRaw)
  if (!room.members.includes(me.userId)) return c.json({ error: 'Not a member' }, 403)
  if (!room.locShare) return c.json({ locations: [], locShare: false })
  const locs = await Promise.all(room.members.map(async (uid: string) => {
    const [userRaw, locRaw] = await Promise.all([c.env.KV.get(`user:${uid}`), c.env.KV.get(`loc:${uid}`)])
    if (!userRaw || !locRaw) return null
    const user = JSON.parse(userRaw)
    const loc = JSON.parse(locRaw)
    return { userId: uid, displayName: user.displayName, avatar: user.avatar, ...loc }
  }))
  return c.json({ locations: locs.filter(Boolean), locShare: true })
})

// ── 채팅방 나가기 ─────────────────────────────────────────────
app.post('/api/rooms/:roomId/leave', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  const rawR = await c.env.KV.get(`rooms:${me.userId}`)
  const rList: string[] = rawR ? JSON.parse(rawR) : []
  await c.env.KV.put(`rooms:${me.userId}`, JSON.stringify(rList.filter(r => r !== roomId)))
  return c.json({ success: true })
})

// ── 채팅 메시지 전송 ──────────────────────────────────────────
app.post('/api/chat', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { roomId, message, type } = await c.req.json()
  if (!roomId || !message) return c.json({ error: 'missing' }, 400)
  // 멤버 확인
  const roomRaw = await c.env.KV.get(`room:${roomId}`)
  if (!roomRaw) return c.json({ error: 'Room not found' }, 404)
  const room = JSON.parse(roomRaw)
  if (!room.members.includes(me.userId)) return c.json({ error: 'Not a member' }, 403)
  const ts = Date.now()
  const msgId = `${ts}_${Math.random().toString(36).substr(2, 6)}`
  await c.env.KV.put(`chat:${roomId}:${msgId}`, JSON.stringify({
    msgId, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message, type: type || 'text', timestamp: ts
  }), { expirationTtl: 86400 * 2 })
  return c.json({ success: true, msgId, timestamp: ts })
})

// ── 채팅 메시지 조회 (since 기반 최적화) ─────────────────────
app.get('/api/chat/:roomId', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const roomId = c.req.param('roomId')
  // 멤버 확인
  const roomRaw = await c.env.KV.get(`room:${roomId}`)
  if (!roomRaw) return c.json({ messages: [] })
  const room = JSON.parse(roomRaw)
  if (!room.members.includes(me.userId)) return c.json({ error: 'Not a member' }, 403)
  const since = Number(c.req.query('since') || '0')
  const list = await c.env.KV.list({ prefix: `chat:${roomId}:` })
  const filtered = list.keys.filter(k => {
    const ts = Number(k.name.split(':')[2]?.split('_')[0] || '0')
    return ts > since
  })
  if (!filtered.length) return c.json({ messages: [] })
  const vals = await Promise.all(filtered.map(k => c.env.KV.get(k.name)))
  const messages = vals.filter(Boolean).map(v => JSON.parse(v!)).filter(m => m.timestamp > since)
  messages.sort((a: any, b: any) => a.timestamp - b.timestamp)
  return c.json({ messages: messages.slice(-60) })
})

// ── SOS 발송 ──────────────────────────────────────────────────
app.post('/api/sos', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { lat, lng } = await c.req.json()
  const raw = await c.env.KV.get(`friends:${me.userId}`)
  const friendIds: string[] = raw ? JSON.parse(raw) : []
  const ts = Date.now()
  const sosId = `sos_${me.userId}_${ts}`
  await c.env.KV.put(`sos:${sosId}`, JSON.stringify({
    msgId: `${ts}_sos`, userId: me.userId, userName: me.displayName, avatar: me.avatar,
    message: `🆘 SOS! ${me.displayName}님이 긴급 도움을 요청합니다!`,
    lat, lng, sosId, targets: [me.userId, ...friendIds], timestamp: ts,
    active: true, acknowledgedBy: []
  }), { expirationTtl: 3600 })
  return c.json({ success: true, sosId })
})

// ── SOS 확인 ──────────────────────────────────────────────────
app.post('/api/sos/acknowledge', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { sosId } = await c.req.json()
  if (!sosId) return c.json({ error: 'sosId required' }, 400)
  const raw = await c.env.KV.get(`sos:${sosId}`)
  if (!raw) return c.json({ error: 'SOS not found' }, 404)
  const sos = JSON.parse(raw)
  if (!sos.acknowledgedBy.includes(me.userId)) sos.acknowledgedBy.push(me.userId)
  await c.env.KV.put(`sos:${sosId}`, JSON.stringify(sos), { expirationTtl: 3600 })
  return c.json({ success: true, acknowledgedBy: sos.acknowledgedBy })
})

// ── SOS 종료 ──────────────────────────────────────────────────
app.post('/api/sos/dismiss', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { sosId } = await c.req.json()
  if (!sosId) return c.json({ error: 'sosId required' }, 400)
  const raw = await c.env.KV.get(`sos:${sosId}`)
  if (!raw) return c.json({ error: 'SOS not found' }, 404)
  const sos = JSON.parse(raw)
  if (sos.userId !== me.userId) return c.json({ error: 'Only sender can dismiss' }, 403)
  sos.active = false
  await c.env.KV.put(`sos:${sosId}`, JSON.stringify(sos), { expirationTtl: 300 })
  return c.json({ success: true })
})

// ── SOS 폴링 (내 친구가 보낸 활성 SOS만) ────────────────────
app.get('/api/sos/check', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const since = Number(c.req.query('since') || '0')
  const list = await c.env.KV.list({ prefix: `sos:sos_` })
  const filtered = list.keys.filter(k => {
    const parts = k.name.split('_')
    const ts = Number(parts[parts.length - 1] || '0')
    return ts > since
  })
  if (!filtered.length) return c.json({ sos: [] })
  const vals = await Promise.all(filtered.map(k => c.env.KV.get(k.name)))
  const sos = vals.filter(Boolean).map(v => JSON.parse(v!))
    .filter(m => m.timestamp > since && Array.isArray(m.targets) && m.targets.includes(me.userId))
  return c.json({ sos })
})

// ── 약속장소 ──────────────────────────────────────────────────
app.post('/api/appointment', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const { roomId, placeName, lat, lng } = await c.req.json()
  await c.env.KV.put(`apt:${roomId}`, JSON.stringify({ placeName, lat, lng, setBy: me.displayName, setAt: Date.now() }), { expirationTtl: 86400 })
  return c.json({ success: true })
})

app.get('/api/appointment/:roomId', async (c) => {
  const me = await getUser(c)
  if (!me) return c.json({ success: false, error: 'Unauthorized' }, 401)
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
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
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
html{height:100%;height:-webkit-fill-available;overflow:hidden}
body{height:100%;height:100dvh;overflow:hidden;background:var(--bg);font-family:'Pretendard',sans-serif;color:var(--text);position:fixed;width:100%;}
input,textarea,button{font-family:inherit}
input{font-size:16px!important}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:4px}
/* 키보드 팝업 시 레이아웃 고정 (iOS/Android 모두) */
@supports(height:100dvh){
  html,body{height:100dvh}
  #screen-auth,#screen-main{height:100dvh}
}

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
.topbar{flex-shrink:0;padding:max(env(safe-area-inset-top,0px),14px) 16px 10px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-bottom:1px solid var(--border);z-index:10;}
.topbar-logo{display:flex;align-items:center;gap:8px}
.topbar-logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--pink));display:flex;align-items:center;justify-content:center;font-size:14px;}
.topbar-logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px}
.topbar-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:36px;height:36px;border-radius:10px;border:none;background:var(--surface);color:var(--text2);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all .15s;position:relative;}
.icon-btn:active{background:var(--surface2)}
.icon-btn .badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:8px;padding:0 3px;background:var(--red);font-size:9px;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
.tab-content{flex:1;overflow:hidden;position:relative;min-height:0}
.tab-pane{position:absolute;inset:0;overflow:hidden;display:none;flex-direction:column;contain:layout size}
.tab-pane.active{display:flex}
.tabbar{flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);background:var(--bg);border-top:1px solid var(--border);padding-bottom:max(env(safe-area-inset-bottom,0px),4px);}
/* tabbar 최소 높이 보장 */
.tab-btn{min-height:52px;padding:8px 0 6px;border:none;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--text3);cursor:pointer;transition:color .2s;position:relative;}
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
.map-overlay{position:absolute;inset:0;pointer-events:none;z-index:5}
.map-overlay *{pointer-events:auto}
.map-fab-group{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:8px}
.map-fab{width:44px;height:44px;border-radius:14px;border:none;background:rgba(18,18,26,0.88);backdrop-filter:blur(12px);border:1px solid var(--border2);color:var(--text);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:all .15s;}
.map-fab:active{transform:scale(0.95)}
.map-fab.accent{background:rgba(124,58,237,0.88);color:white;border-color:rgba(124,58,237,0.5)}
.apt-chip{position:absolute;top:14px;left:14px;right:68px;background:rgba(18,18,26,0.92);backdrop-filter:blur(12px);border:1px solid var(--border2);border-radius:14px;padding:8px 12px;display:none;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);}
.apt-chip .label{font-size:11px;color:var(--text2)}
.apt-chip .name{font-size:13px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.apt-chip .chip-btn{flex-shrink:0;background:var(--accent);color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;border:none;cursor:pointer;}
.sos-fab{position:absolute;bottom:20px;right:14px;width:64px;height:64px;border-radius:20px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;animation:sos-pulse 2s infinite;}
.sos-fab i{font-size:22px}
.sos-fab span{font-size:9px;font-weight:800;letter-spacing:1px}
@keyframes sos-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4),0 8px 24px rgba(239,68,68,0.3)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0),0 8px 24px rgba(239,68,68,0.2)}}
.member-bar{flex-shrink:0;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:0;overflow-x:auto;padding:8px 14px;min-height:66px;align-items:center;}
.member-bar::-webkit-scrollbar{display:none}
.member-item{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:0 7px;}
.member-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid transparent;position:relative;}
.member-avatar.me{border-color:var(--accent)}
.member-avatar .online-dot{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;background:var(--green);border:2px solid var(--bg);}
.member-name{font-size:10px;font-weight:600;color:var(--text2);max-width:48px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── SOS 배너 ────────────────────────── */
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
.chat-header{flex-shrink:0;padding:10px 12px 0;background:var(--bg);border-bottom:1px solid var(--border);}
.chat-rooms-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;align-items:center;}
.chat-rooms-scroll::-webkit-scrollbar{display:none}
.room-chip{flex-shrink:0;padding:7px 14px;border-radius:20px;border:1px solid var(--border2);background:var(--surface);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px;}
.room-chip.active{background:var(--accent);border-color:var(--accent);color:white}
.room-chip .chip-badge{background:var(--red);color:white;font-size:9px;font-weight:700;min-width:14px;height:14px;border-radius:7px;padding:0 3px;display:inline-flex;align-items:center;justify-content:center;}
.new-room-btn{flex-shrink:0;width:32px;height:32px;border-radius:50%;border:1px dashed var(--border2);background:transparent;color:var(--text3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;align-self:center;}
.chat-room-info{display:flex;align-items:center;justify-content:space-between;padding:8px 4px 10px;}
.chat-room-name{font-size:14px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chat-room-actions{display:flex;gap:6px;align-items:center;flex-shrink:0}
/* 채팅방 위치 공유 버튼 */
.room-loc-toggle{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid var(--border2);background:var(--surface2);color:var(--text2);transition:all .2s;white-space:nowrap;}
.room-loc-toggle .loc-dot{width:8px;height:8px;border-radius:50%;background:var(--text3);transition:background .2s;}
.room-loc-toggle.on{background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.4);color:#34d399;}
.room-loc-toggle.on .loc-dot{background:#10b981;box-shadow:0 0 6px #10b981;}
.leave-room-btn{width:28px;height:28px;border-radius:50%;border:none;background:transparent;color:var(--text3);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .15s;}
.leave-room-btn:hover{color:var(--red)}
.chat-msgs{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain;}
.msg-row{display:flex;align-items:flex-end;gap:6px}
.msg-row.me{flex-direction:row-reverse}
.msg-avatar{width:28px;height:28px;border-radius:50%;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--surface2)}
.msg-body{max-width:70%;display:flex;flex-direction:column;gap:2px}
.msg-row.me .msg-body{align-items:flex-end}
.msg-sender{font-size:10px;color:var(--text2);font-weight:500;padding:0 4px}
.msg-bubble{padding:8px 12px;border-radius:4px 16px 16px 16px;font-size:14px;line-height:1.5;word-break:break-word;background:var(--surface);color:var(--text);}
.msg-row.me .msg-bubble{background:var(--accent);color:white;border-radius:16px 4px 16px 16px}
.msg-time{font-size:10px;color:var(--text3);padding:0 4px;flex-shrink:0}
.msg-system{text-align:center;font-size:11px;color:var(--text3);padding:3px 0}
.msg-sos .msg-bubble{background:rgba(239,68,68,0.15)!important;border:1px solid rgba(239,68,68,0.4)!important;color:#fca5a5!important;border-radius:12px!important;}
.chat-input-bar{flex-shrink:0;padding:10px 12px 10px;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;min-height:64px;}
.chat-input-bar input{flex:1;background:var(--surface);border:1.5px solid var(--border2);border-radius:22px;padding:11px 16px;color:var(--text);outline:none;font-size:16px;transition:border-color .2s;min-height:44px;}
.chat-input-bar input:focus{border-color:var(--accent)}
.chat-input-bar input::placeholder{color:var(--text3)}
.send-btn{width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;box-shadow:0 4px 12px rgba(124,58,237,0.4);}
.send-btn:hover{transform:scale(1.05);box-shadow:0 6px 16px rgba(124,58,237,0.5);}
.send-btn:active{transform:scale(0.90);box-shadow:0 2px 8px rgba(124,58,237,0.3);}
.send-btn:disabled{background:var(--surface2);box-shadow:none;color:var(--text3);cursor:default;transform:none;}
.loc-share-btn{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--border2);background:var(--surface);color:var(--accent3);font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s;}
.loc-share-btn:active{transform:scale(0.92);background:var(--surface2);}

/* ── 채팅방 위치 패널 (바텀시트) ──── */
.room-loc-panel{position:absolute;bottom:0;left:0;right:0;z-index:40;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border2);transform:translateY(100%);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);max-height:55%;}
.room-loc-panel.show{transform:translateY(0)}
.room-loc-drag{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:10px auto 0;}
.room-loc-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;}
.room-loc-title{font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;}
.room-loc-close{background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer;padding:4px 8px;border-radius:6px;font-weight:600;}
.room-loc-list{display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:200px;padding:0 16px 16px;}
.room-loc-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg2);border-radius:12px;cursor:pointer;transition:background .15s;}
.room-loc-item:active{background:var(--bg3)}
.room-loc-avatar{font-size:22px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:50%;}
.room-loc-info{flex:1}
.room-loc-name{font-size:13px;font-weight:600}
.room-loc-time{font-size:11px;color:var(--text3);margin-top:2px}
.room-loc-arrow{color:var(--text3);font-size:11px}

/* ── 채팅방 만들기 패널 ─────────────── */
.create-room-panel{position:absolute;inset:0;background:var(--bg);z-index:20;display:none;flex-direction:column;}
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
.friend-avatar{width:46px;height:46px;border-radius:50%;font-size:22px;display:flex;align-items:center;justify-content:center;background:var(--surface2);flex-shrink:0;}
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
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:9999;background:var(--surface);color:var(--text);padding:11px 20px;border-radius:20px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid var(--border2);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;max-width:90vw;}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast.success{border-color:rgba(16,185,129,0.4);color:#34d399}
.toast.error{border-color:rgba(239,68,68,0.4);color:#fca5a5}
.toast.sos{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.5);color:#fca5a5}

/* ── 모달 ────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:none;align-items:flex-end;backdrop-filter:blur(4px);}
.modal-overlay.show{display:flex}
.modal-sheet{width:100%;background:var(--surface);border-radius:24px 24px 0 0;padding:24px;border-top:1px solid var(--border2);animation:sheetUp .25s ease-out;}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 20px}
/* 지도 말풍선 */
.msg-bubble-map{position:relative;background:#7c3aed;color:white;padding:6px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.45);max-width:160px;word-break:break-all;white-space:normal;line-height:1.3;}
</style>
</head>
<body>

<!-- SOS 배너 -->
<div class="sos-banner" id="sos-banner">
  <div class="sos-banner-title"><i class="fas fa-exclamation-triangle"></i><span id="sos-banner-title-text">SOS 긴급 알림</span></div>
  <div class="sos-banner-msg" id="sos-banner-msg"></div>
  <div class="sos-banner-btns">
    <button class="sos-banner-btn ack" id="sos-ack-btn">✅ 확인했어요</button>
    <button class="sos-banner-btn dismiss" id="sos-dismiss-btn" style="display:none">🟢 SOS 종료</button>
  </div>
</div>

<!-- ══ AUTH ══ -->
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

<!-- ══ MAIN APP ══ -->
<div id="screen-main">
  <div class="topbar">
    <div class="topbar-logo">
      <div class="topbar-logo-icon">📍</div>
      <span class="topbar-logo-text">모여봐</span>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="loc-share-toggle" onclick="toggleGlobalLoc()" title="내 위치 공유">
        <i class="fas fa-broadcast-tower"></i>
        <span class="badge" id="loc-share-badge" style="display:none;background:var(--green);font-size:8px">ON</span>
      </button>
      <button class="icon-btn" onclick="switchTab('friends')" title="친구 요청">
        <i class="fas fa-user-friends"></i>
        <span class="badge" id="req-badge" style="display:none"></span>
      </button>
      <button class="icon-btn" onclick="showProfileModal()" title="프로필">
        <span id="my-avatar-btn" style="font-size:18px">🐻</span>
      </button>
    </div>
  </div>

  <div class="tab-content">
    <!-- 지도 -->
    <div class="tab-pane active" id="tab-map">
      <div style="flex:1;position:relative">
        <div id="kakaoMap"></div>
        <div class="map-overlay">
          <div class="apt-chip" id="apt-chip">
            <span style="font-size:16px">📌</span>
            <div style="flex:1;min-width:0"><div class="label">약속장소</div><div class="name" id="apt-chip-name"></div></div>
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

    <!-- 채팅 -->
    <div class="tab-pane" id="tab-chat">
      <!-- 채팅방 만들기 패널 -->
      <div class="create-room-panel" id="create-room-panel">
        <div class="create-room-header">
          <button onclick="closeCreateRoom()" style="background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:4px"><i class="fas fa-arrow-left"></i></button>
          <h3>새 채팅방</h3>
        </div>
        <div class="create-room-body">
          <div class="field"><label>채팅방 이름 (그룹용)</label><input id="new-room-name" type="text" placeholder="예) 여름 여행 계획" maxlength="20"/></div>
          <div>
            <div class="section-label">친구 선택 (1명 = 1:1 채팅)</div>
            <div class="member-select-list" id="member-select-list"></div>
          </div>
        </div>
        <div class="create-room-footer">
          <button class="btn-accent" onclick="createRoom()">채팅방 만들기</button>
        </div>
      </div>

      <div class="chat-header">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="chat-rooms-scroll" id="chat-room-select"></div>
          <button class="new-room-btn" onclick="openCreateRoom()" title="새 채팅방"><i class="fas fa-plus"></i></button>
        </div>
        <div class="chat-room-info">
          <div class="chat-room-name" id="chat-room-name">채팅방을 선택하세요</div>
          <div class="chat-room-actions">
            <button class="room-loc-toggle" id="room-loc-btn" onclick="toggleRoomLocShare()" style="display:none">
              <div class="loc-dot"></div><span id="room-loc-btn-text">위치 공유</span>
            </button>
          </div>
        </div>
      </div>
      <div class="chat-msgs" id="chat-msgs"><div class="empty-state" style="margin:auto"><div class="e-icon">💬</div><p>채팅방을 선택하거나<br/>새로 만들어보세요</p></div></div>
      <div class="chat-input-bar">
        <button class="loc-share-btn" onclick="shareMyLocInChat()" title="내 위치 공유"><i class="fas fa-map-marker-alt"></i></button>
        <input id="chat-input" type="text" placeholder="메시지를 입력하세요" maxlength="200" disabled autocomplete="off" autocorrect="off" spellcheck="false"/>
        <button class="send-btn" id="send-btn" onclick="sendChat()" disabled title="보내기"><i class="fas fa-paper-plane"></i></button>
      </div>
      <!-- 채팅방 위치 공유 바텀시트 패널 -->
      <div class="room-loc-panel" id="room-loc-panel">
        <div class="room-loc-drag"></div>
        <div class="room-loc-header">
          <div class="room-loc-title">📍 채팅방 멤버 위치</div>
          <button class="room-loc-close" onclick="closeRoomLocPanel()">닫기</button>
        </div>
        <div class="room-loc-list" id="room-loc-list"></div>
      </div>
    </div>

    <!-- 약속 -->
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
          <div class="spinner" id="transit-spinner" style="display:none"></div>
          <div id="transit-results"></div>
        </div>
      </div>
    </div>

    <!-- 친구 -->
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
          <div class="card"><div id="friend-list"><div class="empty-state"><div class="e-icon">👥</div><p>아직 친구가 없어요</p></div></div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="tabbar">
    <button class="tab-btn active" id="tbtn-map" onclick="switchTab('map')"><i class="fas fa-map-marked-alt"></i><span>지도</span></button>
    <button class="tab-btn" id="tbtn-chat" onclick="switchTab('chat')"><i class="fas fa-comment-dots"></i><span>채팅</span><span class="tbadge" id="chat-tbadge"></span></button>
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
      <div><div id="profile-name" style="font-size:20px;font-weight:800"></div><div id="profile-id" style="font-size:13px;color:var(--text2);margin-top:2px"></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:8px">위치 공유 전체 설정</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border-radius:10px;">
        <span style="font-size:14px;color:var(--text)"><i class="fas fa-broadcast-tower" style="color:var(--accent3);margin-right:8px"></i>내 위치 공유 중</span>
        <div class="toggle-sw" id="global-loc-toggle" onclick="toggleGlobalLoc()"></div>
      </div>
    </div>
    <button onclick="doLogout()" style="width:100%;padding:13px;border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:rgba(239,68,68,0.1);color:#fca5a5;font-size:14px;font-weight:700;cursor:pointer">로그아웃</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services"></script>
<script>
// ════════════════════════════════════════════════════════
//  SERVICE WORKER 등록
// ════════════════════════════════════════════════════════
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{})
}

// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
const S = {
  // ── 인증 상태: loading | authenticated | unauthenticated
  authState:'loading',
  token:null, userId:null, displayName:null, avatar:null,
  lat:null, lng:null,
  map:null, myMarker:null, friendMarkers:{},
  chatBubbleOverlays:{}, chatBubbleTimers:{},
  aptMarker:null, appointment:null,
  friends:[], pendingReqs:[],
  rooms:[], currentRoom:null, currentRoomName:'',
  currentRoomData:null,
  lastChatTs:0, lastSOSTs:0,
  selectedPlace:null, midpointData:null,
  pollTimer:null, locTimer:null,
  unreadChat:0, roomUnread:{},
  activeSOS:null,
  globalLocShare:true,
  locPanelOpen:false,
  MCOLORS:['#7c3aed','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
  _friendsHash:'', _roomsHash:'', _reqHash:'',
}
const AVATARS=['🐻','🦊','🐱','🐶','🐸','🐧','🐨','🦁','🐯','🐺','🦄','🐼']

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════

// 인증 상태 전환 중 auth 화면이 순간 보이는 깜빡임 방지:
// html에 #screen-auth를 기본 숨김(opacity:0)으로 두고
// loading 완료 후 최종 상태로만 표시한다.
function setAuthState(state){
  S.authState = state
  const authEl = document.getElementById('screen-auth')
  const mainEl = document.getElementById('screen-main')
  if(state === 'loading'){
    // 양쪽 모두 숨김 — 깜빡임 없음
    authEl.style.display = 'none'
    mainEl.classList.remove('visible')
  } else if(state === 'authenticated'){
    authEl.style.display = 'none'
    mainEl.classList.add('visible')
  } else {
    // unauthenticated
    authEl.style.display = 'flex'
    mainEl.classList.remove('visible')
  }
}

async function initAuth(){
  setAuthState('loading')
  const saved = localStorage.getItem('meetup_auth')
  if(!saved){ setAuthState('unauthenticated'); renderAvatarGrid(); return }
  let d
  try{ d = JSON.parse(saved) }catch(e){ localStorage.removeItem('meetup_auth'); setAuthState('unauthenticated'); renderAvatarGrid(); return }
  // 토큰이 null/undefined 문자열이면 바로 폐기
  if(!d.token || d.token === 'null' || d.token === 'undefined'){
    localStorage.removeItem('meetup_auth'); setAuthState('unauthenticated'); renderAvatarGrid(); return
  }
  // /api/me 로 서버 측 세션 검증 (새로고침 안정화)
  try{
    const r = await fetch('/api/me', { headers:{ 'Authorization':'Bearer '+d.token } })
    if(!r.ok){ throw new Error('session_expired') }
    const me = await r.json()
    // 서버 데이터로 S 갱신 (localStorage 값과 불일치 방지)
    d.displayName = me.displayName
    d.avatar = me.avatar
    d.userId = me.userId
    localStorage.setItem('meetup_auth', JSON.stringify(d))
  }catch(e){
    localStorage.removeItem('meetup_auth')
    setAuthState('unauthenticated'); renderAvatarGrid(); return
  }
  S.token=d.token; S.userId=d.userId; S.displayName=d.displayName; S.avatar=d.avatar
  S.globalLocShare = localStorage.getItem('meetup_loc_share') !== 'false'
  setAuthState('authenticated')
  startApp()
}
function renderAvatarGrid(){
  window._selAvatar=AVATARS[0]
  document.getElementById('avatar-grid').innerHTML=AVATARS.map((a,i)=>'<button class="avatar-btn'+(i===0?' selected':'')+'" onclick="selectAvatar(\''+a+'\',this)">'+a+'</button>').join('')
}
function selectAvatar(a,el){window._selAvatar=a;document.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('selected'));el.classList.add('selected')}
function switchAuthTab(tab){document.getElementById('form-login').style.display=tab==='login'?'block':'none';document.getElementById('form-register').style.display=tab==='register'?'block':'none';document.querySelectorAll('.auth-tab').forEach((b,i)=>b.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register')));document.getElementById('auth-error').style.display='none'}
function showAuthError(msg){const el=document.getElementById('auth-error');el.textContent=msg;el.style.display='block'}
async function doLogin(){
  const userId=document.getElementById('login-id').value.trim()
  const password=document.getElementById('login-pw').value
  if(!userId||!password){showAuthError('아이디와 비밀번호를 입력해주세요');return}
  try{
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password})})
    const d=await r.json()
    if(!r.ok){showAuthError(d.error||'로그인 실패');return}
    saveAuth(d)
    S.globalLocShare=localStorage.getItem('meetup_loc_share')!=='false'
    setAuthState('authenticated')
    startApp()
  }catch(e){showAuthError('서버 연결 실패')}
}
async function doRegister(){
  const userId=document.getElementById('reg-id').value.trim()
  const password=document.getElementById('reg-pw').value
  const displayName=document.getElementById('reg-name').value.trim()
  const avatar=window._selAvatar||AVATARS[0]
  if(!userId||!password||!displayName){showAuthError('모든 항목을 입력해주세요');return}
  try{
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password,displayName,avatar})})
    const d=await r.json()
    if(!r.ok){showAuthError(d.error||'회원가입 실패');return}
    saveAuth(d)
    S.globalLocShare=true
    setAuthState('authenticated')
    startApp()
  }catch(e){showAuthError('서버 연결 실패')}
}
function saveAuth(d){
  S.token=d.token; S.userId=d.userId; S.displayName=d.displayName; S.avatar=d.avatar
  localStorage.setItem('meetup_auth',JSON.stringify({token:d.token,userId:d.userId,displayName:d.displayName,avatar:d.avatar}))
}

// 상태 완전 초기화 (로그아웃 / 세션 만료 공용)
function resetState(){
  clearInterval(S.pollTimer); clearInterval(S.locTimer)
  S.pollTimer=null; S.locTimer=null
  S.token=null; S.userId=null; S.displayName=null; S.avatar=null
  S.lat=null; S.lng=null
  S.friends=[]; S.pendingReqs=[]
  S.rooms=[]; S.currentRoom=null; S.currentRoomName=''; S.currentRoomData=null
  S.lastChatTs=0; S.lastSOSTs=0
  S.unreadChat=0; S.roomUnread={}
  S.activeSOS=null
  S._friendsHash=''; S._roomsHash=''; S._reqHash=''
  S.appointment=null; S.selectedPlace=null; S.midpointData=null
  S.locPanelOpen=false
  // 지도 마커 정리
  if(S.myMarker){ try{S.myMarker.setMap(null)}catch(e){} ; S.myMarker=null }
  Object.values(S.friendMarkers).forEach(m=>{try{m.setMap(null)}catch(e){}})
  S.friendMarkers={}
  if(S.aptMarker){ try{S.aptMarker.setMap(null)}catch(e){} ; S.aptMarker=null }
}

function doLogout(){
  if(!confirm('로그아웃 하시겠습니까?'))return
  if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'LOGOUT'})}).catch(()=>{})
  localStorage.removeItem('meetup_auth')
  resetState()
  // 채팅 입력/전송 버튼 비활성화
  const ci=document.getElementById('chat-input');if(ci){ci.disabled=true;ci.value=''}
  const sb=document.getElementById('send-btn');if(sb)sb.disabled=true
  document.getElementById('chat-msgs').innerHTML='<div class="empty-state" style="margin:auto"><div class="e-icon">💬</div><p>채팅방을 선택하거나<br/>새로 만들어보세요</p></div>'
  document.getElementById('chat-room-select').innerHTML=''
  document.getElementById('room-loc-btn').style.display='none'
  renderAvatarGrid()
  setAuthState('unauthenticated')
}

// api() : S.token이 없으면 요청을 보내지 않고 바로 401 유사 응답 반환
function api(path,opts={}){
  if(!S.token) return Promise.resolve(new Response(JSON.stringify({success:false,error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json'}}))
  return fetch(path,{...opts,headers:{'Authorization':'Bearer '+S.token,'Content-Type':'application/json',...(opts.headers||{})}})
    .then(r=>{
      // 401 수신 시 세션 만료 처리
      if(r.status===401 && S.token){
        console.warn('[meetup] 세션 만료 — 로그인 화면으로 이동')
        localStorage.removeItem('meetup_auth')
        resetState()
        renderAvatarGrid()
        setAuthState('unauthenticated')
        showToast('로그인이 만료되었습니다. 다시 로그인해주세요.','error')
      }
      return r
    })
}

// ════════════════════════════════════════════════════════
//  앱 시작 & 폴링 (성능 최적화)
// ════════════════════════════════════════════════════════
function startApp(){
  // 화면 전환은 setAuthState('authenticated')에서 처리 — 중복 호출 방지
  document.getElementById('my-avatar-btn').textContent=S.avatar||'🐻'
  document.getElementById('profile-avatar').textContent=S.avatar||'🐻'
  document.getElementById('profile-name').textContent=S.displayName
  document.getElementById('profile-id').textContent='@'+S.userId
  updateLocShareUI()
  initMap()
  getLocation()
  Promise.all([fetchFriends(), fetchFriendRequests(), fetchRooms()])
  if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'INIT_LOC',token:S.token,userId:S.userId})}).catch(()=>{})
  // 위치 업로드: 30초 (전역 공유 ON일 때만)
  S.locTimer=setInterval(()=>{if(S.globalLocShare)uploadLocation()},30000)
  // 폴링: 사이클 기반으로 API 호출 분산
  // cycle=0: chat(현재방)
  // cycle%3: friends(9초)
  // cycle%5: SOS(15초)
  // cycle%7: friendReqs(21초)
  // cycle%10: rooms(30초)
  // locPanel: panel 열린 경우만 cycle%2(6초)
  let cycle=0
  S.pollTimer=setInterval(()=>{
    cycle=(cycle+1)%120
    if(S.currentRoom)fetchChat()
    if(cycle%3===0)fetchFriends()
    if(cycle%5===0)fetchSOSCheck()
    if(cycle%7===0)fetchFriendRequests()
    if(cycle%10===0)fetchRooms()
    if(S.locPanelOpen&&cycle%2===0)fetchRoomLocations()
  },3000)
}

function toggleGlobalLoc(){
  S.globalLocShare=!S.globalLocShare
  localStorage.setItem('meetup_loc_share',S.globalLocShare)
  updateLocShareUI()
  showToast(S.globalLocShare?'📡 위치 공유 켜짐':'🔕 위치 공유 꺼짐',S.globalLocShare?'success':'info')
  if(S.globalLocShare)uploadLocation()
}
function updateLocShareUI(){const t=document.getElementById('global-loc-toggle');const b=document.getElementById('loc-share-badge');if(t)t.classList.toggle('on',S.globalLocShare);if(b)b.style.display=S.globalLocShare?'flex':'none'}

// ════════════════════════════════════════════════════════
//  위치
// ════════════════════════════════════════════════════════
function getLocation(){
  if(!navigator.geolocation)return
  navigator.geolocation.getCurrentPosition(pos=>{
    S.lat=pos.coords.latitude;S.lng=pos.coords.longitude
    updateMyMarker(S.lat,S.lng)
    if(S.globalLocShare)uploadLocation()
  },{enableHighAccuracy:true,timeout:8000,maximumAge:20000})
}
async function uploadLocation(){
  if(!S.token||!S.lat||!S.globalLocShare)return
  try{
    await api('/api/location',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng,accuracy:20})})
    if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'UPDATE_LOC',lat:S.lat,lng:S.lng,accuracy:20})}).catch(()=>{})
  }catch(e){}
}

// ════════════════════════════════════════════════════════
//  지도
// ════════════════════════════════════════════════════════
function initMap(){
  const el=document.getElementById('kakaoMap')
  if(typeof kakao==='undefined'||!kakao.maps){
    el.innerHTML='<div class="map-no-key"><div class="icon">🗺️</div><h3>카카오맵 API 키 필요</h3><p>카카오 개발자 콘솔에서 JavaScript 앱 키를 발급받아 Cloudflare 시크릿에 등록해주세요</p></div>'
    return
  }
  S.map=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(37.5665,126.9780),level:6})
  kakao.maps.event.addListener(S.map,'click',e=>{const l=e.latLng;S.selectedPlace={name:'지도에서 선택한 위치',lat:l.getLat(),lng:l.getLng(),address:''};showSelectedPlace()})
}
function getColor(uid){let h=0;for(let i=0;i<uid.length;i++)h=(h*31+uid.charCodeAt(i))%S.MCOLORS.length;return S.MCOLORS[h]}
function makeOverlayEl(avatar,name,color,isMe){
  const d=document.createElement('div');d.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer'
  d.innerHTML='<div style="width:44px;height:44px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid '+(isMe?'#a855f7':'white')+';box-shadow:0 4px 14px rgba(0,0,0,0.5);">'+avatar+'</div><div style="background:rgba(10,10,15,0.85);color:white;font-size:10px;font-weight:700;padding:2px 7px;border-radius:7px;white-space:nowrap;backdrop-filter:blur(4px);">'+name+'</div>'
  return d
}
function updateMyMarker(lat,lng){
  if(!S.map||typeof kakao==='undefined')return
  const pos=new kakao.maps.LatLng(lat,lng)
  if(S.myMarker){S.myMarker.setPosition(pos)}
  else{S.myMarker=new kakao.maps.CustomOverlay({position:pos,content:makeOverlayEl(S.avatar||'🐻',S.displayName||'나','#7c3aed',true),yAnchor:1.3});S.myMarker.setMap(S.map)}
}
function updateFriendMarker(f){
  if(!S.map||typeof kakao==='undefined')return
  if(!f.location||!f.iViewFriend){if(S.friendMarkers[f.userId]){S.friendMarkers[f.userId].setMap(null);delete S.friendMarkers[f.userId]}return}
  const pos=new kakao.maps.LatLng(f.location.lat,f.location.lng)
  if(S.friendMarkers[f.userId]){S.friendMarkers[f.userId].setPosition(pos)}
  else{const ov=new kakao.maps.CustomOverlay({position:pos,content:makeOverlayEl(f.avatar||'🐻',f.displayName,getColor(f.userId),false),yAnchor:1.3});ov.setMap(S.map);S.friendMarkers[f.userId]=ov}
}
function showMapBubble(uid,text,lat,lng){
  if(!S.map||typeof kakao==='undefined')return
  const el=document.createElement('div');el.className='msg-bubble-map';el.style.background=uid===S.userId?'#7c3aed':getColor(uid);el.textContent=text.length>26?text.slice(0,26)+'…':text
  if(S.chatBubbleOverlays[uid])S.chatBubbleOverlays[uid].setMap(null)
  clearTimeout(S.chatBubbleTimers[uid])
  const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lat,lng),content:el,yAnchor:2.2,zIndex:10});ov.setMap(S.map);S.chatBubbleOverlays[uid]=ov
  S.chatBubbleTimers[uid]=setTimeout(()=>{ov.setMap(null);delete S.chatBubbleOverlays[uid]},5000)
}
function centerMe(){if(S.map&&S.lat)S.map.setCenter(new kakao.maps.LatLng(S.lat,S.lng))}
function centerAll(){
  if(!S.map||typeof kakao==='undefined')return
  const b=new kakao.maps.LatLngBounds()
  if(S.lat)b.extend(new kakao.maps.LatLng(S.lat,S.lng))
  Object.values(S.friendMarkers).forEach(m=>b.extend(m.getPosition()))
  try{S.map.setBounds(b)}catch(e){}
}

// ════════════════════════════════════════════════════════
//  멤버바
// ════════════════════════════════════════════════════════
function renderMemberBar(){
  const bar=document.getElementById('member-bar')
  if(!S.friends.length){bar.innerHTML='<div style="color:var(--text3);font-size:12px;width:100%;text-align:center">친구를 추가하면 여기에 표시됩니다</div>';return}
  let html='<div class="member-item" onclick="centerMe()"><div class="member-avatar me">'+esc(S.avatar||'🐻')+'<div class="online-dot"></div></div><div class="member-name">나</div></div>'
  for(const f of S.friends){
    const isOnline=f.location&&(Date.now()-f.location.updatedAt)<120000
    html+='<div class="member-item" onclick="focusFriend(\''+esc(f.userId)+'\')"><div class="member-avatar" style="border-color:'+(isOnline?getColor(f.userId):'transparent')+'">'+esc(f.avatar||'🐻')+(isOnline?'<div class="online-dot"></div>':'')+'</div><div class="member-name">'+esc(f.displayName)+'</div></div>'
  }
  bar.innerHTML=html
}
function focusFriend(uid){const f=S.friends.find(x=>x.userId===uid);if(f?.location&&S.map&&typeof kakao!=='undefined'){S.map.setCenter(new kakao.maps.LatLng(f.location.lat,f.location.lng));S.map.setLevel(4);switchTab('map')}}

// ════════════════════════════════════════════════════════
//  친구 (성능: 해시 비교로 불필요 렌더링 방지)
// ════════════════════════════════════════════════════════
async function fetchFriends(){
  if(!S.token)return
  try{
    const r=await api('/api/friends');const d=await r.json()
    const hash=JSON.stringify(d.friends||[])
    if(hash===S._friendsHash)return  // 변경 없으면 스킵
    S._friendsHash=hash
    S.friends=d.friends||[]
    for(const f of S.friends)updateFriendMarker(f)
    renderMemberBar();renderFriendList()
  }catch(e){}
}
async function fetchFriendRequests(){
  if(!S.token)return
  try{
    const r=await api('/api/friends/requests');const d=await r.json()
    const hash=JSON.stringify(d.requests||[])
    if(hash===S._reqHash)return
    S._reqHash=hash
    S.pendingReqs=d.requests||[]
    const cnt=S.pendingReqs.length
    const rb=document.getElementById('req-badge');const tb=document.getElementById('friends-tbadge')
    rb.style.display=cnt?'flex':'none';if(cnt)rb.textContent=cnt
    tb.style.display=cnt?'flex':'none';tb.textContent=cnt
    document.getElementById('req-section').style.display=cnt?'block':'none'
    document.getElementById('req-count-badge').textContent=cnt
    document.getElementById('req-list').innerHTML=S.pendingReqs.map(req=>'<div class="friend-item"><div class="friend-avatar">'+esc(req.fromAvatar||'🐻')+'</div><div class="friend-info"><div class="friend-name">'+esc(req.fromName)+'</div><div class="friend-id">@'+esc(req.from)+'</div></div><div class="friend-actions"><button class="f-btn accept" onclick="acceptReq(\''+esc(req.from)+'\')">수락</button><button class="f-btn reject" onclick="rejectReq(\''+esc(req.from)+'\')">거절</button></div></div>').join('')
  }catch(e){}
}
function renderFriendList(){
  const el=document.getElementById('friend-list')
  if(!S.friends.length){el.innerHTML='<div class="empty-state"><div class="e-icon">👥</div><p>아직 친구가 없어요<br/>친구 아이디로 요청을 보내보세요!</p></div>';return}
  el.innerHTML=S.friends.map(f=>{
    const isOnline=f.location&&(Date.now()-f.location.updatedAt)<120000
    const locStr=isOnline?'🟢 위치 공유 중 ('+Math.floor((Date.now()-f.location.updatedAt)/60000)+'분 전)':'⚫ 위치 없음'
    const uid=f.userId
    return '<div class="friend-item"><div class="friend-avatar">'+esc(f.avatar||'🐻')+'</div><div class="friend-info"><div class="friend-name">'+esc(f.displayName)+'</div><div class="friend-id">@'+esc(uid)+'</div><div class="friend-status"><span class="dot'+(isOnline?' online':'')+'"></span>'+locStr+'</div></div><div class="friend-actions"><button class="f-btn chat" onclick="openDM(\''+uid+'\',\''+esc(f.displayName)+'\',\''+esc(f.avatar||'🐻')+'\')">💬</button><button class="f-btn reject" onclick="togglePermExpand(\''+uid+'\')" title="권한">⚙️</button></div></div><div class="perm-expand" id="perm-'+uid+'"><div class="perm-row"><span class="perm-label">📡 이 친구에게 내 위치 공유</span><div class="toggle-sw '+(f.iShareWithFriend!==false?'on':'')+'" id="share-sw-'+uid+'" onclick="toggleSharePerm(\''+uid+'\')"></div></div><div class="perm-row"><span class="perm-label">👁️ 이 친구 위치 지도에 표시</span><div class="toggle-sw '+(f.iViewFriend!==false?'on':'')+'" id="view-sw-'+uid+'" onclick="toggleViewPerm(\''+uid+'\')"></div></div></div>'
  }).join('<div style="height:1px;background:var(--border)"></div>')
}
function togglePermExpand(uid){document.getElementById('perm-'+uid)?.classList.toggle('show')}
async function toggleSharePerm(uid){const sw=document.getElementById('share-sw-'+uid);const on=sw.classList.contains('on');sw.classList.toggle('on');await api('/api/location/permission',{method:'POST',body:JSON.stringify({friendId:uid,allow:!on})});showToast((!on?'📡 ':'🔕 ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+(!on?' 위치 공개':' 위치 차단'),'info')}
async function toggleViewPerm(uid){const sw=document.getElementById('view-sw-'+uid);const on=sw.classList.contains('on');sw.classList.toggle('on');await api('/api/location/view',{method:'POST',body:JSON.stringify({friendId:uid,show:!on})});const f=S.friends.find(x=>x.userId===uid);if(f){f.iViewFriend=!on;updateFriendMarker(f)};showToast((!on?'👁️ ':'🙈 ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+(!on?' 표시':' 숨김'),'info')}
async function sendFriendReq(){
  const tid=document.getElementById('friend-id-input').value.trim().toLowerCase()
  if(!tid){showToast('아이디를 입력해주세요','error');return}
  try{const r=await api('/api/friends/request',{method:'POST',body:JSON.stringify({targetUserId:tid})});const d=await r.json();if(!r.ok){showToast(d.error||'요청 실패','error');return}document.getElementById('friend-id-input').value='';showToast(d.auto_accepted?'🎉 친구 추가 완료!':'📨 친구 요청 전송!','success');if(d.auto_accepted)fetchFriends()}catch(e){showToast('요청 실패','error')}
}
async function acceptReq(fromId){try{await api('/api/friends/accept',{method:'POST',body:JSON.stringify({fromUserId:fromId})});showToast('🎉 친구 수락!','success');S._reqHash='';S._friendsHash='';fetchFriends();fetchFriendRequests()}catch(e){}}
async function rejectReq(fromId){try{await api('/api/friends/reject',{method:'POST',body:JSON.stringify({fromUserId:fromId})});S._reqHash='';fetchFriendRequests()}catch(e){}}

// ════════════════════════════════════════════════════════
//  채팅방 (성능: 해시 비교)
// ════════════════════════════════════════════════════════
async function fetchRooms(){
  if(!S.token)return
  try{
    const r=await api('/api/rooms');const d=await r.json()
    const hash=JSON.stringify(d.rooms||[])
    if(hash===S._roomsHash)return
    S._roomsHash=hash
    S.rooms=d.rooms||[]
    renderChatRooms()
  }catch(e){}
}

function renderChatRooms(){
  const sel=document.getElementById('chat-room-select')
  if(!S.rooms.length){sel.innerHTML='<div style="color:var(--text3);font-size:12px;padding:8px 4px">채팅방이 없어요. + 버튼으로 만들어보세요!</div>';return}
  sel.innerHTML=S.rooms.map(rm=>{
    const isActive=S.currentRoom===rm.roomId
    const unread=S.roomUnread[rm.roomId]||0
    const icon=rm.type==='dm'?'':'👥 '
    return '<div class="room-chip'+(isActive?' active':'')+'" data-room="'+rm.roomId+'" data-name="'+esc(rm.name)+'">'+icon+esc(rm.name)+(unread?'<span class="chip-badge">'+unread+'</span>':'')+'</div>'
  }).join('')
}

function selectRoom(roomId,roomName){
  S.currentRoom=roomId;S.currentRoomName=roomName||roomId;S.lastChatTs=0
  S.currentRoomData=S.rooms.find(r=>r.roomId===roomId)||null
  S.roomUnread[roomId]=0
  document.querySelectorAll('.room-chip').forEach(c=>c.classList.toggle('active',c.dataset.room===roomId))
  document.getElementById('chat-room-name').textContent=S.currentRoomName
  document.getElementById('chat-msgs').innerHTML=''
  const ci=document.getElementById('chat-input')
  ci.disabled=false
  ci.placeholder='메시지를 입력하세요'
  ci.value=''
  document.getElementById('send-btn').disabled=true
  updateRoomLocBtn()
  fetchChat()
  closeRoomLocPanel()
}

function updateRoomLocBtn(){
  const btn=document.getElementById('room-loc-btn')
  if(!S.currentRoomData){btn.style.display='none';return}
  btn.style.display='flex'
  const active=S.currentRoomData.locShare
  btn.classList.toggle('on',active)
  document.getElementById('room-loc-btn-text').textContent=active?'위치공유 ON':'위치공유 OFF'
}

async function toggleRoomLocShare(){
  if(!S.currentRoom||!S.currentRoomData)return
  const newState=!S.currentRoomData.locShare
  try{
    const r=await api('/api/rooms/'+S.currentRoom+'/locshare',{method:'POST',body:JSON.stringify({enabled:newState})})
    const d=await r.json()
    S.currentRoomData.locShare=d.locShare
    const rm=S.rooms.find(r=>r.roomId===S.currentRoom);if(rm)rm.locShare=d.locShare
    S._roomsHash=''  // 강제 새로고침
    updateRoomLocBtn()
    showToast(d.locShare?'📍 위치 공유 켜짐 — 멤버 위치가 공유됩니다':'🔕 위치 공유 꺼짐',d.locShare?'success':'info')
    if(d.locShare){fetchRoomLocations();showRoomLocPanel()}else{closeRoomLocPanel()}
  }catch(e){showToast('설정 실패','error')}
}

async function fetchRoomLocations(){
  if(!S.currentRoom||!S.currentRoomData?.locShare)return
  try{
    const r=await api('/api/rooms/'+S.currentRoom+'/locations')
    const d=await r.json()
    if(!d.locShare){closeRoomLocPanel();return}
    renderRoomLocPanel(d.locations||[])
  }catch(e){}
}

function showRoomLocPanel(){S.locPanelOpen=true;document.getElementById('room-loc-panel').classList.add('show')}
function closeRoomLocPanel(){S.locPanelOpen=false;document.getElementById('room-loc-panel').classList.remove('show')}

function renderRoomLocPanel(locs){
  const el=document.getElementById('room-loc-list')
  if(!locs.length){el.innerHTML='<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px">아직 위치 데이터가 없습니다<br/><small style="font-size:11px">내 위치 공유를 켜두면 자동으로 표시됩니다</small></div>';return}
  el.innerHTML=locs.map(l=>{
    const ago=Math.floor((Date.now()-l.updatedAt)/1000)
    const agoStr=ago<60?ago+'초 전':Math.floor(ago/60)+'분 전'
    const isMe=l.userId===S.userId
    return '<div class="room-loc-item" onclick="focusLocOnMap('+l.lat+','+l.lng+')"><div class="room-loc-avatar">'+esc(l.avatar||'🐻')+'</div><div class="room-loc-info"><div class="room-loc-name">'+esc(l.displayName)+(isMe?' (나)':'')+'</div><div class="room-loc-time">'+agoStr+'</div></div><i class="fas fa-chevron-right room-loc-arrow"></i></div>'
  }).join('')
}

function focusLocOnMap(lat,lng){switchTab('map');setTimeout(()=>{if(S.map&&typeof kakao!=='undefined'){S.map.setCenter(new kakao.maps.LatLng(lat,lng));S.map.setLevel(4)}},100)}

// 1:1 채팅 (DM)
async function openDM(uid,name,avatar){
  try{
    const r=await api('/api/rooms/dm',{method:'POST',body:JSON.stringify({targetUserId:uid})})
    const d=await r.json()
    if(!r.ok){showToast('채팅 열기 실패','error');return}
    if(!S.rooms.find(r=>r.roomId===d.room.roomId)){S.rooms.unshift(d.room);S._roomsHash='';renderChatRooms()}
    switchTab('chat')
    setTimeout(()=>selectRoom(d.room.roomId,name),100)
  }catch(e){showToast('오류 발생','error')}
}

function openCreateRoom(){
  const list=document.getElementById('member-select-list')
  list.innerHTML=S.friends.map(f=>'<div class="member-select-item" data-uid="'+f.userId+'" onclick="toggleMemberSelect(this)"><div class="member-select-check"></div><span style="font-size:18px">'+esc(f.avatar||'🐻')+'</span><div><div style="font-size:14px;font-weight:600">'+esc(f.displayName)+'</div><div style="font-size:12px;color:var(--text2)">@'+esc(f.userId)+'</div></div></div>').join('')
  document.getElementById('create-room-panel').classList.add('show')
}
function closeCreateRoom(){document.getElementById('create-room-panel').classList.remove('show')}
function toggleMemberSelect(el){el.classList.toggle('selected')}

async function createRoom(){
  const name=document.getElementById('new-room-name').value.trim()
  const selected=[...document.querySelectorAll('.member-select-item.selected')].map(el=>el.dataset.uid)
  if(!selected.length){showToast('친구를 1명 이상 선택해주세요','error');return}
  if(selected.length===1&&!name){
    const f=S.friends.find(x=>x.userId===selected[0])
    if(f){closeCreateRoom();openDM(f.userId,f.displayName,f.avatar||'🐻');return}
  }
  if(!name){showToast('채팅방 이름을 입력해주세요','error');return}
  try{
    const r=await api('/api/rooms',{method:'POST',body:JSON.stringify({name,memberIds:selected})})
    const d=await r.json()
    if(!r.ok){showToast('생성 실패','error');return}
    closeCreateRoom();document.getElementById('new-room-name').value=''
    S.rooms.unshift(d.room);S._roomsHash='';renderChatRooms()
    showToast('💬 채팅방 "'+esc(name)+'" 생성!','success')
    setTimeout(()=>selectRoom(d.room.roomId,d.room.name),200)
  }catch(e){showToast('생성 실패','error')}
}

async function leaveRoom(roomId){
  if(!roomId||!confirm('채팅방에서 나가시겠습니까?'))return
  try{
    await api('/api/rooms/'+roomId+'/leave',{method:'POST'})
    S.rooms=S.rooms.filter(r=>r.roomId!==roomId);S._roomsHash=''
    renderChatRooms()
    if(S.currentRoom===roomId){S.currentRoom=null;S.currentRoomData=null;document.getElementById('chat-room-name').textContent='채팅방을 선택하세요';document.getElementById('chat-msgs').innerHTML='<div class="empty-state" style="margin:auto"><div class="e-icon">💬</div><p>채팅방을 선택하거나<br/>새로 만들어보세요</p></div>';document.getElementById('chat-input').disabled=true;document.getElementById('send-btn').disabled=true;document.getElementById('room-loc-btn').style.display='none';closeRoomLocPanel()}
    showToast('채팅방 나가기 완료','info')
  }catch(e){showToast('실패','error')}
}

// ════════════════════════════════════════════════════════
//  채팅 메시지 (DocumentFragment 최적화)
// ════════════════════════════════════════════════════════
async function fetchChat(){
  if(!S.token||!S.currentRoom)return
  const roomId=S.currentRoom
  try{
    const r=await api('/api/chat/'+roomId+'?since='+S.lastChatTs)
    if(!r.ok)return
    const d=await r.json()
    const msgs=d.messages||[]
    if(!msgs.length)return
    const container=document.getElementById('chat-msgs')
    const isAtBottom=container.scrollHeight-container.scrollTop-container.clientHeight<60
    const frag=document.createDocumentFragment()
    let hasNew=false
    for(const m of msgs){
      if(m.timestamp>S.lastChatTs){
        S.lastChatTs=Math.max(S.lastChatTs,m.timestamp);hasNew=true
        frag.appendChild(buildMsgEl(m))
      }
    }
    if(hasNew){
      // 초기 로드 시 empty-state 제거
      const empty=container.querySelector('.empty-state')
      if(empty)empty.remove()
      container.appendChild(frag)
      if(isAtBottom)container.scrollTop=container.scrollHeight
      const activeTab=document.querySelector('.tab-btn.active')?.id
      if(activeTab!=='tbtn-chat'||S.currentRoom!==roomId){
        S.unreadChat++;S.roomUnread[roomId]=(S.roomUnread[roomId]||0)+1
        const b=document.getElementById('chat-tbadge');b.style.display='flex';b.textContent=S.unreadChat>9?'9+':S.unreadChat
        renderChatRooms()
      }
    }
  }catch(e){}
}

function buildMsgEl(m){
  const isMe=m.userId===S.userId
  const isSys=m.type==='system'
  const isSOS=m.type==='sos'
  const t=new Date(m.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})
  const div=document.createElement('div')
  if(isSys){div.className='msg-system';div.textContent=m.message;return div}
  if(!isSOS&&m.type!=='location'){
    if(isMe&&S.lat&&S.lng)showMapBubble(m.userId,m.message,S.lat,S.lng)
    else{const fr=S.friends.find(f=>f.userId===m.userId);if(fr?.location)showMapBubble(m.userId,m.message,fr.location.lat,fr.location.lng)}
  }
  div.className=isSOS?'msg-row msg-sos':isMe?'msg-row me':'msg-row'
  div.innerHTML=(isMe?'':'<div class="msg-avatar">'+esc(m.avatar||'🐻')+'</div>')
    +'<div class="msg-body">'+(isMe?'':'<div class="msg-sender">'+esc(m.userName)+'</div>')
    +'<div style="display:flex;align-items:flex-end;gap:4px'+(isMe?';flex-direction:row-reverse':'')+'"><div class="msg-bubble">'+esc(m.message)+'</div><div class="msg-time">'+t+'</div></div></div>'
  return div
}

async function sendChat(){
  const input=document.getElementById('chat-input')
  const btn=document.getElementById('send-btn')
  const msg=input.value.trim();if(!msg||!S.currentRoom)return
  input.value=''
  if(btn)btn.disabled=true
  try{await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg})});fetchChat()}catch(e){showToast('전송 실패','error')}
  // 입력창 포커스 유지
  input.focus()
}
async function shareMyLocInChat(){
  if(!S.lat){showToast('위치를 가져오는 중...','info');return}
  if(!S.currentRoom){showToast('채팅방을 선택해주세요','info');return}
  const msg='📍 내 현재 위치 https://map.kakao.com/link/map/'+encodeURIComponent(S.displayName)+','+S.lat+','+S.lng
  try{await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg,type:'location'})});fetchChat()}catch(e){}
}

// ════════════════════════════════════════════════════════
//  SOS
// ════════════════════════════════════════════════════════
async function sendSOS(){
  if(!confirm('🆘 SOS를 모든 친구에게 보내시겠습니까?'))return
  try{
    const r=await api('/api/sos',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng})})
    const d=await r.json()
    showToast('🆘 SOS 전송 완료!','sos')
    S.activeSOS={sosId:d.sosId,fromUserId:S.userId,fromName:S.displayName,isMe:true}
    showSOSBanner(S.displayName+'님(나)의 SOS가 발신되었습니다','내 SOS 활성 중',true)
  }catch(e){showToast('SOS 전송 실패','error')}
}
function showSOSBanner(msg,title,isMe){
  document.getElementById('sos-banner-title-text').textContent='🆘 '+(title||'SOS 긴급 알림')
  document.getElementById('sos-banner-msg').textContent=msg
  document.getElementById('sos-ack-btn').style.display=isMe?'none':'flex'
  document.getElementById('sos-dismiss-btn').style.display=isMe?'flex':'none'
  document.getElementById('sos-banner').classList.add('show')
  document.getElementById('screen-main').style.paddingTop='100px'
  if(navigator.vibrate)navigator.vibrate([400,150,400,150,400,150,800])
  if(Notification.permission==='granted'&&!isMe)new Notification('🆘 SOS 긴급 알림',{body:msg,icon:'/icon-192.png',tag:'sos',requireInteraction:true})
  startTitleBlink('🆘 SOS!')
}
function hideSOSBanner(){document.getElementById('sos-banner').classList.remove('show');document.getElementById('screen-main').style.paddingTop='';S.activeSOS=null;stopTitleBlink()}
let _titleTimer=null,_origTitle='모여봐'
function startTitleBlink(msg){stopTitleBlink();let on=true;_titleTimer=setInterval(()=>{document.title=on?msg:_origTitle;on=!on},800)}
function stopTitleBlink(){if(_titleTimer){clearInterval(_titleTimer);_titleTimer=null};document.title=_origTitle}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sos-ack-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/acknowledge',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('✅ SOS 확인 완료','success');hideSOSBanner()
  })
  document.getElementById('sos-dismiss-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/dismiss',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('🟢 SOS 종료되었습니다','success');hideSOSBanner()
  })
})

async function fetchSOSCheck(){
  if(!S.token)return
  try{
    const r=await api('/api/sos/check?since='+S.lastSOSTs)
    const d=await r.json()
    for(const s of (d.sos||[])){
      if(s.timestamp>S.lastSOSTs){
        S.lastSOSTs=Math.max(S.lastSOSTs,s.timestamp)
        if(s.userId!==S.userId&&s.active!==false&&(!S.activeSOS||S.activeSOS.sosId!==s.sosId)){
          S.activeSOS={sosId:s.sosId,fromUserId:s.userId,fromName:s.userName,isMe:false}
          showSOSBanner(s.message,s.userName+'님의 SOS!',false)
        }
        if(S.activeSOS&&S.activeSOS.sosId===s.sosId&&s.active===false){hideSOSBanner();showToast('🟢 SOS가 종료되었습니다','info')}
      }
    }
  }catch(e){}
}

// ════════════════════════════════════════════════════════
//  약속장소
// ════════════════════════════════════════════════════════
async function searchPlace(){
  const kw=document.getElementById('place-input').value.trim()
  if(!kw)return
  if(typeof kakao==='undefined'||!kakao.maps){showToast('카카오맵 API 키 필요','error');return}
  const ps=new kakao.maps.services.Places()
  ps.keywordSearch(kw,(result,status)=>{
    if(status!==kakao.maps.services.Status.OK){showToast('검색 결과 없음','info');return}
    window._plRes=result
    const el=document.getElementById('place-results');el.style.display='block'
    el.innerHTML=result.slice(0,5).map((p,i)=>'<div class="place-item" onclick="selectPlace('+i+')"><div class="pname">'+esc(p.place_name)+'</div><div class="paddr">'+esc(p.address_name)+'</div></div>').join('')
  },{location:S.lat?new kakao.maps.LatLng(S.lat,S.lng):undefined})
}
function selectPlace(i){const p=window._plRes[i];S.selectedPlace={name:p.place_name,lat:parseFloat(p.y),lng:parseFloat(p.x),address:p.address_name};document.getElementById('place-results').style.display='none';showSelectedPlace()}
function showSelectedPlace(){if(!S.selectedPlace)return;const el=document.getElementById('selected-place');el.style.display='block';document.getElementById('sp-name').textContent=S.selectedPlace.name;document.getElementById('sp-addr').textContent=S.selectedPlace.address||S.selectedPlace.lat.toFixed(5)+', '+S.selectedPlace.lng.toFixed(5)}
async function setAppointment(){
  if(!S.selectedPlace){showToast('장소를 먼저 선택해주세요','error');return}
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try{await api('/api/appointment',{method:'POST',body:JSON.stringify({roomId,placeName:S.selectedPlace.name,lat:S.selectedPlace.lat,lng:S.selectedPlace.lng})});showToast('📌 약속장소 지정 완료!','success');await fetchAppointment()}catch(e){showToast('지정 실패','error')}
}
async function fetchAppointment(){
  if(!S.token||!S.friends.length)return
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try{const r=await api('/api/appointment/'+roomId);const d=await r.json();S.appointment=d.appointment;if(d.appointment)updateAptUI(d.appointment)}catch(e){}
}
function updateAptUI(apt){
  document.getElementById('apt-chip').style.display='flex'
  document.getElementById('apt-chip-name').textContent=apt.placeName
  document.getElementById('cur-apt-card').style.display='block'
  document.getElementById('cur-apt-name').textContent=apt.placeName
  if(S.map&&typeof kakao!=='undefined'){
    if(S.aptMarker)S.aptMarker.setMap(null)
    const el=document.createElement('div');el.style.cssText='background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:5px 11px;border-radius:11px;font-size:12px;font-weight:700;box-shadow:0 4px 16px rgba(239,68,68,0.5);white-space:nowrap';el.textContent='📌 '+apt.placeName
    S.aptMarker=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(apt.lat,apt.lng),content:el,yAnchor:1.6});S.aptMarker.setMap(S.map)
  }
}
function focusApt(){if(!S.appointment||!S.map||typeof kakao==='undefined')return;S.map.setCenter(new kakao.maps.LatLng(S.appointment.lat,S.appointment.lng));S.map.setLevel(4);switchTab('map')}
function goToApptTab(){switchTab('appt');openTransit()}
async function findMidpoint(){
  if(!S.lat){showToast('내 위치를 먼저 가져와주세요','info');return}
  const locs=[{lat:S.lat,lng:S.lng},...S.friends.filter(f=>f.location).map(f=>f.location)]
  if(locs.length<2){showToast('친구의 위치 정보가 필요합니다','info');return}
  const midLat=locs.reduce((s,l)=>s+l.lat,0)/locs.length
  const midLng=locs.reduce((s,l)=>s+l.lng,0)/locs.length
  let name=midLat.toFixed(4)+', '+midLng.toFixed(4)
  if(typeof kakao!=='undefined'&&kakao.maps){
    const geo=new kakao.maps.services.Geocoder()
    geo.coord2Address(midLng,midLat,(res,st)=>{if(st===kakao.maps.services.Status.OK&&res[0])name=res[0].address.address_name;S.midpointData={name,lat:midLat,lng:midLng};document.getElementById('midpoint-result').style.display='block';document.getElementById('mp-name').textContent=name})
  } else {S.midpointData={name,lat:midLat,lng:midLng};document.getElementById('midpoint-result').style.display='block';document.getElementById('mp-name').textContent=name}
}
function setMidpointAsApt(){if(!S.midpointData)return;S.selectedPlace={name:S.midpointData.name,lat:S.midpointData.lat,lng:S.midpointData.lng,address:''};showSelectedPlace();setAppointment()}

// ════════════════════════════════════════════════════════
//  대중교통
// ════════════════════════════════════════════════════════
async function openTransit(){
  if(!S.appointment){showToast('약속장소를 먼저 지정해주세요','info');return}
  if(!S.lat){showToast('내 위치를 가져오는 중입니다','info');return}
  const panel=document.getElementById('transit-panel');panel.style.display='block'
  document.getElementById('transit-spinner').style.display='block'
  document.getElementById('transit-results').innerHTML=''
  try{const r=await api('/api/transit?sx='+S.lng+'&sy='+S.lat+'&ex='+S.appointment.lng+'&ey='+S.appointment.lat);const d=await r.json();document.getElementById('transit-spinner').style.display='none';renderTransit(d)}catch(e){document.getElementById('transit-spinner').style.display='none';document.getElementById('transit-results').innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">조회 실패</p>'}
}
function closeTransit(){document.getElementById('transit-panel').style.display='none'}
function renderTransit(data){
  const el=document.getElementById('transit-results');let html=''
  if(data.demo)html+='<div class="transit-demo-note">⚠️ 데모 데이터 — ODsay API 키 설정 시 실제 경로 조회</div>'
  const paths=(data.result?.path||[]).slice(0,3)
  if(!paths.length){el.innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">경로 없음</p>';return}
  const typeMap={1:'지하철',2:'버스+지하철',3:'버스'}
  html+=paths.map(p=>{
    const info=p.info
    const steps=(p.subPath||[]).filter(sp=>sp.trafficType!==3).map(sp=>{const isS=sp.trafficType===1;const name=isS?(sp.lane?.[0]?.name||'지하철'):(sp.lane?.[0]?.busNo||'버스');return '<div class="step-chip '+(isS?'subway':'bus')+'">'+(isS?'🚇':'🚌')+' '+name+'</div>'}).join('<span style="color:var(--text3);font-size:11px">▸</span>')
    return '<div class="transit-route"><div class="transit-top"><div class="transit-time">'+info.totalTime+'<span style="font-size:13px;font-weight:500;color:var(--text2)">분</span></div><div class="transit-tag">'+(typeMap[p.pathType]||'대중교통')+'</div></div><div class="transit-steps">'+steps+'</div><div class="transit-meta"><span>💰 '+((info.payment||0).toLocaleString())+'원</span><span>🚇 '+info.subwayTransitCount+'회</span><span>🚌 '+info.busTransitCount+'회</span></div></div>'
  }).join('')
  el.innerHTML=html
}

// ════════════════════════════════════════════════════════
//  UI 유틸
// ════════════════════════════════════════════════════════
function switchTab(tab){
  ['map','chat','appt','friends'].forEach(t=>{document.getElementById('tab-'+t).classList.toggle('active',t===tab);document.getElementById('tbtn-'+t).classList.toggle('active',t===tab)})
  if(tab==='chat'){S.unreadChat=0;const b=document.getElementById('chat-tbadge');b.style.display='none';setTimeout(()=>{const m=document.getElementById('chat-msgs');m.scrollTop=m.scrollHeight},100)}
  if(tab==='map'&&S.map&&typeof kakao!=='undefined')kakao.maps.event.trigger(S.map,'resize')
  if(tab==='friends'){S._reqHash='';S._friendsHash='';fetchFriends();fetchFriendRequests()}
}
let _toastTimer=null
function showToast(msg,type='info'){const el=document.getElementById('toast');el.className='toast show'+(type?' '+type:'');el.textContent=msg;clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>{el.className='toast'},3000)}
function showProfileModal(){document.getElementById('profile-modal').classList.add('show')}
function closeProfileModal(e){if(e.target===document.getElementById('profile-modal'))document.getElementById('profile-modal').classList.remove('show')}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// ════════════════════════════════════════════════════════
//  DOM Ready
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  // 채팅 입력: Enter키 전송 제거, 버튼으로만 전송
  const chatInput=document.getElementById('chat-input')
  const sendBtn=document.getElementById('send-btn')
  chatInput.addEventListener('input',()=>{
    const hasText=chatInput.value.trim().length>0&&!chatInput.disabled
    sendBtn.disabled=!hasText
  })
  // Enter키는 줄바꿈 없이 무시 (모바일 키보드 '완료' 버튼 방지)
  chatInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault()} // 전송 안 함
  })
  document.getElementById('place-input').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace()})
  document.getElementById('friend-id-input').addEventListener('keydown',e=>{if(e.key==='Enter')sendFriendReq()})
  document.getElementById('chat-room-select').addEventListener('click',e=>{
    const chip=e.target.closest('.room-chip')
    if(chip&&chip.dataset.room)selectRoom(chip.dataset.room,chip.dataset.name||chip.dataset.room)
  })
  initAuth()
  if(Notification.permission==='default')Notification.requestPermission()
})
</script>
</body>
</html>`
  return HTML
}

export default app
