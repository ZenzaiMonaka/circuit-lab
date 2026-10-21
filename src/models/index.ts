// 内蔵の部品モデル。メーカーの型番モデルは使わず、典型的な値で作った汎用モデルにする
// (再配布の権利関係を避けるため。docs/design.md 3 章)。

export type ModelName = "DIODE" | "LED" | "ZENER" | "BREAKDOWN80" | "NPN" | "PNP" | "NMOS" | "SWITCH" | "OPAMP";

export const MODEL_LIBRARY: Record<ModelName, string> = {
  // 汎用の整流ダイオード(順方向電圧 約 0.7V)
  DIODE: ".model DGEN D(Is=1e-14 Rs=50m N=1 Cjo=10p)",

  // 赤色 LED(10mA で順方向電圧 約 2V)
  LED: ".model DLED D(Is=1e-20 N=1.8 Rs=5 Cjo=30p)",

  // 5.1V のツェナーダイオード(5 mA で 5.1V、動特性の抵抗 約 5Ω)
  ZENER: ".model DZ5V1 D(Is=1e-14 Rs=5 N=1 Bv=5.1 Ibv=5m)",

  // 逆電圧 80V で降伏するダイオード。「保護ダイオードなし」のとき、トランジスタ自身の降伏電圧の代わりに使う
  BREAKDOWN80: ".model DBV80 D(Is=1e-14 Rs=0.5 Bv=80 Ibv=1m)",

  // 汎用の小信号 NPN トランジスタ(hFE 約 200)
  NPN: ".model QGEN NPN(Is=1e-14 Bf=200 Vaf=100 Rb=10 Cje=5p Cjc=3p Tf=0.4n)",

  // 汎用の小信号 PNP トランジスタ(hFE 約 100)
  PNP: ".model QPGEN PNP(Is=1e-14 Bf=100 Vaf=60 Rb=10 Cje=5p Cjc=3p Tf=0.5n)",

  // パワー MOSFET(しきい値 3V、オン抵抗 約 0.1Ω@Vgs=5V、最大 数 A)
  NMOS: ".model NMOSGEN NMOS(Level=1 Vto=3 Kp=5 Lambda=0.01 Rd=20m Rs=10m)",

  // 理想スイッチ(オン抵抗 10mΩ、制御電圧 2.5V でオン)
  SWITCH: ".model SWGEN SW(Ron=10m Roff=10Meg Vt=2.5 Vh=0.1)",

  // 汎用オペアンプ: 直流利得 100dB、利得帯域幅積 1MHz、出力は電源電圧の 1.5V 内側まで振れる。
  // 出力の制限は、小さな信号の精度を保つため高次の滑らかな制限関数で作っている。
  // 内部のノード n1(利得段の出力)は、ダイオードで「制限値の 3 倍」までに抑える。
  // 抑えないと、出力が飽和している間に n1 が数万 V まで積み上がり(ワインドアップ)、
  // 入力が逆転しても、出力がなかなか戻らなくなる(コンパレータとして使えない)。
  OPAMP: `.subckt OPAMP inp inn out vp vn
.model DCL D(Is=1e-14)
Rin inp inn 10Meg
G1 0 n1 inp inn 1m
R1 n1 0 100Meg
C1 n1 0 159.155p
Bhi nhi 0 V=3*((V(vp)-V(vn))/2-1.5)
Blo nlo 0 V=-3*((V(vp)-V(vn))/2-1.5)
Dhi n1 nhi DCL
Dlo nlo n1 DCL
B1 nlim 0 V=(V(vp)+V(vn))/2 + V(n1)/(1+(abs(V(n1))/((V(vp)-V(vn))/2-1.5))**4)**0.25
Ro nlim out 75
.ends OPAMP`,
};

export function modelText(names: ModelName[]): string {
  return names.map((name) => MODEL_LIBRARY[name]).join("\n");
}
