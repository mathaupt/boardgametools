#!/usr/bin/env python3
"""Generate board-game themed iOS app and list icons."""

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).parent.parent / "BoardGameTools" / "BoardGameTools" / "Assets.xcassets"


def save_json(path: Path, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def hex_color(value: str) -> tuple:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def linear_gradient(size: tuple, top: str, bottom: str) -> Image.Image:
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    t = hex_color(top)
    b = hex_color(bottom)
    width, height = size
    for y in range(height):
        ratio = y / height
        r = int(t[0] * (1 - ratio) + b[0] * ratio)
        g = int(t[1] * (1 - ratio) + b[1] * ratio)
        bl = int(t[2] * (1 - ratio) + b[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, bl))
    return img


def draw_meeple(draw: ImageDraw.Draw, cx: int, cy: int, size: int, fill) -> None:
    """Draw a simple classic meeple silhouette."""
    head_r = int(size * 0.22)
    body_w = int(size * 0.35)
    body_h = int(size * 0.60)
    top = cy - int(size * 0.15)
    bottom = cy + body_h // 2
    left = cx - body_w
    right = cx + body_w
    points = [
        (cx, top),
        (right, top + body_h // 3),
        (right - body_w // 3, bottom),
        (left + body_w // 3, bottom),
        (left, top + body_h // 3),
    ]
    draw.polygon(points, fill=fill)
    draw.ellipse([cx - head_r, top - head_r, cx + head_r, top + head_r], fill=fill)


def draw_die(draw: ImageDraw.Draw, cx: int, cy: int, size: int, fill, dot_color) -> None:
    """Draw a simple six-sided die with five dots."""
    half = size // 2
    r = size // 8
    draw.rounded_rectangle(
        [cx - half, cy - half, cx + half, cy + half],
        radius=r,
        fill=fill,
    )
    dot_r = max(3, size // 12)
    positions = [
        (cx - half // 2, cy - half // 2),
        (cx + half // 2, cy - half // 2),
        (cx, cy),
        (cx - half // 2, cy + half // 2),
        (cx + half // 2, cy + half // 2),
    ]
    for x, y in positions:
        draw.ellipse([x - dot_r, y - dot_r, x + dot_r, y + dot_r], fill=dot_color)


def draw_cards(draw: ImageDraw.Draw, cx: int, cy: int, size: int, fill, outline) -> None:
    """Draw two overlapping playing cards."""
    w = size // 2
    h = int(size * 0.75)
    r = size // 12
    gap = size // 5
    angle = 18
    # Card 1 (back, rotated -angle)
    rect1 = _rotated_rect(cx - gap, cy, w, h, -angle)
    draw.polygon(rect1, fill=fill, outline=outline)
    # Card 2 (front, rotated +angle)
    rect2 = _rotated_rect(cx + gap, cy, w, h, angle)
    draw.polygon(rect2, fill=fill, outline=outline)


def _rotated_rect(cx, cy, w, h, angle_deg):
    angle = math.radians(angle_deg)
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    hw, hh = w / 2, h / 2
    corners = [(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)]
    rotated = []
    for x, y in corners:
        rx = x * cos_a - y * sin_a + cx
        ry = x * sin_a + y * cos_a + cy
        rotated.append((rx, ry))
    return rotated


def _add_shadow(target: Image.Image, shape_fn, offset=(0, 0), blur=12) -> Image.Image:
    """Composite a drop shadow under a shape drawn by shape_fn."""
    shadow = Image.new("RGBA", target.size, (0, 0, 0, 0))
    shadow_fn = ImageDraw.Draw(shadow)
    shape_fn(shadow_fn)
    blurred = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    return Image.alpha_composite(blurred, target)


def _draw_board(draw: ImageDraw.Draw, size: int) -> None:
    """Draw a subtle board-game grid surface."""
    margin = size // 5
    radius = size // 16
    board_color = (45, 25, 78, 160)
    grid_color = (255, 255, 255, 40)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=board_color,
    )
    cells = 6
    step = (size - 2 * margin) // cells
    for i in range(1, cells):
        x = margin + i * step
        draw.line([(x, margin + radius), (x, size - margin - radius)], fill=grid_color, width=2)
    for i in range(1, cells):
        y = margin + i * step
        draw.line([(margin + radius, y), (size - margin - radius, y)], fill=grid_color, width=2)


def _drop_shadow(shape_fn, img: Image.Image, offset=(10, 12), blur=18, shadow_color=(30, 15, 60, 90)) -> Image.Image:
    """Return img with a drop shadow under shape_fn."""
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    shape_fn(sd, offset)
    blurred = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    return Image.alpha_composite(blurred, img)


def generate_app_icon(path: Path) -> None:
    size = 1024
    img = linear_gradient((size, size), "#FF7A2F", "#FF4E8C").convert("RGBA")
    draw = ImageDraw.Draw(img)

    white = "#FFFFFF"
    dark = "#2D1B4E"
    accent = "#00D9C0"
    shadow = (30, 15, 60, 90)

    # Subtle board-game grid in the background
    _draw_board(draw, size)

    # Meeple (left, teal accent)
    meeple_size = size // 4
    mx, my = size * 3 // 7, size * 5 // 9
    def meeple_shape(d, off=(0, 0)):
        draw_meeple(d, mx + off[0], my + off[1], meeple_size, accent)
    img = _drop_shadow(meeple_shape, img)
    draw = ImageDraw.Draw(img)
    draw_meeple(draw, mx, my, meeple_size, accent)

    # Die (top-right)
    die_size = size // 6
    dx, dy = size * 5 // 9, size * 3 // 7
    def die_shape(d, off=(0, 0)):
        draw_die(d, dx + off[0], dy + off[1], die_size, white, dark)
    img = _drop_shadow(die_shape, img, offset=(12, 14))
    draw = ImageDraw.Draw(img)
    draw_die(draw, dx, dy, die_size, white, dark)

    # Cards (bottom-right)
    cards_size = size // 5
    cx, cy = size * 6 // 10, size * 6 // 10
    def cards_shape(d, off=(0, 0)):
        draw_cards(d, cx + off[0], cy + off[1], cards_size, white, dark)
    img = _drop_shadow(cards_shape, img, offset=(12, 14))
    draw = ImageDraw.Draw(img)
    draw_cards(draw, cx, cy, cards_size, white, dark)

    img.save(path, "PNG")


def generate_list_icon(path: Path, theme: str) -> None:
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    white = "#FFFFFF"
    dark = "#2D1B4E"
    shadow = (40, 20, 70, 80)

    if theme == "event":
        # Calendar page
        margin = size // 8
        r = size // 12
        # Shadow calendar
        shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow_layer)
        sd.rounded_rectangle(
            [margin + 8, margin + 10, size - margin + 8, size - margin + 10],
            radius=r,
            fill=shadow,
        )
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=12))
        img = Image.alpha_composite(shadow_layer, img)
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle(
            [margin, margin, size - margin, size - margin],
            radius=r,
            fill=white,
            outline=dark,
            width=size // 24,
        )
        # Calendar rings
        ring_w = size // 6
        ring_h = size // 12
        for x in [size * 0.28, size * 0.72]:
            draw.rounded_rectangle(
                [x - ring_w // 2, margin - ring_h, x + ring_w // 2, margin + ring_h],
                radius=ring_h,
                fill=white,
                outline=dark,
                width=size // 48,
            )
        # Small meeple inside
        draw_meeple(draw, size // 2, size * 5 // 8, size // 4, dark)
    else:
        # Session: die + cards
        die_size = size // 4
        dx, dy = size * 3 // 8, size * 5 // 9
        shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow_layer)
        draw_die(sd, dx + 6, dy + 8, die_size, shadow, shadow)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=10))
        img = Image.alpha_composite(shadow_layer, img)
        draw = ImageDraw.Draw(img)
        draw_die(draw, dx, dy, die_size, white, dark)

        cards_size = size // 4
        cx, cy = size * 5 // 8, size * 4 // 9
        shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow_layer)
        draw_cards(sd, cx + 6, cy + 8, cards_size, shadow, shadow)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=10))
        img = Image.alpha_composite(shadow_layer, img)
        draw = ImageDraw.Draw(img)
        draw_cards(draw, cx, cy, cards_size, white, dark)

    img.save(path, "PNG")


def app_icon_entries():
    # iOS app icon sizes: points and scales -> pixel size
    entries = []
    # iPhone
    for size in [20, 29, 40, 60]:
        for scale in [2, 3]:
            px = int(size * scale)
            entries.append({"size": f"{size}x{size}", "idiom": "iphone", "scale": f"{scale}x", "px": px})
    # iPad
    for size in [20, 29, 40, 76]:
        for scale in [1, 2]:
            px = int(size * scale)
            entries.append({"size": f"{size}x{size}", "idiom": "ipad", "scale": f"{scale}x", "px": px})
    # iPad 83.5pt @2x
    entries.append({"size": "83.5x83.5", "idiom": "ipad", "scale": "2x", "px": 167})
    # Marketing
    entries.append({"size": "1024x1024", "idiom": "ios-marketing", "scale": "1x", "px": 1024})
    return entries


def generate_app_icon_set(appicon_dir: Path, source_icon: Path) -> None:
    entries = app_icon_entries()
    images = []
    master = Image.open(source_icon).convert("RGBA")
    for entry in entries:
        px = entry["px"]
        filename = f"AppIcon-{entry['size'].replace('.', '_')}@{entry['scale']}.png"
        resized = master.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(appicon_dir / filename, "PNG")
        images.append({
            "size": entry["size"],
            "idiom": entry["idiom"],
            "scale": entry["scale"],
            "filename": filename,
        })
    save_json(appicon_dir / "Contents.json", {"images": images, "info": {"author": "xcode", "version": 1}})


def create_image_set(name: str, filename: str) -> None:
    folder = ASSETS / f"{name}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    save_json(
        folder / "Contents.json",
        {
            "images": [
                {"idiom": "universal", "scale": "1x", "filename": filename},
                {"idiom": "universal", "scale": "2x", "filename": filename},
                {"idiom": "universal", "scale": "3x", "filename": filename},
            ],
            "info": {"author": "xcode", "version": 1},
        },
    )


def main() -> None:
    # App icon
    appicon_dir = ASSETS / "AppIcon.appiconset"
    appicon_dir.mkdir(parents=True, exist_ok=True)
    tmp_master = appicon_dir / "AppIcon-1024.png"
    generate_app_icon(tmp_master)
    generate_app_icon_set(appicon_dir, tmp_master)
    tmp_master.unlink()

    # List icons
    create_image_set("EventIcon", "EventIcon.png")
    generate_list_icon(ASSETS / "EventIcon.imageset" / "EventIcon.png", "event")

    create_image_set("SessionIcon", "SessionIcon.png")
    generate_list_icon(ASSETS / "SessionIcon.imageset" / "SessionIcon.png", "session")

    print("Generated iOS icons:")
    print(appicon_dir)
    print(ASSETS / "EventIcon.imageset" / "EventIcon.png")
    print(ASSETS / "SessionIcon.imageset" / "SessionIcon.png")


if __name__ == "__main__":
    main()
