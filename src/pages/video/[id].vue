<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
// 使用类型断言直接处理
const params = route.params as any;
const videoId = params.id || "";

// 这个页面只是一个中转，实际会重定向到视频详情页
// 实际项目中可以在这里获取视频数据并渲染
onMounted(() => {
  router.replace(`/video/detail?id=${videoId}`);
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-gray-500">
      <i class="i-tabler-loader animate-spin mr-2"></i>
      正在加载视频...
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: video
  requiresAuth: false
</route> 