var prevDomain = "";
var prevDate = new Date();

function extractDomain(url) {
    var domain;
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    domain = domain.split(':')[0];
    return domain;
}

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    prevDomain = extractDomain(tabs[0].url);
    console.log("starting domain: " + prevDomain);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({'url': "localhost:3000/users/index", 'selected': true});
});


function sendXHR(url) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function(evt) {
        if (xhr.readyState === 4) {
            if (xhr.status === 204) {
                console.log("yay");
            }
            else {
                console.log("ERROR: status " + xhr.status);
            }
        }
    });
    var dTmp = new Date();
    var form = 'domainName=' + prevDomain + '&startTime=' + prevDate.toString() + '&duration=' + (Math.floor((dTmp.getTime() - prevDate.getTime())/1000)).toString();
    xhr.open('POST', 'http://localhost:3000/usage/record',true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    prevDomain = extractDomain(url);
    prevDate = dTmp;

    xhr.send(form);
}


chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        sendXHR(tabs[0].url);
    });
});


chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
    if (tab.url !== undefined && changeInfo.status == "complete") {
        sendXHR(tab.url);
    }
});