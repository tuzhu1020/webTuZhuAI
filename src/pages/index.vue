<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { PARTNER_IMAGE_URLS } from "@/constant/enum";
import ImageSlider from "@/components/ImageSlider/index.vue";
const userStore = useUserStore();
</script>

<template>
  <div class="overflow-y-auto">
    <!-- 主横幅 - 现代简约风格 -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-700 py-20 relative overflow-hidden">
      <!-- 装饰性背景元素 -->
      <div class="absolute top-0 left-0 right-0 bottom-0 opacity-10">
        <div class="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-blue-300 blur-3xl"></div>
      </div>

      <div class="max-w-1280 mx-auto px-6 flex flex-col md:flex-row items-center justify-between relative z-10">
        <div class="text-center md:text-left mb-12 md:mb-0 md:w-1/2">
          <h1 class="mb-6 text-48 md:text-56 font-bold text-white leading-tight">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">智能 土猪AI 助手nb</span>
          </h1>
          <p class="mb-8 text-18 text-blue-100 max-w-512 leading-relaxed">
            让 AI 为您的工作和学习提供智能支持，提高效率，解决问题，让每一天都更加高效
          </p>
          <div class="flex flex-wrap gap-4 justify-center md:justify-start">
            <RouterLink to="/chat" class="rounded-full bg-white px-8 py-4 text-16 font-semibold text-blue-700 transition-all duration-300 hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-700/20 transform hover:-translate-y-1">
              立即体验
            </RouterLink>
            <RouterLink to="/video" class="rounded-full border-2 border-white/70 bg-white/10 backdrop-blur-sm px-8 py-4 text-16 font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:shadow-purple-700/20 transform hover:-translate-y-1">
              视频平台
            </RouterLink>
          </div>
        </div>
        <div class="w-full md:w-1/2 flex justify-center">
          <img src="@/assets/images/logo.svg" alt="AI助手" class="w-4/5 max-w-md transform hover:scale-105 transition-all duration-700 drop-shadow-2xl">
        </div>
      </div>
    </div>

    <!-- 用户欢迎信息 -->
    <div v-if="userStore.userInfo" class="relative z-10 -mt-6 mb-10">
      <div class="max-w-200 mx-auto">
        <div class="bg-white shadow-xl rounded-full py-4 px-8 text-center backdrop-blur-lg border border-gray-100">
          <span class="text-gray-600">欢迎回来，</span>
          <span class="font-semibold text-blue-600">{{ userStore.userInfo.username }}</span>
        </div>
      </div>
    </div>

    <!-- 核心特点 - 现代卡片 -->
    <div class="py-20 bg-gray-50">
      <div class="max-w-1280 mx-auto px-6">
        <h2 class="mb-6 text-center text-36 font-bold text-gray-800">
          <span class="relative inline-block">
            核心功能
            <span class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
          </span>
        </h2>
        <p class="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          我们提供一系列强大的功能，帮助您提升工作效率和创意表达
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- 特点 1 -->
          <div class="bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 border-t-4 border-blue-500">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-50 text-blue-500 mb-6">
              <span class="text-32">💡</span>
            </div>
            <h3 class="mb-4 text-24 font-bold text-gray-800">
              智能对话
            </h3>
            <p class="text-gray-600 leading-relaxed">
              采用先进的自然语言处理技术，精准理解您的需求，提供智能对话服务和专业的建议。
            </p>
          </div>

          <!-- 特点 2 -->
          <div class="bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 border-t-4 border-purple-500">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-purple-50 text-purple-500 mb-6">
              <span class="text-32">🚀</span>
            </div>
            <h3 class="mb-4 text-24 font-bold text-gray-800">
              高效协作
            </h3>
            <p class="text-gray-600 leading-relaxed">
              快速响应，提供专业的解决方案，帮助您提高工作效率，解决复杂问题。
            </p>
          </div>

          <!-- 特点 3 -->
          <div class="bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 border-t-4 border-indigo-500">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-50 text-indigo-500 mb-6">
              <span class="text-32">🎬</span>
            </div>
            <h3 class="mb-4 text-24 font-bold text-gray-800">
              视频平台
            </h3>
            <p class="text-gray-600 leading-relaxed">
              上传视频，观看内容，发送互动弹幕，打造您的专属视频社区，展示创意作品。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频平台引导区 -->
    <div class="py-20 bg-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-70"></div>
      <div class="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-t from-purple-50 to-transparent opacity-70"></div>

      <div class="max-w-1280 mx-auto px-6 relative z-10">
        <div class="max-w-768 mx-auto text-center mb-12">
          <h2 class="mb-6 text-36 font-bold text-gray-800">
            视频平台
          </h2>
          <p class="text-18 text-gray-600 max-w-672 mx-auto leading-relaxed">
            我们全新的视频平台已经上线，支持视频上传、播放和弹幕互动，快来体验吧！
          </p>
        </div>

        <div class="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 max-w-4xl mx-auto overflow-hidden group">
          <div class="aspect-video bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all duration-500">
            <div class="text-84 group-hover:scale-110 transition-transform duration-500">🎬</div>
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div class="flex justify-center">
            <RouterLink to="/video" class="inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-10 py-4 text-18 font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 transform hover:-translate-y-1">
              前往视频平台
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
   <!-- 合作伙伴展示 -->
    <div class="py-16 bg-gray-50">
      <div class=" mx-auto px-4">
        <h2 class="text-30 font-bold text-center text-gray-800 mb-12">待合作伙伴</h2>
        <div class="space-y-8 bg-gray-100 ">
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