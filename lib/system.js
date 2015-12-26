'use strict';

module.exports = function(vars) {
	return new System(vars);
};

var System = function(global) {
	if (global === undefined) global = {};

	this.global = global;

	this.edges = {};
	this.outputs = {};
	this.aborted = false;

	this.endCallback = function() {};
	this.errCallback = function() {};
};

var _ = System.prototype;

_._register = function(edge) {
	if (Object.keys(this.edges).indexOf(edge.eid) !== -1) return;

	edge.system = this;
	this.edges[edge.eid] = edge;
};

_.connect = function(from, to, morph) {
	var that = this;

	if (morph === undefined) {
		morph = function(before, after) {
			after(before);
		};
	}

	if (!Array.isArray(from)) {
		from = [from];
	}

	if (!Array.isArray(to)) {
		to = [to];
	}

	from.forEach(function(ff) {
		if (ff.isSource) {
			that.throw('PipeError', 'This edge is already registered as source in another connection');
			return;
		}
		ff.isSource = true;
		that._register(ff);
	});

	to.forEach(function(tt) {
		if (tt.isTarget) {
			that.throw('PipeError', 'This edge is already registered as target in another connection');
			return;
		}
		tt.isTarget = true;
		that._register(tt);
		from.forEach(function(ff) {
			tt.prerequisites.push(ff.eid);
		});
	});

	from.forEach(function(ff) {
		ff.events.on('end', function(out) {
			if (that.aborted) return;

			to.forEach(function(tt) {
				var outData;

				tt.preOutData[tt.prerequisites.indexOf(ff.eid)] = out;
				tt.donePre(ff.eid);

				if (tt.allDone()) {
					if (from.length === 1) outData = tt.preOutData[0];
					else outData = tt.preOutData;

					morph(outData, function(morphed) {
						tt.execute(that, morphed);
					});
				}
			});
		});

		ff.events.on('cancel', function() {
			if (that.aborted) return;

			to.forEach(function(tt) {
				var outData;
				
				tt.preOutData.splice(tt.prerequisites.indexOf(ff.eid), 1);
				tt.donePre(ff.eid);

				if (tt.allDone()) {
					if (from.length === 1) outData = tt.preOutData[0];
					else outData = tt.preOutData;

					morph(outData, function(morphed) {
						tt.execute(that, morphed);
					});
				}
			});
		});
	});
};

_.branch = function(from, to, morph) {
	var that = this;

	if (from.isSource) {
		this.throw('PipeError', 'This edge is already registered as source in another connection');
		return;
	}
	from.isSource = true;
	this._register(from);

	to.forEach(function(tt) {
		if (tt.isTarget) {
			that.throw('PipeError', 'This edge is already registered as target in another connection');
			return;
		}
		tt.isTarget = true;
		that._register(tt);
		tt.prerequisites.push(from.eid);
	});

	from.events.on('end', function(out) {
		if (that.aborted) return;

		morph(out, function(idx, morphed) {
			to.forEach(function(tt, iidx) {
				if (iidx !== idx) {
					tt.preOutData.splice(tt.prerequisites.indexOf(from.eid), 1);
					tt.donePre(from.eid);
					tt.events.emit('cancel');
				} else {
					tt.preOutData[tt.prerequisites.indexOf(from.eid)] = out;
					tt.donePre(from.eid);
					tt.execute(that, morphed);
				}
			});
		});
	});
};

_._chkReady = function(connID) {
	var froms = this.connections[connID].from;

	for (var i = 0; i < froms.length; i++) {
		if (!froms[i].isReady) return false;
	}

	return true;
};

_.start = function() {
	if (this.aborted) return;
	
	for (var i in this.edges) {
		var edge = this.edges[i];
		if (edge.isStart) edge.start(this);
	}
};

_.end = function(callback) {
	this.endCallback = callback;
};

_.throw = function(type, err) {
	this.aborted = true;
	print(4, type + ':', err);
	this.errCallback(type, err);
};

_.error = function(callback) {
	this.errCallback = callback;
};

_.checkEnd = function() {
	var ends = [],
		flag = true;

	for (var i in this.edges) {
		var edge = this.edges[i];
		if (edge.isEnd) ends.push(edge);
	}

	ends.forEach(function(e) {
		if (!e.ended) {
			flag = false;
		}
	});

	if (flag) {
		this.endCallback(this.outputs);
	}
};
