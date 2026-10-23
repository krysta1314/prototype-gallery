/**
 * 生成中的卡片底(2026-10-23,和网页版 generation-queue-upsell 的 Generating 卡同一套):
 * 浅杏色 → 粉色的斜向条纹渐变，5 秒一圈缓慢流动;减少动态效果时静止。铺满父容器(父容器需 overflow hidden)
 */
const CSS = `
@keyframes bz-gen-shift { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
.bz-gen { position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(135deg, rgba(255,219,179,0.95) 0%, rgba(255,179,180,0.9) 25%, rgba(255,219,179,0.95) 50%);
  background-size: 200% 200%; animation: bz-gen-shift 5s linear infinite; }
@media (prefers-reduced-motion: reduce) { .bz-gen { animation: none; } }
`;

export default function GenFill() {
  return (
    <>
      <style>{CSS}</style>
      <div className="bz-gen" />
    </>
  );
}
