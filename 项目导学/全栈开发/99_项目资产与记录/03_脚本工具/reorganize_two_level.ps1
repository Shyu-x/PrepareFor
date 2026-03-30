$ErrorActionPreference='Stop'
$root='D:\Develeping\PrepareFor\项目导学\全栈开发'

$structure = [ordered]@{
  '01_学习路线总览' = @('01_路线图与阶段规划','02_学习方法与导航说明')
  '02_前端基础' = @('01_HTML_CSS','02_JavaScript_WebAPI','03_浏览器与网络')
  '03_前端进阶' = @('01_前端工程化与架构','02_CSS引擎与渲染机制','03_前端性能与调试优化')
  '04_React与TypeScript' = @('01_React核心','02_React进阶与Hooks','03_TypeScript实践')
  '05_Nodejs与后端基础' = @('01_Nodejs核心与模块','02_后端框架与服务开发','03_异步并发与性能调优')
  '06_后端工程与基础设施' = @('01_数据库与数据建模','02_API设计与认证鉴权','03_部署运维与云原生')
  '07_全栈框架与架构实战' = @('01_SSR与全栈框架','02_架构设计与工程实践','03_实战项目案例')
  '08_计算机基础与高性能' = @('01_数据结构与算法','02_操作系统与高性能后端','03_Web安全与稳定性')
  '09_AI与前沿技术' = @('01_AI基础设施与Agent','02_前沿技术专题')
  '10_面试与职业发展' = @('01_大厂面试核心','02_学习复盘与阶段总结')
  '99_项目管理与资源' = @('01_文档更新与过程记录','02_目录规划与迁移方案','03_脚本工具','04_清单索引与输出')
}

foreach($l1 in $structure.Keys){
  $l1Path = Join-Path $root $l1
  New-Item -ItemType Directory -Path $l1Path -Force | Out-Null
  foreach($l2 in $structure[$l1]){
    New-Item -ItemType Directory -Path (Join-Path $l1Path $l2) -Force | Out-Null
  }
}

function Get-UniquePath([string]$path){
  if(-not (Test-Path -LiteralPath $path)){ return $path }
  $dir=[System.IO.Path]::GetDirectoryName($path)
  $name=[System.IO.Path]::GetFileNameWithoutExtension($path)
  $ext=[System.IO.Path]::GetExtension($path)
  $i=1
  do {
    $candidate = Join-Path $dir ("{0}_{1}{2}" -f $name,$i,$ext)
    $i++
  } while(Test-Path -LiteralPath $candidate)
  return $candidate
}

function Pick-Destination([string]$relPath,[string]$fileName,[string]$ext){
  $ctx = ($relPath + ' ' + $fileName).ToLower()

  if($ext -in @('.bat','.cmd','.ps1','.psm1','.js','.ts','.py','.sh')){ return '99_项目管理与资源/03_脚本工具' }
  if($ext -in @('.json','.txt','.log','.csv','.yaml','.yml','.xml')){ return '99_项目管理与资源/04_清单索引与输出' }

  if($ctx -match '更新|更新日志|完成报告|总结|复盘|claude|gemini|qwen'){ return '99_项目管理与资源/01_文档更新与过程记录' }
  if($ctx -match '目录结构|树形结构|迁移脚本|迁移|规划|readme_outline|readme|outline'){ return '99_项目管理与资源/02_目录规划与迁移方案' }

  if($ctx -match '学习路线|全局指南|技术选型|业务逻辑学习法|路线图|导航'){ return '01_学习路线总览/01_路线图与阶段规划' }
  if($ctx -match '指南|说明'){ return '01_学习路线总览/02_学习方法与导航说明' }

  if($ctx -match '面试'){ return '10_面试与职业发展/01_大厂面试核心' }
  if($ctx -match '实战项目|补充实战|架构师实战|项目'){ return '07_全栈框架与架构实战/03_实战项目案例' }

  if($ctx -match 'ai|agent|模型|前沿技术|webgpu'){ return '09_AI与前沿技术/01_AI基础设施与Agent' }

  if($ctx -match '数据结构|算法'){ return '08_计算机基础与高性能/01_数据结构与算法' }
  if($ctx -match '操作系统|高性能后端|linux'){ return '08_计算机基础与高性能/02_操作系统与高性能后端' }
  if($ctx -match '安全'){ return '08_计算机基础与高性能/03_Web安全与稳定性' }

  if($ctx -match '数据库'){ return '06_后端工程与基础设施/01_数据库与数据建模' }
  if($ctx -match 'api|认证|鉴权'){ return '06_后端工程与基础设施/02_API设计与认证鉴权' }
  if($ctx -match '部署|运维|容器|云原生'){ return '06_后端工程与基础设施/03_部署运维与云原生' }

  if($ctx -match 'node|express|koa|nestjs|后端框架'){ return '05_Nodejs与后端基础/02_后端框架与服务开发' }
  if($ctx -match 'libuv|并发|线程池|性能优化|调试|异步'){ return '05_Nodejs与后端基础/03_异步并发与性能调优' }
  if($ctx -match '核心模块|node\.js基础|node\.js核心'){ return '05_Nodejs与后端基础/01_Nodejs核心与模块' }

  if($ctx -match 'typescript'){ return '04_React与TypeScript/03_TypeScript实践' }
  if($ctx -match 'hooks'){ return '04_React与TypeScript/02_React进阶与Hooks' }
  if($ctx -match 'react'){ return '04_React与TypeScript/01_React核心' }

  if($ctx -match '前端工程化|六层架构|工程化'){ return '03_前端进阶/01_前端工程化与架构' }
  if($ctx -match 'css引擎|渲染管线|样式架构|animation-timeline'){ return '03_前端进阶/02_CSS引擎与渲染机制' }
  if($ctx -match '性能|调试|优化'){ return '03_前端进阶/03_前端性能与调试优化' }

  if($ctx -match 'html|css'){ return '02_前端基础/01_HTML_CSS' }
  if($ctx -match 'javascript|web_api|dom|事件|异步'){ return '02_前端基础/02_JavaScript_WebAPI' }
  if($ctx -match '浏览器|http|https|http3|quic|v8'){ return '02_前端基础/03_浏览器与网络' }

  if($ctx -match '服务端渲染|ssr|全栈框架'){ return '07_全栈框架与架构实战/01_SSR与全栈框架' }
  if($ctx -match '架构'){ return '07_全栈框架与架构实战/02_架构设计与工程实践' }

  return '10_面试与职业发展/02_学习复盘与阶段总结'
}

$targetTop = $structure.Keys
$files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
  $relDir = $_.DirectoryName.Substring($root.Length).TrimStart('\\')
  if([string]::IsNullOrEmpty($relDir)){ return $true }
  $parts = $relDir -split '\\'
  if($parts.Count -ge 1 -and ($targetTop -contains $parts[0])){
    if($parts.Count -le 2){ return $false }
  }
  return $true
}

$moved=0
foreach($f in $files){
  $rel = $f.FullName.Substring($root.Length).TrimStart('\\')
  $destRel = Pick-Destination $rel $f.BaseName $f.Extension.ToLower()
  $destDir = Join-Path $root ($destRel -replace '/', '\\')
  $destPath = Get-UniquePath (Join-Path $destDir $f.Name)
  Move-Item -LiteralPath $f.FullName -Destination $destPath -Force
  $moved++
}

$deepDirs = Get-ChildItem -LiteralPath $root -Recurse -Directory | Where-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\\')
  if([string]::IsNullOrEmpty($rel)){ return $false }
  (($rel -split '\\').Count) -gt 2
} | Sort-Object { $_.FullName.Length } -Descending

foreach($d in $deepDirs){
  if(Test-Path -LiteralPath $d.FullName){
    Remove-Item -LiteralPath $d.FullName -Recurse -Force
  }
}

$remainDeep = (Get-ChildItem -LiteralPath $root -Recurse -Directory | Where-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\\')
  if([string]::IsNullOrEmpty($rel)){ return $false }
  (($rel -split '\\').Count) -gt 2
} | Measure-Object).Count

$outside = (Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\\')
  ($rel -split '\\').Count -lt 3
} | Measure-Object).Count

"MovedFiles=$moved"
"DeepFoldersRemaining=$remainDeep"
"FilesNotInSecondLevelOrBelow=$outside"
Get-ChildItem -LiteralPath $root -Directory | Select-Object Name | Sort-Object Name | Format-Table -AutoSize | Out-String