const
	LIB = 'bower_components',
	JS = 'static/js';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
	  pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				sourceMap: true,
				sourceMapName : 'static/js/app.es6.js.map',
				sourceMapRootpath : '/js',
			},
			app : {
				src: ['static/src/**/*.js'],
				dest: 'static/js/app.es6.js'
			},
			css : {
				src: ['static/css/**/*.js','!static/css/all.css'],
				dest: 'static/css/all.css'
			},
		},
		babel: {
			options: {
				sourceMap: true,
				sourceMapName : 'static/js/app.js.map',
				sourceMapUrl : '/js/app.js.map',
				presets: ['es2015']
			},
			dist: {
				files: {
					'static/app.js': 'static/app.es6.js'
				}
			}
		},
		copy : {
			native : {
				files : [
					{src:'static/js/app.es6.js', dest:'native/www/js/app.es6.js'},
					{src:'static/js/ext.min.js', dest:'native/www/js/ext.min.js'},
					{src:'static/css/all.css', dest:'native/www/css/all.css'},
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
				files: ['static/src/**/*.js'],
				tasks: ['concat:app'],
				options: {
					spawn: false,
				},
			},
			native: {
				files: [
					'static/js/app.es6.js',
					'static/js/ext.min.js'
				],
				tasks: ['copy:native']
			}
		},
		clean: []
	});

	grunt.registerTask('default', ['concat','uglify','copy']);
};
