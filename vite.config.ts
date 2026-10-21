import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages のサブパス公開(/circuit-lab/)に合わせる。開発サーバーでは / で動く。
// vite preview は command が "serve" になるため isPreview も見る(見ないと本番ビルドの確認で 404 になる)。
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/circuit-lab/" : "/",
  plugins: [react()],
  worker: { format: "es" },
}));
