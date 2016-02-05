redirectCurrentTab = function(Url){
  chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
        chrome.tabs.update(tab.id, {url: Url});
    });
}

var deadline;
function getTimeRemaining(endtime) {
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  return {
    'total': t,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}
function updateClock() {
  var clock = document.getElementById('countdowndiv');
  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  var t = getTimeRemaining(deadline);

  hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
  minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
  secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);


  if (t.total <= 0) {
    clearInterval(timeinterval);
    redirectCurrentTab("http://www.stanford.edu");
  }
}



document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('checkPage');
  var settingsPageButton = document.getElementById('settings_btn');
  
  checkPageButton.addEventListener('click', function() {

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    document.getElementById('url').innerHTML = url;

    });
  }, false);


  // Event listener to view settings page button. Redirects to localhost:3000/settings
  settingsPageButton.addEventListener('click', function() {    
    redirectCurrentTab("localhost:3000/settings");
    window.close();
  }, false);

  

  chrome.runtime.sendMessage({time: "remaining"}, function(response) {
    console.log(response.time);
    if(response.time){
      deadline = new Date(response.time);
      timeinterval = setInterval(updateClock, 1000);
    }
    if(response.defaultSite){
      console.log("Already redirected...")
    }
  });
}, false);


