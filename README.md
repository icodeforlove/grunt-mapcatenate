# grunt-mapcatenate

A grunt task that concatenate's files based on sourcemap sources.

```
	npm install grunt-mapcatenate --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```
	grunt.loadNpmTasks('grunt-mapcatenate');
```

## Uses?

If you have a file structure where you place your CSS files next to your JS components then this is the task for you!

This will allow you to piggyback on top of your JS inheritance resolution, and build your CSS the same way you build your JS.

## Examples

heres the most basic configuration, this tells mapcatenate that in our `index.map` we only care about the paths for the `.js` files and were searching for sibling `.css` files

```javascript
mapcatenate: {
	config: {
		srcExtension: '.js',
		destExtension: '.css'
	},

	index: {
		files: {
			'build/index.css': 'build/index.map'
		}
	}
}
```

there are some scenarios where you have generic components that exist in a global CSS file or something, in that case you can provide maps to ignore all files in

```
mapcatenate: {
	config: {
		srcExtension: '.js',
		destExtension: '.css'
	},

	global: {
		files: {
			'build/global.css': 'build/global.map'
		}
	},

	homepage: {
		config: {
			ignoreFilesFromMaps: ['build/global.map']
		},

		files: {
			'build/index.css': 'build/index.map'
		}
	}
}
```
