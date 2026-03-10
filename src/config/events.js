const OFFICIAL_EVENTS = [
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

const FUN_EVENTS = [
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

const MEME_EVENTS = [
  { id: 'FTO单手', name: 'FTO单手', category: 'meme' },
  { id: '二阶单手', name: '二阶单手', category: 'meme' },
  { id: '四阶单手', name: '四阶单手', category: 'meme' },
  { id: '魔表单手', name: '魔表单手', category: 'meme' },
  { id: '3-5阶魔方连拧', name: '3-5阶魔方连拧', category: 'meme' },
  { id: '250ml牛奶', name: '250ml牛奶', category: 'meme' },
  { id: 'FTO BO5', name: 'FTO BO5', category: 'meme' },
  { id: '二阶盲拧', name: '二阶盲拧', category: 'meme' },
  { id: '默写群管真名（alpt除外）', name: '默写群管真名（alpt除外）', category: 'meme' },
  { id: '打出群管真名（alpt除外）', name: '打出群管真名（alpt除外）', category: 'meme' },
  { id: '二三阶连拧', name: '二三阶连拧', category: 'meme' },
  { id: '默写Jb perm', name: '默写Jb perm', category: 'meme' }
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
    options: MEME_EVENTS.map(({ id, name }) => ({ label: name, value: id }))
  }
}

export const events = [...OFFICIAL_EVENTS, ...FUN_EVENTS, ...MEME_EVENTS]

export const eventNameMap = Object.fromEntries(events.map(event => [event.id, event.name]))

export const getEventName = (eventId) => eventNameMap[eventId] || eventId

export const getEventIconId = (eventId) => {
  const event = events.find(item => item.id === eventId)
  return event?.iconId || eventId
}

export const getEventsByCategory = (category) => {
  if (!category || category === 'all') return events
  return events.filter(event => event.category === category)
}

export const getGroupedEvents = ({ includeAll = false } = {}) => {
  return Object.entries(eventGroups).map(([key, group]) => ({
    label: group.label,
    value: key,
    options: includeAll
      ? [{ label: '全部', value: `${key}_all` }, ...group.options]
      : group.options
  }))
}
