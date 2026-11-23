# Critique snapshot · 工具落地页模板 + 模型页模板(2026-11-19)

target: src/app/prototypes/(v1.16)/site/tools/ToolTemplate.tsx, site/models/ModelTemplate.tsx
score: 24/40 (Assessment A)

## Fixed in this pass
- P0 免费积分说法：按模型是否能用免费积分分支(FREE_MODELS)
- P0 AI Music Generator 不再说能出带歌词的歌(Seed Audio 1.0 只出背景音乐，带词的 Lyria 3.5 / ElevenLabs Music 下个版本)
- P0 Remove Background:默认模型改 Seedream 5.5(唯一已上线、支持透明底)
- P1 首屏价格跟默认模型走;提示词框常驻可编辑 + 高亮层;加素材按钮;模型标签改纯文字
- P1 白底橙字对比度：#FF744D → #FF5255(大字 3:1 达标)
- P1 Video Editor / Image Editor 去掉和工具不符的成片;Product Video 提示词改开箱
- P1 模型页无成片时不放能力行(参数不再出现三次);Wan 3.0 notes 补「读网页 / 文档」
- P2 文案:ad generator「you pick」、UGC 第 3 步、合规 FAQ、image-to-video、text-to-video 时长、hub 免费工具说法

## Open (needs PM)
- 音频工具：产品 v1.12 原型预选 ElevenLabs Music / SFX(v1.13 模型),官网写「下个版本」——以哪边为准
- 工具页首屏以下偏文字：用途块加成片缩略图、hub 加主推区、首屏浅色品牌色块底
- 模型页 H1 第二行「AI Video/Image Generator」和 /tools/ai-video-generator 抢同一个词
- 页脚 Explore more 约 150 个标签，观感像链接农场
- 无成片的工具页首屏右侧偏弱(音频样音、去背景前后对比要生成)
