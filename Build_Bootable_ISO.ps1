# Build Bootable Dual UEFI + BIOS Windows 11 ISO
$ErrorActionPreference = "Stop"

$sourceIso = "D:\win11office.iso"
$workDir   = "D:\Win11_ISO_Temp"
$targetIso = "D:\win11_custom_autoinstall.iso"
$scriptDir = "D:\Antigravity"
$oscdimg   = Join-Path $scriptDir "oscdimg.exe"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "           BUILDING BOOTABLE WINDOWS 11 ISO (UEFI + BIOS)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# 1. Clean previous mounts
try { Dismount-DiskImage -ImagePath $sourceIso -ErrorAction SilentlyContinue } catch {}
if (Test-Path $workDir) { Remove-Item -Path $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

# 2. Mount source ISO
Write-Host "[*] Mounting $sourceIso..." -ForegroundColor Yellow
$mount = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2
$driveLetter = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter

# 3. Copy files
Write-Host "[*] Copying installation files from Drive ${driveLetter}: to $workDir..." -ForegroundColor Yellow
Copy-Item -Path "${driveLetter}:\*" -Destination $workDir -Recurse -Force

Write-Host "[*] Dismounting original ISO..." -ForegroundColor Yellow
Dismount-DiskImage -ImagePath $sourceIso

# 4. Inject SetupComplete.cmd
Write-Host "[*] Injecting SetupComplete.cmd into `$OEM$` folder..." -ForegroundColor Yellow
$oemScripts = Join-Path $workDir "sources\$OEM$\$$\Setup\Scripts"
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null
Copy-Item -Path (Join-Path $scriptDir "SetupComplete.cmd") -Destination (Join-Path $oemScripts "SetupComplete.cmd") -Force
Write-Host "[OK] SetupComplete.cmd injected." -ForegroundColor Green

# 5. Build dual bootable ISO using oscdimg.exe
Write-Host "[*] Running Microsoft oscdimg engine..." -ForegroundColor Yellow
if (Test-Path $targetIso) { Remove-Item -Path $targetIso -Force }

$etfsboot = Join-Path $workDir "boot\etfsboot.com"
$efisys   = Join-Path $workDir "efi\microsoft\boot\efisys.bin"

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
    Write-Host "         ISO CREATED SUCCESSFULLY! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "Bootable ISO Saved To: $targetIso" -ForegroundColor Cyan
    
    # Cleanup temp folder
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[ERROR] oscdimg failed!" -ForegroundColor Red
    Write-Host $stdout
    Write-Host $stderr
}
