# React Three Fiber与3D性能优化

## 开篇：为什么需要React Three Fiber？

好了，各位React开发者们！如果你之前学习完了Three.js，可能会觉得3D开发挺有意思的。但是，当你想把Three.js集成到一个React项目里时，你会发现有一些"水土不服"的问题：

**问题一：生命周期不同步**
React有自己的生命周期（组件挂载、更新、卸载），Three.js也有自己的渲染循环。这两个东西搅在一起，就像两个不同步的节拍器，你需要费很大力气才能让它们协调工作。

**问题二：状态管理麻烦**
Three.js的对象是命令式的，而React是声明式的。你需要在React组件里手动调用Three.js的方法来更新场景，这违反了React的设计哲学。

**问题三：内存泄漏**
React组件频繁创建和销毁，而Three.js的对象（几何体、材质、纹理）需要手动管理内存。一不小心就会导致内存泄漏，让你的浏览器越来越卡。

React Three Fiber（简称R3F）就是来解决这些问题的！它把Three.js封装成了React组件，让你可以用声明式的方式来开发3D应用。

你可以这样理解：
- Three.js就像是一套没有包装的乐高积木
- React Three Fiber就像是把乐高积木装进了一个个密封的盒子里，每个盒子都有编号，你可以随时拆开或组装

## 一、React Three Fiber基础

### 1.1 安装和配置

```bash
# 安装React Three Fiber核心包
npm install @react-three/fiber

# 安装Three.js（Peer Dependency）
npm install three

# 安装Drei库（React Three Fiber的辅助工具库）
npm install @react-three/drei

# 安装Three.js的类型定义
npm install -D @types/three
```

### 1.2 第一个R3F组件

```tsx
// 最简单的R3F应用
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// 一个简单的3D场景
function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}  // 设置摄像机
      style={{ width: '100vw', height: '100vh' }}  // 设置画布大小
    >
      {/* 场景内容 */}
      <Scene />
    </Canvas>
  );
}

// 场景组件
function Scene() {
  return (
    <>
      {/* 添加光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      {/* 添加一个旋转的红色球体 */}
      <RotatingSphere />
    </>
  );
}

// 旋转的球体组件
function RotatingSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  // useFrame是R3F提供的Hook，用于在每一帧更新
  // 它在Three.js的渲染循环中被调用
  useFrame((state, delta) => {
    if (meshRef.current) {
      // 让球体旋转
      meshRef.current.rotation.x += delta;  // delta是两帧之间的时间间隔
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* 球体几何体 */}
      <sphereGeometry args={[1, 32, 32]} />
      {/* 红色材质 */}
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

### 1.3 R3F的核心概念

**Canvas组件**

Canvas是R3F的入口，它创建了一个Three.js渲染器并管理着整个3D场景。

```tsx
// Canvas的常用props
<Canvas
  // 摄像机配置
  camera={{
    position: [0, 0, 5],
    fov: 75,
    near: 0.1,
    far: 1000,
  }}

  // 画布样式
  style={{ background: '#1a1a2e' }}

  // 是否开启抗锯齿
  gl={{ antialias: true }}

  // 设置像素比
  dpr={[1, 2]}  // 限制在1-2之间，避免高清屏过度消耗性能

  // 阴影配置
  shadows

  // 色调映射
  toneMapped

  // 颜色空间
  colorSpace={THREE.SRGBColorSpace}

  // 当Canvas被创建时调用
  onCreated={({ gl, scene, camera }) => {
    console.log('Canvas创建完成');
  }}
>
  {/* 场景内容 */}
</Canvas>
```

**声明式 vs 命令式**

这是R3F最重要的概念。让我对比一下：

```tsx
// ❌ 使用Three.js原生API（命令式）
function ThreeJSSphere() {
  useEffect(() => {
    // 创建几何体
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
    const mesh = new THREE.Mesh(geometry, material);

    // 添加到场景
    scene.add(mesh);

    // 清理函数
    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return null;  // 没有React渲染内容
}

// ✅ 使用R3F（声明式）
function R3FSphere() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

声明式的好处是：
1. 代码更简洁、更易读
2. React自动管理生命周期和清理
3. 组件可以被复用和组合
4. 状态变化自动触发重新渲染

### 1.4 内置组件

R3F提供了一系列内置组件，它们实际上就是Three.js对象的React封装：

```tsx
// 几何体组件
<boxGeometry args={[2, 2, 2]} />
<sphereGeometry args={[1, 32, 32]} />
<planeGeometry args={[10, 10]} />
<torusGeometry args={[1, 0.4, 16, 100]} />

// 材质组件
<meshBasicMaterial color="#ff6b6b" />
<meshStandardMaterial
  color="#4ecdc4"
  metalness={0.5}
  roughness={0.5}
/>
<meshPhongMaterial
  color="#ffe66d"
  specular="#ffffff"
  shininess={100}
/>

// 光源组件
<ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 10]} intensity={1} />
<pointLight position={[0, 5, 0]} intensity={1} color="#ff6b6b" />
<spotLight position={[0, 10, 0]} angle={0.3} penumbra={0.5} />
<hemisphereLight args={['#87ceeb', '#8b4513', 0.6]} />

// 其他常用组件
<group position={[1, 2, 3]}>  {/* 分组 */}
  <mesh />
  <mesh />
</group>

<primitive object={someThreeObject} />  {/* 渲染任意Three.js对象 */}
<primitive object={gltf.scene} />

<instancedMesh args={[geometry, material, 100]} />  {/* 实例化渲染 */}
```

### 1.5 Props传递

R3F的组件通过props来配置Three.js对象的属性。有几种方式：

```tsx
// 方式1：直接传递props（驼峰命名）
<mesh position={[1, 2, 3]} rotation={[0, Math.PI, 0]} scale={2}>
  <sphereGeometry args={[1, 32, 32]} />
  <meshStandardMaterial color="#ff6b6b" />
</mesh>

// 方式2：使用.attach()绑定到特定属性
<mesh>
  <object3D
    position={[1, 2, 3]}
    onUpdate={(self) => {
      // 自定义更新逻辑
      self.lookAt(0, 0, 0);
    }}
  />
</mesh>

// 方式3：使用ref直接访问Three.js对象
function MyMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      console.log('mesh的position:', meshRef.current.position);
    }
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

## 二、Hooks详解

### 2.1 useFrame

useFrame是最常用的Hook，它在Three.js的渲染循环中被调用。

```tsx
import { useFrame } from '@react-three/fiber';

// 基本用法
function RotatingCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    // state: 包含当前场景的各种信息
    // delta: 两帧之间的时间间隔（秒）

    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}

// 访问摄像机
function FollowCamera() {
  useFrame((state) => {
    // state.camera 是当前的摄像机
    state.camera.position.x += 0.01;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

// 访问场景
function PulseEffect() {
  useFrame((state) => {
    // state.scene 是当前场景
    // 可以用来动态添加/删除对象
  });

  return null;
}

// 使用useThree获取全局状态
function GlobalStateExample() {
  const { camera, gl, scene, size } = useThree();

  useFrame(() => {
    console.log('窗口大小:', size.width, size.height);
  });

  return null;
}

// 条件渲染：使用useState控制是否渲染
function ConditionalMesh({ show }) {
  if (!show) return null;

  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

### 2.2 useThree

useThree让你可以访问Canvas的全局状态：

```tsx
import { useThree, useFrame } from '@react-three/fiber';

function DebugCamera() {
  const { camera, gl, scene, size, clock, viewport } = useThree();

  useFrame(() => {
    // camera: 当前摄像机
    // gl: WebGL渲染器
    // scene: 当前场景
    // size: { width, height } 窗口像素尺寸
    // clock: THREE.Clock实例
    // viewport: { width, height } viewport尺寸（考虑dpr）
  });

  return null;
}

// 实际应用：射线检测
function ClickableObject({ onClick }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer } = useThree();

  useFrame(() => {
    // 更新射线
    raycaster.setFromCamera(pointer, camera);

    if (meshRef.current) {
      const intersects = raycaster.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        // 鼠标悬停在这个物体上
      }
    }
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

### 2.3 useLoader

useLoader提供了加载外部资源的声明式方式：

```tsx
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';

// 加载纹理
function TexturedMesh() {
  const texture = useLoader(TextureLoader, '/textures/wood.jpg');

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// 加载GLTF模型
function Model({ url }) {
  const gltf = useLoader(GLTFLoader, url);

  // gltf.scene 是模型根节点
  // gltf.animations 是动画数组
  // gltf.cameras 是相机数组
  // gltf.scenes 是场景数组
  // gltf.asset 是asset信息

  return <primitive object={gltf.scene} />;
}

// 预加载多个资源
function PreloadedScene() {
  const [texture1, texture2, texture3] = useLoader(TextureLoader, [
    '/textures/wood.jpg',
    '/textures/metal.jpg',
    '/textures/grass.jpg',
  ]);

  return (
    <>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={texture1} />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={texture2} />
      </mesh>
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={texture3} />
      </mesh>
    </>
  );
}

// 使用Suspense处理加载状态
function LoadingModel() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Model url="/models/robot.glb" />
    </Suspense>
  );
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  );
}
```

### 2.4 useUpdate（已废弃）

在较新版本的R3F中，useUpdate已被移除。如果需要手动更新Three.js对象的属性，请使用useRef配合useFrame。

## 三、组件化设计模式

### 3.1 组件复合模式

R3F支持类似React DOM的组件嵌套，这让你可以设计出可复用的组件：

```tsx
// 可配置的灯组件
function Lights({ color = '#ffffff', intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={intensity * 0.5} />
      <directionalLight color={color} intensity={intensity} position={[10, 10, 5]} />
      <pointLight color={color} intensity={intensity} position={[-10, 5, -5]} />
    </>
  );
}

// 使用
<Lights color="#ff6b6b" intensity={1.5} />

// 可配置的材质组件
function StandardMaterial({ color, metalness = 0.5, roughness = 0.5, ...props }) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
      {...props}
    />
  );
}

// 材质预设为可复用组件
const RedPlasticMaterial = () => (
  <StandardMaterial color="#ff0000" metalness={0.1} roughness={0.6} />
);

const BlueMetalMaterial = () => (
  <StandardMaterial color="#0066ff" metalness={0.9} roughness={0.2} />
);

// 使用
<mesh>
  <sphereGeometry args={[1, 32, 32]} />
  <RedPlasticMaterial />
</mesh>
```

### 3.2 状态管理模式

在R3F中，状态管理有几种常用方式：

**方式1：React状态**

```tsx
function InteractiveMesh() {
  const [color, setColor] = useState('#ff6b6b');
  const [position, setPosition] = useState([0, 0, 0]);

  return (
    <mesh
      position={position}
      onClick={() => {
        setColor('#' + Math.floor(Math.random() * 16777215).toString(16));
      }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

**方式2：Zustand Store（推荐）**

```tsx
import { create } from 'zustand';

// 创建全局状态store
const useStore = create((set) => ({
  // 状态
  selectedObject: null,
  objects: [],
  cameraPosition: [0, 5, 10],

  // actions
  setSelectedObject: (object) => set({ selectedObject: object }),
  addObject: (object) => set((state) => ({
    objects: [...state.objects, object]
  })),
  updateCameraPosition: (position) => set({ cameraPosition: position }),
}));

// 在组件中使用
function MeshComponent() {
  const { selectedObject, setSelectedObject } = useStore();

  return (
    <mesh
      onClick={() => setSelectedObject('mesh1')}
      material={selectedObject === 'mesh1' ? 'blue' : 'red'}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={selectedObject === 'mesh1' ? 'blue' : 'red'} />
    </mesh>
  );
}
```

**方式3：Context**

```tsx
import { createContext, useContext } from 'react';

// 创建Context
const SceneContext = createContext(null);

// Provider组件
function SceneProvider({ children }) {
  const [sceneState, setSceneState] = useState({ initialized: false });

  return (
    <SceneContext.Provider value={{ sceneState, setSceneState }}>
      {children}
    </SceneContext.Provider>
  );
}

// 使用Context
function SceneInitializer() {
  const { setSceneState } = useContext(SceneContext);

  useEffect(() => {
    setSceneState({ initialized: true });
  }, []);

  return null;
}
```

### 3.3 性能优化组件模式

**渲染控制**

```tsx
// 使用memo减少不必要的重渲染
const ExpensiveMesh = memo(({ position, geometry }) => {
  return (
    <mesh position={position}>
      <primitive object={geometry} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
});

// 使用shouldComponentUpdate精细控制
function OptimizedMesh({ position, color }) {
  const meshRef = useRef();

  // 只有当position或color实际改变时才更新
  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      (meshRef.current.material as THREE.MeshStandardMaterial).color.set(color);
    }
  }, [position, color]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}
```

**条件渲染**

```tsx
// 使用null进行条件渲染
function ConditionalMesh({ shouldRender }) {
  if (!shouldRender) return null;

  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}

// 使用groups组织条件渲染
function OrganizedScene({ showAdvanced }) {
  return (
    <>
      {/* 基础场景 - 始终渲染 */}
      <BasicScene />

      {/* 高级场景 - 条件渲染 */}
      {showAdvanced && <AdvancedScene />}
    </>
  );
}
```

## 四、性能优化深入

### 4.1 渲染管线性能瓶颈分析

在R3F应用中，主要的性能瓶颈有以下几个：

```
性能瓶颈分析：

1. React渲染阶段
   - 组件数量过多
   - 状态更新导致不必要的重渲染
   - Props传递造成子组件重渲染

2. R3F协调阶段
   - 组件变化导致Three.js对象频繁创建/销毁
   - props同步成本

3. Three.js渲染阶段
   - 几何体/材质过多
   - 纹理尺寸过大
   - 阴影计算量大
   - draw call过多

4. 内存问题
   - 几何体/材质/纹理未正确释放
   - 事件监听器未清理
   - WebGL上下文丢失
```

### 4.2 React层面的优化

**使用React.memo**

```tsx
import { memo, useMemo } from 'react';

// 使用memo包装组件，避免不必要的重渲染
const StaticMesh = memo(({ position }) => {
  // 这个组件只有在position改变时才会重新渲染
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
});

// 大量静态物体使用InstancedMesh
function InstancedMesh({ count = 1000 }) {
  const mesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
    return new THREE.InstancedMesh(geometry, material, count);
  }, [count]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    // 更新所有实例的位置
    for (let i = 0; i < count; i++) {
      const x = Math.sin(state.clock.elapsedTime + i * 0.1) * 5;
      const y = Math.cos(state.clock.elapsedTime + i * 0.1) * 5;
      tempObject.position.set(x, y, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
```

**Props优化**

```tsx
// 使用useMemo避免每次创建新对象
function OptimizedScene() {
  const position = useMemo(() => [1, 2, 3], []);
  const rotation = useMemo(() => [0, Math.PI, 0], []);
  const color = useMemo(() => '#ff6b6b', []);

  return (
    <mesh position={position} rotation={rotation}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// 回调函数使用useCallback
function ClickableButton({ onClick }) {
  const handleClick = useCallback(() => {
    onClick('clicked');
  }, [onClick]);

  return <mesh onClick={handleClick}>...</mesh>;
}
```

### 4.3 Three.js层面的优化

**几何体优化**

```tsx
// 1. 合并静态几何体
function MergedGeometry() {
  const geometry = useMemo(() => {
    // 创建多个几何体然后合并
    const geo1 = new THREE.BoxGeometry(1, 1, 1);
    const geo2 = new THREE.SphereGeometry(0.5, 16, 16);

    // 使用BufferGeometryUtils.mergeBufferGeometries
    // 或者手动合并顶点数据

    return mergedGeometry;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}

// 2. 合理设置几何体参数
function LODMesh() {
  // 根据距离使用不同细节级别的几何体
  return (
    <LOD>
      <LOD level={0}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial />
        </mesh>
      </LOD>
      <LOD level={1}>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial />
        </mesh>
      </LOD>
      <LOD level={2}>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial />
        </mesh>
      </LOD>
    </LOD>
  );
}
```

**材质优化**

```tsx
// 1. 共享材质（最重要！）
const sharedMaterial = useMemo(() => {
  return new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
}, []);

function SharedMaterialScene({ meshes }) {
  return (
    <>
      {meshes.map((mesh, i) => (
        <mesh key={i} geometry={mesh.geometry} material={sharedMaterial} />
      ))}
    </>
  );
}

// 2. 材质池化
const materialPool = useMemo(() => {
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];
  return colors.map(c => new THREE.MeshStandardMaterial({ color: c }));
}, []);

function PooledMaterialScene() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={materialPool[i]}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
      ))}
    </>
  );
}
```

**纹理优化**

```tsx
// 1. 纹理压缩（使用KTX2或Basis Universal）
import { KTX2Loader } from '@react-three/drei';

function CompressedTexture() {
  const ktx2Loader = useMemo(() => {
    const loader = new KTX2Loader();
    loader.setTranscoderPath('/basis/');
    return loader;
  }, []);

  const texture = useLoaderCompressed(KTX2Loader, '/textures/model.ktx2');

  return (
    <mesh>
      <primitive object={texture} attach="map" />
    </mesh>
  );
}

// 2. 合理设置纹理参数
const texture = useMemo(() => {
  const tex = new THREE.TextureLoader().load('/texture.jpg');

  // 缩小过滤：mipmap比线性过滤更快
  tex.minFilter = THREE.LinearMipmapLinearFilter;

  // 缩小到足够就行，不需要太大
  tex.generateMipmaps = false;

  //  anisotropy不要太大，4-8就够了
  tex.anisotropy = 4;

  return tex;
}, []);
```

### 4.4 实例化渲染

当需要渲染大量相同物体时，使用InstancedMesh是性能提升的关键：

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleSystem({ count = 10000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // 初始位置
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ],
      speed: Math.random() * 0.5 + 0.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const particle = particles[i];

      // 更新位置（简单的圆形运动）
      tempObject.position.set(
        particle.position[0] + Math.sin(time * particle.speed + particle.offset) * 2,
        particle.position[1] + Math.cos(time * particle.speed + particle.offset) * 2,
        particle.position[2]
      );

      // 更新矩阵
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#ff6b6b" transparent opacity={0.8} />
    </instancedMesh>
  );
}

// 更高级的粒子系统：使用compute shader（在WebGPU中支持）
```

### 4.5 Tree-shaking优化

R3F支持Tree-shaking，但需要正确配置：

```tsx
// ❌ 错误：导入整个库（无法tree-shaking）
import * as THREE from 'three';

// ✅ 正确：只导入需要的部分
import { SphereGeometry, Mesh, MeshStandardMaterial } from 'three';

// R3F组件也需要按需导入
// ❌ 错误
import { Canvas } from '@react-three/fiber';

// ✅ 正确：按需导入
import { Canvas } from '@react-three/fiber';

// Drei库的tree-shaking
// ❌ 错误
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';

// ✅ 正确：使用ES Module导入
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera';
```

### 4.6 阴影优化

阴影是性能杀手，以下是优化建议：

```tsx
function OptimizedShadows() {
  return (
    <>
      {/* 1. 尽量避免使用实时阴影 */}
      {/* 如果必须使用，使用合适的配置 */}

      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow

        // 阴影相机配置 - 尽量只覆盖需要的区域
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.1}
        shadow-camera-far={50}

        // 使用适当的阴影贴图大小（越小越快）
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}

        // bias调整避免摩尔纹
        shadow-bias={-0.0001}
      />

      {/* 2. 只对需要接收阴影的物体开启 */}
      <mesh receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial />
      </mesh>

      {/* 3. 静态物体关闭castShadow */}
      <mesh castShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </mesh>

      {/* 4. 使用伪阴影代替实时阴影 */}
      <mesh position={[0, -0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </>
  );
}
```

## 五、WebEnv-OS项目中的R3F实战

### 5.1 3D窗口组件

```tsx
// WebEnv-OS项目中的3D窗口组件
import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, RoundedBox } from '@react-three/drei';

interface Window3DProps {
  title: string;
  icon: string;
  initialPosition?: [number, number, number];
  initialSize?: { width: number; height: number };
  children?: React.ReactNode;
  onClose?: () => void;
  onFocus?: () => void;
}

export interface Window3DHandle {
  focus: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

const Window3D = forwardRef<Window3DHandle, Window3DProps>(({
  title,
  icon,
  initialPosition = [0, 0, 0],
  initialSize = { width: 4, height: 3 },
  children,
  onClose,
  onFocus,
}, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const { size, camera } = useThree();
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focus: () => setIsFocused(true),
    minimize: () => setIsMinimized(true),
    maximize: () => setIsMaximized(!isMaximized),
    close: () => onClose?.(),
  }));

  // 窗口颜色配置
  const windowColor = useMemo(() => {
    return isFocused ? '#2d2d3a' : '#1e1e28';
  }, [isFocused]);

  const titleBarColor = useMemo(() => {
    return isFocused ? '#0078d4' : '#3d3d4d';
  }, [isFocused]);

  // 动画效果
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 窗口弹出动画
    const scale = groupRef.current.scale;
    scale.x = THREE.MathUtils.lerp(scale.x, isMinimized ? 0 : 1, 0.1);
    scale.y = THREE.MathUtils.lerp(scale.y, isMinimized ? 0 : 1, 0.1);
    scale.z = THREE.MathUtils.lerp(scale.z, isMinimized ? 0 : 1, 0.1);

    // 拖拽时跟随鼠标
    if (isDragging) {
      groupRef.current.position.lerp(
        new THREE.Vector3(
          position[0] + dragOffset.current.x,
          position[1] + dragOffset.current.y,
          position[2]
        ),
        0.3
      );
    }
  });

  // 处理拖拽开始
  const handleDragStart = (e: THREE.Event) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsFocused(true);
    onFocus?.();
  };

  // 处理拖拽结束
  useFrame(() => {
    if (isDragging) {
      // 计算鼠标在3D空间的位置
      // 这里需要结合射线检测
    }
  });

  // 渲染窗口内容
  const renderContent = () => {
    if (isMinimized) return null;

    return (
      <group>
        {/* 窗口背景 */}
        <RoundedBox
          args={[initialSize.width, initialSize.height, 0.1]}
          radius={0.1}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={windowColor} />
        </RoundedBox>

        {/* 标题栏 */}
        <mesh
          position={[0, initialSize.height / 2 - 0.15, 0.051]}
          onPointerDown={handleDragStart}
        >
          <planeGeometry args={[initialSize.width - 0.2, 0.3]} />
          <meshStandardMaterial color={titleBarColor} />
        </mesh>

        {/* 标题文字 */}
        <Text
          position={[-initialSize.width / 2 + 0.5, initialSize.height / 2 - 0.15, 0.06]}
          fontSize={0.2}
          color="white"
          anchorX="left"
        >
          {title}
        </Text>

        {/* 关闭按钮 */}
        <mesh
          position={[initialSize.width / 2 - 0.3, initialSize.height / 2 - 0.15, 0.06]}
          onClick={onClose}
        >
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color="#e81123" />
        </mesh>

        {/* 内容区域 */}
        <group position={[0, 0, 0.06]}>
          {/* 3D内容 */}
          {children}
        </group>
      </group>
    );
  };

  return (
    <group ref={groupRef} position={position}>
      {renderContent()}
    </group>
  );
});

Window3D.displayName = 'Window3D';

export default Window3D;
```

### 5.2 3D桌面环境

```tsx
// WebEnv-OS项目中的3D桌面环境
import { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Window3D from './Window3D';
import DesktopIcon3D from './DesktopIcon3D';

// 背景星空效果
function StarryBackground() {
  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      {/* 添加渐变地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </>
  );
}

// 动态光照系统
function DynamicLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // 让光线缓慢移动，模拟时间流逝
      const time = state.clock.elapsedTime * 0.1;
      lightRef.current.position.x = Math.cos(time) * 30;
      lightRef.current.position.z = Math.sin(time) * 30;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        ref={lightRef}
        position={[30, 30, 30]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={['#87ceeb', '#3d3d3d', 0.5]} />
    </>
  );
}

// 桌面图标配置
const desktopIcons = [
  { id: 'folder1', title: '我的文档', icon: '/icons/folder.png', position: [-6, 3, 0] as [number, number, number], color: '#4ecdc4' },
  { id: 'folder2', title: '图片库', icon: '/icons/image.png', position: [-6, 1, 0] as [number, number, number], color: '#ff6b6b' },
  { id: 'app1', title: 'VS Code', icon: '/icons/vscode.png', position: [-6, -1, 0] as [number, number, number], color: '#007acc' },
  { id: 'app2', title: '终端', icon: '/icons/terminal.png', position: [-6, -3, 0] as [number, number, number], color: '#4ecdc4' },
  { id: 'trash', title: '回收站', icon: '/icons/trash.png', position: [6, -3, 0] as [number, number, number], color: '#95a5a6' },
];

// 主桌面组件
function Desktop() {
  const [windows, setWindows] = useState([
    { id: 'window1', title: '欢迎', position: [0, 0, 0] as [number, number, number], isOpen: true },
  ]);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>('window1');

  const handleIconDoubleClick = (iconId: string) => {
    // 根据图标创建新窗口
    const icon = desktopIcons.find(i => i.id === iconId);
    if (icon) {
      const newWindow = {
        id: `window_${Date.now()}`,
        title: icon.title,
        position: [
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
          0,
        ] as [number, number, number],
        isOpen: true,
      };
      setWindows([...windows, newWindow]);
      setSelectedWindowId(newWindow.id);
    }
  };

  const handleWindowClose = (windowId: string) => {
    setWindows(windows.filter(w => w.id !== windowId));
    if (selectedWindowId === windowId) {
      setSelectedWindowId(null);
    }
  };

  const handleWindowFocus = (windowId: string) => {
    setSelectedWindowId(windowId);
  };

  return (
    <>
      {/* 背景 */}
      <StarryBackground />

      {/* 光照 */}
      <DynamicLighting />

      {/* 摄像机控制器 */}
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={10}
        maxDistance={50}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />

      {/* 桌面图标 */}
      {desktopIcons.map(icon => (
        <DesktopIcon3D
          key={icon.id}
          title={icon.title}
          iconPath={icon.iconPath}
          color={icon.color}
          position={icon.position}
          onDoubleClick={() => handleIconDoubleClick(icon.id)}
        />
      ))}

      {/* 窗口 */}
      {windows.map(window => (
        <Window3D
          key={window.id}
          title={window.title}
          icon=""
          initialPosition={window.position}
          initialSize={{ width: 6, height: 4 }}
          onClose={() => handleWindowClose(window.id)}
          onFocus={() => handleWindowFocus(window.id)}
        >
          {/* 窗口内容 */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4ecdc4" />
          </mesh>
        </Window3D>
      ))}

      {/* 加载状态 */}
      <Suspense fallback={null}>
        {/* 异步加载的内容 */}
      </Suspense>
    </>
  );
}

// 主应用入口
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <Desktop />
      </Canvas>
    </div>
  );
}
```

## 六、常见问题与最佳实践

### 6.1 常见错误

**错误1：组件在Canvas外部**

```tsx
// ❌ 错误
function App() {
  return (
    <div>
      <Canvas>
        <Scene />
      </Canvas>
      <SomeComponent />  // 这个组件在Canvas外部！
    </div>
  );
}

// ✅ 正确 - 把UI组件放到HTML层
function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas>
        <Scene />
      </Canvas>
      {/* HTML UI层 */}
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <SomeComponent />
      </div>
    </div>
  );
}
```

**错误2：忘记清理资源**

```tsx
// ❌ 错误 - 内存泄漏
function MyComponent() {
  const meshRef = useRef();

  useEffect(() => {
    // 创建了一些Three.js对象，但没有清理
    const geometry = new THREE.SphereGeometry();
    const material = new THREE.MeshBasicMaterial();

    return () => {
      // 没有调用dispose()
    };
  }, []);

  return <mesh ref={meshRef} />;
}

// ✅ 正确 - 清理资源
function MyComponent() {
  const geometryRef = useRef();

  useEffect(() => {
    const geometry = new THREE.SphereGeometry();
    const material = new THREE.MeshBasicMaterial();
    geometryRef.current = geometry;

    return () => {
      // 清理
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <mesh geometry={geometryRef.current} />;
}
```

**错误3：在useFrame中使用React状态**

```tsx
// ❌ 错误 - 性能问题
function BadComponent() {
  const [position, setPosition] = useState([0, 0, 0]);

  useFrame(() => {
    // 每帧更新React状态，会导致组件重渲染！
    setPosition([position[0] + 0.01, position[1], position[2]]);
  });

  return <mesh position={position} />;
}

// ✅ 正确 - 使用ref存储状态
function GoodComponent() {
  const meshRef = useRef();
  const positionRef = useRef([0, 0, 0]);

  useFrame(() => {
    // 更新ref而不是state
    positionRef.current[0] += 0.01;
    if (meshRef.current) {
      meshRef.current.position.set(...positionRef.current);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}
```

### 6.2 调试技巧

```tsx
// 1. 使用useEffect调试组件生命周期
useEffect(() => {
  console.log('组件挂载');
  return () => console.log('组件卸载');
}, []);

// 2. 使用stats.js显示FPS
import Stats from 'stats.js';

function withStats(App) {
  return function WrappedApp(props) {
    const statsRef = useRef();

    useEffect(() => {
      statsRef.current = new Stats();
      statsRef.current.showPanel(0);
      document.body.appendChild(statsRef.current.dom);

      const animate = () => {
        statsRef.current.begin();
        statsRef.current.end();
        requestAnimationFrame(animate);
      };
      animate();

      return () => {
        document.body.removeChild(statsRef.current.dom);
      };
    }, []);

    return <App {...props} />;
  };
}

// 3. 使用useDebugValue显示自定义hook的值
function useOptimizedMesh(position) {
  const meshRef = useRef();

  useDebugValue(`Mesh at ${position.join(',')}`);

  return meshRef;
}
```

### 6.3 最佳实践清单

```
R3F性能优化清单：

[ ] 1. 使用React.memo包装静态组件
[ ] 2. 使用useMemo缓存复杂计算结果
[ ] 3. 使用useCallback缓存回调函数
[ ] 4. 使用useRef访问Three.js对象
[ ] 5. 避免在render中创建新对象
[ ] 6. 大量相同物体使用InstancedMesh
[ ] 7. 共享几何体和材质
[ ] 8. 正确清理dispose不再使用的资源
[ ] 9. 限制像素比dpr在合理范围
[ ] 10. 避免频繁切换材质
[ ] 11. 使用LOD处理复杂模型
[ ] 12. 纹理压缩和使用mipmap
[ ] 13. 优化阴影配置
[ ] 14. 使用Suspense处理加载状态
[ ] 15. 合理的组件拆分
```

## 七、总结

好了，关于React Three Fiber和3D性能优化的介绍就到这里。让我来总结一下今天学到的核心内容：

1. **React Three Fiber是Three.js的React封装**：它让你可以用声明式的方式开发3D应用。

2. **Canvas是入口**：它创建渲染器并管理场景。

3. **内置组件是对Three.js对象的封装**：几何体、材质、光源都有对应的React组件。

4. **Hooks是核心**：useFrame、useThree、useLoader是最常用的Hooks。

5. **性能优化是重点**：从React层面到Three.js层面都需要优化。

6. **Tree-shaking很重要**：正确配置可以减少bundle大小。

7. **内存管理不可忽视**：每次创建几何体、材质、纹理都要想着在什么时候释放。

R3F是一个非常强大的库，它大大简化了3D应用在React中的开发。希望这篇文章能帮助你建立起完整的R3F知识体系。

如果想继续深入学习，建议：
1. 阅读R3F官方文档和源码
2. 学习Drei库的用法
3. 多做项目练习
4. 学习图形学理论知识

祝你在React 3D的世界里玩得开心！
