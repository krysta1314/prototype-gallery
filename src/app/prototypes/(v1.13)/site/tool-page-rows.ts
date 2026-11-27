// 自动生成(~/Desktop/官网素材工程/09-工具页配图/manifest2ts.py),别手改：改 notes 目录里的 manifest-*.json 再重跑。
// 工具页功能行逐行配图：顺序 what → models(有模型才有)→ faq → uses…;null = 这一行照旧从素材池取。
import type { RowMedia } from "./page-media";

export const TOOL_ROWS: Record<string, RowMedia[]> = {
 "ai-ad-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ad-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A yellow KOVA Yuzu sparkling can spins down through yuzu slices and water splashes and lands on a golden backdrop",
   "prompt": "A hyper-motion ad for my KOVA yuzu can: it tumbles through yuzu slices and splashes and lands on a golden backdrop.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ad-generator/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ad-generator/models.webp",
   "aspect": "4:3",
   "alt": "Three KOVA Yuzu cans in a sunny flat lay on pastel teal with yuzu halves, ice and mint",
   "prompt": "Top-down flat lay of three of my KOVA yuzu cans on a pastel teal surface with halved yuzu, ice cubes and mint leaves, hard summer sunlight.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ad-generator/faq.webp",
   "aspect": "4:3",
   "alt": "One KOVA Yuzu can in three ad formats: a UGC selfie hook in a park, a cold macro close-up, and a before-and-after from office desk to beach sunset",
   "prompt": "Make 3 ad variations for my KOVA yuzu can: a UGC hook, a cold close-up and a before-and-after.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ad-generator/use1.mp4",
   "aspect": "4:3",
   "alt": "A new KOVA Berry can rises out of crushed ice and frozen berries on a deep plum backdrop",
   "prompt": "A launch ad for our new KOVA Berry can rising out of crushed ice and frozen berries.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ad-generator/use1-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ad-generator/use2.webp",
   "aspect": "4:3",
   "alt": "Four fresh ad variations of the same KOVA Yuzu can: poolside, picnic blanket, office desk and a snowy campsite",
   "prompt": "Make 4 fresh versions of my KOVA can ad in different settings: pool, picnic, office desk and snowy campsite.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ad-generator/use3.webp",
   "aspect": "4:3",
   "alt": "A sunset projection lamp casts an orange-pink halo on a bedroom wall, with a product card showing the lamp at $39",
   "prompt": "A cozy bedroom ad for my sunset projection lamp, plus a clean white-background product shot.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "url-to-video": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/url-to-video/what.mp4",
   "aspect": "16:10",
   "alt": "A product link for a black crescent bag turns into a night-time street video of a woman carrying the bag",
   "prompt": "Turn my product page for the crescent bag into a short video ad.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/url-to-video/what-poster.webp"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/url-to-video/models.webp",
   "aspect": "4:3",
   "alt": "Hands pour hot water from a black gooseneck kettle into a black mug by a sunny window",
   "prompt": "Lifestyle shot of my gooseneck kettle pouring into a black mug on a small table by a sunny window, steam rising.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/url-to-video/faq.webp",
   "aspect": "4:3",
   "alt": "Three vertical storyboard frames for a KETTLO kettle ad: a pour-over hook, a hand turning the temperature dial, and the kettle with a Shop now button",
   "prompt": "A 15s vertical ad from my KETTLO kettle page: hook in 2s, top selling points, end on the product with Shop now.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/url-to-video/use1.webp",
   "aspect": "4:3",
   "alt": "Four ad covers for one coffee shop's SKUs: gooseneck kettle, pour-over dripper, stoneware mug and a KETTLO bean bag, each with a price tag",
   "prompt": "Make an ad cover for every product in my coffee shop: kettle, dripper, mug and beans.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/url-to-video/use2-before.webp",
    "aspect": "4:3",
    "alt": "Landing page of the fictional running app PACE with the headline Run your best mile yet",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/url-to-video/use2.mp4",
    "aspect": "4:3",
    "alt": "A runner on her porch steps checks her watch and phone and smiles in the morning sun",
    "prompt": "A video ad from my PACE landing page: a runner on her porch checks her watch and smiles after a morning run.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/url-to-video/use2-poster.webp",
    "model": "MiniMax H3",
    "modelSlug": "minimax-h3"
   },
   "beforeLabel": "Landing page",
   "afterLabel": "Video ad"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/url-to-video/use3.webp",
   "aspect": "4:3",
   "alt": "A help-center article about two-factor sign-in next to a flat illustrated explainer video frame",
   "prompt": "Turn my help article on two-factor sign-in into a short explainer video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-ugc-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A Latina woman in her 20s at her bedroom vanity holds up an AVEN serum bottle and talks to her phone camera",
   "prompt": "A UGC video of a woman in her 20s at her vanity talking about my AVEN serum, upbeat and casual.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ugc-video-generator/what-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/models.webp",
   "aspect": "4:3",
   "alt": "A young man with curly ginger hair takes a car selfie holding up a sage-green water bottle",
   "prompt": "A selfie-style UGC shot of a guy in his 20s in his car, grinning and holding up my sage-green water bottle to the camera.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/faq.mp4",
   "aspect": "16:10",
   "alt": "A UGC clip of a woman trying on black sunglasses inside a social feed with likes and comments",
   "prompt": "A UGC clip of a girl trying on my sunglasses, styled like a social post.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ugc-video-generator/faq-poster.webp"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/use1.mp4",
   "aspect": "16:10",
   "alt": "A young woman takes a night-time selfie on a rainy street holding up a green NOVA can",
   "prompt": "A night-time selfie UGC ad of a girl holding up my NOVA drink on a rainy street.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ugc-video-generator/use1-poster.webp"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/use2.webp",
   "aspect": "4:3",
   "alt": "Three hook variations of the same UGC ad: a surprised close-up, the AVEN bottle held to the lens, and patting serum into her cheek, each with an opening line",
   "prompt": "Give me 3 different opening hooks for the same AVEN serum UGC video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-ugc-video-generator/use3.mp4",
   "aspect": "4:3",
   "alt": "A Black woman with box braids in a bright white kitchen holds the AVEN serum and talks to camera in Spanish",
   "prompt": "The same AVEN serum UGC ad in Spanish, with a creator in a bright kitchen.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-ugc-video-generator/use3-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  }
 ],
 "ai-product-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-product-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "Hands open a navy gift box and lift out a white AURO earbud case, ending on a close-up of the logo",
   "prompt": "An unboxing video of my AURO earbuds: hands open the box, slow close-up on the logo, end on the product.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-product-video-generator/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-product-video-generator/models.webp",
   "aspect": "4:3",
   "alt": "A white running shoe lands on wet asphalt at sunrise with a frozen water splash",
   "prompt": "Low-angle shot of my white running shoe landing on wet asphalt at sunrise, water splash frozen around the sole.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-product-video-generator/faq-before.webp",
    "aspect": "4:3",
    "alt": "A HALO & WICK amber glass candle on a white background",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-product-video-generator/faq.mp4",
    "aspect": "4:3",
    "alt": "A hand lights the HALO & WICK candle on a coffee table in a cozy living room at dusk",
    "prompt": "Turn my candle photo into a cozy video: someone lights it on a coffee table at dusk, slow orbit.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-product-video-generator/faq-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Product photo",
   "afterLabel": "Product video"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-product-video-generator/use1.mp4",
   "aspect": "4:3",
   "alt": "A white running sneaker turns a full 360 degrees on a turntable against a light-grey studio background",
   "prompt": "A 360-degree turntable video of my white running shoe for the product page.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-product-video-generator/use1-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-product-video-generator/use2.webp",
   "aspect": "4:3",
   "alt": "Tortoiseshell sunglasses hooked on a turquoise surfboard on a sunny beach",
   "prompt": "A summer social ad for my tortoiseshell sunglasses on a surfboard at the beach.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-product-video-generator/use3.webp",
   "aspect": "4:3",
   "alt": "A round black smartwatch revealed under a spotlight, and the same watch on a wrist beside an espresso",
   "prompt": "A launch reveal of my black smartwatch under a spotlight, plus a lifestyle shot on the wrist.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "marketing-agent": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/marketing-agent/what.mp4",
   "aspect": "16:10",
   "alt": "A marketing agent turns the brief Launch ads for silver runners into 9:16, 1:1 and 16:9 ads",
   "prompt": "Launch ads for my silver runners: a UGC hook and a product close-up, in every size.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/marketing-agent/what-poster.webp"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/marketing-agent/faq.mp4",
   "aspect": "16:10",
   "alt": "The Marketing Agent panel plans script and hooks, shots, voiceover and sizes, then generates three ads",
   "prompt": "Plan a launch campaign for my silver runners and make 3 video ads for TikTok and Reels.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/marketing-agent/faq-poster.webp"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/marketing-agent/use1.mp4",
   "aspect": "16:9",
   "alt": "A giant pink lip gloss bursts with pink bubbles under the glass dome of a shopping mall",
   "prompt": "A launch film for our pink lip gloss: a giant bottle bursting with bubbles in a mall.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/marketing-agent/use1-poster.webp"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/marketing-agent/use2.webp",
   "aspect": "4:3",
   "alt": "A week of always-on posts for a dog treat brand: a golden retriever catching a treat on Monday, a rainy walk on Wednesday and a nap by a PAWLY bag on Friday",
   "prompt": "Plan a week of always-on posts for my dog treat brand PAWLY, 3 posts in 1:1.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/marketing-agent/use3.webp",
   "aspect": "4:3",
   "alt": "A bakery owner in a flour-dusted apron smiles at her laptop behind the counter of her small shop",
   "prompt": "Make ads for my small bakery without a studio shoot.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-spokesperson": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-spokesperson/what-before.webp",
    "aspect": "4:3",
    "alt": "A misty-blue ORBI smart tumbler on a white background",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-spokesperson/what.mp4",
    "aspect": "4:3",
    "alt": "A Black woman in a camel blazer holds the ORBI tumbler and presents its features in a bright studio",
    "prompt": "A 15s video of an avatar holding my ORBI tumbler, sharing 3 selling points, ending with Shop now.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-spokesperson/what-poster.webp",
    "model": "MiniMax H3 Max Avatar",
    "modelSlug": "minimax-h3-max-avatar"
   },
   "beforeLabel": "Product photo",
   "afterLabel": "Spokesperson video"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-spokesperson/models.webp",
   "aspect": "4:3",
   "alt": "A South Asian woman in an emerald blouse holds up a face cream jar at a podcast-style table",
   "prompt": "A spokesperson in a podcast-style studio holding up my face cream jar and talking to camera, warm studio lights.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-spokesperson/faq.webp",
   "aspect": "4:3",
   "alt": "Three steps: the ORBI product photo plus an avatar portrait become a spokesperson video of her holding the tumbler",
   "prompt": "Put my ORBI tumbler in this avatar's hand and make a spokesperson video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-spokesperson/use1.mp4",
   "aspect": "4:3",
   "alt": "A Latino man in his 40s demonstrates a handheld milk frother in a warm home kitchen and talks to camera",
   "prompt": "A product explainer: a man in his kitchen shows how my FLUX milk frother makes café foam in 10 seconds.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-spokesperson/use1-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-spokesperson/use2.mp4",
   "aspect": "4:3",
   "alt": "An animated CRUNCHO cereal box with a cartoon face talks on a sunny breakfast table",
   "prompt": "Make my CRUNCHO cereal box come alive and talk about itself at the breakfast table.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-spokesperson/use2-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-spokesperson/use3.webp",
   "aspect": "4:3",
   "alt": "A Southeast Asian HR trainer presents beside a whiteboard in a bright office",
   "prompt": "An onboarding video host presenting at a whiteboard in our office.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "talking-avatar": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/talking-avatar/what-before.webp",
    "aspect": "4:3",
    "alt": "Photo of an East Asian woman in a cream knit sweater at her home studio desk",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/talking-avatar/what.mp4",
    "aspect": "4:3",
    "alt": "The same woman talks to camera in a friendly, upbeat way",
    "prompt": "Make the woman in my photo say my voiceover in a friendly, upbeat way.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/talking-avatar/what-poster.webp",
    "model": "MiniMax H3 Max Avatar",
    "modelSlug": "minimax-h3-max-avatar"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Talking video"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/talking-avatar/models.webp",
   "aspect": "4:3",
   "alt": "A young man in a mustard overshirt smiles at the camera from his bedroom creator setup",
   "prompt": "A friendly creator in his 20s at his desk with a ring light, looking into the camera like he's about to start a video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/talking-avatar/faq.webp",
   "aspect": "4:3",
   "alt": "A still photo plus a voiceover becomes a talking video of the same woman",
   "prompt": "Turn my photo and voiceover into a talking video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/talking-avatar/use1.mp4",
   "aspect": "4:3",
   "alt": "A silver-haired coffee roaster in an apron talks about his fresh beans in front of a drum roaster",
   "prompt": "Make the roaster in my photo talk about this morning's fresh beans.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/talking-avatar/use1-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/talking-avatar/use2.webp",
   "aspect": "4:3",
   "alt": "A yoga instructor in her 40s demonstrates a side stretch in a bright studio",
   "prompt": "A yoga instructor in a bright studio, ready to talk through a stretch.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/talking-avatar/use3.mp4",
   "aspect": "4:3",
   "alt": "A cute 3D fox mascot in a green scarf talks from a desk full of books",
   "prompt": "Make my fox mascot Pip greet kids and introduce today's lesson.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/talking-avatar/use3-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  }
 ],
 "ai-lip-sync": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-lip-sync/what-before.webp",
    "aspect": "4:3",
    "alt": "Original video frame: a man in a grey tee holds up a DEW moisturizer tube in his bathroom",
    "prompt": "A guy in his late 20s in a bright bathroom talking to camera and holding up my DEW moisturizer tube.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "MiniMax H3",
    "modelSlug": "minimax-h3"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-lip-sync/what.mp4",
    "aspect": "4:3",
    "alt": "The same man now says: Hydration that lasts all day. Try it free.",
    "prompt": "Make the person in my video say: Hydration that lasts all day. Try it free.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-lip-sync/what-poster.webp",
    "model": "MiniMax H3 Max Lip Sync",
    "modelSlug": "minimax-h3-max-lip-sync"
   },
   "beforeLabel": "Original",
   "afterLabel": "Lip-synced"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-lip-sync/models.webp",
   "aspect": "4:3",
   "alt": "A man in a charcoal sweater speaks into a podcast microphone in a home studio",
   "prompt": "A podcast host in his home studio speaking into the mic, mid-sentence, looking at the camera.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-lip-sync/faq.webp",
   "aspect": "4:3",
   "alt": "Original video and the lip-synced result side by side, with the new audio line Hydration that lasts all day. Try it free.",
   "prompt": "Lip sync my video to this new audio line.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "MiniMax H3 Max Lip Sync",
   "modelSlug": "minimax-h3-max-lip-sync"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-lip-sync/use1-before.webp",
    "aspect": "4:3",
    "alt": "Original take with the caption and right now it's just $29",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "MiniMax H3",
    "modelSlug": "minimax-h3"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-lip-sync/use1.mp4",
    "aspect": "4:3",
    "alt": "Fixed take where he says and right now it's just $24",
    "prompt": "Fix the price line in my video: make him say it's just $24.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-lip-sync/use1-poster.webp",
    "model": "MiniMax H3 Max Lip Sync",
    "modelSlug": "minimax-h3-max-lip-sync"
   },
   "beforeLabel": "Original line",
   "afterLabel": "Fixed line"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-lip-sync/use2.mp4",
   "aspect": "4:3",
   "alt": "The same man now speaks Spanish with matching lip movement",
   "prompt": "Make the person in my video say the same line in Spanish.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-lip-sync/use2-poster.webp",
   "model": "MiniMax H3 Max Lip Sync",
   "modelSlug": "minimax-h3-max-lip-sync"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-lip-sync/use3-before.webp",
    "aspect": "4:3",
    "alt": "Original take: a South Asian woman in her car with the caption My commute survival kit, part one",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-lip-sync/use3.mp4",
    "aspect": "4:3",
    "alt": "The same take with a new opening line: Okay, stop scrolling. This is the only lip balm that survives my commute",
    "prompt": "Make her open with: Okay, stop scrolling. This is the only lip balm that actually survives my whole commute.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-lip-sync/use3-poster.webp",
    "model": "MiniMax H3 Max Lip Sync",
    "modelSlug": "minimax-h3-max-lip-sync"
   },
   "beforeLabel": "Hook A",
   "afterLabel": "Hook B"
  }
 ],
 "ai-influencer-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-sheet.webp",
   "aspect": "4:3",
   "alt": "Character sheet of an original Gen Z AI influencer, Ji-eun: a front close-up, a side profile and a full-body look with long pastel-pink hair",
   "prompt": "Create a Gen Z AI influencer for my brand: a 19-year-old K-pop style singer with long pastel-pink hair. Give me a front, side and full-body character sheet.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-street.webp",
   "aspect": "4:3",
   "alt": "AI influencer Ji-eun walks down a Seoul street in a cropped varsity jacket and pleated mini skirt, laughing with an iced matcha",
   "prompt": "Ji-eun, my AI influencer, walking down a Seoul street in a cropped varsity jacket and pleated mini skirt, laughing with an iced matcha.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-scenes.webp",
   "aspect": "4:3",
   "alt": "The same AI influencer in three scenes: a fitting-room mirror selfie, a cafe vlog and a neon street at night",
   "prompt": "Show Ji-eun in three scenes: a fitting-room mirror selfie, a cafe vlog and a neon street at night.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-talk.mp4",
   "aspect": "4:3",
   "alt": "AI influencer Ji-eun films a cafe vlog and talks to camera about her strawberry latte",
   "prompt": "A video of Ji-eun filming a cafe vlog, talking to camera about my strawberry latte.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-influencer-generator/genz-talk-poster.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-beauty.webp",
   "aspect": "4:3",
   "alt": "Ji-eun holds up a pink lip tint next to her face and pouts for a beauty post",
   "prompt": "A beauty launch post of Ji-eun holding our new pink lip tint next to her face, soft pink backdrop.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-walk.mp4",
   "aspect": "4:3",
   "alt": "Ji-eun walks down a Seoul street with an iced matcha and laughs as the breeze lifts her pink hair",
   "prompt": "Ji-eun walks down a Seoul street sipping an iced matcha, then turns and laughs as the wind lifts her hair.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-influencer-generator/genz-walk-poster.webp",
   "model": "MiniMax H3",
   "modelSlug": "minimax-h3"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-influencer-generator/genz-profile.webp",
   "aspect": "4:3",
   "alt": "Ji-eun's social profile with 312K followers and a grid of street, mirror-selfie, cafe vlog, night and beauty posts",
   "prompt": "Build Ji-eun's social feed: a Seoul street look, a mirror selfie, a cafe vlog, a night out and a beauty post.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-inpainting": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/what-before.webp",
    "aspect": "4:3",
    "alt": "A living room with the plain beige wall masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/what-after.webp",
    "aspect": "4:3",
    "alt": "The same living room with a window of morning light in place of the wall",
    "prompt": "Replace the plain wall with a window with morning light. Keep everything else the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/models-before.webp",
    "aspect": "4:3",
    "alt": "A brunch table with an empty corner masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/models-after.webp",
    "aspect": "4:3",
    "alt": "The same table with orange juice and two glasses added",
    "prompt": "Add a pitcher of orange juice and two glasses in the empty corner of the table.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/faq-before.webp",
    "aspect": "4:3",
    "alt": "A reading corner with the empty floor masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same corner with a fiddle-leaf fig added",
    "prompt": "Add a fiddle-leaf fig in a white pot next to the armchair.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use1-before.webp",
    "aspect": "4:3",
    "alt": "A photo set with tape and a light stand masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same set with a clean pink backdrop",
    "prompt": "Remove the tape and the light stand and fill in clean pink backdrop paper.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use2-before.webp",
    "aspect": "4:3",
    "alt": "A bakery window with a summer display masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same bakery window dressed for autumn",
    "prompt": "Change the window display to autumn: pumpkin pies, cinnamon rolls, little pumpkins and maple leaves.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use3-before.webp",
    "aspect": "4:3",
    "alt": "A hand with chipped coral nail polish masked",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-inpainting/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same hand with a smooth, perfect manicure",
    "prompt": "Fix the chipped nail polish so every nail looks freshly done.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Masked area",
   "afterLabel": "Inpainted"
  }
 ],
 "ai-image-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/what.webp",
   "aspect": "4:3",
   "alt": "A man walks a vintage bicycle with sunflowers down a Brooklyn brownstone street at golden hour",
   "prompt": "A man walking a vintage mint bicycle with sunflowers in the basket down a Brooklyn brownstone street at golden hour, 35mm film look.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/models.webp",
   "aspect": "4:3",
   "alt": "A woman in a rust linen suit leans on a yellow vintage convertible at a desert motel",
   "prompt": "A woman in a rust linen suit leaning on a butter-yellow 1960s convertible at an empty desert motel, golden hour, fashion editorial.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/faq.webp",
   "aspect": "4:3",
   "alt": "A corner diner at night with a neon sign reading MAPLE & MAIN DINER and an OPEN 24 HOURS window decal",
   "prompt": "A corner diner at night after rain with a red neon sign that says \"MAPLE & MAIN DINER\" and \"OPEN 24 HOURS\" on the window.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/use1.webp",
   "aspect": "4:3",
   "alt": "A BRIVO grapefruit sparkling water ad with the headline Sip the sunshine.",
   "prompt": "An ad photo of a BRIVO grapefruit sparkling water can on a sunlit kitchen counter with grapefruit and ice, headline \"Sip the sunshine.\" at the top.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/use2.webp",
   "aspect": "4:3",
   "alt": "A white running shoe frozen above a splash of water on wet asphalt",
   "prompt": "A white running shoe frozen mid-air above a splash on wet asphalt, dark gray background, hard rim light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-generator/use3.webp",
   "aspect": "4:3",
   "alt": "Four friends eating tacos on a rooftop at sunset under string lights",
   "prompt": "A candid phone photo of four friends eating tacos on a rooftop at sunset under string lights.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-image-editor": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/what-before.webp",
    "aspect": "4:3",
    "alt": "A cream OAKEN ceramic mug with a kraft sticker on the lid",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/what-after.webp",
    "aspect": "4:3",
    "alt": "The same mug in sage green with the sticker removed",
    "prompt": "Change the mug to sage green and remove the sticker on the lid. Keep everything else exactly the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/models-before.webp",
    "aspect": "4:3",
    "alt": "A backyard patio table in plain daylight",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/models-after.webp",
    "aspect": "4:3",
    "alt": "The same patio at dusk with string lights and candles",
    "prompt": "Make it evening: dusk sky, string lights over the table and lit candles. Keep the same framing.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/faq-before.webp",
    "aspect": "4:3",
    "alt": "A sidewalk chalkboard reading Iced Latte $4",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same chalkboard now reading Hot Cider $5",
    "prompt": "Change the chalkboard text to \"Hot Cider $5\" in the same chalk lettering.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use1-before.webp",
    "aspect": "4:3",
    "alt": "A desk flat lay with headphones, a notebook and a pothos plant",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same desk with the plant swapped for a stack of vinyl records",
    "prompt": "Swap the plant for a stack of vinyl records. Keep the headphones and notebook where they are.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use2-before.webp",
    "aspect": "4:3",
    "alt": "A woman in an oatmeal hoodie in front of a white brick wall",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same woman with the hoodie recolored forest green",
    "prompt": "Recolor the hoodie to forest green and keep every fold and shadow.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use3-before.webp",
    "aspect": "4:3",
    "alt": "A black T-shirt flat lay with cat hair, lint and a crooked label",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-editor/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same T-shirt cleaned with the label straightened",
    "prompt": "Clean up the T-shirt: remove the cat hair and lint and straighten the neck label.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  }
 ],
 "remove-background": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/what-before.webp",
    "aspect": "4:3",
    "alt": "A caramel NOMA leather tote on a rumpled bed",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/what-after.webp",
    "aspect": "4:3",
    "alt": "The same tote on a clean white background with a soft shadow",
    "prompt": "Remove the background from this bag photo and put it on pure white with a soft shadow.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Background removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/models-before.webp",
    "aspect": "4:3",
    "alt": "A vintage film camera on a cluttered thrift-store shelf",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/models-after.webp",
    "aspect": "4:3",
    "alt": "The same camera on a white background",
    "prompt": "Remove the cluttered shelf behind the camera and give me a clean white background.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Background removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/faq-before.webp",
    "aspect": "4:3",
    "alt": "A woman with curly hair at a busy farmers market",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same woman cut out on a transparent background with every curl kept",
    "prompt": "Cut her out on a transparent background and keep every curl.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Transparent"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/use1-before.webp",
    "aspect": "4:3",
    "alt": "A white ceramic vase on a cluttered kitchen counter",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same vase centered on white for a marketplace listing",
    "prompt": "Remove the kitchen background and center the vase on white for my marketplace listing.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Background removed"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/remove-background/use2.webp",
   "aspect": "4:3",
   "alt": "A cut-out skateboard deck on an orange NEW DROP ad layout, with the original photo inset",
   "prompt": "Cut out the skateboard deck and lay it on a bright orange ad with \"NEW DROP\" in the corner.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/use3-before.webp",
    "aspect": "4:3",
    "alt": "A monstera in a terracotta pot on a wooden floor",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-background/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same monstera on a sunny windowsill",
    "prompt": "Remove the background and put the monstera on a sunny windowsill.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "New scene"
  }
 ],
 "ai-product-photography": [
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-product-photography/models.webp",
   "aspect": "4:3",
   "alt": "A matte black gooseneck kettle with steam on dark walnut",
   "prompt": "Shoot my matte black gooseneck kettle on dark walnut with steam and warm side light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-product-photography/faq-before.webp",
    "aspect": "4:3",
    "alt": "A cream candle on a kitchen counter shot with phone flash",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-product-photography/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same candle on travertine in warm sunlight",
    "prompt": "Turn my phone snapshot of this candle into a studio shot on travertine in warm sunlight. Keep the candle exactly the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Snapshot",
   "afterLabel": "Studio shot"
  },
  null,
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-product-photography/use3.webp",
   "aspect": "4:3",
   "alt": "A woven straw bucket bag on a woman's shoulder on a beach boardwalk",
   "prompt": "My straw bucket bag on a model's shoulder on a California boardwalk, afternoon backlight, bag in focus.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-background-generator": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/what-before.webp",
    "aspect": "4:3",
    "alt": "A LUMEA serum bottle on a white office desk",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/what-after.webp",
    "aspect": "4:3",
    "alt": "The same bottle on a marble bathroom counter in morning light",
    "prompt": "Put my serum bottle on a marble bathroom counter in soft morning light with a towel and eucalyptus. Keep the bottle exactly the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "New background"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-background-generator/models.webp",
   "aspect": "4:3",
   "alt": "The LUMEA serum bottle on a dark sea rock with a wave splashing",
   "prompt": "Put my serum bottle on a dark sea rock with a wave splashing behind it.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-background-generator/faq.webp",
   "aspect": "4:3",
   "alt": "The LUMEA serum bottle on travertine with palm leaf shadows",
   "prompt": "Put my serum bottle on a travertine block against a terracotta wall with palm leaf shadows, golden light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/use1-before.webp",
    "aspect": "4:3",
    "alt": "The LUMEA bottle on a cluttered desk",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same bottle on a soft beige gradient for a product listing",
    "prompt": "Replace the messy desk with a soft beige gradient background for my product listing.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "New background"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-background-generator/use2.webp",
   "aspect": "4:3",
   "alt": "The same LUMEA bottle in three backgrounds: bathroom, sea rock and pink silk",
   "prompt": "Show my serum bottle in three backgrounds side by side: marble bathroom, sea rock, pink silk.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/use3-before.webp",
    "aspect": "4:3",
    "alt": "A man with curly hair in a neighborhood park",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-background-generator/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same man on a neon-lit street at night",
    "prompt": "Swap the park behind him for a neon-lit street at night. Keep his hair edges clean.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "New background"
  }
 ],
 "image-to-image": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/what-before.webp",
    "aspect": "4:3",
    "alt": "A woman reading on a Brooklyn brownstone stoop",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/what-after.webp",
    "aspect": "4:3",
    "alt": "The same scene restyled as a claymation still",
    "prompt": "Turn my photo into a claymation stop-motion still. Keep the same composition.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "beforeLabel": "Original",
   "afterLabel": "Claymation"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-image/models.webp",
   "aspect": "4:3",
   "alt": "The same woman at a rainy cafe window",
   "prompt": "Put the woman in my photo at a cafe window on a rainy day. Keep her face, hair and cardigan the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-image/faq.webp",
   "aspect": "4:3",
   "alt": "Three references (a man, a denim jacket, a red-rock road) combined into one photo",
   "prompt": "Put the man from photo 1 in the jacket from photo 2, standing on the road from photo 3 at golden hour.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/use1-before.webp",
    "aspect": "4:3",
    "alt": "A TRAILO steel water bottle on white",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same bottle on a misty mountain trail",
    "prompt": "Use my bottle photo and put it on a mossy rock on a misty mountain trail. Keep the bottle and label the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "New scene"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/use2-before.webp",
    "aspect": "4:3",
    "alt": "A plain rental living room",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-image/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same room restyled as mid-century modern",
    "prompt": "Restyle this living room as mid-century modern. Keep the same layout and window.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Restyled"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-image/use3.webp",
   "aspect": "4:3",
   "alt": "A woman and a mint retro radio combined into one balcony photo",
   "prompt": "Combine my two photos: the woman hugging the mint retro radio on a sunny balcony.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-infographic-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/what.webp",
   "aspect": "4:3",
   "alt": "A NIMBUS air purifier infographic with four labeled benefits",
   "prompt": "An infographic for my NIMBUS air purifier with 4 benefits and icons: Quiet at 24 dB, Covers 500 sq ft, 3-stage filter, Auto mode.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/models.webp",
   "aspect": "4:3",
   "alt": "An anatomy-of-a-breakfast-burrito infographic with numbered callouts",
   "prompt": "An infographic titled \"Anatomy of a breakfast burrito\" with numbered callouts: eggs, bacon, avocado, salsa.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/faq.webp",
   "aspect": "4:3",
   "alt": "A pour-over coffee guide in four photo steps",
   "prompt": "A step-by-step infographic \"Pour-over in 4 steps\": Rinse, Bloom, Pour, Serve, with a photo for each.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/use1.webp",
   "aspect": "4:3",
   "alt": "A NIMBUS air purifier dimension image for a product listing",
   "prompt": "A listing image for my NIMBUS purifier with dimensions 14 in x 9 in and 3 feature icons, white background.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/use2.webp",
   "aspect": "4:3",
   "alt": "A carousel cover reading 5 ways to keep basil alive",
   "prompt": "A carousel cover for \"5 ways to keep basil alive\" with a basil plant on a sunny windowsill.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-infographic-generator/use3.webp",
   "aspect": "4:3",
   "alt": "A Q3 at a glance report slide with three stat cards and a bar chart",
   "prompt": "A report slide \"Q3 at a glance\": +18% orders, $42 avg order, 2,300 new customers, plus a bar chart.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  }
 ],
 "ai-photo-restoration": [
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-photo-restoration/models.webp",
   "aspect": "4:3",
   "alt": "A restored, colorized 1950s photo of a couple on a seaside boardwalk",
   "prompt": "Restore and colorize this 1950s photo of my grandparents on the boardwalk. Keep their faces exactly the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  null,
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use1-before.webp",
    "aspect": "4:3",
    "alt": "A faded, creased 1980s family birthday photo",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same birthday photo restored with natural color",
    "prompt": "Restore this faded 1980s family photo: remove the crease and scratches and fix the yellow color. Keep everyone's faces the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Restored"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use2-before.webp",
    "aspect": "4:3",
    "alt": "A faded, creased 1960s photo of Rosie's Diner",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same diner photo restored and colorized",
    "prompt": "Restore and colorize this old photo of our diner. Remove the crease and scratches and keep the sign readable.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "beforeLabel": "Original",
   "afterLabel": "Restored"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use3-before.webp",
    "aspect": "4:3",
    "alt": "A blurry early-2000s photo of friends on a lake dock",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-photo-restoration/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same photo sharpened with natural color",
    "prompt": "Fix this blurry old photo: sharpen the faces, remove the color cast and the date stamp. Keep everyone the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Restored"
  }
 ],
 "sketch-to-image": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/what-before.webp",
    "aspect": "4:3",
    "alt": "A pencil sketch of an arc floor lamp",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/what-after.webp",
    "aspect": "4:3",
    "alt": "The same lamp as a photoreal studio shot",
    "prompt": "Turn my sketch into a photoreal product shot on a white studio background. Keep the shape of the drawing.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Result"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/sketch-to-image/models.webp",
   "aspect": "4:3",
   "alt": "The arc floor lamp lighting a reading chair in a cozy study",
   "prompt": "My arc floor lamp lighting a leather reading chair in a cozy study at dusk.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/faq-before.webp",
    "aspect": "4:3",
    "alt": "A messy ballpoint doodle of a food truck on a napkin",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same food truck as a real street photo",
    "prompt": "Turn this napkin doodle into a real photo of a mint-green food truck on a city street.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Result"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use1-before.webp",
    "aspect": "4:3",
    "alt": "A marker sketch of a hiking backpack",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same backpack as a forest green product render",
    "prompt": "Turn my backpack sketch into a photoreal product render in forest green.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Result"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use2-before.webp",
    "aspect": "4:3",
    "alt": "A sticky-note ad layout sketch",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use2-after.webp",
    "aspect": "4:3",
    "alt": "The finished SUNDAE sunscreen pool ad",
    "prompt": "Turn my layout sketch into a finished ad: SUNDAE sunscreen by the pool with the headline \"Sun's out.\"",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Result"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use3-before.webp",
    "aspect": "4:3",
    "alt": "A child's crayon drawing of a green dragon",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/sketch-to-image/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same dragon as a storybook watercolor",
    "prompt": "Turn my kid's crayon dragon into a storybook watercolor illustration. Keep the dragon the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Result"
  }
 ],
 "consistent-character": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/consistent-character/what.webp",
   "aspect": "4:3",
   "alt": "A red-haired woman on a subway platform, with her reference photo inset",
   "prompt": "Show the woman in my reference photo waiting on a New York subway platform. Keep her face, hair and outfit exactly the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/consistent-character/models.webp",
   "aspect": "4:3",
   "alt": "A character sheet of the same woman: front, side and back",
   "prompt": "A character sheet of the woman in my photo: front, side and back views on white.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/consistent-character/faq.webp",
   "aspect": "4:3",
   "alt": "The same woman in four scenes: kitchen, park, office and beach",
   "prompt": "The same woman in 4 scenes: unboxing a gift at home, in the park, at the office, at the beach.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/consistent-character/use1.webp",
   "aspect": "4:3",
   "alt": "Pip the fox mascot at a cafe counter, packing a box and holding a sign",
   "prompt": "Our mascot Pip, a little orange fox with a yellow scarf, in 3 scenes: at the cafe counter, packing a box, holding a sign.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/consistent-character/use2.webp",
   "aspect": "4:3",
   "alt": "A three-panel story ad with the same woman from rushed morning to fresh",
   "prompt": "A 3-panel story ad with the same woman: rushed morning, opening her skincare box, stepping out fresh.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/consistent-character/use3.mp4",
   "aspect": "4:3",
   "alt": "Pip the fox mascot pours heart latte art behind a cafe counter",
   "prompt": "Pip the fox makes heart latte art behind the cafe counter and looks up at the camera.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/consistent-character/use3-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "ai-headshot-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/what.webp",
   "aspect": "4:3",
   "alt": "A navy blazer headshot on light gray, with the original car selfie inset",
   "prompt": "A professional headshot of the person in my photo: navy blazer, soft studio light, plain light gray background. Keep the face exactly the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/models.webp",
   "aspect": "4:3",
   "alt": "A headshot of a woman attorney in her fifties on charcoal gray",
   "prompt": "A professional headshot of a woman attorney in her fifties, charcoal background, soft light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/faq.webp",
   "aspect": "4:3",
   "alt": "A LinkedIn-style headshot of a smiling woman on warm beige",
   "prompt": "A LinkedIn headshot with a natural smile, cream shirt, warm beige background.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/use1.webp",
   "aspect": "4:3",
   "alt": "A resume headshot on navy with the original dorm photo inset",
   "prompt": "Turn my dorm photo into a resume headshot: white shirt and navy tie on a navy background.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/use2.webp",
   "aspect": "4:3",
   "alt": "Four matching team headshots on the same light gray background",
   "prompt": "Matching team headshots for our About page: same light gray background and lighting for everyone.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-headshot-generator/use3.webp",
   "aspect": "4:3",
   "alt": "An author portrait in an independent bookstore",
   "prompt": "An author photo in a cozy independent bookstore, holding my book, warm light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "image-to-3d": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-3d/what.webp",
   "aspect": "4:3",
   "alt": "Bobo the bubble-tea mascot as a 3D figurine, with the flat illustration inset",
   "prompt": "Turn my mascot into a collectible 3D figurine on a round base, white background.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-3d/models.webp",
   "aspect": "4:3",
   "alt": "Bobo figurine front, side and back views",
   "prompt": "Front, side and back views of my 3D figurine.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-3d/faq.webp",
   "aspect": "4:3",
   "alt": "A home 3D printer with an unpainted and a painted Bobo figurine",
   "prompt": "My figurine printed on a home 3D printer: one unpainted, one painted.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-3d/use1.webp",
   "aspect": "4:3",
   "alt": "The Bobo figurine in a collectible window box on a toy store shelf",
   "prompt": "My figurine in a collectible window box labeled \"BOBO\" on a toy store shelf.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/image-to-3d/use2.mp4",
   "aspect": "4:3",
   "alt": "The Bobo figurine turning 360 degrees on its base",
   "prompt": "A 360° turntable video of my 3D figurine on a white background.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/image-to-3d/use2-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/image-to-3d/use3.mp4",
   "aspect": "4:3",
   "alt": "An AURO smart speaker revealed from darkness on a turntable",
   "prompt": "A product reveal video: my smart speaker turns on a turntable as a spotlight fades up.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/image-to-3d/use3-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "ai-logo-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/what.webp",
   "aspect": "4:3",
   "alt": "Four MOSSA skincare logo concepts in a 2x2 grid",
   "prompt": "Design 4 logo concepts for MOSSA, a skincare brand that feels calm and natural: a simple mark with the name, sage green and beige, on white.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/models.webp",
   "aspect": "4:3",
   "alt": "The MOSSA logo in color, one-color, reversed and icon versions",
   "prompt": "Make the leaf logo into a full set: color, one-color, reversed and app icon.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/faq.webp",
   "aspect": "4:3",
   "alt": "The MOSSA logo on a frosted skincare bottle",
   "prompt": "Show my MOSSA logo on a frosted glass skincare bottle on stone.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/use1.webp",
   "aspect": "4:3",
   "alt": "The Fern & Fable bookstore logo in gold foil on a green paper bag",
   "prompt": "A logo for \"Fern & Fable\", an independent bookstore: a fern over an open book, gold foil on a green bag.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/use2.webp",
   "aspect": "4:3",
   "alt": "A MOSSA SUN sunscreen tube next to the original MOSSA bottle",
   "prompt": "A sub-brand \"MOSSA SUN\" in warm orange on a sunscreen tube, next to the original bottle.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-logo-generator/use3.webp",
   "aspect": "4:3",
   "alt": "The Fern & Fable logo on a shop door and a tote bag",
   "prompt": "Show the Fern & Fable logo on the shop door and a tote bag.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  }
 ],
 "remove-object": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/what-before.webp",
    "aspect": "4:3",
    "alt": "A woman on Santa Monica beach with other beachgoers and a trash can",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/what-after.webp",
    "aspect": "4:3",
    "alt": "The same beach with only her and the ocean",
    "prompt": "Remove the people and the trash can behind her. Keep everything else exactly the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/models-before.webp",
    "aspect": "4:3",
    "alt": "A living room floor with tangled cables and chargers",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/models-after.webp",
    "aspect": "4:3",
    "alt": "The same floor with the cables removed",
    "prompt": "Remove the cables and chargers from the floor.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/faq-before.webp",
    "aspect": "4:3",
    "alt": "A couple at the Grand Canyon with a stranger in the frame",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same photo with the stranger removed",
    "prompt": "Remove the stranger with the phone and fill in the railing and the canyon.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use1-before.webp",
    "aspect": "4:3",
    "alt": "A lotion bottle with cotton swabs and a hair tie around it",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same bottle on a clean counter",
    "prompt": "Remove the cotton swabs, hair tie and tissue around the lotion bottle.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use2-before.webp",
    "aspect": "4:3",
    "alt": "French Quarter balconies with a white van parked in front",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same street with the van removed",
    "prompt": "Remove the white van and rebuild the street behind it.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use3-before.webp",
    "aspect": "4:3",
    "alt": "A pillow product photo with a SUMMER SALE 30% OFF badge",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/remove-object/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same photo with the badge removed",
    "prompt": "Remove the sale badge so I can reuse this photo.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Removed"
  }
 ],
 "virtual-try-on": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/what.webp",
   "aspect": "4:3",
   "alt": "A model wearing a blue floral dress, with her photo and the dress inset",
   "prompt": "Put the dress in my first photo on the model in my second photo. Keep her pose, the background and the dress's color and pattern exactly the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/models.webp",
   "aspect": "4:3",
   "alt": "A close-up of the dress print following the folds at the waist",
   "prompt": "A close-up of the dress on the model at the waist so the print shows.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/faq.webp",
   "aspect": "4:3",
   "alt": "A man wearing a khaki work jacket, with his photo and the jacket inset",
   "prompt": "Put this khaki work jacket on the man in my photo. Keep his pose and jeans the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/use1.webp",
   "aspect": "4:3",
   "alt": "The blue floral dress on a model, front and side, on white",
   "prompt": "Listing photos of the dress on the model on white: front and side.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/use2.webp",
   "aspect": "4:3",
   "alt": "Three different women wearing the same blue floral dress",
   "prompt": "Show the same dress on three different women: petite, curvy and older.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/virtual-try-on/use3.webp",
   "aspect": "4:3",
   "alt": "A model in the blue dress on an LA rooftop at sunset with space for a headline",
   "prompt": "The model in the dress on an LA rooftop at sunset, space on the right for a headline.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-poster-generator": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/what.webp",
   "aspect": "4:3",
   "alt": "A Jazz in the Park poster with a saxophone silhouette at sunset",
   "prompt": "A poster for \"Jazz in the Park\": a sax player at sunset, with \"Fri, July 18 · 7 PM · Free\".",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/models.webp",
   "aspect": "4:3",
   "alt": "A LAST EXIT film poster under a neon motel sign",
   "prompt": "A film poster for \"LAST EXIT\": a girl under a neon motel sign on a desert highway at night.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/faq.webp",
   "aspect": "4:3",
   "alt": "A Farm to Table Week typographic poster with hand-drawn vegetables",
   "prompt": "A typographic poster \"Farm to Table Week\", Sept 8–14, with hand-drawn vegetables.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/use1.webp",
   "aspect": "4:3",
   "alt": "A claymation Book Club Night poster with date and place",
   "prompt": "A claymation poster for \"Book Club Night\", Thu, Oct 9, 7 PM, Maple Street Library.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/use2.webp",
   "aspect": "4:3",
   "alt": "A Maple Oat Latte poster by a coffee shop register",
   "prompt": "An in-store poster for our new \"Maple Oat Latte\", $5.50, next to the register.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-poster-generator/use3.webp",
   "aspect": "4:3",
   "alt": "A Ride at Sunrise cycling class poster",
   "prompt": "A social poster \"Ride at Sunrise\", Mon · Wed · Fri 6:30 AM, for our cycling studio.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  }
 ],
 "ai-flyer-maker": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/what.webp",
   "aspect": "4:3",
   "alt": "A bakery Grand Opening flyer with a free coffee offer",
   "prompt": "A flyer for the grand opening of our bakery: Sat, Oct 4, free coffee for the first 50, 118 Elm Street.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/models.webp",
   "aspect": "4:3",
   "alt": "A printed double-sided flyer on a cafe table",
   "prompt": "A double-sided flyer for our bakery opening: front with a croissant, back with hours and a map.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/faq.webp",
   "aspect": "4:3",
   "alt": "A bright yellow Yard Sale flyer",
   "prompt": "A yard sale flyer: Saturday 8 AM – 1 PM, 42 Oak Lane.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/use1.webp",
   "aspect": "4:3",
   "alt": "A Sparkle Home Cleaning flyer with a first-clean offer",
   "prompt": "A flyer for Sparkle Home Cleaning: kitchens, bathrooms, deep cleans, first clean 20% off.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/use2.webp",
   "aspect": "4:3",
   "alt": "A Saturday Farmers Market flyer",
   "prompt": "A flyer for the Saturday Farmers Market, every Sat 8 AM – Noon at Town Square.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-flyer-maker/use3.webp",
   "aspect": "4:3",
   "alt": "A Corelight Pilates digital flyer offering a free first week",
   "prompt": "A digital flyer for Corelight Pilates: your first week is free, with a Book a class button.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  }
 ],
 "ai-art-generator": [
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-art-generator/models.webp",
   "aspect": "4:3",
   "alt": "A gouache illustration of a lighthouse on a cliff at dusk",
   "prompt": "A gouache illustration of a red-and-white lighthouse on a cliff at dusk, cozy storybook mood.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-art-generator/use1.webp",
   "aspect": "4:3",
   "alt": "An Art Nouveau poster illustration of a perfume bottle framed by vines",
   "prompt": "An Art Nouveau poster illustration of my perfume bottle framed by irises and vines, no text.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-art-generator/use2.webp",
   "aspect": "4:3",
   "alt": "A layered paper-cut valley at sunrise with hikers",
   "prompt": "Paper-cut art of a valley at sunrise with tiny hikers, space at the top for a title.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-art-generator/use3.webp",
   "aspect": "4:3",
   "alt": "A 90s anime still of a woman waiting in a laundromat on a rainy night",
   "prompt": "A 90s anime still of a girl waiting in a laundromat on a rainy night.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-art-generator/use4.webp",
   "aspect": "4:3",
   "alt": "Three flat vector spot illustrations: a piggy bank, a calendar and a rising arrow",
   "prompt": "Three flat brand spot illustrations: a piggy bank, a calendar and a rising arrow.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-cartoon-generator": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/what-before.webp",
    "aspect": "4:3",
    "alt": "A family barbecue with a beagle in the backyard",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/what-after.webp",
    "aspect": "4:3",
    "alt": "The same family as a 3D cartoon scene",
    "prompt": "Turn our family photo into a 3D cartoon. Keep everyone and the dog in the same places.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Cartoon"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-cartoon-generator/models.webp",
   "aspect": "4:3",
   "alt": "A 2D cartoon of a woman delivering flowers by bike",
   "prompt": "A 2D cartoon of a girl riding a bike with a basket of flowers through a small town.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/faq-before.webp",
    "aspect": "4:3",
    "alt": "A cafe selfie of a woman with curly hair and round glasses",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same woman as a 3D cartoon avatar",
    "prompt": "Turn my selfie into a 3D cartoon avatar. Keep my glasses and curly hair.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Cartoon"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/use1-before.webp",
    "aspect": "4:3",
    "alt": "A FUEGO hot sauce bottle",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-cartoon-generator/use1-after.webp",
    "aspect": "4:3",
    "alt": "The FUEGO bottle as a waving 3D cartoon mascot",
    "prompt": "Turn my product photo into a 3D cartoon character with a friendly face. Keep the label readable.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Cartoon"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-cartoon-generator/use2.webp",
   "aspect": "4:3",
   "alt": "The FUEGO mascot on a pile of tacos holding a 2 for $10 sign",
   "prompt": "Our FUEGO mascot on a pile of tacos holding a \"2 for $10\" sign.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "GPT Image 2.5 Sunburst",
   "modelSlug": "gpt-image-2-5-sunburst"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-cartoon-generator/use3.webp",
   "aspect": "4:3",
   "alt": "The FUEGO mascot making guacamole in a kitchen",
   "prompt": "Our FUEGO mascot making guacamole in a kitchen.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-cartoon-generator/use4.webp",
   "aspect": "4:3",
   "alt": "A kawaii sticker of a winking orange-and-white cat",
   "prompt": "Turn my cat into a cute winking sticker with a white border.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-image-extender": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/what-before.webp",
    "aspect": "4:3",
    "alt": "A vertical photo of a woman in a yellow raincoat on a New York crosswalk",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/what-after.webp",
    "aspect": "4:3",
    "alt": "The same photo extended to 4:3 with taxis and storefronts on both sides",
    "prompt": "Extend my vertical photo to 4:3 by filling in the street on both sides. Don't crop or change the original.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Extended"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-image-extender/models.webp",
   "aspect": "4:3",
   "alt": "A wide view of a Vermont main street in autumn",
   "prompt": "A wide panorama of a Vermont main street in peak autumn, white church steeple, golden light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/faq-before.webp",
    "aspect": "4:3",
    "alt": "A square photo of an orange cocktail on a bar",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same cocktail extended on every side, with the original area outlined",
    "prompt": "Extend this square photo on every side and keep the original exactly as it is.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Extended"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use1-before.webp",
    "aspect": "4:3",
    "alt": "A square photo of a woman jogging in a park",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same photo extended to a 9:16 Story with sky and path added",
    "prompt": "Resize my image to 9:16 for Stories by extending the sky and the path.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Extended"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use2-before.webp",
    "aspect": "4:3",
    "alt": "A vertical overhead photo of a picnic on a gingham blanket",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same picnic extended into a wide 21:9 banner",
    "prompt": "Turn this picnic photo into a wide 21:9 banner by extending the blanket and grass.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Extended"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use3-before.webp",
    "aspect": "4:3",
    "alt": "A vertical photo of a chef plating in an open kitchen",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-image-extender/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same photo extended left with a clean tile wall for a headline",
    "prompt": "Extend the photo to the left with a clean tile wall so I have room for a headline.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Extended"
  }
 ],
 "upscale-image": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/what-before.webp",
    "aspect": "4:3",
    "alt": "A blurry low-resolution photo of an orange cat on a windowsill",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/what-after.webp",
    "aspect": "4:3",
    "alt": "The same cat upscaled with sharp fur and whiskers",
    "prompt": "Upscale my photo to 4K and keep the fur sharp.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "SeedVR Upscale",
    "modelSlug": "seedvr-upscale-image"
   },
   "beforeLabel": "Original",
   "afterLabel": "Upscaled"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/faq-before.webp",
    "aspect": "4:3",
    "alt": "A blurry photo of SOLARA printing inside a sunglasses case",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "GPT Image 2.5 Sunburst",
    "modelSlug": "gpt-image-2-5-sunburst"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same label upscaled with crisp, readable text",
    "prompt": "Upscale my product photo to 4K and keep the label text sharp.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "SeedVR Upscale",
    "modelSlug": "seedvr-upscale-image"
   },
   "beforeLabel": "Original",
   "afterLabel": "Upscaled"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/use1-before.webp",
    "aspect": "4:3",
    "alt": "A low-resolution photo of tortoiseshell sunglasses on a beach towel",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/use1-after.webp",
    "aspect": "4:3",
    "alt": "The same sunglasses upscaled with sharp reflections and texture",
    "prompt": "Upscale my product photo to 4K with crisp reflections.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "SeedVR Upscale",
    "modelSlug": "seedvr-upscale-image"
   },
   "beforeLabel": "Original",
   "afterLabel": "Upscaled"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/use2-before.webp",
    "aspect": "4:3",
    "alt": "A soft low-resolution AI painting of a cabin in a redwood forest",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-image/use2-after.webp",
    "aspect": "4:3",
    "alt": "The same painting upscaled with rich fine detail",
    "prompt": "Upscale this AI image to 4K with more fine detail.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "SeedVR Upscale",
    "modelSlug": "seedvr-upscale-image"
   },
   "beforeLabel": "Original",
   "afterLabel": "Upscaled"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/upscale-image/use3.webp",
   "aspect": "4:3",
   "alt": "A corgi phone photo printed large and framed on a living room wall, with the original photo inset",
   "prompt": "Upscale my corgi photo so I can print it at 18x24 inches.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A young woman in a yellow raincoat crosses a neon-lit New York street in the rain",
   "prompt": "A cinematic shot of a young woman in a yellow raincoat crossing a rainy New York street at night, neon reflections, camera tracking alongside.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-video-generator/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "A rider on a vintage motorcycle speeds down a desert highway at sunset",
   "prompt": "A lone rider on a vintage motorcycle speeding down an empty desert highway at sunset, dust trailing, low tracking shot, anamorphic flare.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-generator/faq-models.webp",
   "aspect": "4:3",
   "alt": "Four video stills labeled Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3",
   "prompt": "Show me what Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3 each do best.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-generator/ad-before.webp",
    "aspect": "4:3",
    "alt": "A green-dial steel watch with a tan leather strap on wet slate",
    "prompt": "A premium product photo of a green-dial steel field watch on wet dark slate, moody studio light.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-generator/ad-after.mp4",
    "aspect": "4:3",
    "alt": "A water drop splashes on the watch crystal as the camera orbits",
    "prompt": "Animate my watch photo: a water drop lands on the crystal, light sweeps across the dial, slow half-orbit. Keep the watch exactly the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-generator/ad-after.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Product photo",
   "afterLabel": "Video ad"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-generator/brand-film.webp",
   "aspect": "4:3",
   "alt": "A potter shapes a terracotta pot on the wheel in warm afternoon light",
   "prompt": "A documentary-style shot of a potter shaping wet terracotta on the wheel in her small studio, warm window light, hands in focus.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-generator/volume.webp",
   "aspect": "4:3",
   "alt": "The same green-dial watch in six settings: beach, desk, gym, picnic, nightstand, poolside",
   "prompt": "Put my watch in six scenes for ad tests: beach towel, office desk, gym bag, picnic blanket, nightstand and poolside.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "text-to-video": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/text-to-video/what.mp4",
   "aspect": "4:3",
   "alt": "A lighthouse on a cliff at dusk as waves crash below, aerial push-in",
   "prompt": "A 10s cinematic shot of a lighthouse on a cliff at dusk, waves crashing below, slow aerial push-in, moody blue light.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/text-to-video/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/text-to-video/runs-on.webp",
   "aspect": "4:3",
   "alt": "A red fox walks through deep snow in a pine forest at blue hour",
   "prompt": "A red fox stepping through deep snow in a quiet pine forest at blue hour, snowflakes drifting, nature documentary look.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/text-to-video/faq-length.webp",
   "aspect": "4:3",
   "alt": "Three frames of the lighthouse clip on a timeline marked 0 to 20 seconds",
   "prompt": "How long can a text-to-video clip be? Show my 5-second lighthouse clip on a timeline.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/text-to-video/storyboard.webp",
   "aspect": "4:3",
   "alt": "Four storyboard stills of a hiker on a Utah desert ridge at sunrise",
   "prompt": "A 4-shot concept board for an outdoor brand: a hiker on a Utah sandstone ridge at sunrise, wide, medium, shoe close-up, arm raised to the sun.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/text-to-video/b-roll.webp",
   "aspect": "4:3",
   "alt": "Aerial view of a vintage convertible on a California coastal highway",
   "prompt": "Aerial b-roll of a vintage convertible on a winding California coastal highway at golden hour, surf below the cliffs.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/text-to-video/ad-no-assets.mp4",
   "aspect": "4:3",
   "alt": "A coral running shoe splashes into a puddle in slow motion on black",
   "prompt": "A slow-motion ad: a coral running shoe stomps into a puddle on a black studio floor, crown splash, hard rim light.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/text-to-video/ad-no-assets.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "image-to-video": [
  null,
  null,
  {
   "kind": "image",
   "src": "/prototypes/site/pages/image-to-video/faq-models.webp",
   "aspect": "4:3",
   "alt": "A tote photo animated with Seedance 2.5 and a portrait animated with MiniMax H3",
   "prompt": "Which models can animate my photo? Show one product photo on Seedance 2.5 and one portrait on MiniMax H3.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-video/product-before.webp",
    "aspect": "4:3",
    "alt": "A caramel leather tote on a bentwood chair in a sunny cafe",
    "prompt": "A product photo of a caramel leather tote on a cafe chair, dappled morning light.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/image-to-video/product-after.mp4",
    "aspect": "4:3",
    "alt": "The camera slowly orbits the leather tote as leaf shadows drift",
    "prompt": "Animate my product photo: slow half-orbit around the tote while the sunlight and leaf shadows drift.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/image-to-video/product-after.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Image",
   "afterLabel": "Video"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-video/social-before.webp",
    "aspect": "4:3",
    "alt": "A young man holds a film camera on a Brooklyn rooftop",
    "prompt": "A half-body photo of a young man holding a film camera on a Brooklyn rooftop on a bright afternoon.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/image-to-video/social-after.mp4",
    "aspect": "4:3",
    "alt": "The man raises the film camera, takes a shot and smiles",
    "prompt": "Animate my photo: he raises the film camera, takes a shot, lowers it and smiles. Breeze in his shirt.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/image-to-video/social-after.webp",
    "model": "MiniMax H3",
    "modelSlug": "minimax-h3"
   },
   "beforeLabel": "Image",
   "afterLabel": "Video"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/image-to-video/storyboard-before.webp",
    "aspect": "4:3",
    "alt": "A pencil storyboard sketch of a kid on a bike with a dog",
    "prompt": "A pencil storyboard sketch: a kid on a small bike riding down a suburban street, a dog running beside him.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/image-to-video/storyboard-after.mp4",
    "aspect": "4:3",
    "alt": "The sketch rendered as a live-action shot of a kid biking with his dog",
    "prompt": "Turn my storyboard sketch into a live-action shot with the same framing: a kid bikes down a sunny suburban street with his dog.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/image-to-video/storyboard-after.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Sketch",
   "afterLabel": "Video"
  }
 ],
 "ai-video-editor": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/what-before.webp",
    "aspect": "4:3",
    "alt": "Two friends walk and laugh along a busy city sidewalk",
    "prompt": "Two friends walking and laughing along a city sidewalk, camera dollying backward.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-editor/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same two friends now walking on a beach boardwalk at sunset",
    "prompt": "In my video, replace the background with a beach boardwalk at sunset. Keep the people, motion and timing.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-editor/what-after.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Original",
   "afterLabel": "Edited"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-editor/runs-on.webp",
   "aspect": "4:3",
   "alt": "A cyclist rides across a steel bridge in thick morning fog",
   "prompt": "A cyclist crossing an old steel bridge in thick morning fog, city skyline faint behind, side tracking shot.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-video-editor/captions-cuts.mp4",
   "aspect": "4:3",
   "alt": "A cake ad cut together with text stickers and an end card",
   "prompt": "Cut my cake clips into a short ad with text stickers, quick cuts and an end card.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-video-editor/captions-cuts.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/localize-en.webp",
    "aspect": "4:3",
    "alt": "The English version of a serum ad: a dropper over a teal bottle",
    "prompt": "My English serum ad.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-editor/localize.mp4",
    "aspect": "4:3",
    "alt": "The Spanish version of the same serum ad with a Spanish voiceover",
    "prompt": "Make a Spanish version of my ad: redo the voiceover in Spanish, keep the visuals.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-editor/localize.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "English",
   "afterLabel": "Spanish"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/fix-before.webp",
    "aspect": "4:3",
    "alt": "A jogger on a park path with a trash can and a passerby behind him",
    "prompt": "A jogger running toward the camera on a park path, a trash can and a passerby in the background.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/fix-after.webp",
    "aspect": "4:3",
    "alt": "The same jogger with the trash can and passerby removed",
    "prompt": "Remove the trash can and the man in the grey hoodie. Keep everything else the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Fixed"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/season-before.webp",
    "aspect": "4:3",
    "alt": "A lit candle on a coffee table in a bright summer living room",
    "prompt": "A lit amber candle on a coffee table in front of a linen sofa, green summer trees outside the window.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-video-editor/season-after.webp",
    "aspect": "4:3",
    "alt": "The same living room turned into a snowy holiday scene",
    "prompt": "Make a holiday version: snow outside, fairy lights on the window, pine and berries. Keep the candle and room the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Summer",
   "afterLabel": "Holiday"
  }
 ],
 "faceless-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/faceless-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A paper-craft Golden Gate Bridge with a sailboat, voiceover and captions",
   "prompt": "A 30s faceless explainer about why the Golden Gate Bridge is orange: paper diorama style, voiceover and bold captions, no people.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/faceless-video-generator/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/faceless-video-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "A paper-craft volcano erupting over a tiny paper village",
   "prompt": "A paper-craft diorama of a volcano erupting with orange paper lava over a tiny paper village, for a kids science explainer.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/faceless-video-generator/own-voice.webp",
   "aspect": "4:3",
   "alt": "A desk microphone next to a voice recording card with a waveform",
   "prompt": "Record 30 seconds of my voice and use it for the narration.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/faceless-video-generator/shorts-channels.webp",
   "aspect": "4:3",
   "alt": "Four faceless Shorts covers: astronaut, clay octopus, sailing ship, stickman",
   "prompt": "Cover art for four faceless Shorts channels: space facts, clay animal facts, hand-drawn US history and stickman stoicism.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/faceless-video-generator/brand-education.mp4",
   "aspect": "4:3",
   "alt": "Collage-style animation of hands trimming herbs into a jar of water",
   "prompt": "An editorial collage animation for a kitchenware brand: 3 ways to keep fresh herbs, hands only, no faces.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/faceless-video-generator/brand-education.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/faceless-video-generator/affiliate.webp",
   "aspect": "4:3",
   "alt": "Top-down hands unboxing white wireless earbuds on an oak desk",
   "prompt": "A top-down unboxing shot of white wireless earbuds, hands only, no face, clean desk.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-caption-generator": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-caption-generator/what-before.webp",
    "aspect": "4:3",
    "alt": "A college student talks to camera at her desk, no captions",
    "prompt": "A student talking to camera at her bedroom desk.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "MiniMax H3 Max Avatar",
    "modelSlug": "minimax-h3-max-avatar"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-caption-generator/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same clip with bold word-by-word captions and yellow keywords",
    "prompt": "Add bold word-by-word captions to my video and highlight the key words in yellow.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-caption-generator/what-after.webp",
    "model": "MiniMax H3 Max Avatar",
    "modelSlug": "minimax-h3-max-avatar"
   },
   "beforeLabel": "No captions",
   "afterLabel": "Captioned"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-caption-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "A creator films himself on a phone tripod at a park picnic table",
   "prompt": "A creator filming himself on a phone tripod at a park picnic table, laughing mid-sentence, sunny day.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-caption-generator/existing-before.webp",
    "aspect": "4:3",
    "alt": "A DIY video frame of a woman leveling a floating shelf",
    "prompt": "A frame from my DIY video: leveling a floating shelf.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-caption-generator/existing-after.webp",
    "aspect": "4:3",
    "alt": "The same frame with a white-on-black subtitle",
    "prompt": "Add subtitles to the video I already have.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "My video",
   "afterLabel": "With captions"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-caption-generator/sound-off.webp",
   "aspect": "4:3",
   "alt": "A subway rider holds up a muted phone playing a captioned video",
   "prompt": "A commuter on the subway holding up a phone playing a muted video with big captions.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-caption-generator/hooks.webp",
   "aspect": "4:3",
   "alt": "One frame with three hook caption styles: bold, serif and handwritten",
   "prompt": "Try three hook styles on my opening line: bold yellow, serif italic and handwritten.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-caption-generator/shorts-before.webp",
    "aspect": "4:3",
    "alt": "A 16:9 cooking class with a chef chopping tomatoes",
    "prompt": "My 16:9 cooking class recording.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-caption-generator/shorts-after.webp",
    "aspect": "4:3",
    "alt": "The class cropped to 9:16 with bold captions",
    "prompt": "Cut my cooking class into a 9:16 short with bold captions.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "16:9 class",
   "afterLabel": "9:16 short"
  }
 ],
 "ai-b-roll-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-b-roll-generator/what.mp4",
   "aspect": "4:3",
   "alt": "Hands pour coffee into a ceramic mug in soft morning light",
   "prompt": "A 5s B-roll shot of hands pouring coffee into a mug, slow push-in, soft morning light, no faces.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-b-roll-generator/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-b-roll-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "Light trails at a downtown intersection at night from above",
   "prompt": "High-angle b-roll of a downtown intersection at night with long-exposure light trails on wet streets.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-b-roll-generator/match-before.webp",
    "aspect": "4:3",
    "alt": "A warm-toned desk vlog frame of a man talking to camera",
    "prompt": "A frame from my desk vlog: warm amber grade, brass lamp, wooden desk.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-b-roll-generator/match-after.webp",
    "aspect": "4:3",
    "alt": "Matching b-roll of hands typing on a laptop in the same tones",
    "prompt": "Make B-roll that matches my footage: hands typing on a laptop, same warm color grade and grain.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "My footage",
   "afterLabel": "Matching B-roll"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-b-roll-generator/talking-head.webp",
   "aspect": "4:3",
   "alt": "A hand writes a checklist with a fountain pen in a notebook",
   "prompt": "B-roll for a productivity video: a fountain pen writing a checklist in a dotted notebook, soft morning light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-b-roll-generator/explainers.mp4",
   "aspect": "4:3",
   "alt": "A bumblebee lands on lavender in shallow depth of field",
   "prompt": "Macro b-roll of a bee landing on lavender, very shallow depth of field, warm late-afternoon light.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-b-roll-generator/explainers.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-b-roll-generator/product-ads.mp4",
   "aspect": "4:3",
   "alt": "Serum bottle b-roll: orange slices, a hand, a dropper",
   "prompt": "Product b-roll for my serum: close-ups with orange slices, a hand picking it up and a dropper shot.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-b-roll-generator/product-ads.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "ai-short-drama": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-short-drama/what.mp4",
   "aspect": "4:3",
   "alt": "A barista finds a mystery note under a cup in a rainy cafe at closing",
   "prompt": "Episode 1 of a vertical micro-drama: a barista finds a mystery note under a cup at closing time and looks up at the door.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-short-drama/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-short-drama/runs-on.webp",
   "aspect": "4:3",
   "alt": "Two people face off in a rain-soaked parking garage at night",
   "prompt": "A tense thriller still: two people facing off in a rain-soaked parking garage at night, one holding an envelope.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-short-drama/faq-posters.webp",
   "aspect": "4:3",
   "alt": "Three micro-drama posters: The Last Order, Rent Is Due, Signal Lost",
   "prompt": "Make posters for three micro-dramas: a mystery, a roommate comedy and a sci-fi.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-short-drama/series.mp4",
   "aspect": "4:3",
   "alt": "A strawberry and a lemon argue over a picnic spot in a cartoon drama",
   "prompt": "A 2-episode cartoon drama: a strawberry and a lemon fight over the last shady picnic spot. End on \"To be continued\".",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-short-drama/series.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-short-drama/branded.mp4",
   "aspect": "4:3",
   "alt": "A couple argues in the kitchen, then opens a meal-kit box together",
   "prompt": "A branded micro-drama: a couple bickers over dinner, then opens a PANTRY CO meal kit and cooks together.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-short-drama/branded.webp",
   "model": "MiniMax H3",
   "modelSlug": "minimax-h3"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-short-drama/pilot.webp",
   "aspect": "4:3",
   "alt": "A Night Shift poster: a nurse at the end of a green-lit hospital corridor",
   "prompt": "A pilot poster for a hospital night-shift drama, cold green corridor, a nurse at the far end.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-animation-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-animation-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A cheerful 3D lemon mascot waves from a kitchen shelf",
   "prompt": "A 10s 3D cartoon animation of a cheerful lemon mascot waving from a kitchen shelf, bright colours.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-animation-generator/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-animation-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "A small white robot waters a sprout on a sunny windowsill",
   "prompt": "A 3D cartoon still of a small round robot watering a tiny sprout on a sunny windowsill.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-animation-generator/image-before.webp",
    "aspect": "4:3",
    "alt": "A child's crayon drawing of a green dinosaur on paper",
    "prompt": "A photo of my kid's crayon drawing of a green dinosaur.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-animation-generator/image-after.mp4",
    "aspect": "4:3",
    "alt": "The crayon dinosaur pops off the paper as a 3D cartoon",
    "prompt": "Bring my kid's drawing to life: the dinosaur pops out of the paper as a cute 3D cartoon and hops.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-animation-generator/image-after.webp",
    "model": "MiniMax H3",
    "modelSlug": "minimax-h3"
   },
   "beforeLabel": "Drawing",
   "afterLabel": "Animation"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-animation-generator/mascot.webp",
   "aspect": "4:3",
   "alt": "A corgi mascot in a red scarf shown in three poses",
   "prompt": "A flat vector character sheet of a corgi mascot in a red scarf: sitting, waving and trotting.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-animation-generator/explainer.webp",
   "aspect": "4:3",
   "alt": "Flat illustration of solar panels sending energy to a house battery",
   "prompt": "A flat motion-graphics frame explaining home solar: sun, roof panels, energy flowing to a battery and lamp.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-animation-generator/kids.webp",
   "aspect": "4:3",
   "alt": "A clay snail and a felt ladybug race through a vegetable garden",
   "prompt": "A claymation scene for kids: a clay snail and a felt ladybug racing through a vegetable garden.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-anime-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-anime-generator/what.mp4",
   "aspect": "4:3",
   "alt": "An anime girl on a rooftop at sunset as the camera pulls back",
   "prompt": "A 5s anime-style clip of a girl on a rooftop at sunset, wind in her hair, slow camera pull-back.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-anime-generator/what.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-anime-generator/runs-on.webp",
   "aspect": "4:3",
   "alt": "An anime girl rides a bicycle between green rice fields in summer",
   "prompt": "An anime still of a girl in a white sundress riding a bike between rice fields under huge summer clouds.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-anime-generator/photo-before.webp",
    "aspect": "4:3",
    "alt": "A young man skateboarding in a Los Angeles skatepark",
    "prompt": "A photo of a skater in a Los Angeles skatepark.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-anime-generator/photo-after.webp",
    "aspect": "4:3",
    "alt": "The same skater redrawn as an anime illustration",
    "prompt": "Turn my photo into anime. Keep the pose, outfit and background.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Anime"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-anime-generator/ad.mp4",
   "aspect": "4:3",
   "alt": "An anime guy slurps MOKU instant ramen in a late-night store",
   "prompt": "An anime-style ad: a guy slurps MOKU instant ramen in a late-night convenience store, end on the cup.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-anime-generator/ad.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-anime-generator/series.webp",
   "aspect": "4:3",
   "alt": "An original anime trio standing side by side",
   "prompt": "Character lineup for my original anime series: three teens, full body, consistent style.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-anime-generator/channel-art.webp",
   "aspect": "4:3",
   "alt": "An anime channel page with a night-city banner and a pink-haired avatar",
   "prompt": "Anime channel art: a night city skyline banner and a matching profile picture.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-dance-video": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-dance-video/what-before.webp",
    "aspect": "4:3",
    "alt": "A young woman in a varsity jacket stands in a graffiti alley",
    "prompt": "A full-body photo of a young woman in a cropped varsity jacket in a graffiti alley.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dance-video/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same woman dances a pop routine in the alley",
    "prompt": "Make the character in my photo do the dance in my video, full body, same background as the photo.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dance-video/what-after.webp",
    "model": "Kling 3.0 Motion Control",
    "modelSlug": "kling-3-motion-control"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Dance"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dance-video/runs-on.webp",
   "aspect": "4:3",
   "alt": "A breakdancer holds a one-hand freeze on a basketball court at sunset",
   "prompt": "A breakdancer holding a one-hand freeze on an outdoor basketball court at sunset, friends cheering behind.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-dance-video/photo-before.webp",
    "aspect": "4:3",
    "alt": "A dad in a red BBQ apron stands in his backyard",
    "prompt": "A full-body photo of a dad in a BBQ apron in his backyard.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dance-video/photo-after.mp4",
    "aspect": "4:3",
    "alt": "The dad dances the same routine next to the grill",
    "prompt": "Make my dad in this photo do the dance from my video, full body, same backyard.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dance-video/photo-after.webp",
    "model": "Kling 3.0 Motion Control",
    "modelSlug": "kling-3-motion-control"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Dance"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dance-video/trend.webp",
   "aspect": "4:3",
   "alt": "The same dancer in three freeze poses: boardwalk, city street, school hallway",
   "prompt": "Put the same dancer in three trend spots: a beach boardwalk, a city crossing at night and a school hallway.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dance-video/fashion.webp",
   "aspect": "4:3",
   "alt": "A model twirls in a flowing lilac maxi dress in a pastel studio",
   "prompt": "A fashion shot: a model twirling in a lilac chiffon maxi dress, skirt flaring, pastel studio.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dance-video/group.webp",
   "aspect": "4:3",
   "alt": "Four street dancers in a synchronized freeze in a parking lot at night",
   "prompt": "Four different dancers in a synchronized freeze pose in an empty parking lot at night.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-script-to-video": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-script-to-video/what.webp",
   "aspect": "4:3",
   "alt": "Four script lines next to four matching camping scenes in Yosemite",
   "prompt": "Turn my script into a video with one scene per line: a camper pitches a tent in Yosemite, stakes it, campfire at dusk, stars at night.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-script-to-video/runs-on.webp",
   "aspect": "4:3",
   "alt": "A florist arranges peonies in her small flower shop",
   "prompt": "A documentary still of a florist arranging a peony bouquet in her small shop, soft window light.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-script-to-video/faq-flow.webp",
   "aspect": "4:3",
   "alt": "A flow from script lines to scene cards to a voiceover waveform",
   "prompt": "How does script to video work? Script lines, then scenes, then voiceover and captions.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-script-to-video/product-ad.mp4",
   "aspect": "4:3",
   "alt": "A sage KIN bottle lifted from a gym bag, glowing blue, with captions",
   "prompt": "A scripted product ad for my KIN self-cleaning bottle: out of the gym bag, press the cap, drink. Voiceover and captions.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-script-to-video/product-ad.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-script-to-video/ugc.mp4",
   "aspect": "4:3",
   "alt": "A woman in a parked car reviews SOLENE SPF 50 sunscreen to camera",
   "prompt": "A UGC-style review: a woman in her car talks about SOLENE SPF 50 sunscreen, three short lines, with captions.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-script-to-video/ugc.webp",
   "model": "MiniMax H3 Max Avatar",
   "modelSlug": "minimax-h3-max-avatar"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-script-to-video/brand-explainer.webp",
   "aspect": "4:3",
   "alt": "The same bike shop owner in his workshop, on the street and in a studio",
   "prompt": "Keep my bike shop owner the same in three scenes: his workshop, the street outside and a photo studio.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-script-to-video/social-series.webp",
   "aspect": "4:3",
   "alt": "Three sourdough covers labeled Day 1, Day 2 and Day 3",
   "prompt": "Covers for my 30-day sourdough series: starter, shaped dough and finished loaf, labeled Day 1 to Day 3.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "long-video-to-shorts": [
  {
   "kind": "image",
   "src": "/prototypes/site/pages/long-video-to-shorts/what.webp",
   "aspect": "4:3",
   "alt": "A podcast episode above five vertical clips with hook titles and scores",
   "prompt": "Turn my long video into 5 vertical shorts with captions and a hook title. Pick the strongest moments.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/long-video-to-shorts/faq-sources.webp",
   "aspect": "4:3",
   "alt": "Four kinds of long video: podcast, webinar, livestream and vlog",
   "prompt": "What kind of long video works best? Podcasts, webinars, livestreams and vlogs.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/long-video-to-shorts/livestream-before.webp",
    "aspect": "4:3",
    "alt": "A 16:9 shopping livestream with a host holding a black handbag",
    "prompt": "My 2-hour shopping livestream replay.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/long-video-to-shorts/livestream-after.webp",
    "aspect": "4:3",
    "alt": "A 9:16 clip of the host with a bold caption about the bag",
    "prompt": "Cut my livestream into a 9:16 clip with a caption about the bag.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Livestream",
   "afterLabel": "Short"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/long-video-to-shorts/webinar-before.webp",
    "aspect": "4:3",
    "alt": "A webinar slide with a speaker picture-in-picture",
    "prompt": "My webinar recording: slides with the speaker in the corner.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/long-video-to-shorts/webinar-after.webp",
    "aspect": "4:3",
    "alt": "A 9:16 split with the speaker on top and the slide below",
    "prompt": "Turn my webinar into a 9:16 short: speaker on top, slide below, bold caption.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Webinar",
   "afterLabel": "Short"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/long-video-to-shorts/podcast.mp4",
   "aspect": "4:3",
   "alt": "A vertical podcast clip that cuts to whoever is speaking, with captions",
   "prompt": "Turn my podcast into a vertical short that follows whoever is talking, with word-by-word captions.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/long-video-to-shorts/podcast.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "ai-video-extender": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-extender/what-before.mp4",
    "aspect": "4:3",
    "alt": "Original 5-second clip of a runner crossing a rooftop at sunset",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-extender/what-before-poster.webp",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-extender/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same rooftop shot extended to 10 seconds: the runner keeps going and stops at the edge above the skyline",
    "prompt": "Continue my video for 5s: the runner keeps jogging toward the skyline and stops at the edge. Same camera, no cuts.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-extender/what-after-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Original · 5s",
   "afterLabel": "Extended · 10s"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-extender/models.webp",
   "aspect": "4:3",
   "alt": "A red vintage convertible on a winding Pacific coast highway at sunset",
   "prompt": "Cinematic wide shot of a vintage red convertible on a winding Pacific coast highway at sunset, the road stretching ahead.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-video-extender/faq.webp",
   "aspect": "4:3",
   "alt": "Three frames from one extended clip labeled 0s, 5s where the original ends, and 10s",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-extender/use1-before.mp4",
    "aspect": "4:3",
    "alt": "A 5-second serum dropper close-up over a glass bowl on an orange backdrop",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-extender/use1-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-video-extender/use1-after.mp4",
    "aspect": "4:3",
    "alt": "The same close-up extended to 10 seconds as the camera pulls back to orange slices",
    "prompt": "Continue my video for 5s: golden serum drips into the bowl, then the camera pulls back to show orange slices. No cuts.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-video-extender/use1-after-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Original · 5s",
   "afterLabel": "Extended · 10s"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-video-extender/use2.mp4",
   "aspect": "4:3",
   "alt": "A slow push-in across a bathroom counter that ends with an amber serum bottle centered in frame",
   "prompt": "Continue my video for 5s: the camera keeps pushing in and the product ends centered in frame.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-video-extender/use2-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-video-extender/use3.mp4",
   "aspect": "4:3",
   "alt": "A woman sits at a sidewalk cafe and a waiter brings a latte with heart art, extended from a walking shot",
   "prompt": "Continue my video: she sits down, a waiter brings a latte with heart art, and the camera pushes in on the cup.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-video-extender/use3-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "ai-camera-control": [
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-camera-control/what-before.webp",
    "aspect": "4:3",
    "alt": "Product photo of a square NOIRE perfume bottle on white marble in morning light",
    "prompt": "A perfume bottle on a marble counter, soft morning light.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-camera-control/what-after.mp4",
    "aspect": "4:3",
    "alt": "The camera slowly arcs around the NOIRE perfume bottle while it stays still",
    "prompt": "A perfume bottle on a marble counter, soft morning light. The product stays still while the camera moves.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-camera-control/what-after-poster.webp",
    "model": "MiniMax H3 Max Camera Controls",
    "modelSlug": "minimax-h3-max-camera-controls"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Orbit"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-camera-control/models.webp",
   "aspect": "4:3",
   "alt": "A film crew with a camera crane and dolly track shooting a mint-green vintage pickup at a desert motel at dusk",
   "prompt": "Behind the scenes of a small film crew at a desert motel at dusk: camera crane and dolly track aimed at a mint-green vintage pickup.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-camera-control/faq.webp",
   "aspect": "4:3",
   "alt": "Six camera angles of the same diner scene: wide, medium, close-up, over the shoulder, top-down and low angle",
   "prompt": "Show this diner scene from 6 camera angles: wide, medium, close-up, over the shoulder, top-down and low angle.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-camera-control/use1.mp4",
   "aspect": "4:3",
   "alt": "A slow push-in on the NOIRE perfume bottle until the glass fills the frame",
   "prompt": "Slow push in on my perfume bottle until the cap and glass fill the frame. The bottle doesn't move.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-camera-control/use1-poster.webp",
   "model": "MiniMax H3 Max Camera Controls",
   "modelSlug": "minimax-h3-max-camera-controls"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-camera-control/use2-before.webp",
    "aspect": "4:3",
    "alt": "Listing photo of a mid-century desert home with a pool in Palm Springs at sunset",
    "prompt": "Real estate photo of a mid-century desert home in Palm Springs at sunset with a pool.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-camera-control/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The camera cranes up from the pool deck to reveal the house and glowing mountains",
    "prompt": "Crane up from the pool deck to reveal the house and the mountains at sunset.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-camera-control/use2-after-poster.webp",
    "model": "MiniMax H3 Max Camera Controls",
    "modelSlug": "minimax-h3-max-camera-controls"
   },
   "beforeLabel": "Listing photo",
   "afterLabel": "Crane up"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-camera-control/use3.webp",
   "aspect": "4:3",
   "alt": "A shot list of three camera moves: orbit, push in and crane up",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  }
 ],
 "ai-dubbing": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dubbing/what-before.mp4",
    "aspect": "4:3",
    "alt": "A man in a kitchen holds up a serum bottle and talks to the camera in English",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dubbing/what-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dubbing/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same clip dubbed into Spanish with matching lip movement",
    "prompt": "Read this in a warm, confident Spanish voice at a natural pace: Este sérum cambió mi rutina. Lo uso cada mañana y mi piel se siente increíble.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dubbing/what-after-poster.webp",
    "model": "MiniMax H3 Max Lip Sync",
    "modelSlug": "minimax-h3-max-lip-sync"
   },
   "beforeLabel": "English",
   "afterLabel": "Spanish"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dubbing/models.webp",
   "aspect": "4:3",
   "alt": "A voice actor with headphones speaking into a studio microphone in a warm sound booth",
   "prompt": "A voice actor with headphones speaking into a studio microphone in a cozy sound booth, side view.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dubbing/faq.webp",
   "aspect": "4:3",
   "alt": "Three steps: upload the English video, check the translated Spanish script and pick a voice, export the dubbed video",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-dubbing/use1.mp4",
   "aspect": "4:3",
   "alt": "One creator video played in English, then Spanish, then French, each lip-synced",
   "prompt": "Dub my video into Spanish and French with a natural voice and matching lips.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-dubbing/use1-poster.webp",
   "model": "MiniMax H3 Max Lip Sync",
   "modelSlug": "minimax-h3-max-lip-sync"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dubbing/use2-before.mp4",
    "aspect": "4:3",
    "alt": "A woman holds up a serum bottle and talks to the camera in English on a sunny balcony",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dubbing/use2-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-dubbing/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The same woman speaking Spanish in her own cloned voice with matching lips",
    "prompt": "Clone my voice and dub this into Spanish: Este sérum cambió mi rutina. Lo uso cada mañana y mi piel se ve increíble.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-dubbing/use2-after-poster.webp",
    "model": "MiniMax H3 Max Lip Sync",
    "modelSlug": "minimax-h3-max-lip-sync"
   },
   "beforeLabel": "Her voice · English",
   "afterLabel": "Her voice · Spanish"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-dubbing/use3.webp",
   "aspect": "4:3",
   "alt": "A woman presents a sage-green blender in her kitchen, with an EN to FR label and a French caption",
   "prompt": "Dub my blender explainer from English into French with a warm, clear voice.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "ai-music-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-music-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A woman with a dark bob sings into a vintage microphone on a Brooklyn rooftop at night, with an AI-made synth-pop song",
   "prompt": "Make a music video: a synth-pop song about summer in the city with female vocals, then neon city night scenes in a moody, cinematic style.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-music-video-generator/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-music-video-generator/models.webp",
   "aspect": "4:3",
   "alt": "A young music producer playing a synthesizer in a small home studio lit purple and amber",
   "prompt": "A young music producer playing a synthesizer in a home studio at night, purple and amber neon glow.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-music-video-generator/faq.mp4",
   "aspect": "4:3",
   "alt": "Album cover for the AI-made song Summer Static, a rooftop city skyline with a neon palm sign, playing the 30-second song",
   "prompt": "Write and produce a 30-second synth-pop song about summer in the city with bright female vocals.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-music-video-generator/faq-poster.webp",
   "model": "ElevenLabs Music v2.5",
   "modelSlug": "elevenlabs-music-v2-5"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-music-video-generator/use1.mp4",
   "aspect": "4:3",
   "alt": "A man in a denim jacket plays acoustic guitar and sings in a red barn doorway at golden hour, with an AI folk-country song",
   "prompt": "A folk-country song with male vocals and acoustic guitar, and a video of him singing in a Texas barn doorway at golden hour.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-music-video-generator/use1-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-music-video-generator/use2.mp4",
   "aspect": "4:3",
   "alt": "A hand picks up a SUNNE lemon soda can on a beach picnic blanket, set to a bright AI jingle",
   "prompt": "A 15-second jingle for my lemon soda SUNNE, with a sunny beach picnic video of the can.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-music-video-generator/use2-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/ai-music-video-generator/use3.mp4",
   "aspect": "4:3",
   "alt": "The rooftop music video with big white lyric words SUMMER, IN THE, CITY over it",
   "prompt": "Turn my song into a lyric clip with big words over the video.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/ai-music-video-generator/use3-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  }
 ],
 "motion-control": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/motion-control/what-before.mp4",
    "aspect": "4:3",
    "alt": "Dance reference clip: a woman in a white tee and jeans dances in a grey studio",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/motion-control/what-before-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/motion-control/what-after.mp4",
    "aspect": "4:3",
    "alt": "A woman in streetwear on a Los Angeles rooftop at sunset follows the same dance moves",
    "prompt": "Make the character in my photo follow the moves in my dance clip. Keep the original sound.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/motion-control/what-after-poster.webp",
    "model": "Kling 3.0 Motion Control",
    "modelSlug": "kling-3-motion-control"
   },
   "beforeLabel": "Dance clip",
   "afterLabel": "Your character"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/motion-control/models.webp",
   "aspect": "4:3",
   "alt": "Three dancers mid-move in a sunlit Los Angeles parking garage",
   "prompt": "Three young dancers mid-move in a sunlit LA parking garage, matching choreography, full bodies in frame.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/motion-control/faq-before.webp",
    "aspect": "4:3",
    "alt": "A still photo of a smiling grandfather in a burgundy cardigan in his living room",
    "prompt": "Full-body photo of a cheerful grandfather in a burgundy cardigan standing in his living room.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/motion-control/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same grandfather mid-dance, copying the trend moves",
    "prompt": "Make my grandpa's photo dance to this trend clip.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Kling 3.0 Motion Control",
    "modelSlug": "kling-3-motion-control"
   },
   "beforeLabel": "Photo",
   "afterLabel": "Dancing"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/motion-control/use1.mp4",
   "aspect": "4:3",
   "alt": "One dance trend side by side: the reference dancer, a rooftop dancer and a grandfather doing the same moves",
   "prompt": "Make my photos do this dance trend.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/motion-control/use1-poster.webp",
   "model": "Kling 3.0 Motion Control",
   "modelSlug": "kling-3-motion-control"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/motion-control/use2-before.mp4",
    "aspect": "4:3",
    "alt": "Reference clip: a man opens a small camping lantern and holds it up",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/motion-control/use2-before-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/motion-control/use2-after.mp4",
    "aspect": "4:3",
    "alt": "A seller in a sage linen shirt repeats the same product demo moves",
    "prompt": "Make the seller in my photo copy this product demo: open the lantern and hold it up to the camera.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/motion-control/use2-after-poster.webp",
    "model": "Kling 3.0 Motion Control",
    "modelSlug": "kling-3-motion-control"
   },
   "beforeLabel": "Demo clip",
   "afterLabel": "Your seller"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/motion-control/use3.mp4",
   "aspect": "4:3",
   "alt": "An original cartoon dinosaur mascot in a purple cap does the same dance",
   "prompt": "Make my cartoon mascot follow the moves in my dance clip.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/motion-control/use3-poster.webp",
   "model": "Kling 3.0 Motion Control",
   "modelSlug": "kling-3-motion-control"
  }
 ],
 "3d-to-video": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/what-before.mp4",
    "aspect": "4:3",
    "alt": "Grey 3D blockout of a motorcycle rider on a coastal road with a moving camera",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/what-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same shot rendered as a realistic motorcycle ride along a sunset coastal highway",
    "prompt": "Render my 3D blockout as a realistic shot: the grey blocks are a motorcycle on a coastal highway at sunset. Keep the camera move.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/what-after-poster.webp",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "beforeLabel": "3D blockout",
   "afterLabel": "Realistic"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/3d-to-video/models.mp4",
   "aspect": "4:3",
   "alt": "A skier in a red jacket carving down a sunny mountain slope, rendered from a 3D layout",
   "prompt": "Render my 3D layout as a realistic shot: a skier in a red jacket carving down a sunny slope. Keep the camera move.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/3d-to-video/models-poster.webp",
   "model": "Seedance 2.5",
   "modelSlug": "seedance-2-5"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/3d-to-video/faq-before.webp",
    "aspect": "4:3",
    "alt": "Grey 3D layout of a skier jumping between white peaks",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/3d-to-video/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same frame as a realistic skier in a yellow jacket mid-jump",
    "prompt": "Turn this 3D render into a realistic ski shot.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "beforeLabel": "3D render",
   "afterLabel": "Realistic"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use1-before.mp4",
    "aspect": "4:3",
    "alt": "Grey mannequins blocking a sword duel in a bamboo forest",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use1-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use1-after.mp4",
    "aspect": "4:3",
    "alt": "The same blocking as a misty samurai duel in a bamboo forest",
    "prompt": "Render my previz as the final shot: two samurai duel in a misty bamboo forest. Keep the blocking and camera.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use1-after-poster.webp",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "beforeLabel": "Previz",
   "afterLabel": "Final shot"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use2-before.mp4",
    "aspect": "4:3",
    "alt": "Grey 3D sports car driving down a palm-lined street",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use2-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The same move as a glossy red sports car on a neon Miami street at sunset",
    "prompt": "Render my 3D car blockout as a hero shot: a red sports car on a neon beachfront street at sunset. Keep the camera move.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use2-after-poster.webp",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "beforeLabel": "3D blockout",
   "afterLabel": "Hero shot"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use3-before.mp4",
    "aspect": "4:3",
    "alt": "Grey 3D layout of a helicopter chasing a motorbike down a beach road",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use3-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/3d-to-video/use3-after.mp4",
    "aspect": "4:3",
    "alt": "The same chase rendered with a real helicopter and motorbike on a wet neon street at dusk",
    "prompt": "Render my blockout as a realistic chase: a helicopter follows a motorbike down a neon beach road at dusk. Keep the camera move.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/3d-to-video/use3-after-poster.webp",
    "model": "Seedance 2.5",
    "modelSlug": "seedance-2-5"
   },
   "beforeLabel": "3D blockout",
   "afterLabel": "Realistic"
  }
 ],
 "upscale-video": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/what-before.mp4",
    "aspect": "4:3",
    "alt": "A blurry 360p clip of a woman opening a box on her bed in warm light",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/what-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same clip upscaled to 4K with sharp hair, skin and fabric detail",
    "prompt": "Upscale my clip to 4K and keep the motion smooth.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/what-after-poster.webp",
    "model": "SeedVR Upscale Video",
    "modelSlug": "seedvr-upscale-video"
   },
   "beforeLabel": "360p",
   "afterLabel": "4K"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-video/faq-before.webp",
    "aspect": "4:3",
    "alt": "100% crop of the low-res frame: soft face and hair",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/upscale-video/faq-after.webp",
    "aspect": "4:3",
    "alt": "The same crop after 4K upscaling: sharp eyes, hair and necklace",
    "prompt": "Upscale my clip to 4K.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "SeedVR Upscale Video",
    "modelSlug": "seedvr-upscale-video"
   },
   "beforeLabel": "Before",
   "afterLabel": "4K"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/use1-before.mp4",
    "aspect": "4:3",
    "alt": "A soft low-res AI clip of a glass bottle in a field of pink flowers",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/use1-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/use1-after.mp4",
    "aspect": "4:3",
    "alt": "The same AI clip upscaled to 1080p with crisp petals and a bee",
    "prompt": "Upscale my AI video to 1080p.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/use1-after-poster.webp",
    "model": "SeedVR Upscale Video",
    "modelSlug": "seedvr-upscale-video"
   },
   "beforeLabel": "360p",
   "afterLabel": "1080p"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/use2-before.mp4",
    "aspect": "4:3",
    "alt": "A low-res phone selfie video of a man next to his scooter helmet",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/use2-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/upscale-video/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The same phone video upscaled to 1080p",
    "prompt": "Upscale my phone video to 1080p and keep it natural.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/upscale-video/use2-after-poster.webp",
    "model": "SeedVR Upscale Video",
    "modelSlug": "seedvr-upscale-video"
   },
   "beforeLabel": "480p",
   "afterLabel": "1080p"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/upscale-video/use3.webp",
   "aspect": "4:3",
   "alt": "A hotel lobby with a giant LED video wall showing a car parked at dusk",
   "prompt": "Show my upscaled clip on a giant LED video wall in a bright hotel lobby.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "claude-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/claude-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A neutral AI chat: the user uploads a mug photo and asks for a 9:16 ad, and the finished video plays beside the chat",
   "prompt": "Make a 10-second 9:16 video ad of this product photo with Seedance 2.5.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/claude-video-generator/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/claude-video-generator/faq.webp",
   "aspect": "4:3",
   "alt": "Three steps: open Settings, add a custom connector with the BuzzVideo MCP address, then ask for a video in chat",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/claude-video-generator/use1.webp",
   "aspect": "4:3",
   "alt": "Chat where a 3-line ad script becomes a 3-shot plan with thumbnails",
   "prompt": "Here's my script. Turn it into a 9:16 ad with 3 shots.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/claude-video-generator/use2-before.webp",
    "aspect": "4:3",
    "alt": "Product photo of a forest-green TRAILCO water bottle",
    "prompt": "Product photo of a forest-green insulated water bottle on a clean background.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/claude-video-generator/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The TRAILCO bottle on a granite summit as mist drifts over pine-covered peaks",
    "prompt": "Make a 5-second 9:16 video of this bottle on a mountain summit at sunrise.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/claude-video-generator/use2-after-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Product photo",
   "afterLabel": "Video"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/claude-video-generator/use3.webp",
   "aspect": "4:3",
   "alt": "Chat listing reusable BuzzVideo skills: Product Ad, UGC Product Review, Unboxing UGC, Link to Ad, Marketplace Listing, Ad Localizer",
   "prompt": "What BuzzVideo workflows can I reuse every week?",
   "source": "AIGC dev 接口 2026-11-25"
  }
 ],
 "chatgpt-video-generator": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/chatgpt-video-generator/what.mp4",
   "aspect": "4:3",
   "alt": "A neutral AI chat: @BuzzVideo asks for the product photo first, then an earbuds unboxing video plays beside the chat",
   "prompt": "@BuzzVideo Make a 15-second 9:16 unboxing video of my product. Ask me to upload the product photo first.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/chatgpt-video-generator/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/chatgpt-video-generator/faq.webp",
   "aspect": "4:3",
   "alt": "Typing @Buzz in a chat brings up the BuzzVideo app picker above an earlier candle video result",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/chatgpt-video-generator/use1.webp",
   "aspect": "4:3",
   "alt": "Chat that writes 3 ad hooks for HALO earbuds, then turns hook 2 into a video",
   "prompt": "Write 3 hooks for my earbuds ad, then make #2 into a 9:16 video.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/chatgpt-video-generator/use2.mp4",
   "aspect": "4:3",
   "alt": "Chat that reads a candle product page link, then plays the candle video with a lit match",
   "prompt": "@BuzzVideo Turn this product page into a 5-second video.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/chatgpt-video-generator/use2-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/chatgpt-video-generator/use3.webp",
   "aspect": "4:3",
   "alt": "Chat asking for a creator-style earbuds video, with a hook script and a vertical video of a young man showing the case in his bedroom",
   "prompt": "@BuzzVideo Make a creator-style video of my earbuds: a guy in his bedroom talking to his phone camera, casual and excited.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  }
 ],
 "video-generation-mcp": [
  {
   "kind": "video",
   "src": "/prototypes/site/pages/video-generation-mcp/what.mp4",
   "aspect": "4:3",
   "alt": "A dark developer chat asks for the product photo, then a UGC review of the CHEWBO dog toy plays beside it",
   "prompt": "Use BuzzVideo to make a 15-second 9:16 UGC review video of my product with Seedance 2.5. Ask me for the product photo first.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/video-generation-mcp/what-poster.webp",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/video-generation-mcp/faq.webp",
   "aspect": "4:3",
   "alt": "Client list (Claude, ChatGPT, Cursor, Codex, VS Code, any MCP client) and the BuzzVideo MCP config snippet",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/video-generation-mcp/use1.webp",
   "aspect": "4:3",
   "alt": "Agent chat calling buzzvideo.generate_video and returning 3 ad variants",
   "prompt": "Make 3 ad variants of my product video, each with a different opening shot.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Seedance 2.5 Flash",
   "modelSlug": "seedance-2-5-flash"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/video-generation-mcp/use2-before.webp",
    "aspect": "4:3",
    "alt": "Product photo of an olive waxed-canvas FIELDNOTE backpack",
    "prompt": "Product photo of an olive waxed-canvas backpack with leather straps.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/video-generation-mcp/use2-after.mp4",
    "aspect": "4:3",
    "alt": "A commuter wears the FIELDNOTE backpack on a sunlit subway platform",
    "prompt": "Make a 5-second 9:16 video of this backpack on a commuter at a subway platform.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/video-generation-mcp/use2-after-poster.webp",
    "model": "Seedance 2.5 Flash",
    "modelSlug": "seedance-2-5-flash"
   },
   "beforeLabel": "Product photo",
   "afterLabel": "Video"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/video-generation-mcp/use3.webp",
   "aspect": "4:3",
   "alt": "Four workflow cards with video covers: UGC Review, Unboxing, Product Ad, Product Listing, each with a short prompt",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  }
 ],
 "ai-face-swap": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-face-swap/what-before.mp4",
    "aspect": "4:3",
    "alt": "A woman in a white bathrobe talks about a serum at her bathroom vanity",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-face-swap/what-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-face-swap/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same video with a different woman from a reference photo, same gestures and bathroom",
    "prompt": "Swap the person in my video for the character in my photo. Keep the motion, camera and background.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-face-swap/what-after-poster.webp",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Original",
   "afterLabel": "Swapped"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-face-swap/models.webp",
   "aspect": "4:3",
   "alt": "A phone on a tripod with a ring light facing a marble bathroom vanity with skincare jars",
   "prompt": "A creator's filming setup in a bright bathroom: phone on a tripod with a ring light facing a marble vanity, nobody in frame.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-face-swap/faq-before.webp",
    "aspect": "4:3",
    "alt": "Reference portrait of a woman in a white waffle bathrobe",
    "prompt": "Portrait of a woman in her late 20s in a white waffle bathrobe, soft bathroom daylight.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-face-swap/faq-after.webp",
    "aspect": "4:3",
    "alt": "A frame of the swapped video featuring the woman from the reference photo",
    "prompt": "Swap the person in my video for the woman in this photo.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Your photo",
   "afterLabel": "Swapped video"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-face-swap/use1-before.mp4",
    "aspect": "4:3",
    "alt": "A model in a cobalt satin shirt holds a serum and an orange slice on a blue backdrop",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-face-swap/use1-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/ai-face-swap/use1-after.mp4",
    "aspect": "4:3",
    "alt": "The same product ad with a different model, same outfit and moves",
    "prompt": "Swap the model in my product ad for the woman in my photo. Keep the product and the moves.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/ai-face-swap/use1-after-poster.webp",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Original model",
   "afterLabel": "New model"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-face-swap/use2.webp",
   "aspect": "4:3",
   "alt": "A 2×2 grid of the same UGC frame with four different women: Original, Version A, B and C",
   "prompt": "Make 3 versions of my UGC ad with different people. Keep everything else the same.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-face-swap/use3-before.webp",
    "aspect": "4:3",
    "alt": "Brand campaign photo: a bearded man in a rust flannel sits on a pickup tailgate at a mountain campsite holding an enamel mug",
    "prompt": "Brand photo of a man on a pickup tailgate at a mountain campsite at golden hour, holding an enamel camping mug.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/ai-face-swap/use3-after.webp",
    "aspect": "4:3",
    "alt": "The same campaign photo with a grey-bearded older man, same shirt, mug and campsite",
    "prompt": "Swap the person in my brand photo for an older man with a grey beard. Keep everything else the same.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Original",
   "afterLabel": "Swapped"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/ai-face-swap/use4.webp",
   "aspect": "4:3",
   "alt": "Three ad thumbnails labeled US, UK and Canada, each with a different person",
   "prompt": "",
   "source": "AIGC dev 接口 2026-11-25"
  }
 ],
 "video-face-swap": [
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/video-face-swap/what-before.mp4",
    "aspect": "4:3",
    "alt": "A skateboarder in a white tee rolls down a golden-hour street",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/video-face-swap/what-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/video-face-swap/what-after.mp4",
    "aspect": "4:3",
    "alt": "The same shot with a woman in a mustard hoodie riding instead, same move and street",
    "prompt": "Replace the rider in my video with the character in my photo. Keep the motion and the scene.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/video-face-swap/what-after-poster.webp",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Original",
   "afterLabel": "Replaced"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/video-face-swap/models.webp",
   "aspect": "4:3",
   "alt": "Two cyclists in bright jerseys riding along a coastal road at golden hour",
   "prompt": "Two cyclists in bright jerseys on a coastal road at golden hour, shot from a following car.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/video-face-swap/faq-before.webp",
    "aspect": "4:3",
    "alt": "Reference photo of a woman skateboarder in a mustard hoodie and olive cargo pants",
    "prompt": "Full-body photo of a young woman skateboarder in a mustard hoodie and olive cargo pants on a sunny street.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/video-face-swap/faq-after.webp",
    "aspect": "4:3",
    "alt": "A frame of the video with her riding the skateboard",
    "prompt": "Replace the person in my video with the woman in this photo.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Your photo",
   "afterLabel": "In the video"
  },
  {
   "kind": "image",
   "src": "/prototypes/site/pages/video-face-swap/use1.webp",
   "aspect": "4:3",
   "alt": "The same skate shot with three different riders labeled US, Japan and UK",
   "prompt": "Make versions of my video with a local rider for Japan and the UK.",
   "source": "AIGC dev 接口 2026-11-25",
   "model": "Nano Banana 2.1",
   "modelSlug": "nano-banana-2-1"
  },
  {
   "before": {
    "kind": "video",
    "src": "/prototypes/site/pages/video-face-swap/use2-before.mp4",
    "aspect": "4:3",
    "alt": "A woman shows a travel neck pillow in an airplane seat, selfie style",
    "prompt": "",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/video-face-swap/use2-before-poster.webp"
   },
   "after": {
    "kind": "video",
    "src": "/prototypes/site/pages/video-face-swap/use2-after.mp4",
    "aspect": "4:3",
    "alt": "The same UGC video with a bearded man in a grey sweater instead",
    "prompt": "Replace the creator in my video with the man in my photo. Keep the pillow and the gestures.",
    "source": "AIGC dev 接口 2026-11-25",
    "poster": "/prototypes/site/pages/video-face-swap/use2-after-poster.webp",
    "model": "MiniMax H3 Max Recast",
    "modelSlug": "minimax-h3-max-recast"
   },
   "beforeLabel": "Original creator",
   "afterLabel": "New creator"
  },
  {
   "kind": "video",
   "src": "/prototypes/site/pages/video-face-swap/use3.mp4",
   "aspect": "4:3",
   "alt": "A 3D cartoon raccoon mascot in a teal hoodie rides the skateboard down the same street",
   "prompt": "Replace the rider in my video with my raccoon mascot. Keep the motion and the scene.",
   "source": "AIGC dev 接口 2026-11-25",
   "poster": "/prototypes/site/pages/video-face-swap/use3-poster.webp",
   "model": "MiniMax H3 Max Recast",
   "modelSlug": "minimax-h3-max-recast"
  },
  {
   "before": {
    "kind": "image",
    "src": "/prototypes/site/pages/video-face-swap/use4-before.webp",
    "aspect": "4:3",
    "alt": "A woman in a lilac running set jogs along the Santa Monica beach boardwalk in the morning",
    "prompt": "A runner jogging toward the camera on a beach boardwalk in the morning, palm trees behind.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "after": {
    "kind": "image",
    "src": "/prototypes/site/pages/video-face-swap/use4-after.webp",
    "aspect": "4:3",
    "alt": "The same boardwalk shot with a man in a navy tee running instead",
    "prompt": "Refresh my running video with a new runner. Keep the boardwalk and the moves.",
    "source": "AIGC dev 接口 2026-11-25",
    "model": "Nano Banana 2.1",
    "modelSlug": "nano-banana-2-1"
   },
   "beforeLabel": "Last month",
   "afterLabel": "Refreshed"
  }
 ]
};
