@echo off
title Start Cow Dashboard v2.0
cd /d "%~dp0"

echo ===========================================
echo    Starting Cow Dashboard v2.0 Services    
echo ===========================================

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running.
    echo Please make sure Docker Desktop is started and try again.
    echo.
    pause
    exit /b 1
)

echo 🚀 Launching Docker containers in background...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Error: Failed to start docker compose.
    pause
    exit /b 1
)

echo ⏳ Waiting for frontend service to start...
timeout /t 5 /nobreak >nul

echo 🌐 Opening browser to http://localhost:3000...
start http://localhost:3000

echo ===========================================
echo Dashboard is running. To stop it, run:
echo   docker compose down
echo ===========================================
pause
