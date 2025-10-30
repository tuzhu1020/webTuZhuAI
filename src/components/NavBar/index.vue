<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ParticlesClock from "@/components/ParticlesClock/index.vue";
import { useUserStore } from "@/stores/user";
import logoutService from '@/service/user/logoutService'
import { Dropdown, Menu, MenuItem } from 'ant-design-vue'

const userStore = useUserStore();
const route = useRoute();
const mobileMenuOpen = ref(false);

async function onLogout() {
  try {
    await logoutService()
  } catch (e) {
    // 后端失败也进行本地退出，保证用户能登出
  } finally {
    userStore.logout()
  }
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

// 路由切换时自动关闭移动菜单
watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});
</script>

<template>
    <nav class="bg-white shadow-md fixed w-full top-0 z-50 transition-all duration-300 ">
        <div class="mx-auto px-4 max-w-1280">
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
                        <RouterLink to="/richText"
                            class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-10 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            智能写作</RouterLink>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <ParticlesClock :size="100" particleColor="#4F46E5" :particleRadius="1.5" :showSeconds="true"
                        class="hidden md:block mr-4" />

                    <!-- 用户信息 - 桌面端 -->
                    <Dropdown v-if="userStore.userInfo" :trigger="['hover']" class="hidden md:block">
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
                    
                    <!-- 登录按钮 - 桌面端 -->
                    <RouterLink to="/login" class="text-gray-600 hover:text-blue-600 transition-colors duration-300 hidden md:block"
                        v-else>登录</RouterLink>

                    <!-- 汉堡菜单按钮 - 移动端 -->
                    <div @click="toggleMobileMenu" 
                        class="md:hidden flex flex-col justify-center items-center w-40 h-40 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-8 transition-all duration-300 hover:shadow-lg focus:outline-none border-none"
                        aria-label="菜单">
                        <span class="hamburger-line" :class="{ 'rotate-45 translate-y-6': mobileMenuOpen }"></span>
                        <span class="hamburger-line my-4" :class="{ 'opacity-0': mobileMenuOpen }"></span>
                        <span class="hamburger-line" :class="{ '-rotate-45 -translate-y-6': mobileMenuOpen }"></span>
                    </div>
                </div>
            </div>

            <!-- 移动端下拉菜单 -->
            <Transition name="mobile-menu">
                <div v-if="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div class="px-4 py-20 space-y-12">
                        <!-- 导航链接 -->
                        <RouterLink to="/"
                            class="block w-full text-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 py-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            首页
                        </RouterLink>
                        <RouterLink to="/chat"
                            class="block w-full text-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 py-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            AI 助手
                        </RouterLink>
                        <RouterLink to="/video"
                            class="block w-full text-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 py-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            视频平台
                        </RouterLink>
                        <RouterLink to="/richText"
                            class="block w-full text-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 py-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 no-underline">
                            智能写作
                        </RouterLink>

                        <!-- 用户信息或登录按钮 - 移动端 -->
                        <div v-if="userStore.userInfo" class="pt-12 border-t border-gray-200">
                            <div class="flex items-center justify-center space-x-12 mb-12">
                                <img src="@/assets/images/default_avatar.svg" class="h-40 w-40 rounded-full" />
                                <span class="text-gray-700 font-medium">{{ userStore.userInfo.username }}</span>
                            </div>
                            <div @click="onLogout"
                                class="block w-full text-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 py-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-105">
                                退出登录
                            </div>
                        </div>
                        <RouterLink v-else to="/login"
                            class="block w-full text-center rounded-full border-2 border-blue-500 py-12 text-blue-600 font-medium transition-all duration-300 hover:bg-blue-50 no-underline">
                            登录
                        </RouterLink>
                    </div>
                </div>
            </Transition>
        </div>
    </nav>
</template>

<style scoped>
/* 汉堡菜单线条样式 */
.hamburger-line {
    display: block;
    width: 24px;
    height: 2px;
    background-color: white;
    transition: all 0.3s ease-in-out;
    transform-origin: center;
}

/* 移动菜单进入/离开动画 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
    transition: all 0.3s ease-in-out;
}

.mobile-menu-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.mobile-menu-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

.mobile-menu-enter-to,
.mobile-menu-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style> 