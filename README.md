# swint-pipe

[![Greenkeeper badge](https://badges.greenkeeper.io/Knowre-Dev/swint-pipe.svg)](https://greenkeeper.io/)
Pipeline logic flow for Swint

**Warning: This is not the final draft yet, so do not use this until its official version is launched**

## Installation
```sh
$ npm install --save swint-pipe
```

## Edge
* Atomic task(can be synchronous or asynchronous) defined by function.
* Usage
```javascript
var edge1 = Pipe.Edge(function(system, input, output) {
		db.fetch({
			// ...
		}, function(err, res) {
			output(/* ... */);
		});
	}); // asynchronous task

var edge2 = Pipe.Edge(function(system, input) {
		return input * 2;
	}); // synchronous task

edge1.input(1); // When edge is the input of whole system, the data flows to the `input` of the main function.
edge2.output(system, 'edge2'); // When edge is the output of whole system, the data flows to `system.out()`.
```

## System
* Defines the data flow using `connect()` and `branch()`.
* Handles the error using `error()`.
* Usage
```javascript
var system = Pipe.System({
		foo: 'bar' // Global variable throughout the system
	});

system.connect(edge1, edge2); // `edge2` will wait for `edge1` to be finished
system.connect(edge2, [edge3, edge4]); // `edge3` and `edge4` will be fired right after `edge2` is finished
system.connect([edge3, edge4], edge5); // `edge5` will wait for both `edge3` and `edge4` to be finished
system.connect(edge5, edge6, function(before, after) {
	after(before * 2);
}); // can morph the pipelined data on connection
system.branch(edge6, [edge7, edge8, edge9], function(before, after) {
	switch(before.type) {
		case 'A':
			after(0, 'type A'); // `'type A'` will be passed to `edge7`(`0`th edge on the array), while `edge8` and `edge9` outputs `undefined`.
			break;
		case 'B':
			after(1, 'type B');
			break;
		case 'C':
			after(2, 'type C');
			break;
	}
}); // can branch between edges

system.end(function(output) {
	// ...
}); // executed when the whole system is ended

var edge1 = Pipe.Edge(function(system, input, output) {
		db.fetch({
			// ...
		}, function(err, res) {
			if(err) {
				system.throw('MyError', 'something happened'); // throws error to the system
				return;
			}
			// ...
		});
	});
system.error(function(type, err) {
	// handling the thrown error
});

system.start(); // actually starts the system
```
