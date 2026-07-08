@echo off
rem ============================================================
rem  Linux Kernel Visual Model - универсальный запуск (Windows)
rem  Двойной клик: ставит зависимости при необходимости,
rem  открывает браузер и запускает dev-сервер Vite.
rem ============================================================
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if %errorlevel%==0 (
  set "PM=pnpm"
) else (
  set "PM=npm"
)

if not exist "node_modules" (
  echo [setup] Устанавливаю зависимости через %PM% ...
  call %PM% install
  if errorlevel 1 (
    echo [error] Установка зависимостей не удалась.
    pause
    exit /b 1
  )
)

echo [run] Запускаю dev-сервер (%PM% run dev) ...
start "" http://localhost:5173
call %PM% run dev

endlocal
