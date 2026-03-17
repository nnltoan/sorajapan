# Goal Description
The goal is to update the Sora Japan website menu structure to match a new design and generate detailed pages for each menu item, extracting content from several provided Word documents. For items without a specific document, placeholder content will be generated.

## User Review Required
> [!IMPORTANT]
> The image does not specifically list "Du học vừa học vừa làm", but you provided a document for it (`SORA - TT CHƯƠNG TRÌNH DU HỌC VỪA HỌC VỪA LÀM.docx`). I will add this as a sub-menu item under "Du học". Please confirm if this is acceptable.
> 
> Also, changing the top-level menu from `Giới thiệu | Dịch vụ ...` to `Du học | Kỹ sư | Đào tạo tiếng Nhật` requires implementing a dropdown menu (CSS/HTML) on all pages. I will add dropdown styling to [styles.css](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/styles.css).

## Proposed Changes

### Global Navigation UI
Implementation of dropdown navigation in [styles.css](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/styles.css) and all HTML files.

#### [MODIFY] [styles.css](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/styles.css)
- Add `.dropdown` and `.dropdown-content` classes to support the new desktop and mobile dropdown menu.

#### [MODIFY] [index.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/index.html)
- Change `<nav class="nav-links">` to reflect the new structure:
  - Trang chủ
  - Du học (Dropdown)
  - Kỹ sư (Dropdown)
  - Đào tạo tiếng Nhật (Dropdown)
  - Đối tác
  - Case Study
  - Tin tức (New, linking to `#`)
  - Liên hệ

#### [MODIFY] [service-du-hoc.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/service-du-hoc.html) (and others)
- Update navigation header in existing pages to match the new global menu.

---

### Detail Pages - Du Học Component
Extract content from the respective [.txt](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/drive-download-20260317T150509Z-1-001/SORA%20-%20H%E1%BB%8CC%20B%E1%BB%94NG%20B%C3%81O.txt) files to build tailored detailed HTML pages based on the [service-du-hoc.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/service-du-hoc.html) template layout.

#### [NEW] [du-hoc-bong-dieu-duong.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-bong-dieu-duong.html)
- Content from `SORA - DH HỌC BỔNG ĐIỀU DƯỠNG.txt`

#### [NEW] [du-hoc-bong-bao-yomiuri.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-bong-bao-yomiuri.html)
- Content from `SORA - HỌC BỔNG BÁO.txt`

#### [NEW] [du-hoc-bong-nha-hang-zensho.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-bong-nha-hang-zensho.html)
- Content from `SORA - HỌC BỔNG NHÀ HÀNG ZENSHO.txt`

#### [NEW] [du-hoc-tu-tuc.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-tu-tuc.html)
- Content merged from `SORA - THÔNG BÁO TUYỂN SINH DU HỌC NHẬT BẢN THÁNG 1O.2026.txt` and `SORA - TT CHƯƠNG TRÌNH DU HỌC VỪA HỌC VỪA LÀM.txt`

#### [NEW] [du-hoc-du-bi.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-du-bi.html)
- Content merged from `SORA - TT CHƯƠNG TRÌNH DU HỌC DỰ BỊ DẠI HỌC.txt`

#### [NEW] [du-hoc-chuyen-doi-visa.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/du-hoc-chuyen-doi-visa.html)
- Content merged from `DH CHUYỂN ĐỔI VISA KỸ SƯ.txt`, `DH CHUYỂN ĐỔI VISA KỸ THUẬT.txt`, and `TUYỂN SINH CĐ Ô TÔ.txt`

---

### Detail Pages - Placeholder Content
These sub-menus do not have accompanying Word files, so I will copy the layout and create temporary text (Lorem Ipsum mixed with some generic Vietnamese context) for:

#### [NEW] Kỹ sư Category
- `ky-su-cntt.html`, `ky-su-co-khi.html`, `ky-su-xay-dung.html`, `ky-su-dien.html`, `ky-su-kinh-te.html`

#### [NEW] Đào tạo tiếng Nhật Category
- `tieng-nhat-so-cap.html`, `tieng-nhat-n5.html`, `tieng-nhat-n4.html`, `tieng-nhat-n3.html`, `tieng-nhat-n2.html`

## Verification Plan

### Manual Verification
1. I will open [index.html](file:///c:/Users/PC/OneDrive/Documents/WORKSPACE/sorajapan/index.html) in the browser subagent to visually confirm the new menu layout and hover dropdown functionality.
2. I will click on "Du học bổng báo Yomiuri" and verify that it routes properly and displays the correctly formatted content from the docx file.
3. The user can open any of the newly created pages locally to ensure the content matches their expectations and the overarching theme is preserved.
