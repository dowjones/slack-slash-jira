var gulp     = require('gulp'),
    mocha    = require('gulp-mocha'),
    istanbul = require('gulp-istanbul');

var mochaOpts = {
  reporter: 'mochawesome'
};

var istanbulThresholdOpts = {
  thresholds: {
    global: 90
  }
};

gulp.task('test', function (cb) {
  gulp.src(['lib/**/*.js', 'index.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha(mochaOpts))
        .pipe(istanbul.writeReports())
        .pipe(istanbul.enforceThresholds(istanbulThresholdOpts))
        .on('end', cb);
    });
});

gulp.task('default', ['test']);