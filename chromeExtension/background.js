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

        ////////start ish here
        var xhttp = new XMLHttpRequest();
            xhttp.addEventListener('readystatechange', function (evt) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {
                    console.log("Spent " + amountSpent.toString() + " seconds on " + currUrl + ". This made it to the backend.");
                } else {
                    console.log("ERROR: status " + xhttp.status);
                }
            }
        });
        xhttp.open('POST', 'http://localhost:3000/users/record',true);
        xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var form = 'url=' + tab.url + '&startTime=' + startTime.toString() + '&endTime=' + dTmp.getTime().toString();
        xhttp.send(form);

        //////////////end ish here
        
        currUrl = url;
        startTime = dTmp.getTime();
        delay = 0;
    }
    else if (changeInfo.status != "complete") {
        delay = dTmp.getTime() - startTime;
    }
});


