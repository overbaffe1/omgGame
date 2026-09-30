"""Из полного текста стрима (body51/txt/*.txt) вытаскивает кандидаты в мемы:
куски вокруг [смех], мата, коронных фраз. Пишет body51/hl/<файл>.md (≈5-8% объёма)."""
import re, os, sys, glob
KEY = r"смех|пирожоч|пу-пу|ребятушк|разъёб|пизд|хуй|хуё|хуя|ёб|еба|бля|\[ __ \]|господи|дичь|сдох|выгор|катя|кате|лимит|донат|миллион|заработ|издател|демк|релиз|вишлист|нейронк|астр|кодекс|клод"
W = re.compile(KEY, re.I)
os.makedirs("body51/hl", exist_ok=True)
for fn in sorted(glob.glob("body51/txt/[0-9]*.txt")):
    head, _, body = open(fn, encoding="utf-8").read().partition("\n\n")
    sents = re.split(r"(?<=[.!?…])\s+", body.replace("\n", " "))
    if len(sents) < len(body)/300:
        w = body.split(); sents = [" ".join(w[i:i+25]) for i in range(0, len(w), 25)]
    score = [len(W.findall(s)) + 3*s.count("[смех]") for s in sents]
    picked = set()
    for i, sc in enumerate(score):
        win = sum(score[max(0,i-1):i+2])
        if win >= 4: picked.update(range(max(0,i-2), min(len(sents), i+3)))
    out, prev = [], -5
    for i in sorted(picked):
        if i != prev+1: out.append(f"\n— [~{100*i//max(1,len(sents))}% стрима]")
        out.append(sents[i]); prev = i
    open("body51/hl/"+os.path.basename(fn)[:-4]+".md","w",encoding="utf-8").write(head+"\n"+" ".join(out)+"\n")
    print(fn, len(body), "->", len(" ".join(out)))
