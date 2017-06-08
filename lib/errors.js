'strict mode'

/*
 * Validation error (Extends Error)
 */
function ValidationError(message) {
  this.name = 'ValidationError'
  this.message = message
  this.stack = new Error().stack
}

// Extend Error
ValidationError.prototype = Object.create(Error.prototype)

module.exports = { ValidationError }