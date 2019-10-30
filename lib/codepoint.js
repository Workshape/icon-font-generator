const { ValidationError } = require('./errors')

function isNumber(value) {
  return value.match(/^((0x[\d[a-f]+)|(\d+))$/gi)
}

function parseCodePoint(codePoint, propName) {
  if(isNumber(codePoint)) {
    return Number.parseInt(codePoint)
  }
  else if(codePoint.length === 1) {
    return codePoint.charCodeAt(0)
  }
  else {
    throw new ValidationError('Codepoints map contains invalid code point for icon \'' + propName + '\'')
  }
}

module.exports = { parseCodePoint }
