var App =
{
    httpRequest: null,
    webSocket: null,

    init: function(httpRequest)
    {
	this.httpRequest = httpRequest;
    }
    
    displayView: function(viewId)
    {	
	var alertMessageView = document.getElementById("alertMessageView");
	
	document.getElementsByTagName("body")[0].innerHTML = alertMessageView.innerHTML;
	
	var view = document.getElementById(viewId);
	
	document.getElementsByTagName("body")[0].innerHTML += view.innerHTML;
    },

    displayMessage: function(message, type)
    {
	setTimeout(this.hideMessage, 3000);
	
	var alertMessage = document.getElementById("alertMessage");
	
	alertMessage.className = type;
	
	alertMessage.innerHTML = message;
    },

    displayTab: function(tab)
    {	
	if (this.isUserSignedIn())
	{
	    this.loadSignedIn();
	    
	    this.setSelectedMenuItem(tab + "Button");

	    document.getElementById(tab + "View").classList.add("selectedContent");
	}
	else
	{
	    this.loadSignedOut();
	}
    },

    hideMessage: function()
    {
	var alertMessage = document.getElementById("alertMessage");

	alertMessage.className = "";

	alertMessage.innerHTML = "";
    },

    signOut: function()
    {		
	this.httpRequest.get("sign_out", [localStorage.getItem("userToken")], function(response) {
	    if (response.success)
	    {
		localStorage.removeItem("userToken");
		
		this.webSocket.close();
	    }
	    else
	    {
		this.displayMessage(response.message, "errorMessage");
	    }
	});
    },
}
