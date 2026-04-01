<script lang="ts" setup>
import type { VxePagerDefines, VxePagerProps } from "vxe-table"
import type { RichTableBlockConfig } from "./types"
import { computed, ref, watch } from "vue"

const props = defineProps<{
  table: RichTableBlockConfig
}>()

const DEFAULT_PAGE_SIZE = 5

const currentPage = ref(1)
const pageSize = ref(resolveInitialPageSize())

const pageSizes = computed<VxePagerProps["pageSizes"]>(() => {
  return props.table.pagination?.pageSizes?.length
    ? props.table.pagination.pageSizes
    : [5, 10, 20]
})

const total = computed(() => props.table.data.length)

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return props.table.data.slice(start, start + pageSize.value)
})

function resolveInitialPageSize() {
  return props.table.pagination?.pageSize || DEFAULT_PAGE_SIZE
}

function handlePageChange({ currentPage: nextPage, pageSize: nextPageSize }: VxePagerDefines.PageChangeEventParams) {
  currentPage.value = nextPage
  pageSize.value = nextPageSize
}

watch(
  () => props.table,
  (table) => {
    currentPage.value = 1
    pageSize.value = table.pagination?.pageSize || DEFAULT_PAGE_SIZE
  },
  { deep: true }
)
</script>

<template>
  <section class="rich-vxe-table-block">
    <header v-if="table.title" class="rich-vxe-table-block__header">
      <h4>{{ table.title }}</h4>
      <span>{{ total }} 条记录</span>
    </header>

    <div class="rich-vxe-table-block__body">
      <vxe-table
        :data="pagedRows"
        :column-config="{ resizable: false }"
        :row-config="{ isHover: true }"
        :scroll-x="{ enabled: true }"
        max-height="420"
      >
        <vxe-column
          v-for="column in table.columns"
          :key="column.field || column.type || column.title"
          v-bind="column"
        />
      </vxe-table>
    </div>

    <vxe-pager
      v-if="total > 0"
      class="rich-vxe-table-block__pager"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layouts="['Total', 'PrevPage', 'Number', 'NextPage', 'Sizes', 'FullJump']"
      size="small"
      perfect
      background
      @page-change="handlePageChange"
      @update:current-page="currentPage = $event"
      @update:page-size="pageSize = $event"
    />
  </section>
</template>

<style scoped lang="scss">
.rich-vxe-table-block {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--rich-content-border, rgba(24, 21, 17, 0.08));
  border-radius: 20px;
  background: var(--rich-content-surface, rgba(255, 251, 245, 0.72));
}

.rich-vxe-table-block__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  h4 {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
  }

  span {
    color: #6d675f;
    font-size: 13px;
  }
}

.rich-vxe-table-block__body {
  overflow: hidden;
  border-radius: 16px;
}

.rich-vxe-table-block__pager {
  margin-top: 12px;
}
</style>
