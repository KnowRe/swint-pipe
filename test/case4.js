var assert = require('assert'),
	Pipe = require('../lib'),
	swintHelper = require('swint-helper');

global.swintVar.printLevel = 5;

/*
	Scenario: Simple Y-form
	[1,2]->3
*/

describe('Simple Y-form', function() {
	var order = [];

	before(function(done) {
		var edge1 = Pipe.Edge(function(system, input, output) {
				setTimeout(function() {
					order.push(1);
					output('edge1');
				}, 50);
			});

		var edge2 = Pipe.Edge(function(system, input, output) {
				setTimeout(function() {
					order.push(2);
					output('edge2');
				}, 100);
			});

		var edge3 = Pipe.Edge(function(system, input, output) {
				setTimeout(function() {
					order.push(3);
					output(input);
				}, 500);
			});

		var system1 = Pipe.System();

		system1.connect([edge1, edge2], edge3);

		edge1.input(null);
		edge2.input(null);
		edge3.output(system1);

		system1.end(function(output) {
			done();
		});
		system1.error(function(type, err) {
		});
		system1.start();
	});

	it('Simple Y-form', function() {
		assert.deepEqual(order, [1, 2, 3]);
	});
});
