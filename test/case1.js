var assert = require('assert'),
	Pipe = require('../lib'),
	swintHelper = require('swint-helper');

global.swintVar.printLevel = 5;

/*
	Scenario: Basic flow
	0) input: id
	1) get user information(email, gender) from API (input: id)
	2) get user name from DB (input: id)
	3) match informations (input: email, name)
	4) branch with gender (input: gender)
	5) male -> save to table 'male'
	6) femail -> save to table 'female'
*/

describe('Basic flow', function() {
	var testVars = {};

	before(function(done) {
		var edge1 = Pipe.Edge(function(system, input, output) {
				testVars.edge1 = input;
				setTimeout(function() {
					output({
						email: 'user@example.com',
						gender: 'female'
					});
				}, 100);
			});

		var edge2 = Pipe.Edge(function(system, input, output) {
				testVars.edge2 = input;
				setTimeout(function() {
					var err;
					if(err) {
						system.throw('Type1Error', 'Error while ' + err);
						return;
					}
					output('John doe');
				}, 50);
			});

		var edge3 = Pipe.Edge(function(system, input) {
				testVars.edge3 = input;
				system.global.emailWithName = input.email + '/' + input.name;

				return {
					email: input.email,
					name: input.name
				};
			});

		var edge4 = Pipe.Edge(function(system, input, output) {
				testVars.edge4 = input;

				setTimeout(function() {
					system.global.gender = input;
					output(input);
				}, 50);
			});

		var edge5 = Pipe.Edge(function(system, input, output) {
				testVars.edge5 = input;
				setTimeout(function() {
					// Save into table 'male'!
					output(42); // saved ID
				}, 70);
			});

		var edge6 = Pipe.Edge(function(system, input, output) {
				testVars.edge6 = input;
				setTimeout(function() {
					// Save into table 'female'!
					output(24); // saved ID
				}, 70);
			});

		var edge7 = Pipe.Edge(function(system, input, output) {
				testVars.edge7 = input;
				output(input);
			});

		var system1 = Pipe.System({
				req: 'req',
				res: 'res'
			});

		system1.connect([edge1, edge2], [edge3, edge4], function(before, after) {
			after({
				email: before[0].email,
				gender: before[0].gender,
				name: before[1]
			});
		});

		system1.branch(edge4, [edge5, edge6], function(before, after) {
			switch(before.gender) {
				case 'male':
					after(0, 'M');
					break;
				case 'female':
					after(1, 'F');
					break;
			}
		});

		system1.connect([edge5, edge6], edge7, function(before, after) {
			after(before.filter(function(b) {
				return b !== undefined;
			})[0]);
		});

		edge1.input(1);
		edge2.input(2);
		edge7.output(system1, 'edge7');

		system1.end(function(output) {
			testVars.global = system1.global;
			testVars.output = output;
			done();
		});
		system1.error(function(type, err) {
			print(type, err);
		});

		system1.start();
	});

	it('correct values', function() {
		assert.deepEqual(testVars, {
			edge1: 1,
			edge2: 2,
			edge3: { email: 'user@example.com', gender: 'female', name: 'John doe' },
			edge4: { email: 'user@example.com', gender: 'female', name: 'John doe' },
			edge6: 'F',
			edge7: 24,
			global: {
				emailWithName: 'user@example.com/John doe',
				gender: {
					email: 'user@example.com',
					gender: 'female',
					name: 'John doe'
				},
				req: 'req',
				res: 'res'
			},
			output: {
				edge7: 24
			}
		});
	});
});
