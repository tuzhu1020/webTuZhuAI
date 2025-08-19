<template>
  <div>
    <Tinymce v-model="richText" style="min-height: 400px;" />
 
  </div>
</template>

<script setup>
import { ref } from 'vue';
// Tinymce 组件已全局自动引入，无需手动import
const richText = ref('');
</script>
