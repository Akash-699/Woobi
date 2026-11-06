import math
import random
import os
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

print("Generating Woobi 3D Studio - Herringbone Floor & White Shag Rug Textures...")

# -------------------------------------------------------------------------
# 1. HERRINGBONE EUROPEAN OAK PARQUET TEXTURE (1024 x 1024 Seamless)
# -------------------------------------------------------------------------
W, H = 1024, 1024
num_stripes = 8
stripe_w = W // num_stripes  # 128
step_y = 32
num_planks_y = H // step_y   # 32

img_floor = Image.new('RGB', (W, H), (198, 158, 108))
img_bump = Image.new('L', (W, H), 128)
draw_floor = ImageDraw.Draw(img_floor)
draw_bump = ImageDraw.Draw(img_bump)

# Rich European Honey Oak Palette (warm golden amber undertones)
oak_palettes = [
    (202, 160, 110), # Honey Oak Base
    (212, 170, 120), # Light Golden Oak
    (194, 152, 102), # Warm Caramel
    (218, 176, 126), # Amber Oak Highlight
    (188, 146,  96), # Deep Natural Oak
    (206, 164, 114), # Balanced European Oak
    (192, 150, 100), # Warm Taupe-Oak
    (215, 172, 122)  # Sunlight Oak
]

random.seed(101)

# First pass: Draw all plank polygons with seamless wrapping
for c in range(num_stripes):
    x0 = c * stripe_w
    x1 = (c + 1) * stripe_w
    is_even = (c % 2 == 0)
    
    # Range of k to ensure full vertical coverage and seamless wrap
    for k in range(-6, num_planks_y + 6):
        y0 = k * step_y
        y1 = y0 + stripe_w if is_even else y0 - stripe_w
        
        poly = [
            (x0, y0),
            (x1, y1),
            (x1, y1 + step_y),
            (x0, y0 + step_y)
        ]
        
        # Pick individual plank color with subtle random organic warmth
        base_col = random.choice(oak_palettes)
        r_jitter = random.randint(-5, 5)
        col = (
            max(0, min(255, base_col[0] + r_jitter)),
            max(0, min(255, base_col[1] + int(r_jitter * 0.95))),
            max(0, min(255, base_col[2] + int(r_jitter * 0.85)))
        )
        
        draw_floor.polygon(poly, fill=col)
        
        # Bump base height for this plank
        bump_val = 135 + random.randint(-4, 4)
        draw_bump.polygon(poly, fill=bump_val)

# Second pass: Add longitudinal wood grain fibers along each plank's 45-degree angle
grain_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
grain_draw = ImageDraw.Draw(grain_img)
bump_grain_img = Image.new('L', (W, H), 0)
bump_grain_draw = ImageDraw.Draw(bump_grain_img)

for c in range(num_stripes):
    x0 = c * stripe_w
    x1 = (c + 1) * stripe_w
    is_even = (c % 2 == 0)
    
    for k in range(-6, num_planks_y + 6):
        y0 = k * step_y
        
        # Draw 5-8 fine longitudinal grain lines along this plank
        num_fibers = random.randint(5, 8)
        for f in range(num_fibers):
            frac = (f + random.uniform(0.1, 0.9)) / (num_fibers + 1)
            sy = y0 + frac * step_y
            ey = sy + stripe_w if is_even else sy - stripe_w
            
            # Subtle dark espresso grain or light medullary ray
            is_dark = random.random() < 0.65
            if is_dark:
                alpha = random.randint(18, 38)
                color = (75, 48, 24, alpha)
                b_color = random.randint(10, 25) # depression
            else:
                alpha = random.randint(12, 28)
                color = (235, 205, 160, alpha)
                b_color = random.randint(230, 245) # peak
                
            line_w = 1 if random.random() < 0.75 else 2
            grain_draw.line([(x0, sy), (x1, ey)], fill=color, width=line_w)
            bump_grain_draw.line([(x0, sy), (x1, ey)], fill=b_color, width=line_w)

# Composite grain
img_floor.paste(grain_img, (0, 0), grain_img)

# Third pass: Crisp V-groove micro-seams between planks
seam_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
seam_draw = ImageDraw.Draw(seam_img)

for c in range(num_stripes):
    x0 = c * stripe_w
    x1 = (c + 1) * stripe_w
    is_even = (c % 2 == 0)
    
    # Vertical chevron spine seam
    seam_draw.line([(x0, 0), (x0, H)], fill=(55, 38, 22, 140), width=1)
    draw_bump.line([(x0, 0), (x0, H)], fill=45, width=2)
    
    for k in range(-6, num_planks_y + 6):
        y0 = k * step_y
        y1 = y0 + stripe_w if is_even else y0 - stripe_w
        # Plank boundary seam
        seam_draw.line([(x0, y0), (x1, y1)], fill=(50, 34, 20, 160), width=1)
        draw_bump.line([(x0, y0), (x1, y1)], fill=40, width=2)

img_floor.paste(seam_img, (0, 0), seam_img)

# Add fine wood pore noise across the entire floor
floor_arr = np.array(img_floor, dtype=np.int16)
noise = np.random.normal(0, 3.5, (H, W, 3))
floor_arr = np.clip(floor_arr + noise, 0, 255).astype(np.uint8)
img_floor = Image.fromarray(floor_arr)

# Soften bump slightly so normal map isn't excessively harsh
img_bump = img_bump.filter(ImageFilter.GaussianBlur(radius=0.6))

os.makedirs('assets', exist_ok=True)
floor_path = 'assets/herringbone_floor.jpg'
bump_path = 'assets/herringbone_bump.jpg'
img_floor.save(floor_path, 'JPEG', quality=94)
img_bump.save(bump_path, 'JPEG', quality=90)
print(f"Saved {floor_path} and {bump_path}")


# -------------------------------------------------------------------------
# 2. WHITE/CREAM SHAGGY BOUCLÉ WOOL RUG (1024 x 1024 RGBA)
# -------------------------------------------------------------------------
rug_size = 1024
rug_img = Image.new('RGBA', (rug_size, rug_size), (0, 0, 0, 0))
rug_bump = Image.new('L', (rug_size, rug_size), 128)
rug_draw = ImageDraw.Draw(rug_img)
rug_bump_draw = ImageDraw.Draw(rug_bump)

cx, cy = rug_size // 2, rug_size // 2
main_r = 455  # Main rug disc radius

# Soft cream wool color tones
wool_base = (248, 245, 238)      # Soft warm ivory
wool_shade = (230, 222, 208)     # Shadow in tufts
wool_highlight = (255, 253, 248) # Catch-light on fiber tips

# 1. Base solid plush wool circle
for r in range(main_r, 0, -2):
    frac = r / main_r
    col = (
        int(wool_base[0] * (0.97 + 0.03 * frac)),
        int(wool_base[1] * (0.97 + 0.03 * frac)),
        int(wool_base[2] * (0.96 + 0.04 * frac)),
        255
    )
    rug_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

# 2. Dense curly bouclé loops and tufting clusters (30,000 micro-loops)
random.seed(202)
for _ in range(28000):
    rad = math.sqrt(random.random()) * (main_r - 8)
    theta = random.random() * math.pi * 2
    px = cx + rad * math.cos(theta)
    py = cy + rad * math.sin(theta)
    
    loop_r = random.uniform(2.5, 5.5)
    loop_col = random.choice([wool_base, wool_shade, wool_highlight])
    alpha = random.randint(180, 255)
    
    # Draw tiny curved yarn loop
    start_angle = random.uniform(0, 360)
    end_angle = start_angle + random.uniform(160, 280)
    rug_draw.arc(
        [px - loop_r, py - loop_r, px + loop_r, py + loop_r],
        start=start_angle,
        end=end_angle,
        fill=(loop_col[0], loop_col[1], loop_col[2], alpha),
        width=random.randint(1, 2)
    )
    
    # Bump tuft
    b_val = random.randint(100, 220)
    rug_bump_draw.point((int(px), int(py)), fill=b_val)

# 3. Fluffy tufted perimeter fringe extending organically past main_r
# Generates hundreds of soft fibers radiating outward around circumference
num_fringe_tufts = 1600
for i in range(num_fringe_tufts):
    theta = (i / num_fringe_tufts) * math.pi * 2 + random.uniform(-0.005, 0.005)
    tuft_len = random.uniform(12, 38)
    
    r_start = main_r - random.uniform(4, 14)
    r_end = main_r + tuft_len
    
    x_s = cx + r_start * math.cos(theta)
    y_s = cy + r_start * math.sin(theta)
    
    # Slight curl/twist on fringe strand
    perp = theta + math.pi / 2
    curl = random.uniform(-6, 6)
    x_mid = cx + (r_start + tuft_len * 0.55) * math.cos(theta) + curl * math.cos(perp)
    y_mid = cy + (r_start + tuft_len * 0.55) * math.sin(theta) + curl * math.sin(perp)
    x_e = cx + r_end * math.cos(theta) + curl * 1.5 * math.cos(perp)
    y_e = cy + r_end * math.sin(theta) + curl * 1.5 * math.sin(perp)
    
    fiber_col = random.choice([wool_base, wool_shade, wool_highlight])
    f_alpha = random.randint(140, 230)
    rug_draw.line([(x_s, y_s), (x_mid, y_mid), (x_e, y_e)], fill=(fiber_col[0], fiber_col[1], fiber_col[2], f_alpha), width=2)
    
    # In bump
    rug_bump_draw.line([(x_s, y_s), (x_mid, y_mid), (x_e, y_e)], fill=random.randint(160, 240), width=2)

# High-frequency wool pile noise
rug_arr = np.array(rug_img, dtype=np.int16)
r_noise = np.random.normal(0, 4.0, (rug_size, rug_size, 4))
r_noise[:, :, 3] = 0 # Don't noise alpha
rug_arr = np.clip(rug_arr + r_noise, 0, 255).astype(np.uint8)
rug_img = Image.fromarray(rug_arr)

rug_bump = rug_bump.filter(ImageFilter.GaussianBlur(radius=0.7))

shag_path = 'assets/shag_rug.png'
shag_bump_path = 'assets/shag_rug_bump.png'
rug_img.save(shag_path, 'PNG')
rug_bump.save(shag_bump_path, 'PNG')
print(f"Saved {shag_path} and {shag_bump_path}")


# -------------------------------------------------------------------------
# 3. GENERATE JAVASCRIPT EMBEDDED DATA FOR INSTANT ZERO-LATENCY BROWSER LOAD
# -------------------------------------------------------------------------
def to_base64_url(img, fmt='JPEG', **kwargs):
    buf = BytesIO()
    img.save(buf, format=fmt, **kwargs)
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    mime = 'image/png' if fmt == 'PNG' else 'image/jpeg'
    return f"data:{mime};base64,{b64}"

floor_b64 = to_base64_url(img_floor, 'JPEG', quality=92)
floor_bump_b64 = to_base64_url(img_bump, 'JPEG', quality=88)
shag_b64 = to_base64_url(rug_img, 'PNG')
shag_bump_b64 = to_base64_url(rug_bump, 'PNG')

js_content = f"""// Auto-generated 3D Studio Production Textures (Herringbone Parquet Floor & White Shag Rug)
window.WOOBI_HERRINGBONE_FLOOR_DATA = "{floor_b64}";
window.WOOBI_HERRINGBONE_BUMP_DATA = "{floor_bump_b64}";
window.WOOBI_SHAG_RUG_DATA = "{shag_b64}";
window.WOOBI_SHAG_RUG_BUMP_DATA = "{shag_bump_b64}";
"""

with open('assets/studio-textures-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Saved assets/studio-textures-data.js successfully.")
print("Texture generation complete!")

