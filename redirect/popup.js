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
  var changePageButton = document.getElementById('changePage');
  
  checkPageButton.addEventListener('click', function() {

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    document.getElementById('url').innerHTML = url;

    });
  }, false);

  changePageButton.addEventListener('click', function() {    
    redirectCurrentTab("http://www.google.com")
  }, false);

  
}, false);


