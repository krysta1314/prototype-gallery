"""生成打卡 app 的 PWA 图标：深色圆角底 + 白色表盘。

用法: python3 scripts/punch-make-icons.py
产出: public/punch-icon-180.png / -192.png / -512.png
"""
import math
import struct
import zlib

BG = (23, 23, 23)
FG = (255, 255, 255)


def chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def render(size: int) -> bytes:
    cx = cy = (size - 1) / 2
    radius = size * 0.34          # 表盘外圈半径
    ring = max(1.0, size * 0.035)  # 圈的粗细
    corner = size * 0.22           # 底色圆角半径

    # 指针：时针指向 9 点，分针指向 12 点
    hands = [
        (math.pi, size * 0.22, size * 0.032),          # 9 点方向
        (-math.pi / 2, size * 0.26, size * 0.032),     # 12 点方向
    ]

    rows = bytearray()
    for y in range(size):
        rows.append(0)  # PNG 每行的 filter byte
        for x in range(size):
            # 圆角矩形外一律透明
            dx = max(corner - x, x - (size - 1 - corner), 0)
            dy = max(corner - y, y - (size - 1 - corner), 0)
            if math.hypot(dx, dy) > corner:
                rows.extend((0, 0, 0, 0))
                continue

            px, py = x - cx, y - cy
            dist = math.hypot(px, py)
            on = abs(dist - radius) <= ring / 2

            if not on:
                for angle, length, width in hands:
                    ax, ay = math.cos(angle), math.sin(angle)
                    t = px * ax + py * ay
                    if 0 <= t <= length and abs(px * -ay + py * ax) <= width / 2:
                        on = True
                        break

            rows.extend((*(FG if on else BG), 255))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(rows), 9))
        + chunk(b"IEND", b"")
    )


for s in (180, 192, 512):
    path = f"public/punch-icon-{s}.png"
    with open(path, "wb") as f:
        f.write(render(s))
    print("wrote", path)
