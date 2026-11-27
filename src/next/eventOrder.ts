import type { EventInfo } from './api'

const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
const digits: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

function normalizeName(name: string) {
  return name.normalize('NFKC').replace(/([一二三四五六七八九十]+)阶/g, (_, value: string) => {
    const parts = value.split('十')
    const number = parts.length === 1 ? digits[value] : (parts[0] ? digits[parts[0]] : 1) * 10 + (parts[1] ? digits[parts[1]] : 0)
    return number == null || Number.isNaN(number) ? `${value}阶` : `${number}阶`
  })
}

function sortKey(name: string) {
  const normalized = normalizeName(name).trim()
  const distance = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:m|米)(?:\s|$)/i)
  const meters = distance ? Number(distance[1]) : ({ '半马': 21097.5, '全马': 42195, '万米': 10000 } as Record<string, number>)[normalized]
  if (meters !== undefined) return { group: '跑步', value: meters, name: normalized }
  if (normalized.endsWith('单手')) return { group: '单手', value: 0, name: normalized.slice(0, -2) }
  const group = normalized.replace(/\d+(?:\.\d+)?/g, '#')
  return { group, value: 0, name: normalized }
}

export function orderEvents(events: EventInfo[]): EventInfo[] {
  const sorted = new Map(['meme', 'score'].map(category => [category, events.filter(event => event.category === category).sort((a, b) => {
    const left = sortKey(a.name), right = sortKey(b.name)
    return collator.compare(left.group, right.group) || left.value - right.value || collator.compare(left.name, right.name) || collator.compare(a.code, b.code)
  })]))
  const positions = new Map<string, number>()
  return events.map(event => {
    const group = sorted.get(event.category)
    if (!group) return event
    const index = positions.get(event.category) ?? 0
    positions.set(event.category, index + 1)
    return group[index]
  })
}
