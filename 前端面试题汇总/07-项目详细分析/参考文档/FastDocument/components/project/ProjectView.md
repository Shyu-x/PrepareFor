# ProjectView 组件

## 概述

ProjectView(项目视图)组件是项目管理模块的主容器,负责协调不同视图(看板、日历、甘特图)之间的切换和数据管理。

## 核心特性

- **多视图切换**: 支持看板、日历、甘特图、列表视图
- **项目选择**: 支持切换不同项目
- **视图状态管理**: 记住用户偏好的视图类型

## Props 接口

```typescript
interface ProjectViewProps {
  // 项目ID
  projectId?: string;

  // 默认视图
  defaultView?: 'kanban' | 'calendar' | 'gantt' | 'list';

  // 回调
  onProjectChange?: (projectId: string) => void;
  onViewChange?: (view: string) => void;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface ProjectViewState {
  currentProjectId: string | null;
  currentView: 'kanban' | 'calendar' | 'gantt' | 'list';
  projects: Project[];
  isLoading: boolean;
}
```

## 核心实现

```typescript
const ProjectView: React.FC<ProjectViewProps> = ({
  projectId,
  defaultView = 'kanban',
}) => {
  const {
    projects,
    currentProject,
    fetchProjects,
    fetchProject,
  } = useProjectStore();

  const [currentView, setCurrentView] = useState(defaultView);

  // 加载项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  // 加载当前项目
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else if (projects.length > 0) {
      fetchProject(projects[0].id);
    }
  }, [projectId, projects]);

  // 视图切换
  const renderCurrentView = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanBoard />;
      case 'calendar':
        return <CalendarView />;
      case 'gantt':
        return <GanttChart />;
      case 'list':
        return <TaskListView />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="project-view">
      {/* 项目头部 */}
      <div className="project-header">
        <div className="project-selector">
          <select
            value={currentProject?.id}
            onChange={(e) => onProjectChange?.(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* 视图切换 */}
        <div className="view-tabs">
          <button
            className={currentView === 'kanban' ? 'active' : ''}
            onClick={() => setCurrentView('kanban')}
          >
            <Layout size={16} /> 看板
          </button>
          <button
            className={currentView === 'calendar' ? 'active' : ''}
            onClick={() => setCurrentView('calendar')}
          >
            <Calendar size={16} /> 日历
          </button>
          <button
            className={currentView === 'gantt' ? 'active' : ''}
            onClick={() => setCurrentView('gantt')}
          >
            <GanttChartIcon size={16} /> 甘特图
          </button>
          <button
            className={currentView === 'list' ? 'active' : ''}
            onClick={() => setCurrentView('list')}
          >
            <List size={16} /> 列表
          </button>
        </div>

        {/* 项目操作 */}
        <div className="project-actions">
          <Button icon={<Plus size={16} />}>新建任务</Button>
          <Button icon={<Settings size={16} />}>项目设置</Button>
        </div>
      </div>

      {/* 视图内容 */}
      <div className="project-content">
        {currentProject ? (
          renderCurrentView()
        ) : (
          <Empty description="请选择一个项目" />
        )}
      </div>
    </div>
  );
};
```

---

# KanbanBoard 组件

## 概述

KanbanBoard(看板)组件以看板形式展示任务,支持列管理、任务拖拽、WIP限制等功能。

## Props 接口

```typescript
interface KanbanBoardProps {
  // 项目ID
  projectId?: string;

  // 回调
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string) => void;
  onColumnAdd?: (name: string) => void;
  onColumnDelete?: (columnId: string) => void;
}
```

## 内部状态

```typescript
interface KanbanBoardState {
  columns: ProjectColumn[];
  tasks: Task[];
  draggingTask: Task | null;
  dragOverColumnId: string | null;
}
```

## 核心逻辑实现

### 1. 看板列组件

```typescript
const KanbanColumn: React.FC<{
  column: ProjectColumn;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
}> = ({ column, tasks, onAddTask, onTaskClick, onDeleteColumn }) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(column.id);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="kanban-column">
      {/* 列头部 */}
      <div className="column-header">
        <h3>{column.name}</h3>
        <span className="task-count">{tasks.length}</span>
        {column.wipLimit && (
          <span className={`wip-limit ${tasks.length > column.wipLimit ? 'exceeded' : ''}`}>
            / {column.wipLimit}
          </span>
        )}
      </div>

      {/* 任务列表 */}
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          />
        ))}

        {/* 添加任务 */}
        {isAddingTask ? (
          <div className="add-task-form">
            <TextArea
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="输入任务标题..."
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
            />
            <div className="form-actions">
              <Button size="small" onClick={handleAddTask}>添加</Button>
              <Button size="small" onClick={() => setIsAddingTask(false)}>取消</Button>
            </div>
          </div>
        ) : (
          <button className="add-task-btn" onClick={() => setIsAddingTask(true)}>
            <Plus size={14} /> 添加任务
          </button>
        )}
      </div>
    </div>
  );
};
```

### 2. 拖拽处理

```typescript
// 任务拖拽开始
const handleDragStart = (e: React.DragEvent, task: Task) => {
  e.dataTransfer.setData('text/plain', task.id);
  e.dataTransfer.effectAllowed = 'move';
  setDraggingTask(task);
};

// 拖拽经过列
const handleDragOver = (e: React.DragEvent, columnId: string) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverColumnId(columnId);
};

// 拖拽放置
const handleDrop = async (e: React.DragEvent, toColumnId: string) => {
  e.preventDefault();
  const taskId = e.dataTransfer.getData('text/plain');

  if (draggingTask && draggingTask.columnId !== toColumnId) {
    // 更新任务列
    await updateTask(taskId, { columnId: toColumnId });
  }

  setDraggingTask(null);
  setDragOverColumnId(null);
};
```

### 3. WIP 限制检测

```typescript
// 检查 WIP 限制
const checkWipLimit = (columnId: string): boolean => {
  const column = currentProject?.columns.find(c => c.id === columnId);
  if (!column?.wipLimit) return true;

  const taskCount = tasks.filter(t => t.columnId === columnId).length;
  return taskCount < column.wipLimit;
};
```

## 使用示例

```tsx
<KanbanBoard
  projectId="project-123"
  onTaskClick={(task) => setSelectedTask(task)}
  onTaskMove={async (taskId, from, to) => {
    await updateTask(taskId, { columnId: to });
  }}
/>
```

---

# TaskCard 组件

## 概述

TaskCard(任务卡片)组件展示单个任务的基本信息,包括标题、优先级、截止日期、负责人、标签等。

## Props 接口

```typescript
interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
}
```

## 内部状态

```typescript
interface TaskCardState {
  isHovered: boolean;
  isDragging: boolean;
}
```

## 核心实现

```typescript
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 优先级颜色映射
  const priorityColors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };

  // 状态颜色映射
  const statusColors = {
    todo: 'gray',
    in_progress: 'blue',
    done: 'green',
    blocked: 'red',
  };

  return (
    <div
      className={`task-card ${isHovered ? 'hovered' : ''} ${task.status}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 优先级指示 */}
      <div className={`priority-bar priority-${task.priority}`} />

      {/* 标题 */}
      <h4 className="task-title">{task.title}</h4>

      {/* 描述预览 */}
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* 标签 */}
      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* 底部信息 */}
      <div className="task-footer">
        {/* 截止日期 */}
        {task.dueDate && (
          <div className={`due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
            <Calendar size={12} />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}

        {/* 负责人 */}
        {task.assigneeName && (
          <div className="assignee">
            <Avatar size={20}>{task.assigneeName.charAt(0)}</Avatar>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

# CalendarView 组件

## 概述

CalendarView(日历视图)组件以日历形式展示任务,支持按天/周/月查看,显示任务截止日期。

## 核心特性

- 月/周视图切换
- 任务日期显示
- 今日高亮
- 点击创建任务

## 核心实现

```typescript
const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // 获取当前月份天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!task.dueDate) return acc;
      const dateKey = format(task.dueDate, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  return (
    <div className="calendar-view">
      {/* 头部 */}
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>
          <ChevronLeft size={18} />
        </button>
        <h2>{year}年 {month + 1}月</h2>
        <button onClick={handleNextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 日历网格 */}
      <div className="calendar-grid">
        {/* 星期标题 */}
        <div className="weekdays">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        {/* 日期单元格 */}
        <div className="days">
          {calendarCells.map((cell, index) => {
            const dateKey = format(cell.date, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateKey] || [];
            const isToday = isSameDay(cell.date, new Date());

            return (
              <div
                key={index}
                className={`day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <span className="day-number">{cell.day}</span>
                <div className="day-tasks">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className={`task-dot status-${task.status}`}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="more-tasks">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

---

# GanttChart 组件

## 概述

GanttChart(甘特图)组件以时间线形式展示项目进度,支持任务依赖、里程碑、进度显示、拖拽调整日期等功能。

## 核心特性

- 时间线视图(周/月/季)
- 任务依赖关系
- 里程碑标记
- 进度可视化
- 拖拽调整日期
- 今日线

## 核心实现

```typescript
const GanttChart: React.FC = () => {
  const [viewType, setViewType] = useState<'week' | 'month' | 'quarter'>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [zoom, setZoom] = useState(1);

  // 计算任务条位置
  const getTaskBarStyle = (task: Task) => {
    const startDiff = dayjs(task.createdAt).diff(startDate, 'day');
    const duration = dayjs(task.dueDate || task.createdAt).diff(dayjs(task.createdAt), 'day');

    return {
      left: `${(startDiff / totalDays) * 100}%`,
      width: `${Math.max(2, (duration / totalDays) * 100 * zoom)}%`,
    };
  };

  // 渲染时间轴
  const renderTimeAxis = () => {
    return timeColumns.map((col, index) => (
      <div
        key={index}
        className={`time-column ${col.isToday ? 'today' : ''} ${col.isWeekend ? 'weekend' : ''}`}
        style={{ width: 50 * zoom }}
      >
        <span>{col.label}</span>
      </div>
    ));
  };

  // 渲染任务条
  const renderTaskBar = (task: Task) => {
    const style = getTaskBarStyle(task);
    const statusColor = getStatusColor(task.status);

    return (
      <div
        className="gantt-bar"
        style={{
          ...style,
          borderLeftColor: statusColor,
        }}
        onClick={() => handleTaskClick(task)}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
      >
        <div
          className="progress"
          style={{ width: `${task.progress}%` }}
        />
        <span className="bar-label">{task.title}</span>
      </div>
    );
  };

  return (
    <div className="gantt-chart">
      {/* 头部工具栏 */}
      <div className="gantt-toolbar">
        {/* 视图切换 */}
        <div className="view-switcher">
          {(['week', 'month', 'quarter'] as const).map(type => (
            <button
              key={type}
              className={viewType === type ? 'active' : ''}
              onClick={() => setViewType(type)}
            >
              {type === 'week' ? '周' : type === 'month' ? '月' : '季'}
            </button>
          ))}
        </div>

        {/* 日期导航 */}
        <div className="date-navigator">
          <button onClick={handlePrev}><ChevronLeft /></button>
          <span>{currentDate.format('YYYY年MM月')}</span>
          <button onClick={handleNext}><ChevronRight /></button>
          <button onClick={handleToday}>今天</button>
        </div>

        {/* 缩放控制 */}
        <div className="zoom-control">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))}>+</button>
        </div>
      </div>

      {/* 甘特图内容 */}
      <div className="gantt-content">
        {/* 左侧任务列表 */}
        <div className="task-list">
          <div className="list-header">任务</div>
          {tasks.map(task => (
            <div key={task.id} className="task-row" onClick={() => handleTaskClick(task)}>
              <StatusIcon status={task.status} />
              <span className="task-name">{task.title}</span>
              <PriorityFlag priority={task.priority} />
            </div>
          ))}
        </div>

        {/* 右侧时间轴 */}
        <div className="time-axis">
          <div className="axis-header">
            {renderTimeAxis()}
          </div>
          <div className="axis-body">
            {/* 今日线 */}
            {todayColumnIndex >= 0 && (
              <div
                className="today-line"
                style={{ left: `${todayColumnIndex * 50 * zoom + 25 * zoom}px` }}
              />
            )}

            {/* 任务条 */}
            {tasks.map(task => (
              <div key={task.id} className="task-track">
                {renderTaskBar(task)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```
