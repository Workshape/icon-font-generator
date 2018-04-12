'strict mode'

/*
 * Validation error class (Extends Error)
 */
class ValidationError extends Error {

  /**
   * @constructor
   *
   * @param {String} message
   */
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.message = message
  }

}

module.exports = { ValidationError }