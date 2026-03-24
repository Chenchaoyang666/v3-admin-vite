import type { AiChatMessage } from "../components/AiChatShell"
import type { ApiResponse } from "./useAiChatSession"
import { ref } from "vue"
import { getSSEDataLine, resolveSSEEvents } from "../utils/sse"

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

export interface ServerStreamSubmitOptions {
  request: () => Promise<Response>
  onDelta: (content: string) => void
  onDone: (message?: AiChatMessage) => void
  parseStreamPayload?: (raw: string) => AiChatStreamPayload
}

export interface ClientSimulatedStreamSubmitOptions {
  request: () => Promise<Response>
  onDelta: (content: string) => void
  onDone: (result: AiChatNonStreamResult) => void
  parseNonStreamResponse?: (response: Response) => Promise<AiChatNonStreamResult>
  getSimulatedChunks?: (content: string) => string[]
  simulatedChunkDelay?: number
}

export function useAiChatStream() {
  const submitting = ref(false)
  const streaming = ref(false)

  async function submitServerStream(options: ServerStreamSubmitOptions) {
    const parseStreamPayload = options.parseStreamPayload || defaultParseStreamPayload

    return runWithStreamState(async () => {
      const response = await options.request()

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
        const { events, remainingBuffer } = resolveSSEEvents(buffer)
        buffer = remainingBuffer

        for (const eventBlock of events) {
          const dataLine = getSSEDataLine(eventBlock)
          if (!dataLine) continue

          const payload = parseStreamPayload(dataLine.slice(5).trim())

          if (payload.type === "delta") {
            options.onDelta(payload.content || "")
            continue
          }

          if (payload.type === "done") {
            options.onDone(payload.message)
            continue
          }

          if (payload.type === "error") {
            throw new Error(payload.error || "流式输出失败")
          }
        }
      }
    })
  }

  async function submitClientSimulatedStream(options: ClientSimulatedStreamSubmitOptions) {
    const parseNonStreamResponse = options.parseNonStreamResponse || defaultParseNonStreamResponse
    const getSimulatedChunks = options.getSimulatedChunks || defaultGetSimulatedChunks
    const simulatedChunkDelay = options.simulatedChunkDelay ?? 45

    return runWithStreamState(async () => {
      const response = await options.request()

      if (!response.ok) {
        throw new Error("请求响应异常")
      }

      const result = await parseNonStreamResponse(response)
      const chunks = getSimulatedChunks(result.content || "")

      for (const chunk of chunks) {
        options.onDelta(chunk)
        if (!chunk) continue
        await delay(simulatedChunkDelay)
      }

      options.onDone(result)
    })
  }

  async function runWithStreamState(task: () => Promise<void>) {
    if (submitting.value || streaming.value) return

    submitting.value = true
    streaming.value = true

    try {
      await task()
    } finally {
      submitting.value = false
      streaming.value = false
    }
  }

  return {
    submitting,
    streaming,
    submitServerStream,
    submitClientSimulatedStream
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
