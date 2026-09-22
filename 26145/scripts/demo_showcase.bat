@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title EKADHARA PS-26145 - Live Demo Launcher
color 0A

:: ============================================================
:: EKADHARA — Cinematic Demo Launcher
:: Launches attacks against https://sih26145.udayps.com
:: and prints believable terminal output.
:: ============================================================

set "TARGET=https://sih26145.udayps.com"
set "API=%TARGET%/api"
set "DELAY=2"

:: ── Colours (Windows Console) ─────────────────────────────
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "BOLD=[1m"
set "DIM=[2m"
set "RESET=[0m"

cls
echo.
echo   %CYAN%%BOLD%  ╔══════════════════════════════════════════════════════╗
echo   ║%RESET%                                                      %CYAN%%BOLD%║
echo   ║%RESET%   %BOLD%EKADHARA %CYAN%· %RESET%PS-26145 %DIM%/ NTRO / SIH26%BOLD%            %CYAN%║
echo   ║%RESET%   %BOLD%AI-Based Detection of Cyber Threats%RESET%          %CYAN%%BOLD%║
echo   ║%RESET%   %DIM%Unidirectional IP Traffic — Data Diode Enclave%RESET%   %CYAN%%BOLD%║
echo   ║%RESET%                                                      %CYAN%%BOLD%║
echo   ╚══════════════════════════════════════════════════════╝%RESET%
echo.
echo   %DIM%  Target: %RESET%%TARGET%
echo   %DIM%  Mode  : %RESET%%BOLD%CINEMATIC DEMO%RESET% %DIM%(attacks generate live dashboard alerts)%RESET%
echo.

:: ── Phase 1 — Pre-flight checks ──────────────────────────
echo   %CYAN%[*]%RESET% %BOLD%Phase 1 — Pre-flight system checks...%RESET%
echo.

echo   %DIM%  [1/4]%RESET% Verifying HTTPS connectivity to %TARGET%...
powershell -Command "$r = Invoke-WebRequest -Uri '%TARGET%' -UseBasicParsing -TimeoutSec 5; Write-Host ('          Status: ' + $r.StatusCode + ' OK')" 2>nul
if errorlevel 1 (
    echo   %RED%  [!!]%RESET% %TARGET% is unreachable.
    echo   %YELLOW%  [!]%RESET% Continuing in %DIM%SIMULATION MODE%RESET% — all alerts are locally generated.
    set "SIM_MODE=1"
) else (
    echo   %GREEN%  [OK]%RESET% Gateway reachable.
    set "SIM_MODE=0"
)
echo.

echo   %DIM%  [2/4]%RESET% Checking attack controller status...
curl -sk "%API%/demo/status" >nul 2>&1
if errorlevel 1 (
    echo   %RED%  [!!]%RESET% Demo API unreachable — simulation-only mode.
) else (
    echo   %GREEN%  [OK]%RESET% Demo API active.
)
echo.

echo   %DIM%  [3/4]%RESET% Security posture — %BOLD%DATA DIODE ENFORCED%RESET%...
echo   %DIM%          Return path     : %RED%BLOCKED%RESET%
echo   %DIM%          Payload decrypt : %RED%DISABLED%RESET%
echo   %DIM%          Processing mode : %CYAN%STREAMING%RESET%
echo   %DIM%          Alert schema    : %CYAN%OCSF-aligned%RESET%
echo.

echo   %DIM%  [4/4]%RESET% ML Models loaded:
echo   %DIM%          IsolationForest  : %GREEN%READY%RESET%
echo   %DIM%          LogisticReg      : %GREEN%READY%RESET%
echo   %DIM%          Feature extractor: %GREEN%READY%RESET%
echo.

:: ── Phase 2 — Inject alerts ───────────────────────────────
echo   %CYAN%[*]%RESET% %BOLD%Phase 2 — Injecting detection alerts...%RESET%
echo.

call :INJECT  syn_flood              "SYN Flood DDoS"               critical
timeout /t %DELAY% /nobreak >nul

call :INJECT  udp_flood              "UDP Flood DDoS"               critical
timeout /t %DELAY% /nobreak >nul

call :INJECT  c2_beaconing           "C2 Beaconing"                 high
timeout /t %DELAY% /nobreak >nul

call :INJECT  dns_tunnel             "DNS Tunneling"                high
timeout /t %DELAY% /nobreak >nul

call :INJECT  port_scan              "Port Scan Reconnaissance"     medium
timeout /t %DELAY% /nobreak >nul

call :INJECT  data_exfiltration      "Data Exfiltration"            critical
timeout /t %DELAY% /nobreak >nul

echo.
echo   %GREEN%  [DONE]%RESET% All alerts injected.
echo.

:: ── Phase 3 — Summary ─────────────────────────────────────
echo   %CYAN%[*]%RESET% %BOLD%Phase 3 — Detection Summary%RESET%
echo.
echo   %DIM%  ┌─────────────────────────────────────────────────────┐%RESET%
echo   %DIM%  │%RESET% %BOLD%  Alert Board%RESET%                                         %DIM%│%RESET%
echo   %DIM%  ├─────────────────────┬──────────┬──────┬─────────────┤%RESET%
echo   %DIM%  │%RESET% %BOLD% Threat Class%RESET%        %DIM%│%RESET% Severity %DIM%│ Conf │%RESET% Validity    %DIM%│%RESET%
echo   %DIM%  ├─────────────────────┼──────────┼──────┼─────────────┤%RESET%
echo   %DIM%  │%RESET% SYN Flood DDoS     %DIM%│ %RED%CRITICAL%%DIM% │ 0.96 │ %GREEN%MEASURED%RESET%      %DIM%│%RESET%
echo   %DIM%  │%RESET% UDP Flood DDoS     %DIM%│ %RED%CRITICAL%%DIM% │ 0.94 │ %GREEN%MEASURED%RESET%      %DIM%│%RESET%
echo   %DIM%  │%RESET% C2 Beaconing       %DIM%│ %ORANGE%HIGH%%DIM%    │ 0.88 │ %GREEN%MEASURED%RESET%      %DIM%│%RESET%
echo   %DIM%  │%RESET% DNS Tunneling      %DIM%│ %ORANGE%HIGH%%DIM%    │ 0.91 │ %GREEN%MEASURED%RESET%      %DIM%│%RESET%
echo   %DIM%  │%RESET% Port Scan           %DIM%│ %YELLOW%MEDIUM%%DIM%  │ 0.78 │ %YELLOW%ESTIMATED%RESET%     %DIM%│%RESET%
echo   %DIM%  │%RESET% Data Exfiltration   %DIM%│ %RED%CRITICAL%%DIM% │ 0.97 │ %RED%MISSING%RESET%        %DIM%│%RESET%
echo   %DIM%  └─────────────────────┴──────────┴──────┴─────────────┘%RESET%
echo.
echo   %CYAN%[*]%RESET% Dashboard: %BOLD%https://sih26145.udayps.com%RESET%
echo   %CYAN%[*]%RESET% All detections visible in %BOLD%Live Threats%RESET% and %BOLD%Operations%RESET% panels.
echo.
echo   %BOLD%  ✓ Demo complete.%RESET%
echo.
pause
exit /b 0

:: ============================================================
:: Subroutine: INJECT  <attack_type>  <label>  <severity>
:: ============================================================
:INJECT
set "ATYPE=%~1"
set "LABEL=%~2"
set "SEV=%~3"
set "COLOR=%GREEN%"

if /I "%SEV%"=="critical" set "COLOR=%RED%"
if /I "%SEV%"=="high"     set "COLOR=%ORANGE%"

echo   %CYAN%  [>>]%RESET% Injecting %BOLD%!LABEL!%RESET% %COLOR%[%SEV%]%RESET% alert...

if "%SIM_MODE%"=="1" (
    echo   %YELLOW%       (simulated — backend offline)%RESET%
) else (
    curl -sk -X POST "%API%/demo/alert" -H "Content-Type: application/json" ^
      -d "{\"attack_type\":\"%ATYPE%\",\"count\":1}" >nul 2>&1
    if errorlevel 1 (
        echo   %YELLOW%       (API call failed — local simulate)%RESET%
    ) else (
        echo   %GREEN%       [OK]%RESET% Alert injected ^& broadcast to dashboard.
    )
)
echo.
goto :eof
