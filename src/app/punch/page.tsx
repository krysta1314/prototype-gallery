"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { useToday } from "./_components/use-today";

function useTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function PunchPage() {
  const { data, error, loading, reload } = useToday();
  const now = useTick();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  async function clock(type: "in" | "out") {
    setBusy(true);
    setActionError(null);
    setActionWarning(null);
    try {
      const res = await fetch("/api/punch/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(body.error ?? "打卡失败，请重试");
        return;
      }
      if (type === "in" && body.scheduled === false) {
        setActionWarning("打卡成功。但下班提醒没能设置，可以去设置页重试。");
      }
      await reload();
    } catch {
      setActionError("网络异常，打卡没有成功，请重试");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="p-6 text-center text-neutral-400">加载中…</main>;
  }

  if (error || !data) {
    return (
      <main className="space-y-4 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => void reload()} className="rounded-lg bg-neutral-900 px-4 py-2 text-white">
          重试
        </button>
      </main>
    );
  }

  const { record, leaveAt, leaveAtMs, late } = data;
  const clockedIn = Boolean(record?.in);
  const clockedOut = Boolean(record?.out);
  const countdownMs = leaveAtMs ? leaveAtMs - now.getTime() : 0;
  const canLeave = leaveAtMs !== null && countdownMs <= 0;

  const clockText = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const dateText = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  return (
    <main className="space-y-6 px-6 pt-10">
      <header className="text-center">
        <p className="text-sm text-neutral-500">{dateText}</p>
        <p className="mt-1 font-mono text-5xl font-semibold tabular-nums tracking-tight">
          {clockText}
        </p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        {!clockedIn && (
          <div className="space-y-4 text-center">
            <p className="text-neutral-500">今天还没打上班卡</p>
            <button
              onClick={() => void clock("in")}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-lg text-white disabled:opacity-40"
            >
              <LogIn size={20} />
              {busy ? "打卡中…" : "上班打卡"}
            </button>
          </div>
        )}

        {clockedIn && !clockedOut && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">上班</span>
              <span className="font-mono text-xl tabular-nums">{record!.in}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">可下班</span>
              <span className="font-mono text-xl tabular-nums">{leaveAt}</span>
            </div>
            <div className="rounded-xl bg-neutral-100 py-4 text-center">
              {canLeave ? (
                <p className="text-lg font-medium text-emerald-700">已经可以下班了</p>
              ) : (
                <>
                  <p className="text-xs text-neutral-500">距离下班</p>
                  <p className="font-mono text-3xl font-semibold tabular-nums">
                    {formatCountdown(countdownMs)}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => void clock("out")}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-lg text-white disabled:opacity-40"
            >
              <LogOut size={20} />
              {busy ? "打卡中…" : "下班打卡"}
            </button>
          </div>
        )}

        {clockedIn && clockedOut && (
          <div className="space-y-3 text-center">
            <p className="text-neutral-500">今天已经打完卡了</p>
            <p className="font-mono text-2xl tabular-nums">
              {record!.in} — {record!.out}
            </p>
          </div>
        )}
      </section>

      {late && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-amber-600">
          <AlertCircle size={16} />
          今天的上班卡晚于 {data.settings.clockInDeadline}
        </p>
      )}

      {actionWarning && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
          {actionWarning}
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {actionError}
        </p>
      )}
    </main>
  );
}
