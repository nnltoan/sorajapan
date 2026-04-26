# Commit Instructions

Bash mount của Cowork session bị giới hạn không thao tác được `.git/`, nên cần chạy git commands trực tiếp từ terminal Windows.

## Bước 1: Mở terminal (PowerShell / Git Bash) và cd đến project

```powershell
cd C:\Users\PC\OneDrive\Documents\WORKSPACE\sorajapan
```

## Bước 2: Xóa stale lock file (nếu có)

```powershell
del .git\index.lock 2>$null
del .git\index.lock.del1 2>$null
del .git\index.lock.del2 2>$null
```

## Bước 3: Stage + commit + push

```powershell
git status

# Nếu OK, stage all
git add -A

# Commit với message đầy đủ
git commit -m "feat(ui): Japanese Heritage Modern redesign + breakthrough animations + nav fixes" -m "
MAJOR UI OVERHAUL:
- New Japanese Heritage palette (Indigo Ai, Akane red, Shironeri ivory, Kin gold)
- Typography: Plus Jakarta Sans + Fraunces (Vietnamese support) + Shippori Mincho
- 5-tier layered shadow system with primary/accent/gold glow variants
- Spacing scale tokens, motion tokens, gradient presets

BREAKTHROUGH ANIMATIONS:
- Hero entrance choreography (cascade: BG zoom + badge drop + title unfurl + button pop + stats slide + floating fly-in)
- Cursor spotlight on hero (mouse-follow radial gradient with mix-blend screen)
- Animated gradient mesh blobs in hero BG (3 drift loops 18-26s)
- Counter reel glitch effect with burst glow on completion
- SVG squiggle underline draw on accent words
- Kanji watermark breathing + slow tilt + cursor reactivity
- Card reveal with scale + rotateX + blur (View Timeline API)
- Wave SVG section dividers between Problems/Partners
- Scroll-velocity reactive marquee (1x to 2.8x speed)
- Magnetic buttons with cursor follow
- Section title decrypt glitch on first reveal
- Top scroll progress bar gradient (indigo → red → gold)

SUBPAGE HERO UNIFICATION:
- All .news-hero, .service-detail-hero, .page-hero, .hero-partners use same indigo gradient bg
- Title white ivory with optional gold gradient on <em> keyword
- Eyebrow tag with gold border + backdrop blur
- Wave dot pattern + top vignette
- Removed bilingual JP subtitles (i18n readiness) — kept kanji watermarks (decorative)

PARTNER PAGE FIXES (customer feedback 25/04/2026):
- 'Nhật Ngữ Asahi' → 'Học viện Quốc tế Asahi'
- 'MUSASHI URA' → 'Musashi Urawa'
- 'tu nghiệp' → 'du học' (tieng-nhat content)
- Jin Tokyo: image jin-tokyo.webp + link https://jintokyo.com/
- Tokyo Yohoku, Kyoritsu, Sophia: updated correct images
- 'Nhật' dấu nặng now renders correctly (letter-spacing relaxed, line-height +)

NAV MENU CONSISTENCY:
- Active nav highlight via JS auto-detect URL category
- Red akane underline under active item (works for direct links + dropbtn)
- Marquee announcement bar synced across all subpage indexes
- 'Liên hệ' menu item removed from all pages (consistent with home)
- Tư vấn miễn phí button arrow SVG added to subpage indexes
- Đối tác link self-loops fixed
- Defensive nav guard JS forces page navigation (capture-phase) — prevents anchor-scroll on category links

NEW FEATURES:
- 'Related pages' auto-injected on all detail pages (5 categories: du-hoc/ky-su/tieng-nhat/truong/doi-tac)
- Manifest-based — new detail pages auto-show
- Fancy card hover with mouse-tracking glow spot
- 3D tilt on service/case/floating cards

CLEANUP:
- 46 redirect-stub HTMLs moved to _archive/
- 36 unused images (~7.8 MB) moved to _archive/
- Created .gitignore (archive/, backups/, OS noise/, Python cache/, *.ini)
- Created _archive/README.md with restore instructions

FORM UX:
- Floating-label inputs (.field-float)
- 1.5px borders + 4px focus glow indigo
- Submit button gradient akane + spring transitions
- Animated success checkmark

ACCESSIBILITY:
- prefers-reduced-motion killswitch
- focus-visible 2px akane outline + 3px offset
- WCAG-friendly contrast (text on dark hero ivory, on light bg deep kon)

FILES:
- styles.css: +1100 lines (modernization + breakthrough + subpage hero + related)
- scripts.js: +400 lines (animations + active nav + defensive nav guard)
- index.html: kanji watermarks, eyebrow tags, em accent keywords, breakthrough mesh element
- 42 detail pages: scripts.js + related-pages.js loaded
- 5 subpage indexes: marquee bar synced + nav cleanup + Đối tác fix
- New: js/related-pages.js (manifest + auto-inject related cards)
- 2 new images: jin-tokyo.webp, 杏林国際語学院株式会社.webp (Sophia)
"

# Push lên GitHub
git push origin main
```

## Bước 4: Xác nhận trên GitHub

Mở https://github.com/nnltoan/sorajapan để xem commit mới.

## Lưu ý

- `_archive/` folder không được commit (đã có trong `.gitignore`)
- Nếu còn lock files `.git/index.lock.del1`, `.git/index.lock.del2` thì xóa thủ công
- Nếu push bị reject, có thể cần `git pull --rebase origin main` trước
