var HTTPRequest = function()
{
    var xhttp = new XMLHttpRequest();
}

HTTPRequest.prototype.attachCallbackFunction = function(callbackFunction)
{
    this.xhttp.onreadystatechange = function()
    {
	if (this.xhttp.readyState == 4)
	{
	    var response = JSON.parse(xhttp.responseText);
	    
	    callbackFunction(response);
	}
    };
}

HTTPRequest.prototype.getUTCTimestamp = function()
{
    var now = new Date();

    return now.getUTCFullYear() + "-" + (now.getUTCMonth() + 1) + "-" + now.getUTCDate() + " " + now.getUTCHours() + ":" + now.getUTCMinutes() + ":" + now.getUTCSeconds();
}

HTTPRequest.prototype.createHash = function(data, timestamp)
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

HTTPRequest.prototype.buildURL = function(route, parameters)
{
    var url = "http://127.0.0.1:5000/" + route;
	
    for (var key in parameters)
    {
	if (parameters.hasProperty(key))
	    url += "/" + parameters[key];
    }

    return url;
}

HTTPRequest.prototype.get = function(route, parameters, callbackFunction)
{
    this.attachCallbackFunction(callbackFunction);

    var url = this.buildUrl(route, parameters);
    
    xhttp.open(type, url, true);
    
    var timestamp = this.getUTCTimestamp();

    var hash = this.createHash(parameters, timestamp);

    xhttp.setRequestHeader('Hash-Hmac', hash);

    xhttp.setRequestHeader('Hash-Timestamp', timestamp); 
	
    xhttp.send();
}
