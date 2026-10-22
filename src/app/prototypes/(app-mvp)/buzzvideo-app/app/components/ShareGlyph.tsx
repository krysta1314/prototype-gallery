import Icon from "./Icon";

/** 原生端兜底：真实 APP 用 SF Symbol arrowshape.turn.up.right.fill */
export default function ShareGlyph({ size = 28, color }: { size?: number; color: string }) {
  return <Icon name="share" size={size} color={color} />;
}

/** 原生端兜底：真实 APP 用 SF Symbol arrow.down.to.line */
export function DownloadGlyph({ size = 28, color }: { size?: number; color: string }) {
  return <Icon name="download" size={size} color={color} />;
}
