
function register() {
	var username = document.getElementById("username").value
	var password = document.getElementById("password").value
	var email = document.getElementById("email").value
	var first_name = document.getElementById("first_name").value
	var last_name = document.getElementById("last_name").value
	var day = document.getElementById("day").value
	var month = document.getElementById("month").value
	var year = document.getElementById("year").value
	var dateString = month + "-" + day + "-" + year
	

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState === 4) {

			if (this.status === 200) {
				// Great success.
				chrome.cookies.set({url: "http://localhost", name: "disciplan", value: username, domain: null})
				var success = document.getElementById("success")
				success.innerHTML = "Successfully Registered!\nFollow the link back to the main page, or reopen the extension"
				success.style = "block"
				// chrome.runtime.sendMessage({redirect: "http://popup.html"})
			} else  {
				// Failure, error, etc
				console.log("failure")
				document.getElementById("error_text").innerHTML = this.responseText
				document.getElementById("error_text").style = "block";
				return;
			}
		}

	}

	var form = "?" + "userId=" + username + "&password=" + password + "&email=" + email + "&first_name=" + first_name
	 + "&last_name=" + last_name + "&birthday=" + dateString
	xhr.open("GET", "http://localhost:3000/register" + form)
	xhr.send();

	return false;
}

window.onload = function () {
	var register_button = document.getElementById("register_button")
	register_button.onclick = function() { register() };
}