// 模型加工类工具页的配置(2026-11-05 从 Video Gen 的模式里拆出来，做成和 Upscale Image 一样的工具页)。
// 每个工具 = 一个(或几个可选)模型端点：上传素材 → 少量选项 → 生成。字段和取值按 fal OpenAPI 逐项核对
// (docs/marketing-agent/_api-param-audit-2026-11-05.md)。纯数据，测试直接读。

export type MediaKind = "image" | "video" | "audio";

export type SpecInput = {
  id: string;
  kind: MediaKind;
  /** 字段名(界面) */
  label: string;
  /** 字段下的一句说明 */
  hint: string;
  /** 最少几个(0 = 可选) */
  min: number;
  max: number;
  /** 单段视频 / 音频的秒数限制 */
  secs?: [number, number];
  /** 对应的 API 字段 */
  api: string;
  /** 没放时按钮下的提示(英文);不填 = 「Add a <label>.」 */
  missing?: string;
  /** 只在某个选项取某个值时出现 */
  showIf?: { option: string; value: string };
  /** 没有自己的文件时用的样例 */
  sample: { url: string; name: string; secs?: number };
};

export type SpecOption = {
  id: string;
  label: string;
  api: string;
  /** 选项(界面文案);apiValues 一一对应 */
  values: string[];
  apiValues?: (string | number | boolean)[];
  default: string;
  hint?: string;
  showIf?: { option: string; value: string };
  /** 这个素材位放了文件就藏起来、也不发给 API(3D to Video 传了 Look References 就不需要 AI 自己生成参考图) */
  hideWhenFiles?: string;
  /** 结果卡摘要里每个取值怎么说(人话);null = 不写进摘要。不填 = 直接用取值 */
  say?: (string | null)[];
  /** 做成紧跟素材的问题标签(如 Lip Sync「What should they say?」) */
  ask?: string;
  /** voice = 可试听的音色下拉;stepper = 右侧 − 1x + 小步进器 */
  control?: "voice" | "stepper";
  /** 每个取值在音色下拉里的说明(语言 · 风格) */
  meta?: string[];
  /** 音色的性别(音色弹窗的 Gender 筛选用) */
  gender?: ("Female" | "Male")[];
  /** 每个取值顺带要发的字段(如音色带上 voice_language) */
  sets?: Record<string, string | number | boolean>[];
};

export type ModelVariant = {
  key: string;
  label: string;
  /** 左栏标题旁的小标(只有一个模型时显示;多个模型时模型卡已经写了，不重复) */
  badge?: string;
  /** 多个模型时，模型卡上的一句区别 */
  blurb?: string;
  endpoint: string;
  inputs: SpecInput[];
  options: SpecOption[];
  /** 提示词:none = 接口没有这个字段(不显示框) */
  prompt: { mode: "none" | "optional" | "required"; label?: string; placeholder: string; api: string; requiredIf?: { option: string; value: string }; showIf?: { option: string; value: string } };
  /** 积分(示意):每秒积分 × 时长;时长取某个输入的秒数或某个选项 */
  credits: { perSecond: number; secsFrom: { input: string } | { option: string } | { fixed: number } };
};

export type ModelToolSpec = {
  key: string;
  title: string;
  subtitle: string;
  /** 侧边栏模块 */
  module: "video" | "avatar" | "audio";
  cta: string;
  running: string;
  emptyTitle: string;
  emptyBody: string;
  /** 结果是视频还是一个新音色 */
  result: "video" | "voice";
  /** 结果视频用哪个输入的素材当演示(原型不真跑模型) */
  previewFrom?: string;
  /** 结果卡标题(写结果，不重复工具名) */
  resultTitle: string;
  /** 结果卡「Result / xxx」对比切换里原素材叫什么 */
  sourceLabel?: string;
  /** 用样例素材时，结果卡播的演示成片(原型不真跑模型;不填 = 回放原素材并标 Demo) */
  demoResult?: string;
  /** 空状态专用的演示视频(不当生成结果用;没有就用 demoResult) */
  emptyDemo?: string;
  /** 空状态演示片没有声音(不显示声音按钮) */
  emptyDemoSilent?: boolean;
  /** 空状态改成左右对比滑块(左 before、右 after,同一个镜头位置对齐) */
  emptyCompare?: { before: string; after: string; beforeLabel: string; afterLabel: string; ratio: number };
  /** 生成前必勾的确认(Voice Clone 的声音授权) */
  consent?: string;
  /** 第一个选项可以切模型 */
  models: ModelVariant[];
};

const S = "/prototypes/ai-tools/samples";
const SAMPLE_DANCE = { url: `${S}/3d-blockout.mp4`, name: "dance-moves.mp4", secs: 10 };
const SAMPLE_3D = { url: `${S}/3d-blockout.mp4`, name: "stage-blockout.mp4", secs: 10 };
const SAMPLE_PORTRAIT = { url: "/prototypes/buzzvideo-app/avatar.jpg", name: "presenter.jpg" };
const SAMPLE_PEOPLE = { url: "/prototypes/asset-library/avatars/avatar-01.png", name: "new-person.png" };
const SAMPLE_LIGHT = { url: "/prototypes/ai-tools/demo-after.png", name: "lighting-reference.png" };
const SAMPLE_VOICE = { url: "/prototypes/ai-tools/voice-sample.mp3", name: "voiceover.mp3", secs: 16 };
const SAMPLE_TALK = { url: `${S}/talking-clip.mp4`, name: "talking-clip.mp4", secs: 8 };

const H3_RES = (values: string[], def: string): SpecOption => ({
  id: "resolution",
  label: "Resolution",
  api: "resolution",
  values,
  apiValues: values.map((v) => (v === "2K" ? "2K" : v.toUpperCase())),
  default: def,
});

export const MODEL_TOOLS: ModelToolSpec[] = [
  {
    key: "motion-control",
    title: "Motion Control",
    subtitle: "Make your character copy the moves in a video.",
    module: "video",
    cta: "Generate",
    running: "Generating",
    emptyTitle: "AI Motion Control",
    emptyBody: "Transform your character images into dynamic animations by transferring motion from a reference video using AI.",
    result: "video",
    previewFrom: "motion",
    resultTitle: "Moves copied",
    sourceLabel: "Motion video",
    /* 空状态演示的成片(2026-11-06 Monica 给的链接) */
    demoResult: "https://cdn2.deevid.ai/user-video/v2_template-video-1770629317842-733679078.mp4",
    models: [
      {
        key: "kling-3.0-motion",
        label: "Kling 3.0 Motion Control",
        badge: "Kling 3.0",
        endpoint: "fal-ai/kling-video/v3/pro/motion-control",
        inputs: [
          { id: "character", kind: "image", label: "Character", hint: "A clear photo of who should move", min: 1, max: 1, api: "image_url", missing: "Add a character photo.", sample: SAMPLE_PEOPLE },
          { id: "motion", kind: "video", label: "Motion Video", hint: "Up to 30s when facing like the video, 10s like the image", min: 1, max: 1, secs: [2, 30], api: "video_url", sample: SAMPLE_DANCE },
        ],
        options: [
          {
            id: "orientation",
            label: "Character Orientation",
            api: "character_orientation",
            values: ["Like the video", "Like the image"],
            apiValues: ["video", "image"],
            default: "Like the video",
            say: ["Faces like the video", "Faces like the image"],
            hint: "Like the video suits complex moves (up to 30s). Like the image follows camera moves better (up to 10s).",
          },
          { id: "quality", label: "Quality", api: "endpoint tier", values: ["Standard", "Pro"], apiValues: ["v3/standard", "v3/pro"], default: "Pro", hint: "Pro looks sharper and costs more.", say: ["Standard quality", "Pro quality"] },
          { id: "sound", label: "Keep Original Sound", api: "keep_original_sound", values: ["On", "Off"], apiValues: [true, false], default: "On", hint: "Keeps the audio from the motion video.", say: ["Original sound kept", "No original sound"] },
        ],
        prompt: { mode: "optional", placeholder: "Optional: describe the scene or style, such as on a rooftop at sunset", api: "prompt" },
        credits: { perSecond: 11, secsFrom: { input: "motion" } },
      },
    ],
  },
  {
    key: "character-swap",
    title: "Video Character Swap",
    subtitle: "Swap the people in a video. Moves, camera and scene stay.",
    module: "video",
    cta: "Generate",
    running: "Generating",
    emptyTitle: "AI Video Character Swap",
    emptyBody: "Replace the people in any video with new characters while keeping every move, shot by shot.",
    result: "video",
    previewFrom: "source",
    resultTitle: "New cast",
    sourceLabel: "Original",
    /* 空状态演示(2026-11-06 Monica 给的成片：骑摩托的换人效果，有声音)。
       原片开头约 1.5 秒画面内缩、左边露黑白边，四边各裁 2.5% 再放大回 1920×1080 后存本地;原片:
       https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-11-06/376991285862522880.mp4 */
    emptyDemo: "/prototypes/ai-tools/character-swap-demo.mp4",
    models: [
      {
        key: "h3-max",
        label: "MiniMax H3 Max",
        badge: "MiniMax H3 Max",
        endpoint: "minimax/h3-max/recast",
        inputs: [
          { id: "source", kind: "video", label: "Video", hint: "5–30s, no single shot longer than 15s", min: 1, max: 1, secs: [5, 30], api: "video_url", sample: SAMPLE_TALK },
          { id: "people", kind: "image", label: "Character Image", hint: "1–4 photos, one per character. They replace the people in the video from left to right.", min: 1, max: 4, api: "reference_image_urls", missing: "Add a photo of each new person.", sample: SAMPLE_PEOPLE },
        ],
        options: [
          { id: "realism", label: "Enhance Realism", api: "enhance_realism", values: ["Off", "On"], apiValues: [false, true], default: "Off", hint: "More natural skin and better blending into the scene.", say: [null, "Extra realism"] },
          H3_RES(["768p", "1080p"], "1080p"),
        ],
        prompt: { mode: "optional", placeholder: "Optional: who replaces whom, such as @Image1 replaces the woman on the left", api: "prompt" },
        credits: { perSecond: 9, secsFrom: { input: "source" } },
      },
    ],
  },
  {
    key: "render-3d",
    title: "3D to Video",
    subtitle: "Turn a 3D blockout or previz into a realistic video.",
    module: "video",
    cta: "Generate",
    running: "Generating",
    emptyTitle: "AI 3D to Video",
    emptyBody: "Turn rough 3D renders and previz into polished, photoreal shots in minutes.",
    result: "video",
    previewFrom: "source",
    resultTitle: "Rendered video",
    sourceLabel: "3D render",
    demoResult: `${S}/3d-result.mp4`,
    /* 2026-11-06:空状态做成左右对比，左 3D 白模、右 AI 成片(Monica 给的水上飞机镜头，两段机位逐帧对齐),拖中间的线看效果 */
    emptyCompare: {
      before: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-11-06/376987506106753024.mp4",
      after: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-11-06/376987514851876864.mp4",
      beforeLabel: "3D Render",
      afterLabel: "AI Video",
      ratio: 16 / 9,
    },
    models: [
      {
        key: "h3-max",
        label: "MiniMax H3 Max",
        badge: "MiniMax H3 Max",
        endpoint: "minimax/h3-max/3d-to-video",
        inputs: [
          { id: "source", kind: "video", label: "3D Render", hint: "Up to 15s and 32 shots", min: 1, max: 1, secs: [1, 15], api: "video_url", missing: "Add a 3D render.", sample: SAMPLE_3D },
          { id: "refs", kind: "image", label: "Look References", hint: "Up to 8: environment, subject, details", min: 0, max: 8, api: "reference_image_urls", sample: SAMPLE_LIGHT },
        ],
        options: [
          /* 2026-11-06 Monica 定：原名「Looks to Generate」看不懂;改名，并且只在没传 Look References 时出现 */
          { id: "looks", label: "Auto Look References", api: "max_generated_reference_images", values: ["1", "2", "4", "8"], apiValues: [1, 2, 4, 8], default: "2", hint: "With no look references, AI first makes this many, then renders your video to match them.", hideWhenFiles: "refs", say: ["1 AI look", "2 AI looks", "4 AI looks", "8 AI looks"] },
          H3_RES(["480p", "768p", "1080p"], "768p"),
        ],
        prompt: { mode: "optional", placeholder: "Optional: what your blocks are, such as the moving box is a red sports car", api: "prompt" },
        credits: { perSecond: 9, secsFrom: { input: "source" } },
      },
    ],
  },
  {
    key: "lip-sync",
    title: "Lip Sync",
    subtitle: "Make the person in a video say something new.",
    module: "avatar",
    cta: "Generate",
    running: "Generating",
    emptyTitle: "AI Lip Sync",
    emptyBody: "Make anyone in a video say new lines with natural, perfectly synced lip movement.",
    result: "video",
    previewFrom: "source",
    resultTitle: "New words, synced",
    sourceLabel: "Original",
    demoResult: `${S}/lipsync-result.mp4`,
    /* 2026-11-06 Monica 给的空状态演示片(1344×768,15s,有声音) */
    emptyDemo: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-11-06/377036197031108608.mp4",
    models: [
      {
        key: "kling-lipsync",
        label: "Kling LipSync",
        /* 2026-11-06 Monica:单模型的工具页标题旁都要有模型标签(加了 MiniMax 后有模型下拉，小标不再显示) */
        badge: "Kling LipSync",
        blurb: "Type a script or upload audio. For clips 2–10s, keeps the original quality.",
        endpoint: "fal-ai/kling-video/lipsync/audio-to-video",
        inputs: [
          { id: "source", kind: "video", label: "Video", hint: "2–10s with a clear face", min: 1, max: 1, secs: [2, 10], api: "video_url", sample: SAMPLE_TALK },
          { id: "speech", kind: "audio", label: "Speech Audio", hint: "2–60s", min: 1, max: 1, secs: [2, 60], api: "audio_url", missing: "Add the new speech.", showIf: { option: "from", value: "Upload audio" }, sample: SAMPLE_VOICE },
        ],
        options: [
          { id: "from", label: "Speech", ask: "What should they say?", api: "endpoint", values: ["Upload audio", "Type a script"], apiValues: ["lipsync/audio-to-video", "lipsync/text-to-video"], default: "Upload audio", say: ["Your audio", "Typed script"] },
          {
            id: "voice",
            label: "Voice",
            api: "voice_id",
            control: "voice",
            /* 2026-11-06 Monica 定：点开是产品的音色弹窗。Kling Lip Sync 只认 fal 枚举里的固定 voice_id,不支持克隆音色,
               所以弹窗只有 Preset Voice;这里列的是枚举里的英文音色 */
            values: ["Commercial lady", "Reader", "UK man", "Calm narrator", "Global man", "UK boy", "UK grandpa"],
            apiValues: ["commercial_lady_en_f-v1", "reader_en_m-v1", "uk_man2", "calm_story1", "oversea_male1", "uk_boy1", "uk_oldman3"],
            meta: ["English · Bright", "English · Clear", "English · Warm", "English · Storytelling", "English · Friendly", "English · Youthful", "English · Mature"],
            gender: ["Female", "Male", "Male", "Female", "Male", "Male", "Male"],
            /* 语言并进音色(音色本身就是某种语言的),不单独一组 */
            sets: [{ voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }],
            default: "Commercial lady",
            showIf: { option: "from", value: "Type a script" },
          },
          { id: "speed", label: "Speed", api: "voice_speed", control: "stepper", values: ["0.8x", "1x", "1.2x", "1.5x", "2x"], apiValues: [0.8, 1, 1.2, 1.5, 2], default: "1x", showIf: { option: "from", value: "Type a script" }, say: ["0.8x speed", null, "1.2x speed", "1.5x speed", "2x speed"] },
        ],
        prompt: { mode: "required", label: "Script", placeholder: "Type what they should say", api: "text", showIf: { option: "from", value: "Type a script" } },
        credits: { perSecond: 14, secsFrom: { input: "source" } },
      },
      /* 2026-11-06 Monica 定：加 MiniMax H3 Max 的视频对口型(minimax/h3-max/lip-sync/video-to-video,和 Talking Avatar 用的
         image-to-video 是两个接口)。只接受上传音频，没有打字生成语音;视频 5s–15 min,输出 480P / 768P。 */
      {
        key: "h3-max-lipsync",
        label: "MiniMax H3 Max",
        blurb: "Long videos up to 15 min. Upload your own audio. Output up to 768p.",
        endpoint: "minimax/h3-max/lip-sync/video-to-video",
        inputs: [
          { id: "source", kind: "video", label: "Video", hint: "5s to 15 min with a clear face", min: 1, max: 1, secs: [5, 900], api: "video_url", sample: SAMPLE_TALK },
          { id: "speech", kind: "audio", label: "Speech Audio", hint: "Up to 15 min", min: 1, max: 1, secs: [1, 900], api: "audio_url", missing: "Add the new speech.", sample: SAMPLE_VOICE },
        ],
        options: [
          {
            id: "fit",
            label: "If Lengths Differ",
            api: "duration_mode",
            values: ["Trim", "Loop", "Bounce", "Pad"],
            apiValues: ["cut_off", "loop", "bounce", "silence"],
            default: "Trim",
            hint: "When the audio and video aren't the same length: Trim cuts to the shorter one, Loop repeats the video, Bounce plays it forward then back, Pad adds silence to the audio (audio can't be longer than the video).",
            say: [null, "Video looped", "Video bounced", "Silence added"],
          },
          H3_RES(["480p", "768p"], "768p"),
        ],
        prompt: { mode: "none", placeholder: "", api: "" },
        credits: { perSecond: 9, secsFrom: { input: "source" } },
      },
    ],
  },
  {
    key: "talking-avatar",
    title: "Talking Avatar",
    subtitle: "Turn one photo and a voice track into a talking video.",
    module: "avatar",
    cta: "Generate",
    running: "Generating",
    emptyTitle: "AI Talking Avatar",
    emptyBody: "Bring any photo to life with a talking video that speaks your audio in a natural way.",
    result: "video",
    previewFrom: "photo",
    resultTitle: "Your photo, talking",
    sourceLabel: "Photo",
    demoResult: `${S}/avatar-result.mp4`,
    /* 2026-11-06 Monica 给的空状态演示片(16:9,10s);原片没音轨，本地合上她给的口播音频(7.8s,后面补静音) */
    emptyDemo: "/prototypes/ai-tools/talking-avatar-demo.mp4",
    models: [
      {
        key: "kling-avatar",
        label: "Kling AI Avatar v2 Pro",
        blurb: "Natural expressions and head moves. Direct the delivery with a prompt. Audio up to 5 min.",
        endpoint: "fal-ai/kling-video/ai-avatar/v2/pro",
        inputs: [
          { id: "photo", kind: "image", label: "Photo", hint: "A person, animal or cartoon character", min: 1, max: 1, api: "image_url", sample: SAMPLE_PORTRAIT },
          { id: "voice", kind: "audio", label: "Voice Audio", hint: "The speech to lip-sync to", min: 1, max: 1, secs: [1, 300], api: "audio_url", missing: "Add a voice track.", sample: SAMPLE_VOICE },
        ],
        options: [],
        prompt: { mode: "optional", placeholder: "Optional: describe the delivery, such as energetic, looks at the camera", api: "prompt" },
        credits: { perSecond: 14, secsFrom: { input: "voice" } },
      },
      {
        key: "h3-max",
        label: "MiniMax H3 Max",
        /* 2026-11-06 Monica:原文案「Tight lip sync」像在说改口型，改成讲它在这页的用处 */
        blurb: "Long talking videos from one photo, up to 15 min. Sharp output up to 2K.",
        endpoint: "minimax/h3-max/lip-sync/image-to-video",
        inputs: [
          { id: "photo", kind: "image", label: "Photo", hint: "One clear photo of the person", min: 1, max: 1, api: "image_url", sample: SAMPLE_PORTRAIT },
          { id: "voice", kind: "audio", label: "Voice Audio", hint: "5s to 15 min", min: 1, max: 1, secs: [5, 900], api: "audio_url", missing: "Add a voice track.", sample: SAMPLE_VOICE },
        ],
        options: [
          { id: "transcribe", label: "Read the Speech First", api: "enable_transcription", values: ["On", "Off"], apiValues: [true, false], default: "On", hint: "Reads the words first for tighter lip sync. Turn off for audio with lots of non-speech sound.", say: [null, "Speech not read first"] },
          H3_RES(["480p", "768p", "1080p", "2K"], "768p"),
        ],
        prompt: { mode: "none", placeholder: "", api: "" },
        credits: { perSecond: 9, secsFrom: { input: "voice" } },
      },
    ],
  },
];

/** 固定价格(积分)的工具:Voice Clone 按次 */
export const FLAT_CREDITS: Record<string, Record<string, number>> = {
  "voice-clone": { "minimax-voice-clone": 150, "kling-create-voice": 10 },
};

export const modelToolSpec = (key: string) => MODEL_TOOLS.find((t) => t.key === key)!;
