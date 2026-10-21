// ngspice(eecircuit-engine)を画面とは別スレッドで動かす。
// メッセージの形式は docs/design.md 5 章に従う。
import { Simulation } from "eecircuit-engine";

const sim = new Simulation();
const ready = sim.start().then(() => self.postMessage({ type: "ready" }));

self.onmessage = async (e: MessageEvent<{ type: "run"; id: number; netlist: string }>) => {
  const { id, netlist } = e.data;
  try {
    await ready;
    sim.setNetList(netlist);
    const result = await sim.runSim();
    self.postMessage({ type: "result", id, result });
  } catch (err) {
    self.postMessage({ type: "error", id, message: String(err) });
  }
};
