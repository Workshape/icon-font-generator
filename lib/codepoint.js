const { ValidationError } = require('./errors')

function isNumber(value) {
  return value.match(/^((0x[\da-f]+)|(\d+))$/gi)
}

// https://www.w3.org/International/questions/qa-escapes#cssescapes
function isUnicodeEscape(value) {
  return value.match(/^\\[\da-f]{1,6}$/gi)
}

function parseCodePoint(codePoint, propName) {
  if(isNumber(codePoint)) {
    return Number.parseInt(codePoint)
  }
  else if(codePoint.length === 1) {
    return codePoint.charCodeAt(0)
  }
  else if(isUnicodeEscape(codePoint)) {
    return Number.parseInt(codePoint.slice(1), 16)
  }
  else {
    throw new ValidationError('Codepoints map contains invalid code point for icon \'' + propName + '\'')
  }
}

module.exports = { parseCodePoint }
