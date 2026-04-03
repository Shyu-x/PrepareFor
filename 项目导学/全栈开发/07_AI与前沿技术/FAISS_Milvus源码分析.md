# FAISS 与 Milvus 向量数据库源码架构分析

## 一、项目概览

### 1.1 FAISS 基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | faiss |
| **组织** | facebookresearch |
| **描述** | A library for efficient similarity search and clustering of dense vectors |
| **Star 数** | 39,461 |
| **主语言** | C++ (58%), Python (22%), CUDA (15%) |
| **仓库地址** | https://github.com/facebookresearch/faiss |

### 1.2 Milvus 基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | milvus |
| **组织** | milvus-io |
| **描述** | Milvus is a high-performance, cloud-native vector database built for scalable vector ANN search |
| **Star 数** | 43,454 |
| **主语言** | Go (65%), C++ (21%), Python (22%) |
| **仓库地址** | https://github.com/milvus-io/milvus |

---

## 二、FAISS 源码架构分析

### 2.1 项目结构

```
faiss/
├── faiss/                    # 核心索引实现
│   ├── IndexFlatL2.cpp/h    # 暴力搜索索引
│   ├── IndexIVFFlat.cpp/h   # 倒排索引+精确搜索
│   ├── IndexIVFPQ.cpp/h     # 倒排索引+乘积量化
│   ├── IndexHNSW.cpp/h      # HNSW 图索引
│   ├── ProductQuantizer.cpp/h # PQ 量化器
│   ├── Clustering.cpp/h     # 聚类算法
│   └── AutoTune.cpp/h       # 自动调参
├── c_api/                    # C 语言接口
├── demos/                    # 示例代码
├── tests/                    # 测试代码
├── benchs/                   # 性能测试
├── tutorial/                 # 教程
└── perf_tests/              # 性能基准测试
```

### 2.2 核心索引类型

| 索引类型 | 类名 | 特点 | 适用场景 |
|----------|------|------|----------|
| **Flat** | IndexFlatL2, IndexFlatIP | 暴力搜索，100% 准确 | 小数据集 (<1M 向量) |
| **IVF** | IndexIVFFlat, IndexIVFPQ | 倒排索引 + 量化 | 中等规模数据 |
| **HNSW** | IndexHNSWFlat | Hierarchical NSW 图索引 | 高召回率场景 |
| **PQ** | ProductQuantizer | 分段量化压缩 | 内存受限场景 |
| **LSH** | IndexLSH | Locality-Sensitive Hashing | 二进制向量 |

### 2.3 索引架构原理

#### 2.3.1 IndexFlat 暴力搜索

```cpp
// FAISS 暴力搜索实现原理
// 文件: faiss/IndexFlatL2.cpp

// 核心数据结构
class IndexFlatL2 : public Index {
    // xb 存储所有向量, shape = [nb, d]
    // search 时遍历所有向量计算 L2 距离
};

// Python 使用示例
import faiss
import numpy as np

d = 64          # 向量维度
nb = 100000    # 向量库大小
nq = 1000      # 查询数量

# 生成随机向量数据
xb = np.random.random((nb, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

# 创建暴力搜索索引
index = faiss.IndexFlatL2(d)
index.add(xb)  # 添加向量到索引

# 执行搜索
D, I = index.search(xq, k=5)  # 查找 Top-5 最近邻
```

#### 2.3.2 IndexIVF 倒排索引

```
原理:
1. 使用 quantizer (通常是 IndexFlatL2) 将向量分配到 nlist 个聚类中心
2. 每个聚类维护一个倒排列表,存储属于该聚类的向量 ID
3. 搜索时只扫描 query 所属的少数几个聚类

优点: 搜索复杂度 O(N/nlist) 而非 O(N)
缺点: 可能遗漏最近邻 (recall < 1.0)
```

```python
# IVF 索引使用示例
quantizer = faiss.IndexFlatL2(d)           # 分量化器
index = faiss.IndexIVFFlat(quantizer, d, nlists=100)
index.train(xb)                             # 训练聚类中心
index.add(xb)                              # 添加向量
index.nprobe = 10                          # 设置探针数(搜索的聚类数)
D, I = index.search(xq, k=5)
```

#### 2.3.3 ProductQuantizer 分段量化

```cpp
// PQ 将高维向量分段,每段独立量化
// 大幅降低内存占用: 原本需要 d*4 bytes, PQ 后只需 m*bs bytes
// 其中 m 是分段数, bs 是每段编码字节数

class ProductQuantizer {
    int m;           // 分段数
    int nbits;       // 每段编码位数
    int ks;          // k-means 聚类数 (2^nbits)
    // 存储: 每个分段有一个 codebook (ks * (d/m) floats)
    // 存储: 每个向量被编码为 m 字节
};
```

### 2.4 核心工作流程

```
FAISS 索引工作流:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. train() │ -> │   2. add()  │ -> │  3. search()│
│   训练索引   │    │  添加向量    │    │   执行搜索   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 三、Milvus 源码架构分析

### 3.1 项目结构

```
milvus/
├── cmd/                      # 可执行文件入口
│   └── milvus/
├── internal/                 # 核心实现
│   ├── rootcoord/           # 根协调器
│   ├── proxy/               # 代理层(API网关)
│   ├── querycoord/          # 查询协调器
│   ├── datacoord/           # 数据协调器
│   ├── datanode/            # 数据节点
│   ├── querynode/           # 查询节点
│   └── indexnode/           # 索引节点
├── pkg/                      # 公共包
│   ├── mq/                  # 消息队列
│   ├── util/                # 工具函数
│   ├── metrics/             # 指标监控
│   └── log/                 # 日志
├── configs/                  # 配置文件
├── scripts/                  # 部署脚本
├── client/                   # 客户端 SDK
└── Makefile                  # 构建脚本
```

### 3.2 核心架构设计

```
Milvus 云原生分布式架构:
┌─────────────────────────────────────────────────────────────┐
│                        Client (Python/Go)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Proxy (API Gateway)                       │
│              协议转换、负载均衡、认证鉴权                      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   RootCoord     │ │   QueryCoord    │ │   DataCoord     │
│   根协调器       │ │   查询协调器     │ │   数据协调器     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   IndexNode     │ │   QueryNode     │ │   DataNode      │
│   索引节点       │ │   查询节点       │ │   数据节点       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 3.3 核心组件职责

| 组件 | 职责 | 关键技术 |
|------|------|----------|
| **Proxy** | API 网关、协议转换 | gRPC, REST |
| **RootCoord** | 元数据管理、Collection/Partition | etcd |
| **DataCoord** | 段管理、数据写入调度 | 消息队列 |
| **QueryCoord** | 查询路由、负载均衡 | 调度算法 |
| **DataNode** | 数据写入、压缩合并 | Faiss, RocksDB |
| **QueryNode** | 向量搜索执行 | Faiss, HNSW |
| **IndexNode** | 索引构建 | Faiss, NMSLIB |

### 3.4 数据模型

```python
# Milvus 数据模型
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")

# 创建 Collection (类似 MySQL 表)
client.create_collection(
    collection_name="my_collection",
    dimension=128,
    metric_type="IP"           # 内积相似度
)

# 插入向量数据
client.insert(
    collection_name="my_collection",
    data=[
        {"id": 1, "vector": [0.1]*128, "text": "hello"},
        {"id": 2, "vector": [0.2]*128, "text": "world"}
    ]
)

# 搜索
results = client.search(
    collection_name="my_collection",
    data=[[0.1]*128],
    limit=10
)
```

### 3.5 分布式能力

| 特性 | 实现方式 |
|------|----------|
| **水平扩展** | DataNode/QueryNode 无状态扩缩容 |
| **数据分片** | Collection 划分为 Segment |
| **负载均衡** | QueryCoord 动态调度 |
| **容错恢复** | DataCoord 监控心跳 |
| **多租户** | Database + Collection 隔离 |

---

## 四、FAISS 与 Milvus 对比

### 4.1 核心差异

| 维度 | FAISS | Milvus |
|------|-------|--------|
| **定位** | 轻量级向量索引库 | 企业级向量数据库 |
| **部署** | 嵌入式 (进程内) | 分布式集群 |
| **语言** | C++/Python | Go (后端) + 多语言 SDK |
| **扩展性** | 单机内存受限 | PB 级分布式 |
| **生态** | 纯向量检索 | + 元数据过滤 + 时序 |
| **维护** | Facebook 学术项目 | Zilliz 商业公司 |

### 4.2 选型建议

```
场景选择:
┌────────────────────────────────────────────────────────────┐
│ 小规模 (<1000万向量) + 低延迟 + 单机部署                      │
│   -> FAISS (IndexFlat/IVF)                                 │
├────────────────────────────────────────────────────────────┤
│ 大规模 (>1000万向量) + 分布式 + 高可用 + 元数据过滤           │
│   -> Milvus                                                │
├────────────────────────────────────────────────────────────┤
│ 超大规模 + 云原生 + 自动扩缩容                               │
│   -> Milvus Cloud / Zilliz Cloud                           │
└────────────────────────────────────────────────────────────┘
```

### 4.3 技术融合

Milvus 底层实际使用 FAISS 作为向量索引引擎之一:

```cpp
// Milvus 内部索引类型
enum IndexType {
    INDEX_FLAT,           // 对应 FAISS IndexFlat
    INDEX_IVF_FLAT,       // 对应 FAISS IndexIVFFlat
    INDEX_IVF_PQ,         // 对应 FAISS IndexIVFPQ
    INDEX_HNSW,           // 对应 FAISS IndexHNSW
    INDEX_DISKANN,        // 磁盘索引
};
```

---

## 五、关键代码示例

### 5.1 FAISS Python API

```python
import faiss
import numpy as np

# ==================== 1. 基础配置 ====================
d = 128          # 向量维度
nb = 100000      # 数据库向量数
nq = 1000        # 查询向量数

# 生成测试数据
np.random.seed(42)
xb = np.random.random((nb, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

# ==================== 2. 构建索引 ====================
# 暴力搜索索引 (精确)
index_flat = faiss.IndexFlatL2(d)
index_flat.add(xb)

# IVF 倒排索引 (加速)
quantizer = faiss.IndexFlatL2(d)
index_ivf = faiss.IndexIVFFlat(quantizer, d, nlist=100)
index_ivf.train(xb)     # 训练聚类中心
index_ivf.add(xb)      # 添加向量
index_ivf.nprobe = 10   # 探针数

# ==================== 3. 执行搜索 ====================
k = 5  # 返回 Top-5 最近邻

# 精确搜索
D_flat, I_flat = index_flat.search(xq, k)

# IVF 搜索 (可能略快,但有精度损失)
D_ivf, I_ivf = index_ivf.search(xq, k)

# ==================== 4. 批量搜索 ====================
batch_size = 100
for i in range(0, nq, batch_size):
    end = min(i + batch_size, nq)
    D, I = index_flat.search(xq[i:end], k)
```

### 5.2 Milvus Python SDK

```python
from pymilvus import MilvusClient, DataType

# ==================== 1. 连接 Milvus ====================
client = MilvusClient(uri="http://localhost:19530")

# ==================== 2. 创建 Collection ====================
schema = MilvusClient.create_schema(
    auto_id=True,
    enable_dynamic_field=True,
)

schema.add_field("id", DataType.INT64, is_primary=True)
schema.add_field("vector", DataType.FLOAT_VECTOR, dim=128)
schema.add_field("category", DataType.VARCHAR, max_length=256)

client.create_collection(
    collection_name="documents",
    schema=schema,
    index_params=[
        {"field_name": "vector", "index_type": "IVF_FLAT", "metric_type": "IP", "params": {"nlist": 128}},
    ]
)

# ==================== 3. 插入数据 ====================
data = [
    {"vector": [0.1] * 128, "category": "tech", "content": "Python教程"},
    {"vector": [0.2] * 128, "category": "tech", "content": "Go教程"},
]

client.insert("documents", data)

# ==================== 4. 搜索 ====================
results = client.search(
    collection_name="documents",
    data=[[0.1] * 128],
    limit=10,
    filter="category == 'tech'",
    output_fields=["id", "category", "content"]
)

# ==================== 5. 混合搜索 (向量+标量) ====================
results = client.search(
    collection_name="documents",
    data=[[0.1] * 128],
    limit=10,
    filter="category in ['tech', 'science']",
)
```

---

## 六、索引算法对比

### 6.1 ANN 算法分类

| 算法类别 | 代表算法 | 召回率 | QPS | 内存占用 |
|----------|----------|--------|-----|----------|
| **暴力搜索** | Flat | 100% | 低 | 高 |
| **空间分割** | IVF, IVFPQ | 95-99% | 中 | 中 |
| **图索引** | HNSW | 95-99% | 高 | 高 |
| **树索引** | Annoy | 90-95% | 中 | 低 |
| **哈希索引** | LSH | 85-95% | 高 | 中 |

### 6.2 索引参数调优

```python
# IVF 参数调优
# nlist: 聚类数,通常设为 4*sqrt(n)
nlist = 4 * int(np.sqrt(nb))

# nprobe: 查询探针数,越多越准确但越慢
index_ivf.nprobe = max(1, int(np.sqrt(nlist)))

# PQ 参数调优
# m: 分段数, d/m 必须是 4 的倍数
# nbits: 每段编码位数
m = 16
nbits = 8
index_pq = faiss.IndexIVFPQ(quantizer, d, nlist, m, nbits)
```

---

## 七、总结

### 7.1 FAISS 适用场景

- 实验室/研究项目快速验证
- 单机小规模向量检索 (<1000万)
- 作为嵌入式索引库集成到其他系统
- 对延迟要求极高的场景

### 7.2 Milvus 适用场景

- 企业级大规模向量检索 (PB 级)
- 需要高可用、水平扩展的生产环境
- 需要元数据过滤、实时更新
- 多租户、权限管理需求
- 云原生部署 (Kubernetes)

### 7.3 学习路径建议

```
向量数据库学习路径:
1. FAISS 入门 -> 理解向量索引原理
   - IndexFlat 暴力搜索
   - IndexIVF 倒排索引
   - ProductQuantizer 量化压缩

2. Milvus 进阶 -> 理解分布式向量数据库
   - 架构设计 (Proxy, Coord, Node)
   - 数据分片与负载均衡
   - 元数据管理

3. 深入优化 -> 掌握高级技术
   - HNSW 图索引原理
   - 混合搜索实现
   - 性能调优实践
```
