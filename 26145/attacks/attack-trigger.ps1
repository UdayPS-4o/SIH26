# WATCHTOWER External Attack Trigger
# Run these from the Windows attack PC to trigger simulated attacks
# that the WATCHTOWER dashboard will detect and display.

$WATCHTOWER_IP = "localhost"  # Change to Docker host IP for remote attacks
$API_BASE = "http://$WATCHTOWER_IP:8000/api/attack"

function Invoke-Attack {
    param(
        [string]$Type,
        [string]$SourceIP = "10.0.0.$((Get-Random -Minimum 1 -Maximum 254))",
        [string]$TargetIP = $WATCHTOWER_IP,
        [int]$Duration = 30,
        [hashtable]$Params = @{}
    )

    Write-Host "[*] Launching $Type attack from $SourceIP -> $TargetIP (${Duration}s)" -ForegroundColor Cyan

    try {
        $body = @{
            attack_type = $Type
            source_ip = $SourceIP
            target_ip = $TargetIP
            duration = $Duration
            params = $Params
        } | ConvertTo-Json

        $resp = Invoke-RestMethod -Uri "$API_BASE/attack/external" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body

        Write-Host "[+] Attack triggered! ID: $($resp.attack_id)" -ForegroundColor Green
        Write-Host "    Status: $($resp.status)" -ForegroundColor Gray
        return $resp
    }
    catch {
        Write-Host "[-] Failed: $_" -ForegroundColor Red
        return $null
    }
}

# ─── Individual Attack Functions ───

function Start-SynFlood {
    param([string]$Intensity = "medium")
    Invoke-Attack -Type "syn_flood" -Duration 30 -Params @{ intensity = $Intensity; pps = 5000 }
}

function Start-UdpFlood {
    param([string]$Intensity = "medium")
    Invoke-Attack -Type "udp_flood" -Duration 30 -Params @{ intensity = $Intensity; packet_size = 1400 }
}

function Start-PortScan {
    param([int]$StartPort = 1, [int]$EndPort = 1024)
    Invoke-Attack -Type "port_scan" -Duration 60 -Params @{ start_port = $StartPort; end_port = $EndPort; scan_type = "sequential" }
}

function Start-C2Beacon {
    param([int]$IntervalSec = 5)
    Invoke-Attack -Type "c2_beacon" -Duration 60 -Params @{ interval_sec = $IntervalSec; jitter = 0.2 }
}

function Start-DgaBurst {
    param([int]$DomainCount = 50)
    Invoke-Attack -Type "dga_burst" -Duration 30 -Params @{ domain_count = $DomainCount }
}

function Start-DnsTunnel {
    param([int]$DataSizeKB = 50)
    Invoke-Attack -Type "dns_tunnel" -Duration 30 -Params @{ data_size_kb = $DataSizeKB }
}

function Start-DataExfil {
    param([int]$SizeMB = 10)
    Invoke-Attack -Type "data_exfiltration" -Duration 30 -Params @{ size_mb = $SizeMB }
}

# ─── Kill Chain (the cinematic demo) ───

function Start-KillChain {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "  WATCHTOWER KILL CHAIN DEMO" -ForegroundColor Magenta
    Write-Host "  Recon -> C2 -> DGA -> Tunnel -> Exfil -> Flood" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""

    # Phase 1: Reconnaissance
    Write-Host "PHASE 1: RECONNAISSANCE (Port Scan)" -ForegroundColor Yellow
    Start-PortScan -StartPort 1 -EndPort 1024
    Start-Sleep -Seconds 10

    # Phase 2: C2 Beaconing
    Write-Host "PHASE 2: C2 BEACONING" -ForegroundColor Yellow
    Start-C2Beacon -IntervalSec 5
    Start-Sleep -Seconds 15

    # Phase 3: DGA Domains
    Write-Host "PHASE 3: DGA DOMAIN GENERATION" -ForegroundColor Yellow
    Start-DgaBurst -DomainCount 100
    Start-Sleep -Seconds 10

    # Phase 4: DNS Tunneling
    Write-Host "PHASE 4: DNS TUNNELING (Data Exfil via DNS)" -ForegroundColor Yellow
    Start-DnsTunnel -DataSizeKB 100
    Start-Sleep -Seconds 10

    # Phase 5: Direct Exfiltration
    Write-Host "PHASE 5: DIRECT DATA EXFILTRATION" -ForegroundColor Yellow
    Start-DataExfil -SizeMB 20
    Start-Sleep -Seconds 10

    # Phase 6: Volumetric DDoS (grand finale)
    Write-Host "PHASE 6: VOLUMETRIC DDOS (SYN + UDP Flood)" -ForegroundColor Red
    Start-SynFlood -Intensity "high"
    Start-UdpFlood -Intensity "high"
    Start-Sleep -Seconds 10

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  KILL CHAIN COMPLETE" -ForegroundColor Green
    Write-Host "  Check the WATCHTOWER dashboard for all detections" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
}

# ─── Menu ───

Write-Host ""
Write-Host "WATCHTOWER External Attack Controller" -ForegroundColor Cyan
Write-Host "Target: $WATCHTOWER_IP:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "Commands:" -ForegroundColor White
Write-Host "  Start-KillChain          - Run full 6-phase attack chain" -ForegroundColor Green
Write-Host "  Start-SynFlood           - SYN flood attack" -ForegroundColor Green
Write-Host "  Start-UdpFlood           - UDP flood attack" -ForegroundColor Green
Write-Host "  Start-PortScan           - Port scan (1-1024)" -ForegroundColor Green
Write-Host "  Start-C2Beacon           - C2 beaconing simulation" -ForegroundColor Green
Write-Host "  Start-DgaBurst           - DGA domain burst" -ForegroundColor Green
Write-Host "  Start-DnsTunnel          - DNS tunneling" -ForegroundColor Green
Write-Host "  Start-DataExfil          - Data exfiltration" -ForegroundColor Green
Write-Host ""
Write-Host "Usage: .\attack-trigger.ps1" -ForegroundColor Gray
Write-Host "Then:  Start-KillChain" -ForegroundColor Gray
Write-Host ""
