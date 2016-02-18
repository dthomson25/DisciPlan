USE disciplan;


INSERT INTO Users VALUES ("danthom","danthom@stanford.edu","Danny","password");

INSERT INTO Categories VALUES ("danthom","www.facebook.com","Social");
INSERT INTO Categories VALUES ("danthom","twitter.com","Social");
INSERT INTO Categories VALUES ("danthom","espn.go.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.foxsports.com","Sports");
INSERT INTO Categories VALUES ("danthom","www.cnn.com","Entertainment");
INSERT INTO Categories VALUES ("danthom","www.usatoday.com","Entertainment");


INSERT INTO Settings VALUES ("danthom","Social","10","10");
INSERT INTO Settings VALUES ("danthom","Sports","20","20");
INSERT INTO Settings VALUES ("danthom","Entertainment","20","20");

DROP TRIGGER IF EXISTS update_settings;
CREATE TRIGGER update_settings 
    AFTER UPDATE ON Settings
    FOR EACH ROW
    UPDATE Categories Set category = New.Category where Category = Old.Category and UserID = Old.UserID;
    