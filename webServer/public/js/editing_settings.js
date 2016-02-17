var newUrls = {}
var newCategories


var categoryTitleAndRemaingTime = "<label for=\"category\" class=\"control-label editH2\"><h2 class=\"text-info\">Social Media</h2></label><br><label for=\"remainingTime\" class=\"control-label editH2\"><h2 class=\"text-info\">0:10:00</h2></label>"
var category = "<div class=\"input-group\"><span class=\"input-group-btn edited-url\"><button class=\"btn btn-default\" type=\"button\">Edit!</button></span><input type=\"text\" class=\"form-control new-url\" value=\"\"><span class=\"input-group-btn delete-url\"><button class=\"btn btn-default\" type=\"button\">Delete!</button></span></div><!-- /input-group -->"
var container = "<div class=\"jumbotron categories\">" +categoryTitleAndRemaingTime + category + "<button class=\"btn btn-default addUrl\" type=\"button\">+</button></div>" 


//TODO add check for empty string
$('.main').on("click", ".editH2",function() {
 var text = $(this).find('.text-info').text();
 var input = $('<input id="attribute" type="text" value="' + text + '" />')
 $(this).find('.text-info').text('').append(input);
 input.select();
 input.blur(function() {
   var text = $('#attribute').val();
    $('#attribute').parent().text(text);
   $('#attribute').remove();
 });
});



function appendSaveButton(categoryDiv) {
  var className = categoryDiv.attr("class")
  if (className.indexOf("edited-category") == -1) {
    categoryDiv.append("<input class=\"btn btn-success save\" type='submit' value=\"Save\"></input>")
    categoryDiv.addClass("edited-category")
  }
}


function findChangedUrls(category) {
  var categoryName = category.find("h2").text()
  var editedUrls = category.find(".edited-url")
  urlsToChange = []
  for (var index = 0; index < editedUrls.length; index++) {
    var currentInput = $(editedUrls[index])
    var hiddenInput = currentInput.parent().next()
    console.log(hiddenInput.val())
    if (hiddenInput.val() != currentInput.val()) {
      urlsToChange.push([categoryName,hiddenInput.val(),currentInput.val()])
    }
  }
  return urlsToChange
}

function findNewUrls(category) {
  urlsToAdd = []
  var categoryName = category.find("h2").text()
  var addedUrls = category.find(".new-url")
  for (var i = 0; i < addedUrls.length; i++) {
    urlsToAdd.push([categoryName,addedUrls[i].value])
  }
  return urlsToAdd
}

function findDeletedUrls(category) {
  var categoryName = category.find("h2").text()
  var deletedUrls = category.find(".deleted-url")
  var urlsToDelete = []
  for (var i = 0; i < deletedUrls.length; i++) {
    urlsToDelete.push([categoryName,deletedUrls[i].value])
  }
  return urlsToDelete
}

function sendSaveRequest(listOfDbChanges) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/user_settings/danthom/save',true);
  xhr.addEventListener('readystatechange', function(evt) {
      console.log(xhr.readyState)
      if (xhr.readyState === 4) {
          if (xhr.status === 204) {
              console.log("yay");
          }
          else {
              console.log("ERROR: status " + xhr.status);
          }
      }
  })
  console.log(listOfDbChanges[0])
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  xhr.send("url_change=" + JSON.stringify(listOfDbChanges[0]) + "&delete_url=" + JSON.stringify(listOfDbChanges[1]) + "&add_url=" + JSON.stringify(listOfDbChanges[2]));
}
//TODO escape text for security
//Change remaining time when time allowed is changed.
$(".main").on("click",".save",function() {
  var category = $(this).closest(".categories")
  urlsToChange = findChangedUrls(category)
  urlsToDelete = findDeletedUrls(category)
  urlsToAdd = findNewUrls(category)
  sendSaveRequest([urlsToChange,urlsToDelete,urlsToAdd])
  
});

$(".main").on("click",".edit-url-btn",function (argument) {
  if ($(this).next()[0].disabled) {
    var input = $(this).next()
    input.addClass("edited-url")
    $(this).next()[0].disabled = false
  }
  appendSaveButton($(this).closest(".categories"))
});

//TODO Add undo button for 10 seconds
//TODO Add remove Category button
$(".main").on("click",".delete-url",function(argument) {
  appendSaveButton($(this).closest(".categories"))
  $(this).parent().next().addClass("deleted-url")
  $(this).parent().remove()
});


//TODO don't add another box until a valid url is added.
$(".main").on("click", ".add-url",function (argument) {
  var plusButton = $(this);
  $(this).before(category)
  appendSaveButton($(this).closest(".categories")) 
});

$(".addCategory").click( function (argument) {
  $(".main").append(container)
});
