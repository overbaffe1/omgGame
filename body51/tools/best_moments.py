"""Проходит ПОЛНЫЙ текст каждого стрима (body51/txt/*.txt) и выбирает самые смешные/яркие куски.
Пишет один файл body51/best_moments.md: по каждому стриму — ссылка youtu.be с таймкодом (~, оценка по
позиции в тексте, т.к. у субтитров downsub нет времени) + цитата + теги.
Запуск: python3 body51/tools/best_moments.py [N_на_стрим]"""
import re, glob, os, sys, math

N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
WIN = 70  # слов в цитате

CATS = {
    "смех": (r"\[смех\]", 4),
    "мат": (r"\[ __ \]|пизд|хуй|хуё|хуя|хер|ёб|еба|ебу|бля|сука|нахер|нахуй|жоп", 1.5),
    "эмоция": (r"капец|жесть|кошмар|ужас|господи|боже|твою мать|офигеть|охренеть|обалдеть|ура\b|ненавижу|гениальн|шикарн|красавчик|молодец|вау|ааа|ооо|опапа|пабам|вуаля|пупупу|пу-пу", 1.5),
    "баг": (r"баг|сломал|поломал|не работает|ошибк|крашн|упал[аио]?\b|вылетел|дичь|херн|фигн", 1),
    "нейронка": (r"нейронк|chatgpt|гпт|gpt|клод|claude|sonnet|сонет|кодекс|codex|астр|копайлот|вайбкод", 1),
    "деньги": (r"донат|заработ|доллар|\$|миллион|продаж|вишлист|издател|стим\b|steam|релиз|демк", 1),
    "чат": (r"привет,? \w+|спасибо (большое|тебе)|чат|ребятушк|ребятки|вопрос", 0.7),
    "жизнь": (r"жена|катя|кате|кот\b|кошк|пиво|болею|сплю|спать|устал|выгор|работ[ау] (на|в)|ребён|сын|доч", 1),
}
RX = {k: re.compile(p, re.I) for k, (p, _) in CATS.items()}
WT = {k: w for k, (_, w) in CATS.items()}


def secs(d):
    if d in ("NA", ""): return None
    p = [int(x) for x in d.split(":")]
    s = 0
    for x in p: s = s * 60 + x
    return s


def hms(s):
    h, m = divmod(int(s) // 60, 60)
    return f"{h}:{m:02d}:{int(s) % 60:02d}" if h else f"{m}:{int(s) % 60:02d}"


rows = [l.rstrip("\n").split("\t") for l in open("body51/raw/all_streams.tsv", encoding="utf-8")]
out = ["# body51 — лучшие моменты всех стримов\n",
       "Сгенерировано `body51/tools/best_moments.py` по ПОЛНЫМ текстам. Таймкод ≈ (оценка по позиции в тексте, ±1–3 мин).",
       "Очки: [смех]×4, мат, эмоции, баги, нейронки, деньги, чат, жизнь. Внутри стрима — по времени.\n"]
allm = []
for fn in sorted(glob.glob("body51/txt/[0-9]*.txt")):
    num = int(os.path.basename(fn)[:3])
    vid, dur, title = rows[num - 1][:3]
    body = open(fn, encoding="utf-8").read().partition("\n\n")[2]
    w = body.split()
    if len(w) < 150: continue
    sc = []
    tags = []
    for i in range(0, len(w), 10):
        t = " ".join(w[i:i + 10])
        s = 0; tg = set()
        for k, r in RX.items():
            c = len(r.findall(t))
            if c: s += c * WT[k]; tg.add(k)
        sc.append(s); tags.append(tg)
    L = WIN // 10
    win = [sum(sc[j:j + L]) for j in range(len(sc))]
    picked = []
    for j in sorted(range(len(win)), key=lambda j: -win[j]):
        if len(picked) >= N or (win[j] < 6 and picked): break
        if any(abs(j - p) < L * 3 for p in picked): continue
        picked.append(j)
    D = secs(dur)
    ms = []
    for j in sorted(picked):
        a = j * 10
        q = " ".join(w[a:a + WIN]).replace("\n", " ")
        tg = set().union(*tags[j:j + L]) - {"чат"} or {"чат"}
        t = int(D * a / len(w)) if D else 0
        link = f"https://youtu.be/{vid}?t={max(0, t - 20)}"
        ms.append((win[j], t, link, q, tg))
        allm.append((win[j], num, title, t, link, q, tg))
    if not ms: continue
    out.append(f"\n## #{num:03d} · {title} · {dur}\n")
    for s, t, link, q, tg in ms:
        out.append(f"- **~{hms(t)}** [{link}]({link}) · _{', '.join(sorted(tg))}_ · очки {s:.0f}\n  > {q}")

allm.sort(key=lambda m: -m[0])
top = ["\n---\n# ТОП-100 по всем стримам (для монтажа — начинать отсюда)\n"]
for s, num, title, t, link, q, tg in allm[:100]:
    top.append(f"- **#{num:03d} ~{hms(t)}** [{link}]({link}) · _{', '.join(sorted(tg))}_ · {s:.0f}\n  > {q}")
open("body51/best_moments.md", "w", encoding="utf-8").write("\n".join(out[:3] + top + ["\n---\n# По каждому стриму"] + out[3:]) + "\n")
print("streams", len({m[1] for m in allm}), "moments", len(allm))
