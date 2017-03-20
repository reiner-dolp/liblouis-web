var worker = null;

var callId = 0;
var cbs = {};
var tableFolderLoc = null;
var lastVersion = null;
var lastOpcodes = "";

function displayOutput(str) {
	el("outpututf8").value = str;	
}

function noop() {}

function el(str) {
	return document.getElementById(str);
}

function runTranslation() {
	el("log").value = "";

	var tableVersion = el("tableversion").value.replace(/[\\\/]/g, "");

	if(/^[0-9]\.[0-9]\.[0-9]$/.test(tableVersion)) {
		tableVersion = "v" + tableVersion;
	}

	var libVersion = el("liblouisversion").value;

	var newTableFolderLoc = "https://raw.githubusercontent.com/liblouis/liblouis/" +
		tableVersion + "/tables/";

	if(tableFolderLoc !== newTableFolderLoc || lastVersion !== libVersion) {
		console.debug("reloading liblouis");
		if(worker) { worker.terminate(); }
		worker = new Worker("worker.js");
		worker.addEventListener("message", processMsg);
		lastOpcodes = "";
		lou("import", libVersion, noop);
		lou("folderurl", newTableFolderLoc, noop);
		tableFolderLoc = newTableFolderLoc;
	}

	var tables = el("tables").value;
	var forward = el("forward").checked;
	var input = el("input").value;

	var opcodes = el("opcodes").value;

	if(lastOpcodes && lastOpcodes !== opcodes) {
		lou("free", {}, noop);
	}
	lastOpcodes = opcodes;

	if(opcodes.length > 0) {
		lou("compileString", {tables: tables, opcodes: opcodes}, noop);
	}

	lou(forward ? "translate" : "backtranslate", {input: input, tables: tables}, displayOutput);
	setLink({forward: forward, input: input, tableVersion: tableVersion, tables: tables, opcodes: opcodes, liblouisVersion: libVersion});
}

function setLink(opts) {
	window.location.hash = encodeURIComponent(JSON.stringify(opts));
	el("share").value = window.location.href;
}

function error(msg) {
	var err = el("error");
	err.textContent = msg;
	err.classList.remove("hidden");	
}

function readLink() {
	var hash = window.location.hash[0] === "#" ? window.location.hash.slice(1) :
		window.location.hash;
	var opts;

	if(hash && hash.length > 0) {
		try {
			opts = JSON.parse(decodeURIComponent(hash));
		} catch(e) {
			error("Shared link is damaged or incomplete.");
			return;
		}
	}

	if(opts) {
		el("tableversion").value = opts.tableVersion;
		el("liblouisversion").value = opts.liblouisVersion === "310" ? "310" : "300";
		el(opts.forward ? "forward" : "backward").checked = "checked";
		el("input").value = opts.input;
		el("opcodes").value = opts.opcodes;
		el("tables").value = opts.tables;
		el("share").value = window.location.href;

		runTranslation();
	}
}

function lou(cmd, data, cb) {
	cbs[callId] = cb;
	worker.postMessage({
		callId: callId,
		cmd: cmd,
		data: data
	});
	++callId;
}

function processMsg(ev) {
	var msg = ev.data;
	if(msg && msg.isLog) {
		el("log").value += "[" + msg.level + "] " + msg.msg + "\n";
		return;
	}

	if(!msg || typeof msg.callId !== "number" || typeof cbs[msg.callId] !== "function") {
		console.debug("recieved bougus message from worker:", msg);
		return;
	}

	cbs[msg.callId](msg.data);
	cbs[msg.callId] = null;
	delete cbs[msg.callId];
}

readLink();
