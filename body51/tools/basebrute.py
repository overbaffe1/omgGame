#!/usr/bin/env python3
"""Brute-force the WDTT panel base path on :2860. GET-only, non-404 = hit."""
import sys
import threading
import concurrent.futures as cf
import urllib3
import requests

urllib3.disable_warnings()

IP = "94.156.179.85"
PORT = 2860
BASE = f"https://{IP}:{PORT}"
HDRS = {"Host": "srv4.dream31.ru", "User-Agent": "Mozilla/5.0"}

_local = threading.local()

def session():
    if not hasattr(_local, "s"):
        s = requests.Session()
        s.headers.update(HDRS)
        _local.s = s
    return _local.s

def load_words(paths):
    words = set()
    for p in paths:
        try:
            with open(p, encoding="utf-8", errors="ignore") as f:
                for line in f:
                    w = line.strip().lstrip("/")
                    if 2 <= len(w) <= 40 and all(c.isalnum() or c in "._-" for c in w):
                        words.add(w)
        except OSError:
            pass
    return sorted(words)

def probe(w):
    hits = []
    # mux registers BOTH base ("/w/") and TrimSuffix(base,"/") — one probe is enough
    for path in (f"/{w}",):
        try:
            r = session().get(BASE + path, timeout=8, verify=False, allow_redirects=False)
            if r.status_code != 404:
                hits.append(
                    "HIT %s -> %s size=%s loc=%s body=%r"
                    % (path, r.status_code, len(r.content),
                       r.headers.get("Location", ""), r.text[:400])
                )
        except Exception as e:
            hits.append("ERR %s -> %s" % (path, e))
    return hits

def main():
    words = load_words(sys.argv[1:])
    print("words:", len(words), flush=True)
    n = 0
    hits = 0
    with cf.ThreadPoolExecutor(max_workers=40) as ex:
        for res in ex.map(probe, words):
            n += 1
            for line in res:
                if line.startswith("HIT"):
                    hits += 1
                print(line, flush=True)
            if n % 2000 == 0:
                print("... scanned %d (hits: %d)" % (n, hits), flush=True)
    print("DONE scanned=%d hits=%d" % (n, hits), flush=True)

if __name__ == "__main__":
    main()
