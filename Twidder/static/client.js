// web socket object
var webSocket;

// chart object for posts data
var postsChart;
// chart object for views data
var viewsChart;

/**
 * ifequal() is a function for Handlebars that checks if the two arguments are equal or not
 */
Handlebars.registerHelper("ifequal", function(leftArgument, rightArgument, options) {
    if (leftArgument == rightArgument)
	return options.fn(this);
    else
	return options.inverse(this);
});

window.onload = function()
{
    if (isUserSignedIn())
	loadSignedIn();

    setupClientSideRouting();
}

/**
 * isUserSignedIn() checks if the user's token and email is stored or not in local storage
 * called whenever the user's state need to be checked
 *
 * @return {Boolean} 
 */
var isUserSignedIn = function()
{
    return (localStorage.getItem("userToken") !== null && localStorage.getItem("userEmail") !== null);
}

/**
 * loadSignedIn() loads the profile view and sets up all the forms, menu, event listeners, web socket etc. for this view 
 */
var loadSignedIn = function()
{
    displayView("profileView");
  
    var email = localStorage.getItem("userEmail");
    
    loadProfileInformation(email, function(profileInformation) {
	displayProfileInformation(profileInformation, "home");
    });
    
    loadMessages(email, function(messages) {
	displayMessages(messages, "home");
    });

    setupMenuItems();
    
    setupProfileForTab({tab: "home", wallTitle: "My wall", hide: false});
    setupProfileForTab({tab: "browse", wallTitle: "Wall", hide: true});

    setupChangePasswordForm();

    setupPostMessageFormForTab("home");
    setupPostMessageFormForTab("browse");
    
    setupMessageOnDrop(document.getElementById("homeMessage"));
    setupMessageOnDrop(document.getElementById("browseMessage"));

    setupRefreshButtonForTab(document.getElementById("homeRefreshButton"), "home");
    setupRefreshButtonForTab(document.getElementById("browseRefreshButton"), "browse");

    setupSearchProfileForm();

    document.getElementById("signOut").onclick = signOut;

    setupWebSocket();
}

/**
 * loadSignedOut() loads the welcome view and sets up the forms for this view 
 */
var loadSignedOut = function()
{    
    displayView("welcomeView");

    setupLoginForm();

    setupSignUpForm();
}

/* DISPLAY FUNCTIONS */

/**
 * displayView() displays the view with matching view id
 * adds the messageViewContainer to the body aswell, so displayMessage and hideMessage can be used
 * called when views need to be swapped (like signing in or out)
 * 
 * @param {String} viewId
 */
var displayView = function(viewId)
{
    var alertMessageView = document.getElementById("alertMessageView");

    document.getElementsByTagName("body")[0].innerHTML = alertMessageView.innerHTML;
   
    var view = document.getElementById(viewId);
    
    document.getElementsByTagName("body")[0].innerHTML += view.innerHTML;
}

/**
 * displayMessage() displays a message at the top of the page and hidden autmoatically after 3 seconds
 * the type is used as a class for the element so the style changes if it's an error message or an info message
 * called whenever a message needs to be communicated to the user
 * 
 * @param {String} message
 * @param {String} type
 */
var displayMessage = function(message, type)
{
    setTimeout(hideMessage, 3000);

    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = type;

    alertMessage.innerHTML = message;
}

/**
 * hideMessage() hides the message displayed with displayMessage() function
 * called by a setTimeout function set in displayMessage()
 */
var hideMessage = function()
{
    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = "";

    alertMessage.innerHTML = "";
}

/**
 * displayProfileInformation() shows the profileInformation for a user in the specified tab
 * called when a user signs in or when a user search for another user's wall in browse tab
 * 
 * @param {Object} profileInformation
 * @param {String} tab
 */
var displayProfileInformation = function(profileInformation, tab)
{ 
    var source = document.getElementById("profileInformationTemplate").innerHTML;
    
    var template = Handlebars.compile(source);
    
    var html = template(profileInformation);
    
    document.getElementById(tab + "ProfileInformation").innerHTML = html;
}

/**
 * displayMessages() shows the messages for a wall in the specified tab
 * called when a user signs in, when a user search for another user's wall in browse tab or refreshes a wall
 * 
 * @param {Array} messages
 * @param {String} tab
 */
var displayMessages = function(messages, tab)
{
    var source = document.getElementById("messagesTemplate").innerHTML;

    var template = Handlebars.compile(source);

    var html = template({messages: messages});

    document.getElementById(tab + "Messages").innerHTML = html;

    setupMessagesOnDrag();
}

/**
 * displayTab() displays the matching tab
 * called when a user switches between tabs using the menu (i.e when client side routing is performed)
 * 
 * @param {String} tab
 */
var displayTab = function(tab)
{    
    setSelectedMenuItem(tab + "Button");
    
    var selectedTab = document.getElementsByClassName("selectedTab");
    
    selectedTab[0].classList.remove("selectedTab");
    
    document.getElementById(tab + "Tab").classList.add("selectedTab");

    document.title = "Twidder - " + tab.charAt(0).toUpperCase() + tab.slice(1);
}

/**
 * displayBrowseElements() displays the elements with class "hide" in the browse tab
 * called when a user searches for another user in the browse tab and finds a match
 */
var displayBrowseElements = function()
{
    var browseElements = document.getElementById("browseTab").getElementsByClassName("hide");

    for (var i = browseElements.length - 1; i >= 0; --i)
    {
	browseElements[i].classList.remove("hide");
    }
}

/* SETUP FUNCTIONS */

/**
 * setupClientSideRouting() sets up client-side routing
 * called at the loading of the page, should only be called once
 */
var setupClientSideRouting = function()
{
    page("/", function() {
	if (isUserSignedIn())
	    page.redirect("/home");
	else
	    loadSignedOut();
    });

    page("/home", function() {
	if (isUserSignedIn())
	    displayTab("home");
	else
	    page.redirect("/");
    });

    page("/browse", function() {
	if (isUserSignedIn())
	    displayTab("browse");
	else
	    page.redirect("/");	    
    });

    page("/account", function() {
	if (isUserSignedIn())
	    displayTab("account");
	else
	    page.redirect("/");	    
    });

    page.start();
}

/**
 * setupClientSideRouting() sets up the login form
 * called when setting up the "welcome" view, should only be called once
 */
var setupLoginForm = function()
{    
    document.getElementById("loginForm").onsubmit = function()
    {
	signIn();

	return false;
    };
    
    clearCustomValidityOnInput(document.getElementById("loginEmail"));
}

/**
 * setupSignUpForm() sets up the sing up form
 * called when setting up the "welcome" view, should only be called once
 */
var setupSignUpForm = function()
{   
    document.getElementById("signUpForm").onsubmit = function()
    {
	signUp();

	return false;
    };

    validatePasswordLengthOnInput(document.getElementById("signupPassword"));

    validatePasswordMatchOnInput(document.getElementById("signupPassword"), document.getElementById("repeatPassword"));
}

/**
 * setupProfileForTab() sets up the profile layout for a tab using a template
 * called when setting up the "profile" view, should only be called once
 * 
 * @param {Object} tabData
 */
var setupProfileForTab = function(tabData)
{
    var source = document.getElementById("profileTemplate").innerHTML;

    var template = Handlebars.compile(source);

    var html = template(tabData);

    document.getElementById(tabData["tab"] + "Tab").innerHTML += html;
}

/**
 * setupPostMessageFormForTab() sets up the form for posting a message for the specified
 * called when setting up the "profile" view, should only be called once
 * 
 * @param {String} tab
 */
var setupPostMessageFormForTab = function(tab)
{
    document.getElementById(tab + "PostMessageForm").onsubmit = function()
    {
        var message = document.getElementById(tab + "Message").value;

        var file = document.getElementById(tab + "File");

	if (tab == "home")
            var email = localStorage.getItem("userEmail");
	else
	    var email = localStorage.getItem("currentBrowseEmail");

        var callbackFunction = function() 
        {        
            document.getElementById(tab + "PostMessageForm").reset();

            loadMessages(email, function(messages) {
		displayMessages(messages, tab);
	    });
        }

        if (file.value != "")
        {
            postMessageAndFileToWall(message, file.files[0], email, callbackFunction);
        }
        else
        {
            postMessageToWall(message, email, callbackFunction)
        }

	return false;
    }
}

/**
 * setupSearchProfileForm() sets up the form for searching for other users
 * called when setting up the "profile" view, should only be called once
 */
var setupSearchProfileForm = function()
{
    document.getElementById("searchProfileForm").onsubmit = function()
    {
        var email = document.getElementById("profileEmail").value;

        loadProfileInformation(email, function(profileInformation) {
            displayProfileInformation(profileInformation, "browse");

            localStorage.setItem("currentBrowseEmail", email);

            displayBrowseElements();

            addViewToWall(email);
        });

        loadMessages(email, function(messages) {
            displayMessages(messages, "browse");
        });

	return false;
    };
}

/**
 * setupRefreshButtonForTab() sets up the onclick function for the refresh button for a wall on the specified tab
 * called when setting up the "profile" view, should only be called once
 * 
 * @param {Element} element (button element)
 * @param {String} tab
 */
var setupRefreshButtonForTab = function(element, tab)
{
    element.onclick = function()
    {	
	var email = "";

	if (tab == "home")
	    email = localStorage.getItem("userEmail");
	else if (tab == "browse")
	    email = localStorage.getItem("currentBrowseEmail");

	loadMessages(email, function(messages) {
	    displayMessages(messages, tab);
	});
    }
}

/**
 * setupMenuItems() sets up the onclick function for the menu buttons
 * called when setting up the "profile" view, should only be called once
 */
var setupMenuItems = function()
{
    var menuItems = document.getElementsByClassName("menuItem");

    for (var i = 0; i < menuItems.length; ++i)
    {
	menuItems[i].onclick = function()
	{
	    menuItemClick(this);
	}
    }
}

/**
 * setupChangePasswordForm() sets up the form for changing password
 * called when setting up the "profile" view, should only be called once
 */
var setupChangePasswordForm = function()
{
    document.getElementById("changePasswordForm").onsubmit = function()
    {
	changePassword();

	return false;
    };

    validatePasswordLengthOnInput(document.getElementById("newPassword"));
	
    validatePasswordMatchOnInput(document.getElementById("newPassword"), document.getElementById("repeatNewPassword"));
}

/**
 * setupMessageOnDrop() sets up ondrop event for a specified textarea element
 * called when setting up the "profile" view, should only be called once
 * 
 * @param {Element} element (textarea element)
 */
var setupMessageOnDrop = function(element)
{    
    element.ondrop = function(event)
    {
	event.preventDefault();

	var writer = event.dataTransfer.getData("writer");
	var message = event.dataTransfer.getData("message");

	if (writer != "" && message != "")
	    event.target.value += 'Reply to: ' + writer + '\n' + message;
    };

    element.ondragover = function(event)
    {
	event.preventDefault();
    };
}

/**
 * setupMessagesOnDrag() sets up ondragstart event for the elements with class name messageContainer (i.e messages on a wall)
 * called when setting up the "profile" view, should only be called once
 */
var setupMessagesOnDrag = function()
{
    var containers = document.getElementsByClassName("messageContainer");

    for (var i = 0; i < containers.length; ++i)
    {
	containers[i].ondragstart = function(event)
	{
	    event.dataTransfer.setData("writer", event.target.getElementsByTagName("H2")[0].innerHTML);
	    event.dataTransfer.setData("message", event.target.getElementsByTagName("P")[0].innerHTML);
	};
    }
}

/**
 * setupWebSocket() sets up a web socket with the server
 * sets up functions for onopen and onmessage events
 * called when setting up the "profile" view, should only be called once
 */
var setupWebSocket = function() 
{
    webSocket = new WebSocket("ws://127.0.0.1:5000/api");
    
    webSocket.onopen = function()
    {
	webSocket.send(localStorage.getItem("userEmail"));
    };
    
    webSocket.onmessage = function(message)
    {
	console.log("Web socket received message");

	var response = JSON.parse(message.data);
	
	console.log(response);

	if (response.type == 'signInStatus' && response.data == 'logout')
	{
	    signOut();
	}
	else if (response.type == 'usersCounter')
	{
	    updateUsersCounter(response.data);
	}
	else if (response.type == 'viewCounter')
	{
	    updateViewsChart(response.data);
	}
	else if (response.type == 'messageCounter')
	{
	    updatePostsChart(response.data);
	}
	else if (response.type == 'messageCounterTotal')
	{   
	    updatePostsCounter(response.data);
	}
    };
}

/* FUNCTIONS FOR SERVER CALLS */

/**
 * signOut() signs out the user
 * called when the user clicks the sign out button or when the web socket recieves a sign out message
 */
var signOut = function()
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({'email': localStorage.getItem("userEmail")}, utcTimestamp);

    makeHttpRequest("GET", "sign_out", localStorage.getItem("userEmail"), "", hash, utcTimestamp, function(response) {	
	localStorage.removeItem("userToken");
	localStorage.removeItem("userEmail");
	localStorage.removeItem("currentBrowseEmail");
	
	webSocket.close();

	page.redirect("/");
    });
}

/**
 * signIn() signs in a user
 * called when the user submits the sign in form 
 */
var signIn = function()
{
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");

    var data = {
	loginEmail: loginEmail.value,
	loginPassword: loginPassword.value,
    };

    makeHttpRequest("POST", "sign_in", "", data, "", "", function(response) {
	localStorage.setItem("userEmail", loginEmail.value);
	localStorage.setItem("userToken", response.data.token);
	
	loadSignedIn();

	page.redirect("/home");
    }); 
}

/**
 * signUp() signs up a users
 * called when the user submits the sign up form 
 */
var signUp = function()
{
    var signupPassword = document.getElementById("signupPassword");
    var repeatPassword = document.getElementById("repeatPassword");
    
    if (validPasswordLength(signupPassword.value) && validPasswordMatch(signupPassword.value, repeatPassword.value))
    {
	var data = {
	    signupEmail: document.getElementById("signupEmail").value,
	    signupPassword: signupPassword.value,
	    firstName: document.getElementById("firstName").value,
	    lastName: document.getElementById("lastName").value,
	    gender: document.getElementById("gender").value,
	    city: document.getElementById("city").value,
	    country: document.getElementById("country").value,
	};

	makeHttpRequest("POST", "sign_up", "", data, "", "", function(response) {
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("signUpForm").reset();
	}); 
    }
}

/**
 * changePassword() changes the password for the user
 * called when the user submits the change password form 
 */
var changePassword = function()
{
    var oldPassword = document.getElementById("oldPassword");
    var newPassword = document.getElementById("newPassword");
    var repeatNewPassword = document.getElementById("repeatNewPassword");

    if (validPasswordLength(newPassword.value) && validPasswordMatch(newPassword.value, repeatNewPassword.value))
    {
	var data = {
	    oldPassword: oldPassword.value,
	    newPassword: newPassword.value,
	};

	var utcTimestamp = getUTCTimestamp();

	var hash = createHash({email: localStorage.getItem("userEmail"), oldPassword: oldPassword.value, newPassword: newPassword.value}, utcTimestamp);

	makeHttpRequest("POST", "change_password", localStorage.getItem("userEmail"), data, hash, utcTimestamp, function(response) {
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("changePasswordForm").reset();
	}); 
    }
}

/**
 * postMessageToWall() posts a message to the specified wall (i.e wall with matching email)
 * called when the user submits the post message form 
 * 
 * @param {String} message
 * @param {String} email
 * @param {Function} callbackFunction
 */
var postMessageToWall = function(message, email, callbackFunction)
{   
    var data = {message: message, wallEmail: email};

    postMessage(email, data, callbackFunction);
} 

/**
 * postMessageAndFileToWall() posts a message and a file to the specified wall (i.e wall with matching email)
 * called when the user submits the post message form 
 * 
 * @param {String} message
 * @param {File} file
 * @param {String} email
 * @param {Function} callbackFunction
 */
var postMessageAndFileToWall = function(message, file, email, callbackFunction)
{
    if (validFileSize(file.size))
    {
        var data = {message: message, wallEmail: email, file: file};
        
        postMessage(email, data, callbackFunction);
    }
    else
    {
        displayMessage("File size is too big. Max size allowed: 4Mb.", "errorMessage");
    }
}

/**
 * postMessage() is a helper function for postMessageToWall and postMessageAndFileToWall
 * it does the actual post request to the server
 * 
 * @param {String} wallEmail
 * @param {Object} data
 * @param {Function} callbackFunction
 */
var postMessage = function(wallEmail, data, callbackFunction)
{
    var utcTimestamp = getUTCTimestamp();
    
    // Remove new lines in the message, otherwise the hash won't work
    var hashData = {email: localStorage.getItem("userEmail"), message: data["message"].replace(/\r?\n|\r/g, ""), wallEmail: data["wallEmail"]};

    if (data.hasOwnProperty("file"))
	hashData["file"] = data["file"].name;

    var hash = createHash(hashData, utcTimestamp);

    makeHttpRequest("POST", "post_message", localStorage.getItem("userEmail"), data, hash, utcTimestamp, function(response) {
        displayMessage(response.message, "infoMessage");

        callbackFunction();
    });
}

/**
 * addViewToWall() adds a view to the specified wall
 * called when a user searches for another user's wall in the browse tab and finds a match
 * 
 * @param {String} wallEmail
 */
var addViewToWall = function(wallEmail)
{
    var data = {wallEmail: wallEmail};

    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({email: localStorage.getItem("userEmail"), wallEmail: wallEmail}, utcTimestamp);

    makeHttpRequest("POST", "post_view", localStorage.getItem("userEmail"), data, hash, utcTimestamp, function(response) {
	console.log(response.message);
    });
}

/**
 * loadProfileInformation() loads the profile information for a user
 * called when a user signs in or searches for another user's wall in the browse tab and finds a match
 * 
 * @param {String} profileEmail
 * @param {Function} callbackFunction
 */
var loadProfileInformation = function(profileEmail, callbackFunction)
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({email: localStorage.getItem("userEmail"), profileEmail: profileEmail}, utcTimestamp);

    makeHttpRequest("GET", "get_user_data", localStorage.getItem("userEmail") + "/" + profileEmail, "", hash, utcTimestamp, function(response) {
	var profileInformation = {
	    name: response.data.firstName + " " + response.data.lastName,
	    email: response.data.email,
	    gender: response.data.gender,
	    city: response.data.city,
		    country: response.data.country,
	};

	callbackFunction(profileInformation);
    });
}

/**
 * loadMessages() loads the messages for a user's wall
 * called when a user signs in or searches for another user's wall in the browse tab and finds a match
 * 
 * @param {String} profileEmail
 * @param {Function} callbackFunction
 */
var loadMessages = function(profileEmail, callbackFunction)
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({email: localStorage.getItem("userEmail"), profileEmail: profileEmail}, utcTimestamp);

    makeHttpRequest("GET", "get_user_messages", localStorage.getItem("userEmail") + "/" + profileEmail, "", hash, utcTimestamp, function(response) {
	callbackFunction(response.data);
    });
}

/* VALIDATION FUNCTIONS */

/**
 * validPasswordLength() checks that the password is at least 6 charachters long
 * called when a user submits the sign up or changes password form
 * 
 * @param {String} password
 * @return {Boolean}
 */
var validPasswordLength = function(password)
{
    return (password.length >= 6);
}

/**
 * validPasswordMatch() checks that the repeated password matches the other password
 * called when a user submits the sign up or changes password form
 * 
 * @param {String} repeatPassword
 * @param {String} password
 * @return {Boolean}
 */
var validPasswordMatch = function(repeatPassword, password)
{
    return (password == repeatPassword);
}

/**
 * validPasswordMatch() checks that fileSize is less than 4 Mb
 * called when a user tries to post a message and file to a wall
 * 
 * @param {String} fileSize
 * @return {Boolean}
 */
var validFileSize = function(fileSize)
{
    return (fileSize / 1000000 < 4); 
}

/**
 * clearCustomValidityOnInput() removes the custom validation message on a specified input element
 * called when a user inputs something new to the specified input element
 * 
 * @param {Element} element
 */
var clearCustomValidityOnInput = function(element)
{
    element.oninput = function()
    {
	element.setCustomValidity("");
    }
}

/**
 * validatePasswordLengthOnInput() checks the password length on the specified input element
 * called when a user inputs something to a specified password element and sets a custom validation message
 * 
 * @param {Element} element
 */
var validatePasswordLengthOnInput = function(element)
{
    element.oninput = function()
    {
	if (validPasswordLength(element.value)) 
	    element.setCustomValidity("");
	else
	    element.setCustomValidity("Password must be at least 6 characters long.");
    }
}

/**
 * validatePasswordLengthOnInput() checks the repeated password matches the other password
 * called when a user inputs something to a specified password element and sets a custom validation message
 * 
 * @param {Element} element
 * @param {Element} elementToMatch
 */
var validatePasswordMatchOnInput = function(element, elementToMatch)
{
    elementToMatch.oninput = function()
    {
	if (validPasswordMatch(element.value, elementToMatch.value))
	    elementToMatch.setCustomValidity("");
	else
	    elementToMatch.setCustomValidity("Password doesn't match.");
    }
}

/* MENU FUNCTIONS */

/**
 * setSelectedMenuItem() sets the menu item with mathcing id attribute as selected (and all others as not selected)
 * called when a user switches between tabs
 * 
 * @param {String} menuItemId
 */
var setSelectedMenuItem = function(menuItemId)
{
    var selectedMenuItem = document.getElementsByClassName("selected");

    selectedMenuItem[0].classList.remove("selected");

    document.getElementById(menuItemId).classList.add("selected");
}

/**
 * menuItemClick() is called when a user clicks on a menu item
 * sets the clicked menu item as selected and performs client-side routing depeding on which menu item it is
*
 * @param {Element} menuItem
 */
var menuItemClick = function(menuItem)
{
    setSelectedMenuItem(menuItem.getAttribute("id"));

    if (menuItem.getAttribute("id") == "homeButton")
    {
	history.pushState(null, null, "/home");
	page.redirect("/home");
    }
    else if (menuItem.getAttribute("id") == "browseButton")
    {
	history.pushState(null, null, "/browse");    
	page.redirect("/browse");
    }
    else if (menuItem.getAttribute("id") == "accountButton")
    {
	history.pushState(null, null, "/account");
	page.redirect("/account");
    }
}

/* LIVE DATA FUNCTIONS */

/**
 * updateUsersCounter() updates the counter for the number of signed in users
 * called when the web socket recieves a update users counter message
 */
var updateUsersCounter = function(data)
{
    document.getElementById("usersCounter").innerHTML = "Users online: " + data;
}

/**
 * updatePostsChart() updates the data for the posts chart on the account tab
 * called when the web socket recieves a update posts data message
 */
var updatePostsChart = function(data)
{
    var context = document.getElementById("postsChart").getContext("2d");
    
    if (postsChart !== undefined)
	postsChart.destroy();
    
    postsChart = new Chart(context).Doughnut(data, {animationSteps: 80, animationEasing: "easeInOutQuart", legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'});
    
    var legendHTML = postsChart.generateLegend();
    
    document.getElementById("postsStatsLegend").innerHTML = legendHTML;
}

/**
 * updatePostsCounter() updates the counter for the number of total posts
 * called when the web socket recieves a update posts counter message
 */
var updatePostsCounter = function(data)
{
    document.getElementById("totalPosts").innerHTML = '<span>Total</span><br/>' + data;
}

/**
 * updateViewsChart() updates the data for the views chart on the account tab
 * called when the web socket recieves a update views data message
 */
var updateViewsChart = function(data)
{
    var context = document.getElementById("viewsChart").getContext("2d");
    
    if (viewsChart !== undefined)
	viewsChart.destroy();
    
    viewsChart = new Chart(context).Line(data, {});
}

/* HTTP REQUEST */

/**
 * getUTCTimestamp() returns a utc timestamp string in the format YYYY-MM-DD HH:MM:SS
 * called when creating a hash for a http request
 * 
 * @return {String}
 */
var getUTCTimestamp = function()
{
    var now = new Date();

    return now.getUTCFullYear() + "-" + (now.getUTCMonth() + 1) + "-" + now.getUTCDate() + " " + now.getUTCHours() + ":" + now.getUTCMinutes() + ":" + now.getUTCSeconds();
}

/**
 * createHash() creates a hmac hash for a http request
 * all properties of data are added to the hash as well as the timestamp
 * called when creating a hash for a http request
 * 
 * @param {Object} data
 * @param {String} timestamp
 * @return {String}
 */
var createHash = function(data, timestamp)
{    
    var shaObj = new jsSHA("SHA-256", "TEXT", {encoding: "UTF8"});
    
    // Set user token as hash-key
    shaObj.setHMACKey(localStorage.getItem("userToken"), "TEXT");
        
    var i = 0;

    // Add all the properties of the data object to the hash and seperates them like so: key=value&key=value&key=value..
    for (var key in data)
    {
	if (data.hasOwnProperty(key))
	{
	    if (i == 0)
		shaObj.update(key + "=" + data[key]);
	    else
		shaObj.update("&" + key + "=" + data[key]);

	    ++i;
	}
    }
    
    // Always add the timestamp to the end
    shaObj.update("&timestamp=" + timestamp);

    return shaObj.getHMAC("HEX");
}

/**
 * makeHttpRequest() makes a http request to the server for the specified url
 * called when the user submits a form or requests data from the server
 * 
 * @param {String} type (GET or POST)
 * @param {String} url
 * @param {String} parameters
 * @param {Object} data
 * @param {String} hash
 * @param {String} timestamp
 * @param {Function} callbackFunction
 */
var makeHttpRequest = function(type, url, parameters, data, hash, timestamp, callbackFunction)
{
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function()
    {
	if (xhttp.readyState == 4)
	{
	    console.log(xhttp.responseText);

	    var response = JSON.parse(xhttp.responseText);
	    
	    if (response.success)
	    {
		callbackFunction(response);
	    }
	    else
	    {	
		displayMessage(response.message, "errorMessage");
	    }
	}
    };
    
    url = "http://127.0.0.1:5000/" + url;
        
    if (parameters != "")
	url += "/" + parameters;

    xhttp.open(type, url, true);

    // If timestamp and hash are provided then we add them to custom headers to not clutter the url
    if (timestamp != "")
	xhttp.setRequestHeader('Hash-Timestamp', timestamp); 
	
    if (hash != "")
	xhttp.setRequestHeader('Hash-Hmac', hash);

    if (type == "POST")
    {
	var formData = new FormData();
	
	// Convert the data provided to form data to easier send it in the post 
	for (var key in data)
	{
	    formData.append(key, data[key]);
	}
	
	xhttp.send(formData);
    }
    else
    {
	xhttp.send();
    }
}
