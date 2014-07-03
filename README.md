# adddep
CLI for adding deps to a npm module. *Based on npm-add.*

# Install
Install globally
```
$ npm install adddep -g
```

# Usage
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

```
$ adddep 'jade 0.30.0'
```

```
$ adddep 'jade 0.30.0' 'socket.io 0.9.14'
```

Both
```
$ addep express 'socket.io 0.9.14'
```

Add and install
```
$ adddep express stylus async --install
```
or
```
$ adddep express stylus async -i
```
