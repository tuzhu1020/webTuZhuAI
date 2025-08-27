import { ref } from 'vue'
import { marked } from 'marked'
import { useAiChat, aiSessionControl } from '@/composables/useAiChat'
import { $message } from "@/composables/antMessage";
/**
 * TinyMCE AI 写作/润色相关组合式函数与工具。
 * - 提供续写与选中文本润色两大功能，支持会话暂停。
 * - 将 Markdown 的流式增量转换为 HTML，并尽量继承编辑区样式，保证视觉一致。
 * - 长文场景自动抽取文档大纲作为上下文，降低 tokens 压力。
 */
export interface AiOptions {
  /** AI 输出风格偏好，如“公文”“学术”等 */
  style?: string
  /** 指定使用的模型名称，默认 deepseek-chat */
  model?: string
}

/**
 * 提供 TinyMCE 的 AI 能力入口。
 * @param getEditor 获取 TinyMCE 实例的方法
 * @returns polishing/continuing 状态以及 aiContinueWriting、aiPolishSelected 等方法
 */
export function useTinymceAI(getEditor: () => any) {
  const polishing = ref(false)
  const continuing = ref(false)
  // 防止暂停后重复提示
  const polishPausedNotified = ref(false)
  const continuePausedNotified = ref(false)
  const { polishText, continueText } = useAiChat()
  // 流式增量内容缓冲：按会话累积（解决某些后端只返回增量切片的问题）
  const polishStreamBuffer = new Map<string, string>()

  /**
   * 将 Markdown 转换为 HTML（启用 GFM、软换行，禁用 headerIds/mangle）。
   */
  function mdToHtml(markdown: string) {
    if (!markdown) return ''
    marked.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false })
    return marked.parse(markdown)
  }

  /**
   * 从 HTML 内容抽取概要 Markdown：
   * - 将 h1~h6 转为带 # 的标题行
   * - li/p 的文本转为列表项（p 仅取首句或前 60 字）
   * - 主要用于长文续写时的上下文压缩
   */
  function htmlToOutlineMarkdown(html: string) {
    try {
      const div = document.createElement('div')
      div.innerHTML = html || ''
      const lines: string[] = []
      // 深度优先遍历 DOM，抽取标题、列表、段落的概览文本
      const walk = (node: Element) => {
        const tag = node.tagName ? node.tagName.toLowerCase() : ''
        if (/^h[1-6]$/.test(tag)) {
          const level = Number(tag.substring(1))
          const text = (node.textContent || '').trim()
          if (text) lines.push('#'.repeat(Math.min(Math.max(level, 1), 6)) + ' ' + text)
        } else if (tag === 'li') {
          const text = (node.textContent || '').trim()
          if (text) lines.push('- ' + text)
        } else if (tag === 'p') {
          const text = (node.textContent || '').replace(/\s+/g, ' ').trim()
          if (text) {
            // 仅取首句，避免上下文过长；若无句号则截断前 60 字符
            const firstSentence = text.split(/(?<=[。！？!?\.])\s+/)[0] || text.slice(0, 60)
            lines.push('- ' + firstSentence)
          }
        }
        Array.from(node.children || []).forEach((c: any) => walk(c))
      }
      Array.from(div.children || []).forEach((c: any) => walk(c))
      return lines.join('\n')
    } catch {
      return ''
    }
  }

  /**
   * 滚动编辑器至底部，并将光标置于文末。
   */
  function scrollToBottom() {
    const editor = getEditor()
    if (!editor) return
    try {
      const body = editor.getBody()
      if (body) {
        body.scrollTop = body.scrollHeight
        const lastElement = body.lastElementChild
        if (lastElement) lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' })
        editor.selection.select(body, true)
        editor.selection.collapse(false)
      }
    } catch (e) {
      console.warn('scrollToBottom failed:', e)
    }
  }

  /**
   * AI 续写整篇文档（或基于大纲续写）。
   * 流程：
   * 1) 获取全文纯文本，超过阈值则改用大纲作为上下文；
   * 2) 在文末插入预览区块，并支持“暂停本次续写”；
   * 3) 流式接收 Markdown，转换为 HTML 并继承参考样式；
   * 4) 完成后将预览区块替换为最终内容。
   * @param options 可选：style 风格、model 模型
   */
  async function aiContinueWriting(options?: AiOptions) {
    const editor = getEditor()
    if (continuing.value || !editor) return
    try {
      continuing.value = true
      continuePausedNotified.value = false
      const html = editor.getContent() || ''
      const plain = editor.getContent({ format: 'text' }) || ''
      if (!plain.trim()) {
      editor.notificationManager.open({ text: '请先填写文本再使用 AI 续写', type: 'warning', timeout: 2000 })
        // $message.warning('请先填写文本再使用 AI 续写')
        continuing.value = false
        continuePausedNotified.value = true
        return
    }
      
      const MAX_LEN = 6000
      // 判断是否超长，超长则提取大纲用于压缩上下文
      const useOutline = plain.length > MAX_LEN
      const contextMarkdown = useOutline ? htmlToOutlineMarkdown(html) : (() => editor.getContent({ format: 'text' }) || '')()

      if (useOutline && !contextMarkdown) {
        editor.notificationManager.open({ text: '无法提取大纲，已改用全文文本续写', type: 'warning', timeout: 2000 })
      }

      const markerId = `ai-continue-${Date.now()}`
      const sessionId = `tinymce-continue-${Date.now()}`
      const doc = editor.getDoc()
      const body = editor.getBody()
      const styleRef = (function findStyleRef() {
        let el = body && (body.lastElementChild as HTMLElement)
        while (el && ['BR'].includes(el.tagName)) el = el.previousElementSibling as any
        // 选取文末的一个元素作为样式参考，便于让 AI 续写内容继承现有排版
        return el as HTMLElement
      })()

      const previewHtml = `
        <div data-ai-continue-wrapper="${markerId}" style="border:1px dashed #94a3b8;padding:8px;border-radius:6px;margin:6px 0;background:#f8fafc;">
          <div data-ai-continue-new style="background:#ecfeff;border:1px solid #67e8f9;padding:6px;border-radius:4px;">
            <span>AI 续写中...</span>
          </div>
          <div data-ai-continue-actions style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;">
            <button data-ai-continue-pause data-session-id="${sessionId}" style="padding:4px 10px;border:1px solid #f59e0b;border-radius:4px;background:#f59e0b;color:#ffffff;cursor:pointer;">暂停本次续写</button>
          </div>
        </div>`
      editor.selection.select(body, true)
      editor.selection.collapse(false)
      editor.selection.setContent(previewHtml)
      const model = options?.model || 'deepseek-chat'

      // 绑定暂停按钮
      try {
        const wrap = doc && doc.querySelector(`div[data-ai-continue-wrapper="${markerId}"]`)
        const pauseBtn = wrap && (wrap.querySelector('button[data-ai-continue-pause]') as HTMLElement)
        if (pauseBtn) {
          pauseBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const sid = pauseBtn.getAttribute('data-session-id') || sessionId
            aiSessionControl.pause(sid)
            pauseBtn.textContent = '已暂停'
            ;(pauseBtn as HTMLButtonElement).disabled = true
            continuing.value = false
            continuePausedNotified.value = true
            editor.notificationManager.open({ text: '本次续写已暂停', type: 'info', timeout: 1500 })
          }, { once: true })
        }
      } catch {}

      await continueText(contextMarkdown, {
        sessionId,
        model,
        style: options?.style || '公文',
        isOutline: useOutline,
        onDelta: ({ chatMessageList }) => {
          const last = chatMessageList[chatMessageList.length - 1]
          const md = last?.choices?.[0]?._content || ''
          const htmlPart = mdToHtml(md)
          const w = doc && doc.querySelector(`div[data-ai-continue-wrapper="${markerId}"]`)
          const newBlock = w && (w.querySelector('div[data-ai-continue-new]') as HTMLElement)
          if (newBlock) {
            let outHTML = htmlPart
            if (styleRef) {
              const view = (w as any).ownerDocument?.defaultView
              if (view) {
                const cs = view.getComputedStyle(styleRef)
                // 继承周围文本的样式，保证新增内容视觉一致
                const styleMap: Record<string, string> = {
                  'font-family': cs.fontFamily,
                  'font-size': cs.fontSize,
                  'font-weight': cs.fontWeight,
                  'font-style': cs.fontStyle,
                  'line-height': cs.lineHeight,
                  color: cs.color,
                  'text-decoration': (cs as any).textDecorationLine || ''
                }
                const styleStr = Object.entries(styleMap)
                  .filter(([, v]) => v && v !== 'normal' && v !== '400')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('; ')
                outHTML = `<div style="${styleStr}">${htmlPart}</div>`
              }
            }
            newBlock.innerHTML = outHTML
            scrollToBottom()
          }
        },
        onDone: () => {
          // 生成完成：在操作区插入“是否插入续写内容”的选择按钮，默认不自动写回
          const w = doc && (doc.querySelector(`div[data-ai-continue-wrapper="${markerId}"]`) as HTMLElement)
          if (w) {
            // 完成后移除“暂停本次续写”按钮
            const pauseBtn = w.querySelector('button[data-ai-continue-pause]') as HTMLElement | null
            if (pauseBtn) pauseBtn.remove()
            const actions = w.querySelector('div[data-ai-continue-actions]') as HTMLElement | null
            if (actions && !actions.querySelector('[data-ai-continue-choose]')) {
              actions.insertAdjacentHTML('beforeend', `
                <button data-ai-continue-choose="reject" style="padding:4px 10px;border:1px solid #cbd5e1;border-radius:4px;background:#ffffff;color:#334155;cursor:pointer;">放弃续写</button>
                <button data-ai-continue-choose="accept" style="padding:4px 10px;border:1px solid #22c55e;border-radius:4px;background:#22c55e;color:#ffffff;cursor:pointer;">插入续写</button>
              `)
               // 使用事件委托，防止 TinyMCE 内部重绘导致直绑事件丢失
              const docView = (w as any).ownerDocument as Document
              const delegated = (e: Event) => {
                const target = e.target as Element | null
                const btn = target && (target.closest('button[data-ai-continue-choose]') as HTMLElement | null)
                if (!btn) return
                if (!w.contains(btn)) return
                e.preventDefault(); (e as any).stopPropagation?.()
                const type = btn.getAttribute('data-ai-continue-choose')
                const inner = w.querySelector('[data-ai-continue-new]') as HTMLElement
                if (type === 'accept') {
                  if (inner) w.outerHTML = inner.innerHTML || ''
                  else w.parentNode && w.parentNode.removeChild(w)
                } else {
                  w.parentNode && w.parentNode.removeChild(w)
                }
                // 处理完成后移除委托监听，避免泄漏
                docView.removeEventListener('click', delegated, true)
              }
              docView.addEventListener('click', delegated, true)
            }
          }
          continuing.value = false
          const paused = aiSessionControl.isPaused(sessionId)
          if (!(paused && continuePausedNotified.value)) {
            editor.notificationManager.open({ text: paused ? 'AI 续写已暂停' : 'AI 续写完成，请选择是否插入续写内容', type: 'info', timeout: 2000 })
          }
        }
      })
    } catch (e) {
      console.error(e)
      const editor = getEditor()
      const doc = editor?.getDoc()
      const w = doc && (doc.querySelector('[data-ai-continue-wrapper]') as HTMLElement)
      // 失败时用醒目的错误区块提示并复位状态
      if (w) w.innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px;border-radius:4px;">AI 续写失败，请稍后重试。</div>`
      continuing.value = false
      editor?.notificationManager.open({ text: 'AI 续写失败，请稍后重试', type: 'error', timeout: 2000 })
    }
  }

  /**
   * AI 润色当前选中文本，并提供“保留原文/采用新文”选择。
   * 特性：
   * - 绑定暂停按钮，支持会话暂停；
   * - 处理内部锚点 <a id/name> 的保留与去重；
   * - 对单一包裹元素时尽量继承原有样式；
   * - 支持多段对齐：按锚点或顺序映射替换对应段落。
   * @param options 可选：style 风格、model 模型
   */
  async function aiPolishSelected(options?: AiOptions) {
    const editor = getEditor()
    if (polishing.value || !editor) return

    const selText = editor.selection.getContent({ format: 'text' }) || ''
    const selHtml = editor.selection.getContent({ format: 'html' }) || ''
    if (!selText.trim()) {
      editor.notificationManager.open({ text: '请先选中文本再使用 AI 润色', type: 'warning', timeout: 2000 })
      return
    }
    polishing.value = true
    polishPausedNotified.value = false

    const markerId = `ai-polish-${Date.now()}`
    const sessionId = `tinymce-polish-${Date.now()}`
    // 生成一个包含“原文”和“新文预览”的容器，附带操作按钮（暂停/保留原文/采用新文）
    const wrapperHtml = `
      <div data-ai-polish-wrapper="${markerId}" style="border:1px dashed #94a3b8;padding:8px;border-radius:6px;margin:6px 0;background:#f8fafc;">
        <div data-ai-polish-original style="background:#fff7ed;border:1px solid #fdba74;padding:6px;border-radius:4px;">
          ${selHtml}
        </div>
        <div data-ai-polish-new style="background:#ecfeff;border:1px solid #67e8f9;padding:6px;border-radius:4px;margin-top:8px;">
          <span data-ai-polish="${markerId}">AI 润色中...</span>
        </div>
        <div data-ai-polish-actions style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap;">
          <div >
            <button data-ai-polish-pause data-session-id="${sessionId}" style="padding:4px 10px;border:1px solid #f59e0b;border-radius:4px;background:#f59e0b;color:#ffffff;cursor:pointer;">暂停本次润色</button>
          </div>
          <!-- 选择按钮将在生成完成后再插入 -->
        </div>
      </div>`
    editor.selection.setContent(wrapperHtml)

    const model = options?.model || 'deepseek-chat'

    const doc = editor.getDoc()
    const wrapper = doc && doc.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
    if (wrapper) {
      // 绑定暂停按钮
      const pauseBtn = wrapper.querySelector('button[data-ai-polish-pause]') as HTMLButtonElement | null
      if (pauseBtn) {
        pauseBtn.addEventListener('click', (e: any) => {
          e.preventDefault(); e.stopPropagation();
          const sid = pauseBtn.getAttribute('data-session-id') || sessionId
          aiSessionControl.pause(sid)
          pauseBtn.textContent = '已暂停'
          pauseBtn.disabled = true
          polishing.value = false
          polishPausedNotified.value = true
          editor.notificationManager.open({ text: '本次润色已暂停', type: 'info', timeout: 1500 })
        }, { once: true })
      }
      // 采用原文/新文的点击处理
      const onChoose = (e: any) => {
        e.preventDefault(); e.stopPropagation();
        const target = e.currentTarget as HTMLElement
        const type = target?.getAttribute('data-ai-choose')
        const orig = wrapper.querySelector('div[data-ai-polish-original]') as HTMLElement
        const neu = wrapper.querySelector('div[data-ai-polish-new]') as HTMLElement
        let replaceWith = type === 'orig' ? (orig?.innerHTML || '') : (neu?.innerHTML || '')

        if (type === 'new') {
          // 情况 A：原文只有一个包裹元素，尽量保留其结构（并保留/去重锚点）
          const hasSingleChild = !!orig && orig.childElementCount === 1
          if (hasSingleChild) {
            const styleRefEl = orig.firstElementChild as HTMLElement
            if (styleRefEl && replaceWith) {
              const cloned = styleRefEl.cloneNode(false) as HTMLElement
              const preserved = Array.from(styleRefEl.childNodes).filter((n: any) => {
                if ((n as any).nodeType !== 1) return false
                const el = n as HTMLElement
                const tag = el.tagName.toLowerCase()
                return tag === 'a' && (el.id || el.getAttribute('name'))
              }) as HTMLElement[]
              cloned.innerHTML = ''
              preserved.forEach((a) => cloned.appendChild(a.cloneNode(true)))
              const doc = (wrapper as any).ownerDocument!
              const tmp = doc.createElement('div')
              tmp.innerHTML = replaceWith
              if (preserved.length) {
                // 去掉新文中与原始锚点重复的 a[id]/a[name]
                const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                  const id = (el.getAttribute('id') || '').trim()
                  const nm = (el.getAttribute('name') || '').trim()
                  if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el as any)
                })
              }
              while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
              replaceWith = cloned.outerHTML
            }
          } else {
            // 情况 B：原文包含多个块元素，做“分段对齐”映射
            const docView = (wrapper as any).ownerDocument?.defaultView
            const doc = (wrapper as any).ownerDocument
            if (doc && replaceWith) {
              const tmp = doc.createElement('div')
              tmp.innerHTML = replaceWith
              // 清理我们用于展示的外层标记，确保只保留内容本身
              const unwrapList = tmp.querySelectorAll('[data-ai-polish-wrapper], [data-ai-polish-original], [data-ai-polish-new], [data-ai-polish-actions]')
              unwrapList.forEach((el) => {
                const parent = el.parentNode
                if (!parent) return
                while (el.firstChild) parent.insertBefore(el.firstChild, el)
                parent.removeChild(el)
              })
              // 某些模型会在首行加“新问/新文：”，这里做清理
              while (tmp.firstChild && (tmp.firstChild as any).nodeType === 3) {
                const t = tmp.firstChild.textContent || ''
                const cleaned = t.replace(/^\s*新问[:：]\s*/i, '').replace(/^\s*新文[:：]\s*/i, '')
                if (cleaned.length === t.length) break
                if (cleaned) tmp.firstChild.textContent = cleaned
                else tmp.removeChild(tmp.firstChild)
              }
              const newChildren = Array.from(tmp.children)
              const origChildren = Array.from(orig.children) as HTMLElement[]

              if (newChildren.length && origChildren.length) {
                // 建立“锚点 -> 原文下标”的索引，优先用锚点对齐
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
                  const preserved = Array.from(ref.childNodes).filter((n: any) => {
                    if ((n as any).nodeType !== 1) return false
                    const el = n as HTMLElement
                    const tag = el.tagName.toLowerCase()
                    return tag === 'a' && (el.id || el.getAttribute('name'))
                  }) as HTMLElement[]
                  clone.innerHTML = ''
                  preserved.forEach((a) => clone.appendChild(a.cloneNode(true)))
                  const tmpNeu = ref.ownerDocument!.createElement('div')
                  tmpNeu.innerHTML = htmlFragment
                  if (preserved.length) {
                    // 去重：避免把相同锚点重复插入
                    const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                    const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                    tmpNeu.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                      const id = (el.getAttribute('id') || '').trim()
                      const nm = (el.getAttribute('name') || '').trim()
                      if ((id && ids.has(id)) || (nm && names.has(nm))) (el.parentNode as any)?.removeChild(el as any)
                    })
                  }
                  while (tmpNeu.firstChild) clone.appendChild(tmpNeu.firstChild)
                  mapped[targetIdx] = clone.outerHTML
                  taken.add(targetIdx)
                  if (targetIdx >= cursor) cursor = targetIdx + 1
                }

                for (let n = 0; n < newChildren.length; n++) {
                  const neu = newChildren[n] as HTMLElement
                  const rawHtml = (neu.innerHTML || (neu.textContent || '')) as string
                  let targetIdx = -1
                  // 优先用新文中出现的锚点对齐到原文对应段落
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

                  // 若新文中一段被拆成 head<br/>tail 两块，尝试分配到相邻两个段落
                  const brPos = rawHtml.indexOf('<br')
                  if (brPos >= 0) {
                    const close = rawHtml.indexOf('>', brPos)
                    const head = rawHtml.slice(0, brPos)
                    const tail = rawHtml.slice(close + 1)
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, head)
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
                    // continue to next
                  } else {
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                  }
                }

                replaceWith = mapped.join('')
              } else if (docView) {
                // 无法做分段映射时，尽量继承原文容器的样式
                const cs = docView.getComputedStyle(orig)
                const styleMap: Record<string, string> = {
                  'font-family': cs.fontFamily,
                  'font-size': cs.fontSize,
                  'font-weight': cs.fontWeight,
                  'font-style': cs.fontStyle,
                  'line-height': cs.lineHeight,
                  color: cs.color,
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

        if (replaceWith) (wrapper as any).outerHTML = replaceWith
        else (wrapper as any).outerHTML = orig?.innerHTML || ''
      }
      // 注意：选择按钮仅在生成完成后插入与绑定事件（见 onDone）
    }

    try {
      // 初始化当前会话的流式缓冲
      polishStreamBuffer.set(sessionId, '')
      await polishText(selText, {
        sessionId,
        model,
        onDelta: ({ chatMessageList }) => {
          const last = chatMessageList[chatMessageList.length - 1]
          const mdIncoming = last?.choices?.[0]?._content || ''
          // 合并为累计文本：若新内容以旧内容为前缀，采用新内容；否则做简单拼接
          const prev = polishStreamBuffer.get(sessionId) || ''
          const merged = mdIncoming.startsWith(prev) ? mdIncoming : (prev + mdIncoming)
          polishStreamBuffer.set(sessionId, merged)
          const html = mdToHtml(merged)
          const doc2 = editor.getDoc()
          const wrap2 = doc2 && doc2.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
          const newBlock2 = wrap2 && (wrap2.querySelector('div[data-ai-polish-new]') as HTMLElement)
          const orig2 = wrap2 && (wrap2.querySelector('div[data-ai-polish-original]') as HTMLElement)
          if (newBlock2 && orig2) {
            let preview = html || selText
            const tmp = doc2.createElement('div')
            tmp.innerHTML = preview
            // 在任何 DOM 迁移前记录原始文本长度和 HTML 快照，便于后续兜底对比
            const srcHtmlSnapshot = tmp.innerHTML
            const srcTextLen = (tmp.textContent || '').replace(/\s+/g, '').length
            // 去除我们为了 UI 包裹添加的 data-ai-* 容器，避免被写回编辑器
            const unwrapList = tmp.querySelectorAll('[data-ai-polish-wrapper], [data-ai-polish-original], [data-ai-polish-new], [data-ai-polish-actions]')
            unwrapList.forEach((el) => {
              const parent = el.parentNode
              if (!parent) return
              while (el.firstChild) parent.insertBefore(el.firstChild, el)
              parent.removeChild(el)
            })
            // 清理开头可能出现的“新问/新文：”
            while (tmp.firstChild && (tmp.firstChild as any).nodeType === 3) {
              const t = tmp.firstChild.textContent || ''
              const cleaned = t.replace(/^\s*新问[:：]\s*/i, '').replace(/^\s*新文[:：]\s*/i, '')
              if (cleaned.length === t.length) break
              if (cleaned) tmp.firstChild.textContent = cleaned
              else tmp.removeChild(tmp.firstChild)
            }

            const hasSingleChild = !!orig2 && orig2.childElementCount === 1
            if (hasSingleChild) {
              // 单容器：克隆原容器结构，保留其 a 锚点孩子，填充新内容
              const styleRefEl = orig2.firstElementChild as HTMLElement
              if (styleRefEl) {
                const cloned = styleRefEl.cloneNode(false) as HTMLElement
                const preserved = Array.from(styleRefEl.childNodes).filter((n: any) => {
                  if ((n as any).nodeType !== 1) return false
                  const el = n as HTMLElement
                  const tag = el.tagName.toLowerCase()
                  return tag === 'a' && (el.id || el.getAttribute('name'))
                }) as HTMLElement[]
                cloned.innerHTML = ''
                preserved.forEach((a) => cloned.appendChild(a.cloneNode(true)))
                if (preserved.length) {
                  // 去重新内容中的重复锚点
                  const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                  const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                  tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                    const id = (el.getAttribute('id') || '').trim()
                    const nm = (el.getAttribute('name') || '').trim()
                    if ((id && ids.has(id)) || (nm && names.has(nm))) (el.parentNode as any)?.removeChild(el as any)
                  })
                }
                // 如果原容器是 <p> 且新内容包含多个块级元素，避免将块级元素嵌入 <p> 导致内容丢失
                const refTag = styleRefEl.tagName.toUpperCase()
                const topCount = tmp.children.length
                const firstTop = tmp.firstElementChild?.tagName.toUpperCase()
                const blockTags = new Set(['P','DIV','UL','OL','LI','H1','H2','H3','H4','H5','H6','TABLE','BLOCKQUOTE','PRE','SECTION','ARTICLE'])
                const hasMultiBlocks = topCount > 1 || (!!firstTop && blockTags.has(firstTop))
                let resultHtml = ''
                // 为避免 TinyMCE 在 <p> 中吞掉块级元素，原容器为 P 时一律改用 DIV 承载
                if (refTag === 'P') {
                  const wrapDiv = doc2.createElement('div')
                  const inlineStyle = styleRefEl.getAttribute('style') || ''
                  if (inlineStyle) wrapDiv.setAttribute('style', inlineStyle)
                  preserved.forEach((a) => wrapDiv.appendChild(a.cloneNode(true)))
                  while (tmp.firstChild) wrapDiv.appendChild(tmp.firstChild)
                  resultHtml = wrapDiv.outerHTML
                } else {
                  while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
                  resultHtml = cloned.outerHTML
                }
                // 安全兜底：若结果文本显著短于原解析文本，则回退为直接使用解析后的 HTML
                try {
                  const probe = doc2.createElement('div')
                  probe.innerHTML = resultHtml
                  const builtLen = (probe.textContent || '').replace(/\s+/g, '').length
                  const rawLen = srcTextLen
                  if (rawLen > 0 && builtLen < Math.max(10, Math.floor(rawLen * 0.5))) {
                    // 回退为原解析 HTML（未迁移前的快照），确保内容不丢失
                    resultHtml = srcHtmlSnapshot
                  }
                } catch {}
                newBlock2.innerHTML = resultHtml
              } else {
                newBlock2.innerHTML = tmp.innerHTML
              }
            } else {
              // 多容器：尝试按锚点/顺序对齐
              const newChildren = Array.from(tmp.children)
              const origChildren = Array.from(orig2.children) as HTMLElement[]
              if (newChildren.length && origChildren.length) {
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
                  const preserved = Array.from(ref.childNodes).filter((n: any) => {
                    if ((n as any).nodeType !== 1) return false
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
                      if ((id && ids.has(id)) || (nm && names.has(nm))) (el.parentNode as any)?.removeChild(el as any)
                    })
                  }
                  while (tmpNeu.firstChild) clone.appendChild(tmpNeu.firstChild)
                  mapped[targetIdx] = clone.outerHTML
                  taken.add(targetIdx)
                  if (targetIdx >= cursor) cursor = targetIdx + 1
                }

                for (let n = 0; n < newChildren.length; n++) {
                  const neu = newChildren[n] as HTMLElement
                  const rawHtml = (neu.innerHTML || (neu.textContent || '')) as string
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

                  const brPos = rawHtml.indexOf('<br')
                  if (brPos >= 0) {
                    const close = rawHtml.indexOf('>', brPos)
                    const head = rawHtml.slice(0, brPos)
                    const tail = rawHtml.slice(close + 1)
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, head)
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
                  } else {
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                  }
                }

                // 映射结果
                let mappedHtml = mapped.join('')
                // Fallback：若映射结果为空或明显过短，回退到直接使用解析后的 HTML
                const builtProbe = doc2.createElement('div')
                builtProbe.innerHTML = mappedHtml
                const builtLen = (builtProbe.textContent || '').replace(/\s+/g, '').length
                if (!mappedHtml || builtLen < Math.max(10, Math.floor(srcTextLen * 0.5))) {
                  mappedHtml = tmp.innerHTML
                }
                newBlock2.innerHTML = mappedHtml
              } else {
                const view = (wrap2 as any).ownerDocument?.defaultView
                if (view) {
                  // 回退：继承原容器样式后整体包裹
                  const cs = view.getComputedStyle(orig2)
                  const styleMap: Record<string, string> = {
                    'font-family': cs.fontFamily,
                    'font-size': cs.fontSize,
                    'font-weight': cs.fontWeight,
                    'font-style': cs.fontStyle,
                    'line-height': cs.lineHeight,
                    color: cs.color,
                    'text-decoration': (cs as any).textDecorationLine || ''
                  }
                  const styleStr = Object.entries(styleMap)
                    .filter(([, v]) => v && v !== 'normal' && v !== '400')
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('; ')
                  // 若 tmp 为空，避免写入空
                  const inner = tmp.innerHTML || (tmp.textContent || '')
                  newBlock2.innerHTML = `<div style="${styleStr}">${inner}</div>`
                } else {
                  newBlock2.innerHTML = tmp.innerHTML || (tmp.textContent || '')
                }
              }
            }
          }
        },
        onDone: () => {
          // 生成完成：移除暂停按钮，并在操作区插入“保留原文/采用新文”按钮，绑定点击事件
          try {
            const doc3 = editor.getDoc()
            const wrap3 = doc3 && doc3.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
            if (wrap3) {
              // 在完成时，用缓冲的完整内容强制刷新一次预览，避免最后一次 onDelta 未覆盖完全
              try {
                const fullMd = polishStreamBuffer.get(sessionId) || ''
                if (fullMd) {
                  const htmlFull = mdToHtml(fullMd)
                  const tmpFull = doc3.createElement('div')
                  tmpFull.innerHTML = htmlFull
                  const newBlockFull = wrap3.querySelector('div[data-ai-polish-new]') as HTMLElement | null
                  if (newBlockFull) {
                    // 直接将解析后的 HTML 写入预览（保持与 onDelta 的清理一致的包裹结构已在 onDelta 处理过，这里兜底覆盖）
                    newBlockFull.innerHTML = tmpFull.innerHTML
                  }
                }
              } catch {}
              // 完成后移除“暂停本次润色”按钮
              const pauseBtn = wrap3.querySelector('button[data-ai-polish-pause]') as HTMLElement | null
              if (pauseBtn) pauseBtn.remove()
              const actions = wrap3.querySelector('div[data-ai-polish-actions]') as HTMLElement | null
              if (actions && !actions.querySelector('[data-ai-choose]')) {
                actions.insertAdjacentHTML('beforeend', `
                  <button data-ai-choose="orig" style="padding:4px 10px;border:1px solid #cbd5e1;border-radius:4px;background:#ffffff;color:#334155;cursor:pointer;">保留原文</button>
                  <button data-ai-choose="new" style="padding:4px 10px;border:1px solid #22c55e;border-radius:4px;background:#22c55e;color:#ffffff;cursor:pointer;">采用新文</button>
                `)
                const btnOrig2 = actions.querySelector('button[data-ai-choose="orig"]')
                const btnNew2 = actions.querySelector('button[data-ai-choose="new"]')
                const onChoose2 = (e: any) => {
                  // 复用与上方 onChoose 相同的处理逻辑
                  e.preventDefault(); e.stopPropagation();
                  const target = e.currentTarget as HTMLElement
                  const type = target?.getAttribute('data-ai-choose')
                  const orig = wrap3.querySelector('div[data-ai-polish-original]') as HTMLElement
                  const neu = wrap3.querySelector('div[data-ai-polish-new]') as HTMLElement
                  let replaceWith = type === 'orig' ? (orig?.innerHTML || '') : (neu?.innerHTML || '')
                  if (type === 'new') {
                    const hasSingleChild = !!orig && orig.childElementCount === 1
                    if (hasSingleChild) {
                      const styleRefEl = orig.firstElementChild as HTMLElement
                      if (styleRefEl && replaceWith) {
                        const cloned = styleRefEl.cloneNode(false) as HTMLElement
                        const preserved = Array.from(styleRefEl.childNodes).filter((n: any) => {
                          if ((n as any).nodeType !== 1) return false
                          const el = n as HTMLElement
                          const tag = el.tagName.toLowerCase()
                          return tag === 'a' && (el.id || el.getAttribute('name'))
                        }) as HTMLElement[]
                        cloned.innerHTML = ''
                        preserved.forEach((a) => cloned.appendChild(a.cloneNode(true)))
                        const doc = (wrap3 as any).ownerDocument!
                        const tmp = doc.createElement('div')
                        tmp.innerHTML = replaceWith
                        if (preserved.length) {
                          const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                          const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                          tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                            const id = (el.getAttribute('id') || '').trim()
                            const nm = (el.getAttribute('name') || '').trim()
                            if ((id && ids.has(id)) || (nm && names.has(nm))) el.parentNode?.removeChild(el as any)
                          })
                        }
                        // 如果原容器是 <p> 且新内容包含多个块级元素，避免将块级元素嵌入 <p> 导致内容丢失
                        const refTag = styleRefEl.tagName.toUpperCase()
                        const topCount = tmp.children.length
                        const firstTop = tmp.firstElementChild?.tagName.toUpperCase()
                        const blockTags = new Set(['P','DIV','UL','OL','LI','H1','H2','H3','H4','H5','H6','TABLE','BLOCKQUOTE','PRE','SECTION','ARTICLE'])
                        const hasMultiBlocks = topCount > 1 || (!!firstTop && blockTags.has(firstTop))
                        if (refTag === 'P' && hasMultiBlocks) {
                          const wrapDiv = doc.createElement('div')
                          const inlineStyle = styleRefEl.getAttribute('style') || ''
                          if (inlineStyle) wrapDiv.setAttribute('style', inlineStyle)
                          preserved.forEach((a) => wrapDiv.appendChild(a.cloneNode(true)))
                          while (tmp.firstChild) wrapDiv.appendChild(tmp.firstChild)
                          replaceWith = wrapDiv.outerHTML
                        } else {
                          while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
                          replaceWith = cloned.outerHTML
                        }
                      }
                    } else {
                      const docView = (wrap3 as any).ownerDocument?.defaultView
                      const doc = (wrap3 as any).ownerDocument
                      if (doc && replaceWith) {
                        const tmp = doc.createElement('div')
                        tmp.innerHTML = replaceWith
                        const unwrapList = tmp.querySelectorAll('[data-ai-polish-wrapper], [data-ai-polish-original], [data-ai-polish-new], [data-ai-polish-actions]')
                        unwrapList.forEach((el) => {
                          const parent = el.parentNode
                          if (!parent) return
                          while (el.firstChild) parent.insertBefore(el.firstChild, el)
                          parent.removeChild(el)
                        })
                        while (tmp.firstChild && (tmp.firstChild as any).nodeType === 3) {
                          const t = tmp.firstChild.textContent || ''
                          const cleaned = t.replace(/^\s*新问[:：]\s*/i, '').replace(/^\s*新文[:：]\s*/i, '')
                          if (cleaned.length === t.length) break
                          if (cleaned) tmp.firstChild.textContent = cleaned
                          else tmp.removeChild(tmp.firstChild)
                        }
                        const newChildren = Array.from(tmp.children)
                        const origChildren = Array.from(orig.children) as HTMLElement[]
                        if (newChildren.length && origChildren.length) {
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
                            const preserved = Array.from(ref.childNodes).filter((n: any) => {
                              if ((n as any).nodeType !== 1) return false
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
                                if ((id && ids.has(id)) || (nm && names.has(nm))) (el.parentNode as any)?.removeChild(el as any)
                              })
                            }
                            while (tmpNeu.firstChild) clone.appendChild(tmpNeu.firstChild)
                            mapped[targetIdx] = clone.outerHTML
                            taken.add(targetIdx)
                            if (targetIdx >= cursor) cursor = targetIdx + 1
                          }
                          for (let n = 0; n < newChildren.length; n++) {
                            const neu = newChildren[n] as HTMLElement
                            const rawHtml = (neu.innerHTML || (neu.textContent || '')) as string
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
                            const brPos = rawHtml.indexOf('<br')
                            if (brPos >= 0) {
                              const close = rawHtml.indexOf('>', brPos)
                              const head = rawHtml.slice(0, brPos)
                              const tail = rawHtml.slice(close + 1)
                              if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                              if (targetIdx >= 0) assignToIndex(targetIdx, head)
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
                            } else {
                              if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                              if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                            }
                          }
                          // 构造映射结果并做长度兜底
                          let mappedHtml = mapped.join('')
                          const builtProbe = doc.createElement('div')
                          builtProbe.innerHTML = mappedHtml
                          const builtLen = (builtProbe.textContent || '').replace(/\s+/g, '').length
                          const rawLen = (tmp.textContent || '').replace(/\s+/g, '').length
                          if (!mappedHtml || builtLen < Math.max(10, Math.floor(rawLen * 0.5))) {
                            mappedHtml = tmp.innerHTML
                          }
                          replaceWith = mappedHtml
                        } else if (docView) {
                          const cs = docView.getComputedStyle(orig)
                          const styleMap: Record<string, string> = {
                            'font-family': cs.fontFamily,
                            'font-size': cs.fontSize,
                            'font-weight': cs.fontWeight,
                            'font-style': cs.fontStyle,
                            'line-height': cs.lineHeight,
                            color: cs.color,
                            'text-decoration': (cs as any).textDecorationLine || ''
                          }
                          const styleStr = Object.entries(styleMap)
                            .filter(([, v]) => v && v !== 'normal' && v !== '400')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join('; ')
                          const inner = tmp.innerHTML || (tmp.textContent || replaceWith)
                          replaceWith = `<div style="${styleStr}">${inner}</div>`
                        }
                      }
                    }
                  }
                  if (replaceWith) (wrap3 as any).outerHTML = replaceWith
                  else (wrap3 as any).outerHTML = orig?.innerHTML || ''
                }
                btnOrig2 && btnOrig2.addEventListener('click', onChoose2 as any, { once: true })
                btnNew2 && btnNew2.addEventListener('click', onChoose2 as any, { once: true })
              }
            }
          } catch {}
          // 清理缓冲
          polishStreamBuffer.delete(sessionId)
          polishing.value = false
          const paused = aiSessionControl.isPaused(sessionId)
          if (!(paused && polishPausedNotified.value)) {
            editor.notificationManager.open({ text: paused ? 'AI 润色已暂停' : 'AI 润色完成，请选择采用哪一版', type: 'info', timeout: 2000 })
          }
        }
      }, options?.style || '公文', '润色')
    } catch (e) {
      console.error(e)
      const doc = editor.getDoc()
      const newBlock = doc && doc.querySelector(`div[data-ai-polish-wrapper="${markerId}"] div[data-ai-polish-new]`)
      // 失败提示并复位状态
      if (newBlock) {
        (newBlock as HTMLElement).innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px;border-radius:4px;">AI 润色失败，请稍后重试。</div>`
      }
      polishing.value = false
      editor.notificationManager.open({ text: 'AI 润色失败，请稍后重试', type: 'error', timeout: 2000 })
    }
  }

  return { polishing, continuing, aiContinueWriting, aiPolishSelected, scrollToBottom, mdToHtml, htmlToOutlineMarkdown }
}
