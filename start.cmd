@echo off
rem ============================================================
rem  Linux Kernel Visual Model - универсальный запуск (Windows)
rem  Если Node.js не установлен - предлагает поставить его через
rem  winget, затем ставит зависимости и запускает dev-сервер Vite.
rem  Флаг: set AUTO_INSTALL=1  - ставить Node без вопросов.
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PM="
where pnpm >nul 2>nul && set "PM=pnpm"
if not defined PM ( where npm >nul 2>nul && set "PM=npm" )

if not defined PM (
  echo [!] Node.js/npm не найдены.
  where winget >nul 2>nul
  if errorlevel 1 (
    echo Winget недоступен. Установите Node.js вручную: https://nodejs.org/
    echo Либо запустите через Docker:  docker compose up --build   ^(http://localhost:8080^)
    pause
    exit /b 1
  )
  set "ans=Y"
  if /I not "%AUTO_INSTALL%"=="1" set /p "ans=Установить Node.js LTS через winget? [Y/n] "
  if /I "!ans!"=="n" (
    echo Отменено. Node.js: https://nodejs.org/  либо Docker: docker compose up --build
    pause
    exit /b 1
  )
  echo [install] winget install OpenJS.NodeJS.LTS ...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  echo.
  echo Node установлен. Закройте это окно и запустите start.cmd снова
  echo (чтобы обновился PATH текущей сессии).
  pause
  exit /b 0
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
