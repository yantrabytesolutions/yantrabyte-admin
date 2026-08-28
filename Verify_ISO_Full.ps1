# Verify Full ISO Files & Software Pack
$isoPath = "D:\win11_fast_autoinstall.iso"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   FULL ISO INTEGRITY & AUTO-SOFTWARE CHECK" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $isoPath) {
    $sizeGB = [math]::Round((Get-Item $isoPath).Length / 1GB, 2)
    Write-Host "[+] ISO File Path: $isoPath" -ForegroundColor Yellow
    Write-Host "[+] ISO File Size: $sizeGB GB" -ForegroundColor Green
    
    Mount-DiskImage -ImagePath $isoPath | Out-Null
    Start-Sleep -Seconds 2
    $drive = (Get-DiskImage -ImagePath $isoPath | Get-Volume).DriveLetter
    Write-Host "[+] Mounted Drive: ${drive}:\" -ForegroundColor Yellow
    Write-Host ""
    
    $chkFiles = @(
        'autounattend.xml',
        'sources\install.wim',
        'sources\$OEM$\$1\Install\Install_All_Software.bat',
        'sources\$OEM$\$1\Install\7z2501-x64.exe',
        'sources\$OEM$\$1\Install\ChromeStandaloneSetup64.exe',
        'sources\$OEM$\$1\Install\_igetintopc.com_AcroRdrDC1801120063_en_US.exe',
        'sources\$OEM$\$1\Install\debloat_win11.bat',
        'sources\$OEM$\$1\Install\fix_lag_optimize.bat',
        'sources\$OEM$\$1\Install\Office2024\Office\Setup64.exe',
        'sources\$OEM$\$$\Setup\Scripts\SetupComplete.cmd'
    )
    
    foreach ($f in $chkFiles) {
        $p = Join-Path "${drive}:\" $f
        if (Test-Path $p) {
            Write-Host "  [PASS] $f" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] $f" -ForegroundColor Red
        }
    }
    
    Dismount-DiskImage -ImagePath $isoPath | Out-Null
} else {
    Write-Host "[ERROR] ISO file not found!" -ForegroundColor Red
}
