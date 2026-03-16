import sys

file_path = r'c:\Users\PC\OneDrive\Documents\WORKSPACE\sorajapan\index.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"File not found: {file_path}")
    sys.exit(1)

# Replace 1
old_desc = "Sora Japan tự hào là đơn vị uy tín hàng đầu tại Đà Nẵng chuyên đào tạo và tư vấn du học, lao động có tay nghề (Kỹ sư, Điều dưỡng, Tokutei) sang Nhật Bản. DU HỌC TỰ TÚC, CHUYỂN ĐỔI VISA, HỌC BỔNG TOÀN PHẦN."
new_desc = "Sora Japan tự hào là đơn vị uy tín hàng đầu tại Việt Nam chuyên đào tạo và tư vấn du học, lao động có tay nghề (Kỹ sư, Điều dưỡng, Tokutei) sang Nhật Bản. DU HỌC TỰ TÚC, CHUYỂN ĐỔI VISA, HỌC BỔNG TOÀN PHẦN."
content = content.replace(old_desc, new_desc)

# Replace 2
old_about = "<strong>SORA JAPAN</strong> là Công ty Cổ phần Quốc tế chuyên tư vấn đào tạo tiếng Nhật, du học Nhật Bản, tuyển dụng lao động có tay nghề cao làm việc tại Nhật Bản, có trụ sở tại Đà Nẵng, hoạt động bền vững từ năm 2018."
new_about = "<strong>SORA JAPAN</strong> là Công ty Cổ phần Quốc tế chuyên tư vấn đào tạo tiếng Nhật, du học Nhật Bản, tuyển dụng lao động có tay nghề cao làm việc tại Nhật Bản, có trụ sở chính tại Hà Nội và mạng lưới chi nhánh toàn quốc, hoạt động bền vững từ năm 2018."
content = content.replace(old_about, new_about)

# Replace 3
old_list = '''                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                  <li>
                    <strong>Hà Nội:</strong> Số 1, Đường Demo, Q. Cầu Giấy
                    <div style="color: var(--color-cta); font-weight: 500; font-size: 14px; margin-top: 4px;">📞 0901 111 222</div>
                  </li>
                  <li>
                    <strong>Đà Nẵng:</strong> Số 2, Đường Demo, Q. Hải Châu
                    <div style="color: var(--color-cta); font-weight: 500; font-size: 14px; margin-top: 4px;">📞 0902 333 444</div>
                  </li>
                  <li>
                    <strong>Hồ Chí Minh:</strong> Số 3, Đường Demo, Q. 1
                    <div style="color: var(--color-cta); font-weight: 500; font-size: 14px; margin-top: 4px;">📞 0903 555 666</div>
                  </li>
                  <li>
                    <strong>Long An:</strong> Số 4, Đường Demo, TP. Tân An
                    <div style="color: var(--color-cta); font-weight: 500; font-size: 14px; margin-top: 4px;">📞 0904 777 888</div>
                  </li>
                  <li>
                    <strong>Osaka:</strong> 1-2-3 Demo Cho, Kita-ku, Osaka
                    <div style="color: var(--color-cta); font-weight: 500; font-size: 14px; margin-top: 4px;">📞 +81 90 1234 5678</div>
                  </li>
                </ul>'''

new_list = '''                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                  <li>
                    <strong>Trụ sở chính:</strong> Số 18A, Ngõ 16 Đỗ Xuân Hợp, Phường Từ Liêm, TP Hà Nội
                  </li>
                  <li>
                    <strong>VP Đà Nẵng:</strong> 372 Diên Hồng, Hoà Xuân, Cẩm Lệ, Đà Nẵng
                  </li>
                  <li>
                    <strong>VP HCM:</strong> Số 32 Nguyễn Thị Nhung, KDC Vạn Phúc, P. Hiệp Bình, TP.HCM
                  </li>
                  <li>
                    <strong>VP Tây Ninh:</strong> A2-37, Đường D1, KDC TRẦN ANH 1 RIVERSIDE, ấp Bến Lức 6, xã Bến Lức, Tỉnh Tây Ninh
                  </li>
                  <li>
                    <strong>VP tại Nhật:</strong> 〒534-0021 大阪府大阪市都島区都島本通3丁目18番4-208号 サニータウン日新
                  </li>
                </ul>'''

old_list_rn = old_list.replace('\n', '\r\n')

if old_list in content:
    content = content.replace(old_list, new_list)
elif old_list_rn in content:
    content = content.replace(old_list_rn, new_list)
else:
    print('Address block not found!')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
