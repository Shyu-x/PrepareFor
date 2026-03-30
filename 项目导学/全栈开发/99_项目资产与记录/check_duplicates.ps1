$files = Get-ChildItem -Path 'D:\Develeping\PrepareFor\项目导学\全栈开发' -Recurse -File -Filter '*_1.md'
$sameCount = 0
$diffCount = 0
$diffFiles = @()
foreach ($f in $files) {
    $original = $f.FullName -replace '_1\.md$', '.md'
    if (Test-Path $original) {
        $size1 = $f.Length
        $size2 = (Get-Item $original).Length
        if ($size1 -eq $size2) { 
            $sameCount++ 
        } else { 
            $diffCount++
            $diffFiles += "$($f.Name) ($size1 vs $size2)"
        }
    }
}
Write-Host "Same size: $sameCount, Different size: $diffCount"
Write-Host "`nDifferent files:"
$diffFiles | ForEach-Object { Write-Host $_ }