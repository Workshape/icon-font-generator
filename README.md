![Icon](https://camo.githubusercontent.com/2b418776b6cc9cb7d90c68905d3381674f13d7ec/687474703a2f2f692e6375626575706c6f61642e636f6d2f4541367957612e706e67)

## Icon font generator

![Screenshot](https://camo.githubusercontent.com/7aaef96033be671fa29297c0efd6c50f97a502f6/68747470733a2f2f692e6375626575706c6f61642e636f6d2f65597736766a2e706e67)

> Easy-to-use, pre-configured cli tool to generate webfont icon kits from a bunch of .svg files

### Intro

This cli utility is ment to make webfont icon sets creation from the command line really simple - It wraps and pre-configures [webfonts-generator](https://www.npmjs.com/package/webfonts-generator), but allows for some degree of customisation.

It also does a couple extra things such as creating a .json file containing the icons to unicode characters map, which may be later used in styles, templates, etc..

#### Upgrading from v1.x.x

**!!** If you're upgrading from `v1.x.x` to `v2.x.x` - here's the changelog and thoubleshooting: https://github.com/Workshape/icon-font-generator/releases/tag/v2.1.2

**!!** `icon-font-generator` `v2.x.x >=` requires Node.js `>= v8.1.0` - is you wish to run on a lower version, use [v1.1.2](https://github.com/Workshape/icon-font-generator/releases/tag/v1.1.2)


### Install

```
npm install -g icon-font-generator
```

### Use

##### Quick usage

```
icon-font-generator my-icons/*.svg -o icon-dist
```

##### Cli params

```
Usage   : icon-font-generator [ svg-icons-glob ] -o [ output-dir ] [ options ]
Example : icon-font-generator src/*.svg -o dist

Options:
  -o, --out        Output icon font set files to <out> directory
  -n, --name       Name to use for generated fonts and files (Default: icons)
  -s, --silent     Do not produce output logs other than errors (Default: false)
  -f, --fontspath  Relative path to fonts directory to use in output files (Default: ./)
  -c, --css        Generate CSS file if true (Default: true)
  --csspath        CSS output path (Defaults to <out>/<name>.css)
  --cssfontsurl    CSS fonts directory url (Defaults to relative path)
  --csstp          CSS handlebars template path (Optional)
  --html           Generate HTML preview file if true (Default: true)
  --htmlpath       HTML output path (Defaults to <out>/<name>.html)
  --types          Font types - (Defaults to 'svg, ttf, woff, woff2, eot')
  --htmltp         HTML handlebars template path (Optional)
  -j, --json       Generate JSON map file if true (Default: true)
  --jsonpath       JSON output path (Defaults to <out>/<name>.json)
  -p, --prefix     CSS classname prefix for icons (Default: icon)
  -t, --tag        CSS base tag for icons (Default: i)  
  --selector       Use a selector instead of 'tag + prefix' (Default: null)
  --normalize      Normalize icons sizes (Default: false)
  --round          Setup SVG rounding (Default: 10e12)
  --descent        Offset applied to the baseline (Default: 0)
  --mono           Make font monospace (Default: false)
  --height         Fixed font height value
  --center         Center font horizontally
```


### License

Copyright (c) 2014 Workshape.io Ltd. - Released under the [MIT license](https://github.com/Workshape/icon-font-generator/blob/master/LICENSE)
