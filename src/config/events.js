// 事件配置 - 使用 cubing.net 图标 CSS 类
export const events = [
  { id: '3x3', name: '三阶', iconId: '333' },
  { id: '4x4', name: '四阶', iconId: '444' },
  { id: '5x5', name: '五阶', iconId: '555' },
  { id: '2x2', name: '二阶', iconId: '222' },
  { id: '3x3OH', name: '单手', iconId: '333oh' },
  { id: '3x3BLD', name: '盲拧', iconId: '333bf' },
  { id: '3x3FM', name: '最少步', iconId: '333fm' },
  { id: '3x3SB', name: '脚拧', iconId: '333ft' },
  { id: 'Pyraminx', name: '金字塔', iconId: 'pyram' },
  { id: 'Megaminx', name: '五魔方', iconId: 'minx' },
  { id: 'Skewb', name: '斜转', iconId: 'skewb' },
  { id: 'Clock', name: '魔表', iconId: 'clock' },
  { id: 'Sq1', name: 'SQ1', iconId: 'sq1' }
]

export const getEventIconId = (eventId) => {
  const event = events.find(e => e.id === eventId)
  return event ? event.iconId : eventId
}

export const getEventName = (eventId) => {
  const event = events.find(e => e.id === eventId)
  return event ? event.name : eventId
}