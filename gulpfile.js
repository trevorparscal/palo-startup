/*jshint node:true*/
var gulp = require( 'gulp' ),
	jscs = require( 'gulp-jscs' ),
	jshint = require('gulp-jshint');

gulp.task( 'default', function () {
	return gulp.src( './server/*.js' )
		.pipe( jscs() )
		.pipe( jshint() )
		.pipe( jshint.reporter( 'jshint-stylish' ) );
} );
