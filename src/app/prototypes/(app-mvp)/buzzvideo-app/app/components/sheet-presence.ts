import { createContext, useContext } from "react";

/** Sheets 在 nav.sheet 变为 null 后仍保留上一个面板,把 visible 置为 false 让它先播退场动画,
 *  动画结束后调用 onExited 再卸载 —— 所有关闭路径(背景点击、选中选项、切 Tab)都有退场 */
export type SheetPresence = { visible: boolean; onExited: () => void };

export const SheetPresenceContext = createContext<SheetPresence>({ visible: true, onExited: () => {} });

export const useSheetPresence = () => useContext(SheetPresenceContext);
