
// Http request to get settings of user

var settings_JSON = []

function get_settings() {
  var xhttp_settings = new XMLHttpRequest();
  xhttp_settings.onreadystatechange = function() {
    if (xhttp_settings.readyState == 4 && xhttp_settings.status == 200) {
      console.log("Settings updated");
      settings_JSON = JSON.parse(xhttp_settings.responseText);
      console.log(settings_JSON);
      // Every time we get new settings we want to check if the reset time is the same
      startResetTimeout(); 
    }
  };
  xhttp_settings.open("GET", "http://localhost:3000/get_settings/danthom", true);
  xhttp_settings.send();
}

get_settings();


// End of http request code




// Set up interval that gets called to reset time remaining
// at the time specified by the users settings.

var resetIntervalId
var resetTimeoutId
var resetTime = 0

function resetAllTR() {
  var info = JSON.stringify({user:"danthom"});
  console.log("Resetting time remaining. Current time: " + new Date());
  var http_reset_allTR = new XMLHttpRequest();
  http_reset_allTR.onreadystatechange = function() {
    if (http_reset_allTR.readyState == 4 && http_reset_allTR.status == 200) {
      get_settings();
    }
  };
  http_reset_allTR.open("POST", 'http://localhost:3000/reset_allTR');
  http_reset_allTR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  http_reset_allTR.send(info);
}

function startInterval() {
  if(resetIntervalId)
    window.clearInterval(resetIntervalId);
  var interval = 24*60*60*1000;
  resetIntervalId = setInterval(resetAllTR, interval);
  resetAllTR();

}

function startResetTimeout() {
  console.log("Starting reset interval.");
  if(resetTimeoutId)
    window.clearTimeout(resetTimeoutId);
  var oldResetTime = resetTime;
  resetTime = 5; // TODO get from settings when it is there
  // TODO if new reset time is different redo intervals
  if(resetTime == oldResetTime)
    return;

  var currDate = new Date();
  var resetDate = new Date();
  resetDate.setHours(resetTime,0,0,0);
  var diff = resetDate - currDate;
  if(diff < 0){
    resetDate.setHours(resetDate.getHours() + 24);
    diff = resetDate - currDate;
  }
  diff = 1; // remove this after testing
  resetTimeoutId = setTimeout(startInterval, diff);
}



// End of interval code


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

// When the remaining time for a category goes to 0, send a POST request
// to update the database with that information. 
function updateDatabaseCategoryRT(){
  var update = JSON.stringify({user:"danthom", category: currCategory, TR: 0});
  var http_update_TR = new XMLHttpRequest();
  // Do we get a response?
  // http_update_TR.onreadystatechange = function() {

  // };
  http_update_TR.open("POST", 'http://localhost:3000/update_TR');
  http_update_TR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  http_update_TR.send(update);
}


// When time remaining goes to 0, update the database and redirect the page
// to our home page. 
function redirectToHome() {
  updateDatabaseCategoryRT();
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
  // console.log(sender.tab ?
  //               "from a content script:" + sender.tab.url :
  //               "from the extension");
  if(request.endTime == "endTime"){
    if(currSiteRestricted){
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

