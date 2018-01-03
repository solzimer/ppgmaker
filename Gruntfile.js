const
	LIB = 'bower_components',
	JS = 'static/js';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
	  pkg: grunt.file.readJSON('package.json'),

		concat: {
			app : {
				options: {
					sourceMap: true,
					sourceMapName : 'static/js/app.es6.js.map',
					sourceMapRootpath : '/js',
				},
				src: ['static/src/**/*.js'],
				dest: 'static/js/app.es6.js'
			},
			css : {	src: ['static/css/**/*.js','!static/css/all.css'], dest: 'static/css/all.css'},
		},

		copy : {
			srcnative : {
				files : [
					{expand: true, cwd: 'static/js', src: '*.js', dest: 'native/www/js/'},
					{expand: true, cwd: 'static/views', src: '*.html', dest: 'native/www/views/'},
					{expand: true, cwd: 'static/css', src: '*.css', dest: 'native/www/css/'},
					{expand: true, cwd: 'static/fonts', src: '*', dest: 'native/www/fonts/'},
					{expand: true, cwd: 'static/data', src: '*', dest: 'native/www/data/'},
					{expand: true, cwd: 'bower_components', src: "**/*.css", dest: 'native/www/lib/'}
				]
			},
			imgnative : {
				files : [
					{expand: true, cwd: 'static/img', src: '**/*.png', dest: 'native/www/img/'},
					{expand: true, cwd: 'static/img', src: '**/*.jpg', dest: 'native/www/img/'},
				]
			}
		},

	  uglify: {
	    options: {
	      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap : true,
				sourceMapName : 'static/js/ext.min.js.map',
				sourceMapRoot: '/',
	    },
			build: {
				files : {
					'static/js/ext.min.js' : [
						`${LIB}/TouchEmulator/touch-emulator.js`,
						`${LIB}/jquery/dist/jquery.js`,
						`${LIB}/hammerjs/hammer.js`,
						`${LIB}/bootstrap/dist/js/bootstrap.js`,
						`${LIB}/slick-carousel/slick/slick.min.js`,
						`${LIB}/angular/angular.js`,
						`${LIB}/angular-ui-router/release/angular-ui-router.js`,
						`${LIB}/angular-bootstrap/ui-bootstrap-tpls.js`,
						`${LIB}/pouchdb/dist/pouchdb.js`,
						`${LIB}/pouchdb/dist/pouchdb.find.js`,
						`${LIB}/html2canvas/build/html2canvas.js`,
					]
				}
    	}
	  },

		watch: {
			app: {
				files: ['static/src/**/*.js','static/views/**/*.html'],
				tasks: ['run:templates','concat:app'],
				options: {spawn: false,},
			},
			native: {
				files: ['static/js/app.es6.js','static/js/ext.min.js','static/views/*.html'],
				tasks: ['copy:srcnative']
			}
		},

		run: {
			options: {},
			server: {
				cmd: 'node', args: ['index.js']
			},
			templates : {
				options : {cwd:"script"},
				cmd: 'node', args: ['compileviews.js']
			}
		},

		concurrent: {
			options: {
				logConcurrentOutput: true
			},
			app: ['watch:app', 'watch:native', 'run:server'],
		},

		clean: []
	});

	grunt.registerTask('build', ['run:templates','concat','uglify','copy']);
	grunt.registerTask('default', ['run:templates','concat','uglify','copy']);
	grunt.registerTask('start', ['concurrent:app']);
};
