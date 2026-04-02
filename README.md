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

## 🚀 배포 가이드 (내 컴퓨터에서)

### 필수 설치 프로그램

| 프로그램 | 버전 | 링크 |
|---|---|---|
| **Node.js** | 20 LTS | https://nodejs.org |
| **Git** | 최신 | https://git-scm.com |
| **VS Code** | 최신 | https://code.visualstudio.com |

> ⚠️ MySQL·Python·PyCharm은 이 프로젝트에 불필요합니다.

---

### STEP 1 — 코드 클론 & 의존성 설치

```powershell
git clone https://github.com/sun219361/project1_.git
cd project1_
npm install
```

---

### STEP 2 — API 키 발급

#### 카카오맵 API (무료)
1. https://developers.kakao.com 접속 → 로그인
2. **내 애플리케이션** → **애플리케이션 추가**
3. **앱 키** 탭 → **JavaScript 키** 복사
4. **플랫폼** → **Web** → 배포 도메인 등록  
   예: `https://meetup-korea.pages.dev`

#### ODsay 대중교통 API (무료, 일 1000회)
1. https://lab.odsay.com 접속 → 회원가입
2. API 키 발급

---

### STEP 3 — 로컬 환경변수 파일 생성

프로젝트 루트에 `.dev.vars` 파일 생성 (VS Code로):

```bash
KAKAO_MAP_KEY=카카오_자바스크립트_키_여기에_붙여넣기
ODSAY_API_KEY=odsay_키_여기에_붙여넣기
```

> ⚠️ `.dev.vars`는 절대 GitHub에 올리면 안 됩니다 (`.gitignore`에 포함됨).

---

### STEP 4 — Cloudflare 계정 & CLI 설정

```powershell
# Wrangler CLI 전역 설치
npm install -g wrangler

# Cloudflare 계정 로그인 (브라우저 자동 열림)
wrangler login

# 로그인 확인
wrangler whoami
```

> 계정 없으면 먼저 생성: https://dash.cloudflare.com/sign-up (무료)

---

### STEP 5 — KV 네임스페이스 생성

```powershell
npm run setup:kv
```

출력 예시:
```
✅ Successfully created namespace "meetup_KV"
{ binding: 'KV', id: 'abc123def456...실제ID' }
```

→ 출력된 `id` 값을 `wrangler.jsonc`에 복사:

```jsonc
"kv_namespaces": [
  {
    "binding": "KV",
    "id": "abc123def456...실제ID",    ← 여기에 붙여넣기
    "preview_id": "abc123def456...실제ID"  ← 동일하게
  }
]
```

---

### STEP 6 — 빌드 & 배포

```powershell
npm run deploy
```

배포 완료 후 URL 확인:
```
✨ Deployment complete!
🌎 https://meetup-korea.pages.dev
```

---

### STEP 7 — 프로덕션 시크릿(API 키) 등록

```powershell
# 카카오맵 키 등록
npm run secret:kakao
# → 프롬프트에 카카오 키 입력 후 Enter

# ODsay 키 등록
npm run secret:odsay
# → 프롬프트에 ODsay 키 입력 후 Enter

# 등록 확인
npm run secret:list
```

---

### STEP 8 — 앱 아이콘 추가 (Play Store용)

`public/` 폴더에 아이콘 2개 추가:
- `icon-192.png` (192×192 픽셀)
- `icon-512.png` (512×512 픽셀)

> 무료 아이콘 생성: https://www.appicon.co

---

## 📲 Android/Play Store 배포 (TWA)

### 추가 설치

| 프로그램 | 링크 |
|---|---|
| **Android Studio** (JDK 포함) | https://developer.android.com/studio |
| **Bubblewrap CLI** | `npm install -g @bubblewrap/cli` |

### TWA 빌드

```powershell
# 새 폴더 생성
mkdir C:\meetup-twa
cd C:\meetup-twa

# TWA 프로젝트 초기화 (배포 URL 필요)
bubblewrap init --manifest https://meetup-korea.pages.dev/manifest.json

# 키스토어 생성 (처음 한 번만)
keytool -genkey -v -keystore meetup.keystore -alias meetup -keyalg RSA -keysize 2048 -validity 10000

# SHA-256 핑거프린트 확인
keytool -list -v -keystore meetup.keystore -alias meetup
```

SHA-256 값을 `public/.well-known/assetlinks.json`의 `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`에 교체 후 재배포.

```powershell
# AAB 빌드
bubblewrap build
```

→ `app-release-bundle.aab` 파일 생성

### Play Store 등록

1. https://play.google.com/console → **$25** 개발자 등록 (1회)
2. **앱 만들기** → `모여봐`, 한국어, 무료
3. **AAB 파일** 업로드
4. **스크린샷** 2~8장, 피처 그래픽(1024×500) 업로드
5. **개인정보처리방침 URL** 등록 (GitHub Pages로 간단히 만들 수 있음)
6. 심사 제출 → 3~7일

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

## 🔗 링크

- **GitHub**: https://github.com/sun219361/project1_
- **Cloudflare Pages**: https://meetup-korea.pages.dev *(배포 후)*
- **카카오 개발자**: https://developers.kakao.com
- **ODsay API**: https://lab.odsay.com
- **Cloudflare 대시보드**: https://dash.cloudflare.com

---

## 📅 개발 이력

| 날짜 | 내용 |
|---|---|
| 2024-03 | 초기 구현 (위치공유·채팅·SOS·약속장소·대중교통) |
| 2024-03 | 전면 리디자인 (다크 테마·glassmorphism), 회원가입/친구 시스템 |
| 2024-03 | 지도 위 채팅 말풍선 실시간 표시 |
| 2024-03 | 환경변수 분리, 보안 강화, 배포 준비 완료 |
