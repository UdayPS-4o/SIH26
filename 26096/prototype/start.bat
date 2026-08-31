@echo off
REM ============================================================
REM  Samdarshi SIH 2026 - Quick Start (Windows)
REM ============================================================

setlocal

REM Make sure .env exists
if not exist .env (
    echo [setup] .env not found - copying from .env.example
    copy /Y .env.example .env >nul
)

echo [start] Building and starting Samdarshi prototype...
docker-compose up -d --build
if errorlevel 1 (
    echo [error] docker-compose failed.
    exit /b 1
)

echo.
echo ============================================================
echo   Samdarshi Prototype Started!
echo   Kiosk UI : http://localhost:8080
echo   API      : http://localhost:8080/api
echo   Health   : http://localhost:8080/health
echo ============================================================
echo.
echo Tail logs with:  docker-compose logs -f
echo Stop with     :  docker-compose down

endlocal