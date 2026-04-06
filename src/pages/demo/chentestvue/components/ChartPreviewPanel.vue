<script lang="ts" setup>
import type { EChartsOption } from "echarts"
import type { BuildChartOptions, DataRow, InferredDataShape, SupportedChartType } from "../echarts-option-builder"
import { buildChartOptionsByMetrics, buildEChartsOption, inferDataShape } from "../echarts-option-builder"
import BaseEChart from "./BaseEChart.vue"

defineOptions({
  name: "ChartPreviewPanel"
})

const props = withDefaults(defineProps<{
  sourceData: string | DataRow[]
  panelTitle?: string
  chartTitle?: string
  height?: number | string
  defaultChartType?: SupportedChartType
}>(), {
  panelTitle: "图表预览",
  chartTitle: "数据转 ECharts 配置测试",
  height: 420,
  defaultChartType: "bar"
})

const emit = defineEmits<{
  optionChange: [option: EChartsOption]
  shapeChange: [shape: InferredDataShape]
  errorChange: [message: string]
}>()

const chartType = ref<SupportedChartType>(props.defaultChartType)
const selectedMetric = ref("")

const chartTypeOptions: Array<{ label: string, value: SupportedChartType }> = [
  { label: "柱状图", value: "bar" },
  { label: "折线图", value: "line" },
  { label: "饼图", value: "pie" }
]

const parsedState = computed<{ rows: DataRow[], error: string }>(() => {
  if (Array.isArray(props.sourceData)) {
    return {
      rows: props.sourceData,
      error: ""
    }
  }

  try {
    const value = JSON.parse(props.sourceData)
    if (!Array.isArray(value)) {
      return {
        rows: [],
        error: "请输入 JSON 数组，例如 [{\"日期\":\"2026-02-06\",\"金额\":100}]"
      }
    }

    return {
      rows: value as DataRow[],
      error: ""
    }
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : "JSON 解析失败"
    }
  }
})

const parsedRows = computed(() => parsedState.value.rows)
const parseError = computed(() => parsedState.value.error)
const inferredShape = computed(() => inferDataShape(parsedRows.value))

const builderOptions = computed<BuildChartOptions>(() => ({
  chartType: chartType.value,
  title: props.chartTitle
}))

const optionMap = computed(() => {
  if (parseError.value)
    return {}

  return buildChartOptionsByMetrics(parsedRows.value, builderOptions.value)
})

const metricTabs = computed(() => Object.keys(optionMap.value))

const currentChartOption = computed<EChartsOption>(() => {
  if (parseError.value) {
    return {
      title: {
        text: "请输入有效的 JSON 数组"
      },
      xAxis: {
        type: "category",
        data: []
      },
      yAxis: {
        type: "value"
      },
      series: []
    }
  }

  if (selectedMetric.value && optionMap.value[selectedMetric.value])
    return optionMap.value[selectedMetric.value] as unknown as EChartsOption

  return buildEChartsOption(parsedRows.value, builderOptions.value) as unknown as EChartsOption
})

watch(metricTabs, (tabs) => {
  if (!tabs.length) {
    selectedMetric.value = ""
    return
  }

  if (!selectedMetric.value || !tabs.includes(selectedMetric.value))
    selectedMetric.value = tabs[0]
}, { immediate: true })

watch(chartType, () => {
  selectedMetric.value = ""
})

watch(inferredShape, value => emit("shapeChange", value), { immediate: true, deep: true })
watch(parseError, value => emit("errorChange", value), { immediate: true })
watch(currentChartOption, value => emit("optionChange", value), { immediate: true, deep: true })
</script>

<template>
  <el-card shadow="never" class="chart-preview-panel">
    <template #header>
      <div class="chart-preview-panel__header">
        <div class="chart-preview-panel__title">
          {{ panelTitle }}
        </div>
        <el-segmented v-model="chartType" :options="chartTypeOptions" />
      </div>
    </template>

    <el-alert
      v-if="parseError"
      title="JSON 解析失败"
      type="error"
      :description="parseError"
      :closable="false"
      show-icon
      class="chart-preview-panel__alert"
    />

    <div v-if="metricTabs.length" class="chart-preview-panel__tabs">
      <button
        v-for="metricName in metricTabs"
        :key="metricName"
        type="button"
        class="chart-preview-panel__tab"
        :class="{ 'is-active': selectedMetric === metricName }"
        @click="selectedMetric = metricName"
      >
        {{ metricName }}
      </button>
    </div>

    <BaseEChart :option="currentChartOption" :height="height" />
  </el-card>
</template>

<style scoped lang="scss">
.chart-preview-panel {
  border: 1px solid rgba(29, 78, 216, 0.12);
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.28), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.98));
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.chart-preview-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.chart-preview-panel__title {
  color: #163a9a;
  font-size: 16px;
  font-weight: 700;
}

.chart-preview-panel__alert {
  margin-bottom: 16px;
}

.chart-preview-panel__tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 14px;
  margin-bottom: 12px;
}

.chart-preview-panel__tab {
  flex-shrink: 0;
  padding: 10px 16px;
  border: 1px solid rgba(29, 78, 216, 0.14);
  border-radius: 999px;
  color: #31518f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.88);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.chart-preview-panel__tab.is-active {
  border-color: #2563eb;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

@media (width <= 768px) {
  .chart-preview-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
