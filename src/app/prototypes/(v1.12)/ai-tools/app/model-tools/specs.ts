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
  /** 结果卡摘要里每个取值怎么说(人话);null = 不写进摘要。不填 = 直接用取值 */
  say?: (string | null)[];
  /** 做成紧跟素材的问题标签(如 Lip Sync「What should they say?」) */
  ask?: string;
  /** voice = 可试听的音色下拉;stepper = 右侧 − 1x + 小步进器 */
  control?: "voice" | "stepper";
  /** 每个取值在音色下拉里的说明(语言 · 风格) */
  meta?: string[];
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
  /** 生成前必勾的确认(Voice Clone 的声音授权) */
  consent?: string;
  /** 第一个选项可以切模型 */
  models: ModelVariant[];
};

const S = "/prototypes/ai-tools/samples";
const SAMPLE_VIDEO = { url: "/prototypes/asset-library/videos/video-01.mp4", name: "sneaker-room.mp4", secs: 4.1 };
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
    emptyTitle: "Copy any dance or move",
    emptyBody: "Add a character photo and a video with the moves. Your character performs them, in your scene.",
    result: "video",
    previewFrom: "motion",
    resultTitle: "Moves copied",
    sourceLabel: "Motion video",
    demoResult: `${S}/3d-result.mp4`,
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
    cta: "Swap",
    running: "Generating",
    emptyTitle: "Same video, new cast",
    emptyBody: "Upload a video and one photo per new person. They take over the moves, shot by shot.",
    result: "video",
    previewFrom: "source",
    resultTitle: "New cast",
    sourceLabel: "Original",
    models: [
      {
        key: "h3-max",
        label: "MiniMax H3 Max",
        badge: "MiniMax H3 Max",
        endpoint: "minimax/h3-max/recast",
        inputs: [
          { id: "source", kind: "video", label: "Video", hint: "5–30s, no single shot longer than 15s", min: 1, max: 1, secs: [5, 30], api: "video_url", sample: SAMPLE_TALK },
          { id: "people", kind: "image", label: "New People", hint: "1–4 photos, one per person. They replace people left to right.", min: 1, max: 4, api: "reference_image_urls", missing: "Add a photo of each new person.", sample: SAMPLE_PEOPLE },
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
    key: "video-relight",
    title: "Video Relight",
    subtitle: "Change the lighting of a video to match a reference.",
    module: "video",
    cta: "Relight",
    running: "Generating",
    emptyTitle: "New light, same shot",
    emptyBody: "Upload a video and a lighting reference, such as a light-probe ball render. We match its color, direction and shadows.",
    result: "video",
    previewFrom: "source",
    resultTitle: "Relit video",
    sourceLabel: "Original",
    demoResult: `${S}/relight-result.mp4`,
    models: [
      {
        key: "h3-max",
        label: "MiniMax H3 Max",
        badge: "MiniMax H3 Max",
        endpoint: "minimax/h3-max/relight",
        inputs: [
          { id: "source", kind: "video", label: "Video", hint: "About 2.3–15s", min: 1, max: 1, secs: [2.33, 15], api: "video_url", sample: SAMPLE_VIDEO },
          { id: "light", kind: "image", label: "Lighting Reference", hint: "A sphere render that shows the light you want", min: 1, max: 1, api: "reference_image_url", missing: "Add a lighting reference.", sample: SAMPLE_LIGHT },
        ],
        /* 比例跟原片：调用时固定传 aspect_ratio = adaptive(API 默认是 16:9) */
        options: [H3_RES(["480p", "768p", "1080p", "2K"], "768p")],
        prompt: { mode: "none", placeholder: "", api: "" },
        credits: { perSecond: 9, secsFrom: { input: "source" } },
      },
    ],
  },
  {
    key: "render-3d",
    title: "3D to Video",
    subtitle: "Turn a 3D blockout or previz into a realistic video.",
    module: "video",
    cta: "Render",
    running: "Generating",
    emptyTitle: "From grey boxes to final shot",
    emptyBody: "Upload a Blender render or previz up to 15s. Add look references, or let AI create them.",
    result: "video",
    previewFrom: "source",
    resultTitle: "Rendered video",
    sourceLabel: "3D render",
    demoResult: `${S}/3d-result.mp4`,
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
          { id: "looks", label: "Looks to Generate", api: "max_generated_reference_images", values: ["1", "2", "4", "8"], apiValues: [1, 2, 4, 8], default: "2", hint: "Used only when you add no look references.", say: ["1 look", "2 looks", "4 looks", "8 looks"] },
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
    emptyTitle: "New words, natural lips",
    emptyBody: "Upload a 2–10s clip with a clear face, then add new speech or type a script.",
    result: "video",
    previewFrom: "source",
    resultTitle: "New words, synced",
    sourceLabel: "Original",
    demoResult: `${S}/lipsync-result.mp4`,
    models: [
      {
        key: "kling-lipsync",
        label: "Kling LipSync",
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
            values: ["Commercial lady", "Reader", "UK man", "Calm narrator"],
            apiValues: ["commercial_lady_en_f-v1", "reader_en_m-v1", "uk_man2", "calm_story1"],
            meta: ["English · Bright, ad-ready", "English · Clear, even", "English · British, warm", "English · Slow, storytelling"],
            /* 语言并进音色(音色本身就是某种语言的),不单独一组 */
            sets: [{ voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }, { voice_language: "en" }],
            default: "Commercial lady",
            showIf: { option: "from", value: "Type a script" },
          },
          { id: "speed", label: "Speed", api: "voice_speed", control: "stepper", values: ["0.8x", "1x", "1.2x", "1.5x", "2x"], apiValues: [0.8, 1, 1.2, 1.5, 2], default: "1x", showIf: { option: "from", value: "Type a script" }, say: ["0.8x speed", null, "1.2x speed", "1.5x speed", "2x speed"] },
        ],
        prompt: { mode: "required", label: "Script", placeholder: "Type what they should say", api: "text", showIf: { option: "from", value: "Type a script" } },
        credits: { perSecond: 14, secsFrom: { input: "source" } },
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
    emptyTitle: "A photo that talks",
    emptyBody: "Add a photo of a person, pet or character and a voice track. The video runs as long as the audio.",
    result: "video",
    previewFrom: "photo",
    resultTitle: "Your photo, talking",
    sourceLabel: "Photo",
    demoResult: `${S}/avatar-result.mp4`,
    models: [
      {
        key: "kling-avatar",
        label: "Kling AI Avatar v2 Pro",
        blurb: "Takes a delivery prompt",
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
        blurb: "Long audio, up to 2K",
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
  {
    key: "voice-clone",
    title: "Voice Clone",
    subtitle: "Create your own voice from a short recording.",
    module: "audio",
    cta: "Clone Voice",
    running: "Generating",
    emptyTitle: "Your voice, ready for every video",
    emptyBody: "Upload a clean recording of one speaker. Use the new voice in voiceovers, Lip Sync and avatars.",
    result: "voice",
    resultTitle: "New voice",
    consent: "This is my voice.",
    models: [
      {
        key: "minimax-voice-clone",
        label: "MiniMax Voice Clone",
        blurb: "Most natural",
        endpoint: "fal-ai/minimax/voice-clone",
        inputs: [{ id: "sample", kind: "audio", label: "Voice Recording", hint: "At least 10s of one person speaking. MP3, WAV or M4A.", min: 1, max: 1, secs: [10, 300], api: "audio_url", sample: SAMPLE_VOICE }],
        options: [
          { id: "noise", label: "Noise Removal", api: "noise_reduction", values: ["Off", "On"], apiValues: [false, true], default: "Off", hint: "Cleans up hum and room noise before cloning.", say: [null, "Noise removed"] },
          { id: "volume", label: "Even Out Volume", api: "need_volume_normalization", values: ["Off", "On"], apiValues: [false, true], default: "Off", hint: "Makes quiet and loud parts the same level.", say: [null, "Volume evened out"] },
        ],
        /* 试听台词挪到结果卡(生成后换句子听);表单里不再放 */
        prompt: { mode: "none", placeholder: "", api: "" },
        credits: { perSecond: 0, secsFrom: { fixed: 0 } },
      },
      {
        key: "kling-create-voice",
        label: "Kling Create Voice",
        blurb: "Quick, from a 5–30s clip",
        endpoint: "fal-ai/kling-video/create-voice",
        inputs: [{ id: "sample", kind: "audio", label: "Voice Recording", hint: "5–30s of one person speaking. MP3, WAV or M4A.", min: 1, max: 1, secs: [5, 30], api: "voice_url", sample: SAMPLE_VOICE }],
        options: [],
        prompt: { mode: "none", placeholder: "", api: "" },
        credits: { perSecond: 0, secsFrom: { fixed: 0 } },
      },
    ],
  },
];

/** 固定价格(积分)的工具:Voice Clone 按次 */
export const FLAT_CREDITS: Record<string, Record<string, number>> = {
  "voice-clone": { "minimax-voice-clone": 150, "kling-create-voice": 10 },
};

export const modelToolSpec = (key: string) => MODEL_TOOLS.find((t) => t.key === key)!;
