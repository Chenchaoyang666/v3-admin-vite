<script lang="ts" setup>
import type { AiChatMessage } from "./components/AiChatShell"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { AiChatShell } from "./components/AiChatShell"
import { useAiChatSession } from "./composables/useAiChatSession"
import { useAiChatStream } from "./composables/useAiChatStream"

type ChatMode = "server_stream" | "client_simulated_stream"

const quickPrompts = [
  "帮我总结一下这个流式输出 demo 的实现思路",
  "模拟解释一下为什么前端要用 ReadableStream",
  "给我一段适合展示打字机效果的回答"
]

const draft = ref("")
const messages = ref<AiChatMessage[]>([])
const pendingAssistant = ref("")
const chatMode = ref<ChatMode>("server_stream")

function formatTime(value: string) {
  return dayjs(value).format("HH:mm:ss")
}

function applyPrompt(prompt: string) {
  draft.value = prompt
}

function createMessage(role: AiChatMessage["role"], content: string): AiChatMessage {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  }
}

async function loadHistory() {
  try {
    await sessionController.loadHistory()
  } catch (error) {
    console.error(error)
    ElMessage.error("加载聊天记录失败")
  }
}

async function clearMessages() {
  try {
    await sessionController.clearMessages()
    ElMessage.success("聊天记录已清空")
  } catch (error) {
    console.error(error)
    ElMessage.error("清空聊天记录失败")
  }
}

async function submitMessage() {
  const content = draft.value.trim()
  if (!content || submitting.value || streaming.value) return

  const userMessage = createMessage("user", content)
  messages.value.push(userMessage)
  draft.value = ""
  pendingAssistant.value = ""

  try {
    if (chatMode.value === "server_stream") {
      await streamController.submitServerStream({
        request: () => fetch("/api/ai-chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: content })
        }),
        onDelta: (chunk) => {
          pendingAssistant.value += chunk
        },
        onDone: (message) => {
          messages.value.push(message || createMessage("assistant", pendingAssistant.value))
          pendingAssistant.value = ""
        }
      })
    } else {
      await streamController.submitClientSimulatedStream({
        request: () => fetch("/api/ai-chat/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: content })
        }),
        onDelta: (chunk) => {
          pendingAssistant.value += chunk
        },
        onDone: (result) => {
          messages.value.push(result.message || createMessage("assistant", result.content))
          pendingAssistant.value = ""
        }
      })
    }
  } catch (error) {
    console.error(error)
    pendingAssistant.value = ""
    messages.value = messages.value.filter(message => message.id !== userMessage.id)
    ElMessage.error("发送失败，请检查本地后端服务是否已启动")
  }
}

const streamController = useAiChatStream()

const sessionController = useAiChatSession({
  messages,
  pendingContent: pendingAssistant,
  historyUrl: "/api/ai-chat/messages",
  deleteUrl: "/api/ai-chat/messages"
})

const { submitting, streaming } = streamController
const { historyLoading } = sessionController

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
  >
    <template #hero-actions>
      <el-radio-group v-model="chatMode" size="small" class="mode-switch">
        <el-radio-button label="server_stream" value="server_stream">
          后端流式
        </el-radio-button>
        <el-radio-button label="client_simulated_stream" value="client_simulated_stream">
          前端模拟流式
        </el-radio-button>
      </el-radio-group>
      <el-button :loading="historyLoading" @click="loadHistory">
        刷新记录
      </el-button>
      <el-popconfirm
        width="280"
        title="将清空 backend/data 中保存的对话记录，是否继续？"
        confirm-button-text="确定"
        cancel-button-text="取消"
        :hide-after="0"
        :disabled="submitting || streaming"
        @confirm="clearMessages"
      >
        <template #reference>
          <el-button type="danger" plain :disabled="submitting || streaming">
            清空记录
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </AiChatShell>
</template>

<style scoped lang="scss">
:deep(.ai-chat-shell) {
  min-height: calc(100vh - 120px);
}

.mode-switch {
  margin-right: 8px;
}
</style>
