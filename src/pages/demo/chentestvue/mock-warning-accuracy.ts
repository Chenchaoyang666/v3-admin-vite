import type { EChartsOption } from "echarts"
import warningAccuracyMockSource from "./mock-warning-accuracy-data.json"

export interface WarningAccuracyRow {
  报告期: string
  大中型预警事项数: number
  小微预警事项数: number
  合计预警准确率: number
  大中型预警准确率: number
  小微预警准确率: number
}

export const warningAccuracyMockData = warningAccuracyMockSource as WarningAccuracyRow[]

export function buildWarningAccuracyComboOption(
  data: WarningAccuracyRow[] = warningAccuracyMockData
): EChartsOption {
  const rows = [...data].sort((left, right) => left.报告期.localeCompare(right.报告期, "zh-CN"))

  return {
    title: {
      text: "预警事项数与准确率趋势"
    },
    color: ["#059669", "#d97706", "#1d4ed8", "#047857", "#b45309"],
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      valueFormatter: value => typeof value === "number" && value <= 1 ? `${(value * 100).toFixed(2)}%` : `${value}`
    },
    legend: {
      type: "scroll",
      top: 18,
      left: 16,
      right: 16,
      itemWidth: 14,
      itemHeight: 10
    },
    grid: {
      left: 70,
      right: 90,
      top: 90,
      bottom: 50
    },
    xAxis: {
      type: "category",
      data: rows.map(item => item.报告期)
    },
    yAxis: [
      {
        type: "value",
        name: "预警事项数"
      },
      {
        type: "value",
        name: "准确率",
        min: 0.7,
        max: 1,
        axisLabel: {
          formatter: value => `${(Number(value) * 100).toFixed(0)}%`
        }
      }
    ],
    series: [
      {
        name: "大中型预警事项数",
        type: "bar",
        stack: "预警事项数",
        barWidth: 28,
        barCategoryGap: "40%",
        itemStyle: {
          color: "#059669"
        },
        data: rows.map(item => item.大中型预警事项数)
      },
      {
        name: "小微预警事项数",
        type: "bar",
        stack: "预警事项数",
        barWidth: 28,
        itemStyle: {
          color: "#d97706"
        },
        data: rows.map(item => item.小微预警事项数)
      },
      {
        name: "合计预警准确率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: "#1d4ed8",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        data: rows.map(item => item.合计预警准确率)
      },
      {
        name: "大中型预警准确率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: "#047857",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        data: rows.map(item => item.大中型预警准确率)
      },
      {
        name: "小微预警准确率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: "#b45309",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        data: rows.map(item => item.小微预警准确率)
      }
    ]
  }
}

export const warningAccuracyComboOption = buildWarningAccuracyComboOption()
