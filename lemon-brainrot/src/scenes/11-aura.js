// 11-aura : ЛИМОН ПРЕДЕЛЬНОЙ ФОРМЫ — crown, laser eyes, rainbow aura, lightning.
FILM.scene({
  id: 'aura',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // dark power background
    ctx.fillStyle = '#0A0616';
    ctx.fillRect(0, 0, W, H);
    lib.rays(ctx, t, { speed: 1.4, count: 16, alpha: 0.5, colors: ['#8E5BFF', '#FFD23F', '#FF4FA3', '#3ED8FF'] });
    const g = ctx.createRadialGradient(W / 2, H * 0.46, 40, W / 2, H * 0.46, W * 0.85);
    g.addColorStop(0, 'rgba(255,210,63,0.28)');
    g.addColorStop(0.5, 'rgba(142,91,255,0.22)');
    g.addColorStop(1, 'rgba(10,6,22,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const power = 0.5 + 0.5 * Math.sin(t * Math.PI * 2); // breathing
    const sh = lib.shake(t, 6 + power * 10, 37);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // aura flames (wavy spikes)
    const ax = W / 2;
    const ay = H * 0.5;
    for (let ring = 0; ring < 3; ring++) {
      ctx.fillStyle = ['rgba(255,210,63,0.35)', 'rgba(255,120,60,0.30)', 'rgba(142,91,255,0.28)'][ring];
      ctx.beginPath();
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wob = 0.8 + 0.2 * Math.sin(a * 7 + t * (7 + ring * 2));
        const r = (330 + ring * 70) * wob * (1 + power * 0.12);
        const x = ax + Math.cos(a) * r;
        const y = ay + Math.sin(a) * r * 1.18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // floating rock shards
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.9;
      const r = 340 + Math.sin(t * 1.4 + i * 2) * 36;
      const x = ax + Math.cos(a) * r;
      const y = ay + Math.sin(a) * r * 1.15;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t + i);
      ctx.fillStyle = '#4A3A78';
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(28, 12);
      ctx.lineTo(-6, 34);
      ctx.lineTo(-30, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // the lemon: crown + lasers
    lib.lemonChar(ctx, t, {
      x: ax,
      y: ay,
      r: 200,
      mood: 'angry',
      crown: true,
      laser: 1,
      armSwing: 0.4,
      bounce: 0.5,
    });

    // laser eye beams upward-outward
    for (const side of [-1, 1]) {
      const ex = ax + side * 68;
      const ey = ay - 24;
      const g2 = ctx.createLinearGradient(ex, ey, ex + side * 700, ey - 300);
      g2.addColorStop(0, 'rgba(255,60,40,0.95)');
      g2.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + side * 760, ey - 380 - power * 60);
      ctx.lineTo(ex + side * 760, ey - 120 + power * 40);
      ctx.closePath();
      ctx.fill();
    }

    // lightning bolts on the beats
    for (let i = 0; i < 4; i++) {
      const bt = i * 0.8;
      const dt = t - bt;
      if (dt >= 0 && dt < 0.18) {
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        let x = W * (0.15 + lib.hash(i, 81, 1) * 0.7);
        let y = 0;
        ctx.moveTo(x, y);
        while (y < H) {
          x += (lib.hash(i, y | 0, 2) - 0.5) * 220;
          y += 120;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();

    // captions
    const cs = lib.ease.outBack(lib.clamp01(t / 0.3));
    lib.impact(ctx, 'ПРЕДЕЛЬНАЯ', W / 2, H * 0.13, {
      size: 128,
      scale: 1.8 - cs * 0.8,
      fill: lib.pal.white,
      maxW: W * 0.85,
    });
    lib.impact(ctx, 'ФОРМА ЛИМОНА', W / 2, H * 0.21, {
      size: 128,
      scale: 1.8 - cs * 0.8,
      fill: lib.pal.lemon,
      maxW: W * 0.88,
    });
  },
});
