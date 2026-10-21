import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * PWA のお知らせ(画面の下に出る帯)。
 * - 初めて、アプリがオフラインで使えるように保存できたとき
 * - 新しいバージョンが公開されたとき(「更新」で切り替える)
 */
export function PwaNotice() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // 開いたままでも、1 時間ごとに新しいバージョンがないか調べる
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="pwa-notice" role="status">
      {needRefresh ? (
        <>
          <span>新しいバージョンがあります。</span>
          <button type="button" onClick={() => void updateServiceWorker(true)}>更新</button>
          <button type="button" className="secondary" onClick={() => setNeedRefresh(false)}>あとで</button>
        </>
      ) : (
        <>
          <span>オフラインでも使えるようになりました。</span>
          <button type="button" className="secondary" onClick={() => setOfflineReady(false)}>閉じる</button>
        </>
      )}
    </div>
  );
}
