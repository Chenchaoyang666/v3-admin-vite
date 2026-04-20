import type { EChartsOption } from "echarts"
import type { RichContentSegment, RichTableBlockConfig, RichTablePaginationConfig } from "./types"
import MarkdownIt from "markdown-it"
import markdownItTaskLists from "markdown-it-task-lists"

const markdown = new MarkdownIt({
  html: true,
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
      html: renderRichText(source)
    })
  }

  const pushMarkdownFence = (language: string, codeLines: string[], closed: boolean) => {
    const fenceLines = [`\`\`\`${language}`, ...codeLines]
    if (closed) {
      fenceLines.push("```")
    }

    segments.push({
      type: "markdown",
      html: renderRichText(fenceLines.join("\n"))
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
            type: "block-loading",
            blockType: "echarts"
          })
          continue
        }

        const raw = codeBuffer.join("\n")
        const option = parseChartOption(raw)
        if (option) {
          segments.push({
            type: "echarts",
            option,
            raw
          })
          continue
        }

        pushMarkdownFence(language, codeBuffer, true)
        continue
      }

      if (language === "vxetable" || language === "vxe-table") {
        flushMarkdown()

        if (!closed) {
          segments.push({
            type: "block-loading",
            blockType: "vxetable"
          })
          continue
        }

        const raw = codeBuffer.join("\n")
        const table = parseVxeTableConfig(raw)
        if (table) {
          segments.push({
            type: "vxetable",
            table,
            raw
          })
          continue
        }

        pushMarkdownFence(language, codeBuffer, true)
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

function parseVxeTableConfig(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Partial<RichTableBlockConfig>
    if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.data)) {
      return null
    }

    const pageSize = normalizePageSize(parsed.pagination?.pageSize)
    const pageSizes = normalizePageSizes(parsed.pagination?.pageSizes)

    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      columns: parsed.columns,
      data: parsed.data,
      pagination: {
        pageSize,
        pageSizes
      }
    } as RichTableBlockConfig
  } catch {
    return null
  }
}

function normalizePageSize(pageSize?: number) {
  return typeof pageSize === "number" && pageSize > 0 ? Math.floor(pageSize) : 5
}

function normalizePageSizes(pageSizes?: RichTablePaginationConfig["pageSizes"]) {
  if (!Array.isArray(pageSizes) || !pageSizes.length) {
    return [5, 10, 20]
  }

  return pageSizes
}

function renderRichText(source: string) {
  return markdown.render(normalizeListItemTables(source))
}

function normalizeListItemTables(source: string) {
  const lines = source.split("\n")
  const normalizedLines: string[] = []

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const baseIndent = line.match(/^(\s*)/)?.[1] || ""
    if (!isListItemLine(line.trimStart())) {
      normalizedLines.push(line)
      index += 1
      continue
    }

    let endIndex = index + 1
    while (endIndex < lines.length) {
      const currentLine = lines[endIndex]
      if (/^\s*$/.test(currentLine)) {
        endIndex += 1
        continue
      }

      const currentIndent = currentLine.match(/^(\s*)/)?.[1] || ""
      if (currentIndent.length <= baseIndent.length && isListItemLine(currentLine.trimStart()))
        break

      endIndex += 1
    }

    const blockLines = lines.slice(index + 1, endIndex)
    const firstContentIndex = blockLines.findIndex(blockLine => blockLine.trim())
    const hasImmediateTable = firstContentIndex >= 0
      && isTableRow(blockLines[firstContentIndex] || "")
      && isTableSeparatorRow(blockLines[firstContentIndex + 1] || "")

    normalizedLines.push(line)

    if (!hasImmediateTable) {
      normalizedLines.push(...blockLines)
      index = endIndex
      continue
    }

    if (blockLines[0]?.trim())
      normalizedLines.push("")

    const nestedIndent = `${baseIndent}   `
    blockLines.forEach((blockLine) => {
      if (!blockLine.trim()) {
        normalizedLines.push("")
        return
      }

      const trimmedLine = blockLine.trimStart()
      if (blockLine.startsWith(nestedIndent)) {
        normalizedLines.push(blockLine)
        return
      }

      normalizedLines.push(`${nestedIndent}${trimmedLine}`)
    })

    index = endIndex
  }

  return normalizedLines.join("\n")
}

function isListItemLine(line: string) {
  return /^[*+\-]\s+\S/.test(line) || /^\d+\.\s+\S/.test(line)
}

function isTableRow(line: string) {
  const text = line.trim()
  return /^\|.+\|\s*$/.test(text)
}

function isTableSeparatorRow(line: string) {
  const text = line.trim()
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(text)
}
