export const OFFICIAL_EVENTS = [
  { id: '333', name: '三阶速拧', category: 'official', iconId: '333' },
  { id: '222', name: '二阶速拧', category: 'official', iconId: '222' },
  { id: '333oh', name: '三阶单手', category: 'official', iconId: '333oh' },
  { id: '444', name: '四阶速拧', category: 'official', iconId: '444' },
  { id: '555', name: '五阶速拧', category: 'official', iconId: '555' },
  { id: '666', name: '六阶速拧', category: 'official', iconId: '666' },
  { id: '777', name: '七阶速拧', category: 'official', iconId: '777' },
  { id: 'meg', name: '五魔方', category: 'official', iconId: 'minx' },
  { id: '333bf', name: '三阶盲拧', category: 'official', iconId: '333bf' },
  { id: '444bf', name: '四阶盲拧', category: 'official', iconId: '444bf' },
  { id: '555bf', name: '五阶盲拧', category: 'official', iconId: '555bf' },
  { id: '333fm', name: '最少步', category: 'official', iconId: '333fm' },
  { id: 'py', name: '金字塔', category: 'official', iconId: 'pyram' },
  { id: 'sk', name: '斜转', category: 'official', iconId: 'skewb' },
  { id: 'sq1', name: 'SQ1', category: 'official', iconId: 'sq1' },
  { id: 'clock', name: '魔表', category: 'official', iconId: 'clock' },
  { id: '333mbf', name: '多盲', category: 'official', iconId: '333mbf' },
  { id: 'fto', name: 'FTO', category: 'official', iconId: 'fto' }
]

export const FUN_EVENTS = [
  { id: '二阶镜面', name: '二阶镜面', category: 'fun' },
  { id: '三阶镜面', name: '三阶镜面', category: 'fun' },
  { id: '四阶镜面', name: '四阶镜面', category: 'fun' },
  { id: '五阶镜面', name: '五阶镜面', category: 'fun' },
  { id: '二阶FTO', name: '二阶FTO', category: 'fun' },
  { id: '齿轮', name: '齿轮', category: 'fun' },
  { id: '四阶华容道', name: '四阶华容道', category: 'fun' },
  { id: '正阶连拧(2-7)', name: '正阶连拧(2-7)', category: 'fun' },
  { id: '异形连拧(5个)', name: '异形连拧(5个)', category: 'fun' },
  { id: '全项目连拧(12个)', name: '全项目连拧(12个)', category: 'fun' },
  { id: '枫叶', name: '枫叶', category: 'fun' },
  { id: 'CTO', name: 'CTO', category: 'fun' },
  { id: 'REDI', name: 'REDI', category: 'fun' },
  { id: '二重奏', name: '二重奏', category: 'fun' },
  { id: '八阶速拧', name: '八阶速拧', category: 'fun' },
  { id: '九阶速拧', name: '九阶速拧', category: 'fun' },
  { id: '十阶速拧', name: '十阶速拧', category: 'fun' },
  { id: '十一阶速拧', name: '十一阶速拧', category: 'fun' }
]

export const categories = [
  { label: '官方项目', value: 'official' },
  { label: '趣味项目', value: 'fun' },
  { label: '整活项目', value: 'meme' }
]

export const eventGroups = {
  official: {
    label: '官方项目',
    options: OFFICIAL_EVENTS.map(({ id, name }) => ({ label: name, value: id }))
  },
  fun: {
    label: '趣味项目',
    options: FUN_EVENTS.map(({ id, name }) => ({ label: name, value: id }))
  },
  meme: {
    label: '整活项目',
    options: []
  }
}

export const STATIC_EVENTS = [...OFFICIAL_EVENTS, ...FUN_EVENTS]
export const staticEventNameMap = Object.fromEntries(STATIC_EVENTS.map(event => [event.id, event.name]))

export const getStaticEventName = (eventId) => staticEventNameMap[eventId] || eventId

export const getStaticEventIconId = (eventId) => {
  const event = STATIC_EVENTS.find(item => item.id === eventId)
  return event?.iconId || eventId
}

export const getStaticEventsByCategory = (category) => {
  if (!category || category === 'all') return STATIC_EVENTS
  return STATIC_EVENTS.filter(event => event.category === category)
}

export const getStaticGroupedEvents = ({ includeAll = false } = {}) => {
  return Object.entries(eventGroups).map(([key, group]) => ({
    label: group.label,
    value: key,
    options: includeAll
      ? [{ label: '全部', value: `${key}_all` }, ...group.options]
      : group.options
  }))
}
