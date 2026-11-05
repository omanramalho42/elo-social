@echo off
cd /d "%~dp0"
echo EloSocial - interface React e servidor Next.js
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
if not exist interface\node_modules (
  pushd interface
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)
start "EloSocial API - mantenha aberto" cmd /k "npm run dev -- --port 3000"
echo O servidor deve informar que esta pronto na porta 3000.
echo O site estara em http://127.0.0.1:5173
cd interface
call npm run dev
pause
