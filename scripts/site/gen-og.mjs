// 2026-11-26 每个落地页一张 OG 分享图(1200×630)。方向照 docs/seo/og-mcp-skills.jpg:深色底 + 左侧白色大标题 + 橙色小标签 + 右侧斜排成品墙。
// 素材 = 该页面自己页面上的成片(抓渲染后的页面);用法: node og.mjs <scratch> [slug ...]
import { chromium } from "/Users/monica/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";
import fs from "fs";
const S = process.argv[2]; const only = process.argv.slice(3);
const ROOT = "/Users/monica/Documents/presslogic projects/原型设计";
const OUT = ROOT + "/public/prototypes/site/og"; fs.mkdirSync(OUT, { recursive: true });
const data = JSON.parse(fs.readFileSync(ROOT + "/public/landing-pages.html", "utf8").match(/<script id="data" type="application\/json">(.*?)<\/script>/s)[1]);
const skip = /caption-generator|long-video-to-shorts|models\/seedance|^\/alternatives|vs-runway|compare\/topview|vs-adcreative/;
let rows = data.rows.filter((r, i, a) => !skip.test(r.href) && a.findIndex((x) => x.href === r.href) === i);
if (only.length) rows = rows.filter((r) => only.includes(r.href.slice(1)));
const kickerOf = (r) => {
  const c = r.cat || "";
  if (r.tab === "model") return /音频|语音|音乐|音效/.test(c) || r.media === "audio" ? "AI AUDIO MODEL" : r.media === "image" ? "AI IMAGE MODEL" : r.href === "/models" ? "ALL AI MODELS" : "AI VIDEO MODEL";
  if (/prompt-guide/.test(r.href)) return "PROMPT GUIDE"; if (/-pricing$/.test(r.href)) return "PRICING"; if (/^\/best-/.test(r.href)) return "BUYER'S GUIDE";
  if (/教程/.test(c)) return "TUTORIAL"; if (/问答/.test(c)) return "BUZZVIDEO ANSWERS"; if (/数据/.test(c)) return "AD DATA"; if (/信任|政策/.test(c)) return "TRUST & SAFETY";
  if (/竞品|对比/.test(c) || /-vs-/.test(r.href)) return "COMPARISON";
  if (/^\/best-/.test(r.href)) return "BUYER'S GUIDE"; if (/prompt-guide/.test(r.href)) return "PROMPT GUIDE"; if (/pricing/.test(r.href)) return "PRICING";
  if (r.tab === "other") return "AI ADS FOR MARKETERS";
  return r.media === "image" ? "AI IMAGE TOOL" : r.media === "audio" || /音频/.test(c) ? "AI AUDIO TOOL" : /Agent|广告/.test(c) ? "AI AD TOOL" : "AI VIDEO TOOL";
};
const FALLBACK = ["/prototypes/site/tools/ugc-product-review.jpg", "/prototypes/site/tools/product-ad.jpg", "/prototypes/site/tools/link-to-ad.jpg", "/prototypes/site/tools/unboxing-ugc.jpg", "/prototypes/site/tools/talking-product.jpg", "/prototypes/site/tools/3d-product-video.jpg"];
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const b = await chromium.launch({ executablePath: "/Users/monica/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" });
const done = []; let i = 0;
async function worker() {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const og = await ctx.newPage(); await og.setViewportSize({ width: 1200, height: 630 });
  while (i < rows.length) {
    const r = rows[i++]; const name = r.href.replace(/^\//, "").replace(/\//g, "_");
    const p = await ctx.newPage();
    try {
      await p.goto("http://localhost:3000/prototypes/site" + r.href, { waitUntil: "domcontentloaded", timeout: 120000 });
      await p.waitForTimeout(1500);
      const info = await p.evaluate(async () => {
        const main = document.querySelector("main") || document.body;
        const els = [...main.querySelectorAll("img,video")].filter((e) => { const b = e.getBoundingClientRect(); return (b.width > 150 && b.height > 100) || e.closest('[class*="group-hover:-translate-y-2"]'); });
        const out = []; const seen = new Set();
        for (const e of els) {
          if (out.length >= 7) break;
          const src = e.getAttribute("src") || ""; if (!src || seen.has(src) || /logo|\.svg/.test(src)) continue; seen.add(src);
          if (e.tagName === "IMG") { out.push(new URL(src, location.href).href); continue; }
          const poster = e.getAttribute("poster");
          if (poster) { out.push(new URL(poster, location.href).href); continue; }
          if (src.startsWith("http") && !src.includes(location.host)) continue; // 跨域视频抓不了帧
          try {
            const v = document.createElement("video"); v.muted = true; v.src = src; v.crossOrigin = "anonymous";
            await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = no; setTimeout(no, 8000); });
            v.currentTime = Math.min(1.5, (v.duration || 2) / 2); await new Promise((ok) => { v.onseeked = ok; setTimeout(ok, 3000); });
            const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
            out.push(c.toDataURL("image/jpeg", 0.85));
          } catch {}
        }
        return { h1: (() => { const h = document.querySelector("h1"); if (!h) return ""; const kids = [...h.children].filter((k) => k.textContent.trim()); return (kids.length > 1 ? kids[0].textContent : h.textContent).trim(); })(), title: document.title, desc: document.querySelector('meta[name="description"]')?.content || "", pics: out };
      });
      let pics = info.pics; for (const f of FALLBACK) if (pics.length < 6) pics.push("http://localhost:3000" + f);
      const full = info.title.replace(/ \| BuzzVideo$/, "");
      let title = info.h1 || full.split(":")[0]; if (title.length > 44 && full.split(":")[0].length < title.length) title = full.split(":")[0];
      let sub = full.includes(":") ? full.split(":").slice(1).join(":").trim() : "";
      const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!sub || norm(sub) === norm(title) || norm(title).includes(norm(sub)) || norm(sub).includes(norm(title))) { const sents = info.desc.split(/(?<=[.?!])\s/).map((x) => x.trim()).filter(Boolean); sub = sents.find((x) => norm(x) !== norm(title) && !norm(title).includes(norm(x)) && !norm(x).includes(norm(title))) || ""; }
      if (sub.length > 78) sub = sub.slice(0, 76).replace(/\s\S*$/, "") + "…";
      const fs_ = title.length <= 16 ? 84 : title.length <= 26 ? 70 : title.length <= 38 ? 58 : title.length <= 52 ? 48 : 40;
      const cols = [[pics[0], pics[3]], [pics[1], pics[4]], [pics[2], pics[5]]];
      const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;overflow:hidden;background:#150b08;font-family:Inter,-apple-system,sans-serif;color:#fff;position:relative}
.wall{position:absolute;left:520px;top:-120px;display:flex;gap:18px;transform:rotate(8deg);transform-origin:top left}
.col{display:flex;flex-direction:column;gap:18px;width:232px}.col:nth-child(2){margin-top:70px}.col:nth-child(3){margin-top:-40px}
.card{width:232px;height:400px;border-radius:22px;overflow:hidden;background:#222}.card img{width:100%;height:100%;object-fit:cover;display:block}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,#150b08 0,#150b08 40%,rgba(21,11,8,.82) 50%,rgba(21,11,8,0) 68%)}
.l{position:absolute;left:64px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center}
.logo{position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:10px;font-weight:800;font-size:19px;letter-spacing:-.01em}.logo img{width:30px;height:30px}
.k{color:#FFA73C;font-weight:800;font-size:17px;letter-spacing:.16em}h1{margin-top:16px;font-weight:900;font-size:${fs_}px;line-height:1.04;letter-spacing:-.03em;text-wrap:balance}
.s{margin-top:20px;font-size:22px;line-height:1.35;color:#d5cfcc;max-width:470px}.u{position:absolute;left:64px;bottom:52px;font-size:17px;color:#9a918d;font-weight:600}
</style></head><body><div class="wall">${cols.map((c) => `<div class="col">${c.map((s) => `<div class="card"><img src="${s}"></div>`).join("")}</div>`).join("")}</div><div class="shade"></div>
<div class="logo"><img src="http://localhost:3000/prototypes/ai-tools/logo.svg">BuzzVideo AI</div>
<div class="l"><div class="k">${esc(kickerOf(r))}</div><h1>${esc(title)}</h1>${sub ? `<div class="s">${esc(sub)}</div>` : ""}</div>
<div class="u">buzzvideo.ai${esc(r.href)}</div></body></html>`;
      await og.setContent(html, { waitUntil: "networkidle", timeout: 60000 });
      await og.evaluate(() => document.fonts.ready); await og.waitForTimeout(300);
      await og.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 88 });
      done.push(name);
    } catch (e) { console.log("FAIL", r.href, String(e).slice(0, 100)); }
    await p.close();
  }
  await ctx.close();
}
await Promise.all([worker(), worker(), worker()]);
await b.close();
const all = fs.readdirSync(OUT).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")).sort();
fs.writeFileSync(ROOT + "/src/app/prototypes/(v1.13)/site/og-manifest.json", JSON.stringify(all));
console.log("made", done.length, "total", all.length);
