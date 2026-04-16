import type { EChartsOption } from "echarts"
import branchPeriodWarningMockSource from "./mock-branch-period-warning-data.json"

export interface BranchPeriodWarningRow {
  机构分行: string
  报告期: string
  信贷客户数: number
  预警客户数: number
  预警客户占比: number
  大中型信贷客户数: number
  大中型预警客户数: number
  大中型预警客户占比: number
  小微信贷客户数: number
  小微预警客户数: number
  小微预警客户占比: number
}

export const branchPeriodWarningMockData = branchPeriodWarningMockSource as BranchPeriodWarningRow[]

export function buildBranchPeriodWarningComboOption(
  data: BranchPeriodWarningRow[] = branchPeriodWarningMockData,
  branchName = "上海分行"
): EChartsOption {
  const availableBranches = [...new Set(data.map(item => item.机构分行))]
  const activeBranch = availableBranches.includes(branchName) ? branchName : availableBranches[0]
  const rows = data
    .filter(item => item.机构分行 === activeBranch)
    .sort((left, right) => left.报告期.localeCompare(right.报告期, "zh-CN"))

  return {
    title: {
      text: `${activeBranch}信贷客户与预警情况`
    },
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
        name: "客户数"
      },
      {
        type: "value",
        name: "预警客户占比",
        min: 0,
        axisLabel: {
          formatter: value => `${(Number(value) * 100).toFixed(0)}%`
        }
      }
    ],
    series: [
      {
        name: "合计预警客户数",
        type: "bar",
        stack: "合计",
        barWidth: 12,
        barCategoryGap: "58%",
        itemStyle: {
          color: "#2563eb"
        },
        data: rows.map(item => item.预警客户数)
      },
      {
        name: "合计非预警客户数",
        type: "bar",
        stack: "合计",
        barWidth: 12,
        itemStyle: {
          color: "#93c5fd"
        },
        data: rows.map(item => item.信贷客户数 - item.预警客户数)
      },
      {
        name: "大中型预警客户数",
        type: "bar",
        stack: "大中型",
        barWidth: 12,
        itemStyle: {
          color: "#059669"
        },
        data: rows.map(item => item.大中型预警客户数)
      },
      {
        name: "大中型非预警客户数",
        type: "bar",
        stack: "大中型",
        barWidth: 12,
        itemStyle: {
          color: "#a7f3d0"
        },
        data: rows.map(item => item.大中型信贷客户数 - item.大中型预警客户数)
      },
      {
        name: "小微预警客户数",
        type: "bar",
        stack: "小微",
        barWidth: 12,
        itemStyle: {
          color: "#d97706"
        },
        data: rows.map(item => item.小微预警客户数)
      },
      {
        name: "小微非预警客户数",
        type: "bar",
        stack: "小微",
        barWidth: 12,
        itemStyle: {
          color: "#fde68a"
        },
        data: rows.map(item => item.小微信贷客户数 - item.小微预警客户数)
      },
      {
        name: "合计预警客户占比",
        type: "line",
        yAxisIndex: 1,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        itemStyle: {
          color: "#1d4ed8",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        lineStyle: {
          width: 2
        },
        data: rows.map(item => item.预警客户占比)
      },
      {
        name: "大中型预警客户占比",
        type: "line",
        yAxisIndex: 1,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        itemStyle: {
          color: "#059669",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        lineStyle: {
          width: 2
        },
        data: rows.map(item => item.大中型预警客户占比)
      },
      {
        name: "小微预警客户占比",
        type: "line",
        yAxisIndex: 1,
        symbol: "circle",
        symbolSize: 12,
        z: 6,
        itemStyle: {
          color: "#d97706",
          borderColor: "#ffffff",
          borderWidth: 3
        },
        lineStyle: {
          width: 2
        },
        data: rows.map(item => item.小微预警客户占比)
      }
    ]
  }
}

export const branchPeriodWarningComboOption = buildBranchPeriodWarningComboOption()
