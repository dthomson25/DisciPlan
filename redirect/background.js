// chrome.browserAction.onClicked.addListener(function(tab) {
// 	chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
// 	      chrome.tabs.update(tab.id, {url: "http://www.google.com"});
// 	});
// });

var currSite;
var currRestriction;
var currTimeoutId;
var currTime = new Date();
var defaultSite = false;



 // datepart: 'y', 'm', 'w', 'd', 'h', 'n', 's'
Date.dateDiff = function(fromdate, todate) {  
  var diff = todate - fromdate;
  return [Math.floor(diff/3600000),Math.floor(diff/60000),Math.floor(diff/1000)];
}

var redirctURL = "http://www.stanford.edu/"

//TODO
var domainComparison = function() {};

function RestrictedList(category, sites, remainingTime, totalAllowedTime) {
  this.category = category;
  this.sites = sites;
  this.remainingTime = remainingTime;
  this.totalAllowedTime = totalAllowedTime
  this.checkSite = function(siteToCheck) {
    for (var j = 0; j < sites.length; j++) {
      if (siteToCheck.indexOf(sites[j]) != -1) {
        return true;
      }
    }
    return false
  };

  //TODO Fix example 0,1,2 - 0,0,5
  this.usedTime = function(usedTimeArr) {
    for (var i = 0; i < remainingTime.length; i++) {
      this.remainingTime[i] = this.remainingTime[i] - usedTimeArr[i]
    }
    console.log(this.remainingTime)
  };

  this.remainingTimeToTime = function() {
    return (60 * 60 * this.remainingTime[0] + 60 * this.remainingTime[1] + this.remainingTime[2])*1000
  }
}

//TODO add code to clean urls
var socialRestrictions = new RestrictedList("Social Media",["facebook.com",
  "twitter.com"],[0,0,15],[0,0,30])

var restrictedSitesArr = [socialRestrictions]


var checkRestrictedSite = function(tabId, changeInfo, tab) {
  //TODO add more complex URL checking.
  if (currSite == tab.url) return "Same";
  console.log(tab.url)
  if(currRestriction != null) {
    window.clearTimeout(currTimeoutId)
    console.log(Date.dateDiff(currTime, new Date()))
    socialRestrictions.usedTime(Date.dateDiff(currTime, new Date()))
  }

  currSite = tab.url;
  currRestriction = null;
  for (var i = 0; i < restrictedSitesArr.length; i++) {
    if(restrictedSitesArr[i].checkSite(currSite)) {
      currRestriction = restrictedSitesArr[i];
    }
  }
  if (currRestriction == null) return;

  //set timeout and store id
  currTime = new Date()
  console.log(currRestriction.remainingTime)
  currTimeoutId = window.setTimeout(function() {
    console.log("BOOM! F@ck!")

  }, currRestriction.remainingTimeToTime());
}

chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if(tab.url == redirctURL) {
  	defaultSite = true;
    return;
  }
  checkRestrictedSite(tabId, changeInfo, tab)
  defaultSite = false;

});


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	console.log("deadline: " + deadline);
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.time == "remaining")
    	if(defaultSite){
    		sendResponse({defaultSite: true})
    	}
    	else{
    		sendResponse({time: deadline.toJSON()});
    	}
});





