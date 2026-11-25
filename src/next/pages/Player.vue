<script setup lang="ts">
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from '@lucide/vue'
import IconButton from '../components/IconButton.vue'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api, day, label, message, send, session, time, type Best, type Player, type RecordInfo } from '../api'

const route = useRoute()
const own = computed(() => session.value?.userNo === Number(route.params.userNo))
const profile = ref<{ user: Player; records: RecordInfo[]; best: Best[]; more: boolean }>()
const fields = ref({ nickname: '', bio: '', wcaId: '' })
const qq = ref('')
const page = ref(1)
const error = ref('')
const notice = ref('')
const loading = ref(false)
const pending = ref(false)
const refresh = ref(0)

watch(() => route.params.userNo, () => { page.value = 1; notice.value = '' })
watch([() => route.params.userNo, page, refresh], async ([number, current], _, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  error.value = ''
  try {
    const result = await api<typeof profile.value>(`/players/${encodeURIComponent(String(number))}?page=${current}`, { signal: controller.signal })
    if (!result || controller.signal.aborted) return
    profile.value = result
    const { nickname, bio, wcaId } = result.user
    fields.value = { nickname, bio, wcaId }
  } catch (cause) { if (!controller.signal.aborted) error.value = message(cause) }
  finally { if (!controller.signal.aborted) loading.value = false }
}, { immediate: true })

async function action(run: () => Promise<unknown>, success: string) {
  pending.value = true
  error.value = ''; notice.value = ''
  try { await run(); notice.value = success; refresh.value++ }
  catch (cause) { error.value = message(cause) }
  finally { pending.value = false }
}
function avatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) action(() => api('/profile/avatar', { method: 'PUT', body: file }), '头像已更新')
}
function remove(id: string) {
  if (window.confirm('确定删除这条成绩？')) action(() => send(`/records/${id}`, 'DELETE'), '成绩已删除')
}
</script>

<template>
  <p v-if="error" class="notice error" role="alert">{{ error }}</p>
  <p v-if="notice" class="notice" role="status">{{ notice }}</p>
  <p v-if="loading" class="notice" role="status">正在加载个人主页…</p>
  <template v-if="profile && !loading">
    <header class="page-heading">
      <div class="player-heading"><img v-if="profile.user.avatar" class="avatar" :src="profile.user.avatar" width="48" height="48" alt=""><div><h1>{{ profile.user.nickname }}</h1><p>{{ profile.user.wcaId || `#${profile.user.userNo}` }}</p></div></div>
      <RouterLink v-if="own" class="icon-action" to="/submit" aria-label="录入成绩" title="录入成绩"><Plus aria-hidden="true" /></RouterLink>
    </header>
    <p v-if="profile.user.bio">{{ profile.user.bio }}</p>
    <section class="section">
      <h2>个人最佳</h2>
      <p v-if="!profile.best.length" class="notice">还没有个人最佳。</p>
      <div v-else class="table-wrap"><table><thead><tr><th scope="col">项目</th><th scope="col" class="numeric">单次</th><th scope="col" class="numeric">平均</th></tr></thead>
        <tbody><tr v-for="item in profile.best" :key="item.event"><td>{{ label(item.event) }}</td><td class="numeric">{{ time(item.singleSeconds) }}</td><td class="numeric">{{ time(item.averageSeconds) }}</td></tr></tbody>
      </table></div>
    </section>
    <section class="section">
      <h2>成绩记录</h2>
      <p v-if="!profile.records.length" class="notice">暂无成绩。</p>
      <div v-else class="table-wrap"><table><thead><tr><th scope="col">项目</th><th scope="col" class="numeric">单次</th><th scope="col" class="numeric">平均</th><th scope="col" class="date-col">日期</th><th v-if="own" scope="col">操作</th></tr></thead>
        <tbody><tr v-for="item in profile.records" :key="item.id"><td>{{ label(item.event) }}</td><td class="numeric">{{ time(item.singleSeconds) }}</td><td class="numeric">{{ time(item.averageSeconds) }}</td><td class="date-col">{{ day(item.timestamp) }}</td><td v-if="own">
          <div class="record-actions">
            <RouterLink class="icon-action" :to="{ path: '/submit', query: { edit: item.id } }" aria-label="编辑成绩" title="编辑成绩"><Pencil aria-hidden="true" /></RouterLink>
            <IconButton class="danger-action" label="删除成绩" :disabled="pending" @click="remove(item.id)"><Trash2 /></IconButton>
          </div>
        </td></tr></tbody>
      </table></div>
      <div v-if="page > 1 || profile.more" class="actions pagination" role="group" aria-label="翻页">
        <IconButton label="上一页" :disabled="page === 1" @click="page--"><ChevronLeft /></IconButton>
        <IconButton label="下一页" :disabled="!profile.more" @click="page++"><ChevronRight /></IconButton>
      </div>
    </section>
    <section v-if="own" class="section form-panel">
      <h2>个人资料</h2>
      <form class="fields" @submit.prevent="action(() => send('/profile', 'PATCH', fields), '资料已保存')">
        <label>昵称<input v-model.trim="fields.nickname" maxlength="50" required></label>
        <label>WCA ID<input v-model.trim="fields.wcaId" maxlength="20"></label>
        <label>简介<textarea v-model.trim="fields.bio" maxlength="500" rows="3"></textarea></label>
        <button :disabled="pending">保存资料</button>
      </form>
      <label class="standalone">更新头像<input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" :disabled="pending" @change="avatar"></label>
      <form v-if="!session?.qqBound" class="fields standalone" @submit.prevent="action(async () => { await send('/profile/qq', 'POST', { qqId: qq }); if (session) session = { ...session, qqBound: true } }, 'QQ 已绑定')">
        <label>QQ 号码<input v-model.trim="qq" inputmode="numeric" minlength="5" maxlength="15" required></label><button :disabled="pending">绑定 QQ</button>
      </form>
      <p v-else class="standalone">已绑定 QQ</p>
    </section>
  </template>
</template>
