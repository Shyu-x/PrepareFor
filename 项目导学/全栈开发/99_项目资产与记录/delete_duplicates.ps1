$files = Get-ChildItem -Path 'D:\Develeping\PrepareFor\项目导学\全栈开发' -Recurse -File -Filter '*_1.md'
$deletedCount = 0
$keptCount = 0
foreach ($f in $files) {
    $original = $f.FullName -replace '_1\.md$', '.md'
    if (Test-Path $original) {
        $size1 = $f.Length
        $size2 = (Get-Item $original).Length
        if ($size1 -eq $size2) { 
            Remove-Item $f.FullName -Force
            $deletedCount++
        } else {
            $keptCount++
        }
    }
}

# Also delete _2.md and _3.md files
$files2 = Get-ChildItem -Path 'D:\Develeping\PrepareFor\项目导学\全栈开发' -Recurse -File -Filter '*_2.md'
$files3 = Get-ChildItem -Path 'D:\Develeping\PrepareFor\项目导学\全栈开发' -Recurse -File -Filter '*_3.md'

foreach ($f in $files2) {
    $original = $f.FullName -replace '_2\.md$', '.md'
    if (Test-Path $original) {
        $size1 = $f.Length
        $size2 = (Get-Item $original).Length
        if ($size1 -eq $size2) { 
            Remove-Item $f.FullName -Force
            $deletedCount++
        }
    }
}

foreach ($f in $files3) {
    $original = $f.FullName -replace '_3\.md$', '.md'
    if (Test-Path $original) {
        $size1 = $f.Length
        $size2 = (Get-Item $original).Length
        if ($size1 -eq $size2) { 
            Remove-Item $f.FullName -Force
            $deletedCount++
        }
    }
}

Write-Host "Deleted: $deletedCount files"
Write-Host "Kept (different size): $keptCount files"