/* 剪辑器评审步骤的中文说明(第 16–36 步),评审原型即需求文档。
   章节号指 docs/superpowers/specs/2026-09-29-hybrid-reel-edit-plan.md;代码依据见 src/app/prototypes/(v1.13)/hybrid-reel/canvas/**。
   每条一句话;「原型:」开头的是评审 / 开发原型的演示简化,不是产品规则。 */

import type { EditorStepId } from "./editorJourneys";
import type { StepNote } from "./notes";

export const EDITOR_NOTES: Record<EditorStepId, StepNote> = {
  /* 16 */
  canvas: {
    what: [
      "从 Agent 分镜卡点 Edit in canvas 进来:方案里定好的东西一次性搭好,用户在剪辑器里只做调整(§0 第 1 条)。",
      "每个上传素材是一个节点,每个 AI 补拍按分镜各是一个 Video Generator 节点,全部连到中间的 Video Editor 节点,时间线已按分镜排好。",
      "补拍、配音、AI 配乐、AI 封面都只预埋节点、不自动生成、不扣费;生成和扣费都在画布里由用户触发(每段补拍 50 credits,§2.3)。",
      "顶栏左边是返回按钮和工程名「Hybrid Reel — {平台} {时长}s」,右边是积分余额,余额 = 35600 − 本工程已花积分,实时扣减。",
    ],
    rules: [
      "点补拍节点 → 右侧打开 Video Settings → 点 Generate Video 才开始生成并扣费;预览里补拍占位上也有一个 Generate Video 按钮,效果相同。",
      "画布上没有「全部生成」入口;一键全部生成只在全屏剪辑顶部提示条、导出拦截弹窗、自动字幕弹窗和导出完成提示里出现。",
      "Video Editor 节点自带迷你时间线和工具:Undo / Redo / Split at playhead / Delete / 播放 / Export / Full-screen edit。",
      "节点右侧「+」→ Use this node in → Video Editor(Edit it on the timeline):画面素材已在时间线上就选中那一段,不在就加到末尾(图片 3 秒,视频整段、最短 0.3 秒)。",
      "工程每次改动 250ms 后自动存进 sessionStorage,上传 / 生成的媒体存进 IndexedDB,硬刷新后 blob 链接从 IndexedDB 换回。",
      "原型:评审里左上角按钮回到 Agent 第 6 步(分镜方案);评审不写 sessionStorage,不会覆盖开发版画布的工程。",
    ],
    edges: [
      "撤销 / 重做最多 60 步(⌘Z / ⇧⌘Z);撤销只回退编辑,不回退生成状态、生成结果和已扣积分。",
      "删除一个节点:时间线上引用它的片段变成虚线「Add footage」占位,封面 / 配乐 / 配音对它的引用一并清掉。",
      "方案选的封面帧落在还没生成的 AI 镜头上时,进画布不预设封面。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,第 17、30 步看不到补拍相关状态;「旁白」关掉时没有配音节点,字幕也不预填。",
    ],
    errors: [
      "开发版直接打开画布、sessionStorage 里没有工程:显示空态「Nothing on the canvas yet」+「Back to agent」按钮。",
      "生成失败不在节点上显示,只在该节点的 Settings 里显示红框(见第 30、31 步)。",
    ],
    copy: [
      "Video Generator | Image Generator | Audio Generator",
      "Video Editor | No Video Generated | No Image Generated",
      "No Audio Generated | Configure settings and start generation | Use this node in",
      "Edit it on the timeline | Split at playhead | Select a clip to delete",
      "Export MP4 · 1080p | Full-screen edit | Back to agent",
      "Nothing on the canvas yet | Upload footage in the agent, confirm the plan, then choose Edit in canvas.",
    ],
    open: [
      "没有积分不足拦截:余额 = 35600 − 已花积分,点生成直接扣,余额可以变成负数。",
      "开发版画布左上角「Back to agent」和空态按钮都指向旧 Agent 路由 /prototypes/hybrid-reel/agent/chat,不是新 Agent。",
      "画布节点没有失败态:失败后节点直接退回「No Video Generated」(或保留旧结果),用户不点开 Settings 看不到失败原因。",
      "剪辑器里不能上传新素材(Media 面板只能用已导入素材和资产库),缺素材只能回 Agent 重来。",
    ],
  },
  /* 17 */
  shotsGenerating: {
    what: [
      "补拍节点逐个出进度,生成中整张卡片是流动的橙色渐变 + 「Generating… {p}%」;已有旧结果时叠一层「Regenerating… {p}%」(§2.3)。",
      "真实接 BytePlus Seedance:建异步任务 → 每 5 秒查一次 → 成功后下载 mp4 存进 IndexedDB,一般 1–4 分钟。",
      "原型:评审进入这一步自动触发「全部生成」,演示接口约 5 秒出结果,结果轮流用本地的 RELLET 视频代替。",
    ],
    rules: [
      "点生成立刻扣费(Seedance 默认每段 50 credits),状态变 generating、进度归零、清掉上次的错误。",
      "接口不回进度:按经过时间估算,预计时长 = 70 秒 + (时长向上取整 − 4)× 8 秒,封顶 95%,拿到成片才跳 100%。",
      "全部生成只对状态为未生成(idle)的补拍节点生效,生成中、已生成的不动。",
      "Seedance 2.0 / 2.0 Fast / 2.5 走真实生成;Veo 3 和图片节点是模拟生成,4.5–6 秒完成。",
      "生成中刷新页面:真实任务按记下的任务 id 接着轮询,不重新建任务、不再扣费;模拟任务刷新后丢失。",
    ],
    edges: [
      "同一节点生成中按钮置灰,再触发生成会被忽略;改 prompt 不影响正在跑的任务。",
      "Prompt 为空时点 Generate Video 什么都不发生,也没有提示。",
      "生成中删除节点:轮询发现节点不在了就停止,积分不退。",
      "时长发给接口前会被收到 4–15 秒的整数;比例不在支持列表里就退回 9:16;1080p 只在 Seedance 2.0 标准版生效,其他退回 720p。",
      "成片的临时下载链接 24 小时内有效,原型拿到后立刻存进 IndexedDB。",
    ],
    errors: [
      "建任务失败 / 任务 failed、expired、cancelled / 下载失败 / 超过 15 分钟 / 连续 3 次查询失败 → 节点退回未生成(有旧结果保留旧结果),积分全额退回,原因存进节点(看第 30 步)。",
      "单次查询网络抖动不算失败,连续 3 次查不到才放弃。",
      "原型:打开评审开关「补拍生成失败」后重放这一步,建任务就失败,所有补拍退回未生成并带报错「The video model is busy right now (simulated) — try again.」。",
    ],
    copy: ["Generating… {p}%", "Regenerating… {p}%", "Generate Video"],
    open: [
      "没有积分不足拦截:余额不够也照样扣费开跑,余额可为负。",
      "进度是按时间估的假进度,任务提前完成时会从个位数百分比直接跳到 100%(评审里就是这样)。",
      "生成中删除节点不退积分,是否应取消任务并退款待定。",
    ],
  },
  /* 18 */
  shotsReady: {
    what: [
      "补拍完成后节点显示视频(悬停播放),Video Editor 节点里能直接预览整条片子(§2.3)。",
      "剪辑器是六条固定轨,没有加轨按钮(§3、§0 第 4 条)。",
      "原型:评审里补拍结果轮流用本地的 RELLET 成片 / 素材视频代替,和 prompt 无关。",
    ],
    rules: [
      "生成成功:状态 ready、takes + 1,时长按接口返回的实际时长更新,比例按生成比例更新。",
      "点已生成的补拍节点,Settings 底部按钮变为「Regenerate」,重新生成再扣一次费用,失败时保留旧结果。",
      "补拍镜头的声音默认随镜头生成(With Audio 开),按原声规则处理(§2.7、§2.9)。",
    ],
    edges: [
      "生成出的实际时长和时间线上这一镜长度不一致时,以时间线上的长度为准播放,不自动改时间线。",
      "评审开关「AI 补拍镜头 = 0」时这一步没有补拍节点,只看到实拍素材连进剪辑器。",
    ],
    errors: [
      "某段补拍加载失败时节点只是没画面,没有专门的报错。",
    ],
    copy: ["Regenerate", "Full-screen edit"],
    open: [
      "备选多版本(takes)只记了次数,界面上没有在多个版本间切换的入口(§2.3「多版本可挑」未实现)。",
    ],
  },
  /* 19 */
  nodeSettings: {
    what: [
      "补拍节点的 Video Settings:参考素材、尾帧、prompt、模型、比例、分辨率、时长、With Audio,全由方案预填(§2.3)。",
      "Prompt 写清要什么声音、注明不要音乐和人声;文字 / logo 不让 AI 画,走字卡轨(§2.3)。",
      "尾帧本身就是一个普通补拍镜头,logo / 产品图优先设为 Last frame,保证最后停住的是原图(§2.12)。",
    ],
    rules: [
      "Input Source 显示参考素材缩略图(悬停 × 可移除),没指定时默认用前 3 个上传素材,一张都没有显示「No reference」。",
      "模型:Seedance 2.0 / Seedance 2.0 Fast / Seedance 2.5 / Veo 3;比例 9:16 / 16:9 / 1:1;分辨率 480p / 720p / 1080p,默认 720p。",
      "时长下拉固定 4 / 5 / 6 / 8 / 10 / 12 秒加当前长度;改时长 = 改时间线上这一镜的长度,已生成的镜头只改时间线长度、不重新生成。",
      "底部按钮未生成时是「Generate Video」+ 积分标(默认 50),已生成是「Regenerate」,生成中置灰为「Generating… {p}%」。",
      "视频参考截取分镜指定的那一秒,压成长边 1280 的 JPEG(质量 0.88)发给模型;图片参考原图转码发送。",
      "右上角垃圾桶删除节点,× 关闭面板;Esc 也能关面板。",
    ],
    edges: [
      "参考图最多发 9 张(Seedance 上限),多出的直接丢弃;带尾帧且接口拒绝时退回「尾帧也当参考图」,总数不超过 10。",
      "某张参考素材读不出画面时静默跳过,不提示用户。",
      "时长下拉没有 2 / 3 秒:Seedance 最短 4 秒,也按 4 秒计费。",
      "Image Settings(封面等图片节点)模型为 GPT Image 2.5 Sunburst / Seedream 4.0 / Nano Banana Pro,参考计数上限显示 16,分辨率 Low / Medium / High。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步不会打开 Settings。",
    ],
    errors: [
      "上一次生成失败时,按钮上方出现红框「Last generation failed. {原因} Your credits were refunded.」(见第 30 步)。",
    ],
    copy: [
      "Video Settings | Configure video generation | Input Source | Clips",
      "{n} / 10 | No reference | Remove reference | Last frame",
      "The shot ends exactly on {label}, so the logo stays pixel-perfect. | Remove last frame | Prompt | Video Model",
      "Aspect Ratio | Resolution | Duration | With Audio",
      "Generate Video | Regenerate | Generating… {p}%",
    ],
    open: [
      "Prompt 没有长度上限,也没有字数提示。",
      "参考计数显示「/ 10」,但实际最多只发 9 张,文案与规则不一致。",
      "参考图只能删不能加:§2.3 写「用户可增删」,界面没有添加参考的入口。",
      "改模型 / 分辨率不影响显示的积分(都按 50),不同模型是否不同价待定。",
    ],
  },
  /* 20 */
  timeline: {
    what: [
      "全屏剪辑:顶部 Video Editor 栏 + Export,左侧 Media / Audio 面板入口,中间预览,底部六条固定轨(字卡 / 字幕 / 视频 / 配音 / 音乐 / 音效),右侧跟着选中项出设置(§3)。",
      "这里选中了第一段实拍,右侧是 Clip 设置:长度与所用源区间、原声开关与音量、画面适配(Auto / Fill / Fit + 背景)、素材分析摘要(§2.2)。",
      "方案定的画面处理在 Clip 设置里可改:变速、运镜、局部放大、设备外壳、画中画、点击高亮等,结果直接体现在预览里(§2.2)。",
    ],
    rules: [
      "拖片段两端裁剪,拖中间换顺序;裁剪点在 6 像素内自动吸附到 Agent 拆出的素材分段边界。",
      "分割:播放头放进片段后按 S、点工具栏「Split at playhead」或右键菜单;字幕按切点分到两段,台词只跟前半段走。",
      "右键片段菜单:Copy(⌘C,直接复制到这段后面)/ Split / Replace footage / Delete(⌫)/ AI generate / Speed / Export。",
      "变速:右键菜单 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2×,Clip 面板 0.5 / 1 / 1.5 / 2×。",
      "点时间线上的 AI 镜头,右侧直接打开它的 Video Settings;点实拍片段出 Clip 设置。",
      "快捷键:空格播放 / 暂停,⌘Z / ⇧⌘Z 撤销重做,Esc 退出全屏;焦点在输入框里时快捷键不生效。",
    ],
    edges: [
      "片段、字幕、配音、音乐、音效最短 0.3 秒;图片片段最长停留 10 秒;视频片段出点不能超过源素材时长。",
      "播放头离片段两头不足 0.3 秒时不能分割;分割后某一半字幕不足 0.3 秒,那一半的字幕被清空。",
      "时间线缩放 12–140 像素 / 秒。",
      "有配音的镜头原声压到 20% 垫在下面;配音 / 口播时音乐压到 45%。",
      "AI 镜头未生成时轨道上显示「No Video Generated」/「Generating {p}%」,预览显示「AI-generated shot」占位 + Generate Video;缺素材的片段显示虚线「Add footage」。",
      "删除视频片段:挂在它上面的字卡和绑定音效一起删除。",
    ],
    errors: [
      "未生成的 AI 镜头右键「Generate video from this clip」置灰,提示「Generate this AI shot first」。",
    ],
    copy: [
      "Video Editor | Export | Exit full screen | Media | Audio",
      "Clip | Length | Original audio | Original audio for this clip | This shot has a voiceover, so its original audio plays at 20% underneath it.",
      "Framing | Auto | Fill | Fit | From the footage analysis",
      "From the plan: | Replace footage | Copy | Split at playhead | Move the playhead into this clip first",
      "Delete | AI generate | Generate video from this clip | Uses this clip as the reference | Generate this AI shot first",
      "Speed | Export selected clip | Export full video | Zoom in | Zoom out",
    ],
    open: [
      "按 S 或点工具栏分割时,播放头离片段边缘不足 0.3 秒会静默失败,没有任何反馈(只有右键菜单会置灰提示)。",
      "右键菜单和 Clip 面板的变速档位不一致(菜单多 0.75 / 1.25×)。",
      "「Export selected clip」原型里下载的是整条源素材,不是裁剪后的这一段。",
    ],
  },
  /* 21 */
  cards: {
    what: [
      "字卡是画面上设计出来的文字(钩子标题、卖点、价格、CTA),与有没有人说话无关,单独一条轨,和字幕分开(§2.6)。",
      "字卡有独立的样式库(16 套,偏海报感),不复用字幕样式;有旁白时字卡只写旁白没说的信息(§2.6)。",
      "这里选中了第一张字卡,右侧是 Text 设置:文字、样式、强调色、位置、大小、进场动效。",
    ],
    rules: [
      "空字卡轨显示「Add text」入口;新字卡挂在播放头所在镜头上,从播放头开始,默认 2 秒(镜头剩余不足 2 秒就到镜头结尾),文字为空并自动聚焦输入框。",
      "位置 Upper / Middle / Lower,也可在预览里拖到自定义位置;进场 Pop / Slide / Type / Fade。",
      "右键字卡:Edit text / Duplicate(紧接在后面复制一张)/ Delete text。",
      "字卡跟着所属镜头走:镜头挪动字卡一起挪,镜头删除字卡一起删;字卡上绑定的进场音效跟着字卡走(§2.9)。",
    ],
    edges: [
      "字卡最短 0.3 秒;播放头不在任何镜头上时点「Add text」不生效。",
      "字卡文字为空时在轨道上显示为「Empty text」。",
      "删除字卡时绑在它上面的音效一起删除。",
    ],
    errors: [],
    copy: [
      "Add text | Text | Designed on-screen text, separate from subtitles | Type the on-screen text",
      "Style | Accent colour | Upper | Middle",
      "Lower | Drag the text in the preview for a custom spot. | Custom spot — dragged in the preview. | Entrance",
      "Pop | Slide | Type | Fade",
      "Edit text | Duplicate | Adds a copy right after it | Delete text",
    ],
    open: [
      "字卡文案没有长度限制;§2.6 要求「≤6 词 / 10 字」,界面不拦也不提示。",
    ],
  },
  /* 22 */
  subtitles: {
    what: [
      "字幕 = 片子里说出来的话:进画布时已按旁白原文预填;自动字幕按真实音频重新识别、对齐时间轴(§2.5、§2.4)。",
      "这里打开的是自动字幕弹窗:有配音的镜头识别配音,其余镜头识别片段原声(16kHz 单声道 wav → BytePlus 语音识别)。",
      "原型:评审里识别接口不真调,按时间线顺序回放分镜旁白文本。",
    ],
    rules: [
      "时间线已有字幕时标题是「Regenerate subtitles」、按钮「Regenerate」,说明里多一句「Your current subtitles will be replaced.」;没有字幕时是「Auto-generate subtitles」/「Generate subtitles」。",
      "Spoken language 下拉 10 种语言,默认按 brief 的字幕语言猜:粤语 → Cantonese,其他中文 → Mandarin Chinese,其余 → English。",
      "运行中按钮显示「Transcribing {i} of {n}」,× / Esc / 点遮罩都关不掉。",
      "完成后整批替换:识别到的镜头写入新字幕,没识别到的镜头字幕清空;字幕起止 = 说话起止前 0.05 秒 / 后 0.15 秒,最短 0.5 秒。",
      "字幕轨为空时整条轨是「Auto-generate subtitles」入口;已有字幕时轨道末尾有重新识别按钮,配音改过后变橙色提醒字幕可能过时。",
      "选中字幕出 Subtitles 面板:改文字、样式、位置;右键 Edit subtitle / Regenerate subtitles / Reset timing / Delete subtitle。",
    ],
    edges: [
      "没有任何可识别声音的片段(没有已生成视频、也没有已生成配音)时,Generate 按钮置灰。",
      "同一个素材切成几段时只解码一次;没有音轨的视频算「没有语音」,不调识别接口。",
      "评审开关「旁白」关掉时字幕不预填,弹窗标题为「Auto-generate subtitles」。",
    ],
    errors: [
      "部分镜头识别失败:照常写入成功的部分,结果行写「{n} couldn't be transcribed」(见第 34 步)。",
      "所有有声片段都识别失败:弹窗变成错误态,可 Try again(见第 34 步)。",
      "一句话都没识别到:提示「No speech found in your clips」并清空原字幕(见第 35 步)。",
    ],
    copy: [
      "Auto-generate subtitles | Regenerate subtitles | Subtitles come from the voiceover, or from the clip's own audio where there's no voiceover. You can edit every line afterwards.",
      "Your current subtitles will be replaced. | Spoken language | Cancel",
      "Generate subtitles | Regenerate | Transcribing {i} of {n}",
      "Added subtitles to {n} clips | Click a subtitle on the timeline to edit it. | Done",
      "Transcribes the voiceover on shots that have one, and the original audio on the rest | The voiceover changed after these subtitles were made. Regenerate them",
    ],
    open: [
      "§2.5 的断句规则(英文约 32 字符 / 中文约 14 字,最多两行)没有实现,一个镜头的字幕是整段拼成一条。",
      "不做自动语言识别,用户选错语言只会得到错的字幕,没有提示。",
    ],
  },
  /* 23 */
  media: {
    what: [
      "换素材:右键片段选 Replace footage(或选中片段后开左侧 Media),从已导入素材或资产库挑一条换掉这一段(§2.1)。",
      "Unused good takes 列出 Agent 拆素材时标为可用、但时间线还没用上的片段,可直接替换或加到末尾(§2.1)。",
      "成片画幅由 AI 按投放平台定,剪辑器里不可切换(§2.14);比例不同的素材自动做画幅适配(§2.2)。",
    ],
    rules: [
      "Media 面板两个标签 Imported / Assets,按 All / Images / Videos / Audio 筛选。",
      "替换:保持这一段原来的长度,入点从 0 开始,长度不超过新素材时长(图片最长 10 秒)。",
      "加到末尾:视频取前 min(素材时长, 3) 秒,图片 3 秒;音频素材按用途加到配音轨末尾或设为配乐。",
      "选中片段正在用的素材标「In selected clip」并橙色描边;资产库里已在画布上的标「On canvas」。",
      "Unused good takes 的替换 / 添加按这段的起止入出点。",
    ],
    edges: [
      "没有选中片段时不显示「Replace selected clip」;音频素材和当前素材本身也不显示替换按钮。",
      "某个筛选下没有素材时显示对应空态(No audio yet / No images yet / No videos yet / Nothing here yet)。",
    ],
    errors: [],
    copy: [
      "Media | Imported | Assets",
      "All | Images | Videos",
      "Audio | Unused good takes | Replace selected clip",
      "Add to end of timeline | In selected clip | On canvas",
      "No audio yet | No images yet | No videos yet",
      "Nothing here yet",
    ],
    open: [
      "剪辑器里不能上传新素材,Media 面板没有上传入口。",
    ],
  },
  /* 24 */
  voice: {
    what: [
      "旁白一句一个 Audio Generator 节点,挂在对应镜头开头,镜头挪了跟着挪;可换音色、按句重新生成(§2.4)。",
      "这里选中了第一句配音,右侧 Audio Settings:每句文案、音色、采样率、语速、音量、音调、输出格式、字幕开关。",
      "原型:评审里配音是按句子找的录音,换音色、改语速不会改变声音。",
    ],
    rules: [
      "每句 5 credits,点生成时扣;按钮:全部未生成为「Generate Audio」,只改了其中几句为「Generate {n} lines」,都已生成为「Regenerate」。",
      "改某一句文案会清掉这一句的旧音频,需要重新生成;改音色会同步到所有配音句(Applies to all {n} voiceover lines.),但不清旧音频,按钮变 Regenerate。",
      "生成成功后这一句的长度按实际音频时长更新(最短 0.5 秒)。",
      "配音轨为空时显示「Add voiceover」:方案里有台词时按镜头一次配好全部句子,否则加一段空白配音(1–4 秒)并打开设置让用户写。",
      "语速 0.5–2.0×、音量 0.5–2.0、音调 −12 到 +12 半音,格式 MP3 / WAV;语速默认取方案给这一句定的快慢档。",
    ],
    edges: [
      "生成中或文案为空时生成按钮置灰;同一节点生成中重复点击被忽略。",
      "配音不支持上传,只能 AI 生成。",
      "单段(非按镜头)配音显示「{len} / 2800」字数和「Use subtitles as script」,服务端超过 2800 字直接截断。",
      "配音比镜头长 0.1 秒以上时出黄色提示(见第 32 步)。",
      "评审开关「旁白」关掉时没有配音,这一步右侧没有内容,第 31、32 步同样为空。",
    ],
    errors: [
      "生成失败:失败的句子退积分、没有音频,Audio Settings 底部红框显示「{失败数} of {句数} lines failed: {原因}」(见第 31 步)。",
    ],
    copy: [
      "Audio Settings | Configure voiceover generation | No reference image or audio connected (optional) | Prompt",
      "Describe how it's said, then put the words to read in quotes. | Plays at the start of its shot. | Shot {n} | Audio Model",
      "Seed Audio 1.0 | Voice | Sample Rate | Speed",
      "Volume | Pitch | Output Format | Enable subtitle",
      "Applies to all {n} voiceover lines. | Generate Audio | Generate {n} lines | Regenerate",
      "Add voiceover | No Audio Generated",
    ],
    open: [
      "2800 字上限界面不拦,只有计数,超出后服务端静默截断。",
      "改音色不清旧音频,用户可能以为已经换了声音,实际要再点 Regenerate。",
      "一句一个节点,没有「全部配音一键生成」入口,6 句要点 6 次。",
      "没有积分不足拦截,余额可为负。",
    ],
  },
  /* 25 */
  music: {
    what: [
      "音乐来源:曲库(仅可商用)/ 上传 / AI 生成;方案预埋了一个 AI 配乐节点,点生成才出曲子(§2.8)。",
      "踩点:剪辑点微调到最近节拍,每处最多挪 0.3 秒,标了「Keep whole on beat sync」的镜头不剪短(§2.8)。",
      "面板底部统一调原声总开关、配音音量、音乐音量;原声按方案保留、压低或静音(§2.7)。",
    ],
    rules: [
      "「Make music with AI」→ Create:画布上加一个音乐节点并立即生成,约 3.5 秒完成,完成后自动设为配乐(当前没有配乐时)。",
      "曲库按 8 个分类筛选、可搜索;点「Use」设为配乐,再点「In use」取消。",
      "上传:只接受音频文件,读出时长后在画布上加一个音乐节点并直接用作配乐。",
      "默认音乐音量 35、配音音量 100;配音 / 口播时音乐自动压到 45%。",
      "音乐轨右键:Change music / Reset trim and position / Remove music;删除只是从轨道拿掉,画布上的节点保留。",
    ],
    edges: [
      "音乐最短 0.3 秒,长度不超过成片总长。",
      "上传的音频读不出时长时按 5 秒处理。",
      "AI 配乐未生成时,列表里显示「Not generated」/「Composing… {p}%」,Use 置灰;轨道上显示「No Music Generated」。",
      "原型:曲库只有一条示例音频,所有曲目共用;AI 配乐结果也是这条示例音频。",
    ],
    errors: [
      "AI 配乐是模拟的,永远成功,没有失败态。",
    ],
    copy: [
      "Music | Sound effects | Search… | Upload music",
      "Make music with AI | Composed for this reel | Create | Use",
      "In use | Composing… {p}% | Not generated | No music matches. Try another word.",
      "Original audio | Voice volume | Music volume | No Music Generated",
      "Add music | Change music | Reset trim and position | Remove music",
    ],
    open: [
      "AI 配乐是模拟的、不扣费,真实接入后的价格、时长和失败处理待定。",
      "曲库「仅可商用」没有授权信息展示,上传音乐也没有版权提示。",
    ],
  },
  /* 26 */
  sfx: {
    what: [
      "音效轨只放镜头以外的声音:字卡强调音、品牌音、需要加强的拟音;镜头里的声音跟镜头走(§2.9)。",
      "方案里的音效可绑定到字卡或镜头,对象移动时跟着移动、删除时一起删除(§2.9)。",
    ],
    rules: [
      "音效库分 Transitions / UI / Impact,点「Add」把音效加在播放头位置并试听一次。",
      "上传:只接受音频文件,加在播放头位置。",
      "绑定的音效在轨道上带链接图标,悬停提示跟着哪个对象;在轨道上拖动或裁剪即解绑成自由音效。",
      "右键音效:Change sound / Duplicate(复制到它后面 0.1 秒处)/ Reset trim / Delete sound effect。",
    ],
    edges: [
      "音效最短 0.3 秒;裁剪尾部超过原音效长度时循环播放。",
      "音效轨为空时整条是「Add sound effects」入口。",
      "原型:音效库共 8 个音效,上传的读不出时长时按 5 秒处理。",
    ],
    errors: [],
    copy: [
      "Sound effects | Upload sound effect",
      "Add | No sound effects match. Try another word.",
      "Add sound effects | {name} · follows its text — drag to detach",
      "Change sound | Duplicate",
      "Reset trim | Delete sound effect",
    ],
    open: [
      "§2.9 的 AI 生成音效未实现,只有音效库和上传。",
      "§2.9 的密度规则(两三秒最多一个)和音量低于原声 / 音乐没有校验。",
    ],
  },
  /* 27 */
  cover: {
    what: [
      "封面沿用现有功能:方案已选好用哪一镜的哪一秒,进画布即设好(§2.15)。",
      "也可从素材 / 资产库选图,或 Design with AI 在画布上加一个 Image Generator 出带标题的封面;方案定的封面标题写进了它的 prompt。",
    ],
    rules: [
      "封面格:没设显示「Add a cover」,设了显示「Click to edit cover」,AI 封面生成中显示转圈。",
      "弹窗 From video:拖下方时间条选帧,停下约 0.14 秒后截取这一帧;From assets:从画布上的图片和资产库选图。",
      "「Set as cover」保存并关闭;「Design with AI」新建 Image Generator(16:9,3 credits)并打开它的设置,封面先指向它。",
      "方案预埋的封面 Image Generator 不自动生成、不扣费,点生成后成品自动设为封面。",
      "删除封面只清掉封面引用,画布上的节点保留。",
    ],
    edges: [
      "没有候选帧 / 图时「Set as cover」和「Design with AI」置灰。",
      "弹窗起点 = 已设封面那一帧;没有帧封面时用播放头位置。",
      "原型:AI 封面是模拟生成(用参考帧合成),永远成功。",
    ],
    errors: [
      "拖到还没生成的 AI 镜头或缺素材的位置:提示「This moment has no footage yet — pick another frame.」,两个按钮置灰(见第 36 步)。",
    ],
    copy: [
      "Add a cover | Click to edit cover",
      "Cover | Pick a frame or an image.",
      "From video | From assets",
      "Drag to pick the frame | Design with AI",
      "Adds an Image Generator node using this as reference | Cancel",
      "Set as cover",
    ],
    open: [
      "疑似 bug:进画布时封面时间按源素材时间(入点 + 分镜的那一秒)存,弹窗却当成时间线时间读,片段入点不为 0 或不在第一镜时会定位到错的一帧。",
      "AI 封面是模拟的,真实接入后的计费和失败处理待定。",
    ],
  },
  /* 28 */
  exportGate: {
    what: [
      "时间线上还有补拍没生成时点 Export,先弹窗拦一下:可一键生成(写明要花的 credits),或照样导出(没生成的镜头是空白帧)。",
      "全屏剪辑顶部同时常驻一条提醒「{n} AI shots not generated」+「Generate all {cost}」。",
    ],
    rules: [
      "标题「{n} AI shots aren't ready yet」;只统计时间线上用到的补拍。",
      "生成按钮只算未生成(非生成中)的镜头:1 个为「Generate it ({cost} credits)」,多个为「Generate all {n} ({cost} credits)」,点后关弹窗开始生成。",
      "「Export anyway」关弹窗直接导出;「Cancel」、Esc、点遮罩关闭。",
      "全部都在生成中时不显示生成按钮,说明改为「They're still generating. Exporting now leaves them as blank frames.」。",
    ],
    edges: [
      "部分在生成中:说明末尾加「{r} still generating.」。",
      "所有补拍都已生成时点 Export 不弹窗,直接导出。",
      "原型:评审开关「AI 补拍镜头 = 0」时这一步仍会强制打开弹窗,显示「0 AI shots aren't ready yet」,真实产品不会出现。",
    ],
    errors: [],
    copy: [
      "{n} AI shots aren't ready yet | {n} AI shot isn't ready yet",
      "Exporting now leaves them as blank frames. | They're still generating. Exporting now leaves them as blank frames.",
      "{r} still generating. | Generate it ({cost} credits)",
      "Generate all {n} ({cost} credits) | Export anyway",
      "Cancel | {n} AI shots not generated",
      "· {r} generating | Generate all",
    ],
    open: [
      "没有积分不足拦截:「Generate all」直接扣费,余额可为负。",
    ],
  },
  /* 29 */
  exporting: {
    what: [
      "导出:按钮上走进度「Exporting {p}%」,约 2.4 秒走完,弹出完成提示。",
      "原型:不做真实渲染;评审自动演示这一步不下载文件,手动点 Export 才下载(下载的是时间线上第一段已生成的视频)。",
    ],
    rules: [
      "导出中 Export 按钮置灰,重复点击被忽略。",
      "完成提示「Reel exported」+「Downloaded {file} · 1080p」,文件名 = 工程名转小写短横线 + .mp4,5 秒后自动消失,可手动关闭。",
      "有补拍没生成时提示里多一行「{n} AI shots weren't generated and exported as blank frames.」+「Generate them · {cost} credits」,提示停留 8 秒。",
      "右键片段「Export selected clip」走同一流程,提示为「Clip exported」。",
    ],
    edges: [
      "导出中离开剪辑器:进度计时器被清掉,不会在后台走完、也不会触发下载。",
      "下载的源文件拉取失败时照样提示导出完成(原型不做真实渲染)。",
    ],
    errors: [],
    copy: [
      "Exporting {p}% | Reel exported",
      "Clip exported | Downloaded {file} · 1080p",
      "{n} AI shots weren't generated and exported as blank frames. | Generate them · {cost} credits",
      "Dismiss",
    ],
    open: [
      "原型的完成提示永远写「Downloaded … · 1080p」,评审自动演示其实没下载,真实产品要按实际结果写。",
      "完成提示统计的是画布上所有未生成的补拍(含不在时间线上的),和导出拦截只统计时间线上的口径不一致;费用按 50 × 个数算,没用各节点自己的价格。",
      "真实导出(渲染、分辨率、码率、失败重试)未定义。",
    ],
  },
  /* 30 */
  shotFailed: {
    what: [
      "第一个补拍生成失败(轮询超时):节点退回未生成、积分已退回,Video Settings 底部红框写明原因(§2.3)。",
      "其余补拍已生成,只有第一个失败。",
    ],
    rules: [
      "失败后按钮恢复为「Generate Video」(有旧结果则为「Regenerate」),点击重新生成并重新扣费,红框随之消失。",
      "红框只在生成中以外的状态显示。",
    ],
    edges: [
      "超时判定:从开始生成算起超过 15 分钟仍未完成。",
      "有旧结果时失败不会清掉旧结果,节点保持 ready 并保留旧视频。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步是空的。",
    ],
    errors: [
      "超时 →「This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.」→ 积分退回,重试即可。",
      "任务 failed / expired / cancelled → 接口给的原因,没有则「Generation failed」等 → 积分退回。",
      "成片下载失败 →「Download failed (HTTP {status})」→ 积分退回。",
      "建任务失败 → 接口原始报错(可能是中文技术信息,如「Prompt 是空的」)→ 积分退回。",
    ],
    copy: [
      "Last generation failed.", "This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.",
      "Your credits were refunded.", "Generate Video", "Regenerate",
    ],
    open: [
      "节点卡片上没有失败态,用户不打开 Settings 看不到失败。",
      "接口原始报错(含中文、HTTP 码)直接展示给用户,需要统一成产品文案。",
    ],
  },
  /* 31 */
  voiceFailed: {
    what: [
      "第一句配音生成失败:积分退回、没有音频,Audio Settings 底部红框写明几句失败及原因(§2.4)。",
      "一句一个节点,所以真实的部分失败文案就是「1 of 1 lines failed: …」这种形状。",
      "原型:这一步配音接口被设为一直失败,再点生成看到的仍是同一个红框。",
    ],
    rules: [
      "失败的句子按 5 credits / 句退回;同一节点里成功的句子保留音频。",
      "改这一句文案会清掉红框;再点生成会重新扣费。",
    ],
    edges: [
      "一个节点里最多 3 句并行请求(旧工程一个节点多句时生效)。",
      "红框里只写最后一个失败原因。",
      "评审开关「旁白」关掉时没有配音,这一步是空的。",
    ],
    errors: [
      "配音接口报错 → 红框「{失败数} of {句数} lines failed: {原因}」→ 失败句退积分,节点无音频则退回未生成,可重新生成。",
      "单段(非按镜头)配音失败 → 退积分、红框显示原始报错。",
    ],
    copy: ["1 of 1 lines failed: The speech service is busy right now (simulated) — try again.", "Generate Audio", "Regenerate"],
    open: [
      "真实配音接口的报错是中文技术信息(如「配音生成失败(状态码…)」),会直接出现在英文界面里。",
      "节点上没有失败态,只在 Settings 里能看到。",
    ],
  },
  /* 32 */
  voiceTooLong: {
    what: [
      "某句配音生成后比它的镜头长:Audio Settings 里这一句下面出现黄色提示,配音会盖到下一镜(§2.4 字数与镜头时长匹配)。",
    ],
    rules: [
      "判定:这一句已有音频,且(裁剪偏移 + 配音长度)> 镜头长度 + 0.1 秒。",
      "每句标题行显示「{配音长度}s / {镜头长度}s」;时间线上超出部分用斜纹标出,悬停提示「runs {x}s past its shot」。",
      "解决办法三选一:缩短这句文案后重新生成、拉长镜头、在时间线上裁掉配音尾部。",
    ],
    edges: [
      "超出 0.1 秒以内不提示。",
      "评审开关「旁白」关掉时没有配音,这一步是空的。",
    ],
    errors: [],
    copy: [
      "Longer than its shot, so it runs into the next one. Shorten the line, lengthen the shot, or trim its end on the timeline.",
      "{text} · runs {x}s past its shot",
    ],
    open: [
      "只提示不拦截,也不自动调整;是否要在生成前按字数(英文约 2.5 词 / 秒、中文约 4 字 / 秒)预警待定。",
    ],
  },
  /* 33 */
  subPending: {
    what: [
      "补拍还没生成时打开自动字幕:弹窗提示这些镜头会被跳过,可一键先生成(§2.5)。",
      "旁白开时字幕已预填,所以标题是「Regenerate subtitles」、按钮是「Regenerate」。",
    ],
    rules: [
      "点「Generate them first ({cost} credits)」:关闭弹窗并开始生成所有未生成的补拍。",
      "直接点 Regenerate:只识别已就绪的视频和已生成的配音,未生成的补拍跳过;完成后结果行写「{n} not generated yet」。",
    ],
    edges: [
      "跳过的镜头数只算没有已生成配音的未就绪补拍;有配音的补拍镜头识别配音,不会被跳过。",
      "费用按画布上所有未就绪补拍 × 50 计算。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍,不出现这条提示。",
    ],
    errors: [],
    copy: [
      "Regenerate subtitles", "{n} AI shots aren't generated yet and will be skipped.", "Generate them first ({cost} credits)",
      "{n} not generated yet", "Regenerate", "Cancel",
    ],
    open: [
      "提示里的镜头数按时间线片段算,费用按画布上所有未就绪补拍算,两者可能对不上。",
      "没有积分不足拦截,余额可为负。",
    ],
  },
  /* 34 */
  subFailed: {
    what: [
      "操作:点 Regenerate(没有字幕时为 Generate subtitles)开始识别。",
      "这一步演示识别接口全部报错:有 2 个片段的音频解码不出来先算作「没有语音」,其余 4 个识别失败,所以结果是部分失败。",
      "评审看到的:「No speech found in your clips」+「2 clips have no speech · 4 couldn't be transcribed」,原字幕被清空,弹窗标题变成「Auto-generate subtitles」。",
    ],
    rules: [
      "只要还有片段不是识别失败(哪怕只是没语音),就按「完成」处理并整批写入:没识别出字幕的镜头全部清空。",
      "只有每个有声片段都识别失败时才进入错误态,不写入、原字幕保留。",
      "错误态点 Try again 重新识别一遍;Cancel 关闭。",
    ],
    edges: [
      "没有音轨的视频在识别前就算「没有语音」,不计入失败。",
      "识别接口单次最长 120 秒。",
    ],
    errors: [
      "全部有声片段都识别失败 → 红框「Couldn't transcribe your clips」+ 最后一个报错原因 → Cancel / Try again,原字幕不动。",
      "部分失败 → 当作完成,结果行写「{n} couldn't be transcribed」→ 可再点重新识别。",
    ],
    copy: [
      "No speech found in your clips | {n} clips have no speech",
      "{n} couldn't be transcribed | Done",
      "Couldn't transcribe your clips | The speech service is busy right now (simulated) — try again.",
      "Cancel | Try again",
      "Regenerate subtitles | Auto-generate subtitles",
    ],
    open: [
      "一条字幕都没写入、但有片段识别失败时,标题仍写「No speech found in your clips」,有误导,应写成识别失败。",
      "部分失败时把原有字幕整批清空(包括识别失败的镜头),用户会丢掉预填的旁白字幕。",
      "写入后弹窗标题从「Regenerate subtitles」跳成「Auto-generate subtitles」,同一个弹窗标题前后不一致。",
    ],
  },
  /* 35 */
  noSpeech: {
    what: [
      "操作:点 Regenerate(没有字幕时为 Generate subtitles)开始识别。",
      "识别接口每段都返回空:提示「No speech found in your clips」,结果行写各镜头没有语音,原字幕被清空(§2.5「没人说话就没有字幕」)。",
    ],
    rules: [
      "完成后整批替换:没识别到语音的镜头字幕全部清空,弹窗标题随之变成「Auto-generate subtitles」。",
      "点 Done 关闭;字幕轨恢复为「Auto-generate subtitles」空态入口。",
    ],
    edges: [
      "没有音轨的视频和返回空结果的片段都计入「no speech」。",
      "同时有未生成的补拍时,结果行额外写「{n} not generated yet」。",
    ],
    errors: [],
    copy: ["No speech found in your clips", "{n} clips have no speech", "Done", "Auto-generate subtitles"],
    open: [
      "没识别到语音也会清空预填的旁白字幕,是否应保留旁白原文字幕待定。",
    ],
  },
  /* 36 */
  coverNoFootage: {
    what: [
      "操作:封面弹窗打开在已设的封面帧,把下方时间条拖到第 5 秒左右(落在 AI 补拍那一段)。",
      "该位置的补拍还没生成:出现「This moment has no footage yet — pick another frame.」,Set as cover 和 Design with AI 置灰(§2.15)。",
    ],
    rules: [
      "拖回实拍或已生成的镜头上,提示消失、按钮恢复。",
      "也可切到 From assets 选一张图当封面。",
    ],
    edges: [
      "缺素材的片段、读不出画面的视频也显示同一提示。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍,拖到哪里都有画面。",
      "弹窗没有「定位到某一秒」的入口,只能手动拖。",
    ],
    errors: [
      "截帧失败 → 同一提示,按钮置灰 → 换一帧。",
    ],
    copy: ["This moment has no footage yet — pick another frame.", "Set as cover", "Design with AI", "From assets"],
    open: [
      "提示里没有「先生成这个镜头」的入口,用户要关掉弹窗去画布生成。",
    ],
  },
};
