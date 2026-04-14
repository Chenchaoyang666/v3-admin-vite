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
  return sanitizeHtml(markdown.render(source))
}

const BLOCKED_TAGS = new Set([
  "applet",
  "audio",
  "base",
  "button",
  "embed",
  "form",
  "frame",
  "frameset",
  "iframe",
  "link",
  "meta",
  "object",
  "script",
  "select",
  "source",
  "style",
  "textarea",
  "track",
  "video"
])

const ALLOWED_TAGS = new Set([
  "a",
  "article",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "input",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
])

const GLOBAL_ALLOWED_ATTRS = new Set([
  "class",
  "title"
])

const TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "title"]),
  input: new Set(["type", "checked", "disabled"]),
  ol: new Set(["start"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"])
}

function sanitizeHtml(html: string) {
  if (typeof DOMParser === "undefined") {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+=(["']).*?\1/gi, "")
      .replace(/\s(href|src)=(["'])javascript:.*?\2/gi, "")
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(html, "text/html")
  sanitizeNode(document.body, document)
  return document.body.innerHTML
}

function sanitizeNode(root: ParentNode, document: Document) {
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove()
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as HTMLElement
    const tag = element.tagName.toLowerCase()

    sanitizeNode(element, document)

    if (BLOCKED_TAGS.has(tag)) {
      element.remove()
      return
    }

    if (!ALLOWED_TAGS.has(tag)) {
      unwrapElement(element, document)
      return
    }

    sanitizeAttributes(element, tag)
  })
}

function unwrapElement(element: HTMLElement, document: Document) {
  const fragment = document.createDocumentFragment()
  while (element.firstChild) {
    fragment.appendChild(element.firstChild)
  }
  element.replaceWith(fragment)
}

function sanitizeAttributes(element: HTMLElement, tag: string) {
  const tagAllowedAttrs = TAG_ALLOWED_ATTRS[tag] ?? new Set<string>()

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase()
    const value = attribute.value.trim()

    if (name.startsWith("on") || name === "style" || name === "srcset") {
      element.removeAttribute(attribute.name)
      return
    }

    if (!GLOBAL_ALLOWED_ATTRS.has(name) && !tagAllowedAttrs.has(name)) {
      element.removeAttribute(attribute.name)
      return
    }

    if ((name === "href" || name === "src") && !isSafeUrl(value, name)) {
      element.removeAttribute(attribute.name)
      return
    }

    if (tag === "a" && name === "target" && value !== "_blank") {
      element.removeAttribute(attribute.name)
      return
    }
  })

  if (tag === "a" && element.getAttribute("target") === "_blank") {
    element.setAttribute("rel", "noopener noreferrer")
  }

  if (tag === "input" && element.getAttribute("type") !== "checkbox") {
    unwrapElement(element, element.ownerDocument)
  }
}

function isSafeUrl(value: string, attrName: "href" | "src") {
  if (!value) return false

  if (value.startsWith("#") || value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
    return true
  }

  if (attrName === "src" && value.startsWith("data:image/")) {
    return true
  }

  try {
    const url = new URL(value, "https://local.codex")
    const protocol = url.protocol.toLowerCase()

    if (protocol === "http:" || protocol === "https:") {
      return true
    }

    return attrName === "href" && (protocol === "mailto:" || protocol === "tel:")
  } catch {
    return false
  }
}
