import type { ResultType } from "eecircuit-engine";

const TIMEOUT_MS = 30_000;

type WorkerMessage =
  | { type: "ready" }
  | { type: "result"; id: number; result: ResultType }
  | { type: "error"; id: number; message: string };

/**
 * ngspice を動かす Web Worker の窓口。
 * 計算は 1 つずつ順番に行い、30 秒を超えたら Worker を作り直して中止する(docs/design.md 4 章)。
 */
export class SpiceRunner {
  private worker: Worker | null = null;
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private onStatus: (loading: boolean) => void;

  constructor(onStatus: (loading: boolean) => void = () => {}) {
    this.onStatus = onStatus;
  }

  private startWorker(): Worker {
    this.onStatus(true);
    const worker = new Worker(new URL("./spice.worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    return worker;
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  /** isStale が true を返す(より新しい依頼が出ている)なら、計算せずに null を返す */
  run(netlist: string, isStale: () => boolean = () => false): Promise<ResultType | null> {
    const task = this.queue.then(() => (isStale() ? null : this.execute(netlist)));
    this.queue = task.catch(() => undefined);
    return task;
  }

  private execute(netlist: string): Promise<ResultType> {
    const worker = this.worker ?? this.startWorker();
    const id = this.nextId++;

    return new Promise<ResultType>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        this.stopWorker();
        reject(new Error("計算に時間がかかりすぎたため中止しました。値を変えて再実行してください。"));
      }, TIMEOUT_MS);

      const onMessage = (e: MessageEvent<WorkerMessage>) => {
        const message = e.data;
        if (message.type === "ready") {
          this.onStatus(false);
        } else if (message.id === id) {
          cleanup();
          if (message.type === "result") resolve(message.result);
          else reject(new Error(message.message));
        }
      };
      const onError = () => {
        cleanup();
        this.stopWorker();
        reject(new Error("計算エンジンを読み込めませんでした。ページを再読み込みしてください。"));
      };
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
      };

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      worker.postMessage({ type: "run", id, netlist });
    });
  }
}
