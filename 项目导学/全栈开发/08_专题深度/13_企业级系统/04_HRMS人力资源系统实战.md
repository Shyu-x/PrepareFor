# HRMS人力资源系统实战

## 一、系统概述与核心概念

### 1.1 什么是人力资源管理？

想象一下，你开了一家小公司，一开始只有5个人。员工的工资是你用Excel算的，请假是你口头批准的，考核是你凭感觉打的。但是公司慢慢变大了：

- **10个人**：你还能记住每个人的情况
- **50个人**：开始需要记录每个人的入职时间、工资、请假
- **200个人**：需要专门的HR部门来处理招聘、培训、考核、离职
- **1000个人**：没有系统根本无法管理，几百人的档案、工资、考勤...

**人力资源管理（HRM）** 就是管人的艺术和技术。包括：
- 招什么人？多少钱招？
- 怎么发工资？按什么标准？
- 员工干得好不好？怎么考核？
- 谁能升职？谁该培训？

**HRMS（Human Resource Management System，人力资源管理系统）** 就是把这些管理实践电子化、系统化的工具。

### 1.2 HRMS系统的核心领域

| 核心模块 | 解决的问题 | 业务价值 |
|----------|------------|----------|
| **员工档案** | 员工信息分散、查找困难 | 统一管理、随时查询 |
| **招聘管理** | 招聘流程混乱、简历筛选困难 | 提升效率、降低成本 |
| **考勤薪酬** | 打卡混乱、工资计算复杂 | 自动核算、减少错误 |
| **绩效考核** | 考核主观、缺乏标准 | 客观公正、激励员工 |
| **培训管理** | 培训无体系、效果难评估 | 提升能力、留住人才 |

### 1.3 人力资源管理数字化成熟度

```
┌─────────────────────────────────────────────────────────────────┐
│                    人力资源数字化成熟度模型                        │
├─────────────────────────────────────────────────────────────────┤
│ Level 1: 手工时代                                               │
│   - 所有流程靠纸笔Excel                                         │
│   - 信息分散在各个HR手中                                        │
│                                                                 │
│ Level 2: 基础系统                                               │
│   - 员工档案电子化                                             │
│   - 工资通过Excel计算                                           │
│   - 考勤用打卡机                                                 │
│                                                                 │
│ Level 3: 集成系统                                               │
│   - 各模块数据打通                                              │
│   - 流程在线审批                                                 │
│   - 基础报表分析                                                 │
│                                                                 │
│ Level 4: 智能系统                                               │
│   - AI简历筛选                                                   │
│   - 智能排班优化                                                 │
│   - 人才画像与发展建议                                           │
│                                                                 │
│ Level 5: 生态平台                                               │
│   - 员工自助服务                                                │
│   - 产业链人才共享                                              │
│   - 实时 workforce analytics                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 二、数据库设计与数据模型

### 2.1 核心数据表设计

```sql
-- ============================================
-- HRMS人力资源系统 - 核心数据表设计
-- ============================================

-- ============================================
-- 组织架构管理
-- ============================================

-- 员工主表
-- 这是HR系统最核心的表，存储员工的所有基本信息
CREATE TABLE employees (
    id                  BIGSERIAL PRIMARY KEY,

    -- 工号和基本信息
    employee_code       VARCHAR(50) UNIQUE NOT NULL,      -- 工号，如 "EMP20240001"
    chinese_name        VARCHAR(100) NOT NULL,            -- 中文名
    english_name        VARCHAR(100),                      -- 英文名
    gender              VARCHAR(10),                        -- 性别：male/female/other
    birth_date          DATE,                              -- 出生日期
    id_card_number      VARCHAR(18),                       -- 身份证号
    id_card_address     VARCHAR(500),                      -- 身份证地址
    nationality         VARCHAR(50) DEFAULT '中国',         -- 国籍
    ethnicity           VARCHAR(20),                        -- 民族
    marital_status      VARCHAR(20),                        -- 婚姻状况

    -- 联系方式
    phone              VARCHAR(50),                        -- 手机号
    personal_email     VARCHAR(100),                       -- 个人邮箱
    company_email      VARCHAR(100),                       -- 公司邮箱
    emergency_contact  VARCHAR(100),                        -- 紧急联系人
    emergency_phone    VARCHAR(50),                        -- 紧急联系人电话

    -- 家庭住址
    province           VARCHAR(50),
    city               VARCHAR(50),
    district           VARCHAR(50),
    address            VARCHAR(500),

    -- 照片
    avatar_url         VARCHAR(500),                       -- 头像URL
    id_card_front_url  VARCHAR(500),                       -- 身份证正面
    id_card_back_url   VARCHAR(500),                       -- 身份证背面

    -- 学历信息
    education_level    VARCHAR(20),                        -- 学历：本科/硕士/博士
    graduate_school    VARCHAR(200),                       -- 毕业院校
    major              VARCHAR(100),                       -- 专业
    graduation_date    DATE,                               -- 毕业日期

    -- 银行账户
    bank_name          VARCHAR(100),                       -- 开户银行
    bank_account       VARCHAR(50),                        -- 银行账号
    bank_account_name  VARCHAR(100),                       -- 开户姓名

    -- 社保账户
    social_security_no VARCHAR(50),                        -- 社保账号
    provident_fund_no  VARCHAR(50),                       -- 公积金账号

    -- 入职信息
    hire_date          DATE NOT NULL,                      -- 入职日期
    contract_start_date DATE,                              -- 合同开始日期
    contract_end_date  DATE,                              -- 合同结束日期
    contract_type      VARCHAR(20),                        -- 合同类型：固定期限/无固定期限
   试用期 months       INTEGER,                            -- 试用期月数
    conversion_date    DATE,                               -- 转正日期

    -- 职位信息
    position_id        BIGINT,                            -- 职位ID
    position_name      VARCHAR(100),                      -- 职位名称
    job_level          VARCHAR(20),                       -- 职级：P1-P10/M1-M5
    job_title          VARCHAR(100),                       -- 职称：高级工程师/工程师

    -- 组织信息
    department_id      BIGINT,                            -- 部门ID
    department_name    VARCHAR(100),                      -- 部门名称
    company_id         BIGINT,                            -- 公司ID
    company_name       VARCHAR(200),                      -- 公司名称
    cost_center        VARCHAR(50),                       -- 成本中心

    -- 工作地点
    work_location      VARCHAR(100),                     -- 工作城市
    office_location    VARCHAR(100),                      -- 办公地点

    -- 上级信息
    manager_id        BIGINT,                            -- 直接主管ID
    manager_name      VARCHAR(100),                       -- 主管姓名

    -- 员工类型
    employee_type     VARCHAR(20),                       -- employee/intern/part_time/c consultant
    employment_status VARCHAR(20),                        -- active/onboarding/leave/terminated

    -- 离职信息（如果已离职）
    termination_date   DATE,                              -- 离职日期
    termination_type   VARCHAR(50),                       -- 离职类型：主动离职/被动离职
    termination_reason TEXT,                               -- 离职原因

    -- 离职去向
    next_employer     VARCHAR(200),                      -- 下家
    exit_interview    TEXT,                               -- 离职面谈记录

    -- 系统字段
    creator_id        BIGINT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id         BIGINT NOT NULL
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);

-- ============================================
-- 部门组织表
-- ============================================
CREATE TABLE departments (
    id                  BIGSERIAL PRIMARY KEY,
    dept_code          VARCHAR(50) UNIQUE NOT NULL,
    dept_name          VARCHAR(100) NOT NULL,
    parent_id          BIGINT,                            -- 上级部门ID

    -- 组织层级
    level              INTEGER DEFAULT 1,                -- 部门层级
    path               VARCHAR(500),                     -- 路径，如 "/1/2/5/"
    -- path 格式："/1/2/5/" 表示从根部门到当前部门的路径

    -- 部门信息
    dept_manager_id    BIGINT,                           -- 部门负责人
    dept_manager_name  VARCHAR(100),
    headcount          INTEGER DEFAULT 0,                -- 编制人数
    current_headcount  INTEGER DEFAULT 0,                -- 当前人数

    -- 部门属性
    dept_type          VARCHAR(20),                       -- 部门类型：成本中心/利润中心
    business_unit      VARCHAR(100),                      -- 业务单元
    cost_center_code   VARCHAR(50),                       -- 成本中心代码

    -- 状态
    status             VARCHAR(20) DEFAULT 'active',

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 招聘管理
-- ============================================

-- 职位发布表
CREATE TABLE job_postings (
    id                  BIGSERIAL PRIMARY KEY,
    posting_code       VARCHAR(50) UNIQUE NOT NULL,

    -- 职位基本信息
    job_title          VARCHAR(200) NOT NULL,            -- 职位名称
    job_description     TEXT,                             -- 职位描述
    job_requirements    TEXT,                             -- 任职要求
    job_responsibilities TEXT,                           -- 岗位职责

    -- 职位类型
    employment_type     VARCHAR(20),                      -- 全职/兼职/实习/外包
    job_category        VARCHAR(50),                      -- 职位类别：技术/产品/运营/职能

    -- 工作地点和薪资
    work_city           VARCHAR(50),                      -- 工作城市
    work_address        VARCHAR(500),                     -- 具体地址
    salary_min          INTEGER,                          -- 薪资下限（月薪）
    salary_max          INTEGER,                          -- 薪资上限（月薪）
    salary_currency     VARCHAR(10) DEFAULT 'CNY',         -- 币种
    salary_visible      BOOLEAN DEFAULT true,             -- 薪资是否公开

    -- 需求信息
    hiring_manager_id   BIGINT,                           -- 招聘负责人HR
    hiring_manager_name VARCHAR(100),
    department_id       BIGINT,                           -- 用人部门
    department_name     VARCHAR(100),
    headcount          INTEGER DEFAULT 1,                -- 招聘人数
    filled_count       INTEGER DEFAULT 0,                -- 已录用人数

    -- 时间安排
    posting_date       DATE,                             -- 发布日期
    expiry_date        DATE,                             -- 截止日期
    expected_start_date DATE,                            -- 期望到岗日期

    -- 候选人来源
    candidate_source   VARCHAR(50),                      -- 候选人来源：招聘网站/内推/猎头/校园

    -- 状态
    status             VARCHAR(20) DEFAULT 'open',       -- open/paused/closed/filled

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 候选人表
CREATE TABLE candidates (
    id                  BIGSERIAL PRIMARY KEY,
    candidate_code     VARCHAR(50) UNIQUE NOT NULL,

    -- 基本信息
    chinese_name        VARCHAR(100),
    english_name        VARCHAR(100),
    gender              VARCHAR(10),
    birth_date          DATE,
    phone               VARCHAR(50),
    email               VARCHAR(100),

    -- 学历信息
    highest_education   VARCHAR(20),                     -- 最高学历
    graduate_school     VARCHAR(200),                     -- 毕业院校
    major               VARCHAR(100),                     -- 专业

    -- 当前状态
    current_company     VARCHAR(200),                     -- 当前公司
    current_position     VARCHAR(100),                     -- 当前职位
    current_salary       INTEGER,                         -- 当前薪资
    expected_salary      INTEGER,                         -- 期望薪资

    -- 简历信息
    resume_url          VARCHAR(500),                     -- 简历URL
    resume_parsed       JSONB,                             -- 解析后的简历结构化数据

    -- 来源
    source              VARCHAR(50),                      -- 来源：网站/内推/猎头/校园/其他
    referral_employee_id BIGINT,                          -- 内推人员

    -- 渠道追踪
    channel_details     JSONB,                            -- 渠道详情

    -- 面试官评价摘要
    avg_interview_score  DECIMAL(3,1),                    -- 平均面试评分
    interview_feedback  TEXT[],                           -- 面试反馈摘要

    -- 综合评估
    overall_assessment  TEXT,                             -- 综合评价
    final_decision      VARCHAR(20),                      -- 最终决定：hired/rejected/offered/declined

    -- 状态
    current_stage       VARCHAR(50),                      -- 当前阶段：new/screening/interview/offer/ hired
    status              VARCHAR(20) DEFAULT 'active',

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 招聘流程记录表
CREATE TABLE recruitment_records (
    id                  BIGSERIAL PRIMARY KEY,
    candidate_id       BIGINT NOT NULL,
    job_posting_id     BIGINT NOT NULL,

    -- 流程信息
    stage              VARCHAR(50) NOT NULL,             -- 阶段：new/screening/笔试/初试/复试/终面/offer/背调
    stage_name         VARCHAR(100),

    -- 面试信息
    interviewer_id     BIGINT,                            -- 面试官ID
    interviewer_name   VARCHAR(100),

    -- 时间和地点
    scheduled_at       TIMESTAMP,                         -- 计划时间
    actual_at          TIMESTAMP,                          -- 实际时间
    location           VARCHAR(200),                      -- 面试地点
    meeting_link       VARCHAR(500),                       -- 视频会议链接

    -- 面试结果
    score              DECIMAL(3,1),                      -- 评分
    decision           VARCHAR(20),                       -- 通过/不通过/待定
    feedback           TEXT,                              -- 面试反馈
    strengths          TEXT[],                            -- 优势
    concerns           TEXT[],                            -- 顾虑

    -- offer信息
    offer_id           BIGINT,                            -- 关联的offer

    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id          BIGINT NOT NULL
);

-- ============================================
-- 考勤管理
-- ============================================

-- 排班表
CREATE TABLE work_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    employee_id        BIGINT NOT NULL,
    employee_code      VARCHAR(50),
    employee_name      VARCHAR(100),

    -- 班次信息
    schedule_date       DATE NOT NULL,                    -- 排班日期
    shift_type          VARCHAR(20) NOT NULL,              -- 班次类型：day/night/swift
    shift_name          VARCHAR(100),                      -- 班次名称：早班/中班/晚班

    -- 上班时间
    work_start_time    TIME,                              -- 上班时间
    work_end_time      TIME,                              -- 下班时间
    work_hours         DECIMAL(4,1),                      -- 工作时长

    -- 休息时间
    break_start_time   TIME,                              -- 休息开始
    break_end_time     TIME,                              -- 休息结束
    break_hours        DECIMAL(4,1),                      -- 休息时长

    -- 是否工作日
    is_workday         BOOLEAN DEFAULT true,             -- 是否工作日
    is_holiday         BOOLEAN DEFAULT false,            -- 是否节假日
    holiday_name       VARCHAR(100),                      -- 节假日名称

    -- 加班标记
    is_overtime        BOOLEAN DEFAULT false,
    overtime_hours     DECIMAL(4,1),                      -- 加班时长

    -- 审批状态
    status             VARCHAR(20) DEFAULT 'confirmed',    -- confirmed/changed/cancelled

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 请假申请表
CREATE TABLE leave_requests (
    id                  BIGSERIAL PRIMARY KEY,
    leave_code         VARCHAR(50) UNIQUE NOT NULL,

    -- 申请人
    employee_id        BIGINT NOT NULL,
    employee_code      VARCHAR(50),
    employee_name      VARCHAR(100),
    department_id       BIGINT,
    department_name    VARCHAR(100),
    position_name      VARCHAR(100),

    -- 请假类型
    leave_type         VARCHAR(30) NOT NULL,              -- 年假/病假/事假/婚假/产假/陪产假/丧假/其他
    leave_type_name    VARCHAR(100),

    -- 时间
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    start_time         TIME,                              -- 开始时间（半天假）
    end_time           TIME,                              -- 结束时间

    -- 时长
    total_days         DECIMAL(4,1) NOT NULL,            -- 总天数
    total_hours        DECIMAL(6,1),                      -- 总小时数

    -- 剩余假期（申请时的快照）
    annual_leave_balance DECIMAL(4,1),                   -- 年假余额
    sick_leave_balance   DECIMAL(4,1),                    -- 病假余额

    -- 请假原因
    reason             TEXT,

    -- 附件
    attachments        JSONB DEFAULT '[]',

    -- 审批流程
    approval_status    VARCHAR(20) DEFAULT 'pending',     -- pending/approved/rejected
    approver_id        BIGINT,                            -- 审批人
    approver_name      VARCHAR(100),
    approval_time      TIMESTAMP,
    approval_comment   TEXT,

    -- 销假信息
    is_cancelled       BOOLEAN DEFAULT false,
    cancel_reason      TEXT,

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 薪酬管理
-- ============================================

-- 薪酬方案表
CREATE TABLE compensation_plans (
    id                  BIGSERIAL PRIMARY KEY,
    plan_code          VARCHAR(50) UNIQUE NOT NULL,
    plan_name          VARCHAR(200) NOT NULL,

    -- 方案类型
    plan_type          VARCHAR(20),                      -- 工资/奖金/补贴/社保公积金
    applicable_scope    VARCHAR(50),                      -- 适用对象：全员/管理层/特定岗位

    -- 基本工资
    base_salary        DECIMAL(12,2),                    -- 基本工资
    base_salary_type   VARCHAR(20),                      -- 月薪/年薪

    -- 绩效工资
    performance_salary DECIMAL(12,2),                    -- 绩效工资基数
    performance_ratio  DECIMAL(3,2),                     -- 绩效占比

    -- 补贴
    allowances         JSONB DEFAULT '{}',
    -- allowances 示例：
    -- {
    --   "housing": 2000,      -- 住房补贴
    --   "transport": 500,     -- 交通补贴
    --   "meal": 300,          -- 餐饮补贴
    --   "communication": 200, -- 通讯补贴
    --   "position": 1000      -- 岗位补贴
    -- }

    -- 社会保险
    social_security    JSONB DEFAULT '{}',
    -- {
    --   "pension": 0.08,     -- 养老保险比例
    --   "medical": 0.02,     -- 医疗保险比例
    --   "unemployment": 0.005, -- 失业保险
    --   "housing": 0.12      -- 公积金比例
    -- }

    -- 状态
    status             VARCHAR(20) DEFAULT 'active',
    effective_date     DATE,
    expiry_date        DATE,

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工资发放记录表
CREATE TABLE payroll_records (
    id                  BIGSERIAL PRIMARY KEY,
    payroll_code       VARCHAR(50) UNIQUE NOT NULL,      -- 工资单号

    -- 所属期间
    payroll_month     VARCHAR(7) NOT NULL,               -- 工资月份，如 "2024-01"
    start_date         DATE,                             -- 期间开始
    end_date           DATE,                             -- 期间结束
    pay_date           DATE,                             -- 发放日期

    -- 员工信息
    employee_id        BIGINT NOT NULL,
    employee_code      VARCHAR(50),
    employee_name     VARCHAR(100),
    department_id      BIGINT,
    department_name   VARCHAR(100),
    position_name     VARCHAR(100),

    -- 基本信息
    contract_salary   DECIMAL(12,2),                    -- 合同工资
    actual_work_days   INTEGER,                          -- 实际出勤天数
    standard_work_days INTEGER,                          -- 标准出勤天数

    -- 应发工资明细
    attendance_days   INTEGER,                          -- 出勤天数
    absence_days      DECIMAL(4,1),                     -- 缺勤天数（含请假）
    overtime_hours    DECIMAL(6,1),                      -- 加班时长

    -- 税前工资组成
    base_salary       DECIMAL(12,2),                    -- 基本工资
    position_salary   DECIMAL(12,2),                    -- 岗位工资
    performance_salary DECIMAL(12,2),                   -- 绩效工资
    overtime_pay      DECIMAL(12,2),                    -- 加班费
    allowances       JSONB DEFAULT '{}',               -- 各种补贴
    other_additions   DECIMAL(12,2),                    -- 其他加项

    -- 税前扣除
    absence_deduction DECIMAL(12,2),                   -- 缺勤扣款
    other_deductions  DECIMAL(12,2),                   -- 其他扣款
    gross_salary      DECIMAL(12,2),                    -- 应发工资

    -- 社会保险和公积金
    social_security   JSONB DEFAULT '{}',
    -- {
    --   "pension": {"personal": 800, "company": 1600},
    --   "medical": {"personal": 200, "company": 400},
    --   "unemployment": {"personal": 25, "company": 50},
    --   "housing": {"personal": 1200, "company": 1200}
    -- }
    total_personal_social DECIMAL(12,2),                -- 个人社保合计
    total_company_social DECIMAL(12,2),                -- 公司社保合计

    -- 公积金
    housing_fund      JSONB DEFAULT '{}',
    -- {"personal": 1200, "company": 1200}
    personal_housing_fund DECIMAL(12,2),                 -- 个人公积金
    company_housing_fund DECIMAL(12,2),                  -- 公司公积金

    -- 个税
    taxable_income    DECIMAL(12,2),                    -- 应纳税所得额
    tax_rate          DECIMAL(5,4),                    -- 税率
    quick_deduction   DECIMAL(12,2),                    -- 速算扣除数
    personal_income_tax DECIMAL(12,2),                  -- 个税

    -- 实发工资
    net_salary        DECIMAL(12,2),                    -- 实发工资
    social_security_total DECIMAL(12,2),                -- 社保公积金合计（个人+公司）

    -- 银行转账
    bank_name         VARCHAR(100),
    bank_account      VARCHAR(50),

    -- 状态
    status            VARCHAR(20) DEFAULT 'draft',      -- draft/approved/paid
    approved_at       TIMESTAMP,
    paid_at           TIMESTAMP,

    tenant_id         BIGINT NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 绩效考核
-- ============================================

-- 绩效考核方案表
CREATE TABLE performance_cycles (
    id                  BIGSERIAL PRIMARY KEY,
    cycle_code         VARCHAR(50) UNIQUE NOT NULL,
    cycle_name         VARCHAR(200) NOT NULL,            -- 如 "2024年Q1绩效考核"

    -- 考核周期
    cycle_type         VARCHAR(20),                     -- 季度/半年度/年度/项目
    start_date         DATE NOT NULL,                    -- 考核开始日期
    end_date           DATE NOT NULL,                    -- 考核结束日期

    -- 自评时间
    self_review_start  DATE,                            -- 自评开始
    self_review_end    DATE,                            -- 自评截止

    -- 上级评价时间
    manager_review_start DATE,
    manager_review_end   DATE,

    -- HR审核时间
    hr_review_start    DATE,
    hr_review_end      DATE,

    -- 校准时间
    calibration_start   DATE,
    calibration_end    DATE,

    -- 结果发布时间
    result_release_date DATE,

    -- 状态
    status             VARCHAR(20) DEFAULT 'pending',    -- pending/self_review/manager_review/ calibration/result_released

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 绩效考核记录表
CREATE TABLE performance_records (
    id                  BIGSERIAL PRIMARY KEY,
    cycle_id           BIGINT NOT NULL,                 -- 考核周期ID
    cycle_name         VARCHAR(200),

    -- 员工信息
    employee_id        BIGINT NOT NULL,
    employee_code      VARCHAR(50),
    employee_name      VARCHAR(100),
    department_id      BIGINT,
    department_name    VARCHAR(100),
    position_name     VARCHAR(100),
    manager_id        BIGINT,
    manager_name      VARCHAR(100),

    -- 考核信息
   考核维度           JSONB DEFAULT '[]',               -- 考核维度定义
    -- [{
    --   "dimensionId": 1,
    --   "dimensionName": "工作业绩",
    --   "weight": 0.4,
    --   "metrics": [
    --     {"metricId": 1, "metricName": "KPI完成率", "weight": 0.5, "score": null},
    --     {"metricId": 2, "metricName": "项目交付", "weight": 0.5, "score": null}
    --   ]
    -- }]

    -- 自评
    self_review        TEXT,                            -- 自评内容
    self_review_score  DECIMAL(5,2),                    -- 自评总分
    self_review_submitted_at TIMESTAMP,

    -- 上级评价
    manager_review     TEXT,                            -- 上级评价
    manager_review_score DECIMAL(5,2),                  -- 上级评分
    manager_submitted_at TIMESTAMP,

    -- HR审核
    hr_review          TEXT,                            -- HR审核意见
    hr_adjusted_score  DECIMAL(5,2),                   -- HR调整后分数
    hr_submitted_at    TIMESTAMP,

    -- 最终结果
    final_score        DECIMAL(5,2),                    -- 最终评分
    final_rating       VARCHAR(20),                     -- 最终等级：S/A/B/C/D

    -- 绩效工资
    performance_bonus  DECIMAL(12,2),                   -- 绩效奖金

    -- 面谈记录
    feedback_session_date DATE,                        -- 面谈日期
    feedback_session_notes TEXT,                       -- 面谈记录
    improvement_plan  TEXT,                            -- 改进计划

    -- 状态
    status             VARCHAR(20) DEFAULT 'draft',
    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 三、招聘管理核心功能

### 3.1 招聘流程与候选人管理

```typescript
// ============================================
// 招聘管理服务
// ============================================

// src/recruitment/recruitment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { JobPosting } from './entities/job-posting.entity';
import { RecruitmentRecord } from './entities/recruitment-record.entity';

/**
 * 招聘流程阶段定义
 */
const RECRUITMENT_STAGES = {
  new: { name: '新增简历', next: 'screening' },
  screening: { name: '简历筛选', next: 'written_test' },
  written_test: { name: '笔试', next: 'first_interview' },
  first_interview: { name: '初试', next: 'final_interview' },
  final_interview: { name: '终面', next: 'offer' },
  offer: { name: 'Offer', next: 'hired' },
  hired: { name: '已入职', next: null },
};

/**
 * 招聘服务
 *
 * 招聘管理的核心流程：
 * 1. 发布职位
 * 2. 收集简历
 * 3. 简历筛选
 * 4. 笔试/面试
 * 5. 发放Offer
 * 6. 背景调查
 * 7. 入职办理
 */
@Injectable()
export class RecruitmentService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,

    @InjectRepository(JobPosting)
    private postingRepository: Repository<JobPosting>,

    @InjectRepository(RecruitmentRecord)
    private recordRepository: Repository<RecruitmentRecord>,
  ) {}

  /**
   * 创建候选人
   */
  async createCandidate(data: {
    chineseName: string;
    phone: string;
    email: string;
    source: string;
    resumeUrl?: string;
  }): Promise<Candidate> {
    const code = await this.generateCandidateCode();

    const candidate = this.candidateRepository.create({
      candidateCode: code,
      chineseName: data.chineseName,
      phone: data.phone,
      email: data.email,
      source: data.source,
      resumeUrl: data.resumeUrl,
      currentStage: 'new',
      status: 'active',
    });

    return this.candidateRepository.save(candidate);
  }

  /**
   * 为候选人创建应聘记录
   */
  async applyForPosition(
    candidateId: number,
    jobPostingId: number
  ): Promise<RecruitmentRecord> {
    // 验证候选人和职位是否存在
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId }
    });

    if (!candidate) {
      throw new NotFoundException('候选人不存在');
    }

    const posting = await this.postingRepository.findOne({
      where: { id: jobPostingId, status: 'open' }
    });

    if (!posting) {
      throw new NotFoundException('职位不存在或已关闭');
    }

    // 检查是否已有该职位的应聘记录
    const existingRecord = await this.recordRepository.findOne({
      where: { candidateId, jobPostingId }
    });

    if (existingRecord) {
      throw new Error('候选人已应聘过该职位');
    }

    // 创建应聘记录
    const record = this.recordRepository.create({
      candidateId,
      jobPostingId,
      stage: 'new',
      stageName: RECRUITMENT_STAGES.new.name,
    });

    const savedRecord = await this.recordRepository.save(record);

    // 更新候选人当前阶段
    candidate.currentStage = 'new';
    await this.candidateRepository.save(candidate);

    // 增加职位的应聘人数
    posting.appliedCount = (posting.appliedCount || 0) + 1;
    await this.postingRepository.save(posting);

    return savedRecord;
  }

  /**
   * 推进招聘流程到下一阶段
   */
  async advanceToNextStage(
    recordId: number,
    interviewerId: number,
    data: {
      decision: 'pass' | 'fail' | 'pending';
      score?: number;
      feedback?: string;
      strengths?: string[];
      concerns?: string[];
      nextStage?: string;
      scheduledAt?: Date;
    }
  ): Promise<RecruitmentRecord> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['candidate', 'jobPosting']
    });

    if (!record) {
      throw new NotFoundException('应聘记录不存在');
    }

    const currentStage = record.stage as keyof typeof RECRUITMENT_STAGES;
    const stageConfig = RECRUITMENT_STAGES[currentStage];

    // 记录面试官和反馈
    record.interviewerId = interviewerId;
    record.actualAt = new Date();

    if (data.score !== undefined) {
      record.score = data.score;
    }

    if (data.feedback) {
      record.feedback = data.feedback;
    }

    if (data.strengths) {
      record.strengths = data.strengths;
    }

    if (data.concerns) {
      record.concerns = data.concerns;
    }

    // 处理面试结果
    if (data.decision === 'fail') {
      // 面试不通过，标记为淘汰
      record.decision = 'rejected';

      // 更新候选人状态（如果有其他应聘记录，保持active）
      await this.updateCandidateStatus(record.candidateId, 'screening');

      // 记录不通过的原因
      const reason = data.feedback || '面试不通过';
      await this.addRejectionReason(record, reason);

    } else if (data.decision === 'pass' || data.decision === 'pending') {
      // 通过或待定，推进到下一阶段
      record.decision = data.decision === 'pass' ? 'pass' : 'pending';

      const nextStage = data.nextStage || stageConfig.next;

      if (nextStage) {
        record.stage = nextStage;
        record.stageName = RECRUITMENT_STAGES[nextStage as keyof typeof RECRUITMENT_STAGES].name;

        // 如果下一阶段是面试，安排时间
        if (nextStage.includes('interview')) {
          record.scheduledAt = data.scheduledAt;
        }

        // 更新候选人的当前阶段
        await this.updateCandidateStatus(record.candidateId, nextStage);
      } else {
        // 没有下一阶段了，表示招聘成功
        record.stage = 'hired';
        record.stageName = RECRUITMENT_STAGES.hired.name;

        // 创建入职流程
        await this.initiateOnboarding(record);

        // 更新候选人状态
        await this.updateCandidateStatus(record.candidateId, 'hired');
      }
    }

    return this.recordRepository.save(record);
  }

  /**
   * 创建Offer
   */
  async createOffer(recordId: number, offerData: {
    salary: number;
    startDate: Date;
    positionName: string;
    reportingManagerId: number;
    comments?: string;
  }): Promise<{
    offerId: number;
    candidateId: number;
    expectedSalary: number;
    offeredSalary: number;
    startDate: Date;
  }> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
      relations: ['candidate', 'jobPosting']
    });

    if (!record) {
      throw new NotFoundException('应聘记录不存在');
    }

    if (record.stage !== 'offer') {
      throw new Error('候选人当前不在Offer阶段');
    }

    // 实际实现应该创建Offer记录
    // 这里简化处理
    const offer = {
      offerId: Date.now(),
      candidateId: record.candidateId,
      candidateName: record.candidate.chineseName,
      expectedSalary: record.candidate.expectedSalary,
      offeredSalary: offerData.salary,
      startDate: offerData.startDate,
      positionName: offerData.positionName,
    };

    // 记录到应聘记录中
    record.decision = 'offer';
    await this.recordRepository.save(record);

    return offer;
  }

  /**
   * 获取招聘漏斗统计
   */
  async getRecruitmentFunnel(
    jobPostingId?: number
  ): Promise<{
    stage: string;
    stageName: string;
    count: number;
    passRate: number;
  }[]> {
    // 构建查询
    const queryBuilder = this.recordRepository
      .createQueryBuilder('record')
      .select('record.stage', 'stage')
      .addSelect('COUNT(*)', 'count');

    if (jobPostingId) {
      queryBuilder.where('record.jobPostingId = :jobPostingId', { jobPostingId });
    }

    // 按阶段分组统计
    const stats = await queryBuilder
      .groupBy('record.stage')
      .getRawMany();

    // 转换为漏斗格式
    const stages = Object.entries(RECRUITMENT_STAGES)
      .filter(([key]) => key !== 'hired')  // 排除已入职
      .map(([key, config]) => {
        const stat = stats.find(s => s.stage === key);
        return {
          stage: key,
          stageName: config.name,
          count: parseInt(stat?.count || '0', 10),
          passRate: 0,  // 稍后计算
        };
      });

    // 计算通过率
    for (let i = 0; i < stages.length - 1; i++) {
      if (stages[i].count > 0) {
        stages[i].passRate = Math.round(
          (stages[i + 1].count / stages[i].count) * 100
        );
      }
    }

    return stages;
  }

  // ============================================
  // 辅助方法
  // ============================================

  /**
   * 生成候选人编码
   */
  private async generateCandidateCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `CAND${year}${month}`;

    // 查询当月最大的候选人编号
    const lastCandidate = await this.candidateRepository
      .createQueryBuilder('c')
      .where('c.candidate_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.candidate_code', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastCandidate) {
      const lastSequence = parseInt(lastCandidate.candidateCode.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 更新候选人状态
   */
  private async updateCandidateStatus(
    candidateId: number,
    currentStage: string
  ): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId }
    });

    if (candidate) {
      candidate.currentStage = currentStage;

      if (currentStage === 'hired') {
        candidate.finalDecision = 'hired';
      } else if (['rejected', 'declined'].includes(currentStage)) {
        candidate.finalDecision = 'rejected';
      }

      await this.candidateRepository.save(candidate);
    }
  }

  /**
   * 初始化入职流程
   */
  private async initiateOnboarding(record: RecruitmentRecord): Promise<void> {
    // 实际实现应该：
    // 1. 创建入职任务清单
    // 2. 发送入职通知
    // 3. 创建员工档案
    // 4. 分配系统和资源
    console.log('初始化入职流程', record.candidateId);
  }

  /**
   * 记录淘汰原因
   */
  private async addRejectionReason(
    record: RecruitmentRecord,
    reason: string
  ): Promise<void> {
    // 更新候选人的汇总字段
    const candidate = await this.candidateRepository.findOne({
      where: { id: record.candidateId }
    });

    if (candidate) {
      candidate.interviewFeedback = [
        ...(candidate.interviewFeedback || []),
        `阶段${record.stageName}：${reason}`
      ];
      await this.candidateRepository.save(candidate);
    }
  }
}
```

### 3.2 智能简历筛选

```typescript
/**
 * 智能简历筛选服务
 *
 * 基于规则和AI技术自动筛选简历，提高HR效率
 */

/**
 * 简历筛选条件
 */
interface ScreeningCriteria {
  // 硬性条件
  requiredEducation?: string[];                    -- 学历要求：本科/硕士/博士
  requiredMajor?: string[];                        -- 专业要求
  minimumExperienceYears?: number;                -- 最低工作年限
  requiredSkills?: string[];                       -- 必备技能

  // 加分条件
  preferredSkills?: string[];                      -- 加分技能
  preferredCompanies?: string[];                  -- 偏好公司
  preferredMajor?: string[];                       -- 偏好专业

  // 薪资期望
  maxExpectedSalary?: number;                     -- 最高期望薪资

  // 其他
  excludeCompanies?: string[];                    -- 排除公司
}

/**
 * 筛选结果
 */
interface ScreeningResult {
  candidateId: number;
  candidateCode: string;
  candidateName: string;

  // 匹配分析
  matchedRequiredSkills: string[];               -- 匹配的硬性技能
  missedRequiredSkills: string[];                -- 缺失的硬性技能
  matchedPreferredSkills: string[];              -- 匹配的加分技能

  // 评分
  educationScore: number;                        -- 学历得分
  experienceScore: number;                        -- 经验得分
  skillsScore: number;                           -- 技能得分
  overallScore: number;                          -- 综合得分

  // 评估结果
  passStage: 'pass' | 'review' | 'reject';
  passReason?: string;
  rejectReason?: string;

  // 关键词匹配
  matchedKeywords: string[];
  highlightedSections: string[];
}

/**
 * 简历解析后的结构化数据
 */
interface ParsedResume {
  name: string;
  phone: string;
  email: string;

  // 学历信息
  education: {
    school: string;
    degree: string;
    major: string;
    startDate: Date;
    endDate: Date;
  }[];

  // 工作经历
  experience: {
    company: string;
    position: string;
    startDate: Date;
    endDate: Date;
    description: string;
    achievements: string[];
  }[];

  // 技能
  skills: {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
  }[];

  // 项目经历
  projects: {
    name: string;
    role: string;
    description: string;
    technologies: string[];
  }[];

  // 原始文本（用于关键词匹配）
  rawText: string;
}

/**
 * 智能简历筛选服务
 */
class ResumeScreeningService {
  /**
   * 筛选简历
   *
   * 算法流程：
   * 1. 解析简历文本
   * 2. 按硬性条件过滤（不满足直接淘汰）
   * 3. 对通过硬性条件的简历进行评分
   * 4. 根据评分决定：通过/待定/淘汰
   */
  async screenResume(
    resume: ParsedResume,
    criteria: ScreeningCriteria
  ): Promise<ScreeningResult> {
    const result: ScreeningResult = {
      candidateId: 0,
      candidateCode: '',
      candidateName: resume.name,
      matchedRequiredSkills: [],
      missedRequiredSkills: [],
      matchedPreferredSkills: [],
      educationScore: 0,
      experienceScore: 0,
      skillsScore: 0,
      overallScore: 0,
      passStage: 'reject',
      matchedKeywords: [],
      highlightedSections: [],
    };

    // 1. 检查硬性条件
    const hardCheckResult = this.checkHardCriteria(resume, criteria);

    if (!hardCheckResult.passed) {
      result.passStage = 'reject';
      result.rejectReason = hardCheckResult.reasons.join('; ');
      return result;
    }

    result.matchedRequiredSkills = hardCheckResult.matched;
    result.missedRequiredSkills = hardCheckResult.missed;

    // 2. 计算学历得分
    result.educationScore = this.calculateEducationScore(resume, criteria);

    // 3. 计算经验得分
    result.experienceScore = this.calculateExperienceScore(resume, criteria);

    // 4. 计算技能得分
    const skillsResult = this.calculateSkillsScore(resume, criteria);
    result.skillsScore = skillsResult.score;
    result.matchedPreferredSkills = skillsResult.matchedPreferred;

    // 5. 计算综合得分（加权平均）
    result.overallScore = Math.round(
      result.educationScore * 0.25 +
      result.experienceScore * 0.35 +
      result.skillsScore * 0.40
    );

    // 6. 提取关键词匹配
    result.matchedKeywords = this.extractMatchedKeywords(resume.rawText, criteria);
    result.highlightedSections = this.extractHighlightedSections(resume);

    // 7. 决定筛选结果
    if (result.overallScore >= 70) {
      result.passStage = 'pass';
      result.passReason = `综合得分${result.overallScore}，超过通过线70`;
    } else if (result.overallScore >= 50) {
      result.passStage = 'review';
      result.passReason = `综合得分${result.overallScore}，建议人工复核`;
    } else {
      result.passStage = 'reject';
      result.rejectReason = `综合得分${result.overallScore}，未达到最低要求50分`;
    }

    return result;
  }

  /**
   * 检查硬性条件
   */
  private checkHardCriteria(
    resume: ParsedResume,
    criteria: ScreeningCriteria
  ): { passed: boolean; reasons: string[]; matched: string[]; missed: string[] } {
    const reasons: string[] = [];
    const matched: string[] = [];
    const missed: string[] = [];

    // 1. 检查学历要求
    if (criteria.requiredEducation && criteria.requiredEducation.length > 0) {
      const highestDegree = resume.education[0]?.degree;
      if (!highestDegree || !criteria.requiredEducation.includes(highestDegree)) {
        reasons.push(`学历不符合要求，需要${criteria.requiredEducation.join('/')}，实际${highestDegree || '无'}`);
        missed.push('education');
      } else {
        matched.push('education');
      }
    }

    // 2. 检查专业要求
    if (criteria.requiredMajor && criteria.requiredMajor.length > 0) {
      const major = resume.education[0]?.major;
      const hasMatch = criteria.requiredMajor.some(required =>
        major?.includes(required) || this.isSimilarMajor(major, required)
      );
      if (!hasMatch) {
        reasons.push(`专业不符合要求，需要${criteria.requiredMajor.join('/')}，实际${major || '无'}`);
        missed.push('major');
      } else {
        matched.push('major');
      }
    }

    // 3. 检查工作年限
    if (criteria.minimumExperienceYears) {
      const totalYears = this.calculateTotalExperienceYears(resume.experience);
      if (totalYears < criteria.minimumExperienceYears) {
        reasons.push(`工作年限不符合要求，需要${criteria.minimumExperienceYears}年，实际${totalYears}年`);
        missed.push('experience');
      } else {
        matched.push('experience');
      }
    }

    // 4. 检查必备技能
    if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
      const resumeSkills = resume.skills.map(s => s.name.toLowerCase());
      const required = criteria.requiredSkills.map(s => s.toLowerCase());

      const matchedSkills = required.filter(skill =>
        resumeSkills.some(resumeSkill =>
          resumeSkill.includes(skill) || skill.includes(resumeSkill)
        )
      );

      const missedSkills = required.filter(skill =>
        !matchedSkills.includes(skill)
      );

      result.matchedRequiredSkills.push(...matchedSkills);

      if (missedSkills.length > 0) {
        reasons.push(`缺少必备技能：${missedSkills.join(', ')}`);
        missed.push(...missedSkills);
      }
    }

    // 5. 检查薪资期望
    if (criteria.maxExpectedSalary) {
      // 假设resume中有expectedSalary字段
      // const expectedSalary = resume.expectedSalary;
      // if (expectedSalary > criteria.maxExpectedSalary) {
      //   reasons.push(`期望薪资超过上限`);
      // }
    }

    // 6. 检查排除公司
    if (criteria.excludeCompanies && criteria.excludeCompanies.length > 0) {
      const hasExcluded = resume.experience.some(exp =>
        criteria.excludeCompanies!.some(company =>
          exp.company.includes(company)
        )
      );
      if (hasExcluded) {
        reasons.push('曾在排除公司工作');
        missed.push('exclude_company');
      }
    }

    return {
      passed: reasons.length === 0,
      reasons,
      matched,
      missed,
    };
  }

  /**
   * 计算学历得分
   */
  private calculateEducationScore(
    resume: ParsedResume,
    criteria: ScreeningCriteria
  ): number {
    // 学历分数标准
    const degreeScores: Record<string, number> = {
      '博士': 100,
      '硕士': 85,
      '本科': 70,
      '大专': 50,
      '高中': 30,
    };

    // 如果有最高学历，计算得分
    if (resume.education.length > 0) {
      const highestDegree = resume.education[0].degree;
      const baseScore = degreeScores[highestDegree] || 50;

      // 额外加分：学校排名（简化处理）
      const topSchools = ['清华', '北大', '复旦', '上交', '浙大', '中科大'];
      const isTopSchool = topSchools.some(school =>
        resume.education[0].school.includes(school)
      );
      const schoolBonus = isTopSchool ? 10 : 0;

      // 额外加分：专业匹配
      let majorBonus = 0;
      if (criteria.requiredMajor) {
        const major = resume.education[0].major;
        if (criteria.requiredMajor.some(m => major?.includes(m))) {
          majorBonus = 5;
        }
      }

      return Math.min(100, baseScore + schoolBonus + majorBonus);
    }

    return 0;
  }

  /**
   * 计算经验得分
   */
  private calculateExperienceScore(
    resume: ParsedResume,
    criteria: ScreeningCriteria
  ): number {
    // 计算总工作年限
    const totalYears = this.calculateTotalExperienceYears(resume.experience);

    // 基础分：每年5分，上限60分
    const yearsScore = Math.min(60, totalYears * 5);

    // 相关经验加分（检查是否在相关行业/岗位有经验）
    let relevanceScore = 0;

    // 曾在知名公司工作加分
    const famousCompanies = ['Google', 'Microsoft', 'Amazon', '阿里', '腾讯', '字节', '华为'];
    const hasFamousCompany = resume.experience.some(exp =>
      famousCompanies.some(company => exp.company.includes(company))
    );

    if (hasFamousCompany) {
      relevanceScore += 15;
    }

    // 管理层经验加分
    const hasManagement = resume.experience.some(exp =>
      exp.description.includes('管理') || exp.description.includes('leader')
    );

    if (hasManagement) {
      relevanceScore += 10;
    }

    // 计算成就数量
    const achievementsCount = resume.experience.reduce(
      (sum, exp) => sum + (exp.achievements?.length || 0), 0
    );

    const achievementsScore = Math.min(15, achievementsCount * 3);

    return Math.min(100, yearsScore + relevanceScore + achievementsScore);
  }

  /**
   * 计算技能得分
   */
  private calculateSkillsScore(
    resume: ParsedResume,
    criteria: ScreeningCriteria
  ): { score: number; matchedPreferred: string[] } {
    const matchedPreferred: string[] = [];

    if (resume.skills.length === 0) {
      return { score: 0, matchedPreferred };
    }

    // 计算必备技能匹配得分
    let requiredScore = 0;
    if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
      const matchedCount = resume.skills.filter(skill =>
        criteria.requiredSkills!.some(required =>
          skill.name.toLowerCase().includes(required.toLowerCase())
        )
      ).length;

      requiredScore = (matchedCount / criteria.requiredSkills.length) * 50;
    } else {
      requiredScore = 50;  // 没有必备技能要求，给基础分
    }

    // 计算加分技能匹配得分
    let preferredScore = 0;
    if (criteria.preferredSkills && criteria.preferredSkills.length > 0) {
      const matchedPreferredSkills = resume.skills.filter(skill =>
        criteria.preferredSkills!.some(preferred =>
          skill.name.toLowerCase().includes(preferred.toLowerCase())
        )
      );

      matchedPreferred.push(...matchedPreferredSkills.map(s => s.name));

      // 每个匹配加5分，上限30分
      preferredScore = Math.min(30, matchedPreferredSkills.length * 5);

      // 技能熟练度加分
      const expertSkills = matchedPreferredSkills.filter(s => s.level === 'expert' || s.level === 'advanced');
      preferredScore += expertSkills.length * 5;
    } else {
      preferredScore = 20;  // 没有加分技能要求，给基础分
    }

    // 计算技能完整性（技能数量太少扣分）
    const skillCountScore = Math.min(20, resume.skills.length * 2);

    const totalScore = requiredScore + preferredScore + skillCountScore;

    return {
      score: Math.min(100, Math.round(totalScore)),
      matchedPreferred,
    };
  }

  /**
   * 提取匹配的关键词
   */
  private extractMatchedKeywords(
    rawText: string,
    criteria: ScreeningCriteria
  ): string[] {
    const keywords: string[] = [];
    const allCriteriaSkills = [
      ...(criteria.requiredSkills || []),
      ...(criteria.preferredSkills || []),
    ];

    const lowerText = rawText.toLowerCase();

    for (const skill of allCriteriaSkills) {
      if (lowerText.includes(skill.toLowerCase())) {
        keywords.push(skill);
      }
    }

    return keywords;
  }

  /**
   * 提取高亮段落
   */
  private extractHighlightedSections(resume: ParsedResume): string[] {
    const sections: string[] = [];

    // 提取项目经历中的关键信息
    for (const project of resume.projects.slice(0, 2)) {
      const summary = `${project.name}（${project.role}）`;
      if (project.technologies.length > 0) {
        sections.push(`${summary}：使用${project.technologies.join(', ')}`);
      }
    }

    // 提取工作成就
    for (const exp of resume.experience.slice(0, 2)) {
      if (exp.achievements && exp.achievements.length > 0) {
        sections.push(`${exp.company}：${exp.achievements[0]}`);
      }
    }

    return sections;
  }

  /**
   * 计算总工作年限
   */
  private calculateTotalExperienceYears(experience: ParsedResume['experience']): number {
    if (experience.length === 0) return 0;

    let totalMonths = 0;

    for (const exp of experience) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();

      const months = (end.getFullYear() - start.getFullYear()) * 12 +
                     (end.getMonth() - start.getMonth());

      totalMonths += Math.max(0, months);
    }

    return Math.round(totalMonths / 12 * 10) / 10;  // 保留一位小数
  }

  /**
   * 判断是否相似专业
   */
  private isSimilarMajor(major: string | undefined, required: string): boolean {
    if (!major) return false;

    // 简化实现：检查是否有共同的关键词
    const majorKeywords = major.split(/[,，;；]/).map(k => k.trim());
    const requiredKeywords = required.split(/[,，;；]/).map(k => k.trim());

    return majorKeywords.some(mk =>
      requiredKeywords.some(rk =>
        m.includes(rk) || rk.includes(m)
      )
    );
  }
}
```

## 四、考勤与薪酬管理

### 4.1 智能排班系统

```typescript
/**
 * 智能排班服务
 *
 * 根据业务需求和员工偏好，自动生成最优排班方案
 */

/**
 * 排班需求
 */
interface SchedulingRequest {
  departmentId: number;
  startDate: Date;
  endDate: Date;

  // 业务需求
  demand: {
    date: string;            // 日期，格式 "2024-01-15"
    dayOfWeek: number;       // 星期几
    isWorkday: boolean;      // 是否工作日
    isHoliday: boolean;      -- 是否节假日
    requiredHeadcount: number;  // 需求人数
    minHeadcount: number;     // 最低人数
  }[];

  // 员工偏好
  employeePreferences: {
    employeeId: number;
    preferredShifts: string[];     // 偏好的班次
    unavailableDates: string[];    // 不可用日期
    maxWorkingDaysPerWeek: number; // 每周最多工作天数
  }[];

  // 约束条件
  constraints: {
    minRestHoursBetweenShifts: number;  // 班次间最小休息时间
    maxConsecutiveWorkDays: number;     // 最大连续工作天数
    fairnessThreshold: number;           // 公平性阈值（天数差异不超过多少）
  };
}

/**
 * 排班结果
 */
interface SchedulingResult {
  success: boolean;
  scheduleCode: string;

  // 排班统计
  stats: {
    totalDays: number;
    totalShifts: number;
    averageUtilization: number;
    fairnessScore: number;    // 公平性评分
  };

  // 每日排班详情
  dailySchedules: {
    date: string;
    dayOfWeek: string;
    isWorkday: boolean;

    shifts: {
      shiftId: string;
      shiftName: string;
      startTime: string;
      endTime: string;

      assignedEmployees: {
        employeeId: number;
        employeeName: string;
        isPrimary: boolean;
      }[];
    }[];
  }[];

  // 未安排的员工
  unassignedEmployees: {
    employeeId: number;
    employeeName: string;
    reason: string;
  }[];

  // 冲突和警告
  warnings: {
    type: string;
    message: string;
    affectedEmployees: number[];
  }[];
}

/**
 * 班次定义
 */
interface ShiftDefinition {
  shiftId: string;
  shiftName: string;
  startTime: string;   // "09:00"
  endTime: string;      // "18:00"
  workHours: number;    // 工作时长
  breakHours: number;   // 休息时长
}

/**
 * 智能排班算法
 */
class IntelligentSchedulingAlgorithm {
  // 班次定义
  private shifts: ShiftDefinition[] = [
    { shiftId: 'morning', shiftName: '早班', startTime: '06:00', endTime: '14:00', workHours: 7, breakHours: 1 },
    { shiftId: 'day', shiftName: '日班', startTime: '09:00', endTime: '18:00', workHours: 8, breakHours: 1 },
    { shiftId: 'evening', shiftName: '晚班', startTime: '14:00', endTime: '22:00', workHours: 7, breakHours: 1 },
    { shiftId: 'night', shiftName: '夜班', startTime: '22:00', endTime: '06:00', workHours: 7, breakHours: 1 },
  ];

  /**
   * 生成排班方案
   */
  async generateSchedule(request: SchedulingRequest): Promise<SchedulingResult> {
    const result: SchedulingResult = {
      success: true,
      scheduleCode: await this.generateScheduleCode(),
      stats: { totalDays: 0, totalShifts: 0, averageUtilization: 0, fairnessScore: 0 },
      dailySchedules: [],
      unassignedEmployees: [],
      warnings: [],
    };

    // 1. 获取部门员工列表
    const employees = await this.getDepartmentEmployees(request.departmentId);

    // 2. 合并员工偏好
    const employeeWithPreferences = this.mergePreferences(employees, request.employeePreferences);

    // 3. 按日期生成排班
    for (const demand of request.demand) {
      const dailySchedule = await this.scheduleDay(
        demand,
        employeeWithPreferences,
        request.constraints
      );

      result.dailySchedules.push(dailySchedule);
    }

    // 4. 计算统计数据
    result.stats = this.calculateStats(result.dailySchedules, employees.length);

    // 5. 识别未安排的员工
    result.unassignedEmployees = this.identifyUnassignedEmployees(
      result.dailySchedules,
      employees
    );

    // 6. 生成警告
    result.warnings = this.generateWarnings(result.dailySchedules, request.constraints);

    return result;
  }

  /**
   * 安排单日排班
   */
  private async scheduleDay(
    demand: SchedulingRequest['demand'][0],
    employees: any[],
    constraints: SchedulingRequest['constraints']
  ): Promise<SchedulingResult['dailySchedules'][0]> {
    // 如果不是工作日，返回空排班
    if (!demand.isWorkday && !demand.isHoliday) {
      return {
        date: demand.date,
        dayOfWeek: this.getDayOfWeekName(demand.dayOfWeek),
        isWorkday: false,
        shifts: [],
      };
    }

    // 根据需求选择班次
    const selectedShifts = this.selectShiftsForDemand(demand);

    // 分配员工到各班次
    const shiftAssignments = [];
    let assignedEmployeeIds = new Set<number>();

    for (const shift of selectedShifts) {
      // 找出可以安排在这个班次的员工
      const availableEmployees = employees.filter(emp => {
        // 检查是否已经安排
        if (assignedEmployeeIds.has(emp.employeeId)) return false;

        // 检查是否在不可用日期列表中
        if (emp.unavailableDates.includes(demand.date)) return false;

        // 检查是否偏好这个班次
        const prefersShift = emp.preferredShifts.includes(shift.shiftId);

        return true;
      });

      // 按优先级排序（优先选择偏好这个班次的员工）
      availableEmployees.sort((a, b) => {
        const aPrefers = a.preferredShifts.includes(shift.shiftId) ? 1 : 0;
        const bPrefers = b.preferredShifts.includes(shift.shiftId) ? 1 : 0;
        return bPrefers - aPrefers;
      });

      // 分配员工到班次
      const assigned: any[] = [];
      const neededCount = Math.ceil(demand.requiredHeadcount / selectedShifts.length);

      for (let i = 0; i < Math.min(neededCount, availableEmployees.length); i++) {
        assigned.push({
          employeeId: availableEmployees[i].employeeId,
          employeeName: availableEmployees[i].employeeName,
          isPrimary: i < neededCount / 2,  // 前一半是主要值班人员
        });
        assignedEmployeeIds.add(availableEmployees[i].employeeId);
      }

      shiftAssignments.push({
        shiftId: shift.shiftId,
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        assignedEmployees: assigned,
      });
    }

    return {
      date: demand.date,
      dayOfWeek: this.getDayOfWeekName(demand.dayOfWeek),
      isWorkday: demand.isWorkday,
      shifts: shiftAssignments,
    };
  }

  /**
   * 根据需求选择班次
   */
  private selectShiftsForDemand(demand: SchedulingRequest['demand'][0]): ShiftDefinition[] {
    // 简化实现：根据需求人数选择班次
    if (demand.requiredHeadcount <= 10) {
      // 小需求，只用日班
      return [this.shifts.find(s => s.shiftId === 'day')!];
    } else if (demand.requiredHeadcount <= 20) {
      // 中等需求，早班+日班
      return [
        this.shifts.find(s => s.shiftId === 'morning')!,
        this.shifts.find(s => s.shiftId === 'day')!,
      ];
    } else {
      // 大需求，三班倒
      return [
        this.shifts.find(s => s.shiftId === 'morning')!,
        this.shifts.find(s => s.shiftId === 'day')!,
        this.shifts.find(s => s.shiftId === 'evening')!,
      ];
    }
  }

  /**
   * 计算统计数据
   */
  private calculateStats(
    dailySchedules: SchedulingResult['dailySchedules'][0][],
    totalEmployees: number
  ): SchedulingResult['stats'] {
    let totalShifts = 0;
    let totalAssignedSlots = 0;

    for (const day of dailySchedules) {
      for (const shift of day.shifts) {
        totalShifts++;
        totalAssignedSlots += shift.assignedEmployees.length;
      }
    }

    // 计算平均利用率
    const averageUtilization = totalEmployees > 0
      ? Math.round((totalAssignedSlots / (totalShifts * totalEmployees)) * 100)
      : 0;

    // 计算公平性评分（简化版：基于排班天数的标准差）
    const employeeDayCounts = this.countEmployeeDays(dailySchedules);
    const fairnessScore = this.calculateFairnessScore(employeeDayCounts);

    return {
      totalDays: dailySchedules.length,
      totalShifts,
      averageUtilization,
      fairnessScore,
    };
  }

  /**
   * 统计每个员工的排班天数
   */
  private countEmployeeDays(dailySchedules: SchedulingResult['dailySchedules'][0][]): Map<number, number> {
    const counts = new Map<number, number>();

    for (const day of dailySchedules) {
      for (const shift of day.shifts) {
        for (const emp of shift.assignedEmployees) {
          counts.set(emp.employeeId, (counts.get(emp.employeeId) || 0) + 1);
        }
      }
    }

    return counts;
  }

  /**
   * 计算公平性评分
   */
  private calculateFairnessScore(employeeDayCounts: Map<number, number>): number {
    if (employeeDayCounts.size === 0) return 100;

    const counts = Array.from(employeeDayCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

    // 计算标准差
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // 转换为0-100的评分
    // 标准差为0时得100分，标准差每增加1天扣5分
    const score = Math.max(0, 100 - stdDev * 5);

    return Math.round(score);
  }

  /**
   * 生成警告
   */
  private generateWarnings(
    dailySchedules: SchedulingResult['dailySchedules'][0][],
    constraints: SchedulingRequest['constraints']
  ): SchedulingResult['warnings'] {
    const warnings: SchedulingResult['warnings'] = [];

    // 检查连续工作天数
    const consecutiveCheck = this.checkConsecutiveWorkDays(dailySchedules);
    if (consecutiveCheck.violations.length > 0) {
      warnings.push({
        type: 'consecutive_days',
        message: `发现${consecutiveCheck.violations.length}名员工连续工作超过${constraints.maxConsecutiveWorkDays}天`,
        affectedEmployees: consecutiveCheck.violations,
      });
    }

    // 检查休息时间不足
    const restCheck = this.checkRestHoursBetweenShifts(dailySchedules);
    if (restCheck.violations.length > 0) {
      warnings.push({
        type: 'insufficient_rest',
        message: `发现${restCheck.violations.length}名员工班次间隔休息时间不足`,
        affectedEmployees: restCheck.violations,
      });
    }

    return warnings;
  }

  /**
   * 检查连续工作天数
   */
  private checkConsecutiveWorkDays(
    dailySchedules: SchedulingResult['dailySchedules'][0][]
  ): { violations: number[] } {
    // 简化实现
    return { violations: [] };
  }

  /**
   * 检查休息时间
   */
  private checkRestHoursBetweenShifts(
    dailySchedules: SchedulingResult['dailySchedules'][0][]
  ): { violations: number[] } {
    // 简化实现
    return { violations: [] };
  }

  /**
   * 识别未安排的员工
   */
  private identifyUnassignedEmployees(
    dailySchedules: SchedulingResult['dailySchedules'][0][],
    employees: any[]
  ): SchedulingResult['unassignedEmployees'] {
    // 简化实现
    return [];
  }

  /**
   * 获取星期几的名称
   */
  private getDayOfWeekName(dayOfWeek: number): string {
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[dayOfWeek];
  }

  /**
   * 生成排班编码
   */
  private async generateScheduleCode(): Promise<string> {
    const date = new Date();
    return `SCH${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * 获取部门员工
   */
  private async getDepartmentEmployees(departmentId: number): Promise<any[]> {
    // 简化实现
    return [];
  }

  /**
   * 合并员工偏好
   */
  private mergePreferences(
    employees: any[],
    preferences: SchedulingRequest['employeePreferences']
  ): any[] {
    const prefMap = new Map(preferences.map(p => [p.employeeId, p]));

    return employees.map(emp => ({
      ...emp,
      preferredShifts: prefMap.get(emp.employeeId)?.preferredShifts || [],
      unavailableDates: prefMap.get(emp.employeeId)?.unavailableDates || [],
    }));
  }
}
```

### 4.2 工资核算系统

```typescript
/**
 * 工资核算服务
 *
 * 每月自动核算员工工资，支持多种工资项和扣款项
 */

/**
 * 工资核算请求
 */
interface PayrollCalculationRequest {
  departmentIds?: number[];    // 部门筛选
  employeeIds?: number[];       // 员工筛选
  payrollMonth: string;        // 工资月份，如 "2024-01"

  // 考勤数据
  attendanceData: {
    employeeId: number;
    workDays: number;          // 出勤天数
    absenceDays: number;       // 缺勤天数
    overtimeHours: number;     // 加班时长
    lateCount: number;         // 迟到次数
    earlyLeaveCount: number;   // 早退次数
    sickDays: number;          // 病假天数
    annualLeaveDays: number;   // 年假天数
  }[];

  // 绩效数据
  performanceData: {
    employeeId: number;
    performanceScore: number;  // 绩效评分
    bonus: number;            -- 奖金
  }[];

  // 其他调整
  adjustments: {
    employeeId: number;
    type: 'addition' | 'deduction';
    item: string;
    amount: number;
    reason: string;
  }[];
}

/**
 * 工资核算结果
 */
interface PayrollCalculationResult {
  payrollCode: string;
  payrollMonth: string;

  // 汇总信息
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalPersonalTax: number;
    totalNetSalary: number;
    totalCompanySocial: number;
  };

  // 员工工资明细
  employeePayrolls: {
    employeeId: number;
    employeeCode: string;
    employeeName: string;
    departmentName: string;

    // 基本信息
    contractSalary: number;
    workDays: number;
    standardWorkDays: number;

    // 应发工资
    baseSalary: number;
    positionSalary: number;
    performanceSalary: number;
    overtimePay: number;
    allowances: Record<string, number>;
    grossSalary: number;

    // 扣除项
    absenceDeduction: number;
    lateDeduction: number;
    personalSocial: number;
    personalHousingFund: number;
    personalIncomeTax: number;
    otherDeductions: number;
    totalDeductions: number;

    // 实发工资
    netSalary: number;

    // 详细信息
    attendanceDetails: any;
    taxDetails: any;
  }[];
}

/**
 * 工资核算服务
 */
class PayrollCalculationService {
  // 个税税率表（2019年后）
  private taxBrackets = [
    { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
    { min: 36000, max: 144000, rate: 0.10, quickDeduction: 2520 },
    { min: 144000, max: 300000, rate: 0.20, quickDeduction: 16920 },
    { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
    { min: 420000, max: 660000, rate: 0.30, quickDeduction: 52920 },
    { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
    { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 },
  ];

  // 社保公积金比例（示例，以实际为准）
  private socialSecurityRates = {
    pension: { personal: 0.08, company: 0.16 },
    medical: { personal: 0.02, company: 0.08 },
    unemployment: { personal: 0.005, company: 0.005 },
    housing: { personal: 0.12, company: 0.12 },
  };

  /**
   * 核算工资
   */
  async calculatePayroll(
    request: PayrollCalculationRequest
  ): Promise<PayrollCalculationResult> {
    const result: PayrollCalculationResult = {
      payrollCode: await this.generatePayrollCode(),
      payrollMonth: request.payrollMonth,
      summary: {
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalPersonalTax: 0,
        totalNetSalary: 0,
        totalCompanySocial: 0,
      },
      employeePayrolls: [],
    };

    // 1. 获取员工薪酬方案
    const employees = await this.getEmployeeCompensationPlans(
      request.departmentIds,
      request.employeeIds
    );

    // 2. 获取标准出勤天数
    const standardWorkDays = await this.getStandardWorkDays(request.payrollMonth);

    // 3. 创建考勤数据映射
    const attendanceMap = new Map(
      request.attendanceData.map(a => [a.employeeId, a])
    );

    // 4. 创建绩效数据映射
    const performanceMap = new Map(
      request.performanceData.map(p => [p.employeeId, p])
    );

    // 5. 创建调整数据映射
    const adjustmentsMap = new Map<string, any[]>();
    for (const adj of request.adjustments) {
      const key = adj.employeeId;
      if (!adjustmentsMap.has(key)) {
        adjustmentsMap.set(key, []);
      }
      adjustmentsMap.get(key)!.push(adj);
    }

    // 6. 逐个计算员工工资
    for (const employee of employees) {
      const attendance = attendanceMap.get(employee.employeeId);
      const performance = performanceMap.get(employee.employeeId);
      const adjustments = adjustmentsMap.get(employee.employeeId) || [];

      const payroll = await this.calculateEmployeePayroll(
        employee,
        attendance,
        performance,
        adjustments,
        standardWorkDays
      );

      result.employeePayrolls.push(payroll);

      // 汇总
      result.summary.totalEmployees++;
      result.summary.totalGrossSalary += payroll.grossSalary;
      result.summary.totalPersonalTax += payroll.personalIncomeTax;
      result.summary.totalNetSalary += payroll.netSalary;
    }

    // 计算公司社保公积金
    for (const payroll of result.employeePayrolls) {
      const companySocial = this.calculateCompanySocial(payroll.grossSalary);
      result.summary.totalCompanySocial += companySocial;
    }

    return result;
  }

  /**
   * 计算单个员工工资
   */
  private async calculateEmployeePayroll(
    employee: any,
    attendance: any,
    performance: any,
    adjustments: any[],
    standardWorkDays: number
  ): Promise<PayrollCalculationResult['employeePayrolls'][0]> {
    const { compensationPlan, employeeInfo } = employee;

    // 1. 计算出勤工资
    const dailySalary = compensationPlan.baseSalary / standardWorkDays;
    const workDaysSalary = (attendance?.workDays || 0) * dailySalary;
    const absenceDeduction = (attendance?.absenceDays || 0) * dailySalary;

    // 2. 计算绩效工资
    let performanceSalary = 0;
    if (performance && compensationPlan.performanceRatio) {
      // 绩效工资 = 绩效工资基数 * (绩效得分 / 100)
      performanceSalary = compensationPlan.performanceSalary * (performance.performanceScore / 100);
    }

    // 3. 计算加班费
    const overtimePay = this.calculateOvertimePay(
      attendance?.overtimeHours || 0,
      dailySalary
    );

    // 4. 计算补贴
    const allowances = { ...compensationPlan.allowances };

    // 5. 计算应发工资
    let grossSalary =
      workDaysSalary +
      performanceSalary +
      overtimePay +
      Object.values(allowances).reduce((sum: number, val: any) => sum + (val || 0), 0);

    // 加项调整
    for (const adj of adjustments.filter((a: any) => a.type === 'addition')) {
      grossSalary += adj.amount;
    }

    // 6. 计算缺勤扣款
    const lateDeduction = (attendance?.lateCount || 0) * 20 +  // 每次迟到扣20
                          (attendance?.earlyLeaveCount || 0) * 20;  // 每次早退扣20

    // 7. 计算社保和公积金
    const socialSecurity = this.calculatePersonalSocial(grossSalary);
    const housingFund = this.calculatePersonalHousingFund(grossSalary);

    // 8. 计算应税收入
    let taxableIncome = grossSalary - socialSecurity - housingFund - 5000;  // 5000是个税起征点

    // 9. 计算个税
    const personalIncomeTax = this.calculatePersonalIncomeTax(taxableIncome);

    // 10. 减项调整
    let otherDeductions = 0;
    for (const adj of adjustments.filter((a: any) => a.type === 'deduction')) {
      otherDeductions += adj.amount;
    }

    // 11. 计算实发工资
    const totalDeductions =
      absenceDeduction +
      lateDeduction +
      socialSecurity +
      housingFund +
      personalIncomeTax +
      otherDeductions;

    const netSalary = grossSalary - totalDeductions;

    return {
      employeeId: employeeInfo.id,
      employeeCode: employeeInfo.employeeCode,
      employeeName: employeeInfo.chineseName,
      departmentName: employeeInfo.departmentName,
      contractSalary: compensationPlan.baseSalary,
      workDays: attendance?.workDays || 0,
      standardWorkDays,
      baseSalary: workDaysSalary,
      positionSalary: compensationPlan.positionSalary || 0,
      performanceSalary,
      overtimePay,
      allowances,
      grossSalary,
      absenceDeduction,
      lateDeduction,
      personalSocial: socialSecurity,
      personalHousingFund: housingFund,
      personalIncomeTax,
      otherDeductions,
      totalDeductions,
      netSalary,
      attendanceDetails: attendance,
      taxDetails: {
        taxableIncome,
        taxRate: this.getTaxRate(taxableIncome),
        quickDeduction: this.getQuickDeduction(taxableIncome),
      },
    };
  }

  /**
   * 计算加班费
   *
   * 工作日加班：时薪的1.5倍
   * 周末加班：时薪的2倍
   * 法定节假日加班：时薪的3倍
   */
  private calculateOvertimePay(overtimeHours: number, dailySalary: number): number {
    const hourlySalary = dailySalary / 8;  // 假设每天8小时工作制

    // 简化处理：全部按工作日加班计算
    return overtimeHours * hourlySalary * 1.5;
  }

  /**
   * 计算个人社保
   */
  private calculatePersonalSocial(grossSalary: number): number {
    return grossSalary * (
      this.socialSecurityRates.pension.personal +
      this.socialSecurityRates.medical.personal +
      this.socialSecurityRates.unemployment.personal
    );
  }

  /**
   * 计算个人公积金
   */
  private calculatePersonalHousingFund(grossSalary: number): number {
    return grossSalary * this.socialSecurityRates.housing.personal;
  }

  /**
   * 计算公司社保公积金（用于成本核算）
   */
  private calculateCompanySocial(grossSalary: number): number {
    return grossSalary * (
      this.socialSecurityRates.pension.company +
      this.socialSecurityRates.medical.company +
      this.socialSecurityRates.unemployment.company +
      this.socialSecurityRates.housing.company
    );
  }

  /**
   * 计算个人所得税
   *
   * 使用累计预扣法计算
   * 应纳税所得额 = 收入 - 社保公积金 - 起征点(5000) - 专项附加扣除
   * 应纳税额 = 应纳税所得额 × 税率 - 速算扣除数
   */
  private calculatePersonalIncomeTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    const bracket = this.taxBrackets.find(
      b => taxableIncome > b.min && taxableIncome <= b.max
    );

    if (!bracket) return 0;

    const tax = taxableIncome * bracket.rate - bracket.quickDeduction;

    return Math.max(0, Math.round(tax * 100) / 100);
  }

  /**
   * 获取适用的税率
   */
  private getTaxRate(taxableIncome: number): number {
    const bracket = this.taxBrackets.find(
      b => taxableIncome > b.min && taxableIncome <= b.max
    );
    return bracket?.rate || 0;
  }

  /**
   * 获取速算扣除数
   */
  private getQuickDeduction(taxableIncome: number): number {
    const bracket = this.taxBrackets.find(
      b => taxableIncome > b.min && taxableIncome <= b.max
    );
    return bracket?.quickDeduction || 0;
  }

  /**
   * 生成工资单编码
   */
  private async generatePayrollCode(): Promise<string> {
    const date = new Date();
    return `PR${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * 获取标准出勤天数
   */
  private async getStandardWorkDays(payrollMonth: string): Promise<number> {
    // 简化：每月按22个工作日计算
    // 实际应该根据日历计算（排除周末和节假日）
    return 22;
  }

  /**
   * 获取员工薪酬方案
   */
  private async getEmployeeCompensationPlans(
    departmentIds?: number[],
    employeeIds?: number[]
  ): Promise<any[]> {
    // 简化实现
    return [];
  }
}
```

## 五、绩效考核

### 5.1 绩效考核周期管理

```typescript
/**
 * 绩效考核服务
 */

/**
 * 绩效考核服务
 */
class PerformanceManagementService {
  /**
   * 启动绩效考核周期
   */
  async initiatePerformanceCycle(data: {
    cycleName: string;
    cycleType: 'quarterly' | 'semi_annual' | 'annual' | 'project';
    startDate: Date;
    endDate: Date;
    selfReviewDeadline: Date;
    managerReviewDeadline: Date;
    calibrationDeadline: Date;
    resultReleaseDate: Date;
    participants: number[];
  }): Promise<{ cycleId: number; cycleCode: string }> {
    // 1. 创建考核周期
    const cycle = await this.createPerformanceCycle(data);

    // 2. 为每个参与者创建考核记录
    for (const employeeId of data.participants) {
      await this.createPerformanceRecord(cycle.id, employeeId);
    }

    // 3. 发送通知
    await this.notifyParticipants(cycle, data.participants);

    return {
      cycleId: cycle.id,
      cycleCode: cycle.cycleCode,
    };
  }

  /**
   * 提交自评
   */
  async submitSelfReview(
    recordId: number,
    employeeId: number,
    data: {
      dimensionScores: {
        dimensionId: number;
        dimensionName: string;
        selfScore: number;
        selfComment?: string;
      }[];
      overallComment: string;
      achievements: string[];
      improvementAreas: string[];
      nextPeriodGoals: string[];
    }
  ): Promise<void> {
    // 1. 验证权限
    const record = await this.getPerformanceRecord(recordId);
    if (record.employeeId !== employeeId) {
      throw new Error('无权提交此考核的自评');
    }

    // 2. 检查是否在自评阶段
    const cycle = await this.getPerformanceCycle(record.cycleId);
    if (cycle.status !== 'self_review') {
      throw new Error('当前不是自评阶段');
    }

    // 3. 计算自评总分
    let totalScore = 0;
    let totalWeight = 0;

    for (const dim of data.dimensionScores) {
      const dimension = await this.getDimension(dim.dimensionId);
      totalScore += dim.selfScore * dimension.weight;
      totalWeight += dimension.weight;
    }

    const selfReviewScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // 4. 保存自评
    await this.updatePerformanceRecord(recordId, {
      selfReview: JSON.stringify(data),
      selfReviewScore,
      selfReviewSubmittedAt: new Date(),
      status: 'self_review_completed',
    });

    // 5. 通知直接主管
    await this.notifyManager(record.employeeId, record.cycleId, 'self_review_completed');
  }

  /**
   * 提交上级评价
   */
  async submitManagerReview(
    recordId: number,
    managerId: number,
    data: {
      dimensionScores: {
        dimensionId: number;
        dimensionName: string;
        managerScore: number;
        managerComment?: string;
      }[];
      overallComment: string;
      strengths: string[];
      areasForImprovement: string[];
      developmentSuggestions: string[];
    }
  ): Promise<void> {
    // 1. 验证权限
    const record = await this.getPerformanceRecord(recordId);
    if (record.managerId !== managerId) {
      throw new Error('不是该员工的直接主管，无权评价');
    }

    // 2. 检查是否在上级评价阶段
    const cycle = await this.getPerformanceCycle(record.cycleId);
    if (cycle.status !== 'manager_review') {
      throw new Error('当前不是上级评价阶段');
    }

    // 3. 计算评价总分（结合自评和上级评价）
    let totalScore = 0;
    let totalWeight = 0;

    for (const dim of data.dimensionScores) {
      const dimension = await this.getDimension(dim.dimensionId);

      // 最终得分 = 自评 * 权重1 + 上级评价 * 权重2
      const selfScore = record.selfReviewScore || 0;  // 从记录中获取自评分
      const finalScore = selfScore * 0.3 + dim.managerScore * 0.7;

      totalScore += finalScore * dimension.weight;
      totalWeight += dimension.weight;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // 4. 确定绩效等级
    const rating = this.determineRating(finalScore);

    // 5. 保存评价
    await this.updatePerformanceRecord(recordId, {
      managerReview: JSON.stringify(data),
      managerReviewScore: data.dimensionScores.reduce((sum, d) => sum + d.managerScore, 0) / data.dimensionScores.length,
      finalScore,
      finalRating: rating,
      managerSubmittedAt: new Date(),
      status: 'manager_review_completed',
    });
  }

  /**
   * 确定绩效等级
   */
  private determineRating(score: number): string {
    if (score >= 95) return 'S';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  }

  /**
   * 绩效校准
   *
   * HR或管理层对绩效结果进行校准，确保各团队间的评分标准一致
   */
  async calibrateResults(
    cycleId: number,
    calibrations: {
      recordId: number;
      adjustedScore?: number;
      adjustedRating?: string;
      adjustmentReason?: string;
    }[]
  ): Promise<void> {
    for (const cal of calibrations) {
      const updates: any = {
        hrReviewedAt: new Date(),
      };

      if (cal.adjustedScore !== undefined) {
        updates.hrAdjustedScore = cal.adjustedScore;
        // 重新计算最终得分
        updates.finalScore = cal.adjustedScore;
      }

      if (cal.adjustedRating) {
        updates.finalRating = cal.adjustedRating;
      }

      await this.updatePerformanceRecord(cal.recordId, updates);
    }

    // 更新周期状态
    await this.updateCycleStatus(cycleId, 'calibration_completed');
  }

  /**
   * 获取绩效报表
   */
  async getPerformanceReport(cycleId: number): Promise<{
    cycleInfo: any;

    // 整体统计
    statistics: {
      totalParticipants: number;
      completedCount: number;
      averageScore: number;
      ratingDistribution: Record<string, number>;
    };

    // 绩效分布
    distribution: {
      rating: string;
      count: number;
      percentage: number;
      avgScore: number;
    }[];

    // 部门对比
    departmentComparison: {
      departmentId: number;
      departmentName: string;
      avgScore: number;
      ratingDistribution: Record<string, number>;
    }[];

    // 绩效明细
    employeeDetails: any[];
  }> {
    const records = await this.getRecordsByCycle(cycleId);
    const cycle = await this.getPerformanceCycle(cycleId);

    // 统计
    const statistics = this.calculateStatistics(records);

    // 分布
    const distribution = this.calculateDistribution(records);

    // 部门对比
    const departmentComparison = await this.calculateDepartmentComparison(records);

    return {
      cycleInfo: cycle,
      statistics,
      distribution,
      departmentComparison,
      employeeDetails: records,
    };
  }

  /**
   * 计算统计数据
   */
  private calculateStatistics(records: any[]): any {
    const completedRecords = records.filter(r => r.finalScore !== null);

    const scores = completedRecords.map(r => r.finalScore);
    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    // 评级分布
    const ratingDistribution: Record<string, number> = {};
    for (const record of completedRecords) {
      const rating = record.finalRating;
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    }

    return {
      totalParticipants: records.length,
      completedCount: completedRecords.length,
      averageScore: Math.round(averageScore * 100) / 100,
      ratingDistribution,
    };
  }

  /**
   * 计算分布
   */
  private calculateDistribution(records: any[]): any[] {
    const completedRecords = records.filter(r => r.finalScore !== null);
    const total = completedRecords.length;

    const ratingGroups = this.groupByRating(completedRecords);

    return Object.entries(ratingGroups).map(([rating, recs]) => ({
      rating,
      count: recs.length,
      percentage: Math.round((recs.length / total) * 100),
      avgScore: recs.reduce((sum, r) => sum + r.finalScore, 0) / recs.length,
    }));
  }

  /**
   * 按评级分组
   */
  private groupByRating(records: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const record of records) {
      const rating = record.finalRating;
      if (!groups[rating]) {
        groups[rating] = [];
      }
      groups[rating].push(record);
    }

    return groups;
  }
}
```

## 六、总结

### 6.1 HRMS系统核心要点回顾

1. **员工档案**：统一管理员工信息，支持全生命周期跟踪
2. **招聘管理**：流程化管理招聘，提升候选人体验
3. **考勤薪酬**：自动化考勤和工资核算，减少手工错误
4. **绩效考核**：目标驱动，持续反馈，客观评估
5. **培训发展**：提升员工能力，支持职业发展

### 6.2 技术架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端技术栈                               │
│  React 19 + TypeScript + Ant Design Pro                         │
│  移动端：React Native / 微信小程序                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         核心服务层                               │
│  员工服务 / 招聘服务 / 考勤服务 / 薪酬服务 / 绩效服务              │
│  规则引擎 / 工作流引擎                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据分析层                               │
│  人效分析 / 流动率分析 / 薪酬分析 / 人才盘点                       │
│  劳动力预测 / 继任规划                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据持久层                               │
│  PostgreSQL + Redis + Elasticsearch                             │
│  文件存储：员工合同、证件扫描件                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 扩展方向

1. **员工体验平台**：一站式员工服务入口
2. **人才画像**：AI驱动的人才评估与发展建议
3. **灵活用工管理**：兼职、外包、实习生的全流程管理
4. **劳动力规划**：基于业务的headcount规划与预测
5. **实时HR分析**：高层决策的实时人力资本指标
