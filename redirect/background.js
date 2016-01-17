chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
	      chrome.tabs.update(tab.id, {url: "http://www.google.com"});
	});
});
