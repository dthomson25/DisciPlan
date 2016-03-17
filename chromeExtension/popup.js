redirectCurrentTab = function(Url){
  chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
        chrome.tabs.update(tab.id, {url: Url});
    });
}

var endTime;
var category;
var timeAllowed;
var hours, minutes, seconds;
var TRChart;
var ChartOpts;
var type;
var setTimeInt;

function set_time(){
  var currTime = new Date().getTime();
  var seconds_remaining = (endTime - currTime)/1000;
  hours = parseInt(seconds_remaining / 3600);
  seconds_remaining = seconds_remaining % 3600;
 
  minutes = parseInt(seconds_remaining / 60);
  seconds = parseInt(seconds_remaining % 60);

  if(hours <= 0 && minutes <= 0 && seconds <= 0){
    if(type == "Redirect")
      window.close();
    else{
      var countdownDiv = document.getElementById("countdown");
      countdownDiv.setAttribute('style', 'display:none');
      var timeUpDiv = document.getElementById("timeUp");
      timeUpDiv.setAttribute('style', 'display: initial');
      clearInterval(setTimeInt);
    }
  }





  var clock = document.getElementById('restrictedPageDiv');
  clock.setAttribute('style', 'display: initial');
  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');
  hoursSpan.innerHTML = hours;
  minutesSpan.innerHTML = minutes;
  secondsSpan.innerHTML = seconds;

  // Chart
  var tUsed = Math.floor(timeAllowed - seconds_remaining);
  var tRemaining = Math.floor(seconds_remaining);
  // var aLabel = "<%=v3+' " + "second(s)"  + " ('+v6+'%)'%>";
  // console.log(tRemaining);
  // if(tRemaining >= 60){
  //   tUsed = Math.round(tUsed/60);
  //   tRemaining = Math.round(tRemaining/60);
  //   aLabel = "<%=v3+' " + "minute(s)"  + " ('+v6+'%)'%>";
  // }
  var dataUsed = [tUsed];
  var dataRemaining = [tRemaining];


  var datasets = [ 
     {
        fillColor : "rgba(51,153,255,.9)",
        strokeColor : "rgba(51,153,255,1)",
        data : dataRemaining,
        title : "Time Remaining"
     },
     {
        fillColor : "rgba(51,153,255,0.2)",
        strokeColor : "rgba(51,153,255,1)",
        data : dataUsed,
        title : "Time Spent"
     }
  ];
  var barData = {
     labels: [''],
     datasets: datasets
  };

  //ChartOpts.annotateLabel = aLabel;
  // ChartOpts = { "annotateDisplay" : true, 
  //             "scaleStartValue": 0,
  //             "annotateBorderRadius": '5px',
  //             "annotateLabel": aLabel,
  //             "scaleShowGridLines": false,
  //             "xAxisBottom": true,
  //             "yAxisLeft": false,
  //             "showYLabels": 2,
  //             "showYAxisMin": true,
  //             "graphMin": 0,

  // };
  updateChart(document.getElementById("timeRemainingGraph").getContext("2d"), barData, ChartOpts);
  //new Chart(document.getElementById("timeRemainingGraph").getContext("2d")).HorizontalStackedBar(barData, options);

  // End chart
    
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
      var update = JSON.stringify({page:currPage, category:category});
      chrome.runtime.sendMessage({req: "update", update:update}, function(response) { start_timer(); });

    });

    li.appendChild(a);
    dropdown.appendChild(li);

  }
}


function start_timer(){
  console.log("start_timer");
  chrome.runtime.sendMessage({req: "endTime"}, function(response) {
    // If not logged in do nothing
    if(!response.loggedIn){
      console.log("not logged in");
      return;
    }
    if(response.restricted == true) {
      // Hide the add page div
      var addPageDiv = document.getElementById('addCurrentPageDiv');
      addPageDiv.setAttribute('style', 'display: none');
      // Start the interval to update the countdown div
      endTime = Date.parse(response.endTime);
      timeAllowed = response.timeAllowed;
      type = response.type;
      // Create chart here
      ChartOpts = { "annotateDisplay" : true, 
                    "scaleStartValue": 0,
                    "annotateBorderRadius": '5px',
                    "annotateLabel": "<%=v3+' seconds ('+v6+'%)'%>",
                    "scaleShowGridLines": false,
                    "xAxisBottom": false,
                    "yAxisLeft": false,
                    "showYAxisMin": true,
                    "graphMin": 0,
                    "annotateRelocate": true

      };
      var barData = {
        labels: [],
        datasets: [
          {
            fillColor : "rgba(51,153,255,.9)",
            strokeColor : "rgba(51,153,255,1)",
            data : [0],
            title : "Time Remaining"
         },
         {
            fillColor : "rgba(255,51,51,0.2)",
            strokeColor : "rgba(51,153,255,1)",
            data : [0],
            title : "Time Spent"
         } ]
      };
      TRChart = new Chart(document.getElementById("timeRemainingGraph").getContext("2d")).HorizontalStackedBar(barData, ChartOpts);


      setTimeInt = setInterval(set_time, 1000);
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
    redirectCurrentTab("localhost:3000/user_settings");
    window.close();
  }, false);



}, false);


