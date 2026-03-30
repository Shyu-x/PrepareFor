# Three.js 3D图形编程教程

## 目录

1. [Three.js 基础概念](#1-threejs-基础概念)
2. [React Three Fiber 入门](#2-react-three-fiber-入门)
3. [3D 模型加载](#3-3d-模型加载)
4. [材质和光照](#4-材质和光照)
5. [动画](#5-动画)
6. [项目中的 3D 可视化组件](#6-项目中的-3d-可视化组件)

---

## 1. Three.js 基础概念

### 1.1 什么是 Three.js？

**Three.js** 是一个基于 WebGL 的 JavaScript 3D 库，它简化了在浏览器中创建 3D 图形的过程。Three.js 提供了丰富的 API，让开发者无需深入了解底层 WebGL 即可创建精彩的 3D 内容。

```bash
# 安装 Three.js
npm install three@0.170.0
```

### 1.2 核心概念

Three.js 的核心由三个主要部分组成：

```javascript
import * as THREE from 'three';

// ===== 1. 场景 (Scene) =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);  // 设置背景颜色
scene.fog = new THREE.Fog(0x1a1a1a, 1, 100);   // 添加雾效

// ===== 2. 相机 (Camera) =====
const camera = new THREE.PerspectiveCamera(
    75,                                      // 视野角度 (FOV)
    window.innerWidth / window.innerHeight,  // 宽高比
    0.1,                                     // 近裁剪面
    1000                                     // 远裁剪面
);
camera.position.set(0, 0, 5);               // 设置相机位置

// ===== 3. 渲染器 (Renderer) =====
const renderer = new THREE.WebGLRenderer({
    antialias: true,     // 抗锯齿
    alpha: true,        // 透明背景
    powerPreference: 'high-performance'  // 性能优先
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;          // 开启阴影
document.body.appendChild(renderer.domElement);

// ===== 4. 渲染循环 =====
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
```

### 1.3 基础几何体

```javascript
// ===== 立方体 (BoxGeometry) =====
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);

// ===== 球体 (SphereGeometry) =====
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(2, 0, 0);
scene.add(sphere);

// ===== 平面 (PlaneGeometry) =====
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000ff,
    side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
scene.add(plane);

// ===== 圆锥体 (ConeGeometry) =====
const coneGeometry = new THREE.ConeGeometry(1, 2, 32);
const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(-2, 0, 0);
scene.add(cone);

// ===== 圆柱体 (CylinderGeometry) =====
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(0, 2, 0);
scene.add(cylinder);

// ===== 圆环 (TorusGeometry) =====
const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
const torusMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(3, 0, 0);
scene.add(torus);

// ===== 几何体参数 =====
const customGeometry = new THREE.BoxGeometry(
    width,    // 宽度
    height,   // 高度
    depth,    // 深度
    widthSegments,  // 宽度分段
    heightSegments, // 高度分段
    depthSegments   // 深度分段
);
```

### 1.4 完整示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Three.js 基础示例</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.170.0/build/three.module.js"
            }
        }
    </script>
    <script type="module">
        import * as THREE from 'three';

        // 1. 创建场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        // 2. 创建相机
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // 3. 创建渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // 4. 创建几何体
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        // 5. 创建材质
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            roughness: 0.5,
            metalness: 0.5
        });

        // 6. 创建网格
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // 7. 添加光照
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // 8. 动画循环
        function animate() {
            requestAnimationFrame(animate);

            // 旋转立方体
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            renderer.render(scene, camera);
        }

        animate();

        // 9. 处理窗口大小变化
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>
```

---

## 2. React Three Fiber 入门

### 2.1 简介

**React Three Fiber (R3F)** 是 Three.js 的 React 渲染器，它将 Three.js 的强大功能与 React 的声明式组件模型结合在一起。

```bash
# 安装 React Three Fiber
npm install @react-three/fiber@8.17.12
npm install @react-three/drei@9.121.4
npm install three@0.170.0
```

### 2.2 基础使用

```jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// 简单的 3D 场景组件
const SimpleScene = () => {
    return (
        <Canvas>
            {/* 相机设置 */}
            <perspectiveCamera
                makeDefault
                position={[0, 0, 5]}
                fov={75}
            />

            {/* 环境光 */}
            <ambientLight intensity={0.5} />

            {/* 方向光 */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={1}
            />

            {/* 立方体 */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="green" />
            </mesh>
        </Canvas>
    );
};

export default SimpleScene;
```

### 2.3 交互式组件

```jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

// 可交互的立方体组件
const InteractiveCube = () => {
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    // 每一帧更新
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <mesh
            ref={meshRef}
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={hovered ? 'hotpink' : 'orange'}
            />
        </mesh>
    );
};

// 场景组件
const Scene = () => {
    return (
        <Canvas camera={{ position: [0, 0, 5] }}>
            {/* 灯光 */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* 交互式立方体 */}
            <InteractiveCube />

            {/* 轨道控制器 (允许鼠标旋转/缩放) */}
            <OrbitControls />

            {/* 3D 文本 */}
            <Text
                position={[0, -2, 0]}
                fontSize={0.5}
                color="white"
            >
                Click me!
            </Text>
        </Canvas>
    );
};

export default Scene;
```

### 2.4 Drei 常用组件

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,      // 轨道控制器
    PerspectiveCamera,  // 透视相机
    Environment,        // 环境贴图
    ContactShadows,     // 接触阴影
    Html,               // HTML 覆盖层
    Text,               // 3D 文本
    Loader,             // 加载指示器
    useGLTF,           // GLTF 模型加载
    useTexture,        // 纹理加载
    Float,             // 悬浮动画
    Sparkles,          // 粒子闪烁
    Stars,             // 星空背景
    Cloud,             // 云朵
    Plane,             // 平面
    Box,               // 立方体
    Sphere,            // 球体
    Torus,             // 圆环
    MeshDistortMaterial  // 扭曲材质
} from '@react-three/drei';

const AdvancedScene = () => {
    return (
        <Canvas>
            {/* 相机 */}
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />

            {/* 控制器 */}
            <OrbitControls
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={10}
            />

            {/* 环境 */}
            <Environment preset="sunset" />
            <Stars radius={100} depth={50} count={5000} factor={4} />

            {/* 悬浮动画 */}
            <Float
                speed={2}
                rotationIntensity={1}
                floatIntensity={1}
            >
                <mesh>
                    <sphereGeometry args={[1, 32, 32]} />
                    <MeshDistortMaterial
                        color="#8A2BE2"
                        speed={2}
                        distort={0.3}
                    />
                </mesh>
            </Float>

            {/* 接触阴影 */}
            <ContactShadows
                position={[0, -2, 0]}
                opacity={0.5}
                scale={10}
                blur={2}
                far={4}
            />

            {/* HTML 覆盖层 */}
            <Html position={[2, 0, 0]}>
                <div style={{ color: 'white', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>
                    Hello from 3D!
                </div>
            </Html>
        </Canvas>
    );
};
```

---

## 3. 3D 模型加载

### 3.1 GLTF/GLB 格式

GLTF (GL Transmission Format) 是 Web 3D 的标准格式，GLB 是其二进制版本。

```jsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';

// 模型组件
function Model({ url }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

// 带加载状态的组件
function Scene() {
    return (
        <Canvas>
            <Suspense fallback={<Html center>加载中...</Html>}>
                <Model url="/model.glb" />
            </Suspense>
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
        </Canvas>
    );
}

// 预加载模型
useGLTF.preload('/model.glb');
```

### 3.2 加载带动画的模型

```jsx
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

function AnimatedModel({ url, animationName = 'idle' }) {
    const group = useRef();
    const { scene, animations } = useGLTF(url);
    const { actions } = useAnimations(animations, group);

    // 克隆场景以支持多个实例
    const clone = SkeletonUtils.clone(scene);

    useEffect(() => {
        // 播放指定动画
        const action = actions[animationName];
        if (action) {
            action.reset().fadeIn(0.5).play();
        }

        return () => {
            // 清理动画
            if (action) {
                action.fadeOut(0.5);
            }
        };
    }, [actions, animationName]);

    return (
        <primitive
            ref={group}
            object={clone}
            scale={1}
            position={[0, 0, 0]}
        />
    );
}

function Scene() {
    return (
        <Canvas camera={{ position: [0, 2, 5] }}>
            <Environment preset="sunset" />
            <AnimatedModel url="/character.glb" animationName="walk" />
            <OrbitControls />
        </Canvas>
    );
}
```

### 3.3 其他格式加载

```jsx
import { useFBX, useOBJ, useMTL } from '@react-three/drei';

// 加载 FBX 模型
function FBXModel({ url }) {
    const fbx = useFBX(url);
    return <primitive object={fbx} />;
}

// 加载 OBJ 模型
function OBJModel({ url, mtlUrl }) {
    const { scene } = useOBJ(url);
    const materials = useMTL(mtlUrl);

    // 应用材质
    Object.values(materials).forEach(material => {
        scene.traverse(child => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    });

    return <primitive object={scene} />;
}
```

### 3.4 进度加载指示器

```jsx
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas, useProgress } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';

function Loader() {
    const { progress, active } = useProgress();

    if (!active) return null;

    return (
        <Html center>
            <div style={{
                color: 'white',
                fontSize: '24px',
                textAlign: 'center'
            }}>
                <div>加载中...</div>
                <div style={{ width: '200px', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: '#4CAF50',
                        transition: 'width 0.3s'
                    }} />
                </div>
                <div style={{ fontSize: '14px', marginTop: '10px' }}>
                    {progress.toFixed(1)}%
                </div>
            </div>
        </Html>
    );
}

function Scene() {
    return (
        <Canvas>
            <Suspense fallback={<Loader />}>
                <Model url="/model.glb" />
            </Suspense>
            <OrbitControls />
        </Canvas>
    );
}
```

---

## 4. 材质和光照

### 4.1 常用材质

```jsx
import React from 'react';

// ===== MeshStandardMaterial (标准材质) =====
<meshStandardMaterial
    color="#ff0000"              // 颜色
    roughness={0.5}              // 粗糙度 (0=光滑, 1=粗糙)
    metalness={0.5}             // 金属度 (0=非金属, 1=金属)
    emissive="#000000"          // 自发光颜色
    emissiveIntensity={0}       // 自发光强度
    map={texture}               // 漫反射贴图
    normalMap={normalTexture}   // 法线贴图
    displacementMap={dispTexture} // 位移贴图
    aoMap={aoTexture}           // 环境光遮蔽贴图
    roughnessMap={roughTexture} // 粗糙度贴图
    metalnessMap={metalTexture} // 金属度贴图
    envMapIntensity={1}         // 环境贴图强度
/>

// ===== MeshBasicMaterial (基础材质) =====
<meshBasicMaterial
    color="#ff0000"
    map={texture}
    wireframe={false}
/>

// ===== MeshPhongMaterial (Phong 材质) =====
<meshPhongMaterial
    color="#ff0000"
    shininess={30}               // 高光光泽度
    specular="#111111"          // 高光颜色
    emissive="#000000"
/>

// ===== MeshToonMaterial (卡通材质) =====
<meshToonMaterial
    color="#ff0000"
    gradientMap={gradientTexture}
    toneMapped={false}
/>

// ===== MeshPhysicalMaterial (物理材质) =====
<meshPhysicalMaterial
    color="#ff0000"
    roughness={0.5}
    metalness={0.1}
    transmission={0}            // 透光率 (玻璃效果)
    thickness={0.5}             // 厚度
    clearcoat={1}               // 清漆层
    clearcoatRoughness={0}
    ior={1.5}                   // 折射率
    reflectivity={0.5}
    iridescence={0}
    iridescenceIOR={1.3}
    sheen={0}
    sheenRoughness={0.5}
    sheenColor="#ff0000"
/>
```

### 4.2 光照系统

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';

const LightingScene = () => {
    return (
        <Canvas>
            {/* ===== 环境光 ===== */}
            {/* 基础照明，无方向 */}
            <ambientLight
                intensity={0.5}
                color="#ffffff"
            />

            {/* ===== 方向光 ===== */}
            {/* 模拟太阳光，有明确方向 */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={1}
                color="#ffffff"
                castShadow={true}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />

            {/* ===== 点光源 ===== */}
            {/* 从一个点向各个方向发光 */}
            <pointLight
                position={[-5, 5, 5]}
                intensity={1}
                color="#ff0000"
                distance={10}
                decay={2}
            />

            {/* ===== 聚光灯 ===== */}
            {/* 圆锥形光源 */}
            <spotLight
                position={[0, 5, 0]}
                angle={Math.PI / 4}
                penumbra={0.5}
                intensity={1}
                castShadow={true}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />

            {/* ===== 矩形区域光 ===== */}
            {/* 面光源，模拟窗户光照 */}
            <rectAreaLight
                position={[0, 5, 0]}
                width={2}
                height={2}
                intensity={1}
                color="#ffffff"
            />

            {/* ===== 半球光 ===== */}
            {/* 模拟天空和地面反射 */}
            <hemisphereLight
                skyColor="#ffffff"
                groundColor="#000000"
                intensity={0.5}
            />
        </Canvas>
    );
};
```

### 4.3 环境贴图

```jsx
import { Environment, CubeTextureLoader } from '@react-three/drei';

function Scene() {
    return (
        <>
            {/* 使用预设环境 */}
            <Environment preset="sunset" />
            <Environment preset="city" />
            <Environment preset="studio" />
            <Environment preset="dawn" />
            <Environment preset="night" />

            {/* 使用 HDR 环境贴图 */}
            <Environment
                files="/textures/env.hdr"
                background={true}  // 同时作为背景
            />

            {/* 使用 CubeTexture */}
            <Environment
                background={true}
                blur={0.5}  // 模糊背景
            >
                <CubeTextureLoader
                    urls={[
                        'px.jpg', 'nx.jpg',
                        'py.jpg', 'ny.jpg',
                        'pz.jpg', 'nz.jpg'
                    ]}
                />
            </Environment>
        </>
    );
}
```

### 4.4 阴影效果

```jsx
import React from 'react';
import { ContactShadows, Shadow, AccumulativeShadows, RandomizedLight } from '@react-three/drei';

function ShadowScene() {
    return (
        <>
            {/* ===== 接触阴影 ===== */}
            {/* 物体下方的柔和阴影 */}
            <ContactShadows
                position={[0, -1, 0]}
                opacity={0.5}
                scale={10}
                blur={2}
                far={4}
                color="#000000"
            />

            {/* ===== 累积阴影 ===== */}
            {/* 高质量实时阴影 */}
            <AccumulativeShadows
                position={[0, -1, 0]}
                temporal
                frames={100}
                alphaTest={0.85}
                scale={10}
            >
                <RandomizedLight
                    amount={8}
                    radius={4}
                    ambient={0.5}
                    position={[5, 5, -10]}
                    bias={0.001}
                />
            </AccumulativeShadows>

            {/* ===== 普通阴影 ===== */}
            {/* 光源投射阴影 */}
            <directionalLight
                position={[5, 5, 5]}
                castShadow={true}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            <mesh castShadow={true}>
                <boxGeometry />
                <meshStandardMaterial />
            </mesh>
            <mesh receiveShadow={true}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial />
            </mesh>
        </>
    );
}
```

---

## 5. 动画

### 5.1 useFrame 动画

```jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function RotatingBox() {
    const meshRef = useRef();

    // 每一帧调用 (默认 60fps)
    useFrame((state, delta) => {
        // delta: 距离上一帧的时间 (秒)
        meshRef.current.rotation.x += delta * 0.5;
        meshRef.current.rotation.y += delta * 0.5;
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}

function FloatingSphere() {
    const meshRef = useRef();

    useFrame((state) => {
        // state 包含当前状态信息
        const time = state.clock.getElapsedTime();

        // 上下浮动
        meshRef.current.position.y = Math.sin(time) * 0.5;
    });

    return (
        <mesh ref={meshRef} position={[2, 0, 0]}>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="blue" />
        </mesh>
    );
}
```

### 5.2 使用 Spring 动画

```bash
npm install @react-spring/three@9.7.5
```

```jsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';

function AnimatedBox() {
    const [active, setActive] = useState(false);

    // 使用 react-spring 创建动画
    const { scale, color } = useSpring({
        scale: active ? 1.5 : 1,
        color: active ? 'hotpink' : 'orange',
        config: {
            mass: 1,
            tension: 170,
            friction: 26
        }
    });

    return (
        <animated.mesh
            scale={scale}
            onClick={() => setActive(!active)}
        >
            <boxGeometry />
            <animated.meshStandardMaterial color={color} />
        </animated.mesh>
    );
}
```

### 5.3 使用 Framer Motion 3D

```bash
npm install framer-motion@12.34.0
npm install framer-motion-3d@12.5.0
```

```jsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion-3d';

function AnimatedMesh() {
    const [isActive, setIsActive] = useState(false);

    return (
        <motion.mesh
            animate={{
                scale: isActive ? 1.5 : 1,
                rotateX: isActive ? Math.PI : 0,
                rotateY: isActive ? Math.PI : 0
            }}
            transition={{
                duration: 0.8,
                ease: "easeInOut"
            }}
            onClick={() => setIsActive(!isActive)}
        >
            <boxGeometry />
            <meshStandardMaterial color="orange" />
        </motion.mesh>
    );
}
```

### 5.4 路径动画

```jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function PathAnimation() {
    const meshRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // 圆形路径
        meshRef.current.position.x = Math.sin(time) * 2;
        meshRef.current.position.z = Math.cos(time) * 2;

        // 8 字形路径
        meshRef.current.position.x = Math.sin(time) * 2;
        meshRef.current.position.y = Math.sin(time * 2) * 1;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="red" />
        </mesh>
    );
}

// 使用 CatmullRomCurve3 创建平滑曲线
function CurveAnimation() {
    const meshRef = useRef();
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0),
    ]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const t = (time * 0.1) % 1;  // 循环 0-1

        const position = curve.getPoint(t);
        meshRef.current.position.copy(position);

        // 朝向切线方向
        const tangent = curve.getTangent(t);
        meshRef.current.lookAt(
            position.x + tangent.x,
            position.y + tangent.y,
            position.z + tangent.z
        );
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="green" />
        </mesh>
    );
}
```

### 5.5 粒子动画

```jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function ParticleSystem({ count = 1000 }) {
    const pointsRef = useRef();

    // 创建粒子位置数组
    const positions = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return positions;
    }, [count]);

    // 动画
    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
            pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                transparent
                color="#ff0000"
                size={0.05}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </points>
    );
}
```

## 6.5 项目实际源码分析: WebGLBackground 组件

### 6.5.1 完整项目源码

```tsx
// ===== 项目源码路径: apps/web/src/components/WebGLBackground.tsx =====

'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    // 检测 WebGL 支持
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setWebglSupported(false)
        return
      }
    } catch (e) {
      setWebglSupported(false)
      return
    }

    if (!containerRef.current) return

    // ... Three.js 初始化代码
  }, [webglSupported])
}
```

### 6.5.2 逐行源码深度解析

```typescript
// ===== 第 1-4 行: 导入语句 =====
'use client'                     // 告诉 Next.js 这是客户端组件

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// ===== 第 6-8 行: 组件结构 =====
export default function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null)  // DOM 容器引用
  const [webglSupported, setWebglSupported] = useState(true)  // WebGL 支持状态

// ===== 第 10-23 行: WebGL 支持检测 =====
  useEffect(() => {
    // 创建离屏 canvas 检测 WebGL 支持
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') ||
                 canvas.getContext('experimental-webgl')

      if (!gl) {
        setWebglSupported(false)
        return
      }
    } catch (e) {
      setWebglSupported(false)
      return
    }

// ===== 第 24-30 行: 容器验证 =====
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) return

// ===== 第 32-35 行: 场景和相机初始化 =====
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,              // FOV (视野角度)
      width / height,  // 宽高比
      0.1,             // 近裁剪面
      1000             // 远裁剪面
    )
    camera.position.z = 30  // 相机 Z 轴位置

// ===== 第 37-44 行: 渲染器配置 =====
    const renderer = new THREE.WebGLRenderer({
      antialias: true,           // 抗锯齿
      alpha: true,               // 透明背景
      powerPreference: 'high-performance'  // GPU 性能优先
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // 限制像素比
    container.appendChild(renderer.domElement)

// ===== 第 46-65 行: 自定义顶点着色器 =====
    const vertexShader = `
      varying vec2 vUv;           // 传递给片段着色器的 UV 坐标
      varying float vDistortion;  // 传递畸变值
      uniform float uTime;       // 时间 uniform (从 JavaScript 更新)

      void main() {
        vUv = uv;               // 内置 UV 坐标
        vec3 pos = position;    // 内置位置属性

        // 多层波浪畸变计算
        float dist = sin(pos.x * 0.3 + uTime * 0.4) *
                     cos(pos.y * 0.4 + uTime * 0.3) * 1.5;

        // 添加第二层畸变 (不同频率和相位)
        dist += sin(pos.x * 0.5 + pos.y * 0.5 + uTime * 0.2) * 0.8;

        pos.z += dist;          // 应用 Z 轴畸变
        vDistortion = dist;     // 传递给片段着色器

        // 最终位置 = 投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点位置
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.5;     // 粒子大小
      }
    `

// ===== 第 67-92 行: 自定义片段着色器 =====
    const fragmentShader = `
      varying vec2 vUv;
      varying float vDistortion;
      uniform float uTime;
      uniform vec3 uColor1;      // 颜色 uniform 1
      uniform vec3 uColor2;      // 颜色 uniform 2
      uniform vec3 uColor3;      // 颜色 uniform 3

      void main() {
        // 计算点坐标到中心的距离 (0.5 是半径)
        float dist = length(gl_PointCoord - vec2(0.5));

        // 丢弃圆外的像素 (创建圆形粒子)
        if (dist > 0.5) discard;

        // 渐变透明度 (中心不透明，边缘透明)
        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

        // 动态颜色混合 (基于 UV 坐标和时间)
        vec3 color = mix(uColor1, uColor2,
                        sin(uTime * 0.4 + vUv.x * 3.14159 * 2.0) * 0.5 + 0.5);

        color = mix(color, uColor3,
                    cos(uTime * 0.3 + vUv.y * 3.14159) * 0.4 + 0.2);

        // 闪烁效果
        float sparkle = sin(uTime * 3.0 + vDistortion * 10.0) * 0.3 + 0.7;
        color *= sparkle;

        gl_FragColor = vec4(color, alpha * 0.5);  // 最终颜色
      }
    `

// ===== 第 94-115 行: 粒子系统几何体 =====
    const particleCount = 3000
    const geometry = new THREE.BufferGeometry()  // 使用 BufferGeometry 优化
    const positions = new Float32Array(particleCount * 3)  // 3000 个点，每个 3 个坐标
    const uvs = new Float32Array(particleCount * 2)        // 3000 个点，每个 2 个 UV

    for (let i = 0; i < particleCount; i++) {
      // 球面分布算法 (生成均匀分布的点)
      const theta = Math.random() * Math.PI * 2   // 方位角 (0 到 2π)
      const phi = Math.acos(2 * Math.random() - 1) // 极角 (0 到 π)
      const radius = 20 + Math.random() * 30       // 半径 20-50

      // 球坐标转笛卡尔坐标
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)     // x
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50              // z (均匀分布)

      uvs[i * 2] = Math.random()      // u 坐标
      uvs[i * 2 + 1] = Math.random()  // v 坐标
    }

    // 设置 BufferAttribute (GPU 内存)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

// ===== 第 117-129 行: 自定义着色器材质 =====
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },      // 初始化时间
        uColor1: { value: new THREE.Color('#0891B2') }, // Cyan 600
        uColor2: { value: new THREE.Color('#0ea5e9') }, // Sky 500
        uColor3: { value: new THREE.Color('#22D3EE') }, // Cyan 400
      },
      transparent: true,          // 启用透明度
      depthWrite: false,          // 禁用深度写入 (粒子不遮挡)
      blending: THREE.AdditiveBlending,  // 加法混合 (发光效果)
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

// ===== 第 134-151 行: 圆环几何体 =====
    const torusGeometry = new THREE.TorusGeometry(
      12,    // 主半径
      0.2,   // 管半径
      16,    // 径向分段
      100    // 管状分段
    )

    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x0891B2,     // 十六进制颜色
      wireframe: true,     // 线框模式
      transparent: true,
      opacity: 0.08,       // 低透明度
    })

    // 第一个圆环
    const torus1 = new THREE.Mesh(torusGeometry, torusMaterial)
    torus1.rotation.x = Math.PI / 3  // 倾斜 60 度
    scene.add(torus1)

    // 第二个圆环 (克隆几何体和材质)
    const torus2 = new THREE.Mesh(torusGeometry.clone(), torusMaterial.clone())
    torus2.rotation.x = -Math.PI / 4
    torus2.rotation.y = Math.PI / 4
    torus2.scale.set(0.7, 0.7, 0.7)  // 缩小 30%
    scene.add(torus2)

// ===== 第 153-176 行: 动画循环 =====
    let animationId: number
    const clock = new THREE.Clock()  // 创建时钟 (跟踪时间增量)

    const animate = () => {
      animationId = requestAnimationFrame(animate)  // 请求下一帧

      const elapsedTime = clock.getElapsedTime()  // 获取经过的时间 (秒)

      // 更新着色器 uniform
      material.uniforms.uTime.value = elapsedTime

      // 粒子旋转
      particles.rotation.y = elapsedTime * 0.03  // Y 轴缓慢旋转
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05  // X 轴轻微摆动

      // 圆环 1 旋转
      torus1.rotation.z = elapsedTime * 0.08
      torus1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.2) * 0.1

      // 圆环 2 旋转 (反向)
      torus2.rotation.z = -elapsedTime * 0.1
      torus2.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 0.15) * 0.1

      renderer.render(scene, camera)  // 渲染场景
    }
    animate()

// ===== 第 178-187 行: 响应式处理 =====
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return

      // 更新相机宽高比
      camera.aspect = w / h
      camera.updateProjectionMatrix()

      // 更新渲染器尺寸
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

// ===== 第 189-198 行: 清理函数 (组件卸载时) =====
    return () => {
      cancelAnimationFrame(animationId)  // 取消动画循环
      window.removeEventListener('resize', handleResize)  // 移除事件监听

      // 清理 WebGL 资源
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      geometry.dispose()    // 释放几何体内存
      material.dispose()    // 释放材质内存
      renderer.dispose()    // 释放渲染器
    }
  }, [webglSupported])

// ===== 第 200-218 行: WebGL 降级 UI =====
  if (!webglSupported) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',  // 不阻挡鼠标事件
        background: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 50%, #A5F3FC 100%)',
        opacity: 0.4,
      }} />
    )
  }

// ===== 第 220-233 行: WebGL 容器 =====
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',  // 不阻挡页面交互
      }}
    />
  )
}
```

### 6.5.3 核心技术点分析

```javascript
// ===== 1. WebGL 支持检测模式 =====
function detectWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');

        // 优先尝试 WebGL 2.0 (现代浏览器)
        const gl = canvas.getContext('webgl2');

        // 降级到 WebGL 1.0
        if (!gl) {
            const gl1 = canvas.getContext('webgl');
            if (!gl1) {
                // 再尝试实验性 WebGL (老浏览器)
                const expGL = canvas.getContext('experimental-webgl');
                if (!expGL) return false;
            }
        }

        return true;
    } catch (e) {
        return false;
    }
}

// ===== 2. 球面分布算法分析 =====
function generateSpherePoints(count, minRadius, maxRadius) {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // 均匀球面分布 (避免极点聚集)
        // 使用 acos(2*random-1) 保证 φ 在 [0,π] 均匀分布
        const phi = Math.acos(2 * Math.random() - 1);      // [0, π]
        const theta = Math.random() * Math.PI * 2;       // [0, 2π]
        const radius = minRadius + Math.random() * (maxRadius - minRadius);

        // 球坐标 -> 笛卡尔坐标
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    return positions;
}

// ===== 3. GLSL 波浪畸变算法 =====
const waveDistortion = `
    // 双层正弦波叠加
    float dist = sin(pos.x * 0.3 + uTime * 0.4) *          // 第一层
                 cos(pos.y * 0.4 + uTime * 0.3) * 1.5;

    dist += sin(pos.x * 0.5 + pos.y * 0.5 + uTime * 0.2) * 0.8;  // 第二层

    // 参数解释:
    // - pos.x * 0.3: 空间频率 (越小波浪越宽)
    // - uTime * 0.4: 时间频率 (越大运动越快)
    // - 1.5: 振幅乘数
    // - 叠加第二层: 使用不同参数创造更复杂的波浪
`;

// ===== 4. 粒子圆点绘制 =====
const circleParticle = `
    void main() {
        // gl_PointCoord: 粒子坐标 [0,1]
        float dist = length(gl_PointCoord - vec2(0.5));  // 到中心的距离

        // 丢弃圆外的像素
        if (dist > 0.5) discard;

        // 平滑边缘渐变
        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

        // smoothstep(edge0, edge1, x):
        // x < edge0: 返回 0
        // x > edge1: 返回 1
        // 中间: 平滑过渡
    }
`;

// ===== 5. 加法混合模式 =====
const additiveBlending = `
    // AdditiveBlending: 颜色相加
    // result = source + destination
    // 效果: 重叠区域更亮 (发光效果)

    // 渲染管线混合公式:
    // finalColor = source.rgb * source.a + destination.rgb * (1 - source.a)
    // 对于 AdditiveBlending:
    // finalColor = source.rgb + destination.rgb

    // 适用场景:
    // - 粒子系统 (火、烟、光)
    // - 发光效果
    // - 霓虹效果
`;

// ===== 6. 响应式处理关键点 =====
const responsiveHandler = `
    // 1. 防抖处理 (可选，避免频繁更新)
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const w = container.clientWidth;
            const h = container.clientHeight;

            // 验证尺寸有效
            if (w === 0 || h === 0) return;

            // 更新相机
            camera.aspect = w / h;
            camera.updateProjectionMatrix();

            // 更新渲染器
            renderer.setSize(w, h);

            // 可选: 限制像素比以节省性能
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            renderer.setPixelRatio(pixelRatio);
        }, 100);  // 100ms 防抖
    };

    // 2. 使用 ResizeObserver (更高效)
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width === 0 || height === 0) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    });

    observer.observe(container);
`;

// ===== 7. WebGL 资源泄漏预防 =====
const resourceCleanup = `
    return () => {
        // 1. 停止动画循环
        cancelAnimationFrame(animationId);

        // 2. 移除 DOM 元素
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }

        // 3. 释放几何体 (清除 GPU 缓冲区)
        geometry.dispose();

        // 4. 释放材质 (清除着色器程序)
        material.dispose();

        // 5. 释放渲染器 (清除 WebGL 上下文)
        renderer.dispose();

        // 6. 移除事件监听
        window.removeEventListener('resize', handleResize);

        // 7. 清理观察者 (如果使用了 ResizeObserver)
        observer.disconnect();

        // 8. 清理纹理 (如果有)
        textures.forEach(texture => texture.dispose());

        // 9. 清理光源 (如果是灯光)
        lights.forEach(light => {
            if (light.dispose) light.dispose();
        });
    };
`;
```

### 6.5.4 性能优化要点

```javascript
// ===== WebGLBackground 性能优化清单 =====

// 1. 像素比限制 (关键优化)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// 高 DPI 屏幕 (4K) 会成倍增加像素数量
// 限制到 2x 可以平衡质量和性能

// 2. 使用 BufferGeometry (而不是 Geometry)
const geometry = new THREE.BufferGeometry();  // ✅ 高效
// const geometry = new THREE.Geometry();      // ❌ 已废弃

// 3. 批量更新 (避免逐个更新)
const positions = new Float32Array(count * 3);
// 一次性创建数组，而不是多次 push

// 4. 使用共享材质
const torusMaterial = new THREE.MeshBasicMaterial({...});
const torus2Material = torusMaterial.clone();  // 共享属性
// 某些属性仍然独立，但可以节省内存

// 5. 禁用深度写入 (粒子)
depthWrite: false
// 粒子不需要深度测试，可以大幅提高性能

// 6. 使用简化的着色器
// 片段着色器中的计算越少越好
// 避免复杂的条件分支

// 7. 粒子数量平衡
const particleCount = 3000;
// 3000 是在性能和视觉效果之间的平衡点
// 可根据设备性能动态调整

// 8. 圆环分段数优化
const torusGeometry = new THREE.TorusGeometry(
    12,    // 半径
    0.2,   // 管半径
    16,    // 径向分段 (保持较低)
    100    // 管状分段 (可以降低到 64)
);
```

---

## 总结

Three.js 和 React Three Fiber 为 Web 3D 开发提供了强大的支持。通过本教程，你应该能够：

1. **基础概念**：理解场景、相机、渲染器的核心概念
2. **React Three Fiber**：使用声明式方式创建 3D 场景
3. **模型加载**：加载 GLTF/GLB 等格式的 3D 模型
4. **材质光照**：使用各种材质和光照系统
5. **动画**：创建丰富的 3D 动画效果
6. **项目实践**：构建实际的 3D 可视化组件
7. **渲染管线**：理解 WebGL 底层渲染流程
8. **场景图架构**：掌握 Three.js 对象组织方式
9. **性能优化**：理解 BufferGeometry 和 PBR 材质原理
10. **R3F 原理**：掌握 React Three Fiber 的声明式渲染机制
11. **项目源码分析**：深度解析 WebGLBackground 组件的每一行代码

在 WebEnv 项目中，Three.js 和 React Three Fiber 用于实现 3D 文件预览、场景可视化等功能，为用户提供沉浸式的交互体验。WebGLBackground 组件展示了如何在实际项目中使用自定义着色器、粒子系统、性能优化等技术。

### 6.1 3D 场景查看器

```jsx
// 项目中的 3D 模型查看器组件
import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Html,
    useGLTF,
    PresentationControls
} from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

// 加载 GLTF 模型
function Model({ url }) {
    const { scene } = useGLTF(url);

    // 优化模型
    scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.envMapIntensity = 1;
            }
        }
    });

    return <primitive object={scene} />;
}

// 交互式展示控件
function Showcase({ modelUrl, autoRotate = false }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 0, 5], fov: 45 }}
            style={{ background: '#1a1a1a' }}
        >
            {/* 环境 */}
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1}
                castShadow
            />

            {/* 展示控件 */}
            <PresentationControls
                global
                config={{ mass: 2, tension: 500 }}
                snap={{ mass: 4, tension: 1500 }}
                rotation={[0, 0.3, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
                <Suspense fallback={<Html center>加载中...</Html>}>
                    <Model url={modelUrl} />
                </Suspense>
            </PresentationControls>

            {/* 阴影 */}
            <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4}
            />

            {/* 控制器 */}
            <OrbitControls
                enablePan={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
                minDistance={3}
                maxDistance={8}
                autoRotate={autoRotate}
                autoRotateSpeed={2}
            />
        </Canvas>
    );
}

export default Showcase;
```

### 6.2 数据可视化 3D 图表

```jsx
// 3D 柱状图组件
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BarChart3D = ({ data, width = 10, height = 5 }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <Canvas camera={{ position: [8, 8, 8] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {data.map((item, index) => {
                const barHeight = (item.value / maxValue) * height;
                const x = (index / data.length) * width - width / 2;

                return (
                    <group key={index} position={[x, barHeight / 2, 0]}>
                        <RoundedBox
                            args={[width / data.length * 0.8, barHeight, 1]}
                            radius={0.05}
                        >
                            <meshStandardMaterial
                                color={item.color || '#4CAF50'}
                                metalness={0.3}
                                roughness={0.4}
                            />
                        </RoundedBox>

                        {/* 标签 */}
                        <Text
                            position={[0, -barHeight / 2 - 0.3, 0.6]}
                            fontSize={0.3}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {item.label}
                        </Text>

                        {/* 数值 */}
                        <Text
                            position={[0, barHeight / 2 + 0.2, 0.6]}
                            fontSize={0.25}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {item.value}
                        </Text>
                    </group>
                );
            })}

            <OrbitControls />
            <gridHelper args={[15, 15, 0x444444, 0x222222]} />
        </Canvas>
    );
};

// 使用示例
function ChartExample() {
    const data = [
        { label: 'Jan', value: 100, color: '#ff6b6b' },
        { label: 'Feb', value: 150, color: '#4ecdc4' },
        { label: 'Mar', value: 120, color: '#45b7d1' },
        { label: 'Apr', value: 180, color: '#96ceb4' },
        { label: 'May', value: 200, color: '#ffeaa7' },
    ];

    return <BarChart3D data={data} width={8} height={4} />;
}
```

### 6.3 3D 地球/地图可视化

```jsx
// 3D 地球组件
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
    const earthRef = useRef();

    // 加载纹理
    const [colorMap, normalMap, specularMap, cloudsMap] = useMemo(() => {
        return [
            '/textures/earth/earth_atmos_2048.jpg',
            '/textures/earth/earth_normal_2048.jpg',
            '/textures/earth/earth_specular_2048.jpg',
            '/textures/earth/earth_clouds_1024.png'
        ].map(url => {
            const loader = new THREE.TextureLoader();
            return loader.load(url);
        });
    }, []);

    useFrame(() => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.001;
        }
    });

    return (
        <group>
            {/* 地球 */}
            <Sphere ref={earthRef} args={[1, 64, 64]}>
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    roughness={0.5}
                    metalness={0.1}
                />
            </Sphere>

            {/* 云层 */}
            <Sphere args={[1.02, 64, 64]}>
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </Sphere>

            {/* 大气层光晕 */}
            <Sphere args={[1.2, 64, 64]}>
                <meshBasicMaterial
                    color="#4da6ff"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </Sphere>
        </group>
    );
}

// 地点标记
function LocationMarker({ lat, lon, label, onClick }) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(1.05) * Math.sin(phi) * Math.cos(theta);
    const z = (1.05) * Math.sin(phi) * Math.sin(theta);
    const y = (1.05) * Math.cos(phi);

    return (
        <group position={[x, y, z]}>
            <mesh onClick={onClick}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="red" />
            </mesh>
            <Html distanceFactor={10}>
                <div className="location-label">{label}</div>
            </Html>
        </group>
    );
}

function GlobeScene({ locations = [] }) {
    return (
        <Canvas camera={{ position: [0, 0, 3] }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4da6ff" />

            <Earth />

            {locations.map((loc, i) => (
                <LocationMarker
                    key={i}
                    lat={loc.lat}
                    lon={loc.lon}
                    label={loc.label}
                    onClick={() => console.log(loc.label)}
                />
            ))}

            <OrbitControls
                enableZoom={true}
                minDistance={1.5}
                maxDistance={5}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </Canvas>
    );
}
```

### 6.4 3D 文件浏览器

```jsx
// 3D 文件/文件夹可视化
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Text, useCursor } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

function FileItem({ name, type, size, position, onClick, isSelected }) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();

    useCursor(hovered);

    const { scale, color } = useSpring({
        scale: hovered ? 1.05 : 1,
        color: isSelected ? '#4da6ff' : hovered ? '#666666' : '#444444',
        config: { tension: 300, friction: 20 }
    });

    useFrame((state) => {
        if (meshRef.current && hovered) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    const isFolder = type === 'folder';
    const boxColor = isFolder ? '#FFC107' : '#4CAF50';

    return (
        <animated.group
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <RoundedBox args={[size.width, size.height, size.depth]} radius={0.1}>
                <animated.meshStandardMaterial color={boxColor} />
            </RoundedBox>

            <Text
                position={[0, -size.height / 2 - 0.2, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="top"
            >
                {name}
            </Text>
        </animated.group>
    );
}

function FileSystem3D({ files, onFileClick, selectedFile }) {
    return (
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.5} />

            <group>
                {files.map((file, index) => (
                    <FileItem
                        key={file.id}
                        name={file.name}
                        type={file.type}
                        size={file.size || { width: 1, height: 0.5, depth: 1 }}
                        position={[
                            (index % 4) * 1.5 - 2.25,
                            Math.floor(index / 4) * -1,
                            0
                        ]}
                        isSelected={selectedFile?.id === file.id}
                        onClick={() => onFileClick(file)}
                    />
                ))}
            </group>

            <OrbitControls
                enablePan={true}
                enableZoom={true}
                minDistance={3}
                maxDistance={20}
            />
        </Canvas>
    );
}
```

---

## 7. WebGL 渲染管线深度解析

### 7.1 WebGL 渲染流程

WebGL 的渲染管线是 Three.js 的底层基础，理解这个管线对性能优化至关重要。

```javascript
// ===== WebGL 渲染管线源码原理 =====

// 1. 顶点着色器处理
// 输入: 顶点属性 (position, normal, uv)
// 输出: gl_Position, varying 数据传递给片段着色器
const vertexShaderSource = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;

    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        // 计算最终位置
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * viewPosition;

        // 传递数据给片段着色器
        vUv = uv;
        vNormal = normal;
    }
`;

// 2. 片段着色器处理
// 输入: varying 数据从顶点着色器插值得到
// 输出: gl_FragColor (像素颜色)
const fragmentShaderSource = `
    precision mediump float;

    varying vec2 vUv;
    varying vec3 vNormal;

    uniform sampler2D diffuseMap;
    uniform vec3 ambientColor;
    uniform vec3 lightDirection;

    void main() {
        // 纹理采样
        vec4 textureColor = texture2D(diffuseMap, vUv);

        // 光照计算
        float lightIntensity = max(dot(normalize(vNormal), normalize(lightDirection)), 0.0);
        vec3 finalColor = ambientColor + textureColor.rgb * lightIntensity;

        gl_FragColor = vec4(finalColor, textureColor.a);
    }
`;
```

### 7.2 Three.js 场景图架构

Three.js 使用场景图 (Scene Graph) 来组织 3D 对象。

```javascript
// ===== Object3D 场景图节点源码原理 =====

class Object3D {
    constructor() {
        // ===== 场景图连接 =====
        this.parent = null;           // 父节点
        this.children = [];           // 子节点数组

        // ===== 变换矩阵 =====
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Euler(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);

        // 计算得出的变换矩阵
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();  // 世界变换矩阵

        // ===== 可见性 =====
        this.visible = true;
        this.frustumCulled = false;  // 视锥体裁剪标记

        // ===== 渲染属性 =====
        this.renderOrder = 0;
        this.castShadow = false;
        this.receiveShadow = false;
    }

    // 添加子节点
    add(object) {
        if (object.parent !== null) {
            object.parent.remove(object);
        }

        object.parent = this;
        this.children.push(object);

        // 通知更新
        object.dispatchEvent({ type: 'add' });
        this.dispatchEvent({ type: 'child-add', child: object });

        return this;
    }

    // 从场景图移除
    remove(object) {
        const index = this.children.indexOf(object);
        if (index !== -1) {
            object.parent = null;
            this.children.splice(index, 1);

            object.dispatchEvent({ type: 'remove' });
            this.dispatchEvent({ type: 'child-remove', child: object });
        }

        return this;
    }

    // 更新本地变换矩阵
    updateMatrix() {
        this.matrix.compose(
            this.position,
            this.rotation,
            this.scale
        );
    }

    // 递归更新世界变换矩阵
    updateMatrixWorld(force = false) {
        // 更新本地矩阵
        this.updateMatrix();

        // 累积父节点变换
        if (this.parent === null) {
            this.matrixWorld.copy(this.matrix);
        } else {
            this.parent.updateMatrixWorld(force);
            this.matrixWorld.multiplyMatrices(
                this.parent.matrixWorld,
                this.matrix
            );
        }

        // 递归更新所有子节点
        this.children.forEach(child => {
            child.updateMatrixWorld(force);
        });
    }

    // 场景图遍历 (渲染时使用)
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        });
    }

    // 深度优先遍历
    traverseVisible(callback) {
        if (this.visible === false) return;

        callback(this);
        this.children.forEach(child => {
            child.traverseVisible(callback);
        });
    }

    // 反向遍历 (从叶子到根)
    traverseAncestors(callback) {
        let parent = this.parent;
        while (parent !== null) {
            callback(parent);
            parent = parent.parent;
        }
    }
}
```

### 7.3 WebGLRenderer 渲染流程

```javascript
// ===== WebGLRenderer 核心渲染流程源码原理 =====

class WebGLRenderer {
    constructor(parameters = {}) {
        // ===== WebGL 上下文 =====
        const canvas = parameters.canvas || document.createElement('canvas');
        this.gl = canvas.getContext('webgl2', {
            antialias: parameters.antialias,
            alpha: parameters.alpha,
            powerPreference: parameters.powerPreference
        });

        // ===== 渲染状态缓存 =====
        this._state = new WebGLState();
        this._capabilities = new WebGLCapabilities(this.gl);

        // ===== 渲染队列 =====
        this._renderList = null;
        this._renderListDepth = null;

        // ===== 后处理链 =====
        this._postProcessing = {
            chain: [],
            quad: new FullScreenQuad()
        };

        // ===== 自动清除标记 =====
        this.autoClear = true;
        this.autoClearColor = true;
        this.autoClearDepth = true;
        this.autoClearStencil = true;
    }

    // 主渲染方法
    render(scene, camera) {
        // 1. 更新场景和相机
        if (scene.autoUpdate === true) scene.updateMatrixWorld();
        if (camera.parent === null) camera.updateMatrixWorld();

        // 2. 检查光照变化
        this._projectObject(scene, camera);

        // 3. 视锥体裁剪
        this._frustumCull(camera);

        // 4. 排序渲染对象
        this._sortRenderList(camera);

        // 5. 设置渲染目标
        this._setRenderTarget(null);

        // 6. 清除缓冲区
        this._clear();

        // 7. 渲染场景
        this._renderScene(scene, camera);

        // 8. 后处理
        this._renderPostProcessing();

        // 9. 更新统计信息
        this._info.render.calls++;
        this._info.render.frame++;
    }

    // 投影对象到屏幕空间
    _projectObject(object, camera) {
        // 获取投影矩阵
        camera.updateProjectionMatrix();

        // 投影对象边界框
        object._renderOrder = object.renderOrder;
        object._frustumCulled = false;

        // 检查是否在视锥体内
        if (this._frustum.contains(object) === false) {
            object._frustumCulled = true;
        }

        // 递归处理子节点
        object.children.forEach(child => {
            this._projectObject(child, camera);
        });
    }

    // 视锥体裁剪
    _frustumCull(camera) {
        // 提取视锥体平面
        const frustum = new Frustum();
        frustum.setFromProjectionMatrix(camera.projectionMatrix);

        scene.traverseVisible(object => {
            if (object.isLight || object.isCamera) return;

            // 检查对象边界框
            if (object.geometry) {
                const boundingBox = object.geometry.boundingBox;
                if (boundingBox) {
                    object._frustumCulled = !frustum.intersectsBox(boundingBox);
                }
            }
        });
    }

    // 排序渲染列表 (优化渲染顺序)
    _sortRenderList(camera) {
        // 不透明对象: 从前向后渲染 (画家算法)
        this._opaqueObjects.sort((a, b) => {
            const distA = camera.position.distanceTo(a.position);
            const distB = camera.position.distanceTo(b.position);
            return distB - distA;  // 远的先渲染
        });

        // 透明对象: 从后向前渲染
        this._transparentObjects.sort((a, b) => {
            const distA = camera.position.distanceTo(a.position);
            const distB = camera.position.distanceTo(b.position);
            return distA - distB;  // 近的先渲染
        });
    }

    // 渲染单个对象
    _renderObject(object, camera) {
        // 跳过不可见或被裁剪的对象
        if (!object.visible || object._frustumCulled) return;

        // 设置材质
        const material = object.material;
        this._setMaterial(material);

        // 设置几何体
        const geometry = object.geometry;
        this._setGeometry(geometry);

        // 设置 uniforms
        this._setUniforms(object, camera, material);

        //'绘制调用'
        this._draw(geometry);
    }

    // 设置材质 uniform
    _setUniforms(object, camera, material) {
        const uniforms = material.uniforms;

        // 变换矩阵
        uniforms.modelMatrix.value = object.matrixWorld;
        uniforms.viewMatrix.value = camera.matrixWorldInverse;
        uniforms.projectionMatrix.value = camera.projectionMatrix;

        // 组合矩阵
        const viewProjectionMatrix = new Matrix4();
        viewProjectionMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        uniforms.viewProjectionMatrix.value = viewProjectionMatrix;

        // 相机位置
        uniforms.cameraPosition.value = camera.position;

        // 时间
        uniforms.time.value = performance.now() * 0.001;
    }

    // 绘制几何体
    _draw(geometry) {
        const gl = this.gl;
        const bufferInfo = geometry.bufferInfo;

        // 绑定顶点缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.vertexBuffer);

        // 设置顶点属性
        const attributes = geometry.attributes;
        for (const name in attributes) {
            const attr = attributes[name];
            gl.enableVertexAttribArray(attr.location);
            gl.vertexAttribPointer(
                attr.location,
                attr.itemSize,
                gl.FLOAT,
                false,
                attr.stride,
                attr.offset
            );
        }

        // 绑定索引缓冲区
        if (geometry.index) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indexBuffer);
            gl.drawElements(
                gl.TRIANGLES,
                geometry.index.count,
                gl.UNSIGNED_INT,
                0
            );
        } else {
            gl.drawArrays(
                gl.TRIANGLES,
                0,
                geometry.attributes.position.count
            );
        }
    }
}
```

### 7.4 BufferGeometry 优化原理

```javascript
// ===== BufferGeometry 高效数据存储源码原理 =====

class BufferGeometry {
    constructor() {
        // ===== 属性缓冲区 =====
        this.attributes = {};

        // ===== 索引缓冲区 =====
        this.index = null;

        // ===== 绘制范围 =====
        this.drawRange = { start: 0, count: Infinity };

        // ===== 边界框 =====
        this.boundingBox = null;
        this.boundingSphere = null;

;

        // ===== 使用标志 =====
        this._glBuffer = {
            vertex: null,
            index: null
        };

        // ===== 版本号 (用于缓存失效) =====
        this.version = 0;
    }

    // 添加属性
    addAttribute(name, attribute) {
        this.attributes[name] = attribute;
        this.version++;
        return this;
    }

    // 设置索引
    setIndex(index) {
        this.index = index;
        this.version++;
        return this;
    }

    // 上传到 GPU
    upload(gl) {
        // 上传顶点属性
        for (const name in this.attributes) {
            const attribute = this.attributes[name];

            // 创建缓冲区 (如果不存在)
            if (!attribute.buffer) {
                attribute.buffer = gl.createBuffer();
            }

            // 上传数据到 GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                attribute.array,
                gl.STATIC_DRAW
            );
        }

        // 上传索引
        if (this.index && !this.index.buffer) {
            this.index.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index.buffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                this.index.array,
                gl.STATIC_DRAW
            );
        }
    }

    // 计算边界框
    computeBoundingBox() {
        const positions = this.attributes.position.array;
        const count = positions.length / 3;

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < count; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        }

        this.boundingBox = new Box3(
            new Vector3(minX, minY, minZ),
            new Vector3(maxX, maxY, maxZ)
        );

        return this.boundingBox;
    }
}
```

### 7.5 材质系统源码

```javascript
// ===== MeshStandardMaterial PBR 渲染源码原理 =====

class MeshStandardMaterial extends Material {
    constructor(parameters = {}) {
        super(parameters);

        // ===== PBR 参数 =====
        this.color = new Color(0xffffff);
        this.roughness = 0.5;      // 粗糙度
        this.metalness = 0;         // 金属度

        // ===== 环境光照 =====
        this.envMap = null;
        this.envMapIntensity = 1;

        // ===== 贴图 =====
        this.map = null;                    // 漫反射贴图
        this.normalMap = null;              // 法线贴图
        this.roughnessMap = null;          // 粗糙度贴图
        this.metalnessMap = null;           // 金属度贴图
        this.aoMap = null;                  // AO 贴图
        this.emissiveMap = null;             // 自发光贴图

        // ===== 生成着色器 =====
        this.fragmentShader = this._generateFragmentShader();
        this.vertexShader = this._generateVertexShader();
    }

    // 生成片段着色器
    _generateFragmentShader() {
        return {
            // 纹理采样
            diffuseMap: 'texture2D(diffuseMap, vUv)',
            normalMap: 'texture2D(normalMap, vUv)',
            roughnessMap: 'texture2D(roughnessMap, vUv).r',
            metalnessMap: 'texture2D(metalnessMap, vUv).r',
            aoMap: 'texture2D(aoMap, vUv).r',

            // 法线计算
            normal: 'normalize(vNormal + normalMap.rgb * 2.0 - 1.0)',

            // PBR 计算
            pbr: `
                // 1. 计算法线分布函数 (GGX)
                float DistributionGGX(vec3 N, vec3 H, float roughness) {
                    float a = roughness * roughness;
                    float a2 = a * a;
                    float NdotH = max(dot(N, H), 0.0);
                    float NdotH2 = NdotH * NdotH;

                    float nom = a2;
                    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
                    denom = PI * denom * denom;

                    return nom / max(denom, 0.0001);
                }

                // 2. 几何遮蔽函数 (Schlick-GGX)
                float GeometrySchlickGGX(float NdotV, float roughness) {
                    float r = (roughness + 1.0);
                    float k = (r * r) / 8.0;

                    float nom = NdotV;
                    float denom = NdotV * (1.0 - k) + k;

                    return nom / denom;
                }

                float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
                    float NdotV = max(dot(N, V), 0.0);
                    float NdotL = max(dot(N, L), 0.0);
                    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
                    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

                    return ggx1 * ggx2;
                }

                // 3. 菲涅耳-施里克近似
                vec3 fresnelSchlick(float cosTheta, vec3 F0) {
                    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
                }

                // 4. 完整 PBR 方程
                vec3 calculatePBR(vec3 albedo, float roughness, float metalness) {
                    vec3 N = normalize(normal);
                    vec3 V = normalize(cameraPosition - FragPos);

                    vec3 Lo = vec3(0.0);

                    // 遍历所有光源
                    for(int i = 0; i < NUM_LIGHTS; i++) {
                        vec3 L = normalize(lights[i].position - FragPos);
                        vec3 H = normalize(V + L);

                        float distance = length(lights[i].position - FragPos);
                        float attenuation = 1.0 / (distance * distance);
                        vec3 radiance = lights[i].color * attenuation;

                        // Cook-Torrance BRDF
                        float NDF = DistributionGGX(N, H, roughness);
                        float G = GeometrySmith(N, V, L, roughness);
                        vec3 F0 = mix(vec3(0.04), albedo, metalness);
                        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

                        vec3 numerator = NDF * G * F;
                        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
                        vec3 specular = numerator / denominator;

                        vec3 kS = F;
                        vec3 kD = vec3(1.0) - kS;
                        kD *= 1.0 - metalness;

                        NdotL = max(dot(N, L), 0.0);
                        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
                    }

                    // 环境光照
                    vec3 kS = fresnelSchlick(max(dot(N, V), 0.0), F0);
                    vec3 kD = vec3(1.0) - kS;
                    kD *= 1.0 - metalness;

                    vec3 irradiance = texture(irradianceMap, N).rgb;
                    vec3 diffuse = irradiance * albedo;

                    vec3 prefilteredColor = textureLod(prefilterMap, vec3(0.0), roughness * 4.0).rgb;
                    vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
                    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

                    vec3 ambient = (kD * diffuse + specular) * ao;

                    return ambient + Lo;
                }
            `
        }[this.vertexShader];
    }
}
```

---

## 8. React Three Fiber 渲染器原理

### 8.1 R3F 与 Three.js 的桥接

```javascript
// ===== React Three Fiber 核心桥接源码原理 =====

import { createRoot } from 'react-dom/client';
import * as THREE from 'three';

// ===== R3F 声明式到命令式的转换 =====

function createInstance(type, props, internalInstanceHandle) {
    // 将 React 组件转换为 Three.js 对象
    const instance = createThreeInstance(type, props);

    // 处理 ref
    if (props.__r3f) {
        props.__r3f.ref = instance;
    }

    // 应用所有属性
    applyProps(instance, props);

    return instance;
}

function applyProps(instance, newProps, oldProps = {}) {
    // 遍历新属性
    for (const key in newProps) {
        if (key === 'children') continue;

        const value = newProps[key];
        const oldValue = oldProps[key];

        // 处理特殊属性
        if (key === 'attach') {
            // attach 处理 (例如 mesh 到 geometry)
            instance.attach(newProps[key]);
        } else if (key === 'args') {
            // args 在创建时已经处理
            continue;
        } else {
            // 普通属性设置
            if (value !== oldValue) {
                setAttribute(instance, key, value);
            }
        }
    }
}

function setAttribute(instance, key, value) {
    // 向量/颜色等特殊类型
    if (value instanceof THREE.Vector3) {
        instance[key].copy(value);
    } else if (value instanceof THREE.Color) {
        instance[key].set(value);
    } else if (key === 'position') {
        instance.position.set(...value);
    } else if (key === 'rotation') {
        instance.rotation.set(...value);
    } else if (key === 'scale') {
        instance.scale.set(...value);
    } else {
        // 直接赋值
        instance[key] = value;
    }
}

function createThreeInstance(type, props) {
    // Three.js 对象工厂
    const args = props.args || [];

    switch (type) {
        case 'scene':
            return new THREE.Scene();

        case 'perspectiveCamera':
            return new THREE.PerspectiveCamera(...args);

        case 'mesh':
            const geometry = props.children.find(c => c instanceof THREE.BufferGeometry);
            const material = props.children.find(c => c instanceof THREE.Material);
            return new THREE.Mesh(geometry, material);

        case 'boxGeometry':
            return new THREE.BoxGeometry(...args);

        case 'meshStandardMaterial':
            return new THREE.MeshStandardMaterial(props);

        default:
            // 动态构造
            if (THREE[type]) {
                return new THREE[type](...args);
            }
            throw new Error(`Unknown Three.js type: ${type}`);
    }
}
```

### 8.2 useFrame 动画循环钩子

```javascript
// ===== useFrame 源码实现原理 =====

// 存储所有 useFrame 回调
const frameCallbacks = new Set();

// 渲染循环
function renderLoop(performance, time, frame, delta) {
    // 1. 触发所有 useFrame 回调
    frameCallbacks.forEach(callback => {
        callback({ performance, time, frame, delta });
    });

    // 2. 更新场景
    rootState.gl.render(rootState.scene, rootState.camera);

    // 3. 请求下一帧
    requestAnimationFrame(renderLoop);
}

// useFrame Hook 实现
function useFrame(callback) {
    // 存储 callback
    frameCallbacks.add(callback);

    // 清理函数
    return () => {
        frameCallbacks.delete(callback);
    };
}

// 使用示例
function AnimatedBox() {
    const meshRef = useRef();

    useFrame((state, delta) => {
        // state 包含:
        // - performance: Performance API
        // - time: 当前时间 (秒)
        // - frame: 帧计数
        // - delta: 距离上一帧的时间 (秒)
        // - clock: THREE.Clock 实例
        // - gl: WebGLRenderer 实例
        // - scene: THREE.Scene 实例
        // - camera: THREE.Camera 实例

        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return <mesh ref={meshRef}><boxGeometry /><meshStandardMaterial /></mesh>;
}
```

### 8.3 R3F 状态管理

```javascript
// ===== R3F 状态管理系统源码原理 =====

const rootState = {
    // Three.js 核心
    scene: null,
    camera: null,
    renderer: null,
    gl: null,

    // 事件系统
    events: {
        onPointerMove: [],
        onClick: [],
        onPointerDown: [],
        onPointerUp: [],
    },

    // 视口信息
    viewport: {
        width: 0,
        height: 0,
        aspect: 0,
        factor: 0,
        distance: 0,
    },

    // 性能统计
    performance: {
        fps: 0,
        memory: 0,
    },
};

// 视口更新
function updateViewport() {
    const canvas = rootState.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    rootState.viewport.width = width;
    rootState.viewport.height = height;
    rootState.viewport.aspect = width / height;
    rootState.viewport.factor = 1;

    // 更新相机
    if (rootState.camera.isPerspectiveCamera) {
        rootState.camera.aspect = width / height;
        rootState.camera.updateProjectionMatrix();
    }

    // 更新渲染器
    rootState.renderer.setSize(width, height);
    rootState.renderer.setPixelRatio(window.devicePixelRatio);
}

// Raycaster 事件处理
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handlePointerMove(event) {
    // 计算鼠标位置
    const canvas = rootState.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, rootState.camera);
    const intersects = raycaster.intersectObjects(rootState.scene.children, true);

    // 触发事件
    rootState.events.onPointerMove.forEach(handler => {
        handler(event, intersects);
    });
}
```

---

## 总结

Three.js 和 React Three Fiber 为 Web 3D 开发提供了强大的支持。通过本教程，你应该能够：

1. **基础概念**：理解场景、相机、渲染器的核心概念
2. **React Three Fiber**：使用声明式方式创建 3D 场景
3. **模型加载**：加载 GLTF/GLB 等格式的 3D 模型
4. **材质光照**：使用各种材质和光照系统
5. **动画**：创建丰富的 3D 动画效果
6. **项目实践**：构建实际的 3D 可视化组件
7. **渲染管线**：理解 WebGL 底层渲染流程
8. **场景图架构**：掌握 Three.js 对象组织方式
9. **性能优化**：理解 BufferGeometry 和 PBR 材质原理
10. **R3F 原理**：掌握 React Three Fiber 的声明式渲染机制

在 WebEnv 项目中，Three.js 和 React Three Fiber 用于实现 3D 文件预览、场景可视化等功能，为用户提供沉浸式的交互体验。

---

## 参考资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei 库](https://github.com/pmndrs/drei)
- [Three.js 示例](https://threejs.org/examples/)
