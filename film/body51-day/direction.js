/* Explicit shot design. Close-ups crop context/legs intentionally, never faces,
 * the cat or the hands that carry the gag. All positions are world coordinates. */
(function(root){
  'use strict';
  const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const shot=(name,x,y,zoom,outY=950,extra={})=>({name,x,y,zoom,outX:540,outY,portrait:false,required:[],crop:[],...extra});
  root.Body51Direction={
    plan(s,t){
      const e=s.events||{};
      if(s.id==='wake'){
        if(t>=e.catch-.10){
          const push=ease((t-e.catch)/1.6);
          return shot('wake-reaction',755,960,2.95+push*.09,825,{portrait:true,required:['Лицо Артёма','Мордочка Гуччи','Ладонь'],crop:['Артём — поза в кровати']});
        }
        if(t>=e.uncover+.05&&t<e.swat+.16)return shot('wake-swat',768,1050,1.60,950,{required:['Лицо Артёма','Мордочка Гуччи','Ладонь']});
        if(t>=e.wake-.1&&t<e.uncover+.05)return shot('wake-rise',610,1040,1.18,940,{required:['Лицо Артёма','Мордочка Гуччи','Ладонь']});
        return shot('wake-room',540,960,1,960);
      }
      if(s.id==='finale'&&t>=e.catPerch+.07)return shot('finale-load',547,940,1.18,880,{required:['Лицо Артёма','Мордочка Гуччи']});
      const masters={
        service:[540,1000,1.035,980],stream:[540,970,1.05,960],break:[530,1010,1.035,975],
        sword:[540,1020,1.07,970],hellfarmer:[540,940,1.12,925],inspector:[540,960,1.02,920],
        meridian:[540,940,1.10,925],night:[540,995,1.04,945],finale:[540,960,1,960]
      };
      return shot(s.id+'-master',...(masters[s.id]||[540,960,1,960]));
    }
  };
})(typeof window==='undefined'?globalThis:window);
