from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

from Twidder import app

app.debug = True
http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
http_server.serve_forever()

#ef websocket_app(environ, start_response):
#    if environ["PATH_INFO"] == '/echo':
#        ws = environ["wsgi.websocket"]
#        message = ws.receive()
#        ws.send(message)

#server = pywsgi.WSGIServer(("", 8000), websocket_app, handler_class=WebSocketHandler)
#server.serve_forever()
