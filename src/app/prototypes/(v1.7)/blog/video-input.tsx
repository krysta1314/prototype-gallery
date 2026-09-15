"use client";

/* 区块编辑器里的视频槽:贴 YouTube / Vimeo 链接,或上传 / 拖拽一个视频文件。
   链接走 iframe 嵌入,文件存 IndexedDB(见 video-store.ts),文章里只留引用。 */

import { useEffect, useRef, useState } from "react";
import { Link2, Loader2, Trash2, Upload } from "lucide-react";
import {
  MAX_VIDEO_BYTES,
  deleteVideo,
  embedUrl,
  getVideo,
  isUpload,
  putVideo,
} from "./video-store";

/** 从 IndexedDB 取出上传的视频,转成本次会话可播的 object URL。 */
export function useUploadedVideo(src: string) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isUpload(src)) {
      setUrl("");
      return;
    }
    let revoke = "";
    let alive = true;
    void getVideo(src).then((v) => {
      if (!alive || !v) return;
      revoke = URL.createObjectURL(v.blob);
      setUrl(revoke);
      setName(v.name);
    });
    return () => {
      alive = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src]);

  return { url, name };
}

export function VideoInput({
  src,
  onChange,
}: {
  src: string;
  onChange: (src: string) => void;
}) {
  const [mode, setMode] = useState<"link" | "file">(isUpload(src) ? "file" : "link");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = useUploadedVideo(src);

  const accept = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("That is not a video file.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(
        `${Math.round(file.size / 1024 / 1024)}MB is over the ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB limit for this prototype.`,
      );
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (isUpload(src)) await deleteVideo(src);
      onChange(await putVideo(file));
    } catch {
      setError("Could not store that file in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const embed = !isUpload(src) ? embedUrl(src) : null;

  return (
    <div className="space-y-2.5">
      <div className="flex w-fit rounded-lg border border-[#ececf1] bg-white p-0.5">
        {(
          [
            { key: "link", label: "Link", icon: Link2 },
            { key: "file", label: "Upload", icon: Upload },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12.5px] font-bold transition ${
              mode === t.key ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:text-[#1a1a2e]"
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <>
          <input
            value={isUpload(src) ? "" : src}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a YouTube or Vimeo link"
            className="w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b6c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20"
          />
          {embed && (
            <div className="overflow-hidden rounded-xl border border-[#ececf1]">
              <iframe
                src={embed}
                title="Video preview"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
          )}
          {!isUpload(src) && src.trim() && !embed && (
            <p className="text-[12px] text-[#9a9aa8]">
              Not a YouTube or Vimeo link — it will be played as a direct video file.
            </p>
          )}
        </>
      ) : uploaded.url ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-[#ececf1]">
            <video src={uploaded.url} controls className="aspect-video w-full bg-black" />
          </div>
          <div className="flex items-center gap-2">
            <span className="truncate text-[12.5px] font-semibold text-[#6a6b7b]">
              {uploaded.name}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="ml-auto rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                void deleteVideo(src);
                onChange("");
              }}
              aria-label="Remove video"
              className="inline-flex size-7 items-center justify-center rounded-lg text-[#6a6b7b] transition hover:text-[#ff5255]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void accept(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3.5 py-7 text-center transition ${
            over
              ? "border-[#ff5e1a] bg-[#fff7f1]"
              : "border-[#d4d3df] bg-white hover:border-[#ff5e1a] hover:bg-[#fffaf7]"
          }`}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-[#ff5e1a]" />
          ) : (
            <Upload className="size-5 text-[#9a9aa8]" />
          )}
          <span className="text-[13px] font-bold text-[#1a1a2e]">
            {busy ? "Storing…" : "Drop a video here, or click to choose"}
          </span>
          <span className="text-[11.5px] text-[#9a9aa8]">
            MP4 or WebM · up to {Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB in this prototype
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        hidden
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-[12px] font-semibold text-[#c22f32]">{error}</p>}
    </div>
  );
}
