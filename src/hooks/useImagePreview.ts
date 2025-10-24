import { h, render } from 'vue'
import ImagePreview from '@/components/ImagePreview.vue'

export function showImagePreview(options: {
  srcList: string[],
  initialIndex?: number
}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const vnode = h(ImagePreview, {
    srcList: options.srcList,
    initialIndex: options.initialIndex ?? 0,
    onClose: () => {
      render(null, container)
      document.body.removeChild(container)
    }
  })
  render(vnode, container)
}