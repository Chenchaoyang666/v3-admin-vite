import { ref, onUnmounted } from 'vue'

/** 全局单例 Audio */
let audio: HTMLAudioElement | null = null

/** 全局 Hook 的状态（多组件共享） */
const queue = ref<{ id: string; url: string }[]>([])
const currentIndex = ref(0)
const isPlaying = ref(false)
const playbackRate = ref(1)

export function useTTSPlayer() {

  const initAudio = () => {
    if (!audio) {
      audio = new Audio()
      audio.playbackRate = playbackRate.value

      audio.addEventListener('ended', () => {
        currentIndex.value++
        if (currentIndex.value >= queue.value.length) {
          isPlaying.value = false
          return
        }
        playCurrent()
      })
    }
  }

  const playCurrent = () => {
    if (!audio) return
    const item = queue.value[currentIndex.value]
    if (!item) return

    audio.src = item.url
    audio.playbackRate = playbackRate.value
    audio.play().catch(() => {})
    isPlaying.value = true
  }

  /** 主动播放（覆盖旧队列） */
  const play = (list: { id: string; url: string }[]) => {
    initAudio()
    queue.value = list
    currentIndex.value = 0
    playCurrent()
  }

  const pause = () => {
    audio?.pause()
    isPlaying.value = false
  }

  const resume = () => {
    audio?.play()
    isPlaying.value = true
  }

  const stop = () => {
    audio?.pause()
    currentIndex.value = 0
    isPlaying.value = false
  }

  const setRate = (rate: number) => {
    playbackRate.value = rate
    if (audio) audio.playbackRate = rate
  }

  onUnmounted(() => {
    // 不销毁 audio，因为要全局共享
  })

  return {
    play,
    pause,
    resume,
    stop,
    setRate,

    // 状态
    isPlaying,
    playbackRate,
    currentIndex,
    queue
  }
}
// 长文本自动分段（避免安卓崩溃）
const splitText = (text: string, maxLen = 120) => {
  const arr = []
  for (let i = 0; i < text.length; i += maxLen) {
    arr.push(text.slice(i, i + maxLen))
  }
  return arr
}
// 调用后台生成音频（TTS）
const longText = `这是一个很长的文本，用于测试文本到语音转换功能。我们需要确保这个文本足够长，以便能够被正确地分割成多个段落进行处理。每个段落的长度应该适中，既不能太短，也不能太长，这样才能保证语音合成的质量和连贯性。通过这种方式，我们可以有效地管理和播放长文本内容，提升用户的听觉体验。希望这个示例能够帮助大家理解如何实现文本到语音的转换，并且在实际应用中加以利用。感谢您的聆听！`
const segments = splitText(longText)
const audioList = await Promise.all(
  segments.map(async (t, i) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: t })
    })
    const { url } = await res.json()

    return { id: String(i), url }
  })
)
// 播放
const tts = useTTSPlayer()

tts.play(audioList)
// 调节速率
tts.setRate(1.3)



