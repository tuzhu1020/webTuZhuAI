export function useTinymceUploader(getMaxMB: () => number) {
  function handleImageUpload(blobInfo: any, success: (url: string) => void, failure: (msg: string) => void) {
    try {
      const maxMB = getMaxMB()
      if (blobInfo.blob().size > maxMB * 1024 * 1024) {
        return failure(`文件大小不能超过 ${maxMB}MB`)
      }
      // TODO: 接入你的后端上传接口，成功后调用 success(url)
      return failure('上传功能未实现')
    } catch (e: any) {
      return failure(e?.message || '上传失败')
    }
  }

  return { handleImageUpload }
}
