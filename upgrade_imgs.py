"""
Upgrade <img src="images/X.jpg|png"> to <picture><source type=webp><img ...></picture>
Also add loading="lazy" to images that are not above-the-fold (hero images excluded).
Only touches images that have a matching .webp sibling.
"""
import re
from pathlib import Path

ROOT = Path("/sessions/gifted-great-rubin/mnt/sorajapan")

# Find which images have webp siblings
webp_available = set()
for p in (ROOT / "images").rglob("*.webp"):
    webp_available.add(p.relative_to(ROOT).as_posix().lower())

# Only process these HTML files (skip venv, skip admin/tin-tuc-detail to avoid risk)
def should_process(rel):
    if rel.startswith((".venv/",".claude/",".agent/",".git/","node_modules/")): return False
    return rel.endswith(".html")

# Regex matches <img ...src="images/xxx.jpg|png|jpeg|JPG" ...>
IMG_RE = re.compile(
    r'(<img\b[^>]*?\bsrc=["\'])(\.\./)?(images/[^"\']+?\.(?:jpe?g|png|JPG|JPEG|PNG))(["\'][^>]*?/?>)',
    re.IGNORECASE | re.DOTALL
)

def build_picture(full_match, src_prefix, path_prefix, img_path, src_suffix):
    """Wrap the matched <img> in a <picture> with webp source + add loading=lazy if missing."""
    # Generate webp path
    # strip extension, add .webp
    base = re.sub(r'\.(jpe?g|png|JPG|JPEG|PNG)$', '.webp', img_path, flags=re.IGNORECASE)
    # Check if webp exists (case insensitive)
    if base.lower() not in webp_available:
        return full_match  # no webp → leave unchanged

    # The full img tag
    img_tag = full_match
    # Add loading="lazy" if missing AND not a hero image (hero images should be eager)
    is_hero = 'hero/' in img_path.lower() and ('hero-slider' in full_match.lower() or 'hero-bg' in full_match.lower())
    if 'loading=' not in img_tag and not is_hero:
        # insert loading="lazy" decoding="async" before the closing >
        img_tag = re.sub(r'(/?>)$', ' loading="lazy" decoding="async"\\1', img_tag, count=1)

    # Optional path_prefix (e.g. "../")
    p = path_prefix or ''
    webp_src = f'{p}{base}'

    return f'<picture><source srcset="{webp_src}" type="image/webp">{img_tag}</picture>'

def process_file(path, rel):
    text = path.read_text(encoding="utf-8")
    # Skip if already processed
    new_text = text
    count = 0
    for m in list(IMG_RE.finditer(text)):
        full = m.group(0)
        src_prefix, path_prefix, img_path, src_suffix = m.group(1), m.group(2), m.group(3), m.group(4)
        replacement = build_picture(full, src_prefix, path_prefix, img_path, src_suffix)
        if replacement != full:
            # Check we haven't already wrapped (defensive)
            # Look for '<picture>' immediately before full in text
            idx = new_text.find(full)
            if idx == -1: continue
            before = new_text[max(0,idx-20):idx]
            if '<picture>' in before and '</picture>' not in before:
                continue  # already wrapped
            new_text = new_text.replace(full, replacement, 1)
            count += 1
    if new_text != text:
        path.write_bytes(new_text.encode("utf-8"))
    return count

total_files_changed = 0
total_imgs_upgraded = 0
for p in sorted(ROOT.rglob("*.html")):
    rel = p.relative_to(ROOT).as_posix()
    if not should_process(rel): continue
    n = process_file(p, rel)
    if n:
        total_files_changed += 1
        total_imgs_upgraded += n
        print(f"  [{n:2d} upgr] {rel}")

print(f"\n=== Summary ===")
print(f"  HTML files changed: {total_files_changed}")
print(f"  <img> tags upgraded to <picture>: {total_imgs_upgraded}")
