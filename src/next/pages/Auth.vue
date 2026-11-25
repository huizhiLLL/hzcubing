<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, send, session, type Session } from '../api'
const route = useRoute()
const router = useRouter()
const registering = ref(false)
const fields = ref({ email: '', password: '', nickname: '' })
const busy = ref(false)
const error = ref('')
async function submit() {
  busy.value = true; error.value = ''
  try {
    session.value = await send<Session>(registering.value ? '/auth/register' : '/auth/login', 'POST', fields.value)
    const next = route.query.next
    await router.push(typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : `/user/${session.value.userNo}`)
  } catch (cause) { error.value = message(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <section class="form-panel narrow">
    <h1>{{ registering ? '注册' : '登录' }}</h1>
    <form class="fields" @submit.prevent="submit">
      <label>邮箱<input v-model.trim="fields.email" type="email" maxlength="254" autocomplete="email" required></label>
      <label v-if="registering">昵称<input v-model.trim="fields.nickname" maxlength="50" autocomplete="nickname" required></label>
      <label>密码<input v-model="fields.password" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" required></label>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <button type="submit" class="primary" :disabled="busy">{{ busy ? '处理中…' : registering ? '创建账号' : '登录' }}</button>
    </form>
    <button class="text-button switch-auth" type="button" :disabled="busy" @click="registering = !registering; error = ''">{{ registering ? '登录' : '注册' }}</button>
  </section>
</template>
