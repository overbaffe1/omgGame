// body51_timing.mjs — общий расчёт хронометража мультфильма «Вайбкодер из Мурманска».
// Длительность главы = подводка + закадровый текст + воздух; титры гэга и финала — фиксированные.
export const LEAD = 1.2;     // тишина до начала реплики рассказчика
export const TAIL = 1.7;     // воздух после реплики
export const NARR_AT = 0.6;  // насколько реплика отстаёт от начала главы
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

export function computeTiming({ durations = {}, texts = {} } = {}) {
  let t = 0;
  const scenes = SCENES.map(d => {
    const nar = d.narr ? durations[d.id] : null;
    const dur = d.fixed ? d.nom
      : Math.max(MIN_DUR, LEAD + (nar || durations[d.id] || d.nom) + TAIL);
    const o = {
      id: d.id, start: +t.toFixed(2), dur: +dur.toFixed(2),
      narr: d.narr, narrDur: d.narr ? +(dur - LEAD - TAIL).toFixed(2) : 0, narrAt: NARR_AT,
      narrText: d.narr ? (texts[d.id] || '') : '',
    };
    t += dur;
    return o;
  });
  return { version: 1, total: +t.toFixed(2), rate: RATE, scenes };
}

export function toJs(timing, note = '') {
  const head = `// body51-timing.js — собран автоматически (film/tools/build_body51_timing.mjs).\n` +
    `${note ? '// ' + note + '\n' : ''}`;
  return head + 'window.BODY51_TIMING=' + JSON.stringify(timing, null, 1) + ';\n';
}
