# Git版本控制完全指南

## 目录

1. [Git基础](#1-git基础)
   - [1.1 Git核心概念](#11-git核心概念)
   - [1.2 基本命令](#12-基本命令)
   - [1.3 分支操作](#13-分支操作)
   - [1.4 查看历史](#14-查看历史)
   - [1.5 撤销修改](#15-撤销修改)

2. [Git深入](#2-git深入)
   - [2.1 深入理解HEAD指针](#21-深入理解head指针)
   - [2.2 引用：branch、tag、remote](#22-引用branchtagremote)
   - [2.3 .git目录结构解析](#23-git目录结构解析)
   - [2.4 Git对象模型](#24-git对象模型)
   - [2.5 合并策略](#25-合并策略)
   - [2.6 冲突解决](#26-冲突解决)

3. [高级操作](#3-高级操作)
   - [3.1 Rebase变基操作](#31-rebase变基操作)
   - [3.2 Cherry-pick挑选提交](#32-cherry-pick挑选提交)
   - [3.3 Stash暂存工作区](#33-stash暂存工作区)
   - [3.4 Bisect二分查找](#34-bisect二分查找)
   - [3.5 Reflog恢复误删提交](#35-reflog恢复误删提交)
   - [3.6 Submodule与Subtree](#36-submodule与subtree)

4. [Git Flow工作流](#4-git-flow工作流)
   - [4.1 分支模型](#41-分支模型)
   - [4.2 完整Git Flow流程演示](#42-完整git-flow流程演示)
   - [4.3 GitHub Flow](#43-github-flow)
   - [4.4 trunk-based-development](#44-trunk-based-development)

5. [GitHub/GitLab](#5-githubgitlab)
   - [5.1 Pull RequestMerge Request流程](#51-pull-requestmerge-request流程)
   - [5.2 Code Review最佳实践](#52-code-review最佳实践)
   - [5.3 Issues与项目管理](#53-issues与项目管理)
   - [5.4 GitHub Actions自动化](#54-github-actions自动化)
   - [5.5 Protected Branch保护分支](#55-protected-branch保护分支)

6. [团队协作](#6-团队协作)
   - [6.1 代码评审制度](#61-代码评审制度)
   - [6.2 Commit Message规范](#62-commit-message规范)
   - [6.3 Git Hooks](#63-git-hooks)
   - [6.4 分支命名规范](#64-分支命名规范)
   - [6.5 团队Git流程设计](#65-团队git流程设计)

7. [实战练习](#7-实战练习)
   - [7.1 从零搭建Git工作流](#71-从零搭建git工作流)
   - [7.2 配置Git Hooks自动化检查](#72-配置git-hooks自动化检查)
   - [7.3 团队协作冲突解决案例](#73-团队协作冲突解决案例)
   - [7.4 Git命令速查表](#74-git命令速查表)

---

## 1. Git基础

### 1.1 Git核心概念

#### 1.1.1 四个工作区域

Git的核心设计基于四个主要工作区域，理解这四个区域是掌握Git的基础：

```
┌─────────────────────────────────────────────────────────────────┐
│                        远程仓库 (Remote Repository)              │
│                   GitHub / GitLab / 私有服务器                   │
└─────────────────────────────────────────────────────────────────┘
                                ▲ push / pull
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       本地仓库 (Local Repository)                │
│                     .git 目录 - 完整的项目历史                    │
└─────────────────────────────────────────────────────────────────┘
                                ▲ add
                                │
┌─────────────────────────────────────────────────────────────────┐
│                         暂存区 (Staging Area / Index)            │
│                   .git/index - 即将提交的文件快照                 │
└─────────────────────────────────────────────────────────────────┘
                                ▲ add
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        工作区 (Working Directory / Working Tree) │
│                      项目根目录下的实际文件                       │
└─────────────────────────────────────────────────────────────────┘
```

**工作区（Working Directory）**
- 工作区是项目根目录下的实际文件系统
- 在这个区域内，开发者可以自由地创建、修改、删除文件
- 工作区的文件可能是：
  - 已跟踪文件（Tracked）：已被纳入Git版本控制的文件
  - 未跟踪文件（Untracked）：新建的、尚未被Git管理的文件
- 工作区的状态会随着开发者的操作不断变化
- 使用`git status`可以查看工作区的当前状态

**暂存区（Staging Area / Index）**
- 暂存区是Git最重要的概念之一，它位于`.git/index`文件中
- 这是一个临时的存储区域，用于准备下一次提交的内容
- 开发者使用`git add`命令将工作区的修改添加到暂存区
- 暂存区记录了所有即将被提交的文件快照
- 可以在提交之前多次添加、修改暂存区的内容
- 暂存区允许你精确控制哪些修改会被包含在下一步提交中

**本地仓库（Local Repository）**
- 本地仓库位于项目根目录的`.git`文件夹中
- 它包含了项目的完整历史记录，包括：
  - 所有提交的快照
  - 每个提交的元数据（作者、日期、提交信息）
  - 所有分支的指针
  - HEAD指针的当前位置
- 本地仓库中的提交是本地的，不影响远程仓库
- 可以多次提交，只有在push时才会同步到远程

**远程仓库（Remote Repository）**
- 远程仓库是托管在服务器上的Git仓库
- 常见的远程仓库服务包括：
  - GitHub：全球最大的开源代码托管平台
  - GitLab：提供自托管选项的完整DevOps平台
  - Gitee：国内的代码托管服务
  - Bitbucket：Atlassian旗下的代码托管服务
- 远程仓库作为团队成员之间共享代码的中央节点
- 一个项目可以配置多个远程仓库（例如：origin、upstream）

#### 1.1.2 文件状态周期

Git中的每个文件都处于以下三种状态之一：

```
┌─────────────┐    git add     ┌─────────────┐   git commit   ┌─────────────┐
│  Untracked  │ ─────────────> │   Staged    │ ─────────────> │  Committed  │
│  (未跟踪)   │                │  (已暂存)   │                │  (已提交)   │
└─────────────┘                └─────────────┘                └─────────────┘
       ^                              │                              │
       │                              │ git reset HEAD               │
       │         git commit ──────────┘                              │
       │                                                              │
       │              git checkout -- / git restore                   │
       └──────────────────────────────────────────────────────────────┘
                                  (已修改 Modified)
```

**未跟踪（Untracked）**
- 文件存在但没有被Git管理
- 没有出现在上一个提交快照中
- 是新创建的文件或者从外部引入的文件
- Git不会包含在版本历史中

**已跟踪（Tracked）**
- 已被Git管理的文件，包括三种子状态：

  **已修改（Modified）**
  - 文件已被修改但尚未暂存
  - 工作区的文件与本地仓库中的版本不同
  - 可以使用`git diff`查看具体的修改内容

  **已暂存（Staged）**
  - 文件的当前版本已被添加到暂存区
  - 准备包含在下一个提交中
  - 可以使用`git diff --cached`查看暂存区的修改

  **已提交（Committed）**
  - 文件的当前版本已安全保存在本地仓库
  - 形成了项目历史的一个快照
  - 可以随时回溯到这个状态

#### 1.1.3 基本工作流程

一个典型的Git工作流程如下：

```bash
# 1. 克隆远程仓库到本地
git clone https://github.com/example/project.git

# 2. 在工作区进行开发，修改文件
echo "新功能开发" > feature.txt

# 3. 查看当前状态
git status

# 4. 将修改添加到暂存区
git add feature.txt
# 或者添加所有修改
git add .

# 5. 提交到本地仓库
git commit -m "feat: 添加新功能"

# 6. 推送到远程仓库
git push origin main
```

### 1.2 基本命令

#### 1.2.1 git init - 初始化仓库

`git init`命令用于在当前目录创建一个新的Git仓库：

```bash
# 在当前目录初始化Git仓库
git init

# 初始化一个裸仓库（通常用于创建远程仓库）
git init --bare

# 初始化并指定仓库名称
git init my-project

# 创建包含子模块的仓库
git init --separate-git-dir=/path/to/.git
```

执行`git init`后，会在当前目录创建一个`.git`子目录，包含所有Git需要的数据和对象：

```
.git/
├── HEAD                 # 指向当前分支的指针
├── config               # 仓库配置
├── description          # 仓库描述
├── hooks/               # 客户端或服务端钩子脚本
├── info/                # 全局排除规则
├── objects/             # 所有Git对象
└── refs/                # 所有引用（分支、标签）
```

#### 1.2.2 git clone - 克隆仓库

`git clone`命令用于从远程仓库复制一个完整的副本：

```bash
# 克隆整个仓库
git clone https://github.com/torvalds/linux.git

# 克隆到指定目录
git clone https://github.com/torvalds/linux.git my-linux

# 浅克隆（只包含最近一次提交）
git clone --depth 1 https://github.com/torvalds/linux.git

# 克隆特定分支
git clone --branch v5.0 --depth 1 https://github.com/torvalds/linux.git

# 使用SSH协议克隆
git clone git@github.com:example/project.git

# 递归克隆（包含子模块）
git clone --recursive https://github.com/example/project.git
```

克隆过程解析：
1. 创建远程仓库的连接（origin）
2. 克隆所有对象和引用
3. 创建与远程分支对应的本地分支
4. 将工作区切换到默认分支的最新提交

#### 1.2.3 git add - 添加到暂存区

`git add`命令将工作区的修改添加到暂存区：

```bash
# 添加指定文件
git add index.html

# 添加所有修改（包括新文件、修改文件、删除文件）
git add .

# 添加所有修改（不包括未跟踪文件）
git add -u

# 添加所有文件（包括忽略的文件）
git add -A

# 交互式添加
git add -i

# 添加所有修改并显示diff
git add -p

# 添加被删除和重命名的文件（不包括新文件）
git add -u

# 强制添加被.gitignore忽略的文件
git add -f important-file.txt
```

**暂存区的工作原理**：
- 当执行`git add`时，Git会：
  1. 计算文件的SHA-1哈希值
  2. 将文件内容存储在`.git/objects/`目录中（作为blob对象）
  3. 更新暂存区（`.git/index`），记录文件路径和哈希值的映射

#### 1.2.4 git commit - 提交到本地仓库

`git commit`命令将暂存区的内容创建为一个新的提交：

```bash
# 基本提交
git commit -m "提交信息"

# 提交所有已跟踪文件的修改（自动add）
git commit -am "提交信息"

# 修改最后一次提交（追加修改或修改提交信息）
git commit --amend

# 提交并显示diff
git commit -v

# 提交时跳过pre-commit钩子
git commit --no-verify

# 指定作者信息
git commit --author="姓名 <email@example.com>"

# 指定提交日期
git commit --date="2024-01-01T10:00:00"

# 空提交（用于触发CI/CD）
git commit --allow-empty -m "触发CI构建"

# 签名提交（需要配置GPG密钥）
git commit -S -m "提交信息"
```

**提交流程**：
1. Git计算每个已暂存文件的SHA-1哈希
2. 创建tree对象表示项目结构
3. 创建commit对象，包含：
   - 指向tree对象的指针
   - 指向父提交的指针
   - 作者信息（姓名、邮箱、时间）
   - 提交者信息（姓名、邮箱、时间）
   - 提交描述信息

#### 1.2.5 git push - 推送到远程仓库

`git push`命令将本地仓库的提交推送到远程仓库：

```bash
# 推送到默认远程仓库的默认分支
git push

# 推送到指定远程仓库
git push origin main

# 推送到远程仓库的指定分支
git push origin feature/login

# 设置上游分支并推送
git push -u origin feature/login

# 删除远程分支
git push origin --delete feature/old

# 推送所有分支
git push --all

# 推送所有标签
git push --tags

# 强制推送（谨慎使用！）
git push --force

# 强制推送并显示详细信息
git push --force-with-lease

# 推送子模块
git push --recurse-submodules=on-demand
```

#### 1.2.6 git pull - 拉取并合并

`git pull`命令用于从远程仓库获取并合并：

```bash
# 基本拉取（相当于git fetch + git merge）
git pull

# 拉取并变基（相当于git fetch + git rebase）
git pull --rebase

# 从指定远程仓库拉取
git pull origin main

# 拉取并尝试fast-forward
git pull --ff-only

# 手动指定合并策略
git pull --no-ff

# 拉取但停留在FETCH_HEAD
git pull --no-commit
```

**`git pull`的工作原理**：

```bash
# git pull 实际上执行了两个操作：
# 1. fetch：获取远程更新
git fetch origin

# 2. merge：合并到当前分支
git merge origin/main
```

#### 1.2.7 git fetch - 获取远程更新

`git fetch`命令从远程仓库获取最新提交（不合并）：

```bash
# 获取所有远程仓库的更新
git fetch --all

# 获取指定远程仓库的更新
git fetch origin

# 获取特定分支
git fetch origin feature/login

# 获取所有标签
git fetch --tags

# 获取所有远程分支
git fetch --prune

# 深度获取（浅克隆后扩展）
git fetch --deepen=100
```

**fetch与pull的区别**：
- `git fetch`：只获取远程更新，不影响本地分支
- `git pull`：获取远程更新，并自动合并到当前分支

### 1.3 分支操作

#### 1.3.1 分支基础概念

Git的分支是指向提交对象的可变指针，创建一个新分支就是创建一个新的指针：

```bash
# 查看所有分支（*表示当前分支）
git branch

# 查看所有分支及其详细信息
git branch -v

# 查看已合并到当前分支的分支
git branch --merged

# 查看未合并到当前分支的分支
git branch --no-merged

# 查看所有远程分支
git branch -r

# 查看本地和远程所有分支
git branch -a
```

**分支的本质**：
- 分支是一个40字符的SHA-1哈希值的简写（ refs/heads/分支名）
- 创建分支只是创建了一个新的指针，不会复制任何文件
- Git通过HEAD指针来确定当前所在的分支

#### 1.3.2 创建和切换分支

```bash
# 创建新分支
git branch feature/login

# 创建新分支并切换
git checkout -b feature/login

# 新版Git推荐语法：创建并切换
git switch -c feature/login

# 从指定提交创建分支
git branch feature/login abc123

# 从远程分支创建本地分支
git branch feature/login origin/feature/login

# 创建分支并设置上游
git branch -u origin/feature/login feature/login

# 创建与远程同名的分支并跟踪
git checkout --track origin/feature/login
```

#### 1.3.3 切换分支

```bash
# 切换到已存在的分支
git checkout main

# 切换到上一个分支
git checkout -

# 新版Git推荐语法：切换分支
git switch main

# 切换到上一个分支（新语法）
git switch -

# 强制切换（丢弃未提交的修改）
git checkout -f main

# 在切换前保存当前工作进度
git checkout -m feature/login
```

**切换分支的注意事项**：
- 切换分支时，工作区会变成目标分支的内容
- 如果有未提交的修改，可能需要先stash或commit
- 切换分支不会影响远程仓库

#### 1.3.4 删除分支

```bash
# 删除已合并的分支
git branch -d feature/login

# 强制删除分支（即使未合并）
git branch -D feature/login

# 删除远程分支
git push origin --delete feature/login

# 删除已合并的远程分支
git remote prune origin
```

### 1.4 查看历史

#### 1.4.1 git log - 查看提交历史

```bash
# 查看基本提交历史
git log

# 查看简洁的单行格式
git log --oneline

# 查看图形化分支历史
git log --graph

# 查看所有分支的提交历史
git log --all

# 查看最近N次提交
git log -5

# 查看指定文件的提交历史
git log -- index.html

# 查看指定作者的提交
git log --author="张三"

# 查看指定分支的提交
git log main..feature

# 查看某段时间内的提交
git log --since="2024-01-01" --until="2024-12-31"

# 查看合并提交的详细信息
git log --merges

# 查看非合并提交
git log --no-merges

# 查看提交及其变更的统计信息
git log --stat

# 查看提交的补丁内容
git log -p

# 查看每次提交的文件变更列表
git log --name-only

# 查看提交的文件变更数量
git log --numstat

# 格式化输出
git log --pretty=format:"%h %an %s"
```

**常用格式化选项**：
| 选项 | 说明 |
|------|------|
| %H | 提交的完整哈希值 |
| %h | 提交的简写哈希值 |
| %an | 作者姓名 |
| %ae | 作者邮箱 |
| %ar | 作者日期（相对） |
| %s | 提交说明 |
| %b | 提交正文 |
| %Cred | 红色显示 |
| %Cblue | 蓝色显示 |

#### 1.4.2 git diff - 查看差异

```bash
# 查看工作区与暂存区的差异
git diff

# 查看暂存区与上一次提交的差异
git diff --cached
git diff --staged

# 查看工作区与指定提交的差异
git diff HEAD

# 比较两个分支的差异
git diff main..feature/login

# 比较两个提交之间的差异
git diff abc123..def456

# 查看特定文件的差异
git diff -- index.html

# 查看已暂存文件的差异
git diff --cached -- index.html

# 查看简短的差异统计
git diff --stat

# 忽略空白字符的差异
git diff -w

# 逐词比较而不是逐行
git diff --word-diff
```

#### 1.4.3 git status - 查看状态

```bash
# 查看完整状态
git status

# 简洁格式
git status -s

# 简洁格式示例：
# M  index.html      - 已修改已暂存
# MM file.txt       - 已修改已暂存，又有新修改
# A  new.txt        - 新增已暂存
# D  deleted.txt    - 已删除已暂存
# R  renamed.txt    - 已重命名已暂存
# ?? untracked.txt  - 未跟踪文件

# 忽略.gitignore中的文件
git status --ignored

# 显示分支信息
git status -sb
```

#### 1.4.4 git blame - 查看文件每行的最后修改

```bash
# 查看文件的每行最后修改信息
git blame index.html

# 查看指定行的修改信息
git blame -L 10,20 index.html

# 查看文件的简写信息
git blame -s index.html

# 显示邮箱而不是姓名
git blame -e index.html

# 忽略特定修订版的修改（用于查找问题）
git blame -M index.html

# 忽略移动和复制的行
git blame -C -C index.html
```

### 1.5 撤销修改

#### 1.5.1 git reset - 重置

`git reset`命令用于重置当前HEAD到指定状态：

```bash
# 重置到上一次提交（保留工作区修改）
git reset --soft HEAD^

# 重置到上一次提交（保留工作区和暂存区修改）
git reset --mixed HEAD^
# 或
git reset HEAD^

# 重置到上一次提交（丢弃所有修改 - 危险操作）
git reset --hard HEAD^

# 重置到指定提交
git reset --hard abc123

# 取消暂存文件（从暂存区移除）
git reset HEAD index.html
# 或
git restore --staged index.html

# 重置单个文件到指定提交
git checkout abc123 -- index.html
# 或
git restore --source=abc123 index.html
```

**三种模式的区别**：

| 模式 | HEAD位置 | 暂存区 | 工作区 |
|------|----------|--------|--------|
| --soft | 改变 | 不变 | 不变 |
| --mixed（默认）| 改变 | 重置 | 不变 |
| --hard | 改变 | 重置 | 重置 |

#### 1.5.2 git revert - 撤销提交

`git revert`创建一个新的提交来撤销指定提交的修改：

```bash
# 撤销上一次提交
git revert HEAD

# 撤销指定提交
git revert abc123

# 撤销多个提交
git revert abc123..def456

# 不自动提交
git revert -n abc123

# 撤销合并提交（需要指定父提交）
git revert -m 1 abc123
```

**revert与reset的区别**：
- `git revert`：创建一个新提交来"反做"之前的修改，历史记录保留
- `git reset`：直接移动HEAD指针，历史记录可能丢失（--hard模式）

#### 1.5.3 git checkout - 检出

```bash
# 丢弃工作区的修改（恢复到暂存区状态）
git checkout -- index.html
# 或
git restore index.html

# 恢复到上一次提交的状态
git checkout HEAD -- index.html

# 创建并检出新的分支
git checkout -b feature/new

# 检出远程分支作为新本地分支
git checkout -b feature origin/feature

# 检出特定提交（进入 detached HEAD 状态）
git checkout abc123
```

#### 1.5.4 git restore - 恢复文件

```bash
# 恢复工作区文件（丢弃修改）
git restore index.html

# 取消暂存
git restore --staged index.html

# 从指定来源恢复
git restore --source=HEAD~2 index.html

# 恢复所有文件
git restore .

# 使用快照恢复
git restore --source=abc123 .
```

#### 1.5.5 撤销场景总结

| 场景 | 命令 |
|------|------|
| 丢弃工作区修改 | git restore index.html |
| 取消暂存 | git restore --staged index.html |
| 重置到上一次提交 | git reset --hard HEAD^ |
| 撤销已提交的修改 | git revert HEAD |
| 修改最后一次提交 | git commit --amend |
| 恢复误删的分支 | git checkout -b branch abc123 |

---

## 2. Git深入

### 2.1 深入理解HEAD指针

#### 2.1.1 HEAD的本质

HEAD是Git中的一个特殊指针，指向当前分支的最新提交：

```bash
# 查看HEAD指向
cat .git/HEAD
# 输出：ref: refs/heads/main

# 查看HEAD指向的提交
git rev-parse HEAD

# 查看HEAD指向的分支
git symbolic-ref HEAD

# 查看HEAD的前一次提交
git rev-parse HEAD^

# 查看HEAD的前N次提交
git rev-parse HEAD~3
```

#### 2.1.2 Detached HEAD状态

当HEAD指向一个具体的提交而不是分支时，称为"detached HEAD"状态：

```bash
# 进入detached HEAD状态
git checkout abc123
# 或
git switch --detach abc123

# 提示信息：
# You are in 'detached HEAD' state. You can look around, make changes
# and commit, and discard any commits you make in this state.
# If you want to keep any commits you create, you may need to switch
# to a branch.

# 从detached HEAD创建新分支
git checkout -b feature/detached

# 或者
git switch -c feature/detached
```

**detached HEAD的用途**：
- 查看项目历史
- 创建临时补丁
- 进行实验性修改

**风险提示**：
在detached HEAD状态下提交的修改，如果没有创建新分支指向它们，这些提交最终会被Git的垃圾回收机制清理掉。

#### 2.1.3 HEAD的移动

```bash
# 移动HEAD到上一次提交
git reset HEAD^

# 移动HEAD到上三次提交
git reset HEAD~3

# 移动到指定提交
git reset --hard abc123

# 使用^符号访问父提交
git reset HEAD^     # 第一次父提交
git reset HEAD^2   # 第二次父提交（合并提交的第二个父提交）

# 使用~符号访问祖先提交
git reset HEAD~10  # 往上第10个祖先提交
```

### 2.2 引用：branch、tag、remote

#### 2.2.1 分支引用

分支是存储在`.git/refs/heads/`目录下的文件：

```bash
# 查看分支引用文件
cat .git/refs/heads/main
# 输出：abc123def456... （提交哈希）

# 查看所有分支引用
git show-ref

# 查看本地分支
git show-ref --heads

# 查看远程分支
git show-ref --heads --remotes
```

#### 2.2.2 标签引用

标签是存储在`.git/refs/tags/`目录下的引用：

```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（推荐）
git tag -a v1.0.0 -m "版本1.0.0发布"

# 查看标签引用
cat .git/refs/tags/v1.0.0
# 输出：abc123def456...

# 查看标签详细信息
git show v1.0.0

# 列出所有标签
git tag

# 带条件列出标签
git tag -l "v1.*"

# 删除标签
git tag -d v1.0.0

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push --tags
```

**轻量标签与附注标签的区别**：
- 轻量标签：只是一个指向特定提交的对象的引用
- 附注标签：是一个独立的对象，包含标签信息、创建者、日期等

#### 2.2.3 远程引用

远程引用存储在`.git/refs/remotes/`目录下：

```bash
# 查看远程分支引用
cat .git/refs/remotes/origin/main

# 查看所有远程引用
git ls-remote origin

# 远程分支与本地分支的区别：
# - 本地分支：refs/heads/main
# - 远程分支：refs/remotes/origin/main

# 跟踪远程分支
git checkout -b main origin/main
# 或
git branch --track main origin/main
```

#### 2.2.4 引用 shorthand（简写）

Git提供了多种引用简写方式：

```bash
# 使用分支名
git log main

# 使用tag名
git log v1.0.0

# 使用remote/branch
git log origin/main

# 使用HEAD
git log HEAD

# 相对引用
git log HEAD~3
git log HEAD^
git log HEAD@{yesterday}
git log HEAD@{2.weeks.ago}

# 引用@{upstream}或@{u}
git log HEAD@{u}
```

### 2.3 .git目录结构解析

```
.git/
├── HEAD                    # 指向当前分支的指针
│   └── ref: refs/heads/main
│
├── ORIG_HEAD               # 操作前的HEAD位置（用于恢复）
│
├── refs/
│   ├── heads/              # 本地分支引用
│   │   ├── main
│   │   ├── develop
│   │   └── feature/
│   │       └── login
│   │
│   ├── tags/               # 标签引用
│   │   ├── v1.0.0
│   │   └── v1.1.0
│   │
│   └── remotes/            # 远程分支引用
│       ├── origin/
│       │   ├── main
│       │   └── develop
│       └── upstream/
│           └── main
│
├── objects/
│   ├── pack/               # 打包后的对象文件
│   │   ├── pack-abc123.idx
│   │   └── pack-abc123.pack
│   │
│   └── info/               # 对象信息
│   └── 00/                 # 对象子目录（哈希前2位）
│   │   └── 00...           # 对象文件（剩余38位哈希）
│   ├── ab/                 # 更多对象子目录
│   │   └── cd...
│   └── ...
│
├── logs/
│   ├── HEAD                # HEAD的引用日志
│   └── refs/heads/main     # 分支的引用日志
│
├── index                   # 暂存区（INDEX）
│
├── config                  # 本地配置
│
├── description             # 仓库描述（供GitWeb使用）
│
├── hooks/                  # 客户端/服务端钩子
│   ├── pre-commit.sample
│   ├── prepare-commit-msg.sample
│   ├── commit-msg.sample
│   ├── post-commit.sample
│   └── ...
│
├── info/
│   └── exclude             # 额外忽略规则（本地）
│
├── pack/                   # 打包文件目录
└── objects/                # 对象存储目录
```

### 2.4 Git对象模型

Git的核心是一个内容寻址存储系统，所有数据都被存储为对象。

#### 2.4.1 四种对象类型

**1. Blob对象**
- 存储文件内容
- 仅包含数据的二进制内容
- 不包含文件名、权限等信息

```bash
# 查看blob对象
git cat-file -t abc123  # 类型
git cat-file -p abc123  # 内容
```

**2. Tree对象**
- 存储目录结构
- 包含一组指向blob和tree的指针
- 记录文件名和目录名

```
tree abc123
100644 blob def456  index.html
100644 blob ghi789  style.css
040000 tree jkl012  src
```

**3. Commit对象**
- 存储提交的元数据
- 包含指向tree的指针
- 包含父提交的引用
- 记录作者、提交者、时间等信息

```
commit abc123
tree def456
parent ghi789
author 张三 <zhangsan@example.com> 1704067200 +0800
committer 李四 <lisi@example.com> 1704067200 +0800

提交说明
```

**4. Tag对象**
- 存储标签信息
- 通常指向commit对象
- 包含标签创建者、日期等信息

```
tag v1.0.0
object abc123
type commit
tagger 王五 <wangwu@example.com> 1704067200 +0800

版本1.0.0发布说明
```

#### 2.4.2 对象之间的关系

```
┌──────────────────────────────────────────────────────────────┐
│                        提交对象 (Commit)                       │
│  tree: 指向项目结构树                                          │
│  parent: 指向上一次提交                                        │
│  author/committer: 作者和提交者信息                            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                         树对象 (Tree)                         │
│  包含多个条目，每个条目指向：                                   │
│  - blob（文件内容）                                            │
│  - tree（子目录）                                              │
│  记录文件名和目录名                                            │
└──────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │  Blob     │   │  Blob     │   │   Tree     │
      │ (文件内容) │   │ (文件内容) │   │  (子目录) │
      └───────────┘   └───────────┘   └───────────┘
```

#### 2.4.3 对象的存储机制

Git使用SHA-1哈希作为对象的键：
- 同一个内容总是产生相同的哈希值
- 内容被压缩存储在`.git/objects/`目录
- 目录命名：哈希值的前2位
- 文件命名：哈希值的后38位

```bash
# 查看对象类型
git cat-file -t <hash>

# 查看对象内容
git cat-file -p <hash>

# 查看对象大小
git cat-file -s <hash>

# 列出所有对象
git cat-file --batch-all --check-sig
```

### 2.5 合并策略

#### 2.5.1 Fast-Forward合并

当被合并的分支是当前分支的直接祖先时，Git会使用fast-forward策略：

```bash
# 当前分支：main
# 被合并分支：feature
# main的HEAD指向A，feature的HEAD指向B（B是A的后代）

# 合并前：
# main:     A
# feature:  A → B

git checkout main
git merge feature

# 合并后：
# main:     A → B
# feature:  A → B
# （main的指针直接移动到feature的位置）
```

```bash
# 禁用fast-forward（即使可以也创建合并提交）
git merge --no-ff feature

# 合并时强制fast-forward（如果不能则失败）
git merge --ff-only feature
```

#### 2.5.2 Recursive合并（Three-Way Merge）

当分支有分歧时，Git使用三方合并：

```bash
# 合并前：
# main:     A → → → C
#                 ↖   /
# feature:  A → → B /
# 共同祖先： A

git checkout main
git merge feature

# 合并后：
# main:     A → → → C → → M
#                 ↖   /  ↗
# feature:  A → → B → → (仍指向B)
# M是新的合并提交，有两个父提交
```

#### 2.5.3 合并策略选项

```bash
# 递归策略（默认）
git merge -s recursive branch

# 只想使用ours策略（忽略他们的修改）
git merge -s ours branch

#  octopus策略（合并两个以上分支）
git merge feature1 feature2 feature3

# subtree策略
git merge -s subtree branch
```

#### 2.5.4 ours与theirs

```bash
# ours - 当前分支的版本
git merge -s ours feature

# 手动解决使用ours或theirs
git checkout --ours index.html     # 使用当前分支的
git checkout --theirs index.html   # 使用被合并分支的

# 在rebase中使用
git rebase -X theirs main          # 使用他们的修改
git rebase -X ours main            # 使用我们的修改
```

### 2.6 冲突解决

#### 2.6.1 冲突的产生

当两个分支对同一文件的同一位置进行了不同的修改时，Git无法自动合并：

```bash
# 分支1修改了 index.html 的第10行
# 分支2也修改了 index.html 的第10行
# 合并时产生冲突
```

#### 2.6.2 冲突标记

冲突文件会包含特殊的标记：

```html
<<<<<<< HEAD
<!-- 当前分支的修改 -->
<div class="container">
    <h1>标题A</h1>
</div>
=======
<!-- 被合并分支的修改 -->
<div class="wrapper">
    <h1>标题B</h1>
</div>
>>>>>>> feature-branch
```

三个部分：
- `<<<<<<< HEAD`：当前分支的修改开始
- `=======`：分隔符
- `>>>>>>>`：被合并分支的修改结束

#### 2.6.3 解决冲突的方法

**方法一：手动编辑**

```bash
# 1. 打开冲突文件
# 2. 删除冲突标记
# 3. 保留需要的修改
# 4. 保存文件

# 5. 添加已解决的文件
git add index.html

# 6. 完成合并提交
git commit -m "合并分支：解决冲突"
```

**方法二：使用合并工具**

```bash
# 配置合并工具
git config merge.tool vimdiff

# 启动合并工具
git mergetool

# 常用合并工具：
# - vimdiff
# - meld
# - beyond compare
# - p4merge
# - tortoisemerge
```

**方法三：使用ours或theirs**

```bash
# 保留当前分支（HEAD）的所有修改
git checkout --ours index.html
git add index.html

# 保留被合并分支的所有修改
git checkout --theirs index.html
git add index.html
```

#### 2.6.4 冲突解决后的操作

```bash
# 查看冲突状态
git status

# 完成合并提交
git commit -m "Merge branch 'feature' into main"

# 放弃合并
git merge --abort

# 解决所有冲突后重新合并
git merge --continue
```

#### 2.6.5 常见的冲突场景

**场景1：修改同一文件的同一行**

最常见的冲突，需要手动选择或合并。

**场景2：删除与修改冲突**

一方删除文件，另一方修改了文件。

```bash
# 保留删除
git rm index.html
git add index.html

# 保留修改
git checkout --theirs index.html
git add index.html
```

**场景3：目录与文件的冲突**

不能同时存在同名的文件和目录。

---

## 3. 高级操作

### 3.1 Rebase变基操作

#### 3.1.1 Rebase基本概念

Rebase（变基）是将一系列提交"移动"到新的基础提交上的操作：

```bash
# 变基前：
# main:     A → B → C
#                  ↑
# feature:           D → E

# 执行：
git checkout feature
git rebase main

# 变基后：
# main:     A → B → C
#                      ↑
# feature:              D' → E'
```

**rebase与merge的区别**：

| 方面 | merge | rebase |
|------|-------|--------|
| 历史 | 保留完整历史，有分叉 | 线性历史，更简洁 |
| 提交 | 创建新的合并提交 | 重写提交（新的SHA） |
| 复杂度 | 简单直接 | 需要处理冲突 |
| 适用 | 合并长期分支 | 同步主线更新 |

#### 3.1.2 交互式Rebase

交互式Rebase允许更精细地控制提交历史：

```bash
# 对最近3个提交进行交互式变基
git rebase -i HEAD~3

# 对指定提交之后的提交进行交互式变基
git rebase -i abc123

# 使用指定基础分支进行变基
git rebase -i main
```

**交互式命令**：

```
pick abc123f 提交消息1
pick def456g 提交消息2
pick hij789k 提交消息3

# 命令：
# p, pick = 使用该提交
# r, reword = 使用该提交，但修改提交信息
# e, edit = 使用该提交，但暂停进行修改
# s, squash = 使用该提交，但与前一个提交合并
# f, fixup = 与squash相同，但丢弃该提交的提交信息
# x, exec = 执行shell命令
# d, drop = 删除该提交
```

**示例 - 压缩提交历史**：

```
# 原始
pick abc123f feat: 添加登录功能
pick def456g feat: 添加注册功能
pick hij789k feat: 修复bug

# 修改为
pick abc123f feat: 添加用户认证功能
f def456g
f hij789k

# 结果：三个提交合并为一个
```

**示例 - 重新排序提交**：

```
# 原始
pick abc123f feat: 添加登录功能
pick def456g feat: 添加注册功能

# 修改为
pick def456g feat: 添加注册功能
pick abc123f feat: 添加登录功能
```

**示例 - 修改提交信息**：

```
# 原始
pick abc123f 添加登录功能

# 修改为
r abc123f feat: 添加完整的用户登录功能
```

#### 3.1.3 Rebase的黄金法则

**重要**：永远不要对已经推送到远程的提交进行rebase。

原因：
- Rebase会重写提交历史，产生新的SHA值
- 如果其他人基于旧的提交进行了工作，会造成混乱
- 可能导致其他人的仓库处于不一致状态

```bash
# 场景：已经push的提交被rebase
# 你的仓库：A → B → C
# 远程仓库：A → B → D → E

git rebase main
# 你的仓库变成：A → B → D → E → B' → C'

# 当你push时
git push --force
# 远程仓库被强制更新，但其他人的本地仓库仍然指向旧的C提交
```

**安全实践**：
```bash
# 总是使用--force-with-lease代替--force
git push --force-with-lease

# 或者只在确定没有其他人基于这些提交工作时才force push
```

#### 3.1.4 Rebase的高级用法

**在rebase中解决冲突**：

```bash
# 开始变基
git rebase main

# 发生冲突时，Git会暂停
# 1. 解决冲突
# 2. git add .
# 3. 继续变基
git rebase --continue

# 或者跳过当前提交
git rebase --skip

# 或者放弃变基
git rebase --abort
```

**自动变基**：

```bash
# 设置分支总是变基到目标分支
git config branch.feature.rebase main

# 或者在pull时默认使用rebase
git config pull.rebase true
git config rebase.autostash true
```

### 3.2 Cherry-pick挑选提交

#### 3.2.1 基本用法

Cherry-pick允许选择性地应用某个分支上的特定提交：

```bash
# 在当前分支上应用指定提交
git cherry-pick abc123

# 应用多个提交
git cherry-pick abc123 def456

# 应用一系列连续提交
git cherry-pick abc123..def456

# 不自动提交（手动完成）
git cherry-pick -n abc123
```

#### 3.2.2 Cherry-pick示例

```bash
# 场景：main分支修复了一个bug，想把这个修复应用到feature分支

# 1. 查看修复提交的哈希
git log main --oneline
# abc123 fix: 修复登录页面白屏问题

# 2. 切换到feature分支
git checkout feature

# 3. 应用修复提交
git cherry-pick abc123

# 4. 完成
```

#### 3.2.3 Cherry-pick与冲突

```bash
# 如果发生冲突
# 1. 解决冲突
# 2. git add .
# 3. 继续 cherry-pick
git cherry-pick --continue

# 或者放弃
git cherry-pick --abort
```

#### 3.2.4 Cherry-pick的选项

```bash
# 编辑提交信息
git cherry-pick -e abc123

# 不包含提交，只包含修改
git cherry-pick -n abc123

# 指定作者
git cherry-pick --author="张三 <zhangsan@example.com>" abc123

# 在cherry-pick后签名
git cherry-pick -s abc123
```

### 3.3 Stash暂存工作区

#### 3.3.1 基本stash操作

当需要临时切换分支但又不想提交当前修改时，可以使用stash：

```bash
# 暂存当前工作区的修改
git stash

# 暂存并添加描述信息
git stash save "临时保存：正在进行登录功能开发"

# 暂存包含未跟踪文件
git stash -u

# 暂存包含忽略的文件
git stash -a

# 暂存所有文件（包括已删除的文件）
git stash -all
```

#### 3.3.2 应用stash

```bash
# 恢复最近的stash
git stash pop

# 恢复stash但不删除
git stash apply

# 恢复指定的stash
git stash apply stash@{2}

# 在指定分支上恢复stash
git stash apply stash@{0}
```

#### 3.3.3 管理stash

```bash
# 列出所有stash
git stash list
# stash@{0}: WIP on main: abc123 最后一次提交
# stash@{1}: WIP on main: def456 上一次stash

# 查看stash内容
git stash show
git stash show -p

# 查看指定stash的内容
git stash show stash@{1}
git stash show -p stash@{1}

# 删除stash
git stash drop stash@{0}

# 删除所有stash
git stash clear
```

#### 3.3.4 高级stash用法

**从stash创建分支**：

```bash
# 从stash创建新分支并应用stash
git stash branch feature/new-branch stash@{0}

# 相当于：
git checkout -b feature/new-branch
git stash apply stash@{0}
```

**暂存部分文件**：

```bash
# 交互式暂存
git stash -p

# 选择要暂存的部分
# y - 暂存这个hunk
# n - 不暂存这个hunk
# s - 分割hunk
# ? - 帮助
```

### 3.4 Bisect二分查找

Git bisect使用二分查找来快速定位引入bug的提交：

#### 3.4.1 基本用法

```bash
# 开始二分查找
git bisect start

# 标记当前提交为坏提交（已知有bug）
git bisect bad

# 标记一个已知好的提交
git bisect good abc123

# Git会自动checkout中间提交
# 测试后标记
git bisect good  # 或 git bisect bad

# 重复直到找到问题提交

# 完成后返回原分支
git bisect reset
```

#### 3.4.2 自动二分查找

```bash
# 提供测试脚本
git bisect start
git bisect bad HEAD
git bisect good abc123
git bisect run npm test

# Git会自动运行测试，直到找到问题提交
```

#### 3.4.3 Bisect子命令

```bash
git bisect start [end] [start]  # 开始bisect，可指定终点和起点
git bisect bad [commit]         # 标记提交为坏的
git bisect good [commit]        # 标记提交为好的
git bisect reset               # 结束bisect并返回
git bisect visualize           # 查看bisect进度
git bisect log                # 查看bisect日志
git bisect replay <file>      # 回放bisect日志
```

### 3.5 Reflog恢复误删提交

Reflog记录了HEAD指针的所有移动历史：

#### 3.5.1 查看reflog

```bash
# 查看HEAD的移动历史
git reflog

# 输出示例：
# abc123f HEAD@{0}: commit: 添加新功能
# def456g HEAD@{1}: checkout: moving from feature to main
# hij789k HEAD@{2}: rebase: applied fixing commit
# ...

# 使用时间限定符
git reflog --date=relative

# 查看特定分支的reflog
git reflog show main

# 显示所有reflog
git reflog --all
```

#### 3.5.2 恢复误删的提交

```bash
# 场景：误操作导致提交丢失
# 1. 查看reflog
git reflog

# 输出：
# abc123f HEAD@{0}: reset: moving to HEAD^
# def456g HEAD@{1}: commit: 重要提交（现在看不到了）

# 2. 恢复到误删的提交
git checkout def456g
# 或
git reset --hard def456g

# 3. 完成恢复
```

#### 3.5.3 恢复误删的分支

```bash
# 场景：不小心删除了分支
# 1. 查看reflog
git reflog

# 2. 找到分支被删除前的提交
git reflog | grep feature

# 输出：
# abc123f HEAD@{5}: checkout: moving from feature to main
# def456g HEAD@{6}: branch: Created from abc123:feature

# 3. 恢复分支
git checkout -b feature abc123f
# 或
git branch feature abc123f
```

#### 3.5.4 Reflog的限制

- Reflog是本地记录，不会同步到远程
- 默认保留90天（可配置）
- 在新克隆的仓库中无法恢复其他人的操作

### 3.6 Submodule与Subtree

#### 3.6.1 Submodule子模块

子模块允许在一个Git仓库中包含另一个Git仓库：

**添加子模块**：

```bash
# 添加子模块
git submodule add https://github.com/example/lib.git libs/lib

# 指定分支
git submodule add -b main https://github.com/example/lib.git libs/lib

# 指定目录
git submodule add https://github.com/example/lib.git libs
```

**克隆包含子模块的仓库**：

```bash
# 克隆主仓库
git clone https://github.com/example/project.git

# 初始化子模块
git submodule init

# 拉取子模块内容
git submodule update

# 一步完成
git clone --recurse-submodules https://github.com/example/project.git
```

**更新子模块**：

```bash
# 在子模块目录中更新
cd libs/lib
git checkout main
git pull

# 在主仓库中提交子模块的更新
git add libs/lib
git commit -m "更新子模块"

# 获取远程子模块更新
git submodule update --remote libs/lib
```

**管理子模块**：

```bash
# 查看子模块状态
git submodule status

# 子模块内提交修改
cd libs/lib
git commit -am "子模块修改"
git push

# 在主仓库更新子模块
git submodule update --remote

# 删除子模块
git submodule deinit libs/lib
git rm libs/lib
rm -rf .git/modules/libs/lib
```

#### 3.6.2 Subtree子模块替代方案

Subtree是另一种在仓库中包含外部项目的方式：

**添加subtree**：

```bash
# 添加subtree
git subtree add --prefix=libs/lib https://github.com/example/lib.git main

# 拉取subtree
git subtree pull --prefix=libs/lib https://github.com/example/lib.git main

# 推送subtree修改
git subtree push --prefix=libs/lib https://github.com/example/lib.git main
```

**Submodule与Subtree的区别**：

| 方面 | Submodule | Subtree |
|------|-----------|---------|
| 存储方式 | 引用外部仓库 | 完全复制到本仓库 |
| clone大小 | 小（只引用） | 大（完整副本） |
| 独立提交历史 | 有 | 无 |
| 权限控制 | 外部仓库独立 | 随主仓库 |
| 推送更新 | 需要推送到外部 | 可在内部完成 |

---

## 4. Git Flow工作流

### 4.1 分支模型

Git Flow是一种成熟的分支管理模型，由Vincent Driessen提出：

```
                            ┌─────────────────┐
                            │   master/main   │
                            │  (生产环境代码)  │
                            └────────┬────────┘
                                     │ tag v1.0.0
                         ┌───────────┴───────────┐
                         │                       │
                   hotfix/v1.0.1            release/v1.1.0
                         │                       │
                         └───────────┬───────────┘
                                     │
                            ┌────────┴────────┐
                            │    develop     │
                            │  (开发主分支)   │
                            └────────┬────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   │                 │                 │
            feature/login     feature/dashboard    feature/report
```

#### 4.1.1 分支类型

**长期分支**：
| 分支 | 名称 | 用途 | 稳定性 |
|------|------|------|--------|
| main/master | 主分支 | 正式发布的代码 | 最高 |
| develop | 开发分支 | 集成了所有功能的下一版本 | 中等 |

**短期分支**：
| 分支 | 命名规则 | 用途 | 生命周期 |
|------|----------|------|----------|
| feature | feature/功能名 | 开发新功能 | 功能开发期间 |
| release | release/版本号 | 准备发布 | 发布前测试 |
| hotfix | hotfix/问题描述 | 紧急修复 | 修复期间 |

#### 4.1.2 分支保留规则

```bash
# main/master - 永远保留
# develop - 永远保留
# feature - 功能完成后删除
# release - 发布完成后删除
# hotfix - 修复完成后删除
```

### 4.2 完整Git Flow流程演示

#### 4.2.1 初始化Git Flow

```bash
# 安装 git-flow（可选）
# 在项目初始化时
git flow init

# 分支命名设置：
# 生产分支：main
# 开发分支：develop
# 功能前缀：feature/
# 发布前缀：release/
# 修复前缀：hotfix/
# 标签前缀：v

# 初始化后的分支结构：
# git branch
# * develop
#   main
```

#### 4.2.2 功能开发流程

```bash
# 1. 从develop创建功能分支
git flow feature start login

# 相当于：
# git checkout develop
# git checkout -b feature/login

# 2. 在功能分支上开发
echo "登录页面" > login.html
git add .
git commit -m "feat: 添加登录页面"

# 3. 推送功能分支（协作开发）
git flow feature publish login
# 或
git push origin feature/login

# 4. 获取远程更新
git flow feature pull login
# 或
git fetch origin
git rebase origin/feature/login

# 5. 完成功能
git flow feature finish login

# 相当于：
# git checkout develop
# git merge feature/login
# git branch -d feature/login
# git push origin develop
```

#### 4.2.3 发布流程

```bash
# 1. 从develop创建发布分支
git flow release start v1.0.0

# 2. 在发布分支上做最后调整
# 修改版本号
echo "1.0.0" > version.txt
git add .
git commit -m "chore: 准备发布 v1.0.0"

# 3. 如果需要修复小问题
git commit -m "fix: 修复发布前的bug"

# 4. 完成发布
git flow release finish v1.0.0

# 相当于：
# git checkout main
# git merge release/v1.0.0
# git tag -a v1.0.0 -m "发布 v1.0.0"
# git checkout develop
# git merge release/v1.0.0
# git branch -d release/v1.0.0
# git push --all
# git push --tags
```

#### 4.2.4 紧急修复流程

```bash
# 1. 从main创建热修复分支
git flow hotfix start v1.0.1

# 2. 修复问题
echo "紧急修复" > hotfix.txt
git add .
git commit -m "fix: 紧急修复问题"

# 3. 完成修复
git flow hotfix finish v1.0.1

# 相当于：
# git checkout main
# git merge hotfix/v1.0.1
# git tag -a v1.0.1 -m "紧急修复 v1.0.1"
# git checkout develop
# git merge hotfix/v1.0.1
# git branch -d hotfix/v1.0.1
# git push --all
# git push --tags
```

### 4.3 GitHub Flow

GitHub Flow是一种更简单的协作流程，适合持续发布的项目：

#### 4.3.1 核心原则

1. main分支始终是可部署的
2. 所有工作都在功能分支上进行
3. 频繁合并到main
4. 合并前必须通过Pull Request
5. 合并后立即部署

#### 4.3.2 GitHub Flow流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发并提交
git commit -am "feat: 新功能开发"

# 3. 推送分支
git push -u origin feature/new-feature

# 4. 创建Pull Request（在GitHub上操作）
# 5. 代码审查和讨论
# 6. 合并到main
# 7. 删除分支
```

#### 4.3.3 GitHub Flow vs Git Flow

| 方面 | Git Flow | GitHub Flow |
|------|----------|-------------|
| 复杂度 | 高 | 低 |
| 分支数量 | 多 | 少 |
| 发布周期 | 定期发布 | 持续发布 |
| 适用场景 | 复杂项目、多版本并行 | 持续部署、简单项目 |
| 回滚速度 | 较慢 | 快 |

### 4.4 trunk-based Development

TBD（基于主干的开发）是一种极简主义的分支策略：

#### 4.4.1 核心原则

1. 所有开发者共享一个主分支（main或trunk）
2. 功能开关控制新功能的发布
3. 频繁集成到主干
4. 短生命周期功能分支
5. 发布分支从主干拉取

#### 4.4.2 TBD流程

```bash
# 1. 确保在main分支
git checkout main
git pull

# 2. 创建短生命周期功能分支
git checkout -b feature/new-feature

# 3. 频繁合并到主干（每天多次）
git commit -am "WIP: 新功能"
git push
# 合并到main

# 4. 功能完成
git checkout main
git pull
git merge --no-ff feature/new-feature
git push

# 5. 删除功能分支
git branch -d feature/new-feature
```

#### 4.4.3 功能开关

```typescript
// 功能开关实现示例
const NEW_FEATURE_ENABLED = process.env.NEW_FEATURE === 'true';

function App() {
  return (
    <div>
      <LegacyComponent />
      {NEW_FEATURE_ENABLED && <NewFeatureComponent />}
    </div>
  );
}
```

---

## 5. GitHub/GitLab

### 5.1 Pull Request/Merge Request流程

#### 5.1.1 创建Pull Request

```bash
# 1. 推送功能分支
git checkout -b feature/new-feature
git commit -am "feat: 新功能"
git push -u origin feature/new-feature

# 2. 在GitHub/GitLab上创建PR/MR
# 也可以使用命令行工具
gh pr create --title "feat: 新功能" --body "实现详情"

# 3. 查看PR状态
gh pr status

# 4. 查看PR差异
git diff main..feature/new-feature
```

#### 5.1.2 PR/MR工作流程

```
1. Fork仓库（如果你是贡献者）
         │
         ▼
2. 创建功能分支
         │
         ▼
3. 开发并提交
         │
         ▼
4. 推送分支
         │
         ▼
5. 创建Pull Request
         │
         ▼
6. 代码审查
         │
         ▼
7. 讨论和修改
         │
         ▼
8. 合并到目标分支
         │
         ▼
9. 删除功能分支
```

#### 5.1.3 PR/MR管理命令

```bash
# GitHub CLI
gh pr create              # 创建PR
gh pr list                # 列出PR
gh pr view <pr>           # 查看PR
gh pr edit <pr>           # 编辑PR
gh pr close <pr>          # 关闭PR
gh pr merge <pr>          # 合并PR
gh pr checkout <pr>       # 检出PR分支
gh pr diff <pr>           # 查看PR差异

# 添加审查者
gh pr edit 123 --reviewer zhangsan,lisi

# 添加标签
gh pr edit 123 --label bug,priority-high

# 添加里程碑
gh pr edit 123 --milestone v1.0
```

### 5.2 Code Review最佳实践

#### 5.2.1 审查者最佳实践

```markdown
# 代码审查清单

## 代码质量
- [ ] 代码是否可读、易理解？
- [ ] 是否遵循项目的代码规范？
- [ ] 是否有重复代码可以提取？
- [ ] 是否有适当的注释？

## 功能实现
- [ ] 功能是否符合需求？
- [ ] 边界条件是否处理？
- [ ] 是否有潜在的安全问题？
- [ ] 错误处理是否完善？

## 测试覆盖
- [ ] 是否有必要的单元测试？
- [ ] 测试用例是否充分？
- [ ] 测试是否通过？

## 性能考虑
- [ ] 是否有性能问题？
- [ ] 数据库查询是否优化？
- [ ] 是否有内存泄漏风险？
```

#### 5.2.2 被审查者最佳实践

```markdown
## 提交规范
- 提交信息清晰描述做了什么
- 每个提交聚焦单一功能
- 小步提交，便于审查

## PR描述模板
**功能描述**
- 实现了什么功能

**解决的问题**
- 关联的Issue编号
- 解决了什么问题

**测试说明**
- 如何测试新功能
- 需要注意的边界情况

**截图/录屏**
- UI变更需要附带截图
```

#### 5.2.3 常见审查意见

| 意见 | 含义 | 建议 |
|------|------|------|
| `nit:` | 小问题 | 可以忽略但建议修改 |
| `suggestion:` | 建议 | 可以采纳也可以不采纳 |
| `question:` | 疑问 | 需要解释清楚 |
| `issue:` | 问题 | 需要修改后才能合并 |
| `blocker:` | 阻塞性问题 | 必须修改 |

### 5.3 Issues与项目管理

#### 5.3.1 Issue管理

```bash
# GitHub CLI
gh issue create              # 创建Issue
gh issue list                # 列出Issue
gh issue view <issue>        # 查看Issue
gh issue close <issue>      # 关闭Issue
gh issue reopen <issue>      # 重新打开Issue

# 带标签和里程碑创建
gh issue create --title "Bug: 登录失败" --label bug --milestone v1.0
```

#### 5.3.2 Issue模板

```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug报告
about: 报告一个bug
title: '[Bug] '
labels: bug
assignees: ''

**Bug描述**
清晰描述bug

**复现步骤**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**预期行为**
描述预期行为

**截图**
如果有截图

**环境**
- OS: [e.g. iOS]
- Browser [e.g. chrome]
- Version [e.g. 22]

**附加信息**
任何其他信息
```

#### 5.3.3 项目看板

GitHub Projects和GitLab Boards提供了看板功能：

```bash
# GitHub Projects
# - To Do（待处理）
# - In Progress（进行中）
# - In Review（审查中）
# - Done（已完成）

# 在Issue中使用 Projects 字段
gh issue edit 123 --project "项目名"
```

### 5.4 GitHub Actions自动化

#### 5.4.1 基本概念

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 安装依赖
        run: npm ci

      - name: 运行测试
        run: npm test

      - name: 构建
        run: npm run build
```

#### 5.4.2 常用Actions

```yaml
# 检查代码
- name: ESLint
  run: npm run lint

# 运行测试并生成覆盖率报告
- name: 测试覆盖率
  run: npm run test:coverage

# 上传到云存储
- name: 上传到S3
  uses: aws-actions/aws-s3-deploy@v4
  with:
    bucket-name: my-bucket
    folder: dist

# 部署到服务器
- name: 部署
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.HOST }}
    username: ubuntu
    key: ${{ secrets.SSH_KEY }}
    script: ./deploy.sh
```

#### 5.4.3 环境变量和密钥

```yaml
# 定义环境
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com

    steps:
      - name: 部署
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DB_HOST: ${{ secrets.DB_HOST }}
        run: ./deploy.sh
```

### 5.5 Protected Branch保护分支

#### 5.5.1 在GitHub设置保护分支

```bash
# 使用GitHub CLI配置
gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  -f required_status_checks='{"strict": true, "contexts": ["ci/test"]}' \
  -f enforcement="all" \
  -f dismiss_stale_reviews=true \
  -f require_code_owner_reviews=true \
  -f required_approving_review_count=2
```

#### 5.5.2 保护分支规则

| 规则 | 说明 |
|------|------|
| Require pull request | 必须通过PR才能合并 |
| Require approval | 需要指定数量的批准 |
| Dismiss reviews | 推送后自动解除批准 |
| Require status checks | 必须通过状态检查 |
| Require branches up to date | 必须与基础分支同步 |
| Restrict who can push | 限制谁可以推送 |
| Lock branch | 禁止任何推送 |

#### 5.5.3 在本地绕过保护（仅限紧急情况）

```bash
# 临时禁用保护（需要管理员权限）
# 在GitHub Settings > Branches > Unprotected

# 强制推送（极度谨慎）
git push --force-with-lease origin main
```

---

## 6. 团队协作

### 6.1 代码评审制度

#### 6.1.1 评审流程

```bash
# 1. 开发者完成功能开发
git checkout -b feature/user-auth
# ... 开发完成
git push -u origin feature/user-auth

# 2. 创建Pull Request
gh pr create --title "feat: 用户认证功能" \
  --reviewer @team-lead \
  --label "feature" \
  --milestone "v1.0"

# 3. 至少1-2人审查通过

# 4. 所有CI检查通过

# 5. 代码所有者批准

# 6. 合并PR
gh pr merge --squash
```

#### 6.1.2 评审时间要求

| 角色 | 响应时间 |
|------|----------|
| 审查者 | 24小时内响应 |
| 开发者 | 收到反馈后4小时内响应 |
| 合并 | 所有通过后24小时内 |

### 6.2 Commit Message规范

#### 6.2.1 Conventional Commits规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**：

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复bug |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构（不是新功能也不是修复） |
| perf | 性能优化 |
| test | 测试相关 |
| build | 构建相关 |
| ci | CI配置 |
| chore | 其他杂项 |

**Scope（可选）**：表示影响的模块

**Subject**：简短描述，不超过50字符

#### 6.2.2 Commit Message示例

```bash
# feat
git commit -m "feat(auth): 添加用户登录功能
支持邮箱和手机号登录"

# fix
git commit -m "fix(dashboard): 修复图表数据加载慢的问题
当数据量超过1000条时会触发性能问题"

# docs
git commit -m "docs: 更新API文档"

# refactor
git commit -m "refactor(user): 重构用户模块
提取公共方法到useUser hook"

# test
git commit -m "test: 添加登录模块单元测试"
```

#### 6.2.3 Commit Message验证

可以使用commitlint验证提交信息：

```bash
# 安装
npm install --save-dev @commitlint/config-conventional @commitlint/cli

# 配置文件 .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'subject-case': [2, 'never', ['sentence-case', 'start-case']],
  }
};
```

### 6.3 Git Hooks

#### 6.3.1 Git Hooks类型

```bash
# 客户端钩子
.git/hooks/
├── pre-commit              # 提交前执行
├── prepare-commit-msg      # 提交信息编辑前
├── commit-msg              # 提交信息验证
├── post-commit             # 提交完成后
├── pre-push                # 推送前
├── pre-rebase              # 变基前
├── post-checkout           # checkout后
├── post-merge              # 合并后
└── pre-receive             # 服务端接收前（远程）

# 触发时机
commit:     pre-commit -> prepare-commit-msg -> commit-msg -> post-commit
push:       pre-push -> pre-receive -> post-receive
rebase:     pre-rebase
checkout:   post-checkout
merge:      post-merge
```

#### 6.3.2 pre-commit钩子

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 阻止包含console.log的代码提交
if git diff --cached | grep -q 'console\.log'; then
  echo "错误: 不允许提交console.log"
  exit 1
fi

# 检查代码格式
npm run lint

# 运行单元测试
npm run test:quick

exit 0
```

#### 6.3.3 commit-msg钩子

```bash
#!/bin/bash
# .git/hooks/commit-msg

commit_msg=$(cat "$1")

# 检查提交信息是否为空
if [ -z "$commit_msg" ]; then
  echo "错误: 提交信息不能为空"
  exit 1
fi

# 验证 Conventional Commits 格式
if ! echo "$commit_msg" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+'; then
  echo "错误: 提交信息格式不符合规范"
  echo "格式: type(scope): subject"
  echo "类型: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  exit 1
fi

exit 0
```

#### 6.3.4 pre-push钩子

```bash
#!/bin/bash
# .git/hooks/pre-push

# 禁止直接推送到main分支
branch=$(git symbolic-ref --short HEAD)

if [ "$branch" = "main" ]; then
  echo "错误: 禁止直接推送到main分支，请通过Pull Request"
  exit 1
fi

# 运行完整测试
npm run test

exit 0
```

#### 6.3.5 使用Husky管理Hooks

```bash
# 安装husky
npm install --save-dev husky

# 初始化
npx husky install

# 添加钩子
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'

# 提交时自动启用
# 需要在package.json添加
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### 6.4 分支命名规范

#### 6.4.1 分支命名规则

```bash
# 命名格式
<type>/<ticket-id>-<short-description>

# 类型
feature/     # 新功能
bugfix/      # bug修复
hotfix/      # 紧急修复
release/     # 发布准备
docs/        # 文档更新
refactor/    # 重构
test/        # 测试相关
chore/       # 杂项

# 示例
feature/PROJ-123-user-login
bugfix/PROJ-456-fix-sidebar
hotfix/PROJ-789-critical-security
docs/PROJ-101-update-readme
```

#### 6.4.2 命名规范示例

```bash
# 功能开发
git checkout -b feature/PROJ-123-user-authentication
git checkout -b feature/PROJ-456-dashboard-redesign

# Bug修复
git checkout -b bugfix/PROJ-789-login-validation
git checkout -b bugfix/PROJ-101-memory-leak

# 紧急修复
git checkout -b hotfix/PROJ-202-security-patch

# 发布分支
git checkout -b release/v1.0.0

# 文档更新
git checkout -b docs/PROJ-303-api-documentation
```

### 6.5 团队Git流程设计

#### 6.5.1 团队工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                         团队Git流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 每日流程                                                │
│     ├── 拉取最新代码: git pull --rebase origin develop      │
│     ├── 创建功能分支: git checkout -b feature/PROJ-xxx      │
│     ├── 开发与提交: git commit -m "feat: ..."              │
│     ├── 推送: git push -u origin feature/PROJ-xxx          │
│     └── 创建PR: github.com → New Pull Request              │
│                                                             │
│  2. Code Review                                            │
│     ├── 至少1人审查通过                                      │
│     ├── 所有CI检查通过                                       │
│     └── 修复所有问题                                         │
│                                                             │
│  3. 合并流程                                                │
│     ├── Squash and Merge                                   │
│     ├── 删除功能分支                                         │
│     └── 更新本地develop                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 6.5.2 团队配置示例

```bash
# 团队Git配置示例
git config --local team.name "前端团队"
git config --local team.owner "tech-lead"

# 设置默认分支
git config --local init.defaultBranch main

# 设置pull策略
git config --local pull.rebase true

# 设置推送策略
git config --local push.default current

# 设置合并策略
git config --local merge.tool vimdiff
```

#### 6.5.3 团队规范文档

```markdown
# 团队Git规范 v1.0

## 分支管理

### 长期分支
- `main`: 生产环境代码，任何时候都可部署
- `develop`: 开发主分支，集成所有功能

### 短期分支
- `feature/PROJ-XXX-description`: 功能开发
- `bugfix/PROJ-XXX-description`: Bug修复
- `hotfix/PROJ-XXX-description`: 紧急修复
- `release/vX.X.X`: 发布准备

## 提交流范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例
```
feat(auth): 添加用户登录功能

实现了邮箱和密码登录
支持"记住我"功能

Closes #123
```

## PR要求

1. 必须有描述
2. 必须关联Issue
3. 必须通过所有CI检查
4. 必须有至少1人批准
5. 必须使用Squash Merge

## 审批流程

1. 作者提交PR
2. 指定审查者
3. 审查者24小时内响应
4. 所有问题解决后合并
5. 合并后删除分支
```

---

## 7. 实战练习

### 7.1 从零搭建Git工作流

#### 7.1.1 初始化项目仓库

```bash
# 1. 在GitHub创建一个新仓库
# 假设创建了 https://github.com/example/team-project

# 2. 本地初始化
mkdir team-project && cd team-project
git init

# 3. 设置用户信息（如果是公司项目，使用公司邮箱）
git config user.name "张三"
git config user.email "zhangsan@example.com"

# 4. 创建初始文件
echo "# 团队项目" > README.md
git add README.md
git commit -m "docs: 初始化项目"

# 5. 添加远程仓库
git remote add origin git@github.com:example/team-project.git

# 6. 推送初始代码
git push -u origin main

# 7. 创建develop分支
git checkout -b develop
git push -u origin develop

# 8. 设置保护分支（需要GitHub手动设置或在初始化脚本中）
# Settings > Branches > Protected branches
```

#### 7.1.2 配置团队成员访问

```bash
# 1. 团队成员克隆仓库
git clone git@github.com:example/team-project.git
cd team-project

# 2. 配置个人Git信息
git config user.name "李四"
git config user.email "lisi@example.com"

# 3. 设置pull时自动rebase
git config --global pull.rebase true

# 4. 设置默认推送策略
git config --global push.default current
```

#### 7.1.3 配置Git Hooks

```bash
# 1. 安装husky
npm init -y
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# 2. 初始化husky
npx husky install

# 3. 添加commit-msg钩子
npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'

# 4. 添加pre-commit钩子
npx husky add .husky/pre-commit 'npm run lint'

# 5. 在package.json添加prepare脚本
# npm pkg set scripts.prepare="husky install"
```

### 7.2 配置Git Hooks自动化检查

#### 7.2.1 ESLint pre-commit检查

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "运行 ESLint 检查..."

# 获取已暂存的文件
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx|vue)$')

if [ -z "$FILES" ]; then
  echo "没有需要检查的文件"
  exit 0
fi

# 对每个文件运行 ESLint
npx eslint --fix $FILES

# 重新暂存修改后的文件
echo "$FILES" | xargs git add

echo "ESLint 检查完成"
```

#### 7.2.2 Commit message验证

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo ""
  echo "错误: 提交信息格式不符合规范"
  echo ""
  echo "正确格式: <type>(<scope>): <subject>"
  echo "示例: feat(auth): 添加登录功能"
  echo ""
  echo "允许的类型:"
  echo "  feat     - 新功能"
  echo "  fix      - 修复bug"
  echo "  docs     - 文档更新"
  echo "  style    - 代码格式"
  echo "  refactor - 重构"
  echo "  perf     - 性能优化"
  echo "  test     - 测试"
  echo "  build    - 构建"
  echo "  ci       - CI配置"
  echo "  chore    - 杂项"
  echo "  revert   - 回退"
  exit 1
fi

echo "提交信息格式验证通过"
```

#### 7.2.3 推送前检查

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

branch=$(git symbolic-ref --short HEAD)

echo "当前分支: $branch"

# 禁止直接推送main分支
if [ "$branch" = "main" ]; then
  echo ""
  echo "错误: 禁止直接推送到main分支"
  echo "请通过Pull Request合并代码"
  exit 1
fi

# 检查是否有未提交的修改
if ! git diff-index --quiet HEAD --; then
  echo ""
  echo "警告: 有未提交的修改"
  exit 1
fi

# 运行测试
echo "运行测试..."
npm run test || {
  echo ""
  echo "错误: 测试失败"
  exit 1
}

echo "推送前检查通过"
```

### 7.3 团队协作冲突解决案例

#### 7.3.1 场景说明

```
背景：团队使用Git Flow工作流，develop是主开发分支

情况：
1. 张三在 feature/user-auth 分支上开发用户认证功能
2. 李四在 feature/payment 分支上开发支付功能
3. 两个分支都修改了 src/utils/api.ts 文件
4. 李四先合并到develop
5. 张三尝试合并时发生冲突
```

#### 7.3.2 解决过程

```bash
# === 张三的操作 ===

# 1. 确保develop是最新的
git checkout develop
git pull origin develop

# 2. 切换到自己的功能分支
git checkout feature/user-auth

# 3. 将develop合并到功能分支（提前解决冲突）
git merge develop

# 如果发生冲突，手动解决
# 打开 src/utils/api.ts 文件
# 解决冲突标记
# git add src/utils/api.ts
# git commit -m "merge: 解决与develop的冲突"

# 4. 推送功能分支
git push origin feature/user-auth

# 5. 创建Pull Request
gh pr create \
  --title "feat(auth): 用户认证功能" \
  --body "实现用户登录注册功能" \
  --reviewer tech-lead

# 6. Code Review过程中如果要求修改
# 修改后
git commit -am "fix: 根据审查意见修改"
git push

# 7. 合并后删除功能分支
git checkout develop
git pull
git branch -d feature/user-auth
git push origin --delete feature/user-auth
```

#### 7.3.3 冲突解决技巧

```bash
# 技巧1：使用vimdiff解决冲突
git config merge.tool vimdiff
git mergetool

# 技巧2：查看各版本的差异
git diff # 工作区 vs 暂存区
git diff HEAD # 工作区 vs HEAD
git diff --cached # 暂存区 vs HEAD

# 技巧3：使用theirs或ours策略
git checkout --theirs src/utils/api.ts  # 使用他们的版本
git checkout --ours src/utils/api.ts    # 使用我们的版本

# 技巧4：在rebase中解决冲突
git rebase -i develop
# 遇到冲突时
git add .
git rebase --continue

# 技巧5：放弃rebase
git rebase --abort
```

### 7.4 Git命令速查表

#### 7.4.1 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git init | 初始化仓库 | git init |
| git clone | 克隆仓库 | git clone url |
| git add | 添加到暂存区 | git add . |
| git commit | 提交 | git commit -m "msg" |
| git push | 推送 | git push |
| git pull | 拉取合并 | git pull |
| git fetch | 获取 | git fetch |

#### 7.4.2 分支命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git branch | 列出分支 | git branch -a |
| git checkout | 切换分支 | git checkout main |
| git switch | 切换分支(新) | git switch main |
| git checkout -b | 创建并切换 | git checkout -b feature |
| git switch -c | 创建并切换 | git switch -c feature |
| git branch -d | 删除分支 | git branch -d feature |
| git merge | 合并分支 | git merge feature |

#### 7.4.3 查看命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git log | 查看提交历史 | git log --oneline |
| git diff | 查看差异 | git diff |
| git status | 查看状态 | git status |
| git show | 查看对象 | git show abc123 |
| git blame | 查看文件行修改 | git blame file |
| git reflog | 查看引用日志 | git reflog |

#### 7.4.4 撤销命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git reset | 重置 | git reset --hard HEAD^ |
| git revert | 撤销提交 | git revert HEAD |
| git checkout | 检出文件 | git checkout -- file |
| git restore | 恢复文件 | git restore file |
| git stash | 暂存工作区 | git stash |

#### 7.4.5 高级命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git rebase | 变基 | git rebase main |
| git cherry-pick | 挑选提交 | git cherry-pick abc123 |
| git bisect | 二分查找 | git bisect start |
| git stash pop | 恢复stash | git stash pop |
| git tag | 管理标签 | git tag v1.0.0 |
| git submodule | 子模块 | git submodule add url |

#### 7.4.6 远程命令

| 命令 | 说明 | 示例 |
|------|------|------|
| git remote | 管理远程 | git remote -v |
| git remote add | 添加远程 | git remote add upstream url |
| git fetch | 获取远程 | git fetch origin |
| git pull --rebase | 拉取变基 | git pull --rebase |
| git push -u | 推送设置上游 | git push -u origin feature |
| git push --force | 强制推送 | git push --force |

---

## 附录

### A. Git配置示例

```bash
# ~/.gitconfig

[user]
  name = 张三
  email = zhangsan@example.com

[core]
  editor = vim
  autocrlf = input
  safecrlf = warn

[alias]
  st = status
  co = checkout
  br = branch
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --graph
  lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

[pull]
  rebase = true

[push]
  default = current

[merge]
  tool = vimdiff
  conflictstyle = diff3

[color]
  ui = auto

[init]
  defaultBranch = main
```

### B. .gitignore示例

```gitignore
# 依赖
node_modules/
.pnp
.pnp.js

# 构建
dist/
build/
.next/
out/

# 测试
coverage/
.nyc_output/

# 环境
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### C. Git Cheat Sheet

```
创建与初始化
────────────────────────────────
git init                      创建新仓库
git clone <url>               克隆仓库
git clone <url> <folder>     克隆到指定目录
git clone --depth 1 <url>     浅克隆

基本快照
────────────────────────────────
git add <file>                暂存文件
git add .                     暂存所有修改
git commit -m "message"       提交
git commit -am "message"      添加并提交已跟踪文件
git commit --amend            修改最后一次提交
git status                    查看状态

分支与合并
────────────────────────────────
git branch                    列出分支
git branch <name>             创建分支
git checkout <branch>         切换分支
git checkout -b <branch>      创建并切换
git switch <branch>           切换分支(新语法)
git switch -c <branch>        创建并切换
git merge <branch>            合并分支
git branch -d <branch>        删除分支

分享与更新
────────────────────────────────
git fetch                     获取远程更新
git pull                      拉取并合并
git push                      推送
git push -u origin <branch>   推送并设置上游
git remote -v                 查看远程仓库
git remote add <name> <url>   添加远程仓库

撤销
────────────────────────────────
git reset <file>              取消暂存
git checkout -- <file>        丢弃修改
git restore <file>           丢弃修改(新语法)
git revert <commit>           撤销提交
git reset --hard HEAD^        重置到上一次提交

查看历史
────────────────────────────────
git log                       查看提交历史
git log --oneline             简洁查看
git log --graph               图形化查看
git log -n <count>            查看最近N条
git diff                      查看未提交的修改
git diff --cached             查看已暂存的修改
git show <commit>             查看提交详情

高级操作
────────────────────────────────
git rebase <branch>           变基
git rebase -i HEAD~n          交互式变基
git cherry-pick <commit>      挑选提交
git stash                     暂存工作区
git stash pop                 恢复暂存
git bisect start              二分查找
git tag <name>                创建标签
git reflog                    查看引用日志

子模块
────────────────────────────────
git submodule add <url> <path> 添加子模块
git submodule init            初始化子模块
git submodule update          更新子模块
git submodule update --remote 更新远程子模块
```

---

**文档信息**

| 项目 | 说明 |
|------|------|
| 版本 | 2.0.0 |
| 创建日期 | 2024年 |
| 更新日期 | 2026年4月 |
| 作者 | 技术团队 |

**参考资料**

1. Pro Git book - https://git-scm.com/book/zh/v2
2. Git官方文档 - https://git-scm.com/docs
3. Conventional Commits - https://www.conventionalcommits.org/
4. Git Flow - https://nvie.com/posts/a-successful-git-branching-model/
5. GitHub Actions文档 - https://docs.github.com/actions
6. Husky文档 - https://typicode.github.io/husky/
