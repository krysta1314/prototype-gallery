"use client";

import { useEffect, useRef } from "react";

/** 播放中每帧回调当前时间(暂停时也在 seek 后回调一次)。
    video 元素是条件渲染的(换了 / 后出现)时,把能区分它的值传进 remountKey,好重新挂监听 */
export function useVideoClock(ref: React.RefObject<HTMLVideoElement | null>, onTime: (t: number) => void, remountKey?: unknown) {
  const cb = useRef(onTime);
  useEffect(() => {
    cb.current = onTime;
  });
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      cb.current(v.currentTime);
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    v.addEventListener("play", start);
    v.addEventListener("seeked", tick);
    v.addEventListener("loadeddata", tick);
    v.addEventListener("timeupdate", tick);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", start);
      v.removeEventListener("seeked", tick);
      v.removeEventListener("loadeddata", tick);
      v.removeEventListener("timeupdate", tick);
    };
  }, [ref, remountKey]);
}

