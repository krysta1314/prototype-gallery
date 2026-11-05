// 自动生成:python3 scripts/gen-model-map.py(来源 docs/marketing-agent/skills/video-*/SKILL.md)。不要手改。
import type { MapModel } from "./types";

export const VIDEO_MODELS: MapModel[] = [
 {
  "name": "Seedance 2.5",
  "key": "seedance-2.5",
  "provider": "BytePlus",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + at least one reference_image / reference_video / reference_audio (audio alone is allowed)"
     },
     {
      "k": "Optional",
      "v": "more references up to the limits"
     },
     {
      "k": "Params",
      "v": "omni_reference_task_type: \"reference\" (or auto, the default), ratio, resolution, duration, generate_audio"
     }
    ],
    "isDefault": true
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + one image with role: \"first_frame\" (or no role)"
     },
     {
      "k": "Optional",
      "v": "one image with role: \"last_frame\""
     },
     {
      "k": "Params",
      "v": "ratio (use adaptive), duration, resolution, generate_audio"
     }
    ],
    "isDefault": true
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + one reference_video (source, 4–30s)"
     },
     {
      "k": "Optional",
      "v": "reference_image for the target object"
     },
     {
      "k": "Params",
      "v": "omni_reference_task_type: \"edit\", ratio: \"adaptive\" (required), duration: -1 (required)"
     }
    ],
    "isDefault": true
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + at least one reference_video"
     },
     {
      "k": "Optional",
      "v": "more reference_video items to bridge into"
     },
     {
      "k": "Params",
      "v": "omni_reference_task_type: \"extend\", ratio: \"adaptive\" (required), duration"
     }
    ],
    "isDefault": true
   }
  ],
  "settings": [
   {
    "k": "Aspect ratio (First & Last Frame)",
    "v": "ratio · only adaptive — follows the first frame; product shows \"Follows your first frame\" · default adaptive · First & Last Frame"
   },
   {
    "k": "(backend)",
    "v": "watermark · always false · default false · —"
   },
   {
    "k": "(backend)",
    "v": "return_last_frame · true when the user will chain the next shot from this one (\"Use last frame\") · default false · —"
   },
   {
    "k": "(not supported on 2.x)",
    "v": "seed, camera_fixed, frames, service_tier: flex · Seedance 1.x only — never send · default — · —"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "4–30s, step 1, product default 5s. -1 = model decides (the product never offers this for generation — only Edit sends -1); Edit must use -1 (output follows the source, may differ by ~0.3s). Extend: duration is set by the user; whether it is the new segment or total length — To confirm (sd25-pe treats it as the extension length)."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 21:9 / adaptive (product \"Auto\"). Edit and Extend must be adaptive. With a first frame, the output ratio follows the first image — use adaptive."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p / 1080p"
   },
   {
    "k": "Audio",
    "v": "generate_audio (product \"With Audio\" toggle). API default true; output audio is mono."
   },
   {
    "k": "Images",
    "v": "1–30 (Omni Reference); 300–6000px per side, aspect 0.4–2.5, < 30MB each"
   },
   {
    "k": "Videos",
    "v": "≤ 10 clips, each 2–30s, total ≤ 30s; mp4/mov, 24–60fps, ≤ 200MB each. Edit source 4–30s."
   },
   {
    "k": "Audio files",
    "v": "≤ 10 clips, each 2–30s, total ≤ 30s; wav/mp3, ≤ 15MB each. Audio-only Omni Reference is allowed."
   },
   {
    "k": "Extras",
    "v": "Not offered in the product (dropped 2026-11-05): draft, output_format — always send mp4, no draft. API reference: draft: true (480p only draft, then a draft_task with the draft id, valid 14 days); return_last_frame: true (clean last frame to chain the next shot); output_format: \"mov\" (2.5 only); asset://<ASSET_ID> URLs for licensed digital characters / authorised real people; seed, callback_url, execution_expires_after."
   },
   {
    "k": "Price",
    "v": "Billed by BytePlus per token: (input video seconds + output seconds) × resolution; requests with video input run at ~0.6× the per-token rate. Product credit price — To confirm."
   }
  ]
 },
 {
  "name": "Seedance 2.0",
  "key": "seedance-2.0",
  "provider": "BytePlus",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + at least one reference_image or reference_video"
     },
     {
      "k": "Optional",
      "v": "reference_audio (only alongside an image or video)"
     },
     {
      "k": "Params",
      "v": "ratio, resolution, duration, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + one image with role: \"first_frame\" (or no role)"
     },
     {
      "k": "Optional",
      "v": "one image with role: \"last_frame\""
     },
     {
      "k": "Params",
      "v": "ratio (use adaptive), duration, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Edit @Video1: …\" + one reference_video (2–15s)"
     },
     {
      "k": "Optional",
      "v": "reference_image for the target object"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration: -1"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Extend @Video1: …\" + one reference_video (≤15s)"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "(backend)",
    "v": "watermark · always false · default false · —"
   },
   {
    "k": "(backend)",
    "v": "return_last_frame · true when the user will chain the next shot from this one (\"Use last frame\") · default false · —"
   },
   {
    "k": "(not supported on 2.x)",
    "v": "seed, camera_fixed, frames, service_tier: flex · Seedance 1.x only — never send · default — · —"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "4–15s, step 1, product default 5s. -1 = model decides (the product never offers this for generation — only Edit sends -1) / follows the source (use for Edit). Extend: whether duration is the new segment or the total — To confirm."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 21:9 / adaptive (product \"Auto\"). Use adaptive for Edit, Extend and frame modes."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p / 1080p / 4K (API string is lowercase 4k; 4K output is 10-bit H.265)."
   },
   {
    "k": "Audio",
    "v": "generate_audio (product \"With Audio\" toggle). API default true; output audio is mono."
   },
   {
    "k": "Images",
    "v": "≤ 9 (Omni Reference); 300–6000px per side, aspect 0.4–2.5, < 30MB each"
   },
   {
    "k": "Videos",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; mp4/mov, 24–60fps, ≤ 200MB each. Edit source 2–15s; Extend source ≤ 15s."
   },
   {
    "k": "Audio files",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; wav/mp3, ≤ 15MB each. Must come with at least one image or video."
   },
   {
    "k": "Extend direction",
    "v": "The product UI offers no direction choice for 2.0 — write a forward continuation. Backward support on 2.0 — To confirm."
   },
   {
    "k": "Extras",
    "v": "return_last_frame: true (chain shots); asset://<ASSET_ID> for licensed characters / authorised real people; seed, callback_url, execution_expires_after. No Draft mode, no MOV output (2.5 only)."
   },
   {
    "k": "Price",
    "v": "BytePlus bills per token: (input video seconds + output seconds) × resolution; video-input requests ~0.6× per token. Product credit price — To confirm."
   }
  ]
 },
 {
  "name": "Seedance 2.0 Fast",
  "key": "seedance-2.0-fast",
  "provider": "BytePlus",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + at least one reference_image or reference_video"
     },
     {
      "k": "Optional",
      "v": "reference_audio (only alongside an image or video)"
     },
     {
      "k": "Params",
      "v": "ratio, resolution, duration, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + one image with role: \"first_frame\" (or no role)"
     },
     {
      "k": "Optional",
      "v": "one image with role: \"last_frame\""
     },
     {
      "k": "Params",
      "v": "ratio (use adaptive), duration, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Edit @Video1: …\" + one reference_video (2–15s)"
     },
     {
      "k": "Optional",
      "v": "reference_image for the target object"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration: -1"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Extend @Video1: …\" + one reference_video (≤15s)"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "(backend)",
    "v": "watermark · always false · default false · —"
   },
   {
    "k": "(backend)",
    "v": "return_last_frame · true when the user will chain the next shot from this one (\"Use last frame\") · default false · —"
   },
   {
    "k": "(not supported on 2.x)",
    "v": "seed, camera_fixed, frames, service_tier: flex · Seedance 1.x only — never send · default — · —"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "4–15s, step 1, product default 5s. -1 = model decides (the product never offers this for generation — only Edit sends -1) / follows the source (use for Edit). Extend: whether duration is the new segment or the total — To confirm."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 21:9 / adaptive (product \"Auto\"). Use adaptive for Edit, Extend and frame modes."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p"
   },
   {
    "k": "Audio",
    "v": "generate_audio (product \"With Audio\" toggle). API default true; output audio is mono."
   },
   {
    "k": "Images",
    "v": "≤ 9 (Omni Reference); 300–6000px per side, aspect 0.4–2.5, < 30MB each"
   },
   {
    "k": "Videos",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; mp4/mov, 24–60fps, ≤ 200MB each. Edit source 2–15s; Extend source ≤ 15s."
   },
   {
    "k": "Audio files",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; wav/mp3, ≤ 15MB each. Must come with at least one image or video."
   },
   {
    "k": "Extend direction",
    "v": "The product UI offers no direction choice for 2.0 — write a forward continuation. Backward support on 2.0 — To confirm."
   },
   {
    "k": "Extras",
    "v": "return_last_frame: true (chain shots); asset://<ASSET_ID> for licensed characters / authorised real people; seed, callback_url, execution_expires_after. No Draft mode, no MOV output (2.5 only)."
   },
   {
    "k": "Price",
    "v": "BytePlus bills per token: (input video seconds + output seconds) × resolution; video-input requests ~0.6× per token. Product credit price — To confirm."
   }
  ]
 },
 {
  "name": "Seedance 2.0 Mini",
  "key": "seedance-2.0-mini",
  "provider": "BytePlus",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + at least one reference_image or reference_video"
     },
     {
      "k": "Optional",
      "v": "reference_audio (only alongside an image or video)"
     },
     {
      "k": "Params",
      "v": "ratio, resolution, duration, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text + one image with role: \"first_frame\" (or no role)"
     },
     {
      "k": "Optional",
      "v": "one image with role: \"last_frame\""
     },
     {
      "k": "Params",
      "v": "ratio (use adaptive), duration, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Edit @Video1: …\" + one reference_video (2–15s)"
     },
     {
      "k": "Optional",
      "v": "reference_image for the target object"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration: -1"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": ".../contents/generations/tasks"
     },
     {
      "k": "Required",
      "v": "text starting \"Extend @Video1: …\" + one reference_video (≤15s)"
     },
     {
      "k": "Params",
      "v": "ratio: \"adaptive\", duration"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "(backend)",
    "v": "watermark · always false · default false · —"
   },
   {
    "k": "(backend)",
    "v": "return_last_frame · true when the user will chain the next shot from this one (\"Use last frame\") · default false · —"
   },
   {
    "k": "(not supported on 2.x)",
    "v": "seed, camera_fixed, frames, service_tier: flex · Seedance 1.x only — never send · default — · —"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "4–15s, step 1, product default 5s. -1 = model decides (the product never offers this for generation — only Edit sends -1) / follows the source (use for Edit). Extend: whether duration is the new segment or the total — To confirm."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 21:9 / adaptive (product \"Auto\"). Use adaptive for Edit, Extend and frame modes."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p"
   },
   {
    "k": "Audio",
    "v": "generate_audio (product \"With Audio\" toggle). API default true; output audio is mono."
   },
   {
    "k": "Images",
    "v": "≤ 9 (Omni Reference); 300–6000px per side, aspect 0.4–2.5, < 30MB each"
   },
   {
    "k": "Videos",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; mp4/mov, 24–60fps, ≤ 200MB each. Edit source 2–15s; Extend source ≤ 15s."
   },
   {
    "k": "Audio files",
    "v": "≤ 3 clips, each 2–15s, total ≤ 15s; wav/mp3, ≤ 15MB each. Must come with at least one image or video."
   },
   {
    "k": "Extend direction",
    "v": "The product UI offers no direction choice for 2.0 — write a forward continuation. Backward support on 2.0 — To confirm."
   },
   {
    "k": "Extras",
    "v": "return_last_frame: true (chain shots); asset://<ASSET_ID> for licensed characters / authorised real people; seed, callback_url, execution_expires_after. No Draft mode, no MOV output (2.5 only)."
   },
   {
    "k": "Price",
    "v": "BytePlus bills per token: (input video seconds + output seconds) × resolution; video-input requests ~0.6× per token. Product credit price — To confirm."
   }
  ]
 },
 {
  "name": "Kling 4.0",
  "key": "kling-4.0",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "kling/v4/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt or multi_prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio (16:9 / 9:16 / 1:1 / 21:9), resolution"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "kling/v4/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of image_urls / video_urls / elements"
     },
     {
      "k": "Optional",
      "v": "voice_ids, start_image_url, end_image_url"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio (auto / 16:9 / 9:16 / 1:1 / 21:9), resolution"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "kling/v4/image-to-video (start given) · kling/v4/reference-to-video (end frame only)"
     },
     {
      "k": "Required",
      "v": "start_image_url (image-to-video) or end_image_url alone (reference-to-video)"
     },
     {
      "k": "Optional",
      "v": "end_image_url"
     },
     {
      "k": "Params",
      "v": "image-to-video has no aspect_ratio (follows the start frame)"
     }
    ]
   },
   {
    "name": "Keyframes",
    "params": [
     {
      "k": "Endpoint",
      "v": "kling/v4/image-to-video · kling/v4/reference-to-video when reference images are added"
     },
     {
      "k": "Required",
      "v": "start_image_url, end_image_url, middle_image_urls (1–8, ordered)"
     },
     {
      "k": "Optional",
      "v": "image_urls (reference endpoint only)"
     },
     {
      "k": "Params",
      "v": "frames + references ≤10 images total on the reference endpoint"
     }
    ],
    "isDefault": true
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "kling/v4/video-to-video/edit"
     },
     {
      "k": "Required",
      "v": "video_url (source, 3–30s), prompt"
     },
     {
      "k": "Optional",
      "v": "image_urls, extra reference videos (≤4), elements (≤7), voice_ids (≤3)"
     },
     {
      "k": "Params",
      "v": "duration omitted = same as source (or 3–30s), resolution"
     }
    ]
   },
   {
    "name": "(voice prep, not a mode)",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/create-voice"
     },
     {
      "k": "Required",
      "v": "voice_url (5–30s clean single-speaker audio or video)"
     },
     {
      "k": "Params",
      "v": "returns voice_id"
     }
    ]
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "3–30s, step 1s, default 5s. multi_prompt: each shot 1–30s, total 3–30s. Edit: omit = matches source."
   },
   {
    "k": "Aspect ratio",
    "v": "Text-to-video: 16:9 / 9:16 / 1:1 / 21:9. Reference-to-video: adds auto. Image-to-video: no parameter (follows start frame). Edit: follows source video."
   },
   {
    "k": "Resolution",
    "v": "720p / 1080p (generation and edit)."
   },
   {
    "k": "Audio",
    "v": "No toggle. Voices only via voice_id (≤3)."
   },
   {
    "k": "Omni Reference files",
    "v": "Images ≤10; reference videos ≤5, each 3–30s; reference videos + element videos ≤30s total; elements ≤7 (≤3 with a voice, ≤3 built from a video); voices ≤3; no audio files."
   },
   {
    "k": "Elements",
    "v": "Each = 1 frontal image + 1–3 extra-angle images, or one 3–8s video."
   },
   {
    "k": "Edit files",
    "v": "Source 3–30s (= @Video1), ≤300MB, 700–4553px, 24–60fps; extra reference videos ≤4 (from @Video2); all videos ≤30s total."
   },
   {
    "k": "Image files",
    "v": "Start frame ≤30MB, ≥300px, aspect 0.4–2.5."
   },
   {
    "k": "Voice clone",
    "v": "5–30s, one speaker, clean voice."
   },
   {
    "k": "Region",
    "v": "None documented."
   }
  ]
 },
 {
  "name": "Kling 3.0 Omni",
  "key": "kling-3.0-omni",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/o3/pro/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt or multi_prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, generate_audio, shot_type"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/o3/pro/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + images and/or elements"
     },
     {
      "k": "Optional",
      "v": "≤1 reference video; element voice_id"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/o3/pro/image-to-video"
     },
     {
      "k": "Required",
      "v": "start frame (required)"
     },
     {
      "k": "Optional",
      "v": "end frame"
     },
     {
      "k": "Params",
      "v": "duration, generate_audio; no aspect ratio (follows the start frame)"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/o3/pro/video-to-video/edit"
     },
     {
      "k": "Required",
      "v": "video_url (source 3–15s), prompt"
     },
     {
      "k": "Optional",
      "v": "image_urls, elements"
     },
     {
      "k": "Params",
      "v": "keep_audio (default true); no duration — output follows the source"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Resolution (quality tier)",
    "v": "endpoint tier · 720p → o3/standard/*, 1080p → o3/pro/*, 4K → o3/4k/* · default 1080p · all modes"
   },
   {
    "k": "Keep Original Audio",
    "v": "keep_audio · true / false · default true · Edit Video"
   },
   {
    "k": "Smart multi-shot",
    "v": "shot_type · customize / intelligent · default customize · Multi-shot on"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "\"3\"–\"15\" (string), step 1s, product default 5s. Multi-shot shots 1–15s, total 3–15s."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 on text- and reference-to-video (no auto). Image-to-video and edit have no ratio field — they follow the input."
   },
   {
    "k": "Resolution",
    "v": "Quality tier by endpoint: 720p (o3/standard), 1080p (o3/pro), 4K (o3/4k)."
   },
   {
    "k": "Audio",
    "v": "generate_audio, default off. Edit keeps the original sound by default."
   },
   {
    "k": "Omni Reference files",
    "v": "Reference video ≤1, passed as an element video_url, 3–10.05s, 720–2160px, 24–60fps, ≤200MB. With a video: images + elements ≤4. No audio files."
   },
   {
    "k": "First & Last Frame files",
    "v": "Start frame required (≥300px, ratio 0.4–2.5, ≤50MB), end frame optional."
   },
   {
    "k": "Edit files",
    "v": "Source mp4/mov, 3–15.05s, 720–3840px, 23–60fps, ≤200MB."
   },
   {
    "k": "Region",
    "v": "None documented."
   }
  ],
  "isNew": true
 },
 {
  "name": "Kling 3.0",
  "key": "kling-3.0",
  "provider": "kie",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "kie kling-3.0/video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Optional",
      "v": "kling_elements, multi_shots"
     },
     {
      "k": "Params",
      "v": "duration, aspect ratio, mode, sound"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "kie kling-3.0/video"
     },
     {
      "k": "Required",
      "v": "image_urls[0] = start frame"
     },
     {
      "k": "Optional",
      "v": "image_urls[1] = end frame; kling_elements (≤3)"
     },
     {
      "k": "Params",
      "v": "duration, aspect ratio, mode (std / pro / 4K), sound"
     }
    ]
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "3–15s, step 1s, default 5s. Multi-shot: each shot 1–12s, ≤5 shots, total 3–15s."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1. No auto. With a start frame the output follows the frame."
   },
   {
    "k": "Resolution",
    "v": "720p / 1080p / 4K via mode std / pro / 4K."
   },
   {
    "k": "Audio",
    "v": "sound (required boolean, no default — always send it). Sound on costs more in std / pro."
   },
   {
    "k": "Files",
    "v": "Start frame 1 (required), end frame 1 (optional). Elements ≤3, each 2–4 images or 1 video, optionally + 5–30s audio as the element's voice. Element images JPG/PNG ≤10MB; element video MP4/MOV ≥3s, segment used 3–8s (start_time / end_time in ms). Frame image size limits: To confirm."
   },
   {
    "k": "Region",
    "v": "None documented."
   }
  ]
 },
 {
  "name": "Kling 3.0 Motion Control",
  "key": "kling-3.0-motion",
  "provider": "fal",
  "modes": [
   {
    "name": "Motion Control",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/v3/pro/motion-control"
     },
     {
      "k": "Required",
      "v": "image_url (character), video_url (motion), character_orientation"
     },
     {
      "k": "Optional",
      "v": "prompt (required or optional: To confirm), keep_original_sound, elements (max 1, face)"
     },
     {
      "k": "Params",
      "v": "character_orientation: \"video\" or \"image\"; keep_original_sound default true"
     }
    ],
    "isNew": true,
    "isDefault": true
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "No parameter. Output length follows the motion video (product config). Motion video ≤30s (video orientation) / ≤10s (image orientation). Minimum motion video length: To confirm."
   },
   {
    "k": "Aspect ratio",
    "v": "No parameter; follows the inputs. Which input (image or video) sets the frame: To confirm."
   },
   {
    "k": "Resolution",
    "v": "No parameter. Output resolution: To confirm."
   },
   {
    "k": "Audio",
    "v": "No generate toggle. keep_original_sound (default true) keeps the motion video's audio."
   },
   {
    "k": "Character image",
    "v": "Character must fill >5% of the frame, body clearly visible and not blocked. Size / px / format limits: To confirm."
   },
   {
    "k": "Motion video",
    "v": "Must show a complete full body, or upper body including the head. Size / fps / format limits: To confirm."
   },
   {
    "k": "Elements",
    "v": "Max 1 (face), video orientation only."
   },
   {
    "k": "Region",
    "v": "None documented."
   }
  ],
  "isNew": true,
  "note": "只在工具页用(Video › Motion Control),不在 Video Gen 模型列表里"
 },
 {
  "name": "Kling LipSync",
  "key": "kling-lipsync",
  "provider": "fal",
  "modes": [
   {
    "name": "Lip Sync — Audio file",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/lipsync/audio-to-video"
     },
     {
      "k": "Required",
      "v": "video_url (2–10s, with a face), audio_url (2–60s)"
     },
     {
      "k": "Params",
      "v": "none; length follows the source video"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Lip Sync — Typed script",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/lipsync/text-to-video"
     },
     {
      "k": "Required",
      "v": "video_url, text, voice_id (preset)"
     },
     {
      "k": "Params",
      "v": "voice_language (zh / en), voice_speed (0.8–2)"
     }
    ],
    "isNew": true,
    "isDefault": true
   }
  ],
  "settings": [
   {
    "k": "Language",
    "v": "voice_language · English → en, Chinese → zh · default English · Typed script"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "Follows the source video (2–10s)."
   },
   {
    "k": "Aspect ratio / resolution",
    "v": "Follow the source video; no parameters."
   },
   {
    "k": "Video",
    "v": "mp4/mov, ≤100MB, 2–10s, 720p/1080p (720–1920px each side), one clear face."
   },
   {
    "k": "Audio",
    "v": "2–60s, ≤5MB."
   },
   {
    "k": "Typed script",
    "v": "Length limit: To confirm. Languages zh / en."
   },
   {
    "k": "Voices",
    "v": "46 presets; voice_speed 0.8–2 (product 0.8x / 1x / 1.2x / 1.5x / 2x)."
   }
  ],
  "isNew": true,
  "note": "只在工具页用(Avatar › Lip Sync),不在 Video Gen 模型列表里"
 },
 {
  "name": "Kling AI Avatar v2 Pro",
  "key": "kling-avatar",
  "provider": "fal",
  "modes": [
   {
    "name": "Talking Avatar",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/kling-video/ai-avatar/v2/pro"
     },
     {
      "k": "Required",
      "v": "image_url (person, animal or cartoon), audio_url"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "none; length follows the audio"
     }
    ],
    "isNew": true,
    "isDefault": true
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "Follows the audio. Audio length / size limits: To confirm."
   },
   {
    "k": "Aspect ratio / resolution",
    "v": "Follow the photo; no parameters."
   },
   {
    "k": "Image",
    "v": "One subject photo (person, animal or cartoon). Size limits: To confirm."
   },
   {
    "k": "Variants",
    "v": "ai-avatar/v2/standard exists — not offered in product."
   }
  ],
  "isNew": true,
  "note": "只在工具页用(Avatar › Talking Avatar),不在 Video Gen 模型列表里"
 },
 {
  "name": "Wan 3.0",
  "key": "wan-3.0",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, audio, enable_prompt_expansion"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0/image-to-video"
     },
     {
      "k": "Required",
      "v": "start_image_url"
     },
     {
      "k": "Optional",
      "v": "end_image_url (only with a start frame), prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio (use adaptive), resolution, audio"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of: reference_image_urls, reference_video_urls, reference_audio_urls, web_url, file_url"
     },
     {
      "k": "Optional",
      "v": "the rest of those"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, audio, enable_thinking (must be true with web_url / file_url)"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Thinking",
    "v": "enable_thinking · true / false · default false — forced true when web_url or file_url is sent · all modes"
   },
   {
    "k": "Prompt Enhance",
    "v": "enable_prompt_expansion · true / false (off saves 20–60s) · default true · all modes"
   },
   {
    "k": "Smart Duration",
    "v": "duration: null · on → the model picks the length · default off · all modes"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "2–30s, integer step 1 in the product, default 5s. The API also accepts null = the model picks the length (\"smart duration\")."
   },
   {
    "k": "Aspect ratio",
    "v": "adaptive / 16:9 / 9:16 / 1:1 / 4:3 / 3:4. adaptive shows as Auto in the product (follows the input)."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p / 1080p"
   },
   {
    "k": "Audio",
    "v": "audio (boolean) — whether the output has sound. Product toggle \"With Audio\". Default: To confirm for Wan 3.0 (Wan 3.0 Prime, same schema, defaults to on)."
   },
   {
    "k": "Files (Omni Reference)",
    "v": "Images ≤10. Videos ≤5, ≤15s in total, each ≥16fps; input video length is also billed. Audio ≤5, ≤15s in total. Optional web_url (public page) or file_url (document). Per-file size / pixel limits: To confirm."
   },
   {
    "k": "Files (First & Last Frame)",
    "v": "1 start image (required) + 1 end image (optional). Image size / pixel limits: To confirm."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   }
  ]
 },
 {
  "name": "Wan 3.0 Prime",
  "key": "wan-3.0-prime",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0-prime/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, audio, enable_prompt_expansion"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0-prime/image-to-video"
     },
     {
      "k": "Required",
      "v": "start_image_url"
     },
     {
      "k": "Optional",
      "v": "end_image_url (only with a start frame), prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio (use adaptive), resolution, audio"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "alibaba/wan-3.0-prime/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of: reference_image_urls, reference_video_urls, reference_audio_urls, web_url, file_url"
     },
     {
      "k": "Optional",
      "v": "the rest of those"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, audio, enable_thinking (must be true with web_url / file_url)"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Thinking",
    "v": "enable_thinking · true / false · default false — forced true when web_url or file_url is sent · all modes"
   },
   {
    "k": "Prompt Enhance",
    "v": "enable_prompt_expansion · true / false (off saves 20–60s) · default true · all modes"
   },
   {
    "k": "Smart Duration",
    "v": "duration: null · on → the model picks the length · default off · all modes"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "2–30s, integer step 1 in the product, default 5s. API also accepts null = model picks the length."
   },
   {
    "k": "Aspect ratio",
    "v": "adaptive / 16:9 / 9:16 / 1:1 / 4:3 / 3:4. adaptive = Auto in the product."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p / 1080p"
   },
   {
    "k": "Audio",
    "v": "audio (boolean), default on. Product toggle \"With Audio\"."
   },
   {
    "k": "Files (Omni Reference)",
    "v": "Images ≤10. Videos ≤5, ≤15s in total, each ≥16fps (Wan 3.0 rule; same schema). Audio ≤5, ≤15s in total. Optional web_url or file_url. Per-file size / pixel limits: To confirm."
   },
   {
    "k": "Files (First & Last Frame)",
    "v": "1 start image (required) + 1 end image (optional). Size / pixel limits: To confirm."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   }
  ],
  "isNew": true
 },
 {
  "name": "Gemini Omni Flash",
  "key": "omni-flash",
  "provider": "Google",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "/v1beta/interactions"
     },
     {
      "k": "Required",
      "v": "text + ≥ 1 reference image or video"
     },
     {
      "k": "Optional",
      "v": "more images (product cap 10; API limit not documented), ≤ 3 videos of ≤ 3s each"
     },
     {
      "k": "Params",
      "v": "task: \"reference_to_video\", response_format.aspect_ratio, resolution"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "/v1beta/interactions"
     },
     {
      "k": "Required",
      "v": "text + first-frame image"
     },
     {
      "k": "Optional",
      "v": "last-frame image (only with a first frame)"
     },
     {
      "k": "Params",
      "v": "two images in order first → last; say in the prompt which is the first and which is the last frame"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "/v1beta/interactions"
     },
     {
      "k": "Required",
      "v": "text + uploaded video (≤ 10s) or previous_interaction_id"
     },
     {
      "k": "Optional",
      "v": "reference images (describe each one's job in words)"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "/v1beta/interactions"
     },
     {
      "k": "Required",
      "v": "text + uploaded video (≤ 10s) or previous_interaction_id"
     },
     {
      "k": "Optional",
      "v": "an image to steer where the scene goes"
     },
     {
      "k": "Params",
      "v": "forward only, 3–10s per call"
     }
    ]
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "No API field. Product offers 4 / 6 / 8 / 10s (default 4s). Express the chosen length with timecodes in the prompt that end at that second (e.g. 8s → [0-3s] … [3-6s] … [6-8s] …). How the product enforces/trims the final length — To confirm. Extend adds 3–10s per call, cumulative ≤ 40s."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 only (response_format.aspect_ratio). No Auto."
   },
   {
    "k": "Resolution",
    "v": "360p / 720p (default) / 1080p (upscaled) / 4k (upscaled, lowercase)."
   },
   {
    "k": "Audio",
    "v": "Generated by default; no toggle. Ask for music/SFX or \"no music, silent\" in the prompt."
   },
   {
    "k": "Images",
    "v": "Reference image count not documented (product cap 10). Some images of identifiable real people are rejected. In UK/EEA/Switzerland, images containing minors are not supported."
   },
   {
    "k": "Videos",
    "v": "Reference: ≤ 3 clips, ≤ 3s each. Edit / Extend source: ≤ 10s (product minimum 1s)."
   },
   {
    "k": "Audio files",
    "v": "Not supported."
   },
   {
    "k": "Language",
    "v": "Only English is fully supported."
   },
   {
    "k": "Region",
    "v": "Extending an uploaded video: unavailable in UK, EEA, Switzerland — product greys it out for UK users with a reason. Editing an uploaded video: \"not available in all regions\" (regions not listed). Videos the model generated itself (via previous_interaction_id) are not region-limited."
   },
   {
    "k": "Price",
    "v": "Product credit price — To confirm."
   }
  ]
 },
 {
  "name": "MiniMax H3 Max",
  "key": "h3-max",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Optional",
      "v": "target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/image-to-video"
     },
     {
      "k": "Required",
      "v": "image_url or end_image_url (either or both)"
     },
     {
      "k": "Optional",
      "v": "prompt, target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, resolution, prompt_expansion_mode (no aspect_ratio: follows the frame)"
     }
    ]
   },
   {
    "name": "First & Last Frame + reference files",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/reference-to-video"
     },
     {
      "k": "Required",
      "v": "image_url and/or end_image_url + reference_image_urls (and/or video/audio refs)"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Keyframes",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/reference-to-video"
     },
     {
      "k": "Required",
      "v": "image_url + middle_image_url + middle_frame_time + end_image_url"
     },
     {
      "k": "Optional",
      "v": "reference_image_urls (≤9), prompt"
     },
     {
      "k": "Params",
      "v": "duration, resolution (480P / 768P only), prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of reference_image_urls / reference_video_urls / reference_audio_urls — or reference_conditions"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/extend-video"
     },
     {
      "k": "Required",
      "v": "video_url"
     },
     {
      "k": "Optional",
      "v": "prompt, reference audio ≤3 (field name: To confirm)"
     },
     {
      "k": "Params",
      "v": "duration (= seconds added), output, aspect_ratio, resolution, enable_prompt_expansion"
     }
    ]
   },
   {
    "name": "Talking Avatar",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/lip-sync/image-to-video"
     },
     {
      "k": "Required",
      "v": "image_url (person photo), audio_url (speech)"
     },
     {
      "k": "Optional",
      "v": "— (product shows an optional prompt; whether the API takes prompt: To confirm)"
     },
     {
      "k": "Params",
      "v": "enable_transcription, resolution 480P/768P/1080P/2K"
     }
    ],
    "isNew": true
   },
   {
    "name": "Camera Control",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/camera-controls"
     },
     {
      "k": "Required",
      "v": "image_url (start frame) + free_camera_preset or camera_trajectory"
     },
     {
      "k": "Optional",
      "v": "prompt (empty = scene fully still)"
     },
     {
      "k": "Params",
      "v": "duration, resolution, prompt_expansion_mode; product option Camera Move"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Reframe",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/reframe-video"
     },
     {
      "k": "Required",
      "v": "video_url, aspect_ratio"
     },
     {
      "k": "Optional",
      "v": "prompt (what to fill at the edges)"
     },
     {
      "k": "Params",
      "v": "resolution; product option New Aspect Ratio"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Relight",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/relight"
     },
     {
      "k": "Required",
      "v": "video_url, reference_image_url (lighting reference)"
     },
     {
      "k": "Optional",
      "v": "— (product shows an optional prompt; API prompt: To confirm)"
     },
     {
      "k": "Params",
      "v": "aspect_ratio (adaptive), resolution"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Recast",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/recast"
     },
     {
      "k": "Required",
      "v": "video_url, reference_image_urls (1–4 people)"
     },
     {
      "k": "Optional",
      "v": "prompt (who replaces whom)"
     },
     {
      "k": "Params",
      "v": "enhance_realism, resolution"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Insert Shot",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/insert-video"
     },
     {
      "k": "Required",
      "v": "video_url, start_time, resume_time, duration"
     },
     {
      "k": "Optional",
      "v": "prompt (always write one; whether the API requires it: To confirm), reference_image_urls (≤9), reference videos ≤3 (field name: To confirm)"
     },
     {
      "k": "Params",
      "v": "color_match (default true), resolution 480p/768p; product options New Shot Starts At, New Shot Length"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "3D to Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/3d-to-video"
     },
     {
      "k": "Required",
      "v": "video_url (3D render / previz)"
     },
     {
      "k": "Optional",
      "v": "prompt, reference_image_urls (≤8), max_generated_reference_images"
     },
     {
      "k": "Params",
      "v": "resolution"
     }
    ],
    "isNew": true,
    "isDefault": true
   },
   {
    "name": "Style Presets",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max/styles/{vhs, hand-drawn, retro-toon-70s, 16bit-pixel, low-poly}"
     },
     {
      "k": "Required",
      "v": "prompt (required in the product)"
     },
     {
      "k": "Optional",
      "v": "image_url (start frame)"
     },
     {
      "k": "Params",
      "v": "duration, damage_level (VHS only); product options Style, Tape Damage"
     }
    ],
    "isNew": true,
    "isDefault": true
   }
  ],
  "settings": [
   {
    "k": "Prompt Enhance",
    "v": "prompt_expansion_mode · Off → disabled, Balanced → balanced (~1s), Quality → quality (≤30s) · default Balanced · First & Last Frame, Keyframes, Omni Reference, Camera Control"
   },
   {
    "k": "Output",
    "v": "output · Full video → extended, New part only → continuation · default Full video · Extend Video"
   },
   {
    "k": "Prompt Enhance",
    "v": "enable_prompt_expansion · true / false · default true · Extend Video"
   },
   {
    "k": "Resolution (Extend)",
    "v": "resolution · 480P / 768P / 1080P / 2K · default — · Extend Video"
   },
   {
    "k": "Read The Speech",
    "v": "enable_transcription · On / Off (off for audio with lots of non-speech sound) · default On · Talking Avatar"
   },
   {
    "k": "Enhance Realism",
    "v": "enhance_realism · Off / On · default Off · Recast"
   },
   {
    "k": "Color Match",
    "v": "color_match · On / Off · default On · Insert Shot"
   },
   {
    "k": "Looks To Generate",
    "v": "max_generated_reference_images · 1–8 (ignored when reference images are given) · default 2 · 3D to Video"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "API: decimal 0.92–15s (generation, Camera Control); output may run ~0.7s longer. Product: 1–15s, whole seconds, default 5s. Extend: adds 0.71–15s. Style Presets: integer 5–15s. Insert Shot new shot: 5–13s (product: 5 / 7 / 9 / 11 / 13s)."
   },
   {
    "k": "Aspect ratio",
    "v": "21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16, plus adaptive on reference-to-video (= Auto in the product). image-to-video has no ratio (follows the frame). Extend: auto in the example. Reframe adds 9:21. Style Presets ignore aspect_ratio when a start frame is given."
   },
   {
    "k": "Resolution",
    "v": "Generation: 480P / 768P / 1080P (Keyframes: 480P / 768P only). Extend: up to 2K. Talking Avatar: 480P / 768P / 1080P / 2K. Camera Control default 480P. Insert Shot 480p / 768p. Style Presets fixed 768p. Reframe / Relight / Recast / 3D to Video: full option lists To confirm."
   },
   {
    "k": "Audio",
    "v": "No generate-audio toggle. Whether plain generation outputs sound: To confirm. Soundtrack via target_audio_url. Style Presets output has sound. Reframe keeps the original audio."
   },
   {
    "k": "Files — Omni Reference",
    "v": "Images ≤9, videos ≤3, audio ≤3, ≤12 files total; each video/audio clip 2–15s; videos ≤15s in total, audio ≤15s in total. Audio-only is allowed."
   },
   {
    "k": "Files — frames",
    "v": "1 start + 1 end; Keyframes adds exactly 1 middle frame. Image size / pixel limits: To confirm."
   },
   {
    "k": "Files — Extend",
    "v": "Source 1.625–60s, ≤50MB. Up to 3 reference audio clips."
   },
   {
    "k": "Files — special modes",
    "v": "Talking Avatar: photo ratio 0.4–2.5; speech ≥5s, ≤15 min. Camera Control: 1 image; trajectory 2–12 points. Reframe: video 0.25–300s. Relight: video ≤15s (≥ about 2.33s; converted to 24fps) + 1 lighting image. Recast: video 5–30s, each single shot ≤15s, 1–4 people photos. Insert Shot: video ≤60s, ≤50MB, start_time ≥1.625s, refs ≤9 images / ≤3 videos. 3D to Video: render ≤15s, ≤32 shots, refs ≤8 images. Style Presets: 0–1 start frame."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   },
   {
    "k": "Price notes in source",
    "v": "Insert Shot: $0.05/s at 480p, $0.06/s at 768p, billed on the new shot only. Others: To confirm."
   }
  ],
  "note": "Video Gen 里只有生成模式 + Camera Control / Style Presets;Talking Avatar、Reframe、Relight、Recast、3D to Video 是独立工具页;Insert Shot 不做(剪辑器能做)"
 },
 {
  "name": "MiniMax H3 Max Turbo",
  "key": "h3-max-turbo",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Optional",
      "v": "target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/image-to-video"
     },
     {
      "k": "Required",
      "v": "image_url or end_image_url (either or both)"
     },
     {
      "k": "Optional",
      "v": "prompt, target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, resolution, prompt_expansion_mode (no aspect_ratio: follows the frame)"
     }
    ]
   },
   {
    "name": "First & Last Frame + reference files",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/reference-to-video"
     },
     {
      "k": "Required",
      "v": "image_url and/or end_image_url + reference_image_urls (and/or video/audio refs)"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Keyframes",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/reference-to-video"
     },
     {
      "k": "Required",
      "v": "image_url + middle_image_url + middle_frame_time + end_image_url"
     },
     {
      "k": "Optional",
      "v": "reference_image_urls (≤9), prompt"
     },
     {
      "k": "Params",
      "v": "duration, resolution (480P / 768P only), prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of reference_image_urls / reference_video_urls / reference_audio_urls — or reference_conditions"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3-max-turbo/extend-video"
     },
     {
      "k": "Required",
      "v": "video_url"
     },
     {
      "k": "Optional",
      "v": "prompt, reference audio ≤3 (field name: To confirm)"
     },
     {
      "k": "Params",
      "v": "duration (= seconds added), output, aspect_ratio, resolution, enable_prompt_expansion"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Prompt Enhance",
    "v": "prompt_expansion_mode · Off → disabled, Balanced → balanced, Quality → quality · default Balanced · First & Last Frame, Keyframes, Omni Reference"
   },
   {
    "k": "Output",
    "v": "output · Full video → extended, New part only → continuation · default Full video · Extend Video"
   },
   {
    "k": "Prompt Enhance",
    "v": "enable_prompt_expansion · true / false · default true · Extend Video"
   },
   {
    "k": "Resolution (Extend)",
    "v": "resolution · 480P / 768P / 1080P / 2K · default — · Extend Video"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "API decimal 0.92–15s; output may run ~0.7s longer. Product: 1–15s, whole seconds, default 5s. Extend adds 0.71–15s."
   },
   {
    "k": "Aspect ratio",
    "v": "21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16, plus adaptive on reference-to-video (= Auto). image-to-video follows the frame. Extend: auto (as in the H3 Max example)."
   },
   {
    "k": "Resolution",
    "v": "480P / 768P / 1080P; Keyframes 480P / 768P only; Extend up to 2K."
   },
   {
    "k": "Audio",
    "v": "No generate-audio toggle. Whether plain generation outputs sound: To confirm. Soundtrack via target_audio_url."
   },
   {
    "k": "Files — Omni Reference",
    "v": "Images ≤9, videos ≤3, audio ≤3, ≤12 total; each video/audio clip 2–15s; ≤15s in total per type. Audio-only allowed."
   },
   {
    "k": "Files — frames",
    "v": "1 start + 1 end (+1 middle for Keyframes). Image size limits: To confirm."
   },
   {
    "k": "Files — Extend",
    "v": "Source 1.625–60s, ≤50MB; up to 3 reference audio clips."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   }
  ],
  "isNew": true
 },
 {
  "name": "MiniMax H3",
  "key": "h3",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Optional",
      "v": "target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3/image-to-video"
     },
     {
      "k": "Required",
      "v": "image_url or end_image_url (either or both)"
     },
     {
      "k": "Optional",
      "v": "prompt, target_audio_url"
     },
     {
      "k": "Params",
      "v": "duration, resolution, prompt_expansion_mode (ratio follows the frame)"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "minimax/h3/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + at least one of reference_image_urls / reference_video_urls / reference_audio_urls"
     },
     {
      "k": "Params",
      "v": "duration, aspect_ratio, resolution, prompt_expansion_mode"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Prompt Enhance",
    "v": "prompt_expansion_mode · Off → disabled, Balanced → balanced, Quality → quality · default Balanced · all modes"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "Integer 5–15s, default 5s (product step 1)."
   },
   {
    "k": "Aspect ratio",
    "v": "adaptive / 21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 (adaptive = Auto). image-to-video follows the frame (no ratio sent)."
   },
   {
    "k": "Resolution",
    "v": "480P / 768P native; 2K / 4K are upscaled from 768P."
   },
   {
    "k": "Audio",
    "v": "No generate-audio toggle. Whether plain generation outputs sound: To confirm. Soundtrack via target_audio_url."
   },
   {
    "k": "Files — Omni Reference",
    "v": "Images ≤9, videos ≤3, audio ≤3, ≤12 total; each video/audio clip 2–15s; ≤15s in total per type. Audio-only allowed."
   },
   {
    "k": "Files — frames",
    "v": "1 start + 1 end (both optional, at least one). Image size limits: To confirm."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   }
  ]
 },
 {
  "name": "Vidu Q3 Pro",
  "key": "vidu-q3",
  "provider": "fal",
  "modes": [
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/vidu/q3/reference-to-video/mix"
     },
     {
      "k": "Required",
      "v": "prompt + 1–4 reference images"
     },
     {
      "k": "Params",
      "v": "aspect ratio, resolution, duration, audio"
     }
    ]
   },
   {
    "name": "First & Last Frame",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/vidu/q3/image-to-video"
     },
     {
      "k": "Required",
      "v": "first-frame image + prompt"
     },
     {
      "k": "Optional",
      "v": "last-frame image"
     },
     {
      "k": "Params",
      "v": "resolution (not 360p with a last frame), duration, audio; no aspect-ratio parameter (follows the first frame)"
     }
    ]
   },
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "fal-ai/vidu/q3/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "aspect ratio, resolution, duration, audio"
     }
    ]
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "1–16s, step 1, product default 5s"
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 (text-to-video and reference). Image-to-video: none, follows the first frame. No Auto."
   },
   {
    "k": "Resolution",
    "v": "360p / 540p / 720p / 1080p. With a last frame: 360p not allowed."
   },
   {
    "k": "Audio",
    "v": "audio, default on (product \"With Audio\" toggle)"
   },
   {
    "k": "Images",
    "v": "Reference: 1–4. Frames: 1 first (required) + 1 last (optional). Size / pixel / format limits — To confirm."
   },
   {
    "k": "Videos",
    "v": "Not accepted."
   },
   {
    "k": "Audio files",
    "v": "Not accepted."
   },
   {
    "k": "Price",
    "v": "Product credit price — To confirm."
   }
  ],
  "isNew": true
 },
 {
  "name": "Grok Imagine Video 1.5",
  "key": "grok-1.5",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "xai/grok-imagine-video/v1.5/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, aspect ratio (7 options), resolution (480p / 720p / 1080p)"
     }
    ]
   },
   {
    "name": "Omni Reference",
    "params": [
     {
      "k": "Endpoint",
      "v": "xai/grok-imagine-video/v1.5/reference-to-video"
     },
     {
      "k": "Required",
      "v": "prompt + 1–7 reference images"
     },
     {
      "k": "Params",
      "v": "duration, aspect ratio, resolution 480p / 720p only"
     }
    ]
   },
   {
    "name": "First & Last Frame (start frame only)",
    "params": [
     {
      "k": "Endpoint",
      "v": "xai/grok-imagine-video/v1.5/image-to-video"
     },
     {
      "k": "Required",
      "v": "start frame image"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration, resolution (480p / 720p / 1080p); no aspect ratio (follows the image)"
     }
    ]
   }
  ],
  "settings": [],
  "limits": [
   {
    "k": "Duration",
    "v": "1–15s, step 1s, product default 6s."
   },
   {
    "k": "Aspect ratio",
    "v": "16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 3:2 / 2:3. Image-to-video: none (follows start frame). No auto option listed."
   },
   {
    "k": "Resolution",
    "v": "480p / 720p / 1080p; reference-to-video 480p / 720p only."
   },
   {
    "k": "Audio",
    "v": "No toggle."
   },
   {
    "k": "Files",
    "v": "Omni Reference: 1–7 images, 0 videos, 0 audio. First & Last Frame: 1 start image. Image size / px / format limits: To confirm."
   },
   {
    "k": "Region",
    "v": "None documented."
   }
  ],
  "isNew": true
 },
 {
  "name": "FLUX 3 Video",
  "key": "flux-3-video",
  "provider": "fal",
  "modes": [
   {
    "name": "Text-to-Video (no files)",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/text-to-video"
     },
     {
      "k": "Required",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration (5–20 or auto), aspect ratio, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame — start only",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/image-to-video"
     },
     {
      "k": "Required",
      "v": "start image"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration (5–20 or auto), aspect ratio, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "First & Last Frame — start + end",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/first-last-frame-to-video"
     },
     {
      "k": "Required",
      "v": "start image and end image (both required)"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration (5–20, no auto), aspect ratio, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "Keyframes",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/keyframes-to-video"
     },
     {
      "k": "Required",
      "v": "1–10 keyframes, each with a frame_index (frame number at 24fps)"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "duration (5–20, no auto), aspect ratio, resolution, generate_audio"
     }
    ]
   },
   {
    "name": "Edit Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/edit-video"
     },
     {
      "k": "Required",
      "v": "source video (<15s, <50MB), prompt (the edit instruction)"
     },
     {
      "k": "Params",
      "v": "only prompt + video_url: no duration, ratio, resolution or generate_audio"
     }
    ]
   },
   {
    "name": "Extend Video",
    "params": [
     {
      "k": "Endpoint",
      "v": "blackforestlabs/flux-3/extend-video"
     },
     {
      "k": "Required",
      "v": "source video (<15s, <50MB)"
     },
     {
      "k": "Optional",
      "v": "prompt"
     },
     {
      "k": "Params",
      "v": "added length 5–20s (product), generate_audio"
     }
    ]
   }
  ],
  "settings": [
   {
    "k": "Aspect ratio 2:1",
    "v": "aspect_ratio · adds 2:1 to the list · default — · generation modes"
   },
   {
    "k": "Smart Duration",
    "v": "duration: \"auto\" · on → the model picks how much to add · default off · Extend Video"
   }
  ],
  "limits": [
   {
    "k": "Duration",
    "v": "5–20s, integer step 1 in the product, default 5s. API also has auto (not for First & Last Frame with two frames, not for Keyframes). Extend: adds 5–20s (product). Edit: output length vs. source: To confirm."
   },
   {
    "k": "Aspect ratio",
    "v": "API: auto / 21:9 / 2:1 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16. Product: Auto + 16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 21:9 (2:1 not exposed)."
   },
   {
    "k": "Resolution",
    "v": "720p / 1080p / 1440p / 2160p; 1440p and 2160p are upscaled."
   },
   {
    "k": "Audio",
    "v": "generate_audio, default on; product toggle \"With Audio\". Not available on Edit Video."
   },
   {
    "k": "Files",
    "v": "No reference images. First & Last Frame: 1–2 images. Keyframes: 1–10 images. Edit / Extend: 1 video, <15s, <50MB. Image size / pixel limits: To confirm."
   },
   {
    "k": "Region",
    "v": "No region restriction in the source."
   }
  ],
  "isNew": true,
  "note": "Notion 上新清单里由 FLUX 3 Max Video 替代(5–20s，仅 720p/1080p，无 Edit/Extend);原型仍按 FLUX 3 Video 配置"
 }
];
