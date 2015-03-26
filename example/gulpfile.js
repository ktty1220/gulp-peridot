var gulp = require('gulp');
var peridot = require('../index');

gulp.task('test', function() {
  return gulp.src('specs')
  .pipe(peridot({
    dryRun            : false,
    colors            : true,
    stopOnFailure     : false,
    reporter          : 'face',
    //coverageText      : true,
    configurationFile : 'peridot.php'
  }));
});

gulp.task('default', [ 'test' ]);
