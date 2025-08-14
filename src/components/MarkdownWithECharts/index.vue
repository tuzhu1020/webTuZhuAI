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

// 复用包装器：按代码块文本作为 key，缓存旧 wrapper，渲染新 DOM 时直接搬运，避免闪烁
let codeKeyToWrappers = new Map<string, HTMLElement[]>()

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

// 确保克隆出来的代码块含有原始代码文本与语言类名
function ensureCodeContent(hostEl: HTMLElement, raw: string, cls: string) {
  let code = hostEl.querySelector('pre > code') as HTMLElement | null
  if (!code) code = hostEl.querySelector('code') as HTMLElement | null
  if (!code) {
    const pre = document.createElement('pre')
    code = document.createElement('code')
    pre.appendChild(code)
    hostEl.appendChild(pre)
  }
  if (!code.className) code.className = cls || 'language-echarts'
  // 使用 textContent，保留原始 JSON 文本
  code.textContent = raw
}

function unhideNestedPre(hostEl: HTMLElement) {
  hostEl.querySelectorAll<HTMLElement>('pre, code').forEach((n) => {
    if (n.style.visibility === 'hidden') n.style.visibility = ''
  })
}

function hideIncomingPreBlocks(root: HTMLElement) {
  const codeNodes = root.querySelectorAll<HTMLPreElement>('pre > code')
  codeNodes.forEach((codeEl) => {
    // 跳过我们已经包装过的内容
    if ((codeEl as HTMLElement).closest('.echarts-wrap')) return
    const cls = codeEl.className || ''
    if (/language-(echarts|chart|json)/.test(cls)) {
      const pre = (codeEl as HTMLElement).parentElement as HTMLElement
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
  codeKeyToWrappers.clear()
}

function collectExistingWrappers() {
  codeKeyToWrappers.clear()
  if (!wrapperRef.value) return
  wrapperRef.value.querySelectorAll<HTMLElement>('.echarts-wrap').forEach((el) => {
    const key = el.dataset.key
    if (!key) return
    const arr = codeKeyToWrappers.get(key) || []
    arr.push(el)
    codeKeyToWrappers.set(key, arr)
  })
}

function takeReusedWrapper(key: string) {
  const arr = codeKeyToWrappers.get(key)
  if (arr && arr.length) return arr.shift() as HTMLElement
  return null
}

function createToggleBar(wrapper: HTMLElement, chartContainer: HTMLElement, codePre: HTMLElement) {
  const bar = document.createElement('div')
  bar.className = 'echarts-toggle'
  bar.style.display = 'flex'
  bar.style.justifyContent = 'flex-end'
  bar.style.marginTop = '8px'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = '查看代码'
  btn.style.cursor = 'pointer'
  btn.style.fontSize = '12px'
  btn.style.padding = '2px 8px'
  btn.style.border = '1px solid #ddd'
  btn.style.borderRadius = '6px'
  btn.style.background = 'var(--label-bg-color, #f7f7f7)'

  btn.addEventListener('click', () => {
    const showingCode = codePre.style.display !== 'none'
    if (showingCode) {
      // 切回图表
      codePre.style.display = 'none'
      chartContainer.style.display = ''
      const chart = containerToChart.get(chartContainer)
      chart && chart.resize()
      btn.textContent = '查看代码'
    } else {
      // 显示代码
      chartContainer.style.display = 'none'
      codePre.style.display = ''
      btn.textContent = '查看图表'
    }
  })

  bar.appendChild(btn)
  wrapper.appendChild(bar)
}

function upgradeCodeBlocksToCharts() {
  if (!wrapperRef.value) return

  // 查找代码块（语言：echarts/chart/json）
  const codeNodes = wrapperRef.value.querySelectorAll<HTMLPreElement>('pre > code')
  codeNodes.forEach((codeEl) => {
    // 跳过我们已经包装过的内容
    if ((codeEl as HTMLElement).closest('.echarts-wrap')) return
    const cls = (codeEl.className || 'language-echarts') as string
    const isTarget = /language-(echarts|chart|json)/.test(cls)
    if (!isTarget) return

    const pre = (codeEl as HTMLElement).parentElement as HTMLElement
    if (!pre || pre.parentElement == null) return

    // 已经被替换过则跳过
    if (pre.dataset.upgraded === 'true' || pre.parentElement?.dataset.upgraded === 'true') return

    // 先隐藏，避免闪烁
    pre.style.visibility = 'hidden'

    const raw = ((codeEl as HTMLElement).textContent || '').trim()
    const parsed = parseOption(raw)
    const option = toEchartsOption(parsed)
    if (!option) {
      pre.style.visibility = ''
      return
    }

    // 尝试复用 wrapper
    let wrapper = takeReusedWrapper(raw)

    // 检测是否存在代码块工具栏（常作为 pre 的兄弟节点）
    const parent = pre.parentElement as HTMLElement
    const header = pre.previousElementSibling as HTMLElement | null
    const headerLooksLikeToolbar = !!header && /复制|copy|echarts/i.test(header.textContent || '')

    if (!wrapper) {
      // 构建 wrapper
      wrapper = document.createElement('div') as HTMLElement
      wrapper.className = 'echarts-wrap'
      wrapper.style.width = '100%'
      wrapper.dataset.key = raw

      // 图表容器
      const container = document.createElement('div') as HTMLElement
      container.className = 'echarts-slot'
      container.style.width = '100%'
      container.style.height = '400px'

      // 克隆代码块（保留样式结构：优先克隆 header+pre 的父容器）
      let codeClone: HTMLElement
      if (headerLooksLikeToolbar && parent) {
        codeClone = parent.cloneNode(true) as HTMLElement
      } else {
        codeClone = pre.cloneNode(true) as HTMLElement
      }
      // 解除克隆内层 pre/code 的隐藏可见性
      unhideNestedPre(codeClone)
      codeClone.style.visibility = ''
      codeClone.style.display = 'none'
      // 确保代码文本存在
      ensureCodeContent(codeClone, raw, cls)

      // 初始化实例
      let chart = containerToChart.get(container)
      if (!chart) {
        chart = echarts.init(container)
        containerToChart.set(container, chart)
        const ro = new ResizeObserver(() => chart!.resize())
        ro.observe(container)
        resizeObservers.push(ro)
      }

      wrapper.appendChild(container)
      wrapper.appendChild(codeClone)
      createToggleBar(wrapper, container, codeClone)
    } else {
      // 复用 wrapper 时也确保代码文本存在并解除隐藏
      ensureCodeContent(wrapper, raw, cls)
      unhideNestedPre(wrapper)
    }

    // 替换目标：优先用包含 header+pre 的父容器，否则替换 pre 自身
    const replaceTarget: HTMLElement = headerLooksLikeToolbar && parent ? parent : pre
    replaceTarget.replaceWith(wrapper)

    // 设置图表配置
    const container = wrapper.querySelector<HTMLElement>('.echarts-slot')!
    const chart = containerToChart.get(container)!
    chart.setOption(option, true)

    // 标记升级，避免重复处理
    wrapper.dataset.upgraded = 'true'
  })
}

// rAF 节流，避免流式输出频繁重排导致闪烁
let rafId: number | null = null
async function scheduleProcess() {
  // 收集现有 wrapper，准备复用
  if (wrapperRef.value) collectExistingWrappers()

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
