#!/usr/bin/env node

var fs = require('fs');
var npm = require('npm');

var self = require("./package.json");

var svr = /^v{0,1}([0-9]+\.{0,1}){1,3}(\-([a-z0-9]+\.{0,1})+){0,1}(\+(build\.{0,1}){0,1}([a-z0-9]+\.{0,1}){0,}){0,1}$/;

// stop npm from polluting the commandline
process.stderr.write = new Function;

var sign = [
		"         ___ ____ __ __",
	   	"        / _ `/ _ \\\\ \\ /",
	   	"        \\_,_/ .__/_\\_\\ ",
	   	"           /_/\n\t\t\033[1mdepadd " + self.version, "\033[0m",
	   	"\tCLI for adding deps to a npm module.",
	].join("\n");

var help = sign + '\n\nUsage: \n\tadddep <packages> [options]\n\nOptions:\n\t-h, --help\tHelp screen\n\t-v, --version\tCurrent version\n\t-i, --install\tinstall packages after adding them';
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

var _install = function () {
	npm.load({}, function(err) {
		npm.commands.install([], function(err, rd) {})
	})
}

var base = process.cwd();

var main = function(deps, install) {
	try {
		var package = JSON.parse(fs.readFileSync(base + "/package.json"));
	} catch(e) {
		exit("Inexistent or malformed package.json.");
	}

	npm.load({}, function(err) {
		var i = 0;

		var _next = function () {
			if ( ++i !== deps.length ) return;

			fs.writeFileSync(base + 'package.json', JSON.stringify(package, null, 2));
			console.log("\n» Updated package.json");
		}

		deps.forEach(function (pck) {
			// wildcard: version will be *
			var wc = pck[pck.length-1] === "*";
			var ver;

			if (wc) {
				pck = pck.slice(0, pck.length-1);
			} else {
				var lI = pck.lastIndexOf("v");
				var sx = pck.slice(lI + 1);

				if (svr.test(sx)) {
					ver = sx;
					pck = pck.slice(0, lI)
				}
			}

			// force: don't check npm - requires wildcard or version
			var fc = pck[0] === "@" && (wc || ver);

			if (fc) pck = pck.slice(1);

			package.dependencies = package.dependencies || [];

			if ( fc ) {
				package.dependencies[pck] = wc ? "*" : ver;

				console.log("» Adding: ", pck + " v" + package.dependencies[pck])

				_next();
			} else {
				npm.commands.show([pck, 'name'], function(err, mod) {
					if (err) console.log("Err:", err);

					// get top-most version
					var version = wc ? "*" : Object.keys(mod)[0];

					ver && console.log(
						"\033[1m« Warning: Specified version " + ver + ", but didn't force it. (use @" + pck + "v" + ver + ")\n" +
						"« Warning: Using upstream " + version + " instead.\033[0m"
					);

					package.dependencies[pck] = version;

					console.log("» Adding: ", pck + " v" + package.dependencies[pck])

					_next();
				});
			}
		});
	});
	if (install == true) _install()

}

var xa = [], xo = [];

argv.forEach(function (v) {
	return v[0] === "-" ? xo.push(v) : xa.push(v);
})

if (require.main === module) {
	var install, stop;

	xo.forEach(function () {
		if ( ~xo.indexOf("-h") || ~xo.indexOf("--help") ) {
			stop = true;
			return exit(help);
		}

		if ( ~xo.indexOf("-v") || ~xo.indexOf("--version") ) {
			stop = true;
			return exit(sign);
		}

		if ( ~xo.indexOf("-i") || ~xo.indexOf("--install") ) {
			install = true;
		}

		if ( xo[0] === "-b" || xo[0] === "-bump" ) {
			if (svr.test(xa[0])) {

			}
		}
	})

	if (!xa.length && !xo.length) {
		exit(help)
	} else {
		console.log(sign)
	}

	!stop && main(xa, install);
}