// 注意:Icon.tsx 与 Icon.web.tsx 各有一份 GLYPHS 映射,改图标时两份要同步修改。
import type { ComponentType } from "react";
import { Hand, House, Sparkles, Speech, SquareUser, ShoppingBag, ScanFace, Scissors, Package, Shirt, ImagePlay, Eraser, Expand, Film, Link, Mic, ZoomIn, Crop, Pause, Maximize2, Pencil, AtSign, UserPlus, Gift, ListChecks, Users, Upload, SlidersHorizontal, LayoutGrid, Flame, Gem, ArrowDownRight, RectangleVertical, RectangleHorizontal, Square, WandSparkles, Trophy,
  ArrowUp, ArrowUpRight, AudioLines, Bell, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  CircleCheck, Clapperboard, Compass, Copy, Download, Ellipsis, ExternalLink, FileText, Flag, FolderOpen, Globe, Heart,
  Image as ImageGlyph, Images, Info, LoaderCircle, Lock, LogOut, Mail, Megaphone, Menu, MessageSquare, MessageSquareText, Pin, PinOff, Play,
  Plus, RotateCcw, Search, Settings, Share, Shield, SquarePen, SquarePlus, Trash2, UserRound, Volume2, VolumeX,
  X,
} from "lucide-react";
import type { IconName } from "../data";
import ShareGlyph, { DownloadGlyph } from "./ShareGlyph.web";
import { colors } from "../theme";

type Glyph = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const GLYPHS: Record<IconName, Glyph> = {
  "message-square-text": MessageSquareText, image: ImageGlyph, clapperboard: Clapperboard, "audio-lines": AudioLines, menu: Menu,
  "square-pen": SquarePen, plus: Plus, "arrow-up": ArrowUp, camera: Camera,
  images: Images, "file-text": FileText, "folder-open": FolderOpen, x: X, "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft, "chevron-right": ChevronRight, ellipsis: Ellipsis, download: Download, share: Share,
  "message-square": MessageSquare, "rotate-ccw": RotateCcw, copy: Copy, flag: Flag, trash: Trash2,
  settings: Settings, "user-round": UserRound, check: Check, bell: Bell, globe: Globe, shield: Shield, hand: Hand,
  "log-out": LogOut, "external-link": ExternalLink, play: Play, search: Search, "circle-alert": CircleAlert,
  compass: Compass, megaphone: Megaphone, "square-plus": SquarePlus, "volume-2": Volume2, "volume-x": VolumeX,
  "circle-check": CircleCheck, loader: LoaderCircle, "arrow-up-right": ArrowUpRight, info: Info, mail: Mail, pin: Pin, "pin-off": PinOff, heart: Heart, lock: Lock, house: House, sparkles: Sparkles, "speech": Speech, "square-user": SquareUser, "shopping-bag": ShoppingBag, "scan-face": ScanFace, "scissors": Scissors, "package": Package, "shirt": Shirt, "image-play": ImagePlay, "eraser": Eraser, "expand": Expand, "film": Film, "link": Link, "mic": Mic, "zoom-in": ZoomIn, crop: Crop, pencil: Pencil, "at-sign": AtSign, "user-plus": UserPlus, gift: Gift, "list-checks": ListChecks, users: Users, upload: Upload, pause: Pause, maximize: Maximize2, "sliders-horizontal": SlidersHorizontal, "layout-grid": LayoutGrid, "flame": Flame, "gem": Gem, "arrow-down-right": ArrowDownRight, "rectangle-vertical": RectangleVertical, "rectangle-horizontal": RectangleHorizontal, "square": Square, "wand-sparkles": WandSparkles, "trophy": Trophy,
};

export default function Icon({
  name,
  size = 20,
  color = colors.ink,
  strokeWidth = 1.75,
  fill,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** 实心图标(如 ATT 角标的小手):填充色 */
  fill?: string;
}) {
  // 分享 / 下载全 APP 统一用灵感流右侧那两个图标(实心转发箭头、托盘 + 向下箭头,2026-10-23)
  if (name === "share" || name === "download") {
    const G = name === "share" ? ShareGlyph : DownloadGlyph;
    return (
      <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
        <G size={size} color={color} />
      </span>
    );
  }
  const Glyph = GLYPHS[name];
  // 包一层定位元素:同级的绝对定位渐变背景(按钮、发送键)不会把 svg 盖住
  return (
    <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth} {...(fill ? { fill } : {})} />
    </span>
  );
}
