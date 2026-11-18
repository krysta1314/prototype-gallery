// Design Studio 的纯逻辑(无 React):品牌套件额度、降级、审批绑定版本、Brand Check、Magic Resize。node 测试直接跑。

import { atLimit, limitOf, type Plan } from "./entitlements";
import { formatRatio, type BrandKit, type Design, type FormatKey, type Layer } from "./data";

export function addBrandKit(kits: BrandKit[], kit: BrandKit, plan: Plan): { ok: true; kits: BrandKit[] } | { ok: false; reason: "limit" } {
  const active = kits.filter((k) => !k.readOnly).length;
  if (atLimit(plan, "brandKits", active)) return { ok: false, reason: "limit" };
  return { ok: true, kits: [...kits, kit] };
}

/** 套餐变化后：超出上限的品牌套件变只读(最早建的保持可编辑) */
export function applyPlanToKits(kits: BrandKit[], plan: Plan): BrandKit[] {
  const l = limitOf(plan, "brandKits");
  return kits.map((k, i) => ({ ...k, readOnly: l !== -1 && i >= l }));
}

/** 任何编辑：版本 +1;已提交或已批准的回到 Draft(审批绑定版本) */
export function afterEdit(d: Design): Design {
  const back = d.approval.status !== "draft";
  return { ...d, version: d.version + 1, edited: "Just now", approval: back ? { ...d.approval, status: "draft" } : d.approval };
}

export const submitForApproval = (d: Design): Design => ({ ...d, approval: { ...d.approval, status: "in_review" } });
export const approve = (d: Design, reviewer = "Kelvin"): Design => ({ ...d, approval: { status: "approved", approvedVersion: d.version, reviewer } });
export const requestChanges = (d: Design, reviewer = "Kelvin"): Design => ({ ...d, approval: { ...d.approval, status: "changes", reviewer } });

/** 开了审批：只有当前版本被批准才能导出 / 发布 */
export const canExport = (d: Design, approvalsOn: boolean) => !approvalsOn || (d.approval.status === "approved" && d.approval.approvedVersion === d.version);

export type BrandIssue = { layerId: string; kind: "color" | "foreign_logo"; message: string; fix?: string };
export function brandCheck(d: Design, kit: BrandKit | undefined): BrandIssue[] {
  if (!kit) return [];
  const palette = new Set(kit.colors.map((c) => c.hex.toLowerCase()));
  const out: BrandIssue[] = [];
  for (const p of d.pages)
    for (const l of p.layers) {
      if (l.foreignBrand) out.push({ layerId: l.id, kind: "foreign_logo", message: `Logo from another brand kit (${l.foreignBrand})`, fix: `Swap for the ${kit.name} wordmark` });
      else if (l.kind === "text" && l.color && !palette.has(l.color.toLowerCase()))
        out.push({ layerId: l.id, kind: "color", message: `Colour ${l.color} isn't in ${kit.name}`, fix: `Use ${kit.colors.find((c) => c.role === "primary")?.name}` });
    }
  return out;
}

/** Brand Check 一键修 */
export function fixIssues(d: Design, kit: BrandKit): Design {
  const text = kit.colors.find((c) => c.role === "primary")?.hex ?? "#1a1a2e";
  const issues = new Set(brandCheck(d, kit).map((i) => i.layerId));
  return {
    ...d,
    pages: d.pages.map((p) => ({ ...p, layers: p.layers.map((l): Layer => (!issues.has(l.id) ? l : l.foreignBrand ? { ...l, foreignBrand: undefined } : { ...l, color: text })) })),
  };
}

/** Magic Resize(照 HTML:底部格式条直接切当前画布比例;图层是百分比坐标，锁定规则不变) */
export const setFormat = (d: Design, f: FormatKey): Design => ({ ...d, format: f, ratio: formatRatio(f), type: f === "story" ? "story" : d.type === "story" ? "post" : d.type });
