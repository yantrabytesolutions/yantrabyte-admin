$sourceIso = "D:\iso file\Windows11.iso"
$mount = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2
$driveLetter = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter

$wim = Get-ChildItem ("${driveLetter}:\sources") -Filter "install.*" | Select-Object -First 1
dism /Get-WimInfo /WimFile:$wim.FullName

Dismount-DiskImage -ImagePath $sourceIso
