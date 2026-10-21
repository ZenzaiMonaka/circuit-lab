import type { ResultType } from "eecircuit-engine";

const TIMEOUT_MS = 30_000;

type WorkerMessage =
  | { type: "ready" }
  | { type: "result"; id: number; result: ResultType }
  | { type: "error"; id: number; message: string };

/**
 * ngspice を動かす Web Worker の窓口。
 * 計算は 1 つずつ順番に行い、計算が 30 秒を超えたら Worker を作り直して中止する(docs/design.md 4 章)。
 * 30 秒は「計算エンジンの読み込みが終わってから」数える。初回の読み込み(約 20MB)に時間がかかる
 * 回線でも、計算が始まる前に中止されないようにするため。
 */
export class SpiceRunner {
  private worker: Worker | null = null;
  private ready = false;
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  /** いま実行中の計算を、エラーで終わらせる関数(中止ボタン用) */
  private abortCurrent: ((error: Error) => void) | null = null;
  private onStatus: (loading: boolean) => void;

  constructor(onStatus: (loading: boolean) => void = () => {}) {
    this.onStatus = onStatus;
  }

  private startWorker(): Worker {
    this.onStatus(true);
    this.ready = false;
    const worker = new Worker(new URL("./spice.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === "ready") {
        this.ready = true;
        this.onStatus(false);
      }
    });
    this.worker = worker;
    return worker;
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    // 作り直しの前に「読み込み中」の表示が残らないようにする
    this.onStatus(false);
  }

  /** いま実行中の計算を中止する(計算エンジンは作り直す)。何も実行していなければ何もしない */
  cancel(): void {
    this.abortCurrent?.(new Error("計算を中止しました。"));
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
      let timer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        this.abortCurrent = null;
      };
      /** 中止・時間切れ・読み込み失敗: Worker ごと捨てて、次の計算で作り直す */
      const fail = (error: Error) => {
        cleanup();
        this.stopWorker();
        reject(error);
      };
      const armTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(
          () => fail(new Error("計算に時間がかかりすぎたため中止しました。値を変えて再実行してください。")),
          TIMEOUT_MS,
        );
      };
      const onMessage = (e: MessageEvent<WorkerMessage>) => {
        const message = e.data;
        if (message.type === "ready") {
          armTimer();
        } else if (message.id === id) {
          cleanup();
          if (message.type === "result") resolve(message.result);
          else reject(new Error(message.message));
        }
      };
      const onError = () => fail(new Error("計算エンジンを読み込めませんでした。ページを再読み込みしてください。"));

      this.abortCurrent = fail;
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      if (this.ready) armTimer();
      worker.postMessage({ type: "run", id, netlist });
    });
  }
}
