# 个人原型管理系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建一个纯静态的个人原型画廊网站,首页自动列出所有 demo,可推到 GitHub 由 Vercel 零构建部署。

**Architecture:** 纯静态站点。首页 `index.html` 读取 `prototypes.js`(暴露全局数组,保证本地 `file://` 双击也能加载)渲染卡片网格。每个 demo 独立放在 `prototypes/<slug>/index.html`,有独立可分享 URL。无构建步骤。

**Tech Stack:** 原生 HTML / CSS / JS(首页);demo 视复杂度用原生或 CDN React + Tailwind;Vercel 静态托管。

**测试说明:** 本项目无自动化测试框架。验证方式为本地浏览器双击打开 `index.html` 目视确认 + 控制台无报错。每个任务的验证步骤即为手动检查。

---

### Task 1: 原型清单数据文件

**Files:**
- Create: `prototypes.js`

- [ ] **Step 1: 创建 `prototypes.js`,暴露全局数组**

用 JS 文件而非 JSON,这样首页双击(`file://`)也能直接 `<script>` 加载,无需起本地服务器。先放一条示例数据(后续可删):

```js
// 原型清单:每加一个 demo,在数组里加一条记录即可。
// slug 必须等于 prototypes/ 下的文件夹名。
window.PROTOTYPES = [
  {
    slug: "2026-06-04-示例需求",
    title: "示例需求 Demo",
    desc: "这是一条示例记录,真正加 demo 时可删除或替换。",
    date: "2026-06-04",
    cover: ""
  }
];
```

- [ ] **Step 2: 验证**

浏览器控制台不会直接测;由 Task 2 的首页加载来验证。先确认文件已保存、语法正确(可在浏览器 devtools 里 `console.log(window.PROTOTYPES)` 检查)。

---

### Task 2: 首页画廊样式

**Files:**
- Create: `assets/style.css`

- [ ] **Step 1: 创建 `assets/style.css`**

干净、克制的画廊样式。卡片网格响应式,留白舒适,适合 PM 自己浏览管理。

```css
:root {
  --bg: #fafafa;
  --card: #ffffff;
  --text: #1a1a1a;
  --muted: #888;
  --border: #ececec;
  --accent: #2563eb;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg); color: var(--text);
  padding: 48px 24px; line-height: 1.5;
}
.wrap { max-width: 1100px; margin: 0 auto; }
.top { margin-bottom: 32px; }
.top h1 { font-size: 22px; font-weight: 600; }
.top p { color: var(--muted); font-size: 14px; margin-top: 4px; }
.search {
  margin-top: 20px; width: 100%; max-width: 360px;
  padding: 10px 14px; border: 1px solid var(--border);
  border-radius: 8px; font-size: 14px; outline: none;
}
.search:focus { border-color: var(--accent); }
.grid {
  display: grid; gap: 18px; margin-top: 28px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.card {
  display: block; background: var(--card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden; text-decoration: none;
  color: inherit; transition: transform .12s ease, box-shadow .12s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.card .cover {
  height: 150px; background: #f0f0f3; display: flex;
  align-items: center; justify-content: center; color: var(--muted); font-size: 13px;
}
.card .cover img { width: 100%; height: 100%; object-fit: cover; }
.card .body { padding: 14px 16px 16px; }
.card .title { font-size: 15px; font-weight: 600; }
.card .desc { font-size: 13px; color: var(--muted); margin-top: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card .date { font-size: 12px; color: var(--muted); margin-top: 10px; }
.empty { color: var(--muted); margin-top: 40px; text-align: center; }
```

- [ ] **Step 2: 验证** — 文件保存即可,效果在 Task 3 一起看。

---

### Task 3: 首页画廊逻辑

**Files:**
- Create: `index.html`

- [ ] **Step 1: 创建 `index.html`**

加载 `prototypes.js` 和样式,渲染卡片网格 + 搜索框。卡片点击在新标签打开 `prototypes/<slug>/`。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>原型库</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <div class="wrap">
    <div class="top">
      <h1>原型库</h1>
      <p>所有需求 demo 一览,点击卡片打开。</p>
      <input class="search" id="search" type="text" placeholder="搜索原型…">
    </div>
    <div class="grid" id="grid"></div>
    <div class="empty" id="empty" style="display:none">没有匹配的原型。</div>
  </div>

  <script src="prototypes.js"></script>
  <script>
    var list = (window.PROTOTYPES || []).slice().sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "");
    });
    var grid = document.getElementById("grid");
    var empty = document.getElementById("empty");
    var search = document.getElementById("search");

    function coverHtml(p) {
      if (p.cover) {
        return '<div class="cover"><img src="prototypes/' + p.slug + '/' + p.cover + '" alt=""></div>';
      }
      return '<div class="cover">无封面</div>';
    }
    function cardHtml(p) {
      return '<a class="card" href="prototypes/' + p.slug + '/" target="_blank" rel="noopener">' +
        coverHtml(p) +
        '<div class="body">' +
          '<div class="title">' + (p.title || p.slug) + '</div>' +
          '<div class="desc">' + (p.desc || "") + '</div>' +
          '<div class="date">' + (p.date || "") + '</div>' +
        '</div></a>';
    }
    function render(items) {
      grid.innerHTML = items.map(cardHtml).join("");
      empty.style.display = items.length ? "none" : "block";
    }
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      render(list.filter(function (p) {
        return (p.title + " " + p.desc + " " + p.slug).toLowerCase().indexOf(q) >= 0;
      }));
    });
    render(list);
  </script>
</body>
</html>
```

- [ ] **Step 2: 验证**

双击打开 `index.html`。预期:看到一张"示例需求 Demo"卡片;搜索框输入"示例"卡片仍在、输入"xyz"显示"没有匹配的原型";控制台无报错。

---

### Task 4: 示例 demo 占位页

**Files:**
- Create: `prototypes/2026-06-04-示例需求/index.html`

- [ ] **Step 1: 创建占位 demo,验证卡片跳转链路通**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>示例需求 Demo</title>
  <style>
    body { font-family: -apple-system, "PingFang SC", sans-serif;
      display: flex; align-items: center; justify-content: center;
      height: 100vh; margin: 0; color: #333; }
    .box { text-align: center; }
    .box h1 { font-size: 20px; }
    .box p { color: #888; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>示例 Demo 占位页</h1>
    <p>这是用来验证链路的占位 demo,真正加需求时替换为实际原型。</p>
  </div>
</body>
</html>
```

- [ ] **Step 2: 验证**

回到首页双击点击"示例需求 Demo"卡片 → 新标签打开此占位页。链路通即成功。

---

### Task 5: Vercel 部署配置

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: 创建 `vercel.json`(零构建静态)**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true
}
```

`cleanUrls` 让 `/prototypes/<slug>/` 之类路径更干净。无 buildCommand,Vercel 默认按静态站点托管。

- [ ] **Step 2: 验证** — JSON 语法正确即可(部署在 GitHub 关联后实际生效)。

---

### Task 6: 使用说明文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 `README.md`**

```markdown
# 原型库

Monica 的个人原型管理系统。纯静态、零构建,GitHub → Vercel 自动部署。

## 怎么用
- 本地预览:双击 `index.html`。
- 加新 demo:跟 AI 说需求即可,AI 会建 `prototypes/<日期-需求名>/index.html` 并登记进 `prototypes.js`。
- 手动加 demo:① 在 `prototypes/` 下建文件夹 `<YYYY-MM-DD-需求名>/index.html`;② 在 `prototypes.js` 的数组里加一条记录(slug=文件夹名)。

## 分享给老板
推到 GitHub 后 Vercel 自动部署。把单个 demo 的 URL `<域名>/prototypes/<slug>/` 发给老板即可,打开只有那个 demo。

## 部署(首次)
1. `git init` 并推到 GitHub。
2. 在 Vercel 导入该仓库,无需改任何构建设置,直接 Deploy。
```

- [ ] **Step 2: 验证** — 通读一遍,内容与实际结构一致。

---

## 完成后

全部 6 个文件就位后,本地双击 `index.html` 应能看到画廊、点卡片进入示例 demo。之后即可 `git init` + 关联 GitHub + Vercel 部署。
