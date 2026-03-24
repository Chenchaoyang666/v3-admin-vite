import type { EChartsOption } from "echarts"

export interface RichMarkdownSegment {
  type: "markdown"
  html: string
}

export interface RichChartSegment {
  type: "echarts"
  option: EChartsOption
  raw: string
}

export interface RichChartLoadingSegment {
  type: "echarts-loading"
}

export type RichContentSegment = RichMarkdownSegment | RichChartSegment | RichChartLoadingSegment
