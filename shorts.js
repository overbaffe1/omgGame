const v = document.getElementById("v");
const play = document.getElementById("play");
function start() {
  v.controls = true;
  play.hidden = true;
  const p = v.play();
  if (p) p.catch(() => {});
}
if (play) play.addEventListener("click", start);
if (v) {
  v.addEventListener("play", () => { play.hidden = true; v.controls = true; });
  v.addEventListener("loadedmetadata", () => {
    const el = document.getElementById("dur");
    if (el && isFinite(v.duration)) el.textContent = Math.round(v.duration) + " сек";
  });
}
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = document.getElementById(btn.dataset.copy).innerText;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    const old = btn.textContent;
    btn.textContent = "скопировано";
    setTimeout(() => { btn.textContent = old; }, 1200);
  });
});
