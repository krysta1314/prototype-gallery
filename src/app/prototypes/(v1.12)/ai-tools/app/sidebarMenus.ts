// 侧边栏四个新模块(Image / Video / Audio / Avatar)的二级菜单数据。纯数据,node 测试直接跑。
// 菜单按 2026-11-04 市场调研(docs/research/2026-11-04-ai-tools-demand-research.md)全部列上:
// groups[0] = 基础生成能力;groups[1] = 其余工具,按「广告实际使用 → 需求 → 竞品覆盖」排序(Monica 2026-11-04 定的规则)。
// 每个菜单项只属于三种之一(menuAction):
//   tool  = 有专门模型、本原型做了页面(登记在 TOOLS),进工具页;
//   agent = 背后只是通用生成模型 + prompt(调研第 4 轮,Monica 2026-11-04 批准),跳 Marketing Agent 首页,切到对应创作模式(Image → Image Gen、Video → Video Gen、Audio → Marketing Agent)并预填 AGENT_JUMPS 里的提示词;
//   soon  = 有专门模型但还没做页面,点了出「Coming soon」toast。

export type ModuleKey = "image" | "video" | "audio" | "avatar";

export type MenuItem = {
  /** 菜单里显示的英文名 */
  label: string;
  /** lucide 图标名(组件里按名字取) */
  icon: string;
  /** 有页面的才填(和 href 一起):外壳按它切到对应工具页;没有 = Coming soon */
  tool?: ToolKey;
  /** 开发原型直达地址(= TOOLS[tool].href) */
  href?: string;
  /** 通用模型的项:跳 Marketing Agent(创作模式 + 预填提示词,= AGENT_JUMPS[label]) */
  agent?: AgentPrompt;
};

/** Marketing Agent 首页 composer 的创作模式(只有这三种,没有 Audio Gen:音频类走 Marketing Agent 模式) */
export type AgentMode = "marketing" | "image" | "video";
export type AgentPrompt = {
  mode: AgentMode;
  prompt: string;
  /** 视频类：直接切到 Video Gen 的这个模型 / 模式(video-gen-modes 的 ModelKey / ModeKey)。不填 = 保持当前 */
  videoModel?: string;
  videoMode?: string;
};
/** 从菜单跳到 Agent 时带过去的东西:来自哪个工具 + 模式 + 提示词 */
export type AgentJump = AgentPrompt & { from: string };

/* 跳 Marketing Agent 的菜单项 → 创作模式 + 英文提示词模板([方括号] 是要用户填的占位,打开时选中第一个)。
   依据:docs/research/2026-11-04-ai-tools-demand-research.md 第 4 轮(通用模型 + prompt 就能做的)。 */
export const AGENT_JUMPS = {
  /* 2026-11-05 Monica 定：提示词要短，用户能直接改;[方括号] 放一个示例值，打开时选中第一个。
     Image 菜单分两路:Resize & Expand、Product Photography、Remove Object 进 Marketing Agent(要多步处理),其余进 Image Gen。
     Remove Background 用她给的原句，不带占位。 */
  "Text to Image": { mode: "image", prompt: "An ad photo of [product] on [a sunlit kitchen counter], bright and clean, space at the top for a headline." },
  "Image Edit": { mode: "image", prompt: "Change [the background to a sunny beach]. Keep the product exactly the same." },
  "Remove Background": { mode: "image", prompt: "Remove the background from this product photo and give me a clean cutout on transparent and pure white backgrounds." },
  "Resize & Expand": { mode: "marketing", prompt: "Resize my image to [9:16] by extending the background. Don't crop or change the original." },
  "Product Photography": { mode: "marketing", prompt: "Shoot my product on [white marble] with [fresh citrus], soft daylight. Keep the label exactly the same." },
  "Remove Object": { mode: "marketing", prompt: "Remove [the price sticker] from my image and fill the gap naturally." },
  Inpaint: { mode: "image", prompt: "Replace [the plain wall] with [a window with morning light]. Keep everything else the same." },
  "Virtual Try-On": { mode: "image", prompt: "Dress the model in my first image in the [jacket] from my second image. Keep the face and pose." },
  "Model Swap": { mode: "image", prompt: "Replace the model with [a woman in her 30s with curly hair]. Keep the outfit, pose and background." },
  Relight: { mode: "image", prompt: "Relight my product photo with [warm golden-hour light]. Keep the product unchanged." },
  "Photo Angle Editor": { mode: "image", prompt: "Show my product from [a 45-degree side view]. Keep its shape and label the same." },
  "Image Face Swap": { mode: "image", prompt: "Swap the face in my first image with [the face in my second image]. Keep everything else the same." },
  "Image to Video": { mode: "video", prompt: "Animate my product image into a [5s] vertical clip with a [slow push-in]." },
  "Text to Video": { mode: "video", prompt: "A [15s] vertical ad for [product]: quick hook, [in-use shot], end on the product." },
  /* 2026-11-05:URL to Video 用 Wan 3.0(唯一能读网页 / 文档的模型),进 Omni Reference,链接放「URL / Doc」格 */
  "URL to Video": { mode: "video", videoModel: "wan-3.0", videoMode: "omni", prompt: "A [15s] vertical ad from the page I added: hook in 2s, top 3 selling points, end on the product with Shop now." },
  /* Video Edit 就是 Video Gen 的 Edit Video 模式(默认模型 Seedance 2.5) */
  "Video Edit": { mode: "video", videoModel: "seedance-2.5", videoMode: "edit", prompt: "In my video, [replace the background with a beach]. Keep the people, motion and timing." },
  /* 2026-11-05:Video Resize 页面删除，走 Marketing Agent(agent 调 MiniMax H3 Max reframe-video 往外补画面) */
  "Video Resize": { mode: "marketing", prompt: "Resize my video to [9:16] by extending the scene. Keep the whole original shot; don't crop or stretch it." },
  "Video Face Swap": { mode: "video", prompt: "Swap the face in my video with [reference face]. Keep the expressions natural." },
  "Background Music": { mode: "marketing", prompt: "[30s] of [upbeat] background music for a [product] ad, no lyrics." },
  "Sound Effects": { mode: "marketing", prompt: "A short [whoosh] sound for a [product reveal]." },
} as const satisfies Record<string, AgentPrompt>;

export type AgentItem = keyof typeof AGENT_JUMPS;

/** 提示词里第一个 [占位] 的位置(含方括号);没有返回 null。打开 Agent 时把它选中,用户直接打字替换 */
export function firstPlaceholder(prompt: string): [number, number] | null {
  const m = /\[[^\]]+\]/.exec(prompt);
  return m ? [m.index, m.index + m[0].length] : null;
}

/** 菜单项点了之后去哪:工具页 / Marketing Agent / Coming soon(三选一) */
export type MenuAction = { kind: "tool"; tool: ToolKey } | { kind: "agent"; jump: AgentJump } | { kind: "soon" };
export function menuAction(item: MenuItem): MenuAction {
  if (item.tool) return { kind: "tool", tool: item.tool };
  if (item.agent) return { kind: "agent", jump: { ...item.agent, from: item.label } };
  return { kind: "soon" };
}


export type Module = { key: ModuleKey; label: string; icon: string; groups: MenuItem[][] };

export const UPSCALE_TOOL_HREF = "/prototypes/ai-tools/image-upscale";
export const UPSCALE_ITEM = "Upscale Image";
export const COMING_SOON = "Coming soon in this prototype";

/** 本原型里做了页面的工具。key 也是外壳(ProductApp)的 view 名 */
export type ToolKey =
  | "upscale"
  | "video-upscale"
  | "product-avatar"
  | "custom-avatar"
  | "voice-enhancer"
  | "remove-object"
  | "inpaint"
  | "virtual-try-on"
  | "model-swap"
  | "photo-angle"
  /* 模型加工类工具(2026-11-05 从 Video Gen 的模式里拆出来,model-tools/specs.ts) */
  | "motion-control"
  | "character-swap"
  | "video-relight"
  | "render-3d"
  | "lip-sync"
  | "talking-avatar"
  | "voice-clone";

export const TOOLS: Record<ToolKey, { label: string; module: ModuleKey; href: string }> = {
  upscale: { label: UPSCALE_ITEM, module: "image", href: UPSCALE_TOOL_HREF },
  "video-upscale": { label: "Upscale Video", module: "video", href: "/prototypes/ai-tools/video-upscale" },
  "product-avatar": { label: "Product Avatar", module: "avatar", href: "/prototypes/ai-tools/product-avatar" },
  "custom-avatar": { label: "Custom Avatar", module: "avatar", href: "/prototypes/ai-tools/custom-avatar" },
  "voice-enhancer": { label: "Voice Enhancer", module: "audio", href: "/prototypes/ai-tools/voice-enhancer" },
  /* 两个菜单项共用一个页面、各自预选模式:Remove Object / Inpaint → 画笔页(brush-edit);Virtual Try-On / Model Swap → 试穿页 */
  "remove-object": { label: "Remove Object", module: "image", href: "/prototypes/ai-tools/brush-edit" },
  inpaint: { label: "Inpaint", module: "image", href: "/prototypes/ai-tools/brush-edit?mode=replace" },
  "virtual-try-on": { label: "Virtual Try-On", module: "image", href: "/prototypes/ai-tools/virtual-try-on" },
  "model-swap": { label: "Model Swap", module: "image", href: "/prototypes/ai-tools/virtual-try-on?mode=model-swap" },
  "photo-angle": { label: "Photo Angle Editor", module: "image", href: "/prototypes/ai-tools/photo-angle" },
  "motion-control": { label: "Motion Control", module: "video", href: "/prototypes/ai-tools/motion-control" },
  "character-swap": { label: "Video Character Swap", module: "video", href: "/prototypes/ai-tools/character-swap" },
  "video-relight": { label: "Video Relight", module: "video", href: "/prototypes/ai-tools/video-relight" },
  "render-3d": { label: "3D to Video", module: "video", href: "/prototypes/ai-tools/render-3d" },
  "lip-sync": { label: "Lip Sync", module: "avatar", href: "/prototypes/ai-tools/lip-sync" },
  "talking-avatar": { label: "Talking Avatar", module: "avatar", href: "/prototypes/ai-tools/talking-avatar" },
  "voice-clone": { label: "Voice Clone", module: "audio", href: "/prototypes/ai-tools/voice-clone" },
};

/** 外壳里一个页面对应几个 view(同页不同模式):view → 页面 key */
export const PAGE_OF: Partial<Record<ToolKey, string>> = {
  "remove-object": "brush-edit",
  inpaint: "brush-edit",
  "virtual-try-on": "try-on",
  "model-swap": "try-on",
};

const tool = (key: ToolKey) => ({ tool: key, href: TOOLS[key].href });
const agent = (label: AgentItem) => ({ label, agent: AGENT_JUMPS[label] as AgentPrompt });

export const MODULES: Module[] = [
  {
    key: "image",
    label: "Image",
    icon: "Image",
    groups: [
      [
        { ...agent("Text to Image"), icon: "Type" },
        { ...agent("Image Edit"), icon: "Image" },
      ],
      [
        { ...agent("Remove Background"), icon: "SquareDashed" },
        { ...agent("Resize & Expand"), icon: "Expand" },
        { ...agent("Product Photography"), icon: "Camera" },
        { ...agent("Remove Object"), icon: "Eraser" },
        { label: UPSCALE_ITEM, icon: "ImageUpscale", ...tool("upscale") },
        { ...agent("Inpaint"), icon: "Brush" },
        { ...agent("Virtual Try-On"), icon: "Shirt" },
        { ...agent("Model Swap"), icon: "Repeat2" },
        { ...agent("Relight"), icon: "Lightbulb" },
        { ...agent("Photo Angle Editor"), icon: "Rotate3d" },
        /* 调研:广告使用低、不建议(政策风险),排最后(2026-11-05) */
        { ...agent("Image Face Swap"), icon: "Smile" },
      ],
    ],
  },
  {
    key: "video",
    label: "Video",
    icon: "Video",
    groups: [
      [
        { ...agent("Image to Video"), icon: "ImagePlay" },
        { ...agent("Text to Video"), icon: "LetterText" },
      ],
      [
        /* 2026-11-05 按调研重排(docs/research/2026-11-04-ai-tools-demand-research.md 含补充节):广告实际使用 → 需求 → 竞品覆盖;
           调研结论「不建议」的(Video Character Swap、Video Face Swap)沉到最后，和 Image 菜单的 Image Face Swap 一致 */
        { ...agent("URL to Video"), icon: "Link" },
        { ...agent("Video Resize"), icon: "Proportions" },
        { ...agent("Video Edit"), icon: "Scissors" },
        { label: "Upscale Video", icon: "MonitorUp", ...tool("video-upscale") },
        { label: "Camera Control", icon: "Camera" },
        { label: "Video Styles", icon: "Palette" },
        { label: "Motion Control", icon: "PersonStanding", ...tool("motion-control") },
        { label: "Video Relight", icon: "Lightbulb", ...tool("video-relight") },
        { label: "3D to Video", icon: "Box", ...tool("render-3d") },
        { label: "Video Character Swap", icon: "Drama", ...tool("character-swap") },
        { ...agent("Video Face Swap"), icon: "ScanFace" },
      ],
    ],
  },
  {
    key: "audio",
    label: "Audio",
    icon: "AudioLines",
    groups: [
      [
        { label: "AI Voiceover", icon: "Speech" },
        { ...agent("Background Music"), icon: "Music" },
      ],
      [
        { label: "Voice Clone", icon: "Mic", ...tool("voice-clone") },
        { label: "Voice Enhancer", icon: "AudioWaveform", ...tool("voice-enhancer") },
        { ...agent("Sound Effects"), icon: "Volume2" },
      ],
    ],
  },
  {
    key: "avatar",
    label: "Avatar",
    icon: "CircleUserRound",
    groups: [
      [
        { label: "UGC Avatar", icon: "UserRound" },
      ],
      [
        { label: "Product Avatar", icon: "Package", ...tool("product-avatar") },
        { label: "Lip Sync", icon: "MessageSquareText", ...tool("lip-sync") },
        { label: "Talking Avatar", icon: "Speech", ...tool("talking-avatar") },
        { label: "Custom Avatar", icon: "UserCog", ...tool("custom-avatar") },
      ],
    ],
  },
];

export const moduleOf = (key: ModuleKey) => MODULES.find((m) => m.key === key)!;
