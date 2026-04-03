# SCM供应链管理系统实战

## 一、系统概述与核心概念

### 1.1 什么是供应链？

想象你开了一家奶茶店。需要做的事情很简单：买茶叶、买牛奶、买杯子，然后做成奶茶卖给顾客。

但如果仔细想想，这背后其实有一套复杂的流程：
- **采购**：谁给我供茶叶？多少钱？什么时候送到？
- **库存**：茶叶放哪儿？放多少？放久了会不会坏？
- **物流**：茶叶从云南发货，3天后到货，牛奶从本地进货，半天就到，怎么协调？
- **供应商**：茶叶供应商突然说断货了怎么办？要不要找备用的？
- **资金**：进货要付钱，但顾客可能30天后才付款，现金流怎么周转？

**供应链（Supply Chain）** 就是从原材料采购开始，到生产制造，再到分销配送，最终到达消费者手中的整个链条。

**SCM（Supply Chain Management，供应链管理系统）** 就是帮助企业管理这个链条的系统，确保：
- 需要的物资能及时买到
- 库存既不过多也不短缺
- 货物能准时送达
- 成本能控制住

### 1.2 供应链管理的核心领域

| 核心模块 | 解决的问题 | 业务价值 |
|----------|------------|----------|
| **采购管理** | 买什么？找谁买？买多少？ | 降低采购成本，确保物资供应 |
| **库存管理** | 放多少？放哪儿？什么时候补货？ | 减少库存积压，避免缺货损失 |
| **物流配送** | 怎么送？走什么路线？多久到？ | 提升配送效率，降低运输成本 |
| **供应商管理** | 供应商靠谱吗？绩效怎么样？ | 优化供应商结构，降低风险 |
| **供应链金融** | 钱不够怎么办？账期怎么谈？ | 缓解资金压力，优化现金流 |

### 1.3 供应链与传统系统的区别

```
┌─────────────────────────────────────────────────────────────────┐
│                      企业信息系统架构                             │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│      CRM      │      SCM      │      ERP     │      HRM        │
│  客户关系管理  │  供应链管理    │   企业资源计划 │   人力资源管理   │
├───────────────┼───────────────┼───────────────┼─────────────────┤
│  销售订单     │  采购订单      │  生产计划     │  员工管理        │
│  客户管理     │  供应商管理    │  物料清单    │  薪酬福利        │
│  营销自动化   │  库存管理      │  财务核算    │  考勤考核        │
│  服务支持     │  物流配送      │  质量管理    │  培训发展        │
└───────────────┴───────────────┴───────────────┴─────────────────┘

SCM的特点：
1. 强调"物的流动"：从供应商到客户
2. 强调"信息流"：订单、发货、入库等信息的实时同步
3. 强调"资金流"：付款、收款、账期管理
4. 强调整体优化：不是单个环节最优，而是整体最优
```

## 二、数据库设计与数据模型

### 2.1 核心数据表设计

```sql
-- ============================================
-- SCM供应链系统 - 核心数据表设计
-- ============================================

-- ============================================
-- 供应商管理
-- ============================================

-- 供应商主数据表
-- 存储供应商的基本信息、资质、评级等
CREATE TABLE suppliers (
    id                  BIGSERIAL PRIMARY KEY,
    supplier_code      VARCHAR(50) UNIQUE NOT NULL,      -- 供应商编码
    supplier_name      VARCHAR(200) NOT NULL,             -- 供应商名称
    supplier_type      VARCHAR(30),                       -- 供应商类型：制造商/贸易商/个体
    country            VARCHAR(50),                       -- 国家
    province           VARCHAR(50),                       -- 省份
    city               VARCHAR(50),                       -- 城市
    address            VARCHAR(500),                      -- 详细地址

    -- 联系方式
    contact_name       VARCHAR(100),                      -- 联系人姓名
    contact_phone      VARCHAR(50),                       -- 联系电话
    contact_email      VARCHAR(100),                      -- 电子邮箱
    contact_wechat     VARCHAR(100),                      -- 微信

    -- 营业执照信息
    business_license   VARCHAR(200),                      -- 营业执照号
    license_expire_date DATE,                            -- 证照到期日期
    unified_credit_code VARCHAR(50),                      -- 统一社会信用代码

    -- 资质认证
    qualifications     JSONB DEFAULT '[]',               -- 资质证书列表
    -- qualifications 示例：
    -- [
    --   {"type": "ISO9001", "issueDate": "2020-01-01", "expireDate": "2025-01-01"},
    --   {"type": "生产许可证", "issueDate": "2019-06-01", "expireDate": "2024-06-01"}
    -- ]

    -- 主营业务
    main_products      TEXT[],                           -- 主要产品类别
    main_categories     VARCHAR(200)[],                   -- 主营品类

    -- 合作信息
    cooperation_status VARCHAR(20) DEFAULT 'potential',   -- potential/active/suspended/terminated
    cooperation_since  DATE,                              -- 开始合作时间
    payment_terms      VARCHAR(50),                       -- 付款条款：预付/账期30天/账期60天
    credit_limit       DECIMAL(15,2) DEFAULT 0,           -- 信用额度

    -- 绩效评估
    quality_score      DECIMAL(3,1) DEFAULT 0,            -- 质量评分 0-100
    delivery_score     DECIMAL(3,1) DEFAULT 0,           -- 交期评分 0-100
    price_score        DECIMAL(3,1) DEFAULT 0,            -- 价格评分 0-100
    service_score      DECIMAL(3,1) DEFAULT 0,            -- 服务评分 0-100
    overall_score      DECIMAL(3,1) DEFAULT 0,           -- 综合评分 0-100

    -- 风险评估
    risk_level         VARCHAR(10) DEFAULT 'low',         -- low/medium/high
    blacklist          BOOLEAN DEFAULT false,            -- 是否在黑名单

    -- 附件
    attachments        JSONB DEFAULT '[]',               -- 营业执照、合同等附件

    -- 状态
    status             VARCHAR(20) DEFAULT 'active',      -- active/inactive/pending_review
    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_status ON suppliers(cooperation_status);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);

-- ============================================
-- 采购管理
-- ============================================

-- 采购需求表
-- 各部门/项目提交采购申请
CREATE TABLE purchase_requisitions (
    id                  BIGSERIAL PRIMARY KEY,
    requisition_code    VARCHAR(50) UNIQUE NOT NULL,      -- 申请单号
    title               VARCHAR(200) NOT NULL,            -- 申请标题

    -- 申请信息
    applicant_id        BIGINT NOT NULL,                  -- 申请人ID
    applicant_name      VARCHAR(100),                     -- 申请人姓名
    department_id       BIGINT,                           -- 申请部门ID
    department_name     VARCHAR(100),                     -- 部门名称
    project_code        VARCHAR(50),                       -- 项目编号（如果有）
    project_name        VARCHAR(200),                     -- 项目名称

    -- 紧急程度
    urgency_level       VARCHAR(20) DEFAULT 'normal',     -- normal/urgent/hot_urgent

    -- 期望交付日期
    expected_date       DATE,

    -- 申请明细
    items               JSONB NOT NULL DEFAULT '[]',
    -- items 示例：
    -- [
    --   {"productId": 1, "productName": "蒙古熟羊肉", "sku": "SKU001", "quantity": 100, "unit": "kg", "estimatedPrice": 45, "purpose": "餐厅使用"},
    --   {"productId": 2, "productName": "羊肉串", "sku": "SKU002", "quantity": 500, "unit": "串", "estimatedPrice": 3, "purpose": "促销使用"}
    -- ]

    -- 预算信息
    total_amount        DECIMAL(15,2) DEFAULT 0,          -- 预算总额
    budget_code         VARCHAR(50),                       -- 预算科目

    -- 审批信息
    approval_status     VARCHAR(20) DEFAULT 'draft',      -- draft/pending/approved/rejected
    approval_flow_id    BIGINT,                           -- 审批流程ID
    current_approver    BIGINT,                           -- 当前审批人

    -- 关联采购单
    purchase_order_id   BIGINT,                           -- 关联的采购订单ID

    -- 备注
    remark              TEXT,

    tenant_id           BIGINT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requisitions_status ON purchase_requisitions(approval_status);
CREATE INDEX idx_requisitions_applicant ON purchase_requisitions(applicant_id);

-- 采购订单表
-- 与供应商签订的正式采购合同
CREATE TABLE purchase_orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_code          VARCHAR(50) UNIQUE NOT NULL,      -- 订单编号

    -- 供应商信息
    supplier_id         BIGINT NOT NULL,
    supplier_code       VARCHAR(50),
    supplier_name       VARCHAR(200),
    supplier_contact    VARCHAR(100),
    supplier_phone      VARCHAR(50),

    -- 订单信息
    order_type          VARCHAR(20) DEFAULT 'standard',   -- standard/rush/contract
    title               VARCHAR(200),                      -- 订单标题
    currency            VARCHAR(10) DEFAULT 'CNY',         -- 币种

    -- 日期信息
    order_date          DATE NOT NULL,                    -- 下单日期
    expected_start_date DATE,                             -- 期望开始收货日期
    expected_end_date   DATE,                             -- 期望结束收货日期
    signed_date         DATE,                             -- 合同签订日期

    -- 订单明细
    items               JSONB NOT NULL DEFAULT '[]',
    -- items 结构：
    -- [
    --   {"lineNo": 1, "productId": 1, "productName": "羊肉", "sku": "SKU001", "unit": "kg",
    --    "quantity": 100, "unitPrice": 45, "amount": 4500, "deliveryDate": "2024-01-20",
    --    "deliveredQuantity": 0, "receivedQuantity": 0, "status": "pending"},
    --   {"lineNo": 2, "productId": 2, "productName": "孜然", "sku": "SKU005", "unit": "kg",
    --    "quantity": 20, "unitPrice": 25, "amount": 500, "deliveryDate": "2024-01-20",
    --    "deliveredQuantity": 0, "receivedQuantity": 0, "status": "pending"}
    -- ]

    -- 金额信息
    subtotal_amount     DECIMAL(15,2) DEFAULT 0,          -- 小计金额
    tax_amount          DECIMAL(15,2) DEFAULT 0,          -- 税额
    discount_amount     DECIMAL(15,2) DEFAULT 0,          -- 折扣金额
    total_amount        DECIMAL(15,2) DEFAULT 0,           -- 订单总金额
    paid_amount         DECIMAL(15,2) DEFAULT 0,           -- 已付款金额

    -- 付款条款
    payment_terms       VARCHAR(50),                       -- 付款方式：预付30%/货到付款/账期30天
    payment_status      VARCHAR(20) DEFAULT 'unpaid',    -- unpaid/partially_paid/paid

    -- 收货地址
    delivery_address    VARCHAR(500),
    delivery_contact    VARCHAR(100),
    delivery_phone      VARCHAR(50),

    -- 订单状态
    status              VARCHAR(20) DEFAULT 'issued',     -- draft/issued/partial/completed/cancelled/closed
    completion_date     DATE,                             -- 完成日期

    -- 附件
    attachments         JSONB DEFAULT '[]',               -- 合同、附件

    -- 验收信息
    inspection_type     VARCHAR(20) DEFAULT 'normal',     -- normal/reduced/special
    acceptance_standard TEXT,

    tenant_id           BIGINT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_orders_date ON purchase_orders(order_date);

-- ============================================
-- 库存管理
-- ============================================

-- 仓库表
CREATE TABLE warehouses (
    id                  BIGSERIAL PRIMARY KEY,
    warehouse_code     VARCHAR(50) UNIQUE NOT NULL,
    warehouse_name     VARCHAR(200) NOT NULL,
    warehouse_type     VARCHAR(20),                       -- central/regional/store/cold
    province           VARCHAR(50),
    city               VARCHAR(50),
    district           VARCHAR(50),
    address            VARCHAR(500),

    -- 面积和容量
    total_area         DECIMAL(10,2),                      -- 总面积（平方米）
    usable_area        DECIMAL(10,2),                      -- 可用面积
    storage_capacity   DECIMAL(15,0),                     -- 存储容量（吨/件）
    current_stock      DECIMAL(15,0) DEFAULT 0,           -- 当前库存量

    -- 温控要求
    temperature_control BOOLEAN DEFAULT false,             -- 是否温控
    min_temp            DECIMAL(5,1),                      -- 最低温度
    max_temp            DECIMAL(5,1),                      -- 最高温度
    humidity_control    BOOLEAN DEFAULT false,            -- 是否湿度控制

    -- 负责人
    manager_id         BIGINT,
    manager_name       VARCHAR(100),
    manager_phone      VARCHAR(50),

    -- 状态
    status             VARCHAR(20) DEFAULT 'active',     -- active/maintenance/closed

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库位表
-- 仓库内的具体存放位置
CREATE TABLE storage_locations (
    id                  BIGSERIAL PRIMARY KEY,
    warehouse_id        BIGINT NOT NULL,
    location_code       VARCHAR(50) NOT NULL,             -- 库位编码，如 "A-01-02"（A区01架02位）
    location_type       VARCHAR(20),                       -- location/shelf/bin
    zone                VARCHAR(20),                       -- 区域：A/B/C区
    aisle               VARCHAR(10),                      -- 通道
    rack                VARCHAR(10),                      -- 货架
    level               VARCHAR(10),                      -- 层级

    -- 尺寸限制
    max_length          DECIMAL(8,2),                      -- 最大长度（cm）
    max_width           DECIMAL(8,2),
    max_height          DECIMAL(8,2),
    max_weight          DECIMAL(10,2),                    -- 最大重量（kg）

    -- 属性
    temperature_zone    VARCHAR(20),                     -- 温度区：frozen/cold/normal/warm
    is_occupied         BOOLEAN DEFAULT false,            -- 是否占用
    current_sku_id      BIGINT,                            -- 当前存放的SKU
    current_quantity    DECIMAL(10,2) DEFAULT 0,           -- 当前数量

    status              VARCHAR(20) DEFAULT 'active',

    tenant_id           BIGINT NOT NULL,

    UNIQUE(warehouse_id, location_code)
);

-- 库存主表
-- 记录每个SKU在每个仓库的当前库存
CREATE TABLE inventory (
    id                  BIGSERIAL PRIMARY KEY,
    sku_id              BIGINT NOT NULL,
    sku_code            VARCHAR(50) NOT NULL,
    sku_name            VARCHAR(200),

    warehouse_id        BIGINT NOT NULL,
    warehouse_code      VARCHAR(50),
    warehouse_name      VARCHAR(200),

    location_id         BIGINT,                            -- 库位ID
    location_code       VARCHAR(50),

    -- 库存数量
    quantity            DECIMAL(12,2) DEFAULT 0,           -- 当前库存
    available_quantity  DECIMAL(12,2) DEFAULT 0,          -- 可用量（不含锁定）
    locked_quantity     DECIMAL(12,2) DEFAULT 0,          -- 锁定数量（已分配但未出库）
    frozen_quantity     DECIMAL(12,2) DEFAULT 0,          -- 冻结数量（质量问题等）

    -- 在途数量
    in_transit_quantity DECIMAL(12,2) DEFAULT 0,          -- 在途数量（已下单未到货）

    -- 库存成本
    unit_cost           DECIMAL(12,4) DEFAULT 0,          -- 单位成本
    total_cost          DECIMAL(15,2) DEFAULT 0,           -- 库存总值

    -- 库存预警
    min_stock_level     DECIMAL(12,2) DEFAULT 0,          -- 最小库存
    max_stock_level     DECIMAL(12,2),                    -- 最大库存
    reorder_point       DECIMAL(12,2),                    -- 补货点
    reorder_quantity    DECIMAL(12,2),                    -- 补货量

    -- 批次信息
    batch_number        VARCHAR(50),                      -- 当前批次号
    production_date     DATE,                             -- 生产日期
    expiry_date         DATE,                             -- 有效期至
    shelf_life_days     INTEGER,                          -- 保质期天数

    -- 统计
    total_in_quantity  DECIMAL(12,2) DEFAULT 0,          -- 累计入库
    total_out_quantity DECIMAL(12,2) DEFAULT 0,          -- 累计出库
    last_in_date        DATE,                             -- 最后入库日期
    last_out_date       DATE,                             -- 最后出库日期

    tenant_id           BIGINT NOT NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sku_id, warehouse_id, batch_number)
);

CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_quantity ON inventory(available_quantity);

-- 库存流水表
-- 记录所有的库存变动，用于追溯和对账
CREATE TABLE inventory_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    transaction_code    VARCHAR(50) UNIQUE NOT NULL,      -- 流水号
    transaction_type    VARCHAR(30) NOT NULL,            -- 类型：purchase_in/sale_out/transfer/adjustment

    -- 单据关联
    source_type         VARCHAR(30),                      -- 来源类型：purchase_order/return_order/transfer_order/adjustment
    source_id           BIGINT,                           -- 来源单据ID
    source_code        VARCHAR(50),                      -- 来源单据号

    -- SKU信息
    sku_id              BIGINT NOT NULL,
    sku_code            VARCHAR(50),
    sku_name            VARCHAR(200),

    -- 仓库信息
    warehouse_id        BIGINT NOT NULL,
    warehouse_name      VARCHAR(200),

    -- 库位信息
    location_id         BIGINT,
    location_code       VARCHAR(50),

    -- 批次信息
    batch_number        VARCHAR(50),
    production_date     DATE,
    expiry_date         DATE,

    -- 数量变动（正数表示增加，负数表示减少）
    quantity_before     DECIMAL(12,2) DEFAULT 0,          -- 变动前数量
    quantity_change     DECIMAL(12,2) NOT NULL,           -- 变动数量
    quantity_after      DECIMAL(12,2) DEFAULT 0,          -- 变动后数量

    -- 成本变动
    unit_cost_before    DECIMAL(12,4),
    unit_cost_after     DECIMAL(12,4),

    -- 关联人
    operator_id         BIGINT,                           -- 操作人
    operator_name       VARCHAR(100),

    -- 备注
    remark              TEXT,

    -- 业务日期
    business_date       DATE NOT NULL,

    tenant_id           BIGINT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_sku ON inventory_transactions(sku_id);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON inventory_transactions(business_date);

-- ============================================
-- 物流配送
-- ============================================

-- 物流商表
CREATE TABLE logistics_providers (
    id                  BIGSERIAL PRIMARY KEY,
    provider_code       VARCHAR(50) UNIQUE NOT NULL,
    provider_name       VARCHAR(200) NOT NULL,
    provider_type       VARCHAR(30),                      -- courier/express/freight/warehouse
    contact_name        VARCHAR(100),
    contact_phone       VARCHAR(50),
    service_rating      DECIMAL(3,1) DEFAULT 0,

    -- 承运范围
    coverage_cities     TEXT[],                           -- 覆盖城市
    shipping_types      VARCHAR(20)[],                    -- shipping_types: express/standard/cold
    max_weight          DECIMAL(10,2),                    -- 最大承重
    max_length          DECIMAL(8,2),                     -- 最大长度

    -- 费用配置
    base_fee            DECIMAL(8,2),                     -- 基础费用
    weight_fee          DECIMAL(8,4),                     -- 每公斤费用
    volume_fee          DECIMAL(8,4),                     -- 每立方米费用

    status              VARCHAR(20) DEFAULT 'active',
    tenant_id           BIGINT NOT NULL
);

-- 出库单表
CREATE TABLE delivery_orders (
    id                  BIGSERIAL PRIMARY KEY,
    delivery_code       VARCHAR(50) UNIQUE NOT NULL,      -- 出库单号

    -- 订单类型
    order_type          VARCHAR(20),                      -- sale/delivery/return
    source_order_id     BIGINT,                           -- 关联的销售订单
    source_order_code   VARCHAR(50),

    -- 客户信息
    customer_id         BIGINT,
    customer_name       VARCHAR(200),
    customer_address    VARCHAR(500),
    customer_phone      VARCHAR(50),
    province            VARCHAR(50),
    city                VARCHAR(50),

    -- 仓库信息
    warehouse_id        BIGINT NOT NULL,
    warehouse_name      VARCHAR(200),

    -- 出库明细
    items               JSONB NOT NULL DEFAULT '[]',

    -- 数量
    total_quantity     DECIMAL(12,2) DEFAULT 0,
    actual_quantity    DECIMAL(12,2) DEFAULT 0,

    -- 物流信息
    logistics_provider_id BIGINT,
    logistics_provider_name VARCHAR(200),
    tracking_number    VARCHAR(100),
    shipping_type      VARCHAR(20),                        -- express/standard/cold
    estimated_days     INTEGER,                           -- 预计配送天数

    -- 费用
    shipping_fee       DECIMAL(8,2) DEFAULT 0,
    delivery_fee       DECIMAL(8,2) DEFAULT 0,

    -- 状态
    status             VARCHAR(20) DEFAULT 'pending',    -- pending/picked/packed/shipped/in_transit/delivered
    shipped_at         TIMESTAMP,                         -- 发货时间
    delivered_at       TIMESTAMP,                         -- 收货时间

    -- 收货人确认
    receiver_name      VARCHAR(100),
    receiver_phone     VARCHAR(50),
    signed_image       VARCHAR(500),                      -- 签收图片

    tenant_id          BIGINT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_status ON delivery_orders(status);
CREATE INDEX idx_delivery_tracking ON delivery_orders(tracking_number);
```

## 三、采购管理核心功能

### 3.1 采购需求与订单流程

```typescript
// ============================================
// 采购管理服务
// ============================================

// src/purchase/purchase.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PurchaseRequisition } from './entities/purchase-requisition.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { InventoryService } from '../inventory/inventory.service';

/**
 * 采购申请单创建DTO
 */
interface CreateRequisitionDto {
  title: string;
  applicantId: number;
  departmentId: number;
  projectCode?: string;
  expectedDate: Date;
  urgencyLevel: 'normal' | 'urgent' | 'hot_urgent';
  items: {
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    purpose?: string;
  }[];
  remark?: string;
}

/**
 * 采购订单创建DTO
 */
interface CreatePurchaseOrderDto {
  supplierId: number;
  orderType: 'standard' | 'rush' | 'contract';
  title: string;
  orderDate: Date;
  expectedStartDate: Date;
  expectedEndDate: Date;
  items: {
    lineNo: number;
    productId: number;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    deliveryDate: Date;
  }[];
  paymentTerms: string;
  deliveryAddress: string;
  deliveryContact: string;
  deliveryPhone: string;
}

/**
 * 采购服务
 *
 * 采购管理的核心流程：
 * 1. 需求申请 -> 各部门提交采购需求
 * 2. 需求审批 -> 按金额等规则自动或人工审批
 * 3. 供应商选择 -> 根据供应商绩效、价格选择供应商
 * 4. 生成采购订单 -> 与供应商确认后生成正式订单
 * 5. 跟踪执行 -> 跟踪订单执行、发货、到货情况
 * 6. 验收入库 -> 到货后进行验收，合格则入库
 */
@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseRequisition)
    private requisitionRepository: Repository<PurchaseRequisition>,

    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,

    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,

    private inventoryService: InventoryService,
  ) {}

  /**
   * 创建采购申请
   */
  async createRequisition(dto: CreateRequisitionDto): Promise<PurchaseRequisition> {
    // 1. 生成申请单号
    const code = await this.generateRequisitionCode();

    // 2. 计算总金额
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedPrice,
      0
    );

    // 3. 创建申请单
    const requisition = this.requisitionRepository.create({
      requisitionCode: code,
      title: dto.title,
      applicantId: dto.applicantId,
      departmentId: dto.departmentId,
      projectCode: dto.projectCode,
      expectedDate: dto.expectedDate,
      urgencyLevel: dto.urgencyLevel,
      items: dto.items,
      totalAmount,
      approvalStatus: 'draft',
    });

    return this.requisitionRepository.save(requisition);
  }

  /**
   * 提交采购申请（触发审批流程）
   */
  async submitRequisition(requisitionId: number): Promise<PurchaseRequisition> {
    const requisition = await this.requisitionRepository.findOne({
      where: { id: requisitionId }
    });

    if (!requisition) {
      throw new NotFoundException('采购申请不存在');
    }

    if (requisition.approvalStatus !== 'draft') {
      throw new Error('只有草稿状态的申请才能提交');
    }

    // 根据金额判断审批流程
    // 小金额（如<1万）可以自动批准，大金额需要多级审批
    const approvalFlow = this.determineApprovalFlow(requisition.totalAmount);

    requisition.approvalStatus = 'pending';
    requisition.approvalFlowId = approvalFlow.flowId;
    requisition.currentApprover = approvalFlow.firstApprover;

    return this.requisitionRepository.save(requisition);
  }

  /**
   * 根据金额确定审批流程
   */
  private determineApprovalFlow(amount: number): {
    flowId: number;
    firstApprover: number;
    approvalLevels: number;
  } {
    if (amount < 10000) {
      // 1万以下：部门主管直接审批
      return { flowId: 1, firstApprover: 101, approvalLevels: 1 };
    } else if (amount < 50000) {
      // 1-5万：部门主管 + 采购经理
      return { flowId: 2, firstApprover: 101, approvalLevels: 2 };
    } else {
      // 5万以上：部门主管 + 采购经理 + 财务总监
      return { flowId: 3, firstApprover: 101, approvalLevels: 3 };
    }
  }

  /**
   * 从采购申请生成采购订单
   */
  async createOrderFromRequisition(
    requisitionId: number,
    supplierId: number,
    dto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrder> {
    // 1. 获取采购申请
    const requisition = await this.requisitionRepository.findOne({
      where: { id: requisitionId }
    });

    if (!requisition) {
      throw new NotFoundException('采购申请不存在');
    }

    // 2. 获取供应商信息
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId }
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    // 3. 生成订单号
    const orderCode = await this.generateOrderCode();

    // 4. 构建订单明细
    const items = dto.items.map(item => ({
      lineNo: item.lineNo,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      deliveryDate: item.deliveryDate,
      deliveredQuantity: 0,
      receivedQuantity: 0,
      status: 'pending',
    }));

    // 5. 计算金额
    const subtotalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotalAmount * 0.13;  // 13%增值税
    const totalAmount = subtotalAmount + taxAmount;

    // 6. 创建订单
    const order = this.orderRepository.create({
      orderCode,
      supplierId,
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      supplierContact: supplier.contactName,
      supplierPhone: supplier.contactPhone,
      orderType: dto.orderType,
      title: dto.title || requisition.title,
      orderDate: dto.orderDate,
      expectedStartDate: dto.expectedStartDate,
      expectedEndDate: dto.expectedEndDate,
      items,
      subtotalAmount,
      taxAmount,
      totalAmount,
      paymentTerms: dto.paymentTerms,
      deliveryAddress: dto.deliveryAddress,
      deliveryContact: dto.deliveryContact,
      deliveryPhone: dto.deliveryPhone,
      status: 'issued',
    });

    const savedOrder = await this.orderRepository.save(order);

    // 7. 更新采购申请的关联订单
    requisition.purchaseOrderId = savedOrder.id;
    requisition.approvalStatus = 'approved';
    await this.requisitionRepository.save(requisition);

    return savedOrder;
  }

  /**
   * 获取采购订单详情
   */
  async getOrderDetail(orderId: number): Promise<PurchaseOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('采购订单不存在');
    }

    // 计算已发货和已入库数量
    order.items = order.items.map(item => ({
      ...item,
      deliveredQuantity: item.deliveredQuantity || 0,
      receivedQuantity: item.receivedQuantity || 0,
      pendingQuantity: item.quantity - item.receivedQuantity,
      deliveryProgress: item.quantity > 0
        ? Math.round((item.receivedQuantity / item.quantity) * 100)
        : 0,
    }));

    // 计算整体交付进度
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

    return {
      ...order,
      deliveryProgress: totalQuantity > 0
        ? Math.round((totalReceived / totalQuantity) * 100)
        : 0,
      totalQuantity,
      totalReceived,
    } as any;
  }

  /**
   * 生成申请单号
   */
  private async generateRequisitionCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `PR${year}${month}${day}`;

    // 查询今天最大的序号
    const lastOrder = await this.requisitionRepository
      .createQueryBuilder('r')
      .where('r.requisition_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('r.requisition_code', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.requisitionCode.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 生成订单号
   */
  private async generateOrderCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `PO${year}${month}${day}`;

    const lastOrder = await this.orderRepository
      .createQueryBuilder('o')
      .where('o.order_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('o.order_code', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderCode.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
```

### 3.2 智能补货推荐

```typescript
/**
 * 智能补货推荐服务
 *
 * 根据库存情况、销售趋势自动生成补货建议
 */

/**
 * 补货建议
 */
interface ReplenishmentSuggestion {
  skuId: number;
  skuCode: string;
  skuName: string;

  // 当前库存情况
  currentStock: number;
  availableStock: number;

  // 销售情况
  avgDailySales: number;          // 日均销量
  salesTrend: 'up' | 'stable' | 'down';  // 销售趋势
  daysOfSupply: number;          // 库存可销售天数

  // 补货建议
  suggestedQuantity: number;      -- 建议补货数量
  reorderPoint: number;           // 补货点
  maxStockLevel: number;          // 最大库存
  suggestedSupplierId: number;   // 推荐供应商
  estimatedCost: number;         -- 预计成本

  // 紧急程度
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  urgencyReason: string;
}

/**
 * 库存状态
 */
interface StockStatus {
  skuId: number;
  skuCode: string;
  skuName: string;

  warehouseId: number;
  warehouseName: string;

  // 库存数量
  quantity: number;
  availableQuantity: number;
  lockedQuantity: number;
  frozenQuantity: number;
  inTransitQuantity: number;

  // 预警线
  reorderPoint: number;
  minStockLevel: number;
  maxStockLevel: number;

  // 状态
  status: 'normal' | 'low_stock' | 'out_of_stock' | 'overstock';
}

/**
 * 补货计算策略
 */
class ReplenishmentCalculator {
  /**
   * 计算补货建议
   *
   * 核心算法：
   * 1. 分析过去30天的销售数据，计算日均销量
   * 2. 分析销售趋势（增长/稳定/下降）
   * 3. 根据安全库存原则，计算建议补货量
   * 4. 考虑在途订单、采购周期等因素
   */
  async calculateReplenishment(
    skuId: number,
    warehouseId: number,
    salesData: { date: Date; quantity: number }[],
    leadTimeDays: number = 7,    // 采购提前期（天）
    serviceLevel: number = 0.95   // 服务水平（保证不缺货的概率）
  ): Promise<ReplenishmentSuggestion> {
    // 1. 计算日均销量
    const avgDailySales = this.calculateAverageDailySales(salesData);

    // 2. 分析销售趋势
    const salesTrend = this.analyzeSalesTrend(salesData);

    // 3. 获取当前库存
    const currentStock = await this.getCurrentStock(skuId, warehouseId);
    const availableStock = currentStock - currentStock.lockedQuantity;

    // 4. 计算库存可销售天数
    const daysOfSupply = avgDailySales > 0
      ? availableStock / avgDailySales
      : Infinity;

    // 5. 获取安全库存
    const safetyStock = this.calculateSafetyStock(
      avgDailySales,
      salesData,
      serviceLevel,
      leadTimeDays
    );

    // 6. 获取采购提前期内的销量预测
    const leadTimeDemand = avgDailySales * leadTimeDays;

    // 7. 计算补货点（ reorder point ）
    // 补货点 = 采购提前期内的销量 + 安全库存
    const reorderPoint = leadTimeDemand + safetyStock;

    // 8. 计算最大库存
    // 考虑销售周期（假设30天）
    const targetStockDays = 30;
    const maxStockLevel = avgDailySales * targetStockDays + safetyStock;

    // 9. 计算建议补货量
    // 建议补货量 = 最大库存 - 当前库存 - 在途订单
    let suggestedQuantity = maxStockLevel - availableStock - currentStock.inTransitQuantity;

    // 如果是下降趋势，适当减少补货量
    if (salesTrend === 'down') {
      suggestedQuantity *= 0.8;  // 减少20%
    } else if (salesTrend === 'up') {
      suggestedQuantity *= 1.2;  // 增加20%
    }

    suggestedQuantity = Math.max(0, Math.ceil(suggestedQuantity));

    // 10. 确定紧急程度
    const urgencyLevel = this.determineUrgencyLevel(
      availableStock,
      reorderPoint,
      daysOfSupply,
      leadTimeDays
    );

    // 11. 获取推荐供应商
    const suggestedSupplier = await this.getBestSupplier(skuId);

    // 12. 计算预计成本
    const estimatedCost = suggestedQuantity * (await this.getSkuPrice(skuId, suggestedSupplier.id));

    return {
      skuId,
      skuCode: await this.getSkuCode(skuId),
      skuName: await this.getSkuName(skuId),
      currentStock: currentStock.quantity,
      availableStock,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      salesTrend,
      daysOfSupply: Math.round(daysOfSupply * 10) / 10,
      suggestedQuantity,
      reorderPoint: Math.ceil(reorderPoint),
      maxStockLevel: Math.ceil(maxStockLevel),
      suggestedSupplierId: suggestedSupplier.id,
      estimatedCost,
      urgencyLevel,
      urgencyReason: this.generateUrgencyReason(urgencyLevel, daysOfSupply, leadTimeDays),
    };
  }

  /**
   * 计算日均销量
   */
  private calculateAverageDailySales(salesData: { date: Date; quantity: number }[]): number {
    if (salesData.length === 0) return 0;

    const totalSales = salesData.reduce((sum, d) => sum + d.quantity, 0);

    // 计算日期范围
    const dates = salesData.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const days = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return totalSales / days;
  }

  /**
   * 分析销售趋势
   *
   * 使用简单线性回归计算趋势斜率
   */
  private analyzeSalesTrend(
    salesData: { date: Date; quantity: number }[]
  ): 'up' | 'stable' | 'down' {
    if (salesData.length < 7) return 'stable';

    // 按日期排序
    const sortedData = [...salesData].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 简化处理：比较前7天和后7天的平均值
    const halfLength = Math.floor(sortedData.length / 2);
    const firstHalfAvg = sortedData.slice(0, halfLength).reduce((sum, d) => sum + d.quantity, 0) / halfLength;
    const secondHalfAvg = sortedData.slice(halfLength).reduce((sum, d) => sum + d.quantity, 0) / (sortedData.length - halfLength);

    const changeRate = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    if (changeRate > 0.15) return 'up';
    if (changeRate < -0.15) return 'down';
    return 'stable';
  }

  /**
   * 计算安全库存
   *
   * 使用统计学方法，考虑需求的波动性
   * 安全库存 = Z值 * 需求标准差 * sqrt(采购提前期)
   *
   * Z值是根据服务水平确定的：
   * - 95%服务水平 -> Z = 1.65
   * - 99%服务水平 -> Z = 2.33
   */
  private calculateSafetyStock(
    avgDailySales: number,
    salesData: { date: Date; quantity: number }[],
    serviceLevel: number,
    leadTimeDays: number
  ): number {
    if (salesData.length < 2) {
      // 数据不足，使用经验值：日均销量的20%
      return avgDailySales * 0.2 * Math.sqrt(leadTimeDays);
    }

    // 计算需求标准差
    const mean = avgDailySales;
    const squaredDiffs = salesData.map(d => Math.pow(d.quantity - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / salesData.length;
    const stdDev = Math.sqrt(variance);

    // 获取Z值
    const zValue = this.getZValue(serviceLevel);

    // 安全库存 = Z * 标准差 * sqrt(提前期)
    return zValue * stdDev * Math.sqrt(leadTimeDays);
  }

  /**
   * 获取Z值
   */
  private getZValue(serviceLevel: number): number {
    const zTable: Record<number, number> = {
      0.90: 1.28,
      0.95: 1.65,
      0.97: 1.88,
      0.98: 2.05,
      0.99: 2.33,
      0.995: 2.58,
    };
    return zTable[serviceLevel] || 1.65;
  }

  /**
   * 确定紧急程度
   */
  private determineUrgencyLevel(
    availableStock: number,
    reorderPoint: number,
    daysOfSupply: number,
    leadTimeDays: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (availableStock <= 0) return 'critical';
    if (daysOfSupply <= 0) return 'critical';
    if (daysOfSupply <= leadTimeDays * 0.5) return 'critical';  // 库存撑不到采购提前期的一半
    if (daysOfSupply <= leadTimeDays) return 'high';
    if (daysOfSupply <= leadTimeDays * 1.5) return 'medium';
    return 'low';
  }

  /**
   * 生成紧急程度原因
   */
  private generateUrgencyReason(
    urgencyLevel: string,
    daysOfSupply: number,
    leadTimeDays: number
  ): string {
    switch (urgencyLevel) {
      case 'critical':
        return `库存不足${daysOfSupply.toFixed(1)}天供应，低于采购提前期${leadTimeDays}天的50%，急需补货`;
      case 'high':
        return `库存仅够${daysOfSupply.toFixed(1)}天供应，即将低于采购提前期${leadTimeDays}天`;
      case 'medium':
        return `库存可支撑${daysOfSupply.toFixed(1)}天，低于安全库存线`;
      default:
        return `当前库存充足，可支撑${daysOfSupply.toFixed(1)}天`;
    }
  }

  /**
   * 获取最优供应商
   *
   * 综合考虑：价格、配送速度、评分
   */
  private async getBestSupplier(skuId: number): Promise<{ id: number; name: string }> {
    // 简化实现，实际需要查询供应商表
    return { id: 1, name: '最优供应商' };
  }

  /**
   * 获取SKU价格
   */
  private async getSkuPrice(skuId: number, supplierId: number): Promise<number> {
    return 100;  // 简化实现
  }

  /**
   * 获取SKU编码
   */
  private async getSkuCode(skuId: number): Promise<string> {
    return `SKU${skuId}`;
  }

  /**
   * 获取SKU名称
   */
  private async getSkuName(skuId: number): Promise<string> {
    return `商品${skuId}`;
  }

  /**
   * 获取当前库存
   */
  private async getCurrentStock(
    skuId: number,
    warehouseId: number
  ): Promise<any> {
    // 简化实现，实际需要查询库存表
    return {
      quantity: 100,
      lockedQuantity: 10,
      frozenQuantity: 0,
      inTransitQuantity: 50,
    };
  }
}
```

## 四、库存管理核心功能

### 4.1 库存查询与预警

```typescript
/**
 * 库存查询与预警服务
 */

// src/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, In } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryAlert } from './entities/inventory-alert.entity';

/**
 * 库存预警类型
 */
type AlertType = 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired';

/**
 * 库存预警
 */
interface StockAlert {
  id: number;
  alertType: AlertType;
  skuId: number;
  skuCode: string;
  skuName: string;
  warehouseId: number;
  warehouseName: string;

  // 当前库存
  currentQuantity: number;
  availableQuantity: number;

  // 阈值
  threshold: number;

  // 预警信息
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  message: string;

  // 时间
  createdAt: Date;
}

/**
 * 库存预警服务
 */
@Injectable()
export class InventoryAlertService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(InventoryAlert)
    private alertRepository: Repository<InventoryAlert>,
  ) {}

  /**
   * 检查库存并生成预警
   *
   * 这个方法应该被定时任务调用，每天执行一次
   * 检查所有SKU的库存情况，生成预警记录
   */
  async checkAndGenerateAlerts(warehouseId?: number): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    // 构建查询条件
    const whereCondition: any = {};
    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    // 查询所有库存记录
    const inventories = await this.inventoryRepository.find({
      where: whereCondition,
    });

    for (const inventory of inventories) {
      // 1. 检查是否缺货
      if (inventory.availableQuantity <= 0) {
        alerts.push(await this.createAlert(
          inventory,
          'out_of_stock',
          'critical',
          `SKU ${inventory.skuCode} 已无库存`
        ));
      }
      // 2. 检查是否低库存
      else if (inventory.availableQuantity <= inventory.reorderPoint) {
        const severity = inventory.availableQuantity <= inventory.minStockLevel
          ? 'error'
          : 'warning';
        alerts.push(await this.createAlert(
          inventory,
          'low_stock',
          severity,
          `SKU ${inventory.skuCode} 库存不足，当前${inventory.availableQuantity}，低于补货点${inventory.reorderPoint}`
        ));
      }
      // 3. 检查是否超库存
      if (inventory.maxStockLevel && inventory.quantity > inventory.maxStockLevel) {
        alerts.push(await this.createAlert(
          inventory,
          'overstock',
          'warning',
          `SKU ${inventory.skuCode} 库存超出上限，当前${inventory.quantity}，上限${inventory.maxStockLevel}`
        ));
      }
      // 4. 检查是否即将过期
      if (inventory.expiryDate) {
        const daysToExpire = this.daysUntil(inventory.expiryDate);
        if (daysToExpire <= 0) {
          alerts.push(await this.createAlert(
            inventory,
            'expired',
            'critical',
            `SKU ${inventory.skuCode} 已过期`
          ));
        } else if (daysToExpire <= 30) {
          alerts.push(await this.createAlert(
            inventory,
            'expiring',
            'warning',
            `SKU ${inventory.skuCode} 即将过期，剩余${daysToExpire}天`
          ));
        }
      }
    }

    // 保存预警记录
    if (alerts.length > 0) {
      await this.alertRepository.save(alerts);
    }

    return alerts;
  }

  /**
   * 获取预警列表
   */
  async getAlerts(filters: {
    warehouseId?: number;
    alertType?: AlertType;
    alertLevel?: string;
    status?: 'active' | 'resolved';
    page?: number;
    pageSize?: number;
  }): Promise<{ list: StockAlert[]; total: number }> {
    const { page = 1, pageSize = 20 } = filters;

    const queryBuilder = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.status = :status', { status: filters.status || 'active' });

    if (filters.warehouseId) {
      queryBuilder.andWhere('alert.warehouseId = :warehouseId', {
        warehouseId: filters.warehouseId
      });
    }

    if (filters.alertType) {
      queryBuilder.andWhere('alert.alertType = :alertType', {
        alertType: filters.alertType
      });
    }

    if (filters.alertLevel) {
      queryBuilder.andWhere('alert.alertLevel = :alertLevel', {
        alertLevel: filters.alertLevel
      });
    }

    const [list, total] = await queryBuilder
      .orderBy('alert.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  /**
   * 解决预警
   */
  async resolveAlert(alertId: number, resolvedBy: number, remark?: string): Promise<void> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('预警不存在');
    }

    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    alert.resolveRemark = remark;

    await this.alertRepository.save(alert);
  }

  /**
   * 创建预警记录
   */
  private async createAlert(
    inventory: Inventory,
    alertType: AlertType,
    alertLevel: 'info' | 'warning' | 'error' | 'critical',
    message: string
  ): Promise<InventoryAlert> {
    return this.alertRepository.create({
      alertType,
      alertLevel,
      skuId: inventory.skuId,
      skuCode: inventory.skuCode,
      skuName: inventory.skuName,
      warehouseId: inventory.warehouseId,
      warehouseName: inventory.warehouseName,
      currentQuantity: inventory.quantity,
      availableQuantity: inventory.availableQuantity,
      threshold: inventory.reorderPoint || 0,
      message,
      status: 'active',
    });
  }

  /**
   * 计算距离指定日期还有多少天
   */
  private daysUntil(date: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}

/**
 * 库存查询服务
 */
@Injectable()
export class InventoryQueryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
  ) {}

  /**
   * 批量查询SKU库存
   */
  async queryBatchSkuInventory(
    skuIds: number[],
    warehouseId?: number
  ): Promise<Map<number, any>> {
    const whereCondition: any = { skuId: In(skuIds) };
    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    const inventories = await this.inventoryRepository.find({
      where: whereCondition,
    });

    // 转换为Map便于快速查找
    const result = new Map<number, any>();
    for (const inv of inventories) {
      result.set(inv.skuId, inv);
    }

    return result;
  }

  /**
   * 获取库存台账（库存流水明细）
   */
  async getInventoryLedger(
    skuId: number,
    warehouseId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    beginningBalance: number;  // 期初余额
    transactions: InventoryTransaction[];
    endingBalance: number;      // 期末余额
  }> {
    // 1. 获取期初余额（startDate之前的最有一笔记录）
    const beginningRecord = await this.transactionRepository.findOne({
      where: {
        skuId,
        warehouseId,
        businessDate: LessThanOrEqual(startDate),
      },
      order: { businessDate: 'DESC', createdAt: 'DESC' },
    });

    const beginningBalance = beginningRecord?.quantityAfter || 0;

    // 2. 查询日期范围内的所有流水
    const transactions = await this.transactionRepository.find({
      where: {
        skuId,
        warehouseId,
        businessDate: Between(startDate, endDate),
      },
      order: { businessDate: 'ASC', createdAt: 'ASC' },
    });

    // 3. 计算期末余额
    const endingBalance = transactions.length > 0
      ? transactions[transactions.length - 1].quantityAfter
      : beginningBalance;

    return {
      beginningBalance,
      transactions,
      endingBalance,
    };
  }

  /**
   * 库存周转分析
   */
  async analyzeInventoryTurnover(
    warehouseId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    skuId: number;
    skuCode: string;
    skuName: string;
    beginningStock: number;
    endingStock: number;
    totalIn: number;
    totalOut: number;
    avgStock: number;
    turnoverDays: number;
    turnoverRate: number;
  }[]> {
    // 查询期间的入库和出库统计
    const stats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.sku_id', 'skuId')
      .addSelect('t.sku_code', 'skuCode')
      .addSelect('t.sku_name', 'skuName')
      .addSelect('SUM(CASE WHEN t.quantity_change > 0 THEN t.quantity_change ELSE 0 END)', 'totalIn')
      .addSelect('SUM(CASE WHEN t.quantity_change < 0 THEN ABS(t.quantity_change) ELSE 0 END)', 'totalOut')
      .where('t.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('t.business_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('t.sku_id')
      .addGroupBy('t.sku_code')
      .addGroupBy('t.sku_name')
      .getRawMany();

    // 计算平均库存和周转率
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const results = [];
    for (const stat of stats) {
      // 获取期初和期末库存
      const [beginningRecord, endingRecord] = await Promise.all([
        this.getInventoryAtDate(stat.skuId, warehouseId, startDate),
        this.getInventoryAtDate(stat.skuId, warehouseId, endDate),
      ]);

      const beginningStock = beginningRecord?.quantityAfter || 0;
      const endingStock = endingRecord?.quantityAfter || 0;
      const avgStock = (beginningStock + endingStock) / 2;

      // 周转率 = 销售成本 / 平均库存
      // 这里用出库数量代替销售成本
      const turnoverRate = avgStock > 0 ? stat.totalOut / avgStock : 0;

      // 周转天数 = 期间天数 / 周转率
      const turnoverDays = turnoverRate > 0 ? days / turnoverRate : days;

      results.push({
        skuId: stat.skuId,
        skuCode: stat.skuCode,
        skuName: stat.skuName,
        beginningStock,
        endingStock,
        totalIn: stat.totalIn,
        totalOut: stat.totalOut,
        avgStock: Math.round(avgStock * 100) / 100,
        turnoverDays: Math.round(turnoverDays * 10) / 10,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
      });
    }

    return results;
  }

  /**
   * 获取指定日期的库存
   */
  private async getInventoryAtDate(
    skuId: number,
    warehouseId: number,
    date: Date
  ): Promise<InventoryTransaction | null> {
    return this.transactionRepository.findOne({
      where: {
        skuId,
        warehouseId,
        businessDate: LessThanOrEqual(date),
      },
      order: { businessDate: 'DESC', createdAt: 'DESC' },
    });
  }
}
```

### 4.2 入库验收流程

```typescript
/**
 * 入库验收服务
 */

/**
 * 入库验收请求
 */
interface InspectionRequest {
  purchaseOrderId: number;
  deliveryNoteNumber?: string;    // 供应商发货单号

  // 验收明细
  items: {
    lineNo: number;               -- 订单行号
    expectedQuantity: number;    -- 订单数量
    deliveredQuantity: number;   -- 本次到货数量
    qualifiedQuantity: number;    -- 合格数量
    rejectedQuantity: number;     -- 不合格数量
    rejectReason?: string;        -- 不合格原因
    batchNumber?: string;         -- 批次号
    productionDate?: Date;        -- 生产日期
    expiryDate?: Date;            -- 有效期
  }[];

  // 验收人
  inspectorId: number;
  inspectionDate: Date;

  // 备注
  remark?: string;
}

/**
 * 验收结果
 */
interface InspectionResult {
  success: boolean;
  receiptId?: number;
  qualifiedItems: number;
  rejectedItems: number;
  totalValue: number;
  rejections: {
    lineNo: number;
    reason: string;
    quantity: number;
  }[];
  messages: string[];
}

/**
 * 入库验收服务
 */
@Injectable()
export class InboundService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,

    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,

    @InjectRepository(QualityInspection)
    private inspectionRepository: Repository<QualityInspection>,
  ) {}

  /**
   * 执行入库验收
   *
   * 验收流程：
   * 1. 验证采购订单是否存在
   * 2. 检查到货数量与订单是否匹配
   * 3. 对每个SKU进行质量检验
   * 4. 合格品入库，更新库存
   * 5. 不合格品进入退货处理流程
   * 6. 生成入库单和库存流水
   */
  async performInspection(request: InspectionRequest): Promise<InspectionResult> {
    const result: InspectionResult = {
      success: true,
      qualifiedItems: 0,
      rejectedItems: 0,
      totalValue: 0,
      rejections: [],
      messages: [],
    };

    // 1. 获取采购订单
    const order = await this.orderRepository.findOne({
      where: { id: request.purchaseOrderId }
    });

    if (!order) {
      throw new Error('采购订单不存在');
    }

    // 2. 创建验收单
    const inspection = this.inspectionRepository.create({
      purchaseOrderId: request.purchaseOrderId,
      orderCode: order.orderCode,
      deliveryNoteNumber: request.deliveryNoteNumber,
      inspectorId: request.inspectorId,
      inspectionDate: request.inspectionDate,
      items: request.items,
      status: 'completed',
    });

    // 3. 处理每个验收项
    for (const item of request.items) {
      // 查找对应的订单行
      const orderItem = order.items.find(i => i.lineNo === item.lineNo);

      if (!orderItem) {
        result.messages.push(`行号${item.lineNo}：订单中未找到对应明细`);
        continue;
      }

      // 计算已入库数量
      const totalReceived = orderItem.receivedQuantity + item.qualifiedQuantity;

      // 4. 如果有不合格品
      if (item.rejectedQuantity > 0) {
        result.rejectedItems++;
        result.rejections.push({
          lineNo: item.lineNo,
          reason: item.rejectReason || '未知',
          quantity: item.rejectedQuantity,
        });

        // 创建不合格品处理记录
        await this.handleRejectedItems({
          purchaseOrderId: request.purchaseOrderId,
          lineNo: item.lineNo,
          skuId: orderItem.productId,
          skuName: orderItem.productName,
          quantity: item.rejectedQuantity,
          reason: item.rejectReason,
          inspectorId: request.inspectorId,
        });
      }

      // 5. 合格品入库
      if (item.qualifiedQuantity > 0) {
        result.qualifiedItems++;

        // 入库到库存
        await this.receiveToInventory({
          skuId: orderItem.productId,
          skuName: orderItem.productName,
          sku: orderItem.sku,
          warehouseId: order.warehouseId || 1,
          locationId: null,
          quantity: item.qualifiedQuantity,
          unitCost: orderItem.unitPrice,
          batchNumber: item.batchNumber,
          productionDate: item.productionDate,
          expiryDate: item.expiryDate,
          sourceType: 'purchase_order',
          sourceId: request.purchaseOrderId,
          sourceCode: order.orderCode,
          operatorId: request.inspectorId,
        });

        // 更新订单行的已入库数量
        orderItem.receivedQuantity = totalReceived;

        // 计算入库金额
        result.totalValue += item.qualifiedQuantity * orderItem.unitPrice;
      }
    }

    // 6. 保存订单更新
    // 检查是否全部入库完成
    const allReceived = order.items.every(item => {
      const orderItem = request.items.find(i => i.lineNo === item.lineNo);
      return orderItem && item.quantity <= orderItem.receivedQuantity;
    });

    if (allReceived) {
      order.status = 'completed';
      order.completionDate = new Date();
    } else if (order.items.some(item => {
      const received = request.items.find(i => i.lineNo === item.lineNo)?.qualifiedQuantity || 0;
      return received > 0 && received < item.quantity;
    })) {
      order.status = 'partial';
    }

    await this.orderRepository.save(order);

    // 7. 保存验收单
    await this.inspectionRepository.save(inspection);

    result.messages.push(
      `验收完成：合格${result.qualifiedItems}项，不合格${result.rejectedItems}项`
    );

    return result;
  }

  /**
   * 货物入库到库存
   */
  private async receiveToInventory(params: {
    skuId: number;
    skuName: string;
    sku: string;
    warehouseId: number;
    locationId?: number;
    quantity: number;
    unitCost: number;
    batchNumber?: string;
    productionDate?: Date;
    expiryDate?: Date;
    sourceType: string;
    sourceId: number;
    sourceCode: string;
    operatorId: number;
  }): Promise<void> {
    const {
      skuId, sku, skuName, warehouseId, locationId, quantity,
      unitCost, batchNumber, productionDate, expiryDate,
      sourceType, sourceId, sourceCode, operatorId
    } = params;

    // 1. 查找或创建库存记录
    let inventory = await this.inventoryRepository.findOne({
      where: {
        skuId,
        warehouseId,
        batchNumber: batchNumber || '',
      }
    });

    const quantityBefore = inventory?.quantity || 0;

    if (inventory) {
      // 更新现有库存
      inventory.quantity += quantity;
      inventory.availableQuantity += quantity;
      inventory.totalInQuantity += quantity;
      inventory.totalCost = inventory.quantity * unitCost;
      inventory.lastInDate = new Date();

      if (batchNumber) {
        inventory.batchNumber = batchNumber;
        inventory.productionDate = productionDate;
        inventory.expiryDate = expiryDate;
      }
    } else {
      // 创建新库存记录
      inventory = this.inventoryRepository.create({
        skuId,
        skuCode: sku,
        skuName,
        warehouseId,
        warehouseName: await this.getWarehouseName(warehouseId),
        locationId,
        locationCode: locationId ? await this.getLocationCode(locationId) : null,
        quantity,
        availableQuantity: quantity,
        lockedQuantity: 0,
        frozenQuantity: 0,
        inTransitQuantity: 0,
        unitCost,
        totalCost: quantity * unitCost,
        batchNumber,
        productionDate,
        expiryDate,
        totalInQuantity: quantity,
        lastInDate: new Date(),
      });
    }

    await this.inventoryRepository.save(inventory);

    // 2. 创建库存流水
    const transaction = this.transactionRepository.create({
      transactionCode: await this.generateTransactionCode(),
      transactionType: 'purchase_in',
      sourceType,
      sourceId,
      sourceCode,
      skuId,
      skuCode: sku,
      skuName,
      warehouseId,
      warehouseName: inventory.warehouseName,
      locationId,
      locationCode: inventory.locationCode,
      batchNumber,
      productionDate,
      expiryDate,
      quantityBefore,
      quantityChange: quantity,
      quantityAfter: quantityBefore + quantity,
      unitCostBefore: inventory.unitCost,
      unitCostAfter: unitCost,
      operatorId,
      operatorName: await this.getUserName(operatorId),
      businessDate: new Date(),
    });

    await this.transactionRepository.save(transaction);
  }

  /**
   * 处理不合格品
   */
  private async handleRejectedItems(params: {
    purchaseOrderId: number;
    lineNo: number;
    skuId: number;
    skuName: string;
    quantity: number;
    reason?: string;
    inspectorId: number;
  }): Promise<void> {
    // 实际实现应该：
    // 1. 创建不合格品记录
    // 2. 触发退货流程
    // 3. 或者降价接受处理
    // 4. 发送通知给采购和质量部门

    console.log('不合格品处理：', params);
  }
}
```

## 五、物流配送管理

### 5.1 智能物流调度

```typescript
/**
 * 智能物流调度服务
 *
 * 根据订单、仓库、承运商等条件，智能分配配送任务
 */

/**
 * 配送任务分配请求
 */
interface DeliveryAllocationRequest {
  orders: {
    orderId: number;
    orderCode: string;
    customerId: number;
    customerName: string;
    province: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    weight: number;
    volume: number;
    quantity: number;
    priority: 'normal' | 'urgent';
  }[];

  warehouseId: number;

  // 配送约束
  constraints: {
    maxWeightPerVehicle: number;    // 每车最大载重
    maxVolumePerVehicle: number;    // 每车最大体积
    maxOrdersPerVehicle: number;    // 每车最大订单数
    deliveryTimeWindows?: {         // 配送时间窗口要求
      province: string;
      city: string;
      startHour: number;
      endHour: number;
    }[];
  };
}

/**
 * 配送方案
 */
interface DeliveryPlan {
  planId: string;
  totalOrders: number;
  totalWeight: number;
  totalVolume: number;
  vehicleCount: number;
  totalDistance: number;
  estimatedCost: number;
  routes: DeliveryRoute[];
}

/**
 * 配送路线
 */
interface DeliveryRoute {
  vehicleId: string;
  driverName: string;
  driverPhone: string;
  stops: DeliveryStop[];

  // 统计
  totalOrders: number;
  totalWeight: number;
  totalVolume: number;
  distance: number;
  estimatedTime: number;          // 预计时长（分钟）
  estimatedCost: number;

  // 配送顺序优化
  optimizedSequence: number[];     // 优化后的停靠顺序
}

/**
 * 配送停靠点
 */
interface DeliveryStop {
  stopIndex: number;              // 停靠顺序
  orderId: number;
  orderCode: string;

  // 地址信息
  province: string;
  city: string;
  district: string;
  address: string;
  contactName: string;
  contactPhone: string;

  // 配送信息
  weight: number;
  volume: number;
  quantity: number;

  // 时间窗口
  timeWindowStart?: number;
  timeWindowEnd?: number;

  // 预计到达时间
  estimatedArrival?: Date;
  estimatedDeparture?: Date;

  // 实际时间
  actualArrival?: Date;
  actualDelivery?: Date;
  signedBy?: string;
}

/**
 * 物流调度算法
 */
class LogisticsSchedulingAlgorithm {
  /**
   * 智能分配配送任务
   *
   * 算法步骤：
   * 1. 按地区对订单进行分组
   * 2. 对每个地区的订单应用车辆路径规划（VRP算法）
   * 3. 考虑载重、体积、时间窗口等约束
   * 4. 使用最近邻算法或2-opt优化进行路径规划
   */
  async allocateDeliveries(
    request: DeliveryAllocationRequest
  ): Promise<DeliveryPlan> {
    const { orders, warehouseId, constraints } = request;

    // 1. 获取仓库位置
    const warehouse = await this.getWarehouseLocation(warehouseId);

    // 2. 按城市对订单进行分组
    const orderGroups = this.groupOrdersByCity(orders);

    // 3. 为每个组规划路线
    const routes: DeliveryRoute[] = [];
    let totalWeight = 0;
    let totalVolume = 0;

    for (const [city, cityOrders] of Object.entries(orderGroups)) {
      // 获取该城市的可用承运商
      const carriers = await this.getAvailableCarriers(city);

      // 将订单分配给车辆
      const vehicleAllocations = this.binPackingWithConstraints(
        cityOrders,
        constraints,
        carriers
      );

      // 对每辆车的订单进行路径优化
      for (const allocation of vehicleAllocations) {
        // 计算最优配送顺序
        const optimizedSequence = this.optimizeDeliverySequence(
          allocation.orders,
          warehouse
        );

        // 生成停靠点
        const stops = optimizedSequence.map((orderIndex, idx) => {
          const order = allocation.orders[orderIndex];
          return {
            stopIndex: idx + 1,
            orderId: order.orderId,
            orderCode: order.orderCode,
            province: order.province,
            city: order.city,
            district: order.district,
            address: order.address,
            contactName: order.customerName,
            contactPhone: order.phone,
            weight: order.weight,
            volume: order.volume,
            quantity: order.quantity,
            timeWindowStart: this.getTimeWindow(order.province, order.city)?.startHour,
            timeWindowEnd: this.getTimeWindow(order.province, order.city)?.endHour,
          };
        });

        // 计算路线统计
        const routeDistance = this.calculateRouteDistance(
          warehouse,
          stops.map(s => ({ lat: 0, lng: 0 }))  // 简化，实际需要坐标
        );

        routes.push({
          vehicleId: allocation.vehicleId,
          driverName: allocation.driverName,
          driverPhone: allocation.driverPhone,
          stops,
          totalOrders: allocation.orders.length,
          totalWeight: allocation.orders.reduce((sum, o) => sum + o.weight, 0),
          totalVolume: allocation.orders.reduce((sum, o) => sum + o.volume, 0),
          distance: routeDistance,
          estimatedTime: this.estimateDeliveryTime(stops, routeDistance),
          estimatedCost: this.calculateRouteCost(routeDistance, allocation.orders),
          optimizedSequence,
        });

        totalWeight += totalWeight;
        totalVolume += totalVolume;
      }
    }

    // 4. 生成配送方案
    const plan: DeliveryPlan = {
      planId: await this.generatePlanId(),
      totalOrders: orders.length,
      totalWeight,
      totalVolume,
      vehicleCount: routes.length,
      totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
      estimatedCost: routes.reduce((sum, r) => sum + r.estimatedCost, 0),
      routes,
    };

    return plan;
  }

  /**
   * 订单分组（按城市）
   */
  private groupOrdersByCity(
    orders: DeliveryAllocationRequest['orders']
  ): Record<string, typeof orders> {
    const groups: Record<string, typeof orders> = {};

    for (const order of orders) {
      const key = `${order.province}-${order.city}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    }

    return groups;
  }

  /**
   * 装箱算法（考虑载重和体积约束）
   *
   * 使用改良的 First Fit Decreasing 算法
   */
  private binPackingWithConstraints(
    orders: DeliveryAllocationRequest['orders'],
    constraints: DeliveryAllocationRequest['constraints'],
    carriers: any[]
  ): { vehicleId: string; driverName: string; driverPhone: string; orders: typeof orders }[] {
    const allocations: any[] = [];

    // 按重量降序排序
    const sortedOrders = [...orders].sort((a, b) => b.weight - a.weight);

    // 当前车辆
    let currentVehicle = this.createVehicle(constraints, carriers[0]);

    for (const order of sortedOrders) {
      // 检查能否加入当前车辆
      const canFit =
        currentVehicle.currentWeight + order.weight <= constraints.maxWeightPerVehicle &&
        currentVehicle.currentVolume + order.volume <= constraints.maxVolumePerVehicle &&
        currentVehicle.orderCount < constraints.maxOrdersPerVehicle;

      if (canFit) {
        // 加入当前车辆
        currentVehicle.orders.push(order);
        currentVehicle.currentWeight += order.weight;
        currentVehicle.currentVolume += order.volume;
        currentVehicle.orderCount++;
      } else {
        // 保存当前车辆，开始新车辆
        allocations.push(this.finalizeVehicle(currentVehicle));

        // 选择下一辆车（选择载重/体积最接近的）
        currentVehicle = this.selectNextVehicle(
          order,
          constraints,
          carriers,
          allocations.length
        );
        currentVehicle.orders.push(order);
        currentVehicle.currentWeight = order.weight;
        currentVehicle.currentVolume = order.volume;
        currentVehicle.orderCount = 1;
      }
    }

    // 保存最后一辆车
    if (currentVehicle.orders.length > 0) {
      allocations.push(this.finalizeVehicle(currentVehicle));
    }

    return allocations;
  }

  /**
   * 创建新车辆
   */
  private createVehicle(constraints: any, carrier: any): any {
    return {
      vehicleId: `V${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      driverName: carrier?.defaultDriver || '待分配司机',
      driverPhone: carrier?.driverPhone || '',
      carrierId: carrier?.id,
      currentWeight: 0,
      currentVolume: 0,
      orderCount: 0,
      orders: [],
    };
  }

  /**
   * 选择下一辆车
   */
  private selectNextVehicle(
    order: any,
    constraints: any,
    carriers: any[],
    vehicleIndex: number
  ): any {
    // 简化：直接创建新车辆
    const carrier = carriers[vehicleIndex % carriers.length];
    return this.createVehicle(constraints, carrier);
  }

  /**
   * 完成车辆分配
   */
  private finalizeVehicle(vehicle: any): any {
    return {
      vehicleId: vehicle.vehicleId,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      orders: vehicle.orders,
    };
  }

  /**
   * 配送路径优化（最近邻算法 + 2-opt）
   *
   * 最近邻算法：
   * 1. 从仓库开始
   * 2. 选择最近的未访问客户
   * 3. 重复直到访问完所有客户
   *
   * 2-opt优化：
   * 对路径进行两两交换，看是否能减少总距离
   */
  private optimizeDeliverySequence(
    orders: DeliveryAllocationRequest['orders'],
    warehouse: { lat: number; lng: number }
  ): number[] {
    if (orders.length <= 2) {
      return orders.map((_, idx) => idx);
    }

    // 获取订单坐标
    const orderCoords = orders.map(o => ({
      lat: this.parseCoordinate(o.district, 'lat'),
      lng: this.parseCoordinate(o.district, 'lng'),
    }));

    // 最近邻算法初始路径
    const sequence = this.nearestNeighbor heuristic(orderCoords, warehouse);

    // 2-opt优化
    const optimizedSequence = this.twoOptOptimize(sequence, orderCoords);

    return optimizedSequence;
  }

  /**
   * 最近邻算法
   */
  private nearestNeighbor(
    coords: { lat: number; lng: number }[],
    start: { lat: number; lng: number }
  ): number[] {
    const sequence: number[] = [];
    const visited = new Set<number>();

    let current = start;

    while (sequence.length < coords.length) {
      let nearestIdx = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < coords.length; i++) {
        if (visited.has(i)) continue;

        const dist = this.calculateDistance(current, coords[i]);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx >= 0) {
        sequence.push(nearestIdx);
        visited.add(nearestIdx);
        current = coords[nearestIdx];
      }
    }

    return sequence;
  }

  /**
   * 2-opt优化
   */
  private twoOptOptimize(
    sequence: number[],
    coords: { lat: number; lng: number }[]
  ): number[] {
    let improved = true;
    let bestSequence = [...sequence];
    let bestDistance = this.calculateTotalDistance(bestSequence, coords);

    while (improved) {
      improved = false;

      for (let i = 0; i < bestSequence.length - 1; i++) {
        for (let j = i + 2; j < bestSequence.length; j++) {
          // 反转 i+1 到 j 之间的顺序
          const newSequence = this.twoOptSwap(bestSequence, i + 1, j);
          const newDistance = this.calculateTotalDistance(newSequence, coords);

          if (newDistance < bestDistance) {
            bestSequence = newSequence;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return bestSequence;
  }

  /**
   * 2-opt交换
   */
  private twoOptSwap(sequence: number[], i: number, j: number): number[] {
    const newSequence = [
      ...sequence.slice(0, i),
      ...sequence.slice(i, j + 1).reverse(),
      ...sequence.slice(j + 1),
    ];
    return newSequence;
  }

  /**
   * 计算两点间距离（简化的直线距离）
   */
  private calculateDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    // 简化的平面距离，实际应该用Haversine公式计算球面距离
    const latDiff = Math.abs(p2.lat - p1.lat);
    const lngDiff = Math.abs(p2.lng - p1.lng);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  /**
   * 计算路径总距离
   */
  private calculateTotalDistance(
    sequence: number[],
    coords: { lat: number; lng: number }[]
  ): number {
    let total = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      total += this.calculateDistance(coords[sequence[i]], coords[sequence[i + 1]]);
    }
    return total;
  }

  /**
   * 估算配送时间
   */
  private estimateDeliveryTime(stops: DeliveryStop[], distance: number): number {
    // 假设平均速度30km/h
    const drivingTime = (distance / 30) * 60;  // 分钟

    // 每个停靠点平均30分钟（卸货、签收）
    const serviceTime = stops.length * 30;

    return Math.round(drivingTime + serviceTime);
  }

  /**
   * 计算路线成本
   */
  private calculateRouteCost(distance: number, orders: any[]): number {
    // 基础费用 + 距离费用
    const baseFee = 100;           // 基础费用
    const perKmFee = 2;            // 每公里费用

    // 附加费用（按订单数量）
    const perOrderFee = 5;

    return baseFee + distance * perKmFee + orders.length * perOrderFee;
  }

  /**
   * 解析坐标（简化实现）
   */
  private parseCoordinate(location: string, type: 'lat' | 'lng'): number {
    // 简化：返回随机坐标
    return Math.random() * 10;
  }

  /**
   * 获取时间窗口（简化实现）
   */
  private getTimeWindow(province: string, city: string): { startHour: number; endHour: number } | null {
    // 简化：返回工作时间窗口
    return { startHour: 9, endHour: 18 };
  }

  /**
   * 生成方案ID
   */
  private async generatePlanId(): Promise<string> {
    const date = new Date();
    return `DP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * 获取仓库位置
   */
  private async getWarehouseLocation(warehouseId: number): Promise<{ lat: number; lng: number }> {
    // 简化实现
    return { lat: 31.2304, lng: 121.4737 };  // 上海
  }

  /**
   * 获取可用承运商
   */
  private async getAvailableCarriers(city: string): Promise<any[]> {
    // 简化实现
    return [{ id: 1, name: '顺丰速运', defaultDriver: '张师傅', driverPhone: '13800138000' }];
  }
}
```

## 六、供应链金融

### 6.1 供应商融资

```typescript
/**
 * 供应链金融 - 供应商融资服务
 *
 * 场景说明：
 * 大型企业（如电商平台）的供应商，经常面临资金周转困难
 * 因为从供货到收款可能需要30-60天，但供应商需要钱买原材料、发工资
 *
 * 解决方案：
 * 1. 应收账款融资：供应商用对大企业的应收账款做抵押，获得贷款
 * 2. 订单融资：供应商拿到采购订单后，用订单做抵押获得启动资金
 * 3. 动态折扣：供应商可以选择提前收款，但要给采购方一定的折扣
 */

/**
 * 融资申请
 */
interface FinancingApplication {
  supplierId: number;
  financingType: 'accounts_receivable' | 'order' | 'dynamic_discount';

  // 融资金额
  applyAmount: number;

  // 应收账款信息（保理场景）
  receivableDocuments?: {
    orderCode: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
  }[];

  // 采购订单信息（订单融资场景）
  purchaseOrders?: {
    orderCode: string;
    amount: number;
    deliveryDate: Date;
  }[];

  // 融资期限
  financingPeriod: number;  // 天数

  // 利率选择
  rateType: 'fixed' | 'floating';
  preferredRate?: number;
}

/**
 * 融资报价
 */
interface FinancingQuote {
  quoteId: string;
  financingAmount: number;
  interestRate: number;      // 年化利率
  financingDays: number;
  interestAmount: number;    // 利息
  serviceFee: number;        // 服务费
  totalCost: number;         // 总成本
  discountRate?: number;     // 折扣率（动态贴现场景）
  earlyPaymentAmount?: number; // 提前还款金额（动态贴现场景）

  // 还款方式
  repaymentType: 'bullet' | 'installment';
  repaymentSchedule?: {
    date: Date;
    amount: number;
  }[];

  // 有效期
  validUntil: Date;
}

/**
 * 供应链金融平台服务
 */
@Injectable()
export class SupplyChainFinanceService {
  /**
   * 申请融资
   */
  async applyForFinancing(
    application: FinancingApplication
  ): Promise<FinancingQuote> {
    // 1. 验证供应商资质
    const supplier = await this.validateSupplier(application.supplierId);

    // 2. 根据融资类型计算报价
    let quote: FinancingQuote;

    switch (application.financingType) {
      case 'accounts_receivable':
        quote = await this.calculateReceivableFinancing(application, supplier);
        break;
      case 'order':
        quote = await this.calculateOrderFinancing(application, supplier);
        break;
      case 'dynamic_discount':
        quote = await this.calculateDynamicDiscount(application, supplier);
        break;
      default:
        throw new Error('不支持的融资类型');
    }

    // 3. 创建融资申请记录
    await this.saveFinancingApplication(application, quote);

    return quote;
  }

  /**
   * 应收账款融资报价计算
   *
   * 原理：
   * 供应商有对大企业的应收账款（如100万，60天后到期）
   * 银行或金融机构可以用这个应收账款做抵押，给供应商放款
   *
   * 费用计算：
   * - 利息 = 本金 × 日利率 × 天数
   * - 服务费 = 本金 × 服务费率
   */
  private async calculateReceivableFinancing(
    application: FinancingApplication,
    supplier: any
  ): Promise<FinancingQuote> {
    const { applyAmount, financingPeriod, receivableDocuments } = application;

    // 获取基础利率（根据供应商评级）
    const baseRate = this.getBaseRateByGrade(supplier.overallScore);

    // 风险调整
    const riskAdjustment = this.getRiskAdjustment(receivableDocuments);

    // 最终年化利率
    const finalRate = baseRate + riskAdjustment;

    // 日利率
    const dailyRate = finalRate / 365 / 100;

    // 计算利息
    const interestAmount = applyAmount * dailyRate * financingPeriod;

    // 服务费（一次性收取）
    const serviceFeeRate = 0.002;  // 0.2%
    const serviceFee = applyAmount * serviceFeeRate;

    // 总成本
    const totalCost = interestAmount + serviceFee;

    return {
      quoteId: await this.generateQuoteId(),
      financingAmount: applyAmount,
      interestRate: finalRate,
      financingDays: financingPeriod,
      interestAmount,
      serviceFee,
      totalCost,
      repaymentType: 'bullet',  // 到期一次性还本付息
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7天有效
    };
  }

  /**
   * 动态折扣报价计算
   *
   * 场景：
   * 供应商的应收账款100万，60天后到期
   * 供应商可以选择提前收款，但要给采购方一定折扣
   *
   * 例如：
   * - 折价率3%（年化）
   * - 提前30天收款
   * - 实际到账 = 100万 × (1 - 3% × 30/365) = 100万 × 0.9975 = 99.75万
   */
  private async calculateDynamicDiscount(
    application: FinancingApplication,
    supplier: any
  ): Promise<FinancingQuote> {
    const { applyAmount, receivableDocuments } = application;

    // 动态折扣基于采购方的信用评级
    const buyerGrade = await this.getBuyerGrade(receivableDocuments[0].orderCode);
    const buyerDiscountRate = this.getDiscountRateByGrade(buyerGrade);

    // 供应商提前收款天数
    const daysUntilDue = this.calculateDaysUntilDue(receivableDocuments[0].dueDate);
    const earlyPaymentDays = daysUntilDue - 30;  // 假设提前30天收款

    if (earlyPaymentDays <= 0) {
      throw new Error('票据即将到期，不适合动态贴现');
    }

    // 计算折扣
    // 折扣 = 面值 × 折扣率 × 实际融资天数 / 365
    const discountRate = buyerDiscountRate;
    const discount = applyAmount * discountRate * earlyPaymentDays / 365;

    // 实际到账金额
    const earlyPaymentAmount = applyAmount - discount;

    return {
      quoteId: await this.generateQuoteId(),
      financingAmount: applyAmount,
      interestRate: discountRate,  // 用折扣率表示融资成本
      financingDays: earlyPaymentDays,
      interestAmount: discount,     // 实际是折扣金额
      serviceFee: 0,
      totalCost: discount,
      discountRate,
      earlyPaymentAmount,
      repaymentType: 'bullet',
      validUntil: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),  // 在票据到期前有效
    };
  }

  /**
   * 订单融资报价计算
   *
   * 场景：
   * 供应商拿到了采购方的订单（100万）
   * 但供应商没有足够资金采购原材料、生产
   * 可以用订单做抵押，获得启动资金
   */
  private async calculateOrderFinancing(
    application: FinancingApplication,
    supplier: any
  ): Promise<FinancingQuote> {
    const { applyAmount, financingPeriod, purchaseOrders } = application;

    // 订单融资的利率通常比应收账款融资高，因为风险更高
    const baseRate = this.getBaseRateByGrade(supplier.overallScore) * 1.3;

    // 风险调整（订单融资风险更高）
    const riskAdjustment = 0.5;  // 加50%的风险溢价
    const finalRate = baseRate + riskAdjustment;

    // 计算利息
    const dailyRate = finalRate / 365 / 100;
    const interestAmount = applyAmount * dailyRate * financingPeriod;

    // 服务费（较高，因为需要监管）
    const serviceFeeRate = 0.005;  // 0.5%
    const serviceFee = applyAmount * serviceFeeRate;

    // 监管费（需要派人监督订单执行）
    const monitoringFeeRate = 0.001;  // 0.1%
    const monitoringFee = applyAmount * monitoringFeeRate;

    return {
      quoteId: await this.generateQuoteId(),
      financingAmount: applyAmount,
      interestRate: finalRate,
      financingDays: financingPeriod,
      interestAmount,
      serviceFee: serviceFee + monitoringFee,
      totalCost: interestAmount + serviceFee + monitoringFee,
      repaymentType: 'installment',  // 分期还款
      repaymentSchedule: this.generateRepaymentSchedule(applyAmount, financingPeriod),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * 生成还款计划
   */
  private generateRepaymentSchedule(
    principal: number,
    financingDays: number
  ): { date: Date; amount: number }[] {
    const schedule: { date: Date; amount: number }[] = [];

    // 简化：每10天还一次本金，利息随本金递减
    const periods = Math.ceil(financingDays / 10);
    const principalPerPeriod = principal / periods;

    for (let i = 1; i <= periods; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i * 10);

      schedule.push({
        date,
        amount: principalPerPeriod,  // 简化，实际应该包括本金和利息
      });
    }

    return schedule;
  }

  /**
   * 根据信用评级获取基础利率
   */
  private getBaseRateByGrade(score: number): number {
    if (score >= 90) return 5.0;    // A级：5%
    if (score >= 80) return 6.5;   // B级：6.5%
    if (score >= 70) return 8.0;   // C级：8%
    if (score >= 60) return 10.0;  // D级：10%
    return 15.0;                    // E级：15%
  }

  /**
   * 获取风险调整
   */
  private getRiskAdjustment(receivableDocuments: any[]): number {
    // 简单风险评估：基于买家的信用状况
    // 如果买家是大型知名企业，风险较低
    const hasFamousBuyer = receivableDocuments.some(
      doc => this.isFamousCompany(doc.orderCode)
    );

    return hasFamousBuyer ? 0 : 1.0;  // 非知名企业加1%风险溢价
  }

  /**
   * 生成报价ID
   */
  private async generateQuoteId(): Promise<string> {
    return `FQ${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * 验证供应商
   */
  private async validateSupplier(supplierId: number): Promise<any> {
    return {
      id: supplierId,
      overallScore: 85,
    };
  }

  /**
   * 获取买家信用评级
   */
  private async getBuyerGrade(orderCode: string): Promise<string> {
    return 'A';  // 简化
  }

  /**
   * 获取折扣率
   */
  private getDiscountRateByGrade(grade: string): number {
    const rates: Record<string, number> = {
      'A': 0.03,    // 3%
      'B': 0.05,    // 5%
      'C': 0.08,    // 8%
      'D': 0.12,    // 12%
    };
    return rates[grade] || 0.15;
  }

  /**
   * 计算距到期天数
   */
  private calculateDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    return Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 判断是否知名企业
   */
  private isFamousCompany(orderCode: string): boolean {
    // 简化实现
    return orderCode.includes('AMAZON') || orderCode.includes('JD');
  }

  /**
   * 保存融资申请
   */
  private async saveFinancingApplication(
    application: FinancingApplication,
    quote: FinancingQuote
  ): Promise<void> {
    // 简化实现
    console.log('保存融资申请', application, quote);
  }
}
```

## 七、总结

### 7.1 SCM系统核心要点回顾

1. **供应商管理**：供应商评级、绩效追踪、风险控制
2. **采购管理**：需求申请→审批→订单→验收→入库
3. **库存管理**：实时库存、批次管理、预警机制
4. **物流配送**：智能调度、路径优化、轨迹追踪
5. **供应链金融**：应收账款融资、订单融资、动态贴现

### 7.2 技术架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端技术栈                               │
│  React 19 + TypeScript + Ant Design Pro                         │
│  数据可视化：ECharts / AntV                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         业务服务层                               │
│  采购服务 / 库存服务 / 物流服务 / 金融服务                        │
│  工作流引擎 / 规则引擎                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据处理层                               │
│  智能补货算法 / 路径优化算法 / 风险评估模型                        │
│  实时计算：Flink / Spark Streaming                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据持久层                               │
│  PostgreSQL + TimescaleDB (时序数据) + Redis                     │
│  文件存储：MinIO / OSS                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 扩展方向

1. **供应商协同平台**：供应商在线报价、订单确认、对账
2. **需求预测**：基于历史销售和外部数据预测需求
3. **智能采购**：AI推荐采购时机、采购量
4. **区块链溯源**：商品全链路追溯
5. **碳足迹追踪**：供应链碳排放管理
