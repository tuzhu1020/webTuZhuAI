export function useTinymceWord(getEditor: () => any) {
  async function handleImportWord() {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx'
      input.onchange = async (e: any) => {
        const file = e.target.files[0]
        if (!file) return
        const arrayBuffer = await file.arrayBuffer()
        const mammoth = await import('mammoth/mammoth.browser')
        const result = await mammoth.default.convertToHtml(
          {
            arrayBuffer,
            convertImage: (mammoth as any).default.images.inline(async (element: any) => ({
              src: 'data:' + element.contentType + ';base64,' + (await element.read('base64')),
            })),
          },
          {
            includeDefaultStyleMap: true,
            styleMap: [
              "p[style-name='Title'] => h1:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Normal'] => p:fresh",
              'table => table.docx-table',
            ].join('\n'),
          },
        )
        const html = (result as any).value || ''
        const editor = getEditor()
        if (editor) editor.setContent(html)
      }
      input.click()
    } catch (err) {
      console.error('导入 Word 失败:', err)
    }
  }

  async function handleExportWord() {
    const editor = getEditor()
    if (!editor) return
    const bodyHtml = editor.getContent()
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title></head><body>${bodyHtml}</body></html>`
    try {
      const mod: any = await import('html-to-docx')
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

  return { handleImportWord, handleExportWord }
}
