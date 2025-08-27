/**
 * TinyMCE 图片上传相关的组合式函数。
 *
 * 职责：
 * - 校验图片大小是否超过上限（MB）。
 * - 预留与后端上传接口对接的入口（成功后需回传可访问的 URL）。
 *
 * 使用方式：
 * const { handleImageUpload } = useTinymceUploader(() => 5)
 * 在 TinyMCE 的 images_upload_handler 中调用 handleImageUpload
 */
export function useTinymceUploader(getMaxMB: () => number) {
  /**
   * 处理 TinyMCE 的图片上传回调。
   * @param blobInfo TinyMCE 提供的图片二进制信息
   * @param success 上传成功后的回调，需传入图片可访问 URL
   * @param failure 上传失败的回调，需传入错误消息
   */
  function handleImageUpload(blobInfo: any, success: (url: string) => void, failure: (msg: string) => void) {
    try {
      const maxMB = getMaxMB()
      if (blobInfo.blob().size > maxMB * 1024 * 1024) {
        return failure(`文件大小不能超过 ${maxMB}MB`)
      }
      // TODO: 接入你的后端上传接口，成功后调用 success(url)
      // 伪代码示例：
      // const form = new FormData();
      // form.append('file', blobInfo.blob(), blobInfo.filename());
      // const { data } = await axios.post('/api/upload/image', form);
      // success(data.url);
      return failure('上传功能未实现')
    } catch (e: any) {
      return failure(e?.message || '上传失败')
    }
  }

  return { handleImageUpload }
}
