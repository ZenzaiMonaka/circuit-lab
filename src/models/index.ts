// 内蔵の部品モデル。メーカーの型番モデルは使わず、典型的な値で作った汎用モデルにする
// (再配布の権利関係を避けるため。docs/design.md 3 章)。

export type ModelName = "DIODE" | "LED" | "NPN" | "SWITCH" | "OPAMP";

export const MODEL_LIBRARY: Record<ModelName, string> = {
  // 汎用の整流ダイオード(順方向電圧 約 0.7V)
  DIODE: ".model DGEN D(Is=1e-9 Rs=20m N=1.05 Cjo=10p)",

  // 赤色 LED(10mA で順方向電圧 約 2V)
  LED: ".model DLED D(Is=1e-20 N=1.8 Rs=5 Cjo=30p)",

  // 汎用の小信号 NPN トランジスタ(hFE 約 200)
  NPN: ".model QGEN NPN(Is=1e-14 Bf=200 Vaf=100 Rb=10 Cje=5p Cjc=3p Tf=0.4n)",

  // 理想スイッチ(オン抵抗 10mΩ、制御電圧 2.5V でオン)
  SWITCH: ".model SWGEN SW(Ron=10m Roff=10Meg Vt=2.5 Vh=0.1)",

  // 汎用オペアンプ: 直流利得 100dB、利得帯域幅積 1MHz、出力は電源電圧の 1.5V 内側まで振れる。
  // 出力の制限は、小さな信号の精度を保つため高次の滑らかな制限関数で作っている。
  OPAMP: `.subckt OPAMP inp inn out vp vn
Rin inp inn 10Meg
G1 0 n1 inp inn 1m
R1 n1 0 100Meg
C1 n1 0 159.155p
B1 nlim 0 V=(V(vp)+V(vn))/2 + V(n1)/(1+(abs(V(n1))/((V(vp)-V(vn))/2-1.5))**4)**0.25
Ro nlim out 75
.ends OPAMP`,
};

export function modelText(names: ModelName[]): string {
  return names.map((name) => MODEL_LIBRARY[name]).join("\n");
}
