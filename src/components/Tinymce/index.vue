
<template>
  <div class="edit-box">
    <Editor
      :id="editorId"
      v-model="content"
      :init="editorConfig"
      :tinymce-script-src="'/tinymce/tinymce.min.js'"
      @init="handleEditorInit"
      @input="handleInput"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import tinymce from 'tinymce/tinymce'
import { marked } from 'marked'
import { useAiChat } from '@/composables/useAiChat'

// Word 导入/导出支持
import mammoth from 'mammoth/mammoth.browser'

const props = defineProps({
  modelValue: String,
  readonly: Boolean,
  height: { type: [String, Number], default: '100%' },
  width: { type: [String, Number], default: '100%' },
  fileSizes: { type: Number, default: 10 },
  init: { type: Object, default: () => ({}) }
})
const emits = defineEmits(['update:modelValue', 'change', 'input'])

const editorId = ref(`tinymce-${Date.now()}`)
const content = ref('')
let editorInstance = null
const polishing = ref(false)
const { polishText } = useAiChat()
// Markdown 转 HTML（与页面保持一致）
function mdToHtml(markdown) {
    if (!markdown) return ''
    marked.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false })
    return marked.parse(markdown)
}

// AI 润色选中文本
async function aiPolishSelected() {
    if (polishing.value || !editorInstance) return
    const selText = editorInstance.selection.getContent({ format: 'text' }) || ''
    const selHtml = editorInstance.selection.getContent({ format: 'html' }) || ''
    if (!selText.trim()) {
        editorInstance.notificationManager.open({ text: '请先选中文本再使用 AI 润色', type: 'warning', timeout: 2000 })
        return
    }
    polishing.value = true

    // 用容器包裹选区：上方为原文（黄色背景），下方为新文占位（绿色背景），底部是选择按钮
    const markerId = `ai-polish-${Date.now()}`
    const wrapperHtml = `
      <div data-ai-polish-wrapper="${markerId}" style="border:1px dashed #94a3b8;padding:8px;border-radius:6px;margin:6px 0;background:#f8fafc;">
        <div data-ai-polish-original style="background:#fff7ed;border:1px solid #fdba74;padding:6px;border-radius:4px;">
          ${selHtml}
        </div>
        <div data-ai-polish-new style="background:#ecfeff;border:1px solid #67e8f9;padding:6px;border-radius:4px;margin-top:8px;">
          <span data-ai-polish="${markerId}">AI 润色中...</span>
        </div>
        <div data-ai-polish-actions style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;">
          <button data-ai-choose="orig" style="padding:4px 10px;border:1px solid #cbd5e1;border-radius:4px;background:#ffffff;color:#334155;cursor:pointer;">保留原文</button>
          <button data-ai-choose="new" style="padding:4px 10px;border:1px solid #22c55e;border-radius:4px;background:#22c55e;color:#ffffff;cursor:pointer;">采用新文</button>
        </div>
      </div>`
    editorInstance.selection.setContent(wrapperHtml)

    const sessionId = `tinymce-polish-${Date.now()}`
    const model = 'deepseek-chat'

    // 绑定选择按钮事件（仅作用于当前 wrapper）
    const doc = editorInstance.getDoc()
    const wrapper = doc && doc.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
    if (wrapper) {
      const onChoose = (e) => {
        e.preventDefault(); e.stopPropagation();
        const target = e.currentTarget as HTMLElement
        const type = target?.getAttribute('data-ai-choose')
        const orig = wrapper.querySelector('div[data-ai-polish-original]') as HTMLElement
        const neu = wrapper.querySelector('div[data-ai-polish-new]') as HTMLElement
        let replaceWith = type === 'orig' ? (orig?.innerHTML || '') : (neu?.innerHTML || '')

        if (type === 'new') {
          const hasSingleChild = !!orig && orig.childElementCount === 1
          if (hasSingleChild) {
            // 单一元素：直接克隆该元素，保留其标签与属性
            const styleRefEl = orig.firstElementChild as HTMLElement
            if (styleRefEl && replaceWith) {
              const cloned = styleRefEl.cloneNode(false) as HTMLElement
              // 预留原有锚点/书签等不可见节点（如 <a id> 或 <a name>）
              const preserved = Array.from(styleRefEl.childNodes).filter((n: any) => {
                if (n.nodeType !== 1) return false
                const el = n as HTMLElement
                const tag = el.tagName.toLowerCase()
                return tag === 'a' && (el.id || el.getAttribute('name'))
              }) as HTMLElement[]
              cloned.innerHTML = ''
              preserved.forEach((a) => cloned.appendChild(a.cloneNode(true)))
              // 将 AI 内容注入
              const doc = wrapper.ownerDocument!
              const tmp = doc.createElement('div')
              tmp.innerHTML = replaceWith
              // 去除与 preserved 重复的锚点
              if (preserved.length) {
                const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                  const id = (el.getAttribute('id') || '').trim()
                  const nm = (el.getAttribute('name') || '').trim()
                  if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el)
                })
              }
              while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
              replaceWith = cloned.outerHTML
            }
          } else {
            // 多元素或混合节点：尽量按原子元素结构逐一映射，保留原标签与属性
            const docView = wrapper.ownerDocument?.defaultView
            const doc = wrapper.ownerDocument
            if (doc && replaceWith) {
              const tmp = doc.createElement('div')
              tmp.innerHTML = replaceWith
              // 1) 去除 AI 返回中可能夹带的我们临时 wrapper（解包而非保留，以免把背景/边框带入）
              const unwrapList = tmp.querySelectorAll('[data-ai-polish-wrapper], [data-ai-polish-original], [data-ai-polish-new], [data-ai-polish-actions]')
              unwrapList.forEach((el) => {
                const parent = el.parentNode
                if (!parent) return
                while (el.firstChild) parent.insertBefore(el.firstChild, el)
                parent.removeChild(el)
              })
              // 2) 去掉开头可能出现的“新问：”等提示性文本
              while (tmp.firstChild && tmp.firstChild.nodeType === 3) { // TEXT_NODE
                const t = tmp.firstChild.textContent || ''
                const cleaned = t.replace(/^\s*新问[:：]\s*/i, '').replace(/^\s*新文[:：]\s*/i, '')
                if (cleaned.length === t.length) {
                  // 没有“新问：”前缀，停止
                  break
                }
                if (cleaned) tmp.firstChild.textContent = cleaned
                else tmp.removeChild(tmp.firstChild)
              }
              const newChildren = Array.from(tmp.children)
              const origChildren = Array.from(orig.children) as HTMLElement[]

              if (newChildren.length && origChildren.length) {
                // 构建原元素锚点索引
                const anchorToIndex = new Map<string, number>()
                origChildren.forEach((oc, idx) => {
                  Array.from(oc.querySelectorAll('a[id], a[name]')).forEach((a: Element) => {
                    const id = (a.getAttribute('id') || '').trim()
                    const nm = (a.getAttribute('name') || '').trim()
                    if (id) anchorToIndex.set(`id:${id}`, idx)
                    if (nm) anchorToIndex.set(`name:${nm}`, idx)
                  })
                })
                const taken = new Set<number>()
                const mapped = new Array(origChildren.length).fill('') as string[]
                let cursor = 0

                const takeNextAvailable = (start: number) => {
                  for (let k = start; k < origChildren.length; k++) if (!taken.has(k)) return k
                  return -1
                }

                const assignToIndex = (targetIdx: number, htmlFragment: string) => {
                  if (targetIdx < 0 || targetIdx >= origChildren.length) return
                  const ref = origChildren[targetIdx]
                  const clone = ref.cloneNode(false) as HTMLElement
                  // 保留原锚点
                  const preserved = Array.from(ref.childNodes).filter((n: any) => {
                    if (n.nodeType !== 1) return false
                    const el = n as HTMLElement
                    const tag = el.tagName.toLowerCase()
                    return tag === 'a' && (el.id || el.getAttribute('name'))
                  }) as HTMLElement[]
                  clone.innerHTML = ''
                  preserved.forEach((a) => clone.appendChild(a.cloneNode(true)))
                  const tmpNeu = ref.ownerDocument!.createElement('div')
                  tmpNeu.innerHTML = htmlFragment
                  if (preserved.length) {
                    const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                    const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                    tmpNeu.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                      const id = (el.getAttribute('id') || '').trim()
                      const nm = (el.getAttribute('name') || '').trim()
                      if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el)
                    })
                  }
                  while (tmpNeu.firstChild) clone.appendChild(tmpNeu.firstChild)
                  mapped[targetIdx] = clone.outerHTML
                  taken.add(targetIdx)
                  if (targetIdx >= cursor) cursor = targetIdx + 1
                }
                
                // 遍历新块，按锚点/顺序映射，并处理首个 <br> 合并拆分
                for (let n = 0; n < newChildren.length; n++) {
                  const neu = newChildren[n] as HTMLElement
                  const rawHtml = neu.innerHTML || neu.textContent || ''
                  // 优先锚点匹配
                  let targetIdx = -1
                  Array.from(neu.querySelectorAll('a[id], a[name]')).some((a: Element) => {
                    const id = (a.getAttribute('id') || '').trim()
                    const nm = (a.getAttribute('name') || '').trim()
                    if (id && anchorToIndex.has(`id:${id}`)) {
                      const idx = anchorToIndex.get(`id:${id}`)!
                      if (!taken.has(idx)) { targetIdx = idx; return true }
                    }
                    if (nm && anchorToIndex.has(`name:${nm}`)) {
                      const idx = anchorToIndex.get(`name:${nm}`)!
                      if (!taken.has(idx)) { targetIdx = idx; return true }
                    }
                    return false
                  })

                  // <br> 拆分（仅处理首个）
                  const brPos = rawHtml.indexOf('<br')
                  if (brPos >= 0) {
                    const close = rawHtml.indexOf('>', brPos)
                    const head = rawHtml.slice(0, brPos)
                    const tail = rawHtml.slice(close + 1)
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, head)
                    // 第二段锚点优先
                    let idx2 = -1
                    const tmpTail = orig.ownerDocument!.createElement('div')
                    tmpTail.innerHTML = tail
                    Array.from(tmpTail.querySelectorAll('a[id], a[name]')).some((a: Element) => {
                      const id = (a.getAttribute('id') || '').trim()
                      const nm = (a.getAttribute('name') || '').trim()
                      if (id && anchorToIndex.has(`id:${id}`)) {
                        const idx = anchorToIndex.get(`id:${id}`)!
                        if (!taken.has(idx)) { idx2 = idx; return true }
                      }
                      if (nm && anchorToIndex.has(`name:${nm}`)) {
                        const idx = anchorToIndex.get(`name:${nm}`)!
                        if (!taken.has(idx)) { idx2 = idx; return true }
                      }
                      return false
                    })
                    if (idx2 < 0) idx2 = takeNextAvailable(Math.max(cursor, (targetIdx >= 0 ? targetIdx + 1 : 0)))
                    if (idx2 >= 0) assignToIndex(idx2, tail)
                    continue
                  }

                  if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                  if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                }

                replaceWith = mapped.join('')
              } else if (docView) {
                // 兜底：用原容器的计算样式生成一个 div 承载新内容（仅排版相关样式）
                const cs = docView.getComputedStyle(orig)
                const styleMap: Record<string, string> = {
                  'font-family': cs.fontFamily,
                  'font-size': cs.fontSize,
                  'font-weight': cs.fontWeight,
                  'font-style': cs.fontStyle,
                  'line-height': cs.lineHeight,
                  'color': cs.color,
                  'text-decoration': (cs as any).textDecorationLine || ''
                }
                const styleStr = Object.entries(styleMap)
                  .filter(([, v]) => v && v !== 'normal' && v !== '400')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('; ')
                replaceWith = `<div style="${styleStr}">${replaceWith}</div>`
              }
            }
          }
        }

        // 用用户选择的内容替换整个容器（不保留任何临时高亮/背景）
        if (replaceWith) wrapper.outerHTML = replaceWith
        else wrapper.outerHTML = orig?.innerHTML || ''
      }
      const btnOrig = wrapper.querySelector('button[data-ai-choose="orig"]')
      const btnNew = wrapper.querySelector('button[data-ai-choose="new"]')
      btnOrig && btnOrig.addEventListener('click', onChoose, { once: true })
      btnNew && btnNew.addEventListener('click', onChoose, { once: true })
    }

    try {
        await polishText(selText, {
          sessionId,
          model,
          onDelta: ({ chatMessageList }) => {
            const last = chatMessageList[chatMessageList.length - 1]
            const md = last?.choices?.[0]?._content || ''
            const html = mdToHtml(md)
            const doc2 = editorInstance.getDoc()
            const wrap2 = doc2 && doc2.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
            const newBlock2 = wrap2 && wrap2.querySelector('div[data-ai-polish-new]') as HTMLElement
            const orig2 = wrap2 && wrap2.querySelector('div[data-ai-polish-original]') as HTMLElement
            if (newBlock2 && orig2) {
              let preview = html || selText
              // 清洗 AI 输出的临时包装与前缀
              const tmp = doc2.createElement('div')
              tmp.innerHTML = preview
              const unwrapList = tmp.querySelectorAll('[data-ai-polish-wrapper], [data-ai-polish-original], [data-ai-polish-new], [data-ai-polish-actions]')
              unwrapList.forEach((el) => {
                const parent = el.parentNode
                if (!parent) return
                while (el.firstChild) parent.insertBefore(el.firstChild, el)
                parent.removeChild(el)
              })
              while (tmp.firstChild && tmp.firstChild.nodeType === 3) {
                const t = tmp.firstChild.textContent || ''
                const cleaned = t.replace(/^\s*新问[:：]\s*/i, '').replace(/^\s*新文[:：]\s*/i, '')
                if (cleaned.length === t.length) break
                if (cleaned) tmp.firstChild.textContent = cleaned
                else tmp.removeChild(tmp.firstChild)
              }

              // 生成与“采用新文”一致的结构化预览
              const hasSingleChild = !!orig2 && orig2.childElementCount === 1
              if (hasSingleChild) {
                const styleRefEl = orig2.firstElementChild as HTMLElement
                if (styleRefEl) {
                  const cloned = styleRefEl.cloneNode(false) as HTMLElement
                  // 保留锚点
                  const preserved = Array.from(styleRefEl.childNodes).filter((n: any) => {
                    if (n.nodeType !== 1) return false
                    const el = n as HTMLElement
                    const tag = el.tagName.toLowerCase()
                    return tag === 'a' && (el.id || el.getAttribute('name'))
                  }) as HTMLElement[]
                  cloned.innerHTML = ''
                  preserved.forEach((a) => cloned.appendChild(a.cloneNode(true)))
                  // 去除与 preserved 重复的锚点
                  if (preserved.length) {
                    const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                    const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                    tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                      const id = (el.getAttribute('id') || '').trim()
                      const nm = (el.getAttribute('name') || '').trim()
                      if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el)
                    })
                  }
                  while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
                  newBlock2.innerHTML = cloned.outerHTML
                } else {
                  newBlock2.innerHTML = tmp.innerHTML
                }
              } else {
                const newChildren = Array.from(tmp.children)
                const origChildren = Array.from(orig2.children) as HTMLElement[]
                if (newChildren.length && origChildren.length) {
                  // 构建原元素锚点索引
                  const anchorToIndex = new Map<string, number>()
                  origChildren.forEach((oc, idx) => {
                    Array.from(oc.querySelectorAll('a[id], a[name]')).forEach((a: Element) => {
                      const id = (a.getAttribute('id') || '').trim()
                      const nm = (a.getAttribute('name') || '').trim()
                      if (id) anchorToIndex.set(`id:${id}`, idx)
                      if (nm) anchorToIndex.set(`name:${nm}`, idx)
                    })
                  })
                  const taken = new Set<number>()
                  const mapped = new Array(origChildren.length).fill('') as string[]
                  let cursor = 0

                  const takeNextAvailable = (start: number) => {
                    for (let k = start; k < origChildren.length; k++) if (!taken.has(k)) return k
                    return -1
                  }

                  const assignToIndex = (targetIdx: number, htmlFragment: string) => {
                    if (targetIdx < 0 || targetIdx >= origChildren.length) return
                    const ref = origChildren[targetIdx]
                    const clone = ref.cloneNode(false) as HTMLElement
                    // 保留原锚点
                    const preserved = Array.from(ref.childNodes).filter((n: any) => {
                      if (n.nodeType !== 1) return false
                      const el = n as HTMLElement
                      const tag = el.tagName.toLowerCase()
                      return tag === 'a' && (el.id || el.getAttribute('name'))
                    }) as HTMLElement[]
                    clone.innerHTML = ''
                    preserved.forEach((a) => clone.appendChild(a.cloneNode(true)))
                    const tmpNeu = ref.ownerDocument!.createElement('div')
                    tmpNeu.innerHTML = htmlFragment
                    if (preserved.length) {
                      const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                      const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                      tmpNeu.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                        const id = (el.getAttribute('id') || '').trim()
                        const nm = (el.getAttribute('name') || '').trim()
                        if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el)
                      })
                    }
                    while (tmpNeu.firstChild) clone.appendChild(tmpNeu.firstChild)
                    mapped[targetIdx] = clone.outerHTML
                    taken.add(targetIdx)
                    if (targetIdx >= cursor) cursor = targetIdx + 1
                  }

                  for (let n = 0; n < newChildren.length; n++) {
                    const neu = newChildren[n] as HTMLElement
                    const rawHtml = neu.innerHTML || neu.textContent || ''
                    // 优先锚点匹配
                    let targetIdx = -1
                    Array.from(neu.querySelectorAll('a[id], a[name]')).some((a: Element) => {
                      const id = (a.getAttribute('id') || '').trim()
                      const nm = (a.getAttribute('name') || '').trim()
                      if (id && anchorToIndex.has(`id:${id}`)) {
                        const idx = anchorToIndex.get(`id:${id}`)!
                        if (!taken.has(idx)) { targetIdx = idx; return true }
                      }
                      if (nm && anchorToIndex.has(`name:${nm}`)) {
                        const idx = anchorToIndex.get(`name:${nm}`)!
                        if (!taken.has(idx)) { targetIdx = idx; return true }
                      }
                      return false
                    })

                    // <br> 拆分
                    const brPos = rawHtml.indexOf('<br')
                    if (brPos >= 0) {
                      const close = rawHtml.indexOf('>', brPos)
                      const head = rawHtml.slice(0, brPos)
                      const tail = rawHtml.slice(close + 1)
                      if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                      if (targetIdx >= 0) assignToIndex(targetIdx, head)
                      // 第二段锚点优先
                      let idx2 = -1
                      const tmpTail = orig2.ownerDocument!.createElement('div')
                      tmpTail.innerHTML = tail
                      Array.from(tmpTail.querySelectorAll('a[id], a[name]')).some((a: Element) => {
                        const id = (a.getAttribute('id') || '').trim()
                        const nm = (a.getAttribute('name') || '').trim()
                        if (id && anchorToIndex.has(`id:${id}`)) {
                          const idx = anchorToIndex.get(`id:${id}`)!
                          if (!taken.has(idx)) { idx2 = idx; return true }
                        }
                        if (nm && anchorToIndex.has(`name:${nm}`)) {
                          const idx = anchorToIndex.get(`name:${nm}`)!
                          if (!taken.has(idx)) { idx2 = idx; return true }
                        }
                        return false
                      })
                      if (idx2 < 0) idx2 = takeNextAvailable(Math.max(cursor, (targetIdx >= 0 ? targetIdx + 1 : 0)))
                      if (idx2 >= 0) assignToIndex(idx2, tail)
                      continue
                    }

                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                  }

                  newBlock2.innerHTML = mapped.join('')
                } else {
                  // 兜底：应用原容器的排版样式
                  const view = wrap2.ownerDocument?.defaultView
                  if (view) {
                    const cs = view.getComputedStyle(orig2)
                    const styleMap: Record<string, string> = {
                      'font-family': cs.fontFamily,
                      'font-size': cs.fontSize,
                      'font-weight': cs.fontWeight,
                      'font-style': cs.fontStyle,
                      'line-height': cs.lineHeight,
                      'color': cs.color,
                      'text-decoration': (cs as any).textDecorationLine || ''
                    }
                    const styleStr = Object.entries(styleMap)
                      .filter(([, v]) => v && v !== 'normal' && v !== '400')
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('; ')
                    newBlock2.innerHTML = `<div style="${styleStr}">${tmp.innerHTML}</div>`
                  } else {
                    newBlock2.innerHTML = tmp.innerHTML
                  }
                }
              }
            }
          },
          onDone: () => {
            polishing.value = false
            editorInstance.notificationManager.open({ text: 'AI 润色完成，请选择采用哪一版', type: 'info', timeout: 2000 })
          }
        },'公文','润色')
    } catch (e) {
        console.error(e)
        // 失败时仅提示，用户仍可选择保留原文
        const doc = editorInstance.getDoc()
        const newBlock = doc && doc.querySelector(`div[data-ai-polish-wrapper="${markerId}"] div[data-ai-polish-new]`)
        if (newBlock) {
          newBlock.innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px;border-radius:4px;">AI 润色失败，请稍后重试。</div>`
        }
        polishing.value = false
        editorInstance.notificationManager.open({ text: 'AI 润色失败，请稍后重试', type: 'error', timeout: 2000 })
    }
}
// 滚动到底部
function scrollToBottom() {
  if (!editorInstance) return
  
  try {
    const body = editorInstance.getBody()
    if (body) {
      // 方法1: 滚动到文档底部
      body.scrollTop = body.scrollHeight
      
      // 方法2: 如果方法1不生效，尝试滚动到最后一个元素
      const lastElement = body.lastElementChild
      if (lastElement) {
        lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
      
      // 方法3: 设置光标到最后位置（确保可见）
      editorInstance.selection.select(body, true)
      editorInstance.selection.collapse(false)
    }
  } catch (error) {
    console.warn('滚动到底部失败:', error)
  }
}

// 暴露滚动方法给父组件
defineExpose({
  scrollToBottom,
  getEditor: () => editorInstance
})

// 图片上传处理
function handleImageUpload(blobInfo, success, failure) {
  if (blobInfo.blob().size > props.fileSizes * 1024 * 1024) {
    return failure(`文件大小不能超过 ${props.fileSizes}MB`)
  }
  failure('上传功能未实现')
}

// Word 导入处理
async function handleImportWord() {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml(
        {
          arrayBuffer,
          convertImage: mammoth.images.inline(async (element) => ({
            src: 'data:' + element.contentType + ';base64,' + await element.read('base64')
          }))
        },
        {
          includeDefaultStyleMap: true,
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Normal'] => p:fresh",
            'table => table.docx-table'
          ].join('\n')
        }
      )
      const html = result.value || ''
      if (editorInstance) {
        editorInstance.setContent(html)
      }
    }
    input.click()
  } catch (err) {
    console.error('导入 Word 失败:', err)
  }
}

// Word 导出处理
async function handleExportWord() {
  if (!editorInstance) return
  const bodyHtml = editorInstance.getContent()
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title></head><body>${bodyHtml}</body></html>`
  try {
    const mod = await import('html-to-docx')
    const htmlToDocx = mod.default || mod
    const buffer = await htmlToDocx(fullHtml)
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'document.docx'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
    a.remove()
  } catch (err) {
    console.warn('html-to-docx 导出失败，使用 .doc 回退方案:', err)
    const blob = new Blob([fullHtml], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'document.doc'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
    a.remove()
  }
}

// 清空内容
function handleClearContent() {
  if (!editorInstance) return
  const ok = window.confirm('确定要清空编辑器内容吗？此操作不可撤销。')
  if (!ok) return
  editorInstance.setContent('')
  emits('update:modelValue', '')
}

// 编辑器设置回调
function handleEditorSetup(editor) {
  editorInstance = editor
  
  // 添加自定义按钮
  editor.ui.registry.addButton('aiPolish', {
    text: 'AI润色',
    tooltip: '使用 AI 润色所选文本',
    onAction: aiPolishSelected
  })
  editor.ui.registry.addButton('importword', {
    text: '导入Word',
    tooltip: '从 .docx 导入',
    onAction: handleImportWord
  })
  
  editor.ui.registry.addButton('exportword', {
    text: '导出Word',
    tooltip: '导出为 .docx',
    onAction: handleExportWord
  })
  
//   editor.ui.registry.addButton('clearcontent', {
//     text: '清空',
//     tooltip: '清空编辑器内容',
//     onAction: handleClearContent
//   })
  
  // 添加菜单项
  editor.ui.registry.addMenuItem('importword', {
    text: '导入Word(.docx)',
    onAction: handleImportWord
  })
  
  editor.ui.registry.addMenuItem('exportword', {
    text: '导出为Word(.docx)',
    onAction: handleExportWord
  })
  
  // 自定义状态栏元素（左侧提示 + 右侧字数）
  let leftStatusEl = null
  let rightStatusEl = null

  // 编辑器初始化完成事件
  editor.on('init', () => {
    editor.setContent(props.modelValue || '')
    const statusbar = editor.getContainer && editor.getContainer().querySelector('.tox-statusbar')
    if (statusbar && (!leftStatusEl || !rightStatusEl)) {
      // 左侧固定提示
      if (!leftStatusEl) {
        leftStatusEl = document.createElement('div')
        leftStatusEl.className = 'tox-statusbar__text'
        leftStatusEl.style.whiteSpace = 'nowrap'
        leftStatusEl.textContent = '以上内容由AI生成，仅供参考，请自行判断'
        statusbar.insertBefore(leftStatusEl, statusbar.firstChild)
      }
      // 右侧字数统计
      if (!rightStatusEl) {
        rightStatusEl = document.createElement('div')
        rightStatusEl.className = 'tox-statusbar__text'
        rightStatusEl.style.marginLeft = 'auto'
        rightStatusEl.style.whiteSpace = 'nowrap'
        statusbar.appendChild(rightStatusEl)
      }
      const update = () => {
        const txt = editor.getContent({ format: 'text' }) || ''
        const count = (txt.replace(/\s+/g, '')).length
        rightStatusEl.textContent = `字数：${count}`
      }
      update()
      editor.on('change keyup setcontent', update)
      editor.once('remove', () => editor.off('change keyup setcontent', update))
    }

    // 劫持“帮助”弹窗：仅显示快捷键/键盘指引，隐藏 插件/版本/关于
    try {
      const container = editor.getContainer && editor.getContainer()
      if (container) {
        // 每个帮助对话框只处理一次，避免用户切换 Tab 时被再次强制切回
        const processedHelpDlgs = new WeakSet()
        const mo = new MutationObserver(() => {
          const doc = container.ownerDocument
          const dialogs = doc.querySelectorAll('.tox-dialog')
          dialogs.forEach((dlg) => {
            const titleEl = dlg.querySelector('.tox-dialog__title')
            const title = titleEl ? (titleEl.textContent || '') : ''
            if (!/帮助|Help/i.test(title)) return
            if (processedHelpDlgs.has(dlg)) return

            // 兼容不同结构：收集所有 tab 按钮
            const tabButtons = dlg.querySelectorAll('[role="tab"], .tox-tab, .tox-dialog__body-nav button')
            let shortcutsTabButton = null
            tabButtons.forEach((btn) => {
              const text = (btn.textContent || '').trim()
              if (/快捷键|Shortcuts|键盘|Keyboard/i.test(text)) {
                // 若同时出现“快捷键/键盘指引”，优先匹配“快捷键/Shortcuts”
                if (!shortcutsTabButton || /快捷键|Shortcuts/.test(text)) {
                  shortcutsTabButton = btn
                }
              }
            })

            // 仅当目标 Tab 未激活，且当前也不存在已激活的“快捷键/键盘”Tab 时，再尝试点击
            const isActive = (btn) => btn && (
              btn.getAttribute('aria-selected') === 'true' || btn.classList.contains('tox-tab--active')
            )
            const anyShortcutActive = Array.from(tabButtons).some((btn) => {
              const t = (btn.textContent || '').trim()
              return (/快捷键|Shortcuts|键盘|Keyboard/i.test(t)) && isActive(btn)
            })
            if (!anyShortcutActive && shortcutsTabButton && typeof shortcutsTabButton.click === 'function' && !isActive(shortcutsTabButton)) {
              // 延迟到下一个宏任务，确保对话框内部完成初次布局
              setTimeout(() => shortcutsTabButton.click(), 0)
            }

            // 隐藏插件/版本/关于 Tab 及其面板
            const removeKeywords = ['插件', 'Plugins', '版本', 'Version', '关于', 'About']
            tabButtons.forEach((btn) => {
              const text = (btn.textContent || '').trim()
              if (removeKeywords.some(k => text === k || text.includes(k))) {
                // 隐藏 Tab 按钮
                btn.style.display = 'none'
                // 隐藏对应面板
                const targetId = btn.getAttribute('aria-controls') || (btn.getAttribute('href') || '').replace('#','')
                if (targetId) {
                  const panel = dlg.querySelector(`#${CSS.escape(targetId)}`)
                  if (panel) panel.style.display = 'none'
                }
              }
            })

            // 标记为已处理，允许用户自由切换剩余 Tab
            processedHelpDlgs.add(dlg)
          })
        })
        mo.observe(container.ownerDocument.body, { childList: true, subtree: true })
        editor.once('remove', () => mo.disconnect())
      }
    } catch (e) {
      // 安静失败
    }
  })
  
  // 内容变化事件
  editor.on('change keyup undo redo', () => {
    const newContent = editor.getContent()
    content.value = newContent
    emits('update:modelValue', newContent)
  })

  // 变化时同步外部 v-model（保持不变）
}

// 编辑器配置
const editorConfig = computed(() => ({
  // 先合并外部传入，但下方关键项会强制覆盖，避免被外部配置破坏
  ...props.init,
  // 基础配置（强制覆盖）
  height: props.height,
  width: props.width,
  language: 'zh-CN',
  
  // 使用本地资源
  base_url: '/tinymce',
  suffix: '.min',
  language_url: '/tinymce/tinymce-i18n/langs8/zh-CN.js',
  license_key: 'gpl',
  // 关键：确保处于离线（自托管）模式，避免加载 licensekeymanager
  api_key: null,
  promotion: false,
  branding: false,
  toolbar_mode: 'wrap',
  toolbar_sticky: true,
  // 选区悬浮工具条，加入 AI润色
  quickbars_selection_toolbar: 'bold italic underline | aiPolish | forecolor backcolor | link',
  
  // 工具栏配置 - 中文界面（兼容 TinyMCE 5/6：同时包含旧/新控件名）
  toolbar: [
    // 文本相关（样式/字体/字号/行高/基础样式/颜色/清除）
    'undo redo | blocks formatselect | fontfamily fontselect | fontsize fontsizeselect | lineheight | bold italic underline strikethrough | forecolor backcolor removeformat',
    // 段落与列表/对齐
    'alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist',
    // 查找替换
    'searchreplace',
    // 插入与媒体/表格
    'link image media table | charmap emoticons',
    // 查看与辅助
    'code preview fullscreen help',
    // 自定义：导入导出/清空
    'importword exportword clearcontent',
    // 额外：文件/编辑类（若无效可移除）
    'print save saveas cancel new edit delete cut copy pasteword selectall'
  ].join(' | '),
  
  // 菜单栏配置
  menubar: 'file edit view insert format tools table help',
  
  // 插件配置
  plugins: [
    'advlist', 'anchor', 'autolink', 'autosave',
    'charmap', 'code', 'codesample', 'directionality', 'emoticons',
    'fullscreen', 'help', 'image', 'importcss', 'insertdatetime',
    'link', 'lists', 'media', 'nonbreaking', 'pagebreak', 'preview',
    'quickbars', 'save', 'searchreplace', 'table', 'visualblocks',
    'visualchars'
  ],
  
  // 字体配置
    font_family_formats: '微软雅黑=Microsoft YaHei;宋体=SimSun;黑体=SimHei;仿宋=FangSong;楷体=KaiTi;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva',
  
    font_size_formats: [
        '初号=42pt',
        '小初=36pt',
        '一号=26pt',
        '小一=24pt',
        '二号=22pt',
        '小二=18pt',
        '三号=16pt',
        '小三=15pt',
        '四号=14pt',
        '小四=12pt',
        '五号=10.5pt',
        '小五=9pt',
        '六号=7.5pt',
        '小六=6.5pt',
        '七号=5.5pt',
        '八号=5pt',
        // 追加常见 pt 值
        '5pt 5.5pt 6pt 6.5pt 7pt 8pt 8.5pt 9pt 9.5pt 10pt 10.5pt 11pt 12pt 14pt 15pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 42pt 48pt 56pt 64pt 72pt 80pt 88pt 96pt 104pt 112pt'
    ].join(' '),
  
  // 行高配置
  line_height_formats: '1 1.2 1.4 1.6 1.8 2.0 2.5 3.0',
  
  // 其他配置
  readonly: false, // 确保编辑器可编辑
  convert_urls: false,
  paste_data_images: true,
  statusbar: true,
  resize: false,
  object_resizing: false,
  table_resize_bars: false,
  elementpath: false,
  
  // 图片上传配置
  images_upload_handler: handleImageUpload,
  
  // 内容样式
  content_style: `
    body { font-family: Microsoft YaHei, Arial, sans-serif; font-size: 14px; line-height: 1.6; overflow: auto; }
    table { border-collapse: collapse; width: 100%; }
    table td, table th { border: 1px solid #ccc; padding: 6px; }
    img { -webkit-user-drag: none; user-drag: none; }
    pre { background: #f7f7f7; padding: 10px; border-radius: 6px; }
    /* 鼠标选中文本：背景浅蓝，文字颜色保持不变 */
    ::selection { background: #cce2fa; color: currentColor; }
    ::-moz-selection { background: #cce2fa; color: currentColor; }
  `,
  
  // 设置回调
  setup: handleEditorSetup
}))

// 编辑器初始化回调
function handleEditorInit(evt, editor) {
  editorInstance = editor
}

// 输入事件处理
function handleInput() {
  emits('input', content.value)
}

// 变化事件处理
function handleChange() {
  emits('change', content.value)
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue || ''
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.edit-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  :deep(.tox-tinymce) {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.tox-editor-container),
  :deep(.tox-edit-area) {
    flex: 1 1 auto;
  }
  
  :deep(.tox-edit-area iframe) {
    height: 100% !important;
  }
  
  :deep(.tox-statusbar) {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-top: 1px solid #dcdfe6;
  }
  
  // 自定义按钮样式
  :deep(.tox-tbtn:hover) {
    background-color: #cce2fa !important;
    border-color: #cce2fa !important;
  }
  
  :deep(.tox-tbtn--enabled),
  :deep(.tox-tbtn:focus) {
    background-color: #cce2fa !important;
    border-color: #cce2fa !important;
  }
  
  // 菜单项样式
  :deep(.tox-collection__item:hover),
  :deep(.tox-collection__item--active) {
    background: #cce2fa !important;
  }
}
</style>
