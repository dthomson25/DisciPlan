(function(window, document, undefined) {

   function getRemainingTimes() {
      // Send message to get remaining times for each category
      chrome.runtime.sendMessage({req: "newtab"}, function(response){
         console.log(response.username);
         if(response.username){
            // Create chart
            console.log(response.categories);
            var categories = response.categories;
            var labels = [];
            var dataUsed = [];
            var dataRemaining = [];
            var fillSpent = [];
            var strokeSpent = [];
            for(i = categories.length-1; i >= 0; i--){
               labels.push(categories[i].category);
               if(categories[i].timeRemaining <= 0){
                  dataRemaining.push(0);
                  dataUsed.push(categories[i].timeAllowed);
                  fillSpent.push("rgba(255,51,51,0.2)");
                  strokeSpent.push("rgba(255,51,51,1)");
               }
               else{
                  dataRemaining.push(categories[i].timeRemaining);
                  dataUsed.push(categories[i].timeAllowed - categories[i].timeRemaining);
                  fillSpent.push("rgba(51,153,255,0.2)");
                  strokeSpent.push("rgba(51,153,255,1)")
               }
            }

            var datasets = [ 
               {
                  fillColor : "rgba(51,153,255,.9)",
                  strokeColor : "rgba(51,153,255,1)",
                  data : dataRemaining,
                  title : "Time Remaining"
               },
               {
                  fillColor : fillSpent,
                  strokeColor : strokeSpent,
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
                        legendPosY: 0,
            };
            new Chart(document.getElementById("timeRemainingCanvas").getContext("2d")).HorizontalStackedBar(barData, options);
            // TODO on right of chart add countdown until new interval

            var sites = response.sites;
            console.log(sites);
            for(i = 0; i < sites.length; i++){
               var divId = "site" + (i+1);
               var currDiv = document.getElementById(divId);
               currDiv.innerHTML = "";
               var link = document.createElement('a');
               console.log(sites[i].domainName);
               link.target = "_blank";
               link.innerHTML = sites[i].domainName;
               currDiv.appendChild(link);

            }

            $('a').hover(function() {
               $(this).css('cursor','pointer');
            }, function() {
                $(this).css('cursor','auto');
            });
            $('a').click(function() {
               var link = $(this).text();
               if(link == "newtab" || link == "extensions" || link == "history" || link == "settings" || link == "help")
                  link = "chrome://" + link;
               else
                  link = "http://" + link;

               console.log(link);
               chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                  console.log(tabs[0]);
                  chrome.tabs.update(tabs[0].id, {url: link});
                });

            })

         }
         
      });
   }

   window.addEventListener("DOMContentLoaded", function(){
      getRemainingTimes();    
   });

})(this, this.document);


