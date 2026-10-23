"""Monte les clips VM depuis des images, avec textes intégrés et musique originale.
Aucune génération de voix, aucune mise en ligne sur un réseau social.
"""
import argparse,json,subprocess,tempfile,shutil
from pathlib import Path
from PIL import ImageFont
from concurrent.futures import ThreadPoolExecutor

FPS=30
SECONDS=5

def run(args):
    result=subprocess.run(args,capture_output=True,text=True)
    if result.returncode:raise RuntimeError(result.stderr[-3000:])

def ass_escape(text):
    return str(text).replace('\\','').replace('{','').replace('}','').replace('\n','\\N')

def overlay(path,scene,campaign,width,height,index,font_dir):
    portrait=height>width
    color='&H00'+campaign['color'][4:6]+campaign['color'][2:4]+campaign['color'][:2]
    if portrait:
        brand=(90,105,54);title=(90,1295,92);sub=(90,1540,50);url=(90,1730,49);margin=90
    else:
        brand=(750,75,30);title=(750,195,54);sub=(750,405,30);url=(750,570,30);margin=50
    header=f'''[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Poppins,40,&H00FFFFFF,&H00FFFFFF,&H00100D08,&H00100D08,-1,0,0,0,100,100,0,0,1,0,0,7,{margin},{margin},0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    lines=[]
    def text(value,position,col='&H00FFFFFF',bold=True):
        x,y,size=position
        font=ImageFont.truetype(str(font_dir / ('Poppins-Bold.ttf' if bold else 'Poppins-Medium.ttf')),size)
        available=width-x-(90 if portrait else 45)
        wrapped=[]
        for paragraph in str(value).split('\n'):
            current=''
            for word in paragraph.split():
                candidate=(current+' '+word).strip()
                if current and font.getlength(candidate)>available:
                    wrapped.append(current);current=word
                else:current=candidate
            wrapped.append(current)
        value='\n'.join(wrapped)
        lines.append(f'Dialogue: 0,0:00:00.00,0:00:05.00,Main,,0,0,0,,{{\\an7\\pos({x},{y})\\fs{size}\\c{col}\\b{1 if bold else 0}}}{ass_escape(value)}')
    text(campaign['brand'],brand,color)
    text(scene['title'],title)
    text(scene['sub'],sub,'&H00E8DDD0',False)
    text(campaign['url'],url,color)
    if scene.get('concept'):
        text('VISUALISATION VIRTUELLE · PROJET',(90,190,38) if portrait else (750,130,21),'&H00E8DDD0',False)
    text(f'{index+1:02d} / 04',(90,1830,26) if portrait else (750,650,20),'&H00BBB2A1',False)
    path.write_text(header+'\n'.join(lines)+'\n',encoding='utf-8')

def main():
    p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--assets',required=True);p.add_argument('--music',required=True);p.add_argument('--output',required=True);p.add_argument('--vm-root',required=True);p.add_argument('--veloce-root',required=True);p.add_argument('--only')
    args=p.parse_args();rows=json.loads(Path(args.manifest).read_text());assets=Path(args.assets);dest=Path(args.output);dest.mkdir(parents=True,exist_ok=True)
    fonts=Path(args.veloce_root)/'studio/assets'
    def source(value):
        if value.startswith('vm:'):return Path(args.vm_root)/value[3:]
        if value.startswith('veloce:'):return Path(args.veloce_root)/value[7:]
        return assets/(value+'.webp' if value in ['office','studio'] else value+'.png')
    def make(job):
        campaign,kind=job
        w,h=(1080,1920) if kind=='vertical' else (1280,720)
        output=dest/(campaign['id']+'-'+kind+'.mp4')
        with tempfile.TemporaryDirectory(prefix='vm-promo-') as temp:
            temp=Path(temp);segments=[]
            for i,scene in enumerate(campaign['scenes']):
                image=source(scene['image'])
                if not image.is_file():raise FileNotFoundError(image)
                subtitles=temp/f'{i}.ass';overlay(subtitles,scene,campaign,w,h,i,fonts)
                if kind=='vertical':
                    fw,fh,fx,fy=960,1120,'(W-w)/2','240+(1120-h)/2'
                    layout=f'drawbox=x=0:y=1270:w={w}:h={h-1270}:color=0x080d1c@0.97:t=fill'
                else:
                    fw,fh,fx,fy=650,600,'36+(650-w)/2','60+(600-h)/2'
                    layout=f'drawbox=x=710:y=0:w={w-710}:h={h}:color=0x080d1c@0.97:t=fill'
                # L’image originale reste entière dans le panneau central.
                camera=''
                if scene['image'] in ['office','studio'] and i in [1,2]:
                    camera='crop=iw*0.86:ih*0.78:iw*0.07:ih*0.12,' if i==1 else 'crop=iw:ih*0.68:0:ih*0.28,'
                filters=(f'[0:v]{camera}split=2[b][f];[b]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},format=rgb24,boxblur=24:2,eq=brightness=-0.42:saturation=0.7[bg];'
                         f'[f]scale={fw}:{fh}:force_original_aspect_ratio=decrease[fg];'
                         f'[bg][fg]overlay=x={fx}:y={fy},format=yuv420p,'
                         f"zoompan=z='1+0.026*on/{FPS*SECONDS}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={FPS*SECONDS}:s={w}x{h}:fps={FPS},"
                         f'{layout},ass=filename={subtitles}:fontsdir={fonts},fade=t=in:st=0:d=0.12[out]')
                segment=temp/f'{i}.mp4'
                run(['ffmpeg','-v','error','-y','-filter_complex_threads','1','-loop','1','-framerate','1','-i',str(image),'-filter_complex',filters,'-map','[out]','-t',str(SECONDS),'-an','-r',str(FPS),'-c:v','libx264','-threads','2','-preset','veryfast','-crf','21','-maxrate','4500k','-bufsize','9000k','-pix_fmt','yuv420p','-g','60','-movflags','+faststart',str(segment)])
                segments.append(segment)
            listing=temp/'concat.txt';listing.write_text(''.join("file '"+str(s)+"'\n" for s in segments))
            run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-i',str(args.music),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-ar','48000','-af','loudnorm=I=-18:TP=-1.5:LRA=9','-t','20','-movflags','+faststart',str(output)])
            poster=dest/(campaign['id']+'-'+kind+'.jpg')
            run(['ffmpeg','-v','error','-y','-ss','0.8','-i',str(output),'-frames:v','1','-q:v','3',str(poster)])
        print(output.name,output.stat().st_size,flush=True)
        return output
    jobs=[(c,k) for c in rows if not args.only or c['id']==args.only for k in ['vertical','paysage']]
    with ThreadPoolExecutor(max_workers=2) as ex:list(ex.map(make,jobs))

if __name__=='__main__':main()
