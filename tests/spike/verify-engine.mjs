// 計算エンジン(eecircuit-engine)の動作・速度・精度を確かめる検証スクリプト。
// 設計書 2 章「実装初期に検証」のうち Node 上で確認できる部分。
import { Simulation } from "eecircuit-engine";

const sim = new Simulation();
const t0 = performance.now();
await sim.start();
console.log(`初期化: ${(performance.now() - t0).toFixed(0)} ms`);

async function run(name, netlist) {
  sim.setNetList(netlist);
  const t = performance.now();
  const r = await sim.runSim();
  console.log(`${name}: ${(performance.now() - t).toFixed(0)} ms, ${r.numPoints} 点, 変数=${r.variableNames.join(",")}`);
  return r;
}
const col = (r, n) => r.data.find((d) => d.name === n).values;

// 1. RC ローパス AC: R=1k, C=159.155n -> fc = 1kHz, 理論 -3.01 dB
const ac = await run("RC AC", `RC lowpass
V1 in 0 DC 0 AC 1
R1 in out 1k
C1 out 0 159.155n
.ac dec 20 10 100k
.end`);
// AC 解析の値は複素数 { real, img } で返る(周波数も同様)
const f = col(ac, "frequency").map((x) => x.real), vo = col(ac, "v(out)");
let best = 0;
f.forEach((x, i) => { if (Math.abs(Math.log(x / 1000)) < Math.abs(Math.log(f[best] / 1000))) best = i; });
const mag = 20 * Math.log10(Math.hypot(vo[best].real, vo[best].img));
console.log(`  f=${f[best].toFixed(1)} Hz でゲイン ${mag.toFixed(2)} dB (理論 -3.01)`);

// 2. RC 過渡: tau = 1ms, 1ms 時点で 63.2%
const tr = await run("RC tran", `RC step
V1 in 0 PULSE(0 1 0 1n 1n 1 2)
R1 in out 1k
C1 out 0 1u
.tran 10u 5m
.end`);
const tt = col(tr, "time"), vt = col(tr, "v(out)");
const k = tt.findIndex((x) => x >= 1e-3);
console.log(`  t=1ms で v(out)=${vt[k].toFixed(4)} V (理論 0.6321)`);

// 3. 降圧コンバータ: Vin=12V, D=50% -> 約 6V (理想スイッチ+ダイオード)
const buck = await run("バック 300周期", `buck
Vin in 0 12
Vg g 0 PULSE(0 5 0 10n 10n 5u 10u)
S1 in sw g 0 SW
D1 0 sw DD
L1 sw out 100u
C1 out 0 47u
Rl out 0 10
.model SW SW(Ron=10m Roff=1Meg Vt=2.5 Vh=0.1)
.model DD D(Is=1e-9 Rs=20m N=1.05)
.tran 0.1u 3m
.end`);
const tb = col(buck, "time"), vb = col(buck, "v(out)");
const last = vb.filter((_, i) => tb[i] > 2.5e-3);
console.log(`  最後 0.5ms の v(out): 平均 ${(last.reduce((a, b) => a + b) / last.length).toFixed(2)} V, 最小 ${Math.min(...last).toFixed(2)}, 最大 ${Math.max(...last).toFixed(2)} (理論 約 6V)`);

// 4. 三相インバータ 180度通電 (6 スイッチ + Y 結線 RL), 50 Hz, 2 周期
const T = 1 / 50, sixth = T / 6;
const gate = (name, node, delay, inv) =>
  `V${name} ${node} 0 PULSE(${inv ? "5 0" : "0 5"} ${delay} 1n 1n ${3 * sixth} ${T})`;
const phase = (x, a) => [
  gate(`${x}h`, `g${x}h`, a * 2 * sixth, false),
  gate(`${x}l`, `g${x}l`, a * 2 * sixth + 3 * sixth, false),
];
const inv3 = `3phase
Vdc dc 0 300
${["u", "v", "w"].flatMap((x, a) => phase(x, a)).join("\n")}
Su_h dc u gu_h 0 SW
Su_l u 0 gu_l 0 SW
Sv_h dc v gv_h 0 SW
Sv_l v 0 gv_l 0 SW
Sw_h dc w gw_h 0 SW
Sw_l w 0 gw_l 0 SW
Du_h u dc DD
Du_l 0 u DD
Dv_h v dc DD
Dv_l 0 v DD
Dw_h w dc DD
Dw_l 0 w DD
Ru u nu 5
Lu nu n 10m
Rv v nv 5
Lv nv n 10m
Rw w nw 5
Lw nw n 10m
.model SW SW(Ron=10m Roff=1Meg Vt=2.5 Vh=0.1)
.model DD D(Is=1e-9 Rs=20m N=1.05)
.tran 20u 40m
.end`.replace(/^V(.)([hl]) /gm, (m, x, y) => `Vg${x}_${y} `).replace(/g(.)([hl])\b/g, (m, x, y) => `g${x}_${y}`);
const r3 = await run("三相インバータ 2周期", inv3);
const t3 = col(r3, "time"), vu = col(r3, "v(u)"), vv = col(r3, "v(v)");
const lineMax = Math.max(...vu.map((x, i) => Math.abs(x - vv[i])));
console.log(`  線間電圧 |v(u)-v(v)| の最大 ${lineMax.toFixed(1)} V (理論 約 300V)`);
