"""Generate Kalima's launcher foreground from the original website brand book.

Run from the repository root before assembling the Android app.
The actual image lives in dist/assets/brand-book.png, so Android and web
share the exact same brand; no hand-drawn approximation is used.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "dist" / "assets" / "brand-book.png"
DESTINATION = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable-nodpi" / "ic_kalima_logo_foreground.png"


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Kalima logo not found: {SOURCE}")

    with Image.open(SOURCE) as original:
        logo = original.convert("RGBA")

    # Remove any transparent margin in the website asset before resizing.
    alpha = logo.getchannel("A")
    visible = alpha.getbbox()
    if not visible:
        raise ValueError("Kalima logo is completely transparent")
    logo = logo.crop(visible)
    logo.thumbnail((332, 332), Image.Resampling.LANCZOS)

    foreground = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    x = (foreground.width - logo.width) // 2
    y = (foreground.height - logo.height) // 2
    foreground.alpha_composite(logo, (x, y))
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    foreground.save(DESTINATION, format="PNG", optimize=True)
    print(f"Prepared the official Kalima icon: {DESTINATION} ({logo.width}x{logo.height} logo)")


if __name__ == "__main__":
    main()
