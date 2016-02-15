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
    res.render('navbar_fixed_top', {current: '/'});

});

app.get('/user_settings/:userId', function(req, res) {
	console.log('Get to /user_settings for user: ' + req.params.userId);
    sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
        ,[req.params.userId]);
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            res.render('settings', {title: 'DisciPlan Settings', 
                 message: 'This is your settings page!',
                 rows: rows, 
                 current: '/user_settings'
                });
        }
    });

});


app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});

function pad(n, width) {
  z = '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function sqlFormatDateTime(d) {
    var yyyy = d.getUTCFullYear().toString();
    var mm = pad((d.getUTCMonth()+1),2);
    var dd = pad(d.getUTCDate(),2);
    var hh = pad(d.getUTCHours(),2);
    var min = pad(d.getUTCMinutes(),2);
    var ss = pad(d.getUTCSeconds(),2);
    return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':' + ss;
}

app.post('/usage/record', bodyParser.urlencoded({extended : false}), function(req,res) {
    var startDateTime = new Date(req.body.startTime);
    var sqlDateTimeStr = sqlFormatDateTime(startDateTime);
    console.log(sqlDateTimeStr);
    console.log(req.body.domainName);
    var domainName = req.body.domainName.replace("`","");
    var command = "insert into TimeSpent values(??,??,??,??,??)";
    var inserts = ['\'danthom\'', "\'" + domainName + "\'",'NULL', "\'" + sqlDateTimeStr + "\'", req.body.duration];
    sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err) {
        if(err){
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log("command:\n" + sql + "\nsucceeded!");
            res.sendStatus(204);
        }
    });
});

app.get('/usage/view/', function(req,res) {
    con.query("select domainName, sum(timeSpent) as duration from TimeSpent where userID = \'danthom\' group by domainName", function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.send(400);
        }
        else {
            console.log(rows);
            var d = [];
            for(var i = 0; i < rows.length; i++) {
                d.push({value : rows[i].duration, label: rows[i].domainName});
                console.log(d[i]);
            }
            res.render('usage', {
            title: 'Browser Usage',
            message: 'Your usage by site:',
            data: JSON.stringify(d)
            });
        }
    });
});

app.get('/get_settings/:userId', function(req, res) {
    sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
        ,[req.params.userId]);
    console.log(req.params.userId)
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log(rows); 
            res.send(rows);
        }
    });
});



