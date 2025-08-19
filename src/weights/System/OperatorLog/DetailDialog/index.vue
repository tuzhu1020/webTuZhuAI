<script setup lang="ts">
import getSysLogDetailService from '@/service/system/getSysLogDetailService'

import {
  Button as AButton,
  Col as ACol,
  Input as AInput,
  Modal as AModal,
  Row as ARow,
  Spin as ASpin,
  Table as ATable,
} from 'ant-design-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: String,
    default: '',
  },
})

const visible = defineModel('visible', {
  type: Boolean,
  default: false,
})

const loading = ref<boolean>(false)
const requestParams = ref<Record<string, any>>({
  page: 1,
  pageSize: 10,
  total: 0,
  keywords: '',
})

const columns = [
  { title: '用户名', dataIndex: 'userName', align: 'center' },
  //   { title: '标题', dataIndex: 'title', align: 'center' },
  { title: '最近使用时间', dataIndex: 'lastUsedTime', align: 'center' },
//   { title: '操作', dataIndex: 'action', align: 'center' },
]
const tableData = ref<Record<string, any>[]>([])

function search() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    requestParams.value.page = 1
    getDetail()
  }, 1000)
}

function reset() {
  requestParams.value.keywords = ''
  requestParams.value.page = 1
  requestParams.value.pageSize = 10
  search()
}

async function getDetail() {
  loading.value = true
  try {
    const { records, total }: {
      records: Record<string, any>[]
      total: number
    } = await getSysLogDetailService({
      pageNo: requestParams.value.page,
      pageSize: requestParams.value.pageSize,
      userId: props.userId,
      title: requestParams.value.keywords,
    }) as any
    tableData.value = records || []
    requestParams.value.total = total
  }
  catch (message: any) {
    $message.error(message)
  }
  finally {
    loading.value = false
  }
}

function handlePageChange({ current, pageSize }) {
  requestParams.value.pageSize = pageSize
  requestParams.value.page = current
  getDetail()
}

watch(() => props.visible, (val) => {
  if (val) {
    reset()
  }
}, { immediate: true })
</script>

<template>
  <div>
    <AModal v-model:open="visible" width="56%" title="详情" @ok="visible = false" @cancel="visible = false">
      <div class="pt-24">
        <!-- <div class="mb-64 mt-32">
          <ARow :gutter="24">
            <ACol :span="8">
              <div class="flex items-center">
                <span class="flex-0 w-60 text-16 color-#333">标题：</span>
                <AInput
                  v-model:value="requestParams.keywords"
                  placeholder="请输入标题"
                  @keyup.enter="search"
                />
              </div>
            </ACol>
            <ACol :span="8">
              <AButton class="mr-12" type="primary" @click="search">
                搜索
              </AButton>
              <AButton @click="reset">
                重置
              </AButton>
            </ACol>
          </ARow>
        </div> -->
        <ASpin :spinning="loading">
          <ATable
            class="ant-table-striped"
            size="middle"
            :columns="columns"
            :data-source="tableData"
            :pagination="{
              pageSize: requestParams.pageSize,
              current: requestParams.page,
              total: requestParams.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }"
            @change="handlePageChange"
          />
        </ASpin>
      </div>
    </AModal>
  </div>
</template>

<style lang="scss" scoped>

</style>
