"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/punch/types";
import { PushSetup } from "../_components/push-setup";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/punch/settings", { cache: "no-store" });
      if (res.ok) setSettings(await res.json());
    })();
  }, []);

  async function save() {
    if (!settings) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/punch/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = await res.json().catch(() => ({}));
      setMessage(res.ok ? "已保存" : (body.error ?? "保存失败"));
    } catch {
      setMessage("网络异常");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-4 px-4 pt-8">
      <h1 className="px-1 text-lg font-semibold">设置</h1>

      <PushSetup />

      {settings && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-medium">打卡规则</h2>

          <label className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">上班截止时间</span>
            <input
              type="time"
              value={settings.clockInDeadline}
              onChange={(e) => setSettings({ ...settings, clockInDeadline: e.target.value })}
              className="rounded-lg border border-neutral-200 px-3 py-2"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">每天工时（小时，含午休）</span>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              value={settings.workMinutes / 60}
              onChange={(e) =>
                setSettings({ ...settings, workMinutes: Math.round(Number(e.target.value) * 60) })
              }
              className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-right"
            />
          </label>

          <div className="space-y-1">
            <label className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">早提醒时间</span>
              <input
                type="time"
                value={settings.morningReminder}
                onChange={(e) => setSettings({ ...settings, morningReminder: e.target.value })}
                className="rounded-lg border border-neutral-200 px-3 py-2"
              />
            </label>
            <p className="text-xs text-neutral-400">
              改这里只改显示文案。早提醒的实际发送时间在 QStash 的定时任务里，要改需重新运行
              scripts/punch-create-schedule.mjs。
            </p>
          </div>

          <button
            onClick={() => void save()}
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 py-3 text-white disabled:opacity-40"
          >
            {busy ? "保存中…" : "保存"}
          </button>

          {message && <p className="text-center text-sm text-neutral-600">{message}</p>}
        </section>
      )}

      <p className="px-1 pb-4 text-center text-xs text-neutral-400">
        下班时间 = 上班打卡时间 + 每天工时。周末不发早提醒，但可以正常打卡。
      </p>
    </main>
  );
}
