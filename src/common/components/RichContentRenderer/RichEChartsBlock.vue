<script lang="ts" setup>
import type { ECharts, EChartsOption } from "echarts"
import * as echarts from "echarts"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: number | string
}>(), {
  height: 360
})

const chartEl = ref<HTMLElement | null>(null)
let chart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const chartHeight = computed(() => typeof props.height === "number" ? `${props.height}px` : props.height)

async function renderChart() {
  await nextTick()
  if (!chartEl.value) return

  if (!chart) {
    chart = echarts.init(chartEl.value)
  }

  chart.setOption(props.option, true)
  chart.resize()
}

onMounted(async () => {
  await renderChart()

  if (chartEl.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize()
    })
    resizeObserver.observe(chartEl.value)
  }
})

watch(
  () => props.option,
  async () => {
    await renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="rich-echarts-block">
    <div ref="chartEl" class="chart-canvas" :style="{ height: chartHeight }" />
  </div>
</template>

<style scoped lang="scss">
.rich-echarts-block {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--rich-content-border, rgba(24, 21, 17, 0.08));
  border-radius: 20px;
  background: var(--rich-content-surface, rgba(255, 251, 245, 0.72));
}

.chart-canvas {
  width: 100%;
  min-height: 260px;
}
</style>
