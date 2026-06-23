"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 轻量滚动入场:元素进入视口时加 .is-in,触发 CSS 过渡。
 * 纯 IntersectionObserver,无第三方动画库;尊重 prefers-reduced-motion。
 * design.md 规范:动效克制,只动 transform / opacity。
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 24,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** 入场延迟,毫秒 */
  delay?: number;
  /** 初始下移距离,px */
  y?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    // 兜底:若元素在挂载时已被滚过(视口上方),直接显示——
    // 否则锚点跳转 / 刷新到中途时,观察器不会触发,内容会永久停在隐藏态。
    if (el.getBoundingClientRect().top < 0) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transition:
          "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
