<script lang="ts" setup>
import type { AiChatMessage } from "@/common/components/AiChatShell"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { AiChatShell } from "@/common/components/AiChatShell"
import { useAiChatStream } from "@/common/composables/useAiChatStream"

const quickPrompts = [
  "帮我总结一下这个流式输出 demo 的实现思路",
  "模拟解释一下为什么前端要用 ReadableStream",
  "给我一段适合展示打字机效果的回答"
]

const draft = ref("")
const messages = ref<AiChatMessage[]>([])
const pendingAssistant = ref("")

function formatTime(value: string) {
  return dayjs(value).format("HH:mm:ss")
}

function applyPrompt(prompt: string) {
  draft.value = prompt
}

async function loadHistory() {
  try {
    await streamController.loadHistory()
  } catch (error) {
    console.error(error)
    ElMessage.error("加载聊天记录失败")
  }
}

async function clearMessages() {
  try {
    await streamController.clearMessages()
    ElMessage.success("聊天记录已清空")
  } catch (error) {
    console.error(error)
    ElMessage.error("清空聊天记录失败")
  }
}

async function submitMessage() {
  try {
    await streamController.submitMessage()
  } catch (error) {
    console.error(error)
    ElMessage.error("发送失败，请检查本地后端服务是否已启动")
  }
}

const streamController = useAiChatStream({
  messages,
  draft,
  pendingContent: pendingAssistant,
  historyUrl: "/api/ai-chat/messages",
  streamUrl: "/api/ai-chat/stream",
  deleteUrl: "/api/ai-chat/messages"
})

const { historyLoading, submitting, streaming } = streamController

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <AiChatShell
    v-model:draft="draft"
    :messages="messages"
    :pending-content="pendingAssistant"
    :stats="[
      { label: '消息数量', value: messages.length },
      { label: '流式输出', value: streaming ? '进行中' : '空闲' },
      { label: '持久化位置', value: 'backend/data' },
    ]"
    :quick-prompts="quickPrompts"
    eyebrow="Streaming Demo"
    title="前端流式问答演示"
    description="模拟类似 Codex 的逐字输出体验，消息会在页面刷新后继续从后端数据文件中恢复。"
    placeholder="输入一个问题，体验前端流式输出"
    :history-loading="historyLoading"
    :submitting="submitting"
    :streaming="streaming"
    :format-time="formatTime"
    clear-confirm-text="将清空 backend/data 中保存的对话记录，是否继续？"
    @submit="submitMessage"
    @refresh="loadHistory"
    @clear="clearMessages"
    @prompt-select="applyPrompt"
  />
</template>

<style scoped lang="scss">
:deep(.ai-chat-shell) {
  min-height: calc(100vh - 120px);
}
</style>
