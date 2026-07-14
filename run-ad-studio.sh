#!/usr/bin/env bash
# Ad Studio 本地一键启动:后端生成引擎(8899)+ 前端 ad-studio(3000)
set -e
BE="/Users/monica/Documents/presslogic projects/ai-shortdrama-agent-seedance2"
FE="/Users/monica/Documents/presslogic projects/原型设计"

echo "▶ 启动后端生成引擎(8899)…"
( cd "$BE" && lsof -ti tcp:8899 | xargs kill -9 2>/dev/null || true
  nohup .venv/bin/python -m app.main > /tmp/adstudio-backend.log 2>&1 & )
sleep 4
curl -s -o /dev/null -w "  后端 8899 -> HTTP %{http_code}\n" http://localhost:8899 --max-time 5 || echo "  后端未就绪,查看 /tmp/adstudio-backend.log"

echo "▶ 启动前端(3000)… 浏览器打开 http://localhost:3000/prototypes/ad-studio"
echo "  (Ctrl+C 停前端;停后端:lsof -ti tcp:8899 | xargs kill -9)"
cd "$FE" && pnpm dev
