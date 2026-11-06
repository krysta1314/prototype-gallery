// 评审原型下方白底区的 PM 式交互说明(中文):按「主页 / 画布」各一套，每节 = 功能说明 / 交互规则 / 异常情况。
// 依据 spec docs/superpowers/specs/2026-11-04-video-gen-modes-design.md;界面文案(英文)用引号原样写出。

export type ReviewView = "home" | "canvas";
export type NoteSection = { title: string; what: string; rules: string[]; errors?: string[] };

export const VIEW_LABEL: Record<ReviewView, string> = { home: "主页", canvas: "画布" };

export const NOTES: Record<ReviewView, NoteSection[]> = {
  home: [
    {
      title: "Creation type 与两种入口",
      what: "首页输入框底栏的「Creation type」下拉有 Marketing Agent / Image Gen / Video Gen / Audio Gen 四种。本需求只动其中两种：选 Video Gen 时输入框变成「先选模型、再选模式」的视频输入框;选 Marketing Agent 时输入框不加模式控件，由 agent 自己判断用哪个模式。",
      rules: [
        "Image Gen(2026-11-05 加):输入框照真实产品——左上「+」上传参考图，提示词，底栏 Image Gen / 图片模型(GPT-image-2 默认，另有 GPT Image 2.5 Sunburst、Nano Banana 2、Seedream 5.0 Pro)/ 条数 / 积分 / Create;点 Create 只弹 toast。侧边栏 Image 里带「✦ Agent」标签的项(Text to Image、Image Edit、Remove Background、Product Photography、Relight、Image Face Swap)都进 Image Gen 并预填提示词，选中第一个 [占位];侧边栏亮 Home。视频类进 Video Gen,音频类(Background Music、Sound Effects)仍进 Marketing Agent。",
        "首页大标题跟着 Creation type 换(2026-11-05 定稿):Marketing Agent「Your ideas, / campaign-ready in seconds」;Image Gen「Ad-ready product shots, / no photoshoot needed」;Video Gen「Ad-ready video clips, / with sound, from one prompt」;Audio Gen「Voiceovers, music and SFX, / no recording studio needed」。(Audio Gen 本原型没做，只出 toast)",
        "打开下拉 → 左列四种类型，悬停哪种右侧就讲哪种(介绍 / Key features / How to use),照真实产品。",
        "本原型默认停在 Video Gen;Image Gen、Audio Gen 不在本需求范围，选了出 toast「Coming soon in this prototype」(原型行为)。",
        "标题跟着类型换(产品定稿文案):Marketing Agent 是「Marketing Agent: Your ideas, campaign-ready in seconds」;Image Gen 是「Image Gen: Ad-ready product shots, no photoshoot needed」;Video Gen 是「Video Gen: Ad-ready video clips, with sound, from one prompt」。",
      ],
    },
    {
      title: "Video Gen 底栏：先选模型，再选模式",
      what: "输入框最上面一排是模式标签(本需求新增，参考即梦：Omni Reference / First & Last Frame / Edit Video …),只列当前模型 API 支持的模式，所以用户选不出不支持的组合;标签是分段控件样式(灰色轨道里，选中的是白色浮起块、深色加粗字);每个标签名后面有个小 ⓘ,点击 ⓘ 弹出这个模式的一句说明(不做悬停弹出，免得鼠标划过标签时闪)(如 Edit Video「Change what's in an existing video」),点外面或 Esc 关闭;点标签名才是切模式。不做悬停 tooltip,免得点标签时被说明挡住。底栏照真实产品：从左到右 Creation type、模型按钮、生成条数「1」、(Kling 才有的)Multi-shot,右边是预计积分和「Create」。点模型按钮弹出「Model Settings」:Model 下拉(按公司分组:ByteDance、Kuaishou、Alibaba、Google、MiniMax、ShengShu、xAI、Black Forest Labs)、Aspect Ratio、Duration、Resolution,支持的模型还有「With Audio」No / Yes;再往下是按 fal API 补齐的模型专属设置(2026-11-05 逐端点核对):Wan「Thinking」(放了网页 / 文档时锁定为 Yes,写明原因)、「Prompt Enhance」、「Smart Duration」(开了 Duration 显示由模型决定);MiniMax「Prompt Enhance」Off / Balanced / Quality,延长多「Output」Full video / New part only、分辨率到 2K;Kling 3.0 Omni 分辨率 720p / 1080p / 4K(对应 standard / pro / 4k 端点)、编辑「Keep Original Audio」;FLUX 比例多 2:1、延长可 Smart Duration;Seedance 全系「Smart Duration」(duration -1),Seedance 2.5 还有「Draft First」(打开后分辨率锁 480p)和「File Format」MP4 / MOV。First & Last Frame 放了首帧(或尾帧)后，图生不收比例的模型(Seedance 2.5、Kling 3.0 / 3.0 Omni / 4.0、Vidu、Grok、MiniMax)比例锁成「Follows your first frame」。Gemini Omni Flash 在英国编辑或延长上传的视频都会拦下，提示改用本站生成的视频。每项名字后面一个 ⓘ,点击弹出一句说明(和模式标签一样不做悬停);被锁住时(如 Wan 放了文档)名字下方用橙色小字写原因。MiniMax H3 / H3 Max / H3 Max Turbo 的模式顺序是 Omni Reference → First & Last Frame → Keyframes → Extend Video → 专项模式(默认打开 Omni Reference)。设置多时弹层在屏幕内滚动，不显示滚动条。换模型后标签跟着换成新模型支持的模式。",
      rules: [
        "点「Create」→ 顶部 toast「Your video is generating」(选了多条时「N videos are generating」)。点 Create 之后的交互(生成中、结果卡、继续做)不在本需求范围，原型不演示。",
        "演示用(真实产品没有):Video Gen 输入框下面按公司分组(深色标签写公司名和模型数)摆出全部 16 个模型的输入框，不用切模型就能对照各自的模式标签、素材位和底栏;宽屏时每个输入框右边常显它的 Model Settings,切模式时跟着变(比例、时长、分辨率、额外参数);每个都能单独操作。",
        "Seedance 没有额外参数：接口里的 Smart Duration(duration = -1)、2.5 的 Draft(480p 草稿)和 MOV 输出，评审后都不做。",
        "模型 11 个，按系列排序：Seedance 2.5、Seedance 2.0 Mini、Seedance 2.0 Fast、Seedance 2.0(BytePlus)→ Kling 4.0(fal)、Kling 3.0(kie)→ Wan 3.0(fal)、Gemini Omni Flash(Google)、MiniMax H3 Max(fal)、MiniMax H3(fal)。每个模型下面一行灰字列出它支持的模式。Seedance 2.0 Mini / Fast 和 2.0 模式相同，只是分辨率只有 480p / 720p。",
        "生成模式一共 5 种：「Omni Reference」「First & Last Frame」「Keyframes」「Edit Video」「Extend Video」,外加 H3 Max 的「Camera Control」「Style Presets」(Motion Control 2026-11-05 改成独立工具页)。每项下面一句话说明。不放任何素材直接写提示词 = 文生视频，不单独算一种模式。",
        "各模型支持的模式(第一个是默认):Kling 4.0 = Omni Reference、First & Last Frame、Keyframes、Edit Video;Wan 3.0 = Omni Reference、First & Last Frame;Gemini Omni Flash = Omni Reference、First & Last Frame、Edit Video、Extend Video;MiniMax H3 Max = Omni Reference、First & Last Frame、Keyframes、Extend Video、Camera Control、Style Presets;MiniMax H3 = Omni Reference、First & Last Frame;Seedance 2.5 / 2.0 Mini / 2.0 Fast / 2.0 = Omni Reference、First & Last Frame、Edit Video、Extend Video;Kling 3.0 = First & Last Frame。",
        "Aspect Ratio:API 支持跟随素材比例的模型多一个「Auto」(Gemini Omni Flash、Kling 3.0 没有);Duration 是一排可横向滑动的秒数;「With Audio」只在 API 有开关的模型出现(Seedance、Wan 3.0、Kling 3.0)。「1」点开是「How many to generate」,1–8 两排格子，积分按条数相乘。",
        "换模型时当前模式新模型也支持 → 模式不变;不支持 → 切到新模型的默认模式，顶部 toast「Kling 3.0 doesn't support Omni Reference. Switched to First & Last Frame. Your references are kept.」原模式里的素材留着;之后换回支持它的模型，会自动切回原模式并 toast「Switched back to Omni Reference. Your references are back.」(用户中途自己选过模式就不自动切)。",
        "换模型时比例 / 分辨率 / 时长超出新模型范围 → 自动夹到最近的合法值(例 Seedance 2.5 选了 30s,换 Seedance 2.0 变 15s),不弹提示。",
        "每个模式记住自己的素材：切到别的模式再切回来，原来放的还在;不会把首帧悄悄变成参考图。",
        "Edit Video 时时长显示「Matches source」(跟原片一样长),比例显示「Auto」;Gemini Omni Flash 的 Duration 照现网是 4s / 6s / 8s / 10s 四档(Google API 本身没有时长参数，由接入层用提示词时间码实现);从别的模型切过来时，时长对齐到最近的一档。",
        "积分是按模型 × 时长 × 分辨率的示意数，不是定价规则。",
        "带参考视频的请求(Edit Video、Extend Video,以及放了参考视频的 Omni Reference)按参考视频时长计费：还没上传视频时积分显示 0,上传后按视频时长算出具体积分;悬停积分显示「Final cost depends on your reference video's length」。Seedance 按 token 计:(参考视频时长 + 输出时长)× 分辨率，带视频输入的单价比纯文本/图片低(BytePlus $6.40 vs $10.70 / 百万 token)。",
      ],
    },
    {
      title: "各模式的素材位",
      what: "素材格一排在上、提示词整行在下(所有模式一致，切模式时提示词位置不动);素材格跟着模式变形，MiniMax 的「Soundtrack」配乐格也在这一排(首尾帧后面竖线隔开),不再单独放到提示词下面;参考图格都和主素材格同一排;Kling 的主体(Element)格和素材格在同一排，用竖线隔开;Kling 的音色(Voice)格也在这一排(提示词要 @Voice1 引用);底栏顺序为 模型 → Multi-shot → 条数。点任一「+」格弹出和产品一样的菜单:「Local Upload」(选本地文件，视频 / 音频读真实时长)、「Assets」(素材库；原型里放的是内置示例，评审时方便演示超数量、超时长)、「Avatar Library」(数字人，只在能放图的格子里出现)。Omni Reference 默认只有一个灰色「+」格(现在产品里它在提示词左边，这次统一挪到上面),放了素材后缩略图排在「+」前面，下面出现计数。",
      rules: [
        "「Omni Reference」:一排参考素材，可以多选图 / 视频 / 音频，按上传顺序叫 Image1 / Video1 / Audio1,提示词里输入 @ 弹出这些名字可直接插入。不显示数量上限行;超出上限时多出的素材标红，并提示原因(如超过张数、Omni Flash 单段视频超过 3 秒)。Gemini Omni Flash 和 Kling 4.0 不收音频(选择器里不出现音频)。",
        "Kling 4.0 的「Omni Reference」多两样:素材格同一排的「Element」格(选一组图：第一张是正面，后面最多 3 张多角度，合成一个角色 / 物体，提示词里用 @Element1)和同一排的「Voice」格(竖线隔开)：点开就是产品现有的「Select or add a voice」弹窗(同 Audio 生成：Preset Voice 右上角 Gender / Language / Style 三个筛选、可试听，已选的音色卡片打勾;My Voice 是自己克隆的音色;Clone voice 上传录音克隆;Clone voice 右边是「Voice model」下拉选克隆模型：Kling(给 Kling 视频用，录音 5–30 秒)或 Seed Audio(给 Audio Gen 配音用)。两家克隆出来的音色 ID 不通用，所以 My Voice 卡片上标出克隆模型，在 Kling 视频里打开时默认选 Kling,用 Seed Audio 克隆的音色置灰、不可选，右上角一个 ⓘ,点开说明「Cloned with Seed Audio, so it can't be used here. Clone it again with Kling to use it.」)。选好的音色在「Voice」格前面显示成同样大小的格子(浅橙底 + 声波图标 + 名字),悬停 ✕ 移除;按选择顺序对应提示词里的 @Voice1、@Voice2,输入 @ 时和 Image1、Element1 一起出现;满 3 个后「Voice」格消失。技术上：每个音色对应一个 Kling voice_id(用 fal create-voice 把样音转成 id,预置音色由我们提前生成并存库，试听播放的就是那段样音)。",
        "「First & Last Frame」:「Start frame ⇄ End frame」两个大格，中间按钮交换两张图。只放首帧 = 首帧生成;只放尾帧只有 Kling 4.0、MiniMax H3、MiniMax H3 Max 支持(格子里只写「Start」「End」,悬停显示「End frame (optional)」这类完整说明)。Kling 3.0 下方多一行「Elements」(最多 3 个，每个 2–4 张图);MiniMax H3 / H3 Max 下方多一行「Soundtrack」:放进去的音频直接成为成片音轨。",
        "「Keyframes」:Start — 中间帧 — End 排成一行。格子里写「Start」「Middle」「End」。Kling 4.0 中间帧最多 8 张(悬停「Middle」格显示已放张数，如「Add keyframes (2/8)」);MiniMax H3 Max 只有 1 张中间帧，旁边「Middle at __ s」填它出现在第几秒，且分辨率只能 480p / 768p。两者都可以再加参考图：「Reference」格跟在 End 后面，同一排、竖线隔开(不单独一行)。",
        "「Edit Video」/「Extend Video」:一个上传格(「+」+「Edit video」/「Extend video」,悬停显示时长上限)。Edit 的参考图和原片排在同一排(照即梦),放进来的参考图排在「+ Reference」前面;Seedance 2.5 的 Extend 能往前或往后接，不单独给开关，写在提示词里(占位文案「Describe what happens before or after the video」);上传格旁边不写「Adds up to …s at the end」这类说明，延长秒数在 Model Settings 的 Duration 里选。",
        "「Multi-shot」(Kling 4.0 / 3.0):打开后提示词框变成分镜列表，每段一句提示词 + 秒数，可加段、删段、拖动排序;时长显示各段之和。Kling 4.0 每段 1–30s、总 3–30s;Kling 3.0 最多 5 段、每段 1–12s、总 3–15s,且分镜时只能用首帧(放了尾帧会提示移除)。",
        "所有上传 / 添加格统一用「+」图标(下面写格子用途，如 Start / Element / Voice);素材悬停出现 ✕ 可移除;视频 / 音频缩略图上不叠时长角标，悬停显示文件名和时长;放进来的生成结果左上角标「Generated」。",
      ],
      errors: [
        "超数量 / 超时长：超出的素材标红框(格子上不写字),不自动删除;素材位下方红色提示第一条原因(例「Seedance 2.0 takes up to 9 images. Remove 3 to continue.」),「Create」置灰。换模型导致超限同样处理。",
        "MiniMax 合计上限：图、视频、音频加起来最多 12 个(「MiniMax H3 takes up to 12 files in total. Remove 1 to continue.」)。",
        "换到不支持的模型后，之前放的 Elements、Voices、Soundtrack 不会消失：那一行照样显示，素材标红，提示例「Seedance 2.5 doesn't support elements. Remove them to continue.」「Seedance 2.5 can't use a soundtrack. Remove it to continue.」,「Create」置灰。",
        "只放音频：Seedance 2.0、Wan 3.0 不行 →「Add at least one image or video — Seedance 2.0 can't use audio on its own.」;Seedance 2.5、MiniMax 可以。",
        "首帧必填的模型(Seedance、Kling 3.0、Wan 3.0、Gemini Omni Flash)只放尾帧 →「Add a start frame — Wan 3.0 can't start from an end frame only.」",
        "Keyframes 有中间帧但缺首帧或尾帧 →「Add a start and an end frame to use keyframes.」;H3 Max 中间帧时间不在 0 和时长之间 →「Set the middle frame between 0s and 6s.」",
        "还没放必填素材(Edit / Extend 的原片)不算错误：不出红色提示，只是「Create」置灰;原片太长才提示，例「Gemini Omni Flash can edit videos up to 10s.」",
        "Multi-shot 总时长越界 →「Shots add up to 18s. Kling 3.0 supports 3–15s.」;动作视频超朝向上限 →「Motion videos can be up to 10s when facing like the image.」;朝向改成跟图片但放了主体 →「Face elements only work when facing like the video.」",
        "克隆音色的录音不在 5–30 秒(Kling create-voice 的要求)→ 克隆失败，提示「Voice samples need to be 5–30 seconds of clear speech.」",
        "英国 / EEA / 瑞士用户用 Gemini Omni Flash 延长「上传的」视频 →「Extending uploaded videos isn't available in your region. Try a video generated here.」;延长本产品生成的视频不受限。",
      ],
    },
    {
      title: "专项能力模式(运镜、风格)",
      what: "MiniMax H3 Max 在 4 个生成模式之外，还有两个生成类专项模式：「Camera Control」和「Style Presets」(都还是图生 / 文生视频，只是多了运镜或风格选项)。2026-11-05 起，加工现成素材的能力(Talking Avatar、Lip Sync、Reframe、Relight、Recast、3D to Video、Motion Control;Insert Shot 评审后去掉，剪辑器里就能做)不再是 Video Gen 的模式，改成侧边栏里的独立工具页(照 Upscale Image 的交互，见 ai-tools 原型):模式栏只剩 6 个标签，不再需要横向滑很久。",
      rules: [
        "素材格照其他模式：56×56、「+」+ 文字;设置项都在 Model Settings 里(不占输入框)。",
        "「Camera Control」:一张 Start frame,Model Settings 选 Camera Move(Dolly in / Truck left / Pan / Tilt / Pedestal / Roll / S-curve forward 等 13 个),画面不动只动镜头;提示词选填。",
        "「Style Presets」:可选 Start frame;Model Settings 选 Style(VHS / Hand-drawn / Retro Toon 70s / 16-bit Pixel / Low Poly),VHS 多一个 Tape Damage;5–15 秒，768p;提示词必填。",
      ],
      errors: ["Style Presets 没写提示词：不出红条，只置灰 Create。"],
    },
    {
      title: "新加的模型",
      what: "模型列表共 18 个(按公司分组),按系列排：Seedance 2.5、Seedance 2.0 Mini、Seedance 2.0 Fast、Seedance 2.0 → Kling 4.0、Kling 3.0、Kling 3.0 Omni → Wan 3.0、Wan 3.0 Prime → Gemini Omni 1.2 Flash、Gemini Omni Flash → MiniMax H3 Max、MiniMax H3 Max Turbo、MiniMax H3 → Vidu Q3 Pro、Grok Imagine Video 1.5、FLUX 3 Video、FLUX 3 Max Video。快速版(Turbo / Prime)和 Seedance 2.0 Fast 一样单独成一个模型。只有一个加工模式的模型(Kling 3.0 Motion Control、Kling LipSync、Kling AI Avatar v2 Pro)2026-11-05 移出 Video Gen,只在对应工具页里用。",
      rules: [
        "Gemini Omni 1.2 Flash(gemini-omni-1.2-flash,2026-11-06 接入，排在 Gemini Omni Flash 上面):Omni Reference(参考图 ≤6 张;参考视频每段 ≤3 秒，成片 3–10 秒最多 3 段、11–15 秒只能 1 段)/ First & Last Frame(放了尾帧只能 3–10 秒)/ Edit Video、Extend Video(原片 ≤15 秒，上传视频在英国 / EEA / 瑞士不可用);时长 3–15 秒任选(默认 10 秒),16:9 / 9:16,360p / 720p / 1080p / 4K;不收音频，没有关声音开关。",
        "Kling 3.0 Omni(Kling O3):Omni Reference(图 ≤7、1 段参考视频、主体可绑音色)/ First & Last Frame / Edit Video(原片 3–15 秒);3–15 秒;没有分辨率选项;有 With Audio 和 Multi-shot(含智能分镜)。",
        "Wan 3.0 Prime:字段和 Wan 3.0 相同的快速版(Omni Reference、First & Last Frame,2–30 秒，480p–1080p,含 Auto 比例)。",
        "MiniMax H3 Max Turbo:H3 Max 的快速版，只有生成类模式(First & Last Frame、Keyframes、Omni Reference、Extend Video),专项能力没有 Turbo。",
        "Vidu Q3 Pro:Omni Reference 只收 1–4 张图;First & Last Frame 首帧必填，放了尾帧不能选 360p(提示「… can't make 360p videos with an end frame. Pick a higher resolution or remove the end frame.」);1–16 秒;360p / 540p / 720p / 1080p;有 With Audio。fal 上没有单独的 Pro 档，产品名照后台。",
        "Grok Imagine Video 1.5:Omni Reference 1–7 张图，分辨率只有 480p / 720p(切过去自动降到 720p);First & Last Frame 只有首帧(不显示尾帧格和交换按钮);1–15 秒;比例多 3:2 / 2:3;没有 With Audio。编辑 / 延长只有 v1,没接。",
        "FLUX 3 Video:没有参考图，模式是 First & Last Frame、Keyframes(中间帧最多 8 张)、Edit Video、Extend Video(原片都要 <15 秒);5–20 秒;720p / 1080p / 1440p / 2160p(1080p 以上为放大);含 Auto 比例。",
        "FLUX 3 Max Video(2026-11-05 加，和 FLUX 3 Video 并列，不替换):fal 只有文生 / 图生 / 关键帧三个端点，所以只有 First & Last Frame(尾帧选填，和首帧走同一个接口)、Keyframes;没有 Edit Video / Extend Video;5–20 秒;只有 720p / 1080p;含 Auto 比例;With Audio 默认开;Model Settings 多一项 Reasoning(High / Low,对应 reasoning_level,默认 High:想得更细但更慢)。",
      ],
      errors: ["换到只有首帧的模型(Grok)但放了尾帧 → 尾帧标红，提示「Grok Imagine Video 1.5 can't use an end frame. Remove it to continue.」"],
    },
    {
      title: "网页 / 文档生成视频(Wan 3.0)",
      what: "Wan 3.0 和 Wan 3.0 Prime 的「Omni Reference」素材行多一个「URL / Doc」格：点开后顶部切换「Web page / Document」,二选一：贴一个公开网页链接(如商品页)或上传一份文档(2026-11-05 在 fal 实测：网页和文档不能同时传，接口直接报错「file_url and web_url cannot be used together」)，模型先读内容再生成宣传视频(接口 web_url / file_url,自动开 thinking)。",
      rules: ["只能放一个来源;放好后显示成链接格(域名)或文档格，悬停 ✕ 移除。", "只能读不需要登录的公开网页。"],
      errors: ["换到不支持的模型 → 提示「… can't read web pages or documents. Remove it to continue.」"],
    },
    {
      title: "侧边栏工具(ai-tools 并入)",
      what: "侧边栏 Image / Video / Audio / Avatar 和 ai-tools 原型是同一套，工具页(Upscale Image,以及 2026-11-05 拆出来的 Motion Control、Video Character Swap、3D to Video、Lip Sync、Talking Avatar、Voice Clone)都能在这里打开，积分余额共用;Image 菜单除 Upscale Image 外都走 Agent:Resize & Expand、Product Photography、Remove Object 进 Marketing Agent,其余进首页 Image Gen,都预填简短提示词。",
      rules: [
        "加工类菜单项直接打开工具页(2026-11-05 从 Video Gen 模式拆出):Video › Motion Control、Video Character Swap、Insert Shot、3D to Video(Video Relight 2026-11-06 删除);Avatar › Lip Sync、Talking Avatar。Audio 菜单 4 项(含 Voice Clone)2026-11-06 起都进首页 Audio Gen,Voice Enhancer 菜单项 2026-11-06 删除。Video Reframe / Video Resize 2026-11-05 不做页面，走 Marketing Agent(agent 用 MiniMax H3 Max reframe-video)。",
        "生成类专项能力的菜单项回到首页 Video Gen,直接切到 MiniMax H3 Max 的对应模式，顶部 toast 写「Camera Control on MiniMax H3 Max」:Video › Camera Control →「Camera Control」;Video › Video Styles →「Style Presets」。",
        "通用模型的菜单项(Image to Video、Text to Video、URL to Video 等)照 ai-tools:回首页并预填提示词，视频类进 Video Gen,其余进 Marketing Agent。",
        "Video › Live Director 2026-11-05 删除(先不上),菜单里也去掉了。",
      ],
    },
    {
      title: "Marketing Agent:agent 自己选模式",
      what: "Marketing Agent 的输入框照现在(左边灰色「+」上传格;底栏 Manual、Web Explore、LLM 切换),不加模型 / 模式控件。点「Create」后进入对话:agent 先回一张「Video plan」卡，写明用哪个模型、哪个模式和理由，然后开始生成(顶部 toast「Your video is generating」;生成中和结果不在本需求范围，原型不演示)。",
      rules: [
        "模式判断(原型里用关键词 + 素材类型演示，真实产品由 agent 判断):有视频 + edit / replace / remove 一类说法 →「Edit Video」;有视频 + extend / continue →「Extend Video」;2 张图 + from…to / transform / turn into →「First & Last Frame」(第一张首帧、第二张尾帧);1 张图 + animate / bring to life →「First & Last Frame」(只放首帧);其他 →「Omni Reference」(所有文件当参考)。",
        "模型：默认 Seedance 2.5;Seedance 2.5 不支持这个模式就换第一个支持的(「Keyframes」→ Kling 4.0,「Camera Control」「Style Presets」→ MiniMax H3 Max)。",
        "卡片文案例：「Using First & Last Frame because you uploaded 2 images and asked to go from one to the other.」",
        "「Change」→ 卡片里展开模型 / 模式下拉(规则同 Video Gen),改模式时用对话里上传的原始文件重新放进新模式的素材位(不会变成空的文生视频);点「Regenerate」用新组合再生成一次(toast 提示),卡片文案改成「You picked Kling 4.0 with Keyframes.」。",
      ],
      errors: ["agent 选的组合校验不通过(例文件超过上限)→ 不生成，顶部 toast 写原因，用户可点「Change」换模型。"],
    },
  ],
  canvas: [
    {
      title: "视频生成节点",
      what: "画布上的「Video Generator」节点：空态写「No Video Generated / Configure settings and start generation」(和现在产品一致)。点选节点 → 橙色描边，节点正下方出现和 Video Gen 一模一样的输入框(和现在产品一样贴着节点，菜单往上开),每个节点有自己的模型、模式和素材。节点标题右侧写当前「模型 logo + 模型 · 模式」。",
      rules: [
        "输入框的底栏、素材位、校验、Multi-shot、换模型回退 + toast 规则全部同主页「Video Gen」。",
        "点右下圆形箭头 → 顶部 toast「Your video is generating」。生成中、结果、Extend / Edit / Use last frame 等后续交互不在本需求范围，原型不演示。",
        "演示用：画布一打开就给 16 个视频模型各放一个节点，一行一家公司，每家公司用一个分组框(Figma Section 样式，左上角深色标签写公司名和模型数:ByteDance、Kuaishou、Alibaba、Google、MiniMax、ShengShu、xAI、Black Forest Labs),每个节点下的输入框都展开，不用切模型就能对照;最上面是「Image」分组：图片节点和 Upscale 工具栏、参数浮层也都展开;顶部演示条「输入框 全部展开 / 只看选中」可切回产品行为(只有选中的节点显示输入框)。开发原型(/prototypes/video-gen-modes/canvas)同样全部展开。",
        "节点右侧橙色「+」→ 下一个空位新建一个空节点(沿用这个节点的模型)并用连线连起来;选中节点时右上角垃圾桶可删除。",
        "点画布空白处取消选中(只看选中时输入框收起);左上角 logo 回主页。",
        "说明：真实画布(hybrid-reel)正在做别的需求，本原型用一个轻量画布演示;研发把同一个输入框组件接进真实画布即可。",
      ],
    },
    {
      title: "Image 分组：图片节点 + Upscale",
      what: "画布最上面的「Image」分组(原 ai-tools 的 Upscale 画布并进来，两个原型共用这一个画布):图片节点 = 工具页「Open in canvas」带来的图，没有就用样图。",
      rules: [
        "选中图片节点 → 上方工具栏 Upscale / Download Image / Favorites / Delete;点 Upscale → 节点右侧 SeedVR 参数浮层(放大倍数或目标分辨率、格式、预计积分),和 Upscale Image 工具页同一套参数和计价。",
        "确认后右边新建一个「Upscaled Image」节点并用连线连上，标题右侧写输出尺寸;放大结果还能再放大。",
      ],
      errors: ["放大失败：节点里写「Upscale failed. Your credits have been refunded.」+「Retry」;安全检查拦截写「This image can't be processed.」。"],
    },
  ],
};
