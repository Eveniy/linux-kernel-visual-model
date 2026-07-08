#!/usr/bin/env sh
# ============================================================
#  Linux Kernel Visual Model - универсальный запуск (Linux/macOS)
#  Если Node.js не установлен - предлагает поставить его сам
#  (пакетный менеджер с sudo, либо nvm без root), затем ставит
#  зависимости и запускает dev-сервер Vite.
#
#  Флаги (env):
#    AUTO_INSTALL=1  - ставить Node без вопросов
#    NO_OPEN=1       - не открывать браузер автоматически
# ============================================================
set -e
cd "$(dirname "$0")"

log() { printf '%s\n' "$*"; }

# --- Установка Node.js -------------------------------------------------------
install_node() {
  # 1) Системный пакетный менеджер (нужен root или sudo).
  SUDO=""
  if [ "$(id -u)" != "0" ]; then
    command -v sudo >/dev/null 2>&1 && SUDO="sudo"
  fi

  if [ "$(id -u)" = "0" ] || [ -n "$SUDO" ]; then
    if command -v apt-get >/dev/null 2>&1; then
      log "[install] $SUDO apt-get update && $SUDO apt-get install -y nodejs npm"
      if $SUDO apt-get update && $SUDO apt-get install -y nodejs npm; then return 0; fi
    elif command -v dnf >/dev/null 2>&1; then
      if $SUDO dnf install -y nodejs npm; then return 0; fi
    elif command -v yum >/dev/null 2>&1; then
      if $SUDO yum install -y nodejs npm; then return 0; fi
    elif command -v pacman >/dev/null 2>&1; then
      if $SUDO pacman -Sy --noconfirm nodejs npm; then return 0; fi
    elif command -v zypper >/dev/null 2>&1; then
      if $SUDO zypper install -y nodejs npm; then return 0; fi
    fi
    log "[install] Через пакетный менеджер не получилось — пробую nvm..."
  fi

  # 2) nvm — ставит Node в домашнюю папку, без root.
  if command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1; then
    log "[install] Устанавливаю Node LTS через nvm (в \$HOME/.nvm, без root)..."
    export NVM_DIR="$HOME/.nvm"
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | sh || return 1
    else
      wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | sh || return 1
    fi
    # shellcheck disable=SC1090
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    if command -v nvm >/dev/null 2>&1 && nvm install --lts; then return 0; fi
  fi

  return 1
}

# --- Выбор пакетного менеджера ----------------------------------------------
detect_pm() {
  if command -v pnpm >/dev/null 2>&1; then PM=pnpm
  elif command -v npm >/dev/null 2>&1; then PM=npm
  else PM=""; fi
}

detect_pm

if [ -z "$PM" ]; then
  log "[!] Не найден ни npm, ни pnpm — Node.js не установлен."

  DO_INSTALL=""
  if [ "${AUTO_INSTALL:-}" = "1" ]; then
    DO_INSTALL="yes"
  elif [ -t 0 ]; then
    printf "Установить Node.js автоматически? [Y/n] "
    read ans || ans=""
    case "$ans" in
      [Nn]*) DO_INSTALL="" ;;
      *) DO_INSTALL="yes" ;;
    esac
  fi

  if [ "$DO_INSTALL" = "yes" ]; then
    if install_node; then
      detect_pm
    fi
  fi

  if [ -z "$PM" ]; then
    log ""
    log "Не удалось подготовить Node автоматически. Варианты вручную:"
    log "  • Docker (без Node):   docker compose up --build   → http://localhost:8080"
    log "  • Debian/Ubuntu/Astra: sudo apt update && sudo apt install -y nodejs npm"
    log "  • Кроссплатформенно:   https://github.com/nvm-sh/nvm  (nvm install --lts)"
    log "  • Затем снова:         ./start.sh"
    exit 1
  fi
fi

# --- Зависимости и запуск ----------------------------------------------------
if [ ! -d node_modules ]; then
  log "[setup] Устанавливаю зависимости через $PM ..."
  "$PM" install
fi

if [ "${NO_OPEN:-}" != "1" ]; then
  (
    sleep 2
    { xdg-open http://localhost:5173 || open http://localhost:5173; } >/dev/null 2>&1 || true
  ) &
fi

log "[run] Запускаю dev-сервер ($PM run dev) ..."
log "      Адрес: http://localhost:5173  (Ctrl+C — остановить)"
exec "$PM" run dev
