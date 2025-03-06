<script setup lang="ts">
import { contextHolder } from '@/composables/antMessage'
import { ConfigProvider as AConfigProvider, StyleProvider as AStyleProvider, legacyLogicalPropertiesTransformer } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import SideBar from './components/SideBar/index.vue'
</script>

<template>
  <AConfigProvider :locale="zhCN">
    <AStyleProvider hash-priority="high" :transformers="[legacyLogicalPropertiesTransformer]">
      <main class="h-screen flex">
        <div class="side-bar h-screen">
          <SideBar />
        </div>
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
