<template>
  <div class="edit-box">
    <textarea ref="editorRef"></textarea>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineProps, defineEmits, nextTick } from 'vue'
import tinymce from 'tinymce/tinymce'

// 样式和插件
import 'tinymce/themes/modern/theme'
import 'tinymce/skins/lightgray/skin.min.css'
import 'tinymce/skins/lightgray/content.min.css'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/wordcount'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/code'
import 'tinymce/plugins/print'
import 'tinymce/plugins/emoticons'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/directionality'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/visualchars'
import 'tinymce/plugins/nonbreaking'
import 'tinymce/plugins/importcss'
import 'tinymce/plugins/textcolor'
import 'tinymce/plugins/fullscreen'

const props = defineProps({
  modelValue: String,
  readonly: Boolean,
  height: { type: Number, default: 300 },
  width: { type: [String, Number], default: '100%' },
  fileSizes: { type: Number, default: 10 }
})
const emits = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let editorInstance = null
let internalUpdating = false

function scrollToBottom() {
  nextTick(() => {
    if (editorInstance) {
      const doc = editorInstance.getDoc()
      const win = editorInstance.getWin()
      // 滚动 iframe 内容到最底部
      win.scrollTo(0, doc.documentElement.scrollHeight || doc.body.scrollHeight)
      // 保持焦点
      editorInstance.focus()
    }
  })
}

onMounted(() => {
  tinymce.init({
    target: editorRef.value,
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    skin_url: '/tinymce/skins/lightgray',
    base_url: '/tinymce',
    plugins: 'advlist autolink lists link image media table searchreplace wordcount preview code print emoticons insertdatetime charmap directionality visualblocks visualchars nonbreaking importcss textcolor fullscreen',
    toolbar: 'undo redo | bold italic underline | bullist numlist | link image | code preview fullscreen',
    height: props.height,
    width: props.width,
    readonly: props.readonly,
    convert_urls: false,
    paste_data_images: true,
    images_upload_handler(blobInfo, success, failure) {
      if (blobInfo.blob().size > props.fileSizes * 1024 * 1024) {
        return failure(`文件大小不能超过 ${props.fileSizes}MB`)
      }
      failure('上传功能未实现')
    },
    setup(editor) {
      editorInstance = editor
      editor.on('init', () => {
        editor.setContent(props.modelValue || '', { format: 'raw' })
        scrollToBottom()
      })
      editor.on('change keyup undo redo', () => {
        internalUpdating = true
        emits('update:modelValue', editor.getContent())
        scrollToBottom()
        internalUpdating = false
      })
    }
  })

  // 同步外部 modelValue 变化
  watch(() => props.modelValue, (val) => {
    if (!internalUpdating && editorInstance && val !== editorInstance.getContent()) {
      editorInstance.setContent(val || '', { format: 'raw' })
      scrollToBottom()
    }
  })
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.remove()
    editorInstance = null
  }
})
</script>

<style scoped lang="scss">
.edit-box {
  width: 100%;
  .tox-tinymce {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    .tox-statusbar {
      display: none;
    }
  }
}
.edit-box :deep(.ai-reply) {
  background: #f9f9f9;
  padding: 16px;
  margin: 20px 0;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  font-size: 14px;
  line-height: 1.6;
  code {
    background: #eee;
    padding: 2px 4px;
    border-radius: 4px;
  }
  pre {
    background: #f3f3f3;
    padding: 12px;
    overflow-x: auto;
    border-radius: 6px;
  }
}
</style>