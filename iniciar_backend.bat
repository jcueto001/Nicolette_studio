@echo off
title Nicolett Studio - Servidor de Pagos Flow
cd /d "%~dp0backend"
echo ==============================================
echo   Iniciando Servidor de Pagos (Flow.cl)
echo   Nicolett Studio Fantasy
echo ==============================================
echo.
npm start
if %errorlevel% neq 0 (
    echo.
    echo Intentando con ruta directa a Node.js...
    "C:\Program Files\nodejs\node.exe" server.js
)
pause
