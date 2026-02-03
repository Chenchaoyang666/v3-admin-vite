import { ref, onBeforeUnmount } from 'vue'

export function useSpeech() {
  const synth = window.speechSynthesis

  const voices = ref<SpeechSynthesisVoice[]>([])
  const speaking = ref(false)
  const paused = ref(false)
  const currentSegment = ref(0) // 当前播放段落编号

  /** 所有分段文本 */
  let segments: string[] = []
  let utter: SpeechSynthesisUtterance | null = null

  const SEGMENT_SIZE = 150; // ⚠️ 每段长度控制（150 ~ 200 Android最稳定）

  /** 1. 加载可用语音 */
  const loadVoices = () => {
    voices.value = synth.getVoices()
  }
  loadVoices()
  synth.onvoiceschanged = loadVoices

  /** [关键] 长文本分段逻辑 */
  const splitText = (text: string) => {
    const list: string[] = []
    let chunk = ''

    for (let i = 0; i < text.length; i++) {
      chunk += text[i]

      if (chunk.length >= SEGMENT_SIZE) {
        list.push(chunk)
        chunk = ''
      }
    }
    if (chunk) list.push(chunk)

    return list
  }

  /** 播放某一段 */
  const playSegment = (index: number, options: any) => {
    if (index >= segments.length) {
      speaking.value = false
      paused.value = false
      return
    }

    currentSegment.value = index

    utter = new SpeechSynthesisUtterance()
    utter.text = segments[index]
    utter.rate = options?.rate ?? 1
    utter.pitch = options?.pitch ?? 1
    utter.volume = options?.volume ?? 1
    utter.lang = options?.lang ?? 'zh-CN'
    if (options?.voice) utter.voice = options.voice

    utter.onend = () => {
      // 下一段
      playSegment(index + 1, options)
    }

    // utter.onerror = () => {
    //   console.error('语音合成错误，跳过当前段落')
    //   playSegment(index + 1, options)
    // }

    synth.speak(utter)
  }

  /** 主播放入口（自动分段） */
  const speak = (text: string, options?: {
    rate?: number
    pitch?: number
    volume?: number
    lang?: string
    voice?: SpeechSynthesisVoice
  }) => {
    if (!text) return

    stop() // 先停止上次播放

    segments = splitText(text)
    speaking.value = true
    paused.value = false

    playSegment(0, options)
  }

  /** 暂停 */
  const pause = () => {
    if (synth.speaking) {
      synth.pause()
      paused.value = true
    }
  }

  /** 恢复 */
  const resume = () => {
    if (paused.value) {
      synth.resume()
      paused.value = false
    }
  }

  /** 停止 */
  const stop = () => {
    synth.cancel()
    speaking.value = false
    paused.value = false
    currentSegment.value = 0
  }

  onBeforeUnmount(stop)

  return {
    voices,
    speaking,
    paused,
    currentSegment,
    speak,
    pause,
    resume,
    stop
  }
}
