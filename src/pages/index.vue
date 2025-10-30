<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { PARTNER_IMAGE_URLS } from "@/constant/enum";
import ImageSlider from "@/components/ImageSlider/index.vue";
import ProcessCards from "@/components/ProcessCards/index.vue";
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const userStore = useUserStore();
const isMobile = ref(false);

// 挖空效果相关变量
const bgUrl = new URL('@/assets/images/login-bg.jpg', import.meta.url).href;
const containerRef = ref(null);
const scrollBoxRef = ref(null);
const cutoutBoxRef = ref(null);

// 挖空盒子样式对象
const cutoutStyle = reactive({
  backgroundImage: `url(${bgUrl})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'scroll',
  backgroundPosition: 'center 0px',
  backgroundClip: 'content-box',
  zIndex: 2
});

// 检测是否为移动设备
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// 挖空效果滚动处理函数
function handleScroll() {
  if (!scrollBoxRef.value || !cutoutBoxRef.value) return;

  const scrollTop = scrollBoxRef.value.scrollTop;
  // cutout 相对于 scrollBox 内容的 offsetTop
  const offsetTop = cutoutBoxRef.value.offsetTop;

  // 计算背景位置：使背景与容器对齐
  const bgY = -(offsetTop - scrollTop);

  // 更新 cutout 背景位置
  cutoutStyle.backgroundPosition = `center ${bgY}px`;
}

let resizeObserver = null;

onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);

  // 移动端禁用部分动画以提升性能
  if (isMobile.value) {
    return;
  }

  // Hero section animations
  gsap.set(".hero-title", { opacity: 0, y: 50 });
  gsap.set(".hero-subtitle", { opacity: 0, y: 30 });
  gsap.set(".hero-buttons", { opacity: 0, y: 40 });
  gsap.set(".hero-logo", { opacity: 0, scale: 0.8, rotation: -10 });
  gsap.set(".bg-decoration", { opacity: 0, scale: 0 });

  // Hero timeline with stunning entrance
  const heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .to(".bg-decoration", { opacity: 0.1, scale: 1, duration: 2, ease: "power2.out" })
    .to(".hero-logo", { opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" }, "-=1.5")
    .to(".hero-title", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.8")
    .to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.5")
    .to(".hero-buttons", { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }, "-=0.3");

  // Logo floating animation with complex motion
  gsap.to(".hero-logo", {
    y: -20,
    rotation: 5,
    duration: 3,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1
  });

  // Background decorations complex floating
  gsap.to(".bg-decoration", {
    y: "random(-30, 30)",
    x: "random(-20, 20)",
    rotation: "random(-180, 180)",
    duration: "random(4, 6)",
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    stagger: 0.5
  });

  // Feature cards scroll animations with 3D effect
  gsap.set(".feature-card", { opacity: 0, y: 80, rotationX: 45, scale: 0.8 });
  
  ScrollTrigger.create({
    trigger: ".features-section",
    start: "top 80%",
    onEnter: () => {
      gsap.to(".feature-card", {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.2
      });
    }
  });

  // Feature cards continuous floating with different patterns
  gsap.to(".feature-card:nth-child(1)", {
    y: -10,
    rotation: 1,
    duration: 2.5,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1
  });

  gsap.to(".feature-card:nth-child(2)", {
    y: -15,
    rotation: -1,
    duration: 3,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: 0.5
  });

  gsap.to(".feature-card:nth-child(3)", {
    y: -12,
    rotation: 0.5,
    duration: 2.8,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: 1
  });

  // Video platform section with morphing entrance
  gsap.set(".video-section", { opacity: 0 });
  gsap.set(".video-content", { scale: 0.8, y: 50, rotationY: 45 });
  
  ScrollTrigger.create({
    trigger: ".video-platform-section",
    start: "top 85%",
    onEnter: () => {
      const videoTl = gsap.timeline();
      videoTl
        .to(".video-section", { opacity: 1, duration: 0.6 })
        .to(".video-content", { 
          scale: 1, 
          y: 0, 
          rotationY: 0,
          duration: 1.2, 
          ease: "elastic.out(1, 0.5)" 
        }, "-=0.3");
    }
  });

  // Video icon advanced pulsing with glow effect
  gsap.to(".video-icon", {
    scale: 1.15,
    textShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
    duration: 1.5,
    ease: "power2.inOut",
    yoyo: true,
    repeat: -1
  });

  // Partner section with wave entrance
  gsap.set(".partners-title", { opacity: 0, y: 30, scale: 0.9 });
  
  ScrollTrigger.create({
    trigger: ".partners-section",
    start: "top 90%",
    onEnter: () => {
      gsap.to(".partners-title", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  });

  // Enhanced button hover animations with magnetic effect
  const buttons = document.querySelectorAll('.animated-button');
  buttons.forEach(button => {
    // Magnetic effect on mouse move
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(button, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    
    button.addEventListener('mouseenter', () => {
      gsap.to(button, { 
        scale: 1.05, 
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        duration: 0.3, 
        ease: "power2.out" 
      });
    });
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, { 
        scale: 1, 
        x: 0,
        y: 0,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        duration: 0.3, 
        ease: "power2.out" 
      });
    });
  });

  // Advanced parallax effects
  gsap.to(".parallax-slow", {
    yPercent: -50,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top bottom",
      end: "bottom top",
      scrub: 1
    }
  });

  gsap.to(".parallax-fast", {
    yPercent: -100,
    rotation: 180,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top bottom",
      end: "bottom top",
      scrub: 2
    }
  });

  // Scroll-triggered gradient animation
  ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const hue = progress * 60 + 220; // Transition from blue to purple
      document.documentElement.style.setProperty('--scroll-hue', hue);
    }
  });

  // Feature card hover animations with tilt effect
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  });

  // 挖空效果初始化
  nextTick().then(() => {
    handleScroll();

    // 监听 resize：元素位置变化时重新计算
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleScroll();
      });
      if (scrollBoxRef.value) resizeObserver.observe(scrollBoxRef.value);
      if (cutoutBoxRef.value) resizeObserver.observe(cutoutBoxRef.value);
    } else {
      window.addEventListener('resize', handleScroll);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  // 清理挖空效果的ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  } else {
    window.removeEventListener('resize', handleScroll);
  }
});
</script>

<template>
  <div class="overflow-y-auto">
    <!-- 挖空效果区域 -->
    <div
      ref="containerRef"
      class="relative w-full h-[600px] overflow-hidden"
      :style="`background-image: url(${bgUrl}); background-size: cover; background-position: center 0px;`"
    >
      <!-- 大盒子（白色覆盖，可滚动） -->
      <div
        ref="scrollBoxRef"
        class="absolute inset-0 overflow-y-auto p-4"
        style="background-color: rgba(255,255,255,1);"
        @scroll="handleScroll"
      >
        <div class="bg-white p-4 m-2 border border-gray-300 rounded h-80">小盒子</div>
        <div class="bg-white p-4 m-2 border border-gray-300 rounded h-80">小盒子</div>
        <div class="bg-white p-4 m-2 border border-gray-300 rounded h-80">小盒子</div>
        <div class="bg-white p-4 m-2 border border-gray-300 rounded h-80">小盒子</div>
        <div class="bg-white p-4 m-2 border border-gray-300 rounded h-80">小盒子</div>

        <!-- 挖空盒子：用 class 绑定样式 -->
        <div
          ref="cutoutBoxRef"
          class="cutout-box relative p-4 m-2 border border-blue-500 rounded min-h-[150px]"
          :style="cutoutStyle"
        >
          <!-- <span class="bg-white px-2 py-1 rounded text-sm relative z-10">挖空盒子可以看到图片</span> -->
        </div>

        <div
          class="bg-white p-4 m-2 border border-gray-300 rounded h-80"
          v-for="i in 6"
          :key="i"
        >
          小盒子
        </div>
      </div>
    </div>

    <!-- 主横幅 - 现代简约风格 -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-700 py-12 md:py-20 relative overflow-hidden">
      <!-- 装饰性背景元素 -->
      <div class="absolute top-0 left-0 right-0 bottom-0 opacity-10">
        <div class="bg-decoration absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl parallax-slow"></div>
        <div class="bg-decoration absolute bottom-10 right-10 w-60 h-60 rounded-full bg-blue-300 blur-3xl parallax-fast"></div>
      </div>

      <div class="max-w-1280 mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between relative z-10">
        <div class="text-center md:text-left mb-8 md:mb-0 md:w-1/2">
          <h1 class="hero-title mb-4 md:mb-6 text-32 md:text-48 lg:text-56 font-bold text-white leading-tight">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">智能 土猪AI 助手nb</span>
          </h1>
          <p class="hero-subtitle mb-6 md:mb-8 text-14 md:text-16 lg:text-18 text-blue-100 max-w-512 mx-auto md:mx-0 leading-relaxed px-4 md:px-0">
            让 AI 为您的工作和学习提供智能支持，提高效率，解决问题，让每一天都更加高效
          </p>
          <div class="hero-buttons flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start px-4 md:px-0">
            <RouterLink to="/chat" class="animated-button rounded-full bg-white px-6 md:px-8 py-3 md:py-4 text-14 md:text-16 font-semibold text-blue-700 transition-all duration-300 hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-700/20">
              立即体验
            </RouterLink>
            <RouterLink to="/video" class="animated-button rounded-full border-2 border-white/70 bg-white/10 backdrop-blur-sm px-6 md:px-8 py-3 md:py-4 text-14 md:text-16 font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:shadow-purple-700/20">
              视频平台
            </RouterLink>
          </div>
        </div>
        <div class="w-full md:w-1/2 flex justify-center mt-8 md:mt-0">
          <img src="@/assets/images/logo.svg" alt="AI助手" class="hero-logo w-3/5 md:w-4/5 max-w-200 md:max-w-md drop-shadow-2xl">
        </div>
      </div>
    </div>

    <!-- 用户欢迎信息 -->
    <div v-if="userStore.userInfo" class="relative z-10 -mt-4 md:-mt-6 mb-6 md:mb-10 px-4">
      <div class="max-w-200 mx-auto">
        <div class="bg-white shadow-xl rounded-full py-3 md:py-4 px-6 md:px-8 text-center backdrop-blur-lg border border-gray-100 text-14 md:text-16">
          <span class="text-gray-600">欢迎回来，</span>
          <span class="font-semibold text-blue-600">{{ userStore.userInfo.username }}</span>
        </div>
      </div>
    </div>

    <!-- 核心特点 - 现代卡片 -->
    <div class="features-section py-12 md:py-20 bg-gray-50">
      <div class="max-w-1280 mx-auto px-4 md:px-6">
        <h2 class="mb-4 md:mb-6 text-center text-24 md:text-32 lg:text-36 font-bold text-gray-800">
          <span class="relative inline-block">
            核心功能
            <span class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
          </span>
        </h2>
        <p class="text-center text-14 md:text-16 text-gray-600 mb-10 md:mb-16 max-w-2xl mx-auto px-4">
          我们提供一系列强大的功能，帮助您提升工作效率和创意表达
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <!-- 特点 1 -->
          <div class="feature-card bg-white rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 border-t-4 border-blue-500">
            <div class="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-blue-50 text-blue-500 mb-4 md:mb-6">
              <span class="text-24 md:text-32">💡</span>
            </div>
            <h3 class="mb-3 md:mb-4 text-18 md:text-20 lg:text-24 font-bold text-gray-800">
              智能对话
            </h3>
            <p class="text-14 md:text-16 text-gray-600 leading-relaxed">
              采用先进的自然语言处理技术，精准理解您的需求，提供智能对话服务和专业的建议。
            </p>
          </div>

          <!-- 特点 2 -->
          <div class="feature-card bg-white rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 border-t-4 border-purple-500">
            <div class="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-purple-50 text-purple-500 mb-4 md:mb-6">
              <span class="text-24 md:text-32">🚀</span>
            </div>
            <h3 class="mb-3 md:mb-4 text-18 md:text-20 lg:text-24 font-bold text-gray-800">
              高效协作
            </h3>
            <p class="text-14 md:text-16 text-gray-600 leading-relaxed">
              快速响应，提供专业的解决方案，帮助您提高工作效率，解决复杂问题。
            </p>
          </div>

          <!-- 特点 3 -->
          <div class="feature-card bg-white rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 border-t-4 border-indigo-500">
            <div class="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-indigo-50 text-indigo-500 mb-4 md:mb-6">
              <span class="text-24 md:text-32">🎬</span>
            </div>
            <h3 class="mb-3 md:mb-4 text-18 md:text-20 lg:text-24 font-bold text-gray-800">
              视频平台
            </h3>
            <p class="text-14 md:text-16 text-gray-600 leading-relaxed">
              上传视频，观看内容，发送互动弹幕，打造您的专属视频社区，展示创意作品。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频平台引导区 -->
    <div class="video-platform-section py-12 md:py-20 bg-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-70 parallax-slow hidden md:block"></div>
      <div class="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-t from-purple-50 to-transparent opacity-70 parallax-fast hidden md:block"></div>

      <div class="video-section max-w-1280 mx-auto px-4 md:px-6 relative z-10">
        <div class="max-w-768 mx-auto text-center mb-8 md:mb-12">
          <h2 class="mb-4 md:mb-6 text-24 md:text-32 lg:text-36 font-bold text-gray-800">
            视频平台
          </h2>
          <p class="text-14 md:text-16 lg:text-18 text-gray-600 max-w-672 mx-auto leading-relaxed px-4">
            我们全新的视频平台已经上线，支持视频上传、播放和弹幕互动，快来体验吧！
          </p>
        </div>

        <div class="video-content bg-gradient-to-br from-white to-gray-50 rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto overflow-hidden group">
          <div class="aspect-video bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl mb-6 md:mb-8 flex items-center justify-center relative overflow-hidden">
            <div class="video-icon text-56 md:text-72 lg:text-84">🎬</div>
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
          </div>
          <div class="flex justify-center">
            <RouterLink to="/video" class="animated-button inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 md:px-10 py-3 md:py-4 text-14 md:text-16 lg:text-18 font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
              前往视频平台
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
   <!-- 合作伙伴展示 -->
    <div class="partners-section py-10 md:py-16 bg-gray-50">
      <div class="mx-auto px-4">
        <h2 class="partners-title text-20 md:text-24 lg:text-30 font-bold text-center text-gray-800 mb-8 md:mb-12">待合作伙伴</h2>
        <div class="space-y-6 md:space-y-8 bg-gray-100">
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider1" direction="left" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider2" direction="right" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider3" direction="left" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider4" direction="right" />
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: landing
  requiresAuth: false
</route>

<style scoped>
/* 挖空盒子样式：让背景显示在内容区域，且保证在最上层显示 */
.cutout-box {
  /* 如果你想挖空看上去更像"洞"，可以把盒子内部背景透明或者设置 border 等 */
  /* background-clip 已在内联样式设置 */
  position: relative;
  z-index: 2;
  /* 可根据视觉需要调整内边距与背景裁剪 */
  -webkit-background-clip: content-box;
  background-clip: content-box;
}
</style>