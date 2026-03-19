import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { recordAPI } from '@/api'
import { useUserStore } from './user'
import { buildEventRankMaps, getLeaderboardRecordsForEvent } from '@/utils/recordRanking'

export const useRecordsStore = defineStore('records', () => {
  const userStore = useUserStore()
  const records = ref([])
  const bestRecords = ref({})
  const recentBreaks = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const loaded = ref(false)
  const lastFetchKey = ref('')
  let inflightRecordsPromise = null
  const uniqueUserCount = computed(() => {
    return new Set(records.value.map(record => String(record.userId))).size
  })
  const homeSummary = computed(() => ({
    totalRecords: records.value.length,
    totalUsers: uniqueUserCount.value
  }))

  function truncateToTwoDecimals(value) {
    if (value === null || value === undefined || isNaN(value)) return null
    return Math.trunc(Number(value) * 100) / 100
  }

  // Format time from seconds
  function formatTime(seconds) {
    const normalized = truncateToTwoDecimals(seconds)
    if (normalized === null) return null

    const totalCentiseconds = Math.trunc(normalized * 100)
    const h = Math.floor(totalCentiseconds / 360000)
    const m = Math.floor((totalCentiseconds % 360000) / 6000)
    const wholeSeconds = Math.floor((totalCentiseconds % 6000) / 100)
    const centiseconds = totalCentiseconds % 100
    const secondText = `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`.padStart(5, '0')

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${secondText}`
    } else if (m > 0) {
      return `${m}:${secondText}`
    } else {
      return `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`
    }
  }

  // Fetch all records
  async function fetchRecords(params = {}) {
    isLoading.value = true
    error.value = null
    const fetchKey = JSON.stringify(params || {})

    try {
      const result = await recordAPI.getAll(params)
      if (result.code === 200) {
        records.value = result.data || []
        loaded.value = true
        lastFetchKey.value = fetchKey
        return result
      } else {
        throw new Error(result.message || 'Failed to fetch records')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch records'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function ensureRecordsLoaded(params = {}, options = {}) {
    const force = options.force === true
    const fetchKey = JSON.stringify(params || {})

    if (!force && loaded.value && lastFetchKey.value === fetchKey && records.value.length > 0) {
      return records.value
    }

    if (!force && inflightRecordsPromise && lastFetchKey.value === fetchKey) {
      return inflightRecordsPromise
    }

    lastFetchKey.value = fetchKey
    inflightRecordsPromise = fetchRecords(params)
      .then((result) => result.data || records.value)
      .finally(() => {
        inflightRecordsPromise = null
      })

    return inflightRecordsPromise
  }

  // Fetch user records
  async function fetchUserRecords(userId, params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.getUserRecords(userId, params)
      if (result.code === 200) {
        return result.data || []
      } else {
        throw new Error(result.message || 'Failed to fetch user records')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch user records'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch user best records
  async function fetchUserBest(userId, params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.getUserBest(userId, params)
      if (result.code === 200) {
        return result.data || []
      } else {
        throw new Error(result.message || 'Failed to fetch user best')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch user best'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch user history
  async function fetchUserHistory(userId, params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.getUserHistory(userId, params)
      if (result.code === 200) {
        return result
      } else {
        throw new Error(result.message || 'Failed to fetch user history')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch user history'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch best records (leaderboard)
  async function fetchBestRecords(params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.getBest(params)
      if (result.code === 200) {
        bestRecords.value = result.data || []
        return result.data
      } else {
        throw new Error(result.message || 'Failed to fetch best records')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch best records'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch recent record breaks
  async function fetchRecentBreaks(params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.getRecentBreaks(params)
      if (result.code === 200) {
        recentBreaks.value = result.data || []
        return result.data
      } else {
        throw new Error(result.message || 'Failed to fetch recent breaks')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch recent breaks'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create record
  async function createRecord(recordData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.create(recordData)
      if (result.code === 200) {
        // Refresh records
        await fetchRecords()
        return result
      } else {
        throw new Error(result.message || 'Failed to create record')
      }
    } catch (err) {
      error.value = err.message || 'Failed to create record'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update record
  async function updateRecord(id, recordData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.update(id, recordData)
      if (result.code === 200) {
        // Refresh records
        await fetchRecords()
        return result
      } else {
        throw new Error(result.message || 'Failed to update record')
      }
    } catch (err) {
      error.value = err.message || 'Failed to update record'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete record
  async function deleteRecord(id) {
    isLoading.value = true
    error.value = null

    try {
      const result = await recordAPI.delete(id)
      if (result.code === 200) {
        // Remove from local list
        records.value = records.value.filter(r => r._id !== id)
        return result
      } else {
        throw new Error(result.message || 'Failed to delete record')
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete record'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get records by event
  function getRecordsByEvent(event) {
    return records.value.filter(r => r.event === event)
  }

  function getLeaderboardRecords(eventId, type = 'single', limit = 100) {
    return getLeaderboardRecordsForEvent(records.value, eventId, type, limit)
  }

  function getEventRankMaps(eventIds = []) {
    return buildEventRankMaps(records.value, eventIds)
  }

  // Get user's personal bests from loaded records
  function getUserPersonalBests(userId) {
    const userRecords = records.value.filter(r => r.userId === userId)
    
    return userRecords.reduce((best, record) => {
      const event = record.event
      if (!best[event]) {
        best[event] = {
          event,
          singleSeconds: record.singleSeconds,
          averageSeconds: record.averageSeconds
        }
      } else {
        if (record.singleSeconds !== null && 
            (best[event].singleSeconds === null || record.singleSeconds < best[event].singleSeconds)) {
          best[event].singleSeconds = record.singleSeconds
        }
        if (record.averageSeconds !== null && 
            (best[event].averageSeconds === null || record.averageSeconds < best[event].averageSeconds)) {
          best[event].averageSeconds = record.averageSeconds
        }
      }
      return best
    }, {})
  }

  return {
    records,
    bestRecords,
    recentBreaks,
    loaded,
    uniqueUserCount,
    homeSummary,
    isLoading,
    error,
    fetchRecords,
    ensureRecordsLoaded,
    fetchUserRecords,
    fetchUserBest,
    fetchUserHistory,
    fetchBestRecords,
    fetchRecentBreaks,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordsByEvent,
    getLeaderboardRecords,
    getEventRankMaps,
    getUserPersonalBests,
    formatTime
  }
})
