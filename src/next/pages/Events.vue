<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { categories, eventList, loadEvents, message, send, session, type EventInfo } from '../api'
const groups = computed(() => Object.entries(categories).map(([key, name]) => ({ name, items: eventList.value.filter(event => event.category === key) })))
const canManage = computed(() => session.value && session.value.role !== 'user')
const current = ref('')
const fields = ref({ code: '', name: '', description: '', active: true })
const error = ref('')
const busy = ref(false)
function edit(event?: EventInfo) {
  current.value = event?.code ?? ''
  fields.value = { code: event?.code ?? '', name: event?.name ?? '', description: event?.description ?? '', active: event?.active ?? true }
  error.value = ''
}
async function save() {
  busy.value = true; error.value = ''
  try {
    await send(current.value ? `/events/${encodeURIComponent(current.value)}` : '/events', current.value ? 'PATCH' : 'POST', fields.value)
    await loadEvents(); edit()
  } catch (cause) { error.value = message(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <header class="page-heading"><h1>项目</h1></header>
  <section v-if="canManage" class="form-panel">
    <h2>{{ current ? '编辑整活项目' : '新增整活项目' }}</h2>
    <form class="fields" @submit.prevent="save">
      <div class="field-pair"><label>编码<input v-model.trim="fields.code" maxlength="60" :disabled="Boolean(current)" required></label><label>名称<input v-model.trim="fields.name" maxlength="80" required></label></div>
      <label>描述<textarea v-model.trim="fields.description" maxlength="500" rows="2"></textarea></label>
      <label class="check"><input v-model="fields.active" type="checkbox">启用</label>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <div class="actions"><button class="primary" :disabled="busy">保存</button><button v-if="current" type="button" @click="edit()">取消编辑</button></div>
    </form>
  </section>
  <section v-for="group in groups.filter(group => group.items.length)" :key="group.name" class="section">
    <h2>{{ group.name }}项目</h2>
    <ul class="quick-grid">
      <li v-for="event in group.items" :key="event.code"><RouterLink :to="{ path: '/leaderboard', query: { event: event.code } }"><strong>{{ event.name }}</strong><span>{{ event.active ? event.code : '已停用' }}</span></RouterLink><button v-if="canManage && event.category === 'meme'" class="text-button" type="button" @click="edit(event)">编辑项目</button></li>
    </ul>
  </section>
</template>
