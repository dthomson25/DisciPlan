var tracker = {};
tracker.prevDate = new Date();
getStartingDomain(tracker);
console.log(tracker);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  checkSettingChangeTab()
    if (tab.url !== undefined && changeInfo.status == "complete") {
        sendXHR(tab.url, tracker);
    }
});

// Update remaning time for last category, cancel timeout, then
// check if current site is restricted and if it is start
// a timeout to redirect page
chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
    checkSettingChangeTab()
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        sendXHR(tabs[0].url, tracker);
    });
});

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     popupRequest(request, sender, sendResponse)
// });
