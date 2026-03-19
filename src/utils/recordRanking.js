function normalizeUserId(userId) {
  if (userId === null || userId === undefined || userId === '') return null
  return String(userId)
}

function getRecordUserId(record) {
  return normalizeUserId(record?.profileUserNo ?? record?.userId)
}

function getTimeField(type) {
  return type === 'average' ? 'averageSeconds' : 'singleSeconds'
}

export function getLeaderboardRecordsForEvent(records, eventId, type = 'single', limit = 100) {
  const timeField = getTimeField(type)
  const userBestMap = new Map()

  records
    .filter(record => record.event === eventId && record[timeField] !== null && record[timeField] !== undefined)
    .forEach((record) => {
      const userId = getRecordUserId(record)
      if (!userId) return
      const existing = userBestMap.get(userId)

      if (!existing || record[timeField] < existing[timeField]) {
        userBestMap.set(userId, record)
      }
    })

  return Array.from(userBestMap.values())
    .sort((a, b) => a[timeField] - b[timeField])
    .slice(0, limit)
}

export function buildEventRankMaps(records, eventIds = []) {
  const singleRanks = new Map()
  const averageRanks = new Map()
  const targetEventIds = eventIds.length > 0
    ? eventIds
    : Array.from(new Set(records.map(record => record.event)))

  targetEventIds.forEach((eventId) => {
    getLeaderboardRecordsForEvent(records, eventId, 'single', Number.POSITIVE_INFINITY)
      .forEach((record, index) => {
        const userId = getRecordUserId(record)
        if (!userId) return
        singleRanks.set(`${eventId}:${userId}`, index + 1)
      })

    getLeaderboardRecordsForEvent(records, eventId, 'average', Number.POSITIVE_INFINITY)
      .forEach((record, index) => {
        const userId = getRecordUserId(record)
        if (!userId) return
        averageRanks.set(`${eventId}:${userId}`, index + 1)
      })
  })

  return {
    singleRanks,
    averageRanks
  }
}

export function rankPersonalBests(personalBests, userId, eventIds, records) {
  const normalizedUserId = normalizeUserId(userId)
  const rankMaps = buildEventRankMaps(records, eventIds)

  return [...personalBests]
    .map((pb) => {
      const singleRank = rankMaps.singleRanks.get(`${pb.event}:${normalizedUserId}`) || null
      const averageRank = rankMaps.averageRanks.get(`${pb.event}:${normalizedUserId}`) || null
      const bestRank = [singleRank, averageRank].filter(Boolean).sort((a, b) => a - b)[0] || null

      return {
        ...pb,
        singleRank,
        averageRank,
        bestRank
      }
    })
    .sort((a, b) => {
      const rankA = a.bestRank ?? Number.POSITIVE_INFINITY
      const rankB = b.bestRank ?? Number.POSITIVE_INFINITY
      if (rankA !== rankB) return rankA - rankB

      const indexA = eventIds.indexOf(a.event)
      const indexB = eventIds.indexOf(b.event)
      if (indexA === -1 && indexB === -1) return a.event.localeCompare(b.event)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
}
