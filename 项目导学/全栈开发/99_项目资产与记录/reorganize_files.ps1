# 文件重新归类脚本
$baseDir = "D:\Develeping\PrepareFor\项目导学\全栈开发"

# 定义新的目录结构
$newStructure = @{
    "01_学习路线与方法\01_学习路线图" = @(
        "2026全栈架构趋势与技术选型指南",
        "React19_Svelte5_Vue3.5响应式与全栈架构深度对比"
    )
    
    "02_前端基础\01_HTML与语义化" = @(
        "01_HTML5核心知识",
        "1-1_语义化标签"
    )
    
    "02_前端基础\02_CSS与布局" = @(
        "02_CSS3核心知识",
        "2-1_CSS选择器与布局",
        "CSS3高级布局实战",
        "CSS布局完全指南",
        "CSS盒模型与现代布局底层解析",
        "CSS现代布局与架构指南_2026",
        "CSS滚动驱动动画与animation-timeline实战指南_2026",
        "CSS引擎百年史_Houdini与底层渲染钩子",
        "CSS架构深度解析_Tailwind原理与原子化CSS"
    )
    
    "02_前端基础\03_JavaScript核心" = @(
        "03_JavaScript核心知识",
        "3-1_JavaScript核心基础",
        "JavaScript核心深入指南",
        "JavaScript核心知识点深度解析",
        "JavaScript核心知识点综合指南",
        "JavaScript核心知识点文档说明",
        "JavaScript现代标准与2026核心提案深度解析",
        "JavaScript数据类型与内存模型底层解构",
        "事件委托与this绑定机制深度解析"
    )
    
    "02_前端基础\04_WebAPI与DOM" = @(
        "04_Web_API",
        "现代Web_API完全指南",
        "现代Web_API完全指南_2026",
        "DOM事件流与React合成事件底层机制"
    )
    
    "02_前端基础\05_异步编程" = @(
        "JavaScript异步编程与事件循环机制",
        "JavaScript异步编程完全指南",
        "JavaScript事件循环与异步执行深度解析",
        "异步编程极客题_微任务嵌套与Generator协程机制"
    )
    
    "02_前端基础\06_浏览器原理" = @(
        "浏览器原理深度解析_从URL到页面渲染",
        "浏览器渲染原理详解",
        "浏览器渲染管线深度全解_从构建DOM到合成线程",
        "2026浏览器渲染管线与WebGPU加速",
        "2026浏览器渲染新特性_ViewTransitions与动画编排",
        "浏览器工作原理深入指南",
        "渲染性能优化"
    )
    
    "03_前端工程化\01_构建工具" = @(
        "6-1_构建工具",
        "构建工具完全指南",
        "构建工具与工程化技术指南",
        "前端构建工具演进史_Babel到Rolldown性能革命",
        "现代构建工具原理对比_Webpack与Vite底层解密",
        "Vite与Rspack底层原理深度解析",
        "Webpack与Vite中AST抽象语法树底层应用",
        "现代构建工具底层原理与选型指南",
        "前端工程化工具对比"
    )
    
    "03_前端工程化\02_代码质量与测试" = @(
        "6-1_代码质量工具",
        "6-1_单元测试",
        "6-2_E2E测试",
        "Jest单元测试实战",
        "测试框架完全指南",
        "前端测试完全指南"
    )
    
    "03_前端工程化\03_工程化实践" = @(
        "02_Monorepo架构与pnpm_workspace实践",
        "大型项目组件管理与工程化质量验证",
        "前端工程化最佳实践",
        "前端工程化常见问题与解决方案",
        "工程化边界_循环依赖与CORS预检缓存底层",
        "Git版本控制完全指南"
    )
    
    "03_前端工程化\04_微前端" = @(
        "微前端架构完全指南",
        "微前端Module_Federation_2.0原理解析",
        "微前端架构与状态管理指南"
    )
    
    "04_React生态\01_React基础" = @(
        "4-1_React基础入门",
        "React19完全指南",
        "React19深度教程",
        "React与Next.js深度指南",
        "React深度教学完全手册"
    )
    
    "04_React生态\02_React_Hooks" = @(
        "4-2_React_Hooks深入",
        "React19_Hooks深入详解",
        "ReactHooks深入详解",
        "20个实用自定义Hook完整指南",
        "useState深度解析专业指南_2026",
        "useEffect深度解析专业指南_2026",
        "useRef深度解析专业指南_2026",
        "useContext深度解析专业指南_2026",
        "useMemo与useCallback深度解析专业指南_2026",
        "React_Hooks深度命题与设计哲学",
        "React_Hooks依赖比对与闭包陷阱深度剖析",
        "React_Hooks面试题与最佳实践_2026"
    )
    
    "04_React生态\03_React高级特性" = @(
        "4-3_React状态管理",
        "4-4_React高级特性",
        "React19_Fiber与Hooks底层机制",
        "React19_高级UI组件设计模式_Compound与Headless实战",
        "React_Compiler_AST级别源码转换深度揭秘",
        "React_Fiber底层架构与并发调度机制源码级解析",
        "React_Hook设计模式完全指南",
        "React19组件设计模式深度指南",
        "React19_现代化表单架构_Actions与useActionState深度实践",
        "React_16-19全史_架构演进与特性深度对比",
        "React19.2官方参考文档"
    )
    
    "04_React生态\04_React性能优化" = @(
        "React渲染性能优化",
        "React工程化与性能调优完全指南_2026",
        "React渲染陷阱_useEffect依赖与Context穿透",
        "React生命周期底层_useLayoutEffect与批处理机制"
    )
    
    "04_React生态\05_Next.js" = @(
        "Next.js16_App_Router完整教程",
        "Next.js16深度教程",
        "Nextjs16_DynamicIO与PPR全栈架构深度解析",
        "Nextjs16_AppRouter_路由与RSC全栈架构极客教程",
        "Next.js与React_Server_Components深度解析",
        "Next.js完整渲染模式指南",
        "Next.js_SSR原理与架构深度解析"
    )
    
    "04_React生态\06_状态管理" = @(
        "状态管理完全指南",
        "状态管理方案对比",
        "现代前端状态管理分层理论_从Zustand到Signals",
        "前端状态管理演进史_从Redux到TC39_Signals",
        "React19_Zustand_状态管理与中间件架构极客教程"
    )
    
    "05_TypeScript\01_TypeScript基础" = @(
        "5-1_TypeScript基础"
    )
    
    "05_TypeScript\02_TypeScript进阶" = @(
        "5-2_TypeScript进阶",
        "TypeScript5.x进阶指南",
        "TypeScript5.8_高级类型与编译器原理",
        "TypeScript完全指南"
    )
    
    "06_Node后端开发\01_Node核心" = @(
        "01_Node.js基础",
        "01_Node.js核心模块完全指南",
        "02_核心模块详解",
        "Node.js核心模块详解",
        "Nodejs深度教学完全手册",
        "Node.js底层架构与libuv事件循环深度解析",
        "05_libuv线程池与异步IO深度解析",
        "Nodejs_Stream流式计算与底层背压机制",
        "03_Node.js调试",
        "01_异常处理与日志系统"
    )
    
    "06_Node后端开发\02_后端框架" = @(
        "02_Express_Koa_NestJS框架完全指南",
        "01_Express深入",
        "02_Koa框架",
        "03_NestJS框架",
        "04_NestJS框架深入",
        "NestJS依赖注入与底层架构深度解析",
        "NestJS依赖注入与底层架构深度解析_2026",
        "后端框架对比"
    )
    
    "06_Node后端开发\03_数据库" = @(
        "01_MongoDB",
        "02_PostgreSQL",
        "03_数据库模块完全指南",
        "数据库技术指南",
        "数据库技术深度指南",
        "数据库设计完全指南",
        "数据库索引底层原理_PostgreSQL与MongoDB对比",
        "2026数据库全景图_分布式SQL与AI向量引擎",
        "Prisma架构演进与Rust查询引擎深度解析",
        "分布式一致性算法与多主冲突解决机制",
        "高性能存储底层_BTree物理对齐与LSMTree写入放大",
        "类型安全全栈开发指南",
        "03_Redis"
    )
    
    "06_Node后端开发\04_API设计" = @(
        "01_RESTful_API与认证授权",
        "02_RESTful_API设计最佳实践",
        "03_GraphQL_API设计指南",
        "04_API设计与认证模块完全指南",
        "API设计与RESTful完全指南",
        "RESTful API设计完全指南",
        "RESTful_API设计最佳实践"
    )
    
    "06_Node后端开发\05_认证授权" = @(
        "JWT认证实现详解",
        "04_OAuth2.0认证完全指南",
        "现代鉴权演进史_从Session到WebAuthn与OAuth2.1"
    )
    
    "07_部署运维\01_Docker容器化" = @(
        "Docker容器化部署",
        "Docker容器化与DevOps技术指南",
        "02_Docker容器化部署",
        "Docker底层隔离机制与K8s调度原理"
    )
    
    "07_部署运维\02_CI_CD" = @(
        "03_CI_CD持续集成部署",
        "03_GitHub_Actions与CI_CD自动化部署",
        "DevOps与CI-CD完全指南"
    )
    
    "07_部署运维\03_云原生" = @(
        "Kubernetes进阶_Pod调度与高可用架构",
        "云原生架构_服务网格与可观测性",
        "云原生自动化运维_Terraform哲学与GitHub安全审计"
    )
    
    "07_部署运维\04_监控与调试" = @(
        "后端调试与生产环境故障排查指南",
        "前端性能调优实战_火焰图与DevTools深度应用",
        "全栈系统级性能优化与监控体系",
        "前端性能监控体系",
        "前端性能监控_自研Web_Vitals采集SDK底层解析"
    )
    
    "08_计算机基础\01_数据结构与算法" = @(
        "01_基础数据结构与算法",
        "LeetCode高频题分类解析与解题模板",
        "V8引擎源码_TimSort算法深度解析",
        "大厂面试必考手写函数全量CheatSheet"
    )
    
    "08_计算机基础\02_操作系统" = @(
        "Linux异步IO演进史_epoll与io_uring深度解析",
        "Linux网络内核调度_Socket与epoll红黑树调优",
        "Nodejs多进程架构与IPC通信底层原理",
        "进程间通信与协程机制",
        "WebAssembly共享内存与多线程同步机制",
        "09_Linux与Node.js运维实战"
    )
    
    "08_计算机基础\03_网络协议" = @(
        "HTTP_HTTPS协议深入",
        "HTTP3_QUIC网络底层演进史",
        "WebSocket实时通信完全指南",
        "WebSocket心跳机制与自动重连完全指南",
        "微服务通信演进史_RESTful到gRPC原理解析",
        "网络性能优化",
        "网络性能优化实战"
    )
    
    "08_计算机基础\04_V8引擎" = @(
        "JavaScript内存模型与V8垃圾回收机制",
        "V8引擎底层揭秘_隐藏类_内联缓存与GC优化实战",
        "V8引擎JIT编译与去优化深度揭秘",
        "V8引擎数组底层_ElementsKinds状态转移解密",
        "JS核心陷阱_原型污染与this绑定边界解析"
    )
    
    "08_计算机基础\05_Web安全" = @(
        "Web安全完全指南",
        "04_前端安全防护完全指南",
        "现代Web前端安全防御体系",
        "现代后端与API安全防御体系",
        "CSP_Level3与TrustedTypes底层防线",
        "SSR安全与最佳实践"
    )
    
    "09_全栈架构\01_SSR与渲染" = @(
        "01_React_SSR水合技术深度解析",
        "React_SSR水合技术完全指南",
        "02_React渲染原理与优化深度解析",
        "02_React流式渲染底层实现深度解析",
        "SSR服务端渲染架构",
        "SSR_SEO与性能优化实战",
        "SSG静态站点生成与ISR",
        "React18服务端渲染新特性",
        "Web渲染架构百年史_从PHP到RSC与PPR",
        "React状态初始化与脱水技术"
    )
    
    "09_全栈架构\02_性能优化" = @(
        "7-1_性能优化",
        "性能优化完全指南",
        "性能优化实战",
        "性能测量工具详解",
        "Core Web Vitals指标详解",
        "白屏问题调试指南",
        "04_Node.js性能优化",
        "07_Node.js性能优化与并发处理",
        "全栈性能调优_堆快照原理与Nodejs原生内存排查",
        "Prisma与Next.js_Serverless架构高并发连接池调优",
        "2026性能架构专题_虚拟列表与大数据量渲染深度解析"
    )
    
    "09_全栈架构\03_架构设计" = @(
        "前端架构设计模式",
        "全栈架构设计完全指南",
        "全栈框架对比与选型指南",
        "领域驱动设计(DDD)与复杂业务逻辑架构",
        "08_Node.js企业级架构设计",
        "前端11层架构完整指南",
        "设计模式完全指南",
        "设计模式完全指南_2026深度版",
        "Vue3与React19虚拟DOM渲染引擎对比",
        "Vue3响应式陷阱_解构失效与调度器执行时机"
    )
    
    "09_全栈架构\04_实时协作" = @(
        "2026全栈架构_基于CRDT与WebSockets的实时协作模式",
        "边缘计算与实时协作技术指南",
        "实时通信与WebSocket完全指南"
    )
    
    "09_全栈架构\05_项目实战" = @(
        "01_Express电商系统实战项目",
        "02_Next.js博客系统实战项目",
        "03_NestJS任务管理系统实战项目",
        "2026大厂电商核心场景_秒杀架构与动态库存优化",
        "2026SaaS系统_高频数据实时监控与Signals细粒度更新",
        "2026高频AI金融交易终端架构全链路深度解析",
        "2026全栈架构_InfiniteScroll与大数据分片加载",
        "2026全栈架构_Signals响应式与原生Action系统深度解析"
    )
    
    "10_AI与前沿技术\01_Agent开发" = @(
        "01_Agent基础架构设计",
        "02_MCP协议深度解析",
        "04_Agent_Memory系统设计",
        "05_Multi-Agent协作机制",
        "06_Prompt_Engineering实战",
        "07_Claude_Code架构深度解析",
        "09_Agent面试题库与解析",
        "10_代码执行工具设计实战",
        "2026智能Agent交互架构_流式渲染与工具调用设计"
    )
    
    "10_AI与前沿技术\02_LLM应用" = @(
        "08_AI发展脉络_ML_DL_GenAI",
        "LLM推理架构与Agentic_Workflows深度解析",
        "AI辅助编程与智能开发工具指南",
        "前端端侧AI推理_WebGPU与WebNN底层架构"
    )
    
    "10_AI与前沿技术\03_前沿技术" = @(
        "3D图形与Web图形技术指南",
        "WebAssembly内存交互与底层机制",
        "PWA完全指南",
        "跨端开发技术栈_ReactNative底层架构深度解构",
        "移动应用开发完全指南",
        "向量数据库深度解析_Pinecone与Milvus实战",
        "2026现代Web图像优化指南_AVIF_JXL_FetchPriority"
    )
}

# 创建新目录结构
Write-Host "创建新目录结构..."
foreach ($dir in $newStructure.Keys) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "创建目录: $dir"
    }
}

# 移动文件
Write-Host "`n移动文件..."
$movedCount = 0
$notFoundCount = 0

foreach ($entry in $newStructure.GetEnumerator()) {
    $targetDir = Join-Path $baseDir $entry.Key
    
    foreach ($fileName in $entry.Value) {
        # 查找文件
        $foundFiles = Get-ChildItem -Path $baseDir -Recurse -File -Filter "$fileName.md" -ErrorAction SilentlyContinue
        
        if ($foundFiles) {
            foreach ($file in $foundFiles) {
                $targetPath = Join-Path $targetDir $file.Name
                
                # 如果目标文件已存在，跳过
                if (-not (Test-Path $targetPath)) {
                    Move-Item -Path $file.FullName -Destination $targetPath -Force
                    Write-Host "移动: $($file.Name) -> $($entry.Key)"
                    $movedCount++
                }
            }
        } else {
            Write-Host "未找到: $fileName.md"
            $notFoundCount++
        }
    }
}

Write-Host "`n完成! 移动了 $movedCount 个文件, 未找到 $notFoundCount 个文件"