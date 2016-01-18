var d = new Date();
var startTime = d.getTime();

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    currUrl = tabs[0].url;
    console.log("starting url: " + currUrl);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({'url': "https://google.com", 'selected': true});
});

chrome.tabs.onActivated.addListener(function(tab) {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var dTmp = new Date();
        amountSpent = (dTmp.getTime() - startTime)/(1000);
        console.log("Spent " + amountSpent.toString() + " seconds on " + currUrl);
        currUrl = tabs[0].url;
        startTime = dTmp.getTime();
    });
});

var delay = 0;
chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
    var url = tab.url;
    var dTmp = new Date();
    if (url !== undefined && changeInfo.status == "complete") {
        amountSpent = (dTmp.getTime() - startTime - delay)/1000;
        console.log("Spent " + amountSpent.toString() + " seconds on " + currUrl);
        currUrl = url;
        startTime = dTmp.getTime();
        delay = 0;
    }
    else if (changeInfo.status != "complete") {
        delay = dTmp.getTime() - startTime;
    }
});
