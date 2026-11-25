import { writeFileSync } from 'node:fs'
import { STATIC_EVENTS } from '../src/config/events.js'

const quote = value => value == null ? 'NULL' : `'${value.replaceAll("'", "''")}'`
const statements = STATIC_EVENTS.map(({ id, name, category, iconId }) =>
  `INSERT INTO events (code, name, category, icon_id) VALUES (${[id, name, category, iconId].map(quote).join(', ')});`
)
writeFileSync(new URL('../migrations/0002_events.sql', import.meta.url), `-- Source: src/config/events.js\n${statements.join('\n')}\n`)
