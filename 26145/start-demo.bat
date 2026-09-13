@echo off
chcp 65001 >nul
echo ========================================
echo   Cyber Threat Detection System
echo   SIH26 - Problem 26145
echo ========================================
echo.
echo Starting backend server...
echo.
start "Backend Server" cmd /k "cd backend && python main.py"
timeout /t 3 /nobreak >nul
echo.
echo Starting frontend dashboard...
echo.
start "Frontend Dashboard" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul
echo.
echo Opening browser...
start http://localhost:3000
echo.
echo ========================================
echo   System is running!
echo   Dashboard: http://localhost:3000
echo   API: http://localhost:8000
echo   WebSocket: ws://localhost:8000/ws
echo ========================================
pause
