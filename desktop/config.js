// Token/config storage: `<userData>/config.json`.
//   { "tokenEnc": "<base64 safeStorage blob>" }        when OS encryption is available
//   { "token": "<plaintext>", "plaintext": true }      otherwise (surfaced as a warning in the UI)
// The Anthropic key for Ask AI (desktop/ai.js) is kept the same way, under
// `aiKeyEnc`, or `aiKey` plus `aiKeyPlaintext`.
import fs from 'node:fs'
import path from 'node:path'
import { safeStorage } from 'electron'

export const TOKEN_RE = /^[A-Za-z0-9_]{20,255}$/
export const TOKEN_RULE = 'Token must be 20–255 letters, digits or underscores (a ghp_… or github_pat_… token).'
export const AI_KEY_RE = /^sk-ant-[A-Za-z0-9_-]{20,250}$/
export const AI_KEY_RULE = 'That does not look like an Anthropic API key. They start with sk-ant- and come from console.anthropic.com.'

/**
 * @param {string} file absolute path of config.json
 * @param {(...args: unknown[]) => void} log
 */
export function createConfig(file, log = () => {}) {
  function read() {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
    } catch (err) {
      if (err.code !== 'ENOENT') log('config: unreadable, starting empty:', err.message)
      return {}
    }
  }

  function write(data) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    // Write-then-rename so a crash mid-write never leaves a truncated config.
    const tmp = `${file}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
    fs.renameSync(tmp, file)
  }

  function encryptionAvailable() {
    try {
      return safeStorage.isEncryptionAvailable()
    } catch {
      return false
    }
  }

  return {
    /** @returns {Promise<string | null>} */
    async getToken() {
      const data = read()
      if (typeof data.tokenEnc === 'string') {
        if (!encryptionAvailable()) {
          log('config: stored token is encrypted but OS encryption is unavailable')
          return null
        }
        try {
          const token = safeStorage.decryptString(Buffer.from(data.tokenEnc, 'base64'))
          return TOKEN_RE.test(token) ? token : null
        } catch (err) {
          log('config: could not decrypt token:', err.message)
          return null
        }
      }
      if (typeof data.token === 'string' && TOKEN_RE.test(data.token)) return data.token
      return null
    },

    /** @param {string | null} token */
    async setToken(token) {
      if (token !== null && !(typeof token === 'string' && TOKEN_RE.test(token))) {
        throw new TypeError(TOKEN_RULE)
      }
      const data = read()
      delete data.tokenEnc
      delete data.token
      delete data.plaintext
      if (token !== null) {
        if (encryptionAvailable()) {
          data.tokenEnc = safeStorage.encryptString(token).toString('base64')
        } else {
          data.token = token
          data.plaintext = true
        }
      }
      write(data)
    },

    hasToken() {
      const data = read()
      return typeof data.tokenEnc === 'string' || typeof data.token === 'string'
    },

    /** True when the token had to be stored unencrypted. */
    isPlaintext() {
      const data = read()
      return data.plaintext === true && typeof data.token === 'string'
    },

    /** @returns {Promise<string | null>} */
    async getAiKey() {
      const data = read()
      if (typeof data.aiKeyEnc === 'string') {
        if (!encryptionAvailable()) return null
        try {
          const key = safeStorage.decryptString(Buffer.from(data.aiKeyEnc, 'base64'))
          return AI_KEY_RE.test(key) ? key : null
        } catch (err) {
          log('config: could not decrypt the AI key:', err.message)
          return null
        }
      }
      if (typeof data.aiKey === 'string' && AI_KEY_RE.test(data.aiKey)) return data.aiKey
      return null
    },

    /** @param {string | null} key */
    async setAiKey(key) {
      if (key !== null && !(typeof key === 'string' && AI_KEY_RE.test(key))) throw new TypeError(AI_KEY_RULE)
      const data = read()
      delete data.aiKeyEnc
      delete data.aiKey
      delete data.aiKeyPlaintext
      if (key !== null) {
        if (encryptionAvailable()) {
          data.aiKeyEnc = safeStorage.encryptString(key).toString('base64')
        } else {
          data.aiKey = key
          data.aiKeyPlaintext = true
        }
      }
      write(data)
    },

    hasAiKey() {
      const data = read()
      return typeof data.aiKeyEnc === 'string' || typeof data.aiKey === 'string'
    },

    aiKeyPlaintext() {
      const data = read()
      return data.aiKeyPlaintext === true && typeof data.aiKey === 'string'
    },
  }
}
