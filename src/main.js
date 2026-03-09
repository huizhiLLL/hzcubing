import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useUserStore } from './stores/user'
import './styles/main.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize user from localStorage token
const userStore = useUserStore(pinia)
userStore.loadFromStorage()

// Try to validate token on app start (non-blocking)
userStore.initUser().catch(err => {
  console.log('Token validation failed, user will need to login')
})

app.mount('#app')
