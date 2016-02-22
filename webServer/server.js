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
var async = require('async'); 


app.use(bodyParser.json());

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

//Graph page
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
    console.log("Request for settings...");
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

function deleteUrls(urlsToDeletes) {
    for(var i = 0; i < urlsToDeletes.length; i++) {
        var command = "DELETE from Categories where category = ? and domainName = ? and userId = ?";
        var inserts = [urlsToDeletes[0],urlsToDeletes[1],'danthom']
        sql = msq.format(command,inserts);
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
    }
}

app.post('/user_settings/:userId/save', bodyParser.urlencoded({extended : false}), function(req, res) {
    console.log(req.params)
    console.log(req.body)
    var userId = req.params["userId"]
    var urlToChanges = JSON.parse(req.body["url_change"]) 
    var urlsToDeletes = JSON.parse(req.body["delete_url"])
    var urlToAdds = JSON.parse(req.body["add_url"])
    console.log(urlToAdds)
    async.series([
        function(callback) {
            async.forEach(urlsToDeletes, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                var command = "DELETE FROM Categories WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[1],req.params.userId,url[0]]
                sql = msq.format(command,inserts);
                console.log(sql)
                con.query(sql,callback())
                }, function(err) {
                    if (err){
                        console.log("FUCK!")
                        return (err);
                    } 
                    console.log("WIN1!!")
                    callback()
            },callback)
        },
        function(callback) {
            async.forEach(urlToAdds, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                command = "INSERT into Categories values(??,??,??)"
                insert = ["\"" +req.params.userId+ "\"", "\"" +url[1]+ "\""," \"" +url[0] + "\""]
                sql = msq.format(command,insert);
                sql = sql.replace(/`/g,"");
                console.log(sql)
                con.query(sql,callback())
                }, function(err) {
                    if (err){
                        return err;
                    } 
                    callback()

            })
        },
        function(callback) {
            async.forEach(urlToChanges, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                var command = "UPDATE Categories SET domainName = ? WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[2],url[1],req.params.userId,url[0]]
                sql = msq.format(command,inserts);
                console.log(sql)
                con.query(sql,callback())
                }, function(err) {
                    if (err){
                        return err;
                    } 
            })
        }
    ], function(err) {
        if (err) return err;
        res.sendStatus(204)
    })
    
});




app.post('/update_TR', function(req, res) {
    var user = req.body.user;
    var category = req.body.category;
    var TR = req.body.TR;

    var command = "update Settings SET timeRemaining = ? WHERE userId = ? AND category = ?;";
    var inserts = [TR, user, category];
    sql = msq.format(command,inserts);
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

    // TODO: What do we send back?

});



app.post('/reset_allTR', function(req, res) {
    var user = req.body.user;

    sql = msq.format("select * from Settings where userId = ? ;"
        ,[user]);
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            recursiveQuery = function(rows, currRow, user) {
                if(currRow >= rows.length){
                    res.sendStatus(200);
                    return;
                }
                category = rows[currRow].category;
                timeAllowed = rows[currRow].timeAllowed;
                var command = "update Settings SET timeRemaining = ? WHERE userId = ? AND category = ?;";
                var inserts = [timeAllowed, user, category];
                sql = msq.format(command,inserts);
                con.query(sql, function(err) {
                    if(err){
                        console.log("error: " + err);
                        res.sendStatus(400);
                        return;
                    }
                    else {
                        console.log("command:\n" + sql + "\nsucceeded!");
                        recursiveQuery(rows, currRow + 1, user);
                    }
                });
            };
            recursiveQuery(rows, 0, user);
        }
    });
});

app.post('/add_page', function(req, res) {
    var user = req.body.user;
    var page = req.body.page;
    console.log(page);
    var category = req.body.category;

    var command = "insert into Categories values(??,??,??)";
    var inserts = ["\'" + user +"\'","\'" +  page + "\'","\'" + category + "\'"];
    sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    console.log(sql);
    con.query(sql, function(err) {
        if(err){
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log("command:\n" + sql + "\nsucceeded!");
            sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                ,[user]);
            con.query(sql, function(err,rows) {
                if(err) {
                    console.log("error: " + err);
                    res.sendStatus(400);
                }
                else {
                    res.send(rows);
                }
            });
        }
    });
});

app.get('/newtab_page/:userId', function(req, res){
    var userId = req.params["userId"];
    console.log("Newtab for " + userId);
    

    
});
