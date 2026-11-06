# spray-art.py - procedural paint kit for the NIGHT PIECE design. No AI. Seeded, so a re-run gives the same pixels.
#   python -I tools/spray-art.py [out_dir=assets/photos/paint]
# Writes: spray-orange-1, spray-orange-2 (#ff6b00), spray-blue-1, spray-blue-2 (#1b39ff): 1400 px overspray bursts,
#         grain (256 px seamless monochrome grain tile with alpha), spray-mask (1600x400 alpha wipe, opaque left, clear right).
#
# A rattle can lays droplets, not a gradient, so each burst is built from droplets:
#   core    a soft paint film made of a few offset anisotropic blobs, warped by low frequency noise so no contour is a circle;
#   mist    hundreds of thousands of very fine droplets, count falling with distance along a heavy radial tail;
#   speck   thousands of larger droplets (log-normal radii), most likely in the thin outer band, a few elongated radially;
#   opacity is Beer-Lambert over the accumulated paint, 1 - exp(-density), so overlaps saturate the way paint does;
#   every layer is thinned to nothing before the canvas edge, so a burst never shows a clipped side.
# The RGB plane stays at the brand colour everywhere and only alpha carries the shape, so scaling never fringes.
import os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/photos/paint'
ORANGE, BLUE = (0xff, 0x6b, 0x00), (0x1b, 0x39, 0xff)
SIZE = 1400


def lowfreq(rng, n, scale):
    """smooth noise in about -1..1, feature size = scale px"""
    small = rng.standard_normal((max(4, int(n / scale)) + 3, max(4, int(n / scale)) + 3))
    f = ndi.zoom(small, n / (small.shape[0] - 3), order=3)[:n, :n]
    return f / max(1e-6, np.abs(f).max())


def splat(buf, x, y, w=None):
    """accumulate points with bilinear weights (sub-pixel positions, so fine mist stays soft and round)"""
    n = buf.shape[0]
    ix, iy = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
    fx, fy = x - ix, y - iy
    w = np.ones_like(x) if w is None else w
    keep = (ix >= 0) & (iy >= 0) & (ix < n - 1) & (iy < n - 1)
    ix, iy, fx, fy, w = ix[keep], iy[keep], fx[keep], fy[keep], w[keep]
    np.add.at(buf, (iy, ix), w * (1 - fx) * (1 - fy))
    np.add.at(buf, (iy, ix + 1), w * fx * (1 - fy))
    np.add.at(buf, (iy + 1, ix), w * (1 - fx) * fy)
    np.add.at(buf, (iy + 1, ix + 1), w * fx * fy)


def burst(seed, bias_deg, stretch, core_r, tilt_deg=None, lobes=3, mist=520000, specks=26000):
    """alpha plane (0..1) of one overspray burst. bias_deg: the side the can was aimed from (mist leans that way)."""
    rng = np.random.default_rng(seed)
    n = SIZE
    c = n / 2
    bias = np.radians(bias_deg)
    bx, by = np.cos(bias), np.sin(bias)
    tilt = np.radians(bias_deg if tilt_deg is None else tilt_deg)
    ct, st = np.cos(tilt), np.sin(tilt)
    cx0, cy0 = c - bx * core_r * 0.30, c - by * core_r * 0.30   # the dense core sits against the wind of the mist
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)

    # paint film: blobs warped by noise
    warp_x = lowfreq(rng, n, 170) * 62 + lowfreq(rng, n, 52) * 18
    warp_y = lowfreq(rng, n, 170) * 62 + lowfreq(rng, n, 52) * 18
    core = np.zeros((n, n), np.float32)
    for k in range(lobes):
        ang = rng.uniform(0, 2 * np.pi)
        off = rng.uniform(0, core_r * 0.42) if k else 0
        ox, oy = cx0 + np.cos(ang) * off, cy0 + np.sin(ang) * off
        r = core_r * (1.0 if k == 0 else rng.uniform(0.45, 0.78))
        dx, dy = xx + warp_x - ox, yy + warp_y - oy
        u = (dx * ct + dy * st) / (r * stretch)
        v = (-dx * st + dy * ct) / (r / stretch ** 0.5)
        core += (4.6 if k == 0 else rng.uniform(1.8, 3.2)) * np.exp(-(u * u + v * v) ** 0.82)

    # fine mist: heavy radial tail, leaning along the bias, thinned by patches so it is never an even ring
    m = mist
    sig = rng.choice([0.72, 1.15, 1.75, 2.55], size=m, p=[0.34, 0.34, 0.22, 0.10]) * core_r
    r = sig * np.sqrt(-2 * np.log(rng.uniform(1e-6, 1, m)))
    a = rng.uniform(0, 2 * np.pi, m)
    lean = 1 + 0.46 * np.cos(a - bias)                         # further out on the aimed side
    x = cx0 + np.cos(a) * r * lean * stretch ** 0.4
    y = cy0 + np.sin(a) * r * lean / stretch ** 0.2
    patch = np.clip(0.55 + 0.75 * lowfreq(rng, n, 120) + 0.35 * lowfreq(rng, n, 34), 0, 1.4)
    ix, iy = np.clip(x.astype(int), 0, n - 1), np.clip(y.astype(int), 0, n - 1)
    keep = rng.uniform(0, 1, m) < patch[iy, ix]
    fine = np.zeros((n, n), np.float32)
    splat(fine, x[keep], y[keep], rng.uniform(0.35, 1.0, int(keep.sum())).astype(np.float32))
    fine = ndi.gaussian_filter(fine, 0.62)

    # larger droplets, drawn one by one as anti-aliased discs (a few stretched along the throw direction)
    s = specks
    sig = rng.choice([1.25, 1.85, 2.5], size=s, p=[0.48, 0.34, 0.18]) * core_r
    r = sig * np.sqrt(-2 * np.log(rng.uniform(1e-6, 1, s))) + core_r * 0.35
    a = rng.uniform(0, 2 * np.pi, s)
    lean = 1 + 0.5 * np.cos(a - bias)
    x = cx0 + np.cos(a) * r * lean
    y = cy0 + np.sin(a) * r * lean
    rad = np.clip(rng.lognormal(mean=-0.32, sigma=0.46, size=s), 0.38, 3.3)
    big = rng.uniform(0, 1, s) < 0.004                          # a few real spatters
    rad[big] = rng.uniform(2.2, 4.4, int(big.sum()))
    drop = np.zeros((n, n), np.float32)
    ca, sa = np.cos(a), np.sin(a)
    for i in range(s):
        R = rad[i]
        e = 1.0 + (rng.uniform(0.05, 0.7) if R > 1.6 else 0)    # elongation along the throw
        ext = int(R * e) + 2
        xi, yi = int(x[i]), int(y[i])
        if xi - ext < 0 or yi - ext < 0 or xi + ext + 1 >= n or yi + ext + 1 >= n:
            continue
        gy, gx = np.mgrid[yi - ext:yi + ext + 1, xi - ext:xi + ext + 1]
        dx, dy = gx - x[i], gy - y[i]
        along = (dx * ca[i] + dy * sa[i]) / e
        across = -dx * sa[i] + dy * ca[i]
        d = np.sqrt(along * along + across * across)
        cov = np.clip(R - d + 0.5, 0, 1).astype(np.float32)
        patch_v = drop[yi - ext:yi + ext + 1, xi - ext:xi + ext + 1]
        np.maximum(patch_v, cov * rng.uniform(0.55, 1.0), out=patch_v)

    # gritty breakup where the film thins: the soft core should dissolve into grain, not into a smooth airbrush
    grit = rng.uniform(0, 1, (n, n)).astype(np.float32)
    grit = ndi.gaussian_filter(grit, 0.75)
    grit = (grit - grit.mean()) / grit.std()
    thin = np.exp(-core * 1.05)                                 # 1 where there is little film, 0 in the opaque middle
    film = core * np.clip(1 + grit * 0.62 * thin, 0, None)

    density = film + fine * 2.1 + drop * 2.6
    # thin everything to nothing before the canvas edge (a density window, so droplets get rarer rather than fade)
    d = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / c
    window = np.clip((1.0 - d) / 0.22, 0, 1)
    window = window * window * (3 - 2 * window)
    edge = np.minimum.reduce([xx, yy, n - 1 - xx, n - 1 - yy])
    window = window * np.clip(edge / 40, 0, 1)
    alpha = 1 - np.exp(-density * window)
    alpha[window <= 0] = 0
    return alpha


def save_rgba(rgb_plane, alpha, path, q=88, alpha_q=int(os.environ.get('SPRAY_ALPHA_Q', 60))):
    a8 = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    arr = np.dstack([rgb_plane, a8])
    tmp = path + '.tmp.png'
    Image.fromarray(arr, 'RGBA').save(tmp, compress_level=1)
    subprocess.run(['cwebp', '-quiet', '-q', str(q), '-m', '6', '-alpha_q', str(alpha_q), '-exact', '-metadata', 'none', tmp, '-o', path], check=True)
    os.remove(tmp)


def flat_rgb(colour, h, w):
    return np.dstack([np.full((h, w), colour[i], np.uint8) for i in range(3)])


def write_grain(path, size=256, seed=9127):
    """seamless (filtered on the torus): white grains and black grains with alpha = |grain|, mean opacity about 5 percent"""
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((size, size))
    fy, fx = np.meshgrid(np.fft.fftfreq(size), np.fft.fftfreq(size), indexing='ij')
    f = np.fft.fft2(white) * np.exp(-(fx ** 2 + fy ** 2) * (2 * np.pi * 0.62) ** 2 / 2)   # gaussian sigma 0.62 px, periodic
    g = np.real(np.fft.ifft2(f))
    g = g / g.std()
    alpha = np.clip(np.abs(g) * 0.062, 0, 0.30)
    a8 = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    v = np.where(g > 0, 255, 0).astype(np.uint8)
    arr = np.dstack([v, v, v, a8])
    tmp = path + '.tmp.png'
    Image.fromarray(arr, 'RGBA').save(tmp)
    subprocess.run(['cwebp', '-quiet', '-lossless', '-exact', '-m', '6', '-metadata', 'none', tmp, '-o', path], check=True)
    os.remove(tmp)


def periodic_noise(rng, h, w, sigma):
    """gaussian noise, periodic along y (and x), unit variance"""
    n = rng.standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    f = np.fft.fft2(n) * np.exp(-(fx ** 2 + fy ** 2) * (2 * np.pi * sigma) ** 2 / 2)
    g = np.real(np.fft.ifft2(f))
    return g / g.std()


def write_mask(path, w=1600, h=400, seed=4431):
    """alpha wipe: exactly 255 on the left, exactly 0 on the right, a speckled spray edge between. The edge is made of real
    droplets like the bursts. Periodic in y, so a taller element can repeat it. Move mask-position (or size it 300% wide)
    to wipe from left to right."""
    rng = np.random.default_rng(seed)
    x = (np.arange(w) + 0.5) / w
    # the wobbling front of the solid film, per row (periodic in y)
    wob = periodic_noise(rng, h, w, 40)[:, w // 2] * 0.024 + periodic_noise(rng, h, w, 11)[:, w // 3] * 0.008
    front = 0.40 + wob[:, None]                               # where the solid film stops, as a fraction of the width
    # film: opaque up to the front, then a short soft shoulder broken up by grit (never a smooth airbrush ramp)
    grit = periodic_noise(rng, h, w, 0.9) * 0.55 + periodic_noise(rng, h, w, 2.2) * 0.45
    t = (x[None, :] - front) / 0.085
    film = np.clip(1 - t + grit * 0.50 * np.clip(t + 0.15, 0, 1), 0, 1)
    film = np.where(t < 0, 1.0, film)
    # droplets: density falls with distance from the front, gone by 0.76 of the width
    drop = np.zeros((h, w), np.float32)
    n = 42000
    u = rng.uniform(0, 1, n)
    xs = (0.36 + (1 - (1 - u) ** (1 / 3.6)) * 0.40) * w       # density (1-t)^2.6: dense near the film, reaches zero at 0.76
    ys = rng.uniform(0, h, n)
    rad = np.clip(rng.lognormal(mean=-0.05, sigma=0.46, size=n), 0.45, 3.4)
    far = (xs / w - 0.36) / 0.40
    rad = rad * (1 - 0.42 * far)                              # the far droplets are the finest
    for i in range(n):
        R = rad[i]
        ext = int(R) + 2
        xi, yi = int(xs[i]), int(ys[i])
        gy, gx = np.mgrid[yi - ext:yi + ext + 1, xi - ext:xi + ext + 1]
        d = np.hypot(gx - xs[i], gy - ys[i])
        cov = np.clip(R - d + 0.5, 0, 1).astype(np.float32)
        rows = gy[:, 0] % h                                   # wrap in y
        cols = gx[0, :]
        keep = (cols >= 0) & (cols < w)
        drop[np.ix_(rows, cols[keep])] = np.maximum(drop[np.ix_(rows, cols[keep])], cov[:, keep])
    alpha = np.maximum(film, drop)
    # exact ends
    alpha[:, x < 0.30] = 1
    alpha[:, x >= 0.77] = 0
    a8 = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    arr = np.dstack([flat_rgb((255, 255, 255), h, w), a8])
    tmp = path + '.tmp.png'
    Image.fromarray(arr, 'RGBA').save(tmp, compress_level=1)
    subprocess.run(['cwebp', '-quiet', '-q', '90', '-alpha_q', '100', '-exact', '-m', '6', '-metadata', 'none', tmp, '-o', path], check=True)
    os.remove(tmp)


JOBS = [
    ('spray-orange-1.webp', ORANGE, dict(seed=1101, bias_deg=-32, stretch=1.10, core_r=132)),
    ('spray-orange-2.webp', ORANGE, dict(seed=1207, bias_deg=148, stretch=1.34, core_r=108, lobes=4)),
    ('spray-blue-1.webp', BLUE, dict(seed=2203, bias_deg=62, stretch=1.16, core_r=120)),
    ('spray-blue-2.webp', BLUE, dict(seed=2309, bias_deg=-118, stretch=1.42, core_r=98, lobes=4)),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, col, kw in JOBS:
        path = os.path.join(OUT, name)
        save_rgba(flat_rgb(col, SIZE, SIZE), burst(**kw), path)
        print('wrote', path, os.path.getsize(path), 'bytes')
    p = os.path.join(OUT, 'grain.webp')
    write_grain(p)
    print('wrote', p, os.path.getsize(p), 'bytes')
    p = os.path.join(OUT, 'spray-mask.webp')
    write_mask(p)
    print('wrote', p, os.path.getsize(p), 'bytes')
