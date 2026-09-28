// 04-toilet : the skibidi homage — a lemon head popping out of a toilet on every ДОП.
FILM.scene({
  id: 'toilet',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // bathroom tile wall
    lib.rays(ctx, t * 0.15, { speed: 0.1, count: 2, alpha: 1, colors: ['#BFE8F2', '#A8DDEE'] });
    const tile = 120;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let y = 0; y < H * 0.72; y += tile) {
      for (let x = ((y / tile) % 2) * tile; x < W; x += tile * 2) {
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.strokeStyle = 'rgba(70,130,160,0.35)';
    ctx.lineWidth = 4;
    for (let y = 0; y <= H * 0.72; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H * 0.72);
      ctx.stroke();
    }
    // floor
    ctx.fillStyle = '#7FB6C9';
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, H * 0.72, W, 26);

    const sh = lib.shake(t, 7 + lib.beat(t, 0.8) * 10, 11);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // toilet
    lib.toilet(ctx, t, { x: W / 2, y: H * 0.62, s: 1.35 });

    // head pops on every 0.8 s (the ДОП-ДОП)
    const pop = lib.beat(t, 0.8);
    const headY = H * 0.62 - 300 - pop * 260;
    const zoom = 1 + pop * 0.07;
    lib.punch(ctx, zoom, () => {
      // water splash when he is down
      if (pop < 0.35) {
        ctx.fillStyle = 'rgba(160,220,255,0.75)';
        for (let i = 0; i < 8; i++) {
          const a = -Math.PI / 2 + (i / 8 - 0.5) * 2.2;
          const d = (1 - pop / 0.35) * 130;
          ctx.beginPath();
          ctx.arc(W / 2 + Math.cos(a) * (90 + d), H * 0.62 - 260 + Math.sin(a) * d * 0.6, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      lib.lemonHead(ctx, t, {
        x: W / 2,
        y: headY,
        r: 175,
        mood: pop > 0.6 ? 'scream' : 'happy',
        blink: pop < 0.25 ? 0.8 : 0,
      });
    });
    ctx.restore();

    // captions alternate ДОП ДОП / ДА ДА
    const phrase = Math.floor(t / 0.8) % 2 === 0 ? 'ДОП ДОП' : 'ДА ДА';
    const cs = lib.ease.outBack(pop);
    lib.impact(ctx, phrase, W / 2, H * 0.17, {
      size: 170,
      scale: 0.6 + cs * 0.5,
      rotate: (lib.hash(Math.floor(t / 0.8), 2, 1) - 0.5) * 0.14,
      fill: Math.floor(t / 0.8) % 2 === 0 ? lib.pal.red : lib.pal.cyan,
      maxW: W * 0.75,
    });

    if (t > 2.2) {
      lib.impact(ctx, 'он в унитазе. это нормально.', W / 2, H * 0.94, {
        size: 52,
        alpha: lib.clamp01((t - 2.2) / 0.3),
        fill: lib.pal.white,
        maxW: W * 0.85,
        strokeW: 7,
      });
    }
  },
});
