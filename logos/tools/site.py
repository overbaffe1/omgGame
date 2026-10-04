#!/usr/bin/env python3
"""
site.py — собирает страницу-галерею logos/index.html и контактный лист.

Запуск из logos/tools:  python3 site.py
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import concepts as C  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))          # logos/
PNG = os.path.join(ROOT, "png")
PREVIEW = os.path.join(ROOT, "preview")
REF = os.path.join(ROOT, "ref")
BUILD = os.path.join(ROOT, "build")

REFS = [
    ("ref-1-horizont.jpg", "№1 — горизонт",
     "«Синхрон» идёт в горизонт, а под Я — птица/плёночный клубок. Сама идея "
     "линии хорошая, но она уводит вправо от кадра, и всё это — на белом фоне, "
     "а кадр кино — тёмный. Птица читается как случайное пятно."),
    ("ref-2-bw-pride.jpg", "№2 — ч/б с диафрагмой",
     "Диафрагма-«прайд» крупнее слова и стоит на тексте, буквы «едут» по ней: "
     "знак дерётся со названием. Плюс два цвета инвертированы по-разному "
     "в одном наборе — в ленте это выглядит как два разных логотипа."),
    ("ref-3-bw-reverse.jpg", "№3 — то же в реверсе",
     "Это инверсия №2, то есть тот же файл наоборот. Как приём для "
     "«тёмной темы» — да, как отдельная идея — нет: на чёрном теряется "
     "градиентная фактура букв."),
    ("ref-4-silhouettes.jpg", "№4 — силуэты",
     "Проектор и человек в кресле. Атмосфера есть, но в мелком размере это "
     "белое пятно: кресло не читается, а слово уползает вверх."),
]


def previews():
    os.makedirs(PREVIEW, exist_ok=True)
    for c in C.CONCEPTS:
        name = f'{c["num"]}-{c["slug"]}'
        src = os.path.join(PNG, name + ".png")
        dst = os.path.join(PREVIEW, name + ".jpg")
        if os.path.exists(src):
            subprocess.run(["convert", src, "-resize", "900x900", "-quality", "88", dst],
                           check=True)


def sheet():
    os.makedirs(BUILD, exist_ok=True)
    files = sorted(f for f in os.listdir(PREVIEW) if f.endswith(".jpg"))
    subprocess.run(["montage", "-font", "DejaVu-Sans-Bold", "-label", "%f"]
                   + [os.path.join(PREVIEW, f) for f in files]
                   + ["-tile", "5x2", "-geometry", "330x330+5+5",
                      "-background", "#1b1b1b", "-fill", "#e8e2d6",
                      "-pointsize", "15", os.path.join(BUILD, "sheet.jpg")], check=True)
    subprocess.run(["convert", os.path.join(BUILD, "sheet.jpg"), "-resize", "1600x",
                    "-quality", "88", os.path.join(ROOT, "SHEET.jpg")], check=True)


def html():
    def card(c):
        name = f'{c["num"]}-{c["slug"]}'
        return f"""
      <article class="card" id="c{c['num']}">
        <a class="pic" href="png/{name}.png" target="_blank">
          <img src="preview/{name}.jpg" alt="{c['title']}" loading="lazy">
        </a>
        <div class="meta">
          <span class="num">{c['num']}</span>
          <h3>{c['title']}</h3>
          <p class="tag">{c['tag']}</p>
          <p class="idea">{c['idea']}</p>
          <details>
            <summary>Почему работает</summary>
            <p>{c['why']}</p>
          </details>
          <details>
            <summary>Как снять руками</summary>
            <p>{c['real']}</p>
          </details>
          <p class="files">
            <a href="svg/{name}.svg" target="_blank">svg</a> ·
            <a href="png/{name}.png" target="_blank">png 2160×2160</a> ·
            <a href="preview/{name}.jpg" target="_blank">jpg 900</a> ·
            <a href="png/avatar/av-{name}.png" target="_blank">аватар 420 в круге</a>
          </p>
        </div>
      </article>"""

    avatars = "\n".join(
        f'''    <figure class="ref" style="padding:8px">
      <img src="png/avatar/av-{c['num']}-{c['slug']}.png" alt="{c['title']}"
           style="background:transparent" loading="lazy">
      <figcaption style="font-size:12px;text-align:center">{c['num']} {c['title']}</figcaption>
    </figure>''' for c in C.CONCEPTS)

    refs = "\n".join(
        f"""      <figure class="ref">
        <img src="ref/{f}" alt="{t}" loading="lazy">
        <figcaption><b>{t}</b>{d}</figcaption>
      </figure>""" for f, t, d in REFS)

    doc = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>СИНХРОН — 10 идей логотипа</title>
<style>
  :root {{ --ink:#08080B; --char:#121218; --ivory:#F2EAD9; --amber:#F0B24A; }}
  * {{ box-sizing:border-box }}
  body {{ margin:0; background:var(--ink); color:var(--ivory);
         font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }}
  a {{ color:var(--amber) }}
  header {{ padding:64px 24px 32px; max-width:1180px; margin:0 auto }}
  .kicker {{ letter-spacing:.42em; font-size:12px; opacity:.6; margin:0 0 18px }}
  h1 {{ font:700 clamp(30px,6vw,64px)/1.02 Georgia,serif; margin:0 0 18px;
        letter-spacing:-.01em }}
  h1 em {{ font-style:normal; color:var(--amber) }}
  .lead {{ max-width:760px; opacity:.78; font-size:17px }}
  .why-x {{ margin:34px 0 0; padding:20px 22px; border-left:3px solid var(--amber);
            background:#ffffff08; max-width:860px; font-size:15.5px; opacity:.9 }}
  main {{ max-width:1180px; margin:0 auto; padding:18px 24px 90px;
          display:grid; gap:26px; grid-template-columns:repeat(auto-fit,minmax(430px,1fr)) }}
  @media (max-width:520px) {{ main {{ grid-template-columns:1fr; padding:12px 14px 60px }} }}
  .card {{ background:var(--char); border:1px solid #ffffff12; border-radius:16px;
           overflow:hidden; display:flex; flex-direction:column }}
  .pic {{ display:block; background:#000 }}
  .pic img {{ display:block; width:100%; height:auto }}
  .meta {{ padding:18px 20px 22px }}
  .num {{ font:700 13px/1 ui-monospace,monospace; color:var(--amber); letter-spacing:.2em }}
  h3 {{ font:700 26px/1.1 Georgia,serif; margin:10px 0 4px; letter-spacing:.02em }}
  .tag {{ margin:0 0 12px; font-size:12.5px; letter-spacing:.14em; text-transform:uppercase;
          opacity:.5 }}
  .idea {{ margin:0 0 14px; font-size:15.5px; opacity:.9 }}
  details {{ border-top:1px solid #ffffff12; padding:10px 0 0 }}
  summary {{ cursor:pointer; font-size:13.5px; letter-spacing:.06em; color:var(--amber);
             opacity:.9 }}
  details p {{ margin:10px 0 0; font-size:14.5px; opacity:.85 }}
  .files {{ margin:16px 0 0; font-size:12.5px; opacity:.7 }}
  .refs {{ max-width:1180px; margin:0 auto; padding:8px 24px 40px }}
  .refs h2 {{ font:700 26px/1.2 Georgia,serif; margin:26px 0 6px }}
  .refs .sub {{ opacity:.6; font-size:14.5px; max-width:760px; margin:0 0 22px }}
  .refgrid {{ display:grid; gap:20px; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)) }}
  .ref {{ margin:0; background:#0F0F14; border:1px solid #ffffff10; border-radius:14px;
          padding:12px }}
  .ref img {{ width:100%; height:auto; border-radius:8px; background:#000; display:block }}
  .ref figcaption {{ font-size:13.5px; opacity:.8; margin-top:10px }}
  .ref figcaption b {{ display:block; color:var(--ivory); opacity:.95; margin-bottom:4px;
                       font-size:14px }}
  footer {{ max-width:1180px; margin:0 auto; padding:0 24px 80px; opacity:.6; font-size:13.5px }}
  pre {{ background:#ffffff08; padding:12px 14px; border-radius:10px; overflow:auto;
         font-size:13px }}
</style>
</head>
<body>
<header>
  <p class="kicker">КИНО-КЛУБ «СИНХРОН» · ПСКОВ</p>
  <h1>Десять идей логотипа<br><em>вместо буквы в букве</em></h1>
  <p class="lead">Прошлый набор держался на слове в рукописной гарнитуре и знаке
  сверху. Мне кажется, у клуба есть кое-что сильнее букв — <b>X</b>: он уже в
  названии, он же плёнка, скрещенная на склейке, он же перекрестье на лидере,
  он же два скрещённых луча в зале. Ниже десять картинок, где X становится
  знаком, а не буквой, — и объяснение, почему каждая работает.</p>
  <div class="why-x"><b>Почему именно X.</b> В слове «СИНХРОН» X стоит ровно в
  середине — это ось слова, точка, где встречаются «СИНХ» и «РОН». Оптический
  звук, склейка, перекрестье кадра, два луча проекторов — всё это крест.
  Логотип, который строится на нём, растёт прямо из названия: он не «добавлен»
  к слову, он — его центр.</div>
</header>

<main>
{''.join(card(c) for c in C.CONCEPTS)}
</main>

<section class="refs">
  <h2>Как это смотрится в круге аватара</h2>
  <p class="sub">Аватар ВК обрезается кругом, поэтому каждая картинка
  отдельно проверена в круглом кропе (420×420, прозрачный фон) —
  <a href="png/avatar/">logos/png/avatar/</a>.</p>
  <div class="refgrid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
{avatars}
  </div>
</section>

<section class="refs">
  <h2>Что было у «супер-пупер дизайнера»</h2>
  <p class="sub">Это не приговор — просто фиксация, от чего мы отталкиваемся.
  Все четыре варианта — одно и то же слово в одной и той же рукописной
  гарнитуре; меняется только знак и цвет.</p>
  <div class="refgrid">
{refs}
  </div>
  <p class="sub" style="margin-top:22px">Общая беда всех четырёх: рукописные
  буквы живут отдельно от знака, поэтому в мелком размере (аватар группы — это
  200 px по кругу) они распадаются в пятно, а знак уезжает вверх или в центр
  слова. Плюс смешение светлой и тёмной версии как двух «разных» логотипов.</p>
</section>

<footer>
  <p>Всё в этой папке нарисовано кодом: <code>logos/tools/</code> —
  <code>kit.py</code> (движок), <code>wordmark.py</code> (геометрический
  шрифт слова «СИНХРОН»), <code>concepts.py</code> (десять идей),
  <code>build.py</code> (рендер), <code>site.py</code> (эта страница).</p>
  <pre>cd logos/tools && python3 build.py && python3 site.py</pre>
  <p>Контактный лист: <a href="SHEET.jpg">SHEET.jpg</a> ·
  вектор: <a href="svg/">logos/svg/*.svg</a> ·
  полный размер: <a href="png/">logos/png/*.png</a> (2160×2160).</p>
</footer>
</body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w").write(doc)


if __name__ == "__main__":
    previews()
    sheet()
    html()
    print("готово: logos/index.html, logos/SHEET.jpg, logos/preview/*.jpg")
