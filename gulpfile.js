var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');

var mochaOpts = {
  reporter: 'mochawesome'
};

var istanbulThresholdOpts = {
  thresholds: {
    global: 90
  }
};

gulp.task('lint', function () {
  return gulp.src(['./*.js', 'lib/**/*.js', 'test/**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

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

gulp.task('default', ['lint', 'test']);
