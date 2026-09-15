import webpush from "web-push";
import { delSub, getSub } from "./store";

export type PushPayload = { title: string; body: string; url?: string };

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.error("[punch] 缺少 VAPID 配置");
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export async function sendPush(payload: PushPayload): Promise<{ ok: boolean; error?: string }> {
  if (!configure()) return { ok: false, error: "服务端未配置推送密钥" };

  const sub = await getSub();
  if (!sub) return { ok: false, error: "还没有订阅推送，请先在设置页开启通知" };

  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ url: "/punch", ...payload })
    );
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404/410 表示订阅已失效（用户卸载了 PWA 或清了数据），删掉免得每次都失败
    if (status === 404 || status === 410) {
      await delSub();
      return { ok: false, error: "推送订阅已失效，请在设置页重新开启通知" };
    }
    console.error("[punch] 推送失败", err);
    return { ok: false, error: "推送失败" };
  }
}
