// 模型页 Hero 副标题(H1 只放模型名，副标题承担关键词)。2026-11-19。
// 规则：第一句是实体定义(模型名 + 厂商 + 「AI video / image / voice / music generator」);第二句写在 BuzzVideo 上能做什么 + 已核实的能力。
// 只用 models-catalog / model-facts 里的事实;不写价格、积分、套餐;v1.13 上新的写「Coming soon on BuzzVideo」。

export const HERO_LEADS: Record<string, string> = {
  /* ── 视频 ── */
  "seedance-2-5":
    "Seedance 2.5 is ByteDance's flagship AI video generator for long, premium ads, turning text, images, video and audio references into clips of up to 30 seconds. On BuzzVideo, use up to 30 reference images to keep products and characters consistent, and create product videos, UGC ads and social clips at up to 1080p with native audio.",
  "kling-4-0":
    "Kling 4.0 is Kuaishou's AI video generator for continuous videos with sound, making single clips of up to 30 seconds from text, images and video references. On BuzzVideo, create UGC testimonials, product demos and social ads at up to 1080p, with dialogue, ambience and effects generated together with the picture.",
  "wan-3-0":
    "Wan 3.0 is Alibaba's AI video generator for long single takes, producing clips of up to 30 seconds with audio from text, image, video and audio references. On BuzzVideo, turn product pages and documents into demo videos, explainers and UGC-style ads at up to 1080p, with native sound you can keep or switch off.",
  "minimax-h3":
    "MiniMax H3 is MiniMax's AI video generator with native audio and lip sync, built to keep characters consistent from shot to shot. On BuzzVideo, create talking-head ads, spokesperson videos and product stories of 5 to 15 seconds at up to 4K, guided by up to 9 reference images, 3 videos and 3 audio clips.",
  "gemini-omni-1-2-flash":
    "Gemini Omni 1.2 Flash is Google's fast AI video generator, known for clear, readable on-screen text. Coming soon on BuzzVideo, it will turn a prompt, up to 6 reference images and short reference clips into 3 to 15 second vertical or widescreen videos with native audio, and edit or extend clips up to 15 seconds.",
  "seedance-2-0":
    "Seedance 2.0 is ByteDance's AI video generator for cinematic hero ads, with multi-reference control over products, characters and style. On BuzzVideo, combine up to 9 reference images, 3 videos and 3 audio clips to create brand films, product launches and social ads of 4 to 15 seconds at up to 4K.",
  "seedance-2-5-flash":
    "Seedance 2.5 Flash is ByteDance's faster version of Seedance 2.5, an AI video generator built for high-volume ad production. On BuzzVideo, create clips of up to 30 seconds at up to 720p from text and up to 10 reference images, 5 videos and 5 audio clips, so you can test many hooks and UGC ad variations.",
  "seedance-2-0-fast":
    "Seedance 2.0 Fast is ByteDance's quick AI video generator for product and scenery clips, built on Seedance 2.0. On BuzzVideo, turn text and up to 9 reference images, 3 videos and 3 audio clips into 4 to 15 second product showcases, travel scenes and social ads at up to 720p, with optional native audio.",
  "seedance-2-0-mini":
    "Seedance 2.0 Mini is ByteDance's compact AI video generator for affordable short clips. On BuzzVideo, make 4 to 15 second social videos, ad tests and product teasers at up to 720p from text and up to 9 reference images, in six aspect ratios, with native audio you can keep or turn off.",
  "kling-3-0":
    "Kling 3.0 is Kuaishou's AI video generator for multi-shot story ads with dialogue. On BuzzVideo, turn a script and up to 2 reference images into 3 to 15 second scenes at up to 4K, and create narrative ads, short dramas and social videos in 16:9, 9:16 or 1:1 with optional native audio.",
  "minimax-h3-max":
    "MiniMax H3 Max is MiniMax's AI video generator for fast drafts with first- and last-frame control. On BuzzVideo, set the opening and closing shots, add up to 9 reference images, and create 5 to 15 second product videos, transitions and social ads at up to 1080p with native audio.",
  "wan-3-0-prime":
    "Wan 3.0 Prime is Alibaba's AI video generator for clips of up to 30 seconds guided by image, video and audio references. On BuzzVideo, combine up to 10 images, 5 videos and 5 audio clips to create product demos, UGC ads and explainer videos at up to 1080p, with native audio you can keep or switch off.",
  "kling-3-0-omni":
    "Kling 3.0 Omni is Kuaishou's reference-driven AI video generator, turning text and up to 7 reference images into clips and editing existing videos at up to 4K. Coming soon on BuzzVideo, it will let you create 3 to 15 second product videos, brand ads and video edits that keep products and characters consistent.",
  "vidu-q3-pro":
    "Vidu Q3 Pro is ShengShu's AI video generator that turns text, an image or reference images into clips of up to 16 seconds. Coming soon on BuzzVideo, it will let you create product videos, social ads and short story clips at up to 1080p in five aspect ratios, with native audio you can switch off.",
  "grok-imagine-video-1-5":
    "Grok Imagine Video 1.5 is xAI's AI video generator that turns text, an image or up to 7 reference images into clips of up to 15 seconds. Coming soon on BuzzVideo, it will let you animate product photos between a start and end frame, pin up to 4 keyframes in time, and create social videos at up to 1080p in nine aspect ratios, with native audio you can switch off.",
  "flux-3-max-video":
    "FLUX 3 Max Video is Black Forest Labs' AI video generator that turns text, a first frame or a set of keyframes into clips of up to 20 seconds. Coming soon on BuzzVideo, it will let you control how product videos and ads start, move and end, at up to 1080p with optional native audio.",

  /* ── 图片 ── */
  "nano-banana-2-1":
    "Nano Banana 2.1 is Google's AI image generator, a fast all-rounder with sharp text rendering and consistent characters. On BuzzVideo, create and edit product shots, ad creatives and social posts from text and up to 14 reference images, at up to 4K and in 14 aspect ratios from tall stories to wide banners.",
  "gpt-image-2-5-sunburst":
    "GPT Image 2.5 Sunburst is OpenAI's AI image generator for fine print, product labels and detailed portraits. On BuzzVideo, create and edit packaging shots, ad creatives and model portraits from text and up to 16 reference images, with five quality levels from Low to Max for drafts and final assets.",
  "nano-banana-pro":
    "Nano Banana Pro is Google's highest-fidelity AI image generator, built for hero visuals and text-heavy layouts. On BuzzVideo, create and edit key visuals, posters, ad creatives and product shots from text and up to 14 reference images, at up to 4K and in ten aspect ratios.",
  "seedream-5-5":
    "Seedream 5.5 is ByteDance's AI image generator for images up to 2K, including transparent backgrounds. On BuzzVideo, create product cutouts, marketplace listings, layered ad assets and social graphics from text and up to 10 reference images, in nine aspect ratios from 9:16 stories to 21:9 banners.",
  "seedream-5-0-pro":
    "Seedream 5.0 Pro is ByteDance's premium AI image generator for detailed, type-rich catalog visuals. On BuzzVideo, create product catalogs, lookbooks, e-commerce images and ad creatives from text and up to 10 reference images, at up to 2K and in eight aspect ratios.",
  "gpt-image-2-5-flare":
    "GPT Image 2.5 Flare is OpenAI's fast AI image generator for photoreal product shots in bulk. On BuzzVideo, create and edit e-commerce photos, ad variations and social posts from text and up to 16 reference images, with five quality levels from Low to Max so you can draft fast and finish in detail.",
  "gpt-image-2":
    "GPT Image 2 is OpenAI's AI image generator known for accurate in-image text, made for ad creatives. On BuzzVideo, create banners, promo graphics, product shots and social posts with readable headlines and labels, using text and up to 10 reference images at Low, Medium or High quality.",
  "nano-banana-2":
    "Nano Banana 2 is Google's AI image generator that delivers Pro-level text rendering at Flash speed. On BuzzVideo, create and edit ad creatives, product shots and social graphics from text and up to 14 reference images, at up to 4K and in 14 aspect ratios, from tall stories to wide banners.",
  "nano-banana-2-lite":
    "Nano Banana 2 Lite is Google's AI image generator built for speed and low cost, ideal for previews and bulk runs. On BuzzVideo, create quick concepts, ad variations and product mockups from text and up to 14 reference images, in 14 aspect ratios, before you render the final version.",
  "seedream-5-0-lite":
    "Seedream 5.0 lite is ByteDance's budget AI image generator for infographics and trend visuals. On BuzzVideo, create explainer graphics, social posts and product images from text and up to 14 reference images, at up to 4K and in eight aspect ratios, for high-volume content and quick tests.",
  "seedream-4-5":
    "Seedream 4.5 is ByteDance's AI image generator for consistent product sets with accurate text. On BuzzVideo, create matching e-commerce images, catalog series and ad creatives from text and up to 14 reference images, at 2K or 4K in eight aspect ratios, so every image in a set stays on brand.",
  "grok-imagine-2-0":
    "Grok Imagine Image 2.0 is xAI's AI image generator for precise local edits and background removal. On BuzzVideo, clean up product photos, swap or remove backgrounds and create ad and social visuals from text and up to 10 reference images, at up to 2K in 13 aspect ratios.",
  "gpt-image-2-6-sunburst":
    "GPT Image 2.6 Sunburst is OpenAI's AI image generator for the finest detail on high-stakes visuals and multi-round edits. Coming soon on BuzzVideo, it will let you refine key visuals, packaging and ad creatives with mask or markup edits, up to 16 reference images, transparent backgrounds and SVG output.",
  "gpt-image-2-6-flare":
    "GPT Image 2.6 Flare is OpenAI's fast AI image generator for everyday images and complex layouts, the quicker of the two GPT Image 2.6 tiers. Coming soon on BuzzVideo, it will let you create social posts, ad creatives and product assets from up to 16 reference images, with transparent backgrounds and SVG output.",
  "flux-3-image":
    "FLUX 3 Image is Black Forest Labs' AI image generator, creating and editing images at up to 4K from text and up to 10 reference images. Coming soon on BuzzVideo, it will let you produce product shots, campaign visuals and social graphics in 14 aspect ratios, from 9:16 stories to 21:9 banners.",
  "muse-image":
    "Muse Image is Meta's AI image generator for low-cost image generation and editing from text and up to 10 reference images. Coming soon on BuzzVideo, it will let you create and tweak social posts, ad variations and product visuals in bulk, in nine aspect ratios from 9:21 to 21:9.",
  "mai-image-2-5":
    "MAI-Image-2.5 is Microsoft's AI image generator that creates images from text, guided by one reference image. Coming soon on BuzzVideo, it will let you turn a single product photo or style reference into ad creatives, social posts and campaign visuals in seven aspect ratios, from 9:16 to 16:9.",

  /* ── 音频 ── */
  "seed-audio-1-0":
    "Seed Audio 1.0 is ByteDance's all-in-one AI audio generator, creating voiceover, music and sound effects in one track, with voice cloning. On BuzzVideo, produce ad voiceovers, multi-speaker scenes and soundtracks in 21 languages, then download them as MP3 or WAV or drop them straight onto your video.",
  "elevenlabs-eleven-v4":
    "ElevenLabs v4 is ElevenLabs' AI voice generator for natural, expressive voiceover in many languages. Coming soon on BuzzVideo, it will let you voice ads, explainers and product videos with up to 5,000 characters per generation, plus character-level timestamps for captions that stay in sync.",
  "elevenlabs-eleven-v4-turbo":
    "ElevenLabs v4 Turbo is ElevenLabs' AI voice generator for high-volume voiceovers, a lower-cost version of Eleven v4. Coming soon on BuzzVideo, it will let you voice ad variations, explainers and social videos at scale, with audio tags for delivery and IPA pronunciation for brand names and tricky words.",
  "elevenlabs-eleven-v3":
    "ElevenLabs v3 is ElevenLabs' AI voice generator for natural speech in 70+ languages. Coming soon on BuzzVideo, it will let you localize ads, explainers and product videos for new markets, with word-level timestamps that make captions easy to sync with every line.",
  "minimax-speech-2-8-hd":
    "MiniMax Speech 2.8 HD is MiniMax's AI voice generator for expressive voiceover in 40+ languages. Coming soon on BuzzVideo, it will let you voice ads, explainers and social videos with 17 preset voices and fine control over emotion, speed, pitch and volume for every line.",
  "minimax-speech-2-6-hd":
    "MiniMax Speech 2.6 HD is MiniMax's AI voice generator for voiceover with precise pause control, including Cantonese. Coming soon on BuzzVideo, it will let you pace ad scripts and explainers with pause markers and a custom pronunciation dictionary, so brand and product names are read correctly.",
  "gemini-3-8-flash-tts":
    "Gemini 3.8 Flash TTS is Google's low-cost, multilingual AI text-to-speech model. Coming soon on BuzzVideo, it will let you turn ad scripts, product explainers and social video copy into voiceover in multiple languages, so you can produce narration for every market without booking a voice actor.",
  "kling-tts":
    "Kling TTS is Kuaishou's fast AI text-to-speech generator with 46 preset voices. Coming soon on BuzzVideo, it will let you turn short scripts of up to 500 characters into MP3 voiceovers for social videos, product clips and ad hooks, choosing the voice that fits each brand.",
  "minimax-voice-clone":
    "MiniMax Voice Clone is MiniMax's AI voice cloning model that recreates a voice from a short sample. Coming soon on BuzzVideo, it will let you clone a brand or creator voice, preview it before you use it, and read any new ad script, explainer or product video in that same voice.",
  "kling-create-voice":
    "Kling Voice Clone is Kuaishou's AI voice cloning tool for custom voices in Kling videos. Coming soon on BuzzVideo, it will let you build a voice from 5 to 30 seconds of clean speech and use it to give your Kling-generated ads, characters and product videos one consistent voice.",
  "elevenlabs-music-v2-5":
    "ElevenLabs Music v2.5 is ElevenLabs' AI music generator for songs and scores from 3 seconds to 10 minutes long. Coming soon on BuzzVideo, it will let you compose ad soundtracks, jingles and background scores, instrumental or with lyrics, shaping the track section by section to fit your video.",
  "lyria-3-5":
    "Lyria 3.5 is Google's AI music generator for full songs with vocals and lyrics, about 2 minutes each. Coming soon on BuzzVideo, it will let you create original songs, jingles and vocal soundtracks for ads, brand videos and social content, so every campaign can have its own theme.",
  "mureka-v9-5":
    "Mureka V9.5 is Kunlun Tech's AI music generator that writes songs from your lyrics or from a description. Coming soon on BuzzVideo, it will let you turn a slogan or brand story into an original song, jingle or ad soundtrack for social videos, launches and campaigns.",
  "minimax-music-3":
    "MiniMax Music 3 is MiniMax's AI music generator for background music. Coming soon on BuzzVideo, it will let you create background tracks for ads, product demos, explainers and social videos, matched to the mood and length of each cut, so every video gets an original soundtrack.",
  "elevenlabs-sound-effects-v3":
    "ElevenLabs Sound Effects v3 is ElevenLabs' AI sound effects generator for clips from 0.5 to 30 seconds, with optional seamless looping. Coming soon on BuzzVideo, it will let you add whooshes, hits, ambience and product sounds to ads, transitions and social videos, timed to every cut.",
  /* ── 2026-11-23 dev 后台补的 9 个 ── */
  "flux-3-video":
    "FLUX 3 Video is Black Forest Labs' AI video generator for clips of 5 to 20 seconds from text, a first and last frame or up to 10 keyframes. Coming soon on BuzzVideo, it will let you plan exactly how product videos and ads move, then edit or extend them, at up to 4K with optional native audio.",
  "heygen-video":
    "HeyGen Video is HeyGen's AI video generator that turns text plus image, video and audio references into clips of 5 to 15 seconds with sound. Coming soon on BuzzVideo, it will let you keep products and characters consistent across UGC-style ads and social clips at up to 2K, choosing Turbo, Quality or Ultra Quality.",
  "minimax-h3-max-turbo":
    "MiniMax H3 Max Turbo is MiniMax's fast AI video generator for clips of 1 to 15 seconds from text, references or a first and last frame. Coming soon on BuzzVideo, it will let you draft ad variations quickly at up to 2K, extend a clip that works and add an optional background music track.",
  "qwen-image-3-0":
    "Qwen Image 3.0 is Alibaba's AI image generator for text-to-image and edits guided by up to 3 reference images. Coming soon on BuzzVideo, it will let you create product shots, social posts and banners at 1K or 2K in ratios from 1:1 to 21:9, with long, detailed prompts.",
  "qwen-image-3-0-pro":
    "Qwen Image 3.0 Pro is the higher-quality tier of Alibaba's Qwen Image 3.0 AI image generator, guided by up to 3 reference images. Coming soon on BuzzVideo, it will let you make hero visuals, key art and ad images at 1K or 2K in ratios from 1:1 to 21:9.",
  "wan-2-7-image":
    "Wan 2.7 Image is Alibaba's AI image generator that uses up to 9 reference images to keep products, people and styles consistent. Coming soon on BuzzVideo, it will let you create product sets, lifestyle scenes and social creatives at 1K or 2K in ratios from 1:1 to 21:9.",
  "wan-2-7-image-pro":
    "Wan 2.7 Image Pro is the top tier of Alibaba's Wan 2.7 AI image generator, with up to 9 reference images and output up to 4K. Coming soon on BuzzVideo, it will let you produce print-ready key visuals, catalog images and large-format ads in ratios from 1:1 to 21:9.",
  "heygen-voice":
    "HeyGen Voice is HeyGen's AI voice generator with 24 preset voices in 39 languages. Coming soon on BuzzVideo, it will let you turn scripts into voiceovers for ads, explainers and product videos, adjust how expressive the delivery sounds and guide it with a reference recording.",
  "voice-replication-2-0":
    "Voice Replication 2.0 is ByteDance's AI voice cloning model that recreates a voice from a reference recording. Coming soon on BuzzVideo, it will let you clone a brand or presenter voice in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more, and reuse it across voiceovers.",
  /* ── 2026-11-24 补回的 3 个(dev 后台启用)── */
  "gemini-omni-flash":
    "Gemini Omni Flash is Google's fast AI video generator, making clips of 4 to 10 seconds with native audio from text and up to 5 reference images. On BuzzVideo, use it for quick social clips, product teasers and ad drafts at 720p in 9:16 or 16:9, with sound generated together with the picture.",
  "seedance-1-5-pro":
    "Seedance 1.5 Pro is ByteDance's AI video generator that turns text or up to 2 reference images into clips with sound. On BuzzVideo, use it for product clips, scenery shots and social videos at up to 1080p in six aspect ratios, with audio you can keep or switch off.",
  "nano-banana":
    "Nano Banana is Google's original AI image generator and editor, guided by text and up to 3 reference images. On BuzzVideo, use it for quick product edits, simple restyles and social images in ten aspect ratios from 1:1 to 21:9.",
};
