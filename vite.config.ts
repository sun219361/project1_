import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      // 아이콘·manifest·assetlinks 를 정적 파일로 직접 서빙
      exclude: [
        '/static/*',
        '/icon-*.png',
        '/manifest.json',
        '/.well-known/*'
      ]
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
