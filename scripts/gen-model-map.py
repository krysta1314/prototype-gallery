"""生成 v1.12 模型思维导图的视频数据(src/app/prototypes/(v1.12)/model-map/video-data.ts)。
来源:docs/marketing-agent/skills/video-*/SKILL.md 的 Modes / Extra settings / Limits 三张表。改了 skill 就重跑:
    python3 scripts/gen-model-map.py
"""
import json, re

def table(s, h):
    i = s.find(h)
    if i < 0:
        return []
    seg = s[i:].split("\n## ", 1)[0]
    rows = [l for l in seg.split("\n") if l.startswith("|")]
    return [[c.strip() for c in re.split(r"(?<!\\)\|", r.strip().strip("|"))] for r in rows[2:]]

ORDER = [
    ("video-seedance-2-5", "seedance-2.5", "Seedance 2.5", "BytePlus", False),
    ("video-seedance-2-0", "seedance-2.0", "Seedance 2.0", "BytePlus", False),
    ("video-seedance-2-0-fast", "seedance-2.0-fast", "Seedance 2.0 Fast", "BytePlus", False),
    ("video-seedance-2-0-mini", "seedance-2.0-mini", "Seedance 2.0 Mini", "BytePlus", False),
    ("video-kling-4-0", "kling-4.0", "Kling 4.0", "fal", False),
    ("video-kling-3-0-omni", "kling-3.0-omni", "Kling 3.0 Omni", "fal", True),
    ("video-kling-3-0", "kling-3.0", "Kling 3.0", "kie", False),
    ("video-kling-3-0-motion-control", "kling-3.0-motion", "Kling 3.0 Motion Control", "fal", True),
    ("video-kling-lipsync", "kling-lipsync", "Kling LipSync", "fal", True),
    ("video-kling-ai-avatar-v2-pro", "kling-avatar", "Kling AI Avatar v2 Pro", "fal", True),
    ("video-wan-3-0", "wan-3.0", "Wan 3.0", "fal", False),
    ("video-wan-3-0-prime", "wan-3.0-prime", "Wan 3.0 Prime", "fal", True),
    ("video-gemini-omni-flash", "omni-flash", "Gemini Omni Flash", "Google", False),
    ("video-minimax-h3-max", "h3-max", "MiniMax H3 Max", "fal", False),
    ("video-minimax-h3-max-turbo", "h3-max-turbo", "MiniMax H3 Max Turbo", "fal", True),
    ("video-minimax-h3", "h3", "MiniMax H3", "fal", False),
    ("video-vidu-q3-pro", "vidu-q3", "Vidu Q3 Pro", "fal", True),
    ("video-grok-imagine-video-1-5", "grok-1.5", "Grok Imagine Video 1.5", "fal", True),
    ("video-flux-3-video", "flux-3-video", "FLUX 3 Video", "fal", True),
]
NEWMODES = ["Lip Sync", "Talking Avatar", "Camera Control", "Reframe", "Relight", "Recast", "Insert Shot", "3D to Video", "Style Presets", "Motion Control"]
DEFAULTS = {
    "Seedance 2.5": ["Omni Reference", "First & Last Frame", "Edit Video", "Extend Video"],
    "Kling 4.0": ["Keyframes"],
    "Kling 3.0 Motion Control": ["Motion Control"],
    "Kling LipSync": ["Lip Sync"],
    "Kling AI Avatar v2 Pro": ["Talking Avatar"],
    "MiniMax H3 Max": ["Camera Control", "Reframe", "Relight", "Recast", "Insert Shot", "3D to Video", "Style Presets"],
}
NOTES = {
    "FLUX 3 Video": "Notion 上新清单里由 FLUX 3 Max Video 替代(5–20s，仅 720p/1080p，无 Edit/Extend);原型仍按 FLUX 3 Video 配置",
    "Kling LipSync": "只在工具页用(Avatar › Lip Sync),不在 Video Gen 模型列表里",
    "Kling AI Avatar v2 Pro": "只在工具页用(Avatar › Talking Avatar),不在 Video Gen 模型列表里",
    "Kling 3.0 Motion Control": "只在工具页用(Video › Motion Control),不在 Video Gen 模型列表里",
    "MiniMax H3 Max": "Video Gen 里只有生成模式 + Camera Control / Style Presets;Talking Avatar、Reframe、Relight、Recast、3D to Video 是独立工具页;Insert Shot 不做(剪辑器能做)",
}
clean = lambda x: x.replace("`", "").replace("**", "").replace("\\|", "|").strip()

models = []
for slug, key, label, prov, isnew in ORDER:
    s = open(f"docs/marketing-agent/skills/{slug}/SKILL.md").read()
    modes, prev = [], ""
    for r in table(s, "## Modes"):
        name = clean(r[0])
        if not name or name.startswith("Mode (") or name.startswith("---"):
            continue
        ep = clean(r[1])
        ep = prev if ep.lower() == "same" else ep
        prev = ep
        if re.match(r"\(no files.*\)", name):
            name = "Text-to-Video (no files)"
        params = []
        for k, i in (("Endpoint", 1), ("Required", 2), ("Optional", 3), ("Params", 4)):
            v = ep if i == 1 else (clean(r[i]) if i < len(r) else "")
            if v and v not in ("—", "-"):
                params.append({"k": k, "v": v})
        m = {"name": name, "params": params}
        if any(name.startswith(n) for n in NEWMODES):
            m["isNew"] = True
        if any(name.startswith(n) for n in DEFAULTS.get(label, [])) and "+" not in name:
            m["isDefault"] = True
        modes.append(m)
    settings = []
    for r in table(s, "## Extra settings"):
        if len(r) >= 5 and not clean(r[0]).startswith("---"):
            settings.append({"k": clean(r[0]), "v": f"{clean(r[1])} · {clean(r[2])} · default {clean(r[3])} · {clean(r[4])}"})
    limits = [{"k": clean(r[0]), "v": clean(r[1])} for r in table(s, "## Limits") if not clean(r[0]).startswith("---")]
    md = {"name": label, "key": key, "provider": prov, "modes": modes, "settings": settings, "limits": limits}
    if isnew:
        md["isNew"] = True
    if label in NOTES:
        md["note"] = NOTES[label]
    models.append(md)

src = (
    "// 自动生成:python3 scripts/gen-model-map.py(来源 docs/marketing-agent/skills/video-*/SKILL.md)。不要手改。\n"
    'import type { MapModel } from "./types";\n\nexport const VIDEO_MODELS: MapModel[] = '
    + json.dumps(models, ensure_ascii=False, indent=1)
    + ";\n"
)
open("src/app/prototypes/(v1.12)/model-map/video-data.ts", "w").write(src)
print(len(models), "models;", sum(len(m["settings"]) for m in models), "extra settings")
