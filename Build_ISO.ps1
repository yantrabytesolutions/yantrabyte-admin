# Ensure Admin Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "Windows 11 Custom ISO Builder (Official Oscdimg)"
Clear-Host

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "         WINDOWS 11 BOOTABLE CUSTOM ISO BUILDER (UEFI + BIOS)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$sourceIso = "D:\win11office.iso"
$workDir   = "D:\Win11_ISO_Temp"
$targetIso = "D:\win11_custom_autoinstall.iso"
$scriptDir = Split-Path -Parent $PSCommandPath
$oscdimg   = Join-Path $scriptDir "oscdimg.exe"

# 1. Check Source ISO
if (-not (Test-Path $sourceIso)) {
    Write-Host "[ERROR] Could not find $sourceIso!" -ForegroundColor Red
    Write-Host "Please make sure 'win11office.iso' exists on your D:\ drive." -ForegroundColor Yellow
    pause
    exit
}

# 2. Verify oscdimg.exe
if (-not (Test-Path $oscdimg)) {
    Write-Host "[*] Downloading official Microsoft oscdimg tool..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    try {
        (New-Object System.Net.WebClient).DownloadFile('https://msdl.microsoft.com/download/symbols/oscdimg.exe/9F01AFB765000/oscdimg.exe', $oscdimg)
        Write-Host "[OK] oscdimg.exe ready." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not download oscdimg.exe: $($_.Exception.Message)" -ForegroundColor Red
        pause
        exit
    }
}

# 3. Clean and prepare workspace
Write-Host "[*] Preparing temporary build workspace ($workDir)..." -ForegroundColor Yellow
try { Dismount-DiskImage -ImagePath $sourceIso -ErrorAction SilentlyContinue } catch {}

if (Test-Path $workDir) {
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

# 4. Mount and extract files from original ISO
Write-Host "[*] Mounting $sourceIso..." -ForegroundColor Yellow
$mountResult = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2

$driveLetter = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter
if (-not $driveLetter) {
    $driveLetter = (Get-Volume | Where-Object { $_.DriveType -eq 'CD-ROM' -and $_.FileSystem -ne $null } | Select-Object -First 1).DriveLetter
}

if (-not $driveLetter) {
    Write-Host "[ERROR] Failed to get mounted drive letter." -ForegroundColor Red
    pause
    exit
}

Write-Host "[*] Copying Windows files from Drive ${driveLetter}: to $workDir..." -ForegroundColor Yellow
Copy-Item -Path "${driveLetter}:\*" -Destination $workDir -Recurse -Force

Write-Host "[*] Dismounting original ISO..." -ForegroundColor Yellow
Dismount-DiskImage -ImagePath $sourceIso

# 5. Inject SetupComplete.cmd
Write-Host "[*] Injecting SetupComplete.cmd into `$OEM$` folder..." -ForegroundColor Yellow
$oemScripts = Join-Path $workDir "sources\$OEM$\$$\Setup\Scripts"
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null

$setupCmdSource = Join-Path $scriptDir "SetupComplete.cmd"
if (Test-Path $setupCmdSource) {
    Copy-Item -Path $setupCmdSource -Destination (Join-Path $oemScripts "SetupComplete.cmd") -Force
    Write-Host "[OK] SetupComplete.cmd successfully injected." -ForegroundColor Green
} else {
    Write-Host "[ERROR] $setupCmdSource was not found!" -ForegroundColor Red
    pause
    exit
}

# 6. Build Dual UEFI + BIOS Bootable UDF ISO with Microsoft Oscdimg
Write-Host "[*] Building bootable ISO image with Microsoft oscdimg engine..." -ForegroundColor Yellow
if (Test-Path $targetIso) {
    Remove-Item -Path $targetIso -Force -ErrorAction SilentlyContinue
}

$etfsboot = Join-Path $workDir "boot\etfsboot.com"
$efisys   = Join-Path $workDir "efi\microsoft\boot\efisys.bin"

if (-not (Test-Path $etfsboot)) {
    Write-Host "[ERROR] Boot sector $etfsboot not found!" -ForegroundColor Red
    pause
    exit
}

if (-not (Test-Path $efisys)) {
    Write-Host "[ERROR] EFI Boot sector $efisys not found!" -ForegroundColor Red
    pause
    exit
}

# Bootdata string for dual boot (BIOS + UEFI)
$bootData = "2#p0,e,b`"$etfsboot`"#pEF,e,b`"$efisys`""

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $oscdimg
$processInfo.Arguments = "-m -o -u2 -udfver102 -bootdata:$bootData `"$workDir`" `"$targetIso`""
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = [System.Diagnostics.Process]::Start($processInfo)
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -eq 0 -and (Test-Path $targetIso)) {
    $sizeGB = [math]::Round((Get-Item $targetIso).Length / 1GB, 2)
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "          SUCCESSFULLY CREATED BOOTABLE ISO! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "Saved to: $targetIso" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[*] Cleaning up temporary build files..." -ForegroundColor Gray
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host ""
    Write-Host "[ERROR] oscdimg failed to create bootable ISO!" -ForegroundColor Red
    Write-Host $stdout -ForegroundColor Yellow
    Write-Host $stderr -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
