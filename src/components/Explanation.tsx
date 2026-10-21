import { useMemo } from "react";
import { renderMarkdown } from "./markdown";

export function Explanation({ source }: { source: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  // html は同梱の解説文だけから作られる(markdown.ts 参照)
  return <div className="explanation" dangerouslySetInnerHTML={{ __html: html }} />;
}
