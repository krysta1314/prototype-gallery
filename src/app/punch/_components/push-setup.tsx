"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Share } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushSetup() {
  const [standalone, setStandalone] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    void (async () => {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration("/punch");
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(Boolean(sub));
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMessage("这个浏览器不支持推送。iPhone 上必须先把页面添加到主屏幕，再从主屏幕图标打开。");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("你拒绝了通知权限。要重新开启，去 iPhone 设置 → 通知 → 打卡。");
        return;
      }

      const reg = await navigator.serviceWorker.register("/punch-sw.js", { scope: "/punch" });
      await navigator.serviceWorker.ready;

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMessage("服务端没配推送密钥");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });

      const res = await fetch("/api/punch/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        setMessage("订阅保存失败，请重试");
        return;
      }

      setSubscribed(true);
      setMessage("通知已开启。");
    } catch (err) {
      setMessage(`开启失败：${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/punch/test-push", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      setMessage(res.ok ? "已发出，几秒内应该能看到通知。" : (body.error ?? "发送失败"));
    } catch {
      setMessage("网络异常");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-medium">通知</h2>

      {!standalone && (
        <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-1.5 font-medium">
            <Share size={16} />
            先添加到主屏幕
          </p>
          <p>
            iPhone 上只有从主屏幕图标打开，通知才能送达。在 Safari 里点底部的分享按钮 → 选「添加到主屏幕」→
            回到桌面点新出现的「打卡」图标打开，再回到这一页开启通知。
          </p>
        </div>
      )}

      <button
        onClick={() => void enable()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-white disabled:opacity-40"
      >
        {subscribed ? <Check size={18} /> : <Bell size={18} />}
        {subscribed ? "通知已开启（点此重新授权）" : "开启通知"}
      </button>

      {subscribed && (
        <button onClick={() => void test()} disabled={busy} className="w-full rounded-xl bg-neutral-100 py-3 text-sm">
          发一条测试通知
        </button>
      )}

      {message && <p className="text-sm text-neutral-600">{message}</p>}
    </section>
  );
}
