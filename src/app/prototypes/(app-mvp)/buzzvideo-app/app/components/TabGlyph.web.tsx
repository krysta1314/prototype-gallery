/**
 * 底部 Tab 栏的两个自定义图标(2026-10-21,照参考图):
 * home = 圆角房子 + 一道横线(选中：实心，横线镂空露出底色;未选中：线条);
 * create = 一大一小两颗饱满的实心四角星(AI 创作;选中 / 未选中都实心，只换颜色)。
 * 网页端内联 svg;原生端见 TabGlyph.tsx(真实 APP 用 SF Symbols:house.fill / sparkles)
 */
const HOUSE = "M12 3.4 L20.2 9.7 Q21 10.3 21 11.3 V18.6 Q21 21 18.6 21 H5.4 Q3 21 3 18.6 V11.3 Q3 10.3 3.8 9.7 Z";
const BAR = "M9.9 15.4 H14.1 A1 1 0 0 1 14.1 17.4 H9.9 A1 1 0 0 1 9.9 15.4 Z";
/** 饱满的四角星(参考图那种):四条边往里弯但不细，控制点离中心 0.24r;尖角用圆角描边柔化 */
const star = (cx: number, cy: number, r: number) => {
  const c = r * 0.24;
  return `M${cx} ${cy - r} Q${cx + c} ${cy - c} ${cx + r} ${cy} Q${cx + c} ${cy + c} ${cx} ${cy + r} Q${cx - c} ${cy + c} ${cx - r} ${cy} Q${cx - c} ${cy - c} ${cx} ${cy - r} Z`;
};

export default function TabGlyph({ name, size = 22, color, filled, outline }: { name: "home" | "create"; size?: number; color: string; filled: boolean; /** 星星画成线条(首页工具入口用，和其他线条图标统一) */ outline?: boolean }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, style: { display: "block" } } as const;
  if (name === "home")
    return filled ? (
      <svg {...common}>
        <path d={HOUSE + " " + BAR} fill={color} fillRule="evenodd" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
    ) : (
      <svg {...common}>
        <path d={HOUSE} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
        <path d="M9.6 16.4 H14.4" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
      </svg>
    );
  // 两颗星都是实心(参考图):大星左下、小星右上;选中 / 未选中只换颜色
  const d = `${star(9.8, 13.6, 8.2)} ${star(18.8, 5.6, 3.8)}`;
  return (
    <svg {...common}>
      <path d={d} fill={outline ? "none" : color} stroke={color} strokeWidth={outline ? 1.6 : 1.4} strokeLinejoin="round" />
    </svg>
  );
}
