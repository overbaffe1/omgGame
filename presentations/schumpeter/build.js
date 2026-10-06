// Build: node build.js  ->  ../../exports/schumpeter-3d-presentation.pptx
//        node build.js --preview  -> also renders preview/slide-XX.png
const path = require("path");
const fs = require("fs");
const { Slide, toPptx, toHtml } = require("./lib");

const A = (f) => path.join(__dirname, "assets", f);
const GOLD = "E3B663", GOLD2 = "F3DDAE", WHITE = "F4F1EA", MUTED = "A9B3C6", CYAN = "62D4F0",
  CARD = "0E1930", DARK = "070C18";
const L = 0.75, R = 12.583, CW = R - L; // content bounds
const slides = [];
let N = 15;

// ---------- helpers ----------
function chrome(s, idx, kicker, opts = {}) {
  s.img(A(`bg-${opts.bg}.jpg`), { x: 0, y: 0, w: 13.333, h: 7.5, name: "Background" });
  if (kicker) {
    s.rect({ x: L, y: 0.66, w: 0.34, h: 0.035, fill: GOLD, name: "!!kickerbar" });
    s.text([{ text: kicker }], { x: L + 0.48, y: 0.53, w: 9, h: 0.3, size: 11, bold: true, color: GOLD, charSpacing: 3, name: "!!kicker" });
  }
  s.line({ x1: L, y1: 7.0, x2: R, y2: 7.0, color: "FFFFFF", lineT: 84, width: 0.75, name: "!!footline" });
  s.rect({ x: L, y: 6.985, w: (CW * idx) / N, h: 0.03, fill: GOLD, name: "!!progress" });
  s.text("ЙОЗЕФ ШУМПЕТЕР  ·  1883–1950", { x: L, y: 7.1, w: 5, h: 0.25, size: 9, color: MUTED, charSpacing: 2, name: "!!footer" });
  s.text(`${String(idx).padStart(2, "0")} / ${N}`, { x: R - 1.5, y: 7.1, w: 1.5, h: 0.25, size: 9, color: MUTED, align: "right", charSpacing: 2, name: "!!pagenum" });
}
const title = (s, t, o = {}) =>
  s.text(t, { x: L, y: o.y ?? 0.98, w: o.w ?? 6.6, h: o.h ?? 1.4, font: "head", size: o.size ?? 38, color: WHITE, lineSpacingMultiple: 0.95, name: "!!title", valign: "top" });
const label = (s, t, x, y, w, color = GOLD) =>
  s.text(t, { x, y, w, h: 0.25, size: 9.5, bold: true, color, charSpacing: 2 });
const card = (s, x, y, w, h, o = {}) =>
  s.rect({ x, y, w, h, fill: o.fill || CARD, fillT: o.fillT ?? 22, line: o.line || GOLD, lineT: o.lineT ?? 72, lineW: 0.75, radius: o.radius ?? 0.08, shadow: o.shadow });
const br = (text, o = {}) => ({ text, options: { ...o, breakLine: true } });
const run = (text, o = {}) => ({ text, options: o });

// =====================================================================
// 1. TITLE
{
  const s = new Slide({ notes:
`Сегодня я расскажу о Йозефе Шумпетере — австрийско-американском экономисте, которого часто называют «пророком инноваций». Именно он поставил предпринимателя в центр экономической теории и придумал понятие «созидательное разрушение».
План: где он родился и вырос, чем занимался, в чём его главная мысль и что он дал теории предпринимательства.` });
  chrome(s, 1, "ЭКОНОМИКА  ·  ИННОВАЦИИ  ·  ПРЕДПРИНИМАТЕЛЬСТВО", { bg: "hero" });
  s.text([br("Йозеф", { color: GOLD2, size: 54 }), run("Шумпетер", { size: 76 })],
    { x: L, y: 1.25, w: 7, h: 2.55, font: "head", color: WHITE, lineSpacingMultiple: 0.92, name: "!!title" });
  s.rect({ x: L, y: 3.98, w: 1.1, h: 0.04, fill: GOLD });
  s.text("Экономист, который поставил предпринимателя в центр экономической теории",
    { x: L, y: 4.18, w: 6.3, h: 1.1, font: "head", italic: true, size: 20, color: WHITE, lineSpacingMultiple: 1.05 });
  s.text("1883 — 1950   ·   АВСТРО-ВЕНГРИЯ → США", { x: L, y: 5.5, w: 6, h: 0.3, size: 12, color: MUTED, charSpacing: 2.5, bold: true });
  const pills = [["Родился в Моравии", 2.05], ["Министр · банкир · профессор", 2.95], ["«Созидательное разрушение»", 2.85]];
  let px = L;
  pills.forEach(([t, w]) => {
    s.rect({ x: px, y: 6.05, w, h: 0.46, fill: CARD, fillT: 30, line: GOLD, lineT: 55, radius: 0.23 });
    s.text(t, { x: px, y: 6.05, w, h: 0.46, size: 11.5, color: GOLD2, align: "center", valign: "middle" });
    px += w + 0.14;
  });
  slides.push(s);
}

// 2. BIRTH
{
  const s = new Slide({ notes:
`Йозеф Алоиз Шумпетер родился 8 февраля 1883 года в городке Тршешть — по-немецки Triesch — в Моравии. Тогда это была Австро-Венгрия, сегодня — Чехия. Интересное совпадение: в 1883 году умер Карл Маркс и родился Джон Мейнард Кейнс — два других великих экономиста, с которыми Шумпетера постоянно сравнивают.
Он был единственным сыном владельца суконной фабрики. Отец умер, когда Йозефу было четыре года. Мать переехала с ним в Грац, а в 1893 году вышла замуж за высокопоставленного генерала, и семья перебралась в Вену. Это открыло мальчику дорогу в элитное образование.` });
  chrome(s, 2, "01 — ГДЕ РОДИЛСЯ", { bg: "birth" });
  title(s, "Родился в маленьком городке Моравии");
  const facts = [
    ["ДАТА РОЖДЕНИЯ", "8 февраля 1883", "год смерти Маркса и рождения Кейнса"],
    ["МЕСТО", "Тршешть (Triesch)", "Моравия, ≈120 км от Праги"],
    ["СТРАНА", "Австро-Венгрия", "сегодня — Чехия"],
    ["СЕМЬЯ", "Сын фабриканта", "отец владел суконной фабрикой"],
    ["ДЕТСТВО", "Отец умер в 1887", "Йозефу было всего 4 года"],
    ["ПЕРЕЕЗД", "Грац → Вена (1893)", "мать вышла замуж за генерала"],
  ];
  facts.forEach(([l, v, sub], i) => {
    const x = L + (i % 2) * 3.3, y = 2.6 + Math.floor(i / 2) * 1.2, w = 3.15, h = 1.05;
    card(s, x, y, w, h);
    s.rect({ x, y: y + 0.18, w: 0.045, h: h - 0.36, fill: GOLD });
    label(s, l, x + 0.25, y + 0.14, w - 0.35);
    s.text(v, { x: x + 0.25, y: y + 0.38, w: w - 0.35, h: 0.36, font: "head", size: 16.5, color: WHITE });
    s.text(sub, { x: x + 0.25, y: y + 0.72, w: w - 0.35, h: 0.25, size: 10.5, color: MUTED });
  });
  s.text("Семья — немецкоязычные католики в преимущественно чешском городке.",
    { x: L, y: 6.27, w: 6.5, h: 0.3, size: 11.5, italic: true, color: MUTED });
  slides.push(s);
}

// 3. EDUCATION
{
  const s = new Slide({ notes:
`С 1893 по 1901 год Шумпетер учился в Терезиануме — элитной венской школе, где учились дети аристократии. Там он получил классическое образование и выучил несколько языков.
Затем — юридический факультет Венского университета, где он изучал право и экономику. Его учителями были Ойген фон Бём-Баверк и Фридрих фон Визер — классики австрийской экономической школы. В 1906 году, в 23 года, он стал доктором права.
После этого он год провёл в Англии — в Лондонской школе экономики и Британском музее, а затем уехал работать юристом в Каир. Важно: учился он у «австрийцев», но не стал их последователем — пошёл своим путём.` });
  chrome(s, 3, "02 — ОБРАЗОВАНИЕ", { bg: "vienna" });
  title(s, "Элитная школа и Венский университет");
  const items = [
    ["1893–1901", "Терезианум", "Элитная венская гимназия для детей аристократии: классическое образование, несколько языков."],
    ["1901–1906", "Венский университет", "Право и экономика. Учителя — Бём-Баверк и Визер, классики австрийской школы."],
    ["1906", "Доктор права в 23 года", "Один из самых молодых докторов наук в империи."],
    ["1906–1907", "Лондон", "Год в Лондонской школе экономики и Британском музее."],
  ];
  const top = 2.62, step = 0.86;
  s.line({ x1: L + 0.12, y1: top + 0.12, x2: L + 0.12, y2: top + step * 3 + 0.12, color: GOLD, lineT: 45, width: 1.5 });
  items.forEach(([yr, t, d], i) => {
    const y = top + i * step;
    s.rect({ x: L + 0.02, y: y + 0.02, w: 0.2, h: 0.2, shape: "ellipse", fill: DARK, line: GOLD, lineW: 2 });
    s.text([run(yr + "   ", { color: GOLD, bold: true, size: 13 }), run(t, { color: WHITE, bold: true, size: 15 })],
      { x: L + 0.5, y: y - 0.02, w: 6, h: 0.3 });
    s.text(d, { x: L + 0.5, y: y + 0.3, w: 4.7, h: 0.5, size: 11.5, color: MUTED });
  });
  card(s, L, 6.05, 5.45, 0.68, { lineT: 60 });
  s.text("Учился у «австрийцев», но их последователем не стал — построил собственную теорию развития.",
    { x: L + 0.25, y: 6.05, w: 5.05, h: 0.68, font: "head", italic: true, size: 12.5, color: GOLD2, valign: "middle" });
  slides.push(s);
}

// 4. CAREER
{
  const s = new Slide({ notes:
`Карьера Шумпетера похожа на приключенческий роман. В 1907 году он — юрист в Каире, где пишет первую книгу. В 1909-м становится профессором в Черновцах — одним из самых молодых профессоров империи. С 1911 года — профессор в Граце; в это время выходит его главная книга «Теория экономического развития». В 1913 году он читает лекции в Колумбийском университете в Нью-Йорке.
После Первой мировой войны, в 1919 году, его назначают министром финансов Австрийской республики — он пробыл на посту около семи месяцев. В 1921–1924 годах он президент Biedermann Bank; банк рухнул, и Шумпетер много лет выплачивал долги.
В 1925-м он профессор в Бонне, а в 1926-м переживает трагедию: умирают мать и молодая жена Анни. С 1932 года и до конца жизни — профессор Гарварда. В 1939 году он стал гражданином США. Умер 8 января 1950 года в Коннектикуте.` });
  chrome(s, 4, "03 — ЧЕМ ЗАНИМАЛСЯ: КАРЬЕРА", { bg: "journey" });
  title(s, "Путь: от Каира до Гарварда", { w: 11, h: 0.8 });
  const ev = [
    ["1907", "Каир", "Юрист в Смешанном суде Египта; пишет первую книгу"],
    ["1909", "Черновцы", "Профессор в 26 лет — один из самых молодых в империи"],
    ["1911", "Грац", "Профессор; выходит «Теория экономического развития»"],
    ["1913", "Нью-Йорк", "Приглашённый профессор Колумбийского университета"],
    ["1919", "Вена", "Министр финансов Австрии (около 7 месяцев)"],
    ["1921", "Банк", "Президент Biedermann Bank; крах в 1924, долги"],
    ["1925", "Бонн", "Профессор; в 1926 умирают мать и жена Анни"],
    ["1932", "Гарвард", "Профессор до конца жизни; гражданин США с 1939"],
  ];
  const col = CW / ev.length, ly = 2.2;
  s.rect({ x: L - 0.1, y: 1.95, w: CW + 0.2, h: 2.45, fill: DARK, fillT: 22, line: GOLD, lineT: 80, radius: 0.1 });
  s.line({ x1: L + col / 2, y1: ly, x2: R - col / 2, y2: ly, color: GOLD, lineT: 35, width: 1.5 });
  ev.forEach(([yr, place, d], i) => {
    const cx = L + col * (i + 0.5);
    const last = i === ev.length - 1;
    s.rect({ x: cx - 0.1, y: ly - 0.1, w: 0.2, h: 0.2, shape: "ellipse", fill: last ? GOLD : DARK, line: GOLD, lineW: 2 });
    const x = L + col * i + 0.07, w = col - 0.14;
    s.text(yr, { x, y: ly + 0.22, w, h: 0.42, font: "head", size: 20, color: GOLD, align: "center" });
    s.text(place, { x, y: ly + 0.66, w, h: 0.3, size: 12.5, bold: true, color: WHITE, align: "center" });
    s.text(d, { x, y: ly + 0.98, w, h: 1.2, size: 10, color: MUTED, align: "center", lineSpacingMultiple: 1.05 });
  });
  slides.push(s);
}

// 5. ROLES
{
  const s = new Slide({ notes:
`Если коротко, у Шумпетера было четыре роли. Первая — учёный: он писал об экономическом развитии, деловых циклах, истории экономической мысли, а также о социологии и политике.
Вторая — министр финансов: в 1919 году он около семи месяцев работал в правительстве новой Австрийской республики.
Третья — банкир: с 1921 по 1924 год он возглавлял Biedermann Bank. Банк рухнул, и Шумпетер на собственном опыте узнал, что такое предпринимательский риск.
Четвёртая — профессор Гарварда. Среди его студентов — будущие нобелевские лауреаты Пол Самуэльсон и Джеймс Тобин. Он был президентом Эконометрического общества и Американской экономической ассоциации.
И известная легенда: в юности он хотел стать величайшим экономистом мира, лучшим наездником Австрии и величайшим любовником Вены — и позже шутил, что не вышло только с лошадьми.` });
  chrome(s, 5, "04 — ЧЕМ ЗАНИМАЛСЯ: ЧЕТЫРЕ РОЛИ", { bg: "plain" });
  title(s, "Учёный, министр, банкир, профессор", { w: 7.9 });
  // portrait with layered "3D" frame
  const px = 9.3, py = 1.0, pw = 3.2, ph = 3.2 / 0.687;
  s.rect({ x: px + 0.18, y: py + 0.18, w: pw, h: ph, fill: GOLD, fillT: 82, line: GOLD, lineT: 55 });
  s.rect({ x: px - 0.06, y: py - 0.06, w: pw + 0.12, h: ph + 0.12, fill: DARK, line: GOLD, lineW: 1.25, shadow: true });
  s.img(A("portrait-1910.jpg"), { x: px, y: py, w: pw, h: ph });
  s.text("Шумпетер около 1910 г. · Wikimedia Commons", { x: px - 0.2, y: py + ph + 0.3, w: pw + 0.6, h: 0.25, size: 9, color: MUTED, align: "center" });
  const roles = [
    ["I", "Учёный-экономист", "Теория развития, деловые циклы, история экономической мысли; писал и о социологии, и о политике."],
    ["II", "Министр финансов · 1919", "Около семи месяцев в правительстве новой Австрийской республики после распада империи."],
    ["III", "Банкир · 1921–1924", "Президент Biedermann Bank. Банк рухнул — сам испытал риск предпринимателя и годами отдавал долги."],
    ["IV", "Профессор Гарварда", "Учил будущих нобелевских лауреатов Самуэльсона и Тобина; президент Эконометрического общества и AEA."],
  ];
  roles.forEach(([n, t, d], i) => {
    const x = L + (i % 2) * 4.2, y = 2.6 + Math.floor(i / 2) * 1.78, w = 4.0, h = 1.6;
    card(s, x, y, w, h, { fillT: 15 });
    s.text(n, { x: x + 0.22, y: y + 0.16, w: 0.7, h: 0.45, font: "head", size: 22, color: GOLD });
    s.text(t, { x: x + 0.85, y: y + 0.2, w: w - 1.0, h: 0.35, size: 14, bold: true, color: WHITE });
    s.text(d, { x: x + 0.22, y: y + 0.66, w: w - 0.4, h: 0.85, size: 11, color: MUTED, lineSpacingMultiple: 1.05 });
  });
  s.rect({ x: L, y: 6.2, w: 0.045, h: 0.58, fill: CYAN });
  s.text([run("Легенда.  ", { bold: true, color: CYAN }), run("В юности мечтал стать величайшим экономистом мира, лучшим наездником Австрии и величайшим любовником Вены. Позже шутил, что не вышло только с лошадьми.", { color: WHITE })],
    { x: L + 0.2, y: 6.18, w: 8.0, h: 0.62, size: 11, valign: "middle" });
  slides.push(s);
}

// 6. WORKS
{
  const s = new Slide({ notes:
`Главные труды Шумпетера. «Теория экономического развития» вышла в 1911 году, хотя на титуле стоит 1912-й. В ней он впервые описал предпринимателя как источник развития экономики.
«Деловые циклы» 1939 года объясняют, почему экономика растёт волнами. Именно здесь он назвал длинные волны в честь русского экономиста Николая Кондратьева.
«Капитализм, социализм и демократия» 1942 года — его самая известная книга, где появляется понятие «созидательное разрушение».
И «История экономического анализа» — огромный труд, изданный уже после его смерти, в 1954 году.` });
  chrome(s, 6, "05 — ГЛАВНЫЕ ТРУДЫ", { bg: "books" });
  title(s, "Четыре книги, которые стоит знать");
  const works = [
    ["1911/12", "«Теория экономического развития»", "Предприниматель, инновации и кредит как двигатель развития."],
    ["1939", "«Деловые циклы»", "Почему экономика растёт волнами; «циклы Кондратьева»."],
    ["1942", "«Капитализм, социализм и демократия»", "«Созидательное разрушение» — его самая известная идея."],
    ["1954", "«История экономического анализа»", "Огромная история экономической мысли; издана посмертно."],
  ];
  works.forEach(([yr, t, d], i) => {
    const y = 2.62 + i * 0.98;
    if (i) s.line({ x1: L, y1: y - 0.14, x2: L + 6.4, y2: y - 0.14, color: "FFFFFF", lineT: 85, width: 0.75 });
    s.text(yr, { x: L, y: y - 0.02, w: 1.35, h: 0.45, font: "head", size: 21, color: GOLD });
    s.text(t, { x: L + 1.5, y, w: 5.0, h: 0.34, font: "head", size: 15, color: WHITE, bold: true });
    s.text(d, { x: L + 1.5, y: y + 0.38, w: 4.9, h: 0.35, size: 11.5, color: MUTED });
  });
  slides.push(s);
}

// 7. MAIN IDEA
{
  const s = new Slide({ notes:
`Главная мысль Шумпетера: экономика меняется изнутри и скачками. Большинство экономистов того времени изучали равновесие — состояние, когда экономика из года в год повторяет себя. Шумпетер называл это «кругооборотом». В нём нет развития, а прибыль стремится к нулю.
Развитие начинается, когда кто-то ломает этот круг: вводит новый продукт, новый способ производства, выходит на новый рынок. Это скачок, а не плавный рост. Лучше всего это показывает его знаменитая фраза: сколько ни складывай почтовые кареты, железной дороги не получишь. Новое — это не «больше того же самого», а качественно другое.` });
  chrome(s, 7, "06 — ГЛАВНАЯ МЫСЛЬ", { bg: "idea" });
  title(s, "Экономика меняется изнутри — скачками");
  const cw = 2.72;
  const col = (x, lab, labC, head, bullets, hi) => {
    card(s, x, 2.6, cw, 2.35, { line: hi ? GOLD : "8090A8", lineT: hi ? 35 : 70, fillT: 12 });
    label(s, lab, x + 0.22, 2.78, cw - 0.4, labC);
    s.text(head, { x: x + 0.22, y: 3.03, w: cw - 0.4, h: 0.42, font: "head", size: 20, color: WHITE });
    s.text(bullets.map((b) => br(b, { bullet: true, paraSpaceAfter: 4 })), { x: x + 0.22, y: 3.55, w: cw - 0.36, h: 1.35, size: 11, color: MUTED, lineSpacingMultiple: 1.0 });
  };
  col(L, "КРУГООБОРОТ", MUTED, "Статика", ["Экономика повторяет себя из года в год", "Спрос и предложение в равновесии", "Прибыль стремится к нулю"], false);
  s.text("→", { x: L + cw, y: 3.4, w: 0.45, h: 0.6, font: "head", size: 28, color: GOLD, align: "center" });
  col(L + cw + 0.45, "РАЗВИТИЕ", CYAN, "Динамика", ["Предприниматель вводит новое", "Равновесие ломается изнутри", "Появляются прибыль и рост"], true);
  s.text("“", { x: L - 0.05, y: 5.05, w: 0.6, h: 0.8, font: "head", size: 64, color: GOLD });
  s.text("Складывайте сколько угодно почтовых карет, железной дороги вы так не получите.",
    { x: L + 0.55, y: 5.25, w: 5.6, h: 0.85, font: "head", italic: true, size: 17, color: GOLD2, lineSpacingMultiple: 1.0 });
  s.text("— Й. Шумпетер, «Теория экономического развития»", { x: L + 0.55, y: 6.05, w: 5.6, h: 0.3, size: 10.5, color: MUTED });
  slides.push(s);
}

// 8. FIVE COMBINATIONS
{
  const s = new Slide({ notes:
`Что именно Шумпетер называл новым? Он выделил пять «новых комбинаций»: новый продукт или новое качество товара; новый способ производства; новый рынок сбыта; новый источник сырья или полуфабрикатов; и новая организация отрасли — например, создание или разрушение монополии.
Ключевой момент: инновация — это не изобретение. Изобретение может годами лежать без дела. Инновация — это когда новое реально внедрено в хозяйственную жизнь.` });
  chrome(s, 8, "07 — ГЛАВНАЯ МЫСЛЬ: ИННОВАЦИЯ", { bg: "combos" });
  title(s, "Пять «новых комбинаций»", { w: 5.6 });
  s.text("Инновация по Шумпетеру — любое из пяти изменений:", { x: L, y: 2.42, w: 6, h: 0.3, size: 13, color: MUTED });
  const c = [
    ["Новый продукт", "или новое качество знакомого товара"],
    ["Новый способ производства", "технология или способ продажи"],
    ["Новый рынок", "куда отрасль страны раньше не выходила"],
    ["Новый источник сырья", "или полуфабрикатов"],
    ["Новая организация отрасли", "создание или разрушение монополии"],
  ];
  c.forEach(([t, d], i) => {
    const y = 2.9 + i * 0.64;
    s.rect({ x: L, y: y + 0.02, w: 0.5, h: 0.5, shape: "ellipse", fill: CARD, fillT: 10, line: GOLD, lineW: 1.25 });
    s.text(String(i + 1), { x: L, y: y + 0.02, w: 0.5, h: 0.5, font: "head", size: 16, color: GOLD, align: "center", valign: "middle" });
    s.text(t, { x: L + 0.7, y: y - 0.01, w: 4.6, h: 0.3, size: 14.5, bold: true, color: WHITE });
    s.text(d, { x: L + 0.7, y: y + 0.29, w: 4.6, h: 0.28, size: 11.5, color: MUTED });
  });
  card(s, L, 6.25, 5.5, 0.56, { line: CYAN, lineT: 50 });
  s.text([run("Изобретение ≠ инновация:  ", { bold: true, color: CYAN }), run("важно не придумать, а внедрить.", { color: WHITE })],
    { x: L + 0.22, y: 6.25, w: 5.2, h: 0.56, size: 12.5, valign: "middle" });
  slides.push(s);
}

// 9. ENTREPRENEUR
{
  const s = new Slide({ notes:
`Теперь о главном для нашей темы — о предпринимателе. По Шумпетеру, предприниматель — это не обязательно изобретатель, не обязательно владелец капитала и не просто управляющий. Его функция — осуществить новую комбинацию: соединить идею, людей, ресурсы и кредит так, чтобы новое заработало на рынке.
Поэтому предприниматель — это роль, а не профессия: человек остаётся предпринимателем, пока внедряет новое, и перестаёт им быть, когда просто управляет налаженным делом.
Что движет предпринимателем? Шумпетер называл три мотива: мечту основать своё «частное королевство», волю к победе — желание бороться и доказать превосходство, и радость творчества.` });
  chrome(s, 9, "08 — ПРЕДПРИНИМАТЕЛЬСТВО: КТО ЭТО", { bg: "entrepreneur" });
  title(s, "Предприниматель — тот, кто внедряет новое", { size: 34, w: 6.4 });
  label(s, "НЕ ОБЯЗАТЕЛЬНО", L, 2.48, 4);
  ["изобретатель", "капиталист", "управляющий"].forEach((t, i) => {
    const x = L + i * 1.98;
    s.rect({ x, y: 2.78, w: 1.86, h: 0.46, fill: CARD, fillT: 20, line: "8090A8", lineT: 55, radius: 0.23 });
    s.text([run("×  ", { color: "E77B6A", bold: true }), run(t, { color: WHITE })], { x, y: 2.78, w: 1.86, h: 0.46, size: 12, align: "center", valign: "middle" });
  });
  label(s, "ЕГО ФУНКЦИЯ", L, 3.5, 4);
  s.text([run("Соединить идею, людей, ресурсы и кредит так, чтобы новая комбинация заработала на рынке. "),
    run("Это роль, а не должность: ", { bold: true, color: GOLD2 }), run("человек — предприниматель, пока внедряет новое.")],
    { x: L, y: 3.78, w: 5.9, h: 0.95, size: 13, color: WHITE, lineSpacingMultiple: 1.05 });
  label(s, "ТРИ МОТИВА ПО ШУМПЕТЕРУ", L, 4.92, 5);
  [["01", "Мечта основать «частное королевство»"], ["02", "Воля к победе и желание бороться"], ["03", "Радость творчества и дела"]].forEach(([n, t], i) => {
    const x = L + i * 1.98, y = 5.22, w = 1.86, h = 1.35;
    card(s, x, y, w, h, { fillT: 15 });
    s.text(n, { x: x + 0.18, y: y + 0.12, w: 1, h: 0.4, font: "head", size: 18, color: GOLD });
    s.text(t, { x: x + 0.18, y: y + 0.52, w: w - 0.3, h: 0.8, size: 11.5, color: WHITE, lineSpacingMultiple: 1.0 });
  });
  slides.push(s);
}

// 10. MECHANISM
{
  const s = new Slide({ notes:
`Как, по Шумпетеру, работает механизм развития? Сначала появляется новая комбинация. Но у предпринимателя обычно нет денег — их даёт банк, который создаёт кредит. Поэтому Шумпетер называл банкира «эфором» — надзирателем — рыночной экономики.
Дальше предприниматель внедряет новинку и получает предпринимательскую прибыль — временную награду за новизну. Как только успех становится заметен, появляется «рой» подражателей: они копируют новинку, старые решения вытесняются, прибыль исчезает, и экономика выходит на новое равновесие, но уже на более высоком уровне — до следующего скачка.` });
  chrome(s, 10, "09 — ПРЕДПРИНИМАТЕЛЬСТВО: МЕХАНИЗМ", { bg: "plain" });
  title(s, "Как инновация двигает экономику", { w: 11.5, h: 0.8 });
  s.text("Схема из «Теории экономического развития» (1911/12)", { x: L, y: 1.78, w: 11, h: 0.3, size: 13, color: MUTED });
  const steps = [
    ["Новая комбинация", "Идея нового продукта, способа, рынка, сырья или организации"],
    ["Кредит банка", "Банк создаёт покупательную силу и финансирует внедрение"],
    ["Внедрение", "Предприниматель перестраивает производство и выходит на рынок"],
    ["Прибыль", "Временная награда за новизну, пока нет конкурентов"],
    ["Рой подражателей", "Другие фирмы копируют успех, старое вытесняется"],
    ["Новое равновесие", "Экономика на более высоком уровне — до следующего скачка"],
  ];
  const gap = 0.2, w = (CW - gap * 5) / 6, bottom = 5.42;
  steps.forEach(([t, d], i) => {
    const x = L + i * (w + gap), y = 2.95 - i * 0.14, h = bottom - y;
    const hot = i === 2;
    s.rect({ x, y, w, h, fill: hot ? "2A2210" : CARD, fillT: hot ? 0 : 5, line: hot ? GOLD : GOLD, lineT: hot ? 20 : 70, radius: 0.08, shadow: true });
    s.rect({ x, y, w, h: 0.05, fill: i < 3 ? GOLD : CYAN });
    s.text(String(i + 1).padStart(2, "0"), { x: x + 0.18, y: y + 0.18, w: 1, h: 0.5, font: "head", size: 26, color: i < 3 ? GOLD : CYAN });
    s.text(t, { x: x + 0.18, y: y + 0.75, w: w - 0.3, h: 0.55, size: 13, bold: true, color: WHITE, lineSpacingMultiple: 0.95 });
    s.text(d, { x: x + 0.18, y: y + 1.32, w: w - 0.3, h: 1.1, size: 10.5, color: MUTED, lineSpacingMultiple: 1.05 });
    if (i < 5) s.rect({ x: x + w + 0.035, y: 4.3, w: 0.13, h: 0.16, shape: "tri", rotate: 90, fill: GOLD, fillT: 20 });
  });
  const bw = (CW - 0.25) / 2;
  [["Банкир — «эфор» рыночной экономики:", " кредит даёт предпринимателю ресурсы раньше, чем появится прибыль.", GOLD],
   ["Прибыль временна:", " подражатели «роем» копируют новинку, и рынок приходит к новому равновесию.", CYAN]].forEach(([b, t, c], i) => {
    const x = L + i * (bw + 0.25);
    card(s, x, 5.7, bw, 0.95, { line: c, lineT: 55 });
    s.text([run(b, { bold: true, color: c }), run(t, { color: WHITE })], { x: x + 0.25, y: 5.7, w: bw - 0.45, h: 0.95, size: 12.5, valign: "middle" });
  });
  slides.push(s);
}

// 11. CREATIVE DESTRUCTION
{
  const s = new Slide({ notes:
`В книге «Капитализм, социализм и демократия» 1942 года Шумпетер ввёл самое знаменитое своё понятие — «созидательное разрушение». Новые продукты, технологии и компании не просто добавляются к старым — они их вытесняют. Автомобиль вытеснил карету, электричество — паровые машины на фабриках, цифровое фото — плёнку, стриминг — видеопрокат.
Шумпетер писал, что этот процесс и есть «основной факт капитализма». Важно: это не обещание, что победит любая инновация, а описание того, как экономика постоянно перестраивается.` });
  chrome(s, 11, "10 — ГЛАВНАЯ ИДЕЯ 1942 ГОДА", { bg: "destruction" });
  title(s, "Созидательное разрушение", { size: 36, w: 8.4, h: 0.8 });
  s.text("«Процесс созидательного разрушения — это основной факт капитализма»",
    { x: L, y: 1.82, w: 8.5, h: 0.4, font: "head", italic: true, size: 15, color: GOLD2 });
  s.text("— «Капитализм, социализм и демократия», 1942, гл. VII", { x: L, y: 2.3, w: 7, h: 0.28, size: 10.5, color: MUTED });
  card(s, 9.45, 0.95, 3.13, 1.65, { line: CYAN, lineT: 55, fillT: 15 });
  s.text([br("Не обещание успеха", { bold: true, color: CYAN, paraSpaceAfter: 4 }), run("Это не гарантия, что победит любая новинка, а описание постоянной перестройки экономики.", { color: WHITE })],
    { x: 9.65, y: 0.95, w: 2.8, h: 1.65, size: 11, valign: "middle" });
  const ex = ["Карета → автомобиль", "Пар → электричество", "Плёнка → цифровое фото", "Видеопрокат → стриминг"];
  const ew = (CW - 0.2 * 3) / 4;
  ex.forEach((t, i) => {
    const x = L + i * (ew + 0.2);
    s.rect({ x, y: 2.85, w: ew, h: 0.5, fill: DARK, fillT: 25, line: GOLD, lineT: 55, radius: 0.25 });
    s.text(t, { x, y: 2.85, w: ew, h: 0.5, size: 12.5, color: WHITE, bold: true, align: "center", valign: "middle" });
  });
  slides.push(s);
}

// 12. WAVES
{
  const s = new Slide({ notes:
`В книге «Деловые циклы» 1939 года Шумпетер объяснил, почему экономика растёт волнами. Инновации появляются не равномерно, а кластерами — и каждая такая «гроздь» запускает длинную волну подъёма примерно на 50 лет. Эти волны он назвал в честь русского экономиста Николая Кондратьева.
Шумпетер выделил три волны: промышленная революция с текстилем и паровой машиной; эпоха железных дорог и стали; эпоха электричества, химии и автомобиля. Его последователи — неошумпетерианцы, например Кристофер Фримен и Карлота Перес, — продолжили схему: волна нефти и массового производства и волна информационных технологий и интернета.` });
  chrome(s, 12, "11 — ВОЛНЫ ИННОВАЦИЙ", { bg: "plain" });
  title(s, "Экономика растёт волнами", { w: 11.5, h: 0.8 });
  s.text("«Деловые циклы» (1939): кластеры инноваций запускают длинные волны — Шумпетер назвал их в честь Н. Д. Кондратьева",
    { x: L, y: 1.78, w: 11.8, h: 0.3, size: 13, color: MUTED });
  const waves = [
    ["I", "1787–1842", "Текстиль, паровая машина, железо", false],
    ["II", "1843–1897", "Железные дороги и сталь", false],
    ["III", "1898–1940-е", "Электричество, химия, автомобиль", false],
    ["IV", "XX век", "Нефть, массовое производство", true],
    ["V", "с 1970-х", "Микроэлектроника, интернет", true],
  ];
  const ww = CW / 5, base = 4.95;
  s.line({ x1: L, y1: base, x2: R, y2: base, color: "FFFFFF", lineT: 80, width: 0.75 });
  waves.forEach(([n, d, t, later], i) => {
    const x0 = L + i * ww, pts = [];
    const lift = i * 0.16;
    for (let k = 0; k <= 36; k++) {
      const u = k / 36;
      pts.push([x0 + u * ww, base - lift * (k === 0 ? 1 : 1) - (1.65) * Math.sin(Math.PI * u) - 0.16 * u + 0.0]);
    }
    // soft glow + main stroke
    s.poly(pts, { color: later ? CYAN : GOLD, width: 9, lineT: 85, dash: undefined });
    s.poly(pts, { color: later ? CYAN : GOLD, width: 2.75, dash: later ? "dash" : undefined });
    const peakY = base - lift - 1.65 - 0.08;
    s.text(n, { x: x0, y: peakY + 0.55, w: ww, h: 0.5, font: "head", size: 24, color: later ? CYAN : GOLD, align: "center" });
    s.text(d, { x: x0 + 0.1, y: base + 0.18, w: ww - 0.2, h: 0.3, size: 12.5, bold: true, color: WHITE, align: "center" });
    s.text(t, { x: x0 + 0.1, y: base + 0.5, w: ww - 0.2, h: 0.5, size: 11, color: MUTED, align: "center" });
  });
  s.text([run("I–III", { bold: true, color: GOLD }), run(" — датировка Шумпетера (1939).   "), run("IV–V", { bold: true, color: CYAN }),
    run(" — продолжение у неошумпетерианцев (К. Фримен, К. Перес).   Кроме длинных волн — короткие циклы Китчина (3–4 года) и Жюгляра (7–11 лет).")],
    { x: L, y: 6.3, w: CW, h: 0.5, size: 10.5, color: MUTED });
  slides.push(s);
}

// 13. LEGACY
{
  const s = new Slide({ notes:
`Итак, что Шумпетер сделал для теории предпринимательства. Первое: он поставил предпринимателя в центр экономики — как двигатель развития, а не просто владельца капитала. Второе: разделил изобретение и инновацию и показал, что предпринимательство — это функция внедрения нового. Третье: объяснил предпринимательскую прибыль как временную награду за новизну.
Четвёртое: у него фактически две модели. В ранней книге инновации делают новые смелые фирмы-одиночки, в книге 1942 года — крупные корпорации со своими исследовательскими лабораториями. Позже исследователи назвали их «Шумпетер Mark I» и «Mark II».
И пятое: он заложил основу экономики инноваций. На его идеях выросла неошумпетерианская школа, в 1986 году появилось Международное общество Шумпетера, а современные идеи о подрывных инновациях и стартапах во многом опираются на его рамку.` });
  chrome(s, 13, "12 — ВКЛАД В ПРЕДПРИНИМАТЕЛЬСТВО", { bg: "legacy" });
  title(s, "Что Шумпетер дал предпринимательству", { w: 6.4 });
  const pts = [
    ["Предприниматель — в центре экономики", "Не владелец капитала, а двигатель развития."],
    ["Инновация ≠ изобретение", "Предпринимательство — функция внедрения нового."],
    ["Объяснение прибыли", "Временная награда за новизну, которую съедает конкуренция."],
    ["Две модели: Mark I и Mark II", "Смелые новые фирмы (1911) и R&D крупных корпораций (1942)."],
    ["Основа экономики инноваций", "Неошумпетерианцы, общество Шумпетера (1986), стартапы."],
  ];
  pts.forEach(([t, d], i) => {
    const y = 2.55 + i * 0.8;
    s.text(String(i + 1).padStart(2, "0"), { x: L, y: y - 0.04, w: 0.6, h: 0.4, font: "head", size: 18, color: GOLD });
    s.text(t, { x: L + 0.65, y, w: 5.0, h: 0.3, size: 14, bold: true, color: WHITE });
    s.text(d, { x: L + 0.65, y: y + 0.31, w: 5.0, h: 0.3, size: 11.5, color: MUTED });
  });
  s.text("Термины Mark I / Mark II ввели позже исследователи его работ.", { x: L, y: 6.58, w: 6, h: 0.25, size: 9.5, italic: true, color: MUTED });
  slides.push(s);
}

// 14. FINALE
{
  const s = new Slide({ notes:
`Подведу итог. Кто он: австрийско-американский экономист из Моравии, который успел побыть министром, банкиром и профессором Гарварда. Его главная мысль: экономика развивается скачками, через новые комбинации, которые ломают равновесие, — это созидательное разрушение. Его вклад в предпринимательство: предприниматель — это тот, кто внедряет новое; это функция, а не должность и не капитал.
Спасибо за внимание!` });
  chrome(s, 14, "ИТОГ", { bg: "finale" });
  title(s, "Главное за 30 секунд", { h: 0.8 });
  const t = [
    ["КТО", "Австрийско-американский экономист из Моравии (1883–1950): министр, банкир, профессор Гарварда."],
    ["ГЛАВНАЯ МЫСЛЬ", "Экономика развивается скачками: новые комбинации ломают равновесие — «созидательное разрушение»."],
    ["ВКЛАД В ПРЕДПРИНИМАТЕЛЬСТВО", "Предприниматель — тот, кто внедряет новое. Это функция, а не должность и не капитал."],
  ];
  t.forEach(([l, d], i) => {
    const y = 2.0 + i * 1.32;
    card(s, L, y, 6.3, 1.15, { fillT: 25 });
    s.rect({ x: L, y: y + 0.2, w: 0.05, h: 0.75, fill: i === 2 ? CYAN : GOLD });
    label(s, l, L + 0.3, y + 0.15, 5.8, i === 2 ? CYAN : GOLD);
    s.text(d, { x: L + 0.3, y: y + 0.42, w: 5.8, h: 0.7, font: "head", size: 14.5, color: WHITE, lineSpacingMultiple: 1.0 });
  });
  s.text("Спасибо за внимание!", { x: L, y: 6.08, w: 6.3, h: 0.6, font: "head", italic: true, size: 26, color: GOLD2 });
  slides.push(s);
}

// 15. SOURCES
{
  const s = new Slide({ notes: "Слайд с источниками — вслух не читается." });
  chrome(s, 15, "ДЛЯ ПРОВЕРКИ ФАКТОВ", { bg: "plain" });
  title(s, "Источники", { h: 0.8, size: 34 });
  const colA = [
    br("БИОГРАФИЯ", { bold: true, color: GOLD, size: 10, charSpacing: 2, paraSpaceAfter: 4 }),
    br("EBSCO Research Starters — Joseph Schumpeter", { bullet: true }),
    br("Encyclopedia.com — Schumpeter, Joseph Alois (1883–1950)", { bullet: true }),
    br("HET Website (The New School) — J. A. Schumpeter profile", { bullet: true }),
    br("Essential Scholars — Who Is Joseph Schumpeter? (2022)", { bullet: true }),
    br("Swedberg R. Joseph A. Schumpeter: His Life and Work (1991)", { bullet: true }),
    br("McCraw T. Prophet of Innovation (2007)", { bullet: true, paraSpaceAfter: 10 }),
    br("НАСЛЕДИЕ", { bold: true, color: GOLD, size: 10, charSpacing: 2, paraSpaceAfter: 4 }),
    br("Freeman C., Perez C. — длинные волны и техно-экономические парадигмы", { bullet: true }),
    br("International J. A. Schumpeter Society (осн. 1986)", { bullet: true }),
  ];
  const colB = [
    br("ТРУДЫ ШУМПЕТЕРА", { bold: true, color: GOLD, size: 10, charSpacing: 2, paraSpaceAfter: 4 }),
    br("Theorie der wirtschaftlichen Entwicklung (1911/12), гл. II", { bullet: true }),
    br("Business Cycles (1939)", { bullet: true }),
    br("Capitalism, Socialism and Democracy (1942), гл. VII", { bullet: true }),
    br("History of Economic Analysis (1954)", { bullet: true, paraSpaceAfter: 10 }),
    br("ОБ ИЗОБРАЖЕНИЯХ", { bold: true, color: GOLD, size: 10, charSpacing: 2, paraSpaceAfter: 4 }),
    br("3D-иллюстрации созданы нейросетью и не являются архивными изображениями.", { bullet: true }),
    br("Портрет около 1910 г. — Wikimedia Commons, общественное достояние.", { bullet: true }),
  ];
  s.text(colA, { x: L, y: 2.0, w: 5.7, h: 4.6, size: 11.5, color: WHITE, paraSpaceAfter: 3 });
  s.text(colB, { x: 6.85, y: 2.0, w: 5.7, h: 4.6, size: 11.5, color: WHITE, paraSpaceAfter: 3 });
  slides.push(s);
}

N = slides.length;

// ---------- output ----------
async function main() {
  const pptxgen = require("pptxgenjs");
  const JSZip = require("jszip");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Йозеф Шумпетер — 3D-презентация";
  pres.author = "omgGame";
  pres.subject = "Биография, главная мысль и вклад в теорию предпринимательства";
  toPptx(pres, slides);
  const buf = await pres.write({ outputType: "nodebuffer" });

  // add Morph transitions (fallback: fade) to every slide
  const zip = await JSZip.loadAsync(buf);
  const morph = `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" p14:dur="1400"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`;
  for (let i = 1; i <= slides.length; i++) {
    const f = `ppt/slides/slide${i}.xml`;
    let x = await zip.file(f).async("string");
    if (i > 1) x = x.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + morph);
    zip.file(f, x);
  }
  const out = path.join(__dirname, "../../exports/schumpeter-3d-presentation.pptx");
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB", slides.length, "slides");

  if (process.argv.includes("--preview")) {
    const fontsDir = path.join(__dirname, "node_modules/@fontsource");
    const pages = toHtml(slides, path.join(__dirname, "assets"), fontsDir);
    const outDir = path.join(__dirname, "preview");
    fs.mkdirSync(outDir, { recursive: true });
    const chromiumMod = require("@sparticuz/chromium");
    const chromium = chromiumMod.default || chromiumMod;
    const puppeteer = require("puppeteer-core");
    // headless chromium needs nss/nspr; @sparticuz ships them for Amazon Linux only
    if (!fs.existsSync("/tmp/al/lib/libnspr4.so")) {
      const zlib = require("zlib"), { execSync } = require("child_process");
      fs.mkdirSync("/tmp/al", { recursive: true });
      const br = require.resolve("@sparticuz/chromium").replace(/build\/.*$/, "bin/al2023.tar.br");
      fs.writeFileSync("/tmp/al/al.tar", zlib.brotliDecompressSync(fs.readFileSync(br)));
      execSync("tar xf al.tar", { cwd: "/tmp/al" });
    }
    process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || "") + ":/tmp/al/lib";
    const browser = await puppeteer.launch({ args: [...chromium.args, "--allow-file-access-from-files"], executablePath: await chromium.executablePath(), headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    const only = process.argv.find((a) => a.startsWith("--only="));
    const want = only ? only.slice(7).split(",").map(Number) : null;
    for (let i = 0; i < pages.length; i++) {
      if (want && !want.includes(i + 1)) continue;
      const hf = path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.html`);
      fs.writeFileSync(hf, pages[i]);
      await page.goto("file://" + hf, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: hf.replace(".html", ".png") });
      fs.unlinkSync(hf);
    }
    await browser.close();
    console.log("previews ->", outDir);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
