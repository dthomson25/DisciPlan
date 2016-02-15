
// Http request to get settings of user

var settings_JSON = []

  var xhttp_settings = new XMLHttpRequest();
  xhttp_settings.onreadystatechange = function() {
    if (xhttp_settings.readyState == 4 && xhttp_settings.status == 200) {
      settings_JSON = JSON.parse(xhttp_settings.responseText);
      console.log(settings_JSON);
    }
  };
  xhttp_settings.open("GET", "http://localhost:3000/get_settings/danthom", true);
  xhttp_settings.send();

// End of http request code

var startTime
var endTime
var currSiteRestricted = false
var currCategory
var timeoutId

redirectCurrentTab = function(Url){
  chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
        chrome.tabs.update(tab.id, {url: Url});
    });
}

function redirectToHome() {
  redirectCurrentTab("localhost:3000")
}

function checkIfRestricted(url) {
  for(i = 0; i < settings_JSON.length; i++){
    row = settings_JSON[i];
    restrictedHost = row.domainName;

    var l = document.createElement('a');
    l.href = url;
    // Hostname of new tab url
    var urlHostName = l.hostname;

    if(restrictedHost == urlHostName){
      currSiteRestricted = true;
      var remainTime = row.timeRemaining;
      endTime = new Date();
      endTime.setSeconds(endTime.getSeconds() + remainTime);
      currCategory = row.category;
      return;
    }
  }
  currSiteRestricted = false;
}

function startTimeout() {
  if(timeoutId) // Only want one timeout waiting
      window.clearTimeout(timeoutId);
  if(currSiteRestricted){
    var diff_ms = (Date.parse(endTime) - Date.parse(startTime));
    console.log(diff_ms);
    
    timeoutId = window.setTimeout(redirectToHome, diff_ms);
  }
}

function updateCategoryRT(elapsed_sec){
  for(i = 0; i < settings_JSON.length; i++){
    row = settings_JSON[i];
    if(row.category == currCategory){
      row.timeRemaining = row.timeRemaining - elapsed_sec;
    }
  }
}

function checkSettingsTabChange(tabId, changeInfo, tab) {
  if(settings_JSON == null)
    return;  
  if(currSiteRestricted){
    var currTime = new Date();
    var elapsed_sec = (Date.parse(currTime) - Date.parse(startTime))/1000;
    updateCategoryRT(elapsed_sec);
  }

  startTime = new Date();
  checkIfRestricted(tab.url)
  startTimeout();
}

function checkSettingChangeTab(tabId, changeInfo, tab) {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    if(currSiteRestricted){
      var currTime = new Date();
      var elapsed_sec = (Date.parse(currTime) - Date.parse(startTime))/1000;
      updateCategoryRT(elapsed_sec);
    }
    startTime = new Date();
    checkIfRestricted(url);
    startTimeout();
  });
}

function popupRequest(request, sender, sendResponse) {
  console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
  if(request.endTime == "endTime"){
    console.log(currSiteRestricted)
    if(currSiteRestricted){
      console.log(endTime);
      sendResponse({restricted: true,
                     endTime: endTime.toString(),
                     category: currCategory});
    }
    else{
      sendResponse({restricted: false})
    }
  }
}


// Update remaning time for last category, cancel timeout, then
// check if current site is restricted and if it is start
// a timeout to redirect page
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  checkSettingsTabChange(tabId, changeInfo, tab)
});



// Update remaning time for last category, cancel timeout, then
// check if current site is restricted and if it is start
// a timeout to redirect page
chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
  checkSettingChangeTab(tabId, changeInfo, tab)

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    popupRequest(request, sender, sendResponse)
});

