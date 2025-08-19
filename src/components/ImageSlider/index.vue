<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

interface Props {
  images: string[];
  speed?: number;
  direction?: "left" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  speed: 50,
  direction: "left",
});

const containerRef = ref<HTMLDivElement | null>(null);
const sliderRef = ref<HTMLDivElement | null>(null);
let animationId: number | null = null;
let position = 0;
const isPaused = ref(false);

// 计算单个滑块的总宽度（包含间距）
const itemWidth = computed(() => {
  if (!sliderRef.value) return 0;
  const firstItem = sliderRef.value.firstElementChild as HTMLElement;
  return firstItem ? firstItem.offsetWidth + 20 * 2 : 0; // 20px 是 mx-10 的间距
});

// 计算整个滑块的总宽度
const totalWidth = computed(() => {
  return itemWidth.value * props.images.length;
});

// 计算容器宽度
const containerWidth = computed(() => {
  return containerRef.value?.offsetWidth || 0;
});

// 计算滚动速度
const scrollSpeed = computed(() => {
  return (props.speed || 50) / 50;
});

const resetPosition = () => {
  if (props.direction === "left") {
    if (Math.abs(position) >= totalWidth.value) {
      position = 0;
    }
  } else {
    if (position >= 0) {
      // 当向右滚动到末尾时，重置到最左侧
      position = -totalWidth.value;
    }
  }
};

const animate = () => {
  if (!containerRef.value || !sliderRef.value || isPaused.value) {
    animationId = requestAnimationFrame(animate);
    return;
  }

  // 使用计算后的速度进行滚动
  position +=
    props.direction === "left" ? -scrollSpeed.value : scrollSpeed.value;
  resetPosition();

  // 使用transform3d来启用硬件加速
  sliderRef.value.style.transform = `translate3d(${position}px, 0, 0)`;
  animationId = requestAnimationFrame(animate);
};

const handleMouseEnter = () => {
  isPaused.value = true;
};

const handleMouseLeave = () => {
  isPaused.value = false;
};

const initializePosition = () => {
  if (props.direction === "left") {
    position = 0;
  } else {
    position = -totalWidth.value + 600;
  }
};

onMounted(() => {
  if (sliderRef.value) {
    // 等待图片加载完成后初始化位置
    Promise.all(
      Array.from(sliderRef.value.getElementsByTagName("img")).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
        });
      })
    ).then(() => {
      initializePosition();
      animationId = requestAnimationFrame(animate);
    });
  }
});

onUnmounted(() => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <div ref="containerRef" class="w-full overflow-hidden py-6" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div ref="sliderRef" class="flex items-center will-change-transform" :style="{ minWidth: totalWidth * 2 + 'px' }">
      <div v-for="(image, index) in [...images, ...images]" :key="index" class="flex-shrink-0 bg-white mx-10 w-200 h-100 rounded-12">
        <img :src="image" :alt="'合作伙伴 ' + (index % images.length + 1)" class="w-200 h-100 object-contain transition-transform duration-300 hover:scale-110">
      </div>
    </div>
  </div>
</template>

<style scoped>
.will-change-transform {
  backface-visibility: hidden;
  transform-style: preserve-3d;
  will-change: transform;
}
</style> 