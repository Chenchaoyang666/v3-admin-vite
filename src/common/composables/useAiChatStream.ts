import type { Ref } from "vue"
import type { AiChatMessage } from "@/common/components/AiChatShell"
import { ref } from "vue"

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface AiChatStreamPayload {
  type: "delta" | "done" | "error"
  content?: string
  message?: AiChatMessage
  error?: string
}

export interface UseAiChatStreamOptions {
  messages: Ref<AiChatMessage[]>
  draft: Ref<string>
  pendingContent: Ref<string>
  historyUrl: string
  streamUrl: string
  deleteUrl?: string
  createUserMessage?: (content: string) => AiChatMessage
  buildSubmitBody?: (message: string) => Record<string, unknown>
  parseStreamPayload?: (raw: string) => AiChatStreamPayload
}

export function useAiChatStream(options: UseAiChatStreamOptions) {
  const historyLoading = ref(false)
  const submitting = ref(false)
  const streaming = ref(false)

  const createUserMessage = options.createUserMessage || defaultCreateUserMessage
  const buildSubmitBody = options.buildSubmitBody || ((message: string) => ({ message }))
  const parseStreamPayload = options.parseStreamPayload || defaultParseStreamPayload

  async function loadHistory() {
    historyLoading.value = true
    try {
      const response = await fetch(options.historyUrl)
      const result: ApiResponse<AiChatMessage[]> = await response.json()
      if (result.code !== 0) {
        throw new Error(result.message || "获取记录失败")
      }
      options.messages.value = Array.isArray(result.data) ? result.data : []
    } finally {
      historyLoading.value = false
    }
  }

  async function clearMessages() {
    const deleteUrl = options.deleteUrl || options.historyUrl
    const response = await fetch(deleteUrl, { method: "DELETE" })
    const result: ApiResponse<AiChatMessage[]> = await response.json()
    if (result.code !== 0) {
      throw new Error(result.message || "清空失败")
    }
    options.messages.value = []
    options.pendingContent.value = ""
  }

  async function submitMessage() {
    const content = options.draft.value.trim()
    if (!content || submitting.value || streaming.value) return

    const userMessage = createUserMessage(content)

    options.messages.value.push(userMessage)
    options.draft.value = ""
    options.pendingContent.value = ""
    submitting.value = true
    streaming.value = true

    try {
      const response = await fetch(options.streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildSubmitBody(content))
      })

      if (!response.ok || !response.body) {
        throw new Error("流式接口响应异常")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() || ""

        for (const part of parts) {
          const dataLine = part
            .split("\n")
            .find(line => line.startsWith("data:"))

          if (!dataLine) continue

          const payload = parseStreamPayload(dataLine.slice(5).trim())

          if (payload.type === "delta") {
            options.pendingContent.value += payload.content || ""
            continue
          }

          if (payload.type === "done" && payload.message) {
            options.messages.value.push(payload.message)
            options.pendingContent.value = ""
            continue
          }

          if (payload.type === "error") {
            throw new Error(payload.error || "流式输出失败")
          }
        }
      }
    } catch (error) {
      options.pendingContent.value = ""
      options.messages.value = options.messages.value.filter(message => message.id !== userMessage.id)
      throw error
    } finally {
      submitting.value = false
      streaming.value = false
    }
  }

  return {
    historyLoading,
    submitting,
    streaming,
    loadHistory,
    clearMessages,
    submitMessage
  }
}

function defaultCreateUserMessage(content: string): AiChatMessage {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    content,
    createdAt: new Date().toISOString()
  }
}

function defaultParseStreamPayload(raw: string) {
  return JSON.parse(raw) as AiChatStreamPayload
}
