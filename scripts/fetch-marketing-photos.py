"""Fetch the marketing photography shipped in apps/web/public/marketing/.

Unsplash was tried first and dropped: its search pages 401 against a script, and
its results mix free contributor photos with Getty premium ones that the Unsplash
License does not cover. Pexels serves the resized file straight off its CDN, and
the Pexels License grants commercial use without attribution — LICENSES.md credits
the photographers anyway.

Every file lands at exactly 1600x1067, so the components carry one pair of
intrinsic dimensions instead of one per photo. Output is committed: the build
never reaches the network.
"""

import pathlib
import subprocess
import sys

WIDTH, HEIGHT = 1600, 1067
QUALITY = 68

PHOTOS = {
    "hero-atelier": (18569750, "J E"),
    "hero-reseau": (5506032, "Mike van Schoonderwalt"),
    "kind-laser-cutter": (7254429, "Opt Lasers from Poland"),
    "kind-printer-3d": (24859620, "Jakub Zerdzicki"),
    "kind-cnc-mill": (8865187, "Daniel Smyth"),
    "kind-wood-lathe": (3716681, "Anton Belitskiy"),
    "kind-sewing": (6461151, "Pavel Danilyuk"),
    "kind-electronics-bench": (3912983, "ThisIsEngineering"),
}


def source_url(photo_id):
    return (
        f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg"
        f"?auto=compress&cs=tinysrgb&w={WIDTH}&h={HEIGHT}&fit=crop"
    )


def fetch(photo_id, destination):
    subprocess.run(
        ["curl", "--silent", "--show-error", "--location", "--fail", "--max-time", "60",
         "--output", str(destination), source_url(photo_id)],
        check=True,
    )


def to_webp(source, destination):
    subprocess.run(
        ["cwebp", "-quiet", "-q", str(QUALITY), str(source), "-o", str(destination)],
        check=True,
    )


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    out = root / "apps/web/public/marketing"
    out.mkdir(parents=True, exist_ok=True)

    scratch = out / ".scratch.jpg"
    try:
        for name, (photo_id, _) in PHOTOS.items():
            target = out / f"{name}.webp"
            fetch(photo_id, scratch)
            to_webp(scratch, target)
            print(f"{target.relative_to(root)} {target.stat().st_size // 1024} KiB")
    finally:
        scratch.unlink(missing_ok=True)


if __name__ == "__main__":
    if subprocess.run(["which", "cwebp"], capture_output=True).returncode != 0:
        sys.exit("cwebp is required: brew install webp")
    main()
