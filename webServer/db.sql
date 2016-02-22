DROP DATABASE IF EXISTS disciplan;
CREATE DATABASE disciplan;
USE disciplan;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS TimeSpent;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Settings;

CREATE TABLE Users (
	userID CHAR(64) NOT NULL PRIMARY KEY,
	email CHAR(64) NOT NULL,
	firstName CHAR(64) NOT NULL,
	lastName CHAR(64) NOT NULL,
	password CHAR(64) NOT NULL,
	age INT(64) NOT NULL,
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
	timeAllowed INT(64) NOT NULL,
	timeRemaining INT(64) NOT NULL,
	PRIMARY KEY (userID,category),
	FOREIGN KEY (userID) REFERENCES Users(userID)
);

CREATE TABLE PremiumUserDomains (
	userID CHAR(64) NOT NULL,
	domainName CHAR(64) NOT NULL,
	PRIMARY KEY (userID, domainName),
	FOREIGN KEY (userID) REFERENCES Users(userID)
);
