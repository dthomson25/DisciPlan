var newUrls = {}
var newCategories


var categoryTitleAndRemaingTime = "<label for=\"category\" class=\"control-label editH2\"><h2 class=\"text-info\">Social Media</h2></label><br><label for=\"remainingTime\" class=\"control-label editH2\"><h2 class=\"text-info\">0:10:00</h2></label>"
var category = "<div class=\"input-group\"><span class=\"input-group-btn\"><button class=\"btn btn-default\" type=\"button\">Edit!</button></span><input type=\"text\" class=\"form-control new-url\" value=\"\"><span class=\"input-group-btn delete-url\"><button class=\"btn btn-default\" type=\"button\">Delete!</button></span></div><!-- /input-group -->"
var container = "<div class=\"jumbotron categories\">" +categoryTitleAndRemaingTime + category + "<button class=\"btn btn-default addUrl\" type=\"button\">+</button></div>" 


$('.main').on("click", ".editH2",function() {
 if ($(this).find('.text-info').text() == "") return
 var text = $(this).find('.text-info').text();
 var input = $('<input id="attribute" type="text" value="' + text + '" />')
 $(this).find('.text-info').text('').append(input);
 input.select();
 input.blur(function() {
  if ( $('#attribute').val() != "") {
    text = $('#attribute').val()
    appendSaveButton($('#attribute').closest(".categories"))
  }
  $('#attribute').parent().text(text);
  $('#attribute').remove();
 });
});

function hiddenValue(value) {
  return "<input type='hidden' value='" + value + "' >"
}

function savedEditedCategory(editedCategory) {
  editedCategory.find(".deleted-url").remove()
  editedCategory.find(".edited-url").each(function(index) {
    var input = $(this)
    input[0].disabled = true
    $(this).parent().next().val(input.val())
    $(this)[0].value = input.val()
    $(this).removeClass("edited-url")
  })
  editedCategory.find(".new-url").each(function(index) {
    var input = $(this)
    input[0].disabled = true
    input.removeClass("new-url")
    console.log(input.parent().parent())
    input.parent().after(hiddenValue(input.val()))
  })
  editedCategory.find(".save").remove()
  editedCategory.removeClass("edited-category")
}

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

function findChangedCategory(category) {
  var categoryName = category.find("h2").text()
  var prevName = category.find("h2").next().val()
  if (categoryName != prevName) return [prevName,categoryName]
  return []
}

function findChangedTime(category) {
  var categoryName = category.find("h2").text()
  var allowedTime = category.find("small").text()
  var prevTime = category.find("small").next().val()
  if (allowedTime != prevTime) return [categoryName,parseInt(allowedTime)]
  return []
}


function sendSaveRequest(listOfDbChanges) {
  console.log(listOfDbChanges)
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/user_settings/danthom/save',true);
  xhr.addEventListener('readystatechange', function(evt) {
      if (xhr.readyState === 4) {
          if (xhr.status === 200) {
              var category = xhr.responseText
              var editedCategory = $(".edited-category").find("h2").
                filter(':contains(' + category + ')').closest(".edited-category")
              savedEditedCategory(editedCategory)

          }
          else {
              console.log("ERROR: status " + xhr.status);
          }
      }
  })
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  url_changes = "url_change=" + JSON.stringify(listOfDbChanges[0])
  delete_url = "&delete_url=" + JSON.stringify(listOfDbChanges[1])
  add_url = "&add_url=" + JSON.stringify(listOfDbChanges[2])
  category_name = "&category_name=" + JSON.stringify(listOfDbChanges[3])
  time_allowed = "&time_allowed=" + JSON.stringify(listOfDbChanges[4])
  xhr.send( url_changes + delete_url + add_url + category_name + time_allowed);
}

//Change remaining time when time allowed is changed.
$(".main").on("click",".save",function() {
  var category = $(this).closest(".categories")
  urlsToChange = findChangedUrls(category)
  urlsToDelete = findDeletedUrls(category)
  urlsToAdd = findNewUrls(category)
  changedCategory = findChangedCategory(category)
  changedTime= findChangedTime(category)

  sendSaveRequest([urlsToChange,urlsToDelete,urlsToAdd,changedCategory,changedTime])
  
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
