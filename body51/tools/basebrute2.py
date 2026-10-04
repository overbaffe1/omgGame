#!/usr/bin/env python3
"""Base-path brute v9: curated vocab (1 seg) + all ordered pairs (2 seg). GET-only."""
import sys
import itertools
import threading
import concurrent.futures as cf
import urllib3
import requests

urllib3.disable_warnings()

IP = "94.156.179.85"
BASE = f"https://{IP}:2860"
HDRS = {"Host": "srv4.dream31.ru", "User-Agent": "Mozilla/5.0"}

_local = threading.local()

def session():
    if not hasattr(_local, "s"):
        s = requests.Session()
        s.headers.update(HDRS)
        _local.s = s
    return _local.s

def load(path):
    out = set()
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                w = line.strip().strip("/")
                if 1 <= len(w) <= 40 and all(c.isalnum() or c in "._-" for c in w):
                    out.add(w)
    except OSError:
        pass
    return out

def probe(path):
    try:
        r = session().get(BASE + path, timeout=8, verify=False, allow_redirects=False)
        if r.status_code != 404:
            return "HIT %s -> %s size=%s loc=%s body=%r" % (
                path, r.status_code, len(r.content),
                r.headers.get("Location", ""), r.text[:500])
    except Exception as e:
        return "ERR %s -> %s" % (path, e)
    return None

def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    want_pairs = "--no-pairs" not in sys.argv
    words = set()
    for p in argv:
        words |= load(p)
    words = sorted(words)
    paths = ["/" + w for w in words]
    # two-segment combos (ordered, distinct)
    if want_pairs:
        for a, b in itertools.permutations(words, 2):
            paths.append(f"/{a}/{b}")
    print("words: %d, total probes: %d" % (len(words), len(paths)), flush=True)
    n = hits = 0
    with cf.ThreadPoolExecutor(max_workers=40) as ex:
        for res in ex.map(probe, paths, chunksize=32):
            n += 1
            if res:
                if res.startswith("HIT"):
                    hits += 1
                print(res, flush=True)
            if n % 5000 == 0:
                print("... scanned %d (hits: %d)" % (n, hits), flush=True)
    print("DONE scanned=%d hits=%d" % (n, hits), flush=True)

if __name__ == "__main__":
    main()
