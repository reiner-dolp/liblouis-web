var URL = "https://api.github.com/repos/liblouis/js-build/";
var RELEASES = null;

function getJson(url, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'json';
	xhr.onload = function() {
		success(xhr.response, xhr.status);
	};

	xhr.onerror = error || core.sendErrorToComm;

	xhr.send();
}

function getReleaseList(success, error) {
	if(RELEASES) {
		success(RELEASES);
		return;
	}

	getJson(URL + "tags", function(response, status) {
		void status;
		RELEASES = response;
		success(RELEASES);
	}, error);
}

function getLatestRelease(success, error) {
	getReleaseList(function(releases) {
		success(releases[0]);
	}, error);
}
