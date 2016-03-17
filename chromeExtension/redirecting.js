
var settings_JSON = null;
var prev_nuclear_types = [];
var reset_interval


// Set up persistent connection to server for updates

var socket = io.connect('http://localhost:3000');

socket.on('connect', function() {
    console.log('socket connected');
    //socket.emit('set username', 'danthom');
});
socket.on('username set', function() {
    socket.emit('get settings');

});
socket.on('error', function(error) {
  console.log('Error: ' + error);
});
socket.on('settings object', function(settings) {
  if(settings){
    console.log("Received settings object from socket...");
    console.log(settings);
    settings_JSON = settings;
    startResetTimeout();
    reset_interval = settings_JSON[0].resetInterval
  }
});

socket.on('settings saved', function(settings) {
  if(settings){
    console.log(settings);
    savePrevNuclearTypes(settings);
    console.log("Settings SAVED..")
    console.log(prev_nuclear_types);
    console.log("BELOW")
    settings_JSON = settings;
    startResetTimeout();
    socket.emit('get time remaining');
  }
})

socket.on('all RT reset', function(settings) {
  // TODO clear prev_nuclear_types
  prev_nuclear_types = [];
  settings_JSON = settings;
  socket.emit('get time remaining');
});

function set_socket_username_get_settings(){
  socket.emit('set username', username);
  
  // For new tab page
  socket.emit('get time remaining');
  socket.emit('get top unres sites');
}

function savePrevNuclearTypes(new_settings){
  for(i = 0; i < new_settings.length; i++){
    var row = new_settings[i];
    console.log(row);
    if(row.type == "Nuclear"){
      for(index = 0; index < settings_JSON.length; index++){
        var old_row = settings_JSON[index];
        if(old_row.domainName == row.domainName && old_row.type != "Nuclear"){
          var old_cat = old_row.category;
          var old_type = old_row.type;
          prev_nuclear_types.push([old_cat, old_type]);
        }
      }
    }
  }
}


var RTCategories = null;
var unresSites = null;

// TODO when do we socket.emit('get time remaining') so we have 
// recent data but not right before newtab because that is slowish?
socket.on('all time remaining', function(categories){
  console.log("categories remaining time");
  console.log(categories);
  RTCategories = categories;
});

socket.on('top unres sites', function(sites){
  console.log('Top sites not on restricted lists.');
  console.log(sites);
  unresSites = sites;

});

socket.on('RT updated', function(categories) {
  RTCategories = categories;
});







// Http request to get settings of user




// function get_settings() {
//   var xhttp_settings = new XMLHttpRequest();
//   xhttp_settings.onreadystatechange = function() {
//     if (xhttp_settings.readyState == 4 && xhttp_settings.status == 200) {
//       settings_JSON = JSON.parse(xhttp_settings.responseText);
//       // Every time we get new settings we want to check if the reset time is the same
//       startResetTimeout();
//     }
//   };
//   xhttp_settings.open("GET", "http://localhost:3000/get_settings", true);
//   xhttp_settings.send();
// }



// End of http request code




chrome.cookies.get({"url": "http://localhost", "name": "disciplan"}, function(cookie) {
  if (cookie) {
    username = cookie.value;
    set_socket_username_get_settings();
    //get_settings();
  } 
});


// Set up interval that gets called to reset time remaining
// at the time specified by the users settings.

var resetIntervalId
var resetTimeoutId
var resetTime = 0

function resetAllTR() {
  console.log("Resetting all time remaining request");
  socket.emit('Reset_allTR', prev_nuclear_types);
  // TODO send prev_nuclear_types



  // var http_reset_allTR = new XMLHttpRequest();
  // http_reset_allTR.onreadystatechange = function() {
  //   if (http_reset_allTR.readyState == 4 && http_reset_allTR.status == 200) {
  //     get_settings();
  //   }
  // };
  // http_reset_allTR.open("POST", 'http://localhost:3000/reset_allTR');
  // http_reset_allTR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  // http_reset_allTR.send();
}

function startInterval() {
  if(resetIntervalId)
    window.clearInterval(resetIntervalId);
  //var interval = 24*60*60*1000; // TODO get this from settings
  var interval = reset_interval*1000;
  resetIntervalId = setInterval(resetAllTR, interval);
  resetAllTR();

}

function startResetTimeout() {
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
  diff = 1; // TODO remove this after testing
  resetTimeoutId = setTimeout(startInterval, diff);
}



// End of interval code


var startTime
var endTime
var currTimeAllowed
var currSiteRestricted = false
var currCategory
var currType
var timeoutId


var badRedirect = false

redirectCurrentTab = function(Url){
  console.log(Url);
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
      chrome.tabs.update(tabs[0].id, {url: Url});
    });
}

// When the remaining time for a category goes to 0, send a POST request
// to update the database with that information. 
function updateDatabaseCategoryRT(time){
  // TODO make this so that the TR is not hardcoded to 0 and we can update for any value
  var update = JSON.stringify({category: currCategory, TR: time});
  socket.emit('update_cat_TR', update);



  // var http_update_TR = new XMLHttpRequest();
  // // Do we get a response?
  // // http_update_TR.onreadystatechange = function() {

  // // };
  // http_update_TR.open("POST", 'http://localhost:3000/update_TR');
  // http_update_TR.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  // http_update_TR.send(update);
}


var lastPage = null
// When time remaining goes to 0, update the database and redirect the page
// to our home page. 
function redirectToHome() {
  console.log("Redirect to home")

  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    // if(lastPage){
    //   if(lastPage == tabs[0].url) {
    //     badRedirect = true;
    //     lastPage = null;
    //     return;
    //   }
    // }
    // lastPage = tabs[0].url
    if(tabs[0]){
      chrome.tabs.update(tabs[0].id, {url: "localhost:3000"}, function() {
        badRedirect = false;
      });
    }
  });

}

function notifyTimeUp() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {action: "notify", category: currCategory}, function(response) {});  
  });
}

function handleTimeUp() {

  updateDatabaseCategoryRT(0);
  console.log(currType);

  if(currType == "Redirect")
    redirectToHome();
  if(currType == "Notifications")
    notifyTimeUp();
  if(currType == "Nuclear")
    redirectToHome();
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
      currTimeAllowed = row.timeAllowed;
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
    if(currType == "Nuclear")
      diff_ms = 0;
    timeoutId = window.setTimeout(handleTimeUp, diff_ms);
  }
}

function updateCategoryRT(elapsed_sec){
  var time_remain;
  for(i = 0; i < settings_JSON.length; i++){
    row = settings_JSON[i];
    if(row.category == currCategory){
      row.timeRemaining = row.timeRemaining - elapsed_sec;
      time_remain = row.timeRemaining;
    }
  }
  updateDatabaseCategoryRT(time_remain);
}

function checkSettingChangeTab() {
  // If username is null 
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
  // If message from popup telling us to add a domain to a category
  console.log("request: " + request.req);
  if(request.req == "update"){
    update = request.update;
    socket.emit('add page', update);
    socket.on('page added', function(settings) {
      settings_JSON = settings;
      startTime = new Date();
      page = JSON.parse(update).page;
      checkIfRestricted(page, true);
      startTimeout();
      sendResponse(); // Send the response once the settings have been updated
    });




    // var http_add_page = new XMLHttpRequest();
    
    // http_add_page.onreadystatechange = function() {
    //   // The response has the new updated settings
    //   if (http_add_page.readyState == 4 && http_add_page.status == 200) {
    //     settings_JSON = JSON.parse(http_add_page.responseText);
    //     startTime = new Date();
    //     page = JSON.parse(update).page;
    //     checkIfRestricted(page, true);
    //     startTimeout();
    //     sendRes(); // Send the response once the settings have been updated
    //   }
    // };
    // http_add_page.open("POST", 'http://localhost:3000/add_page');
    // http_add_page.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // http_add_page.send(update);
  }
  // If message from popup asking for endtime
  if(request.req == "endTime"){
    if(username){
      if(currSiteRestricted){
        sendResponse({ loggedIn: true,
                       restricted: true,
                       endTime: endTime.toString(),
                       category: currCategory,
                       timeAllowed: currTimeAllowed,
                       type: currType});
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
    sendResponse({username: username, 
                  categories: RTCategories,
                  sites: unresSites})
  }
  if(request.req == "username"){
    username = request.username;
    set_socket_username_get_settings();
    //get_settings();
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


chrome.windows.onFocusChanged.addListener(function(windowId) {
  checkSettingChangeTab();
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    popupRequest(request, sender, sendResponse);
    return true;
});



