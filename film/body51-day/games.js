/* Three games, three physical visual jokes. These are original illustrations,
 * not captured gameplay. Kept in the same bounded 2D stage as the rest of the film. */
(function (root) {
  'use strict';
  root.Body51DayGames = function (a) {
    const {g, C, box, oval, shape, line, poly, label, local, asset, tag, sparkle, shadow, floor, person, cat, focus, cue, beat, ease, seg, lerp, clamp} = a;
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
    function villager(x, y, s, t, baker = false, arm = 0, shocked = false, relieved = false) {
      asset(baker ? 'Пекарь' : 'Персонаж White Meridian', x, y, s, [-101, -238, 99, 15], () => {
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
          for (const d of [-1, 1]) { oval(d * 16, -153, 3, 5, C.ink); line([[d * 16 - 6, -168 + (baker && !relieved ? d * 3 : 0)], [d * 16 + 7, -168 - (baker && !relieved ? d * 3 : 0)]], C.ink, 3); }
          if (relieved) shape(p => { p.moveTo(-10,-137); p.quadraticCurveTo(1,-124,13,-137); },null,C.ink,3);
          else if (shocked && !baker) oval(2, -136, 7, 10, C.ink);
          else shape(p => { p.moveTo(-8, -136); p.quadraticCurveTo(0, baker ? -142 : -127, 12, -136); }, null, C.ink, 3);
          if (baker && shocked) {
            // The ultimate bread guardian's weapon is only a rolling pin.
            box(-81, -210, 15, 103, 7, '#bb8758', C.ink, 3);
            box(-95, -203, 42, 69, 15, '#d8ae75', C.ink, 3);
            line([[-82, -194], [-82, -145]], '#efd0a2', 3);
          }
        });
      });
    }

    function trousers(x,y,s,color='#6c85a0',hanger=false) {
      asset('Экипировка — штаны',x,y,s,[-54,-65,55,112],()=>{
        if(hanger){
          shape(p=>{p.moveTo(0,-47);p.quadraticCurveTo(0,-65,11,-57);p.quadraticCurveTo(20,-46,4,-42);},null,'#b6bdaa',4);
          poly([[-45,-18],[0,-43],[45,-18]],null,'#b6bdaa',4);
        }
        shape(p=>{p.moveTo(-39,-17);p.lineTo(39,-17);p.lineTo(49,99);p.lineTo(10,105);p.lineTo(-1,32);p.lineTo(-13,105);p.lineTo(-50,98);p.closePath();},color,C.ink,4);
        line([[-39,-7],[38,-7]],'#c5cbbb',4);
        line([[0,-6],[1,24],[-4,32]],C.ink,2.4);
        for(const d of [-1,1]){
          line([[d*29,14],[d*34,78]],'#d8dbc272',2.5);
          line([[d*13,93],[d*44,90]],'#d4d7c0',3);
        }
      });
    }
    function dungeonHero(x,y,t,swing=0,pantsColor='#aebba3') {
      local(x,y,1.07,()=>{
        const bob=Math.sin(t*5)*2;
        line([[-26,-59],[-41,0]],C.ink,28);line([[25,-59],[48,0]],C.ink,28);
        line([[-26,-59],[-41,0]],pantsColor,21);line([[25,-59],[48,0]],pantsColor,21);
        oval(-41,6,24,10,'#4b544a',C.ink,3);oval(49,6,24,10,'#4b544a',C.ink,3);
        box(-46,-150+bob,92,104,21,'#8caaa7',C.ink,5);
        poly([[-49,-64],[50,-64],[61,-41],[-63,-41]],'#b48f5f',C.ink,4);
        oval(0,-178+bob,43,40,'#d2c0a0',C.ink,4);
        shape(p=>{p.moveTo(-49,-169+bob);p.lineTo(-39,-213+bob);p.lineTo(13,-240+bob);p.lineTo(43,-205+bob);p.lineTo(48,-168+bob);p.quadraticCurveTo(0,-194+bob,-49,-169+bob);},'#829e9a',C.ink,5);
        line([[-24,-177+bob],[25,-177+bob]],'#263a3e',7);
        line([[-43,-126],[-69,-85]],'#b1bea6',23);
        local(40,-117,1,()=>{
          line([[0,0],[35,-22]],'#bac3a9',23);oval(37,-23,13,13,'#d6c49f',C.ink,3);
          poly([[38,-38],[44,-180],[60,-211],[74,-180],[68,-32]],'#dbe4cd',C.ink,4);
          line([[23,-36],[84,-29]],'#b99b61',10);
        },swing);
      });
    }
    function dungeonSkeleton(x,y,t,shop=false,sit=0) {
      local(x,y,1,()=>{
        if(sit>0){
          g.save();g.globalAlpha=ease(Math.min(1,sit*3));
          line([[-43,-34],[-50,6]],'#a37f58',8);line([[43,-34],[50,6]],'#a37f58',8);
          box(-59,-48,118,14,6,'#d9b879',C.ink,3);g.restore();
        }
        const tap=shop&&sit<.8?Math.max(0,Math.sin(t*8))*6:0;
        const hips=-63+23*sit;
        for(const d of [-1,1]){
          const knee=[d*(18+30*sit),-30+6*sit],foot=[d*30,1-(d>0?tap:0)];
          line([[d*14,hips],knee,foot],'#c6cbb1',10);
          oval(d*31,5-(d>0?tap:0),17,6,'#b8c2a8',C.ink,2);
        }
        local(0,hips+36,1,()=>{
          line([[0,-100],[0,-36]],'#c6cbb1',10);
          for(let k=0;k<3;k++)line([[-23,-88+k*15],[24,-88+k*15]],'#c6cbb1',7);
          local(0,-130,1,()=>{
            oval(0,0,35,34,'#d7d8bf',C.ink,4);
            for(const d of [-1,1])oval(d*12,-3,7,shop?6:9,C.ink);
            line([[-18,19],[18,19]],C.ink,3);
            if(shop)line([[-24,-17],[-7,-12]],C.ink,3);
          },sit*.11);
          line([[-20,-97],shop?[-66,-95]:[-47,-76]],'#c6cbb1',9);
          line([[20,-96],shop?[51,-68-sit*13]:[48,-108]],'#c6cbb1',9);
          if(shop){
            box(-23,-94,45,65,5,'#a7786c',C.ink,3);line([[-18,-92],[19,-92]],'#c4a38a',3);
            // The monster has become the bored attendant: checks its wrist,
            // then sits on a stool and waits while the player changes again.
            oval(43,-77-sit*8,8,8,C.yellow,C.ink,2);
            line([[43,-82-sit*8],[43,-77-sit*8],[48,-75-sit*8]],C.ink,1.5);
          }
        });
      });
    }
    function hellfarmer(s,t) {
      floor(1386);header('DESKTOP HELLFARMER','#c8b59a');
      box(128,580,824,723,25,'#273d44',C.ink,5);
      g.save();g.beginPath();g.roundRect(142,592,796,697,18);g.clip();
      // Diablo-like dungeon language: oblique stonework, fire, two orbs and loot.
      // This is a cartoon of the genre, not a claim of manual control per hit.
      for(let row=0;row<4;row++)for(let col=0;col<8;col++){
        const x=128+col*117+(row%2)*-52,y=594+row*71;
        box(x,y,109,63,5,row%2?'#35494b':'#3d5150',null);
      }
      box(742,667,139,222,62,'#6e5544','#977657',6);
      box(759,685,105,204,48,'#bc8743',null);
      for(let i=0;i<5;i++)oval(774+i*17,798+Math.sin(t*3+i)*31,9,42,'#efc56a58');
      const A=[145,982],B=[535,812],C0=[938,990],D=[549,1201];
      poly([A,B,C0,D],'#5c6352',null);
      for(let k=1;k<8;k++){
        const u=k/8;
        line([[lerp(A[0],B[0],u),lerp(A[1],B[1],u)],[lerp(D[0],C0[0],u),lerp(D[1],C0[1],u)]],'#7b7e65',2);
        line([[lerp(B[0],C0[0],u),lerp(B[1],C0[1],u)],[lerp(A[0],D[0],u),lerp(A[1],D[1],u)]],'#7b7e65',2);
      }
      const fight=beat(s,'fight',cue(s,2)),fittingAt=beat(s,'fitting',cue(s,3)+.15);
      const shop=ease(seg(t,fittingAt,fittingAt+.36));
      const sitAt=beat(s,'stool',fittingAt+1.85),sit=ease(seg(t,sitAt,sitAt+.42));
      const phase=t<fight?0:((t-fight)/.85)%1;
      const hit=shop>0?0:ease(seg(phase,.12,.30))*(1-ease(seg(phase,.52,.85)));
      const down=t>fight&&phase>.26&&phase<.65&&shop===0;
      shadow(479,1132,91,16);shadow(755,1132,65,13);
      dungeonHero(475+hit*20+(shop>.8?Math.sin(t*7)*3:0),1122-(shop>.8?Math.max(0,Math.sin(t*7))*4:0),t,shop>0?-.1:lerp(-.63,.75,hit),shop>0?(Math.floor(t*2)%2?'#7b997f':'#698aab'):'#b7c1a4');
      if(!down)dungeonSkeleton(756-hit*17,1120,t,shop>.8,sit);
      if(down){
        const p=seg(phase,.26,.65);
        for(let k=0;k<7;k++)sparkle(725+Math.cos(k*TAU/7)*(16+p*63),982+Math.sin(k*TAU/7)*p*53,7*(1-p)+3,C.yellow,k);
        for(let k=0;k<4;k++)coin(699+k*18,1084-Math.sin(p*Math.PI)*112,9,t*11+k);
      }
      if(shop>0){
        // The epic adventure becomes a literal fitting room, without a second
        // speech explaining the joke. The waiting monster is now the attendant.
        g.save();g.globalAlpha=shop;
        for(const x of [358,631])line([[x,692],[x,1155]],'#a7aa90',9);
        line([[342,695],[647,695]],'#d4be87',12);
        box(374,635,245,46,8,'#d1b684',C.ink,3);
        label('ПРИМЕРОЧНАЯ',496,667,24,C.ink,800,'center',224);
        g.save();g.beginPath();g.rect(363,706,263*shop,388);g.clip();
        box(363,706,263,388,0,'#965e5a','#432f34',3);
        for(let k=0;k<8;k++){
          const x=367+k*37+Math.sin(t*2+k)*3;
          shape(p=>{p.moveTo(x,713);p.bezierCurveTo(x-13,845,x+13,942,x,1083);},null,k%2?'#b78373':'#764746',12);
        }
        g.restore();
        for(let k=0;k<2;k++){
          const xx=k?840:243,selected=Math.floor(t*1.5)%2===k;
          box(xx-62,740,124,188,14,'#e5ddbf',selected?C.yellow:'#728378',selected?6:3);
          trousers(xx,798,.74,k?'#85957b':'#718eac');
          if(selected)poly([[xx+34,947],[xx+36,914],[xx+60,937],[xx+47,937],[xx+53,949],[xx+45,953],[xx+39,941]],C.white,C.ink,2);
        }
        g.restore();
        if(t>beat(s,'anotherPair',cue(s,3)+1.25))trousers(690,1033+23*sit,.73,'#c39496',true);
      }
      // Genre cues, not the old AUTO button or a fake webcam/viewer counter.
      box(166,1198,748,83,15,'#203139','#667667',3);
      for(const [x,col] of [[222,'#b64e46'],[858,'#587aaf']]){
        oval(x,1241,42,42,'#c0a373',C.ink,4);oval(x,1241,34,34,col,C.ink,2);
        oval(x-10,1228,13,16,'#fff4ce42');
      }
      for(let k=0;k<5;k++){
        box(320+k*78,1213,55,49,7,'#3d524d','#96a28b',2);
        if(k%2)poly([[337+k*78,1220],[354+k*78,1220],[346+k*78,1238],[357+k*78,1238],[335+k*78,1256],[340+k*78,1242],[330+k*78,1242]],C.yellow,null);
        else{box(339+k*78,1226,17,26,5,k?'#6786b0':'#b36c58',null);box(342+k*78,1220,11,9,2,'#d0bb82',null);}
      }
      g.restore();
      // The waiting pose carries the punchline; no second explanatory banner.
      focus('Примерочная',170,605,725,590);
    }

    function backpack(x, y, s, t, bulge = 0) {
      asset('Рюкзак', x, y, s, [-183, -403, 183, 22], () => {
        g.scale(1 + bulge * .11, 1 + bulge * .065);
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
        const cool = ease(seg(t, beat(s, 'cool', cue(s, 2)), beat(s, 'cool', cue(s, 2)) + .24));
        if (cool > 0) {
          local(0, -70*(1-cool), 1, () => {
            box(-97, 4, 81, 39, 8, C.ink, C.ink, 3); box(16, 4, 81, 39, 8, C.ink, C.ink, 3);
            line([[-16, 15], [16, 15]], C.ink, 7);
            line([[-81, 12], [-48, 32]], '#9caaa3', 3); line([[30, 12], [63, 32]], '#9caaa3', 3);
          });
          shape(p => { p.moveTo(-30, 76); p.quadraticCurveTo(0, 105, 33, 75); }, null, C.ink, 5);
        } else label(t < cue(s, 1) + .3 ? 'ПЕРЕНЕСТИ?' : 'ОЙ.', 0, 80, t < cue(s, 1) + .3 ? 27 : 57, C.ink, 800, 'center', 257);
      }, Math.sin(t * 3) * .015 * shower);
      // Arcing cards land inside the open bag, instead of spilling off-screen.
      backpack(756, 1202, 1.01, t, shower * (1 + .06 * Math.sin(t*7)));
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
      const boss = ease(seg(t, beat(s, 'boss', cue(s, 3) + .45), beat(s, 'boss', cue(s, 3) + .45) + .42));
      if (boss > 0) {
        g.save(); g.globalAlpha = boss * .1; box(142, 591, 796, 639, 0, '#90584b', null); g.restore();
      }
      const give = ease(seg(t,beat(s,'boss',cue(s,3)+.45)+.62,beat(s,'boss',cue(s,3)+.45)+1.47));
      villager(354 + steal * 55 - boss * 10, 1188, .96 + boss * 1.08, chase, true, steal*(1-give*.8), boss > .1, give > .85);
      villager(712 + Math.sin(chase * 2) * 20 * steal + boss * 28, 1190, 1 - boss*.09, chase, false, 0, boss > .1, give > .85);
      bread(lerp(lerp(454,657,steal),552,give),lerp(1091-Math.sin(steal*Math.PI)*76,982,give)-Math.sin(give*Math.PI)*27,.62,Math.sin(t*3)*.05);
      if (steal > .5 && boss < .2) {
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
      if (boss > 0) {
        g.save(); g.globalAlpha = boss;
        box(163, 604, 754, 109, 13, '#293b3c', '#172f34', 4);
        label(give > .85 ? 'БАТОН ВОЗВРАЩЁН. МИР.' : 'ПЕКАРЬ · ХРАНИТЕЛЬ БАТОНА', 540, 645, 27, C.white, 800, 'center', 711);
        box(183, 669, 714, 22, 8, '#795851', null);
        box(187, 673, 686, 14, 5, give > .85 ? '#86ba91' : C.coral, null);
        g.restore();
      }
      g.restore();
      if (boss > .4) {
        tag(give > .85 ? 'ДИПЛОМАТИЯ' : 'АГРО +100', 328, 1326, 355, C.yellow, 29, -.015);
        bread(771, 1325, 1.32, -.09 + Math.sin(t * 2) * .025);
        sparkle(625, 1330, 15, '#af9852', .2); sparkle(914, 1291, 13, '#af9852', -.2);
      } else tag('СНАЧАЛА — НАКОРМИТЬ НПС', 540, 1334, 644, '#cbdabd', 27, -.018);
    }
    return {hellfarmer, inspector, meridian};
  };
})(typeof window === 'undefined' ? globalThis : window);
