# Search transcript for pricing, plans, or Nextcloud suggestions
$transcript = "C:\Users\sys1\.gemini\antigravity\brain\d9d245c5-09b4-43fd-969a-3cd07ed17eb5\.system_generated\logs\transcript.jsonl"

Get-Content $transcript | ForEach-Object {
    if ($_ -match "nextcloud|charge|pricing|sougandh|family|backup|plan|service") {
        try {
            $obj = $_ | ConvertFrom-Json
            if ($obj.content -and $obj.content.Length -gt 10) {
                Write-Host "--- STEP $($obj.step_index) [$($obj.type)] ---"
                Write-Host $obj.content.Substring(0, [math]::Min(300, $obj.content.Length))
                Write-Host ""
            }
        } catch {}
    }
}
