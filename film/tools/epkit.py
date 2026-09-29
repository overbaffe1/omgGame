# Общие утилиты для сборки серий «Анатомии страсти».
# Серия собирается из предыдущей: берём её HTML, заменяем сцены (S), extra(), anim(), звуки.
import re,json,subprocess,glob,os
HERE=os.path.dirname(os.path.abspath(__file__));FILM=os.path.dirname(HERE)
class Ep:
    def __init__(self,base):self.s=open(os.path.join(FILM,base)).read()
    def R(self,a,b):
        assert a in self.s,('НЕ НАЙДЕНО',a[:90]);self.s=self.s.replace(a,b,1)
    def between(self,start,end,new):
        i=self.s.index(start);j=self.s.index(end,i);self.s=self.s[:i]+new+self.s[j:]
    def save(self,name):open(os.path.join(FILM,name),'w').write(self.s);print('собрано',name)
def lines(html,prefix,out):
    """Вытащить реплики с озвучкой (id начинается с prefix) в JSON для synth_silero.py"""
    s=open(os.path.join(FILM,html)).read();L={}
    for who,txt,vo in re.findall(r"\['(\w+)','([^']*)','("+prefix+r"\w+)'",s):L[vo]=[who,re.sub(r'^\(за кадром\) ','',txt)]
    json.dump(L,open(out,'w'),ensure_ascii=False);print('реплик',len(L));return L
def durations(ffmpeg):
    """Пересчитать voices/durations.js по всем mp3"""
    d={};vd=os.path.join(FILM,'voices')
    for f in sorted(glob.glob(vd+'/*.mp3')):
        o=subprocess.run([ffmpeg,'-i',f],capture_output=True,text=True).stderr
        h,m,s=re.search(r'Duration: (\d+):(\d+):([\d.]+)',o).groups();d[os.path.basename(f)[:-4]]=round(int(h)*3600+int(m)*60+float(s),2)
    open(vd+'/durations.js','w').write('window.VOICE_DUR='+json.dumps(d)+';\n');print('длительностей',len(d))
def gallery(eid,file,title,emoji,bg,desc,tags,after):
    p=os.path.join(FILM,'index.html');s=open(p).read()
    if f"id:'{eid}'" in s:return
    i=s.index(f"  {{id:'{after}',");j=s.index('\n',i)
    s=s[:j+1]+f"  {{id:'{eid}',file:'{file}',title:'{title}',emoji:'{emoji}',bg:'{bg}',desc:'{desc}',tags:{json.dumps(tags,ensure_ascii=False)}}},\n"+s[j+1:]
    open(p,'w').write(s)
