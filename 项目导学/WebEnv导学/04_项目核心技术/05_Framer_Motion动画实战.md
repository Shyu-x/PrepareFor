# Framer Motion 动画实战教程

## 目录

1. [Framer Motion 基础](#1-framer-motion-基础)
2. [动画组件](#2-动画组件)
3. [手势动画](#3-手势动画)
4. [布局动画](#4-布局动画)
5. [项目中的动画实现](#5-项目中的动画实现)

---

## 1. Framer Motion 基础

### 1.1 简介

**Framer Motion** 是一个功能强大的 React 动画库，它提供了声明式的动画 API，让创建复杂的动画效果变得简单。

```bash
# 安装 Framer Motion
npm install framer-motion@12.34.0
```

### 1.2 核心概念

```jsx
import { motion } from 'framer-motion';

// 将普通 React 组件转换为 motion 组件
const MotionComponent = motion.div;

// 使用 motion 组件
function App() {
    return (
        <MotionComponent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            Hello World
        </MotionComponent>
    );
}
```

### 1.3 动画属性

```jsx
import { motion } from 'framer-motion';

const AnimatedBox = () => {
    return (
        <motion.div
            // ===== 位置 =====
            x={0}              // X 轴位移
            y={0}              // Y 轴位移
            z={0}              // Z 轴位移 (3D)

            // ===== 缩放 =====
            scale={1}          // 整体缩放
            scaleX={1}         // X 轴缩放
            scaleY={1}         // Y 轴缩放
            scaleZ={1}         // Z 轴缩放

            // ===== 旋转 =====
            rotate={0}         // 旋转角度 (度)
            rotateX={0}        // X 轴旋转
            rotateY={0}        // Y 轴旋转
            rotateZ={0}       // Z 轴旋转

            // ===== 透明度 =====
            opacity={1}

            // ===== 颜色 =====
            color="#fff"       // 文字颜色
            backgroundColor="#000"  // 背景颜色

            // ===== 边框和圆角 =====
            borderRadius={0}
            borderWidth={0}
            borderColor="#fff"

            // ===== 阴影 =====
            boxShadow="0 0 10px rgba(0,0,0,0.5)"

            // ===== 尺寸 =====
            width={100}
            height={100}

            // ===== 初始状态 =====
            initial={{
                opacity: 0,
                x: -100
            }}

            // ===== 动画状态 =====
            animate={{
                opacity: 1,
                x: 0
            }}

            // ===== 过渡配置 =====
            transition={{
                duration: 0.5,           // 动画持续时间
                ease: "easeInOut",       // 缓动函数
                delay: 0,                 // 延迟
                repeat: 0,                // 重复次数
                repeatType: "loop",       // 重复类型
                repeatDelay: 0,           // 重复延迟
                type: "tween",           // 动画类型: "tween" | "spring" | "keyframes"
            }}
        >
            Content
        </motion.div>
    );
};
```

### 1.4 动画配置

```jsx
// 预定义的缓动函数
const eases = {
    default: "easeInOut",
    linear: "linear",
    easeIn: "easeIn",
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    circIn: "circIn",
    circOut: "circOut",
    circInOut: "circInOut",
    backIn: "backIn",
    backOut: "backOut",
    backInOut: "backInOut",
    anticipate: "anticipate"
};

// 自定义贝塞尔曲线
const customEase = [0.6, 0.01, -0.05, 0.9];

// ===== Spring 动画 =====
const springTransition = {
    type: "spring",
    stiffness: 100,    // 刚度
    damping: 10,       // 阻尼
    mass: 1,           // 质量
    restDelta: 0.001,
    restSpeed: 0.001
};

// ===== Keyframes 动画 =====
const keyframesTransition = {
    type: "keyframes",
    duration: 2,
    ease: "easeInOut",
    times: [0, 0.2, 0.8, 1],  // 关键帧时间点
    value: [0, 100, 50, 200]   // 关键帧值
};

// ===== 完整配置示例 =====
<motion.div
    animate={{ x: 100 }}
    transition={{
        duration: 0.5,
        ease: "easeInOut",
        delay: 0.1,
        repeat: 2,
        repeatType: "reverse",  // "loop" | "reverse" | "mirror"
        repeatDelay: 0.5
    }}
/>
```

---

## 2. 动画组件

### 2.1 基础动画

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ===== 淡入淡出 =====
const FadeIn = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            Fade In Content
        </motion.div>
    );
};

// ===== 滑动进入 =====
const SlideIn = ({ direction = 'left' }) => {
    const variants = {
        hidden: {
            opacity: 0,
            x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
            y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
        >
            Slide In Content
        </motion.div>
    );
};

// ===== 缩放动画 =====
const ScaleIn = () => {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
        >
            Scale In
        </motion.div>
    );
};

// ===== 旋转动画 =====
const RotateIn = () => {
    return (
        <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            Rotate In
        </motion.div>
    );
};
```

### 2.2 列表动画

```jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ListAnimation = ({ items, onRemove }) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -100 }
    };

    return (
        <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
        >
            <AnimatePresence>
                {items.map((item) => (
                    <motion.li
                        key={item.id}
                        variants={item}
                        layout
                        exit="exit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {item.content}
                        <button onClick={() => onRemove(item.id)}>删除</button>
                    </motion.li>
                ))}
            </AnimatePresence>
        </motion.ul>
    );
};

// 带动画的列表项
const AnimatedList = () => {
    const [items, setItems] = useState([
        { id: 1, content: 'Item 1' },
        { id: 2, content: 'Item 2' },
        { id: 3, content: 'Item 3' }
    ]);

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    return <ListAnimation items={items} onRemove={removeItem} />;
};
```

### 2.3 页面过渡动画

```jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

// 页面变体
const pageVariants = {
    initial: {
        opacity: 0,
        x: -100
    },
    animate: {
       ,
        x: opacity: 1 0,
        transition: {
            duration: 0.3
        }
    },
    exit: {
        opacity: 0,
        x: 100,
        transition: {
            duration: 0.3
        }
    }
};

// 页面组件包装器
const AnimatedPage = ({ children }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            {children}
        </motion.div>
    );
};

// 路由配置
const App = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
                <Route path="/about" element={<AnimatedPage><About /></AnimatedPage>} />
                <Route path="/contact" element={<AnimatedPage><Contact /></AnimatedPage>} />
            </Routes>
        </AnimatePresence>
    );
};
```

### 2.4 加载动画

```jsx
import React from 'react';
import { motion } from 'framer-motion';

// ===== 旋转加载器 =====
const Spinner = () => {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{
                repeat: Infinity,
                duration: 1,
                ease: "linear"
            }}
            style={{
                width: 40,
                height: 40,
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%'
            }}
        />
    );
};

// ===== 脉冲动画 =====
const PulseLoader = () => {
    return (
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1]
            }}
            transition={{
                repeat: Infinity,
                duration: 1.5
            }}
            style={{
                width: 40,
                height: 40,
                backgroundColor: '#3498db',
                borderRadius: '50%'
            }}
        />
    );
};

// ===== 骨架屏加载 =====
const SkeletonLoader = () => {
    return (
        <motion.div
            animate={{
                backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear"
            }}
            style={{
                width: 200,
                height: 20,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                borderRadius: 4
            }}
        />
    );
};

// ===== 进度条 =====
const ProgressBar = ({ progress }) => {
    return (
        <div style={{ width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 }}>
            <motion.div
                style={{
                    height: '100%',
                    backgroundColor: '#3498db',
                    borderRadius: 4
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>
    );
};
```

---

## 3. 手势动画

### 3.1 点击和悬停

```jsx
import React from 'react';
import { motion } from 'framer-motion';

// ===== 点击动画 =====
const ClickableButton = () => {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            style={{
                padding: '12px 24px',
                fontSize: 16,
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
            }}
        >
            Click Me
        </motion.button>
    );
};

// ===== 悬停效果 =====
const HoverCard = () => {
    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
            }}
            style={{
                width: 200,
                height: 200,
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
        >
            Hover Me
        </motion.div>
    );
};

// ===== 按钮组合动画 =====
const AnimatedButton = ({ children, onClick }) => {
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, backgroundColor: '#2980b9' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                padding: '12px 24px',
                fontSize: 16,
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                outline: 'none'
            }}
        >
            {children}
        </motion.button>
    );
};
```

### 3.2 拖拽

```jsx
import React from 'react';
import { motion } from 'framer-motion';

// ===== 基础拖拽 =====
const DraggableBox = () => {
    return (
        <motion.div
            drag
            dragConstraints={{
                left: -100,
                right: 100,
                top: -100,
                bottom: 100
            }}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            style={{
                width: 100,
                height: 100,
                backgroundColor: '#3498db',
                borderRadius: 8,
                cursor: 'grab'
            }}
        />
    );
};

// ===== 拖拽释放动画 =====
const DraggableCard = () => {
    return (
        <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            whileDrag={{ scale: 1.1, rotate: 5 }}
            onDragEnd={(event, info) => {
                console.log('拖拽结束:', info.point);
            }}
            style={{
                width: 200,
                height: 120,
                backgroundColor: 'white',
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
        >
            Drag Me
        </motion.div>
    );
};

// ===== 拖拽释放后弹回 =====
const SnapBackDraggable = () => {
    return (
        <motion.div
            drag
            dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
            dragSnapToOrigin
            whileDrag={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
                width: 100,
                height: 100,
                backgroundColor: '#e74c3c',
                borderRadius: '50%'
            }}
        />
    );
};

// ===== 方向锁定拖拽 =====
const ConstrainedDrag = () => {
    return (
        <motion.div
            drag="x"  // 只允许水平拖拽
            dragConstraints={{ left: -150, right: 150 }}
            whileDrag={{ scale: 1.1 }}
            style={{
                width: 100,
                height: 100,
                backgroundColor: '#9b59b6',
                borderRadius: 8
            }}
        />
    );
};

// ===== 拖拽排序列表 =====
const DraggableList = () => {
    const [items, setItems] = useState([1, 2, 3, 4, 5]);

    return (
        <ul>
            {items.map((item) => (
                <motion.li
                    key={item}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    style={{
                        width: 200,
                        height: 50,
                        backgroundColor: 'white',
                        margin: 8,
                        borderRadius: 8,
                        listStyle: 'none',
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                >
                    Item {item}
                </motion.li>
            ))}
        </ul>
    );
};
```

### 3.3 滚动动画

```jsx
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// ===== 滚动进度动画 =====
const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: '#3498db',
                transformOrigin: '0%',
                scaleX: scrollYProgress
            }}
        />
    );
};

// ===== 滚动视差效果 =====
const ParallaxSection = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

    return (
        <motion.div
            ref={ref}
            style={{ y, opacity }}
            style={{ height: '100vh', padding: 50 }}
        >
            <h1>Parallax Content</h1>
        </motion.div>
    );
};

// ===== 滚动触发动画 =====
const ScrollReveal = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
    const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [0, 360, 720]);

    return (
        <motion.div
            ref={ref}
            style={{
                scale,
                rotate,
                width: 200,
                height: 200,
                backgroundColor: '#3498db',
                borderRadius: 16,
                margin: '100vh auto'
            }}
        />
    );
};

// ===== 滚动切换动画 =====
const ScrollTabs = () => {
    const { scrollY } = useScroll();
    const [activeTab, setActiveTab] = useState(0);

    // 根据滚动位置切换标签
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const tabHeight = window.innerHeight;
            const newTab = Math.floor(scrollPosition / tabHeight);
            setActiveTab(Math.min(newTab, 2));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ height: '300vh' }}>
            <motion.div
                animate={{ x: activeTab * 100 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                    position: 'fixed',
                    top: 20,
                    width: 100,
                    height: 50,
                    backgroundColor: '#e74c3c',
                    borderRadius: 8
                }}
            />
        </div>
    );
};
```

### 3.4 手势识别

```jsx
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// ===== 滑动手势 =====
const SwipeCard = () => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate, opacity }}
        >
            Swipe Me
        </motion.div>
    );
};

// ===== 倾斜效果 =====
const TiltCard = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    return (
        <motion.div
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                x.set(e.clientX - rect.left - rect.width / 2);
                y.set(e.clientY - rect.top - rect.height / 2);
            }}
            onMouseLeave={() => {
                x.set(0);
                y.set(0);
            }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
            }}
        >
            <div style={{ transform: "translateZ(20px)" }}>Tilt Card</div>
        </motion.div>
    );
};

// ===== 长按动画 =====
const LongPressButton = () => {
    const [isPressed, setIsPressed] = useState(false);

    return (
        <motion.button
            onPressStart={() => setIsPressed(true)}
            onPressEnd={() => setIsPressed(false)}
            animate={{
                scale: isPressed ? 0.95 : 1,
                backgroundColor: isPressed ? '#2980b9' : '#3498db'
            }}
        >
            {isPressed ? 'Pressed!' : 'Press Me'}
        </motion.button>
    );
};
```

---

## 4. 布局动画

### 4.1 AnimatePresence

```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== 条件渲染动画 =====
const ConditionalAnimation = () => {
    const [show, setShow] = useState(true);

    return (
        <div>
            <button onClick={() => setShow(!show)}>Toggle</button>
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                    >
                        Animated Content
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ===== 模式切换动画 =====
const ModeSwitch = () => {
    const [mode, setMode] = useState('view');

    return (
        <AnimatePresence mode="wait">
            {mode === 'view' ? (
                <motion.div
                    key="view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    View Mode
                </motion.div>
            ) : (
                <motion.div
                    key="edit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                >
                    Edit Mode
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ===== 多个元素动画 =====
const MultipleElements = () => {
    const [items, setItems] = useState([1, 2, 3]);

    return (
        <AnimatePresence>
            {items.map(item => (
                <motion.div
                    key={item}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                >
                    {item}
                </motion.div>
            ))}
        </AnimatePresence>
    );
};
```

### 4.2 layout 动画

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ===== 列表重排动画 =====
const ReorderableList = () => {
    const [items, setItems] = useState(['A', 'B', 'C', 'D']);

    const reorder = () => {
        setItems([...items].sort(() => Math.random() - 0.5));
    };

    return (
        <div>
            <button onClick={reorder}>Shuffle</button>
            {items.map(item => (
                <motion.div
                    key={item}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        width: 200,
                        height: 50,
                        margin: 8,
                        backgroundColor: '#3498db',
                        borderRadius: 8
                    }}
                >
                    {item}
                </motion.div>
            ))}
        </div>
    );
};

// ===== 网格布局动画 =====
const GridLayout = () => {
    const [columns, setColumns] = useState(3);

    return (
        <div>
            <button onClick={() => setColumns(columns === 3 ? 4 : 3)}>
                Change Columns
            </button>
            <motion.div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: 16
                }}
            >
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            height: 100,
                            backgroundColor: '#3498db',
                            borderRadius: 8
                        }}
                    />
                ))}
            </motion.div>
        </div>
    );
};

// ===== 模态框动画 =====
const Modal = ({ isOpen, onClose, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 遮罩层 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)'
                        }}
                    />
                    {/* 模态框内容 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'white',
                            padding: 24,
                            borderRadius: 12,
                            maxWidth: 500
                        }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
```

### 4.3 共享布局动画

```jsx
import React from 'react';
import { motion } from 'framer-motion';

// ===== 共享元素动画 =====
const SharedElement = () => {
    return (
        <motion.div
            layoutId="shared-element"
            style={{
                width: 100,
                height: 100,
                backgroundColor: '#3498db',
                borderRadius: 8
            }}
        />
    );
};

// ===== 图片画廊 =====
const Gallery = () => {
    const [selectedId, setSelectedId] = useState(null);

    const items = [
        { id: 1, color: '#e74c3c' },
        { id: 2, color: '#3498db' },
        { id: 3, color: '#2ecc71' }
    ];

    return (
        <div>
            <div style={{ display: 'flex', gap: 16 }}>
                {items.map(item => (
                    <motion.div
                        key={item.id}
                        layoutId={`card-${item.id}`}
                        onClick={() => setSelectedId(item.id)}
                        style={{
                            width: 100,
                            height: 100,
                            backgroundColor: item.color,
                            borderRadius: 8,
                            cursor: 'pointer'
                        }}
                    />
                ))}
            </div>

            {selectedId && (
                <motion.div
                    layoutId={`card-${selectedId}`}
                    onClick={() => setSelectedId(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                >
                    <motion.div
                        style={{
                            width: 300,
                            height: 300,
                            backgroundColor: items.find(i => i.id === selectedId).color,
                            borderRadius: 16
                        }}
                    />
                </motion.div>
            )}
        </div>
    );
};
```

---

## 5. 项目中的动画实现

### 5.1 页面切换动画

```jsx
// 项目中的页面切换组件
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

// 页面切换变体
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.98,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 1, 1]
        }
    }
};

// 内容入场动画
const contentVariants = {
    initial: { opacity: 0, y: 10 },
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    }
};

// 页面容器组件
export const PageWrapper = ({ children }) => {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
};

// 页面内容入场动画
export const ContentWrapper = ({ children, delay = 0 }) => {
    return (
        <motion.div
            variants={contentVariants}
            initial="initial"
            animate="enter"
            transition={{ delay }}
        >
            {children}
        </motion.div>
    );
};

// 路由配置
export const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <PageWrapper>
                            <ContentWrapper>
                                <HomePage />
                            </ContentWrapper>
                        </PageWrapper>
                    }
                />
                <Route
                    path="/about"
                    element={
                        <PageWrapper>
                            <ContentWrapper delay={0.1}>
                                <AboutPage />
                            </ContentWrapper>
                        </PageWrapper>
                    }
                />
            </Routes>
        </AnimatePresence>
    );
};
```

### 5.2 卡片动画组件

```jsx
// 项目中的动画卡片组件
import React from 'react';
import { motion } from 'framer-motion';

// 卡片变体
const cardVariants = {
    hover: {
        y: -8,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    tap: {
        scale: 0.98,
        transition: {
            duration: 0.1
        }
    }
};

// 入场动画
const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.4,
            ease: "easeOut"
        }
    })
};

// 动画卡片组件
export const AnimatedCard = ({
    children,
    onClick,
    className,
    delay = 0,
    style = {}
}) => {
    return (
        <motion.div
            custom={delay}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
            onClick={onClick}
            className={className}
            style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            {children}
        </motion.div>
    );
};

// 卡片网格组件
export const CardGrid = ({ children, columns = 3 }) => {
    return (
        <motion.div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 24
            }}
        >
            {children}
        </motion.div>
    );
};
```

### 5.3 列表动画组件

```jsx
// 项目中的动画列表组件
import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// 列表项变体
const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3
        }
    }),
    exit: { opacity: 0, x: 20, height: 0 }
};

// 动画列表组件
export const AnimatedList = ({
    items,
    onReorder,
    onDelete,
    renderItem,
    keyExtractor = (item) => item.id
}) => {
    return (
        <motion.ul
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.li
                        key={keyExtractor(item)}
                        custom={index}
                        variants={listItemVariants}
                        layout
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{ backgroundColor: '#f5f5f5' }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            marginBottom: 8,
                            backgroundColor: 'white',
                            border: '1px solid #eee'
                        }}
                    >
                        {renderItem(item, index)}
                    </motion.li>
                ))}
            </AnimatePresence>
        </motion.ul>
    );
};

// 可拖拽列表
export const DraggableList = ({ items, onReorder }) => {
    const [list, setList] = useState(items);

    return (
        <Reorder.Group
            axis="y"
            values={list}
            onReorder={setList}
            style={{ listStyle: 'none', padding: 0 }}
        >
            {list.map((item) => (
                <Reorder.Item
                    key={item.id}
                    value={item}
                    style={{
                        padding: 16,
                        marginBottom: 8,
                        backgroundColor: 'white',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {item.content}
                </Reorder.Item>
            ))}
        </Reorder.Group>
    );
};
```

### 5.4 加载和过渡动画

```jsx
// 项目中的加载和过渡动画组件
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 骨架屏加载动画
export const Skeleton = ({ width, height, borderRadius = 8 }) => {
    return (
        <motion.div
            animate={{
                backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear"
            }}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%'
            }}
        />
    );
};

// 卡片加载骨架
export const CardSkeleton = () => {
    return (
        <div style={{ padding: 20, backgroundColor: 'white', borderRadius: 16 }}>
            <Skeleton width="100%" height={24} />
            <div style={{ height: 16 }} />
            <Skeleton width="80%" height={16} />
            <div style={{ height: 16 }} />
            <Skeleton width="60%" height={16} />
        </div>
    );
};

// 页面加载过渡
export const PageTransition = ({ isLoading, children }) => {
    return (
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <CardSkeleton />
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// 按钮加载状态
export const LoadingButton = ({ loading, children, onClick, ...props }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            disabled={loading}
            style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#95a5a6' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                ...props.style
            }}
        >
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Loading...
                    </motion.span>
                ) : (
                    <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
```

### 5.5 模态框和抽屉动画

```jsx
// 项目中的模态框动画组件
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 动画配置
const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.2
        }
    }
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// 模态框组件
export const AnimatedModal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 遮罩层 */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1000
                        }}
                    />
                    {/* 模态框内容 */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: 500,
                            maxHeight: '80vh',
                            backgroundColor: 'white',
                            borderRadius: 16,
                            padding: 24,
                            overflow: 'auto',
                            zIndex: 1001,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <h2 style={{ margin: 0 }}>{title}</h2>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 24,
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// 抽屉组件
export const AnimatedDrawer = ({ isOpen, onClose, position = 'right', children }) => {
    const variants = {
        hidden: {
            [position === 'right' ? 'x' : 'y']: '100%'
        },
        visible: {
            [position === 'right' ? 'x' : 'y']: 0,
            transition: {
                type: "spring",
                damping: 30,
                stiffness: 300
            }
        },
        exit: {
            [position === 'right' ? 'x' : 'y']: '100%'
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1000
                        }}
                    />
                    <motion.div
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            [position]: 0,
                            width: position === 'right' || position === 'left' ? 400 : '100%',
                            height: position === 'top' || position === 'bottom' ? '50vh' : '100%',
                            backgroundColor: 'white',
                            zIndex: 1001,
                            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)'
                        }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
```

---

## 6. FLIP 动画技术深度解析

### 6.1 FLIP 动画原理

FLIP (First, Last, Invert, Play) 是一种布局动画技术，通过记录元素位置的变化来创建平滑的过渡动画。

```javascript
// ===== FLIP 动画核心源码原理 =====

function flipAnimate(element, targetPosition, options = {}) {
    const {
        duration = 300,
        ease = 'ease-in-out',
        onPlay = null,
        onEnd = null
    } = options;

    // ===== FIRST =====
    // 记录元素的初始位置和尺寸
    const first = getBoundingClientRect(element);

    // ===== 应用布局变化 =====
    // (由外部触发，例如改变元素的父容器或 class)

    // ===== LAST =====
    // 记录变化后的位置和尺寸
    const last = getBoundingClientRect(element);

    // ===== INVERT =====
    // 计算变换矩阵，让元素看起来还在原始位置
    const delta = {
        x: first.left - last.left,
        y: first.top - last.top,
        scaleX: first.width / last.width,
        scaleX: first.height / last.height
    };

    // 应用逆变换
    element.style.transform = `
        translate(${delta.x}px, ${delta.y}px)
        scale(${delta.scaleX}, ${delta.scaleY})
    `;
    element.style.transformOrigin = '0 0';

    // 强制重绘
    element.getBoundingClientRect();

    // ===== PLAY =====
    // 动画到新位置
    const animation = element.animate([
        {
            transform: `
                translate(${delta.x}px, ${delta.y}px)
                scale(${delta.scaleX}, ${delta.scaleY})
            `
        },
        {
            transform: 'translate(0, 0) scale(1, 1)'
        }
    ], {
        duration,
        easing: ease,
        fill: 'forwards'
    });

    // 触发回调
    onPlay && onPlay(animation);

    // 清理
    animation.onfinish = () => {
        element.style.transform = '';
        element.style.transformOrigin = '';
        onEnd && onEnd();
    };

    return animation;
}

// ===== 获取精确的边界矩形 =====
function getBoundingClientRect(element) {
    const rect = element.getBoundingClientRect();

    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
    };
}

// ===== 比较两个位置是否相同 =====
function positionsEqual(pos1, pos2) {
    return (
        pos1.left === pos2.left &&
        pos1.top === pos2.top &&
        pos1.width === pos2.width &&
        pos1.height === pos2.height
    );
}
```

### 6.2 LayoutGroup 布局动画实现

```javascript
// ===== LayoutGroup 源码实现原理 =====

import { useId } from 'react';

class LayoutGroup {
    constructor() {
        this.children = new Map();      // 子元素映射
        this.positions = new Map();     // 位置缓存
        this.isAnimating = false;      // 动画状态
        this.groupId = useId();         // 唯一 ID
    }

    // ===== 注册子元素 =====
    registerChild(id, element) {
        this.children.set(id, element);

        // 记录初始位置
        const position = this._getLayoutBox(element);
        this.positions.set(id, position);

        // 设置数据属性
        element.dataset.layoutId = id;
        element.dataset.layoutGroup = this.groupId;

        return element;
    }

    // ===== 移除子元素 =====
    unregisterChild(id) {
        this.children.delete(id);
        this.positions.delete(id);
    }

    // ===== 测量布局变化 =====
    measureLayout() {
        const changes = [];

        for (const [id, element] of this.children) {
            // 获取当前位置
            const currentPosition = this._getLayoutBox(element);
            const previousPosition = this.positions.get(id);

            // 比较位置
            if (previousPosition && !this._positionsEqual(currentPosition, previousPosition)) {
                changes.push({
                    id,
                    element,
                    previous: previousPosition,
                    current: currentPosition
                });
            }

            // 更新缓存
            this.positions.set(id, currentPosition);
        }

        return changes;
    }

    // ===== 执行布局动画 =====
    animateLayout(options = {}) {
        if (this.isAnimating) return;

        const changes = this.measureLayout();

        if (changes.length === 0) return;

        this.isAnimating = true;

        const { duration, ease, type } = {
            duration: 300.00,
            ease: [0.25, 0.1, 0.25, 1],
            type: 'spring',
            ...options
        };

        const animations = [];

        for (const change of changes) {
            const { element, previous, current } = change;

            // 计算变换
            const delta = {
                x: previous.left - current.left,
                y: previous.top - current.top,
                scaleX: previous.width / current.width,
                scaleY: previous.height / current.height
            };

            // 应用逆变换
            element.style.transform = `
                translate(${delta.x}px, ${delta.y}px)
                scale(${delta.scaleX}, ${delta.scaleY})
            `;
            element.style.transformOrigin = '0 0';

            // 强制重绘
            element.getBoundingClientRect();

            // 创建动画
            const animation = element.animate([
                {
                    transform: `
                        translate(${delta.x}px, ${delta.y}px)
                        scale(${delta.scaleX}, ${delta.scaleY})
                    `,
                    opacity: 1

                {
                    transform: 'translate(0, 0) scale(1, 1)',
                    opacity: 1
                }
            ], {
                duration,
                easing: ease,
                fill: 'forwards'
            });

            animations.push({ animation, element });
        }

        // 等待所有动画完成
        Promise.all(animations.map(a => a.animation.finished))
            .then(() => {
                // 清理样式
                animations.forEach(({ element }) => {
                    element.style.transform = '';
                    element.style.transformOrigin = '';
                });
                this.isAnimating = false;
            });

        return animations;
    }

    // ===== 获取布局盒模型 =====
    _getLayoutBox(element) {
        const rect = element.getBoundingClientRect();

        return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        };
    }

    // ===== 比较位置 =====
    _positionsEqual(pos1, pos2) {
        const epsilon = 0.1;
        return (
            Math.abs(pos1.left - pos2.left) < epsilon &&
            Math.abs(pos1.top - pos2.top) < epsilon &&
            Math.abs(pos1.width - pos2.width) < epsilon &&
            Math.abs(pos1.height - pos2.height) < epsilon
        );
    }
}
```

### 6.3 MotionValue 状态系统

```javascript
// ===== MotionValue 源码实现原理 =====

class MotionValue {
    constructor(initial, options = {}) {
        this._value = initial;            // 当前值
        this._previous = undefined;       // 上一帧的值
        this._target = initial;           // 目标值
        this._observers = new Set();     // 观察者集合

        // ===== 动画配置 =====
        this._velocity = 0;              // 速度
        this._isAnimating = false;        // 动画状态
        this._animation = null;            // 当前动画

        // ===== 过渡配置 =====
        this.transition = {
            type: 'tween',
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
            ...options.transition
        };
    }

    // ===== 获取当前值 =====
    get() {
        return this._value;
    }

    // ===== 设置新值 =====
    set(value, transition = undefined) {
        // 停止当前动画
        if (this._animation) {
            this._animation.stop();
        }

        // 更新过渡配置
        if (transition !== undefined) {
            this.transition = transition;
        }

        // 设置目标值
        this._target = value;

        // 启动动画
        this._startAnimation();
    }

    // ===== 启动动画 =====
    _startAnimation() {
        if (this._isAnimating) return;

        this._isAnimating = true;
        this._previous = this._value;

        const { type, duration, ease, stiffness, damping } = this.transition;

        if (type === 'spring') {
            this._animation = this._springAnimation(stiffness, damping);
        } else {
            this._animation = this._tweenAnimation(duration, ease);
        }

        this._animation.start();
    }

    // ===== 补间动画 =====
    _tweenAnimation(duration, ease) {
        const startTime = performance.now();
        const startValue = this._value;
        const endValue = this._target;
        const delta = endValue - startValue;

        let isRunning = true;

        return {
            start: () => {
                const animate = (currentTime) => {
                    if (!isRunning) return;

                    const elapsed = (currentTime - startTime) / 1000;
                    const progress = Math.min(elapsed / duration, 1);

                    // 应用缓动函数
                    const easedProgress = this._applyEasing(progress, ease);

                    // 计算当前值
                    this._value = startValue + delta * easedProgress;

                    // 更新速度 (用于过渡)
                    this._velocity = delta * (1 - easedProgress) / duration;

                    // 通知观察者
                    this._notifyObservers();

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this._isAnimating = false;
                        this._value = endValue;
                        this._notifyObservers();
                    }
                };

                requestAnimationFrame(animate);
            },

            stop: () => {
                isRunning = false;
                this._isAnimating = false;
            }
        };
    }

    // ===== 弹簧动画 =====
    _springAnimation(stiffness = 100, damping = 10) {
        const restDelta = 0.001;
        const restSpeed = 0.001;

        let isRunning = true;
        let lastTime = performance.now();

        return {
            start: () => {
                const animate = (currentTime) => {
                    if (!isRunning) return;

                    const deltaTime = (currentTime - lastTime) / 1000;
                    lastTime = currentTime;

                    // 弹簧物理模拟
                    const displacement = this._target - this._value;
                    const springForce = stiffness * displacement;
                    const dampingForce = -damping * this._velocity;

                    const acceleration = springForce + dampingForce;
                    this._velocity += acceleration * deltaTime;
                    this._value += this._velocity * deltaTime;

                    // 通知观察者
                    this._notifyObservers();

                    // 检查是否静止
                    const isResting = (
                        Math.abs(this._velocity) < restSpeed &&
                        Math.abs(displacement) < restDelta
                    );

                    if (!isResting) {
                        requestAnimationFrame(animate);
                    } else {
                        this._isAnimating = false;
                        this._value = this._target;
                        this._velocity = 0;
                        this._notifyObservers();
                    }
                };

                requestAnimationFrame(animate);
            },

            stop: () => {
                isRunning = false;
                this._isAnimating = false;
            }
        };
    }

    // ===== 应用缓动函数 =====
    _applyEasing(progress, ease) {
        if (typeof ease === 'string') {
            return this._presetEasing(progress, ease);
        } else if (Array.isArray(ease)) {
            // 贝塞尔曲线
            return this._bezier(progress, ease[0], ease[1], ease[2], ease[3]);
        }
        return progress;
    }

    // ===== 预设缓动函数 =====
    _presetEasing(t, name) {
        const presets = {
            linear: t => t,
            ease: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        };

        const fn = presets[name] || presets.ease;
        return fn(t);
    }

    // ===== 贝塞尔曲线 =====
    _bezier(t, x1, y1, x2, y2) {
        // 三次贝塞尔曲线
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;

        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;

        // 求解 t 对应的 y 值
        const sampleCurveX = t => (ax * t + bx) * t + cx * t;
        const sampleCurveY = t => (ay * t + by) * t + cy * t;

        // Newton-Raphson 迭代求逆
        let t0 = t;
        for (let i = 0; i < 8; i++) {
            const x = sampleCurveX(t0) - t;
            const d = (3 * ax * t0 + 2 * bx) * t0 + cx;
            if (Math.abs(d) < 1e-6) break;
            t0 -= x / d;
        }

        return sampleCurveY(t0);
    }

    // ===== 添加观察者 =====
    onChange(callback) {
        this._observers.add(callback);
        return () => this._observers.delete(callback);
    }

    // ===== 通知观察者 =====
    _notifyObservers() {
        for (const observer of this._observers) {
            observer(this._value, this._previous);
        }
    }

    // ===== 重置值 =====
    reset() {
        if (this._animation) {
            this._animation.stop();
        }
        this._value = 0;
        this._velocity = 0;
        this._isAnimating = false;
    }
}
```

### 6.4 AnimatePresence 过渡系统

```javascript
// ===== AnimatePresence 源码实现原理 =====

import { useEffect, useRef } from 'react';

function AnimatePresence({ children, mode = 'popLayout', initial = true }) {
    const exitingChildren = useRef(new Map());
    const containerRef = useRef(null);

    useEffect(() => {
        const currentChildren = new Map();

        // 收集当前所有子元素
        React.Children.forEach(children, (child) => {
            if (React.isValidElement(child)) {
                currentChildren.set(child.key, child);
            }
        });

        // 识别需要退出动画的子元素
        const toRemove = [];
        for (const [key, child] of exitingChildren.current) {
            if (!currentChildren.has(key)) {
                toRemove.push([key, child]);
            }
        }

        // 执行退出动画
        toRemove.forEach(([key, child]) => {
            const element = document.querySelector(`[data-presence-id="${key}"]`);

            if (element) {
                // 应用退出动画
                const animation = element.animate(child.props.exit, {
                    duration: child.props.exit?.transition?.duration || 300,
                    fill: 'forwards'
                });

                // 动画完成后移除 DOM
                animation.onfinish = () => {
                    element.remove();
                    exitingChildren.current.delete(key);
                };
            }
        });

        // 更新缓存
        exitingChildren.current = currentChildren;

    }, [children]);

    return (
        <div ref={containerRef}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    const key = child.key;
                    const isExiting = exitingChildren.current.has(key);

                    // 添加进入动画
                    const enterAnimation = initial && !isExiting ? {
                        ...child.props.enter,
                        transition: child.props.enter?.transition
                    } : null;

                    return React.cloneElement(child, {
            'data-presence-id': key,
                        enter: enterAnimation,
                        onAnimationComplete: (type) => {
                            child.props.onAnimationComplete?.(type);
                        }
                    });
                }
                return child;
            })}
        </div>
    );
}

// ===== Presence 动画管理器 =====

class PresenceManager {
    constructor() {
        this.elements = new Map();
        this.animations = new Map();
    }

    // ===== 添加元素 =====
    add(id, element, config) {
        this.elements.set(id, { element, config });
    }

    // ===== 移除元素 =====
    remove(id) {
        const { element, config } = this.elements.get(id);

        if (!element) return;

        // 执行退出动画
        const animation = element.animate(config.exit, {
            duration: config.exit?.transition?.duration || 300,
            fill: 'forwards'
        });

        this.animations.set(id, animation);

        // 动画完成后清理
        animation.onfinish = () => {
            element.remove();
            this.elements.delete(id);
            this.animations.delete(id);
        };

        return animation;
    }

    // ===== 取消动画 =====
    cancel(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.cancel();
            this.animations.delete(id);
        }
    }
}
```

### 6.5 手势识别系统

```javascript
// ===== 手势识别源码实现原理 =====

class GestureRecognizer {
    constructor(element, config = {}) {
        this.element = element;
        this.config = {
            drag: config.drag || false,
            hover: config.hover || false,
            tap: config.tap || false,
            press: config.press || false,
            pan: config.pan || false,
            pinch: config.pinch || false,
            ...config
        };

        // ===== 手势状态 =====
        this.state = {
            isDragging: false,
            isHovering: false,
            isPressing: false,
            isPanning: false,
            isPinching: false,

            // ===== 位置信息 =====
            pointer: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },

            // ===== 缩放信息 =====
            scale: 1,
            deltaScale: 0,

            // ===== 时间信息 =====
            time: 0,
            duration: 0,

            // ===== 触摸信息 =====
            touches: [],
            numTouches: 0
        };

        this._lastPointer = { x: 0, y: 0 };
        this._lastTime = 0;
        this._startTime = 0;
        this._startPointer = { x: 0, y: 0 };

        // ===== 事件处理 =====
        this._setupEventListeners();
    }

    _setupEventListeners() {
        const el = this.element;

        // ===== 鼠标事件 =====
        if (this.config.drag) {
            el.addEventListener('mousedown', this._handlePointerDown.bind(this));
            el.addEventListener('mousemove', this._handlePointerMove.bind(this));
            el.addEventListener('mouseup', this._handlePointerUp.bind(this));
            el.addEventListener('mouseleave', this._handlePointerUp.bind(this));
        }

        if (this.config.hover) {
            el.addEventListener('mouseenter', this._handleHoverStart.bind(this));
            el.addEventListener('mouseleave', this._handleHoverEnd.bind(this));
        }

        // ===== 触摸事件 =====
        if (this.config.pan || this.config.pinch) {
            el.addEventListener('touchstart', this._handleTouchStart.bind(this));
            el.addEventListener('touchmove', this._handleTouchMove.bind(this));
            el.addEventListener('touchend', this._handleTouchEnd.bind(this));
        }

        // ===== 滚动事件 =====
        if (this.config.scroll) {
            el.addEventListener('wheel', this._handleScroll.bind(this));
        }
    }

    // ===== 指针按下 =====
    _handlePointerDown(event) {
        event.preventDefault();

        this._startTime = performance.now();
        this._startPointer = { x: event.clientX, y: event.clientY };
        this._lastPointer = { x: event.clientX, y: event.clientY };
        this._lastTime = this._startTime;

        this.state.isDragging = true;
        this.state.pointer = { x: event.clientX, y: event.clientY };
        this.state.velocity = { x: 0, y: 0 };
        this.state.delta = { x: 0, y: 0 };
        this.state.offset = { x: 0, y: 0 };

        this.config.onDragStart?.(this.state);
    }

    // ===== 指针移动 =====
    _handlePointerMove(event) {
        if (!this.state.isDragging) return;

        event.preventDefault();

        const now = performance.now();
        const pointer = { x: event.clientX, y: event.clientY };

        // 计算增量
        const delta = {
            x: pointer.x - this._lastPointer.x,
            y: pointer.y - this._lastPointer.y
        };

        // 计算速度
        const deltaTime = now - this._lastTime;
        const velocity = {
            x: delta.x / deltaTime * 1000,
            y: delta.y / deltaTime * 1000
        };

        // 计算总偏移
        const offset = {
            x: pointer.x - this._startPointer.x,
            y: pointer.y - this._startPointer.y
        };

        // 更新状态
        this._lastPointer = pointer;
        this._lastTime = now;

        this.state.pointer = pointer;
        this.state.delta = delta;
        this.state.velocity = velocity;
        this.state.offset = offset;
        this.state.duration = (now - this._startTime) / 1000;

        this.config.onDrag?.(this.state);
    }

    // ===== 指针抬起 =====
    _handlePointerUp(event) {
        if (!this.state.isDragging) return;

        this.state.isDragging = false;
        this.config.onDragEnd?.(this.state);
    }

    // ===== 触摸开始 =====
    _handleTouchStart(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);
        this.state.touches = touches;
        this.state.numTouches = touches.length;

        if (touches.length === 1) {
            // 单指操作 (Pan)
            this.state.isPanning = true;
            this._startPointer = { x: touches[0].clientX, y: touches[0].clientY };
            this.config.onPanStart?.(this.state);
        } else if (touches.length === 2) {
            // 双指操作 (Pinch)
            this.state.isPinching = true;
            const distance = this._getTouchDistance(touches);
            this._startScale = 1;
            this._startDistance = distance;
            this.config.onPinchStart?.(this.state);
        }
    }

    // ===== 触摸移动 =====
    _handleTouchMove(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);
        this.state.touches = touches;
        this.state.numTouches = touches.length;

        if (this.state.isPanning && touches.length === 1) {
            const pointer = { x: touches[0].clientX, y: touches[0].clientY };
            const delta = {
                x: pointer.x - this._startPointer.x,
                y: pointer.y - this._startPointer.y
            };

            this.state.delta = delta;
            this.config.onPan?.(this.state);
        } else if (this.state.isPinching && touches.length === 2) {
            const distance = this._getTouchDistance(touches);
            const scale = distance / this._startDistance;
            const deltaScale = scale - this.state.scale;

            this.state.scale = scale;
            this.state.deltaScale = deltaScale;
            this.config.onPinch?.(this.state);
        }
    }

    // ===== 触摸结束 =====
    _handleTouchEnd(event) {
        const touches = Array.from(event.touches);
        this.state.touches = touches;
        this.state.numTouches = touches.length;

        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.config.onPanEnd?.(this.state);
        } else if (this.state.isPinching) {
            this.state.isPinching = false;
            this.config.onPinchEnd?.(this.state);
        }
    }

    // ===== 悬停开始 =====
    _handleHoverStart(event) {
        this.state.isHovering = true;
        this.state.pointer = { x: event.clientX, y: event.clientY };
        this.config.onHoverStart?.(this.state);
    }

    // ===== 悬停结束 =====
    _handleHoverEnd(event) {
        this.state.isHovering = false;
        this.config.onHoverEnd?.(this.state);
    }

    // ===== 滚动 =====
    _handleScroll(event) {
        this.state.scroll = {
            x: event.deltaX,
            y: event.deltaY
        };
        this.config.onScroll?.(this.state);
    }

    // ===== 计算触摸距离 =====
    _getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ===== 销毁 =====
    destroy() {
        const el = this.element;

        el.removeEventListener('mousedown', this._handlePointerDown.bind(this));
        el.removeEventListener('mousemove', this._handlePointerMove.bind(this));
        el.removeEventListener('mouseup', this._handlePointerUp.bind(this));
        el.removeEventListener('mouseleave', this._handlePointerUp.bind(this));
        el.removeEventListener('mouseenter', this._handleHoverStart.bind(this));
        el.removeEventListener('mouseleave', this._handleHoverEnd.bind(this));
        el.removeEventListener('touchstart', this._handleTouchStart.bind(this));
        el.removeEventListener('touchmove', this._handleTouchMove.bind(this));
        el.removeEventListener('touchend', this._handleTouchEnd.bind(this));
        el.removeEventListener('wheel', this._handleScroll.bind(this));
    }
}
```

---

## 总结

Framer Motion 动画实战教程涵盖了从基础到高级的所有动画技术。通过本教程，你应该能够：

1. **基础概念**：理解 Framer Motion 的声明式动画 API
2. **动画组件**：创建淡入淡出、滑动、缩放等基础动画
3. **手势动画**：实现点击、悬停、拖拽等交互式动画
4. **布局动画**：使用 AnimatePresence 和 LayoutGroup 实现列表动画
5. **项目实践**：构建实际的动画组件
6. **FLIP 技术**：理解 First-Last-Invert-Play 布局动画原理
7. **MotionValue**：掌握动画状态系统和值管理
8. **手势识别**：理解拖拽、缩放、旋转等手势实现
9. **性能优化**：掌握动画性能优化技巧

在 WebEnv 项目中，Framer Motion 用于实现流畅的 UI 动画、窗口过渡效果、交互反馈等，为用户提供优秀的视觉体验。

Framer Motion 是 React 生态中最强大的动画库之一。通过本教程，你应该能够：

1. **基础动画**：理解 Framer Motion 的核心概念和 API
2. **动画组件**：创建各种类型的动画效果
3. **手势动画**：实现点击、悬停、拖拽等交互动画
4. **布局动画**：使用 AnimatePresence 和 layout 属性创建流畅的布局变化动画
5. **项目实践**：构建实际的页面切换、卡片、列表、模态框等组件

在 WebEnv 项目中，Framer Motion 用于实现流畅的用户界面动画，包括页面过渡、列表动画、拖拽交互、模态框动画等，为用户提供流畅和愉悦的使用体验。

---

## 参考资源

- [Framer Motion 官方文档](https://www.framer.com/motion/)
- [Framer Motion GitHub](https://github.com/framer/motion)
- [Framer Motion 示例](https://www.framer.com/motion/examples/)
