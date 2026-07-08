#!/usr/bin/env sh
# ============================================================
#  Linux Kernel Visual Model - универсальный запуск (Linux/macOS)
#  Ставит зависимости при необходимости, открывает браузер
#  и запускает dev-сервер Vite. POSIX sh — работает и через `sh ./start.sh`.
# ============================================================
set -e
cd "$(dirname "$0")"

# Выбираем пакетный менеджер. Если ни pnpm, ни npm не найдены —
# значит Node.js не установлен: даём понятную инструкцию и выходим.
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
elif command -v npm >/dev/null 2>&1; then
  PM=npm
else
  echo "[!] Не найден ни npm, ни pnpm — похоже, Node.js не установлен."
  echo
  if command -v docker >/dev/null 2>&1; then
    echo "  Самый простой путь без Node — Docker:"
    echo "      docker compose up --build       (старые версии: docker-compose up --build)"
    echo "      затем откройте http://localhost:8080"
    echo
  fi
  echo "  Либо установите Node.js 18+ и снова запустите ./start.sh :"
  echo "      Debian/Ubuntu/Astra:  sudo apt update && sudo apt install -y nodejs npm"
  echo "      Fedora/RHEL:          sudo dnf install -y nodejs npm"
  echo "      кроссплатформенно:    https://github.com/nvm-sh/nvm  (nvm install --lts)"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[setup] Устанавливаю зависимости через $PM ..."
  "$PM" install
fi

# Откроем браузер спустя пару секунд (в фоне). На headless-серверах
# xdg-open/open могут отсутствовать — тогда просто пропускаем.
(
  sleep 2
  { xdg-open http://localhost:5173 || open http://localhost:5173; } >/dev/null 2>&1 || true
) &

echo "[run] Запускаю dev-сервер ($PM run dev) ..."
echo "      Адрес: http://localhost:5173  (Ctrl+C — остановить)"
exec "$PM" run dev
