'use strict';

var ev = require('events').EventEmitter;

module.exports = function(mainFunc) {
	return new Edge(mainFunc);
};

var Edge = function(mainFunc) {
	this.mainFunc = mainFunc;

	this.isStart = false;
	this.isEnd = false;
	this.ended = false;

	this.isSource = false;
	this.isTarget = false;

	this.isReady = null;
	this.system = null;
	this.prerequisites = [];
	this.preOutData = [];

	this.eid = Math.floor(Math.random() * 1000000000);

	this.events = new ev();
};

var _ = Edge.prototype;

_.input = function(data) {
	this.isStart = true;
	this.input = data;
};

_.output = function(system, key) {
	var that = this;

	this.isEnd = true;

	this.events.on('end', function(out) {
		that.ended = true;
		if(key) {
			system.outputs[key] = out;
		} else {
			system.outputs = out;
		}
		system.checkEnd();
	});
};

_.start = function(system) {
	this.execute(system, this.input);
};

_.clone = function() {
	return new Edge(this.mainFunc);
};

_.execute = function(system, input) {
	var that = this;

	if(this.mainFunc.length === 2) {
		this.events.emit('end', this.mainFunc(system, input));
	} else if(this.mainFunc.length === 3) {
		this.mainFunc(system, input, function(output) {
			that.events.emit('end', output);
		});
	}
};

_.donePre = function(eid) {
	var idx = this.prerequisites.indexOf(eid);
	this.prerequisites[idx] = -1;
};

_.allDone = function() {
	var left = this.prerequisites.filter(function(p) {
		return p !== -1;
	});
	return (left.length === 0);
};
