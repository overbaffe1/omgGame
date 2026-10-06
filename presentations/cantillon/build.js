// Build: node build.js            -> ../../exports/cantillon-3d-presentation.pptx
//        node build.js --preview  -> renders slide PNGs and a contact sheet
//
// Each hero is a real GLB object embedded into PowerPoint as native 3D. Across-slide Morph
// transitions move/turn the exhibits and roll the small gold coin along the progress rail.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { Slide, toPptx, toHtml } = require("./lib");
const { injectModels, injectTiming, dedupeMedia } = require("./pptx3d");

const A = (f) => path.join(__dirname, "assets", f);
const GOLD = "E3B663", GOLD2 = "F3DDAE", WHITE = "F4F1EA", MUTED = "A9B3C6", CYAN = "62D4F0";
const CARD = "0E1930", DARK = "070C18", FACT = "1B160C", RED = "B94737";
const L = 0.75, R = 12.583, CW = R - L, SW = 13.333, H = 7.5;
const slides = [], N = 15, TRACK_Y = 0.44;

function chrome(s, idx, kicker) {
  s.img(A("stage-bg.jpg"), { x: 0, y: 0, w: SW, h: H, name: "Background" });
  s.line({ x1: L, y1: TRACK_Y, x2: R, y2: TRACK_Y, color: "FFFFFF", lineT: 84, width: 0.75, name: "!!track" });
  const cx = L + CW * (idx - 1) / (N - 1), cs = 0.62;
  if (cx - L > 0.01) s.rect({ x: L, y: TRACK_Y - 0.012, w: cx - L, h: 0.024, fill: GOLD, name: "!!progress" });
  s.model("coin_s", { x: cx - cs / 2, y: TRACK_Y - cs / 2 - 0.045, s: cs,
    rot: [0, -12, -144 * (idx - 1)], name: "!!coin", px: 210 });
  if (kicker) {
    s.rect({ x: L, y: 0.78, w: 0.34, h: 0.035, fill: GOLD, name: "!!kickerbar" });
    s.text(kicker, { x: L + 0.48, y: 0.65, w: 10.8, h: 0.3, size: 10.5, bold: true, color: GOLD, charSpacing: 2.4, name: "!!kicker" });
  }
  s.line({ x1: L, y1: 7.0, x2: R, y2: 7.0, color: "FFFFFF", lineT: 88, width: 0.75, name: "!!footline" });
  s.text("РИЧАРД КАНТИЛЬОН  ·  ИРЛАНДИЯ / ФРАНЦИЯ  ·  XVIII ВЕК", {
    x: L, y: 7.1, w: 8.2, h: 0.25, size: 8.5, color: MUTED, charSpacing: 1.6, name: "!!footer" });
  s.text(`${String(idx).padStart(2, "0")} / ${N}`, { x: R - 1.5, y: 7.1, w: 1.5, h: 0.25,
    size: 9, color: MUTED, align: "right", charSpacing: 2, name: "!!pagenum" });
}

function stage(s, key, o) {
  const { x, y, s: sz, rot = [10, -22, 0] } = o;
  const cx = x + sz / 2, cy = y + sz / 2 + (o.dy || 0), g = sz * (o.glow || 1.42);
  s.img(A("glow.png"), { x: cx - g / 2, y: cy - g / 2, w: g, h: g, name: "!!glow" });
  const r1 = sz * 0.47, r2 = sz * 0.60;
  s.rect({ x: cx - r1, y: cy - r1, w: r1 * 2, h: r1 * 2, shape: "ellipse", line: GOLD, lineT: 82, lineW: 0.75, name: "!!ring1" });
  s.rect({ x: cx - r2, y: cy - r2, w: r2 * 2, h: r2 * 2, shape: "ellipse", line: GOLD, lineT: 89, lineW: 0.75, dash: "dash", name: "!!ring2" });
  const shw = sz * (o.shw || 0.78), shy = y + sz * (o.shy || 0.84);
  s.img(A("shadow.png"), { x: cx - shw / 2, y: shy - shw / 8, w: shw, h: shw / 4, name: "!!shadow" });
  s.model(key, { x, y, s: sz, rot, name: `!!m-${key}`, px: o.px });
  s.hero = { key, x, y, s: sz, rot };
  if (o.caption) {
    const [no, t] = o.caption, cw = o.cw || 3.8, capY = o.capY ?? y + sz * 0.93;
    const capX = o.capX ?? cx - cw / 2;
    s.text([{ text: `ЭКСПОНАТ ${no}`, options: { bold: true, color: GOLD, charSpacing: 2.3, breakLine: true } },
      { text: t, options: { color: MUTED } }], { x: capX, y: capY, w: cw, h: 0.5, size: 8.5,
      align: o.capAlign || "center", lineSpacingMultiple: 1.1, ag: 9 });
  }
}

const title = (s, t, o = {}) => s.text(t, { x: o.x ?? L, y: o.y ?? 1.08, w: o.w ?? 7.2, h: o.h ?? 1.2,
  font: "head", size: o.size ?? 35, color: WHITE, lineSpacingMultiple: 0.95, name: "!!title", valign: "top" });
const label = (s, t, x, y, w, color = GOLD, ag) => s.text(t, { x, y, w, h: 0.24, size: 9, bold: true, color, charSpacing: 1.8, ag });
const card = (s, x, y, w, h, o = {}) => s.rect({ x, y, w, h, fill: o.fill || CARD, fillT: o.fillT ?? 18,
  line: o.line || GOLD, lineT: o.lineT ?? 74, lineW: 0.8, radius: o.radius ?? 0.08, shadow: o.shadow, ag: o.ag });
const br = (text, o = {}) => ({ text, options: { ...o, breakLine: true } });
const run = (text, o = {}) => ({ text, options: o });
function fact(s, x, y, w, h, body, o = {}) {
  const ag = o.ag ?? 8, tag = o.tag || "САМОЕ ИНТЕРЕСНОЕ";
  s.rect({ x, y, w, h, fill: FACT, fillT: 7, line: GOLD, lineT: 43, lineW: 1, radius: 0.08, shadow: true, ag });
  s.rect({ x, y: y + 0.15, w: 0.055, h: Math.max(0.12, h - 0.30), fill: GOLD, ag });
  const tw = 0.105 * tag.length + 0.5;
  s.rect({ x: x + 0.28, y: y - 0.14, w: tw, h: 0.29, fill: GOLD, radius: 0.14, ag });
  s.text("★  " + tag, { x: x + 0.28, y: y - 0.14, w: tw, h: 0.29, size: 8.2, bold: true, color: DARK, charSpacing: 1.2, align: "center", valign: "middle", ag });
  const runs = typeof body === "string" ? [run(body)] : body;
  s.text(runs, { x: x + 0.3, y: y + 0.16, w: w - 0.52, h: h - 0.25, font: "head", italic: true,
    size: o.size || 12.7, color: WHITE, valign: "middle", lineSpacingMultiple: 1.04, ag });
}
function pill(s, text, x, y, w, ag = 2, color = GOLD) {
  s.rect({ x, y, w, h: 0.35, fill: color, fillT: 87, line: color, lineT: 50, lineW: 0.8, radius: 0.15, ag });
  s.text(text, { x: x + 0.08, y: y + 0.04, w: w - 0.16, h: 0.24, size: 9.5, bold: true, color, align: "center", ag });
}

// 01 — title
{
  const s = new Slide({ notes: `Ричард Кантильон — ирландско-французский банкир и экономист XVIII века. Он сделал состояние на спекулятивных пузырях, а в рукописи, написанной примерно в 1730 году, описал предпринимателя как человека с известными издержками и неопределённым доходом.\n\nГлавный вопрос этой презентации: почему его считают одним из основателей теории предпринимательства? И как так вышло, что после загадочной смерти его главная книга появилась только через двадцать лет?` });
  chrome(s, 1, "ИСТОРИЯ ДЕНЕГ  ·  РИСК  ·  ПРЕДПРИНИМАТЕЛЬСТВО");
  stage(s, "ship", { x: 6.05, y: 0.72, s: 6.8, rot: [12, -28, 12], px: 1080, shy: 0.86, shw: 0.82,
    caption: ["01", "Торговля, море и неизвестный рынок"], capX: 8.3, capY: 6.43, cw: 3.6, capAlign: "right" });
  s.text([br("Ричард", { color: GOLD2, size: 52 }), run("Кантильон", { size: 64 })],
    { x: L, y: 1.25, w: 7.15, h: 2.15, font: "head", color: WHITE, lineSpacingMultiple: 0.91, name: "!!title" });
  s.rect({ x: L, y: 3.7, w: 1.15, h: 0.04, fill: GOLD, ag: 1 });
  s.text("Банкир, который объяснил,\nпочему доход предпринимателя неизвестен заранее",
    { x: L, y: 3.92, w: 6.1, h: 1.03, font: "head", italic: true, size: 18, color: WHITE, lineSpacingMultiple: 1.06, ag: 1 });
  s.text("ок. 1680-е — 1734   ·   ИРЛАНДИЯ → ФРАНЦИЯ → ЕВРОПА", { x: L, y: 5.2, w: 6.3, h: 0.3, size: 10.5, color: MUTED, charSpacing: 1.7, bold: true, ag: 2 });
  fact(s, L, 5.8, 5.9, 0.92, [run("Не изобрёл французское слово «entrepreneur» — но одним из первых сделал предпринимателя "), run("центральной фигурой экономической теории.", { bold: true })], { size: 12.2 });
  slides.push(s);
}

// 02 — Ireland
{
  const s = new Slide({ notes: `Кантильон родился, вероятно, в 1687 году — историки не уверены в точной дате. Его родиной считают Баллиронан, в приходе Баллихейг, графство Керри на юго-западе Ирландии. Он был вторым сыном землевладельческой католической семьи; владения предков конфисковали после завоевания Ирландии Кромвелем.\n\nЭто важно не как легенда о «человеке из ниоткуда»: у него были семейные связи в банковской среде, и именно сеть контактов помогла ему войти в международные финансы. В 1708 году он получил французское подданство.` });
  chrome(s, 2, "01 — ОТКУДА ОН");
  title(s, "Из Ирландии — в европейские финансы", { w: 7.7 });
  stage(s, "harp", { x: 8.5, y: 1.27, s: 4.05, rot: [10, -24, -4], px: 720,
    caption: ["02", "Ирландское происхождение"], capX: 8.55, capY: 5.55, cw: 3.8 });
  const facts = [
    ["РОДИНА", "Баллиронан", "приход Баллихейг, графство Керри"],
    ["ДАТА", "около 1687 года", "вероятная оценка; точный год неизвестен"],
    ["СЕМЬЯ", "Второй сын", "из католической землевладельческой семьи"],
    ["ПОДДАНСТВО", "Французское · 1708", "карьера быстро стала международной"],
  ];
  facts.forEach(([l, v, d], i) => {
    const x = L + (i % 2) * 3.34, y = 2.27 + Math.floor(i / 2) * 1.23, w = 3.18, h = 1.05, ag = 1 + Math.floor(i / 2);
    card(s, x, y, w, h, { ag });
    label(s, l, x + 0.22, y + 0.13, w - 0.4, GOLD, ag);
    s.text(v, { x: x + 0.22, y: y + 0.37, w: w - 0.4, h: 0.31, font: "head", size: 16, color: WHITE, ag });
    s.text(d, { x: x + 0.22, y: y + 0.72, w: w - 0.4, h: 0.22, size: 9.5, color: MUTED, ag });
  });
  fact(s, L, 5.62, 6.54, 1.05, [run("Важная оговорка: год рождения и часть ранней биографии восстановлены по косвенным данным — "), run("это не точная дата из метрики.", { bold: true })], { size: 12.1 });
  slides.push(s);
}

// 03 — route
{
  const s = new Slide({ notes: `Первые известные записи о его работе связаны с переводом денег для британских военнопленных во Франции. К 1711 году Кантильон был в Испании клерком при помощнике генерального казначея британских войск. В 1714-м вернулся в Париж, а в 1715–1716 годах начал собственное банковское дело.\n\nКантильон работал между Парижем и Лондоном, а также бывал в Амстердаме и Мадриде. Такой опыт давал ему не только капитал, но и наблюдения за кредитом, валютой, торговыми маршрутами и движением денег — темами, которые позже вошли в его экономический трактат.` });
  chrome(s, 3, "02 — МАРШРУТ КАРЬЕРЫ");
  title(s, "Его офисом была вся Европа", { w: 7.1 });
  stage(s, "globe", { x: 8.15, y: 0.88, s: 4.55, rot: [12, -10, 0], px: 800, shy: 0.86,
    caption: ["03", "Деловые маршруты между столицами"], capX: 7.75, capY: 5.4, cw: 4.55 });
  const ev = [
    ["1707–10", "Франция", "переводит деньги военнопленным"],
    ["1711", "Испания", "служба при британском казначее"],
    ["1714", "Париж", "возвращается к банковскому делу"],
    ["1715–16", "Свой банк", "открывает банк и принимает дела кузена"],
  ];
  ev.forEach(([yr, place, d], i) => {
    const x = L, y = 2.2 + i * 0.82, w = 6.55, h = 0.68, ag = i + 1;
    card(s, x, y, w, h, { fillT: 14, ag });
    s.text(yr, { x: x + 0.18, y: y + 0.14, w: 1.05, h: 0.32, font: "head", size: 15, color: GOLD, ag });
    s.text(place, { x: x + 1.28, y: y + 0.14, w: 1.5, h: 0.31, size: 11.5, bold: true, color: WHITE, ag });
    s.text(d, { x: x + 2.73, y: y + 0.12, w: 3.55, h: 0.42, size: 10.5, color: MUTED, ag });
  });
  fact(s, L, 5.85, 6.55, 0.85, [run("Его преимущество — сеть: связи в Лондоне, Париже и Амстердаме помогли ему запустить собственный банк.", { bold: true })], { size: 12.5 });
  slides.push(s);
}

// 04 — the banker
{
  const s = new Slide({ notes: `В 1715 году Кантильон открыл банк в Париже; в феврале 1716-го формально принял дела своего родственника, «шевалье Кантильона». Он стал банкиром ирландских торговцев во французских портах и проводил международные платежи. У него были посредники и корреспонденты в Лондоне и Амстердаме.\n\nЕго ремесло — не просто «держать деньги». Банки связывали купцов, государства, военных и рынки через переводные векселя, кредит и валюту. Именно изнутри этой сети он мог наблюдать, как решения о деньгах и ожиданиях влияют на торговлю.` });
  chrome(s, 4, "03 — ЧЕМ ОН ЗАНИМАЛСЯ");
  title(s, "Банкир — посредник между рынками", { w: 8.1 });
  stage(s, "key", { x: 8.58, y: 1.15, s: 3.75, rot: [14, -18, 6], px: 720,
    caption: ["04", "Ключ к международным расчётам"], capX: 8.1, capY: 5.4, cw: 4.2 });
  const nodes = [
    ["ПАРИЖ", "его банк", 0.8], ["ЛОНДОН", "финансовые корреспонденты", 3.25], ["АМСТЕРДАМ", "партнёры и расчёты", 5.7],
  ];
  nodes.forEach(([a, b, x], i) => {
    const ag = i + 1;
    card(s, x, 2.42, 2.2, 1.25, { fillT: 12, ag });
    label(s, a, x + 0.18, 2.65, 1.85, GOLD, ag);
    s.text(b, { x: x + 0.18, y: 2.99, w: 1.82, h: 0.49, font: "head", size: 13, color: WHITE, align: "left", ag });
    if (i < 2) s.line({ x1: x + 2.22, y1: 3.05, x2: x + 2.42, y2: 3.05, color: CYAN, width: 2, ag });
  });
  s.text("переводные векселя  ·  валюты  ·  кредит  ·  торговля", { x: 0.82, y: 4.15, w: 7.05, h: 0.35, size: 11, bold: true, color: MUTED, charSpacing: 1.4, align: "center", ag: 4 });
  fact(s, L, 5.25, 7.2, 1.1, [run("Кантильон видел экономику не из кабинета: он годами переводил деньги через границы и сам кредитовал торговцев.", { bold: true })], { size: 13 });
  slides.push(s);
}

// 05 — Mississippi bubble
{
  const s = new Slide({ notes: `В 1718 году Кантильон познакомился с шотландцем Джоном Ло, создателем французской банковско-акционерной системы. Кантильон оказался среди участников Mississippi Company и вместе с Ло занимался проектом колонии в Луизиане.\n\nЛетом 1719 года он заработал состояние на акциях и опционах. По биографии из Dictionary of Irish Biography, он уехал из Парижа в Лондон с крупным капиталом, вероятно опасаясь краха системы. Он вернулся в Париж в феврале 1720 года, после стремительного взлёта цены, но до обвала в мае. Затем быстро заработал и на акциях South Sea Company. Важно: это биографические факты о спекулянте, а не моральная похвала и не вся теория предпринимателя.` });
  chrome(s, 5, "04 — ПУЗЫРЬ МИССИССИПИ");
  title(s, "Он заработал на пузыре — и вовремя вышел", { w: 7.8, h: 1.1 });
  stage(s, "bubble", { x: 8.35, y: 1.05, s: 4.1, rot: [10, -24, 2], px: 840,
    caption: ["05", "Корабль внутри стеклянного пузыря"], capX: 7.95, capY: 5.45, cw: 4.8 });
  const beats = [
    ["1718", "Входит в круг Джона Ло и становится акционером Mississippi Company."],
    ["ЛЕТО 1719", "Зарабатывает на росте акций и опционов; понимает риск перегрева."],
    ["ФЕВРАЛЬ 1720", "Уезжает из Парижа до майского обвала акций системы Mississippi."],
    ["ЗАТЕМ", "Быстро покупает и продаёт South Sea shares — и получает вторую прибыль."],
  ];
  beats.forEach(([a, b], i) => {
    const y = 2.24 + i * 0.76, ag = i + 1;
    s.rect({ x: L, y: y + 0.04, w: 0.12, h: 0.12, shape: "ellipse", fill: GOLD, ag });
    s.text(a, { x: L + 0.3, y, w: 1.45, h: 0.3, size: 10, bold: true, color: GOLD, charSpacing: 1.3, ag });
    s.text(b, { x: L + 1.68, y: y - 0.02, w: 5.3, h: 0.59, size: 11.5, color: WHITE, ag });
  });
  fact(s, L, 5.75, 7.15, 0.92, [run("Ирония биографии: он анализировал риск на рынке — и сам стал одним из самых удачливых спекулянтов эпохи.", { bold: true })], { size: 12.1 });
  slides.push(s);
}

// 06 — core theory
{
  const s = new Slide({ notes: `Вот ядро вклада Кантильона в теорию предпринимательства. Предприниматель несёт издержки, известные заранее или договорённые по определённой цене, а продаёт товар в будущем по цене, которая пока неизвестна. Его доход поэтому не фиксирован.\n\nУсловный пример Кантильона — торговец покупает товар по цене, которую может посчитать, но не знает, сколько покупателей придёт и по какой цене удастся продать. Он делает ставку на спрос. Не обязательно изобретает новую технологию; его основная черта — действует в условиях неопределённого результата и принимает решения до того, как рынок всё раскрыл.` });
  chrome(s, 6, "05 — ГЛАВНАЯ ИДЕЯ");
  title(s, "Издержки известны. Выручка — нет.", { w: 8.1 });
  stage(s, "barrel", { x: 9.05, y: 1.27, s: 3.2, rot: [8, -26, 0], px: 650,
    caption: ["06", "Товар уже куплен — цена ещё нет"], capX: 8.35, capY: 5.4, cw: 4.1 });
  const x1 = 0.85, x2 = 4.95, y = 2.25, w = 3.65, h = 1.48;
  card(s, x1, y, w, h, { ag: 1 });
  label(s, "СЕЙЧАС · ИЗВЕСТНО", x1 + 0.25, y + 0.22, w - 0.5, CYAN, 1);
  s.text("Покупка товара\nЗарплата\nАренда", { x: x1 + 0.25, y: y + 0.58, w: w - 0.5, h: 0.72, font: "head", size: 17, color: WHITE, lineSpacingMultiple: 1.05, ag: 1 });
  s.text("→", { x: 4.42, y: 2.75, w: 0.42, h: 0.4, font: "head", size: 26, color: GOLD, align: "center", ag: 2 });
  card(s, x2, y, w, h, { line: RED, ag: 2 });
  label(s, "ПОТОМ · НЕОПРЕДЕЛЁННО", x2 + 0.25, y + 0.22, w - 0.5, GOLD, 2);
  s.text("Сколько продаст?\nКакой будет спрос?\nКаков доход?", { x: x2 + 0.25, y: y + 0.58, w: w - 0.5, h: 0.72, font: "head", size: 16, color: WHITE, lineSpacingMultiple: 1.06, ag: 2 });
  fact(s, L, 4.72, 7.75, 1.2, [run("Кантильон определяет предпринимателя не по титулу и не по владению фабрикой, а по "), run("неопределённому доходу.", { bold: true })], { size: 14 });
  slides.push(s);
}

// 07 — broad entrepreneur class
{
  const s = new Slide({ notes: `Кантильон делит общество не просто на богатых и бедных, а на людей с фиксированными доходами и людей с неопределёнными. Жалованье, пенсия и договорная плата — относительно фиксированы, пока платёжеспособен наниматель. Торговец, фермер, ремесленник или независимый мастер рискуют тем, что спрос и цена окажутся иными, чем ожидалось.\n\nОтсюда его категория непривычно широкая: предпринимателем может быть человек без крупного капитала, если его доход не гарантирован заранее. В главе XIII он даже приводит нищих и грабителей как крайние случаи «жизни в неопределённости». Это экономическая классификация источника дохода, не одобрение незаконной деятельности.` });
  chrome(s, 7, "06 — КТО ТАКОЙ ПРЕДПРИНИМАТЕЛЬ");
  title(s, "У Кантильона предприниматель — не только хозяин фабрики", { w: 8.4, h: 1.25, size: 32 });
  stage(s, "dice", { x: 9.15, y: 1.45, s: 3.05, rot: [10, -16, 4], px: 620,
    caption: ["07", "Исход нельзя расписать заранее"], capX: 8.35, capY: 5.4, cw: 4.3 });
  const groups = [
    ["ФИКСИРОВАННЫЙ ДОХОД", "Наёмный работник\nЧиновник\nПенсионер", CYAN],
    ["НЕОПРЕДЕЛЁННЫЙ ДОХОД", "Фермер\nТорговец\nРемесленник / мастер", GOLD],
  ];
  groups.forEach(([head, body, col], i) => {
    const x = L + i * 3.72, y = 2.6, w = 3.48, h = 1.78, ag = i + 1;
    card(s, x, y, w, h, { fillT: 12, ag });
    label(s, head, x + 0.24, y + 0.25, w - 0.48, col, ag);
    s.text(body, { x: x + 0.25, y: y + 0.66, w: w - 0.5, h: 0.96, font: "head", size: 16, color: WHITE, lineSpacingMultiple: 1.12, ag });
  });
  fact(s, L, 5.23, 7.2, 1.05, [run("Даже нищих и грабителей он помещает в эту широкую категорию — из-за неопределённого дохода, а не как похвалу.", { bold: true })], { size: 11.8 });
  slides.push(s);
}

// 08 — comparison with Schumpeter
{
  const s = new Slide({ notes: `Здесь важно не спутать Кантильона с позднейшими теориями. У Кантильона предприниматель прежде всего принимает ценовую неопределённость и старается предугадать спрос. У Шумпетера, спустя почти два столетия, центральная фигура — новатор, который вводит «новые комбинации» и нарушает прежнее равновесие.\n\nИх можно представить как две разные линзы: Кантильон объясняет, кто несёт рыночную неопределённость; Шумпетер — как предприниматель создаёт развитие через инновации. Кантильон дал ранний фундамент, но не сформулировал теорию инноваций XX века.` });
  chrome(s, 8, "07 — НЕ ПУТАТЬ С ПОЗДНИМИ ТЕОРИЯМИ");
  title(s, "Кантильон ≠ Шумпетер", { w: 7.4 });
  stage(s, "scales", { x: 9.95, y: 4.18, s: 2.45, rot: [8, -22, 0], px: 500,
    caption: ["08", "Две разные линзы"], capX: 9.0, capY: 6.48, cw: 4.1 });
  const cols = [
    { x: L, name: "РИЧАРД КАНТИЛЬОН", date: "Essai · 1755", color: GOLD,
      body: ["Доход предпринимателя неопределён", "Он заранее несёт издержки", "Пытается предвидеть спрос и цену"],
      tag: "НЕОПРЕДЕЛЁННЫЙ ДОХОД" },
    { x: 4.9, name: "ЙОЗЕФ ШУМПЕТЕР", date: "Theorie · 1911/12", color: CYAN,
      body: ["Предприниматель — новатор", "Вводит «новые комбинации»", "Меняет структуру экономики"],
      tag: "ИННОВАЦИОННЫЙ СКАЧОК" },
  ];
  cols.forEach((c, i) => {
    const x = c.x, y = 2.05, w = 3.83, ag = i + 1;
    card(s, x, y, w, 2.55, { fillT: 13, ag });
    label(s, c.name, x + 0.22, y + 0.22, w - 0.44, c.color, ag);
    s.text(c.date, { x: x + 0.22, y: y + 0.59, w: w - 0.44, h: 0.27, size: 10.5, color: MUTED, ag });
    c.body.forEach((t, j) => {
      s.rect({ x: x + 0.24, y: y + 1.0 + j * 0.38, w: 0.07, h: 0.07, shape: "ellipse", fill: c.color, ag });
      s.text(t, { x: x + 0.42, y: y + 0.91 + j * 0.38, w: w - 0.62, h: 0.31, size: 11, color: WHITE, ag });
    });
    pill(s, c.tag, x + 0.25, y + 2.05, w - 0.5, ag, c.color);
  });
  fact(s, L, 5.14, 7.95, 1.15, [run("Фундамент — да; готовая теория инновационного предпринимателя — нет. Это различие делает сравнение точнее.", { bold: true })], { size: 12.6 });
  slides.push(s);
}

// 09 — market coordination
{
  const s = new Slide({ notes: `У Кантильона предприниматель ещё и соединяет разные части экономики. Он платит за ресурсы и труд сейчас, выбирает объём производства и надеется найти покупателей позже. Если спрос выше ожидаемого — прибыль; если ниже — убыток. Это побуждает предпринимателей менять объёмы и цены.\n\nТрактат Кантильона — не отдельная брошюра о бизнесменах: он пытался описать устройство всей экономики — землевладельцев, фермеров, ремесленников, торговцев, работников и городских потребителей. Предприниматель в этой картине — связующее звено между производством и рынком.` });
  chrome(s, 9, "08 — КАК РАБОТАЕТ ЭТОТ МЕХАНИЗМ");
  title(s, "Предприниматель сводит производство и спрос", { w: 8.5, size: 32 });
  stage(s, "scales", { x: 9.15, y: 1.6, s: 3.15, rot: [9, -28, 3], px: 640,
    caption: ["09", "Ожидание спроса — главная ставка"], capX: 8.5, capY: 5.45, cw: 4.3 });
  const steps = [
    ["01", "ОЦЕНИТЬ", "Что понадобится\nпокупателям?"],
    ["02", "РЕШИТЬ", "Сколько купить,\nнанять, произвести?"],
    ["03", "ПРОВЕРИТЬ", "Спрос подтвердился\nили подвёл?"],
  ];
  steps.forEach(([n, head, body], i) => {
    const x = L + i * 2.44, y = 2.55, w = 2.26, h = 1.48, ag = i + 1;
    card(s, x, y, w, h, { fillT: 12, ag });
    s.text(n, { x: x + 0.2, y: y + 0.14, w: 0.52, h: 0.35, font: "head", size: 17, color: GOLD, ag });
    label(s, head, x + 0.2, y + 0.55, w - 0.4, GOLD, ag);
    s.text(body, { x: x + 0.2, y: y + 0.86, w: w - 0.4, h: 0.54, size: 12, color: WHITE, lineSpacingMultiple: 1.05, ag });
    if (i < 2) s.text("→", { x: x + 2.28, y: y + 0.52, w: 0.18, h: 0.3, size: 14, color: CYAN, align: "center", ag });
  });
  fact(s, L, 4.82, 7.3, 1.15, [run("Для Кантильона прибыль — не гарантированная «зарплата за управление», а переменный результат рыночного решения.", { bold: true })], { size: 12.4 });
  slides.push(s);
}

// 10 — spatial economics
{
  const s = new Slide({ notes: `Ещё одна причина, почему Кантильон необычен для своего времени: он анализировал расстояние и место. Перевозка стоит денег; одинаковое сырьё может стоить по-разному возле города и далеко от него; тяжёлые товары выгоднее производить ближе к источнику. Рынки и поселения возникают не в пустом пространстве.\n\nПозже пространственную экономику часто связывали с немецким экономистом Иоганном фон Тюненом, но Кантильон рассуждал о географии рынков и транспортных издержках почти столетием раньше. Это показывает ширину его подхода: предприниматель действует не только во времени неопределённости, но и в конкретном месте.` });
  chrome(s, 10, "09 — ЭКОНОМИКА И РАССТОЯНИЕ");
  title(s, "Цена зависит и от расстояния", { w: 7.8 });
  stage(s, "globe", { x: 8.15, y: 0.9, s: 4.5, rot: [8, -12, 0], px: 800,
    caption: ["10", "Место рынка меняет издержки"], capX: 7.85, capY: 5.45, cw: 4.5 });
  const cards = [
    ["ТРАНСПОРТ", "Доставка добавляет стоимость."],
    ["ГЕОГРАФИЯ", "Город притягивает рынок и ремесло."],
    ["ВЫБОР", "Тяжёлое выгоднее делать ближе к источнику."],
  ];
  cards.forEach(([head, body], i) => {
    const x = L, y = 2.2 + i * 0.94, w = 6.6, h = 0.77, ag = i + 1;
    card(s, x, y, w, h, { fillT: 12, ag });
    label(s, head, x + 0.2, y + 0.17, 1.7, GOLD, ag);
    s.text(body, { x: x + 1.8, y: y + 0.16, w: 4.5, h: 0.39, size: 12, color: WHITE, ag });
  });
  fact(s, L, 5.4, 6.65, 0.96, [run("Задолго до современной «пространственной экономики» он включил стоимость расстояния в анализ рынка.", { bold: true })], { size: 12.2 });
  slides.push(s);
}

// 11 — Cantillon effect
{
  const s = new Slide({ notes: `Кантильон рассуждал и о денежном обращении. Новые деньги не попадают сразу ко всем в одинаковом объёме: сначала их получают конкретные люди и организации. Они тратят их, спрос растёт на определённые товары, затем меняются относительные цены и доходы. Те, кто получает деньги позднее, сталкиваются уже с изменившимися ценами.\n\nСегодня этот канал неравномерного воздействия денежной эмиссии называют эффектом Кантильона. Само выражение закрепилось гораздо позже; идея восходит к его анализу денег и цен. Важно не сводить её к лозунгу «печатный станок всегда вызывает инфляцию»: у Кантильона речь о том, кому и по какому пути деньги поступают, и как это меняет структуру цен.` });
  chrome(s, 11, "10 — ДЕНЬГИ НЕ РАСПРОСТРАНЯЮТСЯ РАВНОМЕРНО");
  title(s, "Эффект Кантильона: важен путь денег", { w: 8.2, size: 32 });
  stage(s, "ripple", { x: 8.58, y: 1.25, s: 3.8, rot: [12, -22, -4], px: 760,
    caption: ["11", "Одна монета — разные волны цен"], capX: 8.0, capY: 5.5, cw: 4.6 });
  const items = [
    ["1", "Новые деньги поступают не всем сразу."],
    ["2", "Первые получатели тратят их — спрос сдвигается."],
    ["3", "Меняются относительные цены и распределение доходов."],
    ["4", "Поздние получатели видят уже другую структуру цен."],
  ];
  items.forEach(([n, t], i) => {
    const y = 2.15 + i * 0.7, ag = i + 1;
    s.rect({ x: L, y: y + 0.04, w: 0.36, h: 0.36, shape: "ellipse", fill: i === 0 ? GOLD : CARD, line: GOLD, lineW: 1, ag });
    s.text(n, { x: L, y: y + 0.1, w: 0.36, h: 0.2, size: 10, bold: true, color: i === 0 ? DARK : GOLD, align: "center", ag });
    s.text(t, { x: L + 0.55, y, w: 6.65, h: 0.46, size: 12, color: WHITE, ag });
  });
  fact(s, L, 5.42, 7.1, 0.98, [run("Название появилось позже; сама логика денежного «маршрута» — в трактате Кантильона.", { bold: true })], { size: 12.5 });
  slides.push(s);
}

// 12 — book
{
  const s = new Slide({ notes: `Главный и почти единственный экономический труд Кантильона — «Essai sur la nature du commerce en général», по-русски «Опыт о природе торговли вообще». Его обычно датируют примерно 1728–1730 годами. Кантильон умер до публикации; книга вышла анонимно в 1755 году.\n\nНа титульном листе было написано, что труд переведён с английского и напечатан в Лондоне у Флетчера Джайлза. Историки считают, что это ложный выходной адрес: скорее всего, книгу напечатали в Париже, а первоначально она была написана по-французски. Уильям Стэнли Джевонс в 1881 году назвал её колыбелью политической экономии.` });
  chrome(s, 12, "11 — КНИГА, КОТОРАЯ ПЕРЕЖИЛА АВТОРА");
  title(s, "Одна книга — и почти век забвения", { w: 7.8 });
  stage(s, "quill", { x: 8.5, y: 1.16, s: 3.95, rot: [9, -20, 2], px: 800,
    caption: ["12", "Рукопись → анонимное издание"], capX: 8.0, capY: 5.55, cw: 4.6 });
  const pathline = [
    ["ок. 1728–30", "рукопись завершена"], ["1734", "автор исчезает / умирает"], ["1755", "Essai издан анонимно"], ["1881", "Джевонс возвращает книгу в дискуссию"],
  ];
  const baseY = 2.45;
  s.line({ x1: 1.0, y1: baseY + 0.23, x2: 7.15, y2: baseY + 0.23, color: GOLD, lineT: 30, width: 1.5, ag: 1 });
  pathline.forEach(([yr, t], i) => {
    const x = 0.98 + i * 2.0, ag = i + 1;
    s.rect({ x: x + 0.03, y: baseY + 0.14, w: 0.18, h: 0.18, shape: "ellipse", fill: DARK, line: GOLD, lineW: 1.5, ag });
    s.text(yr, { x: x - 0.28, y: baseY + 0.51, w: 1.55, h: 0.32, font: "head", size: 12, color: GOLD, align: "center", ag });
    s.text(t, { x: x - 0.38, y: baseY + 0.94, w: 1.75, h: 0.7, size: 10.4, color: WHITE, align: "center", ag });
  });
  s.text("ESSAI SUR LA NATURE DU COMMERCE EN GÉNÉRAL", { x: L, y: 4.62, w: 6.65, h: 0.35, font: "head", size: 13, italic: true, color: GOLD2, charSpacing: 0.8, ag: 5 });
  fact(s, L, 5.35, 7.15, 1.02, [run("Лондонский адрес «Fletcher Gyles» на титуле, вероятнее всего, фиктивный: книга, похоже, вышла в Париже.", { bold: true })], { size: 12 });
  slides.push(s);
}

// 13 — death mystery
{
  const s = new Slide({ notes: `Ночь 14 мая 1734 года: лондонский дом Кантильона на Олбемарл-стрит сгорел. Считалось, что он погиб в пожаре, потому что после той ночи его больше не видели. Газетное сообщение того времени описывало ограбление и убийство с последующим поджогом; позднее подозрения пали на повара, которого Кантильон уволил. Подробности дела и версия убийства остаются предметом исторических реконструкций.\n\nЕсть и ещё более кинематографическая версия. В Суринаме появился человек, называвший себя шевалье де Лувиньи; у него нашли документы, связанные с Кантильоном. Биограф Антуан Мёрфи предположил, что Кантильон инсценировал смерть, чтобы исчезнуть от преследования кредиторов. Это гипотеза по косвенным уликам, а не установленный факт.` });
  chrome(s, 13, "12 — ЗАГАДОЧНАЯ СМЕРТЬ");
  title(s, "Пожар, убийство или исчезновение?", { w: 8.4, size: 32 });
  stage(s, "candle", { x: 8.75, y: 1.23, s: 3.4, rot: [8, -16, 0], px: 720,
    caption: ["13", "Свеча и ночь 14 мая 1734 года"], capX: 8.0, capY: 5.52, cw: 4.6 });
  const panes = [
    ["УСТАНОВЛЕНО", "Дом в Лондоне сгорел\n14 мая 1734 года.", CYAN],
    ["ВЕРСИЯ", "Считалось, что Кантильон\nпогиб внутри.", GOLD],
    ["ГИПОТЕЗА МЁРФИ", "Он мог бежать в Суринам\nпод чужим именем.", RED],
  ];
  panes.forEach(([head, body, col], i) => {
    const x = L + i * 2.42, y = 2.45, w = 2.25, h = 1.55, ag = i + 1;
    card(s, x, y, w, h, { line: col, fillT: 12, ag });
    label(s, head, x + 0.18, y + 0.2, w - 0.36, col, ag);
    s.text(body, { x: x + 0.18, y: y + 0.62, w: w - 0.36, h: 0.7, font: "head", size: 13, color: WHITE, lineSpacingMultiple: 1.05, ag });
  });
  fact(s, L, 4.75, 7.15, 1.15, [run("Улика-загадка: в Суринаме нашли человека с документами Кантильона; инсценировка смерти — версия, не доказанный факт.", { bold: true })], { size: 12 });
  slides.push(s);
}

// 14 — conclusion
{
  const s = new Slide({ notes: `Подведём итог. Кантильон был банкиром, международным посредником и наблюдателем за финансовыми пузырями. Его главная теоретическая идея для темы предпринимательства: один заранее несёт или договаривает свои издержки, но не может заранее знать доход. Предприниматель принимает решение под неопределённость и пытается угадать спрос.\n\nОн не создал теорию инноваций Шумпетера и не дал современную модель предпринимательства целиком. Но именно он рано выделил предпринимателя как особую экономическую функцию. А его «Essai» объединил рынок, деньги, цены, население, географию и предпринимательский доход в целую картину экономики.` });
  chrome(s, 14, "13 — ИТОГ ЗА 30 СЕКУНД");
  title(s, "Почему Кантильон — фигура первого ряда", { w: 8.9, size: 31 });
  stage(s, "compass", { x: 9.55, y: 1.55, s: 2.85, rot: [7, -17, 0], px: 580,
    caption: ["14", "Он задал направление теории"], capX: 8.7, capY: 5.55, cw: 4.2 });
  const claims = [
    ["01", "ПЕРВЫЙ ФУНДАМЕНТ", "Предприниматель как отдельная фигура анализа."],
    ["02", "НЕОПРЕДЕЛЁННОСТЬ", "Известные издержки — неизвестная выручка."],
    ["03", "ВЗГЛЯД СИСТЕМНО", "Рынки, деньги, цены, расстояние и люди связаны."],
  ];
  claims.forEach(([n, h, b], i) => {
    const x = L, y = 2.12 + i * 0.9, w = 7.5, ag = i + 1;
    s.text(n, { x, y: y + 0.03, w: 0.5, h: 0.35, font: "head", size: 19, color: GOLD, ag });
    s.text(h, { x: x + 0.66, y, w: 2.15, h: 0.28, size: 10, bold: true, color: GOLD, charSpacing: 1.2, ag });
    s.text(b, { x: x + 2.95, y: y - 0.02, w: 4.4, h: 0.48, font: "head", size: 13, color: WHITE, ag });
  });
  fact(s, L, 5.3, 7.7, 1.05, [run("Не созидательное разрушение — а ранний взгляд на то, кто несёт риск и принимает решение на неизвестном рынке.", { bold: true })], { size: 12.6 });
  slides.push(s);
}

// 15 — sources
{
  const s = new Slide({ notes: `Основные сведения сверены по «Словарю ирландской биографии» Королевской ирландской академии и книге Антуана Мёрфи о Кантильоне. Теоретические формулировки и примеры предпринимателя опираются на текст самого «Essai» в издании Online Library of Liberty; финансовая биография и история Mississippi System — также на Dictionary of Irish Biography.\n\nНа изображении — фрагмент семейного портрета Николя де Ларжильера. Его иногда предположительно связывают с Кантильоном, но это не удостоверенный портрет; атрибуция оспаривается.` });
  chrome(s, 15, "ИСТОЧНИКИ И ОГОВОРКИ");
  title(s, "Источники", { h: 0.8, size: 34 });
  const h = (t) => br(t, { bold: true, color: GOLD, size: 9.5, charSpacing: 1.8, paraSpaceAfter: 3 });
  const b = (t, last) => br(t, { bullet: true, ...(last ? { paraSpaceAfter: 8 } : {}) });
  const left = [
    h("БИОГРАФИЯ"),
    b("C. J. Woods, “Cantillon, Richard”, Dictionary of Irish Biography, Royal Irish Academy (2009)."),
    b("A. E. Murphy, Richard Cantillon: Entrepreneur and Economist (Oxford, 1986)."),
    b("W. S. Jevons, “Richard Cantillon and the Nationality of Political Economy” (1881).", true),
    h("ПЕРВОИСТОЧНИК"),
    b("Richard Cantillon, Essai sur la nature du commerce en général (1755)."),
    b("Henry Higgs, trans., Essay on the Nature of Trade in General; Online Library of Liberty."),
  ];
  const right = [
    h("ЧТО ПРОВЕРИТЬ В ESSAI"),
    b("Part I, ch. XIII — предприниматель и неопределённый доход."),
    b("Parts I–II — рынок, цены, деньги и стоимость расстояния."),
    b("DIB — маршрут карьеры, Mississippi System, пожар 1734 года и версия Суринама."),
    h("ТЕХНОЛОГИЯ"),
    b("3D-экспонаты созданы в Blender; в PowerPoint встроены модели GLB и прозрачные fallback-рендеры."),
  ];
  s.text(left, { x: L, y: 1.92, w: 5.45, h: 4.42, size: 10.1, color: WHITE, paraSpaceAfter: 2.6, ag: 1 });
  s.text(right, { x: 6.47, y: 1.92, w: 3.2, h: 2.25, size: 9.8, color: WHITE, paraSpaceAfter: 2.4, ag: 2 });
  s.rect({ x: 6.56, y: 4.44, w: 2.72, h: 2.0, fill: DARK, fillT: 5, line: GOLD, lineT: 46, lineW: 0.8, shadow: true, ag: 3 });
  s.img(A("largilliere-family.jpg"), { x: 6.62, y: 4.5, w: 2.6, h: 1.9, ag: 3 });
  s.text("Ларжильер, ок. 1710 · возможное сходство спорно", { x: 6.55, y: 6.5, w: 3.3, h: 0.28, size: 8.0, color: MUTED, italic: true, align: "center", ag: 3 });
  stage(s, "bubble", { x: 10.25, y: 4.55, s: 2.05, rot: [6, -18, 0], px: 480, glow: 1.15,
    caption: ["15", "3D-экспонат: Mississippi bubble"], capX: 9.55, capY: 6.48, cw: 3.6 });
  slides.push(s);
}

// ---------- Morph choreography: next exhibit enters from right; prior one exits left ----------
for (let i = 0; i < slides.length; i++) {
  const cur = slides[i].hero, nxt = slides[i + 1] && slides[i + 1].hero;
  if (nxt && (!cur || cur.key !== nxt.key)) {
    slides[i].model(nxt.key, { x: SW + 0.55, y: nxt.y + 0.35, s: nxt.s,
      rot: [nxt.rot[0], nxt.rot[1] + 75, nxt.rot[2]], name: `!!m-${nxt.key}`, ghost: true });
  }
  if (cur && slides[i + 1] && (!nxt || nxt.key !== cur.key)) {
    slides[i + 1].model(cur.key, { x: -cur.s - 0.55, y: cur.y + 0.35, s: cur.s,
      rot: [cur.rot[0], cur.rot[1] - 75, cur.rot[2]], name: `!!m-${cur.key}`, ghost: true });
  }
}

// ---------- 3D GLB objects and transparent raster fallbacks ----------
const MODELS = path.join(__dirname, "models");
function prepareModels() {
  const env = { ...process.env, LD_LIBRARY_PATH: [process.env.BLENDER_LIBS || "/tmp/bstub", process.env.LD_LIBRARY_PATH || ""].join(":"),
    GLB_DIR: path.join(MODELS, "glb") };
  const keys = new Set();
  slides.forEach((s) => s.els.forEach((e) => e.t === "model" && keys.add(e.key)));
  const missing = [...keys].filter((k) => !fs.existsSync(path.join(MODELS, "glb", k + ".glb")));
  if (missing.length) execSync(`python3 ${path.join(MODELS, "make_models.py")} ${missing.join(" ")}`, { stdio: "inherit", env });
  const jobs = [];
  fs.mkdirSync(path.join(MODELS, "rasters"), { recursive: true });
  let n = 0;
  slides.forEach((s) => s.els.forEach((e) => {
    if (e.t !== "model") return;
    e.id = `m${++n}`;
    if (e.ghost) { e.raster = A("clear.png"); return; }
    let px = e.px || Math.round(Math.min(1080, Math.max(220, e.s * 155)));
    if (process.env.FAST) px = Math.round(px / 3);
    const glb = fs.readFileSync(path.join(MODELS, "glb", e.key + ".glb"));
    const hash = crypto.createHash("md5").update(glb).update(JSON.stringify([e.rot, px, 2])).digest("hex").slice(0, 10);
    e.raster = path.join(MODELS, "rasters", `${e.key}-${hash}.png`);
    if (!fs.existsSync(e.raster) && !jobs.some((j) => j.out === e.raster)) jobs.push({ key: e.key, rot: e.rot, px, out: e.raster });
  }));
  if (jobs.length) {
    console.log(`rendering ${jobs.length} 3D fallbacks with Blender…`);
    const jf = path.join(MODELS, "rasters", "_jobs.json");
    fs.writeFileSync(jf, JSON.stringify(jobs));
    execSync(`python3 ${path.join(__dirname, "render.py")} ${jf}`, { stdio: ["ignore", "inherit", "inherit"], env });
    fs.unlinkSync(jf);
  }
  if (!process.env.FAST) {
    const used = new Set(slides.flatMap((s) => s.els.filter((e) => e.t === "model").map((e) => path.basename(e.raster))));
    for (const f of fs.readdirSync(path.join(MODELS, "rasters"))) if (f.endsWith(".png") && !used.has(f)) fs.unlinkSync(path.join(MODELS, "rasters", f));
  }
}

function writeScript() {
  const heads = ["Титул", "Откуда он", "Его офис — вся Европа", "Банкир и посредник", "Пузырь Миссисипи", "Главная идея",
    "Кто такой предприниматель", "Кантильон и Шумпетер", "Как работает механизм", "География рынка", "Эффект Кантильона",
    "Книга и забвение", "Загадочная смерть", "Итог", "Источники"];
  let md = "# Текст выступления к 3D-презентации о Ричарде Кантильоне\n\n" +
    "**Ориентир:** 7–8 минут спокойной речи. Этот же текст вложен в заметки докладчика PowerPoint. " +
    "Исторические версии и спорные атрибуции намеренно обозначены как версии; доходы от спекуляций не выданы за точные документальные балансы.\n";
  slides.forEach((s, i) => { md += `\n## Слайд ${i + 1} — ${heads[i]}\n\n${s.notes.trim()}\n`; });
  fs.writeFileSync(path.join(__dirname, "../../exports/cantillon-presentation-script.md"), md);
}

async function preview() {
  const fontsDir = path.join(__dirname, "node_modules/@fontsource");
  const pages = toHtml(slides, path.join(__dirname, "assets"), fontsDir);
  const outDir = path.join(__dirname, "preview"); fs.mkdirSync(outDir, { recursive: true });
  const chromiumMod = require("@sparticuz/chromium"), chromium = chromiumMod.default || chromiumMod;
  const puppeteer = require("puppeteer-core");
  if (!fs.existsSync("/tmp/al/lib/libnspr4.so")) {
    const zlib = require("zlib"); fs.mkdirSync("/tmp/al", { recursive: true });
    const brf = require.resolve("@sparticuz/chromium").replace(/build\/.*$/, "bin/al2023.tar.br");
    fs.writeFileSync("/tmp/al/al.tar", zlib.brotliDecompressSync(fs.readFileSync(brf)));
    execSync("tar xf al.tar", { cwd: "/tmp/al" });
  }
  process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || "") + ":/tmp/al/lib";
  const browser = await puppeteer.launch({ args: [...chromium.args, "--allow-file-access-from-files"], executablePath: await chromium.executablePath(), headless: true });
  const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080 });
  const only = process.argv.find((a) => a.startsWith("--only=")), want = only ? only.slice(7).split(",").map(Number) : null;
  for (let i = 0; i < pages.length; i++) {
    if (want && !want.includes(i + 1)) continue;
    const hf = path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.html`); fs.writeFileSync(hf, pages[i]);
    await page.goto("file://" + hf, { waitUntil: "networkidle0" }); await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: hf.replace(".html", ".png") }); fs.unlinkSync(hf);
  }
  await browser.close(); console.log("previews ->", outDir);
}

async function main() {
  prepareModels();
  const pptxgen = require("pptxgenjs"), JSZip = require("jszip"), pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; pres.title = "Ричард Кантильон — 3D-презентация"; pres.author = "omgGame";
  pres.subject = "Биография и вклад в теорию предпринимательства"; pres.lang = "ru-RU";
  toPptx(pres, slides);
  const buf = await pres.write({ outputType: "nodebuffer" }), zip = await JSZip.loadAsync(buf);
  await injectModels(zip, slides, path.join(MODELS, "glb")); await injectTiming(zip, slides); await dedupeMedia(zip);
  const out = path.join(__dirname, "../../exports/cantillon-3d-presentation.pptx");
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } }));
  console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB", slides.length, "slides");
  writeScript();
  if (process.argv.includes("--preview")) await preview();
}
main().catch((e) => { console.error(e); process.exit(1); });
