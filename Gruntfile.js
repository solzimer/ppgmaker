const
	LIB = 'bower_components',
	JS = 'static/js';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
	  pkg: grunt.file.readJSON('package.json'),
		browserify: {
			dist: {
				watch: true,
				keepAlive: true,
				files: {
					'static/ppgmaker.js': []
				}
			}
		},
		concat: {
			options: {
				sourceMap: true,
				sourceMapName : 'static/app.es6.js.map',
			},
			js: {
				src: ['static/js/**/*.js'],
				dest: 'static/app.es6.js'
			}
		},
		babel: {
			options: {
				sourceMap: 'true',
				//inputSourceMap: grunt.file.readJSON('static/app.es6.js.map'),
				presets: ['es2015']
			},
			dist: {
				files: {
					'static/app.js': 'static/app.es6.js'
				}
			}
		},
	  uglify: {
	    options: {
	      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap : true,
				sourceMapName : 'static/ext.min.js.map',
				sourceMapRoot: '/',
	    },
			build: {
				files : {
					'static/ext.min.js' : [
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
			scripts: {
				files: ['static/js/**/*.js'],
				tasks: ['concat'],
				options: {
					spawn: false,
				},
			},
		},
		clean: []
	});

	grunt.registerTask('default', ['concat'/*,'babel'*/,'uglify']);
};
