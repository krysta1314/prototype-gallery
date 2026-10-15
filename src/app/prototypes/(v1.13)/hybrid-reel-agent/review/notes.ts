/* 评审侧栏「这一屏」的中文说明。章节号指 docs/superpowers/specs/2026-10-14-hybrid-reel-agent-design.md。 */

import { EDITOR_NOTES } from "./editorNotes";
import type { StepId } from "./journeys";

/** 一屏的说明,按小节分;空数组的小节在面板里不显示。editorNotes.ts 只 import type,运行时没有循环依赖 */
export type StepNote = {
  what: string[]; // 需求说明:这一屏是什么、为什么、对应 spec 章节
  rules: string[]; // 交互规则:点什么发生什么、默认值、计费、状态切换
  edges: string[]; // 边界情况:上下限 / 空值 / 数量 / 时长 / 并发 / 刷新 / 重复点击
  errors: string[]; // 异常处理:触发条件 → 用户看到什么 → 怎么恢复
  copy: string[]; // 界面文案:这一屏出现的英文原文
  open?: string[]; // 待定:代码里没有规则 / 和需求有出入,需要拍板
};

export const NOTES: Record<StepId, StepNote> = {
  home: {
    what: [
      "落地页只保留输入框主体:「+」加素材、写一句话、点 Create,Creation type 下拉、企业锁等外围交互不做(§2.1、§6)。",
      "用户在这里一次交齐素材和需求,Create 后进入对话页,由 Agent 接手分析(§2)。",
      "左侧图标栏、历史栏和顶栏沿用 v1.13 外壳,不属于本需求。",
    ],
    rules: [
      "「+」打开系统文件选择,可多选,接受 video/*、image/*、audio/*。",
      "文件类型判定:image/* 或扩展名 jpg/jpeg/png/webp/heic 算图片,audio/* 算音频,其余一律当视频。",
      "没有素材时 Create 置灰(40% 透明),悬停提示 Add footage first,回车也不触发。",
      "有素材时点 Create 或在输入框按 Enter 提交;Shift+Enter 换行,输入法组字中的 Enter 不提交。",
      "Prompt 可不填;回复语言按 prompt 判断:含中文→中文,写了英文→英文,没写→按浏览器语言(zh 开头为中文,否则英文)。",
    ],
    edges: [
      "素材数量、单个文件大小、视频时长在前端都不设上限。",
      "同一个文件可以重复添加,会出现两张缩略图、按两条素材分别分析。",
      "Prompt 不限长度,首尾空白会被去掉再提交。",
    ],
    errors: [],
    copy: [
      "Turn your footage into a finished ad",
      "Add your product footage and tell me what ad to make…",
      "Hybrid Reel",
      "Add footage first",
      "Create",
    ],
    open: [
      "待定:前端没有素材数量 / 单文件大小 / 视频时长上限,超大文件要到上传或分析时才报错,是否在选文件时就拦?",
      "待定:上线走 Vercel Blob 直传时只放行 video/*、image/*、application/octet-stream,音频文件会被 Blob 拒收导致整次分析失败,但落地页仍允许选音频——放行音频还是落地页去掉 audio/*?",
      "待定:顶栏积分余额固定显示 35,600,Agent 全流程不扣减也不读真实余额。",
    ],
  },
  picked: {
    what: [
      "加了素材后,缩略图排成一行出现在输入框上方,作为提交前的确认区(§2.1)。",
      "点 Create:素材 + prompt 一起带进对话页并立即开始分析(§2.2)。",
    ],
    rules: [
      "图片显示原图缩略,视频显示第 0.5 秒画面,音频显示音符图标。",
      "悬停缩略图右上角出现 X(键盘聚焦也会出现),点了从列表移除该素材。",
      "Create 后素材以内存方式交给对话页(不经服务器),同时把原文件存进浏览器 IndexedDB,供之后进画布使用。",
      "原型:评审这一步预置了 RELLET 的 4 个素材(2 段视频 + 2 张图)和录制时的 prompt,Create 后走录好的数据。",
    ],
    edges: [
      "缩略图一行放不下时横向滚动,不换行。",
      "删光所有素材后 Create 立刻回到置灰状态。",
      "HEIC 图片在多数浏览器里无法预览,缩略图会是空白,但仍按图片提交。",
    ],
    errors: [],
    copy: ["Remove {file name}", "Create"],
    open: ["待定:缩略图只有悬停才看得到删除按钮,触屏设备上无法删除单个素材,是否需要常显?"],
  },
  analyzing: {
    what: [
      "进对话页立刻分析每个素材,再根据分析结果和 prompt 抽取 brief(§2.2)。",
      "原型:开发版真调 seed-2-0-lite;评审这里用录好的结果,「思考中」固定显示约 1.5 秒。",
    ],
    rules: [
      "对话顶部先显示用户的素材缩略图行(88px 方块,音频显示文件名)和 prompt 气泡(没填 prompt 则不显示气泡)。",
      "思考行文案带素材数量,中文回复时是「正在看这 N 个文件…」,呼吸闪烁直到结果回来。",
      "每个文件单独发一个分析请求、并行跑;全部结束后再调 brief 接口(两步是先后关系,不是并行)。",
      "分析期间输入框和发送按钮置灰,不能发消息。",
      "视频文件额外在浏览器里读时长,5 秒内读不到就不带时长,分镜按描述估算。",
    ],
    edges: [
      "上线环境有 Blob 时,文件先直传 Blob(单条最大 500MB,超过 20MB 走分片),再把链接交给分析接口;分析完无论成败都删除 Blob 上的文件。",
      "本地没开 Blob 时整份文件直接 POST 给分析接口;部署环境不走 Blob 时受 Vercel 4.5MB 请求体上限限制。",
      "分析接口最长 300 秒,视频按 2 fps 抽帧,图片 / 音频输出上限 900 tokens,视频 2400 tokens;brief 接口最长 60 秒。",
      "服务端调模型遇到网络中断或 429/5xx 会自动重试 2 次(间隔 0.9 秒、1.8 秒),用户无感。",
      "这一步没有上传进度、没有取消按钮,前端也没有自己的超时。",
      "对话状态只在内存里:这时刷新页面会落到空态(见第 15 步)。",
    ],
    errors: [
      "任一文件分析失败或 brief 失败 → 整次分析算失败,思考行换成错误句 + Retry,详见第 11 步。",
    ],
    copy: ["Reading {n} files…", "正在看这 {n} 个文件…(中文回复)"],
    open: [
      "待定:分析可能长达数分钟(单文件上限 300 秒),界面只有一行闪烁文字,是否要上传进度 / 分步进度 / 取消?",
      "待定:一条素材失败就整批失败,是否改成跳过失败的那条、用其余素材继续?",
    ],
  },
  questions: {
    what: [
      "分析结果折叠成一行「Read N files」,点开是 Footage breakdown;下面是 Agent 的一段话:产品是什么、素材覆盖 / 缺哪些广告环节、brief 七项(§2.2)。",
      "提问卡只问 brief 里 AI 替用户定的项和素材缺口,最多 3 题;一题都不用问时跳过提问卡直接排分镜(§2.3)。",
      "提交后卡片收起成一条「Q / A」用户气泡,随后开始排分镜。",
    ],
    rules: [
      "「Platform & language?」单选 TikTok / IG Reels / FB Reels,选项后缀固定为当前回复语言(English 或 简体中文),默认选中 brief 里的平台。",
      "「Length?」单选 15s / 20s / 30s,默认选中 brief 里的时长。",
      "「Which shots should AI fill in?」多选(标 Pick any),选项是素材没覆盖的叙事角色(Hook / Pain point / Proof / Usage / End card),默认全选。",
      "平台题在 brief 判定平台或字幕语言是 AI 定的时出现;时长题在 prompt 里没写出时长时出现;补拍题在素材有缺口时出现。",
      "每题末尾都有 Other… 自填框;单选题填了 Other 会取消已选项,两者只留一个;多选题 Other 与勾选并存。",
      "点 Continue:答案写回 brief(平台、时长、字幕语言;补拍选择和 Other 写进 notes 交给分镜接口),卡片换成 Q/A 气泡,出现「Laying out the storyboard…」。",
    ],
    edges: [
      "补拍题全部取消勾选也能提交,brief 里写入「Do not AI-shoot any shots; cut the ad only from the footage.」,气泡里答案显示 None。",
      "单选题填了 Other 再清空,会变成什么都没选,气泡显示 None,brief 保留 AI 原来定的值。",
      "单选题的 Other 只写进 notes,不会改 brief 的平台 / 时长字段。",
      "判断素材缺口时只看可剪素材(footage / showcase / evidence),参考片、品牌图、音频不算覆盖。",
      "提问卡和题目文案始终是英文(产品界面),只有语言后缀和 Agent 那段话随回复语言变化。",
      "原型:录制数据两种语言都会出 3 题,补拍题选项为 Pain point、End card;切「回复语言」看中英文版。",
    ],
    errors: [
      "卡片未提交就在输入框发消息 → 不排分镜,Agent 提示先选,见第 14 步。",
    ],
    copy: [
      "Read {n} files",
      "Footage breakdown · {n} files · {u} usable · {c} cut",
      "Only its colours, tone and copy style are borrowed — it stays out of the cut.",
      "Cut · {reason}",
      "Platform & language?",
      "TikTok · English / IG Reels · English / FB Reels · English(中文回复时为 · 简体中文)",
      "Length?",
      "15s / 20s / 30s",
      "Which shots should AI fill in?",
      "Pick any",
      "Hook · a scroll-stopping opening",
      "Pain point · the problem before the product",
      "Proof · a close-up that backs the claim",
      "Usage · someone using the product",
      "End card · product, logo and call to action",
      "Other…",
      "Continue",
      "Q: {title} / A: {answers}(气泡里分两行)",
    ],
    open: [
      "待定:Continue 永远可点、不做任何校验(可以全空提交),是否要求至少选 / 填一项?",
      "待定:「Platform & language?」的语言只能是当前回复语言,想换语言只能在 Other 里写,是否要单独的语言选项?",
      "待定:prompt 去掉「帮我 / 制作 / 广告 / ad / make / a / the…」等填充词后不足 6 个字符就判为空话,brief 除平台、时长外全部算 AI 代定(于是必问平台题);英文的过滤没有单词边界,单词里的 a、ad、the 也会被删,这条规则是否合理?",
    ],
  },
  partial: {
    what: [
      "prompt 里写明了平台和时长 → 提问卡只问 brief 里仍由 AI 替用户定的项(§2.3)。",
      "本次录制:中文「帮我做一条 30 秒的 TikTok 广告」字幕语言是 AI 定的,所以照问「平台与语言」;英文「Make a 30-second TikTok ad」的时长没被识别,所以问「时长」。",
      "补拍题按素材缺口出,和第 4 步一样。",
    ],
    rules: [
      "平台、时长是否算用户说过,由规则从 prompt 里抓关键词决定,不看模型:ig / instagram / ins / reel(s) → IG Reels,fb / facebook → FB Reels,tiktok / 抖音 → TikTok。",
      "时长抓「数字 + 秒 / s / sec / second」,取 15 / 20 / 30 里最接近的值(如 60 秒 → 30s)。",
      "字幕语言、受众、卖点、CTA 是否算 AI 代定由模型返回的 assumed 决定;字幕语言被代定时,即使写了平台也会问「Platform & language?」。",
      "交互与第 4 步提问卡完全相同,题目更少。",
    ],
    edges: [
      "「30-second」中间有连字符,时长规则匹配不到,所以写了时长仍会被问 Length?(英文录制即此情况)。",
      "同时出现 IG 和 FB 关键词时按 FB Reels 处理。",
      "prompt 写全平台、时长,模型也没代定字幕语言,且素材覆盖全部 5 个叙事角色时,不出提问卡,直接排分镜。",
      "原型:切「回复语言」看中英文两种只问缺项的结果。",
    ],
    errors: ["与第 4 步相同;未答题先发消息见第 14 步。"],
    copy: ["Platform & language?", "Length?", "Which shots should AI fill in?", "Pick any", "Other…", "Continue"],
    open: [
      "待定:时长规则不认「30-second」「半分钟」「1 分钟」这类写法,用户写了也会被再问一次,是否扩充规则?",
      "待定:用户写了平台但字幕语言被 AI 代定时仍问「Platform & language?」,会显得没听懂用户,是否把语言单独成题或不问?",
    ],
  },
  plan: {
    what: [
      "只出一版分镜:上方一段方案总结,表格是 Time / Shot / Source,每镜下面灰字是该镜旁白,底部预估积分(§2.4)。",
      "Generate 自动出片(第 8 步);Edit in canvas 带着这份分镜进画布自己剪(§2.7,第 16 步)。",
    ],
    rules: [
      "积分 = 成片基础费 40 + 每个 AI 补拍镜头 50,不按时长;录制版 3 个补拍镜头 = 190 credits。",
      "Time 列按每镜在成片里的实际时长累加(素材变速会换算),保留 1 位小数。",
      "Source 只有 Footage(取自用户素材)和 AI(补拍)两种,AI 用橙色标签。",
      "Shot 列:AI 镜头取分镜接口给的 summary,没有就取补拍 prompt 的第一句(最多 90 字符);素材镜头取命中片段的描述。",
      "生成中、请求中或这版已被新版取代时,两个按钮都置灰。",
      "原型:「AI 补拍镜头」切到 0 时补拍镜头换成可用素材片段,积分只剩 40;「旁白」关掉时旁白灰字仍按分镜显示,只影响后续生成。",
    ],
    edges: [
      "补拍镜头数量没有上限,积分随之线性增加。",
      "素材镜头带变速时按变速后时长计,如录制中文版第 4 镜 2.1 秒素材 0.5× 慢放,表里占 4.2 秒。",
      "分镜接口最长 300 秒;空分镜按失败处理。",
    ],
    errors: [
      "分镜接口失败或返回没有镜头 → 思考行换成错误句 + Retry,见第 12 步。",
    ],
    copy: ["Time", "Shot", "Source", "Footage", "AI", "Estimated {credits} credits", "Edit in canvas", "Generate", "Tell me what to change…", "想改哪里直接告诉我…(中文回复时的输入框占位)"],
    open: [
      "待定:分镜卡只显示预估积分,点 Generate 前不检查余额,积分不足时怎么拦、拦在哪一步?",
      "待定:旧版分镜被取代后按钮全部失效,用户无法回到旧版本出片,是否需要「恢复这一版」?",
    ],
  },
  revised: {
    what: [
      "方案出来后用户在对话里说要改什么 → 带当前分镜 + 这句话重排,出新一版表;旧表变淡(55% 透明)、按钮置灰(§2.4)。",
    ],
    rules: [
      "有分镜时发出的每句话都当作改稿要求,基于最新一版(分镜或成片)重排;没有「确认」之类的分支。",
      "发出后出现用户气泡和「Laying out the storyboard…」,输入框置灰直到新表出来。",
      "新版积分按新分镜重新算;录制改稿「开头换成雪山溪流」后变成 4 个补拍镜头 = 240 credits。",
      "原型:评审里任何改稿都返回录好的同一版改稿结果。",
    ],
    edges: [
      "改稿可以连续多次,每次只保留最新一版可操作,之前所有版本都变淡。",
      "改稿请求失败时旧版不会被置灰,按钮恢复可用,用户可直接用旧版出片。",
      "发送空白内容不会发出。",
    ],
    errors: [
      "改稿失败 → 错误句 + Retry,Retry 会重发同一份请求(含这次改稿原话),见第 12 步。",
    ],
    copy: ["Laying out the storyboard…", "正在排分镜…(中文回复)", "Estimated {credits} credits", "Edit in canvas", "Generate"],
    open: ["待定:用户说「好的 / 就这样」也会被当成改稿再排一次,是否需要识别确认语直接提示点 Generate?"],
  },
  generating: {
    what: [
      "点 Generate 后 Agent 先回一句,随后工具调用行逐条出现、转圈、打勾,可展开看入参(§2.5)。",
      "原型是演示:不调 Seedance / TTS、不扣费;真实产品是带 ffmpeg 沙盒的 Agent,行来自实际工具调用流(§5)。",
    ],
    rules: [
      "工具行与演示耗时:Get usage 0.5s → Upload reference image 1s → 每个补拍镜头一行 Generate video(4 / 5 / 6s 轮流,并行)→ List voices 0.5s → Generate audio 2s → ffmpeg 剪切 1.5s / 拼接 2s / 字幕 1.5s / 混音 1.5s → Check output 1s。",
      "录制版(3 个补拍 + 旁白)全程约 17.5 秒;补拍切到 0 时没有参考图和 Generate video 行,约 10.5 秒;关掉旁白少 List voices 和 Generate audio 两行。",
      "Generate video 行展开显示该镜补拍 prompt,Generate audio 行展开显示全部旁白;其余行没有入参,不能展开。",
      "生成中分镜卡两个按钮置灰,重复点 Generate 不会再开一轮;输入框仍可输入(发出的话进入排队,见第 9 步)。",
      "全部打勾后自动出成片卡,见第 10 步。",
    ],
    edges: [
      "生成中刷新页面会丢失整个对话,落到空态(见第 15 步)。",
      "原型:评审里点「生成中发一句话」可模拟生成中用户插话。",
    ],
    errors: [],
    copy: [
      "Meanwhile, I'll prepare the live footage segments, title card and end card.",
      "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。(中文回复)",
      "Get usage",
      "Upload reference image",
      "Generate video",
      "List voices",
      "Generate audio",
      "Run ffmpeg · cut footage",
      "Run ffmpeg · assemble",
      "Run ffmpeg · subtitles",
      "Run ffmpeg · mix audio",
      "Check output",
    ],
    open: [
      "待定:工具行没有失败态(只有转圈和打勾),真实产品某个补拍 / 配音 / 渲染失败时怎么展示、是否退积分、能否单步重试?",
      "待定:Get usage 之后没有积分不足的分支,余额不够时是否在这里中止并引导充值?",
      "待定:生成中没有取消按钮,也没有整体进度或剩余时间,真实耗时可能是分钟级。",
    ],
  },
  queued: {
    what: ["生成中用户发的话先排队,显示为用户气泡;出片后合并成一次改稿,自动出新一版分镜(§4 异常表)。"],
    rules: [
      "生成中发出的每句话都只显示为气泡,Agent 暂不回应,工具行继续跑。",
      "成片卡出来后,所有排队的话按换行拼成一句改稿要求,基于刚交付的这一版重排,随后出现「Laying out the storyboard…」和新分镜表。",
      "新分镜出来后更早的分镜表变淡失效,成片卡保留不变。",
      "原型:评审这一步预置了一条排队消息,停留约 17.5 秒等演示出片后自动续上。",
    ],
    edges: [
      "排队的话没有条数上限,也没有「已排队」的标记或撤回。",
      "合并后的改稿如果失败,按第 12 步处理,Retry 重发合并后的同一份请求。",
    ],
    errors: ["合并改稿失败 → 错误句 + Retry,见第 12 步。"],
    copy: ["Laying out the storyboard…", "正在排分镜…(中文回复)"],
    open: ["待定:排队的话在出片前完全没有反馈,用户可能以为没发出去,是否要 Agent 回一句「收到,出片后再改」?"],
  },
  reel: {
    what: [
      "成片卡按参考图:右上收藏 / 下载 / 重新生成 / 剪辑 / 更多,中间播放键,底部控制条(§2.6)。",
      "卡下依次:交付说明 → 最终分镜(Storyboard)→ Models, voice & credits(合计 = 分镜表预估)→ Needs your check。",
      "原型:成片固定为 RELLET 演示片,文件名、分辨率、时长、响度都是写死的,与用户素材和分镜无关(§2.6 已知限制)。",
    ],
    rules: [
      "收藏切换实心红心,只在当前页面有效,刷新或重新进入即丢失。",
      "重新生成用同一份分镜再跑一遍第 8 步演示,并在下方追加一张新的成片卡,旧卡保留;请求中或生成中置灰。",
      "剪辑图标与 Edit in canvas 一样带着这版分镜进画布(第 16 步),生成中也可点。",
      "更多:Copy link 弹 toast「Link copied」,Delete 弹「Deleted (demo only)」,toast 1.8 秒消失。",
      "Models, voice & credits:每个 AI 镜头一行(Seedance 2.5 + 时长 + 50 credits),有旁白时一行配音音色,一行最终合成 40 credits,最后合计。",
      "Needs your check:卖点在素材描述里重合不到一半时提示核实宣称;有 AI 镜头时提示核对包装小字 / logo;背景音乐不是用户上传的就提示换授权曲目。",
    ],
    edges: [
      "成片出来后在输入框发话仍按改稿处理,基于成片这一版重排(同第 7 步)。",
      "成片卡出现时页面滚到卡片顶部而不是最底部。",
      "原型:交付说明和成片下方的小节标题(Storyboard 等)中文回复时仍是英文,只有正文随语言变化。",
    ],
    errors: ["视频加载失败 → 卡片换成 Couldn't load the video + Retry,见第 13 步;打开「视频加载失败」开关在本步也能看到。"],
    copy: [
      "The reel is ready: rellet_ha_spray_ad_9x16.mp4 · 1080×1920 · 30 fps · 15.6s · about -14 LUFS.",
      "成片做好了:… · 响度约 -14 LUFS。(中文回复)",
      "Storyboard",
      "Models, voice & credits",
      "Shot {n} · Seedance 2.5 · {d}s · {per} credits",
      "Voiceover · {voice}",
      "Final render · {base} credits",
      "Total · {total} credits",
      "Needs your check",
      "“{selling point}” isn't clearly shown in your footage — confirm the claim before the ad runs.",
      "AI can blur small packaging text or the logo — compare shot {n} with the real product.",
      "The background music is a placeholder — swap in a licensed track before you publish.",
      "Copy link / Delete / Link copied / Deleted (demo only)",
      "Favorite / Download / Regenerate / Edit in canvas / More(图标按钮的无障碍名)",
    ],
    open: [
      "待定:Download 永远下载演示片 rellet_ha_spray_ad_9x16.mp4,真实产品要下载本次成片(签名链接、文件命名)。",
      "待定:Copy link 只弹 toast,没有真正复制链接;Delete 也不删除卡片——两者真实行为待定。",
      "待定:配音一行直接显示音色内部 id(如 warm-f / cn-f),是否换成用户可读的音色名?",
      "待定:重新生成会再按分镜积分计费吗?当前不提示、不确认,也不检查余额。",
    ],
  },
  failAnalyze: {
    what: [
      "分析或 brief 失败:思考行换成一句错误 + Retry,素材不用重新选(§4)。",
      "点 Retry 会重新分析;想看重试仍失败,打开侧栏的「分析失败」开关。",
    ],
    rules: [
      "错误句 = 前缀 + 原始报错;任一文件失败或 brief 失败都算整次失败,并行的其余文件也作废。",
      "Retry 用内存里的原文件重新跑整次分析(会重新上传到服务器),防连点,请求中再点无效。",
      "Retry 只在错误句之后只有用户气泡或普通 Agent 回复时显示;后面已有新请求就不再显示。",
      "失败后输入框可用;此时发消息不会触发分析,Agent 回「The storyboard isn't ready yet — hit Retry above to try again.」。",
      "原型:评审这里的报错是模拟的超时文案。",
    ],
    edges: [
      "原始报错直接透出给用户,可能是服务端中文(如「无法连接模型服务」「ARK 502: …」)或「{文件名}: HTTP 413 Request Entity Too Large」这类网关报错。",
      "brief 接口返回里没有 brief 时报 No brief returned。",
      "刷新页面后原文件已不在内存,只能回落地页重新上传(第 15 步)。",
    ],
    errors: ["分析失败 → 错误句 + Retry → 点 Retry 后旧错误句移除、重新出现思考行;仍失败则换成新的错误句 + Retry,次数不限。"],
    copy: [
      "Couldn't read your footage: {error}",
      "素材分析失败: {error}(中文回复)",
      "Retry",
      "The storyboard isn't ready yet — hit Retry above to try again.",
      "分镜还没排出来,点上面的 Retry 再试一次。(中文回复)",
      "No brief returned",
    ],
    open: [
      "待定:报错原文直接展示,包含中文服务端信息和 HTTP 状态码,是否统一成面向用户的英文说明 + 建议(如文件太大、换格式)?",
      "待定:分析失败后输入框提示「分镜还没排出来」,与实际(素材还没读完)不符,是否单独一句?",
      "待定:没有重试上限、也没有「换素材」的入口,失败几次后用户只能回落地页。",
    ],
  },
  failOutline: {
    what: ["排分镜(首版或改稿)失败:思考行换成错误句 + Retry;重试会重发同一份请求(含改稿内容)(§4)。"],
    rules: [
      "Retry 重发上一次的分镜请求(brief + 素材分析 + 改稿原话),不重新分析素材。",
      "Retry 显示规则与第 11 步相同;请求中再点无效。",
      "首版失败时还没有分镜,此时发消息只会得到提示「The storyboard isn't ready yet — hit Retry above to try again.」,不会重排。",
      "改稿失败时上一版分镜保持可用,用户也可以直接再发一句新的改稿要求(此后 Retry 隐藏)。",
      "原型:打开「分镜失败」开关后,评审里所有排分镜请求(包括 Retry)都会失败。",
    ],
    edges: [
      "分镜接口最长 300 秒,超时由网关返回非 JSON,用户看到「HTTP 504」这类状态码。",
      "接口返回没有镜头时报 No storyboard returned。",
    ],
    errors: ["分镜失败 → 错误句 + Retry → 点 Retry 后旧错误句移除、重发同一请求;仍失败则换成新的错误句 + Retry,次数不限。"],
    copy: [
      "Couldn't lay out the storyboard: {error}",
      "分镜没排出来: {error}(中文回复)",
      "Retry",
      "No storyboard returned",
      "The storyboard isn't ready yet — hit Retry above to try again.",
    ],
    open: ["待定:报错原文直接展示(可能是中文服务端信息或 HTTP 状态码),是否统一成面向用户的说明?"],
  },
  failVideo: {
    what: ["成片视频加载失败:卡片换成灰底「Couldn't load the video」+ Retry(§4)。"],
    rules: [
      "视频元素报错即进入失败态,整张卡(含右上按钮和控制条)被替换。",
      "点 Retry 恢复成视频卡并重新加载同一个地址。",
      "卡片下方的交付说明、分镜、积分、需确认事项照常显示。",
      "原型:评审这一步故意传了一个不存在的视频地址;「视频加载失败」开关在第 10 步也能触发。",
    ],
    edges: ["失败态下没有下载入口;但正常卡上的 Download 永远下载演示片,与这里加载的地址无关。"],
    errors: ["加载失败 → Couldn't load the video + Retry → Retry 重载同一地址;地址本身坏了会立刻再次失败。"],
    copy: ["Couldn't load the video", "Retry"],
    open: ["待定:Retry 只是重载同一个地址,链接过期或文件丢失时永远失败,是否要重新取签名链接或提示重新生成?"],
  },
  answerFirst: {
    what: ["提问卡还没提交就在输入框发消息:不排分镜,Agent 回一句提示让用户先在卡片里选(§2.3)。"],
    rules: [
      "用户这句照常显示为气泡,但内容被丢弃,不会写进 brief 或 notes。",
      "提问卡保留在原位,仍可正常作答并点 Continue。",
      "原型:评审里用户这句是「先帮我排分镜吧」/「Just lay out the storyboard」,提示文案与产品代码逐字一致。",
    ],
    edges: [
      "可以反复发,每次都追加一条用户气泡 + 同一句提示。",
      "三题都不用问、没有提问卡时这条提示不会出现,因为分析完直接排分镜。",
    ],
    errors: [],
    copy: [
      "Pick your answers in the card above and I'll lay out the storyboard.",
      "先在上面的卡片里选一下,我再排分镜。(中文回复)",
    ],
    open: ["待定:用户在输入框里说的话(如「先帮我排分镜吧」「做 20 秒的」)是否应被理解为答题,而不是一律要求回卡片选?"],
  },
  empty: {
    what: ["直接打开对话页(没带素材):提示回落地页重来(§4)。"],
    rules: [
      "整屏只有一句提示和 Go to home 链接,不显示侧栏、顶栏和输入框。",
      "点 Go to home 回到落地页 /prototypes/hybrid-reel-agent。",
    ],
    edges: [
      "素材只在内存里交接、取一次即清空,所以刷新对话页、浏览器后退再前进、复制链接在新标签打开都会落到空态。",
      "会话持久化本期不做(§3、§6)。",
    ],
    errors: [],
    copy: ["Start from the home page to add your footage.", "Go to home"],
    open: ["待定:分析或生成中途刷新会丢掉整段对话和已花的时间,真实产品的会话恢复 / 历史记录何时做?"],
  },
  ...EDITOR_NOTES,
};
