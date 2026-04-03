# Java中台与低代码平台实战完全指南

## 前言：中台战略与低代码的兴起

大家好，我是老王。今天我们来聊聊Java中台开发和低代码平台这两个热门话题。

你们有没有这种感觉，企业里的系统越做越多，但是很多功能都是重复的。比如每个系统都要有用户管理、权限管理、报表功能。如果每个系统都自己做一遍，就是巨大的浪费。

于是乎，"中台"概念就诞生了。把企业里共用的业务能力抽离出来，形成独立的服务，供各个业务系统调用，这就是中台战略。

而"低代码"则是另一个热门方向。通过可视化的方式，让非技术人员也能快速开发应用，大大提高开发效率。

这两个方向都需要深入的Java功底，而且涉及很多设计思想和架构技巧。今天我们就来详细聊聊。

---

## 第一章：中台架构设计

### 1.1 什么是中台

要理解中台，先要从"前台"和"后台"说起。

**前台**：直接面向用户的系统，比如电商网站的购物车、结算页。特点是变化快、需求多。

**后台**：支撑企业运作的系统，比如ERP、CRM、财务系统。特点是稳定、数据量大。

问题来了：前台和后台的节奏完全不一样。前台要快速迭代，后台要稳定可靠。把它们放在一起，互相掣肘。

于是阿里在2015年提出了"中台"概念，把前台和后台中间的公共能力抽离出来，形成"中台"：

```
┌─────────────────────────────────────────────┐
│                   前台业务                    │
│   电商前台  社交前台  金融前台  医疗前台      │
└─────────────────────┬───────────────────────┘
                      │ 调用
┌─────────────────────▼───────────────────────┐
│                   中台服务                    │
│  用户中台  订单中台  支付中台  营销中台       │
│  会员中台  消息中台  文件中台  搜索中台       │
└─────────────────────┬───────────────────────┘
                      │ 调用
┌─────────────────────▼───────────────────────┐
│                   后台系统                    │
│      ERP系统   CRM系统   财务系统             │
└─────────────────────────────────────────────┘
```

### 1.2 中台的特点

1. **复用性**：中台服务可以被多个前台业务复用，避免重复建设
2. **稳定性**：中台服务相对稳定，不像前台那样频繁变化
3. **独立性**：中台服务独立部署，独立演进
4. **开放性**：通过API对外提供服务，支持各种调用方

### 1.3 中台服务划分原则

中台划分要遵循几个原则：

1. **单一职责**：每个中台服务只负责一个领域的事务
2. **高内聚低耦合**：服务内部高内聚，服务之间低耦合
3. **业务边界清晰**：避免服务之间的职责交叉
4. **粒度适中**：服务不能太大（难以维护），也不能太小（调用复杂）

常见的中台划分：

| 中台类型 | 包含能力 |
|---------|---------|
| 用户中台 | 用户注册、登录、认证、授权、用户画像 |
| 订单中台 | 订单创建、订单查询、订单取消、订单履约 |
| 支付中台 | 支付、退款、结算、对账 |
| 会员中台 | 会员等级、积分、权益、成长值 |
| 营销中台 | 优惠券、活动、抽奖、积分兑换 |
| 消息中台 | 短信、推送、邮件、站内信 |
| 文件中台 | 文件上传、存储、CDN、分发 |

---

## 第二章：低代码平台架构

### 2.1 什么是低代码平台

低代码平台（Low-Code Platform）是一种快速应用开发工具，通过可视化拖拽和少量代码，实现应用程序的开发。

**核心价值**：

1. **降低开发门槛**：非技术人员也能开发应用
2. **提高开发效率**：开发时间从几周缩短到几天
3. **减少开发成本**：减少对专业程序员的依赖

**适用场景**：

1.企业内部管理系统（OA、CRM、HR）
2.数据采集和报表
3.简单的工作流审批
4.原型快速验证

### 2.2 低代码平台整体架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         前端可视化编辑器                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ 表单设计 │ │ 流程设计 │ │ 列表设计 │ │ 报表设计 │ │ 页面设计 │     │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘     │
└───────┼──────────┼──────────┼──────────┼──────────┼───────────────┘
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                                    │
                              JSON Schema
                                    │
        ┌──────────────────────────┴──────────────────────────┐
        │                      运行时引擎                       │
        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
        │  │ 表单引擎 │ │ 流程引擎 │ │ 权限引擎 │ │ 渲染引擎 │       │
        │  └────────┘ └────────┘ └────────┘ └────────┘       │
        └──────────────────────────┬──────────────────────────┘
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        │                      代码生成器                       │
        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
        │  │ 前端代码 │ │ 后端代码 │ │ 数据库  │ │ 配置文件 │       │
        │  └────────┘ └────────┘ └────────┘ └────────┘       │
        └──────────────────────────────────────────────────────┘
```

---

## 第三章：表单引擎设计

### 3.1 表单引擎概述

表单是最常见的业务组件。低代码表单引擎让用户通过拖拽的方式设计表单，然后自动生成表单页面。

一个典型的表单设计界面：

```
┌─────────────────────────────────────────────────────────────────┐
│  表单设计                                                        │
├───────────────────────┬─────────────────────────────────────────┤
│     组件面板           │            画布区域                      │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐    │
│  │ 输入类组件       │  │  │                                 │    │
│  │  ├─ 单行文本    │  │  │      用户信息表单                │    │
│  │  ├─ 多行文本    │  │  │                                 │    │
│  │  ├─ 数字输入    │  │  │  ┌───────────────────────────┐ │    │
│  │  ├─ 手机号     │  │  │  │ 用户名：________________ │ │    │
│  │  └─ 邮箱       │  │  │  └───────────────────────────┘ │    │
│  │ 输入类组件      │  │  │  ┌───────────────────────────┐ │    │
│  │  ├─ 下拉选择   │  │  │  │ 手机号：________________ │ │    │
│  │  ├─ 单选框     │  │  │  └───────────────────────────┘ │    │
│  │  └─ 多选框     │  │  │  ┌───────────────────────────┐ │    │
│  │ 功能类组件      │  │  │  │ 部门：____[选择部门]____ │ │    │
│  │  ├─ 日期选择   │  │  │  └───────────────────────────┘ │    │
│  │  └─ 文件上传   │  │  │                                 │    │
│  └─────────────────┘  │  └─────────────────────────────────┘    │
├───────────────────────┴─────────────────────────────────────────┤
│  属性配置面板                                                    │
│  组件：单行文本                                                  │
│  ├─ 标题：用户名                                                 │
│  ├─ 占位符：请输入用户名                                         │
│  ├─ 是否必填：√                                                  │
│  └─ 校验规则：字母数字下划线                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 表单组件设计

```java
package com.example.lowcode.form.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 表单组件定义
 * 每个组件都有一组属性，用于设计时配置和运行时渲染
 */
@Data
public class FormComponent {

    /**
     * 组件唯一标识
     */
    private String id;

    /**
     * 组件类型
     * 如：input、select、date、upload等
     */
    private String type;

    /**
     * 组件名称（用于代码生成）
     * 如：TextInput、Select、DatePicker
     */
    private String name;

    /**
     * 组件显示名称
     */
    private String label;

    /**
     * 组件属性配置
     * 不同类型的组件有不同的属性
     */
    private Map<String, Object> props;

    /**
     * 校验规则
     */
    private List<ValidationRule> rules;

    /**
     * 组件选项（适用于选择类组件）
     * 如单选、多选、下拉
     */
    private List<ComponentOption> options;

    /**
     * 布局配置
     */
    private LayoutConfig layout;

    /**
     * 事件配置
     */
    private Map<String, String> events;
}

/**
 * 组件选项（选择类组件用）
 */
@Data
public class ComponentOption {

    /**
     * 选项标签
     */
    private String label;

    /**
     * 选项值
     */
    private String value;

    /**
     * 是否禁用
     */
    private Boolean disabled;
}

/**
 * 布局配置
 */
@Data
public class LayoutConfig {

    /**
     * 宽度（百分比）
     */
    private Integer width;

    /**
     * 高度
     */
    private Integer height;

    /**
     * X轴位置（第几列）
     */
    private Integer x;

    /**
     * Y轴位置（第几行）
     */
    private Integer y;

    /**
     * 跨列数
     */
    private Integer colSpan;

    /**
     * 跨行数
     */
    private Integer rowSpan;
}

/**
 * 校验规则
 */
@Data
public class ValidationRule {

    /**
     * 规则类型
     * required、pattern、min、max、minLength、maxLength、email、phone等
     */
    private String type;

    /**
     * 规则参数
     */
    private Object value;

    /**
     * 错误提示信息
     */
    private String message;
}
```

### 3.3 表单数据结构

```java
package com.example.lowcode.form.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 表单定义
 * 一个表单由多个组件组成
 */
@Data
public class FormDefinition {

    /**
     * 表单ID
     */
    private Long id;

    /**
     * 表单名称
     */
    private String name;

    /**
     * 表单编码（唯一标识）
     */
    private String code;

    /**
     * 表单版本
     */
    private Integer version;

    /**
     * 表单布局类型
     * pc：PC端表单
     * mobile：移动端表单
     * both：两者兼容
     */
    private String layoutType;

    /**
     * 表单组件列表（按顺序）
     */
    private List<FormComponent> components;

    /**
     * 表单属性
     */
    private FormProperties properties;

    /**
     * 表单事件
     */
    private Map<String, FormEvent> events;

    /**
     * 表单数据源
     */
    private List<DataSource> dataSources;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;
}

/**
 * 表单属性
 */
@Data
public class FormProperties {

    /**
     * 表单标题
     */
    private String title;

    /**
     * 表单描述
     */
    private String description;

    /**
     * 是否开启全局校验
     */
    private Boolean enableValidation;

    /**
     * 全局校验时机
     */
    private String validateTrigger;

    /**
     * 表单样式
     */
    private String customClass;

    /**
     * 表单提交地址（如果有）
     */
    private String submitUrl;

    /**
     * 表单提交方式
     */
    private String submitMethod;
}
```

### 3.4 表单JSON Schema

用户设计的表单最终会序列化成JSON存储在前端和后端：

```json
{
  "id": 1001,
  "name": "用户信息表单",
  "code": "user_info_form",
  "layoutType": "pc",
  "components": [
    {
      "id": "c1",
      "type": "input",
      "name": "TextInput",
      "label": "用户名",
      "props": {
        "placeholder": "请输入用户名",
        "maxLength": 20,
        "clearable": true
      },
      "rules": [
        {
          "type": "required",
          "message": "用户名不能为空"
        },
        {
          "type": "pattern",
          "value": "^[a-zA-Z]\\w{3,19}$",
          "message": "用户名必须以字母开头，长度4-20位"
        }
      ],
      "layout": {
        "x": 0,
        "y": 0,
        "colSpan": 12
      }
    },
    {
      "id": "c2",
      "type": "input",
      "name": "PhoneInput",
      "label": "手机号",
      "props": {
        "placeholder": "请输入手机号",
        "maxLength": 11
      },
      "rules": [
        {
          "type": "required",
          "message": "手机号不能为空"
        },
        {
          "type": "pattern",
          "value": "^1[3-9]\\d{9}$",
          "message": "请输入正确的手机号"
        }
      ],
      "layout": {
        "x": 12,
        "y": 0,
        "colSpan": 12
      }
    },
    {
      "id": "c3",
      "type": "select",
      "name": "Select",
      "label": "部门",
      "props": {
        "placeholder": "请选择部门",
        "allowClear": true
      },
      "options": [
        {"label": "技术部", "value": "tech"},
        {"label": "市场部", "value": "market"},
        {"label": "财务部", "value": "finance"}
      ],
      "layout": {
        "x": 0,
        "y": 1,
        "colSpan": 12
      }
    },
    {
      "id": "c4",
      "type": "date",
      "name": "DatePicker",
      "label": "入职日期",
      "props": {
        "placeholder": "请选择日期",
        "format": "YYYY-MM-DD"
      },
      "layout": {
        "x": 12,
        "y": 1,
        "colSpan": 12
      }
    }
  ],
  "properties": {
    "title": "用户信息",
    "enableValidation": true,
    "validateTrigger": "blur"
  }
}
```

### 3.5 表单渲染引擎

```java
package com.example.lowcode.form.renderer;

import com.example.lowcode.form.model.FormComponent;
import com.example.lowcode.form.model.FormDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 表单渲染引擎
 * 根据表单定义渲染表单组件
 */
@Slf4j
@Component
public class FormRenderer {

    /**
     * 渲染单个组件
     * 根据组件类型选择对应的渲染器
     */
    public String renderComponent(FormComponent component) {
        String type = component.getType();
        String name = component.getName();

        // 根据组件类型选择渲染策略
        switch (type) {
            case "input":
                return renderInput(component);
            case "select":
                return renderSelect(component);
            case "date":
                return renderDate(component);
            case "upload":
                return renderUpload(component);
            case "radio":
                return renderRadio(component);
            case "checkbox":
                return renderCheckbox(component);
            case "textarea":
                return renderTextarea(component);
            default:
                log.warn("未知组件类型：{}", type);
                return renderUnknown(component);
        }
    }

    /**
     * 渲染输入框组件
     */
    private String renderInput(FormComponent component) {
        Map<String, Object> props = component.getProps();

        // 获取属性
        String placeholder = (String) props.getOrDefault("placeholder", "");
        Integer maxLength = (Integer) props.get("maxLength");
        Boolean clearable = (Boolean) props.getOrDefault("clearable", false);

        // 生成Vue模板代码
        StringBuilder sb = new StringBuilder();
        sb.append("<el-input\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append("  placeholder=\"").append(placeholder).append("\"\n");

        if (maxLength != null) {
            sb.append("  maxlength=\"").append(maxLength).append("\"\n");
        }
        if (clearable) {
            sb.append("  clearable\n");
        }

        sb.append("/>");

        return sb.toString();
    }

    /**
     * 渲染下拉选择组件
     */
    private String renderSelect(FormComponent component) {
        Map<String, Object> props = component.getProps();
        String placeholder = (String) props.getOrDefault("placeholder", "请选择");

        StringBuilder sb = new StringBuilder();
        sb.append("<el-select\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append("  placeholder=\"").append(placeholder).append("\"\n");
        sb.append(">\n");

        // 生成选项
        if (component.getOptions() != null) {
            for (var option : component.getOptions()) {
                sb.append("  <el-option\n");
                sb.append("    label=\"").append(option.getLabel()).append("\"\n");
                sb.append("    value=\"").append(option.getValue()).append("\"\n");
                sb.append("  />\n");
            }
        }

        sb.append("</el-select>");

        return sb.toString();
    }

    /**
     * 渲染日期选择组件
     */
    private String renderDate(FormComponent component) {
        Map<String, Object> props = component.getProps();
        String format = (String) props.getOrDefault("format", "YYYY-MM-DD");

        StringBuilder sb = new StringBuilder();
        sb.append("<el-date-picker\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append("  type=\"date\"\n");
        sb.append("  placeholder=\"请选择日期\"\n");
        sb.append("  format=\"").append(format).append("\"\n");
        sb.append("  value-format=\"").append(format).append("\"\n");
        sb.append("/>");

        return sb.toString();
    }

    /**
     * 渲染文件上传组件
     */
    private String renderUpload(FormComponent component) {
        Map<String, Object> props = component.getProps();
        String accept = (String) props.getOrDefault("accept", "*");
        Integer maxSize = (Integer) props.getOrDefault("maxSize", 10);
        String action = (String) props.getOrDefault("action", "/api/upload");

        StringBuilder sb = new StringBuilder();
        sb.append("<el-upload\n");
        sb.append("  class=\"upload-demo\"\n");
        sb.append("  action=\"").append(action).append("\"\n");
        sb.append("  :on-success=\"handleUploadSuccess\"\n");
        sb.append("  :on-error=\"handleUploadError\"\n");
        sb.append("  :before-upload=\"(file) => beforeUpload(file, ").append(maxSize).append(")\"\n");
        sb.append(">\n");
        sb.append("  <el-button size=\"small\" type=\"primary\">点击上传</el-button>\n");
        sb.append("  <div slot=\"tip\" class=\"el-upload__tip\">");
        sb.append("上传文件不超过").append(maxSize).append("MB</div>\n");
        sb.append("</el-upload>");

        return sb.toString();
    }

    /**
     * 渲染单选组件
     */
    private String renderRadio(FormComponent component) {
        StringBuilder sb = new StringBuilder();
        sb.append("<el-radio-group\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append(">\n");

        if (component.getOptions() != null) {
            for (var option : component.getOptions()) {
                sb.append("  <el-radio label=\"").append(option.getValue()).append("\">");
                sb.append(option.getLabel()).append("</el-radio>\n");
            }
        }

        sb.append("</el-radio-group>");

        return sb.toString();
    }

    /**
     * 渲染多选组件
     */
    private String renderCheckbox(FormComponent component) {
        StringBuilder sb = new StringBuilder();
        sb.append("<el-checkbox-group\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append(">\n");

        if (component.getOptions() != null) {
            for (var option : component.getOptions()) {
                sb.append("  <el-checkbox label=\"").append(option.getValue()).append("\">");
                sb.append(option.getLabel()).append("</el-checkbox>\n");
            }
        }

        sb.append("</el-checkbox-group>");

        return sb.toString();
    }

    /**
     * 渲染文本域组件
     */
    private String renderTextarea(FormComponent component) {
        Map<String, Object> props = component.getProps();
        Integer rows = (Integer) props.getOrDefault("rows", 3);
        Integer maxLength = (Integer) props.get("maxLength");

        StringBuilder sb = new StringBuilder();
        sb.append("<el-input\n");
        sb.append("  type=\"textarea\"\n");
        sb.append("  v-model=\"formData.").append(component.getId()).append("\"\n");
        sb.append("  :rows=\"").append(rows).append("\"\n");

        if (maxLength != null) {
            sb.append("  maxlength=\"").append(maxLength).append("\"\n");
            sb.append("  show-word-limit\n");
        }

        sb.append("/>");

        return sb.toString();
    }

    /**
     * 渲染未知组件
     */
    private String renderUnknown(FormComponent component) {
        return "<!-- 未知组件类型: " + component.getType() + " -->";
    }

    /**
     * 渲染完整表单
     */
    public String renderForm(FormDefinition formDef) {
        StringBuilder sb = new StringBuilder();
        sb.append("<template>\n");
        sb.append("  <el-form\n");
        sb.append("    ref=\"formRef\"\n");
        sb.append("    :model=\"formData\"\n");
        sb.append("    :rules=\"formRules\"\n");

        FormProperties props = formDef.getProperties();
        if (props != null) {
            sb.append("    label-width=\"100px\"\n");
            if (props.getCustomClass() != null) {
                sb.append("    class=\"").append(props.getCustomClass()).append("\"\n");
            }
        }

        sb.append("  >\n");

        // 渲染标题
        if (props != null && props.getTitle() != null) {
            sb.append("    <el-divider>").append(props.getTitle()).append("</el-divider>\n");
        }

        // 渲染所有组件
        for (FormComponent component : formDef.getComponents()) {
            sb.append("    <el-form-item\n");
            sb.append("      label=\"").append(component.getLabel()).append("\"\n");

            // 添加校验规则
            if (component.getRules() != null && !component.getRules().isEmpty()) {
                sb.append("      prop=\"").append(component.getId()).append("\"\n");
            }

            sb.append("    >\n");
            sb.append("      ").append(renderComponent(component)).append("\n");
            sb.append("    </el-form-item>\n");
        }

        // 渲染提交按钮
        sb.append("    <el-form-item>\n");
        sb.append("      <el-button type=\"primary\" @click=\"submitForm\">提交</el-button>\n");
        sb.append("      <el-button @click=\"resetForm\">重置</el-button>\n");
        sb.append("    </el-form-item>\n");

        sb.append("  </el-form>\n");
        sb.append("</template>\n");

        return sb.toString();
    }
}
```

---

## 第四章：流程引擎设计

### 4.1 流程引擎概述

流程引擎是低代码平台的核心组件之一，用于自动化业务流程。常见场景：

1. **审批流**：请假申请、报销审批、采购审批
2. **业务流**：订单处理、客户服务、工单处理
3. **数据流**：数据采集、数据处理、数据分发

### 4.2 流程模型设计

```java
package com.example.lowcode.workflow.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 流程定义
 */
@Data
public class WorkflowDefinition {

    /**
     * 流程ID
     */
    private Long id;

    /**
     * 流程名称
     */
    private String name;

    /**
     * 流程编码
     */
    private String code;

    /**
     * 流程版本
     */
    private Integer version;

    /**
     * 流程描述
     */
    private String description;

    /**
     * 流程分类
     */
    private String category;

    /**
     * 流程状态
     * draft：草稿
     * published：已发布
     * disabled：已禁用
     */
    private String status;

    /**
     * 流程节点列表
     */
    private List<FlowNode> nodes;

    /**
     * 流程连线列表
     */
    private List<FlowLine> lines;

    /**
     * 流程表单配置
     */
    private Long formId;

    /**
     * 流程变量
     */
    private Map<String, Object> variables;

    /**
     * 创建时间
     */
    private Long createTime;
}

/**
 * 流程节点
 */
@Data
public class FlowNode {

    /**
     * 节点ID
     */
    private String id;

    /**
     * 节点名称
     */
    private String name;

    /**
     * 节点类型
     * start：开始节点
     * end：结束节点
     * taskUser：用户任务节点
     * taskSystem：系统任务节点
     * gateway：网关节点
     * subProcess：子流程节点
     */
    private String type;

    /**
     * 节点位置
     */
    private NodePosition position;

    /**
     * 节点属性
     */
    private NodeProperties properties;
}

/**
 * 节点位置
 */
@Data
public class NodePosition {
    private Double x;
    private Double y;
    private Double width;
    private Double height;
}

/**
 * 节点属性
 */
@Data
public class NodeProperties {

    /**
     * 节点别名
     */
    private String alias;

    /**
     * 节点描述
     */
    private String description;

    /**
     * 节点样式
     */
    private Map<String, Object> style;

    /**
     * ======== 用户任务节点属性 ========
     */

    /**
     * 办理人类型
     * assign：指定办理人
     * candidate：候选办理人
     * role：角色办理
     * dept：部门办理
     * parent：上级办理
     * expression：表达式办理
     */
    private String assigneeType;

    /**
     * 指定办理人ID
     */
    private Long assigneeId;

    /**
     * 候选办理人列表
     */
    private List<Long> candidateUserIds;

    /**
     * 候选角色列表
     */
    private List<String> candidateRoles;

    /**
     * 候选部门列表
     */
    private List<Long> candidateDeptIds;

    /**
     * 表达式
     */
    private String expression;

    /**
     * 多人会签方式
     * all：所有会签人都审批通过才算通过
     * one：任一会签人审批通过就算通过
     */
    private String multiInstanceType;

    /**
     * 会签人数
     */
    private Integer multiInstanceCount;

    /**
     * 节点表单ID
     */
    private Long nodeFormId;

    /**
     * ======== 网关节点属性 ========
     */

    /**
     * 网关类型
     * exclusive：排他网关
     * parallel：并行网关
     * inclusive：包容网关
     */
    private String gatewayType;

    /**
     * 条件表达式
     */
    private List<ConditionExpression> conditions;

    /**
     * ======== 系统任务节点属性 ========
     */

    /**
     * 系统任务类型
     * script：脚本任务
     * service：服务任务
     * message：消息任务
     */
    private String taskType;

    /**
     * 任务处理器
     */
    private String handler;

    /**
     * 任务参数
     */
    private Map<String, Object> handlerParams;
}

/**
 * 流程连线
 */
@Data
public class FlowLine {

    /**
     * 连线ID
     */
    private String id;

    /**
     * 起点节点ID
     */
    private String sourceNodeId;

    /**
     * 终点节点ID
     */
    private String targetNodeId;

    /**
     * 连线类型
     */
    private String type;

    /**
     * 连线标签
     */
    private String label;

    /**
     * 条件表达式
     */
    private String expression;

    /**
     * 连线样式
     */
    private Map<String, Object> style;
}

/**
 * 条件表达式
 */
@Data
public class ConditionExpression {

    /**
     * 条件ID
     */
    private String id;

    /**
     * 条件描述
     */
    private String description;

    /**
     * 表达式内容
     */
    private String expression;

    /**
     * 优先级
     */
    private Integer priority;
}
```

### 4.3 流程JSON定义示例

```json
{
  "id": 1001,
  "name": "请假审批流程",
  "code": "leave_approval",
  "version": 1,
  "status": "published",
  "nodes": [
    {
      "id": "node_start",
      "type": "start",
      "name": "开始",
      "position": {"x": 100, "y": 100, "width": 80, "height": 80},
      "properties": {}
    },
    {
      "id": "node_apply",
      "type": "taskUser",
      "name": "填写请假申请",
      "position": {"x": 250, "y": 100, "width": 120, "height": 80},
      "properties": {
        "assigneeType": "assign",
        "assigneeId": 1001,
        "nodeFormId": 1001
      }
    },
    {
      "id": "node_gateway_1",
      "type": "gateway",
      "name": "请假类型",
      "position": {"x": 430, "y": 100, "width": 80, "height": 80},
      "properties": {
        "gatewayType": "exclusive",
        "conditions": [
          {
            "id": "cond_1",
            "description": "事假",
            "expression": "${holidayType == 'personal'}",
            "priority": 1
          },
          {
            "id": "cond_2",
            "description": "病假",
            "expression": "${holidayType == 'sick'}",
            "priority": 2
          },
          {
            "id": "cond_3",
            "description": "年假",
            "expression": "${holidayType == 'annual'}",
            "priority": 3
          }
        ]
      }
    },
    {
      "id": "node_leader",
      "type": "taskUser",
      "name": "部门主管审批",
      "position": {"x": 580, "y": 50, "width": 120, "height": 80},
      "properties": {
        "assigneeType": "role",
        "candidateRoles": ["manager"],
        "multiInstanceType": "one"
      }
    },
    {
      "id": "node_hr",
      "type": "taskUser",
      "name": "HR审批",
      "position": {"x": 580, "y": 180, "width": 120, "height": 80},
      "properties": {
        "assigneeType": "role",
        "candidateRoles": ["hr"]
      }
    },
    {
      "id": "node_end",
      "type": "end",
      "name": "结束",
      "position": {"x": 770, "y": 100, "width": 80, "height": 80},
      "properties": {}
    }
  ],
  "lines": [
    {
      "id": "line_1",
      "sourceNodeId": "node_start",
      "targetNodeId": "node_apply",
      "type": "default"
    },
    {
      "id": "line_2",
      "sourceNodeId": "node_apply",
      "targetNodeId": "node_gateway_1",
      "type": "default"
    },
    {
      "id": "line_3",
      "sourceNodeId": "node_gateway_1",
      "targetNodeId": "node_leader",
      "expression": "${holidayType != 'sick'}",
      "label": "事假/年假"
    },
    {
      "id": "line_4",
      "sourceNodeId": "node_gateway_1",
      "targetNodeId": "node_hr",
      "expression": "${holidayType == 'sick' && days > 3}",
      "label": "病假>3天"
    },
    {
      "id": "line_5",
      "sourceNodeId": "node_leader",
      "targetNodeId": "node_end",
      "expression": "${approved == true}",
      "label": "通过"
    },
    {
      "id": "line_6",
      "sourceNodeId": "node_leader",
      "targetNodeId": "node_apply",
      "expression": "${approved == false}",
      "label": "驳回"
    },
    {
      "id": "line_7",
      "sourceNodeId": "node_hr",
      "targetNodeId": "node_end",
      "expression": "${approved == true}",
      "label": "通过"
    },
    {
      "id": "line_8",
      "sourceNodeId": "node_hr",
      "targetNodeId": "node_apply",
      "expression": "${approved == false}",
      "label": "驳回"
    }
  ],
  "formId": 1001
}
```

### 4.4 流程执行引擎

```java
package com.example.lowcode.workflow.engine;

import com.example.lowcode.workflow.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 流程执行引擎
 * 负责流程的启动、流转、节点执行
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowEngine {

    private final WorkflowDefinitionService definitionService;
    private final FlowNodeExecutor nodeExecutor;
    private final ConditionEvaluator conditionEvaluator;

    /**
     * 启动流程实例
     *
     * @param definitionId 流程定义ID
     * @param starterUserId 发起人ID
     * @param variables 流程变量（如请假天数、请假类型等）
     * @return 流程实例ID
     */
    public String startProcess(Long definitionId, Long starterUserId, Map<String, Object> variables) {
        // 1. 获取流程定义
        WorkflowDefinition definition = definitionService.getById(definitionId);
        if (definition == null) {
            throw new WorkflowException("流程定义不存在");
        }
        if (!"published".equals(definition.getStatus())) {
            throw new WorkflowException("流程未发布");
        }

        // 2. 创建流程实例
        String instanceId = generateInstanceId();
        ProcessInstance instance = new ProcessInstance();
        instance.setId(instanceId);
        instance.setDefinitionId(definitionId);
        instance.setDefinitionCode(definition.getCode());
        instance.setStarterUserId(starterUserId);
        instance.setStatus("running");
        instance.setVariables(new HashMap<>(variables));

        // 3. 找到开始节点
        FlowNode startNode = findStartNode(definition);
        instance.setCurrentNodeId(startNode.getId());

        // 4. 保存实例
        processInstanceService.save(instance);

        // 5. 执行开始节点
        executeNode(instance, startNode);

        // 6. 流转到下一个节点
        FlowNode nextNode = findNextNode(definition, startNode, instance.getVariables());
        if (nextNode != null) {
            moveToNext(instance, nextNode);
        }

        log.info("流程启动成功，实例ID：{}，流程：{}，发起人：{}",
                instanceId, definition.getName(), starterUserId);

        return instanceId;
    }

    /**
     * 执行节点任务
     *
     * @param instanceId 流程实例ID
     * @param nodeId 节点ID
     * @param userId 办理人ID
     * @param action 操作类型（approve/reject/back/toEnd）
     * @param variables 办理意见和变量
     */
    public void executeTask(String instanceId, String nodeId, Long userId,
                            String action, Map<String, Object> variables) {
        // 1. 获取流程实例
        ProcessInstance instance = processInstanceService.getById(instanceId);
        if (instance == null) {
            throw new WorkflowException("流程实例不存在");
        }

        // 2. 获取流程定义
        WorkflowDefinition definition = definitionService.getById(instance.getDefinitionId());
        FlowNode currentNode = findNodeById(definition, nodeId);

        // 3. 校验办理权限
        validateAssignee(instance, currentNode, userId);

        // 4. 执行节点操作
        NodeExecution execution = new NodeExecution();
        execution.setInstanceId(instanceId);
        execution.setNodeId(nodeId);
        execution.setUserId(userId);
        execution.setAction(action);
        execution.setVariables(variables);
        execution.setStartTime(new Date());

        // 5. 执行节点逻辑
        nodeExecutor.execute(currentNode, execution);

        // 6. 记录任务历史
        taskHistoryService.save(execution);

        // 7. 根据操作类型决定下一步
        switch (action) {
            case "approve":
                handleApprove(instance, definition, currentNode, variables);
                break;
            case "reject":
                handleReject(instance, definition, currentNode, variables);
                break;
            case "back":
                handleBack(instance, definition, currentNode, variables);
                break;
            default:
                throw new WorkflowException("未知操作类型：" + action);
        }

        execution.setEndTime(new Date());
        log.info("任务执行完成，实例：{}，节点：{}，操作：{}，办理人：{}",
                instanceId, currentNode.getName(), action, userId);
    }

    /**
     * 处理审批通过
     */
    private void handleApprove(ProcessInstance instance, WorkflowDefinition definition,
                               FlowNode currentNode, Map<String, Object> variables) {
        // 更新流程变量
        instance.getVariables().putAll(variables);

        // 查找下一个节点
        FlowNode nextNode = findNextNode(definition, currentNode, instance.getVariables());

        if (nextNode == null) {
            // 没有下一个节点，流程结束
            completeProcess(instance);
        } else if ("end".equals(nextNode.getType())) {
            // 下一个节点是结束节点
            executeNode(instance, nextNode);
            completeProcess(instance);
        } else {
            // 移动到下一个节点
            moveToNext(instance, nextNode);
        }
    }

    /**
     * 处理驳回
     */
    private void handleReject(ProcessInstance instance, WorkflowDefinition definition,
                              FlowNode currentNode, Map<String, Object> variables) {
        // 更新流程变量
        instance.getVariables().putAll(variables);

        // 驳回到发起人
        FlowNode startNode = findStartNode(definition);
        moveToNode(instance, startNode, variables);

        log.info("流程驳回到发起人，实例：{}", instance.getId());
    }

    /**
     * 移动到下一个节点
     */
    private void moveToNext(ProcessInstance instance, FlowNode nextNode) {
        // 更新实例当前节点
        instance.setCurrentNodeId(nextNode.getId());
        processInstanceService.update(instance);

        // 执行目标节点
        executeNode(instance, nextNode);

        // 如果是用户任务节点，创建任务
        if ("taskUser".equals(nextNode.getType())) {
            createTask(instance, nextNode);
        }

        // 如果是结束节点，完成流程
        if ("end".equals(nextNode.getType())) {
            completeProcess(instance);
        }
    }

    /**
     * 执行节点
     */
    private void executeNode(ProcessInstance instance, FlowNode node) {
        NodeExecution execution = new NodeExecution();
        execution.setInstanceId(instance.getId());
        execution.setNodeId(node.getId());
        execution.setNodeName(node.getName());
        execution.setStartTime(new Date());

        // 根据节点类型执行
        switch (node.getType()) {
            case "start":
                nodeExecutor.executeStart(node, execution);
                break;
            case "end":
                nodeExecutor.executeEnd(node, execution);
                break;
            case "taskUser":
                // 用户任务节点不在这里执行，创建任务等待办理
                break;
            case "taskSystem":
                nodeExecutor.executeSystemTask(node, execution);
                break;
            case "gateway":
                nodeExecutor.executeGateway(node, execution);
                break;
        }

        execution.setEndTime(new Date());
        nodeExecutionHistoryService.save(execution);
    }

    /**
     * 创建任务
     */
    private void createTask(ProcessInstance instance, FlowNode node) {
        Task task = new Task();
        task.setId(generateTaskId());
        task.setInstanceId(instance.getId());
        task.setNodeId(node.getId());
        task.setNodeName(node.getName());
        task.setAssigneeType(node.getProperties().getAssigneeType());
        task.setAssigneeId(node.getProperties().getAssigneeId());
        task.setCandidateUsers(node.getProperties().getCandidateUserIds());
        task.setStatus("pending");
        task.setCreateTime(new Date());

        taskService.save(task);

        // 通知办理人（发送消息/推送/邮件等）
        notifyAssignee(task);

        log.info("创建任务，任务ID：{}，节点：{}，办理人类型：{}",
                task.getId(), node.getName(), node.getProperties().getAssigneeType());
    }

    /**
     * 查找开始节点
     */
    private FlowNode findStartNode(WorkflowDefinition definition) {
        return definition.getNodes().stream()
                .filter(n -> "start".equals(n.getType()))
                .findFirst()
                .orElseThrow(() -> new WorkflowException("流程定义缺少开始节点"));
    }

    /**
     * 根据ID查找节点
     */
    private FlowNode findNodeById(WorkflowDefinition definition, String nodeId) {
        return definition.getNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElseThrow(() -> new WorkflowException("节点不存在：" + nodeId));
    }

    /**
     * 查找下一个节点
     * 根据条件表达式计算，找到满足条件的下一个节点
     */
    private FlowNode findNextNode(WorkflowDefinition definition, FlowNode currentNode,
                                  Map<String, Object> variables) {
        // 获取从当前节点出发的所有连线
        List<FlowLine> outgoingLines = definition.getLines().stream()
                .filter(l -> l.getSourceNodeId().equals(currentNode.getId()))
                .toList();

        if (outgoingLines.isEmpty()) {
            return null;
        }

        // 排他网关：只选一个满足条件的
        // 并行网关：所有满足条件的都要走

        // 找满足条件的连线
        List<FlowLine> matchedLines = new ArrayList<>();
        for (FlowLine line : outgoingLines) {
            if (line.getExpression() == null || line.getExpression().isEmpty()) {
                // 没有条件表达式，默认连线
                matchedLines.add(line);
            } else {
                // 计算条件表达式
                boolean result = conditionEvaluator.evaluate(line.getExpression(), variables);
                if (result) {
                    matchedLines.add(line);
                }
            }
        }

        if (matchedLines.isEmpty()) {
            return null;
        }

        // 如果有多条连线，可能是并行网关，需要返回所有
        // 这里简化处理，只返回第一条
        FlowLine selectedLine = matchedLines.get(0);

        // 根据连线的目标节点ID找到目标节点
        return findNodeById(definition, selectedLine.getTargetNodeId());
    }

    /**
     * 完成流程
     */
    private void completeProcess(ProcessInstance instance) {
        instance.setStatus("completed");
        instance.setEndTime(new Date());
        processInstanceService.update(instance);

        log.info("流程实例完成，实例ID：{}", instance.getId());
    }

    /**
     * 生成流程实例ID
     */
    private String generateInstanceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String generateTaskId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
```

---

## 第五章：权限模型设计

### 5.1 权限模型概述

低代码平台需要灵活的权限控制，包括：

1. **菜单权限**：能看到哪些菜单
2. **页面权限**：能看到哪些页面
3. **按钮权限**：能看到哪些按钮
4. **数据权限**：能操作哪些数据

### 5.2 RBAC权限模型

RBAC（Role-Based Access Control）是目前最流行的权限模型：

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│   用户   │ ──────> │   角色   │ ──────> │   权限   │
└─────────┘  N:N    └─────────┘  N:N    └─────────┘
                           │
                           │
                    ┌──────┴──────┐
                    │             │
               ┌────▼────┐  ┌────▼────┐
               │ 菜单权限 │  │ 数据权限 │
               └─────────┘  └─────────┘
```

```java
package com.example.lowcode.auth.model;

import lombok.Data;
import java.util.List;
import java.util.Set;

/**
 * 用户实体
 */
@Data
public class User {

    private Long id;

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码（加密存储）
     */
    private String password;

    /**
     * 姓名
     */
    private String name;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 状态：1启用，0禁用
     */
    private Integer status;

    /**
     * 用户角色列表
     */
    private List<Role> roles;

    /**
     * 用户部门
     */
    private Long deptId;

    /**
     * 数据权限范围
     * all：全部数据
     * dept：本部门数据
     * deptAndChild：本部门及下级数据
     * self：仅本人数据
     */
    private String dataScope;
}

/**
 * 角色实体
 */
@Data
public class Role {

    private Long id;

    /**
     * 角色编码
     */
    private String code;

    /**
     * 角色名称
     */
    private String name;

    /**
     * 角色类型
     */
    private String type;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 角色权限列表
     */
    private List<Permission> permissions;

    /**
     * 关联菜单ID列表
     */
    private Set<Long> menuIds;
}

/**
 * 权限实体
 */
@Data
public class Permission {

    private Long id;

    /**
     * 权限编码
     */
    private String code;

    /**
     * 权限名称
     */
    private String name;

    /**
     * 权限类型
     * menu：菜单权限
     * button：按钮权限
     * api：接口权限
     * data：数据权限
     */
    private String type;

    /**
     * 权限描述
     */
    private String description;

    /**
     * 所属模块
     */
    private String module;
}

/**
 * 菜单实体
 */
@Data
public class Menu {

    private Long id;

    /**
     * 菜单编码
     */
    private String code;

    /**
     * 菜单名称
     */
    private String name;

    /**
     * 父菜单ID
     */
    private Long parentId;

    /**
     * 菜单路径
     */
    private String path;

    /**
     * 菜单图标
     */
    private String icon;

    /**
     * 菜单组件路径
     */
    private String component;

    /**
     * 排序号
     */
    private Integer sort;

    /**
     * 菜单类型
     * 0：目录
     * 1：菜单
     * 2：按钮
     */
    private Integer type;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 关联权限ID列表
     */
    private Set<Long> permissionIds;
}
```

### 5.3 权限判断实现

```java
package com.example.lowcode.auth.service.impl;

import com.example.lowcode.auth.model.User;
import com.example.lowcode.auth.model.Role;
import com.example.lowcode.auth.model.Menu;
import com.example.lowcode.auth.model.Permission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 权限服务
 * 负责权限判断和数据权限过滤
 */
@Slf4j
@Service
public class PermissionService {

    /**
     * 判断用户是否有某个权限
     */
    public boolean hasPermission(Long userId, String permissionCode) {
        User user = getUserById(userId);
        if (user == null || user.getStatus() != 1) {
            return false;
        }

        // 获取用户所有权限
        Set<String> userPermissions = getUserPermissions(user);

        return userPermissions.contains(permissionCode);
    }

    /**
     * 判断用户是否有某个菜单权限
     */
    public boolean hasMenuPermission(Long userId, String menuCode) {
        User user = getUserById(userId);
        if (user == null || user.getStatus() != 1) {
            return false;
        }

        // 获取用户所有菜单
        Set<String> userMenus = getUserMenus(user);

        return userMenus.contains(menuCode);
    }

    /**
     * 获取用户的权限列表
     */
    public Set<String> getUserPermissions(User user) {
        Set<String> permissions = new HashSet<>();

        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                if (role.getPermissions() != null) {
                    for (Permission permission : role.getPermissions()) {
                        permissions.add(permission.getCode());
                    }
                }
            }
        }

        return permissions;
    }

    /**
     * 获取用户的菜单列表
     */
    public Set<String> getUserMenus(User user) {
        Set<String> menus = new HashSet<>();

        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                if (role.getMenuIds() != null) {
                    // 查询菜单信息
                    List<Menu> roleMenus = menuService.listByIds(role.getMenuIds());
                    for (Menu menu : roleMenus) {
                        menus.add(menu.getCode());
                    }
                }
            }
        }

        return menus;
    }

    /**
     * 获取用户菜单树
     */
    public List<Menu> getUserMenuTree(Long userId) {
        User user = getUserById(userId);
        if (user == null) {
            return Collections.emptyList();
        }

        // 获取用户所有菜单
        Set<Long> menuIds = new HashSet<>();
        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                if (role.getMenuIds() != null) {
                    menuIds.addAll(role.getMenuIds());
                }
            }
        }

        // 查询菜单详情
        List<Menu> allMenus = menuService.listByIds(menuIds);

        // 过滤禁用的菜单
        allMenus = allMenus.stream()
                .filter(m -> m.getStatus() == 1)
                .collect(Collectors.toList());

        // 构建菜单树
        return buildMenuTree(allMenus);
    }

    /**
     * 构建菜单树
     */
    private List<Menu> buildMenuTree(List<Menu> menus) {
        Map<Long, List<Menu>> parentIdMap = menus.stream()
                .collect(Collectors.groupingBy(Menu::getParentId));

        List<Menu> rootMenus = parentIdMap.getOrDefault(0L, Collections.emptyList());

        for (Menu menu : rootMenus) {
            buildChildren(menu, parentIdMap);
        }

        return rootMenus;
    }

    /**
     * 递归构建子菜单
     */
    private void buildChildren(Menu parent, Map<Long, List<Menu>> parentIdMap) {
        List<Menu> children = parentIdMap.getOrDefault(parent.getId(), Collections.emptyList());
        parent.setChildren(children);

        for (Menu child : children) {
            buildChildren(child, parentIdMap);
        }
    }

    /**
     * 数据权限过滤
     * 根据用户的数据权限范围，过滤查询条件
     */
    public <T> void filterDataScope(Class<T> entityClass, User user, QueryWrapper<T> queryWrapper) {
        // 超级管理员不过滤
        if (isSuperAdmin(user)) {
            return;
        }

        String dataScope = user.getDataScope();
        if (dataScope == null) {
            dataScope = "self";
        }

        switch (dataScope) {
            case "all":
                // 全部数据，不过滤
                break;

            case "dept":
                // 本部门数据
                queryWrapper.eq("dept_id", user.getDeptId());
                break;

            case "deptAndChild":
                // 本部门及下级数据
                List<Long> deptIds = getChildDeptIds(user.getDeptId());
                queryWrapper.in("dept_id", deptIds);
                break;

            case "self":
                // 仅本人数据
                queryWrapper.eq("create_user_id", user.getId());
                break;

            default:
                log.warn("未知的数据权限范围：{}", dataScope);
                queryWrapper.eq("create_user_id", user.getId());
        }
    }

    /**
     * 获取子部门ID列表
     */
    private List<Long> getChildDeptIds(Long parentDeptId) {
        List<Long> deptIds = new ArrayList<>();
        deptIds.add(parentDeptId);

        // 递归获取子部门
        List<Dept> childDepts = deptService.listByParentId(parentDeptId);
        for (Dept child : childDepts) {
            deptIds.addAll(getChildDeptIds(child.getId()));
        }

        return deptIds;
    }

    /**
     * 判断是否是超级管理员
     */
    private boolean isSuperAdmin(User user) {
        // 超级管理员的判断逻辑，根据实际情况实现
        return user.getId() != null && user.getId() == 1L;
    }
}
```

---

## 第六章：代码生成器设计

### 6.1 代码生成器概述

代码生成器是低代码平台的核心功能之一。根据用户设计的表单、列表、流程，自动生成Java后端代码和Vue前端代码。

### 6.2 代码生成配置

```java
package com.example.lowcode.codegen.model;

import lombok.Data;
import java.util.List;

/**
 * 代码生成配置
 */
@Data
public class CodeGenConfig {

    /**
     * 生成的业务名称
     */
    private String businessName;

    /**
     * 生成的功能描述
     */
    private String functionDesc;

    /**
     * 作者
     */
    private String author;

    /**
     * 模块名（如 sys、order、product）
     */
    private String moduleName;

    /**
     * 包名（如 com.example.system）
     */
    private String packageName;

    /**
     * 表名
     */
    private String tableName;

    /**
     * 表前缀
     */
    private String tablePrefix;

    /**
     * 类名前缀
     */
    private String classPrefix;

    /**
     * 类名后缀
     */
    private String classSuffix;

    /**
     * 是否生成增删改查
     */
    private Boolean generateCrud = true;

    /**
     * 是否生成列表页
     */
    private Boolean generateList = true;

    /**
     * 是否生成表单页
     */
    private Boolean generateForm = true;

    /**
     * 是否生成导出功能
     */
    private Boolean generateExport = false;

    /**
     * 是否生成导入功能
     */
    private Boolean generateImport = false;

    /**
     * 菜单ID
     */
    private Long menuId;

    /**
     * 上级菜单ID
     */
    private Long parentMenuId;

    /**
     * 生成的表字段列表
     */
    private List<TableColumn> columns;
}

/**
 * 表字段配置
 */
@Data
public class TableColumn {

    /**
     * 字段名称
     */
    private String columnName;

    /**
     * 字段注释
     */
    private String columnComment;

    /**
     * 字段类型
     */
    private String columnType;

    /**
     * Java类型
     */
    private String javaType;

    /**
     * Java属性名
     */
    private String javaField;

    /**
     * 是否主键
     */
    private Boolean isPk;

    /**
     * 是否自增
     */
    private Boolean isIncrement;

    /**
     * 是否必填
     */
    private Boolean isRequired;

    /**
     * 是否为查询条件
     */
    private Boolean isQuery;

    /**
     * 查询方式
     * eq：等于
     * ne：不等于
     * like：模糊查询
     * gt：大于
     * lt：小于
     * between：范围查询
     */
    private String queryType;

    /**
     * 展示类型
     * input：文本输入
     * textarea：文本域
     * select：下拉选择
     * radio：单选框
     * checkbox：多选框
     * date：日期选择
     * datetime：日期时间选择
     * upload：文件上传
     * image：图片上传
     * editor：富文本编辑器
     */
    private String displayType;

    /**
     * 字典编码（如果有）
     */
    private String dictCode;

    /**
     * 列表是否显示
     */
    private Boolean isList;

    /**
     * 表单是否显示
     */
    private Boolean isForm;

    /**
     * 列表页排序
     */
    private Integer listSort;
}
```

### 6.3 代码生成器实现

```java
package com.example.lowcode.codegen.service.impl;

import com.example.lowcode.codegen.model.CodeGenConfig;
import com.example.lowcode.codegen.model.TableColumn;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 代码生成器实现
 */
@Slf4j
@Service
public class CodeGeneratorService {

    /**
     * 生成所有代码
     */
    public CodeGenResult generate(CodeGenConfig config) {
        CodeGenResult result = new CodeGenResult();

        try {
            // 1. 准备模板数据
            Map<String, Object> templateData = prepareTemplateData(config);

            // 2. 生成后端代码
            if (config.getGenerateCrud()) {
                result.setEntityCode(generateEntity(config, templateData));
                result.setMapperCode(generateMapper(config, templateData));
                result.setServiceCode(generateService(config, templateData));
                result.setControllerCode(generateController(config, templateData));
            }

            // 3. 生成前端代码
            if (config.getGenerateList()) {
                result.setListVueCode(generateListVue(config, templateData));
            }

            if (config.getGenerateForm()) {
                result.setFormVueCode(generateFormVue(config, templateData));
            }

            // 4. 生成SQL
            result.setSqlCode(generateSql(config, templateData));

            log.info("代码生成成功，模块：{}，表：{}", config.getModuleName(), config.getTableName());

        } catch (Exception e) {
            log.error("代码生成失败", e);
            throw new RuntimeException("代码生成失败：" + e.getMessage());
        }

        return result;
    }

    /**
     * 准备模板数据
     */
    private Map<String, Object> prepareTemplateData(CodeGenConfig config) {
        Map<String, Object> data = new HashMap<>();

        // 基本信息
        data.put("author", config.getAuthor());
        data.put("packageName", config.getPackageName());
        data.put("moduleName", config.getModuleName());
        data.put("businessName", config.getBusinessName());
        data.put("functionDesc", config.getFunctionDesc());

        // 类名处理
        String className = config.getTableName();
        if (config.getTablePrefix() != null && className.startsWith(config.getTablePrefix())) {
            className = className.substring(config.getTablePrefix().length());
        }
        className = toPascalCase(className);

        if (config.getClassPrefix() != null) {
            className = config.getClassPrefix() + className;
        }
        if (config.getClassSuffix() != null) {
            className = className + config.getClassSuffix();
        }

        data.put("className", className);
        data.put("lowercaseClassName", toCamelCase(className));

        // 包路径
        String basePackage = config.getPackageName() + "." + config.getModuleName();
        data.put("entityPackage", basePackage + ".entity");
        data.put("mapperPackage", basePackage + ".mapper");
        data.put("servicePackage", basePackage + ".service");
        data.put("controllerPackage", basePackage + ".controller");
        data.put("voPackage", basePackage + ".vo");

        // 表信息
        data.put("tableName", config.getTableName());
        data.put("tableComment", config.getFunctionDesc());

        // 字段列表
        data.put("columns", config.getColumns());

        // 主键字段
        TableColumn pkColumn = config.getColumns().stream()
                .filter(TableColumn::getIsPk)
                .findFirst()
                .orElse(config.getColumns().get(0));
        data.put("pkColumn", pkColumn);
        data.put("pkJavaField", pkColumn.getJavaField());
        data.put("pkType", pkColumn.getJavaType());

        return data;
    }

    /**
     * 生成实体类
     */
    private String generateEntity(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        sb.append("package ").append(data.get("entityPackage")).append(";\n\n");

        sb.append("import com.baomidou.mybatisplus.annotation.*;\n");
        sb.append("import com.fasterxml.jackson.annotation.JsonFormat;\n");
        sb.append("import lombok.Data;\n");
        sb.append("import java.io.Serializable;\n");
        sb.append("import java.time.LocalDateTime;\n\n");

        sb.append("/**\n");
        sb.append(" * ").append(data.get("functionDesc")).append("\n");
        sb.append(" * @author ").append(data.get("author")).append("\n");
        sb.append(" */\n");
        sb.append("@Data\n");
        sb.append("@TableName(\"").append(data.get("tableName")).append("\")\n");
        sb.append("public class ").append(data.get("className")).append("Entity implements Serializable {\n\n");

        // 序列化版本
        sb.append("    private static final long serialVersionUID = 1L;\n\n");

        // 字段属性
        for (TableColumn column : config.getColumns()) {
            sb.append("    /**\n");
            sb.append("     * ").append(column.getColumnComment()).append("\n");
            sb.append("     */\n");

            // 主键和自增注解
            if (Boolean.TRUE.equals(column.getIsPk())) {
                if (Boolean.TRUE.equals(column.getIsIncrement())) {
                    sb.append("    @TableId(type = IdType.AUTO)\n");
                } else {
                    sb.append("    @TableId(type = IdType.ASSIGN_ID)\n");
                }
            }

            // 逻辑删除注解
            if ("deleted".equalsIgnoreCase(column.getColumnName())) {
                sb.append("    @TableLogic\n");
            }

            // 自动填充注解
            if ("create_time".equalsIgnoreCase(column.getColumnName())) {
                sb.append("    @TableField(fill = FieldFill.INSERT)\n");
                sb.append("    @JsonFormat(pattern = \"yyyy-MM-dd HH:mm:ss\")\n");
            } else if ("update_time".equalsIgnoreCase(column.getColumnName())) {
                sb.append("    @TableField(fill = FieldFill.INSERT_UPDATE)\n");
                sb.append("    @JsonFormat(pattern = \"yyyy-MM-dd HH:mm:ss\")\n");
            }

            sb.append("    private ");
            sb.append(getJavaType(column.getJavaType()));
            sb.append(" ");
            sb.append(column.getJavaField());
            sb.append(";\n\n");
        }

        sb.append("}\n");

        return sb.toString();
    }

    /**
     * 生成Mapper接口
     */
    private String generateMapper(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        String entityClass = data.get("className") + "Entity";
        String mapperClass = data.get("className") + "Mapper";

        sb.append("package ").append(data.get("mapperPackage")).append(";\n\n");

        sb.append("import com.baomidou.mybatisplus.core.mapper.BaseMapper;\n");
        sb.append("import com.example.common.core.mapper.BaseMapperPlus;\n");
        sb.append("import ").append(data.get("entityPackage")).append(".").append(entityClass).append(";\n\n");

        sb.append("/**\n");
        sb.append(" * ").append(data.get("functionDesc")).append("Mapper接口\n");
        sb.append(" * @author ").append(data.get("author")).append("\n");
        sb.append(" */\n");
        sb.append("public interface ").append(mapperClass).append(" extends BaseMapperPlus<").append(entityClass).append("> {\n\n");

        sb.append("}\n");

        return sb.toString();
    }

    /**
     * 生成Service接口和实现
     */
    private String generateService(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        String entityClass = data.get("className") + "Entity";
        String serviceClass = data.get("className") + "Service";
        String mapperClass = data.get("className") + "Mapper";

        sb.append("package ").append(data.get("servicePackage")).append(";\n\n");

        sb.append("import com.baomidou.mybatisplus.core.metadata.IPage;\n");
        sb.append("import com.baomidou.mybatisplus.extension.service.IService;\n");
        sb.append("import ").append(data.get("entityPackage")).append(".").append(entityClass).append(";\n");
        sb.append("import ").append(data.get("servicePackage")).append(".").append("dto.").append(data.get("className")).append("DTO;\n");
        sb.append("import ").append(data.get("servicePackage")).append(".").append("query.").append(data.get("className")).append("Query;\n\n");

        sb.append("/**\n");
        sb.append(" * ").append(data.get("functionDesc")).append("服务接口\n");
        sb.append(" * @author ").append(data.get("author")).append("\n");
        sb.append(" */\n");
        sb.append("public interface ").append(serviceClass).append(" extends IService<").append(entityClass).append("> {\n\n");

        // 分页查询方法
        sb.append("    /**\n");
        sb.append("     * 分页查询").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    IPage<").append(entityClass).append("> queryPage(").append(data.get("className")).append("Query query);\n\n");

        // 根据ID查询
        sb.append("\n    /**\n");
        sb.append("     * 根据ID查询").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    ").append(entityClass).append(" getById(Long id);\n\n");

        // 新增
        sb.append("\n    /**\n");
        sb.append("     * 新增").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    Boolean save(").append(data.get("className")).append("DTO dto);\n\n");

        // 修改
        sb.append("\n    /**\n");
        sb.append("     * 修改").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    Boolean update(").append(data.get("className")).append("DTO dto);\n\n");

        // 删除
        sb.append("\n    /**\n");
        sb.append("     * 删除").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    Boolean delete(Long id);\n\n");

        sb.append("}\n");

        return sb.toString();
    }

    /**
     * 生成Controller
     */
    private String generateController(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        String entityClass = data.get("className") + "Entity";
        String serviceClass = data.get("className") + "Service";
        String controllerClass = data.get("className") + "Controller";

        sb.append("package ").append(data.get("controllerPackage")).append(";\n\n");

        sb.append("import com.baomidou.mybatisplus.core.metadata.IPage;\n");
        sb.append("import com.example.common.core.vo.Result;\n");
        sb.append("import com.example.common.log.annotation.Log;\n");
        sb.append("import com.example.common.log.enums.BusinessType;\n");
        sb.append("import ").append(data.get("entityPackage")).append(".").append(entityClass).append(";\n");
        sb.append("import ").append(data.get("servicePackage")).append(".").append(serviceClass).append(";\n");
        sb.append("import ").append(data.get("servicePackage")).append(".").append("dto.").append(data.get("className")).append("DTO;\n");
        sb.append("import ").append(data.get("servicePackage")).append(".").append("query.").append(data.get("className")).append("Query;\n");
        sb.append("import lombok.RequiredArgsConstructor;\n");
        sb.append("import org.springframework.security.access.prepost.PreAuthorize;\n");
        sb.append("import org.springframework.web.bind.annotation.*;\n\n");

        sb.append("/**\n");
        sb.append(" * ").append(data.get("functionDesc")).append("控制器\n");
        sb.append(" * @author ").append(data.get("author")).append("\n");
        sb.append(" */\n");
        sb.append("@RestController\n");
        sb.append("@RequiredArgsConstructor\n");
        sb.append("@RequestMapping(\"/").append(toKebabCase((String)data.get("className"))).append("\")\n");
        sb.append("public class ").append(controllerClass).append(" {\n\n");

        sb.append("    private final ").append(serviceClass).append(" ").append(toCamelCase(serviceClass.replace("Service", ""))).append("Service;\n\n");

        // 分页查询
        sb.append("    /**\n");
        sb.append("     * 分页查询").append(data.get("businessName")).append("列表\n");
        sb.append("     */\n");
        sb.append("    @GetMapping(\"/page\")\n");
        sb.append("    @PreAuthorize(\"@ss.hasPermi('").append(config.getModuleName()).append(":").append(toKebabCase((String)data.get("className"))).append(":list')\")\n");
        sb.append("    public Result<IPage<").append(entityClass).append(">> queryPage(").append(data.get("className")).append("Query query) {\n");
        sb.append("        return Result.success(").append(toCamelCase(data.get("className"))).append("Service.queryPage(query));\n");
        sb.append("    }\n\n");

        // 根据ID查询
        sb.append("    /**\n");
        sb.append("     * 根据ID查询").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    @GetMapping(\"/{id}\")\n");
        sb.append("    @PreAuthorize(\"@ss.hasPermi('").append(config.getModuleName()).append(":").append(toKebabCase((String)data.get("className"))).append(":query')\")\n");
        sb.append("    public Result<").append(entityClass).append("> getById(@PathVariable Long id) {\n");
        sb.append("        return Result.success(").append(toCamelCase(data.get("className"))).append("Service.getById(id));\n");
        sb.append("    }\n\n");

        // 新增
        sb.append("    /**\n");
        sb.append("     * 新增").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    @PostMapping\n");
        sb.append("    @PreAuthorize(\"@ss.hasPermi('").append(config.getModuleName()).append(":").append(toKebabCase((String)data.get("className"))).append(":add')\")\n");
        sb.append("    @Log(title = \"").append(data.get("businessName")).append("\", businessType = BusinessType.INSERT)\n");
        sb.append("    public Result<Boolean> save(@RequestBody ").append(data.get("className")).append("DTO dto) {\n");
        sb.append("        return Result.success(").append(toCamelCase(data.get("className"))).append("Service.save(dto));\n");
        sb.append("    }\n\n");

        // 修改
        sb.append("    /**\n");
        sb.append("     * 修改").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    @PutMapping\n");
        sb.append("    @PreAuthorize(\"@ss.hasPermi('").append(config.getModuleName()).append(":").append(toKebabCase((String)data.get("className"))).append(":edit')\")\n");
        sb.append("    @Log(title = \"").append(data.get("businessName")).append("\", businessType = BusinessType.UPDATE)\n");
        sb.append("    public Result<Boolean> update(@RequestBody ").append(data.get("className")).append("DTO dto) {\n");
        sb.append("        return Result.success(").append(toCamelCase(data.get("className"))).append("Service.update(dto));\n");
        sb.append("    }\n\n");

        // 删除
        sb.append("    /**\n");
        sb.append("     * 删除").append(data.get("businessName")).append("\n");
        sb.append("     */\n");
        sb.append("    @DeleteMapping(\"/{id}\")\n");
        sb.append("    @PreAuthorize(\"@ss.hasPermi('").append(config.getModuleName()).append(":").append(toKebabCase((String)data.get("className"))).append(":remove')\")\n");
        sb.append("    @Log(title = \"").append(data.get("businessName")).append("\", businessType = BusinessType.DELETE)\n");
        sb.append("    public Result<Boolean> delete(@PathVariable Long id) {\n");
        sb.append("        return Result.success(").append(toCamelCase(data.get("className"))).append("Service.delete(id));\n");
        sb.append("    }\n\n");

        sb.append("}\n");

        return sb.toString();
    }

    /**
     * 生成Vue列表页
     */
    private String generateListVue(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        sb.append("<template>\n");
        sb.append("  <div class=\"app-container\">\n");

        // 搜索区域
        sb.append("    <!-- 搜索工作栏 -->\n");
        sb.append("    <el-form :model=\"queryParams\" ref=\"queryForm\" :inline=\"true\" v-show=\"showSearch\" label-width=\"68px\">\n");

        for (TableColumn column : config.getColumns()) {
            if (Boolean.TRUE.equals(column.getIsQuery())) {
                sb.append("      <el-form-item label=\"").append(column.getColumnComment()).append("\" prop=\"")
                        .append(column.getJavaField()).append("\">\n");

                switch (column.getDisplayType()) {
                    case "select":
                    case "radio":
                        sb.append("        <el-select v-model=\"queryParams.").append(column.getJavaField())
                                .append("\" placeholder=\"请选择\" clearable>\n");
                        sb.append("        </el-select>\n");
                        break;
                    case "date":
                    case "datetime":
                        sb.append("        <el-date-picker v-model=\"queryParams.").append(column.getJavaField())
                                .append("\" type=\"datetime\" placeholder=\"选择日期\" value-format=\"YYYY-MM-DD HH:mm:ss\">\n");
                        sb.append("        </el-date-picker>\n");
                        break;
                    default:
                        sb.append("        <el-input v-model=\"queryParams.").append(column.getJavaField())
                                .append("\" placeholder=\"请输入\" clearable></el-input>\n");
                }

                sb.append("      </el-form-item>\n");
            }
        }

        sb.append("      <el-form-item>\n");
        sb.append("        <el-button type=\"primary\" @click=\"handleQuery\">搜索</el-button>\n");
        sb.append("        <el-button @click=\"resetQuery\">重置</el-button>\n");
        sb.append("      </el-form-item>\n");
        sb.append("    </el-form>\n");

        // 操作按钮区域
        sb.append("\n    <!-- 操作按钮区域 -->\n");
        sb.append("    <el-row :gutter=\"10\" class=\"mb8\">\n");
        sb.append("      <el-col :span=\"1.5\">\n");
        sb.append("        <el-button type=\"primary\" plain @click=\"handleAdd\">新增</el-button>\n");
        sb.append("      </el-col>\n");
        sb.append("      <el-col :span=\"1.5\">\n");
        sb.append("        <el-button type=\"success\" plain @click=\"handleExport\">导出</el-button>\n");
        sb.append("      </el-col>\n");
        sb.append("      <right-toolbar @queryTable=\"getList\"></right-toolbar>\n");
        sb.append("    </el-row>\n");

        // 表格区域
        sb.append("\n    <!-- 表格区域 -->\n");
        sb.append("    <el-table v-loading=\"loading\" :data=\"dataList\">\n");

        for (TableColumn column : config.getColumns()) {
            if (Boolean.TRUE.equals(column.getIsList())) {
                sb.append("      <el-table-column label=\"").append(column.getColumnComment())
                        .append("\" align=\"center\" prop=\"").append(column.getJavaField()).append("\"");
                if ("java.util.LocalDateTime".equals(column.getJavaType()) ||
                        "java.util.Date".equals(column.getJavaType())) {
                    sb.append(" width=\"180\"");
                }
                sb.append(" />\n");
            }
        }

        sb.append("      <el-table-column label=\"操作\" align=\"center\" class-name=\"small-padding fixed-width\">\n");
        sb.append("        <template #default=\"scope\">\n");
        sb.append("          <el-button link type=\"primary\" @click=\"handleUpdate(scope.row)\">修改</el-button>\n");
        sb.append("          <el-button link type=\"danger\" @click=\"handleDelete(scope.row)\">删除</el-button>\n");
        sb.append("        </template>\n");
        sb.append("      </el-table-column>\n");
        sb.append("    </el-table>\n");

        // 分页组件
        sb.append("\n    <pagination\n");
        sb.append("      v-show=\"total > 0\"\n");
        sb.append("      :total=\"total\"\n");
        sb.append("      v-model:page=\"queryParams.pageNum\"\n");
        sb.append("      v-model:limit=\"queryParams.pageSize\"\n");
        sb.append("      @pagination=\"getList\"\n");
        sb.append("    />\n");

        // 表单弹窗
        sb.append("\n    <!-- 表单弹窗 -->\n");
        sb.append("    <update-form ref=\"updateFormRef\" @refresh=\"getList\" />\n");

        sb.append("  </div>\n");
        sb.append("</template>\n\n");

        // script部分
        sb.append("<script setup name=\"").append(data.get("className")).append("\">\n");
        sb.append("import { ref, reactive } from 'vue'\n");
        sb.append("import updateForm from './form.vue'\n\n");

        sb.append("const loading = ref(true)\n");
        sb.append("const showSearch = ref(true)\n");
        sb.append("const dataList = ref([])\n");
        sb.append("const total = ref(0)\n");
        sb.append("const updateFormRef = ref()\n\n");

        sb.append("const queryParams = reactive({\n");
        sb.append("  pageNum: 1,\n");
        sb.append("  pageSize: 10,\n");

        for (TableColumn column : config.getColumns()) {
            if (Boolean.TRUE.equals(column.getIsQuery())) {
                sb.append("  ").append(column.getJavaField()).append(": null,\n");
            }
        }

        sb.append("})\n\n");

        sb.append("// 查询列表\n");
        sb.append("function getList() {\n");
        sb.append("  loading.value = true\n");
        sb.append("  // TODO: 调用API获取列表\n");
        sb.append("  loading.value = false\n");
        sb.append("}\n\n");

        sb.append("// 搜索\n");
        sb.append("function handleQuery() {\n");
        sb.append("  queryParams.pageNum = 1\n");
        sb.append("  getList()\n");
        sb.append("}\n\n");

        sb.append("// 重置\n");
        sb.append("function resetQuery() {\n");
        sb.append("  queryParams.pageNum = 1\n");
        sb.append("  getList()\n");
        sb.append("}\n\n");

        sb.append("// 新增\n");
        sb.append("function handleAdd() {\n");
        sb.append("  updateFormRef.value.init()\n");
        sb.append("}\n\n");

        sb.append("// 修改\n");
        sb.append("function handleUpdate(row) {\n");
        sb.append("  updateFormRef.value.init(row.id)\n");
        sb.append("}\n\n");

        sb.append("// 删除\n");
        sb.append("function handleDelete(row) {\n");
        sb.append("  // TODO: 调用API删除\n");
        sb.append("}\n\n");

        sb.append("// 导出\n");
        sb.append("function handleExport() {\n");
        sb.append("  // TODO: 调用API导出\n");
        sb.append("}\n\n");

        sb.append("getList()\n");
        sb.append("</script>\n");

        return sb.toString();
    }

    /**
     * 生成SQL
     */
    private String generateSql(CodeGenConfig config, Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        sb.append("-- ----------------------------\n");
        sb.append("-- 表结构：").append(data.get("functionDesc")).append("\n");
        sb.append("-- ----------------------------\n");
        sb.append("DROP TABLE IF EXISTS `").append(data.get("tableName")).append("`;\n");
        sb.append("CREATE TABLE `").append(data.get("tableName")).append("` (\n");

        boolean first = true;
        for (TableColumn column : config.getColumns()) {
            if (!first) {
                sb.append(",\n");
            }
            first = false;

            sb.append("  `").append(column.getColumnName()).append("` ");
            sb.append(column.getColumnType()).append(" ");

            if (Boolean.TRUE.equals(column.getIsPk())) {
                sb.append("NOT NULL ");
            } else if (Boolean.TRUE.equals(column.getIsRequired())) {
                sb.append("NOT NULL ");
            } else {
                sb.append("DEFAULT NULL ");
            }

            if (Boolean.TRUE.equals(column.getIsIncrement())) {
                sb.append("AUTO_INCREMENT ");
            }

            sb.append("COMMENT '").append(column.getColumnComment()).append("'");
        }

        if (config.getColumns().stream().anyMatch(TableColumn::getIsPk)) {
            sb.append(",\n  PRIMARY KEY (");
            sb.append(config.getColumns().stream()
                    .filter(TableColumn::getIsPk)
                    .map(c -> "`" + c.getColumnName() + "`")
                    .collect(Collectors.joining(",")));
            sb.append(")");
        }

        sb.append("\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='").append(data.get("functionDesc")).append("';\n");

        return sb.toString();
    }

    // ========== 工具方法 ==========

    /**
     * 下划线转帕斯卡命名
     */
    private String toPascalCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        StringBuilder sb = new StringBuilder();
        for (String part : str.split("_")) {
            if (part.length() > 0) {
                sb.append(Character.toUpperCase(part.charAt(0)));
                sb.append(part.substring(1).toLowerCase());
            }
        }
        return sb.toString();
    }

    /**
     * 下划线转驼峰命名
     */
    private String toCamelCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        String first = str.substring(0, 1).toLowerCase();
        if (str.length() > 1) {
            first += toPascalCase(str.substring(1));
        }
        return first;
    }

    /**
     * 驼峰转短横线命名
     */
    private String toKebabCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.replaceAll("([a-z])([A-Z])", "$1-$2").toLowerCase();
    }

    /**
     * 获取Java类型
     */
    private String getJavaType(String javaType) {
        if (javaType == null) {
            return "String";
        }
        switch (javaType) {
            case "Long":
                return "Long";
            case "Integer":
                return "Integer";
            case "Double":
                return "Double";
            case "BigDecimal":
                return "java.math.BigDecimal";
            case "LocalDateTime":
                return "LocalDateTime";
            case "Date":
                return "Date";
            case "Boolean":
                return "Boolean";
            default:
                return "String";
        }
    }
}
```

---

## 第七章：面试高频问题

### 7.1 低代码平台的核心技术难点

1. **可视化设计器**：拖拽布局、属性配置、事件绑定
2. **动态渲染引擎**：运行时解析JSON配置，动态渲染组件
3. **代码生成策略**：模板引擎选择、代码质量保证
4. **动态表单校验**：客户端和服务端双重校验
5. **权限模型设计**：细粒度权限控制

### 7.2 如何保证生成代码的质量

1. **统一的代码规范**：使用模板强制约束
2. **设计模式应用**：策略模式处理不同组件、装饰器模式处理校验
3. **单元测试覆盖**：生成的代码需要有基本的测试
4. **代码审查机制**：重要模块需要人工Review

### 7.3 中台服务的划分原则

1. **单一职责**：一个服务只负责一个领域
2. **高内聚低耦合**：服务内部高度内聚，服务间通过API通信
3. **边界清晰**：避免循环依赖
4. **可独立部署**：服务可以独立演进和部署

---

## 结语

好了，今天的中台与低代码平台实战就讲到这里。

中台战略和低代码平台都是当前企业IT建设的热门方向。中台强调能力的复用和共享，低代码强调开发的效率提升。两者结合，可以大大加快企业数字化转型的速度。

希望大家在学习的过程中，多思考这些设计背后的原理，而不仅仅是照搬代码。只有理解了为什么这样设计，才能真正掌握这些技术。

如果有任何问题，欢迎在评论区留言交流。
