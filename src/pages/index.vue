<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import ImageSlider from "@/components/ImageSlider/index.vue";
import { PARTNER_IMAGE_URLS } from "@/constant/enum";
const userStore = useUserStore();


</script>

<template>
  <div class=" overflow-y-auto">
    <!-- 主横幅 -->
    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 py-20 ">
      <div class="container mx-auto px-4 text-center">
        <h1 class="mb-6 text-5xl font-bold text-white">
          智能 AI 助手
        </h1>
        <p class="mb-8 text-xl text-white/80">
          让 AI 为您的工作和学习提供智能支持
        </p>
        <div class="space-x-4">
          <RouterLink to="/chat" class="inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-600 transition-colors hover:bg-blue-50">
            立即体验
          </RouterLink>
          <a href="#features" class="inline-block rounded-lg border-2 border-white px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/10">
            了解更多
          </a>
        </div>
      </div>
    </div>

    <!-- 功能特点 -->
    <div id="features" class="container mx-auto px-4 py-20">
      <h2 class="mb-12 text-center text-3xl font-bold text-gray-800">
        核心功能
      </h2>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <!-- 特点 1 -->
        <div class="rounded-xl bg-white p-8 shadow-lg transition-transform hover:-translate-y-1">
          <div class="mb-4 text-3xl text-blue-600">💡</div>
          <h3 class="mb-3 text-xl font-bold text-gray-800">
            智能对话
          </h3>
          <p class="text-gray-600">
            采用先进的自然语言处理技术，精准理解您的需求，提供智能对话服务。
          </p>
        </div>

        <!-- 特点 2 -->
        <div class="rounded-xl bg-white p-8 shadow-lg transition-transform hover:-translate-y-1">
          <div class="mb-4 text-3xl text-blue-600">🚀</div>
          <h3 class="mb-3 text-xl font-bold text-gray-800">
            高效协作
          </h3>
          <p class="text-gray-600">
            快速响应，提供专业的解决方案，帮助您提高工作效率。
          </p>
        </div>

        <!-- 特点 3 -->
        <div class="rounded-xl bg-white p-8 shadow-lg transition-transform hover:-translate-y-1">
          <div class="mb-4 text-3xl text-blue-600">🔒</div>
          <h3 class="mb-3 text-xl font-bold text-gray-800">
            安全可靠
          </h3>
          <p class="text-gray-600">
            采用先进的加密技术，确保您的数据安全，保护隐私。
          </p>
        </div>
      </div>
    </div>

    <!-- 合作伙伴展示 -->
    <div class="py-16 bg-gray-50">
      <div class=" mx-auto px-4">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">合作伙伴</h2>
        <div class="relative space-y-8 bg-gray-100 ">
          <div class="absolute left-0 top-0 bottom-0 w-100 z-10 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-0 w-100 z-10 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider1" direction="left" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider2" direction="right" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider3" direction="left" />
          <ImageSlider :images="PARTNER_IMAGE_URLS.slider4" direction="right" />
        </div>
      </div>
    </div>
    <!-- 用户信息 -->
    <div v-if="userStore.userInfo" class="container mx-auto mb-16 px-4 text-center">
      <div class="inline-block rounded-lg bg-blue-50 px-6 py-3">
        <span class="text-gray-600">欢迎回来，</span>
        <span class="font-semibold text-blue-600">{{ userStore.userInfo.username }}</span>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: landing
  requiresAuth: false
</route>