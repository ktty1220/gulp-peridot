/* jshint node:true,mocha:true,strict:false */
var assert      = require('power-assert');
var fs          = require('fs');
var path        = require('path');
var os          = require('os');
var gutil       = require('gulp-util');
var which       = require('which');
var nopt        = require('nopt');
var strip       = require('strip-ansi');
var es          = require('event-stream');
var peridot     = require('../index');
var mkdirp      = require('mkdirp');
var rmdir       = require('rmdir');

describe('Commandline building', function () {
  before(function () {
    this.dummyDir = path.join(__dirname, './specs');
    mkdirp(this.dummyDir);
    this.fakeDir = new gutil.File({
      path: this.dummyDir
    });

    this.run = function (options, cb) {
      options.dryRun = true;
      var exec = options.exec;
      delete(options.exec);
      var stream = (exec) ? peridot(exec, options) : peridot(options);
      var capture = '';
      var origConsoleLog = console.log;
      console.log = function () {
        capture = Array.prototype.slice.call(arguments).join(' ');
      };
      stream.on('end', function () {
        console.log = origConsoleLog;
        capture = strip(capture);
        var cmd = capture.match(/\[Command\]\s+([^\n]+)/)[1].split(/\s+/);
        var exec = cmd.shift();
        var opt = nopt({
          'coverage-html'      : String,
          'coverage-xml'       : String,
          'coverage-clover'    : String,
          'coverage-php'       : String,
          'coverage-crap4j'    : String,
          'coverage-text'      : Boolean,
          'coverage-blacklist' : [ String, Array ],
          'coverage-whitelist' : [ String, Array ],
          'grep'               : String,
          'reporter'           : String,
          'no-colors'          : Boolean,
          'bail'               : Boolean,
          'configuration'      : String
        }, {
          'g': [ '--grep' ],
          'C': [ '--no-colros' ],
          'r': [ '--reporter' ],
          'b': [ '--bail' ],
          'c': [ '--configuration' ],
          'B': [ '--coverage-blacklist' ],
          'W': [ '--coverage-whitelist' ]
        }, cmd, 0);
        var ebs = (capture.match(/\[process.env.PERIDOT_BOOTSTRAP\]\s+([^\n]+)/) || [])[1];
        cb(exec, opt, ebs);
      });
      stream.write(this.fakeDir);
      stream.end();
    };

    this.makeAbsPath = function (rel, ext) {
      var abs = path.join(process.cwd(), rel);
      if (/win/.test(os.platform())) {
        abs = abs.replace(/[/]/g, '\\');
        if (ext) {
          abs += '.bat';
        }
      }
      return abs;
    };

    this.check = function (exec, opt, remain, mod) {
      mod = mod || {};
      assert(exec === (mod.exec || which.sync('peridot', true)));
      assert.deepEqual(opt.argv.remain, [ this.makeAbsPath('./test/specs') ]);
      assert(opt.configuration === this.makeAbsPath('./peridot-easy/bootstrap.php'));
      assert(opt.reporter === (mod.reporter || 'spec'));
      assert(opt['coverage-blacklist'].shift() === this.makeAbsPath('.'));
      if (opt['coverage-blacklist'].length === 0) {
        delete(opt['coverage-blacklist']);
      }
      delete(opt.argv);
      delete(opt.configuration);
      delete(opt.reporter);
      assert(Object.keys(opt).length === remain);
    };
  });

  after(function (done) {
    rmdir(this.dummyDir, done);
  });

  it('default', function (done) {
    this.run({}, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('specify peridot command', function (done) {
    this.run({
      exec: 'peridot'
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0, {
        exec: 'peridot'
      });
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('auto detect ./vendor/bin/peridot', function (done) {
    var dummyLocalComposer = this.makeAbsPath('./vendor/bin/');
    mkdirp.sync(dummyLocalComposer);
    fs.writeFileSync(dummyLocalComposer + 'peridot', '');
    fs.writeFileSync(dummyLocalComposer + 'peridot.bat', '');
    this.run({}, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0, {
        exec: this.makeAbsPath('./vendor/bin/peridot', true)
      });
      assert(! envBootStrap);
      rmdir(this.makeAbsPath('./vendor'), done);
    }).bind(this));
  });

  it('reporter: spec', function (done) {
    this.run({
      reporter: 'spec'
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0, {
        reporter: 'spec'
      });
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('colors: false', function (done) {
    this.run({
      colors: false
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt.colors === false);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('stopOnFailure: true', function (done) {
    this.run({
      stopOnFailure: true
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt.bail === true);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageHtml: covhtml', function (done) {
    var covDir = 'covhtml';
    this.run({
      coverageHtml: covDir
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-html'] === covDir);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageXml: ./covxml', function (done) {
    var covDir = './covxml';
    this.run({
      coverageXml: covDir
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-xml'] === covDir);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageClover: ./clover.xml', function (done) {
    var covFile = './clover.xml';
    this.run({
      coverageClover: covFile
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-clover'] === covFile);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coveragePhp: ./coverage.php', function (done) {
    var covFile = './coverage.php';
    this.run({
      coveragePhp: covFile
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-php'] === covFile);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageCrap4j: ./coverage.c4j', function (done) {
    var covFile = './coverage.c4j';
    this.run({
      coverageCrap4j: covFile
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-crap4j'] === covFile);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageText: true', function (done) {
    this.run({
      coverageText: true
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt['coverage-text'] === true);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageBlacklist: single', function (done) {
    var covDir = 'report';
    var bl = 'vendor';
    this.run({
      coverageHtml: covDir,
      coverageBlacklist: bl
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 2);
      assert(opt['coverage-html'] === covDir);
      assert.deepEqual(opt['coverage-blacklist'], [ bl ]);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageBlacklist: multi', function (done) {
    var covDir = 'report';
    var bl = [ 'vendor', 'specs', 'peridot.php' ];
    this.run({
      coverageHtml: covDir,
      coverageBlacklist: bl
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 2);
      assert(opt['coverage-html'] === covDir);
      assert.deepEqual(opt['coverage-blacklist'], bl);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageWhitelist: single', function (done) {
    var covDir = 'report';
    var wl = 'src';
    this.run({
      coverageHtml: covDir,
      coverageWhitelist: wl
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 2);
      assert(opt['coverage-html'] === covDir);
      assert.deepEqual(opt['coverage-whitelist'], [ wl ]);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageWhitelist: multi', function (done) {
    var covDir = 'report';
    var wl = [ 'src', 'libs', 'hoge.php' ];
    this.run({
      coverageHtml: covDir,
      coverageWhitelist: wl
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 2);
      assert(opt['coverage-html'] === covDir);
      assert.deepEqual(opt['coverage-whitelist'], wl);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('coverageBlacklist & coverageWhitelist', function (done) {
    var covDir = 'report';
    var bl = '.';
    var wl = [ 'src', 'libs' ];
    this.run({
      coverageHtml: covDir,
      coverageBlacklist: bl,
      coverageWhitelist: wl
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 3);
      assert(opt['coverage-html'] === covDir);
      assert.deepEqual(opt['coverage-blacklist'], [ bl ]);
      assert.deepEqual(opt['coverage-whitelist'], wl);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('filter: hoge*.php', function (done) {
    var filter = 'hoge*.php';
    this.run({
      filter: filter
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 1);
      assert(opt.grep === filter);
      assert(! envBootStrap);
      done();
    }).bind(this));
  });

  it('configurationFile: /foo/bar/baz/config.php', function (done) {
    var conf = '/foo/bar/baz/config.php';
    this.run({
      configurationFile: conf
    }, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0);
      assert(envBootStrap === conf);
      done();
    }).bind(this));
  });

  it('default configuration exists', function (done) {
    var defaultConf = this.makeAbsPath('./peridot.php');
    fs.writeFileSync(defaultConf, '');
    this.run({}, (function (exec, opt, envBootStrap) {
      this.check(exec, opt, 0);
      assert(envBootStrap === defaultConf);
      fs.unlink(defaultConf, done);
    }).bind(this));
  });
});
