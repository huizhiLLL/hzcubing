import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, userAPI } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // Initialize user from token
  async function initUser() {
    if (!token.value) return false

    isLoading.value = true
    error.value = null

    try {
      const result = await authAPI.me()
      if (result.code === 200 && result.data) {
        user.value = {
          ...result.data,
          id: result.data.userNo || result.data.id
        }
        localStorage.setItem('userInfo', JSON.stringify(user.value))
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to init user:', err)
      clearAuth()
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Login
  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const result = await authAPI.login({ email, password })
      
      if (result.code === 200 && result.data) {
        const { token: newToken, user: userData } = result.data
        const normalizedUser = { ...userData, id: userData.userNo || userData.id }
        setAuth(newToken, normalizedUser)
        return normalizedUser
      } else {
        throw new Error(result.message || 'Login failed')
      }
    } catch (err) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Register
  async function register(userData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await authAPI.register(userData)
      
      if (result.code === 200 && result.data) {
        const { token: newToken, user: newUser } = result.data
        const normalizedUser = { ...newUser, id: newUser.userNo || newUser.id }
        setAuth(newToken, normalizedUser)
        return normalizedUser
      } else {
        throw new Error(result.message || 'Registration failed')
      }
    } catch (err) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update profile
  async function updateProfile(profileData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await userAPI.updateProfile(profileData)
      
      if (result.code === 200 && result.data) {
        user.value = { ...user.value, ...result.data, id: result.data.userNo || result.data.id || user.value?.id }
        localStorage.setItem('userInfo', JSON.stringify(user.value))
        return user.value
      } else {
        throw new Error(result.message || 'Update failed')
      }
    } catch (err) {
      error.value = err.message || 'Update failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  function logout() {
    clearAuth()
  }

  // Set auth
  function setAuth(newToken, userData) {
    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('userInfo', JSON.stringify(userData))
  }

  // Clear auth
  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // Load from localStorage
  function loadFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('userInfo')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user info')
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isLoggedIn,
    initUser,
    login,
    register,
    logout,
    updateProfile,
    loadFromStorage
  }
})
