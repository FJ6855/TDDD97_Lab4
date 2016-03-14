from flask import Flask
import sqlite3
from flask import g

app = Flask(__name__)

DATABASE = 'Twidder/database.db'

databaseConnection = None

def connectToDatabase():
    """Opens a connection to the database."""
    global databaseConnection
    databaseConnection = sqlite3.connect(DATABASE)

def closeDatabaseConnection():
    """Closes the database connection."""
    if databaseConnection is not None: 
        databaseConnection.close()

def executeSelect(sql, args, one = False):
    """Executes a select sql query."""
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    # Check if we should return one or all rows from the query.
    if one:
        result = cursor.fetchone()
    else:
        result = cursor.fetchall()
    cursor.close()
    return result

def executeChange(sql, args):
    """Executes a insert, delete or update sql query."""
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    databaseConnection.commit()
    cursor.close()
    return True

def executeChangeAndGetId(sql, args):   
    """Executes a insert sql query and returns the id of the newly inserted row."""
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    databaseConnection.commit()
    rowId = cursor.lastrowid
    cursor.close()
    return rowId

def getUserByEmail(email):
    """Returns the profile information for a user."""
    return executeSelect('select email, firstName, lastName, gender, city, country from users where email = ?', (email,), True)

def getUserPasswordByEmail(email): 
    """Returns the hashed password for a users."""
    password = executeSelect('select password from users where email = ?', (email,), True)
    if password is not None:
        return password[0]
    else:
        return None

def getUserEmailByToken(token):
    """Returns the email for a user with matching token."""
    email = executeSelect('select email from signedInUsers where token = ?', (token,), True)
    if email is not None:
        return email[0]
    else:
        return None

def getUserTokenByEmail(email):
    """Returns the token for a user with matching email."""
    token = executeSelect('select token from signedInUsers where email = ?', (email,), True)
    if token is not None:
        return token[0]
    else:
        return None

def getUserMessagesByEmail(email):
    """Returns the messsages for a user's wall."""
    return executeSelect('select * from messages where wallEmail = ? order by datePosted desc', (email,))

def getFileNameByMessageId(messageId):
    """Returns the file name for a message."""
    fileName = executeSelect('select fileName from files where messageId = ?', (messageId,), True)
    if fileName is not None:
        return fileName[0]
    else:
        return None

def getNumberOfSignedInUsers():
    """Returns the number of signed in users."""
    numberOfUsers = executeSelect('select COUNT(token) from signedInUsers', (), True)
    return numberOfUsers[0]

def getNumberOfPostsByUserOnWall(writer, wall):
    """Returns the number of posts meade by a user on a user's wall."""
    numberOfPosts = executeSelect('select COUNT(*) from messages where wallEmail = ? and writer = ?', (wall, writer), True)
    return numberOfPosts[0] 

def getTopTwoNumberOfPostsOnWallByOthers(wall):
    """Returns the number of posts made by two top posters on a user's wall (besides the user himself)."""
    return executeSelect('select writer, COUNT(*) as numberOfPosts from messages where wallEmail = ? and writer != ? group by writer order by numberOfPosts desc limit 2', (wall, wall))
    
def getNumberOfPostsOnWall(wall):
    """Returns the number of posts on a user's wall."""
    numberOfPosts = executeSelect('select COUNT(*) from messages where wallEmail = ?', (wall,), True)
    return numberOfPosts[0]

def getPostsOnWallDuringLast6Months(wall):
    """Returns the number of posts for each of the last 6 months on a user's wall."""
    posts = executeSelect('select strftime(\'%Y\', datePosted) as postYear, strftime(\'%m\', datePosted) as postMonth, COUNT(*) from messages where wallEmail = ? and datePosted between datetime(\'now\', \'-6 months\') and datetime(\'now\', \'localtime\') group by postMonth order by postYear asc, postMonth asc', (wall,))
    return posts

def getViewsOnWallDuringLast6Months(wall):
    """Returns the number of views for each of the last 6 months on a user's wall."""
    views = executeSelect('select strftime(\'%Y\', viewDate) as viewYear, strftime(\'%m\', viewDate) as viewMonth, COUNT(*) from views where wallEmail = ? and viewDate between datetime(\'now\', \'-6 months\') and datetime(\'now\', \'localtime\') group by viewMonth order by viewYear asc, viewMonth asc', (wall,))
    return views

def insertUser(email, firstName, lastName, gender, city, country, passwordHash):
    """Inserts a user in the database."""
    return executeChange('insert into users values (?, ?, ?, ?, ?, ?, ?)', (email, passwordHash, firstName, lastName, gender, city, country))

def insertSignedInUser(token, email):
    """Inserts a user as signed in, in the the database."""
    return executeChange('insert into signedInUsers values (?, ?)', (token, email))

def insertMessage(writerEmail, email, message):
    """Inserts a message to user's wall in the database."""
    return executeChangeAndGetId('insert into messages (message, wallEmail, writer) values (?, ?, ?)', (message, email, writerEmail))

def insertFile(fileName, messageId):
    """Inserts a file tied to a message in the database."""
    return executeChange('insert into files (fileName, messageId) values (?, ?)', (fileName, messageId))

def insertView(wallEmail, email):
    """Inserts a view for a user's wall in the database."""
    return executeChange('insert into views (wallEmail, userEmail) values (?, ?)', (wallEmail, email))

def deleteSignedInUser(token):
    """Deletes the user as signed in."""
    return executeChange('delete from signedInUsers where token = ?', (token,))

def deleteSignedInUsersWithSameEmail(email, token):
    """Deletes all other users with the same email as signed in."""
    return executeChange('delete from signedInUsers where email = ? and token != ?', (email, token))

def updateUserPassword(email, passwordHash):
    """Updates the password for a user."""
    return executeChange('update users set password = ? where email = ?', (passwordHash, email))
