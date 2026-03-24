export interface SSEResolveResult {
  events: string[]
  remainingBuffer: string
}

export function resolveSSEEvents(buffer: string) {
  const parts = buffer.split("\n\n")
  return {
    events: parts.slice(0, -1).filter(Boolean),
    remainingBuffer: parts.at(-1) || ""
  } satisfies SSEResolveResult
}

export function getSSEDataLine(eventBlock: string) {
  return eventBlock
    .split("\n")
    .find(line => line.startsWith("data:"))
}
