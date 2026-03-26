# TypeScript + GSAP 3 + Pixi.js 8 炸弹组合演示

## 简介

本 Demo 演示如何使用 Pixi.js 8 创建游戏网格，并使用 GSAP 3 实现两个炸弹交换后的组合爆炸效果。

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后在浏览器中打开 http://localhost:5173

## 概念讲解

### Pixi.js 8 基础

Pixi.js 8 是一个高性能的 2D 渲染引擎，使用新的 API：

```typescript
import { Application, Graphics, Container } from 'pixi.js';

// 创建应用
const app = new Application();
await app.init({
  width: 400,
  height: 400,
  backgroundColor: 0x1a1a2e,
});

// 添加到 DOM
document.getElementById('app')!.appendChild(app.canvas);

// 创建图形
const graphics = new Graphics();
graphics.circle(0, 0, 30);
graphics.fill({ color: 0x4a4a6a });

// 创建容器
const container = new Container();
container.addChild(graphics);
app.stage.addChild(container);
```

### GSAP 3 动画

GSAP 3 提供了简洁的动画 API：

```typescript
import gsap from 'gsap';

// 基础动画
gsap.to(target, {
  x: 100,
  duration: 0.5,
  ease: 'power2.out'
});

// 时间线
const timeline = gsap.timeline();
timeline
  .to(obj1, { x: 100, duration: 0.5 })
  .to(obj2, { y: 200, duration: 0.3 }, '<')  // '<' 表示与上一个动画同时开始
  .to(obj3, { rotation: Math.PI, duration: 0.5 });
```

### 炸弹交换与组合爆炸

核心逻辑：当两个相邻的炸弹被交换时，触发组合爆炸效果，爆炸范围扩大。

```typescript
// 检测是否相邻
const rowDiff = Math.abs(bomb1.row - bomb2.row);
const colDiff = Math.abs(bomb1.col - bomb2.col);
const isAdjacent = (rowDiff === 1 && colDiff === 0) ||
                   (rowDiff === 0 && colDiff === 1);

// 交换动画
gsap.timeline({
  onComplete: () => triggerComboExplosion(bomb1, bomb2)
})
.to(bomb1.container, { x: pos2.x, duration: 0.4 })
.to(bomb2.container, { x: pos1.x, duration: 0.4 }, '<');
```

### 组合爆炸效果

组合爆炸使用多层圆环和缩放动画实现视觉冲击：

```typescript
function createExplosion(x: number, y: number): Container {
  const container = new Container();

  const graphics = new Graphics();
  graphics.circle(0, 0, 20);
  graphics.fill({ color: 0xffaa00 });
  graphics.circle(0, 0, 35);
  graphics.stroke({ color: 0xff6600, width: 4 });
  graphics.circle(0, 0, 50);
  graphics.stroke({ color: 0xff3300, width: 2 });

  container.addChild(graphics);
  container.scale.set(0.1);

  return container;
}

// 爆炸动画 - 快速放大并淡出
gsap.to(explosion, {
  scaleX: 3,
  scaleY: 3,
  alpha: 0,
  duration: 0.6,
  ease: 'power2.out'
});
```

## 完整示例

完整代码见 `src/main.ts`

## 完整讲解

这是一个展示 Pixi.js 8 和 GSAP 3 配合使用的经典游戏效果演示。

### 工作流程

1. **初始化**：创建 5x5 的炸弹网格，每个炸弹是一个包含圆形和装饰的容器

2. **选择交换**：
   - 点击第一个炸弹会高亮放大
   - 点击相邻的第二个炸弹触发交换
   - 点击非相邻炸弹则重新选择

3. **交换动画**：使用 GSAP timeline 让两个炸弹平滑交换位置

4. **组合爆炸**：
   - 交换完成后，两个炸弹位置同时产生爆炸效果
   - 爆炸由三层同心圆组成（黄色内核、橙色内环、红色外环）
   - 使用 `scaleX/scaleY` 从 0.1 放大到 3
   - 使用 `alpha` 从 1 淡出到 0
   - Combo 计数器累加

5. **重置**：爆炸淡出后，炸弹重新随机生成到新位置，带有弹跳入场效果

### 关键技术点

- **Pixi.js 8 新 API**：`Graphics.fill()` 和 `Graphics.stroke()` 使用对象参数
- **GSAP timeline**：用 `onComplete` 链式调用，用 `<` 符号实现并行动画
- **坐标计算**：根据网格索引计算像素位置

## 注意事项

- 本 Demo 使用 Pixi.js 8 最新 API，与 v7 不兼容
- GSAP 3 的 `gsap.timeline()` 支持链式调用，非常适合复杂动画编排
