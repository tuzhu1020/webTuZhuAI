<script setup lang="ts">
import { AI_BASE_URL } from '@/config'
import downloadFileService from '@/service/chat/downloadFileService'
import { Button as AButton, Drawer as ADrawer, Empty as AEmpty } from 'ant-design-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Array,
    default: () => [],
  },
})

const simpleImage = AEmpty.PRESENTED_IMAGE_SIMPLE

const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
})

const dataList = computed(() => {
  return props.data
})

async function handleDownload(filepath: string) {
  // 判断是不是http或者https链接
  if (filepath?.trim().startsWith('http://') || filepath?.trim().startsWith('https://')) {
    window.open(filepath)
    return
  }
  
  window.open(`${AI_BASE_URL}/get_file?filepath=${filepath}`)
}
</script>

<template>
  <div>
    <ADrawer
      :open="visible"
      title="搜索结果"
      width="540px"
      :destroy-on-close="true"
      :get-container="false"
      @close="() => (visible = false)"
    >
      <!-- <template #extra>
        <AButton type="primary" @click="() => (visible = false)">
          关闭
        </AButton>
      </template> -->
      <div>
        <div v-for="(item, index) in dataList" :key="index" class="mb-24 overflow-hidden rounded-2xl bg-white p-x-24 p-y-12 shadow-xl transition-all duration-200 hover:transform-scale-102 hover:bg-[var(--sidebar-hover)]">
          <div class="mb-12 flex items-center justify-between text-16 font-600">
            <div v-text="item.filename" />
            <AButton type="primary" size="small" class="ml-8" @click="handleDownload(item.filepath)">
              下载
            </AButton>
          </div>
          <div class="file-content text-14 color-[var(--text-desc-color)] lh-[1.4em] tracking-wider" v-html="item.text" />
        </div>

        <AEmpty v-if="!dataList.length" :image="simpleImage" />
      </div>
    </ADrawer>
  </div>
</template>

<style lang="scss" scoped>
.file-content {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  word-break: break-all;
}
</style>
