import json, glob, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageFilter, ImageChops
ids=[f["id"] for f in json.load(open("figs.json"))]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":940,"height":1060}, device_scale_factor=1.5)
    for i in ids:
        pg.set_content(f'<html><body style="margin:0;background:transparent">{open("svg/"+i+".svg").read()}</body></html>')
        pg.screenshot(path=f"png/{i}_raw.png", omit_background=True)
    b.close()
for i in ids:
    im=Image.open(f"png/{i}_raw.png").convert("RGBA")
    a=im.split()[3]
    # weißer Sticker-Rand wie bei den bisherigen Zeichnungen
    ring=a.filter(ImageFilter.MaxFilter(27)).filter(ImageFilter.GaussianBlur(1.2))
    bg=Image.new("RGBA",im.size,(255,255,255,0)); bg.putalpha(ring)
    out=Image.alpha_composite(bg,im)
    bb=out.getbbox(); out=out.crop((max(0,bb[0]-6),max(0,bb[1]-6),min(out.width,bb[2]+6),min(out.height,bb[3]+6)))
    s=1600/out.height; full=out.resize((round(out.width*s),1600),Image.LANCZOS)
    full.save(f"png/{i}.webp",quality=90,method=6)
    t=out.copy(); t.thumbnail((240,240)); t.save(f"png/{i}_t.webp",quality=85)
# Übersicht auf grünem Grund
ims=[Image.open(f"png/{i}.webp") for i in ids]; W,H=330,360
sheet=Image.new("RGB",(W*6,H*2),(46,110,70))
for k,im in enumerate(ims):
    t=im.copy(); t.thumbnail((W-10,H-10)); sheet.paste(t,((k%6)*W+5,(k//6)*H+5),t)
sheet.save("sheet.png")
