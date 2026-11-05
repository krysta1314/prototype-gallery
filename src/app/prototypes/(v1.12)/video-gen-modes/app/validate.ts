// 生成前校验(纯函数)。超限的素材不删，只把 id 放进 overIds 让界面标红;第一条 issue 显示在素材位下方，Create 置灰。

import type { Asset } from "./assets";
import { modelCaps } from "./capabilities";
import { shotsActive, toolSlot, type ComposerState } from "./state";
import { isToolMode, toolSpec, visibleInputs } from "./tools";

export type Issue = { code: string; message: string };
export type Validation = { ok: boolean; issues: Issue[]; overIds: string[] };

const plural = (kind: Asset["kind"], n: number) =>
  kind === "image" ? (n === 1 ? "image" : "images") : kind === "video" ? (n === 1 ? "video" : "videos") : n === 1 ? "audio clip" : "audio clips";

const sumSecs = (list: Asset[]) => list.reduce((t, a) => t + (a.secs ?? 0), 0);
const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export function validate(s: ComposerState, ctx: { inUK?: boolean } = {}): Validation {
  const caps = modelCaps(s.model);
  const issues: Issue[] = [];
  const over = new Set<string>();
  const add = (code: string, message: string, ids: string[] = []) => {
    issues.push({ code, message });
    ids.forEach((id) => over.add(id));
  };
  const M = caps.label;

  /** 同类素材超过 max:尾部的标红 */
  const capKind = (list: Asset[], kind: Asset["kind"], max: number) => {
    const of = list.filter((a) => a.kind === kind);
    if (of.length <= max) return;
    const extra = of.length - max;
    if (max === 0) add("unsupported", `${M} can't use ${plural(kind, 2)} as references. Remove them to continue.`, of.map((a) => a.id));
    else add("over-count", `${M} takes up to ${max} ${plural(kind, max)}. Remove ${extra} to continue.`, of.slice(max).map((a) => a.id));
  };

  const durationCaps = (list: Asset[], kind: "video" | "audio", total?: number) => {
    const of = list.filter((a) => a.kind === kind && !over.has(a.id));
    if (!total || sumSecs(of) <= total) return;
    let run = 0;
    const ids = of.filter((a) => (run += a.secs ?? 0) > total).map((a) => a.id);
    add("over-secs", `Reference ${kind === "video" ? "videos" : "audio"} add up to ${fmt(sumSecs(of))}s. ${M} takes up to ${total}s.`, ids);
  };

  if (s.mode === "omni" && caps.omni) {
    const L = caps.omni;
    const refs = s.slots.omni.refs;
    capKind(refs, "image", L.images);
    capKind(refs, "video", L.videos);
    capKind(refs, "audio", L.audios);
    if (L.total) {
      const left = refs.filter((a) => !over.has(a.id));
      if (left.length > L.total) add("over-total", `${M} takes up to ${L.total} files in total. Remove ${left.length - L.total} to continue.`, left.slice(L.total).map((a) => a.id));
    }
    if (L.maxVideoClipSecs) {
      const long = refs.filter((a) => a.kind === "video" && (a.secs ?? 0) > L.maxVideoClipSecs!);
      if (long.length) add("clip-too-long", `${M} takes reference videos up to ${L.maxVideoClipSecs}s each.`, long.map((a) => a.id));
    }
    durationCaps(refs, "video", L.videoSecs);
    durationCaps(refs, "audio", L.audioSecs);
    const hasPicture = refs.some((a) => a.kind !== "audio") || (L.elements !== undefined && s.slots.omni.elements.length > 0);
    if (!L.audioOnly && refs.length && !hasPicture) add("audio-only", `Add at least one image or video — ${M} can't use audio on its own.`);
    if (L.elements !== undefined && s.slots.omni.elements.length > L.elements)
      add("over-elements", `${M} takes up to ${L.elements} elements.`, s.slots.omni.elements.slice(L.elements).map((e) => e.id));
    if (L.voices !== undefined && s.slots.omni.voices.length > L.voices) add("over-voices", `${M} takes up to ${L.voices} voices.`);
    if (L.elements === undefined && s.slots.omni.elements.length)
      add("unsupported", `${M} doesn't support elements. Remove them to continue.`, s.slots.omni.elements.map((e) => e.id));
    if (L.voices === undefined && s.slots.omni.voices.length) add("unsupported", `${M} doesn't support voices. Remove them to continue.`);
  }

  if (s.mode === "frames") {
    const f = s.slots.frames;
    if ((caps.frames?.startRequired ?? true) && !f.start && f.end) add("start-required", `Add a start frame — ${M} can't start from an end frame only.`);
    if (caps.frames?.maxElements !== undefined && f.elements.length > caps.frames.maxElements)
      add("over-elements", `${M} takes up to ${caps.frames.maxElements} elements.`, f.elements.slice(caps.frames.maxElements).map((e) => e.id));
    const range = caps.frames?.elementImages;
    if (range && f.elements.some((e) => 1 + e.angles.length < range[0] || 1 + e.angles.length > range[1]))
      add("element-images", `Each ${M} element needs ${range[0]}–${range[1]} images.`);
    if (caps.multiShot?.firstFrameOnly && shotsActive(s) && f.end) add("shots-end-frame", `Multi-shot on ${M} uses the start frame only. Remove the end frame.`, [f.end.id]);
    if (f.elements.length && !caps.frames?.elements) add("unsupported", `${M} doesn't support elements. Remove them to continue.`, f.elements.map((e) => e.id));
    else if (f.elements.length && !f.start) add("start-required", `Add a start frame to use elements with ${M}.`);
    if (f.soundtrack && !caps.frames?.soundtrack) add("unsupported", `${M} can't use a soundtrack. Remove it to continue.`, [f.soundtrack.id]);
  }

  if (s.mode === "keyframes" && caps.keyframes) {
    const k = s.slots.keyframes;
    const K = caps.keyframes;
    if (k.middle.length > K.maxMiddle)
      add("over-keyframes", `${M} takes up to ${K.maxMiddle} middle ${K.maxMiddle === 1 ? "frame" : "frames"}.`, k.middle.slice(K.maxMiddle).map((a) => a.id));
    if (k.middle.length && (!k.start || !k.end)) add("keyframes-ends", "Add a start and an end frame to use keyframes.");
    if (K.timed && k.middle.length) {
      const t = k.middleTime;
      if (t === undefined || t <= 0 || t >= s.secs) add("middle-time", `Set the middle frame between 0s and ${fmt(s.secs)}s.`);
    }
    if (K.references !== undefined) {
      const frameCount = (k.start ? 1 : 0) + (k.end ? 1 : 0) + Math.min(k.middle.length, K.maxMiddle);
      const room = caps.key === "kling-4.0" ? K.references - frameCount : K.references;
      if (k.refs.length > room) add("over-count", `${M} takes up to ${room} more ${plural("image", room)}. Remove ${k.refs.length - room} to continue.`, k.refs.slice(room).map((a) => a.id));
    }
  }

  const sourceChecks = (verb: "edit" | "extend", source: Asset | undefined, max: number, min = 0) => {
    if (!source) return add("no-source", `Add a video to ${verb}.`);
    if ((source.secs ?? 0) > max) return add("source-too-long", `${M} can ${verb} videos up to ${max}s.`, [source.id]);
    if ((source.secs ?? 0) < min) add("source-too-short", `${M} needs a video of at least ${min}s to ${verb}.`, [source.id]);
  };
  if (s.mode === "edit" && caps.edit) {
    const src = s.slots.edit.source;
    sourceChecks("edit", src, caps.edit.sourceMax, caps.edit.sourceMin);
    if (src && caps.edit.ukUploadBlocked && ctx.inUK && src.source === "upload")
      add("region", "Editing uploaded videos isn't available in your region. Try a video generated here.", [src.id]);
  }
  if (s.mode === "extend" && caps.extend) {
    const src = s.slots.extend.source;
    sourceChecks("extend", src, caps.extend.sourceMax);
    if (src && caps.extend.ukUploadBlocked && ctx.inUK && src.source === "upload")
      add("region", "Extending uploaded videos isn't available in your region. Try a video generated here.", [src.id]);
  }

  /* 额外能力模式：必填格没放 = tool-missing(不出红条，只置灰 Create);超数量 / 时长越界标红 */
  const spec = toolSpec(s.model, s.mode);
  if (spec && isToolMode(s.mode)) {
    const t = toolSlot(s, s.mode);
    for (const inp of visibleInputs(spec, t.opts)) {
      const list = t.files[inp.id] ?? [];
      const name = inp.caption.replace("\n", " ").toLowerCase();
      if (list.length < inp.min) add("tool-missing", `Add ${inp.min > 1 ? `at least ${inp.min}` : "a"} ${name}.`);
      if (list.length > inp.max) add("over-count", `Add up to ${inp.max} ${name}.`, list.slice(inp.max).map((a) => a.id));
      for (const a of list) {
        if (a.secs === undefined) continue;
        if (inp.secsMax !== undefined && a.secs > inp.secsMax) add("tool-secs", `The ${name} can be up to ${fmt(inp.secsMax)}s. This one is ${fmt(a.secs)}s.`, [a.id]);
        else if (inp.secsMin !== undefined && a.secs < inp.secsMin) add("tool-secs", `The ${name} needs to be at least ${fmt(inp.secsMin)}s.`, [a.id]);
      }
    }
  }
  /* 换到不支持参考图的模型后，之前放的参考图格子不显示了，但不能悄悄带进请求 */
  if (s.mode === "keyframes" && s.slots.keyframes.refs.length && caps.keyframes?.references === undefined)
    add("unsupported", `${M} can't use reference images with keyframes. Remove them to continue.`, s.slots.keyframes.refs.map((a) => a.id));
  if (s.mode === "edit" && s.slots.edit.refs.length && !caps.edit?.references)
    add("unsupported", `${M} can't use reference images when editing. Remove them to continue.`, s.slots.edit.refs.map((a) => a.id));
  if (s.mode === "omni" && s.slots.omni.source && !caps.omni?.webSource) add("no-web", `${M} can't read web pages or documents. Remove it to continue.`);
  if (s.mode === "frames" && s.slots.frames.end && caps.frames?.endBlocksRes?.includes(s.resolution))
    add("end-res", `${M} can't make ${s.resolution} videos with an end frame. Pick a higher resolution or remove the end frame.`);
  if (s.mode === "frames" && caps.frames?.noEnd && s.slots.frames.end) add("no-end", `${M} can't use an end frame. Remove it to continue.`, [s.slots.frames.end.id]);

  const ms = caps.multiShot;
  if (ms && shotsActive(s) && !s.multiShot.smart && s.multiShot.shots.length) {
    const total = s.multiShot.shots.reduce((t, x) => t + x.secs, 0);
    if (total < ms.totalMin || total > ms.totalMax) add("shots-total", `Shots add up to ${total}s. ${M} supports ${ms.totalMin}–${ms.totalMax}s.`);
    if (s.multiShot.shots.some((x) => x.secs < ms.shotMin || x.secs > ms.shotMax)) add("shot-secs", `Each shot can be ${ms.shotMin}–${ms.shotMax}s.`);
    if (ms.maxShots && s.multiShot.shots.length > ms.maxShots) add("shots-count", `${M} takes up to ${ms.maxShots} shots.`);
  }

  return { ok: issues.length === 0, issues, overIds: [...over] };
}
