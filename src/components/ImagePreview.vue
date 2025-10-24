<template>
  <el-image-viewer
    :url-list="srcList"
    :initial-index="initialIndex"
    @close="handleClose"
  />
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  srcList: string[],
  initialIndex: number
}>()
const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>