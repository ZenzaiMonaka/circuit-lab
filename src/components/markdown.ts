import katex from "katex";
import { marked } from "marked";

/**
 * 解説文(Markdown + $...$ / $$...$$ の数式)を HTML にする。
 * 数式は Markdown の変換で壊れる(_ や \ が解釈される)ため、いったん退避して後で戻す。
 * 入力はこのリポジトリ内の解説文だけで、利用者が入力した文字列は通らない。
 */
export function renderMarkdown(source: string): string {
  const rendered: string[] = [];
  const stash = (tex: string, displayMode: boolean) => {
    rendered.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false }));
    return `@@MATH${rendered.length - 1}@@`;
  };

  const withoutMath = source
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) => stash(tex, true))
    .replace(/\$([^$\n]+?)\$/g, (_, tex: string) => stash(tex, false));

  const html = marked.parse(withoutMath, { async: false }) as string;
  return html.replace(/@@MATH(\d+)@@/g, (_, index: string) => rendered[Number(index)]);
}
