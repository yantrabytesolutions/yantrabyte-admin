@echo off
:: ============================================================
::  NETWORK & REMOTE PC MANAGER - SysAdmin Tool
::  Run as Administrator
:: ============================================================
title Network ^& Remote PC Manager
color 0A
mode con: cols=75 lines=45
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo =========================================================
echo        NETWORK ^& REMOTE PC MANAGER
echo =========================================================
echo.
echo   --- Network Scanning ---
echo   [1]  Scan Network (Find All Devices)
echo   [2]  Ping a PC/IP (Test Connection)
echo   [3]  Traceroute (Track Network Path)
echo   [4]  Port Scanner (Check Open Ports)
echo   [5]  Show All Connected Devices (ARP Table)
echo.
echo   --- Remote PC Control ---
echo   [6]  Remote Shutdown PC
echo   [7]  Remote Restart PC
echo   [8]  Remote Cancel Shutdown
echo   [9]  Send Message to Remote PC
echo.
echo   --- Network Info ---
echo   [10] Full Network Configuration
echo   [11] Show Active Connections ^& Ports
echo   [12] Show Shared Folders on Network
echo   [13] DNS Lookup (Resolve Domain)
echo   [14] Speed Test (Ping Latency Test)
echo   [15] Export Full Network Report
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-15): "

if "%choice%"=="1" goto SCAN_NETWORK
if "%choice%"=="2" goto PING_PC
if "%choice%"=="3" goto TRACEROUTE
if "%choice%"=="4" goto PORT_SCAN
if "%choice%"=="5" goto ARP_TABLE
if "%choice%"=="6" goto REMOTE_SHUTDOWN
if "%choice%"=="7" goto REMOTE_RESTART
if "%choice%"=="8" goto CANCEL_SHUTDOWN
if "%choice%"=="9" goto SEND_MSG
if "%choice%"=="10" goto NET_CONFIG
if "%choice%"=="11" goto ACTIVE_CONN
if "%choice%"=="12" goto SHARED_FOLDERS
if "%choice%"=="13" goto DNS_LOOKUP
if "%choice%"=="14" goto SPEED_TEST
if "%choice%"=="15" goto NET_REPORT
if "%choice%"=="0" exit /b
goto MENU

:SCAN_NETWORK
cls
echo =========================================================
echo  [1] SCANNING NETWORK - Finding All Devices...
echo =========================================================
echo.
:: Get local IP and subnet
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "localip=%%A"
    set "localip=!localip:~1!"
)
:: Extract subnet (first 3 octets)
for /f "tokens=1-3 delims=." %%a in ("!localip!") do (
    set "subnet=%%a.%%b.%%c"
)
echo  Your IP: !localip!
echo  Scanning subnet: !subnet!.0/24
echo.
echo  IP Address          MAC Address           Hostname
echo  ------------------- --------------------- -------------------------
for /L %%i in (1,1,254) do (
    ping -n 1 -w 100 !subnet!.%%i >nul 2>&1
    if !errorLevel! equ 0 (
        for /f "tokens=2 delims= " %%M in ('arp -a !subnet!.%%i ^| findstr "!subnet!.%%i"') do (
            set "mac=%%M"
        )
        for /f "tokens=1" %%H in ('nbtstat -A !subnet!.%%i 2^>nul ^| findstr "<00>"') do (
            set "hostname=%%H"
        )
        echo  !subnet!.%%i       !mac!        !hostname!
        set "hostname="
        set "mac="
    )
)
echo.
echo  Scan Complete!
echo.
pause
goto MENU

:PING_PC
cls
echo =========================================================
echo  [2] PING TEST
echo =========================================================
echo.
set /p target="Enter IP or Hostname: "
echo.
echo  Pinging %target%...
echo.
ping %target% -n 10
echo.
pause
goto MENU

:TRACEROUTE
cls
echo =========================================================
echo  [3] TRACEROUTE
echo =========================================================
echo.
set /p target="Enter IP or Domain: "
echo.
echo  Tracing route to %target%...
echo.
tracert %target%
echo.
pause
goto MENU

:PORT_SCAN
cls
echo =========================================================
echo  [4] PORT SCANNER
echo =========================================================
echo.
set /p target="Enter IP or Hostname: "
echo.
echo  Scanning common ports on %target%...
echo.
echo  Port    Service              Status
echo  ------- -------------------- --------
for %%P in (21 22 23 25 53 80 110 135 139 143 443 445 993 995 1433 1521 3306 3389 5432 5900 8080 8443) do (
    set "svc=Unknown"
    if "%%P"=="21" set "svc=FTP"
    if "%%P"=="22" set "svc=SSH"
    if "%%P"=="23" set "svc=Telnet"
    if "%%P"=="25" set "svc=SMTP"
    if "%%P"=="53" set "svc=DNS"
    if "%%P"=="80" set "svc=HTTP"
    if "%%P"=="110" set "svc=POP3"
    if "%%P"=="135" set "svc=RPC"
    if "%%P"=="139" set "svc=NetBIOS"
    if "%%P"=="143" set "svc=IMAP"
    if "%%P"=="443" set "svc=HTTPS"
    if "%%P"=="445" set "svc=SMB"
    if "%%P"=="993" set "svc=IMAPS"
    if "%%P"=="995" set "svc=POP3S"
    if "%%P"=="1433" set "svc=MSSQL"
    if "%%P"=="1521" set "svc=Oracle"
    if "%%P"=="3306" set "svc=MySQL"
    if "%%P"=="3389" set "svc=RDP"
    if "%%P"=="5432" set "svc=PostgreSQL"
    if "%%P"=="5900" set "svc=VNC"
    if "%%P"=="8080" set "svc=HTTP-Alt"
    if "%%P"=="8443" set "svc=HTTPS-Alt"
    PowerShell -Command "$t=New-Object Net.Sockets.TcpClient;try{$t.Connect('%target%',%%P);if($t.Connected){Write-Host '  %%P      !svc!                 OPEN' -F Green;$t.Close()}}catch{Write-Host '  %%P      !svc!                 CLOSED' -F Red}" 2>nul
)
echo.
pause
goto MENU

:ARP_TABLE
cls
echo =========================================================
echo  [5] CONNECTED DEVICES (ARP TABLE)
echo =========================================================
echo.
arp -a
echo.
pause
goto MENU

:REMOTE_SHUTDOWN
cls
echo =========================================================
echo  [6] REMOTE SHUTDOWN
echo =========================================================
echo.
set /p rpc="Enter Remote PC IP or Name: "
set /p timer="Shutdown delay in seconds (default 30): "
if "%timer%"=="" set timer=30
set /p reason="Enter message for remote user: "
echo.
echo  Sending shutdown command to %rpc%...
shutdown /s /m \\%rpc% /t %timer% /c "%reason%" /f
if %errorLevel% equ 0 (
    echo  [DONE] Shutdown command sent!
) else (
    echo  [ERROR] Failed. Check permissions/network.
)
echo.
pause
goto MENU

:REMOTE_RESTART
cls
echo =========================================================
echo  [7] REMOTE RESTART
echo =========================================================
echo.
set /p rpc="Enter Remote PC IP or Name: "
set /p timer="Restart delay in seconds (default 30): "
if "%timer%"=="" set timer=30
set /p reason="Enter message for remote user: "
echo.
echo  Sending restart command to %rpc%...
shutdown /r /m \\%rpc% /t %timer% /c "%reason%" /f
if %errorLevel% equ 0 (
    echo  [DONE] Restart command sent!
) else (
    echo  [ERROR] Failed. Check permissions/network.
)
echo.
pause
goto MENU

:CANCEL_SHUTDOWN
cls
echo =========================================================
echo  [8] CANCEL REMOTE SHUTDOWN
echo =========================================================
echo.
set /p rpc="Enter Remote PC IP or Name (or LOCAL): "
if /i "%rpc%"=="LOCAL" (
    shutdown /a
) else (
    shutdown /a /m \\%rpc%
)
echo  [DONE] Shutdown cancelled!
echo.
pause
goto MENU

:SEND_MSG
cls
echo =========================================================
echo  [9] SEND MESSAGE TO REMOTE PC
echo =========================================================
echo.
set /p rpc="Enter Remote PC IP or Name: "
set /p msg="Enter Message: "
echo.
msg * /server:%rpc% "%msg%" 2>nul
if %errorLevel% neq 0 (
    PowerShell -Command "Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList 'msg * %msg%' -ComputerName %rpc%" >nul 2>&1
)
echo  [DONE] Message sent!
echo.
pause
goto MENU

:NET_CONFIG
cls
echo =========================================================
echo  [10] FULL NETWORK CONFIGURATION
echo =========================================================
echo.
ipconfig /all
echo.
pause
goto MENU

:ACTIVE_CONN
cls
echo =========================================================
echo  [11] ACTIVE CONNECTIONS ^& LISTENING PORTS
echo =========================================================
echo.
echo  --- Listening Ports ---
netstat -an | findstr "LISTENING"
echo.
echo  --- Established Connections ---
netstat -an | findstr "ESTABLISHED"
echo.
echo  --- Full Stats with Process ID ---
echo.
netstat -ano | findstr "LISTENING ESTABLISHED"
echo.
pause
goto MENU

:SHARED_FOLDERS
cls
echo =========================================================
echo  [12] NETWORK SHARED FOLDERS
echo =========================================================
echo.
echo  --- Local Shares ---
net share
echo.
set /p rpc="View shares on remote PC? Enter IP (or SKIP): "
if /i not "%rpc%"=="SKIP" (
    echo.
    echo  --- Shares on \\%rpc% ---
    net view \\%rpc% 2>nul
    if %errorLevel% neq 0 (
        echo  [ERROR] Cannot access. Check permissions/network.
    )
)
echo.
pause
goto MENU

:DNS_LOOKUP
cls
echo =========================================================
echo  [13] DNS LOOKUP
echo =========================================================
echo.
set /p domain="Enter Domain Name: "
echo.
echo  --- DNS Resolution ---
nslookup %domain%
echo.
echo  --- Reverse Lookup ---
for /f "tokens=2" %%A in ('nslookup %domain% ^| findstr "Address" ^| findstr /v "#"') do (
    echo  IP: %%A
    nslookup %%A 2>nul | findstr "name"
)
echo.
pause
goto MENU

:SPEED_TEST
cls
echo =========================================================
echo  [14] NETWORK LATENCY TEST
echo =========================================================
echo.
echo  Testing latency to major servers...
echo.
echo  Server                    Avg Latency
echo  ------------------------- -----------
for %%S in (google.com cloudflare.com amazon.com microsoft.com 8.8.8.8 1.1.1.1) do (
    for /f "tokens=*" %%R in ('ping -n 4 %%S ^| findstr "Average"') do (
        echo  %%S          %%R
    )
)
echo.
pause
goto MENU

:NET_REPORT
cls
echo =========================================================
echo  [15] EXPORTING FULL NETWORK REPORT...
echo =========================================================
echo.
set "report=%USERPROFILE%\Desktop\Network_Report.txt"

echo ============================================ > "%report%"
echo  NETWORK REPORT - %date% %time% >> "%report%"
echo ============================================ >> "%report%"
echo. >> "%report%"
echo ====== IP CONFIGURATION ====== >> "%report%"
ipconfig /all >> "%report%"
echo. >> "%report%"
echo ====== ARP TABLE ====== >> "%report%"
arp -a >> "%report%"
echo. >> "%report%"
echo ====== ACTIVE CONNECTIONS ====== >> "%report%"
netstat -ano >> "%report%"
echo. >> "%report%"
echo ====== ROUTING TABLE ====== >> "%report%"
route print >> "%report%"
echo. >> "%report%"
echo ====== DNS CACHE ====== >> "%report%"
ipconfig /displaydns >> "%report%"
echo. >> "%report%"
echo ====== LOCAL SHARES ====== >> "%report%"
net share >> "%report%"
echo. >> "%report%"
echo ====== FIREWALL STATUS ====== >> "%report%"
netsh advfirewall show allprofiles >> "%report%"

echo  Report saved to Desktop: Network_Report.txt
echo.
notepad "%report%"
pause
goto MENU
