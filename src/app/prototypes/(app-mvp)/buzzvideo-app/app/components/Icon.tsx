// 注意:Icon.tsx 与 Icon.web.tsx 各有一份 GLYPHS 映射,改图标时两份要同步修改。
import type { ComponentType } from "react";
import { Hand,
  ArrowUp, ArrowUpRight, AudioLines, Bell, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  CircleCheck, Clapperboard, Compass, Copy, Download, Ellipsis, ExternalLink, FileText, Flag, FolderOpen, Globe, Heart,
  Image as ImageGlyph, Images, Info, LoaderCircle, Lock, LogOut, Mail, Megaphone, Menu, MessageSquare, MessageSquareText, Pin, PinOff, Play,
  Plus, RotateCcw, Search, Settings, Share2, Shield, SquarePen, SquarePlus, Trash2, UserRound, Volume2, VolumeX,
  X,
} from "lucide-react-native";
import type { IconName } from "../data";
import { colors } from "../theme";

type Glyph = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const GLYPHS: Record<IconName, Glyph> = {
  "message-square-text": MessageSquareText, image: ImageGlyph, clapperboard: Clapperboard, "audio-lines": AudioLines, menu: Menu,
  "square-pen": SquarePen, plus: Plus, "arrow-up": ArrowUp, camera: Camera,
  images: Images, "file-text": FileText, "folder-open": FolderOpen, x: X, "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft, "chevron-right": ChevronRight, ellipsis: Ellipsis, download: Download, share: Share2,
  "message-square": MessageSquare, "rotate-ccw": RotateCcw, copy: Copy, flag: Flag, trash: Trash2,
  settings: Settings, "user-round": UserRound, check: Check, bell: Bell, globe: Globe, shield: Shield, hand: Hand,
  "log-out": LogOut, "external-link": ExternalLink, play: Play, search: Search, "circle-alert": CircleAlert,
  compass: Compass, megaphone: Megaphone, "square-plus": SquarePlus, "volume-2": Volume2, "volume-x": VolumeX,
  "circle-check": CircleCheck, loader: LoaderCircle, "arrow-up-right": ArrowUpRight, info: Info, mail: Mail, pin: Pin, "pin-off": PinOff, heart: Heart, lock: Lock,
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
  const Glyph = GLYPHS[name];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} {...(fill ? { fill } : {})} />;
}
