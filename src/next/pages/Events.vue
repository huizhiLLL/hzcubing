<script setup lang="ts">
import { Pencil, X } from '@lucide/vue'
import IconButton from '../components/IconButton.vue'
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
      <div class="actions"><button class="primary" :disabled="busy">保存</button><IconButton v-if="current" label="取消编辑" @click="edit()"><X /></IconButton></div>
    </form>
  </section>
  <section v-for="group in groups.filter(group => group.items.length)" :key="group.name" class="section">
    <h2>{{ group.name }}项目</h2>
    <ul class="directory-list">
      <li v-for="event in group.items" :key="event.code">
        <RouterLink class="directory-link" :to="{ path: '/leaderboard', query: { event: event.code } }">
          <strong>{{ event.name }}</strong>
          <small v-if="!event.active || event.code !== event.name">{{ event.active ? event.code : '已停用' }}</small>
        </RouterLink>
        <IconButton v-if="canManage && event.category === 'meme'" :label="`编辑${event.name}`" @click="edit(event)"><Pencil /></IconButton>
      </li>
    </ul>
  </section>
</template>
