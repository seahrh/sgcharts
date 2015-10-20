// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var del = require('del');

var bases = {
    'pkgs' : 'node_modules/',
    'dist' : 'src/main/webapp/',
    'app' : 'src/main/frontend/'
};

var paths = {
    html : ['pages/**/*.html'],
    scripts : ['scripts/**/*.js'],
    styles : ['styles/**/*.css'],
    images : ['images/**/*.{jpg,png,gif,svg}']
};

// Build Production Files, the Default Task

gulp.task('default', function(cb) {

    runSequence('lint', ['scripts', 'images', 'styles', 'html'], cb);
});

// Lint JavaScript
// Fail task if lint throws errors

gulp.task('lint', function() {
    return gulp.src(['gulpfile.js', bases.app + paths.scripts, '!**/ext/*']).pipe($.jshint()).pipe($.jshint.reporter('jshint-stylish')).pipe($.jshint.reporter('fail'));

    // Handling error after $.jshint.reporter('fail')
    // does not stop build on error
});

gulp.task('clean', ['clean:scripts', 'clean:styles', 'clean:images', 'clean:html'], function() {
    // Task group - do nothing in body
});

gulp.task('clean:scripts', function(cb) {
    del([bases.dist + 'scripts'], cb);
});

gulp.task('clean:styles', function(cb) {
    del([bases.dist + 'styles'], cb);
});

gulp.task('clean:images', function(cb) {
    del([bases.dist + 'images'], cb);
});

gulp.task('clean:html', function(cb) {
    del([bases.dist + 'WEB-INF/pages'], cb);
});

// Clean Vendor Directory

gulp.task('clean:vendor', function(cb) {
    del([bases.dist + 'vendor'], cb);
});

gulp.task('images', ['clean:images'], function() {
    return gulp.src(paths.images, {
        cwd : bases.app
    }).pipe(gulp.dest(bases.dist + 'images'));
});

gulp.task('styles', ['clean:styles'], function(cb) {
    
    // Style tasks have no deps on each other, so run them concurrently.
    
    runSequence(['styles:site', 'styles:hawker'], cb);
});

gulp.task('styles:site', function() {
    return gulp.src('styles/site/*.css', {
        cwd : bases.app
    }).pipe($.concat('site.all.css')).pipe($.minifyCss()).pipe($.rename('site.min.css')).pipe(gulp.dest(bases.dist + 'styles'));
});

gulp.task('styles:hawker', function() {
    return gulp.src(['styles/site/*.css', 'styles/page/hawker.css'], {
        cwd : bases.app
    }).pipe($.concat('hawker.all.css')).pipe($.minifyCss()).pipe($.rename('hawker.min.css')).pipe(gulp.dest(bases.dist + 'styles'));
});

gulp.task('scripts:ext', function() {
    return gulp.src(['*.js'], {
        cwd : bases.app + 'scripts/ext'
    }).pipe(gulp.dest(bases.dist + 'scripts'));
});

gulp.task('scripts:index', function() {
    var page, srcs;
    page = 'index';
    srcs = ['page/' + page + '.js'];
    return pageScript(srcs, page);
});

gulp.task('scripts:hawker', function() {
    var page, srcs;
    page = 'hawker';
    srcs = ['page/' + page + '.js'];
    return pageScript(srcs, page);
});

gulp.task('scripts', ['clean:scripts'], function(cb) {
    
    // No dependencies between scripts, so build all concurrently
    
    runSequence(['scripts:ext', 'scripts:index', 'scripts:hawker'], cb);
});

function pageScript(srcs, page) {

    var CORE, FILE_EXT, filename;

    FILE_EXT = '.min.js';
    filename = page + FILE_EXT;

    // Core modules: order of concatenation
    // Base and Util modules must be loaded first

    CORE = ['app/base.js', 'app/time.js', 'app/log.js'];

    return gulp.src(CORE.concat(srcs), {
        cwd : bases.app + 'scripts'
    }).pipe($.concat(filename)).pipe($.uglify()).pipe(gulp.dest(bases.dist + 'scripts'));
}

// Copies html into the war dir

gulp.task('html', ['clean:html'], function() {
    return gulp.src(paths.html, {
        cwd : bases.app
    }).pipe(gulp.dest(bases.dist + 'WEB-INF/pages'));
});

gulp.task('watch', function() {
    var watcher;

    watcher = gulp.watch([bases.app + paths.scripts], []);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');

        runSequence('lint', 'scripts', 'reload');
    });

    // TODO htmlmin before reload

    watcher = gulp.watch([bases.app + paths.html], []);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        runSequence('html', 'reload');
    });

    watcher = gulp.watch([bases.app + paths.styles], []);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        runSequence('styles', 'reload');
    });

    // TODO Add image watching when imagemin is implemented
    //gulp.watch([bases.app + paths.images], ['images']);
});

// Reload webapp when watched files are changed

gulp.task('reload', $.shell.task(['mvn war:war']));

gulp.task('update:bootstrap', function() {
    return gulp.src(['dist/**', '!**/*.map'], {
        cwd : bases.pkgs + 'bootstrap'
    }).pipe(gulp.dest(bases.dist + 'vendor/bootstrap'));
});

gulp.task('update:moment', function() {
    return gulp.src(['min/*.min.js'], {
        cwd : bases.pkgs + 'moment'
    }).pipe(gulp.dest(bases.dist + 'vendor/moment'));
});

gulp.task('update:numeral', function() {
    return gulp.src(['min/*.min.js'], {
        cwd : bases.pkgs + 'numeral'
    }).pipe(gulp.dest(bases.dist + 'vendor/numeral'));
});

gulp.task('update', function(cb) {
    runSequence('clean:vendor', ['update:bootstrap', 'update:moment', 'update:numeral'], cb);
});

function error(err) {

    err.showStack = true;
    $.util.log($.util.colors.yellow(err));
    $.util.beep();

    // Signal 'end' event so that gulp watch will not break

    this.emit('end');
}