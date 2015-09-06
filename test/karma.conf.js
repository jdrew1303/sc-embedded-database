module.exports = function (config) {

    config.set({

        basePath: '../',

        frameworks: ['jasmine'],

        files: [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'src/sc-embedded-database.module.js',
            'src/sc-embedded-database.factory.js',
            'test/spec/**/*.js'
        ],

        exclude: [],

        browsers: [
            'PhantomJS',
            'Chrome'
        ],

        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-jasmine'
        ],

        logLevel: config.LOG_INFO
    });
};
