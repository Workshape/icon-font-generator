'strict mode'

require('colors')

const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const fontGenerator = promisify(require('webfonts-generator'))
const {
  CSS_PARSE_REGEX, FONT_TYPES, TEMPLATES, OPTIONAL_PARAMS, DEFAULT_OPTIONS
} = require('./constants')
const { ValidationError } = require('./errors')
const { log, logOutput } = require('./utils')
const fsAsync = {
  exists    : promisify(fs.exists),
  stat      : promisify(fs.stat),
  unlink    : promisify(fs.unlink),
  readFile  : promisify(fs.readFile),
  writeFile : promisify(fs.writeFile)
}

/**
 * Generate icon font set asynchronously
 *
 * @param  {Object} options
 * @param  {Function} callback
 * @return {void}
 */
async function generate(options = {}) {
  options = Object.assign(DEFAULT_OPTIONS, options)

  // Log start
  let msg = `Generating font kit from ${ options.paths.length } SVG icons`.yellow
  log(options, msg)

  // Run validation over options
  await validateOptions(options)

  if (options.codepoints) {
    options.codepointsMap = await getCodepointsMap(options.codepoints)
  }

  // Run font generation
  const config = getGeneratorConfig(options)
  const generatorResult = await fontGenerator(config)

  // Clean up after generator
  await deleteUnspecifiedTypes(options)

  // If specified, generate JSON map
  if (options.json) {
    await generateJson(options, generatorResult)
  }

  // Log generated files
  logReport(options)
}

/**
 * Transform options Object in a configuration accepted by the generator
 *
 * @param  {Object} options
 * @return {void}
 */
function getGeneratorConfig(options) {
  const config = {
    files           : options.paths,
    dest            : options.outputDir,
    cssFontsUrl     : options.fontsPath,
    types           : options.types,
    codepoints      : options.codepointsMap,
    startCodepoint  : options.startCodepoint || 0xF101,
    cssDest         : options.cssPath,
    htmlDest        : options.htmlPath,
    cssTemplate     : options.cssTemplate  || TEMPLATES.css,
    htmlTemplate    : options.htmlTemplate || TEMPLATES.html,
    templateOptions : {
      baseTag     : options.baseTag || 'i',
      classPrefix : (options.classPrefix || 'icon') + '-'
    }
  }

  // Normalise and add available optional configurations
  OPTIONAL_PARAMS.forEach(key => {
    if (typeof options[key] !== 'undefined') {
      // Parse numeric values
      if (`${ parseFloat(options[key]) }` === `${ options[key] }`) {
        options[key] = parseFloat(options[key])
      }

      config[key] = options[key]
    }
  })

  return config
}

/**
 * Correctly parse codepoints map
 *
 * @param  {Object} options
 * @return {void}
 */
async function getCodepointsMap(filepath) {
  const content = await fsAsync.readFile(filepath)
  let codepointsMap

  try {
    codepointsMap = JSON.parse(content)
  } catch (e) {
    throw new ValidationError('Codepoints map is invalid JSON')
  }

  for (let propName in codepointsMap) {
    codepointsMap[propName] = Number.parseInt(codepointsMap[propName])
  }

  return codepointsMap
}

/**
 * Log report with all generated files and completion message
 *
 * @param  {Object} options
 * @return {void}
 */
function logReport(options) {
  const { outputDir, fontName } = options

  // Log font files output
  for (let ext of options.types) { logOutput(options, [ outputDir, `${ fontName }.${ ext }` ]) }

  // Log HTML file output
  if (options.html) {
    logOutput(options, [ outputDir, options.htmlPath || `${ fontName }.html` ])
  }

  // Log CSS file output
  if (options.css) {
    logOutput(options, [ outputDir, options.cssPath || `${ fontName }.css` ])
  }

  if (options.json) {
    // Log JSON map output
    logOutput(options, [ outputDir, options.jsonPath || `${ fontName }.json` ])
  }

  // Log final message
  log(options, 'Done'.green)
}

/**
 * Generate JSON icons map by parsing the generated CSS
 *
 * @param  {Object} options
 * @return {void}
 */
async function generateJson(options, generatorResult) {
  const jsonPath = (
    options.jsonPath ||
    `${ path.join(options.outputDir, '/' + options.fontName) }.json`
  )

  const css = generatorResult.generateCss()
  let map = {}

  css.replace(CSS_PARSE_REGEX, (match, name, code) => map[name] = code)

  await fsAsync.writeFile(jsonPath, JSON.stringify(map, null, 4))
}

/**
 * Delete generated fonts with extensions that weren't specified
 *
 * @param  {Object} options
 * @return {void}
 */
async function deleteUnspecifiedTypes(options) {
  const { outputDir, fontName, types } = options

  for (let ext of FONT_TYPES) {
    if (types.indexOf(ext) !== -1) { continue }

    let filepath = path.resolve(outputDir, `${ fontName }.${ ext }`)

    if (await fsAsync.exists(filepath)) {
      await fsAsync.unlink(filepath)
    }
  }
}

/**
 * Asynchronously validate generation options, check existance of given files
 * and directories
 *
 * @throws
 * @param  {Object} options
 * @return {void}
 */
async function validateOptions(options) {
  // Check that input glob was passed
  if (!options.paths.length) {
    throw new ValidationError('No paths specified')
  }

  // Check that output path was passed
  if (!options.outputDir) {
    throw new ValidationError('Please specify an output directory with -o or --output')
  }

  // Check that the existance of output path
  if (!await fsAsync.exists(options.outputDir)) {
    throw new ValidationError('Output directory doesn\'t exist')
  }

  // Check that output path is a directory
  const outStat = await fsAsync.stat(options.outputDir)
  if (!outStat.isDirectory()) {
    throw new ValidationError('Output path must be a directory')
  }

  // Check existance of CSS template (If set)
  if (options.cssTemplate && !await fsAsync.exists(options.cssTemplate)) {
    throw new ValidationError('CSS template not found')
  }

  // Check existance of HTML template (If set)
  if (options.htmlTemplate && !await fsAsync.exists(options.htmlTemplate)) {
    throw new ValidationError('HTML template not found')
  }

  // Validate codepoints file if passed
  if (options.codepoints) {
    if (!await fsAsync.exists(options.codepoints)) {
      throw new ValidationError(`Cannot find json file @ ${options.codepoints}!`)
    }

    const codepointsStat = await fsAsync.stat(options.codepoints)
    if (!codepointsStat.isFile() || path.extname(options.codepoints) !== '.json') {
      throw new ValidationError([
        'Codepoints file must be JSON',
        `${options.codepoints} is not a valid file.`
      ].join(' '))
    }
  }
}

module.exports = { generate }
