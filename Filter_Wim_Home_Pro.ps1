# Filter WIM to keep ONLY Windows 11 Home and Windows 11 Pro
$ErrorActionPreference = "Stop"

$sourceIso = "D:\iso file\Windows11.iso"
$workDir   = "D:\Win11_Ultimate_Temp"
$scriptDir = "D:\Antigravity"
$oscdimg   = Join-Path $scriptDir "oscdimg.exe"
$targetIso = "D:\win11_ultimate_autoinstall.iso"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "      DISM WIM FILTER: KEEPING ONLY WINDOWS 11 HOME & PRO" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# 1. Mount source ISO
try { Dismount-DiskImage -ImagePath $sourceIso -ErrorAction SilentlyContinue } catch {}
if (Test-Path $workDir) { Remove-Item -Path $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

Write-Host "[*] Extracting Windows 11 base ISO..." -ForegroundColor Yellow
$mount = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2
$driveLetter = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter

Copy-Item -Path "${driveLetter}:\*" -Destination $workDir -Recurse -Force
Dismount-DiskImage -ImagePath $sourceIso

# 2. DISM WIM Filtering
$wimFile = Get-ChildItem (Join-Path $workDir "sources") -Filter "install.*" | Select-Object -First 1
$tempWim = Join-Path $workDir "sources\install_filtered.wim"

if (-not $wimFile) {
    Write-Host "[ERROR] Could not find install.wim or install.esd in sources!" -ForegroundColor Red
    pause
    exit
}

Write-Host "[*] Reading image indexes from $($wimFile.Name)..." -ForegroundColor Yellow

# Parse dism /Get-WimInfo output
$dismOutput = & dism.exe /Get-WimInfo /WimFile:"$($wimFile.FullName)"
Write-Host $dismOutput -ForegroundColor Gray

# Loop through index 1 to 10 and export if name matches Windows 11 Home or Windows 11 Pro
$homeIndex = $null
$proIndex  = $null

for ($i = 1; $i -le 12; $i++) {
    $info = & dism.exe /Get-WimInfo /WimFile:"$($wimFile.FullName)" /Index:$i 2>nul
    $infoText = $info -join "`n"
    if ($infoText -match "Name\s*:\s*(Windows 11 Home)$" -or $infoText -match "Name\s*:\s*Windows 11 Home\s") {
        $homeIndex = $i
        Write-Host "[FOUND] Windows 11 Home at Index $i" -ForegroundColor Green
    }
    if ($infoText -match "Name\s*:\s*(Windows 11 Pro)$" -or $infoText -match "Name\s*:\s*Windows 11 Pro\s") {
        $proIndex = $i
        Write-Host "[FOUND] Windows 11 Pro at Index $i" -ForegroundColor Green
    }
}

if (-not $homeIndex) { $homeIndex = 1 } # Fallback index 1 for Home
if (-not $proIndex)  { $proIndex  = 6 } # Fallback index 6 for Pro

Write-Host "[*] Exporting Index $homeIndex (Home) and Index $proIndex (Pro) into new install.wim..." -ForegroundColor Yellow

& dism.exe /Export-Image /SourceImageFile:"$($wimFile.FullName)" /SourceIndex:$homeIndex /DestinationImageFile:"$tempWim" /Compress:max
& dism.exe /Export-Image /SourceImageFile:"$($wimFile.FullName)" /SourceIndex:$proIndex /DestinationImageFile:"$tempWim" /Compress:max

if (Test-Path $tempWim) {
    Remove-Item -Path $wimFile.FullName -Force
    Move-Item -Path $tempWim -Destination (Join-Path $workDir "sources\install.wim") -Force
    Write-Host "[SUCCESS] install.wim replaced! Only Home & Pro remain." -ForegroundColor Green
} else {
    Write-Host "[ERROR] DISM Export failed!" -ForegroundColor Red
    pause
    exit
}

# 3. Add Office 2024 Retail, Adobe Reader, Chrome, 7-Zip, Batch Scripts
$installersDir = Join-Path $workDir "sources\$OEM$\$1\Installers"
$officeDir = Join-Path $installersDir "Office"
New-Item -ItemType Directory -Path $officeDir -Force | Out-Null

$officeImg = "D:\iso file\ProPlus2024Retail.img"
if (Test-Path $officeImg) {
    Write-Host "[*] Extracting Office 2024 Pro Plus Retail..." -ForegroundColor Yellow
    $mountOff = Mount-DiskImage -ImagePath $officeImg -PassThru
    Start-Sleep -Seconds 2
    $offDrive = (Get-DiskImage -ImagePath $officeImg | Get-Volume).DriveLetter
    if ($offDrive) {
        Copy-Item -Path "${offDrive}:\*" -Destination $officeDir -Recurse -Force
        Dismount-DiskImage -ImagePath $officeImg
    }
}

$configXml = @"
<Configuration>
  <Add OfficeClientEdition="64">
    <Product ID="ProPlus2024Retail">
      <Language ID="en-us" />
    </Product>
  </Add>
  <Display Level="None" AcceptEULA="TRUE" />
</Configuration>
"@
Set-Content -Path (Join-Path $officeDir "configuration.xml") -Value $configXml -Encoding UTF8

$isoSourceFolder = "D:\iso file"
$softwareFiles = @(
    "7z2501-x64.exe",
    "ChromeStandaloneSetup64.exe",
    "_igetintopc.com_AcroRdrDC1801120063_en_US.exe",
    "debloat_win11.bat",
    "fix_lag_optimize.bat",
    "service disable.bat"
)
foreach ($file in $softwareFiles) {
    $srcPath = Join-Path $isoSourceFolder $file
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $installersDir $file) -Force
    }
}

# 4. Inject SetupComplete.cmd
$oemScripts = Join-Path $workDir "sources\$OEM$\$$\Setup\Scripts"
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null
Copy-Item -Path (Join-Path $scriptDir "SetupComplete_Ultimate.cmd") -Destination (Join-Path $oemScripts "SetupComplete.cmd") -Force

# 5. Build Bootable Dual UEFI + BIOS UDF ISO
Write-Host "[*] Packaging Bootable ISO with oscdimg..." -ForegroundColor Yellow
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
    Write-Host "   ULTIMATE BOOTABLE ISO (PRO & HOME ONLY) CREATED! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "Saved to: $targetIso" -ForegroundColor Cyan
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[ERROR] oscdimg failed!" -ForegroundColor Red
    Write-Host $stdout
    Write-Host $stderr
}
