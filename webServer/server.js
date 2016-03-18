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

http.listen(3000, function () {
    console.log('DisciPlan Server listening on port 3000!');
});

function getDisciplanCookie(cookies) {
    var re = new RegExp("disciplan=([a-zA-z0-9]*)");
    var matches = re.exec(cookies);
    if(matches.length > 1) {
        return re.exec(cookies)[1];
    }
    else {
        return -1;
    }
}

var colorConstants = ["rgba(242,182,50,1)","rgba(205,220,57,1)","rgba(233,30,91,1)","rgba(123,31,162,1)","rgba(33,150,243,1)"];

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
        res.render('settings', {title: "Login Page",
            message: "You're already logged in!"});
    else
        res.render('login_page', {title: "Login Page",
            message: "You don't seem to be logged in!\nLog in or register a new account via your chrome extension.",
            user_id: "null"});
});


app.get('/friends', function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    if (userId == null) {
        res.render('login_page', {title: "Login Page", message: "You don't seem to be logged in!", 
        m2: "Log in or register a new account via your chrome extension."});
    } else {

    res.render('friends', {title: "Friend Page",
        message: "Add people to follow", 
        });
    }
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
    console.log(sql);
    con.query(sql, function(err,rows){
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            if (rows.length == 0) {
                console.log("empty query result");
                res.sendStatus(400);
            }
            else {
                command = "select * from AgeGroupView as A where A.domainName in (select domainName from PremiumUserDomains as P where P.userID = ??);";
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
                        var data1 = formatBarChartData(rows,'AgeGroup');
                        var dates = [];
                        var currDate = new Date();
                        currDate.setUTCSeconds(0);
                        currDate.setUTCMinutes(0);
                        currDate.setUTCHours(0);
                        currDate = new Date(currDate.getTime() + 24*60*1000);
                        var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
                        dates.push(shortDateStr(prevDate));
                        var totalCommand = "select Result.date, Result.domainName, Result.duration from (";
                        var inserts2 = [];
                        for(var i = 0; i < 14; i++) {
                            if(i > 0) {
                                totalCommand += " union ";
                            }
                            totalCommand += "select ?? as date, domainName, sum(timeSpent) as duration from TimeSpent where domainName in (select domainName from PremiumUserDomains as P where P.userID = ??) and startTime < ?? and startTime >= ?? group by domainName";
                            inserts2.push('\'' + shortDateStr(prevDate) + '\'');
                            inserts2.push('\'' + userId + '\'');
                            inserts2.push('\'' + sqlFormatDateTime(currDate) + '\'');
                            inserts2.push('\'' + sqlFormatDateTime(prevDate) + '\'');
                            currDate = prevDate;
                            prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
                            dates.unshift(shortDateStr(prevDate));
                        }
                        totalCommand += ") as Result order by domainName, date;";
                        var sql2 = msq.format(totalCommand,inserts2);
                        sql2 = sql2.replace(/`/g,"");
                        console.log(sql2);
                        con.query(sql2,function(err2,rows2){
                            if(err2) {
                                console.log("error: " + err2);
                                res.sendStatus(400)
                            }
                            else {
                                var data2 = formatMultiDomainLine(rows,dates);
                                res.render('usage_premium', {
                                    title: "Domain Visitors",
                                    message: "hello, " + userId + "!",
                                    data: JSON.stringify({d1 : data1, d2 : data2})
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

function formatMultiDomainBar(rows) {
    lbls = [];
    domainNames = [];
    var dSets = [];
    for(var i = 0; i < rows.length; i++) {
        if(lbls.indexOf(rows[i].AgeGroup) == -1) {
            lbls.push(rows[i].AgeGroup);
        }
        if(domainNames.indexOf(rows[i].domainName) == -1) {
            domainNames.push(rows[i].domainName);
            dSets.push({label : rows[i].domainName, data : [], fillColor : colorConstants[(domainNames.length-1)%colorConstants.length]});
        }
    }
    for(var i = 0; i < domainNames.length; i++) {
        for(var j = 0; j < lbls.length; j++) {
            dSets[i]['data'].push(0);
        }
    }

    for(var i = 0; i < rows.length; i++) {
        dSets[domainNames.indexOf(rows[i].domainName)]['data'][lbls.indexOf(rows[i].AgeGroup)] = rows[i].duration;
    }
    console.log({labels : lbls, datasets : dSets});
    return {labels : lbls, datasets : dSets};
}

function formatMultiDomainLine(rows,dates) {
    var domainNames = [];
    var dSets = [];
    for(var i = 0; i < rows.length; i++) {
        if(domainNames.indexOf(rows[i].domainName) == -1) {
            domainNames.push(rows[i].domainName);
            dSets.push({label : rows[i].domainName, data : [], strokeColor : colorConstants[(domainNames.length-1)%colorConstants.length], pointColor : "rgba(0,0,0,0)", pointStrokeColor : "rgba(0,0,0,0)"});
        }
    }
    for(var i = 0; i < domainNames.length; i++) {
        for(var j = 0; j < dates.length; j++) {
            dSets[i]['data'].push(0);
        }
    }
    for(var i = 0; i < rows.length; i++) {
        dSets[domainNames.indexOf(rows[i].domainName)]['data'][dates.indexOf(rows[i].date)] = rows[i].duration;
    }
    console.log({labels : dates, datasets : dSets});
    return {labels : dates, datasets : dSets};
}

app.post('/usage_premium/compare',bodyParser.urlencoded({extended : false}), function(req,res) {
    var dName = req.body.domainName;
    var userId = getDisciplanCookie(req.headers.cookie);
    command = "select * from AgeGroupView as A where A.domainName in (select domainName from PremiumUserDomains as P where P.userID = ??) or A.domainName = ?? order by domainName;";
    inserts = ['\'' + userId + '\'','\'' + dName + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql,function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            var d1 = formatMultiDomainBar(rows);
            var dates = [];
            var currDate = new Date();
            currDate.setUTCSeconds(0);
            currDate.setUTCMinutes(0);
            currDate.setUTCHours(0);
            currDate = new Date(currDate.getTime() + 24*60*1000);
            var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
            dates.push(shortDateStr(prevDate));
            var totalCommand = "select Result.date, Result.domainName, Result.duration from (";
            var inserts2 = [];
            for(var i = 0; i < 14; i++) {
                if(i > 0) {
                    totalCommand += " union ";
                }
                totalCommand += "select ?? as date, domainName, sum(timeSpent) as duration from TimeSpent where (domainName in (select domainName from PremiumUserDomains as P where P.userID = ??) or domainName = ??) and startTime < ?? and startTime >= ?? group by domainName";
                inserts2.push('\'' + shortDateStr(prevDate) + '\'');
                inserts2.push('\'' + userId + '\'');
                inserts2.push('\'' + dName + '\'');
                inserts2.push('\'' + sqlFormatDateTime(currDate) + '\'');
                inserts2.push('\'' + sqlFormatDateTime(prevDate) + '\'');
                currDate = prevDate;
                prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
                dates.unshift(shortDateStr(prevDate));
            }
            totalCommand += ") as Result order by domainName, date;";
            var sql2 = msq.format(totalCommand,inserts2);
            sql2 = sql2.replace(/`/g,"");
            console.log(sql2);
            con.query(sql2,function(err2,rows2){
                if(err2) {
                    console.log("error: " + err2);
                    res.sendStatus(400)
                }
                else {
                    var d2 = formatMultiDomainLine(rows,dates);
                    res.send(JSON.stringify({data1: d1, data2 : d2}));
                }
            });
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

    inserts = [];
    var totalCommand = "select Result.date, Result.domainName, Result.duration from (";
    for(var i = 0; i < numDays; i++) {
        if(i > 0) {
            totalCommand += " union ";
        }
        totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, domainName from TimeSpent as T" + i.toString() + " where userID = ?? and startTime < ?? and startTime >= ?? group by domainName";
        inserts.push('\'' + userId + '\'');
        inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
        inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
        currDate = prevDate;
        prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
        dates.unshift(shortDateStr(prevDate));
    }
    var inDomainNameSet = "(select T.domainName, sum(T.timeSpent) as duration from TimeSpent as T where T.userID = ?? and T.startTime >= ?? group by T.domainName order by duration desc limit ??)";
    var inserts2 = ['\'' + userId + '\'', '\'' + sqlFormatDateTime(currDate) + '\'', "5"];
    inDomainNameSet = msq.format(inDomainNameSet,inserts2);

    totalCommand += ") as Result, " + inDomainNameSet + " as DNames where Dnames.domainName = Result.domainName;";

    var sql = msq.format(totalCommand,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
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
    console.log("domainNames len: " + domainsArr.length.toString());
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
        dsets.push({label : domainsArr[i], data : dataPoints, strokeColor : colorConstants[i%colorConstants.length],pointColor : "rgba(0,0,0,0)", pointStrokeColor : "rgba(0,0,0,0)"});
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
            if(dataSet1 != null) {
                res.render('usage', {
                    title: 'Browser Usage',
                    message: 'Hello, ' + userId + '!',
                    data1: JSON.stringify(dataSet1),
                    data2: JSON.stringify(d),
                    categories : JSON.stringify(arr)
                }); 
            }
            else {
                res.send(JSON.stringify(d));
            }
        }
    });


}

//Graph page
app.get('/usage/view', function(req,res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    console.log(userId);
    var command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? group by domainName order by duration desc;";
    var inserts = ['\'' + userId + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql, function(err,rows) {    
            if(err) {
                console.log("error 1: " + err);
                res.sendStatus(400);
            }
            else {
                var d1 = formatDoughnutChartData(rows,"domainName");
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
        var otherSum = 0;
        for(var i = 0; i < rows.length; i++) {
            if(i < 8) {
                d.push({value : rows[i].duration, label: rows[i].domainName});                
            }
            else {
                otherSum += rows[i].duration;
            }
        }
        if(otherSum > 0) {
            d.push({value : otherSum, label : "other sites"});
        }
    }
    return d;
}

function formatBarChartData(rows,sortType) {
    lbls = [];
    values = [];
    otherSum = 0;
    if(sortType == "category") {
        for(var i = 0; i < rows.length; i++) {
            if(i < 8) {
                lbls.push(rows[i].category);
                values.push(rows[i].duration);
            }
            else {
                otherSum += rows[i].duration;
            }
        }
    }
    else if (sortType == "domainName"){
        for(var i = 0; i < rows.length; i++) {
            if(i < 8) {
                lbls.push(rows[i].domainName);
                values.push(rows[i].duration);
            }
            else {
                otherSum += rows[i].duration;
            }
        }
    }
    else if (sortType == "AgeGroup") {
        for (var i = 0; i < rows.length; i++) {
            if(i < 8) {
                lbls.push(rows[i].AgeGroup);
                values.push(rows[i].duration);
            }
            else {
                otherSum += rows[i].duration;
            }
        }
    }
    else {
        for(var i = 0; i < rows.length; i++) {
            if(i < 8) {
                lbls.push(rows[i].userID);
                values.push(rows[i].duration);
            }
            else {
                otherSum += rows[i].duration;
            }
        } 
    }
    if (otherSum > 0) {
        lbls.push('other');
        values.push(otherSum);
    }
    var d = {labels : lbls, datasets : [{data: values, fillColor: colorConstants[0]}]};
    return d;
}

app.post('/usage/update/left',bodyParser.urlencoded({extended : false}), function(req,res) {
    var sortType = req.body.sortType;
    var date = new Date(req.body.startTime);
    var chartType = req.body.chartType;
    var command = "";
    var inserts = [];
    var userId = getDisciplanCookie(req.headers.cookie);
    if(sortType == "category") {
        command = "select * from (select category, sum(TimeSpent) as duration from Categories as C, TimeSpent as T where C.userId = T.userId and C.userId = ?? and C.domainName = T.domainName and T.startTime > ?? group by category union select \'other\' as category, sum(TimeSpent) as duration from TimeSpent as T1 where T1.userId = ?? and not exists(select * from Categories as C1 where T1.userId = C1.userId and T1.domainName = C1.domainName) group by category) as A order by duration desc;";
        inserts = ['\'' + userId + '\'','\'' + sqlFormatDateTime(date) + '\'', '\'' + userId + '\''];
    }
    else {
        command = "select domainName, sum(timeSpent) as duration from TimeSpent where userID = ?? and startTime > ?? group by domainName order by duration desc;";
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

function versusTimeOneCategoryQuery(category,userId,numDays,numToView,date,res) {
    var inDomainNameSet = "";
    if (category == "all") {
        inDomainNameSet = "select T.domainName, sum(T.timeSpent) as duration from TimeSpent as T where T.userID = ?? and T.startTime >= ?? group by T.domainName order by duration desc limit ??";
        var inserts = ['\'' + userId + '\'', '\'' + sqlFormatDateTime(date) + '\'', numToView.toString()];
        inDomainNameSet = msq.format(inDomainNameSet,inserts);
    }
    else if (category == "other") {
        inDomainNameSet = "select T.domainName, sum(T.timeSpent) as duration from TimeSpent as T, Categories as C where T.userID = ?? and C.userID = T.userID and T.startTime >= ?? and not exists (select * from Categories as C2 where T.domainName = C2.domainName and T.userID = C2.userID) group by T.domainName order by duration desc limit ??";
        var inserts = ['\'' + userId + '\'', '\''+ sqlFormatDateTime(date) + '\'', numToView.toString()];
        inDomainNameSet = msq.format(inDomainNameSet,inserts);
    }
    else {
        inDomainNameSet = "select T.domainName, sum(T.timeSpent) as duration from TimeSpent as T, Categories as C where T.userID = ?? and C.userID = T.userID and T.startTime >= ?? and C.domainName = T.domainName and C.category = ?? group by T.domainName order by duration desc limit ??";
        var inserts = ['\'' + userId + '\'', '\'' + sqlFormatDateTime(date) + '\'', '\'' + category + '\'', numToView.toString()];
        inDomainNameSet = msq.format(inDomainNameSet, inserts);
    }
    inDomainNameSet = '(' + inDomainNameSet + ')';

    var dates = [];
    var currDate = new Date();
    currDate.setUTCSeconds(0);
    currDate.setUTCMinutes(0);
    currDate.setUTCHours(0);
    currDate = new Date(currDate.getTime() + 24*60*1000);
    var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
    dates.push(shortDateStr(prevDate));

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
    totalCommand += ") as Result, " + inDomainNameSet + " as DNames where Result.domainName = DNames.domainName order by Result.domainName;";
    var sql = msq.format(totalCommand,inserts);
    sql = sql.replace(/`/g,"");
    console.log(sql);
    con.query(sql, function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log(rows);
            formatLineChartData(rows,dates,userId,null,res);
        }
    });
    
}

app.post('/usage/update/right',bodyParser.urlencoded({extended : false}), function(req,res) {
    var category = req.body.category;
    var numToView = req.body.numToView;
    var numDays = req.body.numDays;
    var date = new Date((new Date()).getTime() - numDays*24*60*60*1000);
    var userId = getDisciplanCookie(req.headers.cookie);

    versusTimeOneCategoryQuery(category,userId,numDays,numToView,date,res);
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

function createDefaultSettings(userId) {
    async.series([
        function(callback) {
            var command = "INSERT INTO Settings (userID,category,type,timeAllowed,timeRemaining,resetInterval) VALUES(?,?,?,?,?,?)"
            var inserts = [userId, "Social Media", "Redirect","1800","1800","86400"]
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
            var command = "INSERT INTO Categories (userID,domainName,category) VALUES(?,?,?)"
            var inserts = [userId,"www.facebook.com","Social Media"]
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
        },
        function(callback) {
            var command = "INSERT INTO Categories (userID,domainName,category) VALUES(?,?,?)"
            var inserts = [userId,"www.linkedin.com","Social Media"]
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
        },
    ], function(err) {
        console.log(err)
        if (err)  {
            return err
        }
        return
    })

}

app.post('/user_settings/save', bodyParser.urlencoded({extended : false}), function(req, res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    defaultSettings(userId)

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
        },
        function(callback) {
            // send new settings to background page
            var socketId = users[userId];
            sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                ,[userId]);
            con.query(sql, function(err,rows) {
                if(err) {
                    console.log("error: " + err);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("error", err);
                    }
                    return err;
                }
                else {
                    console.log("Sending settings back in SAVE!!!! should be last hopefully"); 
                    console.log(rows);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("settings saved", rows);
                    }
                }
                callback();
            });
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
        },
        function(callback) {
            // send new settings to background page
            var socketId = users[userId];
            sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                ,[userId]);
            con.query(sql, function(err,rows) {
                if(err) {
                    console.log("error: " + err);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("error", err);
                    }
                    return err;
                }
                else {
                    console.log("Sending settings back in SAVE!!!! should be last hopefully"); 
                    console.log(rows);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("settings saved", rows);
                    }
                }
                callback();
            });
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
        },
        function(callback) {
            // send new settings to background page
            var socketId = users[userId];
            sql = msq.format("select * from Settings as S,Categories as C where S.userId = ? and S.category = C.category ORDER BY S.Category;"
                ,[userId]);
            con.query(sql, function(err,rows) {
                if(err) {
                    console.log("error: " + err);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("error", err);
                    }
                    return err;
                }
                else {
                    console.log("Sending settings back in SAVE!!!! should be last hopefully"); 
                    console.log(rows);
                    if (io.sockets.connected[socketId]){
                        io.to(socketId).emit("settings saved", rows);
                    }
                }
                callback();
            });
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
            console.log(rows);
        }
    });

});

app.get('/usage/compare', function(req,res){
    var userId = getDisciplanCookie(req.headers.cookie);
    res.render('usage_compare',{title : 'Comparing with Friends',
        message : "Compare your usage with friends!"
    });
});


function formatMultiUserBarChartData(usersArray,rows) {
    var tmpD = {}
    for(var i = 0; i < usersArray.length; i++) {
        tmpD[usersArray[i]] = {};
    }
    var allCatsSet = new Set();
    for (var i = 0; i < rows.length; i++) {
        if (!allCatsSet.has(rows[i].category)) {
            allCatsSet.add(rows[i].category);
            for(var user in tmpD) {
                if(tmpD.hasOwnProperty(user)) {
                    tmpD[user][rows[i].category] = 0;
                }
            }
        }
    }
    for (var i = 0; i < rows.length; i++) {
        tmpD[rows[i].userID][rows[i].category] = rows[i].duration;
    }
    var allCats = Array.from(allCatsSet);
    var dSets = [];
    for (var i = 0; i < usersArray.length; i++) {
        var dataPoints = [];
        for(j = 0; j < allCats.length; j++) {
            dataPoints.push(tmpD[usersArray[i]][allCats[j]]);
        }
        dSets.push({label : usersArray[i],data : dataPoints, fillColor : colorConstants[i%colorConstants.length]});
    }
    var d = {labels : allCats, datasets : dSets};
    return d;
}

function formatMultiUserLineChart(usersArray,category,dates,rows) {
    var usersData = {};
    for (var i = 0; i < usersArray.length; i++) {
        var user = usersArray[i];
        var arr = [];
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            if(user == row.userID) {
                arr.push(row);
            }
        }
        usersData[user] = arr;
    }
    var dSets = [];
    var k = 0;
    for(var user in usersData) {
        var points = [];
        var j = 0;
        for(var i = 0; i < dates.length; i++) {
            if( j < usersData[user].length && usersData[user][j].date == dates[i]) {
                points.push(usersData[user][j].duration);
                j++;
            }
            else {
                points.push(0);
            }
        }
        dSets.push({label : user, data : points, strokeColor : colorConstants[k%colorConstants.length],fillColor : "rgba(0,0,0,0)",pointColor : "rgba(0,0,0,0)", pointStrokeColor : "rgba(0,0,0,0)"});
        k++;
    }
    return {labels : dates, datasets: dSets};
}

function queryTwoFriends(user1,user2,numDays,res) {
    var date = new Date();
    var startDate = new Date(date.getTime() - 14*24*60*60*1000); //default graph will show last two weeks.
    var command1 = "select * from ((select T0.userID, \'other\' as category, sum(TimeSpent) as duration from TimeSpent as T0 where (T0.userId = ?? or T0.userID = ??) and not exists(select * from Categories as C0 where T0.userId = C0.userId and T0.domainName = C0.domainName) group by userID, category) union (select T1.userID, C1.category, sum(T1.timeSpent) as duration from TimeSpent as T1, Categories as C1 where T1.userID = ?? or T1.userID = ?? and T1.userID = C1.userID and T1.domainName = C1.domainName and T1.startTime >= ?? group by T1.userID,C1.category)) as Result order by Result.userID;";
    var inserts1 = ['\'' + user1 + '\'', '\'' + user2 + '\'','\'' + user1 + '\'', '\'' + user2 + '\'', '\'' + sqlFormatDateTime(startDate) + '\''];
    var sql1 = msq.format(command1,inserts1);
    sql1 = sql1.replace(/`/g,"");
    con.query(sql1,function(err1,rows1) {
        if(err1) {
            console.log("error: " + err1);
            res.sendStatus(400);
        }
        else {
            var d1 = formatMultiUserBarChartData([user1,user2],rows1);
            var dates = [];
            var currDate = new Date();
            currDate.setUTCSeconds(0);
            currDate.setUTCMinutes(0);
            currDate.setUTCHours(0);
            currDate = new Date(currDate.getTime() + 24*60*1000);
            var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
            dates.push(shortDateStr(prevDate));
            var inserts2 = [];
            var totalCommand = "select Result.date, Result.duration, Result.userID from (";
            for (var i = 0; i < numDays; i++) {
                if(i > 0) {
                    totalCommand += "union ";
                }
                totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, userID from TimeSpent as T" + i.toString() + " where (userID = ?? or userID = ??) and startTime < ?? and startTime > ?? group by userID ";
                inserts2.push('\'' + user1 + '\'');
                inserts2.push('\'' + user2 + '\'');
                inserts2.push('\'' + sqlFormatDateTime(currDate) + '\'');
                inserts2.push('\'' + sqlFormatDateTime(prevDate) + '\'');
                currDate = prevDate;
                prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
                dates.unshift(shortDateStr(prevDate));
            }
            totalCommand += ") as Result order by Result.userID,Result.date;";
            var sql2 = msq.format(totalCommand,inserts2);
            sql2 = sql2.replace(/`/g,"");
            con.query(sql2,function(err2,rows2) {
                if(err2) {
                    console.log("error: " + err2);
                    res.sendStatus(400);
                }
                else {
                    var d2 = formatMultiUserLineChart([user1,user2],"all",dates,rows2);
                    var getCategories = "select distinct \'all\' as category from Categories union select distinct \'other\' as category from Categories union select C.category from Categories as C, users as U where U.userID = C.userID and ?? = U.userID and exists(select * from Categories as C2 where C2.category = C.category and C2.userID = ??);";
                    var catInserts = ['\'' + user1 + '\'', '\'' + user2 + '\''];
                    var catSql = msq.format(getCategories,catInserts);
                    catSql = catSql.replace(/`/g,"");
                    con.query(catSql,function(err3,rows3) {
                        if(err3) {
                            console.log("error: " + err3);
                            res.sendStatus(400);
                        }
                        else {
                            var cats = [];
                            for(var i = 0; i < rows3.length; i++) {
                                cats.push(rows3[i].category);
                            }  
                           var all = {data1 : d1,data2 : d2,categories : cats};
                           res.send(JSON.stringify(all));  
                        }

                   });

                }
            });
        }
    });
}

app.post('/usage/compare/graphs_update/right',bodyParser.urlencoded({extended : false}), function(req,res) {
    var user1 = getDisciplanCookie(req.headers.cookie);
    var user2 = req.body.otherUser;
    console.log("--------------")
    console.log(user2);
    var numDays = req.body.numDays;
    numDays = 14;
    var category = req.body.category;
    console.log(category);
    var command = "";
    var inserts = [];

    var dates = [];
    var currDate = new Date();
    currDate.setUTCSeconds(0);
    currDate.setUTCMinutes(0);
    currDate.setUTCHours(0);
    currDate = new Date(currDate.getTime() + 24*60*1000);
    var prevDate = new Date(currDate.getTime() - 24*60*60*1000);
    dates.push(shortDateStr(prevDate));
    var inserts = [];
    var totalCommand = "select Result.date, Result.duration, Result.userID from (";


    if(category = "other") {
        for (var i = 0; i < numDays; i++) {
            if(i > 0) {
                totalCommand += " union ";
            }
            totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, userID from TimeSpent as T" + i.toString() + " where (userID = ?? or userID = ??) and startTime < ?? and startTime > ?? and not exists(select * from Categories as C where C.userID = T" + i.toString() + ".userID and C.domainName = T" + i.toString() + ".domainName) group by userID";
            inserts.push('\'' + user1 + '\'');
            inserts.push('\'' + user2 + '\'');
            inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
            inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
            currDate = prevDate;
            prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
            dates.unshift(shortDateStr(prevDate));
        }
        totalCommand += ") as Result order by Result.userID,Result.date;";
    }
    else if (category = "all") {
        for (var i = 0; i < numDays; i++) {
            if(i > 0) {
                totalCommand += " union ";
            }
            totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, userID from TimeSpent as T" + i.toString() + " where (userID = ?? or userID = ??) and startTime < ?? and startTime > ?? group by userID";
            inserts.push('\'' + user1 + '\'');
            inserts.push('\'' + user2 + '\'');
            inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
            inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
            currDate = prevDate;
            prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
            dates.unshift(shortDateStr(prevDate));
        }
        totalCommand += ") as Result order by Result.userID,Result.date;";
    }
    else {
        for (var i = 0; i < numDays; i++) {
            if(i > 0) {
                totalCommand += " union ";
            }
            totalCommand += "select \'" + shortDateStr(prevDate) + "\' as date, sum(timeSpent) as duration, userID from TimeSpent as T" + i.toString() + ", Categories as C" + i.toString() + " where (T" + i.toString() + ".userID = ?? or T " + i.toString() + ".userID = ??) and startTime < ?? and startTime > ?? and C" + i.toString() + ".userID = T" + i.toString() + ".userID and C" + i.toString() + ".category = ?? and C" + i.toString() + ".domainName = T" + i.toString() + ".domainName group by userID";
            inserts.push('\'' + user1 + '\'');
            inserts.push('\'' + user2 + '\'');
            inserts.push('\'' + sqlFormatDateTime(currDate) + '\'');
            inserts.push('\'' + sqlFormatDateTime(prevDate) + '\'');
            inserts.push('\'' + category + '\'');
            currDate = prevDate;
            prevDate = new Date(prevDate.getTime() - 24*60*60*1000);
            dates.unshift(shortDateStr(prevDate));
        }
        totalCommand += ") as Result order by Result.userID,result.date;";
    }
    var sql = msq.format(totalCommand,inserts);
    sql = sql.replace(/`/g,"");
    //console.log(sql);
    con.query(sql,function(err,rows) {
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log(rows);
            var d = formatMultiUserLineChart([user1,user2],category,dates,rows);
            res.send(JSON.stringify(d));
        }
    })


});

app.post('/usage/compare/graphs_update', bodyParser.urlencoded({extended : false}), function(req,res) {
    var userId = getDisciplanCookie(req.headers.cookie);
    var friendName = req.body.friendName;
    var firstAndLast = friendName.split(" ");
    var command = "select U.userID from Users as U, Friends as F where F.user2 = ?? and F.user1 = U.userID and U.firstName = ?? and U.lastName = ??;";
    var inserts = [ '\'' + userId + '\'', '\'' + firstAndLast[0] + '\'', '\'' + firstAndLast[1] + '\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    con.query(sql,function(err,rows) {
        if(err) {
            console.log("error the first: " + err);
            res.sendStatus(400);
        }
        else {
            if(rows.length == 0) {
                console.log("error: no friends of " + userId + " with name " + friendName);
                res.sendStatus(400);
            }
            else {
                queryTwoFriends(userId,rows[0].userID,14,res);
            }
        }
    });
});

app.post('/usage/compare/friends_update', bodyParser.urlencoded({extended : false}), function(req,res) {
    console.log("here");
    var userId = getDisciplanCookie(req.headers.cookie);
    var prefixFirstOrLast = req.body.prefix;
    var command = "select U.firstName, U.lastName, U.userId from Users as U, Friends as F where F.user1 = ?? and concat(U.firstName,' ',U.lastName) like ?? and U.userID = F.user2;";
    var inserts = ['\'' + userId + '\'', '\'' + prefixFirstOrLast + '%\''];
    var sql = msq.format(command,inserts);
    sql = sql.replace(/`/g,"");
    console.log(sql);
    con.query(sql,function(err,rows){
        if(err) {
            console.log("error: " + err);
            res.sendStatus(400);
        }
        else {
            console.log(rows);
            res.send(JSON.stringify(rows));
        }

    });
})

