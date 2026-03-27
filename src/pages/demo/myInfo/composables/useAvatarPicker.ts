import type { ResumeData } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { saveResumeApi } from "../api"

export const AVATAR_OPTIONS = [
  "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a549440a0362a5e1png.png",
  "https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25944571jpeg.jpeg",
  "https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg"
]

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/webp", 0.85))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useAvatarPicker() {
  const avatarDialogVisible = ref(false)
  const selectedAvatar = ref("")
  const uploadPreview = ref("")

  function openAvatarPicker(currentAvatar: string) {
    selectedAvatar.value = currentAvatar
    uploadPreview.value = ""
    avatarDialogVisible.value = true
  }

  function selectAvatar(avatar: string) {
    selectedAvatar.value = avatar
    uploadPreview.value = ""
  }

  async function handleAvatarUpload(uploadFile: { raw?: File }) {
    const file = uploadFile.raw
    if (!file) return
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"]
    if (!ALLOWED.includes(file.type)) {
      ElMessage.error("仅支持 JPG / PNG / WebP 格式")
      return
    }
    const base64 = await compressImage(file)
    uploadPreview.value = base64
    selectedAvatar.value = base64
  }

  async function confirmAvatar(formData: ResumeData, onSuccess: (avatar: string) => void) {
    const avatar = selectedAvatar.value
    avatarDialogVisible.value = false
    try {
      await saveResumeApi({ ...formData, avatar })
      onSuccess(avatar)
      ElMessage.success("头像更换成功")
    } catch (error) {
      console.error("头像保存失败:", error)
      ElMessage.error("头像保存失败")
    }
  }

  return {
    avatarDialogVisible,
    selectedAvatar,
    uploadPreview,
    openAvatarPicker,
    selectAvatar,
    handleAvatarUpload,
    confirmAvatar
  }
}
