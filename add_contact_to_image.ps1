Add-Type -AssemblyName System.Drawing

$sourcePath = "d:\Antigravity\yantrabyte-bolt\YantraByte_Gowri_Ganesh_WhatsApp_Status_9x16.jpg"
$destPath   = "d:\Antigravity\yantrabyte-bolt\YantraByte_Gowri_Ganesh_WhatsApp_Official.jpg"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 244, 228))
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45, 25, 10))
$headerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(155, 80, 15))

# Fill inner area of left and right golden frames
$g.FillRectangle($bgBrush, 48, 960, 105, 95)
$g.FillRectangle($bgBrush, 615, 960, 105, 95)

$fontHeader = New-Object System.Drawing.Font("Arial", [float]7.5, [System.Drawing.FontStyle]::Bold)
$fontBody   = New-Object System.Drawing.Font("Arial", [float]6.5, [System.Drawing.FontStyle]::Bold)
$fontPhone  = New-Object System.Drawing.Font("Arial", [float]8.5, [System.Drawing.FontStyle]::Bold)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Left Box: EMAIL
$rectLeftHeader = New-Object System.Drawing.RectangleF(48, 968, 105, 16)
$g.DrawString("EMAIL ID", $fontHeader, $headerBrush, $rectLeftHeader, $sf)

$rectLeftEmail1 = New-Object System.Drawing.RectangleF(48, 995, 105, 16)
$g.DrawString("yantrabyte.", $fontBody, $textBrush, $rectLeftEmail1, $sf)

$rectLeftEmail2 = New-Object System.Drawing.RectangleF(48, 1014, 105, 16)
$g.DrawString("solutions@gmail.com", $fontBody, $textBrush, $rectLeftEmail2, $sf)

# Right Box: CALL / WHATSAPP
$rectRightHeader = New-Object System.Drawing.RectangleF(615, 975, 105, 18)
$g.DrawString("CALL / WHATSAPP", $fontHeader, $headerBrush, $rectRightHeader, $sf)

$rectRightPhone = New-Object System.Drawing.RectangleF(615, 1010, 105, 20)
$g.DrawString("+91 99867 42525", $fontPhone, $textBrush, $rectRightPhone, $sf)

$g.Dispose()
$img.Dispose()

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()

Write-Host "SUCCESS: Saved to $destPath"
