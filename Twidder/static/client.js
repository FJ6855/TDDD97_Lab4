var webSocket;

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

var makeHttpRequest = function(type, url, formData, callbackFunction)
{
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function()
    {
	if (xhttp.readyState == 4)
	{
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

    xhttp.open(type, "http://127.0.0.1:5000/" + url, true);

    if (type == "POST")
    {
	xhttp.send(formData);
    }
    else
    {
	xhttp.send();
    }
}

var signOut = function()
{
    makeHttpRequest("GET", "sign_out/" + localStorage.getItem("userToken"), "", function(response) {
	localStorage.removeItem("userToken");
	
	loadSignedOut();
    });
}

var loginSubmit = function()
{
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");

    var formData = new FormData();

    formData.append("loginEmail", loginEmail.value);
    formData.append("loginPassword", loginPassword.value);

    makeHttpRequest("POST", "sign_in", formData, function(response) {
	localStorage.setItem("userToken", response.data);
	
	loadSignedIn();
    }); 
		
    return false;
}

var signupSubmit = function()
{
    var signupPassword = document.getElementById("signupPassword");
    var repeatPassword = document.getElementById("repeatPassword");
    
    if (validPasswordLength(signupPassword.value) && validPasswordMatch(signupPassword.value, repeatPassword.value))
    {
	var formData = new FormData();

	formData.append("signupEmail", document.getElementById("signupEmail").value);
	formData.append("signupPassword", signupPassword.value);
	formData.append("firstName", document.getElementById("firstName").value);
	formData.append("lastName", document.getElementById("lastName").value);
	formData.append("gender", document.getElementById("gender").value);
	formData.append("city", document.getElementById("city").value);
	formData.append("country", document.getElementById("country").value);

	makeHttpRequest("POST", "sign_up", formData, function(response) {
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("signupForm").reset();
	}); 
    }

    return false;
}

var changePasswordSubmit = function()
{
    var oldPassword = document.getElementById("oldPassword");
    var newPassword = document.getElementById("newPassword");
    var repeatNewPassword = document.getElementById("repeatNewPassword");

    if (validPasswordLength(newPassword.value) && validPasswordMatch(newPassword.value, repeatNewPassword.value))
    {
	var formData = new FormData();

	formData.append("oldPassword", oldPassword.value);
	formData.append("newPassword", newPassword.value);

	makeHttpRequest("POST", "change_password/" + localStorage.getItem("userToken"), formData, function(response) {
	    displayMessage(response.message, "infoMessage");
	    
	    document.getElementById("changePasswordForm").reset();
	}); 
    }
	    
    return false;
}

var homePostMessageSubmit = function()
{
    var message = document.getElementById("homeMessage");
    var file = document.getElementById("homeFile");

    getEmail(function(email) {
	postMessage(message.value, email, file, function() {	    
	    document.getElementById("homePostMessageForm").reset();
	});

	loadMessages(email, "homeMessages")
    });

    return false;
}

var browsePostMessageSubmit = function()
{
    var message = document.getElementById("browseMessage");
    var file = document.getElementById("homeFile");
    
    postMessage(message.value, localStorage.getItem("currentBrowseEmail"), file, function() {	    
	document.getElementById("browsePostMessageForm").reset();
    });

    loadMessages(localStorage.getItem("currentBrowseEmail"), "browseMessages");

    return false;
}

var postMessage = function(message, email, file, callbackFunction)
{	
    var formData = new FormData();

    formData.append("message", message);

    var dataString = "message=" + message;
    
    if (file == undefined || (file != undefined && file.files[0] == undefined))
    {	
	makeHttpRequest("POST", "post_message/" + localStorage.getItem("userToken") + "/" + email, formData, function(response) {
	    displayMessage(response.message, "infoMessage");

	    callbackFunction();
	});
    }
    else
    {
	if (file != undefined && file.files[0] != undefined && validFileSize(file.files[0].size))
	{
	    dataString += "&file=" + file.files[0];
	    formData.append("file", file.files[0]);
	    
	    makeHttpRequest("POST", "post_message/" + localStorage.getItem("userToken") + "/" + email, formData, function(response) {
		displayMessage(response.message, "infoMessage");

		callbackFunction();
	    });
	}
	else
	{
	    displayMessage("File size is too big. Max size allowed: 4Mb.", "errorMessage");
	}
    }    
}   

var validFileSize = function(fileSize)
{
    return (fileSize / 1000000 < 4); 
}

var searchProfileSubmit = function()
{
    var profileEmail = document.getElementById("profileEmail");
    
    loadProfileInformation(profileEmail.value, function(profileInformation) {
	appendSearchProfileInformation(profileInformation);

	loadMessages(profileEmail.value, "browseMessages");

	localStorage.setItem("currentBrowseEmail", profileEmail.value);

	showBrowseElements();
    });

    return false;
}

var showBrowseElements = function()
{
    var browseElements = document.getElementsByClassName("hideBrowseElement");

    for (var i = browseElements.length - 1; i >= 0; --i)
    {
	browseElements[i].classList.remove("hideBrowseElement");
    }
}

var validPasswordLength = function(password)
{
    return (password.length >= 6);
}

var validPasswordMatch = function(repeatPassword, password)
{
    return (password == repeatPassword);
}

var menuItemClick = function(menuItem)
{
    var selectedMenuItem = document.getElementsByClassName("selected");

    selectedMenuItem[0].classList.remove("selected");

    menuItem.classList.add("selected");

    var selectedContent = document.getElementsByClassName("selectedContent");

    selectedContent[0].classList.remove("selectedContent");

    var view;

    if (menuItem.getAttribute("id") == "homeButton")
    {
	view = document.getElementById("homeView");
    }
    else if (menuItem.getAttribute("id") == "browseButton")
    {
	view = document.getElementById("browseView");	    
    }
    else if (menuItem.getAttribute("id") == "accountButton")
    {
	view = document.getElementById("accountView"); 
    }
    
    view.classList.add("selectedContent");
}

var loadProfileInformation = function(email, callbackFunction)
{
    makeHttpRequest("GET", "get_user_data/" + localStorage.getItem("userToken") + "/" + email, "", function(response) {
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

var appendProfileInformation = function(profileInformation)
{    
    document.getElementById("profileInfoName").innerHTML = "<span>Name:</span> " + profileInformation.name;
    document.getElementById("profileInfoEmail").innerHTML = "<span>Email:</span> " + profileInformation.email;
    document.getElementById("profileInfoGender").innerHTML = "<span>Gender:</span> " + profileInformation.gender;
    document.getElementById("profileInfoCity").innerHTML = "<span>City:</span> " + profileInformation.city;
    document.getElementById("profileInfoCountry").innerHTML = "<span>Country:</span> " + profileInformation.country;
}

var appendSearchProfileInformation = function(profileInformation)
{    
    document.getElementById("browseProfileInfoName").innerHTML = "<span>Name:</span> " + profileInformation.name;
    document.getElementById("browseProfileInfoEmail").innerHTML = "<span>Email:</span> " + profileInformation.email;
    document.getElementById("browseProfileInfoGender").innerHTML = "<span>Gender:</span> " + profileInformation.gender;
    document.getElementById("browseProfileInfoCity").innerHTML = "<span>City:</span> " + profileInformation.city;
    document.getElementById("browseProfileInfoCountry").innerHTML = "<span>Country:</span> " + profileInformation.country;
}

var loadMessages = function(email, elementId)
{
    makeHttpRequest("GET", "get_user_messages/" + localStorage.getItem("userToken") + "/" + email, "", function(response) {
	document.getElementById(elementId).innerHTML = "";
	
	for (var i = 0; i < response.data.length; ++i)
	{
	    var message = response.data[i];

	    createMessage(message, elementId)
	}
    });
}

var createMessage = function(message, elementId)
{
    var container = document.createElement("DIV");

    container.classList.add("messageContainer");
    container.setAttribute("draggable", "true");

    container.ondragstart = function(event)
    {
	event.dataTransfer.setData("writer", event.target.getElementsByTagName("H2")[0].innerHTML);
	event.dataTransfer.setData("message", event.target.getElementsByTagName("P")[0].innerHTML);
    };

    var header = document.createElement("H2");

    var writerTextNode = document.createTextNode(message.writer + " : " + message.datePosted);
    
    header.appendChild(writerTextNode);

    container.appendChild(header);

    var messageNode = document.createElement("P");

    var messageTextNode = document.createTextNode(message.message);

    messageNode.appendChild(messageTextNode);

    container.appendChild(messageNode);

    if (message.hasOwnProperty('fileName'))
    {
	var fileTag;

	if (message.fileType == 'image')
	{
	    fileTag = document.createElement('IMG');
	}
	else if (message.fileType == 'video')
	{
	    fileTag = document.createElement('VIDEO');
	    fileTag.setAttribute("controls", "");
	}
	else if (message.fileType == 'audio')
	{	    
	    fileTag = document.createElement('AUDIO');
	    fileTag.setAttribute("controls", "");
	}

	var src = 'uploads/' + message.fileName;
	
	fileTag.setAttribute("src", src);

	container.appendChild(fileTag);
    }

    document.getElementById(elementId).appendChild(container);
}

var getEmail = function(callbackFunction)
{
    makeHttpRequest("GET", "get_user_data/" + localStorage.getItem("userToken"), "", function(response) {
	callbackFunction(response.data.email);
    });
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

var setupLoginForm = function()
{    
    document.getElementById("loginForm").onsubmit = loginSubmit;
    
    clearCustomValidityOnInput(document.getElementById("loginEmail"));
}

var setupSignUpForm = function()
{   
    document.getElementById("signupForm").onsubmit = signupSubmit;

    validatePasswordLengthOnInput(document.getElementById("signupPassword"));

    validatePasswordMatchOnInput(document.getElementById("signupPassword"), document.getElementById("repeatPassword"));
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
    document.getElementById("changePasswordForm").onsubmit = changePasswordSubmit;

    validatePasswordLengthOnInput(document.getElementById("newPassword"));
	
    validatePasswordMatchOnInput(document.getElementById("newPassword"), document.getElementById("repeatNewPassword"));
}

var loadProfile = function(email, wallId)
{    
    loadProfileInformation(email, function(profileInformation) {
	appendProfileInformation(profileInformation);
    });

    loadMessages(email, wallId);
}

var setupRefreshButton = function(element, email, wallId)
{
    element.onclick = function()
    {	
	loadMessages(email, wallId);
    }
}

var loadSignedOut = function()
{    
    displayView("welcomeView");

    setupLoginForm();

    setupSignUpForm();
}

var addMessageOnDrop = function(element)
{    
    element.ondrop = function(event)
    {
	event.preventDefault();

	var writer = event.dataTransfer.getData("writer");
	var message = event.dataTransfer.getData("message");

	if(writer != "" && message != "")
	    event.target.value += 'Reply to: ' + writer + '\n' + message;
    };

    element.ondragover = function(event)
    {
	event.preventDefault();
    };
}

var loadSignedIn = function()
{
    displayView("profileView");

    getEmail(function(email) {
	setupRefreshButton(document.getElementById("homeRefreshButton"), email, "homeMessages");
	
	loadProfile(email, "homeMessages");
    });

    setupMenuItems();

    setupChangePasswordForm();

    document.getElementById("homePostMessageForm").onsubmit = homePostMessageSubmit;
    
    addMessageOnDrop(document.getElementById("homeMessage"));
    addMessageOnDrop(document.getElementById("browseMessage"));

    setupRefreshButton(document.getElementById("browseRefreshButton"), localStorage.getItem("currentBrowseEmail"), "browseMessages");

    document.getElementById("searchProfileForm").onsubmit = searchProfileSubmit;

    document.getElementById("browsePostMessageForm").onsubmit = browsePostMessageSubmit;

    document.getElementById("signOut").onclick = signOut;
    
    webSocket = new WebSocket("ws://127.0.0.1:5000/api");
    
    webSocket.onopen = function()
    {
	getEmail(function(email) {
	    webSocket.send(email);
	});
    };
    
    webSocket.onmessage = function(message)
    {
	makeHttpRequest("GET", "sign_out/" + localStorage.getItem("userToken"), "", function(response) {
	    localStorage.removeItem("userToken");
	    
	    loadSignedOut();
	    
	    webSocket.close();
	});
    };
}

window.onload = function()
{
    if (localStorage.getItem("userToken") === null)
    {	
	loadSignedOut();
    }
    else
    {
	loadSignedIn();
    }
}
