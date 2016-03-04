var webSocket;
var postsChart;
var viewsChart;

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

    page('/', function() {
	if (isUserSignedIn())
	{
	    page.redirect("/home");
	}
	else
	{
	    loadSignedOut();
	}
    });

    page('/home', function() {
	if (isUserSignedIn())
	{
	    displayTab("home");
	    
	    var email = localStorage.getItem("userEmail");
	    
	    loadProfileInformation(email, function(profileInformation) {
		displayProfileInformation(profileInformation, "home");
	    });
	    
	    loadMessages(email, function(messages) {
		displayMessages(messages, "home");
	    });
	}
	else
	{
	    page.redirect("/");
	}
    });

    page('/browse', function() {
	if (isUserSignedIn())
	    displayTab("browse");
	else
	    page.redirect("/");	    
    });

    page('/account', function() {
	if (isUserSignedIn())
	{
	    displayTab("account");
	}
	else
	{
	    page.redirect("/");	    
	}
    });

    page.start();
}

var isUserSignedIn = function()
{
    return localStorage.getItem("userToken") !== null;
}

var loadSignedIn = function()
{
    displayView("profileView");

    setupMenuItems();

    setupChangePasswordForm();

    setupPostMessageFormForTab("home");
    setupPostMessageFormForTab("browse");
    
    setupMessageOnDrop(document.getElementById("homeMessage"));
    setupMessageOnDrop(document.getElementById("browseMessage"));

    setupRefreshButton(document.getElementById("homeRefreshButton"), localStorage.getItem("userEmail"), "home");
    setupRefreshButton(document.getElementById("browseRefreshButton"), localStorage.getItem("currentBrowseEmail"), "browse");

    setupSearchProfileForm();

    document.getElementById("signOut").onclick = signOut;

    setupWebSocket();
}

var loadSignedOut = function()
{    
    displayView("welcomeView");

    setupLoginForm();

    setupSignUpForm();
}

/* DISPLAY FUNCTIONS */

var displayView = function(viewId)
{
    var alertMessageView = document.getElementById("alertMessageView");

    document.getElementsByTagName("body")[0].innerHTML = alertMessageView.innerHTML;
   
    var view = document.getElementById(viewId);
    
    document.getElementsByTagName("body")[0].innerHTML += view.innerHTML;
}

var displayMessage = function(message, type)
{
    setTimeout(hideMessage, 3000);

    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = type;

    alertMessage.innerHTML = message;
}

var hideMessage = function()
{
    var alertMessage = document.getElementById("alertMessage");

    alertMessage.className = "";

    alertMessage.innerHTML = "";
}

var displayProfileInformation = function(profileInformation, tab)
{ 
    var source = document.getElementById("profileInformationTemplate").innerHTML;
    
    var template = Handlebars.compile(source);
    
    var html = template(profileInformation);
    
    document.getElementById(tab + "ProfileInformation").innerHTML = html;
}

var displayMessages = function(messages, tab)
{
    var source = document.getElementById("messagesTemplate").innerHTML;

    var template = Handlebars.compile(source);

    var html = template({messages: messages});

    document.getElementById(tab + "Messages").innerHTML = html;

    setupMessagesOnDrag();
}

var displayTab = function(tab)
{    
    setSelectedMenuItem(tab + "Button");
    
    var selectedTab = document.getElementsByClassName("selectedTab");
    
    selectedTab[0].classList.remove("selectedTab");
    
    document.getElementById(tab + "Tab").classList.add("selectedTab");
}

var displayBrowseElements = function()
{
    var browseElements = document.getElementsByClassName("hideBrowseElement");

    for (var i = browseElements.length - 1; i >= 0; --i)
    {
	browseElements[i].classList.remove("hideBrowseElement");
    }
}

/* SETUP FUNCTIONS */

var setupLoginForm = function()
{    
    document.getElementById("loginForm").onsubmit = function()
    {
	signIn();

	return false;
    };
    
    clearCustomValidityOnInput(document.getElementById("loginEmail"));
}

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

var setupRefreshButton = function(element, email, tab)
{
    element.onclick = function()
    {	
	loadMessages(email, function(messages) {
	    displayMessages(messages, tab);
	});
    }
}

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

/* SERVER CALLS */

var signOut = function()
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({'token': localStorage.getItem("userToken")}, utcTimestamp);

    makeHttpRequest("GET", "sign_out", localStorage.getItem("userToken"), "", hash, utcTimestamp, function(response) {
	localStorage.removeItem("userToken");
	
	webSocket.close();

	page.redirect("/");
    });
}

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
	localStorage.setItem("secretKey", response.data.secretKey);
	
	loadSignedIn();

	page.redirect("/home");
    }); 
}

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
	    
	    document.getElementById("signupForm").reset();
	}); 
    }
}

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

	var hash = createHash({token: localStorage.getItem("userToken"), oldPassword: oldPassword.value, newPassword: newPassword.value}, utcTimestamp);

	makeHttpRequest("POST", "change_password", localStorage.getItem("userToken"), data, hash, utcTimestamp, function(response) {
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("changePasswordForm").reset();
	}); 
    }
}

var postMessageToWall = function(message, email, callbackFunction)
{   
    var data = {message: message};

    postMessage(email, data, callbackFunction);
} 

var postMessageAndFileToWall = function(message, file, email, callbackFunction)
{
    if (validFileSize(file.size))
    {
        var data = {message: message, file: file};
        
        postMessage(email, data, callbackFunction);
    }
    else
    {
        displayMessage("File size is too big. Max size allowed: 4Mb.", "errorMessage");
    }
}

/* Helper function for postMessageToWall and postMessageAndFileToWall */
var postMessage = function(email, data, callbackFunction)
{
    //var parameters = {token: localStorage.getItem("userToken"), wallEmail: wallEmail};
    var utcTimestamp = getUTCTimestamp();

    var hashData = {token: localStorage.getItem("userToken"), email: email, message: data['message']};

    if (data.hasOwnProperty("file"))
	hashData["file"] = data["file"].name;

    var hash = createHash(hashData, utcTimestamp);

    makeHttpRequest("POST", "post_message", localStorage.getItem("userToken") + "/" + email, data, hash, utcTimestamp, function(response) {
        displayMessage(response.message, "infoMessage");

        callbackFunction();
    });
}

var addViewToWall = function(wallEmail)
{
    var data = {wallEmail: wallEmail};

    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({token: localStorage.getItem("userToken"), wallEmail: wallEmail}, utcTimestamp);

    makeHttpRequest("POST", "post_view", localStorage.getItem("userToken"), data, hash, utcTimestamp, function(response) {
	console.log(response.message);
    });
}

var loadProfileInformation = function(email, callbackFunction)
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({token: localStorage.getItem("userToken"), email: email}, utcTimestamp);

    makeHttpRequest("GET", "get_user_data", localStorage.getItem("userToken") + "/" + email, "", hash, utcTimestamp, function(response) {
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

var loadMessages = function(email, callbackFunction)
{
    var utcTimestamp = getUTCTimestamp();

    var hash = createHash({token: localStorage.getItem("userToken"), email: email}, utcTimestamp);

    makeHttpRequest("GET", "get_user_messages", localStorage.getItem("userToken") + "/" + email, "", hash, utcTimestamp, function(response) {
	callbackFunction(response.data);
    });
}

/* VALIDATION FUNCTIONS */

var validPasswordLength = function(password)
{
    return (password.length >= 6);
}

var validPasswordMatch = function(repeatPassword, password)
{
    return (password == repeatPassword);
}

var validFileSize = function(fileSize)
{
    return (fileSize / 1000000 < 4); 
}

var clearCustomValidityOnInput = function(element)
{
    element.oninput = function()
    {
	element.setCustomValidity("");
    }
}

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

var setSelectedMenuItem = function(menuItemId)
{
    var selectedMenuItem = document.getElementsByClassName("selected");

    selectedMenuItem[0].classList.remove("selected");

    document.getElementById(menuItemId).classList.add("selected");
}

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

var updateUsersCounter = function(data)
{
    document.getElementById("usersCounter").innerHTML = "Users online: " + data;
}

var updatePostsChart = function(data)
{
    var context = document.getElementById("postsChart").getContext("2d");
    
    if (postsChart !== undefined)
	postsChart.destroy();
    
    postsChart = new Chart(context).Doughnut(data, {animationSteps: 80, animationEasing: "easeInOutQuart", legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'});
    
    var legendHTML = postsChart.generateLegend();
    
    document.getElementById("postsStatsLegend").innerHTML = legendHTML;
}

var updatePostsCounter = function(data)
{
    document.getElementById("totalPosts").innerHTML = '<span>Total</span><br/>' + data;
}

var updateViewsChart = function(data)
{
    var context = document.getElementById("viewsChart").getContext("2d");
    
    if (viewsChart !== undefined)
	viewsChart.destroy();
    
    viewsChart = new Chart(context).Line(data, {});
}

/* HTTP REQUEST */

var getUTCTimestamp = function()
{
    var now = new Date();

    return now.getUTCFullYear() + "-" + (now.getUTCMonth() + 1) + "-" + now.getUTCDate() + " " + now.getUTCHours() + ":" + now.getUTCMinutes() + ":" + now.getUTCSeconds();
}

var createHash = function(data, timestamp)
{    
    var shaObj = new jsSHA("SHA-256", "TEXT", {encoding: "UTF8"});
    
    // set secret key as hash-key
    shaObj.setHMACKey(localStorage.getItem("secretKey"), "TEXT");
        
    var i = 0;

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

    shaObj.update("&timestamp=" + timestamp);

    return shaObj.getHMAC("HEX");
}

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
	
    if (hash != "")
	url += "/" + hash;

    xhttp.open(type, url, true);

    if (timestamp != "")
	xhttp.setRequestHeader('Hash-Timestamp', timestamp); 

    if (type == "POST")
    {
	var formData = new FormData();
	
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
