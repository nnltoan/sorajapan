# Hướng dẫn Deploy Google Apps Script — Sora Japan News CMS

## Bước 1: Tạo Google Sheet

1. Truy cập [Google Sheets](https://sheets.google.com) → Tạo bảng tính mới
2. Đặt tên: **"Sora Japan News CMS"**
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_Ở_ĐÂY]/edit
   https://docs.google.com/spreadsheets/d/1goqsX4WoM6dALboJhgyIod4xazgbNuhcLGFXyRROAlE/edit?usp=drive_link

   ```

## Bước 2: Tạo folder Google Drive cho ảnh

1. Vào [Google Drive](https://drive.google.com) → Tạo folder mới tên **"SoraJapan-NewsImages"**
2. Copy **Folder ID** từ URL khi mở folder:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID_Ở_ĐÂY]
   https://docs.google.com/spreadsheets/d/1goqsX4WoM6dALboJhgyIod4xazgbNuhcLGFXyRROAlE/edit?usp=drive_link
   https://drive.google.com/drive/folders/1rgYpAdScZcvxzaqfU1eraFxIk15zIJ0H?usp=drive_link
   https://drive.google.com/drive/folders/1CNgojYZ1iU426ZVS3pfSGCFZhNJgiYvT?usp=drive_link
   ```

## Bước 3: Tạo Google Apps Script Project

1. Vào Google Sheet vừa tạo → Menu **Extensions** → **Apps Script**
2. Xóa hết code mặc định trong `Code.gs`
3. Copy toàn bộ nội dung file `Code.gs` (trong folder này) vào editor
4. **Quan trọng**: Thay 2 giá trị ở đầu file:
   ```javascript
   const SPREADSHEET_ID = 'paste_spreadsheet_id_vào_đây';
   const DRIVE_FOLDER_ID = 'paste_folder_id_vào_đây';
   ```
5. Nhấn **Ctrl+S** để lưu

## Bước 4: Chạy Setup (tạo sheets + data mẫu)

1. Trong Apps Script editor, chọn function **`setupSheets`** từ dropdown (cạnh nút Run ▶)
2. Nhấn **Run** ▶
3. Lần đầu sẽ hỏi quyền → Nhấn **Review Permissions** → Chọn tài khoản Google → **Advanced** → **Go to [project name] (unsafe)** → **Allow**
4. Kiểm tra Google Sheet: sẽ có 4 tabs mới: Posts, Categories, Media, Config
5. Tab Config có `admin_password` mặc định là `sorajapan2026` — **hãy đổi ngay**

## Bước 5: Deploy Web App

1. Trong Apps Script editor → Nhấn **Deploy** → **New deployment**
2. Nhấn biểu tượng ⚙ → Chọn **Web app**
3. Cấu hình:
   - **Description**: "Sora Japan News CMS API"
   - **Execute as**: **Me** (tài khoản của bạn)
   - **Who has access**: **Anyone**
4. Nhấn **Deploy**
5. Copy **Web App URL** — đây là API endpoint

   ```
   https://script.google.com/macros/s/XXXXXXXXXX/exec
   ```

## Bước 6: Cập nhật Frontend

Mở file `js/news-config.js` trong project website và thay URL:

```javascript
const NEWS_CONFIG = {
  API_URL: 'paste_web_app_url_vào_đây',
  // ...
};
```

## Bước 7: Test API

Mở browser, truy cập:

```
[WEB_APP_URL]?action=getCategories
```

Nếu thấy JSON trả về danh sách categories → API hoạt động OK!

Test thêm:
```
[WEB_APP_URL]?action=getPosts&page=1&limit=5
[WEB_APP_URL]?action=getPost&slug=huong-dan-thu-tuc-du-hoc-nhat-ban-2026
```

---

## Lưu ý quan trọng

### Khi cập nhật code
Mỗi lần sửa `Code.gs`, cần deploy lại:
- **Deploy** → **Manage deployments** → Chọn deployment → **Edit** (icon bút chì) → **Version**: "New version" → **Deploy**

### Email notification khi có form contact mới
Khi khách gửi form, hệ thống tự động:
1. Lưu vào Google Sheet (sheet `Contacts`)
2. **Gửi email notification** tới các địa chỉ trong `NOTIFY_EMAILS` (top of `Code.gs`):
   ```js
   const NOTIFY_EMAILS = ['info@sorajapan.edu.vn', 'nnl.toan@gmail.com'];
   ```
3. Để thêm/đổi recipient: edit array này và **redeploy** (Deploy → New version).

**Lần đầu deploy có email notification cần grant `MailApp` permission:**
- Mở Apps Script editor → chọn function `sendContactNotification` → Run
- Hộp thoại hỏi quyền → **Review permissions** → chọn account → **Allow**
- Sau khi grant 1 lần thì mọi submit form sau đều tự động gửi email không cần thao tác.

**Quota MailApp:**
- Free Google account: 100 emails/day
- Google Workspace: 1,500 emails/day
- Tracking: Apps Script editor → **Executions** xem log gửi/lỗi.

**Test email:**
Submit form trên website thật, hoặc gọi function test trong editor:
```js
function testEmailNotification() {
  sendContactNotification(
    { hoTen: 'Test User', sdt: '0903xxxxxx', email: 'test@example.com', chuongTrinh: 'Du học' },
    'CT-TEST-001',
    'manual_test'
  );
}
```

### Bảo mật
- Đổi `admin_password` trong Sheet Config ngay sau khi setup
- Không chia sẻ Google Sheet cho người không cần thiết
- Web App URL nên giữ kín (chỉ dùng trong code frontend)

### Giới hạn
- Google Apps Script: 6 phút timeout/request, 20,000 URL fetches/ngày
- Google Sheets: tối đa 10 triệu cells (đủ cho ~1000+ bài viết)
- Image upload: Khuyến nghị resize ảnh < 2MB trước khi upload

### Troubleshooting
- **CORS error**: Đảm bảo đã chọn "Anyone" ở Who has access
- **403 Forbidden**: Deploy lại với New version
- **Ảnh không hiển thị**: Kiểm tra Drive folder đã public sharing chưa


| Trường       | Điểm mạnh                | Phù hợp     |
| ------------ | ------------------------ | ----------- |
| KYORITSU     | Hệ thống lớn, hỗ trợ tốt | Học lâu dài |
| Waseda Edu   | Học thuật cao            | Thi đại học |
| Tokyo Yohoku | Ổn định, cân bằng        | Beginner    |
| TOP A21      | Luyện thi EJU            | Học lên     |
| SUN-A OEDO   | Chi phí hợp lý           | Người mới   |