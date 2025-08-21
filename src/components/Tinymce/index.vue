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
  height: { type: Number, default: 520 },
  width: { type: [String, Number], default: '100%' },
  fileSizes: { type: Number, default: 10 },
  init: { type: Object, default: () => ({}) }
})
const emits = defineEmits(['update:modelValue', 'change', 'input'])

const editorId = ref(`tinymce-${Date.now()}`)
const content = ref('')
let editorInstance = null

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
  
  editor.ui.registry.addButton('clearcontent', {
    text: '清空',
    tooltip: '清空编辑器内容',
    onAction: handleClearContent
  })
  
  // 添加菜单项
  editor.ui.registry.addMenuItem('importword', {
    text: '导入Word(.docx)',
    onAction: handleImportWord
  })
  
  editor.ui.registry.addMenuItem('exportword', {
    text: '导出为Word(.docx)',
    onAction: handleExportWord
  })
  
  // 编辑器初始化完成事件
  editor.on('init', () => {
    editor.setContent(props.modelValue || '')
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
  // 基础配置
  height: props.height,
  width: props.width,
  // 先合并外部传入，但下方关键项会强制覆盖，避免被外部配置破坏
  ...props.init,
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
  
  // 工具栏配置 - 中文界面
  toolbar: [
    'undo redo | formatselect fontselect fontsizeselect',
    'bold italic underline strikethrough | forecolor backcolor',
    'alignleft aligncenter alignright alignjustify | outdent indent',
    'numlist bullist | link unlink | image media table',
    'code fullscreen preview | searchreplace | help',
    'importword exportword clearcontent'
  ].join(' | '),
  
  // 菜单栏配置
  menubar: 'file edit view insert format tools table help',
  
  // 插件配置
  plugins: [
    'advlist', 'anchor', 'autolink', 'autoresize', 'autosave',
    'charmap', 'code', 'codesample', 'directionality', 'emoticons',
    'fullscreen', 'help', 'image', 'importcss', 'insertdatetime',
    'link', 'lists', 'media', 'nonbreaking', 'pagebreak', 'preview',
    'quickbars', 'save', 'searchreplace', 'table', 'visualblocks',
    'visualchars', 'wordcount'
  ],
  
  // 字体配置
  font_family_formats: '微软雅黑=Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif;苹果苹方=PingFang SC,Microsoft YaHei,sans-serif;宋体=simsun,serif;仿宋体=FangSong,serif;黑体=SimHei,sans-serif;Arial=arial,helvetica,sans-serif;Times New Roman=times new roman,times,serif;Courier New=courier new,courier,monospace',
  
  font_size_formats: '12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 56px 72px',
  
  // 行高配置
  line_height_formats: '1 1.2 1.4 1.6 1.8 2.0 2.5 3.0',
  
  // 其他配置
  readonly: false, // 确保编辑器可编辑
  convert_urls: false,
  paste_data_images: true,
  statusbar: true,
  resize: true,
  elementpath: false,
  
  // 图片上传配置
  images_upload_handler: handleImageUpload,
  
  // 内容样式
  content_style: `
    body { font-family: Microsoft YaHei, Arial, sans-serif; font-size: 14px; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; }
    table td, table th { border: 1px solid #ccc; padding: 6px; }
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
  height: 100vh;
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
