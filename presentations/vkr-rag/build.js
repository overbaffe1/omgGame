// ВКР «Интеллектуальная информационно-справочная система ПсковГУ на основе RAG и LLM» — 8 слайдов
// для курса «Системный анализ и моделирование интеллектуальных систем».
//   node build.js            -> ../../exports/vkr-rag-pskgu.pptx (+ текст выступления .md)
//   node build.js --preview  -> также preview/slide-XX.png
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const SCH = path.join(__dirname, "..", "schumpeter");
const req = require("module").createRequire(path.join(SCH, "package.json"));
const { Slide, toPptx, toHtml } = require(path.join(SCH, "lib"));
const { injectTiming } = require(path.join(SCH, "pptx3d"));

const A = (f) => path.join(__dirname, "assets", f);
const BG = "0E1222", CARD = "181E33", CARD2 = "1F2742", LINE = "2E3A5C";
const ACC = "6574FF", ACC2 = "9AA4FF", OK = "34D399", WARN = "F59E0B", BAD = "F87171";
const WHITE = "EEF0F8", MUTED = "9AA3BA", DIM = "69728C";
const L = 0.7, R = 12.633, CW = R - L, N = 8;
const slides = [];
const run = (text, o = {}) => ({ text, options: o });
const br = (text, o = {}) => ({ text, options: { ...o, breakLine: true } });

function chrome(s, idx, kicker) {
  s.bg = BG;
  s.rect({ x: 0, y: 0, w: 13.333, h: 0.08, fill: ACC, name: "!!topbar" });
  if (kicker) {
    s.rect({ x: L, y: 0.52, w: 0.09, h: 0.28, fill: ACC, name: "!!kbar" });
    s.text(kicker, { x: L + 0.2, y: 0.47, w: 10, h: 0.38, size: 11, bold: true, color: ACC2, charSpacing: 2.5, name: "!!kicker" });
  }
  s.line({ x1: L, y1: 7.0, x2: R, y2: 7.0, color: LINE, width: 0.75, name: "!!fline" });
  s.text("Мейер-Шишнёв В. А.  ·  ВКР  ·  ПсковГУ, 2026", { x: L, y: 7.08, w: 6, h: 0.28, size: 9, color: DIM, name: "!!footer" });
  s.text(`${idx} / ${N}`, { x: R - 1.2, y: 7.08, w: 1.2, h: 0.28, size: 9, color: DIM, align: "right", name: "!!page" });
}
const title = (s, t, o = {}) => s.text(t, { x: L, y: o.y ?? 0.95, w: o.w ?? CW, h: o.h ?? 0.8, size: o.size ?? 32, bold: true, color: WHITE, name: "!!title" });
const card = (s, x, y, w, h, o = {}) => s.rect({ x, y, w, h, fill: o.fill || CARD, line: o.line || LINE, lineW: o.lineW || 0.75, radius: o.radius ?? 0.1, shadow: o.shadow, ag: o.ag });
function shot(s, file, x, y, w, h, o = {}) {
  s.rect({ x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: o.frame || "2A3352", radius: 0.08, shadow: true, ag: o.ag });
  s.img(A(file), { x, y, w, h, ag: o.ag });
  if (o.cap) s.text(o.cap, { x, y: y + h + 0.1, w, h: 0.3, size: 9.5, color: MUTED, align: o.capAlign || "left", ag: o.ag });
}
const chip = (s, t, x, y, w, o = {}) => {
  s.rect({ x, y, w, h: o.h || 0.36, fill: o.fill || CARD2, line: o.line || LINE, radius: (o.h || 0.36) / 2, ag: o.ag });
  s.text(t, { x, y, w, h: o.h || 0.36, size: o.size || 10.5, color: o.color || WHITE, bold: o.bold, align: "center", valign: "middle", ag: o.ag });
};

// ===================================================================== 1. TITLE
{
  const s = new Slide({ notes:
`Здравствуйте! В качестве примера интеллектуальной системы я расскажу о своей выпускной работе бакалавриата — «Разработка интеллектуальной информационно-справочной системы ПсковГУ на основе RAG-архитектуры и больших языковых моделей».
Если коротко: это чат-ассистент, которому можно задать вопрос об университете обычными словами — про проходные баллы, документы, расписание — и он отвечает, опираясь на официальные материалы сайта, и обязательно показывает источники. Его можно открыть как отдельное веб-приложение или прямо на сайте университета в виде виджета — его вы видите на скриншоте.
Чтобы был понятен масштаб: система обработала больше полумиллиона файлов с сайтов ПсковГУ, в её базе знаний около 50 тысяч фрагментов текста, а на пилотном тестировании ответы получили в среднем 8,5 балла из 10.` });
  chrome(s, 1, "ПРИМЕР ИНТЕЛЛЕКТУАЛЬНОЙ СИСТЕМЫ  ·  ВКР БАКАЛАВРИАТА");
  s.text("Интеллектуальная справочная система ПсковГУ", { x: L, y: 1.2, w: 6.2, h: 1.9, size: 36, bold: true, color: WHITE, lineSpacingMultiple: 0.95, name: "!!title" });
  s.text("на основе RAG-архитектуры и больших языковых моделей", { x: L, y: 3.12, w: 5.9, h: 0.8, size: 18, color: ACC2, ag: 1 });
  s.text([br("Мейер-Шишнёв Владислав Алексеевич", { bold: true, color: WHITE }),
    br("09.03.03 Прикладная информатика · ПсковГУ, 2026", { color: MUTED }),
    run("Руководитель: ст. преп. А. А. Гаврилов", { color: MUTED })], { x: L, y: 4.05, w: 5.9, h: 0.9, size: 12, lineSpacingMultiple: 1.15, ag: 1 });
  const st = [["543 963", "файла обработано"], ["≈ 50 000", "фрагментов в базе знаний"], ["8,47 / 10", "средняя оценка ответов"]];
  st.forEach(([v, l], i) => {
    const x = L + i * 1.98, y = 5.35;
    card(s, x, y, 1.86, 1.25, { ag: 2 });
    s.text(v, { x: x + 0.15, y: y + 0.14, w: 1.6, h: 0.5, size: 20, bold: true, color: i === 2 ? OK : WHITE, ag: 2 });
    s.text(l, { x: x + 0.15, y: y + 0.66, w: 1.6, h: 0.5, size: 10, color: MUTED, ag: 2 });
  });
  shot(s, "widget.png", 6.95, 2.05, 5.68, 5.68 * 735 / 1439, { cap: "Ассистент встроен в сайт pskgu.ru как виджет", capAlign: "right", ag: 1 });
  s.text([run("Курс: ", { bold: true, color: ACC2 }), run("Системный анализ и моделирование интеллектуальных систем", { color: MUTED })],
    { x: 6.95, y: 5.35, w: 5.68, h: 0.3, size: 10, align: "right", ag: 2 });
  slides.push(s);
}

// ===================================================================== 2. PROBLEM / RELEVANCE
{
  const s = new Slide({ notes:
`С чего всё началось — с проблемы. На сайтах университета тысячи документов: приказы, положения, учебные планы, расписания, и всё это разбросано по десяткам поддоменов. По данным исследований, до 60 процентов обращений в справочные службы вузов — это вопросы, ответ на которые уже есть на сайте, просто его невозможно найти.
Почему не помогает обычный поиск? Он ищет совпадения слов, а не смысл. Если спросить «когда начинается сессия», он не найдёт документ «график промежуточной аттестации», хотя это одно и то же.
Почему бы не взять ChatGPT? Во-первых, внутренние документы нельзя отправлять на зарубежные серверы — этого не позволяют 152-ФЗ и политика вуза. Во-вторых, модель не знает локальных данных и начинает выдумывать — это называется галлюцинациями.
Отсюда противоречие, которое и определяет актуальность: людям нужен быстрый доступ к информации вуза, а инструментов смыслового поиска, работающих локально и по-русски, нет. Решение — архитектура RAG: сначала найти нужные документы, потом сгенерировать ответ по ним.` });
  chrome(s, 2, "ПРОБЛЕМА И АКТУАЛЬНОСТЬ");
  title(s, "Информация есть — но её не найти");
  const pr = [
    ["до 60 %", "обращений в справочные службы вузов — о том, что уже опубликовано на сайте", WARN],
    ["слова ≠ смысл", "Поиск по ключевым словам: «когда начинается сессия» не находит «график промежуточной аттестации»", ACC2],
    ["облако нельзя", "Облачные LLM: документы уходят на внешние серверы (152-ФЗ), а без локальных данных модель «галлюцинирует»", BAD],
  ];
  pr.forEach(([h, d, c], i) => {
    const y = 1.95 + i * 1.32, ag = 1 + i;
    card(s, L, y, 6.6, 1.18, { ag });
    s.rect({ x: L, y: y + 0.18, w: 0.07, h: 0.82, fill: c, ag });
    s.text(h, { x: L + 0.3, y: y + 0.12, w: 6.1, h: 0.42, size: 19, bold: true, color: c, ag });
    s.text(d, { x: L + 0.3, y: y + 0.56, w: 6.1, h: 0.55, size: 12, color: WHITE, lineSpacingMultiple: 1.03, ag });
  });
  // contradiction + RAG solution
  const x2 = 7.65, w2 = R - x2;
  card(s, x2, 1.95, w2, 1.85, { fill: "1E1B2E", line: WARN, ag: 4 });
  s.text("ПРОТИВОРЕЧИЕ", { x: x2 + 0.3, y: 2.08, w: w2 - 0.5, h: 0.3, size: 10.5, bold: true, color: WARN, charSpacing: 2, ag: 4 });
  s.text([run("Нужен быстрый доступ к актуальной информации вуза ", { color: WHITE }), run("↔", { color: WARN, bold: true }),
    run(" нет инструментов смыслового поиска по русскоязычным документам, работающих в локальном контуре", { color: WHITE })],
  { x: x2 + 0.3, y: 2.4, w: w2 - 0.55, h: 1.3, size: 13.5, lineSpacingMultiple: 1.08, ag: 4 });
  card(s, x2, 3.95, w2, 2.81, { fill: "17213A", line: ACC, ag: 5 });
  s.text("РЕШЕНИЕ — RAG", { x: x2 + 0.3, y: 4.1, w: w2 - 0.5, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 5 });
  s.text("Retrieval-Augmented Generation (Lewis et al., 2020): найти фрагменты в своей базе знаний → сгенерировать ответ по ним", { x: x2 + 0.3, y: 4.45, w: w2 - 0.55, h: 1.0, size: 13, color: WHITE, lineSpacingMultiple: 1.05, ag: 5 });
  [["актуально", "без переобучения"], ["достоверно", "с источниками"], ["конфиденциально", "локально"]].forEach(([a, b], i) => {
    const bw = (w2 - 0.6 - 0.2) / 3, x = x2 + 0.3 + i * (bw + 0.1);
    s.rect({ x, y: 5.75, w: bw, h: 0.78, fill: CARD2, line: LINE, radius: 0.08, ag: 5 });
    s.text([br(a, { bold: true, color: OK, size: a.length > 12 ? 9.5 : 10.5 }), run(b, { color: MUTED, size: 9.5 })], { x, y: 5.75, w: bw, h: 0.78, align: "center", valign: "middle", ag: 5 });
  });
  slides.push(s);
}

// ===================================================================== 3. GOAL / TASKS
{
  const s = new Slide({ notes:
`Цель работы — спроектировать, реализовать и экспериментально проверить интеллектуальную справочную систему ПсковГУ, которая отвечает на вопросы студентов и преподавателей на естественном языке, указывает источники и работает в локальной инфраструктуре на основе RAG и больших языковых моделей.
Объект исследования — информационно-справочные системы образовательных организаций, основанные на обработке естественного языка. Предмет — методы семантического поиска, извлечения текста и генерации ответов в RAG-системах для русскоязычных баз знаний вузов.
Для достижения цели я решил семь задач: изучил языковые модели и RAG, сделал обзор аналогов и выбрал стек технологий, спроектировал архитектуру из двух контуров, реализовал сбор и обработку данных с сайта, построил векторный индекс, сделал сервер, чат и админ-панель и, наконец, провёл экспериментальную проверку.` });
  chrome(s, 3, "ЦЕЛЬ, ОБЪЕКТ, ПРЕДМЕТ, ЗАДАЧИ");
  title(s, "Цель и задачи работы");
  card(s, L, 1.9, CW, 1.2, { fill: "17213A", line: ACC, ag: 1 });
  s.text("ЦЕЛЬ", { x: L + 0.3, y: 2.0, w: 2, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 1 });
  s.text("Спроектировать, реализовать и проверить справочную систему ПсковГУ, которая отвечает на вопросы на естественном языке с указанием источников и работает локально на основе RAG и LLM",
    { x: L + 0.3, y: 2.3, w: CW - 0.6, h: 0.75, size: 14, color: WHITE, lineSpacingMultiple: 1.05, ag: 1 });
  [["ОБЪЕКТ", "Информационно-справочные системы образовательных организаций на основе обработки естественного языка"],
    ["ПРЕДМЕТ", "Методы семантического поиска, извлечения текста и генерации ответов в RAG-системах для русскоязычных баз знаний вузов"]].forEach(([h, d], i) => {
    const x = L, y = 3.3 + i * 1.72, w = 4.6;
    card(s, x, y, w, 1.55, { ag: 2 });
    s.text(h, { x: x + 0.25, y: y + 0.14, w: w - 0.4, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 2 });
    s.text(d, { x: x + 0.25, y: y + 0.46, w: w - 0.45, h: 1.0, size: 12, color: WHITE, lineSpacingMultiple: 1.05, ag: 2 });
  });
  const tasks = ["Изучить принципы LLM и RAG-архитектуры", "Обзор аналогов и выбор технологического стека", "Спроектировать архитектуру: offline-пайплайн + online-сервис",
    "Реализовать сбор и обработку данных сайта ПсковГУ", "Построить векторный индекс FAISS (модель bge-m3)", "Реализовать API, веб-чат и админ-панель", "Провести экспериментальную проверку"];
  s.text("ЗАДАЧИ", { x: 5.6, y: 3.3, w: 3, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 3 });
  tasks.forEach((t, i) => {
    const y = 3.66 + i * 0.45, ag = 3 + Math.floor(i / 4);
    s.rect({ x: 5.6, y: y + 0.03, w: 0.34, h: 0.34, shape: "ellipse", fill: CARD2, line: ACC, ag });
    s.text(String(i + 1), { x: 5.6, y: y + 0.03, w: 0.34, h: 0.34, size: 10.5, bold: true, color: ACC2, align: "center", valign: "middle", ag });
    s.text(t, { x: 6.08, y, w: 6.5, h: 0.4, size: 12.5, color: WHITE, valign: "middle", ag });
  });
  slides.push(s);
}

// ===================================================================== 4. SYSTEM VIEW
{
  const s = new Slide({ notes:
`Раз у нас курс системного анализа, посмотрим на работу как на систему.
Вход системы — вопрос пользователя на естественном языке и его профиль: студент с номером группы, преподаватель или гость. Выход — краткий ответ со ссылками на источники.
Внешняя среда: пользователи, администратор, сайты ПсковГУ, откуда берутся данные, и сервис расписания, к которому система обращается напрямую.
Сама система состоит из двух подсистем. Offline-пайплайн один раз собирает и готовит базу знаний. Online-сервис постоянно обслуживает запросы. Связывает их общая база знаний: векторный индекс FAISS и база данных SQLite.
Есть и ограничения: всё должно работать локально, на обычной видеокарте RTX 3060 с 12 гигабайтами памяти, соблюдать 152-ФЗ и понимать русский язык.
И критерии качества: правильность ответа, наличие источников, отсутствие галлюцинаций и время ответа — поиск за 3–5 секунд, весь ответ не дольше минуты.` });
  chrome(s, 4, "СИСТЕМНЫЙ ВЗГЛЯД");
  title(s, "Система глазами системного анализа");
  // goal on top
  chip(s, "ЦЕЛЬ: точный ответ из документов вуза — с источниками и без утечки данных", 3.0, 1.82, 7.33, { h: 0.42, fill: "17213A", line: ACC, color: ACC2, bold: true, size: 11, ag: 1 });
  // input / output
  const io = (x, head, lines, ag) => {
    card(s, x, 2.75, 2.2, 2.35, { ag });
    s.text(head, { x: x + 0.2, y: 2.87, w: 1.9, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag });
    s.text(lines, { x: x + 0.2, y: 3.2, w: 1.85, h: 1.85, size: 11.5, color: WHITE, lineSpacingMultiple: 1.1, ag });
  };
  io(L, "ВХОД", [br("Вопрос на естественном языке"), br(" "), run("Профиль: студент (группа), преподаватель, гость", { color: MUTED })], 2);
  io(R - 2.2, "ВЫХОД", [br("Краткий ответ"), br(" "), run("Ссылки на источники (страницы и документы ПсковГУ)", { color: MUTED })], 4);
  s.text("→", { x: L + 2.2, y: 3.6, w: 0.6, h: 0.6, size: 28, bold: true, color: ACC, align: "center", ag: 2 });
  s.text("→", { x: R - 2.8, y: 3.6, w: 0.6, h: 0.6, size: 28, bold: true, color: ACC, align: "center", ag: 4 });
  // system box
  const sx = 3.55, sw = 6.23, sy = 2.55, sh = 2.75;
  s.rect({ x: sx, y: sy, w: sw, h: sh, fill: "141A2E", line: ACC, lineW: 1.5, radius: 0.12, ag: 3 });
  s.text("СИСТЕМА", { x: sx + 0.2, y: sy + 0.1, w: 3, h: 0.3, size: 10, bold: true, color: ACC2, charSpacing: 2, ag: 3 });
  const sub = (x, y, w, h, t, d, ag) => {
    s.rect({ x, y, w, h, fill: CARD2, line: LINE, radius: 0.08, ag });
    s.text([br(t, { bold: true, color: WHITE, size: 12 }), run(d, { color: MUTED, size: 10 })], { x: x + 0.12, y, w: w - 0.24, h, align: "center", valign: "middle", lineSpacingMultiple: 1.05, ag });
  };
  sub(sx + 0.25, sy + 0.5, 2.6, 1.0, "Offline-пайплайн", "сбор, извлечение, OCR, нарезка, индексация", 3);
  sub(sx + sw - 2.85, sy + 0.5, 2.6, 1.0, "Online-сервис", "поиск, reranking, LLM, чат, виджет", 3);
  sub(sx + 1.6, sy + 1.72, sw - 3.2, 0.82, "База знаний", "FAISS (≈50 000 векторов) + SQLite", 3);
  s.line({ x1: sx + 1.55, y1: sy + 1.5, x2: sx + 2.2, y2: sy + 1.72, color: ACC, width: 1.25, ag: 3 });
  s.line({ x1: sx + sw - 1.55, y1: sy + 1.5, x2: sx + sw - 2.2, y2: sy + 1.72, color: ACC, width: 1.25, ag: 3 });
  // environment, constraints, criteria
  const blk = (x, y, w, head, col, body, ag) => {
    card(s, x, y, w, 1.3, { ag });
    s.text(head, { x: x + 0.2, y: y + 0.1, w: w - 0.3, h: 0.28, size: 10, bold: true, color: col, charSpacing: 2, ag });
    s.text(body, { x: x + 0.2, y: y + 0.4, w: w - 0.35, h: 0.85, size: 10.5, color: WHITE, lineSpacingMultiple: 1.05, ag });
  };
  const bw = (CW - 0.4) / 3;
  blk(L, 5.5, bw, "ВНЕШНЯЯ СРЕДА", ACC2, "Пользователи и администратор · сайты ПсковГУ (источник данных) · сервис расписания rasp.pskgu.ru", 5);
  blk(L + bw + 0.2, 5.5, bw, "ОГРАНИЧЕНИЯ", WARN, "Локальный контур, 152-ФЗ · видеокарта RTX 3060 (12 ГБ) · русский язык, сканы, таблицы", 5);
  blk(L + 2 * (bw + 0.2), 5.5, bw, "КРИТЕРИИ КАЧЕСТВА", OK, "Верность ответа и источники · нет галлюцинаций · поиск ≤ 3–5 с, ответ ≤ 60 с", 5);
  slides.push(s);
}

// ===================================================================== 5. ARCHITECTURE & DATA
{
  const s = new Slide({ notes:
`Теперь — как это устроено. Слева общая архитектура из диплома.
Справа — offline-пайплайн в цифрах. Сначала система собирает стартовые ссылки из карты сайта и поиска — около 12 тысяч адресов. Затем обходит страницы — больше 40 тысяч. Потом скачивает документы — получилось 543 963 файла общим объёмом 468 гигабайт. Из них извлекается текст: для PDF сделан каскад из четырёх библиотек, для сканов — распознавание через Tesseract, а для таблиц с объединёнными ячейками, например проходных баллов, — отдельный парсер. Текст режется на фрагменты — около 50 тысяч, — и каждый превращается в вектор моделью bge-m3 и попадает в индекс FAISS.
Важная деталь — прослеживаемость: для каждого фрагмента хранится, из какого документа и с какой страницы он взят. Поэтому система всегда может показать источник.
Стек: Python, FastAPI для чата, Flask для админки, SQLite, FAISS, языковая модель подключается через Ollama — это Qwen или GPT-OSS.` });
  chrome(s, 5, "АРХИТЕКТУРА И ДАННЫЕ");
  title(s, "Архитектура: два контура и одна база знаний");
  const aw = 6.75, ah = aw * 818 / 1428;
  s.rect({ x: L - 0.05, y: 1.9 - 0.05, w: aw + 0.1, h: ah + 0.1, fill: "FFFFFF", radius: 0.08, shadow: true, ag: 1 });
  s.img(A("arch.png"), { x: L, y: 1.9, w: aw, h: ah, ag: 1 });
  s.text("Общая архитектура системы (рисунок из ВКР)", { x: L, y: 1.9 + ah + 0.1, w: aw, h: 0.3, size: 9.5, color: MUTED, ag: 1 });
  // funnel
  const fx = 7.75, fw = R - fx;
  s.text("OFFLINE-ПАЙПЛАЙН В ЦИФРАХ", { x: fx, y: 1.88, w: fw, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 2 });
  const fun = [["≈ 12 000", "стартовых URL (sitemap + поиск)"], ["40 000+", "веб-страниц, ≈ 26 ГБ"], ["543 963", "файла, 468 ГБ"], ["≈ 50 000", "чанков (49 731)"], ["FAISS", "векторы bge-m3, ≈ 450 МБ"]];
  fun.forEach(([v, d], i) => {
    const y = 2.25 + i * 0.66, inset = i * 0.16, ag = 2 + Math.floor(i / 2);
    s.rect({ x: fx + inset, y, w: fw - 2 * inset, h: 0.56, fill: i === 4 ? "17213A" : CARD, line: i === 4 ? ACC : LINE, radius: 0.08, ag });
    s.text([run(v + "  ", { bold: true, color: i === 4 ? ACC2 : WHITE, size: 15 }), run(d, { color: MUTED, size: 10.5 })], { x: fx + inset + 0.2, y, w: fw - 2 * inset - 0.3, h: 0.56, valign: "middle", ag });
  });
  s.text([run("Изюминки: ", { bold: true, color: OK }), run("каскад из 4 библиотек для PDF + OCR сканов · парсер таблиц с объединёнными ячейками · у каждого фрагмента сохранён путь к источнику", { color: WHITE })],
    { x: fx, y: 5.62, w: fw, h: 0.75, size: 10.5, lineSpacingMultiple: 1.05, ag: 5 });
  const stack = ["Python", "FastAPI", "Flask", "SQLite", "FAISS", "BAAI/bge-m3", "Tesseract", "Ollama · Qwen / GPT-OSS"];
  let x = L;
  stack.forEach((t) => { const w = 0.35 + t.length * 0.085; chip(s, t, x, 6.47, w, { ag: 6, size: 10 }); x += w + 0.1; });
  slides.push(s);
}

// ===================================================================== 6. HOW IT ANSWERS (DEMO)
{
  const s = new Slide({ notes:
`Как система отвечает на конкретный вопрос — цепочка сверху.
Пользователь пишет вопрос, например «проходной балл 09 03 03». Вопрос превращается в вектор той же моделью bge-m3. В индексе FAISS ищутся десять самых близких по смыслу фрагментов с порогом релевантности 0,3. Дальше они проверяются по базе: администратор мог исключить фрагмент или исправить его текст — и это учитывается без переиндексации. Отобранные фрагменты вместе со строгими правилами попадают в промпт языковой модели, и ответ выводится пользователю постепенно, по мере генерации.
На скриншоте слева — реальный ответ: таблица проходных баллов за пять лет и три источника со ссылками на страницы ПсковГУ. Вопросы о расписании идут отдельным маршрутом — система обращается напрямую к сервису rasp.pskgu.ru, чтобы данные были актуальными.
Справа — админ-панель: здесь видно базу знаний, все запросы пользователей, и можно править или исключать фрагменты.` });
  chrome(s, 6, "КАК ЭТО РАБОТАЕТ");
  title(s, "Как система отвечает на вопрос");
  const steps = [["Вопрос", "+ профиль"], ["Эмбеддинг", "bge-m3"], ["Поиск", "top-10 в FAISS"], ["Фильтр", "правки админа"], ["LLM", "промпт + правила"], ["Ответ", "+ источники"]];
  const sw = (CW - 5 * 0.28) / 6;
  steps.forEach(([a, b], i) => {
    const x = L + i * (sw + 0.28), ag = 1 + Math.floor(i / 2), last = i === 5;
    s.rect({ x, y: 1.85, w: sw, h: 0.78, fill: last ? "123026" : CARD, line: last ? OK : LINE, radius: 0.1, ag });
    s.text([br(a, { bold: true, color: last ? OK : WHITE, size: 13 }), run(b, { color: MUTED, size: 10 })], { x, y: 1.85, w: sw, h: 0.78, align: "center", valign: "middle", ag });
    if (i < 5) s.text("›", { x: x + sw, y: 1.9, w: 0.28, h: 0.62, size: 22, bold: true, color: ACC, align: "center", ag });
  });
  const w1 = 6.95, h1 = w1 * 729 / 1439;
  shot(s, "answer.png", L, 3.0, w1, h1, { cap: "Реальный ответ: проходные баллы 09.03.03 за 2021–2025 и 3 источника со ссылками", ag: 4 });
  const x2 = L + w1 + 0.35, w2 = R - x2, h2 = w2 * 733 / 1439;
  shot(s, "admin.png", x2, 3.0, w2, h2, { cap: "Админ-панель: 49 731 чанк, аудит запросов", ag: 5 });
  card(s, x2, 3.0 + h2 + 0.5, w2, 1.0, { fill: "17213A", line: ACC, ag: 5 });
  s.text([run("Расписание ", { bold: true, color: ACC2 }), run("— отдельный маршрут: живой запрос к rasp.pskgu.ru, ответ под группу или преподавателя из профиля", { color: WHITE })],
    { x: x2 + 0.2, y: 3.0 + h2 + 0.55, w: w2 - 0.35, h: 0.9, size: 10.5, valign: "middle", lineSpacingMultiple: 1.05, ag: 5 });
  slides.push(s);
}

// ===================================================================== 7. RESULTS
{
  const s = new Slide({ notes:
`Как я проверял качество. Было пилотное тестирование: 30 вопросов в шести категориях — общие вопросы о вузе, нормативные документы, вопросы абитуриентов, расписание, вопросы-ловушки и вопросы с синонимами, сокращениями и опечатками. Каждый ответ сверялся с официальными страницами и оценивался по шкале от 1 до 10.
Итог — 254 балла из 300, то есть в среднем 8,47 из 10, или почти 85 процентов. Лучше всего система справилась с абитуриентскими вопросами — 9,2: там данные структурированы в таблицах. Слабее всего — расписание и вопросы с опечатками и сокращениями, по 8 баллов.
Ошибки делятся на три группы: в базе просто нет ответа; поиск или маршрутизация выбрали не тот сценарий — например, вопрос о расписании в гостевом режиме; и лишние обобщения самой модели. При этом на вопрос о проходном балле на 2026 год система правильно ответила, что данных ещё нет. После анализа я доработал системный промпт: без профиля система больше не пытается дать персональный ответ, а при нехватке данных честно говорит об этом, а не угадывает.
Честно называю и ограничения: маленькая выборка, оценивал я сам, и не было сравнения с моделью без поиска.` });
  chrome(s, 7, "ЭКСПЕРИМЕНТАЛЬНАЯ ПРОВЕРКА");
  title(s, "Результаты пилотного тестирования");
  card(s, L, 1.9, 3.3, 2.75, { fill: "123026", line: OK, ag: 1 });
  s.text("8,47", { x: L + 0.25, y: 2.0, w: 2.2, h: 1.0, size: 54, bold: true, color: OK, ag: 1 });
  s.text("/ 10", { x: L + 2.1, y: 2.42, w: 1.1, h: 0.5, size: 20, color: OK, ag: 1 });
  s.text([br("254 из 300 баллов · 84,7 % · ±0,35", { bold: true, color: WHITE }), run("30 вопросов · 6 категорий · GPT-OSS 120B · top-K = 10 · оценка 1–10 по официальным страницам", { color: MUTED, size: 10 })],
    { x: L + 0.25, y: 3.08, w: 2.9, h: 1.3, size: 12, lineSpacingMultiple: 1.08, ag: 1 });
  // bar chart
  const cats = [["Абитуриентские", 9.2], ["Общие о вузе", 8.8], ["Ловушки", 8.6], ["Документы", 8.2], ["Расписание", 8.0], ["Синонимы, опечатки", 8.0]];
  const cx = 4.35, cwid = 4.5, y0 = 1.95, rowH = 0.37;
  s.text("СРЕДНИЙ БАЛЛ ПО КАТЕГОРИЯМ", { x: cx, y: y0 - 0.05, w: cwid, h: 0.3, size: 10, bold: true, color: ACC2, charSpacing: 2, ag: 2 });
  cats.forEach(([n, v], i) => {
    const y = y0 + 0.35 + i * rowH, bw = (cwid - 1.9) * (v - 6) / 4, ag = 2;
    s.text(n, { x: cx, y, w: 1.75, h: 0.32, size: 10.5, color: WHITE, valign: "middle", ag });
    s.rect({ x: cx + 1.8, y: y + 0.04, w: cwid - 1.9, h: 0.24, fill: CARD, radius: 0.05, ag });
    s.rect({ x: cx + 1.8, y: y + 0.04, w: bw, h: 0.24, fill: v >= 8.6 ? OK : (v >= 8.2 ? ACC : WARN), radius: 0.05, ag });
    s.text(v.toFixed(1).replace(".", ","), { x: cx + 1.8 + bw + 0.06, y, w: 0.5, h: 0.32, size: 10.5, bold: true, color: WHITE, valign: "middle", ag });
  });
  s.text("шкала от 6 до 10", { x: cx + 1.8, y: y0 + 0.35 + 6 * rowH, w: 2, h: 0.25, size: 8.5, color: DIM, ag: 2 });
  // errors
  const ex = 9.2, ew = R - ex;
  s.text("ТИПЫ ОШИБОК", { x: ex, y: 1.9, w: ew, h: 0.3, size: 10, bold: true, color: ACC2, charSpacing: 2, ag: 3 });
  [["Данные", "в источниках нет прямого ответа"], ["Поиск и маршрут", "напр., расписание в гостевом режиме"], ["Генерация", "лишние обобщения модели"]].forEach(([h, d], i) => {
    const y = 2.25 + i * 0.75;
    card(s, ex, y, ew, 0.65, { ag: 3 });
    s.text([br(h, { bold: true, color: WHITE, size: 11.5 }), run(d, { color: MUTED, size: 9.5 })], { x: ex + 0.2, y, w: ew - 0.3, h: 0.65, valign: "middle", ag: 3 });
  });
  card(s, L, 4.9, 8.15, 1.88, { fill: "17213A", line: ACC, ag: 4 });
  s.text("ЧТО СДЕЛАНО ПО ИТОГАМ", { x: L + 0.25, y: 5.0, w: 5, h: 0.3, size: 10, bold: true, color: ACC2, charSpacing: 2, ag: 4 });
  s.text([br("Доработан системный промпт: без профиля система не даёт персональных ответов, а при нехватке данных честно сообщает об этом, а не угадывает.", { color: WHITE }),
    run("Пример верного поведения: на вопрос о проходном балле 2026 года система указала, что данные ещё не опубликованы.", { color: MUTED })],
  { x: L + 0.25, y: 5.32, w: 7.65, h: 1.4, size: 12, lineSpacingMultiple: 1.1, ag: 4 });
  card(s, ex, 4.9, ew, 1.88, { fill: "2A1A1E", line: BAD, ag: 5 });
  s.text("ОГРАНИЧЕНИЯ", { x: ex + 0.2, y: 5.0, w: ew - 0.3, h: 0.3, size: 10, bold: true, color: BAD, charSpacing: 2, ag: 5 });
  s.text("· всего 30 вопросов\n· оценивал сам автор\n· нет сравнения с LLM без поиска\n· нет полного перетеста после доработки", { x: ex + 0.2, y: 5.32, w: ew - 0.3, h: 1.4, size: 11, color: WHITE, lineSpacingMultiple: 1.12, ag: 5 });
  slides.push(s);
}

// ===================================================================== 8. CONCLUSIONS / NEXT
{
  const s = new Slide({ notes:
`Подведу итоги. Цель работы достигнута: создан рабочий программный комплекс, который проходит весь путь от автоматического сбора данных с сайтов университета до ответа пользователю с указанием источников. Всё работает локально, поэтому данные никуда не уходят и требования 152-ФЗ соблюдаются. Систему можно использовать как отдельный сайт или как виджет прямо на страницах ПсковГУ, а администратор может управлять качеством базы знаний.
Что можно развивать дальше — это и есть задел для магистерской работы. Во-первых, строгая оценка: сравнить систему с языковой моделью без поиска и ввести автоматические метрики качества RAG. Во-вторых, расширить тестовый набор и привлечь нескольких экспертов. В-третьих, инкрементальное обновление базы знаний, чтобы не пересобирать индекс целиком. В-четвёртых, более умная маршрутизация запросов, вплоть до агентного подхода. И в перспективе — официальное внедрение в университете и перенос решения в другие организации.
Спасибо за внимание! Готов ответить на вопросы.` });
  chrome(s, 8, "ИТОГИ И ПЕРСПЕКТИВЫ");
  title(s, "Итоги и что дальше");
  const done = [["Цель достигнута", "рабочий комплекс: от сбора данных до ответа с источниками"], ["Полностью локально", "данные не покидают вуз — соответствие 152-ФЗ"],
    ["Встраивается в сайт", "отдельное веб-приложение или виджет на pskgu.ru"], ["Управляемое качество", "админ-панель: правка и исключение фрагментов, аудит запросов"]];
  s.text("ИТОГИ", { x: L, y: 1.88, w: 5, h: 0.3, size: 10.5, bold: true, color: OK, charSpacing: 2, ag: 1 });
  done.forEach(([h, d], i) => {
    const y = 2.25 + i * 1.02, ag = 1 + Math.floor(i / 2);
    card(s, L, y, 5.75, 0.9, { ag });
    s.text("✓", { x: L + 0.15, y, w: 0.5, h: 0.9, size: 20, bold: true, color: OK, valign: "middle", ag });
    s.text([br(h, { bold: true, color: WHITE, size: 13 }), run(d, { color: MUTED, size: 10.5 })], { x: L + 0.65, y, w: 5.0, h: 0.9, valign: "middle", ag });
  });
  const x2 = 6.85, w2 = R - x2;
  card(s, x2, 1.88, w2, 4.95, { fill: "17213A", line: ACC, ag: 3 });
  s.text("ПЕРСПЕКТИВЫ → ЗАДЕЛ ДЛЯ МАГИСТРАТУРЫ", { x: x2 + 0.3, y: 2.02, w: w2 - 0.5, h: 0.3, size: 10.5, bold: true, color: ACC2, charSpacing: 2, ag: 3 });
  const nx = [["Строгая оценка", "сравнение с LLM без поиска, автоматические метрики качества RAG"], ["Больше данных для теста", "расширенный набор вопросов, несколько экспертов"],
    ["Живая база знаний", "инкрементальное обновление индекса без полной пересборки"], ["Умная маршрутизация", "агентный подход к выбору сценария ответа"], ["Внедрение", "официальный запуск в ПсковГУ и перенос в другие организации"]];
  nx.forEach(([h, d], i) => {
    const y = 2.45 + i * 0.8, ag = 3 + Math.floor(i / 3);
    s.text(String(i + 1).padStart(2, "0"), { x: x2 + 0.3, y, w: 0.6, h: 0.5, size: 18, bold: true, color: ACC, ag });
    s.text([br(h, { bold: true, color: WHITE, size: 12.5 }), run(d, { color: MUTED, size: 10.5 })], { x: x2 + 0.95, y: y - 0.02, w: w2 - 1.2, h: 0.75, lineSpacingMultiple: 1.03, ag });
  });
  s.text("Спасибо за внимание!", { x: L, y: 6.38, w: 5.75, h: 0.5, size: 22, bold: true, color: ACC2, ag: 5 });
  slides.push(s);
}

// ---------------------------------------------------------------- output
async function main() {
  const pptxgen = req("pptxgenjs"), JSZip = req("jszip");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Интеллектуальная справочная система ПсковГУ на основе RAG и LLM";
  pres.author = "Мейер-Шишнёв В. А.";
  toPptx(pres, slides);
  const zip = await JSZip.loadAsync(await pres.write({ outputType: "nodebuffer" }));
  await injectTiming(zip, slides);
  const out = path.join(__dirname, "../../exports/vkr-rag-pskgu.pptx");
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("wrote", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB", slides.length, "slides");
  const heads = ["Титул", "Проблема и актуальность", "Цель, объект, предмет, задачи", "Система глазами системного анализа", "Архитектура и данные",
    "Как система отвечает на вопрос", "Результаты тестирования", "Итоги и перспективы"];
  let md = "# Текст выступления: ВКР «Интеллектуальная справочная система ПсковГУ на основе RAG и LLM»\n\n" +
    "Курс «Системный анализ и моделирование интеллектуальных систем». 8 слайдов, ≈ 7 минут. Этот же текст — в заметках докладчика в .pptx.\n";
  slides.forEach((s, i) => { md += `\n## Слайд ${i + 1} — ${heads[i]}\n\n${s.notes.trim()}\n`; });
  fs.writeFileSync(path.join(__dirname, "../../exports/vkr-rag-pskgu-tekst.md"), md);
  if (process.argv.includes("--preview")) await preview();
}

async function preview() {
  const pages = toHtml(slides, path.join(__dirname, "assets"), path.join(SCH, "node_modules/@fontsource"));
  const outDir = path.join(__dirname, "preview");
  fs.mkdirSync(outDir, { recursive: true });
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
