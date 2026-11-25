<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, eventList, message, send, session, type RecordInfo } from '../api'

const route = useRoute()
const router = useRouter()
const id = computed(() => typeof route.query.edit === 'string' ? route.query.edit : '')
const fields = ref({ event: '333', singleSeconds: '', averageSeconds: '', cube: '', method: '', competition: '' })
const initialTimes = ref({ singleSeconds: '', averageSeconds: '' })
const solves = ref('')
const solvesInitial = ref('')
const error = ref('')
const busy = ref(false)
const editable = ref(false)

watch([id, session], async ([key, user], _, onCleanup) => {
  if (!key || !user) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  try {
    const record = await api<RecordInfo>(`/records/${encodeURIComponent(key)}`, { signal: controller.signal })
    if (record.userNo !== user.userNo) throw new Error('只能编辑自己的成绩')
    initialTimes.value = { singleSeconds: String(record.singleSeconds ?? ''), averageSeconds: String(record.averageSeconds ?? '') }
    fields.value = { event: record.event, ...initialTimes.value, cube: record.cube ?? '', method: record.method ?? '', competition: record.competition ?? '' }
    solvesInitial.value = record.solves?.map(value => value ?? 'DNF').join(' ') ?? ''
    solves.value = solvesInitial.value
    editable.value = true
  } catch (cause) { if (!controller.signal.aborted) error.value = message(cause) }
}, { immediate: true })

async function save() {
  busy.value = true; error.value = ''
  try {
    const payload: Record<string, unknown> = { ...fields.value }
    for (const metric of ['singleSeconds', 'averageSeconds'] as const) {
      if (id.value && fields.value[metric] === initialTimes.value[metric]) delete payload[metric]
    }
    if (solves.value !== solvesInitial.value) payload.solves = solves.value.trim().split(/[\s,]+/).filter(Boolean)
    await send(id.value ? `/records/${encodeURIComponent(id.value)}` : '/records', id.value ? 'PATCH' : 'POST', payload)
    if (session.value) await router.push(`/user/${session.value.userNo}`)
  } catch (cause) { error.value = message(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <section class="form-panel">
    <h1>{{ id ? '编辑成绩' : '录入成绩' }}</h1>
    <p v-if="!session"><RouterLink :to="{ path: '/auth', query: { next: route.fullPath } }">登录后录入成绩</RouterLink></p>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <form v-if="session && (!id || editable)" class="fields" @submit.prevent="save">
      <label>项目<select v-model="fields.event" required><option v-for="event in eventList.filter(row => row.active || row.code === fields.event)" :key="event.code" :value="event.code">{{ event.name }}</option></select></label>
      <div class="field-pair"><label>单次<input v-model.trim="fields.singleSeconds" placeholder="12.34" inputmode="decimal"></label><label>平均<input v-model.trim="fields.averageSeconds" placeholder="13.45" inputmode="decimal"></label></div>
      <label>原始成绩<input v-model.trim="solves" placeholder="12.34 13.45 DNF"></label>
      <div class="field-pair"><label>器材<input v-model.trim="fields.cube" maxlength="100"></label><label>方法<input v-model.trim="fields.method" maxlength="100"></label></div>
      <label>比赛<input v-model.trim="fields.competition" maxlength="100"></label>
      <button class="primary" :disabled="busy">{{ busy ? '保存中…' : '保存成绩' }}</button>
    </form>
  </section>
</template>
