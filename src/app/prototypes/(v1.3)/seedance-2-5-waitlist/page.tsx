"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Play } from "lucide-react";

/* ---------- Brand ---------- */
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const ctaBtn =
  "w-full rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 " +
  "text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] " +
  "transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)] " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:brightness-100";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES: { title: string; desc: string }[] = [
  { title: "30s continuous shots", desc: "six times the runway in one take" },
  { title: "Nothing drifts", desc: "lighting, character & scene stay locked" },
  { title: "Region edit", desc: "swap an object or fix a face without re-rendering" },
  { title: "50 references at once", desc: "feed everything into one generation" },
  { title: "Motion guidance (R2V)", desc: "copy motion from a reference clip" },
];

/* =================================================================
   Waitlist modal
   ================================================================= */
function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = EMAIL_RE.test(email.trim());
  const showError = touched && email.trim().length > 0 && !valid;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal,60)] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Seedance 2.5 launch notification"
    >
      {/* backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="wl-backdrop absolute inset-0 cursor-default bg-[#1a1a2e]/45 backdrop-blur-[6px]"
      />

      {/* card */}
      <div className="wl-card relative w-full max-w-[560px] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-20px_rgba(26,26,46,0.45)] ring-1 ring-black/[0.04]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 grid size-8 place-items-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white"
        >
          <X className="size-[18px]" strokeWidth={2.2} />
        </button>

        {/* preview banner — a cinematic frame, not an icon block */}
        <div className="wl-banner relative h-[164px] w-full overflow-hidden">
          <div className="wl-banner-glow absolute inset-0" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_15%_0%,rgba(255,167,60,0.35),transparent_55%),radial-gradient(120%_140%_at_100%_100%,rgba(255,82,85,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[#141414]/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
            <span className="grid size-11 place-items-center rounded-full bg-white/12 ring-1 ring-white/25 backdrop-blur-sm">
              <Play className="size-4 translate-x-[1px] fill-white/85" strokeWidth={0} />
            </span>
            <span className="text-[12px] tracking-wide">此处放 Seedance 2.5 预告视频素材</span>
          </div>
        </div>

        {/* body */}
        <div className="px-7 pb-7 pt-6">
          {done ? (
            <div className="wl-success flex flex-col items-center py-4 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#fff3ec]">
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white">
                  <Check className="size-5" strokeWidth={3} />
                </span>
              </div>
              <h2 className="mt-4 text-[22px] font-extrabold tracking-tight text-[#1a1a2e]">
                You&rsquo;re on the list
              </h2>
              <p className="mt-2 max-w-[19rem] text-[14px] leading-relaxed text-[#6a6b7b]">
                We&rsquo;ll email{" "}
                <span className="font-semibold text-[#1a1a2e]">{email.trim()}</span>{" "}
                the moment Seedance 2.5 goes live.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl border border-[#ececf1] bg-white px-6 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-[23px] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
                Seedance 2.5 coming soon
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6a6b7b]">
                The world&rsquo;s best video generation model — coming to BuzzVideo soon:
              </p>

              <ul className="mt-4 space-y-2.5">
                {FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-2.5">
                    <Check
                      className="mt-[3px] size-4 shrink-0 text-[#ff5e1a]"
                      strokeWidth={2.75}
                    />
                    <p className="text-[13.5px] leading-snug text-[#6a6b7b]">
                      <span className="font-semibold text-[#1a1a2e]">
                        {f.title}
                      </span>{" "}
                      — {f.desc}
                    </p>
                  </li>
                ))}
              </ul>

              <form onSubmit={submit} noValidate className="mt-5">
                <label
                  htmlFor="wl-email"
                  className="mb-1.5 block text-[13px] font-semibold text-[#1a1a2e]"
                >
                  Get notified when it&rsquo;s ready
                </label>
                <input
                  ref={inputRef}
                  id="wl-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={showError}
                  className={
                    "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-[#1a1a2e] outline-none transition placeholder:text-[#a3a3ad] " +
                    (showError
                      ? "border-[#ff5255] focus-visible:ring-2 focus-visible:ring-[#ff5255]/25"
                      : "border-[#ececf1] focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20")
                  }
                />
                <div
                  className={
                    "overflow-hidden transition-all " +
                    (showError ? "mt-1.5 max-h-8" : "max-h-0")
                  }
                >
                  <p className="text-[12.5px] font-medium text-[#ff5255]">
                    Please enter a valid email address.
                  </p>
                </div>

                <button type="submit" disabled={!valid} className={"mt-4 " + ctaBtn}>
                  Notify me at launch
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =================================================================
   Page — blurred faux landing backdrop + auto-opening modal
   ================================================================= */
export default function Page() {
  const [open, setOpen] = useState(true);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#faf8f6] text-[#1a1a2e]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* ---- dimmed, blurred backdrop suggesting the Seedance 2.5 landing ---- */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-0 transition duration-500 " +
          (open ? "scale-[1.03] blur-[3px]" : "blur-0")
        }
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_52%,#ffdedf_100%)]" />
        <div className="mx-auto max-w-[1040px] px-6 pt-24">
          <div className="max-w-[640px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#ff5e1a]">
              New model
            </div>
            <h1 className="text-[clamp(38px,6vw,68px)] font-extrabold leading-[1.05] tracking-tight">
              Turn a single prompt into cinematic video with Seedance 2.5.
            </h1>
            <p className="mt-5 max-w-[30rem] text-[18px] leading-relaxed text-[#6a6b7b]">
              The next generation of Buzz&rsquo;s video model. Longer shots,
              steadier motion, sharper detail.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-2xl bg-[#1f2030] shadow-[0_16px_36px_rgba(26,26,46,0.2)]"
                style={{
                  backgroundImage:
                    i === 1
                      ? "radial-gradient(120% 120% at 30% 0%, rgba(255,167,60,0.5), transparent 60%), radial-gradient(120% 120% at 100% 100%, rgba(255,82,85,0.5), transparent 55%)"
                      : "radial-gradient(120% 120% at 70% 10%, rgba(255,140,80,0.35), transparent 60%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- center reopen affordance when modal is closed ---- */}
      {!open && (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <button
            onClick={() => setOpen(true)}
            className={"max-w-[340px] " + ctaBtn}
          >
            Notify me when Seedance 2.5 launches
          </button>
        </div>
      )}

      {open && <WaitlistModal onClose={() => setOpen(false)} />}

      {/* 演示说明(非产品 UI) */}
      <p className="pointer-events-none fixed bottom-4 left-1/2 z-[var(--z-toast,70)] -translate-x-1/2 rounded-full bg-[#1a1a2e]/80 px-4 py-1.5 text-[12px] text-white/85 backdrop-blur-sm">
        关闭弹窗后可点中央按钮重新打开
      </p>

      <style>{`
        @keyframes wl-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wl-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wl-drift {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(-3%,2%,0); }
        }
        .wl-card { animation: wl-in 0.42s cubic-bezier(0.16,1,0.3,1) both; }
        .wl-backdrop { animation: wl-fade 0.3s ease-out both; }
        .wl-success { animation: wl-fade 0.35s ease-out both; }
        .wl-banner { background: #141414; }
        .wl-banner-glow {
          background: radial-gradient(140% 140% at 20% 20%, rgba(255,167,60,0.55), transparent 60%);
          animation: wl-drift 9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-card, .wl-backdrop, .wl-success { animation: none; }
          .wl-banner-glow { animation: none; }
        }
      `}</style>
    </main>
  );
}
