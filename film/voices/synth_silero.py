# Озвучка «Анатомии страсти»: Silero TTS v3.1 (ru), модель — github.com/AlexArutiunian/tts_silero (model.pt).
# Запуск: python synth_silero.py lines.json   (нужен torch). Голоса героев одинаковые во всех сериях.
import torch,numpy as np,json,subprocess,sys,wave,os
MODEL=os.environ.get('SILERO','/tmp/sil/model.pt');HERE=os.path.dirname(os.path.abspath(__file__))
F=os.environ.get('FFMPEG','/tmp/r/node_modules/@ffmpeg-installer/linux-x64/ffmpeg')
# герой: (диктор | файл голоса, pitch, rate)
CAST={'mer':('xenia','medium','medium'),'kat':('kseniya','high','fast'),'izz':('baya','medium','medium'),
 'cri':('silero/cri.pt','medium','fast'),'bai':('silero/bai.pt','low','medium'),'ell':('silero/ell.pt','low','slow'),
 'der':('aidar','medium','medium'),'web':('eugene','low','slow'),'bur':('eugene','medium','fast'),
 'geo':('aidar','high','fast'),'alx':('aidar','low','fast'),'pat':('eugene','high','medium'),
 'ali':('baya','high','slow'),'lu':('kseniya','low','slow'),'rap':('eugene','x-low','medium'),
 'vip':('aidar','x-high','fast'),'mac':('eugene','x-low','slow'),'she':('xenia','low','slow'),'vf1':('aidar','medium','fast')}
imp=torch.package.PackageImporter(MODEL);model=imp.load_pickle('tts_models','model')
L=json.load(open(sys.argv[1]));out=sys.argv[2] if len(sys.argv)>2 else HERE
for vo,(who,txt) in L.items():
    sp,pitch,rate=CAST[who];kw={}
    if sp.endswith('.pt'):kw=dict(speaker='random',voice_path=os.path.join(HERE,sp))
    else:kw=dict(speaker=sp)
    ssml=f'<speak><prosody pitch="{pitch}" rate="{rate}">{txt}</prosody></speak>'
    a=model.apply_tts(ssml_text=ssml,sample_rate=48000,**kw)
    x=(a.numpy()*32767).clip(-32768,32767).astype(np.int16);wav=f'/tmp/{vo}.wav'
    with wave.open(wav,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes(x.tobytes())
    subprocess.run([F,'-v','error','-y','-i',wav,'-af','apad=pad_len=6000,loudnorm=I=-16:TP=-1.5','-ar','44100','-ac','1','-b:a','128k',os.path.join(out,vo+'.mp3')],check=True)
    print(vo,round(len(x)/48000,2),flush=True)
