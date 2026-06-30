import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export function loadRootEnv(cwd = process.cwd()) {
  const rootEnvPath = path.resolve(cwd, "../../.env")
  if (!existsSync(rootEnvPath)) {
    return
  }

  const file = readFileSync(rootEnvPath, "utf8")
  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key || process.env[key] !== undefined) {
      continue
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "")
  }
}
