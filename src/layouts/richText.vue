<script setup lang="ts">
import {
    ConfigProvider as AConfigProvider,
    StyleProvider as AStyleProvider,
    legacyLogicalPropertiesTransformer,
} from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import NavBar from "@/components/NavBar/index.vue";
</script>

<template>
    <AConfigProvider :locale="zhCN">
        <AStyleProvider hash-priority="high" :transformers="[legacyLogicalPropertiesTransformer]">
            <div class="h-screen bg-gray-50 overflow-y-auto scrollbar-hide flex flex-col">
                <!-- 使用导航组件 -->
                <NavBar />

                <!-- 页面内容 -->
                <main class="pt-100 flex-1">
                    <RouterView />
                </main>
            </div>
        </AStyleProvider>
    </AConfigProvider>
</template>