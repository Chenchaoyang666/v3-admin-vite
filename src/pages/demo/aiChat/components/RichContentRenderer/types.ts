import type { EChartsOption } from "echarts"
import type { VxePagerPropTypes, VxeTableDefines } from "vxe-table"

export type RichBlockType = "echarts" | "vxetable"

export interface RichMarkdownSegment {
  type: "markdown"
  html: string
}

export interface RichChartSegment {
  type: "echarts"
  option: EChartsOption
  raw: string
}

export interface RichTablePaginationConfig {
  pageSize?: number
  pageSizes?: VxePagerPropTypes.PageSizes
}

export interface RichTableBlockConfig {
  title?: string
  columns: VxeTableDefines.ColumnOptions[]
  data: Record<string, any>[]
  pagination?: RichTablePaginationConfig
}

export interface RichTableSegment {
  type: "vxetable"
  table: RichTableBlockConfig
  raw: string
}

export interface RichBlockLoadingSegment {
  type: "block-loading"
  blockType: RichBlockType
}

export type RichContentSegment =
  | RichMarkdownSegment
  | RichChartSegment
  | RichTableSegment
  | RichBlockLoadingSegment
