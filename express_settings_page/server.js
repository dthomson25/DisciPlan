var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
	console.log('Get to /');

	res.render('index', {title: 'DisciPlan Settings', 
						 message: 'Your settings will be here I promise!',
						 urls: [{ name: 'facebook.com' }, { name: 'twitter.com'}]
						});
});

app.get('/user_settings', function(req, res) {
	res.send('Got a get request at /user_settings');
});


app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
