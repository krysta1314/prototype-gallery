/**
 * 一次性脚本：在 QStash 里创建早提醒的 cron schedule。
 * 只需在生产部署后跑一次。重复跑会先删掉指向同一 URL 的旧 schedule 再建新的。
 *
 * 用法：
 *   APP_URL=https://你的域名 QSTASH_TOKEN=xxx node scripts/punch-create-schedule.mjs
 *
 * cron "55 1 * * 1-5" 是 UTC，对应北京时间周一到周五 09:55。
 * 改早提醒时间时记得同步改这里（北京时间减 8 小时）。
 */
import { Client } from "@upstash/qstash";

const token = process.env.QSTASH_TOKEN;
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
const baseUrl = process.env.QSTASH_URL;

if (!token || !appUrl) {
  console.error("需要 QSTASH_TOKEN 和 APP_URL 两个环境变量");
  process.exit(1);
}

const destination = `${appUrl}/api/punch/notify-morning`;
const cron = "55 1 * * 1-5";

const client = new Client(baseUrl ? { token, baseUrl } : { token });

const existing = await client.schedules.list();
for (const s of existing) {
  if (s.destination === destination) {
    console.log(`删除旧 schedule ${s.scheduleId}`);
    await client.schedules.delete(s.scheduleId);
  }
}

const created = await client.schedules.create({
  destination,
  cron,
  body: JSON.stringify({ kind: "morning" }),
  headers: { "Content-Type": "application/json" },
});

console.log(`已创建 schedule ${created.scheduleId}`);
console.log(`  目标: ${destination}`);
console.log(`  cron: ${cron} (UTC) = 北京时间周一至周五 09:55`);
