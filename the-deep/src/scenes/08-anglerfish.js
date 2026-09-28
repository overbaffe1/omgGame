// 08-anglerfish : the midnight zone. The lure bobs, a fish drifts too close,
// and at t = 2.0 s (21.0 s on the timeline) the jaws snap shut on a white flash.
FILM.scene({
  id: 'anglerfish',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Near-black water with a cold cast.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, '#04101f'],
      [0.5, '#030b18'],
      [1, '#02060e'],
    ]);

    // Sparse deep snow, barely visible.
    lib.snow(ctx, t, { count: 24, speed: 12, seed: 51, alpha: 0.16, rMin: 1, rMax: 3.5, color: '#6c86a8' });

    const snap = 2.0;
    const ts = t - snap; // negative before the snap
    // Jaw opening: snaps open in 2 frames, closes over 0.3 s.
    let open = 0;
    if (ts >= 0 && ts < 0.3) open = ts < 0.06 ? 1 : 1 - ease.outCubic((ts - 0.06) / 0.24);

    // The fish drifts and breathes; recoils a little after the snap.
    const recoil = ts > 0 ? ease.outCubic(lib.clamp01(ts / 0.5)) : 0;
    const fx = W * 0.56 + recoil * 60;
    const fy = H * 0.56 + Math.sin(t * 0.9) * 22 + recoil * 30;

    // ---- lure (drawn behind the fish so its glow wraps the head) ----
    const lureBob = Math.sin(t * 1.6) * 34;
    const lureX = fx - 330 + Math.sin(t * 0.7) * 18;
    const lureY = fy - 260 + lureBob;
    const beat = 0.5 + 0.5 * Math.sin(t * Math.PI * 4); // 2 Hz = on the beat grid
    const lureGlow = 0.55 + 0.45 * beat + (ts >= 0 && ts < 0.5 ? 0.5 * (1 - ts / 0.5) : 0);

    lib.glow(ctx, lureX, lureY, 230 * lureGlow, 'rgba(160,235,255,0.65)', 'rgba(120,200,255,0)');
    lib.glow(ctx, lureX, lureY, 90 * lureGlow, 'rgba(230,252,255,0.9)', 'rgba(160,235,255,0)');
    lib.dot(ctx, lureX, lureY, 16 + 6 * beat, '#eafcff', 0.95);

    // Illicium rod from the head to the lure.
    ctx.save();
    ctx.strokeStyle = 'rgba(120,170,220,0.75)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx - 150, fy - 170);
    ctx.quadraticCurveTo(fx - 260, fy - 300, lureX, lureY);
    ctx.stroke();
    ctx.restore();

    // ---- the fish, facing left ----
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(-1, 1); // face left

    const bodyGrad = ctx.createLinearGradient(0, -220, 0, 220);
    bodyGrad.addColorStop(0, '#0c1830');
    bodyGrad.addColorStop(1, '#060d1c');

    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(330, -30);
      ctx.quadraticCurveTo(250, -150, 90, -186);
      ctx.quadraticCurveTo(-60, -210, -170, -128);
      ctx.lineTo(-330, -150);
      ctx.quadraticCurveTo(-290, -20, -330, 130);
      ctx.lineTo(-170, 120);
      ctx.quadraticCurveTo(-40, 205, 140, 148);
      ctx.quadraticCurveTo(250, 120, 330, -30);
      ctx.closePath();
    };

    // Upper body (without the opening jaw): full blob with a cut mouth.
    bodyPath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,170,230,0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Faint rim light along the top.
    ctx.save();
    ctx.strokeStyle = 'rgba(150,205,255,0.30)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(320, -40);
    ctx.quadraticCurveTo(250, -155, 90, -191);
    ctx.stroke();
    ctx.restore();

    // ---- jaws ----
    // Upper teeth.
    ctx.fillStyle = 'rgba(225,235,245,0.95)';
    const tooth = (x, y, ang, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16 * s, 52 * s);
      ctx.lineTo(-16 * s, 52 * s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    tooth(280, -60, -0.45, 1.15);
    tooth(220, -100, -0.35, 1.0);
    tooth(155, -128, -0.25, 0.85);
    tooth(95, -146, -0.15, 0.7);

    // Lower jaw swings open around the hinge.
    ctx.save();
    ctx.translate(120, 60);
    ctx.rotate(open * 0.62);
    ctx.translate(-120, -60);
    // jaw slab
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(320, -8);
    ctx.quadraticCurveTo(230, 110, 120, 78);
    ctx.quadraticCurveTo(160, 130, 250, 128);
    ctx.quadraticCurveTo(310, 90, 320, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,170,230,0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();
    // lower teeth pointing up
    tooth(285, 12, Math.PI + 0.5, 1.15);
    tooth(225, 58, Math.PI + 0.4, 1.0);
    tooth(165, 76, Math.PI + 0.3, 0.8);
    ctx.restore();

    // Eye: cold glint.
    ctx.fillStyle = '#02050c';
    ctx.beginPath();
    ctx.arc(70, -70, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(140,190,235,0.55)';
    ctx.beginPath();
    ctx.arc(62, -78, 8, 0, Math.PI * 2);
    ctx.fill();

    // Tail fin.
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-320, -20);
    ctx.lineTo(-420, -140);
    ctx.quadraticCurveTo(-380, -20, -420, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,170,230,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore(); // end fish

    // ---- prey fish before the snap ----
    if (ts < 0) {
      const pt = ease.inOutSine(lib.clamp01((t - 0.5) / 1.45));
      const px = -120 + pt * (lureX + 60);
      const py = H * 0.66 - pt * (H * 0.66 - (lureY + 120)) + Math.sin(t * 5) * 18;
      lib.fish(ctx, t, {
        x: px,
        y: py,
        len: 92,
        dir: 1,
        phase: 1.3,
        color: 'rgba(150,190,230,0.8)',
        eyeColor: 'rgba(230,245,255,0.9)',
      });
    }

    // ---- snap FX ----
    if (ts >= 0 && ts < 0.8) {
      // white flash
      const flash = ts < 0.08 ? 0.24 : Math.max(0, 0.24 * (1 - (ts - 0.08) / 0.2));
      ctx.fillStyle = 'rgba(220,240,255,' + flash + ')';
      ctx.fillRect(0, 0, W, H);

      // burst particles from the mouth
      const mouthX = fx - 300;
      const mouthY = fy - 20;
      const bk = ease.outQuart(lib.clamp01(ts / 0.6));
      for (let i = 0; i < 16; i++) {
        const a = lib.hash(i, 91, 3) * Math.PI * 2;
        const d = (60 + lib.hash(i, 92, 4) * 190) * bk;
        lib.dot(ctx, mouthX + Math.cos(a) * d, mouthY + Math.sin(a) * d * 0.8, 5 + lib.hash(i, 93, 5) * 7, '#cfeaff', (1 - bk) * 0.85);
      }
    }

    // After the snap the dark closes back in.
    if (ts > 0) {
      ctx.fillStyle = 'rgba(2,6,14,' + 0.35 * lib.clamp01(ts / 1.2) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    // Zone tag.
    lib.text(ctx, 'БАТИПЕЛАГИАЛЬ ГЛУБОКАЯ · 3000–4000 м', 72, H - 96, {
      size: 32,
      weight: '500',
      spacing: 5,
      color: 'rgba(120,160,205,0.5)',
      font: lib.mono,
    });
  },
});
