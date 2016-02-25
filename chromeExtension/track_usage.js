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

function getStartingDomain(tracker) {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        tracker.prevDomain = extractDomain(tabs[0].url);
        console.log("starting domain: " + tracker.prevDomain);
    });
}

function sendXHR(url, tracker) {
    // If not logged in do not send request
    if(!username)
        return;
    console.log(tracker);
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
    var form = 'domainName=' + tracker.prevDomain + '&startTime=' + tracker.prevDate.toString() + '&duration=' + (Math.floor((dTmp.getTime() - tracker.prevDate.getTime())/1000)).toString();
    xhr.open('POST', 'http://localhost:3000/usage/record',true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    tracker.prevDomain = extractDomain(url);
    tracker.prevDate = dTmp;

    xhr.send(form);
}
