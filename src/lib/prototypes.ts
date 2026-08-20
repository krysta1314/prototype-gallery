/** 画廊分类:产品版本 + 与版本并列的专题分类(邮件) */
export type Version =
  | "v1.2"
  | "v1.3"
  | "v1.4"
  | "v1.5"
  | "v1.6"
  | "v1.7"
  | "邮件"
  | "归档";
export const VERSIONS: Version[] = [
  "v1.2",
  "v1.3",
  "v1.4",
  "v1.5",
  "v1.6",
  "v1.7",
  "邮件",
  "归档",
];

export type Prototype = {
  slug: string;
  title: string;
  desc: string;
  date: string;
  /** Route to open the prototype */
  href: string;
  /** 所属产品版本 */
  version: Version;
  /** true if it's a migrated static (legacy) demo served from /public/legacy */
  legacy?: boolean;
  /** true if href is an external URL (opens in a new tab) */
  external?: boolean;
};

export const PROTOTYPES: Prototype[] = [
  {
    slug: "tier-badges",
    title: "订阅标签 · 渐变规范",
    desc: "七档订阅标签(Free / Starter / Pro / Ultra / Team / Scale / Enterprise)的视觉规范页:135° 线性渐变、圆角 5px、11px/600、padding 2px 7px。上半部分是色板——每档给标签实物、档位 id、渐变色条与两端 hex(Free 是浅色档,额外加一圈 6% 黑内描边免得贴在白底上没边界);下半部分是「实际场景」,把同一枚标签放进七张账号菜单卡片里,看它挂在用户名后面的真实观感。标签由 team-workspace 的 _shared/plan-badge.tsx 统一提供,身份菜单与这张规范页复用同一个组件,改色值两边同步生效。",
    date: "2026-08-18",
    href: "/prototypes/tier-badges",
    version: "v1.6",
  },
  {
    slug: "team-review",
    title: "Team 需求功能列表 · 评审索引",
    desc: "把整个团队需求摊成一张可逐条走查的清单,给开发、测试、评审共用一个口径。左侧是按用户旅程排的 8 个阶段——开通与加入 / 角色与权限 / 席位管理 / 额度与撞墙 / 充值与账单 / 可见性与留痕 / 通知 / 管理后台,每个阶段下挂具体功能,列表项带实现状态图标(已打通 / 部分实现 / 尚未实现)与缺口计数徽章,支持按功能名或边界状态文案搜索,以及「只看有缺口 / 待决策的」一键过滤。右侧是单条功能的评审面板:一句话讲清它解决谁的什么问题,下面是编号的「边界状态与规则」逐条清单(测试可以直接当用例走),再下面是「在原型里打开」——每个链接都通过 URL 参数把演示状态一次带进去(角色 / 池用量 / 个人上限 / 席位 / 自动充值),比如「池用尽 · Member」直接落到 Member 视角下团队积分为 0 的首页,不用再去底部演示条上手动切四个下拉;最后是琥珀色的「缺口 / 待决策」区块,诚实列出还没做或还没定的事(企业客户开户完全没有、通知中心只有申请一类、org-members 与 team-workspace 额度字段口径未统一等)。清单本身即需求文档,状态徽章不美化。",
    date: "2026-08-17",
    href: "/prototypes/team-review",
    version: "v1.6",
  },
  {
    slug: "admin-portal",
    title: "Admin Portal · Enterprise 開戶",
    desc: "sales 给企业客户开户的内部后台 —— 补上原型里一直空着的那一步:Enterprise 不走自助购买(定价页只有 Contact Sales),所以「一个 Enterprise 组织是怎么诞生的」此前没有落地页面。左侧是开户表单:公司名与 owner 邮箱(owner 收发票)→ 三档选择(E1 Team 5 席 / E2 Growth 15 席 / E3 Studio 25 席起,数值取自 rate card v1.6 第 8 节校正版:月度池额度 84,500 / 253,500 / 422,500,年付月价 $799 / $2,399 / $3,999 起),每档卡片直接把「同席位数的 Scale 要多少钱、给多少额度」和溢价百分比印在下面 → 席位加购(单价 $59 / $49 / $39,加购上限 +5 / +10 / 不设限,也就是升档斜坡)→ 池额度可在档位基准上谈(合同措辞必须写 up to X credits/month,未用完部分作废)→ pour-over、SSO / SAML、审计日志开关。右侧是常驻的对客口径面板:改任何一个数,立刻重算年费总额、每席位等效额度、相对同席位 Scale 的溢价百分比与毛利率(成本按 $0.00263/credit),溢价低于 20% 或毛利低于 60% 转红。池额度若低于同席位 Scale 的额度,表单里直接弹红字警告 —— 采购拉个表就能算出「付更多钱拿更少额度」,这是 30 Jul 方案被推翻的原因,sales 在开户时就该看见。底部常驻一句对客话术:额度发到组织池、不挂在席位上,所以加购席位不带自带额度,池才是产品。纯前端 mock,不落库。",
    date: "2026-08-19",
    href: "/prototypes/admin-portal",
    version: "v1.7",
  },
  {
    slug: "org-members",
    title: "組織成員用量管理 · Org Admin",
    desc: "Enterprise 组织的成员管理视图 —— 不是内部专用后台:PressLogic 只是其中一个组织(用自己的产品管自己人),客户组织用同一套界面。唯一分内外的是成本换算率:顶部组织切换器切到 internal 组织时 $ 列走我们的 COGS($0.00263/credit,徽章标 Internal · shows our cost),切到客户组织时自动换成该组织的有效单价(合同月费 ÷ 月度池额度,KPI 名从 Real cost 变 Spend),我们的成本结构不会漏给客户;换算口径以一句话常驻在标题下,免得看的人不知道这个数是成本还是售价。审计能力(看某人具体生成了什么)按 Enterprise 档位开放,自 E2 起。域名自动加入弹窗带「入组织必须同时拿到组织默认额度」这条约束 —— 没有它,自动加入等于给每个新人开一个无上限钱包。以下为原有能力:一张表看完所有有权限的成员,重点是 credits 之外多一列真实现金成本。Members 列表顶部 6 个 KPI(席位 / 当期活跃 / credits 消耗 / 真实成本 / 产出量 / 单条视频成本,均带环比),主表逐人给出部门角色、状态、月度额度使用进度条、当期 credits 与美元成本、视频与图片产出数、单条成本、28 格日耗迷你柱图、最后活跃时间;支持 5 档期间切换(近 7 天 / 近 30 天 / 上月 / 本月 / 全部)、7 列表头排序、部门与状态下拉筛选、姓名邮箱实时搜索,下方接「按部门支出」条形图与「Attention needed」自动告警面板(超预算 / 逼近 80% / 零使用席位 / 单条成本超中位数 1.8 倍 / 3 次以上失败)。点行进成员详情:5 个 KPI + 日耗柱图(橙=成功、琥珀=失败仍计费)+ 月度额度面板,下接 4 个 Tab——Generations 缩略图库(可按 All / Video / Image / Agent 二级筛选,每张给 prompt、模型、项目码、credits 与美元)、Canvases 会话表(渲染次数 vs 保留视频数的效率读数)、By project tag、Credit transactions 流水。Project Tags 页把成本按客户项目码归集,供财务分摊。Adjust budget 弹窗是真能改的:保存后该成员的进度条、override 徽章、超预算计数与告警面板全部实时联动;Invite / Grant credits / Export 三个弹窗保持展示态。数据为种子伪随机生成的 150 天用量,完全确定性。",
    date: "2026-08-17",
    href: "/prototypes/org-members",
    version: "v1.6",
  },
  {
    slug: "promo-campaigns",
    title: "营销优惠活动 · Admin + 弹窗 + 定价页",
    desc: "限时营销活动的完整链路原型:后台建活动 → 前台弹窗与定价页立刻生效。Admin 端(/promo-campaigns/admin)是活动列表 + 4 步创建向导:列表按 Live / Scheduled / Ended / Draft 分 Tab,每行给出活动名、类型徽章、力度摘要、起止时间、触达位与状态,支持编辑 / 复制 / 上下线 / 删除 / 一键恢复预置数据;向导四步为 Basics(名称与起止时间)→ Offer(四选一:充值订阅加赠 credits、价格折扣、限时权益解锁、优惠码)→ Placement(弹窗全部文案素材、Pricing 横幅、弹窗频控)→ Review(摘要 + 存草稿 / 立即上线),右侧常驻实时预览面板,Popup / Pricing 两个 tab 逐字跟随。Client 端两页共享同一份活动配置:首页(/promo-campaigns/home)进页自动弹出活动弹窗,视觉沿用 New Model Festival 那版(渐变巨型数字 + 两枚胶囊 + 亮点卡 + 立体渐变 CTA),文案力度全部读配置,关闭后按频控不再自动弹、可点 Show offer 反复打开;定价页(/promo-campaigns/pricing)是 v1.3 版定价页叠加活动态:顶部活动横幅带倒计时、卡片右上角活动角标、credits 显示加赠后数值并划掉原值、折扣显示折后价、对比矩阵里被限时解锁的模型由 ✗ 变成 Festival unlock 橙标,产出量按加赠后额度重算。底部中文演示控制条可一键切「无活动 / 加赠 / 折扣 / 解锁 / 三者叠加」。纯前端 mock,配置存 localStorage。",
    date: "2026-08-13",
    href: "/prototypes/promo-campaigns/admin",
    version: "v1.7",
  },
  {
    slug: "pricing",
    title: "Pricing · 定价页(Individual + Business)",
    desc: "从外部原型站 prototype-project-five 的 v1.5 抽出来、落进本仓库的定价页,以后改定价直接改这里。顶部 Individual / Business 分组切换 + Monthly / Annual 计费切换(年付 30% OFF)。Individual 为 Free / Starter / Pro / Ultra 四档卡片:划线原价 + 折后价、每月 credits 与「≈ 多少张图 / 多少条视频」换算、Ultra 带 1×/2×/4× 容量滑杆(40% / 50% OFF 档位)、逐档 KEY FEATURES 与 IMAGE / VIDEO MODELS 权益清单。Business 为 Team / Scale / Enterprise 三档,按席位计价(Team 2–9、Scale 5–30 席位步进器),共享积分池 6,900 / 16,900 credits 每席位每月。下方是完整对比矩阵:按模型逐行给出单价(credits/图 或 credits/视频)与各档能产出的数量,再接 FEATURES 行对比;然后是按人群分流的选购引导(Starter / Pro / Ultra / Enterprise 四张卡,各带适用人群与核心能力)与 FAQ 手风琴。右下角 Preview as 角色切换器可模拟 Free / Starter / Pro / Ultra 已登录视角。纯前端 mock。",
    date: "2026-08-12",
    href: "/prototypes/pricing",
    version: "v1.6",
  },
  {
    slug: "about",
    title: "About · 品牌介绍页",
    desc: "BuzzVideo 官网 About 页原型,排版骨架对标 higgsfield.ai/about:近黑底 #0d0d0f、全大写紧排巨标题、强调色用得极省。跳出 design.md 的居中卡片体系(同 affiliate-bold 的换皮做法),品牌只保留橙 #ff5e1a 作唯一强调色;字体换 Archivo 工业 grotesk,900 全大写做标题、400 做正文。刻意剥掉 AI 套路:无 kicker 眉标、无渐变字、无统计磁贴、无等大图标卡网格。自上而下:通栏 Hero(视频满屏 + 压角巨标题 + 单个胶囊 CTA)→ 合作模型区(一句说明 + 两行反向滚动跑马灯,彩色图标 + 品牌名,ByteDance / Google / Nano Banana / Kling / Gemini / ChatGPT / OpenAI 七家)→ What we believe(Our Values 药丸眉标 + 居中标题 + 3×2 卡片,每张卡左上角编号、背后超大淡色图标、文案压底,按 higgsfield 参考图复刻)→ 浅色带 #f2f1ee:两类使用者(药丸眉标 + 居中标题副标题 + 两张等宽卡片,媒体内嵌圆角、清单用小图标)+ 向右出血的 9:16 用例片墙 → 承诺 bento(7/5 + 4/4/4 不等分,无图标)→ Affiliate 段(三步 + 4:5 视频,Apply 跳旗舰 affiliate 原型)→ FAQ 左标题右手风琴 → 橙色通栏收尾。素材复用真实 BuzzVideo CDN 视频(10 支,离屏暂停 + ffmpeg 抽的首帧 poster)。",
    date: "2026-08-12",
    href: "/prototypes/about",
    version: "v1.5",
  },
  {
    slug: "email-templates",
    title: "邮件模板管理 · 团队",
    desc: "团队功能会触发的 14 封通知邮件 + 1 封客服人工回信 + 4 封发布营销邮件(Seedance 2.5 预热 / 上线、Asset Library 上线、Seed-Audio 1.0 上线)的模板管理台。**每封邮件一个独立路由**(`/emails/<id>`),可以把单封链接直接发给开发;`/emails` 是索引页,按「成员与权限 / 额度与用量 / 自动充值 / 客服与支持 / 产品与发布」五类分组平铺所有邮件卡片(主题行 + 触发时机 + 收件人 + 级别徽章)。单封页面左侧保留分组导航可快速跳转,右侧给出该邮件的触发时机、收件人、收件箱预览(主题行 + preheader)与完整邮件正文渲染。支持「示例数据 / 显示变量」两种模式切换,变量模式高亮所有占位符,一键复制纯文本文案便于交给开发或做本地化。覆盖邀请加入团队、邀请账单联系人、角色变更、被移出团队、Owner 转移(新旧 Owner 各一封)、团队解散、积分池 80%/100% 阈值告警、成员额度 80%/100% 告警、自动充值扣款失败 / 已暂停 / 达月度封顶。客服类含一封「生成失败道歉 + 补偿」——用户反馈视频生成被误判为敏感内容后 PM 的人工回信:定位到第 4 张参考图触发下游 API 审核、说明生成失败的积分会自动即时退回、两条编号 workaround(换图 / 裁图)、2,000 补偿积分、模型持续升级的承诺、可直接回信的落款。**刻意不用任何高亮块 / 色条 / 信息框**,通篇纯段落,读起来就是一封手打的私人回信,和其余系统通知邮件的版式区分开。另含 Seedance 2.5「上线预热」与「正式上线」两封营销邮件,版式对齐 BytePlus 发布邮件:顶部 Seedance 2.5 字标主视觉(预热 COMING SOON / 上线 NOW LIVE)、高亮标题 + 品牌色小标、三条带橙色条的卖点、Try it free 信息框、主 CTA + 次级链接、What Creators Are Building 四宫格、落款与 P.S.,标题全部落在「一条 prompt 出一支视频广告」的广告向表达上。另含 Asset Library 与 Seed-Audio 1.0 两封上线邮件,共用同一版式但没有现成字标素材,主视觉改用纯文字字标 + tagline:Asset Library 讲「跨 session 自动归档 + 自主上传 + 批量下载 + 回溯模型参数」,Seed-Audio 1.0 讲「脚本转配音 + 音色库与语速语调控制 + Agent 与 Canvas 双入口 + 字幕导出」。",
    date: "2026-08-07",
    href: "/prototypes/emails",
    version: "邮件",
  },
  {
    slug: "team-workspace",
    title: "组织 / 团队 · Client 端",
    desc: "在 Home / Marketing Agent / Canvas / Assets 四个页面上叠加团队(Team)租户层的完整原型。**额度模型分两套,按套餐分叉**:Team / Scale 是 per-seat —— 每席位每月固定 8,900 / 16,900 credits、归该席位本人、不汇成池,同事没用完的借不到、管理员也不能在人之间分配,额度不够只能给这个席位单独买 top-up 或升档;Enterprise 才是 pool —— 整个组织一个共享池,管理员按人分配额度(soft / hard cap),未分配额度可开 pour-over 回流,并独占 SSO / 审计日志 / 池级自动充值。价格与额度对齐 (v1.6)/pricing 的 business.ts。演示团队四个:个人账户(Free)、PressLogic Growth(Scale)、Beauty Squad(Team,当前用户是 Member 且席位快用满)、Atlas Media Group(Enterprise,共享池 + 按人分配)。顶栏 credits 胶囊与下拉面板按模型换读数与文案(「Your seat」vs「shared pool」);撞墙横幅四态,per-seat 明说「同事的额度不能转给你」。Team Settings 全屏弹窗分 General / Members / Permissions & roles / Credits & usage / Top-up / Billing / Activity log:权限矩阵可编辑(结构性权限上锁、防提权),Members 页 per-seat 显示「席位额度 · 已用 · Top up」、Enterprise 显示可编辑的分配额度,Top-up 弹窗 per-seat 必须选给哪个席位、Enterprise 可选充池或充人。**移除成员必须在同一步指定画布继承人** —— 画布仅创建者可编辑、成员只读,人一走作品就无人能改,所以移除走独立弹窗选继承人(默认 Owner,Billing Admin 不可当继承人),继承后卡片作者换成继承人并标 (inherited),支持连环继承。Canvas 分 My Projects / Team Projects 双区,资产库分 My Assets / Team Assets 双区,都支持 private→team 发布。Marketing Agent 会话保持全 private 不共享。另含邮件邀请落地页(已登录/未注册/席位已满三态)。顶部中文演示控制条可切团队(含 Enterprise)、角色、席位与额度状态,档位按模型自动增减。纯前端 mock。",
    date: "2026-08-05",
    href: "/prototypes/team-workspace/home",
    version: "v1.6",
  },
  {
    slug: "seedance-2-5-waitlist",
    title: "Seedance 2.5 · Waitlist 弹窗",
    desc: "Seedance 2.5 上线前的邮件收集(waitlist)弹窗组件 demo。进页面自动浮现 modal(半透明遮罩 + 背景模糊弱化的 Seedance 2.5 落地页),弹窗顶部是电影感预告 banner(Coming soon 呼吸点 + Seedance 2.5 字标 + 播放钮),主体为一句卖点文案 + Email 输入框(实时格式校验、非法时红字提示)+「I agree to receive launch updates」同意勾选框(未勾选禁用按钮)+ 主 CTA「Notify me at launch」。提交后弹窗原地切换成「You're on the list」成功态(回显邮箱)。关闭后页面中央保留触发按钮可反复打开。刻意去 AI 味:无 sparkles/无满屏渐变字/渐变只留唯一主按钮,产品原生对话框。纯前端 mock。",
    date: "2026-08-03",
    href: "/prototypes/seedance-2-5-waitlist",
    version: "v1.3",
  },
  {
    slug: "audio-generation",
    title: "音频生成 · Agent + Canvas 双场景",
    desc: "TTS 语音配音(对齐豆包 Seed-Audio「音频生成 HTTP」接口)的双场景原型,顶部 tab 切 Agent / Canvas。Agent:对话里请求配音 → agent 回内联音频生成卡片(脚本+音色+进阶参数+波形播放器)。Canvas:点阵画布双击或点 + 弹出 Add Node 菜单,在 Generate Video 下方新增 Generate Audio,点击落一个可拖动的自包含生成节点。共享 VoicePicker(音色 popover 带 mock 试听)/ AdvancedParams(model、语速/音调/音量滑块、format、字幕开关)/ AudioPlayer(mock 波形 + 播放头动画)三组件。纯前端 mock,无真实接口/音频。",
    date: "2026-07-22",
    href: "/prototypes/audio-generation",
    version: "v1.5",
  },
  {
    slug: "workflow-canvas",
    title: "Work Flow + Canvas",
    desc: "Work Flow 与 Canvas 的新页面入口。页面内容待补充。",
    date: "2026-07-22",
    href: "/prototypes/workflow-canvas",
    version: "v1.4",
  },
  {
    slug: "canvas-billing",
    title: "Canvas Billing · 内部成本账单后台",
    desc: "公司内部 admin 成本记录后台原型,参照 BytePlus console「Bill details」,最小统计单位为 Canvas。费用只面向内部核算、不对终端用户展示。顶栏 Bill details + 双月历日期范围选择器(默认不选=全部,按 Created 过滤);Total cost 汇总卡随筛选实时重算。主体是一张平铺的生成记录表,每行一条生成记录,列为 Canvas ID / Email / Model / Status(Completed·Processing·Failed 三色徽章)/ Cost(USD)/ Credits / Created / Updated。三个独立搜索框(Email / Canvas ID / Agent ID)+ Resource·Status 两个筛选下拉。Buzz 暖橙 + 干净数据表,纯前端 mock(~52 条记录 / 9 用户 / 3 个月,已排除 storage,税额演示为 $0)。",
    date: "2026-07-20",
    href: "/prototypes/canvas-billing",
    version: "归档",
  },
  {
    slug: "consecutive-video",
    title: "连续视频生成 · Demo",
    desc: "验证 Seedance 2.0「连续视频生成」(BytePlus ModelArk)的极简 demo:上传一张产品图 + 写多段分镜 prompt,点生成后用 return_last_frame 让每段视频的最后一帧作为下一段的首帧、逐段串联,最后在页面播放器里连贯播放。用来评估这种「尾帧接首帧」串联方式的成片连贯度与产品一致性。前端调本地后端生成引擎(localhost:8899)。",
    date: "2026-07-17",
    href: "/prototypes/consecutive-video",
    version: "归档",
  },
  {
    slug: "canvas-templates",
    title: "Canvas · 空白画布 + Workflow Templates",
    desc: "复制自音频生成的 Canvas,但画布初始为空。用户进入后先看到 Workflow Templates 选择器(Video / Image / Text / Audio 四类卡片 + 「Click to quick-create」),点任一卡片快速新建节点进入画布。保留左侧工具栏、双击空白/「+」弹出 Add Node、节点拖动、右侧设置抽屉、「Generate from this node」等原有交互。纯前端 mock。",
    date: "2026-07-29",
    href: "/prototypes/canvas-templates",
    version: "v1.7",
  },
  {
    slug: "credit-request",
    title: "Credit Request · 积分申请工单",
    desc: "复制自 Homepage,在顶栏 credits 旁加「Request Credits」按钮,点击弹出内部积分申请工单弹窗。字段沿用内部流程:Project ID(Clockify 合约编号)、完整 Project Name、申请 credits 数量、预计产出条数、用途类型(新制作/修改/重跑/超支追加)、超支原因(仅超支追加时出现)、申请人、所属团队(Production/Sales/PM)、BuzzVideo 登入 Email、目前余额。纯前端 mock,提交后 toast 提示、无真实接口。",
    date: "2026-07-29",
    href: "/prototypes/credit-request",
    version: "归档",
  },
  {
    slug: "homepage",
    title: "Homepage · 产品首页",
    desc: "BuzzVideo 产品首页原型：包含模型与功能入口、会员促销、ChatGPT Image 2.0、Seedance 2.0、MCP、Canvas、灵感瀑布流及响应式手机和平板布局。",
    date: "2026-07-14",
    href: "/prototypes/homepage",
    version: "v1.4",
  },
  {
    slug: "marketing-agent-v14",
    title: "Marketing Agent · 页面更新",
    desc: "Marketing Agent V1.4 独立入口：全新的浅色网格与品牌光晕背景、项目管理侧栏、可筛选的创作内容卡片，以及与 Homepage 同步的收起/展开式营销对话框。旧版 Web Search Mission Gallery 继续保留在 V1.3，便于独立查看和对比。",
    date: "2026-07-22",
    href: "/prototypes/marketing-agent-v14",
    version: "v1.4",
  },
  {
    slug: "ad-studio",
    title: "Ad Studio · 功能首页(创作库)",
    desc: "Ad Studio 的产品功能首页(不是落地页):从 Buzz 左侧导航 Canvas 下的「Ad Studio」入口跳脱进入,是一个 light mode 的独立全屏页(与 Buzz 产品体系一致),页面结构为「两张卡片」:左卡是侧边栏(Projects/搜索/项目列表 + 返回 Buzz),右卡是影院墙(顶栏 All team creations / Contact Sales / Upgrade -50% / 账户 + 内容),两卡圆角悬浮在暖白画布上、留间隙,右卡内部滚动。定稿方向 A 影院墙(参考 Sora/Runway 创作库):内嵌 featured showcase 大 banner + Your projects 续作行(带进度) + Trending/Drama/Thriller/Action/Horror/Sci-Fi 分类片墙,海报 hover 放大浮出 播放/加入/logline,点开弹影片详情浮层(Play/Remix into project/Save,Esc 关)。暖白 chrome + 墨色文字 + Buzz 橙作唯一强调色;海报为彩色影像内容,底部 scrim 保证白色片名可读。刻意避 AI 味:无渐变字/无 emoji/单一强调色/主题不翻转。点 Create Project 后右卡内切换成会话页(不跳路由):底部 composer(传产品图 + brief + Image/Video/模型/时长)→ Generate 走生成骨架 → 进入分镜看板 Storyboard:顶部「产品参考 + Consistency locked + Cinematic/16:9/Seed」一致性锁定条,按 Scene 分组的关键帧卡(编号/时长/景别/旁白,hover 可重生/编辑),底部「N shots · 时长 + Generate clips」。演示长视频广告的一致性链路,四阶段贯通(面包屑 Brief›Storyboard›Clips›Export):① composer 传产品图+brief → ② Storyboard 分镜看板(锁参考/风格 + 按场关键帧)→ ③ Clip timeline 渲染队列(逐镜 queued/rendering %/ready 交错动画 + 单镜重生 + 全部就绪才可合成)→ ④ Assembly 时间线编辑器(预览播放器 + Video/Audio/Text 三轨按时长对齐 + 播放头 + Export)。另有第二条生成路径:composer 顶部「Storyboard / Consecutive」模式切换,Consecutive 锁 Seedance 2.0(专属),写一句概念 → AI 拆成 5s beat 列表(可增删改)→ 首尾帧链式续拍(顺序渲染,每段「last frame becomes the next first frame」)→ 同一 Assembly 合成。全程暗色单一橙色强调、无渐变字/无 emoji。",
    date: "2026-07-10",
    href: "/prototypes/ad-studio",
    version: "归档",
  },
  {
    slug: "mcp",
    title: "BuzzVideo MCP · 落地页(对标 Magnific)",
    desc: "按 magnific.com/mcp 的信息架构 1:1 复刻的 BuzzVideo MCP 落地页:深色 hero + 客户端 tabs 连接面板(mcp.buzzvideo.ai)→ 浅暖白 body(All inside the chat 能力行、大 demo、feature 分段、MCP vs Agents 对比、Prompts 示例、FAQ)→ 深色多栏 footer。文案 BuzzVideo 原创,素材用真实 BuzzVideo 视频 + 真渲染 in-client 聊天。",
    date: "2026-07-08",
    href: "/prototypes/mcp",
    version: "归档",
  },
  {
    slug: "admin-cost-console",
    title: "Admin 成本后台 · Cost Console",
    desc: "PressLogic 内部 admin 原型:按用户名/邮箱/日期搜索账户,下钻「用户 → 项目 → task」三层,看每个 image/video/canvas/agent 的真实美元成本($)。顶部汇总条显示总成本/用户数/task 数/Top3 最烧钱用户;用户详情按项目分组、展开看单个 task 的模型/参数/单价,类型筛选贯穿两层。纯前端 mock,同页切换列表/详情。",
    date: "2026-07-06",
    href: "/prototypes/admin-cost-console",
    version: "归档",
  },
  {
    slug: "upgrade-model-guidance",
    title: "升级引导 · 生成结果 Upsell",
    desc: "Marketing Agent 生成结果后的升级 upsell 引导。用户在对话里确认 route → agent 用免费模型(Seedream 5.0 lite)生成 4 张 1:1 图 → 图片下方一句克制的灰色提示引导升级换更高质量模型:「Upgrade to generate higher quality and more accurate text rendering image.」+ 品牌橙色 Upgrade 文本链接。刻意去掉 sparkles / 渐变按钮 / 药丸卡等 AI 模板感,做成产品原生的安静 nudge。",
    date: "2026-07-03",
    href: "/prototypes/upgrade-model-guidance",
    version: "v1.7",
  },
  {
    slug: "seedance-2-5",
    title: "Seedance 2.5 · SEO 落地页",
    desc: "复刻 Dreamina Seedance 2.5 AI 视频生成器 SEO 落地页:结构与文案 1:1 还原(Hero/四大功能/收益/用例/三步上手/创作者证言/FAQ/更多工具/更多模型/结尾视频墙),换上 Buzz 橙高级感视觉——招牌渐变、圆润卡片、视频自动播放展示、影院级首屏。整页统一暖橙体系,避免 AI 模板感。",
    date: "2026-06-25",
    href: "/prototypes/seedance-2-5",
    version: "v1.3",
  },
  {
    slug: "pricing-plan",
    title: "Pricing Plan",
    desc: "定价方案原型(外部链接,点击在新标签页打开)。",
    date: "2026-06-23",
    href: "https://prototype-project-five.vercel.app/v1.2",
    version: "v1.2",
    external: true,
  },
  {
    slug: "affiliate-bold",
    title: "Affiliate 落地页 · 重新设计",
    desc: "旗舰 affiliate 页的重新设计 B 版:跳出 design.md 品牌体系,深色影院级编辑风——Bricolage 编辑体巨型字、视频跑马灯主导首屏、橙色作唯一强调色、编号大列表 How it works、深色玻璃计算器、横向滚动证言。与 rebuild 版对比挑选。",
    date: "2026-06-23",
    href: "/prototypes/affiliate-bold",
    version: "v1.3",
  },
  {
    slug: "asset-library",
    title: "Asset Library · 历史记录",
    desc: "Gemini 式的独立资产模组(左侧导航入口之一)。把跨 session 生成 + 用户上传的素材聚成等大网格,按日期分组,一级 Tab 分 All/Images/Videos/Audio/PDF。管理工具条含 Upload 入口、排序(Newest/Oldest)、批量多选(下载/取消)、筛选(来源:全部/AI 生成/用户上传)。图片直接展示、视频 hover 自动播放、点卡弹详情(大图/播放器 + Model config 键值块 + 下载/回到 session/重新生成)。空状态有扇形预览卡 + Generate。",
    date: "2026-06-15",
    href: "/prototypes/asset-library",
    version: "v1.5",
  },
  {
    slug: "brand-kits",
    title: "Brand Kits · 品牌资产",
    desc: "品牌资产模组(与 Asset Library 同壳、左侧导航另一入口)。卡片网格列出多个品牌(logo 首字母块 + 网站 + voice 描述 + 色板预览)外加「New Brand Kit」。点进编辑态含六字段:Brand logo(上传区)、Brand name、Brand description、Website、Brand color(色块+HEX,可加色)、Brand fonts(标题/正文)。生成时由 marketing agent 自动调用,保证产出统一在品牌调性内。",
    date: "2026-06-15",
    href: "/prototypes/brand-kits",
    version: "归档",
  },
  {
    slug: "starter-guide",
    title: "Starter Guide · 新手引导",
    desc: "Buzz Agent 首页的 6 步新手引导(Web & Mobile):复刻产品外壳(左侧导航 + composer + hero),进页面弹欢迎卡,点「Start the tour」后用聚光灯遮罩 + 气泡逐步高亮 6 个关键操作——① Marketing Agent 选择器 ② Auto 模式 ③ Agent ④ Chat ⑤ Workflows ⑥ Canvas。气泡含步骤计数、进度点、Back/Next/Finish、Skip,支持方向键/Esc。桌面高亮左侧栏,移动端无侧栏改高亮底部 tab bar,聚光灯随目标自动定位。结束弹完成卡,底部有「重新开始」演示按钮。",
    date: "2026-07-03",
    href: "/prototypes/starter-guide",
    version: "归档",
  },
  {
    slug: "marketing-agent-missions",
    title: "Marketing Agent · Web Search Mission Gallery",
    desc: "为 marketing agent 接入 web read/search 能力的 use case 卡库:复刻竞品「Ask anything + 分类 tab + 卡片网格」骨架,套 Buzz 品牌色。37 个 mission 分 Research/Creatives/Ad Launch/Analysis/Automation 五类,需联网的卡片右上角打 🌐 Web Read / 🔍 Web Search 标签,点卡把预设 prompt 填进输入框。",
    date: "2026-06-12",
    href: "/prototypes/marketing-agent-missions",
    version: "v1.3",
  },
  {
    slug: "generation-queue-upsell",
    title: "生成排队 · 升级加速引导",
    desc: "图片/视频生成等待态的升级引导:4 张卡片跑生成动画,非 Ultra 档约 8s 后网格中央浮现升级卡(Fast Lane processing + up to 12 并发),Ultra 纯动画不打扰。含 Free/Starter/Pro/Ultra 套餐切换演示。",
    date: "2026-06-11",
    href: "/prototypes/generation-queue-upsell",
    version: "v1.7",
  },
  {
    slug: "credits-topup",
    title: "Credits Top-up(充值)",
    desc: "充值功能嵌进账户设置弹窗(Account / Billing / Usage / Top-up 四 tab),仅对付费用户开放:Free 用户 Top-up tab 仍可见但内容上锁,充值包虚化置后、中央盖一层升级 gate(Need more credits?)把好奇心转成升级转化。身份模型复刻真实订阅页的三个维度——Tier(Free/Starter/Pro/Ultra)× 计费(Monthly/Yearly)× Ultra 容量(×1/×2/×4),演示控制器同样三件套切换,共 11 个身份。主体是一次性 top-up 包(不过期、单价固定 $0.01/credit、故意高于订阅);升级助推按真实定价走价值阶梯:月付档主推「转年付」(单价掉到 ~$0.007 真低于 top-up),年付档主推升一档/扩容(Starter→Pro→Ultra×1→×2→×4),Ultra×4 年付封顶不引导。点 Upgrade 弹 toast 模拟订阅弹窗。Buzz 橙单一口径 + 划线价 + 单价对比让升级明显更划算。",
    date: "2026-06-10",
    href: "/prototypes/credits-topup",
    version: "v1.3",
  },
  {
    slug: "2026-06-09-affiliate",
    title: "Affiliate Program 落地页",
    desc: "完整 affiliate 落地页:50% 佣金 hero、收益计算器、How it works、真实证言、FAQ、结尾 CTA 视频墙。用 Next.js + Tailwind + shadcn/ui 重构。",
    date: "2026-06-09",
    href: "/prototypes/2026-06-09-affiliate",
    version: "v1.3",
  },
  {
    slug: "onboarding",
    title: "Onboarding",
    desc: "PlayAd 广告生成产品的 onboarding 引导流程原型:登录 → 加载 → 多步生成广告。",
    date: "2026-06-04",
    href: "/prototypes/onboarding",
    version: "归档",
  },
];
