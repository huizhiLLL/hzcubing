import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { memeEventAPI } from '@/api'
import { useUserStore } from './user'
import {
  OFFICIAL_EVENTS,
  FUN_EVENTS,
  categories,
  eventGroups,
  getStaticEventName,
  getStaticEventIconId,
  getStaticEventsByCategory,
  getStaticGroupedEvents
} from '@/config/events'

export const useEventsStore = defineStore('events', () => {
  const userStore = useUserStore()
  const memeEvents = ref([])
  const myMemeEvents = ref([])
  const isLoading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  const dynamicMemeEvents = computed(() =>
    memeEvents.value.map(event => ({
      id: event.id,
      name: event.name,
      category: 'meme',
      description: event.description || ''
    }))
  )

  const allEvents = computed(() => [...OFFICIAL_EVENTS, ...FUN_EVENTS, ...dynamicMemeEvents.value])

  const eventNameMap = computed(() => Object.fromEntries(allEvents.value.map(event => [event.id, event.name])))

  const groupedEvents = computed(() => ({
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
      options: dynamicMemeEvents.value.map(({ id, name }) => ({ label: name, value: id }))
    }
  }))

  async function fetchMemeEvents(force = false) {
    if (loaded.value && !force) return dynamicMemeEvents.value

    isLoading.value = true
    error.value = null

    try {
      const result = await memeEventAPI.getAll()
      memeEvents.value = result.data || []
      loaded.value = true
      return dynamicMemeEvents.value
    } catch (err) {
      error.value = err.message || 'Failed to fetch meme events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyMemeEvents() {
    if (!userStore.isLoggedIn) {
      myMemeEvents.value = []
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await memeEventAPI.getMine()
      myMemeEvents.value = result.data || []
      return myMemeEvents.value
    } catch (err) {
      error.value = err.message || 'Failed to fetch your meme events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createMemeEvent(payload) {
    isLoading.value = true
    error.value = null

    try {
      const result = await memeEventAPI.create(payload)
      loaded.value = false
      await Promise.all([fetchMemeEvents(true), fetchMyMemeEvents()])
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to create meme event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateMemeEvent(eventCode, payload) {
    isLoading.value = true
    error.value = null

    try {
      const result = await memeEventAPI.update(eventCode, payload)
      loaded.value = false
      await Promise.all([fetchMemeEvents(true), fetchMyMemeEvents()])
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to update meme event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getEventName(eventId) {
    return eventNameMap.value[eventId] || getStaticEventName(eventId) || eventId
  }

  function getEventIconId(eventId) {
    return getStaticEventIconId(eventId)
  }

  function getEventsByCategory(category) {
    if (!category || category === 'all') return allEvents.value
    return allEvents.value.filter(event => event.category === category)
  }

  function getGroupedEvents(options = {}) {
    const includeAll = options.includeAll || false
    return Object.entries(groupedEvents.value).map(([key, group]) => ({
      label: group.label,
      value: key,
      options: includeAll
        ? [{ label: '全部', value: `${key}_all` }, ...group.options]
        : group.options
    }))
  }

  return {
    categories,
    eventGroups,
    memeEvents,
    myMemeEvents,
    allEvents,
    groupedEvents,
    isLoading,
    loaded,
    error,
    fetchMemeEvents,
    fetchMyMemeEvents,
    createMemeEvent,
    updateMemeEvent,
    getEventName,
    getEventIconId,
    getEventsByCategory,
    getGroupedEvents,
    getStaticEventsByCategory,
    getStaticGroupedEvents
  }
})
