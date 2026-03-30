# Ant Design 组件库教程

## 目录

1. [Ant Design 基础](#1-ant-design-基础)
2. [常用组件使用](#2-常用组件使用)
3. [定制主题](#3-定制主题)
4. [项目中的使用示例](#4-项目中的使用示例)

---

## 1. Ant Design 基础

### 1.1 简介

**Ant Design** 是蚂蚁金服开源的企业级 UI 设计语言和 React 组件库，提供了丰富的高质量组件，被广泛应用于中后台系统的开发。

```bash
# 安装 Ant Design
npm install antd@6.2.1
npm install @ant-design/icons@5.5.2
```

### 1.2 基础使用

```jsx
import React from 'react';
import { Button, DatePicker, version } from 'antd';
import './App.css';

const App = () => {
    console.log('Ant Design Version:', version);

    return (
        <div className="App">
            <h1>Ant Design v{version}</h1>
            <DatePicker />
            <Button type="primary">Primary Button</Button>
        </div>
    );
};

export default App;
```

### 1.3 组件分类

| 分类 | 主要组件 |
|------|----------|
| 通用 | Button, Icon, Typography, ConfigProvider |
| 布局 | Layout, Grid, Space, Divider |
| 导航 | Menu, Breadcrumb, Steps, Tabs, Pagination |
| 数据录入 | Form, Input, Select, DatePicker, Upload, Cascader |
| 数据展示 | Table, List, Tree, Card, Calendar, Descriptions |
| 反馈 | Modal, Drawer, Message, Notification, Spin, Progress |
| 其他 | Anchor, BackTop, ConfigProvider |

---

## 2. 常用组件使用

### 2.1 按钮 (Button)

```jsx
import React from 'react';
import { Button, Space, Dropdown } from 'antd';
import { DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const ButtonExample = () => {
    return (
        <Space direction="vertical">
            {/* 按钮类型 */}
            <Space>
                <Button type="primary">Primary</Button>
                <Button>Default</Button>
                <Button type="dashed">Dashed</Button>
                <Button type="text">Text</Button>
                <Button type="link">Link</Button>
            </Space>

            {/* 图标按钮 */}
            <Space>
                <Button type="primary" icon={<DownloadOutlined />}>
                    Download
                </Button>
                <Button icon={<EditOutlined />}>Edit</Button>
                <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Space>

            {/* 按钮大小 */}
            <Space>
                <Button size="small">Small</Button>
                <Button size="middle">Middle</Button>
                <Button size="large">Large</Button>
            </Space>

            {/* 按钮状态 */}
            <Space>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button ghost>Ghost</Button>
            </Space>

            {/* 下拉菜单按钮 */}
            <Dropdown
                menu={{
                    items: [
                        { key: '1', label: 'Option 1' },
                        { key: '2', label: 'Option 2' },
                        { type: 'divider' },
                        { key: '3', label: 'Danger', danger: true }
                    ]
                }}
            >
                <Button>Dropdown</Button>
            </Dropdown>

            {/* 按钮组 */}
            <Button.Group>
                <Button>Left</Button>
                <Button>Middle</Button>
                <Button>Right</Button>
            </Button.Group>
        </Space>
    );
};
```

### 2.2 输入框 (Input)

```jsx
import React, { useState } from 'react';
import { Input, InputNumber, TextArea, Password, Search, Group } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';

const InputExample = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 基础输入框 */}
            <Input
                placeholder="Basic Input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />

            {/* 带前缀/后缀 */}
            <Input
                prefix={<UserOutlined />}
                placeholder="With Prefix"
            />
            <Input
                suffix=".com"
                placeholder="With Suffix"
            />
            <Input
                prefix="https://"
                suffix=".com"
                placeholder="URL Input"
            />

            {/* 带搜索按钮 */}
            <Search
                placeholder="Search"
                allowClear
                onSearch={(value) => console.log(value)}
                style={{ width: 300 }}
            />

            {/* 文本域 */}
            <TextArea
                rows={4}
                placeholder="TextArea"
                maxLength={500}
                showCount
            />

            {/* 密码输入框 */}
            <Password
                placeholder="Password"
                visibilityToggle
            />

            {/* 数字输入框 */}
            <InputNumber
                min={0}
                max={100}
                defaultValue={10}
                style={{ width: 200 }}
            />

            {/* 输入框组合 */}
            <Group compact>
                <Input style={{ width: 'calc(100% - 200px)' }} defaultValue="https://" />
                <InputNumber style={{ width: 100 }} defaultValue={100} />
                <Input style={{ width: 100 }} defaultValue=".com" />
            </Group>

            {/* 前缀图标 */}
            <Input
                prefix={<UserOutlined />}
                suffix={<span>km</span>}
                placeholder="With Icons"
            />
        </div>
    );
};
```

### 2.3 表单 (Form)

```jsx
import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, Checkbox, Radio, Switch, Slider, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const FormExample = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = (values) => {
        console.log('Success:', values);
        message.success('提交成功!');
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
        message.error('请检查表单填写!');
    };

    const onReset = () => {
        form.resetFields();
    };

    const onFill = () => {
        form.setFieldsValue({
            username: 'admin',
            email: 'admin@example.com',
            age: 25,
            gender: 'male',
            remember: true,
            date: dayjs('2024-01-01'),
            range: [dayjs('2024-01-01'), dayjs('2024-01-31')],
            rate: 4,
            switch: true,
            slider: 50
        });
    };

    return (
        <Form
            form={form}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
        >
            <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please input your username!' }]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                label="Email"
                name="email"
                rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                ]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
            >
                <Input.Password />
            </Form.Item>

            <Form.Item
                label="Age"
                name="age"
                rules={[
                    { required: true, message: 'Please input your age!' },
                    { type: 'number', min: 18, max: 100, message: 'Age must be between 18 and 100!' }
                ]}
            >
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true, message: 'Please select your gender!' }]}
            >
                <Radio.Group>
                    <Radio value="male">Male</Radio>
                    <Radio value="female">Female</Radio>
                    <Radio value="other">Other</Radio>
                </Radio.Group>
            </Form.Item>

            <Form.Item
                label="Hobby"
                name="hobby"
            >
                <Checkbox.Group>
                    <Checkbox value="reading">Reading</Checkbox>
                    <Checkbox value="coding">Coding</Checkbox>
                    <Checkbox value="gaming">Gaming</Checkbox>
                </Checkbox.Group>
            </Form.Item>

            <Form.Item
                label="Single Select"
                name="select"
            >
                <Select placeholder="Select a option">
                    <Option value="option1">Option 1</Option>
                    <Option value="option2">Option 2</Option>
                    <Option value="option3">Option 3</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Date"
                name="date"
            >
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                label="Date Range"
                name="range"
            >
                <RangePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                label="Switch"
                name="switch"
                valuePropName="checked"
            >
                <Switch />
            </Form.Item>

            <Form.Item
                label="Slider"
                name="slider"
            >
                <Slider marks={{ 0: '0', 50: '50', 100: '100' }} />
            </Form.Item>

            <Form.Item
                label="Rate"
                name="rate"
            >
                <InputNumber min={0} max={5} />
            </Form.Item>

            <Form.Item
                name="remember"
                valuePropName="checked"
                wrapperCol={{ offset: 8, span: 16 }}
            >
                <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Submit
                    </Button>
                    <Button htmlType="button" onClick={onReset}>
                        Reset
                    </Button>
                    <Button onClick={onFill}>
                        Fill Form
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};
```

### 2.4 表格 (Table)

```jsx
import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Select, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const TableExample = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);

    // 模拟数据
    const [data, setData] = useState([
        { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park', status: 'active', tags: ['nice', 'developer'] },
        { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park', status: 'active', tags: ['loser'] },
        { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park', status: 'inactive', tags: ['cool', 'teacher'] },
        { key: '4', name: 'Tom Hardy', age: 35, address: 'London No. 2 Lake Park', status: 'active', tags: ['smart'] },
    ]);

    // 列配置
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            // 搜索过滤
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder={`Search Name`}
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase()),
            sorter: (a, b) => a.name.length - b.name.length,
        },
        {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
            sorter: (a, b) => a.age - b.age,
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            filters: [
                { text: 'London', value: 'London' },
                { text: 'New York', value: 'New York' },
            ],
            onFilter: (value, record) => record.address.indexOf(value) === 0,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Inactive', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status.indexOf(value) === 0,
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Tags',
            key: 'tags',
            dataIndex: 'tags',
            render: (_, record) => (
                <>
                    {record.tags.map(tag => (
                        <Tag color="blue" key={tag}>{tag}</Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure to delete this item?"
                        onConfirm={() => handleDelete(record.key)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleEdit = (record) => {
        console.log('Edit:', record);
    };

    const handleDelete = (key) => {
        setData(data.filter(item => item.key !== key));
    };

    const handleAdd = () => {
        const newData = {
            key: String(data.length + 1),
            name: `New User ${data.length + 1}`,
            age: 25,
            address: 'New Address',
            status: 'active',
            tags: ['new']
        };
        setData([...data, newData]);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Add
                    </Button>
                    <Button onClick={() => setLoading(!loading)}>
                        Toggle Loading
                    </Button>
                    <Popconfirm
                        title="Are you sure to delete selected items?"
                        onConfirm={() => {
                            setData(data.filter(item => !selectedRowKeys.includes(item.key)));
                            setSelectedRowKeys([]);
                        }}
                    >
                        <Button danger disabled={!selectedRowKeys.length}>
                            Delete Selected
                        </Button>
                    </Popconfirm>
                </Space>
            </div>

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={data}
                pagination={{
                    total: data.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                loading={loading}
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};
```

### 2.5 模态框 (Modal)

```jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select, message } from 'antd';

const { Option } = Select;

const ModalExample = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            setIsLoading(true);
            const values = await form.validateFields();
            console.log('Form values:', values);
            // 模拟 API 调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success('提交成功!');
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    return (
        <div>
            <Button type="primary" onClick={showModal}>
                Open Modal
            </Button>

            <Modal
                title="Basic Modal"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isLoading}
                okText="Submit"
                cancelText="Cancel"
                width={600}
                // 自定义底部
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Return
                    </Button>,
                    <Button key="submit" type="primary" loading={isLoading} onClick={handleOk}>
                        Submit
                    </Button>,
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'Please input your name!' }]}
                    >
                        <Input placeholder="Please input your name" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Please input your email" />
                    </Form.Item>

                    <Form.Item
                        label="Department"
                        name="department"
                        rules={[{ required: true, message: 'Please select a department!' }]}
                    >
                        <Select placeholder="Please select a department">
                            <Option value="tech">Technology</Option>
                            <Option value="sales">Sales</Option>
                            <Option value="hr">Human Resources</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={4} placeholder="Please input description" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
```

### 2.6 菜单 (Menu)

```jsx
import React, { useState } from 'react';
import { Menu } from 'antd';
import {
    HomeOutlined,
    AppstoreOutlined,
    SettingOutlined,
    UserOutlined,
    LaptopOutlined,
    NotificationOutlined
} from '@ant-design/icons';

const MenuExample = () => {
    const [current, setCurrent] = useState('mail');

    const items = [
        {
            key: 'mail',
            icon: <HomeOutlined />,
            label: 'Navigation One',
        },
        {
            key: 'app',
            icon: <AppstoreOutlined />,
            label: 'Navigation Two',
        },
        {
            key: 'sub1',
            icon: <UserOutlined />,
            label: 'Navigation Three - Submenu',
            children: [
                {
                    key: 'sub1-1',
                    label: 'Option 1',
                },
                {
                    key: 'sub1-2',
                    label: 'Option 2',
                },
                {
                    key: 'sub1-3',
                    label: 'Option 3',
                },
                {
                    key: 'sub1-4',
                    label: 'Option 4',
                },
            ],
        },
        {
            key: 'sub2',
            icon: <LaptopOutlined />,
            label: 'Navigation Four - Submenu',
            children: [
                {
                    key: 'sub2-1',
                    label: 'Option 5',
                },
                {
                    key: 'sub2-2',
                    label: 'Option 6',
                },
            ],
        },
        {
            key: 'disabled',
            icon: <SettingOutlined />,
            label: 'Navigation Five - Disabled',
            disabled: true,
        },
    ];

    const onClick = (e) => {
        console.log('click', e);
        setCurrent(e.key);
    };

    return (
        <div style={{ display: 'flex', gap: 24 }}>
            {/* 水平菜单 */}
            <Menu
                onClick={onClick}
                selectedKeys={[current]}
                mode="horizontal"
                items={items}
                style={{ width: 500 }}
            />

            {/* 垂直菜单 */}
            <Menu
                onClick={onClick}
                selectedKeys={[current]}
                mode="vertical"
                items={items}
                style={{ width: 256 }}
            />

            {/* 内联折叠菜单 */}
            <Menu
                onClick={onClick}
                selectedKeys={[current]}
                mode="inlineCollapsed"
                items={items}
                style={{ width: 80 }}
            />
        </div>
    );
};
```

### 2.7 消息提示 (Message)

```jsx
import React from 'react';
import { Button, Space, message } from 'antd';

const MessageExample = () => {
    const [messageApi, contextHolder] = message.useMessage();

    const info = () => {
        message.info('This is an info message');
    };

    const success = () => {
        message.success('This is a success message');
    };

    const error = () => {
        message.error('This is an error message');
    };

    const warning = () => {
        message.warning('This is a warning message');
    };

    const loading = () => {
        const hide = message.loading('Action in progress..', 0);
        setTimeout(hide, 2500);
    };

    const customDuration = () => {
        message.success('This message will display for 5 seconds', 5);
    };

    return (
        <div>
            {contextHolder}
            <Space direction="vertical">
                <Space>
                    <Button onClick={info}>Info</Button>
                    <Button onClick={success}>Success</Button>
                    <Button onClick={error}>Error</Button>
                    <Button onClick={warning}>Warning</Button>
                </Space>
                <Space>
                    <Button onClick={loading}>Loading</Button>
                    <Button onClick={customDuration}>Custom Duration</Button>
                </Space>
            </Space>
        </div>
    );
};
```

### 2.8 通知提醒 (Notification)

```jsx
import React from 'react';
import { Button, Space, notification } from 'antd';

const { OpenArgsProps } = notification;

const NotificationExample = () => {
    const [api, contextHolder] = notification.useNotification();

    const openNotification = (placement) => {
        api.info({
            message: `Notification ${placement}`,
            description: 'This is the content of the notification.',
            placement,
        });
    };

    const openSuccessNotification = () => {
        api.success({
            message: 'Success Notification',
            description: 'This is a success notification message.',
            duration: 4,
        });
    };

    const openErrorNotification = () => {
        api.error({
            message: 'Error Notification',
            description: 'This is an error notification message.',
            duration: 4,
        });
    };

    const openWithIcon = () => {
        api.open({
            message: 'Notification Title',
            description: 'This is a notification with custom icon.',
            icon: <SmileOutlined style={{ color: '#108ee9' }} />,
        });
    };

    return (
        <div>
            {contextHolder}
            <Space direction="vertical">
                <Space>
                    <Button type="primary" onClick={() => openNotification('topLeft')}>
                        topLeft
                    </Button>
                    <Button onClick={() => openNotification('topRight')}>
                        topRight
                    </Button>
                </Space>
                <Space>
                    <Button onClick={() => openNotification('bottomLeft')}>
                        bottomLeft
                    </Button>
                    <Button onClick={() => openNotification('bottomRight')}>
                        bottomRight
                    </Button>
                </Space>
                <Space>
                    <Button onClick={openSuccessNotification}>Success</Button>
                    <Button onClick={openErrorNotification}>Error</Button>
                    <Button onClick={openWithIcon}>With Icon</Button>
                </Space>
            </Space>
        </div>
    );
};
```

---

## 3. 定制主题

### 3.1 ConfigProvider 配置

```jsx
import React from 'react';
import { ConfigProvider, Button, Card, Input } from 'antd';

// 使用预设主题
const App = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    // 主题颜色
                    colorPrimary: '#1677ff',
                    colorSuccess: '#52c41a',
                    colorWarning: '#faad14',
                    colorError: '#ff4d4f',
                    colorInfo: '#1677ff',

                    // 字体
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,

                    // 圆角
                    borderRadius: 6,

                    // 间距
                    marginXS: 8,
                    marginSM: 12,
                    margin: 16,
                    marginLG: 24,
                    marginXL: 32,
                },
                components: {
                    Button: {
                        controlHeight: 36,
                        paddingContentHorizontal: 16,
                    },
                    Input: {
                        controlHeight: 36,
                    },
                    Card: {
                        paddingLG: 24,
                    }
                }
            }}
        >
            <div>
                <Button type="primary">Primary Button</Button>
                <Input placeholder="Input" style={{ marginTop: 16 }} />
                <Card title="Card" style={{ marginTop: 16 }}>
                    Card Content
                </Card>
            </div>
        </ConfigProvider>
    );
};
```

### 3.2 深色主题

```jsx
import React from 'react';
import { ConfigProvider, Button, Input, Card, Space, theme } from 'antd';

const DarkThemeExample = () => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                },
            }}
        >
            <div style={{ padding: 24, background: '#000', minHeight: '100vh' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button type="primary">Primary</Button>
                    <Button>Default</Button>
                    <Input placeholder="Input" />
                    <Card title="Card">
                        Card Content
                    </Card>
                </Space>
            </div>
        </ConfigProvider>
    );
};
```

### 3.3 自定义主题变量

```jsx
import React from 'react';
import { ConfigProvider, Button, Slider, Rate, theme } from 'antd';

const CustomThemeExample = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#00b96b',
                    colorInfo: '#00b96b',
                    colorSuccess: '#389e0d',
                    colorError: '#cf1322',
                    colorWarning: '#d48806',
                    borderRadius: 8,
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 14,
                    wireframe: true,
                },
                components: {
                    Button: {
                        primaryShadow: '0 2px 8px rgba(0, 185, 107, 0.35)',
                        controlHeight: 40,
                    },
                    Input: {
                        activeBorderColor: '#00b96b',
                        hoverBorderColor: '#00b96b',
                    },
                    Slider: {
                        trackBg: '#00b96b',
                        handleColor: '#00b96b',
                        dotActiveBorderColor: '#00b96b',
                    }
                }
            }}
        >
            <div style={{ padding: 24 }}>
                <Space direction="vertical" size="large">
                    <Space>
                        <Button type="primary">Primary</Button>
                        <Button>Default</Button>
                        <Button type="dashed">Dashed</Button>
                    </Space>

                    <Input placeholder="Input" style={{ width: 200 }} />

                    <Rate defaultValue={4} />

                    <Slider defaultValue={30} />
                </Space>
            </div>
        </ConfigProvider>
    );
};
```

---

## 4. 项目中的使用示例

### 4.1 通用布局组件

```jsx
// 项目中的通用布局组件
import React from 'react';
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Space, theme } from 'antd';
import {
    UserOutlined,
    LaptopOutlined,
    NotificationOutlined,
    HomeOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const AppLayout = ({ children }) => {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const menuItems = [
        {
            key: '1',
            icon: <HomeOutlined />,
            label: 'Home',
        },
        {
            key: '2',
            icon: <LaptopOutlined />,
            label: 'Projects',
        },
        {
            key: '3',
            icon: <NotificationOutlined />,
            label: 'Notifications',
        },
        {
            key: '4',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                <div style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                    WebEnv
                </div>
                <Space size="middle">
                    <BellOutlined style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)' }} />
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
                    </Dropdown>
                </Space>
            </Header>
            <Layout>
                <Sider width={200} style={{ background: colorBgContainer }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['1']}
                        style={{ height: '100%', borderRight: 0 }}
                        items={menuItems}
                    />
                </Sider>
                <Layout style={{ padding: '0 24px 24px' }}>
                    <Breadcrumb style={{ margin: '16px 0' }}>
                        <Breadcrumb.Item>Home</Breadcrumb.Item>
                        <Breadcrumb.Item>Projects</Breadcrumb.Item>
                    </Breadcrumb>
                    <Content
                        style={{
                            padding: 24,
                            margin: 0,
                            minHeight: 280,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
```

### 4.2 数据表格组件

```jsx
// 项目中的高级表格组件
import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Input, Select, Tag, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from './hooks/useRequest'; // 假设的自定义 Hook

const { Option } = Select;

const DataTable = ({
    dataSource,
    loading,
    onRefresh,
    onEdit,
    onDelete,
    onAdd
}) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // 过滤数据
    const filteredData = useMemo(() => {
        return dataSource.filter(item => {
            const matchSearch = !searchText ||
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.email?.toLowerCase().includes(searchText.toLowerCase());
            const matchStatus = !statusFilter || item.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [dataSource, searchText, statusFilter]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'User', value: 'user' },
                { text: 'Guest', value: 'guest' },
            ],
            onFilter: (value, record) => record.role === value,
            render: (role) => {
                const colors = {
                    admin: 'red',
                    user: 'blue',
                    guest: 'default'
                };
                return <Tag color={colors[role]}>{role.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Inactive', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'default'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => onEdit?.(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete?.(record)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

    return (
        <div>
            {/* 工具栏 */}
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Input
                        placeholder="Search..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                        Refresh
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                        Add New
                    </Button>
                </Space>
            </div>

            {/* 表格 */}
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                pagination={{
                    total: filteredData.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};

export default DataTable;
```

### 4.3 表单对话框组件

```jsx
// 项目中的表单对话框组件
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Switch, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const UserFormModal = ({
    visible,
    onCancel,
    onOk,
    initialValues,
    isEdit = false
}) => {
    const [form] = Form.useForm();

    // 设置初始值
    useEffect(() => {
        if (visible) {
            if (isEdit && initialValues) {
                form.setFieldsValue({
                    ...initialValues,
                    birthDate: initialValues.birthDate ? dayjs(initialValues.birthDate) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues, isEdit, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const formattedValues = {
                ...values,
                birthDate: values.birthDate?.format('YYYY-MM-DD'),
            };
            onOk(formattedValues);
            message.success(isEdit ? 'User updated!' : 'User created!');
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit User' : 'Create User'}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText={isEdit ? 'Update' : 'Create'}
            width={640}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                preserve={false}
            >
                <Form.Item
                    name="username"
                    label="Username"
                    rules={[
                        { required: true, message: 'Please enter username!' },
                        { min: 3, message: 'Username must be at least 3 characters!' }
                    ]}
                >
                    <Input placeholder="Enter username" />
                </Form.Item>

                {!isEdit && (
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            { required: true, message: 'Please enter password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' }
                        ]}
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>
                )}

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please enter email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input placeholder="Enter email" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Phone"
                >
                    <Input placeholder="Enter phone number" />
                </Form.Item>

                <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: 'Please select a role!' }]}
                >
                    <Select placeholder="Select role">
                        <Option value="admin">Admin</Option>
                        <Option value="user">User</Option>
                        <Option value="guest">Guest</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="department"
                    label="Department"
                >
                    <Select placeholder="Select department" allowClear>
                        <Option value="tech">Technology</Option>
                        <Option value="sales">Sales</Option>
                        <Option value="hr">Human Resources</Option>
                        <Option value="marketing">Marketing</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="age"
                    label="Age"
                    rules={[
                        { type: 'number', min: 18, max: 100, message: 'Age must be between 18 and 100!' }
                    ]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} max={150} placeholder="Enter age" />
                </Form.Item>

                <Form.Item
                    name="birthDate"
                    label="Birth Date"
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="bio"
                    label="Bio"
                >
                    <TextArea rows={4} placeholder="Enter bio" maxLength={500} showCount />
                </Form.Item>

                <Form.Item
                    name="active"
                    label="Active"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UserFormModal;
```

### 4.4 状态管理组件

```jsx
// 项目中的全局状态管理组件
import React, { createContext, useContext, useState, useCallback } from 'react';
import { message, Modal } from 'antd';

// 创建 Context
const AppContext = createContext(null);

// 提供者组件
export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (credentials) => {
        setLoading(true);
        try {
            // 模拟登录
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUser({
                id: '1',
                name: 'Admin',
                email: 'admin@example.com',
                role: 'admin'
            });
            message.success('Login successful!');
            return true;
        } catch (error) {
            message.error('Login failed!');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        Modal.confirm({
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            onOk: () => {
                setUser(null);
                message.success('Logout successful!');
            }
        });
    }, []);

    const showConfirm = useCallback((options) => {
        Modal.confirm({
            title: options.title || 'Confirm',
            content: options.content || 'Are you sure?',
            onOk: options.onOk,
            onCancel: options.onCancel,
        });
    }, []);

    const value = {
        user,
        loading,
        login,
        logout,
        showConfirm,
        isAdmin: user?.role === 'admin',
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// 使用 Hook
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};
```

---

## 总结

Ant Design 是 React 生态中最流行的企业级 UI 组件库。通过本教程，你应该能够：

1. **基础使用**：理解 Ant Design 的基本用法和组件分类
2. **常用组件**：掌握按钮、输入框、表单、表格、模态框等核心组件的使用
3. **主题定制**：使用 ConfigProvider 进行主题配置和深色模式支持
4. **项目实践**：构建实际的布局组件、表格组件、表单组件等

在 WebEnv 项目中，Ant Design 用于构建用户界面，提供了丰富的组件和一致的视觉设计，让应用开发更加高效。

---

## 参考资源

- [Ant Design 官方文档](https://ant.design/components/overview-cn/)
- [Ant Design GitHub](https://github.com/ant-design/ant-design)
- [Ant Design Icons](https://ant.design/components/icon-cn/)
- [Ant Design Pro 组件](https://procomponents.ant.design/components/)
