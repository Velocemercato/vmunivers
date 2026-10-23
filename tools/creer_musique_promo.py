from pathlib import Path
import numpy as np,wave,argparse
parser=argparse.ArgumentParser()
parser.add_argument("--output", default="media/projets/musique-originale.wav")
args=parser.parse_args()
RATE=48000;duration=20.0;out=np.zeros((int(RATE*duration),2),np.float64)
# Composition originale : accords courts, basse et pulsation légère, sans sample externe.
rng=np.random.default_rng(70290);beat=60/116
progression=[(48,55,60,63),(44,51,56,60),(46,53,58,62),(43,50,55,58)]
def note(midi):return 440*2**((midi-69)/12)
def add(signal,start,pan=0):
 idx=int(start*RATE);n=min(len(signal),len(out)-idx)
 if n<=0:return
 out[idx:idx+n,0]+=signal[:n]*(.5-pan*.2)
 out[idx:idx+n,1]+=signal[:n]*(.5+pan*.2)
for step in range(int(duration/beat)+1):
 start=step*beat;t=np.arange(int(RATE*min(1.4,duration)))/RATE
 chord=progression[(step//8)%4]
 if step%2==0:
  midi=chord[(step//2)%4]+12;env=np.exp(-t*4)*(1-np.exp(-t*35))
  tone=(np.sin(2*np.pi*note(midi)*t)+.22*np.sin(2*np.pi*note(midi)*2*t))*.11*env
  add(tone,start,(-1 if step%4==0 else 1)*.4)
 if step%4==0:
  tb=np.arange(int(RATE*.65))/RATE;add(.15*np.sin(2*np.pi*note(chord[0]-12)*tb)*np.exp(-tb*7),start)
 # Pulsation sourde + charleston doux, pas de grosse batterie.
 tk=np.arange(int(RATE*.15))/RATE
 if step%2==0:add(.12*np.sin(2*np.pi*(45*tk+30*.018*(1-np.exp(-tk/.018))))*np.exp(-tk*32),start)
 noise=rng.normal(0,1,int(RATE*.045));noise=np.concatenate([[0],np.diff(noise)])
 add(noise*.012*np.exp(-np.arange(len(noise))/RATE*100),start+beat/2,.3)
# Entrée rapide et sortie souple.
env=np.ones(len(out));n=int(RATE*.2);env[:n]=np.linspace(0,1,n);n=int(RATE*1.3);env[-n:]=np.linspace(1,0,n)
out*=env[:,None];peak=np.max(np.abs(out));out*=.45/max(peak,.45)
p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(p),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((np.clip(out,-1,1)*32767).astype('<i2').tobytes())
print(p)
