# CRM客户关系管理系统实战

## 一、系统概述与核心概念

### 1.1 什么是CRM系统？

想象一下，你开了一家奶茶店。刚开始只有几个客人，你能记住每个人的喜好：张三喜欢少糖，李四喜欢加椰果，王五每周五都会来喝一杯大杯的四季春。但是当客人数量变成1000个、10000个的时候，你的大脑就记不住了。这时候你就需要一本"客户笔记本"，把每个客户的喜好、购买记录、联系方式都记下来——这就是CRM系统的雏形。

**CRM（Customer Relationship Management，客户关系管理系统）** 就是这样一套帮助企业"记住"所有客户信息的系统。它不仅仅是记笔记那么简单，还能帮你分析数据、发现机会、预测未来，从而提升销售业绩和客户满意度。

### 1.2 CRM系统的核心价值

用一个公式来概括：**CRM = 客户信息 + 销售流程 + 自动化工具**

| 核心功能 | 解决的问题 | 业务价值 |
|----------|------------|----------|
| **客户管理** | 客户信息分散、难以统一查看 | 360度客户视图 |
| **销售漏斗** | 不清楚销售机会在哪一个阶段 | 精准预测销售业绩 |
| **跟进记录** | 销售跟进靠"贴发票"式记忆 | 团队协作无缝衔接 |
| **商机管理** | 不知道哪些商机值得跟进 | 资源优化配置 |
| **合同管理** | 合同条款混乱、到期无法追踪 | 规避合同风险 |

### 1.3 CRM系统架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端展示层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 客户列表  │ │ 销售漏斗  │ │ 跟进日历  │ │ 数据报表  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         业务逻辑层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 客户分配  │ │ 跟进提醒  │ │ 商机评分  │ │ 合同审批  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据访问层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 客户主数据 │ │ 销售数据  │ │ 跟进数据  │ │ 合同数据  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 二、数据库设计与数据模型

### 2.1 核心数据表设计

CRM系统的数据库设计是整个系统的"地基"。想象一下盖房子，地基不稳，后面全是白搭。我们先设计核心的数据表结构。

```sql
-- ============================================
-- 客户管理模块 - 核心数据表设计
-- ============================================

-- 客户基础信息表
-- 这张表存储客户的"身份证"信息，是整个CRM系统的核心
CREATE TABLE customers (
    id              BIGSERIAL PRIMARY KEY,           -- 主键ID，系统自动生成
    customer_code   VARCHAR(50) UNIQUE NOT NULL,      -- 客户编码，唯一标识，如 "C2024010001"
    customer_name   VARCHAR(200) NOT NULL,            -- 客户名称，如 "深圳市腾讯科技有限公司"
    customer_type   VARCHAR(20) NOT NULL,             -- 客户类型：企业客户/个人客户
    industry        VARCHAR(50),                       -- 所属行业：互联网/金融/制造业等
    scale           VARCHAR(20),                      -- 企业规模：小型/中型/大型/上市公司

    -- 联系方式 - 这里用JSON存储多联系人的设计很巧妙
    -- 一个企业客户可能有多个联系人，我们不需要建多张表
    contacts        JSONB DEFAULT '[]',
    --  contacts 结构示例：
    --  [
    --    {"name": "张三", "position": "采购经理", "phone": "13800138000", "is_primary": true},
    --    {"name": "李四", "position": "技术总监", "phone": "13900139000", "is_primary": false}
    --  ]

    -- 地址信息
    province        VARCHAR(50),                       -- 省份
    city            VARCHAR(50),                       -- 城市
    district        VARCHAR(50),                       -- 区/县
    address         VARCHAR(500),                      -- 详细地址

    -- 客户评级与价值评估
    customer_level  VARCHAR(10) DEFAULT 'C',          -- 客户等级：A类(重点)/B类(普通)/C类(潜在)
    customer_score  INTEGER DEFAULT 0,                 -- 客户评分：0-100分
    lifetime_value  DECIMAL(15,2) DEFAULT 0,          -- 客户终身价值：预计能带来多少收入

    -- 状态与时间戳
    status          VARCHAR(20) DEFAULT 'active',     -- 状态：active(活跃)/inactive(不活跃)/lost(流失)
    last_followup_at TIMESTAMP,                       -- 最后跟进时间
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 租户隔离 - 这是多租户系统的必备字段
    tenant_id       BIGINT NOT NULL
);

-- 创建索引提升查询性能
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_level ON customers(customer_level);
CREATE INDEX idx_customers_industry ON customers(industry);
CREATE INDEX idx_customers_status ON customers(status);

-- ============================================
-- 销售机会表（商机管理）
-- ============================================
-- 商机就是"可能的生意"，一个客户可能有多个商机
CREATE TABLE opportunities (
    id                  BIGSERIAL PRIMARY KEY,
    opportunity_code    VARCHAR(50) UNIQUE NOT NULL,  -- 商机编号，如 "OPP2024010001"
    opportunity_name    VARCHAR(200) NOT NULL,        -- 商机名称
    customer_id         BIGINT NOT NULL,              -- 关联客户ID

    -- 金额与概率 - 销售预测的核心数据
    expected_amount     DECIMAL(15,2) NOT NULL,       -- 期望金额
    probability         DECIMAL(5,2) DEFAULT 0,       -- 成功概率：0-100%
    weighted_amount     DECIMAL(15,2),                 -- 加权金额：expected_amount * probability

    -- 销售漏斗阶段
    stage               VARCHAR(30) NOT NULL,         -- 当前阶段
    -- 阶段定义：线索->初步接触->需求确认->方案报价->合同谈判->成交/失败
    stage_name          VARCHAR(50),

    -- 时间预测
    expected_close_date DATE,                         -- 预计成交日期
    actual_close_date   DATE,                         -- 实际成交日期

    -- 归属信息
    owner_id            BIGINT NOT NULL,              -- 负责人（销售人员）
    team_id             BIGINT,                       -- 所属团队
    source              VARCHAR(50),                  -- 商机来源：展会/广告/转介绍/自开拓

    -- 产品信息
    products            JSONB DEFAULT '[]',           -- 意向产品列表
    -- products 结构示例：
    --  [
    --    {"product_id": 1, "product_name": "企业版套餐", "quantity": 10, "price": 50000},
    --    {"product_id": 2, "product_name": "实施服务", "quantity": 1, "price": 30000}
    --  ]

    -- 竞争对手信息
    competitors         JSONB DEFAULT '[]',           -- 已知竞争对手

    -- 失败原因（如果商机失败）
    lost_reason         TEXT,
    lost_competitor     VARCHAR(200),

    -- 状态与时间戳
    status              VARCHAR(20) DEFAULT 'open',   -- open/in_progress/won/lost
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id           BIGINT NOT NULL
);

CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);

-- ============================================
-- 跟进记录表
-- ============================================
-- 每次客户沟通都需要记录，这是销售过程管理的核心
CREATE TABLE followups (
    id              BIGSERIAL PRIMARY KEY,
    followup_code   VARCHAR(50) UNIQUE NOT NULL,

    -- 关联信息
    customer_id     BIGINT NOT NULL,
    opportunity_id  BIGINT,                           -- 关联商机（可选）
    contact_id      VARCHAR(50),                       -- 联系人ID

    -- 跟进信息
    followup_type   VARCHAR(30) NOT NULL,             -- 跟进方式：电话/邮件/拜访/会议/其他
    followup_result VARCHAR(30) NOT NULL,              -- 跟进结果：有效/无效/待跟进
    subject         VARCHAR(200),                      -- 跟进主题
    content         TEXT,                              -- 跟进内容详情

    -- 下一步行动
    next_action     VARCHAR(200),                      -- 下一步行动
    next_action_date DATE,                             -- 下一步行动日期
    reminder_set    BOOLEAN DEFAULT false,            -- 是否设置提醒

    -- 位置信息（拜访时记录）
    location        VARCHAR(200),                      -- 拜访地点
    latitude        DECIMAL(10,7),                     -- 纬度
    longitude       DECIMAL(10,7),                     -- 经度

    -- 附件
    attachments     JSONB DEFAULT '[]',               -- 附件列表

    -- 记录人员
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id       BIGINT NOT NULL
);

CREATE INDEX idx_followups_customer ON followups(customer_id);
CREATE INDEX idx_followups_opportunity ON followups(opportunity_id);
CREATE INDEX idx_followups_next_action ON followups(next_action_date) WHERE next_action_date IS NOT NULL;

-- ============================================
-- 合同管理表
-- ============================================
CREATE TABLE contracts (
    id              BIGSERIAL PRIMARY KEY,
    contract_code   VARCHAR(50) UNIQUE NOT NULL,      -- 合同编号

    -- 基本信息
    contract_name   VARCHAR(200) NOT NULL,            -- 合同名称
    customer_id     BIGINT NOT NULL,
    opportunity_id  BIGINT,                           -- 关联商机
    sign_date       DATE NOT NULL,                    -- 签订日期

    -- 合同金额
    contract_amount DECIMAL(15,2) NOT NULL,           -- 合同总金额
    received_amount DECIMAL(15,2) DEFAULT 0,          -- 已收款金额
    tax_amount      DECIMAL(15,2),                    -- 税额

    -- 合同期限
    start_date      DATE NOT NULL,                    -- 合同开始日期
    end_date        DATE NOT NULL,                    -- 合同结束日期
    auto_renewal    BOOLEAN DEFAULT false,            -- 是否自动续约

    -- 合同状态
    status          VARCHAR(20) DEFAULT 'draft',      -- draft/active/completed/terminated
    payment_status  VARCHAR(20) DEFAULT 'unpaid',     -- unpaid/partially_paid/paid

    -- 合同文件
    contract_file   VARCHAR(500),                     -- 合同文件存储路径
    attachments     JSONB DEFAULT '[]',

    -- 合同条款（JSON格式存储灵活条款）
    terms           JSONB,                            -- 合同条款明细

    -- 审批信息
    approval_status VARCHAR(20) DEFAULT 'pending',    -- pending/approved/rejected
    approver_id     BIGINT,
    approved_at     TIMESTAMP,

    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id       BIGINT NOT NULL
);

CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
```

### 2.2 销售漏斗数据模型

销售漏斗是CRM系统的核心功能之一，它形象地展示了销售机会从"潜在"到"成交"的全过程。

```typescript
// ============================================
// 销售漏斗 - 前端类型定义
// ============================================

/**
 * 销售漏斗阶段定义
 * 每个企业可以根据自己的业务定义不同的阶段
 * 这里是一个典型的B2B企业销售漏斗
 */
interface SalesStage {
  stage_code: string;        // 阶段代码：lead/qualify/proposal/negotiation/closed
  stage_name: string;        // 阶段名称：线索/资格确认/方案报价/合同谈判/成交
  stage_order: number;      // 阶段顺序：1/2/3/4/5
  probability: number;       // 默认概率：10%/25%/50%/75%/100%
  color: string;            // UI显示颜色
  description: string;      // 阶段说明
}

// 漏斗阶段常量定义
const SALES_STAGES: SalesStage[] = [
  {
    stage_code: 'lead',
    stage_name: '线索',
    stage_order: 1,
    probability: 10,
    color: '#909399',       // 灰色 - 刚刚获取的线索
    description: '刚刚获取的销售线索，还没开始跟进'
  },
  {
    stage_code: 'qualify',
    stage_name: '资格确认',
    stage_order: 2,
    probability: 25,
    color: '#409EFF',       // 蓝色 - 正在验证需求
    description: '确认客户需求，判断是否有成交可能'
  },
  {
    stage_code: 'proposal',
    stage_name: '方案报价',
    stage_order: 3,
    probability: 50,
    color: '#E6A23C',       // 橙色 - 正在提供解决方案
    description: '已经提供解决方案和报价，等待客户反馈'
  },
  {
    stage_code: 'negotiation',
    stage_name: '合同谈判',
    stage_order: 4,
    probability: 75,
    color: '#F56C6C',       // 红色 - 谈判激烈阶段
    description: '正在谈判合同条款，即将成交或失败'
  },
  {
    stage_code: 'closed',
    stage_name: '成交',
    stage_order: 5,
    probability: 100,
    color: '#67C23A',       // 绿色 - 成功成交
    description: '合同已签订，生意达成'
  }
];

/**
 * 漏斗统计数据
 * 用于前端渲染漏斗图和统计报表
 */
interface FunnelStatistics {
  stage_code: string;       // 阶段代码
  stage_name: string;       // 阶段名称
  count: number;            // 商机数量
  total_amount: number;     // 总金额
  avg_amount: number;       // 平均金额
  probability: number;      // 当前阶段概率
  conversion_rate: number;  // 环比转化率（相比上一阶段）
  weighted_amount: number;  // 加权金额（用于销售预测）
}

/**
 * 漏斗图数据结构
 * 用于前端渲染漏斗可视化组件
 */
interface FunnelChartData {
  name: string;             // 阶段名称
  value: number;           // 商机数量
  amount: number;          // 总金额
  rate: number;            // 转化率
  color: string;           // 颜色
}
```

## 三、后端API设计与实现

### 3.1 NestJS后端架构

```typescript
// ============================================
// CRM后端 - 模块结构设计
// ============================================

// src/crm.module.ts
// CRM系统主模块，聚合所有子模块
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from './customer/customer.module';
import { OpportunityModule } from './opportunity/opportunity.module';
import { FollowupModule } from './followup/followup.module';
import { ContractModule } from './contract/contract.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    // 导入各个子模块
    CustomerModule,
    OpportunityModule,
    FollowupModule,
    ContractModule,
    ReportModule,
  ],
})
export class CrmModule {}

// ============================================
// 客户管理模块 - 控制器
// ============================================

// src/customer/customer.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { CustomerQueryDto } from './dto/customer-query.dto';

/**
 * 客户管理控制器
 * 提供客户的增删改查API
 *
 * 类比：这是一本电话簿的管理界面
 * - GET /customers 就是"翻看电话簿"
 * - POST /customers 就是"添加新联系人"
 * - PUT /customers/:id 就是"修改联系人信息"
 */
@Controller('api/crm/customers')
@UseGuards(JwtAuthGuard)  // 需要登录才能访问
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * 获取客户列表（分页+筛选）
   *
   * 前端调用示例：
   * GET /api/crm/customers?page=1&pageSize=20&customerLevel=A&industry=互联网
   *
   * @param query 查询参数，包含分页和筛选条件
   * @returns 分页后的客户列表
   */
  @Get()
  async findAll(@Query() query: CustomerQueryDto) {
    return this.customerService.findAll(query);
  }

  /**
   * 获取客户详情（包含跟进记录、销售机会等）
   *
   * 这是一个典型的"聚合查询"
   * 后端会关联查询客户的基本信息、跟进记录、销售机会等
   * 形成一个"360度视图"
   *
   * @param id 客户ID
   * @returns 客户详细信息
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }

  /**
   * 创建新客户
   *
   * @param createDto 创建客户的数据
   * @returns 创建成功后的客户信息
   */
  @Post()
  async create(@Body() createDto: CreateCustomerDto) {
    return this.customerService.create(createDto);
  }

  /**
   * 更新客户信息
   *
   * @param id 客户ID
   * @param updateDto 更新数据
   * @returns 更新后的客户信息
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
    return this.customerService.update(+id, updateDto);
  }

  /**
   * 删除客户（软删除）
   *
   * 注意：这里不是真的从数据库删除数据
   * 而是把status字段标记为'deleted'
   * 这是企业级系统的标准做法，保留历史数据用于分析
   *
   * @param id 客户ID
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }

  /**
   * 获取客户360度视图
   * 包含：基本信息、跟进记录、销售机会、合同、任务等
   *
   * @param id 客户ID
   */
  @Get(':id/360-view')
  async getCustomer360View(@Param('id') id: string) {
    return this.customerService.getCustomer360View(+id);
  }
}

// ============================================
// 客户管理模块 - 服务层
// ============================================

// src/customer/customer.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, And, In } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Followup } from '../followup/entities/followup.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { Contract } from '../contract/entities/contract.entity';

/**
 * 客户服务层
 * 处理所有客户相关的业务逻辑
 *
 * 业务逻辑分层：
 * 1. Controller 负责接收请求、参数校验
 * 2. Service 负责业务逻辑处理
 * 3. Repository 负责数据访问
 */
@Injectable()
export class CustomerService {
  constructor(
    // 注入客户的Repository，用于操作客户表
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    // 注入跟进记录的Repository
    @InjectRepository(Followup)
    private followupRepository: Repository<Followup>,

    // 注入销售机会的Repository
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,

    // 注入合同的Repository
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  /**
   * 分页查询客户列表
   *
   * 查询逻辑：
   * 1. 根据筛选条件构建WHERE子句
   * 2. 执行分页查询
   * 3. 统计总数量用于分页
   */
  async findAll(query: CustomerQueryDto) {
    const { page = 1, pageSize = 20, keyword, customerLevel, industry, status } = query;

    // 构建查询条件
    const whereConditions: any = {};

    // 关键字搜索：支持客户名称和编码的模糊搜索
    if (keyword) {
      whereConditions.customerName = Like(`%${keyword}%`);
    }

    // 客户等级筛选
    if (customerLevel) {
      whereConditions.customerLevel = customerLevel;
    }

    // 行业筛选
    if (industry) {
      whereConditions.industry = industry;
    }

    // 状态筛选
    if (status) {
      whereConditions.status = status;
    }

    // 执行分页查询
    // skip和take是TypeORM的分页语法
    // skip：跳过多少条记录
    // take：返回多少条记录
    const [customers, total] = await this.customerRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },  // 按创建时间倒序，最新的在前
      skip: (page - 1) * pageSize,   // 计算偏移量
      take: pageSize,                // 返回条数
      select: [                      // 指定返回的字段，减少网络传输
        'id',
        'customerCode',
        'customerName',
        'customerType',
        'industry',
        'customerLevel',
        'contacts',
        'status',
        'lastFollowupAt',
        'createdAt'
      ]
    });

    return {
      list: customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 获取客户详情
   *
   * @param id 客户ID
   */
  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      // 关联查询联系人扩展信息
      // select 指定返回的字段
    });

    if (!customer) {
      throw new NotFoundException(`客户ID=${id}不存在`);
    }

    return customer;
  }

  /**
   * 创建客户
   *
   * @param createDto 创建数据
   */
  async create(createDto: CreateCustomerDto) {
    // 生成客户编码：规则为 C + 年月日 + 6位序号
    // 例如：C20240115000001
    const customerCode = await this.generateCustomerCode();

    // 构建客户实体
    const customer = this.customerRepository.create({
      ...createDto,
      customerCode,
    });

    // 保存到数据库
    const savedCustomer = await this.customerRepository.save(customer);

    // 返回带有所创建信息的结果
    return {
      message: '客户创建成功',
      data: savedCustomer
    };
  }

  /**
   * 更新客户信息
   *
   * @param id 客户ID
   * @param updateDto 更新数据
   */
  async update(id: number, updateDto: UpdateCustomerDto) {
    // 先查询客户是否存在
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`客户ID=${id}不存在`);
    }

    // 合并更新数据
    // Object.assign 会把 updateDto 的属性覆盖到 customer 上
    Object.assign(customer, updateDto);
    customer.updatedAt = new Date();  // 更新修改时间

    // 保存更新
    const updatedCustomer = await this.customerRepository.save(customer);

    return {
      message: '客户信息更新成功',
      data: updatedCustomer
    };
  }

  /**
   * 客户360度视图
   *
   * 这是CRM系统的核心功能之一
   * 将客户的所有相关信息聚合在一个页面展示
   * 包括：基本信息、跟进记录、销售机会、合同、统计数据等
   */
  async getCustomer360View(id: number) {
    // 并行查询多个表的数据
    // Promise.all 可以并行执行多个查询，提升性能
    const [customer, followups, opportunities, contracts] = await Promise.all([
      // 查询客户基本信息
      this.customerRepository.findOne({ where: { id } }),

      // 查询最近10条跟进记录（按时间倒序）
      this.followupRepository.find({
        where: { customerId: id },
        order: { createdAt: 'DESC' },
        take: 10,
        // 不返回大字段content，节省传输
        select: ['id', 'followupType', 'subject', 'createdAt', 'nextAction', 'nextActionDate']
      }),

      // 查询所有销售机会
      this.opportunityRepository.find({
        where: { customerId: id },
        order: { createdAt: 'DESC' }
      }),

      // 查询所有合同
      this.contractRepository.find({
        where: { customerId: id },
        order: { signDate: 'DESC' }
      }),
    ]);

    if (!customer) {
      throw new NotFoundException(`客户ID=${id}不存在`);
    }

    // 计算统计数据
    const statistics = {
      totalOpportunityAmount: opportunities.reduce((sum, opp) => sum + opp.expectedAmount, 0),
      wonOpportunityAmount: opportunities
        .filter(opp => opp.status === 'won')
        .reduce((sum, opp) => sum + opp.contractAmount, 0),
      totalContractAmount: contracts.reduce((sum, c) => sum + c.contractAmount, 0),
      receivedAmount: contracts.reduce((sum, c) => sum + c.receivedAmount, 0),
      followupCount: followups.length,
      lastFollowupDate: followups[0]?.createdAt || null,
    };

    return {
      customer,
      followups,
      opportunities,
      contracts,
      statistics
    };
  }

  /**
   * 生成客户编码
   * 规则：C + 年月日 + 6位序号
   * 使用数据库的序列来保证序号唯一
   */
  private async generateCustomerCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 查询今天最大的客户编码
    const lastCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.customer_code LIKE :prefix', { prefix: `C${dateStr}%` })
      .orderBy('customer.customer_code', 'DESC')
      .getOne();

    // 解析序号并加1
    let sequence = 1;
    if (lastCustomer) {
      const lastSequence = parseInt(lastCustomer.customerCode.slice(-6), 10);
      sequence = lastSequence + 1;
    }

    // 格式化序号为6位
    const sequenceStr = String(sequence).padStart(6, '0');
    return `C${dateStr}${sequenceStr}`;
  }
}
```

### 3.2 销售漏斗API实现

```typescript
// ============================================
// 销售漏斗服务 - 核心业务逻辑
// ============================================

// src/opportunity/opportunity.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Opportunity } from './entities/opportunity.entity';

/**
 * 漏斗统计结果
 */
interface FunnelStat {
  stage: string;           // 阶段代码
  stageName: string;       // 阶段名称
  color: string;           // 颜色
  opportunityCount: number; // 商机数量
  totalAmount: number;     // 总金额
  avgAmount: number;       // 平均金额
  probability: number;     // 概率
  conversionRate: number;  // 转化率
  weightedAmount: number;  // 加权金额
}

@Injectable()
export class OpportunityService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
  ) {}

  /**
   * 获取销售漏斗数据
   *
   * 销售漏斗是销售管理的"仪表盘"
   * 它告诉我们：
   * - 每个阶段有多少商机
   * - 每个阶段的总金额是多少
   * - 从上一步到下一步的转化率是多少
   * - 整体的销售预测金额是多少
   */
  async getFunnelStats(tenantId: number, startDate?: Date, endDate?: Date) {
    // 定义漏斗阶段
    const stages = [
      { code: 'lead', name: '线索', probability: 10, color: '#909399' },
      { code: 'qualify', name: '资格确认', probability: 25, color: '#409EFF' },
      { code: 'proposal', name: '方案报价', probability: 50, color: '#E6A23C' },
      { code: 'negotiation', name: '合同谈判', probability: 75, color: '#F56C6C' },
      { code: 'closed', name: '成交', probability: 100, color: '#67C23A' },
    ];

    const stats: FunnelStat[] = [];
    let totalAmount = 0;

    // 遍历每个阶段，统计数量和金额
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      // 查询当前阶段的商机
      const whereCondition: any = {
        tenantId,
        stage: stage.code,
        status: In(['open', 'in_progress', 'won']),  // 只统计进行中的商机
      };

      // 如果有日期范围筛选
      if (startDate && endDate) {
        whereCondition.createdAt = Between(startDate, endDate);
      }

      const opportunities = await this.opportunityRepository.find({
        where: whereCondition,
        select: ['id', 'expectedAmount', 'probability']
      });

      // 计算统计数据
      const stageAmount = opportunities.reduce((sum, opp) => sum + opp.expectedAmount, 0);
      const count = opportunities.length;
      const avgAmount = count > 0 ? stageAmount / count : 0;

      // 加权金额 = 金额 * 概率
      // 这是销售预测的核心算法
      // 假设有10个各100万的商机，概率都是50%
      // 那么预测金额应该是 10 * 100万 * 50% = 500万
      const weightedAmount = opportunities.reduce(
        (sum, opp) => sum + opp.expectedAmount * (opp.probability / 100),
        0
      );

      // 计算转化率：当前阶段数量 / 上一阶段数量
      // 第一个阶段没有上一阶段，转化率是100%
      const prevStageCount = i > 0 ? stats[i - 1].opportunityCount : null;
      const conversionRate = prevStageCount
        ? (count / prevStageCount * 100).toFixed(1)
        : 100;

      stats.push({
        stage: stage.code,
        stageName: stage.name,
        color: stage.color,
        opportunityCount: count,
        totalAmount: stageAmount,
        avgAmount,
        probability: stage.probability,
        conversionRate: parseFloat(conversionRate),
        weightedAmount,
      });

      // 只有成交阶段的金额才加入总计（或者也可以统计所有阶段的加权金额）
      if (stage.code === 'closed') {
        totalAmount = stageAmount;
      }
    }

    // 计算总体预测金额（所有阶段加权金额之和）
    const totalWeightedAmount = stats.reduce((sum, s) => sum + s.weightedAmount, 0);

    return {
      stages: stats,
      summary: {
        totalOpportunities: stats.reduce((sum, s) => sum + s.opportunityCount, 0),
        totalAmount,
        totalWeightedAmount,
        avgWinRate: stats.length > 1
          ? (stats[stats.length - 1].opportunityCount / stats[0].opportunityCount * 100).toFixed(1)
          : 0,
      }
    };
  }

  /**
   * 商机阶段推进
   *
   * 当销售人员判断商机进展到下一阶段时调用此方法
   * 会自动更新概率、阶段名称等
   */
  async moveToNextStage(opportunityId: number, targetStage: string, userId: number) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId }
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 阶段配置
    const stageConfig = {
      lead: { name: '线索', probability: 10 },
      qualify: { name: '资格确认', probability: 25 },
      proposal: { name: '方案报价', probability: 50 },
      negotiation: { name: '合同谈判', probability: 75 },
      closed: { name: '成交', probability: 100 },
    };

    const config = stageConfig[targetStage as keyof typeof stageConfig];

    // 更新商机阶段
    opportunity.stage = targetStage;
    opportunity.stageName = config.name;
    opportunity.probability = config.probability;

    // 计算加权金额
    opportunity.weightedAmount = opportunity.expectedAmount * (config.probability / 100);

    // 如果是成交阶段
    if (targetStage === 'closed') {
      opportunity.status = 'won';
      opportunity.actualCloseDate = new Date();
    }

    await this.opportunityRepository.save(opportunity);

    // 记录阶段变更日志（用于销售过程分析）
    await this.recordStageChangeLog(opportunityId, opportunity.stage, userId);

    return opportunity;
  }
}
```

## 四、前端实现

### 4.1 React组件设计

```tsx
// ============================================
// CRM前端 - 客户列表页面
// ============================================

// src/pages/crm/customers/index.tsx
import React, { useState } from 'react';
import {
  Table, Card, Button, Input, Select, Space, Tag,
  Modal, message, Popconfirm
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCustomerList, useCustomerDelete, useCustomerCreate } from '../../../hooks/useCustomer';

/**
 * 客户等级标签颜色映射
 * A类客户（重点客户）用红色，更醒目
 * B类客户（普通客户）用蓝色
 * C类客户（潜在客户）用灰色
 */
const levelColors = {
  'A': 'red',
  'B': 'blue',
  'C': 'default'
};

/**
 * 客户列表页面组件
 *
 * 这是一个典型的管理后台列表页面
 * 包含：筛选区域、数据表格、分页功能
 */
export default function CustomerListPage() {
  // ========== 状态管理 ==========

  // 筛选条件状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // ========== 数据获取 ==========
  // 使用自定义hooks获取客户列表数据
  // 这样做的好处是数据获取逻辑可以被复用
  const { data, isLoading, refetch } = useCustomerList({
    keyword: searchKeyword,
    customerLevel: filterLevel,
    industry: filterIndustry,
    page,
    pageSize,
  });

  // ========== 数据操作hooks ==========
  const deleteMutation = useCustomerDelete();
  const createMutation = useCustomerCreate();

  // ========== 表格列定义 ==========
  /**
   * 表格列配置
   * 每一列定义了如何展示对应的字段
   */
  const columns: ColumnsType<Customer> = [
    {
      title: '客户编码',
      dataIndex: 'customerCode',
      width: 150,
      fixed: 'left',
      // 渲染函数，可以自定义显示内容
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>
          {code}
        </span>
      ),
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      width: 250,
      // 固定显示在左侧，不随横向滚动消失
      fixed: 'left',
      ellipsis: true,
      // 点击客户名称可以查看详情（这里用a标签模拟）
      render: (name: string, record) => (
        <a onClick={() => handleViewDetail(record.id)}>{name}</a>
      ),
    },
    {
      title: '客户类型',
      dataIndex: 'customerType',
      width: 100,
      // 枚举值映射为企业/个人
      render: (type: string) => type === 'enterprise' ? '企业' : '个人',
    },
    {
      title: '行业',
      dataIndex: 'industry',
      width: 120,
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      width: 100,
      // 使用Tag组件展示等级，不同等级不同颜色
      render: (level: string) => (
        <Tag color={levelColors[level as keyof typeof levelColors]}>
          {level === 'A' ? 'A类(重点)' : level === 'B' ? 'B类(普通)' : 'C类(潜在)'}
        </Tag>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contacts',
      width: 150,
      // contacts是JSON数组，需要解析后显示
      render: (contacts: Contact[]) => {
        // 找到主要联系人
        const primary = contacts.find(c => c.isPrimary) || contacts[0];
        return primary ? `${primary.name} (${primary.position})` : '-';
      },
    },
    {
      title: '最近跟进',
      dataIndex: 'lastFollowupAt',
      width: 150,
      // 格式化日期显示
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '未跟进',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'gray'}>
          {status === 'active' ? '活跃' : '不活跃'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      // 操作列固定在右侧
      render: (_, record) => (
        <Space size="small">
          {/* 查看详情按钮 */}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {/* 编辑按钮 */}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {/* 删除按钮 - 需要确认 */}
          <Popconfirm
            title="确定删除该客户吗？"
            description="删除后可以在回收站恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ========== 事件处理 ==========

  /**
   * 查看客户详情
   * 跳转到客户详情页面
   */
  const handleViewDetail = (customerId: number) => {
    // 使用Next.js的路由跳转
    // 这里假设有一个 /crm/customers/[id] 的详情页面
    window.location.href = `/crm/customers/${customerId}`;
  };

  /**
   * 编辑客户
   * 打开编辑模态框
   */
  const handleEdit = (customer: Customer) => {
    // 设置当前编辑的客户数据，打开模态框
    setEditingCustomer(customer);
    setEditModalVisible(true);
  };

  /**
   * 删除客户
   * 调用API删除，然后刷新列表
   */
  const handleDelete = async (customerId: number) => {
    try {
      await deleteMutation.mutateAsync(customerId);
      message.success('客户删除成功');
      // 刷新列表
      refetch();
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  /**
   * 搜索处理
   * 搜索时重置页码为1
   */
  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  /**
   * 分页变化处理
   */
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <h1 style={{ marginBottom: 24 }}>客户管理</h1>

      {/* 筛选区域 - 使用Card包裹 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          {/* 关键词搜索 */}
          <Input
            placeholder="搜索客户名称/编码"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />

          {/* 客户等级筛选 */}
          <Select
            placeholder="客户等级"
            value={filterLevel || undefined}
            onChange={(value) => setFilterLevel(value || '')}
            allowClear
            style={{ width: 120 }}
          >
            <Select.Option value="A">A类(重点)</Select.Option>
            <Select.Option value="B">B类(普通)</Select.Option>
            <Select.Option value="C">C类(潜在)</Select.Option>
          </Select>

          {/* 行业筛选 */}
          <Select
            placeholder="所属行业"
            value={filterIndustry || undefined}
            onChange={(value) => setFilterIndustry(value || '')}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="互联网">互联网</Select.Option>
            <Select.Option value="金融">金融</Select.Option>
            <Select.Option value="制造业">制造业</Select.Option>
            <Select.Option value="零售">零售</Select.Option>
            <Select.Option value="教育">教育</Select.Option>
          </Select>

          {/* 搜索按钮 */}
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>

          {/* 新建客户按钮 */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建客户
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          // dataSource 是表格的数据源
          dataSource={data?.list || []}
          // rowKey 指定每一行的唯一标识字段
          rowKey="id"
          // loading 状态
          loading={isLoading}
          // 分页配置
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange,
          }}
          // 滚动配置
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 创建客户模态框 - 这里只是占位，实际需要单独组件 */}
      <CreateCustomerModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          refetch();
          message.success('客户创建成功');
        }}
      />
    </div>
  );
}
```

### 4.2 销售漏斗可视化组件

```tsx
// ============================================
// 销售漏斗可视化组件
// ============================================

// src/components/crm/SalesFunnelChart.tsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface FunnelData {
  name: string;
  value: number;
  amount: number;
  color: string;
}

/**
 * 销售漏斗图组件
 *
 * 使用ECharts实现漏斗图的可视化
 * 漏斗图的原理是：
 * - 每个阶段的宽度（或面积）与数量成正比
 * - 从上到下逐渐变窄，表示转化率下降
 */
export function SalesFunnelChart({ data }: { data: FunnelData[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表实例
    chartInstance.current = echarts.init(chartRef.current);

    // 配置漏斗图
    const option: echarts.EChartsOption = {
      // 标题
      title: {
        text: '销售漏斗',
        left: 'center',
        top: 10,
      },
      // 提示框
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          return `
            <div style="font-size: 12px">
              <div style="font-weight: bold; margin-bottom: 4px">${data.name}</div>
              <div>商机数量：${data.value}</div>
              <div>总金额：¥${(data.amount / 10000).toFixed(1)}万</div>
            </div>
          `;
        },
      },
      // 图例
      legend: {
        data: data.map(d => d.name),
        bottom: 10,
      },
      // 漏斗图系列
      series: [
        {
          name: '销售漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          // 漏斗图数据排序：升序/降序
          sort: 'descending',
          // 漏斗图对齐方式
          gap: 2,
          // 标签配置
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const data = params.data;
              return `${data.name}\n${data.value}个\n¥${(data.amount / 10000).toFixed(1)}万`;
            },
          },
          // 标签线配置
          labelLine: {
            show: false,
          },
          // 每一项的样式
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          // 数据配置
          data: data.map(d => ({
            name: d.name,
            value: d.value,
            amount: d.amount,
            itemStyle: {
              color: d.color,
            },
          })),
        },
      ],
    };

    // 设置图表配置
    chartInstance.current.setOption(option);

    // 响应窗口大小变化
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: 400 }} />;
}

/**
 * 漏斗统计表格组件
 * 配合漏斗图展示详细数据
 */
export function FunnelStatsTable({ stats }: { stats: FunnelStat[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={thStyle}>阶段</th>
          <th style={thStyle}>商机数量</th>
          <th style={thStyle}>总金额</th>
          <th style={thStyle}>平均金额</th>
          <th style={thStyle}>转化率</th>
          <th style={thStyle}>预测金额</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((stat, index) => (
          <tr key={stat.stage}>
            {/* 阶段名称 - 带颜色标识 */}
            <td style={tdStyle}>
              <span
                style={{
                  ...stageBadge,
                  backgroundColor: stat.color,
                }}
              >
                {stat.stageName}
              </span>
            </td>
            {/* 商机数量 */}
            <td style={tdStyle}>{stat.opportunityCount}</td>
            {/* 总金额 - 格式化显示 */}
            <td style={tdStyle}>
              ¥{(stat.totalAmount / 10000).toFixed(1)}万
            </td>
            {/* 平均金额 */}
            <td style={tdStyle}>
              ¥{(stat.avgAmount / 10000).toFixed(1)}万
            </td>
            {/* 转化率 */}
            <td style={tdStyle}>
              {index === 0 ? '-' : `${stat.conversionRate}%`}
            </td>
            {/* 预测金额 - 加权计算 */}
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>
              ¥{(stat.weightedAmount / 10000).toFixed(1)}万
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 样式定义
const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '1px solid #e8e8e8',
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid #e8e8e8',
};

const stageBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '12px',
};
```

### 4.3 自定义Hooks封装

```typescript
// ============================================
// CRM数据获取Hooks
// ============================================

// src/hooks/useCustomer.ts
import useSWR from 'swr';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 客户列表数据获取Hook
 *
 * 使用SWR进行数据获取和缓存
 * 特点：
 * - 自动缓存：相同key的请求会复用缓存
 * - 乐观更新：数据变更时立即更新UI
 * - 错误重试：请求失败时自动重试
 */
export function useCustomerList(params: {
  keyword?: string;
  customerLevel?: string;
  industry?: string;
  page: number;
  pageSize: number;
}) {
  // 构建查询字符串
  const queryString = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.customerLevel && { customerLevel: params.customerLevel }),
    ...(params.industry && { industry: params.industry }),
  }).toString();

  // 使用SWR获取数据
  return useSWR(
    `/api/crm/customers?${queryString}`,
    // fetcher函数：定义如何获取数据
    (url) => fetch(url).then(res => res.json()),
    {
      // 重新请求的策略
      revalidateOnFocus: false,    // 窗口聚焦时不重新请求
      dedupingInterval: 5000,       // 5秒内的重复请求去重
    }
  );
}

/**
 * 获取客户详情Hook
 */
export function useCustomerDetail(id: number) {
  return useSWR(
    id ? `/api/crm/customers/${id}` : null,
    (url) => fetch(url).then(res => res.json())
  );
}

/**
 * 获取客户360度视图Hook
 */
export function useCustomer360View(id: number) {
  return useSWR(
    id ? `/api/crm/customers/${id}/360-view` : null,
    (url) => fetch(url).then(res => res.json())
  );
}

/**
 * 创建客户Mutation
 *
 * 使用React Query的useMutation
 * 用于处理创建客户的操作
 */
export function useCustomerCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    // 异步函数，执行实际的创建操作
    mutationFn: async (data: CreateCustomerDto) => {
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('创建客户失败');
      }

      return response.json();
    },
    // 成功后回调
    onSuccess: () => {
      // 清除客户列表缓存，触发重新获取
      // 这样新创建的客户会立即出现在列表中
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers'] });
    },
  });
}

/**
 * 更新客户Mutation
 */
export function useCustomerUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerDto }) => {
      const response = await fetch(`/api/crm/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('更新客户失败');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 清除特定客户的缓存和列表缓存
      queryClient.invalidateQueries({ queryKey: [`/api/crm/customers/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers'] });
    },
  });
}

/**
 * 删除客户Mutation
 */
export function useCustomerDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crm/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除客户失败');
      }

      return response.json();
    },
    onSuccess: () => {
      // 清除列表缓存
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers'] });
    },
  });
}
```

## 五、实战技巧与最佳实践

### 5.1 客户分配策略

在企业级CRM系统中，客户分配是一个核心功能。新客户来了，应该分配给哪个销售？这里面有很多策略：

```typescript
/**
 * 客户分配策略
 *
 * 常见的分配策略有：
 * 1. 轮询分配：按顺序轮流分配给每个销售
 * 2. 负载均衡：分配给当前负载最轻的销售
 * 3. 区域分配：按地理区域分配
 * 4. 能力匹配：根据销售的能力特长分配
 * 5. 业绩优先：优先分配给业绩好的销售
 */

/**
 * 轮询分配策略
 *
 * 这是最公平的策略
 * 假设有3个销售：A、B、C
 * 第1个客户给A，第2个给B，第3个给C，第4个又给A
 */
class RoundRobinAllocation {
  private currentIndex = 0;  // 当前索引

  constructor(private sales: Salesperson[]) {}

  /**
   * 获取下一个应该分配的销售
   */
  allocate(): Salesperson {
    const sales = this.sales[this.currentIndex];
    // 更新索引，如果到了末尾就回到开头
    this.currentIndex = (this.currentIndex + 1) % this.sales.length;
    return sales;
  }
}

/**
 * 负载均衡分配策略
 *
 * 这个策略考虑每个销售的当前工作量
 * 客户数量少的销售会优先被分配
 */
class LoadBalancedAllocation {
  constructor(private sales: Salesperson[]) {}

  allocate(): Salesperson {
    // 按当前客户数量排序，数量最少的排在前面
    const sortedSales = [...this.sales].sort(
      (a, b) => a.currentCustomers - b.currentCustomers
    );

    // 返回客户数量最少的销售
    return sortedSales[0];
  }
}

/**
 * 区域分配策略
 *
 * 根据客户所在的地理位置分配
 * 北京的客户分配给负责北京区域的销售
 */
class TerritoryAllocation {
  private territoryMap: Map<string, number>;  // 区域 -> 销售ID的映射

  constructor(sales: Salesperson[]) {
    // 初始化区域映射
    this.territoryMap = new Map();
    sales.forEach(s => {
      s.territories.forEach(t => {
        this.territoryMap.set(t, s.id);
      });
    });
  }

  allocate(customer: Customer): Salesperson | null {
    // 根据客户的城市查找对应的销售
    const salesId = this.territoryMap.get(customer.city);
    if (salesId) {
      return this.sales.find(s => s.id === salesId);
    }
    return null;  // 没有找到对应区域，返回null
  }
}
```

### 5.2 销售预测算法

```typescript
/**
 * 销售预测算法
 *
 * 销售预测是CRM系统的核心功能之一
 * 它帮助管理者了解：
 * - 本月能完成多少销售额？
 * - 哪些商机最有可能成交？
 * - 应该如何调整销售策略？
 */

/**
 * 加权金额法
 *
 * 这是最简单也最常用的预测方法
 * 预测金额 = 商机金额 * 概率
 *
 * 例如：
 * - 商机A：100万，概率50%，预测50万
 * - 商机B：200万，概率30%，预测60万
 * - 商机C：50万，概率80%，预测40万
 *
 * 总预测 = 50 + 60 + 40 = 150万
 */
function weightedAmountForecast(opportunities: Opportunity[]): number {
  return opportunities.reduce((sum, opp) => {
    return sum + opp.expectedAmount * (opp.probability / 100);
  }, 0);
}

/**
 * 阶段概率法
 *
 * 根据漏斗各阶段的转化率来预测
 *
 * 假设：
 * - 线索阶段有100个商机
 * - 线索->资格的转化率是30%
 * - 资格->方案的转化率是40%
 * - ...以此类推
 *
 * 预测成交数量 = 线索数量 * 各阶段转化率的乘积
 */
function stageProbabilityForecast(
  funnelStats: FunnelStat[]
): { expectedDeals: number; expectedAmount: number } {
  // 线索阶段的商机数量
  const leadCount = funnelStats[0].opportunityCount;

  // 计算总体转化率
  // 转化率 = 成交数量 / 线索数量
  const closedStage = funnelStats.find(s => s.stage === 'closed');
  const overallConversion = closedStage && leadCount > 0
    ? closedStage.opportunityCount / leadCount
    : 0;

  // 预测成交数量
  const expectedDeals = Math.round(leadCount * overallConversion);

  // 预测成交金额（假设平均订单金额）
  const avgDealAmount = closedStage?.avgAmount || 0;
  const expectedAmount = expectedDeals * avgDealAmount;

  return { expectedDeals, expectedAmount };
}

/**
 * 移动平均法
 *
 * 根据最近几个月的成交数据来预测
 *
 * 例如：
 * - 1月成交100万
 * - 2月成交120万
 * - 3月成交110万
 *
 * 移动平均 = (100 + 120 + 110) / 3 = 110万
 *
 * 如果要更重视最近的数据，可以用加权移动平均
 * 加权移动平均 = 100*0.2 + 120*0.3 + 110*0.5 = 111万
 */
function movingAverageForecast(
  historicalData: MonthlySales[],
  periods: number = 3
): number {
  // 取最近n个月的数据
  const recentData = historicalData.slice(-periods);

  // 计算简单平均
  const sum = recentData.reduce((s, d) => s + d.amount, 0);
  return sum / recentData.length;
}

/**
 * 指数平滑法
 *
 * 这是一种更智能的预测方法
 * 它综合考虑了历史数据和预测值
 *
 * 公式：预测值 = 平滑系数 * 上期实际值 + (1-平滑系数) * 上期预测值
 *
 * 平滑系数的取值范围是0-1
 * - 系数越大，说明越重视近期数据
 * - 系数越小，说明预测越平稳
 */
function exponentialSmoothingForecast(
  historicalData: number[],
  alpha: number = 0.3  // 平滑系数
): number {
  if (historicalData.length === 0) return 0;

  // 初始预测值就是第一个月的实际值
  let forecast = historicalData[0];

  // 逐月计算预测值
  for (let i = 1; i < historicalData.length; i++) {
    forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
  }

  return forecast;
}
```

### 5.3 跟进提醒系统

```typescript
/**
 * 跟进提醒系统
 *
 * 这是CRM系统中非常重要的功能
 * 销售人员每天要跟进很多客户
 * 如果没有一个提醒系统，很容易遗漏重要的跟进
 */

/**
 * 提醒任务类型
 */
interface ReminderTask {
  id: string;
  customerId: number;
  opportunityId?: number;
  type: 'followup' | 'meeting' | 'call' | 'email';
  title: string;
  description?: string;
  dueDate: Date;
  assigneeId: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * 跟进提醒服务
 */
class FollowupReminderService {
  /**
   * 创建跟进提醒
   */
  async createReminder(data: {
    customerId: number;
    type: string;
    title: string;
    dueDate: Date;
    assigneeId: number;
  }): Promise<ReminderTask> {
    // 创建提醒任务
    const reminder = await this.reminderRepository.create({
      ...data,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
    });

    // 计算提醒时间
    // 例如：提前15分钟提醒
    const reminderTime = new Date(data.dueDate.getTime() - 15 * 60 * 1000);

    // 将任务加入延迟队列
    await this.delayQueue.add(
      'reminder-notification',
      { reminderId: reminder.id },
      { delay: reminderTime.getTime() - Date.now() }
    );

    return reminder;
  }

  /**
   * 处理提醒通知
   *
   * 当提醒时间到了，这个方法会被调用
   * 发送通知给销售人员
   */
  async processReminderNotification(reminderId: string) {
    const reminder = await this.reminderRepository.findById(reminderId);

    if (!reminder || reminder.status !== 'pending') {
      return;  // 提醒不存在或已取消
    }

    // 获取销售人员信息
    const sales = await this.salespersonRepository.findById(reminder.assigneeId);

    // 发送通知
    // 这里支持多种通知渠道
    await Promise.all([
      // 站内通知
      this.notificationService.sendInAppNotification({
        userId: reminder.assigneeId,
        title: '跟进提醒',
        content: reminder.title,
        data: { reminderId: reminder.id },
      }),

      // 邮件通知
      sales.email && this.emailService.sendEmail({
        to: sales.email,
        subject: `【跟进提醒】${reminder.title}`,
        body: this.renderReminderEmail(reminder),
      }),

      // 短信通知（高优先级提醒）
      reminder.priority === 'high' && sales.phone && this.smsService.sendSMS({
        to: sales.phone,
        content: `【CRM提醒】${reminder.title}，请及时处理`,
      }),
    ]);
  }
}
```

## 六、扩展功能设计

### 6.1 客户合并与查重

```typescript
/**
 * 客户查重与合并
 *
 * 在企业实际使用中，经常会出现重复的客户记录
 * 比如：
 * - 销售A录入了一个客户"深圳市腾讯科技有限公司"
 * - 销售B也录入了一个客户"腾讯科技"
 * - 其实这是同一家公司
 */

/**
 * 相似度匹配算法
 *
 * 使用编辑距离（Levenshtein Distance）来计算两个字符串的相似度
 *
 * 例如：
 * - "深圳市腾讯科技有限公司" 和 "腾讯科技"
 *   编辑距离 = 6（需要删除和替换一些字符）
 *   相似度 = 1 - 6 / max(12, 4) = 0.5
 *
 * - "深圳市腾讯科技有限公司" 和 "深圳市腾讯科技有限公司"
 *   编辑距离 = 0
 *   相似度 = 1
 */
function stringSimilarity(str1: string, str2: string): number {
  // 预处理：转小写、去空格
  const s1 = str1.toLowerCase().replace(/\s/g, '');
  const s2 = str2.toLowerCase().replace(/\s/g, '');

  // 计算编辑距离
  const distance = levenshteinDistance(s1, s2);

  // 计算相似度
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * 编辑距离算法
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // 创建DP表
  const dp: number[][] = Array(m + 1).fill(null)
    .map(() => Array(n + 1).fill(0));

  // 初始化边界
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // 填表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],      // 删除
          dp[i][j - 1],      // 插入
          dp[i - 1][j - 1]   // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 客户相似度检测
 */
interface SimilarityResult {
  customerId1: number;
  customerId2: number;
  similarity: number;
  matchType: 'name' | 'phone' | 'email' | 'unifiedCreditCode';
}

async function findSimilarCustomers(
  tenantId: number,
  threshold: number = 0.8
): Promise<SimilarityResult[]> {
  const customers = await this.customerRepository.find({ where: { tenantId } });
  const results: SimilarityResult[] = [];

  // 两两比较（实际生产中需要优化，避免O(n²)）
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const c1 = customers[i];
      const c2 = customers[j];

      // 1. 名称相似度检查
      const nameSimilarity = stringSimilarity(c1.customerName, c2.customerName);
      if (nameSimilarity >= threshold) {
        results.push({
          customerId1: c1.id,
          customerId2: c2.id,
          similarity: nameSimilarity,
          matchType: 'name',
        });
        continue;
      }

      // 2. 统一社会信用代码检查（如果有的话）
      // 统一社会信用代码是唯一标识，100%匹配就是同一客户
      if (c1.unifiedCreditCode && c2.unifiedCreditCode &&
          c1.unifiedCreditCode === c2.unifiedCreditCode) {
        results.push({
          customerId1: c1.id,
          customerId2: c2.id,
          similarity: 1.0,
          matchType: 'unifiedCreditCode',
        });
        continue;
      }

      // 3. 联系人电话检查
      // 从JSON中提取所有联系电话进行比对
      const phones1 = extractPhones(c1.contacts);
      const phones2 = extractPhones(c2.contacts);
      const commonPhone = phones1.some(p => phones2.includes(p));
      if (commonPhone) {
        results.push({
          customerId1: c1.id,
          customerId2: c2.id,
          similarity: 1.0,
          matchType: 'phone',
        });
      }
    }
  }

  return results;
}
```

### 6.2 数据导入与导出

```typescript
/**
 * 客户数据导入
 *
 * 企业通常有大量现有客户数据需要导入到CRM系统
 * 支持Excel和CSV格式
 */

interface ImportResult {
  success: number;        // 成功导入的数量
  failed: number;         // 导入失败的数量
  errors: ImportError[];  // 具体的错误信息
}

interface ImportError {
  row: number;            // 行号
  field: string;          // 字段名
  value: any;             // 出错的值
  errorMessage: string;   // 错误信息
}

/**
 * Excel导入服务
 */
class CustomerImportService {
  /**
   * 从Excel文件导入客户数据
   */
  async importFromExcel(
    file: Express.Multer.File,
    tenantId: number
  ): Promise<ImportResult> {
    // 使用xlsx库解析Excel文件
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 转换为JSON数组
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // 逐行处理
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // 数据验证
        this.validateRow(row, i + 2);  // +2 因为表头是第1行，数据从第2行开始

        // 数据转换
        const customerData = this.transformRowToCustomer(row, tenantId);

        // 查重检查
        const exists = await this.checkDuplicate(customerData, tenantId);
        if (exists) {
          // 如果已存在，更新还是跳过？
          // 这里我们选择跳过，由用户手动处理
          result.errors.push({
            row: i + 2,
            field: 'customerName',
            value: row['客户名称'],
            errorMessage: '客户已存在，跳过导入',
          });
          result.failed++;
          continue;
        }

        // 保存到数据库
        await this.customerRepository.save(customerData);
        result.success++;

      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          field: error.field || 'unknown',
          value: error.value,
          errorMessage: error.message,
        });
      }
    }

    return result;
  }

  /**
   * 验证行数据
   */
  private validateRow(row: any, rowIndex: number) {
    // 必填字段检查
    if (!row['客户名称']) {
      throw { field: 'customerName', value: null, message: '客户名称不能为空' };
    }

    // 手机号格式检查
    if (row['联系电话']) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(row['联系电话'])) {
        throw {
          field: 'phone',
          value: row['联系电话'],
          message: '手机号格式不正确'
        };
      }
    }

    // 客户等级只能是A/B/C
    if (row['客户等级'] && !['A', 'B', 'C'].includes(row['客户等级'])) {
      throw {
        field: 'customerLevel',
        value: row['客户等级'],
        message: '客户等级必须是A、B或C'
      };
    }
  }
}
```

## 七、总结

### 7.1 CRM系统核心要点回顾

1. **客户数据模型**：以客户为核心，关联联系人、销售机会、跟进记录、合同等
2. **销售漏斗**：可视化销售过程，量化转化率，预测销售业绩
3. **跟进管理**：记录每一次客户接触，确保销售过程可追溯
4. **数据分析**：通过统计报表指导销售决策

### 7.2 技术架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端技术栈                               │
│  React 19 + TypeScript + Ant Design 6 + ECharts                 │
│  状态管理：Zustand（前端状态）+ SWR（服务端状态）                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API网关层                                │
│  Next.js API Routes / NestJS Controller                         │
│  认证：JWT / 权限：RBAC                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         业务逻辑层                                │
│  客户分配算法 / 销售预测算法 / 漏斗统计                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据持久层                                │
│  PostgreSQL + TypeORM                                            │
│  多租户：tenant_id 隔离                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 后续扩展方向

1. **营销自动化**：根据客户行为自动触发营销动作
2. **智能推荐**：基于历史数据推荐最适合的销售策略
3. **数据分析增强**：更深入的BI报表和数据挖掘
4. **移动端应用**：Salesforce风格的移动CRM应用
