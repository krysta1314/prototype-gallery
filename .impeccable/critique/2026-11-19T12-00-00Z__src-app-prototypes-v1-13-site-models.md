# Critique snapshot · AI 模型页模板 v3(2026-11-19)

target: src/app/prototypes/(v1.13)/site/models/ModelTemplate.tsx(48 页)+ 分类页 + Kling 4.0 手写页
score: 25/40(UI 评审)· SEO/GEO 内容审核另出清单

## Fixed
- 无成片页参数卡被 justify-center 裁掉 → 桌面换行居中
- 原始提示词里的模板变量 / @image / CRITICAL / 中文批注上页面 → cleanPrompt()
- Step 3 空「+」框 → 价格 / 音色参数卡;「Up to High」→ 质量档改写
- 能力段最多 3 段、不复用首张成片、竖片模糊底、标题降为 H3;视频只在视口内播放
- 去掉 4 条带厂商大字卡的官方展示片(Kling 3.0 / Gemini Omni Flash / MiniMax H3 Max / Nano Banana 2 Lite)
- H1/H2 span 粘连;og:image 外链拼错;Seedance 2.5 canonical → /models/seedance;Kling 4.0 模板版不渲染
- Seedance 2.0 Fast「Half the cost」不实 → 约便宜 20%;跨档位比价 → 只比同档位
- 「Real prompts shown」只在真有 prompt 时出现;删除无出处的「REST API coming soon」
- 定义句改成一句完整可引用的话(厂商 + 输入 + 时长 / 分辨率 + 起价含美元)
- 搜索里的简写 vs 补全(seedance 2.5 vs 2.0、sunburst vs flare、wan 3.0 vs prime)
- title ≤60 且品牌后缀在;description 不重复厂商、下个版本不写价格;分类页加 H2 + JSON-LD
- Vidu → ShengShu、Mureka → Kunlun Tech;Kling 4.0 手写页起价 / 免费口径统一

## Open (needs PM)
- CTA 渐变按钮白字对比度 1.94–3.19(官方 token 冲突)
- 模型页黑底 vs 分类页 / 页脚白底
- 34 页没有真实成片(23 个 v1.13 + 11 个已上线),要 dev MCP 生成
- Seedance 2.5 Flash / Wan 3.0 Prime / Seedream 5.5 只在 UAT 上线，价格是 UAT 报价
- 「Coming next release」页的 Start free / 提示词框是否改成 Get notified
