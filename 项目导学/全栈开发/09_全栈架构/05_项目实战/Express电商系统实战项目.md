# Express电商系统实战项目

## 项目概述

本项目是一个完整的全栈电商系统，使用Express框架构建，包含用户认证、产品管理、购物车、订单管理、支付集成等核心功能模块。

### 技术栈

- **后端框架**：Express 4.x
- **数据库**：MongoDB + Mongoose
- **认证**：JWT (JSON Web Token)
- **验证**：Joi
- **文件上传**：Multer
- **API文档**：Swagger
- **环境管理**：dotenv

---

## 项目结构

```
express-ecommerce/
├── src/
│   ├── controllers/              # 控制器层
│   │   ├── auth.controller.js   # 用户认证控制器
│   │   ├── product.controller.js # 产品控制器
│   │   ├── cart.controller.js   # 购物车控制器
│   │   ├── order.controller.js  # 订单控制器
│   │   └── upload.controller.js # 文件上传控制器
│   ├── middleware/               # 中间件
│   │   ├── auth.middleware.js   # 认证中间件
│   │   ├── validate.middleware.js # 验证中间件
│   │   └── error.middleware.js  # 错误处理中间件
│   ├── models/                   # 数据模型
│   │   ├── user.model.js        # 用户模型
│   │   ├── product.model.js     # 产品模型
│   │   ├── cart.model.js        # 购物车模型
│   │   └── order.model.js       # 订单模型
│   ├── routes/                   # 路由
│   │   ├── auth.routes.js       # 认证路由
│   │   ├── product.routes.js    # 产品路由
│   │   ├── cart.routes.js       # 购物车路由
│   │   ├── order.routes.js      # 订单路由
│   │   └── upload.routes.js     # 上传路由
│   ├── services/                 # 业务逻辑层
│   │   ├── auth.service.js      # 认证服务
│   │   ├── product.service.js   # 产品服务
│   │   ├── cart.service.js      # 购物车服务
│   │   └── order.service.js     # 订单服务
│   ├── validators/               # 验证器
│   │   ├── auth.validator.js    # 认证验证
│   │   ├── product.validator.js # 产品验证
│   │   └── order.validator.js   # 订单验证
│   ├── utils/                    # 工具函数
│   │   ├── jwt.utils.js         # JWT工具
│   │   ├── upload.utils.js      # 文件上传工具
│   │   └── paginate.utils.js    # 分页工具
│   └── app.js                    # 应用入口
├── tests/                        # 测试文件
├── uploads/                      # 上传文件目录
├── .env                          # 环境变量
├── package.json
└── README.md
```

---

## 核心功能模块

### 1. 用户认证模块

#### 用户模型 (models/user.model.js)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户Schema定义
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // 查询时默认不返回密码
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  // 令牌黑名单
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 // 1小时后自动删除
    }
  }]
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才加密
  if (!this.isModified('password')) {
    return next();
  }
  
  // 生成盐值
  const salt = await bcrypt.genSalt(10);
  // 加密密码
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 生成JWT Token
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // 保存令牌到数据库（用于黑名单机制）
  this.tokens.push({ token });
  await this.save();
  
  return token;
};

// 移除令牌
userSchema.methods.removeToken = async function(token) {
  this.tokens = this.tokens.filter(t => t.token !== token);
  await this.save();
};

// 创建用户模型
const User = mongoose.model('User', userSchema);

module.exports = User;
```

#### 认证服务 (services/auth.service.js)

```javascript
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');

/**
 * 用户注册服务
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} - 返回用户信息和token
 */
async function register(userData) {
  try {
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 创建新用户
    const user = new User(userData);
    await user.save();

    // 生成token
    const token = await user.generateAuthToken();

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      },
      token
    };
  } catch (error) {
    throw new Error(`注册失败: ${error.message}`);
  }
}

/**
 * 用户登录服务
 * @param {Object} loginData - 登录数据
 * @returns {Promise<Object>} - 返回用户信息和token
 */
async function login(loginData) {
  try {
    // 查找用户
    const user = await User.findOne({ email: loginData.email }).select('+password');
    
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(loginData.password);
    
    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }

    // 生成token
    const token = await user.generateAuthToken();

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      },
      token
    };
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
}

/**
 * 获取当前用户信息
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} - 返回用户信息
 */
async function getCurrentUser(userId) {
  try {
    const user = await User.findById(userId).select('-password -tokens');
    
    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  } catch (error) {
    throw new Error(`获取用户信息失败: ${error.message}`);
  }
}

/**
 * 更新用户信息
 * @param {String} userId - 用户ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} - 返回更新后的用户信息
 */
async function updateUserInfo(userId, updateData) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -tokens');

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  } catch (error) {
    throw new Error(`更新用户信息失败: ${error.message}`);
  }
}

/**
 * 用户登出服务
 * @param {String} userId - 用户ID
 * @param {String} token - 要移除的token
 * @returns {Promise<Object>} - 返回成功消息
 */
async function logout(userId, token) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    // 从令牌列表中移除当前token
    await user.removeToken(token);

    return { message: '登出成功' };
  } catch (error) {
    throw new Error(`登出失败: ${error.message}`);
  }
}

module.exports = {
  register,
  login,
  getcurrentUser,
  updateUserInfo,
  logout
};
```

#### 认证控制器 (controllers/auth.controller.js)

```javascript
const authService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

/**
 * 用户注册
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    // 验证请求数据
    const { error, value } = validateRegister(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 调用服务层
    const result = await authService.register(value);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 用户登录
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    // 验证请求数据
    const { error, value } = validateLogin(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 调用服务层
    const result = await authService.login(value);

    res.json({
      success: true,
      message: '登录成功',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    // 从token中获取用户ID
    const userId = req.user._id;

    // 调用服务层
    const user = await authService.getCurrentUser(userId);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 更新用户信息
 * PUT /api/auth/me
 */
async function updateUserInfo(req, res) {
  try {
    const userId = req.user._id;
    
    // 验证请求数据
    const { error, value } = validateUpdate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 调用服务层
    const user = await authService.updateUserInfo(userId, value);

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 用户登出
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const userId = req.user._id;
    const token = req.header('Authorization').replace('Bearer ', '');

    await authService.logout(userId, token);

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUserInfo,
  logout
};
```

#### 认证中间件 (middleware/auth.middleware.js)

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * 认证中间件
 * 验证JWT Token并获取当前用户
 */
async function auth(req, res, next) {
  try {
    // 从请求头获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('未提供认证令牌');
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户并检查token是否有效
    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token
    });

    if (!user) {
      throw new Error('认证失败');
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '认证失败: ' + error.message
    });
  }
}

/**
 * 管理员权限中间件
 * 检查用户是否为管理员
 */
function admin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '无管理员权限'
    });
  }
  next();
}

module.exports = {
  auth,
  admin
};
```

#### 认证验证器 (validators/auth.validator.js)

```javascript
const Joi = require('joi');

/**
 * 注册验证规则
 */
const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符',
      'string.empty': '用户名不能为空'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'string.empty': '邮箱不能为空'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': '密码至少6个字符',
      'string.empty': '密码不能为空'
    }),
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern': '手机号格式不正确'
    })
});

/**
 * 登录验证规则
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'string.empty': '邮箱不能为空'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': '密码不能为空'
    })
});

/**
 * 更新用户信息验证规则
 */
const updateSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': '邮箱格式不正确'
    }),
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern': '手机号格式不正确'
    }),
  avatar: Joi.string()
    .optional(),
  address: Joi.string()
    .optional()
});

function validateRegister(data) {
  return registerSchema.validate(data, { abortEarly: false });
}

function validateLogin(data) {
  return loginSchema.validate(data, { abortEarly: false });
}

function validateUpdate(data) {
  return updateSchema.validate(data, { abortEarly: false });
}

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdate
};
```

---

### 2. 产品管理模块

#### 产品模型 (models/product.model.js)

```javascript
const mongoose = require('mongoose');

// 产品Schema定义
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attributes: {
    type: Map,
    of: String
  },
  // SEO相关
  seo: {
    title: String,
    keywords: String,
    description: String
  },
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  // 排序权重
  weight: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 创建索引以提高查询性能
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1, weight: -1, createdAt: -1 });

// 计算折扣价
productSchema.virtual('discount').get(function() {
  if (!this.originalPrice || this.originalPrice <= this.price) {
    return 0;
  }
  return ((this.originalPrice - this.price) / this.originalPrice * 100).toFixed(0);
});

// 计算剩余库存
productSchema.virtual('remainingStock').get(function() {
  return this.stock - this.sold;
});

// 创建产品模型
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
```

#### 产品服务 (services/product.service.js)

```javascript
const Product = require('../models/product.model');

/**
 * 创建新产品
 * @param {Object} productData - 产品数据
 * @returns {Promise<Object>} - 返回创建的产品
 */
async function createProduct(productData) {
  try {
    const product = new Product(productData);
    await product.save();
    return product;
  } catch (error) {
    throw new Error(`创建产品失败: ${error.message}`);
  }
}

/**
 * 获取产品列表（支持分页、搜索、筛选、排序）
 * @param {Object} query - 查询参数
 * @returns {Promise<Object>} - 返回产品列表和分页信息
 */
async function getProductList(query) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      status = 'active'
    } = query;

    // 构建查询条件
    const filter = { status };
    
    // 搜索条件
    if (search) {
      filter.$text = { $search: search };
    }
    
    // 分类筛选
    if (category) {
      filter.category = category;
    }
    
    // 子分类筛选
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    
    // 价格范围筛选
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 计算跳过的记录数
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'), // 排除版本字段
      Product.countDocuments(filter)
    ]);

    return {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    throw new Error(`获取产品列表失败: ${error.message}`);
  }
}

/**
 * 获取单个产品详情
 * @param {String} productId - 产品ID
 * @returns {Promise<Object>} - 返回产品详情
 */
async function getProductById(productId) {
  try {
    const product = await Product.findById(productId).select('-__v');
    
    if (!product) {
      throw new Error('产品不存在');
    }

    return product;
  } catch (error) {
    throw new Error(`获取产品详情失败: ${error.message}`);
  }
}

/**
 * 更新产品信息
 * @param {String} productId - 产品ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} - 返回更新后的产品
 */
async function updateProduct(productId, updateData) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!product) {
      throw new Error('产品不存在');
    }

    return product;
  } catch (error) {
    throw new Error(`更新产品失败: ${error.message}`);
  }
}

/**
 * 删除产品
 * @param {String} productId - 产品ID
 * @returns {Promise<Object>} - 返回成功消息
 */
async function deleteProduct(productId) {
  try {
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      throw new Error('产品不存在');
    }

    return { message: '产品已删除' };
  } catch (error) {
    throw new Error(`删除产品失败: ${error.message}`);
  }
}

/**
 * 添加产品评论
 * @param {String} productId - 产品ID
 * @param {Object} reviewData - 评论数据
 * @returns {Promise<Object>} - 返回更新后的产品
 */
async function addProductReview(productId, reviewData) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('产品不存在');
    }

    // 检查用户是否已评论
    const existingReview = product.reviews.find(
      review => review.user.toString() === reviewData.userId
    );

    if (existingReview) {
      throw new Error('您已对此产品进行过评论');
    }

    // 添加评论
    product.reviews.push({
      user: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment
    });

    // 重新计算平均评分
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / product.reviews.length;

    await product.save();

    return product;
  } catch (error) {
    throw new Error(`添加评论失败: ${error.message}`);
  }
}

/**
 * 更新库存
 * @param {String} productId - 产品ID
 * @param {Number} quantity - 变动数量（正数增加，负数减少）
 * @returns {Promise<Object>} - 返回更新后的产品
 */
async function updateStock(productId, quantity) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('产品不存在');
    }

    const newStock = product.stock + quantity;
    
    if (newStock < 0) {
      throw new Error('库存不足');
    }

    product.stock = newStock;
    
    // 如果是减少库存，增加销量
    if (quantity < 0) {
      product.sold += Math.abs(quantity);
    }

    await product.save();

    return product;
  } catch (error) {
    throw new Error(`更新库存失败: ${error.message}`);
  }
}

module.exports = {
  createProduct,
  getProductList,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductReview,
  updateStock
};
```

#### 产品控制器 (controllers/product.controller.js)

```javascript
const productService = require('../services/product.service');
const { validateCreateProduct, validateUpdateProduct } = require('../validators/product.validator');

/**
 * 创建新产品
 * POST /api/products
 */
async function createProduct(req, res) {
  try {
    // 验证请求数据
    const { error, value } = validateCreateProduct(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 添加上传的图片
    if (req.files && req.files.images) {
      value.images = req.files.images.map(file => file.path);
    }

    // 调用服务层
    const product = await productService.createProduct(value);

    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 获取产品列表
 * GET /api/products
 */
async function getProductList(req, res) {
  try {
    // 调用服务层
    const result = await productService.getProductList(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 获取产品详情
 * GET /api/products/:id
 */
async function getProductById(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 更新产品信息
 * PUT /api/products/:id
 */
async function updateProduct(req, res) {
  try {
    // 验证请求数据
    const { error, value } = validateUpdateProduct(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 处理图片上传
    if (req.files && req.files.images) {
      value.images = req.files.images.map(file => file.path);
    }

    // 调用服务层
    const product = await productService.updateProduct(req.params.id, value);

    res.json({
      success: true,
      message: '产品更新成功',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 删除产品
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.id);

    res.json({
      success: true,
      message: '产品已删除'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * 添加产品评论
 * POST /api/products/:id/reviews
 */
async function addProductReview(req, res) {
  try {
    const reviewData = {
      userId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    };

    const product = await productService.addProductReview(req.params.id, reviewData);

    res.json({
      success: true,
      message: '评论添加成功',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  createProduct,
  getProductList,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductReview
};
```

---

### 3. 购物车模块

#### 购物车模型 (models/cart.model.js)

```javascript
const mongoose = require('mongoose');

// 购物车项Schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  attributes: {
    type: Map,
    of: String
  }
}, { _id: false });

// 购物车Schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 计算购物车总价
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// 计算购物车商品总数
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// 创建购物车模型
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
```

#### 购物车服务 (services/cart.service.js)

```javascript
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

/**
 * 获取用户购物车
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} - 返回购物车信息
 */
async function getCart(userId) {
  try {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price images stock'
    });

    if (!cart) {
      // 如果购物车不存在，创建一个新的
      cart = await Cart.create({ user: userId });
    }

    return cart;
  } catch (error) {
    throw new Error(`获取购物车失败: ${error.message}`);
  }
}

/**
 * 添加商品到购物车
 * @param {String} userId - 用户ID
 * @param {Object} itemData - 商品数据
 * @returns {Promise<Object>} - 返回更新后的购物车
 */
async function addToCart(userId, itemData) {
  try {
    // 查找产品
    const product = await Product.findById(itemData.productId);
    
    if (!product) {
      throw new Error('产品不存在');
    }

    if (product.stock < itemData.quantity) {
      throw new Error('库存不足');
    }

    // 查找购物车
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // 检查商品是否已存在
    const existingItem = cart.items.find(
      item => item.product.toString() === itemData.productId
    );

    if (existingItem) {
      // 如果商品已存在，更新数量
      const newQuantity = existingItem.quantity + itemData.quantity;
      
      if (product.stock < newQuantity) {
        throw new Error('库存不足');
      }

      existingItem.quantity = newQuantity;
      existingItem.price = product.price;
    } else {
      // 添加新商品
      cart.items.push({
        product: itemData.productId,
        quantity: itemData.quantity,
        price: product.price
      });
    }

    await cart.save();

    return cart;
  } catch (error) {
    throw new Error(`添加到购物车失败: ${error.message}`);
  }
}

/**
 * 更新购物车商品数量
 * @param {String} userId - 用户ID
 * @param {String} productId - 产品ID
 * @param {Number} quantity - 新数量
 * @returns {Promise<Object>} - 返回更新后的购物车
 */
async function updateCartItem(userId, productId, quantity) {
  try {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('购物车不存在');
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      throw new Error('购物车中不存在该商品');
    }

    if (quantity <= 0) {
      // 数量为0或负数，删除该商品
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      // 更新数量
      item.quantity = quantity;
    }

    await cart.save();

    return cart;
  } catch (error) {
    throw new Error(`更新购物车失败: ${error.message}`);
  }
}

/**
 * 删除购物车商品
 * @param {String} userId - 用户ID
 * @param {String} productId - 产品ID
 * @returns {Promise<Object>} - 返回更新后的购物车
 */
async function removeFromCart(userId, productId) {
  try {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('购物车不存在');
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    return cart;
  } catch (error) {
    throw new Error(`删除购物车商品失败: ${error.message}`);
  }
}

/**
 * 清空购物车
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} - 返回清空后的购物车
 */
async function clearCart(userId) {
  try {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('购物车不存在');
    }

    cart.items = [];
    await cart.save();

    return cart;
  } catch (error) {
    throw new Error(`清空购物车失败: ${error.message}`);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
```

---

### 4. 订单模块

#### 订单模型 (models/order.model.js)

```javascript
const mongoose = require('mongoose');

// 订单项Schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: String
}, { _id: false });

// 订单Schema
const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverPhone: {
    type: String,
    required: true
  },
  // 支付信息
  payment: {
    method: {
      type: String,
      enum: ['wechat', 'alipay', 'cod'], // 微信、支付宝、货到付款
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  // 物流信息
  shipping: {
    method: {
      type: String,
      enum: ['express', 'standard', 'pickup'],
      default: 'express'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNo: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  // 订单状态
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // 优惠信息
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  // 备注
  note: String
}, {
  timestamps: true
});

// 创建索引
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNo: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'shipping.status': 1 });

// 生成订单号
orderSchema.statics.generateOrderNo = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return 'ORD' + timestamp + random.toUpperCase();
};

// 创建订单模型
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
```

#### 订单服务 (services/order.service.js)

```javascript
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

/**
 * 创建订单
 * @param {String} userId - 用户ID
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} - 返回创建的订单
 */
async function createOrder(userId, orderData) {
  try {
    // 查找购物车
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price images stock'
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('购物车为空');
    }

    // 验证库存并计算总价
    const items = cart.items.map(item => {
      const product = item.product;
      
      if (product.stock < item.quantity) {
        throw new Error(`商品 "${product.name}" 库存不足`);
      }

      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0]
      };
    });

    // 计算总价
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) - (orderData.discount || 0);

    if (totalAmount < 0) {
      throw new Error('订单金额不能为负数');
    }

    // 创建订单
    const order = new Order({
      orderNo: Order.generateOrderNo(),
      user: userId,
      items,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      receiverName: orderData.receiverName,
      receiverPhone: orderData.receiverPhone,
      payment: {
        method: orderData.paymentMethod || 'cod'
      },
      discount: orderData.discount || 0,
      couponCode: orderData.couponCode,
      note: orderData.note
    });

    await order.save();

    // 减少库存
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity }
      });
    }

    // 清空购物车
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    return order;
  } catch (error) {
    throw new Error(`创建订单失败: ${error.message}`);
  }
}

/**
 * 获取用户订单列表
 * @param {String} userId - 用户ID
 * @param {Object} query - 查询参数
 * @returns {Promise<Object>} - 返回订单列表
 */
async function getUserOrders(userId, query) {
  try {
    const { page = 1, limit = 10, status } = query;

    const filter = { user: userId };
    
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('items.product', 'name'),
      Order.countDocuments(filter)
    ]);

    return {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    throw new Error(`获取订单列表失败: ${error.message}`);
  }
}

/**
 * 获取订单详情
 * @param {String} orderId - 订单ID
 * @returns {Promise<Object>} - 返回订单详情
 */
async function getOrderById(orderId) {
  try {
    const order = await Order.findById(orderId)
      .populate('user', 'username email')
      .populate('items.product', 'name price images');

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  } catch (error) {
    throw new Error(`获取订单详情失败: ${error.message}`);
  }
}

/**
 * 更新订单状态
 * @param {String} orderId - 订单ID
 * @param {String} status - 新状态
 * @returns {Promise<Object>} - 返回更新后的订单
 */
async function updateOrderStatus(orderId, status) {
  try {
    const validStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('无效的订单状态');
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  } catch (error) {
    throw new Error(`更新订单状态失败: ${error.message}`);
  }
}

/**
 * 支付回调
 * @param {String} orderId - 订单ID
 * @param {Object} paymentData - 支付数据
 * @returns {Promise<Object>} - 返回更新后的订单
 */
async function handlePayment(orderId, paymentData) {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.payment.status === 'paid') {
      throw new Error('订单已支付');
    }

    order.payment = {
      ...order.payment,
      status: 'paid',
      transactionId: paymentData.transactionId,
      paidAt: new Date()
    };

    // 如果订单状态是pending或confirmed，更新为paid
    if (['pending', 'confirmed'].includes(order.status)) {
      order.status = 'paid';
    }

    await order.save();

    return order;
  } catch (error) {
    throw new Error(`处理支付失败: ${error.message}`);
  }
}

/**
 * 取消订单
 * @param {String} orderId - 订单ID
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} - 返回更新后的订单
 */
async function cancelOrder(orderId, userId) {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.user.toString() !== userId) {
      throw new Error('无权取消该订单');
    }

    if (!['pending', 'confirmed', 'paid'].includes(order.status)) {
      throw new Error('订单状态不允许取消');
    }

    // 恢复库存
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity }
      });
    }

    order.status = 'cancelled';
    await order.save();

    return order;
  } catch (error) {
    throw new Error(`取消订单失败: ${error.message}`);
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  handlePayment,
  cancelOrder
};
```

---

### 5. 文件上传模块

#### 文件上传工具 (utils/upload.utils.js)

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储引擎
const storage = multer.diskStorage({
  // 设置上传目录
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  // 设置文件名
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（jpeg、jpg、png、gif、webp）'));
  }
};

// 配置上传限制
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * 上传单个文件
 */
function uploadSingle(fieldname) {
  return upload.single(fieldname);
}

/**
 * 上传多个文件
 */
function uploadMultiple(fieldname) {
  return upload.array(fieldname);
}

/**
 * 获取文件访问URL
 * @param {String} filename - 文件名
 * @returns {String} - 文件URL
 */
function getFileUrl(filename) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${filename}`;
}

/**
 * 删除文件
 * @param {String} filename - 文件名
 * @returns {Boolean} - 删除是否成功
 */
function deleteFile(filename) {
  try {
    const filePath = path.join(uploadDir, filename);
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile
};
```

#### 文件上传控制器 (controllers/upload.controller.js)

```javascript
const { uploadSingle, getFileUrl, deleteFile } = require('../utils/upload.utils');

/**
 * 上传单个文件
 * POST /api/upload/single
 */
async function uploadSingleFile(req, res) {
  try {
    // 使用中间件处理上传
    uploadSingle('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      // 返回文件信息
      res.json({
        success: true,
        message: '上传成功',
        data: {
          filename: req.file.filename,
          url: getFileUrl(req.file.filename),
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}

/**
 * 上传多个文件
 * POST /api/upload/multiple
 */
async function uploadMultipleFiles(req, res) {
  try {
    uploadMultiple('files')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      // 返回文件信息列表
      const files = req.files.map(file => ({
        filename: file.filename,
        url: getFileUrl(file.filename),
        mimetype: file.mimetype,
        size: file.size
      }));

      res.json({
        success: true,
        message: '上传成功',
        data: files
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}

/**
 * 删除文件
 * DELETE /api/upload/:filename
 */
async function deleteUploadedFile(req, res) {
  try {
    const { filename } = req.params;
    
    const success = deleteFile(filename);
    
    if (success) {
      res.json({
        success: true,
        message: '文件已删除'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '删除失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile
};
```

---

### 6. API文档（Swagger）

#### Swagger配置 (config/swagger.js)

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger文档配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '电商系统API',
      version: '1.0.0',
      description: '电商系统后端API文档'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // 指定包含API文档注释的文件
};

// 生成Swagger规范
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger路由
function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
```

#### API文档示例（在路由中添加注释）

```javascript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 密码
 *               phone:
 *                 type: string
 *                 description: 手机号
 *             example:
 *               username: zhangsan
 *               email: zhangsan@example.com
 *               password: password123
 *               phone: 13800138000
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: 请求错误
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: zhangsan@example.com
 *               password: password123
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 认证失败
 */
```

---

## 应用入口 (app.js)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// 加载环境变量
dotenv.config();

// 引入路由
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');

// 创建Express应用
const app = express();

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(compression()); // 压缩
app.use(morgan('dev')); // 日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // 表单解析

// 静态文件目录
app.use('/uploads', express.static('uploads'));

// Swagger文档
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '电商系统API',
      version: '1.0.0',
      description: '电商系统后端API文档'
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 连接数据库并启动服务器
async function startServer() {
  try {
    // 连接MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');

    // 启动服务器
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API文档地址: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
```

---

## 环境变量 (.env)

```env
# 服务器配置
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# 第三方服务配置
# 支付配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key

# 微信支付配置
WECHAT_APPID=your_wechat_appid
WECHAT_MCHID=your_wechat_mchid
WECHAT_API_KEY=your_wechat_api_key
```

---

## package.json

```json
{
  "name": "express-ecommerce",
  "version": "1.0.0",
  "description": "全栈电商系统 - Express版",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "seed:admin": "node src/scripts/createAdmin.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "multer": "^1.4.5-lts.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  },
  "keywords": [
    "express",
    "ecommerce",
    "fullstack",
    "mongodb"
  ],
  "author": "Fullstack Developer",
  "license": "MIT"
}
```

---

## 最佳实践

### 1. 安全最佳实践

```javascript
// ✅ 正确：使用环境变量存储敏感信息
const jwtSecret = process.env.JWT_SECRET;

// ❌ 错误：硬编码敏感信息
const jwtSecret = 'my_secret_key';
```

### 2. 错误处理最佳实践

```javascript
// ✅ 正确：统一错误处理
try {
  const result = await someAsyncOperation();
  res.json({ success: true, data: result });
} catch (error) {
  // 记录错误日志
  console.error('操作失败:', error);
  
  // 返回统一格式的错误响应
  res.status(400).json({
    success: false,
    message: error.message
  });
}
```

### 3. 数据验证最佳实践

```javascript
// ✅ 正确：使用Joi进行数据验证
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const { error, value } = schema.validate(req.body);

if (error) {
  return res.status(400).json({ message: error.details[0].message });
}
```

### 4. 数据库查询优化

```javascript
// ✅ 正确：使用索引和投影
const products = await Product.find(
  { category: 'electronics' },
  'name price images rating' // 只查询需要的字段
)
.sort({ createdAt: -1 })
.skip(skip)
.limit(limit);

// ❌ 错误：查询所有字段
const products = await Product.find({ category: 'electronics' });
```

### 5. API设计最佳实践

```javascript
// ✅ 正确：RESTful API设计
GET    /api/products          // 获取产品列表
GET    /api/products/:id      // 获取产品详情
POST   /api/products          // 创建产品
PUT    /api/products/:id      // 更新产品
DELETE /api/products/:id      // 删除产品

// ✅ 正确：使用复数名词
GET /api/users                // ✅ 正确
GET /api/user                 // ❌ 错误

// ✅ 正确：使用HTTP状态码
200 OK                        // 请求成功
201 Created                   // 创建成功
204 No Content                // 删除成功
400 Bad Request               // 请求错误
401 Unauthorized              // 未认证
403 Forbidden                 // 无权限
404 Not Found                 // 资源不存在
500 Internal Server Error     // 服务器错误
```

---

## 测试示例

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('../src/models');

describe('Authentication API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('should login with valid credentials', async () => {
    // 先注册用户
    await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // 登录
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

---

## 部署指南

### 1. 生产环境配置

```env
# .env.production
NODE_ENV=production
PORT=8080
BASE_URL=https://api.example.com

# MongoDB连接（使用连接池）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT配置
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=24h
```

### 2. Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["npm", "start"]
```

### 3. 启动脚本

```bash
# start.sh
#!/bin/bash

# 安装依赖
npm install

# 运行数据库迁移（如果有）
npm run migrate

# 启动服务器
npm start
```

---

## 总结

本项目实现了完整的电商系统核心功能：

✅ **用户认证**：注册、登录、JWT认证、密码加密  
✅ **产品管理**：CRUD、搜索、筛选、分页、评论  
✅ **购物车**：添加、更新、删除商品  
✅ **订单管理**：创建订单、支付、物流跟踪  
✅ **文件上传**：图片上传、文件管理  
✅ **API文档**：Swagger自动生成文档  
✅ **错误处理**：统一错误处理机制  
✅ **数据验证**：Joi验证器  
✅ **安全措施**：Helmet、CORS、JWT  

项目采用分层架构（Controller-Service-Model），代码结构清晰，易于维护和扩展。
