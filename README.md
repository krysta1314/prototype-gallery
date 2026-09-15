This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 打卡 app（/punch）

Monica 个人用的考勤打卡工具，不属于原型画廊，也不在首页列表里。

- 页面：`/punch`（打卡）、`/punch/records`（记录与补卡）、`/punch/settings`（设置）
- 数据：Upstash Redis。提醒：Upstash QStash 延时消息 + cron schedule，通过 Web Push 送达
- 时区：固定北京时间 UTC+8
- 下班时间 = 上班打卡时间 + 设置里的工时（默认 9 小时，含午休）

### 环境变量与部署

在 `.env.example` 可见完整列表。本地开发放在 `.env.local`，生产在 Vercel 环境变量里配。特别注意：

- **QStash region**：这个账号在 US East 1，`QSTASH_URL` 必须是 `https://qstash-us-east-1.upstash.io`。用默认的全域名会报 `user not found in this region`，报错不会明确提示 region 问题。
- **APP_URL**：部署后改成 Vercel 的生产域名（带 `https://`，末尾不要斜杠）。本地是 `http://localhost:3000`。
- **PWA 静态资产路径**：`public/punch-sw.js`、`public/punch-manifest.json`、`public/punch-icon-*.png` 必须在 `public/` 根目录并用 `punch-` 前缀，不能放进 `public/punch/`，否则被 `src/proxy.ts` 的路由保护拦截，service worker 注册失败且没有明显报错。
- **中间件文件**：这个项目是 Next.js 16，中间件是 `src/proxy.ts`（不是 `middleware.ts`）。

### 登录与 Redis key

登录接口按 IP 限流：连续失败 10 次后锁定 15 分钟。被锁可以等待或去 Upstash 控制台删掉 `punch:authfail:*` 开头的 key。

Redis 中的关键数据：

| Key | 说明 | 过期 |
|-----|------|------|
| `punch:day:<YYYY-MM-DD>` | 单日打卡记录 | - |
| `punch:settings` | 用户设置（工时、提醒时间等） | - |
| `punch:sub` | 推送订阅信息（仅存一台设备） | - |
| `punch:job:<YYYY-MM-DD>` | 当天下班提醒的 QStash message id | 3 天 |
| `punch:authfail:<ip>` | 某 IP 的登录失败计数 | 15 分钟 |

### 本地开发的已知限制与调试

#### 下班提醒在本地无法测试

本地 `APP_URL` 是 `http://localhost:3000` 时，QStash 会拒绝 loopback 地址。打卡后会显示琥珀色提示「打卡成功，但下班提醒没能设置」（`scheduled: false`），这是预期行为，不是 bug。下班提醒的完整链路只能在生产环境验证。

#### 用临时口令调试

不想在本地用真实口令，可用环境变量覆盖：

```bash
PORT=3100 PUNCH_PASSCODE=123456 pnpm dev
```

Next.js 不会覆盖已存在的 `.env.local` 变量，所以需要先注释掉 `.env.local` 里的 `PUNCH_PASSCODE`，再用命令行传递。

### 常见运维任务

- **改早提醒时间**：修改 `scripts/punch-create-schedule.mjs` 中的 cron（UTC，北京时间减 8 小时），重新运行 `APP_URL=https://<域名> node scripts/punch-create-schedule.mjs` 创建新的 schedule。设置页里的「早提醒时间」文案仅作显示用。
- **换手机或通知失灵**：在新设备上「添加到主屏幕」后，进设置页重新点「开启通知」，旧订阅会被覆盖（只支持一台设备）。
- **设计与计划**：见 `docs/superpowers/specs/2026-09-15-punch-clock-design.md` 和 `docs/superpowers/plans/2026-09-15-punch-clock.md`。
