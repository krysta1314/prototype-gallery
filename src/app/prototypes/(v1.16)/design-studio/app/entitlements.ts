// Design Studio 权益矩阵(spec 2.11)。纯数据，所有拦截都从这里读，node 测试直接跑。
// 数字是建议值，待 Ryan 确认;改价只改这张表。

export type Plan = "free" | "starter" | "pro" | "ultra" | "e1" | "e2" | "e3";
export const PLANS: Plan[] = ["free", "starter", "pro", "ultra", "e1", "e2", "e3"];
export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  ultra: "Ultra",
  e1: "Enterprise E1",
  e2: "Enterprise E2",
  e3: "Enterprise E3",
};
/** 套餐标签上用的短名 */
export const PLAN_SHORT: Record<Plan, string> = { free: "Free", starter: "Starter", pro: "Pro", ultra: "Ultra", e1: "E1", e2: "E2", e3: "E3" };

export const isEnterprise = (p: Plan) => p === "e1" || p === "e2" || p === "e3";
const rank = (p: Plan) => PLANS.indexOf(p);
export const atLeast = (p: Plan, min: Plan) => rank(p) >= rank(min);

export type Feature =
  | "brand_voice"
  | "magic_resize"
  | "bulk_variants"
  | "products"
  | "export_pdf"
  | "export_pptx"
  | "export_svg"
  | "export_print"
  | "commercial_use"
  | "remove_badge"
  | "share_password"
  | "share_analytics"
  | "share_email_domain"
  | "custom_domain"
  | "site_forms"
  | "site_html"
  | "team_folders"
  | "template_lock"
  | "brand_check"
  | "approvals"
  | "approval_rules"
  | "audit_log"
  | "sso"
  | "model_allowlist"
  | "member_caps"
  | "handover"
  | "c2pa_policy"
  | "brand_style_model"
  | "ip_indemnity"
  | "data_residency";

/** 每个功能最低从哪一档开始有 */
export const FEATURE_MIN: Record<Feature, Plan> = {
  brand_voice: "starter",
  magic_resize: "starter",
  bulk_variants: "ultra",
  products: "pro",
  export_pdf: "starter",
  export_pptx: "pro",
  export_svg: "pro",
  export_print: "ultra",
  commercial_use: "starter",
  remove_badge: "starter",
  share_password: "pro",
  share_analytics: "ultra",
  share_email_domain: "e1",
  custom_domain: "pro",
  site_forms: "ultra",
  site_html: "ultra",
  team_folders: "ultra",
  template_lock: "e1",
  brand_check: "e1",
  approvals: "e1",
  approval_rules: "e2",
  audit_log: "e2",
  sso: "e2",
  model_allowlist: "e1",
  member_caps: "e1",
  handover: "e1",
  c2pa_policy: "e1",
  brand_style_model: "e3",
  ip_indemnity: "e3",
  data_residency: "e3",
};

export const FEATURE_LABEL: Record<Feature, string> = {
  brand_voice: "Brand voice in AI copy",
  magic_resize: "Magic Resize",
  bulk_variants: "Bulk variants by selling point",
  products: "Products library",
  export_pdf: "PDF export",
  export_pptx: "PPTX export",
  export_svg: "SVG export",
  export_print: "Print PDF (CMYK)",
  commercial_use: "Commercial use",
  remove_badge: "Remove “Made with BuzzVideo”",
  share_password: "Password-protected links",
  share_analytics: "Viewer analytics",
  share_email_domain: "Restrict links to your company",
  custom_domain: "Custom domains",
  site_forms: "Site forms",
  site_html: "Edit & download HTML",
  team_folders: "Team folders",
  template_lock: "Locked brand templates",
  brand_check: "Brand Check",
  approvals: "Approvals",
  approval_rules: "Approval rules by group",
  audit_log: "Audit log",
  sso: "SSO / SCIM",
  model_allowlist: "AI model allowlist",
  member_caps: "Per-member credit limits",
  handover: "Ownership handover",
  c2pa_policy: "AI labelling policy",
  brand_style_model: "Brand style model",
  ip_indemnity: "IP indemnity",
  data_residency: "Data residency",
};

export const can = (plan: Plan, f: Feature) => atLeast(plan, FEATURE_MIN[f]);
export const requiredPlan = (f: Feature): Plan => FEATURE_MIN[f];

export type LimitKey = "brandKits" | "sites" | "domains";
/** -1 = 不限 */
const LIMITS: Record<LimitKey, Record<Plan, number>> = {
  brandKits: { free: 1, starter: 1, pro: 3, ultra: 10, e1: -1, e2: -1, e3: -1 },
  sites: { free: 1, starter: 3, pro: 10, ultra: 25, e1: -1, e2: -1, e3: -1 },
  domains: { free: 0, starter: 0, pro: 1, ultra: 5, e1: -1, e2: -1, e3: -1 },
};
export const limitOf = (plan: Plan, k: LimitKey) => LIMITS[k][plan];
/** 再加一个会不会超额 */
export const atLimit = (plan: Plan, k: LimitKey, used: number) => {
  const l = limitOf(plan, k);
  return l !== -1 && used >= l;
};
/** 下一个放得下 used+1 个的套餐 */
export const planForMore = (plan: Plan, k: LimitKey, used: number): Plan =>
  PLANS.slice(rank(plan) + 1).find((p) => !atLimit(p, k, used)) ?? "e1";

export type ExportFormat = "png" | "jpg" | "pdf" | "pptx" | "svg" | "pdf_print";
export const FORMAT_FEATURE: Partial<Record<ExportFormat, Feature>> = { pdf: "export_pdf", pptx: "export_pptx", svg: "export_svg", pdf_print: "export_print" };
export const ALL_FORMATS: ExportFormat[] = ["png", "jpg", "pdf", "pptx", "svg", "pdf_print"];
export const FORMAT_LABEL: Record<ExportFormat, string> = { png: "PNG", jpg: "JPG", pdf: "PDF", pptx: "PPTX", svg: "SVG", pdf_print: "PDF Print (CMYK)" };
export const formatAllowed = (plan: Plan, f: ExportFormat) => {
  const feat = FORMAT_FEATURE[f];
  return !feat || can(plan, feat);
};
export const exportFormats = (plan: Plan) => ALL_FORMATS.filter((f) => formatAllowed(plan, f));

export const VERSION_DAYS: Record<Plan, number> = { free: 7, starter: 30, pro: 30, ultra: 90, e1: 365, e2: 365, e3: 365 };
