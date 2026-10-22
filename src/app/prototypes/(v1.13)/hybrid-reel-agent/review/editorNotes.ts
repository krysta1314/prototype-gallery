/* 剪辑器评审步骤的中文说明(左栏「画布剪辑器」部分,单独从 1 编号:第 1 步进画布、第 2 步剪辑器引导,第 3–22 步),评审原型即需求文档。
   章节号指 docs/superpowers/specs/2026-09-29-hybrid-reel-edit-plan.md;2026-10-15 落地的待定项见 docs/superpowers/specs/2026-10-15-hybrid-reel-open-items-fix-design.md §1、§3。
   代码依据见 src/app/prototypes/(v1.13)/hybrid-reel/canvas/**(积分 credits.ts,规则函数 project.ts)。
   每条一句话;「原型:」开头的是评审 / 开发原型的演示简化,不是产品规则。 */

import type { EditorStepId } from "./editorJourneys";
import type { StepNote } from "./notes";

export const EDITOR_NOTES: Record<EditorStepId, StepNote> = {
  /* 2 */
  editorGuide: {
    what: [
      "画布上第一次出现剪辑器小卡时弹的操作引导(coach mark):压暗四周、橙框圈出要讲的部分,旁边一个深色小窗逐步讲解,共 9 步。第 1 步在画布上圈出剪辑器小卡;点 Next 直接打开全屏编辑,第 2–9 步在全屏里接着讲。",
      "剪辑器是通用的,不只给 Hybrid Reel 用:用户可能从 Hybrid Reel Agent 进画布(时间线已搭好),也可能在任意画布上选中一个节点、点「+」→ Video Editor 打开(时间线上可能只有这一个节点)。一张画布可以有多个 Video Editor 节点,每个各自一条时间线。两种入口弹的是同一套引导,文案不提 Agent / Hybrid Reel,不假设时间线已经填满,也不假设画布上只有一个剪辑器。",
      "9 步依次是:画布上圈剪辑器小卡「Video Editor」(Next = 进全屏)→ 预览区「Preview」→ 左侧「Media and music」→ 视频轨「Video」→ 配音轨「Voiceover」→ 字幕轨「Subtitles」→ 音乐轨「Music」→ 工具栏「Edit tools」→ 右上角「Export」。",
      "讲视频轨和配音轨两步时,引导自动在第一个 AI 镜头 / 第一句配音上打开右键菜单演示(菜单第一项就是 Edit),换下一步时自动关掉;演示打开的菜单不挡引导的 Next。",
      "引导文案只讲每块区域能做什么(标题 = 区域名,正文一句),不教具体手势,空剪辑器和有内容的剪辑器都适用。",
      "画布上的剪辑器节点是一张小卡:标题 + 工具条(分割、删除、播放时间、导出、Full-screen edit)+ 一条视频轨(每段一格缩略图,没素材时整条是「+ Add footage to the timeline」);没有预览,也没有 Media / Music。卡片上的按钮只是样子,点卡片任何地方都进全屏编辑,真正的剪辑都在全屏里做;按住拖动挪位置。字卡(屏幕文字)和音效已从剪辑器里去掉。",
      "目的:第一次打开剪辑器时知道每条轨是什么、在哪改、怎么从画布继续往里加东西,不用自己摸索。",
      "原型:评审里只有这一步强制弹引导、停在第 1 步;其他剪辑器步骤一律不弹,不管浏览器里有没有「已看过」记录。",
    ],
    rules: [
      "小窗:标题 + 一段说明 + 底部步骤点(当前步是加长的白条)+ 右上角 ×;非最后一步有「Skip」和「Next」,最后一步只有「Got it」。",
      "Next 进入下一步;Skip、×、Esc、最后一步的 Got it 都直接结束引导。",
      "讲到哪条轨,就真的选中这条轨上的第一块并打开它的设置面板(配音、AI 镜头),让用户看到点了之后是什么样;讲预览区时字幕出选中框;引导结束收回这些演示用的选中状态。",
      "讲轨道的步骤同时打开右侧设置面板,面板和目标一起留亮,小窗避开面板。",
      "小窗优先放在目标右边,放不下放左边,再不行放下方 / 上方,始终夹在视口内;箭头指向目标中心;目标随画布平移缩放实时跟随。",
      "「看过」记在浏览器 localStorage(key:hybrid-reel:guide-editor-node:v1),结束引导(Skip / × / Esc / Got it)即记为看过,之后不管从哪个入口打开剪辑器都不再弹;换浏览器或清缓存会再弹一次。",
      "原型:评审这一步强制弹出,Skip / 走完只在本次收起,不写 localStorage;点「重放这一步」重新从第 1 步开始。开发版画布照常按 localStorage 判断,顶部演示栏可切「会弹 / 已看过」。",
    ],
    edges: [
      "讲到一半退出全屏:引导先收起,下次进全屏从停下的那一步接着讲;第 1 步时用户自己点小卡进全屏,直接从第 2 步讲起。",
      "某一步要圈的元素不在页面上(例如没有配音节点)时,小窗居中显示、不圈任何东西,内容照常可读、可继续 Next。从节点「+」打开时时间线上可能只有一段素材,其余空轨照常圈出讲解。",
      "页面外层有 transform 时(如评审原型的产品区)浮层只铺满那一块,橙框按浮层原点换算坐标,和目标对齐。",
      "引导开着时全屏编辑照常可操作(小窗外点击不拦截),用户可以边看边点。",
      "系统设置了减少动态效果时,小窗不做淡入动画。",
    ],
    errors: [
      "localStorage 不可用(隐私模式 / 禁用存储):读不到记录按「没看过」处理,写不进去不报错;结果是每次进画布都会弹,用户 Skip 即可。",
    ],
    copy: [
      "Video Editor | Turn your footage into a finished ad. Click to start editing.",
      "Preview | Watch your ad as you edit, and adjust subtitles right on it.",
      "Media and music | Bring in footage and images, and add a soundtrack.",
      "Video | Arrange, trim and reorder your clips. Right-click a clip for more, like editing an AI shot.",
      "Voiceover | Add an AI voice that reads your script. Right-click a line to edit it.",
      "Subtitles | Subtitles follow your voiceover automatically.",
      "Music | Set the mood with background music.",
      "Edit tools | Undo, split and delete as you go.",
      "Export | Download your ad when it's ready.",
      "Skip | Next | Got it | Close tour",
    ],
  },
  /* 1 */
  canvas: {
    what: [
      "从 Agent 分镜卡点 Edit in canvas 进来:方案里定好的东西一次性搭好,用户在剪辑器里只做调整(§0 第 1 条)。",
      "每个上传素材是一个节点,每个 AI 补拍按分镜各是一个 Video Generator 节点,全部连到中间的 Video Editor 节点,时间线已按分镜排好。",
      "补拍、配音、AI 配乐、AI 封面都只预埋节点、不自动生成、不扣费;生成和扣费都在画布里由用户触发(每段补拍 50 credits,§2.3)。",
      "顶栏左边是返回按钮和工程名「Hybrid Reel — {平台} {时长}s」,右边是积分余额(千分位,如 35,600)。",
    ],
    rules: [
      "进画布的默认视角:100% 缩放,剪辑器节点居中;左下角「Fit」才缩到装下全部节点。",
      "画布上的剪辑器是一张小卡,点任何地方(包括卡上的分割、删除、播放、导出、Full-screen edit)都进全屏编辑;画布上不再有剪辑器的 Media / Music 面板,素材、音乐、字幕、配音的编辑都在全屏里。",
      "双击画布空白处,在鼠标位置弹出「Add Node」菜单(同 BuzzVideo 画布):Upload Image / Upload Video / Upload Audio / Select Avatar / Generate Image / Generate Video / Video Editor。点外面关闭。上传三项打开系统文件选择,节点放在双击的位置(音频设为背景音乐);Generate Image / Generate Video 在双击处放一个空的生成节点并打开它的 Settings;Video Editor 在双击处新建一个空白剪辑器(时间线为空),切过去、视角跟过去,原来的剪辑器留在原处变静止。",
      "原型:Select Avatar(数字人)不做,点了提示「Avatars aren't part of this prototype」。",
      "点上传的素材节点(你的视频 / 图片 / 品牌 logo)只选中并高亮连线,不打开右侧面板;点生成节点(Video / Image / Audio Generator)才打开它的 Settings。",
      "余额 = Agent 交接带来的余额 − 本工程在画布里花的积分,实时扣减;开发版直接打开画布(没有交接余额)时起始为 35,600。",
      "任何扣费动作(补拍、全部生成、配音、封面 AI)开跑前先查余额,不够弹「Not enough credits」,不扣费、不开跑。",
      "失败、生成中删节点都全额退回这一次扣的积分;退款直接加回顶栏余额。",
      "点补拍节点 → 右侧打开 Video Settings → 点 Generate Video 才开始生成并扣费;预览里补拍占位上也有一个 Generate Video 按钮,效果相同。",
      "画布上没有「全部生成」入口;一键全部生成只在全屏剪辑顶部提示条、导出拦截弹窗和导出完成提示里出现。",
      "Video Editor 节点自带迷你时间线和工具:Undo / Redo / Split at playhead / Delete / 播放 / Export / Full-screen edit。",
      "左上角「Back to agent」回到新 Agent(/prototypes/hybrid-reel-agent)。",
      "工程每次改动 250ms 后自动存进 sessionStorage,上传 / 生成的媒体存进 IndexedDB,硬刷新后 blob 链接从 IndexedDB 换回。",
      "原型:评审里左上角按钮回到 Agent 第 6 步(分镜表);评审不写 sessionStorage,不会覆盖开发版画布的工程。",
      "画布平移 / 缩放:滚轮平移,⌘ / Ctrl + 滚轮缩放(25%–160%),按住空白处拖动平移;左下角 Zoom out / 当前百分比 / Zoom in / Fit(Fit = 所有节点和剪辑器都装进视口)。",
      "删除节点:画布上所有节点(素材、生成节点、剪辑器)都能删 —— 选中后按 ⌫ / Delete,或右键选「Delete」。删素材 / 生成节点规则同 Settings 里的删除;删剪辑器:还有别的剪辑器就切到另一个(顶部提示 Video editor deleted),只剩这一个就清空它的时间线、节点保留(提示 Cleared the video editor)。可撤销。",
      "拖动节点:素材节点、剪辑器、其他剪辑器节点都能拖着改位置;一旦拖过就关掉自动排版(之后加节点也不再自动重排),拖动可撤销;按下节点的瞬间就高亮它的连线。",
      "上传节点标题旁显示 Agent 判定的身份标签(参考 / 品牌资产 / 产品等),悬停看一句说明。",
      "音频节点可以直接试听:播放 / 暂停、点 32 格波形跳到对应位置、显示 00:00 / 总长;分句配音节点按句连续播放;没用上的音频节点显示「Not on the timeline」(配音)或「Not in use」(音乐)。",
      "剪辑器小卡里的视频轨按片长铺满卡片宽度(至少按 30 秒算刻度),只显示每段的缩略图 / 未生成占位,不能在卡上直接剪;全屏编辑打开时卡上的时间停在当前播放位置。",
    ],
    edges: [
      "余额显示不会小于 0;评审开关「积分不足」打开时起始余额为 2,任何扣费动作都会被拦。",
      "删除一个节点:时间线上引用它的片段变成虚线「Add footage」占位,封面 / 配乐 / 配音对它的引用一并清掉;撤销能把节点找回来,但生成中被删的那次生成不会恢复。",
      "方案选的封面帧落在还没生成的 AI 镜头上时,进画布不预设封面。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,第 3–5、19–20 步看不到补拍相关状态;「旁白」关掉时没有配音节点,字幕也不预填。",
    ],
    errors: [
      "开发版直接打开画布、sessionStorage 里没有工程:显示空态「Nothing on the canvas yet」+「Back to agent」按钮(回新 Agent)。",
      "AI 节点生成失败:节点卡片上显示红色「Generation failed」+ 原因(见第 20 步);节点上不放 Retry,Settings 里也不放红框。",
    ],
    copy: [
      "Add Node | Upload Image | Upload Video | Upload Audio | Select Avatar | Generate Image | Generate Video | Video Editor | Avatars aren't part of this prototype",
      "Video Generator | Image Generator | Audio Generator",
      "Video Editor | No Video Generated | No Image Generated",
      "No Audio Generated | Configure settings and start generation | Use this node in",
      "Edit it on the timeline | Split at playhead | Select a clip to delete",
      "Export MP4 | Full-screen edit | Back to agent",
      "Nothing on the canvas yet | Upload footage in the agent, confirm the plan, then choose Edit in canvas.",
      "Zoom out | Zoom in | Fit | Not on the timeline | Not in use | Editing in full screen…",
    ],
  },
  /* 3 */
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
      "从预览占位的 Generate Video 等入口触发空 Prompt 的镜头:不扣费,顶部提示「Add a prompt to generate」;超长的提示「Shorten the prompt to generate」。",
      "Prompt 超过 2,000 字的镜头不能生成(见第 5 步)。",
      "生成中删除节点:停止轮询 / 模拟计时,这一次扣的积分全额退回;之后即使任务完成也不再写回。",
      "撤销刚删掉的生成中节点:节点回来时是未生成(或保留旧结果),不会卡在 Generating;被删的那次生成即使之后完成也写不回来,撤销后再生成要重新扣费。",
      "时长发给接口前会被收到 4–15 秒的整数;比例不在支持列表里就退回 9:16;1080p 只在 Seedance 2.0 标准版生效,其他退回 720p。",
      "成片的临时下载链接 24 小时内有效,原型拿到后立刻存进 IndexedDB。",
    ],
    errors: [
      "余额不够 → 弹「Not enough credits」,不扣费、不开跑。",
      "建任务失败 / 任务 failed、expired、cancelled / 下载失败 / 超过 15 分钟 / 连续 3 次查询失败 → 节点退回未生成(有旧结果保留旧结果),积分全额退回,节点上出失败态(见第 20 步)。",
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
  /* 4 */
  shotsReady: {
    what: [
      "补拍完成后节点显示视频(悬停播放),剪辑器小卡的视频轨里换成这一镜的缩略图;点小卡进全屏编辑预览整条片子(§2.3)。",
      "剪辑器是六条固定轨,没有加轨按钮(§3、§0 第 4 条)。",
      "原型:评审里补拍结果轮流用本地的 RELLET 成片 / 素材视频代替,和 prompt 无关。",
    ],
    rules: [
      "生成成功:状态 ready、takes + 1,结果追加为一个新版本并切到它,时长按接口返回的实际时长更新,比例按生成比例更新。",
      "点已生成的补拍节点,Settings 底部按钮变为「Regenerate」,重新生成再扣一次费用;新结果直接替换旧结果,Settings 里不显示结果区、也没有版本切换。",
      "补拍镜头的声音默认随镜头生成(With Audio 开),按原声规则处理(§2.7、§2.9)。",
    ],
    edges: [
      "生成出的实际时长和时间线上这一镜长度不一致时,以时间线上的长度为准播放,不自动改时间线。",
      "评审开关「AI 补拍镜头 = 0」时这一步没有补拍节点,只看到实拍素材连进剪辑器。",
    ],
    errors: [
      "重新生成失败:保留上一版结果,节点底部一条「Generation failed」。",
      "某段补拍视频加载失败时节点只是没画面,没有专门的报错。",
    ],
    copy: ["Regenerate", "Full-screen edit"],
  },
  /* 5 */
  nodeSettings: {
    what: [
      "补拍节点的 Video Settings:参考素材、结果版本、尾帧、prompt、模型、比例、分辨率、时长、With Audio,全由方案预填(§2.3)。",
      "Prompt 写清要什么声音、注明不要音乐和人声;文字 / logo 不让 AI 画(§2.3)。",
      "尾帧本身就是一个普通补拍镜头,logo / 产品图优先设为 Last frame,保证最后停住的是原图(§2.12)。",
    ],
    rules: [
      "Input Source 显示参考素材缩略图(悬停 × 可移除)和计数「{n} / 9」,没指定时默认用前 3 个上传素材,一张都没有显示「No reference」。",
      "Input Source 只展示方案带过来的参考素材,不能在这里再加参考(没有「Add reference」);悬停缩略图右上角 × 可移除。",
      "Prompt 下方计数「{len} / 2000」;超过 2,000 字时输入框变红、左侧提示「Shorten the prompt to generate」、Generate 置灰。",
      "补拍 Prompt 为空时左侧琥珀色提示「Add a prompt to generate」,Generate 置灰(悬停同一句提示);生成中不显示这句。",
      "模型:Seedance 2.0 / Seedance 2.0 Fast / Seedance 2.5 / Veo 3;比例 9:16 / 16:9 / 1:1;分辨率 480p / 720p / 1080p,默认 720p。",
      "时长下拉固定 4 / 5 / 6 / 8 / 10 / 12 秒加当前长度;改时长 = 改时间线上这一镜的长度,已生成的镜头只改时间线长度、不重新生成。",
      "底部按钮未生成时是「Generate Video」+ 积分标(默认 50),已生成是「Regenerate」,生成中置灰为「Generating… {p}%」;点击先查余额。",
      "视频参考截取指定的那一秒,压成长边 1280 的 JPEG(质量 0.88)发给模型;图片参考原图转码发送。",
      "右上角垃圾桶删除节点(生成中删除会退款),× 关闭面板;Esc 也能关面板。",
      "Image Settings 还有 Background:Auto / Transparent / Opaque。",
    ],
    edges: [
      "导入素材都已经是参考时,候选区显示「Everything you imported is already a reference.」;音频素材不能当参考。",
      "带尾帧且接口拒绝时退回「尾帧也当参考图」,总数不超过 10。",
      "某张参考素材读不出画面时静默跳过,不提示用户。",
      "时长下拉没有 2 / 3 秒:Seedance 最短 4 秒,也按 4 秒计费。",
      "改模型 / 分辨率不改变价格,所有视频模型统一 50 credits / 段。",
      "Image Settings(封面等图片节点)模型为 GPT Image 2.5 Sunburst / Seedream 4.0 / Nano Banana Pro,分辨率 Low / Medium / High,每次 3 credits;只带一张参考帧,标签为 Images,不显示参考计数,也没有 Add reference;Prompt 可以为空。",
      "评审开关「AI 补拍镜头 = 0」时没有补拍节点,这一步不会打开 Settings。",
    ],
    errors: [
      "上一次生成失败时,失败只显示在画布节点上(「Generation failed」+ 统一报错句),Video Settings 里不放红框(见第 20 步)。",
      "余额不够时点 Generate → 弹「Not enough credits」。",
    ],
    copy: [
      "Video Settings | Configure video generation | Input Source | Clips",
      "{n} / 9",
      "Everything you imported is already a reference. | No reference | Remove reference | Result",
      "Last frame | The shot ends exactly on {label}, so the logo stays pixel-perfect. | Remove last frame | Prompt",
      "{len} / 2000 | Shorten the prompt to generate | Add a prompt to generate | Video Model | Aspect Ratio",
      "Resolution | Duration | With Audio | Generate Video",
      "Regenerate | Generating… {p}% | Images",
    ],
    open: [
      "各视频模型是否不同价:目前 Seedance 2.0 / Fast / 2.5 / Veo 3、各分辨率统一 50 credits / 段。",
    ],
  },
  /* 6 */
  multiEditor: {
    what: [
      "一张画布可以有多个 Video Editor 节点,每个各自一条时间线(一条视频)。这里从第一段上传素材「+ → Video Editor」新建了第二个 Video Editor,又切回了第一个:两个都是完整的剪辑器节点,下面那个是静止的。",
    ],
    rules: [
      "新建剪辑器有两个入口:节点「+」→ Video Editor(带着这个节点),或双击画布空白处 → Add Node → Video Editor(空白剪辑器,放在双击的位置)。",
      "节点右侧「+」→ Use this node in → Video Editor(Edit it on the timeline):新建一个 Video Editor 节点,把这个节点放进去 —— 一张画布可以有多个剪辑器,每个各自一条时间线(一条视频)。视频 / 图片成为第一段(图片 3 秒,视频整段、最短 0.3 秒);配音节点带上它的几句配音;其他音频设为背景音乐;封面图设为封面。画幅、字幕样式、音量沿用当前剪辑器,其余从空开始。",
      "新剪辑器也叫「Video Editor」(不加序号),摆在最下面一个剪辑器的下方,视角移过去。每个剪辑器在画布上都是同样的小卡,各自一条时间线;全屏编辑、导出、撤销作用在当前这个上。",
      "有多个剪辑器时,每个剪辑器只连它时间线上用到的节点(片段、配音、背景音乐、封面);只有一个剪辑器时照旧所有节点都连过去。新建 / 切换剪辑器都能撤销。",
      "要把节点加进已有的剪辑器:先点那个剪辑器切过去,再点剪辑器左侧的「Media」在素材面板里添加(原型里「+」→ Video Editor 一律新建)。",
      "点任意一个剪辑器小卡 = 切到它并进全屏编辑;拖它可以挪位置。",
    ],
    edges: [
      "空白剪辑器(还没有素材)各轨的入口都显示:Add footage / Add voiceover / Add music;字幕轨是一句「配音生成后自动填字幕」的说明。Add footage 打开 Media 面板。",
      "新建的剪辑器只有这一个节点的内容;从空白开始时时间线显示各轨的「Add footage / Add voiceover…」空态,和第一个剪辑器的空态一样。",
      "空白剪辑器:小卡的视频轨显示「+ Add footage to the timeline」,点了进全屏编辑;全屏里预览区正中一个橙色加号 +「Click to upload / or drop files here」。点加号从本地选视频 / 图片(可多选),也可以直接把文件拖进预览区;传上来的素材在画布上出一个素材节点并连到这个剪辑器,同时按顺序接到时间线末尾(视频整段,图片 3 秒)。限制同 Media 面板上传,不合规的跳过并在顶部提示原因。",
      "新建 / 切换都能撤销(⌘Z)。",
    ],
    errors: [

    ],
    copy: [
      "Add footage | Add footage first, then add text to it | Add footage first, then generate subtitles",
      "Upload footage | Click to upload | or drop files here",
      "Video Editor | Click to edit this video",
    ],
  },
  /* 7 */
  timeline: {
    what: [
      "全屏编辑:左侧 Media / Music 入口,中间预览,下面工具栏 + 四条轨,从上到下是视频 / 配音 / 字幕 / 音乐(字幕紧跟配音,方便对着读),点轨道上的块出对应设置:镜头 / 配音 / 配乐的设置在右侧,字幕设置在左侧(§3)。画布上的剪辑器小卡只看不剪,点了就进这里。",
      "这里选中了第一段实拍:用户自己的素材(上传的视频 / 图片)选中后只高亮,右侧不出设置面板;只有选中 AI 生成的镜头才打开它的 Video Settings。",
    ],
    rules: [
      "左侧 Media / Music 面板从顶栏下一直铺到窗口底部(盖住时间线左边一截),屏幕矮的时候也有足够高度看列表;右侧设置面板浮在预览上方。两边都带阴影,开关面板时预览和时间线不挪位置、不缩放。",
      "拖片段两端裁剪,拖中间换顺序;裁剪点在 6 像素内自动吸附到 Agent 拆出的素材分段边界。",
      "右键片段菜单:Copy(⌘C,直接复制到这段后面)/ Split / Replace footage / Delete(⌫)/ AI generate / Speed / Export。",
      "点时间线上的 AI 镜头,右侧直接打开它的 Video Settings;点实拍片段只选中(可裁剪、分割、删除、右键),不出面板。",
      "快捷键:空格播放 / 暂停,S 分割,⌫ 删除,⌘C 复制,⌘Z / ⇧⌘Z 撤销重做(见第 8–10 步),Esc 依次关掉:全屏 → 节点设置 → 左侧 Media / Music 面板 → 当前选中;焦点在输入框里时快捷键不生效。",
      "悬停提示写「点了会发生什么」,不写名词:视频轨头 Mute original audio / Turn original audio on;封面格 Add a cover — the first frame people see / Change cover;播放键不加提示(图标已经够清楚),分割带 S,删除带 ⌫,撤销重做带快捷键;全屏 Fit = Fit the whole video in view。还没有素材时,置灰的按钮一律提示「Add footage first」。",
      "每条轨最后一块后面都有一个虚线「+」,不用回到轨道头也能接着加:视频 Add a clip from media;配音 Add another voiceover;音乐 Add music(打开 Music 面板,选的曲子接在最后一段后面)。",
      "预览里选中字幕:1px 白色细框 + 四角小圆点和左右小胶囊(拖任一个等比缩放)。",
      "点或拖时间标尺 = 移动播放头,同时暂停播放。",
      "拖块(整段挪动、拖两端裁剪,所有轨都一样)时播放头不动;单击块才把播放头跳到它开头。",
      "同一条轨上的块不重叠:拖动时放进最近的空位,没有空位就留在原处;拉长碰到相邻块就停住。",
      "轨道头:只有视频轨的喇叭能点(原声总开关 Mute original audio / Turn original audio on);配音、字幕、音乐的轨道头只是图标,不能点;悬停出提示说明是哪条轨(Voiceover track / Subtitle track / Music track)。加配音 / 加音乐用各轨的空状态和末尾虚线「+」,字幕全自动。",
      "视频轨末尾「+」(Add a clip from media)打开 Media 面板。",
      "AI generate → Generate video from this clip:新建一个 Video Generator 节点,参考只用这一段画面,Prompt 预填,打开它的 Settings;新节点不自动进时间线,生成好后再用「Replace footage」或拖进去。",
    ],
    edges: [
      "片段、字幕、配音、音乐最短 0.3 秒;图片片段最长停留 10 秒;视频片段出点不能超过源素材时长。",
      "有配音的镜头原声压到 20% 垫在下面;配音 / 口播时音乐压到 45%。",
      "AI 镜头未生成时轨道上显示「No Video Generated」/「Generating {p}%」,预览显示「AI-generated shot」占位 + Generate Video;缺素材的片段显示虚线「Add footage」。",
      "原型:右键「Export this clip」下载的是这一段用到的整条源素材,不是裁剪后的这一段(浏览器里不做转码)。",
    ],
    errors: [
      "未生成的 AI 镜头右键「Generate video from this clip」置灰,提示「Generate this AI shot first」。",
    ],
    copy: [
      "Video Editor | Export | Media | Music",
      "Replace footage | Copy | Split at playhead | Move the playhead into this clip first",
      "Delete | AI generate | Generate video from this clip | Uses this clip as the reference | Generate this AI shot first",
      "Speed | 0.5× | 0.75× | 1× | 1.25× | 1.5× | 2×",
      "Export this clip",
      "Add a clip from media | Mute original audio | Turn original audio on",
    ],
    open: ["待定:实拍片段不再有设置面板后,方案里定好的画面处理(运镜、局部放大、设备外壳、画中画等)、原声音量和画面适配在剪辑器里改不了,只按方案导出;要不要在别处(如右键菜单)留入口。"],
  },
  /* 8 */
  undoRedo: {
    what: [
      "撤销 / 重做:剪辑器工具栏左侧两个按钮,也可以按 ⌘Z / ⇧⌘Z;全屏编辑里同一组按钮。",
    ],
    rules: [
      "撤销 / 重做最多 60 步(⌘Z / ⇧⌘Z);撤销回退编辑,不回退生成状态、生成结果和已扣积分。",
      "能撤销的:时间线上的所有编辑(裁剪、拖动、分割、删除、变速、换素材)、字幕 / 配音文案和样式、音乐、封面、节点位置、新建 / 切换剪辑器。",
      "做了新的编辑后,重做记录清空(只能重做撤销之后还没改过的那一段)。",
      "没有可撤销 / 可重做时按钮置灰;悬停提示 Undo ⌘Z / Redo ⇧⌘Z。",
    ],
    edges: [
      "撤销不会退积分:生成过的补拍、配音、配乐结果和扣掉的积分都留着,撤销只是换回之前的时间线。",
      "刷新页面后撤销记录清空(只存在内存里)。",
    ],
    errors: [

    ],
    copy: [
      "Undo | Redo | ⌘Z | ⇧⌘Z",
    ],
  },
  /* 9 */
  split: {
    what: [
      "分割:把一段从播放头处切成两段。这里选中了第一段实拍,播放头已经放在这一段正中间,按 S 或点工具栏「Split at playhead」就能切。",
    ],
    rules: [
      "分割:播放头放进片段后按 S、点工具栏「Split at playhead」或右键菜单。",
      "分割时字幕按切点分开:字幕断成了几屏的,中点在切点前的屏归前半段、其余归后半段;只有一屏的两段各保留整句;台词只跟前半段走。",
      "切开后两段都是同一个素材,各自可以单独裁剪、拖动、删除、变速;切点就是两段的出入点,不重新取素材。",
    ],
    edges: [
      "播放头离片段两头不足 0.3 秒时不能分割;分割后某一半字幕不足 0.3 秒,那一半的字幕被清空。",
      "图片片段也能切,切开后两段都是同一张图。",
    ],
    errors: [
      "按 S 或点工具栏分割时播放头不在片段里或离边缘不足 0.3 秒 → 顶部提示「Move the playhead into this clip first」(4 秒消失)→ 挪播放头再切;右键菜单里的 Split 直接置灰。",
    ],
    copy: [
      "Split at playhead | Move the playhead into this clip first",
    ],
  },
  /* 10 */
  deleteClip: {
    what: [
      "删除:选中时间线上任何一块(片段、字幕、配音、音乐)后按 ⌫ 或点工具栏删除;片段右键菜单里也有 Delete。这里选中了第一段实拍。",
    ],
    rules: [
      "删除连带规则:删字幕只清这一段的字幕文字(片段还在);删一句还没生成的配音,如果它的配音节点没有别的句子,节点一起删;删片段后自动选中相邻片段。",
      "删片段后后面的片段自动往前补位,成片总时长变短。",
    ],
    edges: [
      "删除画布上的节点(Settings 右上角删除)和删时间线上的片段不同:删节点会把引用它的片段变成虚线「Add footage」占位。",
      "删错了可以 ⌘Z 撤销。",
    ],
    errors: [

    ],
    copy: [
      "Delete | ⌫",
    ],
  },
  /* 11 */
  speed: {
    what: [
      "变速:片段右键菜单 → Speed。这里第一段实拍已经调成 1.5×,时间线上这一段变短了。",
    ],
    rules: [
      "变速在片段右键菜单的 Speed 里:0.5 / 0.75 / 1 / 1.25 / 1.5 / 2×;方案定的速度不在这几档时补在最后一档。",
      "变速后这段的时长 = 素材用到的长度 ÷ 速度,后面的片段跟着前移 / 后移;配音和字幕不变速。",
      "只有实拍和已生成的 AI 镜头能变速;速度标在片段右键菜单的 Speed 后面(如「1.5×」)。",
    ],
    edges: [
      "变速后片段最短仍是 0.3 秒;图片片段变速只改停留时长。",
      "变速可以撤销。",
    ],
    errors: [

    ],
    copy: [
      "Speed | 0.5× | 0.75× | 1× | 1.25× | 1.5× | 2×",
    ],
  },
  /* 12 */
  subtitles: {
    what: [
      "字幕 = 片子里说出来的话,全自动,没有「自动生成字幕」入口:进画布时已按旁白原文 / 实拍里听到的台词预填;之后每次配音生成好(含重新生成、Generate all),有配音的镜头字幕自动换成配音念的那几句,时间对齐配音在镜头里的位置,不弹确认(§2.5、§2.4)。",
      "这里在全屏编辑里选中了第一段字幕,左侧出字幕设置。",
    ],
    rules: [
      "字幕和配音绑定:配音生成中时,它每一句所在的那段字幕轨也显示同样的「生成中」占位(原字幕先收起);整轮配音生成完,字幕和配音一起出来。按镜头一句一段的配音按句对到镜头;单独加的配音(可以加好几段)一段配音对应一段字幕:字幕就是这段配音的台词,起止和这段配音一致,画在字幕轨同一位置;它覆盖到的镜头原来的字幕清掉,免得叠在一起。这块字幕和预览里的字幕联动:点任一边都选中这段字幕(预览出选中框、时间线块高亮、右侧出字幕设置),能单独改文字、样式、颜色;右键 Edit subtitle / Delete subtitle,⌫ 只删字幕不删配音。重新生成这段配音时文字跟着配音更新,样式和颜色保留。",
      "同步时机:一个配音节点这一轮只要有句子生成成功,就同步一次;顶部提示「Subtitles synced to the voiceover」(4 秒消失)。同步单独算一步,⌘Z 可以只撤回字幕的变化、保留新配音。",
      "同步规则:字幕文字 = 这个镜头上配音的台词(多句按顺序用空格连起来);起止 = 最早一句开始到最晚一句结束,收在镜头范围内;没配音或配音静音的镜头字幕不动。",
      "用户手改过的字幕:下次配音生成时照样按配音覆盖(配音就是字幕的来源);想保留就别重新生成那一句。",
      "断句:英文一行 ≤ 32 字符、中日韩一行 ≤ 14 字,一屏最多两行,尽量在标点后断;一个镜头的字幕切成几屏,按字数比例分时间,依次显示。断句只在显示时计算,存的仍是整句;时间线字幕块按屏用细线分格。",
      "字幕轨为空时显示一句说明「Subtitles fill in automatically when the voiceover is generated」,不能点。",
      "选中字幕出字幕设置面板:改文字、样式、颜色;右键 Edit subtitle / Delete subtitle。",
      "字幕设置面板有文字、样式、颜色三项,都只改选中的这一段字幕;颜色 = 字色,色板 10 色 + 自选,Reset 回到样式自带的颜色,逐词样式里念到的那个词仍按样式高亮;没单独改过样式的字幕跟着方案定的样式。样式里的 None = 这一段不显示字幕。位置和大小在预览里直接拖(拖动对全部字幕生效),面板里不再有 Position / Size。",
      "在预览里拖字幕 = 改全片字幕的位置(提示「Drag to move · all subtitles」);靠近中线吸附;拖四角 / 两侧把手缩放字号 0.5–3 倍。",
      "字幕块可以在它所属的片段范围内整段左右挪、拖两端掐头去尾。",
    ],
    edges: [
      "配音部分失败:只同步生成成功的那几句所在的镜头,失败的镜头字幕不动。",
      "单个词超过一行宽度(如网址)时硬切;中文没有空格时往回找最近的标点断行。",
      "评审开关「旁白」关掉时字幕不预填,字幕轨显示空状态说明。",
    ],
    errors: [
      "配音整轮失败:没有句子生成成功,字幕不同步、不提示。",
    ],
    copy: [
      "Subtitles synced to the voiceover | Subtitles fill in automatically when the voiceover is generated",
      "Edit subtitles | Edit subtitle | Delete subtitle | Drag to move · all subtitles",
    ],
  },
  /* 13 */
  media: {
    what: [
      "换素材:右键片段选 Replace footage(或选中片段后开左侧 Media),从已导入素材或资产库挑一条换掉这一段(§2.1)。",
      "缺素材时可以直接在 Media 面板上传新的视频 / 图片,不用回 Agent 重来。",
      "某个类型下没有素材时,只显示一行灰字「No audio yet」/「No images yet」/「No videos yet」/「Nothing here yet」,不加虚线框。",
      "成片画幅由 AI 按投放平台定,剪辑器里不可切换(§2.14);比例不同的素材自动做画幅适配(§2.2)。",
    ],
    rules: [
      "面板顶部「Upload」:可多选,收视频和图片(先看 MIME,MIME 为空或不认识时按扩展名兜底,如 HEIC / MOV,与 Agent 落地页同一规则;音频不收);合规的文件存进 IndexedDB(刷新可恢复),加进 Imported 并在画布上出一个素材节点,不自动进时间线。",
      "上传限制同 Agent(暂定,见 Agent 第 2 步待定):视频 ≤ 500 MB 且 ≤ 10 分钟,图片 ≤ 20 MB。上传按钮下方不写限制说明,超限时才提示。",
      "上传中按钮显示「Adding…」并置灰;上传会切回 Imported 标签。",
      "Media 面板两个标签 Imported / Assets,按 All / Images / Videos / Audio 筛选。",
      "替换:保持这一段原来的长度,入点从 0 开始,长度不超过新素材时长(图片最长 10 秒)。",
      "加到末尾:视频取前 min(素材时长, 3) 秒,图片 3 秒;音频素材按用途加到配音轨末尾或设为配乐。",
      "选中片段正在用的素材只用橙色描边标出(不压文字标签);资产库里已在画布上的标「On canvas」。",
    ],
    edges: [
      "剪辑器上传不限文件个数(Agent 最多 10 个);上传入口在 Media 面板里(画布上剪辑器左侧的 Media,全屏编辑里同一个面板)。",
      "没有选中片段时不显示「Replace selected clip」;音频素材和当前素材本身也不显示替换按钮。",
      "某个筛选下没有素材时显示对应空态(No audio yet / No images yet / No videos yet / Nothing here yet)。",
    ],
    errors: [
      "不合规的文件不加入,面板上方出一条红色可关闭提示,多个用「 · 」连起来:「{file} is over 500 MB」「{file} is longer than 10 minutes」「{file} is over 20 MB」「{file} isn't a video or image」。",
      "文件读不出元数据(损坏或格式不支持)→「{file} couldn't be read」,不加入。",
    ],
    copy: [
      "Media | Upload | Adding…",
      "{file} is over 500 MB | {file} is longer than 10 minutes | {file} is over 20 MB",
      "{file} isn't a video or image | {file} couldn't be read | Dismiss",
      "Imported | Assets | All | Images | Videos | Audio",
      "No audio yet | No images yet | No videos yet | Nothing here yet",
      "On canvas | No audio yet | No images yet | No videos yet | Nothing here yet",
    ],
  },
  /* 14 */
  fullScreen: {
    what: [
      "全屏编辑:点画布上的剪辑器小卡(任何地方)进来,这是剪辑的唯一地方。顶部 Video Editor 栏 + Export,左侧 Media / Music,中间大预览,底部四条轨(视频 / 配音 / 字幕 / 音乐),右侧跟着选中项出设置(§3)。",
    ],
    rules: [
      "预览和时间线之间有一条分隔条(悬停出现小横条,光标变上下箭头):上下拖改时间线高度,范围 150px – 窗口 65%,记在浏览器里;双击恢复默认。默认高度分大小屏:窗口高度 ≥ 760px 时刚好装下四条轨(画面 50px、细轨 30px);小于 760px 只完整露出前两条(画面轨 + 配音轨),其余往下滑,把高度留给预览;拖矮了时间线内部上下滚动,时间标尺和播放头把手固定在顶部不跟着滑走。",
      "全屏里的生成设置(配音、音乐、AI 补拍、封面 / 图片节点)不再是右侧面板,而是在预览上方居中弹出一个输入框:左上一行小标题(这是哪个节点)+ 删除 / 关闭;上面是参考素材(AI 补拍的参考图、尾帧,悬停可移除);中间是 Prompt;底部一条参数栏 —— 左边模型下拉,旁边一个参数小胶囊(如「9:16 · 720p · 4s · Audio」「Xiaoyu · 1.0x」「44.1kHz · MP3」),点开往上弹出细项(比例 / 分辨率 / 时长 / 带声音,或音色 / 采样率 / 语速 / 音量 / 音调 / 格式);右边是积分和圆形生成按钮(悬停提示 Generate Video / Regenerate 等);点了生成输入框自动收起,进度在时间线、封面格和画布节点上看。字幕设置仍在右侧。画布上点节点出的右侧 Settings 面板不变。",
      "打开生成设置的方式:单击片段 / 配音 / 配乐只选中,不弹设置;要右键选菜单第一项「Edit」(AI 补拍镜头和配音;AI 配乐叫「Edit music」;补拍下面一行小字 Prompt, model and settings)才弹出居中输入框。上传的实拍素材没有生成设置,右键菜单里没有 Edit。",
      "Music 面板点「Make music with AI」:画布上加一个配乐节点、收起左侧面板,居中弹出它的输入框(prompt 已按方案预填),用户确认后点生成按钮才开始生成。",
      "预览左上角一个小卡显示当前宽高比,点开下拉选:Original(跟第一段素材一样)/ 16:9 / 4:3 / 2:1 / 9:16 / 1:1 / 3:4,当前项打勾;选了预览画框立刻换比例,可撤销。默认按投放平台定(TikTok、Reels 为 9:16)。素材和成片比例差得多时完整显示,空出来的地方默认黑底。还没素材时不显示这个小卡。",
      "左侧 Media / Music 面板开着时,点面板和左侧按钮以外的任何地方(预览、时间线、顶栏)都收起面板;面板里弹出的下拉、取色器不算外面。",
      "画布上能做的,全屏里都一样能做(时间线、分割、删除、变速、替换素材、配音、音乐);全屏多了更大的预览、时间线缩放,以及字幕轨。",
      "时间线缩放:右上角 Zoom out / 滑杆 / Zoom in,每次 ×1.25,范围 12–140 px/s;在时间线区域用触控板双指捏合(或按住 ⌘ / Ctrl 滚滚轮)也能缩放,以指针所在的那一秒为中心,整页不会跟着缩放;Fit = 整条时间线刚好装满;进全屏时默认 Fit。",
      "左侧 Media / Music 面板和右侧设置面板都浮在预览区上方,开关面板时预览、工具栏和时间线都不挪位置、不缩放。",
      "退出:只有右上角 ×(Exit full screen)或按 Esc 能回到画布,其他操作都不会自动退出全屏;时间线和选中状态保留,剪辑器引导一起收起。",
      "全屏里的操作一律留在全屏:封面 AI Design Cover、加配音、点配音块、片段右键 AI generate 新建的节点,设置面板都在全屏右侧打开,不跳回画布(节点照样加在画布上)。",
    ],
    edges: [
      "有未生成的补拍时,顶部常驻提醒「{n} AI shots not generated」+「Generate all {cost}」(画布上没有这条)。",
    ],
    errors: [

    ],
    copy: ["Aspect ratio | Original | 16:9 | 4:3 | 2:1 | 9:16 | 1:1 | 3:4", "Full-screen edit | Video Editor | Export | Exit full screen | Media | Music | Zoom in | Zoom out | Fit | Editing in full screen…"],
  },
  /* 15 */
  voice: {
    what: [
      "旁白一句一个 Audio Generator 节点,挂在对应镜头开头,镜头挪了跟着挪;可换音色、按句重新生成,也可一键生成全部(§2.4)。",
      "这里选中了第一句配音,右侧 Audio Settings:每句文案、音色、采样率、语速、音量、音调、输出格式、字幕开关。",
      "原型:评审里配音是按句子找的录音,换音色、改语速不会改变声音。",
    ],
    rules: [
      "每句 5 credits,点生成时先查余额再扣;按钮:全部未生成为「Generate Audio」,只改了其中几句为「Generate {n} lines」,都已生成为「Regenerate」;换过音色的节点整节点重配,按钮句数和积分按整节点算,和实际扣费一致。",
      "Audio Settings 里不放「Generate all lines」,只有一个 Generate Audio:只生成当前这个配音节点。Prompt 上方不写用法说明,每句文案框里也不写「Shot n · 时间」,生成后只在右上角显示「这句多长 / 镜头多长」。",
      "改某一句文案会清掉这一句的旧音频,需要重新生成;改音色会同步到所有配音句(Applies to all {n} voiceover lines.)。",
      "已有音频的节点换了音色:音色下方琥珀色提示「Voice changed — regenerate to hear it」;下次生成这个节点的所有句子都重新配,包括还没有音频的句子,不会新旧音色混着;重新生成成功后提示消失;撤销时这条提示跟着实际音频走,不会误报。生成中音色、参数和文案都锁定(分段配音任何一句在生成,所有句子的音色都锁定)。",
      "生成前按字数预估时长(英文 2.5 词 / 秒、中日韩 4 字 / 秒,再除以语速),超过镜头 0.1 秒以上就提前出「Longer than its shot…」提示;生成后按实际音频长度判断。",
      "生成成功后这一句的长度按实际音频时长更新(最短 0.5 秒)。",
      "配音轨为空时显示「Add voiceover」:方案里有台词时按镜头一次配好全部句子,否则加一段空白配音(1–4 秒)并打开设置让用户写。",
      "语速 0.5–2.0×、音量 0.5–2.0、音调 −12 到 +12 半音,格式 MP3 / WAV;语速默认取方案给这一句定的快慢档。",
      "配音 Prompt 写法:引号里是要念的台词(计字数、算时长、生成字幕),引号前面是语气说明(不会念出来),例如 Warm and upbeat: \"Skin feeling thirsty?\";没写引号就整段当台词。",
      "Voice 点开是音色弹窗(试听后选);Sample Rate 可选 8000 / 16000 / 24000 / 32000 / 44100 / 48000 Hz(默认 44100);Format MP3 / WAV;Audio Model 目前只有 Seed Audio 1.0。",
      "Enable subtitle:原型里只记录这个开关,不影响字幕轨(待定:开了是否把这句配音写进字幕)。",
      "点「Add voiceover」新加的 Audio Generator 节点放在剪辑器左边、紧挨着它(往下找第一个空位,不和别的节点重叠),视角跟过去;上传的音乐节点同样放在剪辑器旁边。",
      "配音块可以直接在时间线上左右拖改起点,拖过就不再跟着镜头走;两端可裁剪;配音轨末尾「Add another voiceover」加一句。",
      "配音块上直接显示这段的台词(悬停看全文);写了台词还没生成也显示台词,都没写才显示 No Audio Generated,生成中显示进度。",
      "配音右键:Edit / Mute(静音后变 Unmute)/ Delete voiceover。静音的配音块图标换成划掉的喇叭、文字变淡;播放和导出都不带这句,音乐和原声也不再为它压低。",
    ],
    edges: [
      "文案上限 2,800 字:超出的句子下方计数「{len} / 2,800」变红,Generate 置灰;单段(非按镜头)配音一直显示计数,超了同样变红置灰。",
      "生成中或文案为空时生成按钮置灰;同一节点生成中重复点击被忽略。",
      "生成中删除配音节点:剩下的句子不再调接口,这次扣的积分全额退回。",
      "配音不支持上传,只能 AI 生成。",
      "单段配音有「Use subtitles as script」一键把字幕拼成文案。",
      "评审开关「旁白」关掉时没有配音,这一步右侧没有内容,第 21 步同样为空。",
    ],
    errors: [
      "余额不够 → 弹「Not enough credits」,不扣费。",
      "生成失败:失败的句子退积分、没有音频;画布上的配音节点显示「Generation failed」+「{失败数} of {句数} lines failed: {原因}」,不放 Retry,Audio Settings 里不放红框(见第 21 步)。",
    ],
    copy: [
      "Audio Settings | Configure voiceover generation | No reference image or audio connected (optional) | Prompt",
      "Audio Model",
      "Seed Audio 1.0 | Voice | Sample Rate | Speed",
      "Volume | Pitch | Output Format | Enable subtitle",
      "Applies to all {n} voiceover lines. | Voice changed — regenerate to hear it | {len} / 2,800",
      "Generate Audio | Generate {n} lines | Regenerate",
      "Add voiceover | No Audio Generated | Use subtitles as script",
      "Add another voiceover | Edit | Mute | Unmute | Delete voiceover | Sample Rate | Enable subtitle",
    ],
  },
  /* 16 */
  music: {
    what: [
      "音乐来源:曲库(仅可商用)/ 上传 / AI 生成;方案预埋了一个 AI 配乐节点,点生成才出曲子(§2.8)。",
      "踩点:剪辑点微调到最近节拍,每处最多挪 0.3 秒,标了「Keep whole on beat sync」的镜头不剪短(§2.8)。",
      "面板底部统一调原声总开关、配音音量、音乐音量;原声按方案保留、压低或静音(§2.7)。",
    ],
    rules: [
      "Music 面板顶上的 AI 入口是一块柔和日落渐变的横幅「Make music with AI」,和下面的曲目一眼分开。",
      "点「Make music with AI」:画布上剪辑器旁边新建一个 Audio Generator(配乐)节点,prompt 按方案的配乐描述预填好,直接作为背景音乐占在音乐轨上(显示 No Music Generated);右侧打开它的 Audio Settings,用户看过 / 改过 prompt 再点 Generate Audio,不会自动开跑。",
      "曲目行右侧:品牌橙渐变的圆形「+」= Use(鼠标移到这一行才出现),没有「已选中」的对勾:音乐轨可以放好几首,同一首也能加多次。曲目行下面一行只写时长(不写授权说明、AI / Uploaded)。",
      "音乐轨支持多首,一段接一段、不重叠:每次加音乐都是追加,不替换 —— 每段按曲子本身的长度,接在最后一段后面(轨上还没有音乐就从 0 秒开始);同一首可以加多次。追加的可以超出成片结尾,导出时只放到片尾;新加的那段在可见范围外时,时间线自动滚过去。曲库每首 2–5 秒,时长统一写成 00:02 这种格式。列表里只放能直接用的曲子:曲库 + 上传的 + 已经生成好的 AI 配乐;还没生成的 AI 配乐不进列表。",
      "每段音乐可以单独整段拖动(不压到前后两段)、拖两端裁剪、删除;轨道末尾的「+」和右键「Add music from the playhead」都打开 Music 面板。播放和导出时放的是播放头所在那一段。没有画面时(空剪辑器)音乐块也按曲子长度显示。",
      "Music 面板只有音乐(音效已去掉),底部不放原声开关和人声 / 音乐音量:原声开关在视频轨头的喇叭按钮。",
      "曲库每首标「{时长} · Licensed for commercial use」;按 8 个分类筛选、可搜索;点「Use」设为配乐,再点「In use」取消。",
      "「Make music with AI」→ Create:画布上加一个音乐节点并立即生成,约 3.5 秒完成,完成后自动设为配乐(当前没有配乐时)。",
      "上传:只接受音频文件,读出时长后在画布上加一个音乐节点并直接用作配乐,顶部提示「Make sure you have the rights to use this track.」(4 秒消失)。",
      "默认音乐音量 35、配音音量 100;配音 / 口播时音乐自动压到 45%。",
      "音乐轨右键:Add music from the playhead / Remove music;删除只是从轨道拿掉,画布上的节点保留。",
      "踩点(Beat sync):进画布时按方案里的 BPM 自动把剪辑点对到节拍上,没有单独开关;曲库里有一个「Beat sync」分类。待定:改了时间线之后要不要重新对拍。",
      "音乐块可整段挪动、两端裁剪;双击音乐块打开 Music 面板;单击 AI 配乐块打开它的设置(Configure music generation),和配音的 Audio Settings 同一套版式:Input Source → Prompt(音乐描述)→ Audio Model → Sample Rate → Volume → Output Format → Generate Audio;没有音色、语速、音调和字幕开关,也不再有「Use as music」开关(换曲在 Music 面板里换)。字数只在超过上限时显示。",
      "Music 面板里点曲目行试听 / 再点停止(AI 生成和上传的曲目也能试听);搜索框有清除 ×。",
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
      "Music | Search… | Upload music",
      "Make music with AI | Composed for this reel | Create | Use",
      "{duration} · Licensed for commercial use | Make sure you have the rights to use this track.",
      "In use | Composing… {p}% | Not generated | No music matches. Try another word.",
      "No Music Generated | Add music from the playhead",
      "Add music | Add music from the playhead | Remove music",
      "Configure music generation | Input Source | Prompt | Audio Model | Sample Rate | Volume | Output Format | Generate Audio",
    ],
    open: [
      "AI 配乐真实接入后的价格(原型免费)、时长和失败处理。",
    ],
  },
  /* 17 */
  cover: {
    what: [
      "封面沿用现有功能:方案已选好用哪一镜的哪一秒,进画布即设好(§2.15)。",
      "也可从素材 / 资产库选图,或 AI Design Cover 在画布上加一个 Image Generator 出带标题的封面;方案定的封面标题写进了它的 prompt。",
    ],
    rules: [
      "AI Design Cover 新建的封面图片节点:画幅跟成片走(9:16 成片出 9:16 封面)。默认 prompt 按短视频封面的通用做法写:真实产品不重画(形状、颜色、标签、logo 照参考帧)、一个视觉焦点(产品或使用的人,占画面一半左右)、一句 3–5 个词的大标题(方案定了标题就照原文写)、高对比粗体、标题和产品放在中间安全区(竖版避开顶部 15%、底部 25% 和右侧按钮区)、颜色取自产品、不加多余 logo / 水印 / 小字、缩成小图也看得清。",
      "弹窗上方的封面预览和剪辑器预览区一致:按成片宽高比画框(如 9:16),素材比例差得多就完整显示 + 黑底,差得不多铺满裁切。",
      "封面帧的时间统一存时间线时间:进画布时把方案的「素材里第几秒」换算到(卡点后的)时间线上,弹窗打开就定位在这一帧。",
      "旧工程存的是素材里的秒数,打开时自动换算成时间线时间。",
      "封面格:悬停没设时提示「Add a cover — the first frame people see」,设了提示「Change cover」,还没素材时置灰提示「Add footage first」;AI 封面生成中显示转圈。",
      "选帧条上当前帧是一根指针(橙线 + 白描边,没有把手);拖到最开头 / 最末尾时指针收在条内,不会被裁掉一半。",
      "弹窗 From video:拖下方时间条选帧,停下约 0.14 秒后截取这一帧;From assets:从画布上的图片和资产库选图。",
      "「Set as cover」保存并关闭;「AI Design Cover」新建 Image Generator(16:9,3 credits)并打开它的设置,封面先指向它,建节点本身不扣费。",
      "方案预埋的封面 Image Generator 不自动生成、不扣费,点生成(先查余额)后成品自动设为封面。",
      "删除封面只清掉封面引用,画布上的节点保留。",
    ],
    edges: [
      "没有候选帧 / 图时「Set as cover」和「AI Design Cover」置灰。",
      "弹窗起点 = 已设封面那一帧;没有帧封面时用播放头位置。",
      "原型:AI 封面是模拟生成(用参考帧合成),永远成功。",
    ],
    errors: [
      "拖到还没生成的 AI 镜头或缺素材的位置:提示「This moment has no footage yet — pick another frame.」,两个按钮置灰;是补拍镜头时多一个「Generate this shot ({cost} credits)」(见第 22 步)。",
    ],
    copy: [
      "Add a cover | Click to edit cover",
      "Cover | Pick a frame or an image.",
      "From video | From assets",
      "Drag to pick the frame | AI Design Cover",
      "Cancel",
      "Set as cover",
    ],
    open: [
      "AI 封面真实接入后的价格(原型 3 credits)与失败处理。",
    ],
  },
  /* 18 */
  exportGate: {
    what: [
      "时间线上还有补拍没生成时点 Export,先弹窗拦一下:可一键生成(写明要花的 credits),或照样导出(没生成的镜头是空白帧)。",
      "全屏剪辑顶部同时常驻一条提醒「{n} AI shots not generated」+「Generate all {cost}」。",
    ],
    rules: [
      "口径(导出拦截、顶部提醒、导出完成提示统一):镜头数 = 时间线上用到、还没就绪的补拍(含生成中、缺 Prompt 的);能一键生成的只算未在生成且 Prompt 没问题的,费用 = 这些各自价格之和。",
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
      "余额不够 → 弹窗关闭后弹「Not enough credits」,一个都不开跑。",
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
  /* 19 */
  exporting: {
    what: [
      "导出:按钮上走进度「Exporting {p}%」,约 2.4 秒走完,弹出完成提示。",
      "原型:不做真实渲染;下载的是时间线上第一段已生成的视频;评审自动演示这一步不下载文件,手动点 Export 才下载。",
    ],
    rules: [
      "全屏编辑右上角点 Export:在按钮下方弹出「Export settings」面板 —— 视频封面(缩略图,点了打开封面弹窗换封面)、名称(默认导出时的本机时间,如 202610221113,可改)、分辨率(360p / 480p / 720p / 1080p,默认 1080p;720p 下面一行小字 Recommended for TikTok Ads Manager,1080p 下面 Recommended for TikTok)、格式(MP4 / MOV),底部一个 Export 按钮开始导出。上次选的分辨率、格式记着,名称每次重新取当前时间。点面板外面、× 或 Esc 收起。",
      "画布上剪辑器小卡上的导出图标只是样子,点了进全屏编辑;导出在全屏右上角的 Export。",
      "导出中 Export 按钮置灰,重复点击被忽略。",
      "完成提示标题「Export complete」;文件真的下载到本地才写「Downloaded {file}」,没下载(评审自动演示、素材拉取失败)写「Exported {file}」。",
      "文件名 = 导出设置里填的名称 + 所选格式的扩展名(如 202610221113.mp4);提示 5 秒后自动消失,可手动关闭。",
      "有补拍没生成时提示里多一行「{n} AI shots weren't generated and exported as blank frames.」+「Generate them · {cost} credits」,提示停留 8 秒;统计口径同导出拦截(时间线上未就绪的补拍,费用按各节点自己的价格)。",
      "点「Generate them」= 全部生成(先查余额)并关闭提示;只有部分能开跑(其余在生成中或缺 Prompt)时按钮写「Generate {k} · {cost} credits」;一个能开跑的都没有时不显示这个按钮。",
      "右键片段「Export this clip」(右边写这一段的起止时间)走同一流程,提示为「Clip exported」,文件名带角色和序号;导出整条片子只在右上角 Export。",
    ],
    edges: [
      "导出中离开剪辑器:进度计时器被清掉,不会在后台走完、也不会触发下载。",
      "原型:「Export this clip」下载的是这一段用到的整条源素材,不是裁剪后的片段(浏览器里不做转码);这一段素材没就绪时不下载,提示写 Exported。",
    ],
    errors: [
      "原型:源文件拉取失败时照样提示导出完成,文案为「Exported {file}」。",
    ],
    copy: [
      "Export settings | Cover | Change | Name | Resolution | 360p | 480p | 720p | Recommended for TikTok Ads Manager | 1080p | Recommended for TikTok | Format | MP4 | MOV | Export",
      "Exporting {p}% | Export complete | Clip exported",
      "Downloaded {file} | Exported {file}",
      "{n} AI shots weren't generated and exported as blank frames. | 1 AI shot wasn't generated and exported as blank frames.",
      "Generate them · {cost} credits | Generate it · {cost} credits | Dismiss",
    ],
    open: [
      "真实导出:渲染、分辨率、码率、失败与重试;成片下载的签名链接与有效期。",
    ],
  },
  /* 20 */
  shotFailed: {
    what: [
      "第一个补拍生成失败(轮询超时):节点退回未生成、积分已退回;画布上的节点显示红色「Generation failed」+ 原因(§2.3)。Video Settings 里不放红框。",
      "其余补拍已生成,只有第一个失败。重新生成失败、上一版还在时:结果照常显示,节点底部一条「Generation failed」。节点上不放 Retry,重新生成在 Video Settings 里点 Generate Video。",
    ],
    rules: [
      "失败后按钮恢复为「Generate Video」(有旧结果则为「Regenerate」),点击先查余额、重新扣费,节点上的失败态随之消失。",
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
      "Generation failed | This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.",
      "Generate Video | Regenerate",
      "The model took too long to respond. | Couldn't reach the server — check your connection.",
      "The model is busy right now — try again in a moment. | Something went wrong on our side.",
    ],
  },
  /* 21 */
  voiceFailed: {
    what: [
      "第一句配音生成失败:积分退回、没有音频;画布上的配音节点显示「Generation failed」+ 原因(音频节点不放红叉图标、不放 Retry)(§2.4)。Audio Settings 里不放红框。",
      "一句一个节点,所以真实的部分失败文案就是「1 of 1 lines failed: …」这种形状。",
      "原型:这一步配音接口被设为一直失败,再点 Generate Audio 看到的仍是同样的失败态。",
    ],
    rules: [
      "失败的句子按 5 credits / 句退回;同一节点里成功的句子保留音频。",
      "改这一句文案会清掉失败态;在 Audio Settings 里再点 Generate Audio 先查余额、重新扣费。",
    ],
    edges: [
      "所有配音最多 3 句同时调接口(Generate all 时各节点共用这一上限)。",
      "节点上只写最后一个失败原因(统一报错句)。",
      "换过音色的节点生成失败时,「Voice changed — regenerate to hear it」提示保留。",
      "评审开关「旁白」关掉时没有配音,这一步是空的。",
    ],
    errors: [
      "配音接口报错 → 节点上「Generation failed」+「{失败数} of {句数} lines failed: {原因}」→ 失败句退积分,节点无音频则退回未生成,可重新生成。",
      "单段(非按镜头)配音失败 → 退积分、节点上显示统一报错句。",
    ],
    copy: ["1 of 1 lines failed: The model is busy right now — try again in a moment.", "Generation failed", "Generate Audio", "Regenerate"],
  },
  /* 22 */
  coverNoFootage: {
    what: [
      "操作:封面弹窗打开在已设的封面帧,把下方时间条拖到第 5 秒左右(落在 AI 补拍那一段)。",
      "该位置的补拍还没生成:出现「This moment has no footage yet — pick another frame.」,Set as cover 和 AI Design Cover 置灰,下面多一个「Generate this shot (50 credits)」(§2.15)。",
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
      "余额不够 → 弹「Not enough credits」,不开跑。",
    ],
    copy: [
      "This moment has no footage yet — pick another frame.",
      "Generate this shot ({cost} credits)",
      "Generating… {p}%",
      "Set as cover",
      "AI Design Cover",
      "From assets",
    ],
  },
};
