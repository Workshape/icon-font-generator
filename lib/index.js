'strict mode'

require('colors')

const errors = require('./errors')
const fs = require('fs')
const path = require('path')
const fontGenerator = require('webfonts-generator')
const async = require('async')

/**
 * Windows or Mac style line endings shouldn't be a problem.
 * However, I was unable to parse the CSS without adding a carriage return.
 * To avoid conflicting with a build on a Linux system I added a check to make sure we're on Mac or Windows.
 */ 
const IS_WIN_OR_MAC = (process.platform == "win32" || process.platform == "darwin")
const CSS_PARSE_REGEX = IS_WIN_OR_MAC ? /\-(.*)\:before.*\r\n\s*content: "(.*)"/gm : /\-(.*)\:before.*\n\s*content: "(.*)"/gm
const FONT_TYPES = [ 'svg', 'ttf', 'woff', 'woff2', 'eot' ]
const TEMPLATES = {
  html : path.resolve(__dirname, '../template/html.hbs'),
  css  : path.resolve(__dirname, '../template/css.hbs')
}
const GEN_PARAMS = [
  'css',
  'html',
  'fontName',
  'classPrefix',
  'normalize',
  'round',
  'fixedWidth',
  'fontHeight',
  'descent',
  'fontHeight',
  'centerHorizontally'
]

/*
 * Generate icon font set asynchronously
 *
 * @param {Object} options
 * @param {Function} callback
 */
function generate(options, callback) {

  callback = callback || function () {}

  // Populate default arguments
  options.fontName = options.fontName || 'icons'
  options.fontsPath = options.fontsPath || './'
  options.css = typeof options.css === 'undefined' ? true : options.css
  options.json = typeof options.json === 'undefined' ? true : options.json
  options.html = typeof options.html === 'undefined' ? true : options.html
  options.silent = typeof options.silent === 'undefined' ? true : options.silent
  options.types = options.types ? options.types : FONT_TYPES

  const { fontName, outputDir } = options

  // Log start
  let msg = `Generating font kit from ${ options.paths.length } SVG icons`.yellow
  log(options, msg)

  /*
   * Log success and trigger callback
   */
  function done() {
    log(options, 'Done'.green)
    callback()
  }

  // Run validation over options
  validate(options, err => {
    if (err) { return callback(err) }

    let codepoints = {}
    let tempCodepoints = {}
    if (options.codepoints) {
      let codepointsPath = path.resolve(options.codepoints)
      fs.exists(codepointsPath, exists => {
        if (!exists) {
          let msg = `Cannot find json file @ ${options.codepoints}!`
          return callback(new error.ValidationError(msg))
        }
        fs.stat(codepointsPath, (err, stats) => {
          if (!stats.isFile() || path.extname(codepointsPath) !== '.json') {
            let msg = `Not a valid json file for mapping codepoints! ${options.codepoints} is not a valid file.`
            return callback(new error.ValidationError(msg))
          }
        })
      })
      tempCodepoints = JSON.parse(fs.readFileSync(path.resolve(options.codepoints)))
      
      for (let propName in tempCodepoints) {
        codepoints[propName] = Number.parseInt(tempCodepoints[propName])
      }
    }

    let config = {
      files           : options.paths,
      dest            : options.outputDir,
      cssFontsUrl     : options.fontsPath,
      types           : options.types,
      codepoints      : codepoints,
      startCodepoint  : options.startCodepoint || 0xF101,
      cssDest         : options.cssPath,
      htmlDest        : options.htmlPath,
      cssTemplate     : options.cssTemplate  || TEMPLATES.css,
      htmlTemplate    : options.htmlTemplate || TEMPLATES.html,
      templateOptions : {
        baseTag     : options.baseTag || 'i',
        classPrefix : (options.classPrefix || 'icons') + '-'
      }
    }

    // Add available options to generator config
    GEN_PARAMS.forEach(key => {
      if (typeof options[key] !== 'undefined') {
        // Parse numeric values
        if (`${ parseFloat(options[key]) }` === `${ options[key] }`) {
          options[key] = parseFloat(options[key])
        }

        config[key] = options[key]
      }
    })

    // Run font generation
    async.series([
      callback => fontGenerator(config, callback),
      callback => deleteUnspecifiedTypes(options, callback),
    ], (err, results) => {
      if (err) { return callback(err) }

      // Log font files output
      options.types.map(ext => logOutput(options, [
        outputDir, `${ fontName }.${ ext }`
      ]))

      // Log HTML file output
      if (options.html) {
        logOutput(options, [
          outputDir, options.htmlPath || `${ fontName }.html`
        ])
      }

      // Log CSS file output
      if (options.css) {
        logOutput(options, [
          outputDir, options.cssPath || `${ fontName }.css`
        ])
      }

      // If specified, generate JSON icons map by parsing the generated CSS
      if (options.json) {
        const jsonPath = (
          options.jsonPath ||
          `${ path.join(outputDir, '/' + fontName) }.json`
        )
        const css = results[0].generateCss()
        let map = {}

        // Log JSON map output
        logOutput(options, [
          outputDir,
          options.jsonPath || `${ fontName }.json`
        ])

        css.replace(CSS_PARSE_REGEX, (match, name, code) => {
          map[name] = code
        })

        fs.writeFile(jsonPath, JSON.stringify(map, null, 4), done)
      } else {
        done()
      }
    }, callback)
  })
}

/*
 * Delete generated fonts with extensions that weren't specified
 */
function deleteUnspecifiedTypes(options, done) {
  const { outputDir, fontName, types } = options

  async.map(FONT_TYPES, (ext, callback) => {
    if (types.indexOf(ext) !== -1) { return callback() } // Do nothing

    let filepath = path.resolve(outputDir, `${ fontName }.${ ext }`)

    fs.exists(filepath, exists => {
      exists ? fs.unlink(filepath, callback) : callback()
    })
  }, done)
}

/*
 * Log output file generation
 *
 * @param {Object} options
 * @param {[String]} parts
 */
function logOutput(options, parts) {
  const msg = `${ 'Generated '.blue }${ path.resolve.apply(path, parts).cyan }`
  log(options, msg)
}

/*
 * Log message unless configured to run silent
 *
 * @param {Object} options
 * @param {String} message
 */
function log(options, message) {
  if (options.silent) { return }

  console.log(message)
}

/*
 * Asynchronously validate generation options, check existance of given files
 * and directories
 *
 * @param {Object} options
 * @param {Function} callback
 */
function validate(options, callback) {
  // Check that input glob was passed
  if (!options.paths.length) {
    return callback(new errors.ValidationError('No paths specified'))
  }

  // Check that output path was passed
  if (!options.outputDir) {
    const msg = 'Please specify an output directory with -o or --output'
    return callback(new errors.ValidationError(msg))
  }

  // Check that the existance of output path
  fs.exists(options.outputDir, exists => {
    if (!exists) {
      let msg = 'Output directory doesn\'t exist'
      return callback(new errors.ValidationError(msg))
    }

    // Check that output path is a directory
    fs.stat(options.outputDir, (err, stats) => {
      if (err) { return callback(err) }

      if (!stats.isDirectory()) {
        let msg = 'Output path must be a directory'
        return callback(new errors.ValidationError(msg))
      }

      // Check existance of HTML template (If set)
      if (options.htmlTemplate) {
        return fs.exists(options.htmlTemplate, exists => {
          if (!exists) {
            let msg = 'HTML template not found'
            return callback(new errors.ValidationError(msg))
          }

          callback()
        })
      }

      callback()
    })
  })
}

module.exports = { generate }