"""Скачивает полные автосубтитры (ru) всех стримов через Invidious API -> body51/txt/NNN_ID.txt.
Запускается в GitHub Actions (.github/workflows/subs.yml), т.к. из песочницы YouTube недоступен."""
import csv, os, re, sys, time, json, urllib.request, urllib.parse
HOSTS = ["https://invidious.f5.si", "https://inv.nadeko.net", "https://yewtu.be"]
try:
    import json as _j, urllib.request as _u
    _l = _j.loads(_u.urlopen(_u.Request("https://api.invidious.io/instances.json?sort_by=health", headers={"User-Agent":"Mozilla/5.0"}), timeout=30).read())
    for name, info in _l:
        if info.get("type") == "https" and info.get("api") is not False:
            u = "https://" + name
            if u not in HOSTS: HOSTS.append(u)
except Exception as e: print("instances list err", e)
print("hosts", HOSTS)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128 Safari/537.36"}
OUT = "body51/txt"; os.makedirs(OUT, exist_ok=True)
def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r: return r.read().decode("utf-8", "replace")
def vtt2txt(v):
    out, last = [], ""
    for line in v.splitlines():
        line = line.strip()
        if not line or "-->" in line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or line.isdigit(): continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if line and line != last: out.append(line); last = line
    # склеить в абзацы по ~20 строк
    return "\n".join(" ".join(out[i:i+20]) for i in range(0, len(out), 20))
rows = [l.rstrip("\n").split("\t") for l in open("body51/raw/all_streams.tsv", encoding="utf-8") if l.strip()]
log = open("body51/txt/_log.txt", "a", encoding="utf-8")
done = fail = 0
import random
for PASS in range(4):
 for n, r in enumerate(rows, 1):
     vid = r[0]; fn = f"{OUT}/{n:03d}_{vid}.txt"
     if os.path.exists(fn) and os.path.getsize(fn) > 200: continue
     ok = False
     for h in HOSTS:
         try:
             caps = json.loads(get(f"{h}/api/v1/captions/{vid}")).get("captions", [])
             c = next((c for c in caps if c["languageCode"].startswith("ru")), caps[0] if caps else None)
             if not c: log.write(f"{n} {vid} {h} nocaps\n"); continue
             txt = vtt2txt(get(h + c["url"]))
             if len(txt) < 50: continue
             with open(fn, "w", encoding="utf-8") as f:
                 f.write(f"# {n:03d} {vid} | {r[1] if len(r)>1 else ''} | {r[2] if len(r)>2 else ''}\n# https://youtu.be/{vid} | {c['label']} | {h}\n\n{txt}\n")
             ok = True; break
         except Exception as e:
             log.write(f"{n} {vid} {h} ERR {e}\n")
     done += ok; fail += not ok
     if ok and done % 15 == 0 and os.environ.get("CI"):
         os.system('git add body51/txt && git commit -qm "subs progress [skip ci]" && (git pull -q --rebase -X theirs origin $GITHUB_REF_NAME; git push -q)')
     log.write(f"{n} {vid} {'OK' if ok else 'FAIL'}\n"); log.flush()
     time.sleep(1)
print("done", done, "fail", fail)
