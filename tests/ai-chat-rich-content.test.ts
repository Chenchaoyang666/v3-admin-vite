import { describe, expect, it } from "vitest"
import { parseRichContent } from "../src/pages/demo/aiChat/components/RichContentRenderer/utils"

describe("parseRichContent", () => {
  it("parses markdown image, echarts and vxetable blocks in order", () => {
    const content = [
      "# 混合内容",
      "",
      "![preview](https://example.com/demo.png)",
      "",
      "```echarts",
      "{",
      '  "xAxis": { "type": "category", "data": ["Mon"] },',
      '  "yAxis": { "type": "value" },',
      '  "series": [{ "type": "bar", "data": [12] }]',
      "}",
      "```",
      "",
      "```vxetable",
      "{",
      '  "title": "分页结果",',
      '  "columns": [{ "field": "date", "title": "日期" }],',
      '  "data": [',
      '    { "date": "2026-03-28" },',
      '    { "date": "2026-03-29" }',
      "  ]",
      "}",
      "```"
    ].join("\n")

    const segments = parseRichContent(content)

    expect(segments).toHaveLength(3)
    expect(segments[0]?.type).toBe("markdown")
    expect(segments[1]?.type).toBe("echarts")
    expect(segments[2]?.type).toBe("vxetable")

    if (segments[2]?.type === "vxetable") {
      expect(segments[2].table.columns).toHaveLength(1)
      expect(segments[2].table.data).toHaveLength(2)
      expect(segments[2].table.pagination?.pageSize).toBe(5)
    }
  })

  it("returns a loading segment for an unclosed vxetable block", () => {
    const segments = parseRichContent([
      "```vxetable",
      "{",
      '  "columns": [{ "field": "date", "title": "日期" }],',
      '  "data": [{ "date": "2026-03-28" }]',
      "}"
    ].join("\n"))

    expect(segments).toEqual([
      {
        type: "block-loading",
        blockType: "vxetable"
      }
    ])
  })

  it("returns a loading segment for an unclosed echarts block", () => {
    const segments = parseRichContent([
      "```echarts",
      "{",
      '  "xAxis": { "type": "category" }'
    ].join("\n"))

    expect(segments).toEqual([
      {
        type: "block-loading",
        blockType: "echarts"
      }
    ])
  })

  it("falls back to markdown when vxetable json is invalid", () => {
    const segments = parseRichContent([
      "```vxetable",
      "{ invalid json }",
      "```"
    ].join("\n"))

    expect(segments).toHaveLength(1)
    expect(segments[0]?.type).toBe("markdown")
  })

  it("supports the vxe-table fence alias", () => {
    const segments = parseRichContent([
      "```vxe-table",
      "{",
      '  "columns": [{ "field": "date", "title": "日期" }],',
      '  "data": [{ "date": "2026-03-28" }],',
      '  "pagination": { "pageSize": 2, "pageSizes": [2, 4] }',
      "}",
      "```"
    ].join("\n"))

    expect(segments).toHaveLength(1)
    expect(segments[0]?.type).toBe("vxetable")

    if (segments[0]?.type === "vxetable") {
      expect(segments[0].table.pagination?.pageSize).toBe(2)
      expect(segments[0].table.pagination?.pageSizes).toEqual([2, 4])
    }
  })
})
