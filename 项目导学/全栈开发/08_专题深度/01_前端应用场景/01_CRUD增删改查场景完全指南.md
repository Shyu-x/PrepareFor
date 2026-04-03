# CRUD增删改查场景完全指南

> **前置知识**：阅读完《React基础入门》和《React Hooks完全指南》后食用更佳

---

## 一、CRUD是什么鬼？

### 1.1 先来唠唠嗑

你有没有发现，不管是什么软件，**基本上80%的功能都是在干同一件事**？

打开任何一个网站，你会发现：

- **博客系统**：发文章（Create）、看文章（Read）、改文章（Update）、删文章（Delete）
- **微信**：发消息（Create）、看消息（Read）、改消息（Update）、撤回消息（Delete）
- **淘宝**：上架商品（Create）、浏览商品（Read）、修改价格（Update）、下架商品（Delete）
- **任务管理**：创建任务、查看任务列表、修改任务状态、删除任务

看到了吗？**Create、Read、Update、Delete**，这四个单词的首字母拼在一起，就是 **CRUD**。

### 1.2 用人话来说

你可以把CRUD理解成**对一个抽屉里的东西进行操作**：

- **C（Create）**：往抽屉里放一个新东西
- **R（Read）**：打开抽屉看看里面有什么
- **U（Update）**：把抽屉里的东西换个位置或者改一改
- **D（Delete）**：把抽屉里的某个东西扔掉

就这么简单，没有高深莫测的概念。

### 1.3 为什么CRUD这么重要？

因为**几乎所有的业务系统本质上都是在操作数据**。不管你是做管理系统、电商平台、社交软件还是什么牛鬼蛇神的玩意儿，归根结底就是对数据进行增删改查。

掌握了CRUD，就等于掌握了**80%的开发技能**。剩下的20%是什么？是性能优化、用户体验优化、安全防护这些"锦上添花"的东西。

---

## 二、前端CRUD长什么样？

### 2.1 一个典型的任务管理系统

我们来做一个"任务管理系统"作为例子。这个系统需要：

1. **展示任务列表**（Read）
2. **创建新任务**（Create）
3. **查看任务详情**（Read）
4. **编辑任务**（Update）
5. **删除任务**（Delete）

就像一个简单的**待办事项应用**，只不过功能更完整。

### 2.2 页面结构

一个典型的CRUD页面结构是这样的：

```
┌─────────────────────────────────────────┐
│           任务管理系统                     │
├─────────────────────────────────────────┤
│  [新建任务按钮]                           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ 任务1  [编辑] [删除]                │ │
│  ├─────────────────────────────────────┤ │
│  │ 任务2  [编辑] [删除]                │ │
│  ├─────────────────────────────────────┤ │
│  │ 任务3  [编辑] [删除]                │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2.3 需要的React组件

我们的任务管理系统需要这些组件：

1. **TaskList** - 任务列表页面（Read展示所有任务）
2. **TaskDetail** - 任务详情页面（Read查看单个任务）
3. **TaskForm** - 任务表单（Create新建、Update编辑）
4. **TaskItem** - 单个任务项（用于列表展示）

---

## 三、从零开始实现CRUD

### 3.1 先定义数据结构

在开始写代码之前，我们先搞清楚**要操作的数据长什么样**。

```typescript
// 定义任务的类型，就像给抽屉贴标签
interface Task {
  id: string;           // 任务的唯一身份证号
  title: string;        // 任务标题，比如"买菜"
  description: string;  // 任务描述，比如"买西红柿和鸡蛋"
  status: 'pending' | 'in-progress' | 'completed'; // 任务状态
  priority: 'low' | 'medium' | 'high';             // 优先级
  createdAt: string;   // 创建时间
  updatedAt: string;   // 更新时间
}
```

你可以把这个理解成**一个标准的"任务卡片"**，每张卡片上都有这些信息。

### 3.2 创建任务（Create）

#### 3.2.1 表单组件

新建任务需要一个表单，就像填一张表格：

```tsx
// TaskForm.tsx - 任务表单组件
// 这个组件既用于新建，也用于编辑
"use client";

import { useState } from 'react';

// 定义表单数据的类型
interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

// Props类型：如果是编辑模式，需要传入初始值
interface TaskFormProps {
  initialData?: TaskFormData;  // 编辑时传入的初始数据
  onSubmit: (data: TaskFormData) => void;  // 提交时的回调函数
  onCancel: () => void;  // 取消按钮的回调
}

export default function TaskForm({
  initialData,  // 有初始数据就是编辑模式，没有就是新建模式
  onSubmit,
  onCancel
}: TaskFormProps) {
  // 使用useState管理表单数据
  // 就像在纸上填表，useState就是那张纸
  const [formData, setFormData] = useState<TaskFormData>({
    // 如果有初始数据就用初始数据，没有就空着
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
  });

  // 记录表单是否正在提交，防止用户疯狂点按钮
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理输入框变化
  // e.target就是用户正在操作的输入框
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // 更新表单数据
    // 展开运算符...formData是保留其他字段，name: value是更新当前字段
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认行为（页面刷新）

    // 表单验证：标题不能为空
    if (!formData.title.trim()) {
      alert('任务标题不能为空哦～');
      return;
    }

    setIsSubmitting(true); // 开始提交，显示loading状态

    try {
      // 调用父组件传来的提交函数
      await onSubmit(formData);
    } finally {
      // 不管成功还是失败，都要解除loading状态
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* 标题输入框 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          任务标题 *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="比如：完成项目报告"
          disabled={isSubmitting}  // 提交时禁用输入框
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* 描述输入框 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          任务描述
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="详细描述一下这个任务..."
          rows={4}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',  // 允许调整高度
          }}
        />
      </div>

      {/* 优先级选择 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          优先级
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="low">🟢 低优先级</option>
          <option value="medium">🟡 中优先级</option>
          <option value="high">🔴 高优先级</option>
        </select>
      </div>

      {/* 按钮区域 */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            background: '#1890ff',  // 蓝色按钮
            color: '#fff',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? '提交中...' : (initialData ? '保存修改' : '创建任务')}
        </button>
      </div>
    </form>
  );
}
```

#### 3.2.2 创建任务的业务逻辑

```tsx
// 创建任务函数
const createTask = async (taskData: TaskFormData) => {
  // 模拟发送请求到后端
  // 实际项目中这里会调用API
  const response = await fetch('/api/tasks', {
    method: 'POST',  // POST方法用于创建数据
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...taskData,
      id: crypto.randomUUID(),  // 生成唯一ID
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('创建任务失败');
  }

  return response.json();
};
```

### 3.3 读取任务（Read）

#### 3.3.1 任务列表

读取数据是最常见的操作，就像打开抽屉看看里面有什么：

```tsx
// TaskList.tsx - 任务列表组件
"use client";

import { useState, useEffect } from 'react';
import TaskItem from './TaskItem';  // 单个任务项组件

// 任务类型
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export default function TaskList() {
  // 任务列表状态
  // 就像一个收纳盒，用来装所有的任务
  const [tasks, setTasks] = useState<Task[]>([]);

  // 加载状态：数据还没到的时候显示loading
  const [isLoading, setIsLoading] = useState(true);

  // 错误状态：出错了要告诉用户
  const [error, setError] = useState<string | null>(null);

  // 模拟任务数据（实际项目中从API获取）
  const mockTasks: Task[] = [
    {
      id: '1',
      title: '完成项目报告',
      description: '整理本周工作进度，撰写项目报告',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: '回复客户邮件',
      description: '回复关于产品报价的咨询邮件',
      status: 'in-progress',
      priority: 'medium',
      createdAt: '2024-01-14T15:30:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
    },
    {
      id: '3',
      title: '整理会议纪要',
      description: '上周会议的要点整理',
      status: 'completed',
      priority: 'low',
      createdAt: '2024-01-13T11:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
    },
  ];

  // 获取任务列表
  // useEffect的第一个参数是要执行的函数，第二个是依赖数组
  // 依赖数组里的值变了，函数就会重新执行
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);  // 开始加载
      setError(null);       // 清空之前的错误

      try {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 实际项目中这样写：
        // const response = await fetch('/api/tasks');
        // const data = await response.json();
        // setTasks(data);

        // 现在用模拟数据
        setTasks(mockTasks);
      } catch (err) {
        // 捕获错误并保存
        setError('加载任务失败，请稍后重试');
        console.error('获取任务列表失败:', err);
      } finally {
        // 不管成功还是失败，都要结束loading状态
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);  // 空数组表示只在组件挂载时执行一次

  // 删除任务
  const handleDelete = (taskId: string) => {
    // 乐观更新：先立即更新UI，再异步请求后端
    // 这样用户会觉得操作很快
    setTasks(prev => prev.filter(task => task.id !== taskId));

    // 实际项目中这里会调用API
    // fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  // 切换任务状态
  const handleToggleStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      // 状态流转：pending -> in-progress -> completed
      const statusOrder = ['pending', 'in-progress', 'completed'] as const;
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % 3];

      return {
        ...task,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  // 加载状态：数据还没到
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px' }}>加载中...</div>
        <div style={{ marginTop: '16px', color: '#666' }}>
          正在获取任务列表
        </div>
      </div>
    );
  }

  // 错误状态：出问题了
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: '#ff4d4f' }}>出错了</div>
        <div style={{ marginTop: '16px', color: '#666' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          刷新页面
        </button>
      </div>
    );
  }

  // 空状态：没有任何任务
  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <div style={{ fontSize: '24px', color: '#666' }}>还没有任务</div>
        <div style={{ marginTop: '8px', color: '#999' }}>
          点击右上角的按钮创建第一个任务吧
        </div>
      </div>
    );
  }

  // 正常展示任务列表
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>我的任务</h1>

      {/* 统计信息 */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <div>全部：{tasks.length}</div>
        <div>待处理：{tasks.filter(t => t.status === 'pending').length}</div>
        <div>进行中：{tasks.filter(t => t.status === 'in-progress').length}</div>
        <div>已完成：{tasks.filter(t => t.status === 'completed').length}</div>
      </div>

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(task => (
          <TaskItem
            key={task.id}  // React要求列表项有唯一的key
            task={task}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 3.3.2 单个任务项

```tsx
// TaskItem.tsx - 单个任务项组件
"use client";

import { Link } from 'react-router-dom';  // 假设使用react-router

// 任务类型
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

// 状态显示文案和颜色
const statusConfig = {
  'pending': { label: '待处理', color: '#faad14', bg: '#fffbe6' },
  'in-progress': { label: '进行中', color: '#1890ff', bg: '#e6f7ff' },
  'completed': { label: '已完成', color: '#52c41a', bg: '#f6ffed' },
};

// 优先级显示文案和颜色
const priorityConfig = {
  'low': { label: '低', color: '#52c41a' },
  'medium': { label: '中', color: '#faad14' },
  'high': { label: '高', color: '#ff4d4f' },
};

export default function TaskItem({ task, onDelete, onToggleStatus }: TaskItemProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 处理删除
  const handleDelete = () => {
    // 确认一下，防止手滑
    if (window.confirm(`确定要删除任务"${task.title}"吗？`)) {
      onDelete(task.id);
    }
  };

  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      background: '#fff',
      transition: 'box-shadow 0.2s',  // 添加过渡效果
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* 状态切换复选框 */}
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => onToggleStatus(task.id)}
          style={{
            width: '20px',
            height: '20px',
            marginTop: '4px',
            cursor: 'pointer',
          }}
        />

        {/* 任务内容 */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',  // 已完成的任务添加删除线
            color: task.status === 'completed' ? '#999' : '#333',
          }}>
            {task.title}
          </div>

          {task.description && (
            <div style={{
              marginTop: '4px',
              fontSize: '14px',
              color: '#666',
            }}>
              {task.description}
            </div>
          )}

          {/* 标签区域 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {/* 状态标签 */}
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: status.bg,
              color: status.color,
            }}>
              {status.label}
            </span>

            {/* 优先级标签 */}
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: '#f5f5f5',
              color: priority.color,
            }}>
              {priority.label}优先级
            </span>
          </div>

          {/* 时间信息 */}
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#999'
          }}>
            创建于 {formatDate(task.createdAt)}
            {task.updatedAt !== task.createdAt && (
              <> · 更新于 {formatDate(task.updatedAt)}</>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to={`/tasks/${task.id}/edit`}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#333',
              textDecoration: 'none',
              background: '#fff',
            }}
          >
            编辑
          </Link>
          <button
            onClick={handleDelete}
            style={{
              padding: '6px 12px',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#ff4d4f',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 3.3.3 任务详情页

```tsx
// TaskDetail.tsx - 任务详情组件
"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetail() {
  const { id } = useParams();  // 获取URL参数中的任务ID
  const navigate = useNavigate();  // 用于导航

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模拟获取任务详情
  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);

      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 模拟数据
        const mockTask: Task = {
          id: id || '1',
          title: '完成项目报告',
          description: '整理本周工作进度，撰写项目报告。需要包含本周完成的功能、遇到的问题以及下周计划。',
          status: 'pending',
          priority: 'high',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        };

        setTask(mockTask);
      } catch (err) {
        setError('获取任务详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id]);

  // 加载中
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 出错了
  if (error || !task) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#ff4d4f' }}>{error || '任务不存在'}</div>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      </div>
    );
  }

  // 详情内容
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/tasks')}
        style={{
          marginBottom: '16px',
          padding: '8px 16px',
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← 返回列表
      </button>

      {/* 详情卡片 */}
      <div style={{
        padding: '24px',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        background: '#fff',
      }}>
        {/* 标题 */}
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
          {task.title}
        </h1>

        {/* 状态和优先级 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            background: task.status === 'completed' ? '#f6ffed' : '#e6f7ff',
            color: task.status === 'completed' ? '#52c41a' : '#1890ff',
          }}>
            {task.status === 'completed' ? '已完成' : task.status === 'in-progress' ? '进行中' : '待处理'}
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            background: task.priority === 'high' ? '#fff2f0' : '#f5f5f5',
            color: task.priority === 'high' ? '#ff4d4f' : '#666',
          }}>
            {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
          </span>
        </div>

        {/* 描述 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            任务描述
          </div>
          <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {task.description || '暂无描述'}
          </div>
        </div>

        {/* 时间信息 */}
        <div style={{
          padding: '16px',
          background: '#fafafa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
        }}>
          <div style={{ marginBottom: '8px' }}>
            创建时间：{new Date(task.createdAt).toLocaleString('zh-CN')}
          </div>
          <div>
            更新时间：{new Date(task.updatedAt).toLocaleString('zh-CN')}
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            编辑任务
          </button>
          <button
            onClick={() => {
              if (window.confirm('确定要删除这个任务吗？')) {
                // 删除逻辑
                navigate('/tasks');
              }
            }}
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#ff4d4f',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3.4 更新任务（Update）

更新任务其实就是**把新建任务的表单复用一下**，传入初始值就好了：

```tsx
// TaskEdit.tsx - 编辑任务页面
"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskForm from './TaskForm';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export default function TaskEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取任务数据
  useEffect(() => {
    const fetchTask = async () => {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500));

      // 模拟数据
      setTask({
        id: id || '1',
        title: '完成项目报告',
        description: '整理本周工作进度',
        status: 'pending',
        priority: 'high',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      });
      setIsLoading(false);
    };

    if (id) {
      fetchTask();
    }
  }, [id]);

  // 提交修改
  const handleSubmit = async (data: TaskFormData) => {
    // 模拟提交到API
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('提交修改:', { id, ...data });

    // 提交成功后跳转回列表
    navigate('/tasks');
  };

  // 取消编辑
  const handleCancel = () => {
    navigate('/tasks');
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        加载中...
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        任务不存在
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>编辑任务</h1>

      {/* 复用表单组件，传入初始数据 */}
      <TaskForm
        initialData={{
          title: task.title,
          description: task.description,
          priority: task.priority,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

### 3.5 删除任务（Delete）

删除操作是CRUD中最简单的，但也是**最容易出问题的**。常见问题包括：

1. 误删：没有二次确认
2. 删了还在列表里显示（乐观更新没做好）
3. 删错了没法恢复

```tsx
// 删除任务的最佳实践

// 1. 带确认的删除函数
const handleDelete = async (taskId: string) => {
  // 第一步：确认
  const confirmed = window.confirm('确定要删除这个任务吗？此操作不可恢复！');

  if (!confirmed) {
    return;  // 用户取消了，直接return
  }

  try {
    // 第二步：乐观更新 - 先立即从UI移除
    setTasks(prev => prev.filter(t => t.id !== taskId));

    // 第三步：调用API删除
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }

    // 第四步：可选的撤销提示
    // 有些产品会提供"撤销"功能，3秒内可以反悔
    console.log('删除成功');

  } catch (error) {
    // 第四步：如果API失败，要恢复数据
    console.error('删除失败:', error);

    // 重新获取数据来恢复
    await refetchTasks();

    alert('删除失败，请稍后重试');
  }
};

// 2. 批量删除
const handleBatchDelete = async (taskIds: string[]) => {
  const confirmed = window.confirm(
    `确定要删除选中的 ${taskIds.length} 个任务吗？`
  );

  if (!confirmed) return;

  try {
    // 乐观更新
    setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));

    // 批量删除API
    await fetch('/api/tasks/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: taskIds }),
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    await refetchTasks();
  }
};
```

---

## 四、表单处理的艺术

### 4.1 受控组件 vs 非受控组件

这是React表单处理的两条路，**就像去餐厅吃饭**：

- **受控组件** = 你告诉服务员你想吃什么，服务员记在小本本上，每一步都要你来决定
- **非受控组件** = 你把菜单直接给客人，让客人自己填，服务员只管最后收表

```tsx
// 受控组件：表单数据完全由React管理
// 就像每点一个菜都要经过服务员
const ControlledInput = () => {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

// 非受控组件：数据由DOM自己管理
// 就像把菜单给客人，让他们自己填
const UncontrolledInput = () => {
  const inputRef = useRef(null);  // 拿到输入框的"遥控器"

  const handleSubmit = () => {
    // 需要的时候才去读取值
    console.log(inputRef.current.value);
  };

  return (
    <input
      ref={inputRef}  // 注册"遥控器"
      defaultValue="默认值"  // 只能设置默认值
    />
  );
};
```

**什么时候用哪个？**
- 大部分情况用**受控组件**，好管理、好调试
- 文件上传这种只能用**非受控组件**（input[type=file]）
- 极度追求性能可以用非受控，但通常没必要

### 4.2 表单验证

表单验证就像**进地铁站的安检**：

- **规则**：不能带易燃易爆品（必填项）
- **时机**：可以过闸机前检查（提交时验证），也可以随时检查（实时验证）

```tsx
// 表单验证示例
const validateForm = (data: TaskFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // 标题验证：不能为空
  if (!data.title.trim()) {
    errors.title = '任务标题不能为空';
  } else if (data.title.length < 3) {
    // 标题验证：至少3个字符
    errors.title = '任务标题至少需要3个字符';
  } else if (data.title.length > 50) {
    // 标题验证：最多50个字符
    errors.title = '任务标题不能超过50个字符';
  }

  // 描述验证：如果是必填的话
  // if (!data.description.trim()) {
  //   errors.description = '任务描述不能为空';
  // }

  return errors;  // 返回错误对象，没有错误就是空对象
};

// 在表单中使用验证
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = (data: TaskFormData) => {
  // 提交前先验证
  const validationErrors = validateForm(data);

  if (Object.keys(validationErrors).length > 0) {
    // 有错误，不提交，显示错误信息
    setErrors(validationErrors);
    return;
  }

  // 没有错误，执行提交逻辑
  setErrors({});  // 清空错误
  onSubmit(data);
};

// 显示错误信息
{errors.title && (
  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
    {errors.title}
  </div>
)}
```

### 4.3 表单状态管理

一个完整的表单有这些状态：

```tsx
// 表单状态管理完整示例
const [formState, setFormState] = useState({
  // 数据
  data: {
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  },

  // 错误
  errors: {
    title: '',
    description: '',
  },

  // 状态标志
  isDirty: false,      // 用户是否修改过表单
  isSubmitting: false, // 是否正在提交
  isValid: false,      // 表单是否有效
});

// 监听数据变化，更新状态标志
useEffect(() => {
  const hasErrors = Object.values(formState.errors).some(e => e);
  setFormState(prev => ({
    ...prev,
    isDirty: true,  // 一旦有变化就标记为脏
    isValid: !hasErrors && prev.data.title.trim().length > 0,
  }));
}, [formState.data, formState.errors]);

// 统一的变更处理函数
const handleChange = (field: string, value: string) => {
  setFormState(prev => ({
    ...prev,
    data: { ...prev.data, [field]: value },
    errors: { ...prev.errors, [field]: '' },  // 变更时清除该字段错误
  }));
};
```

---

## 五、状态管理的艺术

### 5.1 本地状态 vs 全局状态

**什么时候用哪个？就像家里放东西**：

- **本地状态（useState）**：只在这个组件用，放自己房间（组件内部）
- **全局状态（Zustand/Context）**：多个组件要用的，放客厅（全局共享）

```tsx
// 本地状态：只有这个组件用
// 就像你的牙刷，只有你自己用
const [count, setCount] = useState(0);

// 全局状态：多个组件共享
// 就像家里的冰箱，大家都要用
// 使用Zustand（推荐）
import { create } from 'zustand';

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),

  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  })),
}));

// 在组件中使用
function TaskList() {
  const tasks = useTaskStore(state => state.tasks);
  const removeTask = useTaskStore(state => state.removeTask);

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.title}
          <button onClick={() => removeTask(task.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}
```

### 5.2 乐观更新 vs 悲观更新

这是两种不同的更新策略，**就像点外卖**：

- **乐观更新**：先下单，等着吃，骑手摔了再说（大多数情况用这个，体验好）
- **悲观更新**：等骑手确认取餐了，才告诉你下单成功（可靠性要求高的场景用这个）

```tsx
// 乐观更新示例 - 大多数情况用这个
const handleAddTask = async (taskData: TaskData) => {
  // 1. 立即更新UI - 用户感觉很快
  const tempId = crypto.randomUUID();
  addTask({ ...taskData, id: tempId, status: 'pending' });

  try {
    // 2. 发送请求到服务器
    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });

    if (!response.ok) throw new Error('创建失败');

    const savedTask = await response.json();

    // 3. 成功后用服务器的ID替换临时ID
    // （通常服务器会生成正式的ID）
    updateTask(tempId, { id: savedTask.id });

  } catch (error) {
    // 4. 失败了要回滚
    removeTask(tempId);
    alert('创建任务失败，请重试');
  }
};

// 悲观更新示例 - 可靠性要求高的场景
const handleTransfer = async (accountId: string, amount: number) => {
  // 1. 先显示加载状态
  setIsTransferring(true);

  try {
    // 2. 等服务器返回成功才更新UI
    const result = await api.transfer(accountId, amount);

    if (result.success) {
      updateBalance(result.newBalance);
      showSuccessMessage('转账成功');
    } else {
      showErrorMessage(result.message);
    }
  } catch (error) {
    showErrorMessage('转账失败，请重试');
  } finally {
    setIsTransferring(false);
  }
};
```

---

## 六、错误处理与边界情况

### 6.1 错误处理的最佳实践

**错误处理就像开车时的安全气囊**：平时用不上，但关键时刻能救命。

```tsx
// 统一错误处理函数
const handleApiError = (error: unknown, fallbackMessage: string) => {
  // 打印详细错误（方便调试）
  console.error('API错误:', error);

  // 判断错误类型，返回友好的错误信息
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return '网络连接失败，请检查网络设置';
  }

  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return '请求参数错误';
      case 401:
        return '登录已过期，请重新登录';
      case 403:
        return '没有权限执行此操作';
      case 404:
        return '请求的资源不存在';
      case 500:
        return '服务器开小差了，请稍后重试';
      default:
        return fallbackMessage;
    }
  }

  return fallbackMessage;
};

// 使用示例
try {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw response;  // 抛出错误，让catch捕获
  }
  const data = await response.json();
  setTasks(data);
} catch (error) {
  setError(handleApiError(error, '加载任务失败'));
}
```

### 6.2 Loading状态的正确处理

Loading状态不是简单显示"加载中"，**要像餐厅服务员一样专业**：

```tsx
// 1. 初始加载 - 页面第一次打开
if (isInitialLoading) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      {/* 骨架屏 - 比单纯的loading更友好 */}
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );
}

// 2. 提交中的loading - 防止重复提交
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;  // 防止重复点击

  setIsSubmitting(true);
  try {
    await submitData();
  } finally {
    setIsSubmitting(false);
  }
};

// 提交按钮
<button disabled={isSubmitting}>
  {isSubmitting ? '提交中...' : '提交'}
</button>

// 3. 分页加载 - 加载更多
const [isLoadingMore, setIsLoadingMore] = useState(false);

const loadMore = async () => {
  setIsLoadingMore(true);
  try {
    const newData = await fetchPage(currentPage + 1);
    setTasks(prev => [...prev, ...newData.items]);
    setCurrentPage(prev => prev + 1);
  } finally {
    setIsLoadingMore(false);
  }
};

// 加载更多按钮
{hasMore && (
  <button onClick={loadMore} disabled={isLoadingMore}>
    {isLoadingMore ? '加载中...' : '加载更多'}
  </button>
)}
```

### 6.3 空状态的正确处理

空状态不是简单地显示"没有数据"，**要像导游一样引导用户下一步**：

```tsx
// 1. 列表为空
if (tasks.length === 0) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      {/* 插画让页面不那么空洞 */}
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>

      {/* 友好的文案 */}
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
        还没有任何任务
      </h3>

      <p style={{ color: '#999', marginBottom: '24px' }}>
        创建你的第一个任务，开启高效之旅
      </p>

      {/* 引导按钮 */}
      <button
        onClick={() => navigate('/tasks/new')}
        style={{
          padding: '12px 24px',
          background: '#1890ff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        创建第一个任务
      </button>
    </div>
  );
}

// 2. 搜索无结果
if (searchKeyword && filteredTasks.length === 0) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
      <h3>没有找到相关任务</h3>
      <p style={{ color: '#999', marginBottom: '16px' }}>
        关键词"{searchKeyword}"没有匹配到任何任务
      </p>
      <button onClick={() => setSearchKeyword('')}>
        清除搜索
      </button>
    </div>
  );
}

// 3. 筛选无结果
if (filterStatus && filteredTasks.length === 0) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
      <h3>没有{statusLabels[filterStatus]}的任务</h3>
      <p style={{ color: '#999' }}>
        {filterStatus === 'completed'
          ? '完成一些任务再来看看吧'
          : '赶紧去完成任务吧'}
      </p>
    </div>
  );
}
```

---

## 七、一个完整的CRUD页面示例

把上面的内容整合起来，就是一个完整的CRUD页面：

```tsx
// TasksPage.tsx - 任务管理完整页面
"use client";

import { useState, useEffect, useCallback } from 'react';

// ============ 类型定义 ============
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

// ============ 模拟API ============
// 模拟任务数据
const mockTasks: Task[] = [
  {
    id: '1',
    title: '完成项目报告',
    description: '整理本周工作进度，撰写项目报告',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: '回复客户邮件',
    description: '回复关于产品报价的咨询邮件',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '3',
    title: '整理会议纪要',
    description: '上周会议的要点整理',
    status: 'completed',
    priority: 'low',
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
];

// ============ 主组件 ============
export default function TasksPage() {
  // 任务列表状态
  const [tasks, setTasks] = useState<Task[]>([]);

  // UI状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ============ 获取任务列表 ============
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      // 实际项目中：
      // const response = await fetch('/api/tasks');
      // const data = await response.json();
      // setTasks(data);

      setTasks(mockTasks);
    } catch (err) {
      setError('加载任务失败，请稍后重试');
      console.error('获取任务失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ============ 创建任务 ============
  const handleCreate = async (formData: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 乐观更新
    setTasks(prev => [newTask, ...prev]);
    setIsModalOpen(false);

    // 实际项目中发送API请求
    // try {
    //   await fetch('/api/tasks', {
    //     method: 'POST',
    //     body: JSON.stringify(formData),
    //   });
    // } catch {
    //   // 失败时回滚
    //   setTasks(prev => prev.filter(t => t.id !== newTask.id));
    //   throw new Error('创建失败');
    // }
  };

  // ============ 更新任务 ============
  const handleUpdate = async (formData: TaskFormData) => {
    if (!editingTask) return;

    const updatedTask: Task = {
      ...editingTask,
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    // 乐观更新
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setIsModalOpen(false);
    setEditingTask(null);

    // 实际项目中发送API请求...
  };

  // ============ 删除任务 ============
  const handleDelete = async (taskId: string) => {
    if (!window.confirm('确定要删除这个任务吗？')) return;

    // 乐观更新
    setTasks(prev => prev.filter(t => t.id !== taskId));

    // 实际项目中发送API请求...
    // try {
    //   await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    // } catch {
    //   // 失败时回滚
    //   fetchTasks();
    //   alert('删除失败');
    // }
  };

  // ============ 切换任务状态 ============
  const handleToggleStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      const statusOrder = ['pending', 'in-progress', 'completed'] as const;
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % 3];

      return { ...task, status: nextStatus, updatedAt: new Date().toISOString() };
    }));
  };

  // ============ 打开编辑模态框 ============
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // ============ 打开新建模态框 ============
  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // ============ 筛选任务 ============
  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  // ============ 渲染 ============
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600 }}>任务管理</h1>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          + 新建任务
        </button>
      </div>

      {/* 筛选器 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '8px',
      }}>
        {[
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待处理' },
          { value: 'in-progress', label: '进行中' },
          { value: 'completed', label: '已完成' },
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            style={{
              padding: '6px 16px',
              border: filterStatus === filter.value ? 'none' : '1px solid #d9d9d9',
              borderRadius: '4px',
              background: filterStatus === filter.value ? '#1890ff' : '#fff',
              color: filterStatus === filter.value ? '#fff' : '#333',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {filter.label}
          </button>
        ))}
        <div style={{ flex: 1, textAlign: 'right', lineHeight: '32px', color: '#666' }}>
          共 {filteredTasks.length} 个任务
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '20px', color: '#666' }}>加载中...</div>
        </div>
      )}

      {/* 错误状态 */}
      {!isLoading && error && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff2f0',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>{error}</div>
          <button onClick={fetchTasks}>重新加载</button>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !error && filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ marginBottom: '8px' }}>
            {filterStatus === 'all' ? '还没有任何任务' : '该分类下没有任务'}
          </h3>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            {filterStatus === 'all' ? '创建你的第一个任务吧' : '试试其他筛选条件'}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={openCreateModal}
              style={{
                padding: '12px 24px',
                background: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              创建任务
            </button>
          )}
        </div>
      )}

      {/* 任务列表 */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => openEditModal(task)}
              onDelete={() => handleDelete(task.id)}
              onToggleStatus={() => handleToggleStatus(task.id)}
            />
          ))}
        </div>
      )}

      {/* 模态框 */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

// ============ 任务卡片组件 ============
interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function TaskCard({ task, onEdit, onDelete, onToggleStatus }: TaskCardProps) {
  const statusConfig = {
    'pending': { label: '待处理', bg: '#fffbe6', color: '#faad14' },
    'in-progress': { label: '进行中', bg: '#e6f7ff', color: '#1890ff' },
    'completed': { label: '已完成', bg: '#f6ffed', color: '#52c41a' },
  };

  const priorityConfig = {
    'low': '低',
    'medium': '中',
    'high': '高',
  };

  const status = statusConfig[task.status];

  return (
    <div style={{
      padding: '16px 20px',
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* 复选框 */}
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={onToggleStatus}
          style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
        />

        {/* 任务内容 */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            color: task.status === 'completed' ? '#999' : '#333',
          }}>
            {task.title}
          </div>

          {task.description && (
            <div style={{ marginTop: '4px', fontSize: '14px', color: '#666' }}>
              {task.description}
            </div>
          )}

          {/* 标签 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: status.bg,
              color: status.color,
            }}>
              {status.label}
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: '#f5f5f5',
              color: '#666',
            }}>
              {priorityConfig[task.priority]}优先级
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            编辑
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '6px 12px',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              background: '#fff',
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ 任务表单模态框 ============
interface TaskModalProps {
  task: Task | null;
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
}

function TaskModal({ task, onSubmit, onClose }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h2 style={{ marginBottom: '24px' }}>
          {task ? '编辑任务' : '新建任务'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 标题 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              任务标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="输入任务标题"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${errors.title ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            {errors.title && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* 描述 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="输入任务描述（可选）"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* 优先级 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              优先级
            </label>
            <select
              value={formData.priority}
              onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="low">🟢 低优先级</option>
              <option value="medium">🟡 中优先级</option>
              <option value="high">🔴 高优先级</option>
            </select>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                background: '#1890ff',
                color: '#fff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? '提交中...' : (task ? '保存修改' : '创建任务')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 八、总结

### 8.1 CRUD核心要点

| 操作 | HTTP方法 | 关键点 |
|------|----------|--------|
| **Create** | POST | 乐观更新、生成临时ID、处理重复提交 |
| **Read** | GET | 缓存策略、Loading状态、空状态处理 |
| **Update** | PUT/PATCH | 乐观更新、字段级别更新、版本控制 |
| **Delete** | DELETE | 确认提示、乐观更新、回滚机制 |

### 8.2 状态管理要点

| 状态 | 什么时候用 | 示例 |
|------|------------|------|
| **isLoading** | 初始加载 | 显示骨架屏或loading |
| **isSubmitting** | 提交中 | 禁用按钮、防止重复提交 |
| **isError** | 发生错误 | 显示错误信息、重试按钮 |
| **isEmpty** | 没有数据 | 空状态引导 |
| **isDirty** | 表单已修改 | 离开页面时提醒保存 |

### 8.3 表单处理要点

1. **验证要及时**：不要等提交了才告诉用户错了
2. **错误要明确**：告诉用户哪里错了、怎么改
3. **提交要防抖**：用户疯狂点按钮时要保护好
4. **成功要反馈**：告诉用户操作成功了

---

## 九、下一步学习

- [ ] 深入学习《Zustand状态管理》
- [ ] 深入学习《SWR数据获取》
- [ ] 学习《React Router路由管理》
- [ ] 实践《Ant Design组件库》表单组件
- [ ] 学习《单元测试实战》

---

**祝你CRUD愉快！** 🚀
