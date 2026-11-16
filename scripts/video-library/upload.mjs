// Upload every file listed in library.json to Vercel Blob, then rerun build.py to write the URLs in.
// Usage: node scripts/video-library/upload.mjs   (needs BLOB_READ_WRITE_TOKEN in .env.local)
// Already-uploaded files (in urls.json) are skipped, so it is safe to rerun after adding new films.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { put } from "@vercel/blob";

const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), "../..");
const LIB = path.join(ROOT, "src/app/prototypes/(video-library)/video-library/library.json");
const URLS = path.join(ROOT, "scripts/video-library/urls.json");

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const token = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)?.[1];
if (!token) throw new Error("BLOB_READ_WRITE_TOKEN not found in .env.local");

const lib = JSON.parse(fs.readFileSync(LIB, "utf8"));
const urls = fs.existsSync(URLS) ? JSON.parse(fs.readFileSync(URLS, "utf8")) : {};
const todo = lib.films.flatMap((f) => f.versions.flatMap((v) => v.files)).filter((x) => !urls[x.key]);
console.log(`${todo.length} files to upload`);

let done = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const x = queue.shift();
    const local = x.local.replace(/^~/, os.homedir());
    const ext = path.extname(x.name).toLowerCase();
    const res = await put(`video-library/${x.key}`, fs.createReadStream(local), {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      multipart: x.size > 50e6,
      contentType: ext === ".mov" ? "video/quicktime" : "video/mp4",
    });
    urls[x.key] = res.url;
    fs.writeFileSync(URLS, JSON.stringify(urls, null, 1)); // save as we go so an interrupted run can resume
    console.log(`${++done}/${todo.length}  ${(x.size / 1e6).toFixed(0)}MB  ${x.name}`);
  }
}
await Promise.all([worker(), worker(), worker()]);
execFileSync("python3", [path.join(ROOT, "scripts/video-library/build.py")], { stdio: "inherit" });
