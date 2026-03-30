$files = Get-ChildItem -Path 'D:\Develeping\PrepareFor\项目导学\全栈开发' -Recurse -File -Filter '*_1.md'
$deletedCount = 0
$keptCount = 0

foreach ($f in $files) {
    $original = $f.FullName -replace '_1\.md$', '.md'
    if (Test-Path $original) {
        $origItem = Get-Item $original
        $size1 = $f.Length
        $size2 = $origItem.Length
        
        # Keep the larger file (more content)
        if ($size1 -gt $size2) {
            # _1.md is larger, keep it and rename
            $newName = $original
            Remove-Item $original -Force
            Rename-Item $f.FullName $newName
            Write-Host "Kept larger _1: $($f.Name)"
            $keptCount++
        } else {
            # Original is larger, delete _1.md
            Remove-Item $f.FullName -Force
            Write-Host "Deleted smaller _1: $($f.Name)"
            $deletedCount++
        }
    }
}

Write-Host "`nTotal: Deleted $deletedCount smaller _1 files, Kept $keptCount larger _1 files"