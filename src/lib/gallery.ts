import {
  APP_VERSIONS,
  SHIPPED_VERSIONS,
  TOP_VERSIONS,
  type Platform,
  type Prototype,
  type Version,
} from "./prototypes";

/** "shipped" 是二级分组的「全部」:v1.2–v1.6 一起看 */
export type VersionFilter = "all" | "shipped" | Version;

export const platformOf = (p: Prototype): Platform => p.platform ?? "web";

/** 一级筛选栏:网页版保留原有版本 + 已上线;APP 只有自己的版本线 */
export function versionChips(platform: Platform): VersionFilter[] {
  return platform === "app" ? ["all", ...APP_VERSIONS] : ["all", ...TOP_VERSIONS, "shipped"];
}

function matchesVersion(p: Prototype, version: VersionFilter): boolean {
  if (version === "all") return true;
  if (version === "shipped") return SHIPPED_VERSIONS.includes(p.version);
  return p.version === version;
}

export function countFor(list: Prototype[], platform: Platform, version: VersionFilter): number {
  return list.filter((p) => platformOf(p) === platform && matchesVersion(p, version)).length;
}

export function filterPrototypes(
  list: Prototype[],
  { platform, version, query }: { platform: Platform; version: VersionFilter; query: string },
): Prototype[] {
  // 按数组里的手动顺序;pinned 在任何筛选下都排最前
  const ordered = [...list].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const q = query.trim().toLowerCase();
  return ordered.filter(
    (p) =>
      platformOf(p) === platform &&
      matchesVersion(p, version) &&
      (!q || [p.title, p.desc, p.slug].some((f) => f.toLowerCase().includes(q))),
  );
}
