<script setup lang="ts">
import { contextHolder } from "@/composables/antMessage";
import {
  ConfigProvider as AConfigProvider,
  StyleProvider as AStyleProvider,
  legacyLogicalPropertiesTransformer,
  Drawer as ADrawer,
} from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import SideBar from "./components/SideBar/index.vue";
import { MenuOutlined } from "@ant-design/icons-vue";

const isMobile = ref(false);
const drawerVisible = ref(false);

// 检测屏幕尺寸
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
});

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value;
};
</script>

<template>
  <AConfigProvider :locale="zhCN">
    <AStyleProvider hash-priority="high" :transformers="[legacyLogicalPropertiesTransformer]">
      <main class="h-screen flex relative">
        <!-- 移动端菜单按钮 -->
        <div v-if="isMobile" class="fixed top-16 left-16 z-50">
          <div 
            @click="toggleDrawer"
            class="w-44 h-44 flex items-center justify-center rounded-full bg-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <MenuOutlined class="text-20 text-[var(--primary-color)]" />
          </div>
        </div>

        <!-- 桌面端侧边栏 -->
        <div v-if="!isMobile" class="side-bar h-screen">
          <SideBar />
        </div>

        <!-- 移动端抽屉侧边栏 -->
        <ADrawer
          v-if="isMobile"
          :open="drawerVisible"
          @update:open="(val) => drawerVisible = val"
          placement="left"
          :width="280"
          :closable="false"
          :bodyStyle="{ padding: 0, height: '100%' }"
        >
          <SideBar />
        </ADrawer>

        <div class="main-content h-screen flex flex-1 flex-col">
          <div class="flex-1">
            <router-view />
          </div>
          <!-- <footer class="m-y-6 text-center text-12 text-[var(--text-desc-color)]">
        内容由 AI 生成，请仔细甄别
      </footer> -->
        </div>
      </main>
      <contextHolder />
    </AStyleProvider>
  </AConfigProvider>
</template>
