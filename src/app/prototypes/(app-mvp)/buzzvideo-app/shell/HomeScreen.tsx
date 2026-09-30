"use client";

import {
  Camera,
  Clock,
  Cloud,
  Compass,
  Flower2,
  Mail,
  Map,
  MessageCircle,
  Music,
  NotebookPen,
  Phone,
  Search,
  Settings,
  SquareCheckBig,
  Sun,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { ICON_BG, LOGO, LOGO_RATIO } from "./AppIcon";
import {
  clearGlass,
  ICON_RADIUS,
  ICON_SIZE,
  iconRim,
  iconSheen,
  SQUIRCLE,
} from "./glass";
import { useClock } from "./StatusBar";

/** iOS 深色模式图标底:深灰渐变,图形用各 App 的主色 */
const DARK_TILE = "linear-gradient(#2c2c2e,#121214)";

/** 桌面上的系统 App(只做陈设,点了轻轻按一下,不会打开) */
type SysApp = { name: string; Icon: LucideIcon; bg: string; fg: string };

const GRID: SysApp[] = [
  {
    name: "Photos",
    Icon: Flower2,
    bg: DARK_TILE,
    fg: "#f2a33a",
  },
  {
    name: "Camera",
    Icon: Camera,
    bg: DARK_TILE,
    fg: "#d1d1d6",
  },
  {
    name: "Clock",
    Icon: Clock,
    bg: DARK_TILE,
    fg: "#ffffff",
  },
  {
    name: "Notes",
    Icon: NotebookPen,
    bg: DARK_TILE,
    fg: "#ffd60a",
  },
  {
    name: "Maps",
    Icon: Map,
    bg: DARK_TILE,
    fg: "#30d158",
  },
  {
    name: "Mail",
    Icon: Mail,
    bg: DARK_TILE,
    fg: "#0a84ff",
  },
  {
    name: "Reminders",
    Icon: SquareCheckBig,
    bg: DARK_TILE,
    fg: "#ff9f0a",
  },
  {
    name: "Wallet",
    Icon: Wallet,
    bg: DARK_TILE,
    fg: "#ffcc4d",
  },
  {
    name: "Settings",
    Icon: Settings,
    bg: DARK_TILE,
    fg: "#aeaeb2",
  },
];

const DOCK: SysApp[] = [
  {
    name: "Phone",
    Icon: Phone,
    bg: DARK_TILE,
    fg: "#30d158",
  },
  {
    name: "Safari",
    Icon: Compass,
    bg: DARK_TILE,
    fg: "#0a84ff",
  },
  {
    name: "Messages",
    Icon: MessageCircle,
    bg: DARK_TILE,
    fg: "#30d158",
  },
  {
    name: "Music",
    Icon: Music,
    bg: DARK_TILE,
    fg: "#ff375f",
  },
];

export type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  /** 点 BuzzVideo AI 图标:回传图标在屏幕内的位置(未缩放坐标),用来做放大启动动画 */
  onLaunch: (from: Rect) => void;
  /** 屏幕缩放比例,用来把 getBoundingClientRect 换算回手机坐标 */
  scale: number;
  screenRef: React.RefObject<HTMLDivElement | null>;
};

/** iOS 26 桌面(深色模式):压暗的壁纸、深色液态玻璃的小组件 / Dock / 搜索条、深色图标 */
export default function HomeScreen({ onLaunch, scale, screenRef }: Props) {
  const buzzRef = useRef<HTMLButtonElement>(null);

  const launch = () => {
    const el = buzzRef.current;
    const screen = screenRef.current;
    if (!el || !screen) return;
    const a = el.getBoundingClientRect();
    const b = screen.getBoundingClientRect();
    onLaunch({
      x: (a.left - b.left) / scale,
      y: (a.top - b.top) / scale,
      w: a.width / scale,
      h: a.height / scale,
    });
  };

  return (
    <div className="absolute inset-0 flex flex-col px-[27px] pb-[14px] pt-[72px] text-white select-none">
      <Wallpaper />

      <div className="relative grid grid-cols-2 gap-x-[22px]">
        <WeatherWidget />
        <CalendarWidget />
      </div>

      <div className="relative mt-[28px] grid grid-cols-4 gap-x-[22px] gap-y-[24px]">
        <AppTile label="BuzzVideo AI">
          <GlassIcon
            bg={ICON_BG}
            buttonRef={buzzRef}
            onPress={launch}
            label="Open BuzzVideo AI"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt=""
              draggable={false}
              style={{
                width: ICON_SIZE * LOGO_RATIO,
                height: ICON_SIZE * LOGO_RATIO,
              }}
            />
          </GlassIcon>
        </AppTile>
        {GRID.map((a) => (
          <SysIcon key={a.name} app={a} />
        ))}
      </div>

      <div className="flex-1" />

      <div
        className="relative mx-auto mb-[14px] flex h-[32px] items-center gap-[5px] rounded-full px-[15px] text-[14px] font-semibold"
        style={clearGlass}
      >
        <Search size={14} strokeWidth={2.6} />
        Search
      </div>

      {/* Dock:整条悬浮玻璃胶囊 */}
      <div
        className="relative flex justify-between rounded-[38px] px-[14px] py-[14px]"
        style={{ ...clearGlass, ...SQUIRCLE }}
      >
        {DOCK.map((a) => (
          <SysIcon key={a.name} app={a} bare />
        ))}
      </div>
    </div>
  );
}

function Wallpaper() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: [
          "radial-gradient(120% 70% at 15% 12%, rgba(255,167,60,0.8), transparent 55%)",
          "radial-gradient(90% 60% at 95% 40%, rgba(255,82,85,0.65), transparent 60%)",
          "radial-gradient(120% 70% at 30% 100%, rgba(98,64,214,0.9), transparent 60%)",
          "linear-gradient(170deg, #3a1c3f 0%, #241a4a 55%, #14123a 100%)",
        ].join(","),
        // iOS 深色模式会把壁纸压暗
        boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.38)",
      }}
    />
  );
}

function AppTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[6px]">
      {children}
      <span className="whitespace-nowrap text-[12px] font-medium tracking-[-0.1px] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]">
        {label}
      </span>
    </div>
  );
}

/** 液态玻璃图标:底色 + 上半部镜面反光 + 玻璃边 */
function GlassIcon({
  bg,
  label,
  onPress,
  buttonRef,
  children,
}: {
  bg: string;
  label: string;
  onPress: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  children: ReactNode;
}) {
  const [down, setDown] = useState(false);
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      onClick={onPress}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="relative flex items-center justify-center overflow-hidden transition-transform duration-150"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS,
        background: bg,
        boxShadow: iconRim,
        transform: down ? "scale(0.9)" : "none",
        ...SQUIRCLE,
      }}
    >
      {children}
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: iconSheen }}
      />
    </button>
  );
}

function SysIcon({ app, bare }: { app: SysApp; bare?: boolean }) {
  const tile = (
    <GlassIcon bg={app.bg} label={app.name} onPress={() => {}}>
      <app.Icon
        size={32}
        color={app.fg}
        strokeWidth={1.9}
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
      />
    </GlassIcon>
  );
  return bare ? tile : <AppTile label={app.name}>{tile}</AppTile>;
}

function WeatherWidget() {
  return (
    <div
      className="flex h-[164px] flex-col justify-between rounded-[26px] p-[15px]"
      style={{ ...clearGlass, ...SQUIRCLE }}
    >
      <div>
        <div className="text-[14px] font-semibold">Hong Kong</div>
        <div className="text-[44px] font-light leading-[1.05] tracking-[-1px]">
          28°
        </div>
      </div>
      <div>
        <div className="flex">
          <Sun size={15} fill="#ffd54a" color="#ffd54a" />
          <Cloud
            size={15}
            fill="#fff"
            color="#fff"
            className="-ml-[8px] mt-[4px]"
          />
        </div>
        <div className="mt-[3px] text-[12px] font-semibold">Partly Cloudy</div>
        <div className="text-[12px] font-medium text-white/80">H:31° L:26°</div>
      </div>
    </div>
  );
}

function CalendarWidget() {
  const now = useClock();
  const weekday = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  return (
    <div
      className="flex h-[164px] flex-col rounded-[26px] p-[15px]"
      style={{ ...clearGlass, ...SQUIRCLE }}
    >
      <div className="text-[11px] font-bold tracking-[0.4px] text-[#ff6b5e]">
        {weekday}
      </div>
      <div className="text-[44px] font-light leading-[1.05] tracking-[-1px]">
        {now.getDate()}
      </div>
      <div className="mt-auto flex gap-[6px]">
        <span className="w-[3px] rounded-full bg-[#ff8a4c]" />
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold">
            Shoot new promo
          </div>
          <div className="text-[11px] text-white/75">4:00 – 5:00 PM</div>
        </div>
      </div>
    </div>
  );
}
