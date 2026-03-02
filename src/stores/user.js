import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function setUser(userData) {
    user.value = userData
  }

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  function logout() {
    user.value = null
    setToken('')
  }

  // 模拟登录（后续替换为真实 API）
  async function login(username, password) {
    // TODO: 替换为真实 API
    const mockUser = {
      id: 1,
      username: username,
      nickname: username,
      avatar: '',
      qq: ''
    }
    const mockToken = 'mock-token-' + Date.now()
    setUser(mockUser)
    setToken(mockToken)
    return mockUser
  }

  return {
    user,
    token,
    isLoggedIn,
    setUser,
    setToken,
    logout,
    login
  }
})