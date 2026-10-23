import { useRef, useState } from "react";
import Icon from "./Icon";
import type { ChatVideoProps } from "./chat-video-types";

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/**
 * 对话里的视频结果卡(2026-10-23,照网页版):默认暂停，中间一个圆形播放键;底部播放条(播放 / 暂停、声音、时间、进度、全屏)。
 * 点画面切换播放 / 暂停;点全屏 → 打开作品详情。真实 APP 用 AVPlayer / expo-video 的内嵌播放器
 */
export default function ChatVideo({ uri, poster, onFullscreen }: ChatVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !d) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * d;
  };
  return (
    <div style={S.box}>
      <video
        ref={ref}
        src={uri}
        poster={poster}
        muted={muted}
        playsInline
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setD(e.currentTarget.duration)}
        onClick={toggle}
        style={S.video}
      />
      {!playing ? (
        <button type="button" aria-label="Play" onClick={toggle} style={S.bigPlay}>
          <Icon name="play" size={18} color="#fff" fill="#fff" strokeWidth={2} />
        </button>
      ) : null}
      <div style={S.bar}>
        <div style={S.track} onClick={seek}>
          <div style={{ ...S.fill, width: `${d ? (t / d) * 100 : 0}%` }} />
        </div>
        <div style={S.row}>
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle} style={S.ctl}>
            <Icon name={playing ? "pause" : "play"} size={15} color="#fff" strokeWidth={2.2} />
          </button>
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)} style={S.ctl}>
            <Icon name={muted ? "volume-x" : "volume-2"} size={15} color="#fff" strokeWidth={2.2} />
          </button>
          <span style={S.time}>{`${fmt(t)} / ${fmt(d)}`}</span>
          <span style={{ flex: 1 }} />
          <button type="button" aria-label="Full screen" onClick={onFullscreen} style={S.ctl}>
            <Icon name="maximize" size={14} color="#fff" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  box: { position: "absolute", inset: 0, background: "#000" },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  bigPlay: { position: "absolute", left: "50%", top: "50%", width: 44, height: 44, marginLeft: -22, marginTop: -22, borderRadius: 22, border: "none", background: "rgba(255,255,255,0.28)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", paddingLeft: 3 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 8px 6px", background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))" },
  track: { height: 14, display: "flex", alignItems: "center", cursor: "pointer", margin: "0 4px", position: "relative" },
  fill: { position: "absolute", left: 0, height: 2, borderRadius: 1, background: "#fff" },
  row: { display: "flex", alignItems: "center", gap: 2 },
  ctl: { width: 28, height: 28, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 },
  time: { fontSize: 11, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums", marginLeft: 2 },
};
