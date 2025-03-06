<script setup lang="ts">
import getSysLogService from '@/service/system/getSysLogService'

import DetailDialog from '@/weights/System/OperatorLog/DetailDialog/index.vue'
import {
  Button as AButton,
  Col as ACol,
  Drawer as ADrawer,
  Input as AInput,
  Row as ARow,
  Spin as ASpin,
  Table as ATable,
} from 'ant-design-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
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
const visibleDetailDialog = ref<boolean>(false)

const columns = [
  { title: '用户名', dataIndex: 'userName', align: 'center' },
  //   { title: '最近一次提问内容', dataIndex: 'content', align: 'center' },
  { title: '累计使用次数', dataIndex: 'totalCount', align: 'center' },
  { title: '最近使用时间', dataIndex: 'lastUsedTime', align: 'center' },
  { title: '操作', dataIndex: 'action', align: 'center' },
]
const tableData = ref<Record<string, any>[]>([])
const curUserId = ref<string>('')

function search() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    requestParams.value.page = 1
    getList()
  }, 1000)
}

function reset() {
  requestParams.value.keywords = ''
  requestParams.value.page = 1
  requestParams.value.pageSize = 10
  search()
}

async function getList() {
  loading.value = true
  try {
    const { records, total }: {
      records: Record<string, any>[]
      total: number
    } = await getSysLogService({
      pageNo: requestParams.value.page,
      pageSize: requestParams.value.pageSize,
      userName: requestParams.value.keywords,
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

function handleView(id: string) {
  curUserId.value = id
  visibleDetailDialog.value = true
}

interface PaginationParams {
  current: number
  pageSize: number
}

function handlePageChange({ current, pageSize }: PaginationParams): void {
  requestParams.value.pageSize = pageSize
  requestParams.value.page = current
  getList()
}

watch(() => props.visible, (val) => {
  if (val) {
    requestParams.value.page = 1
    requestParams.value.pageSize = 10
    requestParams.value.keywords = ''
    getList()
  }
})
</script>

<template>
  <div>
    <ADrawer
      v-model:open="visible"
      class="custom-class"
      root-class-name="root-class-name"
      :root-style="{ color: 'blue' }"
      title="操作日志"
      placement="right"
      width="72%"
    >
      <div class="mb-64">
        <ARow :gutter="24">
          <ACol :span="8">
            <div class="flex items-center">
              <span class="flex-0 w-60 text-16 color-#333">姓名：</span>
              <AInput
                v-model:value="requestParams.keywords"
                placeholder="请输入姓名"
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
      </div>
      <ASpin :spinning="loading">
        <ATable
          class="ant-table-striped"
          size="middle"
          :columns="columns"
          :data-source="tableData"
          :pagination="{
            current: requestParams.page,
            pageSize: requestParams.pageSize,
            total: requestParams.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }"
          @change="handlePageChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'action'">
              <AButton type="link" @click="handleView(record.userId)">
                查看
              </AButton>
            </template>
          </template>
        </ATable>
      </ASpin>
    </ADrawer>

    <DetailDialog v-model:visible="visibleDetailDialog" :user-id="curUserId" />
  </div>
</template>

<style scoped lang="scss">
.ant-table-striped :deep(.table-striped) td {
  background-color: #fafafa;
}
</style>
