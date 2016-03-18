DROP DATABASE IF EXISTS disciplan;
CREATE DATABASE disciplan;
USE disciplan;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS TimeSpent;
DROP TABLE IF EXISTS Friends;
DROP TABLE IF EXISTS PremiumUserDomains;

CREATE TABLE Users (
	userID CHAR(64) NOT NULL PRIMARY KEY,
	email CHAR(64) NOT NULL,
	firstName CHAR(64) NOT NULL,
	lastName CHAR(64) NOT NULL,
	password CHAR(64) NOT NULL,
	dOB DATETIME NOT NULL,
	premium TINYINT(1) NOT NULL
);

CREATE TABLE TimeSpent (
	userID CHAR(64),
	domainName CHAR(64) NOT NULL,
	startTime DATETIME NOT NULL,
	timeSpent INT(64) NOT NULL,
	PRIMARY KEY (userID, startTime),
	FOREIGN KEY (userID) REFERENCES Users (userID)
);



CREATE TABLE PremiumUserDomains (
	userID CHAR(64) NOT NULL,
	domainName CHAR(64) NOT NULL,
	PRIMARY KEY (userID, domainName),
	FOREIGN KEY (userID) REFERENCES Users(userID)
);

CREATE TABLE Friends (
	user1 CHAR(64) NOT NULL,
	user2 CHAR(64) NOT NULL,
	PRIMARY KEY (user1, user2),
	FOREIGN KEY (user1) REFERENCES Users(userID),
	FOREIGN KEY (user2) REFERENCES Users(userID)
);

INSERT INTO Users VALUES ("danthom","danthom@stanford.edu","Danny", "Thomson","password","1993-05-20 00:00:00",1);
INSERT INTO Users VALUES ("jross3","jross3@stanford.edu","James", "Ross","password","1965-09-07 00:00:00",1);
INSERT INTO Users VALUES ("adamii","adamii@stanford.edu","Adam", "Brostowicz","password","1985-09-07 00:00:00",1);
INSERT INTO Users VALUES ("jeff1731","jeff1731@stanford.edu","Jeff", "Garnier","password","2002-09-07 00:00:00",1);
INSERT INTO PremiumUserDomains VALUES ('danthom','www.google.com');

CREATE VIEW AgeGroupView AS
SELECT T1.domainName, sum(T1.timeSpent) AS duration, "Under 18" AS AgeGroup
FROM TimeSpent AS T1, Users as U1
WHERE T1.userID = U1.userID AND DATE_ADD(U1.dOB, INTERVAL 18 YEAR) > NOW()
GROUP BY T1.domainName
UNION
SELECT T2.domainName, sum(T2.timeSpent) AS duration, "18-29" AS AgeGroup
FROM TimeSpent AS T2, Users as U2
WHERE T2.userID = U2.userID AND DATE_ADD(U2.dOB, INTERVAL 18 YEAR) <= NOW() AND DATE_ADD(U2.dOB, INTERVAL 29 YEAR) > NOW()
GROUP BY T2.domainName
UNION
SELECT T3.domainName, sum(T3.timeSpent) AS duration, "29-49" AS AgeGroup
FROM TimeSpent AS T3, Users as U3
WHERE T3.userID = U3.userID AND DATE_ADD(U3.dOB, INTERVAL 29 YEAR) <= NOW() AND DATE_ADD(U3.dOB, INTERVAL 49 YEAR) > NOW()
GROUP BY T3.domainName
UNION
SELECT T4.domainName, sum(T4.timeSpent) AS duration, "49-65" AS AgeGroup
FROM TimeSpent AS T4, Users as U4
WHERE T4.userID = U4.userID AND DATE_ADD(U4.dOB, INTERVAL 49 YEAR) <= NOW() AND DATE_ADD(U4.dOB, INTERVAL 65 YEAR) > NOW()
GROUP BY T4.domainName
UNION
SELECT T5.domainName, sum(T5.timeSpent) AS duration, "Over 65" AS AgeGroup
FROM TimeSpent AS T5, Users as U5
WHERE T5.userID = U5.userID AND DATE_ADD(U5.dOB, INTERVAL 65 YEAR) <= NOW()
GROUP BY T5.domainName;

delimiter $$
CREATE TRIGGER nonZeroTimeSpent BEFORE INSERT ON TimeSpent
FOR EACH ROW
BEGIN
IF new.timeSpent = 0 THEN
signal sqlstate '45000';
end if;
end;$$
delimiter ;

