@echo off
title LaunchWise AI Launcher
echo ============================================================
echo           Launching LaunchWise AI Web Application
echo ============================================================
echo.

:: 1. Check & start Backend if port 8000 is not running
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Backend API Server (FastAPI)...
    start "LaunchWise Backend" /min cmd /c "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    timeout /t 2 /nobreak >nul
) else (
    echo [1/3] Backend API Server is already running on http://127.0.0.1:8000
)

:: 2. Check & start Frontend if port 5173 is not running
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Frontend Web Server (Vite)...
    start "LaunchWise Frontend" /min cmd /c "cd frontend && npm run dev -- --host 127.0.0.1"
    timeout /t 3 /nobreak >nul
) else (
    echo [2/3] Frontend Web Server is already running on http://127.0.0.1:5173
)

:: 3. Launch browser
echo [3/3] Opening LaunchWise AI in your default web browser...
start http://127.0.0.1:5173/

echo.
echo ============================================================
echo  LaunchWise AI is live!
echo  URL:      http://127.0.0.1:5173/
echo  Email:    admin@launchwise.ai
echo  Password: password123
echo ============================================================
echo.
timeout /t 5 /nobreak >nul
