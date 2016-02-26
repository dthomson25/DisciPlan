(function(window, document, undefined) {

   function getRemainingTimes() {
      // Send message to get remaining times for each category
      chrome.runtime.sendMessage({req: "newtab"}, function(response){
         console.log(response.username);
         if(response.username){
            console.log(response.categories);
            var categories = response.categories;
            var labels = [];
            var dataUsed = [];
            var dataRemaining = [];
            for(i = categories.length-1; i >= 0; i--){
               labels.push(categories[i].category);
               dataRemaining.push(categories[i].timeRemaining);
               dataUsed.push(categories[i].timeAllowed - categories[i].timeRemaining);
            }

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
               labels: labels,
               datasets: datasets
            };

            options = { "annotateDisplay" : true, 
                        "annotateBorderRadius": '5px',
                        "showYLabels": 2, 
                        annotateLabel: "<%=v3+' seconds ('+v6+'%)'%>",
                        legend: true,
                        legendPosY: 0
            };
            new Chart(document.getElementById("timeRemainingCanvas").getContext("2d")).HorizontalStackedBar(barData, options);
            // TODO on right of chart add countdown until new interval
         }
         
      });
   }

   window.addEventListener("DOMContentLoaded", function(){
      getRemainingTimes();    
   });

})(this, this.document);


