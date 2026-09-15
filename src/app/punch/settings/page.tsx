"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/punch/types";
import { PushSetup } from "../_components/push-setup";
import { useToday } from "../_components/use-today";

type SaveState =
  | { kind: "idle" }
  | { kind: "ok"; text: string }
  | { kind: "warn"; text: string }
  | { kind: "error"; text: string };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const { data: today } = useToday();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/punch/settings", { cache: "no-store" });
      if (res.ok) setSettings(await res.json());
    })();
  }, []);

  async function save(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setBusy(true);
    setState({ kind: "idle" });
    try {
      const res = await fetch("/api/punch/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: "error", text: resBody.error ?? "保存失败" });
        return;
      }
      if (resBody.morningSynced === false) {
        setState({ kind: "warn", text: "已保存。上班提醒的定时任务同步失败，部署后会自动重试。" });
      } else {
        setState({ kind: "ok", text: "已保存" });
      }
    } catch {
      setState({ kind: "error", text: "网络异常" });
    } finally {
      setBusy(false);
    }
  }

  let eveningNote = "";
  if (today) {
    if (today.record?.out) {
      eveningNote = "今天已经打完卡了";
    } else if (today.record?.in && today.leaveAt) {
      eveningNote = `今天 ${today.record.in} 上班，会在 ${today.leaveAt} 提醒你`;
    } else {
      const hours = settings ? settings.workMinutes / 60 : 9;
      eveningNote = `打了上班卡之后，会在 ${hours} 小时后提醒你`;
    }
  }

  return (
    <main className="space-y-4 px-4 pt-8">
      <h1 className="px-1 text-lg font-semibold">设置</h1>

      <PushSetup />

      {settings && (
        <>
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">上班提醒</h2>
              <Toggle
                checked={settings.morningEnabled}
                disabled={busy}
                onChange={(v) => void save({ morningEnabled: v })}
              />
            </div>

            <label className="flex items-center justify-between">
              <span className={fieldLabelClass(settings.morningEnabled)}>提醒时间</span>
              <input
                type="time"
                value={settings.morningReminder}
                disabled={!settings.morningEnabled || busy}
                onChange={(e) => setSettings({ ...settings, morningReminder: e.target.value })}
                onBlur={() => void save({ morningReminder: settings.morningReminder })}
                className={inputClass(settings.morningEnabled)}
              />
            </label>

            <label className="flex items-center justify-between">
              <span className={fieldLabelClass(settings.morningEnabled)}>上班截止时间</span>
              <input
                type="time"
                value={settings.clockInDeadline}
                disabled={!settings.morningEnabled || busy}
                onChange={(e) => setSettings({ ...settings, clockInDeadline: e.target.value })}
                onBlur={() => void save({ clockInDeadline: settings.clockInDeadline })}
                className={inputClass(settings.morningEnabled)}
              />
            </label>

            <p className="text-xs text-neutral-400">工作日才提醒，周末不发。</p>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">下班提醒</h2>
              <Toggle
                checked={settings.eveningEnabled}
                disabled={busy}
                onChange={(v) => void save({ eveningEnabled: v })}
              />
            </div>

            <label className="flex items-center justify-between">
              <span className={fieldLabelClass(settings.eveningEnabled)}>每天工时（小时，含午休）</span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={settings.workMinutes / 60}
                disabled={!settings.eveningEnabled || busy}
                onChange={(e) =>
                  setSettings({ ...settings, workMinutes: Math.round(Number(e.target.value) * 60) })
                }
                onBlur={() => void save({ workMinutes: settings.workMinutes })}
                className={`w-24 text-right ${inputClass(settings.eveningEnabled)}`}
              />
            </label>

            {settings.eveningEnabled && eveningNote && (
              <p className="text-xs text-neutral-400">{eveningNote}</p>
            )}
          </section>

          {state.kind !== "idle" && (
            <p
              className={`text-center text-sm ${
                state.kind === "error"
                  ? "text-red-600"
                  : state.kind === "warn"
                    ? "text-amber-600"
                    : "text-neutral-600"
              }`}
            >
              {state.text}
            </p>
          )}
        </>
      )}

      <p className="px-1 pb-4 text-center text-xs text-neutral-400">
        下班时间 = 上班打卡时间 + 每天工时。周末不发早提醒，但可以正常打卡。
      </p>
    </main>
  );
}

function fieldLabelClass(enabled: boolean): string {
  return `text-sm ${enabled ? "text-neutral-600" : "text-neutral-300"}`;
}

function inputClass(enabled: boolean): string {
  return `rounded-lg border px-3 py-2 ${
    enabled ? "border-neutral-200 text-neutral-900" : "border-neutral-100 bg-neutral-50 text-neutral-300"
  }`;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-neutral-900" : "bg-neutral-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
