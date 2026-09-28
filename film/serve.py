# Локальный сервер без кэша: всегда отдаёт свежие версии файлов.
import http.server, functools, os
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, must-revalidate')
        super().end_headers()
d=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # корень репозитория; галерея в /film/
http.server.ThreadingHTTPServer(('0.0.0.0',8080),functools.partial(H,directory=d)).serve_forever()
