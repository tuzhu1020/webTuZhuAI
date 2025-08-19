<template>
  <div class="edit-box">
    <textarea ref="editorRef"></textarea>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import tinymce from 'tinymce/tinymce'
// 引入 TinyMCE 4.x 主题、皮肤与样式
import 'tinymce/themes/modern/theme'
import 'tinymce/skins/lightgray/skin.min.css'
import 'tinymce/skins/lightgray/content.min.css'

// 引入常用插件
import 'tinymce/plugins/advlist'         // 高级列表
import 'tinymce/plugins/autolink'        // 自动识别链接
import 'tinymce/plugins/lists'           // 列表
import 'tinymce/plugins/link'            // 超链接
import 'tinymce/plugins/image'           // 图片
import 'tinymce/plugins/media'           // 媒体
import 'tinymce/plugins/table'           // 表格
import 'tinymce/plugins/searchreplace'   // 查找替换
import 'tinymce/plugins/wordcount'       // 字数统计
import 'tinymce/plugins/preview'         // 预览
import 'tinymce/plugins/code'            // 源码模式
import 'tinymce/plugins/print'           // 打印
import 'tinymce/plugins/emoticons'       // 表情
import 'tinymce/plugins/insertdatetime'  // 插入日期/时间
import 'tinymce/plugins/charmap'         // 特殊字符
import 'tinymce/plugins/directionality'  // 文本方向
import 'tinymce/plugins/visualblocks'    // 可视化块
import 'tinymce/plugins/visualchars'     // 可视化字符
import 'tinymce/plugins/nonbreaking'     // 不间断空格
import 'tinymce/plugins/importcss'       // 导入自定义样式
import 'tinymce/plugins/textcolor'       // 文本颜色
import 'tinymce/plugins/fullscreen'      // 全屏模式

const props = defineProps({
  modelValue: { type: String, default: '' },     // 富文本内容
  readonly: { type: Boolean, default: false },   // 是否只读模式
  height: { type: Number, default: 300 },        // 编辑器高度
  width: { type: [String, Number], default: '100%' }, // 编辑器宽度
  fileSizes: { type: Number, default: 10 }       // 文件大小限制 (MB)
})
const emits = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let editorInstance = null

// 外部 modelValue 变化时更新内容
watch(() => props.modelValue, val => {
  if (editorInstance && editorInstance.getContent() !== val) {
    editorInstance.setContent(val || '')
  }
})

onMounted(() => {
  tinymce.init({
    target: editorRef.value,
    // 国际化中文
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    // 主题与皮肤配置
    skin: 'lightgray',
    skin_url: '/tinymce/skins/lightgray',
    base_url: '/tinymce',
    plugins: [
      'advlist autolink lists link image media table searchreplace wordcount preview code print emoticons',
      'insertdatetime charmap directionality visualblocks visualchars nonbreaking importcss textcolor fullscreen'
    ].join(' '),
    // 工具栏：字体、字号、段落格式、全屏等
    toolbar: [
      'undo redo | fontselect fontsizeselect formatselect | bold italic underline strikethrough | forecolor backcolor',
      'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | emoticons',
      'insertdatetime charmap | removeformat | code preview print fullscreen'
    ].join(' | '),
    // 自定义可选字体
    font_formats: [
      '微软雅黑=Microsoft Yahei',
      '宋体=SimSun',
      '黑体=SimHei',
      '楷体=Kaiti',
      '仿宋=FangSong',
      '隶书=LiSu',
      'Arial=arial,helvetica,sans-serif',
      'Times New Roman=times new roman,times',
      'Courier New=courier new,courier'
    ].join(';'),
    // 自定义可选字号（px 单位）
    fontsize_formats: '8px 10px 12px 14px 16px 18px 24px 32px 48px 72px',
    // 自定义段落格式，可在 formatselect 下拉中显示
    block_formats: '段落=p; 标题一=h1; 标题二=h2; 标题三=h3; 标题四=h4; 标题五=h5; 标题六=h6',
    menubar: 'file edit view insert format tools table help',
    height: props.height,
    width: props.width,
    readonly: props.readonly,
    convert_urls: false,
    paste_data_images: true,
    // 图片上传处理：限制大小，后续可替换为真实接口
    images_upload_handler(blobInfo, success, failure) {
      const size = blobInfo.blob().size
      if (size > props.fileSizes * 1024 * 1024) {
        return failure(`文件大小不能超过${props.fileSizes}MB`)
      }
      failure('上传功能未实现')
    },
    setup(editor) {
      editorInstance = editor
      editor.on('init', () => {
        editor.setContent(props.modelValue || '')
      })
      editor.on('change keyup undo redo', () => {
        emits('update:modelValue', editor.getContent())
      })
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
  
  /* 调整下拉选中和悬浮背景为白色 */
.tox .tox-collection--list .tox-collection__item--active,
.tox .tox-collection--list .tox-collection__item:hover {
  background-color: #fff !important;
  color: #333 !important;
}
  .tox .tox-collection--list .tox-collection__item--active,
  .tox .tox-collection--list .tox-collection__item:hover {
    background-color: #fff !important;
    color: #333 !important;
  }

  .edit-box :deep(.mce-content-body) {
  font-size: 14px;
  line-height: 1.6;
}
.edit-box :deep(.mce-tinymce) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.edit-box :deep(.mce-statusbar) {
  display: none;
}
</style>
