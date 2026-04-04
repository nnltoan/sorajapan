# Plan: Trang Tin tức & Admin CMS — Sora Japan

## 1. Tổng quan giải pháp

Xây dựng hệ thống tin tức/blog cho website Sora Japan gồm 2 phần:

- **Trang public** (`tin-tuc.html`, `tin-tuc-detail.html`): Hiển thị danh sách bài viết và chi tiết bài, tích hợp cùng domain, cùng design system hiện tại.
- **Trang admin** (`admin.html`): Giao diện quản trị Full CMS — thêm/sửa/xóa bài viết, quản lý danh mục, quản lý media, dashboard thống kê.

**Backend**: Google Sheets làm database + Google Apps Script làm REST API + Google Drive làm image storage. Đây là lựa chọn phù hợp vì site hiện tại đã dùng Google Apps Script cho contact form, chi phí = 0, không cần server riêng.

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│                                                      │
│  tin-tuc.html ──── Danh sách bài viết (public)      │
│  tin-tuc-detail.html ── Chi tiết bài viết (public)  │
│  admin.html ────── Trang quản trị (protected)       │
│                                                      │
│  Tất cả dùng: styles.css + scripts.js hiện tại     │
│  + news.css (styles riêng) + news.js (logic riêng) │
│  + admin.css + admin.js                              │
└──────────────────────┬──────────────────────────────┘
                       │ fetch() JSON API
                       ▼
┌─────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT (Web App)            │
│                                                      │
│  doGet(e)  → Đọc bài viết, danh mục, thống kê      │
│  doPost(e) → Tạo/Sửa/Xóa bài, upload ảnh          │
│                                                      │
│  Endpoints (qua parameter ?action=...):              │
│  - getPosts        : Lấy danh sách bài              │
│  - getPost         : Lấy chi tiết 1 bài (by slug)  │
│  - getCategories   : Lấy danh mục                   │
│  - getStats        : Thống kê dashboard              │
│  - createPost      : Tạo bài mới                    │
│  - updatePost      : Cập nhật bài                   │
│  - deletePost      : Xóa bài (soft delete)          │
│  - uploadImage     : Upload ảnh lên Drive            │
│  - manageCategory  : CRUD danh mục                   │
│  - login           : Xác thực admin (đơn giản)      │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  GOOGLE SHEETS   │    │    GOOGLE DRIVE       │
│                  │    │                        │
│  Sheet "Posts"   │    │  Folder "SoraJapan    │
│  Sheet "Cats"    │    │  /NewsImages"          │
│  Sheet "Config"  │    │  → Lưu ảnh bài viết   │
│  Sheet "Media"   │    │  → Public link         │
└──────────────────┘    └──────────────────────┘
```

---

## 3. Data Model (Google Sheets)

### Sheet "Posts" — Bài viết

| Cột | Tên | Kiểu | Mô tả |
|-----|-----|-------|-------|
| A | id | string | UUID tự sinh (timestamp-based) |
| B | title | string | Tiêu đề bài viết |
| C | slug | string | URL-friendly title (auto-generate) |
| D | excerpt | string | Tóm tắt ngắn (150-200 ký tự) |
| E | content | string | Nội dung HTML (từ rich text editor) |
| F | thumbnail | string | URL ảnh đại diện (Google Drive link) |
| G | category | string | Slug danh mục (vd: "du-hoc", "tuyen-dung") |
| H | tags | string | Tags phân cách bằng dấu phẩy |
| I | author | string | Tên tác giả |
| J | status | string | "draft" / "published" / "archived" |
| K | createdAt | string | ISO datetime |
| L | updatedAt | string | ISO datetime |
| M | publishedAt | string | ISO datetime (khi publish) |
| N | viewCount | number | Số lượt xem (tăng mỗi lần getPost) |
| O | featured | boolean | Bài nổi bật (hiện ở vị trí đặc biệt) |

### Sheet "Categories" — Danh mục

| Cột | Tên | Kiểu | Mô tả |
|-----|-----|-------|-------|
| A | id | string | UUID |
| B | name | string | Tên danh mục (vd: "Du học") |
| C | slug | string | URL slug (vd: "du-hoc") |
| D | description | string | Mô tả ngắn |
| E | color | string | Màu badge (hex code) |
| F | order | number | Thứ tự hiển thị |

### Sheet "Media" — Quản lý ảnh

| Cột | Tên | Kiểu | Mô tả |
|-----|-----|-------|-------|
| A | id | string | UUID |
| B | filename | string | Tên file gốc |
| C | driveFileId | string | Google Drive file ID |
| D | url | string | Public URL (thumbnail API) |
| E | size | number | Dung lượng (bytes) |
| F | uploadedAt | string | ISO datetime |
| G | usedIn | string | Post ID đang sử dụng |

### Sheet "Config" — Cấu hình

| Cột | Tên | Kiểu | Mô tả |
|-----|-----|-------|-------|
| A | key | string | Tên config |
| B | value | string | Giá trị |

Các config mặc định: `admin_password`, `posts_per_page`, `site_name`, `drive_folder_id`.

---

## 4. Trang Public — tin-tuc.html

### 4.1 Layout trang danh sách

```
┌─────────────────────────────────────────────┐
│  HEADER (giữ nguyên nav hiện tại)           │
├─────────────────────────────────────────────┤
│  HERO nhỏ: "Tin tức & Hoạt động"           │
│  Breadcrumb: Trang chủ > Tin tức            │
├─────────────────────────────────────────────┤
│  BÀI NỔI BẬT (featured post - card lớn)    │
│  ┌───────────────────┬─────────────────┐    │
│  │   Ảnh lớn         │  Title           │   │
│  │                   │  Excerpt          │   │
│  │                   │  Date · Category  │   │
│  └───────────────────┴─────────────────┘    │
├─────────────────────────────────────────────┤
│  BỘ LỌC: [Tất cả] [Du học] [Tuyển dụng]   │
│           [Tiếng Nhật] [Đời sống] [...]     │
├─────────────────────────────────────────────┤
│  DANH SÁCH BÀI (grid 3 cột desktop)        │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │ Ảnh │ │ Ảnh │ │ Ảnh │                   │
│  │Title│ │Title│ │Title│                   │
│  │Date │ │Date │ │Date │                   │
│  └─────┘ └─────┘ └─────┘                   │
│                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │ ... │ │ ... │ │ ... │                   │
│  └─────┘ └─────┘ └─────┘                   │
├─────────────────────────────────────────────┤
│  PAGINATION: ← 1 2 3 ... 10 →              │
├─────────────────────────────────────────────┤
│  FOOTER (giữ nguyên)                        │
└─────────────────────────────────────────────┘
```

### 4.2 Layout trang chi tiết — tin-tuc-detail.html

```
┌─────────────────────────────────────────────┐
│  HEADER                                      │
├─────────────────────────────────────────────┤
│  Breadcrumb: Trang chủ > Tin tức > [Title]  │
├─────────────────────────────────────────────┤
│  ┌──────────────────────┬──────────────┐    │
│  │  ARTICLE (70%)       │ SIDEBAR (30%)│    │
│  │                      │              │    │
│  │  Category badge      │ TIN MỚI NHẤT│    │
│  │  H1: Title           │ ┌──────────┐│    │
│  │  Meta: Date · Author │ │ Mini card ││    │
│  │  Hero image          │ │ Mini card ││    │
│  │                      │ │ Mini card ││    │
│  │  --- Content ---     │ │ Mini card ││    │
│  │  (rendered HTML)     │ └──────────┘│    │
│  │                      │              │    │
│  │  Tags: #du-hoc ...   │ DANH MỤC    │    │
│  │                      │ · Du học     │    │
│  │  Share buttons       │ · Tuyển dụng │    │
│  │  (Zalo, FB, Copy)   │ · Tiếng Nhật │    │
│  └──────────────────────┴──────────────┘    │
├─────────────────────────────────────────────┤
│  TIN TỨC LIÊN QUAN (grid 3 cards)          │
│  (cùng category, gần nhất, trừ bài hiện tại)│
├─────────────────────────────────────────────┤
│  FOOTER                                      │
└─────────────────────────────────────────────┘
```

Trên mobile, sidebar chuyển xuống dưới article.

---

## 5. Trang Admin — admin.html

### 5.1 Xác thực

Sử dụng cơ chế đơn giản: password lưu trong Sheet "Config", nhập password → lưu vào `sessionStorage`. Mỗi request gửi kèm password hash. Apps Script kiểm tra trước khi xử lý.

Lưu ý: đây không phải bảo mật cấp cao, nhưng đủ cho nhu cầu quản trị nội bộ. Nếu cần nâng cấp sau có thể chuyển sang Google OAuth.

### 5.2 Layout Admin

```
┌─────────────────────────────────────────────┐
│  ADMIN HEADER: Logo · "Quản trị Sora Japan" │
│                             [Đăng xuất]      │
├──────────┬──────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                    │
│          │                                   │
│ Dashboard│  (Thay đổi theo menu active)     │
│ Bài viết │                                   │
│ Danh mục │                                   │
│ Media    │                                   │
│ Cài đặt │                                   │
│          │                                   │
│ ──────── │                                   │
│ ← Về    │                                   │
│   trang  │                                   │
│   chủ    │                                   │
└──────────┴──────────────────────────────────┘
```

### 5.3 Các màn hình Admin

**Dashboard:**
- Tổng số bài viết (published / draft)
- Tổng lượt xem
- Bài viết gần nhất
- Biểu đồ đơn giản (bài/tháng)

**Quản lý bài viết:**
- Bảng danh sách: Title · Category · Status · Date · Views · Actions
- Bộ lọc: theo status, category
- Tìm kiếm theo title
- Nút "Thêm bài viết mới"

**Form thêm/sửa bài viết:**
- Input: Title (auto-generate slug)
- Select: Category
- Input: Tags (comma-separated hoặc tag input)
- Upload: Thumbnail (kéo thả hoặc chọn file → upload lên Drive)
- Rich Text Editor: Nội dung bài (dùng **Quill.js** — lightweight, miễn phí, hỗ trợ upload ảnh inline)
- Textarea: Excerpt (hoặc auto-generate từ content)
- Toggle: Featured
- Select: Status (Draft / Published)
- Buttons: [Lưu nháp] [Xuất bản] [Xem trước]

**Quản lý danh mục:**
- CRUD đơn giản: Name, Slug, Color, Order
- Inline edit hoặc modal

**Quản lý Media:**
- Grid view ảnh đã upload
- Upload mới (kéo thả)
- Xóa ảnh
- Copy URL

**Cài đặt:**
- Đổi mật khẩu admin
- Posts per page
- Cấu hình khác

---

## 6. Google Apps Script — API Endpoints

### 6.1 Cấu trúc Code.gs

```
Code.gs
├── doGet(e)          → Router cho GET requests
├── doPost(e)         → Router cho POST requests
├── auth(password)    → Kiểm tra password
│
├── // POSTS
├── getPosts(page, category, status)
├── getPost(slug)
├── createPost(data)
├── updatePost(id, data)
├── deletePost(id)
│
├── // CATEGORIES
├── getCategories()
├── manageCategory(action, data)
│
├── // MEDIA
├── uploadImage(base64, filename)
├── deleteImage(driveFileId)
├── getMedia(page)
│
├── // STATS
├── getStats()
│
├── // UTILS
├── generateSlug(title)
├── generateId()
└── getConfig(key)
```

### 6.2 Lưu ý kỹ thuật

- **CORS**: Apps Script Web App tự xử lý CORS khi deploy "Anyone" access.
- **Image upload**: Encode ảnh thành base64 ở client → gửi qua POST → Apps Script decode → tạo file trong Google Drive folder → trả về public URL dạng `https://drive.google.com/thumbnail?id=FILE_ID&sz=w800`.
- **Pagination**: Truyền `page` + `limit` → Apps Script slice array trả về, kèm `totalPages`.
- **Soft delete**: Không xóa row, chỉ đổi status → "archived".
- **Content caching**: Phía client cache response 5 phút (sessionStorage) để giảm request.

---

## 7. Lựa chọn thư viện

| Thư viện | Mục đích | CDN |
|----------|----------|-----|
| **Quill.js 2.x** | Rich text editor cho admin | cdnjs |
| **DOMPurify** | Sanitize HTML content trước khi render | cdnjs |
| Không dùng framework | Giữ consistent với site hiện tại (vanilla JS) | — |

Quill.js được chọn vì: nhẹ (~40KB gzip), miễn phí hoàn toàn, dễ custom toolbar, hỗ trợ image embed, đã được Slack/LinkedIn/Figma sử dụng.

---

## 8. File structure mới

```
sorajapan/
├── index.html              (cập nhật link "Tin tức" trong nav)
├── tin-tuc.html            ← MỚI: trang danh sách tin tức
├── tin-tuc-detail.html     ← MỚI: trang chi tiết bài viết
├── admin.html              ← MỚI: trang quản trị
├── css/
│   ├── news.css            ← MỚI: styles cho trang tin tức
│   └── admin.css           ← MỚI: styles cho trang admin
├── js/
│   ├── news.js             ← MỚI: logic trang tin tức public
│   └── admin.js            ← MỚI: logic trang admin
├── scripts.js              (giữ nguyên, dùng chung)
├── styles.css              (giữ nguyên, dùng chung)
└── ... (các file hiện tại giữ nguyên)
```

---

## 9. Kế hoạch triển khai (theo thứ tự)

### Phase 1: Backend (Google Apps Script + Sheets)
1. Tạo Google Sheet mới với 4 sheet (Posts, Categories, Media, Config)
2. Viết Apps Script: doGet/doPost router, auth, CRUD posts
3. Viết Apps Script: CRUD categories, image upload, stats
4. Deploy Web App, test API bằng Postman/browser
5. Seed data mẫu (3-5 bài viết, 4-5 danh mục)

### Phase 2: Trang Public
6. Tạo `tin-tuc.html` — danh sách tin tức với fetch từ API
7. Tạo `tin-tuc-detail.html` — chi tiết bài viết + sidebar + tin liên quan
8. Tạo `news.css` — styles riêng, reuse design tokens từ styles.css
9. Tạo `news.js` — fetch data, render, pagination, filter by category
10. Cập nhật nav trong tất cả pages: link "Tin tức" → `tin-tuc.html`

### Phase 3: Trang Admin
11. Tạo `admin.html` — layout sidebar + router (SPA-like bằng vanilla JS)
12. Tạo màn hình login
13. Tạo màn hình Dashboard
14. Tạo màn hình danh sách bài viết + search/filter
15. Tạo form thêm/sửa bài viết + tích hợp Quill.js editor
16. Tạo màn hình quản lý danh mục
17. Tạo màn hình quản lý media (upload, grid view, xóa)
18. Tạo màn hình cài đặt

### Phase 4: Polish & Test
19. Responsive test (mobile/tablet/desktop) cho trang public + admin
20. SEO: meta tags, Open Graph cho trang tin tức
21. Loading states, error states, empty states
22. Test CRUD end-to-end
23. Tối ưu: lazy load ảnh, skeleton loading, cache

---

## 10. Hạn chế & lưu ý khi dùng Google Sheets làm CMS

| Hạn chế | Mức độ ảnh hưởng | Giải pháp |
|---------|-------------------|-----------|
| Giới hạn 10 triệu cells | Thấp (blog nhỏ, ~1000 bài = vẫn ổn) | Không cần lo trong 2-3 năm đầu |
| Apps Script quota: 20,000 URL fetch/ngày | Trung bình | Client-side cache, lazy load |
| Tốc độ response ~1-3 giây | Trung bình | Cache response, skeleton loading |
| Không có real-time update | Thấp | Không cần cho blog |
| Bảo mật admin đơn giản | Trung bình | Đủ cho nội bộ, nâng cấp OAuth sau nếu cần |
| Image qua Google Drive có thể bị rate limit | Trung bình | Dùng thumbnail API, cache browser |

---

## 11. Nguồn tham khảo

- [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [Build a Blog CMS with Google Sheets — freeCodeCamp](https://www.freecodecamp.org/news/use-google-sheets-and-google-apps-script-to-build-a-blog-cms-c2eab3fb0b2b/)
- [Google Sheets as Headless CMS — OpenReplay](https://blog.openreplay.com/build-a-blog-with-google-sheets-as-a-headless-cms/)
- [Spreadsheet as CMS — Sheet2API](https://sheet2api.com/spreadsheet-as-cms/)
- [Google Sheets Limits — RowZero](https://rowzero.com/blog/google-sheets-limits)
- [Quill.js — Rich Text Editor](https://quilljs.com/)
- [Which Rich Text Editor in 2025 — Liveblocks](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025)
- [File Upload via Apps Script doPost](https://tanaikech.github.io/2017/02/05/file-upload-using-dopost-on-google-web-apps/)
- [Turning Google Sheets into JSON API](https://minsoehan.com/tech/google-sheets-simple-json-api/)
