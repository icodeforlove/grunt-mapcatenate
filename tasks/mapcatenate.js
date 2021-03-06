var fs = require('fs'),
	colors = require('colors'),
	Promise = require('whenplus'),
	PromiseObject = require('promise-object')(Promise);

var Mapcatenate = PromiseObject.create({
	initialize: function ($config, fileInfo) {
		if ($config.srcExtension === undefined) throw new Error('mapcatenate: must specify a srcExtension');
		if ($config.destExtension === undefined) throw new Error('mapcatenate: must specify a destExtension');

		this.srcExtension = $config.srcExtension;
		this.destExtension = $config.destExtension;

		this.ignoreFilesFromMaps = $config.ignoreFilesFromMaps || [];
		this.fileInfo = fileInfo;
	},

	$concat: function ($deferred, fileInfo, config) {
		if (!fileInfo.src[0]) {
			throw new Error('mapcatenate: provided src file for (' + fileInfo.dest + ') doesnt exist!');
		}
		var instance = new Mapcatenate(config, fileInfo);
		instance.concatAndWriteFile().done($deferred.resolve, $deferred.reject);
	},

	regExpEscape: function (string) {
		return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},

	concatAndWriteFile: function ($deferred, $self) {
		Promise.mapUnfulfilled(this.ignoreFilesFromMaps, this.resolveDependenciesFromMap).allLimit(1)
			   .done(function (ignoreFiles) {
			   		var allIgnoreFiles = [];
			   		allIgnoreFiles = allIgnoreFiles.concat.apply(allIgnoreFiles, ignoreFiles);
			   		
			   		$self
			   			.resolveDependencies($self.fileInfo, allIgnoreFiles)
						.then($self.findAndConcatCssFiles)
						.done(function (source) {
							console.log(('Mapcatenated (' + $self.fileInfo.dest + ')').cyan);
							fs.writeFile($self.fileInfo.dest, source, function () {
								$deferred.resolve();
							});
						}, $deferred.reject);
			   });
	},

	resolveDependencies: function ($deferred, $self, fileInfo, ignoreFiles) {
		fs.readFile(fileInfo.src[0], 'utf8', function (error, source) {
			var json = JSON.parse(source);
			
			var files = json.sources.map(function (file) {
					// hack for webpack sources
					file = file.replace(/^webpack:\/\/\//, '');

					// replace file extensions
					file = file.replace(new RegExp($self.regExpEscape($self.srcExtension) + '$'), $self.destExtension);

					return file;
				})
				.filter(function (file) {
					return ignoreFiles.indexOf(file) === -1 && fs.existsSync(file);
				});

			$deferred.resolve(files);
		});
	},

	resolveDependenciesFromMap: function ($deferred, $self, map) {
		fs.readFile(map, 'utf8', function (error, source) {

			if (error) {
				throw new Error('map not found: ' + map);
			}

			var json = JSON.parse(source),
				resolvedFiles = json.sources;

			$deferred.resolve(resolvedFiles.map(function (file) {
				return file;
			}));
		});
	},

	findAndConcatCssFiles: function ($deferred, files) {
		Promise.mapUnfulfilled(files, this.findAndConcatCssFile).allLimit(1).done(function (sources) {
			$deferred.resolve(sources.join('\n').trim());
		});
	},

	findAndConcatCssFile: function ($deferred, file) {
		fs.readFile(file, 'utf8', function (error, data) {
			if (error) {
				$deferred.resolve('');
			} else {
				$deferred.resolve(data);
			}
		});
	}
});

module.exports = function(grunt) {
	var mapcatenateConfig = grunt.config.get('mapcatenate').options;
	
	grunt.registerMultiTask('mapcatenate', 'Concatenate\'s files based on sourcemap sources.', function(target) {
		var callback = this.async(),
			options = this.options();

		Promise.mapUnfulfilled(this.files, [Mapcatenate.concat, options]).allLimit(1).done(callback);
	});
};