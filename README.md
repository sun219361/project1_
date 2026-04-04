# 모여봐 (MeetupKorea) 📍

> **한국형 친구 위치공유 앱** — 실시간 위치 공유, 채팅, SOS, 약속 장소, 대중교통 조회

---

## 📱 앱 소개

| 기능 | 설명 |
|---|---|
| 🗺️ **실시간 위치 공유** | 친구 추가 후 지도에 서로 위치 표시 (30초 갱신) |
| 💬 **채팅 + 말풍선** | 전체 채팅 & 1:1 채팅, 메시지가 지도 위에 말풍선으로 표시 |
| 🚨 **SOS 알람** | 긴급 시 친구 전체에게 SOS 알림 발송 |
| 📍 **약속 장소** | 장소 검색 후 지도에서 약속 지점 지정 |
| 🔀 **중간 지점** | 친구들 위치의 중간 지점 자동 계산 |
| 🚌 **대중교통 조회** | 약속 장소까지 버스/지하철 경로 조회 (ODsay API) |
| 👫 **친구 시스템** | ID로 친구 요청 → 수락 시 지도에 표시 |
| 🔐 **회원가입/로그인** | 아이디 + 비밀번호 기반 인증 |

---

## 🛠️ 기술 스택

```
Backend:   Hono (TypeScript) on Cloudflare Workers
Frontend:  Vanilla JS + CSS (다크 테마, Glassmorphism)
Build:     Vite
Deploy:    Cloudflare Pages
Database:  Cloudflare KV (key-value 스토리지)
지도:      KakaoMap JavaScript API
대중교통:  ODsay API
```

---

## 🗂️ 프로젝트 구조

```
meetup-korea/
├── src/
│   └── index.tsx          # 백엔드 API(Hono) + 프론트엔드 HTML 전체
├── public/
│   ├── manifest.json      # PWA/TWA 앱 매니페스트
│   ├── icon-192.png       # 앱 아이콘 (192×192) ← 직접 추가 필요
│   ├── icon-512.png       # 앱 아이콘 (512×512) ← 직접 추가 필요
│   ├── .well-known/
│   │   └── assetlinks.json  # Android TWA 연동용 (SHA256 교체 필요)
│   └── static/
│       └── style.css      # 추가 CSS (현재 미사용)
├── dist/                  # 빌드 결과물 (자동 생성, git 제외)
├── .dev.vars              # 로컬 환경변수 (git 제외) ← 직접 생성 필요
├── .env.example           # 환경변수 템플릿 (git 포함)
├── wrangler.jsonc         # Cloudflare 설정 (KV ID 교체 필요)
├── package.json           # npm 스크립트
└── vite.config.ts         # Vite 빌드 설정
```

---

## ⚡ npm 명령어 정리

```powershell
npm run build          # Vite로 dist/ 폴더 빌드
npm run deploy         # 빌드 + Cloudflare Pages 배포
npm run setup:kv       # KV 네임스페이스 생성
npm run secret:kakao   # 카카오 API 키 등록
npm run secret:odsay   # ODsay API 키 등록
npm run secret:list    # 등록된 시크릿 목록 확인
```

---

## 🔐 환경변수 정리

| 변수명 | 용도 | 등록 위치 |
|---|---|---|
| `KAKAO_MAP_KEY` | 카카오맵 JS 키 | `.dev.vars` (로컬) / wrangler secret (프로덕션) |
| `ODSAY_API_KEY` | ODsay 대중교통 키 | `.dev.vars` (로컬) / wrangler secret (프로덕션) |

---

## 📊 데이터 구조 (Cloudflare KV)

| 키 패턴 | 저장 데이터 | TTL |
|---|---|---|
| `user:{uid}` | 유저 정보 (이름, 아바타, 해시 비번) | 영구 |
| `session:{token}` | 세션 토큰 → uid | 7일 |
| `friends:{uid}` | 친구 uid 배열 | 영구 |
| `friend_req:{from}:{to}` | 친구 요청 정보 | 7일 |
| `loc:{uid}` | 위치 (lat, lng, 갱신시각) | 1시간 |
| `chat:{roomId}:{msgId}` | 채팅 메시지 | 24시간 |
| `apt:{roomId}` | 약속 장소 정보 | 24시간 |

---


## 📅 개발 이력

| 날짜 | 내용 |
|---|---|
| 2024-03 | 초기 구현 (위치공유·채팅·SOS·약속장소·대중교통) |
| 2024-03 | 전면 리디자인 (다크 테마·glassmorphism), 회원가입/친구 시스템 |
| 2024-03 | 지도 위 채팅 말풍선 실시간 표시 |
| 2024-03 | 환경변수 분리, 보안 강화, 배포 준비 완료 |
