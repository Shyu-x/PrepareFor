# Rust Web 开发完全指南

## 前言：为什么选择 Rust？

想象一下，你要去建造一座房子。有两种建筑队可选：

**第一种**：建筑速度快，但经常出问题，需要反复返工（JavaScript/Python）
**第二种**：建筑速度稍慢，但第一次就造得稳稳当当，几乎不需要返工（Rust）

Rust 就是那种"慢工出细活"的语言。它在编译时就确保了内存安全，让你几乎不可能写出会导致崩溃或安全漏洞的代码。

### Rust 的核心优势

| 特性 | 传统 Web 语言 | Rust |
|------|-------------|------|
| 内存安全 | 运行时检查 | 编译时检查 |
| 性能 | 中等 | 接近 C/C++ |
| 并发安全 | 需要额外处理 | 所有权系统保证 |
| 运行时 | 需要 GC | 无运行时 |
| 编译后大小 | 较大 | 极小（WASM 友好） |

## 一、Rust 所有权系统：核心概念解析

### 1.1 什么是所有权？

Rust 的所有权系统是它最独特也最强大的特性。你可以把它想象成"物品追踪系统"：

**现实类比**：
- 你有一本书，你可以自己看，也可以借给别人
- 如果你把书借给了别人，你就不能同时拥有它
- 如果别人也把书借出去了，你需要等书还回来才能再借

Rust 的每个值都有一个"所有者"，只有所有者可以对值进行操作。

### 1.2 所有权规则

```rust
// Rust 所有权规则：
// 1. 每个值都有一个所有者
// 2. 同一时间只能有一个所有者
// 3. 当所有者离开作用域时，值会被丢弃（释放内存）

fn main() {
    // s1 是字符串的所有者
    let s1 = String::from("hello");

    // 这里 s2 获取了 s1 的所有权
    // 相当于把书借出去了，s1 不再拥有这本书
    let s2 = s1;

    // 错误！s1 已经不再拥有这个字符串了
    // println!("{}", s1);  // 编译错误！

    // s2 现在是唯一的所有者
    println!("{}", s2);  // 正常
}   // s2 离开作用域，字符串被释放
```

### 1.3 借用（References）

借用就像图书证的借阅：你只是临时查看书的内容，不需要拥有它。

```rust
fn main() {
    let s1 = String::from("hello");

    // & 表示借用（reference）
    // s2 只是借用 s1，不会获得所有权
    let len = calculate_length(&s1);

    // s1 仍然拥有这个字符串
    println!("'{}' 的长度是 {}", s1, len);  // 正常！
}

// 使用引用作为参数，不获取所有权
fn calculate_length(s: &String) -> usize {
    // s 是对 String 的借用
    // 我们可以读取 s，但不能修改它（除非声明为可变引用）
    s.len()
}   // s 离开作用域，但它只是借用的，所以我们不释放它
```

### 1.4 可变借用

如果需要修改借用的值，可以使用可变引用：

```rust
fn main() {
    let mut s = String::from("hello");

    // &mut 表示可变借用
    // 可以修改 s 的内容
    change(&mut s);

    println!("{}", s);  // 输出: hello, world
}

fn change(s: &mut String) {
    s.push_str(", world");
}
```

**可变引用的重要规则**：
- 在同一作用域内，只能有一个可变引用
- 或者有多个不可变引用，但不能同时有可变引用

```rust
fn main() {
    let mut s = String::from("hello");

    // 可变引用
    let r1 = &mut s;

    // 错误！在 r1 后面不能创建另一个可变引用
    // let r2 = &mut s;  // 编译错误！

    println!("{}", r1);

    // 在 r1 使用完毕后，才能创建新的可变引用
    let r2 = &mut s;  // 现在可以了
    r2.push_str("!");
}
```

这就像：你不能同时把同一本书借给多个人（可能会产生冲突），但等你用完了，别人就可以借了。

### 1.5 生命周期（Lifetime）

生命周期是 Rust 用来确保引用始终有效的机制。

```rust
// 这个函数返回的字符串字面量的生命周期
// 需要和输入参数的生命周期关联起来
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("最长的字符串是: {}", result);
        // s2 在这里还在作用域内
    }
    // s2 已经离开作用域，但 result 可能引用了它
    // 编译错误！result 可能指向了已经释放的内存
}
```

### 1.6 所有权系统的好处

| 好处 | 说明 | 类比 |
|------|------|------|
| 内存安全 | 编译时检查，永远不会有空指针或数据竞争 | 自动垃圾分类 |
| 无 GC | 内存随用随释放，没有垃圾回收暂停 | 手动挡 vs 自动挡 |
| 性能极致 | 没有运行时开销 | 原生性能 |
| 并发安全 | 编译时检查数据竞争 | 交通规则 |

## 二、Actix-web 框架快速入门

### 2.1 Actix-web 简介

Actix-web 是 Rust 生态中最流行的 Web 框架之一，以高性能著称。

**为什么选择 Actix-web？**

| 框架 | 语言 | 性能（Req/s）| 特点 |
|------|------|-------------|------|
| Actix-web | Rust | ~100万+ | 高性能、功能完整 |
| Axum | Rust | ~80万+ | 现代、async/await 优先 |
| Rocket | Rust | ~50万+ | 易于使用、类型安全 |
| Express | JavaScript | ~5万 | 生态丰富 |
| Django | Python | ~2万 | 全功能、Batteries included |

### 2.2 项目设置

**创建新项目：**

```bash
# 创建新的 Rust 项目
cargo new my_web_project
cd my_web_project

# 添加 Actix-web 依赖
cargo add actix-web
cargo add actix-rt          # 异步运行时
cargo add tokio --features full  # tokio 运行时
cargo add serde --features derive  # 序列化
cargo add serde_json         # JSON 处理
cargo add env_logger         # 日志
cargo add log                # 日志接口
```

**Cargo.toml 配置：**

```toml
[package]
name = "my_web_project"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web 框架
actix-web = "4"
actix-rt = "2"

# 异步运行时
tokio = { version = "1", features = ["full"] }

# 序列化
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# 日志
env_logger = "0.11"
log = "0.4"

# 异步特性
async-trait = "0.1"

[profile.release]
# 发布优化
opt-level = 3
lto = true
```

### 2.3 第一个 Actix-web 应用

```rust
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// ============ 数据结构定义 ============

/// 用户数据结构
#[derive(Serialize, Deserialize, Clone)]
struct User {
    id: u64,
    name: String,
    email: String,
}

/// 应用状态（共享数据）
struct AppState {
    users: Mutex<Vec<User>>,
    next_id: Mutex<u64>,
}

// ============ HTTP 处理器 ============

/// 首页处理器
async fn index() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "欢迎使用 Rust Web API",
        "version": "1.0.0",
        "endpoints": [
            "GET / - 首页",
            "GET /users - 获取所有用户",
            "GET /users/{id} - 获取指定用户",
            "POST /users - 创建用户",
            "PUT /users/{id} - 更新用户",
            "DELETE /users/{id} - 删除用户",
            "GET /health - 健康检查"
        ]
    }))
}

/// 健康检查
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

/// 获取所有用户
async fn get_users(data: web::Data<AppState>) -> impl Responder {
    let users = data.users.lock().unwrap().clone();
    HttpResponse::Ok().json(users)
}

/// 获取指定用户
async fn get_user(
    path: web::Path<u64>,
    data: web::Data<AppState>,
) -> impl Responder {
    let user_id = path.into_inner();
    let users = data.users.lock().unwrap();

    match users.iter().find(|u| u.id == user_id) {
        Some(user) => HttpResponse::Ok().json(user),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "用户不存在"
        })),
    }
}

/// 创建用户
async fn create_user(
    body: web::Json<User>,
    data: web::Data<AppState>,
) -> impl Responder {
    let mut new_user = body.into_inner();

    // 生成新 ID
    let mut next_id = data.next_id.lock().unwrap();
    new_user.id = *next_id;
    *next_id += 1;

    // 添加到用户列表
    let mut users = data.users.lock().unwrap();
    users.push(new_user.clone());

    HttpResponse::Created().json(new_user)
}

/// 更新用户
async fn update_user(
    path: web::Path<u64>,
    body: web::Json<User>,
    data: web::Data<AppState>,
) -> impl Responder {
    let user_id = path.into_inner();
    let updated_user = body.into_inner();

    let mut users = data.users.lock().unwrap();

    match users.iter_mut().find(|u| u.id == user_id) {
        Some(user) => {
            user.name = updated_user.name;
            user.email = updated_user.email;
            HttpResponse::Ok().json(user.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "用户不存在"
        })),
    }
}

/// 删除用户
async fn delete_user(
    path: web::Path<u64>,
    data: web::Data<AppState>,
) -> impl Responder {
    let user_id = path.into_inner();

    let mut users = data.users.lock().unwrap();
    let initial_len = users.len();

    users.retain(|u| u.id != user_id);

    if users.len() < initial_len {
        HttpResponse::Ok().json(serde_json::json!({
            "message": "用户已删除"
        }))
    } else {
        HttpResponse::NotFound().json(serde_json::json!({
            "error": "用户不存在"
        }))
    }
}

// ============ 主函数 ============

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    log::info!("启动 Rust Web 服务器...");

    // 初始化应用状态
    let app_state = web::Data::new(AppState {
        users: Mutex::new(vec![
            // 预置一些用户
            User {
                id: 1,
                name: String::from("张三"),
                email: String::from("zhangsan@example.com"),
            },
            User {
                id: 2,
                name: String::from("李四"),
                email: String::from("lisi@example.com"),
            },
        ]),
        next_id: Mutex::new(3),
    });

    log::info!("服务器运行在 http://127.0.0.1:8080");

    // 启动 HTTP 服务器
    HttpServer::new(move || {
        App::new()
            // 共享应用状态
            .app_data(app_state.clone())
            // 配置路由
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health_check))
            .route("/users", web::get().to(get_users))
            .route("/users", web::post().to(create_user))
            .route("/users/{id}", web::get().to(get_user))
            .route("/users/{id}", web::put().to(update_user))
            .route("/users/{id}", web::delete().to(delete_user))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

**运行服务器：**

```bash
# 开发模式运行
cargo run

# 服务器启动后，访问：
# GET http://127.0.0.1:8080/ - 首页
# GET http://127.0.0.1:8080/users - 获取所有用户
# POST http://127.0.0.1:8080/users - 创建用户
```

### 2.4 请求路由和路径参数

```rust
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

// ============ 路径参数 ============

/// 带类型的路径参数
async fn get_user_by_id(path: web::Path<i32>) -> impl Responder {
    let user_id = path.into_inner();
    HttpResponse::Ok().json(serde_json::json!({
        "user_id": user_id,
        "message": format!("获取用户 ID: {}", user_id)
    }))
}

/// 多个路径参数
async fn get_user_posts(
    path: web::Path<(i32, i32)>,  // (user_id, post_id)
) -> impl Responder {
    let (user_id, post_id) = path.into_inner();
    HttpResponse::Ok().json(serde_json::json!({
        "user_id": user_id,
        "post_id": post_id,
        "message": format!("获取用户 {} 的文章 {}", user_id, post_id)
    }))
}

/// 查询参数
#[derive(Deserialize)]
struct PaginationParams {
    page: Option<u32>,
    per_page: Option<u32>,
}

async fn list_articles(
    query: web::Query<PaginationParams>,
) -> impl Responder {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(10);

    HttpResponse::Ok().json(serde_json::json!({
        "page": page,
        "per_page": per_page,
        "items": [],
        "total": 0
    }))
}

// ============ 配置路由 ============

fn config_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            // 路径参数
            .route("/users/{id}", web::get().to(get_user_by_id))
            // 多个路径参数
            .route("/users/{user_id}/posts/{post_id}", web::get().to(get_user_posts))
            // 查询参数
            .route("/articles", web::get().to(list_articles))
    );
}
```

### 2.5 请求体和 JSON 处理

```rust
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============ 请求体结构 ============

/// 登录请求
#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

/// 注册请求
#[derive(Deserialize)]
struct RegisterRequest {
    username: String,
    email: String,
    password: String,
}

/// 用户响应
#[derive(Serialize)]
struct UserResponse {
    id: u64,
    username: String,
    email: String,
    token: Option<String>,
}

/// 统一响应结构
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    fn error(message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}

// ============ 处理器 ============

/// 登录
async fn login(body: web::Json<LoginRequest>) -> impl Responder {
    // 验证用户（这里只是示例）
    if body.username == "admin" && body.password == "password" {
        HttpResponse::Ok().json(ApiResponse::success(UserResponse {
            id: 1,
            username: body.username.clone(),
            email: "admin@example.com".to_string(),
            token: Some("fake-jwt-token".to_string()),
        }))
    } else {
        HttpResponse::Unauthorized().json(ApiResponse::<()>::error("用户名或密码错误"))
    }
}

/// 注册
async fn register(body: web::Json<RegisterRequest>) -> impl Responder {
    // 验证邮箱格式
    if !body.email.contains('@') {
        return HttpResponse::BadRequest().json(ApiResponse::<()>::error("无效的邮箱格式"));
    }

    // 验证密码长度
    if body.password.len() < 6 {
        return HttpResponse::BadRequest().json(ApiResponse::<()>::error("密码至少6个字符"));
    }

    // 创建用户（这里只是示例）
    HttpResponse::Created().json(ApiResponse::success(UserResponse {
        id: 999,
        username: body.username.clone(),
        email: body.email.clone(),
        token: None,
    }))
}

/// 批量创建（接收数组）
#[derive(Deserialize)]
struct BatchCreateRequest {
    items: Vec<CreateItem>,
}

#[derive(Deserialize)]
struct CreateItem {
    name: String,
    quantity: u32,
}

#[derive(Serialize)]
struct BatchCreateResponse {
    created: usize,
    ids: Vec<u64>,
}

async fn batch_create(
    body: web::Json<BatchCreateRequest>,
) -> impl Responder {
    let created = body.items.len();
    let ids: Vec<u64> = (1000..1000 + created as u64).collect();

    HttpResponse::Created().json(ApiResponse::success(BatchCreateResponse {
        created,
        ids,
    }))
}
```

## 三、Async Rust 与异步编程

### 3.1 同步 vs 异步

**同步编程**就像排队买电影票：你排在第一个人后面，必须等前面的人买完才能轮到你。

**异步编程**就像手机APP买票：你下单后可以去做其他事情，票买好了APP会通知你。

```rust
// ============ 同步版本 ============

use std::thread;
use std::time::Duration;

// 模拟耗时操作
fn fetch_user_sync(id: u64) -> String {
    thread::sleep(Duration::from_secs(1));  // 模拟网络请求
    format!("用户 {}", id)
}

fn main() {
    println!("开始...");

    // 顺序执行：每个请求都要等上一个完成
    let user1 = fetch_user_sync(1);  // 等 1 秒
    let user2 = fetch_user_sync(2);  // 再等 1 秒
    let user3 = fetch_user_sync(3);  // 再等 1 秒

    println!("{}", user1);
    println!("{}", user2);
    println!("{}", user3);
    // 总共 3 秒
}

// ============ 异步版本 ============

use tokio;

#[tokio::main]  // Tokio 运行时宏
async fn main() {
    println!("开始...");

    // 并发执行：所有请求同时进行
    let (user1, user2, user3) = tokio::join!(
        fetch_user_async(1),
        fetch_user_async(2),
        fetch_user_async(3),
    );

    println!("{}", user1);
    println!("{}", user2);
    println!("{}", user3);
    // 总共 ~1 秒（并行执行）
}

// 异步函数
async fn fetch_user_async(id: u64) -> String {
    tokio::time::sleep(Duration::from_secs(1)).await;  // 异步等待
    format!("用户 {}", id)
}
```

### 3.2 async/await 语法

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("=== async/await 示例 ===");

    // 等待单个 Future
    let result = do_something_async().await;
    println!("结果: {}", result);

    // 并发执行多个 Future
    let (a, b, c) = tokio::join!(
        async_operation("A", 1),
        async_operation("B", 2),
        async_operation("C", 3),
    );

    println!("A: {}", a);
    println!("B: {}", b);
    println!("C: {}", c);

    // 使用 join! 同时执行多个异步操作
    let results = tokio::join!(
        fetch_data("api/user/1"),
        fetch_data("api/user/2"),
        fetch_data("api/user/3"),
    );

    println!("所有数据: {:?}", results);
}

/// 基本的 async 函数
async fn do_something_async() -> String {
    sleep(Duration::from_millis(100)).await;
    "完成了！".to_string()
}

/// 带参数的 async 函数
async fn async_operation(name: &str, delay: u64) -> String {
    sleep(Duration::from_secs(delay)).await;
    format!("{} 完成", name)
}

/// 模拟 API 请求
async fn fetch_data(url: &str) -> String {
    sleep(Duration::from_millis(50)).await;
    format!("响应: {}", url)
}
```

### 3.3 使用 Arc 和 Mutex 进行共享状态

在异步代码中，状态共享需要特别小心：

```rust
use std::sync::{Arc, Mutex};
use tokio;

#[tokio::main]
async fn main() {
    println!("=== 共享状态示例 ===");

    // Arc：原子引用计数，多个所有者可以共享数据
    // Mutex：互斥锁，确保一次只有一个任务可以访问数据
    let counter = Arc::new(Mutex::new(0));

    // 创建多个任务来修改共享计数器
    let mut handles = vec![];

    for i in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = tokio::spawn(async move {
            // 获取锁
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("任务 {}: 当前计数 = {}", i, *num);
            // 锁在离开作用域时自动释放
        });
        handles.push(handle);
    }

    // 等待所有任务完成
    for handle in handles {
        handle.await.unwrap();
    }

    // 最终计数
    let final_count = *counter.lock().unwrap();
    println!("最终计数: {}", final_count);
}
```

### 3.4 数据库连接池（异步）

```rust
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;

// 数据库配置
const DATABASE_URL: &str = "postgres://user:password@localhost/mydb";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== 数据库连接池示例 ===");

    // 创建连接池
    let pool = PgPoolOptions::new()
        .max_connections(10)           // 最大连接数
        .min_connections(2)           // 最小连接数
        .acquire_timeout(Duration::from_secs(30))  // 获取连接超时
        .idle_timeout(Duration::from_secs(600))   // 空闲连接超时
        .max_lifetime(Duration::from_secs(1800))   // 连接最大生命周期
        .connect(DATABASE_URL)
        .await?;

    println!("数据库连接池已建立");

    // 执行查询（自动从池中获取连接）
    let row: (i64,) = sqlx::query_as("SELECT $1")
        .bind(42_i64)
        .fetch_one(&pool)
        .await?;

    println!("查询结果: {}", row.0);

    // 执行多个查询（复用连接）
    let users = sqlx::query_as::<_, (i64, String, String)>(
        "SELECT id, name, email FROM users LIMIT 10"
    )
    .fetch_all(&pool)
    .await?;

    for (id, name, email) in users {
        println!("用户 {}: {} <{}>", id, name, email);
    }

    // 关闭连接池
    pool.close().await;

    Ok(())
}
```

## 四、Rust 编译到 WebAssembly

### 4.1 为什么 Rust 是 WASM 的最佳选择？

| 特性 | Rust | C/C++ | Go |
|------|------|-------|-----|
| 内存安全 | ✓ 编译时 | ✗ 手动 | ✓ 编译时 |
| 零成本抽象 | ✓ | ✓ | ✗ 有GC开销 |
| WASM 体积 | 极小 | 小 | 较大 |
| 工具链 | wasm-pack | Emscripten | TinyGo |
| 生态 | growing | mature | growing |

### 4.2 项目配置

```toml
# Cargo.toml
[package]
name = "my-wasm-lib"
version = "0.1.0"
edition = "2021"

# 关键：生成 cdylib（动态库，用于 WASM）
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
# WASM 和 JS 之间的桥梁
wasm-bindgen = "0.2"

# Web API 绑定
web-sys = { version = "0.3", features = [
    "console",
    "Window",
    "Document",
    "HtmlElement",
    "CanvasRenderingContext2d",
] }

# 异步运行时（如果需要）
js-sys = "0.3"

[dependencies.web-sys]
version = "0.3"
features = ["console", "Window", "Document", "Element", "HtmlElement"]

# 发布优化
[profile.release]
opt-level = "s"     # 优化体积
lto = true          # 链接时优化
panic = "abort"     # 使用 abort 减少体积
```

### 4.3 编写 WASM 库

```rust
use wasm_bindgen::prelude::*;

// ============ 基础数学函数 ============

/// 导出给 JS 使用的加法函数
#[wasm_bindgen]
pub fn add(a: f64, b: f64) -> f64 {
    a + b
}

/// 斐波那契数列（递归）
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

/// 快速斐波那契（迭代版本）
#[wasm_bindgen]
pub fn fibonacci_iter(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }

    let mut a = 0;
    let mut b = 1;

    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }

    b
}

// ============ 数据处理 ============

/// 计算数组平均值
#[wasm_bindgen]
pub fn calculate_average(data: &[f64]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    let sum: f64 = data.iter().sum();
    sum / data.len() as f64
}

/// 计算数组标准差
#[wasm_bindgen]
pub fn calculate_std_dev(data: &[f64]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }

    let mean = calculate_average(data);
    let variance: f64 = data.iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / data.len() as f64;

    variance.sqrt()
}

/// 线性回归
#[wasm_bindgen]
pub struct LinearRegression {
    slope: f64,
    intercept: f64,
}

#[wasm_bindgen]
impl LinearRegression {
    /// 创建线性回归模型（最小二乘法）
    #[wasm_bindgen]
    pub fn new(x: &[f64], y: &[f64]) -> Self {
        let n = x.len() as f64;
        if n == 0.0 {
            return LinearRegression { slope: 0.0, intercept: 0.0 };
        }

        let sum_x: f64 = x.iter().sum();
        let sum_y: f64 = y.iter().sum();
        let sum_xy: f64 = x.iter().zip(y.iter()).map(|(a, b)| a * b).sum();
        let sum_xx: f64 = x.iter().map(|a| a * a).sum();

        let denominator = n * sum_xx - sum_x * sum_x;
        if denominator == 0.0 {
            return LinearRegression { slope: 0.0, intercept: sum_y / n };
        }

        let slope = (n * sum_xy - sum_x * sum_y) / denominator;
        let intercept = (sum_y - slope * sum_x) / n;

        LinearRegression { slope, intercept }
    }

    /// 预测
    #[wasm_bindgen]
    pub fn predict(&self, x: f64) -> f64 {
        self.slope * x + self.intercept
    }

    /// 获取斜率
    #[wasm_bindgen]
    pub fn get_slope(&self) -> f64 { self.slope }

    /// 获取截距
    #[wasm_bindgen]
    pub fn get_intercept(&self) -> f64 { self.intercept }
}

// ============ 图像处理（简化版）============

/// 将图片数据转换为灰度
#[wasm_bindgen]
pub fn to_grayscale(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut result = Vec::with_capacity((width * height * 4) as usize);

    for chunk in data.chunks(4) {
        if chunk.len() >= 4 {
            // 计算灰度值（使用 luminance 公式）
            let gray = (0.299 * chunk[0] as f32
                + 0.587 * chunk[1] as f32
                + 0.114 * chunk[2] as f32) as u8;

            result.push(gray);  // R
            result.push(gray);  // G
            result.push(gray);  // B
            result.push(chunk[3]);  // A（透明度保持不变）
        }
    }

    result
}

/// 调整亮度
#[wasm_bindgen]
pub fn adjust_brightness(data: &[u8], amount: i32) -> Vec<u8> {
    data.iter()
        .enumerate()
        .map(|(i, &pixel)| {
            if i % 4 == 3 {
                // Alpha 通道不变
                pixel
            } else {
                // 调整 RGB
                let new_value = pixel as i32 + amount;
                new_value.clamp(0, 255) as u8
            }
        })
        .collect()
}
```

### 4.4 编译和发布

```bash
# 安装 wasm-pack（Rust 到 WASM 的编译工具）
cargo install wasm-pack

# 或者使用 wasm-bindgen-cli
cargo install wasm-bindgen-cli

# 编译为 WASM（开发模式）
wasm-pack build --target web

# 编译为 WASM（发布模式，优化）
wasm-pack build --target web --release

# 编译产物在 pkg/ 目录
# 包含：
# - my_wasm_lib_bg.wasm（编译后的 WASM 二进制）
# - my_wasm_lib.js（JS 胶水代码）
# - my_wasm_lib.d.ts（TypeScript 类型定义）
```

### 4.5 JavaScript 中使用

```javascript
// 动态导入 WASM 模块
async function initWasm() {
    // 方式1：使用 wasm-pack 生成的模块
    const wasm = await import('./pkg/my_wasm_lib');

    // 初始化 WASM
    await wasm.default();

    // 调用导出的函数
    console.log('10 + 20 =', wasm.add(10, 20));
    console.log('斐波那契(10) =', wasm.fibonacci(10));
    console.log('快速斐波那契(100) =', wasm.fibonacci_iter(100));

    // 使用线性回归
    const x = [1.0, 2.0, 3.0, 4.0, 5.0];
    const y = [2.1, 4.0, 5.9, 8.1, 10.2];
    const model = new wasm.LinearRegression(x, y);

    console.log('斜率:', model.get_slope());
    console.log('截距:', model.get_intercept());
    console.log('预测 x=6 的 y 值:', model.predict(6));

    // 数组处理
    const numbers = [1.0, 2.0, 3.0, 4.0, 5.0];
    console.log('平均值:', wasm.calculate_average(numbers));
    console.log('标准差:', wasm.calculate_std_dev(numbers));

    return wasm;
}

// 在 HTML 中使用
/*
<script type="module">
    const wasm = await initWasm();

    // 图像处理示例
    const imageData = ...; // 从 Canvas 获取
    const grayscale = wasm.to_grayscale(
        imageData.data,
        imageData.width,
        imageData.height
    );

    // 显示处理后的图像
    ...
</script>
*/
```

## 五、实战项目：RESTful API 服务

### 5.1 项目结构

```
rust-web-api/
├── Cargo.toml
├── src/
│   ├── main.rs              # 应用入口
│   ├── config.rs            # 配置管理
│   ├── db.rs                # 数据库连接
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── mod.rs           # 用户处理
│   │   ├── posts.rs         # 文章处理
│   │   └── auth.rs          # 认证处理
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── post.rs
│   ├── middleware/
│   │   ├── mod.rs
│   │   └── auth.rs          # JWT 认证中间件
│   └── errors.rs            # 错误处理
└── tests/
    └── api_tests.rs
```

### 5.2 完整代码实现

```rust
// src/main.rs

use actix_web::{web, App, HttpServer, middleware};
use std::env;

// 模块声明
mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;

use handlers::{auth, posts, users};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // 加载配置
    let config = config::AppConfig::from_env();

    log::info!("启动服务器: http://{}:{}", config.host, config.port);
    log::info!("数据库: {}", config.database_url);

    // 启动服务器
    HttpServer::new(|| {
        App::new()
            // 全局中间件
            .wrap(middleware::Logger::default())  // 日志
            .wrap(middleware::Compress::default())  // 压缩
            // 共享状态（数据库连接池等）
            .app_data(web::Data::new(db::create_pool()))
            // 配置路由
            .configure(config_routes)
    })
    .bind((config.host.as_str(), config.port))?
    .run()
    .await
}

/// 配置所有路由
fn config_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // 公开路由
        .service(
            web::scope("/api/v1")
                // 认证
                .route("/auth/register", web::post().to(auth::register))
                .route("/auth/login", web::post().to(auth::login))
                // 用户
                .route("/users", web::get().to(users::list_users))
                .route("/users/{id}", web::get().to(users::get_user))
        )
        // 受保护的路由（需要 JWT）
        .service(
            web::scope("/api/v1/protected")
                .wrap(middleware::from_fn(middleware::auth_middleware))
                // 用户管理
                .route("/users", web::post().to(users::create_user))
                .route("/users/{id}", web::put().to(users::update_user))
                .route("/users/{id}", web::delete().to(users::delete_user))
                // 文章
                .route("/posts", web::get().to(posts::list_posts))
                .route("/posts", web::post().to(posts::create_post))
                .route("/posts/{id}", web::get().to(posts::get_post))
                .route("/posts/{id}", web::put().to(posts::update_post))
                .route("/posts/{id}", web::delete().to(posts::delete_post))
        )
        // 健康检查（不需要认证）
        .route("/health", web::get().to(handlers::health_check));
}
```

### 5.3 错误处理

```rust
// src/errors.rs

use actix_web::{HttpResponse, ResponseError};
use std::fmt;

/// 自定义错误类型
#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    InternalError(String),
    DatabaseError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NotFound(msg) => write!(f, "Not Found: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            AppError::InternalError(msg) => write!(f, "Internal Error: {}", msg),
            AppError::DatabaseError(msg) => write!(f, "Database Error: {}", msg),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status, error_type, message) = match self {
            AppError::NotFound(msg) =>
                (actix_web::http::StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::BadRequest(msg) =>
                (actix_web::http::StatusCode::BAD_REQUEST, "BAD_REQUEST", msg.clone()),
            AppError::Unauthorized(msg) =>
                (actix_web::http::StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg.clone()),
            AppError::Forbidden(msg) =>
                (actix_web::http::StatusCode::FORBIDDEN, "FORBIDDEN", msg.clone()),
            AppError::InternalError(msg) =>
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg.clone()),
            AppError::DatabaseError(msg) =>
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", msg.clone()),
        };

        HttpResponse::build(status).json(serde_json::json!({
            "error": error_type,
            "message": message,
        }))
    }
}

// 简化错误创建
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}
```

## 六、性能优化技巧

### 6.1 编译优化

```toml
# Cargo.toml

[profile.release]
# 优化级别：s=体积优先，z=代码体积优先，3=速度优先
opt-level = 3

# 链接时优化（整个程序一起优化）
lto = true
# 或使用 thin LTO（更快的编译，稍大的体积）
# lto = "thin"

# 启用增量编译
incremental = true

# 跳过调试信息（减小体积）
strip = true

# Panic 时中止（减小体积）
panic = "abort"

# 优化宏展开
codegen-units = 1  # 减少并行编译单元以获得更好的优化
```

### 6.2 运行时优化

```rust
use std::hint::black_box;

// ============ 避免不必要的分配 ============

// ❌ 低效：每次调用都分配新字符串
fn bad_format(name: &str) -> String {
    format!("Hello, {}!", name)
}

// ✅ 高效：使用 &str 避免分配
fn good_format(name: &str) -> String {
    // 如果可能，使用 String::from 或直接返回 &str
    if name.is_empty() {
        "Hello, World!"
    } else {
        // 这种情况下必须分配
        String::from("Hello, ") + name + "!"
    }
}

// ============ 使用黑盒函数防止优化 ============

fn performance_critical_function(data: &[u64]) -> u64 {
    let mut sum = 0u64;

    for &value in data {
        // 使用 black_box 告诉编译器不要优化掉这个计算
        let value = black_box(value);
        sum += value;
    }

    sum
}

// ============ 使用迭代器而不是循环 ============

// ❌ 低效：多次迭代
fn inefficient_sum(data: &[i32]) -> i32 {
    let positive: Vec<i32> = data.iter().filter(|&&x| x > 0).cloned().collect();
    let negative: Vec<i32> = data.iter().filter(|&&x| x < 0).cloned().collect();
    positive.iter().sum::<i32>() - negative.iter().sum::<i32>()
}

// ✅ 高效：单次迭代
fn efficient_sum(data: &[i32]) -> i32 {
    data.iter().fold(0, |acc, &x| acc + x.signum() * x)
}

// ============ 使用 Vec::with_capacity 预分配 ============

fn inefficient_collect(n: usize) -> Vec<i32> {
    (0..n).map(|i| i as i32 * 2).collect()
}

fn efficient_collect(n: usize) -> Vec<i32> {
    let mut result = Vec::with_capacity(n);
    for i in 0..n {
        result.push(i as i32 * 2);
    }
    result
}
```

## 七、学习路径与资源

### Rust Web 开发学习路线

```
第一阶段：Rust 基础（2-3周）
├── Rust 安装和工具链
├── 所有权系统
├── 生命周期
├── 错误处理
└── 泛型和 trait

第二阶段：Web 开发（2-3周）
├── Actix-web 框架
├── 路由和中间件
├── 请求/响应处理
├── 数据库集成
└── 认证和授权

第三阶段：异步编程（2-3周）
├── async/await 语法
├── Tokio 运行时
├── 并发编程
└── 流和数据流

第四阶段：WASM（1-2周）
├── wasm-bindgen
├── wasm-pack
├── JavaScript 互调
└── 性能优化

第五阶段：实战项目（4-8周）
├── RESTful API 开发
├── 实时应用
├── 前端 WASM 模块
└── 微服务架构
```

### 推荐资源

- [The Rust Programming Language](https://doc.rust-lang.org/book/) - 官方书籍
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 示例学习
- [Actix-web 文档](https://actix.rs/docs/) - 框架文档
- [Rust WASM 文档](https://rustwasm.github.io/docs/) - WASM 开发
- [tokio.rs](https://tokio.rs/tokio/tutorial) - 异步编程教程

---

> Rust 可能看起来很难，但它值得投资。一旦你掌握了所有权系统和借用检查器，你就能写出既安全又高性能的代码。
