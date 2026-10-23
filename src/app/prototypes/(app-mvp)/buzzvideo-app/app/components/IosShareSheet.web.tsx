import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { siInstagram, siTiktok, siWhatsapp } from "simple-icons";
import { A } from "../data";
import { useInsets } from "../provider";
import { prefersReducedMotion } from "./motion";

/**
 * iOS 26 系统分享面板(UIActivityViewController,深色模式)的仿真(2026-10-21,照真机还原;iOS 26 起面板悬浮、四周留边、液态玻璃底):
 * 顶部预览(缩略图 + 标题 + Options ›)和右上角 ✕;一排 AirDrop + 常联系的人;一排 APP(信息 / 邮件 / Instagram / TikTok / WhatsApp / 更多);
 * 下面一组操作(Copy / Save Video / Save to Files),最后一行蓝字 Edit Actions…
 * 真实 APP:直接调系统 Share API(RN Share.share / react-native-share),面板由系统画，这里只为评审看样子
 */
export default function IosShareSheet({
  title,
  thumb,
  isVideo,
  link,
  onClose,
  onDone,
}: {
  title: string;
  thumb: string;
  isVideo: boolean;
  /** 分享的是链接(邀请好友):预览第二行写网址，操作区只留 Copy */
  link?: string;
  onClose: () => void;
  /** 选了一个目标：关面板 + 顶部提示 */
  onDone: (toast: string) => void;
}) {
  const insets = useInsets();
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: prefersReducedMotion() ? 0 : 320, easing: Easing.bezier(0.2, 0.9, 0.3, 1), useNativeDriver: false }).start();
  }, [anim]);
  const ty = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [560, 0] }), [anim]);
  const close = () => Animated.timing(anim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => onClose());
  const pick = (t: string) => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => onDone(t));

  return (
    <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 60 }}>
      <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", opacity: anim }}>
        <div style={{ position: "absolute", inset: 0 }} onClick={close} />
      </Animated.View>
      <Animated.View style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: [{ translateY: ty }] }}>
        {/* iOS 26:面板不贴边，四周留 8、四角都是大圆角，液态玻璃底(背后内容模糊透出) */}
        <div style={{ ...S.sheet, marginBottom: Math.max(insets.bottom - 26, 8) }} role="dialog" aria-label="Share">
          {/* 预览 */}
          <div style={S.header}>
            <img src={thumb} alt="" style={S.thumb} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.title}>{title}</div>
              <div style={S.options}>
                {link ? link.replace(/^https?:\/\//, "") : isVideo ? "Video" : "Image"} · <span style={{ color: "#0a84ff" }}>Options ›</span>
              </div>
            </div>
            <button type="button" aria-label="Close" onClick={close} style={S.closeBtn}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M2 2l8 8M10 2l-8 8" stroke="rgba(235,235,245,0.6)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div style={S.divider} />

          {/* AirDrop + 常联系的人 */}
          <div style={S.row}>
            <Target label="AirDrop" onTap={() => pick("Sent with AirDrop")}>
              <div style={{ ...S.circle, background: "linear-gradient(#45a8ff,#0a6cff)" }}>
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M10 22a9 9 0 1 1 14 0" />
                  <path d="M13.5 19.5a5 5 0 1 1 7 0" />
                  <circle cx="17" cy="16" r="1.6" fill="#fff" stroke="none" />
                  <path d="M17 18v9" />
                </svg>
              </div>
            </Target>
            <Target label="Mia Chen" onTap={() => pick("Sent to Mia Chen")}>
              <Avatar initials="MC" bg="linear-gradient(#a1a1aa,#6b6b73)" badge="#34c759" />
            </Target>
            <Target label="Alex" onTap={() => pick("Sent to Alex")}>
              <div style={{ position: "relative" }}>
                <img src={`${A}/avatar.jpg`} alt="" style={{ ...S.circle, objectFit: "cover" }} />
                <span style={{ ...S.badge, background: "#34c759" }} />
              </div>
            </Target>
            <Target label="Team" onTap={() => pick("Sent to Team")}>
              <Avatar initials="T" bg="linear-gradient(#ff9f6b,#ff5e1a)" badge="#0a84ff" />
            </Target>
          </div>

          {/* APP */}
          <div style={{ ...S.row, overflowX: "auto" }} className="hide-scrollbars">
            <Target label="Messages" onTap={() => pick("Opening Messages…")}>
              <AppIcon bg="linear-gradient(#5ff777,#1fc93a)">
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 4C7 4 3 7.3 3 11.4c0 2.3 1.3 4.4 3.3 5.7-.2 1.2-.8 2.4-1.8 3.3 1.9 0 3.6-.7 4.8-1.8.9.2 1.8.3 2.7.3 5 0 9-3.3 9-7.5S17 4 12 4z" fill="#fff" />
                </svg>
              </AppIcon>
            </Target>
            <Target label="Mail" onTap={() => pick("Opening Mail…")}>
              <AppIcon bg="linear-gradient(#3fb7ff,#1576ef)">
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="6" width="18" height="12.5" rx="2" fill="#fff" />
                  <path d="M3.6 7l8.4 6.2L20.4 7" stroke="#1d86f5" strokeWidth="1.4" fill="none" />
                </svg>
              </AppIcon>
            </Target>
            <Target label="Instagram" onTap={() => pick("Opening Instagram…")}>
              <AppIcon bg="radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)">
                <Brand path={siInstagram.path} />
              </AppIcon>
            </Target>
            <Target label="TikTok" onTap={() => pick("Opening TikTok…")}>
              <AppIcon bg="#000">
                <Brand path={siTiktok.path} />
              </AppIcon>
            </Target>
            <Target label="WhatsApp" onTap={() => pick("Opening WhatsApp…")}>
              <AppIcon bg="#25D366">
                <Brand path={siWhatsapp.path} />
              </AppIcon>
            </Target>
            <Target label="More" onTap={() => {}}>
              <AppIcon bg="#3a3a3c">
                <svg width="30" height="8" viewBox="0 0 30 8" aria-hidden>
                  <circle cx="4" cy="4" r="3" fill="#fff" />
                  <circle cx="15" cy="4" r="3" fill="#fff" />
                  <circle cx="26" cy="4" r="3" fill="#fff" />
                </svg>
              </AppIcon>
            </Target>
          </div>

          {/* 操作 */}
          <div style={S.group}>
            <ActionRow label="Copy" last={!!link} onTap={() => pick("Link copied")} icon={<path d="M8 8h10v12H8zM5 15V4h10" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinejoin="round" />} />
            {link ? null : (
            <>
            <ActionRow
              label={isVideo ? "Save Video" : "Save Image"}
              onTap={() => pick("Saved to Photos")}
              icon={<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            />
            <ActionRow
              label="Save to Files"
              last
              onTap={() => pick("Saved to Files")}
              icon={<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" stroke="#fff" strokeWidth="1.7" fill="none" />}
            />
            </>
            )}
          </div>
          <div style={S.edit}>Edit Actions…</div>
        </div>
      </Animated.View>
    </Animated.View>
  );
}

function Target({ label, onTap, children }: { label: string; onTap: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onTap} style={S.target} aria-label={label}>
      {children}
      <span style={S.targetLabel}>{label}</span>
    </button>
  );
}
function AppIcon({ bg, children }: { bg: string; children: ReactNode }) {
  return <div style={{ ...S.app, background: bg }}>{children}</div>;
}
function Brand({ path }: { path: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden>
      <path d={path} fill="#fff" />
    </svg>
  );
}
function Avatar({ initials, bg, badge }: { initials: string; bg: string; badge: string }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ ...S.circle, background: bg, color: "#fff", fontSize: 22, fontWeight: 600 }}>{initials}</div>
      <span style={{ ...S.badge, background: badge }} />
    </div>
  );
}
function ActionRow({ label, icon, onTap, last }: { label: string; icon: ReactNode; onTap: () => void; last?: boolean }) {
  return (
    <button type="button" onClick={onTap} style={{ ...S.action, borderBottom: last ? "none" : "0.5px solid rgba(255,255,255,0.1)" }}>
      <span>{label}</span>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        {icon}
      </svg>
    </button>
  );
}

const S: Record<string, CSSProperties> = {
  sheet: {
    margin: "0 8px",
    paddingBottom: 14,
    borderRadius: 38,
    overflow: "hidden",
    background: "rgba(36,36,40,0.72)",
    backdropFilter: "blur(40px) saturate(1.8)",
    WebkitBackdropFilter: "blur(40px) saturate(1.8)",
    boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.28), inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 20px 50px rgba(0,0,0,0.5)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "18px 18px 14px" },
  thumb: { width: 44, height: 44, borderRadius: 9, objectFit: "cover" },
  title: { fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  options: { fontSize: 13, color: "rgba(235,235,245,0.6)", marginTop: 2 },
  // 玻璃圆按钮
  closeBtn: { width: 32, height: 32, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.12)", boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  divider: { height: 0.5, margin: "0 18px", background: "rgba(255,255,255,0.12)" },
  // 两排图标左右都留 14,不贴面板边;APP 那排可以横滑
  row: { display: "flex", gap: 4, padding: "14px 14px 6px" },
  target: { flex: "0 0 74px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", color: "#fff" },
  targetLabel: { fontSize: 11, lineHeight: "13px", color: "rgba(235,235,245,0.85)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  circle: { width: 60, height: 60, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", right: -1, bottom: -1, width: 20, height: 20, borderRadius: 10, border: "2px solid #2a2a2e" },
  app: { width: 60, height: 60, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  group: { margin: "12px 14px 0", borderRadius: 22, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  action: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", background: "none", border: "none", color: "#fff", fontSize: 17, cursor: "pointer", textAlign: "left" },
  edit: { fontSize: 17, color: "#0a84ff", padding: "14px 30px 4px" },
};
