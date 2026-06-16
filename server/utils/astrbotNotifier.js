import fetch from 'node-fetch'

const DEFAULT_TIMEOUT_MS = 5000

function getAstrBotConfig() {
  return {
    url: process.env.ASTRBOT_MESSAGE_URL || 'https://astrbot.huizhi.pro/api/v1/im/message',
    apiKey: process.env.ASTRBOT_API_KEY,
    umo: process.env.ASTRBOT_MESSAGE_UMO,
    timeoutMs: Number(process.env.ASTRBOT_MESSAGE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  }
}

export function isAstrBotNotifierConfigured() {
  const { apiKey, umo } = getAstrBotConfig()
  return Boolean(apiKey && umo)
}

export async function sendAstrBotMessage(message) {
  const { url, apiKey, umo, timeoutMs } = getAstrBotConfig()

  if (!apiKey || !umo || !message) {
    return { skipped: true }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ umo, message }),
      signal: controller.signal
    })

    const responseText = await response.text()
    let data = null
    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = responseText
    }

    if (!response.ok || data?.status === 'error') {
      throw new Error(`AstrBot message failed: ${response.status} ${responseText}`)
    }

    return { skipped: false, data }
  } finally {
    clearTimeout(timeout)
  }
}

export async function sendAstrBotMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  if (!isAstrBotNotifierConfigured()) {
    return messages.map(() => ({ skipped: true }))
  }

  return Promise.all(messages.map(message => sendAstrBotMessage(message)))
}
