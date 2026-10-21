# circuit-lab

回路のシミュレーションと、主要な回路の構成を理解するための Web アプリ。

## 使い方

1. 左の一覧(スマホは「回路を選ぶ」ボタン)から回路を選ぶ
2. 「部品値」のスライダーまたは入力欄で値を変える。入力欄は `4.7k`、`100n` のように接頭辞つきで入力できる(`M` はメガ、`m` はミリ)
3. 「解析」のタブで、直流動作点・過渡解析・周波数特性を切り替える。計算が重い回路(パワーエレクトロニクス)だけは「実行」ボタンで計算する
4. 下の解説で、動作原理・設計式・使いどころを確認する

回路は全 34 種(要件のテンプレートをすべて実装済み): 基本 3 種、過渡応答 3 種、フィルタ・共振 4 種、電源 6 種、トランジスタ 7 種、オペアンプ 7 種、パワーエレクトロニクス 4 種

## 開発

Node.js(LTS)が必要。

```bash
npm install          # 依存の取得
npm run dev          # 開発サーバー(http://localhost:5173)
npm test             # テスト(ngspice を実際に動かして理論値と比べるテストを含む)
npm run build        # 公開用のビルド(dist/)
npm run verify:engine  # 計算エンジンの動作・速度の確認(Node 上)
```

回路を追加するには、`src/templates/<分類>/<回路ID>/` に `index.ts`(部品値・ネットリスト・回路図)と
`explanation.md`(解説)を作り、`src/templates/index.ts` に登録する。

計算に使う部品モデルは `src/models/index.ts` にある(ダイオード・LED・ツェナー・NPN・PNP・MOSFET・スイッチ・オペアンプ)。
メーカーの型番モデルは使わず、典型的な値で作った汎用モデル。

## フォルダ構成

```
circuit-lab/
├─ README.md   この説明書
├─ CLAUDE.md   Claude 用のプロジェクトメモ
├─ .gitignore  git に入れないファイルの指定
├─ src/        画面とプログラム本体（components/ 画面部品、engine/ 計算、models/ 部品モデル、schematic/ 回路図、templates/ 回路）
├─ public/     そのまま公開する静的ファイル（画像・アイコンなど）
├─ tests/      テスト
└─ docs/       要件メモ・設計メモ（公開されない）
```

## 技術

- TypeScript + React（Vite）
- サーバー不要。計算・表示はすべてブラウザ内で行う
