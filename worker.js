
var CMD = {
	import: function(version) {
		importScripts("liblouis-no-tables-v"+version.replace(/[^0-9]/g, "")+".js");
		importScripts("easy-api.js");
		liblouis.setLogLevel(liblouis.LOG.ALL);

		liblouis.registerLogCallback(function(logLevel, msg){
			self.postMessage({isLog: true, level: liblouis.LOG[logLevel], msg: msg});
		});
	},

	version: function () {
		return liblouis.version();
	},

	translate: function(data) {
		return liblouis.translateString(data.tables, data.input);
	},

	backtranslate: function(data) {
		return liblouis.backTranslateString(data.tables, data.input);
	},

	folderurl: function(url) {
		liblouis.enableOnDemandTableLoading(url);
	},

	free: function() {
		liblouis.free();
	},

	compileString: function(data) {
		liblouis.compileString(data.tables, data.opcodes);
	}
};

self.onmessage = function (ev) {
	var msg = ev.data;
	if(!msg.cmd || !CMD.hasOwnProperty(msg.cmd)) {
		return;
	}

	var res = CMD[msg.cmd](msg.data);
	self.postMessage({
		callId: msg.callId,
		data: res
	});
};
