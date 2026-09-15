"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayResponse } from "@/lib/punch/api-types";

export function useToday() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/punch/today", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(null);
    } catch {
      setError("读取失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // 从后台切回前台时刷新，免得看到过期的时间
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  return { data, error, loading, reload };
}
