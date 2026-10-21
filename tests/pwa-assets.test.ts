// PWA のアイコンが、マニフェスト(vite.config.ts)で宣言した大きさで存在することを確かめる。
// 画像の大きさは、PNG の先頭(IHDR)に書かれている。
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngSize(path: string): [number, number] {
  const bytes = readFileSync(path);
  expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe("PWA のアイコン", () => {
  const icons: [string, number][] = [
    ["public/pwa-64x64.png", 64],
    ["public/pwa-192x192.png", 192],
    ["public/pwa-512x512.png", 512],
    ["public/maskable-icon-512x512.png", 512],
    ["public/apple-touch-icon-180x180.png", 180],
  ];

  for (const [path, size] of icons) {
    it(`${path} は ${size}x${size} の PNG`, () => {
      expect(pngSize(path)).toEqual([size, size]);
    });
  }

  it("元の SVG と favicon がある", () => {
    expect(existsSync("public/icon.svg")).toBe(true);
    expect(existsSync("public/favicon.ico")).toBe(true);
  });

  it("vite.config.ts が、上のアイコンをすべてマニフェストなどで使っている", () => {
    const config = readFileSync("vite.config.ts", "utf-8");
    for (const [path] of icons) {
      expect(config).toContain(path.replace("public/", ""));
    }
  });
});
