from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

from Twidder import app

app.debug = True
http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
http_server.serve_forever()
