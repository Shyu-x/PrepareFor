# Linux与Node.js运维实战

## 一、Linux常用命令详解

### 1.1 文件与目录操作

在Node.js运维中，熟练掌握Linux文件操作命令是基础。以下是高频使用的命令及其在运维场景中的应用。

```bash
# 查看文件详情（Node.js项目分析常用）
ls -la                    # 列出所有文件包括隐藏文件
ls -lh                    # 人性化显示文件大小
ls -lt                    # 按修改时间排序
ls -l --time-style=full-iso  # 显示完整时间戳

# 目录导航（快速定位项目文件）
cd /var/log               # 进入日志目录
cd ~                      # 返回用户主目录
cd -                      # 返回上一个访问的目录
pwd                       # 显示当前工作目录

# 文件查找（定位Node.js项目文件）
find /home -name "*.js" -type f          # 查找所有JS文件
find . -name "node_modules" -type d       # 查找依赖目录
find . -name "package.json"               # 查找项目配置文件
find . -size +100M                         # 查找大于100M的文件
```

### 1.2 文本处理三剑客

**grep命令** - 文本搜索利器

```bash
# 基础搜索
grep "error" /var/log/app.log           # 在日志中搜索错误
grep -r "TODO" ./src                    # 递归搜索源码中的TODO
grep -n "function" server.js            # 显示行号

# 高阶用法
grep -E "error|warning|fatal" app.log   # 匹配多个关键词
grep -v "debug" app.log                 # 反向匹配，排除debug
grep -c "Error" app.log                # 统计匹配行数
grep -A 5 "Error" app.log              # 显示匹配行及后续5行
grep -B 2 "Error" app.log              # 显示匹配行及前2行

# 与Node.js结合
cat app.log | grep "Error" | grep -v "TypeError"  # 管道组合过滤
```

**sed命令** - 流编辑器

```bash
# 基础替换
sed 's/old/new/g' file.txt              # 全局替换
sed -i 's/old/new/g' file.txt           # 直接修改文件

# 高级用法
sed -n '10,20p' app.log                 # 提取第10-20行
sed '/pattern/d' file.txt                # 删除匹配行
sed '1,5d' file.txt                     # 删除第1-5行

# Node.js日志处理实例
sed -n '/2024-01-01/,/2024-01-02/p' app.log  # 提取日期范围内的日志
sed 's/\r$//' windows.txt > unix.txt    # 转换Windows换行符为Unix
```

**awk命令** - 强大的文本分析工具

```bash
# 基础用法
awk '{print $1}' file.txt               # 打印第一列
awk '{print $1, $3}' file.txt           # 打印第1和第3列
awk -F: '{print $1}' /etc/passwd         # 指定分隔符

# 条件筛选
awk '/error/ {print $0}' app.log         # 打印包含error的行
awk '$3 > 100' data.txt                 # 打印第3列大于100的行
awk 'NR==5' file.txt                    # 打印第5行

# 统计分析（Node.js性能分析常用）
awk '{sum+=$1; count++} END {print sum/count}' data.txt  # 计算平均值
awk '{arr[$1]++} END {for(k in arr) print k, arr[k]}'   # 统计频次

# 日志分析实战
awk '{print $4}' access.log | sort | uniq -c | sort -rn  # 统计IP访问量
awk -F'"' '{print $2}' access.log | awk '{print $2}'     # 提取请求路径
```

### 1.3 进程与系统监控

```bash
# 进程查看
ps aux | grep node                      # 查看Node.js进程
ps -ef | grep "node server.js"          # 查看特定进程
top -p $(pgrep -d',' -f node)          # 监控Node.js进程资源

# 实时监控（Node.js服务监控）
watch -n 1 'ps aux | grep node'        # 每秒刷新进程状态

# 进程管理
kill -9 <pid>                          # 强制终止进程
pkill -f "node server.js"              # 按名称终止进程
kill -HUP <pid>                         # 平滑重启进程（Node.js常用）
```

## 二、Node.js进程管理

### 2.1 进程管理核心模块

```javascript
// process-manager.js - Node.js进程管理核心

// 获取当前进程信息
const processInfo = {
  pid: process.pid,                     // 进程ID
  cwd: process.cwd(),                  // 当前工作目录
  platform: process.platform,           // 操作系统平台
  arch: process.arch,                 // CPU架构
  memory: process.memoryUsage(),       // 内存使用情况
  cpu: process.cpuUsage(),            // CPU使用情况
  uptime: process.uptime(),           // 运行时间
  versions: process.versions,         // Node.js版本信息
};

// 监听进程信号
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  // 清理资源、关闭数据库连接、保存状态
  server.close(() => {
    console.log('服务器已关闭，进程退出');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号（Ctrl+C），开始关闭...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 记录错误日志
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
```

### 2.2 父子进程通信

```javascript
// parent-process.js - 父进程管理

const { fork } = require('child_process');
const path = require('path');

// 启动子进程
const child = fork(path.join(__dirname, 'worker.js'));

// 发送消息给子进程
child.send({ type: 'TASK', data: { id: 1, name: 'task1' } });

// 接收子进程消息
child.on('message', (msg) => {
  console.log('收到子进程消息:', msg);
  if (msg.type === 'RESULT') {
    // 处理子进程返回的结果
    console.log('任务完成:', msg.data);
  }
});

// 监听子进程退出
child.on('exit', (code, signal) => {
  console.log(`子进程退出，退出码: ${code}, 信号: ${signal}`);
  // 自动重启子进程
  if (code !== 0) {
    console.log('子进程异常退出，重新启动...');
    setTimeout(() => startWorker(), 1000);
  }
});

// 处理子进程错误
child.on('error', (err) => {
  console.error('子进程错误:', err);
});

// worker.js - 子进程实现
process.on('message', (msg) => {
  if (msg.type === 'TASK') {
    console.log('收到任务:', msg.data);
    // 执行任务
    const result = { id: msg.data.id, status: 'completed' };
    // 返回结果给父进程
    process.send({ type: 'RESULT', data: result });
  }
});

// 通知父进程已准备就绪
process.send({ type: 'READY' });
```

### 2.3 进程池管理

```javascript
// process-pool.js - 进程池实现

const { fork } = require('child_process');
const os = require('os');

// 计算合适的进程数
const CPU_COUNT = os.cpus().length;
const MIN_POOL_SIZE = 2;
const MAX_POOL_SIZE = CPU_COUNT;

class ProcessPool {
  constructor(workerPath, poolSize = MIN_POOL_SIZE) {
    this.workerPath = workerPath;
    this.poolSize = Math.min(poolSize, MAX_POOL_SIZE);
    this.workers = [];                  // 可用进程队列
    this.busyWorkers = new Set();       // 忙碌中的进程集合
    this.taskQueue = [];               // 任务队列
    this.stats = { total: 0, completed: 0, failed: 0 };

    this.init();
  }

  // 初始化进程池
  init() {
    console.log(`初始化进程池，大小: ${this.poolSize}`);
    for (let i = 0; i < this.poolSize; i++) {
      this.createWorker();
    }
  }

  // 创建新进程
  createWorker() {
    const worker = fork(this.workerPath);
    let currentTask = null;

    // 监听进程消息
    worker.on('message', (msg) => {
      if (msg.type === 'RESULT') {
        this.stats.completed++;
        this.taskComplete(worker, currentTask, null);
      } else if (msg.type === 'ERROR') {
        this.stats.failed++;
        this.taskComplete(worker, currentTask, msg.error);
      }
    });

    worker.on('exit', (code) => {
      console.log(`进程退出，退出码: ${code}`);
      this.workers = this.workers.filter(w => w !== worker);
      this.busyWorkers.delete(worker);
      // 自动补充进程
      setTimeout(() => this.createWorker(), 1000);
    });

    worker.on('error', (err) => {
      console.error('进程错误:', err);
    });

    this.workers.push(worker);
    return worker;
  }

  // 执行任务
  async executeTask(taskData) {
    return new Promise((resolve, reject) => {
      this.stats.total++;

      const task = { data: taskData, resolve, reject };

      if (this.workers.length > 0) {
        this.assignTask(task);
      } else {
        // 所有进程忙碌，加入队列
        this.taskQueue.push(task);
      }
    });
  }

  // 分配任务
  assignTask(task) {
    const worker = this.workers.shift();
    this.busyWorkers.add(worker);
    worker.currentTask = task;
    worker.send({ type: 'TASK', data: task.data });
  }

  // 任务完成
  taskComplete(worker, task, error) {
    this.busyWorkers.delete(worker);

    if (error) {
      task.reject(error);
    } else {
      task.resolve(worker.currentTask);
    }

    // 检查任务队列
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.assignTask(nextTask);
    } else {
      this.workers.push(worker);
    }
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      poolSize: this.poolSize,
      available: this.workers.length,
      busy: this.busyWorkers.size,
      queued: this.taskQueue.length,
    };
  }

  // 关闭进程池
  async close() {
    console.log('关闭进程池...');
    const closePromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.on('exit', resolve);
        worker.kill();
      });
    });
    await Promise.all(closePromises);
    console.log('进程池已关闭');
  }
}

module.exports = ProcessPool;
```

## 三、PM2高级用法

### 3.1 PM2配置文件

```javascript
// ecosystem.config.js - PM2配置文件

module.exports = {
  apps: [
    {
      name: 'api-server',              // 应用名称
      script: './src/server.js',       // 入口脚本
      instances: 'max',                // 启动实例数（max为CPU核心数）
      exec_mode: 'cluster',            // 集群模式
      watch: false,                   // 是否监听文件变化
      ignore_watch: [                  // 忽略监听的文件/目录
        'node_modules',
        'logs',
        '.git'
      ],
      max_memory_restart: '1G',       // 内存超过1G时自动重启
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_file: './logs/app.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      // 高级配置
      instances: 4,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      autorestart: true,
      restart_delay: 4000,
      // 钩子脚本
      post_update: ['npm install'],
      pre_stop: './scripts/cleanup.js',
    },
    {
      name: 'worker-service',
      script: './workers/index.js',
      instances: 2,
      exec_mode: 'fork',              // 进程模式（非集群）
      cron_restart: '0 3 * * *',     // 每天凌晨3点重启
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### 3.2 PM2常用命令与脚本

```bash
#!/bin/bash
# pm2-management.sh - PM2管理脚本

# 启动应用
pm2 start ecosystem.config.js

# 启动特定应用
pm2 start api-server

# 查看状态
pm2 list                              # 列表形式
pm2 jlist                             # JSON格式（程序化使用）
pm2 prettylist                        # 美化列表

# 监控
pm2 monit                            # 实时监控面板
pm2 monitor                          # 远程监控

# 日志管理
pm2 logs api-server                  # 查看实时日志
pm2 logs api-server --lines 100     # 查看最近100行
pm2 logs api-server --err           # 只看错误日志
pm2 flush                            # 清空所有日志

# 重启管理
pm2 restart api-server               # 重启
pm2 reload api-server               # 优雅重载（零停机）
pm2 stop api-server                 # 停止
pm2 delete api-server               # 删除

# 集群管理
pm2 scale api-server 8              # 扩展到8个实例
pm2 scale api-server +3             # 增加3个实例

# 开机自启
pm2 startup                          # 生成启动脚本
pm2 save                             # 保存当前进程列表

# 配置管理
pm2 set app:key value                # 设置配置项
pm2 conf app-name key                # 读取配置

# 进程信息
pm2 show api-server                  # 详细信息
pm2 info api-server                  # 完整信息

# 模块管理
pm2 install pm2-logrotate           # 安装日志轮转模块
pm2 install pm2-server-monit        # 安装服务器监控模块
```

### 3.3 PM2集群模式下的Node.js应用

```javascript
// cluster-server.js - 支持PM2集群模式的服务端

const numCPUs = require('os').cpus().length;

// 方式一：原生cluster模块
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 遍历CPU核心创建工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 监听进程退出事件
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    // 替换退出进程
    cluster.fork();
  });
} else {
  // 工作进程运行HTTP服务器
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from ${process.pid}`);
  }).listen(8000);

  console.log(`工作进程 ${process.pid} 已启动`);
}

// 方式二：使用PM2优雅关闭
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    console.log('收到关闭信号，开始优雅关闭...');
    // 清理操作
    closeDatabase()
      .then(() => {
        console.log('资源已清理');
        process.exit(0);
      })
      .catch((err) => {
        console.error('清理失败:', err);
        process.exit(1);
      });
  }
});

// 方式三：健康检查接口
const healthCheck = () => {
  return {
    status: 'healthy',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  };
};
```

## 四、日志管理

### 4.1 Node.js日志系统实现

```javascript
// logger.js - 企业级日志系统

const fs = require('fs');
const path = require('path');

// 日志级别枚举
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.logDir = options.logDir || './logs';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 7;
    this.format = options.format || 'json';

    this.ensureLogDir();
  }

  // 确保日志目录存在
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 获取当前日期文件名
  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `app-${date}.log`);
  }

  // 格式化日志消息
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevel[level],
      pid: process.pid,
      message,
      ...meta,
    };

    if (this.format === 'json') {
      return JSON.stringify(logEntry);
    }
    return `[${timestamp}] [${level}] [PID:${process.pid}] ${message}`;
  }

  // 写入日志文件
  writeLog(message) {
    const fileName = this.getLogFileName();

    // 异步追加写入
    fs.appendFile(fileName, message + '\n', (err) => {
      if (err) {
        console.error('写入日志失败:', err);
      }
    });

    // 日志轮转检查
    this.checkRotation();
  }

  // 日志轮转
  checkRotation() {
    const fileName = this.getLogFileName();

    fs.stat(fileName, (err, stats) => {
      if (err || !stats) return;

      if (stats.size > this.maxFileSize) {
        const archiveName = fileName.replace('.log',
          `-${Date.now()}.log`);
        fs.renameSync(fileName, archiveName);
        this.cleanOldLogs();
      }
    });
  }

  // 清理旧日志
  cleanOldLogs() {
    const files = fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.log'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(this.logDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // 删除超出保留数量的日志
    files.slice(this.maxFiles).forEach(f => {
      fs.unlinkSync(path.join(this.logDir, f.name));
    });
  }

  // 记录不同级别的日志
  debug(message, meta) {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.debug(formatted);
      this.writeLog(formatted);
    }
  }

  info(message, meta) {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, meta);
      console.info(formatted);
      this.writeLog(formatted);
    }
  }

  warn(message, meta) {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, meta);
      console.warn(formatted);
      this.writeLog(formatted);
    }
  }

  error(message, meta) {
    if (this.level <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, meta);
      console.error(formatted);
      this.writeLog(formatted);
    }
  }

  fatal(message, meta) {
    if (this.level <= LogLevel.FATAL) {
      const formatted = this.formatMessage('FATAL', message, meta);
      console.error(formatted);
      this.writeLog(formatted);
    }
  }
}

// 创建日志实例
const logger = new Logger({
  level: process.env.LOG_LEVEL || LogLevel.INFO,
  logDir: '/var/log/myapp',
  format: 'json',
});

module.exports = logger;
```

### 4.2 日志分析命令

```bash
#!/bin/bash
# log-analysis.sh - 日志分析脚本

LOG_FILE="/var/log/myapp/app-$(date +%Y-%m-%d).log"

# 统计错误数量
echo "=== 错误统计 ==="
grep "ERROR" $LOG_FILE | wc -l

# 统计各类错误
echo "=== 错误分类 ==="
grep "ERROR" $LOG_FILE | \
  awk -F'"error":"' '{print $2}' | \
  awk -F'"' '{print $1}' | \
  sort | uniq -c | sort -rn

# 统计每秒请求量
echo "=== 请求量统计 ==="
awk '{print $1}' $LOG_FILE | \
  cut -d'T' -f2 | \
  cut -d'.' -f1 | \
  sort | uniq -c | \
  sort -k2

# 分析慢请求
echo "=== 慢请求分析 (>1秒) ==="
grep "request" $LOG_FILE | \
  awk -F'duration":' '{print $2}' | \
  awk -F',' '{if($1 > 1000) print $1}' | \
  sort -n | tail -10

# 统计API响应时间
echo "=== API响应时间统计 ==="
grep "\"type\":\"api\"" $LOG_FILE | \
  awk -F'"duration":' '{print $2}' | \
  awk -F',' '{sum+=$1; count++; if($1>max) max=$1} END {
    print "平均:", sum/count "ms"
    print "最大:", max "ms"
    print "总数:", count
  }'

# 提取错误堆栈
echo "=== 错误堆栈 ==="
grep -A 10 "ERROR" $LOG_FILE | head -50

# 实时监控错误
echo "=== 实时错误监控 (Ctrl+C 退出) ==="
tail -f $LOG_FILE | grep --line-buffered "ERROR"
```

## 五、性能监控

### 5.1 Node.js性能监控工具

```javascript
// monitor.js - 自定义性能监控

const os = require('os');

// 系统指标收集
class SystemMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.metrics = [];
    this.timer = null;
  }

  // 获取CPU使用率
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      usage: ((1 - totalIdle / totalTick) * 100).toFixed(2),
    };
  }

  // 获取内存使用情况
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const processMem = process.memoryUsage();

    return {
      system: {
        total: this.formatBytes(total),
        used: this.formatBytes(used),
        free: this.formatBytes(free),
        usagePercent: ((used / total) * 100).toFixed(2),
      },
      process: {
        rss: this.formatBytes(processMem.rss),
        heapTotal: this.formatBytes(processMem.heapTotal),
        heapUsed: this.formatBytes(processMem.heapUsed),
        external: this.formatBytes(processMem.external),
        usagePercent: ((processMem.heapUsed / processMem.heapTotal) * 100).toFixed(2),
      },
    };
  }

  // 获取进程信息
  getProcessInfo() {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      versions: process.versions,
      cpuUsage: process.cpuUsage(),
    };
  }

  // 获取事件循环延迟
  getEventLoopLag() {
    const start = process.hrtime.bigint();

    setTimeout(() => {
      const end = process.hrtime.bigint();
      const lag = Number(end - start) / 1e6; // 转换为毫秒
      return lag;
    }, 0);

    return new Promise((resolve) => {
      setTimeout(() => {
        const lag = (process.hrtime.bigint() - start) / 1n / 1_000_000n;
        resolve(Number(lag));
      }, 0);
    });
  }

  // 格式化字节数
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }

  // 收集完整指标
  async collectMetrics() {
    const lag = await this.getEventLoopLag();

    return {
      timestamp: Date.now(),
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      process: this.getProcessInfo(),
      eventLoopLag: lag,
      platform: os.platform(),
      loadAvg: os.loadavg(),
    };
  }

  // 开始监控
  start() {
    console.log('开始系统监控...');
    this.timer = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.metrics.push(metrics);

      // 输出当前状态
      console.log(`[${new Date().toISOString()}]`);
      console.log(`  CPU使用率: ${metrics.cpu.usage}%`);
      console.log(`  内存使用: ${metrics.memory.system.usagePercent}%`);
      console.log(`  堆内存: ${metrics.memory.process.usagePercent}%`);
      console.log(`  事件循环延迟: ${metrics.eventLoopLag}ms`);
    }, this.interval);
  }

  // 停止监控
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('监控已停止');
    }
  }

  // 获取历史数据
  getHistory() {
    return this.metrics;
  }

  // 导出为Prometheus格式
  toPrometheusFormat() {
    let output = '';
    const latest = this.metrics[this.metrics.length - 1];

    if (latest) {
      output += `# HELP node_cpu_usage Node.js CPU使用率\n`;
      output += `# TYPE node_cpu_usage gauge\n`;
      output += `node_cpu_usage ${latest.cpu.usage}\n`;

      output += `# HELP node_memory_usage 系统内存使用率\n`;
      output += `# TYPE node_memory_usage gauge\n`;
      output += `node_memory_usage ${latest.memory.system.usagePercent}\n`;

      output += `# HELP node_heap_usage 堆内存使用率\n`;
      output += `# TYPE node_heap_usage gauge\n`;
      output += `node_heap_usage ${latest.memory.process.usagePercent}\n`;
    }

    return output;
  }
}

const monitor = new SystemMonitor(5000);
monitor.start();

// 优雅关闭时停止监控
process.on('SIGTERM', () => {
  monitor.stop();
  console.log('监控数据:', monitor.getHistory());
  process.exit(0);
});

module.exports = SystemMonitor;
```

### 5.2 Linux系统监控命令

```bash
#!/bin/bash
# system-monitor.sh - Linux系统监控脚本

echo "=================================="
echo "       Linux 系统监控报告"
echo "       $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================="

echo ""
echo "=== 系统信息 ==="
uname -a
cat /etc/os-release | grep PRETTY_NAME

echo ""
echo "=== 系统负载 ==="
uptime
cat /proc/loadavg

echo ""
echo "=== CPU信息 ==="
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket|MHz"

echo ""
echo "=== 内存使用 ==="
free -h
echo ""
cat /proc/meminfo | head -5

echo ""
echo "=== 磁盘使用 ==="
df -h | grep -E "Filesystem|/dev/"

echo ""
echo "=== Node.js进程 ==="
ps aux | grep -E "node|npm" | grep -v grep

echo ""
echo "=== 网络连接 ==="
netstat -tuln | grep -E "LISTEN|ESTABLISHED" | head -10

echo ""
echo "=== Top 10 CPU进程 ==="
ps aux --sort=-%cpu | head -11

echo ""
echo "=== Top 10 内存进程 ==="
ps aux --sort=-%mem | head -11

echo ""
echo "=== 服务端口占用 ==="
ss -tuln | awk '{print $1, $5}' | column -t

echo ""
echo "=================================="
echo "          监控报告结束"
echo "=================================="
```

## 六、综合实战案例

### 6.1 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh - Node.js应用自动化部署脚本

set -e  # 遇到错误立即退出

# 配置变量
APP_NAME="myapp"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/deploy.log"
NODE_ENV="production"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

success() {
  log "${GREEN}✓ $1${NC}"
}

error() {
  log "${RED}✗ $1${NC}"
}

warning() {
  log "${YELLOW}⚠ $1${NC}"
}

# 部署前检查
pre_deploy_check() {
  log "执行部署前检查..."

  # 检查root权限
  if [ "$EUID" -ne 0 ]; then
    error "需要root权限运行此脚本"
    exit 1
  fi

  # 检查Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js未安装"
    exit 1
  fi

  # 检查PM2
  if ! command -v pm2 &> /dev/null; then
    warning "PM2未安装，正在安装..."
    npm install -g pm2
  fi

  # 检查应用目录
  if [ ! -d "$APP_DIR" ]; then
    mkdir -p $APP_DIR
  fi

  success "部署前检查完成"
}

# 备份当前版本
backup() {
  log "备份当前版本..."

  if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    BACKUP_NAME="${APP_NAME}-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

    mkdir -p $BACKUP_DIR
    cp -r $APP_DIR $BACKUP_PATH

    success "备份已保存: ${BACKUP_PATH}"

    # 清理超过7天的备份
    find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
  fi
}

# 拉取最新代码
pull_code() {
  log "拉取最新代码..."

  cd $APP_DIR

  if [ -d ".git" ]; then
    git fetch origin
    git pull origin main
    success "代码已更新"
  else
    error "不是Git仓库"
    exit 1
  fi
}

# 安装依赖
install_dependencies() {
  log "安装依赖..."

  cd $APP_DIR
  npm ci --production

  success "依赖安装完成"
}

# 运行测试
run_tests() {
  log "运行测试..."

  cd $APP_DIR

  if npm test; then
    success "测试通过"
  else
    error "测试失败，部署中止"
    exit 1
  fi
}

# 启动应用
start_app() {
  log "启动应用..."

  cd $APP_DIR

  # 检查是否已有实例在运行
  if pm2 list | grep -q $APP_NAME; then
    log "停止旧实例..."
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
  fi

  # 启动新实例
  pm2 start ecosystem.config.js --env $NODE_ENV
  pm2 save

  success "应用已启动"
}

# 验证部署
verify_deploy() {
  log "验证部署..."

  sleep 2

  # 检查进程状态
  if pm2 list | grep -q "online"; then
    success "应用运行正常"
  else
    error "应用启动失败"
    pm2 logs $APP_NAME --lines 50
    exit 1
  fi

  # 健康检查
  PORT=$(pm2 show $APP_NAME | grep "listen" | awk '{print $4}')
  if curl -sf http://localhost:${PORT}/health; then
    success "健康检查通过"
  else
    warning "健康检查失败，请手动检查"
  fi
}

# 主流程
main() {
  log "=================================="
  log "     开始部署 ${APP_NAME}"
  log "=================================="

  pre_deploy_check
  backup
  pull_code
  install_dependencies
  run_tests
  start_app
  verify_deploy

  log "=================================="
  log "     部署完成"
  log "=================================="
}

main "$@"
```

## 总结

本教程涵盖了Linux与Node.js运维的核心技能：

| 技能类别 | 核心命令/工具 | 应用场景 |
|----------|-------------|---------|
| 文件操作 | ls, find, chmod | 项目文件管理 |
| 文本处理 | grep, sed, awk | 日志分析 |
| 进程管理 | kill, pkill, signals | 服务控制 |
| Node.js进程 | process模块, cluster | 多进程管理 |
| PM2 | 进程管理, 日志, 集群 | 生产环境运维 |
| 日志系统 | 自定义Logger, 日志轮转 | 日志管理 |
| 性能监控 | 指标收集, Prometheus | 系统监控 |

掌握这些技能，可以有效管理和维护Node.js生产环境。
