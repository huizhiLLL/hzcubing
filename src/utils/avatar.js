export function getInitial(value = '') {
  const text = String(value).trim()
  if (!text) return 'U'
  return text[0].toUpperCase()
}

export function getAvatarGradient(seed = '') {
  const palettes = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ]

  const source = String(seed || '')
  const index = Array.from(source).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palettes.length
  return palettes[index]
}
