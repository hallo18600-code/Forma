# Erzeugt eigene Chad-Profilzeichnungen als SVG (gleiche Gesichtsform für alle, nur Haare/Bart/Haut/Kopfbedeckung variieren)
import json, sys

INK = "#111"
SW = 7  # Linienstärke

def head_path():
    return ("M 640 165 C 520 120, 385 150, 333 240 "
            "C 303 292, 296 352, 301 396 "
            "C 304 412, 291 426, 302 442 "
            "C 292 482, 262 522, 230 566 "
            "C 222 578, 232 592, 252 591 "
            "L 291 593 "
            "C 289 606, 286 616, 289 626 "
            "C 279 633, 279 643, 291 649 "
            "C 283 657, 283 669, 299 673 "
            "C 308 685, 300 700, 288 718 "
            "C 280 742, 284 772, 306 788 "
            "C 380 805, 480 785, 560 748 "
            "C 592 732, 606 706, 609 672 "
            "C 676 620, 718 520, 716 400 "
            "C 712 262, 692 192, 640 165 Z")

def neck(skin):
    return f'<path d="M 395 730 C 400 800, 405 860, 395 930 L 760 930 C 735 860, 715 760, 705 600 Z" fill="{skin}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'

def shirt(c, kind):
    if kind == "robe":   # Mönchsrobe: über eine Schulter
        return (f'<path d="M 110 1090 C 160 960, 260 900, 380 890 C 470 930, 600 905, 740 860 C 850 900, 930 980, 960 1090 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
                f'<path d="M 740 860 C 640 960, 520 1020, 380 1090" fill="none" stroke="{INK}" stroke-width="{SW-1}" stroke-linecap="round"/>'
                f'<path d="M 690 905 C 600 980, 500 1030, 420 1070" fill="none" stroke="{INK}" stroke-width="3" opacity=".5"/>')
    collar = ""
    if kind == "thobe":
        collar = f'<path d="M 390 905 C 470 935, 620 925, 735 880" fill="none" stroke="{INK}" stroke-width="{SW-2}"/><path d="M 470 930 L 470 1080" stroke="{INK}" stroke-width="4" opacity=".5"/>'
    if kind == "kurta":
        collar = f'<path d="M 390 905 C 470 935, 620 925, 735 880" fill="none" stroke="#b5651d" stroke-width="10"/>'
    return (f'<path d="M 110 1090 C 170 965, 270 905, 390 895 C 480 925, 620 915, 735 870 C 845 900, 930 980, 960 1090 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
            f'<path d="M 300 1000 C 360 960, 430 960, 470 985" fill="none" stroke="#444" stroke-width="4" opacity=".6"/>' + collar)

def ear(skin):
    return (f'<path d="M 562 468 C 602 436, 646 466, 638 520 C 632 572, 604 604, 576 612 C 556 590, 566 540, 562 468 Z" fill="{skin}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
            f'<path d="M 584 492 C 608 482, 620 505, 612 534 C 606 556, 594 566, 586 572" fill="none" stroke="{INK}" stroke-width="4"/>')

def face_details(eye, brow):
    return (f'<path d="M 318 449 C 336 437, 362 437, 378 451 C 362 461, 336 461, 318 449 Z" fill="#fff" stroke="{INK}" stroke-width="4"/>'
            f'<circle cx="344" cy="450" r="9" fill="{eye}" stroke="{INK}" stroke-width="2"/><circle cx="344" cy="450" r="3.5" fill="#000"/>'
            f'<path d="M 296 420 C 330 410, 368 410, 402 418" fill="none" stroke="{brow}" stroke-width="15" stroke-linecap="round"/>'
            f'<path d="M 375 455 C 385 462, 392 470, 395 478" fill="none" stroke="{INK}" stroke-width="3" opacity=".6"/>'
            f'<path d="M 285 648 C 296 652, 306 652, 316 649" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="M 268 575 C 276 572, 284 576, 286 584" fill="none" stroke="{INK}" stroke-width="3"/>')

def hair(style, c, side):
    o = f'stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"'
    lines = lambda pts: "".join(f'<path d="{p}" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round" opacity=".75"/>' for p in pts)
    if style == "fade":   # oben länger, Seiten kurz
        return (f'<path d="M 724 410 C 724 320, 700 240, 640 210 L 600 330 C 650 335, 690 360, 700 420 Z" fill="{side}" {o}/>'
                f'<path d="M 326 268 C 360 150, 520 105, 650 158 C 700 180, 716 230, 712 300 C 650 300, 560 312, 470 300 C 410 294, 360 290, 326 268 Z" fill="{c}" {o}/>'
                + lines(["M 360 230 C 430 180, 520 165, 600 175", "M 400 265 C 470 225, 560 215, 650 230", "M 470 290 C 540 265, 610 260, 690 270"]))
    if style == "waves":  # sehr kurz, Wellen
        return (f'<path d="M 330 262 C 360 160, 520 110, 650 160 C 712 190, 728 280, 722 420 L 700 425 C 690 360, 650 320, 600 318 C 520 314, 420 300, 330 262 Z" fill="{c}" {o}/>'
                + lines(["M 380 215 C 440 190, 500 190, 540 215", "M 450 175 C 520 160, 590 175, 630 205", "M 560 230 C 610 215, 660 240, 690 290", "M 600 270 C 640 270, 680 310, 700 370", "M 400 260 C 450 245, 510 250, 550 270"]))
    if style == "sleek":  # glatt, nach hinten
        return (f'<path d="M 322 278 C 340 150, 500 100, 640 150 C 710 178, 735 260, 726 430 L 704 432 C 696 362, 660 330, 610 326 C 520 322, 410 312, 322 278 Z" fill="{c}" {o}/>'
                + lines(["M 345 255 C 430 200, 560 200, 700 260", "M 360 220 C 450 160, 580 165, 690 215", "M 420 285 C 500 260, 600 260, 690 300"]))
    if style == "wavy":   # mittellang, wellig
        return (f'<path d="M 318 290 C 310 160, 480 90, 640 140 C 730 170, 760 280, 735 470 C 715 480, 700 470, 698 440 C 690 370, 650 335, 600 330 C 520 325, 420 320, 318 290 Z" fill="{c}" {o}/>'
                + lines(["M 340 255 C 380 215, 420 230, 450 200 C 490 170, 530 200, 570 175", "M 400 290 C 450 260, 490 285, 540 255 C 590 230, 630 260, 680 240", "M 660 300 C 700 330, 690 380, 715 420"]))
    if style == "sidepart":
        return (f'<path d="M 324 272 C 330 160, 470 100, 630 140 C 712 165, 736 260, 724 425 L 702 428 C 694 360, 655 328, 605 324 C 520 318, 420 302, 324 272 Z" fill="{c}" {o}/>'
                + lines(["M 470 150 C 430 190, 380 220, 335 250", "M 500 160 C 560 175, 640 200, 700 260", "M 480 200 C 560 210, 640 240, 690 300"]))
    return ""

def beard(style, c):
    o = f'stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"'
    tex = lambda pts: "".join(f'<path d="{p}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>' for p in pts)
    if style == "full":
        return (f'<path d="M 606 560 C 612 660, 590 760, 520 830 C 450 895, 330 905, 286 830 C 270 790, 274 745, 290 705 C 320 700, 345 690, 360 672 C 330 668, 310 660, 300 650 C 330 640, 360 620, 380 600 C 440 560, 530 548, 606 560 Z" fill="{c}" {o}/>'
                f'<path d="M 290 598 C 330 588, 380 598, 400 630 C 404 644, 394 652, 384 646 C 362 632, 330 630, 296 640 C 286 630, 284 612, 290 598 Z" fill="{c}" {o}/>'
                + tex(["M 330 760 C 350 800, 370 830, 400 850", "M 380 720 C 400 770, 430 800, 470 820", "M 450 680 C 470 730, 500 760, 540 780", "M 520 620 C 540 670, 560 700, 590 720", "M 320 710 C 330 740, 345 760, 360 780"]))
    if style == "boxed":   # kurz und gepflegt
        return (f'<path d="M 602 590 C 606 660, 585 730, 520 775 C 460 820, 360 830, 300 790 C 284 770, 282 740, 290 712 C 320 712, 345 700, 358 680 C 332 676, 312 668, 300 655 C 340 640, 380 615, 410 600 C 470 575, 540 570, 602 590 Z" fill="{c}" {o}/>'
                f'<path d="M 290 598 C 330 588, 380 598, 400 630 C 404 644, 394 652, 384 646 C 362 632, 330 630, 296 640 C 286 630, 284 612, 290 598 Z" fill="{c}" {o}/>'
                + tex(["M 340 740 C 360 765, 385 780, 410 790", "M 420 690 C 440 725, 470 745, 500 755", "M 500 640 C 520 680, 545 700, 575 710"]))
    if style == "stubble":
        return (f'<path d="M 600 610 C 600 670, 560 730, 500 765 C 440 795, 350 800, 305 760 C 296 745, 293 732, 294 716 C 330 716, 350 705, 362 688 C 420 650, 520 610, 600 610 Z" fill="{c}" opacity=".35"/>')
    if style == "mustache":
        return f'<path d="M 290 598 C 330 588, 380 598, 400 630 C 404 644, 394 652, 384 646 C 362 632, 330 630, 296 640 C 286 630, 284 612, 290 598 Z" fill="{c}" {o}/>'
    return ""

def headwear(kind, c):
    o = f'stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"'
    if kind == "kufi":
        return (f'<path d="M 338 262 C 360 150, 520 105, 650 152 C 708 175, 726 230, 722 300 C 640 285, 520 280, 430 285 C 395 287, 362 280, 338 262 Z" fill="{c}" {o}/>'
                + "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="none" stroke="#999" stroke-width="2"/>' for x, y in [(420, 220), (480, 200), (540, 190), (600, 195), (660, 215), (450, 255), (520, 245), (590, 240), (660, 255)]))
    if kind == "kippah":
        return f'<path d="M 470 178 C 500 96, 680 88, 718 176 C 660 156, 530 158, 470 178 Z" fill="{c}" {o}/><path d="M 492 160 C 560 132, 640 130, 702 158" fill="none" stroke="#2f5fa8" stroke-width="9"/>'
    if kind == "dastar":  # Sikh-Turban
        return (f'<path d="M 312 348 C 288 236, 326 112, 466 58 C 600 14, 744 78, 764 222 C 778 322, 748 412, 706 442 C 690 386, 656 352, 606 346 C 500 340, 400 352, 312 348 Z" fill="{c}" {o}/>'
                f'<path d="M 318 318 C 420 300, 560 230, 752 300" fill="none" stroke="{INK}" stroke-width="5" opacity=".7"/>'
                f'<path d="M 322 262 C 430 240, 590 150, 750 210" fill="none" stroke="{INK}" stroke-width="5" opacity=".7"/>'
                f'<path d="M 370 168 C 470 150, 610 70, 720 110" fill="none" stroke="{INK}" stroke-width="5" opacity=".7"/>')
    return ""

def cross_chain():
    return ('<path d="M 400 860 C 430 900, 470 925, 520 935" fill="none" stroke="#d4af37" stroke-width="5"/>'
            '<path d="M 700 820 C 690 880, 640 920, 560 935" fill="none" stroke="#d4af37" stroke-width="5" opacity=".7"/>'
            '<g transform="translate(540 950)"><rect x="-7" y="-10" width="14" height="62" rx="3" fill="#e9c349" stroke="#111" stroke-width="3"/>'
            '<rect x="-22" y="4" width="44" height="13" rx="3" fill="#e9c349" stroke="#111" stroke-width="3"/></g>')

def svg(p):
    parts = [neck(p["skin"]), shirt(p.get("shirt", "#151515"), p.get("shirtKind", "tee"))]
    if p.get("cross"): parts.append(cross_chain())
    parts.append(f'<path d="{head_path()}" fill="{p["skin"]}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>')
    parts.append(f'<path d="M 470 380 C 500 420, 520 470, 525 520" fill="none" stroke="{INK}" stroke-width="3" opacity=".25"/>')
    parts.append(ear(p["skin"]))
    parts.append(hair(p.get("hair", ""), p.get("hairColor", "#222"), p.get("sideColor", p.get("hairColor", "#222"))))
    if p.get("stubble"): parts.append(beard("stubble", p.get("hairColor", "#222")))
    parts.append(beard(p.get("beard", ""), p.get("beardColor", p.get("hairColor", "#222"))))
    parts.append(face_details(p.get("eye", "#4a2f1d"), p.get("brow", p.get("hairColor", "#222"))))
    parts.append(headwear(p.get("head", ""), p.get("headColor", "#fff")))
    if p.get("scalp"):
        parts.append('<path d="M 420 200 C 470 170, 540 160, 590 170" fill="none" stroke="#fff" stroke-width="12" opacity=".55" stroke-linecap="round"/>')
    if p.get("tilak"):
        parts.append('<path d="M 318 345 L 318 392" stroke="#d2481b" stroke-width="10" stroke-linecap="round"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 40 940 1060" width="940" height="1060">{"".join(parts)}</svg>'

if __name__ == "__main__":
    figs = json.load(open(sys.argv[1]))
    for f in figs:
        open(f"{sys.argv[2]}/{f['id']}.svg", "w").write(svg(f))
