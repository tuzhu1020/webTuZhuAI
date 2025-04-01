<script setup lang="ts">
import {
  ConfigProvider as AConfigProvider,
  StyleProvider as AStyleProvider,
  legacyLogicalPropertiesTransformer,
} from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import ParticlesClock from "@/components/ParticlesClock/index.vue";
</script>

<template>
  <AConfigProvider :locale="zhCN">
    <AStyleProvider hash-priority="high" :transformers="[legacyLogicalPropertiesTransformer]">
      <div class="h-screen bg-gray-50 overflow-y-auto scrollbar-hide">
        <!-- 顶部导航 -->
        <nav class="bg-white shadow-md fixed w-full top-0 z-50 transition-all duration-300">
          <div class="container mx-auto px-4">
            <div class="flex  items-center justify-between">
              <div class="flex items-center space-x-8">
                <div class="flex items-center">
                  <img src="@/assets/images/logo.svg" alt="Logo" class="h-10 w-10 transform hover:scale-105 transition-transform duration-300">
                  <span class="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI 助手</span>
                </div>
                <div class="hidden md:flex space-x-6">
                  <RouterLink to="/features" class="text-gray-600 hover:text-blue-600 transition-colors duration-300">功能特点</RouterLink>
                  <RouterLink to="/pricing" class="text-gray-600 hover:text-blue-600 transition-colors duration-300">价格方案</RouterLink>
                  <RouterLink to="/about" class="text-gray-600 hover:text-blue-600 transition-colors duration-300">关于我们</RouterLink>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <ParticlesClock :size="100" particleColor="#4F46E5" :particleRadius="1.5" :showSeconds="true" class="hidden md:block mr-4" />
                <RouterLink to="/login" class="text-gray-600 hover:text-blue-600 transition-colors duration-300">登录</RouterLink>
                <RouterLink to="/chat" class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-2 text-white transition-all duration-300 hover:shadow-lg hover:scale-105">
                  开始对话
                </RouterLink>
              </div>
            </div>
          </div>
        </nav>

        <!-- 页面内容 -->
        <main class="pt-100">
          <RouterView />
        </main>

        <!-- 页脚 -->
        <footer class="bg-gradient-to-b from-white to-gray-50 py-12">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div class="space-y-4">
                <div class="flex items-center">
                  <img src="@/assets/images/logo.svg" alt="Logo" class="h-8 w-8">
                  <span class="ml-2 text-xl font-bold text-gray-800">AI 助手</span>
                </div>
                <p class="text-gray-600">让AI助手成为您的得力帮手，提升工作效率。</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">快速链接</h3>
                <ul class="space-y-2">
                  <li>
                    <RouterLink to="/features" class="text-gray-600 hover:text-blue-600 transition-colors">功能特点</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/pricing" class="text-gray-600 hover:text-blue-600 transition-colors">价格方案</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/about" class="text-gray-600 hover:text-blue-600 transition-colors">关于我们</RouterLink>
                  </li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">支持</h3>
                <ul class="space-y-2">
                  <li>
                    <RouterLink to="/faq" class="text-gray-600 hover:text-blue-600 transition-colors">常见问题</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/contact" class="text-gray-600 hover:text-blue-600 transition-colors">联系我们</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/privacy" class="text-gray-600 hover:text-blue-600 transition-colors">隐私政策</RouterLink>
                  </li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">关注我们</h3>
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">
                    <i class="fab fa-weixin text-2xl"></i>
                  </a>
                  <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">
                    <i class="fab fa-weibo text-2xl"></i>
                  </a>
                  <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">
                    <i class="fab fa-github text-2xl"></i>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
              <p>© {{ new Date().getFullYear() }} AI 助手. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </AStyleProvider>
  </AConfigProvider>
</template> 