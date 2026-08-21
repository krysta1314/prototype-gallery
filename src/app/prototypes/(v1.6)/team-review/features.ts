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
          "四步向导:团队名 → 选套餐 + 席位 → 付款 → 邀请(可跳过)",
          "步骤条常驻,让用户一眼看到「付款」在第几步,不会以为填个名字就建好了",
          "可自助购买的只有 Team / Scale —— Free 只属于个人空间;Enterprise 由 sales 在 admin portal 开户,不走自助",
          "按席位计价:Team $89/席(2–9)、Scale $169/席(5–30),席位数就是购买数量,结算摘要实时算总价",
          "付款按钮写明金额:Pay $445 and create team,不写含糊的 Continue",
          "结算页说明个人空间的套餐与账单是独立的两笔",
          "付款中按钮 loading 且不许关弹窗,避免连点买出两个团队",
          "买单人自动成为 Owner,并自动切到新团队",
          "创建后写两条 Activity Log:created <团队名> + subscribed to <套餐> with N seats",
          "第四步直接贴邮箱发邀请,提示还剩几个空席位;跳过也行,团队已经建好了",
        ],
        links: [
          { label: "刚注册时的购买入口", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" },
          { label: "已付费团队 · 可邀请", href: `${W}/home?team=t-growth&role=owner&seats=ok`, state: "Owner · Scale · 席位充足" },
        ],
        open: [
          "付款失败 / 3DS 验证的中间态没做,真实实现要能停在第 3 步重试",
          "年付折扣没做(向导里只有月付)",
          "个人已有付费套餐时买团队,要不要折抵个人订阅(ChatGPT 的做法是退掉个人 Plus),没定",
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
          "席位已满:Invite 置灰 + 「Add seats」主 CTA + 说明文案",
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
      "团队建好之后的全部配置项。下面的小模块与产品里设置面板的七个 tab 一一对应,走查时左边点到哪一条,右边打开的就是产品里对应那一页。",
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
          "防提权:Owner 能改 Admin / Billing Admin / Member 三列;Admin 只能改 Member 列",
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
        id: "quota-model",
        section: "Credits & usage",
        title: "额度模型:两套,按套餐分叉",
        intent:
          "Team / Scale 每席固定额度、不成池;只有 Enterprise 才是共享池并可按人分配。这条口径决定了撞墙文案、成员页、自动充值全部要不要出现。",
        status: "done",
        cases: [
          "Team / Scale(per-seat):每席位每月固定 8,900 / 16,900,归该席位本人",
          "per-seat 不汇成池 —— 同事没用完的额度借不到,管理员也不能在人之间分配",
          "per-seat 额度不够只有两条路:给这个席位单独买 top-up,或升档",
          "Enterprise(pool):整个组织一个共享池,管理员按人分配额度,未分配的可开 pour-over 回流",
          "top-up 两种模型都能按人买:买给谁归谁、不共享、不回流、12 个月有效",
          "扣减顺序:当月额度先扣,再扣 top-up —— 这句文案常驻在 Credits 页",
          "per-seat 团队看不到「设分配额度」与「自动充值」,因为没有池可分配可充",
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
          "模型卡片标「N credits each」",
          "composer 的估价按当前选中模型算,与卡片共用一份定价表",
          "余额不足时估价胶囊转红",
        ],
        links: [{ label: "首页模型卡片", href: `${W}/home?role=owner`, state: "Owner" }],
        open: ["真实定价由后端配置,现在是前端占位数字"],
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
        title: "自动充值(仅 Enterprise)",
        intent:
          "让组织不再因为忘记充值而停工;同时给财务一个月度封顶护栏。它是池级动作 —— Team / Scale 没有池,这块界面在那两档不出现。",
        status: "done",
        cases: [
          "池余额低于阈值时自动充 N credits 进池",
          "月度封顶:撞顶后停止自动充并提示",
          "连续失败 3 次转 paused,给出失败原因与重试入口",
          "per-seat 团队的 Credits 页与演示控制条里都没有这一档",
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
        title: "Business 档之间升档",
        intent: "Team → Scale。用户想要更多,所以立即生效;席位上限与每席额度同时抬高。",
        status: "partial",
        cases: [
          "立即生效:席位上限从 9 抬到 30,每席额度从 8,900 抬到 16,900",
          "席位数不变,只是上限变宽 —— 不会自动给你加人",
          "Team 撞到 9 席时,加席位面板的主按钮直接是 Move up to Scale",
        ],
        links: [
          { label: "Team 撞顶 · 引导升档", href: `${W}/home?team=t-beauty&role=owner&seats=full`, state: "Owner · Team 席位已满" },
        ],
        open: [
          "差价怎么收没定 —— 立即按剩余天数补差价(行业默认),还是下期一起收",
          "升档当月的额度怎么补:每席从 8,900 变 16,900,已经用掉的部分怎么折算没定",
          "已买的 top-up 余额应当保留(那是已付的钱),但界面上没有明说",
        ],
      },
      {
        id: "sub-downgrade",
        section: "Billing",
        title: "降档与取消降档",
        intent:
          "Scale → Team。降档立即生效等于当月白付了差价,所以应当排到下个账期 —— 这就产生「待生效变更」这个状态,也才有「取消降档」可撤。",
        status: "gap",
        cases: [
          "已实现:新档席位上限装不下现有成员时禁止降档,并提示先移除成员或选更大的档",
          "待做:降档排到下个账期生效,当前账期照常按原档使用",
          "待做:账单页常驻一条「Scale 将在 9 月 1 日变更为 Team」的待生效横幅,带 Cancel 按钮",
          "待做:降档生效那一刻,每席额度从 16,900 掉到 8,900 —— 需要提前告知受影响的人",
        ],
        links: [
          { label: "换套餐弹窗", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · Plans and Billing" },
        ],
        open: [
          "现在 changePlan 是立即生效,没有「待生效变更」这个状态,所以也无从取消",
          "降档后超出的席位怎么处理:自动释放空席位?还是要求先移除到新上限以内",
          "空席位上挂着的剩余额度在降档后按哪一档算",
        ],
      },
      {
        id: "sub-cancel",
        section: "Billing",
        title: "取消订阅与撤销取消",
        intent: "团队没有免费档,所以取消不是降级到 Free,而是账期结束后终止。期末之前必须能后悔。",
        status: "partial",
        cases: [
          "已实现:标记 cancelAtPeriodEnd,期间一切照常可用,不会立刻掉线",
          "已实现:文案明说团队不会掉回 Free —— 团队没有免费档",
          "待做:撤销取消(reactivate)—— 点了取消又后悔,账期结束前应该能一键撤回",
          "待做:账单页的待终止横幅,写明确切终止日期",
        ],
        links: [{ label: "Plans and Billing", href: `${W}/home?team=t-growth&role=owner`, state: "Owner" }],
        open: [
          "账期真的结束之后团队变成什么:只读?归档?数据保留多久?画布还能不能导出 —— 全部未定,而这是企业客户签约前必问的",
          "不存在退款与抵扣(已定),但界面上没有把这句写出来",
        ],
      },
      {
        id: "sub-cycle",
        section: "Billing",
        title: "月付 ↔ 年付切换",
        intent: "订阅之后想改计费周期。年付省 30%,所以从月付转年付应当鼓励;反向则要等年结。",
        status: "gap",
        cases: [
          "待做:月付 → 年付,立即生效并按比例折抵当月已付",
          "待做:年付 → 月付,排到年结生效(已经按年收过钱)",
        ],
        links: [],
        open: ["订阅页有月付 / 年付切换,但订阅之后账单页改不了周期"],
      },
      {
        id: "sub-dunning",
        section: "Billing",
        title: "付款失败链路",
        intent: "卡被拒之后不能直接停服 —— 要有宽限期、要通知到能换卡的人、最后才终止。",
        status: "gap",
        cases: [
          "待做:失败 → 宽限期(N 天,期间照常可用并常驻横幅)→ 转只读 → 终止",
          "待做:每一步都通知 Owner 与账单联系人,横幅里直接能换卡",
          "已有参照:自动充值的失败态已经做了(连续 3 次转 paused + 失败原因 + 重试入口),订阅本身沿用同一套形态",
        ],
        links: [
          { label: "自动充值失败态可参照", href: `${W}/home?team=t-atlas&role=owner&auto=paused`, state: "Owner · 卡被拒" },
        ],
        open: ["宽限期几天没定", "3DS / 二次验证的中间态交开发"],
      },
      {
        id: "sub-invoice",
        section: "Billing",
        title: "发票与税务",
        intent: "财务拿到的东西。没有税号的发票财务不认,这条不做企业单签不下来。",
        status: "partial",
        cases: [
          "已实现:发票流水按当前套餐价与账期生成,Owner 与账单联系人可见",
          "已实现:账单联系人是纯邮箱,不占席位、不进成员表",
          "待做:税号 / VAT 与账单地址",
          "待做:发票 PDF 下载",
        ],
        links: [{ label: "Billing · Invoices", href: `${W}/home?team=t-growth&role=owner`, state: "Owner" }],
        open: ["币种与多地区税率未定", "优惠码能否用于团队订阅、能否与年付叠加未定(promo-campaigns 原型有活动体系)"],
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
          "按类型筛选",
          "Owner / Admin / Billing Admin 可见,Member 不可见",
          "原型里所有改动都实时写入,不是贴死的假数据",
        ],
        links: [{ label: "Activity Log", href: `${W}/home?role=owner`, state: "Owner" }],
        open: ["保留时长与导出需求未定(企业客户可能要求审计导出)"],
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
        id: "quota-warn",
        title: "80% 告警",
        intent: "在撞墙之前就让人知道要撞墙了,而不是只发一封邮件。",
        status: "done",
        cases: [
          "常驻横幅,不是只把顶栏积分胶囊改个颜色",
          "Owner / Billing Admin 看到「Top up credits」;Admin / Member 看到「Request a top-up」",
          "per-seat:横幅说「你这个席位用了 82%」,徽章 YOUR LIMIT",
          "pool:横幅分两种 —— 池 82% 与「你被分配的额度快用完」,后者要说明池里还有多少",
        ],
        links: [
          { label: "per-seat 席位 80%", href: `${W}/home?team=t-growth&role=member&pool=warn`, state: "Member · 席位 82%" },
          { label: "pool 池 80%", href: `${W}/home?team=t-atlas&role=owner&pool=warn`, state: "Owner · 池 82%" },
          { label: "pool 分配额度吃紧", href: `${W}/home?team=t-atlas&role=member&limit=full`, state: "Member · 分配已满" },
        ],
      },
      {
        id: "quota-blocked",
        title: "100% 用尽",
        intent: "被卡住时必须同时给出「为什么」和「下一步点哪里」,并且区分是团队的问题还是我的问题。",
        status: "done",
        cases: [
          "红色常驻横幅 + Create 按钮换态,按钮点得动",
          "per-seat 席位用尽:Owner / Billing Admin → Top up this seat;Admin / Member → Request a top-up",
          "per-seat 文案要说清死路:「同事没用完的额度不能转给你」,否则用户会以为是权限问题",
          "个人账户用尽:出口是 See plans(升档),不是 top-up",
          "pool 池空:Owner / Billing Admin → Top up the pool;Admin / Member → Request a top-up",
          "pool 分配额度满:Owner / Admin → Raise the allocation;Member → Request more credits",
          "pool 文案明确区分:「池里还有 X credits,这是你被分配的额度」",
          "Canvas 里点创建会弹拦截说明,且每个角色都有一个可执行按钮",
          "受限态输入区:composer placeholder 换成红色的「You can't start new work until credits are topped up.」并禁用输入",
          "受限态模型卡片整组置灰(opacity + grayscale),点击不再是无反应,而是直接走充值 / 申请",
        ],
        links: [
          { label: "席位用尽 · Member", href: `${W}/home?team=t-growth&role=member&pool=full`, state: "Member · 席位 100%" },
          { label: "席位用尽 · Owner", href: `${W}/home?team=t-growth&role=owner&pool=full`, state: "Owner · 席位 100%" },
          { label: "池用尽 · Enterprise", href: `${W}/home?team=t-atlas&role=member&pool=full`, state: "Member · 池 100%" },
          { label: "分配额度满 · Enterprise", href: `${W}/home?team=t-atlas&role=member&limit=full`, state: "Member · 分配已满" },
          { label: "Canvas 拦截弹窗", href: `${W}/canvas?team=t-growth&role=member&pool=full`, state: "Member · 席位 100%" },
        ],
      },
      {
        id: "quota-request",
        title: "申请回路",
        intent: "Member 撞墙后能在站内提申请,Owner 在通知中心里直接批 —— 而不是提示他「去找管理员」。",
        status: "done",
        cases: [
          "申请弹窗:选数量(top-up / 席位 / 分配额度)+ 填理由",
          "提交后进 Owner / Billing Admin 的通知铃铛,带待办数徽章",
          "审批按模型分流:per-seat 团队批准后钱只进申请人那个席位,pool 团队批准后充进共享池",
          "「申请提分配额度」这一类只在 Enterprise 出现 —— per-seat 每席固定,没有上限可提",
          "Owner 点 Approve 后横幅随之消失",
          "top-up 类申请归 Owner 与账单联系人;分配类申请归 Owner 与 Admin",
          "Member 没有铃铛(他审不了任何申请,不给空入口)",
          "状态机:待处理 → 已处理 / 已拒绝 / 已失效",
          "防刷:同一人同类型只要还有一条在等处理就不能再提,弹窗里 Send 置灰并说明原因;被拒或已失效的不占冷却,允许补充理由重提",
        ],
        links: [
          { label: "Member 提申请 · per-seat", href: `${W}/home?team=t-growth&role=member&pool=full`, state: "Member · 席位 100%" },
          { label: "Owner 审批", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · 铃铛有待办" },
          { label: "Member 提申请 · Enterprise", href: `${W}/home?team=t-atlas&role=member&limit=full`, state: "Member · 分配已满" },
        ],
      },
    ],
  },
  {
    id: "notify",
    stage: "06",
    title: "通知与邮件",
    blurb:
      "站内与站外两条通道。邮件里已有的告警,产品里也要有 —— 否则等于把邮箱当日志用。",
    features: [
      {
        id: "in-app-notify",
        title: "站内通知中心",
        intent: "邮件里已有的告警,产品里也要有;并且申请要能在站内被处理掉。",
        status: "done",
        cases: [
          "顶栏铃铛 + 未读数徽章(未读 = 待办申请 + 未读告警)",
          "申请可直接 Approve / Dismiss",
          "告警区:额度 80% / 额度用尽 / 自动充值失败 / 撞月度封顶,与申请合并成一个列表",
          "告警由当前状态派生,不额外存 —— 状态恢复了通知自然消失,不会留一堆过期告警",
          "点告警直接跳到对应设置页(额度类去 Credits、自动充值类去 Top-up)",
          "已读:读过的沉到下面、去掉高亮圆点,支持 Mark all read",
          "按模型给不同文案:per-seat 说「你的席位用尽」,Enterprise 说「共享池用尽」",
          "自动充值类告警只在 Enterprise 且有账单权限时出现 —— per-seat 没有池可充",
          "Member 审不了申请,但额度告警是他自己的事,所以有告警时他也有铃铛(只是没有申请区)",
        ],
        links: [
          { label: "Owner 的铃铛 · 有申请", href: `${W}/home?team=t-growth&role=owner`, state: "Owner · 2 条待办" },
          { label: "额度告警 · per-seat", href: `${W}/home?team=t-growth&role=member&pool=warn`, state: "Member · 席位 82%" },
          { label: "自动充值失败 · Enterprise", href: `${W}/home?team=t-atlas&role=owner&auto=paused`, state: "Owner · 卡被拒" },
        ],
        open: ["历史通知只在会话内保留,刷新后已读状态会重置 —— 真实实现要落库"],
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
          "开户后的合同附件与发票流水没做",
        ],
      },
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
        ],
        links: [{ label: "Org Admin", href: "/prototypes/org-members" }],
        open: [
          "种子只有 14 人,没有分页,也没有批量勾选 —— 涨到 100 人这个列表形态撑不住",
          "批量邀请 / 批量设额度还没有",
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
