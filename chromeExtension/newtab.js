(function(window, document, undefined) {

   var motivationalQuotes = [
      ["Either you run the day or the day runs you.", "-Jim Rohn"],
      ["Good, better, best. Never let it rest. 'Til your good is better and your better is best.", "-St. Jerome"],
      ["When you reach the end of your rope, tie a knot in it and hang on.", "-Franklin D. Roosevelt"],
      ["Accept the challenges so that you can feel the exhilaration of victory.", "-George S. Patton"],
      ["In order to succeed, we must first believe that we can.", "-Nikos Kazantzakis"],
      ["Failure will never overtake me if my determination to succeed is strong enough.", "-Og Mandino"],
      ["What you do today can improve all your tomorrows.", "-Ralph Marston"],
      ["A creative man is motivated by the desire to achieve, not by the desire to beat others.", "-Ayn Rand"],
      ["You are never too old to set another goal or to dream a new dream.", "-C. S. Lewis"],
      ["The secret of getting ahead is getting started.", "-Mark Twain"],
      ["Don't watch the clock; do what it does. Keep going.", "-Sam Levenson"],
      ["It does not matter how slowly you go as long as you do not stop.", "-Confucius"],
      ["Go for it now. The future is promised to no one.", "-Wayne Dyer"],
      ["Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", "-Thomas A. Edison"],
      ["With the new day comes new strength and new thoughts.", "-Eleanor Roosevelt"],
      ["If you can dream it, you can do it.", "-Walt Disney"],
      ["Problems are not stop signs, they are guidelines.", "-Robert H. Schuller"]
   ];
   var quotesLength = motivationalQuotes.length;

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
            var fillRem = [];
            var strokeRem = [];
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
               if(categories[i].type == "Nuclear"){
                  fillRem.push("rgba(255,51,51,.9)");
                  strokeRem.push("rgba(255,51,51,1)");
               }
               else{
                  fillRem.push("rgba(51,153,255,.9)");
                  strokeRem.push("rgba(51,153,255,1)");
               }
            }



            var datasets = [ 
               {
                  //fillColor : fillRem,
                  //strokeColor : strokeRem,
                  fillColor: "rgba(51,153,255,.7)",
                  strokeColor: "rgba(51,153,255,1)",
                  //fillColor: "rgba(171,220,251,.7)",
                  //strokeColor: "rgba(171,220,251,1)",
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
                        scaleFontSize: 20,
                        scaleFontColor: "white"
            };
            new Chart(document.getElementById("timeRemainingCanvas").getContext("2d")).HorizontalStackedBar(barData, options);
            // TODO on right of chart add countdown until new interval -> No


            var quote = motivationalQuotes[Math.floor(Math.random() * quotesLength)];
            var quotePanel = document.getElementById("quotePanel");
            var quoteDiv = document.createElement('div');
            quoteDiv.setAttribute('class', 'quote');
            quoteDiv.innerHTML = quote[0];
            var authorDiv = document.createElement('div');
            authorDiv.setAttribute('class', 'author');
            authorDiv.innerHTML = quote[1];
            quotePanel.appendChild(quoteDiv);
            quotePanel.appendChild(authorDiv);


            var sites = response.sites;
            console.log(sites);
            for(i = 0; i < sites.length; i++){
               var divId = "site" + (i+1);
               var currDiv = document.getElementById(divId);
               currDiv.innerHTML = "";
               var link = document.createElement('a');
               link.setAttribute("class", "thumbnail");
               dName = sites[i].domainName;
               link.target = "_blank";
               link.innerHTML = dName;

               var firstLetter = dName[0];
               if(dName.indexOf("www.") != -1)
                  firstLetter = dName[dName.indexOf("www.") + 4];
               var colorBlock = document.createElement('div');
               colorBlock.setAttribute("class", "colorBlock");
               colorBlock.innerHTML = firstLetter.toUpperCase();
               link.appendChild(colorBlock);


               currDiv.appendChild(link);


            }

            $('a').hover(function() {
               $(this).css('cursor','pointer');
            }, function() {
                $(this).css('cursor','auto');
            });
            $('a').click(function() {
               var link = $(this).text();
               link = link.substring(0, link.length-1);
               if(link == "newtab" || link == "extensions" || link == "history" || link == "settings" || link == "help")
                  link = "chrome://" + link;
               if(link == "localhost")
                  link = "http://localhost:3000"
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


