'use strict';

var fs = require('fs');
var path = require('path');
var grunt = require('grunt/lib/grunt.js');
var _ = grunt.utils._;


var util = {

	/**
	 * Transform globbed config values into lists of files
	 * @param {Array|String} arr
	 */
	expand: function(arr) {
		arr = arr || [];
		var files = [];

		if (_.isString(arr)) {
			arr = [arr];
		}

		arr.forEach(function(val) {
			files = files.concat(grunt.file.expandFiles(val));
		});

		return _.uniq(files);
	},


	fileToModuleName: function(filePath, rjsconfig) {
		var baseUrl = rjsconfig.baseUrl;
		var absolutePath = filePath;

		//console.log('');
		//console.log(absolutePath);

		//passed a relative path
		if (!fs.existsSync(filePath)) {
			absolutePath = path.resolve(process.cwd() + '/' + filePath);
		}

		var baseDirectory = path.resolve(process.cwd() + '/' + baseUrl);
		//console.log(baseDirectory + ' , ' + absolutePath);
		var relativePath = path.relative(baseDirectory, absolutePath);

		//console.log(relativePath);

		//combine all path transformation operations together
		var paths = rjsconfig.paths || [];
		var packages = rjsconfig.packages || [];
		var transforms = _.map(paths, function(val, key) {
			return {
				from: val,
				to: key
			};
		}).concat(packages.map(function(pkg) {
			return {
				from: pkg.location,
				to: pkg.name
			};
		}));

		//console.log(relativePath);

		_.chain(transforms)
			.sortBy(function(obj) {
				//transform in order from most complex to simplest
				return -1 * obj.from.length;
			})
			.every(function(obj) {
				if (relativePath.search(obj.from) !== -1) {
					relativePath = relativePath.replace(obj.from, obj.to);
					return false;
				}
				return true;
			});


		//console.log(relativePath);

		return relativePath.replace('.js', '');
	}

};


module.exports = util;
