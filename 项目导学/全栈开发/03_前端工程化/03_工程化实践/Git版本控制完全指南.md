# Git版本控制完全指南

## 目录

1. [Git基础概念](#1-git基础概念)
2. [Git安装与配置](#2-git安装与配置)
3. [Git基础操作](#3-git基础操作)
4. [Git分支管理](#4-git分支管理)
5. [Git远程仓库](#5-git远程仓库)
6. [Git常用技巧](#6-git常用技巧)
7. [Git工作流](#7-git工作流)

---

## 1. Git基础概念

### 1.1 什么是Git

Git是一个分布式版本控制系统，用于跟踪文件变化和协调多人协作开发。与SVN等集中式版本控制不同，Git每个开发者都有完整的代码历史副本。

```
集中式 vs 分布式版本控制：

集中式（SVN）：
┌─────────────┐
│   服务器   │──────┐
│  (代码库）   │      │
└─────────────┘      ├──────►
    ▲             │  开发者1
    │             ├──────►
    │             │  开发者2
    │             └──────►
    └──────────────┘  开发者3

分布式（Git）：
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   开发者1   │    │   开发者2   │    │   开发者3   │
│  (完整仓库） │    │  (完整仓库） │    │  (完整仓库） │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                  ▲                  ▲
       └──────────────────┴──────────────────┘
              推送/拉取
```

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| **工作区（Working Directory）** | 当前修改的文件 |
| **暂存区（Staging Area）** | 准备提交的文件 |
| **本地仓库（Local Repository）** | 已提交的历史记录 |
| **远程仓库（Remote Repository）** | 托管的服务器仓库 |
| **提交（Commit）** | 代码快照，带唯一ID |
| **分支（Branch）** | 独立的开发线 |
| **HEAD** | 指向当前分支的最新提交 |

### 1.3 Git三个状态

```
文件状态流转：
     ┌──────┐
     │新建  │
     └──┬──┘
        │ git add
        ▼
     ┌──────┐
     │暂存  │
     └──┬──┘
        │ git commit
        ▼
     ┌──────┐
     │已提交│
     └──────┘
```

| 状态 | 说明 | 命令显示 |
|------|------|----------|
| **未跟踪（Untracked）** | 新文件，Git未管理 | 红色 |
| **已修改（Modified）** | 已跟踪但被修改 | 绿色M |
| **已暂存（Staged）** | 准备提交 | 绿色A |
| **已提交（Committed）** | 已存入仓库 | - |

---

## 2. Git安装与配置

### 2.1 安装Git

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git

# macOS
brew install git

# Windows
# 下载：https://git-scm.com/download/win

# 验证安装
git --version
```

### 2.2 初始化配置

```bash
# 配置用户名和邮箱（全局）
git config --global user.name "张三"
git config --global user.email "zhangsan@example.com"

# 查看配置
git config --list

# 配置编辑器
git config --global core.editor "code --wait"
git config --global core.editor "vim"

# 配置默认分支名（main）
git config --global init.defaultBranch main

# 配置颜色输出
git config --global color.ui true

# 配置自动换行
git config --global core.autocrlf true
```

### 2.3 .gitignore文件

```bash
# 创建忽略文件
touch .gitignore

# 常见忽略规则
node_modules/              # 忽略目录
dist/                    # 构建输出
*.log                    # 忽略所有log文件
.DS_Store                # macOS文件
.vscode/                 # VS Code配置
.env                     # 环境变量
*.swp                    # Vim临时文件
*.swo
package-lock.json         # 锁文件（可选）

# 示例规则
*.log                    # 忽略所有.log文件
logs/                   # 忽略logs目录
!important.log           # 例外：保留这个文件
build/                  # 忽略build目录
temp/                   # 忽略临时文件
*.[oa]*                  # 忽略Office临时文件
```

### 2.4 初始化仓库

```bash
# 初始化新仓库
git init

# 克隆远程仓库
git clone https://github.com/user/repo.git

# 克隆指定分支
git clone -b develop https://github.com/user/repo.git

# 克隆到指定目录
git clone https://github.com/user/repo.git mydir
```

---

## 3. Git基础操作

### 3.1 文件操作

```bash
# 查看状态
git status

# 添加文件到暂存区
git add file.txt
git add .                  # 添加所有文件
git add *.js              # 添加所有js文件
git add directory/          # 添加目录

# 从暂存区移除
git restore --staged file.txt  # Git 2.37+
git reset HEAD file.txt        # 旧版本

# 取消工作区修改
git restore file.txt        # Git 2.37+
git checkout -- file.txt     # 旧版本

# 删除文件
git rm file.txt            # 删除并暂存
git rm --cached file.txt    # 只从Git删除，保留文件

# 重命名
git mv old.txt new.txt

# 比较文件
git diff                  # 工作区vs暂存区
git diff --staged          # 暂存区vs仓库
git diff HEAD~1            # 当前vs上一次提交
```

### 3.2 提交操作

```bash
# 提交暂存区
git commit message "修复登录bug"

# 提交所有已修改文件（跳过暂存）
git commit -am "修复登录bug"

# 撤销上一次提交，保留修改
git commit --amend -m "完善登录功能"

# 修正上一次提交信息
git commit --amend -m "正确的提交信息"

# 修改最后一次提交（未推送）
git commit --amend

# 查看提交历史
git log
git log --oneline          # 一行显示
git log --graph --oneline   # 图形化显示
git log -5                # 最近5次提交
git log --author="张三"    # 某作者的提交
git log --since="1 week ago"  # 一周内的提交
```

### 3.3 查看历史

```bash
# 提交详情
git show                  # 当前提交
git show HEAD~1           # 上一次提交
git show 123abc            # 指定提交

# 查看文件历史
git log --follow file.txt

# 查看文件某次提交的内容
git show 123abc:file.txt

# 查看修改的人
git blame file.txt

# 搜索提交历史
git log --grep="bug"
git log --grep="修复" --oneline
```

### 3.4 撤销操作

```bash
# 撤销修改（软撤销）
git reset                  # 回到上次提交，保留修改
git reset --hard           # 回到上次提交，丢弃修改
git reset HEAD~1           # 回到上一次提交

# 撤销指定提交
git reset 123abc
git reset --hard 123abc

# 撤销文件修改
git restore file.txt

# 恢复删除的文件
git restore file.txt

# 查看被删除的文件
git log --diff-filter=D --summary
```

---

## 4. Git分支管理

### 4.1 分支基础

```bash
# 创建分支
git branch feature-login
git checkout -b feature-login    # 创建并切换

# 切换分支
git checkout main
git switch main                # Git 2.23+

# 列出所有分支
git branch
git branch -r                # 远程分支

# 删除分支
git branch -d feature-login
git branch -D feature-login    # 强制删除

# 重命名分支
git branch -m old-name new-name

# 查看分支图
git log --graph --oneline --decorate --all
```

### 4.2 分支合并

```bash
# 合并分支
git merge feature-login

# 合并时如果冲突
<<<<<<< HEAD
当前分支内容
=======
要合并的分支内容
>>>>>>> feature-login

# 解决冲突后
git add .
git commit

# 终止合并
git merge --abort

# 变基合并（推荐）
git rebase main

# 交互式变基
git rebase -i HEAD~3

# 终止变基
git rebase --abort

# 继续变基
git rebase --continue
```

### 4.3 储藏（Stash）

```bash
# 储存当前工作
git stash

# 储存并添加消息
git stash save "临时工作"

# 列出储藏
git stash list

# 应用储藏
git stash apply
git stash pop               # 应用并删除

# 应用指定储藏
git stash apply stash@{0}

# 删除储藏
git stash drop
git stash clear            # 删除所有
```

---

## 5. Git远程仓库

### 5.1 连接远程仓库

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin https://github.com/user/repo.git

# 删除远程仓库
git remote remove origin

# 重命名远程仓库
git remote rename origin upstream

# 查看远程仓库详情
git remote show origin
```

### 5.2 推送与拉取

```bash
# 推送当前分支
git push origin main

# 推送所有分支
git push --all

# 推送并设置上游分支
git push -u origin main

# 首次推送
git push origin --tags

# 删除远程分支
git push origin --delete feature-login

# 拉取远程更新
git pull origin main

# 拉取但不合并
git fetch origin

# 拉取指定分支
git fetch origin feature-login

# 更新远程跟踪分支
git pull --rebase origin main
```

### 5.3 标签管理

```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签
git tag -a v1.0.0 -m "版本1.0.0"

# 查看标签
git tag

# 推送标签
git push origin --tags

# 删除标签
git tag -d v1.0.0
git push origin --delete v1.0.0
```

---

## 6. Git常用技巧

### 6.1 搜索历史

```bash
# 按提交信息搜索
git log --oneline --grep="bug"

# 按作者搜索
git log --author="张三"

# 按时间搜索
git log --since="2024-01-01" --until="2024-12-31"

# 按文件搜索
git log --all -- full-history -- file.txt

# 搜索提交内容
git log -S"function_name"
```

### 6.2 比较差异

```bash
# 比较两个分支
git diff main develop

# 比较指定提交
git diff 123abc 456def

# 统计修改行数
git diff --stat
git diff --shortstat

# 查看某次提交修改的文件
git show --name-only 123abc
```

### 6.3 查找变更

```bash
# 查找引入bug的提交
git bisect start
git bisect bad
git bisect good 123abc
git bisect run              # 自动二分查找

# 重置bisect
git bisect reset

# 查找引入bug的文件
git blame file.txt
```

### 6.4 清理操作

```bash
# 清理未跟踪文件
git clean

# 清理未跟踪和忽略的文件
git clean -fdx

# 清理已删除的文件引用
git prune

# 清理远程已删除的分支
git fetch --prune
git remote prune origin

# 垃圾回收
git gc
```

### 6.5 撤销推送

```bash
# 撤销最后一次推送（需使用force）
git reset --hard HEAD~1
git push -f origin main

# 撤销多次提交
git reset --hard HEAD~3
git push -f origin main

# 更安全的强制推送
git push origin main --force-with-lease
```

---

## 7. Git工作流

### 7.1 Git Flow工作流

```
Git Flow分支模型：
┌─────────────────────────────────────────────────────┐
│           main (生产环境）                      │
│              │                                 │
│              ▼                                  │
│      ┌───────────────┐                           │
│      │ develop (开发线）│                           │
│      └───────────────┘                           │
│        │    │    │                              │
│        ▼    ▼    ▼                              │
│  ┌───────┐┌──────┐┌───────┐                │
│  │feature││hotfix ││release │                │
│  │分支   ││分支   ││分支    │                │
│  └───────┘└──────┘└───────┘                │
└─────────────────────────────────────────────────────┘
```

| 分支类型 | 用途 | 命名约定 |
|----------|------|----------|
| **main** | 生产环境 | main/master |
| **develop** | 开发线 | develop |
| **feature** | 新功能开发 | feature/功能名 |
| **hotfix** | 紧急bug修复 | hotfix/问题描述 |
| **release** | 发布准备 | release/x.y.z |
| **bugfix** | 普通bug修复 | bugfix/问题描述 |

### 7.2 功能分支工作流

```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-login

# 2. 开发功能
# ... 进行代码修改 ...
git add .
git commit -m "添加用户登录功能"

# 3. 合并回develop
git checkout develop
git pull origin develop
git merge feature/user-login

# 4. 推送
git push origin develop

# 5. 删除功能分支
git branch -d feature/user-login
```

### 7.3 热修复工作流

```bash
# 1. 从main创建hotfix分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-123

# 2. 修复bug
# ... 修复代码 ...
git add .
git commit -m "修复严重bug #123"

# 3. 合并回main
git checkout main
git merge hotfix/critical-bug-123

# 4. 打标签
git tag -a v1.0.1 -m "热修复版本1.0.1"

# 5. 推送
git push origin main
git push origin --tags

# 6. 同步到develop
git checkout develop
git merge main
git push origin develop

# 7. 删除hotfix分支
git branch -d hotfix/critical-bug-123
```

### 7.4 最佳实践

```bash
# 1. 频前拉取最新代码
git pull origin main

# 2. 提交前先暂存检查
git status

# 3. 写清晰的提交信息
git commit -m "类型: 简短描述

# 详细说明，每行不超过80字符内
"

# 提交信息类型：
# feat: 新功能
# fix: 修复bug
# docs: 文档更新
# style: 代码格式
# refactor: 重构
# perf: 性能优化
# test: 测试相关
# chore: 构建/其他

# 4. 提交前检查
git diff --cached

# 5. 定期同步远程
git fetch --all --prune

# 6. 使用.gitignore
# 忽略不必要的文件

# 7. 小步提交
# 每个逻辑单元一个提交

# 8. 不要提交已生成的文件
# 如：node_modules、dist、.env
```

---

## Git快捷命令别名

```bash
# 常用别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph"
git config --global alias.unstage "reset HEAD"
git config --global alias.last "log -1"
git config --global alias.changes "diff --name-only"

# 使用
git co main              # git checkout main
git br                  # git branch
git ci "添加功能"        # git commit -m "添加功能"
```

---

## 参考资源

- [Git官方文档](https://git-scm.com/docs/)
- [Pro Git](https://git-scm.com/book/zh/v2/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub学习指南](https://docs.github.com/zh/get-started/quickstart/)

---

*本文档持续更新，最后更新于2026年3月*
