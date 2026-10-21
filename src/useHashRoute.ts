import { useEffect, useState } from "react";

/** URL の `#/<回路ID>` を読む。ブックマークやブラウザの「戻る」で回路を切り替えられるようにする */
export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
