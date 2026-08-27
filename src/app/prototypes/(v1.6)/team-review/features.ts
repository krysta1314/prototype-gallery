/**
 * 团队需求的功能清单 —— 评审用。
 *
 * 按用户旅程排序,每条给出:这个功能是什么、有哪些边界状态、
 * 以及一个能直接跳进那个状态的原型链接(演示状态通过 URL 参数带进去)。
 *
 * status 是给评审用的诚实标记,不要美化:
 *   done    = 原型里已经能点通
 *   partial = 有界面但缺关键环节
 *   gap     = 需求提到了,原型里还没有
 */
export type FeatureStatus = "done" | "partial" | "gap";

export type FeatureLink = {
  label: string;
  href: string;
  /** 说明这个链接把演示切到了什么状态 */
  state?: string;
};

export type Feature = {
  id: string;
  title: string;
  /**
   * 大模块下的小模块。同一个 section 的功能在左栏归到一条小标题下 ——
   * 「团队设置」下面有 21 条,不再分一层就没法扫。
   * 不填 = 直接挂在大模块下,不起小标题。
   */
  section?: string;
  /** 一句话说清这个功能解决谁的什么问题 */
  intent: string;
  status: FeatureStatus;
  /** 边界状态与规则 —— 评审时逐条走查用 */
  cases: string[];
  links: FeatureLink[];
  /** 已知缺口 / 待决策,诚实写出来 */
  open?: string[];
};

export type FeatureGroup = {
  id: string;
  /** 用户旅程里的阶段 */
  stage: string;
  title: string;
  blurb: string;
  features: Feature[];
};

const W = "/prototypes/team-workspace";

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "start",
    stage: "01",
    title: "起点:只有个人账户",
    blurb:
      "注册之后手上只有一个个人账户。团队不会自动出现,必须自己去建 —— 所以整条旅程从这里开始。",
    features: [
      {
        id: "personal-account",
        title: "注册后只有个人账户",
        intent:
          "注册登录进来就拥有一个个人账户。系统里只有两种账户 —— 个人账户与团队账户,视角也按这两类分。团队账户不会自动出现,必须手动创建。",
        status: "done",
        cases: [
          "个人账户不是团队:切换器里 PERSONAL 与 TEAMS 分两区列",
          "个人账户不显示成员数(团队那行才显示「N members」)—— 右边的 Personal 徽章已经说清它不是团队",
          "刚注册时 TEAMS 区是空状态,Create team 高亮成主 CTA(它就是购买入口)",
          "个人账户那行的齿轮进的是账户设置,不是团队设置",
          "个人账户没有席位、Billing Admin、团队成员这些概念,对应区块整块不显示",
        ],
        links: [
          { label: "刚注册 · 无团队", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" },
          { label: "已有团队", href: `${W}/home?role=owner`, state: "个人账户 + 2 个团队" },
        ],
      },
    ],
  },
  {
    id: "create",
    stage: "02",
    title: "建团队 → 去订阅",
    blurb:
      "点 Create team 只是填个名字;真正发生的是「去订阅、付款,拿到一个已付费的团队」。付款成功之前团队不存在。",
    features: [
      {
        id: "create-team",
        title: "购买即建团队",
        intent:
          "对齐 ChatGPT Team / Claude Team:团队没有免费档,「购买」这个动作本身就是「创建团队」这个动作。付款成功之前团队不存在;付款成功之后团队一诞生就是付费的、席位已就位、可以直接邀请人 —— 不需要任何 upgrade-to-invite 引导,也不会攒出一堆只有一个人的僵尸免费团队。",
        status: "done",
        cases: [
          "入口在切换器底部的 Create team;刚注册时它是高亮的主 CTA",
          "点 Create team 直接去订阅页 —— 建团队没有独立向导,它就是购买流程本身",
          "四步落在两个页面:订阅页挑档位与席位 → CreateTeamModal 填团队名 → 收银台付款 → 回工作区邀请",
          "收银台是照 Stripe Checkout 版式复刻的演示页,不接真实支付 —— 真实实现里这一步会离站去 Stripe 托管页",
          "可自助购买的只有 Team / Scale —— Free 只属于个人空间;Enterprise 由 sales 在 admin portal 开户,不走自助",
          "按席位计价:Team $89/席(2–9)、Scale $169/席(5–30),席位数就是购买数量,结算摘要实时算总价",
          "付款按钮写明金额:Pay $445 and create team,不写含糊的 Continue",
          "结算页说明个人空间的套餐与账单是独立的两笔",
          "付款中按钮 loading 且不许关弹窗,避免连点买出两个团队",
          "买单人自动成为 Owner,并自动切到新团队",
          "创建后写两条 Activity Log:created <团队名> + subscribed to <套餐> with N seats",
          "付款成功先把团队写进 localStorage 的 PENDING_TEAM_KEY,工作区一加载就落成真实团队并立刻清 key,刷新不会重复建",
          "回跳带 ?invite=1,落地即弹出邀请成员弹窗(已定)—— 付款后第一件事就是拉人",
          "为什么是弹窗而不是打开设置的 Members:那一刻用户只有「邀请」这一件事要做,把七个 tab 的设置面板推到他面前是把一件事变成七件事",
          "为什么不做成收银台的第四步:收银台在 pricing 路由下,那里没有 TeamProvider,而团队要到付款成功才创建 —— 邀请界面读不到 team / seats / role 任何东西",
          "邀请弹窗的开关提到了 context 并由 TeamOverlays 统一挂载,设置里的 Members 与付款回跳共用同一个,不会出现两套 state",
        ],
        links: [
          { label: "刚注册时的购买入口", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" },
          { label: "订阅页 · Business", href: "/prototypes/pricing?group=business", state: "挑档位与席位" },
          { label: "收银台", href: "/prototypes/pricing/checkout?plan=team&cycle=yearly&seats=3&name=Acme", state: "Stripe Checkout 高仿页" },
          { label: "已付费团队 · 可邀请", href: `${W}/home?team=t-growth&role=owner&seats=ok`, state: "Owner · Scale · 席位充足" },
        ],
        open: [
          "付款失败 / 3DS 验证的中间态没做,真实实现要能停在收银台重试",
          "买出来的团队只存在内存里 —— 离开 home 页就消失,activeTeamId 静默回落到种子团队。这是购买链路演示的头号障碍,要落 localStorage",
          "个人已有付费套餐时买团队不折抵、两笔独立计费(已定),界面文案已经这么写了",
          "邀请弹窗还没有「购买后」的专属文案 —— 复用的是通用版,可以加一句「N 个席位已付费,现在就能拉人」",
        ],
      },
      {
        id: "sub-first",
        title: "首次订阅 business 套餐",
        intent:
          "点 Create team 之后直接进订阅页 —— 不是弹窗里塞一个迷你套餐列表。同一个套餐从官网买和从产品里买必须同价,否则客户一对比就会问。",
        status: "done",
        cases: [
          "月付 / 年付切换,年付统一 30% off(Team $89 → $63/席、Scale $169 → $119/席)",
          "卡片显示按周期的每席价,年付划掉月付价",
          "席位步进器受套餐区间约束(Team 2–9、Scale 5–30),换档时把席位夹回新档区间",
          "结算摘要逐行:套餐单价 / 席位数 × 单价 / 每席额度 / 按年还是按月收",
          "付款按钮写明金额与周期,年付写年费总额",
          "副标题说清「每个团队有自己的订阅,个人套餐独立计费、互不折抵」",
        ],
        links: [
          { label: "刚注册 · 走完整流程", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" },
        ],
      },
    ],
  },
  {
    id: "invite",
    stage: "03",
    title: "邀请成员",
    blurb:
      "团队一诞生就是付费的、席位已就位,所以下一步立刻是邀请 —— 不需要任何 upgrade-to-invite 的中间引导。",
    features: [
      {
        id: "invite",
        title: "邀请成员",
        intent: "Owner / Admin 拉人进来,邀请时就要选好角色,避免进来之后再补权限。",
        status: "done",
        cases: [
          "无前置条件:团队本身就是买出来的,席位在创建时已就位",
          "支持一次贴多个邮箱,逐个校验格式与重复",
          "邀请时选角色:Admin / Member(只有 Owner 能授予 Billing Admin)",
          "预估席位:当前占用 + 本次邀请人数 > 总席位时给出提示",
          "席位不够分两种,出口完全不同:还能加席位 → 「Add seats」;已撞到套餐上限 → Team 给「Upgrade to Scale」、Scale 给「Contact sales」",
          "必须在点之前就说清 —— 之前一律写 Add seats,Owner 点下去只收到一个「加不了」的 toast,按钮承诺了一件做不到的事",
          "非 Owner 的提示同步分叉(Ask your owner to upgrade / to contact sales),否则 Member 去要席位、Owner 说加不了,又绕一圈",
          "Scale 从「超 30 可自助继续买」改成硬上限 30(2026-08-25)—— 之前与订阅页滑杆 5–30 矛盾,等于同一个产品两套规则",
          "额度按席位按周期发放,与占用人无关:付了几个席位的钱,这个月就发几份额度,一份不多",
          "所以「开新席位」只在还有未发过额度的席位时可选:可开新席位数 = 付费席位数 − 在座人数 − 空席位数",
          "空席位要减掉,它那份已经发过了 —— 不减就有一条白拿路径:移除一个人 → 重新邀请他 → 选新席位 → 席位数没变、没多花钱,却又发一份完整额度",
          "反过来「买 9 席只坐 7 人」时那 2 份确实没花过、钱也付了,新人拿满额正当 —— 所以判据是「额度发没发过」,不是「有没有空席位」",
          "发满时说明文字要讲清是「这个月额度已发完」而不是「席位不够」,并写明下个账期全部重置",
          "发出去之后停在回执屏,不是静默关弹窗 —— 邀请是往外发邮件的动作,关掉就当没事发生的话,用户没法确认发出去没有、发给了谁",
          "回执要说清三件事:发给了谁(逐个列出)、链接 7 天过期、席位或额度被动了什么",
          "回执按邀请类型分三种说法:普通成员报「席位 N/M、新席位拿多少额度」;接手空席位报「额度跟着席位过去了,没多占席位」;Billing Admin 报「不占席位,只进账单页,不进成员表」",
          "回执给「Invite more」回到空表 —— 批量拉人是常态,不该逼用户关掉再点一次入口",
        ],
        links: [
          { label: "席位充足", href: `${W}/home?role=owner&seats=ok`, state: "Owner · 席位充足" },
          { label: "席位已满", href: `${W}/home?role=owner&seats=full`, state: "Owner · 席位已满" },
        ],
      },
      {
        id: "invite-landing",
        title: "邀请落地页",
        intent: "被邀请的人点邮件链接后看到的页面。这里必须能拦住「接受邀请后进入一个满员团队」。",
        status: "done",
        cases: [
          "正常态:显示团队名、邀请人、将获得的角色,可接受",
          "未注册:CTA 变成「Sign up to accept」",
          "席位已满:Accept 禁用并说明原因,而不是让人接受后再报错",
          "链接已过期:Accept 禁用、按钮文案改成 Invitation expired,并说明有效期 7 天、请邀请人重发",
          "过期态还要说清「这个席位从未被占用,团队侧无需清理」—— 否则用户会担心自己占了别人的位子",
        ],
        links: [
          { label: "已登录 · 可接受", href: `${W}/invite?invite=signed-in`, state: "已登录" },
          { label: "未注册", href: `${W}/invite?invite=signed-out`, state: "未注册" },
          { label: "席位已满", href: `${W}/invite?invite=seats-full`, state: "席位已满 · Accept 禁用" },
          { label: "链接已过期", href: `${W}/invite?invite=expired`, state: "已过期 · Accept 禁用" },
        ],
      },
      {
        id: "billing-contact",
        title: "邀请 Billing Admin",
        intent: "企业客户的财务不需要产品权限,只要收发票。给他一个独立入口,并且不占付费席位。",
        status: "done",
        cases: [
          "Billing Admin 走 billing-only 免费席位,不计入付费席位",
          "Billing Admin 没有产品权限:设置里只看到 Credits / Top-up / Billing / Activity",
          "成员表里 Billing Admin 那行用量显示「No product usage」",
        ],
        links: [{ label: "Billing Admin 视角", href: `${W}/home?role=finance`, state: "Billing Admin" }],
      },
    ],
  },
  {
    id: "settings",
    stage: "04",
    title: "团队设置",
    blurb:
      "团队建好之后的全部配置项。下面的小模块与产品里设置面板的八个 tab 一一对应,走查时左边点到哪一条,右边打开的就是产品里对应那一页。",
    features: [
      {
        id: "transfer-owner",
        section: "General",
        title: "转让 Owner",
        intent: "Owner 离职是每个团队上线后都会撞到的边界,提前处理掉。",
        status: "done",
        cases: [
          "团队只能有一个 Owner:转让后原 Owner 自动降为 Admin",
          "支付方式留在团队,不随 Owner 走 —— 这句文案在 Billing 页常驻",
          "Owner 不能直接离开团队,必须先转让",
          "转让写进 Activity Log",
        ],
        links: [{ label: "团队设置 · Team Details", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "usage-visibility",
        section: "General",
        title: "成员用量可见性",
        intent: "Member 只看自己的用量;Owner / Admin / Billing Admin 看全部。",
        status: "done",
        cases: [
          "Member 视角下他人行的用量列显示「—」",
          "自己那行照常显示已用 / 上限与进度条",
          "Credits and Usage 的「按成员用量」表对 Member 整块不显示",
          "团队开关:Owner 可在 Team Details 里把用量对全员公开,默认关闭",
          "开关切换会写进 Activity Log",
        ],
        links: [
          { label: "Member 视角", href: `${W}/home?role=member`, state: "Member · Team Members" },
          { label: "Admin 视角", href: `${W}/home?role=admin`, state: "Admin · Team Members" },
        ],
      },
      {
        id: "role-matrix",
        section: "Members 与席位",
        title: "四角色能力边界",
        intent: "四个角色到此为止(能力可编辑,见「权限矩阵可编辑」):Owner 管钱和一切;Admin 管人和额度但不能动支付;Billing Admin 只管账单、不占席位、无产品权限;Member 只管创作。席位本身不再分类型(不做 Standard / Premium 这种档位),能不能用贵模型由团队额度决定,不由席位类型决定。",
        status: "done",
        cases: [
          "只有 Owner 能换套餐、加席位、买积分、授予 Billing Admin",
          "Admin 能改成员角色与月度上限,但看不到 Credits Top-up 页",
          "Member 看到「Only owners and admins can invite…」这类说明,而不是灰按钮",
          "Billing Admin 没有产品权限,进创作页会被拦",
        ],
        links: [
          { label: "Owner", href: `${W}/home?role=owner`, state: "Owner" },
          { label: "Admin", href: `${W}/home?role=admin`, state: "Admin" },
          { label: "Billing Admin", href: `${W}/home?role=finance`, state: "Billing Admin" },
          { label: "Member", href: `${W}/home?role=member`, state: "Member" },
        ],
      },
      {
        id: "seat-rules",
        section: "Members 与席位",
        title: "席位口径",
        intent: "「我付了 10 个席位,为什么只能用 7 个」——这个问题要在界面上被提前回答。",
        status: "done",
        cases: [
          "待接受(pending)的邀请占席位",
          "已过期的邀请不占席位",
          "Billing Admin 不占付费席位",
          "席位卡上常驻这三条说明,不用去看帮助文档",
        ],
        links: [{ label: "Credits and Usage · 席位卡", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "add-seats",
        section: "Members 与席位",
        title: "加席位",
        intent: "席位不够时当场买,按月计价、按比例分摊。",
        status: "done",
        cases: [
          "步进器选数量,实时算 +N seats · $N/mo · 当前 X/Y",
          "只有 Owner 能买;Admin / Member 走申请",
          "「席位变更需在续费前 24 小时完成才影响本期账单」这类计费口径待确认",
        ],
        links: [{ label: "Billing · Add seats", href: `${W}/home?role=owner&seats=full`, state: "Owner · 席位已满" }],
        open: ["席位变更的计费生效时点还没定(立即按比例扣 / 下期生效)"],
      },
      {
        id: "remove-member-content",
        section: "Members 与席位",
        title: "移除成员时必须指定画布继承人",
        intent:
          "画布仅创建者可编辑、团队成员只读,所以人一走,他建的团队画布就变成谁都改不了的只读内容。移除必须在同一步选定继承人,否则团队里会慢慢积一堆无主作品。",
        status: "done",
        cases: [
          "移除走独立弹窗,里面必须选「谁继承他的项目与资产」,默认落在 Owner(永远存在、不会被移除)",
          "候选人只列留下来的、占席位的成员 —— Billing Admin 没有产品权限,不能当继承人",
          "继承后画布卡片上的作者换成继承人,并标 (inherited),看得出这作品原来不是他的",
          "继承人从此可编辑该画布,其余成员仍是 READ-ONLY",
          "连环继承成立:A 走了给 B,B 又走了给 C,A 的作品最终归 C",
          "Activity Log 与 toast 都写明「... now belong(s) to <继承人>」,留痕可追",
          "Owner 自己不能被移除,只能先转让所有权再离队",
          "Billing Admin 不能接收所有权 —— 它 billing-only、不占席位、没有产品权限,接了等于凭空多出一个不能创作的 Owner",
          "所以「只剩 Owner + Billing Admin」时 Owner 走不掉:移除自己被禁、转让没人可转。本期维持单 Owner 模型,不做绕道,但必须把话说清楚",
          "转让区在候选人为空时直接说明:为什么没人可选、怎么解(先邀请一个成员)、不想解怎么办(删除团队)。空下拉 + 灰按钮零解释是最难受的一种死路",
          "对照:GPT 与 Claude 的 Owner 都可以有多个,且没有 billing-only 角色 —— 能当 Owner 的人一定有产品权限,所以他们不会撞上这个。ChatGPT 的做法也是明确报错「You are the last Owner in the workspace」,同样不设计绕道",
          "移除 Billing Admin 不需要选继承人 —— 他没有产品权限、没有作品",
        ],
        links: [
          { label: "Owner 视角 · 成员页", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · 已有团队" },
          { label: "看继承结果 · Team Projects", href: `${W}/canvas?team=t-growth&role=owner`, state: "Owner · 团队画布区" },
        ],
        open: ["移除后是否给被移除者一份导出(他自己的私有草稿要不要带走),没定"],
      },
      {
        id: "permission-matrix",
        section: "Permissions & roles",
        title: "权限矩阵可编辑",
        intent:
          "四个角色固定,但每个能力对每个角色是否开放由团队自己定 —— 设置里有一张「能力 × 角色」矩阵,Owner / Admin 直接点格子改,改完产品各处的按钮立刻跟着变(不是只改说明文字)。",
        status: "done",
        cases: [
          "Owner 列永远全给,且不可编辑(否则能把自己锁死)",
          "防提权(权限页):不能编辑自己那一列 —— Admin 有 Can manage 也不能给 Admin 自己加权限",
          "防提权(成员表):改角色住在成员表,权限页那条规则管不到它,必须单独堵。三条一起才闭合 —— 不能改自己、不能改比自己高的人、不能授予高于自己的角色",
          "同级可互改(2026-08-25 定):Admin 能改另一个 Admin。团队规模不大且 Owner 永远可兜底,禁止同级会让 Owner 变成日常瓶颈",
          "Billing Admin 的授予与收回都只有 Owner 能做 —— 之前只挡了授予,Admin 能把 Billing Admin 改成 Member",
          "前端隐藏不是防线:同一份判断在 context 里再写一遍,对应真实实现的服务端校验",
          "结构性权限带锁,谁都改不了:转让所有权、删除团队、换/取消套餐、授予 Billing Admin、以及 Billing Admin 的产品权限",
          "改动真实生效:关掉 Admin 的「Invite members」后,Admin 视角下成员页的邀请按钮直接消失",
          "每次改动写一条 Activity Log(granted / removed + 能力名 + 角色),并弹 toast 复述",
          "偏离默认值时出现「Reset to defaults」,一键回到出厂配置",
          "矩阵与代码共用 data.ts 的 PERMISSION_GROUPS,rowId 是稳定 key,改文案不会丢配置",
        ],
        links: [
          { label: "Owner 视角 · 可改三列", href: `${W}/home?role=owner`, state: "Owner" },
          { label: "Admin 视角 · 只能改 Member 列", href: `${W}/home?role=admin`, state: "Admin" },
        ],
        open: [
          "权限覆盖目前只存在内存里(刷新回默认),真实实现要落库并按团队隔离",
          "是否允许「自定义角色」(而不只是改四个固定角色的能力)—— 暂不做,等企业客户真的提",
        ],
      },
      {
        id: "security",
        section: "Security & data",
        title: "登录方式:SSO / SCIM / 2FA / 会话时长",
        intent:
          "采购问卷第二页问的东西。SSO 与 SCIM 是 Enterprise 权益(定价页矩阵里就是这么卖的),强制 2FA 与会话时长所有付费团队都能用 —— 这条决定了单能不能签,不是体验优化。",
        status: "partial",
        cases: [
          "SSO 五选一:未配置 / Okta / Microsoft Entra ID / Google Workspace / Custom SAML 2.0",
          "SSO 可设为强制 —— 强制之后成员只能走 IdP 登录",
          "SCIM 自动开户/销户开关,与 SSO 同属 Enterprise",
          "强制 2FA 与「多少天不活动自动登出」对所有付费团队开放",
          "安全设置按团队存 —— 切团队不会把别人的 SSO 配置带过来",
          "非 Enterprise 团队看到 SSO / SCIM 是锁态并写明属于 Enterprise,不是灰按钮",
        ],
        links: [
          { label: "Enterprise · 可配 SSO", href: `${W}/home?team=t-atlas&role=owner`, state: "Owner · Enterprise" },
          { label: "Scale · SSO 锁态", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · Scale" },
        ],
        open: [
          "配置只在内存里,刷新回默认 —— 真实实现要落库并按团队隔离",
          "SAML metadata 上传、证书轮换、IdP 连通性自检都没做,真实实现少不了",
        ],
      },
      {
        id: "data-controls",
        section: "Security & data",
        title: "数据与留存",
        intent:
          "采购问卷的第一页就问这两件事:会不会拿我们的素材训练模型、东西留多久。两个答案都是既定事实,所以两句都不是开关。",
        status: "done",
        cases: [
          "两句声明,都不可切换:不用于训练、不按时限删除",
          "不做成开关是有意的 —— 开关意味着它可以被打开,采购看到只会追问默认值是什么、谁能改",
          "训练那句把范围说全:prompt、上传、成品都不参与,且对所有付费团队永久生效",
          "「没有留存周期」是决定而不是待做:东西留到用户自己删,订阅终止之后也一样",
          "「没有留存窗口」听起来像少做了一个功能,其实是采购问卷上最好的那个答案 —— 竞品要在合同里谈 30 / 90 / 365 天,我们这一栏直接写「不删」",
          "删除权在用户手上:单条删、整团队删都可以",
          "发票是唯一例外,按税法要求单独留存 —— 这句要写出来,否则「不删」和「发票还在」看起来矛盾",
        ],
        links: [
          { label: "Security & data", href: `${W}/home?team=t-growth&role=owner&settings=security`, state: "Owner · Scale" },
        ],
        open: [
          "客户主动要求「立刻删除全部数据」(DSR / 合同终止)的通道没做 —— 我们不按时限删,但客户要求删时必须删得掉,这两件事不冲突",
        ],
      },
      {
        id: "connectors",
        section: "Security & data",
        title: "连接器治理(暂不做)",
        intent:
          "「我们的素材会流到哪里去」是采购一定会问的,但前提是我们真的有第三方集成 —— 现在一个都还没有。做治理界面会让人以为已经接了 Google Drive 和 Meta Ads,所以整块撤掉,等集成上线再回来。",
        status: "gap",
        cases: [
          "曾经建过一版并撤掉:六条连接带 Brings data in / Sends data out 方向徽章、「成员能否自己接账号」总开关、Enterprise 独占 API & webhooks",
          "撤掉的理由不是设计问题,是产品事实 —— 集成本身不存在",
        ],
        links: [],
        open: [
          "等集成真的上线再做,届时要一起做的还有「已连接的账号是谁的、什么时候连的」这份实例明细 —— 治理最终要看到实例,不只是开关",
          "禁用一条正在被自动化流程使用的连接会怎样(直接断还是给宽限),到时候再定",
        ],
      },
      {
        id: "model-access",
        section: "Security & data",
        title: "模型开关(暂不做)",
        intent:
          "让管理员按团队禁掉高价模型,本意是成本控制。评审后判断必要性不足 —— 撞墙那条链路(告警、拦截、申请、top-up)已经把成本问题接住了,再加一层「哪些模型能用」只是多一处要解释的配置。",
        status: "gap",
        cases: [
          "曾经建过一版并撤掉:17 个模型逐个开关、按单次消耗从贵到便宜排、每行印 N credits each、关掉后首页模型卡片真实消失、至少留一个开着",
          "撤掉的理由是必要性而不是实现 —— 真要做,那一版的形态可以直接捡回来",
        ],
        links: [],
        open: [
          "如果将来客户真的提,优先做的不是「关模型」而是「按功能关」(允许 Seedance 但禁 4K / 禁音频)—— 那个才是采购真正在问的粒度",
        ],
      },
      {
        id: "quota-model",
        section: "Credits & usage",
        title: "额度模型:两套,按套餐分叉",
        intent:
          "Team / Scale 每席固定额度、不成池;只有 Enterprise 才是共享池并可按人分配。这条口径决定了撞墙文案与成员页的形态,也决定自动充值充给谁(席位 vs 池)。",
        status: "done",
        cases: [
          "Team / Scale(per-seat):每席位每月固定 8,900 / 16,900,归该席位本人",
          "per-seat 不汇成池 —— 同事没用完的额度借不到,管理员也不能在人之间分配",
          "per-seat 额度不够只有两条路:给这个席位单独买 top-up,或升档",
          "Enterprise(pool):整个组织一个共享池,管理员按人分配额度,未分配的可开 pour-over 回流",
          "top-up 两种模型都能按人买:买给谁归谁、不共享、不回流、**永久有效**",
          "永久有效是 2026-08-25 推翻 rate card「12 个月」后定的:top-up 是订阅之外额外付钱买的存量,不是周期内的权益;收了钱再设时限等于卖出去的东西过期没收",
          "而且有效期压制的正是最该被鼓励的购买 —— top-up 毛利最高、销售成本为零,加时限后用户的最优策略变成小额多次买",
          "唯一的失效场景:团队删除 / 账号注销时一并失效,不单独退款",
          "所以数据结构就是一个余额:没有批次、没有到期日、不需要定时清算",
          "扣减顺序:当月额度先扣,再扣 top-up —— 这句文案常驻在 Credits 页",
          "优先级只有一份:订阅(周期清零)→ 充值 top-up → 新用户赠送 500 → 邀请好友。变的只是每个语境下存在哪几个桶",
          "团队席位只有前两个桶(席位上没有「赠送」与「邀请」这回事);个人账户四个都可能有",
          "个人与团队的额度不跨界(2026-08-25 定):个人的带不进团队,团队的也回不到个人",
          "不跨界是为了保住一件事:团队的消耗永远等于团队买的东西。个人额度一旦能在团队里花,Analytics 的「谁花了多少」就不再等于 Owner 分配的额度",
          "代价要提前讲:Member 席位用完时个人钱包里有钱也用不了,文案要和「同事的额度不能转给你」放在一起说",
          "per-seat 团队看不到「设分配额度」—— 每席固定额度就是上限,没有可分配的东西。但自动充值两边都有,只是充的对象不同",
          "AI Tokens 是内部口径,Client 端不暴露",
        ],
        links: [
          { label: "per-seat · Scale", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · Scale 每席 16,900" },
          { label: "pool · Enterprise", href: `${W}/home?team=t-atlas&role=admin`, state: "Admin · 共享池 + 按人分配" },
        ],
      },
      {
        id: "member-limit",
        section: "Credits & usage",
        title: "按人分配额度(仅 Enterprise)",
        intent:
          "从组织共享池里切一块给某个人,所以叫 allocation 而不是 limit。Team / Scale 每席固定额度,天然就是上限,没有可分配的东西,这整块界面在那两档不出现。",
        status: "done",
        cases: [
          "三档:No allocation / Soft cap / Hard cap,各带解释",
          "统一叫「Allocation」,弹窗内显示重置日期",
          "per-seat 团队的成员页看不到编辑入口,取而代之的是「席位额度 X · 已用 Y · Top up」",
          "未分配额度可开 pour-over 回流池中,开关在 Credits & usage 页",
          "改动写进 Activity Log",
        ],
        links: [
          { label: "Enterprise · 编辑分配", href: `${W}/home?team=t-atlas&role=admin`, state: "Admin · Enterprise" },
          { label: "per-seat · 无分配入口", href: `${W}/home?team=t-growth&role=admin`, state: "Admin · Scale" },
        ],
      },
      {
        id: "model-cost",
        section: "Credits & usage",
        title: "单次消耗标注",
        intent: "让用户在撞墙前能自己控制节奏,而不是事后才知道刚那条视频花了 240 credits。",
        status: "done",
        cases: [
          "首页模型卡片不标单价(已撤)—— 卡片是入口不是价目表,每张都挂一行数字会把首页变成账单",
          "估价只出现在 composer:按当前选中模型实时算,那一刻用户正要花钱,才是该看到价格的时候",
          "余额不足时估价胶囊转红",
        ],
        links: [{ label: "首页模型卡片", href: `${W}/home?role=owner`, state: "Owner" }],
        open: ["真实定价由后端配置,现在是前端占位数字"],
      },
      {
        id: "usage-analytics",
        section: "Credits & usage",
        title: "用量分析(诊断页)",
        intent:
          "Owner 打开 Analytics 的真实动机不是「我想知道花了多少」,而是「够不够用、要不要现在做点什么」。所以这一页给的是预测和结论,不是报表。",
        status: "done",
        cases: [
          "**Burn rate 排第一**:按当前速度预测期末消耗,并直接给结论 —— 会不会在账期结束前用完",
          "口径全部写在界面上:日均 = 本账期已用 ÷ 已过天数;预计期末 = 日均 × 账期总天数;还能撑 = 剩余额度 ÷ 日均",
          "一条进度条同时画「已用」(实心)和「预计」(半透明),不拆成两条",
          "会用完时给橙色结论条 + 「Buy a top-up」按钮;没权限买的角色改成「去找 Owner」的说明,不留死胡同",
          "账期过了不足 2 天不预测 —— 一天的数据外推一个月得出来的数字没有意义",
          "Burn rate **不跟随**上方的时间范围选择器,它算的永远是当前账期,换范围会让预测失去意义",
          "**按模型改成横向条形 + 环比**,不再用堆叠面积图:堆叠图里只有最底下那条能读出真实趋势,其余都被下方序列推着走,结构上答不了「谁在涨」",
          "每行可展开,展开后单独画这一个模型的日线",
          "环比口径写在图下面:后半段 vs 前半段",
          "**按成员那张图删掉**,改成一条去 Credits & usage 的入口 —— 那边同一份数据带配额对比和百分比,严格更好用。同一份数据在两页各画一遍只会让人不知道信哪页",
          "去掉 Export CSV(2026-08-25 决定)",
          "图是全团队口径 —— per-seat 团队里 quota.used 只是「我这个席位」的消耗,不能拿它当分母",
          "Member 视角看不到去按成员用量的入口(与成员用量可见性同一套规则)",
        ],
        links: [
          { label: "健康:预计 54%", href: `${W}/home?team=t-growth&role=owner&settings=analytics`, state: "Owner · Scale" },
          { label: "超支:4 天后用完", href: `${W}/home?team=t-atlas&role=owner&settings=analytics`, state: "Owner · Enterprise 池" },
          { label: "Member · 只看自己", href: `${W}/home?team=t-growth&role=member&settings=analytics`, state: "Member" },
        ],
        open: [
          "数据是按种子确定性生成的,没有真实埋点",
          "预测用的是线性外推(日均 × 天数),没有考虑周末低谷 —— 真实实现可以按周内分布加权,但口径要一样写在界面上",
          "还没有 per-member 维度的下钻 —— 成员详情抽屉要等这块做完再一起做",
        ],
      },
      {
        id: "buy-credits",
        section: "Top-up",
        title: "买 top-up",
        intent:
          "额度不够时当场加油,可结转 12 个月、当月额度用尽后才扣。它不是「分配」—— 分配的前提是有一池共享额度可切,这里是额外掏钱买的增量,所以两种模型都能按人买。",
        status: "done",
        cases: [
          "三档包:50,000 / $500、200,000 / $1,900、500,000 / $4,500(与 rate card 同口径)",
          "per-seat 团队必须选「买给哪个席位」,买给谁归谁、不共享、不回流",
          "Enterprise 可选「充进共享池」或「充给某个人」",
          "成员页每一行都有 Top up 入口,直接预选那个席位",
          "只有 Owner 与账单联系人能买",
          "入账后写 Activity Log 并刷新读数",
        ],
        links: [
          { label: "per-seat · 买给某个席位", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · Scale" },
          { label: "Enterprise · 充池或充人", href: `${W}/home?team=t-atlas&role=owner`, state: "Owner · Enterprise" },
        ],
      },
      {
        id: "auto-topup",
        section: "Top-up",
        title: "自动充值",
        intent:
          "让团队不再因为忘记充值而停工;同时给财务一个月度封顶护栏。所有付费档都有,区别只在充给谁。",
        status: "done",
        cases: [
          "所有付费档都有(2026-08-25 修正,此前文档误写成 Enterprise 独有,与实现不符)",
          "Enterprise:池余额低于阈值时自动充 N credits 进池",
          "per-seat:谁低充谁 —— 任何席位低于阈值就给那个席位充。Owner 设一次阈值/金额/封顶,全团队通用",
          "为什么不是「只充 Owner 的席位」:per-seat 里撞墙的永远是 Member,他见底、提申请、等审批,这中间人是停工的",
          "为什么不是「每席各自设」:Owner 要配 N 次,人一多就没人配",
          "每次自动充值写一条 Activity Log 并写明充给了哪个席位 —— 自动花钱的动作,Owner 必须事后查得到钱去哪了",
          "月度封顶:撞顶后停止自动充并提示",
          "连续失败 3 次转 paused,给出失败原因与重试入口",
          "权限上只看角色(Owner / Billing Admin 可设),不看套餐",
        ],
        links: [
          { label: "正常", href: `${W}/home?team=t-atlas&role=owner&auto=active`, state: "Owner · Enterprise" },
          { label: "失败已暂停", href: `${W}/home?team=t-atlas&role=owner&auto=paused`, state: "Owner · 卡被拒" },
          { label: "撞月度封顶", href: `${W}/home?team=t-atlas&role=owner&auto=cap`, state: "Owner · 撞封顶" },
        ],
      },
      {
        id: "plan-change",
        section: "Billing",
        title: "套餐变更与取消",
        intent: "升降级与取消要说清楚生效时点,不然全是争议。",
        status: "done",
        cases: [
          "四档套餐,降级时若席位不够会挡住",
          "取消后保留到本周期结束",
          "只有 Owner 能操作",
        ],
        links: [{ label: "Plans and Billing", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "sub-upgrade",
        section: "Billing",
        title: "升档:立即生效、全额收、额度累加",
        intent:
          "用户想要更多,所以立即生效。计费口径已定死三条规则,核心目的是堵薅羊毛 —— 不能让人「订便宜档 → 用光额度 → 升档按天退款」。",
        status: "done",
        cases: [
          "R1 周期重置:普通续费时余额清零后再发新额度(对齐订阅页的 Credits reset at the beginning of each billing cycle)",
          "R2 升级保留:升档时旧档剩余 credits 保留,与新档额度累加 —— 不清零",
          "R3 不退款:立即扣新档全额,旧档已付的不退(proration_behavior=none + billing_cycle_anchor=now)",
          "R3 的目的是堵 abuse:否则「订 Starter → 用光 → 升 Pro 按天退款」就是一条免费额度通道",
          "周期锚点重置成今天,新的 30 天从升档当日起算;满 30 天后按新档正常续费(回到 R1 清零 + 发新额度)",
          "月升月、月升年都按这套走:立即全额付款、立即发放当月额度",
          "R3 的准确写法是「不退已发放的月份」而不是「一律不退」:年付按月发额度,升档时未发放的月份要折抵掉",
          "折抵按「未发放的月度额度期数」算,不按天:Starter 年付升 Pro 年付,12 期里有 11 期没发过 → 折抵 11 × $14 = $154,应付 $420 − $154 = $266",
          "这样既解掉年升年,又不破防薅:月升月时当月额度已经发过,折抵为 0,「订便宜档→用光→升档退款」照样堵着",
          "确认页逐行摆出来:新档年费 / 未发放月份折抵 / 今日应付 / 新周期起算日 / 下次续费日 / 新增权益 / 额度余额如何累加",
          "三个金额都按 fmtMoney 的 ceil 口径取整,而且折抵是拿显示出来的月价乘出来的 —— 这样「11 × $14 = $154」读者能自己验算,那一列也加得起来",
          "累加进来的是新档的**一期**额度而不是整年:年付按月发,升档当下到账的是月度额度",
          "团队侧的换档弹窗也有对应说明:升档讲「今天生效 + 旧额度累加 + 已发放月份不退」,降档讲「今天什么都不变 + 到期日每席掉到多少 + 可撤销 + top-up 不受影响」",
          "升降级判断按档位顺序(PLAN_RANK)而不是价格 —— Enterprise 的 priceValue 是 0(定价页写 Let's talk),拿价格比会把 Enterprise → Scale 判成升档、立即扣款",
          "业务档同理:Team → Scale 席位上限 9 → 30、每席额度 8,900 → 16,900,席位数不变只是上限变宽",
          "Team 撞到 9 席时,加席位面板的主按钮直接是 Move up to Scale",
          "已买的 top-up 余额保留 —— 那是另外付过的钱,与档位无关",
        ],
        links: [
          { label: "Team 撞顶 · 引导升档", href: `${W}/home?team=t-beauty&role=owner&seats=full`, state: "Owner · Team 席位已满" },
        ],
        open: [
          "团队侧的确认说明是文字清单,没有 individual 那样逐行算钱 —— 按席位计价要先定「席位数 × 未发放期数」怎么摆才不吓人",
          "折抵金额目前按显示价(ceil 后)乘出来,真实实现应当用后端的精确金额,避免和 Stripe 的发票差几分钱",
        ],
      },
      {
        id: "sub-downgrade",
        section: "Billing",
        title: "降档:周期末生效,期内可撤",
        intent:
          "降档立即生效等于当月白付了差价,所以一律排到周期末。这就产生「待生效变更」这个状态,也才有「取消降档」可撤。",
        status: "done",
        cases: [
          "新档席位上限装不下现有成员时禁止降档(已定):提示先移除成员或选更大的档,Switch 按钮禁用",
          "为什么是「挡住」而不是自动释放或自动停用:谁出局该由客户自己决定,而且这样不会撞上「移除成员必须指定画布继承人」那条规则",
          "点降档当场什么都不发生 —— 当前周期内继续享受原档的全部权益与额度",
          "到 period_end 自动切档,按新档价格扣款、发新档额度,并回到 R1(余额清零)",
          "账单页常驻待生效横幅:「Scale changes to Team on Sep 1, 2026」,并说明生效当天每席额度会从 16,900 掉到 8,900、要提前告知团队",
          "横幅带 Cancel this change,随时可撤;撤销写进 Activity Log",
          "有待生效变更时「取消订阅」入口隐藏 —— 两条队列同时排会说不清哪个先生效",
          "年付降月付走同一条路:年结生效,年内一切不变(横幅文案说明「年费已付,所以等年结」)",
          "Enterprise 只有年付:rate card 上 E1–E3 的价格本来就是「年付摊到每月」,价目表里没有月付价,所以产品里不给 Enterprise 自助切账期,要改走销售",
          "年付时「扣款日」和「额度重置日」不是同一天 —— 额度仍按月重置,界面要分开写(Atlas:Renews Aug 1, 2027 · credits reset Sep 1, 2026),写成一个日期用户会以为一年才发一次额度",
          "升档会顺手抹掉待生效的降档 / 取消 —— 用户显然不想走了",
        ],
        links: [
          { label: "换套餐弹窗", href: `${W}/home?team=t-growth&role=owner&settings=billing`, state: "Owner · Plans and Billing" },
          { label: "席位超限 · 降档被挡", href: `${W}/home?team=t-growth&role=owner&seats=full&settings=billing`, state: "Scale 10 席 → Team 上限 9,Switch 禁用" },
        ],
        open: [
          "空席位上挂着的剩余额度在降档后按哪一档算",
          "生效当天的通知没做 —— 横幅只在打开账单页时看得到,应该配一封邮件",
        ],
      },
      {
        id: "sub-cancel",
        section: "Billing",
        title: "取消订阅与撤销取消",
        intent: "团队没有免费档,所以取消不是降级到 Free,而是账期结束后终止。期末之前必须能后悔。",
        status: "done",
        cases: [
          "取消要走问卷,必须选一条流失原因才让走 —— 「太贵」和「用不上」指向完全不同的动作,不能混成一个数字",
          "七个原因 + 可选补充说明;原因连同说明一起写进 Activity Log,一年后回看有据可查",
          "问卷同时是最后一次留人:把「期末之前一切照常」「之后退回 Free」「数据不删」「top-up 冻结不没收」四句写全",
          "确认后账单页挂待终止横幅「Scale ends on Sep 1, 2026」,带 Keep the subscription 可一键撤回",
          "撤销即刻恢复,写 Activity Log 并 toast「Nothing was lost」",
          "期末之后团队退回 Free(见下一条),不是只读也不是归档",
        ],
        links: [
          { label: "取消入口 · Billing Settings", href: `${W}/home?team=t-growth&role=owner&settings=billing`, state: "Owner" },
        ],
        open: [
          "不存在退款与抵扣(已定),界面上还没把这句明写出来",
          "取消后没有挽留邮件序列 —— 期末前应该至少发一封",
        ],
      },
      {
        id: "sub-ended",
        section: "Billing",
        title: "终止之后:团队退回 Free",
        intent:
          "签约前企业客户必问的一条:不续费之后我们的东西还在不在。答案是全在 —— 停的只是每月的额度。Team / Scale 与 Enterprise 不续费的结局完全一样。",
        status: "done",
        cases: [
          "数据全留:做过的东西照样可看、可下载、可删除",
          "成员保留、席位冻结 —— 不解散团队,也不动任何人的账号",
          "停的是月度额度:不再按月发放,所以谁都不能开始新工作",
          "额度读作 0 而不是「用满」—— 这两者在界面上意思完全不同:用满还能充值,不再发放只能重新订阅",
          "已买的 top-up 一并冻结而不是没收:重新订阅就回来(仍受 12 个月有效期约束)",
          "撞墙横幅换成订阅口径:徽章 NO PLAN(不是 Your limit / Team pool),Owner 出口是 Choose a plan,成员出口是 Ask an owner to resubscribe",
          "composer placeholder 也换掉 —— 「充值就能解」那句在这里是错的",
          "邀请弹窗直接挡住并说明「席位已冻结,新同事进来只会拿到一个没有额度的席位」",
          "账单页的套餐卡读作 Free / No plan,不再印原档价格 —— 否则和上方横幅自相矛盾",
          "重新订阅一律走全新订阅流程:立即扣款、周期从今天起算,同档也一样(旧订阅已经结束了)",
          "Free 形态没有体验额度(已定):那 500 credits 是注册时一次性赠送的,不是每月发,退回 Free 不会再给一次",
          "数据不会因为终止而被清理(已定)—— 我们没有留存周期,东西留到用户自己删",
          "冻结的 top-up 按冻结前的到期日算,不从重新订阅那天续算(已定)—— 续算等于变相延长有效期",
        ],
        links: [
          { label: "Owner 视角 · 已终止", href: `${W}/home?team=t-growth&role=owner&sub=expired&settings=billing`, state: "Owner · 退回 Free" },
          { label: "Member 视角 · 被拦住", href: `${W}/home?team=t-growth&role=member&sub=expired`, state: "Member · 不能创作" },
        ],
        open: [
          "取消后没有挽留邮件序列 —— 期末前应该至少发一封",
        ],
      },
      {
        id: "sub-dunning-grace",
        section: "Billing",
        title: "续费失败:7 天宽限期",
        intent: "卡被拒不能直接停服。给 7 天宽限期、期间一切照常,同时把话说清楚:到期还没付成,订阅结束、退回 Free。",
        status: "partial",
        cases: [
          "失败 → 7 天宽限期 → 终止退回 Free,三段式",
          "宽限期内完全不降级:能创作、能邀请、什么都不少 —— 这七天是留给财务换卡的,不是惩罚用户的",
          "但口径是「不触发重置」,不是「额度照发」(2026-08-25 定)。到期重置这个动作没变,变的是它前面多了一道判断:扣款成功才重置,否则不重置并转入宽限期",
          "两句话的用户体验一模一样,但「照发」会让开发写出送钱的逻辑 —— 一张卡被拒就发出一整期额度,Scale 满编 30 席 = 507,000 credits ≈ $1,333 真实成本",
          "宽限期内扣款成功 → 补上这次重置;7 天到期仍失败 → 终止退回 Free",
          "账期锚点不动(= Stripe 默认):8/18 失败、8/21 成功,新周期仍是 8/18–9/18,下次续费依旧 9/18。不改 billing_cycle_anchor 也就不会引入 proration",
          "横幅必须说清额度状态,否则余额没变的用户以为已续上、余额用完的用户以为被降级",
          "账单页常驻橙色横幅,写明确切的宽限期结束日与「到期未付则退回 Free」",
          "横幅里直接给两个动作:Update payment method 与 Retry payment",
          "与自动充值的失败态用同一套形态(连续失败 → 暂停 → 失败原因 → 重试入口),不另造一种视觉",
        ],
        links: [
          { label: "宽限期中", href: `${W}/home?team=t-growth&role=owner&sub=grace&settings=billing`, state: "Owner · 卡被拒" },
          { label: "自动充值失败态可对照", href: `${W}/home?team=t-atlas&role=owner&auto=paused`, state: "Owner · 自动充值被拒" },
        ],
        open: [
          "宽限期内只有账单页看得到 —— 应该同时进通知铃铛与邮件,而且要通知到账单联系人而不只是 Owner",
          "Stripe 的重试节奏(第 1/3/5/7 天各试一次这类)没定",
          "3DS / 二次验证的中间态交开发",
        ],
      },
      {
        id: "sub-cycle",
        section: "Billing",
        title: "月付 ↔ 年付切换",
        intent: "订阅之后想改计费周期。年付省 30%,所以从月付转年付应当鼓励;反向则要等年结。",
        status: "done",
        cases: [
          "不需要单独一套逻辑 —— 它就是升降级:转年付是升级方向,转月付是降级方向",
          "月付 → 年付:立即生效、立即扣年费全额、月付已付不退(R3),下次续费日 = 今天 +12 个月",
          "年付 → 月付:排到年结生效,年内一切不变;账单页出现待生效横幅并说明「年费已付,所以等年结」",
          "所以账单变化是不对称的:升方向立刻多一张 invoice,降方向本期 invoice 不变",
          "账单页的周期按钮按当前周期切换形态:月付时是 Switch to annual and save 30%,年付时是 Switch to monthly",
          "年付也是按月发额度 —— 周期只影响收款节奏与单价,不影响额度发放节奏",
          "年升年不需要额外规则(2026-08-25 定):折抵即取消发放 —— 旧档未发放的期数随折抵一并结束,新档从升档日起重新计 12 期",
          "退了钱又照发额度就是白拿,所以「剩余月份按哪档发」这个问题本身不成立:旧档没有剩余期数了",
          "钱与额度完全对称:已发放的不退也不收回,未发放的折抵并停发",
        ],
        links: [
          { label: "月付 · 可转年付", href: `${W}/home?team=t-growth&role=owner&settings=billing`, state: "Owner · Monthly" },
        ],
        open: [],
      },
      {
        id: "payment-methods",
        section: "Billing",
        title: "支付方式(多卡管理)",
        intent:
          "一张卡撑不住企业客户:主卡 + 备用卡是常态,而且换卡不能有「一张卡都没有」的中间状态,否则下个账期静默扣款失败。",
        status: "done",
        cases: [
          "可以加多张卡,列表里**必须恰好有一张**默认卡 —— 扣款(续费 / 加席位 / top-up)只认默认卡",
          "**有活跃订阅时,最后一张卡不能删**(2026-08-25 定):按钮留在原地但禁用,并把原因写在下面",
          "换卡的正确路径是「先加新卡、设为默认、再删旧卡」,多一步,但不可能把自己锁死",
          "想彻底停付款的路径是取消订阅,不是删卡 —— 这句写进禁用提示里",
          "为什么不用二次确认:一个「你确定要把账号搞坏吗」的确认框,正确答案永远是「不确定」。能用约束解决的不要用确认框解决",
          "删掉默认卡时(还有其他卡),自动把剩下最早添加的一张顶上来,绝不留「零张默认」的空档,并在 toast 里说清谁顶上来了",
          "新加的卡默认**不**抢占默认位,除非用户勾了「Charge this card from now on」;第一张卡例外,必然是默认",
          "只能改有效期,不能改卡号 —— 真实实现里卡号是支付服务商的 token,产品侧拿不到。「换一张卡」在系统里就是「加一张新卡」",
          "卡过期 / 两个月内到期会打徽章(Expired / Expires soon)",
          "增删改都写进 Activity Log",
          "支付方式留在团队,不随 Owner 转让走",
        ],
        links: [
          { label: "两张卡 · Enterprise", href: `${W}/home?team=t-atlas&role=owner&settings=billing`, state: "Owner · Billing · Settings" },
          { label: "一张卡 · 删除被挡", href: `${W}/home?team=t-growth&role=owner&settings=billing`, state: "Owner · Billing · Settings" },
        ],
        open: [
          "原型里只收末四位,真实实现是支付服务商的安全表单",
          "还没做「默认卡扣款失败时自动尝试备用卡」—— 要先确认支付服务商侧怎么配",
        ],
      },
      {
        id: "sub-invoice",
        section: "Billing",
        title: "发票与税务",
        intent: "财务拿到的东西。没有税号的发票财务不认,这条不做企业单签不下来。",
        status: "partial",
        cases: [
          "发票流水按当前套餐价与账期生成,Owner 与账单联系人可见",
          "七列:Date / Item / PaymentType / TransactionType / Amount / Status / Invoice —— 财务要分清「订阅还是一次性」「新订/续费/升档/买包」",
          "月付客户每月一张订阅发票;年付客户一年一张,金额 = 月费 × 12(Atlas:$3,999 × 12 = $47,988)",
          "年付期间加席位按**合同剩余月份**补收,不收整年(Atlas:$39 × 3 席 × 11 个月 = $1,287)",
          "Enterprise 定价页写 Let's talk,但发票必须写真金额 —— 发票记的是实际扣了多少,取 team.contractMonthly",
          "账单联系人是纯邮箱,不占席位、不进成员表",
          "税号 / VAT / 账单地址本期不做(已决定)—— 等有真实企业客户提出再补",
          "待做:发票 PDF 下载",
        ],
        links: [
          { label: "Billing · Invoices(月付)", href: `${W}/home?team=t-growth&role=owner&settings=billing`, state: "Owner" },
          { label: "Billing · Invoices(年付 Enterprise)", href: `${W}/home?team=t-atlas&role=owner&settings=billing`, state: "Owner" },
        ],
        open: [
          "不做税号意味着暂时接不了「必须开带 VAT 发票」的欧洲企业单 —— 这是明知的取舍,不是遗漏",
          "币种与多地区税率未定",
          "优惠码可用于团队订阅(已定),且可与年付叠加 —— 但要设护栏:叠加后单价不得低于 INDIVIDUAL_PER_CREDIT_FLOOR(Scale 年付单价的 90%),超了就拒绝该码。护栏还没实现",
        ],
      },
      {
        id: "billing-readonly",
        section: "Billing",
        title: "看不到账单的人的出口",
        intent: "Admin / Member 打开 Billing 不该是死胡同:看得见现状,提得出申请。",
        status: "done",
        cases: [
          "只读展示当前套餐、席位占用、池余额,右上角标「View only」",
          "底部两个按钮:Request seats / Request a top-up",
          "已提交的申请会在页内提示还有几条在等决定",
        ],
        links: [
          { label: "Admin 视角", href: `${W}/home?role=admin`, state: "Admin · Billing" },
          { label: "Member 视角", href: `${W}/home?role=member`, state: "Member · Billing" },
        ],
      },
      {
        id: "activity-log",
        section: "Activity log",
        title: "Activity Log",
        intent: "「上个月是谁改了 Kenji 的额度」要能在产品里查到,而不是把邮箱当日志用。",
        status: "done",
        cases: [
          "记录:角色变更 / 成员移除 / 额度调整 / Owner 转移 / 加席位 / 充值 / 审批申请",
          "按类型筛选,含新增的 Security 类(登录方式、数据留存、连接器、模型开关的改动都归它)",
          "Owner / Admin / Billing Admin 可见,Member 不可见",
          "原型里所有改动都实时写入,不是贴死的假数据",
          "导出是 Enterprise 权益:Export log 只在共享池档出现,其余档写明「Export is on Enterprise」",
          "导出的卖点是「能进客户自己的 SIEM 的机器可读文件」—— 采购要的是这个,不是页面上能翻页",
        ],
        links: [
          { label: "Enterprise · 可导出", href: `${W}/home?team=t-atlas&role=owner`, state: "Owner · Enterprise" },
          { label: "Scale · 导出锁态", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · Scale" },
        ],
        open: [
          "保留时长未定(企业客户会写进合同)",
          "导出按钮目前不真的下文件,只把口径讲清楚",
        ],
      },
    ],
  },
  {
    id: "daily",
    stage: "05",
    title: "日常使用:撞墙与回路",
    blurb:
      "设置配完之后就是天天在用。用户被卡住的那一刻正是购买意愿最高的时刻,这里不能是死胡同。",
    features: [
      {
        id: "wall-hit",
        section: "撞墙",
        title: "额度用尽:拦住,但不在站内催办",
        intent:
          "外部客户不在 BuzzVideo 里沟通 credits —— 额度不够是他们内部私下解决的事,不会有人在产品里向老板「提申请」等审批。所以整条站内催办链路移除,只留拦截。",
        status: "done",
        cases: [
          "**已移除**:80% 告警横幅",
          "**已移除**:100% 用尽的告警横幅上的申请出口",
          "**已移除**:申请弹窗(选数量 + 填理由)与铃铛里的待办",
          "**保留**:额度用尽仍然拦住创作 —— 模型卡置灰、composer 禁用。不拦等于白送算力",
          "**保留**:购买类出口(买 top-up、换套餐)。那是 Owner 自己掏钱,不是跟谁沟通",
          "判据一句话:「Request」类动作全删,「购买」类动作保留",
          "实现落在一处:quotaState 算完之后过一道后处理(warn 档整体取消 + 去掉 request-credits 出口),没有去改八个分支,规则集中好核对",
        ],
        links: [
          { label: "80% 状态(应无横幅)", href: `${W}/home?team=t-growth&role=member&my=warn`, state: "Member · 快用完" },
          { label: "100% 状态(拦住,无申请)", href: `${W}/home?team=t-growth&role=member&my=full`, state: "Member · 已用尽" },
        ],
        open: [
          "内部同事另有一条独立的路 —— client 端常驻的 Internal Request Credits 工单,见第 08 节,与这里无关",
          "request-modal.tsx 文件保留未删:内部工单要复用同一套「选数量 + 填理由 + 提交回执」的形态",
        ],
      },
      {
        id: "emails",
        title: "事务邮件",
        intent: "16 封邮件模板,带触发条件、收件人、严重级别分类。",
        status: "done",
        cases: [
          "覆盖邀请 / 角色变更 / 移除 / Owner 转移 / 席位 / 额度 80% 与用尽 / 自动充值失败",
          "每封标注触发条件与收件人",
        ],
        links: [
          // 邮件原型已独立成 (emails) 路由组,不再挂在 team-workspace 下面
          { label: "邮件模板索引", href: "/prototypes/emails" },
          { label: "积分池 100% 告警", href: "/prototypes/emails/pool-100" },
        ],
      },
    ],
  },
  {
    id: "admin",
    stage: "07",
    title: "管理后台",
    blurb:
      "客户看不到的那半边。sales 开户与维护、内部同事用量管控,以及同一套组织管理界面怎么既管客户又管自己。",
    features: [
      {
        id: "enterprise-onboard",
        title: "企业客户开户",
        intent: "销售谈成后,我们替客户开账号:选档、配池额度与席位、开治理开关。开完户客户看到的就是前面 01–07 那套团队工作区。",
        status: "done",
        cases: [
          "三档取 rate card v1.6 第 8 节校正值:E1 5 席 / 池 84,500 / $799,E2 15 席 / 253,500 / $2,399,E3 25 席起 / 422,500 / $3,999 起",
          "每档卡片直接印出「同席位数的 Scale 要多少钱、给多少额度」与溢价百分比 —— 三档统一 +34%",
          "席位加购:$59 / $49 / $39,上限 +5 / +10 / 不设限(也就是升档斜坡)",
          "池额度可在档位基准上谈;合同措辞必须写 up to X credits/month、未用完部分作废",
          "右侧常驻对客口径面板:改任何一个数立刻重算年费、每席等效额度、溢价与毛利,溢价低于 20% 或毛利低于 60% 转红",
          "池额度低于同席位 Scale 时直接红字警告 —— 采购拉个表就能算出「付更多钱拿更少额度」,这正是 30 Jul 方案被推翻的原因",
          "pour-over / SSO / 审计日志三个开关;SSO 与审计自 E2 起,E1 打开算谈判例外",
          "常驻话术:额度发到组织池、不挂在席位上,所以加购席位不带自带额度,池才是产品",
          "组织层已并进 org-members:同一套成员管理界面既管我们自己,也管客户组织,靠成本换算率区分内外",
        ],
        links: [
          { label: "Admin Portal · 开户", href: "/prototypes/admin-portal" },
          { label: "开完户的客户视角", href: `${W}/home?team=t-atlas&role=owner`, state: "Owner · Enterprise" },
          { label: "组织成员管理", href: "/prototypes/org-members" },
        ],
        open: [
          "org-members 与 team-workspace 仍是两套数据(额度字段一边叫 budget、一边叫 limit.credits),真实实现要并成一份,否则会重演命名口径争议",
          "合同附件(签署版 PDF)没做 —— 后台应当能挂一份,CS 接手时不用去翻邮件",
        ],
      },
      {
        id: "enterprise-provisioning",
        title: "开户主流程:签约 → 收款 → 开通",
        intent:
          "整条 enterprise 流程最容易掉单的一环。sales 填完表就以为开好了,客户那边登不进来,来回扯两天。所以「开户」和「开通」在后台是两个状态,中间卡着一道确认收款。",
        status: "done",
        cases: [
          "三段状态:Awaiting payment(签了、开票了,钱没到)→ Provisioned(已开通)→ Lapsed to Free(到期未续)",
          "开户表单同时收合同条款:付款方式(Net 30 / Net 60 / 信用卡)、PO 号、合同期限(12/24/36 月)、是否自动续约",
          "开户成功页明写「not usable yet」,并用四步清单说清后面会发生什么:确认收款 → Owner 收激活邮件可登录 → 订阅显示 Enterprise → 可邀请成员分配额度",
          "生效日与到期日在确认收款那一刻才落定 —— 提前写死会和客户的采购记录对不上",
          "确认收款是不可逆动作,所以点之前先展开一张「点下去会发生什么」的清单再让确认",
          "待收款单独一个看板,排在续约之前 —— 客户已经签了却还用不上,比续约更等不起;每行直接给确认按钮,不用点进详情",
          "总表的状态列也标 Awaiting payment,不用点进去才知道这单没开通",
          "没开通之前成员页整块锁住:邀请一个进不来的人只会制造支持工单",
          "开通后成员页可替客户邀请人并按人分配池额度,顶部常驻「未分配 X / 共 Y」",
          "分配额度说明写清口径:额度在组织池里,分配是从池里切出的月度上限;不分配就是直接从池里取",
          "席位占满时邀请按钮禁用并提示先在合同上加席位",
          "内部操作日志:开户、确认收款、改自动续约、邀请、改分配全部留痕 —— 「谁把这单标成已收款」必须查得到,它是唯一把钱变成权限的动作",
          "确认收款要 sales 与财务双签:开单的人不能同时是确认收款的人,否则等于自己签自己的收款单",
          "双签进度直接摆在横幅与看板行上(谁签了、还差谁),单签之后组织仍留在待收款列表里",
          "两签齐了才落库开通,并由 System 写一条「已开通并发出激活链接」的日志",
          "后台顶部有演示身份切换(Sales / Finance)—— 不能换身份的话双签这条规则在原型里根本看不出来",
          "客户侧有对应的等待页:Owner 登得进来但工作区不开,整页换成进度说明,而不是让他在一个点不动的界面里乱试",
          "等待页说清三件事:卡在哪一步、大概多久、卡住了找谁;并说明「席位与合同期从激活日算,不是签约日」",
          "等待页的出口是账户对接人而不是通用客服 —— 通用客服答不了「你们的款到了没」",
        ],
        links: [
          { label: "Admin Portal · 待收款看板", href: "/prototypes/admin-portal" },
          { label: "客户侧等待页", href: `${W}/home?team=t-atlas&role=owner&sub=pending`, state: "Owner · 已签约待付款" },
          { label: "激活邮件", href: "/prototypes/emails/enterprise-activated" },
        ],
        open: [
          "双签目前只存在内存里,刷新回默认;真实实现要落库并记时间戳",
          "没有「拒绝 / 打回」这条路 —— 财务发现金额不对时只能不签,应该能退回给 sales 并写明原因",
          "等待页只在 Home 生效,直接访问 Canvas / Assets 仍会进工作区",
        ],
      },
      {
        id: "enterprise-contract",
        title: "合同生命周期与续约",
        intent:
          "sales 与 CS 每次被问「这家什么时候到期、续不续」都来这里。不续约的结局与 team / scale 完全一致:退回 Free。",
        status: "done",
        cases: [
          "四个日期分开写:签约日 / 生效日 / 到期日 / 开通日 —— 企业流程里它们经常不是同一天,合成一个「有效期」就和客户的采购记录对不上了",
          "自动续约开关,关掉时文案直说「到期退回 Free」",
          "关掉自动续约的组织会进续约看板 —— 它比「快到期」更危险:没人碰就自动流失",
          "续约看板每行标出是快到期还是自动续约已关,并带当期消耗百分比(续约谈判要拿真实消耗说话,不是席位数)",
          "已到期的组织挂 Lapsed to Free 横幅,文案与客户端那条完全一致,并给 Start a new term",
          "自助档的组织进这个 tab 会说明「没有签约、没有期限」—— 它是刷卡月付,不该硬套合同字段",
          "不续约政策(LAPSE_POLICY)是一份共用文案,后台三处都引它,不会写成三个版本",
          "到期提醒节奏:提前 60 / 30 / 7 天各一封。60 天是给采购走审批的时间(提前两周通知等于逼客户走特批),30 天是决策点,7 天是最后一次拦停",
          "自动续约开着的组织只发 60 天那一封 —— 它是通知不是催促,再发两封会让客户以为要断服",
          "合同页把三个提醒点的状态逐条列出(已发 / 待发 / 不发),因为 sales 最常被问的是「客户到底收到通知了吗」",
          "提醒收件人含账单联系人 —— 决定续不续的人经常不是天天在用的人",
          "一封模板管三个节点,靠 days_left 分叉:做成三封的话内容会各自漂移,最后口径不一致",
        ],
        links: [
          { label: "Admin Portal · 续约看板", href: "/prototypes/admin-portal" },
        ],
        open: [
          "提醒只是后台的状态展示,没有真的定时任务 —— 真实实现要接调度",
          "续约涨价 / 改档在后台还只能改期限,不能同时调档位与池额度",
          "多年合同的分年开票没做",
        ],
      },
    ],
  },
  {
    id: "pl-internal",
    stage: "08",
    title: "PL 内部用户(仅内部)",
    blurb:
      "这一块只对 PressLogic 内部账号出现,外部客户看不到。内部同事要 credits 走的是公司内部工单流程,不是团队里的额度申请。",
    features: [
      {
        id: "org-members",
        title: "内部同事用量管理",
        intent: "控成本、控 access:谁在用、烧了多少、生成了什么、每人每月给多少。",
        status: "done",
        cases: [
          "成员表:月度额度进度条、当期 credits 与真实美元成本、产出量、单条视频成本、日耗迷你柱图",
          "per-user 月度额度 override,可回退组织默认",
          "停用 access(Suspend)",
          "成员详情四个 tab:Generations(带 prompt 与模型)/ Canvas sessions / 按项目 tag / Credit transactions",
          "按项目码归集成本,供财务分摊",
          "列表分页 + 批量勾选:勾中之后可批量邀请、批量设额度",
        ],
        links: [{ label: "Org Admin", href: "/prototypes/org-members" }],
        open: [
          "批量改角色 / 批量移除本期不做(已决定)—— 批量移除会撞上「移除必须指定画布继承人」那条规则,继承人是共用一个还是逐个指定说不清,收益不值这个复杂度",
          "成员详情抽屉等 per-member analytics 一起做(已决定)—— 抽屉里要摆的就是那份数据,先做壳子没意义",
        ],
      },
      {
        id: "internal-request-credits",
        section: "PL internal",
        title: "Internal Request Credits(常驻入口)",
        intent:
          "内部同事的 credits 是公司预算批下来的,不走团队额度那一套。所以入口**常驻**在 client 端,而不是等撞墙才出现 —— 他们往往是在开工前就先把工单提了。",
        status: "done",
        cases: [
          "顶栏 credits 旁常驻一个「Internal Request Credits」按钮,不依赖额度状态,任何时候都点得到",
          "只对内部账号出现;外部客户的界面上没有这个按钮",
          "点开是内部工单弹窗,字段沿用既有内部流程,不另造一套",
          "字段:完整项目名(Clockify 合约编号_名称,Project ID 由它前缀自动推出)、申请 credits 数量、预计产出条数、产出类型、修改轮数、用途类型(新制作/修改/重跑/超支追加)",
          "超支原因只在用途选「超支追加」时出现 —— 平时不占版面",
          "申请人 / 所属团队(Production / Sales / PM)/ BuzzVideo 登入 Email / 目前余额由账号自动带入,不让人手填",
          "提交后进内部工单列表(ops 侧可查),前端 toast 回执",
          "与外部客户的额度申请是两条完全独立的路:那条已移除(外部客户不在 BuzzVideo 里沟通 credits)",
        ],
        links: [{ label: "内部工单原型", href: "/prototypes/credit-request" }],
        open: [
          "工单提交后的审批流(谁批、SLA)在 BuzzVideo 之外,本文档不覆盖",
          "「内部账号」怎么判定(邮箱域名?账号标记?)待定",
        ],
      },
    ],
  },
];

export const STATUS_META: Record<FeatureStatus, { label: string; tone: string }> = {
  done: { label: "已打通", tone: "bg-[#e6f7f0] text-[#0f7a5a]" },
  partial: { label: "部分实现", tone: "bg-[#fff3ec] text-[#b06a1c]" },
  gap: { label: "尚未实现", tone: "bg-[#fdeced] text-[#c9432a]" },
};

export const ALL_FEATURES = FEATURE_GROUPS.flatMap((g) => g.features);
