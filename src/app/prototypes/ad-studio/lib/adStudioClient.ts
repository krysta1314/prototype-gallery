// 后端 Ad Studio 生成引擎客户端(REST 部分)。WS 见 useAdStudio.ts。
export const BACKEND = "http://localhost:8899";

export type Keyframe = {
  tag: string;            // 如 "分镜1"，对应 video_prompt 里的 @分镜1
  image_prompt: string;   // 静态构图描述
  role?: "anchor" | "handoff";
  url?: string;           // 生成后回填
};
export type Scene = {
  scene_number: number;
  scene_name: string;
  duration: number;
  narrative?: string;     // 一句话梗概（看板用）
  video_prompt?: string;  // 多镜头导演脚本（喂视频模型）
  keyframes?: Keyframe[];  // 该片段的锚点关键帧
  ref_tags?: string[];    // 引用的全局参考图，如 ["图1"]
  description?: string;   // 兼容旧数据
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
  uiLanguage?: string;
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
  fd.append("ui_language", opts.uiLanguage ?? "en");
  const r = await fetch(`${BACKEND}/chat`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "chat failed");
  return j.project_id as string;
}

export async function continueAfterReference(projectId: string, clientId: string, uiLanguage: string = "en"): Promise<void> {
  const fd = new FormData();
  fd.append("project_id", projectId);
  fd.append("client_id", clientId);
  fd.append("ui_language", uiLanguage);
  fd.append("review_mode", "auto");
  const r = await fetch(`${BACKEND}/continue_generate_after_reference`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "continue failed");
}

export type ProjectSummary = {
  project_id: string;
  title: string;
  status: string;
  current_step: string;
  scene_count: number;
  created_at: string;
  updated_at: string;
  final_video_url?: string | null;
};

export async function listProjects(): Promise<ProjectSummary[]> {
  const r = await fetch(`${BACKEND}/projects`);
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "list projects failed");
  return (j.projects ?? []) as ProjectSummary[];
}

export async function getProject(id: string): Promise<any> {
  const r = await fetch(`${BACKEND}/project/${id}`);
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "get project failed");
  return j.project;
}

export type FrameStatus = "idle" | "generating" | "done" | "error";
export type FrameState = { status: FrameStatus; url?: string };

export type GeneratedKeyframe = { tag: string; url: string; role: string; versions?: string[] };

// 生成该片段导演设计的所有关键帧(scene.keyframes[]),返回 [{tag,url,role}]
export async function generateKeyframe(opts: {
  projectId: string;
  sceneNumber: number;
}): Promise<GeneratedKeyframe[]> {
  const fd = new FormData();
  fd.append("project_id", opts.projectId);
  fd.append("scene_number", String(opts.sceneNumber));
  const r = await fetch(`${BACKEND}/generate_keyframe`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "generate keyframe failed");
  return (j.keyframes ?? []) as GeneratedKeyframe[];
}

// 用该片段的 video_prompt + 关键帧(@分镜N)+ 参考图(@图N)生成视频片段
export async function generateSceneClip(opts: {
  projectId: string;
  sceneNumber: number;
}): Promise<string> {
  const fd = new FormData();
  fd.append("project_id", opts.projectId);
  fd.append("scene_number", String(opts.sceneNumber));
  const r = await fetch(`${BACKEND}/generate_scene_clip`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "generate scene clip failed");
  return j.url as string;
}

// 生成/重生成某个分镜的首帧图(依赖参考图库已就绪,见 useAdStudio.generateScene)
export async function regenerateSceneImage(opts: {
  projectId: string;
  clientId: string;
  sceneNumber: number;
  uiLanguage?: string;
}): Promise<string> {
  const fd = new FormData();
  fd.append("project_id", opts.projectId);
  fd.append("type", "image");
  fd.append("scene_number", String(opts.sceneNumber));
  fd.append("client_id", opts.clientId);
  fd.append("ui_language", opts.uiLanguage ?? "en");
  const r = await fetch(`${BACKEND}/regenerate`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "generate scene failed");
  return j.url as string;
}
