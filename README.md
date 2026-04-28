# Sora Japan — Landing Page

Trang web chính thức của **Công ty Cổ phần Quốc tế Sora Japan** (`sorajapan.edu.vn`) — đơn vị tư vấn du học Nhật Bản, tuyển dụng kỹ sư + thực tập sinh + Tokutei, và đào tạo tiếng Nhật.

> Designed by [danaexperts.com](https://danaexperts.com)

---

## Quick links

| Mục | Đường dẫn |
|---|---|
| Production | <https://sorajapan.edu.vn> |
| Sitemap | `/sitemap.xml` |
| Form backend | `google-apps-script/Code.gs` (deploy hướng dẫn trong `google-apps-script/DEPLOY-GUIDE.md`) |
| Analytics | GA4 ID `G-PMXJ7W8WCY` (cấu hình trong `scripts.js` line ~16) |
| reCAPTCHA | v3, site key trong `scripts.js` line ~28 |

---

## Tech stack

- **HTML5 / CSS3** — vanilla, không build step, không framework
- **Vanilla JavaScript** — module pattern (IIFE), no jQuery
- **CSS Variables** — design tokens cho theme Japanese Heritage Modern
- **Google Fonts** — Plus Jakarta Sans + Fraunces + Shippori Mincho
- **PapaParse 5.4.1** — CSV parsing cho job listings widget (CDN)
- **reCAPTCHA v3** — chống spam form
- **Google Apps Script** — backend nhận form submit + ghi vào Google Sheet
- **Google Analytics 4** — tracking
- **Schema.org JSON-LD** — SEO rich snippets (BreadcrumbList, Service, Organization, FAQPage)

---

## Folder structure

```
sorajapan/
├── index.html                 ← home
├── styles.css                 ← stylesheet chính (~5900 dòng, tất cả layer)
├── scripts.js                 ← JS chính (~1480 dòng, nhiều IIFE module)
├── sitemap.xml                ← 51 URLs hierarchical
├── robots.txt
├── manifest.json              ← PWA manifest
├── case-study.html            ← case studies tổng hợp
├── tin-tuc.html               ← danh sách bài tin tức
├── tin-tuc-detail.html        ← detail bài tin tức (template)
├── quotation.html             ← bảng giá
├── admin.html                 ← form quản trị nội bộ
│
├── du-hoc/                    ← Du học Nhật Bản (6 lộ trình)
│   ├── index.html             ← hub: comparison table + cards + FAQ
│   ├── tu-tuc.html            ← du học tự túc
│   ├── du-bi.html             ← dự bị Đại học
│   ├── chuyen-doi-visa.html   ← chuyển đổi visa
│   ├── bong-bao-yomiuri.html  ← học bổng báo Yomiuri
│   ├── bong-dieu-duong.html   ← học bổng điều dưỡng
│   └── bong-nha-hang-zensho.html
│
├── ky-su/                     ← Kỹ sư N2 visa Engineer (5 ngành)
│   ├── index.html             ← hub: industries grid + comparison + process + FAQ
│   ├── cntt.html              ← Kỹ sư CNTT
│   ├── co-khi.html            ← Cơ khí / Tự động hóa
│   ├── dien.html              ← Điện / Điện tử
│   ├── xay-dung.html          ← Xây dựng
│   └── kinh-te.html           ← Kinh tế / Logistics
│
├── tieng-nhat/                ← Đào tạo tiếng Nhật Shinjigen
│   ├── index.html             ← FAQ + 3 cấp độ
│   ├── basic.html             ← Shinjigen Basic (N5-N4)
│   ├── intermediate.html      ← Shinjigen Intermediate (N3)
│   └── master.html            ← Shinjigen Master (N2-N1)
│
├── dieu-duong/                ← Điều dưỡng Tokutei Kaigo
│   └── index.html             ← FAQ
│
├── doi-tac/                   ← Đối tác y tế (Care21, Nichii, etc.)
│   ├── index.html             ← hub
│   ├── care21.html
│   ├── hokuyuukai.html
│   ├── nichii.html
│   ├── seichoukai.html
│   └── tums.html
│
├── truong/                    ← 24 trường Nhật ngữ liên kết
│   ├── asahi.html, ica.html, kuraku.html, sophia.html, ...
│   └── (24 detail pages)
│
├── don-hang-ky-su/            ← Legacy redirect stubs → /ky-su/*
│   ├── index.html             ← redirect /ky-su/index.html
│   ├── cntt.html, cokhi.html, dien.html, xaydung.html, kinhte.html
│   └── assets/js/donhang.js   ← shared JS cho job listings widget
│
├── js/                        ← JS modules ngoài scripts.js
│   ├── related-pages.js       ← auto-inject related cards (cùng category + cross-category)
│   ├── news.js, news-config.js
│   └── admin.js
│
├── images/                    ← all images (webp + fallback jpg/png)
│   └── hero/                  ← hero section images
│
├── google-apps-script/
│   ├── Code.gs                ← form submit handler + Google Sheet writer
│   └── DEPLOY-GUIDE.md
│
└── _archive/                  ← deprecated files (46 redirect stubs cũ + 36 unused images)
```

---

## Trang chính & flow

### 1. Home (`/index.html`)
Sections: Hero (kanji 夢) → About → 4 dịch vụ (Du học, Kỹ sư, Tiếng Nhật, Điều dưỡng) → Đối tác → Cases → Video Testimonials → Contact form.

### 2. Du học (`/du-hoc/`)
Hub có **bảng so sánh 6 lộ trình** (chi phí năm đầu, thời gian, JLPT yêu cầu) → 6 detail pages → FAQ accordion 6 câu hỏi → JSON-LD FAQPage schema.

### 3. Kỹ sư (`/ky-su/`)
Hub có **industries grid** 5 ngành + **bảng so sánh lương** (5 năm) + **bảng so sánh chi phí xuất cảnh** + **quy trình 6 bước** + FAQ. Mỗi detail page có hero stats trio (lương 万¥/tháng, JLPT N2, tuổi tối đa).

> ⚠️ **Visa Engineer 2026**: yêu cầu **JLPT N2** (trước đây N3+). Đã update tất cả content + comparison tables.

### 4. Tiếng Nhật (`/tieng-nhat/`)
3 cấp độ Shinjigen Basic / Intermediate / Master + FAQ 6 câu hỏi.

### 5. Điều dưỡng (`/dieu-duong/`)
Tokutei Kaigo + đơn hàng "0 đồng" (Care21, Nichii) + FAQ.

### 6. Đối tác (`/doi-tac/`)
5 đối tác y tế chính + 24 trường Nhật ngữ liên kết (`/truong/`).

### 7. Job listings (`/don-hang-ky-su/`)
Legacy folder. Tất cả `index.html`, `cntt.html`, etc. là **redirect stubs** → `/ky-su/*`. Folder giữ vì JS asset `assets/js/donhang.js` (PapaParse + Google Apps Script API) được embed trong các trang `/ky-su/*` để render live job cards từ CSV.

---

## scripts.js — Module overview

File monolith ~1480 dòng, chia thành nhiều **IIFE** độc lập. Mỗi IIFE tự khởi động trên DOMContentLoaded.

| IIFE | Mục đích |
|---|---|
| Main IIFE | Scroll handler, mobile dropdown logic, magnetic buttons, parallax, text reveal, news loader, admin |
| `injectRecaptcha` | Load reCAPTCHA v3 script khi site key configured |
| `injectGA4` | Load Google Analytics 4 khi ID configured |
| `defensiveNavGuard` | Force navigation cho nav-links anchors (skip mobile dropbtn khi submenu chưa active) |
| `contactModal` | Inject modal liên hệ + capture-phase click handler — rewrite `index.html#contact` href thành `#contact-modal` + open modal trên non-home pages |
| `headerScrolledFailsafe` | Scroll handler dự phòng nếu main IIFE fail |
| `hamburgerFailsafe` | Document-level delegated click handler cho hamburger button — đảm bảo menu luôn mở. Cộng pageshow listener cho bfcache |
| `urgencyBanner` | Auto-inject countdown banner (deadline `30/06/2026`) trên home + 4 service indexes. Live countdown 1s, dismiss → sessionStorage |
| `videoTestimonialLazy` | Lite-youtube pattern — click thumbnail → swap to youtube-nocookie iframe |
| `siteCredit` | Auto-inject "Designed by danaexperts.com" inline beside copyright |

---

## Design tokens

CSS variables trong `:root` (styles.css đầu file):

**Japanese Heritage Modern palette:**
- `--color-primary` (Indigo Ai): `#1E3A5F`
- `--color-accent` (Akane red): `#C8383E`
- `--color-bg-section` (Shironeri ivory): `#FCFAF2`
- `--color-accent-warm` (Kin gold): `#C9A961`

**Typography:**
- `--font-heading`: Plus Jakarta Sans (700/800)
- `--font-body`: Plus Jakarta Sans (400/500/600)
- Decorative: Fraunces (italic), Shippori Mincho (kanji watermarks)

**Effects:**
- `--ease-out` / `--ease-spring` cubic-bezier curves
- `--shadow-1` đến `--shadow-4` shadow elevation
- `--radius-sm/md/lg/full` border radius scale

---

## Configuration

### 1. Google Analytics 4
File: `scripts.js` line ~16
```js
const ANALYTICS = {
  GA4_ID: 'G-PMXJ7W8WCY'
};
```
Đổi thành Measurement ID của bạn nếu fork project.

### 2. reCAPTCHA v3
File: `scripts.js` line ~28
```js
const RECAPTCHA_SITE_KEY = '6Lc-4cIsAAAAAL99ErCCzxAz7pZWaJhwS196Wqll';
```
Site key (public). Secret key dán vào `google-apps-script/Code.gs` (`RECAPTCHA_SECRET`).

### 3. Form backend (Google Apps Script)
File: `scripts.js` line ~90
```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycb.../exec'
};
```
Apps Script project: `google-apps-script/Code.gs`. Deploy hướng dẫn: `google-apps-script/DEPLOY-GUIDE.md`.

### 4. Urgency banner deadline
File: `scripts.js` urgencyBanner IIFE
```js
const DEADLINE = new Date('2026-06-30T23:59:59+07:00').getTime();
const TITLE = 'Kỳ tuyển sinh tháng 10/2026';
```

### 5. Video testimonials
Files: `index.html` + `case-study.html`. Replace `data-yt-id="REPLACE_WITH_VIDEO_ID_X"` với YouTube ID thực tế khi có video.

---

## Development workflow

Project là static HTML — **không có build step**.

```bash
# Local preview
cd sorajapan
python -m http.server 8000
# → http://localhost:8000

# Hoặc dùng VS Code Live Server extension
```

**Edit pattern:**
- HTML: edit trực tiếp file trong từng folder
- CSS: tất cả trong `styles.css` (organized by section comments)
- JS: tất cả trong `scripts.js` (mỗi feature là 1 IIFE độc lập) hoặc `js/*.js` modules

**Deployment:** sync toàn bộ folder lên hosting (cPanel / Vercel / Netlify / static host bất kỳ).

---

## SEO

- **Sitemap**: `sitemap.xml` (51 URLs, weekly changefreq)
- **robots.txt**: allow tất cả + sitemap reference
- **Schema.org JSON-LD**: BreadcrumbList trên mọi page, Service trên 4 service hubs, EducationalOrganization_Partner trên truong/*, Organization_Partner trên doi-tac/*, **FAQPage** trên 4 service indexes (24 questions total)
- **Open Graph + Twitter Card**: meta đầy đủ trên mọi page
- **Canonical**: link rel="canonical" trên mọi page
- **Hreflang**: vi-VN

**Batch SEO injection script**: `batch_seo.py` — inject SEO meta vào HTML files theo manifest. Skip folder `don-hang-ky-su/` (redirect stubs).

---

## Known patterns & quirks

### Mobile menu UX
- Tap parent dropbtn lần 1 → expand submenu (close other dropdowns)
- Tap parent dropbtn lần 2 → navigate parent page
- Tap child anchor → navigate child page
- Active parent indicator: dropbtn turn kim gold + chevron rotate 180°
- z-index: `.nav-links.open` 1020, `.nav-toggle` 1025, urgency banner 1010 (auto-hide khi menu mở)

### Contact button defense-in-depth
Tất cả `<a href="../index.html#contact">` trên non-home pages được **rewrite** thành `<a href="#contact-modal" data-contact-modal="true">` lúc page load → click mở modal liên hệ thay vì navigate về home `#contact` section. MutationObserver re-rewrite cho dynamic content.

### Currency notation
- Lương vạn yên: dùng `XX-XX万¥` format (vd: `20-35万¥` = 200,000-350,000 yên)
- Lương full yen: dùng `¥X,XXX,XXX` format với commas (vd: `¥1,202,000`)
- Lương giờ: `1.113 yên/giờ` (full yen)

### File integrity issues từng gặp
Một số HTML files trước đây bị truncated mid-content (missing `</body></html>` + `<script src="scripts.js">`). Browser auto-close tags nên render được nhưng JS không load → menu broken. Đã fix toàn bộ. Nếu thêm content mới, **đảm bảo file kết thúc với `</body></html>`** và load đầy đủ `<script src="../scripts.js">`.

---

## Recent changelog

**2026-04-26 → 2026-04-28** (current sprint):
- ✅ Visa Engineer N3 → N2 update toàn site (quy định 2026)
- ✅ Internal linking strategy (cross-category links từ du-hoc → trường, ky-su → đơn hàng + N2)
- ✅ Refactor `don-hang-ky-su/` → redirect stubs, merge industry cards vào `/ky-su/index.html`
- ✅ Mobile menu rework: text contrast + 2-tap dropdown UX + delegated hamburger handler + bfcache reset
- ✅ FAQ accordion 24 câu hỏi + Schema.org FAQPage cho 4 service pages
- ✅ Bảng so sánh chi phí + thời gian (du-hoc 6 lộ trình, ky-su 5 ngành)
- ✅ Urgency countdown banner deadline 30/06/2026 (auto-inject)
- ✅ Video testimonials section (lazy YouTube embed) home + case-study
- ✅ Restore truncated `du-hoc/index.html` + `doi-tac/index.html` (root cause hamburger broken)
- ✅ Fix currency unit `XX¥` → `XX万¥` (vạn yên)
- ✅ Replace placeholder personas A/B/C/D/E với tên Việt thực tế + công ty mid-tier
- ✅ Footer credit "Designed by danaexperts.com" inline beside copyright

---

## Liên hệ

- **Hotline**: +84 903 539 537
- **Email**: info@sorajapan.edu.vn
- **Website**: <https://sorajapan.edu.vn>
- **Facebook**: <https://www.facebook.com/61568999725231>
- **Zalo**: <https://zalo.me/0903539537>

---

© 2026 Sora Japan JSC. Bản quyền thuộc về Công ty Cổ phần Quốc tế - Sora Japan.

Designed by [danaexperts.com](https://danaexperts.com)
