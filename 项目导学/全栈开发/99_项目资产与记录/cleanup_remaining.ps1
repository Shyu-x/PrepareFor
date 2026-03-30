$baseDir = "D:\Develeping\PrepareFor\项目导学\全栈开发"

# 创建必要的目录
$dirs = @(
    "99_项目资产与记录\01_更新日志",
    "99_项目资产与记录\02_规划文档"
)

foreach ($dir in $dirs) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "创建目录: $dir"
    }
}

# 移动剩余文件
$movedCount = 0

# 02_前端基础与浏览器 剩余文件
$files02 = @(
    @("01_学习路线概览.md", "01_学习路线与方法\01_学习路线图"),
    @("CSS3现代布局与架构指南_2026.md", "02_前端基础\02_CSS与布局"),
    @("Next.js16_SSR原理与架构深度解析.md", "04_React生态\05_Next.js"),
    @("React+Node全栈学习路线.md", "01_学习路线与方法\01_学习路线图"),
    @("06_Node.js并发模式与Go并发对比.md", "06_Node后端开发\01_Node核心"),
    @("10_并发编程模式深度解析.md", "06_Node后端开发\01_Node核心"),
    @("11_Python_asyncio与Node.js异步对比.md", "06_Node后端开发\01_Node核心"),
    @("MDN_Web文档整合总结.md", "02_前端基础\04_WebAPI与DOM"),
    @("Next.js16与React_Server_Components深度解析.md", "04_React生态\05_Next.js"),
    @("Node.js后端开发完全指南.md", "06_Node后端开发\01_Node核心"),
    @("Web前端核心技术完全指南.md", "02_前端基础\03_JavaScript核心"),
    @("01_前端工程化常见问题与解决方案.md", "03_前端工程化\03_工程化实践"),
    @("03_2026全栈学习路线_树形结构版.md", "01_学习路线与方法\01_学习路线图"),
    @("03_Code_Sandbox安全执行.md", "08_计算机基础\05_Web安全"),
    @("2026年3月16日React_Hooks深度解析文档更新完成报告.md", "99_项目资产与记录\01_更新日志"),
    @("2026年3月16日文档更新完成报告.md", "99_项目资产与记录\01_更新日志"),
    @("2026年3月16日文档更新总结.md", "99_项目资产与记录\01_更新日志"),
    @("更新日志.md", "99_项目资产与记录\01_更新日志"),
    @("React19_专题文档更新日志.md", "99_项目资产与记录\01_更新日志"),
    @("02_全新树形结构规划.md", "99_项目资产与记录\02_规划文档"),
    @("单层文件夹树形结构规划.md", "99_项目资产与记录\02_规划文档"),
    @("QWEN.md", "99_项目资产与记录"),
    @("GEMINI.md", "99_项目资产与记录")
)

# 03_前端工程化与框架 剩余文件
$files03 = @(
    @("6-1_构建工具.md", "03_前端工程化\01_构建工具"),
    @("构建工具与工程化技术指南.md", "03_前端工程化\01_构建工具"),
    @("2026年3月16日React深度解析文档更新完成报告.md", "99_项目资产与记录\01_更新日志"),
    @("4-4_React高级特性.md", "04_React生态\03_React高级特性"),
    @("React面试题八股文与最佳实践_2026.md", "04_React生态\03_React高级特性")
)

# 04_Node与后端开发 剩余文件
$files04 = @(
    @("generate-outline-output.md", "99_项目资产与记录\02_规划文档"),
    @("Nodejs原生权限模型与安全策略深度解析.md", "06_Node后端开发\01_Node核心"),
    @("outline_20260314.md", "99_项目资产与记录\02_规划文档"),
    @("outline_20260316.md", "99_项目资产与记录\02_规划文档"),
    @("README_OUTLINE.md", "99_项目资产与记录\02_规划文档"),
    @("边缘计算与实时协作技术指南.md", "09_全栈架构\04_实时协作"),
    @("CLAUDE.md", "99_项目资产与记录"),
    @("全栈框架原理深度解析整合总结.md", "09_全栈架构\03_架构设计"),
    @("全栈框架教学内容整合总结.md", "09_全栈架构\03_架构设计")
)

# 05_后端基础设施 剩余文件
$files05 = @(
    @("04_新目录结构规划.md", "99_项目资产与记录\02_规划文档"),
    @("文件夹迁移脚本.md", "99_项目资产与记录\03_脚本工具"),
    @("新目录结构说明.md", "99_项目资产与记录\02_规划文档"),
    @("简化版树形结构规划.md", "99_项目资产与记录\02_规划文档")
)

# 07_计算机基础_安全_性能 剩余文件
$files07 = @(
    @("NestJS依赖注入与底层架构深度解析.md", "06_Node后端开发\02_后端框架"),
    @("AI辅助编程与智能开发工具指南.md", "10_AI与前沿技术\02_LLM应用"),
    @("React19_Server_Components与Server_Actions深度指南.md", "04_React生态\03_React高级特性"),
    @("面试最后3小时极限冲刺宝典.md", "08_计算机基础\01_数据结构与算法")
)

# 08_AI与前沿技术 剩余文件
$files08 = @(
    @("3D图形与Web图形技术指南.md", "10_AI与前沿技术\03_前沿技术"),
    @("业务逻辑学习法与2026热门业务场景深度解析.md", "01_学习路线与方法\01_学习路线图")
)

$allFiles = $files02 + $files03 + $files04 + $files05 + $files07 + $files08

foreach ($item in $allFiles) {
    $fileName = $item[0]
    $targetDir = $item[1]
    
    # 查找文件
    $foundFiles = Get-ChildItem -Path $baseDir -Recurse -File -Filter $fileName -ErrorAction SilentlyContinue
    
    if ($foundFiles) {
        foreach ($file in $foundFiles) {
            $targetPath = Join-Path (Join-Path $baseDir $targetDir) $file.Name
            
            # 检查目标是否已存在同名文件
            if (Test-Path $targetPath) {
                # 如果目标文件已存在，检查大小
                $existingSize = (Get-Item $targetPath).Length
                $newSize = $file.Length
                if ($newSize -gt $existingSize) {
                    Remove-Item $targetPath -Force
                    Move-Item -Path $file.FullName -Destination $targetPath -Force
                    Write-Host "替换: $fileName -> $targetDir"
                } else {
                    Remove-Item $file.FullName -Force
                    Write-Host "删除重复: $fileName"
                }
            } else {
                Move-Item -Path $file.FullName -Destination $targetPath -Force
                Write-Host "移动: $fileName -> $targetDir"
            }
            $movedCount++
        }
    }
}

Write-Host "`n完成! 处理了 $movedCount 个文件"