
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
    console.log("starting domain: " + extractDomain(tabs[0].url));
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({'url': "localhost:3000/users/index", 'selected': true});
});


chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function(evt) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("yay");
                }
                else {
                    console.log("ERROR: status " + xhr.status);
                }
            }
        });
        xhr.open('POST', 'http://localhost:3000/users/record',true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var dTmp = new Date();
        var form = 'url=' + extractDomain(tabs[0].url) + '&startTime=' + dTmp.toString();
        xhr.send(form);
    });
});


chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
    if (tab.url !== undefined && changeInfo.status == "complete") {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function (evt) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("yay");
                } else {
                    console.log("ERROR: status " + xhttp.status);
                }
            }
        });
        xhr.open('POST', 'http://localhost:3000/users/record',true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var dTmp = new Date();
        var form = 'url=' + extractDomain(tab.url) + '&startTime=' + dTmp.toString();
        xhr.send(form);
    }
});
