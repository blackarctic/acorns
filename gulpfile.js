var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var connect = require('gulp-connect');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var jslint = require('gulp-jslint');
var del = require('del');

var prep = function () {

	// prep external libraries
	gulp.src('node_modules/**/*')
	.pipe(gulp.dest('dist/lib'));

	// prep favicon
	gulp.src('src/favicon.ico')
	.pipe(gulp.dest('dist'));

	// prep img
	gulp.src('src/img/**/*')
	.pipe(gulp.dest('dist/img'));

	// prep index.html
	gulp.src('src/index.html')
	.pipe(gulp.dest('dist'));

	// prep app.scss
	gulp.src('src/app.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false
	}))
	.pipe(gulp.dest('dist'));

	// prep store.js
	gulp.src('src/store.js')
	.pipe(jslint())
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(gulp.dest('dist'));

	// prep app.js
	gulp.src('src/app.js')
	.pipe(jslint())
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(gulp.dest('dist'));
}

gulp.task('connect', function() {
	prep();
	connect.server({
		root: 'dist',
		livereload: true
	});
});

gulp.task('change', function () {
	prep();
	gulp.src('./dist/*')
	.pipe(connect.reload());
});

gulp.task('watch', function () {
	gulp.watch(['./src/*'], ['change']);
});

gulp.task('default', ['connect', 'watch']);