#!/usr/bin/env python3
"""Static preview, with MP4 seeking. Root opens the new short, not the gallery.

python3 film/tools/serve_body51_day.py --port 8080
"""
import argparse
import functools
import http.server
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]


class Limited:
    def __init__(self, stream, remaining):
        self.stream, self.remaining = stream, remaining

    def read(self, size=-1):
        if self.remaining <= 0:
            return b""
        size = self.remaining if size < 0 else min(size, self.remaining)
        data = self.stream.read(size)
        self.remaining -= len(data)
        return data

    def close(self):
        self.stream.close()


class Preview(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        route = unquote(urlsplit(self.path).path)
        if route == "/":
            self.send_response(302)
            self.send_header("Location", "/film/body51-min.html")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        if any(p.startswith(".") and p not in (".", "..") for p in route.split("/")):
            self.send_error(404)
            return None
        filename = Path(self.translate_path(self.path)).resolve()
        if not filename.is_relative_to(ROOT):
            self.send_error(404)
            return None
        value = self.headers.get("Range")
        if not value or not filename.is_file():
            return super().send_head()
        size = filename.stat().st_size
        try:
            if not value.startswith("bytes=") or "," in value:
                raise ValueError()
            left, right = value[6:].split("-", 1)
            start = int(left) if left else max(0, size - int(right))
            end = min(size - 1, int(right)) if left and right else size - 1
            if not 0 <= start <= end < size:
                raise ValueError()
        except ValueError:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        stream = filename.open("rb")
        stream.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(filename)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return Limited(stream, end - start + 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    handler = functools.partial(Preview, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print(f"Один день Артёма · 0.0.0.0:{args.port}", flush=True)
    server.serve_forever()
