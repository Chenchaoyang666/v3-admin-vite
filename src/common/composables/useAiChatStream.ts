import type { ComputedRef, Ref } from "vue"
import type { ApiResponse } from "./useAiChatSession"
import type { AiChatMessage } from "@/common/components/AiChatShell"
import { ref, unref } from "vue"
import { getSSEDataLine, resolveSSEEvents } from "@/common/utils/sse"

export interface AiChatStreamPayload {
  type: "delta" | "done" | "error"
  content?: string
  message?: AiChatMessage
  error?: string
}

export interface AiChatNonStreamResult {
  content: string
  message?: AiChatMessage
}

export type AiChatResponseMode = "server_stream" | "client_simulated_stream"
type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface UseAiChatStreamOptions {
  messages: Ref<AiChatMessage[]>
  draft: Ref<string>
  pendingContent: Ref<string>
  streamUrl: MaybeRef<string>
  responseMode?: MaybeRef<AiChatResponseMode>
  createUserMessage?: (content: string) => AiChatMessage
  createAssistantMessage?: (content: string) => AiChatMessage
  buildSubmitBody?: (message: string) => Record<string, unknown>
  parseStreamPayload?: (raw: string) => AiChatStreamPayload
  parseNonStreamResponse?: (response: Response) => Promise<AiChatNonStreamResult>
  getSimulatedChunks?: (content: string) => string[]
  simulatedChunkDelay?: number
}

export function useAiChatStream(options: UseAiChatStreamOptions) {
  const submitting = ref(false)
  const streaming = ref(false)

  const createUserMessage = options.createUserMessage || defaultCreateUserMessage
  const createAssistantMessage = options.createAssistantMessage || defaultCreateAssistantMessage
  const buildSubmitBody = options.buildSubmitBody || ((message: string) => ({ message }))
  const parseStreamPayload = options.parseStreamPayload || defaultParseStreamPayload
  const parseNonStreamResponse = options.parseNonStreamResponse || defaultParseNonStreamResponse
  const getSimulatedChunks = options.getSimulatedChunks || defaultGetSimulatedChunks
  const simulatedChunkDelay = options.simulatedChunkDelay ?? 45

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
      const response = await fetch(unref(options.streamUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildSubmitBody(content))
      })

      if (!response.ok) {
        throw new Error("请求响应异常")
      }

      if ((options.responseMode ? unref(options.responseMode) : "server_stream") === "client_simulated_stream") {
        await handleClientSimulatedStream(response, {
          pendingContent: options.pendingContent,
          messages: options.messages,
          createAssistantMessage,
          parseNonStreamResponse,
          getSimulatedChunks,
          simulatedChunkDelay
        })
      } else {
        if (!response.body) {
          throw new Error("流式接口响应异常")
        }

        await handleServerStream(response, {
          pendingContent: options.pendingContent,
          messages: options.messages,
          parseStreamPayload
        })
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
    submitting,
    streaming,
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

function defaultCreateAssistantMessage(content: string): AiChatMessage {
  return {
    id: `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString()
  }
}

function defaultParseStreamPayload(raw: string) {
  return JSON.parse(raw) as AiChatStreamPayload
}

async function defaultParseNonStreamResponse(response: Response) {
  const result = await response.json() as ApiResponse<AiChatMessage | string | { content?: string, message?: AiChatMessage }>

  if (result.code !== 0) {
    throw new Error(result.message || "请求失败")
  }

  if (typeof result.data === "string") {
    return { content: result.data }
  }

  if (result.data && typeof result.data === "object" && "role" in result.data && "content" in result.data) {
    return {
      content: result.data.content,
      message: result.data
    }
  }

  if (result.data && typeof result.data === "object" && "content" in result.data) {
    return {
      content: result.data.content || "",
      message: result.data.message
    }
  }

  return { content: "" }
}

function defaultGetSimulatedChunks(content: string) {
  return content.match(/.{1,12}/gs) || [content]
}

async function handleServerStream(
  response: Response,
  context: {
    pendingContent: Ref<string>
    messages: Ref<AiChatMessage[]>
    parseStreamPayload: (raw: string) => AiChatStreamPayload
  }
) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const { events, remainingBuffer } = resolveSSEEvents(buffer)
    buffer = remainingBuffer

    for (const part of events) {
      const dataLine = getSSEDataLine(part)
      if (!dataLine) continue

      const payload = context.parseStreamPayload(dataLine.slice(5).trim())

      if (payload.type === "delta") {
        context.pendingContent.value += payload.content || ""
        continue
      }

      if (payload.type === "done" && payload.message) {
        context.messages.value.push(payload.message)
        context.pendingContent.value = ""
        continue
      }

      if (payload.type === "error") {
        throw new Error(payload.error || "流式输出失败")
      }
    }
  }
}

async function handleClientSimulatedStream(
  response: Response,
  context: {
    pendingContent: Ref<string>
    messages: Ref<AiChatMessage[]>
    createAssistantMessage: (content: string) => AiChatMessage
    parseNonStreamResponse: (response: Response) => Promise<AiChatNonStreamResult>
    getSimulatedChunks: (content: string) => string[]
    simulatedChunkDelay: number
  }
) {
  const result = await context.parseNonStreamResponse(response)
  const content = result.content || ""
  const chunks = context.getSimulatedChunks(content)

  context.pendingContent.value = ""

  for (const chunk of chunks) {
    context.pendingContent.value += chunk
    if (!chunk) continue
    await delay(context.simulatedChunkDelay)
  }

  context.messages.value.push(result.message || context.createAssistantMessage(content))
  context.pendingContent.value = ""
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
