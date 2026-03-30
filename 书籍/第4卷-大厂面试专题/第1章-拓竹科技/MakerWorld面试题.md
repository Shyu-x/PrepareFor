# 第4卷-大厂面试专题

## 第1章 拓竹科技

---

## 一、拓竹科技业务介绍

### 1.1 公司背景

#### 公司简介

拓竹科技（Bambu Lab）是一家专注于消费级3D打印机的中国科技公司，成立于2017年，总部位于深圳。公司以"让3D打印进入千家万户"为使命，致力于开发易于使用、高性能的消费级3D打印机产品。

拓竹科技的创始团队来自大疆创新（DJI），拥有丰富的硬件和软件研发经验。公司产品凭借其卓越的打印质量、智能化功能和亲民的价格，迅速在全球3D打印市场占据领先地位。

#### 发展历程

- **2017年**：拓竹科技成立，开始3D打印机的研发
- **2019年**：推出第一代消费级3D打印机 X1
- **2021年**：发布 X1 Carbon，开启高端消费级市场
- **2022年**：推出 P1P/P1S 系列，拓展产品线
- **2023年**：全球出货量突破百万台，成为行业领导者
- **2024年**：推出 A1 系列，进一步降低3D打印门槛
- **持续创新**：不断推出新功能固件更新，完善生态系统

#### 公司文化与价值观

- **创新**：持续投入研发，推动3D打印技术普及
- **用户体验**：注重产品的易用性和用户体验
- **开源精神**：支持开源社区，与开发者共建生态
- **全球化**：产品远销全球100+国家和地区

### 1.2 产品介绍

#### 主要产品线

##### X1 系列（高端旗舰）

- **X1 Carbon**：旗舰级产品，支持高速打印、多材料打印
  - 打印尺寸：256 x 256 x 256 mm
  - 打印速度：最高 500mm/s
  - 支持材料：PLA、ABS、PETG、TPU、PA 等
  - 特色功能：自动调平、AI监控、激光雷达检测

- **X1**：高性能消费级
  - 打印尺寸：256 x 256 x 256 mm
  - 打印速度：最高 200mm/s
  - 核心功能：自动调平、摄像头监控

##### P1 系列（专业级）

- **P1S**：专业级3D打印机
  - 打印尺寸：256 x 256 x 256 mm
  - 封闭腔体设计，适合高温材料
  - 支持自动换料（AMS Lite）

- **P1P**：入门专业级
  - 简化版 P1S，性价比更高

##### A1 系列（入门级）

- **A1**：全新入门级产品
  - 打印尺寸：180 x 180 x 180 mm
  - 简化设计，易于使用
  - 极具性价比的价格

##### AMS 系列（自动换料系统）

- **AMS**：多材料自动换料系统
  - 支持16种材料自动切换
  - 智能材料管理
  - 湿度控制

- **AMS Lite**：轻量级自动换料
  - 适配 A1 系列
  - 4个材料槽位

#### 软件生态系统

##### Bambu Studio

官方3D打印切片软件，基于 Cura 开发：
- 强大的切片引擎
- 丰富的打印参数设置
- 云端同步功能
- 社区模型库集成

##### Bambu Handy

移动端应用：
- 打印机远程监控
- 打印进度查看
- 远程控制功能

##### Bambu Cloud

云端服务平台：
- 远程打印控制
- 团队协作功能
- 固件更新推送

### 1.3 技术栈

#### 前端技术栈

##### 框架与库

```javascript
// 核心框架
React 18.x          // UI 框架
Vue 3.x             // 备用 UI 框架
Next.js 14.x        // SSR 框架

// 状态管理
Zustand             // 轻量级状态管理
Redux Toolkit       // 传统状态管理
React Query         // 服务端状态管理

// 样式方案
Tailwind CSS        // 原子化 CSS
Styled Components   // CSS-in-JS
SCSS                // CSS 预处理器

// 构建工具
Vite                // 现代构建工具
Webpack 5           // 传统构建工具
Turbopack           // 实验性构建工具
```

##### 3D 与图形技术

```javascript
// 3D 渲染引擎
Three.js            // WebGL 主流库
React Three Fiber   // Three.js 的 React 封装
Babylon.js          // 微软3D引擎
PlayCanvas          // 游戏引擎

// WebGL 底层
WebGL 2.0           // WebGL 标准
WebGPU               // 下一代图形API
regl                 // 函数式 WebGL 库

// 3D 模型格式
GLTF/GLB            // 主流3D格式
OBJ                 // 传统3D格式
STL                 // 3D打印专用格式
3MF                 // 3D制造格式

// 几何处理
Open3D              // 3D算法库
CGAL                // 计算几何算法库
```

##### 实时通信

```javascript
// WebSocket 框架
Socket.io           // 实时通信库
ws                  // Node.js WebSocket
uWebSockets.js      // 高性能 WebSocket

// 通信协议
WebSocket           // 实时双向通信
WebRTC              // 点对点通信
MQTT                // IoT 消息协议

// 后端通信
GraphQL             // API 查询语言
REST API            // 传统 API
gRPC                // 高性能 RPC
```

##### 工程化与工具

```javascript
// 开发工具
TypeScript 5.x      // 类型安全
ESLint + Prettier  // 代码规范
Husky + Lint-Staged // Git Hooks

// 测试
Jest                // 单元测试
Playwright          // E2E 测试
Cypress             // E2E 测试
Vitest              // 快速单元测试

// 部署
Docker              // 容器化
Vercel              // 前端部署
Kubernetes          // 容器编排
```

#### 后端技术栈（了解）

```javascript
// 服务端
Node.js             // JavaScript 运行时
NestJS              // Node.js 框架
Go                  // 高性能服务
Python              // AI/ML 处理

// 数据库
PostgreSQL          // 关系型数据库
MongoDB             // 文档数据库
Redis               // 缓存数据库
InfluxDB            // 时序数据库

// 基础设施
AWS                 // 云服务
Cloudflare          // CDN/安全
```

---

## 二、前端技术重点

### 2.1 3D 打印可视化

#### 3D 可视化核心概念

3D打印可视化是拓竹科技前端开发的核心技术之一，涉及以下几个关键领域：

1. **模型可视化**：将3D模型渲染到Web端，支持旋转、缩放、平移等交互
2. **切片可视化**：将3D模型转换为打印路径，展示每层的打印轨迹
3. **打印模拟**：模拟打印过程，展示每一层的打印效果
4. **实时监控**：通过摄像头实时查看打印状态

#### 3D 可视化技术架构

```javascript
// 3D 可视化技术架构图
const architecture = {
  dataLayer: {
    modelParser: '解析 STL/OBJ/GLTF 模型文件',
    slicer: '切片算法处理',
    gcodeParser: 'G-code 指令解析'
  },
  renderLayer: {
    threejs: 'Three.js 渲染引擎',
    postProcessing: '后处理效果',
    raycaster: '射线检测交互'
  },
  uiLayer: {
    controls: '控制面板',
    toolbar: '工具栏',
    viewport: '视口管理'
  },
  performance: {
    lod: '多层次细节',
    instancing: '实例化渲染',
    worker: 'Web Worker 优化'
  }
};
```

#### 模型加载与处理

```javascript
// 模型加载完整示例
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ModelViewer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.materials = new Map();

    this.init();
  }

  init() {
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 100);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.container.appendChild(this.renderer.domElement);

    // 添加控制器
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.0;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;

    // 添加光源
    this.setupLights();

    // 添加辅助网格
    this.setupGrid();

    // 开始渲染循环
    this.animate();

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(50, 50, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    this.scene.add(mainLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 0, -50);
    this.scene.add(fillLight);

    // 顶部光
    const topLight = new THREE.DirectionalLight(0xffffff, 0.2);
    topLight.position.set(0, 100, 0);
    this.scene.add(topLight);
  }

  setupGrid() {
    // 地面网格
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xdddddd);
    gridHelper.position.y = -50;
    this.scene.add(gridHelper);

    // 透明地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.1 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 加载 GLTF/GLB 模型
  async loadGLTFModel(url) {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          this.model = gltf.scene;

          // 遍历模型，设置材质和阴影
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // 保存原始材质
              if (child.material) {
                this.materials.set(child.uuid, child.material.clone());
              }
            }
          });

          // 自动调整模型大小和位置
          this.fitCameraToObject(this.model);

          this.scene.add(this.model);
          resolve(this.model);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  // 加载 STL 模型
  async loadSTLModel(url, color = 0x3498db) {
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (geometry) => {
          // 计算几何体的边界
          geometry.computeBoundingBox();

          const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.7
          });

          this.model = new THREE.Mesh(geometry, material);
          this.model.castShadow = true;
          this.model.receiveShadow = true;

          // 自动调整模型大小和位置
          this.fitCameraToObject(this.model);

          this.scene.add(this.model);
          resolve(this.model);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading STL:', error);
          reject(error);
        }
      );
    });
  }

  // 自动调整相机以适应模型
  fitCameraToObject(object, offset = 1.5) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
    cameraZ *= offset;

    this.camera.position.set(center.x, center.y, center.z + cameraZ);

    const minZ = box.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

    this.camera.far = cameraToFarEdge * 3;
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(center);
    this.controls.update();
  }

  // 窗口大小变化处理
  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // 渲染循环
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // 销毁方法
  dispose() {
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize.bind(this));

    // 清理几何体和材质
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }

    // 清理渲染器
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  // 设置模型颜色
  setModelColor(color) {
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.set(color);
        }
      });
    }
  }

  // 设置线框模式
  setWireframe(enabled) {
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = enabled;
        }
      });
    }
  }

  // 导出模型
  exportModel() {
    return this.model;
  }

  // 获取场景
  getScene() {
    return this.scene;
  }

  // 获取相机
  getCamera() {
    return this.camera;
  }

  // 获取渲染器
  getRenderer() {
    return this.renderer;
  }
}

export default ModelViewer;
```

#### 切片可视化

切片可视化是3D打印软件的核心功能之一，用于展示3D模型被切片软件处理后的打印路径。

```javascript
// 切片可视化实现
class SliceVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
    this.currentLayer = 0;
    this.layerMeshes = [];
    this.showAllLayers = false;

    // 配置参数
    this.config = {
      layerHeight: 0.2,           // 层高 (mm)
      extrusionWidth: 0.4,        // 挤出宽度 (mm)
      printSpeed: 60,             // 打印速度 (mm/s)
      travelSpeed: 150,           // 移动速度 (mm/s)
      colors: {
        perimeter: 0x3498db,      // 轮廓颜色
        infill: 0x2ecc71,         // 填充颜色
        support: 0xe74c3c,        // 支撑颜色
        travel: 0x95a5a6          // 移动路径颜色
      }
    };
  }

  // 解析 G-code 生成切片数据
  parseGCode(gcode) {
    const lines = gcode.split('\n');
    this.layers = [];
    let currentLayer = null;
    let currentZ = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // 检测层开始
      if (trimmed.startsWith(';LAYER:')) {
        const layerNum = parseInt(trimmed.split(':')[1]);
        currentLayer = {
          number: layerNum,
          z: currentZ,
          paths: [],
          travelPaths: []
        };
        this.layers.push(currentLayer);
        continue;
      }

      // 检测 Z 轴移动（设置当前 Z 高度）
      const zMatch = trimmed.match(/Z([\d.]+)/);
      if (zMatch) {
        currentZ = parseFloat(zMatch[1]);
        if (currentLayer) {
          currentLayer.z = currentZ;
        }
        continue;
      }

      // 解析 G0/G1 移动指令
      if (trimmed.startsWith('G0') || trimmed.startsWith('G1')) {
        const xMatch = trimmed.match(/X([-\d.]+)/);
        const yMatch = trimmed.match(/Y([-\d.]+)/);
        const eMatch = trimmed.match(/E([-\d.]+)/);

        if (xMatch && yMatch) {
          const point = {
            x: parseFloat(xMatch[1]),
            y: parseFloat(yMatch[1]),
            z: currentZ
          };

          if (currentLayer) {
            // 有 E 值表示挤出路径，否则是空跑路径
            if (eMatch && parseFloat(eMatch[1]) > 0) {
              currentLayer.paths.push(point);
            } else {
              currentLayer.travelPaths.push(point);
            }
          }
        }
      }
    }

    return this.layers;
  }

  // 创建层的几何体
  createLayerMesh(layer) {
    const group = new THREE.Group();

    // 创建挤出路径线段
    if (layer.paths.length > 1) {
      const points = layer.paths.map(p =>
        new THREE.Vector3(p.x, p.y, p.z)
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: this.config.colors.perimeter,
        linewidth: 2
      });

      const line = new THREE.Line(geometry, material);
      group.add(line);
    }

    // 创建空跑路径线段（半透明）
    if (layer.travelPaths.length > 1) {
      const travelPoints = layer.travelPaths.map(p =>
        new THREE.Vector3(p.x, p.y, p.z)
      );

      const travelGeometry = new THREE.BufferGeometry().setFromPoints(travelPoints);
      const travelMaterial = new THREE.LineBasicMaterial({
        color: this.config.colors.travel,
        transparent: true,
        opacity: 0.3
      });

      const travelLine = new THREE.Line(travelGeometry, travelMaterial);
      group.add(travelLine);
    }

    // 添加挤出点（使用小球体表示）
    const extrudePositions = layer.paths.map(p =>
      new THREE.Vector3(p.x, p.y, p.z)
    );

    if (extrudePositions.length > 0) {
      const instancedGeometry = new THREE.SphereGeometry(
        this.config.extrusionWidth / 4,
        8, 8
      );
      const instancedMaterial = new THREE.MeshBasicMaterial({
        color: this.config.colors.perimeter
      });

      const instancedMesh = new THREE.InstancedMesh(
        instancedGeometry,
        instancedMaterial,
        extrudePositions.length
      );

      const matrix = new THREE.Matrix4();
      extrudePositions.forEach((pos, i) => {
        matrix.setPosition(pos);
        instancedMesh.setMatrixAt(i, matrix);
      });

      group.add(instancedMesh);
    }

    group.position.z = layer.z;
    return group;
  }

  // 显示所有层
  showAll() {
    this.clear();
    this.showAllLayers = true;

    this.layers.forEach((layer, index) => {
      const mesh = this.createLayerMesh(layer);
      mesh.visible = true;
      this.layerMeshes.push(mesh);
      this.scene.add(mesh);
    });
  }

  // 显示指定层
  showLayer(layerIndex) {
    if (layerIndex < 0 || layerIndex >= this.layers.length) {
      console.error('Invalid layer index');
      return;
    }

    this.clear();
    this.currentLayer = layerIndex;
    this.showAllLayers = false;

    const mesh = this.createLayerMesh(this.layers[layerIndex]);
    mesh.visible = true;
    this.layerMeshes.push(mesh);
    this.scene.add(mesh);
  }

  // 显示一定范围内的层
  showLayersRange(startLayer, endLayer) {
    this.clear();
    this.showAllLayers = false;

    for (let i = startLayer; i <= endLayer && i < this.layers.length; i++) {
      const mesh = this.createLayerMesh(this.layers[i]);
      mesh.visible = true;
      this.layerMeshes.push(mesh);
      this.scene.add(mesh);
    }
  }

  // 清除所有层
  clear() {
    this.layerMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.layerMeshes = [];
  }

  // 获取层数
  getLayerCount() {
    return this.layers.length;
  }

  // 获取当前层
  getCurrentLayer() {
    return this.currentLayer;
  }

  // 获取指定层数据
  getLayer(index) {
    return this.layers[index];
  }
}

export default SliceVisualizer;
```

### 2.2 WebGL / Three.js

#### Three.js 核心概念

Three.js 是 WebGL 的高级封装库，提供了丰富的3D渲染功能。在拓竹科技的产品中，Three.js 被广泛用于：

1. 模型预览和编辑
2. 打印过程模拟
3. 实时打印监控
4. 3D编辑器界面

#### Three.js 渲染管线

```javascript
// Three.js 渲染管线详解
class RenderPipeline {
  constructor() {
    // 1. 场景 (Scene)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 2. 相机 (Camera)
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight,
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );

    // 3. 渲染器 (Renderer)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,           // 抗锯齿
      alpha: true,               // 透明背景
      powerPreference: 'high-performance', // 性能优先
      preserveDrawingBuffer: true // 保留绘制缓冲区
    });

    // 4. 几何体 (Geometry)
    this.geometry = new THREE.BoxGeometry(1, 1, 1);

    // 5. 材质 (Material)
    this.material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.5,
      roughness: 0.5
    });

    // 6. 网格 (Mesh)
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // 7. 光照 (Light)
    this.setupLights();

    // 8. 控制器 (Controls)
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    // 9. 动画循环 (Animation Loop)
    this.animate = this.animate.bind(this);
  }

  setupLights() {
    // 环境光 - 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // 方向光 - 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // 点光源 - 局部照明
    const pointLight = new THREE.PointLight(0xff0000, 1, 100);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // 更新控制器
    this.controls.update();

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }
}
```

#### 材质系统

```javascript
// 材质系统详解
class MaterialSystem {
  // 基础材质 - 不受光照影响
  static createBasicMaterial(color) {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: false
    });
  }

  // 标准材质 - 物理基础渲染 (PBR)
  static createStandardMaterial(options = {}) {
    const {
      color = 0x3498db,
      metalness = 0.0,
      roughness = 0.5,
      map = null,
      normalMap = null,
      roughnessMap = null,
      metalnessMap = null,
      envMap = null,
      clearcoat = 0.0,
      clearcoatRoughness = 0.0,
      sheen = 0.0,
      sheenRoughness = 0.5,
      sheenColor = 0xffffff,
      transmission = 0.0,
      thickness = 0.0,
      ior = 1.5
    } = options;

    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      map,
      normalMap,
      roughnessMap,
      metalnessMap,
      envMap,
      clearcoat,
      clearcoatRoughness,
      sheen,
      sheenRoughness,
      sheenColor,
      transmission,
      thickness,
      ior
    });
  }

  // 物理材质 - 更高级的 PBR
  static createPhysicalMaterial(options = {}) {
    return new THREE.MeshPhysicalMaterial({
      ...this.createStandardMaterial(options),
      reflectivity: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.5,
      thickness: 1.0,
      ior: 1.5,
      sheen: 1.0,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xffffff),
      attenuationTint: new THREE.Color(0xffffff),
      attenuationDistance: 1.0
    });
  }

  // 卡通材质 - 卡通渲染风格
  static createToonMaterial(color, outlineColor = 0x000000) {
    const material = new THREE.MeshToonMaterial({
      color: color
    });

    // 添加轮廓线
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide
    });

    return { material, outlineMaterial };
  }

  // 线框材质
  static createWireframeMaterial(color = 0xffffff) {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true
    });
  }

  //  Lambert 材质 - 简单的漫反射
  static createLambertMaterial(options = {}) {
    const {
      color = 0x3498db,
      map = null,
      lightMap = null,
      emissive = 0x000000,
      emissiveMap = null,
      ambientLightMap = null
    } = options;

    return new THREE.MeshLambertMaterial({
      color,
      map,
      lightMap,
      emissive,
      emissiveMap,
      ambientLightMap
    });
  }

  // Phong 材质 - 镜面反射
  static createPhongMaterial(options = {}) {
    const {
      color = 0x3498db,
      specular = 0x111111,
      shininess = 30,
      map = null,
      normalMap = null,
      emissive = 0x000000,
      emissiveMap = null,
      lightMap = null,
      envMap = null
    } = options;

    return new THREE.MeshPhongMaterial({
      color,
      specular,
      shininess,
      map,
      normalMap,
      emissive,
      emissiveMap,
      lightMap,
      envMap
    });
  }

  // 深度材质 - 用于深度图
  static createDepthMaterial(options = {}) {
    const { near = 0.1, far = 1000 } = options;

    return new THREE.MeshDepthMaterial({
      near: near,
      far: far,
      depthPacking: THREE.BasicDepthPacking
    });
  }

  // 距离材质 - 用于阴影
  static createDistanceMaterial() {
    return new THREE.MeshDistanceMaterial();
  }

  // 创建自定义着色器材质
  static createCustomShaderMaterial(vertexShader, fragmentShader, uniforms = {}) {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: false,
      side: THREE.DoubleSide
    });
  }

  // 渐变材质示例
  static createGradientMaterial(colors) {
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        float mixFactor = (vNormal.y + 1.0) / 2.0;
        vec3 color = mix(colorB, colorA, mixFactor);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        colorA: { value: new THREE.Color(colors[0]) },
        colorB: { value: new THREE.Color(colors[1]) }
      }
    });
  }

  // 玻璃材质
  static createGlassMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.3
    });
  }

  // 金属材质
  static createMetalMaterial(color = 0xaaaaaa, roughness = 0.2) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: 1.0,
      roughness: roughness,
      envMapIntensity: 1.0
    });
  }

  // 发光材质
  static createEmissiveMaterial(color, intensity = 1.0) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity
    });
  }
}

export default MaterialSystem;
```

#### 几何体系统

```javascript
// Three.js 几何体系统
class GeometrySystem {
  // 基础几何体

  // 立方体
  static createBox(width = 1, height = 1, depth = 1) {
    return new THREE.BoxGeometry(width, height, depth);
  }

  // 球体
  static createSphere(radius = 1, widthSegments = 32, heightSegments = 16) {
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  }

  // 圆柱体
  static createCylinder(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32) {
    return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
  }

  // 圆锥体
  static createCone(radius = 1, height = 1, radialSegments = 32) {
    return new THREE.ConeGeometry(radius, height, radialSegments);
  }

  // 圆环
  static createTorus(radius = 1, tube = 0.4, radialSegments = 16, tubularSegments = 100) {
    return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  }

  // 平面
  static createPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    return new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  }

  // 圆
  static createCircle(radius = 1, segments = 32) {
    return new THREE.CircleGeometry(radius, segments);
  }

  // 环面结
  static createTorusKnot(radius = 1, tube = 0.4, radialSegments = 64, tubularSegments = 8, p = 2, q = 3) {
    return new THREE.TorusKnotGeometry(radius, tube, radialSegments, tubularSegments, p, q);
  }

  // 高级几何体

  // 缓冲几何体 - 自定义顶点
  static createBufferGeometry(vertices, indices, normals, uvs) {
    const geometry = new THREE.BufferGeometry();

    if (vertices) {
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
      );
    }

    if (indices) {
      geometry.setIndex(indices);
    }

    if (normals) {
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3)
      );
    }

    if (uvs) {
      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(uvs, 2)
      );
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  // 从点云创建几何体
  static createFromPoints(points, connect = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    if (connect) {
      // 创建连线几何体
      const lineGeometry = new THREE.BufferGeometry();
      const linePoints = [];

      for (let i = 0; i < points.length - 1; i++) {
        linePoints.push(points[i]);
        linePoints.push(points[i + 1]);
      }

      lineGeometry.setFromPoints(linePoints);
      return lineGeometry;
    }

    return geometry;
  }

  // 拉伸几何体 - 从2D形状拉伸成3D
  static createExtrude(shape, options = {}) {
    const {
      depth = 1,
      bevelEnabled = true,
      bevelThickness = 0.1,
      bevelSize = 0.1,
      bevelSegments = 3,
      curveSegments = 12
    } = options;

    const extrudeSettings = {
      depth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  // 旋转几何体 - 绕轴旋转生成3D
  static createLathe(points, segments = 12, phiStart = 0, phiLength = Math.PI * 2) {
    return new THREE.LatheGeometry(points, segments, phiStart, phiLength);
  }

  // 文本几何体
  static async createText(text, options = {}) {
    const {
      font = null,
      size = 1,
      height = 0.2,
      curveSegments = 12,
      bevelEnabled = false,
      bevelThickness = 0.02,
      bevelSize = 0.02,
      bevelSegments = 3
    } = options;

    // 需要先加载字体
    const loader = new THREE.FontLoader();

    return new Promise((resolve, reject) => {
      if (!font) {
        // 使用默认字体
        loader.load(
          'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
          (loadedFont) => {
            const geometry = new THREE.TextGeometry(text, {
              font: loadedFont,
              size,
              height,
              curveSegments,
              bevelEnabled,
              bevelThickness,
              bevelSize,
              bevelSegments
            });

            geometry.computeBoundingBox();
            const centerOffset = -0.5 * (
              geometry.boundingBox.max.x - geometry.boundingBox.min.x
            );
            geometry.translate(centerOffset, 0, 0);

            resolve(geometry);
          },
          undefined,
          reject
        );
      } else {
        const geometry = new THREE.TextGeometry(text, {
          font,
          size,
          height,
          curveSegments,
          bevelEnabled,
          bevelThickness,
          bevelSize,
          bevelSegments
        });

        resolve(geometry);
      }
    });
  }

  // 合并几何体
  static mergeGeometries(geometries, useGroups = true) {
    return THREE.BufferGeometryUtils.mergeGeometries(geometries, useGroups);
  }

  // 克隆几何体
  static cloneGeometry(geometry) {
    return geometry.clone();
  }

  // 从模型文件加载
  static async loadFromFile(file, format) {
    let loader;

    switch (format.toLowerCase()) {
      case 'obj':
        loader = new THREE.OBJLoader();
        break;
      case 'stl':
        loader = new THREE.STLLoader();
        break;
      case 'gltf':
      case 'glb':
        loader = new THREE.GLTFLoader();
        break;
      case 'fbx':
        loader = new THREE.FBXLoader();
        break;
      case '3ds':
        loader = new THREE.3DSLoader();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return new Promise((resolve, reject) => {
      loader.load(file, resolve, undefined, reject);
    });
  }
}

export default GeometrySystem;
```

#### 粒子系统

```javascript
// 粒子系统实现
class ParticleSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      particleCount: options.particleCount || 1000,
      particleSize: options.particleSize || 1,
      color: options.color || 0xffffff,
      transparent: options.transparent || true,
      opacity: options.opacity || 1,
      blending: options.blending || THREE.AdditiveBlending,
      position: options.position || new THREE.Vector3(0, 0, 0),
      spread: options.spread || new THREE.Vector3(10, 10, 10),
      velocity: options.velocity || new THREE.Vector3(0, 0, 0),
      gravity: options.gravity || new THREE.Vector3(0, -0.01, 0),
      lifetime: options.lifetime || Infinity,
      fadeOut: options.fadeOut || false,
      texture: options.texture || null
    };

    this.particles = null;
    this.velocities = [];
    this.ages = [];

    this.init();
  }

  init() {
    const { particleCount, color, particleSize, transparent, opacity, blending, position, spread, texture } = this.options;

    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      // 随机位置
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread.y;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread.z;

      // 颜色
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      // 大小
      sizes[i] = particleSize * (0.5 + Math.random() * 0.5);

      // 初始化速度
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ));

      // 初始化年龄
      this.ages.push(Math.random() * this.options.lifetime);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建材质
    let material;

    if (texture) {
      material = new THREE.PointsMaterial({
        size: particleSize,
        color: color,
        map: texture,
        transparent: transparent,
        opacity: opacity,
        blending: blending,
        vertexColors: true,
        sizeAttenuation: true,
        depthWrite: false
      });
    } else {
      material = new THREE.PointsMaterial({
        size: particleSize,
        color: color,
        transparent: transparent,
        opacity: opacity,
        blending: blending,
        vertexColors: true,
        sizeAttenuation: true,
        depthWrite: false
      });
    }

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  // 更新粒子
  update(deltaTime = 0.016) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const sizes = this.particles.geometry.attributes.size.array;
    const { gravity, lifetime, fadeOut, spread, position } = this.options;

    for (let i = 0; i < this.velocities.length; i++) {
      // 更新速度（应用重力）
      this.velocities[i].add(gravity);

      // 更新位置
      positions[i * 3] += this.velocities[i].x;
      positions[i * 3 + 1] += this.velocities[i].y;
      positions[i * 3 + 2] += this.velocities[i].z;

      // 更新年龄
      this.ages[i] += deltaTime;

      // 如果粒子寿命到期，重置
      if (this.ages[i] > lifetime) {
        positions[i * 3] = position.x + (Math.random() - 0.5) * spread.x;
        positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread.y;
        positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread.z;

        this.velocities[i].set(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        );

        this.ages[i] = 0;
      }

      // 淡出效果
      if (fadeOut) {
        const lifeRatio = 1 - (this.ages[i] / lifetime);
        sizes[i] = this.options.particleSize * (0.5 + Math.random() * 0.5) * lifeRatio;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;
  }

  // 设置颜色
  setColor(color) {
    this.particles.material.color.set(color);
  }

  // 设置大小
  setSize(size) {
    this.particles.material.size = size;
    this.options.particleSize = size;
  }

  // 设置位置
  setPosition(position) {
    this.options.position.copy(position);
  }

  // 销毁
  dispose() {
    this.scene.remove(this.particles);
    this.particles.geometry.dispose();
    this.particles.material.dispose();
  }
}

export default ParticleSystem;
```

#### 后处理效果

```javascript
// 后处理效果系统
class PostProcessingSystem {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.composer = null;
    this.renderPass = null;
    this.effectPasses = [];

    this.init();
  }

  init() {
    // 导入 EffectComposer
    const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');
    const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');
    const { UnrealBloomPass } = require('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    const { FXAAShader } = require('three/examples/jsm/shaders/FXAAShader.js');

    // 创建合成器
    this.composer = new EffectComposer(this.renderer);

    // 添加渲染通道
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
  }

  // 添加 Bloom 效果（辉光）
  addBloom(strength = 1.0, radius = 0.4, threshold = 0.85) {
    const { UnrealBloomPass } = require('three/examples/jsm/postprocessing/UnrealBloomPass.js');

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      strength,
      radius,
      threshold
    );

    this.composer.addPass(bloomPass);
    this.effectPasses.push(bloomPass);

    return bloomPass;
  }

  // 添加抗锯齿
  addFXAA() {
    const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');
    const { FXAAShader } = require('three/examples/jsm/shaders/FXAAShader.js');

    const fxaaPass = new ShaderPass(FXAAShader);

    const pixelRatio = this.renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

    this.composer.addPass(fxaaPass);

    return fxaaPass;
  }

  // 添加景深效果
  addDepthOfField(focus = 10.0, aperture = 0.025, maxBlur = 0.01) {
    const { BokehPass } = require('three/examples/jsm/postprocessing/BokehPass.js');

    const bokehPass = new BokehPass(this.scene, this.camera, {
      focus: focus,
      aperture: aperture,
      maxblur: maxBlur
    });

    this.composer.addPass(bokehPass);

    return bokehPass;
  }

  // 添加色彩校正
  addColorCorrection(options = {}) {
    const {
      brightness = 0,
      contrast = 1,
      saturation = 1,
      hue = 0
    } = options;

    const ColorCorrectionShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'brightness': { value: brightness },
        'contrast': { value: contrast },
        'saturation': { value: saturation },
        'hue': { value: hue }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        uniform float hue;
        varying vec2 vUv;

        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);

          // Brightness
          color.rgb += brightness;

          // Contrast
          color.rgb = (color.rgb - 0.5) * contrast + 0.5;

          // Saturation and Hue
          vec3 hsv = rgb2hsv(color.rgb);
          hsv.x += hue;
          hsv.y *= saturation;
          color.rgb = hsv2rgb(hsv);

          gl_FragColor = color;
        }
      `
    };

    const pass = new ShaderPass(ColorCorrectionShader);
    this.composer.addPass(pass);

    return pass;
  }

  // 添加噪声效果
  addNoise(opacity = 0.1) {
    const NoiseShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0 },
        'opacity': { value: opacity }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;

        float random(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float noise = random(vUv + time) * opacity;
          color.rgb += vec3(noise);
          gl_FragColor = color;
        }
      `
    };

    const pass = new ShaderPass(NoiseShader);
    this.composer.addPass(pass);

    return pass;
  }

  // 添加自定义着色器效果
  addCustomShader(shader) {
    const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');

    const pass = new ShaderPass(shader);
    this.composer.addPass(pass);

    return pass;
  }

  // 渲染
  render() {
    this.composer.render();
  }

  // 设置大小
  setSize(width, height) {
    this.composer.setSize(width, height);
  }

  // 销毁
  dispose() {
    this.composer.dispose();
  }
}

export default PostProcessingSystem;
```

### 2.3 实时通信

#### WebSocket 实时通信

在3D打印应用中，实时通信主要用于：

1. 打印机状态监控
2. 远程控制指令
3. 打印进度同步
4. 固件更新推送

```javascript
// WebSocket 实时通信管理器
class PrinterWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnect: options.reconnect !== false,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options
    };

    this.ws = null;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.isConnected = false;
    this.listeners = new Map();

    // 消息队列（离线时缓存消息）
    this.messageQueue = [];

    // 打印机状态
    this.printerState = {
      status: 'disconnected',
      temperature: { bed: 0, extruder: 0 },
      progress: 0,
      currentLayer: 0,
      totalLayers: 0,
      printTime: 0,
      filamentUsed: 0,
      sdCard: null,
      job: null
    };
  }

  // 连接
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // 开始心跳
          this.startHeartbeat();

          // 发送缓存的消息
          this.flushMessageQueue();

          // 触发连接事件
          this.emit('connected');

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');

          // 尝试重连
          if (this.options.reconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    this.options.reconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 重连
  reconnect() {
    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.min(this.reconnectAttempts, 5);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  // 发送消息
  send(type, data = {}) {
    const message = {
      type,
      data,
      timestamp: Date.now()
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // 缓存离线消息
      this.messageQueue.push(message);
    }
  }

  // 处理接收到的消息
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'printer_status':
          this.updatePrinterState(message.data);
          this.emit('status', message.data);
          break;

        case 'temperature':
          this.printerState.temperature = message.data;
          this.emit('temperature', message.data);
          break;

        case 'progress':
          this.printerState.progress = message.data.progress;
          this.printerState.currentLayer = message.data.currentLayer;
          this.printerState.totalLayers = message.data.totalLayers;
          this.emit('progress', message.data);
          break;

        case 'print_complete':
          this.emit('print_complete', message.data);
          break;

        case 'print_error':
          this.emit('print_error', message.data);
          break;

        case 'gcode_response':
          this.emit('gcode_response', message.data);
          break;

        case 'heartbeat':
          // 服务器心跳响应
          break;

        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  // 更新打印机状态
  updatePrinterState(data) {
    Object.assign(this.printerState, data);
  }

  // 开始心跳
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat');
    }, this.options.heartbeatInterval);
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 发送缓存的消息
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  // 事件监听
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 移除监听
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // 触发事件
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // 发送 G-code 命令
  sendGCode(gcode) {
    this.send('gcode', { command: gcode });
  }

  // 开始打印
  startPrint(gcodeFile) {
    this.send('print_start', { file: gcodeFile });
  }

  // 暂停打印
  pausePrint() {
    this.send('print_pause');
  }

  // 恢复打印
  resumePrint() {
    this.send('print_resume');
  }

  // 停止打印
  stopPrint() {
    this.send('print_stop');
  }

  // 挤出控制
  extrude(amount) {
    this.sendGCode(`M83\nG1 E${amount} F100`);
  }

  // 退丝
  retract(amount) {
    this.sendGCode(`M83\nG1 E-${amount} F300`);
  }

  // 移动喷头
  moveTo(x, y, z, speed = 1000) {
    this.sendGCode(`G0 X${x} Y${y} Z${z} F${speed}`);
  }

  // 设置温度
  setTemperature(bed, extruder) {
    if (bed !== undefined) {
      this.sendGCode(`M140 S${bed}`);
    }
    if (extruder !== undefined) {
      this.sendGCode(`M104 S${extruder}`);
    }
  }

  // 获取状态
  getState() {
    return this.printerState;
  }

  // 检查连接状态
  isConnectedState() {
    return this.isConnected;
  }
}

export default PrinterWebSocket;
```

#### Socket.io 实现

```javascript
// Socket.io 实时通信实现
class SocketIOClient {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.options = {
      transports: options.transports || ['websocket', 'polling'],
      reconnection: options.reconnection !== false,
      reconnectionAttempts: options.reconnectionAttempts || 10,
      reconnectionDelay: options.reconnectionDelay || 1000,
      ...options
    };

    this.socket = null;
    this.rooms = new Set();
    this.listeners = new Map();

    // 初始化
    this.init();
  }

  init() {
    // 动态导入 socket.io-client
    import('socket.io-client').then(({ io }) => {
      this.socket = io(this.serverUrl, this.options);

      this.setupEventHandlers();
    });
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // 连接事件
    this.socket.on('connect', () => {
      console.log('Socket.io connected:', this.socket.id);
      this.emit('connected', this.socket.id);

      // 重新加入房间
      this.rooms.forEach(room => {
        this.socket.emit('join_room', room);
      });
    });

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      this.emit('disconnected', reason);
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.emit('error', error);
    });

    // 打印机状态更新
    this.socket.on('printer:status', (data) => {
      this.emit('printer_status', data);
    });

    // 打印进度
    this.socket.on('print:progress', (data) => {
      this.emit('print_progress', data);
    });

    // 温度更新
    this.socket.on('printer:temperature', (data) => {
      this.emit('temperature', data);
    });

    // 文件列表更新
    this.socket.on('files:updated', (data) => {
      this.emit('files_updated', data);
    });

    // 固件更新状态
    this.socket.on('firmware:status', (data) => {
      this.emit('firmware_status', data);
    });

    // 摄像头帧更新
    this.socket.on('camera:frame', (data) => {
      this.emit('camera_frame', data);
    });
  }

  // 发送事件
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // 监听事件
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // 同时在 socket 上监听
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  // 移除监听
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // 同时从 socket 移除
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 发送消息到服务器
  send(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // 加入房间
  joinRoom(room) {
    this.rooms.add(room);

    if (this.socket) {
      this.socket.emit('join_room', room);
    }
  }

  // 离开房间
  leaveRoom(room) {
    this.rooms.delete(room);

    if (this.socket) {
      this.socket.emit('leave_room', room);
    }
  }

  // 打印机相关方法

  // 请求打印机状态
  requestPrinterStatus() {
    this.send('printer:request_status');
  }

  // 开始打印
  startPrint(gcode) {
    this.send('print:start', { gcode });
  }

  // 暂停打印
  pausePrint() {
    this.send('print:pause');
  }

  // 恢复打印
  resumePrint() {
    this.send('print:resume');
  }

  // 停止打印
  stopPrint() {
    this.send('print:stop');
  }

  // 控制电机
  controlMotor(action) {
    this.send('printer:motor', { action }); // action: 'home', 'stop', etc.
  }

  // 设置温度
  setTemperature(bed, extruder) {
    this.send('printer:temperature', { bed, extruder });
  }

  // 请求摄像头流
  requestCameraStream() {
    this.send('camera:start_stream');
  }

  // 停止摄像头流
  stopCameraStream() {
    this.send('camera:stop_stream');
  }

  // 获取文件列表
  requestFileList(path = '/') {
    this.send('files:list', { path });
  }

  // 上传文件
  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    this.send('files:upload', formData);
  }

  // 删除文件
  deleteFile(filename) {
    this.send('files:delete', { filename });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 获取连接状态
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // 获取 socket ID
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

export default SocketIOClient;
```

#### MQTT 物联网通信

```javascript
// MQTT 物联网通信实现
class MqttClient {
  constructor(options = {}) {
    this.options = {
      clientId: options.clientId || `printer_${Math.random().toString(16).slice(2)}`,
      username: options.username,
      password: options.password,
      protocol: options.protocol || 'ws',
      host: options.host || 'localhost',
      port: options.port || 9001,
      topicPrefix: options.topicPrefix || 'bambulab',
      qos: options.qos || 1,
      retain: options.retain || false,
      ...options
    };

    this.client = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.messageCache = new Map();
    this.pendingMessages = [];

    // 打印机状态
    this.printerState = {
      online: false,
      serial: null,
      type: null,
      firmware: null,
      temperature: { bed: 0, chamber: 0, extruder: 0 },
      print: null,
      wifi: { signal: 0, ip: '' },
      thrust: { x: 0, y: 0, z: 0 },
      speed: { print: 0, travel: 0 }
    };
  }

  // 连接
  async connect() {
    const { Client } = await import('mqtt');

    const url = `${this.options.protocol}://${this.options.host}:${this.options.port}/mqtt`;

    this.client = Client(url, {
      clientId: this.options.clientId,
      username: this.options.username,
      password: this.options.password,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000
    });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('MQTT connected');
        this.isConnected = true;

        // 重新订阅之前订阅的主题
        this.subscriptions.forEach((options, topic) => {
          this.client.subscribe(topic, options);
        });

        // 发送待发送的消息
        this.flushPendingMessages();

        this.emit('connected');
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('MQTT error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.client.on('close', () => {
        console.log('MQTT disconnected');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('offline', () => {
        console.log('MQTT offline');
        this.isConnected = false;
        this.emit('offline');
      });

      this.client.on('reconnect', () => {
        console.log('MQTT reconnecting...');
        this.emit('reconnecting');
      });
    });
  }

  // 断开连接
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  // 订阅主题
  subscribe(topic, options = {}) {
    const qos = options.qos !== undefined ? options.qos : this.options.qos;

    this.subscriptions.set(topic, { qos });

    if (this.client && this.isConnected) {
      this.client.subscribe(topic, { qos });
    }
  }

  // 取消订阅
  unsubscribe(topic) {
    this.subscriptions.delete(topic);

    if (this.client && this.isConnected) {
      this.client.unsubscribe(topic);
    }
  }

  // 发布消息
  publish(topic, payload, options = {}) {
    const message = {
      topic,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : payload,
      qos: options.qos !== undefined ? options.qos : this.options.qos,
      retain: options.retain !== undefined ? options.retain : this.options.retain
    };

    if (this.client && this.isConnected) {
      this.client.publish(message.topic, message.payload, {
        qos: message.qos,
        retain: message.retain
      });
    } else {
      // 缓存消息，等连接后发送
      this.pendingMessages.push(message);
    }
  }

  // 处理接收到的消息
  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const { topicPrefix } = this.options;

      // 解析主题
      // 格式: bambulab/{device_id}/description
      //       bambulab/{device_id}/telemetry
      //       bambulab/{device_id}/print

      const parts = topic.replace(`${topicPrefix}/`, '').split('/');
      const deviceId = parts[0];
      const type = parts[1];

      switch (type) {
        case 'description':
          this.printerState = {
            ...this.printerState,
            online: true,
            serial: data.serial,
            type: data.type,
            firmware: data.version
          };
          this.emit('description', data);
          break;

        case 'telemetry':
          this.printerState.temperature = data.temperature || {};
          this.printerState.wifi = data.wifi || {};
          this.printerState.thrust = data.thrust || {};
          this.printerState.speed = data.speed || {};
          this.emit('telemetry', data);
          break;

        case 'print':
          this.printerState.print = data;
          this.emit('print', data);
          break;

        default:
          this.emit('message', { topic, data });
      }

      // 触发主题相关事件
      this.emit(topic, data);
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  // 发送待发送的消息
  flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.client.publish(message.topic, message.payload, {
        qos: message.qos,
        retain: message.retain
      });
    }
  }

  // 事件监听
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 移除监听
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // 触发事件
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // 订阅打印机描述
  subscribeDescription(deviceId) {
    const topic = `${this.options.topicPrefix}/${deviceId}/description`;
    this.subscribe(topic);
  }

  // 订阅遥测数据
  subscribeTelemetry(deviceId, interval = 1000) {
    const topic = `${this.options.topicPrefix}/${deviceId}/telemetry`;
    this.subscribe(topic);
  }

  // 订阅打印状态
  subscribePrint(deviceId) {
    const topic = `${this.options.topicPrefix}/${deviceId}/print`;
    this.subscribe(topic);
  }

  // 获取打印机状态
  getPrinterState() {
    return this.printerState;
  }

  // 检查连接状态
  isConnectedState() {
    return this.isConnected;
  }
}

export default MqttClient;
```

---

## 三、面试高频问题

### 3.1 技术问题汇总

#### HTML/CSS 问题

**问题1：CSS Flexbox 和 Grid 的区别？**

```css
/* Flexbox - 一维布局 */
.container {
  display: flex;
  flex-direction: row;        /* 行/列方向 */
  justify-content: center;    /* 主轴对齐 */
  align-items: center;         /* 交叉轴对齐 */
  flex-wrap: wrap;            /* 换行 */
  gap: 10px;                   /* 项目间距 */
}

/* Flex 项目的属性 */
.item {
  flex-grow: 1;    /* 放大比例 */
  flex-shrink: 0;  /* 缩小比例 */
  flex-basis: 100px; /* 基准尺寸 */
  flex: 1 0 auto;   /* 简写: grow shrink basis */
  align-self: center; /* 单独对齐 */
}

/* Grid - 二维布局 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 列定义 */
  grid-template-rows: auto;               /* 行定义 */
  gap: 10px;                              /* 间距 */
  justify-items: center;                   /* 单元格水平对齐 */
  align-items: center;                    /* 单元格垂直对齐 */
  justify-content: center;                /* 整个网格在容器中的水平对齐 */
  align-content: center;                  /* 整个网格在容器中的垂直对齐 */
}

/* Grid 项目的属性 */
.item {
  grid-column: 1 / 3;  /* 跨列: 开始 / 结束 */
  grid-row: 1 / 2;     /* 跨行: 开始 / 结束 */
  grid-area: 1 / 1 / 3 / 2; /* 行开始 / 列开始 / 行结束 / 列结束 */
  justify-self: center;
  align-self: center;
}

/* Grid 模板区域 */
.container {
  grid-template-areas:
    "header header header"
    "sidebar content content"
    "footer footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer { grid-area: footer; }
```

**问题2：CSS 层叠上下文和 z-index？**

```css
/* 创建新的层叠上下文的属性 */
.context {
  /* 1. position 为 relative/absolute/fixed 且 z-index 不为 auto */
  position: relative;
  z-index: 1;

  /* 2. position 为 fixed */
  position: fixed;
  z-index: 100;

  /* 3. flex 项且 z-index 不为 auto */
  display: flex;
  z-index: 1;

  /* 4. grid 项且 z-index 不为 auto */
  display: grid;
  z-index: 1;

  /* 5. opacity 小于 1 */
  opacity: 0.9;

  /* 6. transform 不为 none */
  transform: translateX(0);

  /* 7. mix-blend-mode 不为 normal */
  mix-blend-mode: multiply;

  /* 8. filter 不为 none */
  filter: blur(0);

  /* 9. perspective 不为 none */
  perspective: 1000px;

  /* 10. isolation 为 isolate */
  isolation: isolate;

  /* 11. will-change 指定了 z-index */
  will-change: transform;
  z-index: 1;
}

/* 层叠顺序（从低到高） */
/*
1. 背景和边框 - 形成层叠上下文的元素
2. 负 z-index 的子元素
3. 块级盒
4. 浮动盒
5. 行内盒
6. z-index: 0 的定位元素
7. 正 z-index 的子元素
*/
```

**问题3：响应式设计最佳实践？**

```css
/* 1. 使用 rem 单位进行响应式排版 */
html {
  font-size: 16px;
}

@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  html {
    font-size: 12px;
  }
}

/* 2. 容器查询 - 现代响应式方案 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

/* 3. clamp() 响应式尺寸 */
.responsive-text {
  font-size: clamp(1rem, 2vw + 1rem, 2rem);
}

.responsive-width {
  width: clamp(300px, 80vw, 1000px);
}

/* 4. 条件CSS - @supports */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

@supports not (container-type: inline-size) {
  /* 后备样式 */
}

/* 5. 选择器查询 - 仅在支持特定选择器时使用 */
@supports selector(:has(.child)) {
  .parent:has(.child) {
    /* 现代样式 */
  }
}
```

#### JavaScript 问题

**问题4：JavaScript 原型和原型链？**

```javascript
// 原型示例
function Person(name, age) {
  this.name = name;
  this.age = age;
}

// 原型方法
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

Person.prototype.getAge = function() {
  return this.age;
};

// 静态方法（直接挂在构造函数上）
Person.compareAge = function(p1, p2) {
  return p1.age - p2.age;
};

// 创建实例
const alice = new Person('Alice', 25);
const bob = new Person('Bob', 30);

// 原型链
console.log(alice.__proto__ === Person.prototype);        // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__);                  // null

// instanceof
console.log(alice instanceof Person);     // true
console.log(alice instanceof Object);    // true

// Object.create() 创建原型
const student = Object.create(Person.prototype);
student.grade = 'A';
console.log(student.greet()); // Hello, I'm undefined

// ES6 Class 语法（语法糖）
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }

  // 静态方法
  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // 调用父类构造函数
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }
}

const dog = new Dog('Max', 'Golden Retriever');
console.log(dog.speak());        // Max barks
console.log(dog instanceof Dog);  // true
console.log(dog instanceof Animal); // true
```

**问题5：JavaScript 闭包和作用域？**

```javascript
// 闭包示例
function createCounter() {
  let count = 0;

  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount());  // 2
console.log(counter.decrement()); // 1

// 经典闭包问题
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// 解决方案 1: 使用 let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}

// 解决方案 2: 使用闭包
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 100);
  })(i);
}

// 解决方案 3: 使用 bind
for (var i = 0; i < 3; i++) {
  setTimeout(console.log.bind(null, i), 100);
}

// 模块模式
const Module = (function() {
  // 私有变量
  let _privateVar = 'private';

  // 私有方法
  function _privateMethod() {
    return _privateVar;
  }

  // 公共 API
  return {
    publicVar: 'public',
    publicMethod() {
      return _privateMethod();
    }
  };
})();

// 现代模块模式 (ES6)
const createModule = (initialValue) => {
  let value = initialValue;

  return {
    getValue() {
      return value;
    },
    setValue(newValue) {
      value = newValue;
    }
  };
};
```

**问题6：Promise 和 Async/Await？**

```javascript
// Promise 基础
const promise = new Promise((resolve, reject) => {
  const success = true;

  setTimeout(() => {
    if (success) {
      resolve({ message: 'Success!' });
    } else {
      reject(new Error('Failed'));
    }
  }, 1000);
});

promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));

// Promise 链式调用
fetchUser(1)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(error => console.error(error));

// Promise.all - 并行执行
Promise.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
])
  .then(users => console.log(users))
  .catch(error => console.error(error));

// Promise.allSettled - 不管成功失败
Promise.allSettled([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`User ${index}:`, result.value);
      } else {
        console.log(`User ${index} failed:`, result.reason);
      }
    });
  });

// Promise.race - 返回最先完成的结果
Promise.race([
  fetchWithTimeout(1000),
  fetchUser(1)
])
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Promise.any - 返回第一个成功的结果
Promise.any([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
])
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Async/Await
async function fetchData() {
  try {
    const user = await fetchUser(1);
    const posts = await fetchPosts(user.id);
    return posts;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// 并行执行 - 使用 Promise.all
async function fetchAllData() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);

  return { users, posts, comments };
}

// 错误处理
async function safeAsync(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    return [error, null];
  }
}

// 使用
const [error, data] = await safeAsync(fetchUser(1));
if (error) {
  console.error(error);
} else {
  console.log(data);
}
```

**问题7：事件循环和异步编程？**

```javascript
// 事件循环示例
console.log('1. Start'); // 同步

setTimeout(() => {
  console.log('2. Timeout'); // 宏任务
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise'); // 微任务
});

console.log('4. End'); // 同步

// 输出顺序: 1, 4, 3, 2

// 微任务和宏任务
// 微任务: Promise, MutationObserver, queueMicrotask, process.nextTick
// 宏任务: setTimeout, setInterval, I/O, UI rendering

// 示例：nextTick vs setImmediate
process.nextTick(() => {
  console.log('nextTick');
});

setImmediate(() => {
  console.log('setImmediate');
});

// queueMicrotask
queueMicrotask(() => {
  console.log('microtask');
});

// async/await 中的微任务
async function example() {
  console.log('1');

  await Promise.resolve();

  console.log('2'); // 这是微任务

  setTimeout(() => {
    console.log('3'); // 这是宏任务
  }, 0);
}

example();

console.log('4'); // 同步

// 输出: 1, 4, 2, 3
```

#### React 问题

**问题8：React Hooks 原理？**

```javascript
// useState 实现
function useState(initialValue) {
  let state = initialValue;

  function setState(newValue) {
    state = typeof newValue === 'function' ? newValue(state) : newValue;
    // 触发重新渲染
    render();
  }

  return [state, setState];
}

// useEffect 实现
function useEffect(effect, dependencies) {
  // 保存上一次的依赖值
  const prevDeps = useRef(dependencies);

  // 检查依赖是否变化
  const hasChanged = !prevDeps.current ||
    dependencies.some((dep, i) => !Object.is(dep, prevDeps.current[i]));

  if (hasChanged) {
    // 清理上一次的效果
    if (prevDeps.current !== undefined) {
      effect.cleanup?.();
    }

    // 执行当前效果
    effect();
    prevDeps.current = dependencies;
  }
}

// useRef 实现
function useRef(initialValue) {
  const ref = useState({ current: initialValue })[0];
  return ref;
}

// useMemo 实现
function useMemo(factory, dependencies) {
  const prevDeps = useRef(dependencies);
  const prevValue = useRef(null);

  const hasChanged = !prevDeps.current ||
    dependencies.some((dep, i) => !Object.is(dep, prevDeps.current[i]));

  if (hasChanged) {
    prevValue.current = factory();
    prevDeps.current = dependencies;
  }

  return prevValue.current;
}

// useCallback 实现
function useCallback(callback, dependencies) {
  return useMemo(() => callback, dependencies);
}

// 自定义 Hook：useDebounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 自定义 Hook：useLocalStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 自定义 Hook：useWindowSize
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// useReducer 实现
function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialValue);

  function dispatch(action) {
    const newState = reducer(state, action);
    setState(newState);
  }

  return [state, dispatch];
}

// 使用示例
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

**问题9：React 性能优化？**

```javascript
// 1. React.memo - 浅比较
const MyComponent = React.memo(function MyComponent({ name, onClick }) {
  return (
    <div onClick={onClick}>
      {name}
    </div>
  );
});

// 自定义比较函数
const MyComponent = React.memo(
  function MyComponent({ name, data }) {
    return <div>{name}: {data.value}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示相同，不重新渲染
    return prevProps.name === nextProps.name;
  }
);

// 2. useMemo - 缓存计算结果
function ExpensiveComponent({ a, b }) {
  const result = useMemo(() => {
    // 昂贵的计算
    return computeExpensiveValue(a, b);
  }, [a, b]);

  return <div>{result}</div>;
}

// 3. useCallback - 缓存函数引用
function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]); // 只有 count 变化时才创建新函数

  return <ChildComponent onClick={handleClick} />;
}

// 4. 虚拟列表 - react-window
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 5. 代码分割 - React.lazy
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <Suspense fallback={<Loading />}>
      <OtherComponent />
    </Suspense>
  );
}

// 6. 避免不必要的渲染
class OptimizedComponent extends React.PureComponent {
  // PureComponent 实现了 shouldComponentUpdate 的浅比较
  render() {
    return <div>{this.props.name}</div>;
  }
}

// 7. 使用 key 正确
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li> // 使用稳定的唯一 ID
      ))}
    </ul>
  );
}

// 8. 状态位置优化
// 将状态下移到需要的组件
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <ChildA count={count} />
      <ChildB onIncrement={() => setCount(c => c + 1)} />
    </div>
  );
}

// 9. 批量更新
function handleClick() {
  // React 18 自动批量更新
  setCount(c => c + 1);
  setFlag(f => !f);

  // React 17 及之前需要使用 unstable_batchedUpdates
  // ReactDOM.unstable_batchedUpdates(() => {
  //   setCount(c => c + 1);
  //   setFlag(f => !f);
  // });
}

// 10. 使用 useTransition 和 useDeferredValue
function SearchResults() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');

  // 让查询输入有更高优先级
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value);
    startTransition(() => {
      setDeferredQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Loading /> : <Results query={deferredQuery} />}
    </div>
  );
}
```

**问题10：Redux 和状态管理？**

```javascript
// Redux 基本结构
// store.js
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

// reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'SET':
      return { count: action.payload };
    default:
      return state;
  }
}

function userReducer(state = { user: null, loading: false }, action) {
  switch (action.type) {
    case 'FETCH_USER_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_USER_SUCCESS':
      return { ...state, user: action.payload, loading: false };
    case 'FETCH_USER_FAILURE':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer
});

// 中间件
const middleware = [thunk, logger];

// 创建 store
const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
);

export default store;

// action creators
export const increment = () => ({ type: 'INCREMENT' });
export const decrement = () => ({ type: 'DECREMENT' });
export const setCount = (count) => ({ type: 'SET', payload: count });

// 异步 action (thunk)
export const fetchUser = (userId) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_USER_REQUEST' });

    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      dispatch({ type: 'FETCH_USER_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'FETCH_USER_FAILURE', payload: error.message });
    }
  };
};

// 使用 useSelector 和 useDispatch
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector(state => state.counter.count);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}

// createSlice (Redux Toolkit)
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    }
  }
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

// 使用 RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => `/users/${id}`
    }),
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser
      })
    })
  })
});

export const { useGetUserQuery, useCreateUserMutation } = api;
```

### 3.2 项目经验问题

#### 项目经验问题示例

**问题1：请介绍一下你最引以为豪的前端项目？**

```javascript
// 回答框架示例：3D 打印模型预览器项目
/*
项目背景：
- 拓竹科技的云切片 Web 应用
- 为用户提供在线 3D 模型预览、编辑和切片功能

技术挑战：
1. 大型 3D 模型（100MB+）的加载和渲染性能问题
2. 实时切片路径的可视化渲染
3. 多平台兼容性和移动端适配

解决方案：
1. 使用 Web Worker 进行模型解析和切片计算
2. 采用 LOD (Level of Detail) 技术进行模型分级显示
3. 使用 InstancedMesh 优化大量挤出点的渲染
4. 实现渐进式加载，提供骨架屏和低质量预览

成果：
- 模型加载时间减少 60%
- 渲染帧率从 20fps 提升到 60fps
- 用户满意度提升 30%
*/
```

**问题2：如何优化大型 Web 应用的首屏加载？**

```javascript
// 优化策略
const optimizationStrategies = {
  // 1. 代码分割
  codeSplitting: `
    // 路由级代码分割
    const Home = () => import('./pages/Home');
    const Profile = () => import('./pages/Profile');

    // 组件级代码分割
    const HeavyChart = React.lazy(() => import('./components/HeavyChart'));

    // 动态 import
    const module = await import('./heavy-module');
  `,

  // 2. 资源压缩
  resourceCompression: `
    // 启用 gzip/brotli 压缩
    // 配置 CDN 压缩
    // 使用压缩后的图片格式 (WebP, AVIF)
  `,

  // 3. 图片优化
  imageOptimization: `
    // 使用 picture 标签
    <picture>
      <source srcset="img.avif" type="image/avif" />
      <source srcset="img.webp" type="image/webp" />
      <img src="img.jpg" alt="description" />
    </picture>

    // 懒加载
    <img loading="lazy" src="image.jpg" />

    // 响应式图片
    srcset="img-320.jpg 320w, img-640.jpg 640w, img-1024.jpg 1024w"
  `,

  // 4. 预加载和预获取
  prefetching: `
    // 预加载关键资源
    <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin />

    // 预连接
    <link rel="preconnect" href="https://api.example.com" />

    // 预获取下一个路由
    <link rel="prefetch" href="/dashboard" />
  `,

  // 5. 服务端渲染 / 静态生成
  ssr: `
    // Next.js SSR
    export async function getServerSideProps() {
      const data = await fetchData();
      return { props: { data } };
    }

    // Next.js SSG
    export async function getStaticProps() {
      const data = await fetchData();
      return { props: { data } };
    }
  `,

  // 6. 骨架屏
  skeletonScreen: `
    // CSS 骨架屏
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
  `
};
```

**问题3：如何处理前端错误和异常？**

```javascript
// 全局错误处理
class ErrorHandler {
  constructor() {
    this.init();
  }

  init() {
    // JavaScript 运行时错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });

    // Promise 未捕获错误
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });

    // React 错误边界
    // 组件级错误处理
    ErrorBoundary.getDerivedStateFromError = (error) => ({
      hasError: true,
      error
    });

    ErrorBoundary.componentDidCatch = (error, errorInfo) => {
      this.logError(error, errorInfo);
    };
  }

  handleError(error, context = {}) {
    console.error('Error occurred:', error);

    // 上报错误到服务器
    this.reportError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...context
    });
  }

  reportError(errorData) {
    // 发送到错误监控服务
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(console.error);
  }

  logError(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    this.handleError(error, { componentStack: errorInfo.componentStack });
  }
}

// React 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

**问题4：如何设计前端架构？**

```javascript
// 前端架构设计示例
const architectureDesign = {
  // 1. 目录结构
  directoryStructure: `
src/
┣━━ assets/           # 静态资源      
┃   ┣━━ images/                       
┃   ┣━━ fonts/                        
┃   ┗━━ styles/                       
┣━━ components/      # 通用组件       
┃   ┣━━ common/      # 基础组件       
┃   ┣━━ layout/     # 布局组件        
┃   ┗━━ features/   # 功能组件        
┣━━ pages/           # 页面组件       
┣━━ hooks/           # 自定义 Hooks   
┣━━ services/         # API 服务      
┣━━ stores/           # 状态管理      
┣━━ utils/           # 工具函数       
┣━━ constants/       # 常量定义       
┣━━ types/           # TypeScript 类型
┗━━ App.tsx                           
  `,

  // 2. 组件设计原则
  componentDesign: `
    // 单一职责
    // 组件只做一件事

    // 开闭原则
    // 对扩展开放，对修改关闭

    // 依赖注入
    function Button({ onClick, children, variant = 'primary' }) {
      return (
        <button className={\`btn btn-\${variant}\`} onClick={onClick}>
          {children}
        </button>
      );
    }

    // 组合优于继承
    function Card({ header, children, footer }) {
      return (
        <div className="card">
          {header && <div className="card-header">{header}</div>}
          <div className="card-body">{children}</div>
          {footer && <div className="card-footer">{footer}</div>}
        </div>
      );
    }
  `,

  // 3. API 设计
  apiDesign: `
    // RESTful API
    GET    /api/users        # 获取用户列表
    GET    /api/users/:id    # 获取单个用户
    POST   /api/users        # 创建用户
    PUT    /api/users/:id    # 更新用户
    DELETE /api/users/:id    # 删除用户

    // 封装 API 服务
    class UserService {
      static async getUsers(params) {
        return api.get('/users', { params });
      }

      static async getUser(id) {
        return api.get(\`/users/\${id}\`);
      }

      static async createUser(data) {
        return api.post('/users', data);
      }

      static async updateUser(id, data) {
        return api.put(\`/users/\${id}\`, data);
      }

      static async deleteUser(id) {
        return api.delete(\`/users/\${id}\`);
      }
    }
  `
};
```

### 3.3 算法题

#### 数据结构与算法

**题目1：实现 LRU 缓存**

```javascript
// LRU (Least Recently Used) 缓存实现
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  // 获取元素
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // 将元素移到末尾（最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  // 设置元素
  put(key, value) {
    // 如果 key 已存在，删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果容量已满，删除最旧的元素（第一个）
    else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // 添加新元素
    this.cache.set(key, value);
  }

  // 获取所有元素（用于调试）
  toArray() {
    return Array.from(this.cache.entries());
  }
}

// 使用 Map 的天然有序性
class LRUCache2 {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // 先获取值，然后删除再设置，实现移动到末尾
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最旧的（第一个）
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

// 测试
const cache = new LRUCache(3);
cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);
console.log(cache.get('a')); // 1
cache.put('d', 4); // 删除 'b'
console.log(cache.get('b')); // -1
console.log(cache.get('c')); // 3
console.log(cache.get('d')); // 4
```

**题目2：实现 Trie（前缀树）**

```javascript
// Trie 树实现
class TrieNode {
  constructor() {
    this.children = new Map();  // 字符到节点的映射
    this.isEndOfWord = false;    // 是否是单词结尾
    this.frequency = 0;          // 单词出现频率（用于 autocomplete）
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.size = 0;
  }

  // 插入单词
  insert(word) {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }

    if (!node.isEndOfWord) {
      node.isEndOfWord = true;
      this.size++;
    }

    node.frequency = (node.frequency || 0) + 1;
  }

  // 搜索单词
  search(word) {
    const node = this.searchPrefix(word);
    return node !== null && node.isEndOfWord;
  }

  // 搜索前缀
  startsWith(prefix) {
    return this.searchPrefix(prefix) !== null;
  }

  // 搜索前缀（内部方法）
  searchPrefix(prefix) {
    let node = this.root;

    for (const char of prefix) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char);
    }

    return node;
  }

  // 获取以指定前缀开头的所有单词
  getWordsWithPrefix(prefix) {
    const results = [];
    const node = this.searchPrefix(prefix);

    if (!node) return results;

    this.dfs(node, prefix, results);

    return results;
  }

  // 深度优先搜索
  dfs(node, currentWord, results) {
    if (node.isEndOfWord) {
      results.push({
        word: currentWord,
        frequency: node.frequency
      });
    }

    for (const [char, childNode] of node.children) {
      this.dfs(childNode, currentWord + char, results);
    }
  }

  // 获取自动补全建议（按频率排序）
  getAutocomplete(prefix, limit = 10) {
    const words = this.getWordsWithPrefix(prefix);

    return words
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(item => item.word);
  }

  // 删除单词
  delete(word) {
    this.deleteHelper(this.root, word, 0);
  }

  deleteHelper(node, word, depth) {
    if (depth === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      this.size--;
      return node.children.size === 0;
    }

    const char = word[depth];
    const childNode = node.children.get(char);

    if (!childNode) return false;

    const shouldDeleteChild = this.deleteHelper(childNode, word, depth + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }
}

// 测试
const trie = new Trie();
trie.insert('apple');
trie.insert('app');
trie.insert('application');
trie.insert('apply');
trie.insert('apt');
trie.insert('bat');
trie.insert('ball');

console.log(trie.search('apple'));  // true
console.log(trie.search('app'));     // true
console.log(trie.search('bad'));     // false
console.log(trie.startsWith('app')); // true
console.log(trie.startsWith('bat')); // true

console.log(trie.getWordsWithPrefix('ap'));
// ['app', 'apple', 'apply', 'application']

console.log(trie.getAutocomplete('ap', 3));
// 按频率返回前3个
```

**题目3：实现二叉树遍历**

```javascript
// 二叉树节点
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// 二叉树遍历
class BinaryTreeTraversal {
  // 前序遍历：根 -> 左 -> 右
  preorder(root, result = []) {
    if (!root) return result;

    result.push(root.value);      // 访问根
    this.preorder(root.left, result);   // 遍历左子树
    this.preorder(root.right, result);  // 遍历右子树

    return result;
  }

  // 中序遍历：左 -> 根 -> 右
  inorder(root, result = []) {
    if (!root) return result;

    this.inorder(root.left, result);    // 遍历左子树
    result.push(root.value);     // 访问根
    this.inorder(root.right, result);   // 遍历右子树

    return result;
  }

  // 后序遍历：左 -> 右 -> 根
  postorder(root, result = []) {
    if (!root) return result;

    this.postorder(root.left, result);   // 遍历左子树
    this.postorder(root.right, result);  // 遍历右子树
    result.push(root.value);      // 访问根

    return result;
  }

  // 层序遍历（广度优先）
  levelOrder(root) {
    if (!root) return [];

    const result = [];
    const queue = [root];

    while (queue.length > 0) {
      const level = [];
      const levelSize = queue.length;

      for (let i = 0; i < levelSize; i++) {
        const node = queue.shift();
        level.push(node.value);

        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }

      result.push(level);
    }

    return result;
  }

  // 迭代版前序遍历
  preorderIterative(root) {
    if (!root) return [];

    const result = [];
    const stack = [root];

    while (stack.length > 0) {
      const node = stack.pop();
      result.push(node.value);

      // 右子节点先入栈，左子节点后入栈
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }

    return result;
  }

  // 迭代版中序遍历
  inorderIterative(root) {
    const result = [];
    const stack = [];
    let current = root;

    while (current || stack.length > 0) {
      // 一直向左走
      while (current) {
        stack.push(current);
        current = current.left;
      }

      // 弹出并访问
      current = stack.pop();
      result.push(current.value);

      // 转向右子树
      current = current.right;
    }

    return result;
  }

  // 计算二叉树深度
  getDepth(root) {
    if (!root) return 0;

    return 1 + Math.max(
      this.getDepth(root.left),
      this.getDepth(root.right)
    );
  }

  // 判断是否为平衡二叉树
  isBalanced(root) {
    return this.getHeight(root) !== -1;
  }

  getHeight(node) {
    if (!node) return 0;

    const leftHeight = this.getHeight(node.left);
    if (leftHeight === -1) return -1;

    const rightHeight = this.getHeight(node.right);
    if (rightHeight === -1) return -1;

    if (Math.abs(leftHeight - rightHeight) > 1) return -1;

    return Math.max(leftHeight, rightHeight) + 1;
  }

  // 二叉搜索树验证
  isValidBST(root, min = -Infinity, max = Infinity) {
    if (!root) return true;

    if (root.value <= min || root.value >= max) return false;

    return this.isValidBST(root.left, min, root.value) &&
           this.isValidBST(root.right, root.value, max);
  }

  // 寻找最近公共祖先
  lowestCommonAncestor(root, p, q) {
    if (!root || root === p || root === q) return root;

    const left = this.lowestCommonAncestor(root.left, p, q);
    const right = this.lowestCommonAncestor(root.right, p, q);

    if (left && right) return root;
    return left || right;
  }
}

// 测试
const tree = new TreeNode(1);
tree.left = new TreeNode(2);
tree.right = new TreeNode(3);
tree.left.left = new TreeNode(4);
tree.left.right = new TreeNode(5);
tree.right.left = new TreeNode(6);
tree.right.right = new TreeNode(7);

const traversal = new BinaryTreeTraversal();

console.log(traversal.preorder(tree));      // [1, 2, 4, 5, 3, 6, 7]
console.log(traversal.inorder(tree));       // [4, 2, 5, 1, 6, 3, 7]
console.log(traversal.postorder(tree));     // [4, 5, 2, 6, 7, 3, 1]
console.log(traversal.levelOrder(tree));    // [[1], [2, 3], [4, 5, 6, 7]]
console.log(traversal.getDepth(tree));     // 3
```

**题目4：排序算法实现**

```javascript
// 排序算法集合
class SortingAlgorithms {
  // 冒泡排序
  bubbleSort(arr) {
    const n = arr.length;
    const result = [...arr];

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;

      for (let j = 0; j < n - i - 1; j++) {
        if (result[j] > result[j + 1]) {
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
          swapped = true;
        }
      }

      // 如果没有交换，说明已经有序
      if (!swapped) break;
    }

    return result;
  }

  // 选择排序
  selectionSort(arr) {
    const n = arr.length;
    const result = [...arr];

    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;

      for (let j = i + 1; j < n; j++) {
        if (result[j] < result[minIndex]) {
          minIndex = j;
        }
      }

      [result[i], result[minIndex]] = [result[minIndex], result[i]];
    }

    return result;
  }

  // 插入排序
  insertionSort(arr) {
    const result = [...arr];

    for (let i = 1; i < result.length; i++) {
      let j = i;
      const temp = result[i];

      while (j > 0 && result[j - 1] > temp) {
        result[j] = result[j - 1];
        j--;
      }

      result[j] = temp;
    }

    return result;
  }

  // 归并排序
  mergeSort(arr) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid));
    const right = this.mergeSort(arr.slice(mid));

    return this.merge(left, right);
  }

  merge(left, right) {
    const result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  // 快速排序
  quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
      const pivotIndex = this.partition(arr, low, high);
      this.quickSort(arr, low, pivotIndex - 1);
      this.quickSort(arr, pivotIndex + 1, high);
    }

    return arr;
  }

  partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  // 堆排序
  heapSort(arr) {
    const result = [...arr];
    const n = result.length;

    // 构建最大堆
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(result, n, i);
    }

    // 提取元素
    for (let i = n - 1; i > 0; i--) {
      [result[0], result[i]] = [result[i], result[0]];
      this.heapify(result, i, 0);
    }

    return result;
  }

  heapify(arr, n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) {
      largest = left;
    }

    if (right < n && arr[right] > arr[largest]) {
      largest = right;
    }

    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.heapify(arr, n, largest);
    }
  }

  // 计数排序
  countingSort(arr) {
    if (arr.length === 0) return arr;

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    const result = new Array(arr.length);

    // 计数
    for (const num of arr) {
      count[num - min]++;
    }

    // 累加
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
    }

    // 排序
    for (let i = arr.length - 1; i >= 0; i--) {
      const index = arr[i] - min;
      result[--count[index]] = arr[i];
    }

    return result;
  }

  // 桶排序
  bucketSort(arr, bucketSize = 5) {
    if (arr.length === 0) return arr;

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const bucketCount = Math.floor((max - min) / bucketSize) + 1;
    const buckets = Array.from({ length: bucketCount }, () => []);

    // 分配到桶
    for (const num of buckets) {
      const index = Math.floor((num - min) / bucketSize);
      buckets[index].push(num);
    }

    // 对每个桶排序并合并
    const result = [];
    for (const bucket of buckets) {
      if (bucket.length > 0) {
        if (bucket.length > 1) {
          bucket.sort((a, b) => a - b);
        }
        result.push(...bucket);
      }
    }

    return result;
  }
}

// 测试
const sorter = new SortingAlgorithms();
const arr = [64, 34, 25, 12, 22, 11, 90];

console.log(sorter.bubbleSort(arr));      // [11, 12, 22, 25, 34, 64, 90]
console.log(sorter.selectionSort(arr));    // [11, 12, 22, 25, 34, 64, 90]
console.log(sorter.insertionSort(arr));    // [11, 12, 22, 25, 34, 64, 90]
console.log(sorter.mergeSort(arr));        // [11, 12, 22, 25, 34, 64, 90]
console.log(sorter.quickSort([...arr]));   // [11, 12, 22, 25, 34, 64, 90]
console.log(sorter.heapSort(arr));         // [11, 12, 22, 25, 34, 64, 90]
```

**题目5：动态规划问题**

```javascript
// 动态规划算法
class DynamicProgramming {
  // 斐波那契数列
  fibonacci(n) {
    if (n <= 1) return n;

    // 优化：只保存前两个值
    let prev2 = 0, prev1 = 1;

    for (let i = 2; i <= n; i++) {
      const current = prev1 + prev2;
      prev2 = prev1;
      prev1 = current;
    }

    return prev1;
  }

  // 爬楼梯
  climbStairs(n) {
    if (n <= 2) return n;

    let prev2 = 1, prev1 = 2;

    for (let i = 3; i <= n; i++) {
      const current = prev1 + prev2;
      prev2 = prev1;
      prev1 = current;
    }

    return prev1;
  }

  // 打家劫舍
  rob(nums) {
    if (!nums || nums.length === 0) return 0;
    if (nums.length === 1) return nums[0];

    // dp[i] = max(dp[i-1], dp[i-2] + nums[i])
    let prev2 = nums[0];
    let prev1 = Math.max(nums[0], nums[1]);

    for (let i = 2; i < nums.length; i++) {
      const current = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = current;
    }

    return prev1;
  }

  // 股票买卖最佳时机
  maxProfit(prices) {
    if (!prices || prices.length < 2) return 0;

    let minPrice = prices[0];
    let maxProfit = 0;

    for (let i = 1; i < prices.length; i++) {
      maxProfit = Math.max(maxProfit, prices[i] - minPrice);
      minPrice = Math.min(minPrice, prices[i]);
    }

    return maxProfit;
  }

  // 股票买卖最佳时机 II（多次交易）
  maxProfitII(prices) {
    let profit = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        profit += prices[i] - prices[i - 1];
      }
    }

    return profit;
  }

  // 最长递增子序列
  lengthOfLIS(nums) {
    if (!nums || nums.length === 0) return 0;

    const dp = new Array(nums.length).fill(1);
    let maxLen = 1;

    for (let i = 1; i < nums.length; i++) {
      for (let j = 0; j < i; j++) {
        if (nums[i] > nums[j]) {
          dp[i] = Math.max(dp[i], dp[j] + 1);
        }
      }
      maxLen = Math.max(maxLen, dp[i]);
    }

    return maxLen;
  }

  // 零钱兑换
  coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (coin <= i && dp[i - coin] !== Infinity) {
          dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
      }
    }

    return dp[amount] === Infinity ? -1 : dp[amount];
  }

  // 完全平方数
  numSquares(n) {
    const dp = new Array(n + 1).fill(Infinity);
    dp[0] = 0;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j * j <= i; j++) {
        dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
      }
    }

    return dp[n];
  }

  // 最长公共子序列
  longestCommonSubsequence(text1, text2) {
    const m = text1.length;
    const n = text2.length;
    const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (text1[i - 1] === text2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  // 编辑距离
  minDistance(word1, word2) {
    const m = word1.length;
    const n = word2.length;
    const dp = new Array(m + 1).fill(0).map((_, i) => i);

    for (let i = 1; i <= m; i++) {
      dp[0] = i;
      let prev = dp[0];

      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        if (word1[i - 1] === word2[j - 1]) {
          dp[j] = prev;
        } else {
          dp[j] = Math.min(dp[j], dp[j - 1], prev) + 1;
        }
        prev = temp;
      }
    }

    return dp[n];
  }

  // 背包问题
  knapSack(weights, values, capacity) {
    const n = weights.length;
    const dp = new Array(capacity + 1).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = capacity; j >= weights[i]; j--) {
        dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
      }
    }

    return dp[capacity];
  }

  // 不同的路径
  uniquePaths(m, n) {
    const dp = new Array(n).fill(1);

    for (let i = 1; i < m; i++) {
      for (let j = 1; j < n; j++) {
        dp[j] += dp[j - 1];
      }
    }

    return dp[n - 1];
  }

  // 不同的路径 II（有障碍物）
  uniquePathsWithObstacles(obstacleGrid) {
    const m = obstacleGrid.length;
    const n = obstacleGrid[0].length;
    const dp = new Array(n).fill(0);

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (obstacleGrid[i][j] === 1) {
          dp[j] = 0;
        } else if (i === 0 && j === 0) {
          dp[j] = 1;
        } else if (i === 0) {
          dp[j] = dp[j - 1];
        } else if (j === 0) {
          dp[j] = dp[j];
        } else {
          dp[j] = dp[j] + dp[j - 1];
        }
      }
    }

    return dp[n - 1];
  }
}

// 测试
const dp = new DynamicProgramming();

console.log(dp.fibonacci(10));        // 55
console.log(dp.climbStairs(5));        // 8
console.log(dp.rob([2, 7, 9, 3, 1])); // 12
console.log(dp.maxProfit([7, 1, 5, 3, 6, 4])); // 5
console(dp.maxProfitII([7, 1, 5, 3, 6, 4])); // 7
console.log(dp.lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // 4
console.log(dp.coinChange([1, 2, 5], 11)); // 3
console.log(dp.numSquares(12));       // 3
console.log(dp.longestCommonSubsequence('abcde', 'ace')); // 3
console.log(dp.minDistance('horse', 'ros')); // 3
console.log(dp.knapSack([2, 3, 4, 5], [3, 4, 5, 6], 8)); // 10
console.log(dp.uniquePaths(3, 7));    // 28
```

---

## 四、代码示例

### 4.1 Three.js 完整示例

```javascript
// Three.js 完整 3D 编辑器示例
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// 主应用类
class ThreeEditor {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.transformControls = null;

    // 对象管理
    this.objects = new Map();
    this.selectedObject = null;

    // 编辑器状态
    this.mode = 'translate'; // translate, rotate, scale

    // 性能统计
    this.stats = {
      fps: 0,
      frameCount: 0,
      lastTime: performance.now()
    };

    // 光照
    this.lights = {
      ambient: null,
      directional: null,
      hemisphere: null
    };

    // 辅助网格
    this.helpers = {
      grid: null,
      axes: null
    };

    // 渲染设置
    this.settings = {
      showGrid: true,
      showAxes: true,
      shadows: true,
      antialias: true,
      background: 0xf0f0f0
    };

    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createHelpers();
    this.createControls();
    this.createTransformControls();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.settings.background);
    this.scene.fog = new THREE.Fog(
      this.settings.background,
      100,
      500
    );
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.settings.antialias,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 阴影设置
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 颜色空间
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    // 环境光
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.lights.ambient);

    // 半球光
    this.lights.hemisphere = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    this.lights.hemisphere.position.set(0, 20, 0);
    this.scene.add(this.lights.hemisphere);

    // 方向光（主光源）
    this.lights.directional = new THREE.DirectionalLight(0xffffff, 1);
    this.lights.directional.position.set(50, 50, 50);
    this.lights.directional.castShadow = true;

    // 阴影设置
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;
    this.lights.directional.shadow.camera.near = 0.5;
    this.lights.directional.shadow.camera.far = 500;
    this.lights.directional.shadow.camera.left = -100;
    this.lights.directional.shadow.camera.right = 100;
    this.lights.directional.shadow.camera.top = 100;
    this.lights.directional.shadow.camera.bottom = -100;
    this.lights.directional.shadow.bias = -0.0001;

    this.scene.add(this.lights.directional);
    this.scene.add(this.lights.directional.target);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 0, -50);
    this.scene.add(fillLight);
  }

  createHelpers() {
    // 网格辅助
    this.helpers.grid = new THREE.GridHelper(100, 20, 0x888888, 0xdddddd);
    this.helpers.grid.name = 'grid';
    this.scene.add(this.helpers.grid);

    // 坐标轴辅助
    this.helpers.axes = new THREE.AxesHelper(50);
    this.helpers.axes.name = 'axes';
    this.scene.add(this.helpers.axes);
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  createTransformControls() {
    this.transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );

    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.controls.enabled = !event.value;
    });

    this.transformControls.addEventListener('objectChange', () => {
      this.emit('transformChange', this.selectedObject);
    });

    this.scene.add(this.transformControls);
  }

  setupEventListeners() {
    // 窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize());

    // 鼠标点击选择
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

    // 键盘快捷键
    window.addEventListener('keydown', (e) => this.onKeyDown(e));

    // 拖放文件
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleFileDrop(e);
    });
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    this.emit('resize', { width, height });
  }

  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const objects = Array.from(this.objects.values());
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;

      // 找到根对象
      while (object.parent && !object.userData.isRoot) {
        object = object.parent;
      }

      this.selectObject(object);
    } else {
      this.selectObject(null);
    }
  }

  onKeyDown(event) {
    switch (event.key) {
      case 't':
        this.setMode('translate');
        break;
      case 'r':
        this.setMode('rotate');
        break;
      case 's':
        if (!event.ctrlKey && !event.metaKey) {
          this.setMode('scale');
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (this.selectedObject) {
          this.deleteObject(this.selectedObject);
        }
        break;
      case 'Escape':
        this.selectObject(null);
        break;
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.transformControls.setMode(mode);
    this.emit('modeChange', mode);
  }

  selectObject(object) {
    if (this.selectedObject === object) return;

    this.selectedObject = object;

    if (object) {
      this.transformControls.attach(object);
      this.emit('select', object);
    } else {
      this.transformControls.detach();
      this.emit('deselect');
    }
  }

  async loadModel(url, options = {}) {
    const { name, position, scale, rotation } = options;

    const extension = url.split('.').pop().toLowerCase();
    let loader;
    let model;

    switch (extension) {
      case 'gltf':
      case 'glb':
        loader = new GLTFLoader();
        // 添加 Draco 解码器支持
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/');
        loader.setDRACOLoader(dracoLoader);

        const gltf = await loader.loadAsync(url);
        model = gltf.scene;
        break;

      case 'stl':
        loader = new STLLoader();
        const geometry = await loader.loadAsync(url);
        const material = new THREE.MeshStandardMaterial({
          color: 0x3498db,
          metalness: 0.3,
          roughness: 0.7
        });
        model = new THREE.Mesh(geometry, material);
        break;

      case 'obj':
        loader = new OBJLoader();
        model = await loader.loadAsync(url);
        break;

      default:
        throw new Error(`Unsupported format: ${extension}`);
    }

    // 处理模型
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 应用变换
    if (position) model.position.copy(position);
    if (scale) model.scale.copy(scale);
    if (rotation) model.rotation.copy(rotation);

    // 设置名称
    const objectName = name || `object_${this.objects.size + 1}`;
    model.name = objectName;
    model.userData.isRoot = true;

    // 添加到场景
    this.scene.add(model);
    this.objects.set(objectName, model);

    // 调整相机
    this.fitCameraToObject(model);

    this.emit('load', model);

    return model;
  }

  handleFileDrop(event) {
    const files = event.dataTransfer.files;

    for (const file of files) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const url = e.target.result;
        this.loadModel(url, { name: file.name });
      };

      reader.readAsDataURL(file);
    }
  }

  deleteObject(object) {
    if (!object) return;

    const name = object.name;

    // 从场景中移除
    this.scene.remove(object);

    // 清理几何体和材质
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    // 从管理器中删除
    this.objects.delete(name);

    // 如果选中了这个对象，取消选中
    if (this.selectedObject === object) {
      this.selectObject(null);
    }

    this.emit('delete', name);
  }

  fitCameraToObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
    cameraZ *= 1.5;

    this.camera.position.set(center.x, center.y, center.z + cameraZ);
    this.controls.target.copy(center);
    this.controls.update();
  }

  toggleGrid(visible) {
    if (this.helpers.grid) {
      this.helpers.grid.visible = visible;
    }
  }

  toggleAxes(visible) {
    if (this.helpers.axes) {
      this.helpers.axes.visible = visible;
    }
  }

  setBackground(color) {
    this.scene.background = new THREE.Color(color);
    this.settings.background = color;
  }

  enableShadows(enabled) {
    this.renderer.shadowMap.enabled = enabled;

    this.objects.forEach((object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = enabled;
          child.receiveShadow = enabled;
        }
      });
    });
  }

  // 事件系统
  events = new Map();

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.events.has(event)) return;

    this.events.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  // 动画循环
  animate() {
    requestAnimationFrame(() => this.animate());

    // 更新控制器
    this.controls.update();

    // 更新变换控制器
    if (this.transformControls) {
      this.transformControls.update();
    }

    // 渲染
    this.renderer.render(this.scene, this.camera);

    // 性能统计
    this.stats.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.stats.lastTime >= 1000) {
      this.stats.fps = this.stats.frameCount;
      this.stats.frameCount = 0;
      this.stats.lastTime = currentTime;

      this.emit('fps', this.stats.fps);
    }
  }

  // 导出场景
  exportScene() {
    return {
      objects: Array.from(this.objects.entries()).map(([name, object]) => ({
        name,
        type: object.type,
        position: object.position.toArray(),
        rotation: object.rotation.toArray(),
        scale: object.scale.toArray()
      })),
      settings: this.settings,
      camera: {
        position: this.camera.position.toArray(),
        rotation: this.camera.rotation.toArray()
      }
    };
  }

  // 销毁
  dispose() {
    // 移除所有对象
    this.objects.forEach((object) => {
      this.deleteObject(object);
    });

    // 移除控制器
    this.controls?.dispose();
    this.transformControls?.dispose();

    // 移除渲染器
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    // 清除事件
    this.events.clear();
  }
}

// 导出
export default ThreeEditor;
```

### 4.2 实时通信示例

```javascript
// 完整的 3D 打印机实时监控系统
class PrinterMonitor {
  constructor(printerId, websocketUrl) {
    this.printerId = printerId;
    this.printerData = {
      status: 'disconnected',
      temperature: {
        bed: { current: 0, target: 0 },
        extruder: { current: 0, target: 0 },
        chamber: { current: 0, target: 0 }
      },
      print: {
        progress: 0,
        currentLayer: 0,
        totalLayers: 0,
        elapsedTime: 0,
        remainingTime: 0,
        filamentUsed: 0,
        fileName: ''
      },
      webcam: {
        enabled: false,
        url: ''
      },
      job: null
    };

    this.listeners = new Map();
    this.connect(websocketUrl);
  }

  connect(url) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Connected to printer');
      this.printerData.status = 'connected';
      this.emit('status', this.printerData.status);

      // 订阅打印机
      this.send('subscribe', { printerId: this.printerId });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from printer');
      this.printerData.status = 'disconnected';
      this.emit('status', this.printerData.status);

      // 自动重连
      setTimeout(() => this.connect(url), 3000);
    };
  }

  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'printer:status':
        this.printerData.status = data.status;
        this.emit('status', data);
        break;

      case 'printer:temperature':
        this.printerData.temperature = data;
        this.emit('temperature', data);
        break;

      case 'print:progress':
        this.printerData.print = { ...this.printerData.print, ...data };
        this.emit('progress', data);
        break;

      case 'print:state':
        this.printerData.status = data.state;
        this.emit('state', data);
        break;

      case 'job:info':
        this.printerData.job = data;
        this.emit('job', data);
        break;

      case 'webcam:frame':
        this.emit('frame', data);
        break;

      case 'gcode:response':
        this.emit('gcode', data);
        break;

      case 'error':
        this.emit('error', data);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }

  // 打印机控制方法

  startPrint(gcode) {
    this.send('print:start', { gcode });
  }

  pausePrint() {
    this.send('print:pause');
  }

  resumePrint() {
    this.send('print:resume');
  }

  stopPrint() {
    this.send('print:stop');
  }

  homeAxis(axis = 'xyz') {
    this.send('printer:home', { axis });
  }

  move(axis, distance, speed = 60) {
    this.send('printer:move', { axis, distance, speed });
  }

  setTemperature(target, type = 'extruder') {
    this.send('printer:temperature', { type, target });
  }

  setBedTemperature(target) {
    this.setTemperature(target, 'bed');
  }

  extrude(amount, speed = 5) {
    this.send('printer:extrude', { amount, speed });
  }

  retract(amount, speed = 5) {
    this.send('printer:retract', { amount: -amount, speed });
  }

  fan(speed) {
    this.send('printer:fan', { speed: Math.max(0, Math.min(100, speed)) });
  }

  sendGCode(gcode) {
    this.send('gcode:send', { command: gcode });
  }

  // 摄像头控制

  enableWebcam(enabled) {
    this.send('webcam:enable', { enabled });
  }

  captureFrame() {
    this.send('webcam:capture');
  }

  // 文件操作

  listFiles(path = '/') {
    this.send('files:list', { path });
  }

  uploadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.send('files:upload', {
        name: file.name,
        content: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }

  deleteFile(filename) {
    this.send('files:delete', { filename });
  }

  printFile(filename) {
    this.send('print:file', { filename });
  }

  // 固件更新

  checkFirmware() {
    this.send('firmware:check');
  }

  updateFirmware() {
    this.send('firmware:update');
  }

  // 事件监听

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((cb) => cb(data));
  }

  // 获取状态

  getStatus() {
    return this.printerData.status;
  }

  getTemperature() {
    return this.printerData.temperature;
  }

  getPrintProgress() {
    return this.printerData.print;
  }

  // 断开连接

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const monitor = new PrinterMonitor('printer-001', 'ws://192.168.1.100:8080');

// 监听连接状态
monitor.on('status', (status) => {
  console.log('Printer status:', status);
});

// 监听温度变化
monitor.on('temperature', (temp) => {
  console.log('Bed:', temp.bed.current, '°C');
  console.log('Extruder:', temp.extruder.current, '°C');
});

// 监听打印进度
monitor.on('progress', (progress) => {
  const { progress: percent, currentLayer, totalLayers } = progress;
  console.log(`Print: ${percent.toFixed(1)}% (Layer ${currentLayer}/${totalLayers})`);
});

// 开始打印
monitor.connect();

// 等待连接后开始打印
monitor.on('status', (status) => {
  if (status === 'ready') {
    monitor.printFile('model.gcode');
  }
});
```

---

## 五、附录

### 5.1 常用命令速查

```bash
# npm/yarn 命令
npm install              # 安装依赖
npm run dev             # 开发模式运行
npm run build           # 生产构建
npm run lint            # 代码检查
npm test                # 运行测试

# Git 命令
git init                # 初始化仓库
git add .               # 暂存所有文件
git commit -m "message" # 提交
git push                # 推送到远程
git pull                # 拉取远程更新

# Docker 命令
docker build -t image .  # 构建镜像
docker run -p 80:80 image # 运行容器
docker ps               # 查看运行中的容器
docker logs container   # 查看日志
```

### 5.2 资源推荐

#### 学习资源

- Three.js 官方文档: https://threejs.org/docs/
- WebGL MDN 教程: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- React 官方文档: https://react.dev/
- TypeScript 手册: https://www.typescriptlang.org/docs/

#### 开源项目

- Three.js 示例: https://threejs.org/examples/
- React Three Fiber: https://github.com/pmndrs/react-three-fiber
- Babylon.js: https://github.com/BabylonJS/Babylon.js

#### 工具网站

- GLTF 在线查看: https://gltf.pmnd.rs/
- 模型格式转换: https://convertio.co/zh/
- 颜色选择器: https://color.adobe.com/

---

*本面试题汇总持续更新中...*

*最后更新: 2024年*
