USE disciplan;

DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Settings;

CREATE TABLE Categories (
	userID CHAR(64),
	domainName CHAR(64),
	category CHAR(64),
	PRIMARY KEY (userId, domainName),
	FOREIGN KEY (userID) REFERENCES Users(userID)
);

CREATE TABLE Settings (
	userID CHAR(64),
	category CHAR(64) NOT NULL,
	type CHAR(64) NOT NULL,
	timeAllowed INT(64) NOT NULL,
	timeRemaining INT(64) NOT NULL,
	resetInterval INT(64) NOT NULL,
	PRIMARY KEY (userID,category),
	FOREIGN KEY (userID) REFERENCES Users(userID)
);



INSERT INTO Categories VALUES ("danthom","www.facebook.com","Social");
INSERT INTO Categories VALUES ("danthom","www.instagram.com","Social");
INSERT INTO Categories VALUES ("danthom","espn.go.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.foxsports.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.cnn.com","Entertainment");
INSERT INTO Categories VALUES ("danthom","www.usatoday.com","Entertainment");

INSERT INTO Settings VALUES ("danthom","Social","Redirect","120","10","86400");
INSERT INTO Settings VALUES ("danthom","Sports","Notifications","120","10","86400");
INSERT INTO Settings VALUES ("danthom","Entertainment","Redirect","600","500","86400");

DROP TRIGGER IF EXISTS update_settings;
CREATE TRIGGER update_settings 
    AFTER UPDATE ON Settings
    FOR EACH ROW
    UPDATE Categories Set category = New.Category where Category = Old.Category and UserID = Old.UserID;

