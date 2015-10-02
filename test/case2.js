var assert = require('assert'),
	Pipe = require('../lib'),
	swintHelper = require('swint-helper');

global.swintVar.printLevel = 5;

/*
	Scenario: Error handling
	1->[2,3]->4, while error thrown at 2
*/

describe('Error handling', function() {
	it('Error handling', function(done) {
		var edge1 = Pipe.Edge(function(system, input, output) {
				output(input * 2);
			});

		var edge2 = Pipe.Edge(function(system, input, output) {
				system.throw('OmgError', 'omg');
				output(input - 2);
			});

		var edge3 = Pipe.Edge(function(system, input, output) {
				output(input + 2);
			});

		var edge4 = Pipe.Edge(function(system, input, output) {
				output([input[0], input[1]]);
			});

		var system1 = Pipe.System();

		system1.connect(edge1, [edge2, edge3]);
		system1.connect([edge2, edge3], edge4);

		edge1.input(42);
		edge4.output(system1);

		system1.end(function(output) {
			print('This shouldnt be executed');
			print(output);
		});
		system1.error(function(type, err) {
			assert.equal(type, 'OmgError');
			assert.equal(err, 'omg');
			done();
		});

		system1.start();
	});
});
