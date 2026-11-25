import { createPasswordServer } from './service.mjs'

const port = Number(process.env.PASSWORD_SERVICE_PORT || 3026)
const server = createPasswordServer(process.env.PASSWORD_SERVICE_SECRET)
server.listen(port, '127.0.0.1', () => console.log(`Password service listening on loopback:${port}`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
