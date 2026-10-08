// ВКР «Интеллектуальная информационно-справочная система ПсковГУ на основе RAG и LLM» — 9 слайдов, светлая тема,
// анимированные 3D-модели PowerPoint (am3d:model3d, .glb из Blender, см. models/) + Morph-переходы.
// Курс «Системный анализ и моделирование интеллектуальных систем».
//   node build.js            -> ../../exports/vkr-rag-pskgu.pptx (+ текст выступления .md)
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

const A = (f) => path.join(__dirname, "assets", f);
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
  s.text("Мейер-Шишнёв В. А.  ·  ВКР  ·  ПсковГУ, 2026", { x: L, y: 7.08, w: 6, h: 0.28, size: 9, color: DIM, name: "!!footer" });
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

// ===================================================================== 1. TITLE
{
  const s = new Slide({ notes: NOTES[0] });
  chrome(s, 1, "ПРИМЕР ИНТЕЛЛЕКТУАЛЬНОЙ СИСТЕМЫ  ·  ВКР БАКАЛАВРИАТА");
  s.text("Интеллектуальная справочная система ПсковГУ", { x: L, y: 1.2, w: 6.2, h: 1.9, size: 36, bold: true, color: INK, lineSpacingMultiple: 0.95, name: "!!title" });
  s.text("на основе RAG-архитектуры и больших языковых моделей", { x: L, y: 3.12, w: 5.9, h: 0.8, size: 18, color: ACC, ag: 1 });
  s.text([br("Мейер-Шишнёв Владислав Алексеевич", { bold: true, color: INK }),
    br("09.03.03 Прикладная информатика · ПсковГУ, 2026", { color: MUTED }),
    run("Руководитель: ст. преп. А. А. Гаврилов", { color: MUTED })], { x: L, y: 4.0, w: 5.9, h: 0.9, size: 12, lineSpacingMultiple: 1.15, ag: 1 });
  s.text([run("Курс: ", { bold: true, color: ACC2 }), run("Системный анализ и моделирование интеллектуальных систем", { color: MUTED })],
    { x: L, y: 4.92, w: 6.2, h: 0.3, size: 10, ag: 1 });
  [["543 963", "файла обработано"], ["≈ 50 000", "фрагментов в базе знаний"], ["8,47 / 10", "средняя оценка ответов"]].forEach(([v, l], i) => {
    const x = L + i * 1.98, y = 5.42;
    card(s, x, y, 1.86, 1.25, { ag: 2, shadow: true });
    s.text(v, { x: x + 0.15, y: y + 0.14, w: 1.6, h: 0.5, size: 20, bold: true, color: i === 2 ? OK : INK, ag: 2 });
    s.text(l, { x: x + 0.15, y: y + 0.66, w: 1.6, h: 0.5, size: 10, color: MUTED, ag: 2 });
  });
  const ww = 5.5, wh = ww * 735 / 1439;
  shot(s, "widget.png", 7.05, 3.55, ww, wh, { cap: "Ассистент встроен в сайт pskgu.ru как виджет", capAlign: "right", ag: 1 });
  stage(s, "chat", { x: 9.15, y: 0.45, s: 3.55, rot: [8, -22, 0], shy: 0.8, glow: 1.2 });
  slides.push(s);
}

// ===================================================================== 2. PROBLEM / RELEVANCE
{
  const s = new Slide({ notes: NOTES[1] });
  chrome(s, 2, "ПРОБЛЕМА И АКТУАЛЬНОСТЬ");
  title(s, "Информация есть — но её не найти", { w: 8.2 });
  const lw = 6.35;
  [["до 60\u00A0%", "обращений в справочные службы вузов — о том, что уже опубликовано на сайте", WARN],
    ["слова ≠ смысл", "Поиск по ключевым словам: «когда начинается сессия» не находит «график промежуточной аттестации»", ACC],
    ["облако нельзя", "Облачные LLM: документы уходят на внешние серверы (152-ФЗ), а без локальных данных модель «галлюцинирует»", BAD],
  ].forEach(([h, d, c], i) => {
    const y = 1.9 + i * 1.12, ag = 1 + i;
    card(s, L, y, lw, 1.0, { ag, shadow: true });
    s.rect({ x: L, y: y + 0.16, w: 0.07, h: 0.68, fill: c, ag });
    s.text(h, { x: L + 0.3, y: y + 0.08, w: lw - 0.5, h: 0.38, size: 17, bold: true, color: c, ag });
    s.text(d, { x: L + 0.3, y: y + 0.46, w: lw - 0.45, h: 0.5, size: 11.5, color: INK, lineSpacingMultiple: 1.02, ag });
  });
  card(s, L, 5.3, lw, 1.5, { fill: WARNT, line: WARN, ag: 4 });
  label(s, "ПРОТИВОРЕЧИЕ", L + 0.3, 5.4, 4, WARN, 4);
  s.text([run("Нужен быстрый доступ к актуальной информации вуза ", { color: INK }), run("↔", { color: WARN, bold: true }),
    run(" нет инструментов смыслового поиска по русскоязычным документам, работающих в локальном контуре", { color: INK })],
  { x: L + 0.3, y: 5.72, w: lw - 0.55, h: 1.0, size: 12.5, lineSpacingMultiple: 1.05, ag: 4 });
  // right: model + RAG solution
  const x2 = 7.35, w2 = R - x2;
  stage(s, "search", { x: 8.15, y: 1.3, s: 3.55, rot: [35, -15, 0], shy: 0.78, glow: 1.15 });
  card(s, x2, 4.75, w2, 2.05, { fill: ACCT, line: ACC, ag: 5 });
  label(s, "РЕШЕНИЕ — RAG", x2 + 0.3, 4.86, w2 - 0.5, ACC2, 5);
  s.text("Retrieval-Augmented Generation (Lewis et al., 2020): найти фрагменты в своей базе знаний → сгенерировать ответ по ним",
    { x: x2 + 0.3, y: 5.15, w: w2 - 0.55, h: 0.7, size: 11.5, color: INK, lineSpacingMultiple: 1.03, ag: 5 });
  [["актуально", "без переобучения"], ["достоверно", "с источниками"], ["конфиденциально", "локально"]].forEach(([a, b], i) => {
    const bw = (w2 - 0.6 - 0.2) / 3, x = x2 + 0.3 + i * (bw + 0.1);
    s.rect({ x, y: 5.95, w: bw, h: 0.7, fill: CARD, line: LINE, radius: 0.08, ag: 5 });
    s.text([br(a, { bold: true, color: OK, size: a.length > 12 ? 9.5 : 10.5 }), run(b, { color: MUTED, size: 9.5 })], { x, y: 5.95, w: bw, h: 0.7, align: "center", valign: "middle", ag: 5 });
  });
  slides.push(s);
}

// ===================================================================== 3. GOAL / TASKS
{
  const s = new Slide({ notes: NOTES[2] });
  chrome(s, 3, "ЦЕЛЬ, ОБЪЕКТ, ПРЕДМЕТ, ЗАДАЧИ");
  title(s, "Цель и задачи работы", { w: 8 });
  const gw = 8.55;
  card(s, L, 1.85, gw, 1.27, { fill: ACCT, line: ACC, ag: 1 });
  label(s, "ЦЕЛЬ", L + 0.3, 1.93, 2, ACC2, 1);
  s.text("Спроектировать, реализовать и проверить справочную систему ПсковГУ, которая отвечает на вопросы на естественном языке с указанием источников и работает локально на основе RAG и LLM",
    { x: L + 0.3, y: 2.22, w: gw - 0.55, h: 0.85, size: 12.5, color: INK, lineSpacingMultiple: 1.04, ag: 1 });
  [["ОБЪЕКТ", "Информационно-справочные системы образовательных организаций на основе обработки естественного языка"],
    ["ПРЕДМЕТ", "Методы семантического поиска, извлечения текста и генерации ответов в RAG-системах для русскоязычных баз знаний вузов"]].forEach(([h, d], i) => {
    const w = (gw - 0.2) / 2, x = L + i * (w + 0.2), y = 3.27;
    card(s, x, y, w, 1.22, { ag: 2, shadow: true });
    label(s, h, x + 0.25, y + 0.1, w - 0.4, ACC2, 2);
    s.text(d, { x: x + 0.25, y: y + 0.4, w: w - 0.45, h: 0.78, size: 11.5, color: INK, lineSpacingMultiple: 1.03, ag: 2 });
  });
  stage(s, "target", { x: 9.55, y: 0.95, s: 3.2, rot: [6, -28, 0], shy: 0.86, glow: 1.15 });
  label(s, "ЗАДАЧИ", L, 4.62, 3, ACC2, 3);
  const tasks = ["Изучить принципы LLM и RAG-архитектуры", "Обзор аналогов и выбор технологического стека", "Спроектировать архитектуру: offline-пайплайн + online-сервис",
    "Реализовать сбор и обработку данных сайта ПсковГУ", "Построить векторный индекс FAISS (модель bge-m3)", "Реализовать API, веб-чат и админ-панель", "Провести экспериментальную проверку"];
  tasks.forEach((t, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
    const x = L + col * 6.05, y = 4.97 + row * 0.46, ag = 3 + col;
    s.rect({ x, y: y + 0.03, w: 0.34, h: 0.34, shape: "ellipse", fill: ACCT, line: ACC, ag });
    s.text(String(i + 1), { x, y: y + 0.03, w: 0.34, h: 0.34, size: 10.5, bold: true, color: ACC2, align: "center", valign: "middle", ag });
    s.text(t, { x: x + 0.48, y, w: 5.45, h: 0.4, size: 12, color: INK, valign: "middle", ag });
  });
  slides.push(s);
}

// ===================================================================== 4. STAKEHOLDERS
{
  const s = new Slide({ notes: NOTES[3] });
  chrome(s, 4, "ЗАИНТЕРЕСОВАННЫЕ СТОРОНЫ");
  title(s, "Для кого система и кому она важна", { w: 8.4 });
  const groups = [
    ["Студенты", "059669", "Быстро узнать расписание, правила, найти документ", "профиль по группе, расписание вживую, ответы 24/7"],
    ["Администратор системы", "1F2433", "Контроль качества ответов", "админ-панель: правка и исключение фрагментов, аудит запросов"],
    ["Преподаватели", "D97706", "Своё расписание, нормативные документы", "профиль по ФИО, ссылки на первоисточник"],
    ["Руководство и справочные службы", ACC, "Меньше однотипных обращений", "система снимает типовые вопросы (до 60\u00A0% обращений)"],
    ["Абитуриенты и родители", "DC2626", "Проходные баллы, стоимость, бюджетные места", "гостевой режим, данные abit.pskgu.ru с источниками"],
    ["ИТ и защита информации", "64748B", "Безопасность, соответствие 152-ФЗ", "работает локально — данные не покидают вуз"],
  ];
  label(s, "ПОЛЬЗОВАТЕЛИ", L, 1.82, 3.9, MUTED, 1, 9.5);
  label(s, "ОРГАНИЗАЦИЯ", L + 4.15, 1.82, 3.9, MUTED, 1, 9.5);
  const cw = 4.0, ch = 1.5;
  groups.forEach(([n, c, need, give], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = L + col * (cw + 0.15), y = 2.15 + row * (ch + 0.12), ag = 1 + row;
    card(s, x, y, cw, ch, { ag, shadow: true });
    s.rect({ x: x + 0.22, y: y + 0.2, w: 0.2, h: 0.2, shape: "ellipse", fill: c, ag });
    s.text(n, { x: x + 0.52, y: y + 0.12, w: cw - 0.65, h: 0.36, size: 12.5, bold: true, color: INK, ag });
    s.text([run("Интерес: ", { bold: true, color: MUTED }), br(need, { color: INK }),
      run("Система: ", { bold: true, color: c === "1F2433" ? INK : c }), run(give, { color: INK })],
    { x: x + 0.22, y: y + 0.5, w: cw - 0.4, h: 0.95, size: 10.5, lineSpacingMultiple: 1.06, ag });
  });
  stage(s, "people", { x: 8.95, y: 1.55, s: 3.75, rot: [18, -12, 0], shy: 0.8, glow: 1.15,
    cap: "Каждая роль получает ответ под свою задачу", capY: 5.5 });
  card(s, 9.1, 5.95, R - 9.1, 0.85, { fill: ACCT, line: ACC, ag: 4 });
  s.text([run("Интересы сторон → ", { bold: true, color: ACC2 }), run("требования к системе: точность, источники, приватность, роли", { color: INK })],
    { x: 9.25, y: 5.95, w: R - 9.4, h: 0.85, size: 10.5, valign: "middle", lineSpacingMultiple: 1.04, ag: 4 });
  slides.push(s);
}

// ===================================================================== 5. SYSTEM VIEW
{
  const s = new Slide({ notes: NOTES[4] });
  chrome(s, 5, "СИСТЕМНЫЙ ВЗГЛЯД");
  title(s, "Система глазами системного анализа", { w: 9.5 });
  stage(s, "gears", { x: 10.5, y: 0.35, s: 2.25, rot: [10, -25, 0], shy: 0.9, glow: 1.1 });
  chip(s, "ЦЕЛЬ: точный ответ из документов вуза — с источниками и без утечки данных", 2.75, 1.85, 7.2, { h: 0.42, fill: ACCT, line: ACC, color: ACC2, bold: true, size: 11, ag: 1 });
  const io = (x, head, lines, ag) => {
    card(s, x, 2.75, 2.2, 2.35, { ag, shadow: true });
    label(s, head, x + 0.2, 2.87, 1.9, ACC2, ag);
    s.text(lines, { x: x + 0.2, y: 3.2, w: 1.85, h: 1.85, size: 11.5, color: INK, lineSpacingMultiple: 1.1, ag });
  };
  io(L, "ВХОД", [br("Вопрос на естественном языке"), br(" "), run("Профиль: студент (группа), преподаватель, гость", { color: MUTED })], 2);
  io(R - 2.2, "ВЫХОД", [br("Краткий ответ"), br(" "), run("Ссылки на источники (страницы и документы ПсковГУ)", { color: MUTED })], 4);
  s.text("→", { x: L + 2.2, y: 3.6, w: 0.6, h: 0.6, size: 28, bold: true, color: ACC, align: "center", ag: 2 });
  s.text("→", { x: R - 2.8, y: 3.6, w: 0.6, h: 0.6, size: 28, bold: true, color: ACC, align: "center", ag: 4 });
  const sx = 3.55, sw = 6.23, sy = 2.55, sh = 2.75;
  s.rect({ x: sx, y: sy, w: sw, h: sh, fill: "F9FAFF", line: ACC, lineW: 1.5, radius: 0.12, ag: 3 });
  label(s, "СИСТЕМА", sx + 0.2, sy + 0.1, 3, ACC2, 3, 10);
  const sub = (x, y, w, h, t, d, ag, hl) => {
    s.rect({ x, y, w, h, fill: hl ? ACCT : CARD, line: hl ? ACC : LINE, radius: 0.08, ag });
    s.text([br(t, { bold: true, color: INK, size: 12 }), run(d, { color: MUTED, size: 10 })], { x: x + 0.12, y, w: w - 0.24, h, align: "center", valign: "middle", lineSpacingMultiple: 1.05, ag });
  };
  sub(sx + 0.25, sy + 0.5, 2.6, 1.0, "Offline-пайплайн", "сбор, извлечение, OCR, нарезка, индексация", 3);
  sub(sx + sw - 2.85, sy + 0.5, 2.6, 1.0, "Online-сервис", "поиск, фильтрация, LLM, чат, виджет", 3);
  sub(sx + 1.6, sy + 1.72, sw - 3.2, 0.82, "База знаний", "FAISS (≈50 000 векторов) + SQLite", 3, true);
  s.line({ x1: sx + 1.55, y1: sy + 1.5, x2: sx + 2.2, y2: sy + 1.72, color: ACC, width: 1.25, ag: 3 });
  s.line({ x1: sx + sw - 1.55, y1: sy + 1.5, x2: sx + sw - 2.2, y2: sy + 1.72, color: ACC, width: 1.25, ag: 3 });
  const blk = (x, y, w, head, col, body, ag) => {
    card(s, x, y, w, 1.3, { ag, shadow: true });
    label(s, head, x + 0.2, y + 0.1, w - 0.3, col, ag, 10);
    s.text(body, { x: x + 0.2, y: y + 0.42, w: w - 0.35, h: 0.85, size: 10.5, color: INK, lineSpacingMultiple: 1.05, ag });
  };
  const bw = (CW - 0.4) / 3;
  blk(L, 5.5, bw, "ВНЕШНЯЯ СРЕДА", ACC2, "Заинтересованные стороны · сайты ПсковГУ (источник данных) · сервис расписания rasp.pskgu.ru", 5);
  blk(L + bw + 0.2, 5.5, bw, "ОГРАНИЧЕНИЯ", WARN, "Локальный контур, 152-ФЗ · видеокарта RTX 3060 (12 ГБ) · русский язык, сканы, таблицы", 5);
  blk(L + 2 * (bw + 0.2), 5.5, bw, "КРИТЕРИИ КАЧЕСТВА", OK, "Верность ответа и источники · нет галлюцинаций · поиск ≤ 3–5 с, ответ ≤ 60 с", 5);
  slides.push(s);
}

// ===================================================================== 6. ARCHITECTURE & DATA
{
  const s = new Slide({ notes: NOTES[5] });
  chrome(s, 6, "АРХИТЕКТУРА И ДАННЫЕ");
  title(s, "Архитектура: два контура и одна база знаний");
  const aw = 6.25, ah = aw * 818 / 1428;
  s.rect({ x: L - 0.05, y: 1.85 - 0.05, w: aw + 0.1, h: ah + 0.1, fill: "FFFFFF", line: LINE, radius: 0.08, shadow: true, ag: 1 });
  s.img(A("arch.png"), { x: L, y: 1.85, w: aw, h: ah, ag: 1 });
  s.text("Общая архитектура системы (рисунок из ВКР)", { x: L, y: 1.85 + ah + 0.08, w: aw, h: 0.3, size: 9.5, color: MUTED, ag: 1 });
  const rows = [["Python", "FastAPI", "Flask", "SQLite", "FAISS"], ["BAAI/bge-m3", "Tesseract OCR", "Ollama · Qwen / GPT-OSS"]];
  rows.forEach((r, ri) => {
    let x = L;
    r.forEach((t) => { const w = 0.38 + t.length * 0.083; chip(s, t, x, 5.98 + ri * 0.46, w, { ag: 6, size: 10, h: 0.36 }); x += w + 0.1; });
  });
  const fx = 7.35, fw = R - fx;
  label(s, "OFFLINE-ПАЙПЛАЙН В ЦИФРАХ", fx, 1.83, fw, ACC2, 2);
  const fun = [["≈ 12 000", "стартовых URL (sitemap + поиск)"], ["40 000+", "веб-страниц, ≈ 26 ГБ"], ["543 963", "файла, 468 ГБ"], ["≈ 50 000", "чанков (49 731)"], ["FAISS", "векторы bge-m3, ≈ 450 МБ"]];
  fun.forEach(([v, d], i) => {
    const y = 2.2 + i * 0.6, w = fw - i * 0.3, ag = 2 + Math.floor(i / 2), last = i === 4;
    s.rect({ x: fx, y, w, h: 0.52, fill: last ? ACCT : CARD, line: last ? ACC : LINE, radius: 0.08, ag });
    s.text([run(v + "  ", { bold: true, color: last ? ACC2 : INK, size: 14.5 }), run(d, { color: MUTED, size: 10.5 })], { x: fx + 0.2, y, w: w - 0.3, h: 0.52, valign: "middle", ag });
  });
  s.text([run("Изюминки: ", { bold: true, color: OK }), run("каскад из 4 библиотек для PDF + OCR сканов · парсер таблиц с объединёнными ячейками · у каждого фрагмента сохранён путь к источнику", { color: INK })],
    { x: fx, y: 5.42, w: 2.95, h: 1.4, size: 10, lineSpacingMultiple: 1.05, ag: 5 });
  stage(s, "gpu", { x: 10.25, y: 4.45, s: 2.45, rot: [12, -30, 0], shy: 0.72, glow: 1.1,
    cap: "RTX 3060, 12 ГБ — всё на одной видеокарте", capX: 9.85, capW: 2.8, capY: 6.55, capAlign: "right" });
  slides.push(s);
}

// ===================================================================== 7. HOW IT ANSWERS (DEMO)
{
  const s = new Slide({ notes: NOTES[6] });
  chrome(s, 7, "КАК ЭТО РАБОТАЕТ");
  title(s, "Как система отвечает на вопрос");
  const steps = [["Вопрос", "+ профиль"], ["Эмбеддинг", "bge-m3"], ["Поиск", "top-10 в FAISS"], ["Фильтр", "правки админа"], ["LLM", "промпт + правила"], ["Ответ", "+ источники"]];
  const stw = (CW - 5 * 0.28) / 6;
  steps.forEach(([a, b], i) => {
    const x = L + i * (stw + 0.28), ag = 1 + Math.floor(i / 2), last = i === 5;
    s.rect({ x, y: 1.85, w: stw, h: 0.78, fill: last ? OKT : CARD, line: last ? OK : LINE, radius: 0.1, shadow: true, ag });
    s.text([br(a, { bold: true, color: last ? OK : INK, size: 13 }), run(b, { color: MUTED, size: 10 })], { x, y: 1.85, w: stw, h: 0.78, align: "center", valign: "middle", ag });
    if (i < 5) s.text("›", { x: x + stw, y: 1.9, w: 0.28, h: 0.62, size: 22, bold: true, color: ACC, align: "center", ag });
  });
  const w1 = 6.95, h1 = w1 * 729 / 1439;
  shot(s, "answer.png", L, 3.0, w1, h1, { cap: "Реальный ответ: проходные баллы 09.03.03 за 2021–2025 и 3 источника со ссылками", ag: 4 });
  const x2 = L + w1 + 0.35, w2 = R - x2, h2 = w2 * 733 / 1439;
  shot(s, "admin.png", x2, 3.0, w2, h2, { cap: "Админ-панель: 49 731 чанк, аудит запросов", ag: 5 });
  card(s, x2, 3.0 + h2 + 0.5, w2, 1.0, { fill: ACCT, line: ACC, ag: 5 });
  s.text([run("Расписание ", { bold: true, color: ACC2 }), run("— отдельный маршрут: живой запрос к rasp.pskgu.ru, ответ под группу или преподавателя из профиля", { color: INK })],
    { x: x2 + 0.2, y: 3.0 + h2 + 0.55, w: w2 - 0.35, h: 0.9, size: 10.5, valign: "middle", lineSpacingMultiple: 1.05, ag: 5 });
  slides.push(s);
}

// ===================================================================== 8. RESULTS
{
  const s = new Slide({ notes: NOTES[7] });
  chrome(s, 8, "ЭКСПЕРИМЕНТАЛЬНАЯ ПРОВЕРКА");
  title(s, "Результаты пилотного тестирования");
  stage(s, "gauge", { x: L + 0.45, y: 1.6, s: 2.55, rot: [6, -22, 0], shy: 0.9, glow: 1.2 });
  s.text([run("8,47", { bold: true, color: ACC, size: 26 }), run(" / 10", { color: ACC, size: 15 }), br(""),
    run("254 из 300 баллов · 84,7 % · ±0,35", { bold: true, color: INK, size: 11 })], { x: L, y: 4.12, w: 3.45, h: 0.75, align: "center", ag: 1 });
  const cats = [["Абитуриентские", 9.2], ["Общие о вузе", 8.8], ["Ловушки", 8.6], ["Документы", 8.2], ["Расписание", 8.0], ["Синонимы, опечатки", 8.0]];
  const cx = 4.35, cwid = 4.5, y0 = 1.95, rowH = 0.37;
  label(s, "СРЕДНИЙ БАЛЛ ПО КАТЕГОРИЯМ", cx, y0 - 0.05, cwid, ACC2, 2, 10);
  cats.forEach(([n, v], i) => {
    const y = y0 + 0.35 + i * rowH, bw = (cwid - 1.9) * (v - 6) / 4, ag = 2;
    s.text(n, { x: cx, y, w: 1.75, h: 0.32, size: 10.5, color: INK, valign: "middle", ag });
    s.rect({ x: cx + 1.8, y: y + 0.04, w: cwid - 1.9, h: 0.24, fill: CARD2, radius: 0.05, ag });
    s.rect({ x: cx + 1.8, y: y + 0.04, w: bw, h: 0.24, fill: v >= 8.6 ? OK : (v >= 8.2 ? ACC : WARN), radius: 0.05, ag });
    s.text(v.toFixed(1).replace(".", ","), { x: cx + 1.8 + bw + 0.06, y, w: 0.5, h: 0.32, size: 10.5, bold: true, color: INK, valign: "middle", ag });
  });
  s.text("шкала 6–10 · 30 вопросов · GPT-OSS 120B · top-K = 10", { x: cx, y: y0 + 0.35 + 6 * rowH + 0.02, w: cwid, h: 0.25, size: 8.5, color: DIM, ag: 2 });
  const ex = 9.2, ew = R - ex;
  label(s, "ТИПЫ ОШИБОК", ex, 1.9, ew, ACC2, 3, 10);
  [["Данные", "в источниках нет прямого ответа"], ["Поиск и маршрут", "напр., расписание в гостевом режиме"], ["Генерация", "лишние обобщения модели"]].forEach(([h, d], i) => {
    const y = 2.25 + i * 0.75;
    card(s, ex, y, ew, 0.65, { ag: 3, shadow: true });
    s.text([br(h, { bold: true, color: INK, size: 11.5 }), run(d, { color: MUTED, size: 9.5 })], { x: ex + 0.2, y, w: ew - 0.3, h: 0.65, valign: "middle", ag: 3 });
  });
  card(s, L, 4.95, 8.15, 1.85, { fill: ACCT, line: ACC, ag: 4 });
  label(s, "ЧТО СДЕЛАНО ПО ИТОГАМ", L + 0.25, 5.05, 5, ACC2, 4, 10);
  s.text([br("Доработан системный промпт: без профиля система не даёт персональных ответов, а при нехватке данных честно сообщает об этом, а не угадывает.", { color: INK }),
    run("Пример верного поведения: на вопрос о проходном балле 2026 года система указала, что данные ещё не опубликованы.", { color: MUTED })],
  { x: L + 0.25, y: 5.37, w: 7.65, h: 1.38, size: 12, lineSpacingMultiple: 1.08, ag: 4 });
  card(s, ex, 4.95, ew, 1.85, { fill: BADT, line: BAD, ag: 5 });
  label(s, "ОГРАНИЧЕНИЯ", ex + 0.2, 5.05, ew - 0.3, BAD, 5, 10);
  s.text("· всего 30 вопросов\n· оценивал сам автор\n· нет сравнения с LLM без поиска\n· нет полного перетеста после доработки", { x: ex + 0.2, y: 5.37, w: ew - 0.3, h: 1.38, size: 11, color: INK, lineSpacingMultiple: 1.1, ag: 5 });
  slides.push(s);
}

// ===================================================================== 9. CONCLUSIONS / NEXT
{
  const s = new Slide({ notes: NOTES[8] });
  chrome(s, 9, "ИТОГИ И ПЕРСПЕКТИВЫ");
  title(s, "Итоги и что дальше");
  const done = [["Цель достигнута", "рабочий комплекс: от сбора данных до ответа с источниками"], ["Полностью локально", "данные не покидают вуз — соответствие 152-ФЗ"],
    ["Встраивается в сайт", "отдельное веб-приложение или виджет на pskgu.ru"], ["Управляемое качество", "админ-панель: правка и исключение фрагментов, аудит запросов"]];
  const lw = 5.3;
  label(s, "ИТОГИ", L, 1.85, 5, OK, 1);
  done.forEach(([h, d], i) => {
    const y = 2.22 + i * 0.98, ag = 1 + Math.floor(i / 2);
    card(s, L, y, lw, 0.86, { ag, shadow: true });
    s.text("✓", { x: L + 0.15, y, w: 0.5, h: 0.86, size: 20, bold: true, color: OK, valign: "middle", ag });
    s.text([br(h, { bold: true, color: INK, size: 13 }), run(d, { color: MUTED, size: 10.5 })], { x: L + 0.62, y, w: lw - 0.75, h: 0.86, valign: "middle", ag });
  });
  s.text("Спасибо за внимание!", { x: L, y: 6.27, w: lw, h: 0.55, size: 22, bold: true, color: ACC, ag: 5 });
  const x2 = 6.2, w2 = 4.25;
  card(s, x2, 1.85, w2, 4.95, { fill: ACCT, line: ACC, ag: 3 });
  label(s, "ЧТО ДАЛЬШЕ → МАГИСТРАТУРА", x2 + 0.25, 1.98, w2 - 0.4, ACC2, 3, 10);
  const nx = [["Строгая оценка", "сравнение с LLM без поиска, автоматические метрики RAG"], ["Больше данных для теста", "расширенный набор вопросов, несколько экспертов"],
    ["Живая база знаний", "обновление индекса без полной пересборки"], ["Умная маршрутизация", "агентный подход к выбору сценария"], ["Внедрение", "запуск в ПсковГУ и перенос в другие организации"]];
  nx.forEach(([h, d], i) => {
    const y = 2.4 + i * 0.87, ag = 3 + Math.floor(i / 3);
    s.text(String(i + 1).padStart(2, "0"), { x: x2 + 0.25, y, w: 0.6, h: 0.45, size: 17, bold: true, color: ACC, ag });
    s.text([br(h, { bold: true, color: INK, size: 12 }), run(d, { color: MUTED, size: 10 })], { x: x2 + 0.85, y: y - 0.02, w: w2 - 1.0, h: 0.8, lineSpacingMultiple: 1.02, ag });
  });
  stage(s, "rocket", { x: 10.2, y: 1.55, s: 3.0, rot: [6, -15, 0], shy: 0.95, glow: 1.2 });
  s.text("Задел, с которого можно начать магистерскую работу", { x: 10.5, y: 4.95, w: 2.15, h: 0.75, size: 10, italic: true, color: MUTED, align: "center", ag: 5 });
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
const MODELS = path.join(__dirname, "models");
function prepareModels() {
  const env = { ...process.env, GLB_DIR: path.join(MODELS, "glb"),
    LD_LIBRARY_PATH: [process.env.BLENDER_LIBS || "/tmp/bstub", process.env.LD_LIBRARY_PATH || ""].join(":") };
  const keys = new Set();
  slides.forEach((s) => s.els.forEach((e) => e.t === "model" && keys.add(e.key)));
  const missing = [...keys].filter((k) => !fs.existsSync(path.join(MODELS, "glb", k + ".glb")));
  if (missing.length) execSync(`python3 ${path.join(MODELS, "make_vkr_models.py")} ${missing.join(" ")}`, { stdio: "inherit", env });
  const jobs = [];
  fs.mkdirSync(path.join(MODELS, "rasters"), { recursive: true });
  let n = 0;
  slides.forEach((s) => s.els.forEach((e) => {
    if (e.t !== "model") return;
    e.id = `m${++n}`;
    if (e.ghost) { e.raster = A("clear.png"); return; }
    let px = e.px || Math.round(Math.min(1100, Math.max(220, e.s * 150)));
    if (process.env.FAST) px = Math.round(px / 3);
    const glb = fs.readFileSync(path.join(MODELS, "glb", e.key + ".glb"));
    const h = crypto.createHash("md5").update(glb).update(JSON.stringify([e.rot, px, 3])).digest("hex").slice(0, 10);
    e.raster = path.join(MODELS, "rasters", `${e.key}-${h}.png`);
    if (!fs.existsSync(e.raster) && !jobs.find((j) => j.out === e.raster)) jobs.push({ key: e.key, rot: e.rot, px, out: e.raster });
  }));
  if (jobs.length) {
    console.log(`rendering ${jobs.length} model rasters with Blender…`);
    const jf = path.join(MODELS, "rasters", "_jobs.json");
    fs.writeFileSync(jf, JSON.stringify(jobs));
    execSync(`python3 ${path.join(SCH, "models", "render.py")} ${jf}`, { stdio: ["ignore", "ignore", "inherit"], env });
    fs.unlinkSync(jf);
  }
  if (!process.env.FAST) {
    const used = new Set(slides.flatMap((s) => s.els.filter((e) => e.t === "model").map((e) => path.basename(e.raster))));
    for (const f of fs.readdirSync(path.join(MODELS, "rasters"))) if (f.endsWith(".png") && !used.has(f)) fs.unlinkSync(path.join(MODELS, "rasters", f));
  }
}

// ---------------------------------------------------------------- output
async function main() {
  prepareModels();
  const pptxgen = req("pptxgenjs"), JSZip = req("jszip");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Интеллектуальная справочная система ПсковГУ на основе RAG и LLM";
  pres.author = "Мейер-Шишнёв В. А.";
  toPptx(pres, slides);
  const zip = await JSZip.loadAsync(await pres.write({ outputType: "nodebuffer" }));
  await injectModels(zip, slides, path.join(MODELS, "glb"));
  await injectTiming(zip, slides);
  await dedupeMedia(zip);
  const out = path.join(__dirname, "../../exports/vkr-rag-pskgu.pptx");
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } }));
  console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB", slides.length, "slides");
  const heads = ["Титул", "Проблема и актуальность", "Цель, объект, предмет, задачи", "Заинтересованные стороны", "Система глазами системного анализа",
    "Архитектура и данные", "Как система отвечает на вопрос", "Результаты тестирования", "Итоги и перспективы"];
  let md = "# Текст выступления: ВКР «Интеллектуальная справочная система ПсковГУ на основе RAG и LLM»\n\n" +
    "Курс «Системный анализ и моделирование интеллектуальных систем». 9 слайдов, ≈ 9 минут. Этот же текст — в заметках докладчика в .pptx.\n";
  slides.forEach((s, i) => { md += `\n## Слайд ${i + 1} — ${heads[i]}\n\n${s.notes.trim()}\n`; });
  fs.writeFileSync(path.join(__dirname, "../../exports/vkr-rag-pskgu-tekst.md"), md);
  if (process.argv.includes("--preview")) await preview();
}

async function preview() {
  // lib.toHtml paints a fixed dark page; the .pptx uses s.bg — mirror it in the preview
  const pages = toHtml(slides, path.join(__dirname, "assets"), path.join(SCH, "node_modules/@fontsource")).map((p) => p.split("#080D1A").join("#" + BG));
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
