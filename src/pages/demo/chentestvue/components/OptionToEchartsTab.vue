<script lang="ts" setup>
import type { EChartsOption } from "echarts"
import type { BranchPeriodWarningRow } from "../mock-branch-period-warning"
import type { BranchWarningRow } from "../mock-branch-warning"
import type { WarningAccuracyRow } from "../mock-warning-accuracy"
import type { WarningColorRatioRow } from "../mock-warning-color-ratio"
import type { WarningIndustryRow } from "../mock-warning-industry"
import { branchPeriodWarningMockData, buildBranchPeriodWarningComboOption } from "../mock-branch-period-warning"
import warningBranchPeriodMockJsonSource from "../mock-branch-period-warning-data.json?raw"
import warningBranchPeriodModuleSource from "../mock-branch-period-warning.ts?raw"
import { branchWarningMockData, buildBranchWarningBarOption } from "../mock-branch-warning"
import warningBranchMockJsonSource from "../mock-branch-warning-data.json?raw"
import warningBranchModuleSource from "../mock-branch-warning.ts?raw"
import { buildWarningAccuracyComboOption, warningAccuracyMockData } from "../mock-warning-accuracy"
import warningAccuracyMockJsonSource from "../mock-warning-accuracy-data.json?raw"
import warningAccuracyModuleSource from "../mock-warning-accuracy.ts?raw"
import { buildWarningColorRatioLineOption, warningColorRatioMockData } from "../mock-warning-color-ratio"
import warningColorRatioMockJsonSource from "../mock-warning-color-ratio-data.json?raw"
import warningColorRatioModuleSource from "../mock-warning-color-ratio.ts?raw"
import { buildTop5LineOption, warningIndustryMockData } from "../mock-warning-industry"
import warningIndustryMockJsonSource from "../mock-warning-industry-data.json?raw"
import warningIndustryModuleSource from "../mock-warning-industry.ts?raw"
import BaseEChart from "./BaseEChart.vue"

defineOptions({
  name: "OptionToEchartsTab"
})

interface PresetOptionSource {
  id: string
  label: string
  mockFileName: string
  transformName: string
  mockData: object[]
  buildOption: (data: object[]) => EChartsOption
  mockSourceText: string
  transformSourceText: string
}

interface SelectOption {
  label: string
  value: string
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractNamedFunctionSource(sourceText: string, functionName: string) {
  const pattern = new RegExp(
    `export function ${escapeRegExp(functionName)}[\\s\\S]*?^}\\n?(?=\\n(?:export\\s+(?:const|function|interface|type)|const|function|interface|type)|$)`,
    "m"
  )

  return sourceText.match(pattern)?.[0]?.trim() || sourceText.trim()
}

const presetOptionSources: PresetOptionSource[] = [
  {
    id: "branch-warning-horizontal-bar",
    label: "机构分行横向柱状图",
    mockFileName: "mock-branch-warning-data.json",
    transformName: "buildBranchWarningBarOption",
    mockData: branchWarningMockData,
    buildOption: data => buildBranchWarningBarOption(data as BranchWarningRow[]),
    mockSourceText: warningBranchMockJsonSource.trim(),
    transformSourceText: extractNamedFunctionSource(warningBranchModuleSource, "buildBranchWarningBarOption")
  },
  {
    id: "branch-period-warning-combo",
    label: "分行报告期柱线混合图",
    mockFileName: "mock-branch-period-warning-data.json",
    transformName: "buildBranchPeriodWarningComboOption",
    mockData: branchPeriodWarningMockData,
    buildOption: data => buildBranchPeriodWarningComboOption(data as BranchPeriodWarningRow[]),
    mockSourceText: warningBranchPeriodMockJsonSource.trim(),
    transformSourceText: extractNamedFunctionSource(warningBranchPeriodModuleSource, "buildBranchPeriodWarningComboOption")
  },
  {
    id: "warning-industry-top5-line",
    label: "行业 Top5 折线图",
    mockFileName: "mock-warning-industry-data.json",
    transformName: "buildTop5LineOption",
    mockData: warningIndustryMockData,
    buildOption: data => buildTop5LineOption(data as WarningIndustryRow[]),
    mockSourceText: warningIndustryMockJsonSource.trim(),
    transformSourceText: extractNamedFunctionSource(warningIndustryModuleSource, "buildTop5LineOption")
  },
  {
    id: "warning-color-ratio-line",
    label: "三色预警占比折线图",
    mockFileName: "mock-warning-color-ratio-data.json",
    transformName: "buildWarningColorRatioLineOption",
    mockData: warningColorRatioMockData,
    buildOption: data => buildWarningColorRatioLineOption(data as WarningColorRatioRow[]),
    mockSourceText: warningColorRatioMockJsonSource.trim(),
    transformSourceText: extractNamedFunctionSource(warningColorRatioModuleSource, "buildWarningColorRatioLineOption")
  },
  {
    id: "warning-accuracy-combo",
    label: "预警事项数准确率柱线图",
    mockFileName: "mock-warning-accuracy-data.json",
    transformName: "buildWarningAccuracyComboOption",
    mockData: warningAccuracyMockData,
    buildOption: data => buildWarningAccuracyComboOption(data as WarningAccuracyRow[]),
    mockSourceText: warningAccuracyMockJsonSource.trim(),
    transformSourceText: extractNamedFunctionSource(warningAccuracyModuleSource, "buildWarningAccuracyComboOption")
  }
]

const mockFileOptions = computed<SelectOption[]>(() => {
  const uniqueNames = [...new Set(presetOptionSources.map(item => item.mockFileName))]
  return uniqueNames.map(name => ({ label: name, value: name }))
})

const transformOptions = computed<SelectOption[]>(() => {
  const uniqueNames = [
    ...new Set(
      presetOptionSources
        .filter(item => item.mockFileName === selectedMockFileName.value)
        .map(item => item.transformName)
    )
  ]
  return uniqueNames.map(name => ({ label: name, value: name }))
})

const selectedMockFileName = ref(mockFileOptions.value[0]?.value || "")
const selectedTransformName = ref("")

watch(
  () => selectedMockFileName.value,
  () => {
    const availableTransformNames = transformOptions.value.map(item => item.value)
    if (!availableTransformNames.includes(selectedTransformName.value))
      selectedTransformName.value = availableTransformNames[0] || ""
  },
  { immediate: true }
)

const currentPreset = computed(() => {
  return presetOptionSources.find(item =>
    item.mockFileName === selectedMockFileName.value
    && item.transformName === selectedTransformName.value
  ) || presetOptionSources[0]
})

const previewOption = computed<EChartsOption>(() => {
  if (!currentPreset.value) {
    return {
      title: { text: "未找到可用的预置方案" },
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: []
    }
  }

  return currentPreset.value.buildOption(currentPreset.value.mockData)
})
</script>

<template>
  <el-row :gutter="20" class="chentest-tool__row">
    <el-col :xs="24" :lg="11">
      <el-card shadow="never" class="chentest-tool__card">
        <template #header>
          <div class="chentest-tool__header">
            <div class="chentest-tool__title">
              预置配置区
            </div>
            <div class="chentest-tool__subtitle">
              通过固定的数据源和转化函数生成 ECharts option，左侧内容可直接复制调试
            </div>
          </div>
        </template>

        <div class="chentest-tool__selectors">
          <div class="chentest-tool__field">
            <div class="chentest-tool__field-label">
              mock 数据来源文件
            </div>
            <el-select v-model="selectedMockFileName" class="chentest-tool__select">
              <el-option
                v-for="item in mockFileOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="chentest-tool__field">
            <div class="chentest-tool__field-label">
              转化函数名称
            </div>
            <el-select v-model="selectedTransformName" class="chentest-tool__select">
              <el-option
                v-for="item in transformOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <el-alert
          :title="`当前已内置 ${presetOptionSources.length} 组方案，后续可继续扩展新的 mock 文件和转化函数。`"
          type="info"
          :closable="false"
          show-icon
          class="chentest-tool__alert"
        />

        <div v-if="currentPreset" class="chentest-tool__code-blocks">
          <div class="chentest-tool__code-section">
            <div class="chentest-tool__code-head">
              <div class="chentest-tool__field-label">
                mock 数据内容
              </div>
              <div class="chentest-tool__code-meta">
                {{ currentPreset.mockFileName }}
              </div>
            </div>
            <el-input
              :model-value="currentPreset.mockSourceText"
              type="textarea"
              :rows="14"
              resize="none"
              readonly
              class="chentest-tool__textarea"
            />
          </div>

          <div class="chentest-tool__code-section">
            <div class="chentest-tool__code-head">
              <div class="chentest-tool__field-label">
                转化函数代码
              </div>
              <div class="chentest-tool__code-meta">
                {{ currentPreset.transformName }}
              </div>
            </div>
            <el-input
              :model-value="currentPreset.transformSourceText"
              type="textarea"
              :rows="16"
              resize="none"
              readonly
              class="chentest-tool__textarea"
            />
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :lg="13">
      <el-card shadow="never" class="chentest-tool__card">
        <template #header>
          <div class="chentest-tool__header">
            <div class="chentest-tool__title">
              ECharts 图表预览
            </div>
            <div class="chentest-tool__subtitle">
              {{ currentPreset?.label || "未选择方案" }}
            </div>
          </div>
        </template>

        <BaseEChart :option="previewOption" height="760px" />
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
.chentest-tool__row {
  margin-bottom: 4px;
}

.chentest-tool__card {
  height: 100%;
  border: 1px solid rgba(29, 78, 216, 0.12);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(191, 219, 254, 0.3), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.98));
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.chentest-tool__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.chentest-tool__title {
  color: #163a9a;
  font-size: 16px;
  font-weight: 700;
}

.chentest-tool__subtitle {
  color: #5b6b8b;
  font-size: 13px;
  line-height: 1.5;
}

.chentest-tool__selectors {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.chentest-tool__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chentest-tool__field-label {
  color: #31518f;
  font-size: 13px;
  font-weight: 600;
}

.chentest-tool__select {
  width: 100%;
}

.chentest-tool__code-blocks {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.chentest-tool__code-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chentest-tool__code-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.chentest-tool__alert {
  margin-bottom: 16px;
}

.chentest-tool__code-meta {
  color: #5b6b8a;
  font-size: 13px;
  font-weight: 500;
}

@media (width <= 768px) {
  .chentest-tool__code-head {
    flex-direction: column;
    gap: 6px;
  }
}

:deep(.chentest-tool__textarea .el-textarea__inner) {
  min-height: 640px !important;
  padding: 18px;
  border-radius: 18px;
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.6;
  background: linear-gradient(180deg, #0f172a, #172554);
}
</style>
