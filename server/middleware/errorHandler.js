export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({
      code: 400,
      message: messages.join(', '),
      errors: err.errors
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(400).json({
      code: 400,
      message: `${field} already exists`
    })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      code: 400,
      message: 'Invalid ID format'
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: 'Invalid token'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token expired'
    })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      code: 413,
      message: '请求内容过大，请将头像压缩后重试'
    })
  }

  // Default error
  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || 'Internal server error'
  })
}
