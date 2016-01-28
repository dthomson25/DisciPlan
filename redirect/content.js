var newdiv = document.createElement('div'); 
newdiv.setAttribute('id','DisciPlanDiv');
var timeOpened = new Date();
newdiv.innerHTML = timeOpened.toString();
document.body.appendChild(newdiv);



chrome.runtime.sendMessage({time: "remaining"}, function(response) {
    console.log(response.time);
    alert("rec message...");
    // if(response.time){
    //   deadline = new Date(response.time);
    //   timeinterval = setInterval(updateClock, 1000);
    // }
    // if(response.defaultSite){
    //   console.log("Already redirected...")
    // }
  });