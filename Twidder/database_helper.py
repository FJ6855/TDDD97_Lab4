from flask import Flask
import sqlite3
from flask import g

app = Flask(__name__)

DATABASE = 'Twidder/database.db'

databaseConnection = None

def connectToDatabase():
    global databaseConnection
    databaseConnection = sqlite3.connect(DATABASE)

def closeDatabaseConnection():
    if databaseConnection is not None: 
        databaseConnection.close()

def executeSelect(sql, args, one = False):
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    if one:
        result = cursor.fetchone()
    else:
        result = cursor.fetchall()
    cursor.close()
    return result

def executeChange(sql, args):
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    databaseConnection.commit()
    cursor.close()
    return True

def executeChangeAndGetId(sql, args):                         
    cursor = databaseConnection.cursor()
    cursor.execute(sql, args)
    databaseConnection.commit()
    rowId = cursor.lastrowid
    cursor.close()
    return rowId

def getUserByEmail(email):
    return executeSelect('select email, firstName, lastName, gender, city, country from users where email = ?', (email,), True)

def getUserPasswordByEmail(email):    
    password = executeSelect('select password from users where email = ?', (email,), True)
    if password is not None:
        return password[0]
    else:
        return None

def getUserEmailByToken(token):
    email = executeSelect('select email from signedInUsers where token = ?', (token,), True)
    if email is not None:
        return email[0]
    else:
        return None

def getUserMessagesByEmail(email):
    return executeSelect('select * from messages where wallEmail = ? order by datePosted desc', (email,))

def getFileNameByMessageId(messageId):
    fileName = executeSelect('select fileName from files where messageId = ?', (messageId,), True)
    if fileName is not None:
        return fileName[0]
    else:
        return None

def getNumberOfSignedInUsers():
    numberOfUsers = executeSelect('select COUNT(token) from signedInUsers', (), True)
    return numberOfUsers[0]

def getNumberOfPostsByUserOnWall(writer, wall):
    numberOfPosts = executeSelect('select COUNT(*) from messages where wallEmail = ? and writer = ?', (wall, writer), True)
    return numberOfPosts[0] 

def getTopTwoNumberOfPostsOnWallByOthers(wall):
    return executeSelect('select writer, COUNT(*) as numberOfPosts from messages where wallEmail = ? and writer != ? group by writer order by numberOfPosts desc limit 2', (wall, wall))
    
def getNumberOfPostsOnWall(wall):
    numberOfPosts = executeSelect('select COUNT(*) from messages where wallEmail = ?', (wall,), True)
    return numberOfPosts[0]

def getPostsOnWallDuringLast6Months(wall):
    posts = executeSelect('select strftime(\'%Y\', datePosted) as postYear, strftime(\'%m\', datePosted) as postMonth, COUNT(*) from messages where wallEmail = ? and datePosted between datetime(\'now\', \'-6 months\') and datetime(\'now\', \'localtime\') group by postMonth order by postYear asc, postMonth asc', (wall,))
    return posts

def getViewsOnWallDuringLast6Months(wall):
    views = executeSelect('select strftime(\'%Y\', viewDate) as viewYear, strftime(\'%m\', viewDate) as viewMonth, COUNT(*) from views where wallEmail = ? and viewDate between datetime(\'now\', \'-6 months\') and datetime(\'now\', \'localtime\') group by viewMonth order by viewYear asc, viewMonth asc', (wall,))
    return views

def getSecretKeyByToken(token):
    secretKey = executeSelect('select secretKey from signedInUsers where token = ?', (token,), True)
    return secretKey[0]

def insertUser(email, firstName, lastName, gender, city, country, passwordHash):
    return executeChange('insert into users values (?, ?, ?, ?, ?, ?, ?)', (email, passwordHash, firstName, lastName, gender, city, country))

def insertSignedInUser(token, secretKey, email):
    return executeChange('insert into signedInUsers values (?, ?, ?)', (token, secretKey, email))

def insertMessage(writerEmail, email, message):
    return executeChangeAndGetId('insert into messages (message, wallEmail, writer) values (?, ?, ?)', (message, email, writerEmail))

def insertFile(fileName, messageId):
    return executeChange('insert into files (fileName, messageId) values (?, ?)', (fileName, messageId))

def insertView(wallEmail, email):
    return executeChange('insert into views (wallEmail, userEmail) values (?, ?)', (wallEmail, email))

def deleteSignedInUser(token):
    return executeChange('delete from signedInUsers where token = ?', (token,))

def deleteSignedInUserByEmail(email):
    return executeChange('delete from signedInUsers where email = ?', (email,))

def updateUserPassword(email, passwordHash):
    return executeChange('update users set password = ? where email = ?', (passwordHash, email))
