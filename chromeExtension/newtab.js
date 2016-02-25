// chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
//       chrome.tabs.update(tabs[0].id, {url: "localhost:3000"});
//   });

(function(window, document, undefined) {
   var timeRemainingDiv = document.getElementById('timeRemainingDiv');

   // var timeRemainingTemplate  = document.getElementById('time-remaining-template').innerHTML;

   // var templates = { 
   //    renderTimeRemaing : Handlebars.compile(timeRemainingTemplate)
   // };


   // function getRemainingTimes() {
   //    // Send message to get remaining times for each category
   //    chrome.runtime.sendMessage({req: "newtab"}, function(response){
   //       console.log(response.settings);
   //       var siteList = response.settings;
   //       var entryList = [];
   //       var categoryList = [];
   //       for(i = 0; i < siteList.length; i++){
   //          var currCategory = siteList[i].category;
   //          var RT = siteList[i].timeRemaining;
   //          var AT = siteList[i].timeAllowed;
   //          var entry = {category: currCategory, timeRemaining: RT, timeAllowed: AT};
   //          if(categoryList.indexOf(currCategory) == -1){
   //             categoryList.push(currCategory);
   //             entryList.push(entry);
   //          }
   //       }
   //       console.log(entryList);
   //       timeRemainingDiv.innerHTML = templates.renderTimeRemaing({category:entryList[0].category});

   //    });
   // }

   function getRemainingTimes() {
      var http_newtab = new XMLHttpRequest();
      http_newtab.onreadystatechange = function() {
         if (http_newtab.readyState == 4 && http_newtab.status == 200) {
            //settings_JSON = JSON.parse(http_newtab.responseText);
         }
      };
      http_newtab.open("GET", "http://localhost:3000/newtab_page", true);
      http_newtab.send();
   }



   window.addEventListener("DOMContentLoaded", function(){
      getRemainingTimes();

      
   });




})(this, this.document);


