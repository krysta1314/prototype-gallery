# Playad / AI Buzz Video Onboarding Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity, fully-interactive single-file onboarding demo replicating the Playad ad-generation flow in a premium Light Mode theme, branded as AI Buzz Video.

**Architecture:** One self-contained `index.html` using CDN React 18 + Babel Standalone (in-browser JSX) + Tailwind CDN + Lucide. A single `step` state (0–7) drives the flow; each step is its own component; all content lives in one `DATA` constant; simulated timers (`setTimeout`/`setInterval`) auto-advance the loading steps.

**Tech Stack:** React 18 (UMD CDN), ReactDOM 18, Babel Standalone, Tailwind CDN, Lucide (UMD), no build step.

**Verification model:** No test runner — this is a static prototype. Every task ends by opening the file in a browser (or the Claude Preview MCP) and confirming the described behavior visually. There are NO unit tests.

**Spec:** `docs/superpowers/specs/2026-06-04-playad-onboarding-design.md`

---

## File Structure

- Create: `prototypes/2026-06-04-playad-onboarding/index.html` — the entire demo (HTML shell + CDN scripts + one `<script type="text/babel">` containing all React components and `DATA`).
- Modify: `prototypes.json` — append one record so the gallery home page lists the demo.

All components live in the single Babel script block, in this order: `DATA` constant → small shared helpers (`Logo`, `Modal`, `GoogleIcon`, `JordanAvatar`) → step components `LoginScreen`…`Dashboard` → `AdPoster`/`Lightbox` → `AppShell` → root `App` → `ReactDOM.createRoot` render.

---

## Task 1: Scaffold the HTML shell, CDNs, and App skeleton

**Files:**
- Create: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Create the file with the full shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Buzz Video — Onboarding Demo</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    html, body, #root { height: 100%; }
    body { background: #F9FAFB; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .fade-in { animation: fadeIn .35s ease-out; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect } = React;

    // ---- DATA (filled in Task 2) ----
    const DATA = {};

    function App() {
      const [step, setStep] = useState(0);
      return (
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="text-gray-400">step {step}</div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify it renders**

Open `prototypes/2026-06-04-playad-onboarding/index.html` in a browser (or via Claude Preview MCP).
Expected: off-white page showing the text "step 0", no console errors.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: scaffold AI Buzz Video onboarding demo shell"
```

---

## Task 2: Add the DATA constant and shared visual helpers

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace `const DATA = {};` with the full data object**

```jsx
const DATA = {
  brandName: "Buzz Agent",
  url: "https://app.buzzvideo.ai/",
  defaultName: "Monica Zhou",
  palette: ["#1D1D1F", "#F7D290", "#F0B86C", "#E05A47"],
  fonts: ["Google Sans", "Roboto"],
  brandKnowledge:
    "Buzz Agent appears to be an AI-powered marketing and ad creation product within the Buzzvideo.ai ecosystem. The landing page presents a clear promise: users can go from idea to ready-to-run ads in minutes with Buzz Agent. Based on the visible messaging, the product is positioned as a marketing agent that helps transform ideas into launch-ready advertising assets quickly. The offer is framed around reducing the time and effort required to produce performant creative.",
  countries: ["United States"],
  languages: ["English"],
  categories: ["AI marketing software"],
  audience: [
    "Performance marketers who need to launch campaigns quickly",
    "Startup founders and lean growth teams",
    "Small businesses exploring AI for marketing",
  ],
  extractionTexts: [
    "Analyzing your website...",
    "Extracting brand assets...",
    "Understanding brand DNA...",
  ],
  formats: [
    { id: "feed45", label: "Feed", ratio: "4:5", icon: "square" },
    { id: "stories916", label: "Stories", ratio: "9:16", icon: "rectangle-vertical" },
    { id: "reels916", label: "Reels", ratio: "9:16", icon: "clapperboard" },
    { id: "square11", label: "Square", ratio: "1:1", icon: "square" },
    { id: "land169", label: "Landscape", ratio: "16:9", icon: "rectangle-horizontal" },
    { id: "portrait23", label: "Portrait", ratio: "2:3", icon: "image" },
  ],
  proTips: [
    "The first 3 seconds determine 77% of whether users keep watching.",
    "90% of ad recall impact is visual.",
    "70% of campaign performance variance comes from creative quality.",
  ],
  ads: [
    { id: 1, headline: "From idea to ad in minutes", sub: "Let Buzz Agent build your next winner", cta: "Try Buzz Agent" },
    { id: 2, headline: "Your brand, on autopilot", sub: "Ads that test, iterate and ship", cta: "Generate ads" },
    { id: 3, headline: "Stop guessing. Start shipping.", sub: "AI creative that performs", cta: "Start free" },
  ],
  inspirations: [
    { brand: "Plai", tag: "Competitor", hue: "#6D28D9" },
    { brand: "Celtra", tag: "Competitor", hue: "#0EA5E9" },
  ],
  schedule: [
    { date: "4 June", task: "Competitor strategy report" },
    { date: "5 June", task: "Launch Feed 4:5 creative test" },
    { date: "6 June", task: "Review Stories 9:16 performance" },
    { date: "7 June", task: "Refresh top creative variant" },
  ],
  plans: [
    { name: "Full Time", price: "$499", per: "/mo", features: ["Unlimited creatives", "3 ad accounts", "Email support"], featured: false },
    { name: "CMO", price: "$1799", per: "/mo", features: ["Everything in Full Time", "Dedicated strategist", "Priority generation", "Unlimited accounts"], featured: true },
  ],
};
```

- [ ] **Step 2: Add shared helper components above `App`**

```jsx
function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="bzg" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0" stopColor="#F7A23B" />
            <stop offset="1" stopColor="#E0492E" />
          </linearGradient>
        </defs>
        <path d="M10 6h16a11 11 0 0 1 0 22H10z M10 24h18a11 11 0 0 1 0 22H10z" fill="url(#bzg)" />
        <path d="M40 4l2.2 5.8L48 12l-5.8 2.2L40 20l-2.2-5.8L32 12l5.8-2.2z" fill="#F7A23B" />
      </svg>
      <span className="font-extrabold text-lg tracking-tight text-gray-900">AI Buzz Video</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function JordanAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
      </div>
    </div>
  );
}

function Modal({ children, onClose, maxW = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 w-full ${maxW} max-h-[90vh] overflow-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify no errors**

Reload the page. Expected: still shows "step 0", no console errors (helpers are defined but not yet used).

- [ ] **Step 4: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: add DATA constant and shared visual helpers"
```

---

## Task 3: AppShell + restart control + App wiring

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Add `AppShell` above `App`**

```jsx
function AppShell({ step, onRestart, children }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          {step > 0 && (
            <button onClick={onRestart} className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              Restart demo
            </button>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Replace the `App` body with full wiring (placeholders for steps)**

```jsx
function App() {
  const [step, setStep] = useState(0);
  const [selectedFormats, setSelectedFormats] = useState(["feed45", "stories916", "reels916"]);

  function restart() {
    setSelectedFormats(["feed45", "stories916", "reels916"]);
    setStep(0);
  }

  return (
    <AppShell step={step} onRestart={restart}>
      <div key={step} className="fade-in">
        {step === 0 && <LoginScreen onNext={() => setStep(1)} />}
        {step === 1 && <BasicDetailsForm onNext={() => setStep(2)} />}
        {step === 2 && <UrlInputScreen onNext={() => setStep(3)} />}
        {step === 3 && <ExtractionLoading onDone={() => setStep(4)} />}
        {step === 4 && <BrandDNAResult onNext={() => setStep(5)} />}
        {step === 5 && (
          <ConfigModal
            selectedFormats={selectedFormats}
            setSelectedFormats={setSelectedFormats}
            onSubmit={() => setStep(6)}
          />
        )}
        {step === 6 && <GenerationLoading onDone={() => setStep(7)} />}
        {step === 7 && <Dashboard />}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add temporary stubs so the app compiles**

Add these stub components above `App` (each will be replaced in later tasks):

```jsx
function LoginScreen({ onNext }) { return <div className="p-10"><button className="text-indigo-600" onClick={onNext}>stub login → next</button></div>; }
function BasicDetailsForm({ onNext }) { return <div className="p-10"><button className="text-indigo-600" onClick={onNext}>stub details → next</button></div>; }
function UrlInputScreen({ onNext }) { return <div className="p-10"><button className="text-indigo-600" onClick={onNext}>stub url → next</button></div>; }
function ExtractionLoading({ onDone }) { return <div className="p-10"><button className="text-indigo-600" onClick={onDone}>stub extract → next</button></div>; }
function BrandDNAResult({ onNext }) { return <div className="p-10"><button className="text-indigo-600" onClick={onNext}>stub dna → next</button></div>; }
function ConfigModal({ onSubmit }) { return <div className="p-10"><button className="text-indigo-600" onClick={onSubmit}>stub modal → next</button></div>; }
function GenerationLoading({ onDone }) { return <div className="p-10"><button className="text-indigo-600" onClick={onDone}>stub gen → next</button></div>; }
function Dashboard() { return <div className="p-10 text-gray-500">stub dashboard (step 7)</div>; }
```

- [ ] **Step 4: Verify the full click-through works**

Reload. Expected: AI Buzz Video header with logo; clicking each stub link advances 0→1→2→…→7; "Restart demo" appears from step 1 onward and returns to step 0. No console errors.

- [ ] **Step 5: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: add AppShell, restart control, and step routing with stubs"
```

---

## Task 4: Step 0 — LoginScreen

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `LoginScreen` stub**

```jsx
function LoginScreen({ onNext }) {
  return (
    <div className="grid lg:grid-cols-2 min-h-[calc(100vh-3.5rem)]">
      <div className="bg-gray-50 px-10 py-16 flex flex-col justify-center border-r border-gray-200">
        <span className="inline-block w-fit text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 mb-8">
          Try 3 Creatives Free — no card.
        </span>
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Your next best-performing ad, generated in 3 minutes.
        </h1>
        <p className="mt-5 text-gray-500 max-w-md text-lg">
          AI Buzz Video turns your brand kit into ads that test, iterate and ship. So the next winner is always queued up.
        </p>
        <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">Your brand kit</span>
            <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 font-medium">Ready</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Logo", "Color", "Type"].map((l) => (
              <div key={l} className="rounded-xl border border-gray-100 bg-gray-50 h-20 flex items-end p-2 text-xs text-gray-500">{l}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-10 py-16 flex flex-col justify-center max-w-md mx-auto w-full">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Let's get started!</h2>
        <button onClick={onNext} className="w-full border border-gray-300 rounded-xl py-3 flex items-center justify-center gap-3 font-medium text-gray-700 hover:bg-gray-50 transition-all">
          <GoogleIcon /> Continue with Google
        </button>
        <div className="flex items-center gap-4 my-6 text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-200" /> or <div className="flex-1 h-px bg-gray-200" />
        </div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input className="mt-1.5 mb-4 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all" placeholder="you@company.com" />
        <label className="text-sm font-medium text-gray-700">Password</label>
        <input type="password" className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all" placeholder="••••••••" />
        <button onClick={onNext} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 transition-all">
          Continue
        </button>
        <p className="mt-6 text-xs text-gray-400 text-center">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Reload. Expected: split-screen login; left gray hero with headline + brand-kit card; right white panel with Google button, email/password, Continue. Clicking either "Continue with Google" or "Continue" goes to step 1.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 0 login screen"
```

---

## Task 5: Step 1 — BasicDetailsForm

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `BasicDetailsForm` stub**

```jsx
function BasicDetailsForm({ onNext }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <JordanAvatar />
        <p className="text-gray-900 text-lg">Hi there! I'm Jordan, your marketing director. Let's set up your basic details.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Basic details</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input defaultValue={DATA.defaultName} className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Language</label>
            <select defaultValue="English" className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-white transition-all">
              <option>English</option><option>中文</option><option>Español</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Timezone</label>
            <select defaultValue="Asia/Shanghai (CST)" className="mt-1.5 w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 bg-white transition-all">
              <option>Asia/Shanghai (CST)</option><option>America/New_York (EST)</option><option>Europe/London (GMT)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-7 py-3 transition-all">Continue</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Reload, advance to step 1. Expected: Jordan avatar + greeting; white card with Name (pre-filled "Monica Zhou"), Language (English), Timezone (Asia/Shanghai (CST)); Continue → step 2.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 1 basic details form"
```

---

## Task 6: Step 2 — UrlInputScreen

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `UrlInputScreen` stub**

```jsx
function UrlInputScreen({ onNext }) {
  const features = [
    { title: "Extract brand assets", desc: "Logos, colors, and imagery pulled straight from your site." },
    { title: "Brand DNA collection", desc: "Tone, positioning, and visual identity, decoded." },
    { title: "Pinpoint target audience", desc: "Who to reach and what makes them convert." },
  ];
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <JordanAvatar />
        <p className="text-gray-900 text-lg">Drop your website and we'll make your first ad. I can analyze your brand identity, positioning, and competitors.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {features.map((f) => (
          <div key={f.title} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h3 className="font-bold text-indigo-900 mb-2">{f.title}</h3>
            <p className="text-sm text-indigo-700/80">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900">What's your brand?</h2>
        <p className="text-gray-500 mt-1 mb-5">Drop your URL and we'll make your first ad in 30 seconds.</p>
        <input defaultValue={DATA.url} placeholder="Enter URL" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all" />
        <div className="flex justify-end mt-6">
          <button onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-7 py-3 transition-all">Continue</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Reload, advance to step 2. Expected: greeting; 3 indigo feature cards; URL input pre-filled with `https://app.buzzvideo.ai/`; Continue → step 3.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 2 URL input screen"
```

---

## Task 7: Step 3 — ExtractionLoading (4.5s, rotating text)

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `ExtractionLoading` stub**

```jsx
function ExtractionLoading({ onDone }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setI((p) => Math.min(p + 1, DATA.extractionTexts.length - 1)), 1500);
    const done = setTimeout(onDone, 4500);
    return () => { clearInterval(rot); clearTimeout(done); };
  }, []);
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-indigo-600 spin" />
      <h2 className="mt-8 text-2xl font-bold text-gray-900">Fetching your brand DNA</h2>
      <p className="mt-3 text-gray-500 text-lg">{DATA.extractionTexts[i]}</p>
      <div className="mt-8 w-full max-w-xl border border-gray-200 bg-white rounded-2xl px-6 py-5 text-gray-700 font-medium shadow-sm">
        {DATA.url}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Reload, advance to step 3. Expected: spinning circle; text cycles "Analyzing your website..." → "Extracting brand assets..." → "Understanding brand DNA..." at 1.5s each; auto-advances to step 4 at 4.5s.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 3 extraction loading with simulated timer"
```

---

## Task 8: Step 4 — BrandDNAResult (rich layout)

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Add a `Card` helper above `App` (reused by this step)**

```jsx
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-5 ${className}`}>
      {title && <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>}
      {children}
    </div>
  );
}
function Chip({ children }) {
  return <span className="inline-block text-sm bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5 border border-gray-200">{children}</span>;
}
```

- [ ] **Step 2: Replace the `BrandDNAResult` stub**

```jsx
function BrandDNAResult({ onNext }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your brand DNA</h1>
        <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm rounded-full pl-2 pr-3 py-1">
          <span className="w-4 h-4 rounded-full bg-white text-gray-900 flex items-center justify-center text-[10px] font-bold">✓</span>
          Completed
        </span>
      </div>

      <Card className="mb-5">
        <h2 className="text-2xl font-extrabold text-gray-900">{DATA.brandName}</h2>
        <p className="text-gray-400 text-sm mt-1">{DATA.url}</p>
      </Card>

      <div className="grid md:grid-cols-3 gap-5 mb-5">
        <Card title="Logo">
          <div className="h-24 rounded-xl border border-gray-100 flex items-center justify-center bg-[length:16px_16px] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[position:0_0,8px_8px]">
            <Logo size={32} />
          </div>
        </Card>
        <Card title="Color">
          <div className="flex h-24 rounded-xl overflow-hidden border border-gray-100">
            {DATA.palette.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}
          </div>
        </Card>
        <Card title="Typography">
          <div className="flex gap-6 items-end h-24">
            {DATA.fonts.map((f) => (
              <div key={f} className="text-center">
                <div className="text-4xl text-gray-900">Aa</div>
                <div className="text-xs text-gray-500 mt-1">{f}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-5">
        <Card title="Brand Knowledge" className="md:col-span-2">
          <p className="text-sm font-semibold text-gray-900 mb-1">Brand Overview</p>
          <p className="text-sm text-gray-600 leading-relaxed">{DATA.brandKnowledge}</p>
        </Card>
        <Card title="Assets">
          <div className="grid grid-cols-2 gap-2">
            {["#3b2a24", "#5a3b2e", "#7a4a33", "#2a2320"].map((c) => (
              <div key={c} className="h-16 rounded-lg" style={{ background: `radial-gradient(circle at 30% 30%, ${c}, #1a1410)` }} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-5">
        <Card title="Countries"><Chip>{DATA.countries[0]}</Chip></Card>
        <Card title="Languages"><Chip>{DATA.languages[0]}</Chip></Card>
        <Card title="Categories"><Chip>{DATA.categories[0]}</Chip></Card>
      </div>

      <Card title="Target Audience" className="mb-8">
        <div className="space-y-2">
          {DATA.audience.map((a) => <p key={a} className="text-gray-600 text-sm">{a}</p>)}
        </div>
      </Card>

      <div className="flex justify-end">
        <button onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-7 py-3 transition-all">Generate & Analyze</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Reload, advance to step 4. Expected: "Your brand DNA" + Completed badge; Buzz Agent card; Logo/Color/Typography row; Brand Knowledge + Assets; Countries/Languages/Categories chips; Target Audience list; "Generate & Analyze" button.

- [ ] **Step 4: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 4 brand DNA result"
```

---

## Task 9: Step 5 — ConfigModal (3 sub-steps)

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `ConfigModal` stub**

```jsx
function ConfigModal({ selectedFormats, setSelectedFormats, onSubmit }) {
  const [sub, setSub] = useState(0);
  const titles = ["Choose ad formats", "Confirm your logo", "Confirm your assets"];

  function toggle(id) {
    setSelectedFormats((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  return (
    <Modal onClose={() => {}} maxW="max-w-2xl">
      <div className="p-7">
        <div className="flex items-center gap-2 mb-1">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= sub ? "bg-indigo-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-4 mb-5">{titles[sub]}</h2>

        {sub === 0 && (
          <div className="grid grid-cols-3 gap-3">
            {DATA.formats.map((f) => {
              const on = selectedFormats.includes(f.id);
              return (
                <button key={f.id} onClick={() => toggle(f.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${on ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <i data-lucide={f.icon} className={on ? "text-indigo-600" : "text-gray-400"}></i>
                  <div className="font-semibold text-gray-900 mt-2 text-sm">{f.label}</div>
                  <div className="text-xs text-gray-500">{f.ratio}</div>
                </button>
              );
            })}
          </div>
        )}

        {sub === 1 && (
          <div className="h-40 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
            <Logo size={40} />
          </div>
        )}

        {sub === 2 && (
          <div className="grid grid-cols-3 gap-3">
            {DATA.palette.map((c, i) => (
              <div key={i} className="h-28 rounded-xl border border-gray-100" style={{ background: `linear-gradient(135deg, ${c}, #E05A47)` }} />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-7">
          <button onClick={() => setSub((s) => Math.max(0, s - 1))} disabled={sub === 0}
            className="text-gray-500 hover:text-gray-900 disabled:opacity-0 px-3 py-2 transition-all">Back</button>
          <button onClick={() => sub < 2 ? setSub(sub + 1) : onSubmit()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-7 py-3 transition-all">
            {sub < 2 ? "Next" : "Submit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Ensure Lucide icons render after each sub-step change**

The modal uses `<i data-lucide=...>`. Add a `useEffect` inside `ConfigModal` (top of component body, after `useState`) that re-runs the icon factory whenever `sub` changes:

```jsx
useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [sub]);
```

- [ ] **Step 3: Verify**

Reload, advance to step 5 (the modal opens over the step-4 content — that's fine since `BrandDNAResult` is unmounted; backdrop covers the page). Expected: progress bar; sub-step 1 shows 6 format cards with Feed 4:5 / Stories 9:16 / Reels 9:16 pre-selected (indigo border + colored icon); toggling works; Next → logo; Next → assets; Submit → step 6. Back button works and is hidden on sub-step 1.

- [ ] **Step 4: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 5 configuration modal with 3 sub-steps"
```

---

## Task 10: Step 6 — GenerationLoading (5s, rotating Pro Tips)

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Replace the `GenerationLoading` stub**

```jsx
function GenerationLoading({ onDone }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setTip((p) => (p + 1) % DATA.proTips.length), 2000);
    const done = setTimeout(onDone, 5000);
    return () => { clearInterval(rot); clearTimeout(done); };
  }, []);
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 spin" />
      <h2 className="mt-8 text-2xl font-bold text-gray-900">Casey is creating ads...</h2>
      <p className="mt-2 text-gray-500">This may take a few minutes.</p>
      <div className="mt-10 w-full grid gap-3">
        {DATA.proTips.map((t, i) => (
          <div key={i} className={`rounded-2xl border px-5 py-4 text-left transition-all duration-500 ${i === tip ? "bg-indigo-50 border-indigo-100 text-indigo-900 opacity-100" : "bg-white border-gray-100 text-gray-400 opacity-60"}`}>
            <span className="text-xs font-bold tracking-wide">PRO TIP</span>
            <p className="mt-1 text-sm font-medium">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Reload, advance to step 6. Expected: indigo spinner + "Casey is creating ads..."; 3 Pro Tip cards where the active one highlights in indigo and rotates every 2s; auto-advances to step 7 at 5s.

- [ ] **Step 3: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 6 generation loading with rotating pro tips"
```

---

## Task 11: Step 7 — AdPoster + Lightbox + Dashboard

**Files:**
- Modify: `prototypes/2026-06-04-playad-onboarding/index.html`

- [ ] **Step 1: Add `AdPoster` and `Lightbox` above `App`**

```jsx
function AdPoster({ ad, onClick }) {
  return (
    <button onClick={onClick} className="block w-full text-left rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="aspect-[4/5] p-5 flex flex-col justify-between text-white" style={{ background: "linear-gradient(150deg, #E05A47 0%, #F0B86C 100%)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center text-[#E05A47] font-extrabold text-sm">B</div>
          <span className="font-semibold text-sm">Buzz Agent</span>
        </div>
        <div>
          <h3 className="text-2xl font-extrabold leading-tight">{ad.headline}</h3>
          <p className="mt-2 text-white/90 text-sm">{ad.sub}</p>
          <span className="inline-block mt-4 bg-white text-[#E05A47] font-semibold text-sm rounded-lg px-4 py-2">{ad.cta}</span>
        </div>
      </div>
    </button>
  );
}

function Lightbox({ ad, onClose }) {
  return (
    <Modal onClose={onClose} maxW="max-w-md">
      <div className="relative">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center text-gray-700 shadow">✕</button>
        <div className="aspect-[4/5] p-8 flex flex-col justify-between text-white" style={{ background: "linear-gradient(150deg, #E05A47 0%, #F0B86C 100%)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white/90 flex items-center justify-center text-[#E05A47] font-extrabold">B</div>
            <span className="font-semibold">Buzz Agent</span>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold leading-tight">{ad.headline}</h3>
            <p className="mt-3 text-white/90">{ad.sub}</p>
            <span className="inline-block mt-6 bg-white text-[#E05A47] font-semibold rounded-lg px-5 py-2.5">{ad.cta}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Add `UpgradeModal` above `App`**

```jsx
function UpgradeModal({ onClose }) {
  return (
    <Modal onClose={onClose} maxW="max-w-3xl">
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade your plan</h2>
            <p className="text-gray-500 mt-1">Connect accounts and ship ads on autopilot.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-7">
          {DATA.plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? "border-indigo-600 ring-2 ring-indigo-100 relative" : "border-gray-200"}`}>
              {p.featured && <span className="absolute -top-3 right-5 bg-indigo-600 text-white text-xs font-semibold rounded-full px-3 py-1">Popular</span>}
              <h3 className="font-bold text-gray-900">{p.name}</h3>
              <div className="mt-2"><span className="text-3xl font-extrabold text-gray-900">{p.price}</span><span className="text-gray-500">{p.per}</span></div>
              <ul className="mt-5 space-y-2">
                {p.features.map((f) => <li key={f} className="text-sm text-gray-600 flex gap-2"><span className="text-indigo-600">✓</span>{f}</li>)}
              </ul>
              <button className={`mt-6 w-full rounded-xl py-3 font-semibold transition-all ${p.featured ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>Choose {p.name}</button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Replace the `Dashboard` stub**

```jsx
function Dashboard() {
  const [lightboxAd, setLightboxAd] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Congrats on creating your first ads! Later, you can make video ads too.</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="font-semibold text-gray-900 mb-4">Your ad creatives</h2>
            <div className="grid grid-cols-3 gap-4">
              {DATA.ads.map((ad) => <AdPoster key={ad.id} ad={ad} onClick={() => setLightboxAd(ad)} />)}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 mb-4">Inspirations</h2>
            <div className="grid grid-cols-2 gap-4">
              {DATA.inspirations.map((c) => (
                <div key={c.brand} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="aspect-[16/9] flex items-center justify-center text-white font-bold text-xl" style={{ background: c.hue }}>{c.brand}</div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{c.brand}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{c.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Scheduler</h2>
            <div className="relative pl-6">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200" />
              {DATA.schedule.map((s) => (
                <div key={s.date} className="relative mb-5 last:mb-0">
                  <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white" />
                  <p className="text-xs font-semibold text-gray-400">{s.date}</p>
                  <p className="text-sm text-gray-800">{s.task}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Connect accounts</h2>
            <div className="space-y-3">
              {["Meta", "Google", "TikTok"].map((p) => (
                <button key={p} onClick={() => setShowPaywall(true)}
                  className="w-full border border-gray-300 rounded-xl py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all">
                  Connect {p}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {lightboxAd && <Lightbox ad={lightboxAd} onClose={() => setLightboxAd(null)} />}
      {showPaywall && <UpgradeModal onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Reload, advance to step 7. Expected: congrats header; 3 orange/red Buzz Agent posters (click opens white Lightbox with ✕ close); Plai/Celtra inspiration cards; right-column Scheduler timeline with vertical line + dated tasks; Connect Meta/Google/TikTok buttons → each opens Upgrade Plan modal (Full Time $499, CMO $1799 with Popular badge); ✕ closes it.

- [ ] **Step 5: Commit**

```bash
git add "prototypes/2026-06-04-playad-onboarding/index.html"
git commit -m "feat: build Step 7 dashboard with lightbox and paywall"
```

---

## Task 12: Register demo in the gallery + full run-through

**Files:**
- Modify: `prototypes.json`

- [ ] **Step 1: Inspect current `prototypes.json` shape**

Run: `cat prototypes.json`
Expected: a JSON array of records with keys like `slug`, `title`, `desc`, `date`, `cover`.

- [ ] **Step 2: Append the new record**

Add this object to the array (match the existing formatting; `cover` omitted since the demo has no static cover image):

```json
{
  "slug": "2026-06-04-playad-onboarding",
  "title": "AI Buzz Video — Onboarding Demo",
  "desc": "Playad-style ad-generation onboarding flow, premium light mode. Login → Brand DNA → Generate → Dashboard.",
  "date": "2026-06-04"
}
```

- [ ] **Step 3: Verify gallery + end-to-end flow**

1. Open the gallery `index.html` at repo root → the new card appears and links to the demo.
2. Open the demo and click through the entire happy path: Step 0 login → 1 details → 2 URL → 3 (waits 4.5s) → 4 DNA → "Generate & Analyze" → 5 modal (Next/Next/Submit) → 6 (waits 5s) → 7 dashboard → open a poster lightbox → open paywall → close both → "Restart demo" returns to Step 0 with formats reset.
3. Confirm zero console errors throughout.

- [ ] **Step 4: Commit**

```bash
git add prototypes.json
git commit -m "feat: register AI Buzz Video onboarding demo in gallery"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** Steps 0–7 each map to Tasks 4–11; Light Mode tokens applied throughout; AI Buzz Video branding in AppShell (Task 3) and posters; restart control (Task 3); gallery registration (Task 12); all-SVG/CSS visuals (no external images). ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code. Stub components in Task 3 are explicitly temporary and replaced in Tasks 4–11. ✓

**Type/name consistency:** Prop names consistent across tasks — `onNext`/`onDone`/`onSubmit`/`onClose`; `selectedFormats`/`setSelectedFormats` threaded App→ConfigModal; `Modal`/`Card`/`Chip`/`Logo` defined before use. Lucide re-render handled in Task 9 Step 2. ✓

**Known prototype caveat:** CDN React + Babel-in-browser is intentional per the gallery's no-build convention; first paint waits for Babel compile (acceptable for a demo).
