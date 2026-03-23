export type AiChatRole = "user" | "assistant"

export interface AiChatMessage {
  id: string
  role: AiChatRole
  content: string
  createdAt: string
}

export interface AiChatStatItem {
  label: string
  value: string | number
}
