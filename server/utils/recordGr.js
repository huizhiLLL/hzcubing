import Record from '../models/Record.js'

export function formatRecordTime(seconds) {
  if (seconds === null || seconds === undefined) return null

  const numeric = Number(seconds)
  if (!Number.isFinite(numeric)) return null

  const normalized = Math.trunc(numeric * 100) / 100
  const totalCentiseconds = Math.trunc(normalized * 100)
  const h = Math.floor(totalCentiseconds / 360000)
  const m = Math.floor((totalCentiseconds % 360000) / 6000)
  const wholeSeconds = Math.floor((totalCentiseconds % 6000) / 100)
  const centiseconds = totalCentiseconds % 100
  const secondText = `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`.padStart(5, '0')

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${secondText}`
  }

  if (m > 0) {
    return `${m}:${secondText}`
  }

  return `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`
}

export async function findPreviousGrRecords({ event, singleSeconds, averageSeconds }) {
  const normalizedSingleSeconds = singleSeconds !== null && singleSeconds !== undefined ? Number(singleSeconds) : null
  const normalizedAverageSeconds = averageSeconds !== null && averageSeconds !== undefined ? Number(averageSeconds) : null

  const [previousSingleBestRecord, previousAverageBestRecord] = await Promise.all([
    normalizedSingleSeconds !== null && Number.isFinite(normalizedSingleSeconds)
      ? Record.findOne({ event, singleSeconds: { $ne: null } })
        .sort({ singleSeconds: 1, timestamp: 1, _id: 1 })
        .lean()
      : null,
    normalizedAverageSeconds !== null && Number.isFinite(normalizedAverageSeconds)
      ? Record.findOne({ event, averageSeconds: { $ne: null } })
        .sort({ averageSeconds: 1, timestamp: 1, _id: 1 })
        .lean()
      : null
  ])

  return {
    previousSingleBestRecord,
    previousAverageBestRecord
  }
}

export function buildGrResult(record, previousRecords) {
  const { previousSingleBestRecord, previousAverageBestRecord } = previousRecords

  const isSingleGR = record.singleSeconds !== null && record.singleSeconds !== undefined && (
    !previousSingleBestRecord || record.singleSeconds < previousSingleBestRecord.singleSeconds
  )

  const isAverageGR = record.averageSeconds !== null && record.averageSeconds !== undefined && (
    !previousAverageBestRecord || record.averageSeconds < previousAverageBestRecord.averageSeconds
  )

  return {
    isSingleGR,
    isAverageGR,
    previousSingleBest: previousSingleBestRecord ? {
      userId: previousSingleBestRecord.userId,
      nickname: previousSingleBestRecord.nickname,
      seconds: previousSingleBestRecord.singleSeconds,
      timestamp: previousSingleBestRecord.timestamp
    } : null,
    previousAverageBest: previousAverageBestRecord ? {
      userId: previousAverageBestRecord.userId,
      nickname: previousAverageBestRecord.nickname,
      seconds: previousAverageBestRecord.averageSeconds,
      timestamp: previousAverageBestRecord.timestamp
    } : null
  }
}

export function buildGrNewsMessages({ nickname, event, grResult }) {
  const messages = []
  const displayName = nickname || '未知用户'
  const eventName = event || '未知项目'

  if (grResult.isSingleGR) {
    if (grResult.previousSingleBest) {
      const prevNickname = grResult.previousSingleBest.nickname || '未知用户'
      const prevTimeText = formatRecordTime(grResult.previousSingleBest.seconds) || '-'
      messages.push(
        `记录快讯！🎉恭喜 ${displayName} 刷新${eventName} 单次 GR！\n` +
        `原纪录：${prevNickname} ${prevTimeText}`
      )
    } else {
      messages.push(`记录快讯！🎉恭喜 ${displayName} 拿下${eventName} 首个单次 GR！`)
    }
  }

  if (grResult.isAverageGR) {
    if (grResult.previousAverageBest) {
      const prevNickname = grResult.previousAverageBest.nickname || '未知用户'
      const prevTimeText = formatRecordTime(grResult.previousAverageBest.seconds) || '-'
      messages.push(
        `记录快讯！🎉恭喜 ${displayName} 刷新${eventName} 平均 GR！\n` +
        `原纪录：${prevNickname} ${prevTimeText}`
      )
    } else {
      messages.push(`记录快讯！🎉恭喜 ${displayName} 拿下${eventName} 首个平均 GR！`)
    }
  }

  return messages
}
