# About 页 · 合作模型 logo

放这里，然后在 `src/app/prototypes/(v1.5)/about/page.tsx` 的 `PARTNERS` 数组里
给对应那条加上 `file` 字段即可，例如：

```ts
{ name: "OpenAI", file: "openai.svg" },
```

没填 `file` 的会先用字标（纯文字）占位。

## 建议
- **优先 SVG**，PNG 需要 2x（高度 ≥ 56px），背景透明。
- 深色底展示：logo 本身应是**白色 / 浅色**版本。彩色版会被 `grayscale` 滤镜压成灰，
  hover 时才恢复彩色。
- 页面会统一把高度压到 28px、宽度自适应，所以各家 logo 的**画布留白要接近**，
  否则一行里会有的看起来大有的看起来小。

## 当前清单（文件名建议）

| 名称 | 建议文件名 |
|---|---|
| ByteDance | `bytedance.svg` |
| Google | `google.svg` |
| ChatGPT | `chatgpt.svg` |
| OpenAI | `openai.svg` |
| Gemini | `gemini.svg` |
| Kling | `kling.svg` |
