DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS signedInUsers;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS views;

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
       
/* insert 4 test user into the system with password asdasd */    
insert into users (email, password, firstName, lastName, gender, city, country) values ('asd@asd.com','$2b$12$L/2yVR2aWNd3a9JteooY2e1cI2fV4U6NJecAN1SlLG8Hb.BJaHeUu', 'asd', 'asd', 'Male', 'asd', 'asd');

insert into users (email, password, firstName, lastName, gender, city, country) values ('qwe@qwe.com','$2b$12$L/2yVR2aWNd3a9JteooY2e1cI2fV4U6NJecAN1SlLG8Hb.BJaHeUu', 'qwe', 'qwe', 'Male', 'qwe', 'qwe');

insert into users (email, password, firstName, lastName, gender, city, country) values ('zxc@zxc.com','$2b$12$L/2yVR2aWNd3a9JteooY2e1cI2fV4U6NJecAN1SlLG8Hb.BJaHeUu', 'zxc', 'zxc', 'Male', 'zxc', 'zxc');

insert into users (email, password, firstName, lastName, gender, city, country) values ('rty@rty.com','$2b$12$L/2yVR2aWNd3a9JteooY2e1cI2fV4U6NJecAN1SlLG8Hb.BJaHeUu', 'rty', 'rty', 'Male', 'rty', 'rty');

/*insert 5 views for the user asdasd in october */
insert into views (viewDate, userEmail, wallEmail) values ('2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');

/*insert 3 views for the user asdasd in november */
insert into views (viewDate, userEmail, wallEmail) values ('2015-11-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-11-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-11-03 00:00:00', 'asd@asd.com', 'asd@asd.com');


/*insert 6 views for the user asdasd in december */
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2015-12-03 00:00:00', 'asd@asd.com', 'asd@asd.com');


/*insert 1 view for the user asdasd in january */
insert into views (viewDate, userEmail, wallEmail) values ('2016-01-03 00:00:00', 'asd@asd.com', 'asd@asd.com');

/*insert 10 views for the user asdasd in february */
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into views (viewDate, userEmail, wallEmail) values ('2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');


/*insert 2 posts for the user asdasd in october */
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2015-10-03 00:00:00', 'asd@asd.com', 'asd@asd.com');

/*insert 1 post for the user asdasd in november */
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2015-11-03 00:00:00', 'asd@asd.com', 'asd@asd.com');

/*insert 5 posts for the user asdasd in january */
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-01-03 00:00:00', 'asd@asd.com', 'zxc@zxc.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-01-03 00:00:00', 'asd@asd.com', 'zxc@zxc.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-01-03 00:00:00', 'asd@asd.com', 'qwe@qwe.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-01-03 00:00:00', 'asd@asd.com', 'rty@rty.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-01-03 00:00:00', 'asd@asd.com', 'asd@asd.com');

/*insert 4 posts for the user asdasd in february */
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-02-03 00:00:00', 'asd@asd.com', 'qwe@qwe.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-02-03 00:00:00', 'asd@asd.com', 'asd@asd.com');
insert into messages (message, datePosted, wallEmail, writer) values ('Hej!', '2016-02-03 00:00:00', 'asd@asd.com', 'qwe@qwe.com');
