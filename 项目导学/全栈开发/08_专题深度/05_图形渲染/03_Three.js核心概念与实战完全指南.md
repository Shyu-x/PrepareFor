# Three.js核心概念与实战完全指南

## 开篇：Three.js是什么？

想象一下，如果你要建一座房子，你有两个选择：

**选择一**：自己去烧砖、和泥、砍木头，一点一点地搭建墙壁、门窗、屋顶...这种方式就像直接使用WebGL，你需要从最底层开始处理所有细节，工作量巨大但也最灵活。

**选择二**：使用预制的建筑模块，比如"乐高积木"。这些积木已经做好了墙壁、窗户、门框，你需要做的只是按照说明书把它们拼装起来。Three.js就是WebGL世界的"乐高积木"。

Three.js是一个基于WebGL的3D图形库，它把WebGL的复杂API封装成了简单易用的类和函数。在Three.js里，你不需要理解GPU是如何工作的，不需要手写着色器代码，只需要告诉它："我要一个红色的球体，放在这个位置"——它就会帮你完成剩下的工作。

这就是Three.js最大的价值：让3D图形开发变得简单、让WebGL不再可怕！

## 一、Three.js的核心概念

### 1.1 场景（Scene）——3D世界的容器

Scene是Three.js中最基本的概念。你可以把它想象成一个"3D世界的舞台"。

在这个舞台上，你可以放置：
- 3D物体（球体、立方体、茶壶...）
- 灯光（太阳光、台灯光...）
- 摄像机（观众的眼睛）
- 雾效（远处的物体渐渐变模糊）
- 背景（天空、宇宙、海底...）

```javascript
import * as THREE from 'three';

// 创建场景
const scene = new THREE.Scene();

// 设置场景背景颜色
scene.background = new THREE.Color('#1a1a2e');

// 添加雾效（让远处的物体渐渐融入背景）
scene.fog = new THREE.Fog('#1a1a2e', 10, 100);

// 向场景中添加一个红色的球体
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);
```

### 1.2 摄像机（Camera）——观众的眼睛

摄像机决定了我们从哪个角度观察这个3D世界。Three.js提供了多种摄像机，最常用的有两种：

**透视摄像机（PerspectiveCamera）**——模拟人眼的视觉效果

透视摄像机的特点是"近大远小"，就像真实世界一样。这是最常用的摄像机类型。

```javascript
// 透视摄像机构造函数
// PerspectiveCamera(fieldOfView, aspectRatio, near, far)
// fieldOfView: 视野角度（度数），越大看到的范围越广
// aspectRatio: 宽高比，必须与画布的比例一致
// near: 近裁剪面，比这更近的物体不会被渲染
// far: 远裁剪面，比这更远的物体不会被渲染

const camera = new THREE.PerspectiveCamera(
  75,                                    // 75度视野
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                   // 近裁剪面
  1000                                   // 远裁剪面（1000单位远）
);

// 把摄像机位置移到(z:5)的地方
// 默认情况下，摄像机朝向-Z轴方向
camera.position.set(0, 0, 5);
```

让我用一个图解来解释透视摄像机：

```
透视摄像机视角：

                        近裁剪面（near）
                         /         \
                        /    远裁剪面（far）\
                       /        \        \
                      /          \        \
              视角顶端    目标点(0,0,0)  视角底端
                  \         |         /
                   \        |        /
                    \       |       /
                     \      |      /
                      \     |     /
                      摄像机位置
                       (0, 0, 5)

物体在视野范围内才会被渲染：
- 在near和far之间的物体：✓ 渲染
- 在near之前的物体：✗ 不渲染（太近了）
- 在far之后的物体：✗ 不渲染（太远了）
- 在视野角度之外的物体：✗ 不渲染
```

**正交摄像机（OrthographicCamera）**——没有透视效果

正交摄像机的特点是物体大小不会随距离变化，就像工程图纸一样。它适合用于2D UI、CAD等场景。

```javascript
// 正交摄像机构造函数
// OrthographicCamera(left, right, top, bottom, near, far)

const orthoCamera = new THREE.OrthographicCamera(
  -10,   // left：左边界
  10,    // right：右边界
  10,    // top：上边界
  -10,   // bottom：下边界
  0.1,   // near：近裁剪面
  1000   // far：远裁剪面
);

// 正交摄像机的位置和朝向不影响显示大小
// 只影响显示位置
orthoCamera.position.set(0, 0, 10);
```

### 1.3 渲染器（Renderer）——画师和画布

渲染器负责把3D场景"画"到2D画布上。Three.js提供了WebGLRenderer，这是最强大的渲染器。

```javascript
import * as THREE from 'three';

// 创建渲染器
const renderer = new THREE.WebGLRenderer({
  antialias: true,  // 开启抗锯齿，让边缘更平滑
  alpha: true,      // 允许透明背景
});

// 设置渲染器大小（通常和窗口大小一致）
renderer.setSize(window.innerWidth, window.innerHeight);

// 设置像素比（适配高清屏）
renderer.setPixelRatio(window.devicePixelRatio);

// 把渲染器的canvas添加到DOM中
document.body.appendChild(renderer.domElement);

// 创建一个红色的球体
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
const sphere = new THREE.Mesh(geometry, material);

// 创建场景
const scene = new THREE.Scene();
scene.add(sphere);

// 创建摄像机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 开始渲染循环
function animate() {
  requestAnimationFrame(animate);

  // 让球体旋转
  sphere.rotation.x += 0.01;
  sphere.rotation.y += 0.01;

  // 渲染场景（从摄像机的角度）
  renderer.render(scene, camera);
}

animate();
```

### 1.4 几何体（Geometry）——3D物体的形状

Three.js提供了很多内置的几何体，可以直接使用：

```javascript
// 立方体 (BoxGeometry)
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);

// 球体 (SphereGeometry)
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
// 参数：半径, 水平分段数, 垂直分段数
// 分段数越高，球体越平滑，但顶点数也越多

// 平面 (PlaneGeometry)
const planeGeometry = new THREE.PlaneGeometry(10, 10);
// 创建一个10x10单位的平面

// 圆环 (TorusGeometry)
const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
// 参数：圆环半径, 管子半径, 径向分段, 管子分段

// 圆柱体 (CylinderGeometry)
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 4, 32);
// 参数：顶部半径, 底部半径, 高度, 分段数

// 圆锥体 (ConeGeometry)
const coneGeometry = new THREE.ConeGeometry(1, 4, 32);
// 参数：半径, 高度, 分段数

// 十二面体 (DodecahedronGeometry)
const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);

// 环面结 (TorusKnotGeometry)
const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
```

### 1.5 材质（Material）——3D物体的外观

材质决定了物体看起来是什么样子——什么颜色、表面是光滑还是粗糙、会不会反光等等。

```javascript
// MeshBasicMaterial - 最简单的材质，不受光照影响
// 就像一个自发光的面料，无论环境光如何，都显示同样的颜色
const basicMaterial = new THREE.MeshBasicMaterial({
  color: 0xff6b6b,     // 颜色
  wireframe: false,    // 是否以线框模式显示
  transparent: true,   // 是否透明
  opacity: 0.8,        // 透明度
});

// MeshLambertMaterial - 兰伯特材质，适合漫反射表面
// 受光照影响，适合模拟纸张、布料等不光滑的表面
const lambertMaterial = new THREE.MeshLambertMaterial({
  color: 0x4ecdc4,
  emissive: 0x000000,  // 自发光颜色
});

// MeshPhongMaterial - Phong材质，适合有光泽的表面
// 可以产生高光效果，适合模拟金属、陶瓷、塑料等
const phongMaterial = new THREE.MeshPhongMaterial({
  color: 0xffe66d,
  specular: 0xffffff,  // 高光颜色
  shininess: 100,       // 光泽度，值越高高光点越小越亮
});

// MeshStandardMaterial - PBR标准材质（推荐使用）
// 基于物理的渲染，更逼真
const standardMaterial = new THREE.MeshStandardMaterial({
  color: 0x4ecdc4,
  metalness: 0.5,      // 金属度：0=非金属，1=纯金属
  roughness: 0.5,       // 粗糙度：0=镜面反射，1=完全漫反射
  emissive: 0x000000,   // 自发光
  normalScale: new THREE.Vector2(1, 1),  // 法线强度
});

// MeshPhysicalMaterial - 物理材质（高级PBR）
// 比MeshStandardMaterial更高级，支持更多特性
const physicalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x4ecdc4,
  metalness: 0.5,
  roughness: 0.5,
  clearcoat: 1.0,        // 清漆层（适合汽车漆面效果）
  clearcoatRoughness: 0.1,
  transmission: 0.0,     // 透光率（适合玻璃效果）
  thickness: 0.0,        // 厚度（与transmission配合使用）
});

// LineBasicMaterial - 线条材质
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  linewidth: 1,
  transparent: true,
  opacity: 0.8,
});

// PointsMaterial - 点材质
const pointsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,            // 点的大小
  sizeAttenuation: true,  // 是否随距离缩放
});
```

### 1.6 网格（Mesh）——几何体+材质

Mesh是Three.js中最常用的3D物体类型。它是几何体（Shape）和材质（Material）的组合。

```javascript
// 创建一个红色的金属球体
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xff6b6b,
  metalness: 0.8,
  roughness: 0.2,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

// 设置球体的位置
sphere.position.set(0, 2, 0);  // x, y, z

// 设置球体的旋转（弧度）
sphere.rotation.x = Math.PI / 4;

// 设置球体的缩放
sphere.scale.set(1, 2, 1);  // x, y, z方向分别缩放

// 将球体添加到场景
scene.add(sphere);
```

## 二、光照体系：让3D世界亮起来

### 2.1 为什么需要光照？

在现实世界中，我们能看到物体，是因为物体反射的光线进入了我们的眼睛。在3D图形学中，如果没有光照，所有物体都会是纯黑色的轮廓（除非使用MeshBasicMaterial这种自发光材质）。

Three.js提供了多种光源，来模拟现实世界中不同的光照情况。

### 2.2 光源类型

**环境光（AmbientLight）**——模拟间接光照

环境光没有方向，它从各个方向均匀地照亮所有物体。就像阴天时，云层把阳光散射到各个方向。

```javascript
// AmbientLight(color, intensity)
// color: 光源颜色
// intensity: 光照强度（0-1）

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 环境光的限制：它会让所有物体看起来"扁平"
// 因为它没有方向，所有物体受到的光照强度是一样的
// 解决办法：配合其他光源一起使用
```

**平行光（DirectionalLight）**——模拟太阳光

平行光的光线是平行的，就像太阳发出的光。无论距离多远，光线方向都是一致的。

```javascript
// DirectionalLight(color, intensity)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

// 设置光源位置
// 平行光的位置不影响光照强度，只影响照射方向
// 光线从光源位置指向坐标原点
directionalLight.position.set(5, 10, 7);

// 设置光照目标点（默认是原点）
// directionalLight.target = someObject;

// 开启阴影（会大幅增加渲染成本，谨慎使用）
directionalLight.castShadow = true;

// 设置阴影贴图大小
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
```

**点光源（PointLight）**——模拟灯泡

点光源从一个点向所有方向发射光线，就像灯泡一样。离光源越近的物体越亮。

```javascript
// PointLight(color, intensity, distance, decay)
// color: 颜色
// intensity: 强度
// distance: 照射距离（超过这个距离就不亮了）
// decay: 衰减系数（0=不衰减，2=物理正确衰减）

const pointLight = new THREE.PointLight(0xff6b6b, 1, 100, 2);

// 点光源位置
pointLight.position.set(0, 5, 0);

// 创建一个发光的灯泡效果
// 可以把一个小的球体放在点光源位置，使用MeshBasicMaterial模拟发光
const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
bulb.position.copy(pointLight.position);
scene.add(bulb);
```

**聚光灯（SpotLight）**——模拟手电筒

聚光灯有一个锥形的光束，只有在锥形范围内的物体才会被照亮。

```javascript
// SpotLight(color, intensity, distance, angle, penumbra, decay)
// angle: 锥形角度（弧度）
// penumbra: 半影（边缘模糊程度，0-1）
// decay: 衰减系数

const spotLight = new THREE.SpotLight(0xffffff, 1);

// 设置位置和目标
spotLight.position.set(0, 10, 0);
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight.target);

// 聚光灯参数
spotLight.angle = Math.PI / 6;      // 30度锥角
spotLight.penumbra = 0.5;            // 边缘模糊
spotLight.distance = 100;           // 最远照射距离
spotLight.castShadow = true;        // 开启阴影

// 让聚光灯跟随某个物体
// spotLight.target = movingObject;
```

**半球光（HemisphereLight）**——模拟天空光

半球光模拟的是从天空（上方）和地面（下方）两个方向来的光照。

```javascript
// HemisphereLight(skyColor, groundColor, intensity)
// skyColor: 天空颜色（上方光线）
// groundColor: 地面颜色（下方光线）

const hemisphereLight = new THREE.HemisphereLight(
  0x87ceeb,   // 天空蓝
  0x8b4513,   // 地面棕
  0.6         // 强度
);
scene.add(hemisphereLight);

// 天空色会影响物体朝上的面
// 地面色会影响物体朝下的面
// 中间部分会自然过渡
```

### 2.3 光照实战组合

```javascript
// 创建一个"日光"场景
function setupDaylight(scene) {
  // 1. 半球光模拟天空和地面的反射
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.3);
  scene.add(hemiLight);

  // 2. 太阳平行光
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(50, 80, 30);
  sunLight.castShadow = true;

  // 阴影配置
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -50;
  sunLight.shadow.camera.right = 50;
  sunLight.shadow.camera.top = 50;
  sunLight.shadow.camera.bottom = -50;

  scene.add(sunLight);

  // 3. 微弱的环境光填充阴影
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
}

// 创建一个"夜景"场景
function setupNightScene(scene) {
  // 1. 深蓝色的环境光
  const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.3);
  scene.add(ambientLight);

  // 2. 月光（冷色调平行光）
  const moonLight = new THREE.DirectionalLight(0x6666aa, 0.4);
  moonLight.position.set(-30, 50, -20);
  scene.add(moonLight);

  // 3. 温暖的点光源（模拟建筑灯光）
  const buildingLight = new THREE.PointLight(0xffaa55, 1, 50);
  buildingLight.position.set(10, 5, 10);
  scene.add(buildingLight);
}
```

## 三、变换：位置、旋转、缩放

### 3.1 Three.js的变换系统

在Three.js中，每个Object3D对象（包括Mesh）都有三个重要的属性来控制变换：

- **position**：位置（Vector3）
- **rotation**：旋转（Euler，通常用弧度表示）
- **scale**：缩放（Vector3）

```javascript
const mesh = new THREE.Mesh(geometry, material);

// ============ 位置 ============
// 设置位置的三种方式

// 方式1：分别设置x, y, z
mesh.position.x = 5;
mesh.position.y = 0;
mesh.position.z = 2;

// 方式2：使用set方法
mesh.position.set(5, 0, 2);

// 方式3：直接赋值Vector3
mesh.position = new THREE.Vector3(5, 0, 2);

// 相对于当前位置移动
mesh.translateX(1);  // 沿X轴移动1单位
mesh.translateY(1);  // 沿Y轴移动1单位
mesh.translateZ(1);  // 沿Z轴移动1单位

// 沿某个方向移动一定距离
mesh.translateOnAxis(new THREE.Vector3(1, 0, 0).normalize(), 5);

// 获取当前位置
console.log(mesh.position.x, mesh.position.y, mesh.position.z);
```

### 3.2 旋转

```javascript
// ============ 旋转 ============
// Three.js使用欧拉角（Euler）来表示旋转

// 旋转的三种表示方式（结果相同）
mesh.rotation.set(
  Math.PI / 2,  // X轴旋转90度
  Math.PI,      // Y轴旋转180度
  0             // Z轴不旋转
);

// 也可以分别设置
mesh.rotation.x = Math.PI / 2;
mesh.rotation.y = Math.PI;
mesh.rotation.z = 0;

// 使用角度而不是弧度
mesh.rotation.x = THREE.MathUtils.degToRad(90);  // 把90度转成弧度
```

**欧拉角的旋转顺序很重要！**

```javascript
// 默认的旋转顺序是'XYZ'
// 也就是先绕X轴旋转，再绕Y轴，最后绕Z轴

// 可以修改旋转顺序
mesh.rotation.order = 'YXZ';  // 先Y后X最后Z

// 不同旋转顺序会产生不同的结果！
```

**四元数（Quaternion）——避免万向锁**

欧拉角有一个致命问题叫"万向锁"（Gimbal Lock）。当某个特定角度时，两个旋转轴会重合，导致丢失一个自由度。四元数可以避免这个问题。

```javascript
// 创建单位四元数（不做任何旋转）
const identityQuaternion = new THREE.Quaternion();

// 创建绕X轴旋转90度的四元数
const quaternionX = new THREE.Quaternion();
quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

// 创建绕Y轴旋转90度的四元数
const quaternionY = new THREE.Quaternion();
quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

// 组合两个旋转（相当于先X后Y）
const combinedQuaternion = new THREE.Quaternion();
combinedQuaternion.multiplyQuaternions(quaternionY, quaternionX);  // 注意顺序！

// 应用四元数到mesh
mesh.quaternion.copy(combinedQuaternion);

// 四元数和Euler可以互相转换
mesh.rotation.setFromQuaternion(quaternionX);
```

### 3.3 缩放

```javascript
// ============ 缩放 ============

// 均匀缩放（三个方向相同）
mesh.scale.set(2, 2, 2);  // 放大2倍

// 非均匀缩放（可以制作"压扁"或"拉伸"的效果）
mesh.scale.set(1, 0.5, 1);  // Y轴方向压扁一半
mesh.scale.set(0.5, 2, 0.5);  // Y轴方向拉长2倍

// 使用常量
const TWO = 2;
mesh.scale.set(TWO, TWO, TWO);

// 获取当前缩放
console.log(mesh.scale.x, mesh.scale.y, mesh.scale.z);
```

### 3.4 组合变换与矩阵

```javascript
// Three.js使用4x4矩阵来存储变换
// 这个矩阵是"模型矩阵"（Model Matrix）

// 获取模型矩阵
const modelMatrix = mesh.matrixWorld;  // 或 mesh.matrix

// 从矩阵中提取位置、旋转、缩放
const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();

matrix.decompose(position, quaternion, scale);
// rotation 可以从 quaternion 转换
rotation.setFromQuaternion(quaternion);

// 直接设置矩阵
const customMatrix = new THREE.Matrix4();
customMatrix.makeRotationY(Math.PI / 2);
customMatrix.setPosition(10, 0, 5);
mesh.matrix.copy(customMatrix);

// 告诉Three.js矩阵已经手动更新（否则会自动重新计算）
mesh.matrixAutoUpdate = false;
```

## 四、纹理与加载器

### 4.1 纹理基础

纹理就是贴在3D物体表面的"皮肤"。Three.js支持多种纹理类型：

```javascript
// 创建一张图片纹理
const textureLoader = new THREE.TextureLoader();

// 加载图片作为纹理
const diffuseMap = textureLoader.load('/textures/diffuse.jpg');

// 设置纹理参数
diffuseMap.wrapS = THREE.RepeatWrapping;  // 水平方向重复
diffuseMap.wrapT = THREE.RepeatWrapping;  // 垂直方向重复
diffuseMap.repeat.set(2, 2);  // 水平和垂直方向各重复2次

// 设置纹理过滤
diffuseMap.minFilter = THREE.LinearMipmapLinearFilter;  // 缩小时模糊
diffuseMap.magFilter = THREE.LinearFilter;  // 放大时清晰

// 设置各向异性（让倾斜的表面看起来更清晰）
if (textureLoader && textureLoader.anisotropy) {
  diffuseMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

// 使用纹理创建材质
const material = new THREE.MeshStandardMaterial({
  map: diffuseMap,  // 漫反射贴图
});
```

### 4.2 常用纹理类型

```javascript
// 1. 颜色贴图/漫反射贴图（Diffuse Map）
// 决定物体的基础颜色
const diffuseMap = textureLoader.load('/textures/diffuse.jpg');
const diffuseMaterial = new THREE.MeshStandardMaterial({
  map: diffuseMap,
});

// 2. 法线贴图（Normal Map）
// 存储表面的微小凹凸信息，让低多边形模型看起来有细节
const normalMap = textureLoader.load('/textures/normal.jpg');
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;
const normalMaterial = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  normalMap: normalMap,
  normalScale: new THREE.Vector2(1, 1),  // 法线强度
});

// 3. 高光贴图（Specular Map）
// 决定哪些部分反光、哪些部分不反光
const specularMap = textureLoader.load('/textures/specular.jpg');
const specularMaterial = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  specularMap: specularMap,
  specular: new THREE.Color(0xffffff),  // 高光颜色
  shininess: 100,                      // 光泽度
});

// 4. 粗糙度贴图（Roughness Map）
// 配合PBR材质使用
const roughnessMap = textureLoader.load('/textures/roughness.jpg');
const pbrMaterial = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  roughnessMap: roughnessMap,
  roughness: 0.5,  // 基础粗糙度
  metalness: 0.5,  // 金属度
});

// 5. 环境光遮蔽贴图（AO Map）
// 模拟缝隙和角落的阴影
const aoMap = textureLoader.load('/textures/ao.jpg');
const aoMaterial = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  aoMap: aoMap,
  aoMapIntensity: 1,
});
```

### 4.3 使用加载管理器

当需要加载很多纹理时，使用LoadingManager可以更好地管理加载进度：

```javascript
// 创建加载管理器
const loadingManager = new THREE.LoadingManager();

// 设置加载进度回调
loadingManager.onProgress = (url, loaded, total) => {
  const percent = (loaded / total * 100).toFixed(0);
  console.log(`加载中: ${percent}% - ${url}`);
};

// 设置加载完成回调
loadingManager.onLoad = () => {
  console.log('所有资源加载完成！');
  // 初始化场景
  initScene();
};

// 设置错误回调
loadingManager.onError = (url) => {
  console.error(`加载失败: ${url}`);
};

// 使用加载管理器创建纹理加载器
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new THREE.GLTFLoader(loadingManager);
```

### 4.4 模型加载（GLTFLoader）

GLTF是目前最流行的3D模型格式，Three.js提供了GLTFLoader来加载这类模型：

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 创建加载器
const gltfLoader = new GLTFLoader();

// 加载模型
gltfLoader.load(
  '/models/robot.glb',  // 模型路径（.glb是二进制格式，.gltf是文本格式）
  (gltf) => {
    // 加载成功
    const model = gltf.scene;

    // 设置模型的尺寸（如果模型太大或太小）
    model.scale.set(0.5, 0.5, 0.5);

    // 设置位置
    model.position.set(0, 0, 0);

    // 添加到场景
    scene.add(model);

    // 遍历模型的所有子对象
    model.traverse((child) => {
      if (child.isMesh) {
        // 对每个网格进行一些处理
        child.material.flatShading = false;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 打印模型结构（调试用）
    console.log('模型加载完成:', model);
    console.log('动画列表:', gltf.animations);  // 如果有动画的话
  },
  (progress) => {
    // 加载进度
    const percent = (progress.loaded / progress.total * 100).toFixed(0);
    console.log(`模型加载进度: ${percent}%`);
  },
  (error) => {
    // 加载失败
    console.error('模型加载失败:', error);
  }
);
```

### 4.5 HDR环境贴图

现代3D渲染常用HDR（High Dynamic Range）环境贴图来提供真实的光照和反射：

```javascript
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// 加载HDR环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  '/textures/environment.hdr',
  (texture) => {
    // 设置纹理格式（HDR需要特殊处理）
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // 设置场景背景和环境贴图
    scene.background = texture;
    scene.environment = texture;

    // 应用到所有材质
    // 或者手动应用到特定材质
    material.envMap = texture;
    material.needsUpdate = true;
  }
);
```

## 五、Three.js在WebEnv-OS项目中的实战应用

### 5.1 3D桌面环境背景

WebEnv-OS项目使用Three.js来渲染动态的3D桌面背景：

```typescript
// WebEnv-OS项目中的3D背景组件
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface BackgroundConfig {
  type: 'particles' | 'waves' | 'grid';
  color: string;
  density: number;
}

class WebEnv3DBackground {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points | null = null;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement, config: BackgroundConfig) {
    // 1. 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.color);

    // 2. 创建摄像机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    // 3. 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. 初始化时钟
    this.clock = new THREE.Clock();

    // 5. 根据配置创建不同类型的背景
    switch (config.type) {
      case 'particles':
        this.createParticlesBackground(config.density);
        break;
      case 'waves':
        this.createWavesBackground();
        break;
      case 'grid':
        this.createGridBackground();
        break;
    }

    // 6. 绑定窗口大小变化事件
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 7. 开始动画循环
    this.animate();
  }

  private createParticlesBackground(density: number) {
    // 创建粒子几何体
    const particleCount = density * 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // 随机分布粒子位置和颜色
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // 位置：在-50到50的立方体内随机分布
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      // 颜色：蓝色到紫色的渐变
      const t = Math.random();
      colors[i3] = 0.1 + t * 0.2;     // R
      colors[i3 + 1] = 0.2 + t * 0.3; // G
      colors[i3 + 2] = 0.5 + t * 0.5; // B

      // 大小：随机大小
      sizes[i] = Math.random() * 2 + 0.5;
    }

    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建着色器材质（实现自定义的粒子效果）
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;

          vec4 modelPosition = modelMatrix * vec4(position, 1.0);

          // 让粒子缓慢旋转
          float angle = uTime * 0.1;
          modelPosition.x *= cos(angle) * 0.5 + 0.5;
          modelPosition.y *= sin(angle) * 0.5 + 0.5;

          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;

          // 根据距离调整粒子大小
          gl_PointSize = size * uPixelRatio * (20.0 / -viewPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          // 创建圆形粒子
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;

          // 边缘渐变效果
          float alpha = 1.0 - distance * 2.0;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,  // 加法混合，让粒子发光
    });

    // 创建粒子系统
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createWavesBackground() {
    // 创建一个平面几何体，用作波浪效果
    const geometry = new THREE.PlaneGeometry(100, 100, 200, 200);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#667eea') },
        uColorB: { value: new THREE.Color('#764ba2') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vUv = uv;

          vec3 newPosition = position;

          // 创建波浪效果
          float wave1 = sin(newPosition.x * 0.5 + uTime) * 2.0;
          float wave2 = sin(newPosition.y * 0.3 + uTime * 0.8) * 1.5;
          newPosition.z = wave1 + wave2;

          vElevation = newPosition.z;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          // 根据高度混合颜色
          float mixStrength = (vElevation + 3.0) / 6.0;
          vec3 color = mix(uColorA, uColorB, mixStrength);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -10;
    this.scene.add(mesh);
  }

  private createGridBackground() {
    // 创建网格辅助线
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(20);
    this.scene.add(axesHelper);

    // 添加渐变地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: new THREE.Color('#1a1a2e') },
        uColorB: { value: new THREE.Color('#16213e') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;

        void main() {
          float dist = distance(vUv, vec2(0.5));
          vec3 color = mix(uColorA, uColorB, dist * 2.0);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);
  }

  private onWindowResize() {
    // 更新摄像机
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // 更新渲染器
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = this.clock.getElapsedTime();

    // 更新着色器uniform
    if (this.particles) {
      const material = this.particles.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = elapsedTime;
    }

    // 让粒子缓慢旋转
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.05;
    }

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  // 公开方法供外部控制
  public setParticlesVisible(visible: boolean) {
    if (this.particles) {
      this.particles.visible = visible;
    }
  }

  public dispose() {
    // 清理资源
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

export default WebEnv3DBackground;
```

### 5.2 3D桌面图标交互

```typescript
// WebEnv-OS项目中的3D桌面图标组件
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

interface IconConfig {
  title: string;
  iconPath?: string;
  color: string;
  position: THREE.Vector3;
}

class DesktopIcon3D {
  private group: THREE.Group;
  private iconMesh: THREE.Mesh;
  private labelMesh: THREE.Mesh | null = null;
  private isHovered: boolean = false;
  private isSelected: boolean = false;

  constructor(config: IconConfig) {
    // 创建组（用于整体变换）
    this.group = new THREE.Group();
    this.group.position.copy(config.position);

    // 创建图标几何体（使用圆角矩形）
    const iconGeometry = this.createRoundedRectGeometry(1.2, 1.2, 0.1);
    const iconMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: 0.3,
      roughness: 0.7,
    });

    this.iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
    this.iconMesh.castShadow = true;
    this.iconMesh.receiveShadow = true;
    this.group.add(this.iconMesh);

    // 如果有图标路径，加载图标纹理
    if (config.iconPath) {
      this.loadIconTexture(config.iconPath);
    }

    // 创建文字标签
    this.createLabel(config.title);

    // 创建边框效果（用于选中状态）
    this.createSelectionBorder();
  }

  private createRoundedRectGeometry(
    width: number,
    height: number,
    radius: number
  ): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();

    // 绘制圆角矩形路径
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    // 拉伸为3D几何体
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  private loadIconTexture(path: string) {
    const loader = new THREE.TextureLoader();
    loader.load(
      path,
      (texture) => {
        // 创建图标纹理平面
        const iconPlaneGeometry = new THREE.PlaneGeometry(1, 1);
        const iconMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });

        const iconPlane = new THREE.Mesh(iconPlaneGeometry, iconMaterial);
        iconPlane.position.z = 0.04;  // 放在底座上方
        this.group.add(iconPlane);
      },
      undefined,
      (error) => {
        console.error('图标纹理加载失败:', error);
      }
    );
  }

  private createLabel(title: string) {
    const loader = new THREE.FontLoader();

    // 加载字体（使用Three.js自带的JSON字体）
    loader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (font) => {
        const textGeometry = new TextGeometry(title, {
          font: font,
          size: 0.15,
          height: 0.02,
          curveSegments: 4,
          bevelEnabled: false,
        });

        // 居中对齐
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });

        this.labelMesh = new THREE.Mesh(textGeometry, textMaterial);
        this.labelMesh.position.set(0, -0.9, 0.05);
        this.group.add(this.labelMesh);
      },
      undefined,
      (error) => {
        console.error('字体加载失败:', error);
      }
    );
  }

  private createSelectionBorder() {
    // 创建选择框几何体
    const borderGeometry = this.createRoundedRectGeometry(1.4, 1.4, 0.1);
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });

    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.z = -0.02;
    border.name = 'selectionBorder';
    this.group.add(border);
  }

  // 处理悬停效果
  public setHovered(hovered: boolean) {
    this.isHovered = hovered;

    // 缩放动画
    const targetScale = hovered ? 1.1 : 1;
    this.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // 向上移动
    const targetY = this.group.position.y + (hovered ? 0.2 : 0);
    if (hovered) {
      this.group.position.y += 0.2;
    } else {
      this.group.position.y -= 0.2;
    }
  }

  // 处理选中效果
  public setSelected(selected: boolean) {
    this.isSelected = selected;

    const border = this.group.getObjectByName('selectionBorder') as THREE.Mesh;
    if (border) {
      const material = border.material as THREE.MeshBasicMaterial;
      material.opacity = selected ? 1 : 0;
    }
  }

  // 获取Three.js组
  public getGroup(): THREE.Group {
    return this.group;
  }

  // 射线检测（判断鼠标是否在图标上）
  public raycast(raycaster: THREE.Raycaster): THREE.Intersection | null {
    const intersects = raycaster.intersectObject(this.iconMesh, true);
    if (intersects.length > 0) {
      return intersects[0];
    }
    return null;
  }
}

export default DesktopIcon3D;
```

## 六、性能优化建议

### 6.1 几何体优化

```javascript
// 1. 合并静态几何体（减少draw call）
const mergedGeometry = new THREE.BufferGeometry();
THREE.BufferGeometryUtils.mergeBufferGeometries([geometry1, geometry2, geometry3]);

// 2. 使用适当的分段数
// 球体：8-16分段足够表示圆滑的球体
const lowQualitySphere = new THREE.SphereGeometry(1, 8, 8);
const highQualitySphere = new THREE.SphereGeometry(1, 32, 32);

// 3. 使用实例化渲染绘制大量相同物体
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);
for (let i = 0; i < 1000; i++) {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(Math.random() * 100, Math.random() * 100, Math.random() * 100);
  instancedMesh.setMatrixAt(i, matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
```

### 6.2 材质优化

```javascript
// 1. 共享材质（减少材质切换）
const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
mesh1.material = sharedMaterial;
mesh2.material = sharedMaterial;

// 2. 使用MeshLambertMaterial代替MeshPhongMaterial（性能更好）
// 除非需要高光效果

// 3. 避免在材质中使用透明度（会增加渲染成本）
// 如果必须使用，设置 transparent: true 和 opacity: 0.99 而不是 1.0
material.transparent = true;
material.opacity = 0.99;  // 技巧：比1.0更快

// 4. 使用.dispose()及时释放材质和几何体
geometry.dispose();
material.dispose();
texture.dispose();
```

### 6.3 渲染优化

```javascript
// 1. 使用合理的像素比（不要超过设备像素比）
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. 开启多采样抗锯齿（MSAA）但注意性能
renderer = new THREE.WebGLRenderer({ antialias: true, samples: 4 });

// 3. 使用色调映射代替曝光
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 4. 减少阴影计算成本
directionalLight.shadow.mapSize.width = 1024;  // 不要用太大的阴影贴图
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

// 5. 使用FrustumCulling（视锥体裁剪，默认开启）
// 不要手动禁用它，除非你知道自己在做什么
mesh.frustumCulled = true;  // 默认值
```

### 6.4 着色器优化

```glsl
// 1. 避免在着色器中进行分支（if语句）
// 改用step、mix等函数

// 不推荐：
if (useTexture) {
  color = textureColor;
} else {
  color = solidColor;
}

// 推荐：使用mix代替if
color = mix(solidColor, textureColor, float(useTexture));

// 2. 预计算uniform值
// 避免在着色器中计算sin/cos等昂贵运算

// 3. 使用lowp/mediump精度（移动端性能优化）
// 顶点着色器通常使用highp
// 片段着色器在移动端使用mediump
precision mediump float;

// 4. 避免在片段着色器中进行矩阵运算
// 尽量在顶点着色器中进行变换
```

## 七、常见问题与解决方案

### 7.1 为什么我的3D物体不显示？

```javascript
// 检查清单：
// 1. 是否把物体添加到了场景？
scene.add(mesh);

// 2. 摄像机是否在正确的位置？
camera.position.z = 5;  // 如果物体在原点，摄像机不能在原点

// 3. 物体是否在视野范围内？
// 检查near和far设置
camera.near = 0.1;
camera.far = 1000;

// 4. 是否开启了光照？
// MeshBasicMaterial不需要光照
// MeshStandardMaterial等需要光照
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// 5. 是否正确设置了材质？
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
```

### 7.2 纹理加载后显示黑色？

```javascript
// 原因可能是：
// 1. 路径问题（404错误）
// 检查纹理路径是否正确

// 2. 跨域问题
texture.crossOrigin = 'anonymous';
textureLoader.setCrossOrigin('anonymous');

// 3. 纹理还没有加载完成就开始渲染
// 使用LoadingManager确保纹理加载完成后再渲染
```

### 7.3 性能问题（卡顿）

```javascript
// 优化建议：
// 1. 减少几何体顶点数
// 2. 减少draw call（合并几何体、使用实例化）
// 3. 减少阴影计算
// 4. 使用合适的多线程方案（如Web Worker）
// 5. 限制同时渲染的物体数量
// 6. 使用LOD（Level of Detail）技术
```

## 八、总结

好了，关于Three.js的介绍就到这里。让我来总结一下今天学到的核心内容：

1. **Scene是舞台，Camera是观众的眼睛，Renderer是画师**——这三个是Three.js的基本组件。

2. **Mesh = Geometry + Material**——3D物体由形状和外观组成。

3. **光照体系**：环境光提供基础照明，平行光模拟太阳，点光源模拟灯泡，聚光灯模拟手电筒。

4. **变换**：通过position、rotation、scale来控制3D物体的位置、旋转和缩放。

5. **纹理**：可以把图片贴在3D物体表面，实现丰富的视觉效果。

6. **加载器**：TextureLoader加载纹理，GLTFLoader加载3D模型。

7. **性能优化**：合并几何体、共享材质、合理使用阴影。

Three.js是一个功能非常强大的库，这篇文章只能覆盖最核心的内容。想要真正掌握Three.js，你需要：

1. 多看官方 examples（https://threejs.org/examples/）
2. 阅读Three.js源码
3. 多做项目练习
4. 学习图形学理论知识

下一篇文章《React Three Fiber与3D性能优化》会介绍如何在React中使用Three.js，以及如何优化3D应用的性能。

祝你在3D世界里玩得开心！
