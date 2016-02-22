
chrome.extension.onMessage.addListener(function(response, sender, sendResponse) {
  if(response.action == "notify"){
    var message = "You have used all of your time in: " + response.category + "\nGet to work!";
    $.notify(message, {position:'bottom right', autoHide: false});
  }
});
