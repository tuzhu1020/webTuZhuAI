<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import getOpenUrlService from '../../service/wps/getOpenUrlService'

const WpsEditor = defineAsyncComponent(() => import('../../components/WpsEditor/index.vue'))

const loading = ref(true)
const errorMsg = ref('')
const openUrl = ref('')
const sdkSrc = '/web-office-sdk-v1.1.19-b9fc2be1/web-office-sdk-v1.1.19.umd.js'

onMounted(async () => {
  try {
    const data = await getOpenUrlService()
    console.log(data, 'data')

    openUrl.value = data?.url || ''
  }
  catch (e: any) {
    errorMsg.value = e?.message || '获取在线编辑地址失败'
  }
  finally {
    loading.value = false
  }
})
</script>

<route lang="yaml">
meta:
  layout: video
  requiresAuth: true
</route>

<template>
  <div class="w-full h-full" style="height: calc(100vh - 0px);">
    <div v-if="loading" class="p-4">加载中...</div>
    <div v-else-if="errorMsg" class="p-4 text-red-600">{{ errorMsg }}</div>
    <WpsEditor v-else :url="openUrl" :sdk-src="sdkSrc" />
  </div>
</template>
