var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var prettify = require('gulp-jsbeautifier');
var wrap = require('gulp-wrap');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');

var paths = {
    scripts: [
        'src/sc-embedded-database.module.js',
        'src/sc-embedded-database.factory.js'
    ],
    dist: 'dist'
};

var version = '0.0.4-build';

gulp.task('clean', function () {
    return del([paths.dist]);
});

gulp.task('scripts', function () {
    return gulp.src(paths.scripts)
        .pipe(concat('sc-embedded-database.js'))
        .pipe(wrap({src: 'gulp/wrap.template.iife'}))
        .pipe(prettify({indentSize: 3}))
        .pipe(wrap({src: 'gulp/wrap.template.banner'}, {version: version}))
        .pipe(gulp.dest(paths.dist));
});

// FIXME The gulp-wrap plugin is not compatible with gulp-sourcemaps. Consider using gulp-wrap-js.
gulp.task('scripts.min', function () {
    return gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
        .pipe(concat('sc-embedded-database.min.js'))
        .pipe(wrap({src: 'gulp/wrap.template.iife'}))
        .pipe(uglify())
        .pipe(wrap({src: 'gulp/wrap.template.banner'}, {version: version}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist))
});

gulp.task('dist', ['clean', 'scripts', 'scripts.min']);

gulp.task('default', ['dist']);
