/* 评审侧栏「这一屏」的中文说明。章节号指 docs/superpowers/specs/2026-10-14-hybrid-reel-agent-design.md;
   「待定落地」指 docs/superpowers/specs/2026-10-15-hybrid-reel-open-items-fix-design.md。 */

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
  /* ───────── 1 落地页 ───────── */
  home: {
    what: [
      "落地页只保留输入框主体:「+」加素材、写一句话、点 Create,Creation type 下拉、企业锁等外围交互不做(§2.1、§6)。",
      "用户在这里一次交齐素材和需求,Create 后进入对话页,由 Agent 接手分析(§2)。",
      "左侧图标栏、历史栏和顶栏沿用 v1.13 外壳,不属于本需求。",
      "原型:评审里落地页顶栏显示 Agent 当前余额(和对话页同一个数,开「积分不足」为 2);开发版落地页顶栏不读余额,固定 35,600。",
    ],
    rules: [
      "「+」打开系统文件选择,可多选,接受 video/*、image/*、audio/*。",
      "选文件当下就校验(上限见边界情况),不合规的文件不加入,输入框上方出一条可关闭的红色提示,见第 13 步。",
      "文件类型先看 MIME(image/ video/ audio/),MIME 为空时按扩展名兜底:jpg/jpeg/png/webp/heic/heif/gif 算图片,mp4/mov/m4v/webm/avi/mkv 算视频,mp3/m4a/wav/aac/ogg/flac 算音频,都不是就拒收。",
      "没有素材时 Create 置灰(40% 透明),悬停提示 Add footage first,回车也不触发。",
      "有素材时点 Create 或在输入框按 Enter 提交;Shift+Enter 换行,输入法组字中的 Enter 不提交。",
      "Prompt 可不填;回复语言按 prompt 判断:含中文→中文,写了英文→英文,没写→按浏览器语言(zh 开头为中文,否则英文)。",
    ],
    edges: [
      "最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB。",
      "视频时长在浏览器里读,5 秒内读不到就不按时长拦,只按大小拦;读时长期间缩略图要等这批文件读完才出现。",
      "同一个文件可以重复添加,会出现两张缩略图、按两条素材分别分析(计入 10 个上限)。",
      "Prompt 不限长度,首尾空白会被去掉再提交。",
    ],
    errors: ["选到超限 / 类型不对的文件 → 这些文件不加入,提示里每个文件一行原因 → 用户换文件重选或点 × 关掉提示,见第 13 步。"],
    copy: [
      "Turn your footage into a finished ad",
      "Add your product footage and tell me what ad to make…",
      "Hybrid Reel",
      "Add footage first",
      "Create",
      "Add footage(「+」的无障碍名)",
    ],
  },

  /* ───────── 2 已选素材 ───────── */
  picked: {
    what: [
      "加了素材后,缩略图排成一行出现在输入框上方,作为提交前的确认区(§2.1)。",
      "点 Create:素材 + prompt 一起带进对话页并立即开始分析(§2.2)。",
    ],
    rules: [
      "图片显示原图缩略,视频显示第 0.5 秒画面,音频显示音符图标。",
      "悬停缩略图右上角出现 ×(键盘聚焦也会出现),点了从列表移除该素材,腾出的名额可以再加。",
      "再点「+」追加的文件同样过上限校验,已选数量计入 10 个上限。",
      "Create 后素材以内存方式交给对话页(不经服务器),同时把原文件存进浏览器 IndexedDB,供之后进画布使用。",
      "原型:评审这一步预置了 RELLET 的 4 个素材(2 段视频 + 2 张图)和录制时的 prompt(「制作一条广告」/「Make an ad」),Create 后走录好的数据。",
    ],
    edges: [
      "缩略图一行放不下时横向滚动,不换行。",
      "删光所有素材后 Create 立刻回到置灰状态。",
      "HEIC 图片在多数浏览器里无法预览,缩略图会是空白,但仍按图片提交。",
      "删除按钮只在悬停或键盘聚焦时出现,触屏设备上看不到。",
    ],
    errors: [],
    copy: ["Remove {file name}", "Create"],
  },

  /* ───────── 3 分析中 ───────── */
  analyzing: {
    what: [
      "进对话页立刻逐个分析素材,再根据分析结果和 prompt 抽取 brief(§2.2)。",
      "思考行显示读到第几个文件,旁边有 Cancel,用户可随时中止(待定落地 §2)。",
      "原型:开发版真调 seed-2-0-lite;评审这里用录好的结果,「思考中」共约 1.5 秒,按文件均分推进度。",
    ],
    rules: [
      "对话顶部先显示用户的素材缩略图行(88px 方块,音频显示文件名)和 prompt 气泡(没填 prompt 则不显示气泡)。",
      "思考行文案 Reading {done}/{n} files…,从 0/{n} 开始,每有一个文件结束(成功或失败)就 +1,呼吸闪烁直到 brief 回来。",
      "每个文件单独发一个分析请求、并行跑;全部结束后再调 brief 接口(两步是先后关系,不是并行)。",
      "点 Cancel:立刻中止上传和分析请求,思考行换成「Analysis cancelled」+ Retry,取消不计入连续失败次数。",
      "brief 请求不能中途取消;此时点 Cancel 会等它回来后丢掉结果,同样显示「Analysis cancelled」。",
      "分析期间输入框和发送按钮置灰,不能发消息。",
      "视频文件额外在浏览器里读时长,5 秒内读不到就不带时长,分镜按描述估算。",
    ],
    edges: [
      "上线环境有 Blob 时,文件先直传 Blob(放行 video/*、image/*、audio/*,单条最大 500 MB,超过 20 MB 走分片),再把链接交给分析接口;分析完无论成败都删除 Blob 上的文件。",
      "本地没开 Blob 时整份文件直接 POST 给分析接口;部署环境不走 Blob 时受 Vercel 4.5 MB 请求体上限限制,超了按「文件太大」报错。",
      "分析接口最长 300 秒,视频按 2 fps 抽帧,图片 / 音频输出上限 900 tokens,视频 2400 tokens;brief 接口最长 60 秒。",
      "服务端调模型遇到网络中断或 429/5xx 会自动重试 2 次(间隔 0.9 秒、1.8 秒),用户无感。",
      "只有「读到第几个文件」的进度,没有字节级上传进度,前端也没有自己的超时。",
      "单个文件失败不影响其余文件:跳过它继续,回复里列出被跳过的文件,见第 4 步;全部文件都失败才整体报错。",
      "对话状态只在内存里:这时刷新页面会落到空态(见第 21 步)。",
    ],
    errors: [
      "全部文件分析失败或 brief 失败 → 思考行换成错误句 + Retry + Details,见第 14 步。",
      "用户点 Cancel → 「Analysis cancelled」+ Retry,点 Retry 用原文件重新分析。",
    ],
    copy: ["Reading {done}/{n} files…", "正在看素材 {done}/{n}…(中文回复)", "Cancel", "Analysis cancelled", "已取消分析(中文回复)", "Retry"],
  },

  /* ───────── 4 提问卡 ───────── */
  questions: {
    what: [
      "分析结果折叠成一行「Read N files」,点开是 Footage breakdown;下面是 Agent 的一段话:产品是什么、素材覆盖 / 缺哪些广告环节、brief 七项(§2.2)。",
      "提问卡只问 brief 里 AI 替用户定的项和素材缺口,最多 4 题;一题都不用问时跳过提问卡直接排分镜(§2.3)。",
      "提交后卡片收起成一条「Q / A」用户气泡,随后开始排分镜。",
    ],
    rules: [
      "「Platform?」单选 TikTok / IG Reels / FB Reels,默认选中 brief 里的平台;只在 prompt 里没抓到平台关键词时出现。",
      "「Subtitle language?」单选 English / 简体中文 / 繁體中文,默认按 brief 的字幕语言对到选项(对不上就按回复语言);规则没从 prompt 抓到语言、且 prompt 是空话或模型说是它代定时出现。",
      "「Length?」单选 15s / 20s / 30s,默认选中 brief 里的时长;只在 prompt 里没抓到时长时出现。",
      "「Which shots should AI fill in?」多选(标 Pick any),选项是素材没覆盖的叙事角色(Hook / Pain point / Proof / Usage / End card),默认全选;素材有缺口才出现。",
      "每题末尾都有 Other… 自填框;单选题点选项会清空 Other,填 Other 会取消已选项,两者只留一个;多选题 Other 与勾选并存。",
      "单选题都有答案(选项或 Other 文字)Continue 才可点,否则置灰;补拍题可以一个都不选。",
      "点 Continue:平台、时长、字幕语言写回 brief,补拍选择和各题 Other 写进 notes 交给分镜接口;卡片换成 Q/A 气泡,出现「Laying out the storyboard…」。",
      "原型:录制 prompt「制作一条广告」/「Make an ad」是空话,四题都出;补拍题选项为 Pain point、End card;切「回复语言」看中英文版。",
    ],
    edges: [
      "「空话」= 去掉填充词后不足 6 个字符;中文填充词(帮我 / 请 / 生成 / 制作 / 做 / 一条 / 一个 / 广告 / 广告片 / 视频 / 短片)按子串去,英文(ad / ads / video / make / create / a / an / the / for me / please)按整词去。",
      "补拍题全部取消勾选也能提交,notes 写入「Do not AI-shoot any shots; cut the ad only from the footage.」,气泡里答案显示 None。",
      "平台 / 时长题的 Other 只写进 notes,不改 brief 的平台 / 时长字段;字幕语言题的 Other(如 Japanese)直接作为字幕语言。",
      "brief 平台不在三个选项里时平台题没有默认值,必须手动选才能 Continue。",
      "判断素材缺口时只看可剪素材(footage / showcase / evidence),参考片、品牌图、音频不算覆盖。",
      "提问卡、题目、「Read N files」始终是英文(产品界面),只有 Agent 那段话随回复语言变化。",
      "「Read N files」的 N 只数分析成功的文件,被跳过的不算(如上传 4 个跳过 1 个显示 Read 3 files);只有 1 个时为 Read 1 file。",
    ],
    errors: [
      "部分文件分析失败 → 回复下方每个文件一行「Skipped {file}: {reason}」(中文回复为「跳过了 {file}:{reason}」),reason 是统一报错句(四类见第 14 步,随回复语言变化,文件名处写 The file / 该文件),其余素材照常出题和排分镜。",
      "卡片未提交就在输入框发消息 → 不排分镜,Agent 提示先选,见第 20 步。",
    ],
    copy: [
      "Read {n} files / Read 1 file",
      "Footage breakdown · {n} files · {u} usable · {c} cut",
      "Only its colours, tone and copy style are borrowed — it stays out of the cut.",
      "Skipped {file}: {reason}",
      "跳过了 {file}:{reason}(中文回复)",
      "Platform?",
      "TikTok / IG Reels / FB Reels",
      "Subtitle language?",
      "English / 简体中文 / 繁體中文",
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
      "Q: {title} / A: {answers}(气泡里分两行,题与题空一行)",
    ],
  },

  /* ───────── 5 提问卡只问缺项 ───────── */
  partial: {
    what: [
      "prompt 里写明了平台和时长 → 提问卡只问 brief 里仍由 AI 替用户定的项(§2.3)。",
      "本次录制:中文「帮我做一条 30 秒的 TikTok 广告」字幕语言是模型代定的,问「Subtitle language?」+ 补拍题;英文「Make a 30-second TikTok ad」只问补拍题。",
    ],
    rules: [
      "平台、时长、字幕语言是否算用户说过,由规则从 prompt 里抓关键词决定,规则抓到就不问,不看模型。",
      "平台:ig / instagram / insta / ins → IG Reels,fb / facebook → FB Reels,tiktok / tik tok / 抖音 → TikTok,只写 reel(s) → IG Reels。",
      "时长认 30s / 30 s / 30-second / 30 sec / 30秒 / 二十五秒 / 半分钟 / half a minute / 1 分钟 / 一分钟 / 两分钟 / 1 minute 等写法,再吸附到 15 / 20 / 30 里最近的值(如 60 秒 → 30s,10 秒 → 15s,两分钟 → 30s)。",
      "字幕语言:写了简体 / 繁體 / 中文 / 粤语 / English / 英文等且只提到一种时算用户说过;提到两种算拿不准,交给模型。",
      "受众、卖点、CTA 是否代定看模型返回的 assumed,但它们不出题,只影响 Agent 那段话里的「我先按…来定」。",
      "交互与第 4 步提问卡完全相同,题目更少。",
    ],
    edges: [
      "同时出现 IG 和 FB 关键词时按 FB Reels;同时出现 IG 和 TikTok 时按 IG Reels。",
      "中文数字认 零 到 九百九十九(含 两 / 兩、百,如 十五、二十五、一百二十、一百零五),整段一起读;「二十五秒」= 25 秒,与 20、30 等距时吸附到较短的 20s;超过 30 秒的一律吸附到 30s。",
      "prompt 写全平台、时长和字幕语言,且素材覆盖全部 5 个叙事角色时,不出提问卡,直接排分镜。",
      "原型:切「回复语言」看中英文两种只问缺项的结果。",
    ],
    errors: ["与第 4 步相同;未答题先发消息见第 20 步。"],
    copy: ["Subtitle language?", "Which shots should AI fill in?", "Pick any", "Other…", "Continue"],
  },

  /* ───────── 6 分镜表 ───────── */
  plan: {
    what: [
      "只出一版分镜:上方一段方案总结,表格是 Time / Shot / Source,每镜下面灰字是该镜旁白,底部预估积分(§2.4)。",
      "Generate 自动出片(第 9 步);Edit in canvas 带着这份分镜和当前余额进画布自己剪(§2.7,第 22 步)。",
    ],
    rules: [
      "积分 = 成片基础费 40 + 每个 AI 补拍镜头 50,不按时长;录制版 3 个补拍镜头 = 190 credits。",
      "点 Generate 先查余额:够就立刻扣掉预估积分(顶栏余额同步减少)并开始生成;不够弹「Not enough credits」,不扣费、不开跑,见第 17 步。",
      "Time 列按每镜在成片里的实际时长累加(素材变速会换算),保留 1 位小数。",
      "Source 只有 Footage(取自用户素材)和 AI(补拍)两种,AI 用橙色标签。",
      "Shot 列:AI 镜头取分镜接口给的 summary,没有就取补拍 prompt 的第一句(最多 90 字符);素材镜头取命中片段的描述。",
      "请求中或生成中两个按钮都置灰;这版被新版取代后按钮隐藏,换成 Use this version(第 8 步)。",
      "原型:「AI 补拍镜头」切到 0 时补拍镜头换成可用素材片段,积分只剩 40;「旁白」关掉时旁白灰字仍按分镜显示,只影响后续生成。",
      "原型:评审里点 Edit in canvas(或成片卡的剪辑图标)进剪辑器时,带过去的是 Agent 当前余额(已扣过的生成费用不会回来),和开发版交接一致;从侧栏直接点剪辑器步骤则用剪辑器自己的起始值(35,600,开「积分不足」为 2)。",
    ],
    edges: [
      "补拍镜头数量没有上限,积分随之线性增加。",
      "素材镜头带变速时按变速后时长计,如录制中文版第 4 镜 2.1 秒素材 0.5× 慢放,表里占 4.2 秒。",
      "分镜接口最长 300 秒;返回没有镜头按失败处理。",
      "Generate 防连点:同一时刻只会开一轮生成。",
    ],
    errors: [
      "分镜接口失败或返回没有镜头 → 思考行换成错误句 + Retry,见第 16 步。",
      "余额不足 → 「Not enough credits」弹窗,见第 17 步。",
    ],
    copy: ["Time", "Shot", "Source", "Footage", "AI", "Estimated {credits} credits", "Edit in canvas", "Generate", "Tell me what to change…", "想改哪里直接告诉我…(中文回复时的输入框占位)"],
  },

  /* ───────── 7 改稿后 ───────── */
  revised: {
    what: ["方案出来后用户在对话里说要改什么 → 带当前分镜 + 这句话重排,出新一版表;旧表变淡(55% 透明)、按钮换成 Use this version(§2.4)。"],
    rules: [
      "有分镜时发出的每句话都当作改稿要求,基于最新一版(分镜或成片)重排;不识别「好的 / 就这样」之类的确认语,确认就点 Generate。",
      "发出后出现用户气泡和「Laying out the storyboard…」,输入框置灰直到新表出来。",
      "新版积分按新分镜重新算;录制改稿「开头换成雪山溪流」后变成 4 个补拍镜头 = 240 credits。",
      "改稿本身不扣积分,只有 Generate 扣。",
      "原型:评审里任何改稿都返回录好的同一版改稿结果。",
    ],
    edges: [
      "改稿可以连续多次,只有最新一版可操作,之前所有版本都变淡、只留 Use this version。",
      "改稿请求失败时旧版不会变淡,按钮照常可用,用户可直接用旧版出片。",
      "发送空白内容不会发出。",
    ],
    errors: ["改稿失败 → 错误句 + Retry,Retry 会重发同一份请求(含这次改稿原话),见第 16 步。"],
    copy: ["Laying out the storyboard…", "正在排分镜…(中文回复)", "Estimated {credits} credits", "Use this version", "用这一版(中文回复)", "Edit in canvas", "Generate"],
  },

  /* ───────── 8 用回旧版分镜 ───────── */
  useVersion: {
    what: ["改稿后觉得旧版更好:在旧版分镜下点 Use this version,把那一版作为最新出一张新卡,可以直接 Generate 或进画布(待定落地 §2)。"],
    rules: [
      "每张被取代的分镜卡下方都有 Use this version,点了在对话末尾追加一张内容相同的新分镜卡,其余所有分镜卡都变旧版。",
      "不调模型、不重排、不扣积分,新卡积分就是那一版的预估(录制首版 190 credits)。",
      "新卡和普通最新版一样:Generate / Edit in canvas 可用,之后在输入框说话按它改稿。",
      "原型:评审这一步预置为首版 → 改稿版 → 在首版上点了 Use this version,末尾是首版的副本。",
    ],
    edges: [
      "请求中或生成中 Use this version 置灰,点了也无效。",
      "同一张旧卡可以反复点,每次都追加一张新卡。",
    ],
    errors: [],
    copy: ["Use this version", "用这一版(中文回复)"],
  },

  /* ───────── 9 生成中 ───────── */
  generating: {
    what: [
      "点 Generate 后 Agent 先回一句,随后工具调用行逐条出现、转圈、打勾,可展开看入参;顶部显示进行到第几步(§2.5)。",
      "原型是演示:不调 Seedance / TTS、不出真成片;真实产品是带 ffmpeg 沙盒的 Agent,行来自实际工具调用流(§5)。",
    ],
    rules: [
      "开跑时已扣掉分镜预估积分(录制版 190),顶栏余额立即减少。",
      "工具行与演示耗时:Get usage 0.5s → Upload reference image 1s → 每个补拍镜头一行 Generate video · Shot {n}(4 / 5 / 6s 轮流,并行)→ List voices 0.5s → Generate audio 2s → ffmpeg 剪切 1.5s / 拼接 2s / 字幕 1.5s / 混音 1.5s → Check output 1s。",
      "录制版(3 个补拍 + 旁白)12 行、全程约 17.5 秒;关掉旁白少 2 行、约 15 秒;补拍切到 0 时没有参考图和 Generate video 行,约 10.5 秒(无旁白 8 秒)。",
      "工具区顶部「Step {i} of {n}」:i = 已出现的行数,n = 总行数。",
      "Generate video 行展开显示该镜补拍 prompt,Generate audio 行展开显示全部旁白;其余行没有入参,不能展开。",
      "生成中输入框发送键旁出现 Stop,点了停在当前行并退回未完成部分的积分,见第 11 步。",
      "生成中分镜卡两个按钮置灰,重复点 Generate 不会再开一轮;输入框仍可输入(发出的话进入排队,见第 10 步)。",
      "全部打勾后自动出成片卡,见第 12 步。",
      "原型:评审里点「生成中发一句话」可模拟生成中用户插话;打开「生成失败(Agent)」开关后第 2 个补拍镜头会失败,见第 18 步。",
    ],
    edges: [
      "生成中刷新页面会丢失整个对话,落到空态(见第 21 步)。",
      "同一时刻只有一个工具区在跑;Regenerate、Retry shot 都要等当前这轮结束或停止。",
    ],
    errors: [
      "某个补拍镜头失败 → 该行红叉 + 原因,退回这一镜 50 积分,其余照常出片,见第 18 步。",
      "余额不够时根本不会开跑,见第 17 步。",
    ],
    copy: [
      "Meanwhile, I'll prepare the live footage segments, title card and end card.",
      "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。(中文回复)",
      "Step {i} of {n}",
      "Get usage",
      "Upload reference image",
      "Generate video · Shot {n}",
      "List voices",
      "Generate audio",
      "Run ffmpeg · cut footage",
      "Run ffmpeg · assemble",
      "Run ffmpeg · subtitles",
      "Run ffmpeg · mix audio",
      "Check output",
      "Stop",
    ],
  },

  /* ───────── 10 生成中排队 ───────── */
  queued: {
    what: ["生成中用户发的话先排队,显示为用户气泡;出片后合并成一次改稿,自动出新一版分镜(§4 异常表)。"],
    rules: [
      "生成中发出的每句话都只显示为气泡,Agent 暂不回应,工具行继续跑。",
      "成片卡出来后,所有排队的话按换行拼成一句改稿要求,基于刚交付的这一版重排,随后出现「Laying out the storyboard…」和新分镜表。",
      "生成中点 Stop 时,排队的话同样立刻合并成一次改稿,基于最新一版分镜重排。",
      "新分镜出来后更早的分镜表变淡,成片卡保留不变。",
      "原型:评审这一步预置了一条排队消息,停留约 17.5 秒等演示出片后自动续上。",
    ],
    edges: [
      "排队的话没有条数上限,也没有「已排队」的标记或撤回;出片前 Agent 不回应。",
      "合并改稿不扣积分,出新分镜后要再点 Generate 才扣。",
    ],
    errors: ["合并改稿失败 → 错误句 + Retry,Retry 重发合并后的同一份请求,见第 16 步。"],
    copy: ["Laying out the storyboard…", "正在排分镜…(中文回复)"],
  },

  /* ───────── 11 已停止生成 ───────── */
  stopped: {
    what: ["生成中点 Stop:工具区停在当时那一行,未完成部分的积分退回,Agent 回一句退了多少(待定落地 §2)。"],
    rules: [
      "Stop 只在有工具区正在跑时出现在发送键旁(整条生成和 Retry shot 都可以停)。",
      "点了之后:当时在跑的行显示 Stopped,已完成的行保留打勾,还没开始的行不出现;顶部变成「Stopped at step {i} of {n}」。",
      "退款 = 已扣 − 已退(失败镜头) − 已生成完的补拍镜头 × 50;成片没出来,40 基础费全退。",
      "停止前已经到点失败的镜头先按失败退款,不会重复退。",
      "停止后不出成片卡,分镜卡按钮恢复可用,可以重新 Generate(重新扣全额)。",
      "原型:评审这一步停在第 3.5 秒(补拍还在跑),录制版退回全部 190 积分;补拍切到 0 时停在演示一半处,退回 40。",
    ],
    edges: [
      "已生成完的补拍镜头不退款(真实产品已产生费用),但停止后也不会保留给下一轮复用。",
      "Stop 只能点一次,停止后按钮消失;生成已结束时 Stop 不出现。",
      "停止时有排队的话 → 立刻合并成一次改稿重排,见第 10 步。",
    ],
    errors: [],
    copy: ["Stop", "Stopped", "Stopped at step {i} of {n}", "Stopped. {n} credits refunded.", "已停止。退回 {n} 积分。(中文回复)"],
  },

  /* ───────── 12 成片 ───────── */
  reel: {
    what: [
      "成片卡按参考图:右上收藏 / 下载 / 重新生成 / 剪辑 / 更多,中间播放键,底部控制条(§2.6)。",
      "卡下依次:交付说明 → 最终分镜(Storyboard)→ Models, voice & credits(合计 = 分镜表预估)→ Needs your check。",
      "原型:成片视频固定为 RELLET 演示片,交付说明里的分辨率、帧率、时长、响度是写死的,与用户素材和分镜无关(§2.6 已知限制)。",
    ],
    rules: [
      "收藏切换实心红心,只在当前页面有效,刷新或重新进入即丢失。",
      "下载:下载本次成片,文件名 {brand}-{platform}-{duration}s.mp4(小写、空格变连字符),时长按分镜实际在屏时长取整;没识别出品牌用 hybrid-reel。",
      "品牌名取素材里「品牌素材」描述中第一个 ≥ 3 位的全大写拉丁词(录制为 RELLET),所以录制版下载名是 rellet-tiktok-30s.mp4(英文版 29s)。",
      "重新生成:先弹确认「Regenerate this reel? It uses {n} credits.」;点 Regenerate 再查余额,够就扣全额、跑一遍第 9 步并在下方追加一张新成片卡,旧卡保留;不够弹「Not enough credits」。",
      "剪辑图标与 Edit in canvas 一样带着这版分镜和当前余额进画布(第 22 步);Regenerate 或 Retry shot 在跑时剪辑图标置灰,点了也不进画布,避免丢下一轮已扣费的生成。",
      "更多 → Copy link:把成片地址(绝对地址)复制到剪贴板,toast「Link copied」。",
      "更多 → Delete:先确认「Delete this reel?」,确认后卡片移除,底部 toast「Reel deleted」+ Undo,5 秒内点 Undo 卡片回到原位置;重新生成或 Retry shot 进行中 Delete 置灰,不能删正在更新的成片。",
      "Models, voice & credits:每个 AI 镜头一行(Seedance 2.5 + 时长 + 50 credits),有旁白时一行配音音色(显示音色名,如 cn-f → Xiaoyu、warm-f → Aria),一行最终合成 40 credits,最后合计。",
      "Needs your check:卖点在素材描述里重合不到一半时提示核实宣称;有 AI 镜头时提示核对包装小字 / logo;背景音乐不是用户上传的就提示换授权曲目。",
      "顶栏余额已扣成 35,600 − 190 = 35,410(录制版)。",
    ],
    edges: [
      "成片出来后在输入框发话仍按改稿处理,基于成片这一版重排(同第 7 步)。",
      "成片卡出现时页面滚到卡片顶部而不是最底部。",
      "请求中或生成中「重新生成」和「剪辑」置灰;收藏、下载、更多不受影响。",
      "音色 id 在音色表里找不到时直接显示 id;没有指定音色显示 Default voice。",
      "普通 toast 2.2 秒消失,带 Undo 的删除 toast 5 秒消失,消失后不能再撤销;删除确认弹窗和重新生成确认弹窗都可按 Esc 或点遮罩关闭。",
      "原型:交付说明里文件名会随品牌 / 平台 / 时长变化,但后面的 1080×1920 · 30 fps · 15.6s · -14 LUFS 是演示片的固定参数,和文件名里的时长对不上。",
      "原型:交付说明和成片下方的小节标题(Storyboard 等)中文回复时仍是英文,只有正文随语言变化。",
    ],
    errors: [
      "视频加载失败 → 卡片换成 Couldn't load the video + Retry,见第 19 步;打开「视频加载失败」开关在本步也能看到。",
      "剪贴板写入失败(浏览器拒绝权限)→ toast「Couldn't copy the link」,用户可重试。",
      "重新生成时余额不足 → 「Not enough credits」,不扣费,见第 17 步。",
    ],
    copy: [
      "The reel is ready: {file} · 1080×1920 · 30 fps · 15.6s · about -14 LUFS.",
      "成片做好了:… · 响度约 -14 LUFS。(中文回复)",
      "Storyboard",
      "Models, voice & credits",
      "Shot {n} · Seedance 2.5 · {d}s · {per} credits",
      "Voiceover · {voice name}",
      "Default voice",
      "Final render · {base} credits",
      "Total · {total} credits",
      "Needs your check",
      "“{selling point}” isn't clearly shown in your footage — confirm the claim before the ad runs.",
      "AI can blur small packaging text or the logo — compare shot {n} with the real product.",
      "The background music is a placeholder — swap in a licensed track before you publish.",
      "Regenerate this reel? / It uses {n} credits. / Cancel / Regenerate",
      "Copy link / Link copied / Couldn't copy the link",
      "Delete / Delete this reel? / You can undo this for a few seconds. / Reel deleted / Undo",
      "Favorite / Unfavorite / Download / Regenerate / Edit in canvas / More(图标按钮的无障碍名)",
    ],
    open: [
      "待定:真实成片的导出 / 渲染(分辨率、码率、失败重试)与下载用的签名链接及有效期;现在下载和 Copy link 拿的都是演示片的公开地址。",
      "待定:下载文件名的品牌只靠「品牌素材描述里的全大写拉丁词」猜,brief 里没有品牌字段,纯中文品牌或没传 logo 时都会退回 hybrid-reel。",
    ],
  },

  /* ───────── 13 上传超限 ───────── */
  uploadLimit: {
    what: ["选文件时就按上限校验:超限或类型不对的文件不加入,输入框上方出一条可关闭的提示,写明每个文件为什么没加进来(待定落地 §2)。"],
    rules: [
      "每个被拒的文件一行原因;合规的文件照常加入缩略图行。",
      "已选 + 本次合规文件超过 10 个时,超出的按选择顺序丢掉,提示末尾加一行「You can add up to 10 files」。",
      "每次重新选文件,提示整条替换成这一次的结果(这次全部合规则提示消失);点 × 立即关闭。",
      "原型:评审这一步是在已选 4 个素材之后又选了 4 个不合规文件:1.2 GB 的 .mov、14 分钟的 .mp4、36 MB 的 .png、一个 PDF,四个都被拒。",
    ],
    edges: [
      "上限:最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB;只收视频 / 图片 / 音频。",
      "视频超 500 MB 时只报大小,不再报时长;读不到时长的视频不按时长拦。",
      "系统文件选择器切到「所有文件」时仍可能选到其他类型,这些在这里被拒。",
      "上传接口(Blob)单条上限同为 500 MB,前端放行的文件不会再被它按大小拒收。",
    ],
    errors: ["被拒文件不进入后续流程,用户换文件重选即可;不需要刷新或回退。"],
    copy: [
      "{file} is over 500 MB",
      "{file} is longer than 10 minutes",
      "{file} is over 20 MB",
      "{file} is over 50 MB",
      "{file} isn't a video, image or audio file",
      "You can add up to 10 files",
      "Dismiss(× 的无障碍名)",
    ],
  },

  /* ───────── 14 分析失败 ───────── */
  failAnalyze: {
    what: [
      "全部素材读不出来或 brief 失败:思考行换成一句看得懂的错误 + Retry,原始报错收在 Details 里,素材不用重新选(§4、待定落地 §2)。",
      "点 Retry 会重新分析;想看重试仍失败,打开侧栏的「分析失败」开关。",
    ],
    rules: [
      "错误句 = 「Couldn't read your footage: 」+ 统一报错句(中文回复为「素材分析失败:」+ 中文统一报错句);统一报错按原始报错分四类:超时、文件太大(413 等)、网络不通、其他。",
      "Details 默认收起,点开显示原始报错(等宽字体,最高 160px 可滚动)。",
      "Retry 用内存里的原文件重新跑整次分析(会重新上传到服务器),防连点,请求中再点无效。",
      "Retry 只在错误句之后只有用户气泡或普通 Agent 回复时显示;后面已有新请求就不再显示。",
      "失败后输入框可用;此时发消息不会触发分析,Agent 回「I haven't finished reading your footage — hit Retry above.」。",
      "同一步连续失败到第 3 次,错误行多一个 Start over,见第 15 步。",
      "原型:评审这里的报错是模拟的超时:界面显示「The model took too long to respond.」(中文回复为「模型响应超时。」),Details 是「The model service timed out (simulated)」。",
    ],
    edges: [
      "只有部分文件失败时不会到这一步,而是跳过失败的文件继续(见第 4 步);全部文件都失败且属于「文件太大」类时,错误句里的文件名取第一个失败的文件。",
      "brief 接口返回里没有 brief 时原始报错为 No brief returned,归入「其他」类。",
      "中文回复时整句都是中文:前缀与报错句之间用「:」、不留空格,如「素材分析失败:模型响应超时。」;Details 里的原始报错不翻译,Retry / Details / Start over 按钮仍是英文。",
      "刷新页面后原文件已不在内存,只能回落地页重新上传(第 21 步)。",
    ],
    errors: ["分析失败 → 错误句 + Retry + Details → 点 Retry 后旧错误句移除、重新出现思考行;仍失败则换成新的错误句,第 3 次起多一个 Start over。"],
    copy: [
      "Couldn't read your footage: {reason}",
      "素材分析失败:{reason}(中文回复)",
      "The model took too long to respond.",
      "{file} is too large to upload.",
      "Couldn't reach the server — check your connection.",
      "Something went wrong on our side.",
      "模型响应超时。/ {file} 太大,无法上传。/ 连不上服务器,请检查网络。/ 我们这边出了点问题。(中文回复的四类报错句)",
      "Details",
      "Retry",
      "I haven't finished reading your footage — hit Retry above.",
      "素材还没读完,点上面的 Retry 再试一次。(中文回复)",
    ],
  },

  /* ───────── 15 连续失败 · Start over ───────── */
  startOver: {
    what: ["同一步(分析或排分镜)连续失败 3 次,错误行在 Retry 旁多一个 Start over,让用户可以换素材从头来(待定落地 §2)。"],
    rules: [
      "失败次数按步骤分开算:分析和排分镜各自计数,换了步骤从 1 重新数;该步成功一次就清零。",
      "点 Cancel 取消分析不算一次失败,也不清零。",
      "第 3 次及之后每次失败的错误行都带 Start over,Retry 仍然可点、次数不限。",
      "点 Start over 回到落地页重新选素材,本次对话丢弃。",
      "原型:评审这一步预置为分析连续失败 3 次;Start over 跳回第 1 步落地页。",
    ],
    edges: [
      "Start over 与 Retry 同样只在错误行之后没有新请求时显示。",
      "回落地页不会带回之前选的素材和 prompt,需要重新添加。",
    ],
    errors: ["连续失败 → Retry(再试)或 Start over(回落地页重来)。"],
    copy: ["Couldn't read your footage: {reason}", "素材分析失败:{reason}(中文回复)", "Retry", "Start over", "Details"],
  },

  /* ───────── 16 分镜失败 ───────── */
  failOutline: {
    what: ["排分镜(首版或改稿)失败:思考行换成错误句 + Retry + Details;重试会重发同一份请求(含改稿内容)(§4)。"],
    rules: [
      "错误句 = 「Couldn't lay out the storyboard: 」+ 统一报错句(四类同第 14 步;中文回复为「分镜没排出来:」+ 中文报错句,冒号后不留空格),原始报错在 Details 里。",
      "Retry 重发上一次的分镜请求(brief + 素材分析 + 改稿原话),不重新分析素材。",
      "Retry 显示规则与第 14 步相同;请求中再点无效;连续失败第 3 次起多一个 Start over(见第 15 步)。",
      "首版失败时还没有分镜,此时发消息只会得到提示「The storyboard isn't ready yet — hit Retry above to try again.」,不会重排。",
      "改稿失败时上一版分镜保持可用,用户也可以直接再发一句新的改稿要求(此后 Retry 隐藏)。",
      "原型:打开「分镜失败」开关后,评审里所有排分镜请求(包括 Retry)都会失败。",
    ],
    edges: [
      "分镜接口最长 300 秒,超时由网关返回非 JSON(HTTP 504),归入超时类。",
      "接口返回没有镜头时原始报错为 No storyboard returned,归入「其他」类。",
      "排分镜失败不扣积分(积分只在 Generate 时扣)。",
    ],
    errors: ["分镜失败 → 错误句 + Retry → 点 Retry 后旧错误句移除、重发同一请求;仍失败则换成新的错误句,第 3 次起带 Start over。"],
    copy: [
      "Couldn't lay out the storyboard: {reason}",
      "分镜没排出来:{reason}(中文回复)",
      "Retry",
      "Details",
      "The storyboard isn't ready yet — hit Retry above to try again.",
      "分镜还没排出来,点上面的 Retry 再试一次。(中文回复)",
    ],
  },

  /* ───────── 17 积分不足 ───────── */
  noCredits: {
    what: ["余额不够时点 Generate(或 Regenerate、Retry shot):弹「Not enough credits」,写明需要多少、余额多少,不扣费、不开跑(待定落地 §1)。"],
    rules: [
      "扣费前检查:费用 ≤ 余额才放行;Generate / Regenerate 的费用 = 分镜预估,Retry shot 的费用 = 一个补拍镜头 50。",
      "弹窗正文「This needs {needed} credits and you have {balance}.」,下面两行 Needed / Your balance,数字带千分位。",
      "Top up:关闭弹窗;原型不做充值,只出 toast「Top up isn't part of this prototype」。",
      "Cancel、按 Esc 或点遮罩:关闭弹窗,分镜卡保持可用。",
      "原型:评审这一步余额预置为 2,录制版需要 190;侧栏「积分不足」开关会把 Agent 和剪辑器的起始余额都设为 2,任何扣费都会被拦(最便宜的成片也要 40,单镜重试 50)。",
    ],
    edges: [
      "余额正好等于费用时放行,扣完余额为 0。",
      "Regenerate 先弹确认、确认后才查余额,不够时确认弹窗换成积分不足弹窗。",
      "顶栏余额就是检查用的余额;评审里落地页顶栏显示同一个余额,开发版落地页顶栏固定 35,600(见第 1 步)。",
    ],
    errors: ["余额不足 → 弹窗 → Top up(原型只出提示)或 Cancel → 不扣费,对话状态不变。"],
    copy: [
      "Not enough credits",
      "This needs {needed} credits and you have {balance}.",
      "Needed",
      "Your balance",
      "Top up",
      "Cancel",
      "Top up isn't part of this prototype",
    ],
  },

  /* ───────── 18 生成失败(单镜) ───────── */
  genFailed: {
    what: ["某个 AI 补拍镜头生成失败:工具行红叉 + 原因,退回这一镜的积分,其余照常出片,成片里这一镜用占位,Agent 回复带 Retry shot(待定落地 §2)。"],
    rules: [
      "失败镜头那一行到它的结束时间变红框 + 红叉,标签下方红字写原因;不影响其他行继续跑。",
      "失败的同时退回这一镜 50 积分(顶栏余额立即加回),Agent 回一句「Shot {n} failed — {reason}. {cost} credits refunded.」+ Retry shot {n}。",
      "跑完照常出成片卡,卡下多一行「Shot {n} didn't generate — the reel uses a placeholder there for now.」。",
      "点 Retry shot {n}:查余额后扣 50,只重跑这一镜(Generate video 4s → 拼接 2s → Check output 1s,约 7 秒),完成后 Agent 回「Shot {n} is back in the reel.」,原成片卡的占位提示消失,不新增卡片。",
      "Retry shot 只在没有生成在跑、且成片卡仍是占位时显示;补好后按钮消失。",
      "原型:评审这一步让第 2 个 AI 补拍(录制为第 3 镜)失败,原因固定为「The video model is busy right now」;余额 35,600 − 190 + 50 = 35,460。",
      "原型:「生成失败(Agent)」开关在其他 Agent 步骤里同样让这一镜第一次生成失败,重试一定成功;补拍切到 0 时没有可失败的镜头,本步显示正常成片。",
    ],
    edges: [
      "同一镜只退一次款,不会因为停止或重复回调重复退。",
      "失败后点 Stop,该镜已退的不会再算一遍。",
      "多个镜头失败时每镜各一行回复、各一个 Retry shot,成片卡提示里列出全部占位镜头号。",
    ],
    errors: [
      "单镜失败 → 红叉 + 原因 + 退 50 积分 → Retry shot 重试(余额不足见第 17 步)。",
      "重试中也可以点 Stop,按第 11 步规则退款。",
    ],
    copy: [
      "Shot {n} failed — {reason}. {cost} credits refunded.",
      "第 {n} 镜生成失败:{reason}。已退回 {cost} 积分。(中文回复)",
      "The video model is busy right now",
      "Retry shot {n}",
      "重试第 {n} 镜(中文回复)",
      "Retrying shot {n}.",
      "Shot {n} is back in the reel.",
      "Shot {n} didn't generate — the reel uses a placeholder there for now.",
      "Failed(红叉的无障碍名)",
    ],
    open: ["待定:各视频模型是否不同价(目前所有补拍统一每镜 50 积分,退款也按 50)。"],
  },

  /* ───────── 19 视频加载失败 ───────── */
  failVideo: {
    what: ["成片视频加载失败:卡片换成灰底「Couldn't load the video」+ Retry(§4)。"],
    rules: [
      "视频元素报错即进入失败态,整张卡(含右上按钮和控制条)被替换。",
      "点 Retry 恢复成视频卡并重新加载同一个地址。",
      "卡片下方的交付说明、分镜、积分、需确认事项照常显示。",
      "原型:评审这一步故意传了一个不存在的视频地址;「视频加载失败」开关在第 12 步也能触发。",
    ],
    edges: [
      "失败态下没有下载、重新生成、剪辑入口;要重新生成可在输入框改稿或回到分镜卡。",
      "加载失败不退积分,成片在服务端已经生成。",
    ],
    errors: ["加载失败 → Couldn't load the video + Retry → Retry 重载同一地址;地址本身坏了会立刻再次失败。"],
    copy: ["Couldn't load the video", "Retry"],
  },

  /* ───────── 20 未答题先发消息 ───────── */
  answerFirst: {
    what: ["提问卡还没提交就在输入框发消息:不排分镜,Agent 回一句提示让用户先在卡片里选(§2.3)。"],
    rules: [
      "用户这句照常显示为气泡,但内容被丢弃,不会写进 brief 或 notes,也不会被当成答题。",
      "提问卡保留在原位,仍可正常作答并点 Continue。",
      "原型:评审里用户这句是「先帮我排分镜吧」/「Just lay out the storyboard」,提示文案与产品代码逐字一致。",
    ],
    edges: [
      "可以反复发,每次都追加一条用户气泡 + 同一句提示。",
      "没有提问卡(分析完直接排分镜)时这条提示不会出现。",
    ],
    errors: [],
    copy: [
      "Pick your answers in the card above and I'll lay out the storyboard.",
      "先在上面的卡片里选一下,我再排分镜。(中文回复)",
    ],
  },

  /* ───────── 21 空态 ───────── */
  empty: {
    what: ["直接打开对话页(没带素材):提示回落地页重来(§4)。"],
    rules: [
      "整屏只有一句提示和 Go to home 链接,不显示侧栏、顶栏和输入框。",
      "点 Go to home 回到落地页 /prototypes/hybrid-reel-agent。",
    ],
    edges: [
      "素材只在内存里交接、取一次即清空,所以刷新对话页、浏览器后退再前进、复制链接在新标签打开都会落到空态。",
      "会话持久化本期不做(§3、§6):分析或生成中途刷新会丢掉整段对话。",
    ],
    errors: [],
    copy: ["Start from the home page to add your footage.", "Go to home"],
  },
  ...EDITOR_NOTES,
};
