import type { EChartsOption } from "echarts"
import type { RichContentSegment } from "./types"
import MarkdownIt from "markdown-it"
import markdownItTaskLists from "markdown-it-task-lists"

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
}).use(markdownItTaskLists, {
  enabled: true,
  label: true,
  labelAfter: true
})

markdown.renderer.rules.table_open = () => "<div class=\"md-table-wrap\"><table>"
markdown.renderer.rules.table_close = () => "</table></div>"

export function parseRichContent(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").trim()
  if (!normalized) return [] as RichContentSegment[]

  const segments: RichContentSegment[] = []
  const lines = normalized.split("\n")
  const buffer: string[] = []
  let index = 0

  const flushMarkdown = () => {
    if (!buffer.length) return
    const source = buffer.join("\n").trim()
    buffer.length = 0
    if (!source) return
    segments.push({
      type: "markdown",
      html: markdown.render(source)
    })
  }

  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith("```")) {
      const language = line.slice(3).trim().toLowerCase()
      index += 1
      const codeBuffer: string[] = []
      let closed = false

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeBuffer.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        closed = true
        index += 1
      }

      if (language === "echarts") {
        flushMarkdown()

        if (!closed) {
          segments.push({
            type: "echarts-loading"
          })
          continue
        }

        const option = parseChartOption(codeBuffer.join("\n"))
        if (option) {
          segments.push({
            type: "echarts",
            option,
            raw: codeBuffer.join("\n")
          })
          continue
        }

        segments.push({
          type: "echarts-loading"
        })
        continue
      }

      const fenceLines = [line, ...codeBuffer]
      if (closed) {
        fenceLines.push("```")
      }
      buffer.push(...fenceLines)
      continue
    }

    buffer.push(line)
    index += 1
  }

  flushMarkdown()
  return segments
}

function parseChartOption(raw: string) {
  try {
    return JSON.parse(raw) as EChartsOption
  } catch {
    return null
  }
}
