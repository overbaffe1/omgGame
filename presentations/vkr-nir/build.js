// «Выбор темы НИР: актуальность, новизна, значимость» — по ВКР «Интеллектуальная справочная система ПсковГУ на основе RAG и LLM».
// 9 слайдов, светлая тема, анимированные 3D-модели (те же .glb, что в ../vkr-rag/models) + Morph-переходы.
//   node build.js            -> ../../exports/vkr-nir-vybor-temy.pptx (+ текст выступления .md)
//   node build.js --preview  -> также preview/slide-XX.png
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");
const SCH = path.join(__dirname, "..", "schumpeter");
const req = require("module").createRequire(path.join(SCH, "package.json"));
const { Slide, toPptx, toHtml } = require(path.join(SCH, "lib"));
const { injectModels, injectTiming, dedupeMedia } = require(path.join(SCH, "pptx3d"));
const NOTES = require("./notes");

const ASSETS = path.join(__dirname, "..", "vkr-rag", "assets");
const A = (f) => path.join(ASSETS, f);
// light "tech" palette
const BG = "F5F6FA", CARD = "FFFFFF", CARD2 = "EEF0F7", LINE = "DCE0EB";
const ACC = "4F5BEA", ACC2 = "4652D6", ACCT = "EEF0FF", OK = "059669", OKT = "E7F6EF", WARN = "D97706", WARNT = "FFF5E6",
  BAD = "DC2626", BADT = "FDEEEE";
const INK = "141A2E", MUTED = "5A6378", DIM = "8A93A8";
const L = 0.7, R = 12.633, CW = R - L, SW = 13.333;
const slides = [];
const N = NOTES.length;
const run = (text, o = {}) => ({ text, options: o });
const br = (text, o = {}) => ({ text, options: { ...o, breakLine: true } });

function chrome(s, idx, kicker) {
  s.bg = BG;
  s.rect({ x: 0, y: 0, w: SW, h: 0.08, fill: ACC, name: "!!topbar" });
  if (kicker) {
    s.rect({ x: L, y: 0.52, w: 0.09, h: 0.28, fill: ACC, name: "!!kbar" });
    s.text(kicker, { x: L + 0.2, y: 0.47, w: 10, h: 0.38, size: 11, bold: true, color: ACC2, charSpacing: 2.5, name: "!!kicker" });
  }
  s.line({ x1: L, y1: 7.0, x2: R, y2: 7.0, color: LINE, width: 0.75, name: "!!fline" });
  s.text("Мейер-Шишнёв В. А.  ·  Выбор темы НИР  ·  ПсковГУ, 2026", { x: L, y: 7.08, w: 6, h: 0.28, size: 9, color: DIM, name: "!!footer" });
  s.text(`${idx} / ${N}`, { x: R - 1.2, y: 7.08, w: 1.2, h: 0.28, size: 9, color: DIM, align: "right", name: "!!page" });
}
const title = (s, t, o = {}) => s.text(t, { x: L, y: o.y ?? 0.95, w: o.w ?? CW, h: o.h ?? 0.8, size: o.size ?? 32, bold: true, color: INK, name: "!!title" });
const card = (s, x, y, w, h, o = {}) => s.rect({ x, y, w, h, fill: o.fill || CARD, line: o.line || LINE, lineW: o.lineW || 0.75, radius: o.radius ?? 0.1, ag: o.ag });  // no card shadows on the light theme
const label = (s, t, x, y, w, col, ag, size = 10.5) => s.text(t, { x, y, w, h: 0.3, size, bold: true, color: col || ACC2, charSpacing: 2, ag });
function shot(s, file, x, y, w, h, o = {}) {
  s.rect({ x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: o.frame || "CBD1DF", radius: 0.08, shadow: true, ag: o.ag });
  s.img(A(file), { x, y, w, h, ag: o.ag });
  if (o.cap) s.text(o.cap, { x, y: y + h + 0.1, w, h: 0.3, size: 9.5, color: MUTED, align: o.capAlign || "left", ag: o.ag });
}
const chip = (s, t, x, y, w, o = {}) => {
  const h = o.h || 0.36;
  s.rect({ x, y, w, h, fill: o.fill || CARD, line: o.line || LINE, radius: h / 2, ag: o.ag });
  s.text(t, { x, y, w, h, size: o.size || 10.5, color: o.color || INK, bold: o.bold, align: "center", valign: "middle", ag: o.ag });
};
// 3D model on a soft light pool with a contact shadow
function stage(s, key, o) {
  const { x, y, s: sz, rot } = o;
  const cx = x + sz / 2, cy = y + sz / 2 + (o.dy || 0);
  const g = sz * (o.glow || 1.25);
  s.img(A("halo.png"), { x: cx - g / 2, y: cy - g / 2, w: g, h: g, name: "!!halo" });
  const shw = sz * (o.shw || 0.7), shy = y + sz * (o.shy || 0.86);
  s.img(A("shadow.png"), { x: cx - shw / 2, y: shy - shw / 8, w: shw, h: shw / 4, name: "!!shadow" });
  s.model(key, { x, y, s: sz, rot, name: `!!m-${key}`, px: o.px || Math.round(sz * 190) });
  s.hero = { key, x, y, s: sz, rot };
  if (o.cap) s.text(o.cap, { x: o.capX ?? x, y: o.capY ?? y + sz * 0.95, w: o.capW ?? sz, h: 0.32, size: 9.5, color: MUTED, align: o.capAlign || "center", italic: true, ag: 9 });
}

const TOPIC = "Разработка интеллектуальной информационно-справочной системы ПсковГУ на основе RAG-архитектуры и больших языковых моделей";

// ===================================================================== 1. TITLE
{
  const s = new Slide({ notes: NOTES[0] });
  chrome(s, 1, "НАУЧНО-ИССЛЕДОВАТЕЛЬСКАЯ РАБОТА");
  s.text("Выбор темы НИР", { x: L, y: 1.15, w: 7.6, h: 1.0, size: 44, bold: true, color: INK, name: "!!title" });
  s.text("актуальность · новизна · значимость", { x: L, y: 2.12, w: 7.6, h: 0.5, size: 20, color: ACC, ag: 1 });
  card(s, L, 2.9, 7.75, 1.55, { fill: ACCT, line: ACC, ag: 1 });
  label(s, "ТЕМА РАБОТЫ (ВКР)", L + 0.3, 3.0, 5, ACC2, 1);
  s.text(`«${TOPIC}»`, { x: L + 0.3, y: 3.3, w: 7.2, h: 1.1, size: 15, bold: true, color: INK, lineSpacingMultiple: 1.04, ag: 1 });
  s.text([br("Мейер-Шишнёв Владислав Алексеевич", { bold: true, color: INK }),
    br("09.03.03 Прикладная информатика · ПсковГУ, 2026", { color: MUTED }),
    run("Руководитель: ст. преп. А. А. Гаврилов", { color: MUTED })], { x: L, y: 4.68, w: 6.5, h: 0.9, size: 12, lineSpacingMultiple: 1.15, ag: 2 });
  label(s, "ПЛАН", L, 5.82, 2, MUTED, 3, 9.5);
  const plan = ["Тема", "Актуальность", "Новизна", "Значимость", "Объект и предмет", "Цель", "Задачи", "Источники", "Аналоги"];
  let x = L, row = 0;
  plan.forEach((t) => {
    const w = 0.34 + t.length * 0.088;
    if (x + w > L + 7.8) { x = L; row++; }
    chip(s, t, x, 6.12 + row * 0.43, w, { ag: 3, size: 10, h: 0.34 });
    x += w + 0.1;
  });
  stage(s, "chat", { x: 8.75, y: 1.05, s: 4.0, rot: [8, -22, 0], shy: 0.8, glow: 1.2 });
  slides.push(s);
}

// ===================================================================== 2. TOPIC
{
  const s = new Slide({ notes: NOTES[1] });
  chrome(s, 2, "ТЕМА РАБОТЫ");
  title(s, "Тема: что, где и как", { w: 8 });
  const parts = [
    ["ЧТО", "Интеллектуальная информационно-справочная система", "Отвечает на вопросы обычным языком и даёт ссылки на документы-источники", ACC],
    ["ГДЕ", "ПсковГУ", "Реальные данные: сайты вуза, документы, приказы, расписание — 543 963 файла", OK],
    ["КАК", "RAG + большие языковые модели", "Сначала поиск по своей базе знаний, затем генерация ответа моделью — локально", WARN],
  ];
  const pw = 2.72;
  parts.forEach(([h, t, d, c], i) => {
    const x = L + i * (pw + 0.18), y = 1.9, ag = 1 + i;
    card(s, x, y, pw, 2.55, { ag });
    s.rect({ x, y, w: pw, h: 0.08, fill: c, ag });
    s.text(h, { x: x + 0.25, y: y + 0.2, w: pw - 0.4, h: 0.45, size: 20, bold: true, color: c, charSpacing: 2, ag });
    s.text(t, { x: x + 0.25, y: y + 0.68, w: pw - 0.45, h: 0.8, size: 13.5, bold: true, color: INK, lineSpacingMultiple: 1.02, ag });
    s.text(d, { x: x + 0.25, y: y + 1.48, w: pw - 0.45, h: 1.0, size: 10.5, color: MUTED, lineSpacingMultiple: 1.05, ag });
  });
  const ww = 3 * pw + 0.36;
  card(s, L, 4.65, ww, 2.15, { fill: CARD2, line: LINE, ag: 4 });
  label(s, "ПОЧЕМУ ИМЕННО ЭТА ТЕМА", L + 0.3, 4.75, 5, ACC2, 4);
  [["Реальная проблема", "найти нужное на сайте вуза сложно — это знает каждый студент"],
    ["Передний край ИИ", "большие языковые модели и RAG — самое активное направление сейчас"],
    ["Ощутимый результат", "не учебный пример, а работающая система, которую можно внедрить"]].forEach(([h, d], i) => {
    const w = (ww - 0.6 - 0.3) / 3, x = L + 0.3 + i * (w + 0.15);
    s.text([br(h, { bold: true, color: INK, size: 12.5 }), run(d, { color: MUTED, size: 10.5 })], { x, y: 5.1, w, h: 1.6, valign: "top", lineSpacingMultiple: 1.05, ag: 4 });
  });
  stage(s, "people", { x: 9.35, y: 1.75, s: 3.45, rot: [18, -12, 0], shy: 0.8, glow: 1.15,
    cap: "Пользователи: студенты, преподаватели, абитуриенты", capY: 5.35, capX: 9.2, capW: 3.5 });
  slides.push(s);
}

// ===================================================================== 3. RELEVANCE
{
  const s = new Slide({ notes: NOTES[2] });
  chrome(s, 3, "АКТУАЛЬНОСТЬ");
  title(s, "Информация есть — но её не найти", { w: 8.2 });
  const lw = 6.35;
  [["до 60\u00A0%", "обращений в справочные службы вузов — о том, что уже опубликовано на сайте", WARN],
    ["слова ≠ смысл", "Поиск по ключевым словам: «когда начинается сессия» не находит «график промежуточной аттестации»", ACC],
    ["облако нельзя", "Облачные LLM: документы уходят на внешние серверы (152-ФЗ), а без локальных данных модель «галлюцинирует»", BAD],
  ].forEach(([h, d, c], i) => {
    const y = 1.9 + i * 1.12, ag = 1 + i;
    card(s, L, y, lw, 1.0, { ag });
    s.rect({ x: L, y: y + 0.16, w: 0.07, h: 0.68, fill: c, ag });
    s.text(h, { x: L + 0.3, y: y + 0.08, w: lw - 0.5, h: 0.38, size: 17, bold: true, color: c, ag });
    s.text(d, { x: L + 0.3, y: y + 0.46, w: lw - 0.45, h: 0.5, size: 11.5, color: INK, lineSpacingMultiple: 1.02, ag });
  });
  card(s, L, 5.3, lw, 1.5, { fill: WARNT, line: WARN, ag: 4 });
  label(s, "ПРОТИВОРЕЧИЕ", L + 0.3, 5.4, 4, WARN, 4);
  s.text([run("Нужен быстрый доступ к актуальной информации вуза ", { color: INK }), run("↔", { color: WARN, bold: true }),
    run(" нет инструментов смыслового поиска по русскоязычным документам, работающих в локальном контуре", { color: INK })],
  { x: L + 0.3, y: 5.72, w: lw - 0.55, h: 1.0, size: 12.5, lineSpacingMultiple: 1.05, ag: 4 });
  const x2 = 7.35, w2 = R - x2;
  stage(s, "search", { x: 8.15, y: 1.3, s: 3.55, rot: [35, -15, 0], shy: 0.78, glow: 1.15 });
  card(s, x2, 4.75, w2, 2.05, { fill: ACCT, line: ACC, ag: 5 });
  label(s, "ВЫХОД — RAG (Lewis et al., 2020)", x2 + 0.3, 4.86, w2 - 0.5, ACC2, 5);
  s.text("Найти фрагменты в своей базе знаний → сгенерировать ответ по ним. А в российских вузах полноценных локальных RAG-систем нет",
    { x: x2 + 0.3, y: 5.15, w: w2 - 0.55, h: 0.7, size: 11.5, color: INK, lineSpacingMultiple: 1.03, ag: 5 });
  [["актуально", "без переобучения"], ["достоверно", "с источниками"], ["конфиденциально", "локально"]].forEach(([a, b], i) => {
    const bw = (w2 - 0.6 - 0.2) / 3, x = x2 + 0.3 + i * (bw + 0.1);
    s.rect({ x, y: 5.95, w: bw, h: 0.7, fill: CARD, line: LINE, radius: 0.08, ag: 5 });
    s.text([br(a, { bold: true, color: OK, size: a.length > 12 ? 9.5 : 10.5 }), run(b, { color: MUTED, size: 9.5 })], { x, y: 5.95, w: bw, h: 0.7, align: "center", valign: "middle", ag: 5 });
  });
  slides.push(s);
}

// ===================================================================== 4. NOVELTY & SIGNIFICANCE
{
  const s = new Slide({ notes: NOTES[3] });
  chrome(s, 4, "НОВИЗНА И ЗНАЧИМОСТЬ");
  title(s, "Что нового и кому это нужно", { w: 9 });
  const cw = 4.6, top = 1.9, hh = 4.9;
  const col = (x, head, c, tint, lead, items, ag) => {
    card(s, x, top, cw, hh, { ag });
    s.rect({ x, y: top, w: cw, h: 0.08, fill: c, ag });
    label(s, head, x + 0.3, top + 0.2, cw - 0.5, c, ag, 11);
    s.rect({ x: x + 0.3, y: top + 0.58, w: cw - 0.6, h: 1.05, fill: tint, radius: 0.08, ag });
    s.text(lead, { x: x + 0.45, y: top + 0.58, w: cw - 0.85, h: 1.05, size: 11.5, bold: true, color: INK, valign: "middle", lineSpacingMultiple: 1.04, ag });
    items.forEach(([h, d], i) => {
      const y = top + 1.83 + i * 0.75;
      s.rect({ x: x + 0.32, y: y + 0.09, w: 0.12, h: 0.12, shape: "ellipse", fill: c, ag });
      s.text([br(h, { bold: true, color: INK, size: 11.5 }), run(d, { color: MUTED, size: 10 })], { x: x + 0.58, y, w: cw - 0.85, h: 0.72, lineSpacingMultiple: 1.0, ag });
    });
  };
  col(L, "НОВИЗНА", ACC, ACCT, "Полноценной локальной RAG-системы по всей внутренней документации российского вуза при обзоре найти не удалось", [
    ["Каскад извлечения PDF", "4 библиотеки + OCR Tesseract для сканов"],
    ["Таблицы с объединёнными ячейками", "собственный парсер rowspan"],
    ["Правка ответа без переиндексации", "замена текста фрагмента в админ-панели"],
    ["Живое расписание под роль", "студент — по группе, преподаватель — по ФИО"]], 1);
  col(L + cw + 0.2, "ПРАКТИЧЕСКАЯ ЗНАЧИМОСТЬ", OK, OKT, "Работающая система в инфраструктуре ПсковГУ — от сбора данных до диалога с пользователем", [
    ["Конфиденциальность", "всё локально на RTX 3060 — соответствие 152-ФЗ"],
    ["Меньше нагрузки на службы", "типовые вопросы — без участия сотрудников"],
    ["Тиражируемость", "перенос в другие вузы и организации"],
    ["Задел на будущее", "основа для внедрения и магистерской работы"]], 2);
  stage(s, "bulb", { x: 10.25, y: 1.65, s: 2.45, rot: [6, -18, 0], shy: 0.92, glow: 1.2 });
  card(s, 10.3, 4.5, R - 10.3, 2.3, { fill: CARD2, ag: 3 });
  label(s, "НАУЧНЫЙ ВКЛАД", 10.45, 4.6, R - 10.6, ACC2, 3, 10);
  s.text("Проверена применимость RAG к русскоязычным документам вуза: сканы, таблицы, нормативка, живые данные",
    { x: 10.45, y: 4.92, w: R - 10.6, h: 1.8, size: 10.5, color: INK, lineSpacingMultiple: 1.05, ag: 3 });
  slides.push(s);
}

// ===================================================================== 5. OBJECT & SUBJECT
{
  const s = new Slide({ notes: NOTES[4] });
  chrome(s, 5, "ОБЪЕКТ И ПРЕДМЕТ ИССЛЕДОВАНИЯ");
  title(s, "Объект и предмет исследования", { w: 9 });
  // nested circles: subject is a part of the object
  const ox = L + 0.1, oy = 1.85, od = 4.95;
  s.rect({ x: ox, y: oy, w: od, h: od, shape: "ellipse", fill: ACCT, line: ACC, lineW: 1.5, ag: 1 });
  s.text([br("ОБЪЕКТ", { bold: true, color: ACC2, size: 12, charSpacing: 2 }), run("справочные системы вузов на основе NLP", { color: INK, size: 11 })],
    { x: ox + 0.9, y: oy + 0.42, w: od - 1.8, h: 0.95, align: "center", lineSpacingMultiple: 1.05, ag: 1 });
  const sd = 2.85, sx = ox + (od - sd) / 2, sy = oy + od - sd - 0.42;
  s.rect({ x: sx, y: sy, w: sd, h: sd, shape: "ellipse", fill: CARD, line: ACC2, lineW: 2, ag: 2 });
  s.text([br("ПРЕДМЕТ", { bold: true, color: ACC2, size: 12, charSpacing: 2 }), run("поиск, извлечение текста и генерация ответа в RAG", { color: INK, size: 10.5 })],
    { x: sx + 0.3, y: sy + 0.5, w: sd - 0.6, h: 1.8, align: "center", valign: "middle", lineSpacingMultiple: 1.05, ag: 2 });
  const x2 = 6.15, w2 = R - x2;
  [["ОБЪЕКТ — что изучаю", "Информационно-справочные системы образовательных организаций на основе технологий обработки естественного языка", 1],
    ["ПРЕДМЕТ — какую сторону объекта", "Методы и алгоритмы семантического поиска, извлечения текста и генерации ответов в RAG-системах для русскоязычных корпоративных баз знаний вузов", 2]].forEach(([h, d, ag], i) => {
    const y = 1.85 + i * 1.42;
    card(s, x2, y, w2, 1.3, { ag });
    label(s, h, x2 + 0.25, y + 0.1, w2 - 0.4, ACC2, ag, 10.5);
    s.text(d, { x: x2 + 0.25, y: y + 0.4, w: w2 - 0.45, h: 0.85, size: 11.5, color: INK, lineSpacingMultiple: 1.04, ag });
  });
  label(s, "МЕТОДЫ ИССЛЕДОВАНИЯ", x2, 4.8, 4, ACC2, 3, 10);
  const meth = [["анализ литературы", "анализ аналогов"], ["сбор веб-данных", "извлечение текста, OCR"], ["эмбеддинги", "семантический поиск"], ["проектирование БД", "эксперимент"]];
  meth.forEach((r, ri) => r.forEach((t, ci) => chip(s, t, x2 + ci * 2.05, 5.15 + ri * 0.42, 1.95, { ag: 3, size: 9.5, h: 0.34 })));
  stage(s, "gears", { x: 10.55, y: 4.55, s: 2.15, rot: [10, -25, 0], shy: 0.9, glow: 1.1 });
  slides.push(s);
}

// ===================================================================== 6. GOAL
{
  const s = new Slide({ notes: NOTES[5] });
  chrome(s, 6, "ЦЕЛЬ РАБОТЫ");
  title(s, "Цель работы", { w: 8 });
  const gw = 8.3;
  card(s, L, 1.85, gw, 1.75, { fill: ACCT, line: ACC, ag: 1 });
  s.rect({ x: L, y: 2.05, w: 0.08, h: 1.35, fill: ACC, ag: 1 });
  s.text([run("Спроектировать, реализовать и экспериментально проверить ", { bold: true, color: ACC2 }),
    run("локальную информационно-справочную систему ПсковГУ на основе RAG, которая отвечает на вопросы на естественном языке с указанием источников", { color: INK })],
  { x: L + 0.35, y: 1.9, w: gw - 0.6, h: 1.65, size: 15, valign: "middle", lineSpacingMultiple: 1.06, ag: 1 });
  // three verbs
  [["Спроектировать", "архитектура: offline-пайплайн + online-сервис"], ["Реализовать", "сбор данных, индекс, чат, виджет, админ-панель"], ["Проверить", "эксперимент на 30 вопросах в 6 категориях"]].forEach(([h, d], i) => {
    const w = (gw - 2 * 0.35) / 3, x = L + i * (w + 0.35), y = 3.85, ag = 2;
    card(s, x, y, w, 1.05, { ag });
    s.text([br(`${i + 1}. ${h}`, { bold: true, color: INK, size: 13 }), run(d, { color: MUTED, size: 10 })], { x: x + 0.2, y, w: w - 0.35, h: 1.05, valign: "middle", lineSpacingMultiple: 1.04, ag });
    if (i < 2) s.text("›", { x: x + w, y: y + 0.2, w: 0.35, h: 0.6, size: 24, bold: true, color: ACC, align: "center", ag });
  });
  label(s, "КРИТЕРИИ ДОСТИЖЕНИЯ ЦЕЛИ", L, 5.15, 6, OK, 3);
  [["Ответ + источники", "ссылки на страницы и документы"], ["Локальный контур", "RTX 3060, 12 ГБ · 152-ФЗ"], ["Поиск ≤ 3–5 с", "семантический по базе знаний"], ["Ответ ≤ 60 с", "полное время генерации"]].forEach(([h, d], i) => {
    const w = (gw - 3 * 0.15) / 4, x = L + i * (w + 0.15);
    s.rect({ x, y: 5.5, w, h: 1.25, fill: OKT, line: OK, radius: 0.1, ag: 3 });
    s.text([br(h, { bold: true, color: OK, size: 12 }), run(d, { color: INK, size: 9.5 })], { x: x + 0.12, y: 5.5, w: w - 0.24, h: 1.25, align: "center", valign: "middle", lineSpacingMultiple: 1.05, ag: 3 });
  });
  stage(s, "target", { x: 9.35, y: 1.55, s: 3.4, rot: [6, -28, 0], shy: 0.86, glow: 1.15 });
  s.text("Цель сформулирована так, чтобы её достижение можно было проверить", { x: 9.4, y: 5.4, w: 3.2, h: 0.75, size: 10, italic: true, color: MUTED, align: "center", ag: 4 });
  slides.push(s);
}

// ===================================================================== 7. TASKS
{
  const s = new Slide({ notes: NOTES[6] });
  chrome(s, 7, "ПЕРЕЧЕНЬ ЗАДАЧ");
  title(s, "Семь задач — путь к цели", { w: 8.5 });
  const stages = [
    ["ТЕОРИЯ", ACC, [["Изучить LLM и RAG-архитектуру", "обзор подходов, глава 1"], ["Проанализировать аналоги, выбрать стек", "сравнение 4 типов решений"]]],
    ["ПРОЕКТИРОВАНИЕ", "7C3AED", [["Спроектировать архитектуру", "offline-пайплайн + online-сервис, схема БД"]]],
    ["РЕАЛИЗАЦИЯ", WARN, [["Собрать и обработать данные сайта", "543 963 файла → ≈ 50 000 фрагментов"], ["Построить индекс FAISS (bge-m3)", "векторная база знаний"], ["Сделать API, чат и админ-панель", "виджет на сайте, правка ответов"]]],
    ["ПРОВЕРКА", OK, [["Провести эксперимент", "30 вопросов, 6 категорий → 8,47 / 10"]]],
  ];
  const sw = 2.18, gap = 0.14, y0 = 1.9;
  let n = 0;
  stages.forEach(([h, c, tasks], si) => {
    const x = L + si * (sw + gap), ag = 1 + si;
    s.rect({ x, y: y0, w: sw, h: 0.42, fill: c, radius: 0.08, ag });
    s.text(h, { x, y: y0, w: sw, h: 0.42, size: 10.5, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 1.5, ag });
    tasks.forEach(([t, r], ti) => {
      const y = y0 + 0.6 + ti * 1.45;
      n++;
      card(s, x, y, sw, 1.32, { ag });
      s.rect({ x: x + 0.14, y: y + 0.14, w: 0.36, h: 0.36, shape: "ellipse", fill: c, ag });
      s.text(String(n), { x: x + 0.14, y: y + 0.14, w: 0.36, h: 0.36, size: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", ag });
      s.text(t, { x: x + 0.58, y: y + 0.08, w: sw - 0.68, h: 0.72, size: 11, bold: true, color: INK, valign: "middle", lineSpacingMultiple: 1.0, ag });
      s.text([run("→ ", { color: c, bold: true }), run(r, { color: MUTED })], { x: x + 0.14, y: y + 0.82, w: sw - 0.24, h: 0.46, size: 9.5, lineSpacingMultiple: 1.0, ag });
    });
  });
  const ax = L + 4 * (sw + gap) - gap;
  s.text("›", { x: ax, y: 3.3, w: 0.5, h: 0.8, size: 34, bold: true, color: ACC, align: "center", ag: 5 });
  stage(s, "rocket", { x: 10.35, y: 1.35, s: 2.6, rot: [6, -15, 0], shy: 0.95, glow: 1.2 });
  const gx = 10.25, gw = R - gx;
  card(s, gx, 4.55, gw, 2.25, { fill: ACCT, line: ACC, ag: 5 });
  label(s, "ЦЕЛЬ", gx + 0.2, 4.65, gw - 0.3, ACC2, 5);
  s.text("Работающая локальная справочная система ПсковГУ с проверенным качеством ответов", { x: gx + 0.2, y: 4.95, w: gw - 0.35, h: 1.8, size: 11.5, color: INK, lineSpacingMultiple: 1.05, ag: 5 });
  slides.push(s);
}

// ===================================================================== 8. SOURCES
{
  const s = new Slide({ notes: NOTES[7] });
  chrome(s, 8, "ИСТОЧНИКИ ИНФОРМАЦИИ");
  title(s, "33 источника: на чём стоит работа", { w: 9 });
  const groups = [
    [9, "RAG и семантический поиск", ACC, "Lewis 2020 (RAG) · Gao 2024 (обзор RAG) · Karpukhin 2020 (DPR) · Barnett 2024 (7 точек отказа RAG) · Chen 2024 (BGE-M3) · Johnson 2021 (FAISS) · Manning 2008"],
    [5, "LLM и галлюцинации", "7C3AED", "Vaswani 2017 (Transformer) · Zhao 2023 (обзор LLM) · Huang 2023, Ji 2023 (галлюцинации) · Bender 2021"],
    [6, "Модели и аналоги", BAD, "GPT-4, Qwen2.5 (техотчёты) · GigaChat · Ollama · LangChain · Powabase"],
    [10, "Инструменты реализации", WARN, "Python · FastAPI · Flask · SQLite · FAISS · Trafilatura (ACL 2021) · Tesseract (ICDAR 2007) · BeautifulSoup · Tampermonkey · Mermaid"],
    [3, "Базы данных и нормативка", OK, "Дейт «Введение в системы БД» · Коннолли, Бегг «Базы данных» · Положение о ВКР ПсковГУ"],
  ];
  const gw = 8.85;
  groups.forEach(([k, h, c, d], i) => {
    const y = 1.85 + i * 0.84, ag = 1 + Math.floor(i / 2);
    card(s, L, y, gw, 0.74, { ag });
    s.text(String(k), { x: L + 0.1, y, w: 0.75, h: 0.74, size: 24, bold: true, color: c, align: "center", valign: "middle", ag });
    s.text([br(h, { bold: true, color: INK, size: 12 }), run(d, { color: MUTED, size: 9.5 })], { x: L + 0.9, y, w: gw - 1.05, h: 0.74, valign: "middle", lineSpacingMultiple: 1.0, ag });
  });
  // type breakdown bar
  const types = [[17, "научные статьи и техотчёты (2017–2024)", ACC], [3, "книги", OK], [12, "документация", WARN], [1, "норматив", MUTED]];
  const by = 6.18, bwid = gw;
  let x = L;
  label(s, "ПО ТИПУ", L, by - 0.02, 2, MUTED, 4, 9.5);
  types.forEach(([k, t, c]) => {
    const w = bwid * k / 33;
    s.rect({ x, y: by + 0.3, w: w - 0.03, h: 0.12, fill: c, ag: 4 });
    s.text([run(String(k) + " ", { bold: true, color: c }), run(t, { color: MUTED })], { x, y: by + 0.42, w: Math.max(w, 1.2), h: 0.3, size: 9, ag: 4 });
    x += w;
  });
  stage(s, "books", { x: 9.75, y: 1.55, s: 3.0, rot: [30, -12, 0], shy: 0.8, glow: 1.15 });
  card(s, 9.85, 4.6, R - 9.85, 2.2, { fill: ACCT, line: ACC, ag: 5 });
  label(s, "КАК ИСКАЛ", 10.0, 4.7, R - 10.1, ACC2, 5, 10);
  s.text("arXiv и труды конференций (NeurIPS, EMNLP, ACL), техотчёты разработчиков моделей, официальная документация, сайты аналогов",
    { x: 10.0, y: 5.0, w: R - 10.15, h: 1.75, size: 10.5, color: INK, lineSpacingMultiple: 1.05, ag: 5 });
  slides.push(s);
}

// ===================================================================== 9. EXISTING SOLUTIONS
{
  const s = new Slide({ notes: NOTES[8] });
  chrome(s, 9, "ЧТО УЖЕ РЕАЛИЗОВАНО ДРУГИМИ");
  title(s, "Аналоги: ни один не закрывает задачу", { w: 10 });
  const G = 1, M = 0, B = -1;
  const cols = ["Чат-боты на правилах", "Обёртки над облачным LLM", "RAG-фреймворки (LangChain, LlamaIndex)", "Коммерческие SaaS (Powabase)", "Моя система"];
  const rows = [
    ["Конфиденциальность", [["полная", G], ["данные уходят", B], ["зависит от модели", M], ["нет", B], ["всё локально", G]]],
    ["Сложные вопросы", [["низкое качество", B], ["высокое", G], ["среднее", M], ["высокое", G], ["высокое", G]]],
    ["Темы", [["только заготовки", B], ["без данных вуза", B], ["из базы знаний", G], ["из базы знаний", G], ["вся база ПсковГУ", G]]],
    ["Ссылки на источники", [["нет", B], ["нет", B], ["да", G], ["да", G], ["прямые ссылки", G]]],
    ["Сканированные PDF", [["нет", B], ["нет", B], ["сторонний OCR", M], ["да", G], ["Tesseract + каскад", G]]],
    ["Таблицы с rowspan", [["нет", B], ["нет", B], ["нет", B], ["частично", M], ["свой парсер", G]]],
    ["Исправление ответов", [["правка правил", M], ["нет", B], ["переиндексация", M], ["через UI", G], ["без переиндексации", G]]],
    ["Эксплуатация", [["бесплатно", G], ["оплата API", M], ["open source", G], ["подписка в валюте", B], ["бесплатно", G]]],
  ];
  const x0 = L, lw = 2.05, cw = (CW - lw) / 5, y0 = 1.8, hh = 0.62, rh = 0.475;
  cols.forEach((c, i) => {
    const x = x0 + lw + i * cw, me = i === 4;
    s.rect({ x: x + 0.03, y: y0, w: cw - 0.06, h: hh, fill: me ? ACC : CARD2, radius: 0.06, ag: me ? 3 : 1 });
    s.text(c, { x: x + 0.08, y: y0, w: cw - 0.16, h: hh, size: 10, bold: true, color: me ? "FFFFFF" : INK, align: "center", valign: "middle", lineSpacingMultiple: 0.95, ag: me ? 3 : 1 });
  });
  const tint = { [G]: [OKT, OK], [M]: [WARNT, WARN], [B]: [BADT, BAD] };
  rows.forEach(([name, cells], ri) => {
    const y = y0 + hh + 0.06 + ri * rh;
    s.text(name, { x: x0, y, w: lw - 0.1, h: rh - 0.05, size: 10.5, bold: true, color: INK, valign: "middle", ag: 2 });
    cells.forEach(([t, v], ci) => {
      const x = x0 + lw + ci * cw, me = ci === 4, [f, c] = tint[v];
      s.rect({ x: x + 0.03, y: y + 0.02, w: cw - 0.06, h: rh - 0.06, fill: f, line: me ? ACC : undefined, radius: 0.05, ag: me ? 3 : 2 });
      s.text((v === G ? "✓ " : v === B ? "✗ " : "~ ") + t, { x: x + 0.08, y: y + 0.02, w: cw - 0.16, h: rh - 0.06, size: 9.5, color: c, bold: me, align: "center", valign: "middle", ag: me ? 3 : 2 });
    });
  });
  const yb = y0 + hh + 0.06 + rows.length * rh + 0.12;
  card(s, L, yb, CW, 6.85 - yb, { fill: ACCT, line: ACC, ag: 4 });
  s.text([run("Вывод: ", { bold: true, color: ACC2 }), run("у каждого типа решений есть «красная зона». Локальная RAG-система под русскоязычные документы вуза — свободная ниша, это и обосновывает выбор темы", { color: INK })],
    { x: L + 0.25, y: yb, w: CW - 0.5, h: 6.85 - yb, size: 12, valign: "middle", lineSpacingMultiple: 1.04, ag: 4 });
  slides.push(s);
}

// ---------- Morph choreography: neighbouring models fly in / out of the frame ----------
for (let i = 0; i < slides.length; i++) {
  const cur = slides[i].hero, nxt = slides[i + 1] && slides[i + 1].hero;
  if (nxt && (!cur || cur.key !== nxt.key))
    slides[i].model(nxt.key, { x: SW + 0.6, y: nxt.y + 0.4, s: nxt.s, rot: [nxt.rot[0], nxt.rot[1] + 80, nxt.rot[2]], name: `!!m-${nxt.key}`, ghost: true });
  if (cur && slides[i + 1] && (!nxt || nxt.key !== cur.key))
    slides[i + 1].model(cur.key, { x: -cur.s - 0.6, y: cur.y + 0.4, s: cur.s, rot: [cur.rot[0], cur.rot[1] - 80, cur.rot[2]], name: `!!m-${cur.key}`, ghost: true });
}

// ---------- 3D assets: glb models + rendered rasters (poster images) ----------
const MODELS = path.join(__dirname, "..", "vkr-rag", "models");  // shared .glb + generator
const RASTERS = path.join(__dirname, "rasters");                  // own poster cache (cleanup must not touch vkr-rag's)
function prepareModels() {
  const env = { ...process.env, GLB_DIR: path.join(MODELS, "glb"),
    LD_LIBRARY_PATH: [process.env.BLENDER_LIBS || "/tmp/bstub", process.env.LD_LIBRARY_PATH || ""].join(":") };
  const keys = new Set();
  slides.forEach((s) => s.els.forEach((e) => e.t === "model" && keys.add(e.key)));
  const missing = [...keys].filter((k) => !fs.existsSync(path.join(MODELS, "glb", k + ".glb")));
  if (missing.length) execSync(`python3 ${path.join(MODELS, "make_vkr_models.py")} ${missing.join(" ")}`, { stdio: "inherit", env });
  const jobs = [];
  fs.mkdirSync(RASTERS, { recursive: true });
  let n = 0;
  slides.forEach((s) => s.els.forEach((e) => {
    if (e.t !== "model") return;
    e.id = `m${++n}`;
    if (e.ghost) { e.raster = A("clear.png"); return; }
    let px = e.px || Math.round(Math.min(1100, Math.max(220, e.s * 150)));
    if (process.env.FAST) px = Math.round(px / 3);
    const glb = fs.readFileSync(path.join(MODELS, "glb", e.key + ".glb"));
    const h = crypto.createHash("md5").update(glb).update(JSON.stringify([e.rot, px, 3])).digest("hex").slice(0, 10);
    e.raster = path.join(RASTERS, `${e.key}-${h}.png`);
    if (!fs.existsSync(e.raster) && !jobs.find((j) => j.out === e.raster)) jobs.push({ key: e.key, rot: e.rot, px, out: e.raster });
  }));
  if (jobs.length) {
    console.log(`rendering ${jobs.length} model rasters with Blender…`);
    const jf = path.join(RASTERS, "_jobs.json");
    fs.writeFileSync(jf, JSON.stringify(jobs));
    execSync(`python3 ${path.join(SCH, "models", "render.py")} ${jf}`, { stdio: ["ignore", "ignore", "inherit"], env });
    fs.unlinkSync(jf);
  }
  if (!process.env.FAST) {
    const used = new Set(slides.flatMap((s) => s.els.filter((e) => e.t === "model").map((e) => path.basename(e.raster))));
    for (const f of fs.readdirSync(RASTERS)) if (f.endsWith(".png") && !used.has(f)) fs.unlinkSync(path.join(RASTERS, f));
  }
}

// ---------------------------------------------------------------- output
async function main() {
  prepareModels();
  const pptxgen = req("pptxgenjs"), JSZip = req("jszip");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Выбор темы НИР: актуальность, новизна, значимость";
  pres.author = "Мейер-Шишнёв В. А.";
  toPptx(pres, slides);
  const zip = await JSZip.loadAsync(await pres.write({ outputType: "nodebuffer" }));
  await injectModels(zip, slides, path.join(MODELS, "glb"));
  await injectTiming(zip, slides);
  await dedupeMedia(zip);
  const out = path.join(__dirname, "../../exports/vkr-nir-vybor-temy.pptx");
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } }));
  console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB", slides.length, "slides");
  const heads = ["Титул", "Тема работы", "Актуальность", "Новизна и значимость", "Объект и предмет исследования", "Цель работы",
    "Задачи — путь к цели", "Источники информации", "Что уже реализовано другими"];
  let md = "# Выбор темы НИР: текст для заметок\n\n" +
    "Тема: «Разработка интеллектуальной информационно-справочной системы ПсковГУ на основе RAG-архитектуры и больших языковых моделей». " +
    "9 слайдов, ≈ 7 минут. Этот же текст — в заметках докладчика в .pptx.\n";
  slides.forEach((s, i) => { md += `\n## Слайд ${i + 1} — ${heads[i]}\n\n${s.notes.trim()}\n`; });
  fs.writeFileSync(path.join(__dirname, "../../exports/vkr-nir-tekst.md"), md);
  if (process.argv.includes("--preview")) await preview();
}

async function preview() {
  // lib.toHtml paints a fixed dark page; the .pptx uses s.bg — mirror it in the preview
  const pages = toHtml(slides, ASSETS, path.join(SCH, "node_modules/@fontsource")).map((p) => p.split("#080D1A").join("#" + BG));
  const outDir = path.join(__dirname, "preview");
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
  const chromiumMod = req("@sparticuz/chromium"), chromium = chromiumMod.default || chromiumMod;
  const puppeteer = req("puppeteer-core");
  if (!fs.existsSync("/tmp/al/lib/libnspr4.so")) {
    const zlib = require("zlib");
    fs.mkdirSync("/tmp/al", { recursive: true });
    const brf = req.resolve("@sparticuz/chromium").replace(/build\/.*$/, "bin/al2023.tar.br");
    fs.writeFileSync("/tmp/al/al.tar", zlib.brotliDecompressSync(fs.readFileSync(brf)));
    execSync("tar xf al.tar", { cwd: "/tmp/al" });
  }
  process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || "") + ":/tmp/al/lib";
  const browser = await puppeteer.launch({ args: [...chromium.args, "--allow-file-access-from-files"], executablePath: await chromium.executablePath(), headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  for (let i = 0; i < pages.length; i++) {
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
main().catch((e) => { console.error(e); process.exit(1); });
