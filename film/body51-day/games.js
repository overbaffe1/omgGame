/* Three games, three physical visual jokes. These are original illustrations,
 * not captured gameplay. Kept in the same bounded 2D stage as the rest of the film. */
(function (root) {
  'use strict';
  root.Body51DayGames = function (a) {
    const {g, C, box, oval, shape, line, poly, label, local, asset, tag, sparkle, shadow, floor, person, cue, ease, seg, lerp, clamp} = a;
    const TAU = Math.PI * 2;
    function header(title, color = '#c4d6c0', sub = '') {
      box(128, 490, 824, 74, 20, color, C.ink, 4);
      label(title, 164, 538, 31, C.ink, 800, 'left', sub ? 563 : 751);
      if (sub) label(sub, 919, 536, 19, C.ink, 800, 'right', 170);
    }
    function coin(x, y, r, spin) {
      oval(x, y, Math.max(r * .22, Math.abs(Math.cos(spin)) * r), r, C.yellow, '#916e39', 2);
      line([[x, y - r * .48], [x, y + r * .48]], '#fff0b8', 2);
    }
    function heart(x, y, s, col = C.coral) {
      local(x, y, s, () => shape(p => {
        p.moveTo(0, 20); p.bezierCurveTo(-65, -22, -31, -61, 0, -30);
        p.bezierCurveTo(31, -61, 65, -22, 0, 20); p.closePath();
      }, col, null));
    }
    function bread(x, y, s, angle = 0) {
      asset('Батон', x, y, s, [-94, -30, 94, 32], () => {
        oval(0, 0, 91, 29, '#dfb36f', C.ink, 4);
        oval(-9, -10, 68, 11, '#efcd8c');
        for (let i = 0; i < 4; i++) shape(p => { p.moveTo(-53 + i * 32, 8); p.quadraticCurveTo(-44 + i * 32, -3, -51 + i * 32, -13); }, null, '#a5784b', 4);
      }, angle);
    }
    function villager(x, y, s, t, baker = false, arm = 0) {
      asset(baker ? 'Пекарь' : 'Персонаж White Meridian', x, y, s, [-82, -229, 82, 11], () => {
        const walk = Math.sin(t * 9), bob = Math.abs(walk) * 3;
        line([[-22, -51], [-29 + walk * 7, 0]], C.ink, 21);
        line([[24, -51], [30 - walk * 7, 0]], C.ink, 21);
        oval(-28 + walk * 7, 3, 20, 8, C.navy); oval(30 - walk * 7, 3, 20, 8, C.navy);
        local(0, -bob, 1, () => {
          box(-40, -120, 80, 85, 18, baker ? '#b98a6a' : '#568783', C.ink, 4);
          if (baker) box(-29, -99, 58, 64, 6, C.white, C.ink, 3);
          line([[-38, -104], [-65, -77 - arm * 32], [-75, -101 - arm * 29]], C.ink, 15);
          line([[38, -104], [59, -88], [72, -98 - arm * 18]], C.ink, 15);
          oval(-73, -99 - arm * 29, 12, 13, C.skin, C.ink, 3); oval(73, -98 - arm * 18, 12, 13, C.skin, C.ink, 3);
          oval(0, -156, 43, 46, C.skin, C.ink, 4);
          if (baker) {
            box(-38, -209, 76, 34, 9, C.white, C.ink, 3);
            for (let i = 0; i < 3; i++) oval(-30 + i * 30, -211, 24, 18, C.white, C.ink, 3);
          } else {
            shape(p => { p.moveTo(-44, -155); p.lineTo(-41, -192); p.lineTo(9, -210); p.lineTo(43, -176); p.lineTo(44, -151); p.quadraticCurveTo(12, -180, -44, -155); }, '#527f69', C.ink, 4);
            poly([[-40, -124], [39, -124], [24, -101], [-10, -108]], C.coral, C.ink, 3);
          }
          for (const d of [-1, 1]) { oval(d * 16, -153, 3, 5, C.ink); line([[d * 16 - 6, -168 + (baker ? d * 3 : 0)], [d * 16 + 7, -168 - (baker ? d * 3 : 0)]], C.ink, 3); }
          shape(p => { p.moveTo(-8, -136); p.quadraticCurveTo(0, baker ? -142 : -127, 12, -136); }, null, C.ink, 3);
        });
      });
    }

    function hellfarmer(s, t) {
      floor(1386); header('DESKTOP HELLFARMER', '#dab99a', 'В РЕЛИЗЕ');
      box(128, 580, 824, 682, 25, '#263e48', C.ink, 5);
      g.save(); g.beginPath(); g.roundRect(142, 592, 796, 656, 18); g.clip();
      const phase = (t * .69) % 1, hit = ease(seg(phase, .25, .42));
      // Layered little dungeon. Everything is actually drawn inside the window.
      for (let i = 0; i < 8; i++) {
        box(142 + i * 115, 669 + i % 2 * 42, 93, 183, 5, i % 2 ? '#38514e' : '#3f5a56', null);
        line([[161 + i * 115, 693 + i % 2 * 42], [209 + i * 115, 693 + i % 2 * 42]], '#577068', 3);
      }
      box(726, 693, 147, 212, 68, '#926246', '#b28454', 7);
      box(746, 713, 107, 193, 52, '#d7a24f', null);
      for (let i = 0; i < 6; i++) oval(764 + i * 14, 799 + Math.sin(t * 3 + i) * 39, 11, 37, '#e5bd603e');
      poly([[142, 967], [455, 893], [938, 946], [938, 1260], [142, 1260]], '#4a5b50', null);
      for (let i = 0; i < 5; i++) line([[149, 1016 + i * 51], [937, 1011 + i * 55]], '#64715a', 2);
      shadow(460, 1100, 89, 16); shadow(740, 1088, 67, 15);
      // Automated fighter: anticipation, follow-through, recovery, not a static icon.
      local(462 + hit * 24, 1081, 1.12, () => {
        const bob = Math.sin(t * 7) * 4;
        line([[-28, -58], [-43, 0]], '#aebba3', 23); line([[24, -58], [48, 0]], '#aebba3', 23);
        box(-45, -150 + bob, 90, 104, 20, '#86aeb0', '#172f38', 5);
        poly([[-48, -60], [50, -60], [62, -37], [-63, -37]], '#bd9b66', C.ink, 4);
        oval(0, -177 + bob, 45, 41, '#d7c7a3', C.ink, 4);
        shape(p => { p.moveTo(-49, -168 + bob); p.lineTo(-38, -213 + bob); p.lineTo(15, -240 + bob); p.lineTo(44, -206 + bob); p.lineTo(48, -168 + bob); p.quadraticCurveTo(0, -197 + bob, -49, -168 + bob); }, '#88a6a3', C.ink, 5);
        line([[-25, -175 + bob], [25, -175 + bob]], '#243c40', 7);
        line([[-45, -129], [-67, -83]], '#bdc6aa', 23);
        // A curved slash resolves before the next cycle, never leaving the playfield.
        const angle = lerp(-.95, .88, hit) * (1 - ease(seg(phase, .62, .94)));
        local(43, -116, 1, () => {
          line([[0, 0], [34, -22]], '#bdc6aa', 22); oval(37, -23, 13, 13, '#d7c7a3', C.ink, 3);
          poly([[37, -39], [43, -182], [60, -214], [75, -182], [67, -34]], '#dce5cf', C.ink, 4);
          line([[24, -38], [83, -28]], '#b79761', 10);
        }, angle);
      });
      const dead = phase > .36 && phase < .77;
      if (!dead) local(730 - seg(phase, 0, .36) * 39, 1091, 1, () => {
        const walk = Math.sin(t * 12) * 7;
        line([[-14, -39], [-23 + walk, 0]], '#c5ccb4', 10); line([[14, -39], [23 - walk, 0]], '#c5ccb4', 10);
        line([[0, -101], [0, -35]], '#c5ccb4', 10);
        for (let j = 0; j < 3; j++) line([[-23, -89 + j * 15], [23, -89 + j * 15]], '#c5ccb4', 7);
        oval(0, -130, 36, 34, '#d7d8be', C.ink, 4);
        for (const d of [-1, 1]) oval(d * 12, -132, 7, 9, C.ink);
        line([[-19, -110], [19, -110]], C.ink, 3);
        line([[-20, -97], [-45, -77]], '#c5ccb4', 9); line([[20, -97], [48, -107]], '#c5ccb4', 9);
      });
      if (dead) {
        const p = seg(phase, .36, .77);
        g.save(); g.globalAlpha = 1 - p;
        for (let i = 0; i < 8; i++) sparkle(694 + Math.cos(i * TAU / 8) * (20 + p * 86), 984 + Math.sin(i * TAU / 8) * p * 71, 7 + (1 - p) * 8, '#e6ce8e', i);
        g.restore();
        for (let i = 0; i < 4; i++) {
          const pp = clamp((p - i * .07) * 1.35);
          coin(lerp(704, 584, pp) + i * 19, lerp(1028, 1184, pp) - Math.sin(pp * Math.PI) * 149, 11, t * 13 + i);
        }
        label('ЛУТ +1', 758, 890 - p * 24, 26, '#e4ce8c', 800, 'center', 190);
      }
      box(182, 1163, 702, 56, 14, '#20363c', '#78907f', 3);
      label('АВТОБОЙ', 358, 1200, 23, '#bbd4ba', 800, 'left', 220);
      for (let i = 0; i < 5; i++) { box(526 + i * 60, 1173, 44, 36, 5, '#3b5352', null); coin(548 + i * 60, 1191, 10, i); }
      g.restore();
      person(235, 1421, .59, t, {pose: 'point'});
      tag(t > cue(s, 2) ? 'ДАЖЕ ИГРА РАБОТАЕТ' : 'САМ БЬЁТ. САМ ЛУТАЕТ.', 682, 1375, 449, C.yellow, 26, -.018);
    }

    function backpack(x, y, s, t) {
      asset('Рюкзак', x, y, s, [-156, -354, 156, 20], () => {
        shadow(0, 5, 157, 19);
        shape(p => { p.moveTo(-57, -292); p.quadraticCurveTo(-64, -366, 0, -359); p.quadraticCurveTo(64, -366, 57, -292); }, null, C.ink, 25);
        shape(p => { p.moveTo(-57, -292); p.quadraticCurveTo(-64, -366, 0, -359); p.quadraticCurveTo(64, -366, 57, -292); }, null, '#ae805f', 15);
        box(-138, -295, 276, 300, 62, '#ae896e', C.ink, 6);
        box(-103, -130, 206, 115, 24, '#c49d79', C.ink, 4);
        line([[-95, -108], [96, -108]], '#805f4c', 4);
        for (let j = 0; j < 11; j++) line([[-88 + j * 18, -110], [-88 + j * 18, -102]], '#f0cea1', 3);
        box(64, -103, 11, 26, 3, C.yellow, C.ink, 2);
        shape(p => { p.moveTo(-133, -257); p.quadraticCurveTo(0, -211 + Math.sin(t * 5) * 3, 133, -257); }, null, '#694f46', 18);
        for (const d of [-1, 1]) { box(d * 84 - 11, -290, 23, 207, 8, '#745e4f', C.ink, 3); box(d * 84 - 18, -174, 37, 47, 7, '#d1b78b', C.ink, 3); }
        label('BI', 0, -43, 35, '#795d49', 800, 'center', 110);
      });
    }
    function inspector(s, t) {
      floor(1391); header('BACKPACK INSPECTOR', '#c6d5d4', 'ВИШЛИСТЫ');
      const shower = ease(seg(t, cue(s, 1) + .45, cue(s, 2) - .2));
      const count = Math.round(lerp(500, 13500, shower));
      label(count.toLocaleString('ru-RU'), 543, 706, 118, C.blue, 800, 'center', 680);
      label('на том самом стриме', 543, 754, 25, '#6e8a81', 600, 'center', 600);
      // Calendar becomes the accidental employee of the month.
      local(305, 1016, 1, () => {
        box(-145, -207, 290, 345, 22, C.white, C.ink, 5);
        box(-145, -207, 290, 73, 19, C.coral, C.ink, 4);
        label('РЕЛИЗ', 0, -158, 35, C.white, 800, 'center', 260);
        for (const x of [-85, 85]) box(x - 9, -224, 18, 40, 8, '#8d9b91', C.ink, 3);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) box(-105 + c * 62, -104 + r * 51, 30, 26, 4, '#d6dccb', null);
        label(t < cue(s, 1) + .3 ? 'ПЕРЕНЕСТИ?' : 'ОЙ.', 0, 80, t < cue(s, 1) + .3 ? 27 : 57, C.ink, 800, 'center', 257);
      }, Math.sin(t * 3) * .015 * shower);
      // Arcing cards land inside the open bag, instead of spilling off-screen.
      backpack(756, 1202, 1.01, t);
      if (t > cue(s, 1)) for (let i = 0; i < 8; i++) {
        const p = ((t - cue(s, 1)) * .69 + i * .123) % 1;
        const x = lerp(429, 760, p), y = lerp(950, 951, p) - Math.sin(p * Math.PI) * 127;
        local(x, y, .67, () => {
          box(-37, -44, 74, 88, 10, C.white, '#99ada1', 3);
          heart(0, 4, .6); line([[-20, 29], [20, 29]], '#bbc9b8', 3);
        }, -.3 + p * .7);
      }
      if (t >= cue(s, 2)) {
        tag('МАРКЕТОЛОГ МЕСЯЦА', 599, 1321, 482, C.yellow, 30, -.025);
        local(305, 1230, ease(seg(t, cue(s, 2), cue(s, 2) + .3)), () => {
          poly([[-26, 17], [-36, 93], [0, 73], [36, 93], [26, 17]], '#5275b8', C.ink, 4);
          oval(0, 0, 56, 56, C.yellow, C.ink, 4); sparkle(0, 0, 35, '#fff2be', 0);
        });
      }
      person(163, 1427, .45, t, {pose: 'point', puzzled: t < cue(s, 2)});
    }

    function meridian(s, t) {
      floor(1389); header('WHITE MERIDIAN', '#c4d8c4', 'ПРОТОТИП');
      box(128, 579, 824, 664, 24, '#c5dbd1', C.ink, 5);
      g.save(); g.beginPath(); g.roundRect(142, 591, 796, 639, 16); g.clip();
      oval(804, 696, 54, 54, '#ead49b');
      for (let i = 0; i < 3; i++) oval(240 + i * 231 + Math.sin(t * .08 + i) * 8, 655 + i % 2 * 43, 75, 15, '#e6e8d5');
      poly([[139, 933], [257, 728], [382, 873], [521, 691], [707, 914], [875, 735], [939, 888], [939, 1240], [139, 1240]], '#7da292', null);
      poly([[139, 1004], [381, 856], [538, 966], [727, 824], [939, 952], [939, 1240], [139, 1240]], '#9db799', null);
      box(142, 1087, 796, 154, 0, '#bcc299', null);
      poly([[398, 952], [489, 952], [624, 1240], [328, 1240]], '#ddd4b0', null);
      // A bakery is the concrete beginning of the giant-world dream.
      box(234, 878, 257, 228, 9, '#e0c9a1', C.ink, 4);
      poly([[211, 883], [358, 770], [514, 883]], '#b87f60', C.ink, 4);
      box(319, 973, 94, 133, 43, '#7d7560', C.ink, 3);
      for (let i = 0; i < 3; i++) line([[337 + i * 24, 1005], [337 + i * 24, 1100]], '#a99a79', 3);
      box(253, 912, 218, 40, 8, '#f4e2b8', C.ink, 3); label('ПЕКАРНЯ', 362, 941, 25, C.ink, 800, 'center', 193);
      const steal = ease(seg(t, cue(s, 2) + .1, cue(s, 2) + 1.4));
      const chase = t > cue(s, 2) + .1 ? t : 0;
      villager(354 + steal * 55, 1188, .96, chase, true, steal);
      villager(712 + Math.sin(chase * 2) * 20 * steal, 1190, 1, chase, false, 0);
      bread(lerp(454, 657, steal), 1091 - Math.sin(steal * Math.PI) * 76, .62, Math.sin(t * 3) * .05);
      if (steal > .5) {
        tag('ГДЕ ХЛЕБ?!', 690, 861, 275, C.white, 28, -.025);
        poly([[620, 891], [641, 912], [659, 887]], C.white, C.ink, 3);
      }
      // Footsteps and flour, held inside the game window.
      if (steal > .1) for (let i = 0; i < 5; i++) {
        const p = (t * 1.8 + i * .19) % 1;
        g.save(); g.globalAlpha = (1 - p) * .3;
        oval(640 - p * 45 + i * 7, 1198 - p * 20, 10 + p * 13, 7 + p * 6, C.white);
        g.restore();
      }
      g.restore();
      if (t > cue(s, 3)) {
        tag('ЭПИЧЕСКИЙ ЛУТ', 328, 1326, 355, C.yellow, 29, -.015);
        bread(771, 1325, 1.32, -.09 + Math.sin(t * 2) * .025);
        sparkle(625, 1330, 15, '#af9852', .2); sparkle(914, 1291, 13, '#af9852', -.2);
      } else tag('СНАЧАЛА — НАКОРМИТЬ НПС', 540, 1334, 644, '#cbdabd', 27, -.018);
    }
    return {hellfarmer, inspector, meridian};
  };
})(typeof window === 'undefined' ? globalThis : window);
