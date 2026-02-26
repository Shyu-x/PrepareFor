# HTML/CSS 面试问题汇总 (精益版)

---

## 一、布局核心：水平垂直居中

### 1.1 实现 CSS 水平垂直居中的 5 种方案

**参考答案：**

1.  **Flexbox (最常用)**
    ```css
    .parent {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    ```
2.  **Grid (最简洁)**
    ```css
    .parent {
      display: grid;
      place-items: center;
    }
    ```
3.  **Absolute + Transform (无需已知宽高)**
    ```css
    .child {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    ```
4.  **Absolute + Margin Auto (需已知宽高)**
    ```css
    .child {
      position: absolute;
      top: 0; bottom: 0; left: 0; right: 0;
      margin: auto;
      width: 100px; height: 100px;
    }
    ```
5.  **Table-cell**
    ```css
    .parent {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
    }
    .child { display: inline-block; }
    ```

---

## 二、BFC 与 盒模型 (大厂必考)
... (此处省略其他已加固内容)
