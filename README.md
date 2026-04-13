# 모여봐 (MeetupK)

실시간 친구 위치 공유, 채팅, SOS, 약속장소 및 대중교통 조회 앱

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | 모여봐 (meetup-korea) |
| **플랫폼** | Cloudflare Pages + Workers |
| **기술 스택** | Hono (TypeScript) + Cloudflare KV + Kakao Maps JS API + ODsay API |
| **번들 크기** | ~133 KB (Workers 10MB 제한 대비 여유) |

---

## 완료된 기능

- ✅ 회원가입/로그인 (아이디/비밀번호, 아바타 이모지 선택)
- ✅ 친구 요청/수락/거절 (상호 자동 수락 포함)
- ✅ 실시간 위치 공유 (글로벌 공유 ON/OFF, 친구별 공개/비공개)
- ✅ 카카오맵 기반 지도 (내 위치 + 친구 마커)
- ✅ 그룹/1:1 채팅방 (메시지 전송, 위치 공유 메시지)
- ✅ 채팅방 위치 공유 패널 (채팅방 멤버 위치 확인)
- ✅ SOS 긴급 신호 (발송/확인/종료)
- ✅ 약속장소 설정 (카카오맵 장소검색 연동)
- ✅ 대중교통 경로 조회 (ODsay API, 키 없으면 데모 모드)
- ✅ PWA (manifest.json, Service Worker 백그라운드 위치 추적)
- ✅ 모바일 반응형 (iOS Safe Area, 100dvh, 키보드 팝업 방지)
- ✅ 전송 버튼 강화 (Enter키 전송 제거, 44px 터치 영역)

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/me` | 내 정보 조회 |

### 친구
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/friends` | 친구 목록 + 위치 |
| POST | `/api/friends/request` | 친구 요청 |
| POST | `/api/friends/accept` | 요청 수락 |
| POST | `/api/friends/reject` | 요청 거절 |
| GET | `/api/friends/requests` | 받은 요청 목록 |

### 위치
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/location` | 내 위치 업로드 (TTL: 1시간) |
| POST | `/api/location/permission` | 친구별 공개 설정 |
| POST | `/api/location/view` | 친구 위치 지도 표시 설정 |

### 채팅방
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/rooms` | 채팅방 목록 |
| POST | `/api/rooms` | 그룹방 생성 (TTL: 30일) |
| POST | `/api/rooms/dm` | 1:1 DM 생성/조회 |
| POST | `/api/rooms/:id/locshare` | 위치공유 토글 |
| GET | `/api/rooms/:id/locations` | 방 멤버 위치 조회 |
| POST | `/api/rooms/:id/leave` | 방 나가기 |

### 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/chat` | 메시지 전송 (TTL: 2일, 최대 500자) |
| GET | `/api/chat/:roomId?since=ts` | 메시지 조회 (최신 60건) |

### SOS
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/sos` | SOS 발송 (TTL: 1시간) |
| POST | `/api/sos/acknowledge` | SOS 확인 |
| POST | `/api/sos/dismiss` | SOS 종료 (발신자만) |
| GET | `/api/sos/check?since=ts` | 활성 SOS 폴링 |

### 기타
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/appointment` | 약속장소 설정 (TTL: 24시간) |
| GET | `/api/appointment/:roomId` | 약속장소 조회 |
| GET | `/api/transit?sx=&sy=&ex=&ey=` | 대중교통 경로 조회 |

---

## 데이터 구조 (Cloudflare KV)

| KV 키 패턴 | 설명 | TTL |
|-----------|------|-----|
| `user:{userId}` | 사용자 정보 (비밀번호 해시 포함) | 영구 |
| `session:{token}` | 인증 세션 | 7일 |
| `friends:{userId}` | 친구 목록 | 영구 |
| `friend_req:{to}:{from}` | 친구 요청 | 7일 |
| `loc:{userId}` | 사용자 위치 | 1시간 |
| `loc_perm:{userId}` | 위치 공개 설정 | 영구 |
| `view_perm:{userId}` | 친구 표시 설정 | 영구 |
| `room:{roomId}` | 채팅방 데이터 | 30일 |
| `rooms:{userId}` | 참여 방 목록 | 영구 |
| `chat:{roomId}:{msgId}` | 채팅 메시지 | 2일 |
| `sos:{sosId}` | SOS 데이터 | 1시간 |
| `apt:{roomId}` | 약속장소 | 24시간 |

---

## 환경변수 (Cloudflare Secrets)

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `KAKAO_MAP_KEY` | 권장 | 카카오 개발자 JavaScript 앱 키. 없으면 지도 기능 비활성 |
| `ODSAY_API_KEY` | 선택 | ODsay 대중교통 API 키. 없으면 데모 데이터 반환 |

### 시크릿 등록 방법
```bash
# Cloudflare Dashboard 또는 CLI
npx wrangler pages secret put KAKAO_MAP_KEY --project-name meetup-korea
npx wrangler pages secret put ODSAY_API_KEY --project-name meetup-korea
```

---

## 배포 방법

### 1. KV 네임스페이스 생성
```bash
npx wrangler kv namespace create meetup_KV
# 출력된 id를 wrangler.jsonc의 "id" 필드에 입력
```

### 2. wrangler.jsonc 업데이트
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "실제_KV_ID_입력",
      "preview_id": "실제_KV_PREVIEW_ID_입력"
    }
  ]
}
```

### 3. Cloudflare Pages 배포
```bash
npm run build
npx wrangler pages project create meetup-korea --production-branch main
npx wrangler pages deploy dist --project-name meetup-korea
```

### 4. 시크릿 등록
```bash
npx wrangler pages secret put KAKAO_MAP_KEY --project-name meetup-korea
npx wrangler pages secret put ODSAY_API_KEY --project-name meetup-korea
```

---

## 로컬 개발

### .dev.vars 파일 생성 (커밋 금지!)
```
KAKAO_MAP_KEY=your_kakao_javascript_key
ODSAY_API_KEY=your_odsay_api_key
```

### 개발 서버 실행
```bash
npm run build
npm run dev:sandbox  # 또는 pm2 start ecosystem.config.cjs
```

---

## 보안 체크리스트

- [x] Authorization 헤더 `Bearer null`/`Bearer undefined` 차단
- [x] 401 수신 시 자동 로그아웃 및 상태 초기화
- [x] 모든 API 입력값 타입/길이 검증
- [x] `esc()` 함수로 XSS 방어 (innerHTML 사용 시 항상 이스케이프)
- [x] JSON.parse 실패 시 `safeJson()` fallback 처리
- [x] c.req.json() Content-Type 오류 시 `safeReqJson()` fallback
- [x] 메시지 타입 화이트리스트 (text/location/system/sos)
- [x] 좌표 범위 검증 (lat: -90~90, lng: -180~180)
- [x] 채팅방 멤버 확인 후 메시지 접근
- [x] .dev.vars, .wrangler/ gitignore 적용
- [ ] 실서비스: CORS origin을 실제 도메인으로 제한 (현재 *)

---

## 성능 최적화

- 폴링 분산: chat(3s), friends(9s), SOS(15s), 요청(21s), rooms(30s)
- DocumentFragment로 DOM 배치 업데이트 (채팅 메시지)
- JSON hash 비교로 불필요한 re-render 방지 (친구/방 목록)
- `since` 타임스탬프 기반 증분 채팅 조회
- KV.list limit: 200 (chat), 50 (SOS)

---

## GitHub
- **저장소**: https://github.com/sun219361/MeetupK
- **브랜치**: main

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: Cloudflare API 키 설정 후 배포 가능
- **마지막 수정**: 2026-04-13
