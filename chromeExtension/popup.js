redirectCurrentTab = function(Url){
  chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
        chrome.tabs.update(tab.id, {url: Url});
    });
}

var endTime;
var category;
var hours, minutes, seconds;

function set_time(){
  var currTime = new Date().getTime();
  var seconds_remaining = (endTime - currTime)/1000;
  hours = parseInt(seconds_remaining / 3600);
  seconds_remaining = seconds_remaining % 3600;
 
  minutes = parseInt(seconds_remaining / 60);
  seconds = parseInt(seconds_remaining % 60);
  console.log(hours, minutes, seconds);
  var clock = document.getElementById('restrictedPageDiv');
  clock.setAttribute('style', 'display: initial');
  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');
  hoursSpan.innerHTML = hours;
  minutesSpan.innerHTML = minutes;
  secondsSpan.innerHTML = seconds;
  if(hours == 0 && minutes == 0 && seconds <= 0)
    window.close();
}



function addCategoriesToDropdown(categories) {
  var addPageDiv = document.getElementById('addCurrentPageDiv');
  addPageDiv.setAttribute('style', 'display: initial');
  var dropdown = document.getElementById('category_dropdown');
  for(i = 0; i < categories.length; i++){
    var li = document.createElement("LI");
    var a = document.createElement("A");
    a.setAttribute("id", categories[i]);
    a.innerHTML = categories[i];
    console.log("Added event listener: " + i);
    a.addEventListener('click', function(){
      var category = this.id;
      var currPage = document.getElementById('currentPage').innerText;
      var update = JSON.stringify({user:"danthom", page:currPage, category:category});
      chrome.runtime.sendMessage({req: "update", update:update}, function(response) { start_timer(); });

    });

    li.appendChild(a);
    dropdown.appendChild(li);

  }
}


function start_timer(){
  console.log("start_timer");
  chrome.runtime.sendMessage({req: "endTime"}, function(response) {
    if(response.restricted == true) {
      // Hide the add page div
      var addPageDiv = document.getElementById('addCurrentPageDiv');
      addPageDiv.setAttribute('style', 'display: none');
      // Start the interval to update the countdown div
      endTime = Date.parse(response.endTime);
      setInterval(set_time, 1000);
      category = response.category;
      var categoryDiv = document.getElementById('currentCategory');
      categoryDiv.innerHTML = category;
    }
    // If it is not on the list hide the count down div and add the add page dropdown
    else{
      var clock = document.getElementById('restrictedPageDiv');
      clock.setAttribute('style', 'display: none');
      categories = response.categories;
      addCategoriesToDropdown(categories);
    }
  });
}


document.addEventListener('DOMContentLoaded', function() {

  start_timer();

  var pageDiv = document.getElementById('currentPage');
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    var l = document.createElement('a');
    l.href = url;
    // Hostname of new tab url
    pageDiv.innerHTML = l.hostname;
  });


  var settingsPageButton = document.getElementById('settings_btn');
  
  // Event listener to view settings page button. Redirects to localhost:3000/settings
  //TODO not hard coding the user value
  settingsPageButton.addEventListener('click', function() {    
    redirectCurrentTab("localhost:3000/user_settings/danthom");
    window.close();
  }, false);



}, false);


