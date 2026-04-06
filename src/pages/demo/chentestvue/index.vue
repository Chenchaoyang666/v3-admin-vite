<script lang="ts" setup>
import type { DataRow } from "./echarts-option-builder"
import ChartPreviewPanel from "./components/ChartPreviewPanel.vue"

defineOptions({
  name: "ChentestVue"
})

const DEFAULT_SOURCE_DATA: DataRow[] = [
  {
    报告期: "2025-07-31",
    对公信贷客户数: 442113,
    红色预警客户数: 967,
    橙色预警客户数: 965,
    蓝色预警客户数: 645,
    红色预警客户占比: 0.002187,
    橙色预警客户占比: 0.002183,
    蓝色预警客户占比: 0.001459
  },
  {
    报告期: "2025-06-30",
    对公信贷客户数: 496017,
    红色预警客户数: 390,
    橙色预警客户数: 31,
    蓝色预警客户数: 17,
    红色预警客户占比: 0.000786,
    橙色预警客户占比: 0.000062,
    蓝色预警客户占比: 0.000034
  },
  {
    报告期: "2025-05-31",
    对公信贷客户数: 467872,
    红色预警客户数: 301,
    橙色预警客户数: 895,
    蓝色预警客户数: 935,
    红色预警客户占比: 0.000643,
    橙色预警客户占比: 0.001913,
    蓝色预警客户占比: 0.001998
  },
  {
    报告期: "2025-04-30",
    对公信贷客户数: 84789,
    红色预警客户数: 933,
    橙色预警客户数: 375,
    蓝色预警客户数: 976,
    红色预警客户占比: 0.011004,
    橙色预警客户占比: 0.004423,
    蓝色预警客户占比: 0.011511
  },
  {
    报告期: "2025-03-31",
    对公信贷客户数: 516105,
    红色预警客户数: 826,
    橙色预警客户数: 449,
    蓝色预警客户数: 819,
    红色预警客户占比: 0.0016,
    橙色预警客户占比: 0.00087,
    蓝色预警客户占比: 0.001587
  }
]

const sourceDataText = ref(JSON.stringify(DEFAULT_SOURCE_DATA, null, 2))

function resetDefaultData() {
  sourceDataText.value = JSON.stringify(DEFAULT_SOURCE_DATA, null, 2)
}
</script>

<template>
  <div class="app-container chentest-page">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="11">
        <el-card shadow="never" class="chentest-page__card">
          <template #header>
            <div class="chentest-page__header">
              <div class="chentest-page__title">
                默认数据
              </div>
              <el-button text type="primary" @click="resetDefaultData">
                重置
              </el-button>
            </div>
          </template>
          <el-input
            v-model="sourceDataText"
            type="textarea"
            :rows="24"
            resize="none"
            class="chentest-page__textarea"
          />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="13">
        <ChartPreviewPanel
          :source-data="sourceDataText"
          panel-title="默认数据图表预览"
          chart-title=""
          height="520px"
        />
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.chentest-page {
  min-height: 100%;
}

.chentest-page__card {
  height: 100%;
  border: 1px solid rgba(29, 78, 216, 0.12);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(191, 219, 254, 0.3), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.98));
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.chentest-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chentest-page__title {
  color: #163a9a;
  font-size: 16px;
  font-weight: 700;
}

:deep(.chentest-page__textarea .el-textarea__inner) {
  min-height: 640px !important;
  padding: 18px;
  border-radius: 18px;
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.6;
  background: linear-gradient(180deg, #0f172a, #172554);
}
</style>
