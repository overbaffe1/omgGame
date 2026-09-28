// 03-reef : a coral garden on the photic floor, kelp swaying, schools threading past.
FILM.scene({
  id: 'reef',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Slow push-in anchored to the floor.
    const push = ease.inOutSine(lib.clamp01(t / 3)) * 0.07;
    ctx.save();
    ctx.translate(W / 2, H);
    ctx.scale(1 + push, 1 + push);
    ctx.translate(-W / 2, -H);

    // Deeper water.
    lib.gradV(ctx, -60, -60, W + 120, H + 120, [
      [0, lib.pal.reef0],
      [0.4, lib.pal.reef1],
      [1, lib.pal.reef2],
    ]);

    // Faint rays.
    lib.godrays(ctx, t, {
      x: W * 0.42,
      y: -H * 0.06,
      spread: 1.2,
      count: 7,
      alpha: 0.10,
      color: 'rgba(220,240,220,',
    });

    // Far ridge.
    lib.rocks(ctx, { y: H * 0.72, amp: 90, color: 'rgba(10,48,88,0.85)', seed: 21, step: 120 });

    // Kelp garden behind the reef.
    for (let i = 0; i < 7; i++) {
      const r = lib.hash(i, 33, 1);
      lib.strand(ctx, t, {
        x: W * (0.06 + i * 0.14) + r * 60,
        y: H * 0.82,
        h: 380 + r * 320,
        sway: 26 + r * 34,
        phase: i * 1.3,
        w: 12 + r * 8,
        color: '#1d6b57',
        color2: '#3fae83',
        segs: 12,
        leafy: i % 2 === 0,
      });
    }

    // Foreground reef rock.
    lib.rocks(ctx, {
      y: H * 0.86,
      amp: 130,
      color: '#062a4e',
      seed: 7,
      step: 80,
      rimColor: 'rgba(120,200,220,0.5)',
      rimAlpha: 0.35,
      rimWidth: 5,
    });

    // ---- corals ----
    // Fan corals.
    const fan = (x, y, r, col, phase) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.6 + phase) * 0.06 - 0.15);
      ctx.strokeStyle = col;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (let a = -1.05; a <= 1.05; a += 0.21) {
        const rr = r * (0.82 + lib.hash(a * 100, 5, 2) * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr * 0.92);
        ctx.stroke();
        // polyps
        ctx.beginPath();
        ctx.arc(Math.sin(a) * rr, -Math.cos(a) * rr * 0.92, 7, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      // arcs between rays
      ctx.lineWidth = 4;
      for (let k = 0.45; k <= 1; k += 0.28) {
        ctx.beginPath();
        ctx.arc(0, 0, r * k, -1.1, 1.1);
        ctx.stroke();
      }
      ctx.restore();
    };
    fan(W * 0.16, H * 0.885, 190, '#e8577f', 0);
    fan(W * 0.84, H * 0.9, 230, '#ff8c6b', 2);
    fan(W * 0.62, H * 0.875, 150, '#ffc857', 4);

    // Branch coral: recursive Y.
    const branch = (x, y, ang, len, depth, col) => {
      if (depth <= 0) return;
      const x2 = x + Math.sin(ang) * len;
      const y2 = y - Math.cos(ang) * len;
      ctx.strokeStyle = col;
      ctx.lineWidth = 4 + depth * 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const spread = 0.42 + lib.hash(depth, x | 0, 3) * 0.25;
      branch(x2, y2, ang - spread, len * 0.74, depth - 1, col);
      branch(x2, y2, ang + spread, len * 0.74, depth - 1, col);
      if (depth > 2) branch(x2, y2, ang + (lib.hash(depth, y | 0, 9) - 0.5) * 0.3, len * 0.6, depth - 2, col);
    };
    branch(W * 0.30, H * 0.92, -0.12, 110, 5, '#d94f6e');
    branch(W * 0.47, H * 0.93, 0.16, 90, 5, '#c4478a');

    // Brain coral clusters.
    const brain = (x, y, r, col) => {
      for (let i = 0; i < 9; i++) {
        const a = lib.hash(i, x | 0, 4) * Math.PI * 2;
        const rr = r * 0.55 * lib.hash(i, y | 0, 6);
        const cr = r * (0.34 + lib.hash(i, 7, 8) * 0.3);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.5, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,180,160,0.4)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(x - r * 0.2 + i * r * 0.16, y - r * 0.15, r * 0.2, 0.6, 2.4);
        ctx.stroke();
      }
    };
    brain(W * 0.70, H * 0.925, 120, '#e07a5f');
    brain(W * 0.10, H * 0.94, 100, '#b04a6a');

    // ---- schools ----
    for (let i = 0; i < 9; i++) {
      const r1 = lib.hash(i, 44, 1);
      const speed = 150 + r1 * 60;
      const dir = 1;
      const x = ((t * speed + r1 * W * 1.8) % (W * 1.5)) - W * 0.25;
      const y = H * (0.32 + r1 * 0.16) + Math.sin(t * 1.4 + i * 0.9) * 40 - i * 6;
      lib.fish(ctx, t, {
        x,
        y,
        len: 86 + r1 * 26,
        dir,
        phase: i * 1.1,
        color: 'rgba(255,214,140,0.92)',
      });
    }
    for (let i = 0; i < 6; i++) {
      const r1 = lib.hash(i, 55, 2);
      const speed = 110 + r1 * 50;
      const dir = -1;
      const x = W + W * 0.25 - ((t * speed + r1 * W * 1.8) % (W * 1.5));
      const y = H * (0.5 + r1 * 0.14) + Math.sin(t * 1.1 + i * 1.4) * 30;
      lib.fish(ctx, t, {
        x,
        y,
        len: 66 + r1 * 22,
        dir,
        phase: i * 2.2,
        color: 'rgba(120,190,230,0.9)',
      });
    }

    // Bubbles + snow.
    lib.bubbles(ctx, t, { count: 12, speed: 120, seed: 31, alpha: 0.4, rMax: 18 });
    lib.snow(ctx, t, { count: 34, speed: 16, seed: 9, alpha: 0.3 });

    ctx.restore(); // end push

    lib.text(ctx, 'ЭПИПЕЛАГИАЛЬ · ФОТИЧЕСКАЯ ЗОНА', 72, H - 96, {
      size: 32,
      weight: '500',
      spacing: 5,
      color: 'rgba(190,225,250,0.6)',
      font: lib.mono,
    });
  },
});
