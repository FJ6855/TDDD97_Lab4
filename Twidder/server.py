import os
import json
import datetime, time
import hmac, hashlib, base64
from flask import Flask, request, send_from_directory
from flask.ext.bcrypt import Bcrypt
from wtforms import Form, TextField, PasswordField, validators
from random import randint
from geventwebsocket import WebSocketError
from werkzeug import secure_filename

from Twidder import app

import database_helper

bcrypt = Bcrypt(app)

webSockets = {}

UPLOAD_FOLDER = 'Twidder/files/'
ALLOWED_IMAGE_EXTENSIONS = set(['jpg', 'jpeg', 'png', 'gif'])
ALLOWED_VIDEO_EXTENSIONS = set(['mp4', 'ogg']) 
ALLOWED_AUDIO_EXTENSIONS = set(['mp3', 'wav', 'ogg'])

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024

class SignUpForm(Form):
    firstName = TextField('First name', [validators.Required()])
    lastName = TextField('Last name', [validators.Required()])
    gender = TextField('Gender', [validators.Required(), validators.AnyOf(values=['Male', 'Female'])])
    city = TextField('City', [validators.Required()])
    country = TextField('Country', [validators.Required()])
    signupEmail = TextField('Email', [validators.Required(), validators.Email()])
    signupPassword = PasswordField('Password', [validators.Required(), validators.Length(min=6)])

class ChangePasswordForm(Form):
    oldPassword = PasswordField('Old password', [validators.Required()])
    newPassword = PasswordField('New password', [validators.Required(), validators.Length(min=6)])

@app.before_request
def beforeRequest():
    database_helper.connectToDatabase()

@app.teardown_request
def teardownRequest(exception):
    database_helper.closeDatabaseConnection()

def createToken():
    """Returns a token containing 36 characters."""
    letters = 'abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    token = ''
    for i in range(0, 36):
        token += letters[randint(0,len(letters) - 1)]
    return token

def createFileName(fileExtension):
    """Returns a file name containing 10 characters."""
    letters = 'abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    fileName = ''
    for i in range(0, 10):
        fileName += letters[randint(0, len(letters) - 1)]
    fileName += "." + fileExtension
    return fileName

def getUTCTimestamp():
    """Returns a utc timestamp in format YYYY-MM-DD HH:MM:SS."""
    return datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

def getFileExtension(fileName):
    """Returns the file extension part of a file name"""
    return fileName.rsplit('.', 1)[1]

def getFileType(fileExtension):
    """Returns the type of file depending on the file extension."""
    if fileExtension in ALLOWED_IMAGE_EXTENSIONS:
        return 'image'
    elif fileExtension in ALLOWED_VIDEO_EXTENSIONS:
        return 'video'
    elif fileExtension in ALLOWED_AUDIO_EXTENSIONS:
        return 'audio'
    else:
        return ''

def validLogin(email, password):
    """Returns true if the password matches the password hash stored in the database for a user."""
    passwordHash = database_helper.getUserPasswordByEmail(email)
    if passwordHash is None:
        return False
    else:
        if bcrypt.check_password_hash(passwordHash, password):
            return True
        else:
            return False    

def validHMACHash(clientHash, data, email, timestamp):
    """Returns true if the client hash matches the hash created from the data and timestamp."""
    if clientHash is not None and timestamp is not None:
        now = datetime.datetime.strptime(getUTCTimestamp(), '%Y-%m-%d %H:%M:%S')
        # Check the time difference between now and the timestamp from the client.
        # If it exceeds five minutes then it is invalid.
        timeDifference = now - datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
        if timeDifference.seconds < 5 * 60:
            # Get the token from the database stored for the current user session and use it as key in hash.
            token = database_helper.getUserTokenByEmail(email)
            if token is not None:
                hmacObj = hmac.new(token.encode(), '', hashlib.sha256)
                for value in data:
                    hmacObj.update(value.encode('utf-8'))
                hmacObj.update("&timestamp=" + timestamp)
                serverHash = hmacObj.hexdigest()
                return clientHash == serverHash
    return False
                               
def emailExists(email):
    """Returns true if a user exists with a matching email in the database."""
    user = database_helper.getUserByEmail(email)
    if user is None:
        return False
    else:
        return True

def sendUsersCounter():
    """Send the number of signed in users to all web sockets."""
    database_helper.connectToDatabase()
    usersCounter = database_helper.getNumberOfSignedInUsers();
    for key in webSockets:
        webSockets[key].send(json.dumps({'type': 'usersCounter', 'data': usersCounter}))

def sendUserPostData(email):
    """Send data for posts chart for the specified user's email."""
    database_helper.connectToDatabase()
    numberOfPostsByUser = database_helper.getNumberOfPostsByUserOnWall(email, email)
    data = [{'value': numberOfPostsByUser, 'color': '#9DE0AD', 'label': email}]
    topTwo = database_helper.getTopTwoNumberOfPostsOnWallByOthers(email)
    numberOfPostsOnWall = database_helper.getNumberOfPostsOnWall(email)
    colors = ['#45ADA8', '#4F7A79']
    colorIndex = 0
    # Loop through the two top posters on the user's wall and assign them a color form the colors list.
    for writer in topTwo:
        data.append({'value': writer[1], 'color': colors[colorIndex], 'label': writer[0]})
        colorIndex += 1
    if webSockets.has_key(email):
        webSockets[email].send(json.dumps({'type': 'messageCounter', 'data': data}))

def sendUserPostTotalData(email):
    """Send number of total posts for the specified user's email."""
    database_helper.connectToDatabase()
    numberOfPostsOnWall = database_helper.getNumberOfPostsOnWall(email)
    if webSockets.has_key(email):
        webSockets[email].send(json.dumps({'type': 'messageCounterTotal', 'data': numberOfPostsOnWall}))

def sendUserViewData(email):
    """Send data for views chart for the specified user's email."""
    database_helper.connectToDatabase()
    views = database_helper.getViewsOnWallDuringLast6Months(email)
    posts = database_helper.getPostsOnWallDuringLast6Months(email)
    data = {'labels': ['', '', '', '', '', ''], 'datasets': []}
    # Setup the labels for the months, starts with todays month and adds the last 6 months in reverse order. 
    # The current month is at the end of the array.
    today = datetime.date.today()
    for i in range(0, 6):
        data['labels'][5 - i] = getMonthName(today.strftime('%m'))
        newMonth = today.month
        newMonth -= 1
        if newMonth == 0:
            newMonth = 12
        today = today.replace(month=newMonth)
    # Setup up the data in the form that chart.js expects it in.
    data['datasets'].append({'label': 'Number of views', 'data': [0, 0, 0, 0, 0, 0]})
    data['datasets'].append({'label': 'Number of posts', 'data': [0, 0, 0, 0, 0, 0]})
    data['datasets'][0]['fillColor'] = 'rgba(200,200,200,0.2)'
    data['datasets'][0]['strokeColor'] = 'rgba(200,200,200,1)'
    data['datasets'][0]['pointColor'] = 'rgba(200,200,200,1)'
    data['datasets'][1]['fillColor'] = 'rgba(157,224,173,0.2)'
    data['datasets'][1]['strokeColor'] = 'rgba(157,224,173,1)'
    data['datasets'][1]['pointColor'] = 'rgba(157,224,173,1)'
    for view in views:
        dataIndex = data['labels'].index(getMonthName(view[1]))
        data['datasets'][0]['data'][dataIndex] = view[2]
    for post in posts:
        dataIndex = data['labels'].index(getMonthName(post[1]))
        data['datasets'][1]['data'][dataIndex] = post[2]
    if webSockets.has_key(email):
        webSockets[email].send(json.dumps({'type': 'viewCounter', 'data': data}))

def getMonthName(month):
    """Returns the month name depening on the month number."""
    if month == "01":
        return "January"
    elif month == "02":
        return "February"
    elif month == "03":
        return "March"
    elif month == "04":
        return "April"
    elif month == "05":
        return "May"
    elif month == "06":
        return "June"
    elif month == "07":
        return "July"
    elif month == "08":
        return "August"
    elif month == "09":
        return "September"
    elif month == "10":
        return "October"
    elif month == "11":
        return "November"
    elif month == "12":
        return "December"
    else:
        return "Invalid month number"
        
def uploadFile(file, messageId):
    """Upload the given file and save it in the database."""
    if file and validFileType(file.filename):
        fileExtension = getFileExtension(file.filename)
        fileName = createFileName(fileExtension)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], fileName))
        database_helper.insertFile(fileName, messageId)

def validFileType(fileName):
    """Returns true if the file has valid fileExtension."""
    if '.' in fileName:
        fileExtension = getFileExtension(fileName)
        return fileExtension in ALLOWED_IMAGE_EXTENSIONS or fileExtension in ALLOWED_VIDEO_EXTENSIONS or fileExtension in ALLOWED_AUDIO_EXTENSIONS
    else:
        return False

@app.route('/')
@app.route('/home')
@app.route('/browse')
@app.route('/account')
def index():
    return app.send_static_file('client.html')

@app.route('/sign_in', methods=['POST'])
def signIn():
    """Signs in a user and returns a token to be used for hashing."""
    if validLogin(request.form['loginEmail'], request.form['loginPassword']):
        token = createToken()
        result = database_helper.insertSignedInUser(token, request.form['loginEmail']);
        if result == True:
            # Check if the user is signed in somewhere else (i.e socket is open) and if so force a logout.
            global webSockets
            if webSockets.has_key(request.form['loginEmail']):
                webSockets[request.form['loginEmail']].send(json.dumps({'type': 'signInStatus', 'data': 'logout'}));
            return json.dumps({'success': True, 'message': 'Successfully signed in.', 'data': {'token': token}}), 200
        else:
            return json.dumps({'success': False, 'message': 'Could not sign in user.'}), 503
    else:
        return json.dumps({'success': False, 'message': 'Wrong username or password.'}), 400

@app.route('/sign_up', methods=['POST'])
def signUp():
    """Signs up a user."""
    form = SignUpForm(request.form)
    if form.validate():
        if emailExists(request.form['signupEmail']) == False:
            # Hash the password with bcrypt before storing it in the database.
            passwordHash = bcrypt.generate_password_hash(request.form['signupPassword'])
            result = database_helper.insertUser(request.form['signupEmail'], request.form['firstName'], request.form['lastName'], request.form['gender'], request.form['city'], request.form['country'], passwordHash)
            if result == True:            
                return json.dumps({'success': True, 'message': 'Successfully created a new user.'}), 200
            else:
                return json.dumps({'success': False, 'message': 'Could not create user.'}), 503
        else:
            return json.dumps({'success': False, 'message': 'User already exists.'}), 400
    else:
        return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 400

@app.route('/sign_out/<email>', methods=['GET'])
def signOut(email):
    """Signs out a user."""
    data = ['email=' + email]
    clientHash = request.headers.get('Hash-Hmac')
    utcTimestamp = request.headers.get('Hash-Timestamp')
    if validHMACHash(clientHash, data, email, utcTimestamp):
        token = database_helper.getUserTokenByEmail(email)
        if token is not None:
            result = database_helper.deleteSignedInUser(token)
            if result == True:
                global webSockets
                if webSockets.has_key(email):
                    del webSockets[email]
                sendUsersCounter();
                return json.dumps({'success': True, 'message': 'Successfully signed out.'}), 200
            else:
                return json.dumps({'success': False, 'message': 'Could not delete signed in user.'}), 503
        else:
            return json.dumps({'success': False, 'message': 'You are not signed in.'}), 405
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405  
      
@app.route('/change_password/<email>', methods=['GET', 'POST'])
def changePassword(email):
    """Changes password for a user."""
    clientHash = request.headers.get('Hash-Hmac')
    utcTimestamp = request.headers.get('Hash-Timestamp')
    data = ['email=' + email, '&oldPassword=' + request.form['oldPassword'], '&newPassword=' + request.form['newPassword']]
    if validHMACHash(clientHash, data, email, utcTimestamp):
        form = ChangePasswordForm(request.form)
        if form.validate():
            if validLogin(email, request.form['oldPassword']):
                passwordHash = bcrypt.generate_password_hash(request.form['newPassword'])
                result = database_helper.updateUserPassword(email, passwordHash)
                if result == True:
                    return json.dumps({'success': True, 'message': 'Password changed.'}), 200
                else:
                    return json.dumps({'success': False, 'message': 'Could not update password.'}), 503
            else:
                return json.dumps({'success': False, 'message': 'Wrong password.'}), 400
        else:
            return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 405
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405
            
@app.route('/get_user_data/<email>', defaults={'profileEmail': None}, methods=['GET'])
@app.route('/get_user_data/<email>/<profileEmail>', methods=['GET'])
def getUserData(email, profileEmail):
    """Returns the profile information about a user."""
    data = ['email=' + email]
    if profileEmail is not None:
        data.append('&profileEmail=' + profileEmail)
    clientHash = request.headers.get('Hash-Hmac')
    utcTimestamp = request.headers.get('Hash-Timestamp')
    if validHMACHash(clientHash, data, email, utcTimestamp):
        user = database_helper.getUserByEmail(email)
        if user is not None:
            userDict = {'email': user[0], 'firstName': user[1], 'lastName': user[2], 'gender': user[3], 'city': user[4], 'country': user[5]}
            return json.dumps({'success': True, 'message': 'User data retrieved.', 'data': userDict}), 200
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405

@app.route('/get_user_messages/<email>', defaults={'profileEmail': None}, methods=['GET'])
@app.route('/get_user_messages/<email>/<profileEmail>', methods=['GET'])
def getUserMessagesByEmail(email, profileEmail):
    """Returns the messages for a user's wall."""
    data = ['email=' + email] 
    if profileEmail is None:
        profileEmail = email
    data.append('&profileEmail=' + profileEmail) 
    clientHash = request.headers.get('Hash-Hmac') 
    utcTimestamp = request.headers.get('Hash-Timestamp')
    if validHMACHash(clientHash, data, email, utcTimestamp):
        if emailExists(email):
            messages = database_helper.getUserMessagesByEmail(profileEmail)
            messagesList = []
            for message in messages:
                messageDict = {'messageId': message[0], 'message': message[1], 'datePosted': message[2], 'wallEmail': message[3], 'writer': message[4]}
                fileName = database_helper.getFileNameByMessageId(message[0])
                if fileName is not None:
                    messageDict.update({'fileName': fileName})
                    fileExtension = getFileExtension(fileName)
                    fileType = getFileType(fileExtension)
                    messageDict.update({'fileType': fileType})
                messagesList.append(messageDict)                
            return json.dumps({'success': True, 'message': 'User messages retreived.', 'data': messagesList}), 200
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405

@app.route('/post_message/<email>', methods=['POST'])
def postMessage(email):
    """Posts a message (and file if supplied) to a user's wall."""
    # Remove new lines in the message, otherwise the hash won't work.
    data = ['email=' + email, '&message=' + request.form['message'].replace("\r\n", ""), '&wallEmail=' + request.form['wallEmail']] 
    if len(request.files) > 0:
        data.append('&file=' + request.files['file'].filename);
    clientHash = request.headers.get('Hash-Hmac')
    utcTimestamp = request.headers.get('Hash-Timestamp')
    if validHMACHash(clientHash, data, email, utcTimestamp):
        if emailExists(request.form['wallEmail']):
            if len(request.form['message']) > 0:
                messageId = database_helper.insertMessage(email, request.form['wallEmail'], request.form['message'])
                if len(request.files) > 0:
                    uploadFile(request.files['file'], messageId)
                sendUserPostData(email)
                sendUserPostTotalData(email)
                sendUserViewData(email)
                return json.dumps({'success': True, 'message': 'Message posted.'}), 200
            else:
                return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 400
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405
            
@app.route('/post_view/<email>', methods=['POST'])
def postView(email):
    """Adds a view to a user's wall."""
    data = ['email=' + email, '&wallEmail=' + request.form['wallEmail']]
    clientHash = request.headers.get('Hash-Hmac')
    utcTimestamp = request.headers.get('Hash-Timestamp')
    if validHMACHash(clientHash, data, email, utcTimestamp):
        if emailExists(request.form['wallEmail']):
            database_helper.insertView(request.form['wallEmail'], email)
            sendUserViewData(request.form['wallEmail'])
            return json.dumps({'success': True, 'message': 'View added.'}), 200
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404   
    else:
        return json.dumps({'success': False, 'message': 'Invalid hash.'}), 405   

@app.route('/uploads/<fileName>')
def uploadedFile(fileName):
    """Returns a file from the upload folder."""
    path = os.path.abspath(app.config['UPLOAD_FOLDER'])
    return send_from_directory(path, fileName)

@app.route('/api')
def api():
    """Handles web socket connections."""
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        email = ws.receive()
        global webSockets       
        webSockets[email] = ws
        sendUsersCounter()
        sendUserPostData(email)
        sendUserPostTotalData(email)
        sendUserViewData(email)
        # Infinite loop to keep the socket open.
        try:
            while True:
                message = ws.receive()
        except WebSocketError:
            # If there is an error the user or browser has closed the socket so we remove it.
            if webSockets.has_key(email):
                del webSockets[email]
            #print "Web socket error"
    return ""
