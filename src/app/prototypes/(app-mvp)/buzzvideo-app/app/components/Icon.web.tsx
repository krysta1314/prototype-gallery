// 注意:Icon.tsx 与 Icon.web.tsx 各有一份 GLYPHS 映射,改图标时两份要同步修改。
import type { ComponentType } from "react";
import {
  ArrowUp, AudioLines, Bell, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clapperboard,
  Compass, Copy, Download, Ellipsis, ExternalLink, FileText, Flag, FolderOpen, Globe, Image as ImageGlyph, Images,
  ListChecks, LogOut, Menu, MessageSquare, Mic, Play, Plus, RotateCcw, Search, Settings, Share2, Shield, Sparkles,
  SquarePen, Trash2, UserRound, X,
} from "lucide-react";
import type { IconName } from "../data";

type Glyph = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const GLYPHS: Record<IconName, Glyph> = {
  sparkles: Sparkles, image: ImageGlyph, clapperboard: Clapperboard, "audio-lines": AudioLines, menu: Menu,
  "square-pen": SquarePen, "list-checks": ListChecks, plus: Plus, mic: Mic, "arrow-up": ArrowUp, camera: Camera,
  images: Images, "file-text": FileText, "folder-open": FolderOpen, x: X, "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft, "chevron-right": ChevronRight, ellipsis: Ellipsis, download: Download, share: Share2,
  "message-square": MessageSquare, "rotate-ccw": RotateCcw, copy: Copy, flag: Flag, trash: Trash2,
  settings: Settings, "user-round": UserRound, check: Check, bell: Bell, globe: Globe, shield: Shield,
  "log-out": LogOut, "external-link": ExternalLink, play: Play, search: Search, "circle-alert": CircleAlert,
  compass: Compass,
};

export default function Icon({
  name,
  size = 20,
  color = "#1a1a2e",
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Glyph = GLYPHS[name];
  // 包一层定位元素:同级的绝对定位渐变背景(按钮、发送键)不会把 svg 盖住
  return (
    <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth} />
    </span>
  );
}
