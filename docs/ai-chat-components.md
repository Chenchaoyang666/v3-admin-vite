# AI Chat Components

## 组件概览

当前这套聊天能力拆成了两层：

1. `RichContentRenderer`
用途：渲染 Markdown、表格、任务列表、分割线、图片，以及 ` ```echarts `、` ```vxetable ` 代码块。

2. `AiChatShell`
用途：提供完整聊天壳布局，包括头部、侧栏、消息区、流式消息展示、自动滚动、回到底部按钮、输入区和发送区。

3. `useAiChatStream`
用途：只负责消息提交、SSE 分片解析，以及“后端真流式 / 前端模拟流式”两种输出模式。

4. `useAiChatSession`
用途：负责消息列表状态、历史加载和清空逻辑。

5. `sse.ts`
用途：负责 SSE 事件分块与 `data:` 行提取。

## 文件位置

- `src/pages/demo/aiChat/components/RichContentRenderer/`
- `src/pages/demo/aiChat/components/AiChatShell/`
- `src/pages/demo/aiChat/composables/useAiChatStream.ts`
- `src/pages/demo/aiChat/composables/useAiChatSession.ts`
- `src/pages/demo/aiChat/utils/sse.ts`

## 依赖

```bash
pnpm add echarts markdown-it markdown-it-task-lists
```

## RichContentRenderer 用法

```vue
<script setup lang="ts">
import { RichContentRenderer } from "@/pages/demo/aiChat/components/RichContentRenderer"

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

\`\`\`vxetable
{
  "title": "分页结果",
  "columns": [
    { "field": "date", "title": "日期" },
    { "field": "sales", "title": "销量" }
  ],
  "data": [
    { "date": "2026-03-28", "sales": 123 },
    { "date": "2026-03-29", "sales": 156 },
    { "date": "2026-03-30", "sales": 178 }
  ],
  "pagination": {
    "pageSize": 2,
    "pageSizes": [2, 5, 10]
  }
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

### 特殊代码块协议

- `\`\`\`echarts`：内容必须是合法的 ECharts option JSON
- `\`\`\`vxetable` / `\`\`\`vxe-table`：内容必须是合法的表格 JSON，至少包含 `columns` 和 `data`
- 流式过程中如果特殊 block 尚未闭合，会展示“生成中”占位态
- 特殊 block 已闭合但 JSON 非法时，会回退为普通 Markdown 代码块展示

## AiChatShell 用法

```vue
<script setup lang="ts">
import dayjs from "dayjs"
import { computed, ref } from "vue"
import { AiChatShell } from "@/pages/demo/aiChat/components/AiChatShell"
import type { AiChatMessage } from "@/pages/demo/aiChat/components/AiChatShell"

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
import { useAiChatStream } from "@/pages/demo/aiChat/composables/useAiChatStream"

const streamController = useAiChatStream()

const { submitting, streaming, submitServerStream, submitClientSimulatedStream } = streamController
```

`useAiChatStream` 现在是纯流式执行器，不再直接接收：

- `messages`
- `draft`
- `streamUrl`
- `responseMode`
- `createUserMessage`
- `createAssistantMessage`
- `buildSubmitBody`

这些业务状态应由页面或业务层自己管理。

### 返回值

- `submitting`
- `streaming`
- `submitServerStream(options)`
- `submitClientSimulatedStream(options)`

### submitServerStream(options)

- `request: () => Promise<Response>`
- `onDelta: (content: string) => void`
- `onDone: (message?: AiChatMessage) => void`
- `parseStreamPayload?: (raw: string) => AiChatStreamPayload`

### submitClientSimulatedStream(options)

- `request: () => Promise<Response>`
- `onDelta: (content: string) => void`
- `onDone: (result: AiChatNonStreamResult) => void`
- `parseNonStreamResponse?: (response: Response) => Promise<AiChatNonStreamResult>`
- `getSimulatedChunks?: (content: string) => string[]`
- `simulatedChunkDelay?: number`

## 两种流式原理

### 1. 后端真流式 `server_stream`

这种模式下，后端接口本身支持流式输出，通常会返回 `SSE` 或 `ReadableStream`。

当前 demo 的实现方式是：

1. 前端调用 `/api/ai-chat/stream`
2. 后端按片段不断写出：

```txt
data: {"type":"delta","content":"..."}

data: {"type":"delta","content":"..."}

data: {"type":"done","message":{...}}
```

3. 前端通过 `response.body.getReader()` 持续读取字节流
4. 先用 `\n\n` 切分事件块
5. 再在单个事件块里逐行找到 `data:` 那一行
6. 把 `delta` 累加到 `pendingContent`
7. 收到 `done` 后，把最终 assistant 消息压入消息列表

为什么一个事件块内部还要再按 `\n` 分行：

- 因为 `SSE` 标准里一个事件可以包含多行字段，比如 `event:`、`id:`、`data:`
- 所以前端不能假设整个事件块只有一行 `data:`
- 当前代码里已经下沉到 `src/pages/demo/aiChat/utils/sse.ts`
- `resolveSSEEvents(buffer)`：负责按 `\n\n` 拆分完整事件块，并保留未完成尾巴
- `getSSEDataLine(eventBlock)`：负责从单个事件块里提取 `data:` 行

适用场景：

- 后端本身接的是大模型流式接口
- 希望首字尽可能快出来
- 希望前后端都遵循真实流式协议
- `useAiChatStream` 只负责流的读取和解析，不负责消息列表状态

### 2. 前端模拟流式 `client_simulated_stream`

这种模式下，后端接口不支持流式，而是一次性返回完整内容。

当前 demo 的实现方式是：

1. 前端调用 `/api/ai-chat/reply`
2. 后端直接返回完整回答
3. 前端拿到整段内容后，按规则切成小块
4. 用定时延迟逐段追加到 `pendingContent`
5. 全部追加完成后，再生成最终 assistant 消息并写入消息列表

也就是说，这种模式的“流式效果”不是网络层流式，而是：

- 网络层：一次性返回
- 展示层：前端自己分片模拟打字效果
- `useAiChatStream` 只负责模拟逐段输出，不负责你页面里的消息状态组织

适用场景：

- 后端暂时没有 SSE / 流式能力
- 只是想在 UI 上保留流式输出体验
- 需要兼容传统一次性返回的接口

### 两种模式的差异

- `server_stream`
  优点：更真实，首字更快，适合真实大模型流
  缺点：后端实现复杂度更高

- `client_simulated_stream`
  优点：后端简单，兼容普通 JSON 接口
  缺点：本质不是网络流式，必须等后端整段内容先返回

### 使用两种模式

#### 1. 后端真流式

适合后端返回 SSE 或者 `ReadableStream` 分片：

```ts
await streamController.submitServerStream({
  request: () => fetch("/api/ai-chat/stream", { method: "POST" }),
  onDelta: (chunk) => {
    pendingContent.value += chunk
  },
  onDone: (message) => {
    if (message)
      messages.value.push(message)
  }
})
```

#### 2. 后端一次性返回全文，前端模拟流式

适合后端接口只会一次性返回完整回答：

```ts
await streamController.submitClientSimulatedStream({
  request: () => fetch("/api/chat/reply", { method: "POST" }),
  onDelta: (chunk) => {
    pendingContent.value += chunk
  },
  onDone: (result) => {
    messages.value.push(result.message || {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: result.content,
      createdAt: new Date().toISOString()
    })
  },
  parseNonStreamResponse: async (response) => {
    const result = await response.json()
    return {
      content: result.data.answer
    }
  },
  getSimulatedChunks: (content) => content.match(/.{1,10}/gs) || [content],
  simulatedChunkDelay: 40
})
```

## useAiChatSession 用法

```ts
import { ref } from "vue"
import type { AiChatMessage } from "@/pages/demo/aiChat/components/AiChatShell"
import { useAiChatSession } from "@/pages/demo/aiChat/composables/useAiChatSession"

const messages = ref<AiChatMessage[]>([])
const pendingContent = ref("")

const sessionController = useAiChatSession({
  messages,
  pendingContent,
  historyUrl: "/api/ai-chat/messages",
  deleteUrl: "/api/ai-chat/messages"
})

const { historyLoading, loadHistory, clearMessages } = sessionController
```

### UseAiChatSessionOptions

- `messages: Ref<AiChatMessage[]>`
- `pendingContent: Ref<string>`
- `historyUrl: string`
- `deleteUrl?: string`

### 返回值

- `historyLoading`
- `loadHistory()`
- `clearMessages()`

## 当前 demo 的双模式接口

当前演示页顶部已经提供模式切换：

- `后端流式`
  使用 `/api/ai-chat/stream`
- `前端模拟流式`
  使用 `/api/ai-chat/reply`

其中：

- `/api/ai-chat/stream` 由后端按 SSE 分片返回
- `/api/ai-chat/reply` 由后端一次性返回完整内容，前端再按 chunk 模拟成流式体验

## 推荐迁移方式

如果要迁移到别的 Vue3 项目，最小拷贝集合如下：

1. `src/pages/demo/aiChat/components/RichContentRenderer/`
2. `src/pages/demo/aiChat/components/AiChatShell/`
3. `src/pages/demo/aiChat/composables/useAiChatStream.ts`
4. `src/pages/demo/aiChat/composables/useAiChatSession.ts`
5. `src/pages/demo/aiChat/utils/sse.ts`
6. `echarts`
7. `markdown-it`
8. `markdown-it-task-lists`

如果目标项目没有 Element Plus：

- `AiChatShell` 里的 `el-input`、`el-button`、`el-popconfirm` 需要替换成目标项目自己的 UI 组件
- `RichContentRenderer` 和 `RichEChartsBlock` 可以基本原样复用

## 当前 demo 示例

- 页面：`src/pages/demo/aiChat/streamChat.vue`
- 后端模拟流接口：`backend/routes/ai-chat.js`
