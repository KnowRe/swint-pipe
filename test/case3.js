var assert = require('assert'),
	Pipe = require('../lib'),
	swintHelper = require('swint-helper');

global.swintVar.printLevel = 5;

/*
	Scenario: Order of execution
	1->2->[3,(4-><5,6>)]->7
*/

describe('Order of execution', function() {
	var order = [];

	before(function(done) {
		var edge1 = Pipe.Edge(function(system, input, output) {
				order.push(1);
				output(null);
			});

		var edge2 = Pipe.Edge(function(system, input, output) {
				order.push(2);
				output(null);
			});

		var edge3 = Pipe.Edge(function(system, input, output) {
				setTimeout(function() {
					order.push(3);
					output(null);
				}, 500);
			});

		var edge4 = Pipe.Edge(function(system, input, output) {
				order.push(4);
				output(1);
			});

		var edge5 = Pipe.Edge(function(system, input, output) {
				order.push(5);
				output(null);
			});

		var edge6 = Pipe.Edge(function(system, input, output) {
				order.push(6);
				output(null);
			});

		var edge7 = Pipe.Edge(function(system, input, output) {
				order.push(7);
				output(null);
			});

		var system1 = Pipe.System();

		system1.connect(edge1, edge2);
		system1.connect(edge2, [edge3, edge4]);
		system1.branch(edge4, [edge5, edge6], function(before, after) {
			after(before === 0 ? 0 : 1, {});
		});
		system1.connect([edge3, edge5, edge6], edge7);

		edge1.input(null);
		edge7.output(system1);

		system1.end(function(output) {
			done();
		});
		system1.error(function(type, err) {
		});
		system1.start();
	});

	it('Order of execution', function() {
		assert.deepEqual(order, [1, 2, 4, 6, 3, 7]);
	});
});
