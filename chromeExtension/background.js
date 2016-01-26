var d = new Date();
var startTime = d.getTime();
var prevUrl = "";
var currUrl = "";

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    currUrl = tabs[0].url;
    prevUrl = currUrl;
    console.log("starting url: " + currUrl);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({'url': "localhost:3000/users/index", 'selected': true});
});

var delay = 0;
chrome.tabs.onActivated.addListener(function(activeInfo) {
    //console.log("In listener function callback");
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var tmpUrl = currUrl;
        var dTmp = new Date();
        amountSpent = (dTmp.getTime() - startTime - delay)/(1000);
        var xhr = new XMLHttpRequest();

        frontEndLogMessage = "Spent " + amountSpent.toString() + " seconds on " + currUrl;
        xhr.addEventListener('readystatechange', function(evt) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(frontEndLogMessage);
                }
                else {
                    console.log("ERROR: status " + xhr.status);
                }
            }
        });
        xhr.open('POST', 'http://localhost:3000/users/record',true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var form = 'url=' + tmpUrl + '&startTime=' + startTime.toString() + '&endTime=' + dTmp.getTime().toString();
        xhr.send(form);
        //console.log("request sent: " + tmpUrl);
        prevUrl = currUrl;
        currUrl = tabs[0].url;
        startTime = dTmp.getTime();
    });
});


chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
    if(prevUrl !== currUrl) {
        var url = tab.url;
        var dTmp = new Date();
        if (url !== undefined && changeInfo.status == "complete") {
            amountSpent = (dTmp.getTime() - startTime - delay)/1000;
            var tmpUrl = currUrl;
            var xhr = new XMLHttpRequest();

            var frontEndLogMessage = "Spent " + amountSpent.toString() + " seconds on " + tmpUrl + ". This made it to the backend.";
                xhr.addEventListener('readystatechange', function (evt) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log(frontEndLogMessage);
                    } else {
                        console.log("ERROR: status " + xhttp.status);
                    }
                }
            });
            xhr.open('POST', 'http://localhost:3000/users/record',true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            if(dTmp.getTime() - startTime > 1000) {
                var form = 'url=' + currUrl + '&startTime=' + (startTime/1000).toString() + '&endTime=' + (dTmp.getTime()/1000).toString();
                xhr.send(form);
            }
            prevUrl = currUrl;
            currUrl = url;
            startTime = dTmp.getTime();
            delay = 0;
        }
        else if (changeInfo.status != "complete") {
            delay = dTmp.getTime() - startTime;
        }
    }
});


