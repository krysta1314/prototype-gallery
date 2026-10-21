import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from "react";

/**
 * 键盘状态(2026-10-21 补:原型之前点输入框没有键盘)。
 * 网页端:监听 APP 根节点里的输入框获得 / 失去焦点。桌面浏览器 → 显示仿真 iOS 键盘(components/Keyboard.web.tsx);
 * 真手机打开(触屏)→ 不画仿真键盘，交给手机自己的键盘，但布局照样按「键盘弹起」处理(Tab 栏隐藏等)。
 * 真实 APP:用 RN 的 Keyboard 事件(keyboardWillShow / Hide)拿键盘高度，系统画键盘
 */
export type KeyboardKind = "default" | "email" | "number";
export type KeyboardState = {
  /** 有输入框在打字(键盘弹起) */
  open: boolean;
  kind: KeyboardKind;
  /** 回车键文字:return / go / next / send / done / search */
  returnKey: string;
  /** 验证码输入框(iOS 会在联想栏显示「From Mail」的验证码) */
  oneTimeCode: boolean;
  /** 首字母自动大写(邮箱、autoCapitalize="none" 的框不大写) */
  autoCap: boolean;
  /** 仿真键盘是否由原型来画(桌面浏览器 true;真手机 false,用手机自己的键盘) */
  simulated: boolean;
};

/** 旅程图静帧截图：输入框没有真的获得焦点，由截图指定「这一屏键盘是弹起的」 */
export const ForcedKeyboard = createContext<KeyboardState | null>(null);
/** 截图里要显示的键盘 */
export const forcedKeyboard = (kind: KeyboardKind): KeyboardState =>
  kind === "email"
    ? { open: true, kind, returnKey: "go", oneTimeCode: false, autoCap: false, simulated: true }
    : kind === "number"
      ? { open: true, kind, returnKey: "return", oneTimeCode: true, autoCap: false, simulated: true }
      : { open: true, kind, returnKey: "return", oneTimeCode: false, autoCap: true, simulated: true };

const CLOSED: KeyboardState = { open: false, kind: "default", returnKey: "return", oneTimeCode: false, autoCap: true, simulated: false };
const KeyboardCtx = createContext<KeyboardState>(CLOSED);
export const useKeyboard = () => useContext(KeyboardCtx);

/** 仿真键盘的高度(联想栏 + 四行键 + 底部表情 / 听写一行，含 Home 横条区域;按 iPhone 17 Pro 竖屏) */
export const KEYBOARD_H = 336;
export const KEYBOARD_H_NUMBER = 300;
export const keyboardHeight = (k: KeyboardState) => (!k.open || !k.simulated ? 0 : k.kind === "number" ? KEYBOARD_H_NUMBER : KEYBOARD_H);

const isTextField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|file|hidden)$/.test((el as HTMLInputElement).type))) && !(el as HTMLInputElement).readOnly;

function read(el: HTMLInputElement | HTMLTextAreaElement, simulated: boolean): KeyboardState {
  const mode = el.inputMode || (el as HTMLInputElement).type;
  const kind: KeyboardKind = /numeric|decimal|tel|number/.test(mode) ? "number" : /email/.test(mode) ? "email" : "default";
  const hint = el.enterKeyHint;
  const cap = el.getAttribute("autocapitalize");
  return { open: true, kind, returnKey: hint && hint !== "enter" ? hint : "return", oneTimeCode: el.autocomplete === "one-time-code", autoCap: kind === "default" && cap !== "none" && cap !== "off", simulated };
}

/** 挂在 APP 根上;rootRef 指向根节点的 DOM(只管自己这台手机里的输入框) */
export function KeyboardProvider({ rootRef, children }: { rootRef: RefObject<unknown>; children: ReactNode }) {
  const [state, setState] = useState<KeyboardState>(CLOSED);
  useEffect(() => {
    if (typeof document === "undefined") return;
    // 真手机(触屏)用自己的键盘
    const simulated = !(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const inside = (el: Element | null) => {
      const root = rootRef.current as HTMLElement | null;
      return !!root && !!el && root.contains(el);
    };
    const sync = () => {
      const el = document.activeElement;
      setState((s) => {
        if (isTextField(el) && inside(el)) {
          const n = read(el, simulated);
          return s.open && s.kind === n.kind && s.returnKey === n.returnKey && s.oneTimeCode === n.oneTimeCode && s.autoCap === n.autoCap && s.simulated === n.simulated ? s : n;
        }
        return s.open ? CLOSED : s;
      });
    };
    // 失焦后等一拍:焦点可能只是从一个输入框跳到另一个
    const onOut = () => setTimeout(sync, 0);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", onOut);
    sync();
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", onOut);
    };
  }, [rootRef]);
  const forced = useContext(ForcedKeyboard);
  return <KeyboardCtx.Provider value={forced ?? state}>{children}</KeyboardCtx.Provider>;
}

/** 收起键盘:让当前输入框失焦(仿真键盘右下角没有收起键，点输入框外面或这里调用) */
export function dismissKeyboard() {
  if (typeof document === "undefined") return;
  (document.activeElement as HTMLElement | null)?.blur?.();
}
