var gulp = require('gulp');
var runSequence = require('run-sequence');
require('aws-lambda-gulp-tasks')(gulp);

var gulp = require('gulp');
var mocha = require('gulp-mocha');


gulp.task('test', function() {
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({reporter: 'spec'}))
    .once('error', () => {
      process.exit(1);
    })
    .once('end', () => {
      process.exit();
    });
});

gulp.task('deploy', function(callback) {
  return runSequence(
    ['clean'], ['js', 'node-mods'],
    // ADD ANY FILE YOU WANT TO THE dist/ folder 
    ['zip'], ['upload'],
    callback
  );
});
