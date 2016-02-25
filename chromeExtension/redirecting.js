
// Http request to get settings of user



var settings_JSON = null;

function get_settings() {
  var xhttp_settings = new XMLHttpRequest();
  xhttp_settings.onreadystatechange = function() {
    if (xhttp_settings.readyState == 4 && xhttp_settings.status == 200) {
      settings_JSON = JSON.parse(xhttp_settings.responseText);
      // Every time we get new settings we want to check if the reset time is the same
      startResetTimeout();
      console.log(settings_JSON); 

    }
  };
  xhttp_settings.open("GET", "http://localhost:3000/get_settings", true);
  xhttp_settings.send();
}



// End of http request code


var username = null;

chrome.cookies.get({"url": "http://localhost", "name": "disciplan"}, function(cookie) {
  if (cookie) {
    username = cookie.value;
    get_settings();
  } 
});


// Set up interval that gets called to reset time remaining
// at the time specified by the users settings.

var resetIntervalId
var resetTimeoutId
var resetTime = 0

function resetAllTR() {
  console.log("Resetting time remaining. Current time: " + new Date());
  var http_reset_allTR = new XMLHttpRequest();
  http_reset_allTR.onreadystatechange = function() {
    if (http_reset_allTR.readyState == 4 && http_reset_allTR.status == 200) {
      get_settings();
    }
  };
  http_reset_allTR.open("POST", 'http://localhost:3000/reset_allTR');
  http_reset_allTR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  http_reset_allTR.send();
}

function startInterval() {
  if(resetIntervalId)
    window.clearInterval(resetIntervalId);
  var interval = 24*60*60*1000; // TODO get this from settings
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
var currType
var timeoutId


var badRedirect = false

redirectCurrentTab = function(Url){
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.update(tabs[0].id, {url: Url});
    });
}

// When the remaining time for a category goes to 0, send a POST request
// to update the database with that information. 
function updateDatabaseCategoryRT(){
  var update = JSON.stringify({category: currCategory, TR: 0});
  var http_update_TR = new XMLHttpRequest();
  // Do we get a response?
  // http_update_TR.onreadystatechange = function() {

  // };
  http_update_TR.open("POST", 'http://localhost:3000/update_TR');
  http_update_TR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  http_update_TR.send(update);
}


var lastPage = null
// When time remaining goes to 0, update the database and redirect the page
// to our home page. 
function redirectToHome() {
  updateDatabaseCategoryRT();

  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    // if(lastPage){
    //   if(lastPage == tabs[0].url) {
    //     badRedirect = true;
    //     lastPage = null;
    //     return;
    //   }
    // }
    // lastPage = tabs[0].url
    chrome.tabs.update(tabs[0].id, {url: "localhost:3000"}, function() {
      badRedirect = false;

    });
  });

}

function notifyTimeUp() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {action: "notify", category: currCategory}, function(response) {});  
  });
}

function handleTimeUp() {
  if(currType == "Redirect")
    redirectToHome();
  if(currType == "Notifications")
    notifyTimeUp();
  // TODO add nuclear option...
  //if(currType == "Nuclear")
  //nuclearOption()
}

function checkIfRestricted(url, alreadyHostName) {
  var urlHostName = url;
  if(!alreadyHostName){
    var l = document.createElement('a');
    l.href = url;
    // Hostname of new tab url
    urlHostName = l.hostname;
  }

  for(i = 0; i < settings_JSON.length; i++){
    row = settings_JSON[i];
    restrictedHost = row.domainName;

    if(restrictedHost == urlHostName){
      currSiteRestricted = true;
      var remainTime = row.timeRemaining;
      endTime = new Date();
      endTime.setSeconds(endTime.getSeconds() + remainTime);
      currCategory = row.category;
      currType = row.type;
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
    if(diff_ms < 0)
      diff_ms = 0; 
    timeoutId = window.setTimeout(handleTimeUp, diff_ms);
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

function checkSettingChangeTab() {
  // If username is null 
  console.log(username);
  if(username == null)
    return;

  // TODO fix this for twitter
  if(badRedirect)
    return;

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    if(tabs.length <= 0) return;
    var url = tabs[0].url;
    if(settings_JSON == null)
      return; 
    if(currSiteRestricted){
      var currTime = new Date();
      var elapsed_sec = (Date.parse(currTime) - Date.parse(startTime))/1000;
      updateCategoryRT(elapsed_sec);
    }
    startTime = new Date();
    checkIfRestricted(url, false);
    startTimeout();
  });
}

function get_categories() {
  var categories = [];
  for(i = 0; i < settings_JSON.length; i++){
    row = settings_JSON[i];
    category = row.category;
    if(categories.indexOf(category) == -1){
      categories.push(category);
    }
  }
  return categories;
}


function popupRequest(request, sender, sendResponse) {
  // console.log(sender.tab ?
  //               "from a content script:" + sender.tab.url :
  //               "from the extension");

  // If message from popup telling us to add a domain to a category
  if(request.req == "update"){
    update = request.update;
    var http_add_page = new XMLHttpRequest();
    sendRes = function() { sendResponse(); };
    http_add_page.onreadystatechange = function() {
      // The response has the new updated settings
      if (http_add_page.readyState == 4 && http_add_page.status == 200) {
        settings_JSON = JSON.parse(http_add_page.responseText);
        startTime = new Date();
        page = JSON.parse(update).page;
        checkIfRestricted(page, true);
        startTimeout();
        sendRes(); // Send the response once the settings have been updated
      }
    };
    http_add_page.open("POST", 'http://localhost:3000/add_page');
    http_add_page.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http_add_page.send(update);
  }
  // If message from popup asking for endtime
  if(request.req == "endTime"){
    if(username){
      if(currSiteRestricted){
        sendResponse({ loggedIn: true,
                       restricted: true,
                       endTime: endTime.toString(),
                       category: currCategory});
      }
      else{
        categories = get_categories();
        sendResponse({ loggedIn: true,
                       restricted: false,
                       categories: categories});
      }
    }
    else{
      sendResponse({loggedIn: false})
    }
  }
  // If message from newtab asking for information
  if(request.req == "newtab"){
    console.log("newtab message!");
    sendResponse({settings: settings_JSON})
  }
  if(request.req == "username"){
    console.log("Username: " +  request.username);
    username = request.username;
    get_settings();
    intervalId = setInterval(sendStartTimer, 500);
    function sendStartTimer(){
      if(settings_JSON){
        checkSettingChangeTab();
        sendResponse({res: "start_timer"});
        clearInterval(intervalId);
      }
      
    }

  }
    
}


// Update remaning time for last category, cancel timeout, then
// check if current site is restricted and if it is start
// a timeout to redirect page
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   checkSettingsNewTab(tabId, changeInfo, tab)
// });



// Update remaning time for last category, cancel timeout, then
// check if current site is restricted and if it is start
// a timeout to redirect page
// chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
//   checkSettingChangeTab(tabId, changeInfo, tab)

// });



chrome.windows.onFocusChanged.addListener(function(windowId) {
  // console.log("window changed");
  checkSettingChangeTab();
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    popupRequest(request, sender, sendResponse);
    return true;
});



