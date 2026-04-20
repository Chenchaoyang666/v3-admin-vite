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
      "  \"xAxis\": { \"type\": \"category\", \"data\": [\"Mon\"] },",
      "  \"yAxis\": { \"type\": \"value\" },",
      "  \"series\": [{ \"type\": \"bar\", \"data\": [12] }]",
      "}",
      "```",
      "",
      "```vxetable",
      "{",
      "  \"title\": \"分页结果\",",
      "  \"columns\": [{ \"field\": \"date\", \"title\": \"日期\" }],",
      "  \"data\": [",
      "    { \"date\": \"2026-03-28\" },",
      "    { \"date\": \"2026-03-29\" }",
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
      "  \"columns\": [{ \"field\": \"date\", \"title\": \"日期\" }],",
      "  \"data\": [{ \"date\": \"2026-03-28\" }]",
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
      "  \"xAxis\": { \"type\": \"category\" }"
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
      "  \"columns\": [{ \"field\": \"date\", \"title\": \"日期\" }],",
      "  \"data\": [{ \"date\": \"2026-03-28\" }],",
      "  \"pagination\": { \"pageSize\": 2, \"pageSizes\": [2, 4] }",
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

  it("renders legacy html content instead of escaping it", () => {
    const segments = parseRichContent([
      "<h2>旧格式内容</h2>",
      "<p>这里有一段 <strong>HTML</strong> 文本。</p>",
      "<ul><li>项目 A</li><li>项目 B</li></ul>"
    ].join("\n"))

    expect(segments).toHaveLength(1)
    expect(segments[0]?.type).toBe("markdown")

    if (segments[0]?.type === "markdown") {
      expect(segments[0].html).toContain("<h2>旧格式内容</h2>")
      expect(segments[0].html).toContain("<strong>HTML</strong>")
      expect(segments[0].html).toContain("<li>项目 A</li>")
      expect(segments[0].html).not.toContain("&lt;h2&gt;")
    }
  })

  it("renders trusted html content as-is", () => {
    const segments = parseRichContent([
      "<p onclick=\"alert('xss')\">安全文本</p>",
      "<script>alert('xss')</script>",
      "<a href=\"javascript:alert('xss')\">危险链接</a>",
      "<img src=\"javascript:alert('xss')\" onerror=\"alert('xss')\" alt=\"demo\">"
    ].join("\n"))

    expect(segments).toHaveLength(1)
    expect(segments[0]?.type).toBe("markdown")

    if (segments[0]?.type === "markdown") {
      expect(segments[0].html).toContain("<p onclick=\"alert('xss')\">安全文本</p>")
      expect(segments[0].html).toContain("<script>alert('xss')</script>")
      expect(segments[0].html).toContain("<a href=\"javascript:alert('xss')\">危险链接</a>")
      expect(segments[0].html).toContain("<img src=\"javascript:alert('xss')\" onerror=\"alert('xss')\" alt=\"demo\">")
    }
  })

  it("renders markdown tables correctly inside list items", () => {
    const segments = parseRichContent([
      "3. 预警等级分布：",
      "|预警等级|客户数|占比|较年初变化|",
      "|---|---|---|---|",
      "|红色预警|213|17.08%|+1.25pp|",
      "|橙色预警|489|39.21%|+0.83pp|",
      "|蓝色预警|545|43.71%|-2.08pp|",
      "红色预警占比持续上升，蓝色预警占比下降。",
      "4. 行业分布：制造业、批发零售业、建筑业。"
    ].join("\n"))

    expect(segments).toHaveLength(1)
    expect(segments[0]?.type).toBe("markdown")

    if (segments[0]?.type === "markdown") {
      expect(segments[0].html).toContain("<table>")
      expect(segments[0].html).toContain("<td>红色预警</td>")
      expect(segments[0].html).not.toContain("|预警等级|客户数|占比|较年初变化|")
      expect(segments[0].html).toContain("红色预警占比持续上升，蓝色预警占比下降。")
      expect(segments[0].html).toContain("行业分布：制造业、批发零售业、建筑业。")
    }
  })
})
