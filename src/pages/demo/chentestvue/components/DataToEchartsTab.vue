<script lang="ts" setup>
import type { DataRow } from "../echarts-option-builder"
import ChartPreviewPanel from "./ChartPreviewPanel.vue"

defineOptions({
  name: "DataToEchartsTab"
})

const DEFAULT_SOURCE_DATA: DataRow[] = (() => {
  const periods = ["2025-03-31", "2025-04-30", "2025-05-31", "2025-06-30", "2025-07-31"]
  const industries = [
    "社会保障",
    "社会工作",
    "石油加工",
    "食品制造业",
    "水上运输业",
    "体育",
    "铁路运输业",
    "卫生",
    "文化艺术业",
    "橡胶和塑料制品业",
    "研究和试验发展",
    "邮政业",
    "有色金属矿采选业",
    "娱乐业",
    "渔业",
    "住宿业",
    "资本市场服务",
    "租赁业"
  ]
  const orgLevels = ["全行", "重点分行"]

  return periods.flatMap((period, periodIndex) =>
    industries.flatMap((industry, industryIndex) =>
      orgLevels.map((orgLevel, orgIndex) => {
        const base = 0.82 + industryIndex * 0.007 + periodIndex * 0.013 + orgIndex * 0.005
        const ratio = Number(base.toFixed(6))
        const warningCustomers = 60 + industryIndex * 9 + periodIndex * 7 + orgIndex * 5
        const customerCount = 18000 + industryIndex * 1100 + periodIndex * 850 + orgIndex * 300

        return {
          报告期: period,
          行业: industry,
          机构层级: orgLevel,
          对公信贷客户数: customerCount,
          预警客户数: warningCustomers,
          预警客户占比: Number((warningCustomers / customerCount).toFixed(6)),
          风险排查模型得分: ratio,
          风险标签: industryIndex % 3 === 0 ? "高关注" : industryIndex % 3 === 1 ? "中关注" : "观察"
        }
      })
    )
  )
})()

const sourceDataText = ref(JSON.stringify(DEFAULT_SOURCE_DATA, null, 2))

function resetDefaultData() {
  sourceDataText.value = JSON.stringify(DEFAULT_SOURCE_DATA, null, 2)
}
</script>

<template>
  <el-row :gutter="20" class="chentest-tool__row">
    <el-col :xs="24" :lg="11">
      <el-card shadow="never" class="chentest-tool__card">
        <template #header>
          <div class="chentest-tool__header">
            <div class="chentest-tool__title">
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
          class="chentest-tool__textarea"
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chentest-tool__title {
  color: #163a9a;
  font-size: 16px;
  font-weight: 700;
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
