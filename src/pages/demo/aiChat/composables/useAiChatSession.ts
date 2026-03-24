import type { ComputedRef, Ref } from "vue"
import type { AiChatMessage } from "../components/AiChatShell"
import { ref, unref } from "vue"

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface UseAiChatSessionOptions {
  messages: Ref<AiChatMessage[]>
  pendingContent: Ref<string>
  historyUrl: MaybeRef<string>
  deleteUrl?: MaybeRef<string>
}

export function useAiChatSession(options: UseAiChatSessionOptions) {
  const historyLoading = ref(false)

  async function loadHistory() {
    historyLoading.value = true
    try {
      const response = await fetch(unref(options.historyUrl))
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
    const deleteUrl = options.deleteUrl ? unref(options.deleteUrl) : unref(options.historyUrl)
    const response = await fetch(deleteUrl, { method: "DELETE" })
    const result: ApiResponse<AiChatMessage[]> = await response.json()
    if (result.code !== 0) {
      throw new Error(result.message || "清空失败")
    }
    options.messages.value = []
    options.pendingContent.value = ""
  }

  return {
    historyLoading,
    loadHistory,
    clearMessages
  }
}
