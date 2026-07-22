"""Edit login-students.png: book fill, far-right girl gaze, left-center arm alignment."""
from PIL import Image, ImageDraw

SRC = r"src/assets/login-students.png"
OUT = SRC

# App background mint from styles.css (oklch 0.955 0.025 155)
BG = (245, 255, 251, 255)
STROKE = (59, 101, 81, 255)


def is_yellow(r: int, g: int, b: int) -> bool:
    return r > 200 and 145 < g < 235 and b < 205


def is_mint_bg(r: int, g: int, b: int) -> bool:
    return r > 228 and g > 240 and b > 235


def replace_book_fill(img: Image.Image) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 10 and is_yellow(r, g, b):
                px[x, y] = BG


def fix_far_right_gaze(img: Image.Image) -> None:
    """Turn far-right girl's head toward the center tablet."""
    draw = ImageDraw.Draw(img)
    px = img.load()

    # Erase gaze lines pointing at the center guy's face (upper-right of her head)
    for y in range(95, 215):
        for x in range(1010, 1125):
            r, g, b, a = px[x, y]
            if a > 10 and not is_mint_bg(r, g, b) and r < 130:
                px[x, y] = BG

    # Head outline stays; add left-facing eye + slight head tilt toward tablet
    # Eye looking left toward center screen
    draw.line((1048, 168, 1062, 168), fill=STROKE, width=3)
    draw.ellipse((1044, 163, 1052, 171), fill=STROKE)
    # Subtle brow / cheek line suggesting leftward gaze
    draw.line((1038, 152, 1058, 158), fill=STROKE, width=2)
    draw.line((1040, 182, 1055, 188), fill=STROKE, width=2)
    # Hair fringe angled toward center
    draw.line((1028, 128, 1055, 118), fill=STROKE, width=3)
    draw.line((1055, 118, 1078, 130), fill=STROKE, width=2)


def fix_left_center_arm(img: Image.Image) -> None:
    """Align left-of-center guy's sleeve with hoodie pocket line."""
    draw = ImageDraw.Draw(img)
    px = img.load()

    # Clear misaligned sleeve segment on his right arm (viewer's left side of torso)
    for y in range(300, 430):
        for x in range(300, 390):
            r, g, b, a = px[x, y]
            if a > 10 and not is_mint_bg(r, g, b) and r < 130 and 280 < y < 380 and 310 < x < 370:
                px[x, y] = BG

    # Hoodie pocket horizontal line (~y=355 in his region)
    pocket_y = 356
    draw.line((318, pocket_y, 382, pocket_y), fill=STROKE, width=3)
    # Sleeve aligned to same y as pocket opening
    draw.line((292, pocket_y, 318, pocket_y + 2), fill=STROKE, width=3)
    draw.line((292, pocket_y, 288, pocket_y + 28), fill=STROKE, width=3)
    draw.line((288, pocket_y + 28, 302, pocket_y + 52), fill=STROKE, width=3)
    # Cuff
    draw.line((302, pocket_y + 50, 318, pocket_y + 54), fill=STROKE, width=2)


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    replace_book_fill(img)
    fix_left_center_arm(img)
    fix_far_right_gaze(img)
    img.save(OUT, "PNG")
    print("Saved", OUT)


if __name__ == "__main__":
    main()
