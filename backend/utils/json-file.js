import { existsSync, readFileSync, writeFileSync } from "node:fs"

export function readJsonFile(filePath, fallbackValue) {
  try {
    if (!existsSync(filePath)) return fallbackValue
    const data = readFileSync(filePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error(`读取 ${filePath} 失败:`, error)
    return fallbackValue
  }
}

export function writeJsonFile(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error(`写入 ${filePath} 失败:`, error)
    return false
  }
}
