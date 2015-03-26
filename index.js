/*jshint node:true */
'use strict';
var map   = require('map-stream');
var gutil = require('gulp-util');
var fs    = require('fs');
var os    = require('os');
var path  = require('path');
var which = require('which');
var spawn = require('child_process').spawn;

var fixPath = function (src, ext) {
  // Use the backslashes on Windows
  if (/win/.test(os.platform())) {
    src = src.replace(/[/]/g, '\\');
    if (ext) {
      src += '.bat';
    }
  }
  return src;
};

module.exports = function (command, opt) {
  var me    = 'gulp-peridot';
  if (! opt && (command instanceof Object)) {
    opt = command;
    command = '';
  }

  // Assign default options if one is not supplied
  opt = opt || {};
  opt = {
    // general settings
    silent            : opt.silent || false,
    dryRun            : opt.dryRun || false,
    // code coverage options
    coverageHtml      : opt.coverageHtml      || '',
    coverageXml       : opt.coverageXml       || '',
    coverageClover    : opt.coverageClover    || '',
    coveragePhp       : opt.coveragePhp       || '',
    coverageCrap4j    : opt.coverageCrap4j    || '',
    coverageText      : opt.coverageText      || false,
    coverageBlacklist : opt.coverageBlacklist || [],
    coverageWhitelist : opt.coverageWhitelist || [],
    // test selection options
    filter            : opt.filter || '',
    // test execution options
    reporter          : opt.reporter      || 'spec',
    colors            : (typeof opt.colors === 'undefined') ? true : opt.colors,
    stopOnFailure     : opt.stopOnFailure || false,
    // configuration options
    configurationFile : opt.configurationFile || ''
  };

  // If path to peridot bin not supplied, use default vendor/bin path
  if (! command) {
    command = fixPath(path.join(process.cwd(), './vendor/bin/peridot'), true);
    if (! fs.existsSync(command)) {
      try {
        command = which.sync('peridot');
      } catch (e) {
        throw new gutil.PluginError(me, 'Can not find Peridot executable');
      }
    }
  } else if (typeof command !== 'string') {
    throw new gutil.PluginError(me, 'Invalid Peridot Path');
  }

  var launched = false;
  return map (function (file, cb) {
    // First file triggers the command, so other files does not matter
    if (launched) {
      return cb(null, file);
    }
    launched = true;

    // add remaining switches
    var bootstrap = fixPath(path.join(__dirname, './peridot-easy/bootstrap.php'));
    var args = [ '--configuration', bootstrap, '-B', __dirname ];
    var addOption = function (name, value) {
      args.push(name);
      if (value) {
        args.push(value);
      }
    };
    var env = Object.create(process.env);

    /* code coverage */
    var reports = [
      'Html',
      'Xml',
      'Clover',
      'Php',
      'Crap4j',
      'Text'
    ];

    for (var i = 0; i < reports.length; i++) {
      var r = reports[i];
      var o = 'coverage' + r;
      if (opt[o]) {
        addOption('--coverage-' + r.toLowerCase(), opt[o]);
      }
    }

    if (typeof opt.coverageBlacklist === 'string') {
      opt.coverageBlacklist = [ opt.coverageBlacklist ];
    }
    opt.coverageBlacklist.forEach(function (bl) {
      addOption('-B', bl);
    });
    if (typeof opt.coverageWhitelist === 'string') {
      opt.coverageWhitelist = [ opt.coverageWhitelist ];
    }
    opt.coverageWhitelist.forEach(function (wl) {
      addOption('-W', wl);
    });

    /* test selection */
    if (opt.filter) {
      addOption('--grep', opt.filter);
    }

    /* test execution options */
    if (opt.reporter) {
      addOption('--reporter', opt.reporter);
    }
    if (! opt.colors) {
      addOption('--no-colors');
    }
    if (opt.stopOnFailure) {
      addOption('--bail');
    }

    /* configuration options */
    if (! opt.configurationFile) {
      var defaultConf = path.join(process.cwd(), 'peridot.php');
      if (fs.existsSync(defaultConf)) {
        opt.configurationFile = defaultConf;
      }
    }
    if (opt.configurationFile) {
      env.PERIDOT_BOOTSTRAP = opt.configurationFile;
    }

    /* specs directory */
    var specsDir = file.path;
    if (! fs.statSync(file.path).isDirectory()) {
      specsDir = path.dirname(specsDir);
    }
    args.push(specsDir);

    /* -- DRYRUN -- */
    if (opt.dryRun) {
      var cmdstr = command + ' ' + args.join(' ');
      var output = '\n\n*** Dry Run ***\n';
      output += '[Command]\n' + cmdstr + '\n';
      if (env.PERIDOT_BOOTSTRAP) {
        output += '[process.env.PERIDOT_BOOTSTRAP]\n' + env.PERIDOT_BOOTSTRAP + '\n';
      }
      gutil.log(gutil.colors.green(output));
      return cb();
    }

    /* -- EXECUTE -- */
    spawn(command, args, { stdio: (opt.silent) ? 'ignore' : 'inherit', env: env })
    .on('error', function (err) {
      throw new gutil.PluginError(me, 'Failed to spawn "' + command + '": ' + err.message);
    })
    .on('exit', function (err) {
      cb(null, file);
    });
  });
};
