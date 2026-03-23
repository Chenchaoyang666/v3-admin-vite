# AI Chat Components

## 组件概览

当前这套聊天能力拆成了两层：

1. `RichContentRenderer`
用途：渲染 Markdown、表格、任务列表、分割线、图片，以及 ` ```echarts ` 代码块。

2. `AiChatShell`
用途：提供完整聊天壳布局，包括头部、侧栏、消息区、流式消息展示、自动滚动、回到底部按钮、输入区和发送区。

3. `useAiChatStream`
用途：抽离流式请求、SSE 分片解析、消息列表更新、历史加载和清空逻辑。

## 文件位置

- `src/common/components/RichContentRenderer/`
- `src/common/components/AiChatShell/`
- `src/common/composables/useAiChatStream.ts`

## 依赖

```bash
pnpm add echarts markdown-it markdown-it-task-lists
```

## RichContentRenderer 用法

```vue
<script setup lang="ts">
import { RichContentRenderer } from "@/common/components/RichContentRenderer"

const content = `
# 示例标题

- [x] 支持任务列表
- [x] 支持表格

| 名称 | 状态 |
| --- | --- |
| Markdown | OK |

![demo](https://example.com/demo.png)

\`\`\`echarts
{
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [12, 20, 15] }]
}
\`\`\`
`
</script>

<template>
  <RichContentRenderer :content="content" :chart-height="360" />
</template>
```

### Props

- `content: string`
- `chartHeight?: number | string`

## AiChatShell 用法

```vue
<script setup lang="ts">
import dayjs from "dayjs"
import { computed, ref } from "vue"
import { AiChatShell } from "@/common/components/AiChatShell"
import type { AiChatMessage } from "@/common/components/AiChatShell"

const draft = ref("")
const messages = ref<AiChatMessage[]>([])
const pendingContent = ref("")
const historyLoading = ref(false)
const submitting = ref(false)
const streaming = ref(false)

const stats = computed(() => [
  { label: "消息数量", value: messages.value.length },
  { label: "流式输出", value: streaming.value ? "进行中" : "空闲" }
])

const quickPrompts = [
  "帮我总结一下这个页面的能力",
  "给我一份包含表格和图表的回答"
]

function formatTime(value: string) {
  return dayjs(value).format("HH:mm:ss")
}

function handleSubmit() {
  // 在这里接你自己的流式接口
}
</script>

<template>
  <AiChatShell
    v-model:draft="draft"
    :messages="messages"
    :pending-content="pendingContent"
    :stats="stats"
    :quick-prompts="quickPrompts"
    :history-loading="historyLoading"
    :submitting="submitting"
    :streaming="streaming"
    eyebrow="Streaming Demo"
    title="前端流式问答演示"
    description="可复用的 Vue3 AI 聊天壳组件"
    placeholder="输入问题后发送"
    :format-time="formatTime"
    @submit="handleSubmit"
    @refresh="() => {}"
    @clear="() => {}"
  />
</template>
```

### Props

- `draft: string`
- `messages: AiChatMessage[]`
- `pendingContent?: string`
- `stats?: AiChatStatItem[]`
- `quickPrompts?: string[]`
- `eyebrow?: string`
- `title?: string`
- `description?: string`
- `emptyTitle?: string`
- `emptyDescription?: string`
- `placeholder?: string`
- `refreshText?: string`
- `clearText?: string`
- `sendText?: string`
- `clearConfirmText?: string`
- `tipText?: string`
- `historyLoading?: boolean`
- `submitting?: boolean`
- `streaming?: boolean`
- `chartHeight?: number | string`
- `formatTime?: (value: string) => string`

### Emits

- `update:draft`
- `submit`
- `refresh`
- `clear`
- `promptSelect`

### Expose

- `scrollToBottom(force?: boolean)`

## useAiChatStream 用法

```ts
import { ref } from "vue"
import type { AiChatMessage } from "@/common/components/AiChatShell"
import { useAiChatStream } from "@/common/composables/useAiChatStream"

const draft = ref("")
const messages = ref<AiChatMessage[]>([])
const pendingContent = ref("")

const streamController = useAiChatStream({
  messages,
  draft,
  pendingContent,
  historyUrl: "/api/ai-chat/messages",
  streamUrl: "/api/ai-chat/stream",
  deleteUrl: "/api/ai-chat/messages"
})

const { historyLoading, submitting, streaming, loadHistory, clearMessages, submitMessage } = streamController
```

### UseAiChatStreamOptions

- `messages: Ref<AiChatMessage[]>`
- `draft: Ref<string>`
- `pendingContent: Ref<string>`
- `historyUrl: string`
- `streamUrl: string`
- `deleteUrl?: string`
- `createUserMessage?: (content: string) => AiChatMessage`
- `buildSubmitBody?: (message: string) => Record<string, unknown>`
- `parseStreamPayload?: (raw: string) => AiChatStreamPayload`

### 返回值

- `historyLoading`
- `submitting`
- `streaming`
- `loadHistory()`
- `clearMessages()`
- `submitMessage()`

## 推荐迁移方式

如果要迁移到别的 Vue3 项目，最小拷贝集合如下：

1. `src/common/components/RichContentRenderer/`
2. `src/common/components/AiChatShell/`
3. `src/common/composables/useAiChatStream.ts`
4. `echarts`
5. `markdown-it`
6. `markdown-it-task-lists`

如果目标项目没有 Element Plus：

- `AiChatShell` 里的 `el-input`、`el-button`、`el-popconfirm` 需要替换成目标项目自己的 UI 组件
- `RichContentRenderer` 和 `RichEChartsBlock` 可以基本原样复用

## 当前 demo 示例

- 页面：`src/pages/demo/aiChat/streamChat.vue`
- 后端模拟流接口：`backend/routes/ai-chat.js`
