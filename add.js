#!/usr/bin/env node

var fs = require('fs');
var npm = require('npm');

var self = require("./package.json");

// stop npm from polluting the commandline
process.stderr.write = new Function;

console.log=function(a, b){
	process.stdout.write(a, b);
	throw 1
};

var sign = [
		"         ___ ____ __ __",
	   	"        / _ `/ _ \\\\ \\ /",
	   	"        \\_,_/ .__/_\\_\\ ",
	   	"           /_/\n\t\t\033[1mdepadd " + self.version, "\033[0m",
	   	"\tCLI for adding deps to a npm module.",
	   	"", ""
	].join("\n");

var help = sign + 'Usage: \n\tadddep <packages> [options]\n\nOptions:\n\t-h, --help\tHelp screen\n\t-v, --version\tCurrent version\n\t-i, --install\tinstall packages after adding them';
var version = self.version;

if (process.argv[0] == 'node') {
	argv = process.argv.slice(2);
} else {
	argv = process.argv;
}

var exit = function (message, error) {
	process.stdout.write(message + "\n\n");
	err = error || null;
	process.exit(err);
}

var recursiveGetProperty = function (obj, lookup, callback) {
	for (property in obj) {
		if (property == lookup) {
			callback(obj[property]);
		} else if (obj[property] instanceof Object) {
			recursiveGetProperty(obj[property], lookup, callback);
		}
	}
}

var _install = function () {
	npm.load({}, function(err) {
		npm.commands.install([], function(err, rd) {})
	})
}

var base = process.cwd();

var main = function(dependencies, install) {
	npm.load({}, function(err) {
		for (i = 0; i < dependencies.length; i += 1) {
			var package = dependencies[i][0];

			this.version1 = dependencies[i][1];

			(function(version1, package) {
				npm.commands.show([package, 'name'], function(err, rawData) {
					if (err) console.log(err);
					if (rawData) {
						if (typeof version1 == 'undefined') {
							version1 = Object.keys(rawData)[0];
						}

						recursiveGetProperty(rawData, 'name', function(obj) {
							try {
								rawData = require(base + "/package.json");
							} catch(e) {
								exit("There's no package.json!")
							}

							rawData.dependencies = rawData.dependencies || [];
							rawData.dependencies[obj] = version1;

							fs.writeFileSync(base + 'package.json', JSON.stringify(rawData, null, 2));
						});

					}
				});
			})(this.version1, package)
		}
	});
	if (install == true) _install()

}

var xa = [], xo = [];

argv.forEach(function (v) {
	return v[0] === "-" ? xo.push(v) : xa.push(v);
})

if (require.main === module) {
	var install;

	xo.forEach(function () {
		if ( ~xo.indexOf("-h") || ~xo.indexOf("--help") ) {
			return exit(help);
		}

		if ( ~xo.indexOf("-v") || ~xo.indexOf("--version") ) {
			return exit(version);
		}

		if ( ~xo.indexOf("-i") || ~xo.indexOf("--install") ) {
			install = true;
		}
	})

	if (!xa.length && !xo.length) {
		exit(help)
	} else {
		console.log(sign)
	}

	main(xa, install);
}