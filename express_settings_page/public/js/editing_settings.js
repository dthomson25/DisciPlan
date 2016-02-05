
$(".save").click(function() {
        $()        
      });

      $(".container").on("click",".edit",function (argument) {
        $(this).next()[0].disabled = false
      });

      //Add undo button for 10 seconds
      $(".container").on("click",".delete",function(argument) {
        console.log($(this))
        $(this).parent().remove()
      });

      //TODO don't add another box until a valid url is added.
      $(".add").click(function (argument) {
        var plusButton = $(this);
        console.log(plusButton.prev().children("form-control").value = "10")
        $(this).before("<div class=\"input-group\"><span class=\"input-group-btn edit\"><button class=\"btn btn-default\" type=\"button\">Edit!</button></span><input type=\"text\" class=\"form-control\" value=\"\"><span class=\"input-group-btn delete\"><button class=\"btn btn-default\" type=\"button\">Delete!</button></span></div><!-- /input-group -->")
      });