"use client";

import { SQUIRCLE } from "./glass";

/** 品牌 logo 原文件 —— 不能改动(不重画、不去星星、不换色),图标只提供底色 */
export const LOGO = "/prototypes/buzzvideo-app/app-logo.svg";

/** App 图标底色:黑底(2026-10-16 定,配合 APP 深色主题);logo 原样不动 */
export const ICON_BG = "linear-gradient(#2a2a30,#0b0b0e)";

/** logo 在图标里的边长占比(logo 文件自带留白) */
export const LOGO_RATIO = 0.84;

/** 完整图标(底色 + logo),用在通知、灵动岛等小尺寸处 */
export function AppIconTile({
  size,
  glass = true,
}: {
  size: number;
  glass?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.265,
        background: ICON_BG,
        boxShadow: glass
          ? "inset 0 1px 0.5px rgba(255,255,255,0.2), inset 0 0 0 0.5px rgba(255,255,255,0.12)"
          : undefined,
        ...SQUIRCLE,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO}
        alt=""
        draggable={false}
        style={{ width: size * LOGO_RATIO, height: size * LOGO_RATIO }}
      />
    </span>
  );
}
