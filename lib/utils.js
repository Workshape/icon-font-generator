const path = require('path')

/**
 * Remove undefined keys from Object
 *
 * @param  {Object} options
 * @return {Object}
 */
function removeUndefinedKeys(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'undefined') {
      delete obj[key]
    }
  }

  return obj
}

/**
 * Log output file generation
 *
 * @param  {Object} options
 * @param  {[String]} parts
 * @return {void}
 */
function logOutput(options, parts) {
  const msg = `${ 'Generated '.blue }${ path.resolve.apply(path, parts).cyan }`
  log(options, msg)
}

/**
 * Log message unless configured to run silent
 *
 * @param  {Object} options
 * @param  {String} message
 * @return {void}
 */
function log(options, message) {
  if (options.silent) { return }
  console.log(message)
}

module.exports = { log, logOutput, removeUndefinedKeys }