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

var socialRestrictions = new RestrictedList("Social Media",["https://www.facebook.com/",
  "http://www.twitter.com"],[0,0,15],[0,0,30])

var deadline;
var defaultSite = false;


Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

/*
 * Returns false if url is not in restricted sites and remaining time if it is.
*/
function isRestricted(url){
  var restrictedSites = socialRestrictions.sites;
  if(restrictedSites.contains(url)){
    return socialRestrictions.remainingTime;
  }
  return false
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  deadline = new Date(Date.parse(new Date()) + 60 * 1000);
  // console.log(deadline);
  // console.log(tab.url);

  console.log(tab.url)
  var remainTime = isRestricted(tab.url);
  if(remainTime != false){
    console.log("sent message");


    if (changeInfo.status == 'complete') {   
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {text: "getStuff"}, function(response) {
          if(response.type == "test"){
            console.log('test received');
          }
        });  
      });
    }


  }

  // if(tab.url == "http://www.stanford.edu/") {
  // 	defaultSite = true;
  // }
  // else {
  // 	defaultSite = false;
  // }
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
    		sendResponse({remainingTime: 0});
    	}
});






