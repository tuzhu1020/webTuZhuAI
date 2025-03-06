<script setup lang="ts">
import { StyleProvider as AStyleProvider, legacyLogicalPropertiesTransformer } from 'ant-design-vue'
</script>

<template>
  <div>
    <AStyleProvider hash-priority="high" :transformers="[legacyLogicalPropertiesTransformer]">
      <RouterView />
    </AStyleProvider>
  </div>
</template>

<style>
  html,
body {
  overflow: hidden;
}
</style>
