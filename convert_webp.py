"""Convert all JPG/JPEG/PNG in images/ to WebP siblings (keep originals)."""
from pathlib import Path
from PIL import Image
import os

ROOT = Path("/sessions/gifted-great-rubin/mnt/sorajapan/images")
SKIP_NAMES = {"logo_transparent.png", "imagelogo.jpg", "imagelogo2.jpg"}
MIN_SIZE_BYTES = 50_000  # Don't bother with files < 50 KB

total_in = 0
total_out = 0
converted = 0
skipped = 0
failed = []

for src in sorted(ROOT.rglob("*")):
    if not src.is_file(): continue
    ext = src.suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png"): continue
    if src.name in SKIP_NAMES:
        skipped += 1
        continue

    dst = src.with_suffix(".webp")

    orig_size = src.stat().st_size
    if orig_size < MIN_SIZE_BYTES:
        skipped += 1
        continue

    # Skip if already exists and is newer
    if dst.exists() and dst.stat().st_mtime > src.stat().st_mtime:
        total_in += orig_size
        total_out += dst.stat().st_size
        continue

    try:
        with Image.open(src) as im:
            # Preserve transparency for PNG → use webp lossless or alpha
            if ext == ".png" and im.mode in ("RGBA", "LA"):
                im.save(dst, "WEBP", quality=85, method=6)
            elif ext == ".png":
                im.convert("RGB").save(dst, "WEBP", quality=85, method=6)
            else:
                im.convert("RGB").save(dst, "WEBP", quality=82, method=6)
        new_size = dst.stat().st_size
        saved_pct = (1 - new_size / orig_size) * 100
        rel = src.relative_to(ROOT)
        print(f"  {rel.as_posix():60s}  {orig_size//1024:5d} KB → {new_size//1024:5d} KB  (-{saved_pct:.0f}%)")
        total_in += orig_size
        total_out += new_size
        converted += 1
    except Exception as e:
        failed.append((str(src), str(e)))

print(f"\n=== Summary ===")
print(f"  Converted:  {converted}")
print(f"  Skipped:    {skipped}")
print(f"  Failed:     {len(failed)}")
if total_in > 0:
    print(f"  Before:     {total_in / 1024 / 1024:.1f} MB")
    print(f"  After:      {total_out / 1024 / 1024:.1f} MB")
    print(f"  Savings:    {(1 - total_out/total_in) * 100:.0f}%  ({(total_in-total_out)/1024/1024:.1f} MB freed)")
for src, err in failed:
    print(f"  FAIL {src}: {err}")
