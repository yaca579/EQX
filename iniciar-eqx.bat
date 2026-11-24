@echo off
chcp 65001 >nul
title EQX - servidor de desarrollo
cd /d "%~dp0"

echo.
echo   EQX - estudio de audio
echo   ----------------------
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo   No encuentro npm. Instala Node.js 22 o superior desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

REM Si ya hay un servidor escuchando en 5173, no lanzamos otro (el API daria EADDRINUSE).
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo   El servidor ya estaba corriendo. Abriendo el estudio...
  start "" http://localhost:5173/studio
  timeout /t 3 >nul
  exit /b 0
)

if not exist "node_modules" (
  echo   Primera vez: instalando dependencias, puede tardar un par de minutos...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   La instalacion ha fallado. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
)

REM Abre el navegador cuando Vite ya ha tenido tiempo de arrancar.
start "" /b cmd /c "timeout /t 10 >nul & start http://localhost:5173/studio"

echo   Arrancando API (8787) y web (5173)...
echo   Para parar el servidor: Ctrl+C en esta ventana, o cierrala.
echo.

call npm run dev

echo.
echo   El servidor se ha detenido.
pause
