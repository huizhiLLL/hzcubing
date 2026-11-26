import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const localProxy = { target: 'http://127.0.0.1:8795', changeOrigin: false }
const productionOrigin = 'https://hzcubing.fun'
const productionProxy = {
  target: productionOrigin,
  changeOrigin: true,
  bypass(request, response) {
    const host = request.headers.host ?? ''
    const localHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)
    const localPeer = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)
    const source = request.headers.origin
    const safeMethod = ['GET', 'HEAD'].includes(request.method)
    if (localPeer && localHost && (source === `http://${host}` || (source === undefined && safeMethod))) return
    response.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify({ message: '请求来源不匹配' }))
    return request.url
  },
  configure(proxy) {
    proxy.on('proxyReq', (upstream, request) => {
      if (request.headers.origin) upstream.setHeader('Origin', productionOrigin)
    })
  },
}
const previewProxy = {
  target: 'https://preview.hzcubing.fun',
  changeOrigin: true,
  bypass(request, response) {
    if (!response) return false
    if (request.method === 'GET' || request.method === 'HEAD') return
    response.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET, HEAD' })
    response.end(JSON.stringify({ message: '线上预览数据只读' }))
    return request.url
  },
  configure(proxy) {
    proxy.on('proxyReq', request => {
      request.removeHeader('cookie')
      request.removeHeader('authorization')
    })
    proxy.on('proxyRes', response => {
      delete response.headers['set-cookie']
    })
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { HZCUBING_PREVIEW_DATA } = loadEnv(mode, process.cwd(), 'HZCUBING_')
  const productionData = mode === 'online'
  const proxy = productionData ? productionProxy : HZCUBING_PREVIEW_DATA === '1' ? previewProxy : localProxy

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      // Discover the same Base UI dependencies before loading lazy routes.
      include: [
        '@base-ui/react/field',
        '@base-ui/react/input',
        '@base-ui/react/merge-props',
        '@base-ui/react/select',
        '@base-ui/react/use-render',
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: productionData ? '127.0.0.1' : '0.0.0.0',
      allowedHosts: productionData ? [] : ['hzcubing.fun'],
      ...(productionData ? { cors: false } : {}),
      proxy: { '/api': proxy, '/media': proxy },
    }
  }
})
