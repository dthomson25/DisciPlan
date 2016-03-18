if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

function getCookie(domain, cookie_name, callback) {
	chrome.cookies.get({"url": domain, "name": cookie_name}, function(cookie) {
		if (callback) {
			callback(cookie)
		}
	});
}

function login() {
	var username = document.getElementById("username").value
	var password = document.getElementById("password").value

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState === 4) {

			if (this.status === 200) {
				// Great success.
				var state_json = JSON.parse(this.responseText)
				if (state_json.length > 0) { 
					var login_content = document.getElementById("login_content")
					login_content.style.display = "none"
					var verified_content = document.getElementById("verified_content")
					verified_content.style.display = "block"
					chrome.cookies.set({url: "http://localhost", name: "disciplan", value: username, domain: null});
					var greeting = document.getElementById("greeting");
					greeting.innerHTML = "Hello, " + username;
					// Send username to background script
					chrome.runtime.sendMessage({req: "username", username: username}, function(response) {
						// Start timer or display add page dropdown. Function in popup.js
						if(response.res == "start_timer"){
							start_timer();
						}
					});
				} else {
					document.getElementById("wrong_password").style = "block";
				}
			} else  {
				// Failure, error, etc
				console.log("failure")
				return;
			}
		}

	}

	var form = "?" + "userId=" + username + "&password=" + password
	xhr.open("GET", "http://localhost:3000/login" + form)
	xhr.send();

	return false;
}

function logout() {
	chrome.cookies.remove({url: "http://localhost", name: "disciplan"})
	// Clean up
	document.getElementById("username").value = "";
	document.getElementById("password").value = "";
	var greeting = document.getElementById("greeting");
	greeting.innerHTML = "DisciPlan";
	var login_content = document.getElementById("login_content")
	login_content.style.display = "block"
	var verified_content = document.getElementById("verified_content")
	verified_content.style.display = "none"
	chrome.cookies.set({url: "http://localhost", name: "disciplan", value: username, domain: null});
	
}

window.onload = function() {
	
	// chrome.cookies.remove({url: "http://localhost", name: "disciplan"})
	// Attempt to get a cookie
	getCookie("http://localhost", "disciplan", function(cookie) {
		if (cookie == null) {
			// Display login screen and stuff...
			var verified_content = document.getElementById("verified_content")
			verified_content.style.display = "none"
			// chrome.cookies.set({url: "http://localhost", name: "disciplan", value: "testing 123", domain: null})
		} else {
			var login_content = document.getElementById("login_content")
			login_content.style.display = "none"
		}
	});

	var login_button = document.getElementById("login_button")
	login_button.onclick = function() { login() };

	var logout_button = document.getElementById("logout_button")
	logout_button.onclick = function() { logout() };
}

