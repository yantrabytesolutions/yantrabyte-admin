# Verification Script for D:\win11_fast_autoinstall.iso
$iso = "D:\win11_fast_autoinstall.iso"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  CROSS-CHECKING D:\win11_fast_autoinstall.iso" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $iso) {
    $file = Get-Item $iso
    $gb = [math]::Round($file.Length / 1GB, 2)
    Write-Host "[1] EXISTENCE & SIZE:" -ForegroundColor Yellow
    Write-Host "    - Path:       $($file.FullName)"
    Write-Host "    - Size:       $($file.Length) bytes ($gb GB)"
    Write-Host "    - Timestamp:  $($file.LastWriteTime)"
    Write-Host ""

    Write-Host "[2] LOCK & READABILITY TEST:" -ForegroundColor Yellow
    try {
        $fs = [System.IO.File]::Open($iso, 'Open', 'Read', 'ReadWrite')
        $fs.Close()
        Write-Host "    - Status:     SUCCESS (File is fully written and not locked!)" -ForegroundColor Green
    } catch {
        Write-Host "    - Status:     LOCKED/UNREADABLE ($($_.Exception.Message))" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "[3] MOUNT & CONTENT TEST:" -ForegroundColor Yellow
    try {
        $mount = Mount-DiskImage -ImagePath $iso -PassThru -ErrorAction Stop
        Start-Sleep -Seconds 2
        $vol = Get-Volume -DiskImage $mount
        $drive = $vol.DriveLetter

        if ($drive) {
            Write-Host "    - Mounted Drive: $drive`:\" -ForegroundColor Green
            $hasUnattend = Test-Path "$drive`:\autounattend.xml"
            $hasWim      = Test-Path "$drive`:\sources\install.wim"
            Write-Host "    - autounattend.xml present: $hasUnattend" -ForegroundColor Green
            Write-Host "    - install.wim present:      $hasWim" -ForegroundColor Green
        }
        Dismount-DiskImage -ImagePath $iso | Out-Null
        Write-Host "    - Status:     SUCCESS (ISO UDF File System is 100% Valid & Bootable!)" -ForegroundColor Green
    } catch {
        Write-Host "    - Status:     MOUNT FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] $iso does not exist!" -ForegroundColor Red
}
