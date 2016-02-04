var msq = require('mysql');

var con = msq.createConnection({
    host: "localhost",
    user: "root",
    port: "3306",
    password: "Goal5179",
    database: "disciplan",
    socketPath: "/tmp/mysql.sock"
});

con.connect(function(err) {
    if (err) {
        console.log("error connecting to db: " + err);
        process.exit(0);
    }
    else {
        console.log("success");
    }
});

var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
	console.log('Get to /');
	res.send('Home page.');

});

app.get('/user_settings', function(req, res) {
	console.log('Get to /user_settings');

	categories = [{ name: 'Social', time: 20}, { name: 'Sports', time: 20 }, { name: 'Entertainment', time: 20}];
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


app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});


app.post('/usage/record', bodyParser.urlencoded({extended : false}), function(req,res) {
    console.log('request for /usage/record at ' + (new Date()).toString());
    //console.log(req);
    console.log(req.body.domainName);
    res.sendStatus(200);
});
//YYYY-MM-DD HH:MM:SS

con.query("select count(*) from Categories",function(err,rows){
    if(err) {
        console.log(err);
    }
    else{
        console.log(rows);
    }
});
