# UnifiedLayout 组件

## 概述

UnifiedLayout(统一布局管理器)是 FastDocument 的核心布局组件,负责管理应用的整体布局结构。该组件实现了响应式设计,根据设备类型(桌面、平板、手机)自动切换不同的布局模式,并提供统一的侧边栏、头部导航、内容区域管理。

## 核心特性

- **响应式布局**: 自动适配桌面、平板、手机设备
- **主题切换**: 支持明暗主题无缝切换
- **布局状态持久化**: 保存用户的布局偏好到 localStorage
- **动画过渡**: 布局切换时平滑过渡效果
- **模块化设计**: 独立的移动端和平板布局组件

## Props 接口

```typescript
interface UnifiedLayoutProps {
  // 页面内容
  children: React.ReactNode;

  // 布局配置
  defaultSidebarCollapsed?: boolean;
  defaultMobileLayout?: boolean;
  defaultTabletLayout?: boolean;

  // 侧边栏配置
  sidebarWidth?: number;
  sidebarCollapsible?: boolean;
  showSidebar?: boolean;

  // 头部配置
  fixedHeader?: boolean;
  headerHeight?: number;

  // 回调
  onLayoutChange?: (layout: LayoutState) => void;
  onSidebarToggle?: (collapsed: boolean) => void;

  // 样式
  className?: string;
}

interface LayoutState {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  headerVisible: boolean;
}
```

## 内部状态

```typescript
interface UnifiedLayoutState {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;        // 移动端侧边栏显示状态
  headerVisible: boolean;
  isMobileMenuOpen: boolean;
  isTabletMenuOpen: boolean;
  theme: 'light' | 'dark';
  lastLayoutState: LayoutState;
}
```

## 核心逻辑实现

### 1. 设备类型检测

```typescript
const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  defaultSidebarCollapsed = false,
  sidebarWidth = 280,
}) => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);

  // 设备类型检测
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setDeviceType('mobile');
        setSidebarCollapsed(true);
      } else if (width < 1024) {
        setDeviceType('tablet');
        setSidebarCollapsed(true);
      } else {
        setDeviceType('desktop');
        setSidebarCollapsed(defaultSidebarCollapsed);
      }
    };

    // 初始检测
    checkDeviceType();

    // 监听窗口大小变化
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      checkDeviceType();
    };

    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('resize', checkDeviceType);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', checkDeviceType);
    };
  }, [defaultSidebarCollapsed]);

  // 根据设备类型渲染不同布局
  const renderLayout = () => {
    switch (deviceType) {
      case 'mobile':
        return (
          <MobileLayout
            sidebarWidth={sidebarWidth}
            onSidebarToggle={(open) => setSidebarOpen(open)}
          >
            {children}
          </MobileLayout>
        );

      case 'tablet':
        return (
          <TabletLayout
            sidebarWidth={sidebarWidth}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
          >
            {children}
          </TabletLayout>
        );

      case 'desktop':
      default:
        return (
          <DesktopLayout
            sidebarWidth={sidebarWidth}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
          >
            {children}
          </DesktopLayout>
        );
    }
  };

  return (
    <ThemeProvider>
      <LayoutStateContext.Provider value={{ deviceType, sidebarCollapsed }}>
        <div className="unified-layout">
          {renderLayout()}
        </div>
      </LayoutStateContext.Provider>
    </ThemeProvider>
  );
};
```

### 2. 布局状态持久化

```typescript
// 使用 Zustand 持久化布局状态
const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'light',

      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      setTheme: (theme: 'light' | 'dark') => set({ theme }),

      // 从 localStorage 恢复状态
      hydrate: () => {
        const saved = localStorage.getItem('layout-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          set(parsed);
        }
      },
    }),
    {
      name: 'fastdoc-layout-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
```

### 3. 侧边栏折叠动画

```typescript
const SidebarWrapper: React.FC<{
  collapsed: boolean;
  width: number;
  children: React.ReactNode;
}> = ({ collapsed, width, children }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={sidebarRef}
      initial={false}
      animate={{
        width: collapsed ? 64 : width,
        opacity: collapsed ? 0.8 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="sidebar-wrapper"
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          width: collapsed ? 64 : width,
          transition: 'width 0.2s ease',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
```

### 4. 响应式内容区域

```typescript
const ContentArea: React.FC<{
  deviceType: 'desktop' | 'tablet' | 'mobile';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  children: React.ReactNode;
}> = ({ deviceType, sidebarCollapsed, sidebarWidth, children }) => {
  const getMarginLeft = () => {
    if (deviceType === 'mobile') return 0;
    if (deviceType === 'tablet') return 64; // 平板侧边栏收起宽度
    return sidebarCollapsed ? 64 : sidebarWidth;
  };

  return (
    <motion.main
      className="content-area"
      animate={{
        marginLeft: getMarginLeft(),
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      style={{
        minHeight: '100vh',
        padding: deviceType === 'mobile' ? '16px' : '24px',
      }}
    >
      {children}
    </motion.main>
  );
};
```

## 性能优化点

### 1. 使用 React.memo 避免不必要渲染

```typescript
const LayoutComponent = React.memo<{
  children: React.ReactNode;
  sidebarCollapsed: boolean;
}>(({ children, sidebarCollapsed }) => {
  return <div className={sidebarCollapsed ? 'collapsed' : ''}>{children}</div>;
}, (prevProps, nextProps) => {
  return prevProps.sidebarCollapsed === nextProps.sidebarCollapsed;
});
```

### 2. 事件节流

```typescript
// 窗口 resize 事件使用节流
const handleResize = useMemo(
  () => throttle(() => {
    checkDeviceType();
  }, 200),
  []
);
```

### 3. CSS Containment

```typescript
// 使用 CSS contain 属性优化渲染性能
.sidebar {
  contain: layout style paint;
  will-change: transform;
}
```

## 使用示例

### 基本用法

```tsx
import { UnifiedLayout } from '@/components/UnifiedLayout';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

function AppLayout() {
  return (
    <UnifiedLayout
      defaultSidebarCollapsed={false}
      sidebarWidth={280}
    >
      <Header />
      <main className="main-content">
        {/* 页面内容 */}
      </main>
      <Sidebar />
    </UnifiedLayout>
  );
}
```

### 自定义布局行为

```tsx
<UnifiedLayout
  defaultSidebarCollapsed={true}
  onLayoutChange={(layout) => {
    console.log('Layout changed:', layout);
  }}
  onSidebarToggle={(collapsed) => {
    console.log('Sidebar toggled:', collapsed);
  }}
>
  {/* 内容 */}
</UnifiedLayout>
```

## 依赖组件

- **MobileLayout**: 移动端布局组件
- **TabletLayout**: 平板端布局组件
- **DesktopLayout**: 桌面端布局组件
- **Sidebar**: 侧边栏组件
- **Header**: 头部导航组件
- **ThemeProvider**: 主题提供商

---

# MobileLayout 组件

## 概述

MobileLayout 是针对移动设备的布局组件,采用全屏内容和底部/汉堡菜单的交互模式。

## 核心特性

- 汉堡菜单触发侧边栏
- 底部导航栏(可选)
- 滑动手势支持
- 触摸优化交互

## Props 接口

```typescript
interface MobileLayoutProps {
  children: React.ReactNode;
  sidebarWidth?: number;
  showBottomNav?: boolean;
  onSidebarToggle?: (open: boolean) => void;
}
```

## 内部状态

```typescript
interface MobileLayoutState {
  sidebarOpen: boolean;
  activeTab: string;
  showSearchBar: boolean;
}
```

## 核心实现

### 1. 侧边栏滑入动画

```typescript
const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  sidebarWidth = 280,
  onSidebarToggle,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 滑动手势处理
  useEffect(() => {
    const element = document.getElementById('mobile-content');
    if (!element) return;

    let startX = 0;
    let isOpen = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isOpen = sidebarOpen;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startX;

      if (isOpen && deltaX > 50) {
        setSidebarOpen(false);
        onSidebarToggle?.(false);
      } else if (!isOpen && deltaX < -50 && startX < 20) {
        setSidebarOpen(true);
        onSidebarToggle?.(true);
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [sidebarOpen, onSidebarToggle]);

  return (
    <div className="mobile-layout">
      {/* 侧边栏遮罩 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={() => {
              setSidebarOpen(false);
              onSidebarToggle?.(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <motion.aside
        initial={{ x: -sidebarWidth }}
        animate={{ x: sidebarOpen ? 0 : -sidebarWidth }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="mobile-sidebar"
        style={{ width: sidebarWidth }}
      >
        <Sidebar />
      </motion.aside>

      {/* 主内容区 */}
      <main id="mobile-content" className="mobile-content">
        {children}
      </main>
    </div>
  );
};
```

---

# TabletLayout 组件

## 概述

TabletLayout 是针对平板设备的布局组件,采用紧凑侧边栏和自适应内容区域的模式。

## 核心特性

- 紧凑侧边栏模式(收起状态)
- 悬浮菜单触发
- 双栏布局支持

## Props 接口

```typescript
interface TabletLayoutProps {
  children: React.ReactNode;
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}
```

## 核心实现

```typescript
const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  sidebarWidth = 280,
  sidebarCollapsed = true,
  onSidebarToggle,
}) => {
  // 平板默认收起侧边栏,点击展开
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tablet-layout">
      {/* 紧凑侧边栏 */}
      <aside
        className={`tablet-sidebar ${expanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {expanded ? <ExpandedSidebar /> : <CollapsedSidebar />}
      </aside>

      {/* 内容区 */}
      <main className="tablet-content">
        {children}
      </main>
    </div>
  );
};
```
