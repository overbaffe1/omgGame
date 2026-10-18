// miniaudio.mjs — мини-офлайн WebAudio на чистом JS: ровно то, что использует buildScore фильма.
// Поддержка: OscillatorNode (sine/square/saw/triangle + частотные рампы), BufferSource (loop/voices),
// BiquadFilter (lowpass/highpass/bandpass, статичные параметры), GainNode с автоматизацией.
import fs from 'node:fs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class Param{
  constructor(v=1){this.value=v;this.ev=[];this._s=0}
  setValueAtTime(v,t){this.ev.push({t,v,k:'set'})}
  linearRampToValueAtTime(v,t){this.ev.push({t,v,k:'lin'})}
  exponentialRampToValueAtTime(v,t){this.ev.push({t,v,k:'exp'})}
  _sort(){if(!this._s){this.ev.sort((a,b)=>a.t-b.t);this._s=1}}
  valueAt(t){this._sort();const e=this.ev;let v=this.value,tp=-Infinity;
    for(const ev of e){
      if(ev.k==='set'){
        if(ev.t<=t){v=ev.v;tp=ev.t}else break;
      }else{
        if(t>=ev.t){v=ev.v;tp=ev.t}
        else if(t>tp){const k=(ev.t>tp)?(t-tp)/(ev.t-tp):1;
          if(ev.k==='lin')v=v+(ev.v-v)*k;
          else{const a=Math.abs(v)||1e-6,b2=Math.abs(ev.v)||1e-6;
            const sgn=(v<0||ev.v<0)?-1:1;v=sgn*a*Math.pow(b2/a,k)}
          break}
        else break}}
    return v}
}
class Node{
  constructor(ctx){this.ctx=ctx;this.out=[]}
  connect(n){this.out.push(n);return n}
}
export class GainN extends Node{constructor(ctx){super(ctx);this.gain=new Param(1)}}
export class BiquadN extends Node{
  constructor(ctx){super(ctx);this.type='lowpass';this.frequency={value:350};this.Q={value:1};this.detune={value:0}}
  coefs(){const sr=this.ctx.sampleRate,f=clamp(this.frequency.value,10,sr/2.2),q=Math.max(.1,this.Q.value);
    const w0=2*Math.PI*f/sr,c=Math.cos(w0),s=Math.sin(w0),alpha=s/(2*q);
    let b0,b1,b2;
    if(this.type==='lowpass'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2}
    else if(this.type==='highpass'){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2}
    else{b0=alpha;b1=0;b2=-alpha} // bandpass (peak 0 dB)
    const a0=1+alpha,a1=-2*c,a2=1-alpha;
    return[b0/a0,b1/a0,b2/a0,a1/a0,a2/a0]}
  reset(){this.x1=this.x2=this.y1=this.y2=0}
  process(x,c){const y=c[0]*x+c[1]*this.x1+c[2]*this.x2-c[3]*this.y1-c[4]*this.y2;
    this.x2=this.x1;this.x1=x;this.y2=this.y1;this.y1=y;return y}
}
export class OscN extends Node{
  constructor(ctx){super(ctx);this.type='sine';this.frequency=new Param(440);this.phase=0;this._t0=null;this._t1=null}
  start(t){this._t0=t}stop(t){this._t1=t}
  sample(t,dt){const f=this.frequency.valueAt(t);this.phase+=2*Math.PI*f*dt;const p=this.phase%(2*Math.PI);
    if(this.type==='sine')return Math.sin(p);
    if(this.type==='square')return p<Math.PI?1:-1;
    if(this.type==='sawtooth')return 2*(p/(2*Math.PI))-1;
    return 2*Math.abs(2*((p/(2*Math.PI))%1)-1)-1} // triangle
}
export class BufN extends Node{
  constructor(ctx){super(ctx);this.buffer=null;this.loop=false;this.loopStart=0;this.loopEnd=0;this.playbackRate=1;
    this._t0=null;this._t1=null}
  start(t){this._t0=t}stop(t){this._t1=t}
  sample(t){if(!this.buffer)return 0;const b=this.buffer,dur=b.duration;
    let pos=(t-this._t0)*this.playbackRate;
    if(this.loop&&this.loopEnd>this.loopStart&&pos>=this.loopStart)
      pos=this.loopStart+((pos-this.loopStart)%(this.loopEnd-this.loopStart));
    if(pos<0||pos>=dur)return 0;
    const i=Math.min(b.channels[0].length-1,Math.floor(pos*b.sampleRate));
    if(b.channels.length>=2)return (b.channels[0][i]+b.channels[1][i])*.5;
    return b.channels[0][i]}
}
export class FakeBuffer{
  constructor(ch,len,sr){this.channels=[];for(let i=0;i<ch;i++)this.channels.push(new Float32Array(len));
    this.sampleRate=sr;this.duration=len/sr}
  getChannelData(i){return this.channels[i]}
}
export class DestN extends Node{}
export class OfflineAC{
  constructor(ch,len,sr){this.sampleRate=sr;this.length=len;this.destination=new DestN(this);this.nodes=[]}
  createGain(){const n=new GainN(this);this.nodes.push(n);return n}
  createOscillator(){const n=new OscN(this);this.nodes.push(n);return n}
  createBufferSource(){const n=new BufN(this);this.nodes.push(n);return n}
  createBiquadFilter(){const n=new BiquadN(this);this.nodes.push(n);return n}
  createBuffer(ch,len){return new FakeBuffer(ch,len,this.sampleRate)}
  _chain(src){const chain=[];let n=src;while(!(n instanceof DestN)){chain.push(n);n=n.out[0]}return chain}
  render(){
    const sr=this.sampleRate,len=this.length;
    const mix=new Float32Array(len*2);
    const srcs=this.nodes.filter(n=>(n instanceof OscN||n instanceof BufN)&&n._t0!==null);
    for(const s of srcs){
      const t1=s._t1===null?len/sr:Math.min(len/sr,s._t1);
      const i0=Math.max(0,Math.floor(s._t0*sr)),i1=Math.min(len,Math.ceil(t1*sr));
      if(i1<=i0)continue;
      const chain=this._chain(s);
      const bq=[];const coefs=[];const gains=[];
      for(const n of chain){if(n instanceof BiquadN){n.reset();bq.push(n);coefs.push(n.coefs())}
        else if(n instanceof GainN)gains.push(n)}
      const dt=1/sr;
      for(let i=i0;i<i1;i++){
        const t=i*dt;
        let x=s.sample(t,dt);
        for(let b=0;b<bq.length;b++)x=bq[b].process(x,coefs[b]);
        for(const gn of gains)x*=gn.gain.valueAt(t);
        mix[i*2]+=x;mix[i*2+1]+=x}}
    return{sampleRate:sr,length:len,mix}
  }
}
export function writeWav(path,sr,mix){
  const len=mix.length/2,buf=Buffer.alloc(44+len*4);
  buf.write('RIFF',0);buf.writeUInt32LE(36+len*4,4);buf.write('WAVE',8);buf.write('fmt ',12);
  buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(sr,24);
  buf.writeUInt32LE(sr*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(len*4,40);
  for(let i=0;i<len;i++){
    let l=mix[i*2],r=mix[i*2+1];
    l=clamp(l,-1,1);r=clamp(r,-1,1);
    buf.writeInt16LE((l*32767)|0,44+i*4);buf.writeInt16LE((r*32767)|0,46+i*4)}
  fs.writeFileSync(path,buf);return buf.length}
