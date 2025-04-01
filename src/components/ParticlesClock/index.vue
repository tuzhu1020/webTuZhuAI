<template>
  <div class="particles-clock-container">
    <canvas ref="clockCanvas" :width="size * 2.5" :height="size*2" :style="{ width: size * 1.3 + 'px', height: size + 'px' }"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

// 组件属性定义
const props = defineProps({
  size: {
    type: Number,
    default: 400,
  },
  particleColor: {
    type: String,
    default: "#3B82F6",
  },
  particleRadius: {
    type: Number,
    default: 1.2,
  },
  showSeconds: {
    type: Boolean,
    default: true,
  },
  particleCount: {
    type: Number,
    default: 4000,
  },
  transitionSpeed: {
    type: Number,
    default: 0.08,
  },
  idleMovement: {
    type: Boolean,
    default: true,
  },
  explosionEffect: {
    type: Boolean,
    default: true,
  },
  dotSize: {
    type: Number,
    default: 4,
  },
  dotDensity: {
    type: Number,
    default: 4,
  },
});

// 组件状态定义
const clockCanvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let particles: Particle[] = [];
const text = ref<string>("");
let ctx: CanvasRenderingContext2D | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let changeTimestamp: number = 0;
const devicePixelRatio = window.devicePixelRatio || 1;

/**
 * 粒子类定义
 */
interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  speed: number;
  baseX: number;
  baseY: number;
  explosionSpeed?: number;
  explosion?: boolean;
  stable?: boolean;
}

/**
 * 获取指定范围内的随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机数
 */
function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 粒子类实现
 */
class Particle {
  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;
  dx: number = 0;
  dy: number = 0;
  radius: number = props.particleRadius;
  color: string = props.particleColor;
  speed: number = props.transitionSpeed;
  baseX: number = 0;
  baseY: number = 0;
  explosionSpeed?: number;
  explosion?: boolean;
  stable?: boolean;

  constructor() {
    if (!clockCanvas.value) return;

    const size = props.size;
    const r = Math.min(clockCanvas.value.width, clockCanvas.value.height) / 2;
    const rad = (getRandom(0, 360) * Math.PI) / 180;
    const cx = clockCanvas.value.width / 2;
    const cy = clockCanvas.value.height / 2;

    this.x = cx + r * Math.cos(rad);
    this.y = cy + r * Math.sin(rad);
    this.targetX = this.x;
    this.targetY = this.y;
    this.baseX = this.x;
    this.baseY = this.y;
  }

  /**
   * 绘制粒子
   */
  draw(): void {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  /**
   * 更新粒子位置
   */
  update(): void {
    // 计算到目标位置的距离
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    // 更新位置
    this.x += dx * this.speed;
    this.y += dy * this.speed;

    // 如果距离很小，直接到达目标位置
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  /**
   * 移动到指定位置
   * @param x 目标x坐标
   * @param y 目标y坐标
   */
  moveTo(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }
}

/**
 * 清除画布
 */
function clearCanvas(): void {
  if (ctx && clockCanvas.value) {
    ctx.clearRect(0, 0, clockCanvas.value.width, clockCanvas.value.height);
  }
}

/**
 * 获取当前时间字符串
 * @returns 格式化的时间字符串
 */
function getText(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 绘制所有粒子
 */
function drawParticles(): void {
  clearCanvas();
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });
  animationFrameId = requestAnimationFrame(drawParticles);
}

/**
 * 获取画布上的像素点信息
 * @returns 像素点坐标数组
 */
function getPoints(): [number, number][] {
  if (!ctx || !clockCanvas.value) return [];

  const points: [number, number][] = [];
  const { data } = ctx.getImageData(
    0,
    0,
    clockCanvas.value.width,
    clockCanvas.value.height
  );

  // 减小采样间距，提高精度
  const gridSize = 2;
  const width = clockCanvas.value.width;
  const height = clockCanvas.value.height;

  // 只在实际文字区域内采样
  const margin = width * 0.1; // 添加边距
  for (let i = margin; i < width - margin; i += gridSize) {
    for (let j = 0; j < height; j += gridSize) {
      let hasBlackPixel = false;
      for (let dx = 0; dx < gridSize && !hasBlackPixel; dx++) {
        for (let dy = 0; dy < gridSize && !hasBlackPixel; dy++) {
          const x = i + dx;
          const y = j + dy;
          if (x < width && y < height) {
            const index = (x + y * width) * 4;
            // 检查像素是否为黑色（文字）
            if (
              data[index] === 0 &&
              data[index + 1] === 0 &&
              data[index + 2] === 0 &&
              data[index + 3] > 250
            ) {
              hasBlackPixel = true;
            }
          }
        }
      }

      if (hasBlackPixel) {
        // 添加更小的随机偏移
        const offsetX = getRandom(-0.5, 0.5);
        const offsetY = getRandom(-0.5, 0.5);
        points.push([i + offsetX, j + offsetY]);
      }
    }
  }
  return points;
}

/**
 * 更新粒子位置
 */
function updateParticles(): void {
  if (!ctx || !clockCanvas.value) return;

  const curText = getText();
  if (curText === text.value) {
    return;
  }

  clearCanvas();
  text.value = curText;
  changeTimestamp = Date.now();

  const width = clockCanvas.value.width;
  const height = clockCanvas.value.height;

  // 调整字体大小为画布高度的合适比例
  const fontSize = Math.floor(height * 0.25);

  ctx.fillStyle = "#000";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;

  // 计算文字宽度以确保正确居中
  const textWidth = ctx.measureText(text.value).width;
  const textX = width / 2;
  const textY = height / 2;

  // 清除可能的残留
  ctx.clearRect(0, 0, width, height);

  // 绘制文字
  ctx.fillText(text.value, textX, textY);

  const points = getPoints();
  clearCanvas();

  // 更新粒子位置
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    let p = particles[i];
    if (!p) {
      p = new Particle();
      particles.push(p);
    }
    p.moveTo(x, y);
  }

  // 移除多余的粒子
  if (points.length < particles.length) {
    particles.splice(points.length);
  }
}
function initParticles() {
  if (clockCanvas.value) {
    ctx = clockCanvas.value.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      // 设置更清晰的渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 初始化粒子
      for (let i = 0; i < props.particleCount; i++) {
        particles.push(new Particle());
      }

      updateParticles();
      drawParticles();

      // 每秒更新一次
      interval = setInterval(updateParticles, 1000);
    }
  }
}
// 生命周期钩子
onMounted(() => {
  initParticles();
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<style scoped>
.particles-clock-container {
  display: inline-block;
  position: relative;
  background: #ffffff;
  overflow: hidden; /* 防止内容溢出 */
}

canvas {
  display: block;
}
</style> 