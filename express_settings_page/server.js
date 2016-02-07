var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
	console.log('Get to /');
	res.render('navbar_fixed_top', {current: '/'});

});

app.get('/settings', function(req, res) {
	console.log('Get to /settings');

	categories = [{ name: 'Social', time: 20}, { name: 'Sports', time: 20 }, { name: 'Entertainment', time: 20}];
	urls = [[{ name: 'facebook.com' }, { name: 'twitter.com'}],
	        [{ name: 'espn.com' }, { name: 'sportscenter.com'}],
	        [{ name: 'cnn.com' }, { name: 'usatoday.com'}]];

	res.render('settings', {title: 'DisciPlan Settings',
						    categories: categories, 
						    url_lists: urls,
						    urls: [{ name: 'facebook.com' }, { name: 'twitter.com'},],
						    current: '/settings'
						   });
	
});

app.get('/usage', function(req, res) {
	res.render('usage', {message: 'This will be graphs.',
		                 current: '/usage'
		                });
});




app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
