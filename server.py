import os

from tornado.web import RequestHandler, FallbackHandler, Application, HTTPError
from tornado.httpserver import HTTPServer
from tornado.wsgi import WSGIContainer, WSGIApplication
from tornado.ioloop import IOLoop

from settings import STATIC_PATH, PORT, IS_DEBUG
from app import app


class HttpHandler(RequestHandler):
    def prepare(self):
        if self.request.protocol == "http":
            self.redirect(self.request.full_url().replace(r'http://', r'https://'), permanent=True)

    def get(self):
        raise HTTPError(404, 'Http is not supported, only https')


http_application = Application([
    (r'.*', HttpHandler),
])

tr = WSGIContainer(app)

settings = {
    "static_path": STATIC_PATH,
    "debug": IS_DEBUG
}

https_application = WSGIApplication([(r".*", FallbackHandler, dict(fallback=tr)), ], **settings)


if __name__ == "__main__":
    ssl_settings = dict(ssl_options={"certfile": os.path.join("client/ssl/server.crt"),
                                     "keyfile": os.path.join("client/ssl/server.key")})
    https_server = HTTPServer(https_application, **ssl_settings)
    https_server.listen(PORT)

    http_server = HTTPServer(http_application)
    http_server.listen(80)

    print 'Listening on port %d' % PORT
    IOLoop.instance().start()
