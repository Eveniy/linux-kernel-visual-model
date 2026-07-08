#!/usr/bin/env bash
# ============================================================
#  Linux Kernel Visual Model - универсальный запуск (Linux/macOS)
#  Ставит зависимости при необходимости, открывает браузер
#  и запускает dev-сервер Vite.
# ============================================================
set -e
cd "$(dirname "$0")"

if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
else
  PM=npm
fi

if [ ! -d node_modules ]; then
  echo "[setup] Устанавливаю зависимости через $PM ..."
  "$PM" install
fi

# Откроем браузер спустя пару секунд (в фоне), пока поднимается сервер.
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5173 >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open http://localhost:5173 >/dev/null 2>&1 || true
  fi
) &

echo "[run] Запускаю dev-сервер ($PM run dev) ..."
exec "$PM" run dev
