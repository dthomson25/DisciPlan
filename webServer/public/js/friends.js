function follow() {
	// var resultField = document.getElementById("resultField")
	var labels = document.getElementsByClassName("box")
	var toFollow = []
	for (var i = 0; i < labels.length; i++) {
		if (labels[i].checked) {
			toFollow.push(labels[i].value)
		}
	}

	if (toFollow.length == 0) {
		return false;
	}

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var success = document.getElementById("success");
			success.style.display = "block";
			
		} else {
			return;
		}
	}
	// build query string
	var queryString = ""
	for (var i = 0; i < toFollow.length; i++) {
		if (queryString != "") {
			queryString += "&"
		}
		queryString += "id" + i + "=" + toFollow[i]
	}

	xhr.open("GET", "http://localhost:3000/followUsers?" + queryString)
	xhr.send()

}

window.onload = function () {

	var searchBar = document.getElementById("textbar")
	var followButton = document.getElementById("followButton")

	followButton.onclick = function() { follow() }

	searchBar.onkeyup = function(event) {
		event = event || window.event;
		var searchString = searchBar.value;
		var xhr = new XMLHttpRequest();
		var success = document.getElementById("success")
		success.style.display = "none";
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var state_json = JSON.parse(this.responseText);
				var resultField = document.getElementById("resultField")
				var resultHTML = ""
				for (var i = 0; i < state_json.length; i++) {
					// console.log(state_json[i]);
					resultHTML += "<label class=\"checkbox\"><input type=\"checkbox\" class=\"box\" name=\"option"
					+ i + "\" value=\"" + state_json[i].userID + "\">" + state_json[i].userID + "</label>"
				}
				resultField.innerHTML = resultHTML
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
