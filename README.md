# adddep
CLI for adding deps to a npm module. *Based on npm-add.*

# Install
Install globally
```
$ npm install adddep -g
```

# Adding modules

Add the latest verison of an npm package
```
$ adddep jade
```
Then install
```
$ npm install
```

Add multiple packages
```
$ adddep jade socket.io
```

Specify version

Prefix *@* in order to force a version, otherwise the latest version is used. When specifying a version, mind the *v* prefixing the semver expression.

```
$ adddep @jadev0.30.0
```

```
$ adddep '@jadev0.30.0' '@socket.iov0.30.0'
```

Both
```
$ addep express '@socket.iov0.9.14'
```

Add and install
```
$ adddep express stylus async --install
```
or
```
$ adddep express stylus async -i
```

# Removing modules
```
$ adddep -express -stylus
```

Mixed usage

```
$ adddep -express @jadev0.30.0
```

# Bumping a module version
`adddep` provides a function which allows bumping the module version.

```
$ adddep -b 1.0.0
```

The expressions will automatically be expanded: 1 - 1.0.0; 1.1 - 1.1.0.