"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKEND, Script, ProductAnalysis, uploadImage, startProject, continueAfterReference,
} from "./adStudioClient";

type Phase = "idle" | "scripting" | "storyboard" | "clips" | "merging" | "done" | "error";
type Clip = { scene_number: number; status: string; url?: string };

export function useAdStudio() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [script, setScript] = useState<Script | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const clientId = useRef<string>("");
  const projectId = useRef<string>("");
  const uiLang = useRef<string>("en");
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
      setErrorMsg(null); setClips([]); setFinalVideoUrl(null); setScript(null); setProductAnalysis(null);
      setPhase("scripting");
      await ensureWs();
      projectId.current = "adstudio" + Math.floor(Date.now() % 1e8).toString(36);
      const productUrl = await uploadImage(file, projectId.current);
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

  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { phase, script, productAnalysis, clips, finalVideoUrl, errorMsg, start, generateClips, assemble };
}
