// chrome.browserAction.onClicked.addListener(function(tab) {
// 	chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
// 	      chrome.tabs.update(tab.id, {url: "http://www.google.com"});
// 	});
// });

var currSite;

function RestrictedList(category, sites, remainingTime, totalAllowedTime) {
  this.category = category;
  this.sites = sites;
  this.remainingTime = remainingTime;
  this.totalAllowedTime = totalAllowedTime
}

var socialRestrictions = new RestrictedList("Social Media",["http://www.facebook.com",
  "http://www.twitter.com"],[0,0,15],[0,0,30])

var deadline;
var defaultSite = false;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  deadline = new Date(Date.parse(new Date()) + 60 * 1000);
  console.log(deadline);
  console.log(tab.url);
  if(tab.url == "http://www.stanford.edu/") {
  	defaultSite = true;
  }
  else {
  	defaultSite = false;
  }
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





