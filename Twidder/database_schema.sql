DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS signedInUsers;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS files;

CREATE TABLE users (
       email VARCHAR(200) PRIMARY KEY,
       password VARCHAR(60) NOT NULL,
       firstName VARCHAR(200) NOT NULL,
       lastName VARCHAR(200) NOT NULL,
       gender VARCHAR(10) NOT NULL,
       city VARCHAR(200) NOT NULL,
       country VARCHAR(200) NOT NULL);

CREATE TABLE signedInUsers (
       token VARCHAR(36) PRIMARY KEY,
       secretKey VARCHAR(36) NOT NULL,
       email VARCHAR(200) NOT NULL,
       FOREIGN KEY (email) REFERENCES users(email));

CREATE TABLE messages (
       messageId INTEGER PRIMARY KEY AUTOINCREMENT,
       message TEXT NOT NULL,
       datePosted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       wallEmail VARCHAR(200) NOT NULL,
       writer VARCHAR(200) NOT NULL,
       FOREIGN KEY (wallEmail) REFERENCES users(email),
       FOREIGN KEY (writer) REFERENCES users(email));

CREATE TABLE files (
       fileId INTEGER PRIMARY KEY AUTOINCREMENT,
       fileName varchar(10) NOT NULL,
       messageId INTEGER NOT NULL,
       FOREIGN KEY (messageId) REFERENCES messages(messageId));

CREATE TABLE views (
       viewId INTEGER PRIMARY KEY AUTOINCREMENT,
       viewDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       userEmail VARCHAR(200) NOT NULL,
       wallEmail VARCHAR(200) NOT NULL,
       FOREIGN KEY (userEmail) REFERENCES users(email),
       FOREIGN KEY (wallEmail) REFERENCES users(email));
       
       

       
       