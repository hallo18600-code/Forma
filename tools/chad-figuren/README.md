# Chad-Figuren für das Slide-Studio

Eigene Zeichnungen (keine fremden Bilder). Alle haben dieselbe Gesichtsform,
nur Haut, Haare, Bart und Kopfbedeckung ändern sich.

1. Figur in `figs.json` ergänzen oder ändern
2. `python3 gen.py figs.json svg && python3 render.py` (braucht Playwright + Pillow)
3. `png/<id>.webp` und `png/<id>_t.webp` nach `studio/fig/` kopieren
4. In `studio/index.html` bei `BUILTIN_FIGS` eintragen (mit `"only": "group"`)
