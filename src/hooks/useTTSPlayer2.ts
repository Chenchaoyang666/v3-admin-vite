import { ref } from 'vue'

/* ------------------ 全局单例播放器 ------------------ */

let audio: HTMLAudioElement | null = null
let playToken = 0
let activeController: AbortController | null = null

const isPlaying = ref(false)
const playbackRate = ref(1)

/* ------------------ 工具函数 ------------------ */

// 长文本分段（安卓安全）
const splitText = (text: string, maxLen = 120) => {
  const res: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    res.push(text.slice(i, i + maxLen))
  }
  return res
}

// 自动识别音频 MIME
const detectMime = (format?: string) => {
  switch (format) {
    case 'wav':
      return 'audio/wav'
    case 'pcm':
      return 'audio/pcm'
    case 'mp3':
    default:
      return 'audio/mpeg'
  }
}

// Base64 → Blob
const base64ToBlob = (base64: string, mime: string) => {
  const cleaned = base64.includes(',')
    ? base64.split(',')[1]
    : base64

  const binary = atob(cleaned)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
}

/* ------------------ Hook 主体 ------------------ */

type TTSResponse = {
  base64: string
  format?: 'mp3' | 'wav' | 'pcm'
}

export function useSpeech() {
  const queue = ref<{ url: string }[]>([])
  const index = ref(0)

  const initAudio = () => {
    if (!audio) {
      audio = new Audio()
      audio.addEventListener('ended', playNext)
      audio.addEventListener('pause', () => {
        isPlaying.value = false
      })
      audio.addEventListener('play', () => {
        isPlaying.value = true
      })
    }
  }

  const playNext = () => {
    index.value++
    if (index.value >= queue.value.length) {
      cleanup()
      return
    }
    playCurrent()
  }

  const playCurrent = () => {
    if (!audio) return
    const item = queue.value[index.value]
    if (!item) return

    audio.src = item.url
    audio.playbackRate = playbackRate.value
    audio.play().catch(() => {
      isPlaying.value = false
    })
  }

  const cleanup = () => {
    queue.value.forEach(i => URL.revokeObjectURL(i.url))
    queue.value = []
    index.value = 0
    isPlaying.value = false
    if (audio) {
      audio.src = ''
      audio.load()
    }
  }

  /* ------------------ 核心方法：只传文字 ------------------ */

  const speak = async (
    text: string,
    options?: { rate?: number }
  ) => {
    if (!text) return

    stop()
    initAudio()

    playbackRate.value = options?.rate ?? 1

    const segments = splitText(text)

    // 调用后台生成 TTS（你只需实现这个接口）
    const audioItems: { url: string }[] = []
    const token = ++playToken
    const controller = new AbortController()
    activeController = controller

    try {
      for (const seg of segments) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: seg }),
          signal: controller.signal
        }).then(r => r.json() as Promise<TTSResponse>)

        if (token !== playToken) return

        /**
         * 后台返回格式示例：
         * {
         *   base64: 'xxxx',
         *   format: 'mp3' | 'wav' | 'pcm'
         * }
         */

        const mime = detectMime(res.format)
        const blob = base64ToBlob(res.base64, mime)
        const url = URL.createObjectURL(blob)

        audioItems.push({ url })
      }
    } catch {
      cleanup()
      return
    }

    queue.value = audioItems
    index.value = 0
    playCurrent()
  }

  const pause = () => {
    audio?.pause()
    isPlaying.value = false
  }

  const resume = () => {
    audio?.play().catch(() => {
      isPlaying.value = false
    })
  }

  const stop = () => {
    playToken++
    activeController?.abort()
    activeController = null
    audio?.pause()
    cleanup()
  }

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    playbackRate
  }
}
