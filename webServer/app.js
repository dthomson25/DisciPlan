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
    }
    else {
        console.log("success");
    }
});

con.query("select count(*) from Categories",function(err,rows){
    if(err) {
        console.log(err);
    }
    else{
        console.log(rows);
    }
    process.exit(0);
});