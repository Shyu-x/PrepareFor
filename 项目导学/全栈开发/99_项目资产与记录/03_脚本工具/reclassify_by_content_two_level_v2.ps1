$ErrorActionPreference = 'Stop'
$root = 'D:\Develeping\PrepareFor\项目导学\全栈开发'

function Get-UniquePath([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return $path }
  $dir = [System.IO.Path]::GetDirectoryName($path)
  $name = [System.IO.Path]::GetFileNameWithoutExtension($path)
  $ext = [System.IO.Path]::GetExtension($path)
  $i = 1
  do {
    $candidate = Join-Path $dir ("{0}_{1}{2}" -f $name, $i, $ext)
    $i++
  } while (Test-Path -LiteralPath $candidate)
  return $candidate
}

function Get-TextSafe([string]$fullPath, [string]$ext) {
  if ($ext -notin @('.md','.txt','.json','.js','.ts','.ps1','.bat','.cmd','.yml','.yaml','.xml','.log')) { return '' }
  try {
    $raw = Get-Content -LiteralPath $fullPath -Raw -ErrorAction Stop
    if ($null -eq $raw) { return '' }
    if ($raw.Length -gt 15000) { return $raw.Substring(0, 15000) }
    return $raw
  } catch { return '' }
}

function Score-ByKeywords([string]$text, [string[]]$keywords) {
  $score = 0
  foreach ($k in $keywords) {
    if ($text -match [Regex]::Escape($k)) { $score++ }
  }
  return $score
}

$topicRules = @(
  @{ dest='01_学习路线与方法\01_学习路线图'; keys=@('学习路线','路线图','阶段','里程碑','技术选型','全栈') },
  @{ dest='01_学习路线与方法\02_学习方法与指南'; keys=@('学习方法','导学','学习建议','学习指南','知识体系') },

  @{ dest='02_前端基础与浏览器\01_HTML_CSS_JavaScript'; keys=@('html','css','javascript','盒模型','布局','选择器') },
  @{ dest='02_前端基础与浏览器\02_WebAPI_DOM_异步'; keys=@('web api','dom','事件','异步','promise','事件循环') },
  @{ dest='02_前端基础与浏览器\03_浏览器_网络_V8'; keys=@('浏览器','渲染管线','http','https','http3','quic','v8','jit','gc') },

  @{ dest='03_前端工程化与框架\01_前端工程化'; keys=@('工程化','构建','打包','模块化','monorepo','前端架构') },
  @{ dest='03_前端工程化与框架\02_React与Hooks'; keys=@('react','hooks','jsx','fiber','合成事件') },
  @{ dest='03_前端工程化与框架\03_TypeScript与架构'; keys=@('typescript','类型系统','泛型','tsconfig') },

  @{ dest='04_Node与后端开发\01_Node核心与模块'; keys=@('node.js','核心模块','fs','path','stream','buffer','event emitter') },
  @{ dest='04_Node与后端开发\02_后端框架与服务'; keys=@('express','koa','nestjs','后端框架','服务端') },
  @{ dest='04_Node与后端开发\03_并发_性能_调试'; keys=@('libuv','线程池','并发','性能优化','调试') },

  @{ dest='05_后端基础设施\01_数据库'; keys=@('数据库','mysql','postgresql','mongodb','索引','事务') },
  @{ dest='05_后端基础设施\02_API设计与认证'; keys=@('api','rest','graphql','认证','鉴权','jwt','oauth') },
  @{ dest='05_后端基础设施\03_部署运维与云原生'; keys=@('部署','运维','docker','kubernetes','云原生','linux') },

  @{ dest='06_全栈架构与项目实战\01_SSR与全栈框架'; keys=@('ssr','服务端渲染','next.js','nuxt','全栈框架') },
  @{ dest='06_全栈架构与项目实战\02_架构设计实践'; keys=@('架构设计','系统设计','分层','可扩展','企业级') },
  @{ dest='06_全栈架构与项目实战\03_实战项目'; keys=@('实战项目','项目案例','业务场景','项目实战') },

  @{ dest='07_计算机基础_安全_性能\01_数据结构与算法'; keys=@('数据结构','算法','复杂度','排序','图','树') },
  @{ dest='07_计算机基础_安全_性能\02_操作系统与高性能'; keys=@('操作系统','进程','线程','内存','高性能后端') },
  @{ dest='07_计算机基础_安全_性能\03_Web安全与性能优化'; keys=@('web安全','xss','csrf','sql注入','性能','缓存','压测') },

  @{ dest='08_AI与前沿技术\01_AI基础设施与Agent'; keys=@('ai','agent','模型','推理','向量','rag') },
  @{ dest='08_AI与前沿技术\02_前沿专题'; keys=@('前沿技术','webgpu','新特性','趋势') },

  @{ dest='09_面试与成长\01_面试核心'; keys=@('面试','八股','高频题','手撕') },
  @{ dest='09_面试与成长\02_复盘与总结'; keys=@('复盘','学习总结','阶段总结','成长') }
)

function Pick-Destination([string]$name, [string]$rel, [string]$ext, [string]$content) {
  $ctx = ($name + ' ' + $rel + ' ' + $content).ToLowerInvariant()

  if ($ext -in @('.ps1','.bat','.cmd','.sh','.py','.js','.ts')) { return '99_项目资产与记录\03_脚本工具' }
  if ($ext -in @('.json','.txt','.log','.csv','.xml','.yml','.yaml')) { return '99_项目资产与记录\04_清单与索引' }

  # 先做主题匹配
  $bestDest = ''
  $bestScore = 0
  foreach ($r in $topicRules) {
    $s = Score-ByKeywords -text $ctx -keywords $r.keys
    if ($s -gt $bestScore) {
      $bestScore = $s
      $bestDest = $r.dest
    }
  }
  if ($bestScore -gt 0) { return $bestDest }

  # 仅在无法命中主题时归档到项目管理
  if ($ctx -match '(^|\\)(claude|gemini|qwen)\.md$') { return '99_项目资产与记录\01_更新记录' }
  if ($ctx -match '更新日志|文档更新|完成报告|迁移记录|执行记录') { return '99_项目资产与记录\01_更新记录' }
  if ($ctx -match 'readme|outline|目录|树形|迁移|规划') { return '99_项目资产与记录\02_目录规划与迁移' }

  return '99_项目资产与记录\01_更新记录'
}

$files = Get-ChildItem -LiteralPath $root -Recurse -File
$moved = 0
$skipped = 0

foreach ($f in $files) {
  if ($f.FullName -eq $PSCommandPath) { continue }

  $rel = $f.FullName.Substring($root.Length).TrimStart('\\')
  $ext = $f.Extension.ToLowerInvariant()
  $content = Get-TextSafe -fullPath $f.FullName -ext $ext
  $destRel = Pick-Destination -name $f.BaseName -rel $rel -ext $ext -content $content
  $destDir = Join-Path $root $destRel
  New-Item -ItemType Directory -Path $destDir -Force | Out-Null

  if ($f.DirectoryName -eq $destDir) { $skipped++; continue }

  $destPath = Get-UniquePath (Join-Path $destDir $f.Name)
  Move-Item -LiteralPath $f.FullName -Destination $destPath -Force
  $moved++
}

# 清理空目录
$removed = 0
Get-ChildItem -LiteralPath $root -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
  if (Test-Path -LiteralPath $_.FullName) {
    if ((Get-ChildItem -LiteralPath $_.FullName -Force | Measure-Object).Count -eq 0) {
      Remove-Item -LiteralPath $_.FullName -Force
      $removed++
    }
  }
}

$maxDepth = 0
Get-ChildItem -LiteralPath $root -Recurse -Directory | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\\')
  if (-not [string]::IsNullOrWhiteSpace($rel)) {
    $d = ($rel -split '\\').Count
    if ($d -gt $maxDepth) { $maxDepth = $d }
  }
}

"MovedFiles=$moved"
"SkippedFiles=$skipped"
"RemovedEmptyFolders=$removed"
"MaxFolderDepth=$maxDepth"