// 后端 Ad Studio 生成引擎客户端(REST 部分)。WS 见 useAdStudio.ts。
export const BACKEND = "http://localhost:8899";

export type Scene = {
  scene_number: number;
  scene_name: string;
  description: string;
  duration: number;
  dialogue?: string;
  character_description?: string;
  voice_description?: string;
  camera_angle?: string;
  mood?: string;
  characters_present?: string[];
};
export type Script = {
  title: string;
  style: string;
  scenes: Scene[];
  total_duration: number;
};

export type ProductAnalysis = {
  product_name?: string;
  category?: string;
  key_features?: string[];
  selling_points?: string[];
  pain_points?: string[];
  target_audience?: string;
  ad_angle?: string;
};

export async function uploadImage(file: File, projectId: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("project_id", projectId);
  const r = await fetch(`${BACKEND}/upload`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "upload failed");
  return j.url as string;
}

export async function startProject(opts: {
  brief: string;
  clientId: string;
  projectId: string;
  productUrl: string;
  modelUrl?: string;
}): Promise<string> {
  const fd = new FormData();
  fd.append("message", opts.brief);
  fd.append("project_id", opts.projectId);
  fd.append("client_id", opts.clientId);
  const assets: { url: string; name: string; reference_type: string }[] = [
    { url: opts.productUrl, name: "product", reference_type: "product" },
  ];
  if (opts.modelUrl) assets.push({ url: opts.modelUrl, name: "model", reference_type: "model" });
  fd.append("image_assets", JSON.stringify(assets));
  fd.append("use_original_reference", "true");
  fd.append("ui_language", "en");
  const r = await fetch(`${BACKEND}/chat`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "chat failed");
  return j.project_id as string;
}

export async function continueAfterReference(projectId: string, clientId: string): Promise<void> {
  const fd = new FormData();
  fd.append("project_id", projectId);
  fd.append("client_id", clientId);
  fd.append("ui_language", "en");
  fd.append("review_mode", "auto");
  const r = await fetch(`${BACKEND}/continue_generate_after_reference`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "continue failed");
}
