#!/bin/bash
# ═══════════════════════════════════════════════════════
#  모여봐 Cloudflare 배포 자동화 스크립트
#  사용법: bash deploy.sh
# ═══════════════════════════════════════════════════════

set -e  # 오류 시 즉시 종료

PROJECT_NAME="meetup-korea"
BRANCH="main"

echo ""
echo "🚀 모여봐 Cloudflare Pages 배포 시작"
echo "════════════════════════════════════"
echo ""

# ── 1. 인증 확인 ─────────────────────────────────────
echo "📋 Step 1/5: Cloudflare 인증 확인..."
if ! npx wrangler whoami 2>/dev/null | grep -q "@"; then
  echo "❌ Cloudflare 인증 실패!"
  echo "   CLOUDFLARE_API_TOKEN 환경변수를 설정하거나"
  echo "   Deploy 탭에서 API 키를 등록해주세요."
  exit 1
fi
echo "✅ Cloudflare 인증 완료"

# ── 2. KV 네임스페이스 생성/확인 ─────────────────────
echo ""
echo "📋 Step 2/5: KV 네임스페이스 확인..."

# wrangler.jsonc에 placeholder가 있는지 확인
if grep -q "placeholder_kv_id" wrangler.jsonc; then
  echo "   KV 네임스페이스를 새로 생성합니다..."
  KV_OUTPUT=$(npx wrangler kv namespace create meetup_KV 2>&1)
  KV_ID=$(echo "$KV_OUTPUT" | grep '"id":' | sed 's/.*"id": "\([^"]*\)".*/\1/')
  
  KV_PREVIEW_OUTPUT=$(npx wrangler kv namespace create meetup_KV --preview 2>&1)
  KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep '"id":' | sed 's/.*"id": "\([^"]*\)".*/\1/')
  
  if [ -z "$KV_ID" ]; then
    echo "❌ KV 네임스페이스 생성 실패"
    echo "$KV_OUTPUT"
    exit 1
  fi
  
  echo "   KV ID: $KV_ID"
  echo "   KV Preview ID: $KV_PREVIEW_ID"
  
  # wrangler.jsonc 업데이트
  sed -i "s/placeholder_kv_id/$KV_ID/" wrangler.jsonc
  sed -i "s/placeholder_kv_preview_id/$KV_PREVIEW_ID/" wrangler.jsonc
  echo "✅ wrangler.jsonc 업데이트 완료"
else
  echo "✅ KV 네임스페이스 이미 설정됨"
fi

# ── 3. 빌드 ──────────────────────────────────────────
echo ""
echo "📋 Step 3/5: 프로젝트 빌드..."
npm run build
echo "✅ 빌드 완료 (dist/_worker.js)"

# ── 4. Cloudflare Pages 프로젝트 생성/배포 ───────────
echo ""
echo "📋 Step 4/5: Cloudflare Pages 배포..."

# 프로젝트 생성 (이미 있으면 무시)
npx wrangler pages project create $PROJECT_NAME \
  --production-branch $BRANCH 2>/dev/null || true

# 배포
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name $PROJECT_NAME 2>&1)
echo "$DEPLOY_OUTPUT"

# 배포 URL 추출
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.pages\.dev' | head -1)
echo ""
echo "✅ 배포 완료!"
echo "   URL: $DEPLOY_URL"

# ── 5. 시크릿 등록 안내 ──────────────────────────────
echo ""
echo "📋 Step 5/5: 환경변수 시크릿 등록"
echo ""
echo "⚠️  아래 명령으로 API 키를 등록해주세요:"
echo ""
echo "   카카오맵 키 (필수):"
echo "   npx wrangler pages secret put KAKAO_MAP_KEY --project-name $PROJECT_NAME"
echo ""
echo "   ODsay 대중교통 키 (선택):"
echo "   npx wrangler pages secret put ODSAY_API_KEY --project-name $PROJECT_NAME"
echo ""
echo "════════════════════════════════════"
echo "🎉 배포 완료!"
echo "   앱 URL: $DEPLOY_URL"
echo "   대시보드: https://dash.cloudflare.com/pages"
echo "════════════════════════════════════"
