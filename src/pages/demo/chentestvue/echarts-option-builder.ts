type Primitive = string | number | boolean | null | undefined;

export type DataRow = Record<string, Primitive>;

export type SupportedChartType = "line" | "bar" | "pie";

export interface InferredDataShape {
  allFields: string[];
  numericFields: string[];
  dimensionFields: string[];
  timeFields: string[];
  categoryFields: string[];
  metricCandidates: string[];
  xField: string | null;
  seriesFields: string[];
}

export interface BuildChartOptions {
  chartType?: SupportedChartType;
  title?: string;
  xField?: string;
  seriesFields?: string[];
  categoryField?: string;
  metricField?: string;
  latestByField?: string;
  latestByValue?: Primitive;
  smooth?: boolean;
  areaStyle?: boolean;
  stack?: string;
  xAxisName?: string;
  yAxisName?: string;
  yAxisFormatter?: (value: number) => string;
  radius?: string | [string, string];
}

interface BaseOption {
  title?: { text: string };
  tooltip: Record<string, unknown>;
  legend?: Record<string, unknown>;
  grid?: Record<string, unknown>;
  xAxis?: Record<string, unknown>;
  yAxis?: Record<string, unknown>;
  dataZoom?: Array<Record<string, unknown>>;
  series: Array<Record<string, unknown>>;
}

const TIME_KEYWORDS = ["日期", "时间", "报告期", "月份", "年月", "year", "month", "date", "time"];
const CATEGORY_KEYWORDS = ["名称", "机构", "部门", "区域", "网点", "分类", "类型", "name", "type"];
const METRIC_PRIORITY_KEYWORDS = ["金额", "数量", "数", "占比", "比例", "率", "value", "count", "amount"];

function isNil(value: Primitive): value is null | undefined | "" {
  return value === null || value === undefined || value === "";
}

function isNumeric(value: Primitive): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  return !Number.isNaN(Number(text));
}

function toNumber(value: Primitive): number | null {
  if (typeof value === "number") return value;
  if (!isNumeric(value)) return null;
  return Number(value);
}

function safeGet(row: DataRow, key: string): Primitive {
  return Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined;
}

function uniq(values: Primitive[]): Primitive[] {
  return Array.from(new Set(values));
}

function sortByText(values: Primitive[]): Primitive[] {
  return [...values].sort((left, right) => String(left).localeCompare(String(right), "zh-CN"));
}

function includesKeyword(field: string, keywords: string[]): boolean {
  const lowerField = field.toLowerCase();
  return keywords.some((keyword) => lowerField.includes(keyword.toLowerCase()));
}

function looksLikeDateValue(value: Primitive): boolean {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  return (
    /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?$/.test(text) ||
    /^\d{4}年\d{1,2}月(\d{1,2}日)?$/.test(text) ||
    /^\d{4}\d{2}$/.test(text)
  );
}

function fieldValues(rows: DataRow[], field: string): Primitive[] {
  return rows.map((row) => safeGet(row, field)).filter((value) => !isNil(value));
}

function distinctCount(rows: DataRow[], field: string): number {
  return uniq(fieldValues(rows, field)).length;
}

function isMostlyDateField(rows: DataRow[], field: string): boolean {
  const values = fieldValues(rows, field);
  if (values.length === 0) return false;
  const hits = values.filter(looksLikeDateValue).length;
  return hits / values.length >= 0.6;
}

function isNumericField(rows: DataRow[], field: string): boolean {
  return rows.every((row) => isNil(safeGet(row, field)) || isNumeric(safeGet(row, field)));
}

function rankCategoryFields(rows: DataRow[], fields: string[]): string[] {
  return [...fields].sort((left, right) => {
    const leftKeyword = includesKeyword(left, CATEGORY_KEYWORDS) ? 1 : 0;
    const rightKeyword = includesKeyword(right, CATEGORY_KEYWORDS) ? 1 : 0;
    if (leftKeyword !== rightKeyword) return rightKeyword - leftKeyword;

    const leftCardinality = distinctCount(rows, left);
    const rightCardinality = distinctCount(rows, right);
    return leftCardinality - rightCardinality;
  });
}

function rankSeriesFields(rows: DataRow[], fields: string[], excluded: string[] = []): string[] {
  return fields
    .filter((field) => !excluded.includes(field))
    .sort((left, right) => {
      const leftDistinct = distinctCount(rows, left);
      const rightDistinct = distinctCount(rows, right);
      const leftUsable = leftDistinct > 1 ? 1 : 0;
      const rightUsable = rightDistinct > 1 ? 1 : 0;
      if (leftUsable !== rightUsable) return rightUsable - leftUsable;

      const leftKeyword = includesKeyword(left, CATEGORY_KEYWORDS) ? 1 : 0;
      const rightKeyword = includesKeyword(right, CATEGORY_KEYWORDS) ? 1 : 0;
      if (leftKeyword !== rightKeyword) return rightKeyword - leftKeyword;

      const leftDistance = Math.abs(leftDistinct - 6);
      const rightDistance = Math.abs(rightDistinct - 6);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;

      return left.localeCompare(right, "zh-CN");
    });
}

function rankMetricFields(fields: string[]): string[] {
  return [...fields].sort((left, right) => {
    const leftScore = METRIC_PRIORITY_KEYWORDS.findIndex((keyword) => left.includes(keyword));
    const rightScore = METRIC_PRIORITY_KEYWORDS.findIndex((keyword) => right.includes(keyword));
    const normalizedLeft = leftScore === -1 ? Number.MAX_SAFE_INTEGER : leftScore;
    const normalizedRight = rightScore === -1 ? Number.MAX_SAFE_INTEGER : rightScore;
    if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
    return left.localeCompare(right, "zh-CN");
  });
}

function firstAvailable(fields: string[], excluded: string[] = []): string | null {
  return fields.find((field) => !excluded.includes(field)) || null;
}

function normalizeAxisData(rows: DataRow[], xField: string): Primitive[] {
  return sortByText(uniq(fieldValues(rows, xField)));
}

export function inferDataShape(rows: DataRow[] = []): InferredDataShape {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      allFields: [],
      numericFields: [],
      dimensionFields: [],
      timeFields: [],
      categoryFields: [],
      metricCandidates: [],
      xField: null,
      seriesFields: [],
    };
  }

  const allFields = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
  const numericFields = allFields.filter((field) => isNumericField(rows, field));
  const dimensionFields = allFields.filter((field) => !numericFields.includes(field));
  const timeFields = dimensionFields.filter(
    (field) => includesKeyword(field, TIME_KEYWORDS) || isMostlyDateField(rows, field),
  );
  const categoryFields = rankCategoryFields(
    rows,
    dimensionFields.filter((field) => !timeFields.includes(field)),
  );
  const metricCandidates = rankMetricFields(numericFields);
  const xField = firstAvailable(timeFields) || firstAvailable(categoryFields);
  const seriesCandidates = rankSeriesFields(rows, categoryFields, xField ? [xField] : []);
  const seriesFields = seriesCandidates.slice(0, 2);

  return {
    allFields,
    numericFields,
    dimensionFields,
    timeFields,
    categoryFields,
    metricCandidates,
    xField,
    seriesFields,
  };
}

function pickMetricField(shape: InferredDataShape, preferredMetric?: string): string | null {
  if (preferredMetric && shape.numericFields.includes(preferredMetric)) return preferredMetric;
  return firstAvailable(shape.metricCandidates);
}

function buildSeriesMatrix(
  rows: DataRow[],
  xField: string,
  seriesFields: string[],
  metricField: string,
  chartType: "line" | "bar",
  smooth: boolean,
  areaStyle: boolean,
  stack?: string,
) {
  const xAxisData = normalizeAxisData(rows, xField);
  const getSeriesKey = (row: DataRow): string | null => {
    const values = seriesFields.map((field) => {
      const value = safeGet(row, field);
      if (isNil(value)) return null;
      const text = String(value).trim();
      return text ? text : null;
    });

    if (values.some(value => value === null))
      return null

    return values.join(" / ")
  }

  const legendData = sortByText(
    uniq(
      rows
        .map(row => getSeriesKey(row))
        .filter((label): label is string => Boolean(label))
    )
  );

  const series = legendData.map((legendName) => {
    const data = xAxisData.map((xValue) => {
      const hit = rows.find(
        (row) => safeGet(row, xField) === xValue
          && getSeriesKey(row) === legendName,
      );
      return hit ? toNumber(safeGet(hit, metricField)) : null;
    });

    return {
      name: String(legendName),
      type: chartType,
      data,
      smooth: chartType === "line" ? smooth : undefined,
      areaStyle: chartType === "line" && areaStyle ? {} : undefined,
      stack: stack || undefined,
      connectNulls: false,
    };
  });

  return { xAxisData, legendData, series };
}

function latestValue(rows: DataRow[], field: string): Primitive | null {
  const values = normalizeAxisData(rows, field);
  return values.length ? values[values.length - 1] : null;
}

function estimateLabelLength(values: Primitive[]): number {
  return values.reduce<number>((max, value) => {
    const currentLength = String(value ?? "").length;
    return Math.max(max, currentLength);
  }, 0);
}

function buildCartesianLayout(xAxisData: Primitive[], seriesCount: number, hasLegend: boolean) {
  const xAxisCount = xAxisData.length;
  const longestLabel = estimateLabelLength(xAxisData);
  const denseAxis = xAxisCount > 6 || longestLabel > 8;
  const heavySeries = seriesCount > 6;
  const crowded = xAxisCount > 10 || seriesCount > 10 || (xAxisCount >= 6 && seriesCount >= 6);

  const rotate = longestLabel > 10 || xAxisCount > 8 ? 35 : 0;
  const bottom = rotate > 0 ? 88 : 56;
  const top = hasLegend ? (seriesCount > 12 ? 108 : 84) : 56;

  return {
    crowded,
    hasLegend,
    grid: {
      left: 72,
      right: 28,
      top,
      bottom,
      containLabel: true,
    },
    legend: hasLegend
      ? {
          type: "scroll",
          top: 18,
          left: 16,
          right: 16,
          itemWidth: 14,
          itemHeight: 10,
        }
      : undefined,
    xAxisLabel: {
      interval: denseAxis ? "auto" : 0,
      rotate,
      hideOverlap: true,
      width: rotate > 0 ? 110 : 88,
      overflow: "truncate",
      margin: 14,
    },
    yAxisNameGap: hasLegend ? (heavySeries ? 68 : 58) : (heavySeries ? 56 : 44),
    dataZoom: crowded
      ? [
          {
            type: "slider",
            xAxisIndex: 0,
            height: 18,
            bottom: 18,
            start: 0,
            end: xAxisCount > 20 ? 35 : 60,
          },
          {
            type: "inside",
            xAxisIndex: 0,
            start: 0,
            end: xAxisCount > 20 ? 35 : 60,
          },
        ]
      : undefined,
  };
}

function buildCartesianOption(rows: DataRow[], options: BuildChartOptions): BaseOption {
  const shape = inferDataShape(rows);
  const xField = options.xField || shape.xField;
  const seriesFields = options.seriesFields?.length ? options.seriesFields : shape.seriesFields;
  const metricField = pickMetricField(shape, options.metricField);

  if (!xField || !metricField) {
    throw new Error("无法自动识别横轴字段或指标字段，请传入 xField 和 metricField。");
  }

  if (!seriesFields.length) {
    const xAxisData = normalizeAxisData(rows, xField);
    const layout = buildCartesianLayout(xAxisData, 1, false);
    const seriesData = xAxisData.map((xValue) => {
      const hit = rows.find((row) => safeGet(row, xField) === xValue);
      return hit ? toNumber(safeGet(hit, metricField)) : null;
    });

    return {
      title: options.title ? { text: options.title } : undefined,
      tooltip: { trigger: "axis" },
      grid: layout.grid,
      dataZoom: layout.dataZoom,
      xAxis: {
        type: "category",
        name: options.xAxisName || xField,
        data: xAxisData,
        axisLabel: layout.xAxisLabel,
        nameLocation: "middle",
        nameGap: layout.crowded ? 64 : 40,
      },
      yAxis: {
        type: "value",
        name: options.yAxisName || metricField,
        // nameLocation: "middle",
        // nameRotate: 90,
        axisLabel: options.yAxisFormatter ? { formatter: options.yAxisFormatter } : undefined,
        nameGap: layout.yAxisNameGap,
      },
      series: [
        {
          name: metricField,
          type: options.chartType || "line",
          data: seriesData,
          smooth: options.chartType !== "bar" ? options.smooth ?? true : undefined,
          areaStyle: options.areaStyle ? {} : undefined,
          stack: options.stack || undefined,
          barMaxWidth: options.chartType === "bar" ? 32 : undefined,
          barMinWidth: options.chartType === "bar" ? 8 : undefined,
          barCategoryGap: options.chartType === "bar" ? "30%" : undefined,
        },
      ],
    };
  }

  const { xAxisData, legendData, series } = buildSeriesMatrix(
    rows,
    xField,
    seriesFields,
    metricField,
    options.chartType === "bar" ? "bar" : "line",
    options.smooth ?? true,
    options.areaStyle ?? false,
    options.stack,
  );
  const layout = buildCartesianLayout(xAxisData, legendData.length, true);

  return {
    title: options.title ? { text: options.title } : undefined,
    tooltip: { trigger: "axis" },
    legend: layout.legend ? { ...layout.legend, data: legendData } : { data: legendData },
    grid: layout.grid,
    dataZoom: layout.dataZoom,
    xAxis: {
      type: "category",
      name: options.xAxisName || xField,
      data: xAxisData,
      axisLabel: layout.xAxisLabel,
      nameLocation: "middle",
      nameGap: layout.crowded ? 64 : 40,
    },
    yAxis: {
      type: "value",
      name: options.yAxisName || metricField,
      // nameLocation: "middle",
      // nameRotate: 90,
      axisLabel: options.yAxisFormatter ? { formatter: options.yAxisFormatter } : undefined,
      nameGap: layout.yAxisNameGap,
    },
    series: series.map(item => ({
      ...item,
      barMaxWidth: item.type === "bar" ? 14 : undefined,
      barMinWidth: item.type === "bar" ? 2 : undefined,
      barGap: item.type === "bar" ? "8%" : undefined,
      barCategoryGap: item.type === "bar" ? "28%" : undefined,
    })),
  };
}

function buildPieOption(rows: DataRow[], options: BuildChartOptions): BaseOption {
  const shape = inferDataShape(rows);
  const categoryField = options.categoryField || firstAvailable(shape.categoryFields) || shape.xField;
  const metricField = pickMetricField(shape, options.metricField);
  const latestByField = options.latestByField;
  const targetValue =
    options.latestByValue ?? (latestByField ? latestValue(rows, latestByField) : null);
  const sourceRows =
    latestByField && !isNil(targetValue)
      ? rows.filter((row) => safeGet(row, latestByField) === targetValue)
      : rows;

  if (!categoryField || !metricField) {
    throw new Error("无法自动识别饼图分类字段或指标字段，请传入 categoryField 和 metricField。");
  }

  return {
    title: options.title ? { text: options.title } : undefined,
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", right: 0, top: "middle" },
    series: [
      {
        name: metricField,
        type: "pie",
        radius: options.radius || ["40%", "70%"],
        center: ["42%", "50%"],
        data: sourceRows.map((row) => ({
          name: String(safeGet(row, categoryField)),
          value: toNumber(safeGet(row, metricField)),
        })),
        label: { formatter: "{b}: {d}%" },
      },
    ],
  };
}

export function buildEChartsOption(rows: DataRow[] = [], options: BuildChartOptions = {}): BaseOption {
  const chartType = options.chartType || "line";
  if (chartType === "pie") return buildPieOption(rows, options);
  return buildCartesianOption(rows, options);
}

export function buildChartOptionsByMetrics(rows: DataRow[] = [], options: Omit<BuildChartOptions, "metricField"> = {}) {
  const shape = inferDataShape(rows);
  const entries = shape.metricCandidates.map((metricField) => [
    metricField,
    buildEChartsOption(rows, { ...options, metricField }),
  ]);
  return Object.fromEntries(entries) as Record<string, BaseOption>;
}
