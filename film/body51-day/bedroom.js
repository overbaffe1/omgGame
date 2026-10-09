/* Bed choreography shared by the opening and the closing callback.
 * Feet, hips, hands, cloth and pillow have continuous, seekable world positions.
 * A horizontal sleeping pose is not a masked standing character. */
(function (root) {
  'use strict';
  root.Body51Bedroom = function (a) {
    const {g, C, box, oval, shape, line, poly, label, local, asset, floor, shadow, windowView, plant, upperBody, person, cat, catLeap, catLoaf, cue, beat, ease, seg, lerp, clamp} = a;
    const mixPoint = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    const FOOT_Y = 1380, UNIT = .94;
    function joint(from, to, l1, l2, bend = 1) {
      const dx=to[0]-from[0],dy=to[1]-from[1], raw=Math.hypot(dx,dy);
      const d=clamp(raw,Math.abs(l1-l2)+.001,l1+l2-.001),ux=dx/(raw||1),uy=dy/(raw||1);
      const along=(l1*l1-l2*l2+d*d)/(2*d), side=Math.sqrt(Math.max(0,l1*l1-along*along))*bend;
      return [from[0]+ux*along+uy*side,from[1]+uy*along-ux*side];
    }
    function poseAt(s,t) {
      const getUp=beat(s,'wake',cue(s,1)-.3), pullAt=beat(s,'blanket',cue(s,1)+.2);
      const claimAt=beat(s,'claim',cue(s,2)+.6), feetAt=beat(s,'feet',cue(s,2)+1.05);
      const rise=ease(seg(t,getUp,getUp+1.15));
      const uncover=ease(seg(t,pullAt,claimAt+.18));
      const sitLegs=ease(seg(t,getUp+.45,claimAt+.16));
      const stand=ease(seg(t,feetAt-.1,feetAt+.94));
      const hip=mixPoint(mixPoint([628,1068],[666,1137],rise),[747,1103],stand);
      const angle=lerp(-Math.PI/2,0,rise),co=Math.cos(angle),sn=Math.sin(angle);
      const world=(x,y)=>[hip[0]+UNIT*(x*co-y*sn),hip[1]+UNIT*(x*sn+y*co)];
      const feet=[-1,1].map((d,i)=>{
        const sleeping=[865-i*20,1068+d*24];
        const seated=[i?793:710,i?1309:1301];
        const down=ease(seg(t,feetAt+(i*.14)-.2,feetAt+(i*.14)+.25));
        return mixPoint(mixPoint(sleeping,seated,sitLegs),[i?791:710,FOOT_Y],down);
      });
      const clothLeft=lerp(493,821,uncover),clothTop=lerp(966,1084,uncover);
      const grip=[clothLeft+13,clothTop+20];
      const release=ease(seg(t,claimAt+.06,claimAt+.55));
      const rightHand=mixPoint(grip,world(116,8),release);
      const leftHand=mixPoint(world(-95,-19),[hip[0]-100,hip[1]+18],rise);
      const flight=seg(t,claimAt,claimAt+.74),claim=ease(flight);
      return {phase:stand>.995?'standing':uncover>.85?'leaving-bed':rise>.4?'sitting':'lying',rise,uncover,stand,angle,hip,feet,world,rightHand,leftHand,grip,release,clothLeft,clothTop,claim,flight,claimAt,sleepy:t<getUp+.1,yawn:t>getUp+.15&&t<getUp+.66};
    }
    function slipper(x,y,front=false) {
      if (!front) {
        shadow(x+3,y+9,51,9);
        oval(x+7,y-3,44,17,'#1c6f68',C.ink,4);
        oval(x-9,y-6,21,10,'#1d4945');
        line([[x-31,y+9],[x+45,y+9]],'#c9d8bc',3);
      } else {
        shape(p=>{p.moveTo(x+1,y-17);p.quadraticCurveTo(x+49,y-20,x+50,y+5);p.quadraticCurveTo(x+30,y+13,x-1,y+7);p.closePath();},C.teal,C.ink,3);
        line([[x+11,y-10],[x+24,y-12],[x+35,y-8]],'#78afa0',2.5);
      }
    }
    function sock(x,y,angle=0) {
      local(x,y,1,()=>{
        box(-18,-30,35,29,8,C.white,C.ink,3);
        line([[-15,-20],[15,-20]],'#a3baad',3);
        shape(p=>{p.moveTo(-18,-8);p.quadraticCurveTo(-6,-17,14,-7);p.quadraticCurveTo(45,-6,47,8);p.quadraticCurveTo(18,19,-19,10);p.closePath();},C.white,C.ink,3);
      },angle);
    }
    function limbs(p,t,frontHands=false) {
      if(frontHands) {
        for(const h of [...(p.rise > .58 ? [p.leftHand] : []),p.rightHand]) {
          oval(h[0],h[1],18,21,C.skin,C.ink,3.5);
          for(let j=0;j<3;j++)line([[h[0]-9+j*7,h[1]-7],[h[0]-8+j*7,h[1]+3]],'#bd8b6f',1.8);
        }
        return;
      }
      for (const [i,d] of [-1,1].entries()) {
        const hip=p.world(d*33,0), foot=p.feet[i];
        const knee=joint(hip,foot,139,139,1);
        shape(q=>{q.moveTo(...hip);q.lineTo(...knee);q.lineTo(foot[0],foot[1]-14);},null,C.ink,49);
        shape(q=>{q.moveTo(...hip);q.lineTo(...knee);q.lineTo(foot[0],foot[1]-14);},null,C.navy,41);
        line([[knee[0]+6,knee[1]+8],[foot[0]+6,foot[1]-36]],'#536a76',3);
        sock(foot[0],foot[1],lerp(-Math.PI/2,0,p.rise));
      }
      for(const [d,hand] of [[-1,p.leftHand],[1,p.rightHand]]) {
        const shoulder=p.world(d*80,-132),elbow=joint(shoulder,hand,83,86,d===1?1:-1);
        shape(q=>{q.moveTo(...shoulder);q.lineTo(...elbow);q.lineTo(...hand);},null,C.ink,39);
        shape(q=>{q.moveTo(...shoulder);q.lineTo(...elbow);q.lineTo(...hand);},null,C.skin,31);
        const sleeve=mixPoint(shoulder,elbow,.6);
        line([shoulder,sleeve],C.ink,46);line([shoulder,sleeve],'#343d3b',37);
      }
    }
    function body(p,t) {
      // A conservative dynamic AABB includes the real rotated upper body,
      // articulated legs and arms; it is also used by all-frame release QA.
      const pts=[p.world(-115,-370),p.world(115,-370),p.world(-115,25),p.world(115,25),...p.feet,p.leftHand,p.rightHand];
      const left=Math.min(...pts.map(v=>v[0]))-49,right=Math.max(...pts.map(v=>v[0]))+55;
      const top=Math.min(...pts.map(v=>v[1]))-18,bottom=Math.max(...pts.map(v=>v[1]))+25;
      asset('Артём — поза в кровати',(left+right)/2,(top+bottom)/2,1,[-(right-left)/2,-(bottom-top)/2,(right-left)/2,(bottom-top)/2],()=>{});
      limbs(p,t);
      local(p.hip[0],p.hip[1],UNIT,()=>{
        g.rotate(p.angle);g.translate(0,165);
        upperBody(t,{sleepy:p.sleepy,yawn:p.yawn,puzzled:p.stand>.7,pose:'stand'});
      });
    }
    function clothPath(p,z) {
      const l=z.clothLeft,r=946,top=z.clothTop,u=z.uncover,w=r-l;
      p.moveTo(l,top+20);
      p.bezierCurveTo(l+w*.15,top-30*(1-u),l+w*.43,top-24*(1-u),l+w*.66,top+19);
      p.quadraticCurveTo(r-20,top-6,r,top+52);
      p.lineTo(r,1288);
      p.quadraticCurveTo(l+w*.62,1310-14*u,l,1279);
      p.closePath();
    }
    function blanket(p,t) {
      shape(q=>clothPath(q,p),'#96b9a3',C.ink,5);
      g.save();g.beginPath();clothPath(g,p);g.clip();
      // Stitched stripes and shadows follow the moving fabric, not a static
      // world-space texture: no stripe remains behind when the blanket folds.
      const w=946-p.clothLeft;
      for(let i=0;i<9;i++) {
        const x=p.clothLeft+w*(i+.3)/9;
        shape(q=>{q.moveTo(x,p.clothTop-12);q.bezierCurveTo(x-9,p.clothTop+74,x+14,1202,x+7,1314);},null,'#c2d2b1',4);
      }
      shape(q=>{q.moveTo(p.clothLeft,p.clothTop+44);q.quadraticCurveTo(p.clothLeft+w*.55,p.clothTop+18,948,p.clothTop+72);},null,'#759c8c',13);
      if(p.uncover>.35) {
        for(let i=0;i<3;i++)shape(q=>{q.moveTo(p.clothLeft+8,1139+i*44);q.quadraticCurveTo(p.clothLeft+w*.5,1113+i*43,947,1159+i*36);},null,i%2?'#bdd0b1':'#719888',7);
      }
      g.restore();
      const w2=946-p.clothLeft;
      shape(q=>{q.moveTo(p.clothLeft,p.clothTop+21);q.quadraticCurveTo(p.clothLeft+w2*.52,p.clothTop-18,946,p.clothTop+52);q.lineTo(941,p.clothTop+76);q.quadraticCurveTo(p.clothLeft+w2*.5,p.clothTop+19,p.clothLeft+5,p.clothTop+46);q.closePath();},'#c1d4b7',C.ink,3);
    }
    function room(t,night=false) {
      floor(1398,night);
      windowView(135,445,263,437,t,night);
      // A bounded wash of light, wood, bed seams and ordinary bedside objects.
      const light=g.createLinearGradient(225,480,760,1360);
      light.addColorStop(0,night?'#e9c77a08':'#efd98b23');light.addColorStop(1,'#efd98b00');
      poly([[178,545],[358,552],[983,1386],[385,1386]],light,null);
      for(let i=0;i<3;i++)line([[112+i*40,1431+i*9],[944-i*30,1431+i*9]],night?'#3e5863':'#cdd0bc',1.8);
      // Wall picture has no channel name or editorial labels.
      box(674,504,196,153,12,night?'#3b525d':'#ddd5bd',C.ink,4);
      box(686,516,172,129,7,night?'#718c89':'#bfd2c1',null);
      oval(810,549,20,20,'#e6c985');poly([[694,623],[746,562],[782,610],[820,578],[849,632]],'#789789',null);
      // Bed frame and mattress. Front rail is behind the dangling legs.
      shadow(534,1386,416,27);
      box(119,908,45,397,14,'#b48b67',C.ink,5);
      box(910,1086,43,230,14,'#b48b67',C.ink,5);
      box(141,1201,795,83,16,'#bb936e',C.ink,5);
      line([[171,1284],[165,1394]],C.ink,14);line([[905,1284],[913,1394]],C.ink,14);
      box(141,1154,793,93,30,night?'#d5d9c9':C.white,C.ink,5);
      line([[170,1180],[908,1180]],'#cdd4c0',3);
      for(let i=0;i<17;i++)oval(177+i*42,1223,2,2,'#b9c7b6');
      // Cushion is under the head, never behind a vertical standing sprite.
      box(158,1054,282,107,37,night?'#e1dfcc':C.white,C.ink,4);
      shape(q=>{q.moveTo(177,1079);q.quadraticCurveTo(282,1060,419,1078);},null,'#d8dcc8',2.4);
      // Bedside table sits beyond the pillow; the alarm visibly stops ringing.
      box(77,1066,88,19,5,'#c39b75',C.ink,4);line([[89,1085],[86,1394]],C.ink,7);line([[150,1085],[155,1394]],C.ink,7);shadow(121,1398,54,7);
      local(122,1019,.66,()=>{
        const ring=!night&&t<1.3?Math.sin(t*34)*.045*Math.min(1,(1.3-t)/.4):0;
        g.rotate(ring);oval(0,0,57,55,C.yellow,C.ink,5);oval(0,0,43,43,C.white,C.ink,3);
        line([[0,-28],[0,0],[24,night?0:9]],C.ink,4);
        oval(-37,-47,19,11,C.coral,C.ink,4,-.5);oval(37,-47,19,11,C.coral,C.ink,4,.5);
        line([[-29,45],[-35,59]],C.ink,5);line([[29,45],[35,59]],C.ink,5);
      });
      plant(977,1395,.43);
    }
    function wake(s,t) {
      const p=poseAt(s,t);room(t);
      slipper(710,FOOT_Y);slipper(791,FOOT_Y);
      body(p,t);
      blanket(p,t);
      limbs(p,t,true);
      // The slippers have visible empty interiors before his socked feet arrive.
      slipper(710,FOOT_Y,true);slipper(791,FOOT_Y,true);
      const jump=p.claim;
      let catFoot=[306,1080],contactY=null;
      if(jump<1) {
        const surface=z=>{
          const q=clamp((845-z.clothLeft)/(946-z.clothLeft));
          const u=(1.04-Math.sqrt(1.0816-.16*q))/.08;
          return z.clothTop+21*(1-u)**2-36*(1-u)*u+52*u*u+2;
        };
        const fromY=surface(jump===0?p:poseAt(s,p.claimAt));
        const advance=ease(seg(p.flight,.14,1));
        const x=lerp(845,306,advance),y=lerp(fromY,1080,advance)-Math.sin(p.flight*Math.PI)*430;
        catFoot=[x,y];if(jump===0)contactY=fromY;
        if(p.flight>0) catLeap(x,y,.66,t,p.flight);
        else cat(x,y,.66,t,{boss:true});
      } else {
        // Knead first, then curl up exactly where the human head used to be.
        catLoaf(306,1080,.78,t,t>p.claimAt+1.55);
        if(t>p.claimAt+1.15) {
          const happy=seg(t,p.claimAt+1.15,p.claimAt+2.1);
          g.save();g.globalAlpha=(1-happy)*.7;
          for(let i=0;i<3;i++)oval(341+i*16,944-happy*28+i*3,4,4,'#b18a53');
          g.restore();
        }
      }
      return {bedPose:{phase:p.phase,angle:p.angle,blanketLeft:p.clothLeft,blanketTop:p.clothTop,feet:p.feet,hip:p.hip,rightHand:p.rightHand,grip:p.grip,release:p.release,stand:p.stand,claim:p.claim,catFoot,catSurfaceY:contactY,head:p.world(0,-255),floor:FOOT_Y}};
    }
    function finaleBed(s,t) {
      room(t,true);
      const folded={clothLeft:821,clothTop:1084,uncover:1};blanket(folded,t);
      catLoaf(306,1080,.87,t,true);
      person(782,1392,1.02,t,{pose:'point',puzzled:true,flip:true});
      // A quiet gesture toward the occupied pillow, not a second standing sleeper.
      return {bedPose:{phase:'occupied',claim:1}};
    }
    return {wake,finaleBed,poseAt};
  };
})(typeof window === 'undefined' ? globalThis : window);
