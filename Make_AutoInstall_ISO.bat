@echo off
setlocal EnableDelayedExpansion
title Windows 11 Auto-Install ISO Builder
color 1F

:: 1. Auto-Elevate to Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ===================================================================
echo             WINDOWS 11 AUTO-INSTALL ISO BUILDER (UDF / UEFI)
echo ===================================================================
echo.
echo Source ISO : D:\win11office.iso
echo Target ISO : D:\win11_custom_autoinstall.iso
echo.
echo ===================================================================

set "SOURCE_ISO=D:\win11office.iso"
set "EXTRACT_DIR=D:\Win11_ISO_Temp"
set "TARGET_ISO=D:\win11_custom_autoinstall.iso"
set "OSCDIMG_EXE=%~dp0oscdimg.exe"

if not exist "%SOURCE_ISO%" (
    echo.
    echo [ERROR] Could not find "%SOURCE_ISO%"!
    echo Please make sure your ISO is named "win11office.iso" on D:\ drive.
    pause
    exit /b
)

:: 2. Download Microsoft oscdimg tool if not present
if not exist "%OSCDIMG_EXE%" (
    echo [*] Downloading Microsoft ISO mastering engine (oscdimg)...
    curl -s -L "https://github.com/ITCMD/oscdimg/raw/main/oscdimg.exe" -o "%OSCDIMG_EXE%"
    if not exist "%OSCDIMG_EXE%" (
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/ITCMD/oscdimg/raw/main/oscdimg.exe', '%OSCDIMG_EXE%')"
    )
)

:: 3. Clean old temp folder if present
if exist "%EXTRACT_DIR%" (
    echo [*] Cleaning old temporary build directory...
    rmdir /s /q "%EXTRACT_DIR%"
)
mkdir "%EXTRACT_DIR%"

:: 4. Extract ISO
echo.
echo [*] Mounting and extracting "%SOURCE_ISO%" (Takes 2-3 minutes)...
powershell -Command "$mount = Mount-DiskImage -ImagePath '%SOURCE_ISO%' -PassThru; $drive = ($mount | Get-Volume).DriveLetter; Copy-Item -Path ($drive + ':\*') -Destination '%EXTRACT_DIR%' -Recurse -Force; Dismount-DiskImage -ImagePath '%SOURCE_ISO%'"

echo [OK] ISO successfully extracted.

:: 5. Inject $OEM$ scripts (SetupComplete.cmd)
echo.
echo [*] Injecting Post-Install Automation Scripts ($OEM$)...
set "SCRIPTS_DEST=%EXTRACT_DIR%\sources\$OEM$\$$\Setup\Scripts"
mkdir "%SCRIPTS_DEST%" >nul 2>&1

if exist "%~dp0SetupComplete.cmd" (
    copy /y "%~dp0SetupComplete.cmd" "%SCRIPTS_DEST%\SetupComplete.cmd" >nul
) else (
    echo [ERROR] SetupComplete.cmd not found in %~dp0!
    pause
    exit /b
)
echo [OK] SetupComplete.cmd injected.

:: 6. Build Bootable UDF / UEFI ISO with oscdimg
echo.
echo [*] Packaging bootable Windows 11 ISO with UDF and UEFI boot records...
if exist "%TARGET_ISO%" del /f /q "%TARGET_ISO%" >nul 2>&1

"%OSCDIMG_EXE%" -m -o -u2 -udfver102 -bootdata:2#p0,e,b"%EXTRACT_DIR%\boot\etfsboot.com"#pEF,e,b"%EXTRACT_DIR%\efi\microsoft\boot\efisys.bin" "%EXTRACT_DIR%" "%TARGET_ISO%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to build ISO image!
    pause
    exit /b
)

:: 7. Clean up temporary extract folder
echo.
echo [*] Cleaning up temporary build files...
rmdir /s /q "%EXTRACT_DIR%" >nul 2>&1

echo.
echo ===================================================================
echo                   BUILD COMPLETED SUCCESSFULLY!
echo ===================================================================
echo.
echo Created ISO: %TARGET_ISO%
echo.
echo You can now burn %TARGET_ISO% to USB using Rufus or Ventoy.
echo.
pause
