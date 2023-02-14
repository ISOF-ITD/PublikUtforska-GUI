/*
*	Task Automation to make my life easier.
*	Author: Jean-Pierre Sierens
*	===========================================================================
*/
 
// declarations, dependencies
// ----------------------------------------------------------------------------
import gulp from 'gulp';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import log from 'fancy-log';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import buffer from 'vinyl-buffer';
import less from 'gulp-less';
import minifyCSS from 'gulp-csso';
import path from 'path';
import gulpif from 'gulp-if';
import clean from 'gulp-clean';
import rename from 'gulp-rename';

// use rev to add a hash to the file name, so that the browser will always load the latest version of the file
import rev from 'gulp-rev';
import revRewrite from 'gulp-rev-rewrite';

import { readFileSync } from 'fs';


let production = false;
 
// Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('clean', () => {
	return gulp.src(['./www/js', './www/css', './www/fonts', './www/rev-manifest.json', './www/index.html'], {read: false, allowEmpty: true})
		.pipe(clean({force: true}));
});

gulp.task('scripts', () => 
{	
	// Browserify will bundle all our js files together in to one and will let
	// us use modules in the front end.
	console.log("production", production)
  	return browserify({
    	entries: './scripts/app.js',
    	debug: !production
  		})
  		// transform ES6 and JSX to ES5 with babelify
	  	.transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"]})
	    .bundle()
	    .on('error', production ? log : swallowError)
	    .pipe(source('app.js'))
    	.pipe(buffer())
        .pipe(gulpif(production, uglify()))
	    // .pipe(gulp.dest('./www/js/'))
		// add a hash to the file name, so that the browser will always load the latest version of the file
		.pipe(rev())
		.pipe(gulp.dest('./www/js/'))
		// create a manifest file that will contain the mapping between the original file name and the hashed file name
		.pipe(rev.manifest('www/rev-manifest.json', {base: './www', merge: true}))
		.pipe(gulp.dest('./www/'));
});

gulp.task('less', function(){
	console.log("production", production)
    return gulp.src('./less/style-basic.less')
        .pipe(less())
        .pipe(gulpif(production, minifyCSS({keepBreaks:true})))
		// save the file in the www/css folder and change the name to style.css
		.pipe(rename('style.css'))
		// .pipe(gulp.dest('./www/css/'))
		// add a hash to the file name, so that the browser will always load the latest version of the file
		.pipe(rev())
		.pipe(gulp.dest('./www/css/'))
		// add a line to the already existing manifest file that will contain the mapping between the original file name and the hashed file name
		.pipe(rev.manifest('www/rev-manifest.json', {base: './www', merge: true}))
		.pipe(gulp.dest('./www/'));
});

gulp.task('fonts', function(){
	return gulp.src('./fonts/**.*')
		.pipe(gulp.dest('./www/fonts'));
});
 
gulp.task('watch', function (done) {
	gulp.watch(['./scripts/*.js', './scripts/**/*.js', './ISOF-React-modules/*.js', './ISOF-React-modules/**/*.js'], gulp.series('scripts', 'index-html'));
	gulp.watch(['./less/*.less', './less/**/*.less', './ISOF-React-modules/less/*.less', './ISOF-React-modules/less/**/*.less'], gulp.series('less', 'index-html'));
	done();
});

gulp.task('index-html', function(){
	// replace the references to the old files with the new ones inside www/index.html
	const manifest = readFileSync('./www/rev-manifest.json');
	return gulp.src('./index.html')
		.pipe(revRewrite({manifest}))
		.pipe(gulp.dest('./www'));
});



// Main gulp tasks, available on the terminal
// ----------------------------------------------------------------------------
// When running 'gulp' on the terminal this task will fire.
// It will start watching for changes in every .js file.
// If there's a change, the task 'scripts' defined above will fire.
gulp.task('default', gulp.series(setEnvToDev, 'clean', 'scripts', 'less', 'fonts', 'index-html', 'watch'));

gulp.task('build', gulp.series(setEnvToProd, 'clean', 'scripts', 'less', 'fonts', 'index-html'));
 
// Private Functions
// ----------------------------------------------------------------------------

// source: https://stackoverflow.com/a/23973536
function swallowError(error) {
	// If you want details of the error in the console
	console.log(error.toString())
	this.emit('end')
}

function setEnvToDev(callback){
	production = false;
	callback();
}

function setEnvToProd(callback){
	production = true;
	callback();
}