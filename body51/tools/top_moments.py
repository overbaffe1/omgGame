"""Глобальный топ моментов по всем стримам: окна текста с max плотностью [смех]/мата/коронных фраз.
+ частоты коронных фраз по стримам. -> body51/top_moments.md, body51/phrases.md"""
import re, glob, os, collections
LAUGH=re.compile(r"\[смех\]|\[laughter\]",re.I)
SPICE=re.compile(r"пизд|ху[йеёя]|ёб|еба|бля|\[ __ \]|\[&nbsp;__&nbsp;\]",re.I)
PHR={"пирожочки":r"пирожоч","пу-пу-пу":r"пу-пу","ребятушки":r"ребятушк","разъёб":r"разъ[её]б","приветики":r"приветик",
     "лимиты":r"лимит","выгорел":r"выгор","Катя":r"\bкат[яеюи]\b","издатель":r"издател","вишлисты":r"вишлист","донат":r"донат",
     "Астра":r"астр[аыуе]\b","кодекс":r"кодекс","клод":r"клод","нейронка":r"нейронк","Дима Шалаш":r"шалаш","Айнс":r"айнс|аинс|анс\b",
     "Нетрикс":r"н[еэ]?трикс","Базаров":r"базаров","демка":r"демк","миллион":r"миллион","городок":r"городок","мемалерт":r"мем ?алерт",
     "3D-принтер":r"принтер","Белый Меридиан":r"меридиан","Healthfarmer":r"фармер","Backpack Inspector":r"инспектор|бэкпэк|бкпек"}
moments=[]; cnt=collections.Counter(); per=collections.Counter()
for fn in sorted(glob.glob("body51/txt/[0-9]*.txt")):
    head,_,body=open(fn,encoding="utf-8").read().partition("\n\n")
    title=head.split("|")[2].strip() if head.count("|")>=2 else ""
    num=os.path.basename(fn)[:3]; vid=os.path.basename(fn)[4:15]
    low=body.lower()
    for k,rx in PHR.items():
        c=len(re.findall(rx,low)); cnt[k]+=c; per[k]+= c>0
    w=body.split(); step=60
    for i in range(0,max(1,len(w)-step),step//2):
        seg=" ".join(w[i:i+step]); sc=3*len(LAUGH.findall(seg))+len(SPICE.findall(seg))
        if sc>=5: moments.append((sc,num,vid,title,100*i//max(1,len(w)),seg))
moments.sort(key=lambda x:-x[0])
seen=set(); out=["# Топ-400 моментов по плотности смеха/эмоций (автоотбор, сырьё для мемов)\n"]
for sc,num,vid,title,pct,seg in moments:
    key=(num,pct//3)
    if key in seen: continue
    seen.add(key); out.append(f"\n**#{num}** [{title[:60]}] ~{pct}% · https://youtu.be/{vid} · score {sc}\n> {seg}\n")
    if len(seen)>=400: break
open("body51/top_moments.md","w",encoding="utf-8").write("".join(out))
n=len(glob.glob("body51/txt/[0-9]*.txt"))
open("body51/phrases.md","w",encoding="utf-8").write("# Частоты коронных слов/тем по "+str(n)+" стримам\n\n| тема | упоминаний | в скольких стримах |\n|---|---|---|\n"+"".join(f"| {k} | {cnt[k]} | {per[k]} |\n" for k,_ in cnt.most_common()))
print(len(moments), n)
