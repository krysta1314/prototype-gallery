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

  /* ───────── 2 已选素材 ───────── */
  picked: {
    what: [
      "用户在这里一次交齐素材和需求,Create 后进入对话页,由 Agent 接手分析(§2)。",
      "主区沿用 Marketing Agent 首页的主视觉:品牌渐变 + 点阵背景(鼠标附近点阵亮起)、大标题、922px 输入框;大标题跟着创作类型换,四句都落在广告产出上:Hybrid Reel(默认)「Your footage + AI shots, auto-edited into one finished ad」(讲清核心:真实素材和 AI 补拍自动剪成一条成片)、Marketing Agent「Your ideas, campaign-ready in seconds」(沿用首页线上原文案)、Image Gen「Ad-ready product shots, no photoshoot needed」、Video Gen「Ad-ready video clips, with sound, from one prompt」;其余三句不写「in seconds」这类做不到的速度承诺。;输入框提示语一句话教用法:先用「+」加素材,再说要什么广告,并给一个例子(平台 + 时长 + 产品)",
      "创作类型按钮(默认 Hybrid Reel)点开是 Creation type 弹层:左栏 Marketing Agent / Image Gen / Video Gen / Hybrid Reel(Enterprise 标),右栏讲鼠标所在那一条的说明、Key features、How to use;点外面或 Esc 关闭。",
      "原型:只有 Hybrid Reel 往下走;切到其他类型时提示语换成 Marketing Agent 的那句,Create 置灰。",
      "左侧图标栏、历史栏和顶栏沿用 v1.13 外壳,不属于本需求。",
      "原型:评审里落地页顶栏显示 Agent 当前余额(和对话页同一个数,开「积分不足」为 2);开发版落地页顶栏不读余额,固定 35,600。",
      "加了素材后,缩略图排成一行出现在输入框上方,作为提交前的确认区(§2.1)。",
      "点 Create:素材 + prompt 一起带进对话页并立即开始分析(§2.2)。",
    ],
    rules: [
      "「+」打开系统文件选择,可多选,接受 video/*、image/*、audio/*。",
      "也可以把文件直接拖进输入框:拖到框上时输入框描橙边并盖一层「Drop footage, images or music to add」,松手即加入;和「+」走同一套校验(判重、上限、类型)。",
      "选文件当下就校验(上限见待定),不合规的文件不加入,产品区顶部居中出一条红色提示 toast(6 秒后自动消失,可点 × 关闭),见第 12 步。",
      "文件类型先看 MIME(image/ video/ audio/),MIME 为空时按扩展名兜底:jpg/jpeg/png/webp/heic/heif/gif 算图片,mp4/mov/m4v/webm/avi/mkv 算视频,mp3/m4a/wav/aac/ogg/flac 算音频,都不是就拒收。",
      "没有素材时 Create 置灰(40% 透明),悬停提示 Add footage first,回车也不触发;已加的素材在输入框里排成缩略图,鼠标移到缩略图上才出现右上角 ×,点 × 删除。",
      "有素材时点 Create 或在输入框按 Enter 提交;Shift+Enter 换行,输入法组字中的 Enter 不提交。",
      "Prompt 可不填;回复语言按 prompt 判断:含中文→中文,写了英文→英文,没写→按浏览器语言(zh 开头为中文,否则英文)。",
      "图片显示原图缩略,视频显示第 0.5 秒画面,音频显示音符图标。",
      "悬停缩略图右上角出现 ×(键盘聚焦也会出现),点了从列表移除该素材,腾出的名额可以再加。",
      "再点「+」追加的文件同样过上限校验,已选数量计入 10 个上限。",
      "Create 后素材以内存方式交给对话页(不经服务器),同时把原文件存进浏览器 IndexedDB,供之后进画布使用。",
      "原型:评审这一步预置了 RELLET 的 4 个素材(2 段视频 + 2 张图)和录制时的 prompt(「制作一条广告」/「Make an ad」),Create 后走录好的数据。",
    ],
    edges: [
      "同一个文件不能重复添加:名字、大小、修改时间都相同算同一个文件,已加过的或同一次选了两份的只留第一份,提示「{file} is already added」;同名但内容不同的文件可以加。",
      "Prompt 最多 20,000 字,到上限后不能再输入(粘贴超出的部分被截掉);到 18,000 字起在 Create 左边显示计数「{n} / 20,000」,到顶变红;首尾空白会被去掉再提交。",
      "选中时先在浏览器里探测每个文件:视频挂到播放器读元数据(顺便读时长),图片试着解码,最多等 5 秒;5 秒没结果只当「读不到时长」,照收、不按时长拦。",
      "HEVC 编码的 .MOV、HEIC 图片这类浏览器预览不了但文件本身是好的(浏览器报错,但文件头是认得的视频 / 图片格式):照收,缩略图垫一个胶片图标(不会是一块白),不出任何提示,上传后照常分析(异常处理 spec 第 13 条)。",
      "缩略图一行放不下时横向滚动,不换行。",
      "删光所有素材后 Create 立刻回到置灰状态。",
      "HEIC 图片在多数浏览器里无法预览,缩略图会是空白,但仍按图片提交。",
      "删除按钮只在悬停或键盘聚焦时出现,触屏设备上看不到。",
    ],
    errors: [
      "选到超限 / 类型不对的文件 → 这些文件不加入,提示里每个文件一行原因 → 用户换文件重选或点 × 关掉提示,见第 12 步。",
      "文件损坏(0 字节,或浏览器打不开且文件头也不是认得的视频 / 图片格式)→ 选中时就拦,不加入,顶部提示里一行「{file} can't be read — try exporting it again」→ 用户重新导出后再选,见第 12 步。",
    ],
    copy: [
      "Marketing Agent: Your ideas, campaign-ready in seconds",
      'Add footage with +, then describe the ad. e.g. "15s TikTok ad for our face mist"',
      "Hybrid Reel",
      "Add footage first",
      "Create",
      "Add footage(「+」的无障碍名)",
      "{file} can't be read — try exporting it again",
      "Remove {file name}", "Create",
    ],
    open: ["待定:上传上限。原型暂按最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB。"],
  },

  /* ───────── 1 切换创作类型 ───────── */
  creationType: {
    what: [
      "落地页的创作类型按钮(默认 Hybrid Reel)点开就是这个 Creation type 弹层,和 Marketing Agent 首页同一个控件。",
      "选哪个类型,顶部大标题、输入框提示语就换成哪个;四句标题都落在广告产出上。",
      "评审:下方「状态 → 创作类型」可直接切 Hybrid / Agent / 图片 / 视频,第 1、2、12 步(落地页)生效。",
    ],
    rules: [
      "左栏列 Marketing Agent / Image Gen / Video Gen(会员标)/ Hybrid Reel(Enterprise 标),当前选中的打勾;右栏讲鼠标所在那一条的说明、Key features、How to use,鼠标移出后回到讲当前选中的那一条。",
      "点一个类型:弹层关闭,按钮图标和名字换成它,大标题和提示语同时换。",
      "大标题:Hybrid Reel「Your footage + AI shots, auto-edited into one finished ad」;Marketing Agent「Your ideas, campaign-ready in seconds」(首页线上原文案);Image Gen「Ad-ready product shots, no photoshoot needed」;Video Gen「Ad-ready video clips, with sound, from one prompt」。",
      "提示语:Hybrid Reel 是一句用法加例子;其他三种用 Marketing Agent 原来那句。",
      "点弹层外面或按 Esc 关闭,不改选中项。",
    ],
    edges: [],
    errors: [],
    copy: [
      "Creation type",
      "Marketing Agent / Image Gen / Video Gen / Hybrid Reel / Enterprise",
      "Key features / How to use",
    ],
  },
  /* ───────── 3 分析中 ───────── */
  analyzing: {
    what: [
      "进对话页立刻逐个分析素材,再根据分析结果和 prompt 抽取 brief(§2.2)。",
      "思考行显示读到第几个文件,不提供取消按钮;离开页面时进行中的分析自动中止。",
      "原型:开发版真调 seed-2-0-lite;评审这里用录好的结果,但节奏放慢到看得清:每个文件约 1.5 秒(4 个文件约 6 秒),读完再约 1.5 秒出提问卡;排分镜约 3 秒。",
    ],
    rules: [
      "对话顶部先显示用户的素材缩略图行(88px 方块,音频显示文件名)和 prompt 气泡(没填 prompt 则不显示气泡)。",
      "思考行文案 Reading {done}/{n} files…,从 0/{n} 开始,每有一个文件结束(成功或失败)就 +1,呼吸闪烁直到 brief 回来。",
      "每个文件单独发一个分析请求、并行跑;全部结束后再调 brief 接口(两步是先后关系,不是并行)。",
      "分析期间输入框和发送按钮置灰,不能发消息。",
      "视频文件额外在浏览器里读时长,5 秒内读不到就不带时长,分镜按描述估算。",
    ],
    edges: [
      "上线环境有 Blob 时,文件先直传 Blob(放行 video/*、image/*、audio/*,单条最大 500 MB,超过 20 MB 走分片),再把链接交给分析接口;分析完无论成败都删除 Blob 上的文件。",
      "本地没开 Blob 时整份文件直接 POST 给分析接口;部署环境不走 Blob 时受 Vercel 4.5 MB 请求体上限限制,超了按「文件太大」报错。",
      "分析接口最长 300 秒,视频按 2 fps 抽帧,图片 / 音频输出上限 900 tokens,视频 2400 tokens;brief 接口最长 60 秒。",
      "服务端调模型遇到网络中断或 429/5xx 会自动重试 2 次(间隔 0.9 秒、1.8 秒),用户无感。",
      "浏览器上传 / 分析请求中途断网(fetch 抛网络错误):这个文件自动再传一次(只重传断掉的那几个,进度不再重报),用户无感;还是失败就跳过它,回复里那一行原因是「Upload interrupted — check your connection」,见第 14 步(异常处理 spec 第 13 条)。",
      "只有「读到第几个文件」的进度,没有字节级上传进度,前端也没有自己的超时。",
      "单个文件失败不影响其余文件:跳过它继续,回复里列出被跳过的文件,见第 4 步;全部文件都失败才整体报错。",
      "对话状态只在内存里:这时刷新页面会落到空态(见第 25 步)。",
    ],
    errors: [
      "全部文件分析失败或 brief 失败 → 思考行换成错误句 + Retry + Details,见第 13 步。",
      "读完发现素材都不能用(没有产品图,且能剪进片子的不到 3 秒)→ 不出常规提问卡,Agent 说清哪些不能用、为什么,问怎么继续,见第 15 步。",
    ],
    copy: ["Reading {done}/{n} files…", "正在看素材 {done}/{n}…(中文回复)", "Retry"],
  },

  /* ───────── 4 提问卡 ───────── */
  questions: {
    what: [
      "像 Claude 一样:素材读完折叠成一行「Read N files」,点开只列出读了哪些文件(不展开逐段场记);下面 Agent 用一两句话讲清对素材的理解,然后直接出提问卡(§2.2)。",
      "这句话由分析结果拼出:有什么素材(实拍几段共几秒、产品图、品牌 logo、参考、音频)→ 能撑起哪些广告段落 → 缺哪些段落要 AI 补拍 → 下一步(有提问卡说「确认几个参数后就开始排分镜」,没有就「我直接排分镜」);不再长篇复述 brief。",
      "提问卡只问 brief 里 AI 替用户定的项和素材缺口,最多 4 题;一题都不用问时跳过提问卡直接排分镜(§2.3)。",
      "提问卡照 Claude 的提问做:一次一题,右上角「‹ 1 of 4 ›」,左右箭头可来回切题、已选答案保留(第一题左箭头、最后一题右箭头置灰;最后一题 Submit 时若前面有单选题没答,先跳回那一题);选项是圆点(多选题为方框)+ 名字 + 一行灰字说明,推荐项排第一并标 (Recommended),最后一行 Other 可自己写;底部 Skip 和 Submit(⌘↵)。",
      "全部答完后卡片收起成一张「题目 / 答案」小卡(每题一行,答案是推荐项时带 (Recommended),跳过且没有推荐项的写 Skipped),随后开始排分镜。",
    ],
    rules: [
      "「Which platform will this ad run on?」单选 TikTok / IG Reels / FB Reels,默认选中 brief 里的平台;只在 prompt 里没抓到平台关键词时出现。",
      "「What language should the subtitles be in?」单选 English / 简体中文 / 繁體中文,默认按 brief 的字幕语言对到选项(对不上就按回复语言);规则没从 prompt 抓到语言、且 prompt 是空话或模型说是它代定时出现。",
      "「How long should the ad be?」单选 15s / 20s / 30s,默认选中 brief 里的时长;只在 prompt 里没抓到时长时出现。",
      "「Your footage is missing these shots. Which should AI create?」多选(标 Pick any),选项是素材没覆盖的叙事角色(Hook / Pain point / Proof / Usage / End card,各带一句说明),默认全选;素材有缺口才出现。",
      "时长与素材(异常处理 spec 第 6 条):能剪进片子的素材秒数 = 可剪素材里可用片段加起来(没有场记的视频按整条时长)。时长题出现、且这个秒数不够默认时长时,时长题标题下多一行小灰字「Your footage covers about {s}s — AI will fill the rest.」(一秒都没有时为「Your footage doesn't cover any of it — AI will fill the rest.」),补拍题标题末尾加上积分「· {n × 50} credits」(n = 默认勾选的段数,每个 AI 补拍 50 积分)。",
      "素材比所需时长多很多时不单独问:分镜接口按时长挑最好的片段。",
      "每题最后一行是 Other:点了出现输入框(Enter 也能提交);单选题选 Other 会取消已选项,点回选项又取消 Other,两者只留一个;多选题 Other 与勾选并存。",
      "单选题有答案(选项,或选了 Other 并写了字)Submit 才可点,否则置灰;补拍题可以一个都不选。Skip:这题按推荐项算(没有推荐项就留给 AI 定),直接进下一题。",
      "点 Continue:平台、时长、字幕语言写回 brief,补拍选择和各题 Other 写进 notes 交给分镜接口;卡片换成「题目 / 答案」小卡,出现「Laying out the storyboard…」。",
      "原型:录制 prompt「制作一条广告」/「Make an ad」是空话,四题都出;补拍题选项为 Pain point、End card;切「回复语言」看中英文版。",
    ],
    edges: [
      "「空话」= 去掉填充词后不足 6 个字符;中文填充词(帮我 / 请 / 生成 / 制作 / 做 / 一条 / 一个 / 广告 / 广告片 / 视频 / 短片)按子串去,英文(ad / ads / video / make / create / a / an / the / for me / please)按整词去。",
      "补拍题全部取消勾选也能提交,notes 写入「Do not AI-shoot any shots; cut the ad only from the footage.」,小卡里答案显示 None。",
      "平台 / 时长题的 Other 只写进 notes,不改 brief 的平台 / 时长字段;字幕语言题的 Other(如 Japanese)直接作为字幕语言。",
      "brief 平台不在三个选项里时平台题没有推荐项,要手动选才能 Submit;点 Skip 则平台交给 AI 按 brief 定,小卡显示 Skipped。",
      "判断素材缺口时只看可剪素材(footage / showcase / evidence),参考片、品牌图、音频不算覆盖;视频有场记但一段都不能用(太糊 / 看不到产品)也不算覆盖。",
      "「能撑多少秒」只和推荐的默认时长比;用户改选更长的时长后提示不跟着变,分镜接口照常让 AI 补齐。原型:录制素材可用约 18 秒、默认 15 秒,这一步不出这行;在第 15 步选「Let AI create the missing shots / Use what I have」后接着出的提问卡能看到。",
      "提问卡、题目、「Read N files」始终是英文(产品界面),只有 Agent 那段话随回复语言变化。",
      "「Read N files」的 N 只数分析成功的文件,被跳过的不算(如上传 4 个跳过 1 个显示 Read 3 files);只有 1 个时为 Read 1 file。",
      "答完提问卡想改答案(异常处理 spec 第 11 条):不加「修改答案」入口,卡片收成小卡后不能再点;等方案出来后在对话里直接说(如「改成 30 秒」),按改稿处理,出新一版方案(第 7 步)。",
    ],
    errors: [
      "部分文件分析失败 → 回复下方每个文件一行「Skipped {file}: {reason}」(中文回复为「跳过了 {file}:{reason}」),reason 是统一报错句(四类见第 13 步,随回复语言变化,文件名处写 The file / 该文件),其余素材照常出题和排分镜。",
      "卡片未提交就在输入框发消息 → 不排分镜,Agent 提示先选,见第 23 步。",
    ],
    copy: [
      "Read {n} files / Read 1 file",
      "Skipped {file}: {reason}",
      "跳过了 {file}:{reason}(中文回复)",
      "Which platform will this ad run on?",
      "TikTok / IG Reels / FB Reels",
      "What language should the subtitles be in?",
      "English / 简体中文 / 繁體中文",
      "How long should the ad be?",
      "15s / 20s / 30s",
      "Your footage is missing these shots. Which should AI create?",
      "Your footage is missing these shots. Which should AI create? · {n} credits(素材不够时)",
      "Your footage covers about {s}s — AI will fill the rest.",
      "Your footage doesn't cover any of it — AI will fill the rest.",
      "Pick any",
      "Hook · a scroll-stopping opening",
      "Pain point · the problem before the product",
      "Proof · a close-up that backs the claim",
      "Usage · someone using the product",
      "End card · product, logo and call to action",
      "Other / Type your answer",
      "(Recommended)",
      "{i} of {n}",
      "Skip / Submit ⌘↵",
      "Skipped / None",
    ],
  },

  /* ───────── 5 提问卡只问缺项 ───────── */
  partial: {
    what: [
      "prompt 里写明了平台和时长 → 提问卡只问 brief 里仍由 AI 替用户定的项(§2.3)。",
      "本次录制:中文「帮我做一条 30 秒的 TikTok 广告」字幕语言是模型代定的,问「What language should the subtitles be in?」+ 补拍题;英文「Make a 30-second TikTok ad」只问补拍题。",
    ],
    rules: [
      "平台、时长、字幕语言是否算用户说过,由规则从 prompt 里抓关键词决定,规则抓到就不问,不看模型。",
      "平台:ig / instagram / insta / ins → IG Reels,fb / facebook → FB Reels,tiktok / tik tok / 抖音 → TikTok,只写 reel(s) → IG Reels。",
      "时长认 30s / 30 s / 30-second / 30 sec / 30秒 / 二十五秒 / 半分钟 / half a minute / 1 分钟 / 一分钟 / 两分钟 / 1 minute 等写法,再吸附到 15 / 20 / 30 里最近的值(如 60 秒 → 30s,10 秒 → 15s,两分钟 → 30s)。",
      "字幕语言:写了简体 / 繁體 / 中文 / 粤语 / English / 英文等且只提到一种时算用户说过;提到两种算拿不准,交给模型。",
      "受众、卖点、CTA 是否代定看模型返回的 assumed,但它们不出题,只影响 Agent 那段话里的「我先按…来定」。",
      "交互与第 4 步提问卡完全相同,题目更少。",
      "时长写明了(不问时长题)但能剪进片子的素材不够这个时长:提问卡里不出那行灰字,改在 Agent 那段话里、「下一步」之前加一句「Your footage covers about {s}s — AI will fill the rest.」(中文回复为「素材大约能撑 {s} 秒,其余由 AI 补。」);补拍题标题不带积分。",
    ],
    edges: [
      "同时出现 IG 和 FB 关键词时按 FB Reels;同时出现 IG 和 TikTok 时按 IG Reels。",
      "中文数字认 零 到 九百九十九(含 两 / 兩、百,如 十五、二十五、一百二十、一百零五),整段一起读;「二十五秒」= 25 秒,与 20、30 等距时吸附到较短的 20s;超过 30 秒的一律吸附到 30s。",
      "prompt 写全平台、时长和字幕语言,且素材覆盖全部 5 个叙事角色时,不出提问卡,直接排分镜。",
      "原型:切「回复语言」看中英文两种只问缺项的结果。",
    ],
    errors: ["与第 4 步相同;未答题先发消息见第 23 步。"],
    copy: ["Your footage covers about {s}s — AI will fill the rest.", "素材大约能撑 {s} 秒,其余由 AI 补。(中文回复)", "What language should the subtitles be in?", "Your footage is missing these shots. Which should AI create?", "Pick any", "Other", "Skip / Submit ⌘↵"],
  },

  /* ───────── 6 生成计划 ───────── */
  plan: {
    what: [
      "只出一版方案:上方一段方案总结,下面是「Generation plan」卡 —— 整条广告在出方案时就全部定好(照 Claude 用 BuzzVideo MCP 做这件事的方式:只有 AI 补拍和配音交给生成模型,其余 Agent 自己剪)(§2.4)。",
      "标题行「Generation plan」+ 黄色「Awaiting confirmation」+「N items」,N 只数要生成的项(AI 补拍数 + 配音 1 项)。",
      "上半「要生成的」(带积分):每个 AI 补拍一项 —— 序号 + 粗体「AI shot · 角色 (秒数)」、右侧 50 积分、一行画面描述、「View prompt」展开完整 prompt、参数小标签「Seedance 2.5 | 9:16 | 时长」+ 参考图;旁白开着时最后一项是整条配音 —— 「Voiceover · {音色} ({总秒数}s)」、右侧积分、「View script」展开全部旁白台词(每句一行)、小标签「Seed Audio 1.0」。实拍素材不是生成项,不在这里逐镜列出。",
      "每个生成项右下角有一个带外边框的「Edit in canvas」按钮(画布图标,白底灰边,和底部那个 Edit in canvas 同一种样式),点了带着这份方案进画布单独改这一项;卡片底部一条:左边「Execute this plan? It will use about {N} credits.」,右边有边框的 Edit in canvas、✕ Cancel、▷ Confirm · {N} credits;用户点 Confirm 才开始生成并扣费。",
      "Confirm 自动出片(第 9 步);Edit in canvas 带着这份分镜和当前余额进画布自己剪(§2.7,剪辑器第 1 步)。",
    ],
    rules: [
      "积分 = 基础费 40(最终剪辑 + 渲染)+ 每个 AI 补拍 50 + 配音(5 × 旁白句数),不按时长;实拍素材、字幕、音乐、剪辑都包在基础费里。录制版(中英文一样)3 个补拍 + 6 句旁白 = 40 + 150 + 30 = 220 credits。",
      "旁白句数 = 分镜里有台词(authored)的镜头数;旁白关掉时没有配音项,积分少 30,头部 N 少 1。",
      "点 Confirm 先查余额:够就立刻扣掉 220(顶栏余额同步减少)并开始生成;不够不扣费、不开跑,输入框上方出积分不足横条「You've run out of credits. Upgrade to continue」、发送键换成 Upgrade,见第 16 步。",
      "全额在 Confirm 时一次扣掉(异常处理 spec 第 10 条):这一轮跑起来后不会因为团队里别人中途花掉积分而停下;只有之后的 Retry / Regenerate / 重剪会重新查余额。",
      "用户需求里有做不了 / 有风险的要求(点名真实明星、点名竞品、没法证实的功效):不卡流程,方案照常出,方案总结末尾多一句说明改了什么,见第 6 步。",
      "AI 镜头标题里的秒数是生成时长;配音的秒数是有台词镜头的在屏时长之和;Final cut 的秒数是整条分镜在屏时长取整(素材变速会换算)。",
      "AI 镜头按出现顺序重新编号 1、2、3,配音排最后;描述取分镜接口给的 summary,prompt 是交给视频模型的完整文本。",
      "点 Cancel:卡片变成灰色「Cancelled」并变淡,底部按钮消失,Agent 回一句「Plan cancelled. Tell me what to change, or confirm the plan again.」(中文回复为「已取消这版方案。告诉我要改哪里,或者重新确认。」);之后在对话里说要改什么会出一张新方案卡。",
      "点 Confirm 开跑后这张卡标签变成绿色「Confirmed」,按钮消失。",
      "请求中或生成中底部按钮都置灰;这版被新版取代后标签变成灰色「Replaced」、按钮隐藏;旧版只能看,不能再用。",
      "原型:「AI 补拍镜头」切到 0 时补拍镜头换成可用素材片段,上半只剩配音一项,积分 = 40 + 30 = 70;「旁白」关掉时没有配音项,录制版积分 190。",
      "原型:评审里点 Edit in canvas(或成片卡的剪辑图标)进剪辑器时,带过去的是 Agent 当前余额(已扣过的生成费用不会回来),和开发版交接一致;从侧栏直接点剪辑器步骤则用剪辑器自己的起始值(35,600,开「积分不足」为 2)。",
      "风险要求绕开:用户的需求里有做不了或有风险的要求时,不卡流程、不额外提问:方案照常出(真实明星 → 普通模特出镜;点名竞品 → 不点名,只说「普通产品」;没法证实的功效 → 不写具体功效),方案总结末尾多一句说清改了什么(异常处理 spec 第 7 条)。",
      "这一屏的 prompt 是「制作一条广告,请杨幂出镜,说比兰蔻好用,3天告别干皮,100%有效」/「Make an ad with Taylor Swift in it. Say it works better than La Mer, cures dry skin in 3 days and is 100% effective」;分镜用录好的那一版(不调模型),只在总结后面加那一句。",
      "那一句接在方案总结后面、方案卡上面,跟回复语言;按出现的类别拼:明星「I can't use a real celebrity, so a regular model plays the part.」;竞品「I also can't name another brand ({brand}), so the comparison says \"ordinary products\" instead.」(前面没有别的句子时是「I can't …」);功效「I also dropped the claim(s) \"…\" — I can't verify it / them.」(前面没有别的句子时是「I dropped …」)。",
      "中文回复:「我不能用真实明星,换成了普通模特出镜。也不能点名其他品牌(「兰蔻」),对比只说「普通产品」。另外去掉了「3天告别干皮」、「100%有效」这类宣称 —— 我没法核实。」",
      "检测范围:用户在这段对话里说过的话(落地页的 prompt + 之后的改稿,提问卡的回答不算),只看这张方案卡之前说的。",
      "原型的检测清单(固定规则,不调模型):明星 = 常见中英文明星名(Taylor Swift、Kim Kardashian、Zendaya、杨幂、刘亦菲、迪丽热巴等,英文整词、不分大小写);竞品 = 护肤大牌(La Mer / 海蓝之谜、SK-II / 神仙水、Estée Lauder / 雅诗兰黛、Lancôme / 兰蔻、Avène / 雅漾、La Roche-Posay / 理肤泉、Kiehl's / 科颜氏、Clinique / 倩碧、Shiseido / 资生堂,同一品牌只点一次);功效 = cure / heal / eliminate 起头的那一截、{n}% effective、guaranteed results、permanent …、{n} 天祛痘 / 美白 / 去皱 / 见效 / 告别…、根治 / 治愈 / 永久…、100% 有效。",
      "功效类在成片的 Needs your check 里再提醒一次「I left out \"…\" — only add an efficacy claim back if you can back it up.」(第 11 步);明星、竞品已经在方案里改掉,不再提醒。",
      "方案卡本身、积分、Confirm / Cancel / Edit in canvas 都和第 6 步一样;Confirm 后照常生成出片。",
    ],
    edges: [
      "补拍镜头数量没有上限,积分随之线性增加;旁白每多一句多 5。",
      "没有实拍镜头时不出「Your footage」行,没人说话时不出「Subtitles」行(方案里不再有屏幕文字和音效,剪辑器已去掉这两项);Final cut 和音乐行始终在。",
      "素材镜头带变速时按变速后时长计,如录制中文版第 4 镜 2.1 秒素材 0.5× 慢放,成片时长按 4.2 秒算。",
      "分镜接口最长 300 秒;返回没有镜头按失败处理。",
      "Confirm 防连点:同一时刻只会开一轮生成。",
      "没有风险要求时这一句不出现(其他步骤都没有)。",
      "改稿时才提的风险要求:从那一版方案起出现这一句;之前的旧方案卡不变。",
      "方案总结(direction)为空时这一句单独占一段。",
      "原型:检测只认清单里的写法,清单外的明星 / 品牌 / 说法认不出来;真实产品由 Agent 自己判断。",
    ],
    errors: [
      "分镜接口失败或返回没有镜头 → 思考行换成错误句「Couldn't lay out the storyboard: {reason}」(中文回复为「分镜没排出来:{reason}」,冒号后不留空格;统一报错句四类同第 13 步)+ Retry + Details,原始报错在 Details 里。",
      "Retry 重发上一次的分镜请求(brief + 素材分析 + 改稿原话),不重新分析素材,次数不限;显示规则与第 13 步相同,请求中再点无效。",
      "首版失败时还没有分镜,此时发消息只得到提示「The storyboard isn't ready yet — hit Retry above to try again.」(中文回复为「分镜还没排出来,点上面的 Retry 再试一次。」),不会重排;改稿失败时上一版分镜保持可用。排分镜失败不扣积分。",
      "原型:打开状态里的「分镜失败」可看 —— 打开后评审里所有排分镜请求(改稿、从分析中走到排分镜、Retry)都会失败;本步是回放好的分镜,在这里改一句稿即可触发。",
      "余额不足 → 输入框上方积分不足横条 + Upgrade 键(不是弹窗),见第 16 步。",
    ],
    copy: [
      "Generation plan",
      "Awaiting confirmation / Cancelled / Replaced / Confirmed",
      "{n} items",
      "AI shot · {role} ({s}s)",
      "View prompt / Hide prompt",
      "Seedance 2.5 | 9:16 | {s}s",
      "Voiceover · {voice} ({s}s)",
      "View script / Hide script",
      "Seed Audio 1.0",
      "Your footage · {n} clips / Subtitles / Background music / Final cut · {s}s · 9:16",
      "Same words as the voiceover / AI-generated · cuts on the beat",
      "Execute this plan? It will use about {credits} credits.",
      "Edit in canvas",
      "Cancel",
      "Confirm · {credits} credits",
      "Plan cancelled. Tell me what to change, or confirm the plan again.",
      "Tell me what to change…",
      "想改哪里直接告诉我…(中文回复时的输入框占位)",
      "Couldn't lay out the storyboard: {reason}",
      "The storyboard isn't ready yet — hit Retry above to try again.",
      "I can't use a real celebrity, so a regular model plays the part.",
      "I also can't name another brand ({brand}), so the comparison says \"ordinary products\" instead.",
      "I also dropped the claims \"{a}\" and \"{b}\" — I can't verify them. / I dropped the claim \"{a}\" — I can't verify it.",
      "我不能用真实明星,换成了普通模特出镜。/ 也不能点名其他品牌(「{brand}」),对比只说「普通产品」。/ 另外去掉了「{a}」这类宣称 —— 我没法核实。(中文回复)",
      "I left out \"{claim}\" — only add an efficacy claim back if you can back it up.",
    ],
  },

  /* ───────── 7 改稿后 ───────── */
  revised: {
    what: ["方案出来后用户在对话里说要改什么 → 带当前分镜 + 这句话重排,出新一版方案卡;旧卡标签变成「Replaced」并变淡、按钮隐藏,下方出现 Use this version(§2.4)。"],
    rules: [
      "有分镜时发出的每句话都当作改稿要求,基于最新一版(分镜或成片)重排;不识别「好的 / 就这样」之类的确认语,确认就点 Confirm。",
      "发出后出现用户气泡和「Laying out the storyboard…」,输入框置灰直到新表出来。",
      "新版积分按新分镜重新算(40 + 50 × 补拍数 + 5 × 旁白句数);录制改稿「开头换成雪山溪流」后变成 4 个补拍 + 6 句旁白 = 40 + 200 + 30 = 270 credits,方案卡上半多一个 AI shot 项,「Your footage」少一段。",
      "改稿本身不扣积分,只有 Confirm 扣。",
      "想改提问卡里答过的(平台 / 时长 / 字幕语言 / 补拍)也在这里说,如「改成 30 秒」,同样按改稿处理(异常处理 spec 第 11 条)。",
      "原型:评审里任何改稿都返回录好的同一版改稿结果。",
    ],
    edges: [
      "改稿可以连续多次,只有最新一版可操作,之前所有版本都变淡、只能看。",
      "改稿请求失败时旧版不会变淡,按钮照常可用,用户可直接用旧版出片。",
      "发送空白内容不会发出。",
    ],
    errors: ["改稿失败 → 错误句 + Retry,Retry 会重发同一份请求(含这次改稿原话);打开状态里的「分镜失败」可看。"],
    copy: ["Laying out the storyboard…", "正在排分镜…(中文回复)", "Edit in canvas", "Generate"],
  },



  /* ───────── 8 对话里补加素材 ───────── */
  addFootage: {
    what: [
      "出了方案之后,用户在对话输入框用「+」又加了素材:Agent 读新文件,并入素材,按新素材重排一版分镜 —— 就是继续对话,不用回落地页重来(异常处理 spec 第 17 条)。",
      "录制版:在第 6 步的方案上补加一段实拍「mist-closeup.mp4」,Agent 读完说一句,出新一版方案卡,旧卡变成旧版。",
    ],
    rules: [
      "对话页输入框左下角的「+」可点(落地页之外原来只是装饰):打开系统文件选择,可多选,接受 video/*、image/*、audio/*;和落地页同一套校验(探测、判重、类型、大小 / 时长、总数上限 10 个),不合规的不加入,底部 toast 列出原因。",
      "加入后:用户侧出一组素材缩略图 → 思考行「Reading {n} new file(s)…」→ Agent 一句 → 已有方案时自动排新一版(同第 7 步改稿),方案总结里说新素材用在哪、哪些 AI 补拍因此去掉或保留,积分按新分镜重算。",
      "还没出方案(提问卡待答 / 分析中)时补加:读完只说「排分镜时一起用上」,不重排;提问卡照常作答。",
      "References 条里跟着多出新素材;进画布时新素材一起带过去。",
    ],
    edges: [
      "生成中不收新素材:点「+」选完文件后出 toast「Add footage once this reel is done」,文件不加入;生成结束或停止后再加。",
      "分析 / 排分镜请求在途时「+」置灰。",
      "同一个文件不能重复加(已在对话里的按文件名判重)。",
      "补加的素材全部读不出来 → Agent 回一句「Couldn't read the new files」+ 原因,原方案不变,可以再加。",
    ],
    errors: ["新文件读取失败 → 一句报错 + Details,方案保持原样;不扣积分。"],
    copy: [
      "Add footage(「+」的无障碍名)",
      "Reading {n} new file(s)… / 正在读新加的 {n} 个文件…(中文回复)",
      "I've read the {n} new file(s). Here's an updated storyboard.",
      "I've read the {n} new file(s) and will use them in the storyboard.",
      "Add footage once this reel is done",
      "Couldn't read the new files",
    ],
  },

  /* ───────── 9 生成中 ───────── */
  generating: {
    what: [
      "点 Confirm 后:右侧先出一条用户气泡「Confirm」,Agent 回一句,下面是生成中网格(§2.5)。",
      "网格只放真正要生成的东西:每个 AI 补拍一张竖版 9:16 卡,三列排;旁白开着时网格下方再出一张横向音频卡(生成中是同一套渐变动画 + 「Generating...」);实拍素材不出卡(那是 Agent 自己剪的,不是生成)。录制版 3 张补拍卡 + 1 张音频卡。",
      "还没好的卡片是暖橙到粉的渐变,左上角小标签「Generating...」点点循环,不显示百分比;网格下方三个灰点 + 当前阶段一句话。",
      "原型是演示:不调 Seedance / Seed Audio、不出真成片;真实产品是带 ffmpeg 沙盒的 Agent,阶段来自实际工具调用流(§5)。",
    ],
    rules: [
      "要生成的素材(补拍 + 配音)全部好了、进入剪辑合成(剪素材 / 拼接 / 字幕 / 混音 / 检查)时,素材区下面先出「Final ad」成片区:一张 9:16 的成片卡,同一套渐变动画 + 「Rendering...」小胶囊;合成完换成真正的成片卡。只剪不生成的一轮(没有素材卡)也一样出这张。",
      "开跑时已扣掉方案卡上的积分(录制版 220),顶栏余额立即减少。",
      "AI 卡在它自己的补拍任务完成时变成一张视频卡,和成片卡同一种样式(不带「Shot {n} · AI」标签):右上收藏 / 下载 / 重新生成(只重做这一镜,打开「Redo a shot」并预先勾好这一镜)/ 剪辑(进画布)/ 更多(View prompt 看这一镜的 prompt),中间播放键,底部播放 / 静音 / 时间 / 全屏 + 进度条;原型里播的是演示成片里对应的一段,时长 = 这一镜的时长;生成还在跑时重新生成和剪辑置灰;配音生成完后变成音频结果卡(同产品):右上收藏 / 下载 / 剪辑(进画布)/ 更多(View script 看整条旁白稿),下面一条浅灰播放条 —— 橙色渐变圆形播放键 + 灰色波形(已播放部分变橙)+「0:00 / 0:30」;原型播的是演示成片的音轨。",
      "阶段文案随进度切换:Getting things ready... → Filming in progress...(AI 补拍)→ Adding the voiceover... → Cutting your footage... → Assembling the reel... → Adding subtitles... → Mixing the audio... → Checking the final cut...。卡片都好了之后进度行还会继续走剪辑这几步。",
      "演示节奏:准备 1.5s → 补拍每镜 4 / 5 / 6s 并行 → 配音 2.5s → 剪切 1.5s / 拼接 2s / 字幕 1.5s / 混音 1.5s → 检查 1s;录制版全程约 17.5 秒,关掉旁白约 15 秒,补拍切到 0 时约 10.5 秒(只有配音卡)。",
      "网格是「素材区」:顶部标题「Generated assets」;每个 AI 补拍镜头上方一行名字(和 Generation plan 同名,如「AI shot · Pain (4s)」)+ 两行内的画面描述,配音上方是「Voiceover · {音色} ({s}s)」+ 旁白第一句。成片出来后素材区照常完整显示,不收起。成片卡上方另起「成片区」:标题「Final ad」+ 一句「已把你的实拍素材、AI 补拍和配音按分镜自动剪成一条成片。」,和素材区分开。",
      "生成中输入框发送键旁出现 Stop,点了停在当前进度并退回未完成部分的积分,见第 10 步。",
      "生成中分镜卡按钮置灰,重复点 Confirm 不会再开一轮;输入框仍可输入(发出的话进入排队,见第 9 步)。",
      "全部生成成功、剪辑走完后自动出成片卡,见第 11 步。",
      "左侧 History 栏最上面是当前这段对话「New Session」(高亮):生成中右侧一个橙色小转圈 +「Generating…」;生成结束后转圈消失(异常处理 spec 第 3 条)。",
      "积分在 Confirm 时已全额扣掉:跑的过程中团队里别人花积分也不会让这一轮停下(异常处理 spec 第 10 条)。",
      "原型:评审里点「生成中发一句话」可模拟生成中用户插话;「生成失败(Agent)」选「镜头·繁忙 / 镜头·审核」后第 2 个补拍镜头会按那个原因失败(见第 17、18 步),选「配音·繁忙 / 配音·敏感词」后配音会失败(见第 20 步);打开「剪辑失败」后这一轮剪到拼接那一步失败(见第 21 步)。",

      "生成中发出的每句话都只显示为气泡,Agent 暂不回应,网格(补拍卡 + 配音卡)继续生成。",
      "成片卡出来后,所有排队的话按换行拼成一句改稿要求,基于刚交付的这一版重排,随后出现「Laying out the storyboard…」和新分镜表。",
      "这一轮有镜头失败、停下来问怎么继续时,排队的话先留着:选了 Retry / 用素材 / 删掉,等成片出来再合并改稿;在提问卡里选 Other 写一句,排队的话和这句一起当改稿。",
      "生成中点 Stop 时,排队的话同样立刻合并成一次改稿,基于最新一版分镜重排。",
      "新分镜出来后更早的分镜表变淡,成片卡保留不变。",
      "原型:评审这一步预置了一条排队消息,停留约 17.5 秒等演示出片后自动续上。",
    ],
    edges: [
      "补拍切到 0 且旁白关掉时没有任何要生成的东西,网格不出卡,只有进度行。",
      "生成中刷新 / 关掉页面(异常处理 spec 第 3 条):真实产品里生成在后台继续,用户从 History 回到这段对话能看到当前进度,已经好的镜头照常显示;全部完成后发通知 —— History 里这一条出红点(未读),同时发一封邮件。",
      "原型:对话只在内存里,刷新仍会落到空态(第 25 步);只演示 History 那一条的状态 —— 切到别的浏览器标签页、等成片出来再切回来,这一条右侧是红点,点一下红点消失。邮件不演示。",
      "高峰排队(异常处理 spec 第 4 条):Hybrid Reel 只对 Enterprise 开放,不做排队条 / 升级插队,排队时界面照常显示生成中,只是慢一些。",
      "同一时刻只有一轮在跑;Regenerate 要等当前这轮结束或停止。",
      "排队的话没有条数上限,也没有「已排队」的标记或撤回;出片前 Agent 不回应。",
      "合并改稿不扣积分,出新分镜后要再点 Confirm 才扣。",
    ],
    errors: [
      "某个补拍镜头失败 → 这张卡变成浅粉底 + 灰色图片图标 + 红字原因(英文,临时故障「The video model is busy right now.」/ 审核没过「The reference image may contain sensitive content.」)+ 下划线「Retry」,退回这一镜 50 积分;所有生成结算完后不进剪辑、不出成片,Agent 停下来用提问卡问怎么继续,选项按原因变,见第 17、18 步。",
      "配音失败 → 配音卡变成浅粉底红字原因(「The voice service is busy right now.」/「The script may contain restricted words.」)+ Retry,退回配音积分(5 × 句数),同样结算完停下来问,见第 20 步。不自动重试。",
      "生成都成功、剪辑 / 渲染失败 → 卡片照常是好的,进度行变成红字「Couldn't finish the edit.」,退回 40 基础费,Agent 问重剪还是进画布,见第 21 步。",
      "余额不够时根本不会开跑,见第 16 步。",
    ],
    copy: [
      "Meanwhile, I'll prepare the live footage segments, title card and end card.",
      "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。(中文回复)",
      "Confirm",
      "Generating...",
      "Generating... / View script / Script / 0:00 / {m:ss}",
      "Getting things ready... / Filming in progress... / Adding the voiceover... / Cutting your footage... / Assembling the reel... / Adding subtitles... / Mixing the audio... / Checking the final cut...",
      "Stop",
      "New Session / Generating…(History 当前对话)",
      "New result(红点的无障碍名)",
    ],
  },


  /* ───────── 10 用户手动停止 ───────── */
  stopped: {
    what: ["生成中点 Stop:网格停在当时的进度,未完成部分的积分退回,Agent 回一句退了多少。"],
    rules: [
      "Stop 只在生成网格正在跑时出现在发送键旁(整条生成和失败后的续跑都可以停)。",
      "点了之后:已经变好的卡片(补拍画面 / 配音音频卡)保留;还没好的卡片变成浅粉底 + 灰色图片图标 + 红字「Stopped by user」和下划线「Retry」;网格下方阶段文案变成「Stopped.」,不再有跳动的点。",
      "点卡片上的 Retry:按同一份分镜整体重新生成(先查余额,重新扣全额,不再出「Confirm」气泡),出一张新网格;生成中或其他请求进行中时 Retry 不显示。",
      "退款 = 已扣 − 已退(失败镜头) − 已生成完的补拍 × 50 − 已生成完的配音(5 × 句数);成片没出来,40 基础费全退。",
      "停止前已经到点失败的镜头 / 配音先按失败退款,不会重复退;失败的配音不算「已生成完」,不会从退款里扣掉。",
      "停止后不出成片卡;也可以回到分镜卡点 Confirm 重新生成(重新扣全额)。",
      "原型:评审这一步停在第 3.5 秒(补拍还在跑、配音还没开始),录制版退回全部 220 积分;补拍切到 0 时停在演示一半处(配音已做完),退回 40。",
    ],
    edges: [
      "已生成完的补拍和配音不退款(真实产品已产生费用),但停止后也不会保留给下一轮复用。",
      "Stop 只能点一次,停止后按钮消失;生成已结束、停下来等回答失败提问卡、或改写卡等着点 Generate 时 Stop 不出现。",
      "失败后的续跑(只重跑镜头 / 只重做配音 / 直接剪 / 剪辑失败后的重剪)也可以停,按同一个公式退;重剪那一轮只扣了 40,停了退 40。",
      "停止时有排队的话 → 立刻合并成一次改稿重排,见第 9 步。",
    ],
    errors: [],
    copy: ["Stop", "Stopped by user", "Retry", "Stopped.", "Stopped. {n} credits refunded.", "已停止。退回 {n} 积分。(中文回复)"],
  },

  /* ───────── 11 成片 ───────── */
  reel: {
    what: [
      "成片卡按参考图:右上收藏 / 下载 / 重新生成 / 剪辑 / 更多,中间播放键,底部控制条(§2.6)。",
      "卡下依次:交付说明(末尾「Saved to your Assets.」,不带跳转链接)→ Agent 自己调整了什么(只在超时长 / 字幕溢出时出现)→ 最终分镜(Storyboard)→ Models, voice & credits(合计 = 这条成片实际用掉的积分)→ Needs your check。",
      "只有所有生成都成功、剪辑也成功才会出成片卡;有镜头或配音失败时先停下来问(第 17、18、20 步),剪辑失败也先问(第 21 步),答完才出,成片里不会有占位画面。",
      "成片出来就自动永久存进用户的资产库(异常处理 spec 第 12 条),不会过期;对话里的成片卡和资产库里的是同一个文件。",
      "原型:成片视频固定为 RELLET 演示片,交付说明里的分辨率、帧率、时长、响度是写死的,与用户素材和分镜无关(§2.6 已知限制)。",
    ],
    rules: [
      "收藏切换实心红心,只在当前页面有效,刷新或重新进入即丢失。",
      "下载:下载本次成片,文件名 {brand}-{platform}-{duration}s.mp4(小写、空格变连字符),时长按分镜实际在屏时长取整;没识别出品牌用 hybrid-reel。",
      "下载失败(网络断了 / 文件取不到):底部 toast「Download failed — try again」+ 橙色「Retry」,5 秒后消失;点 Retry 重新下载同一个文件,还失败就再出一次 toast(异常处理 spec 第 12 条)。",
      "Agent 自己调整了什么(异常处理 spec 第 9 条):旁白按字数估时(英文 2.5 词/秒、中日韩 4 字/秒),超过分镜在屏总时长 {N} 秒时,先旁白提速(最多 1.1×)并压缩镜头停留 —— 写「I sped the voiceover up slightly (1.1×) and trimmed shot holds to keep it at {N}s.」;提速后还超,就删次要旁白句(开场钩子、片尾行动号召不删,次要句里最长的先删),每删一句写「I dropped the line \"…\" to stay within {N}s.」;有字幕一屏放不下(每行最多 32 字符 / 14 个中日韩字,每屏两行)时写「Long subtitle lines are split across screens.」。都没有时这一段不出现。",
      "做不了 / 有风险的要求(第 6 步)里有没法证实的功效时,Needs your check 末尾多一条「I left out \"…\" — only add an efficacy claim back if you can back it up.」;明星、竞品在方案里已经改掉,不再提醒。",
      "品牌名取素材里「品牌素材」描述中第一个 ≥ 3 位的全大写拉丁词(录制为 RELLET),所以录制版下载名是 rellet-tiktok-30s.mp4(英文版 29s)。",
      "重新生成:先弹确认「Regenerate this reel? It uses {n} credits.」;点 Regenerate 再查余额,够就扣全额、跑一遍第 9 步并在下方追加一张新成片卡,旧卡保留;不够关掉确认弹窗,输入框上方出积分不足横条 + Upgrade 键。",
      "剪辑图标与 Edit in canvas 一样带着这版分镜和当前余额进画布(剪辑器第 1 步);Regenerate 或失败后的续跑在跑时剪辑图标置灰,点了也不进画布,避免丢下一轮已扣费的生成。",
      "右上「⋯」两项:「Redo a shot」(只重做某几镜,规则见下面「只重做某一镜」;没有 AI 补拍镜头时不出)和「View prompt」(眼睛图标):弹窗「Prompt」列出这条成片实际用到的生成 prompt —— 每个 AI 补拍镜头一段(Shot {n} · AI · Seedance 2.5 · 时长)+ 旁白稿(Voiceover · Seed Audio 1.0 · 时长);点 ×、遮罩或 Esc 关闭。成片卡不提供复制链接和删除。",
      "Models, voice & credits:每个 AI 镜头一行(Seedance 2.5 + 时长 + 50 credits),有旁白时一行配音(显示音色名,如 cn-f → Xiaoyu、warm-f → Aria,+ 5 × 句数积分,录制版 30),一行最终合成 40 credits,最后合计 = 40 + 补拍 + 配音(录制版 220;失败后选了用素材顶上 / 删掉,则少掉那一镜)。",
      "Needs your check:卖点在素材描述里重合不到一半时提示核实宣称;有 AI 镜头时提示核对包装小字 / logo;背景音乐不是用户上传的就提示换授权曲目。",
      "顶栏余额已扣成 35,600 − 220 = 35,380(录制版)。",
      "原型:「生成失败(Agent)」不是「无」时本步预置为:失败 → 提问卡按推荐项答 → 续跑 → 成片。镜头·繁忙 = Retry 只重跑那一镜;镜头·审核 = 改写 prompt 后点 Generate 重跑那一镜(成片 View prompt 里是新 prompt);配音·繁忙 = Retry 只重做配音;配音·敏感词 = 改写旁白稿后 Generate(成片字幕是新稿)。余额都和没失败一样是 35,380(失败先退、续跑再扣同样的数)。",
      "换了模型重跑的镜头,Models, voice & credits 和 View prompt 里写实际用的模型(Seedance 2.0 Fast);改成产品图动态镜头 / 用素材顶上的镜头不再算 AI 镜头;不要配音时没有配音那一行。",
      "原型:「剪辑失败」打开时本步预置为:生成都成功 → 剪辑失败(退 40)→ 按推荐项「Retry the edit」重剪(扣 40)→ 成片,余额仍是 35,380。",
      "原型:「旁白超长」打开时旁白稿换成更长的一版(录制版旁白预估约 33–35 秒,分镜 29–30 秒),本步交付说明下面出提速、删掉第 2 镜那句、字幕拆屏三句;关掉时录制版不超长,这一段不出现。原型只改说明文字,演示成片不变。",
      "只重做某一镜:出片后只对某一镜不满意,点素材区那一镜视频卡上的「重新生成」(这一镜预先勾好),或成片卡「⋯ → Redo a shot」,勾选要重做的 AI 补拍镜头,只重做这几镜,其余镜头和配音不动,好了重新剪一版(异常处理 spec 第 20 条)。",
      "和整条 Regenerate 的区别:Regenerate 整条重跑、扣全额;Redo a shot 只扣勾选镜头的积分。",
      "弹窗「Redo a shot」列出这条成片的所有 AI 补拍镜头(实拍不是生成的,不在列表里):每行一个方框 + 「Shot {n} · AI」+ 右侧「50 credits」+ 两行 prompt 摘要;点整行勾选 / 取消。",
      "一个没勾时 Redo 置灰;勾了显示「Redo · {n} credits」(50 × 勾选数)。",
      "点 Redo:查余额 → 扣费 → Agent 一句「Redoing shot {n} and keeping everything else, then I'll re-cut the reel.」→ 只含这几镜的生成中网格(同第 9 步,可 Stop)→ 下方追加一张新成片卡,旧卡保留。",
      "Cancel / 点遮罩 / Esc 关闭,不扣费。",
      "想改 prompt 再重做:在输入框说(如「第 3 镜换成户外」),按改稿出新方案;Redo a shot 只是原样重新生成。",
    ],
    edges: [
      "成片出来后在输入框发话仍按改稿处理,基于成片这一版重排(同第 7 步)。",
      "成片卡出现时页面滚到卡片顶部而不是最底部。",
      "请求中或生成中「重新生成」和「剪辑」置灰;收藏、下载、更多不受影响。",
      "音色 id 在音色表里找不到时直接显示 id;没有指定音色显示 Default voice。",
      "重新生成确认弹窗和 View prompt 弹窗都可按 Esc 或点遮罩关闭。",
      "原型:交付说明里文件名会随品牌 / 平台 / 时长变化,但后面的 1080×1920 · 30 fps · 15.6s · -14 LUFS 是演示片的固定参数,和文件名里的时长对不上。",
      "原型:交付说明和成片下方的小节标题(Storyboard 等)中文回复时仍是英文,只有正文随语言变化。",
      "页面不在前台时成片到了:History 里当前这条出红点(见第 9 步)。",
      "这条成片没有 AI 补拍镜头(全是实拍)时「⋯」里不出这一项。",
      "生成 / 重做在跑时这一项置灰。",
      "重做的镜头失败:和第 17 步一样停下来问,选项按原因变。",
    ],
    errors: [
      "视频加载失败 → 卡片换成 Couldn't load the video + Retry,见第 22 步;打开「视频加载失败」开关在本步也能看到。成片已存进资产库,不会因为过期而打不开;真打不开才是这一态。",
      "下载失败 → toast「Download failed — try again」+ Retry → 点 Retry 重下。",
      "剪贴板写入失败(浏览器拒绝权限)→ toast「Couldn't copy the link」,用户可重试。",
      "重新生成时余额不足 → 积分不足横条 + Upgrade 键,不扣费,见第 16 步。",
    ],
    copy: [
      "The reel is ready: {file} · 1080×1920 · 30 fps · 15.6s · about -14 LUFS.",
      "成片做好了:… · 响度约 -14 LUFS。(中文回复)",
      "Storyboard",
      "Models, voice & credits",
      "Shot {n} · Seedance 2.5 · {d}s · {per} credits",
      "Voiceover · {voice name} · {n} credits",
      "Default voice",
      "Final render · {base} credits",
      "Total · {total} credits",
      "Needs your check",
      "“{selling point}” isn't clearly shown in your footage — confirm the claim before the ad runs.",
      "AI can blur small packaging text or the logo — compare shot {n} with the real product.",
      "The background music is a placeholder — swap in a licensed track before you publish.",
      "Regenerate this reel? / It uses {n} credits. / Cancel / Regenerate",
      "View prompt / Prompt / Redo a shot",
      "Favorite / Unfavorite / Download / Regenerate / Edit in canvas / More(图标按钮的无障碍名)",
      "Saved to your Assets. / 已存入你的资产库。(中文回复)",
      "Assets isn't part of this prototype",
      "Download failed — try again / Retry",
      "I sped the voiceover up slightly (1.1×) and trimmed shot holds to keep it at {N}s.",
      "I dropped the line \"{line}\" to stay within {N}s.",
      "Long subtitle lines are split across screens.",
      "旁白稍微提速(1.1×)并压缩了镜头停留,保持在 {N} 秒。/ 删掉了「{line}」这句旁白,控制在 {N} 秒内。/ 较长的字幕自动断行,拆成几屏显示。(中文回复)",
      "I left out \"{claim}\" — only add an efficacy claim back if you can back it up.",
      "Redo a shot",
      "Pick the AI shots to redo. Everything else stays as it is, and the reel is re-cut.",
      "Shot {n} · AI / {n} credits",
      "Cancel / Redo / Redo · {n} credits",
      "Redoing shot {n} and keeping everything else, then I'll re-cut the reel. / 重新生成第 {n} 镜,其余镜头不动,好了重新剪一版。(中文回复)",
    ],
    open: [
      "待定:真实成片的导出 / 渲染(分辨率、码率、失败重试)与下载用的签名链接及有效期;现在下载拿的是演示片的公开地址。",
      "待定:下载文件名的品牌只靠「品牌素材描述里的全大写拉丁词」猜,brief 里没有品牌字段,纯中文品牌或没传 logo 时都会退回 hybrid-reel。",
    ],
  },


  /* ───────── 12 上传超限 ───────── */
  uploadLimit: {
    what: [
      "选文件时就按上限校验:超限或类型不对的文件不加入,产品区顶部居中出一条红色提示 toast,写明每个文件为什么没加进来(待定落地 §2)。",
      "文件损坏也在这里拦(异常处理 spec 第 13 条):选中时探测打不开的文件不加入,提示「{file} can't be read — try exporting it again」。",
    ],
    rules: [
      "每个被拒的文件一行原因;合规的文件照常加入缩略图行。",
      "已选 + 本次合规文件超过 10 个时,超出的按选择顺序丢掉,提示末尾加一行「You can add up to 10 files」。",
      "每次重新选文件,提示整条替换成这一次的结果(这次全部合规则提示消失);6 秒后自动消失,期间再选文件重新计时;点 × 立即关闭。拖进输入框和「+」选文件同一套提示。",
      "损坏判定:0 字节一定算;否则要浏览器报错(视频读元数据 / 图片解码触发 error)且文件头不是认得的格式(MP4 / MOV、WebM / MKV、AVI、JPEG、PNG、GIF、WebP、HEIC)才算。5 秒读不出来是「读不到时长」,不算损坏;浏览器报错但文件头认得(HEVC 的 .MOV、HEIC)也不算,照收照分析。音频只拦 0 字节。",
      "原型:评审这一步是在已选 4 个素材之后又选了 5 个不合规文件:1.2 GB 的 .mov、14 分钟的 .mp4、36 MB 的 .png、一个 PDF、一个损坏的 .mp4,五个都被拒;评审这一步的提示进来就显示、不自动消失,方便看,在这一步再选文件时新提示照常 6 秒消失。",
    ],
    edges: [
      "上限(暂定,见第 2 步待定):最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB;只收视频 / 图片 / 音频。",
      "视频超 500 MB 时只报大小,不再报时长;读不到时长的视频不按时长拦。",
      "系统文件选择器切到「所有文件」时仍可能选到其他类型,这些在这里被拒。",
      "上传接口(Blob)单条上限同为 500 MB,前端放行的文件不会再被它按大小拒收。",
    ],
    errors: [
      "被拒文件不进入后续流程,用户换文件重选即可;不需要刷新或回退。",
      "损坏的文件 → 用户在原软件里重新导出,再选一次即可。",
    ],
    copy: [
      "{file} is over 500 MB",
      "{file} is longer than 10 minutes",
      "{file} is over 20 MB",
      "{file} is over 50 MB",
      "{file} isn't a video, image or audio file",
      "{file} can't be read — try exporting it again",
      "You can add up to 10 files",
      "Dismiss(× 的无障碍名)",
    ],
  },

  /* ───────── 13 分析失败 ───────── */
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
      "原型:评审这里的报错是模拟的超时:界面显示「The model took too long to respond.」(中文回复为「模型响应超时。」),Details 是「The model service timed out (simulated)」。",
    ],
    edges: [
      "只有部分文件失败时不会到这一步,而是跳过失败的文件继续(见第 4 步);全部文件都失败且属于「文件太大」类时,错误句里的文件名取第一个失败的文件。",
      "brief 接口返回里没有 brief 时原始报错为 No brief returned,归入「其他」类。",
      "中文回复时整句都是中文:前缀与报错句之间用「:」、不留空格,如「素材分析失败:模型响应超时。」;Details 里的原始报错不翻译,Retry / Details 按钮仍是英文。",
      "刷新页面后原文件已不在内存,只能回落地页重新上传(第 25 步)。",
    ],
    errors: ["分析失败 → 错误句 + Retry + Details → 点 Retry 后旧错误句移除、重新出现思考行;仍失败则换成新的错误句,Retry 次数不限。"],
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

  /* ───────── 14 上传中断 ───────── */
  uploadInterrupted: {
    what: [
      "上传或分析请求中途断网:先自动再传一次,用户无感;仍失败的文件按「跳过这个文件」处理,其余素材照常分析、出题,回复里列出被跳过的文件(异常处理 spec 第 13 条)。",
      "这一屏 = 4 个素材里第一个(SaveClip…mp4)两次都没传上去,被跳过;其余 3 个照常读完,停在提问卡上。",
    ],
    rules: [
      "断网 = 浏览器发请求时抛网络错误(Failed to fetch / Load failed / fetch failed 等);每个文件单独判断,只重传断掉的那几个,已成功的不重传。",
      "自动重传只有一次,不出任何提示、不重报进度(思考行的 Reading {done}/{n} 照第一次的结果走)。",
      "重传仍失败:Agent 那段话下方一行「Skipped {file}: Upload interrupted — check your connection」(中文回复为「跳过了 {file}:上传中断了,请检查网络」)。",
      "「Read N files」只数读成功的(这一屏 4 个跳过 1 个 = Read 3 files);Agent 的总结、缺口、提问卡都按读成功的素材算。",
      "想补回被跳过的文件:网络恢复后回落地页重新上传(原型不做单个文件重传按钮)。",
    ],
    edges: [
      "被跳过的是唯一的视频时,能用的素材可能不够,会按第 15 步走「素材不可用」;秒数不够时长时提问卡出「能撑多少秒」(第 4 步)。",
      "取消分析(Cancel)不算断网,不会触发重传。",
      "超时、文件太大、模型报错等非断网失败不重传,照原来的统一报错句跳过(见第 4 步)。",
    ],
    errors: [
      "全部文件都断网失败(重传后仍失败)→ 不跳过,整体报错「Couldn't read your footage: Couldn't reach the server — check your connection.」+ Retry,见第 13 步。",
    ],
    copy: ["Skipped {file}: Upload interrupted — check your connection", "跳过了 {file}:上传中断了,请检查网络(中文回复)", "Read {n} files"],
  },

  /* ───────── 15 素材不可用 ───────── */
  unusable: {
    what: [
      "素材读完发现基本用不上:不出常规提问卡,Agent 先用一段话说清哪些文件不能用、为什么(太糊 / 太短 / 看不到产品),再问一张提问卡怎么继续(异常处理 spec 第 5 条)。",
      "这一屏的素材是把录好的分析改出来的:两个视频所有片段标成不可用(第一个太糊,第二个看不到产品),产品图标成太糊、不用;品牌 logo 照常。",
    ],
    rules: [
      "判定「素材不可用」:没有能用的产品图,且能剪进片子的素材不到 3 秒(含一秒都没有)。能剪进片子的秒数 = 可剪素材(footage / showcase / evidence)里可用片段加起来;有产品图时不算(产品图能做动态镜头,其余 AI 补)。",
      "那段话:「I've gone through your footage, but most of it won't work: {file} is too blurry, {file} doesn't show the product and {file} is too blurry. That leaves nothing I can cut into the ad.」最多点名 4 个文件,其余合成「{n} more files have nothing usable」;还剩几秒时最后一句为「That leaves only about {s}s I can cut into the ad.」。中文回复整段中文。",
      "原因从分析结果的 issues 和不可用片段的 reason 里归类:含 blur / 模糊 / 糊 → too blurry;含 product not visible / 看不到产品 → doesn't show the product;含 too short / 太短(或视频不到 1 秒)→ too short;都不是 → has nothing usable。音频、品牌 logo、参考片不点名。",
      "提问卡「Your footage doesn't give me enough to work with. How should I continue?」单选,交互同第 4 步:",
      "① Add more footage(Recommended)—「Upload clips that show the product clearly」:回到落地页,这次的素材和 prompt 都留着,用户用「+」或拖拽补传,再点 Create 从头重新分析全部文件(对话清掉)。",
      "② Let AI create the missing shots —「Every beat becomes an AI shot · more credits」:接着出常规提问卡,补拍题五段(Hook / Pain point / Proof / Usage / End card)全部列出、默认全选;brief.notes 记一句「the uploaded footage is unusable; AI-shoot every beat」。",
      "③ Use what I have —「Cut the ad from this footage as it is」:接着出常规提问卡(缺口按素材算),notes 记「use the uploaded footage as it is」;没有要问的就直接排分镜。",
      "Other:写的话记进 brief.notes(「Footage: {原话}」),按③接着走;Skip = 推荐项(回落地页)。",
      "②③后面的提问卡里,时长题下会出「Your footage covers about {s}s — AI will fill the rest.」,补拍题标题带积分(第 4 步)。",
    ],
    edges: [
      "选了①回落地页后在评审里点 Create:录制数据按正常素材回放,能看到补传后照常出提问卡。",
      "提问卡没答就在输入框发消息 → 不排分镜,提示先在卡片里选(同第 23 步)。",
      "只传了音频 / 只有品牌 logo 也会走到这一步(没有能剪进片子的画面)。",
      "回落地页后已选素材仍可删(×),同一个文件不能重复加,上限照常。",
    ],
    errors: [
      "补传后重新分析仍不可用 → 再出这一段话和这张卡,次数不限。",
      "②③之后分镜接口失败 → 同第 6 步「Couldn't lay out the storyboard」+ Retry。",
    ],
    copy: [
      "I've gone through your footage, but most of it won't work: {file} is too blurry, {file} doesn't show the product … That leaves nothing I can cut into the ad.",
      "素材看完了,但大多用不上:{file} 太糊;{file} 看不到产品。没有能剪进片子的画面。(中文回复)",
      "Your footage doesn't give me enough to work with. How should I continue?",
      "Add more footage · Upload clips that show the product clearly",
      "Let AI create the missing shots · Every beat becomes an AI shot · more credits",
      "Use what I have · Cut the ad from this footage as it is",
      "Other / Skip / Submit ⌘↵",
    ],
    open: ["待定:判定门槛(没有产品图且可用素材 < 3 秒)是原型暂定,需按真实素材调;有产品图但视频全不可用时目前不拦,走常规提问(产品图做动态镜头)。"],
  },

  /* ───────── 16 积分不足 ───────── */
  noCredits: {
    what: ["余额不够时点 Confirm(或 Regenerate、失败提问卡里的 Retry、停止后的 Retry):不扣费、不开跑,也不弹窗 —— 和 BuzzVideo 正式产品一样,输入框正上方出一条积分不足横条,输入框的圆形发送键换成 Upgrade(待定落地 §1)。"],
    rules: [
      "扣费前检查:费用 ≤ 余额才放行;Generate / Regenerate / Retry 的费用 = 方案卡合计(40 + 50 × 补拍 + 5 × 旁白句数,录制版 220);失败提问卡里要生成的选项(Retry / Try another model / Use a different reference)= 50 × 失败镜头数,配音的 Retry / Try another voice = 5 × 句数,改写卡的 Generate 同理,剪辑失败后的「Retry the edit」= 40;不够时提问卡 / 改写卡留着、不扣费,出同一条横条。",
      "运行中不会因为余额不够停下(异常处理 spec 第 10 条):一轮的全额在开跑时一次扣掉,团队里别人中途花掉积分也不影响这一轮;余额只在下一次 Confirm / Retry / Regenerate / 重剪时再查,不够才出这条横条。",
      "横条:浅粉到浅红的横向渐变圆角条,左边 BuzzVideo 产品积分图标(/icons/credits.svg 同图),红橙色文案「You've run out of credits.」,后接带下划线的链接「Upgrade to continue」。",
      "输入框右下角的圆形发送键换成橙红渐变的「Upgrade」按钮;输入框仍可打字,但回车和按钮都不会发送。",
      "点 Upgrade 或「Upgrade to continue」:原型不做升级页,只出 toast「Upgrade isn't part of this prototype」。",
      "分镜卡的 Confirm 仍可点,再点只是再次检查余额,横条保持,不扣费。",
      "余额回到 ≥ 被拦下那次的费用时(原型里不会发生),横条自动收起、发送键恢复。",
      "原型:评审这一步余额预置为 2,录制版需要 220;侧栏「积分不足」开关会把 Agent 和剪辑器的起始余额都设为 2,任何扣费都会被拦(最便宜的成片也要 40,失败重试每镜 50),Agent 里点 Confirm 走同一套横条流程。",
    ],
    edges: [
      "余额正好等于费用时放行,扣完余额为 0。",
      "Regenerate 先弹确认、确认后才查余额,不够时确认弹窗关闭,出积分不足横条。",
      "顶栏余额就是检查用的余额;评审里落地页顶栏显示同一个余额,开发版落地页顶栏固定 35,600(见第 2 步)。",
      "剪辑器(画布)里余额不足仍是它自己的「Not enough credits」弹窗,见剪辑器步骤。",
    ],
    errors: ["余额不足 → 横条 + Upgrade 键 → Upgrade(原型只出提示)→ 不扣费,对话状态不变。"],
    copy: [
      "You've run out of credits.",
      "Upgrade to continue",
      "Upgrade",
      "Upgrade isn't part of this prototype",
    ],
  },

  /* ───────── 17 生成失败(单镜) ───────── */
  genFailed: {
    what: [
      "某个 AI 补拍镜头因为临时故障(模型繁忙 / 超时 / 网络)没生成出来:不自动重试,也不出带占位画面的成片。等这一轮所有生成(补拍 + 配音)都结算完,退回失败镜头的积分,停下来用和开头同一张 Claude 式提问卡问用户怎么继续(异常处理 spec 第 1 条)。",
      "网格里失败的卡和停止卡同一样式:浅粉底 + 灰色图片图标 + 红字原因「The video model is busy right now.」+ 下划线「Retry」;点卡上的 Retry 等于在下面提问卡里选推荐项「Retry shot {n}」;其余卡照常变好;网格下方不再有进度行(不进剪辑)。",
      "审核没过是另一套选项,见第 18 步;配音失败见第 20 步。",
    ],
    rules: [
      "失败的镜头到它本该完成的时间点变成失败卡,同时退回这一镜 50 积分(顶栏余额立即加回);不单独出一句 Agent 回复。",
      "所有生成结算完(录制版在配音生成完时)停下来,下方出提问卡:标题「Shot {n} didn't generate. How should I continue?」,五个选项 + Other(推荐项排第一):",
      "① Retry shot {n}(Recommended)—「Generate it again · 50 credits」:查余额后扣 50,只重跑这一镜(网格只有这一张卡),好了接着剪(剪切 → 拼接 → 字幕 → 混音 → 检查),出成片。",
      "② Try another model —「Generate it with Seedance 2.0 Fast · 50 credits」:同样扣 50、只重跑这一镜,换用 Seedance 2.0 Fast;成片的 Models, voice & credits 和 View prompt 里这一镜写 Seedance 2.0 Fast。",
      "③ Animate a product photo —「Pan and zoom over your product image · no credits」:这一镜换成产品图的静帧 + 慢推镜(和用素材一样不扣积分),时长、台词、字卡不变,直接剪成片(只有进度行、没有卡)。只有素材里有产品图(图片素材,且不是品牌 logo / 风格参考)时才出现;录制版的 images.jpeg 就是产品图。",
      "④ Use your footage instead —「Fill this beat with your closest matching clip · no credits」:换成一段可用素材(优先没用过、角色对得上的片段,没有就重复用),不扣积分,直接剪成片。没有可用视频素材时这一项不出现。",
      "⑤ Cut it from the ad —「Make the ad without this beat · the ad gets {s}s shorter」:去掉这一镜,不扣积分,直接剪成片,成片变短。",
      "Other:写一句话 = 当作改稿要求(和在输入框里说一样),基于这一轮的分镜重排出新方案卡;这一轮放弃,没用上的基础费 40 退回。提问卡没答时在输入框发话也按 Other 处理。",
      "Skip = 选推荐项;Submit / ⌘↵ 提交。答完提问卡收成一张「题目 / 答案」小卡(如「Retry shot 3 (Recommended)」),Agent 回一句接下来做什么(中文回复跟语言),然后出续跑的网格。",
      "多个镜头失败时只问一次:标题「Shots {a} and {b} didn't generate. How should I continue?」,选项变复数(Retry shots {a} and {b} / Animate product photos / Cut them from the ad…),费用 50 × 镜头数;原因混着时只要有一个是审核没过,就按第 18 步那一套问(原样重试对它没用)。",
      "原型:评审这一步让第 2 个 AI 补拍(录制为第 3 镜)失败,停在提问卡上可以直接点选看各条路;余额 35,600 − 220 + 50 = 35,430。",
      "原型:「生成失败(Agent)」选「镜头·繁忙」时,其他 Agent 步骤里同样让这一镜第一次生成失败,重试一定成功;补拍切到 0 时没有可失败的镜头,本步显示正常成片。",
    ],
    edges: [
      "同一镜只退一次款,不会因为停止或重复回调重复退。",
      "生成还没结算完时点 Stop:按第 10 步退款,不会再出提问卡。",
      "等回答期间不在生成中:Stop 不出现,输入框可用(发话 = Other)。",
      "要扣费的选项(Retry / Try another model)余额不够 → 积分不足横条,提问卡留着不扣费(第 16 步)。",
      "重试的那一镜如果又失败,同样停下来再问一次;不自动重试。",
      "同一轮镜头和配音都失败时先问镜头;镜头那条路走完(重跑结算完,或选了不生成的选项)后再停下来问配音(第 20 步),不会两张提问卡同时出现。",
    ],
    errors: [
      "单镜临时故障 → 失败卡 + 原因 + 退 50 积分 → 提问卡五选一 → 续跑出成片;续跑中也可以点 Stop,按第 10 步规则退款。",
    ],
    copy: [
      "The video model is busy right now.",
      "Shot {n} didn't generate. How should I continue? / Shots {a} and {b} didn't generate. How should I continue?",
      "Retry shot {n} (Recommended) / Generate it again · {cost} credits",
      "Try another model / Generate it with Seedance 2.0 Fast · {cost} credits",
      "Animate a product photo / Pan and zoom over your product image · no credits",
      "Use your footage instead / Fill this beat with your closest matching clip · no credits",
      "Cut it from the ad / Make the ad without this beat · the ad gets {s}s shorter",
      "Other / Skip / Submit",
      "Retrying shot {n}, then I'll finish the edit. / Retrying shot {n} with Seedance 2.0 Fast, then I'll finish the edit. / Animating your product photo for shot {n} and finishing the edit. / Filling shot {n} with your footage and finishing the edit. / Cutting shot {n} from the ad and finishing the edit.",
      "重新生成第 {n} 镜,好了接着剪。/ 第 {n} 镜换 Seedance 2.0 Fast 重新生成,好了接着剪。/ 第 {n} 镜换成产品图的动态镜头,接着剪。/ 第 {n} 镜换成你的素材,接着剪。/ 去掉第 {n} 镜,接着剪。(中文回复)",
      "Regenerated shot {n}",
    ],
    open: ["待定:各视频模型是否不同价(目前 Seedance 2.5 和 2.0 Fast 都按每镜 50 积分,退款也按 50)。"],
  },

  /* ───────── 18 镜头审核未过 ───────── */
  genModeration: {
    what: [
      "AI 补拍镜头被审核拦下(参考图可能敏感、出现真人脸、品牌 IP 等):原样重试没用,所以选项和临时故障不同,推荐项是「AI 改写 prompt 再重试」(异常处理 spec 第 1 条)。",
      "失败卡同第 17 步样式,红字原因换成「The reference image may contain sensitive content.」;卡上的 Retry = 提问卡的推荐项(改写 prompt),点了直接出改写卡(第 19 步)。",
    ],
    rules: [
      "失败时退回这一镜 50 积分;生成结算完停下来出提问卡,标题同第 17 步「Shot {n} didn't generate. How should I continue?」,选项:",
      "① Rewrite the prompt and retry(Recommended)—「I'll soften what may have tripped the check and show you first」:不扣费、不开跑;Agent 回一句说去掉了什么,下面出改写卡(新旧 prompt 对照),等用户点 Generate 才扣 50 重跑,见第 19 步。",
      "② Use a different reference —「Pick another image, or generate without one · 50 credits」:查余额、扣 50,这一镜不带参考图(和尾帧)重跑,好了接着剪。原型里不弹选图,直接按「不用参考图」处理。",
      "③ Animate a product photo / ④ Use your footage instead / ⑤ Cut it from the ad:与第 17 步相同(不扣积分,直接剪);产品图、可用素材不存在时对应项不出现。",
      "Other / Skip / 在输入框发话:与第 17 步相同(Skip = 推荐项,即改写)。",
      "原型:评审这一步让第 2 个 AI 补拍(录制为第 3 镜)审核未过,停在提问卡上;余额 35,430。「生成失败(Agent)」选「镜头·审核」时其他 Agent 步骤同样触发。",
    ],
    edges: [
      "多个镜头失败、原因混着(有繁忙也有审核)时按这一套问;改写会一次改写所有失败镜头的 prompt,一张改写卡里逐镜列出。",
      "换参考图重跑后如果还是被拦,同样停下来再问一次。",
      "补拍切到 0 时没有可失败的镜头,本步显示正常成片。",
    ],
    errors: [
      "审核未过 → 失败卡 + 原因 + 退 50 → 提问卡:改写(先看后扣)/ 换参考图(扣 50)/ 产品图 / 素材 / 删掉 / Other → 续跑出成片。",
      "Use a different reference 余额不够 → 积分不足横条,提问卡留着(第 16 步);选改写本身不扣费,不会被拦。",
    ],
    copy: [
      "The reference image may contain sensitive content.",
      "Rewrite the prompt and retry (Recommended) / I'll soften what may have tripped the check and show you first",
      "Rewrite the prompts and retry(多镜)",
      "Use a different reference / Pick another image, or generate without one · {cost} credits",
      "Retrying shot {n} without the reference image, then I'll finish the edit.",
      "第 {n} 镜不带参考图重新生成,好了接着剪。(中文回复)",
    ],
    open: ["待定:「Use a different reference」真实产品里是弹素材选图(从已上传图片里换一张)还是直接去掉参考图;原型按去掉处理。"],
  },

  /* ───────── 19 改写 prompt 确认 ───────── */
  genRewrite: {
    what: [
      "在第 18 步选了「Rewrite the prompt and retry」:Agent 先改写、先给用户看,用户点 Generate 才扣费重跑 —— 不在用户没看过的情况下花积分(异常处理 spec 第 1 条)。",
      "Agent 回一句「I removed {X} and {Y} that may have tripped the check. Here's the new prompt for shot {n}:」(中文回复为「我去掉了可能触发审核的{X}和{Y}。第 {n} 镜的新 prompt:」),下面是改写卡。",
    ],
    rules: [
      "改写卡:标题「Shot {n} · New prompt」;「Before」是原 prompt(等宽字体、灰色删除线,最高约 5 行可滚动)→ 箭头 →「After」是新 prompt(等宽字体、浅橙底)。",
      "改写规则(原型里是确定的规则,不调模型):去掉参考图引用(@Image n 那句,也不再带参考图生成);人脸特写改成手部 / 去掉表情描写;品牌 logo 改成干净的产品定格画面;末尾加一句「No identifiable faces, no brand logos or trademarks.」(中文 prompt 为「画面中不出现可识别的人脸、品牌 logo 或商标。」)。Agent 那句里的 {X}{Y} 就是实际去掉的几类(the reference image / the close-up of a face / the brand logo)。",
      "Edit prompt:「After」就地变成可编辑的文本框(橙色描边),改完直接点 Generate;不改也可以直接 Generate。文本框清空时 Generate 置灰。",
      "Generate · 50 credits:查余额、扣 50,用新 prompt(含用户改过的)只重跑这一镜,Agent 回一句「Generating shot {n} with the new prompt, then I'll finish the edit.」,出续跑网格,好了接着剪出成片;成片 View prompt 里这一镜是新 prompt。",
      "点过 Generate 后改写卡留在对话里作记录,按钮收起,右下角显示灰字「Generated」。",
      "原型:评审这一步停在改写卡上等 Generate;余额 35,430(改写本身不扣费)。",
    ],
    edges: [
      "多个镜头一起改写时,一张卡里逐镜列出(每镜一组 Before / After),Generate 的费用 = 50 × 镜头数。",
      "改写卡等着点 Generate 时不在生成中:Stop 不出现,输入框可用;这时在输入框发话 = 放弃这一轮,按改稿处理(基于这一轮的分镜重排),没用上的基础费 40 退回,改写卡右下角变成「Not used」,不能再点。",
      "请求中或生成中 Edit prompt / Generate 置灰。",
      "新 prompt 重跑后如果还是被拦,同样停下来再问一次(第 18 步)。",
    ],
    errors: [
      "Generate 时余额不够 → 积分不足横条,改写卡留着不扣费(第 16 步)。",
    ],
    copy: [
      "I removed {X} and {Y} that may have tripped the check. Here's the new prompt for shot {n}:",
      "我去掉了可能触发审核的{X}和{Y}。第 {n} 镜的新 prompt:(中文回复)",
      "Shot {n} · New prompt / Before / After",
      "Edit prompt / Generate · {cost} credits / Generated / Not used",
      "No identifiable faces, no brand logos or trademarks.",
      "Generating shot {n} with the new prompt, then I'll finish the edit.",
      "用新 prompt 重新生成第 {n} 镜,好了接着剪。(中文回复)",
    ],
    open: ["待定:真实产品里改写由模型完成(按审核返回的原因改),改写质量和「改了什么」的说明要等接入后再定;原型是固定规则。"],
  },

  /* ───────── 20 配音生成失败 ───────── */
  genVoiceFailed: {
    what: [
      "整条旁白配音没生成出来:思路同补拍失败 —— 不自动重试,退回配音积分,结算完停下来问(异常处理 spec 第 2 条)。",
      "网格里的配音卡变成浅粉底 + 红字原因 + 下划线「Retry」(和停止卡同一样式);Retry = 提问卡的推荐项。原因两类:服务繁忙「The voice service is busy right now.」;旁白稿含可能触发审核的词「The script may contain restricted words.」。",
    ],
    rules: [
      "配音失败时退回配音积分(5 × 句数,录制版 30),顶栏余额立即加回;所有生成结算完停下来,出提问卡「The voiceover didn't generate. How should I continue?」:",
      "繁忙:① Retry the voiceover(Recommended)—「Generate it again · 30 credits」:查余额、扣 30,只重做配音(网格只有一张配音卡),好了接着剪。",
      "敏感词:① Rewrite the script and retry(Recommended)—「I'll swap out words that may have tripped the check and show you first」:不扣费;Agent 回一句「I swapped out “{a}” and “{b}” that may have tripped the check. Here's the new script:」,下面是改写卡「Voiceover · New script」(Before / After,可 Edit script),点 Generate · 30 credits 才扣费、用新稿重做配音再剪;成片字幕跟着换成新稿。",
      "② Try another voice —「{另一个音色} · same cost」:换一个同语言、同性别优先的音色(如 Aria → Nova、Xiaoyu → Chen),扣同样的积分,只重做配音;成片 Models, voice & credits 写新音色。",
      "③ Skip the voiceover —「Subtitles and music only · no credits」:这次不要配音,台词照旧作为字幕显示,配音积分已在失败时退回,不再扣;直接剪成片,成片里没有配音那一行。",
      "Other / Skip / 在输入框发话:与第 17 步相同。",
      "原型:评审这一步让配音「繁忙」失败,停在提问卡上;「生成失败(Agent)」选「配音·敏感词」时本步换成敏感词那一套。余额 35,600 − 220 + 30 = 35,410。",
    ],
    edges: [
      "旁白关掉(没有配音)时不会失败,本步显示正常成片。",
      "改写旁白稿的规则(原型是固定词表):绝对化 / 夸大功效的说法换成稳妥的,如 perfect、impossible、1 full serum bottle、爆皮、超、顶1瓶精华、专属限时;Edit script 时一行一句,行数少了的句子保留原句。",
      "同一轮镜头也失败时先问镜头,配音这一问排在后面(见第 17 步)。",
      "要扣费的选项余额不够 → 积分不足横条,提问卡 / 改写卡留着(第 16 步)。",
    ],
    errors: [
      "配音失败 → 配音卡红字原因 + 退配音积分 → 提问卡:重做 / 改写稿(先看后扣)/ 换音色 / 不要配音 / Other → 续跑出成片;续跑中可以 Stop,按第 10 步退。",
    ],
    copy: [
      "The voice service is busy right now.",
      "The script may contain restricted words.",
      "The voiceover didn't generate. How should I continue?",
      "Retry the voiceover (Recommended) / Generate it again · {cost} credits",
      "Rewrite the script and retry (Recommended) / I'll swap out words that may have tripped the check and show you first",
      "Try another voice / {voice} · same cost",
      "Skip the voiceover / Subtitles and music only · no credits",
      "I swapped out “{a}” and “{b}” that may have tripped the check. Here's the new script:",
      "Voiceover · New script / Edit script / Generate · {cost} credits",
      "Retrying the voiceover, then I'll finish the edit. / Redoing the voiceover with {voice}, then I'll finish the edit. / Skipping the voiceover and finishing the edit with subtitles and music. / Redoing the voiceover with the new script, then I'll finish the edit.",
      "重新生成配音,好了接着剪。/ 换成 {voice} 重新配音,好了接着剪。/ 这次不要配音,用字幕和音乐接着剪。/ 用新旁白稿重新配音,好了接着剪。(中文回复)",
      "Regenerated the voiceover",
    ],
    open: ["待定:「Skip the voiceover」的说明 spec 写的是「· refund」,原型写「· no credits」—— 配音积分在失败时已经退了,选它不会再退一次;如要强调退款可改文案。"],
  },

  /* ───────── 21 剪辑失败 ───────── */
  editFailed: {
    what: [
      "所有生成(补拍 + 配音)都成功了,Agent 自己剪片(剪实拍 → 拼接 → 字幕 → 混音 → 检查)时失败:已生成的镜头和配音都保留、不重扣,先退回 40 基础费,问用户重剪还是进画布自己剪(异常处理 spec 第 8 条)。",
      "这一屏:生成网格三张补拍卡、配音卡都是好的,进度行停在红字「Couldn't finish the edit.」;下面 Agent 一句「I couldn't finish the edit — your shots and voiceover are safe. 40 credits refunded.」,再下面是提问卡。",
    ],
    rules: [
      "失败时退回 40 基础费(顶栏余额立即加回),Agent 那一句跟回复语言(中文:「剪辑没完成 —— 已生成的镜头和配音都还在。退回 40 积分。」);没有补拍时说「your voiceover is safe」,没有配音时说「your shots are safe」,都没有时说「your footage is safe」。",
      "提问卡「The edit didn't finish. How should I continue?」单选,交互同第 4 步:",
      "① Retry the edit(Recommended)—「Re-cut with what's already generated · 40 credits」:查余额、扣 40,不重新生成任何镜头和配音,只重跑剪辑(网格没有卡,只有进度行),跑完出成片;成片 Models, voice & credits 和没失败时一样(合计 220)。",
      "② Open in canvas —「Everything is on the canvas to edit yourself」:不扣费,带着这一轮的分镜和当前余额进画布(剪辑器第 1 步),已生成的镜头和配音都在画布上,用户自己剪、自己导出。",
      "Other:写一句话 = 改稿要求,基于这一轮的分镜重排出新方案卡(基础费失败时已退,这里不再退);提问卡没答时在输入框发话同样按 Other 处理。Skip = 推荐项(重剪)。",
      "答完提问卡收成「题目 / 答案」小卡;选重剪时 Agent 回一句「Re-cutting the reel with what's already generated.」(中文:「用已生成的镜头和配音重新剪。」)。",
      "原型:评审这一步让第一轮剪到拼接那一步失败(剪实拍 1.5 秒、拼接 2 秒之后),停在提问卡上;余额 35,600 − 220 + 40 = 35,420,重剪后 35,380。「剪辑失败」开关打开时其他 Agent 步骤里第一次走到剪辑同样失败(第 9 步实时看、第 11 步预置为重剪后出片)。",
    ],
    edges: [
      "同一轮基础费只退一次;重剪那一轮如果又失败,同样退 40 再问一次,不自动重试。",
      "有补拍 / 配音失败时不会走到剪辑:先按第 17–20 步问完、续跑结算完,第一次走到剪辑的那一轮才可能剪辑失败。",
      "等回答期间不在生成中:Stop 不出现,输入框可用;重剪那一轮在跑时可以 Stop,退 40(第 10 步)。",
      "排队的话(第 9 步)留着,出片后一起合并改稿;选 Other 时和这句一起当改稿。",
    ],
    errors: [
      "重剪时余额不够 → 积分不足横条,提问卡留着不扣费(第 16 步);进画布不扣费,不会被拦。",
      "剪辑失败 → 退 40 → 重剪(扣 40)/ 进画布 / Other → 出成片或进画布。",
    ],
    copy: [
      "Couldn't finish the edit.",
      "I couldn't finish the edit — your shots and voiceover are safe. {n} credits refunded.",
      "剪辑没完成 —— 已生成的镜头和配音都还在。退回 {n} 积分。(中文回复)",
      "The edit didn't finish. How should I continue?",
      "Retry the edit (Recommended) / Re-cut with what's already generated · {n} credits",
      "Open in canvas / Everything is on the canvas to edit yourself",
      "Other / Skip / Submit",
      "Re-cutting the reel with what's already generated. / 用已生成的镜头和配音重新剪。(中文回复)",
    ],
    open: ["待定:真实产品里剪辑失败的原因(ffmpeg 报错、素材解码失败、渲染超时)要不要分开说、能不能自动换参数重试一次;原型统一按「没剪完」处理、不自动重试。"],
  },

  /* ───────── 22 视频加载失败 ───────── */
  failVideo: {
    what: ["成片视频加载失败:卡片换成灰底「Couldn't load the video」+ Retry(§4)。"],
    rules: [
      "视频元素报错即进入失败态,整张卡(含右上按钮和控制条)被替换。",
      "点 Retry 恢复成视频卡并重新加载同一个地址。",
      "卡片下方的交付说明、分镜、积分、需确认事项照常显示。",
      "原型:评审这一步故意传了一个不存在的视频地址;「视频加载失败」开关在第 11 步也能触发。",
    ],
    edges: [
      "失败态下没有下载、重新生成、剪辑入口;要重新生成可在输入框改稿或回到分镜卡。",
      "加载失败不退积分,成片在服务端已经生成。",
    ],
    errors: ["加载失败 → Couldn't load the video + Retry → Retry 重载同一地址;地址本身坏了会立刻再次失败。"],
    copy: ["Couldn't load the video", "Retry"],
  },

  /* ───────── 23 未答题先发消息 ───────── */
  answerFirst: {
    what: ["提问卡还没提交就在输入框发消息:不排分镜,Agent 回一句提示让用户先在卡片里选(§2.3)。"],
    rules: [
      "用户这句照常显示为气泡,但内容被丢弃,不会写进 brief 或 notes,也不会被当成答题。",
      "提问卡保留在原位,仍可正常作答并点 Submit。",
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

  /* ───────── 24 消息发送失败 ───────── */
  sendFailed: {
    what: [
      "网络断了时用户在对话输入框发的话没发出去:这句留在对话里(不会丢),气泡变淡,下面一行红字「Not sent」+ Retry;Agent 不处理这条(异常处理 spec 第 19 条)。",
      "原型:评审这一步预置在第 6 步方案之后,用户发的是录制改稿那句;打开「发送失败」开关后,任意 Agent 步骤里发的第一条消息都会失败。",
    ],
    rules: [
      "判断:浏览器报离线(navigator.onLine = false)时直接标失败,不发请求;真实产品里请求失败 / 超时也走这一态。",
      "点 Retry:失败那条移走,按正常发送再走一遍(改稿 / 排队 / 回答提问卡,规则同直接发送);仍离线时点了不动。",
      "失败的消息不进改稿、不进排队、不算答题。",
    ],
    edges: [
      "可以连续发多条失败的消息,每条各自 Retry,按点的顺序处理。",
      "失败期间可以照常点卡片上的按钮(Confirm 等);那些操作有自己的报错处理。",
      "刷新页面后失败的消息不保留(会话持久化本期不做)。",
    ],
    errors: ["发送失败 → 气泡变淡 + Not sent + Retry → 网络恢复后点 Retry 重发。"],
    copy: ["Not sent", "Retry"],
  },

  /* ───────── 25 空态 ───────── */
  empty: {
    what: ["直接打开对话页(没带素材):提示回落地页重来(§4)。"],
    rules: [
      "整屏只有一句提示和 Go to home 链接,不显示侧栏、顶栏和输入框。",
      "点 Go to home 回到落地页 /prototypes/hybrid-reel-agent。",
    ],
    edges: [
      "素材只在内存里交接、取一次即清空,所以刷新对话页、浏览器后退再前进、复制链接在新标签打开都会落到空态。",
      "会话持久化本期原型不做(§3、§6):分析或生成中途刷新会丢掉整段对话。真实产品里生成在后台继续,从 History 回到对话能看到进度,完成后 History 出红点并发邮件(异常处理 spec 第 3 条,见第 9 步)。",
    ],
    errors: [],
    copy: ["Start from the home page to add your footage.", "Go to home"],
  },
  ...EDITOR_NOTES,
};
