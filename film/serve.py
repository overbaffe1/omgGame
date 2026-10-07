# Локальный сервер без кэша: всегда отдаёт свежие версии файлов.
# Умеет Range-запросы — иначе 40-МБ MP4 нельзя перематывать в браузере.
import http.server, functools, os
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, must-revalidate')
        super().end_headers()
    def send_head(self):
        rng=self.headers.get('Range')
        if not rng or not rng.startswith('bytes='):
            return super().send_head()
        path=self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f=open(path,'rb')
        except OSError:
            return super().send_head()
        try:
            size=os.fstat(f.fileno()).st_size
            spec=rng[len('bytes='):].split(',')[0].strip()
            a,_,b=spec.partition('-')
            if a=='':
                start=max(0,size-int(b)); end=size-1
            else:
                start=int(a)
                end=min(size-1,int(b)) if b else size-1
            if start>=size or start>end:
                f.close()
                self.send_response(416)
                self.send_header('Content-Range','bytes */%d'%size)
                self.end_headers()
                return None
            self.send_response(206)
            self.send_header('Content-Type',self.guess_type(path))
            self.send_header('Accept-Ranges','bytes')
            self.send_header('Content-Range','bytes %d-%d/%d'%(start,end,size))
            self.send_header('Content-Length',str(end-start+1))
            self.end_headers()
            f.seek(start)
            return _Limited(f,end-start+1)
        except Exception:
            f.close()
            raise

class _Limited:
    """Обёртка над файлом: отдаёт ровно N байт (для 206-ответа)."""
    def __init__(self,f,n): self.f=f; self.n=n
    def read(self,size=-1):
        if self.n<=0: return b''
        if size<0 or size>self.n: size=self.n
        d=self.f.read(size); self.n-=len(d); return d
    def close(self): self.f.close()
d=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # корень репозитория; галерея в /film/
http.server.ThreadingHTTPServer(('0.0.0.0',8080),functools.partial(H,directory=d)).serve_forever()
