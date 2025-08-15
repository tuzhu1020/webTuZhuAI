<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  html?: string
}

const props = withDefaults(defineProps<Props>(), {
  html: ''
})

const iframeRef = ref<HTMLIFrameElement | null>(null)

const docHtml = computed(() => {
  const content = (props.html || '').trim()
  const hasHtmlTag = /<\/?html[\s>]/i.test(content)
  const hasBodyTag = /<\/?body[\s>]/i.test(content)
  const safe = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HTML Runner</title>
  <style>
    html,body { height:100%; margin:0; padding:0; }
    /* 基础样式，避免滚动条闪烁 */
    * { box-sizing: border-box; }
  </style>
  <script>window.onerror=function(m,s,l,c,e){console.error(e||m);};<\/script>
  <base target="_blank" />
</head>
${hasBodyTag ? content : `<body>${content}</body>`}
${hasHtmlTag ? '' : '</html>'}`
  return hasHtmlTag ? content : safe
})

watch(
  () => props.html,
  () => {
    if (!iframeRef.value) return
    // 直接依赖 :srcdoc 绑定即可，保留此监视以便未来扩展
  }
)

onMounted(() => {})
onBeforeUnmount(() => {})
</script>

<template>
  <div class="w-full h-full bg-white">
    <iframe
      ref="iframeRef"
      class="w-full h-full border-0"
      :srcdoc="docHtml"
      sandbox="allow-scripts allow-forms allow-popups allow-downloads"
    />
  </div>
  
</template>

<style scoped>
</style>


