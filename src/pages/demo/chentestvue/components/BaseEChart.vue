<script lang="ts" setup>
import type { ECharts, EChartsOption } from "echarts"
import * as echarts from "echarts"

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: number | string
}>(), {
  height: 400
})

const chartEl = ref<HTMLElement | null>(null)
const chartHeight = computed(() => typeof props.height === "number" ? `${props.height}px` : props.height)

let chart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

async function renderChart() {
  await nextTick()

  if (!chartEl.value)
    return

  if (!chart)
    chart = echarts.init(chartEl.value)

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
  <div ref="chartEl" class="base-echart" :style="{ height: chartHeight }" />
</template>

<style scoped lang="scss">
.base-echart {
  width: 100%;
  min-height: 280px;
}
</style>
