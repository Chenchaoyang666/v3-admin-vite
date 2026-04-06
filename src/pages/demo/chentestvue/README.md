# ECharts Option Builder 说明

本文档说明 `echarts-option-builder.ts` 的核心逻辑，帮助后续按需修改图表字段推断、复合系列生成和 ECharts 配置输出。

文件位置：
- `src/pages/demo/chentestvue/echarts-option-builder.ts`

## 1. 这个文件负责什么

这个文件的职责是：

- 从表格型数据 `rows` 中推断字段角色
- 根据图表类型生成 ECharts option
- 支持折线图、柱状图、饼图
- 支持自动识别单系列和多字段复合系列
- 支持按多个数值字段批量生成多份 option

入口函数有两个：

- `buildEChartsOption(rows, options)`
  - 生成单个图表 option
- `buildChartOptionsByMetrics(rows, options)`
  - 针对每个指标字段各生成一份 option

## 2. 输入数据模型

基础数据结构：

```ts
type Primitive = string | number | boolean | null | undefined;
type DataRow = Record<string, Primitive>;
```

也就是说，每一行都是一个普通对象，例如：

```ts
[
  { 月份: "2026-01", 区域: "华东", 产品: "A", 销售额: 120 },
  { 月份: "2026-01", 区域: "华南", 产品: "A", 销售额: 98 },
  { 月份: "2026-02", 区域: "华东", 产品: "A", 销售额: 135 },
]
```

## 3. 总体执行流程

笛卡尔坐标图（折线 / 柱状）的大致流程如下：

1. `inferDataShape(rows)` 推断字段角色
2. 从 `options` 和推断结果中确定：
   - `xField`
   - `seriesFields`
   - `metricField`
3. 如果没有系列字段，生成单系列图
4. 如果有系列字段，进入 `buildSeriesMatrix()` 生成多系列数据
5. 调用 `buildCartesianLayout()` 根据数据密度调整图例、坐标轴、滚动缩放等布局
6. 组装成最终 ECharts option

饼图流程更简单：

1. 推断分类字段和指标字段
2. 可选地按 `latestByField` 只取某个最新切片
3. 输出饼图 series

## 4. 字段推断规则

字段推断入口：

```ts
inferDataShape(rows)
```

它会返回这些信息：

- `allFields`: 所有字段
- `numericFields`: 数值字段
- `dimensionFields`: 维度字段，等于非数值字段
- `timeFields`: 时间维度字段
- `categoryFields`: 普通分类字段
- `metricCandidates`: 候选指标字段
- `xField`: 推断出的横轴字段
- `seriesFields`: 推断出的多个系列字段，当前默认最多 2 个

### 4.1 数值字段如何识别

`isNumericField(rows, field)` 的规则是：

- 该列所有非空值都可以被转成数字
- 数字字符串也算，例如 `"123"`、`"45.6"`

因此 `"001"` 这种字符串也会被当作数字处理。如果某些编码字段不希望被识别成数值字段，需要额外加白名单或黑名单逻辑。

### 4.2 时间字段如何识别

时间字段来自两部分判断：

- 字段名包含时间关键词，如 `日期`、`时间`、`month`、`date`
- 或者该列 60% 以上的值看起来像日期格式

当前支持的日期样式主要有：

- `2026-01`
- `2026/01/31`
- `2026年01月`
- `202601`

### 4.3 分类字段如何识别

分类字段等于：

- 所有非数值字段
- 排除掉已识别为时间字段的列

然后通过 `rankCategoryFields()` 排序，优先级大致是：

1. 字段名包含分类关键词，如 `名称`、`机构`、`部门`、`类型`
2. 去重值更少的字段优先

### 4.4 指标字段如何识别

指标字段候选来自所有数值字段，然后通过 `rankMetricFields()` 排序。

优先级主要看字段名里是否包含这些关键词：

- `金额`
- `数量`
- `数`
- `占比`
- `比例`
- `率`
- `value`
- `count`
- `amount`

如果没有命中关键词，就按字段名字典序。

### 4.5 横轴字段如何识别

`xField` 的选择顺序：

1. 第一个时间字段
2. 如果没有时间字段，则取第一个分类字段

所以默认更偏向“时间作为横轴”的图表结构。

### 4.6 系列字段如何识别

系列字段来自 `rankSeriesFields()`，大致规则：

1. 先从分类字段里排除掉 `xField`
2. 去重值数量大于 1 的字段更优先
3. 字段名包含分类关键词的更优先
4. 去重数量更接近 6 的更优先

最终：

- `seriesFields` 取前两个字段

也就是说，默认自动推断时最多会使用 2 个字段构造复合系列。

## 5. 多个复合系列是怎么识别的

“多个复合系列”并不是嵌套结构，而是把多个字段值拼成一个联合 key。

核心函数：

```ts
buildSeriesMatrix(rows, xField, seriesFields, metricField, ...)
```

其中 `seriesFields` 是一个数组，例如：

```ts
["区域", "产品"]
```

对于每一行，内部会执行类似逻辑：

```ts
const values = seriesFields.map(field => row[field]);
return values.join(" / ");
```

例如数据：

```ts
{ 月份: "2026-01", 区域: "华东", 产品: "A", 销售额: 120 }
```

生成的系列 key 就是：

```ts
"华东 / A"
```

再例如：

```ts
{ 月份: "2026-01", 区域: "华南", 产品: "A", 销售额: 98 }
```

生成的系列 key 是：

```ts
"华南 / A"
```

这些唯一 key 会被去重后作为：

- `legend.data`
- 每一条 `series.name`

### 5.1 空值处理

只要 `seriesFields` 中任意一个字段为空：

- `null`
- `undefined`
- `""`

这一行就不会参与复合系列生成，因为 `getSeriesKey()` 会返回 `null`。

### 5.2 当前实现的本质

当前实现的本质是：

- 多字段组合
- 扁平化成一个字符串
- 用这个字符串代表一条 ECharts 系列

它不是：

- 多层嵌套 legend
- 树形系列结构
- ECharts dataset 的维度映射关系

如果后续想做“按一级分组、二级分色”的更复杂展示，需要在这里重构系列组织方式。

## 6. 多系列数据是怎么对齐到横轴的

在 `buildSeriesMatrix()` 里，会先取出完整的横轴数据：

```ts
const xAxisData = normalizeAxisData(rows, xField);
```

然后对每个 `legendName` 逐个生成 `data`：

1. 遍历所有横轴值
2. 在原始数据里找满足以下条件的第一条记录：
   - `row[xField] === xValue`
   - `getSeriesKey(row) === legendName`
3. 取该行的 `metricField` 作为数值
4. 如果没找到，则填 `null`

所以每条系列最终都会得到一个和 `xAxisData` 等长的数组。

## 7. 单系列和多系列的分支

笛卡尔图在 `buildCartesianOption()` 里有两个分支。

### 7.1 没有系列字段时

如果 `seriesFields.length === 0`：

- 不显示 legend
- 只生成一条 series
- series 名默认是 `metricField`

适合这种数据：

```ts
[
  { 月份: "2026-01", 销售额: 120 },
  { 月份: "2026-02", 销售额: 135 },
]
```

### 7.2 有系列字段时

如果存在 `seriesFields`：

- 调用 `buildSeriesMatrix()`
- 生成 `legendData`
- 为每个 legend 项生成一条 series

适合这种数据：

```ts
[
  { 月份: "2026-01", 区域: "华东", 销售额: 120 },
  { 月份: "2026-01", 区域: "华南", 销售额: 98 },
  { 月份: "2026-02", 区域: "华东", 销售额: 135 },
]
```

或者复合系列：

```ts
[
  { 月份: "2026-01", 区域: "华东", 产品: "A", 销售额: 120 },
  { 月份: "2026-01", 区域: "华东", 产品: "B", 销售额: 76 },
]
```

## 8. options 参数覆盖规则

外部传入的 `BuildChartOptions` 会优先覆盖自动推断结果。

常见优先级如下：

- `xField`
  - `options.xField`
  - 否则 `shape.xField`
- `seriesFields`
  - 优先 `options.seriesFields`
  - 否则 `shape.seriesFields`
- `metricField`
  - 优先 `options.metricField`
  - 否则自动选择最优指标字段

这意味着如果自动推断不符合预期，最稳妥的做法通常不是直接改推断逻辑，而是先在调用处显式传入：

```ts
buildEChartsOption(rows, {
  xField: "月份",
  seriesFields: ["区域", "产品"],
  metricField: "销售额",
})
```

## 9. 饼图逻辑

饼图走 `buildPieOption()`。

核心规则：

- `categoryField`
  - 优先 `options.categoryField`
  - 否则 `shape.categoryFields` 的第一个
  - 再不行用 `shape.xField`
- `metricField`
  - 走指标字段推断

另外支持：

- `latestByField`
- `latestByValue`

用途是从多期数据中只取最新一期，例如：

```ts
buildEChartsOption(rows, {
  chartType: "pie",
  latestByField: "月份",
})
```

如果不传 `latestByValue`，内部会取该字段排序后的最后一个值。

## 10. 批量按指标生成图表

函数：

```ts
buildChartOptionsByMetrics(rows, options)
```

作用：

- 遍历 `shape.metricCandidates`
- 每个指标字段都调用一次 `buildEChartsOption()`
- 返回一个对象，key 是指标字段名，value 是对应 option

适合做“同一份数据，切换不同指标”的页面能力。

## 11. 布局自适应逻辑

`buildCartesianLayout()` 会根据横轴点数、系列数量、标签长度动态调整：

- `grid.top`
- `grid.bottom`
- `legend`
- `xAxis.axisLabel.rotate`
- `dataZoom`
- `yAxis.nameGap`

主要策略：

- 标签太长或点位太多时，横轴标签旋转
- 系列太多时，图例顶部空间增加
- 横轴或系列过多时，自动加 `dataZoom`
- legend 使用 `scroll` 模式，避免系列太多撑爆布局

如果你后续想优化图表可读性，通常改这一块就够了，不需要动字段推断逻辑。

## 12. 当前实现的限制

这部分是后续修改时最容易踩坑的地方。

### 12.1 自动复合系列默认只取前两个字段

当前：

```ts
const seriesFields = seriesCandidates.slice(0, 2);
```

影响：

- 自动推断最多只能识别两层复合系列
- 如果需要三层及以上，必须改这里，或者手动传 `options.seriesFields`

### 12.2 同一个横轴和系列组合只取第一条记录

当前逻辑使用的是：

```ts
rows.find(...)
```

影响：

- 如果同一个 `xField + seriesKey` 有多条记录，不会自动聚合
- 实际展示的是找到的第一条值

如果业务需要求和、平均、最大值等，需要把这里改成聚合逻辑。

### 12.3 横轴排序是按文本排序

当前 `normalizeAxisData()` 使用字符串排序。

影响：

- 对于某些日期、数值型字符串，排序可能不完全符合业务期望
- 例如 `"2"` 和 `"10"` 的顺序可能会受字符串比较方式影响

如果后面出现排序问题，可以单独改 `sortByText()` 或为时间字段做专门排序。

### 12.4 数值字段识别比较宽松

像 `"001"`、`"02"` 这种字符串会被识别为数字。

如果某些字段本质上是编码，不应该进指标候选，就需要增加排除规则。

### 12.5 复合系列名的分隔符固定

当前复合 key 用的是：

```ts
" / "
```

如果后续需要：

- 改成其他展示格式
- 国际化
- 给 tooltip 单独拆回多个层级

可以从 `getSeriesKey()` 下手。

## 13. 常见修改场景和建议改法

### 13.1 想让自动识别支持 3 个以上复合字段

改这里：

```ts
const seriesFields = seriesCandidates.slice(0, 2);
```

可以改成：

```ts
const seriesFields = seriesCandidates.slice(0, 3);
```

或者直接不限制：

```ts
const seriesFields = seriesCandidates;
```

更稳妥的方式是：

- 默认逻辑不动
- 在调用时手工传 `options.seriesFields`

### 13.2 想对重复数据做求和而不是取第一条

现在是：

```ts
const hit = rows.find(...)
return hit ? toNumber(...) : null;
```

可以改成：

- 先 `filter(...)` 找出所有匹配记录
- 再做 `sum` / `avg` / `max`

这是最常见的业务增强点。

### 13.3 想固定某些字段一定是横轴或系列

优先建议在调用处传参，例如：

```ts
buildEChartsOption(rows, {
  xField: "月份",
  seriesFields: ["区域"],
  metricField: "销售额",
})
```

只有当多个页面都需要同一套默认规则时，再去改 `inferDataShape()`。

### 13.4 想调整图例过多时的表现

优先改：

- `buildCartesianLayout()`

可以从这些方向下手：

- 增减 `top`
- 修改 `legend.type`
- 调整 `dataZoom` 出现阈值
- 调整标签旋转角度

## 14. 推荐的维护思路

后续修改时建议按下面顺序判断：

1. 是推断错了，还是调用处没显式传参
2. 是字段识别问题，还是系列拼接问题
3. 是数据聚合问题，还是纯展示布局问题

简单判断标准：

- 图表字段选错了：看 `inferDataShape()`
- 多个系列没按预期拆开：看 `seriesFields` 和 `getSeriesKey()`
- 同一系列数据不完整或值不对：看 `buildSeriesMatrix()`
- 图挤在一起不好看：看 `buildCartesianLayout()`
- 饼图只想看最新一期：看 `buildPieOption()`

## 15. 一句话总结

这个文件的核心设计可以概括成一句话：

先自动推断“横轴 / 系列 / 指标”字段，再把多个系列字段拼成联合 key，最后按图表类型组装成 ECharts option。

如果后面你要改功能，通常只需要定位到下面四块中的一块：

- `inferDataShape()`：字段推断
- `buildSeriesMatrix()`：多系列和复合系列构造
- `buildCartesianLayout()`：布局策略
- `buildPieOption()`：饼图切片逻辑
