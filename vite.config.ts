import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * 公開用ビルドの HTML に、Content-Security-Policy を meta タグで入れる。
 * GitHub Pages は HTTP ヘッダを設定できないため。開発サーバーには入れない(HMR が動かなくなるため)。
 * - 'wasm-unsafe-eval': ngspice(WebAssembly)の実行に必要
 * - style-src 'unsafe-inline': React・uPlot がスタイルを直接つけるため
 * - 外部への通信・外部スクリプトはすべて禁止(connect-src 'self')
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  // data: は、ビルドが小さなフォント(KaTeX の一部)を CSS に埋め込むため
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "circuit-lab:content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
        injectTo: "head-prepend",
      },
    ],
  };
}

// GitHub Pages のサブパス公開(/circuit-lab/)に合わせる。開発サーバーでは / で動く。
// vite preview は command が "serve" になるため isPreview も見る(見ないと本番ビルドの確認で 404 になる)。
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/circuit-lab/" : "/",
  plugins: [
    react(),
    contentSecurityPolicy(),
    VitePWA({
      // 新しいバージョンは、利用者が「更新」を押したときに切り替える(操作中に画面が再読み込みされないように)
      registerType: "prompt",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "icon.svg"],
      manifest: {
        name: "circuit-lab",
        short_name: "circuit-lab",
        description: "回路のシミュレーションと、主要な回路の構成を理解するためのアプリ",
        lang: "ja",
        theme_color: "#1b2433",
        background_color: "#1b2433",
        display: "standalone",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 画面・計算エンジン・解説・アイコンをすべて事前に保存し、オフラインでも動くようにする。
        // 数式のフォントは woff2 だけ(古い形式は対象のブラウザでは使われないため、保存しない)。
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // 計算エンジン(ngspice の WebAssembly、約 20MB)も保存するため、既定の 2MB から引き上げる
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
    }),
  ],
  worker: { format: "es" },
}));
