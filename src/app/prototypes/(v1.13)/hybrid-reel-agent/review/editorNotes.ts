/* 剪辑器评审步骤的中文说明(第 22–45 步),评审原型即需求文档。
   章节号指 docs/superpowers/specs/2026-09-29-hybrid-reel-edit-plan.md;2026-10-15 落地的待定项见 docs/superpowers/specs/2026-10-15-hybrid-reel-open-items-fix-design.md §1、§3。
   代码依据见 src/app/prototypes/(v1.13)/hybrid-reel/canvas/**(积分 credits.ts,规则函数 project.ts)。
   每条一句话;「原型:」开头的是评审 / 开发原型的演示简化,不是产品规则。 */

import type { EditorStepId } from "./editorJourneys";
import type { StepNote } from "./notes";

export const EDITOR_NOTES: Record<EditorStepId, StepNote> = {
  /* 22 */
  canvas: {
    what: [
      "从 Agent 分镜卡点 Edit in canvas 进来:方案里定好的东西一次性搭好,用户在剪辑器里只做调整(§0 第 1 条)。",
      "每个上传素材是一个节点,每个 AI 补拍按分镜各是一个 Video Generator 节点,全部连到中间的 Video Editor 节点,时间线已按分镜排好。",
      "补拍、配音、AI 配乐、AI 封面都只预埋节点、不自动生成、不扣费;生成和扣费都在画布里由用户触发(每段补拍 50 credits,§2.3)。",
      "顶栏左边是返回按钮和工程名「Hybrid Reel — {平台} {时长}s」,右边是积分余额(千分位,如 35,600)。",
    ],
    rules: [
      "余额 = Agent 交接带来的余额 − 本工程在画布里花的积分,实时扣减;开发版直接打开画布(没有交接余额)时起始为 35,600。",
      "任何扣费动作(补拍、全部生成、配音、Generate all lines、Retry、封面 AI)开跑前先查余额,不够弹「Not enough credits」,不扣费、不开跑(见第 39 步)。",
      "失败、生成中删节点都全额退回这一次扣的积分;退款直接加回顶栏余额。",
      "点补拍节点 → 右侧打开 Video Settings → 点 Generate Video 才开始生成并扣费;预览里补拍占位上也有一个 Generate Video 按钮,效果相同。",
      "画布上没有「全部生成」入口;一键全部生成只在全屏剪辑顶部提示条、导出拦截弹窗、自动字幕弹窗和导出完成提示里出现。",
      "Video Editor 节点自带迷你时间线和工具:Undo / Redo / Split at playhead / Delete / 播放 / Export / Full-screen edit。",
      "节点右侧「+」→ Use this node in → Video Editor(Edit it on the timeline):画面素材已在时间线上就选中那一段,不在就加到末尾(图片 3 秒,视频整段、最短 0.3 秒)。",
      "左上角「Back to agent」回到新 Agent(/prototypes/hybrid-reel-agent)。",
      "工程每次改动 250ms 后自动存进 sessionStorage,上传 / 生成的媒体存进 IndexedDB,硬刷新后 blob 链接从 IndexedDB 换回。",
      "原型:评审里左上角按钮回到 Agent 第 6 步(分镜表);评审不写 sessionStorage,不会覆盖开发版画布的工程。",
    ],
    edges: [
      "余额显示不会小于 0;评审开关「积分不足」打开时起始余额为 2,任何扣费动作都会被拦。",
      "撤销 / 重做最多 60 步(⌘Z / ⇧⌘Z);撤销回退编辑(包括切换用哪一版结果,见第 26 步),不回退生成状态、生成结果、版本列表和已扣积分。",
      "删除一个节点:时间线上引用它的片段变成虚线「Add footage」占位,封面 / 配乐 / 配音对它的引用一并清掉;撤销能把节点找回来,但生成中被删的那次生成不会恢复。",
      "方案选的封面帧落在还没生成的 AI 镜头上时,进画布不预设封面。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,第 23–26、37–38 步看不到补拍相关状态;「旁白」关掉时没有配音节点,字幕也不预填。",
    ],
    errors: [
      "开发版直接打开画布、sessionStorage 里没有工程:显示空态「Nothing on the canvas yet」+「Back to agent」按钮(回新 Agent)。",
      "AI 节点生成失败:节点卡片上显示红色「Generation failed」+ 原因 + Retry(见第 38 步),Settings 里同时有红框(见第 37 步)。",
    ],
    copy: [
      "Video Generator | Image Generator | Audio Generator",
      "Video Editor | No Video Generated | No Image Generated",
      "No Audio Generated | Configure settings and start generation | Use this node in",
      "Edit it on the timeline | Split at playhead | Select a clip to delete",
      "Export MP4 · 1080p | Full-screen edit | Back to agent",
      "Nothing on the canvas yet | Upload footage in the agent, confirm the plan, then choose Edit in canvas.",
    ],
  },
  /* 23 */
  shotsGenerating: {
    what: [
      "补拍节点逐个出进度,生成中整张卡片是流动的橙色渐变 + 「Generating… {p}%」;已有旧结果时叠一层「Regenerating… {p}%」(§2.3)。",
      "真实接 BytePlus Seedance:建异步任务 → 每 5 秒查一次 → 成功后下载 mp4 存进 IndexedDB,一般 1–4 分钟。",
      "原型:评审进入这一步自动触发「全部生成」,演示接口约 5 秒出结果,结果轮流用本地的 RELLET 视频代替。",
    ],
    rules: [
      "点生成先查余额,够了立刻扣费(Seedance 默认每段 50 credits),状态变 generating、进度归零、清掉上次的错误,记下这次扣了多少(退款用)。",
      "全部生成:只对时间线上、未生成(idle)且 Prompt 没问题的补拍生效,先按这些镜头各自价格的总和查一次余额,不够就一个都不开跑;生成中、已生成和不在时间线上的不动。",
      "全部生成时 Prompt 为空或超过 2,000 字的镜头跳过、不扣费,顶部出一条提示(4 秒消失):「{n} shot(s) need a prompt first」/「{n} shot's prompt is too long」,两种都有时用「 · 」连起来。",
      "接口不回进度:按经过时间估算,预计时长 = 70 秒 + (时长向上取整 − 4)× 8 秒,封顶 95%。",
      "进度收尾:任务提前完成时,进度在约 360ms 内(4 步 × 90ms,不超过 400ms)补到 100% 再换上结果,不会从个位数直接跳成片。",
      "Seedance 2.0 / 2.0 Fast / 2.5 走真实生成;Veo 3 和图片节点是模拟生成,4.5–6 秒完成。",
      "生成中刷新页面:真实任务按记下的任务 id 接着轮询,不重新建任务、不再扣费;没有任务 id 的生成(模拟生成、配音、封面图,以及还没拿到任务 id 的 Seedance)刷新后退回未生成(有旧结果则保留旧结果),这次扣的积分全额退回。",
    ],
    edges: [
      "同一节点生成中按钮置灰,再触发生成会被忽略;改 prompt 不影响正在跑的任务。",
      "补拍 Prompt 为空(只有空格也算)时 Generate 置灰,Prompt 下方提示「Add a prompt to generate」;所有视频模型(含 Veo 3)同一规则,不扣费、不开跑。",
      "从节点 Retry、预览占位的 Generate Video 等入口触发空 Prompt 的镜头:不扣费,顶部提示「Add a prompt to generate」;超长的提示「Shorten the prompt to generate」。",
      "Prompt 超过 2,000 字的镜头不能生成(见第 25 步)。",
      "生成中删除节点:停止轮询 / 模拟计时,这一次扣的积分全额退回;之后即使任务完成也不再写回。",
      "撤销刚删掉的生成中节点:节点回来时是未生成(或保留旧结果),不会卡在 Generating;被删的那次生成即使之后完成也写不回来,撤销后再生成要重新扣费。",
      "时长发给接口前会被收到 4–15 秒的整数;比例不在支持列表里就退回 9:16;1080p 只在 Seedance 2.0 标准版生效,其他退回 720p。",
      "成片的临时下载链接 24 小时内有效,原型拿到后立刻存进 IndexedDB。",
    ],
    errors: [
      "余额不够 → 弹「Not enough credits」,不扣费、不开跑(见第 39 步)。",
      "建任务失败 / 任务 failed、expired、cancelled / 下载失败 / 超过 15 分钟 / 连续 3 次查询失败 → 节点退回未生成(有旧结果保留旧结果),积分全额退回,节点上出失败态(见第 37、38 步)。",
      "单次查询网络抖动不算失败,连续 3 次查不到才放弃。",
      "原型:打开评审开关「补拍生成失败」后重放这一步,建任务就失败,所有补拍退回未生成,报错显示「The model is busy right now — try again in a moment.」,Details 里是接口原文「The video model is busy right now (simulated) — try again.」。",
    ],
    copy: [
      "Generating… {p}% | Regenerating… {p}% | Generate Video",
      "Add a prompt to generate | Shorten the prompt to generate",
      "{n} shots need a prompt first | 1 shot needs a prompt first | {n} shots' prompts are too long | 1 shot's prompt is too long",
    ],
    open: [
      "生成中删节点只停止前端轮询并退款,Seedance 侧的任务不会被取消(供应商仍可能计费),是否调取消接口待定。",
    ],
  },
  /* 24 */
  shotsReady: {
    what: [
      "补拍完成后节点显示视频(悬停播放),Video Editor 节点里能直接预览整条片子(§2.3)。",
      "剪辑器是六条固定轨,没有加轨按钮(§3、§0 第 4 条)。",
      "原型:评审里补拍结果轮流用本地的 RELLET 成片 / 素材视频代替,和 prompt 无关。",
    ],
    rules: [
      "生成成功:状态 ready、takes + 1,结果追加为一个新版本并切到它,时长按接口返回的实际时长更新,比例按生成比例更新。",
      "点已生成的补拍节点,Settings 底部按钮变为「Regenerate」,重新生成再扣一次费用;旧结果作为旧版本保留,可切回(见第 26 步)。",
      "补拍镜头的声音默认随镜头生成(With Audio 开),按原声规则处理(§2.7、§2.9)。",
    ],
    edges: [
      "生成出的实际时长和时间线上这一镜长度不一致时,以时间线上的长度为准播放,不自动改时间线。",
      "评审开关「AI 补拍镜头 = 0」时这一步没有补拍节点,只看到实拍素材连进剪辑器。",
    ],
    errors: [
      "重新生成失败:保留上一版结果,节点底部一条「Generation failed」+ Retry(见第 38 步)。",
      "某段补拍视频加载失败时节点只是没画面,没有专门的报错。",
    ],
    copy: ["Regenerate", "Full-screen edit"],
  },
  /* 25 */
  nodeSettings: {
    what: [
      "补拍节点的 Video Settings:参考素材、结果版本、尾帧、prompt、模型、比例、分辨率、时长、With Audio,全由方案预填(§2.3)。",
      "Prompt 写清要什么声音、注明不要音乐和人声;文字 / logo 不让 AI 画,走字卡轨(§2.3)。",
      "尾帧本身就是一个普通补拍镜头,logo / 产品图优先设为 Last frame,保证最后停住的是原图(§2.12)。",
    ],
    rules: [
      "Input Source 显示参考素材缩略图(悬停 × 可移除)和计数「{n} / 9」,没指定时默认用前 3 个上传素材,一张都没有显示「No reference」。",
      "「Add reference」展开候选:导入的图片 / 视频里还没当参考的,点一个就加进去;视频参考截它中间那一帧,方案指定了秒数的按方案截。",
      "Prompt 下方计数「{len} / 2000」;超过 2,000 字时输入框变红、左侧提示「Shorten the prompt to generate」、Generate 置灰。",
      "补拍 Prompt 为空时左侧琥珀色提示「Add a prompt to generate」,Generate 置灰(悬停同一句提示);生成中不显示这句。",
      "模型:Seedance 2.0 / Seedance 2.0 Fast / Seedance 2.5 / Veo 3;比例 9:16 / 16:9 / 1:1;分辨率 480p / 720p / 1080p,默认 720p。",
      "时长下拉固定 4 / 5 / 6 / 8 / 10 / 12 秒加当前长度;改时长 = 改时间线上这一镜的长度,已生成的镜头只改时间线长度、不重新生成。",
      "底部按钮未生成时是「Generate Video」+ 积分标(默认 50),已生成是「Regenerate」,生成中置灰为「Generating… {p}%」;点击先查余额。",
      "视频参考截取指定的那一秒,压成长边 1280 的 JPEG(质量 0.88)发给模型;图片参考原图转码发送。",
      "右上角垃圾桶删除节点(生成中删除会退款),× 关闭面板;Esc 也能关面板。",
    ],
    edges: [
      "参考最多 9 张(Seedance 上限):满 9 张时「Add reference」置灰,悬停提示「Up to 9 references」;选到第 9 张时候选区自动收起。",
      "导入素材都已经是参考时,候选区显示「Everything you imported is already a reference.」;音频素材不能当参考。",
      "带尾帧且接口拒绝时退回「尾帧也当参考图」,总数不超过 10。",
      "某张参考素材读不出画面时静默跳过,不提示用户。",
      "时长下拉没有 2 / 3 秒:Seedance 最短 4 秒,也按 4 秒计费。",
      "改模型 / 分辨率不改变价格,所有视频模型统一 50 credits / 段。",
      "Image Settings(封面等图片节点)模型为 GPT Image 2.5 Sunburst / Seedream 4.0 / Nano Banana Pro,分辨率 Low / Medium / High,每次 3 credits;只带一张参考帧,标签为 Images,不显示参考计数,也没有 Add reference;Prompt 可以为空。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步不会打开 Settings。",
    ],
    errors: [
      "上一次生成失败时,按钮上方出现红框「Last generation failed. {原因} Your credits were refunded.」,原因是统一报错句;接口原文收在下方默认收起的「Details」里,没有原文时不显示 Details(见第 37 步)。",
      "余额不够时点 Generate → 弹「Not enough credits」(见第 39 步)。",
    ],
    copy: [
      "Video Settings | Configure video generation | Input Source | Clips",
      "{n} / 9 | Add reference | Up to 9 references | Choose from imported images or video frames",
      "Everything you imported is already a reference. | No reference | Remove reference | Result",
      "Last frame | The shot ends exactly on {label}, so the logo stays pixel-perfect. | Remove last frame | Prompt",
      "{len} / 2000 | Shorten the prompt to generate | Add a prompt to generate | Video Model | Aspect Ratio",
      "Resolution | Duration | With Audio | Generate Video",
      "Regenerate | Generating… {p}% | Images | Last generation failed. | Your credits were refunded. | Details",
    ],
    open: [
      "各视频模型是否不同价:目前 Seedance 2.0 / Fast / 2.5 / Veo 3、各分辨率统一 50 credits / 段。",
    ],
  },
  /* 26 */
  versions: {
    what: [
      "每次生成的结果都保留:Settings 结果区「Version {i} of {n}」左右切换用哪一版,时间线引用的是节点,自动用当前这一版(§2.3「多版本可挑」)。",
      "这里第 1 个补拍生成过 3 次,当前用的是第 2 版,左右箭头都可点。",
    ],
    rules: [
      "生成成功:新结果追加为最新一版并自动切过去;旧版本都留着。",
      "切换版本 = 换节点当前的视频 / 图片、时长和比例,时间线、预览、导出都跟着用这一版;切换不扣费。",
      "切换版本可以撤销 / 重做(⌘Z / ⇧⌘Z):撤销只回到之前选的那一版,版本列表不变、不删版本。",
      "结果区上方是当前版本的视频(图片节点是图片),可播放。",
      "旧工程没有版本记录时,已有的结果算第 1 版。",
    ],
    edges: [
      "第 1 版时左箭头置灰,最新一版时右箭头置灰;只有一版时显示「Version 1 of 1」,两边都置灰。",
      "生成中左右箭头都置灰,不能切;生成中撤销也不会改版本。",
      "两次操作之间有新的生成结果(版本数变了)时,撤销不会把刚生成的新版本切走。",
      "只有视频 / 图片生成节点有版本;配音和 AI 配乐重新生成直接覆盖,没有版本切换。",
      "版本数量不设上限。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步看不到结果区。",
    ],
    errors: [
      "重新生成失败不会新增版本,当前版本不变,节点底部出失败提示(见第 38 步)。",
    ],
    copy: ["Result", "Version {i} of {n}", "Previous version", "Next version"],
  },
  /* 27 */
  timeline: {
    what: [
      "全屏剪辑:顶部 Video Editor 栏 + Export,左侧 Media / Audio 面板入口,中间预览,底部六条固定轨(字卡 / 字幕 / 视频 / 配音 / 音乐 / 音效),右侧跟着选中项出设置(§3)。",
      "这里选中了第一段实拍,右侧是 Clip 设置:长度与所用源区间、原声开关与音量、画面适配(Auto / Fill / Fit + 背景)、素材分析摘要(§2.2)。",
      "方案定的画面处理在 Clip 设置里可改:变速、运镜、局部放大、设备外壳、画中画、点击高亮等,结果直接体现在预览里(§2.2)。",
    ],
    rules: [
      "拖片段两端裁剪,拖中间换顺序;裁剪点在 6 像素内自动吸附到 Agent 拆出的素材分段边界。",
      "分割:播放头放进片段后按 S、点工具栏「Split at playhead」或右键菜单。",
      "分割时字幕按切点分开:字幕断成了几屏的,中点在切点前的屏归前半段、其余归后半段;只有一屏的两段各保留整句;台词只跟前半段走。",
      "右键片段菜单:Copy(⌘C,直接复制到这段后面)/ Split / Replace footage / Delete(⌫)/ AI generate / Speed / Export。",
      "变速:右键菜单和 Clip 面板统一 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2×;方案定的速度不在这几档时补在最后一档。",
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
      "原型:右键「Export selected clip」下载的是这一段用到的整条源素材,不是裁剪后的这一段(浏览器里不做转码)。",
    ],
    errors: [
      "按 S 或点工具栏分割时播放头不在片段里或离边缘不足 0.3 秒 → 顶部提示「Move the playhead into this clip first」(4 秒消失)→ 挪播放头再切;右键菜单里的 Split 直接置灰。",
      "未生成的 AI 镜头右键「Generate video from this clip」置灰,提示「Generate this AI shot first」。",
    ],
    copy: [
      "Video Editor | Export | Exit full screen | Media | Audio",
      "Clip | Length | Original audio | Original audio for this clip | This shot has a voiceover, so its original audio plays at 20% underneath it.",
      "Framing | Auto | Fill | Fit | From the footage analysis",
      "From the plan: | Replace footage | Copy | Split at playhead | Move the playhead into this clip first",
      "Delete | AI generate | Generate video from this clip | Uses this clip as the reference | Generate this AI shot first",
      "Speed | 0.5× | 0.75× | 1× | 1.25× | 1.5× | 2×",
      "Export selected clip | Export full video | Zoom in | Zoom out",
    ],
  },
  /* 28 */
  cards: {
    what: [
      "字卡是画面上设计出来的文字(钩子标题、卖点、价格、CTA),与有没有人说话无关,单独一条轨,和字幕分开(§2.6)。",
      "字卡有独立的样式库(16 套,偏海报感),不复用字幕样式;有旁白时字卡只写旁白没说的信息(§2.6)。",
      "这里选中了第一张字卡,右侧是 Text 设置:文字、字数、样式、强调色、位置、大小、进场动效。",
    ],
    rules: [
      "空字卡轨显示「Add text」入口;新字卡挂在播放头所在镜头上,从播放头开始,默认 2 秒(镜头剩余不足 2 秒就到镜头结尾),文字为空并自动聚焦输入框。",
      "文字框下方实时计数:英文按词数「{n} / 6 words」,中日韩按字数「{n} / 10 chars」(中日韩字多于词时按字算)。",
      "超过 6 个词 / 10 个字:计数和左侧提示变琥珀色,英文提示「Keep on-screen text under 6 words」,中日韩提示「Keep on-screen text under 10 characters」;只提示不拦,照常显示和导出(§2.6)。",
      "位置 Upper / Middle / Lower,也可在预览里拖到自定义位置;进场 Pop / Slide / Type / Fade。",
      "右键字卡:Edit text / Duplicate(紧接在后面复制一张)/ Delete text。",
      "字卡跟着所属镜头走:镜头挪动字卡一起挪,镜头删除字卡一起删;字卡上绑定的进场音效跟着字卡走(§2.9)。",
    ],
    edges: [
      "字卡最短 0.3 秒;播放头不在任何镜头上时点「Add text」不生效。",
      "文字为空时不显示计数,轨道上显示为「Empty text」。",
      "删除字卡时绑在它上面的音效一起删除。",
    ],
    errors: [],
    copy: [
      "Add text | Text | Designed on-screen text, separate from subtitles | Type the on-screen text",
      "{n} / 6 words | {n} / 10 chars | Keep on-screen text under 6 words | Keep on-screen text under 10 characters",
      "Style | Accent colour | Upper | Middle",
      "Lower | Drag the text in the preview for a custom spot. | Custom spot — dragged in the preview. | Entrance",
      "Pop | Slide | Type | Fade",
      "Edit text | Duplicate | Adds a copy right after it | Delete text",
    ],
  },
  /* 29 */
  subtitles: {
    what: [
      "字幕 = 片子里说出来的话:进画布时已按旁白原文预填;自动字幕按真实音频重新识别、对齐时间轴(§2.5、§2.4)。",
      "这里打开的是自动字幕弹窗:有配音的镜头识别配音,其余镜头识别片段原声(16kHz 单声道 wav → BytePlus 语音识别)。",
      "原型:评审里识别接口不真调,按时间线顺序回放分镜旁白文本。",
    ],
    rules: [
      "断句(预填字幕和自动字幕共用):英文一行 ≤ 32 字符、中日韩一行 ≤ 14 字,一屏最多两行,尽量在标点后断;一个镜头的字幕切成几屏,按字数比例分时间,依次显示。",
      "断句只在显示时计算,存的仍是整句;时间线字幕块按屏用细线分格。",
      "时间线已有字幕时标题是「Regenerate subtitles」、按钮「Regenerate」,说明多一句「Subtitles on clips with speech will be replaced.」;没有字幕时是「Auto-generate subtitles」/「Generate subtitles」。",
      "标题在弹窗打开时定下,识别写入后不再变。",
      "Spoken language 下拉 10 种语言,默认按 brief 的字幕语言猜:粤语 → Cantonese,其他中文 → Mandarin Chinese,其余 → English。",
      "运行中按钮显示「Transcribing {i} of {n}」,× / Esc / 点遮罩都关不掉。",
      "完成后只替换识别成功的镜头;识别失败或没有语音的镜头保留原字幕;字幕起止 = 说话起止前 0.05 秒 / 后 0.15 秒,最短 0.5 秒。",
      "重新识别后有镜头没拿到新字幕时,结果里多一行「Clips without new subtitles keep their current ones.」。",
      "字幕轨为空时整条轨是「Auto-generate subtitles」入口;已有字幕时轨道末尾有重新识别按钮,配音改过后变橙色提醒字幕可能过时。",
      "选中字幕出 Subtitles 面板:改文字、样式、位置;右键 Edit subtitle / Regenerate subtitles / Reset timing / Delete subtitle。",
    ],
    edges: [
      "没有任何可识别声音的片段(没有已生成视频、也没有已生成配音)时,Generate 按钮置灰。",
      "同一个素材切成几段时只解码一次;没有音轨的视频算「没有语音」,不调识别接口。",
      "单个词超过一行宽度(如网址)时硬切;中文没有空格时往回找最近的标点断行。",
      "识别出的文字里所选语言的书写系统占不到 3 成(如选了 English 却多是汉字)→ 结果里提示「This doesn't look like {语言} — try another spoken language.」,字幕照常写入;中文里夹英文品牌名不算。",
      "评审开关「旁白」关掉时字幕不预填,弹窗标题为「Auto-generate subtitles」。",
    ],
    errors: [
      "部分镜头识别失败:照常写入成功的部分,失败的保留原字幕,结果行写「{n} couldn't be transcribed」(见第 43 步)。",
      "所有有声片段都识别失败:弹窗变成错误态,原字幕不动,可 Try again(见第 43 步)。",
      "一句话都没识别到:提示「No speech found in your clips」,原字幕保留(见第 44 步)。",
    ],
    copy: [
      "Auto-generate subtitles | Regenerate subtitles | Subtitles come from the voiceover, or from the clip's own audio where there's no voiceover. You can edit every line afterwards.",
      "Subtitles on clips with speech will be replaced. | Spoken language | Cancel",
      "Generate subtitles | Regenerate | Transcribing {i} of {n}",
      "Added subtitles to {n} clips | Click a subtitle on the timeline to edit it. | Done",
      "This doesn't look like {lang} — try another spoken language. | Clips without new subtitles keep their current ones.",
      "Transcribes the voiceover on shots that have one, and the original audio on the rest | The voiceover changed after these subtitles were made. Regenerate them",
    ],
  },
  /* 30 */
  media: {
    what: [
      "换素材:右键片段选 Replace footage(或选中片段后开左侧 Media),从已导入素材或资产库挑一条换掉这一段(§2.1)。",
      "缺素材时可以直接在 Media 面板上传新的视频 / 图片,不用回 Agent 重来。",
      "Unused good takes 列出 Agent 拆素材时标为可用、但时间线还没用上的片段,可直接替换或加到末尾(§2.1)。",
      "成片画幅由 AI 按投放平台定,剪辑器里不可切换(§2.14);比例不同的素材自动做画幅适配(§2.2)。",
    ],
    rules: [
      "面板顶部「Upload」:可多选,收视频和图片(先看 MIME,MIME 为空或不认识时按扩展名兜底,如 HEIC / MOV,与 Agent 落地页同一规则;音频不收);合规的文件存进 IndexedDB(刷新可恢复),加进 Imported 并在画布上出一个素材节点,不自动进时间线。",
      "上传限制同 Agent:视频 ≤ 500 MB 且 ≤ 10 分钟,图片 ≤ 20 MB;按钮下方写明「Videos up to 500 MB and 10 min · images up to 20 MB」。",
      "上传中按钮显示「Adding…」并置灰;上传会切回 Imported 标签。",
      "Media 面板两个标签 Imported / Assets,按 All / Images / Videos / Audio 筛选。",
      "替换:保持这一段原来的长度,入点从 0 开始,长度不超过新素材时长(图片最长 10 秒)。",
      "加到末尾:视频取前 min(素材时长, 3) 秒,图片 3 秒;音频素材按用途加到配音轨末尾或设为配乐。",
      "选中片段正在用的素材标「In selected clip」并橙色描边;资产库里已在画布上的标「On canvas」。",
      "Unused good takes 的替换 / 添加按这段的起止入出点。",
    ],
    edges: [
      "剪辑器上传不限文件个数(Agent 最多 10 个);上传入口只在全屏剪辑的 Media 面板里,画布上没有。",
      "没有选中片段时不显示「Replace selected clip」;音频素材和当前素材本身也不显示替换按钮。",
      "某个筛选下没有素材时显示对应空态(No audio yet / No images yet / No videos yet / Nothing here yet)。",
    ],
    errors: [
      "不合规的文件不加入,面板上方出一条红色可关闭提示,多个用「 · 」连起来:「{file} is over 500 MB」「{file} is longer than 10 minutes」「{file} is over 20 MB」「{file} isn't a video or image」。",
      "文件读不出元数据(损坏或格式不支持)→「{file} couldn't be read」,不加入。",
    ],
    copy: [
      "Media | Upload | Adding…",
      "Videos up to 500 MB and 10 min · images up to 20 MB",
      "{file} is over 500 MB | {file} is longer than 10 minutes | {file} is over 20 MB",
      "{file} isn't a video or image | {file} couldn't be read | Dismiss",
      "Imported | Assets | All | Images | Videos | Audio",
      "Unused good takes | Replace selected clip | Add to end of timeline",
      "In selected clip | On canvas | No audio yet | No images yet | No videos yet | Nothing here yet",
    ],
  },
  /* 31 */
  voice: {
    what: [
      "旁白一句一个 Audio Generator 节点,挂在对应镜头开头,镜头挪了跟着挪;可换音色、按句重新生成,也可一键生成全部(§2.4)。",
      "这里选中了第一句配音,右侧 Audio Settings:每句文案、音色、采样率、语速、音量、音调、输出格式、字幕开关。",
      "原型:评审里配音是按句子找的录音,换音色、改语速不会改变声音。",
    ],
    rules: [
      "每句 5 credits,点生成时先查余额再扣;按钮:全部未生成为「Generate Audio」,只改了其中几句为「Generate {n} lines」,都已生成为「Regenerate」;换过音色的节点整节点重配,按钮句数和积分按整节点算,和实际扣费一致。",
      "「Generate all {n} lines ({cost} credits)」:把所有配音节点里还要生成的句子(没音频的 + 换过音色的)按总价查一次余额,够了一起开跑,最多 3 句同时调接口。",
      "改某一句文案会清掉这一句的旧音频,需要重新生成;改音色会同步到所有配音句(Applies to all {n} voiceover lines.)。",
      "已有音频的节点换了音色:音色下方琥珀色提示「Voice changed — regenerate to hear it」;下次生成(含 Generate all)这个节点的所有句子都重新配,包括还没有音频的句子,不会新旧音色混着;重新生成成功后提示消失;撤销时这条提示跟着实际音频走,不会误报。生成中音色、参数和文案都锁定(分段配音任何一句在生成,所有句子的音色都锁定)。",
      "生成前按字数预估时长(英文 2.5 词 / 秒、中日韩 4 字 / 秒,再除以语速),超过镜头 0.1 秒以上就提前出「Longer than its shot…」提示;生成后按实际音频长度判断(见第 41 步)。",
      "生成成功后这一句的长度按实际音频时长更新(最短 0.5 秒)。",
      "配音轨为空时显示「Add voiceover」:方案里有台词时按镜头一次配好全部句子,否则加一段空白配音(1–4 秒)并打开设置让用户写。",
      "语速 0.5–2.0×、音量 0.5–2.0、音调 −12 到 +12 半音,格式 MP3 / WAV;语速默认取方案给这一句定的快慢档。",
    ],
    edges: [
      "文案上限 2,800 字:超出的句子下方计数「{len} / 2,800」变红,Generate 和 Generate all 都置灰;单段(非按镜头)配音一直显示计数,超了同样变红置灰。",
      "生成中或文案为空时生成按钮置灰;同一节点生成中重复点击被忽略。",
      "只有一个配音节点或没有要生成的句子时不显示 Generate all。",
      "生成中删除配音节点:剩下的句子不再调接口,这次扣的积分全额退回。",
      "配音不支持上传,只能 AI 生成。",
      "单段配音有「Use subtitles as script」一键把字幕拼成文案。",
      "评审开关「旁白」关掉时没有配音,这一步右侧没有内容,第 40、41 步同样为空。",
    ],
    errors: [
      "余额不够 → 弹「Not enough credits」,不扣费(见第 39 步)。",
      "生成失败:失败的句子退积分、没有音频,Audio Settings 底部红框显示「{失败数} of {句数} lines failed: {原因}」,原因是统一报错句,接口原文收在「Details」里;节点卡片出失败态 + Retry(见第 40 步)。",
    ],
    copy: [
      "Audio Settings | Configure voiceover generation | No reference image or audio connected (optional) | Prompt",
      "Describe how it's said, then put the words to read in quotes. | Plays at the start of its shot. | Shot {n} | Audio Model",
      "Seed Audio 1.0 | Voice | Sample Rate | Speed",
      "Volume | Pitch | Output Format | Enable subtitle",
      "Applies to all {n} voiceover lines. | Voice changed — regenerate to hear it | {len} / 2,800",
      "Generate all {n} lines ({cost} credits) | Generate Audio | Generate {n} lines | Regenerate",
      "Add voiceover | No Audio Generated | Use subtitles as script",
    ],
  },
  /* 32 */
  music: {
    what: [
      "音乐来源:曲库(仅可商用)/ 上传 / AI 生成;方案预埋了一个 AI 配乐节点,点生成才出曲子(§2.8)。",
      "踩点:剪辑点微调到最近节拍,每处最多挪 0.3 秒,标了「Keep whole on beat sync」的镜头不剪短(§2.8)。",
      "面板底部统一调原声总开关、配音音量、音乐音量;原声按方案保留、压低或静音(§2.7)。",
    ],
    rules: [
      "曲库每首标「{时长} · Licensed for commercial use」;按 8 个分类筛选、可搜索;点「Use」设为配乐,再点「In use」取消。",
      "「Make music with AI」→ Create:画布上加一个音乐节点并立即生成,约 3.5 秒完成,完成后自动设为配乐(当前没有配乐时)。",
      "上传:只接受音频文件,读出时长后在画布上加一个音乐节点并直接用作配乐,顶部提示「Make sure you have the rights to use this track.」(4 秒消失)。",
      "默认音乐音量 35、配音音量 100;配音 / 口播时音乐自动压到 45%。",
      "音乐轨右键:Change music / Reset trim and position / Remove music;删除只是从轨道拿掉,画布上的节点保留。",
    ],
    edges: [
      "音乐最短 0.3 秒,长度不超过成片总长。",
      "上传的音频读不出时长时按 5 秒处理。",
      "AI 配乐未生成时,列表里显示「Not generated」/「Composing… {p}%」,Use 置灰;轨道上显示「No Music Generated」。",
      "AI 配乐重新生成直接覆盖,没有版本切换。",
      "原型:AI 配乐不扣费、是模拟的,永远成功;曲库只有一条示例音频,所有曲目和 AI 配乐结果都共用它。",
    ],
    errors: [],
    copy: [
      "Music | Sound effects | Search… | Upload music",
      "Make music with AI | Composed for this reel | Create | Use",
      "{duration} · Licensed for commercial use | Make sure you have the rights to use this track.",
      "In use | Composing… {p}% | Not generated | No music matches. Try another word.",
      "Original audio | Voice volume | Music volume | No Music Generated",
      "Add music | Change music | Reset trim and position | Remove music",
    ],
    open: [
      "AI 配乐真实接入后的价格(原型免费)、时长和失败处理。",
    ],
  },
  /* 33 */
  sfx: {
    what: [
      "音效轨只放镜头以外的声音:字卡强调音、品牌音、需要加强的拟音;镜头里的声音跟镜头走(§2.9)。",
      "方案里的音效可绑定到字卡或镜头,对象移动时跟着移动、删除时一起删除(§2.9)。",
      "音效来源:音效库、上传、AI 生成(Make a sound with AI)。",
    ],
    rules: [
      "音效库分 Transitions / UI / Impact,点「Add」把音效加在播放头位置并试听一次。",
      "「Make a sound with AI」→ Create:按点击那一刻的播放头位置,约 3.5 秒后加一段 1.5 秒的「AI sound {n}」,免费。",
      "上传:只接受音频文件,加在播放头位置。",
      "密度:任意两条音效开头相隔不到 2 秒时,列表顶部出琥珀色提示「Sounds this close together can feel busy.」,只提示不拦(§2.9)。",
      "绑定的音效在轨道上带链接图标,悬停提示跟着哪个对象;在轨道上拖动或裁剪即解绑成自由音效。",
      "右键音效:Change sound / Duplicate(复制到它后面 0.1 秒处)/ Reset trim / Delete sound effect。",
    ],
    edges: [
      "AI 音效生成中显示「Creating… {p}%」,Create 置灰,不能同时生成第二个;只在 All 分类且没有搜索词时显示这一行。",
      "音效最短 0.3 秒;裁剪尾部超过原音效长度时循环播放。",
      "音效轨为空时整条是「Add sound effects」入口。",
      "音量低于原声 / 音乐(§2.9)没有校验。",
      "原型:AI 音效是模拟的,永远成功,出来的声音是那条示例配乐;音效库共 8 个音效,上传的读不出时长时按 5 秒处理。",
    ],
    errors: [],
    copy: [
      "Sound effects | Upload sound effect | Make a sound with AI",
      "Added at the playhead · Free | Creating… {p}% | Create",
      "Sounds this close together can feel busy. | Add | No sound effects match. Try another word.",
      "Add sound effects | {name} · follows its text — drag to detach | AI sound {n}",
      "Change sound | Duplicate | Reset trim | Delete sound effect",
    ],
    open: [
      "AI 音效真实接入后的价格(原型免费)与失败处理。",
    ],
  },
  /* 34 */
  cover: {
    what: [
      "封面沿用现有功能:方案已选好用哪一镜的哪一秒,进画布即设好(§2.15)。",
      "也可从素材 / 资产库选图,或 Design with AI 在画布上加一个 Image Generator 出带标题的封面;方案定的封面标题写进了它的 prompt。",
    ],
    rules: [
      "封面帧的时间统一存时间线时间:进画布时把方案的「素材里第几秒」换算到(卡点后的)时间线上,弹窗打开就定位在这一帧。",
      "旧工程存的是素材里的秒数,打开时自动换算成时间线时间。",
      "封面格:没设显示「Add a cover」,设了显示「Click to edit cover」,AI 封面生成中显示转圈。",
      "弹窗 From video:拖下方时间条选帧,停下约 0.14 秒后截取这一帧;From assets:从画布上的图片和资产库选图。",
      "「Set as cover」保存并关闭;「Design with AI」新建 Image Generator(16:9,3 credits)并打开它的设置,封面先指向它,建节点本身不扣费。",
      "方案预埋的封面 Image Generator 不自动生成、不扣费,点生成(先查余额)后成品自动设为封面。",
      "删除封面只清掉封面引用,画布上的节点保留。",
    ],
    edges: [
      "没有候选帧 / 图时「Set as cover」和「Design with AI」置灰。",
      "弹窗起点 = 已设封面那一帧;没有帧封面时用播放头位置。",
      "原型:AI 封面是模拟生成(用参考帧合成),永远成功。",
    ],
    errors: [
      "拖到还没生成的 AI 镜头或缺素材的位置:提示「This moment has no footage yet — pick another frame.」,两个按钮置灰;是补拍镜头时多一个「Generate this shot ({cost} credits)」(见第 45 步)。",
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
      "AI 封面真实接入后的价格(原型 3 credits)与失败处理。",
    ],
  },
  /* 35 */
  exportGate: {
    what: [
      "时间线上还有补拍没生成时点 Export,先弹窗拦一下:可一键生成(写明要花的 credits),或照样导出(没生成的镜头是空白帧)。",
      "全屏剪辑顶部同时常驻一条提醒「{n} AI shots not generated」+「Generate all {cost}」。",
    ],
    rules: [
      "口径(导出拦截、顶部提醒、导出完成提示、自动字幕提示统一):镜头数 = 时间线上用到、还没就绪的补拍(含生成中、缺 Prompt 的);能一键生成的只算未在生成且 Prompt 没问题的,费用 = 这些各自价格之和。",
      "有缺 Prompt / Prompt 超长的镜头时,弹窗里多一行琥珀色提示「{n} shot(s) need a prompt first」/「{n} shot's prompt is too long」,顶部提醒末尾也加「· {同一句}」;这些镜头不计入生成数和费用。",
      "标题「{n} AI shots aren't ready yet」(1 个时为「1 AI shot isn't ready yet」)。",
      "生成按钮只算能开跑的镜头:1 个为「Generate it ({cost} credits)」,多个为「Generate all {n} ({cost} credits)」,点后关弹窗,按总价查一次余额后开始生成;一个能开跑的都没有时不显示生成按钮(顶部提醒也不显示 Generate all)。",
      "「Export anyway」关弹窗直接导出;「Cancel」、Esc、点遮罩关闭。",
      "全部都在生成中时不显示生成按钮,说明改为「They're still generating. Exporting now leaves them as blank frames.」。",
    ],
    edges: [
      "部分在生成中:说明末尾加「{r} still generating.」;顶部提醒加「· {r} generating」。",
      "所有补拍都已生成时点 Export 不弹窗,直接导出;画布上不在时间线里的补拍不算。",
      "原型:评审开关「AI 补拍镜头 = 0」时这一步仍会强制打开弹窗,显示「0 AI shots aren't ready yet」,真实产品不会出现。",
    ],
    errors: [
      "余额不够 → 弹窗关闭后弹「Not enough credits」,一个都不开跑(见第 39 步)。",
    ],
    copy: [
      "{n} AI shots aren't ready yet | {n} AI shot isn't ready yet",
      "Exporting now leaves them as blank frames. | Exporting now leaves it as blank frames.",
      "They're still generating. Exporting now leaves them as blank frames. | {r} still generating.",
      "Generate it ({cost} credits) | Generate all {n} ({cost} credits) | Export anyway",
      "Cancel | {n} AI shots not generated | · {r} generating | Generate all",
      "{n} shots need a prompt first | {n} shot's prompt is too long",
    ],
  },
  /* 36 */
  exporting: {
    what: [
      "导出:按钮上走进度「Exporting {p}%」,约 2.4 秒走完,弹出完成提示。",
      "原型:不做真实渲染;下载的是时间线上第一段已生成的视频;评审自动演示这一步不下载文件,手动点 Export 才下载。",
    ],
    rules: [
      "导出中 Export 按钮置灰,重复点击被忽略。",
      "完成提示标题「Reel exported」;文件真的下载到本地才写「Downloaded {file} · 1080p」,没下载(评审自动演示、素材拉取失败)写「Exported {file} · 1080p」。",
      "文件名 = 工程名转小写短横线 + .mp4;提示 5 秒后自动消失,可手动关闭。",
      "有补拍没生成时提示里多一行「{n} AI shots weren't generated and exported as blank frames.」+「Generate them · {cost} credits」,提示停留 8 秒;统计口径同导出拦截(时间线上未就绪的补拍,费用按各节点自己的价格)。",
      "点「Generate them」= 全部生成(先查余额)并关闭提示;只有部分能开跑(其余在生成中或缺 Prompt)时按钮写「Generate {k} · {cost} credits」;一个能开跑的都没有时不显示这个按钮。",
      "右键片段「Export selected clip」走同一流程,提示为「Clip exported」,文件名带角色和序号。",
    ],
    edges: [
      "导出中离开剪辑器:进度计时器被清掉,不会在后台走完、也不会触发下载。",
      "原型:「Export selected clip」下载的是这一段用到的整条源素材,不是裁剪后的片段(浏览器里不做转码);这一段素材没就绪时不下载,提示写 Exported。",
    ],
    errors: [
      "原型:源文件拉取失败时照样提示导出完成,文案为「Exported {file} · 1080p」。",
    ],
    copy: [
      "Exporting {p}% | Reel exported | Clip exported",
      "Downloaded {file} · 1080p | Exported {file} · 1080p",
      "{n} AI shots weren't generated and exported as blank frames. | 1 AI shot wasn't generated and exported as blank frames.",
      "Generate them · {cost} credits | Generate it · {cost} credits | Dismiss",
    ],
    open: [
      "真实导出:渲染、分辨率、码率、失败与重试;成片下载的签名链接与有效期。",
    ],
  },
  /* 37 */
  shotFailed: {
    what: [
      "第一个补拍生成失败(轮询超时):节点退回未生成、积分已退回,Video Settings 底部红框写明原因(§2.3)。",
      "其余补拍已生成,只有第一个失败;画布上这个节点同时显示失败态(见第 38 步)。",
    ],
    rules: [
      "失败后按钮恢复为「Generate Video」(有旧结果则为「Regenerate」),点击先查余额、重新扣费,红框随之消失。",
      "红框只在生成中以外的状态显示。",
    ],
    edges: [
      "超时判定:从开始生成算起超过 15 分钟仍未完成。",
      "有旧结果时失败不会清掉旧结果,节点保持 ready 并保留旧版本,不新增版本。",
      "节点在生成中已被删除时,失败不再处理(删除时已退过款,不会退两次)。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步是空的。",
    ],
    errors: [
      "超时 →「This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.」(本身就是给用户看的句子,没有 Details)→ 积分退回,重试即可。",
      "其他失败(建任务失败、任务 failed / expired / cancelled、成片下载失败如「Download failed (HTTP 502)」)→ 按原始报错归类成统一报错句:「The model took too long to respond.」/「Couldn't reach the server — check your connection.」/「The model is busy right now — try again in a moment.」(429、503、繁忙、限流)/「Something went wrong on our side.」;接口原文收在默认收起的「Details」里 → 积分退回。",
    ],
    copy: [
      "Last generation failed. | This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.",
      "Your credits were refunded. | Generate Video | Regenerate | Details",
      "The model took too long to respond. | Couldn't reach the server — check your connection.",
      "The model is busy right now — try again in a moment. | Something went wrong on our side.",
    ],
  },
  /* 38 */
  nodeFailed: {
    what: [
      "AI 节点生成失败后,画布节点卡片上直接显示失败态,用户不用打开 Settings 也能看到(§3 节点失败态)。",
      "这里第 1 个补拍从没生成成功 → 整张卡片是红色失败态;第 2 个是重新生成失败、上一版还在 → 结果照常显示,底部一条失败提示。",
    ],
    rules: [
      "没有可用结果:卡片显示红叉 +「Generation failed」+ 原因(统一报错句,同第 37 步;最多两行,悬停看全文)+「Retry」。",
      "有上一版结果:照常显示结果,底部一条红色「Generation failed」+「Retry」,悬停看原因。",
      "Retry = 用同样的参数重新生成,照常扣费(补拍 50、配音 5 / 句、图片 3),先查余额。",
      "适用于所有 AI 节点:补拍、配音、图片(封面);重新生成开始时失败态立即消失,成功后不再显示。",
      "点 Retry 不会选中或拖动节点。",
    ],
    edges: [
      "失败的积分已在失败时退回;Retry 再扣一次。",
      "上传的素材节点没有失败态。",
      "节点卡片上只显示统一报错句,接口原文要打开 Settings 在红框的「Details」里看。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步看不到失败卡片。",
    ],
    errors: [
      "Retry 时余额不够 → 弹「Not enough credits」,失败态保留(见第 39 步)。",
      "Retry 再次失败 → 回到同样的失败态,原因更新,积分再退回。",
    ],
    copy: ["Generation failed", "Retry", "This is taking much longer than usual, so we stopped waiting. Your credits are back — try again."],
  },
  /* 39 */
  editorNoCredits: {
    what: [
      "画布余额不够时点任何扣费动作:弹「Not enough credits」,写明需要多少、余额多少,不扣费、不开跑(§1 积分)。",
      "这里等于余额只有 2 时在补拍都没生成的工程里点了「Generate all」:Needed = 时间线上所有能开跑的未生成补拍的价格之和(每段 50),Your balance = 2。",
    ],
    rules: [
      "要查余额的动作:补拍 Generate / Regenerate、全部生成、节点 Retry、配音 Generate、Generate all lines、封面弹窗的 Generate this shot、图片节点生成。",
      "全部生成 / Generate all lines 按总价查一次,够就全部开跑,不够一个都不开跑(不会只跑一部分)。",
      "「Top up」关闭弹窗;「Cancel」、Esc、点遮罩关闭;都不扣费。",
      "价格为 0 的动作(AI 配乐、AI 音效)不查余额。",
      "生成中刷新后接着查的旧任务已付过费,不再查余额。",
    ],
    edges: [
      "余额刚好等于价格时放行,余额变 0;余额不会显示成负数。",
      "原型:评审开关「积分不足」把起始余额设为 2,补拍(50)、配音(5 / 句)、AI 封面(3)都会被拦;免费的 AI 配乐、AI 音效不受影响。",
    ],
    errors: [
      "原型:点「Top up」只出一条提示「Top up isn't part of this prototype」(4 秒消失),没有充值页。",
    ],
    copy: [
      "Not enough credits | Top up to keep generating. Nothing was charged.",
      "Needed | Your balance | {n} credits",
      "Top up | Cancel | Top up isn't part of this prototype",
    ],
  },
  /* 40 */
  voiceFailed: {
    what: [
      "第一句配音生成失败:积分退回、没有音频,Audio Settings 底部红框写明几句失败及原因,画布上的配音节点同时显示失败态 + Retry(§2.4)。",
      "一句一个节点,所以真实的部分失败文案就是「1 of 1 lines failed: …」这种形状。",
      "原型:这一步配音接口被设为一直失败,再点生成或 Retry 看到的仍是同一个红框;Details 里是接口原文「The speech service is busy right now (simulated) — try again.」。",
    ],
    rules: [
      "失败的句子按 5 credits / 句退回;同一节点里成功的句子保留音频。",
      "改这一句文案会清掉红框;再点生成(或节点上的 Retry)先查余额、重新扣费。",
    ],
    edges: [
      "所有配音最多 3 句同时调接口(Generate all 时各节点共用这一上限)。",
      "红框里只写最后一个失败原因(统一报错句);接口原文在下方默认收起的「Details」里。",
      "换过音色的节点生成失败时,「Voice changed — regenerate to hear it」提示保留。",
      "评审开关「旁白」关掉时没有配音,这一步是空的。",
    ],
    errors: [
      "配音接口报错 → 红框「{失败数} of {句数} lines failed: {原因}」+ Details → 失败句退积分,节点无音频则退回未生成,可重新生成。",
      "单段(非按镜头)配音失败 → 退积分、红框显示统一报错句 + Details。",
    ],
    copy: ["1 of 1 lines failed: The model is busy right now — try again in a moment.", "Details", "Generation failed", "Retry", "Generate Audio", "Regenerate"],
  },
  /* 41 */
  voiceTooLong: {
    what: [
      "某句配音比它的镜头长:Audio Settings 里这一句下面出现黄色提示,配音会盖到下一镜(§2.4 字数与镜头时长匹配)。",
      "这里这一句已生成,按实际音频长度判断。",
    ],
    rules: [
      "生成后判定:(裁剪偏移 + 配音长度)> 镜头长度 + 0.1 秒。",
      "生成前预判:按字数估时长(英文 2.5 词 / 秒、中日韩 4 字 / 秒,除以语速)> 镜头长度 + 0.1 秒,提示提前出现,用户改文案时实时更新。",
      "每句标题行显示「{配音长度}s / {镜头长度}s」;已生成的配音在时间线上超出部分用斜纹标出,悬停提示「runs {x}s past its shot」。",
      "解决办法三选一:缩短这句文案后重新生成、拉长镜头、在时间线上裁掉配音尾部。",
    ],
    edges: [
      "超出 0.1 秒以内不提示。",
      "只提示不拦截,也不自动调整。",
      "预估只是估算,生成后以实际音频长度为准(可能提示消失或新出现)。",
      "评审开关「旁白」关掉时没有配音,这一步是空的。",
    ],
    errors: [],
    copy: [
      "Longer than its shot, so it runs into the next one. Shorten the line, lengthen the shot, or trim its end on the timeline.",
      "{text} · runs {x}s past its shot",
    ],
  },
  /* 42 */
  subPending: {
    what: [
      "补拍还没生成时打开自动字幕:弹窗提示这些镜头会被跳过,可一键先生成(§2.5)。",
      "旁白开时字幕已预填,所以标题是「Regenerate subtitles」、按钮是「Regenerate」。",
    ],
    rules: [
      "只算真的会被跳过的补拍:时间线上未就绪、且至少有一段没有已生成配音的(有配音的镜头识别配音,不算);费用 = 其中能开跑(未在生成、Prompt 没问题)的各自价格之和(每段 50)。",
      "点「Generate them first ({cost} credits)」:关闭弹窗,按总价查一次余额后只生成这些镜头;1 个时为「Generate it first」,只有部分能开跑时为「Generate {k} first」。",
      "其中有缺 Prompt / Prompt 超长的,提示后面接一句「{n} shot(s) need a prompt first.」/「{n} shot's prompt is too long.」。",
      "直接点 Regenerate:只识别已就绪的视频和已生成的配音,未生成的补拍跳过,原字幕保留;完成后结果行写「{n} not generated yet」。",
    ],
    edges: [
      "没有能开跑的(都在生成中或缺 Prompt)时不显示「Generate them first」按钮。",
      "已经有生成好配音的补拍镜头识别配音,不会被跳过,提示里的镜头数和结果行的「not generated yet」都不算它。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍,不出现这条提示。",
    ],
    errors: [
      "余额不够 → 弹「Not enough credits」(见第 39 步)。",
    ],
    copy: [
      "Regenerate subtitles", "{n} AI shots aren't generated yet and will be skipped.", "Generate them first ({cost} credits)",
      "Generate it first ({cost} credits)", "Generate {k} first ({cost} credits)", "{n} not generated yet", "Regenerate", "Cancel",
    ],
  },
  /* 43 */
  subFailed: {
    what: [
      "操作:点 Regenerate(没有字幕时为 Generate subtitles)开始识别。",
      "这一步演示识别接口全部报错:有 2 个片段的音频解码不出来先算作「没有语音」,其余 4 个识别失败,所以结果是部分失败。",
      "评审看到的:标题「Couldn't transcribe some clips」、结果行「2 clips have no speech · 4 couldn't be transcribed」、「Clips without new subtitles keep their current ones.」,原字幕全部保留。",
    ],
    rules: [
      "只要还有片段不是识别失败(哪怕只是没语音),就按「完成」处理:只写入识别成功的片段,失败 / 没语音的保留原字幕。",
      "一条都没写入且有失败时,标题是「Couldn't transcribe some clips」(琥珀色图标);一条都没写入也没有失败时是「No speech found in your clips」。",
      "只有每个有声片段都识别失败时才进入错误态,不写入、原字幕保留。",
      "错误态点 Try again 重新识别一遍;Cancel 关闭。",
      "弹窗标题在打开时定下,写入后仍是「Regenerate subtitles」。",
    ],
    edges: [
      "没有音轨的视频在识别前就算「没有语音」,不计入失败。",
      "识别接口单次最长 120 秒。",
    ],
    errors: [
      "全部有声片段都识别失败 → 红框「Couldn't transcribe your clips」+ 最后一个报错的统一报错句(同第 37 步),接口原文收在默认收起的「Details」里 → Cancel / Try again,原字幕不动。",
      "部分失败 → 当作完成,结果行写「{n} couldn't be transcribed」→ 可再点重新识别。",
    ],
    copy: [
      "Couldn't transcribe some clips | {n} clips have no speech",
      "{n} couldn't be transcribed | Clips without new subtitles keep their current ones.",
      "Couldn't transcribe your clips | The model is busy right now — try again in a moment. | Details",
      "Cancel | Try again | Done",
      "Regenerate subtitles",
    ],
  },
  /* 44 */
  noSpeech: {
    what: [
      "操作:点 Regenerate(没有字幕时为 Generate subtitles)开始识别。",
      "识别接口每段都返回空:提示「No speech found in your clips」,结果行写各镜头没有语音;原有字幕保留,不清空(§2.5「没人说话就没有字幕」只对新识别结果生效)。",
    ],
    rules: [
      "完成后没有任何片段被替换;重新识别时结果里多一行「Clips without new subtitles keep their current ones.」。",
      "弹窗标题保持打开时的「Regenerate subtitles」;点 Done 关闭。",
    ],
    edges: [
      "没有音轨的视频和返回空结果的片段都计入「no speech」。",
      "同时有未生成的补拍时,结果行额外写「{n} not generated yet」。",
      "评审开关「旁白」关掉时时间线没有字幕,标题为「Auto-generate subtitles」,没有「keep their current ones」这一行,字幕轨保持空态入口。",
    ],
    errors: [],
    copy: ["No speech found in your clips", "{n} clips have no speech", "Clips without new subtitles keep their current ones.", "Done", "Regenerate subtitles"],
  },
  /* 45 */
  coverNoFootage: {
    what: [
      "操作:封面弹窗打开在已设的封面帧,把下方时间条拖到第 5 秒左右(落在 AI 补拍那一段)。",
      "该位置的补拍还没生成:出现「This moment has no footage yet — pick another frame.」,Set as cover 和 Design with AI 置灰,下面多一个「Generate this shot (50 credits)」(§2.15)。",
    ],
    rules: [
      "点「Generate this shot」= 生成这一个补拍(先查余额、扣这个节点自己的价格),弹窗不关,按钮变「Generating… {p}%」;生成好后这一刻自动截出画面,按钮恢复可用。",
      "拖回实拍或已生成的镜头上,提示消失、按钮恢复。",
      "也可切到 From assets 选一张图当封面。",
    ],
    edges: [
      "缺素材的片段、读不出画面的视频也显示同一提示,但没有「Generate this shot」按钮(只有未就绪的 AI 补拍才有)。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍,拖到哪里都有画面。",
      "弹窗没有「定位到某一秒」的入口,只能手动拖。",
      "原型:评审接口约 5 秒出结果。",
    ],
    errors: [
      "截帧失败 → 同一提示,按钮置灰 → 换一帧。",
      "余额不够 → 弹「Not enough credits」,不开跑(见第 39 步)。",
    ],
    copy: [
      "This moment has no footage yet — pick another frame.",
      "Generate this shot ({cost} credits)",
      "Generating… {p}%",
      "Set as cover",
      "Design with AI",
      "From assets",
    ],
  },
};
