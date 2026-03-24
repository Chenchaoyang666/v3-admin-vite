declare module "markdown-it" {
  interface RendererRules {
    [key: string]: (...args: any[]) => string
  }

  interface Renderer {
    rules: RendererRules
  }

  interface MarkdownItOptions {
    html?: boolean
    linkify?: boolean
    breaks?: boolean
  }

  export default class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    renderer: Renderer
    use(plugin: (...args: any[]) => any, ...params: any[]): this
    render(src: string): string
  }
}

declare module "markdown-it-task-lists" {
  interface TaskListOptions {
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }

  const markdownItTaskLists: (md: any, options?: TaskListOptions) => void
  export default markdownItTaskLists
}
