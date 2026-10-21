import re
s=open('/home/claude/velocemercato.fr/vm/index.html',encoding='utf-8').read()
B='https://velocemercato.fr/'
s=re.sub(r"""(href|src)="/(?!/)""",lambda m:f'{m.group(1)}="{B}',s)
s=s.replace("url('/",f"url('{B}").replace('https://velocemercato.fr/vm/"','https://vmunivers.fr/"')
s=re.sub(r'<link rel="manifest"[^>]*>','<link rel="manifest" href="/manifest.webmanifest">',s)
s=re.sub(r'<link rel="apple-touch-icon"[^>]*>','<link rel="apple-touch-icon" href="/app/univers-apple.png">',s)
s=re.sub(r"navigator\.serviceWorker\.register\([^)]*\)","navigator.serviceWorker.register('/sw.js')",s)
s=s.replace("📲 Installer l'app","📲 Installer VM Univers")
s=s.replace("[,'foot'])[1]","[,'univers'])[1]")
open('/home/claude/vmunivers/index.html','w',encoding='utf-8').write(s)
