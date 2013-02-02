module.exports = function(grunt) {
	'use strict';

	var path = require('path');
	//var fs = require('fs');
	var _ = grunt.utils._;
	var jade = require('jade');
	//var handlebars = require('handlebars');
	var util = require('./util.js');

	var testDir = path.resolve(process.cwd() + '/test');
	var specDir = path.resolve(testDir + '/unit');
	//var specTplPath = path.resolve(__dirname + '/tpl/spec.hbs');
	var testRunner = path.resolve(__dirname + '/tpl/runner.jade');


	//var specTpl;

/*
 *    var _generateFailing = function(src, config) {
 *        var moduleList = [];
 *
 *        src.forEach(function(file) {
 *            var module = util.fileToModuleName(file, config);
 *            moduleList.push(module);
 *
 *            file = specDir + '/' + module + '.js';
 *            if (fs.existsSync(file)) {
 *                return true;
 *            }
 *
 *            var name = module.split('/').pop();
 *
 *            specTpl = specTpl || handlebars.compile(grunt.file.read(specTplPath, 'utf-8').toString());
 *            var data = specTpl({module: module, name: name});
 *            grunt.file.write(file, data, 'utf-8');
 *        });
 *
 *        return moduleList;
 *    };
 */


	var _generateRunner = function(mode, config, modules) {
		config = _.clone(config);
		config.baseUrl = path.relative(testDir, config.baseUrl);

		/*
		 *modules = modules.map(function(file) {
		 *    console.log(file);
		 *    return util.fileToModuleName(file, config);
		 *});
		 */

		modules = modules.map(function(mod) {
			return path.relative(testDir, path.resolve(process.cwd() + '/' + mod));
		});

		var styles;
		var scripts;

		switch (mode) {
			case 'jasmine':
				styles = ['lib/jasmine.css'];
				scripts = [
					'lib/jasmine.js',
					'lib/jasmine-html.js'
				];
				break;
			case 'qunit':
				styles = ['lib/qunit-1.10.0.css'];
				scripts = ['lib/qunit-1.10.0.js'];
				break;
		}

		scripts = scripts.concat(['lib/require.js']);

		styles = styles.map(function(s) {
			return path.relative(testDir, path.resolve(__dirname + '/' + s));
		});

		scripts = scripts.map(function(s) {
			return path.relative(testDir, path.resolve(__dirname + '/' + s));
		});

		var tpl = grunt.file.read(testRunner, 'utf-8');
		tpl = jade.compile(tpl, {filename: testRunner, pretty: true});
		var data = tpl({mode: mode, styles: styles, scripts: scripts, rjsconfig: JSON.stringify(config, false, 4), modules: JSON.stringify(modules, false, 4)});
		var outPath = testDir + '/runner.html';
		grunt.file.write(outPath, data, 'utf-8');

		return outPath;
	};


	grunt.registerTask('test', 'Generates QUnit/jasmine html and optionally runs QUnit/jasmine', function() {
		var config = grunt.config.get(this.name);
		var rjsconfig = grunt.config.get('requirejs');

		config.include = util.expand(config.include);
		config.exclude = util.expand(config.exclude);

		var modules = _.difference(config.include, config.exclude);

		//var modules = _generateFailing(config.include, rjsconfig);
		var file = _generateRunner(config.mode, rjsconfig, modules);

		if (!config.run) {
			return;
		}

		var serverPath = 'http://localhost:';
		serverPath += grunt.config.get('server').port + '/';
		serverPath += path.relative(grunt.config.get('server').base, path.resolve(file));

		grunt.config.set('qunit', {
			test: serverPath
		});

		grunt.task.run(['server', 'qunit:test']);
	});
};
