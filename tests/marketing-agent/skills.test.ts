// AC-2.3:Marketing Agent 的模型 skill 和产品模型配置(video-gen-modes 的 capabilities)必须一致。
// 每个模型一份 skill(docs/marketing-agent/skills/video-<slug>/SKILL.md),frontmatter 的 modes 要和产品里的模式完全相同(顺序不限)。

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MODELS, MODE_LABEL, type ModeKey } from "../../src/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";

const DIR = join(__dirname, "../../docs/marketing-agent/skills");

/** 产品模型 key → skill 目录名 */
export const SKILL_OF: Record<string, string> = {
  "seedance-2.5": "video-seedance-2-5",
  "seedance-2.0": "video-seedance-2-0",
  "seedance-2.0-mini": "video-seedance-2-0-mini",
  "seedance-2.0-fast": "video-seedance-2-0-fast",
  "kling-4.0": "video-kling-4-0",
  "kling-3.0": "video-kling-3-0",
  "kling-3.0-omni": "video-kling-3-0-omni",
  "wan-3.0": "video-wan-3-0",
  "wan-3.0-prime": "video-wan-3-0-prime",
  "omni-flash-1.2": "video-gemini-omni-1-2-flash",
  "omni-flash": "video-gemini-omni-flash",
  "h3-max": "video-minimax-h3-max",
  "h3-max-turbo": "video-minimax-h3-max-turbo",
  h3: "video-minimax-h3",
  "vidu-q3": "video-vidu-q3-pro",
  "grok-1.5": "video-grok-imagine-video-1-5",
  "flux-3-video": "video-flux-3-video",
  "flux-3-max-video": "video-flux-3-max-video",
};

/** 只在工具页用的模型(2026-11-05 从 Video Gen 拆出):各有一份 skill,不在 Video Gen 模型列表里 */
export const TOOL_SKILLS = ["video-kling-3-0-motion-control", "video-kling-lipsync", "video-kling-ai-avatar-v2-pro"];

/** frontmatter 里 modes 可以写 key(omni)也可以写产品名(Omni Reference) */
const BY_LABEL = new Map(Object.entries(MODE_LABEL).map(([k, v]) => [v.toLowerCase(), k as ModeKey]));
const toKey = (raw: string): string => {
  const v = raw.trim().replace(/^["']|["']$/g, "");
  return (BY_LABEL.get(v.toLowerCase()) ?? v) as string;
};

function frontmatter(file: string): Record<string, string> {
  const text = readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

function modesOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const inline = fm.match(/^\s*modes:\s*\[(.*)\]\s*$/m);
  if (inline) return inline[1].split(",").map(toKey).filter(Boolean);
  const block = fm.match(/^\s*modes:\s*\n((?:\s+-\s+.*\n?)+)/m);
  if (block) return block[1].split("\n").map((l) => l.replace(/^\s+-\s+/, "")).filter(Boolean).map(toKey);
  return [];
}

describe("Marketing Agent video skills", () => {
  it("has a router skill", () => {
    expect(existsSync(join(DIR, "video-mode-router/SKILL.md"))).toBe(true);
  });

  it("has exactly one skill per product model", () => {
    expect(Object.keys(SKILL_OF).sort()).toEqual(MODELS.map((m) => m.key).sort());
    const dirs = readdirSync(DIR).filter((d) => d.startsWith("video-") && d !== "video-mode-router");
    expect(dirs.sort()).toEqual([...Object.values(SKILL_OF), ...TOOL_SKILLS].sort());
  });

  for (const m of MODELS) {
    it(`${m.label}: skill lists the same modes as the product`, () => {
      const file = join(DIR, SKILL_OF[m.key], "SKILL.md");
      expect(existsSync(file), file).toBe(true);
      const fm = frontmatter(file);
      expect(fm.name, "frontmatter name").toBe(SKILL_OF[m.key]);
      expect(modesOf(file).sort()).toEqual([...m.modes].sort());
    });
  }
});
