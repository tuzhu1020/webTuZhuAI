<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

// 声明全局 SDK 类型
interface IWebOfficeSDK {
  config: (options: { url: string; mount?: HTMLElement }) => any
}

declare global {
  interface Window {
    WebOfficeSDK?: IWebOfficeSDK & any
  }
}

const props = defineProps<{
  url: string
  sdkSrc?: string
}>()

// 本地公共目录中的 SDK（已放置于 SkyVue/public）
const DEFAULT_SDK_SRC = '/web-office-sdk-v1.1.19-b9fc2be1/web-office-sdk-v1.1.19.umd.js'

const iframeRef = ref<HTMLDivElement | null>(null)
let jssdk: any = null

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.WebOfficeSDK) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-wps-sdk="true"]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load ' + (existing.src || src))))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-wps-sdk', 'true')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load ' + src))
    document.body.appendChild(script)
  })
}

onMounted(async () => {
  // 优先载入本地下载的 SDK
  await loadScript(props.sdkSrc || DEFAULT_SDK_SRC)

  const WebOfficeSDK = window.WebOfficeSDK
  if (!WebOfficeSDK)
    return

  jssdk = WebOfficeSDK.config({
    url: props.url,
    mount: iframeRef.value || undefined,
  })

  jssdk.on && jssdk.on('fileOpen', (_data: any) => {
    // 可在此处上报或埋点
  })
})

onBeforeUnmount(() => {
  if (jssdk && typeof jssdk.destroy === 'function')
    jssdk.destroy()
})
</script>

<template>
  <div ref="iframeRef" class="w-full h-full" style="height: 100%"></div>
</template>

<style scoped>
:host, .w-full, .h-full {
  width: 100%;
  height: 100%;
}
</style>
