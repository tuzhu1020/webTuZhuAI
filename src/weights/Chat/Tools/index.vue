<script lang="ts" setup>
import { Tooltip as ATooltip } from 'ant-design-vue'

defineOptions({
  name: 'ChatTools',
})

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})
const emits = defineEmits(['copy', 'edit'])

const tools = computed<string[]>(() => props.modelValue as string[])

const isCopied = ref<boolean>(false)

function handleCopyClick() {
  isCopied.value = true
  $message.success('已复制')
  emits('copy')

  setTimeout(() => {
    isCopied.value = false
  }, 1200)
}
</script>

<template>
  <div class="chat-tools align-center flex items-center justify-start pt-12">
    <div class="flex cursor-pointer items-center justify-center rounded-8 p-6 hover:bg-[var(--label-bg-color)]">
      <ATooltip placement="top" title="复制">
        <transition name="fade" mode="out-in">
          <img v-if="!isCopied" key="copy" class="w-20" src="@/assets/images/copy_icon.svg" alt="" @click="handleCopyClick">
          <img v-else key="copied" class="w-20" src="@/assets/images/copy_success_icon.svg" alt="">
        </transition>
      </ATooltip>
    </div>
    <div class="flex cursor-pointer items-center justify-center rounded-8 p-6 hover:bg-[var(--label-bg-color)]">
      <ATooltip placement="top" title="编辑">
        <img @click="emits('edit')" v-if="tools.includes('edit')" class="h-24 w-24" src="@/assets/images/edit_gray_icon.svg" alt="">
      </ATooltip>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
