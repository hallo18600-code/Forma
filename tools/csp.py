# Setzt die Content-Security-Policy (Schutz gegen eingeschleusten Code) in die HTML-Dateien.
# Nach JEDER Änderung an einem <script>…</script> direkt im HTML neu laufen lassen:
#   python3 tools/csp.py index.html impressum.html datenschutz.html
import re,hashlib,base64,sys
for fn in sys.argv[1:]:
    s=open(fn,encoding="utf-8").read()
    s=re.sub(r'\n\s*<meta http-equiv="Content-Security-Policy"[^>]*>','',s)
    hs=["'sha256-"+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode()+"'" for m in re.findall(r'<script>(.*?)</script>',s,re.S)]
    csp=("default-src 'self'; script-src 'self' "+" ".join(hs)+" https://cdn.jsdelivr.net; "
         "connect-src 'self' https://world.openfoodfacts.org https://cdn.jsdelivr.net; "
         "img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; "
         "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'")
    s=s.replace('<meta charset="UTF-8" />','<meta charset="UTF-8" />\n  <meta http-equiv="Content-Security-Policy" content="'+csp+'">',1) if '<meta charset="UTF-8" />' in s else re.sub(r'(<meta charset="?utf-8"?\s*/?>)',lambda m:m.group(1)+'\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">',s,count=1,flags=re.I)
    open(fn,"w",encoding="utf-8").write(s); print(fn,len(hs),"Content-Security-Policy" in s)
