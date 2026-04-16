# RichContentRenderer 解析说明

这份说明文档主要讲 [`parseRichContent`](./utils.ts) 的解析流程，方便后续理解和修改富文本渲染逻辑。

## 1. 这个函数要解决什么问题

`parseRichContent(content)` 的输入是一整段字符串，输出是一个 `segments` 数组。

每个 segment 会对应一种渲染方式：

- `markdown`：普通 markdown 或 legacy HTML 内容
- `echarts`：图表配置块
- `vxetable`：表格配置块
- `block-loading`：流式输出时，图表或表格代码块还没闭合，先显示“生成中”

最终模板会根据 `segment.type` 决定渲染哪个组件，见 [`index.vue`](./index.vue)。

## 2. 整体流程

`parseRichContent` 的主流程可以概括成 5 步：

1. 规范化输入内容
2. 按行扫描整段文本
3. 把普通文本先放进 `buffer`
4. 遇到 fenced code block（```）时，尝试识别特殊块
5. 扫描结束后，把剩余 `buffer` 输出成 markdown segment

对应代码位置在 [`utils.ts`](./utils.ts)：

```ts
export function parseRichContent(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").trim()
  if (!normalized) return [] as RichContentSegment[]

  const segments: RichContentSegment[] = []
  const lines = normalized.split("\n")
  const buffer: string[] = []
  let index = 0

  // ...

  while (index < lines.length) {
    // 逐行扫描
  }

  flushMarkdown()
  return segments
}
```

## 3. 三个核心变量

理解这个函数时，最重要的是这三个变量：

- `lines`：整段内容按换行拆开的结果
- `buffer`：暂存普通 markdown/HTML 文本
- `segments`：最终输出结果

它们的职责分别是：

- `lines` 负责“被扫描”
- `buffer` 负责“攒普通文本”
- `segments` 负责“攒最终结构化结果”

## 4. 普通文本是怎么处理的

如果当前行不是 fenced code block 的开头：

```ts
buffer.push(line)
index += 1
```

这说明当前内容先不急着输出，而是继续积累到 `buffer` 中。

等到这些时机之一出现时，才会调用 `flushMarkdown()`：

- 遇到了 `echarts` 代码块
- 遇到了 `vxetable` 代码块
- 整个扫描结束

`flushMarkdown()` 做的事很简单：

1. 把 `buffer` 里的内容用 `\n` 拼回字符串
2. 调用 `renderRichText(source)` 转成 HTML
3. 推入一个 `markdown` segment
4. 清空 `buffer`

核心代码：

```ts
const flushMarkdown = () => {
  if (!buffer.length) return
  const source = buffer.join("\n").trim()
  buffer.length = 0
  if (!source) return
  segments.push({
    type: "markdown",
    html: renderRichText(source)
  })
}
```

## 5. fenced code block 是怎么识别的

主循环里先看当前行是不是以 ```` ``` ```` 开头：

```ts
if (line.startsWith("```")) {
  const language = line.slice(3).trim().toLowerCase()
  index += 1
  const codeBuffer: string[] = []
  let closed = false
```

这一步会把当前行识别为 fenced block 的开始行，并提取语言名。

例如：

```text
```echarts
```

会得到：

```ts
language === "echarts"
```

然后函数会继续往后扫描，把中间内容收集到 `codeBuffer`：

```ts
while (index < lines.length && !lines[index].startsWith("```")) {
  codeBuffer.push(lines[index])
  index += 1
}
```

## 6. 结束的 ``` 在哪里判断

这段逻辑最容易让人误解，因为代码里没有单独写一个“如果等于结束 fence”。

实际上结束判断藏在这段 `while` 里：

```ts
while (index < lines.length && !lines[index].startsWith("```")) {
  codeBuffer.push(lines[index])
  index += 1
}
```

含义是：

- 只要下一行不是以 ```` ``` ```` 开头，就继续把它当作代码内容
- 一旦碰到下一行也以 ```` ``` ```` 开头，就停止收集

然后紧接着：

```ts
if (index < lines.length) {
  closed = true
  index += 1
}
```

说明：

- 如果不是扫到了文件末尾才停下
- 那就说明当前这行就是结束 fence
- 所以把 `closed = true`
- 再跳过这行结束符，继续主循环

也就是说，当前实现把“下一个以 ```` ``` ```` 开头的行”视为结束 fence。

## 7. `echarts` 代码块的解析流程

如果语言名是 `echarts`，就进入图表分支：

```ts
if (language === "echarts") {
  flushMarkdown()

  if (!closed) {
    segments.push({
      type: "block-loading",
      blockType: "echarts"
    })
    continue
  }

  const raw = codeBuffer.join("\n")
  const option = parseChartOption(raw)
  if (option) {
    segments.push({
      type: "echarts",
      option,
      raw
    })
    continue
  }

  pushMarkdownFence(language, codeBuffer, true)
  continue
}
```

它分成三种情况：

### 7.1 代码块还没闭合

比如流式内容只到了这里：

```text
```echarts
{
  "title": { "text": "demo" }
```

这时 `closed === false`，函数不会强行解析，而是返回：

```ts
{
  type: "block-loading",
  blockType: "echarts"
}
```

页面上会显示“图表生成中...”。

### 7.2 代码块已经闭合，且 JSON 合法

比如：

```text
```echarts
{
  "xAxis": { "type": "category", "data": ["Mon"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [12] }]
}
```

会先执行：

```ts
const raw = codeBuffer.join("\n")
const option = parseChartOption(raw)
```

而 `parseChartOption(raw)` 本质就是：

```ts
JSON.parse(raw)
```

如果解析成功，就生成：

```ts
{
  type: "echarts",
  option,
  raw
}
```

后续由 [`RichEChartsBlock.vue`](./RichEChartsBlock.vue) 负责渲染成图表。

### 7.3 代码块已经闭合，但 JSON 非法

如果模型生成了不合法 JSON，例如少逗号、少括号，`JSON.parse(raw)` 会失败。

此时不会报错，也不会丢内容，而是退回普通 markdown 代码块：

```ts
pushMarkdownFence(language, codeBuffer, true)
```

也就是把它按普通代码块显示出来，方便排查模型输出。

## 8. `vxetable` 代码块的解析流程

`vxetable` 和 `echarts` 的逻辑是同一套思路，只是解析器换成了 `parseVxeTableConfig(raw)`。

它会检查：

- `columns` 是否为数组
- `data` 是否为数组

如果通过校验，就输出：

```ts
{
  type: "vxetable",
  table,
  raw
}
```

否则同样退回 markdown 代码块显示。

另外它兼容两个语言名：

- `vxetable`
- `vxe-table`

## 9. 普通代码块为什么不会丢

如果代码块语言不是 `echarts` / `vxetable`，当前实现不会特殊处理，而是把整块内容重新塞回 `buffer`：

```ts
const fenceLines = [line, ...codeBuffer]
if (closed) {
  fenceLines.push("```")
}
buffer.push(...fenceLines)
continue
```

这意味着：

- 普通 `js`、`ts`、`json` 代码块
- 或者未识别语言的代码块

最后都会按 markdown 代码块正常显示。

## 10. `renderRichText()` 做了什么

`markdown` segment 最终会调用：

```ts
function renderRichText(source: string) {
  return sanitizeHtml(markdown.render(source))
}
```

它分成两步：

1. `markdown.render(source)`：把 markdown 转成 HTML
2. `sanitizeHtml(...)`：对输出 HTML 做安全清洗

当前 markdown 渲染器开启了：

- `html: true`
- `linkify: true`
- `breaks: true`

所以它既支持 markdown，也兼容旧 HTML 内容。

## 11. 为什么 legacy HTML 也能渲染

因为 `markdown-it` 开启了：

```ts
html: true
```

这意味着像下面这种旧内容：

```html
<h2>标题</h2>
<p>正文 <strong>加粗</strong></p>
```

不会被转义，而是会进入最终 HTML。

随后 `sanitizeHtml()` 会做一层过滤，移除：

- `script`
- 事件属性，比如 `onclick`
- 不安全的 `javascript:` 链接
- 不在允许列表里的标签或属性

## 12. 流式输出为什么能有“打字效果”

这里容易混淆。

`parseRichContent` 本身不负责打字效果，它只负责“拿到一份最新全文后重新解析”。

真正的“打字感”来自父层不断把 `pendingContent` 变长，然后重新传给组件。

例如：

```text
第一次：你好
第二次：你好，我
第三次：你好，我来
第四次：你好，我来帮你
```

每次 `content` 变化时，`parseRichContent` 都重新执行一次，页面看起来就像在逐字输出。

图表和表格的 loading 也是基于这个机制：

- 代码块还没闭合：返回 `block-loading`
- 代码块闭合且数据合法：返回 `echarts` 或 `vxetable`

## 13. 修改这个函数时最容易踩坑的点

### 13.1 结束 fence 的判断比较宽松

当前实现把“任意以 ```` ``` ```` 开头的行”都视为 fence。

这意味着它不会严格区分：

- 开始 fence：` ```echarts`
- 结束 fence：` ````

所以如果以后要支持更复杂语法，建议把 opening fence / closing fence 拆开写得更显式。

### 13.2 `echarts` 语言名是精确匹配

当前只支持：

```text
```echarts
```

不支持：

```text
```echart
```

如果后续模型容易输出 `echart`，可以在这里加别名兼容。

### 13.3 fence 头和内容写在同一行时，目前不兼容

比如：

```text
```echarts{"xAxis": ...}
```

当前实现会把整行 `"echarts{\"xAxis\": ...}"` 当作语言名，导致识别失败。

如果以后要兼容这类格式，需要在进入主解析前做预规范化，或者改写 fence 头解析逻辑。

### 13.4 每次输入变化都会全量重跑

这个实现非常适合当前聊天流式场景，逻辑清晰，容错也不错。

但它不是增量解析，而是“内容一变，整个 `parseRichContent` 重新跑一遍”。

如果未来单条消息特别大，或者特殊块很多，可以再考虑做增量优化。

## 14. 一句话总结

可以把 `parseRichContent` 理解成一个“按行扫描的分段器”：

- 普通内容先攒到 `buffer`
- 识别到特殊 fenced block 时先把前面的普通内容刷出来
- `echarts` / `vxetable` 成功就变成结构化 segment
- 没闭合就显示 loading
- 解析失败就退回普通 markdown 展示

这也是它在流式输出场景里表现稳定的核心原因。
