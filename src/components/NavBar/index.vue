<script setup lang="ts">
import ParticlesClock from "@/components/ParticlesClock/index.vue";
import { useUserStore } from "@/stores/user";
import logoutService from '@/service/user/logoutService'
import { Dropdown, Menu, MenuItem } from 'ant-design-vue'
const userStore = useUserStore();

async function onLogout() {
  try {
    await logoutService()
  } catch (e) {
    // 后端失败也进行本地退出，保证用户能登出
  } finally {
    userStore.logout()
  }
}
</script>

<template>
    <nav class="bg-white shadow-md fixed w-full top-0 z-50 transition-all duration-300 ">
        <div class="mx-auto px-4 max-w-1280 mx-auto">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-8">
                    <div class="flex items-center">
                        <img src="@/assets/images/logo.svg" alt="Logo"
                            class="h-20 w-20 transform hover:scale-105 transition-transform duration-300">
                        <span
                            class="ml-3 text-16 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI
                            助手</span>
                    </div>
                    <div class="hidden md:flex space-x-6">
                        <RouterLink to="/"
                            class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-10 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            首页</RouterLink>
                        <RouterLink to="/chat"
                            class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-10 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            AI 助手</RouterLink>
                        <RouterLink to="/video"
                            class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-10 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            视频平台</RouterLink>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <ParticlesClock :size="100" particleColor="#4F46E5" :particleRadius="1.5" :showSeconds="true"
                        class="hidden md:block mr-4" />

                    <!-- <RouterLink to="/chat" >
            开始对话
          </RouterLink> -->
                    <!-- 用户信息 -->
                    <Dropdown v-if="userStore.userInfo" :trigger="['hover']">
                        <div class="flex items-center space-x-4 mr-10 cursor-pointer">
                            <span class="text-gray-600">{{ userStore.userInfo.username }}</span>
                            <img src="@/assets/images/default_avatar.svg" class="h-32 w-32 rounded-full" />
                        </div>
                        <template #overlay>
                            <Menu>
                                <MenuItem key="logout" @click="onLogout">退出登录</MenuItem>
                            </Menu>
                        </template>
                    </Dropdown>
                    <RouterLink to="/login" class="text-gray-600 hover:text-blue-600 transition-colors duration-300"
                        v-else>登录</RouterLink>
                </div>
            </div>
        </div>
    </nav>
</template> 