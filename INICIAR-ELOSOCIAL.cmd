@echo off
cd /d "%~dp0"
echo EloSocial - Frontend React e backend Next.js
echo.
if not exist .env.local (
  echo Configure o arquivo .env.local na raiz antes de continuar.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 exit /b 1
)
if not exist frontend\node_modules (
  pushd frontend
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)
start "EloSocial API - mantenha aberto" cmd /k "npm run dev -- --port 3000"
echo O backend deve informar Ready na porta 3000.
echo O site estara em http://127.0.0.1:5173
cd frontend
call npm run dev
pause
