/* 音频落地页的样例数据(2026-11-25)。21 个音频页(12 模型 + 9 工具)的播放器、人物卡、专辑卡、音效格都从这里取。
   ── 样例位是按竞品调研定的(ElevenLabs /text-to-speech、/music、/sound-effects,Suno、Murf 落地页,2026-11-25):
      语音：竞品反复出现的场景 = 广告 / 社媒 / 旁白 / 对话 / 教学 / 角色;脚本约三句;情绪标签用 [softly] [laughs] [whispers] [excited] [sighs] 这类;
      音乐：竞品列曲风 chips + 专辑卡(歌名 + 曲风 + BPM + 时长),商用曲库按 Video & Film / Social / Corporate 分;我们面向广告投放，所以每首 30–60 秒;
      音效：竞品是「分类 + 名称」方格，热门分类里广告/视频相关的是 whoosh 转场、riser、logo sting、UI pop、foley、氛围。
   ── 素材会话怎么填:
      1. 按 SLOTS 里每一条的 script / prompt 生成(模型页用该页的模型;工具页默认复用它第一个模型的那一组，不用另生成);
      2. 生成好后在 FILLED[<页面 slug>][<slot id>] 填 { src, cover? },不填的位会用占位音频(现有 Seed Audio 四条);
      3. 人像封面先借现网已有的图(PORTRAITS),正式封面建议按场景配一张竖版人像(不拿产品、不压字)。
   产品 UI 文案用英文;注释用中文。 */

export type AudioKind = "voice" | "music" | "sfx";

export type VoiceSlot = {
  id: string;
  /** 场景标签(卡片左上角) */
  scene: "Advertisement" | "Social Media" | "Narration" | "Conversational" | "Educational" | "Character";
  /** 声音名(卡片底部),虚构 */
  voice: string;
  /** 一句话描述音色 */
  tone: string;
  accent: string;
  /** 要念的脚本(≈ 三句,15–20 秒) */
  script: string;
};

export type MusicSlot = {
  id: string;
  title: string;
  genres: string[];
  bpm: number;
  /** 目标时长(秒) */
  length: number;
  vocals: boolean;
  /** 用在哪里(卡片副标题) */
  use: string;
  prompt: string;
  /** 段落：给进度条分段用,秒数加总 = length */
  sections: [string, number][];
  /** 封面底色(没有封面图时用两色渐变画封面) */
  hue: [string, string];
  /** 带人声的曲子的歌词(MiniMax Music 3 必须传 lyrics,无人声传 [instrumental] 结构;Lyria 3.5 不收 lyrics 字段，要写进提示词) */
  lyrics?: string;
};

export type SfxSlot = {
  id: string;
  category: string;
  name: string;
  /** lucide 图标名(见 SfxIcon) */
  icon: "whoosh" | "bell" | "sparkle" | "trend" | "footprints" | "rain" | "bottle" | "users" | "rocket" | "zap" | "keyboard" | "camera";
  length: number;
  loop?: boolean;
  prompt: string;
};

/* ── 语音：人物卡 5 张 = 首屏;声音库 = 首屏 5 张 + 下面 4 条(共 9 条,按场景分 tab) ── */
export const VOICE_SLOTS: VoiceSlot[] = [
  { id: "ad", scene: "Advertisement", voice: "Maya", tone: "Bright, confident", accent: "American", script: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back." },
  { id: "social", scene: "Social Media", voice: "Jade", tone: "Casual, upbeat", accent: "American", script: "Okay, I wasn't going to post this, but… [laughs] this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio." },
  { id: "narration", scene: "Narration", voice: "Eleanor", tone: "Warm, unhurried", accent: "British", script: "Every bottle starts in a small kitchen in Bristol. [softly] We still test each batch by hand, because the people who use it deserve that care. This is how good things are made." },
  { id: "conversational", scene: "Conversational", voice: "Sam", tone: "Friendly, natural", accent: "American", script: "Hey, thanks for calling Fernwell. [sighs warmly] Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight." },
  { id: "educational", scene: "Educational", voice: "Priya", tone: "Clear, patient", accent: "British", script: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours." },
  { id: "promo", scene: "Advertisement", voice: "Marcus", tone: "Deep, cinematic", accent: "American", script: "This weekend only. [whispers] Everything is twenty percent off. [excited] Don't wait. Shop the Fernwell summer sale before Sunday midnight." },
  { id: "unboxing", scene: "Social Media", voice: "Chloe", tone: "Playful, fast", accent: "British", script: "Unboxing time! Look at this packaging, it's literally a gift. [gasps] And it smells like oranges. Okay, full review on Friday, follow so you don't miss it." },
  { id: "story", scene: "Narration", voice: "Daniel", tone: "Calm, documentary", accent: "American", script: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves." },
  { id: "character", scene: "Character", voice: "Captain Brix", tone: "Gruff, animated", accent: "Scottish", script: "Ahoy! [laughs] Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!" },
];

/* 情绪标签演示(bento 左边):同一段广告脚本，标签高亮 */
export const TAG_SCRIPT =
  "[excited] Big news, everyone. LUMEA Glow Serum is back in stock. [softly] I know, I know, it sold out in two days last time. [laughs] So this time, set a reminder. [whispers] Restock drops Friday at nine.";

/* 多语言卡：同一句话不同语言(美 / 英为主) */
export const LANG_LINES: { id: string; lang: string; line: string }[] = [
  { id: "en-us", lang: "English (US)", line: "Glow that lasts all day." },
  { id: "en-gb", lang: "English (UK)", line: "Glow that lasts all day." },
  { id: "es", lang: "Spanish", line: "Un brillo que dura todo el día." },
  { id: "fr", lang: "French", line: "Un éclat qui dure toute la journée." },
  { id: "de", lang: "German", line: "Ein Strahlen, das den ganzen Tag hält." },
  { id: "ja", lang: "Japanese", line: "一日中続く、うるおいの輝き。" },
];

/* 克隆演示(三小卡之一):10 秒原声 → 用克隆声念新脚本(voice-replication-2-0 的 demo_text 最多 80 字符，output 控制在 80 以内) */
export const CLONE_DEMO = {
  reference: { id: "clone-ref", label: "Your 10-second sample", script: "Hi, I'm Jess, and this is what my voice sounds like when I'm talking to my followers." },
  output: { id: "clone-out", label: "Cloned voice, new script", script: "New drop alert! Fernwell mineral SPF is here, and I wear it every day." },
};

/* 多人对话(三小卡之一 / 播客页首屏) */
export const DIALOGUE_DEMO = {
  id: "dialogue",
  speakers: ["Host · Maya", "Guest · Sam"],
  lines: [
    "Maya: So you went from zero to a hundred thousand customers in a year?",
    "Sam: [laughs] Honestly, it was one video. A thirty-second ad we almost didn't post.",
    "Maya: Okay, I need to hear everything.",
  ],
};

/* ── 音乐：风格 chips(点了换提示词) + 专辑卡 7 张 ── */
export const MUSIC_CHIPS: { label: string; prompt: string; vocals: boolean }[] = [
  { label: "Lo-fi beat", prompt: "Chill lo-fi hip hop beat, dusty vinyl crackle, mellow Rhodes chords, 80 BPM, 30 seconds, for a cozy morning-routine video.", vocals: false },
  { label: "Pop anthem", prompt: "Upbeat pop anthem with female vocals about feeling brand new, big chorus that repeats the hook \"Glow up\", 120 BPM, 45 seconds.", vocals: true },
  { label: "Cinematic", prompt: "Epic cinematic trailer music, low strings building to a huge drum hit, ends on a held brass chord, 30 seconds, for a product launch.", vocals: false },
  { label: "Corporate upbeat", prompt: "Light, optimistic corporate background track, ukulele and claps, 110 BPM, 60 seconds, sits under a voiceover.", vocals: false },
  { label: "Afrobeats", prompt: "Feel-good Afrobeats groove, log drums and bright guitar, 104 BPM, 30 seconds, summer fashion ad.", vocals: false },
  { label: "Country ballad", prompt: "Warm acoustic country ballad with male vocals about the open road and a good cup of coffee, 76 BPM, 45 seconds.", vocals: true },
  { label: "UK garage", prompt: "Late-night UK garage, shuffled 2-step drums, chopped vocal stabs, 132 BPM, 30 seconds, for a nightlife drink ad.", vocals: false },
  { label: "Jingle", prompt: "Five-second bright jingle ending on the sung brand name \"Fernwell\", ukulele and glockenspiel.", vocals: true },
];

export const MUSIC_SLOTS: MusicSlot[] = [
  { id: "glow-up", title: "Glow Up", genres: ["Pop", "Vocals"], bpm: 120, length: 45, vocals: true, use: "Product launch anthem", prompt: MUSIC_CHIPS[1].prompt, sections: [["Intro", 5], ["Verse", 15], ["Chorus", 18], ["Outro", 7]], hue: ["#FF744D", "#FFC46B"], lyrics: "[Verse]\nWoke up on a Monday, mirror says hello\nThree drops of sunshine, now I\'m ready to go\n[Chorus]\nGlow up, glow up, brand new me\nGlow up, glow up, all you see\nGlow up!" },
  { id: "slow-mornings", title: "Slow Mornings", genres: ["Lo-fi", "Instrumental"], bpm: 80, length: 30, vocals: false, use: "Morning-routine Reels", prompt: MUSIC_CHIPS[0].prompt, sections: [["Intro", 6], ["Loop A", 12], ["Loop B", 12]], hue: ["#6B7BFF", "#C9B8FF"] },
  { id: "first-light", title: "First Light", genres: ["Cinematic", "Epic"], bpm: 90, length: 30, vocals: false, use: "Trailer and launch video", prompt: MUSIC_CHIPS[2].prompt, sections: [["Build", 14], ["Rise", 10], ["Hit", 6]], hue: ["#1E2A44", "#FF744D"] },
  { id: "summer-in-lagos", title: "Summer in Lagos", genres: ["Afrobeats"], bpm: 104, length: 30, vocals: false, use: "Fashion and lifestyle ads", prompt: MUSIC_CHIPS[4].prompt, sections: [["Intro", 6], ["Groove", 16], ["Outro", 8]], hue: ["#FFB020", "#22B07D"] },
  { id: "open-road", title: "Open Road", genres: ["Country", "Vocals"], bpm: 76, length: 45, vocals: true, use: "Brand story", prompt: MUSIC_CHIPS[5].prompt, sections: [["Intro", 6], ["Verse", 18], ["Chorus", 15], ["Outro", 6]], hue: ["#A0522D", "#F3D9A4"], lyrics: "[Verse]\nSun comes up on the open road\nCoffee warm and the radio low\n[Chorus]\nOh, take me where the mornings go\nOne more mile on the open road" },
  { id: "after-hours", title: "After Hours", genres: ["UK garage"], bpm: 132, length: 30, vocals: false, use: "Nightlife drink ad", prompt: MUSIC_CHIPS[6].prompt, sections: [["Intro", 4], ["Drop", 18], ["Outro", 8]], hue: ["#0E0E2C", "#7A5CFF"] },
  { id: "good-day", title: "Good Day", genres: ["Corporate", "Instrumental"], bpm: 110, length: 60, vocals: false, use: "Under a voiceover", prompt: MUSIC_CHIPS[3].prompt, sections: [["Intro", 8], ["A", 20], ["B", 20], ["Outro", 12]], hue: ["#3BB2F6", "#E8F6FF"] },
];

/* 「一段音乐，三种用法」三张可播卡(音乐页 bento) */
export const MUSIC_USES = [
  { id: "use-ad", title: "Background music for ads", body: "Cut to the beat of your product shots.", length: 15 },
  { id: "use-sting", title: "5-second jingle", body: "End every ad on your brand name.", length: 5 },
  { id: "use-pod", title: "Podcast intro", body: "A theme that fades under your voice.", length: 20 },
];

/* ── 音效:9 格 + 「Create your own」;偏广告 / 视频剪辑常用 ── */
export const SFX_SLOTS: SfxSlot[] = [
  { id: "whoosh", category: "Transitions", name: "Fast whoosh between shots", icon: "whoosh", length: 1.5, prompt: "A fast airy whoosh for a quick cut between two video shots, dry, no reverb." },
  { id: "riser", category: "Cinematic", name: "Tension riser into a reveal", icon: "trend", length: 6, prompt: "A rising tension riser with strings and noise, building for six seconds into a product reveal, ends abruptly." },
  { id: "logo", category: "Logo", name: "Shimmering logo sting", icon: "sparkle", length: 3, prompt: "A short shimmering logo sting with bells and a soft low boom, three seconds, bright and premium." },
  { id: "notify", category: "UI", name: "Cash register notification", icon: "bell", length: 1, prompt: "A crisp, satisfying money notification ding with a tiny coin jingle, for an app sale alert." },
  { id: "pour", category: "Product", name: "Soda can open and pour", icon: "bottle", length: 4, prompt: "A cold soda can cracking open, fizz, then pouring over ice into a glass, close-up and crisp." },
  { id: "rain", category: "Nature", name: "Rain on a wooden porch", icon: "rain", length: 10, loop: true, prompt: "Gentle steady rain falling on a wooden porch roof, soft distant thunder, seamless loop." },
  { id: "footsteps", category: "Foley", name: "Footsteps on sand", icon: "footprints", length: 5, prompt: "Slow barefoot footsteps on dry beach sand, light wind, close microphone." },
  { id: "crowd", category: "Crowd", name: "Stadium crowd cheers", icon: "users", length: 5, prompt: "A big stadium crowd erupting into cheers and applause after a goal." },
  { id: "ship", category: "Sci-Fi", name: "Spaceship engine hum", icon: "rocket", length: 8, loop: true, prompt: "Deep humming spaceship engine idling, low rumble with soft electronic pulses, seamless loop." },
];

export const SFX_PROMPTS = [
  "A cold soda can cracking open, fizz, then pouring over ice",
  "A fast airy whoosh for a quick cut between two shots",
  "A shimmering three-second logo sting with a soft low boom",
];

/* ── 哪页走哪种版式 ── */
export const AUDIO_PAGE_KIND: Record<string, AudioKind> = {
  "seed-audio-1-0": "voice",
  "elevenlabs-eleven-v3": "voice",
  "minimax-speech-2-8-hd": "voice",
  "minimax-speech-2-6-hd": "voice",
  "gemini-3-8-flash-tts": "voice",
  "heygen-voice": "voice",
  "voice-replication-2-0": "voice",
  "elevenlabs-music-v2-5": "music",
  "lyria-3-5": "music",
  "mureka-v9-5": "music",
  "minimax-music-3": "music",
  "elevenlabs-sound-effects-v3": "sfx",
  "ai-voice-over": "voice",
  "text-to-speech": "voice",
  "ai-voice-clone": "voice",
  "ai-voice-generator": "voice",
  "ai-podcast-generator": "voice",
  "ai-music-generator": "music",
  "ai-song-generator": "music",
  "ai-jingle-generator": "music",
  "ai-sound-effects-generator": "sfx",
};
export const audioKindOf = (slug: string): AudioKind | undefined => AUDIO_PAGE_KIND[slug];

/* 语音页里哪些页首屏强调「克隆」或「对话」 */
export const VOICE_FOCUS: Record<string, "clone" | "dialogue"> = {
  "ai-voice-clone": "clone",
  "voice-replication-2-0": "clone",
  "ai-podcast-generator": "dialogue",
};

/* Seed Audio 1.0 三样都能做：语音版式下面再加音乐 + 音效 */
export const ALL_IN_ONE = new Set(["seed-audio-1-0"]);

/* 人像封面(先借现网图;素材会话可在 FILLED 里换) */
const P = "/prototypes/site";
/* 2026-11-25 每个声音位自己的人像(Nano Banana 2.1 生成，3:4,上下留白给标签和名字) */
export const PORTRAITS: Record<string, string> = {
  ad: `${P}/audio/portraits/ad.jpg`,
  social: `${P}/audio/portraits/social.jpg`,
  narration: `${P}/audio/portraits/narration.jpg`,
  conversational: `${P}/audio/portraits/conversational.jpg`,
  educational: `${P}/audio/portraits/educational.jpg`,
  promo: `${P}/audio/portraits/promo.jpg`,
  unboxing: `${P}/audio/portraits/unboxing.jpg`,
  story: `${P}/audio/portraits/story.jpg`,
  character: `${P}/audio/portraits/character.jpg`,
};

/* ── 已生成的真实音频(素材会话往这里填)── */
/** title / text 不填就用 SLOTS 里的名字和脚本;实际生成内容和样例位不完全一致时填上，页面以这里为准 */
export type Filled = { src: string; cover?: string; /** 2026-11-26 每个模型页一套自己的人：卡片上的名字(不填用 VOICE_SLOTS 里的) */ voice?: string; title?: string; text?: string; /** 对话：逐句台词「名字: 台词」 */ lines?: string[] };
export const FILLED: Record<string, Record<string, Filled>> = {
  "seed-audio-1-0": {
    /* 2026-11-09 博客实测的四条(见桌面 BuzzVideo博客工程/models/seed-audio-1-0/REPORT.md) */
    ad: { src: `${P}/models/seed-audio-1-0/a_vo_norm.mp3`, cover: `${P}/audio/portraits/seed-audio-1-0/ad.jpg`, voice: "Chloe", title: "Black Friday skincare read", text: "Dry winter skin? Meet LUMEA Glow Serum. Three drops every morning, and your skin feels soft and looks lit from within, even under the holiday party lights. Give the gift of glow this Black Friday. LUMEA. Tap the link to shop." },
    dialogue: { src: `${P}/models/seed-audio-1-0/b_dialogue_trim_norm.mp3`, title: "Two friends, one kitchen", text: "Mia and Jordan chat in a UGC-style kitchen scene, with small laughs and a mug set down on the counter.", lines: [
        "Mia: Okay, be honest. What are you getting your mom this year?",
        "Jordan: Ugh. Candles again, probably?",
        "Mia: No more candles. I got mine the LUMEA Glow Serum set. It comes in this cute little gift box.",
        "Jordan: Wait, the one you won't stop talking about?",
        "Mia: That one. And it's on sale for Black Friday.",
        "Jordan: Okay, sold. Send me the link.",
      ] },
    "glow-up": { src: `${P}/models/seed-audio-1-0/c_music_norm.mp3`, title: "Holiday Rush", text: "A 15-second instrumental pop bed for a holiday shopping ad: sleigh bells, plucked synth, claps, 120 BPM." },
    pour: { src: `${P}/models/seed-audio-1-0/d_sfx_norm.mp3`, title: "Rainy morning coffee", text: "Rain on the window, beans into the grinder, hot water poured, a mug set down. 12 seconds, no voices." },
  },
};

/* >>> model-page-media 生成 2026-11-25:各页用本页模型生成的音频(工程 ~/Desktop/官网素材工程/09-模型页音频,重跑 integrate.py 会覆盖这一段) */
FILLED["elevenlabs-eleven-v3"] = {
  "ad": {src: `${P}/audio/elevenlabs-eleven-v3/ad.mp3`, cover: `${P}/audio/portraits/elevenlabs-eleven-v3/ad.jpg`, voice: "Sofia", text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back."},
  "social": {src: `${P}/audio/elevenlabs-eleven-v3/social.mp3`, cover: `${P}/audio/portraits/elevenlabs-eleven-v3/social.jpg`, voice: "Hana", text: "Okay, I wasn't going to post this, but… [laughs] this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/elevenlabs-eleven-v3/narration.mp3`, cover: `${P}/audio/portraits/elevenlabs-eleven-v3/narration.jpg`, voice: "Fiona", text: "Every bottle starts in a small kitchen in Bristol. [softly] We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/elevenlabs-eleven-v3/conversational.mp3`, cover: `${P}/audio/portraits/elevenlabs-eleven-v3/conversational.jpg`, voice: "Diego", text: "Hey, thanks for calling Fernwell. [sighs warmly] Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/elevenlabs-eleven-v3/educational.mp3`, cover: `${P}/audio/portraits/elevenlabs-eleven-v3/educational.jpg`, voice: "Grace", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/elevenlabs-eleven-v3/promo.mp3`, text: "This weekend only. [whispers] Everything is twenty percent off. [excited] Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/elevenlabs-eleven-v3/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. [gasps] And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/elevenlabs-eleven-v3/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/elevenlabs-eleven-v3/character.mp3`, text: "[strong Scottish accent] Ahoy! [laughs] Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/elevenlabs-eleven-v3/tags.mp3`, text: "[excited] Big news, everyone. LUMEA Glow Serum is back in stock. [softly] I know, I know, it sold out in two days last time. [laughs] So this time, set a reminder. [whispers] Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/elevenlabs-eleven-v3/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-en-gb": {src: `${P}/audio/elevenlabs-eleven-v3/lang-en-gb.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/elevenlabs-eleven-v3/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-fr": {src: `${P}/audio/elevenlabs-eleven-v3/lang-fr.mp3`, text: "Un éclat qui dure toute la journée."},
  "lang-de": {src: `${P}/audio/elevenlabs-eleven-v3/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/elevenlabs-eleven-v3/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "dialogue": {src: `${P}/audio/elevenlabs-eleven-v3/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: [laughs] Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
};
FILLED["minimax-speech-2-8-hd"] = {
  "ad": {src: `${P}/audio/minimax-speech-2-8-hd/ad.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-8-hd/ad.jpg`, voice: "Zoe", text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back."},
  "social": {src: `${P}/audio/minimax-speech-2-8-hd/social.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-8-hd/social.jpg`, voice: "Lily", text: "Okay, I wasn't going to post this, but… this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/minimax-speech-2-8-hd/narration.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-8-hd/narration.jpg`, voice: "Anjali", text: "Every bottle starts in a small kitchen in Bristol. We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/minimax-speech-2-8-hd/conversational.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-8-hd/conversational.jpg`, voice: "Kevin", text: "Hey, thanks for calling Fernwell. Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/minimax-speech-2-8-hd/educational.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-8-hd/educational.jpg`, voice: "Charlotte", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/minimax-speech-2-8-hd/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/minimax-speech-2-8-hd/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/minimax-speech-2-8-hd/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/minimax-speech-2-8-hd/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/minimax-speech-2-8-hd/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. I know, I know, it sold out in two days last time. So this time, set a reminder. Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/minimax-speech-2-8-hd/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/minimax-speech-2-8-hd/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-de": {src: `${P}/audio/minimax-speech-2-8-hd/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/minimax-speech-2-8-hd/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "dialogue": {src: `${P}/audio/minimax-speech-2-8-hd/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
};
FILLED["minimax-speech-2-6-hd"] = {
  "ad": {src: `${P}/audio/minimax-speech-2-6-hd/ad.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-6-hd/ad.jpg`, voice: "Ava", text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back."},
  "social": {src: `${P}/audio/minimax-speech-2-6-hd/social.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-6-hd/social.jpg`, voice: "Kiara", text: "Okay, I wasn't going to post this, but… this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/minimax-speech-2-6-hd/narration.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-6-hd/narration.jpg`, voice: "Margaret", text: "Every bottle starts in a small kitchen in Bristol. We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/minimax-speech-2-6-hd/conversational.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-6-hd/conversational.jpg`, voice: "Andre", text: "Hey, thanks for calling Fernwell. Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/minimax-speech-2-6-hd/educational.mp3`, cover: `${P}/audio/portraits/minimax-speech-2-6-hd/educational.jpg`, voice: "Yasmin", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/minimax-speech-2-6-hd/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/minimax-speech-2-6-hd/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/minimax-speech-2-6-hd/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/minimax-speech-2-6-hd/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/minimax-speech-2-6-hd/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. I know, I know, it sold out in two days last time. So this time, set a reminder. Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/minimax-speech-2-6-hd/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/minimax-speech-2-6-hd/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-fr": {src: `${P}/audio/minimax-speech-2-6-hd/lang-fr.mp3`, text: "Un éclat qui dure toute la journée."},
  "lang-de": {src: `${P}/audio/minimax-speech-2-6-hd/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/minimax-speech-2-6-hd/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "dialogue": {src: `${P}/audio/minimax-speech-2-6-hd/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
};
FILLED["gemini-3-8-flash-tts"] = {
  "ad": {src: `${P}/audio/gemini-3-8-flash-tts/ad.mp3`, cover: `${P}/audio/portraits/gemini-3-8-flash-tts/ad.jpg`, voice: "Emma", text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back."},
  "social": {src: `${P}/audio/gemini-3-8-flash-tts/social.mp3`, cover: `${P}/audio/portraits/gemini-3-8-flash-tts/social.jpg`, voice: "Camila", text: "Okay, I wasn't going to post this, but… this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/gemini-3-8-flash-tts/narration.mp3`, cover: `${P}/audio/portraits/gemini-3-8-flash-tts/narration.jpg`, voice: "Imogen", text: "Every bottle starts in a small kitchen in Bristol. We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/gemini-3-8-flash-tts/conversational.mp3?v=2`, text: "Hey, thanks for calling Fernwell. Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/gemini-3-8-flash-tts/educational.mp3`, cover: `${P}/audio/portraits/gemini-3-8-flash-tts/educational.jpg`, voice: "Mei", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/gemini-3-8-flash-tts/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/gemini-3-8-flash-tts/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/gemini-3-8-flash-tts/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/gemini-3-8-flash-tts/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/gemini-3-8-flash-tts/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. I know, I know, it sold out in two days last time. So this time, set a reminder. Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/gemini-3-8-flash-tts/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-en-gb": {src: `${P}/audio/gemini-3-8-flash-tts/lang-en-gb.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/gemini-3-8-flash-tts/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-fr": {src: `${P}/audio/gemini-3-8-flash-tts/lang-fr.mp3`, text: "Un éclat qui dure toute la journée."},
  "lang-de": {src: `${P}/audio/gemini-3-8-flash-tts/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/gemini-3-8-flash-tts/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "dialogue": {src: `${P}/audio/gemini-3-8-flash-tts/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
};
FILLED["heygen-voice"] = {
  "ad": {src: `${P}/audio/heygen-voice/ad.mp3`, cover: `${P}/audio/portraits/heygen-voice/ad.jpg`, voice: "Naomi", text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum: fifteen percent vitamin C, one drop, and that just-back-from-vacation look. Try it for thirty days, or your money back."},
  "social": {src: `${P}/audio/heygen-voice/social.mp3`, cover: `${P}/audio/portraits/heygen-voice/social.jpg`, voice: "Sienna", text: "Okay, I wasn't going to post this, but… this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/heygen-voice/narration.mp3`, cover: `${P}/audio/portraits/heygen-voice/narration.jpg`, voice: "Clare", text: "Every bottle starts in a small kitchen in Bristol. We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/heygen-voice/conversational.mp3`, cover: `${P}/audio/portraits/heygen-voice/conversational.jpg`, voice: "Ryan", text: "Hey, thanks for calling Fernwell. Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/heygen-voice/educational.mp3`, cover: `${P}/audio/portraits/heygen-voice/educational.jpg`, voice: "Nadia", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/heygen-voice/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/heygen-voice/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/heygen-voice/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/heygen-voice/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/heygen-voice/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. I know, I know, it sold out in two days last time. So this time, set a reminder. Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/heygen-voice/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/heygen-voice/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-fr": {src: `${P}/audio/heygen-voice/lang-fr.mp3`, text: "Un éclat qui dure toute la journée."},
  "lang-de": {src: `${P}/audio/heygen-voice/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/heygen-voice/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "dialogue": {src: `${P}/audio/heygen-voice/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
};
Object.assign(FILLED["seed-audio-1-0"], {
  "social": {src: `${P}/audio/seed-audio-1-0/social.mp3`, cover: `${P}/audio/portraits/seed-audio-1-0/social.jpg`, voice: "Mia", text: "Okay, I wasn't going to post this, but… this sparkling yuzu soda is actually so good. Zero sugar, real fruit, and it tastes like summer. Link's in my bio."},
  "narration": {src: `${P}/audio/seed-audio-1-0/narration.mp3`, cover: `${P}/audio/portraits/seed-audio-1-0/narration.jpg`, voice: "Harriet", text: "Every bottle starts in a small kitchen in Bristol. We still test each batch by hand, because the people who use it deserve that care. This is how good things are made."},
  "conversational": {src: `${P}/audio/seed-audio-1-0/conversational.mp3`, cover: `${P}/audio/portraits/seed-audio-1-0/conversational.jpg`, voice: "Ethan", text: "Hey, thanks for calling Fernwell. Sounds like your order's running late. Let me check that for you. Okay, it's out for delivery and should be with you by six tonight."},
  "educational": {src: `${P}/audio/seed-audio-1-0/educational.mp3`, cover: `${P}/audio/portraits/seed-audio-1-0/educational.jpg`, voice: "Amara", text: "Sunscreen works in two ways. Mineral filters sit on the skin and reflect light; chemical filters absorb it. Either way, use about a teaspoon for your face, and reapply every two hours."},
  "promo": {src: `${P}/audio/seed-audio-1-0/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait. Shop the Fernwell summer sale before Sunday midnight."},
  "unboxing": {src: `${P}/audio/seed-audio-1-0/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift. And it smells like oranges. Okay, full review on Friday, follow so you don't miss it."},
  "story": {src: `${P}/audio/seed-audio-1-0/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: the morning coffee. Five years and three million cups later, they still roast every bean themselves."},
  "character": {src: `${P}/audio/seed-audio-1-0/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers, extra salt, extra crunch. Now hand 'em over before the gulls get 'em!"},
  "tags": {src: `${P}/audio/seed-audio-1-0/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. I know, I know, it sold out in two days last time. So this time, set a reminder. Restock drops Friday at nine."},
  "lang-en-us": {src: `${P}/audio/seed-audio-1-0/lang-en-us.mp3`, text: "Glow that lasts all day."},
  "lang-en-gb": {src: `${P}/audio/seed-audio-1-0/lang-en-gb.mp3`, text: "Glow that lasts all day."},
  "lang-es": {src: `${P}/audio/seed-audio-1-0/lang-es.mp3`, text: "Un brillo que dura todo el día."},
  "lang-fr": {src: `${P}/audio/seed-audio-1-0/lang-fr.mp3`, text: "Un éclat qui dure toute la journée."},
  "lang-de": {src: `${P}/audio/seed-audio-1-0/lang-de.mp3`, text: "Ein Strahlen, das den ganzen Tag hält."},
  "lang-ja": {src: `${P}/audio/seed-audio-1-0/lang-ja.mp3`, text: "一日中続く、うるおいの輝き。"},
  "slow-mornings": {src: `${P}/audio/seed-audio-1-0/slow-mornings.mp3`},
  "summer-in-lagos": {src: `${P}/audio/seed-audio-1-0/summer-in-lagos.mp3`},
  "after-hours": {src: `${P}/audio/seed-audio-1-0/after-hours.mp3`},
  "whoosh": {src: `${P}/audio/seed-audio-1-0/whoosh.mp3`},
  "riser": {src: `${P}/audio/seed-audio-1-0/riser.mp3`},
  "logo": {src: `${P}/audio/seed-audio-1-0/logo.mp3`},
  "notify": {src: `${P}/audio/seed-audio-1-0/notify.mp3`},
  "pour": {src: `${P}/audio/seed-audio-1-0/pour.mp3`},
  "rain": {src: `${P}/audio/seed-audio-1-0/rain.mp3`},
  "footsteps": {src: `${P}/audio/seed-audio-1-0/footsteps.mp3`},
  "crowd": {src: `${P}/audio/seed-audio-1-0/crowd.mp3`},
  "ship": {src: `${P}/audio/seed-audio-1-0/ship.mp3`},
  "use-ad": {src: `${P}/audio/seed-audio-1-0/use-ad.mp3`, text: "A 15-second instrumental background track for an ad: plucked synth, claps and a punchy kick at 118 BPM."},
  "use-pod": {src: `${P}/audio/seed-audio-1-0/use-pod.mp3`, text: "A 20-second podcast intro: mellow electric piano, soft bass and brushed drums, fading under the host."},
  "use-sting": {src: `${P}/audio/seed-audio-1-0/use-sting.mp3`, text: "A five-second melody-only sound logo with ukulele and glockenspiel."},
});
FILLED["elevenlabs-music-v2-5"] = {
  "slow-mornings": {src: `${P}/audio/elevenlabs-music-v2-5/slow-mornings.mp3`},
  "first-light": {src: `${P}/audio/elevenlabs-music-v2-5/first-light.mp3`},
  "glow-up": {src: `${P}/audio/elevenlabs-music-v2-5/glow-up.mp3`},
  "summer-in-lagos": {src: `${P}/audio/elevenlabs-music-v2-5/summer-in-lagos.mp3`},
  "open-road": {src: `${P}/audio/elevenlabs-music-v2-5/open-road.mp3`},
  "use-ad": {src: `${P}/audio/elevenlabs-music-v2-5/use-ad.mp3`, text: "A 15-second instrumental background track for an ad: plucked synth, claps and a punchy kick at 118 BPM."},
  "use-pod": {src: `${P}/audio/elevenlabs-music-v2-5/use-pod.mp3`, text: "A 20-second podcast intro: mellow electric piano, soft bass and brushed drums, fading under the host."},
  "use-sting": {src: `${P}/audio/elevenlabs-music-v2-5/use-sting.mp3`, text: "A five-second jingle with ukulele and glockenspiel that ends on the sung brand name."},
};
FILLED["lyria-3-5"] = {
  "slow-mornings": {src: `${P}/audio/lyria-3-5/slow-mornings.mp3`},
  "first-light": {src: `${P}/audio/lyria-3-5/first-light.mp3`},
  "glow-up": {src: `${P}/audio/lyria-3-5/glow-up.mp3`},
  "summer-in-lagos": {src: `${P}/audio/lyria-3-5/summer-in-lagos.mp3`},
  "open-road": {src: `${P}/audio/lyria-3-5/open-road.mp3`},
  "use-ad": {src: `${P}/audio/lyria-3-5/use-ad.mp3`, text: "A 15-second instrumental background track for an ad: plucked synth, claps and a punchy kick at 118 BPM."},
  "use-pod": {src: `${P}/audio/lyria-3-5/use-pod.mp3`, text: "A 20-second podcast intro: mellow electric piano, soft bass and brushed drums, fading under the host."},
  "use-sting": {src: `${P}/audio/lyria-3-5/use-sting.mp3`, text: "A five-second melody-only sound logo with ukulele and glockenspiel."},
};
FILLED["mureka-v9-5"] = {
  "slow-mornings": {src: `${P}/audio/mureka-v9-5/slow-mornings.mp3`},
  "first-light": {src: `${P}/audio/mureka-v9-5/first-light.mp3`},
  "glow-up": {src: `${P}/audio/mureka-v9-5/glow-up.mp3`},
  "summer-in-lagos": {src: `${P}/audio/mureka-v9-5/summer-in-lagos.mp3`},
  "open-road": {src: `${P}/audio/mureka-v9-5/open-road.mp3`},
  "use-ad": {src: `${P}/audio/mureka-v9-5/use-ad.mp3`, text: "A 15-second instrumental background track for an ad: plucked synth, claps and a punchy kick at 118 BPM."},
  "use-pod": {src: `${P}/audio/mureka-v9-5/use-pod.mp3`, text: "A 20-second podcast intro: mellow electric piano, soft bass and brushed drums, fading under the host."},
  "use-sting": {src: `${P}/audio/mureka-v9-5/use-sting.mp3`, text: "A five-second jingle with ukulele and glockenspiel that ends on the sung brand name."},
};
FILLED["minimax-music-3"] = {
  "slow-mornings": {src: `${P}/audio/minimax-music-3/slow-mornings.mp3`},
  "first-light": {src: `${P}/audio/minimax-music-3/first-light.mp3`},
  "summer-in-lagos": {src: `${P}/audio/minimax-music-3/summer-in-lagos.mp3`},
  "good-day": {src: `${P}/audio/minimax-music-3/good-day.mp3`},
  "after-hours": {src: `${P}/audio/minimax-music-3/after-hours.mp3`},
  "glow-up": {src: `${P}/audio/minimax-music-3/glow-up.mp3`},
  "open-road": {src: `${P}/audio/minimax-music-3/open-road.mp3`},
  "use-ad": {src: `${P}/audio/minimax-music-3/use-ad.mp3`, text: "A 15-second instrumental background track for an ad: plucked synth, claps and a punchy kick at 118 BPM."},
  "use-pod": {src: `${P}/audio/minimax-music-3/use-pod.mp3`, text: "A 20-second podcast intro: mellow electric piano, soft bass and brushed drums, fading under the host."},
  "use-sting": {src: `${P}/audio/minimax-music-3/use-sting.mp3`, text: "A five-second jingle with ukulele and glockenspiel that ends on the sung brand name."},
};
FILLED["elevenlabs-sound-effects-v3"] = {
  "whoosh": {src: `${P}/audio/elevenlabs-sound-effects-v3/whoosh.mp3`},
  "riser": {src: `${P}/audio/elevenlabs-sound-effects-v3/riser.mp3`},
  "logo": {src: `${P}/audio/elevenlabs-sound-effects-v3/logo.mp3`},
  "notify": {src: `${P}/audio/elevenlabs-sound-effects-v3/notify.mp3`},
  "pour": {src: `${P}/audio/elevenlabs-sound-effects-v3/pour.mp3`},
  "rain": {src: `${P}/audio/elevenlabs-sound-effects-v3/rain.mp3`},
  "footsteps": {src: `${P}/audio/elevenlabs-sound-effects-v3/footsteps.mp3`},
  "crowd": {src: `${P}/audio/elevenlabs-sound-effects-v3/crowd.mp3`},
  "ship": {src: `${P}/audio/elevenlabs-sound-effects-v3/ship.mp3`},
};
FILLED["voice-replication-2-0"] = {
  "clone-ref": {src: `${P}/audio/voice-replication-2-0/clone-ref.mp3`, text: "Hi, I'm Jess, and this is what my voice sounds like when I'm talking to my followers. I post about skincare, coffee, and whatever I'm loving this week, so thanks for hanging out with me."},
  "clone-out": {src: `${P}/audio/voice-replication-2-0/clone-out.mp3`, text: "New drop alert! Fernwell mineral SPF is here, and I wear it every day."},
  "ad": {src: `${P}/audio/voice-replication-2-0/ad.mp3`, cover: `${P}/audio/portraits/ad.jpg`, text: "Your skin called. It wants vitamin C. Meet LUMEA Glow Serum."},
  "social": {src: `${P}/audio/voice-replication-2-0/social.mp3`, cover: `${P}/audio/portraits/social.jpg`, text: "Okay, I wasn't going to post this, but this yuzu soda is actually so good."},
  "narration": {src: `${P}/audio/voice-replication-2-0/narration.mp3`, cover: `${P}/audio/portraits/narration.jpg`, text: "Every bottle starts in a small kitchen in Bristol, and we test each by hand."},
  "conversational": {src: `${P}/audio/voice-replication-2-0/conversational.mp3`, cover: `${P}/audio/portraits/conversational.jpg`, text: "Hey, thanks for calling Fernwell. Sounds like your order's running late."},
  "educational": {src: `${P}/audio/voice-replication-2-0/educational.mp3`, cover: `${P}/audio/portraits/educational.jpg`, text: "Sunscreen works in two ways. Use a teaspoon, and reapply every two hours."},
  "promo": {src: `${P}/audio/voice-replication-2-0/promo.mp3`, text: "This weekend only. Everything is twenty percent off. Don't wait."},
  "unboxing": {src: `${P}/audio/voice-replication-2-0/unboxing.mp3`, text: "Unboxing time! Look at this packaging, it's literally a gift."},
  "story": {src: `${P}/audio/voice-replication-2-0/story.mp3`, text: "In 2019, two friends quit their jobs to make one thing better: morning coffee."},
  "character": {src: `${P}/audio/voice-replication-2-0/character.mp3`, text: "Ahoy! Ye call that a snack? Real sailors crunch BRIVO crackers!"},
  "dialogue": {src: `${P}/audio/voice-replication-2-0/dialogue.mp3`, lines: ["Maya: So you went from zero to a hundred thousand customers in a year?", "Sam: Honestly, it was one video. A thirty-second ad we almost didn't post.", "Maya: Okay, I need to hear everything."]},
  "tags": {src: `${P}/audio/voice-replication-2-0/tags.mp3`, text: "Big news, everyone. LUMEA Glow Serum is back in stock. Restock drops Friday."},
};
/* <<< model-page-media */





/* 声音复刻页的卡片：每张卡是从一个不同的人的 10 秒原声复刻出来的(素材工程 09-模型页音频/jobs.py 的 SRC,run2.py 逐张复刻),
   名字按原声那个人写，语气栏写「Cloned voice」。
   2026-11-26 Monica:「这是克隆音色，所以应该是不一样的」—— 原来九张卡都写成 Jess、用同一个人的照片，和实际声音对不上 */
export const CLONED_AS: Record<string, Pick<VoiceSlot, "tone" | "accent"> & { names: Record<string, string> }> = {
  "voice-replication-2-0": {
    tone: "Cloned voice",
    accent: "from a 10-second sample",
    names: { ad: "Maya", social: "Jade", narration: "Eleanor", conversational: "Sam", educational: "Priya", promo: "Marcus", unboxing: "Chloe", story: "Daniel", character: "Captain Brix" },
  },
};
/* AI Voice Clone 工具页的克隆对比用声音复刻页那一组(Seed Audio 那组没有克隆样例) */
FILLED["ai-voice-clone"] = {
  "clone-ref": FILLED["voice-replication-2-0"]["clone-ref"],
  "clone-out": FILLED["voice-replication-2-0"]["clone-out"],
};

/* 工具页默认复用的模型(没有自己的音频时借这个模型那一组) */
export const TOOL_SOURCE: Record<string, string> = {
  /* 9 个音频工具页现网都跑在 Seed Audio 1.0 上(tool-content 的 models[0]),所以默认借 Seed Audio 那一组;
     写歌页的人声要靠 Lyria 3.5 等下个版本的模型(Seed Audio 唱不了歌词),借 Lyria 3.5 那一组 */
  "ai-voice-over": "seed-audio-1-0",
  "text-to-speech": "seed-audio-1-0",
  "ai-voice-generator": "seed-audio-1-0",
  "ai-voice-clone": "seed-audio-1-0",
  "ai-podcast-generator": "seed-audio-1-0",
  "ai-music-generator": "seed-audio-1-0",
  "ai-song-generator": "lyria-3-5",
  "ai-jingle-generator": "seed-audio-1-0",
  "ai-sound-effects-generator": "seed-audio-1-0",
};

/* 占位音频：还没生成的位先放 Seed Audio 的四条，保证每个播放键都能出声 */
const PLACEHOLDER: Record<AudioKind | "dialogue", string> = {
  voice: `${P}/models/seed-audio-1-0/a_vo_norm.mp3`,
  dialogue: `${P}/models/seed-audio-1-0/b_dialogue_trim_norm.mp3`,
  music: `${P}/models/seed-audio-1-0/c_music_norm.mp3`,
  sfx: `${P}/models/seed-audio-1-0/d_sfx_norm.mp3`,
};

/** 取某页某个样例位的音频:本页 → 工具页借的模型 → 占位 */
export function srcOf(page: string, slot: string, kind: AudioKind | "dialogue"): Filled & { placeholder: boolean } {
  const own = FILLED[page]?.[slot] ?? (TOOL_SOURCE[page] ? FILLED[TOOL_SOURCE[page]]?.[slot] : undefined);
  if (own) return { ...own, placeholder: false };
  return { src: PLACEHOLDER[kind], placeholder: true };
}
