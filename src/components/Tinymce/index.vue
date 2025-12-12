
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
// 注意：不要同时从 npm 包导入 tinymce 与通过 tinymce-script-src 加载自托管脚本，
// 否则可能产生多个实例与版本不一致，导致插件内部报错（如读取 isEmpty of undefined）。
import { useTinymceAI } from './composables/useTinymceAI'
import { useTinymceWord } from './composables/useTinymceWord'
import { useTinymceUploader } from './composables/useTinymceUploader'

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
let editorInstance: any = null

// 组合模块：AI、Word、上传
const { aiPolishSelected, aiContinueWriting, scrollToBottom } = useTinymceAI(() => editorInstance)
const { handleImportWord, handleExportWord } = useTinymceWord(() => editorInstance)
const { handleImageUpload } = useTinymceUploader(() => props.fileSizes)

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
  getEditor: () => editorInstance
})

// 清空内容
function handleClearContent() {
  if (!editorInstance) return
  const ok = window.confirm('确定要清空编辑器内容吗？此操作不可撤销。')
  if (!ok) return
  editorInstance.setContent('')
  emits('update:modelValue', '')
}

// 编辑器设置回调
function handleEditorSetup(editor: any) {
  editorInstance = editor

  // 自定义按钮
  // 注册自定义图标（模拟 Ant Design Outlined 风格，使用 currentColor）
  editor.ui.registry.addIcon('ant-arrow-up',
    '<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
      <path d="M512 128l-288 288h176v384h224V416h176L512 128z"/>\
    </svg>'
  )
  editor.ui.registry.addIcon('ant-arrow-down',
    '<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
      <path d="M512 896l288-288H624V224H400v384H224l288 288z"/>\
    </svg>'
  )
  editor.ui.registry.addIcon('ant-edit',
    '<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
      <path d="M880 240L784 144 328 600l-32 128 128-32 456-456zM272 760l-24 96 96-24z"/>\
    </svg>'
  )
  editor.ui.registry.addIcon('ant-undo',
    '<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\
      <path d="M256 320V160L64 352l192 192V416c256 0 448 96 448 288 0 56-16 104-48 144 112-64 176-168 176-288 0-256-240-352-576-352z"/>\
    </svg>'
  )

  editor.ui.registry.addButton('aiPolish', {
    text: '润色',
    tooltip: '使用 AI 润色所选文本',
    icon: 'ant-undo',
    onAction: aiPolishSelected
  })
  editor.ui.registry.addButton('aiContinue', {
    text: '续写',
    tooltip: '根据当前内容进行续写',
    icon: 'ant-edit',
    onAction: () => aiContinueWriting({ model: 'gpt-4o-mini-ca', style: '学术' })
  })
  editor.ui.registry.addButton('importword', {
    text: '上传',
    tooltip: '从 .docx 导入',
    icon: 'ant-arrow-up',
    onAction: handleImportWord
  })
  editor.ui.registry.addButton('exportword', {
    text: '下载',
    tooltip: '导出为 .docx',
    icon: 'ant-arrow-down',
    onAction: handleExportWord
  })
  // 如需暴露“清空”按钮可打开
  // editor.ui.registry.addButton('clearcontent', { text: '清空', onAction: handleClearContent })

  // 菜单项
  editor.ui.registry.addMenuItem('importword', { text: '导入Word(.docx)', onAction: handleImportWord })
  editor.ui.registry.addMenuItem('exportword', { text: '导出为Word(.docx)', onAction: handleExportWord })

  // 初始化后设置默认内容、状态栏与帮助弹窗劫持
  let leftStatusEl: HTMLElement | null = null
  let rightStatusEl: HTMLElement | null = null
  editor.on('init', () => {
    editor.setContent(props.modelValue || '')
    const statusbar = editor.getContainer && editor.getContainer().querySelector('.tox-statusbar')
    if (statusbar && (!leftStatusEl || !rightStatusEl)) {
      if (!leftStatusEl) {
        leftStatusEl = document.createElement('div')
        leftStatusEl.className = 'tox-statusbar__text'
        leftStatusEl.style.whiteSpace = 'nowrap'
        leftStatusEl.textContent = '以上内容由AI生成，仅供参考，请自行判断'
        statusbar.insertBefore(leftStatusEl, statusbar.firstChild)
      }
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
        rightStatusEl!.textContent = `字数：${count}`
      }
      update()
      editor.on('change keyup setcontent', update)
      editor.once('remove', () => editor.off('change keyup setcontent', update))
    }

    // 劫持“帮助”弹窗
    try {
      const container = editor.getContainer && editor.getContainer()
      if (container) {
        const processedHelpDlgs = new WeakSet<any>()
        const mo = new MutationObserver(() => {
          const doc = container.ownerDocument
          const dialogs = doc.querySelectorAll('.tox-dialog')
          dialogs.forEach((dlg: any) => {
            const titleEl = dlg.querySelector('.tox-dialog__title')
            const title = titleEl ? (titleEl.textContent || '') : ''
            if (!/帮助|Help/i.test(title)) return
            if (processedHelpDlgs.has(dlg)) return

            const tabButtons = dlg.querySelectorAll('[role="tab"], .tox-tab, .tox-dialog__body-nav button')
            let shortcutsTabButton: any = null
            tabButtons.forEach((btn: any) => {
              const text = (btn.textContent || '').trim()
              if (/快捷键|Shortcuts|键盘|Keyboard/i.test(text)) {
                if (!shortcutsTabButton || /快捷键|Shortcuts/.test(text)) {
                  shortcutsTabButton = btn
                }
              }
            })
            const isActive = (btn: any) => btn && (btn.getAttribute('aria-selected') === 'true' || btn.classList.contains('tox-tab--active'))
            const anyShortcutActive = Array.from(tabButtons).some((btn: any) => {
              const t = (btn.textContent || '').trim()
              return (/快捷键|Shortcuts|键盘|Keyboard/i.test(t)) && isActive(btn)
            })
            if (!anyShortcutActive && shortcutsTabButton && typeof shortcutsTabButton.click === 'function' && !isActive(shortcutsTabButton)) {
              setTimeout(() => shortcutsTabButton.click(), 0)
            }

            const removeKeywords = ['插件', 'Plugins', '版本', 'Version', '关于', 'About']
            tabButtons.forEach((btn: any) => {
              const text = (btn.textContent || '').trim()
              if (removeKeywords.some(k => text === k || text.includes(k))) {
                btn.style.display = 'none'
                const targetId = btn.getAttribute('aria-controls') || (btn.getAttribute('href') || '').replace('#','')
                if (targetId) {
                  const panel = dlg.querySelector(`#${CSS.escape(targetId)}`)
                  if (panel) (panel as HTMLElement).style.display = 'none'
                }
              }
            })
            processedHelpDlgs.add(dlg)
          })
        })
        mo.observe(container.ownerDocument.body, { childList: true, subtree: true })
        editor.once('remove', () => mo.disconnect())
      }
    } catch (e) {
      // ignore
    }
  })

  // 内容变化事件
  editor.on('change keyup undo redo', () => {
    const newContent = editor.getContent()
    content.value = newContent
    emits('update:modelValue', newContent)
  })
}

// 编辑器配置
const editorConfig = computed(() => ({
  ...props.init,
  height: props.height,
  width: props.width,
  language: 'zh-CN',

  base_url: '/tinymce',
  suffix: '.min',
  language_url: '/tinymce/tinymce-i18n/langs8/zh-CN.js',
  license_key: 'gpl',
  api_key: null,
  promotion: false,
  branding: false,
  toolbar_mode: 'wrap',
  toolbar_sticky: true,
  quickbars_selection_toolbar: 'bold italic underline | aiPolish aiContinue | forecolor backcolor | link',

  toolbar: [
    'undo redo | blocks formatselect | fontfamily fontselect | fontsize fontsizeselect | lineheight | bold italic underline strikethrough | forecolor backcolor removeformat',
    'alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist',
    'searchreplace',
    'link image media table | charmap emoticons',
    'code preview fullscreen help',
    'aiContinue aiPolish | importword exportword clearcontent',
    'print save saveas cancel new edit delete cut copy pasteword selectall'
  ].join(' | '),

  menubar: 'file edit view insert format tools table help',

  plugins: [
    'advlist', 'anchor', 'autolink', 'autosave',
    'charmap', 'code', 'codesample', 'directionality', 'emoticons',
    'fullscreen', 'help', 'image', 'importcss', 'insertdatetime',
    'link', 'lists', 'media', 'nonbreaking', 'pagebreak', 'preview',
    'quickbars', 'save', 'searchreplace', 'table', 'visualblocks',
    'visualchars'
  ],

  font_family_formats: '微软雅黑=Microsoft YaHei;宋体=SimSun;黑体=SimHei;仿宋=FangSong;楷体=KaiTi;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva',

  font_size_formats: [
    '初号=42pt','小初=36pt','一号=26pt','小一=24pt','二号=22pt','小二=18pt','三号=16pt','小三=15pt','四号=14pt','小四=12pt','五号=10.5pt','小五=9pt','六号=7.5pt','小六=6.5pt','七号=5.5pt','八号=5pt',
    '5pt 5.5pt 6pt 6.5pt 7pt 8pt 8.5pt 9pt 9.5pt 10pt 10.5pt 11pt 12pt 14pt 15pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 42pt 48pt 56pt 64pt 72pt 80pt 88pt 96pt 104pt 112pt'
  ].join(' '),

  line_height_formats: '1 1.2 1.4 1.6 1.8 2.0 2.5 3.0',

  readonly: false,
  convert_urls: false,
  paste_data_images: true,
  statusbar: true,
  resize: false,
  object_resizing: false,
  table_resize_bars: false,
  elementpath: false,

  images_upload_handler: handleImageUpload,

  content_style: `
    body { font-family: Microsoft YaHei, Arial, sans-serif; font-size: 14px; line-height: 1.6; overflow: auto; }
    table { border-collapse: collapse; width: 100%; }
    table td, table th { border: 1px solid #ccc; padding: 6px; }
    img { -webkit-user-drag: none; user-drag: none; }
    pre { background: #f7f7f7; padding: 10px; border-radius: 6px; }
    ::selection { background: #cce2fa; color: currentColor; }
    ::-moz-selection { background: #cce2fa; color: currentColor; }
  `,

  setup: handleEditorSetup
}))

// 初始化/输入/变化事件
function handleEditorInit(evt: any, editor: any) {
  editorInstance = editor
}
function handleInput() { emits('input', content.value) }
function handleChange() { emits('change', content.value) }

// 外部 v-model -> 内部同步
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) content.value = newValue || ''
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
