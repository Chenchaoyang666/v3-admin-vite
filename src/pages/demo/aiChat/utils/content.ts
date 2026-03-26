export function isHtmlString(content: string) {
  const text = content.trim()
  if (!text) return false

  if (/<([a-z][a-z0-9-]*)(\s[^>]*)?>[\s\S]*<\/\1>/i.test(text)) return true
  if (/<([a-z][a-z0-9-]*)(\s[^>]*)?\/>/i.test(text)) return true
  if (/<(br|hr|img|input|meta|link)(\s[^>]*)?>/i.test(text)) return true

  return false
}

export function isMarkdownString(content: string) {
  const text = content.trim()
  if (!text) return false

  if (/^#{1,6}\s+\S+/m.test(text)) return true
  if (/^\s*[-*+]\s+\S+/m.test(text)) return true
  if (/^\s*\d+\.\s+\S+/m.test(text)) return true
  if (/^\s*>\s+\S+/m.test(text)) return true
  if (/```[\s\S]*?```/.test(text)) return true
  if (/`[^`\n]+`/.test(text)) return true
  if (/\*\*[^*\n]+\*\*/.test(text)) return true
  if (/\*[^*\n]+\*/.test(text)) return true
  if (/!\[[^\]]*]\([^)]+\)/.test(text)) return true
  if (/\[[^\]]+]\([^)]+\)/.test(text)) return true
  if (/^\|.+\|\s*$/m.test(text) && /^\|?[\s:-]+\|[\s|:-]*$/m.test(text)) return true
  if (/^-{3,}$|^_{3,}$|^\*{3,}$/m.test(text)) return true

  return false
}
