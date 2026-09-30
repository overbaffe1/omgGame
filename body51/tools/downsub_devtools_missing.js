// === Субтитры стримов @body51 через downsub.com (только недостающие 24) ===
// 1) Открой https://downsub.com в Chrome
// 2) F12 -> Console -> вставь ВЕСЬ скрипт -> Enter (если Chrome попросит "allow pasting" — впиши allow pasting)
// 3) Если спросит "Разрешить скачивание нескольких файлов" — Разрешить
// Итог: в конце скачается ОДИН файл body51_subs.txt со всеми текстами.
// Стоп: window.STOP = true. Досохранить в любой момент: body51Dump(). Повторный запуск продолжит с места.
(async () => {
  const VIDS = [[1, "k77G1GZdXtg", "День 93. Вайбкодирую Steam игры, чтобы заработать 1,000,000$ | Заработал: 296$ |"], [7, "-Ks2e1XNglM", "Делаю Steam игры на Unity с помощью вайбкода. ChatGPT 6 Astra - Codex."], [52, "jjDyBzns8Zk", "Делаю Steam игры на Unity с помощью вайбкода. ChatGPT 5.6 Codex."], [66, "7nfuEg14beY", "Делаю Steam игры на Unity с помощью вайбкода. GPT 5.5 Codex."], [80, "oKDZswxYu4s", "Делаю Steam игры на Unity с помощью вайбкода. GPT 5.5 Codex."], [83, "ZsaYCzR0XvQ", "Делаю Steam игры на Unity с помощью вайбкода. GPT 5.5 Codex."], [124, "mV_V9bIPKMQ", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 284."], [134, "jnOUow0dpfs", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 275."], [135, "_ZcYnRazyCs", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 275."], [188, "4X7igAoSAEk", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 227."], [204, "5-J4VoJm_Lc", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 212."], [205, "VQ4xCyS_KG4", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 211."], [230, "4rT4E3OuUUs", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 187."], [231, "Kqeo431pZFo", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 186."], [289, "zr7f1F8zMT8", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 132."], [303, "iuSPiMt8WsI", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 118."], [363, "9YReAoPnZvo", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 60."], [364, "c7TZLmP9TuA", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 59."], [365, "g5tc2yNs6_Y", "Backpack Inspector. Делаю свою игру в Steam на Unity. День 58 2/2."], [429, "bGw--hgBzG0", "Геймдев эксгибиционизм. Делаю инди хоррор на Unity."], [430, "SUrVhDe1zkQ", "Геймдев эксгибиционизм. Делаю инди хоррор на Unity."], [431, "qObGiw62joE", "Геймдев эксгибиционизм. Делаю инди хоррор на Unity."], [467, "7dMddHK75M0", "Геймдев эксгибиционизм. Делаю инди хоррор на Unity."], [474, "VOTYgmvkhQo", "Геймдев эксгибиционизм. Разрабатываю игры на Unity."]];
  const PARALLEL = 3, TIMEOUT = 120000, KEY = "body51_subs";
  const store = JSON.parse(localStorage.getItem(KEY) || "{}");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clean = t => t.replace(/<[^>]+>/g, "").replace(/\r/g, "");
  function dump(sfx = "") {
    const out = VIDS.filter(v => store[v[1]]).map(([n, id, t]) =>
      `\n\n===== ${String(n).padStart(3, "0")} ${id} | ${t}\n===== https://youtu.be/${id}\n\n${store[id]}`).join("");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], { type: "text/plain;charset=utf-8" }));
    a.download = `body51_subs${sfx}.txt`; a.click();
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { console.warn("localStorage переполнен — сохраняю часть в файл"); dump("_part" + Date.now()); } };
  window.body51Dump = dump;

  async function grab(id) {
    const fr = document.createElement("iframe");
    fr.style.cssText = "width:900px;height:600px;position:fixed;left:-3000px;top:0";
    fr.src = "https://downsub.com/?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id);
    document.body.appendChild(fr);
    try {
      await new Promise(r => fr.onload = r);
      const w = fr.contentWindow, d = fr.contentDocument;
      let captured = null;
      // перехват "скачивания" внутри iframe -> забираем текст
      const oc = w.URL.createObjectURL.bind(w.URL);
      w.URL.createObjectURL = b => { if (b && b.text) b.text().then(t => captured = t); return oc(b); };
      const ac = w.HTMLAnchorElement.prototype.click;
      w.HTMLAnchorElement.prototype.click = function () {
        const h = this.href || "";
        if (/^(blob|data):/.test(h)) { fetch(h).then(r => r.text()).then(t => captured = t).catch(() => {}); return; }
        if (/^http/.test(h)) { fetch(h).then(r => r.text()).then(t => captured = t).catch(() => ac.call(this)); return; }
        return ac.call(this);
      };
      const t0 = Date.now(); let btn = null;
      while (!btn && Date.now() - t0 < TIMEOUT) {
        btn = d.querySelector('button[data-title="[TXT] Russian (auto-generated)"]')
           || d.querySelector('button[data-title^="[TXT] Russian"]')
           || d.querySelector('button[data-title^="[TXT]"]');
        if (!btn && d.body && /not found or unavailable/i.test(d.body.innerText)) return null;
        await sleep(700);
      }
      if (!btn) return null;
      btn.click();
      const t1 = Date.now();
      while (!captured && Date.now() - t1 < TIMEOUT) await sleep(500);
      return captured ? clean(captured) : null;
    } finally { fr.remove(); }
  }

  const queue = VIDS.filter(v => !store[v[1]]);
  console.log(`Всего ${VIDS.length}. Уже есть: ${VIDS.length - queue.length}. Качаю: ${queue.length}`);
  const fail = []; let ok = 0;
  async function worker() {
    while (queue.length && !window.STOP) {
      const [n, id, title] = queue.shift();
      let txt = null;
      for (let a = 0; a < 2 && !txt; a++) { try { txt = await grab(id); } catch (e) {} }
      if (txt && txt.length > 50) { store[id] = txt; save(); ok++; console.log(`✓ ${n} ${id} (${txt.length} симв.) — ${ok}/${VIDS.length}`); }
      else { fail.push(`${n} ${id}`); console.warn(`✗ ${n} ${id} ${title}`); }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  console.log(`Готово: ${Object.keys(store).length}/${VIDS.length}. Не вышло (${fail.length}):`, fail);
  dump();
})();
