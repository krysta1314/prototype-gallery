import { Client, Receiver } from "@upstash/qstash";
import { delJobId, getJobId, putJobId } from "./store";
import { beijingWeekdayHHMMToUtcCron } from "./time";

function qstash(): Client {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("缺少 QSTASH_TOKEN");
  // baseUrl 必须指向账号所在的 QStash region，否则一律 401 / "user not found in this region"
  const baseUrl = process.env.QSTASH_URL;
  // 默认重试策略是 5 次指数退避；本地 APP_URL 是 localhost 时 QStash 会直接拒绝，
  // 5 次退避跑完要十几秒，会让打卡按钮卡住。降到 1 次重试，保留应对瞬时抖动的能力。
  const retry = { retries: 1 };
  return new Client(baseUrl ? { token, baseUrl, retry } : { token, retry });
}

function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("缺少 APP_URL");
  return url.replace(/\/$/, "");
}

/**
 * 给某一天排一条下班提醒。fireAtMs 是该触发的 epoch 毫秒。
 * 排程失败返回 null —— 调用方不应因此让打卡整体失败。
 */
export async function scheduleClockOutReminder(
  dateKey: string,
  fireAtMs: number
): Promise<string | null> {
  const delaySec = Math.max(0, Math.round((fireAtMs - Date.now()) / 1000));
  try {
    // 先清掉同一天可能存在的旧排程，避免补卡改时间后推两次
    await cancelClockOutReminder(dateKey);

    const res = await qstash().publishJSON({
      url: `${appUrl()}/api/punch/notify`,
      body: { date: dateKey },
      delay: delaySec,
    });

    // jobId 存储是关键路径，如果失败要回滚整个排程
    try {
      await putJobId(dateKey, res.messageId);
      return res.messageId;
    } catch (err) {
      // 存储失败，尝试删除已排出的消息，避免重复提醒
      console.error("[punch] jobId 存储失败，尝试回滚排程", err);
      try {
        await qstash().messages.delete(res.messageId);
      } catch (deleteErr) {
        // 删除失败可能是网络问题或消息已投递，只记日志不重新抛出
        console.error("[punch] 回滚排程失败（消息可能已删除或投递）", deleteErr);
      }
      return null;
    }
  } catch (err) {
    console.error("[punch] 排程下班提醒失败", err);
    return null;
  }
}

export async function cancelClockOutReminder(dateKey: string): Promise<void> {
  const id = await getJobId(dateKey);
  if (!id) return;
  try {
    await qstash().messages.delete(id);
  } catch (err) {
    // 消息可能已经投递完毕，删不掉是正常的，不当错误处理
    console.warn("[punch] 取消排程失败（可能已投递）", err);
  }
  await delJobId(dateKey);
}

/**
 * 把 QStash 上的早提醒 cron schedule 同步成 hhmm 指定的北京时间。
 * enabled 为 false 时只删除不重建。
 * 返回是否同步成功；失败不抛错，由调用方决定怎么提示。
 */
export async function syncMorningSchedule(hhmm: string, enabled: boolean): Promise<boolean> {
  try {
    const destination = `${appUrl()}/api/punch/notify-morning`;
    const client = qstash();

    const existing = await client.schedules.list();
    for (const s of existing) {
      if (s.destination === destination) {
        await client.schedules.delete(s.scheduleId);
      }
    }

    if (enabled) {
      await client.schedules.create({
        destination,
        cron: beijingWeekdayHHMMToUtcCron(hhmm),
        body: JSON.stringify({ kind: "morning" }),
        headers: { "Content-Type": "application/json" },
      });
    }

    return true;
  } catch (err) {
    console.error("[punch] 同步早提醒 schedule 失败", err);
    return false;
  }
}

/** 校验 QStash 回调签名。签名不对的请求一律拒绝。 */
export async function verifyQstash(request: Request, rawBody: string): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    console.error("[punch] 缺少 QStash 签名密钥");
    return false;
  }
  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;

  try {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    return await receiver.verify({ signature, body: rawBody, url: request.url });
  } catch (err) {
    console.error("[punch] QStash 验签失败", err);
    return false;
  }
}
