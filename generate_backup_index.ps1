$targetPaths = @(
    "K:\Guru mobile backup",
    "K:\Download (1)",
    "K:\YantraByte Solutions"
)

$fileList = [System.Collections.Generic.List[PSObject]]::new()

foreach ($path in $targetPaths) {
    if (Test-Path $path) {
        $items = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
            $_.FullName -notmatch "appdata|\.git|node_modules"
        }
        
        foreach ($item in $items) {
            $relPath = $item.FullName.Replace("K:\", "")
            $ext = $item.Extension.ToLower().TrimStart('.')
            $category = "Other"
            
            if ($item.FullName -match "WhatsApp Images|WhatsApp Video|WhatsApp Audio") {
                $category = "WhatsApp"
            } elseif ($item.FullName -match "Camera|DCIM") {
                $category = "Camera"
            } elseif ($item.FullName -match "Screenshots") {
                $category = "Screenshots"
            } elseif ($ext -in @("jpg", "jpeg", "png", "webp", "gif", "bmp", "heic")) {
                $category = "Photos"
            } elseif ($ext -in @("mp4", "mkv", "avi", "mov", "3gp")) {
                $category = "Videos"
            } elseif ($ext -in @("pdf", "pdf_", "doc", "docx", "xls", "xlsx", "txt", "csv", "ppt", "pptx")) {
                $category = "Documents"
            } elseif ($ext -in @("m4a", "mp3", "opus", "wav", "aac", "ogg")) {
                $category = "Audio"
            } elseif ($ext -eq "vcf") {
                $category = "Contacts"
            } elseif ($ext -in @("apk", "zip", "rar", "7z", "tar", "gz")) {
                $category = "Archives & Apps"
            }

            $fileList.Add([PSCustomObject]@{
                name = $item.Name
                path = $item.FullName.Replace("\", "/")
                winPath = $item.FullName
                relPath = $relPath
                category = $category
                ext = $ext
                size = $item.Length
                sizeFormatted = [math]::Round($item.Length / 1MB, 2).ToString() + " MB"
                date = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
                yearMonth = $item.LastWriteTime.ToString("yyyy-MM")
                folder = $item.Directory.Name
            })
        }
    }
}

$json = $fileList | ConvertTo-Json -Depth 3 -Compress
"window.BACKUP_DATA = " + $json + ";" | Set-Content -Path "K:\backup_data.js" -Encoding UTF8
Write-Output "Successfully indexed $($fileList.Count) files into K:\backup_data.js"
