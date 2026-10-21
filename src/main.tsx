import { createRoot } from "react-dom/client";
import { useState } from "react";

// 検証用の仮画面(Worker で ngspice が動くかの確認)。本実装で置き換える。
const NETLIST = `RC lowpass
V1 in 0 DC 0 AC 1
R1 in out 1k
C1 out 0 159.155n
.ac dec 20 10 100k
.end`;

function Spike() {
  const [log, setLog] = useState("未実行");
  const run = () => {
    const t0 = performance.now();
    const worker = new Worker(new URL("./engine/spice.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        setLog(`エンジン初期化 ${(performance.now() - t0).toFixed(0)} ms。計算中…`);
        worker.postMessage({ type: "run", id: 1, netlist: NETLIST });
      } else if (e.data.type === "result") {
        const r = e.data.result;
        setLog(`成功: ${r.numPoints} 点, 合計 ${(performance.now() - t0).toFixed(0)} ms, 変数=${r.variableNames.join(",")}`);
        worker.terminate();
      } else {
        setLog(`失敗: ${e.data.message}`);
        worker.terminate();
      }
    };
    worker.onerror = (e) => setLog(`Worker エラー: ${e.message}`);
  };
  return (
    <main>
      <button onClick={run}>ngspice を Worker で実行</button>
      <pre id="log">{log}</pre>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Spike />);
