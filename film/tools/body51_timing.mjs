// body51_timing.mjs — общий расчёт хронометража мультфильма «Вайбкодер из Мурманска».
// Длительность главы = подводка + закадровый текст + воздух; титры гэга и финала — фиксированные.
export const LEAD = 1.2;     // тишина до начала реплики рассказчика
export const TAIL = 1.7;     // воздух после реплики
export const NARR_AT = 0.6;  // насколько реплика отстаёт от начала главы
export const QGAP = 0.9;      // пауза между рассказчиком и блоком цитат
export const QAT = 0.35;      // насколько блок цитат отстаёт от своего начала
export const MIN_DUR = 12;
export const RATE = 12.7;    // символов в секунду — калибровка по голосам «Анатомии страсти»

export const SCENES = [
  { id: 'polar',    narr: 'n01', nom: 34 },
  { id: 'cat',      narr: 'n02', nom: 26 },
  { id: 'workshop', narr: 'n03', nom: 32 },
  { id: 'stream',   narr: 'n04', nom: 28 },
  { id: 'caravan',  narr: 'n05', nom: 26 },
  { id: 'limits',   narr: 'n06', nom: 32 },
  { id: 'gag',      narr: null,  nom: 18, fixed: true },
  { id: 'burnout',  narr: 'n07', nom: 28 },
  { id: 'release',  narr: 'n08', nom: 30 },
  { id: 'wishlist', narr: 'n09', nom: 34 },
  { id: 'finale',   narr: 'n10', nom: 28 },
  { id: 'credits',  narr: null,  nom: 14, fixed: true },
];

export function estimate(text) {
  const pauses = (text.match(/[.,;:!?—-]/g) || []).length * 0.28;
  return text.length / RATE + pauses;
}

export function computeTiming({ durations = {}, texts = {}, quotes = {}, quoteTexts = {}, quoteLines = {}, quoteWho = {},
                               narrSpecs = {}, quoteSpecs = {},
                               narrIds = null,       // карта «глава → id озвучки» (для нарезок)
                               subset = null,        // список глав (для минутной нарезки)
                               lead = LEAD, tail = TAIL, qgap = QGAP, minDur = MIN_DUR } = {}) {
  let t = 0;
  const list = subset ? SCENES.filter(d => subset.includes(d.id)) : SCENES;
  const scenes = list.map(d => {
    const nsp = d.narr ? (narrSpecs[d.id] || null) : null;                       // замер речи рассказчика
    const narrSpeech = nsp ? nsp.speech : (d.narr ? (durations[d.id] || d.nom) : 0);
    const narrOnset  = nsp ? nsp.onset : 0;                                      // тишина в начале файла
    const narrAt = +(lead - narrOnset).toFixed(3);                               // где ставить файл, чтобы речь началась ровно в lead
    const qv = quotes[d.id];
    const hasQuote = qv != null;
    const qsp = quoteSpecs[d.id] || null;
    const quoteSpeech = qsp ? qsp.speech : (hasQuote ? (typeof qv === 'number' ? qv : qv.dur) : 0);
    const body = narrSpeech + (hasQuote ? qgap + quoteSpeech : 0);                // без тишины в файлах
    const dur = (d.fixed && !subset) ? d.nom : Math.max(minDur, lead + body + tail);
    const shift = (seg, off) => (seg || []).map(g => ({ t0: +(off + g.t0).toFixed(2), t1: +(off + g.t1).toFixed(2), text: g.text }));
    const o = {
      id: d.id, start: +t.toFixed(2), dur: +dur.toFixed(2),
      narr: (narrIds && d.narr) ? (narrIds[d.id] || d.narr) : d.narr, narrAt, narrDur: nsp ? +nsp.dur.toFixed(2) : (d.narr ? +(durations[d.id] || 0).toFixed(2) : 0),
      narrText: d.narr ? (texts[d.id] || '') : '',
      narrOn: +(lead).toFixed(2),                                                 // речь рассказчика стартует здесь
      narrOff: +(lead + narrSpeech).toFixed(2),
      narrSeg: nsp ? shift(nsp.seg, narrAt) : null,
      quote: null,
    };
    if (hasQuote) {
      const quoteAt = +(lead + narrSpeech + qgap - (qsp ? qsp.onset : 0)).toFixed(3);
      o.quote = {
        id: (typeof qv === 'object' && qv.id) || null,
        at: quoteAt,
        on: +(lead + narrSpeech + qgap).toFixed(2),
        off: +(lead + narrSpeech + qgap + quoteSpeech).toFixed(2),
        dur: qsp ? +qsp.dur.toFixed(2) : (typeof qv === 'number' ? qv : qv.dur),
        text: quoteTexts[d.id] || '', lines: quoteLines[d.id] || [], who: quoteWho[d.id] || '',
        seg: qsp ? shift(qsp.seg, quoteAt) : null,
        voiced: true,
      };
    }
    t += dur;
    return o;
  });
  return { version: 3, total: +t.toFixed(2), rate: RATE, subset: subset || null, scenes };
}

export function toJs(timing, note = '') {
  const head = `// body51-timing.js — собран автоматически (film/tools/build_body51_timing.mjs).\n` +
    `${note ? '// ' + note + '\n' : ''}`;
  return head + 'window.BODY51_TIMING=' + JSON.stringify(timing, null, 1) + ';\n';
}
