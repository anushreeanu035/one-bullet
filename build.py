#!/usr/bin/env python3
"""Bundle the game into one self-contained HTML file (Phaser inlined, no network needed)."""
import pathlib, re

root = pathlib.Path(__file__).parent
test = pathlib.Path.cwd()  # not used
files = ['phaser.min.js', 'sim.js', 'main.js']
def safe(js):
    return js.replace('</script>', '<\\/script>')
parts = []
for f in files:
    parts.append('<script>/* %s */\n%s\n</script>' % (f, safe((root / f).read_text())))
html = (root / 'index.html').read_text()
# strip the dev script tags and inject the bundle
html = re.sub(r'<script src="[^"]+"></script>\s*', '', html)
html = html.replace('</body>', '\n'.join(parts) + '\n</body>')
out = root / 'OneBullet.html'
out.write_text(html)
print(out, len(html), 'bytes')
