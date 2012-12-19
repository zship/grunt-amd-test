module.exports = function(grunt) {
	'use strict';

	var path = require('path');
	var fs = require('fs');
	var _ = grunt.utils._;
	var jade = require('jade');
	var handlebars = require('handlebars');
	var util = require('./util.js');

	var testDir = path.resolve(process.cwd() + '/test');
	var specDir = path.resolve(testDir + '/spec');
	var specTplPath = path.resolve(__dirname + '/tpl/spec.hbs');
	var testRunner = path.resolve(__dirname + '/tpl/runner.jade');


	var specTpl;

	var _generateFailing = function(src, config) {
		var moduleList = [];

		util.expand(src).forEach(function(file) {
			var module = util.fileToModuleName(file, config);
			moduleList.push(module);

			file = specDir + '/' + module + '.js';
			if (fs.existsSync(file)) {
				return true;
			}

			var name = module.split('/').pop();

			specTpl = specTpl || handlebars.compile(grunt.file.read(specTplPath, 'utf-8').toString());
			var data = specTpl({module: module, name: name});
			grunt.file.write(file, data, 'utf-8');
		});

		return moduleList;
	};


	var _generateRunner = function(config, modules) {
		config = _.clone(config);
		config.baseUrl = path.relative(testDir, config.baseUrl);

		modules = modules.map(function(mod) {
			return path.relative(path.resolve(testDir + '/' + config.baseUrl), specDir) + '/' + mod;
		});

		var tpl = grunt.file.read(testRunner, 'utf-8');
		tpl = jade.compile(tpl, {filename: testRunner, pretty: true});
		var data = tpl({rjsconfig: JSON.stringify(config, false, 4), modules: JSON.stringify(modules, false, 4)});
		var outPath = testDir + '/runner.html';
		grunt.file.write(outPath, data, 'utf-8');

		util.expand(path.resolve(__dirname + '/lib') + '/**').forEach(function(file) {
			grunt.file.copy(file, testDir + '/lib/' + path.basename(file));
		});

		return outPath;
	};


	grunt.registerTask('test', 'Generates QUnit html and optionally runs QUnit', function() {
		var config = grunt.config.get(this.name);
		var rjsconfig = grunt.config.get('requirejs');

		var modules = _generateFailing(config.generateFailing, rjsconfig);
		var file = _generateRunner(rjsconfig, modules);

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
