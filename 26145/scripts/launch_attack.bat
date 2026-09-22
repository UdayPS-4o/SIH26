@echo off
setlocal

echo ========================================
echo    EKADHARA - Live Attack Launcher
echo ========================================
echo.
set /p TARGET="Enter target IP or domain (e.g. sih26145.udayps.com): "
if "%TARGET%"=="" set TARGET=127.0.0.1

echo.
echo Target: %TARGET%
echo Launching SYN Flood + UDP Flood...
echo.

echo [1/2] Launching SYN Flood...
curl -sk -X POST https://sih26145.udayps.com/api/attack/launch ^
  -H "Content-Type: application/json" ^
  -d "{\"attack_type\":\"syn_flood\",\"target\":\"%TARGET%\",\"duration\":60,\"rate\":500}"

echo.
echo [2/2] Launching UDP Flood (DDoS)...
curl -sk -X POST https://sih26145.udayps.com/api/attack/launch ^
  -H "Content-Type: application/json" ^
  -d "{\"attack_type\":\"udp_flood\",\"target\":\"%TARGET%\",\"duration\":60,\"rate\":500}"

echo.
echo ========================================
echo Both attacks launched for 60 seconds!
echo Check dashboard: https://sih26145.udayps.com
echo ========================================
echo.
echo Live stats (refreshes every 3s):
echo.

:loop
curl -sk https://sih26145.udayps.com/api/stats 2>nul | python -c "import json,sys; d=json.load(sys.stdin); print(f\"Flows: {d.get('total_flows',0)} | Alerts: {d.get('total_alerts',0)} | FPS: {d.get('flows_per_sec',0)} | Running: {d.get('simulator_running',False)}\")"
timeout /t 3 /nobreak >nul
goto loop
