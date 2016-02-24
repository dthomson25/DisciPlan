
chrome.extension.onMessage.addListener(function(response, sender, sendResponse) {
  if(response.action == "notify"){
    var message = "You have used all of your time in: " + response.category + "\nGet to work!";

    var maxZ = Math.max.apply(null, 
	    $.map($('body *'), function(e,n) {
	      if ($(e).css('position') != 'static')
	        return parseInt($(e).css('z-index')) || 1;
	}));

    $.notify(message, {position:'bottom right', autoHide: false});
	$(".notifyjs-corner").css("z-index",maxZ+1);
  }
});
