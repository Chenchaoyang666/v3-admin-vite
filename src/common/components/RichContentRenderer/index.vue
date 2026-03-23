<script lang="ts" setup>
import { computed } from "vue"
import RichEChartsBlock from "./RichEChartsBlock.vue"
import { parseRichContent } from "./utils"

const props = defineProps<{
  content: string
  chartHeight?: number | string
}>()

const segments = computed(() => parseRichContent(props.content))
</script>

<template>
  <div class="rich-content-renderer">
    <template v-for="(segment, index) in segments" :key="index">
      <div
        v-if="segment.type === 'markdown'"
        class="markdown-body"
        v-html="segment.html"
      />
      <RichEChartsBlock
        v-else-if="segment.type === 'echarts'"
        :option="segment.option"
        :height="chartHeight"
      />
      <div v-else class="chart-loading">
        <div class="chart-loading__box">
          <span class="chart-loading__dot" />
          <span class="chart-loading__dot" />
          <span class="chart-loading__dot" />
        </div>
        <p>图表生成中...</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.rich-content-renderer {
  --rich-content-border: rgba(24, 21, 17, 0.08);
  --rich-content-surface: rgba(255, 251, 245, 0.72);
  font-size: 16px;
  line-height: 1.8;
}

.chart-loading {
  margin: 20px 0;
  padding: 22px 18px;
  border: 1px dashed rgba(24, 21, 17, 0.14);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.9), rgba(247, 241, 232, 0.76));
  text-align: center;

  p {
    margin: 10px 0 0;
    color: #6d675f;
    font-size: 14px;
  }
}

.chart-loading__box {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.chart-loading__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #bf5a36;
  animation: chartPulse 1.1s infinite ease-in-out;
}

.chart-loading__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.chart-loading__dot:nth-child(3) {
  animation-delay: 0.3s;
}

.markdown-body :deep(*) {
  max-width: 100%;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 1.1em 0 0.55em;
  line-height: 1.24;
}

.markdown-body :deep(h1) {
  font-size: 28px;
}

.markdown-body :deep(h2) {
  font-size: 24px;
}

.markdown-body :deep(h3) {
  font-size: 20px;
}

.markdown-body :deep(h4) {
  font-size: 17px;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre),
.markdown-body :deep(table),
.markdown-body :deep(hr) {
  margin: 16px 0;
}

.markdown-body :deep(a) {
  color: #a54829;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(24, 21, 17, 0.08);
  font-size: 0.92em;
}

.markdown-body :deep(pre) {
  padding: 16px 18px;
  overflow-x: auto;
  border-radius: 18px;
  background: #1d1915;
  color: #f7f1e8;
  font-size: 14px;
  line-height: 1.7;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-body :deep(blockquote) {
  padding: 12px 16px;
  border-left: 4px solid rgba(191, 90, 54, 0.42);
  border-radius: 0 16px 16px 0;
  background: rgba(191, 90, 54, 0.06);
}

.markdown-body :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(24, 21, 17, 0.12);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin-bottom: 8px;
}

.markdown-body :deep(.task-list-item) {
  list-style: none;
}

.markdown-body :deep(.task-list-item input) {
  margin-right: 10px;
}

.markdown-body :deep(.md-table-wrap) {
  width: 100%;
  overflow-x: auto;
  margin: 18px 0;
}

.markdown-body :deep(table) {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: auto;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 12px 14px;
  border: 1px solid rgba(24, 21, 17, 0.08);
  text-align: left;
  vertical-align: top;
}

.markdown-body :deep(th) {
  background: rgba(24, 21, 17, 0.06);
  font-weight: 700;
}

.markdown-body :deep(img) {
  display: block;
  width: 100%;
  max-width: 720px;
  border-radius: 20px;
  border: 1px solid rgba(24, 21, 17, 0.08);
  object-fit: cover;
}

@keyframes chartPulse {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
</style>
