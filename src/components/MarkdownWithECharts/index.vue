<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { MdPreview } from 'md-editor-v3'
import * as echarts from 'echarts'

const props = defineProps<{ content: string }>()

const wrapperRef = ref<HTMLElement | null>(null)
const rendered = ref('')

// 容器 -> 图表实例
const containerToChart = new WeakMap<HTMLElement, echarts.ECharts>()
let resizeObservers: ResizeObserver[] = []
let domObserver: MutationObserver | null = null

// 复用容器：按代码块文本作为 key，缓存旧容器，渲染新 DOM 时直接搬运，避免闪烁
let codeKeyToContainers = new Map<string, HTMLElement[]>()

function toEchartsOption(input: any) {
  if (!input) return null
  const data = input.chartData || input
  if (data && (data.series || data.dataset || data.xAxis || data.yAxis)) {
    const title = typeof data.title === 'string' ? { text: data.title } : data.title
    const xAxis = Array.isArray(data.xAxis) ? { type: 'category', data: data.xAxis } : data.xAxis || { type: 'category' }
    const yAxis = data.yAxis || { type: 'value' }
    const series = Array.isArray(data.series)
      ? data.series.map((s: any) => ({ type: s?.type || data.chartType || 'line', ...s }))
      : data.series
    return { ...data, title, xAxis, yAxis, series }
  }
  return null
}

// 解析代码块：优先严格 JSON，失败回退宽松（允许函数）
function parseOption(code: string) {
  try {
    return JSON.parse(code)
  } catch (_) {
    try {
      // 仅在受信任来源使用
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ( ${code} )`)
      return fn()
    } catch {
      return null
    }
  }
}

function hideIncomingPreBlocks(root: HTMLElement) {
  const codeNodes = root.querySelectorAll<HTMLPreElement>('pre > code')
  codeNodes.forEach((codeEl) => {
    const cls = codeEl.className || ''
    if (/language-(echarts|chart|json)/.test(cls)) {
      const pre = codeEl.parentElement as HTMLElement
      if (pre && pre.style.visibility !== 'hidden') pre.style.visibility = 'hidden'
    }
  })
}

function cleanup() {
  // 断开所有 ResizeObserver
  resizeObservers.forEach((ro) => { try { ro.disconnect() } catch { /* noop */ } })
  resizeObservers = []
  // 销毁所有实例
  if (wrapperRef.value) {
    wrapperRef.value.querySelectorAll<HTMLElement>('.echarts-slot').forEach((el) => {
      const inst = containerToChart.get(el)
      if (inst) {
        try { inst.dispose() } catch { /* noop */ }
        containerToChart.delete(el)
      }
    })
  }
  if (domObserver) {
    try { domObserver.disconnect() } catch { /* noop */ }
    domObserver = null
  }
  codeKeyToContainers.clear()
}

function collectExistingContainers() {
  codeKeyToContainers.clear()
  if (!wrapperRef.value) return
  wrapperRef.value.querySelectorAll<HTMLElement>('.echarts-slot').forEach((el) => {
    const key = el.dataset.key
    if (!key) return
    const arr = codeKeyToContainers.get(key) || []
    arr.push(el)
    codeKeyToContainers.set(key, arr)
  })
}

function takeReusedContainer(key: string) {
  const arr = codeKeyToContainers.get(key)
  if (arr && arr.length) return arr.shift() as HTMLElement
  return null
}

function upgradeCodeBlocksToCharts() {
  if (!wrapperRef.value) return

  // 查找代码块（语言：echarts/chart/json）
  const codeNodes = wrapperRef.value.querySelectorAll<HTMLPreElement>('pre > code')
  codeNodes.forEach((codeEl) => {
    const cls = codeEl.className || ''
    const isTarget = /language-(echarts|chart|json)/.test(cls)
    if (!isTarget) return

    const pre = codeEl.parentElement as HTMLElement
    if (!pre || pre.parentElement == null) return

    // 已经被替换过则跳过
    if (pre.dataset.upgraded === 'true' || pre.parentElement?.dataset.upgraded === 'true') return

    // 先隐藏，避免闪烁
    pre.style.visibility = 'hidden'

    const raw = (codeEl.textContent || '').trim()
    const parsed = parseOption(raw)
    const option = toEchartsOption(parsed)
    if (!option) {
      pre.style.visibility = ''
      return
    }

    // 复用容器（同一代码块文本复用之前的实例，避免销毁重建）
    let container = takeReusedContainer(raw)
    let chart: echarts.ECharts | undefined

    if (!container) {
      container = document.createElement('div') as HTMLElement
      container.className = 'echarts-slot'
      container.style.width = '100%'
      container.style.height = '400px'
      container.dataset.key = raw

      chart = echarts.init(container)
      containerToChart.set(container, chart)
      const ro = new ResizeObserver(() => chart!.resize())
      ro.observe(container)
      resizeObservers.push(ro)
    } else {
      // 已有实例
      chart = containerToChart.get(container)!
    }

    // 检测是否存在代码块工具栏（常作为 pre 的兄弟节点）
    const parent = pre.parentElement as HTMLElement
    const header = pre.previousElementSibling as HTMLElement | null
    const headerLooksLikeToolbar = !!header && /复制|copy|echarts/i.test(header.textContent || '')

    // 替换目标：优先用包含 header+pre 的父容器，否则替换 pre 自身
    const replaceTarget: HTMLElement = headerLooksLikeToolbar && parent ? parent : pre
    replaceTarget.replaceWith(container)

    chart!.setOption(option, true)

    // 标记升级，避免重复处理
    container.dataset.upgraded = 'true'
  })
}

// rAF 节流，避免流式输出频繁重排导致闪烁
let rafId: number | null = null
async function scheduleProcess() {
  // 收集现有容器，准备复用
  if (wrapperRef.value) collectExistingContainers()

  rendered.value = props.content || ''
  await nextTick()

  // 渲染后先隐藏所有目标 pre，防止过渡闪现
  if (wrapperRef.value) hideIncomingPreBlocks(wrapperRef.value)

  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    upgradeCodeBlocksToCharts()
    rafId = null
  })
}

watch(
  () => props.content,
  () => {
    scheduleProcess()
  },
  { immediate: true }
)

onMounted(() => {
  scheduleProcess()
  // 观察 MdPreview 内部 DOM 变化，自动升级新增的代码块，并先隐藏其 pre
  domObserver = new MutationObserver(() => {
    const root = wrapperRef.value
    if (!root) return
    hideIncomingPreBlocks(root)
    upgradeCodeBlocksToCharts()
  })
  if (wrapperRef.value) {
    domObserver.observe(wrapperRef.value, { childList: true, subtree: true })
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<template>
  <div ref="wrapperRef">
    <MdPreview class="p-0" :model-value="rendered" :auto-fold-threshold="999999" />
  </div>
</template>
