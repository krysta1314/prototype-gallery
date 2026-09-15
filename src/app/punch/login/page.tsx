"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/punch/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "登录失败");
        return;
      }
      router.replace("/punch");
      router.refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-6">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <h1 className="text-center text-2xl font-semibold tracking-tight">打卡</h1>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="请输入口令"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-neutral-900"
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !passcode}
          className="w-full rounded-xl bg-neutral-900 py-3 text-white disabled:opacity-40"
        >
          {busy ? "验证中…" : "进入"}
        </button>
      </form>
    </main>
  );
}
