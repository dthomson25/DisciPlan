var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
	console.log('Get to /');

	categories = [{ name: 'Social' }, { name: 'Sports' }, { name: 'Entertainment'}];
	urls = [[{ name: 'facebook.com' }, { name: 'twitter.com'}],
	        [{ name: 'espn.com' }, { name: 'sportscenter.com'}],
	        [{ name: 'cnn.com' }, { name: 'usatoday.com'}]];

	res.render('index', {title: 'DisciPlan Settings', 
						 message: 'This is your settings page!',
						 categories: categories, 
						 url_lists: urls,
						 urls: [{ name: 'facebook.com' }, { name: 'twitter.com'}]
						});
});

app.get('/user_settings', function(req, res) {
	res.send('Got a get request at /user_settings');
});


app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
