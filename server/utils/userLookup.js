import User from '../models/User.js'

export function normalizeUserNo(value) {
  const numeric = Number.parseInt(String(value), 10)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null
}

export async function findUserByIdentifier(identifier, projection = null) {
  const userNo = normalizeUserNo(identifier)
  if (userNo === null) return null

  let query = User.findOne({ userNo })
  if (projection) {
    query = query.select(projection)
  }

  return query
}

export async function resolveUserIdentifierToObjectId(identifier) {
  const user = await findUserByIdentifier(identifier, '_id')
  return user?._id || null
}
