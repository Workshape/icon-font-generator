/**
 * @flow
 */
import 'colors';
import minimist from 'minimist';
import glob from 'glob';
import { generate } from './index';
import ValidationError from './ValidationError';
/*
 * Initialise script and options
 */
function init() {
  const args = minimist(process.argv.slice(2)),
    options = {
      paths: getPaths(args._),
      outputDir: args.o || args.out,
      fontName: args.n || args.name,
      fontsPath: args.f || args.fontspath,
      types: (args.types || 'svg,ttf,woff,eot').split(','),
      css: args.c || args.css,
      cssPath: args.csspath,
      cssTemplate: args.csstp,
      json: args.j || args.json,
      jsonPath: args.jsonpath,
      html: args.html,
      htmlPath: args.htmlpath,
      htmlTemplate: args.htmltp,
      silent: args.s || args.silent || false,
      classPrefix: args.p || args.prefix,
      baseTag: args.t || args.tag,
      normalize: args.normalize,
      round: args.round,
      descent: args.descent,
      fixedWidth: args.mono,
      fontHeight: args.height,
      centerHorizontally: args.center,
    },
    calledEmpty =
      Object.keys(args).length === 1 && args._.length === 0;

  // Parse Boolean values that default to true
  ['html', 'css', 'json'].forEach(function(key) {
    if (typeof options[key] !== 'undefined') {
      options[key] = options[key] === 'true';
    }
  });

  // Show usage if missing any arguments or called with -h / --help
  if (args.h || args.help || calledEmpty) {
    showHelp();
    process.exit();
  }

  run(options);
}

/**
 * Run icon font kit creation
 *
 * @param {Object} options
 */
function run(options) {
  generate(options, err => {
    if (err) {
      return fail(err);
    }
  });
}

/**
 * Fail - Interrut process and log validation errors or throw unhandled exceptions
 *
 * @param {Error|ValidationError} err
 */
function fail(err) {
  if (
    typeof err === 'string' ||
    err instanceof ValidationError
  ) {
    console.error(err.message.red);
    process.exit();
  }

  if (err instanceof Error) {
    throw err;
  }
}

/**
 * Display usage
 */
function showHelp() {
  console.log(
    'Usage   :'.bold +
      ' icon-font-generator [ svg-icons-glob ] -o [ output-dir ] [ options ]\n' +
      'Example :'.bold +
      ' icon-font-generator src/*.svg -o dist\n\n' +
      'Options:\n'.bold +
      '  -o, --out        '.bold +
      'Output icon font set files to <out> directory\n'
        .italic +
      '  -n, --name       '.bold +
      'Name to use for generated fonts and files (Default: icons)\n' +
      '  -s, --silent     '.bold +
      'Do not produce output logs other than errors (Default: false)\n' +
      '  -f, --fontspath  '.bold +
      'Relative path to fonts directory to use in output files (Default: ./)\n' +
      '  -c, --css        '.bold +
      'Generate CSS file if true (Default: true)\n' +
      '  --types          '.bold +
      'Comma delimited list of font types (Defaults to svg,ttf,woff,eot)\n' +
      '  --csspath        '.bold +
      'CSS output path (Defaults to <out>/<name>.css)\n' +
      '  --csstp          '.bold +
      'CSS handlebars template path (Optional)\n' +
      '  --html           '.bold +
      'Generate HTML preview file if true (Default: true)\n' +
      '  --htmlpath       '.bold +
      'HTML output path (Defaults to <out>/<name>.html)\n' +
      '  --htmtp          '.bold +
      'HTML handlebars template path (Optional)\n' +
      '  -j, --json       '.bold +
      'Generate JSON map file if true (Default: true)\n' +
      '  --jsonpath       '.bold +
      'JSON output path (Defaults to <out>/<name>.json)\n' +
      '  -p, --prefix     '.bold +
      'CSS classname prefix for icons (Default: icon)\n' +
      '  -t, --tag        '.bold +
      'CSS base selector for icons (Default: i)' +
      '  --normalize      '.bold +
      'Normalize icons sizes (Default: false)\n' +
      '  --round          '.bold +
      'Setup SVG rounding (Default: 10e12)\n' +
      '  --descent        '.bold +
      'Offset applied to the baseline (Default: 0)\n' +
      '  --mono           '.bold +
      'Make font monospace (Default: false)\n' +
      '  --height         '.bold +
      'Fixed font height value\n' +
      '  --center         '.bold +
      'Center font horizontally',
  );
}

/**
 * Resolve globs
 *
 * @param {String} globs
 * @return {[String]}
 */
function getPaths(globs) {
  let out = [];

  globs.forEach(str => {
    out = out.concat(glob.sync(str));
  });

  return out;
}

init();
