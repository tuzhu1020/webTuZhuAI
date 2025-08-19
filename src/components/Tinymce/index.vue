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
// 开源实现的 Word 导入/导出（非 TinyMCE 官方插件）
import mammoth from 'mammoth/mammoth.browser'
// 注：html-to-docx 在部分浏览器打包环境下会有兼容性问题，这里改为点击时动态加载
// 说明：当前工程使用的是旧版 TinyMCE 主题与皮肤（modern/lightgray），以下按已显式引入的插件进行配置，避免引用不存在的插件导致报错。

const props = defineProps({
  modelValue: String,
  readonly: Boolean,
  height: { type: Number, default: 0 },
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

// 将编辑器高度设置为视口高度，并在窗口尺寸变化时自适应
function resizeEditorToViewport() {
  if (!editorInstance) return
  // 优先使用容器的可见高度，避免与父容器多重 vh 导致溢出
  const container = editorInstance.getContainer()
  const rootBox = container?.closest('.edit-box')
  const h = (rootBox && rootBox.clientHeight) || window.innerHeight // 目标高度
  // 使用主题提供的 resizeTo（modern 主题支持）
  try {
    if (editorInstance.theme && typeof editorInstance.theme.resizeTo === 'function') {
      editorInstance.theme.resizeTo(null, h)
    } else {
      // 兜底：直接设置容器高度
      if (container) container.style.height = h + 'px'
    }
  } catch (e) {
    if (container) container.style.height = h + 'px'
  }
}

onMounted(() => {
  tinymce.init({
    // 目标元素：绑定到 template 中的 textarea
    target: editorRef.value,
    // 语言：中文
    language: 'zh_CN',
    // 语言包地址：需要在站点提供 /tinymce/langs/zh_CN.js
    language_url: '/tinymce/langs/zh_CN.js',
    // 皮肤资源地址：与当前旧版样式保持一致（lightgray）
    skin_url: '/tinymce/skins/lightgray',
    // 基础资源根路径：用于加载插件/皮肤等静态资源
    base_url: '/tinymce',
    // 插件列表（仅包含已在顶部显式引入的插件）
    // advlist, autolink, lists, link, image, media, table, searchreplace, wordcount,
    // preview, code, print, emoticons, insertdatetime, charmap, directionality,
    // visualblocks, visualchars, nonbreaking, importcss, textcolor, fullscreen
    plugins: [
      'advlist autolink lists link image media table',
      'searchreplace wordcount preview code print',
      'emoticons insertdatetime charmap directionality',
      'visualblocks visualchars nonbreaking importcss textcolor fullscreen'
    ].join(' '),
    // 工具栏：根据已启用插件尽量罗列常用按钮
    toolbar: [
      // 撤销/重做
      'undo redo |',
      // 字体样式
      'bold italic underline strikethrough forecolor backcolor |',
      // 标题/段落/对齐
      'formatselect fontselect fontsizeselect | alignleft aligncenter alignright alignjustify |',
      // 列表/缩进
      'bullist numlist outdent indent |',
      // 链接/锚点
      'link unlink |',
      // 图片/媒体/表格
      'image media table |',
      // 代码/块代码/查找替换
      'code searchreplace |',
      // 时间/字符
      'insertdatetime charmap |',
      // 预览/全屏
      'preview fullscreen |',
      // 自定义：清空/导入/导出 Word
      'clearcontent | importword exportword'
    ].join(' '),
    // 菜单栏：开启并自定义顺序（移除未引入插件的相关项）
    menubar: 'file edit view insert format table', // 菜单栏显示项
    // 菜单项配置：细化各菜单包含的命令
    menu: {
      file: { title: '文件', items: 'newdocument | importword exportword | preview print' }, // 文件菜单
      edit: { title: '编辑', items: 'undo redo | cut copy paste | selectall | searchreplace' }, // 编辑菜单
      view: { title: '查看', items: 'code | visualaid visualblocks visualchars | preview | fullscreen' }, // 查看菜单
      insert: { title: '插入', items: 'link image media table | charmap emoticons insertdatetime' }, // 插入菜单
      format: { title: '格式', items: 'bold italic underline strikethrough | forecolor backcolor | align | removeformat' }, // 格式菜单
      table: { title: '表格', items: 'inserttable | cell row column | tableprops deletetable' } // 表格菜单
    },
    // 高度/宽度：来自外部 props
    height: props.height,
    width: props.width,
    // 只读：true 则不可编辑
    readonly: props.readonly,
    // URL 转换：关闭自动相对路径转换，保留原始链接
    convert_urls: false,
    // 黏性工具栏：部分旧版不支持，若需固定可通过 CSS/布局实现
    // 品牌版权：隐藏 “Powered by Tiny”
    branding: false,
    // 状态栏：显示在编辑器底部（可根据需要隐藏）
    statusbar: true, // 显示状态栏
    resize: false , //  禁止拖拽缩放
    elementpath : false,  // 隐藏元素路径
    // 粘贴：允许粘贴图片（base64），并保留样式（需要 paste 插件才完全生效）
    paste_data_images: true,
    // 字体与段落格式
    // 字号：提供接近 WPS 的丰富 pt 列表（含中文字号对应常见值）
    // 中文字号常见对照：
    // 一号=26pt，小一=24pt，二号=22pt，小二=18pt，三号=16pt，小三=15pt，四号=14pt，小四=12pt，
    // 五号=10.5pt，小五=9pt，六号=7.5pt，小六=6.5pt，七号=5.5pt，八号=5pt
      fontsize_formats: [
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
    // fontsize_formats: '5pt 5.5pt 6.5pt 7.5pt 8pt 9pt 10pt 10.5pt 11pt 12pt 14pt 15pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 48pt 56pt 72pt', // 字号列表（pt）
    //   fontsize_formats:'初号 小初 一号 小一 二号 小二 三号 小三 四号 小四  五号 小五 六号 小六 七号 小七 八号 小八 九号 小九 5pt 5.5pt 6pt 6.5pt 7pt 8pt 8.5pt 9pt 9.5pt 10pt 10.5pt 11pt 12pt 14pt 15pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 32pt 36pt 42pt 48pt 56pt 64pt 72pt 80pt 88pt 96pt 104pt 112pt',
    font_formats: '微软雅黑=Microsoft YaHei;宋体=SimSun;黑体=SimHei;仿宋=FangSong;楷体=KaiTi;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva', // 字体列表
    block_formats: '段落=p;标题1=h1;标题2=h2;标题3=h3;标题4=h4;标题5=h5;标题6=h6;预格式化=pre', // 块级格式
    // 将中文字号以样式形式加入格式菜单，便于直接选择（与 formatselect/字体大小下拉兼容）
    style_formats_merge: true, // 与默认样式项合并显示
    style_formats: [
      { title: '中文字号', items: [
        { title: '初号', inline: 'span', styles: { 'font-size': '42pt' } },
        { title: '小初', inline: 'span', styles: { 'font-size': '36pt' } },
        { title: '一号', inline: 'span', styles: { 'font-size': '26pt' } },
        { title: '小一', inline: 'span', styles: { 'font-size': '24pt' } },
        { title: '二号', inline: 'span', styles: { 'font-size': '22pt' } },
        { title: '小二', inline: 'span', styles: { 'font-size': '18pt' } },
        { title: '三号', inline: 'span', styles: { 'font-size': '16pt' } },
        { title: '小三', inline: 'span', styles: { 'font-size': '15pt' } },
        { title: '四号', inline: 'span', styles: { 'font-size': '14pt' } },
        { title: '小四', inline: 'span', styles: { 'font-size': '12pt' } },
        { title: '五号', inline: 'span', styles: { 'font-size': '10.5pt' } },
        { title: '小五', inline: 'span', styles: { 'font-size': '9pt' } },
        { title: '六号', inline: 'span', styles: { 'font-size': '7.5pt' } },
        { title: '小六', inline: 'span', styles: { 'font-size': '6.5pt' } },
        { title: '七号', inline: 'span', styles: { 'font-size': '5.5pt' } },
        { title: '八号', inline: 'span', styles: { 'font-size': '5pt' } }
      ]}
    ],
    // 为导入的 Word（经 mammoth 转换）提供更接近原稿的基础样式
    content_style: `
      /* 表格视觉 */
      table.docx-table { border-collapse: collapse; width: 100%; }
      table.docx-table td, table.docx-table th { border: 1px solid #ccc; padding: 6px; }
      /* 列表缩进 */
      ul, ol { margin-left: 24px; }
      /* 段落间距与行高（适度模拟） */
      p { margin: 8px 0; line-height: 1.6; }
      h1, h2, h3, h4, h5, h6 { margin: 12px 0 8px; }
    `,
    // 链接设置（基础）
    // 注：部分高级链接参数在旧版中不可用
    // 图片设置与上传
    image_caption: true, // 图片标题
    image_advtab: true, // 图片高级设置
    image_title: true, // 选择图片时可编辑标题
    image_dimensions: true, // 允许设置图片尺寸
    images_reuse_filename: true, // 上传时复用文件名
    images_upload_credentials: true, // 携带凭证（如需要鉴权）
    // 自定义图片上传：按项目接口替换为成功回调
    images_upload_handler(blobInfo, success, failure) {
      // 大小校验（MB）
      if (blobInfo.blob().size > props.fileSizes * 1024 * 1024) {
        return failure(`文件大小不能超过 ${props.fileSizes}MB`)
      }
      // TODO: 在此发起实际上传请求，成功后调用 success(url)
      // 示例：success('https://your.cdn.com/path/to/image.png')
      failure('上传功能未实现') // 当前未对接上传接口
    },
    // 自定义文件选择器（如需要手动选择本地文件处理）
    file_picker_types: 'image media', // 允许图片/媒体
    file_picker_callback(callback, value, meta) {
      // TODO: 打开自定义文件选择器，选择后调用 callback(url, { meta })
      // 例：callback('https://your.cdn.com/path/file.png', { title: '自定义文件' })
    },
    // 表格默认设置
    table_default_attributes: { border: '1' }, // 默认边框
    table_default_styles: { width: '100%', borderCollapse: 'collapse' }, // 默认样式
    // 内容样式：可覆盖编辑区域默认样式
    content_style: 'body{font-family:Microsoft YaHei,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;} pre{background:#f7f7f7;padding:10px;border-radius:6px;}',
    // 禁止元素列表：可按需屏蔽标签（示例为空表示不禁用）
    invalid_elements: '',
    // 允许元素列表：为空表示遵循默认 schema
    valid_elements: '*[*]',
    // 方向性：支持从右到左语言
    directionality: 'ltr',
    // 初始化与变更事件
    setup(editor) {
      editorInstance = editor
      // 共同处理函数
      const handleImportWord = async () => {
        try {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.docx'
          input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const arrayBuffer = await file.arrayBuffer()
            // 使用 mammoth 提升保真度：内联图片 + styleMap
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
                  // 表格添加类，便于用 content_style 控制外观
                  'table => table.docx-table',
                  // 文字强调/加粗样式映射（若 Word 使用了自定义字符样式）
                  "r[style-name='Emphasis'] => em",
                  "r[style-name='Strong'] => strong"
                ].join('\n')
              }
            )
            const html = result.value || ''
            editor.setContent(html, { format: 'raw' })
          }
          input.click()
        } catch (err) {
          console.error('导入 Word 失败:', err)
        }
      }

      // 清空内容
      const handleClearContent = () => {
        const ok = window.confirm('确定要清空编辑器内容吗？此操作不可撤销。')
        if (!ok) return
        editor.setContent('', { format: 'raw' })
        emits('update:modelValue', '')
      }
      const handleExportWord = async () => {
        const bodyHtml = editor.getContent({ format: 'html' })
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title></head><body>${bodyHtml}</body></html>`
        try {
          // 尝试动态加载 html-to-docx 生成 docx
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
          // 回退方案：以 HTML 方式导出为 .doc（Word 可直接打开）
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

      // v4 自定义按钮
      editor.addButton('importword', {
        text: '导入Word', tooltip: '从 .docx 导入', icon: false, onclick: handleImportWord
      })
      editor.addButton('exportword', {
        text: '导出Word', tooltip: '导出为 .docx', icon: false, onclick: handleExportWord
      })
      editor.addButton('clearcontent', {
        text: '清空', tooltip: '清空编辑器内容', icon: false, onclick: handleClearContent
      })

      // 文件菜单项（v4）
      editor.addMenuItem('importword', { text: '导入Word(.docx)', context: 'file', onclick: handleImportWord })
      editor.addMenuItem('exportword', { text: '导出为Word(.docx)', context: 'file', onclick: handleExportWord })
      editor.addMenuItem('clearcontent', { text: '清空内容', context: 'edit', onclick: handleClearContent })
      // 初始化完成：设置初始内容并滚动
      editor.on('init', () => {
        editor.setContent(props.modelValue || '', { format: 'raw' }) // 设置初始内容
        scrollToBottom() // 初始化后滚动至底部
        // 注入自定义状态栏内容（保留原有字数统计等）
        // 兼容 v5/v6（tox-）与 v4（mce-）状态栏选择器
        const statusbar = editor.getContainer()?.querySelector('.tox-statusbar, .mce-statusbar')
        if (statusbar) {
          // 左侧提示文案
          const left = document.createElement('div')
          left.style.margin = '0 20px'
          left.style.color = 'rgba(33, 56, 95, 0.45)'
          left.textContent = '以上内容由AI生成，仅供参考'
          statusbar.insertBefore(left, statusbar.firstChild)

          // 右侧品牌 logo
          const logo = document.createElement('div')
          logo.id = 'aigcTips'
          logo.style.background = 'url("images/deepseeklogo.png") 0% 0% / contain no-repeat'
          logo.style.margin = '0 20px'
          logo.style.display = 'block'
          logo.style.cursor = 'pointer'
          logo.style.width = '100px'
          logo.style.height = '18px'
          logo.style.position = 'relative'
          statusbar.appendChild(logo)
        }

        // 初始按视口高度调整
        resizeEditorToViewport()
        // 监听窗口尺寸变化，同步调整编辑器高度
        window.addEventListener('resize', resizeEditorToViewport)
      })
      // 内容变化：同步 v-model 并保持滚动到底部
      editor.on('change keyup undo redo', () => {
        internalUpdating = true
        emits('update:modelValue', editor.getContent())
        scrollToBottom()
        internalUpdating = false
      })
      // 焦点事件：可根据需要处理
      editor.on('focus', () => {}) // 获得焦点
      editor.on('blur', () => {}) // 失去焦点
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
  // 移除窗口监听
  window.removeEventListener('resize', resizeEditorToViewport)
})
</script>

<style scoped lang="scss">
.edit-box {
  width: 100%;
  height: 100vh; // 让容器充满视口高度
//   display: flex;
  flex-direction: column;
  .tox-tinymce {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    height: 100%; // 编辑器整体占满容器高度
    display: flex;
    flex-direction: column;
  }
  // 兼容 TinyMCE v4（modern/lightgray 对应 mce- 前缀）
  :deep(.mce-tinymce) {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
// 让编辑区域占据剩余空间并内部可滚动
.edit-box :deep(.tox-editor-container),
.edit-box :deep(.tox-edit-area) {
  flex: 1 1 auto;
}
.edit-box :deep(.tox-edit-area iframe) {
  height: 100% !important;
}
// v4 编辑器主体容器，使用 flex 布局以确保状态栏可见
.edit-box :deep(.mce-tinymce > .mce-container-body) {
  display: flex; // 仅作用于顶层容器，避免影响工具栏内部布局
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; // 允许子元素在容器内收缩
}
.edit-box :deep(.mce-toolbar-grp) {
  flex: 0 0 auto;
}
.edit-box :deep(.mce-edit-area) {
  flex: 1 1 auto;
  position: relative;
}
.edit-box :deep(.mce-edit-area iframe) {
  height: 100% !important;
}
.edit-box :deep(.mce-statusbar) {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}
/* 将字数统计显示在状态栏右侧（v4 与 v5/6） */
.edit-box :deep(.mce-statusbar .mce-container-body) {
  margin-left: auto;
}
// .edit-box :deep(.mce-container-body) {
//   margin-left: auto;
// }
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