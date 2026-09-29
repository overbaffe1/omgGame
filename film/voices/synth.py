import json,subprocess,os
import rhvoice_wrapper_bin as b, rhvoice_wrapper_data as d
from rhvoice_wrapper import TTS
F='/tmp/r/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';OUT='/home/user/omgGame/film/voices/'
# герой: (голос RHVoice, сдвиг высоты в полутонах, темп)
PROF={'mer':('elena',0,1.0),'cri':('irina',1,1.1),'izz':('anna',1.5,1.0),'bai':('irina',-2,.97),'kat':('anna',3.5,1.1),'ell':('elena',-2.5,.88),
      'der':('aleksandr',-1,.98),'web':('aleksandr',-4,.9),'bur':('aleksandr',-2.5,1.05),'geo':('aleksandr',2,1.08),'alx':('aleksandr',.5,1.12),'pat':('aleksandr',3,.95)}
L=json.load(open('/tmp/lines.json'))
tts=TTS(threads=1,lib_path=b.lib_path,data_path=d.data_path,force_process=False)
for vo,(who,txt) in L.items():tts.to_file(f'/tmp/rvout/{vo}.wav',txt,voice=PROF[who][0],format_='wav')
tts.join()
for vo,(who,txt) in L.items():
    v,st,tp=PROF[who];wav=f'/tmp/rvout/{vo}.wav'
    k=2**(st/12)
    af=f'asetrate={round(24000*k)},aresample=44100,atempo={tp/k:.4f},silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_len=5000,loudnorm=I=-16:TP=-1.5'
    subprocess.run([F,'-v','error','-y','-i',wav,'-af',af,'-ar','44100','-ac','1','-b:a','112k',OUT+vo+'.mp3'],check=True)
print('done',len(L))
