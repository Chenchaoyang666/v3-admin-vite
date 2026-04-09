<script lang="ts" setup>
import DataToEchartsTab from "./components/DataToEchartsTab.vue"
import OptionToEchartsTab from "./components/OptionToEchartsTab.vue"

defineOptions({
  name: "ChentestVue"
})
const activeTab = ref("data")
</script>

<template>
  <div class="app-container chentest-page">
    <el-card shadow="never" class="chentest-page__tabs-card">
      <el-tabs v-model="activeTab" class="chentest-page__tabs">
        <el-tab-pane label="数据转 ECharts" name="data">
          <DataToEchartsTab />
        </el-tab-pane>
        <el-tab-pane label="配置转 ECharts" name="option">
          <OptionToEchartsTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.chentest-page {
  min-height: 100%;
}

.chentest-page__tabs-card {
  border: 1px solid rgba(29, 78, 216, 0.12);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(191, 219, 254, 0.3), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.98));
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

:deep(.chentest-page__tabs .el-tabs__header) {
  margin-bottom: 18px;
}

:deep(.chentest-page__tabs .el-tabs__nav-wrap::after) {
  background-color: rgba(29, 78, 216, 0.12);
}

:deep(.chentest-page__tabs .el-tabs__item) {
  height: 42px;
  color: #31518f;
  font-weight: 600;
}

:deep(.chentest-page__tabs .el-tabs__item.is-active) {
  color: #1d4ed8;
}

:deep(.chentest-page__tabs .el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
}
</style>
