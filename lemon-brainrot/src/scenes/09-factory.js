// 09-factory : the lemon conveyor. One of them is an orange impostor.
FILM.scene({
  id: 'factory',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // factory wall
    lib.rays(ctx, t * 0.2, { speed: 0.06, count: 2, alpha: 1, colors: ['#8A93A5', '#7B8496'] });
    ctx.fillStyle = 'rgba(30,36,50,0.25)';
    for (let y = 0; y < H * 0.6; y += 180) {
      for (let x = 0; x < W; x += 220) {
        ctx.fillRect(x + ((y / 180) % 2) * 110, y, 200, 160);
      }
    }
    // pipes
    ctx.strokeStyle = '#5A6478';
    ctx.lineWidth = 46;
    ctx.beginPath();
    ctx.moveTo(-20, H * 0.2);
    ctx.lineTo(W * 0.3, H * 0.2);
    ctx.lineTo(W * 0.3, H * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W + 20, H * 0.14);
    ctx.lineTo(W * 0.68, H * 0.14);
    ctx.lineTo(W * 0.68, H * 0.38);
    ctx.stroke();

    const sh = lib.shake(t, 5, 29);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // conveyor belt
    const beltY = H * 0.72;
    ctx.fillStyle = '#2A3140';
    ctx.strokeStyle = lib.pal.ink;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(-60, beltY, W + 120, 150, 40);
    ctx.fill();
    ctx.stroke();
    // belt rollers / stripes
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    const scroll = (t * 380) % 160;
    for (let x = -160 + scroll; x < W + 160; x += 160) {
      ctx.fillRect(x, beltY + 18, 70, 114);
    }

    // lemons marching on the belt
    for (let i = 0; i < 5; i++) {
      const r = lib.hash(i, 71, 1);
      const x = ((t * 380 + i * 240) % (W + 400)) - 200;
      const y = beltY - 110 + Math.sin(t * 7 + i) * 10;
      const impostor = i === 2;
      if (impostor) {
        // ORANGE COSTUME: same shape, orange colour, fake leaf
        lib.lemonHead(ctx, t, {
          x,
          y,
          r: 105,
          mood: 'sus',
          blink: 0,
        });
        // repaint body orange over the lemon (costume)
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#FF8A00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 140, 118, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        lib.lemonHead(ctx, t, { x, y, r: 105, mood: 'sus', blink: 0 });
        ctx.save();
        ctx.translate(x, y);
        // orange skin tone overlay (a bit darker circle pack)
        ctx.fillStyle = 'rgba(255,138,0,0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 132, 110, 0, 0, Math.PI * 2);
        ctx.fill();
        // leaf
        ctx.fillStyle = '#37D67A';
        ctx.strokeStyle = lib.pal.ink;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(40, -120, 46, 20, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // face again on top (sus)
        ctx.save();
        ctx.translate(x, y);
        // eyes (suspicious, narrowed)
        for (const side of [-1, 1]) {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = lib.pal.ink;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.ellipse(side * 36, -14, 24, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = lib.pal.ink;
          ctx.beginPath();
          ctx.arc(side * 30, -12, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        lib.lemonHead(ctx, t, {
          x,
          y,
          r: 105,
          mood: 'happy',
          blink: (Math.floor(t * 3 + i) % 5 === 0) ? 0.7 : 0,
        });
      }
    }

    // red arrow pointing at the impostor at t>2
    if (t > 2) {
      const k = lib.clamp01((t - 2) / 0.3);
      const ax = ((t * 380 + 2 * 240) % (W + 400)) - 200;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.translate(ax, beltY - 320);
      ctx.rotate(0.5 + Math.sin(t * 5) * 0.12);
      ctx.fillStyle = lib.pal.red;
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, -120);
      ctx.lineTo(90, 20);
      ctx.lineTo(34, 20);
      ctx.lineTo(34, 130);
      ctx.lineTo(-34, 130);
      ctx.lineTo(-34, 20);
      ctx.lineTo(-90, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // captions
    const cs = lib.ease.outBack(lib.clamp01(t / 0.3));
    lib.impact(ctx, 'ЛИМОН ПРЕТВОРЯЕТСЯ', W / 2, H * 0.13, {
      size: 108,
      scale: 1.6 - cs * 0.6,
      fill: lib.pal.lemon,
      maxW: W * 0.9,
    });
    lib.impact(ctx, 'АПЕЛЬСИНОМ', W / 2, H * 0.205, {
      size: 108,
      scale: 1.6 - cs * 0.6,
      fill: lib.pal.orange,
      maxW: W * 0.8,
    });
    if (t > 2) {
      lib.impact(ctx, 'ПАЛИМ ЕГО!', W / 2, H * 0.92, {
        size: 120,
        alpha: lib.clamp01((t - 2) / 0.25),
        scale: 0.7 + lib.beat(t - 2, 0.4) * 0.3,
        fill: lib.pal.red,
        maxW: W * 0.6,
      });
    }
  },
});
