var gulp = require('gulp');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
var del = require('del');

var paths = {
    scripts: [
        'src/sc-embedded-database.module.js',
        'src/sc-embedded-database.factory.js'
    ]
};

gulp.task('clean', function () {
    return del(['dist']);
});

gulp.task('scripts', ['clean'], function () {
    return gulp.src(paths.scripts)
        .pipe(concat('sc-embedded-database.js'))
        .pipe(wrap({src: 'gulp/wrap.template.scripts'}, {version: '0.0.4-build'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts']);
