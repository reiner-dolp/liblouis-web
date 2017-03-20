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

function readAllOpts() {
	var opts = {
		tableVersion: el("tableversion").value.replace(/[\\\/]/g, ""),
		libVersion: el("liblouisversion").value,
		tables: el("tables").value,
		forward: el("forward").checked,
		input: el("input").value,
		opcodes: el("opcodes").value,
		testname: el("testcasename").value
	}

	if(/^[0-9]\.[0-9]\.[0-9]$/.test(opts.tableVersion)) {
		opts.tableVersion = "v" + opts.tableVersion;
	}

	return opts;
}

function runTranslation() {
	el("log").value = "";

	var opts = readAllOpts();

	var newTableFolderLoc = "https://raw.githubusercontent.com/liblouis/liblouis/" +
		opts.tableVersion + "/tables/";

	if(tableFolderLoc !== newTableFolderLoc || lastVersion !== opts.libVersion) {
		console.debug("reloading liblouis");
		if(worker) { worker.terminate(); }
		worker = new Worker("worker.js");
		worker.addEventListener("message", processMsg);
		lastOpcodes = "";
		lou("import", opts.libVersion, noop);
		lou("folderurl", newTableFolderLoc, noop);
		tableFolderLoc = newTableFolderLoc;
	}


	if(lastOpcodes && lastOpcodes !== opts.opcodes) {
		lou("free", {}, noop);
	}
	lastOpcodes = opts.opcodes;

	if(opts.opcodes.length > 0) {
		lou("compileString", {tables: opts.tables, opcodes: opts.opcodes}, noop);
	}

	lou(opts.forward ? "translate" : "backtranslate", {input: opts.input, tables: opts.tables}, displayOutput);

	setLink(opts);
}

function setLink(opts) {
	if(!opts) { opts = readAllOpts(); }
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
		if(opts.tableVersion) { el("tableversion").value = opts.tableVersion; }
		if(opts.liblouisVersion) { el("liblouisversion").value = opts.liblouisVersion === "310" ? "310" : "300"; }
		if(opts.forward) { el(opts.forward ? "forward" : "backward").checked = "checked"; }
		if(opts.input) { el("input").value = opts.input; }
		if(opts.opcodes) { el("opcodes").value = opts.opcodes; }
		if(opts.tables) { el("tables").value = opts.tables; }
		if(opts.testname) { el("testcasename").value = opts.testname; }

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
