// 10-dance : everyone dances under the disco ball. ТАНЦУЙ КАК ЛИМОН.
FILM.scene({
  id: 'dance',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    lib.rays(ctx, t, { speed: 1.2, count: 22, alpha: 1 });
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(40,10,80,0.25)');
    shade.addColorStop(1, 'rgba(20,5,50,0.45)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    lib.checkerFloor(ctx, t, { y0: H * 0.68, speed: 420 });

    // disco ball
    ctx.save();
    ctx.translate(W / 2, H * 0.12);
    const br = 110;
    const bg = ctx.createRadialGradient(-br * 0.3, -br * 0.3, 10, 0, 0, br);
    bg.addColorStop(0, '#FFFFFF');
    bg.addColorStop(0.5, '#B9D2E8');
    bg.addColorStop(1, '#5A6E88');
    ctx.fillStyle = bg;
    ctx.strokeStyle = lib.pal.ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // facets
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(90,110,140,0.6)';
        ctx.fillRect(i * 42 - 18, j * 42 - 18, 36, 36);
      }
    }
    ctx.restore();
    // light spots sweeping the floor
    for (let i = 0; i < 6; i++) {
      const a = t * 1.2 + (i / 6) * Math.PI * 2;
      const x = W / 2 + Math.cos(a) * W * 0.42;
      const y = H * 0.62 + Math.sin(a * 1.4) * H * 0.18;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 190);
      g.addColorStop(0, 'rgba(255,255,255,0.30)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 190, y - 190, 380, 380);
    }

    const sh = lib.shake(t, 8, 31);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // three dancers, phases offset
    lib.lemonChar(ctx, t, {
      x: W * 0.22,
      y: H * 0.6,
      r: 120,
      mood: 'happy',
      phase: 0,
      bounce: 1.1,
    });
    // parrot-lemon mini
    const flap = Math.sin(t * Math.PI * 4 + 2);
    ctx.save();
    ctx.translate(W * 0.5, H * 0.58 - Math.abs(Math.sin(t * Math.PI * 2)) * 40);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.5 + flap * 0.5));
      ctx.fillStyle = '#FFB100';
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 120, -60);
      ctx.lineTo(side * 170, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    lib.lemonHead(ctx, t, { x: 0, y: 0, r: 105, mood: 'happy', blink: Math.floor(t * 4) % 6 === 0 ? 0.7 : 0 });
    ctx.restore();
    // mini toilet-head
    ctx.save();
    ctx.translate(W * 0.78, H * 0.6);
    lib.toilet(ctx, t, { x: 0, y: 60, s: 0.42 });
    lib.lemonHead(ctx, t, {
      x: 0,
      y: -110 - lib.beat(t, 0.8) * 70,
      r: 78,
      mood: 'happy',
      blink: 0,
    });
    ctx.restore();

    ctx.restore();

    // caption
    const cs = lib.ease.outBack(lib.beat(t, 1.6));
    lib.impact(ctx, 'ТАНЦУЙ', W / 2, H * 0.235, {
      size: 140,
      scale: 0.8 + cs * 0.3,
      rotate: -0.04,
      fill: lib.pal.white,
      maxW: W * 0.6,
    });
    lib.impact(ctx, 'КАК ЛИМОН', W / 2, H * 0.315, {
      size: 140,
      scale: 0.8 + cs * 0.3,
      rotate: 0.04,
      fill: lib.pal.lemon,
      maxW: W * 0.75,
    });
  },
});
