# bridge-hero.py - the home hero's photo set from the client's own bridge photo.
# Input: the client's Bridge-hero.webp upscaled 2x with fal-ai/topaz/upscale/image, model Standard V2 (kept outside the repo, 5120x3756).
# Nothing is restaged or added: black and white as the client shot it, a small tonal lift so the steel reads, then downscales.
# Usage: python -X utf8 -I tools/bridge-hero.py <upscaled.png> <out-dir>
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
src, out = sys.argv[1], sys.argv[2]
m = Image.open(src).convert('L')
a = np.asarray(m, dtype=np.float32) / 255
lo, hi = np.percentile(a, 0.4), np.percentile(a, 99.7)
a = np.clip((a - lo) / (hi - lo), 0, 1)
a = a ** 0.94  # lift the shadows a little: the underside of the deck holds real detail
m = Image.fromarray((a * 255 + .5).astype(np.uint8), 'L')
m = m.filter(ImageFilter.UnsharpMask(radius=60, percent=16, threshold=0))  # broad local contrast before the downscales
os.makedirs(out, exist_ok=True)
W, H = m.size
for w in (1280, 1920, 2560, 3840):
    im = m.resize((w, round(H * w / W)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=70 if w >= 2560 else 55, threshold=2))
    f = os.path.join(out, f'bridge-hero-{w}.webp')
    im.convert('RGB').save(f, quality=84 if w < 3840 else 80, method=6)
    print(f, im.size, os.path.getsize(f) // 1024, 'KB')
# phones: a tall crop on the tower and the truss
c = m.crop((1980, 120, 3980, 3120))
for w in (800, 1200, 1600):
    im = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
    f = os.path.join(out, f'bridge-hero-sm-{w}.webp')
    im.convert('RGB').save(f, quality=80, method=6)
    print(f, im.size, os.path.getsize(f) // 1024, 'KB')
