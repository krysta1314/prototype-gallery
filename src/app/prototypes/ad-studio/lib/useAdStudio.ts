"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKEND, Script, ProductAnalysis, FrameState, GeneratedKeyframe,
  uploadImage, startProject, continueAfterReference, getProject, regenerateSceneImage,
  generateKeyframe, generateSceneClip,
} from "./adStudioClient";

// 每片段:导演设计的关键帧列表(状态 + items)+ 该片段视频 clip 状态
type SceneKeyframesState = { status: FrameState["status"]; items: GeneratedKeyframe[] };
type SceneKeyframes = Record<number, SceneKeyframesState>;
type SceneClips = Record<number, FrameState>;

type Phase = "idle" | "scripting" | "storyboard" | "clips" | "merging" | "done" | "error";
type Clip = { scene_number: number; status: string; url?: string };
// 全局参考图（喂给模型的 @图N 素材）；tag 约定：图1=产品，图2=模特，图3=场景结构
export type RefAsset = { tag: string; url: string; type: "product" | "model" | "scene" };

function buildRefAssets(uploaded: any[]): RefAsset[] {
  const first = (t: string) =>
    (uploaded || []).find((x) => x && x.reference_type === t && x.url)?.url as string | undefined;
  const out: RefAsset[] = [];
  const p = first("product"); if (p) out.push({ tag: "图1", url: p, type: "product" });
  const m = first("model"); if (m) out.push({ tag: "图2", url: m, type: "model" });
  const s = first("scene"); if (s) out.push({ tag: "图3", url: s, type: "scene" });
  return out;
}

export function useAdStudio() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [script, setScript] = useState<Script | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [refAssets, setRefAssets] = useState<RefAsset[]>([]);
  const [frames, setFrames] = useState<Record<number, FrameState>>({});
  const [sceneKeyframes, setSceneKeyframes] = useState<SceneKeyframes>({});
  const [sceneClips, setSceneClips] = useState<SceneClips>({});
  const [clips, setClips] = useState<Clip[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const clientId = useRef<string>("");
  const projectId = useRef<string>("");
  const uiLang = useRef<string>("en");
  const referenceReady = useRef<boolean>(false);
  const waiters = useRef<{ match: (m: any) => boolean; resolve: () => void; reject?: (e: any) => void }[]>([]);

  const failWaiters = (reason: string) => {
    waiters.current.forEach((w) => w.reject?.(new Error(reason)));
    waiters.current = [];
  };

  const ensureWs = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return resolve();
      const ws = new WebSocket(`${BACKEND.replace("http", "ws")}/ws`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        const d = m.data || {};
        if (m.type === "connection") { clientId.current = d.client_id; resolve(); }
        if (m.type === "agent_output" && d.agent === "product_analysis") {
          setProductAnalysis(d.output as ProductAnalysis);
        }
        if (m.type === "agent_output" && d.agent === "script_agent") {
          setScript(d.output as Script);
        }
        if (m.type === "agent_output" && d.agent === "video_agent") {
          const o = d.output || {};
          if (o.scene_number != null) {
            setClips((prev) => {
              const next = [...prev];
              const i = next.findIndex((c) => c.scene_number === o.scene_number);
              const entry = { scene_number: o.scene_number, status: o.status, url: o.url };
              if (i >= 0) next[i] = { ...next[i], ...entry }; else next.push(entry);
              return next.sort((a, b) => a.scene_number - b.scene_number);
            });
          }
        }
        if (m.type === "agent_output" && d.agent === "merge_agent" && d.output?.final_video_url) {
          setFinalVideoUrl(d.output.final_video_url);
        }
        if (m.type === "error") {
          setErrorMsg(d.message || "backend error");
          setPhase("error");
          failWaiters(d.message || "backend error");
        }
        waiters.current = waiters.current.filter((w) => {
          if (w.match(m)) { w.resolve(); return false; }
          return true;
        });
      };
      ws.onerror = () => reject(new Error("ws error"));
      ws.onclose = () => { failWaiters("connection closed"); };
    });
  }, []);

  const sendStep = (step: string) =>
    // 后端 /ws 读取顶层字段(data.get("project_id") 等),不是嵌套的 data 子对象
    wsRef.current?.send(JSON.stringify({
      type: "execute_step",
      project_id: projectId.current,
      step,
      ui_language: uiLang.current,
      review_mode: "auto",
    }));

  const waitStep = (step: string) =>
    new Promise<void>((resolve, reject) => {
      waiters.current.push({
        match: (m) => m.type === "step_complete" && m.data?.step === step,
        resolve,
        reject,
      });
    });

  const waitVideosDone = () =>
    new Promise<void>((resolve, reject) => {
      waiters.current.push({
        match: (m) =>
          (m.type === "step_complete" && m.data?.step === "videos") ||
          m.data?.output?.status === "manual_wait_merge",
        resolve,
        reject,
      });
    });

  const start = useCallback(async (file: File, brief: string, avatarFile?: File | null) => {
    try {
      setErrorMsg(null); setClips([]); setFinalVideoUrl(null); setScript(null); setProductAnalysis(null); setProductImage(null); setFrames({}); setSceneKeyframes({}); setSceneClips({}); setRefAssets([]);
      referenceReady.current = false;
      setPhase("scripting");
      await ensureWs();
      projectId.current = "adstudio" + Math.floor(Date.now() % 1e8).toString(36);
      const productUrl = await uploadImage(file, projectId.current);
      setProductImage(productUrl);
      let modelUrl: string | undefined;
      if (avatarFile) modelUrl = await uploadImage(avatarFile, projectId.current);
      setRefAssets(buildRefAssets([
        { reference_type: "product", url: productUrl },
        ...(modelUrl ? [{ reference_type: "model", url: modelUrl }] : []),
      ]));
      const effectiveBrief = brief.trim() ||
        "Create a short cinematic ad for the uploaded product. Analyze the product in the image and build the story around it.";
      // 输出语言跟随用户的提示词:含中文字符 -> zh-CN,否则 en。空 brief 退回英文默认。
      uiLang.current = /[一-鿿]/.test(brief) ? "zh-CN" : "en";
      await startProject({ brief: effectiveBrief, clientId: clientId.current, projectId: projectId.current, productUrl, modelUrl, uiLanguage: uiLang.current });
      const done = waitStep("script");
      sendStep("script");
      await done;
      setPhase("storyboard");
    } catch (err: any) { setErrorMsg(String(err?.message || err)); setPhase("error"); }
  }, [ensureWs]);

  const generateClips = useCallback(async () => {
    try {
      setPhase("clips");
      const refDone = waitStep("reference_image");
      sendStep("reference_image");
      await refDone;
      const videosDone = waitVideosDone();
      await continueAfterReference(projectId.current, clientId.current, uiLang.current);
      await videosDone;
    } catch (err: any) { setErrorMsg(String(err?.message || err)); setPhase("error"); }
  }, []);

  const assemble = useCallback(async () => {
    try {
      setPhase("merging");
      const mergeDone = waitStep("merge");
      sendStep("merge");
      await mergeDone;
      setPhase("done");
    } catch (err: any) { setErrorMsg(String(err?.message || err)); setPhase("error"); }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    try {
      setErrorMsg(null);
      const p = await getProject(id);
      projectId.current = id;
      setScript((p?.script as Script) ?? null);
      setProductAnalysis((p?.product_analysis as ProductAnalysis) ?? null);
      setProductImage((Array.isArray(p?.reference_images) ? p.reference_images[0] : null) ?? null);
      setRefAssets(buildRefAssets(Array.isArray(p?.uploaded_reference_images) ? p.uploaded_reference_images : []));
      referenceReady.current = Boolean(p?.reference_image);
      // 已生成的分镜首帧(project.images 里按 scene_number 存)回填为 done
      const imgs = Array.isArray(p?.images) ? p.images : [];
      const frameMap: Record<number, FrameState> = {};
      for (const im of imgs) {
        if (im && im.scene_number != null && im.url) frameMap[im.scene_number] = { status: "done", url: im.url };
      }
      setFrames(frameMap);
      // 每个 (scene, tag) 的全部历史版本(project.images 里每次重生成都累积)
      const versionMap: Record<string, string[]> = {};
      for (const im of imgs) {
        if (im && im.scene_number != null && im.keyframe_tag && im.url) {
          const key = `${im.scene_number}::${im.keyframe_tag}`;
          (versionMap[key] ||= []).push(im.url);
        }
      }
      // 回填每片段关键帧(script.scenes[].keyframes 里 url 已生成的)+ 历史版本
      const kfMap: SceneKeyframes = {};
      const scs = Array.isArray(p?.script?.scenes) ? p.script.scenes : [];
      for (const sc of scs) {
        const items = (Array.isArray(sc?.keyframes) ? sc.keyframes : [])
          .filter((k: any) => k && k.url)
          .map((k: any) => {
            const versions = versionMap[`${sc.scene_number}::${k.tag}`] ?? [k.url];
            return { tag: k.tag, url: k.url, role: k.role ?? "anchor", versions };
          });
        if (items.length) kfMap[sc.scene_number] = { status: "done", items };
      }
      setSceneKeyframes(kfMap);
      // 回填每片段视频 clip
      const sfRaw = p?.scene_frames && typeof p.scene_frames === "object" ? p.scene_frames : {};
      const clipMap: SceneClips = {};
      for (const k of Object.keys(sfRaw)) {
        const v = sfRaw[k] || {};
        clipMap[Number(k)] = v.clip ? { status: "done", url: v.clip } : { status: "idle" };
      }
      setSceneClips(clipMap);
      const vids = Array.isArray(p?.videos) ? p.videos : [];
      setClips(
        vids
          .filter((v: any) => v && v.scene_number != null)
          .map((v: any) => ({ scene_number: v.scene_number, status: "done", url: v.url }))
          .sort((a: Clip, b: Clip) => a.scene_number - b.scene_number)
      );
      setFinalVideoUrl((p?.final_video_url as string) ?? null);
      if (p?.final_video_url) setPhase("done");
      else if (vids.length) setPhase("clips");
      else if (p?.script) setPhase("storyboard");
      else setPhase("idle");
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setPhase("error");
    }
  }, []);

  // 生成单个分镜的首帧:必要时先出参考图库,再逐帧生成
  const generateScene = useCallback(async (sceneNumber: number) => {
    setFrames((prev) => ({ ...prev, [sceneNumber]: { status: "generating" } }));
    try {
      await ensureWs();
      if (!referenceReady.current) {
        const refDone = waitStep("reference_image");
        sendStep("reference_image");
        await refDone;
        referenceReady.current = true;
      }
      const url = await regenerateSceneImage({
        projectId: projectId.current,
        clientId: clientId.current,
        sceneNumber,
        uiLanguage: uiLang.current,
      });
      setFrames((prev) => ({ ...prev, [sceneNumber]: { status: "done", url } }));
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setFrames((prev) => ({ ...prev, [sceneNumber]: { status: "error" } }));
    }
  }, [ensureWs]);

  // 生成该片段导演设计的所有关键帧(scene.keyframes[]),一次出全部
  const genKeyframes = useCallback(async (sceneNumber: number) => {
    setSceneKeyframes((prev) => ({
      ...prev,
      [sceneNumber]: { status: "generating", items: prev[sceneNumber]?.items ?? [] },
    }));
    try {
      const items = await generateKeyframe({ projectId: projectId.current, sceneNumber });
      setSceneKeyframes((prev) => ({ ...prev, [sceneNumber]: { status: "done", items } }));
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setSceneKeyframes((prev) => ({
        ...prev,
        [sceneNumber]: { status: "error", items: prev[sceneNumber]?.items ?? [] },
      }));
    }
  }, []);

  // 用该片段的 video_prompt + 关键帧 + 参考图生成视频片段
  const genSceneClip = useCallback(async (sceneNumber: number) => {
    setSceneClips((prev) => ({ ...prev, [sceneNumber]: { status: "generating" } }));
    try {
      const url = await generateSceneClip({ projectId: projectId.current, sceneNumber });
      setSceneClips((prev) => ({ ...prev, [sceneNumber]: { status: "done", url } }));
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setSceneClips((prev) => ({ ...prev, [sceneNumber]: { status: "error" } }));
    }
  }, []);

  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { phase, script, productAnalysis, productImage, refAssets, frames, sceneKeyframes, sceneClips, clips, finalVideoUrl, errorMsg, start, generateClips, assemble, loadProject, generateScene, genKeyframes, genSceneClip };
}
