# tag-strokes.py - the spray paths for the hero's QUEENS, measured from the tag's own font (Sedgwick Ave Display).
#   python tools/tag-strokes.py            check coverage, write the debug sheet, update spray-tag.js between its markers
#   python tools/tag-strokes.py --check    check only
# Each letter is written as hand-ordered strokes of points in font units (pen origin on the baseline, y up is negative).
# The thickness at each point is not guessed: it is the font's own half-width there, read from the distance transform at
# the nearest point of the letter's thinned centre line. A stroke set passes when the spray, at the radius the page paints
# it, covers the whole letter; the page also settles any remainder in, but the remainder must stay a sliver.
import io, json, os, re, sys
import numpy as np
from scipy import ndimage as ndi
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'assets', 'fonts', 'SedgwickAveDisplay-400.woff2')
JS = os.path.join(ROOT, 'src', 'scripts', 'spray-tag.js')
SHEET = os.path.join(ROOT, 'tmp', 'rev2', 'strokes-sheet.png')
S = 500                 # render size in px: 1 px = 2 font units
U = 1000 / S
PAD = 160
COVER = 1.25            # the radius the page paints solid, in half-widths (spray-tag.js: stamp 1.48x, solid to about 85%)
MIN_COVER = 0.995

# strokes in writing order; each point [x, y] in font units
STROKES = {
    'Q': [
        [[420, -690], [350, -700], [250, -683], [190, -662], [165, -610], [95, -577], [60, -500], [50, -410], [60, -320], [100, -228], [160, -170], [260, -140], [360, -155], [440, -188], [495, -240], [550, -290], [572, -370], [580, -460], [565, -540], [520, -610], [460, -665], [380, -697]],
        [[180, -585], [220, -505], [300, -420], [380, -355], [450, -290], [495, -240], [530, -212], [580, -177], [615, -158]],
    ],
    'U': [
        [[175, -745], [150, -665], [130, -590], [163, -515], [150, -430], [130, -355], [98, -225], [75, -140], [50, -85], [110, -110], [220, -130], [310, -155], [372, -183], [405, -225], [424, -320], [424, -430], [408, -560], [398, -650], [405, -722]],
    ],
    'E': [
        [[150, -735], [199, -660], [282, -632], [342, -607], [402, -583], [450, -580], [512, -596], [548, -610], [574, -622]],
        [[199, -650], [168, -600], [162, -520], [154, -420], [150, -365], [132, -334], [107, -290], [92, -200], [82, -130], [35, -58], [100, -100], [212, -106], [312, -115], [402, -120], [477, -132], [532, -128]],
        [[150, -362], [212, -363], [272, -368], [342, -384], [406, -402]],
    ],
    'N': [
        [[40, -28], [96, -115], [128, -215], [147, -355], [175, -480], [185, -600], [180, -705], [192, -805], [200, -700], [207, -600], [215, -500], [267, -440], [310, -395], [340, -360], [344, -280], [342, -185], [338, -50], [346, -200], [368, -330], [390, -420], [392, -555], [390, -695], [403, -815]],
    ],
    'S': [
        [[430, -568], [446, -612], [460, -680], [495, -728], [532, -748], [470, -712], [400, -700], [330, -690], [250, -674], [180, -655], [140, -635], [165, -585], [200, -525], [252, -470], [332, -370], [412, -270], [445, -215], [462, -160], [500, -128], [537, -115], [480, -140], [432, -140], [360, -140], [292, -140], [192, -138], [100, -137], [55, -122], [78, -180], [112, -245]],
    ],
}
# drips: letter occurrence in QUEENS (0-based index), x in font units, length and width in font units
DRIPS = [(0, 330, 230, 11), (1, 140, 170, 10), (2, 300, 300, 12), (3, 450, 140, 9), (4, 345, 340, 12), (5, 230, 220, 10)]
WORD = 'QUEENS'


def load_font():
    f = TTFont(FONT); f.flavor = None
    buf = io.BytesIO(); f.save(buf)
    return ImageFont.truetype(io.BytesIO(buf.getvalue()), S)


def glyph(font, ch):
    adv = font.getlength(ch)
    w, h = int(adv + 2 * PAD + 200), int(S * 1.7)
    im = Image.new('L', (w, h), 0)
    ImageDraw.Draw(im).text((PAD, int(S * 1.2)), ch, font=font, fill=255, anchor='ls')
    return np.array(im) > 127, (PAD, int(S * 1.2))


def thin(img):
    img = img.astype(np.uint8).copy()
    while True:
        changed = False
        for step in (0, 1):
            Pd = np.pad(img, 1)
            p2, p3, p4, p5 = Pd[:-2, 1:-1], Pd[:-2, 2:], Pd[1:-1, 2:], Pd[2:, 2:]
            p6, p7, p8, p9 = Pd[2:, 1:-1], Pd[2:, :-2], Pd[1:-1, :-2], Pd[:-2, :-2]
            B = p2.astype(int) + p3 + p4 + p5 + p6 + p7 + p8 + p9
            seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                m = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else:
                m = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            if m.any():
                img[m] = 0; changed = True
        if not changed:
            return img.astype(bool)


def spline(pts, step=4.0):
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        d = np.hypot(p2[0] - p1[0], p2[1] - p1[1])
        n = max(2, int(np.ceil(d / step)))
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            pt = [0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)]
            out.append((pt[0], pt[1], p1[2] + (p2[2] - p1[2]) * t))
    out.append(tuple(pts[-1]))
    return out


def main():
    check_only = '--check' in sys.argv
    font = load_font()
    data, worst, tiles = {}, 1.0, []
    for ch in dict.fromkeys(WORD):
        m, (ox, oy) = glyph(font, ch)
        sm = ndi.gaussian_filter(m.astype(float), 2.0) > 0.5
        dt = ndi.distance_transform_edt(sm)
        sk = thin(sm)
        _, (iy, ix) = ndi.distance_transform_edt(~sk, return_indices=True)
        to_px = lambda x, y: (x / U + ox, y / U + oy)

        def half_width(x, y):
            px, py = to_px(x, y)
            px = int(round(min(max(px, 0), m.shape[1] - 1))); py = int(round(min(max(py, 0), m.shape[0] - 1)))
            return dt[iy[py, px], ix[py, px]] * U

        strokes = []
        for st in STROKES[ch]:
            strokes.append([[x, y, round(half_width(x, y))] for x, y in st])
        cov = Image.new('L', (m.shape[1], m.shape[0]), 0)
        d = ImageDraw.Draw(cov)
        samples = []
        for st in strokes:
            sm_pts = spline(st)
            samples.append(sm_pts)
            for x, y, r in sm_pts:
                px, py = to_px(x, y); rr = COVER * r / U
                d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=255)
        cov = np.array(cov) > 0
        frac = (m & cov).sum() / m.sum()
        worst = min(worst, frac)
        ys, xs = np.nonzero(m)
        ink = [round((xs.min() - ox) * U), round((ys.min() - oy) * U), round((xs.max() + 1 - ox) * U), round((ys.max() + 1 - oy) * U)]
        data[ch] = {'ink': ink, 'strokes': [[v for p in st for v in p] for st in strokes], 'drips': []}
        # debug tile: ink grey, uncovered red, path cyan, start green, half-width circles at the points
        rgb = np.zeros(m.shape + (3,), np.uint8)
        rgb[m] = (85, 85, 85); rgb[m & ~cov] = (255, 40, 40)
        im = Image.fromarray(rgb); dr = ImageDraw.Draw(im)
        for si_, (st, smp) in enumerate(zip(strokes, samples)):
            dr.line([to_px(x, y) for x, y, r in smp], fill=(0, 220, 255), width=2)
            for x, y, r in st:
                px, py = to_px(x, y); rr = r / U
                dr.ellipse([px - rr, py - rr, px + rr, py + rr], outline=(255, 210, 0))
            px, py = to_px(st[0][0], st[0][1])
            dr.ellipse([px - 6, py - 6, px + 6, py + 6], fill=(60, 255, 90))
            dr.text((px + 8, py - 8), str(si_ + 1), fill=(60, 255, 90))
        x0, x1, y0, y1 = xs.min() - 30, xs.max() + 30, ys.min() - 30, ys.max() + 30
        tiles.append(im.crop((x0, y0, x1, y1)))
        print(f'{ch}: strokes {len(strokes)}, points {sum(len(s) for s in strokes)}, covered {frac * 100:.2f}%, ink {ink}')
        data[ch]['_m'] = (m, ox, oy, samples)
    # drips: anchor on the letter's bottom edge in that column, fired when the nozzle passes the nearest point
    drips = {}
    for idx, x, ln, w in DRIPS:
        ch = WORD[idx]
        m, ox, oy, samples = data[ch]['_m']
        col = int(round(x / U + ox))
        rows = np.nonzero(m[:, col])[0]
        y_edge = (rows.max() + 1 - oy) * U
        y = round(y_edge - 10)
        best = None
        for si_, smp in enumerate(samples):
            L = np.concatenate([[0], np.cumsum(np.hypot(np.diff([p[0] for p in smp]), np.diff([p[1] for p in smp])))])
            for j, (sx, sy, sr) in enumerate(smp):
                dd = np.hypot(sx - x, sy - y)
                if best is None or dd < best[0]: best = (dd, si_, L[j] / L[-1])
        drips.setdefault(idx, []).append([x, y, ln, w, best[1], round(best[2], 3)])
    out = {ch: {k: v for k, v in g.items() if k != '_m'} for ch, g in data.items()}
    # the sheet
    hgt = max(t.height for t in tiles)
    sheet = Image.new('RGB', (sum(t.width for t in tiles) + 10 * len(tiles), hgt), (0, 0, 0))
    xx = 0
    for t in tiles:
        sheet.paste(t, (xx, 0)); xx += t.width + 10
    os.makedirs(os.path.dirname(SHEET), exist_ok=True)
    sheet.save(SHEET)
    print(f'worst coverage {worst * 100:.2f}% (need {MIN_COVER * 100:.1f}%), sheet {os.path.relpath(SHEET, ROOT)}')
    if worst < MIN_COVER:
        print('FAIL: a letter is not covered'); sys.exit(1)
    if check_only:
        return
    glyphs = ',\n'.join(f'    {ch}: {{ ink: {json.dumps(g["ink"])}, strokes: {json.dumps(g["strokes"], separators=(",", ":"))} }}' for ch, g in out.items())
    dr_js = json.dumps([drips.get(i, []) for i in range(len(WORD))], separators=(',', ':'))
    block = f"/* GLYPHS:BEGIN - written by tools/tag-strokes.py from the font; do not edit by hand */\n  var GLYPHS = {{\n{glyphs}\n  }};\n  /* per letter of the word: [x, y, length, width, stroke, where along it] in font units */\n  var DRIPS = {dr_js};\n  /* GLYPHS:END */"
    js = open(JS, encoding='utf8').read()
    new, n = re.subn(r'/\* GLYPHS:BEGIN.*?/\* GLYPHS:END \*/', lambda _: block, js, flags=re.S)
    if n != 1:
        print('FAIL: markers not found in spray-tag.js'); sys.exit(1)
    open(JS, 'w', encoding='utf8', newline='\n').write(new)
    print('spray-tag.js updated')


main()
