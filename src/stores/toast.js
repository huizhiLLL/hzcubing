import { defineStore } from 'pinia'

const DEFAULT_DURATION = 3200

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: []
  }),
  actions: {
    show(options = {}) {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const toast = {
        id,
        variant: options.variant || 'info',
        title: options.title || '',
        message: options.message || '',
        duration: Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION
      }

      this.items.push(toast)

      if (toast.duration > 0) {
        window.setTimeout(() => {
          this.remove(id)
        }, toast.duration)
      }

      return id
    },
    success(message, options = {}) {
      return this.show({
        ...options,
        message,
        variant: 'success'
      })
    },
    error(message, options = {}) {
      return this.show({
        ...options,
        message,
        variant: 'error'
      })
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id)
    }
  }
})
