import type { EChartsOption } from "echarts"
import warningIndustryMockSource from "./mock-warning-industry-data.json"

export interface WarningIndustryRow {
  报告期: string
  行业分类名称: string
  预警客户数占比: number
}

export const warningIndustryMockData = warningIndustryMockSource as WarningIndustryRow[]

export function pickTopIndustriesByPeriod(data: WarningIndustryRow[], limit = 5): WarningIndustryRow[] {
  const periods = [...new Set(data.map(item => item.报告期))].sort((left, right) => left.localeCompare(right, "zh-CN"))

  return periods.flatMap((period) => {
    const currentRows = data
      .filter(item => item.报告期 === period)
      .sort((left, right) => {
        if (right.预警客户数占比 !== left.预警客户数占比)
          return right.预警客户数占比 - left.预警客户数占比

        return left.行业分类名称.localeCompare(right.行业分类名称, "zh-CN")
      })

    return currentRows.slice(0, limit)
  })
}

function buildIndustryOrder(rows: WarningIndustryRow[]): string[] {
  const averageRatioMap = rows.reduce<Record<string, { total: number, count: number }>>((accumulator, row) => {
    if (!accumulator[row.行业分类名称]) {
      accumulator[row.行业分类名称] = {
        total: 0,
        count: 0
      }
    }

    accumulator[row.行业分类名称].total += row.预警客户数占比
    accumulator[row.行业分类名称].count += 1
    return accumulator
  }, {})

  return Object.entries(averageRatioMap)
    .sort((left, right) => {
      const averageDiff = right[1].total / right[1].count - left[1].total / left[1].count
      if (averageDiff !== 0)
        return averageDiff

      return left[0].localeCompare(right[0], "zh-CN")
    })
    .map(([industry]) => industry)
}

export const warningIndustryTop5ByPeriodData = pickTopIndustriesByPeriod(warningIndustryMockData)

export function buildTop5LineOption(data: WarningIndustryRow[] = warningIndustryMockData): EChartsOption {
  const topRows = pickTopIndustriesByPeriod(data)
  const periods = [...new Set(topRows.map(item => item.报告期))].sort((left, right) => left.localeCompare(right, "zh-CN"))
  const industries = buildIndustryOrder(topRows)
  const ratioMap = new Map(topRows.map(item => [`${item.行业分类名称}::${item.报告期}`, item.预警客户数占比]))

  return {
    color: ["#1d4ed8", "#ea580c", "#059669", "#7c3aed", "#dc2626", "#0f766e"],
    title: {
      text: "各报告期预警客户数占比前 5 行业趋势"
    },
    tooltip: {
      trigger: "axis",
      formatter(params) {
        const rows = (Array.isArray(params) ? params : [params])
          .map((item) => {
            const rawValue = Array.isArray(item.value) ? item.value[0] : item.value
            const value = typeof rawValue === "number" ? rawValue : Number(rawValue)

            return {
              marker: item.marker,
              name: item.seriesName,
              value
            }
          })
          .filter(item => Number.isFinite(item.value))
          .sort((left, right) => right.value - left.value)

        const title = Array.isArray(params) ? (params[0]?.axisValueLabel || params[0]?.name || "") : (params.axisValueLabel || params.name || "")
        const lines = rows.map(item => `${item.marker}${item.name}：${item.value.toFixed(2)}%`)

        return [title, ...lines].join("<br/>")
      }
    },
    legend: {
      top: 40,
      type: "scroll"
    },
    grid: {
      top: 110,
      left: 56,
      right: 24,
      bottom: 56
    },
    xAxis: {
      type: "category",
      name: "报告期",
      boundaryGap: false,
      data: periods
    },
    yAxis: {
      type: "value",
      name: "预警客户数占比（%）",
      axisLabel: {
        formatter: "{value}%"
      }
    },
    series: industries.map(industry => ({
      name: industry,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      connectNulls: false,
      emphasis: {
        focus: "series"
      },
      lineStyle: {
        width: 3
      },
      data: periods.map((period) => {
        const ratio = ratioMap.get(`${industry}::${period}`)
        return ratio === undefined ? null : Number((ratio * 100).toFixed(2))
      })
    }))
  }
}

export const warningIndustryLineOption = buildTop5LineOption()
export const warningIndustryLineOptionJson = JSON.stringify(warningIndustryLineOption, null, 2)
