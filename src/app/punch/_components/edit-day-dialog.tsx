"use client";

import { useRef, useState } from "react";
import type { DayCell } from "@/lib/punch/api-types";
import type { DayStatus } from "@/lib/punch/types";

const STATUS_OPTIONS: { value: DayStatus; label: string }[] = [
  { value: "normal", label: "正常" },
  { value: "leave", label: "请假" },
  { value: "holiday", label: "假期" },
];

export function EditDayDialog({
  cell,
  onClose,
  onSaved,
}: {
  cell: DayCell;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [inTime, setInTime] = useState(cell.record?.in ?? "");
  const [outTime, setOutTime] = useState(cell.record?.out ?? "");
  const [note, setNote] = useState(cell.record?.note ?? "");
  const [status, setStatus] = useState<DayStatus>(cell.record?.status ?? "normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 记住打开弹窗时的初始值，save() 时只提交真正变化的字段——
  // 避免「打开看一眼、什么都没改就点保存」也被打上「手动」角标。
  const initial = useRef({
    in: cell.record?.in ?? "",
    out: cell.record?.out ?? "",
    note: cell.record?.note ?? "",
    status: cell.record?.status ?? "normal",
  });

  async function save() {
    const patch: Record<string, string> = {};
    if (inTime !== initial.current.in) patch.in = inTime;
    if (outTime !== initial.current.out) patch.out = outTime;
    if (note !== initial.current.note) patch.note = note;
    if (status !== initial.current.status) patch.status = status;

    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/punch/records/${cell.date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "保存失败");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("网络异常，没有保存成功");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{cell.date}</h2>

        <div className="flex gap-3">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={`flex-1 rounded-lg py-2 text-sm ${
                status === o.value ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {status === "normal" && (
          <div className="flex gap-3">
            <label className="flex-1 space-y-1">
              <span className="text-sm text-neutral-500">上班</span>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
            </label>
            <label className="flex-1 space-y-1">
              <span className="text-sm text-neutral-500">下班</span>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
            </label>
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-neutral-500">备注</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：外出开会"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-neutral-100 py-3">
            取消
          </button>
          <button
            onClick={() => void save()}
            disabled={busy}
            className="flex-1 rounded-xl bg-neutral-900 py-3 text-white disabled:opacity-40"
          >
            {busy ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
