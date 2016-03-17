
window.onload = function () {

	var searchBar = document.getElementById("textbar")

	searchBar.onkeyup = function(event) {
		event = event || window.event;
		var searchString = searchBar.value;
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var state_json = JSON.parse(this.responseText);
				var resultField = document.getElementById("resultField")
				resultField.innerHTML = ""
				for (var i = 0; i < state_json.length; i++) {
					console.log(state_json[i]);
					resultField.innerHTML += "<label class=\"checkbox\"><input type=\"checkbox\" name=\"option"
					+ i + "\">" + state_json[i].userID + "</label>"
				}
			}

		}
		if (searchString == "") {
			var resultField = document.getElementById("resultField")
				resultField.innerHTML = ""
		} else {
			var form = "?" + "userId=" + searchString
			xhr.open("GET", "http://localhost:3000/findUsers" + form)
			xhr.send();
		}

		return false;
	}

}
