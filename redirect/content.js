var newdiv = document.createElement('div'); 
newdiv.setAttribute('id','DisciPlanDiv');
var timeOpened = new Date();
newdiv.innerHTML = timeOpened.toString();
document.body.appendChild(newdiv);


// chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
// var url = tabs[0].url;



// chrome.runtime.sendMessage({time: "remaining"}, function(response) {
//     console.log(response.time);
//     // if(response.time){
//     //   deadline = new Date(response.time);
//     //   timeinterval = setInterval(updateClock, 1000);
//     // }
//     // if(response.defaultSite){
//     //   console.log("Already redirected...")
//     // }
// });


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("he");
    if (request.text == "getStuff") {
        sendResponse({type: "test"})
    }
});
