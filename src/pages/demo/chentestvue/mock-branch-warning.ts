import type { EChartsOption } from "echarts"
import branchWarningMockSource from "./mock-branch-warning-data.json"

export interface BranchWarningRow {
  机构分行: string
  信贷客户数: number
  预警客户数: number
  预警客户占比: number
}

export const branchWarningMockData = branchWarningMockSource as BranchWarningRow[]

export function buildBranchWarningBarOption(data: BranchWarningRow[] = branchWarningMockData): EChartsOption {
  return {
    title: {
      text: "机构分行信贷客户与预警情况"
    },
    color: ["#2563eb", "#f59e0b", "#10b981"],
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter(params) {
        const rows = Array.isArray(params) ? params : [params]
        const header = rows[0]?.name || ""
        const lines = rows.map((item) => {
          const rawValue = Array.isArray(item.value) ? item.value[0] : item.value
          const value = item.seriesName === "预警客户占比"
            ? `${(Number(rawValue) * 100).toFixed(2)}%`
            : rawValue

          return `${item.marker}${item.seriesName}：${value}`
        })

        return [header, ...lines].join("<br/>")
      }
    },
    legend: {
      top: 10
    },
    grid: {
      left: 120,
      right: 90,
      top: 70,
      bottom: 30
    },
    xAxis: [
      {
        type: "value",
        name: "客户数"
      },
      {
        type: "value",
        name: "预警客户占比",
        min: 0,
        max: 0.04,
        axisLabel: {
          formatter: value => `${(Number(value) * 100).toFixed(0)}%`
        }
      }
    ],
    yAxis: {
      type: "category",
      data: data.map(item => item.机构分行)
    },
    series: [
      {
        name: "信贷客户数",
        type: "bar",
        xAxisIndex: 0,
        data: data.map(item => item.信贷客户数),
        label: {
          show: true,
          position: "right"
        }
      },
      {
        name: "预警客户数",
        type: "bar",
        xAxisIndex: 0,
        data: data.map(item => item.预警客户数),
        label: {
          show: true,
          position: "right"
        }
      },
      {
        name: "预警客户占比",
        type: "bar",
        xAxisIndex: 1,
        data: data.map(item => item.预警客户占比),
        label: {
          show: true,
          position: "right",
          formatter: ({ value }) => `${(Number(value) * 100).toFixed(2)}%`
        }
      }
    ]
  }
}

export const branchWarningBarOption = buildBranchWarningBarOption()
