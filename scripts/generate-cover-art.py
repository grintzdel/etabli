#!/usr/bin/env python3
"""Draw the atelier cover art shipped in apps/web/public/ateliers/.

These plates are the fallback an atelier gets when it publishes no machine, and
so has no kind to photograph — fetch-marketing-photos.py covers the rest.
Deterministic: same input, same bytes, so a re-run never dirties the tree.
Palette is the one declared in globals.css.
"""

import pathlib
import struct
import zlib

WIDTH, HEIGHT = 1200, 800

GRAPHITE_950 = (0x0B, 0x0C, 0x0E)
GRAPHITE_900 = (0x13, 0x15, 0x18)
GRAPHITE_800 = (0x1C, 0x1F, 0x24)
GRAPHITE_700 = (0x2A, 0x2E, 0x35)
SIGNAL_500 = (0xFF, 0x6A, 0x00)


def blend(base, top, alpha):
    return tuple(round(b + (t - b) * alpha) for b, t in zip(base, top))


def write_png(path, pixels):
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in pixels)

    def chunk(tag, payload):
        body = tag + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body))

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def plate(variant):
    tilt = (0.45, -0.6, 0.8, -0.35)[variant]
    band_centre = (0.32, 0.64, 0.48, 0.74)[variant]
    disc_x = (0.74, 0.28, 0.6, 0.36)[variant]
    grid = (48, 60, 40, 72)[variant]

    rows = []
    for y in range(HEIGHT):
        ground = blend(GRAPHITE_950, GRAPHITE_900, y / HEIGHT)
        row = []
        for x in range(WIDTH):
            px = ground

            if x % (grid * 4) == 0 or y % (grid * 4) == 0:
                px = blend(px, GRAPHITE_700, 0.9)
            elif x % grid == 0 or y % grid == 0:
                px = blend(px, GRAPHITE_800, 1.0)

            offset = (x / WIDTH) + tilt * (y / HEIGHT)
            if abs(offset - band_centre) < 0.05:
                px = blend(px, SIGNAL_500, 0.13)
            elif abs(offset - band_centre) < 0.072:
                px = blend(px, SIGNAL_500, 0.05)

            dx, dy = x - disc_x * WIDTH, y - 0.55 * HEIGHT
            radius = (dx * dx + dy * dy) ** 0.5
            if 208 < radius < 214:
                px = blend(px, GRAPHITE_700, 0.9)
            elif 126 < radius < 130:
                px = blend(px, SIGNAL_500, 0.5)

            if HEIGHT - 96 < y < HEIGHT - 60 and (x // 36) % 3 == 0 and x > 72:
                px = blend(px, SIGNAL_500, 0.22)

            row.append(px)
        rows.append(row)
    return rows


def main():
    out = pathlib.Path(__file__).resolve().parent.parent / "apps/web/public/ateliers"
    out.mkdir(parents=True, exist_ok=True)

    for variant in range(4):
        target = out / f"cover-{variant + 1}.png"
        write_png(target, plate(variant))
        print(f"{target.relative_to(out.parents[3])} {target.stat().st_size // 1024} KiB")


if __name__ == "__main__":
    main()
