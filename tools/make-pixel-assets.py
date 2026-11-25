#!/usr/bin/env python3
"""Generate aset pixel art buat scene kantor Acara Nataba.

Jalan: python3 tools/make-pixel-assets.py
Output: assets/pixel/room.png (latar ala poster Tanabata To Algorithm)
        assets/pixel/ws-<slug>-{a,b}.png       (2 frame animasi duduk)
        assets/pixel/ws-<slug>-desk-{a,b}.png  (meja kosong — orang lagi ngelapor)
        assets/pixel/walk-<slug>-{a,b}.png     (2 frame jalan buat lapor ke koor)
"""
import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "pixel")

# ---------- palet ----------
SKIN = (242, 203, 161)
SKIN_D = (216, 174, 134)
HAIR = (40, 26, 56)
CHAIR = (74, 86, 124)
CHAIR_D = (56, 65, 96)
WOOD_T = (214, 168, 108)
WOOD_D = (172, 126, 76)
WOOD_E = (128, 88, 52)
LAP = (60, 66, 88)
SCR = (28, 16, 50)
GLOW = (126, 224, 255)
MUG = (224, 90, 43)
DARK = (40, 26, 56)


def shade(c, f=0.78):
    return tuple(int(v * f) for v in c)


# ---------- font pixel 5x7 (buat tulisan di dinding) ----------
FONT = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "G": [".###.", "#...#", "#....", "#..##", "#...#", "#...#", ".###."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
}


def text_width(text, scale):
    w = 0
    for ch in text.upper():
        w += (3 if ch == " " else 5 + 1) * scale
    return w - scale


def draw_text(d, text, x, y, scale, fill, shadow=None):
    """Tulis teks uppercase pake font 5x7. shadow=(dx,dy,color) buat outline."""
    if shadow:
        sx, sy, sc = shadow
        draw_text(d, text, x + sx, y + sy, scale, sc)
    cx = x
    for ch in text.upper():
        if ch == " ":
            cx += 3 * scale
            continue
        glyph = FONT.get(ch)
        if not glyph:
            cx += 6 * scale
            continue
        for ry, row in enumerate(glyph):
            for rx, c in enumerate(row):
                if c == "#":
                    d.rectangle(
                        [cx + rx * scale, y + ry * scale,
                         cx + (rx + 1) * scale - 1, y + (ry + 1) * scale - 1],
                        fill=fill)
        cx += 6 * scale


def workstation(shirt, koor=False, prop="mug", empty=False, gender="m"):
    """Return [frame_a, frame_b] (RGBA). prop: mug | plant | none
    empty=True → meja doang (orangnya lagi pergi ngelapor), khusus non-koor.
    gender="f" → rambut panjang (poni turun di sisi kepala)."""
    if koor:
        W, H = 136, 88
    else:
        W, H = 96, 72
    frames = []
    for fr in range(2):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        dy = fr  # frame B: kepala +1px (gerak)
        if koor:
            # kursi (lebih lebar dari badan biar keliatan)
            d.rectangle([46, 10, 90, 54], fill=CHAIR)
            d.rectangle([46, 10, 90, 13], fill=CHAIR_D)
            d.rectangle([46, 30, 51, 54], fill=CHAIR_D)
            d.rectangle([85, 30, 90, 54], fill=CHAIR_D)
            # kepala
            d.rectangle([57, 6 + dy, 78, 16 + dy], fill=HAIR)
            d.rectangle([59, 16 + dy, 76, 31 + dy], fill=SKIN)
            d.rectangle([72, 16 + dy, 76, 31 + dy], fill=SKIN_D)
            d.rectangle([64, 22 + dy, 65, 23 + dy], fill=DARK)
            d.rectangle([71, 22 + dy, 72, 23 + dy], fill=DARK)
            d.rectangle([66, 27 + dy, 70, 27 + dy], fill=SKIN_D)
            # headset (kontras terang biar keliatan di atas rambut)
            HP = (176, 182, 200)
            d.rectangle([57, 3 + dy, 78, 7 + dy], fill=HP)
            d.rectangle([53, 12 + dy, 58, 24 + dy], fill=(70, 76, 96))
            d.rectangle([77, 12 + dy, 82, 24 + dy], fill=(70, 76, 96))
            d.rectangle([53, 15 + dy, 55, 21 + dy], fill=HP)
            d.rectangle([80, 15 + dy, 82, 21 + dy], fill=HP)
            d.rectangle([66, 29 + dy, 77, 31 + dy], fill=(70, 76, 96))  # mic arm (di bawah mulut)
            d.rectangle([63, 29 + dy, 66, 31 + dy], fill=(70, 76, 96))  # mic tip
            # badan
            d.rectangle([64, 31 + dy, 71, 35 + dy], fill=SKIN_D)  # leher
            d.rectangle([50, 35, 85, 56], fill=shirt)
            d.rectangle([50, 35, 85, 37], fill=shade(shirt, 0.85))
            d.rectangle([50, 37, 57, 56], fill=shade(shirt))
            d.rectangle([78, 37, 85, 56], fill=shade(shirt))
            # tangan (typing)
            hx = fr * 2
            hy = fr
            d.rectangle([56 + hx, 52 + hy, 62 + hx, 56 + hy], fill=shade(shirt))
            d.rectangle([56 + hx, 54 + hy, 62 + hx, 56 + hy], fill=SKIN)
            d.rectangle([73 - hx, 52 + hy, 79 - hx, 56 + hy], fill=shade(shirt))
            d.rectangle([73 - hx, 54 + hy, 79 - hx, 56 + hy], fill=SKIN)
            # meja koor (lebih besar + kayu lebih kaya)
            d.rectangle([6, 56, 129, 64], fill=(198, 148, 92))
            d.rectangle([6, 56, 129, 57], fill=WOOD_E)
            d.rectangle([6, 64, 129, 84], fill=(160, 112, 66))
            d.rectangle([12, 84, 18, 88], fill=WOOD_E)
            d.rectangle([117, 84, 123, 88], fill=WOOD_E)
            # 2 monitor
            for ox in (16, 81):
                d.rectangle([ox, 26, ox + 37, 56], fill=LAP)
                d.rectangle([ox + 2, 28, ox + 35, 54], fill=SCR)
                d.rectangle([ox + 11, 56, ox + 25, 59], fill=LAP)
            # garis glow monitor (beda per frame)
            if fr == 0:
                for oy in (33, 38):
                    d.rectangle([20, oy, 46, oy + 1], fill=GLOW)
                    d.rectangle([85, oy, 111, oy + 1], fill=GLOW)
            else:
                for oy in (31, 36, 41):
                    d.rectangle([20, oy, 44, oy + 1], fill=GLOW)
                    d.rectangle([85, oy, 113, oy + 1], fill=GLOW)
            # mug di tengah, di antara tangan (di depan orang, bukan di layar)
            d.rectangle([64, 48, 71, 56], fill=MUG)
            d.rectangle([71, 50, 73, 53], fill=MUG)
            # bendera kecil di meja (segitiga bersih)
            d.rectangle([122, 30, 123, 56], fill=(200, 180, 140))
            d.polygon([(123, 30), (134, 37), (123, 44)], fill=(240, 138, 60))
        else:
            # kursi (lebih lebar biar jelas keliatan duduk)
            d.rectangle([26, 16, 69, 48], fill=CHAIR)
            d.rectangle([26, 16, 69, 19], fill=CHAIR_D)
            d.rectangle([26, 30, 31, 48], fill=CHAIR_D)
            d.rectangle([64, 30, 69, 48], fill=CHAIR_D)
            # kepala + badan + tangan (skip kalau lagi ngelapor)
            if not empty:
                d.rectangle([37, 6 + dy, 58, 14 + dy], fill=HAIR)
                d.rectangle([39, 14 + dy, 56, 27 + dy], fill=SKIN)
                d.rectangle([52, 14 + dy, 56, 27 + dy], fill=SKIN_D)
                if gender == "f":  # rambut panjang — poni nutupin sisi kepala
                    d.rectangle([37, 14 + dy, 41, 30 + dy], fill=HAIR)
                    d.rectangle([54, 14 + dy, 58, 30 + dy], fill=HAIR)
                d.rectangle([43, 20 + dy, 44, 21 + dy], fill=DARK)
                d.rectangle([51, 20 + dy, 52, 21 + dy], fill=DARK)
                d.rectangle([46, 24 + dy, 49, 24 + dy], fill=SKIN_D)
                # leher
                d.rectangle([45, 27 + dy, 50, 31 + dy], fill=SKIN_D)
                d.rectangle([33, 31, 62, 48], fill=shirt)
                d.rectangle([33, 31, 62, 33], fill=shade(shirt, 0.85))
                d.rectangle([33, 33, 39, 48], fill=shade(shirt))
                d.rectangle([56, 33, 62, 48], fill=shade(shirt))
                # tangan (typing)
                hx = fr * 2
                hy = fr
                d.rectangle([36 + hx, 44 + hy, 42 + hx, 48 + hy], fill=shade(shirt))
                d.rectangle([36 + hx, 46 + hy, 42 + hx, 48 + hy], fill=SKIN)
            # meja
            d.rectangle([6, 48, 89, 55], fill=WOOD_T)
            d.rectangle([6, 48, 89, 49], fill=WOOD_E)
            d.rectangle([6, 55, 89, 69], fill=WOOD_D)
            d.rectangle([10, 69, 15, 72], fill=WOOD_E)
            d.rectangle([80, 69, 85, 72], fill=WOOD_E)
            # laptop kanan
            d.rectangle([59, 44, 86, 48], fill=LAP)
            d.rectangle([61, 27, 84, 44], fill=LAP)
            d.rectangle([63, 29, 82, 42], fill=SCR)
            if fr == 0:
                d.rectangle([65, 33, 79, 34], fill=GLOW)
                d.rectangle([65, 37, 75, 38], fill=GLOW)
            else:
                d.rectangle([65, 31, 77, 32], fill=GLOW)
                d.rectangle([65, 35, 79, 36], fill=GLOW)
                d.rectangle([65, 39, 73, 40], fill=GLOW)
            # prop meja kiri (biar gak seragam)
            if prop == "plant":
                d.rectangle([14, 43, 21, 48], fill=(192, 57, 43))
                d.rectangle([15, 37, 20, 43], fill=(90, 170, 90))
                d.rectangle([13, 39, 22, 43], fill=(61, 160, 120))
            elif prop == "mug":
                d.rectangle([14, 42, 21, 48], fill=MUG)
                d.rectangle([21, 44, 23, 46], fill=MUG)
        frames.append(im)
    return frames


def room(width=760, height=470):
    """Latar pixel art bergaya poster Tanabata To Algorithm: dinding ungu
    gelap + glow magenta, awan gelap di tepi, splash oranye + lingkaran
    merah berisi 七夕, dan tulisan TANABATA TO ALGORITHM (font pixel 5x7)."""
    from math import hypot, cos, sin, pi

    HORIZON = 252
    im = Image.new("RGBA", (width, height))
    px = im.load()
    cx, cy = 380, 96
    EDGE = (34, 19, 66)      # ungu gelap (ujung poster)
    MID = (76, 38, 122)      # ungu terang (tengah)
    GLOW = (178, 74, 168)    # glow magenta di belakang logo

    # --- gradient radial dinding ---
    for x in range(width):
        for y in range(HORIZON):
            t = min(1.0, hypot((x - cx) / 470.0, (y - cy) / 340.0))
            r = EDGE[0] + (MID[0] - EDGE[0]) * (1 - t)
            g = EDGE[1] + (MID[1] - EDGE[1]) * (1 - t)
            b = EDGE[2] + (MID[2] - EDGE[2]) * (1 - t)
            k = max(0.0, 1.0 - hypot(x - cx, y - cy) / 230.0) * 0.55
            if k:
                r += (GLOW[0] - r) * k
                g += (GLOW[1] - g) * k
                b += (GLOW[2] - b) * k
            px[x, y] = (int(r), int(g), int(b), 255)

    d = ImageDraw.Draw(im)

    # --- awan gelap nge-frame kiri, kanan, dan bawah dinding ---
    CLOUD = (44, 24, 84)
    CLOUD_D = (27, 15, 56)
    for e in [(-45, 5, 62, 92, CLOUD), (-40, 80, 44, 180, CLOUD_D),
              (-52, 155, 56, 258, CLOUD),
              (702, -22, 806, 68, CLOUD), (712, 45, 802, 148, CLOUD_D),
              (700, 125, 812, 245, CLOUD),
              (35, 214, 155, 260, CLOUD_D), (185, 226, 305, 262, CLOUD_D),
              (330, 212, 455, 258, CLOUD_D), (485, 224, 612, 262, CLOUD_D),
              (635, 210, 762, 258, CLOUD_D)]:
        d.ellipse(e[:4], fill=e[4])

    # baseboard
    d.rectangle([0, HORIZON - 8, width, HORIZON], fill=(58, 36, 104))

    # --- lantai kayu (senada sama oranye di poster) ---
    d.rectangle([0, HORIZON, width, height], fill=(211, 162, 104))
    for y in range(HORIZON, height, 26):
        d.line([(0, y), (width, y)], fill=(196, 144, 92))
    for i2, y in enumerate(range(HORIZON + 26, height, 52)):
        for x in range((i2 % 3) * 70, width, 175):
            d.line([(x, y - 26), (x, y)], fill=(191, 138, 85))

    # --- starburst + petir kuning (kiri atas, ala poster) ---
    sx, sy = 212, 70
    pts = []
    for n in range(20):
        ang = pi * n / 10 - pi / 2
        rad = 34 if n % 2 == 0 else 15
        pts.append((sx + cos(ang) * rad, sy + sin(ang) * rad))
    d.polygon(pts, fill=(240, 148, 60))
    pts = []
    for n in range(10):
        ang = pi * n / 5 - pi / 2
        rad = 15 if n % 2 == 0 else 6
        pts.append((sx + cos(ang) * rad, sy + sin(ang) * rad))
    d.polygon(pts, fill=(245, 212, 66))
    for dx, dy, ln in [(-1.0, -0.5, 76), (1.0, -0.55, 70),
                       (-1.0, 0.32, 64), (0.9, 0.5, 46)]:
        d.line([(sx + dx * 30, sy + dy * 30),
                (sx + dx * (30 + ln), sy + dy * (30 + ln))],
               fill=(245, 212, 66), width=3)

    # --- bunting festival ---
    d.line([(30, 24), (width - 30, 24)], fill=(150, 128, 176))
    bcols = [(240, 138, 60), (245, 212, 66), (192, 57, 43), (61, 220, 151)]
    for i2, x in enumerate(range(40, width - 60, 44)):
        d.polygon([(x, 24), (x + 22, 24), (x + 11, 44)], fill=bcols[i2 % 4])

    # --- jendela malam festival (kiri) ---
    d.rectangle([55, 120, 175, 210], fill=(122, 90, 58))
    d.rectangle([62, 127, 168, 203], fill=(36, 18, 74))
    for sx, sy in [(75, 140), (98, 168), (140, 138), (155, 185), (85, 190)]:
        d.rectangle([sx, sy, sx + 2, sy + 2], fill=(245, 212, 66))
    d.ellipse([128, 143, 146, 161], fill=(245, 212, 66))
    d.ellipse([136, 139, 154, 157], fill=(36, 18, 74))
    d.line([(62, 165), (168, 165)], fill=(122, 90, 58))
    d.line([(115, 127), (115, 203)], fill=(122, 90, 58))

    # --- splash oranye + lingkaran merah + 七夕 (pusat poster) ---
    d.ellipse([296, 72, 464, 140], fill=(224, 145, 79))
    d.ellipse([314, 54, 448, 112], fill=(224, 145, 79))
    d.ellipse([306, 124, 456, 158], fill=(201, 111, 53))
    d.ellipse([332, 48, 428, 144], fill=(194, 51, 43))
    kanji_path = os.path.join(ROOT, "assets", "kanji-nataba.png")
    if os.path.exists(kanji_path):
        k = Image.open(kanji_path).convert("RGBA")
        kw, kh = 92, 47
        # pixelate 2x biar nyatu sama pixel art
        k = k.resize((kw // 2, kh // 2), Image.NEAREST).resize((kw, kh), Image.NEAREST)
        mask = Image.new("L", (kw, kh), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, kw - 1, kh - 1], fill=255)
        im.paste(k, (cx - kw // 2, cy - kh // 2), mask)

    # --- tulisan TANABATA TO ALGORITHM ---
    title = "TANABATA TO ALGORITHM"
    tw = text_width(title, 2)
    draw_text(d, title, cx - tw // 2, 156, 2, (255, 255, 255),
              shadow=(2, 2, (54, 24, 58)))

    # --- jejak sirkuit PCB kiri/kanan lingkaran ---
    trace = (236, 232, 252)
    for x0, x1, stub in [(262, 326, 1), (434, 508, -1)]:
        d.line([(x0, 96), (x1, 96)], fill=trace, width=2)
        for nx in (x0 + 6, x1 - 20):
            d.ellipse([nx - 3, 93, nx + 3, 99], fill=trace)
        d.line([(x1 - 20, 96), (x1 - 20, 96 + stub * 16)], fill=trace, width=2)
        d.line([(x1 - 20, 96 + stub * 16), (x1 - 6, 96 + stub * 16)],
               fill=trace, width=2)

    # --- sparkle ---
    for pxs, pys, col in [(262, 40, (245, 212, 66)), (472, 48, (255, 255, 255)),
                          (300, 192, (255, 255, 255)), (494, 186, (245, 212, 66)),
                          (196, 138, (255, 255, 255))]:
        d.rectangle([pxs - 5, pys - 1, pxs + 5, pys + 1], fill=col)
        d.rectangle([pxs - 1, pys - 5, pxs + 1, pys + 5], fill=col)

    # --- lampu dinding (glow) dipindah ke kanan atas ---
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle([596, 30, 620, 44], fill=(245, 212, 66, 255))
    for i2, r in enumerate(range(14, 76, 14)):
        gd.rectangle([608 - r, 37 - r, 608 + r, 37 + r],
                     fill=(245, 212, 66, max(6, 24 - i2 * 4)))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(10))
    im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im)

    # --- rak buku kanan ---
    d.rectangle([530, 60, 670, 170], fill=(165, 118, 74))
    book_cols = [(192, 57, 43), (66, 110, 176), (61, 160, 120), (240, 138, 60),
                 (130, 80, 160), (245, 212, 66), (200, 80, 120)]
    bi = 0
    for shelf_y in (68, 113):
        d.rectangle([536, shelf_y + 30, 664, shelf_y + 34], fill=(140, 98, 58))
        x = 540
        while x < 658:
            w = 9 + (bi * 5) % 8
            h = 24 + (bi * 7) % 8
            d.rectangle([x, shelf_y + 30 - h, x + w - 2, shelf_y + 30],
                        fill=book_cols[bi % len(book_cols)])
            x += w
            bi += 1

    # --- pintu kanan ---
    d.rectangle([685, 90, 745, HORIZON], fill=(181, 133, 82))
    d.rectangle([693, 98, 737, 240], fill=(168, 120, 72))
    d.rectangle([730, 165, 735, 171], fill=(60, 66, 88))

    # --- pot tanaman kiri & kanan di lantai ---
    for pxp, pyp in [(10, 392), (706, 404)]:
        d.rectangle([pxp + 6, pyp, pxp + 30, pyp + 14], fill=(90, 170, 90))
        d.rectangle([pxp + 2, pyp + 12, pxp + 34, pyp + 34], fill=(192, 57, 43))
        d.rectangle([pxp, pyp + 32, pxp + 36, pyp + 37], fill=(160, 45, 35))
        d.rectangle([pxp + 12, pyp + 4, pxp + 16, pyp + 16], fill=(61, 160, 120))
    return im


def walker(shirt, gender="m"):
    """[frame_a, frame_b]: karakter berdiri lagi jalan (2 frame selang-seling)
    — dipake buat animasi ngelapor ke meja koordinator."""
    W, H = 30, 44
    PANTS = (54, 60, 96)
    PANTS_D = (44, 49, 80)
    SHOE = (38, 30, 52)
    frames = []
    for fr in range(2):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        dy = fr  # bob naik-turun
        # kaki (selang-seling)
        if fr == 0:
            d.rectangle([8, 32, 13, 41], fill=PANTS)
            d.rectangle([7, 41, 14, 44], fill=SHOE)
            d.rectangle([17, 32, 22, 39], fill=PANTS_D)
            d.rectangle([16, 39, 23, 42], fill=SHOE)
        else:
            d.rectangle([8, 32, 13, 39], fill=PANTS_D)
            d.rectangle([7, 39, 14, 42], fill=SHOE)
            d.rectangle([17, 32, 22, 41], fill=PANTS)
            d.rectangle([16, 41, 23, 44], fill=SHOE)
        # badan
        d.rectangle([7, 19, 23, 33], fill=shirt)
        d.rectangle([7, 19, 23, 21], fill=shade(shirt, 0.85))
        d.rectangle([7, 21, 12, 33], fill=shade(shirt))
        d.rectangle([18, 21, 23, 33], fill=shade(shirt))
        # lengan (ayun)
        if fr == 0:
            d.rectangle([4, 20, 7, 29], fill=shade(shirt))
            d.rectangle([4, 27, 7, 30], fill=SKIN)
            d.rectangle([23, 20, 26, 31], fill=shade(shirt))
            d.rectangle([23, 29, 26, 32], fill=SKIN)
        else:
            d.rectangle([4, 20, 7, 31], fill=shade(shirt))
            d.rectangle([4, 29, 7, 32], fill=SKIN)
            d.rectangle([23, 20, 26, 29], fill=shade(shirt))
            d.rectangle([23, 27, 26, 30], fill=SKIN)
        # leher + kepala
        d.rectangle([13, 17 + dy, 17, 21 + dy], fill=SKIN_D)
        d.rectangle([9, 0 + dy, 22, 7 + dy], fill=HAIR)
        d.rectangle([10, 7 + dy, 21, 17 + dy], fill=SKIN)
        d.rectangle([18, 7 + dy, 21, 17 + dy], fill=SKIN_D)
        if gender == "f":  # rambut panjang — poni samping nutupin sisi wajah
            d.rectangle([9, 7 + dy, 12, 17 + dy], fill=HAIR)
            d.rectangle([19, 7 + dy, 22, 17 + dy], fill=HAIR)
        d.rectangle([13, 10 + dy, 14, 11 + dy], fill=DARK)
        d.rectangle([17, 10 + dy, 18, 11 + dy], fill=DARK)
        d.rectangle([14, 14 + dy, 17, 15 + dy], fill=SKIN_D)
        frames.append(im)
    return frames


def main():
    os.makedirs(OUT, exist_ok=True)
    team = json.load(open(os.path.join(ROOT, "data", "team.json")))
    room().save(os.path.join(OUT, "room.png"))
    print("room.png ok")
    colors = {
        "andrian": (224, 90, 43),    # koor — oranye
        "jiya": (224, 89, 143),      # pink
        "aurora": (155, 107, 217),   # ungu
        "akmal": (74, 144, 217),     # biru
        "nova": (240, 138, 60),      # oranye terang
        "indah": (61, 220, 151),     # hijau
        "ansuy": (245, 212, 66),     # kuning
        "silvi": (61, 160, 120),     # teal
        "candra": (192, 57, 43),     # merah
        "mala": (200, 80, 120),      # merah muda
        "saviq": (66, 110, 176),     # biru baja
    }
    props = ["mug", "plant", "none", "mug", "plant", "mug", "none"]
    for i, p in enumerate(team["people"]):
        shirt = colors.get(p["slug"], (74, 144, 217))
        koor = p.get("koor", False)
        gender = p.get("gender", "m")
        prop = props[i % len(props)] if not koor else "mug"
        a, b = workstation(shirt, koor=koor, prop=prop, gender=gender)
        a.save(os.path.join(OUT, f"ws-{p['slug']}-a.png"))
        b.save(os.path.join(OUT, f"ws-{p['slug']}-b.png"))
        print(f"ws-{p['slug']}-*.png ok")
        if not koor:
            # varian meja kosong (orangnya lagi ngelapor ke koor)
            ea, eb = workstation(shirt, prop=prop, empty=True, gender=gender)
            ea.save(os.path.join(OUT, f"ws-{p['slug']}-desk-a.png"))
            eb.save(os.path.join(OUT, f"ws-{p['slug']}-desk-b.png"))
            # sprite jalan
            wa, wb = walker(shirt, gender=gender)
            wa.save(os.path.join(OUT, f"walk-{p['slug']}-a.png"))
            wb.save(os.path.join(OUT, f"walk-{p['slug']}-b.png"))
            print(f"desk+walk-{p['slug']}-*.png ok")


if __name__ == "__main__":
    main()