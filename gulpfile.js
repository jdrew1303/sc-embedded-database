var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var prettify = require('gulp-jsbeautifier');
var wrap = require('gulp-wrap');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var Server = require('karma').Server;

var paths = {
    scripts: [
        'src/sc-embedded-database.module.js',
        'src/sc-embedded-database.factory.js'
    ],
    dist: 'dist'
};

var version = '0.0.6-build';

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

gulp.task('copy.package.config', function () {
    return gulp.src(['package.json', 'bower.json', 'index.js'])
        .pipe(gulp.dest(paths.dist));
});

gulp.task('tests', function (done) {
    new Server({
        configFile: __dirname + '/test/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('dist', ['clean', 'copy.package.config', 'scripts', 'scripts.min']);

gulp.task('default', ['tests']);
