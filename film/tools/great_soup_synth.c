#include <stdio.h>
#include <stdlib.h>
#define TSF_IMPLEMENTATION
#include "vendor/tsf.h"
typedef struct{int sample,type,ch,key;float vel;}Event;
int main(int n,char**v){if(n!=5)return 2;tsf*s=tsf_load_filename(v[1]);if(!s)return 3;tsf_set_output(s,TSF_STEREO_INTERLEAVED,44100,-7);tsf_set_max_voices(s,128);FILE*f=fopen(v[2],"r");Event*e=malloc(16000*sizeof(Event));int c=0;while(c<16000&&fscanf(f,"%d%d%d%d%f",&e[c].sample,&e[c].type,&e[c].ch,&e[c].key,&e[c].vel)==5)c++;fclose(f);f=fopen(v[3],"wb");int end=atof(v[4])*44100+.5,t=0,i=0;float b[2048];while(t<end){while(i<c&&e[i].sample<=t){Event q=e[i++];if(q.type==2)tsf_channel_set_presetnumber(s,q.ch,q.key,q.ch==9);else if(q.type)tsf_channel_note_on(s,q.ch,q.key,q.vel);else tsf_channel_note_off(s,q.ch,q.key);}int k=t+1024;if(k>end)k=end;if(i<c&&e[i].sample<k)k=e[i].sample;if(k<=t)continue;tsf_render_float(s,b,k-t,0);fwrite(b,sizeof(float),(k-t)*2,f);t=k;}fclose(f);free(e);tsf_close(s);return 0;}
