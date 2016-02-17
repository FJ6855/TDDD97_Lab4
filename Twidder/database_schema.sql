DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS signedInUsers;
DROP TABLE IF EXISTS messages;

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

       
       