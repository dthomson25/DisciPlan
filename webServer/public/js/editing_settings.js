var newUrls = {}
var newCategories

var titleHTML = "<label for=\"category\" class=\"control-label editH2\">\
  <h2 class=\"text-info\">New Category</h2>\
  <input type=\"hidden\" value=\"New Category\" class=\"form-control\">\
  </label>"
var timeAllowedHTML = "<label for=\"remainingTime\" class=\"control-label\">Allowed Time:</label>\
  <div class=\"input-group timeAllowed\">\
  <input type=\"number\" placeholder=\"0\" min=\"0\" aria-describedby=\"sizing-addon2\" class=\"form-control time\">\
  <span class=\"input-group-addon\"> hours</span>\
  <input type=\"number\" placeholder=\"15\" min=\"0\" aria-describedby=\"sizing-addon2\" class=\"form-control time\">\
  <span class=\"input-group-addon\"> minutes</span></div>"  
var typeHTML = "<div class=\"form-group\">\
  <label for=\"sel1\">Type:\
  <select id=\"sel1\" class=\"form-control type\">\
  <option selected=\"selected\">Redirect</option><option>Notifications</option><option>Nuclear</option></select>\
  <input type=\"hidden\" value=\"Redirect\"></label></div>"
var resetIntervalHTML = "<div class=\"form-group\">\
  <label for=\"sel1\">Reset Interval:\
  <select id=\"sel1\" class=\"form-control reset-interval\">\
    <option value=\"3600\">Every 60 minutes</option>\
    <option value=\"5400\">Every 1 hour 30 minutes</option>\
    <option value=\"7200\">Every 2 hours</option>\
    <option value=\"10800\">Every 3 hours</option>\
    <option value=\"14400\">Every 4 hours</option>\
    <option value=\"21600\">Every 6 hours</option>\
    <option value=\"43200\">Every 12 hours</option>\
    <option value=\"86400\">Every 24 hours</option>\
  </select>\<input type=\"hidden\"></label></div>"
var categoryHTML = "<div class=\"input-group\">\
  <span class=\"input-group-btn\">\
    <button class=\"btn btn-default\" type=\"button\">Edit!</button>\
  </span>\
  <input type=\"text\" class=\"form-control new-url\" value=\"\">\
  <span class=\"input-group-btn delete-url\">\
    <button class=\"btn btn-default\" type=\"button\">Delete!</button>\
  </span>\
  </div><!-- /input-group -->"
var plusButtonHTML = "<button class=\'btn btn-default add-url\', type='button'>+</button>"

var containerHTML = "<div class=\"jumbotron categories new-category\">" + titleHTML + 
  "<br>" + timeAllowedHTML + resetIntervalHTML + typeHTML + categoryHTML + plusButtonHTML + "</div>"


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
  var newCategoryName = editedCategory.find("h2").text()
  editedCategory.find("h2").next().val(newCategoryName) 

  var newTime = calculateTime(editedCategory)
  editedCategory.find(".time").each(function(index) {
    $(this)[0].placeholder = $(this).val()
  })
  
  var newResetInterval = editedCategory.find("reset-interval").val()
  editedCategory.find(".reset-interval").next().val(newResetInterval)
  
  var newType = editedCategory.find(".type").val()
  editedCategory.find(".type").next().val(newType)

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
    input.parent().after(hiddenValue(input.val()))
  })
  editedCategory.find(".save").remove()
  editedCategory.removeClass("edited-category")
  editedCategory.removeClass("new-category")
  editedCategory.notify("Edits Saved","success")
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

function calculateTime(category) {
  var time = 0
  var allowedTime = category.find(".timeAllowed input")
  if (allowedTime[0].value == "") {
    time += parseInt(allowedTime[0].placeholder) * 3600
  } else {
    time += parseInt(allowedTime[0].value) * 3600
  }
  if (allowedTime[1].value == "") {
    time += parseInt(allowedTime[1].placeholder) * 60
  }  else {
    time += parseInt(allowedTime[1].value) * 60 
  }
  return time
}

function findChangedTime(category) {
  var categoryName = category.find("h2").text()
  var time = calculateTime(category)
  var allowedTime = category.find(".timeAllowed input")
  var previousTime = parseInt(allowedTime[0].placeholder) * 3600 + parseInt(allowedTime[1].placeholder) * 60
  if (previousTime != time) {
    return [categoryName,time]
  }
  return []
}

function findChangedType(category) {
  var categoryName = category.find("h2").text()
  var type = category.find(".type")
  if (type.val() != type.next().val())
    return [categoryName, type.val()]
  return []
}

function findChangedResetInterval(category) {
  var categoryName = category.find("h2").text()
  var type = category.find(".reset-interval")
  if (type.val() != type.next().val())
    return [categoryName, type.val()]
  return []
}


function lockedCategory(category) {
  category.find(".editH2").removeClass("editH2")
  category.find(".timeAllowed").children()[0].disabled = true
  category.find(".timeAllowed").children()[2].disabled = true
  category.find(".reset-interval")[0].disabled = true
  category.find(".type")[0].disabled = true
  category.find(".delete-category").remove()
  category.find(".add-url").remove();
  category.find(".url").each(function(index) {
    $(this).find(".edit-url-btn").remove()
    $(this).find(".delete-url").remove()

  })

}

function sendSaveRequest(listOfDbChanges) {
  console.log(listOfDbChanges)
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/user_settings/save',true);
  xhr.addEventListener('readystatechange', function(evt) {
      if (xhr.readyState === 4) {
          if (xhr.status === 200) {
              var category = xhr.responseText
              var editedCategory = $(".edited-category").find("h2").
                filter(':contains(' + category + ')').closest(".edited-category")
              savedEditedCategory(editedCategory)
              if(editedCategory.find(".type").val() == "Nuclear") {
                lockedCategory(editedCategory);
              }
          }
          else {
              console.log("ERROR: status " + xhr.responseText);

          }
      }
  })
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  url_changes = "url_change=" + JSON.stringify(listOfDbChanges[0])
  delete_url = "&delete_url=" + JSON.stringify(listOfDbChanges[1])
  add_url = "&add_url=" + JSON.stringify(listOfDbChanges[2])
  category_name = "&category_name=" + JSON.stringify(listOfDbChanges[3])
  time_allowed = "&time_allowed=" + JSON.stringify(listOfDbChanges[4])
  type = "&type=" + JSON.stringify(listOfDbChanges[5])
  reset_interval = "&reset_interval=" + JSON.stringify(listOfDbChanges[6])
  xhr.send( url_changes + delete_url + add_url + category_name + time_allowed + type + reset_interval)
}

function sendCreateCategoryRequest(newCategory) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/user_settings/create_category',true);
  xhr.addEventListener('readystatechange', function(evt) {
      if (xhr.readyState === 4) {
          if (xhr.status === 200) {
              var category = xhr.responseText
              var editedCategory = $(".new-category").find("h2").
                filter(':contains(' + category + ')').closest(".new-category")
              savedEditedCategory(editedCategory) 
          }
          else {

          }
      }
  })
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  category_name = "category_name=" + JSON.stringify(newCategory[0])
  time_allowed = "&time_allowed=" + JSON.stringify(newCategory[1])
  type = "&type=" + JSON.stringify(newCategory[2])
  reset_interval = "&reset_interval=" + JSON.stringify(newCategory[3])
  domainNames = "&domain_names=" + JSON.stringify(newCategory[4])
  xhr.send( category_name + time_allowed + type + domainNames + reset_interval)
}


//Change remaining time when time allowed is changed.
$(".main").on("click",".save",function() {
  var category = $(this).closest(".categories")
  if (category.hasClass("new-category")) {
    newCategory = []
    newCategory.push(category.find("h2").text())
    newCategory.push(calculateTime(category))
    newCategory.push(category.find(".type").val())
    newCategory.push(category.find(".reset-interval").val())
    urls = []
    category.find(".new-url").each(function() {
      urls.push($(this).val())
    })
    newCategory.push()
    newCategory.push(urls)
    console.log(newCategory)
    sendCreateCategoryRequest(newCategory)
    return;
  }
  urlsToChange = findChangedUrls(category)
  for(x in urlsToChange) {
    if (urlsToChange[x][2].length == 0) {
      category.notify("Cannot have an empty url","error")
      return
    }
  }
  urlsToDelete = findDeletedUrls(category)
  urlsToAdd = findNewUrls(category)
  for(x in urlsToAdd) {
    if (urlsToAdd[x][1].length == 0) {
      category.notify("Cannot have an empty url","error")
      return
    }
  }
  changedCategory = findChangedCategory(category)
  changedTime= findChangedTime(category)
  changedType = findChangedType(category)
  changedResetInterval = findChangedResetInterval(category)

  sendSaveRequest([urlsToChange,urlsToDelete,urlsToAdd,changedCategory,changedTime,changedType,changedResetInterval])
  
})

$(".main").on("change",".timeAllowed",function() {
  appendSaveButton($(this).closest(".categories"))
})

$(".main").on("change",".type",function() {
  appendSaveButton($(this).closest(".categories"))
})

$(".main").on("change",".reset-interval",function() {
  appendSaveButton($(this).closest(".categories"))
})

$(".main").on("click",".edit-url-btn",function (argument) {
  if ($(this).next()[0].disabled) {
    var input = $(this).next()
    input.addClass("edited-url")
    $(this).next()[0].disabled = false
  }
  appendSaveButton($(this).closest(".categories"))
})

//TODO Add undo button for 10 seconds
//TODO Add remove Category button
$(".main").on("click",".delete-url",function(argument) {
  appendSaveButton($(this).closest(".categories"))
  $(this).parent().next().addClass("deleted-url")
  $(this).parent().remove()
})


//TODO don't add another box until a valid url is added.
$(".main").on("click", ".add-url",function (argument) {
  var plusButton = $(this);
  $(this).before(categoryHTML)
  appendSaveButton($(this).closest(".categories")) 
});

$(".addCategory").click( function(argument) {
  $(".main").append(containerHTML)
});


function undoChanges(category) {
  if(findChangedType(category) != []) {
    category.find(".type") = category.find(".type").next().val()
  }
  var time = findChangedTime(category)
  var deleted = findDeletedUrls(category)
  var categoryName = findChangedCategory(category)
  var urls = findChangedUrls(category)
  var newUrls = findNewUrls(category)
  var deletedUrls = findDeletedUrls(category)
}


$(".unnuclear").click(function(argument) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3000/user_settings/un_nuke_all',true);
  xhr.addEventListener('readystatechange', function(evt) {
    if (xhr.readyState === 4) {
        if (xhr.status === 204) {
          location.reload();

          // $(".categories").each(function(index) {
          //   var category = $(this)
          //   // if (category.hasClass("edited-category")) {
          //   //   undoChanges(category)
          //   // }
          //   // if (category.hasClass("new-category")) {
          //   //   category.remove()
          //   // }

          //   lockedCategory($(this))
          // })
        }
        else {
          //add notification
        }
    }
  })
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  xhr.send() 
});

$(".nuclear").click(function(argument) {
  if(window.confirm("Please confirm that you want to place all categories in nuclear mode. Note: all unsaved changes will be lost.")) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/user_settings/nuke_all',true);
    xhr.addEventListener('readystatechange', function(evt) {
      if (xhr.readyState === 4) {
          if (xhr.status === 204) {
            location.reload();

            // $(".categories").each(function(index) {
            //   var category = $(this)
            //   // if (category.hasClass("edited-category")) {
            //   //   undoChanges(category)
            //   // }
            //   // if (category.hasClass("new-category")) {
            //   //   category.remove()
            //   // }

            //   lockedCategory($(this))
            // })
          }
          else {
            //add notification
          }
      }
    })
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.send() 
  }
});

$(".main").on("click", ".delete-category",function(argument) {
  if(confirm("Are you sure you want to delete this category.")) {
    var category = $(this).closest(".categories")
    var categoryName = category.find("h2").text()
    var xhr = new XMLHttpRequest();
    console.log("test")
    xhr.open('POST', 'http://localhost:3000/user_settings/delete_category',true);
    xhr.addEventListener('readystatechange', function(evt) {
      if (xhr.readyState === 4) {
          if (xhr.status === 204) {
            category
            category.remove()
          }
          else {

          }
      }
    })
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    category_name = "category_name=" + JSON.stringify(categoryName)
    console.log("test")
    xhr.send( category_name)
  }

})
