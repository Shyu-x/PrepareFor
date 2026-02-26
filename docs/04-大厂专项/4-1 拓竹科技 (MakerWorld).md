# 拓竹科技 (MakerWorld) 笔试代码实战

---

## 一、三维路径解析逻辑 (Mock)
**场景**：解析一段简单的 G-code 路径字符串并转换为 Three.js 的顶点数据。

```javascript
/**
 * 模拟 G-code 解析器
 * 输入: "G1 X10 Y20 E0.5\nG1 X20 Y30 E1.0"
 * 输出: [{x: 10, y: 20, z: 0}, {x: 20, y: 30, z: 0}]
 */
function parseGCode(input) {
  const lines = input.split('\n');
  const points = [];
  lines.forEach(line => {
    if (line.startsWith('G1')) {
      const xMatch = line.match(/X([\d\.]+)/);
      const yMatch = line.match(/Y([\d\.]+)/);
      if (xMatch && yMatch) {
        points.push({
          x: parseFloat(xMatch[1]),
          y: parseFloat(yMatch[1]),
          z: 0 // 假设单层预览
        });
      }
    }
  });
  return points;
}
```

---

## 二、响应式布局计算
**题目**：实现一个高度自适应的 3D 画布容器，当窗口缩放时，自动调整 Three.js 的相机 Aspect Ratio。

```javascript
// React Hook 实现
function useThreeResize(camera, renderer) {
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, renderer]);
}
```
