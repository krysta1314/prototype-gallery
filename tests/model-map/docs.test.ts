// v1.12 模型思维导图：每个 Endpoint / Model 都要能点到官方 API 文档(Seed Audio 暂无公开文档页)
import { describe, it, expect } from "vitest";
import { docParts, falDocUrl } from "../../src/app/prototypes/(v1.12)/model-map/docs";
import { VIDEO_MODELS } from "../../src/app/prototypes/(v1.12)/model-map/video-data";
import { CLONE_MODELS, IMAGE_MODELS, SOUND_MODELS, TTS_MODELS } from "../../src/app/prototypes/(v1.12)/model-map/other-data";

const ALL = [...VIDEO_MODELS, ...IMAGE_MODELS, ...TTS_MODELS, ...CLONE_MODELS, ...SOUND_MODELS];
const NO_PUBLIC_DOC = new Set(["Seed Audio"]);

describe("model map API doc links", () => {
  it("builds fal doc urls, expanding style groups", () => {
    expect(falDocUrl("kling/v4/text-to-video")).toBe("https://fal.ai/models/kling/v4/text-to-video/api");
    expect(falDocUrl("minimax/h3-max/styles/{vhs, hand-drawn}")).toBe("https://fal.ai/models/minimax/h3-max/styles/vhs/api");
  });

  it("links every endpoint", () => {
    for (const m of ALL) {
      if (NO_PUBLIC_DOC.has(m.name)) continue;
      for (const d of m.modes)
        for (const p of d.params.filter((x) => x.k === "Endpoint" || x.k === "Model"))
          expect(docParts(p.v).some((x) => x.url), `${m.name} · ${d.name}: ${p.v}`).toBe(true);
    }
  });

  it("drops delisted models", () => {
    const names = ALL.map((m) => m.name);
    for (const n of ["Veo 3.1 Fast", "Seedance 1.5 Pro", "Gemini 3.8 Flash TTS"]) expect(names).not.toContain(n);
  });
});
