import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// アイコン(PNG・ICO)を public/icon.svg から作る設定。`npm run generate:icons` で実行する。
// 生成したファイルは public/ に置いてコミットする(ビルドのたびに作らない)。
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // マスカブル(Android で丸などに切り抜かれるアイコン)の背景色は、アイコンの背景に合わせる
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: "#1b2433" } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: "#1b2433" } },
  },
  images: ["public/icon.svg"],
});
