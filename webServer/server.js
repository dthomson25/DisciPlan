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

var http = require('http').Server(app);
var io = require('socket.io')(http);

var differentTypes = ["Redirect","Notifications","Nuclear"]
var resetIntervalOptions = {3600 : "Every 60 minutes", 5400  : "Every 1 hour 30 minutes",7200 : "Every 2 hours", 10800 : "Every 3 hours", 14400 : "Every 4 hours", 21600 : "Every 6 hours", 43200 : "Every 12 hours",86400: "Every 24 hours"}

app.use(bodyParser.json());

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));

// app.listen(3000, function () {
//     console.log('Example app listening on port 3000!');
// });

http.listen(3000, function () {
    console.log('DisciPlan Server listening on port 3000!');
});

function getDisciplanCookie(cookies) {
    var re = new RegExp("disciplan=([a-zA-z0-9]*)");
    var matches = re.exec(cookies);
    if (matches == null) return null;
    if (matches.length > 1) {
        return re.exec(cookies)[1];
    }
    else {
        return -1;
    }
}

// Maps usernames to socket ids
var users = [];

io.on('connection', function(socket) {
    console.log('A user connected!');
    socket.on('set username', function(name){
        console.log('Set username');
        console.log("socket id: " + socket.id);
        users[name] = socket.id;
        socket.username = name;
        socket.emit('username set');
        //users[name] = socket.id;
    });

    socket.on('get settings', function() {
        var userId = socket.username;
        var socketId = users[userId];
        console.log("Request for settings from : "+ userId);


//
        sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
            ,[userId]);
        con.query(sql, function(err,rows) {
            if(err) {
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                console.log(rows); 
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("settings object", rows);
                }
                //res.send(rows);
            }
        });

//
    }); // End on get settings

    socket.on('get time remaining', function (){
        var userId = socket.username;
        var socketId = users[userId];

        sql = msq.format("select * from Settings where userId = ? ORDER BY timeAllowed;"// or order by timeRemaining
            ,[userId]);
        con.query(sql, function(err,rows) {
            if(err) {
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                console.log(rows); 
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("all time remaining", rows);
                }
                //res.send(rows);
            }
        });
    }); // End on all time remaining

    socket.on('get top unres sites', function() {
        var userId = socket.username;
        var socketId = users[userId];
         sql = msq.format("select domainName, SUM(timeSpent) as TotalTime from Timespent T where domainName not in (Select C.domainName from Categories C where userID = ?) group by domainName order by totalTime desc limit 8;"
            ,[userId]);
        con.query(sql, function(err,rows) {
            if(err) {
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                console.log("top unres sites");
                console.log(rows); 
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("top unres sites", rows);
                }
                //res.send(rows);
            }
        });
    }); // End on get top unres sites



    socket.on('Reset_allTR', function() {
        var userId = socket.username;
        var socketId = users[userId];
        console.log("Reset all time remaining from : " + userId);


//
        // Update time remaining for all categories then send new setting back
        sql = msq.format("select * from Settings where userId = ? ;"
            ,[userId]);
        con.query(sql, function(err,rows) {
            if(err) {
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                recursiveQuery = function(rows, currRow, user) {
                    if(currRow >= rows.length){
                        // If all of the time remainings are updated send settings back.
                        sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                            ,[userId]);
                        con.query(sql, function(err,rows) {
                            if(err) {
                                console.log("error: " + err);
                                if (io.sockets.connected[socketId]){
                                    io.to(socketId).emit("error", err);
                                }
                            }
                            else {
                                if (io.sockets.connected[socketId]){
                                    io.to(socketId).emit("all RT reset", rows);
                                }
                            }
                        });
                        return;
                    }
                    category = rows[currRow].category;
                    timeAllowed = rows[currRow].timeAllowed;
                    var command = "update Settings SET timeRemaining = ? WHERE userId = ? AND category = ?;";
                    var inserts = [timeAllowed, userId, category];
                    sql = msq.format(command,inserts);
                    con.query(sql, function(err) {
                        if(err){
                            console.log("error: " + err);
                            if (io.sockets.connected[socketId]){
                                io.to(socketId).emit("error", err);
                            }
                            return;
                        }
                        else {
                            console.log("command:\n" + sql + "\nsucceeded!");
                            recursiveQuery(rows, currRow + 1, userId);
                        }
                    });
                };
                recursiveQuery(rows, 0, userId);
            }
        });

//

    }); // End on Reset_allTR

    socket.on('update_cat_TR', function(up) {
        var userId = socket.username;
        var socketId = users[userId];
        console.log("Update time remaining from : " + userId);
        var update = JSON.parse(up);
        var category = update.category;
        var TR = update.TR;
        console.log("UPDATE: CAT: " + category + " TR: " + TR);

//
        var command = "update Settings SET timeRemaining = ? WHERE userId = ? AND category = ?;";
        var inserts = [TR, userId, category];
        sql = msq.format(command,inserts);
        con.query(sql, function(err) {
            if(err){
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                console.log("command:\n" + sql + "\nsucceeded!");
                //sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                 //   ,[userId]);
                sql = msq.format("select * from Settings where userId = ? ORDER BY timeAllowed;"// or order by timeRemaining
                    ,[userId]);
                con.query(sql, function(err,rows) {
                    if(err) {
                        console.log("error: " + err);
                        if (io.sockets.connected[socketId]){
                            io.to(socketId).emit("error", err);
                        }
                    }
                    else {
                        if (io.sockets.connected[socketId]){
                            io.to(socketId).emit("RT updated", rows);
                        }
                    }
                });
            }
        });
//
    }); // End on update_cat_TR

    socket.on('add page', function(up) {
        var userId = socket.username;
        var socketId = users[userId];
        var update = JSON.parse(up);
        var page = update.page;
        var category = update.category;

//
        var command = "insert into Categories values(??,??,??)";
        var inserts = ["\'" + userId +"\'","\'" +  page + "\'","\'" + category + "\'"];
        sql = msq.format(command,inserts);
        sql = sql.replace(/`/g,"");
        con.query(sql, function(err) {
            if(err){
                console.log("error: " + err);
                if (io.sockets.connected[socketId]){
                    io.to(socketId).emit("error", err);
                }
            }
            else {
                console.log("command:\n" + sql + "\nsucceeded!");
                sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                    ,[userId]);
                con.query(sql, function(err,rows) {
                    if(err) {
                        console.log("error: " + err);
                        if (io.sockets.connected[socketId]){
                            io.to(socketId).emit("error", err);
                        }
                    }
                    else {
                        if (io.sockets.connected[socketId]){
                            // Send back new settings
                            io.to(socketId).emit("page added", rows);
                        }
                    }
                });
            }
        });
//
    }); // End on add page


});


app.get('/', function (req, res) {
    res.render('navbar_fixed_top', {current: '/'});

});

app.get('/user_settings', function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log('Get to /user_settings for user: ' + userId)
    rowsToShow = []
    async.series([
        function(callback) {
            var sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                ,[userId]);
            console.log(sql)
            con.query(sql, function(err,rows) {
                if (err){
                     callback(err);
                     return
                }
                console.log(rows)

                for (var i = 0; i < rows.length; i++) {
                    rowsToShow.push(rows[i])
                }               
                callback()

            })
        }, 
        function(callback) {
            var sql = msq.format("select userID, category, type, resetInterval,timeAllowed from settings S where S.category not in (select C.category from categories C);"
                ,[userId]);
            console.log(sql)
            con.query(sql, function(err,rows) {
                console.log(rows)
                if (err){
                     callback(err);
                     return
                }
                console.log(rows)
                for (var i = 0; i < rows.length; i++) {
                    rowsToShow.push(rows[i])
                }

                callback()
            })
        }], 
        function(err) { 
            if(err) {
                console.log("error: " + err);
                res.sendStatus(400);
            }
            else {
                console.log(rowsToShow)
                res.render('settings', {title: 'DisciPlan Settings', 
                     message: 'This is your settings page!',
                     rows: rowsToShow, 
                     current: '/user_settings',
                     setting_types: differentTypes,
                     resetIntervals: resetIntervalOptions
                    });
            }
        })
});

app.get('/user_login', function(req,res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    if (userId != null)
        res.render('login_page', {title: "Login Page",
            message: "You're already logged in",
            user_id: userId});
    else
        res.render('login_page', {title: "Login Page",
            message: "Login or register",
            user_id: "null"});
});


app.get('/friends', function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    if (userId == null) res.render('login_page', {title: "Login Page"});
    res.render('friends', {title: "Friend Page",
        message: 'This is dumb'
        });
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
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log(sqlDateTimeStr);
    console.log(req.body.domainName);
    var domainName = req.body.domainName.replace("`","");
    var command = "insert into TimeSpent values(??,??,??,??);";
    var inserts = ["\'" + userId + "\'", "\'" + domainName + "\'", "\'" + sqlDateTimeStr + "\'", req.body.duration];
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

app.get('/usage_premium/view', function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    var command = "select domainName from PremiumUserDomains where userID = ??;";
    var inserts = ['\'' + userId + '\''];
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
                var inserts = ['\'' + userId + '\''];
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

function versusTimeQuery(userId, numDays,dataSet1,res) {
    var dates = [];
    var currDate = new Date();
    currDate.setUTCSeconds(0);
    currDate.setUTCMinutes(0);
    currDate.setUTCHours(0);
    currDate = new Date(currDate.getTime() + 24*60*1000);
    var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
    dates.push(shortDateStr(prevDate));

    var result = [];
    inserts = [];
    var totalCommand = "select * from (";
    for(var i = 0; i < numDays; i++) {
        if(i > 0) {
            totalCommand += " union ";
        }
        totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, domainName from TimeSpent as T" + i.toString() + " where userID = ?? and startTime < ?? and startTime > ?? group by domainName";
        inserts.push('\'' + userId + '\'');
        inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
        inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
        currDate = prevDate;
        prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
        dates.unshift(shortDateStr(prevDate));
    }
    totalCommand += ") as Result order by domainName;";
    var sql = msq.format(totalCommand,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.send(400);
        }
        else {
            formatLineChartData(rows,dates,userId,dataSet1,res);
        }
    });
}

function formatLineChartData(rows,dates,userId,dataSet1,res) {
    var currDomainName = "";
    domainNames = {};
    domainSet = new Set();
    domainsArr = [];
    for (var i = 0; i < rows.length; i++) {
        if (!domainSet.has(rows[i].domainName)) {
            domainSet.add(rows[i].domainName);
            domainsArr.push(rows[i].domainName);
        }
    }
    for (var i = 0; i < domainsArr.length; i++) {
        domainNames[domainsArr[i]] = {};
    }

    for (var i = 0; i < rows.length; i++) {
        domainNames[rows[i].domainName][rows[i].date] = rows[i].duration;
    }

    var d = {};
    d.labels = dates;
    var dsets = [];


    for (var i = 0; i < domainsArr.length; i++) {
        var dataPoints = [];
        for (var j = 0; j < dates.length; j++) {
            if (dates[j] in domainNames[domainsArr[i]]) {
                dataPoints.push(domainNames[domainsArr[i]][dates[j]]);
            }
            else {
                dataPoints.push(0);
            }
        }
        dsets.push({label : domainsArr[i], data : dataPoints, strokeColor : "rgba(230,255,0,1)"});
    }
    d.datasets = dsets;
    var command = "select distinct category from Categories where userID = ??;";
    var inserts = ['\'' + userId + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    console.log(sql);
    con.query(sql,function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            var arr = [];
            for(var i = 0; i < rows.length; i++) {
                arr.push(rows[i].category);
            }
            console.log(arr);
            res.render('usage', {
                title: 'Browser Usage',
                message: 'Hello, ' + userId + '!',
                data1: JSON.stringify(dataSet1),
                data2: JSON.stringify(d),
                categories : JSON.stringify(arr)
            }); 
        }
    });


}

//Graph page
app.get('/usage/view', function(req,res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log(userId);
    var command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? group by domainName;";
    var inserts = ['\'' + userId + '\''];
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

                versusTimeQuery(userId,10,d1,res);
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

app.post('/usage/update/left/:userID',bodyParser.urlencoded({extended : false}), function(req,res) {
    var sortType = req.body.sortType;
    var date = new Date(req.body.startTime);
    var chartType = req.body.chartType;
    var command = "";
    var inserts = [];
    var userId = getDisciplanCookie(req.headers.cookie);
    if(sortType == "category") {
        command = "select * from (select category, sum(TimeSpent) as duration from Categories as C, TimeSpent as T where C.userId = T.userId and C.userId = ?? and C.domainName = T.domainName and T.startTime > ?? group by category union select \'other\' as category, sum(TimeSpent) as duration from TimeSpent as T1 where T1.userId = ?? and not exists(select * from Categories as C1 where T1.userId = C1.userId and T1.domainName = C1.domainName) group by category) as A";
        inserts = ['\'' + userId + '\'','\'' + sqlFormatDateTime(date) + '\'', '\'' + userId + '\''];
    }
    else {
        command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? and startTime > ?? group by domainName";
        inserts = ['\'' + userId + '\'', '\'' + sqlFormatDateTime(date) + '\''];
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

function getNumberOfDays(then) {
    var now = new Date();
    var diff = now.getTime() - then.getTime();
    return Math.floor(diff / (1000*60*60*24));
}

app.post('/usage/update/right/:userID',bodyParser.urlencoded({extended : false}), function(req,res) {
    var category = req.body.category;
    var date = new Date(req.body.startTime);
    var numToView = req.body.numToView;
    var numDays = getNumberOfDays(date);
    //versusTimeOneCategoryQuery(category,req.params.userID,)

});

app.get('/get_settings', function(req, res) {
    console.log(req.headers.cookie);
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log("Request for settings...");
    sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
        ,[userId]);
    console.log(userId)
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

app.get('/login/', function(req, res) {
    sql = msq.format("select * from Users where userId = ? and password = ?;",[req.query.userId, req.query.password]);
    con.query(sql, function(err, rows) {
        if (err) {
            console.log ("error" + err)
            res.sendStatus(400)
        } else {
            res.send(rows)
        }
    });
});


app.get('/register/', function(req, res) {
    sql = msq.format("select * from Users where userId = ?;", [req.query.userId]);
    con.query(sql, function(err, rows) {
        if (err) {
            console.log ("error" + err)
            res.sendStatus(400)
        } else {
            if (rows.length > 0) {
                var message = "That userId is already taken"
                console.log(message)
                res.status(400).send(message)
                return;
            } else {    // Insert the new user
                /** TODO: Change this at some point to getting an actual birthday **/
                var sqlDate = sqlFormatDateTime(new Date());
                sql = msq.format("INSERT INTO Users VALUES (?, ?, ?, ?, ?, ?, 0);",
                    [req.query.userId, req.query.email, req.query.first_name,
                      req.query.last_name, req.query.password, sqlDate]);
                con.query(sql, function(err,rows) {
                    if (err) {
                        console.log("error" + err)
                        res.sendStatus(400)
                    } else {
                        res.sendStatus(200)
                    }
                });
            }
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

app.post('/user_settings/save', bodyParser.urlencoded({extended : false}), function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log("In save: socket.id = " + users[userId]);
    // saveSettings(req)
    console.log(req.body)
    var urlToChanges = JSON.parse(req.body["url_change"]) 
    var urlsToDeletes = JSON.parse(req.body["delete_url"])
    var urlToAdds = JSON.parse(req.body["add_url"])
    var timeAllowed = JSON.parse(req.body["time_allowed"])
    var type = JSON.parse(req.body["type"])
    var resetInterval = JSON.parse(req.body["reset_interval"])
    var categoryName = JSON.parse(req.body["category_name"])

    var category = ""
    async.series([
        function(callback) {
            if (categoryName.length == 0) {
                callback()
                return
            }
            category = categoryName[1]
            var command = "UPDATE Settings SET category = ? WHERE userId = ? and category = ?"
            var inserts = [categoryName[1],userId,categoryName[0]]
            sql = msq.format(command,inserts);
            console.log("query 1: ");
            console.log(sql);
            con.query(sql, function(err) {
                    if (err){
                         callback(err);
                         return
                    }
                    callback()
            })
        },
        function(callback) {
            if (type.length == 0) {
                callback()
                return
            }
            category = type[1]
            var command = "UPDATE Settings SET type = ? WHERE userId = ? and category = ?"
            var inserts = [type[1],userId,type[0]]
            sql = msq.format(command,inserts);
            console.log(sql)
            con.query(sql, function(err) {
                    if (err){
                         callback(err);
                         return
                    }
                    callback()
            })
        },
        function(callback) {
            if (resetInterval.length == 0) {
                callback()
                return
            }
            category = resetInterval[1]
            var command = "UPDATE Settings SET resetInterval = ? WHERE userId = ? and category = ?"
            var inserts = [resetInterval[1],req.params.userId,resetInterval[0]]
            sql = msq.format(command,inserts);
            console.log(sql)
            con.query(sql, function(err) {
                console.log(err)
                    if (err){
                         callback(err);
                         return
                    }
                    callback()
            })
        },
        function(callback) {
            async.forEach(urlsToDeletes, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                category = url[0]
                var command = "DELETE FROM Categories WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[1],userId,url[0]]
                sql = msq.format(command,inserts);
                con.query(sql, function(err) {
                    console.log("error possible")
                    if (err){
                        callback(err)
                        return
                    } 
                    callback()
                })
                }, function(err) {
                    if (err){
                        callback(err)
                        return
                    } 
                    callback()
            },callback)
        },
        function(callback) {
            async.forEach(urlToAdds, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                category = url[0]
                command = "INSERT into Categories values(??,??,??)"
                insert = ["\"" +userId+ "\"", "\"" +url[1]+ "\""," \"" +url[0] + "\""]
                sql = msq.format(command,insert);
                sql = sql.replace(/`/g,"");
                con.query(sql,function(err) {
                    if (err){
                        callback(err)
                        return
                    } 
                    callback()
                })
                }, function(err) {
                    if (err){
                        callback(err)
                        return
                    } 
                    callback()

            })
        },
        function(callback) {
            async.forEach(urlToChanges, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                category = url[0]
                var command = "UPDATE Categories SET domainName = ? WHERE domainName = ? and userId = ? and category = ?"
                var inserts = [url[2],url[1],userId,url[0]]
                sql = msq.format(command,inserts);
                con.query(sql,function(err) {
                    if (err){
                        callback(err)
                        return
                    } 
                    callback()
                })
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
            var inserts = [timeAllowed[1],userId,timeAllowed[0]]
            sql = msq.format(command,inserts);
            console.log("query 5: ");
            console.log(sql);
            con.query(sql, function(err) {
                    if (err){
                        return err;
                    } 
                    callback()
            })
        }
        
    ], function(err) {
        console.log(err)
        if (err)  {
            var message = "Unknown Error"
            if (err.code == "ER_DUP_ENTRY")
                message = "Duplicate entry"
            res.status(400).send(message);
            return
        }
        if (category != "") {
            res.send(category)
            return
        }
        res.sendStatus(204)
        return
    })
    
    // TODO Jeff when settings saved send info back
    // var socketId = users[userId];
    // sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
    //     ,[userId]);
    // con.query(sql, function(err,rows) {
    //     if(err) {
    //         console.log("error: " + err);
    //         if (io.sockets.connected[socketId]){
    //             io.to(socketId).emit("error", err);
    //         }
    //     }
    //     else {
    //         console.log("Sending settings back in SAVE!!!! should be last hopefully"); 
    //         console.log(rows);
    //         if (io.sockets.connected[socketId]){
    //             io.to(socketId).emit("settings object", rows);
    //         }
    //     }
    // });


});

app.post('/user_settings/create_category', bodyParser.urlencoded({extended : false}), function(req, res) {
    console.log(req.params)
    console.log(req.body)
    var userId = getDisciplanCookie(req.headers.cookie);
    var categoryName = JSON.parse(req.body["category_name"])
    var timeAllowed = JSON.parse(req.body["time_allowed"])
    var type = JSON.parse(req.body["type"])
    var resetInterval = JSON.parse(req.body["reset_interval"])
    var domainName = JSON.parse(req.body["domain_names"])
    async.series([
        function(callback) {
            var command = "INSERT INTO Settings (userID,category,type,timeAllowed,timeRemaining,resetInterval) VALUES(?,?,?,?,?,?)"
            var inserts = [userId, categoryName, type,
            timeAllowed.toString(),timeAllowed.toString(),resetInterval.toString()]
            sql = msq.format(command,inserts);
            console.log(sql)
            con.query(sql, function(err) {
                    if (err){
                         callback(err);
                         return
                    }
                    console.log("New Setting!")
                    callback()

            })
        },
        function(callback) {
            console.log("second callback")
            async.forEach(domainName, function(url, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                var command = "INSERT INTO Categories (userID,domainName,category) VALUES(?,?,?)"
                var inserts = [userId,url,categoryName]
                sql = msq.format(command,inserts);
                console.log(sql)
                con.query(sql,function(err) {
                    if (err){
                        console.log(err)
                        callback(err)
                        return
                    } 
                    console.log("New Category")
                    callback()

                })
                }, function(err) {
                    if (err){
                        return err;
                    } 
                    callback()
                })
        }
    ], function(err) {
        console.log(err)
        if (err)  {
            var message = "Unknown Error"
            if (err.code == "ER_DUP_ENTRY")
                message = "Duplicate entry"
            res.status(400).send(message);
            return
        }
        if (categoryName != "") {
            res.send(categoryName)
            return
        }
        res.sendStatus(204)
        return
    })
})

app.post('/user_settings/delete_category', bodyParser.urlencoded({extended : false}), function(req, res) {
    console.log(req.params)
    console.log(req.body)
    var userId = getDisciplanCookie(req.headers.cookie);
    var categoryName = JSON.parse(req.body["category_name"]) 
    async.series([
        function(callback) {
            var command = "DELETE FROM Settings where userID = ? and category = ?"
            var inserts = [userId, categoryName]
            sql = msq.format(command,inserts);
            console.log(sql)
            con.query(sql, function(err) {
                    if (err){
                         callback(err);
                         return
                    }
                    console.log("Deleted Setting!")
                    callback()

            })
        },
        function(callback) {
            console.log("second callback")
            var command = "DELETE FROM Categories where userId = ? and category= ?"
            var inserts = [userId,categoryName]
            sql = msq.format(command,inserts);
            console.log(sql)
            con.query(sql,function(err) {
                if (err){
                    console.log(err)
                    callback(err)
                    return
                } 
                console.log("Deleted Category")
                callback()

            })
        }
    ], function(err) {
        if (err)  {
            console.log(err)

            var message = "Unknown Error"
            if (err.code == "ER_DUP_ENTRY")
                message = "Duplicate entry"
            res.status(400).send(message);
            return
        }
        console.log("All good!")

        res.sendStatus(204)
        return
    })
})

app.get('/newtab_page', function(req, res){
    // Get user name from cookie
    var userId = getDisciplanCookie(req.headers.cookie);

    sql = msq.format("select * from Settings as S where S.userId = ? ORDER BY S.Category;"
        ,[userId]);

    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            // res.render('settings', {title: 'DisciPlan Settings', 
            //      message: 'This is your settings page!',
            //      rows: rows, 
            //      current: '/user_settings',
            //      setting_types: differentTypes
            //     });
            console.log(rows);
        }
    });

});

