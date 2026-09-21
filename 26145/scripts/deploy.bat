@echo off
REM Build and deploy EKADHARA (Windows CMD)

echo Building EKADHARA Docker image...
docker compose build

echo Starting EKADHARA container...
docker compose up -d

timeout /t 5 /nobreak >nul

echo Checking health...
curl -sf http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo OK
) else (
    echo FAIL
)

echo.
echo Dashboard: http://^<host^>:8000
