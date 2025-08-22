import { ref } from 'vue'
import { marked } from 'marked'
import { useAiChat, aiSessionControl } from '@/composables/useAiChat'

export interface AiOptions {
  style?: string
  model?: string
}

export function useTinymceAI(getEditor: () => any) {
  const polishing = ref(false)
  const continuing = ref(false)
  // 防止暂停后重复提示
  const polishPausedNotified = ref(false)
  const continuePausedNotified = ref(false)
  const { polishText, continueText } = useAiChat()

  function mdToHtml(markdown: string) {
    if (!markdown) return ''
    marked.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false })
    return marked.parse(markdown)
  }

  function htmlToOutlineMarkdown(html: string) {
    try {
      const div = document.createElement('div')
      div.innerHTML = html || ''
      const lines: string[] = []
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

  async function aiContinueWriting(options?: AiOptions) {
    const editor = getEditor()
    if (continuing.value || !editor) return
    try {
      continuing.value = true
      continuePausedNotified.value = false
      const html = editor.getContent() || ''
      const plain = editor.getContent({ format: 'text' }) || ''
      const MAX_LEN = 6000
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
          const w = doc && (doc.querySelector(`div[data-ai-continue-wrapper="${markerId}"]`) as HTMLElement)
          if (w) {
            const inner = w.querySelector('[data-ai-continue-new]') as HTMLElement
            if (inner) w.outerHTML = inner.innerHTML || ''
            else w.parentNode && w.parentNode.removeChild(w)
          }
          continuing.value = false
          const paused = aiSessionControl.isPaused(sessionId)
          if (!(paused && continuePausedNotified.value)) {
            editor.notificationManager.open({ text: paused ? 'AI 续写已暂停' : 'AI 续写完成', type: 'info', timeout: 1500 })
          }
        }
      })
    } catch (e) {
      console.error(e)
      const editor = getEditor()
      const doc = editor?.getDoc()
      const w = doc && (doc.querySelector('[data-ai-continue-wrapper]') as HTMLElement)
      if (w) w.innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px;border-radius:4px;">AI 续写失败，请稍后重试。</div>`
      continuing.value = false
      editor?.notificationManager.open({ text: 'AI 续写失败，请稍后重试', type: 'error', timeout: 2000 })
    }
  }

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
    const wrapperHtml = `
      <div data-ai-polish-wrapper="${markerId}" style="border:1px dashed #94a3b8;padding:8px;border-radius:6px;margin:6px 0;background:#f8fafc;">
        <div data-ai-polish-original style="background:#fff7ed;border:1px solid #fdba74;padding:6px;border-radius:4px;">
          ${selHtml}
        </div>
        <div data-ai-polish-new style="background:#ecfeff;border:1px solid #67e8f9;padding:6px;border-radius:4px;margin-top:8px;">
          <span data-ai-polish="${markerId}">AI 润色中...</span>
        </div>
        <div data-ai-polish-actions style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap;">
          <div style="margin-right:auto">
            <button data-ai-polish-pause data-session-id="${sessionId}" style="padding:4px 10px;border:1px solid #f59e0b;border-radius:4px;background:#f59e0b;color:#ffffff;cursor:pointer;">暂停本次润色</button>
          </div>
          <button data-ai-choose="orig" style="padding:4px 10px;border:1px solid #cbd5e1;border-radius:4px;background:#ffffff;color:#334155;cursor:pointer;">保留原文</button>
          <button data-ai-choose="new" style="padding:4px 10px;border:1px solid #22c55e;border-radius:4px;background:#22c55e;color:#ffffff;cursor:pointer;">采用新文</button>
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
      const onChoose = (e: any) => {
        e.preventDefault(); e.stopPropagation();
        const target = e.currentTarget as HTMLElement
        const type = target?.getAttribute('data-ai-choose')
        const orig = wrapper.querySelector('div[data-ai-polish-original]') as HTMLElement
        const neu = wrapper.querySelector('div[data-ai-polish-new]') as HTMLElement
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
              const doc = (wrapper as any).ownerDocument!
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
              while (tmp.firstChild) cloned.appendChild(tmp.firstChild)
              replaceWith = cloned.outerHTML
            }
          } else {
            const docView = (wrapper as any).ownerDocument?.defaultView
            const doc = (wrapper as any).ownerDocument
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
                    // continue to next
                  } else {
                    if (targetIdx < 0) targetIdx = takeNextAvailable(cursor)
                    if (targetIdx >= 0) assignToIndex(targetIdx, rawHtml)
                  }
                }

                replaceWith = mapped.join('')
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
                replaceWith = `<div style="${styleStr}">${replaceWith}</div>`
              }
            }
          }
        }

        if (replaceWith) (wrapper as any).outerHTML = replaceWith
        else (wrapper as any).outerHTML = orig?.innerHTML || ''
      }
      const btnOrig = wrapper.querySelector('button[data-ai-choose="orig"]')
      const btnNew = wrapper.querySelector('button[data-ai-choose="new"]')
      btnOrig && btnOrig.addEventListener('click', onChoose as any, { once: true })
      btnNew && btnNew.addEventListener('click', onChoose as any, { once: true })
    }

    try {
      await polishText(selText, {
        sessionId,
        model,
        onDelta: ({ chatMessageList }) => {
          const last = chatMessageList[chatMessageList.length - 1]
          const md = last?.choices?.[0]?._content || ''
          const html = mdToHtml(md)
          const doc2 = editor.getDoc()
          const wrap2 = doc2 && doc2.querySelector(`div[data-ai-polish-wrapper="${markerId}"]`)
          const newBlock2 = wrap2 && (wrap2.querySelector('div[data-ai-polish-new]') as HTMLElement)
          const orig2 = wrap2 && (wrap2.querySelector('div[data-ai-polish-original]') as HTMLElement)
          if (newBlock2 && orig2) {
            let preview = html || selText
            const tmp = doc2.createElement('div')
            tmp.innerHTML = preview
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

            const hasSingleChild = !!orig2 && orig2.childElementCount === 1
            if (hasSingleChild) {
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
                  const ids = new Set(preserved.map(a => (a.id || '').trim()).filter(Boolean))
                  const names = new Set(preserved.map(a => (a.getAttribute('name') || '').trim()).filter(Boolean))
                  tmp.querySelectorAll('a[id], a[name]').forEach((el: Element) => {
                    const id = (el.getAttribute('id') || '').trim()
                    const nm = (el.getAttribute('name') || '').trim()
                    if ((id && ids.has(id)) || (nm && names.has(nm))) (el.parentNode as any)?.removeChild(el as any)
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

                newBlock2.innerHTML = mapped.join('')
              } else {
                const view = (wrap2 as any).ownerDocument?.defaultView
                if (view) {
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
      if (newBlock) {
        (newBlock as HTMLElement).innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px;border-radius:4px;">AI 润色失败，请稍后重试。</div>`
      }
      polishing.value = false
      editor.notificationManager.open({ text: 'AI 润色失败，请稍后重试', type: 'error', timeout: 2000 })
    }
  }

  return { polishing, continuing, aiContinueWriting, aiPolishSelected, scrollToBottom, mdToHtml, htmlToOutlineMarkdown }
}
