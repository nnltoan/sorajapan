import sys
import re

file_path = r'c:\Users\PC\OneDrive\Documents\WORKSPACE\sorajapan\index.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"File not found: {file_path}")
    sys.exit(1)

# Replace 1
content = re.sub(r'Sora Japan tự hào là đơn vị uy tín hàng đầu tại Đà Nẵng chuyên đào tạo', r'Sora Japan tự hào là đơn vị uy tín hàng đầu tại Việt Nam chuyên đào tạo', content)

# Replace 2
content = re.sub(r', có trụ sở tại Đà Nẵng, hoạt động bền vững', r', có trụ sở chính tại Hà Nội và hệ thống chi nhánh toàn quốc, hoạt động bền vững', content)

# Replace 3
ul_start = r'<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">'
ul_end = r'</ul>'
new_ul = '''<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
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

# Use regex to replace everything between ul_start and ul_end (inclusive)
pattern = re.compile(re.escape(ul_start) + r'.*?' + re.escape(ul_end), re.DOTALL)
if pattern.search(content):
    content = pattern.sub(new_ul, content)
    print("Address block replaced!")
else:
    print("Address block not found!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
