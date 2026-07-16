"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKEND, Script, ProductAnalysis, FrameState,
  uploadImage, startProject, continueAfterReference, getProject, regenerateSceneImage,
} from "./adStudioClient";

type Phase = "idle" | "scripting" | "storyboard" | "clips" | "merging" | "done" | "error";
type Clip = { scene_number: number; status: string; url?: string };

export function useAdStudio() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [script, setScript] = useState<Script | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [frames, setFrames] = useState<Record<number, FrameState>>({});
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
      setErrorMsg(null); setClips([]); setFinalVideoUrl(null); setScript(null); setProductAnalysis(null); setProductImage(null); setFrames({});
      referenceReady.current = false;
      setPhase("scripting");
      await ensureWs();
      projectId.current = "adstudio" + Math.floor(Date.now() % 1e8).toString(36);
      const productUrl = await uploadImage(file, projectId.current);
      setProductImage(productUrl);
      let modelUrl: string | undefined;
      if (avatarFile) modelUrl = await uploadImage(avatarFile, projectId.current);
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
      referenceReady.current = Boolean(p?.reference_image);
      // 已生成的分镜首帧(project.images 里按 scene_number 存)回填为 done
      const imgs = Array.isArray(p?.images) ? p.images : [];
      const frameMap: Record<number, FrameState> = {};
      for (const im of imgs) {
        if (im && im.scene_number != null && im.url) frameMap[im.scene_number] = { status: "done", url: im.url };
      }
      setFrames(frameMap);
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

  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { phase, script, productAnalysis, productImage, frames, clips, finalVideoUrl, errorMsg, start, generateClips, assemble, loadProject, generateScene };
}
