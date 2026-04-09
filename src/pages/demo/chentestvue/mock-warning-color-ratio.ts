import type { EChartsOption } from "echarts"
import warningColorRatioMockSource from "./mock-warning-color-ratio-data.json"

export interface WarningColorRatioRow {
  报告期: string
  红色预警客户占比: number
  橙色预警客户占比: number
  蓝色预警客户占比: number
}

export const warningColorRatioMockData = warningColorRatioMockSource as WarningColorRatioRow[]

export function buildWarningColorRatioLineOption(
  data: WarningColorRatioRow[] = warningColorRatioMockData
): EChartsOption {
  const rows = [...data].sort((left, right) => left.报告期.localeCompare(right.报告期, "zh-CN"))

  return {
    title: {
      text: "三色预警客户占比趋势"
    },
    color: ["#dc2626", "#ea580c", "#2563eb"],
    tooltip: {
      trigger: "axis",
      valueFormatter: value => typeof value === "number" ? `${(value * 100).toFixed(2)}%` : `${value}`
    },
    legend: {
      top: 16
    },
    grid: {
      left: 70,
      right: 40,
      top: 80,
      bottom: 50
    },
    xAxis: {
      type: "category",
      data: rows.map(item => item.报告期)
    },
    yAxis: {
      type: "value",
      name: "预警客户占比",
      min: 0,
      max: 0.04,
      axisLabel: {
        formatter: value => `${(Number(value) * 100).toFixed(0)}%`
      }
    },
    series: [
      {
        name: "红色预警客户占比",
        type: "line",
        smooth: true,
        symbol: "triangle",
        symbolSize: 12,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2
        },
        data: rows.map(item => item.红色预警客户占比)
      },
      {
        name: "橙色预警客户占比",
        type: "line",
        smooth: true,
        symbol: "triangle",
        symbolSize: 12,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2
        },
        data: rows.map(item => item.橙色预警客户占比)
      },
      {
        name: "蓝色预警客户占比",
        type: "line",
        smooth: true,
        symbol: "triangle",
        symbolSize: 12,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2
        },
        data: rows.map(item => item.蓝色预警客户占比)
      }
    ]
  }
}

export const warningColorRatioLineOption = buildWarningColorRatioLineOption()
