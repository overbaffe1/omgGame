// 09-whale-fall : a whale skeleton on the abyssal plain, snow falling, scavengers at work.
FILM.scene({
  id: 'whale-fall',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;
    const ease = lib.ease;

    // Abyssal water.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, lib.pal.deep0],
      [0.55, lib.pal.deep1],
      [1, lib.pal.deep2],
    ]);

    // Slow pan across the bones.
    const pan = ease.inOutSine(lib.clamp01(t / 3.5));
    ctx.save();
    ctx.translate(lib.lerp(90, -90, pan), 0);

    // Sea floor.
    lib.rocks(ctx, {
      y: H * 0.82,
      amp: 70,
      color: '#03101f',
      seed: 31,
      step: 110,
      rimColor: 'rgba(90,140,190,0.35)',
      rimAlpha: 0.5,
      rimWidth: 3,
    });

    // Floor speckle.
    for (let i = 0; i < 40; i++) {
      const x = lib.hash(i, 71, 1) * W;
      const y = H * 0.84 + lib.hash(i, 72, 2) * H * 0.12;
      lib.dot(ctx, x, y, 2 + lib.hash(i, 73, 3) * 5, '#12294a', 0.7);
    }

    // ---- whale skeleton, side view, skull at the left ----
    const bx = W * 0.52;
    const by = H * 0.70;

    // Spine curve helper.
    const spineY = (k) => by - 90 * Math.sin(k * Math.PI * 0.9) - 30 * k;

    // Skull.
    ctx.fillStyle = lib.pal.bone;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 430, spineY(0) + 10);
    ctx.quadraticCurveTo(bx - 560, spineY(0) - 30, bx - 620, spineY(0) + 40); // rostrum
    ctx.quadraticCurveTo(bx - 560, spineY(0) + 120, bx - 420, spineY(0) + 130); // upper jaw
    ctx.quadraticCurveTo(bx - 330, spineY(0) + 120, bx - 320, spineY(0) + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // jaw bone below
    ctx.beginPath();
    ctx.moveTo(bx - 600, spineY(0) + 92);
    ctx.quadraticCurveTo(bx - 460, spineY(0) + 190, bx - 330, spineY(0) + 130);
    ctx.lineWidth = 14;
    ctx.strokeStyle = lib.pal.bone;
    ctx.stroke();
    // eye socket
    ctx.fillStyle = '#041226';
    ctx.beginPath();
    ctx.ellipse(bx - 400, spineY(0) + 40, 34, 28, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Vertebrae along the spine.
    const NV = 26;
    for (let i = 0; i <= NV; i++) {
      const k = i / NV;
      const x = bx - 320 + k * 720;
      const y = spineY(k);
      const r = 26 - k * 12;
      ctx.fillStyle = lib.pal.bone;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.15, r, 0, 0, Math.PI * 2);
      ctx.fill();
      // spinous process
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.6);
      ctx.lineTo(x - 8, y - r - 26 + k * 14);
      ctx.lineTo(x + 10, y - r * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // Ribs: 11 arcs from the spine down to the floor.
    for (let i = 0; i < 11; i++) {
      const k = 0.06 + (i / 11) * 0.62;
      const x = bx - 320 + k * 720;
      const y = spineY(k);
      const reach = 240 - i * 8;
      ctx.strokeStyle = lib.pal.bone;
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.bezierCurveTo(x + 30, y + reach * 0.55, x - 20, y + reach * 0.95, x + 40 + i * 14, y + reach);
      ctx.stroke();
    }

    // Tail-side pelvis flukes (small).
    ctx.beginPath();
    ctx.ellipse(bx + 420, spineY(1) + 20, 90, 34, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = lib.pal.bone;
    ctx.fill();

    // (no shading block: hard rectangle edges read as an artifact in the dark)

    // ---- scavengers: squat lobsters near the ribs ----
    const crab = (x, y, s, phase, dir) => {
      ctx.save();
      ctx.translate(x + Math.sin(t * 0.4 + phase) * 14 * dir, y);
      ctx.scale(s * dir, s);
      ctx.fillStyle = '#c46a4a';
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // claws
      ctx.strokeStyle = '#c46a4a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(20, 8);
      ctx.lineTo(52, 26 + Math.sin(t * 1.3 + phase) * 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, -6);
      ctx.lineTo(56, -18 - Math.sin(t * 1.1 + phase) * 6);
      ctx.stroke();
      // legs
      for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 0.36;
        ctx.beginPath();
        ctx.moveTo(-6 + i * 8, 12);
        ctx.lineTo(-6 + i * 8 + Math.sin(a) * 30, 34 + Math.sin(t * 2 + i + phase) * 3);
        ctx.stroke();
      }
      // antennae
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, -8);
      ctx.lineTo(58, -30);
      ctx.moveTo(30, -2);
      ctx.lineTo(64, -18);
      ctx.stroke();
      ctx.restore();
    };
    crab(bx - 240, by + 170, 1.0, 0, 1);
    crab(bx - 60, by + 210, 1.25, 2, -1);
    crab(bx + 190, by + 150, 0.85, 4, 1);
    crab(bx + 340, by + 220, 1.05, 1, -1);

    // Hagfish ribbon near the ribcage.
    ctx.save();
    ctx.strokeStyle = 'rgba(190,160,130,0.85)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const x = bx - 330 + k * 330 + Math.sin(t * 0.8 + k * 4) * 30;
      const y = by + 250 + Math.cos(t * 0.6 + k * 5) * 26 - k * 40;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end pan

    // Heavy marine snow all around.
    lib.snow(ctx, t, { count: 90, speed: 42, seed: 77, alpha: 0.5, rMin: 1.5, rMax: 6, drift: 22 });
    lib.snow(ctx, t, { count: 16, speed: 70, seed: 78, alpha: 0.35, rMin: 5, rMax: 11, drift: 12 });

    lib.text(ctx, 'АБИССОПЕЛАГИАЛЬ · 4000–6000 м', 72, H - 96, {
      size: 32,
      weight: '500',
      spacing: 5,
      color: 'rgba(130,165,205,0.5)',
      font: lib.mono,
    });
  },
});
