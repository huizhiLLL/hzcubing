import { body } from 'express-validator'
import MemeEvent from '../models/MemeEvent.js'

export const memeEventValidation = [
  body('eventCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 32 }).withMessage('Event code must be 2-32 characters')
    .custom((value) => {
      const normalized = normalizeEventCode(value)
      if (!normalized) {
        throw new Error('Event code is invalid')
      }
      return true
    }),
  body('eventName')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isLength({ max: 50 }).withMessage('Event name must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description must be less than 300 characters')
]

export function serializeEvent(event) {
  return {
    id: event.eventCode,
    name: event.eventName,
    category: 'meme',
    description: event.description || '',
    createdBy: event.createdBy,
    createdByName: event.createdByName,
    isActive: event.isActive,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }
}

export function normalizeEventCode(input = '') {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
}

export async function createMemeEvent({ eventCode, eventName, description = '', createdBy, createdByName }) {
  const rawCode = eventCode || eventName || ''
  const normalizedEventCode = normalizeEventCode(rawCode)

  if (!normalizedEventCode) {
    return {
      ok: false,
      status: 400,
      body: {
        code: 400,
        message: 'Event code is invalid'
      }
    }
  }

  const existing = await MemeEvent.findOne({ eventCode: normalizedEventCode })
  if (existing) {
    return {
      ok: false,
      status: 400,
      body: {
        code: 400,
        message: 'Event code already exists'
      }
    }
  }

  const event = await MemeEvent.create({
    eventCode: normalizedEventCode,
    eventName: eventName.trim(),
    description: description?.trim() || '',
    type: 'meme',
    createdBy,
    createdByName,
    isActive: true
  })

  return {
    ok: true,
    event
  }
}
