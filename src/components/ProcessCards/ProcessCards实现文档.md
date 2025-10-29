# ProcessCards 组件实现文档

## 目录

1. [概述](#概述)
2. [技术栈与依赖](#技术栈与依赖)
3. [HTML结构分析](#html结构分析)
4. [CSS样式系统](#css样式系统)
5. [JavaScript动画控制](#javascript动画控制)
6. [动画数学原理](#动画数学原理)
7. [关键技术点](#关键技术点)
8. [使用指南](#使用指南)
9. [扩展建议](#扩展建议)

---

## 概述

ProcessCards 是一个基于滚动驱动的卡片动画组件，通过 GSAP 和 ScrollTrigger 实现复杂的视差效果和3D翻转动画。该组件展示了一个完整的服务流程（Plan → Design → Develop），通过精心编排的滚动动画创造沉浸式的用户体验。

### 核心功能

- **Hero区域卡片动画**：三张卡片在滚动时向不同方向飞出，带有缩放、旋转和淡出效果
- **Services区域卡片动画**：卡片从屏幕外飞入、聚集、最终翻转展示详细信息
- **平滑滚动体验**：集成 Lenis 库实现丝滑的滚动效果
- **固定定位动画**：Services区域在滚动时保持固定，创造视差效果

### 视觉效果特点

- 使用柔和的配色方案（淡紫、粉红、浅黄）
- 卡片具有3D透视和翻转效果
- 浮动动画增强视觉层次感
- 响应式布局适配不同屏幕尺寸

---

## 技术栈与依赖

### 核心库

| 库名称 | 版本 | 用途 |
|--------|------|------|
| **GSAP** | 3.13.0 | 动画引擎，提供高性能的属性动画 |
| **ScrollTrigger** | 3.13.0 | GSAP插件，实现滚动驱动的动画 |
| **Lenis** | 1.3.13 | 平滑滚动库，提升滚动体验 |

### 字体资源

- **DM Sans**：主要文本字体（支持多种字重）
- **DM Mono**：等宽字体，用于标签和编号

### 浏览器兼容性

- 需要支持 CSS3 3D transforms
- 需要支持 ES6 模块语法
- 推荐使用现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

---

## HTML结构分析

### 整体布局

```html
<body>
  <nav>                    <!-- 固定导航栏 -->
  <section class="hero">   <!-- Hero区域：初始卡片展示 -->
  <section class="about">  <!-- 过渡区域 -->
  <section class="services"> <!-- Services区域：固定容器 -->
  <section class="cards">  <!-- 卡片动画容器 -->
  <section class="outro">  <!-- 结束区域 -->
</body>
```

### Hero区域结构

```html
<section class="hero">
  <div class="hero-cards">
    <div class="card" id="hero-card-1">
      <div class="card-title">
        <span>Plan</span>
        <span>01</span>
      </div>
      <div class="card-title">
        <span>01</span>
        <span>Plan</span>
      </div>
    </div>
    <!-- hero-card-2 和 hero-card-3 结构相同 -->
  </div>
</section>
```

**设计要点**：
- 每张卡片有上下两个 `card-title`，用于对称布局
- 使用独立的 ID 便于 JavaScript 精确控制
- 卡片内容简洁，仅展示标题和编号

### Services卡片结构

```html
<section class="cards">
  <div class="cards-container">
    <div class="card" id="card-1">
      <div class="card-wrapper">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="card-title">...</div>
          </div>
          <div class="flip-card-back">
            <div class="card-title">...</div>
            <div class="card-copy">
              <p>Discovery</p>
              <p>Audit</p>
              <p>User Flow</p>
              <p>Site Map</p>
              <p>Personas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**设计要点**：
- 三层嵌套：`card` → `card-wrapper` → `flip-card-inner`
- `card-wrapper` 负责浮动动画
- `flip-card-inner` 负责3D翻转
- 正反面使用 `backface-visibility: hidden` 实现翻转效果

---

## CSS样式系统

### 设计令牌（CSS变量）

```css
:root {
  --dark: #000;
  --light: #f9f4eb;
  --light2: #f0ece5;
  --accent-1: #e5d9f6;  /* 紫色（Plan） */
  --accent-2: #ffd2f3;  /* 粉色（Design） */
  --accent-3: #fcdca6;  /* 黄色（Develop） */
}
```

### 布局系统

#### Section布局

```css
section {
  position: relative;
  width: 100vw;
  height: 100svh;  /* 使用svh单位适配移动端 */
  padding: 2rem;
  overflow: hidden;
}
```

#### Hero卡片布局

```css
.hero-cards {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35%;
  display: flex;
  gap: 1rem;
}

.hero-cards .card {
  flex: 1;
  aspect-ratio: 5/7;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

#### Services卡片布局

```css
.cards {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  z-index: -1;
}

.cards-container {
  width: 75%;
  display: flex;
  gap: 3rem;
  perspective: 1000px;
}
```

### 3D翻转效果

```css
.flip-card-inner {
  transform-style: preserve-3d;
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

### 浮动动画

```css
@keyframes floating {
  0%   { transform: translate(-50%, -50%); }
  50%  { transform: translate(-50%, -55%); }
  100% { transform: translate(-50%, -50%); }
}

.card-wrapper {
  animation: floating 1s infinite ease-in-out;
}

#card-1 .card-wrapper { animation-delay: 0; }
#card-2 .card-wrapper { animation-delay: 0.25s; }
#card-3 .card-wrapper { animation-delay: 0.5s; }
```

---

## JavaScript动画控制

### 初始化流程

```javascript
document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);
  
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
});
```

### Hero卡片动画

#### ScrollTrigger配置

```javascript
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "bottom top",
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress;
    // 动画逻辑
  }
});
```

#### 动画实现

```javascript
// 容器淡出
const opacity = gsap.utils.interpolate(1, 0.5, smoothStep(progress));
gsap.set(".hero-cards", { opacity });

// 单卡片动画
["#hero-card-1", "#hero-card-2", "#hero-card-3"].forEach((cardId, index) => {
  const delay = index * 0.9;
  const cardProgress = gsap.utils.clamp(
    0, 1,
    (progress - delay * 0.1) / (1 - delay * 0.1)
  );
  
  const y = gsap.utils.interpolate('0%', "350%", smoothStep(cardProgress));
  const scale = gsap.utils.interpolate(1, 0.75, smoothStep(cardProgress));
  const opacity = cardProgress > 0.7 
    ? gsap.utils.interpolate(1, 0, (cardProgress - 0.7) / 0.3)
    : 1;
  
  let x = '0%', rotation = 0;
  if (index === 0) {
    x = gsap.utils.interpolate('0%', "90%", smoothStep(cardProgress));
    rotation = gsap.utils.interpolate(0, -15, smoothStep(cardProgress));
  } else if (index === 2) {
    x = gsap.utils.interpolate('0%', "-90%", smoothStep(cardProgress));
    rotation = gsap.utils.interpolate(0, 15, smoothStep(cardProgress));
  }
  
  gsap.set(cardId, { y, x, rotation, scale, opacity });
});
```

### Services区域固定

```javascript
ScrollTrigger.create({
  trigger: ".services",
  start: "top top",
  end: `+=${window.innerHeight * 4}px`,
  pin: ".services",
  pinSpacing: true,
});
```

### Services卡片动画

#### 标题入场

```javascript
const headerProgress = gsap.utils.clamp(0, 1, progress / 0.9);
const headerY = gsap.utils.interpolate("400%", "0%", smoothStep(headerProgress));
gsap.set(".services-header", { y: headerY });
```

#### 卡片动画序列

```javascript
["#card-1", "#card-2", "#card-3"].forEach((cardId, index) => {
  const delay = index * 0.5;
  const cardProgress = gsap.utils.clamp(
    0, 1,
    (progress - delay * 0.1) / (0.9 - delay * 0.1)
  );
  
  // Y轴位移（分两阶段）
  let y;
  if (cardProgress < 0.4) {
    y = gsap.utils.interpolate("-100%", "50%", smoothStep(cardProgress / 0.4));
  } else if (cardProgress < 0.6) {
    y = gsap.utils.interpolate("50%", "0%", smoothStep((cardProgress - 0.4) / 0.2));
  } else {
    y = "0%";
  }
  
  // 缩放（分两阶段）
  let scale;
  if (cardProgress < 0.4) {
    scale = gsap.utils.interpolate(0.25, 0.75, smoothStep(cardProgress / 0.4));
  } else if (cardProgress < 0.6) {
    scale = gsap.utils.interpolate(0.75, 1, smoothStep((cardProgress - 0.4) / 0.2));
  } else {
    scale = 1;
  }
  
  // 透明度
  let opacity = cardProgress < 0.2
    ? gsap.utils.interpolate(0.25, 0.75, smoothStep(cardProgress / 0.2))
    : 1;
  
  // 聚合与翻转
  let x, rotate, rotationY;
  if (cardProgress < 0.6) {
    x = index === 0 ? "100%" : index === 1 ? '0%' : "-100%";
    rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
    rotationY = 0;
  } else if (cardProgress < 1) {
    const np = (cardProgress - 0.6) / 0.4;
    x = gsap.utils.interpolate(
      index === 0 ? "100%" : index === 1 ? '0%' : "-100%",
      '0%',
      smoothStep(np)
    );
    rotate = gsap.utils.interpolate(
      index === 0 ? -5 : index === 1 ? 0 : 5,
      0,
      smoothStep(np)
    );
    rotationY = smoothStep(np) * 180;
  } else {
    x = "0%";
    rotate = 0;
    rotationY = 180;
  }
  
  gsap.set(cardId, { opacity, y, x, rotate, scale });
  const innerCard = document.querySelector(`${cardId} .flip-card-inner`);
  gsap.set(innerCard, { rotationY });
});
```

---

## 动画数学原理

### smoothStep缓动函数

```javascript
const smoothStep = (p) => p * p * (3 - 2 * p);
```

**特性**：
- 输入/输出范围：[0, 1]
- 起点和终点导数为0（平滑过渡）
- 中间加速度最大

**曲线对比**：
- 线性：`y = x`
- smoothStep：`y = x²(3 - 2x)`

### 插值计算

```javascript
gsap.utils.interpolate(start, end, progress)
// 等价于：start + (end - start) * progress
```

### 进度归一化

```javascript
const cardProgress = gsap.utils.clamp(
  0, 1,
  (progress - delay * 0.1) / (1 - delay * 0.1)
);
```

**目的**：将全局进度映射到单个卡片的局部进度[0, 1]

---

## 关键技术点

### 1. ScrollTrigger的scrub参数

```javascript
scrub: 1  // 平滑跟随滚动，延迟1秒
```

- `scrub: true`：直接跟随
- `scrub: 数值`：延迟跟随，更平滑

### 2. Pin固定效果

```javascript
pin: ".services",
pinSpacing: true
```

- `pin`：固定元素
- `pinSpacing: true`：保留占位空间

### 3. 3D透视与翻转

**CSS**：
```css
perspective: 1000px;
transform-style: preserve-3d;
backface-visibility: hidden;
```

**JS**：
```javascript
rotationY = smoothStep(progress) * 180;
```

### 4. 性能优化

- 使用 `will-change: transform`
- 使用 `gsap.set` 而非 `gsap.to`
- `lagSmoothing(0)` 防止跳跃

### 5. 响应式设计

```css
height: 100svh;  /* 小视口高度 */
```

```javascript
end: `+=${window.innerHeight * 4}px`
```

### 6. Z-index层级

**Hero卡片**：
- card-1: z-index: 2
- card-2: z-index: 1
- card-3: z-index: 0

**Services**：
- .cards: z-index: -1

---

## 使用指南

### 安装依赖

```bash
npm install gsap lenis
```

### 基本集成

1. 引入样式和脚本
2. 构建HTML结构
3. 确保DOM加载完成后初始化

### 自定义配置

#### 修改卡片数量

1. 复制HTML结构
2. 添加CSS样式
3. 修改JS数组

#### 调整动画速度

```javascript
// Hero卡片延迟
const delay = index * 0.9;  // 修改此值

// Services卡片延迟
const delay = index * 0.5;  // 修改此值

// 固定时长
end: `+=${window.innerHeight * 4}px`  // 修改倍数
```

#### 修改颜色主题

```css
:root {
  --accent-1: #your-color-1;
  --accent-2: #your-color-2;
  --accent-3: #your-color-3;
}
```

### 常见问题

#### 1. 卡片不显示

检查：
- CSS是否正确加载
- 初始opacity是否为0
- JS是否正确执行

#### 2. 动画卡顿

优化：
- 减少scrub延迟值
- 检查其他JS冲突
- 使用硬件加速

#### 3. 移动端适配

- 使用svh单位
- 调整卡片宽度百分比
- 测试触摸滚动

---

## 扩展建议

### 功能扩展

1. **添加交互控制**
   - 点击卡片暂停滚动
   - 添加导航按钮
   - 键盘控制

2. **增强视觉效果**
   - 粒子背景
   - 光晕效果
   - 模糊过渡

3. **数据驱动**
   - 从配置文件读取卡片内容
   - 动态生成卡片
   - 支持多语言

### 性能优化

1. **懒加载**
   - 延迟初始化非关键动画
   - 按需加载资源

2. **降级方案**
   - 检测设备性能
   - 低端设备简化动画

3. **代码分割**
   - 拆分动画逻辑
   - 按需加载模块

### 可访问性

1. **键盘导航**
   - 支持Tab键
   - 支持方向键

2. **屏幕阅读器**
   - 添加ARIA标签
   - 提供文本替代

3. **减少动画**
   - 检测prefers-reduced-motion
   - 提供静态版本

---

## 代码问题修复

### 发现的Bug

**script.js 第82行**：
```javascript
width: "10@vw",  // 错误
```

应修改为：
```javascript
width: "100vw",  // 正确
```

---

## 总结

ProcessCards组件展示了现代Web动画的最佳实践：

- **技术栈选择**：GSAP + ScrollTrigger + Lenis 的组合提供了强大且流畅的动画能力
- **动画编排**：通过精心设计的时序和缓动函数创造自然的视觉流程
- **性能考虑**：使用硬件加速、避免重排重绘、合理使用will-change
- **代码组织**：清晰的结构分层，便于维护和扩展

该组件适用于产品展示、服务介绍、品牌故事等需要强视觉冲击力的场景。
