/* 把模型回复里的轻量 markdown(**加粗**、- 列表、空行分段)渲染成正文。从 agent/chat/page.tsx 原样搬出。 */

/* 极简 markdown:段落、"-" 列表、**加粗**。回复是模型写的,只放开这三样。 */
export function Markdown({ text }: { text: string }) {
  /* 模型在 JSON 里常把星号转义成 \*\*,先还原;顺手把「**平台**：」这种加粗后紧跟的全角冒号收进加粗外面 */
  const clean = text.replace(/\r/g, "").replace(/\\\*/g, "*").replace(/\\_/g, "_");
  const blocks = clean.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-[#1a1a2e]">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        /* 项目符号:- • 数字. 或单个 *(后面不能再跟 *,否则会把 **加粗** 吃掉一半) */
        const bullet = /^(?:[-•]|\*(?!\*)|\d+[.、])\s+/;
        const isList = lines.every((l) => bullet.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#c6c8d4]" />
                  <span>{inline(l.replace(bullet, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {inline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
