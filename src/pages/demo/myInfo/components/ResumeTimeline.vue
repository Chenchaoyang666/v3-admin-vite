<script lang="ts" setup>
import type { Component } from "vue"

const props = defineProps<{
  items: Record<string, any>[] | undefined
  title: string
  icon: Component
  color: string
  visibleMap: Record<number, boolean>
  timestampKey: string
  timestampSuffix?: string
}>()

function getTimestamp(item: Record<string, any>): string {
  const val = item[props.timestampKey] ?? ""
  return props.timestampSuffix ? `${val}${val ? ` - ${props.timestampSuffix}` : ""}` : val
}
</script>

<template>
  <div v-if="items?.length" class="resume-section">
    <div class="section-header">
      <el-icon class="section-icon" :color="color">
        <component :is="icon" />
      </el-icon>
      <h3 class="section-title">
        {{ title }}
      </h3>
    </div>
    <el-timeline class="custom-timeline">
      <el-timeline-item
        v-for="(item, index) in items"
        :key="index"
        :timestamp="getTimestamp(item)"
        placement="top"
        :color="color"
        class="timeline-item"
        :class="{ visible: visibleMap[index] }"
      >
        <div class="timeline-content">
          <slot :item="item" />
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
.resume-section {
  margin-bottom: 48px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;

    .section-icon {
      font-size: 22px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--el-color-primary-light-5);
    }
  }
}

.custom-timeline {
  padding-left: 8px;

  :deep(.el-timeline-item__timestamp) {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.el-timeline-item__tail) {
    left: 4px;
  }

  :deep(.el-timeline-item__node) {
    left: -2px;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 28px;
  }
}

.timeline-item {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-content {
  padding: 16px;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateX(4px);
  }

  :deep(.item-title) {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  :deep(.item-subtitle) {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-color-primary);
    margin: 0 0 12px 0;
  }

  :deep(.item-description) {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.7;
    margin: 0 0 12px 0;
  }

  :deep(.tech-stack) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;

    .tech-label {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      font-weight: 500;
    }

    .tech-items {
      color: var(--el-color-warning);
      font-size: 14px;
    }
  }
}

@media (max-width: 768px) {
  .resume-section .section-header .section-title {
    font-size: 18px;
  }
}
</style>
