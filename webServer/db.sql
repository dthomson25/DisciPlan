DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS TimeSpent;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Settings;

CREATE TABLE Users (
	userID INT(64),
	email CHAR(64),
	name CHAR(64),
	password CHAR(64)
);

CREATE TABLE TimeSpent (
	userID INT(64),
	domainName CHAR(64),
	category CHAR(64),
	startTime DATETIME,
	timeSpent INT(64)
);

CREATE TABLE Categories (
	userID INT(64),
	domainName CHAR(64),
	category CHAR(64)
);

CREATE TABLE Settings (
	userID INT(64),
	category CHAR(64),
	timeAllowed INT(64)
);