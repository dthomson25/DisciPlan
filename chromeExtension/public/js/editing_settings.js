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

//TODO escape text for security
//Change remaining time when time allowed is changed.
$(".save").click(function() {
 	var listOfCategoryDefs = []
  	$(".categories").each(function(index) {
  		var categoryName = $(".text-info",this)[0].innerHTML;
    	var timeAllowed = $(".text-info",this)[1].innerHTML;
    	var urls = []
    	$(".form-control",this).each(function(index) {
    		urls.push(this.value)
  		})
  		categoryDef = {"category" : categoryName, "timeallowed" : timeAllowed, "urls" : urls }
  		listOfCategoryDefs.push(categoryDef)
  	});
  	console.log(listOfCategoryDefs)
});

$(".main").on("click",".editUrl",function (argument) {
$(this).next()[0].disabled = false
});

//TODO Add undo button for 10 seconds
//TODO Add remove Category button
$(".main").on("click",".deleteUrl",function(argument) {
console.log($(this))
$(this).parent().remove()
});

var categoryTitleAndRemaingTime = "<label for=\"category\" class=\"control-label editH2\"><h2 class=\"text-info\">Social Media</h2></label><br><label for=\"remainingTime\" class=\"control-label editH2\"><h2 class=\"text-info\">0:10:00</h2></label>"
var category = "<div class=\"input-group\"><span class=\"input-group-btn editUrl\"><button class=\"btn btn-default\" type=\"button\">Edit!</button></span><input type=\"text\" class=\"form-control\" value=\"\"><span class=\"input-group-btn deleteUrl\"><button class=\"btn btn-default\" type=\"button\">Delete!</button></span></div><!-- /input-group -->"
var container = "<div class=\"jumbotron categories\">" +categoryTitleAndRemaingTime + category + "<button class=\"btn btn-default addUrl\" type=\"button\">+</button></div>" 
//TODO don't add another box until a valid url is added.
$(".main").on("click", ".addUrl",function (argument) {
var plusButton = $(this);
console.log(plusButton.prev().children("form-control").value)
$(this).before(category)
});

$(".addCategory").click( function (argument) {
$(".main").append(container)
});
