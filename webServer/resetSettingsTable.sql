USE disciplan;


INSERT INTO Users VALUES ("danthom","danthom@stanford.edu","Danny", "Thomson","password","1993-05-20 00:00:00",1);
INSERT INTO Users VALUES ("jross3","jross3@stanford.edu","James", "Ross","password","1993-09-07 00:00:00",1);
INSERT INTO PremiumUserDomains VALUES ('danthom','www.google.com');

INSERT INTO Categories VALUES ("danthom","www.facebook.com","Social");
INSERT INTO Categories VALUES ("danthom","twitter.com","Social");
INSERT INTO Categories VALUES ("danthom","espn.go.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.foxsports.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.cnn.com","Entertainment");
INSERT INTO Categories VALUES ("danthom","www.usatoday.com","Entertainment");


INSERT INTO Settings VALUES ("danthom","Social","Redirect","120","100","86400");
INSERT INTO Settings VALUES ("danthom","Sports","Notifications","3600","3600","86400");
INSERT INTO Settings VALUES ("danthom","Entertainment","Nuclear","3720","3660","86400");

DROP TRIGGER IF EXISTS update_settings;
CREATE TRIGGER update_settings 
    AFTER UPDATE ON Settings
    FOR EACH ROW
    UPDATE Categories Set category = New.Category where Category = Old.Category and UserID = Old.UserID;

