/* 模型页的 GEO 补充(2026-11-25):按真实搜索词(Google 联想词 + Google Ads 美国搜索量，
   docs/research/keywords/2026-11-25-geo-briefs.json)给每个模型页补的 FAQ 和 meta。
   模型页其余内容由 model-content.ts 按事实生成;这里只放生成不出来、但用户真的在搜的问题。
   规则：答案只写 BuzzVideo 上确实成立的事实;不知道的不写。

   注意:
   - 每页 FAQ 总数上限 12(2026-11-26 SEO/GEO 审核，原来是 14)。这里手写的问题优先保留;超出时 model-content.ts 的 withGeoFaq
     会先删生成的低优先级问题(prompt 写法 → 第二个 vs → 参考图数量)。所以这里每页别超过 4–5 条。
   - 描述里只有页面真的有价格表(pricing-live.json 里有这个模型)才写「prices」。
   - 参数都来自 model-facts.ts / models-catalog.ts,那边改了这里要跟着改。
   - 答案里不写具体积分价格(调价会过期),价格统一指向「生成前会显示」。 */
export type ModelGeo = { metaTitle?: string; metaDescription?: string; faq?: { q: string; a: string }[] };
export const MODEL_GEO: Record<string, ModelGeo> = {
  /* ───────── 视频 ───────── */
  "kling-4-0": {
    faq: [
      {
        q: "Is Kling 4.0 out yet?",
        a: "Yes. Kling 4.0 is live on BuzzVideo now. Pick it in the video generator to make clips of 3 to 30 seconds at 720p or 1080p with native audio.",
      },
    ],
  },
  "seedance-2-0": {
    faq: [
      {
        q: "Seedance 2.0 vs Seedance 2.0 Fast vs Seedance 2.0 Mini: what's the difference?",
        a: "Seedance 2.0 renders at up to 4K, while Seedance 2.0 Fast and Seedance 2.0 Mini stop at 720p. All three make 4 to 15 second clips and take up to 9 reference images, 3 videos and 3 audio clips. Fast is about 20% cheaper than Seedance 2.0 for quick product and scenery clips, and Mini is the affordable pick for short social clips and tests.",
      },
    ],
  },
  "minimax-h3": {
    faq: [
      {
        q: "MiniMax H3 vs MiniMax H3 Max: what's the difference?",
        a: "MiniMax H3 renders at 768p, 2K or 4K and is built for native audio, lip sync and consistent characters. MiniMax H3 Max renders at 480p, 768p or 1080p and is the pick for fast drafts with first- and last-frame control. Both make 5 to 15 second clips with sound and take up to 9 reference images, 3 videos and 3 audio clips.",
      },
      {
        q: "What is MiniMax?",
        a: "MiniMax is the AI lab that develops MiniMax H3. On BuzzVideo its models also include the MiniMax H3 Max video model, the MiniMax Speech 2.8 HD and 2.6 HD voice models and MiniMax Music 3.",
      },
    ],
  },
  "gemini-omni-flash": {
    faq: [
      {
        q: "What is Gemini Omni?",
        a: "Gemini Omni is Google's multimodal AI video model line. On BuzzVideo it is available as Gemini Omni Flash, which makes 4 to 10 second clips at 720p with native audio, and Gemini Omni 1.2 Flash, which you can pick in the video generator.",
      },
    ],
  },
  "kling-3-0": {
    faq: [
      {
        q: "Does Kling 3.0 have motion control?",
        a: "Yes, as a separate model. Kling 3.0 Motion Control on BuzzVideo copies the moves from a reference video onto your character. Pick it in the video generator when the motion matters more than the script.",
      },
      {
        q: "Kling 3.0 vs Kling 3.0 Omni: what's the difference?",
        a: "Kling 3.0 is built for multi-shot story ads with dialogue, while Kling 3.0 Omni is the reference-driven version that also edits existing videos. Both make 3 to 15 second clips at up to 4K in 16:9, 9:16 or 1:1. Kling 3.0 takes up to 2 reference images and Kling 3.0 Omni takes up to 7.",
      },
    ],
  },
  "minimax-h3-max": {
    faq: [
      {
        q: "MiniMax H3 Max vs MiniMax H3: what's the difference?",
        a: "MiniMax H3 Max is the pick for fast drafts with first- and last-frame control, at 480p, 768p or 1080p. MiniMax H3 renders at 768p, 2K or 4K and is built for native audio, lip sync and consistent characters. Both make 5 to 15 second clips with sound and take up to 9 reference images, 3 videos and 3 audio clips.",
      },
    ],
  },
  "wan-3-0-prime": {
    faq: [
      {
        q: "Does Wan 3.0 Prime generate audio?",
        a: "Yes. Wan 3.0 Prime makes clips with native audio, and you can turn the sound off if you plan to add your own voiceover or music. It also takes up to 5 audio clips as references, next to 10 images and 5 videos.",
      },
    ],
  },
  "grok-imagine-video-1-5": {
    faq: [
      {
        q: "Can Grok Imagine Video 1.5 turn an image into a video?",
        a: "Yes. Grok Imagine Video 1.5 does image to video: set a start frame, an optional end frame and up to 4 timed keyframes. It also takes up to 7 reference images and makes clips from 1 to 15 seconds at up to 1080p.",
      },
      {
        q: "Does Grok Imagine Video 1.5 have sound?",
        a: "Yes. Grok Imagine Video 1.5 generates native audio with the clip. You can turn the sound off before you create if you want to add your own voiceover or music.",
      },
      {
        q: "Who made Grok Imagine Video 1.5?",
        a: "Grok Imagine Video 1.5 is an AI video model from xAI. On BuzzVideo you pick it in the video generator, next to video models from ByteDance, Kuaishou, Google and others, on the same credits.",
      },
    ],
  },
  "flux-3-max-video": {
    metaDescription: "FLUX 3 Max Video by Black Forest Labs turns text, images and keyframes into video up to 20s at 1080p. Use it online on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "Can FLUX 3 Max Video do image to video?",
        a: "Yes. FLUX 3 Max Video does text to video, image to video with a first frame and an optional last frame, and keyframes to video. Clips run 5 to 20 seconds at 720p or 1080p.",
      },
      {
        q: "Does FLUX 3 Max Video have audio?",
        a: "Yes. FLUX 3 Max Video generates native audio with the clip, and you can turn it off before you create. Switch it off when you plan to lay your own voiceover and music.",
      },
      {
        q: "Who made FLUX 3 Max Video?",
        a: "FLUX 3 Max Video is an AI video model from Black Forest Labs. BuzzVideo also has FLUX 3 Video and FLUX 3 Image from the same developer, all on one credit balance.",
      },
    ],
  },
  "flux-3-video": {
    faq: [
      {
        q: "What is FLUX 3?",
        a: "FLUX 3 is a family of AI models from Black Forest Labs. On BuzzVideo it includes FLUX 3 Video and FLUX 3 Max Video for video, and FLUX 3 Image for images. FLUX 3 Video makes 5 to 20 second clips at up to 4K.",
      },
      {
        q: "Does FLUX 3 Video support 4K?",
        a: "Yes. FLUX 3 Video outputs at 720p, 1080p, 1440p and 2160p (4K). Clips run 5 to 20 seconds in aspect ratios from 21:9 to 9:16.",
      },
      {
        q: "Can FLUX 3 Video edit or extend a video?",
        a: "Yes. Besides text to video, FLUX 3 Video has first and last frame control, up to 10 keyframes, and edit and extend modes for existing clips. It takes up to 10 reference images.",
      },
      {
        q: "FLUX 3 Video vs MiniMax H3: what's the difference?",
        a: "FLUX 3 Video makes longer clips, 5 to 20 seconds against 5 to 15 seconds for MiniMax H3, and both go up to 4K. FLUX 3 Video takes up to 10 reference images and lets you turn the sound off. MiniMax H3 takes 9 images, 3 videos and 3 audio clips, and its native audio is always on.",
      },
    ],
  },
  "heygen-video": {
    metaDescription: "HeyGen Video makes omni-reference clips up to 15s with native sound, at up to 2K. Use it on BuzzVideo with other AI video models. Specs, prompts and FAQ.",
    faq: [
      {
        q: "Does HeyGen Video have audio?",
        a: "Yes. HeyGen Video clips come with native sound, and the audio is always on. You can also add up to 3 audio clips as references.",
      },
      {
        q: "Can HeyGen Video use first and last frames?",
        a: "Yes. HeyGen Video has a first-and-last-frame mode and an omni reference mode. Omni reference takes up to 9 images, 3 videos and 3 audio clips in one prompt.",
      },
      {
        q: "Who made HeyGen Video?",
        a: "HeyGen Video is an AI video model from HeyGen. On BuzzVideo it makes 5 to 15 second clips at 480p to 2K, with Turbo, Quality and Ultra Quality settings.",
      },
    ],
  },

  /* ───────── 图片 ───────── */
  "nano-banana-2-1": {
    faq: [
      {
        q: "Who made Nano Banana 2.1?",
        a: "Nano Banana 2.1 is an AI image model from Google. On BuzzVideo it sits next to Google's Nano Banana Pro, Nano Banana 2 and the original Nano Banana, so you can run one prompt on each and compare.",
      },
    ],
  },
  "gpt-image-2-5-sunburst": {
    faq: [
      {
        q: "Does GPT Image 2.5 Sunburst support transparent backgrounds?",
        a: "Yes. GPT Image 2.5 Sunburst can output a PNG with a real transparent background (an alpha channel), so there is no separate background-removal step and no white halo around the edges. That suits logos, labels and product cutouts that you place on banners, slides and ads.",
      },
      {
        q: "GPT Image 2.5 Sunburst vs Nano Banana 2: what's the difference?",
        a: "GPT Image 2.5 Sunburst is built for fine print, labels and detailed portraits, and Nano Banana 2 for accurate text at high speed. Sunburst has five quality levels from Low to Max and takes up to 16 reference images. Nano Banana 2 outputs at 1K, 2K or 4K, takes up to 14 reference images and has more aspect ratios, including 21:9.",
      },
    ],
  },
  "gpt-image-2-5-flare": {
    faq: [
      {
        q: "Does GPT Image 2.5 Flare support transparent backgrounds?",
        a: "Yes. GPT Image 2.5 Flare can output a PNG with a real transparent background (an alpha channel), so there is no separate background-removal step and no white halo around the edges. That suits product cutouts in bulk that you place on banners, slides and ads.",
      },
      {
        q: "GPT Image 2.5 Flare vs Nano Banana 2: what's the difference?",
        a: "GPT Image 2.5 Flare is built for fast photoreal product shots in bulk, and Nano Banana 2 for accurate text at high speed. Flare has five quality levels from Low to Max and takes up to 16 reference images. Nano Banana 2 outputs at 1K, 2K or 4K, takes up to 14 reference images and has more aspect ratios, including 21:9.",
      },
    ],
  },
  "nano-banana-pro": {
    faq: [
      {
        q: "Can I use Nano Banana Pro without logging in?",
        a: "No. You need a BuzzVideo account to generate with Nano Banana Pro, and signing up is free. Nano Banana Pro itself runs on the Starter, Pro and Ultra plans.",
      },
      {
        q: "Can Nano Banana Pro make transparent backgrounds?",
        a: "Not directly. Nano Banana Pro returns images on a solid background. For a transparent PNG on BuzzVideo, use Seedream 5.5 or GPT Image 2.5 or 2.6 (Flare or Sunburst), which output images with a real alpha channel, or put the subject on pure white with Nano Banana Pro.",
      },
      {
        q: "Nano Banana Pro vs Nano Banana: what's the difference?",
        a: "Nano Banana Pro is the highest-fidelity model in the family, built for hero visuals and text-heavy layouts. It outputs at 1K, 2K or 4K and takes up to 14 reference images. The original Nano Banana takes up to 3 reference images and has no resolution setting.",
      },
    ],
  },
  "seedream-5-5": {
    faq: [
      {
        q: "Seedream 5.5 vs Nano Banana Pro: which is better?",
        a: "It depends on the job. Seedream 5.5 outputs at 1K, 1.5K or 2K, makes transparent backgrounds and takes up to 10 reference images. Nano Banana Pro goes up to 4K, takes up to 14 reference images and is built for hero visuals and text-heavy layouts.",
      },
      {
        q: "Can Seedream 5.5 make transparent backgrounds?",
        a: "Yes. Seedream 5.5 outputs PNGs with a real alpha channel, including semi-transparent areas such as glass, smoke and fine hair, at up to 2K. There is no cutout step, so edges stay clean for marketplace listings and layered ad designs.",
      },
      {
        q: "Seedream 5.5 vs Seedream 4.5: what's the difference?",
        a: "Seedream 5.5 adds transparent backgrounds and outputs at 1K, 1.5K or 2K with up to 10 reference images. Seedream 4.5 outputs at 2K or 4K, takes up to 14 reference images and works on the Free plan. Seedream 5.5 needs a Starter, Pro or Ultra plan.",
      },
    ],
  },
  "gpt-image-2": {
    faq: [
      {
        q: "Can I use GPT Image 2 without signing up?",
        a: "No. You need a BuzzVideo account to generate with GPT Image 2, and signing up is free. GPT Image 2 itself runs on the Starter, Pro and Ultra plans.",
      },
    ],
  },
  "nano-banana-2": {
    faq: [
      {
        q: "Can I use Nano Banana 2 without signing up?",
        a: "No. You need a BuzzVideo account to generate with Nano Banana 2, and signing up is free. Nano Banana 2 itself runs on the Starter, Pro and Ultra plans.",
      },
      {
        q: "Can Nano Banana 2 make transparent backgrounds?",
        a: "Not directly. Nano Banana 2 returns images on a solid background. For a transparent PNG on BuzzVideo, use Seedream 5.5 or GPT Image 2.5 or 2.6 (Flare or Sunburst), which output images with a real alpha channel, or put the subject on pure white with Nano Banana 2.",
      },
      {
        q: "Nano Banana 2 vs Nano Banana 2 Lite: what's the difference?",
        a: "Nano Banana 2 Lite is the fastest, cheapest version, meant for previews and bulk runs. Nano Banana 2 gives you 1K, 2K and 4K output for the final image. Both take up to 14 reference images and cover the same 14 aspect ratios.",
      },
    ],
  },
  "nano-banana": {
    metaDescription: "Nano Banana by Google is the original Nano Banana AI image generator. Use it online on BuzzVideo with up to 3 reference images. Specs, prices, prompts and FAQ.",
    faq: [
      {
        q: "Can Nano Banana make transparent backgrounds?",
        a: "Not directly. Nano Banana returns images on a solid background. For a transparent PNG on BuzzVideo, use Seedream 5.5 or GPT Image 2.5 or 2.6 (Flare or Sunburst), which output images with a real alpha channel, or put the subject on pure white with Nano Banana.",
      },
      {
        q: "Can I use Nano Banana without signing up?",
        a: "No. You need a BuzzVideo account to generate with Nano Banana, and signing up is free. Nano Banana itself runs on the Starter, Pro and Ultra plans, which export without a watermark.",
      },
      {
        q: "Can Nano Banana make videos?",
        a: "No. Nano Banana is an image model, so it creates and edits still images. On BuzzVideo you can use a Nano Banana image as the reference for a video model such as Seedance 2.5 or Kling 4.0 to turn it into a clip.",
      },
      {
        q: "Do I need an app to use Nano Banana?",
        a: "No. On BuzzVideo, Nano Banana runs in your web browser, so there is nothing to install. Sign in, open the image generator and pick Nano Banana. It is available on the Starter, Pro and Ultra plans.",
      },
    ],
  },
  "seedream-4-5": {
    metaDescription: "Seedream 4.5 by ByteDance makes consistent product sets with accurate text, up to 4K. Works with free sign-up credits on BuzzVideo. Specs, prices and FAQ.",
    faq: [
      {
        q: "Does Seedream 4.5 support image to image?",
        a: "Yes. Seedream 4.5 creates and edits images from text plus up to 14 reference images. Add your product photo as a reference and describe the change, and the product stays the same across the set.",
      },
    ],
  },
  "grok-imagine-2-0": {
    faq: [
      {
        q: "Can Grok Imagine Image 2.0 turn an image into a video?",
        a: "Not by itself: Grok Imagine Image 2.0 is an image model. For image to video on BuzzVideo, use Grok Imagine Video 1.5, which takes your image as the start frame and makes clips up to 15 seconds.",
      },
      {
        q: "Does Grok Imagine Image 2.0 support image to image?",
        a: "Yes. Grok Imagine Image 2.0 edits images you upload, with precise local edits and background removal. It takes up to 10 reference images and outputs at 1K or 2K.",
      },
    ],
  },
  "gpt-image-2-6-sunburst": {
    faq: [
      {
        q: "GPT Image 2.6 Sunburst vs GPT Image 2.6 Flare: what's the difference?",
        a: "Sunburst is the detail tier, for high-stakes visuals and multi-round edits. Flare is the faster of the two GPT Image 2.6 tiers, for everyday images and complex layouts. Both have five quality levels from Low to Max, take up to 16 reference images and make transparent backgrounds.",
      },
      {
        q: "Does GPT Image 2.6 Sunburst support transparent backgrounds?",
        a: "Yes. GPT Image 2.6 Sunburst generates images with transparent backgrounds and can also output SVG. That suits logos, product cutouts and layered ad designs.",
      },
      {
        q: "Can GPT Image 2.6 Sunburst edit part of an image?",
        a: "Yes. You can edit with a mask or with markup drawn on the image, so only the area you mark changes. It is built for multi-round edits and takes up to 16 reference images.",
      },
    ],
  },
  "gpt-image-2-6-flare": {
    faq: [
      {
        q: "GPT Image 2.6 Flare vs GPT Image 2.6 Sunburst: what's the difference?",
        a: "Flare is the faster of the two GPT Image 2.6 tiers, for everyday images and complex layouts. Sunburst is the detail tier, for high-stakes visuals and multi-round edits. Both have five quality levels from Low to Max, take up to 16 reference images and make transparent backgrounds.",
      },
      {
        q: "Does GPT Image 2.6 Flare support transparent backgrounds?",
        a: "Yes. GPT Image 2.6 Flare generates images with transparent backgrounds and can also output SVG. That suits product cutouts and layered ad designs.",
      },
      {
        q: "GPT Image 2.6 Flare vs GPT Image 2.5 Flare: what's the difference?",
        a: "GPT Image 2.6 Flare adds SVG output and an Auto aspect ratio. Both versions make transparent backgrounds, have five quality levels from Low to Max and take up to 16 reference images. GPT Image 2.5 Flare keeps a 4:5 ratio that 2.6 Flare does not list.",
      },
    ],
  },
  "flux-3-image": {
    metaDescription: "FLUX 3 Image by Black Forest Labs is an AI image generator with up to 4K output and 10 reference images. Use it on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "What is FLUX 3?",
        a: "FLUX 3 is a family of AI models from Black Forest Labs. On BuzzVideo it includes FLUX 3 Image for images, and FLUX 3 Video and FLUX 3 Max Video for video. FLUX 3 Image creates and edits images at up to 4K.",
      },
      {
        q: "Does FLUX 3 Image support 4K?",
        a: "Yes. FLUX 3 Image outputs at 768, 1K, 2K and 4K. It covers aspect ratios from 21:9 to 1:2, so one prompt can fill banners, feed posts and stories.",
      },
      {
        q: "FLUX 3 Image vs Qwen Image 3.0: what's the difference?",
        a: "FLUX 3 Image goes up to 4K and takes up to 10 reference images. Qwen Image 3.0 outputs at 1K or 2K and takes up to 3 reference images. Both generate from text and edit existing images.",
      },
      {
        q: "Who made FLUX 3 Image?",
        a: "FLUX 3 Image is an AI image model from Black Forest Labs. On BuzzVideo you pick it in the image generator, on the same credits as every other model.",
      },
    ],
  },
  "muse-image": {
    faq: [
      {
        q: "Who made Muse Image?",
        a: "Muse Image is an AI image model from Meta. On BuzzVideo you pick it in the image generator, next to image models from Google, OpenAI, ByteDance and others.",
      },
      {
        q: "Can Muse Image edit existing images?",
        a: "Yes. Muse Image both generates and edits images, and an edit costs the same as a new generation. It takes up to 10 reference images.",
      },
    ],
  },
  "mai-image-2-5": {
    metaDescription: "MAI-Image-2.5 (MAI Image 2.5) is Microsoft's AI image generator, guided by text and one reference image. Use it online on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "Who made MAI-Image-2.5?",
        a: "MAI-Image-2.5 is an AI image model from Microsoft. On BuzzVideo you pick it in the image generator, on the same credits as every other model.",
      },
      {
        q: "Can MAI-Image-2.5 use a reference image?",
        a: "Yes. MAI-Image-2.5 takes one reference image alongside your prompt. Use it to keep a product, character or style close to the original.",
      },
      {
        q: "What aspect ratios does MAI-Image-2.5 support?",
        a: "MAI-Image-2.5 supports 1:1, 4:3, 3:4, 16:9, 9:16, 3:2 and 2:3, plus an Auto setting. That covers feed posts, stories and wide banners.",
      },
    ],
  },
  "qwen-image-3-0": {
    metaDescription: "Qwen Image 3.0 by Alibaba generates and edits images at 1K or 2K with up to 3 reference images. Use Qwen Image on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "What is Qwen Image?",
        a: "Qwen Image is Alibaba's AI image model line. On BuzzVideo it is available as Qwen Image 3.0, for text to image and edits at 1K or 2K, and Qwen Image 3.0 Pro, the higher-quality version for hero visuals.",
      },
      {
        q: "Can Qwen Image 3.0 edit images (image to image)?",
        a: "Yes. Qwen Image 3.0 does text to image and image edits. Upload up to 3 reference images, describe the change and output at 1K or 2K.",
      },
      {
        q: "Can Qwen Image 3.0 turn an image into a video?",
        a: "Not by itself: Qwen Image 3.0 is an image model. For image to video on BuzzVideo, use a video model such as Wan 3.0 or Kling 4.0 and add your Qwen image as a reference.",
      },
      {
        q: "How long can a Qwen Image 3.0 prompt be?",
        a: "A Qwen Image 3.0 prompt can be up to 4,500 characters. That leaves room for a full layout description with on-image text.",
      },
      {
        q: "Qwen Image 3.0 vs FLUX 3 Image: what's the difference?",
        a: "Qwen Image 3.0 outputs at 1K or 2K and takes up to 3 reference images. FLUX 3 Image goes up to 4K and takes up to 10 reference images. Both generate from text and edit existing images.",
      },
    ],
  },

  /* ───────── 音频 ───────── */
  "seed-audio-1-0": {
    metaDescription: "Seed Audio 1.0 by ByteDance makes voiceover, music and sound effects in one track, with voice cloning. Works with free sign-up credits on BuzzVideo.",
    faq: [
      {
        q: "Can Seed Audio 1.0 clone a voice?",
        a: "Yes. Seed Audio 1.0 includes voice cloning: add a recording of the voice as a reference and it reads your script in that voice. It takes up to 3 audio clips as references.",
      },
      {
        q: "Can Seed Audio 1.0 make music and sound effects?",
        a: "Yes. Seed Audio 1.0 generates voiceover, music and sound effects in one track. You describe the scene once instead of making each layer in a separate tool.",
      },
      {
        q: "What languages does Seed Audio 1.0 support?",
        a: "Seed Audio 1.0 supports 21 languages, including scenes with more than one speaker. That covers dialogue ads and podcast-style clips as well as single-voice narration.",
      },
      {
        q: "What file formats does Seed Audio 1.0 export?",
        a: "Seed Audio 1.0 exports MP3 or WAV. Download the file or drop it straight onto a video in BuzzVideo.",
      },
    ],
  },
  "elevenlabs-eleven-v3": {
    metaDescription: "ElevenLabs v3 text to speech makes natural voiceover in 70+ languages with word-level timestamps for captions. Use it on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "Is ElevenLabs v3 a text to speech model?",
        a: "Yes. ElevenLabs v3 is an AI voice model that turns a script into natural speech. On BuzzVideo you paste the script, then pick a voice, language and speed.",
      },
      {
        q: "How many languages does ElevenLabs v3 support?",
        a: "ElevenLabs v3 speaks 70+ languages. You can voice the same ad script for several markets on one BuzzVideo account.",
      },
      {
        q: "Does ElevenLabs v3 give timestamps for captions?",
        a: "Yes. ElevenLabs v3 returns word-level timestamps with the audio. That lets captions follow the voiceover word by word.",
      },
    ],
  },
  "minimax-speech-2-8-hd": {
    metaDescription: "MiniMax Speech 2.8 HD makes expressive AI voiceover in 40+ languages with 17 preset voices and emotion, speed and pitch controls. Use it on BuzzVideo.",
    faq: [
      {
        q: "How many voices does MiniMax Speech 2.8 HD have?",
        a: "MiniMax Speech 2.8 HD has 17 preset voices. You pick one, then set the language and delivery for your script.",
      },
      {
        q: "What languages does MiniMax Speech 2.8 HD support?",
        a: "MiniMax Speech 2.8 HD has language boosts for 40+ languages. Choose the language of your script so pronunciation matches the market you are targeting.",
      },
      {
        q: "Can I control emotion and speed in MiniMax Speech 2.8 HD?",
        a: "Yes. MiniMax Speech 2.8 HD has controls for emotion, speed, pitch and volume. Set them per generation to match the tone of the ad.",
      },
    ],
  },
  "minimax-speech-2-6-hd": {
    metaDescription: "MiniMax Speech 2.6 HD makes AI voiceover with pause markers, a custom pronunciation dictionary and Cantonese. Use it on BuzzVideo. Specs and FAQ.",
    faq: [
      {
        q: "Does MiniMax Speech 2.6 HD support Cantonese?",
        a: "Yes. MiniMax Speech 2.6 HD includes Cantonese. Paste the script, choose the language and generate the voiceover.",
      },
      {
        q: "Can I add pauses in MiniMax Speech 2.6 HD?",
        a: "Yes. MiniMax Speech 2.6 HD reads pause markers in the script, so you decide where the voice stops and for how long.",
      },
      {
        q: "Can I fix how MiniMax Speech 2.6 HD pronounces a brand name?",
        a: "Yes. MiniMax Speech 2.6 HD has a custom pronunciation dictionary. Add the brand or product name once and it is read your way in the voiceover.",
      },
    ],
  },
  "gemini-3-8-flash-tts": {
    metaDescription: "Gemini 3.8 Flash TTS is Google's low-cost multilingual text to speech model. Use Gemini TTS for ad voiceover on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "Who made Gemini 3.8 Flash TTS?",
        a: "Gemini 3.8 Flash TTS is a multilingual text to speech model from Google. On BuzzVideo you pick it in the audio generator and paste your script.",
      },
      {
        q: "How much does Gemini 3.8 Flash TTS cost?",
        a: "On BuzzVideo, Gemini 3.8 Flash TTS is paid for with credits, and the exact price shows in the generator before you press Create. It is available on the Starter, Pro and Ultra plans.",
      },
      {
        q: "Gemini 3.8 Flash TTS vs MiniMax Speech 2.8 HD: what's the difference?",
        a: "Gemini 3.8 Flash TTS is the low-cost multilingual option from Google. MiniMax Speech 2.8 HD is built for expressive voiceover, with 17 preset voices, 40+ language boosts and controls for emotion, speed, pitch and volume. Both run on the same BuzzVideo credits.",
      },
    ],
  },
  "elevenlabs-music-v2-5": {
    faq: [
      {
        q: "How long can an ElevenLabs Music v2.5 track be?",
        a: "ElevenLabs Music v2.5 makes tracks from 3 seconds to 10 minutes. That covers a short ad sting as well as a full song or score.",
      },
      {
        q: "Can ElevenLabs Music v2.5 make songs with lyrics?",
        a: "Yes. ElevenLabs Music v2.5 makes instrumental tracks or songs with lyrics, and you can direct it section by section. Describe the mood and genre, or paste your own lyrics.",
      },
      {
        q: "ElevenLabs Music v2.5 vs Mureka V9.5: what's the difference?",
        a: "ElevenLabs Music v2.5 makes songs and scores from 3 seconds to 10 minutes, instrumental or with lyrics. Mureka V9.5 makes songs from your lyrics or from a description. Both run on the same BuzzVideo credits, so you can try one brief on each.",
      },
    ],
  },
  "lyria-3-5": {
    faq: [
      {
        q: "What is Lyria?",
        a: "Lyria is Google's AI music model. On BuzzVideo it is available as Lyria 3.5, which makes full songs with vocals and lyrics.",
      },
      {
        q: "How long are Lyria 3.5 songs?",
        a: "Lyria 3.5 songs run about 2 minutes each. Each one is a full song with vocals and lyrics.",
      },
      {
        q: "Can Lyria 3.5 make songs with vocals?",
        a: "Yes. Lyria 3.5 generates full songs with sung vocals and lyrics. Describe the mood and genre, or paste your own lyrics.",
      },
      {
        q: "Lyria 3.5 vs Mureka V9.5: what's the difference?",
        a: "Lyria 3.5 is from Google and makes full songs with vocals and lyrics, about 2 minutes each. Mureka V9.5 is from Kunlun Tech and makes songs from your lyrics or from a description. Both run on the same BuzzVideo credits, so you can try one brief on each.",
      },
    ],
  },
  "mureka-v9-5": {
    metaTitle: "Mureka AI Music Generator (V9.5): Specs & FAQ | BuzzVideo",
    metaDescription: "Mureka V9.5 is an AI music generator from Kunlun Tech that makes songs from your lyrics or a description. Use Mureka AI on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "What is Mureka?",
        a: "Mureka is an AI music model from Kunlun Tech. On BuzzVideo it is available as Mureka V9.5, which makes songs from your lyrics or from a description.",
      },
      {
        q: "Can Mureka V9.5 make a song from my own lyrics?",
        a: "Yes. Paste your lyrics and Mureka V9.5 turns them into a song. If you have no lyrics, describe the song you want instead.",
      },
      {
        q: "Do I need the Mureka app to use Mureka V9.5?",
        a: "No. On BuzzVideo, Mureka V9.5 runs in your web browser, so there is nothing to install. Sign in, open the audio generator and pick Mureka V9.5.",
      },
      {
        q: "Mureka V9.5 vs Lyria 3.5: what's the difference?",
        a: "Mureka V9.5 is from Kunlun Tech and makes songs from your lyrics or from a description. Lyria 3.5 is from Google and makes full songs with vocals and lyrics, about 2 minutes each. Both run on the same BuzzVideo credits, so you can try one brief on each.",
      },
    ],
  },
  "minimax-music-3": {
    faq: [
      {
        q: "What is MiniMax?",
        a: "MiniMax is the developer of MiniMax Music 3. On BuzzVideo its models also include the MiniMax H3 and MiniMax H3 Max video models and the MiniMax Speech 2.8 HD and 2.6 HD voice models.",
      },
      {
        q: "How is MiniMax Music 3 priced?",
        a: "MiniMax Music 3 is priced by the second of music you generate. The exact credit price shows in the generator before you press Create.",
      },
      {
        q: "MiniMax Music 3 vs Lyria 3.5: what's the difference?",
        a: "MiniMax Music 3 makes background music and is priced by the second. Lyria 3.5 makes full songs with vocals and lyrics, about 2 minutes each. Pick MiniMax Music 3 for a bed under a voiceover and Lyria 3.5 when the song is the ad.",
      },
    ],
  },
  "elevenlabs-sound-effects-v3": {
    metaTitle: "ElevenLabs Sound Effects v3: AI SFX Generator | BuzzVideo",
    metaDescription: "ElevenLabs Sound Effects v3 is an AI sound effects generator: describe a sound and get 0.5 to 30 seconds of audio, loopable. Use it on BuzzVideo.",
    faq: [
      {
        q: "Can ElevenLabs Sound Effects v3 make sound effects from text?",
        a: "Yes. Describe the sound you need in a sentence, set how long it should run and generate. No recording or sound library is needed.",
      },
      {
        q: "How long can an ElevenLabs sound effect be?",
        a: "ElevenLabs Sound Effects v3 makes sounds from 0.5 to 30 seconds. Short lengths suit hits and whooshes, longer ones suit ambience.",
      },
      {
        q: "Can ElevenLabs Sound Effects v3 make looping sounds?",
        a: "Yes. ElevenLabs Sound Effects v3 has an optional seamless loop. Use it for ambience and background beds that need to repeat without a gap.",
      },
    ],
  },
  "heygen-voice": {
    metaDescription: "HeyGen Voice is an AI voice generator with 24 preset voices in 39 languages and adjustable expressiveness. Use it on BuzzVideo. Specs, prompts and FAQ.",
    faq: [
      {
        q: "How many voices and languages does HeyGen Voice have?",
        a: "HeyGen Voice has 24 preset voices in 39 languages. Pick a voice, paste the script and generate the voiceover.",
      },
      {
        q: "Can I adjust how expressive HeyGen Voice sounds?",
        a: "Yes. HeyGen Voice has an expressiveness setting. Turn it down for a calm explainer read and up for an energetic ad read.",
      },
      {
        q: "Can HeyGen Voice clone a voice?",
        a: "No. HeyGen Voice is a voiceover model with 24 preset voices and does not clone voices. To clone a voice from a recording, use Voice Replication 2.0 or Seed Audio 1.0.",
      },
    ],
  },
  "voice-replication-2-0": {
    faq: [
      {
        q: "Who made Voice Replication 2.0?",
        a: "Voice Replication 2.0 is a voice cloning model from ByteDance. On BuzzVideo you upload a reference recording and it reads any new script in that voice.",
      },
      {
        q: "What languages does Voice Replication 2.0 support?",
        a: "Voice Replication 2.0 clones voices in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more. Upload a clean reference recording in the language you need.",
      },
      {
        q: "Voice Replication 2.0 vs Seed Audio 1.0: which should I use for voice cloning?",
        a: "Use Voice Replication 2.0 when cloning is the whole job: it is a dedicated model that clones a voice from a reference recording. Use Seed Audio 1.0 when you also want music and sound effects in the same track, or want to start on the Free plan.",
      },
    ],
  },
};
