import { ArrowBigUp, Delete, Mic, Smile } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { useInsets, useStore } from "../provider";
import { keyboardHeight, useKeyboard } from "../keyboard";
import { useStill } from "../still";

/**
 * 仿真 iOS 26 键盘(深色模式)。照真机还原：顶部联想栏(三格，中间是带引号的当前词)、
 * QWERTY 四行(⇧ / ⌫ / 123 / space / 回车)、底部一行表情和听写图标;邮箱输入时空格旁多 @ 和 .;
 * 数字输入(验证码、积分上限)是 3×4 数字键盘，带字母注释;验证码框的联想栏显示「From Mail」验证码，点一下填进去。
 * 回车键：默认灰色 return;go / next / send / done / search 是蓝色。
 * 可以用电脑键盘直接打字，也可以点键盘上的键;键盘本身不抢焦点。真手机打开时不画(用手机自己的键盘)
 */
export default function Keyboard() {
  const kb = useKeyboard();
  const insets = useInsets();
  const { state } = useStore();
  const h = keyboardHeight(kb);
  const [anim] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(false);
  const [layer, setLayer] = useState<"abc" | "123">("abc");
  const [shift, setShift] = useState(true);
  const last = useRef(kb);
  if (kb.open) last.current = kb;
  const k = kb.open ? kb : last.current;

  // 先挂载、下一轮再播：视图还没挂上就开始的动画不会推到视图上(停在屏幕外)
  useEffect(() => {
    if (!kb.simulated || !kb.open) return;
    setShown(true);
    setLayer("abc");
    setShift(kb.autoCap);
  }, [kb.open, kb.simulated, kb.autoCap]);
  const still = useStill();
  useEffect(() => {
    if (!shown) return;
    const open = kb.open;
    // 旅程图静帧：直接停在弹起的位置
    if (still) {
      anim.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false }).start(({ finished }) => {
      // 被打断时直接落到终点
      if (!finished) anim.setValue(open ? 1 : 0);
      if (!open) setShown(false);
    });
  }, [kb.open, shown, anim, still]);
  const ty = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [340, 0] }), [anim]);

  if (!k.simulated || (!kb.open && !shown)) return null;
  const height = k.kind === "number" ? 300 : 336;
  const field = () => document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
  // 输入：用原生 setter 写值再发 input 事件，React 的 onChangeText 才会收到
  const insert = (text: string) => {
    const el = field();
    if (!el || !("value" in el)) return;
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
    let start = el.value.length;
    let end = start;
    try {
      start = el.selectionStart ?? start;
      end = el.selectionEnd ?? end;
    } catch {
      // type="email" 不支持选区：追加到末尾
    }
    const max = el.maxLength > 0 ? el.maxLength : Infinity;
    const next = (el.value.slice(0, start) + text + el.value.slice(end)).slice(0, max);
    set.call(el, next);
    try {
      el.setSelectionRange(start + text.length, start + text.length);
    } catch {
      /* 同上 */
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const backspace = () => {
    const el = field();
    if (!el) return;
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
    set.call(el, el.value.slice(0, -1));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const enter = () => {
    const el = field();
    if (!el) return;
    if (el.tagName === "TEXTAREA") return insert("\n");
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter", code: "Enter", bubbles: true }));
  };
  /** 点联想词：替换正在打的词，后面补一个空格 */
  const pick = (w: string, space = true) => {
    const el = field();
    if (!el) return;
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
    const cur = el.value.split(/\s/).pop() ?? "";
    set.call(el, el.value.slice(0, el.value.length - cur.length) + w + (space ? " " : ""));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    setShift(false);
  };
  const typeLetter = (c: string) => {
    insert(shift ? c.toUpperCase() : c);
    if (shift) setShift(false);
  };

  // 当前词(联想栏中间那格)
  const el = typeof document !== "undefined" ? field() : null;
  const word = (el?.value ?? "").split(/\s/).pop() ?? "";
  const blueReturn = k.returnKey !== "return";
  const returnLabel = k.returnKey === "enter" ? "return" : k.returnKey;

  return (
    <Animated.View
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, height, zIndex: 70, transform: [{ translateY: ty }] }}
      pointerEvents="box-none"
    >
      {/* 键盘不抢焦点:按下时阻止默认行为，输入框一直保持焦点 */}
      <div style={S.board} onMouseDown={(e) => e.preventDefault()} role="group" aria-label="Keyboard">
        {k.kind === "number" ? (
          <>
            <Suggest>
              {k.oneTimeCode ? (
                <Cell wide onTap={() => insert(demoCode(state.emailAuth?.email))}>
                  <span style={{ fontSize: 12, color: "rgba(235,235,245,0.6)" }}>From Mail</span>
                  <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: 1 }}>{demoCode(state.emailAuth?.email)}</span>
                </Cell>
              ) : null}
            </Suggest>
            <NumberPad onDigit={insert} onDelete={backspace} />
          </>
        ) : (
          <>
            <Suggest>
              {k.kind === "email" ? (
                <Cell wide onTap={() => pick("alex@example.com", false)}>
                  <span>alex@example.com</span>
                </Cell>
              ) : (
                <>
                  <Cell onTap={() => pick(word ? word.toLowerCase() : "I")}>{word ? word.toLowerCase() : "I"}</Cell>
                  <Sep />
                  <Cell onTap={() => pick(word || "The")}>{word ? `“${word}”` : "The"}</Cell>
                  <Sep />
                  <Cell onTap={() => pick(word ? `${word}s` : "I'm")}>{word ? `${word}s` : "I'm"}</Cell>
                </>
              )}
            </Suggest>
            <div style={S.rows}>
              {layer === "abc" ? (
                <>
                  <Row keys="qwertyuiop" shift={shift} onKey={typeLetter} />
                  <Row keys="asdfghjkl" shift={shift} onKey={typeLetter} inset={18} />
                  <div style={S.row}>
                    <Key fn w={44} onTap={() => setShift((v) => !v)} label="Shift">
                      <ArrowBigUp size={22} strokeWidth={1.8} fill={shift ? "#fff" : "none"} />
                    </Key>
                    <div style={{ flex: 1, display: "flex", gap: 6, margin: "0 8px" }}>
                      {"zxcvbnm".split("").map((c) => (
                        <Key key={c} onTap={() => typeLetter(c)}>
                          {shift ? c.toUpperCase() : c}
                        </Key>
                      ))}
                    </div>
                    <Key fn w={44} onTap={backspace} label="Delete">
                      <Delete size={22} strokeWidth={1.8} />
                    </Key>
                  </div>
                </>
              ) : (
                <>
                  <Row keys="1234567890" onKey={insert} />
                  <Row keys={"-/:;()$&@\""} onKey={insert} />
                  <div style={S.row}>
                    <Key fn w={44} onTap={() => {}} label="Symbols">
                      <span style={{ fontSize: 15 }}>#+=</span>
                    </Key>
                    <div style={{ flex: 1, display: "flex", gap: 6, margin: "0 8px" }}>
                      {".,?!'".split("").map((c) => (
                        <Key key={c} onTap={() => insert(c)}>
                          {c}
                        </Key>
                      ))}
                    </div>
                    <Key fn w={44} onTap={backspace} label="Delete">
                      <Delete size={22} strokeWidth={1.8} />
                    </Key>
                  </div>
                </>
              )}
              <div style={S.row}>
                <Key fn w={92} onTap={() => setLayer((l) => (l === "abc" ? "123" : "abc"))}>
                  <span style={{ fontSize: 16 }}>{layer === "abc" ? "123" : "ABC"}</span>
                </Key>
                {k.kind === "email" ? (
                  <>
                    <Key onTap={() => insert("@")} w={40}>
                      @
                    </Key>
                    <Key onTap={() => insert(" ")}>
                      <span style={{ fontSize: 16 }}>space</span>
                    </Key>
                    <Key onTap={() => insert(".")} w={40}>
                      .
                    </Key>
                  </>
                ) : (
                  <Key onTap={() => insert(" ")}>
                    <span style={{ fontSize: 16 }}>space</span>
                  </Key>
                )}
                <Key fn={!blueReturn} blue={blueReturn} w={92} onTap={enter}>
                  <span style={{ fontSize: 16 }}>{returnLabel}</span>
                </Key>
              </div>
            </div>
            {/* 底部一行：表情 / 听写(只做样子) */}
            <div style={{ ...S.bottom, paddingBottom: Math.max(insets.bottom - 10, 6) }}>
              <Smile size={26} strokeWidth={1.6} color="rgba(235,235,245,0.75)" />
              <Mic size={24} strokeWidth={1.6} color="rgba(235,235,245,0.75)" />
            </div>
          </>
        )}
        {k.kind === "number" ? <div style={{ height: Math.max(insets.bottom - 4, 8) }} /> : null}
      </div>
    </Animated.View>
  );
}

/** 原型里的「邮件验证码」:按邮箱生成一个固定的 6 位数(任意 6 位数都能通过验证) */
function demoCode(email?: string) {
  let n = 0;
  for (const c of email ?? "alex") n = (n * 31 + c.charCodeAt(0)) % 900000;
  return String(100000 + n);
}

function Row({ keys, onKey, shift, inset = 0 }: { keys: string; onKey: (c: string) => void; shift?: boolean; inset?: number }) {
  return (
    <div style={{ ...S.row, padding: `0 ${inset}px` }}>
      {keys.split("").map((c) => (
        <Key key={c} onTap={() => onKey(c)}>
          {shift ? c.toUpperCase() : c}
        </Key>
      ))}
    </div>
  );
}

function Key({ children, onTap, fn, blue, w, label }: { children: ReactNode; onTap: () => void; fn?: boolean; blue?: boolean; w?: number; label?: string }) {
  const [down, setDown] = useState(false);
  return (
    <div
      role="button"
      aria-label={label}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => {
        setDown(false);
        onTap();
      }}
      onPointerLeave={() => setDown(false)}
      style={{
        ...S.key,
        ...(fn ? S.fn : null),
        ...(blue ? S.blue : null),
        ...(w ? { flex: `0 0 ${w}px` } : null),
        ...(down ? { filter: "brightness(1.35)" } : null),
      }}
    >
      {children}
    </div>
  );
}

function Suggest({ children }: { children: ReactNode }) {
  return <div style={S.suggest}>{children}</div>;
}
function Cell({ children, onTap, wide }: { children: ReactNode; onTap: () => void; wide?: boolean }) {
  return (
    <div role="button" onPointerUp={onTap} style={{ ...S.cell, ...(wide ? { flexDirection: "column", gap: 0 } : null) }}>
      {children}
    </div>
  );
}
const Sep = () => <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)" }} />;

function NumberPad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys: [string, string][] = [
    ["1", ""], ["2", "ABC"], ["3", "DEF"],
    ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
    ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ];
  return (
    <div style={S.pad}>
      {keys.map(([d, l]) => (
        <Key key={d} onTap={() => onDigit(d)}>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
            <span style={{ fontSize: 26 }}>{d}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, marginTop: 2, minHeight: 9 }}>{l}</span>
          </span>
        </Key>
      ))}
      <span />
      <Key onTap={() => onDigit("0")}>
        <span style={{ fontSize: 26 }}>0</span>
      </Key>
      <div role="button" aria-label="Delete" onPointerUp={onDelete} style={{ ...S.key, background: "transparent", boxShadow: "none" }}>
        <Delete size={26} strokeWidth={1.6} />
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  // iOS 26 深色键盘：液态玻璃底、上沿圆角
  board: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "rgba(30,30,32,0.88)",
    backdropFilter: "blur(30px) saturate(1.6)",
    WebkitBackdropFilter: "blur(30px) saturate(1.6)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.18)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
  },
  suggest: { height: 44, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 6px", flexShrink: 0 },
  cell: { flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", cursor: "default", borderRadius: 8 },
  rows: { display: "flex", flexDirection: "column", gap: 11, padding: "4px 3px 0" },
  row: { display: "flex", gap: 6, height: 45 },
  key: {
    flex: 1,
    minWidth: 0,
    height: 45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8.5,
    background: "#6b6b70",
    boxShadow: "0 1px 0 rgba(0,0,0,0.35)",
    fontSize: 22,
    fontWeight: 400,
    color: "#fff",
    cursor: "default",
  },
  fn: { background: "#46464b" },
  blue: { background: "#0a84ff" },
  bottom: { marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 22px", height: 50, boxSizing: "content-box" },
  pad: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: 46, gap: 7, padding: "2px 6px 0" },
};
