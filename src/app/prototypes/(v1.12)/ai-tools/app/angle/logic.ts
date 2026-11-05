// Photo Angle Editor 的纯逻辑(node 测试直接跑):视角取值范围和夹值、预设、待生成队列(最多 4 个)、积分、fal 入参、预览用的 CSS 变换。
// 模型:fal-ai/qwen-image-edit-2511-multiple-angles(调研第 4 轮:数值视角)。入参 horizontal_angle / vertical_angle / zoom。
// 约定:horizontal 正 = 相机往主体右边转(看到主体的左脸);vertical 正 = 相机抬高往下看;zoom > 1 = 推近。

export type Angle = { h: number; v: number; zoom: number };

export const ANGLE_MODEL = "fal-ai/qwen-image-edit-2511-multiple-angles";

export const H_RANGE = { min: -90, max: 90, step: 5 } as const;
export const V_RANGE = { min: -30, max: 60, step: 5 } as const;
export const ZOOM_RANGE = { min: 0.5, max: 2, step: 0.1 } as const;

export const FRONT: Angle = { h: 0, v: 0, zoom: 1 };

export const ANGLE_PRESETS: { id: string; label: string; angle: Angle }[] = [
  { id: "front", label: "Front", angle: FRONT },
  { id: "three-quarter-left", label: "¾ Left", angle: { h: -45, v: 0, zoom: 1 } },
  { id: "three-quarter-right", label: "¾ Right", angle: { h: 45, v: 0, zoom: 1 } },
  { id: "top-down", label: "Top-down", angle: { h: 0, v: 60, zoom: 1 } },
  { id: "low-angle", label: "Low angle", angle: { h: 0, v: -30, zoom: 1 } },
];

/** 一次最多生成几个视角 */
export const MAX_QUEUE = 4;
/** 积分占位价:每个视角 2 credits(fal 账单约 $0.035 / 张,等定价) */
export const CREDITS_PER_ANGLE = 2;

const clampStep = (n: number, r: { min: number; max: number; step: number }) => {
  if (!Number.isFinite(n)) return 0;
  const c = Math.min(r.max, Math.max(r.min, n));
  const s = Math.round((c - r.min) / r.step) * r.step + r.min;
  /* 浮点误差:保留一位小数 */
  return Math.round(Math.min(r.max, s) * 10) / 10;
};

/** 夹到合法范围并对齐步长(非数字回到默认) */
export function clampAngle(a: Partial<Angle>): Angle {
  return {
    h: clampStep(a.h ?? FRONT.h, H_RANGE),
    v: clampStep(a.v ?? FRONT.v, V_RANGE),
    zoom: Number.isFinite(a.zoom) ? clampStep(a.zoom!, ZOOM_RANGE) : FRONT.zoom,
  };
}

export const sameAngle = (x: Angle, y: Angle) => x.h === y.h && x.v === y.v && x.zoom === y.zoom;

/** 是预设就返回预设名 */
export const presetOf = (a: Angle) => ANGLE_PRESETS.find((p) => sameAngle(p.angle, a)) ?? null;

const deg = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}°`;
/** 给人看的名字:预设名,或「H +30° · V −10° · 1.2×」 */
export function angleLabel(a: Angle): string {
  const p = presetOf(a);
  return p ? p.label : `H ${deg(a.h)} · V ${deg(a.v)} · ${a.zoom.toFixed(1)}×`;
}

/** 加进队列:已经有的不重复加;满了不加。返回新队列和结果 */
export function addToQueue(q: Angle[], a: Angle): { queue: Angle[]; result: "added" | "duplicate" | "full" } {
  const c = clampAngle(a);
  if (q.some((x) => sameAngle(x, c))) return { queue: q, result: "duplicate" };
  if (q.length >= MAX_QUEUE) return { queue: q, result: "full" };
  return { queue: [...q, c], result: "added" };
}

export const removeFromQueue = (q: Angle[], i: number) => q.filter((_, j) => j !== i);

/** 这次要生成的视角:队列不空用队列,否则就是当前滑块那一个 */
export const anglesToRun = (q: Angle[], current: Angle) => (q.length ? q : [clampAngle(current)]);

export const angleCredits = (n: number) => Math.max(0, Math.min(MAX_QUEUE, n)) * CREDITS_PER_ANGLE;

export function toAngleInput(imageUrl: string, a: Angle): Record<string, unknown> {
  const c = clampAngle(a);
  return { image_url: imageUrl, horizontal_angle: c.h, vertical_angle: c.v, zoom: c.zoom };
}

/** 原型预览:CSS 透视变换模拟换视角(不是模型结果,界面上标「Preview」)。
    相机往右转 = 画面里的主体往左转 → rotateY 取负;相机抬高 = 主体顶面朝向我们 → rotateX 取正 */
export function previewTransform(a: Angle): string {
  const c = clampAngle(a);
  const ry = -c.h * 0.55;
  const rx = c.v * 0.5;
  return `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${c.zoom})`;
}

/* 轨道小部件:主体放在中间,水平一圈椭圆轨道(中心 ORBIT.cx/cy,半径 rx/ry,前半圈在下面 = 离我们近),
   相机点按 h 在轨道上转(±90° = 正左 / 正右),再按 v 往上抬(v 正 = 高机位)。坐标都是 0–1。 */
export const ORBIT = { cx: 0.5, cy: 0.64, rx: 0.38, ry: 0.13, lift: 0.4 } as const;

/** 视角 → 相机点位置 */
export function orbitPoint(a: Angle): { x: number; y: number } {
  const c = clampAngle(a);
  const t = (c.h * Math.PI) / 180;
  return { x: ORBIT.cx + Math.sin(t) * ORBIT.rx, y: ORBIT.cy + Math.cos(t) * ORBIT.ry - (c.v / 90) * ORBIT.lift };
}

/** 拖动位置 → 视角(zoom 不变) */
export function angleFromOrbit(x: number, y: number, zoom: number): Angle {
  const s = Math.max(-1, Math.min(1, (x - ORBIT.cx) / ORBIT.rx));
  const t = Math.asin(s);
  const v = ((ORBIT.cy + Math.cos(t) * ORBIT.ry - y) / ORBIT.lift) * 90;
  return clampAngle({ h: (t * 180) / Math.PI, v, zoom });
}

export const angleFileName = (name: string, a: Angle) => {
  const c = clampAngle(a);
  return `${name.replace(/\.[^.]+$/, "") || "image"}-h${c.h}-v${c.v}-z${c.zoom}.png`;
};
