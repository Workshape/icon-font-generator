'strict mode';

require('colors');

var errors = require('./errors'),
  fs = require('fs'),
  path = require('path'),
  fontGenerator = require('webfonts-generator');

var FONT_TYPES = ['svg', 'ttf', 'woff', 'eot'],
  TEMPLATES = {
    html: path.resolve(__dirname, '../template/html.hbs'),
    css: path.resolve(__dirname, '../template/css.hbs'),
  },
  GEN_PARAMS = [
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
    'centerHorizontally',
  ];

/*
 * Generate icon font set asynchronously
 *
 * @param {Object} options
 * @param {Function} callback
 */
exports.generate = function(options, callback) {
  callback = callback || function() {};

  // Populate default arguments
  options.fontName = options.fontName || 'icons';
  options.fontsPath = options.fontsPath || './';
  options.css = typeof options.css === 'undefined'
    ? true
    : options.css;
  options.json = typeof options.json === 'undefined'
    ? true
    : options.json;
  options.html = typeof options.html === 'undefined'
    ? true
    : options.html;
  options.silent = typeof options.silent === 'undefined'
    ? true
    : options.silent;
  options.types = options.types
    ? options.types
    : FONT_TYPES;

  // Log start
  log(
    options,
    `Generating font kit from ${options.paths.length} SVG icons`
      .yellow,
  );

  /*
     * Log success and trigger callback
     */
  function done() {
    log(options, 'Done'.green);
    callback();
  }

  // Run validation over options
  validate(options, err => {
    if (err) {
      return callback(err);
    }

    const config = {
      files: options.paths,
      dest: options.outputDir,
      cssFontsUrl: options.fontsPath,
      types: options.types,
      cssDest: options.cssPath,
      htmlDest: options.htmlPath,
      cssTemplate: options.cssTemplate || TEMPLATES.css,
      htmlTemplate: options.htmlTemplate || TEMPLATES.html,
      templateOptions: {
        baseTag: options.baseTag || 'i',
        classPrefix: `${options.classPrefix || 'icons'}-`,
      },
    };

    // Add available options to generator config
    GEN_PARAMS.forEach(key => {
      if (typeof options[key] !== 'undefined') {
        // Parse numeric values
        if (
          `${parseFloat(options[key])}` ===
          `${options[key]}`
        ) {
          options[key] = parseFloat(options[key]);
        }

        config[key] = options[key];
      }
    });

    // Run font generation
    fontGenerator(config, (err, result) => {
      if (err) {
        return callback(err);
      }

      // Log font files output
      options.types.map(ext => {
        logOutput(options, [
          options.outputDir,
          `${options.fontName}.${ext}`,
        ]);
      });

      // Log HTML file output
      if (options.html) {
        logOutput(options, [
          options.outputDir,
          options.htmlPath || `${options.fontName}.html`,
        ]);
      }

      // Log CSS file output
      if (options.css) {
        logOutput(options, [
          options.outputDir,
          options.cssPath || `${options.fontName}.css`,
        ]);
      }

      // If specified, generate JSON icons map by parsing the generated CSS
      if (options.json) {
        var map = {},
          jsonPath =
            options.jsonPath ||
            `${path.join(options.outputDir, `/${options.fontName}`)}.json`,
          css = result.generateCss();

        // Log JSON map output
        logOutput(options, [
          options.outputDir,
          options.jsonPath || `${options.fontName}.json`,
        ]);

        css.replace(
          /\-(.*)\:before.*\n\s*content: "(.*)"/gm,
          (match, name, code) => {
            map[name] = code;
          },
        );

        fs.writeFile(
          jsonPath,
          JSON.stringify(map, null, 4),
          done,
        );
      } else {
        done();
      }
    });
  });
};

/*
 * Log output file generation
 *
 * @param {Object} options
 * @param {[String]} parts
 */
function logOutput(options, parts) {
  log(
    options,
    'Generated '.blue + path.resolve(...parts).cyan,
  );
}

/*
 * Log message unless configured to run silent
 *
 * @param {Object} options
 * @param {String} message
 */
function log(options, message) {
  if (options.silent) {
    return;
  }

  console.log(message);
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
    return callback(
      new errors.ValidationError('No paths specified'),
    );
  }

  // Check that output path was passed
  if (!options.outputDir) {
    return callback(
      new errors.ValidationError(
        'Please specify an output directory with -o or --output',
      ),
    );
  }

  // Check that the existance of output path
  fs.exists(options.outputDir, exists => {
    if (!exists) {
      return callback(
        new errors.ValidationError(
          "Output directory doesn't exist",
        ),
      );
    }

    // Check that output path is a directory
    fs.stat(options.outputDir, (err, stats) => {
      if (err) {
        return callback(err);
      }

      if (!stats.isDirectory()) {
        return callback(
          new errors.ValidationError(
            'Output path must be a directory',
          ),
        );
      }

      // Check existance of HTML template (If set)
      if (options.htmlTemplate) {
        fs.exists(options.htmlTemplate, exists => {
          if (!exists) {
            return callback(
              new errors.ValidationError(
                'HTML template not found',
              ),
            );
          }

          callback();
        });
      } else {
        callback();
      }
    });
  });
}
