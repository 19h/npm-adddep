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
	   	"\tCLI for adding deps to a npm module."
	].join("\n");

var help = sign + [
	"", "",
	"Usage: ",
	"\tadddep <packages> [options]", "", "",
	"Options:",
	"\t-h, --help\tHelp screen",
	"\t-v, --version\tCurrent version",
	"\t-i, --install\tInstall packages after adding them",
	"\t-b, --bump\tUpdate the version of a module (valid semver must be specified)"
].join("\n");

var version = self.version;

if (process.argv[0] == 'node') {
	argv = process.argv.slice(2);
} else {
	argv = process.argv;
}

var log = function () {
	arguments = Array.prototype.slice.call(arguments);
	var bold = arguments[arguments.length - 1] === -0xA0; if(bold)arguments=arguments.slice(0, arguments.length-1);
	process.stdout.write.call(process.stdout, (bold?"\033[1m":"")+(arguments.length ? arguments.concat(["\n"]) : ["\n"]).join(" ")+(bold?"\033[0m":""));
};

console.log = new Function;

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

// semver expand
var sve = function (ver) {
	var vsl = String(ver).split(".").length;

	// 1 => 1.0.0
	if ( vsl === 1 ) {
		ver = ver + ".0.0";
	} else
	// 1.1 => 1.1.0
	if ( vsl === 2 ) {
		ver = ver + ".0";
	}

	return ver;
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

			fs.writeFileSync(base + '/package.json', JSON.stringify(package, null, "\t"));
			log("\n» Updated package.json\n");
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
					ver = sve(sx);
					pck = pck.slice(0, lI)
				}
			}

			// force: don't check npm - requires wildcard or version
			var fc = pck[0] === "@" && (wc || ver);

			if (fc) pck = pck.slice(1);

			var del = pck[0] === "-";

			if (del) pck = pck.slice(1);

			package.dependencies = package.dependencies || {};

			if ( package.dependencies instanceof Array )
				package.dependencies = {};

			console.log("fc", fc, "wc", wc, "ver", ver, "del", "del")

			if (del) {
				if (package.dependencies[pck]) {
					delete package.dependencies[pck];

					log("» Deleting: " + pck);
				} else {
					return log("» Couldn't locate " + pck + " in package.. ignoring.", -0xA0);
				}

				return _next();
			}

			if ( fc ) {
				package.dependencies[pck] = wc ? "*" : ver;

				log("» Adding: ", pck + " v" + package.dependencies[pck])

				return _next();
			} else {
				npm.commands.show([pck, 'name'], function(err, mod) {
					if (err) return log("« Warning: couldn't locate " + pck + ".. omitting it.", -0xA0), _next();

					// get top-most version
					var version = wc ? "*" : Object.keys(mod)[0];

					ver && log(
						"« Warning: Specified version " + ver + ", but didn't force it. (use @" + pck + "v" + ver + ")\n" +
						"« Warning: Using upstream " + version + " instead."
					, -0xA0);

					package.dependencies[pck] = version;

					log("» Adding: ", pck + " v" + package.dependencies[pck])

					return _next();
				});
			}
		});
	});
	if (install == true) _install()

}

var xa = [], xo = [];

var ops = [
	"-h", "--help",
	"-v", "--version",
	"-i", "--install",
	"-b", "--bump"
]

argv.forEach(function (v) {
	return ~ops.indexOf(v) ? xo.push(v) : xa.push(v);
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
			log(sign);

			if (svr.test(xa[0])) {
				var ver = sve(xa[0]);

				try {
					var package = JSON.parse(fs.readFileSync(base + "/package.json"));
				} catch(e) {
					return exit("\n« Warning: Bump failed, inexistent or malformed package.json.");
				}

				if ( package.version === ver ) {
					log(
						"\n« Bumping: Version didn't change, aborting.\n"
					, -0xA0);

					return process.reallyExit();
				} else {
					log(
						"\n« Bumping: Updating from " + package.version + " to " + ver
					, -0xA0);

					package.version = ver;

					fs.writeFileSync(base + '/package.json', JSON.stringify(package, null, "\t"));
					log("\n» Updated package.json");

					return process.reallyExit();
				}

			} else {
				log(
					"\n\t« Warning: Trying to bump version but specified version is invalid. (" + (xa[0] ? xa[0] : "none given") + ")\n"
				, -0xA0);

				return process.reallyExit();
			}
		}
	})

	if (!xa.length && !xo.length) {
		exit(help)
	} else {
		log(sign + "\n")
	}

	!stop && main(xa, install);
}