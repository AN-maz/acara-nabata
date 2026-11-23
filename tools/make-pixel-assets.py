#!/usr/bin/env python3
"""Generate aset pixel art buat scene kantor Acara Nataba.

Jalan: python3 tools/make-pixel-assets.py
Output: assets/pixel/room.png + assets/pixel/ws-<slug>-{a,b}.png (2 frame animasi)
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


def workstation(shirt, koor=False, prop="mug"):
    """Return [frame_a, frame_b] (RGBA). prop: mug | plant | none"""
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
            # kepala
            d.rectangle([37, 6 + dy, 58, 14 + dy], fill=HAIR)
            d.rectangle([39, 14 + dy, 56, 27 + dy], fill=SKIN)
            d.rectangle([52, 14 + dy, 56, 27 + dy], fill=SKIN_D)
            d.rectangle([43, 20 + dy, 44, 21 + dy], fill=DARK)
            d.rectangle([51, 20 + dy, 52, 21 + dy], fill=DARK)
            d.rectangle([46, 24 + dy, 49, 24 + dy], fill=SKIN_D)
            # badan
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
    im = Image.new("RGBA", (width, height), (21, 10, 43, 255))
    d = ImageDraw.Draw(im)
    HORIZON = 252

    # dinding
    d.rectangle([0, 0, width, HORIZON], fill=(236, 227, 208))
    for x in range(0, width, 95):
        d.line([(x, 0), (x, HORIZON)], fill=(224, 214, 191))
    # baseboard
    d.rectangle([0, HORIZON - 10, width, HORIZON], fill=(201, 184, 150))

    # lantai kayu
    d.rectangle([0, HORIZON, width, height], fill=(211, 162, 104))
    for y in range(HORIZON, height, 26):
        d.line([(0, y), (width, y)], fill=(196, 144, 92))
    for i, y in enumerate(range(HORIZON + 26, height, 52)):
        for x in range((i % 3) * 70, width, 175):
            d.line([(x, y - 26), (x, y)], fill=(191, 138, 85))

    # jendela (malam festival)
    d.rectangle([90, 45, 255, 155], fill=(122, 90, 58))
    d.rectangle([97, 52, 248, 148], fill=(42, 21, 80))
    for sx, sy in [(115, 70), (150, 100), (190, 65), (230, 95), (135, 130), (215, 130)]:
        d.rectangle([sx, sy, sx + 2, sy + 2], fill=(245, 212, 66))
    # bulan sabit beneran
    d.ellipse([203, 63, 221, 81], fill=(245, 212, 66))
    d.ellipse([211, 59, 229, 77], fill=(42, 21, 80))
    d.line([(97, 100), (248, 100)], fill=(122, 90, 58))
    d.line([(172, 52), (172, 148)], fill=(122, 90, 58))

    # bunting festival
    d.line([(30, 24), (width - 30, 24)], fill=(140, 120, 160))
    cols = [(240, 138, 60), (245, 212, 66), (192, 57, 43), (61, 220, 151)]
    for i, x in enumerate(range(40, width - 60, 44)):
        c = cols[i % len(cols)]
        d.polygon([(x, 24), (x + 22, 24), (x + 11, 44)], fill=c)

    # rak buku kanan
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
            d.rectangle([x, shelf_y + 30 - h, x + w - 2, shelf_y + 30], fill=book_cols[bi % len(book_cols)])
            x += w
            bi += 1

    # pintu kanan
    d.rectangle([685, 90, 745, HORIZON], fill=(181, 133, 82))
    d.rectangle([693, 98, 737, 240], fill=(168, 120, 72))
    d.rectangle([730, 165, 735, 171], fill=(60, 66, 88))

    # lukisan kecil
    d.rectangle([300, 70, 345, 105], fill=(122, 90, 58))
    d.rectangle([304, 74, 341, 101], fill=(240, 138, 60))
    d.rectangle([304, 90, 341, 101], fill=(192, 57, 43))
    d.rectangle([304, 74, 341, 84], fill=(245, 212, 66))

    # lampu dinding (glow)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle([352, 30, 376, 44], fill=(245, 212, 66, 255))
    for i, r in enumerate(range(14, 90, 14)):
        gd.rectangle([364 - r, 37 - r, 364 + r, 37 + r],
                     fill=(245, 212, 66, max(6, 26 - i * 4)))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(10))
    im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im)

    # pot tanaman kiri & kanan (di pinggir biar gak ketutup workstation)
    for px, py in [(10, 392), (706, 404)]:
        d.rectangle([px + 6, py, px + 30, py + 14], fill=(90, 170, 90))
        d.rectangle([px + 2, py + 12, px + 34, py + 34], fill=(192, 57, 43))
        d.rectangle([px, py + 32, px + 36, py + 37], fill=(160, 45, 35))
        d.rectangle([px + 12, py + 4, px + 16, py + 16], fill=(61, 160, 120))
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    team = json.load(open(os.path.join(ROOT, "data", "team.json")))
    room().save(os.path.join(OUT, "room.png"))
    print("room.png ok")
    colors = {
        "andrian": (224, 90, 43),
        "bagas": (74, 144, 217),
        "rara": (240, 138, 60),
        "yoga": (61, 220, 151),
        "nadia": (224, 89, 143),
        "salsa": (155, 107, 217),
        "dimas": (245, 212, 66),
    }
    props = ["mug", "plant", "none", "mug", "plant", "mug", "none"]
    for i, p in enumerate(team["people"]):
        shirt = colors.get(p["slug"], (74, 144, 217))
        a, b = workstation(shirt, koor=p.get("koor", False),
                          prop=props[i % len(props)] if not p.get("koor") else "mug")
        a.save(os.path.join(OUT, f"ws-{p['slug']}-a.png"))
        b.save(os.path.join(OUT, f"ws-{p['slug']}-b.png"))
        print(f"ws-{p['slug']}-*.png ok")


if __name__ == "__main__":
    main()