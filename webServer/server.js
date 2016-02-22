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
    var sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
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
    var command = "insert into TimeSpent values(??,??,??,??);";
    var inserts = ['\'danthom\'', "\'" + domainName + "\'", "\'" + sqlDateTimeStr + "\'", req.body.duration];
    var sql = msq.format(command,inserts);
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

app.get('/usage_premium/view/:userId', function(req, res) {
    var command = "select domainName from PremiumUserDomains where userID = ??;";
    var inserts = ['\'' + req.params.userId + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows){
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            if (rows.length == 0) {
                res.sendStatus(400);
            }
            else {
                command = "select T.userID, sum(timeSpent) as duration from TimeSpent as T where T.domainName in (select domainName from PremiumUserDomains as P where P.userID = ??) group by T.userID;";
                var inserts = ['\'' + req.params.userId + '\''];
                sql = msq.format(command,inserts);
                sql = sql.replace(/`/g,"");
                console.log(sql);
                con.query(sql,function(err,rows) {
                    if(err){
                        console.log("error: " + err);
                        res.sendStatus(400);
                    }
                    else {
                        var d = formatBarChartData(rows,'userID');
                        res.render('usage_premium', {
                            title: "Domain Visitors",
                            message: "Here's who's looking at your site:",
                            data: JSON.stringify(d)
                        });
                    }
                });
            }
        }
    });
});

function shortDateStr(date) {
    var s = (date.getUTCMonth()+1).toString();
    s += "/" + date.getUTCDate().toString();
    s += "/" + date.getUTCFullYear().toString();
    return s;
}

function versusTimeQuery(userId,numDays) {
    var currDate = new Date();
    currDate.setUTCSeconds(0);
    currDate.setUTCMinutes(0);
    currDate.setUTCHours(0);
    var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
    currDate = prevDate;
    prevDate = new Date(currDate.getTime() - 24*60*60*1000);

    inserts = [];
    var totalCommand = "select * from (";
    for(var i = 0; i < numDays; i++) {
        if(i > 0) {
            totalCommand += " union ";
        }
        totalCommand += "select \'" + shortDateStr(currDate) + "\' as date, sum(timeSpent) as duration, domainName from TimeSpent as T" + i.toString() + " where userID = ?? and startTime < ?? and startTime > ?? group by domainName";
        inserts.push('\'' + userId + '\'');
        inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
        inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
        currDate = prevDate;
        prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
    }
    totalCommand += ") as Result order by domainName;";
    var sql = msq.format(totalCommand,inserts);
    sql = sql.replace(/`/g,"");
    console.log(sql);
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            return null;
        }
        else {
            return rows;
        }
    });
}

function formatLineChartData(rows) {
    var d = [];
    var values = [];
    currDomainName = "";
    for (var i = 0; i < rows.length; i++) {
        if(currDomainName != rows[i].domainName) {
            currDomainName = rows[i].domainName;
        }
    }
    return null;
}

function getVersusTimeChartData(userId,numDays) {
    var rows = versusTimeQuery(userID numDays);
    if (rows == null) {
        return null;
    }
    else {
        d = formatLineChartData(rows);
    }
}


//Graph page
app.get('/usage/view/:userID', function(req,res) {
    var command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? group by domainName;";
    var inserts = ['\'' + req.params.userID + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows) {    
            if(err) {
                console.log("error 1: " + err);
                res.sendStatus(400);
            }
            else {
                console.log(rows);
                var d1 = [];
                for(var i = 0; i < rows.length; i++) {
                    d1.push({value : rows[i].duration, label: rows[i].domainName});
                }
                d2 = getVersusTimeChartData(req.params.userID,10);
                if (d2 == null) {
                    res.send(400);
                }
                res.render('usage', {
                title: 'Browser Usage',
                message: 'Hello, ' + req.params.userID + '!',
                data1: JSON.stringify(d1),
                data2: JSON.stringify(d2)
                });
            }
    });
});

function formatDoughnutChartData(rows,sortType) {
    var d = [];
    if(sortType == "category") {
        for(var i = 0; i < rows.length; i++) {
            d.push({value : rows[i].duration, label: rows[i].category});
        }
    }
    else {
        for(var i = 0; i < rows.length; i++) {
            d.push({value : rows[i].duration, label: rows[i].domainName});
        }
    }
    return d;
}

function formatBarChartData(rows,sortType) {
    lbls = [];
    values = [];
    if(sortType == "category") {
        for(var i = 0; i < rows.length; i++) {
            lbls.push(rows[i].category);
            values.push(rows[i].duration);
        }
    }
    else if (sortType == "domainName"){
        for(var i = 0; i < rows.length; i++) {
            lbls.push(rows[i].domainName);
            values.push(rows[i].duration);
        }
    }
    else {
        for(var i = 0; i < rows.length; i++) {
            lbls.push(rows[i].userID);
            values.push(rows[i].duration);
        } 
    }
    var d = {labels : lbls, datasets : [{data: values, fillColor: "rgba(230,255,0,1)"}]};
    return d;
}

app.post('/usage/update',bodyParser.urlencoded({extended : false}), function(req,res) {
    var sortType = req.body.sortType;
    var date = new Date(req.body.startTime);
    var chartType = req.body.chartType;
    var command = "";
    var inserts = [];
    if(sortType == "category") {
        command = "select * from (select category, sum(TimeSpent) as duration from Categories as C, TimeSpent as T where C.userId = T.userId and C.userId = ?? and C.domainName = T.domainName and T.startTime > ?? group by category union select \'other\' as category, sum(TimeSpent) as duration from TimeSpent as T1 where T1.userId = ?? and not exists(select * from Categories as C1 where T1.userId = C1.userId and T1.domainName = C1.domainName) group by category) as A";
        inserts = ['\'danthom\'','\'' + sqlFormatDateTime(date) + '\'', '\'danthom\''];
    }
    else {
        command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? and startTime > ?? group by domainName";
        inserts = ['\'danthom\'', '\'' + sqlFormatDateTime(date) + '\''];
    }
    var sql = msq.format(command, inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows){
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            var d = null;
            if (chartType == "doughnut") {
                d = formatDoughnutChartData(rows,sortType);
            }
            else {
                d = formatBarChartData(rows,sortType);
            }
            console.log(d);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(d));
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
    var timeAllowed = JSON.parse(req.body["time_allowed"])
    var categoryName = JSON.parse(req.body["category_name"])

    var category = ""
    console.log(timeAllowed)
    async.series([
        function(callback) {
            if (categoryName.length == 0) {
                callback()
                return
            }
            category = categoryName[1]
            var command = "UPDATE Settings SET category = ? WHERE userId = ? and category = ?"
            var inserts = [categoryName[1],req.params.userId,categoryName[0]]
            sql = msq.format(command,inserts);
            console.log("query 1: ");
            console.log(sql);
            con.query(sql, function(err) {
                    console.log("error possible")
                    if (err){
                        return err;
                    } 
                    console.log("no error")
                    callback()
            })
        },
        function(callback) {
            async.forEach(urlsToDeletes, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                category = url[0]
                var command = "DELETE FROM Categories WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[1],req.params.userId,url[0]]
                sql = msq.format(command,inserts);
                console.log("query 2: ");
                console.log(sql);
                con.query(sql,callback())
                }, function(err) {
                    if (err){
                        return (err);
                    } 
                    callback()
            },callback)
        },
        function(callback) {
            async.forEach(urlToAdds, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                category = url[0]
                command = "INSERT into Categories values(??,??,??)"
                insert = ["\"" +req.params.userId+ "\"", "\"" +url[1]+ "\""," \"" +url[0] + "\""]
                sql = msq.format(command,insert);
                sql = sql.replace(/`/g,"");
                console.log("query 3: ");
                console.log(sql);
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
                category = url[0]
                var command = "UPDATE Categories SET domainName = ? WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[2],url[1],req.params.userId,url[0]]
                sql = msq.format(command,inserts);
                console.log("query 4: ");
                console.log(sql);
                con.query(sql,callback())
                }, function(err) {
                    if (err){
                        return err;
                    } 
                    callback()

            })
        },
        function(callback) {
            if (timeAllowed.length == 0) {
                callback()
                return
            }
            category = timeAllowed[0]
            var command = "UPDATE Settings SET timeAllowed = ? WHERE userId = ? and category = ?"
            var inserts = [timeAllowed[1],req.params.userId,timeAllowed[0]]
            sql = msq.format(command,inserts);
            console.log("query 5: ");
            console.log(sql);
            con.query(sql, function(err) {
                    console.log("error possible")
                    if (err){
                        return err;
                    } 
                    console.log("no error")
                    callback()
            })
        }
        
    ], function(err) {
        if (err) return err;
        if (category != "") {
            res.send(category)
            return
        }
        res.sendStatus(204)
        return
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


