@echo off
cd /d "%~dp0"
echo EloSocial - interface React e servidor Next.js
echo.
if not exist backend\.env.local (
  echo Configure o arquivo backend\.env.local antes de continuar.
  pause
  exit /b 1
)
if not exist backend\node_modules (
  pushd backend
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)
if not exist frontend\node_modules (
  pushd frontend
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)
pushd backend
start "EloSocial API - mantenha aberto" cmd /k "npm run dev -- --port 3000"
popd
echo O servidor deve informar que esta pronto na porta 3000.
echo O site estara em http://127.0.0.1:5173
cd frontend
call npm run dev
pause
