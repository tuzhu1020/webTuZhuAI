<template>
  <div class="edit-box">
    <Editor
      :id="editorId"
      v-model="content"
      :init="editorConfig"
      :api-key="null"
      @init="handleEditorInit"
      @input="handleInput"
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import tinymce from 'tinymce/tinymce'

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
