import assert from 'node:assert/strict'
import test from 'node:test'
import { orderEvents } from '../../src/next/eventOrder.ts'

const event = (name, category = 'meme') => ({ code: name, name, category })
const names = events => events.map(item => item.name)

test('groups distances and orders them by meters, including named races', () => {
  const input = ['全马', '1000m', '400m', '50m', '2000m', '5000m', '2400米 双人接力', '半马', '万米', '800m', '1500m']
  assert.deepEqual(names(orderEvents(input.map(name => event(name)))), ['50m', '400m', '800m', '1000m', '1500m', '2000m', '2400米 双人接力', '5000m', '万米', '半马', '全马'])
})

test('groups similar names with natural numeric order without changing official order', () => {
  const input = [event('三阶', 'official'), event('二阶', 'official'), ...['5×5 2048', '四阶单手', '3×3 2048', '七阶单手', '4×4 2048', '二阶单手', '250ml牛奶'].map(name => event(name))]
  const result = names(orderEvents(input))
  assert.deepEqual(result.slice(0, 2), ['三阶', '二阶'])
  assert.deepEqual(result.filter(name => name.includes('2048')), ['3×3 2048', '4×4 2048', '5×5 2048'])
  assert.deepEqual(result.filter(name => name.endsWith('单手')), ['二阶单手', '四阶单手', '七阶单手'])
  assert.equal(input[2].name, '5×5 2048')
})
