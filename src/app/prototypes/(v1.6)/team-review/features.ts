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
    id: "onboard",
    stage: "01",
    title: "开通与加入",
    blurb: "从一个人到一个团队。这一段决定了企业客户采购时的第一个问题:席位怎么算。",
    features: [
      {
        id: "personal-account",
        title: "注册后只有个人账户",
        intent:
          "注册不再自动送一个叫「<用户名>'s team」的个人空间。注册出来的就是个人账户,团队必须手动创建 —— 免得用户一进来就背着一个自己没建过、也不知道是什么的团队。",
        status: "done",
        cases: [
          "个人账户不是团队:切换器里 PERSONAL 与 TEAMS 分两区列",
          "个人账户不显示成员数,只显示「Just you」",
          "刚注册时 TEAMS 区是空状态,Create team 高亮成主 CTA",
          "个人账户那行的齿轮进的是账户设置,不是团队设置",
          "个人账户没有席位、账单联系人、团队成员这些概念,对应区块整块不显示",
        ],
        links: [
          { label: "刚注册 · 无团队", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" },
          { label: "已有团队", href: `${W}/home?role=owner`, state: "个人账户 + 2 个团队" },
        ],
      },
      {
        id: "create-team",
        title: "手动创建团队",
        intent: "团队只能手动创建;创建者自动成为 Owner,自动分配品牌色,不让用户在创建时选。",
        status: "done",
        cases: [
          "入口在切换器底部;刚注册时它是高亮的主 CTA",
          "只需填团队名",
          "新团队默认落在 Team Basic(3 席位 / 20,000 credits)",
          "创建者自动成为 Owner,并自动切到新团队",
          "创建后立刻写一条 Activity Log",
        ],
        links: [{ label: "刚注册时的创建入口", href: `${W}/home?teams=none`, state: "个人账户 · 还没有团队" }],
      },
      {
        id: "invite",
        title: "邀请成员",
        intent: "Owner / Admin 拉人进来,邀请时就要选好角色,避免进来之后再补权限。",
        status: "done",
        cases: [
          "支持一次贴多个邮箱,逐个校验格式与重复",
          "邀请时选角色:Admin / Member(只有 Owner 能授予 Finance)",
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
        status: "partial",
        cases: [
          "正常态:显示团队名、邀请人、将获得的角色,可接受",
          "未注册:CTA 变成「Sign up to accept」",
          "席位已满:Accept 禁用并说明原因,而不是让人接受后再报错",
        ],
        links: [
          { label: "已登录 · 可接受", href: `${W}/invite?invite=signed-in`, state: "已登录" },
          { label: "未注册", href: `${W}/invite?invite=signed-out`, state: "未注册" },
          { label: "席位已满", href: `${W}/invite?invite=seats-full`, state: "席位已满 · Accept 禁用" },
        ],
        open: [
          "「邀请已过期」这个态落地页上还没有 —— 成员表里有 expired 状态,但过期链接点进来会看到什么没定",
        ],
      },
      {
        id: "billing-contact",
        title: "邀请账单联系人",
        intent: "企业客户的财务不需要产品权限,只要收发票。给他一个独立入口,并且不占付费席位。",
        status: "done",
        cases: [
          "Finance 走 billing-only 免费席位,不计入付费席位",
          "Finance 没有产品权限:设置里只看到 Credits / Top-up / Billing / Activity",
          "成员表里 Finance 那行用量显示「No product usage」",
        ],
        links: [{ label: "Finance 视角", href: `${W}/home?role=finance`, state: "Finance" }],
      },
    ],
  },
  {
    id: "roles",
    stage: "02",
    title: "角色与权限",
    blurb: "四个角色,权限边界必须一眼看懂。评审反馈:权限不足时给说明,不要给一堆点不动的灰按钮。",
    features: [
      {
        id: "role-matrix",
        title: "四角色能力边界",
        intent: "Owner 管钱和一切;Admin 管人和额度但不能动支付;Finance 只管账单;Member 只管创作。",
        status: "done",
        cases: [
          "只有 Owner 能换套餐、加席位、买积分、授予 Finance",
          "Admin 能改成员角色与月度上限,但看不到 Credits Top-up 页",
          "Member 看到「Only owners and admins can invite…」这类说明,而不是灰按钮",
          "Finance 没有产品权限,进创作页会被拦",
        ],
        links: [
          { label: "Owner", href: `${W}/home?role=owner`, state: "Owner" },
          { label: "Admin", href: `${W}/home?role=admin`, state: "Admin" },
          { label: "Finance", href: `${W}/home?role=finance`, state: "Finance" },
          { label: "Member", href: `${W}/home?role=member`, state: "Member" },
        ],
      },
      {
        id: "transfer-owner",
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
    ],
  },
  {
    id: "seats",
    stage: "03",
    title: "席位管理",
    blurb: "席位口径写清楚,直接消除企业客户最常见的一个采购异议。",
    features: [
      {
        id: "seat-rules",
        title: "席位口径",
        intent: "「我付了 10 个席位,为什么只能用 7 个」——这个问题要在界面上被提前回答。",
        status: "done",
        cases: [
          "待接受(pending)的邀请占席位",
          "已过期的邀请不占席位",
          "账单联系人(Finance)不占付费席位",
          "席位卡上常驻这三条说明,不用去看帮助文档",
        ],
        links: [{ label: "Credits and Usage · 席位卡", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "add-seats",
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
    ],
  },
  {
    id: "quota",
    stage: "04",
    title: "额度与撞墙",
    blurb: "评审里最重要的一节。用户被卡住的那一刻正是购买意愿最高的时刻,这里不能是死胡同。",
    features: [
      {
        id: "quota-model",
        title: "额度模型",
        intent: "两种积分 + 一个个人上限。口径要一句话说得清,否则全是客服工单。",
        status: "done",
        cases: [
          "订阅积分:每月按账单日重置,不结转",
          "充值积分:12 个月过期,可结转",
          "扣减顺序:订阅积分先扣,再扣充值积分 —— 这句文案常驻在 Credits 页",
          "个人月度上限独立于团队池:soft cap 只告警,hard cap 直接拦",
          "AI Tokens 是内部口径,Client 端不暴露",
        ],
        links: [{ label: "Credits and Usage", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "quota-warn",
        title: "80% 告警",
        intent: "在撞墙之前就让人知道要撞墙了,而不是只发一封邮件。",
        status: "done",
        cases: [
          "常驻横幅,不是只把顶栏积分胶囊改个颜色",
          "Owner / Finance 看到「Top up credits」;Admin / Member 看到「Request a top-up」",
          "个人上限 80% 与团队池 80% 是两条不同的横幅,徽章分别是 YOUR LIMIT / TEAM POOL",
        ],
        links: [
          { label: "团队池 80%", href: `${W}/home?role=owner&pool=warn`, state: "Owner · 池 82%" },
          { label: "个人上限吃紧", href: `${W}/home?role=member&limit=full`, state: "Member · 个人上限" },
        ],
      },
      {
        id: "quota-blocked",
        title: "100% 用尽",
        intent: "被卡住时必须同时给出「为什么」和「下一步点哪里」,并且区分是团队的问题还是我的问题。",
        status: "done",
        cases: [
          "红色常驻横幅 + Create 按钮换态,按钮点得动",
          "团队池空:Owner / Finance → Top up to continue;Admin / Member → Request a top-up",
          "个人上限满:Owner / Admin → Raise your limit;Member → Request more credits",
          "文案明确区分:「团队还有 X credits,这是你的个人上限」",
          "Canvas 里点创建会弹拦截说明,且每个角色都有一个可执行按钮",
          "受限态输入区:composer placeholder 换成红色的「You can't start new work until credits are topped up.」并禁用输入",
          "受限态模型卡片整组置灰(opacity + grayscale),点击不再是无反应,而是直接走充值 / 申请",
        ],
        links: [
          { label: "池用尽 · Member", href: `${W}/home?role=member&pool=full`, state: "Member · 池 100%" },
          { label: "池用尽 · Owner", href: `${W}/home?role=owner&pool=full`, state: "Owner · 池 100%" },
          { label: "个人上限满 · Member", href: `${W}/home?role=member&limit=full`, state: "Member · 上限已满" },
          { label: "Canvas 拦截弹窗", href: `${W}/canvas?role=member&pool=full`, state: "Member · 池 100%" },
        ],
      },
      {
        id: "quota-request",
        title: "申请回路",
        intent: "Member 撞墙后能在站内提申请,Owner 在通知中心里直接批 —— 而不是提示他「去找管理员」。",
        status: "done",
        cases: [
          "申请弹窗:选数量(积分 / 席位)+ 填理由",
          "提交后进 Owner / Finance 的通知铃铛,带待办数徽章",
          "Owner 点 Approve 真的加池 / 加席位,横幅随之消失",
          "额度类申请归 Owner 与账单联系人;上限类申请归 Owner 与 Admin",
          "Member 没有铃铛(他审不了任何申请,不给空入口)",
          "状态机:待处理 → 已处理 / 已拒绝 / 已失效",
          "防刷:同一人同类型只要还有一条在等处理就不能再提,弹窗里 Send 置灰并说明原因;被拒或已失效的不占冷却,允许补充理由重提",
        ],
        links: [
          { label: "Member 提申请", href: `${W}/home?role=member&pool=full`, state: "Member · 池 100%" },
          { label: "Owner 审批", href: `${W}/home?role=owner`, state: "Owner · 铃铛有待办" },
        ],
      },
      {
        id: "model-cost",
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
        id: "member-limit",
        title: "成员月度上限",
        intent: "Owner / Admin 给每个人设每月能花多少,分软硬两档。",
        status: "done",
        cases: [
          "三档:No limit / Soft cap / Hard cap,各带解释",
          "统一叫「Monthly limit」「Credits per month」,弹窗内显示重置日期",
          "周期固定为月,不再有 Weekly 这第四种口径",
          "改动写进 Activity Log",
        ],
        links: [{ label: "Team Members · 编辑上限", href: `${W}/home?role=admin`, state: "Admin" }],
      },
    ],
  },
  {
    id: "billing",
    stage: "05",
    title: "充值与账单",
    blurb: "钱的部分。谁能掏钱、掏不了钱的人怎么办,都要有出口。",
    features: [
      {
        id: "buy-credits",
        title: "买积分",
        intent: "池不够时当场充,充值积分可结转 12 个月。",
        status: "done",
        cases: ["三档积分包", "只有 Owner 与账单联系人能买", "入账后写 Activity Log 并刷新池读数"],
        links: [{ label: "Credits Top-up", href: `${W}/home?role=owner`, state: "Owner" }],
      },
      {
        id: "auto-topup",
        title: "自动充值",
        intent: "让团队不再因为忘记充值而停工;同时给财务一个月度封顶护栏。",
        status: "done",
        cases: [
          "池余额低于阈值时自动充 N credits",
          "月度封顶:撞顶后停止自动充并提示",
          "连续失败 3 次转 paused,给出失败原因与重试入口",
        ],
        links: [
          { label: "正常", href: `${W}/home?role=owner&auto=active`, state: "Owner · 自动充值正常" },
          { label: "失败已暂停", href: `${W}/home?role=owner&auto=paused`, state: "Owner · 卡被拒" },
          { label: "撞月度封顶", href: `${W}/home?role=owner&auto=cap`, state: "Owner · 撞封顶" },
        ],
      },
      {
        id: "plan-change",
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
        id: "billing-readonly",
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
    ],
  },
  {
    id: "visibility",
    stage: "06",
    title: "可见性与留痕",
    blurb: "7 人团队无所谓,100 人就是隐私与审计问题。企业客户一定会问。",
    features: [
      {
        id: "usage-visibility",
        title: "成员用量可见性",
        intent: "Member 只看自己的用量;Owner / Admin / Finance 看全部。",
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
        id: "activity-log",
        title: "Activity Log",
        intent: "「上个月是谁改了 Kenji 的额度」要能在产品里查到,而不是把邮箱当日志用。",
        status: "done",
        cases: [
          "记录:角色变更 / 成员移除 / 额度调整 / Owner 转移 / 加席位 / 充值 / 审批申请",
          "按类型筛选",
          "Owner / Admin / Finance 可见,Member 不可见",
          "原型里所有改动都实时写入,不是贴死的假数据",
        ],
        links: [{ label: "Activity Log", href: `${W}/home?role=owner`, state: "Owner" }],
        open: ["保留时长与导出需求未定(企业客户可能要求审计导出)"],
      },
    ],
  },
  {
    id: "notify",
    stage: "07",
    title: "通知",
    blurb: "邮件与站内两条通道。评审指出过:告警逻辑不能只做在邮件里。",
    features: [
      {
        id: "emails",
        title: "事务邮件",
        intent: "16 封邮件模板,带触发条件、收件人、严重级别分类。",
        status: "done",
        cases: [
          "覆盖邀请 / 角色变更 / 移除 / Owner 转移 / 席位 / 额度 80% 与用尽 / 自动充值失败",
          "每封标注触发条件与收件人",
        ],
        links: [{ label: "邮件模板", href: `${W}/emails` }],
      },
      {
        id: "in-app-notify",
        title: "站内通知中心",
        intent: "邮件里已有的告警,产品里也要有;并且申请要能在站内被处理掉。",
        status: "partial",
        cases: [
          "顶栏铃铛 + 待办数徽章",
          "申请可直接 Approve / Dismiss",
          "只对能处理申请的角色显示",
        ],
        links: [{ label: "Owner 的铃铛", href: `${W}/home?role=owner`, state: "Owner" }],
        open: [
          "目前铃铛里只有「申请」一类;额度 80% / 自动充值失败这些告警还只在邮件与横幅里,没进通知列表",
          "没有已读 / 历史通知,关掉就没了",
        ],
      },
    ],
  },
  {
    id: "admin",
    stage: "08",
    title: "管理后台",
    blurb: "老板 2026-08-17 提的新需求:内部先管 100 人,之后要能给企业客户开户。",
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
        ],
        links: [{ label: "Org Admin", href: "/prototypes/org-members" }],
        open: [
          "种子只有 14 人,没有分页,也没有批量勾选 —— 涨到 100 人这个列表形态撑不住",
          "批量邀请 / 批量设额度还没有",
        ],
      },
      {
        id: "enterprise-onboard",
        title: "企业客户开户",
        intent: "销售谈成后,我们替客户开账号:选套餐、给积分、定重置周期、定席位。",
        status: "gap",
        cases: [
          "需要在「成员」之上再加一层「组织」:组织列表 → 开户 → 下钻到该组织的成员",
          "开户表单:plan / credits / 重置周期 / 席位 / 账单联系人",
          "开完户之后,客户自己看到的就是前面 01–07 那套团队工作区",
        ],
        links: [],
        open: [
          "这块原型里完全没有,是本轮最大的缺口",
          "org-members 与 team-workspace 目前是两套独立数据(额度字段一边叫 budget、一边叫 limit.credits),不并成一份的话上线后会重演命名口径争议",
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
