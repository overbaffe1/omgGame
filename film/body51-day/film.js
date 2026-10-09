/* One day of @body51 — a new, deterministic 2D short.
 * No projected textures, 3D engine, external art or shared-player side effects.
 * Browser and offline renderer call the very same draw(time) function.
 * Composition: header 64–405; action 64–1455; captions 1515–1685.
 */
(function (root) {
  'use strict';
  const W = 1080, H = 1920, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = t => t * t * (3 - 2 * t);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const C = {ink: '#293b3c', paper: '#f4eedf', white: '#fffaf0', coral: '#e96e50', blue: '#5275b8', navy: '#324757', teal: '#16877d', mint: '#bad7c1', yellow: '#edbf5c', wood: '#c18d62', skin: '#efc6a3', hair: '#d6ad66', pink: '#d9a39c'};

  function create(canvas, data) {
    const g = canvas.getContext('2d');
    let bounds = [], textBoxes = [], current, now = 0;
    const scale = canvas.width / W;
    function fill(col) { g.fillStyle = col; g.fill(); }
    function stroke(col = C.ink, width = 5) { g.strokeStyle = col; g.lineWidth = width; g.stroke(); }
    function shape(fn, col, outline = C.ink, width = 5) {
      g.beginPath(); fn(g); if (col) fill(col); if (outline && width) stroke(outline, width);
    }
    function box(x, y, w, h, r, col, outline = C.ink, width = 5) {
      shape(p => p.roundRect(x, y, w, h, r), col, outline, width);
    }
    function oval(x, y, rx, ry, col, outline = null, width = 5, angle = 0) {
      shape(p => p.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), angle, 0, TAU), col, outline, width);
    }
    function line(points, col = C.ink, width = 5) {
      shape(p => { points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); }, null, col, width);
    }
    function poly(points, col, outline = C.ink, width = 5) {
      shape(p => { points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); }, col, outline, width);
    }
    function label(str, x, y, size = 32, col = C.ink, weight = 700, align = 'center', maxWidth = 920) {
      g.textAlign = align; g.textBaseline = 'alphabetic';
      g.font = `${weight} ${size}px Manrope, sans-serif`;
      const natural = g.measureText(str).width;
      if (natural > maxWidth) { size *= maxWidth / natural; g.font = `${weight} ${size}px Manrope, sans-serif`; }
      g.fillStyle = col; g.fillText(str, x, y);
      const m = g.measureText(str), transform = g.getTransform();
      const left = align === 'center' ? x - m.width / 2 : align === 'right' ? x - m.width : x;
      // Screen-space text safety is tested for unrotated type (header/captions).
      if (Math.abs(transform.b) < .001 && Math.abs(transform.c) < .001) {
        textBoxes.push({text: str, size, x: (left * transform.a + transform.e) / scale, y: ((y - size) * transform.d + transform.f) / scale, w: m.width * transform.a / scale, h: size * transform.d / scale});
      }
      return size;
    }
    function local(x, y, s, fn, rotation = 0) {
      g.save(); g.translate(x, y); g.rotate(rotation); g.scale(s, s); fn(); g.restore();
    }
    function asset(name, x, y, s, rect, fn, rotation = 0) {
      const [l, t, r, b] = rect;
      const cs = Math.cos(rotation), sn = Math.sin(rotation);
      const corners = [[l, t], [r, t], [r, b], [l, b]].map(([a, z]) => [x + s * (a * cs - z * sn), y + s * (a * sn + z * cs)]);
      bounds.push({name, x: Math.min(...corners.map(p => p[0])), y: Math.min(...corners.map(p => p[1])), right: Math.max(...corners.map(p => p[0])), bottom: Math.max(...corners.map(p => p[1]))});
      local(x, y, s, fn, rotation);
    }
    function tag(str, x, y, w, col = C.yellow, size = 27, angle = 0) {
      local(x, y, 1, () => { box(-w / 2, -31, w, 62, 13, col, C.ink, 3); label(str, 0, 10, size, C.ink, 800, 'center', w - 28); }, angle);
    }
    function sparkle(x, y, r, col = C.yellow, t = 0) {
      local(x, y, 1, () => poly([[0, -r], [r * .25, -r * .25], [r, 0], [r * .25, r * .25], [0, r], [-r * .25, r * .25], [-r, 0], [-r * .25, -r * .25]], col, null), t);
    }
    function shadow(x, y, w, h = 23) { oval(x, y, w, h, '#293b3c14'); }
    function floor(y = 1390, dark = false) {
      oval(540, y, 452, 53, dark ? '#182c3d' : '#dfdcc9');
      line([[102, y + 49], [979, y + 49]], dark ? '#536774' : '#c4caba', 3);
      line([[178, y + 62], [300, y + 62]], dark ? '#536774' : '#c4caba', 3);
    }
    function plant(x, y, s = 1) {
      local(x, y, s, () => {
        line([[0, -5], [4, -177]], '#477263', 7);
        for (let i = 0; i < 5; i++) { const d = i % 2 ? 1 : -1; oval(d * 26, -55 - i * 27, 34, 15, i % 2 ? '#4a846b' : '#799773', C.ink, 3, d * .5 + Math.sin(now * 1.6 + i) * .055); }
        poly([[-43, -43], [43, -43], [31, 17], [-30, 17]], C.coral, C.ink, 4);
        line([[-37, -28], [37, -28]], '#ffd3ad', 4);
      });
    }
    function windowView(x, y, w, h, t, night = false) {
      box(x, y, w, h, 76, night ? '#172c48' : '#bed8d3', C.ink, 6);
      g.save(); g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, h - 8, 72); g.clip();
      if (night) {
        oval(x + w * .68, y + 65, 34, 34, C.yellow);
        oval(x + w * .73, y + 55, 31, 31, '#172c48');
        for (let i = 0; i < 21; i++) oval(x + 16 + hash(i) * (w - 32), y + 18 + hash(i + 54) * (h * .6), 1.5 + hash(i + 3) * 1.6, 2, '#f3dfae');
      } else {
        oval(x + w * .73, y + 70, 42, 42, '#efd088');
        for (let i = 0; i < 3; i++) oval(x + 50 + i * 97 + Math.sin(t * .06) * 5, y + 100 + i * 17, 57, 15, '#e4ecdf');
      }
      for (let i = 0; i < 5; i++) {
        const bx = x - 16 + i * w / 4, by = y + h * (.54 + hash(i + 9) * .18);
        box(bx, by, w / 3.8, h, 0, night ? ['#263d53', '#304960'][i % 2] : ['#7c9b9c', '#8faaa7'][i % 2], null);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) box(bx + 12 + c * w / 9, by + 18 + r * 29, 13, 16, 2, night ? (hash(i * 35 + r * 2 + c) > .55 ? '#deb576' : '#355569') : '#cce0d6', null);
        box(bx - 2, by - 6, w / 3.8 + 4, 9, 4, night ? '#536878' : '#f5f4e5', null);
      }
      if (!night) for (let i = 0; i < 19; i++) oval(x + 10 + hash(i + 30) * (w - 20), y + 10 + ((hash(i + 70) * h + t * 11) % (h - 20)), 2.8, 2.8, '#fff8e8');
      g.restore();
      line([[x + w / 2, y + 8], [x + w / 2, y + h - 6]], night ? '#557482' : '#eaf0df', 9);
      box(x - 10, y + h - 2, w + 20, 18, 6, night ? '#547078' : '#e8dfca', C.ink, 4);
    }

    // Stylised likeness from the user's Screenshot_12.png: cropped light-brown
    // hair, high forehead, large salt-and-pepper beard, a black printed T-shirt.
    // This remains an illustration, not a face texture pasted onto a character.
    function artemFace(t, options = {}) {
      const sleepy = options.sleepy, puzzled = options.puzzled;
      const look = options.pose === 'type' ? 4 : options.pose === 'point' ? 5 : Math.sin(t * .8) * 1.6;
      g.save(); g.translate(0, -385 + Math.sin(t * 1.7) * 1.4);
      g.rotate(Math.sin(t * .9) * (puzzled ? .035 : .012)); g.translate(0, 385);
      for (const d of [-1, 1]) {
        oval(d * 77, -427, 14, 23, C.skin, C.ink, 4);
        shape(p => { p.moveTo(d * 79, -436); p.quadraticCurveTo(d * 86, -426, d * 78, -416); }, null, '#ba9376', 2.5);
      }
      shape(p => {
        p.moveTo(-67, -473); p.bezierCurveTo(-59, -521, 30, -530, 66, -488);
        p.quadraticCurveTo(85, -462, 78, -416); p.quadraticCurveTo(77, -354, 17, -340);
        p.quadraticCurveTo(-55, -340, -72, -398); p.quadraticCurveTo(-85, -445, -67, -473); p.closePath();
      }, C.skin, C.ink, 4.5);
      // Short brushed-up hair, receding temples and a visible forehead; no quiff.
      shape(p => {
        p.moveTo(-75, -415); p.lineTo(-82, -458); p.quadraticCurveTo(-83, -500, -50, -516);
        p.quadraticCurveTo(-5, -533, 43, -516); p.quadraticCurveTo(76, -506, 82, -469);
        p.lineTo(79, -416); p.lineTo(63, -429); p.lineTo(62, -462);
        p.quadraticCurveTo(52, -487, 38, -491); p.quadraticCurveTo(7, -510, -23, -497);
        p.quadraticCurveTo(-50, -495, -59, -459); p.lineTo(-60, -425); p.closePath();
      }, '#7b7054', C.ink, 4.5);
      for (let i = 0; i < 8; i++) {
        const x = -51 + i * 14, y = -506 - Math.sin(i / 7 * Math.PI) * 11;
        line([[x - 3, y + 8], [x + 2, y - 1]], i % 3 === 0 ? '#b4a177' : '#9b8c67', 3);
      }
      line([[-67, -469], [-66, -441]], '#a0936f', 3);
      // Gentle forehead creases and warm, less childlike cheeks.
      shape(p => { p.moveTo(-30, -464); p.quadraticCurveTo(0, -471, 31, -464); }, null, '#d7ac8b', 2);
      oval(-49, -399, 16, 8, '#e5b394'); oval(53, -399, 14, 8, '#e5b394');
      const blink = sleepy || t % 4.6 > 4.43;
      for (const d of [-1, 1]) {
        const ex = d * 29 + 2;
        const raise = puzzled && d === 1 ? -9 : Math.sin(t * .8 + d) * 1.3;
        shape(p => { p.moveTo(ex - 15, -444 + raise); p.quadraticCurveTo(ex, -451 + raise, ex + 15, -443 + raise); }, null, '#6c634b', 5);
        if (blink) shape(p => { p.moveTo(ex - 13, -424); p.quadraticCurveTo(ex, -417, ex + 13, -424); }, null, C.ink, 3.5);
        else {
          oval(ex, -423, 13, 12.5, '#fff4df'); oval(ex + look, -422, 5.8, 9, '#73909a');
          oval(ex + look + .6, -421, 2.8, 5.8, C.ink); oval(ex + look + 2, -425, 1.8, 2, C.white);
          shape(p => { p.moveTo(ex - 13, -426); p.quadraticCurveTo(ex, -439, ex + 13, -426); }, null, '#655b48', 2.5);
        }
        shape(p => { p.moveTo(ex - 10, -404); p.quadraticCurveTo(ex, -400, ex + 11, -405); }, null, '#cc9f7f', 2);
      }
      // A broader nose with a rounded tip, instead of the old little triangle.
      shape(p => { p.moveTo(5, -426); p.quadraticCurveTo(5, -407, 14, -397); p.quadraticCurveTo(15, -387, 3, -388); }, null, '#b98565', 3);
      shape(p => { p.moveTo(-7, -393); p.quadraticCurveTo(-1, -385, 8, -390); }, null, '#b98565', 2.5);
      // Full rounded beard, silver at the lower cheeks; follows the reference's
      // silhouette and overlaps the collar rather than becoming sparse stubble.
      shape(p => {
        p.moveTo(-73, -414); p.quadraticCurveTo(-57, -404, -54, -383);
        p.quadraticCurveTo(-34, -390, -17, -379); p.quadraticCurveTo(6, -386, 29, -378);
        p.quadraticCurveTo(52, -389, 69, -413); p.quadraticCurveTo(81, -384, 76, -357);
        p.quadraticCurveTo(84, -328, 65, -308); p.quadraticCurveTo(56, -284, 33, -279);
        p.quadraticCurveTo(8, -264, -14, -278); p.quadraticCurveTo(-44, -278, -58, -299);
        p.quadraticCurveTo(-82, -314, -78, -346); p.quadraticCurveTo(-87, -376, -73, -414); p.closePath();
      }, '#5d6457', C.ink, 4.5);
      shape(p => { p.moveTo(-65, -380); p.quadraticCurveTo(-80, -327, -44, -299); p.quadraticCurveTo(-57, -349, -40, -370); }, '#7e8370', null);
      shape(p => { p.moveTo(60, -377); p.quadraticCurveTo(72, -329, 39, -298); p.quadraticCurveTo(52, -344, 38, -368); }, '#737b68', null);
      shape(p => { p.moveTo(-25, -373); p.quadraticCurveTo(5, -388, 32, -372); p.quadraticCurveTo(36, -353, 7, -348); p.quadraticCurveTo(-23, -350, -25, -373); }, C.skin, null);
      if (sleepy) oval(4, -362, 11, 14, '#845c4c', C.ink, 2.5);
      else shape(p => { p.moveTo(-15, -363); p.quadraticCurveTo(6, puzzled ? -362 : -352, 26, -365); }, null, '#624f43', 3);
      // Moustache is drawn last so the mouth can emote without changing identity.
      shape(p => { p.moveTo(3, -384); p.quadraticCurveTo(-18, -390, -34, -372); p.quadraticCurveTo(-19, -365, 4, -378); p.quadraticCurveTo(21, -366, 38, -372); p.quadraticCurveTo(28, -388, 3, -384); }, '#625e48', null);
      for (let i = 0; i < 19; i++) {
        const row = Math.floor(i / 5), col = i % 5;
        const x = -48 + col * 22 + (row % 2) * 6, y = -348 + row * 17 + (i % 3) * 3;
        shape(p => { p.moveTo(x - 4, y - 4); p.quadraticCurveTo(x - 6, y + 7, x + 2, y + 9); }, null, i % 3 ? '#89917c' : '#a3a68d', 2.2);
      }
      g.restore();
    }

    function person(x, y, s, t, options = {}) {
      const hang = options.hang || 0, pose = options.pose || 'stand';
      const sleepy = options.sleepy || false, flip = options.flip ? -1 : 1;
      const sway = hang * Math.sin(t * 1.9) * .027;
      asset('Артём', x, y, s, [-188, -566, 188, 17], () => {
        g.translate(0, -545); g.rotate(sway); g.translate(0, 545); g.scale(flip, 1);
        // Feet / trouser legs. Every limb has a filled silhouette, not a stick rig.
        const swing = hang * Math.sin(t * 1.9 + .35) * 17;
        if (pose === 'type') {
          shape(p => { p.moveTo(-66, -177); p.lineTo(7, -169); p.lineTo(-30, -100); p.lineTo(-26, -21); p.lineTo(-85, -21); p.lineTo(-108, -100); p.closePath(); }, C.navy);
          shape(p => { p.moveTo(4, -177); p.lineTo(68, -177); p.lineTo(111, -100); p.lineTo(90, -22); p.lineTo(35, -22); p.lineTo(42, -100); p.closePath(); }, C.navy);
        } else {
          shape(p => { p.moveTo(-66, -177); p.lineTo(7, -171); p.lineTo(-26 + swing, -21); p.lineTo(-85 + swing, -21); p.closePath(); }, C.navy);
          shape(p => { p.moveTo(4, -177); p.lineTo(68, -177); p.lineTo(90 + swing, -22); p.lineTo(35 + swing, -22); p.closePath(); }, C.navy);
        }
        line([[-36, -142], [-50 + swing, -42]], '#546876', 4);
        for (const xx of [-57 + swing, 61 + swing]) {
          box(xx - 27, -39, 54, 28, 8, C.white, C.ink, 4);
          shape(p => { p.moveTo(xx - 30, -15); p.quadraticCurveTo(xx + 34, -32, xx + 46, -5); p.lineTo(xx + 43, 8); p.lineTo(xx - 34, 8); p.closePath(); }, C.teal, C.ink, 5);
          line([[xx - 30, 7], [xx + 39, 7]], C.ink, 4);
        }
        // Arms interpolate into an overhead grip. No camera or geometry scaling.
        for (const d of [-1, 1]) {
          const point = pose === 'point' && d === 1;
          const type = pose === 'type' && d === 1;
          const handX = lerp(d * (point || type ? 169 : 111), d * 128, hang);
          const handY = lerp(point ? -330 : type ? -264 + Math.sin(t * 11) * 7 : -164, -545, hang);
          const elbowX = lerp(d * (point || type ? 119 : 105), d * 105, hang);
          const elbowY = lerp(point ? -270 : type ? -235 : -231, -415, hang);
          const shoulderX = d * 83, shoulderY = -292;
          shape(p => { p.moveTo(shoulderX, shoulderY); p.quadraticCurveTo(elbowX, elbowY, handX, handY); }, null, C.ink, 44);
          shape(p => { p.moveTo(shoulderX, shoulderY); p.quadraticCurveTo(elbowX, elbowY, handX, handY); }, null, C.skin, 35);
          const k = .42, sleeveX = (1-k)**2 * shoulderX + 2*(1-k)*k * elbowX + k*k * handX;
          const sleeveY = (1-k)**2 * shoulderY + 2*(1-k)*k * elbowY + k*k * handY;
          shape(p => { p.moveTo(shoulderX, shoulderY); p.quadraticCurveTo(lerp(shoulderX, elbowX, k), lerp(shoulderY, elbowY, k), sleeveX, sleeveY); }, null, C.ink, 50);
          shape(p => { p.moveTo(shoulderX, shoulderY); p.quadraticCurveTo(lerp(shoulderX, elbowX, k), lerp(shoulderY, elbowY, k), sleeveX, sleeveY); }, null, '#343d3b', 41);
          oval(handX, handY, 23, 26, C.skin, C.ink, 4, -.25 * d);
          if (hang > .8) line([[handX - 9, handY - 11], [handX - 7, handY + 3]], '#c28d71', 3);
        }
        box(-31, -354, 62, 71, 16, C.skin, C.ink, 4);
        const breath = Math.sin(t * 1.7) * 1.6;
        shape(p => { p.moveTo(-42, -323); p.quadraticCurveTo(-110, -330, -101, -271); p.lineTo(-93 - breath, -157); p.quadraticCurveTo(0, -138, 95 + breath, -158); p.lineTo(103, -271); p.quadraticCurveTo(104, -326, 40, -323); p.quadraticCurveTo(0, -299, -42, -323); p.closePath(); }, '#343d3b');
        line([[-89, -175], [91, -175]], '#525e55', 4);
        // A light screen-printed graphic echoes the dark T-shirt in the photo.
        line([[-54, -245], [54, -245], [54, -198], [-54, -198], [-54, -245]], '#aeb9a9', 1.7);
        label('51', 0, -210, 36, '#dce2d3', 800, 'center', 85);
        line([[-61, -253], [-18, -263], [21, -257], [59, -266]], '#c4cdba', 2.3);
        artemFace(t, {sleepy, pose, puzzled: options.puzzled});
      });
    }

    function cat(x, y, s, t, options = {}) {
      const paw = options.paw || 0, sleepy = options.sleepy, flip = options.flip ? -1 : 1;
      asset('Гуччи', x, y, s, [-155, -252, 139, 15], () => {
        g.scale(flip, 1);
        const breathe = Math.sin(t * 2.1) * .007;
        g.scale(1 - breathe, 1 + breathe);
        // Sphynx silhouette: huge ears, warm bare skin, long tail and folds.
        shape(p => { p.moveTo(-59, -47); p.bezierCurveTo(-155, -24, -157, -128, -119, -147 + Math.sin(t * 2) * 6); }, null, C.ink, 19);
        shape(p => { p.moveTo(-59, -47); p.bezierCurveTo(-155, -24, -157, -128, -119, -147 + Math.sin(t * 2) * 6); }, null, C.pink, 12);
        oval(-20, -72, 68, 80, C.pink, C.ink, 5, -.12);
        oval(-37, -44, 43, 40, '#c28c89', C.ink, 4);
        shape(p => { p.moveTo(18, -98); p.lineTo(39, -18); p.quadraticCurveTo(47, 7, 17, 7); p.lineTo(5, -8); p.lineTo(-4, -88); p.closePath(); }, C.pink, C.ink, 4);
        oval(-37, 0, 34, 11, C.pink, C.ink, 4);
        if (paw > 0) {
          const px = lerp(38, 116, paw), py = lerp(-32, -116, paw);
          shape(p => { p.moveTo(34, -104); p.quadraticCurveTo(68, -43, px, py); }, null, C.ink, 23);
          shape(p => { p.moveTo(34, -104); p.quadraticCurveTo(68, -43, px, py); }, null, C.pink, 15);
          oval(px, py, 16, 13, C.pink, C.ink, 3);
        }
        const ear = Math.max(0, Math.sin(t * 1.31 + 1)) ** 14 * 7;
        poly([[-33, -170], [-52 - ear, -238 + ear * .45], [7, -192]], C.pink, C.ink, 5);
        poly([[41, -191], [86, -236], [86, -161]], C.pink, C.ink, 5);
        poly([[-29, -181], [-42 - ear * .75, -220 + ear * .45], [-2, -185]], '#b77a7e', null);
        poly([[55, -184], [77, -216], [75, -174]], '#b77a7e', null);
        shape(p => { p.moveTo(-39, -178); p.quadraticCurveTo(22, -210, 79, -173); p.lineTo(67, -136); p.quadraticCurveTo(48, -108, 20, -106); p.quadraticCurveTo(-12, -109, -32, -137); p.closePath(); }, C.pink, C.ink, 5);
        for (const [ex, ang] of [[-8, -.17], [50, .14]]) {
          if (sleepy || t % 5 > 4.86) line([[ex - 17, -159], [ex, -151], [ex + 18, -157]], C.ink, 4);
          else { oval(ex, -158, 20, 12, '#c1d68f', C.ink, 3, ang); oval(ex + 5, -158, 3.3, 10, C.ink); oval(ex + 8, -162, 2.5, 2.5, C.white); }
        }
        poly([[12, -138], [31, -138], [22, -130]], '#85535b', C.ink, 2);
        line([[22, -130], [22, -122], [11, -120]], C.ink, 2.7); line([[22, -122], [33, -120]], C.ink, 2.7);
        for (let i = 0; i < 3; i++) shape(p => { p.moveTo(1 + i * 4, -178 - i * 7); p.quadraticCurveTo(21, -170 - i * 7, 37 - i * 4, -180 - i * 7); }, null, '#ad7679', 2.3);
        line([[-29, -93], [-19, -101], [-7, -96]], '#ad7679', 3);
        line([[-39, -81], [-27, -88], [-15, -82]], '#ad7679', 3);
        for (const xx of [-49, -38, 19, 28]) line([[xx, -4], [xx + 1, 4]], '#a06f72', 2.5);
        if (options.boss) { poly([[11, -108], [33, -108], [24, -94]], C.teal, C.ink, 3); poly([[24, -94], [36, -62], [24, -47], [12, -62]], C.teal, C.ink, 3); }
      });
    }
    function feeder(x, y, s, t, pour = 0) {
      asset('Валера', x, y, s, [-111, -298, 111, 75], () => {
        shadow(0, 67, 113, 15);
        box(-91, -273, 182, 274, 33, C.white, C.ink, 5);
        box(-98, -286, 196, 43, 17, '#a1c6b3', C.ink, 5);
        box(-63, -221, 126, 63, 13, '#d4ded0', C.ink, 3);
        for (let i = 0; i < 17; i++) oval(-50 + hash(i + 7) * 98, -174 - hash(i + 31) * 33, 5.2, 3.8, '#bd8852');
        label('ВАЛЕРА', 0, -120, 27, C.ink, 800, 'center', 148);
        oval(0, -90, 8, 8, pour ? C.teal : '#b8c5b6');
        box(-45, -66, 90, 49, 15, C.navy, C.ink, 3);
        oval(0, 36, 91, 26, '#d9bd92', C.ink, 4);
        shape(p => { p.moveTo(-90, 36); p.lineTo(-68, 68); p.quadraticCurveTo(0, 91, 67, 68); p.lineTo(90, 36); p.quadraticCurveTo(0, 67, -90, 36); }, C.teal, C.ink, 4);
        if (pour > .01) for (let i = 0; i < 12; i++) {
          const phase = (t * 2.8 + i * .163) % 1;
          oval((hash(i + 2) - .5) * (17 + 95 * phase), -27 + phase * 72, 5.6, 3.7, '#a97647', null, 0, i);
        }
        for (let i = 0; i < 14; i++) oval(-54 + hash(i + 44) * 108, 30 + hash(i + 32) * 15, 6.1, 4, '#b08451');
      });
    }
    function monitor(x, y, w, h, t, night = false) {
      box(x + w * .43, y + h, w * .14, 64, 8, '#788b8c', C.ink, 4);
      box(x + w * .28, y + h + 55, w * .44, 15, 7, '#9badab', C.ink, 4);
      box(x, y, w, h, 22, C.navy, C.ink, 5);
      box(x + 13, y + 13, w - 26, h - 30, 12, night ? '#1f3e4b' : '#24494b', null);
      label('AGENT / РАБОТАЕТ', x + 30, y + 49, Math.min(21, w / 17), '#b7d1ba', 700, 'left', w - 58);
      for (let i = 0; i < 7; i++) {
        const width = (w - 77) * (.31 + hash(i + 40) * .55);
        const alpha = .42 + .5 * seg((t * .8) % 8, i, i + .45);
        g.save(); g.globalAlpha = alpha;
        line([[x + 33 + (i % 3) * 13, y + 83 + i * (h - 118) / 7], [x + 33 + width, y + 83 + i * (h - 118) / 7]], i % 3 ? '#98cba9' : '#e5c883', 5);
        g.restore();
      }
      oval(x + w / 2, y + h - 8, 2.5, 2.5, '#a9caae');
    }
    function keyboard(x, y, w = 190) {
      box(x, y, w, 32, 7, '#d5d5c5', C.ink, 3);
      for (let i = 0; i < 9; i++) line([[x + 11 + i * (w - 21) / 9, y + 10], [x + 11 + i * (w - 21) / 9, y + 20]], '#83968b', 3);
    }
    function mic(x, y, muted) {
      asset('Микрофон', x, y, 1, [-45, -186, 45, 8], () => {
        box(-7, -59, 14, 56, 7, C.navy, C.ink, 3); oval(0, 0, 44, 12, C.navy, C.ink, 4);
        shape(p => { p.moveTo(-35, -133); p.lineTo(-35, -84); p.quadraticCurveTo(0, -50, 35, -84); p.lineTo(35, -133); }, null, C.ink, 6);
        box(-24, -177, 48, 100, 22, '#496569', C.ink, 4);
        for (let i = 0; i < 5; i++) line([[-14, -155 + i * 12], [14, -155 + i * 12]], '#83a39d', 3);
        oval(0, -83, 8, 5, muted ? C.coral : '#a9dc8d');
        if (muted) line([[-35, -174], [35, -88]], C.coral, 9);
      });
    }
    function robot(x, y, s, t) {
      asset('Нейронка', x, y, s, [-102, -204, 102, 63], () => {
        line([[0, -165], [0, -197]], C.ink, 5); oval(0, -197, 8, 8, C.yellow, C.ink, 3);
        box(-66, -163, 132, 102, 29, '#afcbb9', C.ink, 5);
        box(-49, -141, 98, 56, 16, C.navy, C.ink, 3);
        for (const d of [-1, 1]) oval(d * 23, -113, 8, 12, '#d8ecba');
        box(-47, -55, 94, 88, 14, C.white, C.ink, 4); label('{ }', 0, 2, 33, C.teal, 800);
        for (const d of [-1, 1]) { line([[d * 42, -35], [d * 84, -7], [d * 58, 27 + Math.sin(t * 12 + d) * 5]], C.ink, 13); oval(d * 58, 26, 14, 12, C.mint, C.ink, 3); }
        keyboard(-101, 37, 202);
      });
    }
    const cue = (s, i, shift = 0) => (s.captions[i]?.start || 0) + shift;
    const gameScenes = root.Body51DayGames({g, C, box, oval, shape, line, poly, label, local, asset, tag, sparkle, shadow, floor, person, cue, ease, seg, lerp, clamp});

    function wake(s, t) {
      floor(1370);
      windowView(143, 480, 300, 422, t);
      // Small alarm on the bedside table.
      box(746, 1210, 211, 23, 6, '#c59b74', C.ink, 5); line([[771, 1233], [764, 1391]], C.ink, 11); line([[934, 1233], [941, 1391]], C.ink, 11);
      const ring = t < cue(s, 1) ? Math.sin(t * 29) * .03 : 0;
      local(850, 1147, 1, () => {
        oval(0, 0, 59, 59, C.yellow, C.ink, 5); oval(0, 0, 45, 45, C.white, C.ink, 3);
        line([[0, -29], [0, 0], [21, 10]], C.ink, 5);
        oval(-40, -49, 21, 12, C.coral, C.ink, 4, -.5); oval(40, -49, 21, 12, C.coral, C.ink, 4, .5);
        line([[-32, 48], [-43, 62]], C.ink, 5); line([[32, 48], [43, 62]], C.ink, 5);
      }, ring);
      const up = ease(seg(t, cue(s, 1) - .1, cue(s, 1) + .65));
      box(120, 945, 647, 350, 35, '#b48b69', C.ink, 6);
      g.save(); g.beginPath(); g.rect(120, 730, 652, 572); g.clip();
      person(368, 1385 - 66 * up, 1.02, t, {sleepy: up < .7, pose: t > cue(s, 2) ? 'point' : 'stand'});
      g.restore();
      box(159, 1096, 591, 209, 31, C.white, C.ink, 5);
      box(424, 1068, 340, 248, 24, '#97b9a4', C.ink, 6);
      for (let i = 0; i < 7; i++) line([[444 + i * 43, 1082], [444 + i * 43, 1302]], '#c3d1b2', 5);
      box(113, 1298, 654, 41, 11, C.wood, C.ink, 5);
      line([[145, 1337], [136, 1400]], C.ink, 16); line([[734, 1337], [743, 1400]], C.ink, 16);
      const boss = seg(t, cue(s, 2), cue(s, 2) + .65);
      cat(655, 1078 - Math.sin(Math.min(1, boss) * Math.PI) * 14, 1.04, t, {boss: true});
      if (t > cue(s, 2)) { tag('ГУЧЧИ / НАЧАЛЬНИК', 737, 663, 372, C.yellow, 27, -.035); line([[738, 709], [717, 752], [694, 778]], C.ink, 3); }
      if (up < .8) label('z', 537, 822 - t * 8, 36, '#718d8b', 800);
      plant(921, 1397, .57);
    }

    function service(s, t) {
      floor(1381);
      // Bathroom tiles, entirely contained in the action area.
      box(589, 514, 380, 691, 34, '#dce3d5', null);
      for (let i = 1; i < 4; i++) line([[589 + i * 95, 534], [589 + i * 95, 1176]], '#bfcec3', 3);
      for (let i = 1; i < 7; i++) line([[606, 514 + i * 96], [953, 514 + i * 96]], '#bfcec3', 3);
      feeder(236, 1221, 1.2, t, t > .5 && t < cue(s, 2) + .6 ? 1 : 0);
      tag('АВТОКОРМУШКА', 250, 793, 335, C.mint, 26, -.025);
      // Sink and tap. Water is clipped to a narrow physical stream.
      box(612, 1176, 338, 115, 17, '#bf9670', C.ink, 5);
      line([[632, 1291], [625, 1396]], C.ink, 11); line([[928, 1291], [938, 1396]], C.ink, 11);
      oval(785, 1164, 178, 41, '#e9ecdf', C.ink, 5); oval(785, 1156, 126, 21, '#a6c5bd', C.ink, 3);
      shape(p => { p.moveTo(871, 1140); p.lineTo(871, 879); p.quadraticCurveTo(871, 835, 822, 841); p.quadraticCurveTo(780, 841, 780, 899); }, null, C.ink, 28);
      shape(p => { p.moveTo(871, 1140); p.lineTo(871, 879); p.quadraticCurveTo(871, 835, 822, 841); p.quadraticCurveTo(780, 841, 780, 899); }, null, '#a9c3bd', 19);
      const water = ease(seg(t, cue(s, 2) - .3, cue(s, 2) + .3));
      local(874, 1057, 1, () => { line([[-23, 0], [25, 0]], C.ink, 11); line([[0, -17], [0, 15]], C.ink, 10); }, water * .7);
      if (water > 0) {
        line([[780, 905], [780, 1144]], '#85c4cb', 9 * water);
        for (let i = 0; i < 8; i++) { const yy = 909 + ((t * 215 + i * 38) % 231); line([[778, yy], [778, yy + 12]], '#def1e7', 3); }
        for (let i = 0; i < 4; i++) oval(767 + i * 10, 1149 - Math.abs(Math.sin(t * 9 + i)) * 10, 3, 3, '#79afb4');
      }
      // A tiny hop between two valid poses; the cat never crosses a frame edge.
      const hop = ease(seg(t, cue(s, 2) - .5, cue(s, 2) + .5));
      const cx = lerp(486, 727, hop), cy = lerp(1310, 1154, hop) - Math.sin(hop * Math.PI) * 87;
      cat(cx, cy, lerp(.92, .93, hop), t);
      if (hop > .99 && Math.sin(t * 10) > -.2) {
        shape(p => { p.moveTo(750, 1040); p.quadraticCurveTo(765, 1050, 779, 1044); }, null, '#8d5760', 7);
        shape(p => { p.moveTo(750, 1040); p.quadraticCurveTo(765, 1050, 779, 1044); }, null, '#e0a3a2', 4);
      }
      if (t > cue(s, 3)) { tag('ПЯТЬ ЗВЁЗД', 440, 575, 304, C.yellow, 28, -.025); for (let i = 0; i < 5; i++) sparkle(330 + i * 56, 649, 15, '#b59347', .1); }
      plant(133, 1391, .5);
    }

    function stream(s, t) {
      floor(1382);
      windowView(129, 502, 218, 318, t);
      box(274, 974, 163, 318, 57, '#a1bcb0', C.ink, 6);
      line([[357, 1287], [357, 1393]], C.ink, 13); line([[278, 1395], [436, 1395]], C.ink, 12);
      monitor(521, 666, 402, 303, t);
      person(357, 1395, 1.07, t, {pose: 'type'});
      box(151, 1118, 795, 39, 12, C.wood, C.ink, 6);
      line([[191, 1157], [176, 1396]], C.ink, 14); line([[907, 1157], [929, 1396]], C.ink, 14);
      keyboard(501, 1084, 185);
      const contact = cue(s, 2) + .65;
      const paw = ease(seg(t, contact - .5, contact)) * (1 - ease(seg(t, contact + 1.1, contact + 1.5)));
      const muted = t >= contact;
      cat(768, 1116, .77, t, {paw});
      mic(872, 1105, muted);
      const rx = 551, ry = 542;
      box(rx - 9, ry - 34, 336, 66, 32, muted ? '#edcbb7' : '#d5dfc8', C.ink, 3);
      oval(rx + 21, ry - 2, 8, 8, muted ? C.coral : C.teal);
      label(muted ? 'КОТ НАЖАЛ MUTE' : 'СТРИМ ИДЁТ', rx + 57, ry + 9, 25, C.ink, 800, 'left', 252);
      if (!muted) for (let i = 0; i < 17; i++) line([[596 + i * 15, 627], [596 + i * 15, 627 - 8 - Math.abs(Math.sin(t * 8 + i * 1.3)) * 33]], C.teal, 7);
      else line([[596, 615], [836, 615]], '#9eaaa0', 4);
      if (t > cue(s, 3)) tag('РЕВЬЮ ПРИНЯТО', 602, 1292, 342, C.yellow, 27, -.025);
      plant(141, 1086, .53);
    }

    function pullup(s, t, ending = false) {
      floor(1389);
      box(306, 523, 477, 878, 36, '#dbc7a8', C.ink, 6);
      box(337, 553, 416, 850, 24, '#e5ddca', C.ink, 4);
      line([[331, 1407], [753, 1407]], '#bfa885', 8);
      const lift = ending ? 1 : ease(seg(t, cue(s, 1) - .45, cue(s, 1) + .28));
      const feetY = lerp(1413, 1320, lift);
      const size = 1.085;
      const barY = 1320 - 545 * size;
      box(300, barY - 8, 490, 19, 9, '#517b76', C.ink, 5);
      for (const xx of [302, 784]) box(xx - 13, barY - 19, 27, 43, 7, '#96aea1', C.ink, 4);
      person(547, feetY, size, t, {hang: lift});
      // Fingers wrap over the bar; rendered after the character.
      if (lift > .88) for (const d of [-1, 1]) {
        const xx = 547 + d * 128 * size;
        box(xx - 19, barY - 12, 39, 25, 9, C.skin, C.ink, 3);
        for (let i = 0; i < 3; i++) line([[xx - 10 + i * 10, barY - 8], [xx - 10 + i * 10, barY + 3]], '#bc8969', 2);
      }
      if (!ending) {
        // Pomodoro becomes a rest timer precisely at the jump.
        local(168, 926, .9, () => {
          oval(0, 0, 96, 88, C.coral, C.ink, 5);
          poly([[-23, -78], [-43, -109], [-9, -98], [8, -122], [18, -95], [52, -106], [34, -77]], '#6d986d', C.ink, 4);
          const left = lift > .8 ? '05:00' : '25:00';
          label(left, 0, 13, 33, C.white, 800, 'center', 159);
          label(lift > .8 ? 'ОТДЫХ' : 'РАБОТА', 0, 137, 24, C.ink, 800);
        });
        box(805, 1217, 167, 105, 12, C.navy, C.ink, 4);
        box(815, 1227, 147, 78, 5, '#bdd5c1', null);
        line([[862, 1264], [877, 1279], [912, 1248]], C.teal, 7);
        box(791, 1322, 195, 15, 6, '#bac4b5', C.ink, 4);
        label('UNITY', 886, 1188, 24, C.ink, 800, 'center', 158);
        if (t > cue(s, 2)) tag('РУЧНОЙ РЕЖИМ', 546, 616, 335, C.yellow, 26, -.025);
      } else {
        if (t >= cue(s, 0)) { robot(865, 1091, .85, t); tag('КОД', 862, 881, 133, C.mint, 25, .025); }
        if (t >= cue(s, 1)) { feeder(181, 1277, .85, t, 1); tag('ОБЕД', 181, 962, 159, C.mint, 25, -.025); }
        cat(845, 1398, .85, t, {sleepy: t > cue(s, 4)});
        if (t > cue(s, 3)) tag('ВИСИТ ВРУЧНУЮ', 546, 616, 344, C.yellow, 28, -.025);
        if (t > cue(s, 4)) {
          const a = seg(t, cue(s, 4), cue(s, 4) + .35);
          g.save(); g.globalAlpha = a; sparkle(382, 861, 23, C.coral, -.2); sparkle(700, 877, 19, C.teal, .2); g.restore();
        }
      }
    }

    function printer(x, y, s, number, t, asleep) {
      asset(`Принтер ${number}`, x, y, s, [-120, -279, 120, 19], () => {
        shadow(0, 15, 112, 12);
        oval(78, -230, 42, 42, number % 2 ? '#9caf9a' : '#d3b684', C.ink, 5);
        oval(78, -230, 23, 23, C.paper, C.ink, 4);
        oval(78, -230, 7, 7, C.ink);
        box(-92, -223, 20, 211, 7, C.navy, C.ink, 4);
        box(64, -223, 20, 211, 7, C.navy, C.ink, 4);
        box(-97, -225, 186, 21, 6, '#92aca6', C.ink, 4);
        box(-78, -158, 149, 14, 3, '#92aca6', C.ink, 4);
        box(-23, -171, 42, 47, 5, C.coral, C.ink, 4);
        poly([[-8, -124], [8, -124], [0, -109]], C.yellow, C.ink, 3);
        box(-78, -52, 144, 11, 3, '#a7bbac', C.ink, 3);
        box(-104, -31, 208, 43, 8, C.navy, C.ink, 4);
        box(48, -25, 41, 21, 3, '#c2d2b5', null);
        label(String(number), -72, 1, 24, C.white, 800);
        if (asleep) {
          // Breathing displays, no phantom prints or moving extruders.
          const breath = Math.sin(t * 1.6 + number) * 1.5;
          shape(p => { p.moveTo(-59, -82 + breath); p.quadraticCurveTo(-42, -68 + breath, -26, -82 + breath); }, null, '#6d8e84', 4);
          shape(p => { p.moveTo(17, -82 + breath); p.quadraticCurveTo(33, -68 + breath, 50, -82 + breath); }, null, '#6d8e84', 4);
        }
      });
    }
    function printers(s, t) {
      floor(1381);
      box(106, 677, 868, 649, 30, '#e4e1cf', null);
      for (const x of [152, 935]) box(x, 695, 15, 684, 5, '#b4b7a0', C.ink, 3);
      line([[540, 465], [540, 500]], C.ink, 5);
      shape(p => { p.moveTo(474, 540); p.quadraticCurveTo(478, 490, 540, 488); p.quadraticCurveTo(600, 490, 606, 540); p.closePath(); }, C.yellow, C.ink, 5);
      line([[470, 546], [610, 546]], C.ink, 5);
      const asleep = t > cue(s, 2);
      for (let i = 0; i < 3; i++) printer(260 + i * 280, 972, .91, i + 1, t, asleep);
      box(115, 985, 850, 22, 5, C.wood, C.ink, 4);
      for (let i = 0; i < 4; i++) printer(192 + i * 232, 1292, .79, i + 4, t, asleep);
      box(115, 1305, 850, 22, 5, C.wood, C.ink, 4);
      if (asleep) {
        for (let i = 0; i < 7; i++) {
          const xx = i < 3 ? 245 + i * 280 : 172 + (i - 3) * 232;
          const yy = (i < 3 ? 688 : 1049) - Math.sin(t * 1.1 + i) * 6;
          label('z', xx, yy, 29, '#6f9288', 800, 'center', 45);
        }
        tag('НИ ОДИН НЕ ПЕЧАТАЕТ', 540, 599, 452, C.mint, 29, -.018);
      }
      plant(945, 1399, .42);
    }
    function swordShape(x, y, s, t, grain) {
      local(x, y, s, () => {
        // Intentionally square: the joke is an asset from stream #061.
        box(-38, -273, 76, 345, 0, '#caa06b', C.ink, 6);
        poly([[38, -273], [62, -288], [62, 57], [38, 72]], '#98714d', C.ink, 5);
        poly([[-38, -273], [-15, -288], [62, -288], [38, -273]], '#e1bb84', C.ink, 5);
        box(-90, 67, 180, 39, 3, '#ab7c53', C.ink, 5);
        box(-24, 107, 48, 99, 4, '#996e4b', C.ink, 5);
        box(-38, 205, 76, 27, 3, '#bc905e', C.ink, 5);
        if (grain > 0) {
          g.save(); g.globalAlpha = grain;
          for (let i = 0; i < 4; i++) shape(p => { p.moveTo(-23 + i * 15, -252); p.bezierCurveTo(-46 + i * 24, -152, 1 + i * 7, -63, -18 + i * 17, 46); }, null, '#a17a4e', 3);
          oval(9, -153, 8, 23, null, '#a17a4e', 3);
          g.restore();
        }
      }, Math.sin(t * 1.2) * .06);
    }
    function sword(s, t) {
      floor(1385);
      box(128, 501, 825, 731, 28, '#d9e3ce', C.ink, 6);
      box(128, 501, 825, 67, 25, '#bfd2bd', C.ink, 5);
      // Hide only the rounded lower header corners, not any content.
      box(132, 540, 817, 25, 0, '#bfd2bd', null);
      for (let i = 0; i < 3; i++) oval(159 + i * 24, 536, 6.5, 6.5, [C.coral, C.yellow, C.teal][i]);
      label('ГЕНЕРАЦИЯ / ГОТОВО', 913, 545, 23, '#446658', 800, 'right', 506);
      const change = ease(seg(t, cue(s, 3), cue(s, 3) + .65));
      oval(605, 927, 246, 268, '#e8ead6');
      g.save(); g.beginPath(); g.roundRect(140, 578, 801, 641, 12); g.clip();
      if (change < 1) { g.save(); g.globalAlpha = 1 - change; swordShape(605, 926, .93, t, seg(t, cue(s, 1), cue(s, 1) + .25)); g.restore(); }
      if (t > cue(s, 2) && change < .6) {
        line([[520, 634], [687, 634]], C.coral, 4); line([[520, 621], [520, 648]], C.coral, 4); line([[687, 621], [687, 648]], C.coral, 4);
        label('КВАДРАТНЫЙ.', 608, 604, 25, '#a86447', 800, 'center', 300);
      }
      if (change > 0) {
        g.save(); g.globalAlpha = change;
        local(614, 1166, 1.04, () => {
          shadow(0, 2, 144, 14);
          for (const d of [-1, 1]) poly([[d * 93 - 16, -219], [d * 93 + 15, -219], [d * 124 + 13, -5], [d * 124 - 17, -5]], '#b48657', C.ink, 5);
          box(-95, -224, 44, 226, 0, '#caa06b', C.ink, 5);
          line([[-85, -206], [-84, -17]], '#a87949', 3);
          box(55, -220, 31, 220, 2, '#b48657', C.ink, 5);
          box(-103, -230, 50, 23, 2, '#aa784d', C.ink, 4);
          box(-150, -268, 300, 54, 12, '#cfaa78', C.ink, 5);
          line([[-131, -244], [130, -244]], '#e4c18d', 4);
        });
        tag('МЕБЕЛЬ +1', 610, 741, 285, C.yellow, 30, -.025);
        g.restore();
      }
      g.restore();
      person(259, 1410, .72, t, {puzzled: true, pose: 'point'});
      if (t < cue(s, 2)) { sparkle(821, 758, 19, '#b99d55', .13); sparkle(795, 1087, 12, '#b99d55', -.2); }
      if (t > cue(s, 3) + .5) label('ЗАТО СТОИТ.', 735, 1367, 35, C.ink, 800, 'center', 350);
    }

    function night(s, t) {
      floor(1389, true);
      windowView(133, 666, 230, 325, t, true);
      const late = ease(seg(t, cue(s, 3), cue(s, 3) + 1.2));
      local(261, 558, 1, () => {
        oval(0, 0, 77, 77, '#d9c18a', '#99a99f', 4); oval(0, 0, 63, 63, '#283e51', null);
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; oval(Math.cos(a) * 51, Math.sin(a) * 51, 2.4, 2.4, '#d0cfb1'); }
        const a = -Math.PI / 2 + late * Math.PI / 2;
        line([[0, 0], [Math.cos(a) * 30, Math.sin(a) * 30]], C.yellow, 6);
        line([[0, 0], [Math.cos(-Math.PI / 2 + late * TAU * 3) * 46, Math.sin(-Math.PI / 2 + late * TAU * 3) * 46]], C.white, 4);
        oval(0, 0, 5, 5, C.coral);
      });
      box(351, 999, 173, 327, 53, '#3f666a', '#203442', 5);
      line([[438, 1326], [438, 1400]], '#163040', 15); line([[368, 1400], [509, 1400]], '#163040', 12);
      monitor(610, 852, 309, 248, t, true);
      person(442, 1422, 1.01, t, {pose: 'type', sleepy: t < cue(s, 1)});
      box(139, 1146, 815, 37, 10, '#957354', '#213642', 5);
      line([[173, 1182], [166, 1405]], '#213642', 14); line([[920, 1182], [934, 1405]], '#213642', 14);
      keyboard(588, 1112, 173);
      // Desk lamp: a bounded cone, not a full-screen additive texture.
      poly([[212, 967], [305, 967], [399, 1141], [163, 1141]], '#efd08d14', null);
      line([[233, 1133], [221, 1036], [254, 965]], '#8fa79d', 10);
      poly([[215, 929], [272, 931], [300, 974], [185, 974]], '#bd9970', '#243a43', 4);
      oval(241, 1136, 53, 8, '#79978f', '#243a43', 3);
      const messages = t < cue(s, 1) ? 0 : t < cue(s, 2) ? 1 : t < cue(s, 4) ? 2 : 3;
      for (let i = 0; i < messages; i++) {
        const yy = 742 - i * 93;
        const time = i === 0 ? cue(s, 1) : i === 1 ? cue(s, 2) : cue(s, 4);
        const pop = ease(seg(t, time, time + .2));
        g.save(); g.globalAlpha = pop;
        local(742, yy + (1 - pop) * 18, 1, () => {
          box(-182, -33, 364, 69, 14, i === 2 ? '#dcb979' : '#536d72', '#9cad99', 3);
          label(i === 2 ? 'ТОЧНО ПОСЛЕДНИЙ' : '+1 ПРОМПТИК', 0, 10, 26, i === 2 ? C.ink : '#f0e7cf', 800, 'center', 336);
        }, (i - 1) * .018);
        g.restore();
      }
      if (late > .7) label('03:00', 261, 641, 28, C.yellow, 800, 'center', 150);
      cat(817, 1400, .65, t, {sleepy: true});
    }

    function heading(s, t) {
      const dark = s.id === 'night';
      const ink = dark ? '#f1e8d4' : C.ink;
      label('@body51', 79, 103, 29, ink, 800, 'left', 400);
      label('ОДИН ОБЫЧНЫЙ ДЕНЬ', 1000, 103, 21, dark ? '#a6bbb4' : '#69867b', 800, 'right', 548);
      line([[79, 134], [1000, 134]], dark ? '#5b7379' : '#bac5b4', 2);
      oval(91, 191, 7, 7, s.accent);
      label(s.phase, 116, 200, 24, dark ? '#afc4b9' : '#658278', 800, 'left', 757);
      label(String(s.index + 1).padStart(2, '0') + ' / ' + String(data.scenes.length).padStart(2, '0'), 998, 200, 21, dark ? '#afc4b9' : '#658278', 700, 'right', 115);
      let titles = s.title;
      if (s.id === 'wake' && t < cue(s, 2)) titles = ['Один день', 'Артёма.'];
      if (s.id === 'stream' && t < cue(s, 2) + .65) titles = ['Начался стрим.', 'Всё по плану.'];
      if (s.id === 'break' && t > cue(s, 2) + .7) titles = ['Завис.', 'Не Unity.'];
      if (s.id === 'printers' && t < cue(s, 2)) titles = ['Семь', '3D-принтеров.'];
      if (s.id === 'sword' && t < cue(s, 3)) titles = ['Нейронка', 'сделала меч.'];
      if (s.id === 'inspector') titles = t < cue(s, 2) ? ['Не перенёс', 'дату релиза.'] : ['Календарь —', 'маркетолог.'];
      if (s.id === 'meridian' && t > cue(s, 3)) titles = ['Эпическая', 'битва за батон.'];
      if (s.id === 'night' && t > cue(s, 3)) titles = ['Три часа спустя.', 'Ещё один.'];
      if (s.id === 'finale' && t > cue(s, 3)) titles = ['Кроме', 'турничка.'];
      if (s.id === 'finale' && t > cue(s, 4)) titles = ['Такие', 'пирожочки.'];
      label(titles[0], 77, 299, 87, ink, 800, 'left', 925);
      label(titles[1], 77, 393, 87, dark ? C.yellow : s.accent, 800, 'left', 925);
    }
    function caption(s, t) {
      let active = s.captions.find(c => t >= c.start && t < c.end);
      if (!active && t >= s.captions.at(-1).start) active = s.captions.at(-1);
      const dark = s.id === 'night', ink = dark ? '#f1e8d4' : C.ink;
      label('ЗА КАДРОМ', 540, 1521, 20, dark ? '#93aba6' : '#789185', 800);
      if (active) {
        g.font = '700 46px Manrope, sans-serif';
        const words = active.text.split(' '), lines = []; let row = '';
        for (const word of words) {
          const next = row ? row + ' ' + word : word;
          if (row && g.measureText(next).width > 887) { lines.push(row); row = word; } else row = next;
        }
        if (row) lines.push(row);
        const startY = lines.length === 1 ? 1612 : 1577;
        lines.forEach((l, i) => label(l, 540, startY + i * 66, 46, ink, 700, 'center', 892));
      }
      line([[79, 1740], [1000, 1740]], dark ? '#506875' : '#c6cdbe', 2);
      const refs = s.sources.map(n => '#' + String(n).padStart(3, '0')).join(' · ');
      label('ПО СТРИМАМ ' + refs, 79, 1786, 22, dark ? '#a4b8ae' : '#718779', 700, 'left', 727);
      label('9:16', 1000, 1786, 22, dark ? '#a4b8ae' : '#718779', 700, 'right', 80);
      label('Собирательный день. Рассказчик — не голос Артёма.', 540, 1828, 19, dark ? '#a4b8ae' : '#718779', 600, 'center', 920);
      // One understated beat per scene, always inside the same safe width.
      for (let i = 0; i < data.scenes.length; i++) {
        const ss = data.scenes[i], gap = 11, width = (920 - gap * (data.scenes.length - 1)) / data.scenes.length, x = 80 + i * (width + gap);
        box(x, 1861, width, 5, 2, dark ? '#49616c' : '#d4d8c8', null);
        const p = clamp((now - ss.start) / ss.duration);
        if (p) box(x, 1861, Math.max(1, width * p), 5, 2, dark ? C.yellow : C.teal, null);
      }
    }
    function draw(time, debug = false) {
      now = clamp(time, 0, data.total - 1 / data.format.fps);
      current = data.scenes.find(s => now >= s.start && now < s.start + s.duration) || data.scenes.at(-1);
      const t = now - current.start, dark = current.id === 'night';
      bounds = []; textBoxes = [];
      g.save(); g.setTransform(scale, 0, 0, scale, 0, 0);
      g.lineJoin = 'round'; g.lineCap = 'round'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = dark ? '#253c50' : C.paper; g.fillRect(0, 0, W, H);
      // Stationary paper grain. Seeded and quiet; doesn't shimmer between frames.
      g.fillStyle = dark ? '#dfd8b907' : '#5b73550b';
      for (let i = 0; i < 650; i++) g.fillRect(hash(i * 2.11) * W, hash(i * 5.32) * H, 1 + hash(i) * 2, .8 + hash(i + 1) * 2);
      heading(current, t);
      g.save(); g.beginPath(); g.rect(64, 449, 952, 1010); g.clip();
      const painters = {...gameScenes, wake, service, stream, break: pullup, printers, sword, night, finale: (s, tt) => pullup(s, tt, true)};
      painters[current.id](current, t);
      g.restore();
      caption(current, t);
      if (debug) {
        g.strokeStyle = '#e54b9b'; g.lineWidth = 2;
        g.strokeRect(64, 449, 952, 1010);
        for (const b of bounds) g.strokeRect(b.x, b.y, b.right - b.x, b.bottom - b.y);
      }
      g.restore();
      return {scene: current.id, localTime: t, bounds, textBoxes};
    }
    return {draw, get data() { return data; }};
  }
  root.Body51Day = {create, W, H};
})(typeof window === 'undefined' ? globalThis : window);
