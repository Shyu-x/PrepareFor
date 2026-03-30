# 3D WebGL 渲染

## 一、3D 渲染概述

### 1.1 技术栈

```
┌─────────────────────────────────────────────────────────────────┐
│                      3D 技术栈                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              @react-three/fiber (R3F)                     │   │
│  │         React 声明式 Three.js 封装                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│          ┌───────────────────┼───────────────────┐             │
│          ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   three.js  │    │ @react-three│    │ @react-three│        │
│  │  (核心3D库) │    │   /drei     │    │ /postprocess│        │
│  │             │    │ (工具组件)   │    │ (后处理)    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| Canvas | WebGL 渲染画布 |
| Scene | 3D 场景容器 |
| Camera | 相机视角 |
| Mesh | 3D 对象（几何体+材质） |
| Light | 光照 |
| Animation | 动画 |

---

## 二、Scene3D 组件

### 2.1 组件结构

```typescript
// frontend/src/components/game/Scene3D.tsx

/**
 * 3D 游戏场景。
 *
 * 使用 @react-three/fiber 创建 WebGL 渲染环境。
 */
export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 50 }}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      {/* 光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 环境 */}
      <Environment preset="sunset" />
      <Stars />

      {/* 3D 对象 */}
      <Card3D card={currentCard} position={[0, 0, 0]} />
      <DiscardPile3D cards={discardPile} />
      <Deck3D remaining={deckCount} />

      {/* 玩家手牌 */}
      <PlayerHand3D cards={hand} onPlayCard={handlePlayCard} />

      {/* 对手区域 */}
      <OpponentArea3D players={opponents} />

      {/* 相机控制 */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />

      {/* 特效 */}
      <ParticleSystem />
    </Canvas>
  );
}
```

### 2.2 相机配置

```typescript
// 根据设备类型调整相机
const getCameraConfig = (deviceType: DeviceType) => {
  switch (deviceType) {
    case 'mobile':
      return { position: [0, 8, 12], fov: 60 };
    case 'tablet':
      return { position: [0, 6, 11], fov: 55 };
    default:
      return { position: [0, 5, 10], fov: 50 };
  }
};
```

---

## 三、Card3D 组件

### 3.1 卡牌渲染

```typescript
// frontend/src/components/game/Card3D.tsx

/**
 * 3D 卡牌组件。
 *
 * 使用 BoxGeometry 创建卡牌几何体，
 * 使用纹理或颜色渲染卡牌图案。
 */
export function Card3D({ card, position, rotation, onClick }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 动画
  const [spring, api] = useSpring(() => ({
    position,
    rotation,
    scale: 1,
  }));

  return (
    <animated.mesh
      ref={meshRef}
      position={spring.position}
      rotation={spring.rotation}
      scale={spring.scale}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      {/* 卡牌几何体 */}
      <boxGeometry args={[2, 3, 0.02]} />

      {/* 材质 */}
      <meshStandardMaterial
        color={getCardColor(card)}
        metalness={0.1}
        roughness={0.5}
      />

      {/* 卡牌文字 */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.5}
        color="white"
      >
        {card.value}
      </Text>
    </animated.mesh>
  );
}
```

---

## 四、3D 效果

### 4.1 粒子效果

```typescript
// 彩带粒子效果
function ParticleSystem() {
  const particles = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={/* 粒子位置数组 */}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="gold"
        transparent
        opacity={0.8}
      />
    </points>
  );
}
```

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
