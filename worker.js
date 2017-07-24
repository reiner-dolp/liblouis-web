
var CMD = {
	import: function(data) {
		importScripts("https://rawgit.com/liblouis/js-build/"+toHashOrVersion(data.version) +"/build-no-tables-utf"+ (data.bitness === 32 ? 32 : 16) +".js");
		importScripts("modules/liblouis/easy-api.js");
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

function toHashOrVersion(str) {
	if(/^v?[0-9]\.[0-9]\.[0-9]$/.test(str)) {
		return str[0] === "v" ? str : "v" + str;
	} else {
		return "v0.0.0-" + str.replace(/[^0-9a-zA-Z]/g, "").substr(0, 6);
	}
}
